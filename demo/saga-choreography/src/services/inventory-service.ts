import type { InventoryRow, ReservationRow } from '../db/create-db.js';
import { insertOutbox, tryConsumeInbox } from '../db/create-db.js';
import type { JsonStore } from '../db/json-store.js';
import { eventBus } from '../event-bus.js';
import type { DomainEvent } from '../types.js';
import { randomUUID } from 'node:crypto';

export class InventoryService {
  constructor(private readonly store: JsonStore) {
    eventBus.subscribe('order.created', (e) => this.onOrderCreated(e));
    eventBus.subscribe('payment.failed', (e) => this.onPaymentFailed(e));
  }

  private onOrderCreated(event: DomainEvent) {
    if (!tryConsumeInbox(this.store, event.eventId, event.eventType)) {
      console.log(`  [inventory/inbox] SKIP duplicate ${event.eventType}`);
      return;
    }

    const orderId = event.payload.orderId as string;
    const productSku = event.payload.productSku as string;
    const qty = event.payload.qty as number;

    const inventory = this.store.get<InventoryRow>('inventory');
    const item = inventory.find((i) => i.sku === productSku);
    if (!item || item.qty < qty) {
      console.log(`[inventory] ❌ insufficient stock for ${orderId}`);
      return;
    }

    const outEventId = randomUUID();
    const now = new Date().toISOString();

    this.store.transaction(() => {
      item.qty -= qty;
      this.store.get<ReservationRow>('stock_reservations').push({
        order_id: orderId,
        product_sku: productSku,
        qty,
        status: 'reserved',
        created_at: now,
        updated_at: now,
      });

      insertOutbox(this.store, {
        eventId: outEventId,
        eventType: 'stock.reserved',
        aggregateId: orderId,
        payload: {
          orderId,
          productSku,
          qty,
          amount: event.payload.amount,
          forcePaymentFail: event.payload.forcePaymentFail ?? false,
        },
      });
    });

    console.log(`[inventory] ✅ reserved ${qty}x ${productSku} for ${orderId}`);
  }

  private onPaymentFailed(event: DomainEvent) {
    if (!tryConsumeInbox(this.store, event.eventId, event.eventType)) {
      console.log(`  [inventory/inbox] SKIP duplicate ${event.eventType}`);
      return;
    }
    this.compensateRelease(event.payload.orderId as string);
  }

  compensateRelease(orderId: string) {
    const reservations = this.store.get<ReservationRow>('stock_reservations');
    const reservation = reservations.find((r) => r.order_id === orderId);
    if (!reservation || reservation.status === 'released') return;

    const inventory = this.store.get<InventoryRow>('inventory');
    const item = inventory.find((i) => i.sku === reservation.product_sku);
    if (item) item.qty += reservation.qty;

    reservation.status = 'released';
    reservation.updated_at = new Date().toISOString();
    this.store.flush();
    console.log(`[inventory] ↩️  compensate release stock for ${orderId}`);
  }
}

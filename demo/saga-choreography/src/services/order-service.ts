import type { OrderRow } from '../db/create-db.js';
import { insertOutbox, tryConsumeInbox } from '../db/create-db.js';
import type { JsonStore } from '../db/json-store.js';
import { eventBus } from '../event-bus.js';
import type { DomainEvent, PlaceOrderInput } from '../types.js';
import { randomUUID } from 'node:crypto';

export class OrderService {
  constructor(private readonly store: JsonStore) {
    eventBus.subscribe('payment.completed', (e) => this.onPaymentCompleted(e));
    eventBus.subscribe('payment.failed', (e) => this.onPaymentFailed(e));
  }

  placeOrder(input: PlaceOrderInput) {
    const eventId = randomUUID();
    const now = new Date().toISOString();

    this.store.transaction(() => {
      const orders = this.store.get<OrderRow>('orders');
      orders.push({
        id: input.orderId,
        product_sku: input.productSku,
        qty: input.qty,
        amount: input.amount,
        status: 'pending',
        created_at: now,
        updated_at: now,
      });

      insertOutbox(this.store, {
        eventId,
        eventType: 'order.created',
        aggregateId: input.orderId,
        payload: {
          orderId: input.orderId,
          productSku: input.productSku,
          qty: input.qty,
          amount: input.amount,
          forcePaymentFail: input.forcePaymentFail ?? false,
        },
      });
    });

    console.log(`[order] ✅ created ${input.orderId} (pending) + outbox order.created`);
  }

  private onPaymentCompleted(event: DomainEvent) {
    if (!tryConsumeInbox(this.store, event.eventId, event.eventType)) {
      console.log(`  [order/inbox] SKIP duplicate ${event.eventType}`);
      return;
    }

    const orderId = event.payload.orderId as string;
    const orders = this.store.get<OrderRow>('orders');
    const order = orders.find((o) => o.id === orderId && o.status === 'pending');
    if (order) {
      order.status = 'confirmed';
      order.updated_at = new Date().toISOString();
      this.store.flush();
      console.log(`[order] ✅ confirmed ${orderId}`);
    }
  }

  private onPaymentFailed(event: DomainEvent) {
    if (!tryConsumeInbox(this.store, event.eventId, event.eventType)) {
      console.log(`  [order/inbox] SKIP duplicate ${event.eventType}`);
      return;
    }
    this.compensateCancel(event.payload.orderId as string);
  }

  compensateCancel(orderId: string) {
    const orders = this.store.get<OrderRow>('orders');
    const order = orders.find(
      (o) => o.id === orderId && (o.status === 'pending' || o.status === 'confirmed'),
    );
    if (!order) return;

    order.status = 'cancelled';
    order.updated_at = new Date().toISOString();
    this.store.flush();
    console.log(`[order] ↩️  compensate cancel ${orderId}`);
  }
}

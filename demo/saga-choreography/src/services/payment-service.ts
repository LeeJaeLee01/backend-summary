import type { PaymentRow } from '../db/create-db.js';
import { insertOutbox, tryConsumeInbox } from '../db/create-db.js';
import type { JsonStore } from '../db/json-store.js';
import { eventBus } from '../event-bus.js';
import type { DomainEvent } from '../types.js';
import { randomUUID } from 'node:crypto';

export class PaymentService {
  constructor(private readonly store: JsonStore) {
    eventBus.subscribe('stock.reserved', (e) => this.onStockReserved(e));
  }

  private onStockReserved(event: DomainEvent) {
    if (!tryConsumeInbox(this.store, event.eventId, event.eventType)) {
      console.log(`  [payment/inbox] SKIP duplicate ${event.eventType}`);
      return;
    }

    const orderId = event.payload.orderId as string;
    const amount = event.payload.amount as number;
    const forcePaymentFail = Boolean(event.payload.forcePaymentFail);

    if (forcePaymentFail) {
      this.publishFailed(orderId, amount, 'Insufficient funds (demo)');
      return;
    }

    const outEventId = randomUUID();
    const now = new Date().toISOString();

    this.store.transaction(() => {
      this.store.get<PaymentRow>('payments').push({
        order_id: orderId,
        amount,
        status: 'completed',
        created_at: now,
        updated_at: now,
      });

      insertOutbox(this.store, {
        eventId: outEventId,
        eventType: 'payment.completed',
        aggregateId: orderId,
        payload: { orderId, amount },
      });
    });

    console.log(`[payment] ✅ charged ${amount} for ${orderId}`);
  }

  private publishFailed(orderId: string, amount: number, reason: string) {
    const outEventId = randomUUID();
    const now = new Date().toISOString();

    this.store.transaction(() => {
      this.store.get<PaymentRow>('payments').push({
        order_id: orderId,
        amount,
        status: 'failed',
        created_at: now,
        updated_at: now,
      });

      insertOutbox(this.store, {
        eventId: outEventId,
        eventType: 'payment.failed',
        aggregateId: orderId,
        payload: { orderId, amount, reason },
      });
    });

    console.log(`[payment] ❌ failed for ${orderId} — ${reason}`);
  }
}

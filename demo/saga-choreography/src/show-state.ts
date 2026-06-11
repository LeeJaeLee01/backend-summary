import type { InventoryRow, OrderRow, PaymentRow, ReservationRow } from './db/create-db.js';
import type { SagaRuntime } from './services/index.js';

export function printState(rt: SagaRuntime, title: string) {
  console.log(`\n── ${title} ──`);

  const orders = rt.orderStore.get<OrderRow>('orders');
  const stock = rt.inventoryStore.get<InventoryRow>('inventory');
  const reservations = rt.inventoryStore.get<ReservationRow>('stock_reservations');
  const payments = rt.paymentStore.get<PaymentRow>('payments');

  console.log('Orders:       ', orders.length ? orders : '(empty)');
  console.log('Inventory:    ', stock);
  console.log('Reservations: ', reservations.length ? reservations : '(empty)');
  console.log('Payments:     ', payments.length ? payments : '(empty)');
}

import { config } from '../config.js';
import { openInventoryStore, openOrderStore, openPaymentStore } from '../db/create-db.js';
import { OutboxRelay } from '../outbox-relay.js';
import { InventoryService } from './inventory-service.js';
import { OrderService } from './order-service.js';
import { PaymentService } from './payment-service.js';

export type SagaRuntime = {
  orderStore: ReturnType<typeof openOrderStore>;
  inventoryStore: ReturnType<typeof openInventoryStore>;
  paymentStore: ReturnType<typeof openPaymentStore>;
  orderService: OrderService;
  inventoryService: InventoryService;
  paymentService: PaymentService;
  relay: OutboxRelay;
};

export function createRuntime(): SagaRuntime {
  const orderStore = openOrderStore(config.orderDb);
  const inventoryStore = openInventoryStore(config.inventoryDb);
  const paymentStore = openPaymentStore(config.paymentDb);

  const orderService = new OrderService(orderStore);
  const inventoryService = new InventoryService(inventoryStore);
  const paymentService = new PaymentService(paymentStore);

  const relay = new OutboxRelay([
    { name: 'order', store: orderStore },
    { name: 'inventory', store: inventoryStore },
    { name: 'payment', store: paymentStore },
  ]);

  return {
    orderStore,
    inventoryStore,
    paymentStore,
    orderService,
    inventoryService,
    paymentService,
    relay,
  };
}

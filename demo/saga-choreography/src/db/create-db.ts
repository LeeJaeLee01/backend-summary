import { JsonStore } from './json-store.js';

export type OrderRow = {
  id: string;
  product_sku: string;
  qty: number;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type InventoryRow = { sku: string; qty: number };

export type ReservationRow = {
  order_id: string;
  product_sku: string;
  qty: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type OrderStore = JsonStore & {
  orders: OrderRow[];
};

export function openOrderStore(filePath: string): JsonStore {
  return new JsonStore(filePath, { orders: [], outbox: [], processed_events: [] });
}

export function openInventoryStore(filePath: string): JsonStore {
  const store = new JsonStore(filePath, {
    inventory: [{ sku: 'SKU-001', qty: 100 }],
    stock_reservations: [],
    outbox: [],
    processed_events: [],
  });
  return store;
}

export function openPaymentStore(filePath: string): JsonStore {
  return new JsonStore(filePath, { payments: [], outbox: [], processed_events: [] });
}

export function insertOutbox(
  store: JsonStore,
  event: { eventId: string; eventType: string; aggregateId: string; payload: Record<string, unknown> },
) {
  store.insertOutbox(event);
}

export function tryConsumeInbox(store: JsonStore, eventId: string, eventType: string): boolean {
  return store.tryConsumeInbox(eventId, eventType);
}

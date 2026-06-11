export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';
export type ReservationStatus = 'reserved' | 'released';
export type PaymentStatus = 'completed' | 'failed' | 'refunded';

export type DomainEvent = {
  eventId: string;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export type PlaceOrderInput = {
  orderId: string;
  productSku: string;
  qty: number;
  amount: number;
  forcePaymentFail?: boolean;
};

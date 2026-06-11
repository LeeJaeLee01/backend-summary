# Saga Pattern

> **Saga** là chuỗi **local transaction** qua nhiều service — nếu bước sau **fail**, chạy **compensating transaction** (hoàn tác) các bước trước. Thay **2PC** bằng **eventual consistency**.

Liên quan: [index.md](./index.md) · [outbox.md](./outbox.md) · [inbox.md](./inbox.md) · [transaction-consistency.md](../../database/transaction-consistency.md).

---

## 1. Khái niệm

### 1.1. Vấn đề Saga giải quyết

**Không thể** `BEGIN … COMMIT` xuyên 2 database / 2 microservice:

```
❌ Distributed 2PC — chậm, fragile, ít dùng production

Order DB          Payment DB          Inventory DB
   │                   │                    │
   └── 1 COMMIT? ──────┴────────────────────┘  ← không có ACID chung
```

**Saga** — mỗi service commit **local**; fail giữa chừng → **bù trừ** (compensate):

```
Bước 1: Create Order     ✅ committed
Bước 2: Charge Payment   ❌ failed
        → Compensate: Cancel Order
```

### 1.2. Diagram tổng quát

```
                    ┌─────────────────────────────────────┐
                    │           Saga (luồng đặt hàng)      │
                    └─────────────────────────────────────┘

  [1] Create Order ──► [2] Reserve Stock ──► [3] Charge Payment ──► [4] Ship
         ✅                    ✅                    ❌ fail
         │                     │                     │
         └──── Compensate ◄────┴── Release Stock ◄───┘
              Cancel Order
```

| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| **Saga step** | 1 local transaction + 1 hành động nghiệp vụ |
| **Compensating action** | Hoàn tác step đã thành công (không phải rollback DB magic) |
| **Eventual consistency** | Hệ thống **cuối cùng** nhất quán — có window tạm lệch |

---

## 2. Dùng để làm gì?

| Use case | Saga làm gì |
|----------|-------------|
| **Order → Payment → Inventory** | 3 service, 3 DB — không shared transaction |
| **Booking → Payment → Notification** | Bước sau fail → hủy booking |
| **Onboarding user → provision tenant → send email** | Rollback provision nếu email critical (tùy rule) |
| **Long-running business process** | Nhiều bước async qua ngày |

**Không dùng Saga khi:**

```
❌ Tất cả trong 1 DB — dùng transaction thường
❌ Cần strong consistency tức thì (chuyển tiền realtime hiển thị balance ngay mọi nơi)
❌ Compensate không khả thi (gửi email đã gửi — không “unsend”)
❌ Team nhỏ, monolith — over-engineering
```

---

## 3. Hai kiểu Saga

### 3.1. Choreography — không điều phối viên trung tâm

Mỗi service **tự listen event** và **tự quyết** bước tiếp / compensate:

```
Order Svc:    create order → emit OrderCreated
Inventory Svc: listen OrderCreated → reserve → emit StockReserved
Payment Svc:   listen StockReserved → charge → emit PaymentCompleted
               OR fail → emit PaymentFailed
Order Svc:     listen PaymentFailed → cancel order (compensate)
```

```
┌──────────┐  OrderCreated   ┌──────────┐  StockReserved  ┌──────────┐
│  Order   │ ──────────────► │ Inventory│ ───────────────► │ Payment  │
│  Service │ ◄────────────── │ Service  │                  │ Service  │
└──────────┘  PaymentFailed  └──────────┘                  └──────────┘
```

| Ưu | Nhược |
|----|-------|
| Loose coupling | Khó trace flow |
| Không single point of failure | Event spaghetti nếu nhiều bước |
| Phù hợp 2–4 service | Debug “ai emit gì” khó |

### 3.2. Orchestration — có Saga orchestrator

**Một coordinator** gọi từng service theo kịch bản:

```
┌─────────────────────┐
│  Saga Orchestrator  │
│  (state machine)    │
└─────────┬───────────┘
          │ 1. createOrder()
          ▼
    Order Service
          │ 2. reserveStock()
          ▼
   Inventory Service
          │ 3. charge()
          ▼
    Payment Service
          │ fail → compensate 2, 1
```

| Ưu | Nhược |
|----|-------|
| Flow rõ trong 1 chỗ | Orchestrator là dependency |
| Dễ test kịch bản | Có thể bottleneck |
| Phù hợp nhiều bước, rule phức tạp | Cần lưu saga state |

**Công cụ:** Temporal, Camunda, custom `saga_instances` table + worker.

---

## 4. Compensating transaction

**Không phải** `ROLLBACK` distributed — là **nghiệp vụ ngược**:

| Forward action | Compensate |
|----------------|------------|
| `CreateOrder` (status=pending) | `CancelOrder` (status=cancelled) |
| `ReserveStock` (+hold) | `ReleaseStock` (-hold) |
| `ChargePayment` | `RefundPayment` |
| `SendEmail` | Không compensate — **chấp nhận đã gửi** |

```typescript
// Compensate phải idempotent
async compensateCancelOrder(orderId: string) {
  await db.query(
    `UPDATE orders SET status = 'cancelled'
     WHERE id = $1 AND status IN ('pending', 'reserved')`,
    [orderId],
  );
}
```

---

## 5. Cách triển khai

### 5.1. Choreography + Outbox (event-driven)

Mỗi service: local TX + Outbox → publish event. Xem [outbox.md](./outbox.md).

```typescript
// Order Service — bước 1
await db.transaction(async (tx) => {
  await tx.query(`INSERT INTO orders ...`);
  await tx.query(
    `INSERT INTO outbox (event_type, payload) VALUES ('order.created', $1)`,
    [JSON.stringify({ orderId })],
  );
});

// Payment Service — listen + compensate
@OnEvent('payment.failed') // hoặc consume từ Kafka
async onPaymentFailed({ orderId }: { orderId: string }) {
  await this.compensateCancelOrder(orderId);
}
```

### 5.2. Orchestration — state machine đơn giản

```sql
CREATE TABLE saga_instances (
  id            UUID PRIMARY KEY,
  saga_type     VARCHAR(64) NOT NULL,
  current_step  VARCHAR(64) NOT NULL,
  status        VARCHAR(32) NOT NULL, -- running | completed | compensating | failed
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

```typescript
@Injectable()
export class PlaceOrderSaga {
  async run(orderId: string) {
    const saga = await this.createInstance('place-order', { orderId });

    try {
      await this.step(saga, 'reserve_stock', () => this.inventory.reserve(orderId));
      await this.step(saga, 'charge', () => this.payment.charge(orderId));
      await this.complete(saga);
    } catch (e) {
      await this.compensate(saga); // chạy ngược các step đã OK
      throw e;
    }
  }

  private async compensate(saga: SagaInstance) {
    if (saga.completedSteps.includes('charge')) {
      await this.payment.refund(saga.payload.orderId);
    }
    if (saga.completedSteps.includes('reserve_stock')) {
      await this.inventory.release(saga.payload.orderId);
    }
    await this.order.cancel(saga.payload.orderId);
  }
}
```

### 5.3. NestJS + message queue

```
Orchestrator service (hoặc worker):
  poll saga_instances status=running
  call HTTP/gRPC từng service
  update step + compensate on failure
```

Kết hợp [inbox.md](./inbox.md) ở mỗi service consumer để tránh duplicate step.

---

## 6. Dùng ở đâu trong hệ thống?

| Vị trí | Vai trò |
|--------|---------|
| **Bounded context boundary** | Giữa Order / Payment / Inventory MS |
| **Saga orchestrator module** | App riêng hoặc module trong modular monolith |
| **Không** trong Controller | Controller gọi 1 command — saga chạy async/worker |
| **Event bus** | Choreography — Kafka/SNS giữa các step |

```
API Gateway
     │
     ▼
Order Controller → PlaceOrderCommand → Saga (async)
                                         │
                         ┌───────────────┼───────────────┐
                         ▼               ▼               ▼
                    Order MS        Inventory MS     Payment MS
```

---

## 7. Khi nào chọn Saga?

| Tình huống | Chọn |
|------------|------|
| 1 DB, order + items + payment | **DB transaction** |
| 2–3 MS, chấp nhận eventual | **Saga choreography** |
| >3 bước, rule phức tạp | **Saga orchestration** |
| DB + publish event | **Outbox** (không phải Saga) |
| Consumer duplicate | **Inbox** (không phải Saga) |

---

## 8. Lưu ý production

```
□ Mọi step + compensate đều idempotent
□ Saga state persist — survive crash
□ Timeout mỗi step — không kẹt running forever
□ Monitoring: saga stuck, compensate fail
□ Không compensate được (email) → thiết kế forward-only step cuối
□ Document saga flow — event catalog
□ Test: fail từng step, verify compensate đúng thứ tự ngược
```

---

## 9. Tóm tắt — phỏng vấn

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Saga là gì?** | Chuỗi local TX qua nhiều service + compensate khi fail |
| **Thay thế gì?** | Distributed transaction / 2PC |
| **Trade-off?** | Eventual consistency — tạm thời inconsistent |
| **Choreography vs Orchestration?** | Event decentralized vs coordinator tập trung |
| **Khi nào?** | Multi-service, multi-DB, không shared transaction |
| **Kết hợp?** | Outbox publish event; Inbox tại mỗi consumer |

**Công thức nhớ:**

```
1 DB                    →  transaction
N DB / N service        →  Saga + compensate
Publish event an toàn   →  Outbox (producer)
Consume không dup       →  Inbox (consumer)
```

---

## Demo chạy được

| Demo | Mô tả |
|------|--------|
| [../../demo/saga-choreography/README.md](../../demo/saga-choreography/README.md) | Saga choreography — Order → Inventory → Payment, Outbox + Inbox + compensate |

```bash
cd demo/saga-choreography && npm install && npm run demo
```

# Saga Choreography Demo

Demo **Saga (choreography)** + **Outbox** + **Inbox** — luồng đặt hàng qua 3 microservice, mỗi service **một JSON store riêng** (mô phỏng separate DB).

```
Order Service (order.json)
    │ outbox → order.created
    ▼
Inventory Service (inventory.json)
    │ outbox → stock.reserved
    ▼
Payment Service (payment.json)
    │ outbox → payment.completed | payment.failed
    ▼
Compensate (nếu payment.failed):
    Order → cancel  |  Inventory → release stock
```

> Event bus in-memory thay Kafka/SQS. Outbox relay thay worker publish. Pattern giống production.

Liên quan: [design-sys/vips/saga.md](../../design-sys/vips/saga.md) · [outbox.md](../../design-sys/vips/outbox.md) · [inbox.md](../../design-sys/vips/inbox.md)

---

## Kiến trúc

```
┌─────────────┐  TX: order + outbox   ┌─────────────┐
│ Order Svc   │ ─────────────────────►│ order.json  │
└──────┬──────┘                       └──────┬──────┘
       │ outbox relay                        │
       ▼                                     │
┌─────────────┐  inbox dedup          ┌──────▼──────┐
│ Event Bus   │ ────────────────────►│ Inventory   │
│ (in-memory) │                       │ + inventory.json
└──────┬──────┘                       └──────┬──────┘
       │                                     │
       ▼                                     ▼
┌─────────────┐                       ┌─────────────┐
│ Payment Svc │ ◄── stock.reserved ───│             │
│ + payment.json                      └─────────────┘
└─────────────┘
```

| Pattern | Trong demo |
|---------|------------|
| **Saga choreography** | Mỗi service subscribe event, tự bước tiếp / compensate |
| **Outbox** | Ghi event cùng transaction local → relay publish |
| **Inbox** | `processed_events` — `ON CONFLICT DO NOTHING` |
| **Compensate** | `payment.failed` → cancel order + release stock |

---

## Chạy demo

```bash
cd demo/saga-choreography
npm install
npm run demo          # 3 scenario: success + fail + inbox
```

Hoặc từng scenario:

```bash
npm run demo:success  # payment OK → order confirmed
npm run demo:fail     # payment fail → compensate
npm run demo:inbox    # duplicate event → chỉ charge 1 lần
npm run reset         # xóa file JSON trong data/
```

**Không cần Docker** — chỉ Node.js 20+.

---

## 3 scenario giải thích

### 1. Happy path (`demo:success`)

```
placeOrder → order.created → reserve stock → stock.reserved → charge → payment.completed → order confirmed
```

### 2. Compensate (`demo:fail`)

```
placeOrder (forcePaymentFail=true)
  → reserve stock ✅
  → payment.failed ❌
  → order cancelled + stock released (compensate)
```

### 3. Inbox (`demo:inbox`)

Simulate **at-least-once**: `stock.reserved` gửi **2 lần** → Payment chỉ tạo **1** bản ghi (inbox chặn duplicate).

---

## Map sang production

| Demo | Production |
|------|------------|
| 3 file JSON store | 3 Postgres (Order / Inventory / Payment DB) |
| EventBus in-memory | Kafka / SNS+SQS |
| Outbox relay poll | Worker cron / Debezium CDC |
| `processed_events` | Inbox table mỗi consumer |
| `forcePaymentFail` | Payment gateway trả lỗi thật |

---

## Cấu trúc code

```
src/
├── services/
│   ├── order-service.ts      # placeOrder + compensate cancel
│   ├── inventory-service.ts  # reserve + compensate release
│   └── payment-service.ts    # charge / fail
├── db/create-db.ts           # schema + outbox + inbox helpers
├── outbox-relay.ts           # poll outbox → publish bus
├── event-bus.ts              # pub/sub (thay queue)
└── run-demo.ts               # 3 scenario
```

---

## Liên quan

- [design-sys/vips/saga.md](../../design-sys/vips/saga.md)
- [design-sys/vips/outbox.md](../../design-sys/vips/outbox.md)
- [design-sys/vips/inbox.md](../../design-sys/vips/inbox.md)
- [mqs/at-least-once.md](../../mqs/at-least-once.md)

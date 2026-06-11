# VIP Patterns — Distributed Consistency

> Ba pattern quan trọng khi hệ thống **vượt một database** hoặc **kết hợp DB + message queue** — bổ sung cho [transaction-consistency.md](../../database/transaction-consistency.md).

| Pattern | Vai trò | File |
|---------|---------|------|
| **Saga** | Giao dịch phân tán qua nhiều service — **compensate** khi lỗi | [saga.md](./saga.md) |
| **Outbox** | **Producer** — ghi event cùng DB commit, publish an toàn | [outbox.md](./outbox.md) |
| **Inbox** | **Consumer** — chống xử lý trùng message (at-least-once) | [inbox.md](./inbox.md) |

---

## Khi nào dùng pattern nào?

```
Cùng 1 DB, nhiều bảng              →  DB transaction (không cần 3 pattern này)

DB commit + publish event            →  Outbox (producer)

Consume từ queue / Kafka           →  Inbox (consumer)

Nhiều service, nhiều DB             →  Saga (+ Outbox/Inbox từng service)
```

---

## Kết hợp trong hệ thống

```
┌─────────────┐   Outbox    ┌──────┐   Inbox    ┌─────────────┐
│ Order Svc   │ ──────────► │ Queue│ ────────► │ Payment Svc │
│ (producer)  │   + worker  │/Kafka│  + dedup  │ (consumer)  │
└──────┬──────┘             └──────┘            └──────┬──────┘
       │                                                │
       └──────────── Saga orchestration / events ──────┘
                    (nhiều bước, compensate nếu fail)
```

---

## Demo

| Demo | Pattern |
|------|---------|
| [../../demo/saga-choreography/README.md](../../demo/saga-choreography/README.md) | Saga + Outbox + Inbox — `npm run demo` |

---

## Liên quan

| File | Nội dung |
|------|----------|
| [../../database/transaction-consistency.md](../../database/transaction-consistency.md) | ACID, race, khi nào Saga/Outbox |
| [../../mqs/at-least-once.md](../../mqs/at-least-once.md) | At-least-once → cần Inbox |
| [../../mqs/exactly-once.md](../../mqs/exactly-once.md) | Effectively-once = Outbox + Inbox |
| [../patterns/observer.md](../patterns/observer.md) | Event-driven, domain events |
| [../mono-micro.md](../mono-micro.md) | Tách microservice |

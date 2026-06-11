# Message Queue — Delivery Semantics

> Ba mô hình giao / xử lý message trong distributed messaging — so sánh **Kafka**, **RabbitMQ**, **BullMQ**.

---

## Delivery semantics

| Semantics | Ý nghĩa | Trade-off | File |
|-----------|---------|-----------|------|
| **At-least-once** | Giao ≥1 lần — có thể **trùng** | Không mất — cần **idempotent consumer** | [at-least-once.md](./at-least-once.md) |
| **At-most-once** | Giao ≤1 lần — có thể **mất** | Không trùng — chấp nhận loss | [at-most-once.md](./at-most-once.md) |
| **Exactly-once** | Xử lý đúng 1 lần | Khó — thường **effectively-once** (at-least-once + dedup) | [exactly-once.md](./exactly-once.md) |

## Câu hỏi phỏng vấn & thiết kế thực chiến

| Nội dung | File |
|----------|------|
| 60+ câu Kafka · Rabbit · SQS · Bull · semantics · incident | [interview-design-qa.md](./interview-design-qa.md) |

---

## Competing consumers (3 instance — ai nhận message?)

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| 3 instance cùng nhận **1 message**? | **Không** — 1 message → 1 instance |
| 3 instance chạy **cùng lúc**? | **Có** — nhưng **3 message khác nhau** |
| Chi tiết Kafka · Rabbit · BullMQ · SQS | [competing-consumers.md](./competing-consumers.md) |

## Scale ngang WebSocket / Socket

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| Socket stateful? | Connection gắn 1 instance — khác queue worker |
| Scale ngang? | **Sticky LB** + **Redis adapter** (cross-pod emit) |
| Scale lớn? | Tách WS tier + event qua SQS/Kafka |
| Chi tiết | [scale.md](./scale.md) |

---

## So sánh RabbitMQ · Kafka · BullMQ (chi tiết)

| Nội dung | File |
|----------|------|
| Cơ chế, persistence, vận hành, xử lý message, khi nào chọn | [queue-comparison.md](./queue-comparison.md) |

## So sánh nhanh (Kafka · RabbitMQ · BullMQ)

| | **At-least-once** | **At-most-once** | **Exactly-once** |
|---|-------------------|------------------|------------------|
| **Kafka** | Commit offset sau process | Commit trước process | Transactional EOS (stream); DB → idempotent |
| **RabbitMQ** | Manual `ack` sau process | `noAck: true` | Không native — idempotent consumer |
| **BullMQ** | Retry + complete sau process | `attempts: 1`, nuốt lỗi | Không native — `jobId` + idempotent |

---

## Mặc định production

```
Business critical (order, payment)  →  At-least-once + idempotency table
Telemetry / metric                  →  At-most-once (optional)
Kafka stream → Kafka                →  Transactional EOS (nếu all-in Kafka)
Rabbit / Bull → Postgres            →  Effectively-once (dedup ở app)
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [../aws/sqs.md](../aws/sqs.md) | SQS at-least-once, FIFO dedup |
| [../design-sys/patterns/observer.md](../design-sys/patterns/observer.md) | Pub/Sub, event-driven |
| [../database/transaction-consistency.md](../database/transaction-consistency.md) | Outbox, Saga |

---

## Công thức nhớ (phỏng vấn)

```
ACK sau process     →  at-least-once  →  idempotent bắt buộc
ACK trước process   →  at-most-once   →  mất message OK
Broker magic EOS    →  chỉ Kafka stream txn; còn lại = dedup app
```

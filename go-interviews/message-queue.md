# Redis Queue vs RabbitMQ — Khi nào dùng?

## Tóm tắt một câu

**Redis** (List/Stream): đơn giản, nhanh, phù hợp **queue nhẹ, throughput cao, mất vài message chấp nhận được** (có persistence tùy cấu hình). **RabbitMQ**: message broker **đầy đủ** — routing phức tạp, ack, DLQ, đảm bảo delivery tốt hơn cho **nghiệp vụ quan trọng**.

---

## So sánh

| | **Redis Queue** | **RabbitMQ** |
|---|-----------------|--------------|
| Vai trò chính | Cache + queue phụ | Message broker chuyên dụng |
| Model | List (LPUSH/BRPOP), Stream + consumer group | Exchange → Queue → Consumer |
| Routing | Đơn giản | Topic, direct, fanout, headers |
| Delivery guarantee | At-most-once (List); Stream tốt hơn | At-least-once, publisher confirm |
| Persistence | AOF/RDB — không bằng broker chuyên | Durable queue, disk spill |
| DLQ / retry | Tự implement | Built-in / plugin |
| Throughput | Rất cao (in-memory) | Cao, thấp hơn Redis thuần |
| Ops | Đã có Redis thì tiện | Cluster, policy riêng |

---

## Redis — cách dùng queue

**List (đơn giản):**
```
LPUSH queue job_json
BRPOP queue timeout  → worker
```
Risk: worker crash sau pop → mất job (at-most-once).

**Stream (khuyến nghị hơn):**
```
XADD stream * field value
XREADGROUP GROUP g consumer COUNT 1 STREAMS stream >
XACK stream g id
```
Consumer group + pending list — recover job chưa ack.

---

## RabbitMQ — cách dùng

```
Producer → Exchange (topic) → Queue(s) → Consumer (manual ack)
```
- **Durable queue** — survive broker restart.
- **Prefetch** — giới hạn unacked per consumer.
- **DLQ** — message fail N lần → dead letter queue.

---

## Khi chọn gì?

| Chọn Redis Stream/List | Chọn RabbitMQ / Kafka |
|------------------------|----------------------|
| Đã có Redis, job nhỏ | Order, payment, email bắt buộc deliver |
| Fire-and-forget notification | Routing phức tạp (nhiều consumer type) |
| Rate limit + queue cùng stack | Cần DLQ, retry policy chuẩn |
| Throughput cực cao, latency thấp | Event log replay (Kafka) |

**Kafka** thêm vào bảng mental: event streaming, replay, log retention dài — không thay Rabbit cho task queue đơn giản.

---

## Câu trả lời ngắn (phỏng vấn)

Redis queue nhanh, đơn giản — job phụ, đã có Redis; dùng Stream + consumer group. RabbitMQ cho nghiệp vụ cần ack, routing, DLQ, durable. Kafka cho event stream scale lớn. Luôn **idempotent consumer** vì at-least-once.

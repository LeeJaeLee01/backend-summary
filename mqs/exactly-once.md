# Exactly-Once Delivery

> **Exactly-once** — mỗi message **được xử lý đúng 1 lần** (không mất, không trùng). **Khó nhất** trong distributed systems — thường là **exactly-once semantics** (end-to-end) chứ không phải magic của broker.

Liên quan: [at-least-once.md](./at-least-once.md) · [at-most-once.md](./at-most-once.md) · [index.md](./index.md).

---

## 1. Khái niệm

### 1.1. Ba mức “exactly-once”

| Mức | Ý nghĩa | Thực tế |
|-----|---------|---------|
| **Exactly-once delivery** | Broker giao đúng 1 lần tới consumer | **Gần như không tồn tại** thuần túy |
| **Exactly-once processing** | Side effect business chỉ 1 lần | **Mục tiêu thực tế** — Kafka EOS, idempotent consumer |
| **Effectively-once** | At-least-once + idempotent = như exactly-once | **Pattern phổ biến nhất** |

```
Thực tế production:

  At-least-once (broker)
       +
  Idempotent consumer (app)
       =
  Effectively-once (người dùng cảm nhận đúng 1 lần)
```

### 1.2. Tại sao khó?

```
Producer gửi → broker nhận → consumer nhận → consumer xử lý → ghi DB
     │              │              │                │
  retry dup      replicate      redelivery       crash
```

Mỗi bước có thể duplicate hoặc mất — **chỉ có 1 transaction boundary** nếu thiết kế cẩn thận.

---

## 2. Kafka

### 2.1. Exactly-once semantics (EOS) — native mạnh nhất

Kafka hỗ trợ **read-process-write** trong **một transactional boundary** (Kafka Streams / transactional consumer):

```
consume → process → produce output → commit consumer offset + producer txn
         (cùng transaction)
```

| Thành phần | Vai trò |
|------------|---------|
| **Idempotent producer** | `enable.idempotence=true` — không duplicate record trên broker |
| **Transactional producer** | `transactional.id` — atomic write nhiều partition |
| **Transactional consumer** | Commit offset **cùng** transaction produce |

### 2.2. Cấu hình producer

```properties
enable.idempotence=true
acks=all
retries=Integer.MAX_VALUE
```

```typescript
const producer = kafka.producer({
  idempotent: true,
  transactionalId: 'order-processor-1',
  maxInFlightRequests: 5,
});
```

### 2.3. Transactional consume-transform-produce

```typescript
const producer = kafka.producer({ transactionalId: 'txn-1' });
const consumer = kafka.consumer({ groupId: 'processor' });

await producer.connect();
await consumer.connect();
await consumer.subscribe({ topic: 'orders-in' });

await producer.transaction(async (tx) => {
  const batch = await consumer.poll();
  for (const msg of batch) {
    const result = transform(msg);
    await tx.send({ topic: 'orders-out', messages: [{ value: JSON.stringify(result) }] });
  }
  await tx.sendOffsets({
    consumer,
    topics: [{ topic, partitions: [{ partition, offset }] }],
  });
});
```

> EOS Kafka chủ yếu cho **pipeline Kafka → Kafka**. Ghi **DB bên ngoài** vẫn cần pattern khác.

### 2.4. Kafka + Database — không có EOS native

```
consume Kafka → write Postgres
     │
  crash sau write, trước commit offset → duplicate write
```

**Giải pháp:**

| Pattern | Mô tả |
|---------|--------|
| **Idempotent consumer** | `INSERT ... ON CONFLICT`, unique `eventId` |
| **Outbox + Debezium** | Ghi outbox cùng DB txn → CDC sang Kafka |
| **Saga + compensation** | Chấp nhận eventual, rollback nếu dup |

```typescript
// Effectively-once với DB
await db.transaction(async (tx) => {
  const ok = await tx.query(
    `INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING 1`,
    [eventId],
  );
  if (!ok.rows.length) return;

  await tx.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [orderId]);
});
// sau đó commit Kafka offset
```

### 2.5. Tóm tắt Kafka

| Scenario | Exactly-once? |
|----------|---------------|
| Producer → Kafka (idempotent) | Gần exactly-once trên log |
| Kafka → Kafka (transactional) | **EOS supported** |
| Kafka → DB / HTTP | **Idempotent app** — effectively-once |
| Phỏng vấn | “Kafka EOS cho stream; DB cần idempotency hoặc outbox” |

---

## 3. RabbitMQ

### 3.1. Không có exactly-once native

RabbitMQ đảm bảo **at-most-once** (auto-ack) hoặc **at-least-once** (manual ack) — **không có** transactional consume + ack atomic với external side effect.

### 3.2. Cách đạt effectively-once

```
At-least-once (manual ack)
    +
Idempotent consumer (DB unique key)
    +
Publisher confirms (không mất khi gửi)
    =
Effectively-once
```

```typescript
channel.consume('orders', async (msg) => {
  const { eventId, orderId } = JSON.parse(msg!.content.toString());

  await db.transaction(async (tx) => {
    const inserted = await tx.query(
      `INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING 1`,
      [eventId],
    );
    if (!inserted.rows.length) {
      channel.ack(msg!);
      return;
    }
    await applyOrderUpdate(tx, orderId);
  });

  channel.ack(msg!);
}, { noAck: false });
```

### 3.3. RabbitMQ stream (plugin) — lưu ý

RabbitMQ **Streams** (log-like) — offset consumer, gần Kafka hơn — vẫn **at-least-once** khi ack offset, không magic exactly-once ra DB.

### 3.4. Dedup plugin / messageId

```
□ messageId trên publish — consumer check Redis/DB
□ Không có broker-level exactly-once như Kafka transactional
```

---

## 4. BullMQ

### 4.1. Không có exactly-once native

BullMQ (Redis):

- Job có thể **retry** → at-least-once
- Worker **stall** → job reassigned → duplicate
- Redis **không** transactional với Postgres trong 1 atomic step

### 4.2. `jobId` — dedup enqueue, không phải exactly-once process

```typescript
await queue.add('pay', payload, { jobId: `pay-${orderId}` });
// Job trùng jobId bị bỏ khi enqueue — nhưng retry vẫn chạy lại cùng job
```

`jobId` chỉ chống **thêm job trùng vào queue**, không chống **xử lý 2 lần** khi retry/stall.

### 4.3. Effectively-once pattern

```typescript
const worker = new Worker('orders', async (job) => {
  const { eventId, orderId } = job.data;

  await db.transaction(async (tx) => {
    const dup = await tx.query(
      `SELECT 1 FROM processed_events WHERE event_id = $1`,
      [eventId],
    );
    if (dup.rows.length) return;

    await tx.query(`INSERT INTO processed_events (event_id) VALUES ($1)`, [eventId]);
    await chargeOrder(tx, orderId);
  });
});
```

### 4.4. Redis lock (bổ sung)

```typescript
const lock = await redis.set(`lock:${eventId}`, '1', 'NX', 'EX', 30);
if (!lock) return;
try {
  await processOnce(eventId);
} finally {
  await redis.del(`lock:${eventId}`);
}
```

> Lock + DB unique — **vẫn cần** idempotency nếu lock expire trước khi xong.

### 4.5. Flow producer (BullMQ Pro / custom)

Parent-child flow — mỗi step vẫn at-least-once; orchestration không thay exactly-once.

---

## 5. So sánh ba broker

| | **Kafka** | **RabbitMQ** | **BullMQ** |
|---|-----------|--------------|------------|
| **EOS native** | **Có** (stream pipeline, transactional) | **Không** | **Không** |
| **Idempotent producer** | Có | Publisher confirm (khác nghĩa) | `jobId` dedup enqueue |
| **Thực tế production** | EOS stream hoặc idempotent + DB | Idempotent consumer | Idempotent + `jobId` |
| **Ghi DB external** | Outbox / idempotency table | Idempotency table | Idempotency table |
| **Độ phức tạp EOS** | Cao (đáng nếu all-Kafka pipeline) | Thấp — dùng idempotent | Thấp — dùng idempotent |

---

## 6. Pattern effectively-once (mọi broker)

### 6.1. Idempotency key

```sql
CREATE TABLE processed_events (
  event_id   VARCHAR(128) PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.2. Outbox pattern

```sql
BEGIN;
  UPDATE orders SET status = 'paid' WHERE id = $1;
  INSERT INTO outbox (event_id, payload) VALUES ($2, $3);
COMMIT;
-- worker đọc outbox → publish — mỗi event_id publish 1 lần
```

### 6.3. Natural idempotency

```
PUT /orders/123/status với If-Match etag
Charge API với idempotency-key header (Stripe)
```

---

## 7. Chọn semantics nào?

| Yêu cầu | Chọn |
|---------|------|
| Không được mất, chấp nhận dup | **At-least-once** + idempotent |
| Mất vài record OK | At-most-once |
| Stream Kafka → Kafka | **Kafka transactional EOS** |
| Queue → DB (Rabbit/Bull) | **At-least-once** + **idempotency table** |
| Phỏng vấn “exactly-once” | Giải thích **effectively-once** — broker at-least-once + app dedup |

---

## 8. Câu hỏi phỏng vấn

### Q: Exactly-once có thật không?

> Distributed systems thường đạt **effectively-once**: broker **at-least-once** + consumer **idempotent** (unique eventId, outbox). Kafka có **transactional EOS** cho pipeline nội bộ Kafka. RabbitMQ và BullMQ **không có** EOS native — dùng idempotency ở application.

### Q: Kafka exactly-once khác idempotent consumer?

> Kafka EOS = offset commit **atomic** với produce trong **cùng transaction** — cho stream processing. Idempotent consumer = app tự dedup khi ghi DB — dùng mọi nơi.

### Q: BullMQ jobId có exactly-once không?

> **Không** — chỉ dedup lúc **enqueue**. Retry và stall vẫn chạy handler lại — cần idempotent logic.

---

## 9. Checklist

```
□ Định nghĩa rõ: delivery vs processing vs effect
□ eventId / messageId trên mọi message
□ processed_events hoặc unique business constraint
□ Outbox nếu publish + DB cùng lúc
□ Test: kill consumer sau DB write, trước ack — không double charge
□ Không claim “exactly-once” nếu chỉ bật FIFO/dedup broker
```

---

## 10. Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **Exactly-once là gì?** | Xử lý đúng 1 lần — không mất không trùng |
| **Có thật 100%?** | End-to-end hiếm — thường **effectively-once** |
| **Kafka** | Transactional EOS (stream); DB cần idempotent |
| **RabbitMQ** | Idempotent consumer + manual ack |
| **BullMQ** | Idempotent + `jobId` (enqueue dedup only) |
| **Công thức** | At-least-once + idempotency = effectively-once |

# At-Least-Once Delivery

> **At-least-once** — message **ít nhất được giao 1 lần**, có thể **trùng** (duplicate). Consumer **phải idempotent** — xử lý lại cùng message không gây lỗi nghiệp vụ.

Liên quan: [at-most-once.md](./at-most-once.md) · [exactly-once.md](./exactly-once.md) · [index.md](./index.md).

---

## 1. Khái niệm

```
Producer ──► Broker ──► Consumer
                              │
                    xử lý message
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
         ACK / commit                    crash trước ACK
         thành công                      → broker giao LẠI
                                              → duplicate
```

| Đặc điểm | Mô tả |
|----------|--------|
| **Đảm bảo** | Không **mất** message (trong điều kiện broker hoạt động) |
| **Trade-off** | Có thể **xử lý 2+ lần** cùng message |
| **Giải pháp** | **Idempotency** ở consumer — `eventId` unique, `processed_events` table |
| **Mặc định** | Hầu hết hệ thống production dùng at-least-once |

**Công thức:**

```
ACK / commit SAU khi xử lý xong (hoặc trong cùng transaction outbox)
  → crash trước ACK → redelivery → at-least-once
```

---

## 2. Kafka

### 2.1. Cơ chế

Consumer **commit offset sau khi xử lý** (hoặc sau batch xử lý):

```
poll records → process → commit offset
                │
         crash ở đây → offset chưa commit → poll lại → duplicate
```

| Cấu hình | Hành vi |
|----------|---------|
| `enable.auto.commit=false` + commit manual sau process | **At-least-once** (khuyến nghị) |
| `enable.auto.commit=true` (mặc định cũ) | Commit theo interval — vẫn có thể duplicate nếu crash giữa process và commit |
| **Idempotent producer** | Chống duplicate **khi gửi** — không thay đổi semantics consumer |

### 2.2. Code (KafkaJS)

```typescript
const consumer = kafka.consumer({ groupId: 'order-workers' });

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message, heartbeat }) => {
    const payload = JSON.parse(message.value!.toString());

    await processOrder(payload); // idempotent!

    await consumer.commitOffsets([
      {
        topic,
        partition,
        offset: (Number(message.offset) + 1).toString(),
      },
    ]);
  },
});
```

### 2.3. Idempotency pattern

```typescript
async function processOrder(event: { orderId: string; eventId: string }) {
  const inserted = await db.query(
    `INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id`,
    [event.eventId],
  );
  if (!inserted.rows.length) return; // đã xử lý

  await applyBusinessLogic(event);
}
```

### 2.4. Lưu ý Kafka

```
□ Consumer group rebalance — có thể duplicate trong window rebalance
□ max.poll.interval.ms — xử lý quá lâu → kick khỏi group → partition reassign → duplicate
□ Log compaction / replay — đọc lại từ offset cũ = xử lý lại
□ EOS (exactly-once) là chủ đề riêng — xem exactly-once.md
```

---

## 3. RabbitMQ

### 3.1. Cơ chế

**Manual acknowledgment** — `ack` sau khi xử lý thành công:

```
broker deliver → consumer process → basicAck
                      │
               crash trước ack → message unacked → redeliver → duplicate
```

| Chế độ | Semantics |
|--------|-----------|
| `autoAck: false` + `channel.ack(msg)` sau process | **At-least-once** |
| `autoAck: true` | **At-most-once** (xem at-most-once.md) |
| `nack` / `reject(requeue=true)` | Gửi lại queue — cố ý retry |

### 3.2. Code (amqplib)

```typescript
channel.consume(
  'order-queue',
  async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      await processOrder(payload); // idempotent
      channel.ack(msg);
    } catch (err) {
      // retry hoặc DLQ
      channel.nack(msg, false, false); // requeue=false → DLQ nếu có x-dead-letter
    }
  },
  { noAck: false },
);
```

### 3.3. Publisher confirms (gửi at-least-once)

```typescript
await channel.assertQueue('order-queue', { durable: true });
channel.confirmSelect();

channel.sendToQueue('order-queue', Buffer.from(JSON.stringify(payload)), {
  persistent: true,
  messageId: eventId, // dedup phía consumer
});

await new Promise<void>((resolve, reject) => {
  channel.waitForConfirms((err) => (err ? reject(err) : resolve()));
});
```

### 3.4. Lưu ý RabbitMQ

```
□ prefetch(1) hoặc prefetch(N) — cân bằng throughput vs duplicate blast khi crash
□ DLX (dead-letter exchange) — message fail nhiều lần
□ Redelivered flag: msg.fields.redelivered — log / metric
□ Cluster mirror / quorum queue — durability khác classic queue
```

---

## 4. BullMQ

### 4.1. Cơ chế

BullMQ (Redis): job ở trạng thái **active** cho đến khi worker **`moveToCompleted`** hoặc **fail + retry**:

```
Worker lấy job → active → xử lý → completed
                    │
             crash / stall → job quay lại (stalled check) → duplicate processing
```

| Cơ chế | Hành vi |
|--------|---------|
| Default retry (`attempts: 3`) | Fail → retry — **at-least-once** |
| `jobId` cố định | Chống enqueue trùng — không chống xử lý trùng khi retry |
| Stalled job recovery | Worker chết → job active quá lâu → worker khác nhận lại |

### 4.2. Code

```typescript
// Producer
await queue.add(
  'process-order',
  { orderId: 'ord_1', eventId: 'evt_abc' },
  {
    jobId: 'evt_abc',        // dedup enqueue (optional)
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
);

// Worker
const worker = new Worker(
  'orders',
  async (job) => {
    await processOrder(job.data); // idempotent bắt buộc
  },
  { connection, concurrency: 5 },
);

worker.on('failed', (job, err) => {
  console.error(job?.id, err);
});
```

### 4.3. Idempotency với BullMQ

```typescript
async function processOrder(data: { eventId: string; orderId: string }) {
  const lock = await redis.set(`done:${data.eventId}`, '1', 'NX', 'EX', 86400);
  if (!lock) return; // đã xử lý

  await chargeOrder(data.orderId);
}
```

### 4.4. Lưu ý BullMQ

```
□ Redis single point — persistence AOF/RDB ảnh hưởng durability
□ Không phải distributed log như Kafka — job mất nếu Redis mất (chưa persist)
□ removeOnComplete: false — giữ history debug duplicate
□ Flow / parent-child jobs — mỗi job vẫn cần idempotent
```

---

## 5. So sánh nhanh

| | **Kafka** | **RabbitMQ** | **BullMQ** |
|---|-----------|--------------|------------|
| **Cách đạt** | Commit offset sau process | `ack` sau process | Complete job sau process |
| **Duplicate khi** | Crash trước commit | Crash trước ack | Crash / stall / retry |
| **Mặc định prod** | Manual commit | Manual ack | Retry enabled |
| **Chống dup gửi** | Idempotent producer | Publisher confirm + messageId | `jobId` khi add |
| **Chống dup xử lý** | **App idempotency** | **App idempotency** | **App idempotency** |

---

## 6. Checklist production

```
□ Consumer idempotent — unique key (eventId, orderId+version)
□ ACK/commit chỉ SAU side effect quan trọng (hoặc trong outbox transaction)
□ DLQ / failed queue cho poison message
□ Metric: redelivery count, duplicate detection
□ Log correlationId / messageId
□ Test: kill worker giữa process → verify không mất data, duplicate OK
□ Document: team hiểu duplicate là expected
```

---

## 7. Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **At-least-once là gì?** | Message giao ≥1 lần — có thể trùng |
| **Khi nào dùng?** | **Mặc định** khi không được mất message |
| **Bắt buộc làm gì?** | **Idempotent consumer** |
| **Kafka** | Manual commit offset sau process |
| **RabbitMQ** | Manual `ack` sau process |
| **BullMQ** | Job complete sau process + retry on fail |

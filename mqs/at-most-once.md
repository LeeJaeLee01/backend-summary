# At-Most-Once Delivery

> **At-most-once** — message **giao tối đa 1 lần**, có thể **mất** (lost). Đổi lại consumer **không bao giờ xử lý trùng**.

Liên quan: [at-least-once.md](./at-least-once.md) · [exactly-once.md](./exactly-once.md) · [index.md](./index.md).

---

## 1. Khái niệm

```
Producer ──► Broker ──► Consumer
                              │
              ACK / commit TRƯỚC hoặc NGAY khi nhận
                              │
                         rồi mới xử lý
                              │
                    crash sau ACK → message MẤT
                    (broker coi đã giao xong)
```

| Đặc điểm | Mô tả |
|----------|--------|
| **Đảm bảo** | Không duplicate processing |
| **Trade-off** | Có thể **mất message** khi crash |
| **Khi dùng** | Metric, log, telemetry — mất vài record chấp nhận được |
| **Không dùng** | Payment, order, inventory — dùng at-least-once + idempotent |

**Công thức:**

```
ACK / commit TRƯỚC khi xử lý xong → at-most-once
```

---

## 2. Kafka

### 2.1. Cơ chế

Commit offset **trước** khi xử lý business logic:

```
poll → commit offset ngay → process
              │
       crash sau commit, trước/during process → message lost
```

| Cấu hình | Hành vi |
|----------|---------|
| Commit offset trước `process()` | **At-most-once** |
| `enable.auto.commit=true` + xử lý chậm | Có thể commit trong lúc đang process → mất nếu fail |

### 2.2. Code (minh họa — không khuyến nghị cho order)

```typescript
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    // ❌ at-most-once — commit trước process
    await consumer.commitOffsets([
      { topic, partition, offset: (Number(message.offset) + 1).toString() },
    ]);

    const payload = JSON.parse(message.value!.toString());
    await processMetrics(payload); // mất OK nếu crash sau commit
  },
});
```

### 2.3. Use case hợp lệ Kafka

```
□ Click stream / page view analytics
□ Heartbeat / sensor data (sample tiếp theo bù)
□ Log aggregation mất vài dòng
□ Metric Datadog-style — approximate OK
```

### 2.4. Lưu ý

```
□ Hiếm khi chọn cố ý cho business critical
□ auto.commit interval — dễ hiểu nhầm semantics
□ Nếu cần không mất → at-least-once + idempotent
```

---

## 3. RabbitMQ

### 3.1. Cơ chế

**Auto-acknowledgment** — broker xóa message **ngay khi deliver** tới consumer:

```
broker push → message removed from queue → consumer process
                    │
             consumer crash → message gone forever
```

| Chế độ | Semantics |
|--------|-----------|
| `{ noAck: true }` / `autoAck: true` | **At-most-once** |
| `noAck: false` + manual ack | At-least-once |

### 3.2. Code

```typescript
channel.consume(
  'metrics-queue',
  (msg) => {
    if (!msg) return;
    const payload = JSON.parse(msg.content.toString());
  void recordMetric(payload); // fire-and-forget, no ack needed
  },
  { noAck: true }, // at-most-once
);
```

### 3.3. Fire-and-forget publish

```typescript
// Không publisher confirm — message có thể mất trước khi vào queue
channel.sendToQueue('metrics', Buffer.from(JSON.stringify(data)));
// không waitForConfirms
```

### 3.4. Lưu ý RabbitMQ

```
□ noAck: true — message mất nếu consumer die ngay sau receive
□ Không durable queue + non-persistent message → mất khi broker restart
□ Phù hợp throughput cao, loss acceptable
```

---

## 4. BullMQ

### 4.1. Cơ chế

Cấu hình **không retry** + xóa job sớm / bỏ qua lỗi:

```
Worker nhận job → xử lý → fail → không retry → job lost (hoặc vào failed rồi bỏ)
```

| Cấu hình | Hành vi |
|----------|---------|
| `attempts: 1` | Fail 1 lần → không retry — gần at-most-once |
| Bỏ qua error, `moveToCompleted` dù fail | Cố ý mất / skip |
| `removeOnFail: true` ngay | Không inspect failed job |

### 4.2. Code

```typescript
// Producer — job không quan trọng
await queue.add(
  'record-metric',
  { page: '/home', ts: Date.now() },
  {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: true,
  },
);

// Worker — nuốt lỗi
const worker = new Worker('metrics', async (job) => {
  try {
    await sendToAnalytics(job.data);
  } catch {
    // cố ý bỏ qua — at-most-once semantics
  }
});
```

### 4.3. BullMQ vs at-most-once thuần

BullMQ mặc định **retry** → thiên **at-least-once**. Muốn at-most-once:

```
□ attempts: 1
□ Không stalled recovery (chấp nhận job kẹt khi worker die — trade-off)
□ Hoặc dùng Redis pub/sub thay queue — không persistence
```

### 4.4. Redis Pub/Sub (liên quan)

```typescript
// Không phải BullMQ — pub/sub Redis = at-most-once thuần
await redis.publish('metrics', JSON.stringify(data));
// subscriber offline → message lost
```

---

## 5. So sánh nhanh

| | **Kafka** | **RabbitMQ** | **BullMQ** |
|---|-----------|--------------|------------|
| **Cách đạt** | Commit trước process | `noAck: true` | `attempts: 1`, nuốt lỗi |
| **Mất khi** | Crash sau commit | Consumer die sau deliver | Fail không retry / worker stall |
| **Duplicate** | Không (đã commit) | Không | Hiếm (nếu không retry) |
| **Use case** | Telemetry | Real-time metric | Background job không critical |
| **Business order** | ❌ | ❌ | ❌ |

---

## 6. At-most-once vs “không quan trọng”

| Loại data | Gợi ý |
|-----------|--------|
| Page view, click | At-most-once OK |
| Log debug | At-most-once OK |
| **Order, payment, inventory** | **At-least-once + idempotent** |
| Notification email | At-least-once (gửi trùng tệ hơn mất — dùng dedup) |

> Thực tế backend **90%+** chọn at-least-once vì **mất message** thường tệ hơn **duplicate** (nếu có idempotency).

---

## 7. Checklist

```
□ Xác nhận stakeholder: mất message có chấp nhận không?
□ Không dùng cho money path / legal audit
□ Monitor loss rate nếu cần (so sánh producer count vs consumer count)
□ Document rõ semantics cho team
```

---

## 8. Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| **At-most-once là gì?** | Giao ≤1 lần — có thể **mất** |
| **Khi nào dùng?** | Metric, telemetry, data không critical |
| **Kafka** | Commit offset trước process |
| **RabbitMQ** | `noAck: true` |
| **BullMQ** | `attempts: 1`, không retry, hoặc nuốt lỗi |
| **Phỏng vấn** | “Hiếm dùng cho business; chọn khi duplicate tệ hơn mất” |

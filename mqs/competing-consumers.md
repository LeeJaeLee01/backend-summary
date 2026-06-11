# Competing Consumers — 3 Instance nhận message thế nào?

> **Câu hỏi hay gặp:** Producer đổ message vào **1 queue**, consumer service chạy **3 instance** — cả 3 có nhận **cùng 1 message** không?

**Trả lời ngắn:** **Không** (với **work queue** / **consumer group** chuẩn). **1 message → 1 instance** tại một thời điểm. Ba instance **chia nhau** message — **song song** các message **khác nhau**, không phải lần lượt từng message trừ khi chỉ có 1 message trong queue.

Liên quan: [at-least-once.md](./at-least-once.md) · [index.md](./index.md) · [../aws/sqs.md](../aws/sqs.md).

---

## 1. Hình dung nhanh

```
Producer ──► [ msg1 ] [ msg2 ] [ msg3 ] [ msg4 ]  ◄── 1 queue
                    │       │       │
                    ▼       ▼       ▼
               Instance A  B       C   ◄── 3 consumer cùng group/queue

Kết quả:
  msg1 → Instance A
  msg2 → Instance B
  msg3 → Instance C
  msg4 → Instance A (hoặc B/C — ai rảnh poll trước)

❌ KHÔNG phải: msg1 → A, B, C cùng lúc
```

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **Competing consumers** | Nhiều worker **cùng tranh** message từ **1 queue** — ai nhận trước xử lý |
| **Load balancing** | Queue **phân phối** job — scale throughput |
| **Khác Pub/Sub fan-out** | Pub/Sub: 1 message → **nhiều subscriber** (SNS → 3 queue) |

---

## 2. Một message — một instance (work queue)

### 2.1. Luồng thời gian

```
t=0   Queue: [msg1, msg2, msg3]

t=1   Instance A poll → nhận msg1 (msg1 ẩn khỏi queue — in-flight)
      Instance B poll → nhận msg2
      Instance C poll → nhận msg3

t=2   A xử lý msg1, B xử lý msg2, C xử lý msg3  ← SONG SONG 3 message KHÁC NHAU

t=3   A ack msg1 → msg1 xóa khỏi queue
```

**“Lần lượt”** chỉ xảy ra khi:

```
Queue chỉ có [msg1]  →  1 instance nhận msg1, 2 instance kia idle chờ
```

**“Đồng thời”** = 3 instance xử lý **3 message khác nhau** cùng lúc — **không** phải 3 instance xử lý **cùng 1** message.

### 2.2. Khi nào CẢ 3 nhận CÙNG message?

Chỉ khi **cố ý fan-out** (Pub/Sub), không phải 1 work queue:

```
                    SNS Topic
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
    Queue A         Queue B         Queue C
    (svc A)         (svc B)         (svc C)

→ Cùng event, 3 service KHÁC NHAU — mỗi service 1 bản copy
```

Hoặc Kafka: **3 consumer group khác nhau** cùng đọc 1 topic — mỗi group nhận full stream.

---

## 3. Kafka

### 3.1. Consumer group — 1 message partition → 1 consumer trong group

```
Topic orders (3 partitions)
  P0: [m1, m4]
  P1: [m2, m5]
  P2: [m3, m6]

Consumer Group "order-workers" (3 instances):
  Instance A ← P0
  Instance B ← P1
  Instance C ← P2

→ m1 chỉ Instance A đọc (từ P0)
→ Không có chuyện A,B,C cùng đọc m1
```

| Quy tắc | Mô tả |
|---------|--------|
| 1 partition | Chỉ **1 consumer** trong group đọc tại một thời điểm |
| Nhiều partition | Tối đa **N instance song song** = số partition (thường) |
| 3 instance, 1 partition | **2 instance idle** — không scale |
| 3 consumer **group** khác nhau | Mỗi group nhận **toàn bộ** message (fan-out) |

```typescript
// Cả 3 instance cùng groupId → competing consumers
const consumer = kafka.consumer({ groupId: 'order-workers' });
```

**Ordering:** Thứ tự chỉ đảm bảo **trong 1 partition** — không phải toàn topic.

---

## 4. RabbitMQ

### 4.1. Competing consumers trên 1 queue

```
Producer ──► Queue "order-processing"
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
  Worker 1    Worker 2    Worker 3
  (prefetch)  (prefetch)  (prefetch)

Rabbit round-robin / fair dispatch → 1 message → 1 worker
```

```typescript
channel.prefetch(10); // mỗi worker giữ tối đa 10 unacked

channel.consume('order-processing', handler, { noAck: false });
```

| Cấu hình | Hành vi |
|----------|---------|
| 3 consumer cùng queue name | **Competing** — chia message |
| `prefetch(1)` | Mỗi worker 1 message tại một thời điểm — công bằng |
| 3 queue khác nhau + fanout exchange | **Mỗi queue** nhận **bản copy** — pub/sub |

### 4.2. In-flight

Message đã `deliver` tới Worker 1 **chưa ack** → Worker 2 **không** thấy message đó.

Worker 1 crash → message **redeliver** → Worker 2 hoặc 3 nhận — **vẫn chỉ 1 worker** xử lý lần đó (at-least-once có thể dup nếu ack muộn).

---

## 5. BullMQ

### 5.1. Nhiều Worker — 1 job → 1 worker

```
Redis queue "orders"
       │
  ┌────┼────┐
  ▼    ▼    ▼
Worker Worker Worker
  1      2      3

BullMQ BRPOP / claim job → job123 chỉ Worker 2 nhận
```

```typescript
// 3 process cùng queue name = competing
new Worker('orders', processor, { connection, concurrency: 5 });
// Mỗi process có thể concurrency 5 → tối đa 15 job song song (3 instance × 5)
```

| | Hành vi |
|---|---------|
| 3 instance, `concurrency: 1` | Tối đa **3 job song song** (3 job khác nhau) |
| Cùng job | **Không** giao cho 3 worker |
| Worker stall | Job trả lại → worker khác nhận — vẫn 1 worker/job |
| `jobId` duplicate enqueue | Job **không** vào queue 2 lần — khác với 3 worker cùng xử lý |

---

## 6. AWS SQS (thêm — hay dùng cùng kiến trúc)

```
1 queue ──► 3 ECS task / Lambda poll

ReceiveMessage → message invisible (visibility timeout)
→ instance khác KHÔNG nhận cùng message trong window đó
```

Giống Rabbit/BullMQ — **competing consumers**. Chi tiết: [sqs.md](../aws/sqs.md).

---

## 7. So sánh tổng hợp

| | **1 msg → 3 instance cùng lúc?** | **Scale song song** | **Điều kiện scale** |
|---|----------------------------------|---------------------|---------------------|
| **Kafka** | ❌ (cùng consumer group) | ✅ message khác nhau / partition khác | Số partition ≥ instance |
| **RabbitMQ** | ❌ (cùng queue) | ✅ round-robin | `prefetch`, queue depth |
| **BullMQ** | ❌ (cùng queue name) | ✅ `concurrency` × instance | Redis, worker count |
| **SQS** | ❌ (visibility timeout) | ✅ long polling | Số poller |

---

## 8. Scale & ordering — lưu ý thực tế

### 8.1. Muốn 3 instance xử lý nhanh hơn

```
Cần ≥ 3 message trong queue (hoặc prefetch/concurrency > 1)
1 message + 3 instance → chỉ 1 instance làm, 2 rảnh
```

### 8.2. Muốn thứ tự message

| Broker | Cách |
|--------|------|
| Kafka | 1 partition + 1 consumer — hoặc `key=orderId` cùng partition |
| Rabbit | 1 consumer — hoặc **consistent hash exchange** |
| BullMQ | 1 worker concurrency=1 — hoặc queue riêng per entity |
| SQS FIFO | MessageGroupId — cùng group xử lý tuần tự |

**Scale + ordering:** Kafka partition theo `orderId` — mỗi order tuần tự, nhiều order song song.

### 8.3. Duplicate khi scale

3 instance **không** dup vì cùng message — dup vì **at-least-once** (retry, visibility timeout, rebalance). Cần [inbox](../design-sys/vips/inbox.md) / idempotency.

---

## 9. Sơ đồ kiến trúc bạn mô tả

```
[Service A - producer] ──send──► [Queue]
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              [Service B]       [Service B]       [Service B]
              instance 1        instance 2        instance 3
```

**Đây là competing consumers — đúng pattern scale worker.**

```
Message M1 → chỉ 1 trong 3 instance
Message M2 → instance khác (có thể trùng hoặc khác instance M1)
```

**Không phải:**

```
Message M1 → cả 3 instance cùng xử lý M1
```

Muốn 3 service **khác nhau** cùng nhận 1 event → **SNS fan-out 3 queue** hoặc **3 Kafka consumer group**.

---

## 10. Câu hỏi phỏng vấn

### Q: 3 consumer cùng queue — nhận trùng message không?

> Không. Queue/worker pattern là **competing consumers**: mỗi message giao cho **một** consumer. Ba instance xử lý **song song các message khác nhau**. Cùng message chỉ tới nhiều nơi khi **pub/sub fan-out** (SNS, fanout exchange, nhiều consumer group Kafka).

### Q: Kafka 3 instance sao scale?

> Cùng `groupId`, chia **partition**. Scale tối đa ≈ số partition. 3 instance 10 partition → mỗi instance ~ vài partition.

### Q: BullMQ 3 server chạy worker?

> Cùng tên queue — Redis phân job. `concurrency` mỗi server × số server = job song song tối đa.

---

## 11. Tóm tắt

| Câu hỏi | Trả lời |
|---------|---------|
| 3 instance nhận **cùng 1** message? | **Không** (1 work queue / 1 consumer group) |
| 3 instance làm **cùng lúc**? | **Có** — nhưng là **3 message khác nhau** |
| 1 message trong queue? | **1 instance** xử lý, 2 instance chờ |
| Muốn cả 3 nhận cùng event? | **Fan-out** (SNS, fanout exchange) — không phải 1 queue |

**Công thức nhớ:**

```
1 queue + N worker cùng group  →  1 message : 1 worker (competing)
1 topic + N consumer group     →  1 message : N group (fan-out)
Scale throughput               →  nhiều message + nhiều partition/prefetch
```

# Redis Streams — Khái niệm & ứng dụng

> **Redis Stream** là cấu trúc **append-only log** trong Redis (từ Redis 5.0) — lưu message có **ID tăng dần**, hỗ trợ **consumer group**, **ack**, **replay** — giữa **Pub/Sub** (không persist) và **Kafka** (distributed log quy mô lớn).

Liên quan: [index.md](./index.md) (cache) · [pub-sub.md](./pub-sub.md) · [../mqs/queue-comparison.md](../mqs/queue-comparison.md) · [../mqs/at-least-once.md](../mqs/at-least-once.md)

---

## 1. Stream là gì?

```
Producer                    Redis Stream                    Consumer Group
   │                    ┌─────────────────┐
   │  XADD events *     │ 1728390000-0    │──► consumer A (pending → ack)
   ├───────────────────►│ 1728390001-0    │──► consumer B
   │                    │ 1728390002-0    │──► consumer C
   │                    └─────────────────┘
   │                         append-only
   │                    message KHÔNG mất khi đọc (khác Pub/Sub)
```

| Đặc điểm | Mô tả |
|----------|-------|
| **Append-only log** | Message thêm vào cuối — không sửa message cũ |
| **ID tự động** | `{milliseconds}-{sequence}` — ordering theo thời gian |
| **Persist** | Lưu trên disk (AOF/RDB) — survive restart (nếu bật persistence) |
| **Consumer group** | Nhiều worker chia message — competing consumers |
| **ACK** | Xác nhận đã xử lý — chưa ack → **PEL** (pending) → redelivery |

**Metaphor:** Nhật ký sự kiện ngắn hạn trong Redis — nhẹ hơn Kafka, mạnh hơn Pub/Sub.

---

## 2. Khái niệm cốt lõi

### 2.1 Stream & Entry

- **Stream** = tên log (vd. `events:orders`, `notifications`)
- **Entry** = 1 message — có **ID** + các **field-value** (không phải JSON bắt buộc — thường `data` hoặc nhiều field)

```bash
# Thêm message — * = ID auto
XADD events:orders * orderId 1001 userId 42 action created

# Đọc theo range
XRANGE events:orders - + COUNT 10

# Đọc từ ID cụ thể
XREAD COUNT 5 STREAMS events:orders 0
```

**Entry ID** `1728390123456-0`:
- Phần trước `-`: timestamp ms
- Phần sau: sequence trong cùng ms

### 2.2 Consumer Group

Nhóm consumer **cùng chia** message trong stream — **1 message → 1 consumer** trong group (giống Kafka consumer group / SQS competing).

```bash
# Tạo group (đọc từ đầu stream hoặc $ = chỉ message mới)
XGROUP CREATE events:orders order-workers $ MKSTREAM

# Consumer đọc batch
XREADGROUP GROUP order-workers worker-1 COUNT 10 STREAMS events:orders >

# > = message chưa deliver cho group này
```

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **Consumer group** | Tên nhóm worker (`order-workers`) |
| **Consumer name** | ID instance (`worker-1`, `pod-abc`) |
| **`>`** | Chỉ message **mới**, chưa giao cho group |
| **`0`** | Đọc từ đầu (replay / catch-up) |

### 2.3 ACK & PEL (Pending Entries List)

Sau khi đọc bằng `XREADGROUP`, message vào trạng thái **pending** cho đến khi **XACK**:

```
XREADGROUP → message vào PEL (đang xử lý)
     │
     ├── XACK → xóa khỏi PEL (hoàn tất)
     └── crash / timeout → XPENDING → XCLAIM → consumer khác nhận lại
```

```bash
# Ack sau khi xử lý xong
XACK events:orders order-workers 1728390123456-0

# Xem message treo (chưa ack)
XPENDING events:orders order-workers

# Claim message idle quá lâu (consumer cũ chết)
XCLAIM events:orders order-workers worker-2 60000 1728390123456-0
```

→ Semantics mặc định: **at-least-once** — crash trước ack → message được claim lại → **cần idempotent consumer**. Xem [at-least-once.md](../mqs/at-least-once.md).

### 2.4 Retention & MAXLEN

Stream có thể giới hạn độ dài — tránh đầy RAM:

```bash
# Giữ ~10.000 entry mới nhất (approximate trim nhanh hơn)
XADD events:orders MAXLEN ~ 10000 * field value

# Hoặc XTRIM thủ công
XTRIM events:orders MAXLEN ~ 10000
```

| Cấu hình | Dùng khi |
|----------|----------|
| Không trim | Cần replay ngắn hạn, audit |
| `MAXLEN ~ N` | Event throughput cao, chỉ cần buffer gần đây |
| TTL key (Redis 7.4+) | Stream tự hết hạn theo policy |

---

## 3. So sánh: Stream vs Pub/Sub vs BullMQ vs Kafka

| | **Pub/Sub** | **Redis Stream** | **BullMQ** | **Kafka** |
|--|-------------|------------------|------------|-----------|
| **Persist** | ❌ | ✅ (AOF/RDB) | ✅ (Redis) | ✅ (disk, retention dài) |
| **Consumer offline** | Mất message | Đọc lại từ offset / PEL | Job chờ trong queue | Replay từ offset |
| **Consumer group** | ❌ (broadcast all) | ✅ | ✅ (workers) | ✅ |
| **ACK / retry** | ❌ | ✅ XACK, XCLAIM | ✅ built-in | ✅ commit offset |
| **Replay** | ❌ | ✅ XRANGE / XREAD từ ID | ⚠️ hạn chế | ✅ mạnh nhất |
| **Scale cluster** | Redis cluster | Redis cluster (hash slot 1 key) | 1 Redis | Kafka cluster |
| **Độ phức tạp ops** | Thấp | Trung bình | Thấp (Node) | Cao |
| **Use case** | Signal realtime, WS fan-out | Event buffer, lightweight queue | Job queue Node | Event platform lớn |

```
Pub/Sub:     fire-and-forget — "ai online nghe được thì nghe"
Stream:      log ngắn — "ai offline đọc lại được, cần ack"
BullMQ:      job abstraction — delay, cron, UI dashboard
Kafka:       log dài hạn — nhiều team, replay TB dữ liệu
```

> BullMQ **có thể** dùng Redis Stream làm storage backend — Stream là primitve thấp; Bull là lớp job cao hơn.

---

## 4. Luồng xử lý chuẩn (consumer group)

```
                    ┌─────────────────────────────────────┐
                    │         events:orders               │
                    │  [id-1] [id-2] [id-3] [id-4] ...    │
                    └─────────────────────────────────────┘
                                      │
              XREADGROUP GROUP g1     │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              worker-1           worker-2           worker-3
              id-1, id-4         id-2               id-3
                    │                 │                 │
              process             process             process
                    │                 │                 │
              XACK id-1           XACK id-2           crash
                                                        │
                                              id-3 → PEL
                                                        │
                                              XCLAIM → worker-1
```

---

## 5. Triển khai Node.js (ioredis)

### 5.1 Producer

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function publishOrderEvent(order) {
  const id = await redis.xadd(
    'events:orders',
    'MAXLEN', '~', '50000',  // trim gần đúng 50k entry
    '*',
    'orderId', String(order.id),
    'userId', String(order.userId),
    'action', 'created',
    'payload', JSON.stringify(order),
  );
  return id; // "1728390123456-0"
}
```

### 5.2 Consumer (consumer group)

```javascript
const GROUP = 'order-workers';
const STREAM = 'events:orders';
const CONSUMER = `worker-${process.env.HOSTNAME ?? 'local'}`;

async function ensureGroup() {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '$', 'MKSTREAM');
  } catch (e) {
    if (!String(e.message).includes('BUSYGROUP')) throw e;
  }
}

async function processEntry(id, fields) {
  const map = arrayToObject(fields);
  const order = JSON.parse(map.payload);
  // idempotent: check processed_events trước khi ghi DB
  await handleOrderCreated(order);
  await redis.xack(STREAM, GROUP, id);
}

async function loop() {
  await ensureGroup();
  while (true) {
    const res = await redis.xreadgroup(
      'GROUP', GROUP, CONSUMER,
      'COUNT', '10',
      'BLOCK', '5000',
      'STREAMS', STREAM, '>',
    );
    if (!res) continue;

    for (const [, entries] of res) {
      for (const [id, fields] of entries) {
        try {
          await processEntry(id, fields);
        } catch (err) {
          console.error('Failed', id, err);
          // không XACK → ở PEL → XCLAIM sau idle timeout
        }
      }
    }
  }
}

function arrayToObject(arr) {
  const o = {};
  for (let i = 0; i < arr.length; i += 2) o[arr[i]] = arr[i + 1];
  return o;
}
```

### 5.3 Reclaim pending (worker recovery)

```javascript
// Chạy định kỳ hoặc dedicated reaper pod
async function reclaimStale(minIdleMs = 60_000) {
  const pending = await redis.xpending(STREAM, GROUP, '-', '+', 100);
  for (const [id, , idleMs] of pending) {
    if (idleMs >= minIdleMs) {
      const claimed = await redis.xclaim(
        STREAM, GROUP, CONSUMER,
        minIdleMs, id,
      );
      for (const [entryId, fields] of claimed) {
        await processEntry(entryId, fields);
      }
    }
  }
}
```

---

## 6. Ứng dụng thực tế

### 6.1 Event buffer nhẹ (thay queue đơn giản)

**Khi:** Monolith / microservice nhỏ đã có Redis, cần **async xử lý** (gửi email, cập nhật search index) mà không thêm Kafka/Rabbit.

```
API POST /orders → ghi DB → XADD events:orders
Worker(s) XREADGROUP → xử lý side effect → XACK
```

**Lợi:** Ops đơn giản, persist, competing consumers.  
**Hạn:** Throughput và retention thấp hơn Kafka; 1 stream = 1 Redis key (hot key trên cluster).

---

### 6.2 Decouple service trong cùng Redis infrastructure

```
Order Service ──XADD──► stream:notifications
                              │
Notification Worker ◄──XREADGROUP──┘
```

Tách producer/consumer mà không cần HTTP sync — phù hợp traffic vừa (vài nghìn msg/s tùy Redis).

---

### 6.3 Activity feed / audit trail ngắn hạn

```bash
XADD user:42:activity * type login ip 1.2.3.4
XRANGE user:42:activity - + COUNT 20
```

Timeline hoạt động user — trim `MAXLEN` giữ N event gần nhất.

---

### 6.4 Sensor / IoT ingest buffer

Thiết bị gửi metric → `XADD sensors:temperature * value 23.5 device d1`  
Worker aggregate batch → ghi TimescaleDB/Influx.

Stream đóng vai **buffer** khi DB chậm tạm thời — cần monitor stream length.

---

### 6.5 Reliable workflow thay Pub/Sub

| Pub/Sub | Stream |
|---------|--------|
| WS cluster fan-out signal | ❌ không dùng stream cho WS trực tiếp |
| "Có order mới" tới **đúng 1** worker xử lý | ✅ consumer group |
| Subscriber offline = mất | Offline đọc lại từ last ack |

**Pattern WS:** Kafka/SQS → notification service → **Redis Pub/Sub** tới socket pods (signal). Stream cho **business event**, Pub/Sub cho **realtime relay**. Xem [../mqs/scale.md](../mqs/scale.md).

---

### 6.6 Nền tảng cho BullMQ / custom job queue

BullMQ lưu job metadata trên Redis — có thể dùng Stream structures. Custom worker pool có thể build trực tiếp trên Stream nếu cần control thấp hơn Bull (không cần delay UI dashboard).

---

## 7. Khi nào chọn Stream — khi nào không

### ✅ Nên dùng Redis Stream

- Đã có Redis production, workload **event/job vừa**
- Cần **persist + consumer group + ack** — không đủ Pub/Sub
- Chưa đủ lý do vận hành **Kafka/Rabbit**
- Buffer ngắn hạn, trim `MAXLEN`, replay vài giờ/ngày

### ❌ Không nên (hoặc cẩn thận)

| Tình huống | Lý do |
|------------|-------|
| > ~10–50k msg/s sustained | Redis single-threaded; cân nhắc Kafka |
| Retention nhiều ngày/TB | RAM/disk Redis đắt — Kafka tiered storage |
| Nhiều consumer group độc lập đọc cùng stream lớn | Kafka partition scale tốt hơn |
| Exactly-once end-to-end + DB | Stream = at-least-once — cần idempotent / outbox |
| Multi-region replay | Redis không phải distributed log global |

---

## 8. Best practices & vận hành

```
□ Consumer idempotent — eventId unique, inbox table
□ Luôn XACK sau khi side effect commit (DB transaction xong)
□ XCLAIM / reaper cho message pending quá idle (consumer crash)
□ MAXLEN ~ N hoặc XTRIM — tránh stream phình vô hạn
□ Monitor: XLEN stream, XPENDING count, consumer lag (custom metric)
□ BLOCK trong XREADGROUP — không busy-loop
□ 1 stream hot key — shard nhiều stream (events:orders:0..7) nếu cần
□ Persistence: AOF everysec trở lên cho message critical
□ Không dùng Stream thay cache — mục đích khác (xem index.md)
```

**Consumer lag (tự tính):**

```
lag ≈ XLEN(stream) - số entry đã XACK (hoặc last-delivered-id so với last-generated-id)
```

Alert khi `XLEN` hoặc `XPENDING` tăng liên tục.

---

## 9. Lỗi thường gặp

| Vấn đề | Nguyên nhân | Xử lý |
|--------|-------------|-------|
| Message xử lý 2 lần | Crash trước XACK | Idempotent consumer |
| Message treo mãi | Không XACK, không XCLAIM | Reaper + idle timeout |
| Mất message | Redis không persist + restart | AOF/RDB |
| OOM Redis | Không MAXLEN | Trim + monitor XLEN |
| Duplicate group read | Nhiều consumer cùng tên | Unique consumer name per pod |
| `$` vs `0` khi tạo group | `$` bỏ qua backlog cũ | Chọn `0` nếu cần xử lý history |

---

## 10. Tóm tắt

| Khái niệm | Nhớ nhanh |
|-----------|-----------|
| **Stream** | Append-only log trong Redis |
| **XADD** | Producer ghi event |
| **Consumer group** | Competing consumers — 1 msg → 1 worker |
| **XACK** | Hoàn tất — xóa khỏi PEL |
| **PEL / XCLAIM** | Retry khi worker chết |
| **MAXLEN** | Giới hạn retention |

**Ứng dụng chính:** event buffer nhẹ, async side effect, activity log, IoT buffer, reliable queue khi đã có Redis — **không** thay Kafka cho event platform lớn, **không** thay Pub/Sub cho WS fan-out tức thì.

---

## Liên quan

| File | Nội dung |
|------|----------|
| [pub-sub.md](./pub-sub.md) | Pub/Sub — broadcast, không persist |
| [index.md](./index.md) | Redis cache |
| [../mqs/queue-comparison.md](../mqs/queue-comparison.md) | So sánh messaging |
| [../mqs/interview-design-qa.md](../mqs/interview-design-qa.md) | Câu hỏi Redis Pub/Sub vs payment |
| [../design-sys/vips/inbox.md](../design-sys/vips/inbox.md) | Dedup consumer |

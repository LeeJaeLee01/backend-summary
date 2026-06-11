# So sánh RabbitMQ vs Kafka vs BullMQ

> Bảng so sánh chi tiết ba hệ thống messaging phổ biến trong backend Node.js — **cơ chế**, **khái niệm**, **persistence**, **vận hành**, **xử lý message**.

Liên quan: [index.md](./index.md) · [competing-consumers.md](./competing-consumers.md) · [at-least-once.md](./at-least-once.md) · [exactly-once.md](./exactly-once.md) · [../aws/sqs.md](../aws/sqs.md).

---

## 1. Tổng quan một câu

| | **RabbitMQ** | **Kafka** | **BullMQ** |
|---|--------------|-----------|------------|
| **Là gì** | Message **broker** (AMQP) — queue + routing | **Distributed commit log** (stream) | **Job queue** trên **Redis** (Node.js) |
| **Metaphor** | Bưu điện — gửi thư tới hộp thư đúng địa chỉ | Nhật ký ghi liên tục — đọc từ offset | Hàng đợi việc trong Redis — worker lấy job |
| **Ra đời / stack** | Erlang, enterprise, polyglot | LinkedIn → stream platform | Node.js ecosystem (NestJS hay dùng) |
| **Managed cloud** | Amazon MQ, CloudAMQP | MSK, Confluent, Aiven | Upstash, Redis Cloud + tự host |

---

## 2. Bảng so sánh master (chi tiết)

### 2.1. Bản chất & mô hình dữ liệu

| Tiêu chí | **RabbitMQ** | **Kafka** | **BullMQ** |
|----------|--------------|-----------|------------|
| **Mô hình cốt lõi** | **Queue** + **Exchange** routing | **Topic** = **partition log** (append-only) | **Queue** (Redis list/stream structures) |
| **Đơn vị message** | Message trên queue | **Record** (key, value, offset, timestamp) | **Job** (id, name, data, opts) |
| **Message còn sau consume?** | **Xóa** sau ack (hoặc DLQ) | **Giữ** trên log — retention (ngày/TB) | **Xóa** sau complete / theo `removeOnComplete` |
| **Replay** | ❌ (message đã ack mất) | ✅ đọc lại từ offset cũ | ⚠️ hạn chế — không phải log dài hạn |
| **Ordering** | Queue FIFO (1 consumer) | **Per partition** FIFO | Queue FIFO (1 worker) — hoặc parallel jobs |
| **Pub/Sub** | ✅ fanout exchange, topic exchange | ✅ consumer group độc lập đọc cùng topic | ❌ 1 job → 1 worker (trừ copy queue thủ công) |

### 2.2. Khái niệm & thuật ngữ

| Khái niệm | **RabbitMQ** | **Kafka** | **BullMQ** |
|-----------|--------------|-----------|------------|
| **Producer** | Publisher | Producer | `queue.add()` |
| **Consumer** | Consumer (subscribe queue) | Consumer trong **consumer group** | **Worker** |
| **Routing** | **Exchange** → binding → queue | **Topic** + **partition key** | **Queue name** |
| **Địa chỉ logic** | Queue name, routing key | Topic name | Queue name (`orders`, `emails`) |
| **Nhóm consumer** | Cùng queue name = competing | **Consumer group id** | Cùng queue name = competing |
| **Offset / vị trí đọc** | Không — broker push/pull từng msg | **Offset** per partition per group | Job id trong Redis |
| **Ack** | `basic.ack` / `nack` | **Commit offset** | `moveToCompleted` / fail |
| **DLQ** | **Dead-letter exchange** + queue | Không native — retry topic / app | **Failed** set / `removeOnFail` |
| **Delay / schedule** | **TTL** + DLX, plugin delayed | Không native (dùng app/Kafka Streams) | ✅ `delay`, cron **built-in** |
| **Priority** | ✅ priority queue | ❌ (partition key workaround) | ✅ job priority |

### 2.3. Cơ chế hoạt động

| Tiêu chí | **RabbitMQ** | **Kafka** | **BullMQ** |
|----------|--------------|-----------|------------|
| **Push vs Pull** | **Push** (prefetch) hoặc consumer pull | Consumer **poll** (long poll) | Worker **blocking pop** từ Redis |
| **Broker → consumer** | Deliver message → unacked → ack xóa | Poll batch records → process → commit offset | Claim job → active → complete |
| **Competing consumers** | N consumer cùng queue → 1 msg → 1 consumer | N consumer cùng group → chia **partition** | N Worker cùng queue → 1 job → 1 worker |
| **Fan-out (broadcast)** | Fanout exchange → nhiều queue | N **consumer group** đọc cùng topic | Phải tự `add` nhiều queue hoặc event khác |
| **Routing linh hoạt** | ✅ direct, topic, headers exchange | ⚠️ topic + key → partition | ❌ theo queue name |
| **Backpressure** | `prefetch(n)` giới hạn unacked | `max.poll.records`, pause partition | `concurrency`, rate limiter |
| **Transaction** | Publisher confirm, AMQP txn (ít dùng) | ✅ **Transactional** producer + EOS stream | Redis MULTI — không EOS distributed |

```
RabbitMQ:
  Publisher → Exchange ──routing──► Queue ──► Consumer
                                    │
                              (competing N consumers)

Kafka:
  Producer → Topic (partition 0,1,2...) ──poll──► Consumer Group
            │                                      │
            └── log giữ lại                          └── offset commit

BullMQ:
  queue.add() → Redis ──BRPOP/claim──► Worker (Node.js)
```

### 2.4. Persistence & durability

| Tiêu chí | **RabbitMQ** | **Kafka** | **BullMQ** |
|----------|--------------|-----------|------------|
| **Lưu ở đâu** | Disk (queue) + memory | **Disk log** mọi partition (page cache) | **Redis** (RAM, optional AOF/RDB) |
| **Message durable** | `deliveryMode: 2` + **durable queue** | Mặc định persistent (replication) | Phụ thuộc Redis persistence |
| **Broker restart** | Durable queue → message còn | Log replicate → còn | AOF/RDB → có thể còn; pure RAM → mất |
| **Replication** | **Mirror queue** (classic) / **Quorum queue** (Raft) | **ISR replicas** per partition | Redis Sentinel / Cluster |
| **Retention** | Đến khi consumer ack / DLQ | **Theo thời gian / size** (7 ngày default) | Job complete → xóa (config) |
| **Throughput disk** | Tốt — không phải log vô hạn | **Rất cao** — sequential write | Giới hạn Redis memory/network |
| **Rủi ro mất data** | Non-durable queue, `noAck` | `acks=all`, min ISR | Redis crash không AOF, `maxmemory` eviction |

### 2.5. Delivery semantics

| Semantics | **RabbitMQ** | **Kafka** | **BullMQ** |
|-----------|--------------|-----------|------------|
| **At-least-once** | Manual ack sau process | Commit offset sau process | Retry on fail |
| **At-most-once** | `noAck: true` | Commit trước process | `attempts: 1` |
| **Exactly-once** | ❌ → idempotent app | ✅ **EOS** Kafka→Kafka txn | ❌ → `jobId` + idempotent |
| **Duplicate khi** | Crash trước ack | Crash trước commit offset | Stall, retry, worker crash |
| **Chi tiết** | [at-least-once.md](./at-least-once.md) | [exactly-once.md](./exactly-once.md) | [exactly-once.md](./exactly-once.md) |

### 2.6. Xử lý message (lifecycle)

| Bước | **RabbitMQ** | **Kafka** | **BullMQ** |
|------|--------------|-----------|------------|
| **1. Gửi** | `publish` → exchange | `send` → partition | `Queue.add(name, data, opts)` |
| **2. Lưu** | Queue (RAM/disk) | Append partition log | Redis structure |
| **3. Nhận** | `consume` callback | `poll` / `eachMessage` | Worker processor fn |
| **4. In-flight** | Unacked trên consumer | Polled chưa commit offset | Status `active` |
| **5. Thành công** | `ack` → xóa khỏi queue | `commit offset` | `moveToCompleted` |
| **6. Thất bại** | `nack` requeue / DLX | Không commit → đọc lại | `moveToFailed` / retry backoff |
| **7. Retry** | Requeue, DLQ, TTL | App hoặc seek offset | `attempts`, `backoff` built-in |
| **8. Timeout** | Consumer timeout, TTL | `max.poll.interval.ms` | `lockDuration`, stalled job |

### 2.7. Scale & performance

| Tiêu chí | **RabbitMQ** | **Kafka** | **BullMQ** |
|----------|--------------|-----------|------------|
| **Scale throughput** | Thêm consumer (competing) | Thêm **partition** + consumer | Thêm Worker instance + `concurrency` |
| **Giới hạn scale ngang** | Queue single-thread feel; cluster | **Rất cao** — partition bound | Redis single-thread + memory |
| **Message size** | Khuyến nghị < 1MB | Default 1MB (config max) | JSON trong Redis — nhỏ |
| **Latency** | **Thấp** ms — queue classic | ms–vài trăm ms (batch poll) | **Rất thấp** (local Redis) |
| **Use case throughput** | 10k–100k msg/s (cluster) | **Triệu** msg/s | 10k–100k jobs/s (tùy Redis) |
| **Ordering + scale** | 1 queue 1 consumer = order | **Key → partition** = order per key | 1 queue + concurrency=1 |

### 2.8. Vận hành (operations)

| Tiêu chí | **RabbitMQ** | **Kafka** | **BullMQ** |
|----------|--------------|-----------|------------|
| **Độ phức tạp ops** | Trung bình | **Cao** (ZK/KRaft, broker, partition) | **Thấp** (nếu đã có Redis) |
| **Monitoring** | Management UI, prometheus | JMX, Burrow, Confluent | Bull Board, Redis metrics |
| **Cluster** | RabbitMQ cluster / quorum | Kafka cluster + controller | Redis Sentinel/Cluster |
| **Upgrade / rolling** | Cần care mirror/quorum | Broker rolling, protocol version | Redis + app deploy |
| **Local dev** | Docker 1 container | Docker compose (nặng hơn) | Redis + Node — **nhẹ nhất** |
| **Multi-language** | ✅ mọi ngôn ngữ (AMQP) | ✅ mọi ngôn ngữ | **Chủ yếu Node.js** |

### 2.9. Tích hợp NestJS / Node.js

| | **RabbitMQ** | **Kafka** | **BullMQ** |
|---|--------------|-----------|------------|
| **Package** | `@nestjs/microservices`, `amqplib` | `@nestjs/microservices`, `kafkajs` | `@nestjs/bullmq`, `bullmq` |
| **Pattern** | Transport RMQ, RPC optional | Transport Kafka, event log | `@Processor()`, `@Process()` |
| **Phù hợp** | Microservice RPC + async job | Event streaming, high volume | Background job, cron, delay |
| **Demo repo** | — | [kafka-exactly-once](../demo/kafka-exactly-once/) | — |

---

## 3. Kiến trúc chi tiết từng hệ

### 3.1. RabbitMQ

```
                    ┌─────────────┐
                    │  Exchange   │
                    │ direct/topic│
                    │ fanout      │
                    └──────┬──────┘
           binding   │      │      binding
              ┌──────┘      │      └──────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Queue A  │  │ Queue B  │  │ Queue C  │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
          Consumer       Consumer       Consumer
          (email)        (inventory)    (audit)
```

**Đặc trưng:**
- Message **routing** linh hoạt — không cần biết queue đích lúc publish (topic exchange + routing key)
- Queue **xóa message** sau ack — không replay
- **Work queue** = nhiều consumer cùng queue

### 3.2. Kafka

```
Topic: orders
├── Partition 0: [0][1][2][3]...
├── Partition 1: [0][1][2]...
└── Partition 2: [0][1]...

Consumer Group "processors":
  Instance A ← P0
  Instance B ← P1
  Instance C ← P2

Consumer Group "analytics":  ← fan-out group khác
  Instance X ← P0,P1,P2 (chia partition)
```

**Đặc trưng:**
- **Log** — consumer tự quản **offset**
- **Retention** — analytics có thể đọc lại lịch sử
- **Scale** = thêm partition
- **Key** cùng `orderId` → cùng partition → ordering

### 3.3. BullMQ

```
                    Redis
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Queue:orders   Queue:emails   Queue:reports
        │             │             │
   Worker×3       Worker×2       Worker×1
   (NestJS)       (NestJS)       (NestJS)
```

**Đặc trưng:**
- **Không phải broker độc lập** — Redis là storage
- **Job** có lifecycle: waiting → active → completed/failed
- **UI** Bull Board — dev friendly
- **Cron, delay, flow** — tính năng job queue sẵn

---

## 4. Khi nào chọn cái nào?

| Tình huống | Chọn | Lý do |
|------------|------|-------|
| Background job Node (email, PDF, resize) | **BullMQ** | Delay, retry, cron, DX tốt, đã có Redis |
| Microservice async, routing phức tạp | **RabbitMQ** | Exchange, DLQ mature, latency thấp |
| Event streaming, audit log, replay | **Kafka** | Log retention, throughput, nhiều consumer group |
| Order events → 5 service khác nhau | **Kafka** hoặc **Rabbit fanout** | Fan-out; Kafka nếu cần replay |
| RPC sync giữa service (request/reply) | **RabbitMQ** | AMQP reply queue pattern |
| Throughput cực cao (triệu/s) | **Kafka** | Partition log |
| Team nhỏ, monolith NestJS | **BullMQ** | Ít infra |
| AWS native, không tự host | **SQS/SNS** (xem [sqs.md](../aws/sqs.md)) | Managed |
| Exactly-once Kafka pipeline | **Kafka** txn | EOS native stream |
| Task 5 phút, cron hàng đêm | **BullMQ** | Scheduled job built-in |

### 4.1. Không nên chọn khi

| | **Tránh RabbitMQ** | **Tránh Kafka** | **Tránh BullMQ** |
|---|-------------------|-----------------|------------------|
| | Cần replay lịch sử dài | Job queue đơn giản, vài trăm msg/s | Multi-language stack chính |
| | Log analytics petabyte | Team không có ops Kafka | Message phải survive Redis mất |
| | | RPC đơn giản, routing phức tạp AMQP hơn | Throughput log-level Kafka |

---

## 5. Pattern kết hợp thực tế

```
E-commerce NestJS:

  API ──► BullMQ (send email, generate invoice)     ← job nội bộ nhanh
  API ──► Outbox ──► Kafka (order.placed)           ← event domain, replay
  Kafka ──► Inventory MS, Analytics MS              ← fan-out consumer group
  Legacy ──► RabbitMQ (đối tác webhook routing)     ← routing key per partner
```

| Pattern | Broker |
|---------|--------|
| Outbox → event bus | Kafka / Rabbit / SQS |
| Competing workers | Cả 3 — xem [competing-consumers.md](./competing-consumers.md) |
| Inbox dedup consumer | App layer — mọi broker |
| Saga choreography | Kafka / Rabbit events |

---

## 6. Bảng troubleshooting nhanh

| Triệu chứng | RabbitMQ | Kafka | BullMQ |
|-------------|----------|-------|--------|
| Message mất | `noAck`, non-durable | Commit trước process | Redis không persist |
| Duplicate | Crash trước ack | Rebalance, commit sau process | Retry, stall |
| Consumer không nhận | Binding sai, queue name | Sai group, offset cuối | Sai queue name |
| Queue backlog dài | Thêm consumer | Thêm partition + consumer | Thêm worker |
| Message out of order | Nhiều consumer 1 queue | Cross-partition normal | `concurrency` > 1 |
| Memory đầy | Queue RAM, lazy queue | Log retention | Redis `maxmemory` |

---

## 7. So sánh với AWS SQS (tham chiếu)

| | **SQS** | **RabbitMQ** | **Kafka** | **BullMQ** |
|---|---------|--------------|-----------|------------|
| Managed | ✅ AWS | Tự host / Amazon MQ | MSK | Redis managed |
| Fan-out | Cần SNS | Exchange | Consumer groups | Manual |
| Replay | ❌ | ❌ | ✅ | ❌ |
| Delay queue | ✅ | Plugin/TTL | ❌ | ✅ |
| Ops | Thấp nhất | Trung bình | Cao | Thấp (Redis) |

---

## 8. Câu hỏi phỏng vấn

### Q: Khác nhau cơ bản RabbitMQ vs Kafka?

> RabbitMQ là **message broker** — route tới queue, xóa sau ack, latency thấp, routing linh hoạt. Kafka là **commit log** — giữ message, consumer đọc theo offset, replay được, throughput cao, fan-out qua consumer group.

### Q: BullMQ có thay Kafka không?

> **Không.** BullMQ là **job queue trên Redis** cho worker Node — delay, cron, retry. Kafka là **event streaming platform** — retention, replay, scale triệu event. Khác mục tiêu.

### Q: 3 instance consumer — ai nhận message?

> Cả 3 đều **competing** — 1 message → 1 instance. Chi tiết [competing-consumers.md](./competing-consumers.md).

### Q: Chọn gì cho NestJS background job?

> **BullMQ** nếu đã có Redis. Chọn **Rabbit/Kafka** khi tách microservice hoặc cần event bus durable cross-team.

---

## 9. Tóm tắt một dòng

| | **RabbitMQ** | **Kafka** | **BullMQ** |
|---|--------------|-----------|------------|
| **Một câu** | Smart router + queue, ack xóa | Distributed log, offset, replay | Redis job queue cho Node |
| **Mạnh nhất** | Routing, RPC, DLQ, latency | Throughput, replay, stream | DX, delay, cron, NestJS |
| **Yếu nhất** | Replay, log analytics | Ops phức tạp, routing đơn giản hơn AMQP | Redis bound, không stream |

**Công thức nhớ:**

```
Job nội bộ Node + Redis     →  BullMQ
Route + RPC + DLQ           →  RabbitMQ
Event log + replay + scale  →  Kafka
AWS managed, ít ops         →  SQS/SNS
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [competing-consumers.md](./competing-consumers.md) | 3 instance — 1 message ai nhận |
| [at-least-once.md](./at-least-once.md) · [exactly-once.md](./exactly-once.md) | Delivery semantics |
| [../design-sys/vips/outbox.md](../design-sys/vips/outbox.md) | Publish event an toàn |
| [../demo/kafka-exactly-once/](../demo/kafka-exactly-once/) | Demo Kafka EOS |

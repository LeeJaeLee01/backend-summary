# Message Queue — Câu hỏi phỏng vấn & thiết kế thực chiến

> Bộ câu hỏi **hiểu lý thuyết → áp dụng production**: Kafka, RabbitMQ, SQS, BullMQ, delivery semantics, scale, pattern Outbox/Inbox/Saga.

Mỗi câu có **đáp án ngắn** + **hệ quả thực tế**. Tự kiểm tra: che đáp án, trả lời to, rồi đối chiếu.

Liên quan: [index.md](./index.md) · [competing-consumers.md](./competing-consumers.md) · [at-least-once.md](./at-least-once.md) · [exactly-once.md](./exactly-once.md) · [queue-comparison.md](./queue-comparison.md) · [scale.md](./scale.md)

---

## Cách dùng file này

| Mức | Ký hiệu | Ai nên thuộc |
|-----|---------|--------------|
| Cơ bản | 🟢 | Junior — hiểu khái niệm, trả lời được trong team |
| Trung bình | 🟡 | Mid — thiết kế service, debug production |
| Nâng cao | 🔴 | Senior — trade-off, incident, scale |

---

## 1. Kafka — Partition & Consumer Group

### 🟢 Q1.1
**3 consumer cùng group, topic 6 partition — mỗi instance nhận mấy partition?**

**Đáp án:** Mỗi instance **2 partition** (phân bổ đều: 2–2–2).

**Thực tế:** Throughput scale tối đa khi `số consumer trong group ≤ số partition`. Thêm consumer thứ 7 → 1 instance idle.

---

### 🟢 Q1.2
**4 consumer cùng group, topic 6 partition — phân bổ thế nào?**

**Đáp án:** Thường **2 + 2 + 1 + 1** (Kafka chia gần đều, không nhất thiết đối xứng tuyệt đối).

**Thực tế:** Instance nhận 1 partition có thể là bottleneck nếu partition đó hot (skew key).

---

### 🟡 Q1.3
**8 consumer cùng group, topic 6 partition — chuyện gì xảy ra?**

**Đáp án:** **6 consumer** có partition, **2 consumer idle** (không nhận partition nào).

**Thực tế:** Scale pod consumer vượt partition là lãng phí tiền — tăng partition trước (có kế hoạch, khó giảm sau).

---

### 🟡 Q1.4
**Payment và Notification cùng đọc topic `orders` — cần mấy consumer group?**

**Đáp án:** **2 consumer group** (`payment-service`, `notification-service`). Mỗi group có offset riêng, đọc độc lập.

**Thực tế:** Đây là fan-out “miễn phí” trên Kafka — khác Rabbit (cần fanout exchange → nhiều queue) hoặc SQS (cần SNS → nhiều queue).

---

### 🟡 Q1.5
**Muốn mọi event của `userId=42` có thứ tự — làm gì?**

**Đáp án:** Dùng **`userId` làm message key** → cùng key → cùng partition → ordering **trong partition**.

**Thực tế:**
- Ordering **chỉ per-partition**, không global toàn topic.
- Key skew: 1 user siêu hot → 1 partition quá tải.
- Producer retry + `max.in.flight > 1` không idempotent có thể đảo thứ tự — bật `enable.idempotence=true`.

---

### 🔴 Q1.6
**Topic 12 partition, key hash đều — vẫn thấy 1 partition lag cao hơn hẳn. Vì sao?**

**Đáp án:** **Hot key** — nhiều message cùng key (vd. `tenantId=1`, `country=US`) dồn vào 1 partition.

**Thực tế:** Composite key (`tenantId + shard`), salt key, hoặc tách topic theo tenant lớn.

---

### 🟡 Q1.7
**Rebalance xảy ra khi nào? Deploy rolling 3→4 consumer có sao?**

**Đáp án:** Thêm/bớt consumer, session timeout, partition thay đổi → **rebalance** — partition gán lại, consumer pause ngắn.

**Thực tế:**
- Duplicate tạm thời nếu commit chưa xong mà rebalance.
- `static membership` (`group.instance.id`) giảm rebalance khi restart pod.
- Deploy nên stagger hoặc dùng cooperative sticky assignor.

---

## 2. Kafka — Offset & Delivery Semantics

### 🟡 Q2.1
**Consumer crash sau xử lý nhưng trước commit offset — chuyện gì xảy ra?**

**Đáp án:** **At-least-once** — message được **xử lý lại** (redelivery) → **duplicate**.

**Thực tế:** Consumer **bắt buộc idempotent** — `processed_events` table, `eventId` unique, inbox pattern. Xem [at-least-once.md](./at-least-once.md).

---

### 🟡 Q2.2
**Commit offset trước khi xử lý xong — trade-off gì?**

**Đáp án:** **At-most-once** — crash sau commit → **mất message** (không xử lý lại).

**Thực tế:** Chỉ dùng metric, log, telemetry — không dùng order/payment. Xem [at-most-once.md](./at-most-once.md).

---

### 🟡 Q2.3
**Auto-commit mỗi 5 giây — rủi ro gì?**

**Đáp án:** Có thể commit offset khi message **chưa xử lý xong** (hoặc ngược lại) → mất hoặc trùng không kiểm soát.

**Thực tế:** Production dùng **manual commit** sau khi xử lý + ghi DB (hoặc transactional).

---

### 🔴 Q2.4
**Xử lý batch 100 message, commit 1 lần cuối — message 50 crash — mất bao nhiêu?**

**Đáp án:** Reprocess **cả batch** (hoặc từ offset chưa commit) → message 1–49 **xử lý lại** nếu đã xử lý trước crash.

**Thực tế:** Batch nhỏ hơn, commit per-message (chậm hơn), hoặc idempotent + mark từng `eventId` trong DB cùng transaction.

---

### 🔴 Q2.5
**“Exactly-once” Kafka + ghi Postgres — có thật sự EOS không?**

**Đáp án:** **Không end-to-end** — Kafka EOS chủ yếu **stream-to-stream** (consume → produce + commit trong transaction Kafka). Ghi DB = **effectively-once** = at-least-once + **idempotent consumer**.

**Thực tế:** Outbox pattern hoặc inbox dedup. Demo: `demo/kafka-exactly-once/`. Xem [exactly-once.md](./exactly-once.md).

---

### 🟡 Q2.6
**Consumer lag = 50,000 — nghĩa là gì? Làm gì?**

**Đáp án:** Consumer **chậm hơn producer** 50k message (theo offset diff). Scale consumer (nếu còn partition), tối ưu xử lý, tăng partition (cần plan), hoặc chấp nhận delay.

**Thực tế:** Alert lag > threshold; kiểm tra slow query downstream, poison message, rebalance loop.

---

## 3. Kafka — Producer & Replication

### 🟡 Q3.1
**`acks=1`, leader chết trước khi follower kịp sync — mất data không?**

**Đáp án:** **Có thể mất** — message đã ack cho producer nhưng chưa replicate đủ.

**Thực tế:** Production dùng `acks=all` + `min.insync.replicas=2` (RF=3). Trade-off latency tăng nhẹ.

---

### 🟢 Q3.2
**`acks=0` dùng khi nào?**

**Đáp án:** Fire-and-forget — metric, log không critical. **Mất message** khi broker down, không biết fail.

**Thực tế:** Hầu hết business event không dùng `acks=0`.

---

### 🟡 Q3.3
**Producer retry mà không bật idempotent — vấn đề gì?**

**Đáp án:** **Duplicate trên broker** — cùng message ghi 2 lần vào log.

**Thực tế:** `enable.idempotence=true` (Kafka ≥ 0.11) — PID + sequence number.

---

### 🟡 Q3.4
**RF=3, `min.insync.replicas=1`, `acks=all` — an toàn không?**

**Đáp án:** **Yếu** — chỉ cần leader sync là ack; leader chết với 1 replica có thể mất data chưa replicate đủ.

**Thực tế:** `min.insync.replicas=2` với RF=3 là baseline production.

---

### 🔴 Q3.5
**Gửi 1000 msg/s, partition=3 — có đảm bảo 1000 msg/s throughput consume không?**

**Đáp án:** **Không chắc** — phụ thuộc consumer xử lý, số instance, skew partition, commit strategy.

**Thực tế:** Load test; partition count ≈ target parallel consumer; monitor p99 process time.

---

## 4. Kafka — Thiết kế & Vận hành

### 🟡 Q4.1
**Topic `delete` retention 7 ngày vs `compact` — chọn khi nào?**

**Đáp án:**
- **Delete:** event stream (`order.created`, audit) — giữ theo thời gian.
- **Compact:** changelog theo key (`user-profile` — chỉ cần giá trị mới nhất mỗi key).

**Thực tế:** Compact không thay delete cho event sourcing đầy đủ — cần hiểu mất history.

---

### 🟡 Q4.2
**Kafka có DLQ sẵn không? Message lỗi 10 lần làm sao?**

**Đáp án:** **Không native** — app tự implement: retry topic → DLT topic, hoặc skip + alert + manual replay.

**Thực tế:** Parse error → DLT ngay; business error → retry với backoff; poison message không block cả partition (tách handler, try/catch per message).

---

### 🟡 Q4.3
**Cần replay event tuần trước cho service mới — Kafka làm được không?**

**Đáp án:** **Có** — consumer group mới (hoặc reset offset) đọc từ offset cũ trong retention.

**Thực tế:** Retention phải còn; replay có thể gấp đôi side effect — service mới phải idempotent hoặc chỉ đọc.

---

### 🔴 Q4.4
**Order service ghi DB + publish Kafka — crash giữa 2 bước?**

**Đáp án:** **Inconsistent** — có order không event, hoặc event không order (hiếm nếu publish trước).

**Thực tế:** **Transactional Outbox** — ghi `outbox` cùng transaction DB → worker publish. Xem [design-sys/vips/saga.md](../design-sys/vips/saga.md).

---

### 🔴 Q4.5
**48 partition, muốn giảm xuống 24 — được không?**

**Đáp án:** **Không giảm trực tiếp** — Kafka không hỗ trợ giảm partition. Tạo topic mới + migrate.

**Thực tế:** Plan partition count sớm; tăng được, giảm khó.

---

## 5. RabbitMQ

### 🟢 Q5.1
**3 worker cùng subscribe queue `orders` — 1 message đi đâu?**

**Đáp án:** **1 worker** nhận (competing consumers). Xem [competing-consumers.md](./competing-consumers.md).

---

### 🟡 Q5.2
**Muốn Payment và Notification cùng nhận `order.created` — cấu hình Rabbit thế nào?**

**Đáp án:** **Fanout exchange** (hoặc topic) → **2 queue riêng** → mỗi service 1 queue.

**Thực tế:** Khác Kafka (2 consumer group, 1 topic).

---

### 🟡 Q5.3
**`prefetch=100`, worker chậm — hậu quả?**

**Đáp án:** 100 message **unacked** treo trên worker chậm — worker khác **đói** (Rabbit push, không chia đều round-robin tốt khi unacked pile).

**Thực tế:** `prefetch` thấp hơn (10–50), scale worker, DLQ cho message lỗi.

---

### 🟡 Q5.4
**`noAck: true` — semantics gì?**

**Đáp án:** **At-most-once** — message xóa khi deliver, crash = mất.

---

### 🔴 Q5.5
**Queue dài vô hạn, consumer chết 1 tuần — chuyện gì xảy ra?**

**Đáp án:** Message **tích tụ** — disk đầy, memory alarm, broker chậm/ crash.

**Thực tế:** TTL, max-length queue, DLQ, monitor queue depth, alert.

---

## 6. AWS SQS

### 🟢 Q6.1
**Standard SQS — ordering thế nào?**

**Đáp án:** **Không đảm bảo** FIFO toàn queue — best-effort.

**Thực tế:** Cần thứ tự → **FIFO queue** + `MessageGroupId`.

---

### 🟡 Q6.2
**Visibility timeout 30s, xử lý mất 2 phút — sao?**

**Đáp án:** Message **hiện lại** trên queue sau 30s → **consumer khác xử lý** → **duplicate** đang xử lý song song.

**Thực tế:** Visibility ≥ p99 process time; **heartbeat** extend visibility (ChangeMessageVisibility).

---

### 🟡 Q6.3
**SQS FIFO + exactly-once?**

**Đáp án:** **Exactly-once processing** (dedup window 5 phút) — không phải EOS distributed toàn hệ thống. Vẫn cần idempotent downstream.

---

### 🟡 Q6.4
**1 SNS topic → 3 SQS queue — 1 message publish, mấy queue nhận?**

**Đáp án:** **Cả 3** (fan-out). Mỗi queue = 1 subscriber độc lập.

---

### 🔴 Q6.5
**Lambda trigger SQS, batch 10, 1 message fail — cả batch retry?**

**Đáp án:** Với **partial batch failure** (report `batchItemFailures`) — chỉ retry message lỗi. Không config → cả batch có thể retry.

**Thực tế:** Bật `ReportBatchItemFailures`, idempotent handler.

---

## 7. BullMQ / Redis Queue

### 🟢 Q7.1
**BullMQ khác Kafka chủ yếu ở đâu?**

**Đáp án:** **Job queue** trên Redis — xóa sau complete, không replay log dài, stack Node.js, delay/cron built-in.

**Thực tế:** Email, resize image, cron — BullMQ. Event bus scale lớn, replay — Kafka. Xem [queue-comparison.md](./queue-comparison.md).

---

### 🟡 Q7.2
**3 Worker cùng queue Bull — 1 job đi đâu?**

**Đáp án:** **1 worker** (giống competing consumers).

---

### 🟡 Q7.3
**Redis restart mất persistence — Bull job mất không?**

**Đáp án:** Phụ thuộc **AOF/RDB** — không persist = **mất job** đang queue.

**Thực tế:** Redis persistence + job critical → cân nhắc SQS/Kafka thay vì Bull thuần.

---

### 🟡 Q7.4
**Cùng `jobId` add 2 lần — chuyện gì xảy ra?**

**Đáp án:** Bull có thể **dedup theo jobId** (nếu cấu hình) — job thứ 2 bỏ qua hoặc fail tùy option.

**Thực tế:** Dùng `jobId: orderId` cho idempotent enqueue.

---

## 8. Delivery Semantics — Chung

### 🟢 Q8.1
**Order/payment nên chọn at-most-once hay at-least-once?**

**Đáp án:** **At-least-once** + idempotent — không chấp nhận mất tiền.

---

### 🟡 Q8.2
**Idempotent consumer nghĩa là gì? Cho ví dụ.**

**Đáp án:** Xử lý cùng `eventId` 2 lần → kết quả như 1 lần.

```sql
INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING;
-- chỉ business logic nếu insert thành công
```

**Thực tế:** Unique key `payment_id`, status machine (`pending → paid` ignore duplicate).

---

### 🟡 Q8.3
**Inbox pattern dùng khi nào?**

**Đáp án:** Consumer nhận message từ **nhiều nguồn** / at-least-once — ghi inbox table trước, worker xử lý dedup.

**Thực tế:** Xem [design-sys/vips/inbox.md](../design-sys/vips/inbox.md).

---

### 🔴 Q8.4
**Saga choreography vs orchestration — message queue đóng vai trò gì?**

**Đáp án:**
- **Choreography:** service publish/subscribe event (`order.created` → payment listen).
- **Orchestration:** orchestrator gọi/command từng step.

**Thực tế:** Kafka/Rabbit làm event bus; cần compensating transaction khi fail. Xem [design-sys/vips/saga.md](../design-sys/vips/saga.md).

---

## 9. Chọn công nghệ (System Design)

### 🟡 Q9.1
**Gửi email sau đặt hàng — Kafka hay BullMQ?**

**Đáp án:** Thường **BullMQ/SQS** — job đơn giản, delay, retry, không cần replay 30 ngày.

**Thực tế:** Đã có Kafka trong hệ thống → có thể consume từ topic `orders` — đừng thêm broker chỉ cho email.

---

### 🟡 Q9.2
**Audit log mọi thay đổi, compliance 7 năm — chọn gì?**

**Đáp án:** **Kafka** (retention dài / tiered storage) hoặc DB event store + archive S3 — không BullMQ.

---

### 🟡 Q9.3
**100k event/s, nhiều team consume cùng stream — chọn gì?**

**Đáp án:** **Kafka** — partition scale, nhiều consumer group, replay.

---

### 🟡 Q9.4
**NestJS monolith nhỏ, background job 500/giờ — cần Kafka không?**

**Đáp án:** **Không** — BullMQ đủ, ops nhẹ hơn.

---

### 🔴 Q9.5
**“Dùng Kafka cho mọi thứ” — anti-pattern?**

**Đáp án:** **Có** — ops nặng, overkill cho job queue đơn giản; team chưa đủ skill vận hành cluster.

**Thực tế:** Chọn theo retention, throughput, fan-out, replay — không theo hype.

---

## 10. WebSocket + Message Queue

### 🟡 Q10.1
**Tại sao scale WebSocket khó hơn scale SQS consumer?**

**Đáp án:** WS **stateful** — connection gắn 1 pod; event ở pod khác cần **relay** (Redis adapter).

**Thực tế:** Xem [scale.md](./scale.md).

---

### 🟡 Q10.2
**Order service pod A, user WS ở pod B — push notification thế nào?**

**Đáp án:** `order.placed` → **SQS/Kafka** → notification worker → **Redis Pub/Sub** → WS pod B emit tới socket.

**Thực tế:** Không HTTP trực tiếp pod A → B (không biết user ở đâu).

---

### 🟡 Q10.3
**Redis Pub/Sub mất message khi subscriber offline — dùng cho payment được không?**

**Đáp án:** **Không** — Pub/Sub fire-and-forget, không persist.

**Thực tế:** Payment dùng SQS/Kafka; Redis Pub/Sub chỉ **signal realtime** tới WS cluster.

---

## 11. Incident & Debug (thực tế)

### 🔴 Q11.1
**Consumer lag tăng đột ngột sau deploy — checklist?**

**Đáp án:**
1. Rebalance storm? (quá nhiều restart)
2. Bug chậm / N+1 query mới?
3. Poison message retry vô hạn?
4. Downstream DB timeout?
5. Partition skew?

---

### 🔴 Q11.2
**Duplicate charge 2 lần cùng `orderId` — queue có lỗi không?**

**Đáp án:** Có thể **đúng hành vi at-least-once** — lỗi **thiếu idempotency** ở payment consumer.

**Thực tế:** Fix app (`UNIQUE(order_id)` + check status), không đổi sang at-most-once cho payment.

---

### 🔴 Q11.3
**Message “mất” trên Kafka — khả năng cao nhất?**

**Đáp án:**
1. `acks=0` hoặc `acks=1` + mất leader
2. Retention hết — log bị xóa
3. Consumer commit trước process (at-most-once) — tưởng mất ở broker thật ra đã skip
4. Producer không await error

---

### 🔴 Q11.4
**Toàn bộ consumer group “đứng im”, lag tăng — không error log?**

**Đáp án:** Có thể **`max.poll.interval.ms` exceeded** — xử lý quá lâu giữa 2 lần `poll()` → bị kick khỏi group, rebalance loop.

**Thực tế:** Tăng interval hoặc giảm batch / tối ưu handler; pause partition khi xử lý nặng.

---

## 12. Câu hỏi tình huống (thiết kế end-to-end)

### 🔴 Q12.1
**Thiết kế: User đặt hàng → trừ kho → thanh toán → gửi email. Dùng queue thế nào?**

**Gợi ý đáp án:**
```
POST /orders → DB transaction (order + outbox)
Outbox worker → Kafka topic order.placed
├── Inventory consumer (idempotent reserve)
├── Payment consumer (idempotent charge)
└── Notification → Bull/SQS → send email
```
Fail payment → saga compensate (release stock). Event at-least-once + idempotent mọi bước.

---

### 🔴 Q12.2
**Flash sale 10k order/giây — bottleneck thường gặp?**

**Gợi ý:** DB write primary, inventory hot row, partition skew (`productId` key), consumer chậm, không async hóa.

**Hướng:** Queue buffer, shard inventory, pre-allocate stock trong Redis (cẩn thận consistency), scale partition + consumer.

---

### 🔴 Q12.3
**Multi-tenant SaaS — 1 topic hay topic per tenant?**

**Trade-off:**
- **1 topic + tenant key:** đơn giản, risk hot tenant
- **Topic per tenant lớn:** isolation, ops nặng
- Thường: shared topic + `tenantId` key + rate limit per tenant

---

## 13. Bảng tra nhanh — “Nên nhớ một câu”

| Câu hỏi phỏng vấn | Một câu trả lời |
|-------------------|-----------------|
| 1 message, 3 consumer cùng group? | **1 consumer** nhận |
| Payment + Notification cùng đọc? | **2 consumer group** (Kafka) hoặc **2 queue** (Rabbit) |
| Crash trước commit? | **At-least-once** → duplicate |
| `acks=1` leader die? | **Có thể mất** |
| Order theo userId? | **Cùng partition key** |
| Kafka DLQ? | **Tự làm** — không native |
| SQS xử lý 2 phút, visibility 30s? | **Duplicate** in-flight |
| WS scale? | **Sticky + Redis adapter** |
| EOS Kafka → DB? | **Idempotent** — không magic |
| Chọn Kafka? | Replay, fan-out, throughput cao |

---

## 14. Bài tập mở rộng (tự làm)

```
□ Vẽ sequence diagram: outbox → Kafka → inbox → DB
□ Tính: topic 24 partition, 10 consumer — mỗi instance mấy partition?
□ Viết pseudo idempotent handler cho payment với status machine
□ So sánh fan-out: SNS→3 SQS vs Kafka 3 consumer group — giống/khác
□ Đọc demo demo/kafka-exactly-once/ — EOS áp dụng bước nào?
□ Đọc demo/demo/saga-choreography/ — event bus thay Kafka thế nào?
```

---

*Gợi ý học: trả lời 🟢 trước → 🟡 → 🔴. Mỗi câu 🟡/🔴 nên vẽ thêm diagram 30 giây trên giấy — phỏng vấn system design đánh giá tư duy hình ảnh, không chỉ thuộc lòng.*

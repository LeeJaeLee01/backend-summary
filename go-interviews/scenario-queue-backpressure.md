# Hàng đợi mở rộng mãi khi nhiều user — Xử lý thế nào?

## Tóm tắt một câu

Queue phình vì **producer > consumer** hoặc **spawn worker không giới hạn**. Xử lý: **backpressure** (từ chối/rate limit), **worker pool cố định**, **queue có giới hạn**, scale consumer, **circuit breaker** downstream, monitor depth + lag.

---

## Nguyên nhân

| Nguyên nhân | Triệu chứng |
|-------------|-------------|
| Mỗi request spawn goroutine/job mới | Memory tăng, GC pressure |
| Consumer chậm (DB, API) | Queue depth tăng tuyến tính |
| Không giới hạn queue size | OOM khi spike |
| Thundering herd sau deploy | Spike đồng thời |

---

## Giải pháp (theo tầng)

### 1. Backpressure — không nhận thêm khi quá tải

- HTTP **503** + `Retry-After` khi queue > threshold.
- **Rate limit** per user/IP (token bucket).
- **Admission control** — max concurrent request server.

### 2. Worker pool cố định

- Tối đa **N worker** xử lý song song (vd. 5–50 tùy DB pool).
- Job vào **bounded buffer channel** — producer block khi đầy (tự động slow down).

```go
jobs := make(chan Job, 1000) // bounded
for i := 0; i < maxWorkers; i++ {
    go worker(jobs)
}
```

Xem: [go-defer-channel.md](./go-defer-channel.md), [demo/race-condition/worker_pool.go](./demo/race-condition/worker_pool.go).

### 3. Message queue bền vừa

- RabbitMQ / Redis Stream — consumer **prefetch** giới hạn unacked.
- **DLQ** cho job fail lặp — không block queue chính.
- Scale consumer horizontal (nhiều pod cùng consumer group).

### 4. Scale & optimize consumer

- Tối ưu query, cache, connection pool.
- Batch processing thay từng record.

### 5. Degrade gracefully

- Ưu tiên user premium / critical path.
- Tắt feature không critical khi overload.

### 6. Observability

- Metric: `queue_depth`, `processing_lag`, `reject_rate`.
- Alert khi depth > N trong 5 phút.

---

## Luồng mong muốn

```
Spike traffic → rate limit một phần → bounded queue → fixed workers
              → scale consumer nếu depth cao kéo dài
              → 503 có kiểm soát thay vì OOM
```

---

## Câu trả lời ngắn (phỏng vấn)

Không spawn unbounded goroutine. Worker pool + bounded queue + backpressure (503/rate limit). Queue broker với prefetch và DLQ. Scale consumer, tối ưu downstream. Monitor queue depth và lag.

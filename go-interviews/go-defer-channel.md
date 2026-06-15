# `defer`, Channel & Worker pool trong Go

> Demo: [demo/go-concurrency](./demo/go-concurrency/) · Worker pool: [demo/race-condition](./demo/race-condition/)

## Tóm tắt một câu

`defer` chạy khi function **return** (LIFO), không đảm bảo chạy nếu goroutine **không bao giờ return**. **Channel** điều phối goroutine (ownership, backpressure). **Worker pool** giới hạn concurrency — tránh spawn vô hạn khi tải cao.

---

## `defer` trong goroutine

### `defer` hoạt động thế nào?

- Đăng ký cleanup chạy khi **function chứa `defer` kết thúc** (return hoặc panic).
- Thứ tự: **LIFO** (defer cuối chạy trước).
- Tham số của `defer fn(x)` được **evaluate ngay** lúc đăng ký, không phải lúc chạy.

```go
func example() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    // in: 2 rồi 1
}
```

### Bẫy khi `defer` trong goroutine

| Bẫy | Vì sao |
|-----|--------|
| `defer` trong goroutine không chạy | Goroutine block mãi (channel, lock) → function không return |
| `defer mu.Unlock()` sau `go func()` | Goroutine con unlock — race với goroutine khác |
| Quá nhiều `defer` trong loop | Mỗi lần lặp stack defer tăng — dùng function riêng |
| `defer close(ch)` sai chỗ | Chỉ **sender/owner** close; double close panic |

**Đúng:** cleanup trong goroutine nên gắn với **lifecycle rõ** — `defer` trong goroutine đó, kèm `context` cancel.

```go
go func() {
    defer wg.Done()
    defer cleanup()
    // ...
}()
```

### `defer` + panic

`defer` vẫn chạy khi panic (trước khi propagate). Dùng `recover()` trong defer để bắt panic **trong cùng goroutine**.

---

## Channel

### Mục đích

Giao tiếp an toàn giữa goroutine — **"đừng share memory, hãy share memory bằng cách giao tiếp"**.

| Loại | Đặc điểm |
|------|----------|
| **Unbuffered** | Gửi block đến khi có receiver — sync point |
| **Buffered** | Gửi block khi buffer đầy — decouple tốc độ |

### Pattern hay dùng

| Pattern | Code ý tưởng |
|---------|--------------|
| **Worker pool** | `jobs chan T` + N worker goroutine |
| **Semaphore** | `sem := make(chan struct{}, N)` — acquire/release |
| **Done / cancel** | `ctx.Done()` hoặc `close(done)` broadcast |
| **Fan-in** | N goroutine gửi vào 1 channel, 1 goroutine merge |
| **Fan-out** | 1 producer, N consumer |

### Quy tắc

- **Sender close** channel (receiver không close).
- `range ch` chạy đến khi channel đóng và buffer rỗng.
- `select` + `default` cho non-blocking; `select` + `ctx.Done()` cho timeout.
- Không dùng channel thay Mutex khi chỉ cần lock biến đơn giản.

---

## Worker pool — giới hạn concurrency

### Vấn đề

Nhiều request → mỗi request `go process()` → hàng nghìn goroutine + connection DB/API → OOM, queue phình, downstream sập.

### Giải pháp

Cố định **N worker** (vd. 5), job đưa vào queue:

```go
jobs := make(chan Job, backlog)
for i := 0; i < 5; i++ {
    go func() {
        for j := range jobs {
            process(j)
        }
    }()
}
```

Hoặc **semaphore**:

```go
sem := make(chan struct{}, 5)
sem <- struct{}{}        // acquire
defer func() { <-sem }() // release
```

### Nhiều pod

In-memory queue không chia được — dùng **DB queue** (`FOR UPDATE SKIP LOCKED`), Redis stream, RabbitMQ.

Xem implementation: [worker_pool.go](./demo/race-condition/worker_pool.go).

---

## Câu trả lời ngắn (phỏng vấn)

1. **`defer`**: chạy khi function return (LIFO); trong goroutine block thì defer không chạy.
2. **Channel**: unbuffered = sync; buffered = queue; sender close; dùng `select` + context.
3. **Worker pool**: N worker cố định + job channel — kiểm soát concurrency, tránh OOM.
4. Phân biệt **in-process** (channel, mutex) vs **distributed** (queue DB/message broker).

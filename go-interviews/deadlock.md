# Deadlock & luồng bị kẹt trong Go — Khái niệm & Cách xử lý

> Demo code: [demo/deadlock](./demo/deadlock/)

## Deadlock là gì?

**Deadlock** xảy ra khi hai hay nhiều goroutine **chờ nhau vô hạn** — mỗi bên đều giữ tài nguyên mà bên kia cần, không ai nhả → toàn bộ luồng liên quan **đứng im**.

Go runtime phát hiện khi **tất cả** goroutine đều blocked và in:

```
fatal error: all goroutines are asleep - deadlock!
```

**Phân biệt các trạng thái “kẹt”:**

| Trạng thái | Mô tả | Triệu chứng |
|------------|--------|-------------|
| **Deadlock** | Vòng chờ tài nguyên (lock, channel) | Runtime panic hoặc request treo mãi |
| **Livelock** | Goroutine vẫn chạy nhưng không tiến triển | CPU cao, throughput = 0 |
| **Starvation** | Một số goroutine không bao giờ được lock/channel | Một phần request chậm vô hạn |
| **Goroutine leak** | Goroutine blocked mãi, không ai chờ | Memory tăng dần, không crash |

Trong phỏng vấn, câu “luồng đang xử lý bị chết” thường gộp **deadlock** và **goroutine/request bị block không có timeout**.

---

## Khi nào xảy ra?

### 1. Mutex — vòng khóa (circular wait)

Hai goroutine khóa **theo thứ tự ngược nhau**:

- Goroutine A: `Lock(mu1)` → chờ `Lock(mu2)`
- Goroutine B: `Lock(mu2)` → chờ `Lock(mu1)`

Hay gặp khi nhiều struct share nhiều `Mutex`, hoặc gọi hàm lồng nhau mỗi hàm lock khác nhau.

### 2. Channel — gửi/nhận không khớp

| Tình huống | Vì sao kẹt |
|------------|------------|
| Gửi vào **unbuffered** channel, không có receiver | `ch <- v` block mãi |
| Nhận từ channel không ai gửi | `<-ch` block mãi |
| `range` trên channel không được close | Vòng lặp chờ mãi |
| Main return trước khi worker nhận job | Worker block trên channel |

### 3. `sync.WaitGroup` dùng sai

- `wg.Add` **sau** khi goroutine đã chạy (race với `Wait`)
- Số lần `Add` ≠ số lần `Done` → `Wait` block mãi
- `Add` bên trong goroutine con mà `Wait` ở parent chạy trước

### 4. Chờ I/O / RPC không có hạn

- Gọi HTTP, DB, gRPC **không** gắn `context.WithTimeout`
- Goroutine chờ response mãi khi upstream chết hoặc mạng treo
- Không phải deadlock cổ điển nhưng **triệu chứng giống**: request không bao giờ trả lời

### 5. Giữ lock trong khi chờ tài nguyên khác

- `Lock` → gọi hàm bên ngoài (HTTP) hoặc `Lock` khác → dễ tạo vòng chờ hoặc làm chậm toàn hệ thống
- Transaction DB dài + `FOR UPDATE` nhiều bảng → deadlock ở tầng Postgres (khác process nhưng cùng bài toán)

### 6. `select` thiếu nhánh thoát

- Chỉ `select` trên một channel, không có `default` hoặc `context.Done()`
- Shutdown service: goroutine vẫn block trên `<-jobs` dù đã cancel

---

## Pattern hay gặp (phỏng vấn / production)

| Pattern | Vấn đề | Hướng xử lý |
|---------|--------|-------------|
| Transfer A→B, B→A đồng thời | Mutex AB-BA | Khóa theo thứ tự cố định (id ASC) |
| Worker pool unbuffered | Sender block khi worker chết | Buffer + context cancel |
| `defer mu.Unlock()` sau `Lock` panic giữa chừng | Lock không nhả (không phải deadlock 2 bên nhưng kẹt logic) | `defer Unlock` ngay sau `Lock` thành công |
| Nested lock cùng Mutex | Re-lock → deadlock (Mutex không reentrant) | Tách lock hoặc dùng `RWMutex` đúng vai trò |
| DB update 2 row theo thứ tự khác nhau | Postgres deadlock, một tx bị rollback | Lock row theo `id` tăng dần, tx ngắn |

---

## Cách xử lý

### Thiết kế — phòng tránh

| Nguyên tắc | Chi tiết |
|------------|----------|
| **Thứ tự khóa cố định** | Mọi goroutine lock `muA` rồi `muB` — không bao giờ ngược lại |
| **Một Mutex một lớp trừu tượng** | Tránh lock lồng lock giữa package |
| **Không giữ lock khi I/O** | Unlock trước HTTP/DB; hoặc không lock trong critical section dài |
| **Channel có chủ đích** | Buffered khi producer/consumer không đồng bộ tốc độ; document ai close |
| **WaitGroup: Add trước `go`** | `wg.Add(1)` trên main goroutine, rồi mới `go func(){ defer wg.Done(); ... }()` |
| **Context mọi đường ra ngoài** | `context.WithTimeout` / `WithDeadline` cho RPC, query, worker |

### Runtime — phát hiện & thoát

| Công cụ | Dùng khi |
|---------|----------|
| **`context.Context`** | Hủy luồng khi client disconnect hoặc quá timeout |
| **`select` + `ctx.Done()`** | Worker thoát khi shutdown |
| **`select` + `time.After`** | Timeout cục bộ (ưu tiên context nếu đã có) |
| **`sync.Mutex.TryLock()`** (Go 1.18+) | Thử lock, backoff/retry thay vì chờ mãi |
| **Buffered channel** | Tránh sender block khi consumer tạm chậm (có giới hạn buffer) |

### Vận hành & debug

| Công cụ | Mục đích |
|---------|----------|
| `go test -timeout 5s` | Test không treo CI |
| `runtime/pprof` — goroutine profile | Xem stack goroutine đang block ở đâu |
| `go tool trace` | Timeline block, lock contention |
| Log + metric request duration | Phát hiện endpoint treo trước khi OOM |
| Postgres `pg_locks`, log deadlock | Deadlock giữa nhiều connection |

### Postgres (nhiều instance / connection)

- Transaction **ngắn** — không gọi HTTP trong tx.
- Lock nhiều row theo **cùng thứ tự** (ví dụ `ORDER BY id`).
- Retry khi nhận lỗi `deadlock detected` (mã `40P01`) — idempotent update.
- Giảm phạm vi lock: `UPDATE ... WHERE` hẹp, tránh `SELECT * FOR UPDATE` không cần thiết.

---

## Chọn chiến lược nào?

```
Hai Mutex có thể gọi chéo     → thứ tự khóa cố định
Cần hủy khi client timeout    → context + select ctx.Done()
Worker / pipeline             → buffered channel hoặc context cancel
Gọi service bên ngoài         → context.WithTimeout trên mọi call
Không chắc ai nhận channel    → select + default / timeout
Nhiều pod + DB                → tx ngắn + lock ordering + retry deadlock
```

---

## Câu trả lời ngắn (phỏng vấn)

1. **Deadlock** = vòng chờ lock/channel; Go có thể panic khi toàn process kẹt.
2. **Phòng**: một thứ tự khóa, không giữ lock khi I/O, `WaitGroup` đúng quy ước, channel có owner close.
3. **Thoát**: `context` timeout/cancel, `select` nhiều nhánh, `TryLock` + backoff khi phù hợp.
4. **Quan sát**: pprof goroutine, trace, timeout test, metric latency.
5. **DB**: tx ngắn, lock cùng thứ tự, retry deadlock.

---

## Chạy demo

```bash
cd go-interviews/demo/deadlock
go test ./...                    # các test fix (pass)
go test -timeout 3s -run Deadlock ./...   # test deadlock (bị kill bởi timeout hoặc skip)
go run ./cmd/demo                # in ví dụ fix
```

| File demo | Nội dung |
|-----------|----------|
| `01_mutex_deadlock_test.go` | AB-BA deadlock (chạy riêng, có timeout) |
| `02_lock_order_fix_test.go` | Fix: khóa theo thứ tự id |
| `03_channel_block_test.go` | Channel block + fix buffer/select |
| `04_waitgroup_trap_test.go` | WaitGroup sai + fix |
| `05_context_timeout_test.go` | Context timeout thoát chờ mãi |
| `cmd/demo/main.go` | Chạy ví dụ in console |

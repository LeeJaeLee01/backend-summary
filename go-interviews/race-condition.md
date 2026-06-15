# Race condition trong Go — Khái niệm & Cách xử lý

> Demo code: [demo/race-condition](./demo/race-condition/)

## Race condition là gì?

Nhiều **goroutine** cùng đọc/ghi **một vùng nhớ**, có ít nhất một thao tác **ghi**, và **không đồng bộ** → kết quả phụ thuộc thứ tự chạy, không dự đoán được.

- Thường **không panic** — data sai âm thầm.
- Go: có data race → **undefined behavior**.

**Hai lớp cần phân biệt:**

| Lớp | Ví dụ | Cách xử lý |
|-----|--------|------------|
| **In-process** | Counter, cache map trong 1 service | `Mutex`, `atomic`, `channel` |
| **Database** | Nhiều pod cùng `UPDATE` stock | Atomic SQL Postgres, `FOR UPDATE` |

`Mutex` chỉ sync trong **một process**. Nhiều instance → cần **Postgres** làm source of truth.

---

## Pattern hay gặp

| Pattern | Vấn đề | Cách xử lý |
|---------|--------|------------|
| **Read-modify-write** | `counter++` — đọc rồi ghi | `atomic` hoặc `Mutex` |
| **Check-then-act** | `if nil { load() }` — 2 goroutine cùng load | `Mutex` bọc cả check + act |
| **Map concurrent** | Ghi `map` từ nhiều goroutine | `map + Mutex` hoặc `sync.Map` |
| **Loop closure** | Goroutine dùng sai biến `item` trong `for` | Truyền param: `go func(it T){}(item)` |
| **SELECT → UPDATE** (DB) | Lost update, oversell | `UPDATE ... WHERE stock >= n` |

---

## Công cụ đồng bộ — chọn gì?

| Công cụ | Dùng khi |
|---------|----------|
| **`sync/atomic`** | Một biến số: counter, flag |
| **`sync.Mutex`** | Nhiều field, logic check + update |
| **`sync.RWMutex`** | Đọc nhiều, ghi ít (cache) |
| **`channel`** | Điều phối job, worker pool — tránh share memory |
| **`sync.WaitGroup`** | Chờ nhóm goroutine xong |

```
Counter đơn giản     → atomic
Struct / invariant   → Mutex
Cache read-heavy     → RWMutex
Pipeline / giới hạn N job → channel + worker pool
Nhiều pod + DB       → Postgres atomic UPDATE / FOR UPDATE
```

---

## Postgres (khi có nhiều instance)

**Sai** — lost update:

```sql
-- App: SELECT remaining → tính → UPDATE giá trị mới
```

**Đúng** — atomic:

```sql
UPDATE showings
SET remaining = remaining - 1
WHERE id = $1 AND remaining > 0;
-- RowsAffected = 0 → hết hàng
```

Logic phức tạp (transfer 2 account):

```sql
BEGIN;
SELECT balance FROM accounts WHERE id = $1 FOR UPDATE;
-- check + update
COMMIT;
```

- Transaction **ngắn** — không gọi HTTP trong tx.
- Lock nhiều row theo thứ tự `id ASC` → tránh deadlock.

---

## Race detector

```bash
cd demo/race-condition
go test -race ./...
```

- Chỉ dùng **test/CI** — chậm hơn, không bật production.
- Bắt race in-process; **không** bắt lost update trên Postgres → cần integration test riêng.

---

## Chạy demo

```bash
cd go-interviews/demo/race-condition
go test ./...              # chạy bình thường
go test -race ./...        # phát hiện race (xem 01_counter_race_test.go)
go run ./cmd/demo          # in kết quả các fix
```

| File | Nội dung |
|------|----------|
| `01_counter_race_test.go` | Race — chạy `-race` sẽ báo lỗi |
| `02_mutex_fix_test.go` | Fix bằng Mutex |
| `03_atomic_fix_test.go` | Fix bằng atomic |
| `04_worker_pool_test.go` | Worker pool + channel |
| `05_check_then_act_test.go` | Check-then-act + Mutex |
| `cmd/demo/main.go` | Chạy ví dụ in ra console |

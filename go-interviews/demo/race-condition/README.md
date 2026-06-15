# Demo — Race condition trong Go

## Chạy

```bash
# Test các fix (pass)
go test ./...

# Phát hiện race — test 01 sẽ báo DATA RACE
go test -race -run TestCounterRace ./...

# Demo in console
go run ./cmd/demo
```

## File

| File | Mô tả |
|------|--------|
| `counter.go` | Counter unsafe / Mutex / atomic |
| `cache.go` | Check-then-act với Mutex |
| `worker_pool.go` | Giới hạn N goroutine xử lý job |
| `01_counter_race_test.go` | Race — chạy `-race` để thấy lỗi |
| `02_mutex_fix_test.go` | Fix Mutex |
| `03_atomic_fix_test.go` | Fix atomic |
| `04_worker_pool_test.go` | Worker pool |
| `05_check_then_act_test.go` | Cache load 1 lần |

## Tài liệu

[../../race-condition.md](../../race-condition.md)

# Demo — Deadlock & luồng bị kẹt trong Go

## Chạy

```bash
# Test các fix (pass)
go test ./...

# Test deadlock mutex — sẽ bị kill bởi -timeout (hoặc skip nếu có)
go test -timeout 2s -run TestMutexDeadlock ./...

# Demo in console
go run ./cmd/demo
```

## File

| File | Mô tả |
|------|--------|
| `locks.go` | Account transfer — deadlock vs lock ordering |
| `pipeline.go` | Channel block vs buffered + context |
| `01_mutex_deadlock_test.go` | AB-BA deadlock (anti-pattern) |
| `02_lock_order_fix_test.go` | Fix: lock theo id |
| `03_channel_block_test.go` | Unbuffered block + fix |
| `04_waitgroup_trap_test.go` | WaitGroup misuse + fix |
| `05_context_timeout_test.go` | Context timeout |
| `cmd/demo/main.go` | Chạy ví dụ in ra console |

## Tài liệu

[../../deadlock.md](../../deadlock.md)

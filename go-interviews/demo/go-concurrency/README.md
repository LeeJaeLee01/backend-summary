# Demo — defer, channel & semaphore (Go)

```bash
go test ./...
```

| File | Mô tả |
|------|--------|
| `semaphore.go` | Giới hạn concurrency bằng buffered channel |
| `01_defer_semaphore_test.go` | defer trong goroutine; max 5 đồng thời |

Worker pool đầy đủ: [../race-condition/worker_pool.go](../race-condition/worker_pool.go)

## Tài liệu

[../../go-defer-channel.md](../../go-defer-channel.md)

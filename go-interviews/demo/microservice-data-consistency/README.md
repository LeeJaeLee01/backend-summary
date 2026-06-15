# Demo — Toàn vẹn dữ liệu microservice (Go)

Mô phỏng in-memory: **Saga** (orchestration + compensation), **Transactional Outbox**, **Idempotency key**.

## Chạy

```bash
go test ./...
go run ./cmd/demo
```

## File

| File | Mô tả |
|------|--------|
| `saga.go` | Place order: reserve → charge → complete / compensate |
| `outbox.go` | Ghi order + outbox, relay publish |
| `idempotency.go` | Charge một lần dù client retry |
| `01_saga_success_test.go` | Saga thành công |
| `02_saga_compensation_test.go` | Payment fail → release stock, cancel order |
| `03_outbox_test.go` | Outbox relay |
| `04_idempotency_test.go` | Duplicate idempotency key |
| `cmd/demo/main.go` | In ví dụ ra console |

## Tài liệu

[../../microservice-data-consistency.md](../../microservice-data-consistency.md)

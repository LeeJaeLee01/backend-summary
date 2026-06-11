# Read / Write Split Demo — NestJS + PostgreSQL

Demo minh họa pattern **Primary (write) + Read Replica (read)** như mô tả trong [database/sclable.md](../../database/sclable.md).

## Kiến trúc

```
NestJS API — **http://localhost:3001** (host port; tránh conflict với service khác trên :3000)
    │
    ├── WRITE (TypeORM "primary") ──► postgres-primary :5434 (host)
    │
    └── READ  (TypeORM "replica")  ──► postgres-replica :5435 (host)
                                              ▲
                                              │ streaming replication (WAL)
                                              │
                                       postgres-primary
```

## Chạy nhanh (Docker — khuyến nghị)

```bash
cd demo/read-write-split
docker compose up --build
```

Đợi ~30–60s để replica hoàn tất `pg_basebackup` và bắt đầu streaming.

### Kiểm tra replication

```bash
curl http://localhost:3001/replication/status | jq
```

Kỳ vọng: `streaming[0].state = "streaming"`, `replica.isStandby = true`.

### Demo routing

```bash
# READ → replica (default)
curl http://localhost:3001/orders | jq

# WRITE → primary
curl -X POST http://localhost:3001/orders \
  -H 'Content-Type: application/json' \
  -d '{"userId": 1, "total": 250, "note": "demo-write"}' | jq

# So sánh count primary vs replica
curl http://localhost:3001/orders/count/compare | jq

# Demo read-after-write: tạo order rồi đọc từ primary vs replica
curl -X POST http://localhost:3001/orders/demo/read-after-write \
  -H 'Content-Type: application/json' \
  -d '{"userId": 2, "total": 99, "note": "lag-demo"}' | jq

# READ từ primary (read-your-writes)
curl 'http://localhost:3001/orders?source=primary' | jq
```

## Chạy local (API trên máy, DB trong Docker)

```bash
docker compose up postgres-primary postgres-replica -d
cp .env.example .env
npm install
npm run start:dev
```

`.env`:

```env
DB_PRIMARY_HOST=localhost
DB_REPLICA_HOST=localhost
DB_PORT=5434
DB_REPLICA_PORT=5435
```

## API endpoints

| Method | Path | DB | Mô tả |
|--------|------|-----|-------|
| `POST` | `/orders` | **Primary** | Tạo order |
| `GET` | `/orders` | **Replica** | List orders |
| `GET` | `/orders?source=primary` | **Primary** | Read-your-writes |
| `GET` | `/orders/:id` | Replica (default) | Chi tiết |
| `GET` | `/orders/count/compare` | Both | So sánh số row |
| `POST` | `/orders/demo/read-after-write` | Both | Demo lag |
| `GET` | `/replication/status` | Primary + Replica | Lag, `pg_stat_replication` |

## Code chính

- **2 TypeORM connections:** `src/database/database.module.ts`
- **Write → primary:** `OrdersService.create()`
- **Read → replica:** `OrdersService.findAll()` (default)
- **Replication status:** `ReplicationService.getStatus()`

## Troubleshooting

**Replica chưa sync:**

```bash
docker compose logs postgres-replica
docker compose exec postgres-primary psql -U postgres -d demo -c "SELECT * FROM pg_stat_replication;"
```

**Reset hoàn toàn:**

```bash
docker compose down -v
docker compose up --build
```

## Liên quan

- [sclable.md](../../database/sclable.md) — lý thuyết read/write split & đồng bộ WAL
- [connection-pool.md](../../database/connection-pool.md) — pool khi scale instance

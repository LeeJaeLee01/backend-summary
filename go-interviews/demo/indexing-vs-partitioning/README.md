# Demo — Indexing vs Partitioning (PostgreSQL)

## Yêu cầu

- PostgreSQL 14+ (khuyến nghị 15+)
- `psql` hoặc Docker

## Chạy nhanh (Docker)

```bash
docker compose up -d
./run.sh
```

`run.sh` kết nối `postgres://demo:demo@localhost:5433/indexing_demo` và chạy lần lượt các file SQL.

## Chạy thủ công

```bash
export DATABASE_URL=postgres://demo:demo@localhost:5433/indexing_demo
psql "$DATABASE_URL" -f sql/01_setup.sql
psql "$DATABASE_URL" -f sql/02_index_before_after.sql
psql "$DATABASE_URL" -f sql/03_partition_setup.sql
psql "$DATABASE_URL" -f sql/04_partition_pruning.sql
psql "$DATABASE_URL" -f sql/05_index_on_partition.sql
```

## File

| File | Mô tả |
|------|--------|
| `sql/01_setup.sql` | Bảng `events_plain` + 100k row mẫu |
| `sql/02_index_before_after.sql` | `EXPLAIN` trước/sau `CREATE INDEX` |
| `sql/03_partition_setup.sql` | `events` partitioned RANGE `event_date` |
| `sql/04_partition_pruning.sql` | Query có/không partition key |
| `sql/05_index_on_partition.sql` | Index trên parent + query kết hợp |

## Tài liệu

[../../indexing-vs-partitioning.md](../../indexing-vs-partitioning.md)

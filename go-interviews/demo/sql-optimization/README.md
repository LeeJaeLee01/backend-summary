# Demo — Tối ưu câu SQL (PostgreSQL)

## Chạy

```bash
docker compose up -d
./run.sh
```

Hoặc thủ công:

```bash
export DATABASE_URL=postgres://demo:demo@localhost:5435/sql_optimization_demo
psql "$DATABASE_URL" -f sql/01_setup.sql
# ... các file tiếp theo
```

## File

| File | Mô tả |
|------|--------|
| `sql/01_setup.sql` | Seed users, orders |
| `sql/02_baseline_explain.sql` | EXPLAIN trước tối ưu |
| `sql/03_rewrite_query.sql` | Anti-pattern vs rewrite |
| `sql/04_add_index.sql` | Thêm index, so sánh plan |
| `sql/05_explain_analyze.sql` | EXPLAIN ANALYZE + BUFFERS |
| `sql/06_bad_patterns.sql` | Function on column, LIKE wildcard |
| `sql/07_pagination.sql` | OFFSET lớn vs keyset |

## Tài liệu

[../../sql-optimization.md](../../sql-optimization.md)

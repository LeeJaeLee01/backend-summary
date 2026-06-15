# Demo — Đánh index với dữ liệu nào? (PostgreSQL)

## Chạy

```bash
docker compose up -d
./run.sh
```

Hoặc thủ công:

```bash
export DATABASE_URL=postgres://demo:demo@localhost:5434/when_to_index_demo
psql "$DATABASE_URL" -f sql/01_setup.sql
# ... các file tiếp theo
```

## File

| File | Mô tả |
|------|--------|
| `sql/01_setup.sql` | Seed users, orders, events |
| `sql/02_cardinality.sql` | user_id vs is_active |
| `sql/03_composite_order.sql` | `(user_id, created_at)` vs ngược |
| `sql/04_partial_index.sql` | Partial index pending jobs |
| `sql/05_covering_index.sql` | INCLUDE columns |
| `sql/06_index_types.sql` | GIN JSONB, lower(email) |
| `sql/07_index_not_used.sql` | Anti-pattern: function on column |

## Tài liệu

[../../when-to-index.md](../../when-to-index.md)

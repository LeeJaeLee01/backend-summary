# Database — Roadmap & Ghi chú bổ sung

> Checklist những gì **còn thiếu** để folder `database/` từ **senior backend (DB)** lên **senior toàn diện về DB**.  
> Đánh giá hiện tại: backend thực chiến ~8/10, vận hành DB ~3/10.

---

## Đã có (không cần viết lại)

| File | Nội dung |
|------|----------|
| `connection-pool.md` | Pool, PgBouncer, multi-service, Lambda |
| `transaction-consistency.md` | Race, lock, isolation, Saga, Outbox, ACID |
| `problems.md` | N+1, index sai, pagination, deadlock, race PATCH vs PUT |
| `index.md` | Các loại index, GIN JSONB, WHERE/GROUP BY/HAVING |
| `orm.md` | TypeORM vs Prisma |
| `why-postgres-and-timescaledb.md` | Kiến trúc Postgres + TimescaleDB |

---

## Ưu tiên 1 — Hoàn thiện file trống / trùng

### File cần viết ngay

| File | Nội dung cần có | Ghi chú |
|------|-----------------|---------|
| `new-improve-query.md` hoặc `improve-query.md` | Tối ưu query nâng cao (xem §2) | Gộp 1 file, xóa bản trùng |
| `new-pagination.md` hoặc `pagination.md` | Cursor vs offset chi tiết, keyset, composite cursor | `problems.md` §8 chỉ tóm tắt — cần file riêng sâu hơn |
| `new-partition.md` hoặc `partition.md` | Partition Postgres + so sánh TimescaleDB chunk | Bổ sung cho `why-postgres-and-timescaledb.md` |

### Dọn cấu trúc folder

```
□ Tạo README.md — mục lục folder (file index.md đang là "database index", dễ nhầm)
□ Gộp new-* và file cũ thành 1 bản — tránh duplicate
□ Deadlock: giữ chi tiết ở problems.md — transaction-consistency.md chỉ link sang
□ Đặt tên rõ: cân nhắc đổi index.md → db-index.md hoặc indexes.md
```

---

## Ưu tiên 2 — Query planner & debug (thiếu nhiều nhất)

**File đề xuất:** `explain-analyze.md`

| Mục | Nội dung |
|-----|----------|
| Đọc EXPLAIN | `EXPLAIN` vs `EXPLAIN ANALYZE` vs `BUFFERS` |
| Node types | Seq Scan, Index Scan, Bitmap Scan, Index Only Scan, Nested Loop, Hash Join, Sort |
| Khi nào full scan OK | Bảng nhỏ, selectivity thấp, không có index phù hợp |
| Statistics | `ANALYZE`, cardinality estimate sai → plan kém |
| Case study | 2–3 query chậm thật: trước/sau fix + plan |
| ORM debug | Bật log TypeORM/Prisma, đọc SQL sinh ra |

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 123 AND status = 'active';
```

---

## Ưu tiên 3 — Vận hành DB (ops)

**File đề xuất:** `operations.md`

| Mục | Nội dung |
|-----|----------|
| **VACUUM / autovacuum** | Dead tuples, bloat, khi nào chạy manual `VACUUM` |
| **Index bloat** | `REINDEX`, pg_stat_user_indexes |
| **Connection monitoring** | `pg_stat_activity`, `pg_stat_statements` |
| **Slow query** | `log_min_duration_statement`, đọc slow log |
| **Backup & restore** | `pg_dump`, PITR, restore drill (test backup có chạy không) |
| **Migration an toàn** | Lock khi `ALTER TABLE`, `CONCURRENTLY` index, zero-downtime pattern |
| **Alert** | Connection > 80%, long query, replication lag, disk |

---

## Ưu tiên 4 — HA & Replication

**File đề xuất:** `replication-ha.md`

| Mục | Nội dung |
|-----|----------|
| Streaming replication | Primary → standby, sync vs async |
| Read replica | Route read/write, replication lag, stale read |
| Failover | Manual vs automatic (Patroni, RDS Multi-AZ) |
| Logical replication | Use case: CDC, upgrade version |
| Split brain | Tránh ghi vào 2 primary |

---

## Ưu tiên 5 — Schema design & modeling

**File đề xuất:** `schema-design.md`

| Mục | Nội dung |
|-----|----------|
| Normalization vs denormalization | Khi nào chấp nhận redundant data |
| PK / FK / unique constraint | Index FK ở bảng con |
| Soft delete | `deleted_at` + partial index |
| JSONB vs cột riêng | Khi nào dùng metadata JSONB |
| Multi-tenant | `tenant_id` + composite index, RLS overview |
| Access pattern first | Thiết kế index theo query thực tế, không index bừa |

---

## Ưu tiên 6 — Scale & kiến trúc data

**File đề xuất:** `scaling.md`

| Mục | Nội dung |
|-----|----------|
| Vertical vs horizontal | Upgrade instance vs tách workload |
| Read replica routing | API read → replica, write → primary |
| Connection pooling layer | PgBouncer / RDS Proxy (link `connection-pool.md`) |
| Partitioning | Range/list/hash — khi nào partition thủ công |
| Sharding | Hash/range shard key, trade-off cross-shard query |
| CQRS / event sourcing | Overview — khi OLTP + analytics tách |
| CDC & ETL | Debezium, logical replication → warehouse |

---

## Ưu tiên 7 — Bảo mật

**File đề xuất:** `security.md`

| Mục | Nội dung |
|-----|----------|
| Least privilege | User app chỉ CRUD cần thiết |
| Row Level Security (RLS) | Multi-tenant isolation ở DB layer |
| SQL injection | Parameterized query — ORM không đủ nếu raw SQL sai |
| Encryption | at-rest (RDS), in-transit (SSL) |
| Audit log | Ai sửa gì, khi nào |

---

## Ưu tiên 8 — Nội dung bổ sung cho file hiện có

### `improve-query.md` (chi tiết hơn `problems.md`)

- [ ] Query rewrite: subquery → JOIN, correlated → window function
- [ ] Materialized view + refresh strategy
- [ ] Denormalize cho report (summary table)
- [ ] Batch insert / `COPY` vs row-by-row
- [ ] `SELECT FOR UPDATE SKIP LOCKED` — queue pattern
- [ ] Caching layer (Redis) — khi nào cache, invalidation

### `pagination.md`

- [ ] Offset vs cursor — trade-off đầy đủ
- [ ] Keyset trên `(created_at, id)` — tránh duplicate khi data thay đổi
- [ ] `COUNT(*)` expensive — `hasNext` thay total page
- [ ] Prisma/TypeORM cursor implementation

### `partition.md`

- [ ] Postgres declarative partitioning (RANGE, LIST, HASH)
- [ ] Partition pruning — `EXPLAIN` phải thấy chỉ scan 1 partition
- [ ] Drop partition cũ (retention policy)
- [ ] So sánh: manual partition vs TimescaleDB hypertable

---

## Thứ tự viết đề xuất

```
Tuần 1:  README.md + gộp file trùng + improve-query.md + pagination.md
Tuần 2:  explain-analyze.md + partition.md
Tuần 3:  operations.md
Tuần 4:  replication-ha.md + schema-design.md
Sau:     scaling.md + security.md
```

---

## Bar "senior DB" — checklist tự đánh giá

```
□ Đọc được EXPLAIN ANALYZE và đề xuất fix cụ thể
□ Biết khi nào VACUUM/REINDEX, không chỉ tạo index
□ Thiết kế backup + đã test restore
□ Hiểu read replica + replication lag
□ Tune connection pool multi-service (đã có ✓)
□ Xử lý race/lost update đúng pattern (đã có ✓)
□ Migration production không downtime
□ Biết khi nào partition / khi nào shard
□ Monitor: pg_stat_statements + alert
□ Schema design theo access pattern
```

---

## Mục tiêu theo vai trò

| Mục tiêu | Cần hoàn thành |
|----------|----------------|
| **Phỏng vấn senior backend** | Ưu tiên 1 + 2 + bổ sung `improve-query`, `pagination` |
| **Tech lead** | Thêm 3 + 4 + 5 |
| **DB specialist / Staff** | Toàn bộ 1–8 |

> Folder hiện tại **đủ cho backend senior phỏng vấn**. Để **senior toàn diện DB**, tập trung vào **explain-analyze**, **operations**, **replication-ha** trước.

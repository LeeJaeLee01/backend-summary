# Database — Roadmap & Ghi chú bổ sung

> Checklist những gì **còn thiếu** để folder `database/` từ **senior backend (DB)** lên **senior toàn diện về DB**.  
> Đánh giá hiện tại: backend thực chiến ~9/10, vận hành DB ~3/10.

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
| `improve-query.md` | Tối ưu query, EXPLAIN cơ bản, COPY, SKIP LOCKED, xử lý query chậm |
| `pagination.md` | Offset vs keyset, composite cursor, ORM examples |
| `partition.md` | Range/List/Hash, use case, pruning, migration |
| `explain-analyze.md` | Node types, case study, ORM debug |
| `security.md` | Least privilege, RLS, SQL injection, encryption, audit |

---

## Ưu tiên 1 — Hoàn thiện file trống / trùng

### File cần viết ngay

| File | Trạng thái |
|------|------------|
| `improve-query.md` | ✅ Done |
| `pagination.md` | ✅ Done |
| `partition.md` | ✅ Done |

### Dọn cấu trúc folder

```
□ Tạo README.md — mục lục folder (file index.md đang là "database index", dễ nhầm)
✅ Gộp new-* và file cũ thành 1 bản — tránh duplicate
□ Deadlock: giữ chi tiết ở problems.md — transaction-consistency.md chỉ link sang
□ Đặt tên rõ: cân nhắc đổi index.md → db-index.md hoặc indexes.md
```

---

## Ưu tiên 2 — Query planner & debug

**File:** `explain-analyze.md` — ✅ Done

| Mục | Trạng thái |
|-----|------------|
| Đọc EXPLAIN / ANALYZE / BUFFERS | ✅ |
| Node types (Bitmap, Nested Loop, Hash Join, Sort) | ✅ |
| Khi nào full scan OK | ✅ |
| Statistics / ANALYZE | ✅ |
| Case study 2–3 query trước/sau fix | ✅ |
| ORM debug TypeORM/Prisma | ✅ |

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

**File:** `security.md` — ✅ Done

| Mục | Trạng thái |
|-----|------------|
| Least privilege | ✅ |
| Row Level Security (RLS) | ✅ |
| SQL injection | ✅ |
| Encryption at-rest / in-transit | ✅ |
| Audit log | ✅ |

## Ưu tiên 8 — Nội dung bổ sung cho file hiện có

### `improve-query.md`

- [x] Query rewrite: subquery → JOIN, correlated → window function
- [x] Materialized view + refresh strategy
- [x] Denormalize cho report (summary table)
- [x] Batch insert / `COPY` vs row-by-row
- [x] `SELECT FOR UPDATE SKIP LOCKED` — queue pattern
- [x] Caching layer (Redis) — khi nào cache, invalidation

### `pagination.md`

- [x] Offset vs cursor — trade-off đầy đủ
- [x] Keyset trên `(created_at, id)` — tránh duplicate khi data thay đổi
- [x] `COUNT(*)` expensive — `hasNext` thay total page
- [x] Prisma/TypeORM cursor implementation

### `partition.md`

- [x] Postgres declarative partitioning (RANGE, LIST, HASH)
- [x] Partition pruning — `EXPLAIN` phải thấy chỉ scan 1 partition
- [x] Drop partition cũ (retention policy)
- [x] So sánh: manual partition vs TimescaleDB hypertable

---

## Thứ tự viết đề xuất

```
Tuần 1:  README.md + gộp file trùng + improve-query.md + pagination.md  ✅ (trừ README)
Tuần 2:  explain-analyze.md + partition.md                              ✅
Tuần 3:  operations.md                                                    □
Tuần 4:  replication-ha.md + schema-design.md                             □
Sau:     scaling.md + security.md                                         (security ✅)
```

---

## Bar "senior DB" — checklist tự đánh giá

```
✅ Đọc được EXPLAIN ANALYZE và đề xuất fix cụ thể (explain-analyze.md)
□ Biết khi nào VACUUM/REINDEX, không chỉ tạo index
□ Thiết kế backup + đã test restore
□ Hiểu read replica + replication lag
✅ Tune connection pool multi-service (connection-pool.md)
✅ Xử lý race/lost update đúng pattern (transaction-consistency.md)
□ Migration production không downtime
✅ Biết khi nào partition / khi nào shard (partition.md)
□ Monitor: pg_stat_statements + alert (ops)
□ Schema design theo access pattern
✅ Database security cơ bản (security.md)
```

---

## Mục tiêu theo vai trò

| Mục tiêu | Cần hoàn thành |
|----------|----------------|
| **Phỏng vấn senior backend** | ✅ Ưu tiên 1 + 2 + improve/pagination/explain-analyze |
| **Tech lead** | Thêm operations + replication-ha + schema-design |
| **DB specialist / Staff** | Toàn bộ 1–8 (còn ops, HA, schema, scaling) |

> Folder hiện tại **đủ cho phỏng vấn senior backend**. Để **senior toàn diện DB**, tập trung tiếp **operations**, **replication-ha**, **schema-design**.

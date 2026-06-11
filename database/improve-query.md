# Tối ưu Query Database

Hướng dẫn các kỹ thuật tối ưu query cơ bản, cách đánh giá query tốt hay chậm, và quy trình xử lý khi gặp query chậm. Ví dụ dùng **PostgreSQL** — pattern tương tự áp dụng cho MySQL.

---

## 1. Các cách tối ưu query cơ bản

### 1.1 Chỉ SELECT cột cần thiết

```sql
-- ❌ Lấy toàn bộ cột — tốn I/O, network, memory
SELECT * FROM orders WHERE user_id = 123;

-- ✅ Chỉ lấy cột cần dùng
SELECT id, total, status, created_at FROM orders WHERE user_id = 123;
```

> Bảng càng nhiều cột / cột TEXT–JSONB lớn, lợi ích càng rõ.

---

### 1.2 Index đúng chỗ

Index giúp DB **seek** thay vì **full table scan**. Chi tiết xem [index.md](./index.md).

```sql
-- Query thường dùng
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC;

-- Index khớp: equality trước, range/sort sau
CREATE INDEX idx_orders_user_status_created
ON orders(user_id, status, created_at DESC);
```

**Quy tắc nhanh:**

| Điều kiện trong query | Đặt ở index |
|-----------------------|-------------|
| `=` (equality) | Cột đầu |
| `>`, `<`, `BETWEEN` | Sau equality |
| `ORDER BY` | Cuối index |

---

### 1.3 Tránh biến đổi cột đã index trong WHERE

```sql
-- ❌ Không dùng được index trên created_at
WHERE DATE(created_at) = '2024-06-01'
WHERE LOWER(email) = 'foo@bar.com'

-- ✅ Viết lại thành range
WHERE created_at >= '2024-06-01' AND created_at < '2024-06-02'

-- ✅ Hoặc tạo functional index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

---

### 1.4 Tránh `LIKE '%keyword%'`

Leading wildcard khiến index **vô dụng**.

```sql
-- ❌ Full scan
WHERE title LIKE '%postgres%'

-- ✅ Prefix search — dùng được B-Tree index
WHERE title LIKE 'postgres%'

-- ✅ Full-text search cho tìm kiếm phức tạp
CREATE INDEX idx_posts_title_fts ON posts USING GIN (to_tsvector('english', title));
```

---

### 1.5 JOIN đúng cách

```sql
-- ❌ Cartesian product — quên ON
SELECT * FROM orders, order_items;

-- ✅ JOIN có điều kiện + index trên FK
SELECT o.id, o.total, oi.product_id
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.user_id = 123;

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

**Lưu ý:**

- Index cột **FK** và cột **WHERE** trên bảng join
- Tránh JOIN bảng lớn không cần thiết — filter trước khi join nếu có thể
- `EXISTS` thường tốt hơn `IN (subquery lớn)` khi chỉ cần kiểm tra tồn tại

```sql
-- ✅ EXISTS — dừng sớm khi tìm thấy
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'pending'
);
```

---

### 1.6 Tránh N+1 query

1 query lấy list + N query lấy relation → chậm và tốn connection. Xem [problems.md](./problems.md).

```typescript
// ❌ N+1
const users = await userRepo.find();
for (const u of users) {
  u.orders = await orderRepo.find({ where: { userId: u.id } });
}

// ✅ Eager load / JOIN
const users = await userRepo.find({ relations: ['orders'] });
```

---

### 1.7 Luôn có LIMIT khi list

```sql
-- ❌ Có thể trả hàng triệu row
SELECT * FROM logs ORDER BY created_at DESC;

-- ✅
SELECT * FROM logs ORDER BY created_at DESC LIMIT 50;
```

Dùng **Keyset pagination** thay Offset khi bảng lớn — xem [pagination.md](./pagination.md).

---

### 1.8 Viết lại subquery nặng

```sql
-- ❌ Correlated subquery — chạy lại cho mỗi row
SELECT u.*, (
  SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id
) AS order_count
FROM users u;

-- ✅ JOIN + GROUP BY hoặc window function
SELECT u.*, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;
```

---

### 1.9 Batch thay vì loop

```sql
-- ❌ 1000 query riêng lẻ từ app
UPDATE orders SET status = 'paid' WHERE id = 1;
UPDATE orders SET status = 'paid' WHERE id = 2;
-- ...

-- ✅ 1 query
UPDATE orders SET status = 'paid' WHERE id IN (1, 2, 3, ...);
```

---

### 1.10 COPY vs row-by-row INSERT

Khi insert **hàng nghìn–triệu row** (import CSV, sync batch, seed data), cách ghi từng row qua app/ORM cực chậm.

| Cách | Throughput | Dùng khi |
|------|------------|----------|
| **Row-by-row INSERT** | ~1k–5k row/s | < 1k row, logic phức tạp từng row |
| **Multi-row INSERT** | ~10k–50k row/s | Batch vài trăm–vài nghìn row |
| **`COPY`** | ~100k–500k+ row/s | Bulk import, ETL, migration data |

```sql
-- ❌ Row-by-row từ app — 10k round-trip
INSERT INTO events (user_id, action) VALUES (1, 'click');
INSERT INTO events (user_id, action) VALUES (2, 'view');
-- ...

-- ✅ Multi-row — 1 round-trip
INSERT INTO events (user_id, action) VALUES
  (1, 'click'), (2, 'view'), (3, 'buy');

-- ✅ COPY — nhanh nhất, stream từ file hoặc stdin
COPY events (user_id, action, created_at)
FROM '/tmp/events.csv'
WITH (FORMAT csv, HEADER true);
```

**Node.js với `pg`:**

```typescript
import { from as copyFrom } from 'pg-copy-streams';
import fs from 'fs';

const client = await pool.connect();
try {
  const stream = client.query(
    copyFrom('COPY events (user_id, action) FROM STDIN WITH (FORMAT csv)')
  );
  fs.createReadStream('./events.csv').pipe(stream);
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
} finally {
  client.release();
}
```

**Prisma:** không có `COPY` native — dùng `$executeRaw` + `pg-copy-streams`, hoặc `createMany` với batch 500–1000 row.

**Lưu ý production:**

- `COPY` **bypass trigger** mặc định — cân nhắc trigger/index impact
- Wrap trong transaction; lỗi giữa chừng → rollback
- Sau bulk insert lớn: `ANALYZE events;` để cập nhật statistics

---

### 1.11 `SELECT FOR UPDATE SKIP LOCKED` — Queue pattern

Khi nhiều worker **cùng lấy job** từ một bảng queue, `SELECT ... FOR UPDATE` thường khiến worker khác **chờ lock**. `SKIP LOCKED` bỏ qua row đang bị lock — mỗi worker lấy job khác nhau.

```sql
-- ❌ Worker B phải chờ Worker A release lock
SELECT * FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE;

-- ✅ Worker B skip row A đang lock, lấy job tiếp theo
BEGIN;

SELECT id, payload
FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

UPDATE jobs SET status = 'processing', worker_id = 'worker-1'
WHERE id = $1;

COMMIT;
```

**TypeScript — job worker:**

```typescript
async function pickJob(workerId: string) {
  return db.transaction(async (tx) => {
    const [job] = await tx.query(
      `SELECT id, payload FROM jobs
       WHERE status = 'pending'
       ORDER BY created_at
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );
    if (!job) return null;

    await tx.query(
      `UPDATE jobs SET status = 'processing', worker_id = $1 WHERE id = $2`,
      [workerId, job.id]
    );
    return job;
  });
}
```

**Khi nào dùng:**

| Pattern | Dùng |
|---------|------|
| Job queue (email, export, webhook) | `SKIP LOCKED` |
| Cần **đọc chính xác** row (balance, inventory) | `FOR UPDATE` (không SKIP) |
| Chỉ cần "ai cũng được xử lý" | `SKIP LOCKED` |

> Cần index `(status, created_at)` — nếu không sẽ Seq Scan + lock nhiều row.

---

## 2. Cách check query tốt hay không

### 2.1 EXPLAIN ANALYZE — công cụ chính

> Đọc plan chi tiết (Bitmap Scan, Hash Join, case study, ORM debug): xem [explain-analyze.md](./explain-analyze.md).

Chạy query **thật** và xem plan + thời gian thực tế:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, total FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

**Output mẫu:**

```
Limit  (cost=0.42..8.44 rows=20 width=16) (actual time=0.025..0.048 rows=20 loops=1)
  ->  Index Scan using idx_orders_user_status_created on orders
        (cost=0.42..120.00 rows=300 width=16) (actual time=0.023..0.045 rows=20 loops=1)
        Index Cond: ((user_id = 123) AND (status = 'pending'::text))
Planning Time: 0.15 ms
Execution Time: 0.08 ms
```

---

### 2.2 Đọc EXPLAIN — query tốt vs query xấu

| Dấu hiệu tốt ✅ | Dấu hiệu xấu ❌ |
|-----------------|-----------------|
| `Index Scan` / `Index Only Scan` | `Seq Scan` trên bảng lớn |
| `actual time` thấp (< vài ms) | `actual time` cao, tăng theo data |
| `rows` estimate ≈ `actual rows` | Estimate lệch xa actual (stats cũ) |
| `Nested Loop` với index nhỏ | `Hash Join` / `Sort` trên hàng triệu row |
| `Limit` dừng sớm | Sort toàn bộ rồi mới Limit |

**Ví dụ query xấu:**

```
Seq Scan on orders  (cost=0.00..250000.00 rows=5000000 width=64)
                      (actual time=1200.000..8500.000 rows=5000000 loops=1)
  Filter: (status = 'pending')
  Rows Removed by Filter: 4500000
Execution Time: 9200.000 ms
```

→ Full scan 5 triệu row, filter bỏ 4.5 triệu → **cần index**.

---

### 2.3 Checklist đánh giá nhanh

```
□ Execution Time < ngưỡng chấp nhận? (API thường < 50–100ms cho query đơn)
□ Có Seq Scan trên bảng > 10k row không?
□ Index Cond khớp WHERE + ORDER BY không?
□ Rows estimate vs actual có lệch quá 10x không?
□ Có Sort/Hash trên dataset lớn không cần thiết không?
□ Query có chạy nhiều lần (N+1) không?
```

---

### 2.4 Công cụ hỗ trợ

| Công cụ | Mục đích |
|---------|----------|
| `EXPLAIN ANALYZE` | Phân tích plan + timing |
| `pg_stat_statements` | Top query chậm / chạy nhiều nhất |
| `EXPLAIN (BUFFERS)` | Xem I/O — shared/local hit vs read |
| App query log | Prisma/TypeORM logging, slow query log |
| APM (Datadog, New Relic) | Trace query trong request thực tế |

**Bật pg_stat_statements:**

```sql
-- postgresql.conf: shared_preload_libraries = 'pg_stat_statements'
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 3. Xử lý khi query bị chậm

### Quy trình 5 bước

```
1. Xác định query chậm
      ↓
2. EXPLAIN ANALYZE
      ↓
3. Sửa (index / rewrite / cache)
      ↓
4. Verify lại
      ↓
5. Monitor — tránh tái phát
```

---

### Bước 1: Xác định query chậm

**Nguồn phát hiện:**

- API response time tăng (APM, log)
- `pg_stat_statements` — query có `mean_exec_time` cao
- PostgreSQL slow query log (`log_min_duration_statement = 1000` → log query > 1s)
- User report / timeout error

```sql
-- Query đang chạy lâu (live)
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle' AND query NOT LIKE '%pg_stat%'
ORDER BY duration DESC;
```

---

### Bước 2: Phân tích với EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
<paste query chậm>;
```

**Tìm root cause theo pattern:**

| Plan thấy | Nguyên nhân thường gặp | Hướng xử lý |
|-----------|------------------------|-------------|
| Seq Scan + Filter | Thiếu index | Tạo index khớp WHERE |
| Sort (cost lớn) | Sort ngoài memory | Index hỗ trợ ORDER BY, giảm row trước sort |
| Nested Loop + Seq Scan bên trong | Thiếu index trên FK | Index cột join |
| Rows estimate << actual | Statistics cũ | `ANALYZE table_name;` |
| Hash Join trên bảng lớn | Join quá nhiều row | Filter sớm, thêm điều kiện WHERE |

---

### Bước 3: Sửa query

**3a. Thêm / sửa index**

```sql
-- Sau khi phân tích plan
CREATE INDEX CONCURRENTLY idx_orders_user_status
ON orders(user_id, status);

-- Cập nhật statistics
ANALYZE orders;
```

> Dùng `CREATE INDEX CONCURRENTLY` trên production để tránh lock bảng.

**3b. Viết lại query**

- Bỏ `SELECT *`, thêm `LIMIT`
- Đổi subquery → JOIN
- Đổi `OFFSET` lớn → Keyset cursor
- Tách query phức tạp thành 2 query đơn giản + merge ở app

**3c. Cache kết quả**

Phù hợp khi data ít thay đổi, đọc nhiều:

```typescript
const cacheKey = `user:${userId}:orders:pending`;
let orders = await redis.get(cacheKey);
if (!orders) {
  orders = await db.query('SELECT ...');
  await redis.setex(cacheKey, 300, JSON.stringify(orders)); // TTL 5 phút
}
```

**3d. Denormalize / materialized view**

Query aggregation nặng chạy lặp lại:

```sql
CREATE MATERIALIZED VIEW daily_order_stats AS
SELECT DATE(created_at) AS day, COUNT(*), SUM(total)
FROM orders
GROUP BY DATE(created_at);

-- Refresh định kỳ (cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_order_stats;
```

**3e. Read replica**

Query report/analytics nặng → chuyển sang **replica**, giữ primary cho write.

---

### Bước 4: Verify

```sql
-- Chạy lại EXPLAIN ANALYZE — so sánh Execution Time
EXPLAIN (ANALYZE, BUFFERS) <query đã sửa>;

-- Kiểm tra index được dùng
-- Phải thấy Index Scan thay vì Seq Scan
```

**Tiêu chí pass:**

- Execution Time giảm rõ rệt (vd: 8s → 5ms)
- Plan dùng index phù hợp
- Không ảnh hưởng query khác (index quá nhiều → write chậm)

---

### Bước 5: Monitor & phòng ngừa

```sql
-- Theo dõi query sau deploy
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%orders%'
ORDER BY mean_exec_time DESC;

-- Reset stats sau khi deploy index mới (optional)
SELECT pg_stat_statements_reset();
```

**Phòng ngừa lâu dài:**

- Review query mới trước khi merge PR (bật query log dev)
- Index theo query pattern thực tế, không tạo index "phòng hờ"
- `ANALYZE` / autovacuum hoạt động bình thường
- Giới hạn `LIMIT`, timeout query ở app (`statement_timeout`)
- Load test trước khi release feature mới

```sql
-- Set timeout cho session (vd: 30s)
SET statement_timeout = '30s';
```

---

## Tóm tắt

| Giai đoạn | Việc cần làm |
|-----------|---------------|
| **Viết query** | SELECT đúng cột, index khớp WHERE/ORDER BY, LIMIT, tránh N+1 |
| **Đánh giá** | `EXPLAIN ANALYZE` — tìm Seq Scan, Sort nặng, estimate lệch |
| **Query chậm** | Xác định → EXPLAIN → index/rewrite/cache → verify → monitor |

> Rule of thumb: **80% query chậm** do thiếu index hoặc full table scan. Chạy `EXPLAIN ANALYZE` trước khi tạo index — đừng đoán.

# EXPLAIN ANALYZE — Đọc Query Plan

Hướng dẫn đọc và debug query plan PostgreSQL. Bổ sung cho [improve-query.md](./improve-query.md) — tập trung vào **planner**, **node types**, **case study**, và **ORM debug**.

---

## 1. EXPLAIN vs EXPLAIN ANALYZE vs BUFFERS

| Lệnh | Chạy query thật? | Trả về gì |
|------|------------------|-----------|
| `EXPLAIN` | ❌ Chỉ ước lượng | Plan dự đoán (cost, rows) — nhanh, an toàn trên prod |
| `EXPLAIN ANALYZE` | ✅ Chạy thật | Plan + **actual time**, **actual rows** — dùng khi debug |
| `EXPLAIN (BUFFERS)` | Với ANALYZE | Thêm I/O: shared hit/read, temp written |

```sql
-- Debug chuẩn — dùng khi investigate query chậm
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, o.total, u.email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'pending' AND o.user_id = 123
ORDER BY o.created_at DESC
LIMIT 20;
```

**Đọc output:**

```
Limit  (cost=... rows=20) (actual time=0.05..0.12 rows=20 loops=1)
  Buffers: shared hit=45
  ->  Nested Loop  ...
        actual time=0.04..0.11 rows=20 loops=1
        Buffers: shared hit=42
        ->  Index Scan using idx_orders_user_status on orders o
              actual time=0.02..0.08 rows=20 loops=1
              Index Cond: (user_id = 123 AND status = 'pending')
```

| Field | Ý nghĩa |
|-------|---------|
| `cost=0.42..120.00` | Ước lượng: startup cost .. total cost (đơn vị tùy planner) |
| `rows=300` | Planner **đoán** trả bao nhiêu row |
| `actual time=0.02..0.08` | Thời gian thật: startup .. total (ms) |
| `actual rows=20` | Row thật trả về |
| `loops=1` | Node chạy bao nhiêu lần (Nested Loop con có thể loops=N) |
| `Buffers: shared hit=45` | Đọc từ cache RAM; `read` = đọc disk |

> **Production:** `EXPLAIN ANALYZE` chạy query thật — tránh trên query DELETE/UPDATE lớn. Dùng `EXPLAIN` (không ANALYZE) hoặc chạy trên staging có data tương tự.

---

## 2. Scan nodes — cách DB đọc data

### 2.1 Seq Scan (Sequential Scan)

Đọc **toàn bộ bảng** tuần tự từng page.

```
Seq Scan on orders  (cost=0.00..180000.00 rows=2000000)
                      (actual time=0.015..850.000 rows=2000000 loops=1)
  Filter: (status = 'pending')
  Rows Removed by Filter: 1900000
```

| Khi OK ✅ | Khi xấu ❌ |
|-----------|------------|
| Bảng nhỏ (< vài nghìn row) | Bảng lớn + filter selective |
| Select > ~30% bảng (index không lợi) | Có index phù hợp nhưng planner không dùng |
| Không có index phù hợp, one-off query | Query chạy liên tục trên bảng lớn |

**Fix:** index khớp WHERE; hoặc `ANALYZE` nếu stats cũ khiến planner chọn Seq Scan sai.

---

### 2.2 Index Scan

Dùng B-Tree index → **seek** đến row cần → đọc heap (bảng gốc) lấy cột không có trong index.

```
Index Scan using idx_orders_user_id on orders
  (cost=0.43..45.00 rows=120 width=64)
  (actual time=0.025..0.180 rows=120 loops=1)
  Index Cond: (user_id = 123)
```

> Phù hợp khi filter selective (trả ít row so với bảng).

---

### 2.3 Index Only Scan

Index **covering** — chứa đủ cột query cần, không phải đọc heap.

```
Index Only Scan using idx_orders_user_covering on orders
  (cost=0.43..12.00 rows=120 width=16)
  (actual time=0.020..0.090 rows=120 loops=1)
  Index Cond: (user_id = 123)
  Heap Fetches: 0
```

```sql
CREATE INDEX idx_orders_user_covering ON orders(user_id) INCLUDE (total, created_at);
SELECT total, created_at FROM orders WHERE user_id = 123;
```

`Heap Fetches: 0` = hoàn toàn index-only. Số > 0 = một phần row chưa visible sau vacuum.

---

### 2.4 Bitmap Scan — khi nào dùng?

Kết hợp **nhiều row từ index** thành bitmap, rồi đọc heap theo thứ tự vật lý — giảm random I/O.

```
Bitmap Heap Scan on orders
  (cost=450.00..12000.00 rows=50000)
  (actual time=5.000..85.000 rows=48000 loops=1)
  Recheck Cond: (status = 'pending')
  ->  Bitmap Index Scan on idx_orders_status
        (cost=0.00..450.00 rows=50000)
        Index Cond: (status = 'pending')
```

**Planner chọn Bitmap khi:**

- Filter trả **nhiều row** (vd: 5–30% bảng) — Index Scan từng row sẽ random I/O nhiều
- Kết hợp **nhiều index** (BitmapAnd / BitmapOr)

```
BitmapAnd  (cost=...)
  ->  Bitmap Index Scan on idx_orders_status
  ->  Bitmap Index Scan on idx_orders_created
```

| Scan type | Row trả về | Đặc điểm |
|-----------|------------|----------|
| Index Scan | Ít (selective) | Seek từng row |
| Bitmap Scan | Trung bình–nhiều | Gom rồi đọc heap có thứ tự |
| Seq Scan | Rất nhiều hoặc bảng nhỏ | Đọc hết bảng |

---

## 3. Join nodes — Nested Loop vs Hash Join vs Merge Join

### 3.1 Nested Loop

Với mỗi row bên ngoài, **seek** row khớp bên trong (thường qua index).

```
Nested Loop  (cost=0.85..125.00 rows=20) (actual time=0.05..0.15 rows=20 loops=1)
  ->  Index Scan on orders o  (actual rows=20 loops=1)
  ->  Index Scan on users u  (actual rows=1 loops=20)
        Index Cond: (id = o.user_id)
```

| Khi tốt ✅ | Khi xấu ❌ |
|------------|------------|
| Bảng ngoài **nhỏ** (LIMIT 20, filter selective) | Bảng ngoài lớn + không index bên trong |
| Bên trong có **index** trên join key | `loops=1000000` — seek 1 triệu lần |

> `loops=20` trên node con = Nested Loop chạy inner scan 20 lần — OK nếu mỗi lần nhanh.

---

### 3.2 Hash Join

Build **hash table** từ bảng nhỏ hơn, probe từ bảng lớn — tốt khi **không có index** join key hoặc join 2 bảng lớn.

```
Hash Join  (cost=1500.00..8500.00 rows=500000) (actual time=120.000..450.000 rows=480000 loops=1)
  Hash Cond: (o.user_id = u.id)
  ->  Seq Scan on orders o  (actual rows=500000)
  ->  Hash
        ->  Seq Scan on users u  (actual rows=100000)
  Buffers: temp written=12000
```

| Khi tốt ✅ | Khi xấu ❌ |
|------------|------------|
| Join 2 bảng lớn, equality join | Hash table không fit RAM → spill disk (`temp written` lớn) |
| Không index join key | Có thể tránh bằng index + Nested Loop nếu outer nhỏ |

**Dấu hiệu spill:** `Buffers: temp written=...` lớn → tăng `work_mem` (cẩn thận trên prod) hoặc thêm index/filter sớm.

---

### 3.3 Merge Join

Cả 2 bên **đã sort** theo join key → merge như merge sort. Ít gặp hơn Hash Join trong OLTP.

```
Merge Join  (cost=... rows=...)
  Merge Cond: (o.user_id = u.id)
  ->  Index Scan on orders o  (ordered by user_id)
  ->  Index Scan on users u  (ordered by id)
```

> Thường thấy khi join key trùng ORDER BY và có index phù hợp.

---

### 3.4 So sánh nhanh

| Join | Outer nhỏ + index inner | 2 bảng lớn, no index | Cần sort sẵn |
|------|-------------------------|----------------------|--------------|
| **Nested Loop** | ✅ Tốt nhất | ❌ | Không |
| **Hash Join** | ⚠️ Overhead hash | ✅ Thường được chọn | Không |
| **Merge Join** | ⚠️ | ⚠️ | ✅ Cả 2 bên sorted |

---

## 4. Sort & Aggregate

```
Sort  (cost=85000.00..87000.00 rows=500000)
      (actual time=1200.000..1350.000 rows=500000 loops=1)
  Sort Key: created_at DESC
  Sort Method: external merge  Disk: 45000kB
  ->  Seq Scan on orders
```

| Dấu hiệu | Ý nghĩa |
|----------|---------|
| `Sort Method: quicksort` Memory | Sort trong RAM — OK |
| `external merge Disk: ...` | Spill ra disk — **chậm**, cần index hỗ trợ ORDER BY hoặc giảm row trước sort |
| Sort trên hàng triệu row rồi `Limit 20` | Thiếu index — planner sort hết rồi mới cắt |

**Fix Sort nặng:**

```sql
-- Index khớp ORDER BY + WHERE → Index Scan trả row đã sorted, Limit dừng sớm
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
```

---

## 5. Statistics — khi estimate sai plan

```
Index Scan ...  (rows=100) (actual rows=85000 loops=1)
```

Estimate 100, actual 85,000 → planner chọn Nested Loop thay vì Hash Join → chậm bất ngờ.

**Fix:**

```sql
ANALYZE orders;

-- Xem stats cột
SELECT attname, n_distinct, most_common_vals, correlation
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'status';

-- Tăng stats target cho cột skew cao (optional)
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;
```

---

## 6. Case study

### Case 1: Seq Scan → Index Scan (filter selective)

**Query:**

```sql
SELECT id, total, created_at FROM orders
WHERE user_id = 12345 AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

**Trước fix — Execution Time: 4,200 ms**

```
Limit  (actual time=4180.000..4200.000 rows=20 loops=1)
  ->  Sort  (actual time=4100.000..4180.000 rows=20 loops=1)
        Sort Key: created_at DESC
        Sort Method: top-N heapsort  Memory: 26kB
        ->  Seq Scan on orders  (actual rows=8500 loops=1)
              Filter: (user_id = 12345 AND status = 'pending')
              Rows Removed by Filter: 49991500
              Buffers: shared read=450000
```

**Root cause:** Full scan 50M row, filter còn 8,500, sort rồi lấy 20.

**Fix:**

```sql
CREATE INDEX CONCURRENTLY idx_orders_user_status_created
ON orders(user_id, status, created_at DESC);
ANALYZE orders;
```

**Sau fix — Execution Time: 0.12 ms**

```
Limit  (actual time=0.05..0.12 rows=20 loops=1)
  ->  Index Scan using idx_orders_user_status_created on orders
        (actual time=0.04..0.11 rows=20 loops=1)
        Index Cond: (user_id = 12345 AND status = 'pending')
        Buffers: shared hit=25
```

---

### Case 2: OFFSET lớn → Keyset cursor

**Query:**

```sql
SELECT id, title FROM posts
WHERE status = 'published'
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 500000;
```

**Trước fix — Execution Time: 2,800 ms**

```
Limit  (actual time=2750.000..2800.000 rows=20 loops=1)
  ->  Index Scan using idx_posts_status_created on posts
        (actual time=0.050..2800.000 rows=500020 loops=1)
        Index Cond: (status = 'published')
        Buffers: shared hit=520000
```

**Root cause:** Index Scan phải **đọc 500,020 row** rồi bỏ 500,000 — index có nhưng OFFSET vẫn chậm.

**Fix — Keyset:**

```sql
SELECT id, title FROM posts
WHERE status = 'published'
  AND (created_at, id) < ('2024-03-15T10:00:00Z', 98765)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Sau fix — Execution Time: 0.08 ms**

```
Limit  (actual time=0.04..0.08 rows=20 loops=1)
  ->  Index Scan using idx_posts_status_created_id on posts
        (actual time=0.03..0.07 rows=20 loops=1)
        Index Cond: (status = 'published' AND (created_at, id) < (...))
        Buffers: shared hit=8
```

> Chi tiết pagination: [pagination.md](./pagination.md)

---

### Case 3: Correlated subquery → JOIN (Hash Join → Nested Loop sau fix)

**Query:**

```sql
SELECT u.id, u.email,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'paid') AS paid_count
FROM users u
WHERE u.plan = 'enterprise'
LIMIT 50;
```

**Trước fix — Execution Time: 3,500 ms**

```
Limit  (actual rows=50 loops=1)
  ->  Seq Scan on users u  (actual rows=1200 loops=1)
        Filter: (plan = 'enterprise')
        SubPlan 1
          ->  Aggregate  (actual rows=1 loops=1200)
                ->  Index Scan on orders o  (actual rows=45 loops=1200)
                      Index Cond: (user_id = u.id AND status = 'paid')
```

**Root cause:** SubPlan chạy **1,200 lần** (mỗi enterprise user một lần).

**Fix:**

```sql
SELECT u.id, u.email, COUNT(o.id) AS paid_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'
WHERE u.plan = 'enterprise'
GROUP BY u.id, u.email
LIMIT 50;
```

**Sau fix — Execution Time: 45 ms**

```
Limit  (actual rows=50 loops=1)
  ->  GroupAggregate  (actual rows=50 loops=1)
        ->  Hash Join  (actual rows=54000 loops=1)
              Hash Cond: (o.user_id = u.id)
              ->  Seq Scan on orders o  (Filter: status = 'paid')
              ->  Hash
                    ->  Index Scan on users u  (Filter: plan = 'enterprise')
              Buffers: shared hit=8500
```

**Có thể tối ưu thêm:** partial index `CREATE INDEX idx_orders_paid_user ON orders(user_id) WHERE status = 'paid'`.

---

## 7. ORM Debug — bật log SQL

ORM che giấu SQL thật — bật log để copy sang `EXPLAIN ANALYZE`.

### 7.1 Prisma

```typescript
// prisma/client.ts — dev only
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Params:', e.params);
  console.log('Duration:', e.duration, 'ms');
});
```

**Env variable (Prisma 5+):**

```bash
# .env — chỉ dev/staging
DEBUG="prisma:query"
```

**Lấy SQL từ method:**

```typescript
// In ra SQL không execute — Prisma không có sẵn, dùng log event
// Hoặc dùng $queryRaw với SQL viết tay để EXPLAIN
const result = await prisma.$queryRaw`
  EXPLAIN ANALYZE
  SELECT * FROM "User" WHERE email = ${email}
`;
```

---

### 7.2 TypeORM

```typescript
// data-source.ts
export const AppDataSource = new DataSource({
  // ...
  logging: ['query', 'error', 'warn'],
  maxQueryExecutionTime: 100, // log query > 100ms
});
```

**Chỉ log query chậm:**

```typescript
logging: (level, message) => {
  if (message.includes('execution time')) {
    console.log(message);
  }
},
```

**QueryBuilder — xem SQL trước khi chạy:**

```typescript
const qb = userRepo
  .createQueryBuilder('u')
  .leftJoinAndSelect('u.orders', 'o')
  .where('u.plan = :plan', { plan: 'enterprise' })
  .take(50);

console.log(qb.getSql());       // SQL với $1, $2...
console.log(qb.getParameters()); // { plan: 'enterprise' }

// Copy SQL + params → psql → EXPLAIN ANALYZE
```

---

### 7.3 Quy trình debug ORM → EXPLAIN

```
1. Bật query log (Prisma event / TypeORM logging)
2. Reproduce request chậm — copy SQL + params
3. Thay $1, $2 bằng giá trị thật (hoặc PREPARE)
4. EXPLAIN (ANALYZE, BUFFERS) trên staging
5. Fix: index / rewrite / pagination / N+1
6. Verify plan + tắt log trên prod
```

**Phát hiện N+1 từ log:**

```
Query: SELECT * FROM users LIMIT 100        -- 1 lần
Query: SELECT * FROM orders WHERE user_id=1 -- lặp 100 lần ← N+1
Query: SELECT * FROM orders WHERE user_id=2
...
```

---

## 8. Khi nào full scan vẫn OK?

| Tình huống | Giải thích |
|------------|------------|
| Bảng < ~10k row | Seq Scan nhanh hơn overhead index |
| Query trả > ~30% bảng | Index Scan + random heap fetch có thể chậm hơn Seq Scan |
| `SELECT COUNT(*)` không filter | Phải đếm hết — index không giúp nhiều |
| Table mới, chưa ANALYZE | Planner chưa có stats — chạy ANALYZE trước khi kết luận |

---

## Tóm tắt

| Node | Nhớ nhanh |
|------|-----------|
| **Seq Scan** | Đọc hết bảng — OK bảng nhỏ, xấu bảng lớn + filter selective |
| **Index Scan** | Seek selective — pattern tốt cho OLTP |
| **Bitmap Scan** | Nhiều row từ index — trung bình selectivity |
| **Index Only Scan** | Covering index — không đọc heap |
| **Nested Loop** | Outer nhỏ + index inner |
| **Hash Join** | 2 bảng lớn, equality — watch `temp written` |
| **Sort + Limit** | Sort hàng triệu row → cần index hỗ trợ ORDER BY |

> Workflow: **ORM log → EXPLAIN ANALYZE → đọc node chậm nhất → fix → verify actual time**.

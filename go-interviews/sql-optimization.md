# Tối ưu câu SQL — Các bước & Đánh giá hiệu quả

> Demo SQL: [demo/sql-optimization](./demo/sql-optimization/)  
> Liên quan: [when-to-index](./when-to-index.md), [indexing vs partitioning](./indexing-vs-partitioning.md)

## Tóm tắt một câu

Tối ưu SQL theo vòng lặp **đo → phân tích plan → rewrite query → index/schema → verify**; câu SQL được coi là **đủ tối ưu** khi plan khớp intent (index scan thay vì seq scan không cần thiết), **latency ổn định** dưới SLA, và **rows đọc ≈ rows trả về** — không chỉ nhìn `EXPLAIN` mà phải đối chiếu production.

---

## Quy trình tối ưu (các bước)

### Bước 1 — Xác định query cần tối ưu

Không tối ưu mù — ưu tiên query **ảnh hưởng lớn nhất**:

| Nguồn | Công cụ / cách |
|-------|----------------|
| Log chậm | Postgres `log_min_duration_statement`, slow query log |
| Thống kê tích lũy | `pg_stat_statements` — `total_exec_time`, `mean_exec_time`, `calls` |
| APM / tracing | Datadog, Jaeger — span DB chiếm % cao |
| Ứng dụng | Endpoint P99 cao, N+1 từ ORM |

**Công thức ưu tiên:** `total_time = mean_time × calls` — query chạy ít nhưng rất chậm vẫn đáng xem; query chạy hàng triệu lần với mean vừa phải thường **impact lớn hơn**.

### Bước 2 — Thu thập context

Trước khi sửa, ghi lại:

- Câu SQL **đầy đủ** (kể cả bind params mẫu).
- **Cardinality** bảng, tỷ lệ filter (`WHERE status = 'pending'` bao nhiêu %).
- **Pattern đọc/ghi** — read-heavy hay write-heavy.
- **SLA** mong muốn (vd. < 50ms P95).

### Bước 3 — `EXPLAIN` / `EXPLAIN ANALYZE`

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ...
```

| Option | Mục đích |
|--------|----------|
| `ANALYZE` | Chạy query thật — **actual time**, **actual rows** |
| `BUFFERS` | Shared hit/read — cache hit hay đọc disk |
| `VERBOSE` | Chi tiết output columns (khi debug sâu) |

**Đọc plan — tìm “điểm nóng”:**

| Node plan | Khi đáng lo |
|-----------|-------------|
| **Seq Scan** trên bảng lớn | Filter có selectivity cao mà vẫn full scan |
| **Nested Loop** + row lớn | Thiếu index phía inner table |
| **Hash Join** / **Sort** | Bộ nhớ tạm, spill to disk (`work_mem`) |
| **Rows Removed by Filter** cao | Đọc nhiều row, trả ít — index hoặc rewrite |
| **Estimate ≠ Actual** (10×+) | Stats cũ → chạy `ANALYZE` |

### Bước 4 — Rewrite query (trước khi thêm index)

Index không cứu được query thiết kế sai.

| Anti-pattern | Cách xử lý |
|--------------|------------|
| `SELECT *` | Chỉ lấy cột cần — giảm I/O, dễ covering index |
| `WHERE lower(email) = ?` | Expression index hoặc lưu normalized column |
| `OR` nhiều cột | `UNION ALL` từng nhánh có index, hoặc redesign |
| `LIKE '%keyword%'` | Full-text (`tsvector`), `pg_trgm`, hoặc search engine |
| Subquery correlated | Đổi sang `JOIN` / CTE nếu planner xử lý tốt hơn |
| `IN (SELECT ...)` lớn | `EXISTS` hoặc `JOIN` — đo cả hai |
| `OFFSET` lớn (pagination) | **Keyset** (`WHERE id > ? ORDER BY id LIMIT n`) |
| N+1 từ app | `JOIN` / `WHERE id IN (...)` / batch load |
| Aggregate trên toàn bảng | Pre-aggregate, materialized view, cache |

### Bước 5 — Index & schema

Sau rewrite, thêm index **đúng pattern** (xem [when-to-index.md](./when-to-index.md)):

- Composite: equality trước range; đúng leftmost prefix.
- Partial index cho subset nhỏ (`status = 'pending'`).
- Covering index (`INCLUDE`) cho lookup + vài cột SELECT.
- FK — index phía bảng bị join vào.

Schema level:

- **Partition** khi table quá lớn + filter theo time/region ([indexing-vs-partitioning.md](./indexing-vs-partitioning.md)).
- Denormalize có chủ đích khi read >> write và đo được lợi ích.

### Bước 6 — Cấu hình & tầng trên DB

| Hạng mục | Ghi chú |
|----------|---------|
| `ANALYZE` / autovacuum | Stats mới — planner chọn đúng |
| `work_mem`, `shared_buffers` | Sort/hash lớn — tune có đo |
| Connection pool | PgBouncer — tránh quá nhiều connection |
| Cache (Redis) | Kết quả đọc lặp, không thay query chậm |
| Read replica | Scale đọc — không fix query xấu trên primary |

### Bước 7 — Verify & giám sát

1. `EXPLAIN ANALYZE` lại — so sánh plan trước/sau.
2. Benchmark có **data production-like** (không chỉ 100 row dev).
3. Deploy — theo dõi P50/P95/P99, CPU, IOPS.
4. `pg_stat_user_indexes` — index mới có `idx_scan` > 0.
5. Regression — query khác có bị planner đổi plan xấu không.

---

## Làm sao biết câu SQL đã tối ưu?

### Tiêu chí kỹ thuật (plan)

| Dấu hiệu tốt | Dấu hiệu chưa tốt |
|--------------|-------------------|
| **Index Scan / Index Only Scan** khi filter selective | **Seq Scan** trên bảng triệu row với `WHERE` hẹp |
| **Bitmap Index Scan** hợp lý khi kết hợp nhiều điều kiện | **Nested Loop** với inner seq scan hàng triệu lần |
| Actual rows ≈ rows trả về | Rows Removed by Filter >> rows output |
| Estimate rows gần actual (trong ~2–5×) | Estimate lệch 10×+ — stats sai |
| Không Sort / Hash nếu index đã cover `ORDER BY` | Sort trên hàng triệu row |
| `Buffers: shared hit` cao, `read` thấp (warm cache) | `read` cao liên tục — I/O bound |
| Execution Time < SLA mục tiêu | Time tăng tuyến tính khi data tăng |

**Lưu ý:** Seq Scan **không** luôn xấu — bảng nhỏ hoặc đọc ~30%+ table, planner có thể chọn seq scan đúng. “Tối ưu” = plan **phù hợp** với data và query, không phải “mọi query đều index”.

### Tiêu chí production (kết quả thật)

| Metric | Ý nghĩa |
|--------|---------|
| **Latency P95/P99** | Ổn định dưới SLA khi tải thật |
| **Throughput (QPS)** | Không degrade khi CCU tăng |
| **CPU / IOPS DB** | Giảm sau tối ưu cùng workload |
| **`pg_stat_statements.mean_exec_time`** | Giảm, không chỉ lần đầu cache ấm |
| **Lock wait / deadlock** | Giảm sau rút ngắn transaction |

### Checklist nhanh — query “đủ tốt” chưa?

```
□ Đã EXPLAIN ANALYZE với volume data thực tế
□ Plan dùng access path hợp lý (không full scan vô lý)
□ Rows đọc / rows trả về không lệch hàng orders
□ Latency đạt SLA ở staging + production
□ Không tạo index thừa (idx_scan = 0 sau 1–2 tuần)
□ Query không lock bảng lâu / không giữ transaction mở khi gọi API
```

---

## Ví dụ workflow (Postgres)

**Query chậm:** danh sách order pending của user, sort mới nhất.

```sql
-- Trước: thiếu index, planner seq scan
SELECT id, amount, created_at
FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

1. `EXPLAIN ANALYZE` → Seq Scan + Filter + Sort.
2. Rewrite: giữ nguyên (query đã ổn), thêm index:

```sql
CREATE INDEX idx_orders_user_status_created
ON orders (user_id, status, created_at DESC);
-- hoặc partial nếu pending << completed:
-- CREATE INDEX ... ON orders (user_id, created_at DESC) WHERE status = 'pending';
```

3. `EXPLAIN ANALYZE` lại → Index Scan, bỏ Sort.
4. Production: P95 từ 800ms → 12ms.

---

## Nhầm lẫn thường gặp

| Nhầm | Thực tế |
|------|---------|
| Chỉ nhìn `EXPLAIN` không `ANALYZE` | Cost ước lượng ≠ thời gian thật |
| Thêm index là xong | Rewrite query / stats / volume data quan trọng hơn |
| Mọi Seq Scan đều xấu | Bảng nhỏ hoặc đọc gần hết table — seq scan hợp lý |
| Test trên DB dev 1000 row | Plan production khác hẳn |
| Cache che query chậm | Cache miss hoặc invalidation vẫn làm sập DB |
| `OFFSET 100000` “chậm một chút” | PostgreSQL vẫn phải đọc+bỏ 100k row |

---

## Câu trả lời ngắn (phỏng vấn)

1. **Tìm** query hot — `pg_stat_statements`, slow log, APM (`total_time = mean × calls`).
2. **`EXPLAIN (ANALYZE, BUFFERS)`** — seq scan, nested loop, sort, estimate vs actual.
3. **Rewrite** — bỏ `SELECT *`, tránh function/OR/LIKE `%x%`, N+1, OFFSET lớn.
4. **Index / partition** đúng pattern filter-join-sort ([when-to-index](./when-to-index.md)).
5. **`ANALYZE`**, tune pool/cache nếu cần.
6. **Verify** — plan tốt hơn + P95 đạt SLA + `idx_scan` > 0; seq scan trên bảng lớn selective vẫn là red flag.

---

## Chạy demo

```bash
cd go-interviews/demo/sql-optimization
docker compose up -d
./run.sh
```

| File demo | Nội dung |
|-----------|----------|
| `sql/01_setup.sql` | Seed users, orders |
| `sql/02_baseline_explain.sql` | Plan trước tối ưu — Seq Scan |
| `sql/03_rewrite_query.sql` | SELECT *, subquery vs JOIN |
| `sql/04_add_index.sql` | Thêm index — Index Scan |
| `sql/05_explain_analyze.sql` | ANALYZE + BUFFERS — đo thật |
| `sql/06_bad_patterns.sql` | LIKE `%x%`, function on column |
| `sql/07_pagination.sql` | OFFSET vs keyset |

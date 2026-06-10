# Database Index

## 1. Các loại index trong Database

**Index** — cấu trúc dữ liệu giúp DB **tìm row nhanh hơn** mà không cần full table scan. Mỗi index tốn thêm **disk** và làm **INSERT/UPDATE/DELETE** chậm hơn một chút.

### Tổng quan các loại phổ biến

| Loại | Mô tả | Dùng khi |
|------|--------|----------|
| **B-Tree** | Mặc định hầu hết DB (Postgres, MySQL InnoDB) | `=`, `>`, `<`, `BETWEEN`, `LIKE 'prefix%'`, `ORDER BY` |
| **Hash** | Lookup chính xác qua hash table | Chỉ `=` — Postgres, MySQL Memory engine |
| **Unique** | Đảm bảo giá trị **không trùng** | `email`, `username`, business key |
| **Composite** | Index **nhiều cột** | Query filter/sort nhiều cột cùng lúc |
| **Partial** | Index **một phần row** thỏa điều kiện | Bảng lớn, chỉ query subset (vd: `status = 'active'`) |
| **Covering** | Index chứa **đủ cột** query cần | Tránh lookup về bảng gốc (index-only scan) |
| **Full-Text** | Tìm kiếm văn bản | `LIKE '%keyword%'`, search engine đơn giản |
| **Clustered** | Index **sắp xếp luôn data** trên disk | InnoDB PK, SQL Server clustered index |

---

### 1. B-Tree Index (mặc định)

Cấu trúc cây cân bằng — phổ biến nhất, hỗ trợ so sánh range.

```sql
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Hỗ trợ tốt
WHERE created_at > '2024-01-01'
WHERE user_id = 123
ORDER BY created_at DESC
```

> Hầu hết index bạn tạo hàng ngày đều là **B-Tree**.

---

### 2. Hash Index

Chỉ tối ưu **equality (`=`)** — không hỗ trợ range, sort.

```sql
-- PostgreSQL
CREATE INDEX idx_users_email_hash ON users USING HASH (email);
```

> Ít dùng hơn B-Tree. B-Tree đủ tốt cho `=` trong hầu hết case.

---

### 3. Unique Index

Đảm bảo **không trùng giá trị** — PK thực chất là unique index.

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Tương đương
ALTER TABLE users ADD CONSTRAINT uk_email UNIQUE (email);
```

> Dùng cho cột cần duy nhất: email, phone, slug.

---

### 4. Composite Index (Multi-column)

Index trên **nhiều cột** — thứ tự cột **rất quan trọng** (leftmost prefix rule).

```sql
-- Query: WHERE status = 'active' AND created_at > '2024-01-01'
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
```

**Quy tắc thứ tự:**

1. Cột **equality (`=`)** trước
2. Cột **range (`>`, `<`, `BETWEEN`)** sau
3. Cột **ORDER BY** nên nằm trong index

```sql
-- ✅ Index (status, created_at) hỗ trợ:
WHERE status = 'active'
WHERE status = 'active' AND created_at > '2024-01-01'

-- ❌ Không dùng được index hiệu quả:
WHERE created_at > '2024-01-01'  -- thiếu status (cột đầu)
```

---

### 5. Partial Index

Chỉ index **một phần row** — nhỏ hơn, nhanh hơn full index.

```sql
-- Chỉ index order đang active
CREATE INDEX idx_orders_active ON orders(created_at)
WHERE status = 'active';
```

> Phù hợp khi query luôn filter điều kiện cố định (soft delete, status).

---

### 6. Covering Index (Index-only scan)

Index chứa **tất cả cột** query cần — DB không phải đọc bảng gốc.

```sql
-- PostgreSQL — INCLUDE thêm cột không dùng để search
CREATE INDEX idx_orders_user_covering ON orders(user_id)
INCLUDE (total, created_at);

-- Query chỉ cần user_id, total, created_at → index-only scan
SELECT total, created_at FROM orders WHERE user_id = 123;
```

> Giảm random I/O — đặc biệt hiệu quả với bảng rộng nhiều cột.

---

### 7. Full-Text Index

Tìm kiếm văn bản — thay `LIKE '%keyword%'` (không dùng B-Tree).

```sql
-- PostgreSQL — GIN index
CREATE INDEX idx_posts_search ON posts USING GIN (to_tsvector('english', title || ' ' || body));

SELECT * FROM posts
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('nestjs');
```

| Engine | Loại full-text |
|--------|----------------|
| PostgreSQL | **GIN**, GiST |
| MySQL | **FULLTEXT** |

---

### 8. Clustered vs Non-clustered

| | **Clustered** | **Non-clustered** |
|---|---------------|-------------------|
| **Data** | Row vật lý **sắp theo index** | Index riêng, trỏ tới row |
| **Số lượng** | **Một** clustered index / bảng | Nhiều non-clustered |
| **Ví dụ** | InnoDB: **PK = clustered** | Mọi index thường khác PK |

```sql
-- MySQL InnoDB: PK tự động là clustered index
-- Secondary index trỏ tới PK key
```

> **PostgreSQL** không có clustered index thật sự (chỉ `CLUSTER` command sắp xếp vật lý một lần).

---

### 9. Index đặc thù PostgreSQL

| Loại | Dùng cho |
|------|----------|
| **BRIN** | Bảng rất lớn, data **tự nhiên sorted** (timestamp, log) — index nhỏ |
| **GIN** | JSONB, array, full-text |
| **GiST** | Geometry, range type |
| **B-Tree** | Mặc định — hầu hết case |

```sql
-- BRIN cho bảng log theo thời gian
CREATE INDEX idx_logs_time_brin ON logs USING BRIN (created_at);
```

---

### 10. GIN Index cho JSONB (PostgreSQL)

**JSONB** — kiểu JSON **binary**, hỗ trợ query linh hoạt (`@>`, `?`, `?&`, `?|`). **B-Tree không tối ưu** cho các toán tử này → dùng **GIN**.

**Tạo index:**

```sql
-- Mặc định: jsonb_ops — hỗ trợ nhiều toán tử
CREATE INDEX idx_events_metadata ON events USING GIN (metadata);

-- jsonb_path_ops — index nhỏ hơn, chỉ hỗ trợ containment (@>)
CREATE INDEX idx_events_metadata_path ON events USING GIN (metadata jsonb_path_ops);
```

| Operator class | Hỗ trợ | Kích thước index |
|----------------|--------|----------------|
| **jsonb_ops** (mặc định) | `@>`, `?`, `?&`, `?\|`, `@?`, `@@` | Lớn hơn |
| **jsonb_path_ops** | Chủ yếu `@>` (containment) | **Nhỏ hơn ~30%** |

**Query được tối ưu:**

```sql
-- Containment — key/value nằm trong JSON
SELECT * FROM events
WHERE metadata @> '{"status": "active"}';

-- Key tồn tại
SELECT * FROM events
WHERE metadata ? 'userId';

-- Nhiều key
SELECT * FROM events
WHERE metadata ?& array['userId', 'status'];
```

**Index theo key cụ thể** — khi luôn filter một field:

```sql
-- B-Tree trên expression — query equality/range theo 1 key
CREATE INDEX idx_events_status ON events ((metadata->>'status'));

SELECT * FROM events WHERE metadata->>'status' = 'active';
```

**Khi nào dùng GIN JSONB:**

| Nên dùng | Không cần |
|----------|-----------|
| Query `@>`, `?`, `?&` trên JSONB | Chỉ đọc/ghi toàn bộ JSON, không filter |
| Metadata động, schema linh hoạt | Filter cố định 1–2 key → expression index B-Tree đủ |
| Bảng lớn, đọc nhiều | Bảng nhỏ, ghi liên tục (GIN làm INSERT/UPDATE chậm) |

**Lưu ý:**

- GIN index **lớn** và **chậm khi ghi** — cân nhắc trước khi index mọi cột JSONB.
- `jsonb_path_ops` chỉ tốt nếu query chủ yếu dùng `@>`.
- Dùng `EXPLAIN ANALYZE` — phải thấy `Bitmap Index Scan` trên GIN index.

> **GIN + JSONB** = index cho query **containment** và **key existence**. Filter theo **một key cố định** → cân nhắc **B-Tree expression index** thay thế.

---

### PK vs FK — index mặc định

| | Index mặc định? |
|---|-----------------|
| **Primary Key** | **Có** — luôn có unique index |
| **Foreign Key** | **Postgres: không** tự tạo. **MySQL InnoDB: có thể** tự tạo |

> Best practice: **luôn tự tạo index trên cột FK** ở bảng con — dùng trong JOIN, WHERE, CASCADE delete.

```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

---

### Khi nào không nên tạo index

- Bảng **nhỏ** — full scan đủ nhanh
- Cột **selectivity thấp** — `gender`, `is_active` (ít giá trị khác nhau)
- Bảng **ghi nhiều, đọc ít** — index làm INSERT/UPDATE chậm
- Quá nhiều index trên một bảng

---

## 2. Ưu nhược điểm của Index

### Ưu điểm

| Ưu điểm | Mô tả |
|---------|--------|
| **Tăng tốc đọc** | `SELECT`, `WHERE`, `JOIN`, `ORDER BY` nhanh hơn — tránh full table scan |
| **Tăng tốc lookup** | Tìm row theo key (PK, unique) gần như O(log n) với B-Tree |
| **Hỗ trợ sort** | `ORDER BY` trên cột có index — tránh sort in-memory |
| **Ràng buộc dữ liệu** | Unique index đảm bảo **không trùng** (email, slug) |
| **Tăng tốc FK** | Index cột FK giúp JOIN và CASCADE delete/update nhanh |
| **Covering index** | Index-only scan — không cần đọc bảng gốc |

### Nhược điểm

| Nhược điểm | Mô tả |
|------------|--------|
| **Tốn disk** | Mỗi index là bản sao cấu trúc riêng — bảng nhiều index có thể **lớn hơn data** |
| **Chậm khi ghi** | `INSERT`, `UPDATE`, `DELETE` phải **cập nhật tất cả index** liên quan |
| **Maintenance** | Index cần **VACUUM/REINDEX** (Postgres) khi bloat — tốn tài nguyên |
| **Chọn sai index** | Optimizer có thể chọn index kém → chậm hơn full scan |
| **Index không dùng** | Tạo index nhưng query không match → lãng phủ disk + chậm write |
| **Selectivity thấp** | Index cột ít giá trị khác nhau (`boolean`) — hiệu quả kém |
| **Quá nhiều index** | Mỗi index thêm chi phí write — cân bằng read vs write |

### Cân bằng Read vs Write

```
Đọc nhiều, ít ghi  →  nhiều index hợp lý
Ghi nhiều, ít đọc  →  ít index, chỉ index thật sự cần
```

**Checklist trước khi tạo index:**

1. Query có dùng cột đó trong `WHERE` / `JOIN` / `ORDER BY` không?
2. Bảng đủ lớn để index có ý nghĩa?
3. Selectivity có đủ cao?
4. Đã chạy `EXPLAIN ANALYZE` chưa?
5. Chi phí ghi có chấp nhận được không?

> **Tóm lại**: Index **đổi tốc độ đọc lấy chi phí ghi + disk**. Chỉ index cột **thực sự dùng trong query**, tránh index thừa. Mặc định **B-Tree**; dùng **Unique / Composite / Partial / GIN** khi cần tối ưu sâu.

---

## 3. Phân biệt `WHERE`, `HAVING`, `GROUP BY`

**Thứ tự thực thi SQL:**

```
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

| Mệnh đề | Vai trò | Lọc cái gì |
|---------|---------|------------|
| **WHERE** | Lọc **row** trước khi nhóm | Từng dòng riêng lẻ |
| **GROUP BY** | **Nhóm** row theo cột, dùng aggregate (`COUNT`, `SUM`, `AVG`...) | — |
| **HAVING** | Lọc **nhóm** sau khi aggregate | Kết quả sau GROUP BY |

### `WHERE` — lọc row

Chạy **trước** `GROUP BY` — không dùng aggregate function.

```sql
SELECT user_id, COUNT(*) AS order_count
FROM orders
WHERE status = 'completed'   -- lọc row trước khi đếm
GROUP BY user_id;
```

### `GROUP BY` — gom nhóm

Gom các row có cùng giá trị cột → một nhóm, tính aggregate trên mỗi nhóm.

```sql
SELECT user_id, COUNT(*) AS order_count, SUM(total) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY user_id;            -- mỗi user_id = 1 nhóm
```

- Cột trong `SELECT` (không aggregate) **phải có trong `GROUP BY`**.
- `GROUP BY` có thể nhóm theo **nhiều cột**.

### `HAVING` — lọc nhóm

Chạy **sau** `GROUP BY` — filter trên kết quả aggregate.

```sql
SELECT user_id, COUNT(*) AS order_count
FROM orders
WHERE status = 'completed'       -- WHERE: lọc row
GROUP BY user_id
HAVING COUNT(*) > 5;            -- HAVING: lọc nhóm có > 5 đơn
```

### So sánh nhanh `WHERE` vs `HAVING`

| | **WHERE** | **HAVING** |
|---|-----------|------------|
| **Thời điểm** | Trước `GROUP BY` | Sau `GROUP BY` |
| **Lọc** | Row | Nhóm (group) |
| **Aggregate** | **Không** dùng `COUNT()`, `SUM()`... | **Có thể** dùng aggregate |
| **Hiệu năng** | Lọc sớm → ít row vào GROUP BY | Lọc sau → đã aggregate hết |

```sql
-- ❌ Sai — WHERE không dùng aggregate
SELECT user_id, COUNT(*) FROM orders
WHERE COUNT(*) > 5
GROUP BY user_id;

-- ✅ Đúng
SELECT user_id, COUNT(*) FROM orders
GROUP BY user_id
HAVING COUNT(*) > 5;
```

### Ví dụ đầy đủ

```sql
-- User nào có tổng doanh thu đơn completed > 1 triệu, tính từ 2024
SELECT user_id, SUM(total) AS revenue
FROM orders
WHERE status = 'completed'           -- 1. lọc row: chỉ đơn completed
  AND created_at >= '2024-01-01'     -- 1. lọc row: từ 2024
GROUP BY user_id                       -- 2. nhóm theo user
HAVING SUM(total) > 1000000            -- 3. lọc nhóm: doanh thu > 1M
ORDER BY revenue DESC                  -- 4. sắp xếp kết quả
LIMIT 10;
```

> **WHERE** lọc **row**, **GROUP BY** gom **nhóm**, **HAVING** lọc **nhóm**. Đặt điều kiện trên cột thường vào **WHERE** (sớm hơn, nhanh hơn); điều kiện trên **aggregate** phải dùng **HAVING**.

Note: Khóa ngoại là cột ở bảng con tham chiếu tới khóa chính của bảng cha, đảm bảo dữ liệu nhất quán


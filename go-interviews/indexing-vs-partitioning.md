# Indexing vs Partitioning trong DB — Khái niệm & Cách xử lý

> Demo SQL: [demo/indexing-vs-partitioning](./demo/indexing-vs-partitioning/)

## Tóm tắt một câu

| | **Indexing** | **Partitioning** |
|---|-------------|------------------|
| **Là gì** | Cấu trúc phụ (B-tree, GIN, …) giúp **tìm nhanh** row trong table | Chia **một table logic** thành nhiều **table vật lý** (partition) |
| **Giải quyết** | Query **chậm** vì scan toàn bộ table | Table **quá lớn** — quản lý, purge, scan theo vùng |
| **Đơn vị** | Index trên cột / expression | Partition theo RANGE, LIST, HASH (Postgres) |
| **Ẩn với app** | Có — planner tự chọn index | Có — query vẫn `FROM orders`, planner chọn partition |
| **Thay thế nhau?** | **Không** — thường **bổ sung** cho nhau |

**Indexing** = “mục lục sách”. **Partitioning** = “chia sách thành nhiều cuốn theo chương”.

---

## Indexing là gì?

**Index** là cấu trúc dữ liệu riêng (thường B-tree trên Postgres) lưu **giá trị cột + con trỏ tới row**, sắp xếp để tìm kiếm / sort / join nhanh hơn **sequential scan** toàn table.

- **Đọc nhanh hơn**, **ghi chậm hơn** (phải cập nhật index).
- Tốn **disk + RAM** (index cũng được cache).
- Planner dùng khi `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY` khớp index.

**Loại index hay gặp (Postgres):**

| Loại | Dùng khi |
|------|----------|
| **B-tree** (mặc định) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY` |
| **Hash** | Chỉ equality `=` (ít dùng hơn B-tree) |
| **GIN** | JSONB, full-text, array `@>` |
| **GiST / BRIN** | Geometry, dữ liệu rất lớn theo thứ tự vật lý (time series) |

---

## Partitioning là gì?

**Partitioning** chia table thành nhiều **child table** (partition) theo quy tắc:

| Chiến lược | Ví dụ |
|------------|--------|
| **RANGE** | `created_at` theo tháng: `2024-01`, `2024-02`, … |
| **LIST** | `region IN ('VN', 'SG', 'US')` |
| **HASH** | `HASH(user_id)` — phân tán đều (ít dùng cho time purge) |

Query vào **parent table**; optimizer **partition pruning** — chỉ scan partition liên quan.

**Lợi ích chính:**

- **Purge / archive** nhanh: `DROP PARTITION` thay vì `DELETE` hàng tỷ row.
- Giảm **working set** — partition cũ ít vào cache nếu không query.
- **Maintenance** theo chunk: `VACUUM`, reindex từng partition.

**Không phải silver bullet:** partition sai key → vẫn scan nhiều partition; overhead routing insert.

---

## So sánh chi tiết

| Tiêu chí | Indexing | Partitioning |
|----------|----------|----------------|
| Mục tiêu | Tăng tốc **lookup / sort** | Giảm phạm vi **scan / quản lý** data lớn |
| Table logic | 1 table | 1 table (parent) + N partition |
| Phù hợp data | Mọi quy mô, cột filter rõ | Table rất lớn (triệu–tỷ row), pattern query theo key partition |
| DELETE cũ | Chậm (`DELETE WHERE date < …`) | Nhanh (`DROP TABLE partition_2023`) |
| Unique constraint | Toàn table (1 index) | Postgres: unique phải **gồm partition key** |
| Foreign key | Bình thường | Phức tạp hơn (FK tới partitioned table hạn chế) |
| Khi query không có partition key | Index vẫn giúp nếu có cột index | **Pruning fail** → scan mọi partition |

---

## Khi nào cần / không cần?

### Nên dùng **Index**

- Query filter/join/sort trên cột **có selectivity** (lọc được nhiều row).
- Bảng vừa và lớn đều cần nếu có pattern đọc rõ.
- Ví dụ: `WHERE user_id = ?`, `WHERE status = 'pending' AND created_at > ?`.

### Không nên (hoặc cẩn thận) **Index**

- Bảng **nhỏ** — sequential scan đủ nhanh.
- Cột **cardinality thấp** (boolean, status 2–3 giá trị) — index kém hiệu quả.
- Write-heavy, đọc ít — quá nhiều index làm chậm INSERT/UPDATE.
- Expression không khớp index (function trên cột không có index expression).

### Nên dùng **Partition**

- **Time-series / log / event**: query và purge theo `created_at`, `event_date`.
- Table **> vài chục GB** hoặc hàng trăm triệu row, retention rõ (giữ 90 ngày).
- SLA khác nhau theo vùng data (partition mới hot, cũ cold storage).

### Không nên partition sớm

- Bảng **< ~10–50 triệu row** và chưa có pain — overhead quản lý partition, migration.
- Query **không** filter theo partition key — pruning không giúp.
- Cần unique global phức tạp mà không đưa partition key vào unique.

---

## Pattern hay gặp (phỏng vấn / production)

| Bài toán | Chỉ index | Chỉ partition | Kết hợp |
|----------|-----------|---------------|---------|
| `SELECT * FROM orders WHERE user_id = 1` | B-tree `(user_id)` | Không đủ nếu table khổng lồ | Partition HASH/RANGE nếu cần + index `(user_id)` |
| Báo cáo tháng 3/2024 | Index `(created_at)` | RANGE theo tháng + pruning | Partition theo tháng + index cột filter phụ |
| Xóa data > 1 năm | `DELETE` chậm, bloat | `DROP PARTITION` | Partition RANGE + job drop partition |
| Full table scan analytics | Index không giúp | Partition giảm scan nếu filter date | BRIN trên time + partition |

---

## Cách xử lý / thiết kế

### Chọn index

1. Xem query chậm: `EXPLAIN (ANALYZE, BUFFERS)`.
2. Index cột trong `WHERE`, `JOIN ON`, `ORDER BY` (composite index — **thứ tự cột** quan trọng).
3. **Covering index** (`INCLUDE`) nếu chỉ cần thêm vài cột SELECT.
4. Đo **write amplification** — bỏ index thừa.

### Chọn partition key

1. Key = cột **luôn có** trong query time-range / tenant (nếu multi-tenant LIST).
2. **RANGE** time: bound theo tháng/quý; tạo partition trước (cron).
3. Đặt **index trên từng partition** (hoặc parent — Postgres tạo trên partition).

### Kết hợp (thực tế phổ biến)

```
orders partitioned by RANGE (created_at)
  → partition orders_2024_01, orders_2024_02, ...
  → mỗi partition: INDEX (user_id), INDEX (status) nếu cần
```

Query `WHERE created_at >= '2024-03-01' AND user_id = 5`:

1. **Pruning** → chỉ partition tháng 3+.
2. **Index** `(user_id)` trong partition → ít row scan.

### Vận hành

| Việc | Công cụ / hành động |
|------|---------------------|
| Query chậm | `EXPLAIN ANALYZE`, `pg_stat_user_indexes` (idx_scan vs idx_tup_read) |
| Index thừa | `idx_scan = 0` kéo dài → cân nhắc drop |
| Partition tương lai | Tạo trước partition empty — tránh insert fail |
| Bloat | `VACUUM` / reindex partition cũ |

---

## Nhầm lẫn thường gặp

| Nhầm | Thực tế |
|------|---------|
| “Partition thay index” | Partition giảm **số partition** scan; trong partition vẫn cần index cho filter khác |
| “Càng nhiều index càng tốt” | Mỗi index = chi phí ghi + storage |
| “Shard = partition” | **Shard** = chia **nhiều DB/node**; **partition** = trong **một** DB |
| “Index trên mọi cột WHERE” | Composite index cần **đúng thứ tự** cột; không thay thế partition key |

---

## Câu trả lời ngắn (phỏng vấn)

1. **Index** tối ưu **cách tìm row** trong table; **partition** chia **table lớn** thành phần vật lý để scan/purge/maintenance theo vùng.
2. Index cho **lookup/sort**; partition cho **scale size + retention + pruning theo key**.
3. Thường **dùng cả hai**: partition theo `created_at`, index `(user_id, status)` trong từng partition.
4. Partition không có key trong `WHERE` → có thể **chậm hơn** (scan all partitions).
5. Đánh giá bằng `EXPLAIN ANALIZE` và metric production — không partition/index “theo cảm giác”.

---

## Chạy demo

```bash
cd go-interviews/demo/indexing-vs-partitioning
docker compose up -d          # Postgres local (tùy chọn)
./run.sh                      # hoặc: psql -f sql/01_... -f sql/02_...
```

| File demo | Nội dung |
|-----------|----------|
| `sql/01_setup.sql` | Tạo bảng `events` + seed data |
| `sql/02_index_before_after.sql` | Sequential scan vs Index Scan |
| `sql/03_partition_setup.sql` | RANGE partition theo tháng |
| `sql/04_partition_pruning.sql` | Pruning vs full scan |
| `sql/05_index_on_partition.sql` | Index trên partitioned table |

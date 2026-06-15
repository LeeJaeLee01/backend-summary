# Đánh index với dữ liệu nào? — Khái niệm & Cách xử lý

> Demo SQL: [demo/when-to-index](./demo/when-to-index/)  
> Liên quan: [indexing vs partitioning](./indexing-vs-partitioning.md)

## Tóm tắt một câu

Đánh index trên cột (hoặc tổ hợp cột) mà query **thường xuyên filter / join / sort**, có **selectivity cao** (lọc được đủ nhiều row để tránh full scan), và **pattern query khớp** thứ tự index — không index mọi cột “cho chắc”.

---

## Selectivity & Cardinality

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **Cardinality** | Số giá trị **khác nhau** trong cột (cao = nhiều giá trị unique) |
| **Selectivity** | Tỷ lệ row bị **loại** sau khi filter — càng cao càng tốt cho index |

**Quy tắc nhanh:**

| Loại dữ liệu / cột | Cardinality | Nên index? |
|--------------------|-------------|------------|
| Primary key, UUID, `user_id` | Rất cao | Có — lookup chính |
| Email, phone (unique) | Cao | Có — unique index |
| `created_at`, `order_id` FK | Trung bình–cao | Có nếu hay filter range / join |
| `status` (3–5 giá trị) | Thấp | Có **nếu** kết hợp cột khác hoặc **partial index** |
| `is_active` boolean | Rất thấp (~2) | Thường **không** — trừ partial index phần nhỏ |
| `gender`, flag 0/1 | Rất thấp | Hầu hết **không** đáng |

Index hiệu quả khi một lần tra cứu **thu hẹp** kết quả từ hàng triệu row xuống hàng trăm/nghìn — không phải từ 50% table xuống 49%.

---

## Đánh index với dữ liệu / cột nào?

### 1. Cột hay xuất hiện trong query

| Vị trí trong query | Ví dụ cột | Ghi chú |
|--------------------|-----------|---------|
| `WHERE` equality | `user_id`, `order_id`, `email` | B-tree mặc định |
| `WHERE` range | `created_at`, `amount` | B-tree; BRIN nếu table cực lớn + time ordered |
| `JOIN ON` | FK `customer_id`, `product_id` | Index phía **bảng bị join vào** (thường là FK) |
| `ORDER BY` | `created_at DESC` | Index cùng thứ tự sort giúp tránh sort step |
| `GROUP BY` | `status`, `category_id` | Index hỗ trợ nếu khớp thứ tự |

Chỉ index cột **có trong query thật** (từ log chậm, `pg_stat_statements`) — không đoán.

### 2. Kiểu dữ liệu → loại index

| Kiểu dữ liệu | Index phù hợp | Use case |
|--------------|---------------|----------|
| Số nguyên, bigint, serial | **B-tree** | ID, FK, counter |
| `VARCHAR` / `TEXT` (lookup đầy đủ) | **B-tree** | email, slug — cân nhắc độ dài |
| `TEXT` prefix / `LIKE 'abc%'` | **B-tree** (pattern cố định prefix) | `LIKE 'VN-%'` |
| `TEXT` full-text search | **GIN** + `tsvector` | `to_tsvector('simple', body)` |
| `JSONB` | **GIN** (`jsonb_path_ops` nếu chỉ `@>`) | `payload @> '{"type":"click"}'` |
| `ARRAY` | **GIN** | `tags @> ARRAY['go']` |
| `INET`, geometry | **GiST** | IP range, spatial |
| Timestamp **append-only** (log lớn) | **BRIN** trên `created_at` | Ít storage, phù hợp time series |
| Chỉ equality (hiếm) | **Hash** | Postgres: B-tree đủ tốt trong hầu hết case |

### 3. Composite index — thứ tự cột

Index `(a, b, c)` hỗ trợ tốt:

- `WHERE a = ?`
- `WHERE a = ? AND b = ?`
- `WHERE a = ? AND b = ? AND c = ?`
- `WHERE a = ? ORDER BY b`

**Không** tối ưu (leftmost prefix rule):

- Chỉ `WHERE b = ?` (bỏ qua `a`)
- Chỉ `WHERE c = ?`

**Đặt cột nào trước:**

1. Cột **equality** (`=`) trước cột **range** (`>`, `<`, `BETWEEN`).
2. Cột **selectivity cao** hơn trước (thường).
3. Khớp **query phổ biến nhất** — một composite thay vì 3 index lẻ tẻ.

Ví dụ orders: `(user_id, created_at)` cho `WHERE user_id = ? AND created_at > ?`.

### 4. Partial index — filter subset

Index **chỉ một phần** row:

- Phù hợp cột cardinality thấp nhưng **phần lớn query** chỉ quan tâm subset nhỏ.
- Ví dụ: `WHERE status = 'pending'` chiếm 1% row → partial index `WHERE status = 'pending'`.
- Tiết kiệm disk, write nhẹ hơn full index trên `status`.

### 5. Covering index (`INCLUDE`)

B-tree `(user_id) INCLUDE (email, name)` — index-only scan, không cần đọc heap nếu SELECT chỉ cần các cột trong index.

Dùng khi query **lặp lại** cùng pattern: lookup `user_id` + lấy vài cột cố định.

### 6. Unique index

- Cột / tổ hợp cột **business unique**: `email`, `(tenant_id, slug)`.
- Vừa ràng buộc toàn vẹn vừa tăng tốc lookup.

---

## Khi KHÔNG nên đánh index

| Tình huống | Lý do |
|------------|--------|
| Bảng **nhỏ** (< vài nghìn row) | Sequential scan rẻ hơn index |
| Cột **gần như constant** (boolean, 2–3 status) | Index scan gần như full table |
| **Write-heavy**, đọc ít | Mỗi INSERT/UPDATE phải sửa mọi index |
| Cột **hay UPDATE** | Index phải maintain liên tục |
| `WHERE` bọc **function** cột: `WHERE lower(email) = ?` | Không dùng index thường — cần expression index |
| `OR` nhiều nhánh low-selectivity | Planner có thể bỏ index |
| Cột **TEXT dài** full scan nội dung | Index kém; dùng full-text / search engine |
| Index **không ai dùng** (`idx_scan = 0`) | Chi phí ghi thừa — drop sau khi verify |

---

## Pattern hay gặp

| Bài toán | Index gợi ý |
|----------|-------------|
| Login theo email | `UNIQUE (email)` hoặc `(lower(email))` nếu case-insensitive |
| Danh sách order của user, mới nhất | `(user_id, created_at DESC)` |
| Queue job `status = pending` | **Partial** `(created_at) WHERE status = 'pending'` |
| Audit log theo thời gian | BRIN `(created_at)` hoặc B-tree + partition |
| JSONB filter key cố định | GIN trên `payload` hoặc expression `(payload->>'type')` |
| Soft delete `deleted_at IS NULL` | Partial: `WHERE deleted_at IS NULL` trên cột filter chính |
| Multi-tenant | Leading column `(tenant_id, ...)` trong mọi composite |

---

## Quy trình thực tế

1. **Đo** — query chậm từ APM / `pg_stat_statements` / log.
2. **`EXPLAIN (ANALYZE, BUFFERS)`** — Seq Scan? Rows estimate sai?
3. **`ANALYZE` table** — stats cũ khiến planner chọn sai.
4. **Thêm index** — một composite đúng thường hơn năm index lẻ.
5. **Verify** — plan đổi sang Index Scan / Bitmap; latency giảm.
6. **Giám sát** — `pg_stat_user_indexes`: `idx_scan`, size; drop index thừa.

---

## Nhầm lẫn thường gặp

| Nhầm | Thực tế |
|------|---------|
| Index mọi cột trong `WHERE` một lần | Một **composite** đúng thứ tự > nhiều single-column |
| `(created_at, user_id)` cho `WHERE user_id = ?` | Sai thứ tự — cần `(user_id, created_at)` |
| Index `status` full khi 99% là `completed` | Dùng **partial** cho `pending` / `failed` |
| `LIKE '%keyword%'` | B-tree **không** giúp — full-text hoặc trigram (`pg_trgm`) |
| Index thay thế thiết kế query | Query rewrite (tránh `SELECT *`, tránh function trên cột) vẫn cần |

---

## Câu trả lời ngắn (phỏng vấn)

1. Index cột **hay filter/join/sort**, **cardinality cao**, query **lặp lại nhiều**.
2. **FK và lookup key** (`user_id`, `email`) — ưu tiên đầu.
3. **Composite**: equality trước range; đúng **leftmost prefix**; khớp query thật.
4. **Partial / covering** cho subset nhỏ và SELECT hẹp.
5. **Không** index boolean/status full, bảng nhỏ, cột hay đổi — đo bằng `EXPLAIN` và `pg_stat_user_indexes`.

---

## Chạy demo

```bash
cd go-interviews/demo/when-to-index
docker compose up -d
./run.sh
```

| File demo | Nội dung |
|-----------|----------|
| `sql/01_setup.sql` | Bảng mẫu users, orders, events |
| `sql/02_cardinality.sql` | High vs low cardinality |
| `sql/03_composite_order.sql` | Thứ tự cột composite |
| `sql/04_partial_index.sql` | Partial index `status = pending` |
| `sql/05_covering_index.sql` | `INCLUDE` — index-only scan |
| `sql/06_index_types.sql` | GIN JSONB, expression index |
| `sql/07_index_not_used.sql` | Function trên cột — index fail |

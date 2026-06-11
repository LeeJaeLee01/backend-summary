# Table Partitioning trong Database

**Partitioning** (phân vùng bảng) — chia một bảng logic lớn thành nhiều **bảng vật lý nhỏ hơn** (partition), trong khi app vẫn query như một bảng duy nhất. DB engine tự **route** query đến đúng partition cần đọc.

```
orders (bảng logic)
├── orders_2024_01   ← partition tháng 1
├── orders_2024_02   ← partition tháng 2
├── orders_2024_03
└── ...
```

> Ví dụ dùng **PostgreSQL** (native partitioning từ PG 10+). MySQL InnoDB hỗ trợ tương tự.

---

## Partition là gì?

Thay vì lưu 500 triệu row trong **một bảng monolithic**, data được chia theo một **partition key** (vd: `created_at`, `region`, `tenant_id`). Mỗi partition là bảng con độc lập — có index riêng, có thể nằm trên disk/tablespace khác nhau.

**App không cần biết** — query vẫn viết `SELECT * FROM orders WHERE ...`, planner tự chọn partition phù hợp (**partition pruning**).

```sql
-- App query bình thường
SELECT * FROM orders
WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01';

-- DB chỉ scan partition orders_2024_06, bỏ qua 11 partition còn lại
```

---

## Các loại partitioning phổ biến

| Loại | Chia theo | Dùng khi |
|------|-----------|----------|
| **Range** | Khoảng giá trị (date, id) | Log, order, event theo thời gian |
| **List** | Danh sách giá trị cố định | Theo region, tenant, status |
| **Hash** | Hash của cột | Phân tán đều, không có pattern range rõ |

---

## Khi nào nên dùng Partition?

### ✅ Nên dùng

| Tình huống | Lý do |
|------------|-------|
| Bảng **> vài chục triệu row** và tiếp tục tăng | Giảm kích thước mỗi partition → index nhỏ hơn, scan nhanh hơn |
| Query **luôn filter theo partition key** | Partition pruning loại bỏ phần lớn data không cần đọc |
| Cần **xóa/archive data cũ** thường xuyên | `DROP PARTITION` thay vì `DELETE` hàng triệu row (nhanh, không bloat) |
| **Retention policy** rõ ràng | Giữ 12 tháng log, xóa tháng cũ hàng tháng |
| **Maintenance** theo batch | `VACUUM`, reindex từng partition thay vì cả bảng |

### ❌ Không nên dùng (hoặc chưa cần)

| Tình huống | Lý do |
|------------|-------|
| Bảng **< vài triệu row** | Index thường đủ, partition thêm complexity |
| Query **không filter theo partition key** | Phải scan mọi partition → chậm hơn bảng thường |
| Cần **JOIN phức tạp** cross-partition liên tục | Planner khó tối ưu |
| Team chưa có **quy trình quản lý partition** | Partition cũ quên drop, partition mới quên tạo → lỗi insert |
| Thay thế cho **index tốt** | Partition không fix query thiếu index |

> Rule of thumb: partition khi **data quá lớn** hoặc **lifecycle rõ ràng** (time-based retention), không phải giải pháp đầu tiên cho query chậm.

---

## Ưu và nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Query nhanh hơn nhờ partition pruning | Phức tạp vận hành (tạo/drop partition) |
| Xóa data cũ cực nhanh (`DROP TABLE`) | Unique constraint phải include partition key |
| Index nhỏ hơn trên từng partition | Query không có partition key → scan all partitions |
| Maintenance song song từng partition | Migration schema khó hơn bảng thường |
| Có thể đặt partition cũ trên storage rẻ | ORM/tooling đôi khi hỗ trợ kém |

---

## 1. Range Partition — theo thời gian (phổ biến nhất)

### Use case: Order history (E-commerce)

Shop có **200M+ orders**, user thường xem order **3–6 tháng gần đây**, báo cáo theo tháng. Giữ data 2 năm, xóa tháng cũ hơn.

```sql
CREATE TABLE orders (
  id          BIGSERIAL,
  user_id     BIGINT NOT NULL,
  total       NUMERIC(12, 2),
  status      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

-- Tạo partition theo tháng
CREATE TABLE orders_2024_06 PARTITION OF orders
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE orders_2024_07 PARTITION OF orders
  FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

-- Index trên từng partition (hoặc tạo trên parent — PG tự apply)
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);
```

**Query được tối ưu:**

```sql
-- ✅ Pruning — chỉ scan 1 partition
SELECT * FROM orders
WHERE user_id = 123
  AND created_at >= '2024-06-01' AND created_at < '2024-07-01';

-- ❌ Không pruning — scan tất cả partition
SELECT * FROM orders WHERE user_id = 123;
```

**Archive data cũ (thực tế hàng tháng):**

```sql
-- Xóa toàn bộ data tháng 1/2023 — vài giây, không DELETE từng row
DROP TABLE orders_2023_01;

-- Hoặc detach rồi archive sang cold storage
ALTER TABLE orders DETACH PARTITION orders_2023_01;
-- copy sang S3 / bảng archive, rồi DROP
```

**Tự động tạo partition (cron job):**

```sql
-- Tạo partition tháng tiếp theo trước khi tháng mới bắt đầu
CREATE TABLE IF NOT EXISTS orders_2024_08 PARTITION OF orders
  FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
```

> Production thường dùng extension **`pg_partman`** để auto-create và auto-drop partition.

---

### Use case: Application logs / Audit trail

Hệ thống ghi **50k log/giây**, retention **90 ngày**, ít khi query log > 7 ngày.

```sql
CREATE TABLE audit_logs (
  id          BIGSERIAL,
  actor_id    BIGINT,
  action      TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Partition theo ngày hoặc tuần tùy volume
CREATE TABLE audit_logs_2024_w24 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-06-10') TO ('2024-06-17');
```

**Cron hàng ngày:**

```sql
-- Tạo partition tuần mới
CREATE TABLE audit_logs_2024_w25 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-06-17') TO ('2024-06-24');

-- Drop partition quá 90 ngày
DROP TABLE audit_logs_2024_w13;
```

**Lợi ích thực tế:** `DELETE FROM audit_logs WHERE created_at < ...` trên 10 tỷ row mất **hàng giờ** và gây bloat. `DROP TABLE` partition cũ mất **vài giây**.

---

### Use case: IoT / Metrics (time-series)

Sensor gửi metric mỗi 5 giây — bảng `metrics` tăng **hàng tỷ row/năm**. Query dashboard luôn filter `WHERE time > now() - interval '24 hours'`.

```sql
CREATE TABLE metrics (
  device_id   INT NOT NULL,
  metric_name TEXT NOT NULL,
  value       DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (recorded_at);

CREATE TABLE metrics_2024_06_11 PARTITION OF metrics
  FOR VALUES FROM ('2024-06-11') TO ('2024-06-12');
```

> Với time-series nặng, cân nhắc **TimescaleDB** (hypertable = partition + compression + retention policy built-in). Xem [why-postgres-and-timescaledb.md](./why-postgres-and-timescaledb.md).

---

## 2. List Partition — theo giá trị cố định

### Use case: Multi-region SaaS

App phục vụ **US, EU, APAC** — data compliance yêu cầu tách region, query thường filter `WHERE region = 'EU'`.

```sql
CREATE TABLE customers (
  id        BIGSERIAL,
  region    TEXT NOT NULL,
  email     TEXT,
  plan      TEXT
) PARTITION BY LIST (region);

CREATE TABLE customers_us PARTITION OF customers
  FOR VALUES IN ('US');

CREATE TABLE customers_eu PARTITION OF customers
  FOR VALUES IN ('EU');

CREATE TABLE customers_apac PARTITION OF customers
  FOR VALUES IN ('APAC', 'JP', 'SG');
```

```sql
-- ✅ Chỉ scan customers_eu
SELECT * FROM customers WHERE region = 'EU' AND plan = 'enterprise';
```

---

### Use case: Multi-tenant (tenant lớn, số lượng tenant ít)

10 enterprise tenant, mỗi tenant **hàng chục triệu row**. Query luôn có `tenant_id`.

```sql
CREATE TABLE events (
  id          BIGSERIAL,
  tenant_id   INT NOT NULL,
  event_type  TEXT,
  payload     JSONB,
  created_at  TIMESTAMPTZ
) PARTITION BY LIST (tenant_id);

CREATE TABLE events_tenant_101 PARTITION OF events
  FOR VALUES IN (101);

CREATE TABLE events_tenant_102 PARTITION OF events
  FOR VALUES IN (102);
```

> **Lưu ý:** Với **hàng nghìn tenant nhỏ**, list partition không phù hợp (quá nhiều partition). Dùng **hash partition** hoặc shared table + index `(tenant_id, ...)`.

---

## 3. Hash Partition — phân tán đều

### Use case: Session / Queue data không có pattern thời gian

Bảng `sessions` 100M row, query chủ yếu `WHERE session_id = ?` — cần chia đều, không có range rõ.

```sql
CREATE TABLE sessions (
  session_id  UUID PRIMARY KEY,
  user_id     BIGINT,
  data        JSONB,
  expires_at  TIMESTAMPTZ
) PARTITION BY HASH (session_id);

CREATE TABLE sessions_p0 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_p2 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_p3 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

**Lợi ích:** Mỗi partition ~25M row — index nhỏ hơn, maintenance nhanh hơn.

**Hạn chế:** Query range (`WHERE expires_at < ...`) **không pruning** — phải scan all partitions.

---

## Partition vs các giải pháp khác

| Vấn đề | Thử trước | Partition khi |
|--------|-----------|---------------|
| Query chậm | Index, rewrite query | Bảng quá lớn + filter theo partition key |
| Data cũ chiếm disk | Archive sang cold storage | Retention cố định, drop partition định kỳ |
| Time-series metrics | TimescaleDB hypertable | Native PG partition cũng đủ cho case đơn giản |
| Multi-tenant nhỏ | Index `(tenant_id, ...)` | Tenant lớn, số tenant ít, cần tách vật lý |

---

## Checklist triển khai

### 1. Chọn partition key đúng

Partition key phải xuất hiện trong **hầu hết query quan trọng**:

```sql
-- Partition key: created_at
-- ✅ Query phổ biến đều có created_at
WHERE created_at >= ... AND user_id = 123

-- ❌ Query không có created_at → full scan all partitions
WHERE user_id = 123
```

### 2. Unique constraint phải include partition key

```sql
-- ❌ Lỗi — unique trên id alone không hợp lệ với partition by range
CREATE TABLE orders (...) PARTITION BY RANGE (created_at);
ALTER TABLE orders ADD PRIMARY KEY (id);

-- ✅ PK phải include partition key
ALTER TABLE orders ADD PRIMARY KEY (id, created_at);
```

### 3. Tạo partition trước khi data đến

Insert vào khoảng chưa có partition → **lỗi**. Dùng cron hoặc `pg_partman` tạo trước.

### 4. Monitor partition pruning

```sql
EXPLAIN SELECT * FROM orders
WHERE created_at >= '2024-06-01' AND created_at < '2024-07-01';

-- Phải thấy: Partition Prune / chỉ scan orders_2024_06
-- Không thấy Append scan trên 24 partition
```

### 5. Không quá nhiều partition

| Số partition | Ghi chú |
|--------------|---------|
| 10–100 | Hợp lý |
| 100–1000 | Cần cân nhắc — planning overhead |
| > 1000 | Tránh — mỗi partition quá nhỏ hoặc quá nhiều metadata |

---

## Ví dụ thực tế tổng hợp

| Công ty / Hệ thống | Bảng | Chiến lược | Lý do |
|--------------------|------|------------|-------|
| **E-commerce** (Shopee-style) | `orders`, `order_items` | Range by month | 500M+ orders, query theo tháng, drop data > 2 năm |
| **Fintech** | `transactions` | Range by month + list by currency | Compliance, audit theo kỳ, tách USD/VND |
| **Social app** | `notifications` | Range by week | 1B+ row, user chỉ xem 30 ngày, TTL 60 ngày |
| **Logging platform** | `app_logs` | Range by day | Ingest cao, retention 30–90 ngày, drop hàng ngày |
| **SaaS B2B** | `events` | List by `tenant_id` (top 20 tenant) | Tenant lớn cô lập I/O, query luôn có tenant_id |
| **Game server** | `player_actions` | Hash by `player_id` | Phân tán đều, lookup theo player_id |

---

## Migration bảng hiện có sang partition

Không thể `ALTER TABLE` trực tiếp thành partition table trên PG. Quy trình phổ biến:

```sql
-- 1. Tạo bảng partition mới
CREATE TABLE orders_new (...) PARTITION BY RANGE (created_at);
-- tạo các partition con...

-- 2. Copy data (batch, tránh lock lâu)
INSERT INTO orders_new SELECT * FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';

-- 3. Rename (trong maintenance window)
BEGIN;
ALTER TABLE orders RENAME TO orders_old;
ALTER TABLE orders_new RENAME TO orders;
COMMIT;

-- 4. Verify, rồi drop orders_old
```

> Production nên dùng **logical replication** hoặc tool như `pg_partman` / `pgloader` để giảm downtime.

---

## Tóm tắt

- **Partition** = chia bảng lớn thành nhiều phần nhỏ theo partition key — app query như bình thường
- **Dùng khi:** bảng rất lớn, query filter theo key, cần retention/archive, maintenance theo batch
- **Không dùng khi:** bảng nhỏ, query không có partition key, chưa thử index
- **Range by time** là pattern phổ biến nhất — orders, logs, events, metrics
- **List** cho region/tenant lớn; **Hash** cho phân tán đều không có time pattern
- Vận hành: auto-create/drop partition, verify pruning bằng `EXPLAIN`, PK phải include partition key

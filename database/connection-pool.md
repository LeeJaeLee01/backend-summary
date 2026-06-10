# Connection Pool

> **Một câu:** Pool giữ sẵn N connection DB — app **borrow → query → release**, thay vì mở/đóng mỗi request.

```
Không pool:  Request → mở connection → query → đóng
Có pool:     Request → mượn từ pool → query → trả về pool
```

**Tại sao cần:** Tạo connection tốn ~50–300ms (TCP, SSL, auth). PostgreSQL giới hạn `max_connections` (mặc định **100**). Mỗi connection tốn ~5–10 MB RAM trên DB.

---

## 1. Cách hoạt động

| Trạng thái | Mô tả |
|------------|--------|
| **Idle** | Rảnh trong pool, sẵn sàng cấp |
| **Active** | Đang chạy query/transaction |
| **Pending** | Request chờ — pool đã full |

**Luồng:** `connect()` → có idle thì cấp ngay / chưa đủ `max` thì tạo mới / đã full thì chờ (timeout) → `release()` về pool.

---

## 2. Giá trị mặc định & cấu hình

### PostgreSQL

| Tham số | Mặc định |
|---------|----------|
| `max_connections` | **100** |
| `superuser_reserved_connections` | **3** → user thường tối đa **97** |

### App pool (`pg` default — hay bị bỏ quên ⚠️)

| Tham số | `pg` default | Nên set production |
|---------|--------------|-------------------|
| `max` | **10** | Tính theo công thức |
| `min` | **0** | 1–2 |
| `idleTimeoutMillis` | 10s | 30–60s |
| `connectionTimeoutMillis` | **0** (chờ vô hạn!) | 5–10s |

```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  max: parseInt(process.env.DB_POOL_MAX ?? '5'),
  connectionTimeoutMillis: 5_000,
  application_name: 'order-api',
});
```

### Công thức tính `max`

```
max_per_instance = (max_connections_DB - reserved) / tổng_số_instance_tất_cả_service
```

**Ví dụ:** DB budget 90, 5 instance (3 service) → `max = 18/instance`. Thêm service/replica → **giảm max**, không giữ nguyên.

| Tham số | Ý nghĩa | Gợi ý |
|---------|---------|-------|
| `max` | Connection tối đa | Theo công thức |
| `min` | Giữ warm | 1–2 |
| `idleTimeoutMillis` | Đóng idle | 30–60s |
| `connectionTimeoutMillis` | Chờ lấy connection | 5–10s |
| `maxLifetime` | Rotate connection cũ | 30–60 phút |

---

## 3. Vấn đề thường gặp

| Vấn đề | Triệu chứng | Xử lý |
|--------|-------------|-------|
| **Pool exhaustion** | `timeout acquiring connection` | Tăng pool, fix leak, tối ưu query |
| **Connection leak** | Ổn lúc đầu, timeout dần; restart hết lỗi | Luôn `release()` trong `finally` |
| **`too many connections`** | DB từ chối | Giảm pool, thêm PgBouncer |
| **`idle in transaction`** | Connection treo, chiếm slot | Tx ngắn; set timeout DB |

```typescript
// ✅ Luôn release
const client = await pool.connect();
try {
  return (await client.query('SELECT ...')).rows;
} finally {
  client.release();
}

// ❌ Gọi HTTP trong transaction = giữ connection lâu
await dataSource.transaction(async (m) => {
  await m.save(order);
  await fetch('https://payment-api.com'); // sai!
  await m.save(payment);
});
```

**Guardrail trên DB:**

```sql
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';
```

---

## 4. PgBouncer — gom connection toàn hệ thống

App pool chỉ tái sử dụng **trong 1 process**. PgBouncer gom **nhiều service** → ít connection thật tới PostgreSQL.

```
Service A (pool 5) ──┐
Service B (pool 5) ──┼──► PgBouncer (pool ~40) ──► PostgreSQL (max 100)
Lambda   (pool 1) ───┘
```

### Pooling modes

| Mode | Mô tả | Dùng khi |
|------|--------|----------|
| **Transaction** | Giữ connection trong 1 tx | REST API CRUD ✅ (phổ biến nhất) |
| **Session** | Giữ suốt session | Cần `LISTEN`, temp table, advisory lock |
| **Statement** | Trả sau mỗi SQL | Rất hạn chế, ít dùng |

### Nhược điểm & cách xử lý

| Nhược điểm | Cách xử lý |
|------------|-----------|
| Mất session persistence (`transaction` mode) | Tắt prepared statements; hoặc `session` mode |
| Prepared statement lỗi | `pg`: `prepare: false` — Prisma: `?pgbouncer=true` |
| `LISTEN/NOTIFY`, migration, `pg_dump` | Connect **thẳng DB**, không qua PgBouncer |
| Hàng đợi khi pool nhỏ (`cl_waiting`) | Tăng `default_pool_size`; tối ưu query; tx ngắn |
| Single point of failure | 2+ PgBouncer + LB/VIP; hoặc **RDS Proxy** (AWS) |
| App vẫn set `max` quá lớn | Giữ app `max: 3–5`; PgBouncer gom phần còn lại |
| Thêm latency | Đặt cùng VPC/AZ |

```ini
# pgbouncer.ini
pool_mode = transaction
default_pool_size = 40
max_client_conn = 500
reserve_pool_size = 5
```

```
App / Lambda  → pgbouncer:6432
Migration/Admin → postgres:5432  (thẳng DB)
```

> PgBouncer giải quyết **số lượng connection**, không thay thế tối ưu query hay transaction design.

---

## 5. Nhiều service cùng 1 Database

Mỗi service × mỗi instance = **pool riêng**. Connection **cộng dồn**, không có isolation.

```
3 service × 2 instance × max 10 = 60 connection (chưa kể Lambda)
```

### Giải pháp

| Bước | Chi tiết |
|------|----------|
| **Connection budget** | Bảng phân bổ `max` per service — config qua env |
| **PgBouncer** | Bắt buộc khi ≥ 3 service hoặc scale nhiều instance |
| **`application_name`** | Trace service nào chiếm connection |
| **Tách DB / read replica** | Khi contention cao |
| **Không tăng `max_connections` DB** là bước đầu | Tune pool + PgBouncer trước |

**Budget ví dụ:**

| Service | Instance | max/instance | Tổng |
|---------|----------|--------------|------|
| Order API | 3 | 5 | 15 |
| User API | 2 | 5 | 10 |
| Worker | 2 | 8 | 16 |
| **Tổng** | **7** | | **41** / 90 budget |

**Monitor:**

```sql
SELECT application_name, state, count(*)
FROM pg_stat_activity WHERE datname = 'mydb'
GROUP BY 1, 2 ORDER BY 3 DESC;
```

**Checklist thêm service:** Tính lại budget → set `application_name` → pool qua env → `connectionTimeout` → load test tổng instance.

---

## 6. Lambda / Serverless

Lambda **không giống** ECS/K8s — container có thể mới mỗi invocation, concurrent cao → **connection storm**.

```
1000 Lambda concurrent × 1 conn = 1000 → vượt max_connections 100
```

### Giải pháp (theo thứ tự ưu tiên)

1. **RDS Proxy** (AWS) hoặc **PgBouncer** — bắt buộc production
2. **Singleton pool** ở module scope, `max: 1` per container
3. Open-close mỗi invocation — chỉ prototype/traffic thấp

```typescript
// pool.ts — NGOÀI handler, reuse warm container
let pool: Pool | undefined;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.RDS_PROXY_ENDPOINT, // không phải DB endpoint
      max: 1,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

// handler — không gọi pool.end()
export const handler = async (event) => {
  const result = await getPool().query('SELECT ...', [event.id]);
  return { statusCode: 200, body: JSON.stringify(result.rows) };
};
```

| Giải pháp | Production? |
|-----------|-------------|
| RDS Proxy / PgBouncer | ✅ |
| Singleton `max:1` + proxy | ✅ |
| Singleton only (không proxy) | ⚠️ Traffic thấp |
| Connect thẳng DB | ❌ |
| `max: 10` default | ❌ |

**Lambda + VPC:** cold start thêm 1–10s (ENI). Giảm: RDS Proxy, Provisioned Concurrency, cùng AZ.

---

## 7. Kiến trúc thực tế (Hybrid)

```
┌──────────── PgBouncer / RDS Proxy (pool ~50) ────────────┐
└─────────────────────────┬────────────────────────────────┘
                          ▼
                    PostgreSQL
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   Order API (ECS)   User API (ECS)   Lambda
   max:5 × 3 inst    max:5 × 2 inst   max:1 × N
```

---

## 8. Cheat sheet

```
CÔNG THỨC
  max_per_instance = (max_connections - reserved) / tổng_instance_tất_cả_service

RULE VÀNG
  borrow → dùng → release (luôn finally)
  transaction ngắn — không await HTTP trong tx
  1 request = 1 connection — không share

KHI NÀO DÙNG GÌ
  1 service, ít instance     → app pool đủ
  ≥ 3 service / nhiều replica → PgBouncer
  Lambda + RDS               → RDS Proxy + singleton max:1
  Migration / pg_dump        → connect thẳng DB

MONITOR
  pg_stat_activity (application_name, idle in transaction)
  PgBouncer: SHOW POOLS (cl_waiting > 0 = nghẽn)
  Alert: connections > 80% max_connections

LỖI NHANH
  timeout acquiring connection → pool full / leak / query chậm
  too many connections         → giảm max, thêm PgBouncer
  prepared statement exists    → PgBouncer tx mode, tắt prepare
```

> Pool lớn ≠ tốt hơn. Tìm sweet spot qua monitoring + load test.

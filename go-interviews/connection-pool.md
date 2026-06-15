# Connection pool

## Tóm tắt một câu

**Connection pool** tái sử dụng kết nối DB/Redis/HTTP — tránh chi phí **mở connection mới** (TCP + TLS + auth) mỗi request. Cấu hình `max open`, `max idle`, `max lifetime` — pool quá nhỏ → chờ; quá lớn → DB quá tải.

---

## Vì sao cần pool?

Mở connection PostgreSQL mất ~ms–tens ms (TCP, TLS, auth). 1000 RPS mà mỗi request mở mới → 1000 connection/s — DB giới hạn `max_connections` (~100–500).

Pool giữ sẵn N connection — request **borrow → dùng → return**.

---

## Tham số quan trọng (Go `database/sql`)

| Param | Ý nghĩa |
|-------|---------|
| `SetMaxOpenConns(n)` | Tối đa connection **đang mở** (active + idle) |
| `SetMaxIdleConns(n)` | Connection **idle** giữ trong pool |
| `SetConnMaxLifetime(d)` | Đóng connection sau thời gian (rotate, LB) |
| `SetConnMaxIdleTime(d)` | Đóng idle quá lâu |

**Gợi ý:** `MaxOpen` ≈ số concurrent request DB thực tế; không set = unlimited (nguy hiểm).

---

## Công thức ước lượng

```
connections ≈ (core_pod × replica) × queries_per_request
```

Ví dụ: 10 pod, mỗi request 2 query song song, `MaxOpen` ~ 20–40/pod → tổng 200–400 — so với DB `max_connections`.

Dùng **PgBouncer** transaction pooling khi nhiều pod, connection vượt ngưỡng DB.

---

## HTTP client pool

`http.Client` reuse TCP qua `Transport.MaxIdleConns`, `MaxIdleConnsPerHost`. Mỗi request `NewClient()` mới → không reuse → chậm.

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân |
|-------------|-------------|
| `wait for connection` timeout | Pool exhausted — tăng pool hoặc giảm latency query |
| DB `too many connections` | Tổng pool × pod > DB limit |
| Connection stale | Thiếu `ConnMaxLifetime` sau failover LB |
| Leak connection | Không `rows.Close()`, tx không commit/rollback |

---

## Câu trả lời ngắn (phỏng vấn)

Pool reuse connection giảm latency và số connection tới DB. Tune `MaxOpen`, `MaxIdle`, `MaxLifetime`; tổng connection mọi pod không vượt DB limit; dùng PgBouncer khi scale; luôn `defer rows.Close()`.

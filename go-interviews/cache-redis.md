# Cache — Loại, Redis, chiến lược triển khai

## Tóm tắt một câu

Cache lưu bản sao data **gần app** để giảm latency và tải DB. Redis là **in-memory KV** phổ biến — chọn **chiến lược** (cache-aside, write-through…), **TTL**, **invalidation**, và chấp nhận **cache miss/stampede**.

---

## Các tầng cache

| Tầng | Ví dụ | Đặc điểm |
|------|-------|----------|
| **In-process** | `sync.Map`, LRU trong app | Nhanh nhất; không share giữa pod |
| **Distributed** | Redis, Memcached | Share giữa pod; network hop |
| **CDN** | CloudFront | Static asset, edge |
| **DB buffer** | Postgres shared_buffers | Tự động, không control app |

---

## Chiến lược cache

| Pattern | Flow | Dùng khi |
|---------|------|----------|
| **Cache-aside** | App đọc cache → miss → đọc DB → ghi cache | Phổ biến nhất |
| **Read-through** | Cache layer tự load DB khi miss | Logic tập trung ở cache lib |
| **Write-through** | Ghi DB + cache đồng thời | Cần cache luôn fresh |
| **Write-behind** | Ghi cache trước, flush DB async | Write cực cao; rủi ro mất data |
| **Refresh-ahead** | Proactive refresh trước TTL | Giảm miss spike |

**Cache-aside (hay nhất):**

```
val = redis.Get(key)
if miss { val = db.Query(); redis.Set(key, val, TTL) }
```

---

## Redis — cấu trúc & thuật toán

| Cấu trúc | Use case |
|----------|----------|
| **String** | Cache object JSON, counter |
| **Hash** | Object field (user profile) |
| **List** | Queue đơn giản (cẩn thận mất message) |
| **Set / ZSet** | Leaderboard, rank theo score |
| **Stream** | Event log, consumer group |
| **Bitmap / HyperLogLog** | DAU estimate, feature flag |

**Thuật toán eviction** (khi đầy RAM): `allkeys-lru`, `volatile-lru`, `allkeys-lfu` — tùy key có TTL hay không.

---

## Vấn đề cần xử lý

| Vấn đề | Giải pháp |
|--------|-----------|
| **Cache stampede** | Nhiều request cùng miss → thundering herd DB | Singleflight, lock, jitter TTL |
| **Stale data** | TTL + invalidate khi write (`DEL key`) |
| **Hot key** | Một key quá tải | Local cache L1, replicate read |
| **穿透** | Key không tồn tại, miss mãi | Cache null với TTL ngắn |
| **雪崩** | Nhiều key expire cùng lúc | Random TTL jitter |

---

## Triển khai

- Redis **cluster** hoặc sentinel cho HA.
- TTL mọi key — tránh leak memory.
- Serialise: JSON hoặc MessagePack; version trong key `user:123:v2`.
- Monitor: hit rate, memory, latency, evicted keys.

---

## Câu trả lời ngắn (phỏng vấn)

Cache-aside + TTL + invalidate on write. Redis in-memory, eviction LRU/LFU. Chống stampede bằng singleflight/jitter. Phân tầng: local → Redis → DB. Không cache mọi thứ — chỉ read-heavy, chấp nhận eventual stale.

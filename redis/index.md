# Redis Cache — Chiến lược, khái niệm và triển khai

## 1. Cache là gì? Dùng để làm gì?

**Cache** là lớp lưu trữ tạm thời chứa **bản sao dữ liệu thường xuyên được đọc**, đặt gần ứng dụng hơn nguồn dữ liệu gốc (DB, API bên thứ ba) để **giảm độ trễ** và **giảm tải** cho hệ thống phía sau.

**Redis** phù hợp làm cache vì:

- Lưu trữ **in-memory** — truy cập cực nhanh (microseconds).
- Hỗ trợ nhiều kiểu dữ liệu: **String**, **Hash**, **List**, **Set**, **Sorted Set**.
- Có **TTL** (Time To Live) tự hết hạn.
- Có chính sách **eviction** khi đầy bộ nhớ.
- Hỗ trợ **cluster**, **replication** cho production.

**Dùng cache khi:**

| Mục tiêu | Ví dụ |
|----------|-------|
| Giảm latency | Trang chủ, danh mục sản phẩm, profile user |
| Giảm tải DB | Query nặng, aggregation, báo cáo |
| Giảm chi phí API | Gọi API bên thứ ba có rate limit / tính phí |
| Tăng throughput | Hệ thống đọc nhiều, ghi ít (read-heavy) |

**Không nên cache khi:**

- Dữ liệu **thay đổi liên tục** và cần **strong consistency** tuyệt đối.
- Dữ liệu **nhạy cảm** mà không có cơ chế mã hóa / phân quyền phù hợp.
- Dataset **quá lớn** so với RAM — chi phí và hit rate không đáng.

---

## 2. Khái niệm cơ bản

### 2.1 Cache Hit / Cache Miss

```
Request → Kiểm tra cache
              ├── Có dữ liệu (HIT)  → trả về ngay từ cache
              └── Không có (MISS)   → đọc DB/API → ghi cache → trả về
```

- **Cache Hit**: dữ liệu có sẵn trong cache → nhanh, không chạm DB.
- **Cache Miss**: không có trong cache → phải lấy từ nguồn gốc, thường chậm hơn.

**Hit Rate** = `số hit / tổng request` — chỉ số quan trọng để đánh giá hiệu quả cache.

### 2.2 TTL (Time To Live)

Thời gian cache **tự hết hạn**. Sau TTL, key bị xóa hoặc coi như miss.

```bash
SET user:1001 '{"name":"Alice"}' EX 3600   # hết hạn sau 3600 giây
SET product:42 '...' PX 300000             # hết hạn sau 300000 ms
```

**Chọn TTL:**

- Dữ liệu ít đổi (cấu hình, danh mục): TTL dài (vài giờ – vài ngày).
- Dữ liệu đổi vừa (giá, tồn kho): TTL ngắn (vài phút – vài chục giây).
- Dữ liệu real-time (số dư ví): **không cache** hoặc TTL rất ngắn + invalidation chủ động.

### 2.3 Cache Invalidation

Làm sao để cache **không trả dữ liệu cũ** khi dữ liệu gốc đã thay đổi?

| Cách | Mô tả |
|------|-------|
| **TTL-based** | Để cache tự hết hạn — đơn giản, chấp nhận dữ liệu stale trong khoảng TTL |
| **Event-based** | Khi DB cập nhật → publish event → xóa/cập nhật cache |
| **Write-through** | Mỗi lần ghi DB đồng thời ghi cache |
| **Versioned key** | Dùng key có version: `product:42:v3` — đổi version khi cập nhật |

> *"There are only two hard things in Computer Science: cache invalidation and naming things."* — Phil Karlton

### 2.4 Eviction Policy (khi Redis đầy RAM)

Redis dùng `maxmemory` + `maxmemory-policy` để quyết định xóa key nào:

| Policy | Hành vi |
|--------|---------|
| `allkeys-lru` | Xóa key ít dùng nhất (phổ biến cho cache thuần) |
| `allkeys-lfu` | Xóa key ít được truy cập (frequency) |
| `volatile-lru` | Chỉ xóa key **có TTL**, theo LRU |
| `volatile-ttl` | Xóa key có TTL **sắp hết hạn** trước |
| `noeviction` | Không xóa — trả lỗi khi đầy (cẩn thận với production) |

**Gợi ý:** cache thuần → `allkeys-lru` hoặc `allkeys-lfu`.

### 2.5 Cache Stampede (Thundering Herd)

Khi key hết hạn, **hàng loạt request cùng lúc** đều miss → cùng query DB → DB quá tải.

**Giải pháp:**

- **Lock / Single-flight**: chỉ 1 request rebuild cache, các request khác chờ hoặc trả stale.
- **Probabilistic early expiration**: làm mới cache **trước** khi hết TTL (xác suất tăng dần).
- **Stale-while-revalidate**: trả dữ liệu cũ ngay, refresh cache ở background.

---

## 3. Các chiến lược cache

### 3.1 Cache-Aside (Lazy Loading) — Phổ biến nhất

Ứng dụng **tự quản lý** cache: đọc cache trước, miss thì đọc DB rồi ghi cache.

```
READ:
  App → GET cache
        ├── HIT  → return
        └── MISS → GET DB → SET cache → return

WRITE:
  App → UPDATE DB → DELETE cache (hoặc UPDATE cache)
```

**Dùng khi:**

- Hệ thống **read-heavy** (tỷ lệ đọc >> ghi).
- Team muốn **kiểm soát logic cache** trong application layer.
- Dữ liệu không cần đồng bộ tức thì giữa cache và DB.

**Ưu điểm:** linh hoạt, chỉ cache dữ liệu thực sự được đọc.

**Nhược điểm:** miss đầu tiên chậm; dễ inconsistent nếu quên invalidate khi write.

**Triển khai (Node.js + ioredis):**

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(userId);
  if (!user) return null;

  await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
  return user;
}

async function updateUser(userId, data) {
  await db.users.update(userId, data);
  await redis.del(`user:${userId}`); // invalidate
}
```

---

### 3.2 Read-Through

Cache layer **tự động** load từ DB khi miss — application chỉ gọi cache, không biết DB.

```
READ:
  App → GET cache
        ├── HIT  → return
        └── MISS → Cache tự GET DB → SET cache → return
```

**Dùng khi:**

- Muốn **tách biệt** logic cache khỏi business code.
- Dùng thư viện / middleware hỗ trợ read-through (một số ORM cache plugin).

**Ưu điểm:** code application gọn; logic load tập trung.

**Nhược điểm:** cần lớp cache trung gian; Redis thuần **không có** read-through built-in — phải tự implement ở app hoặc dùng proxy.

**Triển khai (wrapper pattern):**

```javascript
class ReadThroughCache {
  constructor(redis, loader, ttl = 3600) {
    this.redis = redis;
    this.loader = loader; // (key) => Promise<data>
    this.ttl = ttl;
  }

  async get(key) {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await this.loader(key);
    if (data) {
      await this.redis.set(key, JSON.stringify(data), 'EX', this.ttl);
    }
    return data;
  }
}

// Dùng
const userCache = new ReadThroughCache(redis, (key) => {
  const id = key.split(':')[1];
  return db.users.findById(id);
});
const user = await userCache.get('user:1001');
```

---

### 3.3 Write-Through

Mỗi lần ghi, **đồng thời** cập nhật DB **và** cache — cache luôn có dữ liệu mới sau write.

```
WRITE:
  App → UPDATE cache → UPDATE DB (hoặc ngược lại, nhưng cả hai phải thành công)
```

**Dùng khi:**

- Cần cache **luôn fresh** sau mỗi lần ghi.
- Read latency quan trọng ngay sau write (ví dụ: session, cart).

**Ưu điểm:** read sau write luôn hit cache với dữ liệu mới.

**Nhược điểm:** write chậm hơn (2 thao tác); cache chứa cả dữ liệu ít khi đọc → lãng RAM.

**Triển khai:**

```javascript
async function saveUser(user) {
  const cacheKey = `user:${user.id}`;
  await Promise.all([
    db.users.upsert(user),
    redis.set(cacheKey, JSON.stringify(user), 'EX', 3600),
  ]);
}
```

---

### 3.4 Write-Behind (Write-Back)

Ghi vào cache **ngay**, ghi DB **bất đồng bộ** sau (batch / queue).

```
WRITE:
  App → UPDATE cache → return ngay
        └── (async) UPDATE DB sau
```

**Dùng khi:**

- Cần **write cực nhanh** (analytics, click tracking, view count).
- Chấp nhận **mất dữ liệu** nếu cache crash trước khi flush DB.

**Ưu điểm:** latency write thấp; có thể batch ghi DB.

**Nhược điểm:** rủi ro mất dữ liệu; phức tạp khi xử lý lỗi và ordering.

**Triển khai (đơn giản với queue):**

```javascript
async function incrementViewCount(postId) {
  const key = `post:${postId}:views`;
  await redis.incr(key);

  // Đẩy job flush DB (Bull, Redis Stream, v.v.)
  await viewQueue.add({ postId, action: 'flush' });
}

// Worker định kỳ hoặc theo batch
async function flushViews() {
  const keys = await redis.keys('post:*:views'); // production: dùng SCAN
  for (const key of keys) {
    const count = await redis.getset(key, 0);
    const postId = key.split(':')[1];
    await db.posts.incrementViews(postId, Number(count));
  }
}
```

---

### 3.5 Refresh-Ahead

Cache **chủ động làm mới** trước khi hết TTL — user ít khi gặp miss.

```
Background job:
  Key sắp hết TTL → preload từ DB → SET cache mới
```

**Dùng khi:**

- Dữ liệu **hot** (truy cập liên tục), miss gây spike DB.
- Query DB tốn kém, chấp nhận dữ liệu hơi stale trong thời gian refresh.

**Triển khai:**

```javascript
async function refreshIfNeeded(key, loader, ttl, threshold = 0.8) {
  const remaining = await redis.ttl(key);
  if (remaining > 0 && remaining < ttl * (1 - threshold)) {
    const data = await loader(key);
    if (data) await redis.set(key, JSON.stringify(data), 'EX', ttl);
  }
}

async function getProduct(id) {
  const key = `product:${id}`;
  const cached = await redis.get(key);
  if (cached) {
    refreshIfNeeded(key, () => db.products.findById(id), 3600); // không await
    return JSON.parse(cached);
  }
  const product = await db.products.findById(id);
  await redis.set(key, JSON.stringify(product), 'EX', 3600);
  return product;
}
```

---

### 3.6 So sánh nhanh các chiến lược

| Chiến lược | Ai quản lý cache? | Read | Write | Consistency | Độ phổ biến |
|------------|-------------------|------|-------|-------------|-------------|
| **Cache-Aside** | Application | Miss → load DB | Ghi DB → xóa cache | Eventual | ⭐⭐⭐⭐⭐ |
| **Read-Through** | Cache layer | Miss → cache load DB | — | Eventual | ⭐⭐⭐ |
| **Write-Through** | Cache layer | Luôn từ cache | Ghi cả cache + DB | Tốt hơn | ⭐⭐⭐ |
| **Write-Behind** | Cache layer | Từ cache | Ghi cache trước, DB sau | Yếu | ⭐⭐ (niche) |
| **Refresh-Ahead** | Background | Proactive refresh | — | Eventual | ⭐⭐ (bổ sung) |

---

## 4. Cách tổ chức key và dữ liệu trên Redis

### 4.1 Đặt tên key

```
{entity}:{id}                    → user:1001
{entity}:{id}:{field}            → user:1001:profile
{app}:{entity}:{id}              → myapp:product:42
{entity}:list:{filter}:{page}    → product:list:category-5:page-1
```

- Dùng **dấu `:`** phân cấp — hỗ trợ pattern `user:*` khi cần.
- Tránh key quá dài; hash filter phức tạp nếu cần: `product:list:abc123hash`.

### 4.2 Chọn kiểu dữ liệu

| Kiểu | Khi dùng |
|------|----------|
| **String** | JSON serialize object đơn — đơn giản, phổ biến nhất |
| **Hash** | Object nhiều field, cập nhật từng field: `HSET user:1001 name "Alice"` |
| **Set** | Danh sách ID không trùng: `SADD user:1001:tags "vip"` |
| **Sorted Set** | Leaderboard, ranking theo điểm |

**Ví dụ Hash cho user:**

```bash
HSET user:1001 name "Alice" email "alice@example.com" age 30
EXPIRE user:1001 3600
HGETALL user:1001
```

### 4.3 Serialization

- **JSON**: dễ debug, tương thích mọi ngôn ngữ — phổ biến nhất.
- **MessagePack / Protobuf**: nhỏ hơn, nhanh hơn — khi payload lớn hoặc throughput cao.

---

## 5. Triển khai production

### 5.1 Kiến trúc thường gặp

```
                    ┌─────────────┐
  Client ──────────►│   App/API   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Redis   │  │ Postgres │  │  Queue   │
        │  (cache) │  │   (DB)   │  │ (async)  │
        └──────────┘  └──────────┘  └──────────┘
```

- **Redis standalone**: dev / traffic nhỏ.
- **Redis Sentinel**: HA — auto failover khi master chết.
- **Redis Cluster**: sharding — dataset lớn hoặc throughput rất cao.

### 5.2 Cấu hình gợi ý

```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

- Bật **persistent** (RDB/AOF) nếu cache chứa dữ liệu khó rebuild; cache thuần có thể **không cần** persistence.
- Monitor: **hit rate**, **memory usage**, **evicted keys**, **latency**.

### 5.3 Pattern chống Cache Stampede — Distributed Lock

```javascript
async function getWithLock(key, loader, ttl = 3600) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 10);

  if (!acquired) {
    await sleep(50);
    return getWithLock(key, loader, ttl); // retry
  }

  try {
    const cachedAgain = await redis.get(key);
    if (cachedAgain) return JSON.parse(cachedAgain);

    const data = await loader();
    if (data) await redis.set(key, JSON.stringify(data), 'EX', ttl);
    return data;
  } finally {
    await redis.del(lockKey);
  }
}
```

### 5.4 Cache warming

Khi deploy hoặc restart Redis, cache trống → spike miss.

**Cách xử lý:**

- Script **preload** dữ liệu hot trước khi mở traffic.
- **Stale-while-revalidate** trong CDN/app layer.
- Giữ Redis **không restart** thường xuyên; dùng rolling update.

---

## 6. Chọn chiến lược theo use case

| Use case | Chiến lược gợi ý | Ghi chú |
|----------|------------------|---------|
| API đọc user/product | **Cache-Aside** + TTL | Invalidate khi update |
| Session / cart | **Write-Through** | Cần fresh ngay sau write |
| View count, analytics | **Write-Behind** + counter | `INCR`, flush batch |
| Config / danh mục tĩnh | **Cache-Aside** + TTL dài | Ít khi invalidate |
| Báo cáo / aggregation nặng | **Cache-Aside** + TTL ngắn | Hoặc precompute + cache |
| Feed / homepage hot | **Refresh-Ahead** + Cache-Aside | Tránh stampede |
| Leaderboard | **Sorted Set** trực tiếp | Redis là source of truth tạm |

---

## 7. Lỗi thường gặp và cách tránh

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| Dữ liệu cũ (stale) | Không invalidate khi write | Xóa/update cache trong transaction write |
| DB spike khi deploy | Cache cold start | Cache warming, lock, stale-while-revalidate |
| Redis OOM | Không set `maxmemory` | Set limit + eviction policy |
| Key explosion | Cache mọi query với param khác nhau | Giới hạn cache theo pattern hot; hash query key |
| Thundering herd | TTL đồng loạt hết hạn | Jitter TTL: `TTL + random(0, 300)` |
| Mất dữ liệu write-behind | Crash trước flush | Chỉ dùng cho dữ liệu không critical; durable queue |

**Jitter TTL ví dụ:**

```javascript
const baseTtl = 3600;
const jitter = Math.floor(Math.random() * 300);
await redis.set(key, data, 'EX', baseTtl + jitter);
```

---

## 8. Tóm tắt

1. **Cache** giảm latency và tải DB bằng cách lưu bản sao dữ liệu hot gần app.
2. **Redis** là lựa chọn phổ biến nhờ tốc độ in-memory, TTL, và eviction linh hoạt.
3. **Cache-Aside** là điểm bắt đầu tốt cho hầu hết API read-heavy.
4. **Write-Through / Write-Behind** dùng khi pattern ghi có yêu cầu riêng về latency và consistency.
5. Luôn có kế hoạch cho **invalidation**, **stampede**, và **monitoring hit rate**.

> Thực tế: bắt đầu với **Cache-Aside + TTL + invalidate on write**. Khi traffic tăng, bổ sung **lock**, **refresh-ahead**, hoặc **write-behind** cho từng use case cụ thể.

---

## 9. Redis — chủ đề khác (không phải cache)

| File | Nội dung |
|------|----------|
| [redis-stream.md](./redis-stream.md) | Stream — append-only log, consumer group, ack, ứng dụng |
| [pub-sub.md](./pub-sub.md) | Pub/Sub — broadcast realtime |

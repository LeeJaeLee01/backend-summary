# Database Problems

## 1. N+1 Query Problem

**N+1** là khi app thực hiện **1 query lấy danh sách** (N bản ghi), rồi **thêm N query** để lấy dữ liệu liên quan — tổng **N + 1 query** thay vì 1–2 query.

```typescript
// ❌ N+1: 1 query users + N query posts cho mỗi user
const users = await userRepo.find(); // 1 query → 100 users

for (const user of users) {
  user.posts = await postRepo.find({ where: { userId: user.id } }); // 100 query nữa
}
// Tổng: 101 query
```

### Nguyên nhân dẫn đến N+1

| Nguyên nhân | Mô tả |
|-------------|--------|
| **Lazy loading** | ORM chỉ load relation khi truy cập property — mỗi lần truy cập = 1 query mới |
| **Loop + query trong loop** | Fetch parent list rồi query child theo từng item trong vòng lặp |
| **Thiếu eager load / join** | Không báo ORM load relation ngay từ đầu |
| **API trả nested data** | Serialize object có relation mà không preload |
| **ORM mặc định** | TypeORM relation mặc định `lazy` nếu không cấu hình `eager` hoặc `relations` |

### Cách xử lý

**1. Eager loading — load relation cùng lúc**

```typescript
// TypeORM
const users = await userRepo.find({ relations: ['posts'] }); // 1 query JOIN hoặc 2 query có kiểm soát

// Prisma
const users = await prisma.user.findMany({
  include: { posts: true },
});
```

**2. JOIN / QueryBuilder**

```typescript
// TypeORM QueryBuilder
const users = await userRepo
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .getMany();
```

**3. DataLoader (batching)** — gom nhiều request thành 1 query

```typescript
// Thay vì query từng userId, gom lại:
const posts = await postRepo.find({ where: { userId: In(userIds) } }); // 1 query
// Rồi map posts vào từng user trong memory
```

**4. Raw SQL với JOIN** — khi ORM sinh query kém tối ưu

```sql
SELECT u.*, p.*
FROM users u
LEFT JOIN posts p ON p.user_id = u.id;
```

### Cách tránh N+1

| Cách | Mô tả |
|------|--------|
| **Luôn chỉ định relation cần lấy** | `relations` / `include` — không rely lazy load |
| **Tắt lazy loading** | Tránh `@ManyToOne(() => Post, { lazy: true })` trừ khi thật sự cần |
| **Dùng DataLoader** | GraphQL hoặc API nested — batch query theo key |
| **Select đúng field** | `select` / `QueryBuilder` — chỉ lấy column cần thiết |
| **Monitor query** | Bật query log, dùng tool (Prisma logging, TypeORM logging, Datadog) |
| **Pagination** | Giới hạn N — 1000 user × N+1 còn tệ hơn 10 user × N+1 |
| **Thiết kế API phẳng** | Trả `users` + `posts` riêng, client tự map — tránh serialize lazy relation |

**TypeORM — cấu hình eager (cẩn thận):**

```typescript
@OneToMany(() => Post, post => post.user, { eager: true }) // luôn load posts
posts: Post[];
// ⚠️ Dễ over-fetch — chỉ dùng khi luôn cần relation
```

**Prisma — tránh query trong loop:**

```typescript
// ✅ Tốt
const users = await prisma.user.findMany({ include: { posts: true } });

// ❌ N+1
const users = await prisma.user.findMany();
for (const u of users) {
  u.posts = await prisma.post.findMany({ where: { userId: u.id } });
}
```

### Nhận biết N+1 khi phỏng vấn

- Log thấy **cùng một query lặp lại N lần** chỉ khác `WHERE id = ?`
- Response chậm khi list lớn dù query đơn giản
- Số query tăng tuyến tính theo số bản ghi trả về

> **N+1** = 1 query list + N query relation. **Fix** bằng **JOIN / eager load / include / DataLoader**. **Tránh** bằng không query trong loop và luôn preload relation cần thiết.

---

## 2. Full Table Scan

**Là gì:** DB đọc **toàn bộ bảng** thay vì dùng index — chậm khi data lớn.

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| **Không có index** trên cột `WHERE`, `JOIN`, `ORDER BY` | Tạo index cho cột thường filter/sort/join |
| Query dùng **function trên cột** — `WHERE YEAR(created_at) = 2024` | Viết lại query để index được dùng — `WHERE created_at >= '2024-01-01'` |
| **Type mismatch** — so sánh string với int | Đảm bảo kiểu dữ liệu khớp, tránh implicit cast |
| Bảng **quá nhỏ** — optimizer chọn full scan (chấp nhận được) | Chỉ tối ưu khi bảng đủ lớn — dùng `EXPLAIN` kiểm tra |

```sql
-- Kiểm tra query plan
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Tạo index
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

---

## 3. Index Sai

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| Index cột **selectivity thấp** — `gender`, `status` boolean | Index cột phân biệt cao (`email`, `user_id`); dùng **composite index** kết hợp cột selectivity thấp |
| **Composite index sai thứ tự** — query filter `status` rồi `created_at` nhưng index `(created_at, status)` | Đặt cột **equality (`=`)** trước, **range (`>`, `<`, `BETWEEN`)** sau — **leftmost prefix rule** |
| Quá nhiều index | Mỗi index làm **INSERT/UPDATE chậm hơn** — chỉ index query thực sự dùng |
| Index không được dùng do `SELECT *` + covering index thiếu cột | Thêm cột cần vào index hoặc dùng **covering index** |

```sql
-- Query: WHERE status = 'active' AND created_at > '2024-01-01'
-- ✅ Index đúng thứ tự
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

-- ❌ Sai — range cột đầu khiến index kém hiệu quả
CREATE INDEX idx_orders_created_status ON orders(created_at, status);
```

---

## 4. SELECT *

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| Lấy **tất cả cột** dù chỉ cần vài field | Chỉ `SELECT` cột cần thiết |
| Tốn **I/O, memory, network** — đặc biệt cột `TEXT`, `JSON`, `BLOB` | Dùng `select` trong ORM — Prisma `select`, TypeORM `QueryBuilder.select()` |
| Không tận dụng **covering index** | Select đúng cột trong index → index-only scan |

```typescript
// ❌
const users = await prisma.user.findMany();

// ✅
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true },
});
```

---

## 5. OFFSET Lớn

**Là gì:** `LIMIT 10 OFFSET 1000000` — DB phải **đọc và bỏ qua 1 triệu row** rồi mới lấy 10 row.

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| **Offset-based pagination** với page sâu | Chuyển sang **cursor-based pagination** (xem mục 8) |
| Không có index hỗ trợ `ORDER BY` | Index trên cột sort kết hợp filter |
| Sort trên cột không index | Thêm index hoặc pre-compute/denormalize |

```sql
-- ❌ Chậm khi offset lớn
SELECT * FROM posts ORDER BY id LIMIT 10 OFFSET 1000000;

-- ✅ Cursor-based — nhanh, ổn định
SELECT * FROM posts WHERE id > 1000000 ORDER BY id LIMIT 10;
```

---

## 6. Join Quá Nhiều Bảng

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| **Report phức tạp** join 5–10+ bảng trong một query | Tách query, dùng **materialized view** hoặc **bảng tổng hợp** (summary table) |
| Join không có index trên **foreign key** | Index tất cả cột join |
| Cartesian product do **thiếu điều kiện JOIN** | Kiểm tra `ON` clause, tránh join thừa |
| Real-time report trên OLTP DB | Tách sang **read replica** hoặc **data warehouse** (ETL) |
| ORM tự sinh join không cần thiết | Review query plan, viết raw SQL / QueryBuilder tối ưu |

```sql
-- Thay vì join 8 bảng mỗi lần request
-- Pre-aggregate hàng ngày
CREATE MATERIALIZED VIEW daily_sales AS
SELECT date, product_id, SUM(amount) AS total
FROM orders GROUP BY date, product_id;
```

---

## 7. Subquery Lồng Nhau

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| **Optimizer không tối ưu** subquery lồng sâu | Viết lại bằng **JOIN** hoặc **CTE (`WITH`)** |
| Correlated subquery — subquery chạy **mỗi row** của outer query | Đổi sang JOIN hoặc window function |
| `IN (SELECT ...)` trên bảng lớn không index | Dùng `EXISTS` hoặc JOIN có index |
| Subquery trong `SELECT` list | Chuyển sang JOIN + aggregate |

```sql
-- ❌ Correlated subquery — chạy N lần
SELECT u.name, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id)
FROM users u;

-- ✅ JOIN + GROUP BY
SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name;
```

---

## 8. Pagination

### Offset-based (page = 1000) — chậm khi data lớn

| Nguyên nhân | Giải pháp |
|-------------|-----------|
| `OFFSET` lớn → scan + skip nhiều row | Dùng **cursor-based** thay offset |
| User nhảy page ngẫu nhiên (page 1 → 500) | Offset chấp nhận được cho **page đầu**; page sâu dùng cursor hoặc search/filter |
| `COUNT(*)` mỗi request để tính total page | Cache total count; hoặc bỏ total page, chỉ có `hasNext` |

```sql
-- Offset-based — OK cho page nhỏ
SELECT * FROM posts ORDER BY created_at DESC LIMIT 10 OFFSET 20;
```

### Cursor-based — ổn định hơn với dataset lớn

| Nguyên nhân dùng cursor | Giải pháp |
|-------------------------|-----------|
| Offset scan bỏ qua hàng triệu row | `WHERE id > :lastId ORDER BY id LIMIT 10` |
| Data thay đổi giữa các page (duplicate/miss) | Cursor dựa trên **unique, immutable key** (`id`, `created_at + id`) |
| Sort phức tạp | Composite cursor — `(created_at, id)` |

```sql
-- Cursor-based
SELECT * FROM posts
WHERE (created_at, id) < ('2024-06-01', 12345)
ORDER BY created_at DESC, id DESC
LIMIT 10;
```

```typescript
// API response
{
  data: [...],
  nextCursor: 'eyJjcmVhdGVkQXQiIjo...'  // encode last item key
  hasNext: true
}
```

**Khi nào dùng gì:**

| Loại | Phù hợp |
|------|---------|
| **Offset** | Admin panel, page ít, cần nhảy page tùy ý |
| **Cursor** | Feed vô hạn, timeline, data lớn, mobile app |

> Tóm tắt tối ưu query: **có index đúng**, **select đúng cột**, **tránh offset sâu**, **giảm join/subquery**, dùng **EXPLAIN ANALYZE** để kiểm tra trước khi deploy.

---

## 9. Deadlock

**Deadlock** — hai hoặc nhiều transaction **chờ nhau giải phóng lock** vĩnh viễn, không ai tiếp tục được.

```
Transaction A:  LOCK row 1  →  chờ row 2
Transaction B:  LOCK row 2  →  chờ row 1
                ↓
            DEADLOCK — cả hai bị kẹt
```

### Nguyên nhân

| Nguyên nhân | Mô tả |
|-------------|--------|
| **Lock order khác nhau** | Tx A lock bảng X rồi Y; Tx B lock Y rồi X |
| **Transaction quá dài** | Giữ lock lâu — tăng xác suất xung đột |
| **UPDATE/DELETE nhiều row** | Lock nhiều row không theo thứ tự cố định |
| **Thiếu index** | Full scan lock nhiều row hơn cần thiết |
| **Isolation level cao** | `SERIALIZABLE` dễ xung đột hơn `READ COMMITTED` |
| **Gap lock / next-key lock** | MySQL InnoDB — lock khoảng trống giữa index |

### DB xử lý thế nào?

Hầu hết DB (Postgres, MySQL) có **deadlock detector** — phát hiện cycle và **rollback một transaction** (victim), transaction còn lại tiếp tục.

```sql
-- PostgreSQL — xem deadlock gần nhất
SELECT * FROM pg_stat_database_conflicts;

-- MySQL — bật log
SHOW ENGINE INNODB STATUS;  -- mục LATEST DETECTED DEADLOCK
```

App nhận lỗi: `deadlock detected` (Postgres) hoặc `1213 Deadlock found` (MySQL).

### Cách xử lý

**1. Retry transaction** — cách phổ biến nhất

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (isDeadlockError(err) && i < maxRetries - 1) {
        await sleep(100 * (i + 1)); // exponential backoff
        continue;
      }
      throw err;
    }
  }
  throw new Error('unreachable');
}
```

**2. Giữ transaction ngắn** — lock ít thời gian nhất có thể

```typescript
// ❌ Giữ transaction trong khi gọi API bên ngoài
await queryRunner.startTransaction();
await callExternalAPI();  // chậm → giữ lock lâu
await repo.update(...);
await queryRunner.commitTransaction();

// ✅ Chỉ transaction cho DB operation
const data = await callExternalAPI();
await queryRunner.startTransaction();
await repo.update(...);
await queryRunner.commitTransaction();
```

**3. Lock theo thứ tự cố định** — tất cả transaction lock row theo cùng thứ tự (vd: sort by `id` ASC)

```typescript
// Luôn update account theo id tăng dần
const ids = [accountB, accountA].sort((a, b) => a - b);
for (const id of ids) {
  await repo.update(id, ...);
}
```

**4. Dùng isolation level phù hợp** — không dùng `SERIALIZABLE` nếu không cần

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

**5. Giảm phạm vi lock**

- Update đúng row cần thiết — có **index** trên cột WHERE
- Tránh `SELECT ... FOR UPDATE` trên range lớn
- Chia batch nhỏ thay vì lock cả bảng

**6. Optimistic locking** — thay row lock bằng version check

```sql
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 5;
-- Nếu 0 row affected → conflict, retry
```

### Cách phòng tránh

| Cách | Mô tả |
|------|--------|
| **Thứ tự lock nhất quán** | Mọi tx lock resource theo cùng thứ tự |
| **Transaction ngắn** | Không gọi HTTP, sleep, heavy compute trong tx |
| **Index đúng** | Giảm row bị lock không cần thiết |
| **Retry + backoff** | Xử lý deadlock như lỗi tạm thời |
| **Optimistic lock** | Phù hợp contention thấp — `version` column |
| **Queue / serial processing** | Gom update cùng resource vào một worker |
| **Monitoring** | Log deadlock, alert nếu tần suất cao |

### Deadlock vs Lock wait timeout

| | **Deadlock** | **Lock wait timeout** |
|---|--------------|----------------------|
| **Nguyên nhân** | Vòng chờ tròn — cycle | Chờ lock quá lâu |
| **DB xử lý** | Rollback **một** victim ngay | Chờ đến timeout rồi fail |
| **Giải pháp** | Retry, fix lock order | Rút ngắn tx, giảm contention |

> **Deadlock** = transaction chờ nhau vòng tròn. **Fix**: transaction **ngắn**, lock **cùng thứ tự**, **retry** khi DB rollback victim, cân nhắc **optimistic locking** khi phù hợp.

---

## 10. Race Condition — 2 user cùng update 1 bản ghi (field khác nhau)

**Bài toán:** User A sửa `name`, User B sửa `detail` trên **cùng 1 row** — làm sao không mất dữ liệu?

```sql
-- Bảng ví dụ
CREATE TABLE profiles (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100),
  detail     TEXT,
  version    INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Vấn đề thực sự nằm ở đâu?

| Pattern | User A sửa name | User B sửa detail | Kết quả |
|---------|-----------------|-------------------|---------|
| **Update đúng cột** (PATCH) | `SET name = ...` | `SET detail = ...` | ✅ Cả hai giữ được — **thường không conflict** |
| **Read → sửa → ghi cả row** (PUT) | Đọc row → đổi name → `save()` toàn bộ | Đọc row → đổi detail → `save()` toàn bộ | ❌ **Lost update** — người commit sau ghi đè người trước |

```
T0:  row = { name: "John", detail: "old bio" }

User A (PUT pattern):
  T1: đọc  { name: "John",  detail: "old bio" }
  T2: sửa  { name: "Alice", detail: "old bio" }

User B (PUT pattern):
  T3: đọc  { name: "John",  detail: "old bio" }
  T4: sửa  { name: "John",  detail: "new bio" }

User B commit trước → { name: "John", detail: "new bio" }
User A commit sau   → { name: "Alice", detail: "old bio" }  ← mất detail của B!
```

> **Quan trọng:** Nếu mỗi user chỉ `UPDATE` **đúng cột mình sửa**, DB merge ở mức row — **2 update khác cột thường OK**. Lỗi xảy ra khi app **ghi đè cả object/row**.

---

### Giải pháp 1: Partial update (PATCH) — ưu tiên cho case này

Chỉ update field được gửi lên — **không đọc–ghi cả row**.

```typescript
// PATCH /profiles/1  body: { name: "Alice" }
await profileRepo.update(id, { name: dto.name }); // chỉ SET name

// PATCH /profiles/1  body: { detail: "new bio" }
await profileRepo.update(id, { detail: dto.detail }); // chỉ SET detail
```

```sql
-- User A
UPDATE profiles SET name = 'Alice', updated_at = now() WHERE id = 1;

-- User B (chạy song song)
UPDATE profiles SET detail = 'new bio', updated_at = now() WHERE id = 1;

-- Kết quả: { name: 'Alice', detail: 'new bio' } ✅
```

**TypeORM — tránh `save()` whole entity khi chỉ sửa 1 field:**

```typescript
// ❌ save() có thể ghi đè field không đổi
const profile = await repo.findOne({ where: { id } });
profile.name = dto.name;
await repo.save(profile); // ghi cả row — có thể đè detail cũ

// ✅ update() chỉ cột cần thiết
await repo.update(id, { name: dto.name });
```

| Ưu | Nhược |
|----|-------|
| Đơn giản, không cần lock | Không phát hiện conflict logic (vd: 2 người sửa cùng `name`) |
| Hiệu năng tốt | Validation phức tạp cross-field khó hơn |
| **Phù hợp nhất** khi sửa field khác nhau | Không đủ nếu cần audit "ai thắng" |

---

### Giải pháp 2: Optimistic locking (`version`)

Dùng khi cần **phát hiện conflict** — kể cả sửa field khác nhau, hoặc khi không tin tưởng PATCH hoàn toàn.

```typescript
@Entity()
class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  detail: string;

  @VersionColumn()
  version: number;
}
```

```typescript
// PATCH với version check
const result = await profileRepo.update(
  { id, version: dto.version },
  { name: dto.name, version: () => 'version + 1' },
);

if (result.affected === 0) {
  throw new ConflictException('Dữ liệu đã thay đổi — vui lòng tải lại');
}
```

```sql
UPDATE profiles
SET name = 'Alice', version = version + 1
WHERE id = 1 AND version = 3;
-- affected = 0 → có người commit trước → báo conflict cho client
```

**Flow client:**

```
1. GET /profiles/1  → { name, detail, version: 3 }
2. User sửa name
3. PATCH { name: "Alice", version: 3 }
4. Nếu 409 Conflict → GET lại → merge thủ công → retry
```

| Ưu | Nhược |
|----|-------|
| Phát hiện mọi concurrent write | Client phải xử lý retry / merge |
| Không block reader | UX kém nếu conflict liên tục |
| Kết hợp tốt với PATCH từng field | Thêm cột `version` |

---

### Giải pháp 3: Pessimistic lock — khi cần serialize

Lock row khi đọc — user thứ hai **chờ** đến khi user đầu xong.

```typescript
await dataSource.transaction(async (manager) => {
  const profile = await manager
    .createQueryBuilder(Profile, 'p')
    .setLock('pessimistic_write')
    .where('p.id = :id', { id })
    .getOne();

  profile.name = dto.name;
  await manager.save(profile);
});
```

```sql
BEGIN;
SELECT * FROM profiles WHERE id = 1 FOR UPDATE;  -- B chờ ở đây
UPDATE profiles SET name = 'Alice' WHERE id = 1;
COMMIT;
```

| Ưu | Nhược |
|----|-------|
| Chắc chắn, không lost update | User B **chờ** — latency tăng |
| Logic app đơn giản (read-modify-write OK) | Contention cao → chậm; dễ deadlock nếu lock nhiều row |

> Chỉ dùng khi **contention cao trên cùng row** hoặc logic sửa phức tạp bắt buộc read-modify-write. Với A sửa name / B sửa detail — **thường thừa**.

---

### Giải pháp 4: Merge phía server (auto-resolve)

Khi conflict, server **tự gộp** thay vì báo lỗi — phù hợp field độc lập.

```typescript
async function patchProfile(id: number, patch: Partial<Profile>) {
  // Luôn PATCH từng field — DB tự merge
  await profileRepo.update(id, {
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.detail !== undefined && { detail: patch.detail }),
    updated_at: new Date(),
  });
}
```

Nếu dùng PUT (thay cả resource), merge có chủ đích:

```typescript
async function mergeProfile(id: number, incoming: Partial<Profile>, baseVersion: number) {
  const current = await profileRepo.findOne({ where: { id } });
  if (current.version !== baseVersion) {
    // Auto-merge: giữ field người kia đã sửa, chỉ ghi field mình gửi
    return profileRepo.update(id, {
      name: incoming.name ?? current.name,
      detail: incoming.detail ?? current.detail,
      version: current.version + 1,
    });
  }
  return profileRepo.update(id, { ...incoming, version: baseVersion + 1 });
}
```

| Ưu | Nhược |
|----|-------|
| UX tốt — ít báo lỗi | Khó khi 2 người sửa **cùng 1 field** |
| Hợp field độc lập (name vs detail) | Logic merge phức tạp với nested object |

---

### Giải pháp 5: Field-level locking / Last-write-wins có chọn lọc

**Cùng field (cả 2 sửa `name`):** cần thêm chiến lược:

| Chiến lược | Mô tả |
|------------|--------|
| **Last write wins** | Ai commit sau thắng — đơn giản, có thể mất ý định user trước |
| **First write wins** | Từ chối update nếu `updated_at` / `version` đã đổi |
| **Operational transform / CRDT** | Phức tạp — dùng cho collaborative editing (Google Docs) |

Với **field khác nhau** — PATCH đủ. Với **cùng field** — dùng **optimistic lock** hoặc hiển thị conflict cho user.

---

### So sánh — chọn giải pháp nào?

| Tình huống | Giải pháp khuyến nghị |
|------------|----------------------|
| A sửa `name`, B sửa `detail` (field khác) | **PATCH từng cột** — đủ, đơn giản nhất |
| Cần báo user khi có người khác vừa sửa | **PATCH + optimistic lock (`version`)** |
| Logic phức tạp, bắt buộc read-modify-write | **Pessimistic lock** hoặc **optimistic + retry** |
| Form lớn, hay PUT cả object | Đổi sang **PATCH** hoặc **merge server-side** |
| 2 người sửa cùng `name` | **Optimistic lock** + UI conflict resolution |

```
Ưu tiên:
  1. PATCH (update đúng cột)     ← case name vs detail
  2. PATCH + version             ← cần phát hiện conflict
  3. Pessimistic lock            ← contention cao, logic phức tạp
```

---

### API design gợi ý

```typescript
// ✅ PATCH — partial update
@Patch(':id')
async updateProfile(
  @Param('id') id: number,
  @Body() dto: UpdateProfileDto,  // { name?: string; detail?: string; version?: number }
) {
  if (dto.version !== undefined) {
    const result = await this.profileService.patchWithVersion(id, dto);
    if (!result) throw new ConflictException('Profile đã thay đổi');
    return result;
  }
  return this.profileService.patch(id, dto);
}

// DTO — chỉ field optional
class UpdateProfileDto {
  @IsOptional() name?: string;
  @IsOptional() detail?: string;
  @IsOptional() version?: number;
}
```

```json
// Client A
PATCH /profiles/1  { "name": "Alice", "version": 3 }

// Client B (song song)
PATCH /profiles/1  { "detail": "new bio", "version": 3 }
```

- Không `version` → PATCH thuần, DB merge field — OK cho field khác nhau
- Có `version` → user B nhận **409** → GET lại → thấy name mới của A → gửi lại chỉ `detail` + `version` mới

---

### Checklist

```
□ API dùng PATCH, không PUT cả object (trừ khi có version check)
□ ORM dùng update() / QueryBuilder UPDATE — tránh save() whole entity
□ Có version hoặc updated_at nếu cần báo conflict
□ Client gửi kèm version từ lần GET cuối
□ Xử lý 409: reload → merge → retry
□ Không gọi HTTP / sleep trong transaction
□ Log conflict rate — nếu cao → cân nhắc pessimistic lock hoặc UX merge
```

> **Tóm lại:** A sửa `name`, B sửa `detail` — **fix đơn giản nhất là PATCH từng cột**, không ghi đè cả row. Thêm **`version`** khi cần user biết có người khác vừa sửa. Tránh pattern **đọc cả row → save() cả row** — đó mới là nguyên nhân lost update.

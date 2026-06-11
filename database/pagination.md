# Phân trang (Pagination) trong Database

Khi bảng có hàng triệu row, trả về toàn bộ dữ liệu một lần sẽ **tốn RAM, chậm network, và làm DB quá tải**. Phân trang chia kết quả thành từng "trang" nhỏ để client tải dần.

---

## Vấn đề của Limit/Offset và giải pháp thay thế

**Vấn đề:** `LIMIT 20 OFFSET 1000000` — DB vẫn phải **đọc và bỏ qua 1 triệu row** rồi mới trả 20 row. OFFSET càng lớn, query càng chậm tuyến tính. Trên bảng hàng chục triệu row, trang sâu gần như **không dùng được**.

**Giải pháp thay thế: Keyset / Cursor Pagination**

Thay vì "bỏ qua n row", lưu **giá trị cột cuối trang trước** làm mốc, query trang sau bằng `WHERE`:

```sql
-- ❌ Offset — chậm khi OFFSET lớn
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 1000000;

-- ✅ Keyset — luôn nhanh nhờ index seek
SELECT * FROM posts
WHERE (created_at, id) < ('2024-06-01', 12345)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```


|                  | Limit/Offset | Keyset/Cursor     |
| ---------------- | ------------ | ----------------- |
| Trang sâu        | Chậm dần     | Ổn định           |
| Nhảy trang tùy ý | ✅            | ❌ (chỉ next/prev) |
| Bảng lớn         | ❌            | ✅                 |


> Chi tiết triển khai xem mục **2. Keyset / Cursor Pagination** bên dưới.

---

## Tổng quan các kiểu phổ biến


| Kiểu                        | Cách hoạt động                                         | Dùng khi                                               |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| **Offset / Limit**          | `OFFSET n LIMIT m` — bỏ qua n row, lấy m row tiếp theo | Admin panel, bảng nhỏ–trung bình, cần nhảy trang tùy ý |
| **Keyset / Cursor**         | Dùng giá trị cột cuối trang làm "mốc" cho trang sau    | Feed, timeline, bảng lớn, real-time data               |
| **Page Number**             | `page=3&size=20` → tính `offset = (page-1) * size`     | API REST đơn giản, UI có số trang                      |
| **Seek (Composite Cursor)** | Cursor trên nhiều cột (vd: `(created_at, id)`)         | Sort phức tạp, tránh duplicate khi sort không unique   |


---

## 1. Offset / Limit Pagination

Cách **phổ biến nhất** — dùng `OFFSET` và `LIMIT` (hoặc `SKIP`/`TAKE` tùy DB/ORM).

### Cách hoạt động

```sql
-- Trang 1: row 1–20
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Trang 3: row 41–60
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;
```

### API triển khai

```
GET /posts?page=3&limit=20
```

```typescript
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(100, Number(req.query.limit) || 20);
const offset = (page - 1) * limit;

const [rows, total] = await Promise.all([
  db.query(
    `SELECT id, title, created_at FROM posts
     WHERE status = 'published'
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  ),
  db.query(`SELECT COUNT(*) FROM posts WHERE status = 'published'`),
]);

return {
  data: rows,
  pagination: {
    page,
    limit,
    total: total.rows[0].count,
    totalPages: Math.ceil(total.rows[0].count / limit),
  },
};
```

### Ưu điểm

- **Dễ hiểu, dễ triển khai** — mọi ORM đều hỗ trợ sẵn
- **Nhảy trang tùy ý** — user có thể vào trang 1, 5, 100 bất kỳ
- **Biết tổng số trang** — phù hợp UI có pagination bar (`1 2 3 ... 10`)

### Nhược điểm

- **Chậm khi OFFSET lớn** — DB vẫn phải **scan và bỏ qua** n row trước khi trả kết quả. `OFFSET 1000000` rất tốn kém dù chỉ lấy 20 row
- **Không ổn định (unstable)** — nếu có row mới insert/delete giữa 2 request, user có thể **thấy trùng hoặc mất row** khi lật trang
- **COUNT() tốn kém** — trên bảng lớn, đếm tổng số row mỗi request có thể chậm

### Tối ưu khi dùng Offset

```sql
-- Index khớp ORDER BY + WHERE để tránh sort toàn bộ bảng
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);

-- Tránh COUNT(*) mỗi request — cache total hoặc dùng estimate
SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = 'posts';
```

> Dùng Offset khi bảng **< vài trăm nghìn row** hoặc user **hiếm khi lật sâu** (trang 1–10).

---

## 2. Keyset / Cursor Pagination

Thay vì "bỏ qua n row", dùng **giá trị cột cuối cùng** của trang trước làm mốc.

### Cách hoạt động

```sql
-- Trang đầu
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Trang sau: cursor = created_at và id của row cuối trang trước
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
  AND (created_at, id) < ('2024-06-01T10:00:00Z', 12345)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Tại sao cần thêm `id`?** — `created_at` có thể trùng nhau. Thêm cột unique (thường là PK) để cursor **xác định duy nhất** vị trí.

### API triển khai

```
GET /posts?limit=20
GET /posts?limit=20&cursor=eyJjcmVhdGVkQXQiOiIyMDI0LTA2LTAxVDEwOjAwOjAwWiIsImlkIjoxMjM0NX0
```

```typescript
interface Cursor {
  createdAt: string;
  id: number;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(raw: string): Cursor {
  return JSON.parse(Buffer.from(raw, 'base64url').toString());
}

async function getPosts(limit: number, cursor?: string) {
  const params: unknown[] = [limit];
  let whereClause = `status = 'published'`;

  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    params.push(createdAt, id);
    whereClause += ` AND (created_at, id) < ($2::timestamptz, $3::bigint)`;
  }

  const rows = await db.query(
    `SELECT id, title, created_at FROM posts
     WHERE ${whereClause}
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    params
  );

  const last = rows[rows.length - 1];
  return {
    data: rows,
    pagination: {
      limit,
      nextCursor: last ? encodeCursor({ createdAt: last.created_at, id: last.id }) : null,
      hasMore: rows.length === limit,
    },
  };
}
```

### Ưu điểm

- **Hiệu năng ổn định** — luôn dùng index seek, **không phụ thuộc độ sâu trang**. Trang 1 và trang 10.000 đều nhanh như nhau
- **Ổn định khi data thay đổi** — row mới insert **không làm lệch** vị trí cursor hiện tại
- **Không cần COUNT()** — phù hợp feed vô hạn (infinite scroll)

### Nhược điểm

- **Không nhảy trang tùy ý** — chỉ đi **next/prev**, không vào thẳng "trang 50"
- **Phức tạp hơn** — cursor encode/decode, logic so sánh phải khớp chính xác `ORDER BY`
- **Sort phức tạp khó hơn** — sort theo nhiều cột hoặc cột không indexed cần thiết kế cursor cẩn thận
- **Không biết tổng số trang** — trừ khi chấp nhận chạy COUNT riêng

### Index cần thiết

```sql
-- Index phải khớp thứ tự ORDER BY
CREATE INDEX idx_posts_status_created_id
ON posts(status, created_at DESC, id DESC);
```

> Dùng Keyset cho **feed, notification, chat history, audit log** — mọi nơi user chỉ scroll xuống.

---

## 3. Page Number Pagination

Biến thể của Offset — client gửi `page` + `size`, server tính offset.

```
GET /users?page=2&size=50
→ OFFSET 50 LIMIT 50
```

### Ưu điểm

- **API trực quan** — frontend dễ bind với component pagination
- **Tương thích OpenAPI/Swagger** — pattern quen thuộc

### Nhược điểm

- **Kế thừa mọi nhược điểm của Offset** — chậm khi page lớn, unstable
- `**page=0` vs `page=1`** — cần quy ước rõ ràng (nên dùng 1-based)

### Triển khai an toàn

```typescript
const page = Math.max(1, parseInt(req.query.page as string) || 1);
const size = Math.min(100, parseInt(req.query.size as string) || 20);
const offset = (page - 1) * size;

// Giới hạn page tối đa để tránh OFFSET quá lớn
const MAX_PAGE = 500;
if (page > MAX_PAGE) {
  throw new BadRequestError(`Page cannot exceed ${MAX_PAGE}`);
}
```

---

## 4. Time-based / ID-only Cursor

Đơn giản hóa keyset khi cột sort **unique** (vd: `id` auto-increment, UUID v7).

```sql
-- Chỉ dùng id (unique, monotonic)
SELECT id, title FROM posts
WHERE id < 12345
ORDER BY id DESC
LIMIT 20;
```

```
GET /posts?after_id=12345&limit=20
GET /posts?before_id=10000&limit=20   -- scroll ngược
```

### Ưu điểm

- Cursor **đơn giản** — chỉ một giá trị số/string
- Index trên PK là đủ

### Nhược điểm

- Chỉ sort được theo **cột unique và monotonic**
- Sort theo `created_at` hoặc `score` vẫn cần composite cursor

---

## 5. Hybrid: Cursor + Total Count (khi cần cả hai)

Một số UI cần infinite scroll **và** hiển thị "Trang 3 / 120". Có thể kết hợp:

```typescript
return {
  data: rows,
  pagination: {
    nextCursor: '...',
    hasMore: true,
    // COUNT cache 5 phút — không chạy mỗi request
    total: cachedTotal,
    approximateTotal: true,
  },
};
```

Hoặc dùng **estimated count** của PostgreSQL thay vì exact count:

```sql
SELECT reltuples::bigint FROM pg_class WHERE relname = 'posts';
```

---

## So sánh nhanh


| Tiêu chí                   | Offset/Limit        | Keyset/Cursor   |
| -------------------------- | ------------------- | --------------- |
| Hiệu năng trang sâu        | ❌ Chậm dần          | ✅ Ổn định       |
| Nhảy trang tùy ý           | ✅                   | ❌               |
| Infinite scroll            | ⚠️ Có thể nhưng kém | ✅ Tốt nhất      |
| Tổng số trang              | ✅ Dễ                | ❌ Cần thêm bước |
| Data thay đổi giữa request | ❌ Duplicate/miss    | ✅ Ổn định hơn   |
| Độ phức tạp code           | ✅ Thấp              | ⚠️ Trung bình   |


---

## Checklist triển khai

### 1. Luôn có LIMIT

```sql
-- ❌ Nguy hiểm — có thể trả hàng triệu row
SELECT * FROM orders ORDER BY created_at DESC;

-- ✅
SELECT * FROM orders ORDER BY created_at DESC LIMIT 50;
```

### 2. Index khớp query

```sql
-- Query: WHERE status = 'active' ORDER BY created_at DESC, id DESC
CREATE INDEX idx_orders_active_created_id
ON orders(status, created_at DESC, id DESC);
```

### 3. Giới hạn `limit` phía server

```typescript
const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
```

### 4. Không expose raw SQL cursor cho client (nếu có thể)

Encode cursor (base64url / signed token) để client không tự sửa điều kiện WHERE.

### 5. Quy ước sort nhất quán

Cursor **phải dùng cùng ORDER BY** với query. Đổi sort → invalidate cursor cũ.

---

## Gợi ý chọn kiểu


| Use case                               | Nên dùng                                    |
| -------------------------------------- | ------------------------------------------- |
| Admin table, search result, < 100k row | **Offset / Page Number**                    |
| Social feed, chat, notification        | **Keyset Cursor**                           |
| Export CSV hàng triệu row              | **Keyset** (loop cursor, không dùng offset) |
| API public cần link `?page=5`          | **Page Number** + giới hạn max page         |
| Real-time dashboard                    | **Keyset** + poll bằng `since` timestamp    |


---

## Ví dụ ORM

### Prisma — Offset

```typescript
const page = 2;
const limit = 20;

const [data, total] = await Promise.all([
  prisma.post.findMany({
    where: { status: 'published' },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.post.count({ where: { status: 'published' } }),
]);
```

### Prisma — Cursor

```typescript
const posts = await prisma.post.findMany({
  where: { status: 'published' },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: 20,
  ...(cursor && {
    cursor: { id: cursor.id },
    skip: 1, // bỏ qua chính cursor row
  }),
});
```

### TypeORM — Offset

```typescript
const [data, total] = await repo.findAndCount({
  where: { status: 'published' },
  order: { createdAt: 'DESC' },
  skip: (page - 1) * limit,
  take: limit,
});
```

---

## Tóm tắt

- **Offset/Limit**: đơn giản, phù hợp bảng nhỏ và UI có số trang — tránh dùng khi OFFSET > vài nghìn
- **Keyset/Cursor**: chuẩn cho scale lớn và infinite scroll — cần index đúng và cursor composite khi sort không unique
- **Luôn** giới hạn `limit`, có index khớp `WHERE + ORDER BY`, và chọn kiểu pagination theo **use case UX** chứ không chỉ theo sở thích code


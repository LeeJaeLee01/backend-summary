# Transaction & Consistency

## 1. Vấn đề về Transaction & Consistency

### Tổng quan

| Vấn đề | Mô tả |
|--------|--------|
| **Race condition** | 2 request cùng đọc–sửa–ghi → ghi đè lẫn nhau |
| **Lost update** | A và B cùng update balance — một bên mất |
| **Dirty read / Phantom read** | Đọc dữ liệu chưa commit hoặc row xuất hiện giữa chừng |
| **Deadlock** | Transaction A chờ B, B chờ A → DB kill một bên |
| **Thiếu transaction** | Ghi nhiều bảng không atomic → dữ liệu nửa vời |

---

### 1. Race Condition

**Là gì:** Hai request xử lý **cùng lúc** trên cùng data — đọc cùng giá trị cũ, ghi đè lẫn nhau.

```
Request A: đọc stock = 10  →  trừ 1  →  ghi 9
Request B: đọc stock = 10  →  trừ 1  →  ghi 9   ← lẽ ra phải là 8
```

**So sánh các cách xử lý:**

| Cách | Ưu điểm | Nhược điểm |
|------|---------|------------|
| **Atomic update** | Đơn giản, nhanh, 1 query, không cần lock thủ công | Chỉ phù hợp phép tính đơn giản (`+`, `-`); khó cho logic phức tạp |
| **Optimistic lock** | Không block reader; hiệu năng tốt khi ít conflict | Phải retry khi conflict; không phù hợp contention cao |
| **Pessimistic lock** | Đảm bảo chắc chắn, không bị ghi đè | Block request khác; dễ deadlock; chậm khi contention cao |
| **Transaction** | Atomicity read + write | **Không đủ một mình** — vẫn cần lock hoặc atomic SQL |
| **Queue / Redis lock** | Serialize hoàn toàn; kiểm soát tốt distributed | Phức tạp hơn; thêm dependency; single point nếu Redis fail |

```sql
-- Atomic update — ưu tiên khi chỉ cần +/-
UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0;

-- Optimistic lock
UPDATE products SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 5;

-- Pessimistic lock
BEGIN;
SELECT stock FROM products WHERE id = 1 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 1;
COMMIT;
```

> **Cách tốt nhất:**
> 1. **Atomic SQL** — nếu chỉ cần `+/-` (stock, balance, counter)
> 2. **Optimistic lock** — read nhiều, ghi ít, conflict thấp (edit profile, update config)
> 3. **Pessimistic lock** — contention cao, không thể dùng atomic (transfer tiền giữa 2 account)
> 4. **Redis lock** — nhiều instance app, cần serialize cross-service

---

### 2. Lost Update

**Là gì:** Hai transaction cùng update một field — **update sau ghi đè update trước** mà không biết.

```
Balance = 1000
Tx A: đọc 1000 → +100 → ghi 1100
Tx B: đọc 1000 → -50  → ghi 950    ← mất +100 của A
```

**So sánh các cách xử lý:**

| Cách | Ưu điểm | Nhược điểm |
|------|---------|------------|
| **Atomic operation** | Không lost update; 1 query; nhanh nhất | Chỉ `SET col = col + X`; không validate phức tạp trước khi ghi |
| **Optimistic lock** | Scale tốt; không giữ lock lâu | Retry logic; UX kém nếu conflict liên tục |
| **Pessimistic lock** | Chắc chắn 100% | Chặn concurrent write; overhead lock |
| **Isolation REPEATABLE READ+** | App code đơn giản hơn | DB phát hiện conflict → error/retry; tùy engine; SERIALIZABLE rất chậm |

```sql
-- ✅ Tốt nhất cho lost update đơn giản
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
UPDATE accounts SET balance = balance - 50  WHERE id = 1;
```

> **Cách tốt nhất:**
> - Cộng/trừ số: **Atomic SQL** (`balance = balance + X`)
> - Update object phức tạp (nhiều field, validate): **Optimistic lock** (`version` column)
> - Tài chính, inventory critical: **Pessimistic lock** + transaction ngắn

---

### 3. Dirty Read / Phantom Read

**Dirty read** — đọc data **chưa commit** (sau đó bị rollback).

**Phantom read** — query lần 2 trong cùng tx thấy **row mới** do tx khác insert.

**So sánh Isolation Level:**

| Level | Ưu điểm | Nhược điểm |
|-------|---------|------------|
| **READ COMMITTED** (Postgres default) | Nhanh; ít lock; đủ cho hầu hết API | Non-repeatable read, phantom read vẫn có thể |
| **REPEATABLE READ** | Đọc nhất quán trong tx; Postgres chặn cả phantom | Lock nhiều hơn; có thể serialization failure → retry |
| **SERIALIZABLE** | Nhất quán tuyệt đối | Chậm nhất; deadlock/conflict cao; cần retry nhiều |
| **READ UNCOMMITTED** | Nhanh nhất | Dirty read — **hầu như không dùng** |

| Level | Dirty read | Non-repeatable read | Phantom read |
|-------|------------|---------------------|--------------|
| READ UNCOMMITTED | Có | Có | Có |
| READ COMMITTED | Không | Có | Có |
| REPEATABLE READ | Không | Không | Có* |
| SERIALIZABLE | Không | Không | Không |

\* Postgres `REPEATABLE READ` chặn phantom read.

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT * FROM orders WHERE status = 'pending';
-- logic trong tx — đọc lại vẫn nhất quán
COMMIT;
```

> **Cách tốt nhất:**
> - **Mặc định READ COMMITTED** — CRUD API thông thường
> - **REPEATABLE READ** — báo cáo/truy vấn nhiều bước trong một tx cần snapshot nhất quán
> - **SERIALIZABLE** — chỉ khi business bắt buộc (hiếm); cân nhắc optimistic lock thay thế
> - **Không dùng READ UNCOMMITTED** trong production

---

### 4. Deadlock

**Là gì:** Transaction A giữ lock chờ B; B giữ lock chờ A → DB **rollback một victim**.

**So sánh các cách xử lý:**

| Cách | Ưu điểm | Nhược điểm |
|------|---------|------------|
| **Retry + backoff** | Đơn giản; DB đã chọn victim | Latency tăng khi deadlock nhiều; cần idempotent |
| **Lock cùng thứ tự** | Giảm deadlock ở root cause | Phải discipline toàn team; khó với dynamic resource |
| **Transaction ngắn** | Giảm window xung đột | Cần refactor code (không gọi API trong tx) |
| **Index đúng** | Giảm row bị lock | Không fix deadlock do lock order |
| **Optimistic lock** | Ít row lock → ít deadlock | Không phù hợp mọi case |

```typescript
async function transfer(from: number, to: number, amount: number) {
  const ids = [from, to].sort((a, b) => a - b);
  await withRetry(async () => {
    await dataSource.transaction(async (manager) => {
      await manager.findOne(Account, { where: { id: ids[0] }, lock: { mode: 'pessimistic_write' } });
      await manager.findOne(Account, { where: { id: ids[1] }, lock: { mode: 'pessimistic_write' } });
      // transfer...
    });
  });
}
```

> **Cách tốt nhất (kết hợp):**
> 1. **Phòng tránh**: transaction ngắn + lock cùng thứ tự + index đúng
> 2. **Xử lý khi xảy ra**: **retry + exponential backoff** (bắt buộc có trong production)
> 3. Giảm pessimistic lock không cần thiết → chuyển sang optimistic lock khi có thể

> Chi tiết thêm: `problems.md` — mục Deadlock.

---

### 5. Thiếu Transaction (ghi nhiều bảng không atomic)

**Là gì:** Ghi nhiều bảng **không bọc transaction** — lỗi giữa chừng → data **nửa vời**.

**So sánh các cách xử lý:**

| Cách | Ưu điểm | Nhược điểm |
|------|---------|------------|
| **DB Transaction** | ACID đầy đủ; đơn giản; rollback tự động | Chỉ trong **một database**; không cross-service |
| **Saga** | Phù hợp microservice, nhiều DB | Phức tạp; eventual consistency; cần compensating action |
| **Outbox pattern** | Đảm bảo event gửi sau commit | Thêm bảng outbox + worker; phức tạp hơn tx thuần |
| **Idempotency key** | Retry an toàn; chống duplicate | Không thay thế transaction; cần lưu key |
| **2PC (Two-Phase Commit)** | Strong consistency distributed | Chậm; ít dùng; single point of failure |

```typescript
// ✅ Cùng DB — DB transaction
await dataSource.transaction(async (manager) => {
  const order = await manager.save(Order, { ... });
  await manager.decrement(Product, { id }, 'stock', 1);
  await manager.save(Payment, { orderId: order.id });
});
```

```
// Microservice — Saga
Order ✅ → Payment ❌ → Compensate: cancel Order
```

> **Cách tốt nhất:**
> - **Cùng một DB** → **Database transaction** (luôn luôn)
> - **Nhiều service / nhiều DB** → **Saga** (choreography hoặc orchestration) + compensating transaction
> - **DB + message queue** → **Transaction + Outbox pattern**
> - **Mọi API ghi dữ liệu** → thêm **Idempotency key** để retry an toàn

---

## 2. Bảng tổng hợp — Cách tốt nhất theo scenario

| Scenario | Cách tốt nhất | Lý do |
|----------|---------------|--------|
| Trừ stock, cộng balance | **Atomic SQL** | Nhanh, đơn giản, không lost update |
| Update nhiều field, ít conflict | **Optimistic lock** | Không block; scale tốt |
| Transfer tiền, đặt chỗ slot | **Pessimistic lock** + tx ngắn | Contention cao, cần chắc chắn |
| API CRUD thông thường | **READ COMMITTED** | Postgres default, đủ dùng |
| Báo cáo multi-step trong 1 tx | **REPEATABLE READ** | Snapshot nhất quán |
| Ghi order + payment + inventory (1 DB) | **DB transaction** | ACID, rollback tự động |
| Order → Payment → Inventory (3 service) | **Saga** + compensate | Không shared DB |
| DB commit + gửi Kafka | **Outbox pattern** | Không mất event |
| Deadlock xảy ra | **Retry backoff** + lock order | DB kill victim, app retry |
| Retry API sau network fail | **Idempotency key** | Không duplicate |

---

## 3. ACID — nền tảng transaction

| Thuộc tính | Ý nghĩa |
|------------|---------|
| **Atomicity** | Tất cả hoặc không — rollback khi lỗi |
| **Consistency** | Data luôn hợp lệ theo constraint |
| **Isolation** | Transaction không ảnh hưởng lẫn nhau |
| **Durability** | Đã commit thì không mất (dù crash) |

---

## 4. Thứ tự ưu tiên khi phỏng vấn

```
1. Có thể dùng Atomic SQL không?     → Dùng trước
2. Cùng DB, nhiều bảng?              → Transaction
3. Conflict thấp?                    → Optimistic lock
4. Conflict cao / tài chính?           → Pessimistic lock + tx ngắn
5. Cross-service?                    → Saga + Idempotency
6. Deadlock?                         → Retry + lock order
7. Cần isolation cao?                → REPEATABLE READ (trước SERIALIZABLE)
```

> **Tóm lại**: Ưu tiên giải pháp **đơn giản nhất đủ dùng** — **Atomic SQL** > **Transaction** > **Optimistic lock** > **Pessimistic lock** > **Saga**. Luôn có **retry** cho deadlock và **idempotency** cho API ghi dữ liệu.

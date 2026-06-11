# Repository Pattern

> **Repository** là lớp trung gian giữa **business logic (Service)** và **nguồn dữ liệu (DB, cache, API)** — Service chỉ nói chuyện với interface kiểu `findById`, `save`, không biết SQL/ORM cụ thể.

Liên quan: [patterns/index.md](./index.md) · [factory.md](./factory.md) · [decorator.md](./decorator.md) · [../../database/orm.md](../../database/orm.md) · NestJS layered: `Controller → Service → Repository`.

---

## 1. Khái niệm

### 1.1. Định nghĩa (DDD — Domain-Driven Design)

Repository **không phải** GoF pattern, mà từ **Eric Evans / Martin Fowler** — mô phỏng **collection in-memory** cho aggregate, dù data thật nằm trong DB.

```
┌──────────────┐      business rules       ┌──────────────┐      data access      ┌──────────────┐
│  Controller  │ ────────────────────────► │   Service    │ ──────────────────────► │  Repository  │
│  (HTTP)      │                           │  (use case)  │                         │  (interface) │
└──────────────┘                           └──────────────┘                         └──────┬───────┘
                                                                                            │
                                                                                            ▼
                                                                                   ┌──────────────┐
                                                                                   │ Postgres /   │
                                                                                   │ TypeORM /    │
                                                                                   │ Prisma / API │
                                                                                   └──────────────┘
```

**Vấn đề Repository giải quyết:**

```
❌ Service nhét SQL/ORM — khó test, khó đổi DB, business lẫn query
class OrderService {
  async create(dto) {
    await this.dataSource.query(
      'INSERT INTO orders ...', [...]  // SQL rải trong service
    );
    await this.email.send(...);       // business + data access lẫn lộn
  }
}

✅ Service chỉ orchestrate — Repository lo persistence
class OrderService {
  constructor(private readonly orders: OrderRepository) {}
  async create(dto) {
    const order = Order.create(dto);   // domain logic
    await this.orders.save(order);
    await this.notifier.orderCreated(order);
  }
}
```

**Bốn đặc điểm:**

| Đặc điểm | Mô tả |
|----------|-------|
| **Ẩn persistence** | Service không biết Postgres hay Mongo |
| **Interface theo domain** | `findById`, `save` — không `SELECT * FROM orders` |
| **Collection-like API** | Thêm/sửa/xóa aggregate như làm việc với `Map`/`Array` |
| **Một repo / aggregate root** | `OrderRepository` cho `Order`, không repo cho từng bảng con |

### 1.2. Repository vs các khái niệm gần giống

| Khái niệm | Khác Repository ở đâu |
|----------|-------------------------|
| **DAO (Data Access Object)** | DAO thường **1-1 với bảng**; Repository **1 aggregate** (có thể nhiều bảng) |
| **Active Record** | Entity tự `.save()` — logic + persistence cùng class (`user.save()`) |
| **Data Mapper** | Entity thuần + Repository/ORM map — **NestJS/TypeORM Data Mapper hay dùng** |
| **ORM trực tiếp trong Service** | Bỏ qua lớp repo — OK prototype, khó test/đổi DB khi lớn |
| **Query Service** | Read model phức tạp (report) — tách riêng, không nhét vào repo ghi |

```
DAO:           UserDao, OrderItemDao     → per table
Repository:    OrderRepository           → Order + OrderItems (aggregate)
Query Service: OrderReportQuery          → JOIN 5 bảng, read-only
```

### 1.3. Luồng layered trong NestJS

```
HTTP Request
     │
     ▼
Controller     ← validate input, map DTO, HTTP status
     │
     ▼
Service        ← business rules, transaction boundary, gọi repo khác
     │
     ▼
Repository     ← CRUD, query builder, raw SQL
     │
     ▼
Database
```

> **Quy tắc vàng:** Repository **không** gọi Service. Dependency **một chiều** xuống dưới.

---

## 2. Mục đích — dùng để làm gì?

### 2.1. Khi nào nên dùng

| Lợi ích | Giải thích |
|---------|------------|
| **Tách business khỏi DB** | Service đọc như use case, không lẫn SQL |
| **Dễ test** | Mock `OrderRepository` khi test `OrderService` |
| **Đổi implementation** | `PostgresOrderRepo` → `PrismaOrderRepo` — Service không đổi |
| **Tập trung query** | Index, N+1 fix, pagination — một chỗ |
| **Multi-tenant** | Repo set `search_path` / filter `tenant_id` — Service không lặp lại |
| **Caching** | [CachedRepository decorator](./decorator.md) bọc repo gốc |

### 2.2. Khi **không** cần (hoặc overkill)

```
❌ CRUD app nhỏ, Prisma gọi thẳng trong Service — ship nhanh OK
❌ Report read-only phức tạp — dùng Query Service / raw SQL riêng, không nhét vào repo
❌ Repository chỉ wrap 1 dòng prisma.user.findMany — thêm lớp không có giá trị
❌ Repo chứa business rule ("if stock < 0 reject") — thuộc Service/Domain
```

| Quy mô | Gợi ý |
|--------|-------|
| Prototype / MVP | Prisma/TypeORM trong Service chấp nhận được |
| Team > 2, nhiều query | Interface Repository rõ ràng |
| Microservice / hexagonal | Repository là **port** — bắt buộc |

---

## 3. Cách triển khai

### 3.1. Interface + implementation thủ công (TypeScript)

```typescript
// domain/order.entity.ts — object nghiệp vụ, không decorator ORM
export class Order {
  constructor(
    readonly id: string,
    readonly customerId: string,
    readonly total: number,
    readonly status: 'pending' | 'paid' | 'shipped',
  ) {}

  static create(customerId: string, total: number): Order {
    return new Order(crypto.randomUUID(), customerId, total, 'pending');
  }

  markPaid(): Order {
    if (this.status !== 'pending') throw new Error('Invalid transition');
    return new Order(this.id, this.customerId, this.total, 'paid');
  }
}
```

```typescript
// orders/order.repository.ts — port
export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract findByCustomer(customerId: string): Promise<Order[]>;
  abstract save(order: Order): Promise<void>;
}
```

```typescript
// orders/postgres-order.repository.ts — adapter
import { Pool } from 'pg';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostgresOrderRepository extends OrderRepository {
  constructor(private readonly pool: Pool) {
    super();
  }

  async findById(id: string): Promise<Order | null> {
    const { rows } = await this.pool.query(
      'SELECT id, customer_id, total, status FROM orders WHERE id = $1',
      [id],
    );
    if (!rows[0]) return null;
    return this.toDomain(rows[0]);
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    const { rows } = await this.pool.query(
      'SELECT id, customer_id, total, status FROM orders WHERE customer_id = $1 ORDER BY id',
      [customerId],
    );
    return rows.map((r) => this.toDomain(r));
  }

  async save(order: Order): Promise<void> {
    await this.pool.query(
      `INSERT INTO orders (id, customer_id, total, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET total = $3, status = $4`,
      [order.id, order.customerId, order.total, order.status],
    );
  }

  private toDomain(row: {
    id: string;
    customer_id: string;
    total: string;
    status: Order['status'];
  }): Order {
    return new Order(row.id, row.customer_id, Number(row.total), row.status);
  }
}
```

```typescript
// orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(private readonly orders: OrderRepository) {}

  async getOrder(id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async payOrder(id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    const paid = order.markPaid();           // business logic ở domain/service
    await this.orders.save(paid);
    return paid;
  }
}
```

**Map DB row ↔ Domain entity** nằm trong Repository — Service chỉ thấy `Order`.

### 3.2. NestJS module wiring

```typescript
@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: OrderRepository,
      useClass: PostgresOrderRepository,
    },
  ],
})
export class OrdersModule {}
```

Đổi sang Prisma — chỉ đổi provider:

```typescript
{
  provide: OrderRepository,
  useClass: PrismaOrderRepository,
}
```

→ Kết hợp [Strategy](./index.md) / [Factory](./factory.md) khi chọn implementation theo config.

### 3.3. TypeORM — Repository built-in

TypeORM có `Repository<Entity>` sẵn — có thể dùng trực tiếp hoặc **wrap** thành domain repository:

```typescript
@Entity()
export class OrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column('decimal')
  total: number;

  @Column()
  status: string;
}
```

```typescript
@Injectable()
export class TypeOrmOrderRepository extends OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repo: Repository<OrderEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async save(order: Order): Promise<void> {
    await this.repo.save(this.toEntity(order));
  }

  private toDomain(e: OrderEntity): Order {
    return new Order(e.id, e.customerId, Number(e.total), e.status as Order['status']);
  }

  private toEntity(o: Order): OrderEntity {
    const e = new OrderEntity();
    e.id = o.id;
    e.customerId = o.customerId;
    e.total = o.total;
    e.status = o.status;
    return e;
  }
}
```

> **Custom domain `OrderRepository`** + entity ORM tách biệt — Service không phụ thuộc `@Entity()` decorator.

### 3.4. Prisma — wrap client

Prisma không có “Repository class” sẵn — tự tạo lớp wrap `PrismaService`:

```typescript
@Injectable()
export class PrismaOrderRepository extends OrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        customerId: order.customerId,
        total: order.total,
        status: order.status,
      },
      update: {
        total: order.total,
        status: order.status,
      },
    });
  }

  private toDomain(row: {
    id: string;
    customerId: string;
    total: unknown;
    status: string;
  }): Order {
    return new Order(row.id, row.customerId, Number(row.total), row.status as Order['status']);
  }
}
```

### 3.5. Repository + transaction

Transaction boundary thường ở **Service** — Repository nhận `transaction client`:

```typescript
export abstract class OrderRepository {
  abstract save(order: Order, tx?: UnitOfWork): Promise<void>;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly inventory: InventoryRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async placeOrder(dto: PlaceOrderDto) {
    return this.unitOfWork.run(async (tx) => {
      const order = Order.create(dto.customerId, dto.total);
      await this.inventory.reserve(dto.sku, dto.qty, tx);
      await this.orders.save(order, tx);
      return order;
    });
  }
}
```

> Chi tiết transaction: [transaction-consistency.md](../../database/transaction-consistency.md).

### 3.6. Multi-tenant Repository

```typescript
@Injectable()
export class TenantOrderRepository extends OrderRepository {
  constructor(
    private readonly pool: Pool,
    private readonly tenantContext: TenantContextService,
  ) {
    super();
  }

  private async query<T>(sql: string, params: unknown[]): Promise<T> {
    const schema = this.tenantContext.schemaName;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL search_path = ${schema}, platform`);
      const result = await client.query(sql, params);
      await client.query('COMMIT');
      return result as T;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Order | null> {
    const { rows } = await this.query<{ rows: Record<string, unknown>[] }>(
      'SELECT id, customer_id, total, status FROM orders WHERE id = $1',
      [id],
    );
    // ...
  }
}
```

Tenant isolation **nên nằm trong Repository** (hoặc base class) — Service không lặp `SET search_path`.

---

## 4. Testing — mock Repository

```typescript
describe('OrdersService', () => {
  let service: OrdersService;
  let repo: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findByCustomer: jest.fn(),
      save: jest.fn(),
    };
    service = new OrdersService(repo);
  });

  it('payOrder marks order paid and saves', async () => {
    const order = new Order('1', 'c1', 100, 'pending');
    repo.findById.mockResolvedValue(order);

    const result = await service.payOrder('1');

    expect(result.status).toBe('paid');
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));
  });
});
```

**NestJS TestingModule:**

```typescript
const module = await Test.createTestingModule({
  providers: [
    OrdersService,
    { provide: OrderRepository, useValue: mockOrderRepository },
  ],
}).compile();
```

→ Đây là lý do chính dùng **interface/abstract class** thay vì gọi Prisma trực tiếp trong Service.

---

## 5. Repository + Decorator (cache)

Bọc repo gốc — xem [decorator.md](./decorator.md):

```typescript
@Injectable()
export class CachedOrderRepository extends OrderRepository {
  constructor(private readonly inner: OrderRepository) {
    super();
  }

  async findById(id: string): Promise<Order | null> {
    const cached = cache.get(id);
    if (cached) return cached;
    const order = await this.inner.findById(id);
    if (order) cache.set(id, order, 60);
    return order;
  }

  async save(order: Order): Promise<void> {
    await this.inner.save(order);
    cache.delete(order.id);
  }

  // delegate các method khác...
}
```

Wiring:

```typescript
{
  provide: OrderRepository,
  useFactory: (pg: PostgresOrderRepository) => new CachedOrderRepository(pg),
  inject: [PostgresOrderRepository],
}
```

---

## 6. Anti-pattern — tránh

| Anti-pattern | Vấn đề | Cách sửa |
|--------------|--------|----------|
| **God Repository** | 50 method CRUD mọi bảng | Tách theo aggregate |
| **Business logic trong Repo** | `if (order.total > 1000) status = 'vip'` | Đưa vào Service/Domain |
| **Repo gọi Repo qua Service khác** | Circular dependency | Service orchestrate |
| **Leak ORM entity ra Service** | `return OrderEntity` | `toDomain()` trong Repo |
| **Generic `BaseRepository<T>` quá sớm** | Abstraction vô nghĩa | CRUD cụ thể trước, generic sau |
| **1 query report trong Repo** | JOIN 8 bảng, DTO lạ | `OrderReportQueryService` riêng |

---

## 7. Interface design — method nên có gì?

**Theo aggregate, không mirror bảng:**

```typescript
// ✅ API theo use case / domain
export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract findActiveByCustomer(customerId: string): Promise<Order[]>;
  abstract save(order: Order): Promise<void>;
  abstract delete(id: string): Promise<void>;
}

// ❌ Mirror SQL quá sát
export abstract class OrderRepository {
  abstract selectFromOrdersWhereStatusEquals(status: string): Promise<unknown[]>;
}
```

**Read vs Write (CQRS nhẹ):**

| Loại | Tên gợi ý | Trách nhiệm |
|------|-----------|-------------|
| Write | `OrderRepository` | `save`, `findById` cho command |
| Read | `OrderReadModelQuery` | List, search, report — SQL tối ưu read |

---

## 8. Ưu & nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tách persistence khỏi business | Thêm boilerplate (interface + impl + mapper) |
| Dễ mock, dễ đổi DB/ORM | Mapping entity ↔ domain tốn code |
| Query tập trung — dễ tối ưu | Dễ viết repo “vô nghĩa” chỉ wrap 1 dòng ORM |
| Phù hợp hexagonal / clean arch | Team nhỏ có thể thấy over-engineering |

---

## 9. Checklist khi áp dụng

```
□ Service không import Prisma/TypeORM/query trực tiếp?
□ Repository interface nằm gần domain — không phụ thuộc HTTP?
□ Map ORM row → domain entity trong Repository?
□ Business rule không nằm trong Repository?
□ Transaction ở Service / UnitOfWork — Repo nhận tx optional?
□ Test Service với mock Repository?
□ Report phức tạp tách Query Service — không nhét God Repository?
□ Multi-tenant: isolation trong Repo base, không lặp ở mọi Service?
```

---

## 10. Tóm tắt

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Repository là gì?** | Lớp truy cập data — Service gọi `find/save`, không biết SQL |
| **Dùng để làm gì?** | Tách business khỏi DB, dễ test, đổi ORM, tập trung query |
| **Khác DAO?** | Repo theo **aggregate**; DAO thường theo **bảng** |
| **NestJS triển khai?** | Abstract class + `useClass` / custom wrap TypeORM·Prisma |
| **Khi không cần?** | MVP nhỏ — Prisma trong Service; report — Query Service riêng |

**Công thức nhớ:**

```
Controller  → HTTP, DTO
Service     → business rules, transaction, orchestrate
Repository  → persistence, query, map DB ↔ domain
Query Svc   → read phức tạp / report (tách khỏi repo ghi)
```

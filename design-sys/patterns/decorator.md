# Decorator Pattern

> **Decorator** bọc (wrap) một object để **bổ sung hành vi** mà **không sửa class gốc** và **không dùng inheritance**. Client vẫn gọi qua cùng interface — có thể xếp chồng nhiều lớp decorator.

Liên quan: [patterns/index.md](./index.md) · [singleton.md](./singleton.md) · NestJS `@Controller()`, `@Injectable()` — decorator **metadata**; Interceptor — gần **structural decorator** runtime.

---

## 1. Khái niệm

### 1.1. Định nghĩa (GoF — Structural Pattern)

```
                    ┌─────────────────┐
                    │    Component    │  ← interface chung
                    │  + operation()  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────────┐
    │  ConcreteComp   │           │     Decorator       │
    │  (logic gốc)    │           │  - component        │
    └─────────────────┘           │  + operation()      │
                                    └──────────┬──────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
               ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
               │ LoggingDecorator│   │ CacheDecorator  │   │ RetryDecorator  │
               └─────────────────┘   └─────────────────┘   └─────────────────┘

Client gọi:
  new CacheDecorator(
    new LoggingDecorator(
      new ConcretePaymentService()
    )
  ).charge(100)
```

**Bốn đặc điểm:**

| Đặc điểm | Mô tả |
|----------|-------|
| **Cùng interface** | Decorator và component gốc implement cùng interface |
| **Composition over inheritance** | Bọc object, không `extends` sâu |
| **Thêm hành vi động** | Gắn/tháo decorator lúc runtime |
| **Xếp chồng được** | Log → Cache → Retry → Service gốc |

### 1.2. Phân biệt hai nghĩa “Decorator”

Trong backend TypeScript/NestJS hay gặp **hai khái niệm cùng tên**:

| | **Structural Decorator (GoF)** | **TypeScript Decorator (syntax)** |
|---|-------------------------------|-----------------------------------|
| **Là gì** | Design pattern — wrap object runtime | Annotation trên class/method — metadata |
| **Mục đích** | Thêm behavior (log, cache, auth) | Mô tả cấu hình cho framework đọc |
| **Ví dụ** | `CacheDecorator wraps UserRepo` | `@Controller()`, `@Get()`, `@Injectable()` |
| **Ai xử lý** | Code của bạn gọi `operation()` | NestJS reflect metadata lúc bootstrap |
| **Runtime** | Bọc lời gọi method thật | Framework đăng ký route, DI, guard |

```
GoF Decorator:     client → wrapper.operation() → ... → core.operation()
TS Decorator:      @Get('users')  →  Nest đọc metadata → đăng ký route GET /users
```

> Doc này tập trung **GoF Decorator** + cách map sang **NestJS Interceptor/Middleware**. Phần TS decorator chỉ là **công cụ metadata** — không thay thế structural pattern.

### 1.3. So sánh pattern liên quan

| Pattern | Khác Decorator ở đâu |
|---------|----------------------|
| **Adapter** | Đổi interface — cho 2 API không tương thích làm việc cùng nhau |
| **Proxy** | Kiểm soát truy cập (lazy load, remote, permission) — interface giữ nguyên |
| **Decorator** | **Thêm** trách nhiệm (log, cache, metrics) — interface giữ nguyên |
| **Strategy** | **Thay thế** thuật toán bên trong — không wrap từng lời gọi |
| **Middleware (Express/Nest)** | Pipeline request — cross-cutting ở tầng HTTP |

---

## 2. Mục đích — dùng để làm gì?

### 2.1. Khi nào nên dùng

| Use case | Decorator làm gì |
|----------|------------------|
| **Logging / tracing** | Ghi log trước/sau mỗi lời gọi service |
| **Cache** | Trả kết quả cache thay vì gọi DB |
| **Retry / circuit breaker** | Bọc HTTP client, payment gateway |
| **Authorization** | Kiểm tra quyền trước khi delegate xuống core |
| **Metrics** | Đo latency, đếm request |
| **Transaction wrapper** | `BEGIN` → gọi repo → `COMMIT`/`ROLLBACK` |
| **Rate limit** | Giới hạn gọi API bên thứ ba |

**Lợi ích so với sửa class gốc:**

```
✅ Open/Closed — mở rộng hành vi, không sửa PaymentService
✅ Tách cross-cutting concern khỏi business logic
✅ Bật/tắt từng lớp theo môi trường (dev: log, prod: cache + metrics)
✅ Kết hợp linh hoạt — không explosion subclass (LoggedCachedPayment vs CachedLoggedPayment...)
```

### 2.2. Khi **không** nên dùng

```
❌ Chỉ có 1 hành vi cố định — inject trực tiếp vào service đủ
❌ Decorator chain quá dài — khó debug “lỗi ở lớp nào?”
❌ Cần đổi interface hoàn toàn → dùng Adapter
❌ Logic nghiệp vụ chính — đừng nhét vào decorator (vi phạm SRP ngược)
❌ NestJS đã có Interceptor/Guard/Pipe — không tự wrap thủ công trùng lặp
```

---

## 3. Cách triển khai

### 3.1. Classic Decorator (TypeScript — interface)

```typescript
interface PaymentGateway {
  charge(amount: number, currency: string): Promise<string>;
}

// Component gốc
class StripeGateway implements PaymentGateway {
  async charge(amount: number, currency: string): Promise<string> {
    // gọi Stripe API thật
    return `ch_${amount}_${currency}`;
  }
}

// Decorator base — giữ reference tới component bên trong
abstract class PaymentDecorator implements PaymentGateway {
  constructor(protected readonly wrapped: PaymentGateway) {}

  charge(amount: number, currency: string): Promise<string> {
    return this.wrapped.charge(amount, currency);
  }
}

// Concrete decorators
class LoggingPaymentDecorator extends PaymentDecorator {
  async charge(amount: number, currency: string): Promise<string> {
    console.log(`[charge] start amount=${amount} ${currency}`);
    const id = await super.charge(amount, currency);
    console.log(`[charge] done id=${id}`);
    return id;
  }
}

class RetryPaymentDecorator extends PaymentDecorator {
  constructor(
    wrapped: PaymentGateway,
    private readonly maxAttempts = 3,
  ) {
    super(wrapped);
  }

  async charge(amount: number, currency: string): Promise<string> {
    let lastError: unknown;
    for (let i = 1; i <= this.maxAttempts; i++) {
      try {
        return await super.charge(amount, currency);
      } catch (e) {
        lastError = e;
        console.warn(`[retry] attempt ${i} failed`);
      }
    }
    throw lastError;
  }
}
```

**Ghép decorator lúc bootstrap (composition root):**

```typescript
function createPaymentGateway(): PaymentGateway {
  const core = new StripeGateway();
  const withRetry = new RetryPaymentDecorator(core, 3);
  const withLogging = new LoggingPaymentDecorator(withRetry);
  return withLogging;
}

// createPaymentGateway().charge(99, 'USD')
// → Log → Retry → Stripe
```

### 3.2. Decorator cho Repository (cache)

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.queryOne('SELECT * FROM users WHERE id = $1', [id]);
  }
}

class CachedUserRepository implements UserRepository {
  private readonly cache = new Map<string, User | null>();

  constructor(
    private readonly inner: UserRepository,
    private readonly ttlMs = 60_000,
  ) {}

  async findById(id: string): Promise<User | null> {
    const hit = this.cache.get(id);
    if (hit !== undefined) return hit;

    const user = await this.inner.findById(id);
    this.cache.set(id, user);
    setTimeout(() => this.cache.delete(id), this.ttlMs);
    return user;
  }
}

// DI wiring
const repo = new CachedUserRepository(new PostgresUserRepository(db));
```

### 3.3. Functional wrapper (không cần class hierarchy)

Phù hợp function/service nhỏ — cùng ý tưởng decorator:

```typescript
type ChargeFn = (amount: number, currency: string) => Promise<string>;

function withLogging(fn: ChargeFn): ChargeFn {
  return async (amount, currency) => {
    console.log('charge start', { amount, currency });
    const result = await fn(amount, currency);
    console.log('charge done', { result });
    return result;
  };
}

function withRetry(fn: ChargeFn, max = 3): ChargeFn {
  return async (amount, currency) => {
    for (let i = 0; i < max; i++) {
      try {
        return await fn(amount, currency);
      } catch (e) {
        if (i === max - 1) throw e;
      }
    }
    throw new Error('unreachable');
  };
}

const charge: ChargeFn = withLogging(
  withRetry(async (amount, currency) => {
    return stripe.charge(amount, currency);
  }),
);
```

### 3.4. NestJS — TypeScript Decorator (metadata)

Framework đọc metadata lúc khởi động — **không phải** wrap runtime theo GoF:

```typescript
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id')
  @UseGuards(AuthGuard)           // framework gắn guard vào route
  @UseInterceptors(LoggingInterceptor)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
```

| Decorator Nest | Vai trò |
|----------------|---------|
| `@Controller()`, `@Get()` | Đăng ký route |
| `@Injectable()` | Đăng ký provider DI |
| `@UseGuards()` | AuthZ trước handler |
| `@UseInterceptors()` | Bọc request/response — **gần GoF nhất** |
| `@UsePipes()` | Transform/validate input |

**Tự viết method decorator (metadata):**

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Get('admin')
@Roles('admin')
adminOnly() {}
```

### 3.5. NestJS Interceptor — Decorator runtime thực sự

Interceptor bọc `Observable` handler — đúng tinh thần “thêm hành vi quanh lời gọi gốc”:

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const started = Date.now();
    const label = `${req.method} ${req.url}`;

    console.log(`→ ${label}`);

    return next.handle().pipe(
      tap(() => console.log(`← ${label} ${Date.now() - started}ms`)),
    );
  }
}
```

```typescript
@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {}
```

**Luồng tương đương decorator chain:**

```
Request
  → Middleware
  → Guard
  → Interceptor (before)     ← LoggingInterceptor
  → Pipe
  → Controller method        ← “core component”
  → Interceptor (after)      ← transform response, cache
  → Response
```

### 3.6. NestJS — Decorator qua DI (`useClass` wrap)

Kết hợp DI + structural decorator — inject interface, provider là decorator:

```typescript
export abstract class PaymentGateway {
  abstract charge(amount: number, currency: string): Promise<string>;
}

@Injectable()
export class StripePaymentGateway extends PaymentGateway {
  async charge(amount: number, currency: string) {
    return `stripe_${amount}`;
  }
}

@Injectable()
export class LoggingPaymentGateway extends PaymentGateway {
  constructor(
    @Inject(StripePaymentGateway) private readonly inner: PaymentGateway,
  ) {
    super();
  }

  async charge(amount: number, currency: string) {
    console.log('charge', amount);
    return this.inner.charge(amount, currency);
  }
}

// orders.module.ts
@Module({
  providers: [
    StripePaymentGateway,
    {
      provide: PaymentGateway,
      useClass: LoggingPaymentGateway, // có thể chain thêm bằng custom factory
    },
  ],
})
export class OrdersModule {}
```

---

## 4. Ví dụ thực chiến — HTTP Client có metrics + retry

```typescript
interface HttpClient {
  get<T>(url: string): Promise<T>;
}

class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }
}

class MetricsHttpClientDecorator implements HttpClient {
  constructor(
    private readonly inner: HttpClient,
    private readonly metrics: MetricsService,
  ) {}

  async get<T>(url: string): Promise<T> {
    const end = this.metrics.startTimer('http_get');
    try {
      return await this.inner.get<T>(url);
    } finally {
      end({ url });
    }
  }
}

class RetryHttpClientDecorator implements HttpClient {
  constructor(
    private readonly inner: HttpClient,
    private readonly retries = 2,
  ) {}

  async get<T>(url: string): Promise<T> {
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.inner.get<T>(url);
      } catch (e) {
        if (attempt === this.retries) throw e;
        await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
      }
    }
    throw new Error('unreachable');
  }
}

// Factory tại composition root
function buildHttpClient(metrics: MetricsService): HttpClient {
  return new MetricsHttpClientDecorator(
    new RetryHttpClientDecorator(new FetchHttpClient()),
    metrics,
  );
}
```

---

## 5. Inheritance vs Decorator

**Vấn đề inheritance** — mỗi tổ hợp behavior = 1 subclass:

```
PaymentService
├── LoggedPaymentService
├── CachedPaymentService
├── LoggedCachedPaymentService      ← explosion
└── CachedLoggedPaymentService
```

**Decorator** — xếp chồng theo nhu cầu:

```
new LogDecorator(new CacheDecorator(new PaymentService()))
new CacheDecorator(new PaymentService())   // prod: chỉ cache
```

| | Inheritance | Decorator |
|---|-------------|-----------|
| Thêm behavior | Sửa hierarchy / subclass mới | Wrap instance |
| Kết hợp log+cache+retry | N subclass | 3 decorator xếp chồng |
| Runtime đổi behavior | Khó | Dễ — đổi object wrap |
| OCP | Dễ vi phạm | Phù hợp |

---

## 6. Ưu & nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Mở rộng không sửa code gốc (OCP) | Nhiều lớp nhỏ — khó theo dõi call stack |
| Tách cross-cutting concern | Debug phải biết thứ tự wrap |
| Linh hoạt compose lúc runtime | Overhead nhỏ mỗi lớp (thường chấp nhận được) |
| Thay thế Strategy từng lớp | Dễ lạm dụng thay vì dùng framework hook sẵn |

---

## 7. Checklist khi áp dụng

```
□ Decorator và component cùng interface/abstraction?
□ Business logic vẫn nằm ở core — decorator chỉ “viền”?
□ Thứ tự wrap đúng? (retry bọc ngoài log, hay ngược lại?)
□ NestJS: đã cân nhắc Guard/Interceptor/Pipe trước khi tự wrap?
□ Test: mock inner component, test từng decorator riêng
□ Không nhầm @Get() metadata với GoF structural decorator
```

---

## 8. Tóm tắt

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Decorator là gì?** | Wrap object để thêm hành vi, cùng interface, không sửa class gốc |
| **Dùng để làm gì?** | Log, cache, retry, metrics, auth — cross-cutting quanh service/API |
| **Triển khai thế nào?** | Class wrap + delegate; functional wrapper; NestJS Interceptor/DI |
| **Khác TS `@Decorator`?** | GoF = runtime wrap; TS/Nest = metadata cho framework |
| **Backend NestJS nên dùng gì?** | **Interceptor/Guard/Pipe** cho HTTP; **DI wrap** cho service/integration client |

**Công thức nhớ:**

```
Thêm hành vi quanh lời gọi mà không sửa core  →  Decorator (hoặc Nest Interceptor)
Mô tả route/DI cho framework                 →  TS Decorator (@Get, @Injectable)
Đổi interface 2 hệ không khớp               →  Adapter (không phải Decorator)
```

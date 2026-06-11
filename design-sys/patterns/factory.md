# Factory Pattern

> **Factory** tập trung logic **tạo object** vào một chỗ — client chỉ cần biết **interface/abstraction**, không `new` trực tiếp class cụ thể. Giúp code **lỏng coupling**, dễ đổi implementation và dễ test.

Liên quan: [patterns/index.md](./index.md) · [singleton.md](./singleton.md) · [decorator.md](./decorator.md) · NestJS `useFactory`, `useClass` trong `providers`.

---

## 1. Khái niệm

### 1.1. Định nghĩa (GoF — Creational Pattern)

**Vấn đề Factory giải quyết:**

```
❌ Client tự new — coupling cứng
const notifier = process.env.SMS_ENABLED
  ? new SmsNotifier(apiKey)
  : new EmailNotifier(smtpHost);
// logic tạo object rải rác khắp codebase

✅ Client gọi factory — chỉ biết interface
const notifier = NotifierFactory.create(config);
notifier.send('Hello');
```

```
┌──────────────┐         create()          ┌─────────────────────┐
│    Client    │ ────────────────────────► │      Factory        │
│ (Controller, │                           │  (biết config/env)  │
│  Service)    │ ◄──────────────────────── │                     │
└──────────────┘      Product interface    └──────────┬──────────┘
                                                      │
                        ┌─────────────────────────────┼─────────────────────────────┐
                        ▼                             ▼                             ▼
               ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
               │ EmailNotifier   │          │  SmsNotifier    │          │ SlackNotifier   │
               └─────────────────┘          └─────────────────┘          └─────────────────┘
```

**Ba đặc điểm:**

| Đặc điểm | Mô tả |
|----------|-------|
| **Ẩn `new`** | Client không biết class concrete nào được khởi tạo |
| **Tập trung logic tạo** | Điều kiện chọn loại object nằm một chỗ |
| **Phụ thuộc abstraction** | Client code against `Notifier`, không `EmailNotifier` |

### 1.2. Ba biến thể Factory (hay gặp)

| Biến thể | Là gì | Khi dùng |
|----------|-------|----------|
| **Simple Factory** | 1 function/class `create(type)` trả product | Chọn implementation theo config/string — **phổ biến nhất backend** |
| **Factory Method** | Subclass override `createProduct()` | Framework/library để subclass quyết định loại product |
| **Abstract Factory** | Factory tạo **họ object liên quan** | Nhóm DB + Cache + Queue cùng vendor (AWS stack vs GCP stack) |

```
Simple Factory:     NotifierFactory.create('email') → EmailNotifier

Factory Method:   abstract ReportExporter { createWriter() }
                  PdfExporter.createWriter() → PdfWriter
                  CsvExporter.createWriter() → CsvWriter

Abstract Factory: AwsFactory.createQueue() + createStorage() + createDb()
                  GcpFactory.createQueue() + createStorage() + ...
```

### 1.3. Phân biệt Factory vs pattern liên quan

| Pattern | Khác Factory ở đâu |
|---------|---------------------|
| **Singleton** | Đảm bảo **1 instance** — Factory lo **tạo** instance (có thể tạo nhiều loại) |
| **Builder** | Lắp object **từng bước**, nhiều optional field — Factory thường **1 lần tạo xong** |
| **Strategy** | **Hành vi** có thể đổi runtime — Factory **tạo** object đúng loại từ đầu |
| **DI Container (NestJS)** | Framework **inject** sẵn — `useFactory` là Factory do container gọi |
| **Abstract Factory vs Factory Method** | Factory Method = 1 product/loại; Abstract Factory = **bộ** product đồng bộ |

---

## 2. Mục đích — dùng để làm gì?

### 2.1. Khi nào nên dùng

| Use case | Factory làm gì |
|----------|----------------|
| **Chọn implementation theo config** | `DB_DRIVER=postgres` → `PostgresRepo` vs `MysqlRepo` |
| **Tạo object phức tạp** | Kết nối DB: pool + SSL + retry — không để Controller `new Pool()` |
| **Multi-tenant** | `createTenantDataSource(tenantSchema)` |
| **Payment / notification provider** | Stripe vs PayPal vs MoMo theo tenant plan |
| **File storage** | S3 vs local disk theo `NODE_ENV` |
| **Test** | Factory trả mock/stub khi `NODE_ENV=test` |

**Lợi ích:**

```
✅ Single place to change — đổi provider chỉ sửa factory
✅ Open/Closed — thêm SlackNotifier, không sửa client
✅ Dễ test — inject factory giả hoặc override create()
✅ Ẩn constructor phức tạp — 10 dependency không lộ ra ngoài
```

### 2.2. Khi **không** nên dùng

```
❌ Chỉ có 1 implementation duy nhất, không đổi — inject trực tiếp đủ
❌ Object đơn giản (DTO, value object) — new trực tiếp OK
❌ Factory chỉ if/else 2 dòng — có thể over-engineering
❌ Đã có NestJS DI — dùng useClass/useFactory thay vì tự viết Factory class thừa
```

---

## 3. Cách triển khai

### 3.1. Simple Factory (function)

```typescript
interface Notifier {
  send(to: string, message: string): Promise<void>;
}

class EmailNotifier implements Notifier {
  constructor(private readonly smtpUrl: string) {}
  async send(to: string, message: string) {
    console.log(`email to ${to}: ${message}`);
  }
}

class SmsNotifier implements Notifier {
  constructor(private readonly apiKey: string) {}
  async send(to: string, message: string) {
    console.log(`sms to ${to}: ${message}`);
  }
}

type NotifierType = 'email' | 'sms';

function createNotifier(type: NotifierType, config: AppConfig): Notifier {
  switch (type) {
    case 'email':
      return new EmailNotifier(config.smtpUrl);
    case 'sms':
      return new SmsNotifier(config.smsApiKey);
    default:
      throw new Error(`Unknown notifier: ${type}`);
  }
}

// Client
const notifier = createNotifier(config.notifierType, config);
await notifier.send('user@acme.com', 'Order shipped');
```

### 3.2. Simple Factory (class — dễ mock/test)

```typescript
@Injectable()
export class NotifierFactory {
  constructor(private readonly config: AppConfig) {}

  create(type?: NotifierType): Notifier {
    const resolved = type ?? this.config.notifierType;
    switch (resolved) {
      case 'email':
        return new EmailNotifier(this.config.smtpUrl);
      case 'sms':
        return new SmsNotifier(this.config.smsApiKey);
    }
  }
}

@Injectable()
export class OrderService {
  constructor(private readonly notifierFactory: NotifierFactory) {}

  async shipOrder(orderId: string, email: string) {
    const notifier = this.notifierFactory.create();
    await notifier.send(email, `Order ${orderId} shipped`);
  }
}
```

### 3.3. Factory Method

Subclass (hoặc strategy class) **override** cách tạo product — framework thường dùng:

```typescript
interface ReportWriter {
  write(rows: Record<string, unknown>[]): Buffer;
}

abstract class ReportExporter {
  protected abstract createWriter(): ReportWriter;

  export(rows: Record<string, unknown>[]): Buffer {
    const writer = this.createWriter();
    return writer.write(rows);
  }
}

class PdfWriter implements ReportWriter {
  write(rows: Record<string, unknown>[]) {
    return Buffer.from(`pdf:${rows.length}`);
  }
}

class CsvWriter implements ReportWriter {
  write(rows: Record<string, unknown>[]) {
    return Buffer.from(`csv:${rows.length}`);
  }
}

class PdfReportExporter extends ReportExporter {
  protected createWriter() {
    return new PdfWriter();
  }
}

class CsvReportExporter extends ReportExporter {
  protected createWriter() {
    return new CsvWriter();
  }
}
```

> **Factory Method** = “template” export giữ nguyên, chỉ đổi **cách tạo writer**.

### 3.4. Abstract Factory — họ object liên quan

Khi cần các service **cùng ecosystem** không trộn lẫn:

```typescript
interface QueueClient {
  publish(topic: string, body: string): Promise<void>;
}

interface StorageClient {
  put(key: string, data: Buffer): Promise<void>;
}

interface CloudFactory {
  createQueue(): QueueClient;
  createStorage(): StorageClient;
}

class AwsFactory implements CloudFactory {
  createQueue() {
    return new SqsClient();
  }
  createStorage() {
    return new S3Client();
  }
}

class GcpFactory implements CloudFactory {
  createQueue() {
    return new PubSubClient();
  }
  createStorage() {
    return new GcsClient();
  }
}

// Bootstrap
const cloud: CloudFactory =
  config.cloud === 'aws' ? new AwsFactory() : new GcpFactory();

const queue = cloud.createQueue();
const storage = cloud.createStorage();
```

### 3.5. NestJS — `useFactory` (Factory do DI container gọi)

Pattern **phổ biến nhất** trong NestJS backend:

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: (config: ConfigService) => {
        return new Pool({
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          database: config.get('DB_NAME'),
          max: config.get('DB_POOL_MAX', 20),
          ssl: config.get('DB_SSL') ? { rejectUnauthorized: true } : undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
```

```typescript
@Injectable()
export class OrdersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findById(id: string) {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return rows[0] ?? null;
  }
}
```

**Các kiểu provider NestJS:**

| Provider | Vai trò | Giống Factory |
|----------|---------|---------------|
| `useClass` | Nest `new Class()` | Đơn giản — 1 class cố định |
| `useValue` | Inject giá trị có sẵn | Config object, constant |
| `useFactory` | Gọi function tạo instance | **Factory pattern** — logic phức tạp, async |
| `useExisting` | Alias token khác | Không tạo mới |

**Factory async (kết nối trước khi app ready):**

```typescript
{
  provide: REDIS_CLIENT,
  useFactory: async (config: ConfigService) => {
    const client = createClient({ url: config.get('REDIS_URL') });
    await client.connect();
    return client;
  },
  inject: [ConfigService],
}
```

### 3.6. NestJS — Factory chọn implementation (`useClass` động)

Kết hợp Factory + Strategy:

```typescript
export abstract class PaymentGateway {
  abstract charge(amount: number, currency: string): Promise<string>;
}

@Injectable()
export class StripeGateway extends PaymentGateway {
  async charge(amount: number, currency: string) {
    return `stripe_${amount}_${currency}`;
  }
}

@Injectable()
export class PayPalGateway extends PaymentGateway {
  async charge(amount: number, currency: string) {
    return `paypal_${amount}_${currency}`;
  }
}

@Module({
  providers: [
    StripeGateway,
    PayPalGateway,
    {
      provide: PaymentGateway,
      useFactory: (config: ConfigService, stripe: StripeGateway, paypal: PayPalGateway) => {
        return config.get('PAYMENT_PROVIDER') === 'paypal' ? paypal : stripe;
      },
      inject: [ConfigService, StripeGateway, PayPalGateway],
    },
  ],
  exports: [PaymentGateway],
})
export class PaymentModule {}
```

### 3.7. Multi-tenant — Factory tạo DataSource theo schema

```typescript
@Injectable()
export class TenantDataSourceFactory {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  createQueryRunner(schemaName: string) {
  // validate schemaName against allowlist — không nhận input thô từ client
    if (!/^tenant_[a-z0-9_]+$/.test(schemaName)) {
      throw new Error('Invalid tenant schema');
    }
    const runner = this.pool; // hoặc DataSource.createQueryRunner()
    return {
      async withTenant<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`SET LOCAL search_path = ${schemaName}, platform`);
          const result = await fn(client);
          await client.query('COMMIT');
          return result;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      },
    };
  }
}
```

---

## 4. Ví dụ thực chiến — JWT TokenVerifier Factory

Tạo đúng verifier theo môi trường / tenant SSO — client không biết HS256 hay RS256:

```typescript
interface TokenVerifier {
  verify(token: string): Promise<JwtPayload>;
}

class HmacTokenVerifier implements TokenVerifier {
  constructor(private readonly secret: string) {}
  async verify(token: string) {
    // jwt.verify với secret
    return { sub: 'user-1' };
  }
}

class RsaTokenVerifier implements TokenVerifier {
  constructor(private readonly jwksUrl: string) {}
  async verify(token: string) {
    // fetch JWKS, verify RS256
    return { sub: 'user-1' };
  }
}

@Injectable()
export class TokenVerifierFactory {
  constructor(private readonly config: ConfigService) {}

  create(tenantIdpType?: 'hmac' | 'oidc'): TokenVerifier {
    const type = tenantIdpType ?? this.config.get('DEFAULT_IDP_TYPE');

    if (type === 'oidc') {
      return new RsaTokenVerifier(this.config.get('JWKS_URL'));
    }
    return new HmacTokenVerifier(this.config.get('JWT_SECRET'));
  }
}
```

> Có thể bọc thêm [LoggingDecorator](./decorator.md) **sau** khi factory tạo verifier — Factory tạo **cái gì**, Decorator thêm **hành vi quanh** nó.

---

## 5. Factory vs Builder

| | **Factory** | **Builder** |
|---|-------------|-------------|
| **Mục tiêu** | Tạo **đúng loại** object | Lắp object **phức tạp từng bước** |
| **Ví dụ** | Email vs SMS notifier | `QueryBuilder.where().orderBy().limit()` |
| **Optional fields** | Thường qua config constructor | `.withX().withY().build()` |
| **Backend** | `useFactory`, provider selection | SQL query builder, email template builder |

```typescript
// Builder — 1 loại object, nhiều bước
const email = new EmailBuilder()
  .to('user@acme.com')
  .subject('Invoice')
  .attachPdf(buffer)
  .build();

// Factory — chọn loại object
const notifier = notifierFactory.create('email');
```

---

## 6. Ưu & nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Giảm coupling — client không `new` concrete | Thêm 1 lớp indirection |
| Logic tạo object tập trung | Factory class có thể phình nếu quá nhiều `if/else` |
| Dễ mở rộng loại mới (OCP) | Dễ nhầm với Service thường — cần đặt tên rõ `*Factory` |
| Test dễ — mock factory | Abstract Factory phức tạp, ít cần ở app CRUD đơn giản |

**Factory “mùi code” (code smell):**

```
⚠️ switch/case 15 nhánh — cân nhắc Registry Map hoặc DI token per implementation
⚠️ Factory gọi Factory gọi Factory — đơn giản hóa composition root
⚠️ Factory chứa business logic — chỉ nên lo CREATION, không tính giá đơn hàng
```

---

## 7. Checklist khi áp dụng

```
□ Client chỉ phụ thuộc interface, không import concrete class?
□ Logic chọn implementation nằm 1 chỗ (factory / module bootstrap)?
□ NestJS: đã dùng useFactory thay vì new trong constructor Controller?
□ Factory không chứa business rule — chỉ wiring + config?
□ Test: mock factory hoặc override provider trong TestingModule?
□ Multi-tenant: validate input trước khi factory tạo connection/schema?
□ Đặt tên rõ: XxxFactory.create() / createXxx() — không nhầm với Service
```

---

## 8. Tóm tắt

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Factory là gì?** | Tập trung logic **tạo object** — client không `new` trực tiếp |
| **Dùng để làm gì?** | Chọn implementation theo config, tạo object phức tạp, multi-tenant wiring |
| **Ba biến thể?** | Simple Factory · Factory Method · Abstract Factory |
| **NestJS dùng gì?** | **`useFactory`** trong providers — Factory do IoC container gọi |
| **Khác Strategy?** | Factory **tạo** đúng object; Strategy **đổi hành vi** sau khi đã có object |
| **Khác Singleton?** | Factory tạo (có thể nhiều loại); Singleton đảm bảo 1 instance |

**Công thức nhớ:**

```
Client không nên biết new ClassNào()           →  Factory
NestJS bootstrap: pool, redis, chọn gateway    →  useFactory
Cần bộ AWS/GCP service đồng bộ                 →  Abstract Factory
Object phức tạp, nhiều bước optional           →  Builder (không phải Factory)
```

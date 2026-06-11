# Singleton Pattern

> **Singleton** đảm bảo một class chỉ có **đúng một instance** trong toàn bộ vòng đời ứng dụng, và cung cấp **một điểm truy cập toàn cục** (global access point) tới instance đó.

Liên quan: [patterns/index.md](./index.md) — NestJS dùng Singleton làm scope mặc định cho `@Injectable()` provider.

---

## 1. Khái niệm

### 1.1. Định nghĩa

**Singleton** (GoF — Gang of Four) thuộc nhóm **Creational Pattern**:

```
┌─────────────────────────────────────────────────────────┐
│                    Application                           │
│                                                         │
│   Client A ──┐                                          │
│   Client B ──┼──► getInstance() ──► ┌──────────────┐  │
│   Client C ──┘         │             │  Singleton   │  │
│                        │             │  (1 instance)│  │
│                        └────────────►│  - state     │  │
│                                      │  - methods   │  │
│                                      └──────────────┘  │
└─────────────────────────────────────────────────────────┘

  new Singleton()  ← bị chặn (private constructor)
```

**Ba đặc điểm:**

| Đặc điểm | Mô tả |
|----------|-------|
| **Một instance duy nhất** | Dù gọi `getInstance()` bao nhiêu lần, luôn trả về cùng object |
| **Constructor private** | Ngăn code bên ngoài `new Class()` tùy ý |
| **Global access** | Mọi nơi trong app truy cập qua `getInstance()` (hoặc DI container) |

### 1.2. Phân biệt với “biến global”

| | Biến global (`let db = ...`) | Singleton |
|---|------------------------------|-----------|
| **Khởi tạo** | Thường lúc import/load module | Lazy (khi cần) hoặc eager |
| **Đóng gói** | Không — ai cũng gán lại được | Encapsulation — logic trong class |
| **Test** | Khó mock | Có thể inject/mock nếu thiết kế đúng |
| **Lifecycle** | Không rõ ràng | Có thể hook init/destroy |

> Singleton **không phải** “cách đẹp hơn để tạo global variable” — nó là **kiểm soát** việc chỉ có một instance và **khi nào** instance được tạo.

---

## 2. Mục đích — dùng để làm gì?

### 2.1. Khi nào nên dùng

Dùng khi hệ thống **thực sự chỉ cần một instance** và việc có nhiều instance gây **lỗi logic hoặc lãng phí tài nguyên**:

| Use case | Tại sao cần 1 instance |
|----------|------------------------|
| **Database connection pool** | Mở nhiều pool → tràn connection, config lệch |
| **Config / Settings** | Một nguồn config thống nhất toàn app |
| **Logger** | Ghi log nhất quán, tránh duplicate handler |
| **Cache in-memory** | Nhiều cache instance → data không đồng bộ |
| **Hardware / OS resource** | File lock, printer queue — OS thường chỉ cho 1 |
| **ID generator / counter** | Sequence phải unique toàn hệ thống (trong 1 process) |

### 2.2. Khi **không** nên dùng

```
❌ Dùng Singleton chỉ vì “tiện gọi từ mọi nơi”
❌ Business logic class (OrderService, UserService) — vi phạm SRP, khó test
❌ Cần nhiều instance với config khác nhau (2 DB khác nhau)
❌ Multi-tenant — mỗi tenant một context, không share 1 singleton stateful
❌ Microservice scale horizontal — mỗi pod/process có instance riêng anyway
```

| Vấn đề | Hậu quả |
|--------|----------|
| **Hidden dependency** | Class gọi `Logger.getInstance()` — khó thấy dependency |
| **Khó test** | State leak giữa các test case |
| **Vi phạm DIP** | Phụ thuộc concrete thay vì interface |
| **Stateful singleton** | Race condition khi concurrent |

**Thay thế tốt hơn trong backend hiện đại:** **Dependency Injection** (NestJS, Spring) — container quản lý “một instance per app” mà vẫn inject được, mock được.

---

## 3. Cách triển khai

### 3.1. Classic Singleton (TypeScript)

```typescript
class DatabasePool {
  private static instance: DatabasePool | null = null;
  private connections: string[] = [];

  // Chặn new từ bên ngoài
  private constructor(private readonly maxConnections: number) {
    console.log('Pool created');
  }

  static getInstance(maxConnections = 10): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool(maxConnections);
    }
    return DatabasePool.instance;
  }

  acquire(): string {
    // logic lấy connection từ pool
    return `conn-${this.connections.length}`;
  }
}

// Usage
const pool1 = DatabasePool.getInstance();
const pool2 = DatabasePool.getInstance();
console.log(pool1 === pool2); // true
```

**Lazy initialization** — instance chỉ tạo khi gọi `getInstance()` lần đầu.

### 3.2. Eager initialization

Tạo instance ngay khi class load — phù hợp khi cost thấp và luôn cần dùng:

```typescript
class AppConfig {
  private static readonly instance = new AppConfig();

  readonly env: string;
  readonly port: number;

  private constructor() {
    this.env = process.env.NODE_ENV ?? 'development';
    this.port = Number(process.env.PORT ?? 3000);
  }

  static getInstance(): AppConfig {
    return AppConfig.instance;
  }
}
```

### 3.3. Module singleton (idiom phổ biến trong Node.js)

Node.js **cache module** sau lần `require`/`import` đầu — pattern thực tế nhất:

```typescript
// logger.ts
class Logger {
  private logs: string[] = [];

  info(message: string) {
    const line = `[INFO] ${new Date().toISOString()} ${message}`;
    this.logs.push(line);
    console.log(line);
  }

  getLogs() {
    return [...this.logs];
  }
}

// Export 1 instance — module system đảm bảo chỉ load 1 lần
export const logger = new Logger();
```

```typescript
// orders.service.ts
import { logger } from './logger';

export function createOrder(id: string) {
  logger.info(`Order ${id} created`);
}
```

> Trong Node.js backend, **export singleton instance từ module** thường đủ và sạch hơn `getInstance()` thủ công.

### 3.4. Thread-safe (Java — tham khảo)

TypeScript/Node.js **single-threaded** (event loop) — classic double-checked locking ít cần. Java multi-thread cần cẩn thận:

```java
public class DatabasePool {
    private static volatile DatabasePool instance;

    private DatabasePool() {}

    public static DatabasePool getInstance() {
        if (instance == null) {
            synchronized (DatabasePool.class) {
                if (instance == null) {
                    instance = new DatabasePool();
                }
            }
        }
        return instance;
    }
}
```

**Hoặc enum singleton (Java best practice):**

```java
public enum AppConfig {
    INSTANCE;

    private final String env = System.getenv("ENV");

    public String getEnv() { return env; }
}

// AppConfig.INSTANCE.getEnv()
```

### 3.5. Singleton + Dependency Injection (NestJS)

NestJS **không cần** viết `getInstance()` — IoC container tự quản lý singleton:

```typescript
@Injectable()  // scope mặc định = SINGLETON
export class LoggerService {
  private logs: string[] = [];

  info(message: string) {
    this.logs.push(message);
    console.log(message);
  }
}

@Injectable()
export class OrdersService {
  constructor(private readonly logger: LoggerService) {}  // cùng instance mọi nơi

  create(id: string) {
    this.logger.info(`Order ${id}`);
  }
}
```

```typescript
@Module({
  providers: [LoggerService, OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
```

| Scope NestJS | Instance |
|--------------|----------|
| `DEFAULT` (Singleton) | 1 instance / application |
| `REQUEST` | 1 instance / HTTP request |
| `TRANSIENT` | Instance mới mỗi lần inject |

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  tenantId!: string;
}
```

> **Khuyến nghị backend:** dùng **DI singleton** thay vì static `getInstance()` — dễ test, rõ dependency graph.

### 3.6. Singleton có thể test được

Tránh static cứng — inject interface:

```typescript
interface Logger {
  info(message: string): void;
}

class ConsoleLogger implements Logger {
  info(message: string) {
    console.log(message);
  }
}

class OrdersService {
  constructor(private readonly logger: Logger) {}

  create(id: string) {
    this.logger.info(`Order ${id}`);
  }
}

// Production: new OrdersService(new ConsoleLogger())
// Test:       new OrdersService({ info: jest.fn() })
```

---

## 4. Ví dụ thực chiến — Connection Pool wrapper

```typescript
// pool.manager.ts
import { Pool } from 'pg';

export class PgPoolManager {
  private static instance: PgPoolManager | null = null;
  private readonly pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      max: 20,
    });
  }

  static getInstance(): PgPoolManager {
    if (!PgPoolManager.instance) {
      PgPoolManager.instance = new PgPoolManager();
    }
    return PgPoolManager.instance;
  }

  getPool(): Pool {
    return this.pool;
  }

  async shutdown(): Promise<void> {
    await this.pool.end();
    PgPoolManager.instance = null;
  }
}
```

**Lưu ý vận hành:**

```
□ Gọi shutdown() khi app nhận SIGTERM — NestJS OnApplicationShutdown
□ Không tạo pool mới mỗi request
□ Singleton trong 1 process ≠ singleton toàn cluster — mỗi pod 1 pool
```

---

## 5. Ưu & nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Kiểm soát số instance (1) | Global state — hidden coupling |
| Tiết kiệm resource (pool, cache) | Khó unit test nếu dùng static |
| Lazy init — trì hoãn cost | Vi phạm SRP nếu nhét quá nhiều logic |
| Điểm truy cập rõ (`getInstance`) | Scale ngang: mỗi process vẫn 1 instance |

---

## 6. Checklist khi áp dụng

```
□ Thực sự cần đúng 1 instance trong 1 process?
□ Có thể dùng DI container thay vì static getInstance()?
□ State trong singleton có thread-safe / async-safe không?
□ Có plan reset/mock cho test?
□ Có cleanup khi shutdown (pool.end(), disconnect)?
□ Không nhét business logic vào singleton “tiện tay”
```

---

## 7. Tóm tắt

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Singleton là gì?** | Pattern đảm bảo class chỉ có 1 instance + global access |
| **Dùng để làm gì?** | Pool, config, logger, cache — tài nguyên dùng chung, expensive to create |
| **Triển khai thế nào?** | Private constructor + `getInstance()` / export module instance / NestJS `@Injectable()` |
| **Backend nên dùng cách nào?** | **DI singleton** (NestJS default) — tránh static global khó test |

**Công thức nhớ:**

```
Cần 1 instance + expensive/shared resource  →  Singleton (qua DI)
Chỉ muốn gọi tiện từ mọi nơi               →  Không dùng — refactor sang inject
```

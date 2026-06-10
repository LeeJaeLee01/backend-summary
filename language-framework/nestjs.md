# NestJS

## 1. Vòng đời của NestJS

NestJS có **2 vòng đời** cần phân biệt: **vòng đời ứng dụng** (bootstrap/shutdown) và **vòng đời request** (xử lý HTTP).

### A. Vòng đời ứng dụng (Lifecycle Hooks)

Khi app khởi động và tắt, Nest gọi các hook theo thứ tự:

```
OnModuleInit → OnApplicationBootstrap → ... app chạy ... → OnModuleDestroy → BeforeApplicationShutdown → OnApplicationShutdown
```

| Hook | Khi nào chạy |
|------|--------------|
| `OnModuleInit` | Module được khởi tạo xong |
| `OnApplicationBootstrap` | Toàn bộ module đã init — app sẵn sàng nhận request |
| `OnModuleDestroy` | Module bắt đầu bị hủy |
| `BeforeApplicationShutdown` | App nhận tín hiệu tắt (SIGTERM...) |
| `OnApplicationShutdown` | App đã đóng xong — dọn resource cuối cùng |

```typescript
@Injectable()
export class AppService implements OnModuleInit, OnApplicationBootstrap {
  onModuleInit() { /* kết nối DB, load config */ }
  onApplicationBootstrap() { /* chạy sau khi mọi module sẵn sàng */ }
}
```

### B. Vòng đời request (Request Lifecycle)

Mỗi request HTTP đi qua các lớp theo thứ tự:

```
Middleware → Guards → Interceptors (before) → Pipes → Controller → Service
                                                              ↓
Exception Filters ← Interceptors (after) ← Response
```

| Thành phần | Vai trò |
|------------|---------|
| **Middleware** | Xử lý trước route — log, parse cookie, cors... |
| **Guards** | **Authorization** — có được phép vào route không? (`CanActivate`) |
| **Interceptors** | Bọc request/response — transform data, log, cache, timeout |
| **Pipes** | **Validation & transform** input — `ValidationPipe`, `ParseIntPipe` |
| **Controller** | Nhận request, gọi service, trả response |
| **Service** | Business logic |
| **Exception Filters** | Bắt lỗi, format response lỗi thống nhất |

**Thứ tự thực thi quan trọng khi phỏng vấn:**

1. Middleware chạy **trước** mọi thứ
2. Guard chạy **trước** Pipe và Controller — chặn sớm nếu không có quyền
3. Pipe chạy **trước** Controller — validate/transform `@Body()`, `@Param()`
4. Interceptor bọc **cả hai phía** — trước và sau handler
5. Exception Filter bắt lỗi từ bất kỳ bước nào phía trên

> **Tóm lại**: App lifecycle = hook khởi động/tắt module. Request lifecycle = **Middleware → Guard → Interceptor → Pipe → Controller → Service**, lỗi do **Exception Filter** xử lý.

## 2. DI (Dependency Injection) trong NestJS là gì?

**Dependency Injection (DI)** là pattern NestJS dùng để **tự động cung cấp dependency** cho class thay vì class tự `new` object.

```typescript
@Injectable()
export class UserService {
  findAll() { return ['user1', 'user2']; }
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {} // Nest tự inject

  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
```

**Cách hoạt động:**

1. Class đánh dấu `@Injectable()` → đăng ký là **provider**
2. Khai báo trong `providers` của **Module**
3. Nest **IoC Container** tạo instance và **inject qua constructor**

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService], // đăng ký provider
})
export class UserModule {}
```

**Lợi ích:**

- **Loose coupling** — Controller không phụ thuộc cách tạo Service
- **Dễ test** — mock dependency khi unit test
- **Quản lý vòng đời** — Nest kiểm soát singleton, scope

**Provider scope:**

| Scope | Mô tả |
|-------|--------|
| **DEFAULT (Singleton)** | Một instance dùng chung toàn app |
| **REQUEST** | Một instance mới mỗi request |
| **TRANSIENT** | Một instance mới mỗi lần inject |

**Custom provider** — khi cần inject interface hoặc config:

```typescript
providers: [
  { provide: 'CONFIG', useValue: { dbHost: 'localhost' } },
  { provide: UserRepository, useClass: PostgresUserRepository },
]
```

> **DI trong NestJS** = IoC Container tự tạo và inject dependency qua **constructor**, giúp code **tách biệt, dễ test, dễ thay thế implementation**.

## 3. NestJS sử dụng các pattern gì để phát triển?

NestJS được xây dựa trên nhiều design pattern, kết hợp ý tưởng từ **Angular** và các framework enterprise.

| Pattern | Trong NestJS |
|---------|--------------|
| **Dependency Injection (DI)** | IoC Container inject dependency qua constructor — `@Injectable()`, `providers` |
| **Inversion of Control (IoC)** | Nest quản lý việc tạo object, dev chỉ khai báo cần gì |
| **Module** | `@Module()` gom Controller, Service, Provider thành khối tái sử dụng |
| **MVC / Layered** | **Controller** (nhận request) → **Service** (business logic) → **Repository/Entity** (data) |
| **Decorator** | `@Controller()`, `@Get()`, `@Injectable()` — metadata mô tả hành vi class/method |
| **Middleware** | Xử lý cross-cutting concern trước route — logging, auth cơ bản |
| **Guard** | Kiểm tra quyền truy cập trước handler — tương tự **Chain of Responsibility** |
| **Interceptor** | Bọc request/response — gần với **AOP** (Aspect-Oriented Programming): log, transform, cache |
| **Pipe** | Validate/transform input trước khi vào controller |
| **Exception Filter** | Bắt và xử lý lỗi tập trung — format response lỗi thống nhất |
| **Repository** | Tách logic truy vấn DB ra khỏi Service (thường dùng với TypeORM/Prisma) |
| **Factory** | Custom provider `useFactory` — tạo instance phức tạp (kết nối DB, config động) |
| **Singleton** | Provider mặc định — một instance dùng chung toàn app |
| **Strategy** | Swap implementation qua DI — `useClass` / interface (vd: `PostgresRepo` vs `MongoRepo`) |
| **Observer / Event-driven** | `@nestjs/event-emitter` — publish/subscribe giữa các module |

**Kiến trúc thư mục thường gặp:**

```
src/
  users/
    users.module.ts
    users.controller.ts   ← presentation layer
    users.service.ts      ← business logic
    users.repository.ts ← data access (optional)
    dto/
    entities/
```

**Luồng phát triển điển hình:**

```
Module → Controller → Service → Repository/DB
         ↑ Guard, Pipe, Interceptor bọc quanh Controller
```

> NestJS khuyến khích **modular + layered architecture**: tách route, logic, data; dùng **DI** để ghép các lớp; dùng **Guard/Pipe/Interceptor/Filter** cho các concern chung thay vì nhét vào controller.

## 4. Circular Module trong NestJS — cách xử lý và phòng tránh

**Circular dependency** xảy ra khi **Module/Service A phụ thuộc B, đồng thời B phụ thuộc A** — Nest không resolve được thứ tự khởi tạo.

```typescript
// ❌ UsersModule import OrdersModule, OrdersModule import UsersModule
@Module({ imports: [forwardRef(() => OrdersModule)], ... })
export class UsersModule {}

@Module({ imports: [forwardRef(() => UsersModule)], ... })
export class OrdersModule {}
```

**Triệu chứng:** lỗi `UndefinedModuleException`, `Nest cannot create the module`, hoặc dependency `undefined` lúc runtime.

### Cách xử lý khi đã gặp

**1. `forwardRef()`** — giải quyết nhanh, dùng khi hai module/service thật sự cần nhau:

```typescript
// Module level
@Module({ imports: [forwardRef(() => OrdersModule)] })
export class UsersModule {}

// Provider level
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}
}
```

`forwardRef` trì hoãn resolve reference đến khi cả hai đã được đăng ký.

**2. Tách Shared Module** — cách **nên dùng** hơn:

```typescript
// common.module.ts — chứa logic/service dùng chung
@Module({ providers: [SharedService], exports: [SharedService] })
export class CommonModule {}

@Module({ imports: [CommonModule] }) export class UsersModule {}
@Module({ imports: [CommonModule] }) export class OrdersModule {}
```

**3. Event-driven** — tránh gọi trực tiếp qua lại:

```typescript
// UsersService emit event → OrdersService lắng nghe, không inject nhau
this.eventEmitter.emit('user.created', { userId });
```

### Cách phòng tránh

| Nguyên tắc | Mô tả |
|------------|--------|
| **Luồng phụ thuộc một chiều** | Module tầng trên import tầng dưới — `Controller → Service → Repository`, không import ngược |
| **Tách shared logic** | Code dùng chung → `CommonModule` / `SharedModule`, không để 2 module import lẫn nhau |
| **Chia theo domain rõ** | Mỗi module một bounded context — `Users`, `Orders`, `Payments` độc lập |
| **Tránh service inject 2 chiều** | A gọi B **hoặc** B gọi A — không cả hai; dùng event hoặc module trung gian |
| **Facade pattern** | Một service orchestrate nhiều service khác thay vì chúng gọi lẫn nhau |

```
❌ UsersService ↔ OrdersService (2 chiều)
✅ UsersService → OrdersService (1 chiều)
✅ AppFacade → UsersService + OrdersService
✅ UsersService → emit event → OrdersService
```

> **`forwardRef()`** là fix tạm khi bắt buộc; cách tốt là **thiết kế module một chiều**, tách **SharedModule**, hoặc dùng **event** để giảm coupling.

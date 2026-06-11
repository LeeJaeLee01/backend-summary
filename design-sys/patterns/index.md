## 3. NestJS sử dụng các pattern gì để phát triển?

NestJS được xây dựa trên nhiều design pattern, kết hợp ý tưởng từ **Angular** và các framework enterprise.

| Pattern | Trong NestJS |
|---------|--------------|
| **Dependency Injection (DI)** | IoC Container inject dependency qua constructor — `@Injectable()`, `providers` |
| **Inversion of Control (IoC)** | Nest quản lý việc tạo object, dev chỉ khai báo cần gì |
| **Module** | `@Module()` gom Controller, Service, Provider thành khối tái sử dụng |
| **MVC / Layered** | **Controller** (nhận request) → **Service** (business logic) → **Repository/Entity** (data) |
| **Decorator** | `@Controller()`, `@Get()`, `@Injectable()` — metadata; Interceptor bọc request — xem [decorator.md](./decorator.md) |
| **Middleware** | Xử lý cross-cutting concern trước route — logging, auth cơ bản |
| **Guard** | Kiểm tra quyền truy cập trước handler — tương tự **Chain of Responsibility** |
| **Interceptor** | Bọc request/response — gần với **AOP** (Aspect-Oriented Programming): log, transform, cache |
| **Pipe** | Validate/transform input trước khi vào controller |
| **Exception Filter** | Bắt và xử lý lỗi tập trung — format response lỗi thống nhất |
| **Repository** | Tách logic truy vấn DB ra khỏi Service (thường dùng với TypeORM/Prisma) — xem [repository.md](./repository.md) |
| **Factory** | Custom provider `useFactory` — tạo instance phức tạp (kết nối DB, config động) — xem [factory.md](./factory.md) |
| **Singleton** | Provider mặc định — một instance dùng chung toàn app — xem [singleton.md](./singleton.md) |
| **Strategy** | Swap implementation qua DI — `useClass` / interface (vd: `PostgresRepo` vs `MongoRepo`) |
| **Observer / Event-driven** | `@nestjs/event-emitter` — publish/subscribe giữa các module — xem [observer.md](./observer.md) |
# OOP, SOLID, Design Pattern & Clean Code

## Tóm tắt một câu

**OOP** gom data + hành vi (encapsulation, inheritance, polymorphism). **SOLID** nguyên tắc thiết kế class/module. **Design pattern** giải pháp tái sử dụng cho bài toán lặp. **Clean code** code dễ đọc, dễ test, ít surprise.

---

## OOP (tóm tắt)

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **Encapsulation** | Ẩn state, expose qua method |
| **Inheritance** | Kế thừa — dùng hạn chế, ưu tiên composition |
| **Polymorphism** | Interface — nhiều implementation |

**Go:** không class inheritance — dùng **struct + interface** (composition over inheritance).

```go
type Reader interface { Read(p []byte) (n int, err error) }
```

---

## SOLID

| Chữ | Nguyên tắc | Ý nghĩa |
|-----|------------|---------|
| **S** | Single Responsibility | Một module một lý do thay đổi |
| **O** | Open/Closed | Mở rộng bằng interface, không sửa code cũ |
| **L** | Liskov Substitution | Implementation thay thế được qua interface |
| **I** | Interface Segregation | Interface nhỏ, không ép implement thừa |
| **D** | Dependency Inversion | Phụ thuộc abstraction, inject dependency |

**Go ví dụ:** `OrderService` nhận `PaymentGateway` interface — test mock, đổi Stripe → PayPal không sửa service.

---

## Design pattern (backend hay gặp)

| Pattern | Dùng khi |
|---------|----------|
| **Repository** | Tách business logic khỏi DB access |
| **Factory** | Tạo object phức tạp (connector theo config) |
| **Strategy** | Đổi algorithm runtime (pricing rule) |
| **Observer / Pub-Sub** | Event-driven giữa module |
| **Singleton** | Một instance (DB pool — `sync.Once`) |
| **Decorator / Middleware** | Chain HTTP handler (auth, log) |
| **Circuit Breaker** | Chống cascade khi downstream fail |
| **Retry + Backoff** | Gọi API không ổn định |

---

## Clean code (nguyên tắc)

| Nguyên tắc | Ví dụ |
|------------|-------|
| Tên rõ nghĩa | `GetUserByID` không `GetData` |
| Function ngắn | Một việc, < ~30 dòng lý tưởng |
| Ít nested | Early return thay if lồng 4 tầng |
| DRY có chừng | Không abstract sớm |
| Error là value | Go: return `error`, wrap context |
| Testable | Inject dependency, tránh global state |

---

## Câu trả lời ngắn (phỏng vấn)

Go: composition + interface thay inheritance. SOLID — module nhỏ, interface inject, mở rộng không sửa cũ. Pattern backend: Repository, Middleware, Circuit Breaker. Clean code: tên rõ, function ngắn, error handle, test được.

# SOLID — Interview (1 overview question)

## Question

**Q1.** What is SOLID? Explain each principle (S, O, L, I, D), why they matter in OOP design, and give a short example (or a violation signal) for each one.

---

## Trả lời (tiếng Việt)

**SOLID** là bộ **năm nguyên tắc thiết kế hướng đối tượng** (OOP). Mục tiêu chung: code **dễ bảo trì**, **dễ mở rộng**, **ít coupling**, **ít code smell** khi hệ thống lớn dần.

### S — Single Responsibility Principle (SRP)

**Một lớp / module chỉ nên có một lý do để thay đổi** — tức **một trách nhiệm rõ ràng**.

- **Ví dụ đúng:** `OrderService` chỉ xử lý logic đơn hàng; `EmailService` chỉ gửi email.
- **Vi phạm:** Một class vừa tính tiền đơn hàng, vừa gửi mail, vừa ghi log DB — sửa email là đụng class đó, sửa tính tiền cũng đụng class đó.

### O — Open/Closed Principle (OCP)

**Đóng với chỉnh sửa, mở với mở rộng.** Thêm tính năng bằng **mở rộng** (interface, kế thừa, strategy), không **sửa trực tiếp** code cũ đang chạy ổn.

- **Ví dụ đúng:** Thêm `PayPalPayment` implement `Payment` — không sửa `checkout()` cũ.
- **Vi phạm:** Mỗi lần có cổng thanh toán mới lại `if/else` hoặc `switch` trong một hàm khổng lồ.

### L — Liskov Substitution Principle (LSP)

**Lớp con phải thay thế được lớp cha** mà **không phá vỡ** hành vi client đang kỳ vọng.

- **Ví dụ đúng:** `Dog extends Animal` — chỗ nào dùng `Animal` gọi `move()` thì `Dog` vẫn hợp lệ.
- **Vi phạm:** `Square extends Rectangle` nhưng set width/height độc lập làm mất invariant hình chữ nhật — client dùng `Rectangle` sẽ sai.

### I — Interface Segregation Principle (ISP)

**Không ép client phụ thuộc interface quá to** mà họ không dùng hết. **Tách interface nhỏ**, client chỉ implement phần cần.

- **Ví dụ đúng:** `Printer` và `Scanner` tách riêng thay vì một `MultiFunctionDevice` bắt mọi class phải implement cả in lẫn scan.
- **Vi phạm:** Class chỉ in ảnh nhưng bị bắt implement `scan()` và `fax()` rỗng hoặc ném `NotImplemented`.

### D — Dependency Inversion Principle (DIP)

**Module cấp cao không phụ thuộc trực tiếp chi tiết cấp thấp**; cả hai phụ thuộc **abstraction** (interface). Thường kết hợp **dependency injection**.

- **Ví dụ đúng:** `OrderService` nhận `PaymentGateway` (interface), không `new StripeClient()` cứng trong class.
- **Vi phạm:** Service gắn chặt MySQL driver / SDK cụ thể — đổi DB hoặc mock test rất khó.

### Tóm lại (một câu)

SOLID giúp thiết kế **gọn trách nhiệm** (S), **nối thêm tính năng an toàn** (O), **thay subclass không gãy logic** (L), **interface vừa đủ** (I), và **phụ thuộc abstraction thay vì concrete** (D).

---

## en-sub

SOLID is a set of five object-oriented design principles (OOP). The overall goal is code that is easier to maintain, easier to extend,
less coupled, and less prone to code smells as the system grows. (The overall goal is code that has better maintainability, better extensibility, lower coupling, and fewer code smells as the system grows.)

### S — Single Responsibility Principle (SRP)

A class/module should have only one reason to change — that means **one clear responsibility**.

- **Good example:** `OrderService` only handles order logic; `EmailService` only sends email

- **Violation**: On class handles billing, sending email and writing logs to the database -- changing email logic touches that class, and changing billing also touches thast class

### O — Open/Closed Principle (OCP)

**Closed for modification, open for extension** add feature by extending (interface, inheritence, stategy), not directly change stable, working code.

- **Good example:** add `PayPalPayment` implement `Payment` - without changing the existing `checkout()` method

- **Violation**: Every time you add a new payment gateway, you must add another `if/else` or `switch` branch inside one giant function.

### L — Liskov Substitution Principle (LSP)

**Subclass must be substitutable for its parent class** without breaking the behavior expected by clients

- **Good example:** `Dog extends Animal` anywhere code uses `Animal` and calls `move()`, `Dog` still behaves correctly 

- **Violation**: `Square extends Rectangle` but setting width/height independently breaks the rectangle invariant - clients that `use Rectangle` will get wrong behaivior. 

**Don't force client to depend on a large interface** they don't fully use. **Split into smaller interfaces**, clients only implement what they need.

- **Good example:** Keep `Printer` and `Scanner` separate instead of one `MultiFunctionDevice` that forces every class to implement both print and scan

- **Violation**: A class that only prints images is forced to implement empty `scan()` and `fax()` methods or throw `NotImplemented`

### D — Dependency Inversion Principle (DIP)

**Module cấp cao không phụ thuộc trực tiếp chi tiết cấp thấp**; cả hai phụ thuộc **abstraction** (interface). Thường kết hợp **dependency injection**.

- **Ví dụ đúng:** `OrderService` nhận `PaymentGateway` (interface), không `new StripeClient()` cứng trong class.

- **Vi phạm:** Service gắn chặt MySQL driver / SDK cụ thể — đổi DB hoặc mock test rất khó.

High-level modules shouldn't depend directly on low-level details; both should depend on abstractions (interfaces), this if often combined with **dependency injection**

- **Good example:** `OrderService` receives a `PaymentGateway` (interface), instead of hard-coding `new StripeClient()` inside the class.

- **Violation**: The services is tightly coupled to a specific MySQL driver/SDK - switching databases or mocking for tests becomes very difficult.

Note: 

is + tính từ → is easier, is maintainable
has + danh từ → has lower coupling, has fewer smells
with: với / có
without: không có / mà không
within: trong (phạm vi)
force = ép / bắt buộc
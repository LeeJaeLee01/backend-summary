# What is SOLID

**Trả lời (tiếng Việt):**

**SOLID** là tập **năm nguyên tắc thiết kế hướng đối tượng** (OOP), giúp code **dễ bảo trì**, **dễ mở rộng**, **ít coupling** và **tránh smell** khi hệ thống lớn dần. Các chữ cái là viết tắt của:

- **S — Single Responsibility Principle (SRP):** Một lớp / module chỉ nên có **một lý do để thay đổi**, tức **một trách nhiệm rõ ràng**. Ví dụ: tách lớp gửi email khỏi lớp tính toán đơn hàng.

- **O — Open/Closed Principle (OCP):** Đóng với **chỉnh sửa**, mở với **mở rộng**. Nên thêm tính năng bằng cách **mở rộng** (interface, kế thừa, strategy) thay vì **sửa trực tiếp** code cũ đang chạy ổn.

- **L — Liskov Substitution Principle (LSP):** Lớp con phải **thay thế được** lớp cha mà **không phá vỡ** hành vi mà code client đang kỳ vọng. Nếu thay subclass mà logic sai lệch → vi phạm LSP.

- **I — Interface Segregation Principle (ISP):** Không ép client phụ thuộc vào **interface quá to** mà họ không dùng hết. Nên **tách interface nhỏ**, client chỉ implement phần cần.

- **D — Dependency Inversion Principle (DIP):** Module cấp cao **không phụ thuộc trực tiếp** chi tiết cấp thấp; cả hai phụ thuộc **abstraction** (interface). Thường đi cùng **dependency injection**.

**Tóm lại:** SOLID giúp thiết kế class/module **gọn trách nhiệm**, **dễ nối thêm tính năng**, **thay thế implementation an toàn**, **interface vừa đủ**, và **phụ thuộc vào abstraction** thay vì concrete cố định.

**en-sub:**

SOLID is a set of five object-oriented design principles. They help make code easier to maintain, easier to scale, lower coupling, and reduce code smell as the system grows:
- **S - Single responsibility princible (SRP):** a class/module should have only one reason to change, it means: a single and clear reponsibility. Exam: keep email sending separate from order calculation by spliting them into different classes
- **O — Open/Closed Principle (OCP):** Should be open for extension but closed for modification. You should add new behaivor by extending the design (for example through interfaces, inheritance, or stategy pattern) instead of changing stable, working code directly
- **L — Liskov Substitution Principle (LSP):** Subclasses must be able to replace the parent class without break down behaivor that client code expects. if changing sublass breaks the logic then it violates LSP
- **I — Interface Segregation Principle (ISP):** Clients should not be fouced to denpend on large interfaces the do not use. Prefer small, focused interfaces so each client implements only what it needs
- **D — Dependency Inversion Principle (DIP):** high level module should not depend directly on low level implement details, both depend on **abstraction** (interface). Typically achieved dependency injection
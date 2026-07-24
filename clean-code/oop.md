# OOP

## 1. Bốn tính chất của OOP

OOP (Object-Oriented Programming) có **4 tính chất cốt lõi**:


| Tính chất      | Tiếng Anh     | Ý nghĩa                                                   |
| -------------- | ------------- | --------------------------------------------------------- |
| **Đóng gói**   | Encapsulation | Ẩn dữ liệu bên trong object, chỉ expose qua method public |
| **Kế thừa**    | Inheritance   | Class con nhận thuộc tính/hành vi từ class cha            |
| **Đa hình**    | Polymorphism  | Cùng interface/method, hành vi khác nhau tùy object       |
| **Trừu tượng** | Abstraction   | Ẩn chi tiết phức tạp, chỉ hiện chức năng cần thiết        |


### 1. Đóng gói (Encapsulation)

Gom **data + method** liên quan vào một class, **che giấu** dữ liệu nội bộ (`private`/`protected`), chỉ cho phép truy cập qua getter/setter hoặc method public.

```typescript
class BankAccount {
  private balance = 0;

  deposit(amount: number) {
    if (amount > 0) this.balance += amount;
  }

  getBalance() {
    return this.balance;
  }
}
```

> Bảo vệ dữ liệu, kiểm soát cách object bị thay đổi từ bên ngoài.

### 2. Kế thừa (Inheritance)

Class con **extends** class cha — tái sử dụng code, mở rộng hoặc ghi đè hành vi.

```typescript
class Animal {
  move() { console.log('moving'); }
}

class Dog extends Animal {
  bark() { console.log('woof'); }
}
```

> Tránh lặp code, tạo hierarchy có cấu trúc. Lưu ý: không lạm dụng — ưu tiên composition khi có thể.

### 3. Đa hình (Polymorphism)

Cùng một **method/interface**, mỗi class con **triển khai khác nhau** — runtime gọi đúng implementation.

```typescript
interface Payment {
  pay(amount: number): void;
}

class CreditCard implements Payment {
  pay(amount: number) { /* charge card */ }
}

class PayPal implements Payment {
  pay(amount: number) { /* paypal API */ }
}

function checkout(payment: Payment, amount: number) {
  payment.pay(amount); // gọi đúng method của từng loại
}
```

**Phân biệt ghi đè (Override) và nạp chồng (Overload):**


|                       | **Ghi đè (Override)**                       | **Nạp chồng (Overload)**                        |
| --------------------- | ------------------------------------------- | ----------------------------------------------- |
| **Xảy ra ở**          | Quan hệ **kế thừa** — class con ↔ class cha | **Cùng một class** — nhiều method cùng tên      |
| **Chữ ký method**     | **Giống hệt** tên + tham số                 | **Cùng tên**, **khác tham số** (số lượng/kiểu)  |
| **Mục đích**          | Class con **thay đổi hành vi** method cha   | Một tên method, **xử lý nhiều kiểu input**      |
| **Thời điểm**         | **Runtime** — gọi method của object thực tế | **Compile-time** — compiler chọn method phù hợp |
| **Liên quan đa hình** | **Đa hình runtime** (subtype polymorphism)  | **Đa hình compile-time**                        |


**Ghi đè (Override):**

```typescript
class Animal {
  speak() { return '...'; }
}

class Dog extends Animal {
  speak() { return 'woof'; } // ghi đè method cha
}

const animal: Animal = new Dog();
animal.speak(); // 'woof' — runtime gọi method của Dog
```

**Nạp chồng (Overload)** — ví dụ Java/C#:

```java
class Calculator {
  int add(int a, int b) { return a + b; }
  int add(int a, int b, int c) { return a + b + c; } // cùng tên, khác tham số
  double add(double a, double b) { return a + b; }
}
```

**Lưu ý TypeScript/JavaScript:** JS **không hỗ trợ** overload thật ở runtime — TS chỉ khai báo nhiều signature, body vẫn **một hàm**:

```typescript
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  return String(value); // một implementation duy nhất
}
```

> **Override** = class con sửa method cha (cùng chữ ký). **Overload** = nhiều method cùng tên, khác tham số trong một class. Đa hình OOP thường nhắc đến **override**.

### 4. Trừu tượng (Abstraction)

Định nghĩa **khung chung** (abstract class / interface) — ẩn chi tiết triển khai, chỉ quan tâm **làm gì**, không quan tâm **làm thế nào**.

```typescript
abstract class Notification {
  abstract send(message: string): void; // bắt buộc class con implement

  log(message: string) {
    console.log(`Sending: ${message}`);
  }
}
```

**Phân biệt `interface` và `abstract class`:**


|                    | **Interface**                                                  | **Abstract class**                                                          |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Bản chất**       | **Hợp đồng** — khai báo method/property class phải có          | **Class không hoàn chỉnh** — vừa có method trừu tượng, vừa có code thực thi |
| **Implementation** | **Không** chứa body method (TS: trừ default trong một số case) | Có thể có **method đã implement sẵn**                                       |
| **Kế thừa**        | Class **implements** nhiều interface                           | Class **extends** một abstract class (single inheritance)                   |
| **Constructor**    | **Không có**                                                   | **Có** constructor                                                          |
| **Biến/field**     | Chỉ khai báo kiểu (TS) — không khởi tạo state                  | Có thể có **property, state**                                               |
| **Khi nào dùng**   | Định nghĩa **capability** — `Flyable`, `Payable`               | Chia sẻ **logic chung** + bắt buộc override phần riêng                      |


**Interface:**

```typescript
interface Flyable {
  fly(): void;
}

class Bird implements Flyable {
  fly() { console.log('flying'); }
}

class Plane implements Flyable {
  fly() { console.log('engine on'); }
}
```

**Abstract class:**

```typescript
abstract class Animal {
  constructor(protected name: string) {}

  abstract makeSound(): void; // bắt buộc override

  introduce() { // logic chung, không cần override
    console.log(`I am ${this.name}`);
  }
}

class Dog extends Animal {
  makeSound() { console.log('woof'); }
}
```

**Chọn cái nào?**

- Dùng **interface** khi chỉ cần định nghĩa **hành vi** — linh hoạt, implement nhiều interface.
- Dùng **abstract class** khi có **code dùng chung** cần tái sử dụng qua kế thừa.

> **Interface** = "làm được gì". **Abstract class** = "làm được gì" + "một phần đã làm sẵn".

> **Tóm lại**: **Đóng gói** bảo vệ data, **Kế thừa** tái sử dụng code, **Đa hình** linh hoạt runtime, **Trừu tượng** ẩn chi tiết — 4 trụ cột của OOP.

## 2. Từ khóa `this` và `super`


|                | `**this`**                                      | `**super`**                             |
| -------------- | ----------------------------------------------- | --------------------------------------- |
| **Ý nghĩa**    | Tham chiếu tới **object hiện tại**              | Tham chiếu tới **class cha**            |
| **Dùng ở đâu** | Trong method, constructor, property của class   | Trong class con (`extends`)             |
| **Mục đích**   | Truy cập field/method của **chính instance đó** | Gọi constructor hoặc method **của cha** |


### `this`

Trỏ tới **instance đang thực thi** — dùng để gọi method, truy cập property trong cùng class.

```typescript
class User {
  constructor(private name: string) {}

  greet() {
    return `Hello, ${this.name}`; // this = instance User hiện tại
  }

  setName(name: string) {
    this.name = name;
  }
}
```

**Lưu ý JavaScript/TypeScript:**

- **Arrow function** không có `this` riêng — kế thừa `this` từ scope bên ngoài (lexical `this`).
- **Function thường** — `this` phụ thuộc **cách gọi** (object gọi, `call`, `bind`...).

```typescript
class Counter {
  count = 0;

  increment = () => {
    this.count++; // arrow giữ đúng this của class
  };
}
```

### `super`

Chỉ dùng trong class **có kế thừa** — gọi constructor hoặc method của class cha.

```typescript
class Animal {
  constructor(protected name: string) {}

  speak() {
    return '...';
  }
}

class Dog extends Animal {
  constructor(name: string, private breed: string) {
    super(name); // bắt buộc gọi constructor cha trước khi dùng this
  }

  speak() {
    return super.speak() + ' woof'; // gọi method cha, rồi mở rộng
  }
}
```

**Quy tắc quan trọng:**

- Trong constructor class con — **phải gọi `super()`** trước khi dùng `this`.
- `super.method()` thường dùng khi **ghi đè (override)** nhưng vẫn muốn giữ logic cha.

> `**this`** = "chính tôi" (instance hiện tại). `**super`** = "cha tôi" (class cha) — dùng khi kế thừa.

## 3. Interview Questions (Easy → Hard)

Trả lời bằng **tiếng Anh**. Dưới mỗi câu có **ý chính (tiếng Việt)** — dùng làm outline, tự viết thành câu hoàn chỉnh.

### Easy

**Q1.** What is Object-Oriented Programming (OOP)?

> **Ý chính:**
>
> - Paradigm lập trình dựa trên **object** (data + behavior)
> - Tổ chức code quanh **class / object**, không chỉ function thuần
> - Mục tiêu: tái sử dụng, mở rộng, bảo trì dễ hơn
> - Dựa trên 4 trụ cột: encapsulation, inheritance, polymorphism, abstraction
>
> **Your answer:**

OOP is a programming paradigm based on objects (data + behavior). It organizes code around classes and objects rather than standalone functions. The goals are reuse, extensibility, and easier maintenance, based on four pillars: encapsulation, inheritance, polymorphism, and abstraction. 

**Q2.** What are the four main principles of OOP? Briefly explain each one.

> **Your answer:**

The four main principles are encapsulation, inheritance, polymorphism, and abstraction.

- **Encapsulation** groups related data and methods in a class, hides internal details, and exposes them through a public API.
- **Inheritance** lets a child class reuse and extend attributes and behavior from a parent class.
- **Polymorphism** means the same interface can behave differently depending on the actual object.
- **Abstraction** hides implementation details and only shows what something does, not how it does it.

**Q3.** What is a class? What is an object? How are they related?

> **Ý chính:**
>
> - **Class** = blueprint / template (định nghĩa structure + behavior)
> - **Object** = instance cụ thể tạo từ class (có state riêng)
> - Quan hệ: class → nhiều object; object thuộc về một class
> - Ví dụ ngắn: `class User` → `new User('Alice')`
>
> **Your answer:**

- A **class** is a blueprint/template that defines structure and behavior.
- An **object** is a concrete instance created from a class (with its own state).
- Relationship: one class → many objects; each object belongs to a class.
- Example: `class User` → `new User('Alice')`.

A **class** is a blueprint that defines the structure and behavior of something. An **object** is a concrete instance created from that class, with its own state. One class can create many objects, and each object belongs to that class. For example, `class User` → `new User('Alice')`.

**Q4.** What is **Encapsulation** (đóng gói)? Why is it useful?

> **Ý chính:**
>
> - Gom data + method liên quan vào class
> - Ẩn field (`private`), chỉ truy cập qua method/getter có kiểm soát
> - **Lợi ích:** bảo vệ invariant(bất biến), giảm coupling, dễ thay đổi nội bộ mà không phá caller
> - Ví dụ: `BankAccount` — không set `balance` trực tiếp, dùng `deposit`
>
> **Your answer:**

- Groups related data and methods into a class.
- Hides fields (`private`); access only through controlled methods/getters.
- **Useful:** protects invariants, reduces coupling, and lets you change internals without breaking callers.
- Example: `BankAccount` — don't set `balance` directly; use `deposit`.

**Q5.** What is the difference between `public`, `private`, and `protected`?

> **Ý chính:**
>
> - **public** — ai cũng truy cập được
> - **private** — chỉ trong class đó
> - **protected** — class đó + class con (subclass)
> - Chọn theo nguyên tắc: expose tối thiểu cần thiết
>
> **Your answer:**

- **public** — accessible from anywhere
- **private** — accessible only inside that class
- **protected** — accessible inside that class and its subclasses
- Choose by the rule: expose the minimum necessary

**Q6.** What is inheritance? Give a simple real-world example.

> **Ý chính:**
>
> - Class con **extends** class cha → tái sử dụng + mở rộng
> - Quan hệ **"is-a"** (Dog is an Animal)
> - Ví dụ: `Animal` → `Dog` / `Cat`; hoặc `Employee` → `Manager`
> - Lưu ý: không lạm dụng — ưu tiên composition khi quan hệ không phải is-a
>
> **Your answer:**

- A subclass **extends** a parent class → reuse + extend behavior
- Relationship: **"is-a"** (Dog is an Animal)
- Examples: `Animal` → `Dog` / `Cat`; or `Employee` → `Manager`
- Note: don't overuse inheritance — prefer **composition** when the relationship is not is-a

**Q7.** What do `this` and `super` mean in a class?

> **Ý chính:**
>
> - `**this`** — tham chiếu instance hiện tại (field/method của chính object)
> - `**super`** — tham chiếu class cha (gọi constructor/method cha)
> - Constructor con: phải `super(...)` trước khi dùng `this`
> - Override: `super.method()` giữ logic cha rồi mở rộng
>
> **Your answer:**

- `**this`** — reference to the current instance (its own fields/methods)
- `**super`** — reference to the parent class (call parent constructor/methods)
- In a child constructor: call `super(...)` before using `this`
- When overriding: use `super.method()` to keep the parent logic, then extend it

**Q8.** What is a constructor? When is it called?

> **Ý chính:**
>
> - Method đặc biệt khởi tạo object (set initial state)
> - Gọi **một lần** khi `new Class(...)`
> - Có thể overload (nhiều chữ ký) tùy ngôn ngữ
> - Class con thường gọi `super(...)` để init phần cha
>
> **Your answer:**

- A special method that initializes an object (sets its initial state)
- Called **once** when you use `new Class(...)`
- Can be overloaded (multiple signatures), depending on the language
- A child class usually calls `super(...)` to initialize the parent part

### Medium

**Q9.** What is polymorphism? Explain with an example.

> **Ý chính:**
>
> - Cùng type/interface, hành vi khác nhau tùy object thật
> - Thường qua override / implement interface
> - Ví dụ: `Payment.pay()` — CreditCard vs PayPal
> - Caller gọi qua abstraction, không cần biết concrete type
>
> **Your answer:**

**Q10.** What is the difference between method overriding and method overloading?

> **Ý chính:**
>
> - **Override:** class con ghi đè method cha — **cùng chữ ký**, runtime
> - **Overload:** cùng class, **cùng tên, khác tham số** — compile-time
> - Override → subtype polymorphism; Overload → chọn method theo signature
> - TS/JS: overload thật hạn chế (thường một body)
>
> **Your answer:**

**Q11.** What is abstraction? How is it different from encapsulation?

> **Ý chính:**
>
> - **Abstraction** — ẩn complexity, chỉ expose "làm gì" (interface/abstract)
> - **Encapsulation** — ẩn & bảo vệ data/implementation bên trong object
> - Abstraction = mức thiết kế / contract; Encapsulation = cơ chế bảo vệ chi tiết
> - Thường đi cùng nhau nhưng không giống nhau
>
> **Your answer:**

**Q12.** What is the difference between an interface and an abstract class? When would you use each?

> **Ý chính:**
>
> - **Interface** = contract thuần (capability), implement nhiều cái được
> - **Abstract class** = khung + có thể có code/state chung, thường single inheritance
> - Dùng interface khi chỉ cần hành vi; abstract khi cần share logic
> - Interface linh hoạt hơn; abstract giảm lặp code cha–con
>
> **Your answer:**

**Q13.** What is the difference between composition and inheritance? Which one do you prefer and why?

> **Ý chính:**
>
> - **Inheritance** = is-a (kế thừa hierarchy)
> - **Composition** = has-a (object chứa object khác)
> - Composition linh hoạt hơn, giảm coupling hierarchy sâu
> - Prefer composition by default; inheritance khi quan hệ is-a rõ + ổn định
>
> **Your answer:**

**Q14.** What is coupling and cohesion in OOP? Why do they matter?

> **Ý chính:**
>
> - **Coupling** — mức phụ thuộc giữa module/class (thấp = tốt)
> - **Cohesion** — mức liên quan của thành phần trong một class (cao = tốt)
> - Mục tiêu: **low coupling, high cohesion**
> - Giúp test dễ, thay đổi ít ripple, code rõ trách nhiệm
>
> **Your answer:**

**Q15.** Can you explain the SOLID principles? Give a short explanation of each.

> **Ý chính:**
>
> - **S** — Single Responsibility: một class một lý do thay đổi
> - **O** — Open/Closed: mở để mở rộng, đóng để sửa
> - **L** — Liskov Substitution: subclass thay thế base an toàn
> - **I** — Interface Segregation: interface nhỏ, không ép method thừa
> - **D** — Dependency Inversion: phụ thuộc abstraction, không concrete
>
> **Your answer:**

**Q16.** What is the Liskov Substitution Principle (LSP)? Give an example of a violation.

> **Ý chính:**
>
> - Object subclass phải thay thế được base type mà không phá kỳ vọng
> - Vi phạm classic: `Square extends Rectangle` (set width/height phá invariant)
> - Hoặc subclass throw unexpected / làm yếu pre/post-condition
> - Fix: redesign hierarchy / dùng composition / tách type
>
> **Your answer:**

**Q17.** What is the difference between association, aggregation, and composition?

> **Ý chính:**
>
> - **Association** — quan hệ dùng nhau (A dùng B), lifetime độc lập
> - **Aggregation** — has-a yếu; part có thể sống độc lập (Team–Player)
> - **Composition** — has-a mạnh; part chết theo whole (House–Room)
> - Ownership & lifecycle là điểm phân biệt chính
>
> **Your answer:**

**Q18.** What is multiple inheritance? Does your language support it? How do you work around it if not?

> **Ý chính:**
>
> - Một class kế thừa nhiều class cha cùng lúc
> - Java/C#/TS: **không** MI class; C++ có
> - Workaround: implement nhiều **interface** + composition
> - Tránh Diamond Problem / ambiguity
>
> **Your answer:**

### Hard

**Q19.** Explain runtime polymorphism vs compile-time polymorphism. How does each work under the hood?

> **Ý chính:**
>
> - **Runtime** — override / virtual dispatch; chọn method theo object thật lúc chạy (vtable)
> - **Compile-time** — overload / generics; compiler chọn theo signature
> - Runtime linh hoạt hơn; compile-time sớm, type-safe hơn
> - OOP thường nhấn runtime (subtype polymorphism)
>
> **Your answer:**

**Q20.** What is the Diamond Problem in multiple inheritance? How do languages like Java, C#, or TypeScript avoid it?

> **Ý chính:**
>
> - Hai nhánh cha cùng gốc → class cháu nhận method/field trùng, mơ hồ
> - Java/C#/TS: chỉ kế thừa **một** class → tránh diamond class
> - Cho phép nhiều interface; conflict method phải resolve rõ
> - C++: virtual inheritance để xử lý
>
> **Your answer:**

**Q21.** When would you choose composition over inheritance in a real production system? Walk through a design decision.

> **Ý chính:**
>
> - Khi quan hệ là **has-a / can-do**, không phải is-a ổn định
> - Hierarchy sâu, thay đổi cha phá nhiều con → chọn composition
> - Ví dụ: `Order` có `PaymentProcessor`, `Notifier` — inject behavior
> - Dễ test (mock dependency), mở rộng bằng thêm component
>
> **Your answer:**

**Q22.** How do you design for the Open/Closed Principle without over-engineering?

> **Ý chính:**
>
> - Mở rộng qua interface/plugin/strategy, không sửa core mỗi loại mới
> - Chỉ abstraction hóa **điểm thay đổi thật sự** (thấy pattern lặp)
> - Tránh interface/factory cho mọi thứ sớm (YAGNI)
> - Bắt đầu simple → extract abstraction khi có nhu cầu mở rộng rõ
>
> **Your answer:**

**Q23.** Explain Dependency Inversion. How does it relate to Dependency Injection?

> **Ý chính:**
>
> - **DIP:** high-level không phụ thuộc low-level concrete; cả hai phụ thuộc abstraction
> - **DI:** kỹ thuật inject dependency từ ngoài (constructor/setter)
> - DI giúp **thực thi** DIP (truyền interface implementation)
> - Lợi ích: test dễ, đổi implementation không sửa consumer
>
> **Your answer:**

**Q24.** What are value objects vs entities (from Domain-Driven Design)? How does OOP modeling differ for each?

> **Ý chính:**
>
> - **Entity** — có identity (id); bằng nhau theo id, state có thể đổi
> - **Value Object** — không identity; bằng nhau theo **giá trị**, thường immutable
> - Entity: User, Order; Value Object: Money, Email, Address
> - Model VO bằng equality theo field; Entity bằng id
>
> **Your answer:**

**Q25.** How would you model a payment system (credit card, PayPal, bank transfer) using OOP? Discuss trade-offs of your design.

> **Ý chính:**
>
> - `PaymentMethod` / `PaymentGateway` interface + `pay()` / `refund()`
> - Concrete: CreditCard, PayPal, BankTransfer
> - Service checkout phụ thuộc interface (DIP + Strategy)
> - Trade-off: thêm abstraction vs complexity; shared logic có thể abstract base hoặc helper
>
> **Your answer:**

**Q26.** What is the Law of Demeter (principle of least knowledge)? Why can "train wreck" method chains be a smell?

> **Ý chính:**
>
> - Object chỉ nói chuyện với "bạn gần" (friends), không đào sâu chain
> - Smell: `a.getB().getC().do()` — coupling chặt, biết cấu trúc nội bộ
> - Phá encapsulation; thay đổi middle object dễ vỡ caller
> - Fix: Tell, Don't Ask — method trên object gần hơn làm việc đó
>
> **Your answer:**

**Q27.** How do immutability and OOP work together? When would you prefer immutable objects?

> **Ý chính:**
>
> - Object không đổi state sau tạo; thay đổi = tạo bản mới
> - Kết hợp tốt với Value Object, thread-safety, dễ suy luận
> - Prefer khi: shared data, concurrent, domain value (Money, DateRange)
> - Trade-off: nhiều allocation; entity dài đời vẫn có thể mutable có kiểm soát
>
> **Your answer:**

**Q28.** In TypeScript/JavaScript, how does `this` binding differ between regular methods and arrow functions? How does that affect OOP design?

> **Ý chính:**
>
> - Method thường: `this` phụ thuộc **cách gọi** (có thể mất khi pass callback)
> - Arrow: `this` lexical — giữ `this` của class/scope ngoài
> - Callback/event handler: arrow hoặc `.bind` để không mất context
> - Arrow trên class field không nằm prototype (memory/inheritance trade-off)
>
> **Your answer:**

**Q29.** How would you refactor a large "God class" that violates Single Responsibility? Describe your approach step by step.

> **Ý chính:**
>
> - Xác định nhiều lý do thay đổi / nhóm trách nhiệm
> - Tách dần: extract class/service theo domain (validate, persist, notify…)
> - Giữ facade mỏng nếu cần API cũ; inject dependency mới
> - Test coverage trước → refactor nhỏ → rename/clear boundaries
>
> **Your answer:**

**Q30.** Compare OOP and functional programming for the same business feature. When is OOP the better fit, and when is it not?

> **Ý chính:**
>
> - OOP: model domain bằng object, state + behavior, polymorphism
> - FP: function thuần, immutable data, compose pipeline
> - OOP hợp: domain phong phú, nhiều behavior theo type, stateful lifecycle
> - FP hợp: transform data, concurrent, logic ít side-effect; hybrid phổ biến
>
> **Your answer:**

**Q31.** What is the difference between shallow copy and deep copy of an object? When does each matter?

> **Ý chính:**
>
> - **Shallow** — copy object ngoài; nested vẫn share reference
> - **Deep** — copy đệ quy toàn bộ graph lồng nhau
> - Shallow đủ khi nested immutable / không mutate chung
> - Deep khi cần độc lập hoàn toàn; tốn hơn, cẩn thận circular ref
>
> **Your answer:**

**Q32.** What is a static method or static property? When should you use them, and when should you avoid them?

> **Ý chính:**
>
> - Thuộc về **class**, không cần instance; không dùng state instance
> - Dùng: util thuần, factory, constant dùng chung
> - Tránh: logic cần polymorphism / phụ thuộc state / khó mock test
> - Lạm dụng static → procedural, giảm OOP benefits
>
> **Your answer:**

**Q33.** Explain the Template Method and Strategy patterns. How are they similar, and how do they differ in OOP design?

> **Ý chính:**
>
> - Cả hai: tách phần cố định vs phần thay đổi của thuật toán
> - **Template Method** — inheritance: base định skeleton, subclass override bước
> - **Strategy** — composition: inject algorithm object qua interface
> - Strategy linh hoạt runtime hơn; Template gắn hierarchy
>
> **Your answer:**

**Q34.** What is object identity vs object equality? How would you implement `equals` / value comparison correctly?

> **Ý chính:**
>
> - **Identity** — cùng instance (cùng reference / id)
> - **Equality** — cùng giá trị (field so sánh)
> - Entity: so sánh theo id; Value Object: so sánh theo field
> - Implement: consistent với hash; null-safe; đừng lẫn reference == value
>
> **Your answer:**

**Q35.** How do you handle shared mutable state across objects safely (concurrency / multi-threading)? What OOP techniques help?

> **Ý chính:**
>
> - Giảm shared mutable state; ưu tiên immutable / message passing
> - Đồng bộ: lock/mutex, concurrent collection (nếu bắt buộc share)
> - Encapsulation giúp ẩn sync bên trong class
> - Actor / queue / single-writer; tránh publish mutable reference ra ngoài
>
> **Your answer:**

**Q36.** Design an extensible notification system (email, SMS, push) that can add new channels without changing existing code. Walk through classes, interfaces, and SOLID trade-offs.

> **Ý chính:**
>
> - `Notifier` / `NotificationChannel` interface: `send(message)`
> - Concrete: EmailChannel, SmsChannel, PushChannel
> - `NotificationService` phụ thuộc list/interface (OCP + DIP)
> - Đăng ký channel mới qua DI/config — không sửa service core
> - Trade-off: thêm interface/registry vs đơn giản if-else khi chỉ 1–2 channel
>
> **Your answer:**


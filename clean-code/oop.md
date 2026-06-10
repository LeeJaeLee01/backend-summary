# OOP

## 1. Bốn tính chất của OOP

OOP (Object-Oriented Programming) có **4 tính chất cốt lõi**:

| Tính chất | Tiếng Anh | Ý nghĩa |
|-----------|-----------|---------|
| **Đóng gói** | Encapsulation | Ẩn dữ liệu bên trong object, chỉ expose qua method public |
| **Kế thừa** | Inheritance | Class con nhận thuộc tính/hành vi từ class cha |
| **Đa hình** | Polymorphism | Cùng interface/method, hành vi khác nhau tùy object |
| **Trừu tượng** | Abstraction | Ẩn chi tiết phức tạp, chỉ hiện chức năng cần thiết |

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

| | **Ghi đè (Override)** | **Nạp chồng (Overload)** |
|---|----------------------|--------------------------|
| **Xảy ra ở** | Quan hệ **kế thừa** — class con ↔ class cha | **Cùng một class** — nhiều method cùng tên |
| **Chữ ký method** | **Giống hệt** tên + tham số | **Cùng tên**, **khác tham số** (số lượng/kiểu) |
| **Mục đích** | Class con **thay đổi hành vi** method cha | Một tên method, **xử lý nhiều kiểu input** |
| **Thời điểm** | **Runtime** — gọi method của object thực tế | **Compile-time** — compiler chọn method phù hợp |
| **Liên quan đa hình** | **Đa hình runtime** (subtype polymorphism) | **Đa hình compile-time** |

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

| | **Interface** | **Abstract class** |
|---|---------------|-------------------|
| **Bản chất** | **Hợp đồng** — khai báo method/property class phải có | **Class không hoàn chỉnh** — vừa có method trừu tượng, vừa có code thực thi |
| **Implementation** | **Không** chứa body method (TS: trừ default trong một số case) | Có thể có **method đã implement sẵn** |
| **Kế thừa** | Class **implements** nhiều interface | Class **extends** một abstract class (single inheritance) |
| **Constructor** | **Không có** | **Có** constructor |
| **Biến/field** | Chỉ khai báo kiểu (TS) — không khởi tạo state | Có thể có **property, state** |
| **Khi nào dùng** | Định nghĩa **capability** — `Flyable`, `Payable` | Chia sẻ **logic chung** + bắt buộc override phần riêng |

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

| | **`this`** | **`super`** |
|---|-----------|-------------|
| **Ý nghĩa** | Tham chiếu tới **object hiện tại** | Tham chiếu tới **class cha** |
| **Dùng ở đâu** | Trong method, constructor, property của class | Trong class con (`extends`) |
| **Mục đích** | Truy cập field/method của **chính instance đó** | Gọi constructor hoặc method **của cha** |

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

> **`this`** = "chính tôi" (instance hiện tại). **`super`** = "cha tôi" (class cha) — dùng khi kế thừa.

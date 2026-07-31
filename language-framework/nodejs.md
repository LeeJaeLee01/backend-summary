# Node.js

## 1. Node.js là gì? 

**Node.js** là môi trường **runtime mã nguồn mở** cho phép chạy **JavaScript bên ngoài trình duyệt**, dùng để xây dựng backend, API, và ứng dụng real-time.

- Dùng **V8 Engine** (của Chrome) để biên dịch và thực thi JavaScript.
- Xử lý bất đồng bộ qua **Event Loop** và **Non-blocking I/O** — phù hợp workload nhiều request đồng thời.
- **Single-threaded** — một luồng chính xử lý JavaScript.

> Node.js không phải ngôn ngữ mới — nó là nền tảng runtime để chạy JavaScript phía server.

Eng-sub:

## 1. What is NodeJS?

NodeJS is an opensource runtime environment that allows you to run JS outside the browser, NodeJS used to build BEs, APIs and real-time applications

- NodeJS uses **V8 Engine** (from Chrome) to compile and execute JS.
- NodeJS handles asynchronous work via the Event Loop and Non-blocking I/O — suitable for workloads with many concurrent request 
- **Single-threaded** - a main thread handles JS

## 2. Cơ chế hoạt động của Node.js 

Node.js gồm 3 thành phần chính: **V8 Engine**, **libuv**, và **Event Loop**.

1. **V8 Engine** — biên dịch JavaScript thành mã máy và thực thi trên luồng chính (single-threaded).
2. **libuv** — thư viện C++ xử lý I/O bất đồng bộ (đọc file, DB, network) qua **Thread Pool**, không chặn luồng chính.
3. **Event Loop** — liên tục kiểm tra hàng đợi; khi I/O hoàn tất, đưa callback về và thực thi trên luồng chính.

**Luồng xử lý một request:**

```
Request → đăng ký I/O (non-blocking) → tiếp tục xử lý request khác
                ↓
         I/O hoàn tất → callback vào Event Loop → thực thi → trả response
```

- **Non-blocking I/O**: không chờ I/O xong mới làm việc khác — tận dụng thời gian chờ để xử lý request khác.
- **Event-driven**: mọi thao tác dựa trên sự kiện và callback (hoặc Promise/`async-await`).

> Tóm lại: Node.js dùng một luồng chính chạy JS, ủy thác I/O cho libuv, rồi Event Loop điều phối callback khi có kết quả — phù hợp tác vụ I/O-bound, kém hơn với tác vụ CPU-intensive.

Eng-sub:

## 2. How does Node.js work? (Explain how Node.js works under the hood)

Node.js has three main components: **V8 Engine**, **libuv**, and **Event Loop**.

1. **V8 Engine** — compiles JS into machine code and executes it on the main thread (single-threaded)
2. **libuv** — a C++ libarary that handles async I/O (file reads, DB, network) via a **Thread Pool**, without blocking the main thread
3. **Event Loop** - continously checks the queue; when I/O completes,  it puts the callback and executes on the main thread

**Luồng xử lý một request:**

```
Request → đăng ký I/O (non-blocking) → tiếp tục xử lý request khác
                ↓
         I/O hoàn tất → callback vào Event Loop → thực thi → trả response
```

- **Non-blocking I/O**: không chờ I/O xong mới làm việc khác — tận dụng thời gian chờ để xử lý request khác.
- **Event-driven**: mọi thao tác dựa trên sự kiện và callback (hoặc Promise/`async-await`).

**The thread handle a request:**

```
Request → Register I/O (non-blocking) → continue handling other requests
                ↓
         I/O completes  → callback enters the Event Loop → execute → return response
```

- **Non-blocking I/O**: It doesn't wait for I/O to complete before doing other work — it uses the waiting time to handle other requests
- **Event-driven**: all actions based on event and callback (hoặc Promise/`async-await`).

## 3. Node.js đơn luồng, tại sao xử lý được nhiều request?

**Đơn luồng** chỉ áp dụng cho luồng chạy **JavaScript** — không có nghĩa là chỉ xử lý được một request tại một thời điểm.

**Lý do xử lý được nhiều request:**

1. **Non-blocking I/O** — khi gọi DB, đọc file, gọi API, Node.js **không chờ** kết quả mà chuyển sang nhận request khác. I/O được ủy thác cho **OS / libuv (Thread Pool)**.
2. **Event Loop** — khi I/O xong, callback được đưa vào hàng đợi và thực thi lần lượt trên luồng chính. Một luồng có thể **quản lý hàng nghìn kết nối** vì phần lớn thời gian server **chờ I/O**, không tốn CPU.
3. **So với mô hình blocking** (mỗi request một thread) — Node.js không tạo thread mới cho mỗi request, tránh tốn bộ nhớ và chi phí context switching.

```
Blocking (multi-thread):  Request 1 chờ DB ──► thread 1 bị block
Node.js (single-thread):  Request 1 gửi DB → nhận Request 2, 3... → DB trả về → callback
```

> Tóm lại: Node.js xử lý nhiều request nhờ **bất đồng bộ + Event Loop** — tận dụng thời gian chờ I/O để phục vụ request khác. Lưu ý: tác vụ **CPU nặng** vẫn block luồng chính, làm chậm toàn bộ request.

Eng-sub:

## 3. Node.js is single-thread, why can it handle many requests (Why can NodeJS handle many requests if it is single threaded) 

**Single-threaded** only applies to the thread that runs JS - it does not mean NodeJS can handle only one request at a time 

Reasons it can handle many requests:

1. **Non-blocking I/O** — when calling the DB, reading a file, calling an API, NodeJS doesn't wait for the result, it moves on to accept other requests. I/O is offloaded to the OS / libuv (thread pool).
2. **Event Loop** — When I/O finishes, the callback is pushed into the queue and executed one by one on the main thread. One thread can manage thousands of connections because the sever spends most of its time waiting for I/O, not burning CPU
3. **Compared to the blocking model** (one thread per request) - Node.js doesn't create a new thread for each request, So it avoids high memory use and context-switching cost.

```
Blocking (multi-thread): the first request is waiting for DB -> first thread is blocked
Node.js (single-thread): the first request is sending to DB -> Receiving request 2, 3... -> DB return -> callback
```

> Tóm lại: Node.js xử lý nhiều request nhờ **bất đồng bộ + Event Loop** — tận dụng thời gian chờ I/O để phục vụ request khác. Lưu ý: tác vụ **CPU nặng** vẫn block luồng chính, làm chậm toàn bộ request.

> Summary: Node.js can handles many request by (async + event loop) - It makes use of time spent waiting for I/O to process other request. Keep in mind the CPU intensive work still blocks the main thread and slows down every request

## 4. Phân biệt `let`, `var`, `const`

| | `var` | `let` | `const` |
|---|-------|-------|---------|
| **Scope** | Function scope | Block scope `{}` | Block scope `{}` |
| **Hoisting** | Có — khai báo được đưa lên đầu, gán giá trị `undefined` | Có — nhưng nằm trong **Temporal Dead Zone**, không dùng trước khi khai báo | Có — cũng trong TDZ |
| **Gán lại** | Được | Được | **Không** — phải gán ngay khi khai báo |
| **Khai báo lại** | Được (cùng scope) | Không | Không |

**Ví dụ scope:**

```javascript
if (true) {
  var a = 1;   // thoát block vẫn truy cập được
  let b = 2;   // chỉ dùng trong block
  const c = 3;
}
console.log(a); // 1
console.log(b); // ReferenceError
```

**`const` với object/array** — không gán lại biến, nhưng **vẫn sửa được nội dung**:

```javascript
const user = { name: 'A' };
user.name = 'B'; // OK
user = {};       // Error
```

> Nên dùng **`const` mặc định**, `let` khi cần gán lại, **tránh `var`** (dễ gây bug do function scope và hoisting).

> **Tóm lại:** `var` là function scope, hoist thành `undefined`, cho phép gán lại và khai báo lại nên dễ bug; `let` và `const` là block scope, cũng hoist nhưng nằm trong TDZ nên không dùng trước khi khai báo. `let` gán lại được còn `const` thì không — với object/array `const` chỉ khóa reference, vẫn sửa được nội dung. Thực tế: mặc định `const`, cần gán lại thì `let`, tránh `var`.

> Summary: `var` is function-scoped, hoisted as `undefined`, and allows both reassignment and redeclaration - so it easily causes bugs. `Let` allows reassignment but `const` is doesn't - with objects/arrays `const` only locks the reference, the content can still be updated. In fact, defauto to `const`, use `let` when you need reassignment, and avoid `var`.

## 5. Phân biệt `async/await` và `Promise`

| | `Promise` | `async/await` |
|---|-----------|---------------|
| **Bản chất** | Object đại diện kết quả tương lai của tác vụ bất đồng bộ | **Cú pháp sugar** viết trên Promise — dễ đọc như code đồng bộ |
| **Cú pháp** | `.then()`, `.catch()`, `.finally()` | `async function` + `await` |
| **Trả về** | Luôn là Promise | Hàm `async` **luôn trả về Promise** (kể cả `return 1`) |
| **Xử lý lỗi** | `.catch()` hoặc `.then(null, onReject)` | `try/catch` trong hàm `async` |
| **Chaining** | `.then().then()` — dễ **callback hell** nếu lồng nhiều | Code **tuần tự**, dễ đọc khi nhiều bước async |

**Promise:**

```javascript
fetchUser(id)
  .then(user => fetchOrders(user.id))
  .then(orders => console.log(orders))
  .catch(err => console.error(err));
```

**async/await** (tương đương):

```javascript
async function getOrders(id) {
  try {
    const user = await fetchUser(id);
    const orders = await fetchOrders(user.id);
    console.log(orders);
  } catch (err) {
    console.error(err);
  }
}
```

**Quan hệ:**

- `await` **chỉ dùng trong** hàm `async` (hoặc top-level module).
- `await` **tạm dừng** hàm `async` cho đến khi Promise resolve/reject — **không block** Event Loop.
- `async/await` bên dưới vẫn là Promise — có thể mix: `await somePromise` hoặc `asyncFn().then(...)`.

> **Promise** là cơ chế xử lý bất đồng bộ; **async/await** là cách viết gọn, dễ đọc hơn trên Promise. Thực tế nên dùng **async/await** cho flow tuần tự, **Promise.all()** khi chạy song song.

> **Tóm lại:** Promise là object đại diện kết quả tương lai của tác vụ async (`.then` / `.catch`); async/await chỉ là cú pháp sugar trên Promise giúp code đọc như đồng bộ, hàm `async` luôn trả về Promise, lỗi bắt bằng `try/catch`. `await` tạm dừng hàm async đến khi Promise xong nhưng không block Event Loop. Flow tuần tự dùng async/await; chạy song song dùng `Promise.all()`.

> Summary: a Promise is an object that represents the future result of an async task (.then / .catch). async/await is just syntactic sugar over Promises that makes code read like synchronous code; an `async` function always returns a Promise, and errors are handled with try/catch. `await` pauses async function until the Promise settles, but it doesnot block the Event loop. Use async/await for sequential flow, use Promise.all() for parallel work

## 6. Phân biệt `Promise.all`, `Promise.race`, `Promise.allSettled`

| | `Promise.all` | `Promise.race` | `Promise.allSettled` |
|---|---------------|----------------|----------------------|
| **Chờ** | Tất cả Promise xong | Promise **đầu tiên** xong (resolve hoặc reject) | Tất cả Promise xong |
| **Khi có lỗi** | **Fail fast** — một cái reject → cả nhóm reject | Trả về kết quả của cái **xong trước** (kể cả reject) | **Không reject** — chờ hết, ghi nhận từng kết quả |
| **Kết quả** | Mảng giá trị theo thứ tự input | Một giá trị (thắng cuộc) | Mảng `{ status, value/reason }` |

**`Promise.all`** — chạy song song, cần **tất cả thành công**:

```javascript
const [user, orders] = await Promise.all([fetchUser(), fetchOrders()]);
// Một cái lỗi → throw ngay, không chờ cái còn lại
```

**`Promise.race`** — lấy kết quả **nhanh nhất** (timeout, fallback server):

```javascript
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) => setTimeout(() => reject('timeout'), 5000))
]);
```

**`Promise.allSettled`** — cần biết **kết quả từng cái**, kể cả lỗi:

```javascript
const results = await Promise.allSettled([api1(), api2(), api3()]);
// [{ status: 'fulfilled', value: ... }, { status: 'rejected', reason: ... }]
```

> **`all`** — tất cả thành công mới OK. **`race`** — ai xong trước. **`allSettled`** — chờ hết, không bỏ sót lỗi nào.

## 7. Closure là gì?

**Closure** là khi một hàm **nhớ và truy cập được biến** từ scope bên ngoài, **kể cả sau khi hàm bên ngoài đã thực thi xong**.

```javascript
function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  };
}

const counter = outer();
counter(); // 1
counter(); // 2 — `inner` vẫn giữ reference tới `count`
```

**Đặc điểm:**

- Hàm bên trong **"đóng gói"** (enclose) biến của scope cha.
- Biến đó **không bị garbage collect** miễn là closure còn được tham chiếu.

**Ứng dụng thường gặp:**

- **Data privacy** — ẩn biến, chỉ expose qua hàm:

```javascript
function createWallet(balance) {
  return {
    deposit: (amount) => { balance += amount; },
    getBalance: () => balance
  };
}
```

- **Factory function** — tạo hàm với config riêng (middleware, handler).
- **Callback / event handler** — giữ state giữa các lần gọi.

**Lưu ý khi phỏng vấn — bug classic với `var` trong vòng lặp:**

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // in 3, 3, 3
}
// Fix: dùng `let` hoặc IIFE / closure riêng cho từng `i`
```

> **Closure** = function + lexical environment của nó. Hay dùng để **giữ state private** và tạo hàm có ngữ cảnh riêng.

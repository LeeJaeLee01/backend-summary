# Interview practice — Node.js & comparisons

> Câu hỏi tiếng Anh · trả lời ngắn (3–6 câu). Gợi ý: dựa `[language-framework/nodejs.md](./language-framework/nodejs.md)`, `[introduce.md](./introduce.md)`.

---

## A. Node.js

**Q1.** What is Node.js?

**Answer (raw — needs fix):**
NodeJS is a JS runtime enviroment. NodeJS is a single-thread, which uses non-blocking and event-loop for handles mutiple requests from client. Node JS is better with I/O task than logic need high-heavy CPU

**Answer (corrected):**
Node.js is a JavaScript runtime environment. It is single-threaded and uses non-blocking I/O and the Event Loop to handle multiple client requests. Node.js is better for I/O-heavy tasks than for CPU-heavy logic.

**Grammar / wording errors**


| #   | Của bạn                               | Lỗi (loại)                    | Đúng                                           | Giải thích ngắn                                                             |
| --- | ------------------------------------- | ----------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | `NodeJS` / `Node JS`                  | spelling / naming             | **Node.js**                                    | Tên chính thức có dấu chấm; viết thống nhất                                 |
| 2   | `enviroment`                          | spelling                      | **environment**                                | Thiếu chữ `n`                                                               |
| 3   | `a JS runtime`                        | style (abbr)                  | **a JavaScript runtime**                       | Phỏng vấn nên viết đủ lần đầu                                               |
| 4   | `is a single-thread`                  | word form (adj)               | **is single-threaded**                         | Cần tính từ `-ed`: *single-threaded*, không phải noun `thread` trần         |
| 5   | `which uses…` gắn sau `single-thread` | relative clause lệch          | tách câu / **It is single-threaded and uses…** | `which` đang bổ nghĩa mơ hồ; rõ hơn dùng `It`                               |
| 6   | `non-blocking and event-loop`         | incomplete noun phrase        | **non-blocking I/O and the Event Loop**        | Thiếu `I/O`; Event Loop là proper concept → thường có `the`                 |
| 7   | `for handles`                         | verb form sau giới từ         | **to handle** / **for handling**               | Sau `for` dùng **V-ing**; hoặc dùng `to` + V1: *to handle*                  |
| 8   | `mutiple`                             | spelling                      | **multiple**                                   | Sai chính tả                                                                |
| 9   | `from client`                         | article / number              | **from clients** / **from the client**         | Số nhiều tự nhiên hơn, hoặc `the client` nếu chỉ một                        |
| 10  | `better with I/O task`                | collocation + number          | **better for I/O-heavy tasks**                 | `better for` (không `with`); `tasks` số nhiều / có hyphen *I/O-heavy*       |
| 11  | `than logic need high-heavy CPU`      | clause structure + word order | **than for CPU-heavy logic**                   | Thiếu song song `better for A than for B`; `high-heavy` sai → **CPU-heavy** |
| 12  | thì / tense tổng thể                  | present simple OK             | giữ **is / uses / is better**                  | Mô tả sự thật chung → hiện tại đơn đúng; không cần present perfect          |


**Mẫu cấu trúc nhớ nhanh**

```text
S + be + Adj
Node.js is single-threaded.

S + use(s) + N + to V
It uses the Event Loop to handle many requests.

S + be + better for + N + than for + N
It is better for I/O-heavy tasks than for CPU-heavy logic.
```

**Q2.** How does Node.js work under the hood? (V8, libuv, Event Loop)

> **Nghĩa câu hỏi:** “Under the hood” = **bên trong / cơ chế thật sự**. Interviewer muốn bạn giải thích Node.js **chạy thế nào**, không chỉ “là runtime” — thường nhắc **V8 + libuv + Event Loop**.

**Answer:**
Node.js has three main components: the **V8 engine**, **libuv**, and the **Event Loop**.

1. **V8** compiles JavaScript into machine code and runs it on the main thread (single-threaded).
2. **libuv** is a C++ library that handles async I/O (files, DB, network) via a **thread pool**, without blocking the main thread.
3. The **Event Loop** continuously checks the queue; when I/O completes, it puts the callback back and executes it on the main thread.

Flow: a request registers non-blocking I/O → Node.js keeps handling other requests → when I/O finishes, the callback runs on the Event Loop → response is returned.

In short, JS runs on one main thread, I/O is offloaded to libuv, and the Event Loop coordinates callbacks — good for I/O-bound work, weaker for CPU-heavy work.

**Q3.** Node.js is single-threaded — why can it still handle many concurrent requests?

**Answer (raw — needs fix):**
Because Node.JS has non-blocking and event-loop mechainism. first, non-blocking means non block main thread. Requests from client will continuously handles without watting different requests to finish. The event loop runs on the main thread, picks ready callbacks from the queue when the call stack is empty and lets NodeJS keep accepting work white I/O runs in the background via libuv.

**Answer (corrected):**
Because Node.js uses **non-blocking I/O** and the **Event Loop**. First, non-blocking means I/O does **not block** the main thread. Client requests can keep being handled **without waiting** for other requests to finish. (Client request vẫn được xử lý thay vì chờ các request khác hoàn thành). The Event Loop runs on the main thread, picks ready callbacks from the queue when the call stack is empty, and lets Node.js keep accepting work **while** I/O runs in the background via libuv.

**Grammar / wording errors**


| #   | Của bạn                                        | Lỗi (loại)             | Đúng                                                      | Giải thích ngắn                                                                   |
| --- | ---------------------------------------------- | ---------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `Node.JS` / `NodeJS`                           | naming                 | **Node.js**                                               | Viết thống nhất: Node.js                                                          |
| 2   | `mechainism`                                   | spelling               | **mechanism**                                             | Sai chính tả                                                                      |
| 3   | `non-blocking and event-loop mechanism`        | incomplete noun phrase | **non-blocking I/O and the Event Loop**                   | Thiếu `I/O`; Event Loop thường có **the**                                         |
| 4   | `first,` (chữ thường)                          | capitalization         | **First,**                                                | Đầu câu / đầu ý mới → viết hoa                                                    |
| 5   | `non block main thread`                        | verb form + article    | **does not block the main thread**                        | Cần trợ động từ phủ định + **the** main thread                                    |
| 6   | `will continuously handles`                    | S-V agreement / modal  | **can keep being handled** / **are handled continuously** | Sau will/can dùng **V1** (`handle`), không `handles`; hoặc bị động cho “requests” |
| 7   | `Requests … handles`                           | chủ-vị lệch            | **Requests are handled** / **Node.js handles requests**   | `Requests` không tự `handles`                                                     |
| 8   | `without watting`                              | spelling               | **without waiting**                                       | `wait` → `waiting` (sau `without` = V-ing)                                        |
| 9   | `without waiting different requests to finish` | missing `for`          | **without waiting for other requests to finish**          | Collocation: **wait for** someone/something                                       |
| 10  | `different requests`                           | word choice            | **other requests**                                        | “request khác” → **other** tự nhiên hơn ở đây                                     |
| 11  | `white I/O`                                    | wrong word / typo      | **while I/O**                                             | `white` = trắng; đúng là **while** (trong khi)                                    |
| 12  | thiếu dấu phẩy trước `and lets`                | punctuation            | `…empty, and lets…`                                       | Mệnh đề dài: thêm dấu phẩy cho dễ đọc (optional nhưng rõ hơn)                     |


**Mẫu cấu trúc nhớ nhanh**

```text
non-blocking = does not block the main thread
wait for + N + to V  →  without waiting for other requests to finish
while + S + V        →  while I/O runs in the background
S + be + V3          →  Requests are handled continuously
```

**Q4.** What is the difference between `var`, `let`, and `const`?

**Answer:**
The main differences are **scope**, **hoisting**, and **reassignment**.

- `**var`** (older ES5 style): **function-scoped**, hoisted as `undefined`, allows both **reassignment** and **redeclaration** — easy to cause bugs.
- `**let`**: **block-scoped** (`{}`), hoisted but in the **TDZ** (cannot use before declaration), allows **reassignment**, no redeclaration in the same scope.
- `**const`**: also **block-scoped** and in the TDZ, but **cannot be reassigned**. With objects/arrays, `const` only locks the **reference** — you can still change the contents.

In practice: default to `**const`**, use `**let`** when you need reassignment, and **avoid `var`**.

**Tiếng Việt (tóm):**  
`var` = function scope, dễ bug; `let`/`const` = block scope + TDZ; `let` gán lại được, `const` không — object/array vẫn sửa nội dung được. Mặc định `const`.

**Q5.** What is the difference between Promises and `async/await`?

**Answer:** 

- Promise is an object that represents the future result of an asynchonous operation. it has 3 states: Pending, fulfilled and rejected. the results is processed by then(), the false is catch() 
- Async/Await is syntactic suger (cú pháp viết gọn) based on Promise that helps asynchonous code same sync code. async function always return Promise, await pause this function until Promise to finish but it is not block event Loop.

**Answer (corrected):**

- A Promise is an object that represents the future result of an asynchronous operation. It has three states: pending, fulfilled, and rejected. The result is handled with `.then()`, and errors are handled with `.catch()`.
- `async/await` is syntactic sugar built on Promises that makes asynchronous code look like synchronous code. An `async` function always returns a Promise, and `await` pauses that function until the Promise settles, but it does not block the Event Loop.

**Grammar / wording errors**


| #   | Của bạn                                 | Lỗi (loại)                           | Đúng                                                   | Giải thích ngắn                                                                                 |
| --- | --------------------------------------- | ------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | `Promise is an object`                  | thiếu mạo từ                         | **A Promise is an object**                             | Nói về Promise nói chung → cần `a`                                                              |
| 2   | `asynchonous`                           | chính tả                             | **asynchronous**                                       | Thiếu chữ `r`                                                                                   |
| 3   | `it has 3 states`                       | viết hoa + số                        | **It has three states**                                | Đầu câu viết hoa; câu văn nên viết số bằng chữ                                                  |
| 4   | `Pending, fulfilled`                    | viết hoa không thống nhất            | **pending, fulfilled, and rejected**                   | Ba trạng thái viết cùng kiểu chữ thường                                                         |
| 5   | `the results is processed`              | hòa hợp chủ–vị                       | **The result is handled**                              | `results` số nhiều không đi với `is`; ở đây nói một kết quả nên dùng `result`                   |
| 6   | `by then()`                             | giới từ                              | **with `.then()`**                                     | Xử lý "bằng" một hàm → dùng `with`                                                              |
| 7   | `the false is catch()`                  | sai từ + thiếu động từ               | **errors are handled with `.catch()`**                 | `false` là "sai" (boolean), không phải "lỗi"; lỗi là `errors`. Cần động từ `are handled`        |
| 8   | `suger`                                 | chính tả                             | **sugar**                                              |                                                                                                 |
| 9   | `based on Promise`                      | số ít/nhiều                          | **built on Promises**                                  | Nói về Promise nói chung → số nhiều                                                             |
| 10  | `helps asynchonous code same sync code` | thiếu động từ + sai cấu trúc so sánh | **makes asynchronous code look like synchronous code** | "giống" = `look like`; cấu trúc `make + O + V`: *makes code look like…*                         |
| 11  | `async function always return`          | thiếu mạo từ + hòa hợp chủ–vị        | **An `async` function always returns**                 | Chủ ngữ số ít → `returns`; cần `an`                                                             |
| 12  | `await pause`                           | hòa hợp chủ–vị                       | `**await` pauses**                                     | Chủ ngữ số ít → thêm `-s`                                                                       |
| 13  | `this function`                         | từ chỉ định                          | **that function**                                      | Nhắc lại hàm vừa nói ở vế trước → `that` tự nhiên hơn                                           |
| 14  | `until Promise to finish`               | sai cấu trúc sau `until`             | **until the Promise settles**                          | Sau `until` cần một mệnh đề `S + V`, không dùng `to V`. `settles` = xong, dù thành công hay lỗi |
| 15  | `it is not block`                       | trộn `be` với động từ                | **it does not block**                                  | Phủ định động từ thường dùng `does not + V1`, không dùng `is not + V1`                          |
| 16  | `event Loop`                            | viết hoa không thống nhất            | **the Event Loop**                                     | Tên khái niệm: viết hoa cả hai chữ và có `the`                                                  |


**Mẫu cấu trúc nhớ nhanh**

```text
make + O + V           →  makes async code look like sync code
until + S + V          →  until the Promise settles
does not + V1          →  it does not block the Event Loop
S (số ít) + V-s        →  An async function returns… / await pauses…
be + V3 + with + N     →  errors are handled with .catch()
```

**Q6.** What is the difference between `Promise.all`, `Promise.race`, and `Promise.allSettled`?

**Answer:** All three methods take an array Promise that run concurrently. They differ in when they resolve and how they handle errors. (chúng khác nhau ở chỗ khi nào thì hoàn thành và chúng xử lý lỗi như thế nào)

- Promise.all: Waiting for all promise success. just one error is all them fail fast, and dont wait the other. Result is an array value, the true input order -> Using Promise.all when you need full data, example load user and orders concurently to render a page
- Promise.race: return result of Promise to fisrt finish, event thought that is success or false. It is used to make timeout: 
- Promise.allSettled: Waiting for all finish, it never reject. result is an array objects: `{ status: 'fulfilled', value }` hoặc `{ status: 'rejected', reason }`. It used to you need know part success or false. example you send email to 100 people and you want to know who is false

**Answer (corrected):**
All three methods take an array of Promises that run concurrently. They differ in when they settle and how they handle errors.

- `Promise.all` waits for all Promises to succeed. If just one rejects, the whole call fails fast and does not wait for the others. The result is an array of values in the same order as the input. Use `Promise.all` when you need all the data, for example, loading the user and their orders concurrently to render a page.
- `Promise.race` returns the result of the first Promise to settle, whether it succeeds or fails. It is often used to implement a timeout.
- `Promise.allSettled` waits for all Promises to finish and never rejects. The result is an array of objects: `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`. It is used when you need to know which ones succeeded and which ones failed. For example, you send emails to 100 people and want to know which emails failed.

**Grammar / wording errors**


| #   | Của bạn                                    | Lỗi (loại)                              | Đúng                                                  | Giải thích ngắn                                                                                         |
| --- | ------------------------------------------ | --------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `an array Promise`                         | thiếu `of` + số ít/nhiều                | **an array of Promises**                              | Cấu trúc `an array of + N số nhiều`                                                                     |
| 2   | `Waiting for all promise success`          | dạng động từ + từ loại                  | **waits for all Promises to succeed**                 | Mô tả sự thật → hiện tại đơn `waits`; `success` là danh từ, động từ là `succeed`; `wait for + O + to V` |
| 3   | `just one error is all them fail fast`     | thiếu `if` + trộn `is` với động từ      | **If just one rejects, the whole call fails fast**    | Câu điều kiện cần `If + S + V`; không ghép `is` với `fail`; `all them` sai → `all of them`              |
| 4   | `dont wait the other`                      | chính tả + chủ–vị + thiếu `for`         | **does not wait for the others**                      | `don't` cần dấu `'`; chủ ngữ số ít → `does not`; `wait for`; `the others` = những cái còn lại           |
| 5   | `Result is an array value`                 | thiếu mạo từ + thiếu `of`               | **The result is an array of values**                  | Kết quả cụ thể → `the`; `an array of values`                                                            |
| 6   | `the true input order`                     | sai từ                                  | **in the same order as the input**                    | `true` = đúng/thật (sự thật), không phải "đúng thứ tự". Dùng `the same order as`                        |
| 7   | `Using Promise.all when…`                  | câu thiếu động từ chính                 | **Use `Promise.all` when…**                           | Lời khuyên → câu mệnh lệnh `V1`; `Using…` đứng một mình là câu cụt                                      |
| 8   | `example load user`                        | thiếu `for` + dạng động từ              | **for example, loading the user**                     | Viết `for example`; sau đó dùng V-ing hoặc cụm danh từ                                                  |
| 9   | `concurently`                              | chính tả                                | **concurrently**                                      | Thiếu chữ `r`                                                                                           |
| 10  | `return result of Promise to fisrt finish` | chủ–vị + mạo từ + trật tự từ + chính tả | **returns the result of the first Promise to settle** | Chủ ngữ số ít → `returns`; `the result`; `fisrt` → `first`; mẫu `the first + N + to V`                  |
| 11  | `event thought`                            | chính tả + sai từ                       | **whether … or …**                                    | `even though` = mặc dù (một sự thật). "Dù A hay B" phải dùng `whether A or B`                           |
| 12  | `that is success or false`                 | từ loại + sai từ                        | **it succeeds or fails**                              | `success` là danh từ; `false` là giá trị boolean, không phải "thất bại" → dùng động từ `fails`          |
| 13  | `It is used to make timeout:`              | thiếu mạo từ + câu bỏ lửng              | **It is often used to implement a timeout.**          | `timeout` đếm được → `a timeout`; dấu `:` mà không có gì phía sau                                       |
| 14  | `Waiting for all finish`                   | dạng động từ + thiếu `to`               | **waits for all Promises to finish**                  | Giống lỗi 2: `wait for + O + to V`                                                                      |
| 15  | `it never reject`                          | hòa hợp chủ–vị                          | **never rejects**                                     | Chủ ngữ số ít → thêm `-s`                                                                               |
| 16  | `result is an array objects`               | viết hoa + mạo từ + thiếu `of`          | **The result is an array of objects**                 | Đầu câu viết hoa; `the result`; `an array of objects`                                                   |
| 17  | `hoặc`                                     | trộn tiếng Việt                         | **or**                                                | Câu trả lời tiếng Anh thì viết `or`                                                                     |
| 18  | `It used to you need know`                 | nhầm `used to` + thiếu `to`             | **It is used when you need to know**                  | `used to + V` = "từng làm" (thói quen quá khứ). Bị động cần `is used`; `need + to V`                    |
| 19  | `part success or false`                    | sai cấu trúc                            | **which ones succeeded and which ones failed**        | "Cái nào thành công, cái nào lỗi" → `which ones + V`; quá khứ vì việc đã xảy ra                         |
| 20  | `example you send email`                   | thiếu `For` + số nhiều                  | **For example, you send emails**                      | `For example,` đầu câu; gửi cho 100 người → `emails` số nhiều                                           |
| 21  | `who is false`                             | sai từ                                  | **which emails failed**                               | `false` không có nghĩa là "bị lỗi"; dùng `failed`                                                       |


**Mẫu cấu trúc nhớ nhanh**

```text
an array of + N (số nhiều)   →  an array of Promises / an array of values
wait for + O + to V          →  waits for all Promises to succeed
the first + N + to V         →  the first Promise to settle
whether + S + V + or + V     →  whether it succeeds or fails
is used + to V / when…       →  It is used to implement a timeout / It is used when you need to know…
used to + V (khác nghĩa!)    →  I used to work with PHP. (Tôi từng làm PHP.)
```


| **Từ**  | **Nghĩa**                               |
| ------- | --------------------------------------- |
| resolve | xong và **thành công**                  |
| reject  | xong nhưng **lỗi**                      |
| settle  | **xong**, bao gồm cả resolve lẫn reject |


**Q7.** What is a closure in JavaScript? Give a short example.

**Answer: Closure is a function that can remember the variable an outer scope where is it is created. Simple: a child function bring variable of parent function. So this variable still after parent function returned and outer coder cannot directly access this variable**

**Example:** 

- Private variable: hidden variable, only fix thought function 
- Func factory: Creating the different function have private config
- Callback and event handler: callback remember variable at

**Answer (corrected):**
A closure is a function that remembers the variables from the outer scope where it was created, even after the outer function has returned. Simply put, a child function carries the variables of its parent function with it. So these variables still exist after the parent function returns, and outside code cannot access them directly.

**Example:**

```javascript
function createCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

const counter = createCounter();
counter(); // 1
counter(); // 2
```

**Common use cases:**

- **Private variables:** hide a variable so it can only be changed through a function.
- **Function factories:** create different functions, each with its own private config.
- **Callbacks and event handlers:** a callback remembers the variables from the moment it was created.

**Grammar / wording errors**


| #   | Của bạn                                               | Lỗi (loại)                                     | Đúng                                                                  | Giải thích ngắn                                                                                         |
| --- | ----------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `Closure is a function`                               | thiếu mạo từ                                   | **A closure is a function**                                           | `closure` là danh từ đếm được, số ít → cần `a`                                                          |
| 2   | `the variable an outer scope`                         | thiếu giới từ + số ít/nhiều                    | **the variables from the outer scope**                                | Cần `from` để nối hai cụm danh từ; closure thường nhớ nhiều biến → `variables`                          |
| 3   | `where is it is created`                              | đảo ngữ sai + thừa `is` + thì                  | **where it was created**                                              | Mệnh đề quan hệ giữ trật tự `S + V`; hàm được tạo trước đó → quá khứ bị động `was created`              |
| 4   | thiếu ý "kể cả khi hàm ngoài đã chạy xong"            | thiếu nội dung chính                           | **even after the outer function has returned**                        | Đây là ý quan trọng nhất của closure, nên có ngay trong câu định nghĩa                                  |
| 5   | `Simple:`                                             | từ loại                                        | **Simply put,** / **In simple terms,**                                | `simple` là tính từ, không mở đầu câu được. Dùng cụm cố định `Simply put,`                              |
| 6   | `a child function bring variable`                     | hòa hợp chủ–vị + chọn từ + mạo từ              | **a child function carries the variables**                            | Chủ ngữ số ít → thêm `-s`; "mang theo" là `carry`, còn `bring` là "mang tới"; cần `the variables`       |
| 7   | `of parent function`                                  | thiếu từ hạn định                              | **of its parent function**                                            | Danh từ số ít đếm được cần `its` / `the`                                                                |
| 8   | `this variable still after…`                          | thiếu động từ                                  | **these variables still exist after…**                                | `still` là trạng từ, không thay động từ được → cần `exist`                                              |
| 9   | `parent function returned`                            | mạo từ + thì                                   | **the parent function returns**                                       | Cần `the`; mô tả cách hoạt động chung → hiện tại đơn                                                    |
| 10  | `outer coder`                                         | sai từ                                         | **outside code**                                                      | `coder` là người viết code. "Code bên ngoài" là `outside code`                                          |
| 11  | `Example:` nhưng không có ví dụ                       | thiếu nội dung                                 | thêm ví dụ `createCounter`                                            | Câu hỏi yêu cầu "Give a short example" → phải có code                                                   |
| 12  | `hidden variable, only fix thought function`          | sai từ + chính tả + thiếu cấu trúc             | **hide a variable so it can only be changed through a function**      | `fix` là sửa lỗi, "thay đổi giá trị" là `change`; `thought` (quá khứ của think) → `through` (thông qua) |
| 13  | `Func factory`                                        | viết tắt + số ít/nhiều                         | **Function factories**                                                | Nói chuyện không viết tắt; liệt kê loại ứng dụng → số nhiều                                             |
| 14  | `Creating the different function have private config` | thừa `the` + số nhiều + hai động từ chồng nhau | **create different functions, each with its own private config**      | Không cần `the`; `functions` số nhiều; `creating … have` có hai động từ → dùng `each with its own`      |
| 15  | `callback remember variable at`                       | mạo từ + chủ–vị + câu bỏ dở                    | **a callback remembers the variables from the moment it was created** | Cần `a`; chủ ngữ số ít → `remembers`; câu chưa viết xong                                                |


**Mẫu cấu trúc nhớ nhanh**

```text
where + S + V (không đảo ngữ)      →  where it was created
even after + S + has + V3           →  even after the outer function has returned
Simply put, / In simple terms,      →  mở đầu câu giải thích đơn giản
so + S + can only be + V3 + through →  so it can only be changed through a function
each with its own + N               →  each with its own private config
carry (mang theo) vs bring (mang tới)
```

**Q8.** What is non-blocking I/O in Node.js?

**Answer: Non-blocking is a mechanism of NodeJS. It helps NodeJS handles mutiple client requests without does not block main thread.**

**Answer (corrected):**
Non-blocking I/O is a mechanism in Node.js. It helps Node.js handle multiple client requests without blocking the main thread.

**Answer (fuller, nếu muốn nói thêm):** Non-blocking I/O means Node.js does not wait for I/O operations, such as database queries, file reads, or network calls, to finish. It hands them off to libuv and keeps handling other requests. When the I/O finishes, the Event Loop runs its callback on the main thread. (Node JS giao các tác vụ đó cho libuv và tiếp túc xử lý các request khác. Khi I/O xong, Event loop sẽ chạy callback của nó trên main thread)

**Grammar / wording errors**


| #   | Của bạn                  | Lỗi (loại)                  | Đúng                                | Giải thích ngắn                                                                                     |
| --- | ------------------------ | --------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | `Non-blocking is`        | cụm danh từ thiếu           | **Non-blocking I/O is**             | `non-blocking` là tính từ, cần danh từ đi kèm → `non-blocking I/O` (giống lỗi ở Q1, Q3)             |
| 2   | `NodeJS`                 | viết tên                    | **Node.js**                         | Viết thống nhất: Node.js                                                                            |
| 3   | `a mechanism of NodeJS`  | giới từ                     | **a mechanism in Node.js**          | "Cơ chế trong Node.js" → `in` tự nhiên hơn (`of` không sai nhưng ít dùng)                           |
| 4   | `helps NodeJS handles`   | dạng động từ sau `help`     | **helps Node.js handle**            | Cấu trúc `help + O + V1`: động từ sau tân ngữ không thêm `-s`                                       |
| 5   | `mutiple`                | chính tả                    | **multiple**                        | Thiếu chữ `l` (lặp lại lỗi Q1)                                                                      |
| 6   | `without does not block` | dạng động từ + phủ định kép | **without blocking**                | Sau giới từ `without` dùng **V-ing**; `without` đã mang nghĩa phủ định → không thêm `does not`      |
| 7   | `main thread`            | thiếu mạo từ                | **the main thread**                 | Chỉ có một main thread cụ thể → `the`                                                               |
| 8   | chỉ nói "giúp làm gì"    | thiếu nội dung định nghĩa   | **does not wait for I/O to finish** | Câu hỏi "What is…" → nên nói nó là gì: không chờ I/O xong, giao cho libuv, Event Loop chạy callback |


**Mẫu cấu trúc nhớ nhanh**

```text
help + O + V1              →  It helps Node.js handle multiple requests
without + V-ing            →  without blocking the main thread
wait for + O + to V        →  does not wait for I/O operations to finish
hand + O + off to + N      →  It hands them off to libuv
```

**Q9.** When is Node.js a bad choice? (e.g. CPU-heavy work)

**Answer: NodeJS is a bad choice when the system have many CPU-heavy task.** 

**Reason: JS in NodeJS runs on only one main thread. If a request must low caculate. main thread is blocked, event Loop doesn't run continoustly, so all different requests must wait. Result is API low or timeout** 

Node.js mạnh với tác vụ nặng I/O (API, DB, real-time) nhưng yếu với tác vụ nặng CPU, vì tính toán lâu sẽ block main thread và làm chậm mọi request. Khi đó nên dùng Worker Threads, message queue, hoặc tách service sang Golang.

Khi bạn dịch sang tiếng Anh xong, gửi mình để sửa và thêm bảng lỗi vào file.

**Answer (corrected):**
Node.js is a bad choice when the system has many CPU-heavy tasks.

**Reason:** JavaScript in Node.js runs on a single main thread. If a request needs a long calculation, the main thread is blocked and the Event Loop cannot continue, so all other requests have to wait. As a result, the API becomes slow or times out.

**Answer (complete):**
Node.js is a bad choice for CPU-heavy work. JavaScript in Node.js runs on a single main thread, so a long calculation blocks the Event Loop, and every other request has to wait. As a result, the API becomes slow or times out.

- **Examples:** image or video processing, heavy hashing or encryption, large calculations or long loops, and parsing very large JSON or CSV files.
- **Solutions:** move the heavy work to Worker Threads, push jobs to a message queue (BullMQ, SQS) for background workers, or split it into a separate service written in Golang.

In short, Node.js is great for I/O-heavy work such as APIs, database access, and real-time apps, but it is weak for CPU-heavy work because long calculations block the main thread.

**Grammar / wording errors**


| #   | Của bạn                               | Lỗi (loại)                        | Đúng                                               | Giải thích ngắn                                                                                         |
| --- | ------------------------------------- | --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `NodeJS`                              | viết tên                          | **Node.js**                                        | Viết đúng tên chính thức                                                                                |
| 2   | `the system have`                     | hòa hợp chủ–vị                    | **the system has**                                 | Chủ ngữ số ít → `has`                                                                                   |
| 3   | `many CPU-heavy task`                 | số ít/nhiều                       | **many CPU-heavy tasks**                           | Sau `many` luôn là danh từ số nhiều                                                                     |
| 4   | `JS`                                  | viết tắt                          | **JavaScript**                                     | Phỏng vấn nên nói đầy đủ                                                                                |
| 5   | `must low caculate`                   | sai từ + thiếu động từ + chính tả | **needs a long calculation**                       | `low` = thấp; "lâu" là `long`, "chậm" là `slow`. `caculate` → `calculate`. Dùng `need + N` tự nhiên hơn |
| 6   | `…caculate. main thread is blocked`   | ngắt câu sai + thiếu mạo từ       | **…calculation, the main thread is blocked**       | Câu `If` phải đi liền mệnh đề chính, ngăn bằng dấu phẩy, không dùng dấu chấm; cần `the main thread`     |
| 7   | `event Loop doesn't run continoustly` | viết hoa + chính tả + chọn từ     | **the Event Loop cannot continue**                 | `continoustly` → `continuously`; viết `the Event Loop`; ý "không chạy tiếp được" → `cannot continue`    |
| 8   | `all different requests`              | chọn từ                           | **all other requests**                             | "Các request khác" → `other` (lặp lại lỗi ở Q3)                                                         |
| 9   | `must wait`                           | sắc thái                          | **have to wait**                                   | `must` = bắt buộc do người nói yêu cầu; `have to` = bị hoàn cảnh ép → hợp ngữ cảnh hơn                  |
| 10  | `Result is API low or timeout`        | thiếu từ nối + sai từ + từ loại   | **As a result, the API becomes slow or times out** | Dùng `As a result,`; `low` → `slow`; `timeout` là danh từ, động từ là `time out` → `times out`          |


**Mẫu cấu trúc nhớ nhanh**

```text
many + N (số nhiều)          →  many CPU-heavy tasks
If + S + V, S + V            →  If a request needs a long calculation, the main thread is blocked
As a result, S + V           →  As a result, the API becomes slow
timeout (n) / time out (v)   →  a timeout error / the API times out
low (thấp) · slow (chậm) · long (lâu)
```

**Q10.** How do you handle errors in async Node.js code?

**Answer:** 

---

## B. Comparisons (short answers)

**Q11.** Node.js vs Golang — concurrency

**Answer:**

**Q12.** Node.js vs Golang — typing and language design

**Answer:**

**Q13.** When do you choose Node.js vs Golang in a real project?

**Answer:**

**Q14.** `async/await` vs callbacks — why prefer `async/await`?

**Answer:**

**Q15.** Blocking vs non-blocking I/O

**Answer:**

**Q16.** Middleware vs interceptor (Express vs NestJS) — short difference

**Answer:**

**Q17.** REST vs GraphQL — when would you pick each?

**Answer:**

**Q18.** SQL vs NoSQL — when would you use PostgreSQL vs MongoDB?

**Answer:**

**Q19.** Index vs partitioning in PostgreSQL

**Answer:**

**Q20.** Vertical scaling vs horizontal scaling (e.g. on EC2)

**Answer:**

---

## C. Mini prompts (1–2 sentences only)

Write only **one or two sentences** for each:

1. Event Loop in one sentence:
2. Why connection pool matters with Node.js apps:
3. `require` vs `import` (CommonJS vs ESM) in one line:
4. What is middleware in Express?
5. How would you debug a slow Node.js API?

---

## Answer hints (optional — cover after you try)

A. Node.js — short sample answers

**Q1.** Node.js is an open-source runtime that runs JavaScript outside the browser. It is used to build backends, APIs, and real-time apps.

**Q2.** It has three main parts: V8 compiles and runs JS on the main thread; libuv handles async I/O via a thread pool; the Event Loop queues callbacks and runs them on the main thread.

**Q3.** Only the JS thread is single-threaded. Non-blocking I/O lets Node.js start DB/file/network work and serve other requests while waiting. The Event Loop runs callbacks when I/O finishes.

**Q4.** `var` is function-scoped and can be redeclared; `let` and `const` are block-scoped. Prefer `const` by default, `let` when you need reassignment, avoid `var`.

**Q5.** A Promise represents a future async result (`.then`/`.catch`). `async/await` is syntactic sugar over Promises so async code reads like sync code; errors use `try/catch`.

**Q6.** `all` waits for all and fails fast; `race` returns the first settled result; `allSettled` waits for all and reports each success/failure.

**Q7.** A closure is a function that remembers variables from its outer scope even after the outer function has returned. Example: a counter function that keeps `count` private.

**Q8.** Non-blocking I/O means Node.js does not wait for I/O to finish before doing other work; it uses the waiting time to handle other requests.

**Q9.** CPU-heavy work (heavy crypto, image processing, big loops) blocks the main thread and slows all requests. Prefer worker threads, a separate service, or Golang for that.

**Q10.** Use `try/catch` with `async/await`, or `.catch()` on Promises; in Express/Nest, use a central error middleware/filter so errors return a consistent response.

B. Comparisons — short sample answers

**Q11.** Node.js uses a single-threaded Event Loop (good for I/O). Golang uses goroutines and channels (often better for high concurrency / CPU-heavy work).

**Q12.** Node.js is dynamically typed; Golang is statically typed, uses structs + methods (no classes), and has explicit pointers.

**Q13.** Choose Node.js for fast API work and JS ecosystem teams; choose Golang for stronger performance, clearer concurrency, and stricter typing.

**Q14.** `async/await` is easier to read and debug than nested callbacks; it still runs on Promises underneath.

**Q15.** Blocking waits until the operation finishes; non-blocking starts the operation and continues other work until the result is ready.

**Q16.** In Express, middleware is a function in the request pipeline. In NestJS, interceptors wrap handler execution (before/after) and can transform results; both can log/auth/validate but sit at different layers.

**Q17.** REST is simple and standard for most CRUD APIs. GraphQL fits when clients need flexible queries and fewer round-trips for nested data.

**Q18.** PostgreSQL for relational data, transactions, and complex queries. MongoDB for flexible documents and fast iteration when schema changes often.

**Q19.** Indexes speed row lookup inside a table. Partitioning splits a large table into parts (often by time). Different problems; often used together.

**Q20.** Vertical = bigger machine (more CPU/RAM). Horizontal = more machines behind a load balancer / ASG.
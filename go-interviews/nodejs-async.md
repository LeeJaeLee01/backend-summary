# Bất đồng bộ NodeJS — Event Loop

## Tóm tắt một câu

NodeJS **single-thread** chạy JS trên **Event Loop** — I/O async không block thread. **Microtask** (Promise) chạy trước **macrotask** (setTimeout) sau mỗi phase. CPU nặng block cả loop — dùng worker thread / queue.

---

## Các thành phần

| Thành phần | Vai trò |
|------------|---------|
| **Call Stack** | Hàm đang chạy đồng bộ |
| **Heap** | Object allocation |
| **Event Loop** | Điều phối callback khi I/O xong |
| **Thread pool (libuv)** | File I/O, DNS, crypto CPU — default 4 threads |
| **Microtask Queue** | `Promise.then`, `queueMicrotask` |
| **Macrotask Queue** | `setTimeout`, `setImmediate`, I/O callback |

---

## Thứ tự chạy (đơn giản hóa)

1. Chạy sync code trên call stack đến hết.
2. Drain **microtask queue** hết (Promise callbacks).
3. Một **macrotask** (timer phase, I/O callback, …).
4. Lại drain microtasks.
5. Lặp.

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 1, 4, 3, 2
```

---

## So với Go

| | NodeJS | Go |
|---|--------|-----|
| Concurrency model | Event loop + thread pool | Goroutine (M:N scheduling) |
| CPU parallel | `worker_threads` | Goroutine trên nhiều OS thread |
| Blocking code | Block cả event loop | Block một goroutine |

---

## Anti-pattern

```javascript
// Block event loop 5 giây — mọi request đứng
const start = Date.now();
while (Date.now() - start < 5000) {}
```

Đưa CPU-heavy sang worker hoặc service riêng.

---

## Câu trả lời ngắn (phỏng vấn)

Node single-thread event loop; I/O async qua libuv. Promise (microtask) chạy trước setTimeout (macrotask). Không block loop bằng sync CPU. So Go: goroutine nhẹ, scheduler tự động — không cần event loop thủ công.

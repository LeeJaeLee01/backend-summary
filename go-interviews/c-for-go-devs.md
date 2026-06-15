# Hiểu biết code C (cho Go developer)

## Tóm tắt một câu

Go runtime và nhiều thư viện hệ thống liên quan **C**. Hiểu C giúp đọc **syscall, CGO, pointer, memory layout** — debug performance và tích hợp native lib.

---

## Khái niệm C cần biết

| Khái niệm | C | Go tương ứng |
|-----------|---|--------------|
| Pointer | `int *p` | `*int` — nhưng không pointer arithmetic tự do |
| malloc/free | Manual heap | GC |
| struct | Value layout | `struct` tương tự |
| header `.h` | Declaration | Package export |
| Stack vs heap | `malloc` → heap | Escape analysis |
| NULL | `NULL` | `nil` |

---

## Vì sao backend Go cần biết C?

- **CGO** gọi C library (OpenSSL legacy, codec).
- Đọc **man page**, **strace**, **pprof** label runtime.
- **Linux syscall** interface C (`epoll`, `fcntl`).
- Debug **memory leak** khi dùng CGO — C side không GC.

```go
// #include <stdio.h>
// import "C"
// C.printf(...)
```

CGO có cost — crossing boundary; ưu tiên pure Go khi có thể.

---

## Pointer & memory (C)

```c
int x = 10;
int *p = &x;   // địa chỉ của x
*p = 20;       // dereference
```

**Segment:** stack (local auto), heap (`malloc`), data/bss (global).

**UB:** use-after-free, buffer overflow — Go tránh phần lớn nhờ bounds check + GC.

---

## Câu trả lời ngắn (phỏng vấn)

Biết pointer, malloc/free, struct, header trong C giúp hiểu CGO và hệ thống dưới Go. Go có GC và không pointer arithmetic — an toàn hơn. Tránh CGO trừ khi cần lib C; nếu dùng phải quản lý memory C cẩn thận.

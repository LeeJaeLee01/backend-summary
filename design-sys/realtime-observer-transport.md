# Observer vs HTTPS vs WebSocket — Phân tầng & Realtime

> Tổng hợp cách phân biệt **design pattern** (Observer) với **giao thức truyền tải** (HTTPS, WebSocket) — tránh nhầm khi phỏng vấn.  
> Chi tiết pattern: [patterns/observer.md](./patterns/observer.md).

---

## 1. Ba thứ khác nhau — đừng so sánh lẫn lộn

| | **Observer** | **HTTPS** | **WebSocket** |
|---|--------------|-----------|---------------|
| **Loại** | Design pattern (GoF) | Giao thức (HTTP + TLS) | Giao thức (full-duplex) |
| **Tầng** | Application / code architecture | Network — transport + bảo mật | Network — transport realtime |
| **Giải quyết** | Publisher notify subscriber trong app | Mã hóa, xác thực khi truyền HTTP | Kênh 2 chiều, giữ kết nối mở |
| **Ví dụ** | `eventEmitter.emit('order.paid')` | `GET https://api.app.com/orders` | `wss://api.app.com/socket` |
| **Realtime push browser** | Không tự có — cần thêm transport | Không — client phải request (pull) | Có — server push qua socket |

**Công thức nhớ:**

```
Observer  = CÁCH tổ chức code (ai notify ai)
HTTPS     = CÁCH truyền HTTP an toàn
WebSocket = CÁCH giữ kết nối push/pull realtime
```

> Giống so “cách tổ chức nhà máy” với “đường cao tốc” — khác loại, thường **dùng cùng nhau**.

---

## 2. Observer — ôn nhanh

**Định nghĩa:** Subject (publisher) khi có sự kiện → **notify** tất cả Observer đã **đăng ký** — Subject không biết chi tiết từng Observer.

```
OrderService.emit('order.placed')
        │
        ├──► EmailListener
        ├──► AuditListener
        └──► WebSocketPushListener   ← listener mới, không sửa OrderService
```

### Có dùng cho notification realtime không?

**Có** — nhưng nói chính xác:

| Đúng | Không chính xác |
|------|-----------------|
| Publisher **không cần sửa** khi thêm kênh notify mới (OCP) | “Hoàn toàn không code thêm” |
| Observer **đăng ký** rồi nhận event | Observer tự đẩy xuống browser mà không cần WebSocket |
| Listener mới **vẫn phải viết code** | Observer = kiến trúc WebSocket |

**Câu phỏng vấn mẫu:**

> Observer giúp tách side effect: khi order paid, emit event — email, audit, push WS là các listener riêng. Thêm kênh Slack chỉ thêm listener, **không sửa** `OrderService`.

---

## 3. HTTPS — HTTP có mã hóa

```
Client  ═══ TLS encrypt ═══►  Server
        ◄══ response ═══════
```

| Đặc điểm | Mô tả |
|----------|--------|
| Mô hình | Request → Response (thường client **pull**) |
| Bảo mật | Mã hóa, chống nghe lén, certificate xác thực server |
| Realtime | **Không** — muốn update phải polling `GET /notifications` mỗi N giây |
| Dùng khi | REST API, form submit, upload — **mọi API public** |

**HTTPS không phải pattern** — không thay thế Observer.

---

## 4. WebSocket — kênh realtime

```
Client  ◄════════════════ persistent connection ════════════════►  Server
              (full-duplex — cả hai chiều gửi bất cứ lúc nào)
```

| Đặc điểm | Mô tả |
|----------|--------|
| Mô hình | Giữ kết nối — server **push** khi có data |
| Bảo mật | **WSS** = WebSocket over TLS (tương tự HTTPS) |
| So với HTTP | Không cần client hỏi lại liên tục |
| Dùng khi | Chat, live notification, dashboard live, game |

### Room (Socket.io) — giống Observer/Pub-Sub ở đâu?

```typescript
socket.join('order:123');                    // subscribe
io.to('order:123').emit('status', data);     // publish → mọi client trong room
```

```
Server emit ──► room "order:123"
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Client A    Client B    Client C   (đã join)
```

| Khái niệm | WebSocket Room | Observer / Pub-Sub |
|-----------|----------------|---------------------|
| Đăng ký | `join(room)` | `subscribe` / `@OnEvent` |
| Phát tin | `emit to room` | `notify` / `publish` |
| Phạm vi | **Qua mạng** — client ↔ server | Thường **in-process** hoặc qua queue |

> **WebSocket không phải kiến trúc Observer** — nhưng **room + broadcast** áp dụng **ý tưởng Pub/Sub**: nhiều subscriber cùng nhận, publisher không gọi từng client.

**Room** là abstraction của **Socket.io** — WebSocket thuần không có room sẵn.

---

## 5. So sánh tổng hợp

### 5.1. HTTPS vs Observer

| Tiêu chí | HTTPS | Observer |
|----------|-------|----------|
| Mục đích | Truyền an toàn | Tổ chức code lỏng coupling |
| Hướng | Client pull (request) | Publisher push tới listener |
| Cùng hệ thống? | **Có** — API HTTPS + Observer trong server |

### 5.2. HTTP/HTTPS vs WebSocket (realtime)

| Tiêu chí | HTTP/HTTPS | WebSocket (WSS) |
|----------|------------|-----------------|
| Kết nối | Ngắn, từng request | Dài, persistent |
| Server push | Không (trừ SSE) | Có |
| Client nhận update | Polling | Push ngay |
| Pattern liên quan | Không | Thường kết hợp Observer in-app |

### 5.3. Observer vs WebSocket

| Tiêu chí | Observer | WebSocket |
|----------|----------|-----------|
| Là gì | Pattern trong code | Protocol transport |
| Phạm vi | Trong app (hoặc queue) | Client trên internet |
| Realtime tới browser | Cần listener gọi WS Gateway | Trực tiếp push socket |
| Room | Không có | `join` / `emit to room` |

---

## 6. Kiến trúc kết hợp — NestJS thực tế

```
┌──────────┐   HTTPS POST    ┌─────────────────────────────────────────┐
│  Browser │ ──────────────► │  OrdersController                        │
└──────────┘                 │       │                                  │
                             │       ▼                                  │
                             │  OrdersService                           │
                             │       │                                  │
                             │       │ emit('order.placed')  ◄── Observer│
                             │       ▼                                  │
                             │  ┌────────────┬────────────┬──────────┐  │
                             │  │ Email      │ Audit      │ WsPush   │  │
                             │  │ Listener   │ Listener   │ Listener │  │
                             │  └────────────┴────────────┴────┬─────┘  │
                             └───────────────────────────────────│────────┘
                                                                 │
┌──────────┐   WSS (WebSocket + TLS)                              │
│  Browser │ ◄───────────────────────────────────────────────────┘
└──────────┘   io.to(`user:${userId}`).emit('notification', ...)
```

**Từng bước:**

1. Client đặt hàng qua **HTTPS** REST API
2. `OrdersService` lưu DB, **emit domain event** (Observer — `@nestjs/event-emitter`)
3. `WebSocketListener` nhận event → `gateway.to(room).emit(...)` (**WebSocket**)
4. Browser nhận notification **realtime** không cần polling

### Multi-pod (production)

Một user có thể nối **pod B**, event xử lý ở **pod A** → cần **Redis adapter** (Pub/Sub giữa các instance):

```
Pod A: emit event → Redis Pub/Sub → Pod B: broadcast tới socket của user
```

---

## 7. Các cách “realtime” khác (biết thêm khi phỏng vấn)

| Cách | Mô tả | So với WebSocket |
|------|--------|------------------|
| **Short polling** | `setInterval` gọi API | Đơn giản, tốn bandwidth, chậm |
| **Long polling** | Server giữ request đến khi có data | Ít dùng hơn trước |
| **SSE** | Server push một chiều (text stream) | Chỉ server→client, đủ cho feed đơn giản |
| **WebSocket** | 2 chiều | Chat, game, notification phức tạp |

---

## 8. Hiểu nhầm thường gặp

| Hiểu nhầm | Sự thật |
|-----------|---------|
| WebSocket = Observer pattern | WS là **protocol**; room/broadcast **gần Pub/Sub** |
| Observer tự push xuống browser | Cần **WebSocket/SSE** làm transport |
| HTTPS thay được Observer | Khác tầng — HTTPS **bảo mật truyền**, Observer **tổ chức code** |
| Thêm listener = không code gì | **Publisher** không sửa; **listener mới vẫn phải viết** |
| `emit` in-memory = đảm bảo gửi mail | Process crash → mất; production cần **queue / Outbox** |

---

## 9. Câu hỏi phỏng vấn & trả lời ngắn

### Q: Khác nhau HTTPS và Observer?

> HTTPS là giao thức truyền HTTP mã hóa — lo bảo mật trên đường truyền. Observer là pattern — lo publisher notify subscriber trong application. Khác tầng, thường dùng chung: client gọi HTTPS API, server xử lý xong emit event nội bộ.

### Q: WebSocket có phải Observer không?

> Không. WebSocket là protocol realtime. Room + broadcast **giống ý tưởng** subscribe/publish. Trong NestJS tôi kết hợp: domain event (Observer) → WebSocket Gateway push xuống room.

### Q: Làm notification realtime thế nào?

> REST HTTPS cho action (đặt hàng). Sau commit DB emit `order.placed`. Listener push qua WebSocket tới `user:{id}` room. Multi-instance dùng Redis adapter. Side effect nặng hoặc microservice: Outbox + SQS/Kafka.

### Q: Khi nào polling đủ, khi nào cần WebSocket?

> Polling đủ khi update không cần gần realtime (vài chục giây chấp nhận được), traffic thấp. WebSocket khi chat, live status, cần push ngay và giảm request lặp.

---

## 10. Tóm tắt một trang

```
Observer     →  Pattern: emit event, N listener, loose coupling (in-app)
HTTPS        →  Protocol: API an toàn, request/response, client pull
WebSocket    →  Protocol: kết nối dài, server push realtime
Room         →  Socket.io: nhóm subscriber (≈ topic Pub/Sub)

Luồng chuẩn:
  HTTPS (action) → Service → emit (Observer) → WS Gateway → WSS (notify client)
```

**Liên kết:**

| File | Nội dung |
|------|----------|
| [patterns/observer.md](./patterns/observer.md) | Pattern đầy đủ, Outbox, phỏng vấn Q&A |
| [patterns/index.md](./patterns/index.md) | Pattern trong NestJS |
| [language-framework/nestjs.md](../language-framework/nestjs.md) | Event tránh circular dependency |
| [database/transaction-consistency.md](../database/transaction-consistency.md) | Outbox pattern |

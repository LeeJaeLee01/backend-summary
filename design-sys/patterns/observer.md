# Observer Pattern

> **Observer** định nghĩa quan hệ **một-nhiều**: khi **Subject** (đối tượng được quan sát) đổi trạng thái, **tất cả Observer** đăng ký sẽ **tự động được thông báo** — Subject **không cần biết** Observer cụ thể là ai.

Liên quan: [patterns/index.md](./index.md) · [../realtime-observer-transport.md](../realtime-observer-transport.md) (Observer vs HTTPS vs WebSocket) · [nestjs.md](../../language-framework/nestjs.md) · [transaction-consistency.md](../../database/transaction-consistency.md) (Outbox) · `@nestjs/event-emitter`.

---

## 1. Khái niệm

### 1.1. Định nghĩa (GoF — Behavioral Pattern)

```
                    ┌─────────────────────┐
                    │      Subject        │
                    │  (Publisher)        │
                    │                     │
                    │  - observers[]      │
                    │  + attach(obs)      │
                    │  + detach(obs)      │
                    │  + notify()         │
                    └──────────┬──────────┘
                               │ notify(event)
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
   │  Observer A   │   │  Observer B   │   │  Observer C   │
   │  (email)      │   │  (analytics)  │   │  (audit log)  │
   │  + update()   │   │  + update()   │   │  + update()   │
   └───────────────┘   └───────────────┘   └───────────────┘
```

**Luồng:**

```
1. Observer đăng ký (subscribe) với Subject
2. Subject thay đổi / có sự kiện xảy ra
3. Subject gọi notify() → mỗi Observer nhận update
4. Observer xử lý độc lập — Subject không chờ kết quả (thường)
```

**Ba vai trò:**

| Vai trò | Tên khác | Trách nhiệm |
|---------|----------|-------------|
| **Subject** | Publisher, EventEmitter | Giữ danh sách observer, phát sự kiện |
| **Observer** | Subscriber, Listener, Handler | Phản ứng khi có sự kiện |
| **Event** | Message, Notification | Payload mô tả “chuyện gì vừa xảy ra” |

### 1.2. Publish–Subscribe (Pub/Sub) — biến thể thực tế

Observer cổ điển: Observer **biết** Subject.  
Pub/Sub hiện đại: Publisher và Subscriber **không biết nhau** — có **broker** ở giữa.

```
Observer (GoF):     Subject ──notify──► Observer (cùng process, gắn trực tiếp)

Pub/Sub:            Publisher ──► Topic/Queue ──► Subscriber A
                                      │              Subscriber B
                                      │              Subscriber C
                               (Kafka, RabbitMQ, SNS+SQS, Redis Pub/Sub)
```

> Phỏng vấn: **Observer là pattern**; **Pub/Sub là kiến trúc triển khai** — thường dùng message broker khi scale / microservice.

### 1.3. Phân biệt pattern liên quan

| Pattern / Khái niệm | Khác Observer ở đâu |
|---------------------|---------------------|
| **Observer** | 1 subject thông báo nhiều listener — **loose coupling** |
| **Mediator** | Nhiều object nói chuyện **qua trung gian** — không notify trực tiếp |
| **Chain of Responsibility** | Request **đi qua chuỗi** handler — 1 handler xử lý, không broadcast |
| **Strategy** | **Chọn 1** thuật toán — không broadcast cho tất cả |
| **Decorator** | **Bọc** 1 object — không publish event cho nhiều listener |
| **Saga** | Orchestrate **chuỗi bước** có compensation — distributed transaction |
| **CQRS** | Tách read/write — event thường là **domain event** sau write |

---

## 2. Mục đích — dùng để làm gì?

### 2.1. Khi nào nên dùng

| Vấn đề | Observer giải quyết |
|--------|---------------------|
| **Coupling chặt** | `OrderService` gọi trực tiếp Email + SMS + Analytics + Audit — sửa 1 chỗ đụng 4 service |
| **Mở rộng** | Thêm “gửi Slack khi order paid” — chỉ thêm listener, không sửa `OrderService` |
| **Circular dependency** | `UsersService` ↔ `OrdersService` — chuyển sang event `user.created` |
| **Side effect** | Gửi mail, push notification, update search index — **không** nhét vào transaction chính |
| **Microservice** | Order service publish `OrderPlaced` → Billing, Shipping subscribe |

**Ví dụ đời thường:**

```
Đặt hàng thành công (Subject)
  → gửi email xác nhận      (Observer)
  → trừ tồn kho             (Observer — hoặc service khác qua event)
  → ghi audit log           (Observer)
  → cập nhật dashboard BI   (Observer)
  → gửi message Kafka       (Observer / outbox worker)
```

### 2.2. Khi **không** nên dùng

```
❌ Luồng đồng bộ bắt buộc — client cần kết quả ngay từ tất cả bước
❌ Chỉ có 1 listener duy nhất, không đổi — gọi service trực tiếp đơn giản hơn
❌ Cần ACID cross-service trong 1 request — event = eventual consistency
❌ Event storm — quá nhiều listener sync trong cùng request → chậm, khó debug
❌ Không có idempotency — listener chạy 2 lần gây double charge / double email
```

---

## 3. Cách triển khai

### 3.1. Classic Observer (TypeScript)

```typescript
interface DomainEvent {
  type: string;
  occurredAt: Date;
  payload: unknown;
}

interface Observer {
  handle(event: DomainEvent): void | Promise<void>;
}

class EventBus implements Subject {
  private observers = new Map<string, Set<Observer>>();

  subscribe(eventType: string, observer: Observer): () => void {
    if (!this.observers.has(eventType)) {
      this.observers.set(eventType, new Set());
    }
    this.observers.get(eventType)!.add(observer);
    return () => this.observers.get(eventType)?.delete(observer); // unsubscribe
  }

  async publish(event: DomainEvent): Promise<void> {
    const listeners = this.observers.get(event.type) ?? new Set();
    await Promise.all([...listeners].map((o) => o.handle(event)));
  }
}
```

```typescript
class SendOrderEmailObserver implements Observer {
  async handle(event: DomainEvent) {
    if (event.type !== 'order.placed') return;
    const { orderId, email } = event.payload as { orderId: string; email: string };
    console.log(`send email for order ${orderId} to ${email}`);
  }
}

// Bootstrap
const bus = new EventBus();
bus.subscribe('order.placed', new SendOrderEmailObserver());

// OrderService — chỉ publish, không biết email
await bus.publish({
  type: 'order.placed',
  occurredAt: new Date(),
  payload: { orderId: 'ord_1', email: 'a@acme.com' },
});
```

### 3.2. Node.js `EventEmitter`

```typescript
import { EventEmitter } from 'events';

const orderEvents = new EventEmitter();

orderEvents.on('order.placed', async ({ orderId, email }) => {
  await sendEmail(email, `Order ${orderId} confirmed`);
});

orderEvents.emit('order.placed', { orderId: 'ord_1', email: 'a@acme.com' });
```

> Cùng process, in-memory — **mất event khi restart**, không dùng cho microservice production một mình.

### 3.3. NestJS — `@nestjs/event-emitter`

Pattern Observer **trong monolith** NestJS — tránh circular dependency giữa module.

```typescript
// app.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
})
export class AppModule {}
```

```typescript
// orders.service.ts — Publisher
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async placeOrder(dto: PlaceOrderDto) {
    const order = await this.repo.save(dto);

    this.eventEmitter.emit('order.placed', {
      orderId: order.id,
      customerId: order.customerId,
      total: order.total,
    });

    return order;
  }
}
```

```typescript
// notifications.listener.ts — Observer
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsListener {
  constructor(private readonly mailer: MailerService) {}

  @OnEvent('order.placed')
  async handleOrderPlaced(payload: { orderId: string; customerId: string }) {
    await this.mailer.sendOrderConfirmation(payload.orderId, payload.customerId);
  }
}
```

```typescript
// analytics.listener.ts — Observer thứ 2, không sửa OrdersService
@Injectable()
export class AnalyticsListener {
  @OnEvent('order.placed')
  async trackOrder(payload: { orderId: string; total: number }) {
    await this.metrics.increment('orders.placed', payload.total);
  }
}
```

**Lưu ý NestJS `@OnEvent`:**

| Mặc định | Hành vi |
|----------|---------|
| Sync | `emit()` chờ listener xong (trừ async fire-and-forget tùy config) |
| Error | Listener lỗi có thể ảnh hưởng flow — cần try/catch trong listener |
| Scope | Listener là `@Injectable()` — inject DI bình thường |

### 3.4. Domain Events (DDD)

Event mang **ngôn ngữ nghiệp vụ** — quá khứ (`OrderPlaced`, không `PlaceOrder`):

```typescript
export class OrderPlacedEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly total: number,
    readonly occurredAt: Date = new Date(),
  ) {}
}

// Trong aggregate / service sau khi commit DB
this.eventEmitter.emit('order.placed', new OrderPlacedEvent(...));
```

**Quy tắc:**

```
□ Event = đã xảy ra (past tense)
□ Payload đủ context — listener không gọi ngược repo nếu tránh được
□ Publish SAU khi state đã persist (hoặc dùng Outbox)
```

### 3.5. Production scale — Message Queue (Pub/Sub thật)

In-process Observer **không đủ** khi:

- Nhiều service / nhiều pod
- Cần retry, dead-letter queue (DLQ)
- Listener chậm (gửi mail 2s) không được block API

```
Order API (Publisher)
      │ INSERT order + INSERT outbox (cùng transaction)
      ▼
 Outbox Worker ──publish──► Kafka / RabbitMQ / AWS SNS+SQS
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Email Svc      Inventory Svc    Analytics Svc
              (Subscriber)   (Subscriber)     (Subscriber)
```

**Outbox pattern** — đảm bảo event không mất sau DB commit:

```sql
-- Cùng transaction với INSERT order
INSERT INTO orders (...) VALUES (...);
INSERT INTO outbox (event_type, payload, created_at)
  VALUES ('order.placed', '{"orderId":"..."}', now());
```

Worker đọc `outbox` → publish queue → đánh dấu `processed`.

> Chi tiết: [transaction-consistency.md](../../database/transaction-consistency.md).

---

## 4. Ứng dụng thực tế (mang đi phỏng vấn)

| Hệ thống | Observer / Event dùng thế nào |
|----------|-------------------------------|
| **E-commerce** | `OrderPaid` → email, invoice, shipping, loyalty points |
| **SaaS signup** | `UserRegistered` → welcome email, CRM, analytics, provision tenant |
| **Payment** | Webhook Stripe → publish nội bộ → cập nhật order, notify user |
| **Microservice** | Order MS publish Kafka → Inventory, Billing consume |
| **Cache invalidation** | `ProductUpdated` → Redis xóa key, CDN purge |
| **Audit / compliance** | Mọi `*.created`, `*.deleted` → audit log listener |
| **NestJS monolith** | `@OnEvent` thay `forwardRef` circular dependency |
| **Frontend** | RxJS `subscribe`, React state, DOM `addEventListener` — cùng tinh thần Observer |
| **DB** | PostgreSQL `LISTEN/NOTIFY`, trigger — DB-level notify |
| **Git / CI** | Webhook GitHub push → pipeline chạy — publisher/subscriber |

---

## 5. Sync vs Async — câu hỏi phỏng vấn hay gặp

| | **Sync (in-process)** | **Async (queue)** |
|---|----------------------|-------------------|
| **Ví dụ** | NestJS `EventEmitter`, gọi service trực tiếp | Kafka, SQS, BullMQ |
| **Consistency** | Cùng process, dễ debug | **Eventual consistency** |
| **Failure** | Listener lỗi có thể làm fail request | Retry + DLQ |
| **Scale** | 1 instance | Nhiều consumer, horizontal scale |
| **Khi dùng** | Side effect nhẹ, monolith | Microservice, side effect nặng/chậm |

**Câu trả lời mẫu:**

> “Trong monolith tôi dùng domain event in-process (`@OnEvent`) để tách side effect khỏi use case chính. Khi cần đảm bảo không mất event sau commit DB hoặc khi tách microservice, tôi chuyển sang **Outbox + message queue** — vẫn là Observer/Pub-Sub nhưng broker ở giữa và xử lý async.”

---

## 6. Best practices & pitfalls

### 6.1. Idempotency

Listener có thể chạy **2 lần** (retry, at-least-once delivery):

```typescript
@OnEvent('order.paid')
async handleOrderPaid({ orderId }: { orderId: string }) {
  const alreadySent = await this.repo.wasEmailSent(orderId);
  if (alreadySent) return;

  await this.mailer.send(...);
  await this.repo.markEmailSent(orderId);
}
```

### 6.2. Không nhét business chính vào listener

```
❌ Listener tính giá đơn hàng, trừ stock trong @OnEvent — khó transaction
✅ Use case chính trong Service (sync, có transaction)
✅ Listener: email, metrics, projection, integration
```

### 6.3. Đặt tên event rõ

```
✅ order.placed, order.paid, user.registered
❌ doSomething, handleOrder, event1
```

### 6.4. Tránh event spaghetti

```
⚠️ A emit → B listen → B emit → C listen → C emit → A listen (vòng lặp)
✅ Event flow một chiều theo domain
✅ Sơ đồ event catalog cho team
```

---

## 7. Observer giải quyết Circular Dependency (NestJS)

```
❌ UsersService inject OrdersService
   OrdersService inject UsersService

✅ UsersService emit('user.created')
   OrdersService @OnEvent('user.created')
   → không inject 2 chiều
```

Đúng như [nestjs.md](../../language-framework/nestjs.md) — event là cách phòng tránh `forwardRef`.

---

## 8. Câu hỏi phỏng vấn & cách trả lời

### Q1: Observer pattern là gì?

> Một object (Subject) duy trì danh sách người quan tâm (Observers). Khi state đổi hoặc có sự kiện, Subject **notify** tất cả Observer — Subject **không phụ thuộc** class cụ thể của Observer, giúp **loose coupling** và **mở rộng** (thêm listener mới không sửa publisher).

### Q2: Khác Pub/Sub thế nào?

> Observer là **pattern OOP** — thường in-process, Subject biết Observer (attach/detach). Pub/Sub thêm **broker/topic** — publisher và subscriber **decouple hoàn toàn**, phù hợp distributed system. Thực tế backend hay nói “event-driven” = Observer + Pub/Sub + queue.

### Q3: Khi nào dùng event thay vì gọi service trực tiếp?

> Khi có **nhiều side effect** độc lập, cần **thêm listener sau** không sửa code cũ (OCP), hoặc tránh **circular dependency**. Không dùng khi cần **kết quả đồng bộ** từ tất cả bước trong 1 request.

### Q4: `emit` trong NestJS có đảm bảo gửi mail không?

> **Không** nếu chỉ in-memory và process crash sau `emit`. Production cần: listener try/catch, queue async, hoặc **Outbox** (ghi event cùng transaction DB rồi worker publish).

### Q5: Eventual consistency là gì?

> Sau `order.placed`, email/inventory có thể cập nhật **vài giây sau** — hệ thống **cuối cùng** cũng nhất quán, không cần 1 transaction ACID cross-service. Trade-off để scale và tách service.

### Q6: Làm sao tránh gửi email 2 lần?

> **Idempotent consumer**: dedupe key (`orderId` + `eventType`), bảng `processed_events`, hoặc unique constraint trên business id.

### Q7: Observer vs Mediator?

> Observer: Subject **broadcast** cho nhiều listener. Mediator: các colleague **không nói trực tiếp** — mọi thứ qua mediator (chat room). Event bus có thể đóng vai mediator.

### Q8: Ví dụ thực tế bạn từng làm?

> Chuẩn bị 1 ví dụ STAR ngắn:
>
> *“Sau khi user đặt hàng, tôi emit `order.placed`. Listener gửi email và push analytics. Ban đầu dùng `@nestjs/event-emitter` trong monolith. Khi tách notification service, chuyển sang Outbox + SQS — Order API chỉ ghi DB + outbox, worker publish message, notification service subscribe.”*

---

## 9. Ưu & nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Loose coupling — OCP | Khó trace flow (debug “ai emit gì”) |
| Thêm listener dễ | Eventual consistency — phức tạp hơn sync |
| Tách side effect | Listener lỗi / duplicate nếu không idempotent |
| Giảm circular dependency | Event spaghetti nếu không governance |
| Scale ra queue / MS | Thêm hạ tầng (Kafka, worker, DLQ) |

---

## 10. Checklist khi áp dụng

```
□ Event đặt tên domain, quá khứ (order.placed)
□ Publish sau persist — hoặc Outbox cùng transaction
□ Listener idempotent
□ Side effect nặng → async queue, không block API
□ Không business rule cốt lõi trong listener
□ Log correlation id (trace emit → handle)
□ Có event catalog / diagram cho team
□ Test: publish event → assert listener được gọi (mock EventEmitter)
```

---

## 11. Tóm tắt — mang đi phỏng vấn

| Câu hỏi | Trả lời 1 câu |
|---------|----------------|
| **Observer là gì?** | Subject notify nhiều Observer khi có thay đổi — không coupling cứng |
| **Mục đích?** | Tách side effect, mở rộng listener, giảm circular dependency |
| **NestJS?** | `@nestjs/event-emitter` + `@OnEvent()` |
| **Production?** | Outbox + Kafka/SQS/RabbitMQ — Pub/Sub async |
| **Trade-off?** | Loose coupling đổi lấy eventual consistency + debug khó hơn |
| **Khác Strategy?** | Observer **broadcast** nhiều handler; Strategy **chọn 1** implementation |

**Công thức nhớ:**

```
1 subject, N listeners, loose coupling     →  Observer
Monolith NestJS, side effect nhẹ           →  EventEmitter + @OnEvent
Microservice / không mất event / async     →  Outbox + Message Queue (Pub/Sub)
Phỏng vấn: nói được sync vs async + idempotency + eventual consistency
```

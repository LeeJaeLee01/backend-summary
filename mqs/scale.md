# Scale ngang WebSocket / Socket Service

> **Câu hỏi hay gặp:** Queue scale bằng **competing consumers** (stateless) — còn **WebSocket** giữ **kết nối dài, có state** trên từng instance. Scale ngang socket cần **sticky session + shared pub/sub** (thường Redis) hoặc **tách tầng connection** khỏi business logic.

Liên quan: [competing-consumers.md](./competing-consumers.md) · [index.md](./index.md) · [../design-sys/realtime-observer-transport.md](../design-sys/realtime-observer-transport.md) · [../aws/sqs.md](../aws/sqs.md).

---

## 1. Vì sao socket khó scale hơn queue?

### 1.1. Queue worker vs Socket server

| | **Queue consumer** | **WebSocket server** |
|---|-------------------|----------------------|
| **State** | Stateless — xử lý xong là xong | **Stateful** — client gắn 1 TCP connection tới 1 instance |
| **Scale** | Thêm instance → chia message | Thêm instance → client mới phân tán; **push cross-instance** cần thêm lớp |
| **Load balancer** | Round-robin OK | Cần **sticky** hoặc client reconnect |
| **Broadcast** | Không cần (1 msg → 1 worker) | User A ở pod B, event ở pod A → **phải relay** |

```
Queue (stateless):
  [msg1][msg2] ──► Instance A | B | C  ← ai rảnh nhận, không care client ở đâu

Socket (stateful):
  Client X ═══════════════► Instance B only
  Event "notify X" xử lý ở Instance A  →  A không có socket của X  →  CẦN RELAY
```

### 1.2. Ba thách thức chính

```
1. Connection affinity   — client phải (hoặc nên) nối đúng instance / reconnect được
2. Cross-instance push — emit tới user:123 khi user đang ở pod khác
3. Room / presence       — ai đang online, join room nào — phải đồng bộ giữa các pod
```

> Chi tiết Observer + WS transport: [realtime-observer-transport.md](../design-sys/realtime-observer-transport.md).

---

## 2. Kiến trúc chuẩn — Sticky + Redis Adapter

Pattern phổ biến nhất với **Socket.io / NestJS WebSocket Gateway** trên K8s hoặc ECS.

```
                         ┌─────────────┐
Client ──WSS──► ALB/NGINX (sticky cookie) ──► Pod A | Pod B | Pod C
                         │                    │       │       │
                         │                    └───┬───┴───┬───┘
                         │                        │       │
                         │                   ┌────▼───────▼────┐
                         │                   │  Redis Pub/Sub  │  ◄── adapter
                         │                   │  (hoặc Streams) │
                         │                   └────────┬────────┘
                         │                            │
              HTTPS API ─┴──► Order Service ──emit──► WsListener
                              (bất kỳ pod)         publish Redis
```

**Luồng:**

```
1. Client connect WSS → LB sticky → Pod B (giữ connection)
2. Client join room user:42 trên Pod B
3. Order API (Pod A) xử lý đặt hàng → emit order.placed
4. WsListener trên Pod A: io.to('user:42').emit(...)
5. Redis adapter broadcast → Pod B nhận → gửi xuống socket client
```

---

## 3. Từng thành phần

### 3.1. Load Balancer — Sticky Session

Client WebSocket **không nên** bị đổi instance giữa chừng (trừ khi có Redis adapter + client tự reconnect).

| LB | Cấu hình |
|----|----------|
| **AWS ALB** | Target group: stickiness enabled (duration 1 ngày) |
| **NGINX** | `ip_hash` hoặc `hash $cookie_io` |
| **K8s Ingress** | `nginx.ingress.kubernetes.io/affinity: cookie` |

```
□ Bật stickiness cho path /socket.io (hoặc /ws)
□ Health check: HTTP /health — không dùng WS làm health
□ Idle timeout ALB ≥ heartbeat interval (thường 60s+)
□ WSS (TLS) terminate tại LB hoặc ingress
```

**Không sticky được** (một số môi trường): vẫn chạy được nếu **Redis adapter** đủ tốt — client reconnect sau disconnect ngắn.

### 3.2. Redis Adapter (Socket.io)

Mỗi pod chỉ giữ socket **local**; emit tới room được **publish** qua Redis, mọi pod subscribe và gửi tới client local của họ.

```typescript
// NestJS + Socket.io — main.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

```typescript
// packages/nestjs — WebSocketGateway
@WebSocketGateway({ cors: true, namespace: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  pushToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
```

```
Pod A: io.to('user:42').emit('order.placed', data)
         │
         ▼ Redis PUBLISH (adapter channel)
Pod B: nhận → tìm socket user:42 local → gửi xuống client
```

| Lựa chọn Redis | Khi dùng |
|----------------|----------|
| **Pub/Sub adapter** | Broadcast room — default Socket.io |
| **Redis Streams / riêng** | Audit, replay (hiếm cần cho notify) |
| **ElastiCache Redis** | AWS production — cluster mode nếu scale lớn |

### 3.3. Room naming & join

```typescript
// Client connect — xác thực JWT trước khi join
@SubscribeMessage('subscribe')
handleSubscribe(client: Socket, { orderId }: { orderId: string }) {
  // Chỉ join nếu user có quyền xem order
  client.join(`order:${orderId}`);
  client.join(`user:${client.data.userId}`);
}
```

```
Room convention:
  user:{userId}     — notification cá nhân
  order:{orderId}   — tracking đơn hàng
  tenant:{tenantId} — dashboard multi-tenant
```

**Presence (ai online):** Redis SET `online:{userId}` TTL + heartbeat; hoặc Socket.io admin UI / custom adapter metadata.

### 3.4. Tách API và Socket (khuyến nghị production)

```
┌──────────────┐     HTTPS      ┌──────────────┐
│   Browser    │ ─────────────► │  API Service │  (stateless — scale dễ)
└──────┬───────┘                └──────┬───────┘
       │ WSS                         │ emit / SQS
       ▼                               ▼
┌──────────────┐                ┌──────────────┐
│ WS Gateway   │ ◄── Redis ──── │ Event bus    │
│ (chỉ socket) │                │ SNS/SQS/Redis│
└──────────────┘                └──────────────┘
```

- **API pods:** REST, DB, business logic — scale như service thường
- **WS pods:** nhẹ, tối ưu connection count, scale theo số connection
- **Event:** domain event qua queue → WS worker consume → push (decouple hoàn toàn)

---

## 4. Pattern scale theo quy mô

### 4.1. Nhỏ — 1 instance

```
1 pod NestJS (API + WS in-process)
EventEmitter → WsGateway.to(room).emit
```

Đủ POC / MVP. **Không** scale ngang.

### 4.2. Vừa — N pod + Redis adapter

```
N pod cùng code (API + WS hoặc WS riêng)
Redis adapter + ALB sticky
@OnEvent / EventEmitter nội bộ pod → Redis relay cross-pod
```

Đủ hầu hết startup / mid-size. **Pattern phỏng vấn hay nhất.**

### 4.3. Lớn — WS tier riêng + Message Queue

```
Order MS ──► SNS/SQS/Kafka ──► Notification Worker ──► Redis ──► WS Gateway pods
```

| Lợi ích | Giải thích |
|---------|------------|
| Decouple | Order crash không kéo WS |
| Buffer | Burst event — SQS giữ, WS push từ từ |
| Scale độc lập | 3 API pod, 20 WS pod |
| Multi-region | Event bus cross-region (phức tạp hơn) |

```typescript
// WS consumer — đọc từ SQS, push socket
export async function handleSqsRecord(record: SQSRecord) {
  const event = JSON.parse(record.body);
  const payload = JSON.parse(event.Message ?? record.body);

  io.to(`user:${payload.userId}`).emit(payload.eventType, payload.data);
}
```

> Queue semantics: [at-least-once.md](./at-least-once.md) — push WS **idempotent** (client dedupe `eventId`).

### 4.4. Managed — AWS API Gateway WebSocket

```
Client ◄──WSS──► API Gateway WebSocket API
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
      Lambda       Lambda       DynamoDB
      $connect     custom       connectionId ↔ userId
      $disconnect  route
```

| Ưu | Nhược |
|----|-------|
| Không tự quản lý connection pod | Vendor lock-in, model khác Socket.io |
| Scale AWS lo | `@connections` API để push — phải map user → connectionId |
| Pay per message | Cold start Lambda, giới hạn connection time |

Phù hợp serverless thuần; team quen Socket.io thường chọn Redis + ECS/K8s.

---

## 5. Scale số connection — chiều ngang vs dọc

### 5.1. Mỗi instance chịu bao nhiêu connection?

Phụ thuộc RAM, CPU, kernel `ulimit`, Node event loop:

| Gợi ý thực tế (Node + Socket.io) | Giá trị |
|----------------------------------|---------|
| Conservative | 5k–10k connection / pod |
| Tuned (uWS, cluster) | 20k–50k+ |
| Bottleneck thường gặp | RAM per socket, broadcast fan-out CPU |

```
□ Tăng file descriptor: ulimit -n
□ Node cluster mode (1 process / CPU) — mỗi worker Redis adapter riêng
□ Monitor: connection count, event loop lag, Redis pub/sub latency
```

### 5.2. Scale ngang

```
Metric scale (HPA):
  - active_connections / pod > 70% threshold → thêm pod
  - CPU (ít tin cậy hơn với WS idle)
  - Custom metric từ Prometheus: socket_io_connected_clients
```

```
10k users online, 5k conn/pod  →  2 WS pod minimum + headroom → 3–4 pod
```

### 5.3. Graceful shutdown (K8s rolling update)

```
SIGTERM → ngừng nhận connection mới
       → đóng LB target (drain)
       → báo client reconnect (server disconnect reason)
       → chờ in-flight emit xong (timeout 30s)
       → kill pod
```

```typescript
// Socket.io — gợi ý
process.on('SIGTERM', () => {
  io.close(() => process.exit(0));
});
```

Client **phải** có reconnect + exponential backoff.

---

## 6. Bảo mật & vận hành khi scale

```
□ Auth lúc handshake — JWT query/header, không trust client tự khai báo userId
□ Rate limit connect / message per IP (Redis sliding window)
□ WSS bắt buộc production
□ CORS / origin check cho Socket.io
□ Không broadcast sensitive data tới room sai — validate join server-side
□ Redis ACL + VPC private — adapter channel không public internet
□ Correlation ID trong event push — client trace
```

---

## 7. So sánh hướng scale

| Hướng | Scale connection | Cross-pod push | Độ phức tạp |
|-------|------------------|----------------|-------------|
| 1 instance | ❌ | N/A | Thấp |
| N pod + sticky, không Redis | ⚠️ | ❌ push miss | Thấp — **sai production** |
| **N pod + Redis adapter** | ✅ | ✅ | Trung bình — **default** |
| WS tier + SQS/Kafka | ✅ | ✅ | Cao — scale lớn |
| API Gateway WebSocket | ✅ (managed) | ✅ (DynamoDB map) | Trung bình — serverless |

---

## 8. Anti-pattern

```
❌ Round-robin WS không sticky, không Redis — user mất event ngẫu nhiên
❌ Lưu map userId → socketId trong memory pod — pod khác không thấy
❌ Broadcast toàn cluster mỗi event — O(N²) khi N pod lớn (dùng room/targeted emit)
❌ Nhét business logic nặng trong WS handler — block event loop, giảm connection capacity
❌ Scale WS pod mà không scale Redis — adapter thành bottleneck
❌ Tin client room join không auth — leak data cross-tenant
```

---

## 9. Sơ đồ end-to-end (NestJS production)

```
┌─────────┐  POST /orders (HTTPS)   ┌─────────────────────────────────────┐
│ Browser │ ───────────────────────►│ API Pod (OrdersService)              │
└────┬────┘                         │   save DB → emit('order.placed')     │
     │                              └──────────────────┬──────────────────┘
     │ WSS + sticky                                  │
     ▼                                                 ▼
┌─────────────┐                              ┌─────────────────┐
│ WS Pod      │◄──── Redis adapter ──────────│ WsListener      │
│ user:42 ◄───┤      pub/sub                 │ (mọi API pod)   │
└─────────────┘                              └─────────────────┘

Multi-service (micro):
  Order MS → Outbox → SNS → SQS → Notification MS → Redis → WS Gateway
```

---

## 10. Câu hỏi phỏng vấn

### Q: Scale ngang WebSocket thế nào?

> WebSocket **stateful** — mỗi client gắn một instance. Scale bằng **nhiều pod** + **load balancer sticky** + **Redis Pub/Sub adapter** (Socket.io) để emit tới room/user hoạt động cross-instance. Event business có thể tách qua **SQS/Kafka** → worker push WS. Graceful shutdown + client reconnect khi rolling deploy.

### Q: Khác gì scale queue worker?

> Queue consumer **stateless** — competing consumers, 1 message 1 worker ([competing-consumers.md](./competing-consumers.md)). Socket phải giữ connection và **relay push** giữa instance — cần shared pub/sub hoặc connection registry (DynamoDB với API Gateway WS).

### Q: User connect pod A, event xử lý pod B — làm sao push?

> `io.to('user:id').emit()` với **Redis adapter**: pod B publish, pod A (nơi giữ socket) nhận qua Redis và gửi client. Không cần B biết socketId trên A.

### Q: Khi nào tách WS service riêng?

> Khi connection > vài chục nghìn, hoặc API và WS scale khác nhau, hoặc microservice — event qua queue, WS tier chỉ lo push. Giảm blast radius khi deploy API.

### Q: Redis adapter vs Kafka fan-out tới WS?

> Redis adapter: **low latency broadcast** trong cluster WS — cùng data center. Kafka: **durable event**, nhiều consumer, replay — phù hợp pipeline Order → Notification → WS. Thường **kết hợp**: Kafka/SQS vào notification service, service đó emit qua Redis tới WS pods.

---

## 11. Checklist triển khai

```
□ ALB/ingress sticky cho WSS
□ Redis adapter (ElastiCache) — HA, persistence không bắt buộc cho adapter
□ JWT auth handshake — room join server-side authorize
□ Client reconnect + backoff
□ Graceful shutdown SIGTERM
□ HPA theo connection count (custom metric)
□ Tách API vs WS khi traffic lớn
□ Event nặng / cross-MS → SQS/Kafka, không block WS thread
□ Monitor: connections, Redis latency, emit errors, event loop lag
□ Load test: 10k concurrent connect + broadcast storm
```

---

## 12. Tóm tắt — mang đi phỏng vấn

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Socket stateful?** | Có — connection gắn instance |
| **Scale ngang?** | N pod + **sticky LB** + **Redis adapter** |
| **Cross-pod emit?** | Redis Pub/Sub (Socket.io adapter) |
| **Tách service?** | API stateless; WS tier; event qua queue |
| **Khác queue scale?** | Queue: competing consumer; Socket: relay + affinity |

**Công thức nhớ:**

```
Stateful connection     →  sticky session + reconnect client
Emit cross-instance     →  Redis adapter (hoặc DynamoDB + API GW WS)
Business scale          →  queue (SQS/Kafka) → WS worker push
Không scale được        →  1 pod, không Redis, round-robin WS
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [competing-consumers.md](./competing-consumers.md) | Scale queue — stateless worker |
| [realtime-observer-transport.md](../design-sys/realtime-observer-transport.md) | Observer + WSS, multi-pod Redis |
| [../aws/sqs.md](../aws/sqs.md) | Event → consumer → push WS |
| [../design-sys/patterns/observer.md](../design-sys/patterns/observer.md) | Domain event → listener push |

---

*Tài liệu tham khảo: [Socket.io Redis adapter](https://socket.io/docs/v4/redis-adapter/), [AWS API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html).*

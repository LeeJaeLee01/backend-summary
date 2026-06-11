# Inbox Pattern

> **Inbox** — lưu **message đã nhận** vào bảng `inbox` và xử lý **trong cùng transaction** (hoặc dedup trước khi xử lý). Chống **xử lý trùng** khi broker giao **at-least-once**.

Liên quan: [index.md](./index.md) · [outbox.md](./outbox.md) · [saga.md](./saga.md) · [at-least-once.md](../../mqs/at-least-once.md).

---

## 1. Khái niệm

### 1.1. Vấn đề Inbox giải quyết

Message queue (SQS, Kafka, RabbitMQ) thường **at-least-once** — consumer có thể nhận **cùng message 2 lần**:

```
Consumer nhận msg eventId=abc → xử lý → charge $100
Crash trước ack → nhận lại msg abc → charge $100 LẦN 2 ❌
```

**Inbox** — ghi `message_id` / `event_id` vào DB **trước hoặc cùng** business logic:

```
Nhận message
  → INSERT inbox (event_id) ON CONFLICT → skip (đã xử lý)
  → xử lý business
  → ack message
```

### 1.2. Outbox vs Inbox

| | **Outbox** | **Inbox** |
|---|------------|-----------|
| **Phía** | **Producer** (gửi) | **Consumer** (nhận) |
| **Vấn đề** | Mất event sau DB commit | Xử lý trùng message |
| **Bảng** | `outbox` — chờ publish | `inbox` / `processed_events` — đã nhận |
| **Kết hợp** | Producer Outbox + Consumer Inbox = **effectively-once** |

```
Producer                    Consumer
────────                    ────────
orders + outbox  ──queue──►  inbox + business logic
     │ relay                         │
     └──────── publish ──────────────┘
```

---

## 2. Dùng để làm gì?

| Mục đích | Giải thích |
|----------|------------|
| **Idempotent consumption** | Cùng `eventId` chỉ xử lý 1 lần |
| **At-least-once an toàn** | Retry broker không double charge |
| **Audit trail** | Biết message nào đã xử lý, khi nào |
| **Saga step** | Mỗi service consumer dedup step event |
| **Webhook ingress** | Partner gửi trùng webhook |

**Không cần Inbox khi:**

```
❌ At-most-once chấp nhận mất (metric)
❌ Operation tự nhiên idempotent (SET status=paid WHERE status=pending)
❌ Chỉ đọc, không ghi side effect
```

> Dù vậy, **explicit inbox** rõ ràng hơn implicit idempotency — dễ audit.

---

## 3. Schema & triển khai

### 3.1. Bảng inbox / processed_events

```sql
-- Cách 1: processed_events (đơn giản — dedup only)
CREATE TABLE processed_events (
  event_id      VARCHAR(128) PRIMARY KEY,
  event_type    VARCHAR(128) NOT NULL,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cách 2: inbox (lưu full message — audit + retry)
CREATE TABLE inbox (
  id            BIGSERIAL PRIMARY KEY,
  message_id    VARCHAR(128) NOT NULL UNIQUE,
  event_type    VARCHAR(128) NOT NULL,
  payload       JSONB NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  status        VARCHAR(32) NOT NULL DEFAULT 'pending' -- pending | done | failed
);

CREATE INDEX idx_inbox_pending ON inbox (received_at) WHERE status = 'pending';
```

### 3.2. Pattern A — Dedup đơn giản (phổ biến nhất)

```typescript
async function handleMessage(msg: { eventId: string; orderId: string }) {
  await db.transaction(async (tx) => {
    const inserted = await tx.query(
      `INSERT INTO processed_events (event_id, event_type)
       VALUES ($1, 'order.placed')
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [msg.eventId],
    );

    if (!inserted.rows.length) {
      return; // đã xử lý — ack message anyway
    }

    await tx.query(
      `UPDATE orders SET status = 'confirmed' WHERE id = $1`,
      [msg.orderId],
    );
  });
}
```

### 3.3. Pattern B — Inbox + process (2 phase)

**Phase 1:** Lưu inbox (nhanh, ack sớm)  
**Phase 2:** Worker xử lý `status=pending`

```typescript
// SQS consumer — phase 1
async function ingest(raw: SqsMessage) {
  const outer = JSON.parse(raw.Body!);
  const payload = JSON.parse(outer.Message);
  const messageId = payload.eventId ?? raw.MessageId;

  await db.query(
    `INSERT INTO inbox (message_id, event_type, payload)
     VALUES ($1, $2, $3)
     ON CONFLICT (message_id) DO NOTHING`,
    [messageId, payload.eventType, JSON.stringify(payload)],
  );

  await sqs.deleteMessage(...); // ack
}

// Worker — phase 2
@Cron('*/2 * * * * *')
async function processInbox() {
  const rows = await db.query(
    `SELECT id, payload FROM inbox
     WHERE status = 'pending'
     ORDER BY id LIMIT 50
     FOR UPDATE SKIP LOCKED`,
  );

  for (const row of rows.rows) {
    try {
      await applyBusinessLogic(JSON.parse(row.payload));
      await db.query(`UPDATE inbox SET status = 'done', processed_at = now() WHERE id = $1`, [row.id]);
    } catch (e) {
      await db.query(`UPDATE inbox SET status = 'failed' WHERE id = $1`, [row.id]);
    }
  }
}
```

| Pattern | Khi dùng |
|---------|----------|
| **A — dedup only** | Logic nhanh, ít message |
| **B — inbox queue** | Xử lý nặng, cần retry độc lập với SQS visibility |

### 3.4. NestJS SQS consumer

```typescript
@Injectable()
export class OrderPlacedConsumer {
  constructor(private readonly db: DataSource) {}

  async handle(record: SQSRecord) {
    const event = JSON.parse(JSON.parse(record.body).Message);

    await this.db.transaction(async (tx) => {
      const { rowCount } = await tx.query(
        `INSERT INTO processed_events (event_id, event_type) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [event.eventId, event.eventType],
      );
      if (rowCount === 0) return;

      await this.confirmOrder(tx, event.orderId);
    });
  }
}
```

### 3.5. Kết hợp Outbox producer

```
Order Svc:  outbox → relay → SNS → SQS
Payment Svc: SQS consumer → inbox/processed_events → charge()
```

`event_id` trong outbox payload = key dedup ở inbox consumer.

---

## 4. Dùng ở đâu trong hệ thống?

| Vị trí | Vai trò |
|--------|---------|
| **Consumer microservice** | Entry point mọi message từ queue |
| **Webhook handler** | Dedup `X-Webhook-Id` / `eventId` |
| **Saga participant** | Mỗi service listen event — inbox trước khi step |
| **Không** ở producer | Producer dùng [outbox.md](./outbox.md) |

```
                    SNS/SQS/Kafka
                          │
                          ▼
┌─────────────────────────────────────────┐
│           Payment Microservice           │
│  Consumer → Inbox/dedup → Business logic │
└─────────────────────────────────────────┘
```

---

## 5. Khi nào dùng Inbox?

| Tình huống | Dùng Inbox? |
|------------|-------------|
| SQS/Kafka at-least-once + ghi DB | **Có** |
| Charge payment, trừ stock | **Có** — bắt buộc |
| `UPDATE ... WHERE status='pending'` atomic | Có thể không — nhưng inbox + audit tốt hơn |
| Read-only projection | Tùy — dup rebuild có thể chấp nhận |
| Outbox relay worker publish | Dedup `event_id` khi publish (tránh dup trên bus) |

---

## 6. Inbox vs Idempotency key API

| | **Inbox (async)** | **Idempotency-Key (HTTP)** |
|---|-------------------|----------------------------|
| **Kênh** | Queue, webhook async | REST API sync |
| **Lưu** | `processed_events` / `inbox` | `idempotency_keys` table |
| **Mục đích** | Chống dup message broker | Chống dup client retry POST |

Cả hai có thể cùng tồn tại trong 1 hệ thống.

---

## 7. Lưu ý production

```
□ message_id / event_id từ producer — UUID stable (outbox.event_id)
□ ON CONFLICT DO NOTHING trong transaction với business logic
□ Ack SQS SAU khi inbox + business commit (pattern A)
□ Hoặc ack sau ingest, xử lý async (pattern B) — chấp nhận inbox pending
□ Cleanup processed_events / archive inbox cũ
□ Monitor: inbox pending quá lâu, failed count
□ Test: gửi cùng eventId 2 lần — chỉ 1 side effect
```

---

## 8. Effectively-once end-to-end

```
Producer:
  BEGIN → business + outbox → COMMIT
  Relay → publish(event_id)

Broker:
  at-least-once delivery

Consumer:
  BEGIN → INSERT processed_events(event_id) ON CONFLICT skip
       → business
       → COMMIT
  ACK message
```

→ Người dùng cảm nhận **xử lý đúng 1 lần**.

---

## 9. Tóm tắt — phỏng vấn

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Inbox là gì?** | Lưu message đã nhận — dedup trước/sau xử lý |
| **Giải quyết gì?** | At-least-once → duplicate processing |
| **Ai dùng?** | **Consumer** / service nhận từ queue |
| **Khác Outbox?** | Outbox = producer gửi; Inbox = consumer nhận |
| **Kết hợp?** | Outbox + Inbox = effectively-once |

**Công thức nhớ:**

```
Producer mất event     →  Outbox
Consumer dup message   →  Inbox / processed_events
Cả pipeline            →  Outbox + Inbox
Multi-service TX       →  Saga (+ Outbox/Inbox mỗi service)
```

# Outbox Pattern

> **Outbox** — ghi **event vào bảng `outbox` trong cùng transaction** với business data, rồi **worker riêng publish** sang queue/Kafka. Đảm bảo: **DB commit thành công → event chắc chắn được gửi** (không mất do crash sau commit).

Liên quan: [index.md](./index.md) · [inbox.md](./inbox.md) · [saga.md](./saga.md) · [transaction-consistency.md](../../database/transaction-consistency.md).

---

## 1. Khái niệm

### 1.1. Vấn đề Outbox giải quyết

**Dual write problem** — 2 thao tác không atomic:

```
❌ Cách sai — race / mất data
await db.commit(order);
await kafka.publish('order.placed', order);  // crash ở đây → DB có, event mất

await kafka.publish(...);  // publish OK
await db.commit(order);    // DB fail → event đã bay, DB không có
```

**Outbox** — chỉ **1 write** vào DB (data + outbox), publish **sau**:

```
✅ Cùng transaction
BEGIN;
  INSERT INTO orders ...;
  INSERT INTO outbox (event_type, payload) ...;
COMMIT;

Worker (sau đó):
  SELECT * FROM outbox WHERE published_at IS NULL
  → publish Kafka/SQS
  → UPDATE published_at = now()
```

### 1.2. Diagram

```
┌──────────────┐                    ┌──────────────┐
│ Order Service│                    │   Database   │
│              │─── 1 transaction ─►│ orders       │
│              │                    │ outbox       │
└──────────────┘                    └──────┬───────┘
                                           │
                                    2. poll outbox
                                           ▼
                                    ┌──────────────┐
                                    │ Outbox Worker│
                                    │ (cron/Lambda)│
                                    └──────┬───────┘
                                           │ 3. publish
                                           ▼
                                    ┌──────────────┐
                                    │ Kafka / SQS  │
                                    └──────────────┘
```

| Vai trò | Mô tả |
|---------|--------|
| **Producer (API)** | Ghi business + outbox — **không** gọi broker trực tiếp |
| **Outbox table** | Hàng đợi event durable trong DB |
| **Relay worker** | Đọc outbox → publish → đánh dấu đã gửi |

---

## 2. Dùng để làm gì?

| Mục đích | Giải thích |
|----------|------------|
| **Không mất event** | Sau commit, event nằm trong outbox — worker retry publish |
| **DB + message atomic (app-level)** | Cùng transaction — hoặc cùng không |
| **Tách microservice** | Order MS chỉ ghi DB; service khác consume queue |
| **Thay `emit()` in-process** | Khi cần durable cross-service |
| **Saga choreography** | Mỗi step commit + outbox event cho bước tiếp |

**Không cần Outbox khi:**

```
❌ Chỉ in-process @OnEvent — monolith, mất event khi crash chấp nhận được
❌ Event không critical (metric)
❌ Chỉ ghi DB, không publish đi đâu
❌ Đã dùng CDC (Debezium) đọc WAL — biến thể khác của outbox
```

---

## 3. Schema & triển khai

### 3.1. Bảng outbox

```sql
CREATE TABLE outbox (
  id            BIGSERIAL PRIMARY KEY,
  event_id      UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  event_type    VARCHAR(128) NOT NULL,
  aggregate_id  VARCHAR(128) NOT NULL,
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ,
  retry_count   INT NOT NULL DEFAULT 0,
  last_error    TEXT
);

CREATE INDEX idx_outbox_unpublished
  ON outbox (created_at)
  WHERE published_at IS NULL;
```

### 3.2. Producer — cùng transaction

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly dataSource: DataSource) {}

  async placeOrder(dto: PlaceOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.save(Order, { ...dto, status: 'pending' });

      await manager.query(
        `INSERT INTO outbox (event_type, aggregate_id, payload)
         VALUES ($1, $2, $3)`,
        [
          'order.placed',
          order.id,
          JSON.stringify({
            orderId: order.id,
            customerId: order.customerId,
            total: order.total,
            occurredAt: new Date().toISOString(),
          }),
        ],
      );

      return order;
    });
    // Không gọi SNS/Kafka ở đây
  }
}
```

### 3.3. Relay worker — poll & publish

```typescript
@Injectable()
export class OutboxRelayService {
  constructor(
    private readonly db: DataSource,
    private readonly sns: SNSClient,
  ) {}

  @Cron('*/5 * * * * *') // mỗi 5 giây
  async relay() {
    const rows = await this.db.query(
      `SELECT id, event_id, event_type, payload
       FROM outbox
       WHERE published_at IS NULL
       ORDER BY id
       LIMIT 100
       FOR UPDATE SKIP LOCKED`,
    );

    for (const row of rows.rows) {
      try {
        await this.sns.send(
          new PublishCommand({
            TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN!,
            Message: row.payload,
            MessageAttributes: {
              eventType: { DataType: 'String', StringValue: row.event_type },
              eventId: { DataType: 'String', StringValue: row.event_id },
            },
          }),
        );

        await this.db.query(
          `UPDATE outbox SET published_at = now() WHERE id = $1`,
          [row.id],
        );
      } catch (err) {
        await this.db.query(
          `UPDATE outbox SET retry_count = retry_count + 1, last_error = $2 WHERE id = $1`,
          [row.id, String(err)],
        );
      }
    }
  }
}
```

```
□ FOR UPDATE SKIP LOCKED — nhiều worker relay song song
□ Publish idempotent — event_id làm dedup key phía consumer (inbox)
□ Alarm: outbox unpublished quá lâu, retry_count cao
```

### 3.4. Biến thể: Transactional Outbox + Debezium (CDC)

```
DB WAL → Debezium → Kafka (đọc thay đổi bảng outbox)
```

- Worker poll **không** cần — CDC push
- Phức tạp hơn — phù hợp team có Kafka Connect

---

## 4. Dùng ở đâu trong hệ thống?

| Vị trí | Vai trò |
|--------|---------|
| **Producer service** | Mỗi MS có `outbox` table trong **DB riêng** |
| **Sau use case ghi DB** | `OrderService`, `UserService` — không trong Controller |
| **Relay worker** | Module riêng, cron, Lambda, hoặc ECS sidecar |
| **Không** ở consumer | Consumer dùng [inbox.md](./inbox.md) |

```
┌─────────────────────────────────────────┐
│              Order Microservice          │
│  API → Service → DB (orders + outbox)   │
│  OutboxRelay → SNS/SQS/Kafka            │
└─────────────────────────────────────────┘
                    │
                    ▼
            Other microservices (Inbox)
```

---

## 5. Khi nào dùng Outbox?

| Tình huống | Dùng Outbox? |
|------------|--------------|
| Monolith + `@OnEvent` in-memory | Không (hoặc khi cần durable) |
| DB commit + gửi SQS/Kafka | **Có** |
| Tách MS, event-driven | **Có** |
| Saga step emit event | **Có** — mỗi service |
| Chỉ REST sync giữa 2 service | Không bắt buộc (nhưng vẫn cần idempotency) |

---

## 6. Outbox vs các cách khác

| Cách | So với Outbox |
|------|---------------|
| Publish sau commit (không outbox) | Crash → **mất event** |
| Publish trước commit | Event có, DB không → **tệ hơn** |
| **Inbox** (consumer) | Bổ sung — chống dup **nhận**, Outbox chống **mất gửi** |
| **Saga** | Nhiều bước — mỗi bước có thể dùng Outbox |
| 2PC | Strong consistency — phức tạp, hiếm dùng |

---

## 7. Lưu ý production

```
□ event_id unique — consumer dedup
□ event_type naming: order.placed (past tense)
□ payload version / schemaVersion
□ Không nhét payload > vài trăm KB — S3 reference
□ Cleanup published rows (archive sau N ngày)
□ Monitor lag: now() - created_at WHERE published_at IS NULL
□ Relay failure không rollback business — business đã commit
□ Test: kill API sau commit, trước relay — event vẫn publish sau
```

---

## 8. Tóm tắt — phỏng vấn

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Outbox là gì?** | Ghi event vào DB cùng business TX → worker publish |
| **Giải quyết gì?** | Dual write — không mất event sau commit |
| **Ai dùng?** | **Producer** / service ghi DB + cần emit event |
| **Ai relay?** | Worker poll outbox → Kafka/SQS/SNS |
| **Kết hợp Inbox?** | Outbox đảm bảo gửi; Inbox đảm bảo consumer không dup |

**Công thức nhớ:**

```
Ghi DB + publish event  →  Outbox (cùng transaction)
Đừng publish trực tiếp sau commit mà không outbox
Consumer at-least-once  →  thêm Inbox
```

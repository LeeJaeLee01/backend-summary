# Amazon SQS (Simple Queue Service)

> **SQS** là dịch vụ **message queue** managed của AWS: **producer** gửi message vào **Queue**, **consumer** **poll** (kéo) message ra xử lý — decouple, buffer, retry, scale worker độc lập.

Liên quan: [sns.md](./sns.md) · [lambda.md](./lambda.md) · [Observer / Pub/Sub](../design-sys/patterns/observer.md) · [realtime-observer-transport.md](../design-sys/realtime-observer-transport.md).

---

## 1. SQS là gì?

### 1.1. Định nghĩa một câu

**Amazon SQS** = **hàng đợi message** trên cloud — message được **lưu** trong queue cho đến khi consumer xử lý xong và **xóa** (delete).

```
Producer (API, worker)          Consumer (ECS, Lambda, EC2)
        │                                ▲
        │ SendMessage                    │ ReceiveMessage (poll)
        ▼                                │
┌───────────────────────────────────────────────┐
│              SQS Queue                        │
│   [msg1] [msg2] [msg3] ...                    │
│   retention: 4 ngày (mặc định, max 14 ngày)   │
└───────────────────────────────────────────────┘
```

**Không phải:**
- Pub/Sub fan-out 1 message → nhiều subscriber (đó là **SNS**)
- Stream có replay theo offset (đó là **Kinesis** / **Kafka**)
- Database lưu trạng thái business

**Là:**
- **Buffer** giữa producer nhanh và consumer chậm
- **Decouple** service — producer không cần biết consumer đang chạy hay không
- **Retry** tự nhiên qua visibility timeout + DLQ

### 1.2. Ba thành phần chính

| Thành phần | Vai trò |
|------------|---------|
| **Queue** | Hàng đợi logic — `order-processing`, `email-jobs` |
| **Producer** | Gửi message — API sau khi tạo order, Outbox worker |
| **Consumer** | Poll message, xử lý, delete — ECS task, Lambda, NestJS worker |

---

## 2. Cách hoạt động

### 2.1. Luồng cơ bản

```
1. Tạo Queue (một lần)
2. Producer: SendMessage(payload)
3. Message nằm trong queue (durable — replicate across AZ)
4. Consumer: ReceiveMessage → message trở thành "in-flight" (ẩn tạm)
5. Xử lý thành công → DeleteMessage
6. Xử lý thất bại / timeout → message hiện lại → consumer khác retry
```

```typescript
// Producer — AWS SDK v3
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'ap-southeast-1' });
const QUEUE_URL = 'https://sqs.ap-southeast-1.amazonaws.com/123456789/order-processing';

await sqs.send(
  new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify({
      orderId: 'ord_1',
      customerId: 'c1',
      total: 99.5,
    }),
    MessageAttributes: {
      eventType: { DataType: 'String', StringValue: 'order.placed' },
    },
  }),
);
```

```typescript
// Consumer — long polling (khuyến nghị)
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'ap-southeast-1' });

const { Messages } = await sqs.send(
  new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10,       // batch tối đa 10
    WaitTimeSeconds: 20,           // long polling — giảm empty receive
    VisibilityTimeout: 60,         // giây message ẩn sau khi nhận
    MessageAttributeNames: ['All'],
  }),
);

for (const msg of Messages ?? []) {
  try {
    const payload = JSON.parse(msg.Body ?? '{}');
    await processOrder(payload);
    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: msg.ReceiptHandle!,
      }),
    );
  } catch (err) {
    // Không delete → sau VisibilityTimeout message quay lại queue
    console.error('Failed', msg.MessageId, err);
  }
}
```

### 2.2. Visibility Timeout — khái niệm quan trọng nhất

Khi consumer **ReceiveMessage**, message **biến mất tạm** khỏi queue (các consumer khác không thấy).

```
t=0    Consumer A nhận msg1 (visibility = 60s)
t=10   A đang xử lý...
t=30   A crash — chưa DeleteMessage
t=60   visibility hết → msg1 hiện lại → Consumer B nhận retry
```

| Cấu hình | Gợi ý |
|----------|-------|
| **VisibilityTimeout** | ≥ thời gian xử lý p99 × 1.5 — nếu quá ngắn → duplicate processing |
| **Quá dài** | Message kẹt lâu khi consumer chết — cân nhắc heartbeat `ChangeMessageVisibility` |

```typescript
// Worker xử lý lâu — gia hạn visibility trong lúc chạy
import { ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs';

await sqs.send(
  new ChangeMessageVisibilityCommand({
    QueueUrl: QUEUE_URL,
    ReceiptHandle: msg.ReceiptHandle!,
    VisibilityTimeout: 120,
  }),
);
```

### 2.3. Delivery semantics

| Mô hình | SQS |
|---------|-----|
| **At-least-once** | Standard queue — message có thể xử lý **trùng** |
| **Exactly-once** (processing) | **FIFO queue** + deduplication ID |
| **Ordering** | Standard: **không** đảm bảo; FIFO: đúng thứ tự trong message group |
| **Pull** | Consumer **chủ động poll** — không push như SNS |

> **Idempotency bắt buộc** ở consumer — không tin "chỉ nhận 1 lần".

### 2.4. Short polling vs Long polling

| | Short (`WaitTimeSeconds=0`) | Long (`WaitTimeSeconds=1–20`) |
|---|----------------------------|-------------------------------|
| Hành vi | Trả về ngay (có thể rỗng) | Chờ message mới tới tối đa N giây |
| Chi phí | Nhiều request rỗng → tốn API call | Ít request hơn |
| Khi dùng | Hầu như không | **Luôn dùng** production (`20`) |

---

## 3. Standard vs FIFO Queue

| | **Standard** | **FIFO** |
|---|--------------|----------|
| Tên queue | `my-queue` | `my-queue.fifo` (bắt buộc suffix `.fifo`) |
| Throughput | Không giới hạn thực tế | 300 msg/s (batch: 3000/s) |
| Ordering | Best-effort | **Strict FIFO** trong message group |
| Duplicate | Có thể | **Deduplication** (5 phút window) |
| Use case | Job độc lập, email, resize image | Thanh toán tuần tự, inventory theo `orderId` |

**FIFO — Message Group ID:**

```typescript
await sqs.send(
  new SendMessageCommand({
    QueueUrl: FIFO_QUEUE_URL,
    MessageBody: JSON.stringify({ orderId: 'ord_1', step: 'charge' }),
    MessageGroupId: 'ord_1',           // cùng group → xử lý tuần tự
    MessageDeduplicationId: 'ord_1-charge-v1', // hoặc bật ContentBasedDeduplication
  }),
);
```

```
orderId=ord_1:  charge → ship → notify  (tuần tự)
orderId=ord_2:  charge → ship            (song song với ord_1)
```

---

## 4. SQS vs SNS — hay nhầm nhất

| | **SQS** | **SNS** |
|---|---------|---------|
| **Mô hình** | **Queue** — 1 message thường 1 consumer | **Pub/Sub** — 1 message → N subscriber |
| **Delivery** | Consumer **pull** | SNS **push** tới subscriber |
| **Lưu trữ** | Có — retention 1–14 ngày | Không lưu lâu — fire-and-notify |
| **Fan-out** | Không native | Core feature |
| **Buffer** | Có — chống burst | Không — cần SQS giữa SNS và worker |

### Pattern phổ biến: SNS + SQS

```
Order API ──► SNS Topic ──► SQS (email)     ──► Email worker
                        └──► SQS (inventory) ──► Stock worker
```

> Chi tiết SNS: [sns.md](./sns.md).

**Chỉ dùng SQS (không SNS) khi:** 1 producer → 1 loại worker, job queue nội bộ, rate limiting.

---

## 5. Dead Letter Queue (DLQ)

Message xử lý fail **nhiều lần** → chuyển sang **DLQ** để không block queue chính.

```
Main Queue ──(receiveCount > maxReceiveCount)──► DLQ
                                                    │
                                                    ▼
                                            Ops / replay / alert
```

```yaml
# CloudFormation / SAM — redrive policy
OrderQueue:
  Type: AWS::SQS::Queue
  Properties:
    VisibilityTimeout: 60
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt OrderDLQ.Arn
      maxReceiveCount: 5    # fail 5 lần → DLQ

OrderDLQ:
  Type: AWS::SQS::Queue
  Properties:
    MessageRetentionPeriod: 1209600  # 14 ngày
```

```
□ DLQ riêng cho mỗi main queue quan trọng
□ Alarm CloudWatch: ApproximateNumberOfMessagesVisible trên DLQ > 0
□ Tool replay: script đọc DLQ → gửi lại main queue sau khi fix bug
□ Không xóa DLQ message trước khi điều tra root cause
```

---

## 6. Lambda làm SQS consumer

Lambda **poll SQS thay bạn** — scale theo số message, batch processing.

```
SQS Queue ──(event source mapping)──► Lambda (batch 1–10 msg)
         ◄── partial batch failure ──┘
```

```javascript
// lambda.md — partial batch failure
export const handler = async (event) => {
  const failures = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      await processMessage(payload);
    } catch (err) {
      failures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures: failures }; // chỉ retry message lỗi
};
```

| Cấu hình Lambda + SQS | Gợi ý |
|-----------------------|-------|
| **Batch size** | 5–10 — cân bằng throughput vs blast radius |
| **Function timeout** | < visibility timeout queue |
| **Reserved concurrency** | Giới hạn Lambda khi downstream (DB) không chịu burst |
| **ReportBatchItemFailures** | Bật — tránh retry cả batch khi 1 msg lỗi |
| **DLQ** | Gắn DLQ trên queue (không chỉ Lambda DLQ async) |

> Chi tiết deploy Lambda: [lambda.md](./lambda.md).

---

## 7. Tích hợp trong backend (NestJS / Node.js)

### 7.1. Producer sau business logic

```typescript
// OrderService — gửi job sau khi commit DB
@Injectable()
export class OrderService {
  constructor(private readonly sqs: SQSClient) {}

  async createOrder(dto: CreateOrderDto) {
    const order = await this.orderRepo.save(dto);

    await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.ORDER_QUEUE_URL!,
        MessageBody: JSON.stringify({
          orderId: order.id,
          occurredAt: new Date().toISOString(),
        }),
      }),
    );

    return order;
  }
}
```

### 7.2. Outbox pattern (an toàn hơn)

Tránh: DB commit thành công nhưng `SendMessage` fail → mất event.

```sql
-- Cùng transaction
INSERT INTO orders (...) VALUES (...);
INSERT INTO outbox (event_type, payload) VALUES ('order.placed', '...');
```

```
Outbox poller (cron / worker) ──► SQS ──► Consumer services
```

### 7.3. Worker loop (ECS / EC2)

```typescript
async function runWorker() {
  while (true) {
    const { Messages } = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }),
    );

    if (!Messages?.length) continue;

    await Promise.all(Messages.map(handleMessage));
  }
}
```

```
□ Graceful shutdown: SIGTERM → dừng poll, chờ in-flight xong
□ Health check: process alive + có thể reach SQS
□ Concurrency: 1 pod × N parallel handle — không vượt DB connection pool
```

---

## 8. Giới hạn & pricing (tóm tắt)

| Giới hạn | Giá trị |
|----------|---------|
| Message size | **256 KB** max |
| Payload lớn | Lưu S3 → queue chỉ gửi pointer (S3 key) |
| Retention | 1 phút – **14 ngày** (mặc định 4 ngày) |
| Delay queue | 0–15 phút — trì hoãn delivery |
| In-flight | Standard: không giới hạn; FIFO: 120,000 (in-flight + backlog) |

**Pricing (ý niệm):**
- Request pricing — mỗi `Send`, `Receive`, `Delete` tính phí
- Long polling giảm số request rỗng
- Free tier: 1 triệu request/tháng (luôn free)

---

## 9. Bảo mật & vận hành

### 9.1. IAM

```json
// Producer — chỉ Send vào queue cụ thể
{
  "Effect": "Allow",
  "Action": ["sqs:SendMessage", "sqs:GetQueueUrl"],
  "Resource": "arn:aws:sqs:ap-southeast-1:123456789:order-processing"
}

// Consumer — Receive + Delete
{
  "Effect": "Allow",
  "Action": [
    "sqs:ReceiveMessage",
    "sqs:DeleteMessage",
    "sqs:ChangeMessageVisibility",
    "sqs:GetQueueAttributes"
  ],
  "Resource": "arn:aws:sqs:ap-southeast-1:123456789:order-processing"
}
```

```
□ Queue policy — cho phép SNS gửi vào (khi SNS → SQS)
□ Encryption at rest — SSE-SQS hoặc KMS
□ Không expose queue URL public — URL không phải secret nhưng cần IAM
```

### 9.2. SNS → SQS subscription policy

```json
{
  "Effect": "Allow",
  "Principal": { "Service": "sns.amazonaws.com" },
  "Action": "sqs:SendMessage",
  "Resource": "arn:aws:sqs:...:order-email-queue",
  "Condition": {
    "ArnEquals": {
      "aws:SourceArn": "arn:aws:sns:...:order-placed"
    }
  }
}
```

### 9.3. Monitoring

| Metric CloudWatch | Ý nghĩa |
|-------------------|---------|
| `ApproximateNumberOfMessagesVisible` | Backlog — queue đang dài |
| `ApproximateAgeOfOldestMessage` | Message cũ nhất chờ bao lâu |
| `NumberOfMessagesReceived` / `Deleted` | Throughput consumer |
| `ApproximateNumberOfMessagesNotVisible` | In-flight (đang xử lý) |

```
Alarm: AgeOfOldestMessage > 5 phút → scale consumer hoặc điều tra
Alarm: DLQ visible > 0 → page on-call
```

---

## 10. Use case thực tế

| Hệ thống | SQS làm gì |
|----------|------------|
| **Async job** | Resize ảnh, gửi email, generate PDF |
| **Rate limiting** | API nhận request nhanh → queue → worker xử lý ổn định |
| **Microservice decouple** | Order MS gửi job, Shipping MS consume |
| **Burst traffic** | Flash sale — buffer thay vì overwhelm DB |
| **Retry + DLQ** | Payment gateway timeout → retry tự động |
| **Scheduled work** | Kết hợp EventBridge → SQS → worker |
| **Lambda trigger** | Serverless consumer không cần server poll |

**Anti-pattern:**

```
□ Dùng SQS làm database — query, join không được
□ Message > 256KB không dùng S3 reference
□ Consumer không idempotent — duplicate gây double charge
□ Visibility timeout << thời gian xử lý — duplicate storm
```

---

## 11. SQS vs dịch vụ khác

| Dịch vụ | Khác SQS |
|---------|----------|
| **SNS** | Push fan-out — không buffer lâu |
| **EventBridge** | Event bus + routing rule — không phải job queue thuần |
| **Kinesis** | Stream ordered shards, replay, analytics |
| **Kafka (MSK)** | Consumer group, log retention dài, ops nặng hơn |
| **Redis (ElastiCache)** | In-memory, nhanh — không durable như SQS |

**Chọn SQS khi:** managed queue, AWS native, job async, buffer đơn giản, tích hợp Lambda/SNS.

**Chọn Kafka/Kinesis khi:** replay, throughput cực cao, stream processing, ordering phức tạp.

---

## 12. Triển khai nhanh (AWS CLI)

```bash
REGION=ap-southeast-1

# Tạo DLQ trước
DLQ_URL=$(aws sqs create-queue \
  --queue-name order-processing-dlq \
  --region "$REGION" \
  --query 'QueueUrl' --output text)

DLQ_ARN=$(aws sqs get-queue-attributes \
  --queue-url "$DLQ_URL" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' --output text)

# Main queue + redrive
QUEUE_URL=$(aws sqs create-queue \
  --queue-name order-processing \
  --attributes "{
    \"VisibilityTimeout\": \"60\",
    \"ReceiveMessageWaitTimeSeconds\": \"20\",
    \"RedrivePolicy\": \"{\\\"deadLetterTargetArn\\\":\\\"$DLQ_ARN\\\",\\\"maxReceiveCount\\\":\\\"5\\\"}\"
  }" \
  --region "$REGION" \
  --query 'QueueUrl' --output text)

# Gửi thử
aws sqs send-message \
  --queue-url "$QUEUE_URL" \
  --message-body '{"orderId":"ord_1"}' \
  --region "$REGION"

# Nhận thử
aws sqs receive-message \
  --queue-url "$QUEUE_URL" \
  --wait-time-seconds 20 \
  --region "$REGION"
```

---

## 13. Checklist triển khai production

```
□ Long polling WaitTimeSeconds = 20
□ VisibilityTimeout ≥ p99 processing time
□ DLQ + maxReceiveCount (3–5)
□ Consumer idempotent (unique key / processed_events table)
□ Payload JSON: eventType, occurredAt, correlationId
□ Message > 256KB → S3 reference
□ IAM least privilege — producer không Receive
□ CloudWatch alarm: backlog + DLQ + age of oldest
□ Graceful shutdown cho long-running worker
□ FIFO chỉ khi thật sự cần ordering
□ IaC (SAM/CDK/Terraform) — không chỉnh tay Console
□ Load test: burst → verify scale consumer + không mất message
```

---

## 14. Tóm tắt — mang đi phỏng vấn

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **SQS là gì?** | AWS **managed message queue** — producer send, consumer poll |
| **Khác SNS?** | SQS **pull + buffer**; SNS **push fan-out** |
| **At-least-once?** | Standard: có — consumer phải **idempotent** |
| **Visibility timeout?** | Message ẩn tạm sau Receive — hết hạn thì retry |
| **DLQ?** | Queue chứa message fail quá `maxReceiveCount` |
| **FIFO?** | Ordering + dedup — throughput thấp hơn |
| **SNS + SQS?** | Fan-out + buffer — pattern phổ biến nhất |

**Công thức nhớ:**

```
1 worker xử lý 1 job, cần buffer/retry     →  SQS
1 event, N service cần biết                →  SNS → SQS (mỗi service 1 queue)
Xử lý tuần tự theo orderId                 →  FIFO + MessageGroupId
Fail nhiều lần, không block queue chính    →  DLQ
Consumer serverless                         →  Lambda event source mapping
DB commit + gửi event an toàn              →  Outbox → SQS
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [sns.md](./sns.md) | Fan-out Pub/Sub — thường kết hợp SQS |
| [lambda.md](./lambda.md) | Lambda consumer SQS, partial batch failure |
| [Observer](../design-sys/patterns/observer.md) | Pattern Pub/Sub trong code |
| [mono-micro.md](../design-sys/mono-micro.md) | Tách service — event qua queue |

---

*Tài liệu tham khảo: [Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html), [SQS FIFO](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html).*

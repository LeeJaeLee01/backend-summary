# Lambda + SQS — Event source mapping

> Lambda làm **SQS consumer** — AWS poll queue thay bạn, scale theo backlog. Khái niệm SQS tổng quát: [`../sqs.md`](../sqs.md).

---

## 1. Kiến trúc

```
Producer ──SendMessage──► SQS Queue ──(event source mapping)──► Lambda
                              │                                      │
                              └── DLQ (redrive) ◄── fail nhiều lần ──┘
```

| So với EC2 worker poll SQS | Lambda + SQS |
|----------------------------|--------------|
| Bạn viết vòng `while(true) ReceiveMessage` | AWS quản lý poll + scale |
| Scale = thêm pod/EC2 | Scale tự động theo message |
| Chi phí server 24/7 | Pay per invocation |

---

## 2. Event source mapping

**Event source mapping** = cấu hình gắn queue → function.

| Thuộc tính | Gợi ý |
|------------|-------|
| **Batch size** | 1–10 (SQS standard) — cân bằng throughput vs blast radius |
| **Batch window** | 0–300 s — gom message trước khi invoke |
| **Maximum concurrency** | Giới hạn concurrent Lambda cho mapping này |
| **Function response types** | `ReportBatchItemFailures` — partial batch failure |

```yaml
# SAM
ProcessOrderFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/sqs-handler.handler
    Events:
      OrderQueue:
        Type: SQS
        Properties:
          Queue: !GetAtt OrderQueue.Arn
          BatchSize: 10
          FunctionResponseTypes:
            - ReportBatchItemFailures
```

---

## 3. Handler — partial batch failure

Không bật partial failure → **1 message lỗi = retry cả batch**.

```javascript
// src/sqs-handler.js
export const handler = async (event) => {
  const failures = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      await processMessage(payload);
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        messageId: record.messageId,
        err: err.message,
      }));
      failures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures: failures };
};

async function processMessage(payload) {
  // idempotent — at-least-once delivery
}
```

```
□ Consumer idempotent (dedupe key / processed_events table)
□ Log messageId để trace
□ Không throw ra ngoài handler — chỉ list failures
```

---

## 4. Cấu hình timing — quan trọng

```
Lambda timeout  <  SQS visibility timeout  <  6 × Lambda timeout (best practice AWS)

Ví dụ:
  Lambda timeout = 60s
  Visibility timeout = 90s (hoặc 360s nếu xử lý lâu)
```

| Sai cấu hình | Hậu quả |
|--------------|---------|
| Visibility **<** processing time | Message hiện lại khi đang xử lý → **duplicate** |
| Lambda timeout **>** visibility | Message retry trước khi Lambda kết thúc → duplicate |
| Không DLQ | Message fail mãi → block queue |

**FIFO queue:** Lambda xử lý tuần tự theo message group khi batch size = 1.

---

## 5. DLQ — đặt ở queue, không chỉ Lambda

```
Main Queue ──(maxReceiveCount: 5)──► DLQ
         ▲
         └── Lambda fail / timeout → message không delete → receiveCount++
```

```yaml
OrderQueue:
  Type: AWS::SQS::Queue
  Properties:
    VisibilityTimeout: 90
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt OrderDLQ.Arn
      maxReceiveCount: 5

OrderDLQ:
  Type: AWS::SQS::Queue
  Properties:
    MessageRetentionPeriod: 1209600  # 14 ngày
```

Alarm: `ApproximateNumberOfMessagesVisible` trên DLQ > 0.

---

## 6. Concurrency & downstream protection

```
Burst 10,000 messages → Lambda scale aggressive → RDS connection storm
```

| Giải pháp | Cách |
|-----------|------|
| **Reserved concurrency** trên function | Cap max concurrent (vd. 50) |
| **Maximum concurrency** trên event source mapping | Giới hạn riêng mapping này |
| **RDS Proxy** | Pool connection phía DB |
| **Batch size nhỏ** | Giảm parallel trong 1 invocation |

```bash
aws lambda put-function-concurrency \
  --function-name order-processor \
  --reserved-concurrent-executions 50
```

---

## 7. IAM

Lambda execution role cần:

```json
{
  "Effect": "Allow",
  "Action": [
    "sqs:ReceiveMessage",
    "sqs:DeleteMessage",
    "sqs:GetQueueAttributes",
    "sqs:ChangeMessageVisibility"
  ],
  "Resource": "arn:aws:sqs:ap-southeast-1:123456789:order-processing"
}
```

Producer (API khác) chỉ cần `sqs:SendMessage` — **không** cần quyền Lambda.

---

## 8. SNS → SQS → Lambda (pattern phổ biến)

```
Order API ──► SNS Topic ──► SQS (email)     ──► Lambda email
                        └──► SQS (inventory) ──► Lambda stock
```

→ SNS chi tiết: [`sns.md`](./sns.md). SQS tổng quát: [`../sqs.md`](../sqs.md).

---

## 9. Triển khai nhanh (CLI)

```bash
REGION=ap-southeast-1
QUEUE_ARN=arn:aws:sqs:ap-southeast-1:123456789:order-processing
FUNCTION_NAME=order-processor

aws lambda create-event-source-mapping \
  --function-name "$FUNCTION_NAME" \
  --event-source-arn "$QUEUE_ARN" \
  --batch-size 10 \
  --function-response-types ReportBatchItemFailures \
  --region "$REGION"
```

---

## 10. Checklist production

```
□ ReportBatchItemFailures enabled
□ Visibility timeout > Lambda timeout
□ DLQ + maxReceiveCount trên queue
□ Handler idempotent
□ Reserved/max concurrency nếu downstream nhạy cảm
□ CloudWatch alarm: DLQ depth, Lambda Errors, queue AgeOfOldestMessage
□ Payload > 256 KB → S3 pointer trong message body
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [`../sqs.md`](../sqs.md) | SQS queue, visibility, FIFO, pricing |
| [`lambda.md`](./lambda.md) | Deploy function, SAM template |
| [`sns.md`](./sns.md) | Fan-out trước SQS |
| [`cold-start-scale.md`](./cold-start-scale.md) | Concurrency, throttling |

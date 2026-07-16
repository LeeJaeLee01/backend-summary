# Lambda + SNS — Pub/Sub fan-out

> **SNS** push notification tới subscriber — Lambda là một loại subscriber phổ biến. Kết hợp SNS + SQS khi cần buffer: [`../sqs.md`](../sqs.md).

---

## 1. SNS là gì?

```
Publisher ──Publish──► SNS Topic ──► Lambda A (email)
                              ├──► Lambda B (analytics)
                              ├──► SQS Queue ──► Lambda C (buffer)
                              └──► HTTP endpoint
```

| | **SNS** | **SQS** |
|---|---------|---------|
| Mô hình | **Pub/Sub** — 1 message → N subscriber | **Queue** — 1 message thường 1 consumer |
| Delivery | **Push** tới subscriber | Consumer **pull** |
| Lưu trữ | Không buffer lâu | Retention 1–14 ngày |
| Retry | Lambda async retry; HTTP có retry policy | Visibility timeout + DLQ |

**SAA:** Fan-out nhiều service → SNS. Cần buffer/retry độc lập → SNS → **SQS** (mỗi service 1 queue) → Lambda.

---

## 2. Lambda subscribe SNS

### 2.1. Invocation model

SNS → Lambda = **asynchronous invocation**.

```
1. SNS gọi Lambda Invoke (Event)
2. Lambda queue nội bộ xử lý
3. Fail → retry 2 lần (mặc định)
4. Vẫn fail → DLQ (nếu cấu hình trên Lambda)
```

Khác SQS: SNS **không** có partial batch — mỗi notification = 1 invocation.

### 2.2. Handler

```javascript
// src/sns-handler.js
export const handler = async (event) => {
  for (const record of event.Records) {
    const sns = record.Sns;
    const message = JSON.parse(sns.Message);
    const subject = sns.Subject;
    const topicArn = sns.TopicArn;

    console.log(JSON.stringify({
      topicArn,
      subject,
      messageId: sns.MessageId,
      payload: message,
    }));

    await handleEvent(message);
  }
};

async function handleEvent(payload) {
  // idempotent — SNS có thể deliver duplicate
}
```

**Event structure:** `event.Records[].Sns.Message` — thường là JSON string.

---

## 3. SAM template

```yaml
OrderTopic:
  Type: AWS::SNS::Topic
  Properties:
    DisplayName: order-placed

EmailNotifier:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/sns-handler.handler
    Events:
      OrderPlaced:
        Type: SNS
        Properties:
          Topic: !Ref OrderTopic

# Lambda cần permission — SAM tự thêm
```

Publish từ API:

```javascript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});
await sns.send(
  new PublishCommand({
    TopicArn: process.env.ORDER_TOPIC_ARN,
    Subject: 'order.placed',
    Message: JSON.stringify({ orderId: 'ord_1', total: 99.5 }),
  }),
);
```

---

## 4. SNS → SQS → Lambda (khuyến nghị production)

SNS alone **không buffer** — subscriber down = mất message (trừ retry ngắn).

```
                    ┌──► SQS email-queue     ──► Lambda email
Order ──► SNS ──────├──► SQS inventory-queue ──► Lambda stock
                    └──► SQS audit-queue     ──► Lambda audit
```

| Lợi ích | Giải thích |
|---------|------------|
| **Buffer** | Burst không overwhelm Lambda |
| **DLQ riêng** | Mỗi queue có redrive policy |
| **Scale độc lập** | Email chậm không block inventory |
| **Replay** | Đọc lại từ queue/DLQ |

Queue policy cho phép SNS gửi:

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

→ Chi tiết Lambda + SQS: [`sqs.md`](./sqs.md).

---

## 5. Filter policy (SNS message filtering)

Subscriber chỉ nhận message khớp filter — giảm invocation Lambda không cần thiết.

```json
{
  "eventType": ["order.placed", "order.cancelled"]
}
```

Hoặc filter theo attribute:

```javascript
await sns.send(
  new PublishCommand({
    TopicArn: TOPIC_ARN,
    Message: JSON.stringify({ orderId: 'ord_1' }),
    MessageAttributes: {
      eventType: { DataType: 'String', StringValue: 'order.placed' },
    },
  }),
);
```

SAM:

```yaml
Events:
  OrderPlacedOnly:
    Type: SNS
    Properties:
      Topic: !Ref OrderTopic
      FilterPolicy:
        eventType:
          - order.placed
```

---

## 6. Fan-out vs EventBridge

| | **SNS** | **EventBridge** |
|---|---------|-----------------|
| Routing | Topic + filter policy (đơn giản) | Rule phức tạp (content-based) |
| Cross-account | Có (topic policy) | Có (event bus policy) |
| Schedule | Không | Có (cron) |
| SaaS integration | Hạn chế | Native (Stripe, Auth0…) |

**Chọn SNS:** fan-out đơn giản, notify nhiều Lambda/SQS. **Chọn EventBridge:** event routing phức tạp, schedule: [`eventbridge.md`](./eventbridge.md).

---

## 7. Bảo mật & vận hành

```
□ Topic policy — ai được Publish/Subscribe
□ Encryption — SSE (KMS) nếu payload nhạy cảm
□ DLQ trên Lambda async hoặc dùng SQS buffer
□ Idempotent handler — duplicate delivery
□ CloudWatch alarm: Lambda Errors, SNS NumberOfNotificationsFailed
□ Không gửi secret trong Message — reference ARN/key
```

---

## 8. CLI nhanh

```bash
REGION=ap-southeast-1

TOPIC_ARN=$(aws sns create-topic \
  --name order-placed \
  --region "$REGION" \
  --query 'TopicArn' --output text)

aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol lambda \
  --notification-endpoint "arn:aws:lambda:${REGION}:123456789:function:order-notifier" \
  --region "$REGION"

aws lambda add-permission \
  --function-name order-notifier \
  --statement-id sns-invoke \
  --action lambda:InvokeFunction \
  --principal sns.amazonaws.com \
  --source-arn "$TOPIC_ARN" \
  --region "$REGION"

aws sns publish \
  --topic-arn "$TOPIC_ARN" \
  --message '{"orderId":"ord_1"}' \
  --region "$REGION"
```

---

## 9. Tóm tắt SAA

| Câu hỏi | Trả lời |
|---------|---------|
| SNS vs SQS? | SNS push fan-out; SQS pull buffer |
| Lambda + SNS retry? | Async — 2 retry, rồi DLQ |
| Production fan-out? | SNS → SQS (mỗi consumer) → Lambda |
| Filter? | SNS filter policy trên subscription |

---

## Liên quan

| File | Nội dung |
|------|----------|
| [`../sqs.md`](../sqs.md) | Queue, DLQ, visibility |
| [`sqs.md`](./sqs.md) | Lambda SQS consumer |
| [`eventbridge.md`](./eventbridge.md) | Event bus thay SNS |
| [`concept.md`](./concept.md) | Async vs sync invocation |

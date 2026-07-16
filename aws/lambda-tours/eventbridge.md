# Lambda + EventBridge — Schedule & event bus

> **Amazon EventBridge** = event bus serverless — routing theo rule, **cron schedule**, tích hợp AWS service và SaaS.

---

## 1. EventBridge vs CloudWatch Events

CloudWatch Events **đã merge** vào EventBridge. Console có thể ghi "CloudWatch Events" — cùng API `events.*`.

| Thành phần | Vai trò |
|------------|---------|
| **Event bus** | `default` (account) hoặc custom bus |
| **Rule** | Pattern match event → target |
| **Target** | Lambda, SQS, SNS, Step Functions, API… |
| **Schedule** | Cron/rate expression — trigger định kỳ |

---

## 2. Schedule trigger (cron)

Thay cron trên EC2 bằng Lambda + EventBridge rule.

```
EventBridge Rule (cron) ──► Lambda cleanup-job
```

```yaml
# SAM
NightlyCleanup:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/cleanup.handler
    Events:
      Schedule:
        Type: Schedule
        Properties:
          Schedule: cron(0 2 * * ? *)   # 02:00 UTC mỗi ngày
          Description: Purge stale records
          Enabled: true
```

**Schedule expressions:**

| Loại | Ví dụ | Ý nghĩa |
|------|-------|---------|
| **Rate** | `rate(5 minutes)` | Mỗi 5 phút |
| **Rate** | `rate(1 hour)` | Mỗi giờ |
| **Cron** | `cron(0 12 * * ? *)` | 12:00 UTC hàng ngày |
| **Cron** | `cron(0 9 ? * MON-FRI *)` | 09:00 UTC thứ 2–6 |

```
Cron format EventBridge: cron(minutes hours day-of-month month day-of-week year)
  day-of-week: ? = không specify khi dùng day-of-month
```

**Lưu ý SAA:** EventBridge schedule **minimum 1 phút** — không trigger sub-minute chính xác.

---

## 3. Event pattern (event-driven)

Rule match event từ AWS service hoặc custom app.

```
EC2 state change ──► EventBridge ──► Lambda alert
Custom app ──PutEvents──► EventBridge ──► Lambda + SQS
```

### 3.1. Handler

```javascript
// src/eventbridge-handler.js
export const handler = async (event) => {
  console.log(JSON.stringify(event));

  // Scheduled event
  if (event.source === 'aws.events' && event['detail-type'] === 'Scheduled Event') {
    await runNightlyCleanup();
    return;
  }

  // Custom event
  if (event.source === 'my.app' && event['detail-type'] === 'order.shipped') {
    await notifyShipping(event.detail);
  }
};
```

### 3.2. Publish custom event

```javascript
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const eb = new EventBridgeClient({});

await eb.send(
  new PutEventsCommand({
    Entries: [
      {
        Source: 'my.app',
        DetailType: 'order.shipped',
        Detail: JSON.stringify({ orderId: 'ord_1', carrier: 'DHL' }),
        EventBusName: 'default',
      },
    ],
  }),
);
```

### 3.3. Rule pattern (SAM)

```yaml
OrderShippedRule:
  Type: AWS::Events::Rule
  Properties:
    EventBusName: default
    EventPattern:
      source:
        - my.app
      detail-type:
        - order.shipped
    Targets:
      - Arn: !GetAtt ShippingNotifier.Arn
        Id: ShippingLambda

ShippingNotifier:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/eventbridge-handler.handler
    Events:
      OrderShipped:
        Type: EventBridgeRule
        Properties:
          Pattern:
            source:
              - my.app
            detail-type:
              - order.shipped
```

---

## 4. Invocation model

EventBridge → Lambda = **asynchronous** (giống SNS, S3).

```
Fail → retry (mặc định 2 lần, 24h window)
Vẫn fail → DLQ trên Lambda (cấu hình)
```

```yaml
ShippingNotifier:
  Type: AWS::Serverless::Function
  Properties:
    DeadLetterQueue:
      Type: SQS
      TargetArn: !GetAtt NotifyDLQ.Arn
```

---

## 5. EventBridge vs SNS

| | **EventBridge** | **SNS** |
|---|-----------------|---------|
| Routing | Rule pattern phức tạp, nhiều target/rule | Topic + filter policy |
| Schedule | **Có** | Không |
| Archive & replay | Có (event archive) | Không |
| Cross-account | Event bus policy | Topic policy |
| Throughput | High (soft limit) | Very high fan-out |

**Chọn EventBridge khi:** cron, routing phức tạp, nhiều nguồn event AWS, cần archive.

**Chọn SNS khi:** fan-out đơn giản, pub/sub classic: [`sns.md`](./sns.md).

---

## 6. Pipe & integration (SAA awareness)

| Feature | Dùng để |
|---------|---------|
| **EventBridge Pipes** | Point-to-point: SQS → Lambda/Step Functions (filter + enrich) |
| **Schema Registry** | Discover event schema |
| **Partner event sources** | SaaS (Datadog, Zendesk…) |

```
SQS ──► EventBridge Pipe (filter) ──► Lambda
         (không cần Lambda poll trực tiếp trong một số pattern)
```

---

## 7. IAM

Publisher cần `events:PutEvents` trên event bus.

Lambda execution role — EventBridge tự invoke qua resource-based permission (SAM/CloudFormation tạo).

Custom bus policy cho cross-account:

```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::OTHER_ACCOUNT:root" },
  "Action": "events:PutEvents",
  "Resource": "arn:aws:events:region:account:event-bus/shared-bus"
}
```

---

## 8. Monitoring

| Metric | Ý nghĩa |
|--------|---------|
| `FailedInvocations` (rule) | Target (Lambda) fail |
| `TriggeredRules` | Rule match count |
| Lambda `Errors` | Handler exception |

Alarm: scheduled job không chạy → `Invocations` = 0 trong window expected.

---

## 9. CLI — schedule rule

```bash
REGION=ap-southeast-1
FUNCTION_ARN=arn:aws:lambda:ap-southeast-1:123456789:function:nightly-cleanup

RULE_ARN=$(aws events put-rule \
  --name nightly-cleanup \
  --schedule-expression "cron(0 2 * * ? *)" \
  --state ENABLED \
  --region "$REGION" \
  --query 'RuleArn' --output text)

aws events put-targets \
  --rule nightly-cleanup \
  --targets "Id"="1","Arn"="$FUNCTION_ARN" \
  --region "$REGION"

aws lambda add-permission \
  --function-name nightly-cleanup \
  --statement-id eventbridge-invoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "$RULE_ARN" \
  --region "$REGION"
```

---

## 10. Checklist

```
□ Timezone — cron EventBridge dùng UTC
□ Idempotent scheduled job — có thể overlap nếu run lâu hơn interval
□ DLQ cho async Lambda target
□ Rule Enabled/Disabled rõ ràng (tránh bill job dev)
□ Custom event: schema ổn định (detail-type, source)
□ Không dùng Lambda schedule cho sub-minute precision
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [`sns.md`](./sns.md) | Fan-out Pub/Sub |
| [`concept.md`](./concept.md) | Async invocation, DLQ |
| [`lambda.md`](./lambda.md) | Deploy SAM |

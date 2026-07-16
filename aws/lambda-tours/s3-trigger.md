# Lambda + S3 — Event notification

> Upload/delete object trên S3 → **event notification** → Lambda xử lý (resize ảnh, virus scan, ETL…).

---

## 1. Luồng cơ bản

```
Client ──PUT──► S3 Bucket ──(event notification)──► Lambda
                                                      │
                                                      ▼
                                              Process file / metadata
```

| Invocation | **Asynchronous** — retry 2 lần, DLQ nếu cấu hình |
|------------|--------------------------------------------------|

**Không phải:** S3 gọi Lambda sync và chờ response. S3 fire-and-forget; Lambda queue nội bộ.

---

## 2. Event types

| Event | Khi nào |
|-------|---------|
| `s3:ObjectCreated:*` | PUT, POST, Copy, CompleteMultipartUpload |
| `s3:ObjectCreated:Put` | Chỉ PUT |
| `s3:ObjectRemoved:*` | Delete |
| `s3:ObjectRestore:*` | Glacier restore |

Filter:

| Filter | Ví dụ |
|--------|-------|
| **Prefix** | `uploads/` — chỉ key bắt đầu uploads/ |
| **Suffix** | `.jpg` — chỉ file ảnh |

```
Bucket: my-app-uploads
  Prefix: uploads/raw/
  Suffix: .png
  Event: s3:ObjectCreated:*
  → Lambda resize-image
```

---

## 3. Handler

```javascript
// src/s3-handler.js
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';

const s3 = new S3Client({});

export const handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const size = record.s3.object.size;

    console.log(JSON.stringify({ bucket, key, size }));

    if (size > 100 * 1024 * 1024) {
      console.warn('Skip large file', { key, size });
      continue;
    }

    await processObject(bucket, key);
  }
};

async function processObject(bucket, key) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const buffer = await streamToBuffer(Body);

  // ví dụ: resize, scan, extract metadata...
  const outputKey = key.replace('uploads/raw/', 'uploads/processed/');

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: outputKey,
      Body: buffer,
      ContentType: 'image/jpeg',
    }),
  );
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
```

**Lưu ý:** Key URL-encoded — decode trước khi gọi S3 API.

---

## 4. SAM template

```yaml
UploadBucket:
  Type: AWS::S3::Bucket
  Properties:
    NotificationConfiguration:
      LambdaConfigurations:
        - Event: s3:ObjectCreated:*
          Function: !GetAtt ImageProcessor.Arn
          Filter:
            S3Key:
              Rules:
                - Name: prefix
                  Value: uploads/raw/
                - Name: suffix
                  Value: .jpg

ImageProcessor:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/s3-handler.handler
    Timeout: 120
    MemorySize: 512
    Policies:
      - S3ReadPolicy:
          BucketName: !Ref UploadBucket
      - S3WritePolicy:
          BucketName: !Ref UploadBucket
    DeadLetterQueue:
      Type: SQS
      TargetArn: !GetAtt ImageProcessorDLQ.Arn

ImageProcessorDLQ:
  Type: AWS::SQS::Queue
```

SAM tự thêm **Lambda permission** cho S3 invoke.

---

## 5. Giới hạn & best practice

| Giới hạn | Giá trị |
|----------|---------|
| Notification delay | Thường vài giây — **không real-time** |
| Event size trong payload | Metadata only — **không** embed file content |
| File lớn | Stream từ S3; dùng `/tmp` hoặc multipart |
| Duplicate event | Có thể — handler **idempotent** (check etag/processed table) |

```
□ Stream GetObject — không load 500MB vào memory
□ Timeout đủ cho download + process + upload
□ Idempotent: cùng key upload lại → không duplicate side effect
□ DLQ async Lambda
□ Virus scan / untrusted upload → isolate bucket + least privilege
```

---

## 6. S3 → SQS → Lambda (buffer pattern)

Burst upload lớn → tránh overwhelm Lambda concurrent limit.

```
S3 ──► SQS ──► Lambda (controlled concurrency)
```

Cấu hình notification target = **SQS queue** thay vì Lambda trực tiếp.

| Direct S3 → Lambda | S3 → SQS → Lambda |
|--------------------|-------------------|
| Đơn giản | Buffer + DLQ trên queue |
| Scale Lambda aggressive | Reserved concurrency kiểm soát |

→ [`sqs.md`](./sqs.md)

---

## 7. IAM

Lambda role:

```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": [
    "arn:aws:s3:::my-app-uploads/uploads/raw/*",
    "arn:aws:s3:::my-app-uploads/uploads/processed/*"
  ]
}
```

S3 invoke Lambda — resource policy trên function (`lambda:InvokeFunction` principal `s3.amazonaws.com`).

---

## 8. CLI

```bash
REGION=ap-southeast-1
BUCKET=my-app-uploads
FUNCTION_ARN=arn:aws:lambda:ap-southeast-1:123456789:function:image-processor

aws lambda add-permission \
  --function-name image-processor \
  --statement-id s3-invoke \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$BUCKET" \
  --source-account 123456789 \
  --region "$REGION"

aws s3api put-bucket-notification-configuration \
  --bucket "$BUCKET" \
  --notification-configuration "{
    \"LambdaFunctionConfigurations\": [{
      \"LambdaFunctionArn\": \"$FUNCTION_ARN\",
      \"Events\": [\"s3:ObjectCreated:*\"],
      \"Filter\": {
        \"Key\": {
          \"FilterRules\": [
            {\"Name\": \"prefix\", \"Value\": \"uploads/raw/\"}
          ]
        }
      }
    }]
  }" \
  --region "$REGION"
```

---

## 9. SAA — câu hỏi thường gặp

| Scenario | Gợi ý |
|----------|--------|
| User upload ảnh → resize thumbnail | S3 event → Lambda |
| File rất lớn, xử lý lâu | S3 → SQS → Lambda hoặc Step Functions |
| Cần biết khi upload xong **sync** | API upload trả 202 + polling — **không** dùng S3 event cho UX sync |
| Glacier restore complete | `s3:ObjectRestore:Completed` → Lambda |

---

## Liên quan

| File | Nội dung |
|------|----------|
| [`concept.md`](./concept.md) | Async invocation |
| [`sqs.md`](./sqs.md) | Buffer pattern |
| [`lambda.md`](./lambda.md) | Deploy, IAM |

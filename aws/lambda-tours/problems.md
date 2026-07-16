# Lambda — Các vấn đề hay gặp (pitfalls) khi dùng

> Tài liệu này gom các **problem thực tế** khi dùng AWS Lambda và cách tránh. Nền tảng: [`concept.md`](./concept.md). **DB connection storm:** [`db-connections.md`](./db-connections.md). Performance/scale sâu: [`cold-start-scale.md`](./cold-start-scale.md).

---

## 1. Cold start (API chậm request đầu)

**Triệu chứng**

- p99 latency spike, request đầu chậm rõ rệt sau thời gian idle
- CloudWatch/X-Ray có `InitDuration` cao

**Nguyên nhân hay gặp**

- Package lớn (zip/image), import nặng ở global scope
- Lambda trong VPC (đặc biệt outbound internet cần NAT)
- Runtime nặng (Java/.NET), dependency native

**Cách xử lý**

- Giảm bundle: tree-shake, bỏ deps không dùng, dùng AWS SDK v3 modular
- Dùng `arm64` nếu phù hợp
- Lazy init (kết nối DB/cache khi cần) + reuse trong warm container
- Latency SLA nghiêm ngặt → **provisioned concurrency** (gắn alias)

→ Xem chi tiết: [`cold-start-scale.md`](./cold-start-scale.md).

---

## 2. API Gateway timeout “bị cắt” (29s) / 502-504

**Triệu chứng**

- Client nhận 504/502 dù Lambda vẫn chạy
- Request dài > ~29s không bao giờ thành công qua API Gateway

**Nguyên nhân**

- API Gateway có giới hạn timeout integration (thực tế hay gặp ~29s)

**Cách xử lý**

- Đổi design: trả `202 Accepted` + job async (SQS/Step Functions) + polling/webhook
- Với tác vụ nặng: S3 upload + async processing, hoặc ECS/Fargate
- Ensure timeout chain: client < API GW < Lambda < downstream

---

## 3. Retry làm “double charge / double email” (idempotency)

**Triệu chứng**

- Email gửi 2 lần, thanh toán trừ 2 lần, record bị tạo trùng

**Nguyên nhân**

- Lambda/SQS/SNS/EventBridge đều có thể deliver **at-least-once**
- Timeout/exception → retry → handler tạo side-effect lại

**Cách xử lý**

- **Idempotent consumer**: dùng `idempotency key` (messageId/orderId) + bảng `processed_events`
- Với payment: enforce unique constraint ở DB, hoặc external idempotency key
- Log correlation id + message id để trace

---

## 4. SQS batch “1 message lỗi retry cả batch”

**Triệu chứng**

- Backlog tăng, cùng 10 message bị retry lặp lại vì 1 message bad

**Nguyên nhân**

- Không bật partial batch failure

**Cách xử lý**

- Bật `ReportBatchItemFailures`
- Với poison-pill message: validate sớm, đưa DLQ sau `maxReceiveCount`

→ [`sqs.md`](./sqs.md)

---

## 5. Visibility timeout sai → duplicate storm

**Triệu chứng**

- 1 message được xử lý đồng thời bởi nhiều invocation
- Side-effect trùng

**Nguyên nhân**

- `VisibilityTimeout` < thời gian xử lý p99
- Lambda timeout không tương thích với visibility timeout

**Cách xử lý**

- Thiết lập: Lambda timeout < visibility timeout (có margin)
- Nếu job dài: gia hạn visibility hoặc chuyển sang Step Functions/ECS

---

## 6. Lambda + RDS — nhiều serverless cùng kết nối 1 DB (connection storm)

**Triệu chứng**

- RDS báo `too many connections`, `timeout acquiring connection`
- Lỗi chỉ xuất hiện lúc peak — dev/staging OK vì concurrent thấp
- Thêm 1 Lambda function nữa → DB chết dù từng function “chỉ dùng pool nhỏ”

**Nguyên nhân**

- Lambda scale theo **concurrent executions** — không có “số instance cố định”
- Mỗi warm container có thể giữ connection (`pool max: 1` × N container = N connection)
- **Nhiều Lambda function** (order-api, payment-worker, report…) + ECS **cộng dồn** vào cùng 1 Postgres
- Pool `pg` default `max: 10` × 50 container = 500 connection
- Connect thẳng RDS endpoint, không qua proxy

**Công thức nhớ:**

```
Tổng connection ≈ Σ (concurrent Lambda_i × pool_max_i) + ECS connections
RDS max_connections = 100 → 200 concurrent Lambda = disaster (nếu không proxy)
```

**Cách xử lý**

1. **RDS Proxy** (hoặc PgBouncer) — multiplex nhiều client → ít connection thật
2. Singleton pool **ngoài handler**, `max: 1` per container, trỏ **proxy endpoint**
3. **Connection budget** khi ≥ 2 service dùng chung DB
4. **Reserved concurrency** / SQS `MaximumConcurrency` — cap worker ghi DB
5. Burst nặng → SQS buffer + worker Lambda concurrency thấp

→ Chi tiết đầy đủ: [`db-connections.md`](./db-connections.md)

---

## 7. VPC + outbound internet bị “treo” (NAT/route)

**Triệu chứng**

- Lambda trong VPC không gọi được AWS public endpoints hoặc internet (timeouts)

**Nguyên nhân**

- Private subnet không có NAT Gateway/instance
- Thiếu VPC endpoint (S3, DynamoDB) nên outbound bị chặn

**Cách xử lý**

- Nếu chỉ cần S3/DynamoDB: dùng **VPC endpoint** (rẻ hơn NAT)
- Nếu cần internet: NAT Gateway + route table đúng
- Tránh đưa Lambda vào VPC nếu không cần RDS/private resource

---

## 8. Package/layer lỗi (module not found, size limit)

**Triệu chứng**

- `Cannot find module ...`
- Deploy fail do zip quá lớn / unzipped > 250MB

**Nguyên nhân**

- Build artifact thiếu `node_modules` production
- Handler path sai `src/handler.handler`
- Bundle/layer phình to

**Cách xử lý**

- `npm ci --omit=dev` trước build
- Kiểm tra handler path + export đúng
- Tách dependency bằng **Layer** hoặc chuyển sang **container image** khi nặng

→ [`ecr.md`](./ecr.md)

---

## 9. Log/trace không đủ để debug

**Triệu chứng**

- Có lỗi nhưng không biết request nào, message nào gây ra

**Nguyên nhân**

- Log không có requestId/messageId/correlationId
- Không bật X-Ray/structured log

**Cách xử lý**

- Structured logs: include `awsRequestId`, `messageId`, `traceId`
- Bật X-Ray khi cần distributed tracing
- Alarm theo Errors/Throttles/DLQ depth

---

## 10. Cost bất ngờ (GB-second, provisioned concurrency, NAT)

**Triệu chứng**

- Bill tăng dù traffic không tăng nhiều

**Nguyên nhân**

- Memory set quá cao, duration tăng (do downstream)
- Provisioned concurrency chạy 24/7
- NAT Gateway cost (hour + GB) khi Lambda trong VPC gọi ra ngoài

**Cách xử lý**

- Power-tune memory dựa trên Duration metric
- Chỉ provisioned cho function latency-critical
- Dùng VPC endpoints thay NAT nếu có thể

---

## 11. Không phù hợp use-case (long-lived, >15 phút, stateful)

**Triệu chứng**

- Timeouts >15 phút, needs WebSocket/session sticky, background daemon

**Cách xử lý**

- Chuyển sang ECS/Fargate/EC2, hoặc Step Functions orchestration

---

## 12. Checklist nhanh trước khi production

```
□ Idempotency: consumer safe với duplicate (SQS/SNS/EventBridge)
□ DLQ: async DLQ hoặc SQS DLQ, alarm DLQ > 0
□ Timeout chain: client / API GW / Lambda / downstream hợp lý
□ Concurrency cap: reserved/mapping maximum concurrency bảo vệ DB
□ DB: RDS Proxy + pool max:1 — xem db-connections.md
□ Cold start: đo InitDuration, cân nhắc provisioned concurrency
□ VPC: chỉ dùng khi cần; NAT/VPC endpoints đúng
□ Logs/trace: requestId/messageId + structured logs
□ Cost: memory tuning + tránh NAT/provisioned không cần
```


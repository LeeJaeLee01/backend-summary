# Lambda — Cold start, concurrency & throttling

> Vấn đề **performance và scale** đặc thù Lambda — không có trong [`lambda.md`](./lambda.md) (deploy) hay [`concept.md`](./concept.md) (định nghĩa).

---

## 0. Triệu chứng thường gặp

| Triệu chứng | Nguyên nhân có thể |
|-------------|-------------------|
| Request đầu chậm 1–3s, sau đó nhanh | **Cold start** |
| `429 TooManyRequestsException` | **Throttling** — vượt concurrent limit |
| RDS `too many connections` | Lambda scale quá nhanh, không pool |
| Bill cao bất ngờ | Memory cao + duration dài; provisioned concurrency |

---

## 1. Cold start — phân tích

```
Invocation mới
    │
    ├─► [Cold] Provision execution environment
    │         ├─ Download zip / pull image layers
    │         ├─ Start runtime (Node, JVM…)
    │         └─ Init code (imports, global scope)
    │
    └─► [Warm] Reuse environment → chỉ chạy handler
```

| Phase | Node.js tip |
|-------|-------------|
| **Download** | Package nhỏ; dùng arm64; layer tách deps |
| **Runtime init** | JVM/.NET chậm hơn Node/Python |
| **Init code** | Tránh `await` nặng ở top-level; lazy init DB |

```javascript
// ❌ Cold start chậm — connect DB mỗi lần container mới ở top-level await
// const db = await connectDb();

// ✅ Lazy + reuse warm container
let db;
async function getDb() {
  if (!db) db = await connectDb();
  return db;
}

export const handler = async (event) => {
  const conn = await getDb();
  // ...
};
```

---

## 2. Giảm cold start

| Kỹ thuật | Hiệu quả | Chi phí |
|----------|-----------|---------|
| **Bundle nhỏ** | Cao | — |
| **arm64 (Graviton)** | Trung bình | Rẻ hơn x86 |
| **Tránh VPC** (nếu được) | Cao | Không reach RDS private |
| **Provisioned concurrency** | Rất cao | **Phí cố định** theo số instance warm |
| **SnapStart** (Java only) | Cao cho Java | — |
| **HTTP API** thay REST API GW | Nhẹ hơn một chút | — |

```
□ Esbuild/webpack tree-shake
□ Không import cả AWS SDK v2 — dùng v3 modular
□ Lambda Layer chỉ khi share deps — không làm package lớn hơn nếu không cần
```

---

## 3. Provisioned concurrency

Pre-warm **N** execution environment — luôn sẵn sàng, **không cold start** (cho N concurrent đầu).

```bash
aws lambda put-provisioned-concurrency-config \
  --function-name my-api \
  --qualifier prod \
  --provisioned-concurrent-executions 10
```

| | On-demand | Provisioned |
|---|-----------|-------------|
| Cold start | Có | **Không** (trong limit N) |
| Bill | Pay per invoke | **+ phí capacity** 24/7 |
| Khi dùng | Traffic không đều, cost-sensitive | Latency SLA strict (payment, login) |

**Alias bắt buộc:** Provisioned gắn **version/alias** — không gắn `$LATEST`.

---

## 4. Concurrency model

```
Account limit (region): 1000 concurrent (default, tăng quota được)

Function A: reserved 200  → luôn có tối đa 200 slot; không ai chiếm
Function B: unreserved    → dùng phần còn lại (800)
Function C: reserved 100
```

### 4.1. Reserved concurrency

```bash
aws lambda put-function-concurrency \
  --function-name order-processor \
  --reserved-concurrent-executions 50
```

| Tác dụng | Giải thích |
|----------|------------|
| **Cap** | Function không vượt 50 concurrent — bảo vệ RDS |
| **Guarantee** | Luôn có slot (trong account limit) |
| **Side effect** | Trừ vào pool unreserved — function khác ít slot hơn |

### 4.2. Burst concurrency

Lambda scale nhanh — burst limit theo region (vài trăm/thousand trong vài phút). Traffic spike cực đoan vẫn có thể throttle tạm.

---

## 5. Throttling

```
Concurrent executions >= limit
    → Lambda throws 429 TooManyRequestsException
    → API Gateway trả 502/503 cho client (sync)
    → SQS: message không delete → retry sau visibility timeout
```

| Nguồn limit | |
|-------------|--|
| Account concurrent | 1000 default |
| Reserved trên function khác | Giảm pool shared |
| **SQS event source mapping** `MaximumConcurrency` | Cap riêng mapping |

```yaml
# SAM — SQS mapping concurrency cap
Events:
  Queue:
    Type: SQS
    Properties:
      Queue: !GetAtt MyQueue.Arn
      ScalingConfig:
        MaximumConcurrency: 20
```

**Alarm:** CloudWatch `Throttles` > 0.

---

## 6. Lambda + RDS — connection storm

```
1000 concurrent Lambda × 1 connection = 1000 connections → RDS max_connections exceeded
```

| Giải pháp | Mô tả |
|-----------|--------|
| **RDS Proxy** | Pool + multiplex — **khuyến nghị SAA** |
| **Reserved concurrency** | Cap Lambda → giới hạn connection |
| **Không** mở connection mới mỗi invoke | Reuse trong warm container |
| **Aurora Serverless v2** | Scale DB theo load |

```
Lambda (VPC) ──► RDS Proxy ──► RDS/Aurora (private subnet)
```

→ VPC Lambda trade-off cold start: [`concept.md`](./concept.md) §8. Chi tiết connection storm: [`db-connections.md`](./db-connections.md).

---

## 7. Memory tuning — duration vs cost

Tăng memory → tăng CPU → có thể **giảm duration** → tổng bill có thể **giảm**.

```bash
# Power tuning — thử 128, 256, 512, 1024 MB
aws lambda invoke --function-name my-api out.json
# So sánh Duration metric trong CloudWatch
```

Công cụ: [AWS Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning) (Step Functions).

---

## 8. Timeout cascade

```
API Gateway max integration timeout: 29s (REST/HTTP)
Lambda timeout: 30s
Downstream HTTP: 25s
Handler internal: 20s  ← để còn margin log/cleanup
```

SQS visibility > Lambda timeout × hệ số an toàn.

---

## 9. Monitoring dashboard

| Metric | Ý nghĩa |
|--------|---------|
| `Duration` (p50, p99) | Latency — p99 spike = cold start |
| `InitDuration` | Thời gian cold start (X-Ray / Lambda Insights) |
| `ConcurrentExecutions` | Load hiện tại |
| `Throttles` | Bị rate limit |
| `Errors` / `DeadLetterErrors` | Fail logic hoặc DLQ |

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name ConcurrentExecutions \
  --dimensions Name=FunctionName,Value=my-api \
  --start-time 2026-07-16T00:00:00Z \
  --end-time 2026-07-16T12:00:00Z \
  --period 300 \
  --statistics Maximum
```

---

## 10. Decision tree (SAA)

```
Latency p99 quan trọng + traffic ổn định?
  ├─ Yes → Provisioned concurrency (+ alias)
  └─ No  → Optimize bundle; chấp nhận cold start

Downstream DB không chịu burst?
  ├─ Yes → Reserved concurrency + RDS Proxy
  └─ No  → On-demand scale

429 / Throttles?
  ├─ Tăng account quota (Support ticket)
  ├─ Giảm reserved function khác chiếm pool
  └─ SQS MaximumConcurrency

Java cold start?
  └─ SnapStart (CRaC) — SAA keyword
```

---

## 11. Checklist

```
□ Đo InitDuration trước khi mua provisioned concurrency
□ RDS Proxy nếu Lambda in VPC + relational DB
□ Reserved concurrency trên worker SQS nếu cần cap
□ Alarm Throttles + Errors
□ Memory power-tuning thực tế
□ Không provisioned concurrency trên $LATEST — dùng alias
```

---

## Liên quan

| File | Nội dung |
|------|----------|
| [`concept.md`](./concept.md) | Concurrency, VPC, limits |
| [`sqs.md`](./sqs.md) | SQS MaximumConcurrency |
| [`ecr.md`](./ecr.md) | Image cold start |
| [`lambda.md`](./lambda.md) | Memory, timeout config |

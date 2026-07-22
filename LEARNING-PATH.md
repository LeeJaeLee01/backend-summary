# Learning Path — Backend + AWS (thực chiến)

> Lộ trình học theo đúng thứ tự trong repo này.  
> **Không** học theo alphabet thư mục. Tick checkbox khi đọc xong.

**Mục tiêu:** vững backend → hệ thống phân tán → AWS hands-on (EC2 / SQS / Lambda…).

**Ôn chứng chỉ SAA-C03 (~800+ câu):** tách riêng → [`saa-c03/LEARNING-PATH.md`](./saa-c03/LEARNING-PATH.md)

---

## Bản đồ nhanh

```
Clean code / OOP
    → Database (+ Redis)
        → Design mono/micro + MQ + Outbox/Saga
            → EC2 + SQS + Lambda tours
                → go-interviews ôn phỏng vấn
```

| Phase | Thời gian gợi ý | Kết quả mong đợi |
|-------|-----------------|------------------|
| 1 | 1–2 tuần | OOP, DB, Redis nền tảng |
| 2 | 1–2 tuần | Mono/micro, MQ semantics, Outbox/Saga |
| 3 | 1–2 tuần | EC2, SQS, Lambda production pitfalls |
| 4 | sau Phase 1–3 | Interview Q&A, high-throughput (tùy chọn) |

---

## Phase 1 — Nền tảng backend

### 1.1 Clean code

- [ ] [`clean-code/oop.md`](./clean-code/oop.md)
- [ ] [`clean-code/solid.md`](./clean-code/solid.md)

### 1.2 Language / framework (chọn stack đang dùng)

- [ ] [`language-framework/nodejs.md`](./language-framework/nodejs.md)
- [ ] [`language-framework/nestjs.md`](./language-framework/nestjs.md)

### 1.3 Database (bắt buộc)

- [ ] [`database/index.md`](./database/index.md) — index types
- [ ] [`database/connection-pool.md`](./database/connection-pool.md)
- [ ] [`database/transaction-consistency.md`](./database/transaction-consistency.md)
- [ ] [`database/improve-query.md`](./database/improve-query.md)
- [ ] [`database/explain-analyze.md`](./database/explain-analyze.md)
- [ ] [`database/problems.md`](./database/problems.md)
- [ ] [`database/pagination.md`](./database/pagination.md) *(optional)*
- [ ] [`database/partition.md`](./database/partition.md) *(optional)*
- [ ] [`database/multi-tenant/index.md`](./database/multi-tenant/index.md) *(nếu làm SaaS)*

### 1.4 Redis

- [ ] [`redis/index.md`](./redis/index.md)
- [ ] [`redis/pub-sub.md`](./redis/pub-sub.md)
- [ ] [`redis/redis-stream.md`](./redis/redis-stream.md) *(optional)*

**Checkpoint Phase 1:** giải thích được connection pool, index leftmost, transaction isolation, khi nào dùng Redis.

---

## Phase 2 — Hệ thống phân tán

### 2.1 Kiến trúc service

- [ ] [`design-sys/mono-micro.md`](./design-sys/mono-micro.md)
- [ ] [`design-sys/index1.md`](./design-sys/index1.md) — tiêu chí tách service
- [ ] [`design-sys/patterns/index.md`](./design-sys/patterns/index.md)
- [ ] [`design-sys/patterns/repository.md`](./design-sys/patterns/repository.md)
- [ ] [`design-sys/patterns/observer.md`](./design-sys/patterns/observer.md)

### 2.2 Message queue

- [ ] [`mqs/index.md`](./mqs/index.md)
- [ ] [`mqs/at-least-once.md`](./mqs/at-least-once.md)
- [ ] [`mqs/at-most-once.md`](./mqs/at-most-once.md)
- [ ] [`mqs/exactly-once.md`](./mqs/exactly-once.md)
- [ ] [`mqs/competing-consumers.md`](./mqs/competing-consumers.md)
- [ ] [`mqs/queue-comparison.md`](./mqs/queue-comparison.md)

### 2.3 Consistency patterns

- [ ] [`design-sys/vips/outbox.md`](./design-sys/vips/outbox.md)
- [ ] [`design-sys/vips/inbox.md`](./design-sys/vips/inbox.md)
- [ ] [`design-sys/vips/saga.md`](./design-sys/vips/saga.md)

### 2.4 Auth (đọc sau khi có DB + session ý niệm)

- [ ] [`design-sys/auth-multi-tenant.md`](./design-sys/auth-multi-tenant.md) *(hoặc [`index.md`](./index.md) nếu cùng nội dung)*
- [ ] [`design-sys/csrf-sso-oauth-state.md`](./design-sys/csrf-sso-oauth-state.md)

### 2.5 Demo (chạy thử nếu được)

- [ ] [`demo/read-write-split/README.md`](./demo/read-write-split/README.md)
- [ ] [`demo/saga-choreography/README.md`](./demo/saga-choreography/README.md)
- [ ] [`demo/kafka-exactly-once/README.md`](./demo/kafka-exactly-once/README.md) *(optional)*

**Checkpoint Phase 2:** vẽ được SNS→SQS fan-out, giải thích at-least-once + idempotent, Outbox vs gọi queue trong cùng request.

---

## Phase 3 — AWS hands-on

### 3.1 EC2

- [ ] [`aws/ec2-tours/concept.md`](./aws/ec2-tours/concept.md)
- [ ] [`aws/ec2-tours/how-to-create.md`](./aws/ec2-tours/how-to-create.md)
- [ ] [`aws/ec2-tours/scale-problem.md`](./aws/ec2-tours/scale-problem.md)
- [ ] [`aws/ec2-tours/deploy-3ec2-alb.md`](./aws/ec2-tours/deploy-3ec2-alb.md)

### 3.2 SQS (AWS)

- [ ] [`aws/sqs.md`](./aws/sqs.md)

### 3.3 Lambda

- [ ] [`aws/lambda-tours/concept.md`](./aws/lambda-tours/concept.md)
- [ ] [`aws/lambda-tours/lambda.md`](./aws/lambda-tours/lambda.md)
- [ ] [`aws/lambda-tours/problems.md`](./aws/lambda-tours/problems.md)
- [ ] [`aws/lambda-tours/db-connections.md`](./aws/lambda-tours/db-connections.md)
- [ ] [`aws/lambda-tours/sqs.md`](./aws/lambda-tours/sqs.md)
- [ ] [`aws/lambda-tours/sns.md`](./aws/lambda-tours/sns.md)
- [ ] [`aws/lambda-tours/eventbridge.md`](./aws/lambda-tours/eventbridge.md)
- [ ] [`aws/lambda-tours/s3-trigger.md`](./aws/lambda-tours/s3-trigger.md)
- [ ] [`aws/lambda-tours/cold-start-scale.md`](./aws/lambda-tours/cold-start-scale.md)
- [ ] [`aws/lambda-tours/ecr.md`](./aws/lambda-tours/ecr.md) *(optional)*

### 3.4 Gap AWS (nên bổ sung tours khi làm backend/AWS thực tế)

- [ ] VPC / Subnet / Security Group / NAT / IGW
- [ ] IAM (role, policy, least privilege)
- [ ] S3 (storage class, lifecycle, VPC endpoint)
- [ ] RDS / Aurora (Multi-AZ, read replica)
- [ ] ALB vs NLB
- [ ] CloudFront
- [ ] Secrets Manager vs Parameter Store

**Checkpoint Phase 3:** giải thích EBS vs EFS, Gateway VPC endpoint, Lambda connection storm + RDS Proxy, SNS+SQS vs SQS FIFO.

---

## Phase 4 — Interview & nâng cao

### 4.1 Go / interview Q&A (ôn, không thay Phase 1–3)

- [ ] [`go-interviews/questions.md`](./go-interviews/questions.md)
- [ ] [`go-interviews/message-queue.md`](./go-interviews/message-queue.md)
- [ ] [`go-interviews/connection-pool.md`](./go-interviews/connection-pool.md)
- [ ] [`go-interviews/race-condition.md`](./go-interviews/race-condition.md)
- [ ] [`go-interviews/deadlock.md`](./go-interviews/deadlock.md)
- [ ] [`go-interviews/microservice-data-consistency.md`](./go-interviews/microservice-data-consistency.md)
- [ ] [`go-interviews/monolith-vs-microservice.md`](./go-interviews/monolith-vs-microservice.md)

### 4.2 Optional depth

- [ ] [`high-throughtput/`](./high-throughtput/)
- [ ] [`low-latency/`](./low-latency/)
- [ ] [`mqs/interview-design-qa.md`](./mqs/interview-design-qa.md)
- [ ] [`mqs/scale.md`](./mqs/scale.md)

---

## Gap trong repo (nên bổ sung sau)

| Gap | Trạng thái hiện tại | Ưu tiên |
|-----|---------------------|---------|
| VPC / IAM / S3 / RDS tours | Chưa có folder đầy đủ | Cao |
| `aws/sns.md`, `aws/ecr.md` | File rỗng (có nội dung trong `lambda-tours/`) | Trung bình |
| `aws/dynamo-tours/` | Thư mục trống | Trung bình–cao |
| `aws/elastic-cache-tours/` | Thư mục trống | Trung bình |
| `network/`, `ops/` | Mỏng | Trung bình |

---

## Quy tắc học

1. **Một phase một lúc** — đừng nhảy lung tung giữa interview Q&A và AWS tours.
2. **Demo > chỉ đọc** — Outbox/Saga/read-write-split nên chạy 1 lần.
3. **SAA tách track** — luyện đề chứng chỉ không chen vào lộ trình backend chính → [`saa-c03/LEARNING-PATH.md`](./saa-c03/LEARNING-PATH.md).

---

*File này là “mục lục học” backend + AWS thực chiến. Chi tiết nằm trong từng file được link.*

# AWS SAA-C03 Study Guide (Q1-Q36)

Tài liệu tổng hợp các ý **bắt buộc nắm** từ 36 câu trong `exam-a` để ôn nhanh theo chủ đề.

---

## 1) S3, Data Transfer, Storage Classes

- `S3 Transfer Acceleration + Multipart Upload`: dùng khi upload toàn cầu qua Internet nhanh, file lớn.
- `Snowball Edge`: migration one-time dữ liệu lớn (TB/PB), muốn giảm băng thông WAN.
- `S3 File Gateway`: mở rộng SMB/NFS on-prem lên S3, có cache local, dùng kèm lifecycle.
- `S3 storage classes`:
  - access không dự đoán -> `S3 Intelligent-Tiering`
  - archive dài hạn, hiếm truy cập -> `Glacier Deep Archive`
  - cần chịu mất AZ -> tránh `One Zone-IA`
- `S3 private access từ VPC`: dùng `Gateway VPC Endpoint` (không cần NAT/IGW).

---

## 2) Compute Patterns (EC2, Lambda, Serverless)

- `EC2 -> S3`: luôn dùng `IAM Role (instance profile)`, không dùng IAM user key.
- Website static thuần (HTML/CSS/JS/images): host bằng `S3 static website hosting` (rẻ nhất).
- Flash sale / spike cực lớn: ưu tiên serverless (`CloudFront + API Gateway + Lambda + DynamoDB`) để giảm ops.
- Pipeline xử lý ảnh stateless durable: `S3 -> SQS -> Lambda -> S3`.
- Khi Lambda ghi DB khối lượng lớn: chèn `SQS` để decouple ingest và DB writer.

---

## 3) Database & Data Layer Decisions

- `Secrets Manager + rotation` cho credential RDS/Aurora (ít vận hành hơn file local).
- Rotation credential multi-Region: `Secrets Manager replication + scheduled rotation`.
- Read-heavy, unpredictable, cần HA: `Aurora Multi-AZ + Aurora Replicas + Auto Scaling`.
- RDS dùng ngắt quãng (vd 48h/tháng), muốn tiết kiệm: `snapshot -> delete/terminate -> restore`.
- Clone EBS nhanh, cần I/O cao ngay: `Fast Snapshot Restore (FSR)`.

---

## 4) Messaging, Decoupling, Ordering

- 1 producer -> nhiều consumer, burst lớn: `SNS fan-out + SQS queue per consumer`.
- Job coordination hiện đại: thay coordinator server bằng `SQS + worker ASG`, scale theo queue depth.
- Cần strict ordering cho order processing: `SQS FIFO` (không dùng SNS / SQS Standard).
- Near-real-time stream + xử lý PII + fan-out: `Kinesis Data Streams + Lambda + DynamoDB`.

---

## 5) Networking, Edge, Global

- App global static + dynamic: `CloudFront multi-origin (S3 + ALB)`.
- VoIP UDP multi-Region, latency thấp + failover: `NLB + Global Accelerator`.
- Third-party firewall appliance inline: `Gateway Load Balancer + GWLB Endpoint`.
- Managed L3/L4/L7 firewall trong VPC: `AWS Network Firewall`.

---

## 6) Security, Governance, Compliance

- Giới hạn S3 cho account trong tổ chức: bucket policy với `aws:PrincipalOrgID`.
- Bắt buộc tagging resource: `AWS Config required-tags rule`.
- Theo dõi config drift: `AWS Config`.
- Audit API call history: `AWS CloudTrail`.
- DDoS quy mô lớn cho ELB public: `AWS Shield Advanced`.
- Dashboard cho người không có AWS account: `CloudWatch dashboard sharing`.

---

## 7) Analytics, Reporting, Cost Tools

- Query JSON log trực tiếp trên S3, on-demand: `Amazon Athena`.
- BI dashboard từ S3 + RDS với phân quyền người dùng: `Amazon QuickSight (users/groups)`.
- Phân tích chi phí AWS theo chiều sâu (instance type, time range): `Cost Explorer`.

---

## 8) Dịch vụ dễ nhầm (Exam Traps)

- `Config` vs `CloudTrail`:
  - Config = resource configuration changes
  - CloudTrail = API activity
- `GuardDuty` vs `Network Firewall`:
  - GuardDuty = phát hiện threat
  - Network Firewall = inspect/filter inline
- `Firewall Manager` vs `Network Firewall`:
  - Firewall Manager = quản trị policy tập trung
  - Network Firewall = firewall engine thực thi
- `SQS Standard` vs `SQS FIFO`:
  - Standard = best-effort ordering
  - FIFO = strict ordering + dedup
- `ALB` vs `NLB`:
  - ALB = HTTP/HTTPS (L7)
  - NLB = TCP/UDP (L4)

---

## 9) Checklist ôn nhanh trước thi

- Tôi phân biệt được khi nào dùng `S3 TA`, `Snowball`, `DataSync`, `File Gateway`.
- Tôi nhớ rõ `SQS FIFO` cho ordering và `SNS+SQS` cho fan-out decouple.
- Tôi nắm chắc `Config vs CloudTrail`, `GuardDuty vs Network Firewall`.
- Tôi biết pattern global performance: `CloudFront`, `Global Accelerator`.
- Tôi nhớ các đáp án serverless low-ops cho workload biến động.
- Tôi biết bối cảnh chọn `Aurora Replicas`, `Secrets Manager`, `FSR`.

---

## 10) Mapping nhanh theo câu

- Data transfer/storage: Q1, Q6, Q9, Q22, Q23
- S3/IAM/VPC endpoint: Q3, Q4, Q17, Q31, Q36
- Messaging/queue/ordering: Q7, Q8, Q10, Q18, Q25, Q33
- Database/credential/scale: Q11, Q13, Q14, Q20, Q30
- Security/compliance/network firewall/DDoS: Q15, Q19, Q26, Q34, Q35
- Global edge/performance: Q12, Q21, Q29
- Reporting/cost visibility: Q2, Q16, Q24, Q27, Q28, Q32

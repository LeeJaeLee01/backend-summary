# NoSQL vs SQL — Khi nào dùng loại nào?

## Tóm tắt một câu

**SQL** (PostgreSQL, MySQL): schema cố định, ACID, JOIN, transaction — phù hợp **nghiệp vụ cốt lõi** (order, payment, user). **NoSQL**: scale ngang, schema linh hoạt — phù hợp **volume lớn, access pattern đơn giản** (cache, log, feed, session).

---

## So sánh

| | **SQL (relational)** | **NoSQL** |
|---|---------------------|-----------|
| Schema | Cố định, migration | Linh hoạt (document) hoặc không schema (KV) |
| Transaction | ACID mạnh | Tùy DB (Mongo 4+ multi-doc tx; Redis hạn chế) |
| Query | SQL, JOIN phức tạp | Key lookup, aggregation hạn chế |
| Scale | Vertical + read replica; shard khó | Shard ngang dễ hơn (Cassandra, Dynamo) |
| Consistency | Strong mặc định | Thường eventual (tunable) |

---

## Loại NoSQL

| Loại | Ví dụ | Dùng khi |
|------|-------|----------|
| **Key-Value** | Redis, DynamoDB | Cache, session, rate limit |
| **Document** | MongoDB | JSON linh hoạt, catalog, CMS |
| **Column-family** | Cassandra, HBase | Time series, write-heavy khổng lồ |
| **Graph** | Neo4j | Quan hệ phức tạp (social graph, fraud) |
| **Search** | Elasticsearch | Full-text, log analytics |

---

## Case cụ thể

| Bài toán | Chọn | Vì sao |
|----------|------|--------|
| Order, payment, inventory | **PostgreSQL** | ACID, FK, transaction, báo cáo JOIN |
| Session / cache hot data | **Redis** | Sub-ms, TTL, không cần durable phức tạp |
| Product catalog JSON đa dạng | **MongoDB** hoặc Postgres JSONB | Schema thay đổi; Postgres JSONB nếu đã có SQL stack |
| Log 1B events/ngày | **Elasticsearch** / **ClickHouse** | Write throughput, search aggregate |
| Feed timeline 100M user | **Cassandra** + cache | Partition key `user_id`, scale ngang |
| Friend-of-friend 3 hop | **Neo4j** | Graph traversal SQL khó |

**Polyglot persistence:** Order DB = Postgres; search = ES; cache = Redis — sync qua event.

---

## Khi KHÔNG thay SQL bằng NoSQL

- Cần transaction xuyên nhiều entity (chuyển tiền, đặt hàng).
- Báo cáo ad-hoc JOIN nhiều bảng.
- Team chỉ quen SQL, data < vài TB — Postgres đủ.

---

## Câu trả lời ngắn (phỏng vấn)

SQL cho **source of truth** cần ACID và query phức tạp. NoSQL cho **scale, pattern đơn giản, schema linh hoạt** — cache, log, feed. Thực tế thường **kết hợp** nhiều store theo access pattern.

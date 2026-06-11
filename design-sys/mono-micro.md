# Monolith vs Tách Service — Tại sao cần tách?

Hệ thống backend có thể gom **một process / một codebase** (monolith) hoặc chia **nhiều service độc lập** (microservices, hoặc vài service lớn — “modular services”). Câu hỏi thực tế không phải “cái nào đúng” mà **khi nào mono đủ, khi nào bắt buộc phải tách**.

> Nguyên tắc mặc định: **bắt đầu monolith có cấu trúc tốt**, chỉ tách khi có **lý do vận hành hoặc tổ chức** rõ ràng — không tách vì “microservices là xu hướng”.

---

## 1. Ba mô hình thường gặp

```
┌─────────────────────────────────────────────────────────────────┐
│  MONOLITH (1 app)                                                │
│  API + Auth + Orders + Billing + Notification trong 1 process   │
│  1 DB (hoặc vài schema) — deploy 1 artifact                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  MODULAR MONOLITH (vẫn 1 deploy)                                 │
│  Module orders │ module billing │ module notify — ranh giới code │
│  Giao tiếp in-process, không HTTP giữa module                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐  HTTP/gRPC  ┌──────────────┐  event  ┌──────────────┐
│ Order Svc    │◄───────────►│ Billing Svc  │◄───────►│ Notify Svc   │
│ DB riêng     │             │ DB riêng     │         │ queue riêng  │
└──────────────┘             └──────────────┘         └──────────────┘
        MICROSERVICES / MULTI-SERVICE
```

| Mô hình | Deploy | DB | Phù hợp khi |
|---------|--------|-----|-------------|
| **Monolith** | 1 unit | Thường 1 DB shared | Team nhỏ, MVP, domain chưa ổn định |
| **Modular monolith** | 1 unit | 1 DB hoặc schema tách logic | Team vừa, cần ranh giới code trước khi tách process |
| **Multi-service** | N unit | DB/service riêng (lý tưởng) | Scale độc lập, team độc lập, domain đã rõ |

---

## 2. Vì sao nên bắt đầu với monolith?

Monolith **không phải** anti-pattern. Phần lớn sản phẩm thành công từng là mono rất lâu.

| Lợi ích mono | Giải thích |
|--------------|------------|
| **Giao dịch đơn giản** | `BEGIN … COMMIT` trong 1 DB — không distributed transaction |
| **Debug dễ** | 1 stack trace, 1 log stream, breakpoint xuyên module |
| **Deploy đơn giản** | 1 pipeline, 1 version — không orchestrate N service |
| **Latency thấp** | Gọi hàm in-process, không serialize HTTP/gRPC |
| **Chi phí hạ tầng thấp** | Ít pod, ít load balancer, ít observability phức tạp |
| **Refactor nhanh** | Đổi interface module = đổi import, không versioning API |

**Khi mono là lựa chọn đúng:**

- Team < ~8–10 dev, cùng codebase, cùng release cadence
- Sản phẩm đang tìm product-market fit — domain boundary chưa chắc
- Traffic chưa đến mức 1 service là bottleneck riêng
- Không có yêu cầu compliance bắt buộc cô lập (PCI zone, data residency tách cứng)

---

## 3. Tại sao lại **cần** tách service? (Lý do thật, không phải buzzword)

Tách service **đổi đổi chi phí vận hành** để giải quyết pain mà mono/modular mono **không còn đủ**. Dưới đây là các lý do hay gặp trong production.

### 3.1. Scale độc lập theo tải (scaling dimension khác nhau)

Một phần hệ thống hot, phần còn lại im.

| Ví dụ | Mono | Tách service |
|-------|------|--------------|
| Black Friday: đọc catalog 100×, ghi order 10× | Scale **cả** app + DB | Scale **read API** / CDN / replica riêng |
| Video transcode CPU-heavy | CPU spike làm chậm API login | Worker pool riêng, không ảnh hưởng latency API |
| Report batch đêm | Job chiếm connection pool | Service report + queue, API ban ngày ổn định |

```
Traffic
   │
   │     ┌─ Order API (scale 10 pod)
   │    ╱
   │   ╱   ┌─ Catalog API (scale 2 pod đủ)
   │  ╱   ╱
   └──╱───╱────────────────────────► thời gian
```

**Dấu hiệu:** bạn scale toàn bộ monolith chỉ vì **1 endpoint / 1 job** — phần còn lại idle, lãng phí tiền và tăng blast radius khi deploy.

---

### 3.2. Ranh giới team & tốc độ release (Conway’s Law)

```
Team A (Orders)     Team B (Billing)     Team C (Platform)
      │                    │                      │
      └────── cùng 1 repo monolith ──────────────┘
                    │
            merge conflict, chờ nhau release,
            regression cross-module, “ai deploy?”
```

Khi **nhiều team** sở hữu domain khác nhau:

- Mỗi team muốn **deploy độc lập** — fix billing không cần regression full orders
- Ownership rõ: service X thuộc team Y, on-call riêng
- Contract API/version giữa team thay vì share DB tables

**Dấu hiệu:** release train 2 tuần/lần vì “sợ đụng module kia”; 1 thay đổi nhỏ kéo theo test cả hệ thống.

---

### 3.3. Fault isolation — giảm blast radius

Monolith: bug memory leak ở module notification → **cả API chết**.

```
Monolith                         Tách service
┌─────────────────┐              ┌─────────┐  ┌──────────────┐
│ Orders          │              │ Orders  │  │ Notification │
│ Billing         │   crash all  │ OK      │  │ CRASH        │
│ Notification 💥 │              └─────────┘  └──────────────┘
└─────────────────┘              User vẫn đặt hàng; notify retry sau
```

**Dấu hiệu:** incident 1 module làm sập toàn site; SLA khác nhau (orders 99.99% vs internal admin 99.5%) nhưng cùng process.

---

### 3.4. Công nghệ & runtime khác nhau

| Use case | Stack hợp lý | Khó trong mono |
|----------|--------------|----------------|
| ML inference | Python + GPU | NestJS mono phải nhét Python sidecar |
| Real-time chat | Go / Elixir | Khác ecosystem với CRUD Node |
| Legacy billing | Java cũ | Không muốn rewrite, bọc service |
| Heavy PDF/Excel | Lambda / worker | Timeout HTTP mono 30s không đủ |

Tách service cho phép **chọn stack phù hợp bounded context**, không ép 1 ngôn ngữ cho mọi bài toán.

---

### 3.5. Bảo mật, compliance & data isolation

Một số domain **bắt buộc** tách về mặt kiến trúc:

| Yêu cầu | Vì sao mono khó |
|---------|------------------|
| **PCI-DSS** (thẻ tín dụng) | Card data zone tách network + DB; mono dễ leak qua log/query chung |
| **PII / GDPR** | Xóa/export data user — scope nhỏ hơn nếu identity service riêng |
| **Multi-tenant enterprise** | Khách lớn yêu cầu dedicated instance / schema / region |
| **Least privilege DB** | Billing service chỉ GRANT bảng invoices — mono thường 1 DB user full quyền |

```
┌─────────────────┐     ┌─────────────────┐
│  Public API     │     │  Payment Svc    │  ← VPC riêng, audit riêng
│  (no card data) │────►│  token vault    │
└─────────────────┘     └─────────────────┘
```

---

### 3.6. Chu kỳ thay đổi & độ phức tạp domain khác nhau

| Domain | Tần suất đổi | Độ phức tạp |
|--------|--------------|-------------|
| Core orders | Ổn định, ít đổi | Cao — cần test kỹ |
| Marketing campaign | Đổi hàng tuần | Thấp — thử nghiệm nhanh |
| Integration đối tác | Mỗi khách 1 API | Trung bình — plugin hóa |

Gom chung mono → thay đổi campaign **risk regression** core orders. Tách integration/campaign service giảm rủi ro lên luồng chính.

---

### 3.7. Vòng đời & deprecation

- Service cũ (v1) chạy song song v1 API gateway route `/v1/*`
- Rewrite module billing từng phần (**strangler fig**) mà không freeze toàn monolith
- Sunset feature: tắt 1 service, không đụng 200k dòng còn lại

---

## 4. Chi phí khi tách — đừng tách nếu chưa chấp nhận được

Tách service **không miễn phí**. Đây là lý do nhiều team tách sớm rồi **chậm hơn mono**.

| Chi phí | Hệ quả |
|---------|--------|
| **Distributed system** | Network fail, timeout, retry, idempotency |
| **Giao dịch phân tán** | Không còn 1 `COMMIT` — cần Saga, Outbox, eventual consistency |
| **Observability** | Trace ID xuyên service, correlate log, metric per service |
| **Deploy & infra** | K8s, service mesh, secrets, N pipeline |
| **Contract & versioning** | Breaking change API → consumer coordination |
| **Data consistency** | Không JOIN cross-service; duplicate data / projection |
| **Local dev** | Docker compose 10 container vs `npm run start` |
| **Testing** | Integration test + contract test + staging phức tạp |

```
Mono:     Client ──► App ──► DB          (3 hop logic)

Micro:    Client ──► GW ──► Svc A ──► DB A
                      └──► Svc B ──► DB B
                      └──► Queue ──► Svc C
                      (mỗi hop = failure mode mới)
```

**Quy tắc:** nếu team chưa vận hành tốt **logging, monitoring, CI/CD, DB migration** trên mono — tách service sẽ **nhân độ phức tạp**, không giảm.

---

## 5. Modular monolith — bước trung gian (thường đủ lâu)

Trước khi tách process, tách **ranh giới trong code**:

```
src/
  modules/
    orders/       ← không import trực tiếp billing/internals
    billing/
    notification/
  shared/         ← chỉ primitive, không business logic chéo
```

| Quy tắc modular mono | Mục đích |
|----------------------|----------|
| Module chỉ expose public API (service interface) | Sau này thay bằng HTTP/gRPC |
| Không query bảng module khác — gọi qua interface | Tránh shared DB coupling |
| Event in-process (hoặc outbox) | Sẵn sàng sang message bus |
| Migration theo module/schema | Billing schema tách logic |

Khi pain đủ lớn → extract **1 module** thành service đầu tiên (thường là read-heavy hoặc integration), không “big bang” cắt hết.

---

## 6. Khi nào nên tách? — Checklist quyết định

Tách **một** bounded context khi **≥ 2** điều sau đúng và đã thử tối ưu trong mono:

```
□ Scale: 1 phần cần N× tài nguyên so với phần còn lại — scale cả mono lãng phí
□ Team: ≥ 2 team ownership rõ, release cadence khác nhau, conflict thường xuyên
□ Reliability: SLA / blast radius yêu cầu cô lập failure
□ Compliance: bắt buộc network/DB/audit tách (PCI, dedicated tenant)
□ Tech: runtime khác (GPU, batch, legacy) không hợp trong 1 process
□ Domain: boundary ổn định ≥ 6 tháng — không tách theo “tưởng tượng”
□ Vận hành: đã có trace, metric, CI/CD, on-call — chịu được độ phức tạp distributed
```

**Không tách khi:**

```
□ Chưa có traffic / team / domain problem cụ thể
□ Muốn “học microservices” trên production
□ Hy vọng tách sẽ tự fix code spaghetti (cần refactor trước)
□ Chưa giải quyết được transaction / consistency trong mono
```

---

## 7. Thứ tự tách hợp lý (Strangler Fig)

Không cắt monolith một lúc. Thứ tự thường an toàn:

| Thứ tự | Candidate | Lý do |
|--------|-----------|-------|
| 1 | **Read API / BFF** | Stateless, dễ scale, rollback dễ |
| 2 | **Notification / email / webhook** | Async, chịu eventual consistency |
| 3 | **File / media processing** | CPU, queue, tách khỏi request path |
| 4 | **Integration đối tác** | Biến động cao, isolate failure |
| 5 | **Billing / payment** | Compliance — nhưng phức tạp transaction |
| 6 | **Core domain (orders)** | Cuối cùng — nhiều dependency nhất |

```
Phase 1:  [ Monolith ] ──► extract Notify Svc
Phase 2:  [ Monolith ] ──► + Catalog Read Svc
Phase 3:  [ Core Mono ] ──► Billing Svc (Saga + Outbox)
```

---

## 8. So sánh nhanh — câu trả lời cho “tại sao tách?”

| Câu hỏi | Mono đủ | Cần tách |
|---------|---------|----------|
| Team có bao nhiêu người? | 1 team nhỏ | Nhiều team, domain owners |
| Deploy có cần độc lập? | Không | Có — release không block nhau |
| Phần nào cần scale 10×? | Không có / scale cả app OK | Có — 1 workload riêng |
| Có cần 1 transaction ACID cross-domain? | Có — giữ mono/modular | Chấp nhận eventual consistency |
| Compliance zone tách? | Không | Có |
| Debug & time-to-market | Ưu tiên tốc độ | Ưu tiên isolation & scale |

---

## 9. Kết luận

**Monolith** là điểm khởi đầu hợp lý: ít phức tạp, giao dịch đơn giản, ship nhanh.

**Tách service** khi mono tạo ra **vấn đề thật** — scale lệch, team block nhau, blast radius, compliance, stack/runtime khác — và team **đã sẵn sàng trả giá** distributed systems (observability, consistency, vận hành).

**Modular monolith** là con đường an toàn nhất: giữ lợi ích mono, chuẩn bị boundary để tách **từng phần** khi có bằng chứng, không tách theo sơ đồ kiến trúc trên slide.

---

## Tham chiếu trong repo

| Chủ đề | File |
|--------|------|
| Transaction phân tán, Saga, Outbox | [database/transaction-consistency.md](../database/transaction-consistency.md) |
| Connection pool multi-service | [database/connection-pool.md](../database/connection-pool.md) |
| Multi-tenant (tách logic platform vs tenant) | [database/multi-tenant/index.md](../database/multi-tenant/index.md) |
| SOLID / ranh giới module | [clean-code/solid.md](../clean-code/solid.md) |

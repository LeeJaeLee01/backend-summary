# Tách service dựa trên cái gì? — Tiêu chí, lý do & ví dụ thực chiến

Câu hỏi “tách bao nhiêu service?” không trả lời bằng số cố định. Ranh giới đúng đến từ **domain**, **ownership dữ liệu**, và **ràng buộc vận hành** — không tách theo layer kỹ thuật (`UserService`, `OrderService` chỉ vì có bảng `users`, `orders`).

> Bổ sung: [mono-micro.md](./mono-micro.md) — khi nào mono đủ, chi phí khi tách.

---

## 1. Tách service dựa trên **cái gì**?

### 1.1. Bounded Context (DDD) — tiêu chí số 1

Mỗi service = **một ngữ cảnh nghiệp vụ** có:

- **Ubiquitous language** riêng (thuật ngữ thống nhất trong team)
- **Model riêng** — cùng từ “Order” ở billing và warehouse có thể khác nghĩa
- **Quy tắc thay đổi** độc lập

```
❌ Tách theo layer kỹ thuật          ✅ Tách theo bounded context
┌─────────────┐                      ┌─────────────┐  ┌─────────────┐
│ User Layer  │                      │  Identity   │  │   Orders    │
│ Order Layer │                      │  (auth)     │  │  (đặt hàng) │
│ Pay Layer   │                      └─────────────┘  └─────────────┘
└─────────────┘                      Mỗi context = 1 lý do thay đổi
```

| Dấu hiệu đúng boundary | Dấu hiệu boundary sai |
|------------------------|------------------------|
| Team nói cùng ngôn ngữ domain | Chỉ gom vì cùng DB table |
| Rule nghiệp vụ đổi cùng nhau | Service A phải biết schema nội bộ của B |
| Có thể mô tả API bằng event/command rõ | Mọi thứ cần JOIN realtime cross-service |

---

### 1.2. Data ownership — “ai sở hữu dữ liệu?”

**Mỗi service sở hữu dữ liệu của mình** (database per service — lý tưởng). Service khác **không** `UPDATE` trực tiếp bảng của nhau.

| Nguyên tắc | Ý nghĩa |
|------------|---------|
| **Single writer** | Chỉ 1 service ghi vào aggregate gốc |
| **Read qua API/event** | Cần data bên kia → gọi API hoặc subscribe projection |
| **ID tham chiếu, không FK cross-DB** | `order_id`, `customer_id` — không `JOIN` cross DB production |

```
Order Service                    Billing Service
┌──────────────────┐            ┌──────────────────┐
│ orders (owner)   │  event     │ invoices (owner) │
│ order_items      │ ────────►  │ payments         │
└──────────────────┘ OrderPaid  └──────────────────┘
```

---

### 1.3. Cohesion cao, coupling thấp

**Gom** những thứ thay đổi **cùng lúc**, **tách** những thứ kéo nhau khi scale/deploy khác nhau.

| Cohesion cao (nên cùng service) | Coupling cao (nên tách nếu pain đủ lớn) |
|---------------------------------|----------------------------------------|
| Tạo order + validate inventory trong 1 transaction ngắn | Notification retry 3 ngày vs API đặt hàng 50ms |
| CRUD product + category trong catalog | PDF export 2 phút vs login |
| Auth + session + refresh token | Integration webhook đối tác biến động hàng tuần |

---

### 1.4. Ba trục quyết định (dùng khi phân tích)

| Trục | Câu hỏi | Ảnh hưởng tách |
|------|---------|----------------|
| **Thay đổi (change)** | Domain này đổi bao nhiêu lần/tháng? | Đổi nhanh → tách khỏi core ổn định |
| **Scale (load)** | CPU/RPS/QPS profile? | Read-heavy vs write-heavy vs batch |
| **Tổ chức (team)** | Ai on-call, ai ship? | Conway’s Law — structure follow communication |

```
              Scale cao
                 │
    ┌────────────┼────────────┐
    │  Catalog   │  Notify   │  ← tách sớm (scale/async)
    │  (read)    │  (async)  │
────┼────────────┼────────────┼──── Change cao
    │  Core      │  Integr.  │  ← tách để team độc lập
    │  Orders    │  Partners  │
    └────────────┴────────────┘
                 │
            Team lớn / compliance
```

---

### 1.5. Transaction boundary — ranh giới cứng

Nếu hai phần **bắt buộc ACID trong 1 commit** và tần suất cao → **cân nhắc giữ chung** (modular monolith hoặc cùng service).

Nếu chấp nhận **eventual consistency** (Saga, Outbox) → có thể tách.

| Luồng | ACID cần? | Gợi ý |
|-------|-----------|-------|
| Tạo order + trừ tồn kho | Thường cần mạnh | Cùng service hoặc Saga có compensation |
| Order paid → gửi email | Không | Event `OrderPaid` → Notification service |
| Đổi plan subscription → invoice | Có thể eventual | Billing service + retry |

---

### 1.6. Checklist trước khi tách 1 bounded context

```
□ Có tên domain rõ (không phải "misc-service")
□ Biết bảng nào service này OWN (ghi)
□ Service khác chỉ đọc qua API/event — không share table
□ Team hoặc scale hoặc compliance có lý do tách — không chỉ "cho đẹp"
□ Đã thiết kế failure: timeout, retry, idempotency, dead letter
□ Chấp nhận không JOIN cross-service trong query user-facing
```

---

## 2. Tại sao lại tách **như thế**? (Logic sau ranh giới)

Mỗi đường cắt phải trả lời được **ít nhất 2 câu**:

1. **Pain gì của mono** mà cắt này giải quyết?
2. **Chi phí gì** chấp nhận đổi lại (network, consistency, ops)?

| Ranh giới | Pain mono giải quyết | Vì sao không gom chung |
|-----------|----------------------|-------------------------|
| Identity ↔ Business | Auth đổi OAuth/MFA không regression orders | Security blast radius nhỏ; scale login riêng |
| Orders ↔ Billing | Team billing ship hàng tuần; orders ổn định | PCI/compliance zone; transaction model khác |
| Core API ↔ Notification | Email/SMS retry làm đầy thread pool | Async, scale worker, failure isolated |
| Catalog read ↔ Order write | Black Friday đọc catalog 50× ghi order | Read replica / cache riêng, không scale ghi |
| Platform ↔ Tenant app | Multi-tenant metadata vs tenant data | Đã có trong [multi-tenant](../database/multi-tenant/index.md) |

**Không tách** khi:

- Chỉ có 1–2 dev, chưa có pain scale/team
- Boundary domain còn đổi mỗi sprint
- Mọi request cần strong consistency cross-domain

---

## 3. Ví dụ: Hệ thống **ShopFlow** — SaaS quản lý đơn hàng B2B (multi-tenant)

### 3.1. Bối cảnh

**ShopFlow** — SaaS cho SME bán hàng online (B2B nhỏ):

- Multi-tenant: `acme.shopflow.com`, `globex.shopflow.com`
- Ban đầu: **1 monolith NestJS** + **1 PostgreSQL** (schema `platform` + `tenant_*`)
- ~15 dev, 3 team mới hình thành
- Pain sau 18 tháng:
  - Catalog browse **10×** traffic ghi order dịp sale
  - Team Integration thêm webhook đối tác **mỗi tuần** → regression orders
  - Email/SMS queue backlog làm **timeout** API checkout
  - Khách enterprise yêu cầu **billing tách audit** (SOC2)

### 3.2. Monolith ban đầu (1 deploy)

```
┌─────────────────────────────────────────────────────────────────┐
│                    shopflow-api (monolith)                       │
├─────────────────────────────────────────────────────────────────┤
│  PlatformModule    │ tenants, platform_users, subscriptions    │
│  AuthModule        │ login tenant + platform, JWT, refresh       │
│  CatalogModule     │ products, categories (tenant schema)        │
│  OrderModule       │ cart, checkout, orders                      │
│  BillingModule     │ invoices, Stripe webhook                    │
│  NotifyModule      │ email, SMS, push                            │
│  IntegrationModule │ Shopify sync, partner webhooks              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    PostgreSQL (platform + tenant_*)
```

**Vấn đề:** module share DB, deploy 1 lần, scale 1 lần, bug Notify ảnh hưởng Checkout.

---

### 3.3. Phân tích bounded context

| Context | Ngôn ngữ domain | Entity chính | Đổi/tháng | Scale | Team |
|---------|-----------------|--------------|-----------|-------|------|
| **Identity & Tenant** | tenant, user, session | tenants, tenant_users | Thấp | Trung bình | Platform |
| **Catalog** | SKU, price, stock view | products, categories | Trung bình | **Rất cao (read)** | Commerce |
| **Order** | cart, checkout, fulfillment | orders, order_items | Thấp | Cao (write) | Commerce |
| **Billing** | plan, invoice, payment | subscriptions, invoices | Trung bình | Thấp | **Billing** (mới) |
| **Notification** | template, channel, delivery | templates, outbox | Cao | Batch/async | Shared |
| **Integration** | connector, sync, webhook | connectors, jobs | **Rất cao** | Batch | **Integrations** |

**Kết luận phân tích:**

- **Catalog read** tách khỏi Order write — scale profile khác
- **Notification** tách — async, không nằm request path
- **Integration** tách — change rate cao, isolate failure
- **Billing** tách — team riêng + compliance
- **Order + Cart** giữ **core** lâu nhất — transaction phức tạp
- **Identity** có thể tách hoặc giữ trong API Gateway + auth service nhỏ

---

### 3.4. Kiến trúc sau khi tách (mục tiêu)

```
                         ┌─────────────┐
                         │  API Gateway │  + BFF (optional)
                         │  / CDN       │
                         └──────┬──────┘
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Identity Svc  │    │ Catalog Svc   │    │  Order Svc    │
│ platform DB   │    │ read replica  │    │ tenant orders │
│ JWT, tenants  │    │ cache Redis   │    │ cart/checkout │
└───────────────┘    └───────────────┘    └───────┬───────┘
        │                      │                    │
        │                      │    events (SNS/SQS/Kafka)
        │                      │                    │
        ▼                      ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Billing Svc   │    │ Notify Worker │    │ Integration   │
│ invoices, PCI │    │ email, SMS    │    │ webhooks, ETL │
│ zone hẹp      │    │ DLQ, retry    │    │ partner APIs  │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

### 3.5. Tại sao tách **đúng từng khối**?

#### A. `Catalog Service` (tách đầu tiên)

| Dựa trên | Giải thích |
|----------|------------|
| **Scale** | 90% traffic GET `/products` — không cần scale Order DB |
| **Data ownership** | Product catalog = read model; Order chỉ cần `product_id` + snapshot giá lúc mua |
| **Coupling** | Order không JOIN `products` realtime — lưu `unit_price` trong `order_items` |

```
GET /products  → Catalog Svc (10 pod + Redis)
POST /orders   → Order Svc (3 pod)
```

#### B. `Notification Worker` (tách thứ 2)

| Dựa trên | Giải thích |
|----------|------------|
| **Cohesion** | Gửi mail không thuộc domain “đặt hàng” |
| **Async** | `OrderPlaced` event → queue → worker retry 72h |
| **Failure isolation** | SendGrid down không làm 503 checkout |

#### C. `Integration Service` (tách thứ 3)

| Dựa trên | Giải thích |
|----------|------------|
| **Change rate** | Mỗi đối tác 1 adapter — ship không đụng Order |
| **Runtime** | Job dài, cron, rate limit API ngoài |
| **Blast radius** | Webhook bug loop không ăn CPU Order |

#### D. `Billing Service` (tách thứ 4)

| Dựa trên | Giải thích |
|----------|------------|
| **Team** | Team Billing on-call riêng |
| **Compliance** | Stripe webhook, invoice — audit log tách VPC |
| **Transaction** | `OrderPaid` → Billing tạo invoice (Saga, không 1 COMMIT) |

#### E. `Order Service` — **giữ core, tách cuối**

| Dựa trên | Giải thích |
|----------|------------|
| **ACID** | Checkout: validate cart, tạo order, trừ stock (hoặc reserve) |
| **Risk** | Nhiều dependency nhất — migrate strangler từng endpoint |

---

### 3.6. Luồng checkout sau khi tách

```
Client                    Order Svc          Catalog Svc       Queue           Notify Worker
  │                          │                    │               │                  │
  │ POST /checkout           │                    │               │                  │
  │─────────────────────────►│                    │               │                  │
  │                          │ GET /products/:id  │               │                  │
  │                          │───────────────────►│               │                  │
  │                          │◄───────────────────│ price, stock  │                  │
  │                          │ BEGIN (local TX)   │               │                  │
  │                          │ INSERT order       │               │                  │
  │                          │ COMMIT             │               │                  │
  │                          │ publish OrderPlaced│               │                  │
  │                          │────────────────────────────────────►│                  │
  │◄─────────────────────────│ 201 order_id       │               │                  │
  │                          │                    │               │ consume          │
  │                          │                    │               │─────────────────►│
  │                          │                    │               │                  │ send email
```

**Điểm quan trọng:**

- Order **snapshot** `unit_price` — không phụ thuộc catalog sau commit
- Notify **không** trong HTTP path — eventual OK
- Catalog down lúc checkout → Order fail fast có timeout; không deadlock toàn hệ thống

---

### 3.7. Sở hữu database sau tách

| Service | Database | Ghi | Đọc từ service khác |
|---------|----------|-----|---------------------|
| Identity | `platform` (tenants, users) | ✅ | JWT claims — không query tenant business |
| Catalog | `catalog_db` hoặc tenant schema read replica | ✅ products | API `GET /products/:id` |
| Order | `tenant_*` orders tables | ✅ orders | Không cho Billing UPDATE orders |
| Billing | `billing_db` | ✅ invoices | Subscribe `OrderPaid` |
| Notify | `notify_db` (templates, delivery log) | ✅ | Chỉ event |
| Integration | `integration_db` | ✅ connectors | Gọi Order API có idempotency-key |

**Multi-tenant:** mỗi Order/Catalog vẫn có thể `SET search_path tenant_acme` — Catalog service nhận `X-Tenant-Id` từ JWT, không nhận schema từ client.

---

### 3.8. Lộ trình migrate (Strangler Fig) — 6 tháng

| Phase | Việc làm | Rủi ro |
|-------|----------|--------|
| **0** | Modular monolith — module không import chéo DB | Thấp |
| **1** | Extract Catalog read → route `GET /products*` qua service mới | Thấp — read only |
| **2** | Outbox table trong mono → publish `OrderPlaced` | Trung bình |
| **3** | Notify worker consume queue, tắt sync email trong mono | Thấp |
| **4** | Integration jobs chuyển hẳn | Trung bình |
| **5** | Billing + Stripe webhook | Cao — test Saga |
| **6** | Order service tách write path | Cao — dual-write / shadow read trước |

```
Traffic
  100% ──► Monolith
           │
Phase 1    ├── GET /products ──► Catalog Svc (10%)
Phase 3    ├── events ──► Notify (async)
Phase 6    └── POST /orders ──► Order Svc (dần 100%)
```

---

### 3.9. Event contract (vì sao tách được mà không vỡ data)

```json
// Order Service publish
{
  "type": "OrderPlaced",
  "order_id": "uuid",
  "tenant_id": "uuid",
  "customer_email": "a@acme.com",
  "total": 1500000,
  "currency": "VND",
  "items": [{ "product_id": "uuid", "qty": 2, "unit_price": 750000 }]
}
```

| Consumer | Dùng field nào | Không được giả định |
|----------|----------------|---------------------|
| Notify | email, order_id, total | Schema bảng `orders` nội bộ |
| Billing | order_id, tenant_id, total | JOIN `order_items` trực tiếp |
| Integration | order_id, items (sync ERP) | Gọi DB Order |

→ **Tách dựa trên contract**, không dựa trên “cùng database”.

---

## 4. Tóm tắt — trả lời 3 câu hỏi

| Câu hỏi | Trả lời ngắn |
|---------|--------------|
| **Tách dựa trên cái gì?** | Bounded context (DDD), data ownership, cohesion/coupling, scale/change/team, transaction boundary |
| **Tại sao tách như thế?** | Mỗi cắt giải pain cụ thể (scale read, async notify, team billing, compliance) và chấp nhận eventual consistency có chủ đích |
| **Ví dụ?** | ShopFlow: mono → Catalog → Notify → Integration → Billing → Order core; event `OrderPlaced` nối các service |

**Một dòng nhớ lâu:** Tách theo **cách business thay đổi và sở hữu data**, không tách theo **số bảng trong DB**.

---

## Tham chiếu

| Chủ đề | File |
|--------|------|
| Mono vs micro — khi nào tách | [mono-micro.md](./mono-micro.md) |
| Saga, Outbox, eventual consistency | [database/transaction-consistency.md](../database/transaction-consistency.md) |
| Multi-tenant platform vs tenant | [database/multi-tenant/index.md](../database/multi-tenant/index.md) |
| Connection pool nhiều service | [database/connection-pool.md](../database/connection-pool.md) |

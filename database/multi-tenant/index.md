# Multi-Tenant — Shared Database, Separate Schema

> Mô hình: **một PostgreSQL cluster**, **một database** (`app_db`), mỗi tenant một **schema riêng** (`tenant_acme`, `tenant_globex`).  
> Schema `public` (hoặc `platform`) chứa metadata toàn hệ thống: tenant registry, billing, global users mapping.

**Ví dụ tham chiếu:** [GitLab](https://docs.gitlab.com/ee/development/database/multiple_databases.html) (schema/database isolation tùy deployment), [Supabase](https://supabase.com/docs/guides/platform/multi-tenancy) (RLS + schema pattern), [Citus multi-tenant](https://docs.citusdata.com/en/stable/use_cases/multi_tenant.html) (shared DB, tenant key — khác schema nhưng pattern isolation tương tự).

**Case study giả định trong doc này:** nền tảng **TaskFlow** — SaaS quản lý dự án B2B. Mỗi công ty khách hàng = 1 tenant, subdomain `acme.taskflow.io`.

> **Demo chạy được:** [demo/multi-tenant](../../demo/multi-tenant/) — NestJS + PostgreSQL `platform` / `tenant_*` schema + request lifecycle có comment từng bước.

---

## Diagram tổng quát

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│  Browser / Mobile App                                                        │
│  Host: {tenant}.taskflow.io  hoặc  Header: X-Tenant-ID / JWT claim          │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / LOAD BALANCER                           │
│  TLS termination · rate limit per tenant · WAF                               │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION (NestJS / Go / …)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Tenant       │  │ Auth         │  │ AuthZ        │  │ Tenant DB        │ │
│  │ Resolver     │→ │ Middleware   │→ │ Guard/RBAC   │→ │ Context          │ │
│  │ (subdomain)  │  │ (JWT/OIDC)   │  │ (per tenant) │  │ SET search_path  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ SQL (search_path = tenant_xxx, platform)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              PostgreSQL — SINGLE DATABASE: app_db                            │
│                                                                              │
│  ┌──────────────────────── platform schema ────────────────────────────────┐ │
│  │ tenants · users · tenant_memberships · subscriptions · migrations_log   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ tenant_acme ─┐  ┌─ tenant_globex ─┐  ┌─ tenant_initech ─┐  …           │
│  │ projects      │  │ projects        │  │ projects          │               │
│  │ tasks         │  │ tasks           │  │ tasks             │               │
│  │ comments      │  │ comments        │  │ comments          │               │
│  └───────────────┘  └─────────────────┘  └───────────────────┘           │
│                                                                              │
│  Role: app_runtime (no DDL) · app_migration (DDL all schemas)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### So sánh nhanh với các mô hình khác

| Mô hình | Isolation | Chi phí vận hành | Khi nào chọn |
|---------|-----------|------------------|--------------|
| **Shared table + `tenant_id`** | Thấp–trung (RLS bắt buộc) | Thấp nhất | Startup, nhiều tenant nhỏ |
| **Separate schema** (doc này) | Trung–cao | Trung bình | B2B SaaS, cần backup/restore từng tenant |
| **Separate database** | Cao | Cao | Enterprise, compliance cứng |
| **Separate cluster** | Rất cao | Rất cao | Regulated (healthcare, gov) |

---

## Diagram chi tiết — Request lifecycle

```
  User: alice@acme.com
  URL:  https://acme.taskflow.io/api/projects
                    │
                    ▼
         ┌──────────────────────┐
         │ 1. Tenant Resolver   │
         │ subdomain → acme     │
         │ lookup platform.     │
         │   tenants.slug       │
         └──────────┬───────────┘
                    │ tenant_id=7, schema=tenant_acme, status=active
                    ▼
         ┌──────────────────────┐
         │ 2. Authentication    │
         │ Bearer JWT           │
         │ verify signature     │
         │ iss/aud/exp          │
         └──────────┬───────────┘
                    │ sub=user_uuid, email=alice@acme.com
                    ▼
         ┌──────────────────────┐
         │ 3. Tenant membership │
         │ platform.            │
         │ tenant_memberships     │
         │ WHERE tenant_id=7    │
         │   AND user_id=sub    │
         └──────────┬───────────┘
                    │ role=admin, membership=active
                    ▼
         ┌──────────────────────┐
         │ 4. Authorization     │
         │ projects:read        │
         │ RBAC trong tenant    │
         └──────────┬───────────┘
                    │ allowed
                    ▼
         ┌──────────────────────┐
         │ 5. DB Session        │
         │ BEGIN                │
         │ SET LOCAL            │
         │  search_path =       │
         │  tenant_acme,platform│
         │ SET LOCAL            │
         │  app.tenant_id = 7   │  ← audit / defense-in-depth
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ 6. Query             │
         │ SELECT * FROM        │
         │   projects           │  → resolves to tenant_acme.projects
         └──────────┬───────────┘
                    │
                    ▼
              COMMIT → Response
```

**Điểm fail-fast:**

```
subdomain không tồn tại     → 404 Tenant Not Found
tenant suspended            → 403 Tenant Suspended
JWT invalid/expired         → 401 Unauthorized
user không thuộc tenant     → 403 Forbidden
thiếu permission            → 403 Insufficient Permission
query sai schema (bug)      → empty/wrong data — cần test + monitoring
```

---

## Diagram chi tiết — Tenant provisioning

```
  Admin / Signup API: POST /platform/tenants
              │
              ▼
  ┌───────────────────────────┐
  │ platform.tenants          │
  │ INSERT slug, name, plan   │
  │ status = provisioning     │
  └─────────────┬─────────────┘
                │
                ▼
  ┌───────────────────────────┐
  │ Migration job (per tenant)│
  │ CREATE SCHEMA tenant_acme │
  │ GRANT USAGE to app_runtime│
  │ Run tenant DDL/migrations │
  │ on schema tenant_acme     │
  └─────────────┬─────────────┘
                │
                ▼
  ┌───────────────────────────┐
  │ Seed default data         │
  │ roles, settings, sample   │
  └─────────────┬─────────────┘
                │
                ▼
  ┌───────────────────────────┐
  │ platform.tenant_memberships│
  │ owner user → admin role   │
  └─────────────┬─────────────┘
                │
                ▼
  status = active → tenant usable
```

---

## Diagram chi tiết — Migration pipeline

```
                    ┌─────────────────────────────────┐
                    │ CI/CD: deploy app v2.3.0        │
                    └───────────────┬─────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
  ┌─────────────────────┐                         ┌─────────────────────┐
  │ Phase A: Platform   │                         │ Phase B: Tenant     │
  │ migrations          │                         │ schemas (loop)      │
  │ schema: platform    │                         │                     │
  │ Flyway/Liquibase/   │                         │ FOR EACH tenant IN  │
  │ Prisma migrate      │                         │   active tenants:   │
  └──────────┬──────────┘                         │   SET search_path   │
             │                                    │   run V2.3.0.sql    │
             │                                    │   log per-tenant    │
             │                                    └──────────┬──────────┘
             │                                               │
             └───────────────────────┬───────────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │ platform.schema_migrations       │
                    │ platform.tenant_migrations       │
                    │ (tenant_id, version, applied_at) │
                    └─────────────────────────────────┘

  Rollback strategy:
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Forward-only │  or │ Expand/      │  or │ Per-tenant   │
  │ + fix forward│     │ Contract     │     │ backup before│
  └──────────────┘     └──────────────┘     │ risky DDL    │
                                              └──────────────┘
```

---

## Diagram chi tiết — Data isolation layers (defense in depth)

```
  Layer 1 — Network / Gateway
  ├── Rate limit theo tenant_id
  └── Block cross-tenant header spoofing (chỉ trust subdomain hoặc signed JWT)

  Layer 2 — Application
  ├── TenantContext bắt buộc mọi repository call
  ├── Không cho phép raw query không qua tenant wrapper
  └── Integration test: tenant A không đọc được data tenant B

  Layer 3 — Connection / Session
  ├── SET search_path = tenant_xxx, platform
  ├── SET LOCAL app.tenant_id (cho audit trigger)
  └── Connection pool: reset search_path khi release connection

  Layer 4 — Database permissions
  ├── app_runtime: USAGE on tenant_xxx, no CREATE
  ├── REVOKE ALL ON SCHEMA tenant_other FROM app_runtime
  └── Optional: RLS trên platform tables

  Layer 5 — Ops
  ├── Backup/restore per schema (pg_dump -n tenant_acme)
  ├── Alert: query không có tenant context
  └── Audit log: tenant_id trên mọi write
```

---

## Roadmap triển khai — Mục lục file con

| # | File đề xuất | Trạng thái | Nội dung chính |
|---|--------------|------------|----------------|
| 1 | `architecture.md` | ⬜ TODO | Schema layout, naming convention, tenant registry |
| 2 | `tenant-provisioning.md` | ⬜ TODO | Onboarding, offboarding, suspend, delete |
| 3 | `migration.md` | ⬜ TODO | Platform vs tenant migrations, versioning, zero-downtime |
| 4 | `authentication.md` | ⬜ TODO | Identity provider, JWT claims, SSO per tenant |
| 5 | `authorization.md` | ⬜ TODO | RBAC/ABAC trong tenant, platform admin vs tenant admin |
| 6 | `data-isolation.md` | ⬜ TODO | search_path, connection pool, RLS bổ sung, leak prevention |
| 7 | `connection-pool.md` | ⬜ TODO | PgBouncer, reset session, pool per role |
| 8 | `operations.md` | ⬜ TODO | Backup per tenant, monitoring, capacity |
| 9 | `case-study-taskflow.md` | ⬜ TODO | End-to-end ví dụ TaskFlow + code snippets |

---

## 1. Migration — các vấn đề cần triển khai

### 1.1. Hai lớp migration

| Lớp | Schema | Ví dụ thay đổi | Tần suất |
|-----|--------|----------------|----------|
| **Platform** | `platform` | Bảng `tenants`, `subscriptions`, thêm cột `plan_tier` | Mỗi release app |
| **Tenant** | `tenant_*` | `projects`, `tasks`, index, trigger | Mỗi release app × số tenant |

**Quy tắc:** migration platform **không** được phụ thuộc vào schema tenant và ngược lại.

### 1.2. Chiến lược chạy migration tenant

```
□ Template DDL: 1 bộ file migration áp dụng cho MỌI schema tenant
□ Migration runner: job async (queue) — không block HTTP signup
□ Tracking: bảng platform.tenant_migrations (tenant_id, version, checksum, status)
□ Idempotent: cùng version không chạy lại
□ Parallelism: giới hạn N tenant đồng thời — tránh lock toàn DB
□ Stagger: tenant lớn migrate trước/sau tùy risk
□ Failed tenant: retry + alert, không block tenant khác
```

### 1.3. Zero-downtime DDL trên nhiều schema

| Thay đổi | Pattern | Lưu ý multi-schema |
|----------|---------|---------------------|
| Thêm cột nullable | Deploy code đọc cột mới → migrate → backfill | Chạy song song per schema |
| Đổi tên cột | Expand/Contract (2 phase deploy) | Version app phải support cả 2 tên |
| Thêm index | `CREATE INDEX CONCURRENTLY` | **Phải chạy ngoài transaction** — nhân với số tenant |
| NOT NULL constraint | Backfill trước → validate sau | Check từng tenant |
| Drop column | Contract phase sau khi code cũ tắt | |

### 1.4. Schema versioning & drift detection

```sql
-- platform.tenant_migrations
CREATE TABLE platform.tenant_migrations (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     BIGINT NOT NULL REFERENCES platform.tenants(id),
  version       VARCHAR(64) NOT NULL,
  checksum      VARCHAR(64) NOT NULL,
  applied_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms   INT,
  status        VARCHAR(20) NOT NULL DEFAULT 'success',
  UNIQUE (tenant_id, version)
);
```

**Drift:** cron so sánh `information_schema` của `tenant_acme` vs `tenant_globex` — alert nếu lệch.

### 1.5. Tooling gợi ý

| Tool | Platform | Per-tenant schema |
|------|----------|-------------------|
| Flyway | ✅ callbacks | ✅ `flyway.locations` + dynamic schema |
| Liquibase | ✅ | ✅ `defaultSchemaName` per run |
| Prisma | ✅ multi-schema preview | ⚠️ cần wrapper script loop tenants |
| Atlas | ✅ | ✅ declarative, diff per schema |

### 1.6. Checklist migration

```
□ Role app_migration tách biệt app_runtime
□ Migration CI chạy trên DB ephemeral có ≥2 schema tenant giả
□ Thời gian migrate = f(số_tenant) — estimate trước production
□ Rollback plan: forward-fix vs restore schema từ backup
□ Lock monitoring: pg_locks khi ALTER TABLE
□ Tenant mới luôn nhận full migration history (baseline = latest)
```

---

## 2. Authentication — các vấn đề cần triển khai

### 2.1. Mô hình identity (TaskFlow)

```
┌─────────────────────────────────────────────────────────────┐
│ Identity có thể tồn tại NGOÀI tenant context                 │
│                                                             │
│  platform.users          — user toàn hệ thống (1 email)     │
│  platform.tenant_memberships — user thuộc tenant nào        │
│                                                             │
│  alice@acme.com:                                            │
│    → membership tenant_acme (admin)                         │
│    → membership tenant_globex (viewer)  ← multi-tenant user │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Luồng đăng nhập

| Bước | Mô tả |
|------|-------|
| 1 | User vào `acme.taskflow.io/login` |
| 2 | Resolver xác định `tenant_id` từ subdomain |
| 3 | OIDC/PKCE hoặc email+password → IdP (Auth0, Keycloak, Cognito) |
| 4 | Kiểm tra `tenant_memberships` — user có trong tenant không |
| 5 | Issue JWT (hoặc session) gắn `tenant_id`, `user_id`, `roles` |

### 2.3. JWT claims bắt buộc

```json
{
  "sub": "user_uuid",
  "tid": 7,
  "tslug": "acme",
  "roles": ["admin"],
  "iss": "https://auth.taskflow.io",
  "aud": "taskflow-api",
  "exp": 1718123456
}
```

### 2.4. Các pattern auth theo tenant

| Pattern | Mô tả | Khi dùng |
|---------|-------|----------|
| **Shared IdP, tenant in claim** | Một pool user, membership table | TaskFlow, Notion-style |
| **SSO per tenant (SAML/OIDC)** | Enterprise tenant tự bring IdP | `platform.tenant_idp_config` |
| **Separate login URL** | `acme.taskflow.io` vs `globex.taskflow.io` | Subdomain resolver |
| **API key per tenant** | Service-to-service, webhook | `platform.api_keys` hashed |

### 2.5. Vấn đề cần xử lý

```
□ User thuộc nhiều tenant — UI chọn workspace / switch tenant
□ JWT tid phải khớp subdomain — chống token replay sang tenant khác
□ Refresh token rotation
□ Invite flow: email link → accept → tạo membership
□ Tenant SSO: metadata SAML per tenant, certificate rotation
□ Session invalidation khi remove membership
□ Brute-force: rate limit per tenant + per IP
□ MFA: platform-wide vs bắt buộc theo plan enterprise
```

---

## 3. Authorization — các vấn đề cần triển khai

### 3.1. Hai tầng quyền

```
┌──────────────────────── PLATFORM LEVEL ────────────────────────┐
│ platform_superadmin — quản lý mọi tenant, billing, support     │
│ platform_support    — read-only vào tenant (impersonation có audit)│
└────────────────────────────────────────────────────────────────┘

┌──────────────────────── TENANT LEVEL ──────────────────────────┐
│ owner   — billing, delete tenant, manage SSO                   │
│ admin   — CRUD members, settings                               │
│ member  — CRUD business data (projects, tasks)                 │
│ viewer  — read-only                                            │
│ custom  — fine-grained permissions (RBAC table trong schema) │
└────────────────────────────────────────────────────────────────┘
```

### 3.2. RBAC trong schema tenant

```sql
-- tenant_acme.roles, tenant_acme.role_permissions
-- Permission format: resource:action
-- Ví dụ: projects:create, tasks:delete, members:invite

CREATE TABLE tenant_acme.roles (
  id   UUID PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE tenant_acme.role_permissions (
  role_id    UUID REFERENCES tenant_acme.roles(id),
  permission VARCHAR(128) NOT NULL,
  PRIMARY KEY (role_id, permission)
);
```

**Lưu ý:** Bảng RBAC nằm **trong schema tenant** — mỗi tenant tự định nghĩa custom role (enterprise).

### 3.3. ABAC / resource-level (tuỳ chọn)

```
□ Project-level: user chỉ sửa project được assign
□ Row ownership: task.assignee_id = current user
□ Policy engine (OPA/CASL) tách khỏi controller
```

### 3.4. Platform admin impersonation

```
Support login-as tenant admin:
  1. platform_support role
  2. Audit log: who, which tenant, when, reason ticket
  3. Banner "Viewing as Acme Corp" trên UI
  4. Time-limited token — không dùng JWT thường
```

### 3.5. Checklist authorization

```
□ Mọi endpoint có @RequirePermission hoặc policy tương đương
□ Platform routes (/platform/*) tách namespace — middleware khác
□ Default deny
□ Test matrix: role × endpoint × tenant isolation
□ Không leak permission list của tenant khác
□ Webhook/API key scoped: chỉ permission cần thiết
```

---

## 4. Data isolation — các vấn đề cần triển khai

### 4.1. Cơ chế chính: `search_path`

```sql
-- Mỗi request/transaction
SET LOCAL search_path = tenant_acme, platform;

-- Query không prefix schema
SELECT * FROM projects;  -- → tenant_acme.projects

-- Platform metadata
SELECT * FROM tenants WHERE id = 7;  -- → platform.tenants (fallback schema)
```

### 4.2. TenantContext (application)

```typescript
// Pseudo-code — pattern bắt buộc
interface TenantContext {
  tenantId: number;
  schemaName: string;  // tenant_acme
  slug: string;
  roles: string[];
}

// AsyncLocalStorage / CLS — mọi repo lấy context từ đây
// Không cho phép truyền schemaName từ client input trực tiếp
```

### 4.3. Connection pool — rủi ro & fix

| Rủi ro | Hậu quả | Fix |
|--------|---------|-----|
| Connection reuse không reset `search_path` | Tenant A đọc schema tenant B | `DISCARD ALL` hoặc `SET search_path` mỗi checkout |
| PgBouncer transaction mode | `SET LOCAL` mất giữa transaction | Dùng session mode hoặc set path đầu mỗi transaction |
| Long-running connection | Stale context | Max connection lifetime |

```typescript
async function withTenantTransaction(ctx: TenantContext, fn: (qr: QueryRunner) => Promise<T>) {
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    await qr.query(`SET LOCAL search_path = ${quoteIdent(ctx.schemaName)}, platform`);
    await qr.query(`SET LOCAL app.tenant_id = '${ctx.tenantId}'`);
    const result = await fn(qr);
    await qr.commitTransaction();
    return result;
  } catch (e) {
    await qr.rollbackTransaction();
    throw e;
  } finally {
    await qr.release();
  }
}
```

### 4.4. Defense in depth (khuyến nghị)

| Lớp | Cơ chế |
|-----|--------|
| App | TenantContext + code review + integration test |
| DB session | `search_path` + `app.tenant_id` |
| DB grant | `app_runtime` chỉ `USAGE` trên schema được assign — **không** grant all tenant |
| RLS (optional) | Trên bảng platform; trên tenant tables nếu muốn belt-and-suspenders |
| Audit | Trigger ghi `tenant_id`, `user_id` mỗi INSERT/UPDATE |

### 4.5. Cross-tenant operations (cẩn thận)

```
□ Platform report aggregate — chỉ dùng role readonly, query có WHERE tenant_id
□ Background job — phải set context rõ ràng per tenant
□ Bulk export — stream per schema, không JOIN chéo schema
□ Search (Elasticsearch): index name prefix tenant_acme_*
```

### 4.6. Tenant delete / GDPR

```
Soft delete: platform.tenants.status = deleted, block login
Hard delete:
  1. Export backup (compliance)
  2. DROP SCHEMA tenant_acme CASCADE
  3. Xóa memberships, subscriptions
  4. Audit log retention policy
```

### 4.7. Checklist isolation

```
□ Test: 2 tenant, parallel request — không cross-read
□ Test: JWT tid=7 nhưng subdomain globex → reject
□ Lint/code: cấm raw SQL không qua tenant wrapper
□ Monitor: log search_path mỗi slow query (debug)
□ Pen test checklist: IDOR cross-tenant
□ Không cache response Redis key thiếu tenant prefix
```

---

## 5. Case study — TaskFlow (tóm tắt)

**Bối cảnh:** SaaS quản lý dự án, ~500 tenant B2B, 10–50 user/tenant, PostgreSQL RDS.

### Schema layout

```
platform/
  tenants              (id, slug, schema_name, status, plan)
  users                (id, email, password_hash / idp_sub)
  tenant_memberships   (tenant_id, user_id, role, status)
  tenant_migrations    (tenant_id, version, ...)
  subscriptions        (tenant_id, stripe_customer_id, ...)

tenant_{slug}/
  projects
  tasks
  comments
  roles
  role_permissions
  settings
```

### Quyết định kiến trúc TaskFlow

| Quyết định | Lý do |
|------------|-------|
| Subdomain = tenant | DNS wildcard `*.taskflow.io`, đơn giản cho B2B |
| Schema per tenant | Backup/restore từng khách; tách biệt rõ ràng |
| JWT với `tid` | Stateless API, horizontal scale |
| Flyway cho tenant DDL | Mature, checksum, CI friendly |
| Queue (SQS) provision tenant | Signup không chờ migrate 30s |
| Không RLS trên tenant tables | `search_path` + grant đủ; RLS trên `platform` |

### Tham chiếu thực tế tương tự

| Hệ thống | Pattern | Ghi chú |
|----------|---------|---------|
| **GitLab.com** | DB isolation theo group/project topology | Chi tiết schema phức tạp, học mindset shard/isolate |
| **Supabase** | Postgres schema + RLS | Doc multi-tenancy chính thức, RLS-heavy |
| **Discourse** | Schema/DB per site (hosted) | Mô hình hosted multi-site kinh điển |
| **Odoo** | Database per customer (SaaS) | Cách ly mạnh hơn — so sánh trade-off |
| **Salesforce** | Shared everything + org_id | Đầu spectrum — học metadata-driven isolation |

---

## 6. Thứ tự triển khai đề xuất

```
Phase 0 — Design
  □ Chốt naming: schema tenant_{slug} vs t_{uuid}
  □ ERD platform + tenant template
  □ Diagram (file này) review với team

Phase 1 — Foundation
  □ platform schema + tenants table
  □ Tenant resolver (subdomain)
  □ TenantContext + search_path wrapper
  □ 1 tenant manual — prove query isolation

Phase 2 — AuthN/AuthZ
  □ User + membership
  □ JWT với tid
  □ RBAC cơ bản (admin/member/viewer)

Phase 3 — Provisioning & Migration
  □ Signup → CREATE SCHEMA → migrate → seed
  □ Migration runner + tracking table
  □ CI test 2+ tenants

Phase 4 — Hardening
  □ Connection pool reset
  □ Audit log
  □ Per-tenant backup script
  □ Load test migration 100 tenants

Phase 5 — Enterprise
  □ SSO per tenant
  □ Custom roles
  □ Support impersonation
  □ Tenant export / delete
```

---

## 7. Liên kết tài liệu liên quan

| File | Liên quan |
|------|-----------|
| [../security.md](../security.md) | RLS, least privilege, audit |
| [../connection-pool.md](../connection-pool.md) | Pool sizing, PgBouncer |
| [../transaction-consistency.md](../transaction-consistency.md) | Transaction boundary per tenant |
| [../partition.md](../partition.md) | Nếu bảng platform lớn (events) |
| [../../language-framework/nestjs.md](../../language-framework/nestjs.md) | Guard, middleware, module pattern |

---

## 8. Câu hỏi cần trả lời trước khi code

```
□ Slug collision & reserved names (www, api, admin)?
□ Giới hạn số schema trên 1 DB (Postgres không hard limit nhưng ops)?
□ Tenant "dedicated schema" vs "shared small tenants" hybrid?
□ Single region vs multi-region (schema không cross-region)?
□ Read replica: search_path có replicate không? (có — logical replication)
□ ORM nào — TypeORM / Prisma multi-schema support?
□ Compliance: data residency — 1 DB per region đủ chưa?
```

---

*Tài liệu gốc — cập nhật khi bắt đầu viết từng file con trong folder `multi-tenant/`.*

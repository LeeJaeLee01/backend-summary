# Multi-Tenant — Shared DB, Separate Schema

Kiến trúc **một database**, mỗi tenant một **schema riêng** (`tenant_acme`, `tenant_globex`...). Dữ liệu business nằm trong schema tenant; schema `public` (hoặc `platform`) giữ metadata toàn hệ thống.

> **Sơ đồ bảng & giải thích column:** [schema-diagram.md](./schema-diagram.md)

> Ví dụ **PostgreSQL**. Bổ sung cho [security.md](../security.md) (least privilege, RLS) và [connection-pool.md](../connection-pool.md).

---

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL (1 DB)                     │
├─────────────────────────────────────────────────────────┤
│  schema: platform / public                               │
│    tenants, tenant_users, subscriptions, audit_log...   │
├──────────────┬──────────────┬──────────────┬────────────┤
│ tenant_acme  │ tenant_globex│ tenant_xyz   │ ...        │
│  users       │  users       │  users       │            │
│  orders      │  orders      │  orders      │            │
│  products    │  products    │  products    │            │
└──────────────┴──────────────┴──────────────┴────────────┘
```

| Ưu điểm | Nhược điểm |
|---------|------------|
| Cô lập dữ liệu mạnh hơn `tenant_id` column | Migration phải chạy **N schema** |
| Backup/restore/export **từng tenant** dễ hơn shared table | Số schema lớn → quản lý metadata, connection phức tạp |
| Không cần filter `tenant_id` mọi query | Không scale horizontal bằng shard DB |
| Custom schema/index per tenant (nếu cần) | Cross-tenant report phải `UNION ALL` hoặc ETL |

---

## 1. Authentication — xác thực người dùng

Auth trả lời: **ai đang đăng nhập?** Trong multi-tenant, còn phải trả lời: **tenant nào?**

### 1.1. Phân tách identity: Platform vs Tenant

| Loại user | Lưu ở đâu | Ví dụ |
|-----------|-----------|-------|
| **Platform admin** | Schema `platform` | Super admin, support, billing ops — xem [§2.3](#23-platform-roles-super-admin-support-billing-ops) |
| **Tenant user** | Schema `platform.tenant_users` + profile trong schema tenant | Nhân viên công ty A |

```sql
-- Schema platform — metadata toàn hệ thống
CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE platform.tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,          -- acme, globex
  schema_name TEXT NOT NULL UNIQUE,          -- tenant_acme
  status      TEXT NOT NULL DEFAULT 'active',  -- active | suspended | provisioning
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform.tenant_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES platform.tenants(id),
  email      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  UNIQUE (tenant_id, email)
);
```

### 1.2. Resolve tenant trước khi login

Tenant phải được xác định **trước** khi verify password — cùng email có thể tồn tại ở nhiều tenant.

| Cách resolve | Ví dụ | Ghi chú |
|--------------|-------|---------|
| **Subdomain** | `acme.app.com` → slug `acme` | Phổ biến nhất cho SaaS |
| **Path prefix** | `app.com/t/acme/login` | Dễ dev local |
| **Header** | `X-Tenant-Slug: acme` | API / mobile |
| **Email domain** | `@acme.com` → tenant mapping | B2B enterprise |

```typescript
// Middleware — resolve tenant từ subdomain
function resolveTenantSlug(host: string): string {
  const slug = host.split('.')[0]; // acme.app.com → acme
  if (!slug || slug === 'www' || slug === 'app') {
    throw new UnauthorizedException('Tenant not specified');
  }
  return slug;
}
```

### 1.3. Luồng login chuẩn

```
1. Client gửi request → resolve tenant (subdomain/header)
2. Lookup platform.tenants WHERE slug = ? AND status = 'active'
3. Lookup platform.tenant_users WHERE tenant_id + email
4. Verify password (bcrypt/argon2)
5. Issue JWT/session chứa: user_id, tenant_id, schema_name, roles
6. KHÔNG set search_path lúc login — set ở middleware mỗi request
```

**JWT payload tối thiểu:**

```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "schema": "tenant_acme",
  "roles": ["admin", "editor"],
  "iat": 1718000000,
  "exp": 1718003600
}
```

### 1.4. Checklist Authentication

```
□ Tenant resolve TRƯỚC khi verify credential
□ Reject login nếu tenant status ≠ active (suspended, provisioning)
□ Email unique trong phạm vi tenant — không global unique (trừ platform admin)
□ Password hash: argon2id hoặc bcrypt — không plaintext, không MD5
□ JWT ký bằng secret rotation — có kid/version
□ Refresh token lưu platform schema — revoke được per user/tenant
□ Platform admin login qua domain/route riêng — không dùng chung flow tenant
□ Rate limit login theo tenant + IP — chống brute force
□ MFA cho tenant admin (TOTP/WebAuthn) nếu compliance yêu cầu
□ Audit log: login success/fail ghi vào platform.audit_log
```

---

## 2. Authorization — phân quyền

Auth trả lời **ai**; Author trả lời **được làm gì**.

### 2.1. Hai tầng quyền

| Tầng | Scope | Ví dụ permission |
|------|-------|------------------|
| **Platform** | Toàn hệ thống | `tenants.create`, `tenants.suspend`, `billing.manage` |
| **Tenant** | Trong schema tenant | `orders.read`, `orders.write`, `users.invite` |

```sql
-- Platform RBAC — cùng pattern tenant: users → user_roles → roles → role_permissions
CREATE TABLE platform.roles (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE  -- super_admin, support, billing_ops
);

CREATE TABLE platform.platform_user_roles (
  user_id UUID NOT NULL REFERENCES platform.platform_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES platform.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE platform.role_permissions (
  role_id    UUID NOT NULL REFERENCES platform.roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,  -- tenants.create, tenants.impersonate, billing.refund
  PRIMARY KEY (role_id, permission)
);

-- Tenant roles — trong từng schema tenant
CREATE TABLE tenant_acme.roles (
  id   UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE  -- admin, editor, viewer
);

CREATE TABLE tenant_acme.user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES tenant_acme.roles(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE tenant_acme.role_permissions (
  role_id    UUID NOT NULL REFERENCES tenant_acme.roles(id),
  permission TEXT NOT NULL,  -- orders:read, orders:write
  PRIMARY KEY (role_id, permission)
);
```

### 2.2. Guard sau khi set schema

Authorization **luôn chạy sau** khi đã bind đúng tenant schema — không check quyền trên schema mặc định.

```typescript
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const payload = verifyJwt(req.headers.authorization);
    const tenant = await platformRepo.findActiveTenant(payload.tenant_id);

    // Bind context — mọi query sau dùng schema này
    req.tenant = {
      id: tenant.id,
      schema: tenant.schema_name,
      userId: payload.sub,
      roles: payload.roles,
    };
    next();
  }
}

@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>('permissions', ctx.getHandler());
    const { roles } = ctx.switchToHttp().getRequest().tenant;
    return hasPermission(roles, required);
  }
}
```

### 2.3. Platform roles: Super Admin, Support, Billing Ops

Ba role **platform** — không thuộc tenant nào, lưu trong schema `platform`. Khác hoàn toàn tenant roles (`admin`, `editor` trong `tenant_acme`).

```
┌─────────────────────────────────────────────────────────────┐
│                    Platform users (schema platform)          │
├──────────────┬──────────────────────────────────────────────┤
│ super_admin  │ Full quyền hệ thống — dùng rất hạn chế        │
│ support      │ Hỗ trợ khách — đọc + impersonate có kiểm soát │
│ billing_ops  │ Subscription, invoice — không đụng business data│
└──────────────┴──────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   platform.*          tenant (impersonate)   platform.subscriptions
   tenant lifecycle    read/debug only        platform.invoices
```

#### Schema & bảng gợi ý

```sql
CREATE TABLE platform.platform_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  status        TEXT NOT NULL DEFAULT 'active',  -- active | disabled
  mfa_secret    TEXT,                            -- bắt buộc cho super_admin, support
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform.roles (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE platform.platform_user_roles (
  user_id UUID NOT NULL REFERENCES platform.platform_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES platform.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE platform.role_permissions (
  role_id    UUID NOT NULL REFERENCES platform.roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

-- Seed roles + permissions khi deploy — xem ma trận quyền bên dưới
```

#### Ma trận quyền

| Permission | super_admin | support | billing_ops |
|------------|:-----------:|:-------:|:-----------:|
| `tenants.create` | ✅ | ❌ | ❌ |
| `tenants.suspend` / `tenants.delete` | ✅ | ❌ | ❌ |
| `tenants.read` (metadata) | ✅ | ✅ | ✅ (chỉ billing fields) |
| `tenants.impersonate` | ✅ | ✅ | ❌ |
| `tenant.data.read` (qua impersonate) | ✅ | ✅ | ❌ |
| `tenant.data.write` | ✅ | ⚠️ break-glass only | ❌ |
| `subscriptions.read` / `update` | ✅ | ❌ | ✅ |
| `invoices.read` / `refund` | ✅ | ❌ | ✅ |
| `platform.users.manage` | ✅ | ❌ | ❌ |
| `audit_log.read` | ✅ | ✅ (scoped) | ✅ (billing events) |
| `migration.run` | ✅ | ❌ | ❌ |
| `schema.access` (trực tiếp tenant_*) | ✅ | ⚠️ qua tool có audit | ❌ |

---

#### Super Admin

**Ai:** CTO, platform engineer, on-call lead — **rất ít người** (1–3).

**Làm gì:**

- Provision / suspend / xóa tenant
- Chạy migration fleet, repair schema 1 tenant
- Quản lý platform users & roles
- Break-glass write vào tenant khi sự cố nghiêm trọng
- Truy cập production DB qua bastion (ngoài app)

**Không nên:**

- Dùng super_admin cho thao tác hàng ngày
- Share account — mỗi người một `platform_users` row

```typescript
// JWT platform admin — KHÁC JWT tenant user
{
  "sub": "platform-user-uuid",
  "type": "platform",
  "roles": ["super_admin"],
  "aud": "platform-admin.app.com"  // audience riêng
}
```

**Login:** domain riêng — `admin.internal.app.com` — không qua subdomain tenant.

**Checklist:**

```
□ MFA bắt buộc
□ IP allowlist (VPN / office) nếu có thể
□ Mọi action ghi audit_log với actor_id
□ Session ngắn (15–30 phút idle timeout)
□ Không embed super_admin JWT trong app tenant
```

---

#### Support

**Ai:** Customer support, technical support — cần **xem** data tenant để debug ticket, **không** sửa billing hay xóa tenant.

**Làm gì:**

- Xem metadata tenant: slug, status, plan, created_at
- **Impersonate** user tenant (read-only UI) — xem orders, settings như user thấy
- Ghi internal note trên ticket (bảng `platform.support_notes`)
- Đọc audit log login/API fail của tenant (trong phạm vi ticket)

**Không được:**

- Suspend/delete tenant
- Refund, đổi plan
- Write trực tiếp vào `tenant_*.orders` (trừ khi có workflow break-glass + super_admin approve)
- Impersonate tenant đã opt-out (enterprise contract)

**Impersonation flow:**

```
1. Support login admin.internal.app.com
2. Tìm tenant theo slug / ticket ID
3. POST /platform/impersonate { tenant_id, reason, ticket_id }
4. Server issue JWT ngắn hạn (15 phút) với claim impersonated_by
5. UI tenant hiển thị banner: "Support session — read only"
6. Mọi query vẫn SET search_path tenant_* — audit ghi đủ
7. POST /platform/impersonate/end
```

```sql
CREATE TABLE platform.impersonation_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_id   UUID NOT NULL REFERENCES platform.platform_users(id),
  tenant_id    UUID NOT NULL REFERENCES platform.tenants(id),
  ticket_ref   TEXT,
  reason       TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at     TIMESTAMPTZ,
  read_only    BOOLEAN NOT NULL DEFAULT true
);
```

**Checklist:**

```
□ Impersonate mặc định read-only
□ Bắt buộc ticket_id / reason (không impersonate tự do)
□ Audit mọi API call trong impersonate session
□ Rate limit impersonate per support user
□ Không export bulk PII — chỉ xem trong UI có mask (email, phone)
```

---

#### Billing Ops

**Ai:** Finance, billing team, account manager — quản lý **tiền & gói**, không cần xem orders/products trong tenant schema.

**Làm gì:**

- Xem / cập nhật `platform.subscriptions`, `platform.invoices`
- Gán plan, extend trial, apply credit
- Trigger sync với Stripe/Paddle (webhook đã có — ops retry manual)
- Export báo cáo doanh thu (aggregate từ `platform` — không scan `tenant_*.orders`)

**Không được:**

- Impersonate tenant user
- Truy cập `tenant_*` schema (orders, users, PII)
- Suspend tenant (trừ khi có workflow: billing_ops request → super_admin approve)

```sql
CREATE TABLE platform.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL UNIQUE REFERENCES platform.tenants(id),
  plan        TEXT NOT NULL,           -- free, pro, enterprise
  status      TEXT NOT NULL,           -- active, past_due, canceled
  trial_ends  TIMESTAMPTZ,
  external_id TEXT,                    -- Stripe subscription id
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform.invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES platform.tenants(id),
  amount      NUMERIC(12, 2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'USD',
  status      TEXT NOT NULL,           -- draft, paid, void, refunded
  external_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**API ví dụ (chỉ billing_ops + super_admin):**

```
GET  /platform/tenants/:id/billing     → subscription + invoices
PATCH /platform/subscriptions/:id      → đổi plan (billing_ops)
POST /platform/invoices/:id/refund     → billing_ops + audit
```

**Checklist:**

```
□ billing_ops role chỉ GRANT trên bảng platform.subscriptions, platform.invoices
□ Không có quyền SET search_path tới tenant_*
□ Báo cáo revenue từ platform aggregate — không query tenant schema
□ Mọi refund / plan change → audit_log + optional approval workflow
□ Tách dashboard UI: /billing/* không load component tenant data
```

---

#### So sánh nhanh

| | super_admin | support | billing_ops |
|--|-------------|---------|-------------|
| **Mục đích** | Vận hành platform | Giúp user | Quản lý tiền |
| **Vào tenant data** | Có (có kiểm soát) | Impersonate read | Không |
| **Sửa subscription** | Có | Không | Có |
| **Suspend tenant** | Có | Không | Không (thường) |
| **MFA** | Bắt buộc | Bắt buộc | Khuyến nghị |
| **Số lượng user** | Rất ít | Nhiều hơn | Vừa |

#### NestJS — guard phân tách platform vs tenant

```typescript
@Controller('platform/tenants')
@UseGuards(PlatformAuthGuard)
export class PlatformTenantsController {
  @Post(':id/suspend')
  @RequirePlatformRoles('super_admin')
  suspend(@Param('id') id: string) { /* ... */ }

  @Post(':id/impersonate')
  @RequirePlatformRoles('super_admin', 'support')
  impersonate(@Body() dto: ImpersonateDto) { /* ... */ }

  @Patch(':id/subscription')
  @RequirePlatformRoles('super_admin', 'billing_ops')
  updateSubscription(@Param('id') id: string, @Body() dto: UpdatePlanDto) { /* ... */ }
}
```

> **Nguyên tắc:** Platform roles sống trong **schema `platform`**, route **domain riêng**, JWT **audience riêng** — không trộn với tenant login flow.

---

### 2.4. Platform admin truy cập tenant — break-glass

Support cần vào tenant → **không** dùng chung JWT tenant user.

```
□ Impersonation có thời hạn ngắn (15–30 phút)
□ Ghi audit: ai impersonate, tenant nào, lý do
□ Banner/UI báo đang ở chế độ support
□ Permission riêng: platform.support.impersonate
□ Không cho impersonate vào tenant đã opt-out (enterprise contract)
```

### 2.5. Checklist Authorization

```
□ Permission string có namespace: resource:action (orders:read)
□ Default role mới tenant: admin + viewer — seed khi provision
□ Không hardcode role name trong business logic — dùng permission
□ Platform admin KHÔNG tự động có quyền trong tenant schema
□ API list/detail luôn query qua tenant context — không nhận schema từ client
□ Service account per tenant (webhook, integration) — role riêng, scope hẹp
□ Test matrix: user tenant A không gọi được API tenant B (IDOR test)
```

---

## 3. Database Migration

Migration là phần **khó nhất** của separate schema — mỗi thay đổi DDL phải áp dụng cho **tất cả schema tenant**.

### 3.1. Phân loại schema

| Schema | Ai migrate | Nội dung |
|--------|------------|----------|
| `platform` | 1 lần, CI/CD | tenants, billing, audit |
| `tenant_*` | N lần (per tenant) | users, orders, products... |
| `tenant_template` | Template/reference | Schema mẫu cho tenant mới |

### 3.2. Chiến lược migration tenant

**Cách 1 — Template + clone (provision nhanh)**

```sql
-- Tạo tenant mới
CREATE SCHEMA tenant_acme;

-- Clone từ template (PostgreSQL 15+)
CREATE TABLE tenant_acme.users (LIKE tenant_template.users INCLUDING ALL);
-- Hoặc pg_dump --schema=tenant_template | sed | psql

-- Ghi version
INSERT INTO platform.tenant_schema_versions (tenant_id, version)
VALUES ('...', 42);
```

**Cách 2 — Migration runner lặp tất cả tenant (khuyến nghị production)**

```typescript
async function migrateAllTenants(migration: Migration) {
  const tenants = await db.query(`
    SELECT id, schema_name FROM platform.tenants
    WHERE status IN ('active', 'suspended')
    ORDER BY schema_name
  `);

  for (const tenant of tenants) {
    await db.transaction(async (tx) => {
      await tx.query(`SET search_path TO ${quoteIdent(tenant.schema_name)}, platform`);
      await migration.up(tx);
      await tx.query(`
        INSERT INTO platform.tenant_schema_versions (tenant_id, version, applied_at)
        VALUES ($1, $2, now())
        ON CONFLICT (tenant_id) DO UPDATE SET version = $2, applied_at = now()
      `, [tenant.id, migration.version]);
    });
  }
}
```

### 3.3. Bảng tracking version

```sql
CREATE TABLE platform.schema_migrations (
  version     INT PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform.tenant_schema_versions (
  tenant_id   UUID PRIMARY KEY REFERENCES platform.tenants(id),
  version     INT NOT NULL,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  error       TEXT  -- lưu lỗi nếu migration fail giữa chừng
);
```

### 3.4. Quy tắc viết migration an toàn

| Quy tắc | Lý do |
|---------|-------|
| Migration **idempotent** khi có thể (`IF NOT EXISTS`) | Retry an toàn |
| **Expand → deploy → contract** cho breaking change | Zero-downtime |
| Không `DROP COLUMN` ngay — deprecate 1–2 release | App cũ còn chạy |
| Migration **backward-compatible** ít nhất 1 version | Rolling deploy |
| Chạy migration **trước** deploy code mới (expand) | Tránh runtime error |
| Timeout per tenant — log tenant fail, tiếp tục tenant khác | Một tenant lỗi không block cả fleet |

```sql
-- ✅ Expand: thêm cột nullable trước
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Deploy code đọc/ghi phone

-- ✅ Contract: sau khi code cũ retire
ALTER TABLE users DROP COLUMN IF EXISTS legacy_field;
```

### 3.5. Provision tenant mới

```
1. INSERT platform.tenants (status = 'provisioning')
2. CREATE SCHEMA tenant_<slug>
3. Chạy toàn bộ migration tenant từ v0 → latest (hoặc clone template rồi patch)
4. Seed default roles, settings
5. UPDATE status = 'active'
6. Emit event: tenant.provisioned (email welcome, webhook)
```

**Rollback provision fail:**

```sql
DROP SCHEMA IF EXISTS tenant_acme CASCADE;
UPDATE platform.tenants SET status = 'failed' WHERE slug = 'acme';
```

### 3.6. Checklist Migration

```
□ Migration user riêng (app_migration) — không dùng app_api runtime
□ platform schema migrate TRƯỚC tenant schema (FK cross-schema nếu có)
□ CI chạy migration trên DB test có ≥2 tenant schema giả lập
□ Job migration: parallel có giới hạn (vd: 5 tenant/lúc) — tránh lock DB
□ Alert nếu tenant_schema_versions.version < schema_migrations.version max
□ Script repair: migrate lại 1 tenant cụ thể (--tenant=acme)
□ Document: migration KHÔNG được reference schema name cứng — dùng search_path
□ Backup trước migration lớn (ALTER TYPE, DROP, REINDEX)
```

---

## 4. Phân quyền lấy dữ liệu — Data Access & Isolation

Mục tiêu: **mọi query chỉ chạm schema của tenant hiện tại** — kể cả khi dev quên filter.

### 4.1. `search_path` — cơ chế cốt lõi

```sql
-- Mỗi request/transaction
SET LOCAL search_path TO tenant_acme, platform, public;
```

| Thứ tự search_path | Vai trò |
|--------------------|---------|
| `tenant_acme` | Bảng business — ưu tiên đầu |
| `platform` | Metadata, lookup tenant |
| `public` | Extension, shared function |

```typescript
async function withTenantSchema<T>(
  schema: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // quoteIdent — chống SQL injection qua schema name
    await client.query(`SET LOCAL search_path TO ${quoteIdent(schema)}, platform, public`);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

### 4.2. Không tin client về schema

```typescript
// ❌ Client gửi schema name
GET /api/orders?schema=tenant_other

// ✅ Schema lấy từ JWT/server-side tenant context
GET /api/orders
// server: search_path = tenant_from_jwt
```

### 4.3. Raw query & ORM

| Công cụ | Cách bind schema |
|---------|------------------|
| **Raw SQL** | `SET LOCAL search_path` mỗi transaction |
| **TypeORM** | `EntityManager` với `connection.query('SET search_path...')` trước operation; hoặc schema option động |
| **Prisma** | `$executeRaw` set search_path; hoặc connection string `?schema=tenant_acme` (1 connection/tenant — cẩn thận pool) |
| **Knex** | `withSchema('tenant_acme')` trên từng query builder |

```typescript
// TypeORM — repository scoped
function getTenantRepo<T>(manager: EntityManager, schema: string, entity: EntityTarget<T>) {
  return manager.getRepository(entity).extend({
    async findScoped(options?: FindManyOptions<T>) {
      await manager.query(`SET LOCAL search_path TO ${quoteIdent(schema)}, platform`);
      return this.find(options);
    },
  });
}
```

### 4.4. Defense in depth (khuyến nghị)

Schema isolation đã mạnh; thêm lớp bảo vệ khi cần compliance:

```sql
-- Role per tenant — chỉ quyền trên schema của tenant đó
CREATE ROLE tenant_acme_app;
GRANT USAGE ON SCHEMA tenant_acme TO tenant_acme_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA tenant_acme TO tenant_acme_app;

-- Revoke access schema tenant khác
REVOKE ALL ON SCHEMA tenant_globex FROM tenant_acme_app;
```

Hoặc kết hợp **RLS trong schema platform** cho bảng shared (nếu có bảng dùng chung).

### 4.5. Cross-tenant query — chỉ qua platform layer

| Nhu cầu | Cách làm |
|---------|----------|
| Admin dashboard tổng | Query `platform` + aggregate từ bảng summary — **không** scan N schema runtime |
| Report per tenant | Job async — export từng schema |
| Search toàn platform | Index riêng (Elasticsearch) sync từ từng tenant |

```sql
-- ❌ Không làm trong API request đồng bộ
SELECT * FROM tenant_acme.orders
UNION ALL
SELECT * FROM tenant_globex.orders;

-- ✅ Bảng summary sync bởi worker
SELECT tenant_id, order_count, revenue FROM platform.tenant_daily_stats
WHERE date = CURRENT_DATE;
```

### 4.6. Checklist Data Access

```
□ Mọi DB connection từ API đều qua withTenantSchema — không query "trần"
□ Schema name từ DB (platform.tenants) — không derive từ slug client gửi
□ quoteIdent / parameterized cho schema — chống injection
□ Integration test: 2 tenant, tạo data A, login B → không thấy data A
□ Connection pool: reset search_path khi release connection (hoặc SET mỗi transaction)
□ Background job truyền tenant_id/schema — không dùng global default schema
□ Log query production không leak schema tenant khác
□ FK cross-schema: hạn chế — nếu bắt buộc, FK vào platform.tenants
```

---

## 5. Đảm bảo ổn định hệ thống

### 5.1. Connection pool

```
□ Pool chung + SET LOCAL search_path mỗi transaction (phổ biến)
□ KHÔNG giữ connection "dedicated" per tenant trừ khi có lý do rõ
□ pool.on('connect') KHÔNG set search_path cố định — dễ leak tenant
□ max_connections DB ≥ (app_instances × pool_size) + migration + admin
□ PgBouncer: dùng transaction pooling + SET LOCAL (không SET session-level)
```

### 5.2. Giới hạn & quota per tenant

| Resource | Cách giới hạn |
|----------|---------------|
| Storage | `pg_total_relation_size` per schema — alert threshold |
| Rows | Platform config `max_users`, `max_orders` |
| API rate | Token bucket per `tenant_id` |
| Connection | Queue request khi tenant vượt quota |

```sql
-- Monitor size schema
SELECT
  nspname AS schema,
  pg_size_pretty(SUM(pg_total_relation_size(c.oid))) AS total_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE nspname LIKE 'tenant_%'
GROUP BY nspname
ORDER BY SUM(pg_total_relation_size(c.oid)) DESC;
```

### 5.3. Tenant lifecycle

| Status | Hành vi |
|--------|---------|
| `provisioning` | Chặn login, migration đang chạy |
| `active` | Bình thường |
| `suspended` | Login fail, API 403, giữ data |
| `archived` | Read-only, không API write |
| `deleted` | Soft delete metadata → sau retention `DROP SCHEMA CASCADE` |

### 5.4. Backup & Disaster Recovery

```
□ Backup full DB theo schedule (pg_dump / WAL / managed RDS)
□ Restore 1 tenant: pg_dump --schema=tenant_acme — không cần restore cả DB
□ Test restore định kỳ — không chỉ backup
□ Point-in-time recovery (PITR) nếu SLA cao
□ Document RTO/RPO per tier tenant
```

### 5.5. Migration & deploy an toàn

```
□ Blue-green / rolling deploy — migration expand trước code
□ Feature flag per tenant cho feature mới schema
□ Health check: DB ping + sample tenant query
□ Circuit breaker khi DB latency cao — degrade graceful
□ Dead letter queue cho job per-tenant fail
```

### 5.6. Observability

| Metric | Mục đích |
|--------|----------|
| `tenant_request_duration{tenant_id}` | Phát hiện tenant "ồn" |
| `migration_pending_tenants` | Schema version lệch |
| `schema_size_bytes{schema}` | Capacity planning |
| `login_failures{tenant_id}` | Brute force / misconfig |
| `pool_waiting_count` | Pool exhaustion |

```typescript
// Structured log — luôn có tenant_id
logger.info('order.created', {
  tenant_id: ctx.tenant.id,
  schema: ctx.tenant.schema,
  order_id: order.id,
  // KHÔNG log PII không cần thiết
});
```

### 5.7. Scale khi số tenant lớn

| Giai đoạn | Hành động |
|-----------|-----------|
| < 100 tenant | Loop migration tuần tự — đủ dùng |
| 100–1000 | Parallel migration (batch 5–10), template schema |
| > 1000 | Cân nhắc shard DB (nhóm tenant theo DB), hoặc chuyển model |
| Noisy neighbor | Rate limit, read replica cho report, isolate tenant lớn sang DB riêng |

### 5.8. Checklist ổn định tổng

```
□ Runbook: tenant provision fail, migration fail 1 tenant, restore 1 tenant
□ Chaos test: kill connection giữa transaction — không leak data cross-tenant
□ Load test: N tenant × M user đồng thời — pool và search_path đúng
□ Index maintenance: REINDEX/VACUUM per schema lớn (schedule off-peak)
□ Schema naming convention cố định: tenant_<slug_alphanumeric>
□ Không cho tenant slug trùng reserved word (public, platform, pg_*)
□ Pen test: IDOR, schema injection, JWT tenant_id tamper
□ SLA dashboard: uptime API + migration lag + p95 latency per tenant tier
```

---

## 6. Luồng request end-to-end

```
Client (acme.app.com)
    │
    ▼
[1] Resolve tenant slug → platform.tenants
    │
    ▼
[2] Verify JWT → tenant_id khớp tenant resolved
    │
    ▼
[3] Authorization guard → permission orders:read
    │
    ▼
[4] BEGIN → SET LOCAL search_path TO tenant_acme, platform
    │
    ▼
[5] SELECT * FROM orders  -- thực tế: tenant_acme.orders
    │
    ▼
[6] COMMIT → release connection
```

---

## 7. So sánh nhanh với các model khác

| Model | Isolation | Migration | Khi chọn |
|-------|-----------|-----------|----------|
| **Shared table + tenant_id** | Thấp — phụ thuộc app filter | 1 lần | Startup nhỏ, đơn giản |
| **Separate schema** (doc này) | Cao | N lần | SaaS B2B, compliance vừa |
| **Separate database** | Rất cao | Per DB | Enterprise, data residency |
| **Separate instance** | Tối đa | Per instance | Regulated industry |

---

## 8. Tham chiếu

- [schema-diagram.md](./schema-diagram.md) — ER diagram + giải thích column từng bảng
- [security.md](../security.md) — least privilege, RLS, audit
- [connection-pool.md](../connection-pool.md) — pool sizing, PgBouncer
- [transaction-consistency.md](../transaction-consistency.md) — transaction, lock
- [orm.md](../orm.md) — TypeORM / Prisma migration

> **Tóm lại**: Shared DB + separate schema = cô lập tốt ở tầng DB, nhưng **đổi complexity sang migration fleet và tenant context**. Ba trụ cột bắt buộc: **resolve tenant sớm ở auth**, **SET search_path mỗi transaction**, **migration runner đồng bộ version trên mọi schema tenant**.

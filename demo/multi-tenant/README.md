# Multi-Tenant Demo — NestJS + PostgreSQL (Separate Schema)

Demo minh họa **request lifecycle** trong [database/multi-tenant/index.md](../../database/multi-tenant/index.md): TaskFlow SaaS, schema `platform` + `tenant_{slug}`.

## Kiến trúc

```
Client  X-Tenant-Slug: acme  +  Bearer JWT
    │
    ▼
① TenantMiddleware      → resolve slug → platform.tenants
② AuthMiddleware        → verify JWT, tid khớp tenant
③ MembershipGuard       → platform.tenant_memberships
④ PermissionsGuard      → RBAC (projects:read, …)
⑤ TenantDatabaseService → SET LOCAL search_path = tenant_acme, platform
⑥ ProjectsService       → SELECT * FROM projects  → tenant_acme.projects
```

## Chạy nhanh (Docker)

```bash
cd demo/multi-tenant
docker compose up --build
```

API: **http://localhost:3002**

## Demo curl

### 1. Health (không cần tenant/JWT)

```bash
curl http://localhost:3002/health
```

### 2. Login — lấy JWT

```bash
# Alice — admin tenant acme
curl -s -X POST http://localhost:3002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@acme.com","tenantSlug":"acme"}' | jq

export TOKEN="<accessToken từ response>"
```

### 3. Đọc projects tenant acme (Bước 1–6)

```bash
curl -s http://localhost:3002/projects \
  -H "X-Tenant-Slug: acme" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Kỳ vọng: 2 project Acme (`Acme Website Redesign`, …) — **không** thấy data Globex.

### 4. Đổi tenant — cùng user Alice (viewer ở globex)

```bash
curl -s -X POST http://localhost:3002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@acme.com","tenantSlug":"globex"}' | jq

export TOKEN_GLOBEX="<accessToken>"

curl -s http://localhost:3002/projects \
  -H "X-Tenant-Slug: globex" \
  -H "Authorization: Bearer $TOKEN_GLOBEX" | jq
```

Kỳ vọng: 1 project Globex. JWT `tid` phải khớp header tenant — nếu dùng token acme với header globex → `401`.

### 5. Phân quyền — Bob (member) tạo project OK

```bash
curl -s -X POST http://localhost:3002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"bob@acme.com","tenantSlug":"acme"}' | jq

export TOKEN_BOB="<accessToken>"

curl -s -X POST http://localhost:3002/projects \
  -H "X-Tenant-Slug: acme" \
  -H "Authorization: Bearer $TOKEN_BOB" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bob New Project"}' | jq
```

### 6. Carol (viewer globex) — không được tạo project

```bash
curl -s -X POST http://localhost:3002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"carol@globex.com","tenantSlug":"globex"}' | jq

# POST /projects → 403 Insufficient Permission
```

## Map code ↔ lifecycle

| Bước | File | Làm gì |
|------|------|--------|
| 1 | `src/tenant/tenant.middleware.ts` | Resolve tenant từ `X-Tenant-Slug` / Host |
| 2 | `src/auth/auth.middleware.ts` | Verify JWT Bearer |
| 3 | `src/auth/membership.guard.ts` | Check `tenant_memberships` |
| 4 | `src/auth/permissions.guard.ts` | RBAC `@RequirePermissions()` |
| 5 | `src/database/tenant-database.service.ts` | `SET LOCAL search_path` + transaction |
| 6 | `src/projects/projects.service.ts` | Query `projects` trong tenant schema |

## Seed data

| User | Tenant | Role |
|------|--------|------|
| alice@acme.com | acme | admin |
| alice@acme.com | globex | viewer |
| bob@acme.com | acme | member |
| carol@globex.com | globex | viewer |

## Chạy local (API trên máy, DB Docker)

```bash
docker compose up postgres -d
cp .env.example .env
npm install
npm run start:dev
```

## Liên quan

- [database/multi-tenant/index.md](../../database/multi-tenant/index.md) — lý thuyết đầy đủ
- [demo/read-write-split](../read-write-split/) — read replica (pattern khác)

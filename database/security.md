# Database Security

Bảo mật tầng database — quyền truy cập, cô lập dữ liệu, chống injection, mã hóa, audit. Bổ sung cho [connection-pool.md](./connection-pool.md) (SSL) và [transaction-consistency.md](./transaction-consistency.md) (ACID).

> Ví dụ **PostgreSQL**. Pattern tương tự áp dụng cho MySQL/RDS.

---

## 1. Least Privilege — quyền tối thiểu

User app **không** dùng superuser. Mỗi service một role riêng, chỉ quyền cần thiết.

```sql
-- ❌ App dùng superuser — DROP TABLE, bypass RLS, đọc mọi schema
-- connection string: postgres:superpassword@...

-- ✅ Role riêng cho app
CREATE ROLE app_api LOGIN PASSWORD 'strong-random-password';

GRANT CONNECT ON DATABASE myapp TO app_api;
GRANT USAGE ON SCHEMA public TO app_api;

-- Chỉ CRUD trên bảng cần
GRANT SELECT, INSERT, UPDATE ON orders, order_items TO app_api;
-- Không GRANT DELETE nếu dùng soft delete
-- Không GRANT TRUNCATE, DROP

-- Migration user riêng — chỉ CI/deploy dùng
CREATE ROLE app_migration LOGIN PASSWORD '...';
GRANT ALL ON SCHEMA public TO app_migration;
```

| Role | Quyền | Ai dùng |
|------|-------|---------|
| `app_api` | SELECT, INSERT, UPDATE trên bảng business | API runtime |
| `app_readonly` | SELECT only | Report, BI tool |
| `app_migration` | DDL (CREATE, ALTER) | CI/CD migration |
| `postgres` / superuser | Full | DBA emergency only |

**Checklist:**

```
□ App không connect bằng superuser
□ Password trong secret manager — không hardcode repo
□ Rotate password định kỳ
□ Service khác nhau — role khác nhau (order-api ≠ admin-api)
□ Revoke quyền khi deprecate bảng
```

---

## 2. Row Level Security (RLS)

Cô lập dữ liệu **ở tầng DB** — kể cả khi app bug quên filter `tenant_id`.

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: user chỉ thấy order của tenant mình
CREATE POLICY orders_tenant_isolation ON orders
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::int);

-- App set tenant trước mỗi request (trong transaction)
SET LOCAL app.tenant_id = '42';
SELECT * FROM orders;  -- chỉ order tenant 42
```

**TypeScript — set tenant mỗi request:**

```typescript
async function withTenant<T>(tenantId: number, fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
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

| Khi dùng RLS ✅ | Khi không cần ❌ |
|-----------------|------------------|
| Multi-tenant SaaS — compliance bắt buộc | Single-tenant app đơn giản |
| Nhiều service cùng DB — defense in depth | Filter tenant_id ở app đã đủ + test kỹ |
| Shared DB cho partner/integration | Overhead planner + phức tạp debug |

**Lưu ý:**

- Table owner và superuser **bypass RLS** — app role không được là owner
- Test policy với role `app_api`, không test bằng superuser
- `BYPASSRLS` attribute — chỉ gán cho role admin thực sự cần

```sql
-- Kiểm tra RLS enabled
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'orders';
```

---

## 3. SQL Injection

**Nguyên tắc:** không nối chuỗi user input vào SQL. Luôn **parameterized query**.

```typescript
// ❌ SQL injection — email = "' OR '1'='1"
const sql = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Parameterized
await pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

### ORM không đủ nếu dùng raw SQL sai

```typescript
// ❌ Prisma $queryRawUnsafe — injection
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ Prisma tagged template — parameterized
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;

// ❌ TypeORM string concat
await repo.query(`SELECT * FROM users WHERE name = '${name}'`);

// ✅ TypeORM parameters
await repo.query('SELECT * FROM users WHERE name = $1', [name]);
```

### Dynamic ORDER BY / column name

```typescript
// ❌ Injection qua sort column
const sort = req.query.sort; // "id; DROP TABLE users--"
await db.query(`SELECT * FROM orders ORDER BY ${sort}`);

// ✅ Whitelist
const ALLOWED_SORT = ['created_at', 'total', 'id'] as const;
const sort = ALLOWED_SORT.includes(req.query.sort) ? req.query.sort : 'created_at';
const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
await db.query(`SELECT * FROM orders ORDER BY ${sort} ${order} LIMIT 20`);
```

| Vector | Phòng thủ |
|--------|-----------|
| User input trong WHERE | `$1`, `$2` parameterized |
| Dynamic column/table | Whitelist, không concat trực tiếp |
| ORM raw query | `$queryRaw` tagged / `query(sql, [params])` |
| Search `LIKE` | Parameterize pattern: `LIKE $1` với `'%' + term + '%'` |
| Second-order injection | Sanitize trước khi lưu **và** khi query |

---

## 4. Encryption

### 4.1 In-transit (đang truyền)

Luôn bật **SSL/TLS** giữa app và DB trên production.

```typescript
// node-pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true, ca: fs.readFileSync('./rds-ca.pem') }
    : false,
});
```

```
# connection string
postgresql://user:pass@host:5432/db?sslmode=require
```

| `sslmode` | Ý nghĩa |
|-----------|---------|
| `disable` | Không SSL — chỉ dev local |
| `require` | Bắt buộc SSL |
| `verify-full` | SSL + verify hostname cert |

### 4.2 At-rest (lưu trên disk)

| Layer | Cách |
|-------|------|
| **Cloud managed** | RDS / Cloud SQL encryption at-rest (AES-256) — bật mặc định hoặc KMS |
| **Self-hosted** | LUKS/dm-crypt disk, PostgreSQL TDE (enterprise) |
| **Application-level** | Encrypt cột nhạy cảm (PII) trước khi INSERT — key trong KMS |

```typescript
// Application-level — field-level encryption (PII)
import { encrypt, decrypt } from './crypto';

await pool.query(
  'INSERT INTO users (email_encrypted) VALUES ($1)',
  [encrypt(email, process.env.FIELD_KEY)]
);
```

**Khi encrypt ở app:**

- Search/filter khó hơn — cân nhắc hash cột riêng cho lookup (email hash)
- Key rotation cần re-encrypt data
- Dùng cho: SSN, credit card token, health data

---

## 5. Audit Log — ai sửa gì, khi nào

### 5.1 Application audit table

Pattern phổ biến — app ghi log mỗi thay đổi quan trọng.

```sql
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  table_name  TEXT NOT NULL,
  record_id   BIGINT NOT NULL,
  action      TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  old_data    JSONB,
  new_data    JSONB,
  actor_id    BIGINT,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

```typescript
async function auditChange(params: {
  table: string;
  recordId: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData?: object;
  newData?: object;
  actorId: number;
}) {
  await pool.query(
    `INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, actor_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [params.table, params.recordId, params.action,
     params.oldData ?? null, params.newData ?? null, params.actorId]
  );
}
```

### 5.2 PostgreSQL trigger audit

```sql
CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
  VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), row_to_json(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_audit
AFTER UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
```

### 5.3 pgAudit extension (DB-level)

Ghi mọi DDL/DML vào PostgreSQL log — phù hợp compliance (SOC2, PCI).

```sql
-- postgresql.conf
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'write, ddl'
pgaudit.log_parameter = on
```

| Cách | Ưu | Nhược |
|------|-----|-------|
| App audit table | Business context (actor, IP) | Có thể bỏ qua nếu app bug |
| DB trigger | Không bypass qua app | Không có actor app context |
| pgAudit | Toàn diện, compliance | Log volume lớn, cần ship log |

---

## 6. Các hardening khác

### Connection & network

```
□ DB không public internet — private subnet / VPC only
□ Security group: chỉ app subnet → port 5432
□ Không expose pgAdmin/phpMyAdmin ra public
□ rotate credentials khi employee offboard
```

### Password & auth

```sql
-- Password policy — dùng secret manager generate
-- RDS: IAM authentication thay password (optional)
```

### Sensitive data trong log

```typescript
// ❌ Log full query có password
console.log('Query:', sql, params);

// ✅ Redact field nhạy cảm
const safeParams = params.map(p =>
  typeof p === 'string' && p.includes('@') ? '[REDACTED]' : p
);
```

### Backup encryption

- RDS snapshot encrypted với KMS
- `pg_dump` file → encrypt trước khi upload S3
- Test restore trong môi trường isolated

---

## Checklist production

```
□ App role least privilege — không superuser
□ SSL in-transit (sslmode=require)
□ Encryption at-rest (RDS/KMS)
□ Parameterized query — audit raw SQL trong codebase
□ Multi-tenant: filter tenant_id + cân nhắc RLS
□ Audit log cho bảng nhạy cảm (payment, user, permission)
□ Secret trong vault — không .env commit git
□ DB private network only
□ pg_stat_activity monitor connection lạ
□ Backup encrypted + test restore
```

---

## Tóm tắt

| Chủ đề | Nguyên tắc |
|--------|------------|
| **Least privilege** | Mỗi service một role, chỉ CRUD cần thiết |
| **RLS** | Cô lập tenant ở DB layer — defense in depth |
| **SQL injection** | Parameterized query; whitelist dynamic sort/column |
| **Encryption** | SSL in-transit; KMS at-rest; app-level cho PII |
| **Audit** | App audit table + trigger/pgAudit cho compliance |

> Bảo mật DB = **phòng thủ nhiều lớp**: network + auth + quyền + RLS + audit. ORM giúp nhưng **không thay thế** parameterized query và least privilege.

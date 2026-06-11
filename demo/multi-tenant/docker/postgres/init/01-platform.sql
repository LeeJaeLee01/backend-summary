-- =============================================================================
-- Bước 0 (infra): Schema platform — metadata toàn hệ thống
-- Xem database/multi-tenant/index.md — schema layout TaskFlow
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS platform;

-- Registry tenant: subdomain slug → schema_name
CREATE TABLE platform.tenants (
  id            BIGSERIAL PRIMARY KEY,
  slug          VARCHAR(64) NOT NULL UNIQUE,
  schema_name   VARCHAR(128) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  status        VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User toàn hệ thống (1 email có thể thuộc nhiều tenant)
CREATE TABLE platform.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  display_name  VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User thuộc tenant nào, role gì (admin / member / viewer)
CREATE TABLE platform.tenant_memberships (
  id            BIGSERIAL PRIMARY KEY,
  tenant_id     BIGINT NOT NULL REFERENCES platform.tenants(id),
  user_id       UUID NOT NULL REFERENCES platform.users(id),
  role          VARCHAR(32) NOT NULL,
  status        VARCHAR(32) NOT NULL DEFAULT 'active',
  UNIQUE (tenant_id, user_id)
);

-- GUC cho audit / defense-in-depth (SET LOCAL app.tenant_id)
-- App demo set per transaction — trigger có thể đọc current_setting('app.tenant_id')

INSERT INTO platform.tenants (slug, schema_name, name, status) VALUES
  ('acme', 'tenant_acme', 'Acme Corp', 'active'),
  ('globex', 'tenant_globex', 'Globex Inc', 'active');

INSERT INTO platform.users (id, email, display_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@acme.com', 'Alice Admin'),
  ('22222222-2222-2222-2222-222222222222', 'bob@acme.com', 'Bob Member'),
  ('33333333-3333-3333-3333-333333333333', 'carol@globex.com', 'Carol Viewer');

-- Alice: admin acme + viewer globex (multi-tenant user)
INSERT INTO platform.tenant_memberships (tenant_id, user_id, role, status)
SELECT t.id, u.id, m.role, 'active'
FROM (VALUES
  ('acme', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('globex', '11111111-1111-1111-1111-111111111111', 'viewer'),
  ('acme', '22222222-2222-2222-2222-222222222222', 'member'),
  ('globex', '33333333-3333-3333-3333-333333333333', 'viewer')
) AS m(slug, user_id, role)
JOIN platform.tenants t ON t.slug = m.slug
JOIN platform.users u ON u.id = m.user_id::uuid;

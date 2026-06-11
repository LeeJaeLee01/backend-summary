-- =============================================================================
-- Tenant schemas — mỗi khách hàng 1 schema riêng (projects, tasks, …)
-- Production: CREATE SCHEMA chạy trong provisioning job, không seed tay
-- =============================================================================

-- Helper: tạo schema + bảng business cho 1 tenant
CREATE OR REPLACE FUNCTION platform.provision_tenant_schema(p_schema TEXT) RETURNS void AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

  EXECUTE format($sql$
    CREATE TABLE IF NOT EXISTS %I.projects (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      status      VARCHAR(32) NOT NULL DEFAULT 'active',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  $sql$, p_schema);

  -- RBAC trong schema tenant (doc §3.2) — demo giữ đơn giản, app map role→permission
  EXECUTE format($sql$
    CREATE TABLE IF NOT EXISTS %I.roles (
      id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(64) UNIQUE NOT NULL
    )
  $sql$, p_schema);

  EXECUTE format($sql$
    CREATE TABLE IF NOT EXISTS %I.role_permissions (
      role_id    UUID NOT NULL,
      permission VARCHAR(128) NOT NULL,
      PRIMARY KEY (role_id, permission)
    )
  $sql$, p_schema);
END;
$$ LANGUAGE plpgsql;

SELECT platform.provision_tenant_schema('tenant_acme');
SELECT platform.provision_tenant_schema('tenant_globex');

-- Seed projects — data khác nhau chứng minh isolation
INSERT INTO tenant_acme.projects (name) VALUES
  ('Acme Website Redesign'),
  ('Acme Q2 Roadmap');

INSERT INTO tenant_globex.projects (name) VALUES
  ('Globex Logistics API');

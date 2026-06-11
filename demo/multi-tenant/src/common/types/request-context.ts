/**
 * Dữ liệu gắn vào request sau các bước middleware/guard.
 * Map với lifecycle trong database/multi-tenant/index.md § Request lifecycle
 */

/** Bước 1 — Tenant Resolver: tenant từ subdomain / header */
export interface ResolvedTenant {
  id: number;
  slug: string;
  schemaName: string;
  status: string;
}

/** Bước 2 — Authentication: user từ JWT */
export interface AuthenticatedUser {
  id: string;
  email: string;
}

/** Bước 3 — Tenant membership: role trong tenant hiện tại */
export interface TenantMembership {
  role: string;
  status: string;
}

/** Context đầy đủ — dùng cho TenantContext (AsyncLocalStorage) và guards */
export interface RequestContext {
  tenant: ResolvedTenant;
  user: AuthenticatedUser;
  membership: TenantMembership;
  permissions: string[];
}

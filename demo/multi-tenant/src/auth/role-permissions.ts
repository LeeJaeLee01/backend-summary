/**
 * Map role (platform.tenant_memberships.role) → permissions
 *
 * Production: đọc từ tenant_xxx.role_permissions (doc §3.2)
 * Demo: hardcode để minh họa RBAC
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['projects:read', 'projects:create', 'projects:delete'],
  member: ['projects:read', 'projects:create'],
  viewer: ['projects:read'],
  owner: ['projects:read', 'projects:create', 'projects:delete', 'members:invite'],
};

export function permissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

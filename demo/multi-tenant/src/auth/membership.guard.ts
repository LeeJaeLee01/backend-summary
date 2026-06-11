import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { TenantMembership } from '../common/types/request-context';
import { permissionsForRole } from './role-permissions';

interface MembershipRow {
  role: string;
  status: string;
}

/**
 * BƯỚC 3 — Tenant membership (index.md lifecycle)
 *
 * Kiểm tra platform.tenant_memberships:
 *   WHERE tenant_id = resolvedTenant.id AND user_id = jwt.sub
 */
@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const tenant = request.resolvedTenant;
    const user = request.authenticatedUser;

    if (!tenant || !user) {
      throw new ForbiddenException('Missing tenant or user context');
    }

    const rows = await this.dataSource.query<MembershipRow[]>(
      `SELECT role, status
       FROM platform.tenant_memberships
       WHERE tenant_id = $1 AND user_id = $2`,
      [tenant.id, user.id],
    );

    const row = rows[0];
    if (!row || row.status !== 'active') {
      throw new ForbiddenException('User is not a member of this tenant');
    }

    const membership: TenantMembership = {
      role: row.role,
      status: row.status,
    };

    request.tenantMembership = membership;
    request.userPermissions = permissionsForRole(row.role);

    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../common/decorators/permissions.decorator';
import { RequestContext } from '../common/types/request-context';

/**
 * BƯỚC 4 — Authorization / RBAC (index.md lifecycle)
 *
 * Kiểm tra user có permission cần cho endpoint không (vd. projects:read)
 * Sau khi pass: build RequestContext và gắn vào request + AsyncLocalStorage
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const userPerms: string[] = request.userPermissions ?? [];

    if (required?.length) {
      const missing = required.filter((p) => !userPerms.includes(p));
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Insufficient Permission: cần [${required.join(', ')}]`,
        );
      }
    }

    const requestContext: RequestContext = {
      tenant: request.resolvedTenant,
      user: request.authenticatedUser,
      membership: request.tenantMembership,
      permissions: userPerms,
    };

    request.requestContext = requestContext;
    return true;
  }
}

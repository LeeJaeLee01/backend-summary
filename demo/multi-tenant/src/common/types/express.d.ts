import { AuthenticatedUser, RequestContext, ResolvedTenant, TenantMembership } from './request-context';
import { JwtPayload } from '../../auth/auth.service';

declare module 'express-serve-static-core' {
  interface Request {
    resolvedTenant?: ResolvedTenant;
    authenticatedUser?: AuthenticatedUser;
    jwtPayload?: JwtPayload;
    tenantMembership?: TenantMembership;
    userPermissions?: string[];
    requestContext?: RequestContext;
  }
}

export {};

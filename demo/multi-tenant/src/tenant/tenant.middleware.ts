import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
/**
 * BƯỚC 1 — Tenant Resolver (index.md lifecycle)
 *
 * Xác định tenant từ:
 *   1. Header X-Tenant-Slug (tiện cho curl/local)
 *   2. Host subdomain: acme.localhost / acme.taskflow.io
 *
 * Kết quả: req.resolvedTenant = { id, slug, schemaName, status }
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const headerSlug = req.header('x-tenant-slug')?.trim().toLowerCase();
    const hostSlug = req.header('host')
      ? this.tenantService.parseSlugFromHost(req.header('host')!)
      : null;

    const slug = headerSlug ?? hostSlug;

    if (!slug) {
      throw new BadRequestException(
        'Thiếu tenant context — gửi Header X-Tenant-Slug: acme hoặc Host: acme.localhost',
      );
    }

    req.resolvedTenant = await this.tenantService.resolveBySlug(slug);
    next();
  }
}

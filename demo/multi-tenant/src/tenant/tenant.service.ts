import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ResolvedTenant } from '../common/types/request-context';

interface TenantRow {
  id: string;
  slug: string;
  schema_name: string;
  status: string;
}

@Injectable()
export class TenantService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Bước 1 — lookup platform.tenants theo slug (subdomain)
   * Fail-fast: 404 nếu không tồn tại, 403 nếu suspended
   */
  async resolveBySlug(slug: string): Promise<ResolvedTenant> {
    const rows = await this.dataSource.query<TenantRow[]>(
      `SELECT id, slug, schema_name, status
       FROM platform.tenants
       WHERE slug = $1`,
      [slug],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`Tenant Not Found: slug="${slug}"`);
    }
    if (row.status !== 'active') {
      throw new ForbiddenException(`Tenant Suspended: slug="${slug}"`);
    }

    return {
      id: Number(row.id),
      slug: row.slug,
      schemaName: row.schema_name,
      status: row.status,
    };
  }

  /** Parse slug từ Host: acme.taskflow.io hoặc acme.localhost */
  parseSlugFromHost(host: string): string | null {
    const hostname = host.split(':')[0].toLowerCase();
    const parts = hostname.split('.');

    // acme.localhost hoặc acme.taskflow.io
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'api') {
      return parts[0];
    }
    return null;
  }
}

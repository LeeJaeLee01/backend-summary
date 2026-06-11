import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { RequestContext } from '../common/types/request-context';
import { TenantDatabaseService } from '../database/tenant-database.service';
import { CreateProjectDto } from './dto/create-project.dto';

export interface ProjectRow {
  id: number;
  name: string;
  status: string;
  created_at: Date;
}

/**
 * BƯỚC 6 — Query business data trong đúng tenant schema
 *
 * SELECT * FROM projects → resolve tới tenant_acme.projects nhờ search_path
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly tenantDb: TenantDatabaseService) {}

  async findAll(ctx: RequestContext): Promise<ProjectRow[]> {
    return this.tenantDb.withTenantTransaction(ctx, async (qr) => {
      const rows = (await qr.query(
        `SELECT id, name, status, created_at FROM projects ORDER BY id`,
      )) as ProjectRow[];
      return rows;
    });
  }

  async create(ctx: RequestContext, dto: CreateProjectDto): Promise<ProjectRow> {
    return this.tenantDb.withTenantTransaction(ctx, async (qr) => {
      const rows = (await qr.query(
        `INSERT INTO projects (name) VALUES ($1)
         RETURNING id, name, status, created_at`,
        [dto.name],
      )) as ProjectRow[];
      return rows[0];
    });
  }

  /** Demo isolation: đếm project trong schema tenant hiện tại */
  async count(ctx: RequestContext): Promise<{ schema: string; count: number }> {
    return this.tenantDb.withTenantTransaction(ctx, async (qr) => {
      const rows = (await qr.query(
        `SELECT COUNT(*)::text AS count FROM projects`,
      )) as Array<{ count: string }>;
      return {
        schema: ctx.tenant.schemaName,
        count: Number(rows[0]?.count ?? 0),
      };
    });
  }

  /** Debug: schema đang active trong session DB */
  async currentSearchPath(qr: QueryRunner): Promise<string> {
    const rows = (await qr.query(`SHOW search_path`)) as Array<{
      search_path: string;
    }>;
    return rows[0]?.search_path ?? '';
  }
}

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { RequestContext } from '../common/types/request-context';

/** Chỉ cho phép schema_name từ DB registry — chống SQL injection */
const SCHEMA_PATTERN = /^tenant_[a-z0-9_]+$/;

@Injectable()
export class TenantDatabaseService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private assertSchemaName(schemaName: string): void {
    if (!SCHEMA_PATTERN.test(schemaName)) {
      throw new Error(`Invalid tenant schema: ${schemaName}`);
    }
  }

  /**
   * BƯỚC 5 — DB Session (index.md lifecycle)
   *
   * BEGIN → SET LOCAL search_path → SET LOCAL app.tenant_id → query → COMMIT
   *
   * SET LOCAL: chỉ có hiệu lực trong transaction hiện tại — an toàn khi reuse connection pool
   * (doc §4.3 — vẫn nên DISCARD ALL khi release nếu dùng PgBouncer session mode)
   */
  async withTenantTransaction<T>(
    ctx: RequestContext,
    fn: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    this.assertSchemaName(ctx.tenant.schemaName);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // search_path: tenant schema trước, platform fallback (doc §4.1)
      await queryRunner.query(
        `SET LOCAL search_path = ${this.quoteIdent(ctx.tenant.schemaName)}, platform`,
      );
      // Defense-in-depth cho audit trigger (doc §4.4)
      await queryRunner.query(`SET LOCAL app.tenant_id = '${ctx.tenant.id}'`);

      const result = await fn(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /** PostgreSQL identifier quoting */
  private quoteIdent(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }
}

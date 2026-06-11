import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from '../common/types/request-context';

/**
 * Bước 5 prep — TenantContext (doc §4.2)
 *
 * Lưu tenant/user/role theo request — mọi service đọc từ đây,
 * KHÔNG tin schemaName từ client input.
 */
export class TenantContextStore {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(ctx: RequestContext, fn: () => T): T {
    return this.storage.run(ctx, fn);
  }

  get(): RequestContext {
    const ctx = this.storage.getStore();
    if (!ctx) {
      throw new Error('TenantContext chưa được thiết lập — thiếu middleware/guard?');
    }
    return ctx;
  }

  tryGet(): RequestContext | undefined {
    return this.storage.getStore();
  }
}

export const tenantContextStore = new TenantContextStore();

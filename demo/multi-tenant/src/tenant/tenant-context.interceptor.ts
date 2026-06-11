import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContextStore } from './tenant.context';

/**
 * Gắn RequestContext vào AsyncLocalStorage để service đọc mà không cần truyền param
 * (pattern TenantContext — doc §4.2)
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const ctx = request.requestContext;

    if (!ctx) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      tenantContextStore.run(ctx, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}

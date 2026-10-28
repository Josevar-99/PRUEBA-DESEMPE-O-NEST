import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * 💡 [ADAPT FOR THE TEST - PERFORMANCE / AUDIT INTERCEPTOR]:
 * Measures the exact execution time of controller and service logic. Unlike
 * middleware, an interceptor runs within the NestJS lifecycle and can access
 * the controller class (`context.getClass().name`) and method (`context.getHandler().name`).
 *
 * 💡 POSSIBLE TEST USE CASES:
 * - Audit slow endpoints.
 * - Record who executed an action in the audit database.
 * - Reject requests that exceed a time limit with RxJS `timeout(...)`.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const handlerName = `${context.getClass().name}.${context.getHandler().name}`;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(
          `[Controlador] ${req.method} ${req.url} -> ${handlerName} (+${duration}ms)`,
        );
      }),
    );
  }
}

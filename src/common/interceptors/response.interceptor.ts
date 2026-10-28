import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

/**
 * 💡 [ADAPT FOR THE TEST - SUCCESS RESPONSE FORMAT]:
 * Modify this interface if the test specification requires a specific response structure.
 *
 * Common response structures used in tests:
 * Option A (current):
 *   { success: true, statusCode: 200, timestamp: '...', data: [...] }
 * Option B:
 *   { status: 'success', result: [...] }
 * Option C:
 *   { code: 200, message: 'OK', data: [...] }
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        // 💡 Adjust the returned fields here to match your test requirements:
        success: true,
        statusCode: response.statusCode,
        timestamp: new Date().toISOString(),
        data: data ?? null,
      })),
    );
  }
}

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * 💡 [ADAPT FOR THE TEST - LOGGING AND TRACEABILITY MIDDLEWARE]:
 * This middleware intercepts each incoming request:
 * 1. Generates or propagates a unique correlation ID ('x-request-id') in req and res.
 * 2. Measures latency in milliseconds from when the request arrives until it finishes.
 * 3. Prints detailed logs differentiated by response code (2xx info, 4xx warn, 5xx error).
 *
 * 💡 COMMON ADAPTATIONS IN TESTS:
 * - Omit logging on specific routes (e.g.: if you don't want /health logs):
 *   if (req.originalUrl.includes('/health')) return next();
 * - Log additional headers required by the specification.
 * - Log the body of sensitive requests (e.g.: req.body).
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Generate or propagate correlation/request ID for traceability
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const message = `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}

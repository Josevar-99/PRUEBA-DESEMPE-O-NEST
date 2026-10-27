import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * 💡 [ADAPTAR PARA LA PRUEBA - MIDDLEWARE DE LOGGING Y TRAZABILIDAD]:
 * Este middleware intercepta cada petición entrante:
 * 1. Genera o propaga un ID único de correlación ('x-request-id') en req y res.
 * 2. Mide la latencia en milisegundos desde que entra la petición hasta que finaliza.
 * 3. Imprime logs detallados diferenciando según el código de respuesta (2xx info, 4xx warn, 5xx error).
 *
 * 💡 ADAPTACIONES COMUNES EN PRUEBAS:
 * - Omitir logging en rutas específicas (ej: si no quieres logs de /health):
 *   if (req.originalUrl.includes('/health')) return next();
 * - Registrar cabeceras adicionales requeridas por el enunciado.
 * - Registrar el body de peticiones sensibles (ej: req.body).
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Generar o propagar correlation/request ID para trazabilidad
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

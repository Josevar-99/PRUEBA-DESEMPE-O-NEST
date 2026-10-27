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
 * 💡 [ADAPTAR PARA LA PRUEBA - INTERCEPTOR DE RENDIMIENTO / AUDITORÍA]:
 * Mide el tiempo exacto que tarda en ejecutarse la lógica dentro del controlador/servicio.
 * A diferencia del Middleware, el Interceptor se ejecuta dentro del ciclo de vida de NestJS,
 * teniendo acceso a la clase del controlador (`context.getClass().name`) y al método (`context.getHandler().name`).
 *
 * 💡 CASOS DE USO EN PRUEBAS:
 * - Auditoría de endpoints lentos.
 * - Registro en base de datos de auditoría de quién ejecutó la acción.
 * - Descartar peticiones que excedan un tiempo límite con RxJS `timeout(...)`.
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

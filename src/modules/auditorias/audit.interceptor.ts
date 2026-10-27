import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, mergeMap } from 'rxjs';
import { AuditoriasService } from './auditorias.service.js';
import { AccionAuditoria } from './enums/accion-auditoria.enum.js';
import type { JwtPayload } from '../../common/decorators/current-user.decorator.js';

const ACCIONES: Record<string, AccionAuditoria> = {
  POST: AccionAuditoria.CREATE,
  PATCH: AccionAuditoria.UPDATE,
  PUT: AccionAuditoria.UPDATE,
  DELETE: AccionAuditoria.DELETE,
};

/** Quita la contraseña del body antes de guardarlo en la auditoría */
export function sinPassword(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const { password: _password, ...resto } = body as Record<string, unknown>;
  return resto;
}

/**
 * Interceptor global de auditoría. Vive en este módulo y no en common/ porque
 * depende de AuditoriasService: es parte de la funcionalidad de auditoría.
 *
 * Registra cada escritura exitosa hecha por un usuario autenticado. Debe
 * registrarse DESPUÉS de ResponseInterceptor en app.module: así queda por dentro
 * y recibe los datos crudos del controller (con el id del recurso creado),
 * antes de que se envuelvan en { success, data }.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditoriasService: AuditoriasService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const accion = ACCIONES[request.method];

    // Solo escrituras con usuario autenticado. Esto deja fuera las lecturas,
    // el login (público y con contraseña en el body) y los endpoints de API Key
    if (!accion || !request.user) {
      return next.handle();
    }

    const usuarioId = request.user.sub;
    // 'path' es la metadata que @Controller('...') guarda en la clase
    const entidad = this.reflector.get<string>('path', context.getClass());
// Express 5 tipa los params como string | string[] por los comodines; :id siempre es string
    const idEnUrl =
      typeof request.params.id === 'string' ? request.params.id : undefined;
      
    return next.handle().pipe(
      // mergeMap solo corre si el handler tuvo éxito: un error salta directo al filtro.
      // Se espera el registro antes de responder, así la auditoría ya existe al consultarla
      mergeMap(async (data: unknown) => {
        try {
          await this.auditoriasService.registrar({
            usuarioId,
            accion,
            entidad,
            // En PATCH viene en la URL; en POST es el id del recurso recién creado
            entidadId: idEnUrl ?? (data as { id?: string } | null)?.id ?? null,
            ruta: `${request.method} ${request.originalUrl}`,
            detalle: sinPassword(request.body),
          });
        } catch (error) {
          // Si falla la auditoría no se rompe la operación del usuario, que ya se guardó
          this.logger.error('No se pudo registrar la auditoría', error as Error);
        }
        return data;
      }),
    );
  }
}
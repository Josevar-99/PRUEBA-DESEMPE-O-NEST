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
import { AuditsService } from './audits.service.js';
import { AuditAction } from './enums/audit-action.enum.js';
import type { JwtPayload } from '../../common/decorators/current-user.decorator.js';

const ACTIONS: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PATCH: AuditAction.UPDATE,
  PUT: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

/** Removes the password from the body before saving it in the audit record */
export function withoutPassword(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const { password: _password, ...remainingFields } = body as Record<string, unknown>;
  return remainingFields;
}

/**
 * Global audit interceptor. Lives in this module and not in common/ because
 * it depends on AuditsService: it is part of the audit functionality.
 *
 * Records every successful write made by an authenticated user. Must be
 * registered AFTER ResponseInterceptor in app.module: this way it sits inside
 * and receives the raw data from the controller (with the id of the created resource),
 * before it is wrapped in { success, data }.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditsService: AuditsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const action = ACTIONS[request.method];

    // Only writes with an authenticated user. This excludes reads,
    // login (public and with password in the body) and API Key endpoints
    if (!action || !request.user) {
      return next.handle();
    }

    const userId = request.user.sub;
    // 'path' is the metadata that @Controller('...') stores on the class
    const entity = this.reflector.get<string>('path', context.getClass());
// Express 5 types params as string | string[] due to wildcards; :id is always a string
    const idInUrl =
      typeof request.params.id === 'string' ? request.params.id : undefined;
      
    return next.handle().pipe(
      // mergeMap only runs if the handler succeeded: an error jumps directly to the filter.
      // The record is awaited before responding, so the audit already exists when queried
      mergeMap(async (data: unknown) => {
        try {
          await this.auditsService.record({
            userId,
            action,
            entity,
            // On PATCH it comes in the URL; on POST it is the id of the newly created resource
            entityId: idInUrl ?? (data as { id?: string } | null)?.id ?? null,
            route: `${request.method} ${request.originalUrl}`,
            details: withoutPassword(request.body),
          });
        } catch (error) {
          // If the audit fails, the user's operation is not broken, as it was already saved
          this.logger.error('Could not record the audit entry', error as Error);
        }
        return data;
      }),
    );
  }
}
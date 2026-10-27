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
 * 💡 [ADAPTAR PARA LA PRUEBA - FORMATO DE RESPUESTA EXITOSA]:
 * Modifica esta interfaz si el enunciado de la prueba exige una estructura de respuesta específica.
 *
 * Estructuras habituales pedidas en pruebas:
 * Opción A (actual):
 *   { success: true, statusCode: 200, timestamp: '...', data: [...] }
 * Opción B:
 *   { status: 'success', result: [...] }
 * Opción C:
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
        // 💡 Modifica los campos que retornas aquí según la rúbrica de tu prueba:
        success: true,
        statusCode: response.statusCode,
        timestamp: new Date().toISOString(),
        data: data ?? null,
      })),
    );
  }
}

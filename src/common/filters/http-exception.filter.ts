import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * Formato único de error para todos los endpoints (requisito 7.2 y 7.3).
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  errors?: unknown;
}

/**
 * Filtro global de excepciones (requisito 7).
 * Da el mismo formato a todos los errores y traduce los errores conocidos de
 * PostgreSQL a códigos HTTP, para que una violación de unicidad sea 409 y no 500.
 * Lo que no se reconoce se responde como 500 genérico: el detalle interno
 * (SQL, stack) solo se escribe en el log, nunca se envía al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Valores por defecto: cualquier error no reconocido termina como 500 genérico
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = undefined;

    if (exception instanceof HttpException) {
      // Errores lanzados a propósito: guards (401/403), services (404/409), ValidationPipe (400)
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;

        // Errores de ValidationPipe (class-validator): llegan como lista de mensajes
        if (resObj.errors) {
          errors = resObj.errors;
        } else if (Array.isArray(resObj.message)) {
          errors = resObj.message;
          message = 'Falló la validación de los datos enviados';
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // Errores de PostgreSQL: se traducen solo los que son culpa del cliente
      const driverError = (
        exception as unknown as {
          driverError?: { code?: string; detail?: string };
        }
      ).driverError;
      const code = driverError?.code;

      if (code === '23505') {
        // Unique violation: red de seguridad si dos requests insertan el mismo valor a la vez
        statusCode = HttpStatus.CONFLICT;
        message =
          'Conflicto de unicidad: el registro ya existe en la base de datos';
        errors = driverError?.detail;
      } else if (code === '23503') {
        // Foreign key violation: se referencia un registro que no existe o que está en uso
        statusCode = HttpStatus.BAD_REQUEST;
        message =
          'Violación de clave foránea: el registro referenciado no existe o está en uso';
        errors = driverError?.detail;
      } else if (code === '22P02') {
        // Valor con formato inválido para el tipo de la columna (ej: UUID mal formado)
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Formato de dato inválido';
      } else {
        // Código de BD no contemplado = bug del servidor, no del cliente.
        // Se queda en 500 con mensaje genérico; el detalle va solo al log.
        this.logger.error(
          `Error de BD no contemplado (${code})`,
          exception.message,
        );
      }
    } else if (exception instanceof EntityNotFoundError) {
      // Lanzado por findOneOrFail y similares
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Recurso no encontrado';
    }

    const errorBody: ErrorResponse = {
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors ? { errors } : {}),
    };

    // 5xx: error del servidor, se registra el stack completo para depurar.
    // 4xx: error del cliente, basta un warning.
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Error ${statusCode}: ${message}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - Handled ${statusCode}: ${message}`,
      );
    }

    response.status(statusCode).json(errorBody);
  }
}
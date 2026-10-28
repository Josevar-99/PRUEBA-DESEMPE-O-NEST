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
 * A consistent error format for all endpoints (requirements 7.2 and 7.3).
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
 * Global exception filter (requirement 7).
 * Normalizes errors and maps known PostgreSQL errors to HTTP status codes,
 * so a uniqueness violation returns 409 instead of 500. Unknown errors return
 * a generic 500 response; internal details (SQL and stack trace) are logged only.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Unknown errors default to a generic 500 response.
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = undefined;

    if (exception instanceof HttpException) {
      // Expected errors: guards (401/403), services (404/409), and ValidationPipe (400).
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;

        // ValidationPipe (class-validator) returns validation messages as an array.
        if (resObj.errors) {
          errors = resObj.errors;
        } else if (Array.isArray(resObj.message)) {
          errors = resObj.message;
          message = 'Validation of the submitted data failed';
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // Map PostgreSQL errors caused by invalid client input.
      const driverError = (
        exception as unknown as {
          driverError?: { code?: string; detail?: string };
        }
      ).driverError;
      const code = driverError?.code;

      if (code === '23505') {
        // Safety net if two simultaneous requests insert the same unique value.
        statusCode = HttpStatus.CONFLICT;
        message =
          'Uniqueness conflict: the record already exists in the database';
        errors = driverError?.detail;
      } else if (code === '23503') {
        // A referenced record does not exist or is currently in use.
        statusCode = HttpStatus.BAD_REQUEST;
        message =
          'Foreign key violation: the referenced record does not exist or is in use';
        errors = driverError?.detail;
      } else if (code === '22P02') {
        // Invalid value format for the column type (e.g. a malformed UUID).
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Invalid data format';
      } else {
        // An unmapped database error indicates a server bug, not a client error.
        // Keep the generic 500 response and log details only.
        this.logger.error(
          `Unhandled database error (${code})`,
          exception.message,
        );
      }
    } else if (exception instanceof EntityNotFoundError) {
      // Thrown by findOneOrFail and similar methods.
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
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

    // Log the full stack for server errors; a warning is sufficient for client errors.
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
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';

// ТЗ §9 — единый формат ошибки: { statusCode, message, error, details? }
// Коды: 400 / 401 / 403 / 404 / 409 / 422 / 429 / 500
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown;

    if (exception instanceof ZodValidationException) {
      // Zod validation errors from nestjs-zod pipe
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Validation failed';
      details = exception.getZodError().errors;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        if (typeof b.message === 'string') message = b.message;
        if (typeof b.error === 'string') error = b.error;
        if (b.details !== undefined) details = b.details;
      }

      error = error !== 'Internal Server Error' ? error : statusCodeText(statusCode);
    } else {
      // Unexpected errors — log and return generic 500
      this.logger.error(exception);
    }

    const payload: Record<string, unknown> = { statusCode, message, error };
    if (details !== undefined) payload.details = details;

    // Support both Fastify (reply.code().send()) and Express (res.status().json())
    if (typeof response.code === 'function') {
      response.code(statusCode).send(payload);
    } else {
      response.status(statusCode).json(payload);
    }
  }
}

function statusCodeText(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return map[status] ?? 'Error';
}

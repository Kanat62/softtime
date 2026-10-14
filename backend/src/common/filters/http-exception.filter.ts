import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { ErrorCode, type ErrorCodeValue } from '@softtime/shared';

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
    let code: ErrorCodeValue | undefined;

    if (exception instanceof ZodValidationException) {
      // Zod validation errors from nestjs-zod pipe
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Validation failed';
      details = exception.getZodError().errors;
      code = ErrorCode.VALIDATION_ERROR;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        // message может быть строкой или массивом — формат сохраняем как есть
        if (b.message !== undefined) message = b.message as string;
        if (typeof b.error === 'string') error = b.error;
        if (b.details !== undefined) details = b.details;
        if (typeof b.code === 'string') code = b.code as ErrorCodeValue;
      }

      error = error !== 'Internal Server Error' ? error : statusCodeText(statusCode);
    } else {
      // Unexpected errors — log and return generic 500
      this.logger.error(exception);
    }

    // Код машинночитаемый: свой у исключения, иначе запасной по статусу.
    const payload: Record<string, unknown> = {
      statusCode,
      message,
      error,
      code: code ?? fallbackCode(statusCode),
    };
    if (details !== undefined) payload.details = details;

    // Support both Fastify (reply.code().send()) and Express (res.status().json())
    if (typeof response.code === 'function') {
      response.code(statusCode).send(payload);
    } else {
      response.status(statusCode).json(payload);
    }
  }
}

/** Запасной код, когда исключение его не передало. */
function fallbackCode(status: number): ErrorCodeValue {
  const map: Record<number, ErrorCodeValue> = {
    400: ErrorCode.BAD_REQUEST,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    409: ErrorCode.CONFLICT,
    422: ErrorCode.UNPROCESSABLE_ENTITY,
    429: ErrorCode.TOO_MANY_REQUESTS,
  };
  return map[status] ?? ErrorCode.INTERNAL_ERROR;
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

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
import { tr, languageFromAcceptHeader } from '../i18n';

// ТЗ §9 — единый формат ошибки: { statusCode, message, error, details? }
// Коды: 400 / 401 / 403 / 404 / 409 / 422 / 429 / 500
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    // Язык только для текстов валидации (details[].message). Остальные поля
    // ответа — statusCode, message, error, code, params — не меняются.
    const language = languageFromAcceptHeader(request?.headers?.['accept-language']);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown;
    let code: ErrorCodeValue | undefined;
    // Параметры для подстановки в клиентский шаблон текста (см. ErrorCode
    // SCHEDULE_MIN_HOURS — единственный код с данными внутри сообщения).
    let params: unknown;

    if (exception instanceof ZodValidationException) {
      // Zod validation errors from nestjs-zod pipe
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Validation failed';
      details = translateZodIssues(exception.getZodError().errors, language);
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
        if (b.params !== undefined) params = b.params;
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
    if (params !== undefined) payload.params = params;

    // Support both Fastify (reply.code().send()) and Express (res.status().json())
    if (typeof response.code === 'function') {
      response.code(statusCode).send(payload);
    } else {
      response.status(statusCode).json(payload);
    }
  }
}

/**
 * Переводит `message` каждого zod-issue, если это ключ словаря.
 *
 * В схемах packages/shared вместо текста стоят ключи вида
 * 'validation:format.email' — их и переводим. Всё прочее (английские
 * дефолты zod, русские тексты локальных схем контроллеров) tr() возвращает
 * без изменений, так что они доходят до клиента как есть.
 *
 * Без заголовка Accept-Language язык = ru, а ru-значения словаря дословно
 * равны прежним текстам схем — ответ для старых клиентов не меняется.
 */
function translateZodIssues(issues: unknown, language: string): unknown {
  if (!Array.isArray(issues)) return issues;

  return issues.map((issue) => {
    if (
      typeof issue !== 'object' ||
      issue === null ||
      typeof (issue as { message?: unknown }).message !== 'string'
    ) {
      return issue;
    }
    const i = issue as { message: string };
    return { ...i, message: tr(language, i.message) };
  });
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

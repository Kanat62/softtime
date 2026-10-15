import { AxiosError } from 'axios';
import { Weekday, type ErrorCodeValue } from '@softtime/shared';
import i18n from '@/shared/i18n';

export interface AppError {
  message: string;
  statusCode: number;
  /** Optional machine-readable code from backend (e.g. "QR_INVALID") */
  code?: ErrorCodeValue;
  /** True when the request never reached the server (no internet / DNS / timeout) */
  isNetworkError: boolean;
}

// Backend error body shape per HttpExceptionFilter:
// { statusCode, message, error, code, details?, params? }
interface BackendBody {
  message?: unknown;
  code?: unknown;
  params?: unknown;
}

function isWeekday(v: unknown): v is Weekday {
  return typeof v === 'string' && Object.values(Weekday).includes(v as Weekday);
}

/**
 * Переводит ошибку в язык интерфейса по её машинному `code`.
 *
 * Бэкенд отвечает только по-русски, поэтому текст берём из общего словаря
 * (namespace `errors`, ключ = значение ErrorCode). Если код нам неизвестен
 * (старый или более новый бэкенд) — показываем серверный `message` как
 * раньше, поведение не меняется.
 *
 * `params` несёт значения, которые раньше вклеивались в текст (сегодня это
 * только SCHEDULE_MIN_HOURS); `weekday` — сам енум, поэтому переводится
 * через namespace `enums` до подстановки.
 */
function translateByCode(
  code: string | undefined,
  params: Record<string, unknown> | undefined,
  serverMessage: string,
): string {
  if (!code) return serverMessage;

  const key = `errors:${code}`;
  if (!i18n.exists(key)) return serverMessage;

  const values = { ...params };
  if (isWeekday(values.weekday)) {
    values.weekday = i18n.t(`enums:weekdayLong.${values.weekday}`);
  }

  return i18n.t(key, values);
}

/**
 * Normalizes any Axios error into a consistent AppError shape.
 * Callers can check `isNetworkError` to show the offline banner instead
 * of a generic server-error message.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return {
        message: i18n.t('errors:network'),
        statusCode: 0,
        isNetworkError: true,
      };
    }

    const data = error.response.data as BackendBody | undefined;
    const serverMessage =
      typeof data?.message === 'string'
        ? data.message
        : i18n.t('errors:generic');
    const code = typeof data?.code === 'string' ? data.code : undefined;
    const params =
      typeof data?.params === 'object' && data.params !== null
        ? (data.params as Record<string, unknown>)
        : undefined;

    return {
      message: translateByCode(code, params, serverMessage),
      statusCode: error.response.status,
      code: code as ErrorCodeValue | undefined,
      isNetworkError: false,
    };
  }

  return {
    message: i18n.t('errors:generic'),
    statusCode: -1,
    isNetworkError: false,
  };
}

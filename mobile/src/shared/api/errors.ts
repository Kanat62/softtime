import { AxiosError } from 'axios';
import i18n from '@/shared/i18n';

export interface AppError {
  message: string;
  statusCode: number;
  /** Optional machine-readable code from backend (e.g. "INVALID_QR") */
  code?: string;
  /** True when the request never reached the server (no internet / DNS / timeout) */
  isNetworkError: boolean;
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

    const data = error.response.data as Record<string, unknown> | undefined;
    const message =
      typeof data?.message === 'string'
        ? data.message
        : i18n.t('errors:generic');
    const code = typeof data?.code === 'string' ? data.code : undefined;

    return {
      message,
      statusCode: error.response.status,
      code,
      isNetworkError: false,
    };
  }

  return {
    message: i18n.t('errors:generic'),
    statusCode: -1,
    isNetworkError: false,
  };
}

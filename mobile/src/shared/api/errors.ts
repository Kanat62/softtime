import { AxiosError } from 'axios';

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
        message: 'Нет подключения к интернету',
        statusCode: 0,
        isNetworkError: true,
      };
    }

    const data = error.response.data as Record<string, unknown> | undefined;
    const message =
      typeof data?.message === 'string'
        ? data.message
        : 'Произошла ошибка. Попробуйте ещё раз.';
    const code = typeof data?.code === 'string' ? data.code : undefined;

    return {
      message,
      statusCode: error.response.status,
      code,
      isNetworkError: false,
    };
  }

  return {
    message: 'Произошла ошибка. Попробуйте ещё раз.',
    statusCode: -1,
    isNetworkError: false,
  };
}

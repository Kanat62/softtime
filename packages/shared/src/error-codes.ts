/**
 * Машинные коды ошибок API.
 *
 * Отдаются бэкендом в поле `code` ответа об ошибке рядом с человекочитаемым
 * `message`. Клиенты (web, mobile) ветвятся по коду, а не по тексту: текст
 * зависит от языка и может меняться, код — нет.
 *
 * Значение каждого ключа равно самому ключу, чтобы код в JSON совпадал
 * с именем константы и его было легко искать по репозиторию.
 */
export const ErrorCode = {
  // ─── Запасные по HTTP-статусу (когда у исключения нет своего кода) ─────────
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // ─── Доступ (guards) ──────────────────────────────────────────────────────
  FORBIDDEN_ROLE: 'FORBIDDEN_ROLE',
  SUBSCRIPTION_NOT_ACTIVE: 'SUBSCRIPTION_NOT_ACTIVE',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  ACCOUNT_PENDING: 'ACCOUNT_PENDING',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',

  // ─── Аутентификация ───────────────────────────────────────────────────────
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',

  // ─── Посещаемость / QR ────────────────────────────────────────────────────
  QR_INVALID: 'QR_INVALID',
  QR_NOT_FOUND: 'QR_NOT_FOUND',
  OUTSIDE_OFFICE_NETWORK: 'OUTSIDE_OFFICE_NETWORK',
  NON_WORKING_DAY: 'NON_WORKING_DAY',
  ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
  NO_ACTIVE_CHECKIN: 'NO_ACTIVE_CHECKIN',
  SCHEDULE_NOT_CONFIGURED: 'SCHEDULE_NOT_CONFIGURED',
  ATTENDANCE_NOT_FOUND: 'ATTENDANCE_NOT_FOUND',
  ATTENDANCE_ALREADY_EXISTS: 'ATTENDANCE_ALREADY_EXISTS',

  // ─── Пользователи ─────────────────────────────────────────────────────────
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_NOT_PENDING: 'USER_NOT_PENDING',
  CANNOT_CHANGE_OWN_STATUS: 'CANNOT_CHANGE_OWN_STATUS',
  CANNOT_DELETE_OWN_ACCOUNT: 'CANNOT_DELETE_OWN_ACCOUNT',
  INVALID_USER_STATUS: 'INVALID_USER_STATUS',
  CURRENT_PASSWORD_REQUIRED: 'CURRENT_PASSWORD_REQUIRED',
  CURRENT_PASSWORD_INVALID: 'CURRENT_PASSWORD_INVALID',
  NO_FIELDS_TO_UPDATE: 'NO_FIELDS_TO_UPDATE',
  LAST_ADMIN_CANNOT_DELETE: 'LAST_ADMIN_CANNOT_DELETE',

  // ─── Компании ─────────────────────────────────────────────────────────────
  COMPANY_NOT_FOUND: 'COMPANY_NOT_FOUND',

  // ─── Заявки ───────────────────────────────────────────────────────────────
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  REQUEST_ALREADY_HANDLED: 'REQUEST_ALREADY_HANDLED',
  REQUEST_INVALID_DATE_RANGE: 'REQUEST_INVALID_DATE_RANGE',

  // ─── Расписания ───────────────────────────────────────────────────────────
  SCHEDULE_MIN_HOURS: 'SCHEDULE_MIN_HOURS',

  // ─── Подписки ─────────────────────────────────────────────────────────────
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_ALREADY_CANCELLED: 'SUBSCRIPTION_ALREADY_CANCELLED',

  // ─── Офисные сети ─────────────────────────────────────────────────────────
  OFFICE_NETWORK_NOT_FOUND: 'OFFICE_NETWORK_NOT_FOUND',

  // ─── Новости ──────────────────────────────────────────────────────────────
  NEWS_NOT_FOUND: 'NEWS_NOT_FOUND',

  // ─── Платежи / отчёты ─────────────────────────────────────────────────────
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
} as const;

/** Значение любого кода ошибки, например 'QR_INVALID'. */
export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

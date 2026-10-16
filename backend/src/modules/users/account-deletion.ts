/**
 * Константы удаления аккаунта (анонимизации).
 *
 * Вынесены из UsersService, чтобы StatusGuard мог читать маркер, не
 * импортируя сервис.
 */

/** Имя, которое видят отчёты и история вместо настоящего ФИО. */
export const DELETED_USER_NAME = 'Удалённый пользователь';

/** Недоступный адрес: домен .invalid зарезервирован и не существует (RFC 6761). */
export const deletedEmail = (userId: string): string => `deleted+${userId}@deleted.invalid`;

/**
 * Маркер в Redis «пользователь удалён».
 *
 * Access-токен — JWT, его проверка не ходит в БД, поэтому после удаления он
 * проработал бы до своего истечения (15 минут). Маркер даёт StatusGuard
 * способ отклонить такой токен сразу. TTL чуть больше срока жизни access.
 */
export const deletedMarkerKey = (userId: string): string => `deleted:${userId}`;
export const DELETED_MARKER_TTL_SECONDS = 20 * 60;

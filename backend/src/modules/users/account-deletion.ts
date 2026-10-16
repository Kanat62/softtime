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

/**
 * Маркер «компания закрыта» (закрыта единственным админом при удалении
 * аккаунта). Как и deletedMarkerKey, нужен для живых access-токенов
 * сотрудников: JWT не ходит в БД, а закрытие компании должно действовать сразу.
 * После 20 минут все такие токены истекли, дальше работает статус компании в БД
 * (логин и регистрация проверяют CompanyStatus.CLOSED).
 */
export const companyClosedMarkerKey = (companyId: string): string => `company-closed:${companyId}`;

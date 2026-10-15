/**
 * Русский общий словарь (источник истины для web, mobile и backend).
 *
 * Три namespace:
 *  - enums      — подписи значений енумов из ../enums
 *  - validation — сообщения zod-схем из ../schemas
 *  - errors     — тексты машинных кодов ошибок API из ../error-codes
 *  - push       — заголовки и тела push-уведомлений (их формирует backend
 *                 на языке получателя, см. backend/src/common/i18n)
 *
 * Строки извлечены из существующего кода. Там, где web и mobile
 * расходились, выбран один вариант (см. отчёт этапа A1).
 * Енумы и схемы на этом этапе НЕ изменяются — словарь аддитивен.
 */
import type { ErrorCodeValue } from '../error-codes';

/**
 * Текст на каждый машинный код ошибки API.
 *
 * Аннотация `Record<ErrorCodeValue, string>` обязательна: с ней добавление
 * нового кода в ../error-codes ломает компиляцию, пока текст не написан.
 * Клиенты берут текст по `code` из ответа бэкенда, серверный `message`
 * остаётся только запасным вариантом.
 *
 * Для кодов, у которых на бэкенде русский текст, здесь ТОТ ЖЕ текст —
 * чтобы переход на перевод по коду ничего не менял визуально.
 */
const errors: Record<ErrorCodeValue, string> = {
  // ─── Запасные по HTTP-статусу ───────────────────────────────────────────
  VALIDATION_ERROR: 'Проверьте правильность заполнения полей',
  BAD_REQUEST: 'Некорректный запрос',
  UNAUTHORIZED: 'Требуется вход в систему',
  FORBIDDEN: 'Недостаточно прав',
  NOT_FOUND: 'Не найдено',
  CONFLICT: 'Конфликт данных',
  UNPROCESSABLE_ENTITY: 'Данные не прошли проверку',
  TOO_MANY_REQUESTS: 'Слишком много запросов. Попробуйте позже.',
  INTERNAL_ERROR: 'Внутренняя ошибка сервера',

  // ─── Доступ (guards) ────────────────────────────────────────────────────
  FORBIDDEN_ROLE: 'Недостаточно прав',
  SUBSCRIPTION_NOT_ACTIVE: 'Подписка компании неактивна',
  ACCOUNT_BLOCKED: 'Аккаунт заблокирован',
  ACCOUNT_PENDING: 'Ожидает подтверждения администратором',

  // ─── Аутентификация ─────────────────────────────────────────────────────
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  TOO_MANY_ATTEMPTS: 'Слишком много попыток. Повторите через 15 минут.',
  EMAIL_TAKEN: 'Этот email уже зарегистрирован',
  REFRESH_TOKEN_INVALID: 'Недействительный refresh-токен',
  REFRESH_TOKEN_EXPIRED: 'Refresh-токен не найден или истёк',

  // ─── Посещаемость / QR ──────────────────────────────────────────────────
  QR_INVALID: 'QR недействителен',
  QR_NOT_FOUND: 'Активный QR не найден. Используйте /qr/regenerate.',
  OUTSIDE_OFFICE_NETWORK: 'Вне офисной сети',
  NON_WORKING_DAY: 'Сегодня нерабочий день',
  ALREADY_CHECKED_IN: 'Приход уже отмечен',
  NO_ACTIVE_CHECKIN: 'Нет активного прихода для выхода',
  SCHEDULE_NOT_CONFIGURED: 'Расписание на сегодня не настроено',
  ATTENDANCE_NOT_FOUND: 'Запись не найдена',
  ATTENDANCE_ALREADY_EXISTS: 'Запись за этот день уже существует',

  // ─── Пользователи ───────────────────────────────────────────────────────
  USER_NOT_FOUND: 'Пользователь не найден',
  USER_NOT_PENDING: 'Пользователь не в статусе PENDING',
  CANNOT_CHANGE_OWN_STATUS: 'Нельзя изменить статус самому себе',
  CANNOT_DELETE_OWN_ACCOUNT: 'Нельзя удалить собственный аккаунт',
  INVALID_USER_STATUS: 'Допустимые статусы: ACTIVE, BLOCKED, WARNING',
  CURRENT_PASSWORD_REQUIRED: 'currentPassword обязателен для смены пароля',
  CURRENT_PASSWORD_INVALID: 'Текущий пароль неверен',
  NO_FIELDS_TO_UPDATE: 'Нет данных для обновления',

  // ─── Компании ───────────────────────────────────────────────────────────
  COMPANY_NOT_FOUND: 'Компания не найдена',

  // ─── Заявки ─────────────────────────────────────────────────────────────
  REQUEST_NOT_FOUND: 'Заявка не найдена',
  REQUEST_ALREADY_HANDLED: 'Заявка уже обработана',
  REQUEST_INVALID_DATE_RANGE: 'endDate не может быть раньше startDate',

  /**
   * Единственный код с параметрами: бэкенд присылает их в `params`
   * ({ weekday, hours, startTime, endTime }). weekday — значение Weekday,
   * клиент переводит его через namespace enums.weekdayShort/weekdayLong.
   */
  SCHEDULE_MIN_HOURS:
    '{{weekday}}: рабочий день должен быть не менее {{hours}} ч ({{startTime}}–{{endTime}})',

  // ─── Подписки ───────────────────────────────────────────────────────────
  SUBSCRIPTION_NOT_FOUND: 'Подписка не найдена',
  SUBSCRIPTION_CANCELLED: 'Подписка отменена. Обратитесь в службу поддержки.',
  SUBSCRIPTION_ALREADY_CANCELLED: 'Подписка уже отменена',

  // ─── Офисные сети ───────────────────────────────────────────────────────
  OFFICE_NETWORK_NOT_FOUND: 'Сеть не найдена',

  // ─── Новости ────────────────────────────────────────────────────────────
  NEWS_NOT_FOUND: 'Новость не найдена',

  // ─── Платежи / отчёты ───────────────────────────────────────────────────
  PAYMENT_NOT_FOUND: 'Платёж не найден',
};

/** Одно push-событие: заголовок и тело. */
export interface PushMessage {
  title: string;
  body: string;
}

/**
 * Push-событие, тело которого зависит от числа (`params.count`).
 * Формы — категории Intl.PluralRules: для ru нужны все четыре,
 * для en фактически работают `one` и `other`, но ключи обязательны
 * в обоих языках, чтобы словари были симметричны.
 */
export interface PluralPushMessage {
  title: string;
  body_one: string;
  body_few: string;
  body_many: string;
  body_other: string;
}

/**
 * Полный перечень push-событий. Явный тип (как `ErrorMessages` для errors):
 * новое событие или опечатка в ключе ломают компиляцию сразу в двух языках,
 * а backend обращается к словарю только по этим именам.
 */
export interface PushMessages {
  // ─── Регистрация ────────────────────────────────────────────────────────
  /** WORKER зарегистрировался → ADMIN компании. */
  newEmployee: PushMessage;
  /** Компания зарегистрировалась → PROVIDER. */
  newCompany: PushMessage;
  /** ADMIN подтвердил регистрацию → сам пользователь. */
  registrationApproved: PushMessage;
  /** ADMIN отклонил регистрацию → сам пользователь (до удаления). */
  registrationRejected: PushMessage;

  // ─── Заявки ─────────────────────────────────────────────────────────────
  /** Сотрудник подал заявку → ADMIN компании. */
  newRequest: PushMessage;
  /** Заявка одобрена → автор заявки. */
  requestApproved: PushMessage;
  /** Заявка отклонена без комментария → автор заявки. */
  requestRejected: PushMessage;
  /** Заявка отклонена с комментарием → автор заявки. */
  requestRejectedWithReason: PushMessage;

  // ─── Новости ────────────────────────────────────────────────────────────
  /** Новость опубликована → все ACTIVE-сотрудники компании. */
  newsPublished: PushMessage;

  // ─── Компания и подписка ────────────────────────────────────────────────
  /** PROVIDER приостановил компанию → ADMIN компании. */
  companySuspended: PushMessage;
  /** Подписка отменена вручную → ADMIN компании. */
  subscriptionCancelled: PushMessage;
  /** Поступила оплата → PROVIDER. */
  paymentReceived: PushMessage;

  // ─── Cron ───────────────────────────────────────────────────────────────
  /** cron подписок: льготный период кончился → ADMIN компании. */
  companySuspendedUnpaid: PushMessage;
  /** cron подписок: период истёк, остались дни грейса → ADMIN компании. */
  subscriptionExpiring: PluralPushMessage;
  /** cron автозакрытия смен: список не закрывших → ADMIN компании. */
  unclosedShifts: PluralPushMessage;
}

/**
 * Русские тексты push — дословно те, что бэкенд отправлял до перевода.
 * Исключение: у плюрализованных событий добавлена форма `one`
 * («Сотрудник не закрыл смену») — раньше её не было, фраза всегда стояла
 * во множественном числе. «дн.» — сокращение, одинаковое во всех формах.
 */
const push: PushMessages = {
  newEmployee: {
    title: 'Новый сотрудник',
    body: '{{fullName}} ожидает подтверждения регистрации',
  },
  newCompany: {
    title: 'Новая компания',
    body: 'Компания «{{companyName}}» зарегистрировалась на платформе',
  },
  registrationApproved: {
    title: 'Регистрация одобрена',
    body: 'Ваша регистрация в компании одобрена',
  },
  registrationRejected: {
    title: 'Регистрация отклонена',
    body: 'Ваша заявка на регистрацию была отклонена',
  },

  newRequest: {
    title: 'Новая заявка',
    body: 'Заявка подана: {{requestType}} от {{fullName}}',
  },
  requestApproved: {
    title: 'Заявка одобрена',
    body: 'Ваша заявка «{{requestType}}» одобрена',
  },
  requestRejected: {
    title: 'Заявка отклонена',
    body: 'Ваша заявка «{{requestType}}» отклонена',
  },
  requestRejectedWithReason: {
    title: 'Заявка отклонена',
    body: 'Ваша заявка «{{requestType}}» отклонена: {{reason}}',
  },

  newsPublished: {
    title: 'Новая новость',
    body: '{{newsTitle}}',
  },

  companySuspended: {
    title: 'Компания приостановлена',
    body: 'Ваша компания была приостановлена администратором платформы.',
  },
  subscriptionCancelled: {
    title: 'Подписка отменена',
    body: 'Ваша подписка была отменена. Доступ к системе приостановлен.',
  },
  paymentReceived: {
    title: 'Поступила оплата',
    body: 'Поступила оплата от компании «{{companyName}}»',
  },

  companySuspendedUnpaid: {
    title: 'Компания приостановлена',
    body: 'Подписка не оплачена. Доступ к системе приостановлен.',
  },
  subscriptionExpiring: {
    title: 'Подписка истекает',
    body_one: 'Оплатите подписку в течение {{count}} дн., иначе доступ будет приостановлен.',
    body_few: 'Оплатите подписку в течение {{count}} дн., иначе доступ будет приостановлен.',
    body_many: 'Оплатите подписку в течение {{count}} дн., иначе доступ будет приостановлен.',
    body_other: 'Оплатите подписку в течение {{count}} дн., иначе доступ будет приостановлен.',
  },
  unclosedShifts: {
    title: 'Незакрытые смены',
    body_one: 'Сотрудник не закрыл смену: {{names}}',
    body_few: 'Сотрудники не закрыли смену: {{names}}',
    body_many: 'Сотрудники не закрыли смену: {{names}}',
    body_other: 'Сотрудники не закрыли смену: {{names}}',
  },
};

export const ru = {
  errors,
  push,

  enums: {
    /** Источник: web AppShell.tsx ("Администратор"), web/widgets/audit-table ("Сотрудник") */
    userRole: {
      PROVIDER: 'Провайдер',
      ADMIN: 'Администратор',
      WORKER: 'Сотрудник',
    },

    /** Источник: web status-badge.tsx + mobile StatusBadge.tsx */
    userStatus: {
      PENDING: 'Ожидает подтверждения',
      ACTIVE: 'Активен',
      WARNING: 'Внимание',
      BLOCKED: 'Заблокирован',
      DELETED: 'Удалён',
    },

    /** Источник: web status-badge.tsx + mobile StatusBadge.tsx */
    companyStatus: {
      TRIAL: 'Пробный период',
      ACTIVE: 'Активна',
      GRACE: 'Льготный период',
      SUSPENDED: 'Приостановлена',
    },

    /** Источник: web status-badge.tsx (EXPIRED, CANCELLED) + mobile StatusBadge.tsx */
    subStatus: {
      TRIAL: 'Пробный период',
      ACTIVE: 'Активна',
      EXPIRED: 'Истёк',
      GRACE: 'Льготный период',
      CANCELLED: 'Отменена',
    },

    /** Источник: web status-badge.tsx + mobile StatusBadge.tsx */
    checkInStatus: {
      ON_TIME: 'Вовремя',
      LATE: 'Опоздание',
      EARLY_ARRIVAL: 'Ранний приход',
    },

    /** Источник: mobile StatusBadge.tsx (LEFT_EARLY, OVERTIME) */
    checkOutStatus: {
      ON_TIME: 'Вовремя',
      LEFT_EARLY: 'Ушёл раньше',
      OVERTIME: 'Переработка',
    },

    /** Источник: web status-badge.tsx + mobile StatusBadge.tsx */
    dayStatus: {
      PRESENT: 'Присутствует',
      LATE: 'Опоздание',
      ABSENT: 'Отсутствует',
      INCOMPLETE: 'Не завершён',
      APPROVED_ABSENCE: 'Согласованное отсутствие',
      MANUAL: 'Ручная правка',
      EARLY_LEAVE: 'Ранний уход',
      OVERTIME: 'Переработка',
    },

    /**
     * Источник: web entities/request/ui/RequestTypeBadge.tsx,
     * web widgets/requests-table, mobile screens/requests/RequestsScreen.tsx,
     * mobile widgets/incoming-requests
     */
    requestType: {
      SICK: 'Больничный',
      FAMILY: 'Семейные обстоятельства',
      VACATION: 'Отпуск',
      BUSINESS_TRIP: 'Командировка',
      REMOTE: 'Удалённая работа',
      LATE_REASON: 'Опоздание (с причиной)',
      EARLY_LEAVE: 'Ранний уход (с причиной)',
      OTHER: 'Другое',
    },

    /** Источник: web status-badge.tsx + mobile StatusBadge.tsx */
    requestStatus: {
      PENDING: 'На рассмотрении',
      APPROVED: 'Одобрено',
      REJECTED: 'Отклонено',
    },

    /** Источник: web status-badge.tsx (PAID, FAILED) */
    paymentStatus: {
      PENDING: 'Ожидает оплаты',
      PAID: 'Оплачено',
      FAILED: 'Ошибка оплаты',
    },

    /** Источник: web ScheduleEditorWidget.tsx, mobile ScheduleMini/ScheduleWeek */
    weekdayShort: {
      MON: 'Пн',
      TUE: 'Вт',
      WED: 'Ср',
      THU: 'Чт',
      FRI: 'Пт',
      SAT: 'Сб',
      SUN: 'Вс',
    },

    /** Источник: mobile widgets/schedule-week/ScheduleWeek.tsx (WEEKDAY_FULL) */
    weekdayLong: {
      MON: 'Понедельник',
      TUE: 'Вторник',
      WED: 'Среда',
      THU: 'Четверг',
      FRI: 'Пятница',
      SAT: 'Суббота',
      SUN: 'Воскресенье',
    },
  },

  validation: {
    /** Источник: schemas/auth.ts, office-network.ts, attendance.ts, device.ts, profile.ts */
    required: {
      companyName: 'Название компании обязательно',
      fullName: 'ФИО обязательно',
      password: 'Пароль обязателен',
      currentPassword: 'Введите текущий пароль',
      label: 'Название обязательно',
      qrToken: 'qrToken обязателен',
      refreshToken: 'refreshToken обязателен',
      fcmToken: 'fcmToken обязателен',
    },

    /** Источник: schemas/auth.ts, profile.ts, users.ts, attendance.ts */
    format: {
      email: 'Некорректный email',
      url: 'Некорректный URL',
      userUuid: 'Некорректный UUID пользователя',
      date: 'Формат даты: YYYY-MM-DD',
      time: 'Формат времени: HH:mm',
      startDate: 'Некорректная дата начала',
      companyCode: 'Код компании должен содержать ровно 6 цифр',
      cidr: 'Некорректный CIDR или IP (пример: 192.168.1.0/24)',
    },

    /** Источник: schemas/auth.ts, profile.ts, users.ts */
    password: {
      min: 'Пароль должен содержать минимум 8 символов',
      max: 'Пароль не может превышать 72 символа',
      currentRequired: 'currentPassword обязателен при смене пароля',
    },

    /** Источник: schemas/attendance.ts, users.ts, request.ts, office-network.ts */
    length: {
      noteMax500: 'Заметка не может превышать 500 символов',
      commentMax500: 'Комментарий не может превышать 500 символов',
      commentMax1000: 'Комментарий не может превышать 1000 символов',
      labelMax100: 'Название не может превышать 100 символов',
    },

    /** Источник: schemas/attendance.ts, office-network.ts, settings.ts */
    update: {
      noData: 'Нет данных для обновления',
      atLeastOneFieldToUpdate: 'Укажите хотя бы одно поле для обновления',
      atLeastOneField: 'Укажите хотя бы одно поле',
    },

    /** Источник: schemas/attendance.ts, request.ts, users.ts (errorMap) */
    enumValue: {
      dayStatus: 'Недопустимый статус дня',
      requestType: 'Недопустимый тип заявки',
      userStatus: 'Допустимые статусы: ACTIVE, BLOCKED, WARNING',
    },

    /** Источник: schemas/schedule.ts */
    schedule: {
      startRequired: 'Время начала смены обязательно для рабочего дня',
      endRequired: 'Время конца смены обязательно для рабочего дня',
      minHours: 'Рабочий день должен быть не менее 6 часов',
      sevenDays: 'Расписание должно содержать ровно 7 дней',
    },

    /** Источник: schemas/settings.ts */
    settings: {
      integer: 'Должно быть целым числом',
      minHours: 'Минимум 1 час',
      maxHours: 'Максимум 24 часа',
      notNegative: 'Не может быть отрицательным',
      maxMinutes: 'Максимум 480 минут',
    },

    /** Источник: schemas/assistant.ts */
    assistant: {
      questionMin: 'Вопрос слишком короткий (минимум 3 символа)',
      questionMax: 'Вопрос слишком длинный (максимум 300 символов)',
    },
  },
};

/**
 * Форма общего словаря. en.ts обязан совпадать по ключам.
 * Намеренно без `as const`: значения должны иметь тип string,
 * иначе `const en: Dictionary` требовал бы дословно русских строк.
 */
export type Dictionary = typeof ru;

/** Namespace `errors`: текст на каждое значение ErrorCode. */
export type ErrorMessages = Record<ErrorCodeValue, string>;

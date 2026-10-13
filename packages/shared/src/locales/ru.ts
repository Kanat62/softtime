/**
 * Русский общий словарь (источник истины для web, mobile и backend).
 *
 * Два namespace:
 *  - enums      — подписи значений енумов из ../enums
 *  - validation — сообщения zod-схем из ../schemas
 *
 * Строки извлечены из существующего кода. Там, где web и mobile
 * расходились, выбран один вариант (см. отчёт этапа A1).
 * Енумы и схемы на этом этапе НЕ изменяются — словарь аддитивен.
 */
export const ru = {
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

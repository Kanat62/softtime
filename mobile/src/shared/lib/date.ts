import i18n from '@/shared/i18n';

/**
 * Теги локалей для Intl по текущему языку i18n.
 * Язык берётся из i18n, а не из устройства, чтобы форматы следовали
 * выбору пользователя в Профиле.
 */
const LOCALE_TAGS: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

function localeTag(): string {
  return LOCALE_TAGS[i18n.language] ?? LOCALE_TAGS.ru;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // hour12: false — учёт рабочего времени ведём в 24-часовом формате
  // на обоих языках, иначе en-US даёт "02:05 PM".
  return d.toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatWorkedDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hoursShort = i18n.t('common:duration.hoursShort');
  const minutesShort = i18n.t('common:duration.minutesShort');
  return h > 0 ? `${h}${hoursShort} ${m}${minutesShort}` : `${m}${minutesShort}`;
}

/** "13 окт" / "13 Oct" — для компактных диапазонов. */
export function formatDayMonthShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'short' });
}

/** "13 окт 2026" / "Oct 13, 2026". */
export function formatDayMonthYearShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(localeTag(), { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Название месяца отдельным словом: "Октябрь" / "October". */
export function monthNameLong(monthIndex: number): string {
  const name = new Date(2000, monthIndex, 1).toLocaleDateString(localeTag(), { month: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Сокращение месяца: "окт" / "Oct". */
export function monthNameShort(monthIndex: number): string {
  return new Date(2000, monthIndex, 1).toLocaleDateString(localeTag(), { month: 'short' });
}

/** Подписи дней недели Пн…Вс из общего словаря (enums.weekdayShort). */
export function weekdayShortLabels(): string[] {
  return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) =>
    i18n.t(`enums:weekdayShort.${d}`),
  );
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

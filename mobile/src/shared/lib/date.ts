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

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

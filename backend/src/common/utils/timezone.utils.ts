import { Weekday } from '@softtime/shared';

const WEEKDAY_SHORT: Record<string, Weekday> = {
  Sun: Weekday.SUN,
  Mon: Weekday.MON,
  Tue: Weekday.TUE,
  Wed: Weekday.WED,
  Thu: Weekday.THU,
  Fri: Weekday.FRI,
  Sat: Weekday.SAT,
};

export interface LocalDayInfo {
  weekday: Weekday;
  /** Minutes elapsed since local midnight (0–1439) */
  minutesInDay: number;
  /** UTC timestamp that corresponds to 00:00:00.000 in the given timezone */
  startOfLocalDay: Date;
}

/**
 * Returns local-timezone day info for a UTC instant.
 *
 * startOfLocalDay: computed by subtracting the local-time components from
 * utcDate, giving the exact UTC millisecond when local midnight occurred.
 * Works for any fixed-offset timezone; DST-safe because the offset at the
 * instant utcDate is observed (not a cached or approximated value).
 */
export function getLocalDayInfo(utcDate: Date, timezone: string): LocalDayInfo {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(utcDate);

  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? '0';

  const hour = parseInt(get('hour'), 10) % 24; // Intl can return "24" for midnight
  const minute = parseInt(get('minute'), 10);
  const second = parseInt(get('second'), 10);

  const localMs =
    (hour * 3600 + minute * 60 + second) * 1000 + utcDate.getMilliseconds();
  const startOfLocalDay = new Date(utcDate.getTime() - localMs);

  return {
    weekday: WEEKDAY_SHORT[get('weekday')] ?? Weekday.MON,
    minutesInDay: hour * 60 + minute,
    startOfLocalDay,
  };
}

/**
 * Returns the weekday of utcDate in the given timezone.
 * Lightweight alternative to getLocalDayInfo when only the weekday is needed.
 */
export function getLocalWeekday(utcDate: Date, timezone: string): Weekday {
  const weekdayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(utcDate);
  return WEEKDAY_SHORT[weekdayStr] ?? Weekday.MON;
}

/**
 * Returns "YYYY-MM-DD" for utcDate interpreted in the given timezone.
 * Uses sv-SE locale which produces a reliable ISO-like date string.
 */
export function getLocalDateString(utcDate: Date, timezone: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(utcDate);
}

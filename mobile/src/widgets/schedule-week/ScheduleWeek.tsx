import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { Weekday } from '@softtime/shared';
import type { EmployeeSchedule } from '@softtime/shared';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  radius,
  shadows,
  space,
  typography,
} from '@/shared/config/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_ORDER: Weekday[] = [
  Weekday.MON, Weekday.TUE, Weekday.WED,
  Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN,
];

const WEEKDAY_SHORT: Record<Weekday, string> = {
  [Weekday.MON]: 'Пн', [Weekday.TUE]: 'Вт', [Weekday.WED]: 'Ср',
  [Weekday.THU]: 'Чт', [Weekday.FRI]: 'Пт', [Weekday.SAT]: 'Сб', [Weekday.SUN]: 'Вс',
};

const WEEKDAY_FULL: Record<Weekday, string> = {
  [Weekday.MON]: 'Понедельник', [Weekday.TUE]: 'Вторник',  [Weekday.WED]: 'Среда',
  [Weekday.THU]: 'Четверг',    [Weekday.FRI]: 'Пятница',   [Weekday.SAT]: 'Суббота',
  [Weekday.SUN]: 'Воскресенье',
};

// JS Date.getDay(): 0=Sun, 1=Mon … 6=Sat
const JS_DAY_TO_WEEKDAY: Record<number, Weekday> = {
  0: Weekday.SUN, 1: Weekday.MON, 2: Weekday.TUE, 3: Weekday.WED,
  4: Weekday.THU, 5: Weekday.FRI, 6: Weekday.SAT,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ч` : `${h} ч ${m} м`;
}

function getWorkMinutes(entry: EmployeeSchedule): number {
  if (!entry.isWorkingDay || !entry.startTime || !entry.endTime) return 0;
  return timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime);
}

function daysLabel(n: number): string {
  if (n === 1) return 'день';
  if (n >= 2 && n <= 4) return 'дня';
  return 'дней';
}

// ─── Widget ───────────────────────────────────────────────────────────────────

interface ScheduleWeekProps {
  schedule: EmployeeSchedule[];
}

export function ScheduleWeek({ schedule }: ScheduleWeekProps) {
  const todayWeekday = JS_DAY_TO_WEEKDAY[new Date().getDay()];
  const scheduleMap = Object.fromEntries(schedule.map((s) => [s.weekday, s]));

  let totalMinutes = 0;
  let workingDays = 0;
  for (const entry of schedule) {
    const mins = getWorkMinutes(entry);
    if (mins > 0) { totalMinutes += mins; workingDays++; }
  }

  return (
    <View style={styles.root}>
      {/* ── Hero card ─────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Моя нагрузка</Text>
          <Text style={styles.heroHours}>{formatDuration(totalMinutes)}</Text>
          <Text style={styles.heroSub}>
            в неделю · {workingDays} рабочих {daysLabel(workingDays)}
          </Text>
        </View>
        <CalendarDays size={44} color="rgba(255,255,255,0.35)" strokeWidth={iconStrokeWidth} />
      </View>

      {/* ── Day list ──────────────────────────────────────────── */}
      <View style={styles.list}>
        {WEEKDAY_ORDER.map((weekday) => {
          const entry = scheduleMap[weekday];
          const isToday = weekday === todayWeekday;
          const isWorking = entry?.isWorkingDay ?? false;
          const workMins = entry ? getWorkMinutes(entry) : 0;

          return (
            <View
              key={weekday}
              style={[styles.dayCard, isToday && styles.dayCardActive]}
            >
              {/* Short label circle */}
              <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                <Text style={[styles.dayCircleText, isToday && styles.dayCircleTextToday]}>
                  {WEEKDAY_SHORT[weekday]}
                </Text>
              </View>

              {/* Name + time */}
              <View style={styles.dayInfo}>
                <View style={styles.dayNameRow}>
                  <Text style={styles.dayName} numberOfLines={1}>
                    {WEEKDAY_FULL[weekday]}
                  </Text>
                  {isToday && (
                    <View style={styles.todayPill}>
                      <Text style={styles.todayPillText}>Сегодня</Text>
                    </View>
                  )}
                </View>

                {isWorking && entry?.startTime && entry?.endTime ? (
                  <Text style={styles.dayTime}>
                    {entry.startTime} – {entry.endTime}
                  </Text>
                ) : (
                  <Text style={styles.dayOff}>Выходной</Text>
                )}
              </View>

              {/* Duration */}
              {isWorking && workMins > 0 && (
                <Text style={styles.dayDuration}>{formatDuration(workMins)}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    gap: space[3],
  },

  // Hero
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: space[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(shadows.md as object),
  },
  heroContent: {
    gap: 4,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroHours: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fontFamily.bold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSub: {
    ...typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },

  // List
  list: {
    gap: space[2],
  },

  // Day card
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    ...(shadows.xs as object),
  },
  dayCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  // Day circle
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.neutralLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: colors.primary,
  },
  dayCircleText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  dayCircleTextToday: {
    color: '#fff',
  },

  // Day info
  dayInfo: {
    flex: 1,
    gap: 2,
  },
  dayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  dayName: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  dayTime: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  dayOff: {
    ...typography.sm,
    color: colors.textDisabled,
  },

  // Today pill
  todayPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayPillText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },

  // Duration
  dayDuration: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
});

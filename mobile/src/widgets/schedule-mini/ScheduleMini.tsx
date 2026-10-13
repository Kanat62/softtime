import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Weekday } from '@softtime/shared';
import type { EmployeeSchedule } from '@softtime/shared';
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  radius,
  shadows,
  space,
  typography,
} from '@/shared/config/theme';

const WEEKDAY_ORDER: Weekday[] = [
  Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN,
];

// JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
const JS_DAY_TO_WEEKDAY: Record<number, Weekday> = {
  0: Weekday.SUN,
  1: Weekday.MON,
  2: Weekday.TUE,
  3: Weekday.WED,
  4: Weekday.THU,
  5: Weekday.FRI,
  6: Weekday.SAT,
};

interface ScheduleMiniProps {
  schedule: EmployeeSchedule[];
  onMorePress?: () => void;
}

export function ScheduleMini({ schedule, onMorePress }: ScheduleMiniProps) {
  const { t } = useTranslation(['home', 'enums']);
  const todayWeekday = JS_DAY_TO_WEEKDAY[new Date().getDay()];
  const scheduleMap = Object.fromEntries(schedule.map((s) => [s.weekday, s]));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CalendarDays size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
          <Text style={styles.title}>{t('home:schedule.title')}</Text>
        </View>
        <TouchableOpacity onPress={onMorePress} activeOpacity={0.7}>
          <Text style={styles.moreLink}>{t('home:schedule.more')} &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysRow}>
        {WEEKDAY_ORDER.map((weekday) => {
          const entry = scheduleMap[weekday];
          const isToday = weekday === todayWeekday;
          const isWorking = entry?.isWorkingDay ?? false;
          const startTime = entry?.startTime ?? null;

          return (
            <View key={weekday} style={styles.dayCell}>
              <View style={[styles.dayLabelWrap, isToday && styles.dayLabelToday]}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelTextToday]}>
                  {t(`enums:weekdayShort.${weekday}`)}
                </Text>
              </View>
              <Text style={[styles.dayTime, !isWorking && styles.dayTimeOff]}>
                {isWorking && startTime ? startTime : '–'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[4],
    ...(shadows.card as object),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  title: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  moreLink: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    gap: space[1],
    flex: 1,
  },
  dayLabelWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelToday: {
    backgroundColor: colors.primary,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.textSecondary,
  },
  dayLabelTextToday: {
    color: colors.surface,
  },
  dayTime: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dayTimeOff: {
    color: colors.textDisabled,
  },
});

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { Attendance } from '@softtime/shared';
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
import { StatusBadge } from '@/shared/ui';
import i18n from '@/shared/i18n';

// ─── Formatters ───────────────────────────────────────────────────────────────

const LOCALE_TAGS: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

/** "Пн, 13 октября" / "Mon, October 13". */
export function formatDate(date: Date): string {
  const tag = LOCALE_TAGS[i18n.language] ?? LOCALE_TAGS.ru;
  const formatted = date.toLocaleDateString(tag, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatTime(date: Date | null): string {
  if (!date) return '—';
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hoursShort = i18n.t('common:duration.hoursShort');
  const minutesShort = i18n.t('common:duration.minutesShort');
  return m === 0 ? `${h} ${hoursShort}` : `${h} ${hoursShort} ${m} ${minutesShort}`;
}

// ─── Widget ───────────────────────────────────────────────────────────────────

interface HistoryListProps {
  items: Attendance[];
  onItemPress: (item: Attendance) => void;
}

export function HistoryList({ items, onItemPress }: HistoryListProps) {
  const { t } = useTranslation('attendance');
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('attendance:history.emptyPeriod')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.row}
          onPress={() => onItemPress(item)}
          activeOpacity={0.8}
        >
          {/* Left: date + time range */}
          <View style={styles.rowLeft}>
            <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
            <Text style={styles.rowTime}>
              {item.checkInAt ? formatTime(item.checkInAt) : '—'}
              {'  →  '}
              {item.checkOutAt ? formatTime(item.checkOutAt) : '—'}
            </Text>
          </View>

          {/* Right: badge + hours + chevron */}
          <View style={styles.rowRight}>
            <StatusBadge status={item.status} />
            <Text style={styles.rowHours}>{formatMinutes(item.workedMinutes)}</Text>
          </View>

          <ChevronRight
            size={iconSize.sm}
            color={colors.textDisabled}
            strokeWidth={iconStrokeWidth}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    gap: space[2],
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    ...(shadows.card as object),

  },
  rowLeft: {
    flex: 1,
    gap: 3,
  },
  rowDate: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  rowTime: {
    ...typography.sm,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowHours: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  empty: {
    paddingVertical: space[12],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.base,
    color: colors.textDisabled,
  },
});

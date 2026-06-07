import React from 'react';
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

// ─── Formatters ───────────────────────────────────────────────────────────────

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function formatDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
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
  return m === 0 ? `${h} ч` : `${h} ч ${m} м`;
}

// ─── Widget ───────────────────────────────────────────────────────────────────

interface HistoryListProps {
  items: Attendance[];
  onItemPress: (item: Attendance) => void;
}

export function HistoryList({ items, onItemPress }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Нет данных за период</Text>
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

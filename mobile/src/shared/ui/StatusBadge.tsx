import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, typography } from '../config/theme';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeConfig {
  bg: string;
  text: string;
  dot: string;
  label: string;
}

const STATUS_MAP: Record<string, BadgeConfig> = {
  // Success — green
  ACTIVE:           { bg: colors.successLight, text: colors.successText, dot: colors.success, label: 'Активен' },
  ON_TIME:          { bg: colors.successLight, text: colors.successText, dot: colors.success, label: 'Вовремя' },
  PRESENT:          { bg: colors.successLight, text: colors.successText, dot: colors.success, label: 'Присутствует' },
  PAID:             { bg: colors.successLight, text: colors.successText, dot: colors.success, label: 'Оплачено' },
  APPROVED:         { bg: colors.successLight, text: colors.successText, dot: colors.success, label: 'Одобрено' },
  EARLY_ARRIVAL:    { bg: colors.infoLight,    text: colors.infoText,    dot: colors.info,    label: 'Ранний приход' },

  // Warning — yellow
  LATE:             { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, label: 'Опоздание' },
  GRACE:            { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, label: 'Льготный период' },
  TRIAL:            { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, label: 'Пробный период' },
  WARNING:          { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, label: 'Внимание' },

  // Danger — red
  ABSENT:           { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  label: 'Не отмечен' },
  INCOMPLETE:       { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  label: 'Незавершён' },
  SUSPENDED:        { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  label: 'Заблокирован' },
  BLOCKED:          { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  label: 'Заблокирован' },
  REJECTED:         { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  label: 'Отклонено' },

  // Info — blue
  PENDING:          { bg: colors.infoLight,    text: colors.infoText,    dot: colors.info,    label: 'Ожидание' },
  APPROVED_ABSENCE: { bg: colors.infoLight,    text: colors.infoText,    dot: colors.info,    label: 'Одобрено (отсутствие)' },

  // Neutral — gray
  LEFT_EARLY:       { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, label: 'Ушёл раньше' },
  EARLY_LEAVE:      { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, label: 'Ранний уход' },
  OVERTIME:         { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, label: 'Переработка' },
  MANUAL:           { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, label: 'Вручную' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    bg: colors.neutralLight,
    text: colors.neutralText,
    dot: colors.neutral,
    label: status,
  };

  const displayLabel = label ?? config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.xs,
    fontFamily: fontFamily.medium,
  },
});

import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, typography } from '../config/theme';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeConfig {
  bg: string;
  text: string;
  dot: string;
  /**
   * Путь в общем словаре enums (@softtime/shared). Подписи не дублируются
   * здесь: один статус — один источник истины для mobile, web и backend.
   * Плоский ключ указывает на конкретный енум, потому что одно и то же
   * значение в разных енумах значит разное (PENDING у заявки и у платежа).
   */
  labelKey: string;
}

const STATUS_MAP: Record<string, BadgeConfig> = {
  // Success — green
  ACTIVE:           { bg: colors.successLight, text: colors.successText, dot: colors.success, labelKey: 'enums:userStatus.ACTIVE' },
  ON_TIME:          { bg: colors.successLight, text: colors.successText, dot: colors.success, labelKey: 'enums:checkInStatus.ON_TIME' },
  PRESENT:          { bg: colors.successLight, text: colors.successText, dot: colors.success, labelKey: 'enums:dayStatus.PRESENT' },
  PAID:             { bg: colors.successLight, text: colors.successText, dot: colors.success, labelKey: 'enums:paymentStatus.PAID' },
  APPROVED:         { bg: colors.successLight, text: colors.successText, dot: colors.success, labelKey: 'enums:requestStatus.APPROVED' },
  EARLY_ARRIVAL:    { bg: colors.infoLight,    text: colors.infoText,    dot: colors.info,    labelKey: 'enums:checkInStatus.EARLY_ARRIVAL' },

  // Warning — yellow
  LATE:             { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, labelKey: 'enums:dayStatus.LATE' },
  GRACE:            { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, labelKey: 'enums:subStatus.GRACE' },
  TRIAL:            { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, labelKey: 'enums:subStatus.TRIAL' },
  WARNING:          { bg: colors.warningLight, text: colors.warningText, dot: colors.warning, labelKey: 'enums:userStatus.WARNING' },

  // Danger — red
  ABSENT:           { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  labelKey: 'enums:dayStatus.ABSENT' },
  INCOMPLETE:       { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  labelKey: 'enums:dayStatus.INCOMPLETE' },
  SUSPENDED:        { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  labelKey: 'enums:companyStatus.SUSPENDED' },
  CLOSED:           { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  labelKey: 'enums:companyStatus.CLOSED' },
  BLOCKED:          { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  labelKey: 'enums:userStatus.BLOCKED' },
  REJECTED:         { bg: colors.dangerLight,  text: colors.dangerText,  dot: colors.danger,  labelKey: 'enums:requestStatus.REJECTED' },

  // Info — blue
  PENDING:          { bg: colors.infoLight,    text: colors.infoText,    dot: colors.info,    labelKey: 'enums:requestStatus.PENDING' },
  APPROVED_ABSENCE: { bg: colors.infoLight,    text: colors.infoText,    dot: colors.info,    labelKey: 'enums:dayStatus.APPROVED_ABSENCE' },

  // Neutral — gray
  LEFT_EARLY:       { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, labelKey: 'enums:checkOutStatus.LEFT_EARLY' },
  EARLY_LEAVE:      { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, labelKey: 'enums:dayStatus.EARLY_LEAVE' },
  OVERTIME:         { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, labelKey: 'enums:dayStatus.OVERTIME' },
  MANUAL:           { bg: colors.neutralLight, text: colors.neutralText, dot: colors.neutral, labelKey: 'enums:dayStatus.MANUAL' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { t } = useTranslation('enums');
  const config = STATUS_MAP[status];

  const bg = config?.bg ?? colors.neutralLight;
  const textColor = config?.text ?? colors.neutralText;
  const dot = config?.dot ?? colors.neutral;
  const displayLabel = label ?? (config ? t(config.labelKey) : status);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.text, { color: textColor }]}>{displayLabel}</Text>
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

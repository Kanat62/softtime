import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Clock, LogIn, LogOut } from 'lucide-react-native';
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

function formatTime(date: Date | null): string {
  if (!date) return '--:--';
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

interface AttendanceCardProps {
  scheduleStart: string | null;
  scheduleEnd: string | null;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  isSuspended?: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function AttendanceCard({
  scheduleStart,
  scheduleEnd,
  checkInAt,
  checkOutAt,
  isSuspended = false,
  onCheckIn,
  onCheckOut,
}: AttendanceCardProps) {
  const hasCheckedIn = checkInAt !== null;
  const hasCheckedOut = checkOutAt !== null;

  const checkInActive = !isSuspended && !hasCheckedIn;
  const checkOutActive = !isSuspended && hasCheckedIn && !hasCheckedOut;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Clock size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text style={styles.title}>Посещаемость</Text>
      </View>

      {scheduleStart && scheduleEnd && (
        <Text style={styles.schedule}>График: {scheduleStart} – {scheduleEnd}</Text>
      )}

      <View style={styles.indicators}>
        <View style={styles.indicator}>
          <View style={[styles.indicatorBox, { backgroundColor: colors.successLight }]}>
            <LogIn size={iconSize.md} color={colors.successText} strokeWidth={iconStrokeWidth} />
            <View>
              <Text style={[styles.indicatorLabel, { color: colors.successText }]}>Приход</Text>
              <Text style={[styles.indicatorTime, { color: colors.successText }]}>
                {formatTime(checkInAt)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.indicator}>
          <View style={[styles.indicatorBox, { backgroundColor: colors.dangerLight }]}>
            <LogOut size={iconSize.md} color={colors.dangerText} strokeWidth={iconStrokeWidth} />
            <View>
              <Text style={[styles.indicatorLabel, { color: colors.dangerText }]}>Уход</Text>
              <Text style={[styles.indicatorTime, { color: colors.dangerText }]}>
                {formatTime(checkOutAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {isSuspended && (
        <Text style={styles.suspendedText}>Подписка не оплачена</Text>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnCheckIn, !checkInActive && styles.btnInactive]}
          onPress={onCheckIn}
          disabled={!checkInActive}
          activeOpacity={0.85}
        >
          <LogIn size={iconSize.md} color={colors.surface} strokeWidth={iconStrokeWidth} />
          <Text style={styles.btnText}>Приход</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btn,
            checkOutActive ? styles.btnCheckOutActive : styles.btnCheckOutInactive,
            !checkOutActive && styles.btnInactive,
          ]}
          onPress={onCheckOut}
          disabled={!checkOutActive}
          activeOpacity={0.85}
        >
          <LogOut
            size={iconSize.md}
            color={checkOutActive ? colors.surface : colors.dangerText}
            strokeWidth={iconStrokeWidth}
          />
          <Text style={[styles.btnText, !checkOutActive && styles.btnTextDanger]}>
            Уход
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[3],
    ...(shadows.card as object),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  title: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  schedule: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  indicators: {
    flexDirection: 'row',
    gap: space[2],
  },
  indicator: {
    flex: 1,
  },
  indicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderRadius: radius.md,
    padding: space[3],
  },
  indicatorLabel: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    lineHeight: 14,
  },
  indicatorTime: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  suspendedText: {
    ...typography.sm,
    color: colors.dangerText,
    textAlign: 'center',
    fontFamily: fontFamily.medium,
  },
  buttons: {
    flexDirection: 'row',
    gap: space[2],
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: 52,
    borderRadius: radius.md,
  },
  btnCheckIn: {
    backgroundColor: colors.success,
  },
  btnCheckOutActive: {
    backgroundColor: colors.primary,
  },
  btnCheckOutInactive: {
    backgroundColor: colors.dangerLight,
  },
  btnInactive: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: colors.surface,
  },
  btnTextDanger: {
    color: colors.dangerText,
  },
});

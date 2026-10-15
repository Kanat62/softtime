import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AlertTriangle, CheckCircle, Clock, LogOut } from 'lucide-react-native';
import { CheckInStatus, CheckOutStatus } from '@softtime/shared';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { Button } from '@/shared/ui';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import type { WorkerHomeStackParamList } from '@/shared/navigation/types';
import { formatWorkedDuration } from '@/shared/lib/date';
import i18n from '@/shared/i18n';

type ScanResultRoute = RouteProp<WorkerHomeStackParamList, 'ScanResult'>;

/**
 * Текст результата собирается из ДАННЫХ ответа (status + diffMinutes),
 * а не разбором русского `message` регуляркой. Поле `message` бэкенд
 * по-прежнему присылает, оно используется как запасной путь.
 *
 * У check-out бэкенд не возвращает diffMinutes, поэтому для LEFT_EARLY
 * и OVERTIME остаётся текст сервера.
 */
function buildResultText(
  type: 'checkIn' | 'checkOut',
  status: string,
  diffMinutes: number | undefined,
  message: string,
): string {
  if (type === 'checkIn') {
    if (status === CheckInStatus.ON_TIME) return i18n.t('attendance:result.onTime');
    if (diffMinutes !== undefined) {
      const minutes = Math.abs(diffMinutes);
      if (status === CheckInStatus.EARLY_ARRIVAL) {
        return i18n.t('attendance:result.earlyArrival', { count: minutes });
      }
      if (status === CheckInStatus.LATE) {
        return i18n.t('attendance:result.late', { count: minutes });
      }
    }
  } else if (status === CheckOutStatus.ON_TIME) {
    return i18n.t('attendance:result.leftOnTime');
  }

  // Запасной путь: показываем сообщение бэкенда как раньше.
  return message;
}

type ResultConfig = {
  icon: React.ReactNode;
  bgColor: string;
  titleColor: string;
};

function getCheckInConfig(status: string): ResultConfig {
  switch (status) {
    case CheckInStatus.LATE:
      return {
        icon: <AlertTriangle size={44} color={colors.warning} strokeWidth={iconStrokeWidth} />,
        bgColor: colors.warningLight,
        titleColor: colors.warningText,
      };
    case CheckInStatus.EARLY_ARRIVAL:
      return {
        icon: <Clock size={44} color={colors.primary} strokeWidth={iconStrokeWidth} />,
        bgColor: colors.primaryLight,
        titleColor: colors.primary,
      };
    default:
      return {
        icon: <CheckCircle size={44} color={colors.success} strokeWidth={iconStrokeWidth} />,
        bgColor: colors.successLight,
        titleColor: colors.successText,
      };
  }
}

function getCheckOutConfig(status: string): ResultConfig {
  switch (status) {
    case CheckOutStatus.LEFT_EARLY:
      return {
        icon: <AlertTriangle size={44} color={colors.warning} strokeWidth={iconStrokeWidth} />,
        bgColor: colors.warningLight,
        titleColor: colors.warningText,
      };
    case CheckOutStatus.OVERTIME:
      return {
        icon: <Clock size={44} color={colors.primary} strokeWidth={iconStrokeWidth} />,
        bgColor: colors.primaryLight,
        titleColor: colors.primary,
      };
    default:
      return {
        icon: <LogOut size={44} color={colors.success} strokeWidth={iconStrokeWidth} />,
        bgColor: colors.successLight,
        titleColor: colors.successText,
      };
  }
}

export function ScanResultScreen() {
  const { t } = useTranslation(['attendance', 'common']);
  const navigation = useWorkerNavigation();
  const route = useRoute<ScanResultRoute>();
  const { type, status, time, message, workedMinutes, diffMinutes } = route.params;

  const config =
    type === 'checkIn' ? getCheckInConfig(status) : getCheckOutConfig(status);

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.iconWrap,
            { backgroundColor: config.bgColor },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {config.icon}
        </Animated.View>

        <Text style={[styles.title, { color: config.titleColor }]}>{buildResultText(type, status, diffMinutes, message)}</Text>

        <Text style={styles.time}>{time}</Text>

        {type === 'checkOut' && workedMinutes != null && workedMinutes > 0 && (
          <View style={styles.workedRow}>
            <Text style={styles.workedLabel}>{t('attendance:result.worked')}</Text>
            <Text style={styles.workedValue}>{formatWorkedDuration(workedMinutes)}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          size="full"
          onPress={() => navigation.navigate('HomeScreen')}
        >
          {t('common:done')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[6],
    gap: space[4],
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  title: {
    ...typography['2xl'],
    textAlign: 'center',
  },
  time: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  workedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[5],
    marginTop: space[2],
  },
  workedLabel: {
    ...typography.base,
    color: colors.textSecondary,
  },
  workedValue: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
});

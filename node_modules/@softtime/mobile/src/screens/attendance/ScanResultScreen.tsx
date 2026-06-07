import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';
import { CheckInStatus } from '@softtime/shared';
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

type ScanResultRoute = RouteProp<WorkerHomeStackParamList, 'ScanResult'>;

// ─── Result config ────────────────────────────────────────────────────────────

type ResultConfig = {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  titleColor: string;
};

function getResultConfig(status: string): ResultConfig {
  switch (status) {
    case CheckInStatus.LATE:
      return {
        icon: (
          <AlertTriangle size={44} color={colors.warning} strokeWidth={iconStrokeWidth} />
        ),
        bgColor: colors.warningLight,
        title: 'Опоздание на 15 мин',
        titleColor: colors.warningText,
      };
    case CheckInStatus.EARLY_ARRIVAL:
      return {
        icon: (
          <Clock size={44} color={colors.primary} strokeWidth={iconStrokeWidth} />
        ),
        bgColor: colors.primaryLight,
        title: 'Пришли на 20 мин раньше',
        titleColor: colors.primary,
      };
    case CheckInStatus.ON_TIME:
    default:
      return {
        icon: (
          <CheckCircle size={44} color={colors.success} strokeWidth={iconStrokeWidth} />
        ),
        bgColor: colors.successLight,
        title: 'Приход отмечен ✓',
        titleColor: colors.successText,
      };
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ScanResultScreen() {
  const navigation = useWorkerNavigation();
  const route = useRoute<ScanResultRoute>();
  const { status, time } = route.params;
  const config = getResultConfig(status);

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

        <Text style={[styles.title, { color: config.titleColor }]}>
          {config.title}
        </Text>

        <Text style={styles.time}>{time}</Text>
      </View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          size="full"
          onPress={() => navigation.navigate('HomeScreen')}
        >
          Готово
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  footer: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
});

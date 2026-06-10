import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { Button } from '@/shared/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { tokenStorage } from '@/shared/storage/secure';
import { refreshTokensApi } from '@/entities/user/api/auth';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { UserStatus, UserRole } from '@softtime/shared';

const POLL_INTERVAL_MS = 10_000;

export function PendingScreen() {
  const { logout, setAuth } = useAuth();
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    async function checkStatus() {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken || cancelled.current) return;

      try {
        const tokens = await refreshTokensApi(refreshToken);
        if (cancelled.current) return;

        const payload = decodeJwtPayload(tokens.accessToken);
        if (!payload) return;

        if (payload.status === UserStatus.ACTIVE) {
          await setAuth({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            role: payload.role as UserRole,
            status: UserStatus.ACTIVE,
            companyStatus: null,
          });
        }
      } catch {
        // Network error or token expired — keep polling silently
      }
    }

    const interval = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled.current = true;
      clearInterval(interval);
    };
  }, [setAuth]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.clockWrap}>
          <Clock size={40} color={colors.warning} strokeWidth={iconStrokeWidth} />
        </View>
        <Text style={styles.title}>Заявка отправлена</Text>
        <Text style={styles.subtitle}>Ждите подтверждения администратора</Text>
        <View style={styles.pollingRow}>
          <ActivityIndicator size="small" color={colors.textDisabled} />
          <Text style={styles.pollingText}>Проверяем статус...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button variant="ghost" size="full" onPress={logout}>
          Выйти
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
    gap: space[3],
  },
  clockWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  title: {
    ...typography['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pollingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[2],
  },
  pollingText: {
    ...typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.textDisabled,
  },
  footer: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
});

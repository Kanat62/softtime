import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
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

const POLL_INTERVAL_MS = 5000;

export function PendingScreen() {
  const { logout, setAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [notApprovedYet, setNotApprovedYet] = useState(false);
  const checkingRef = useRef(false);

  async function checkStatus() {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setIsChecking(true);
    setNotApprovedYet(false);

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return;

      const tokens = await refreshTokensApi(refreshToken);
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

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
      } else {
        setNotApprovedYet(true);
      }
    } catch {
      setNotApprovedYet(true);
    } finally {
      setIsChecking(false);
      checkingRef.current = false;
    }
  }

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.clockWrap}>
          <Clock size={40} color={colors.warning} strokeWidth={iconStrokeWidth} />
        </View>
        <Text style={styles.title}>Заявка отправлена</Text>
        <Text style={styles.subtitle}>
          Ожидайте подтверждения администратора.{'\n'}
          Вход произойдёт автоматически после одобрения.
        </Text>

        <View style={styles.autoCheck}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.autoCheckText}>
            {isChecking ? 'Проверяем статус...' : 'Проверка каждые 5 сек'}
          </Text>
        </View>

        {notApprovedYet && (
          <Text style={styles.notApproved}>Заявка ещё не одобрена</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          size="full"
          onPress={checkStatus}
          disabled={isChecking}
        >
          {isChecking ? 'Проверяем...' : 'Обновить сейчас'}
        </Button>
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
    lineHeight: 22,
  },
  autoCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[2],
  },
  autoCheckText: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  notApproved: {
    ...typography.sm,
    fontFamily: fontFamily.medium,
    color: colors.danger,
    textAlign: 'center',
    marginTop: space[1],
  },
  footer: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
    gap: space[2],
  },
});

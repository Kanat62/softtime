import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, typography } from '@/shared/config/theme';
import { useAuthNavigation } from '@/shared/navigation/hooks';
import { useAuth } from '@/app/providers/AuthProvider';
import { tokenStorage } from '@/shared/storage/secure';
import { refreshTokensApi } from '@/entities/user/api/auth';
import { getMyCompanyApi } from '@/entities/user/api/auth';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { UserRole, CompanyStatus } from '@softtime/shared';

export function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const navigation = useAuthNavigation();
  const { setAuth } = useAuth();

  useEffect(() => {
    let cancelled = false;

    // Animation runs in parallel with the refresh attempt.
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    async function tryRefresh(): Promise<boolean> {
      const storedRefresh = await tokenStorage.getRefreshToken();
      if (!storedRefresh) return false;

      try {
        const tokens = await refreshTokensApi(storedRefresh);
        const payload = decodeJwtPayload(tokens.accessToken);
        if (!payload) return false;

        let resolvedCompanyStatus: CompanyStatus | null = null;
        if (payload.role === UserRole.ADMIN) {
          try {
            const company = await getMyCompanyApi(tokens.accessToken);
            resolvedCompanyStatus = company.status as CompanyStatus;
          } catch {
            // Company fetch failed — proceed without company status
          }
        }

        await setAuth({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          role: payload.role as UserRole,
          status: payload.status as any,
          companyStatus: resolvedCompanyStatus,
        });
        return true;
      } catch {
        return false;
      }
    }

    async function run() {
      const authSucceeded = await tryRefresh();

      if (cancelled) return;

      if (!authSucceeded) {
        // No valid session → show onboarding.
        navigation.replace('Onboarding');
      }
      // If authSucceeded, setAuth() was called above.
      // RootNavigator's conditional rendering handles the transition automatically.
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.logo}>SoftTime</Text>
        <Text style={styles.tagline}>Учёт рабочего времени</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 38,
    fontFamily: fontFamily.bold,
    color: colors.surface,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.sm,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.72)',
  },
});

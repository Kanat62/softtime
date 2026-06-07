import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller } from 'react-hook-form';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  space,
  typography,
} from '@/shared/config/theme';
import { Button, Input } from '@/shared/ui';
import { useAuthNavigation } from '@/shared/navigation/hooks';
import { useLogin } from '@/features/auth/login/model/useLogin';

export function LoginScreen() {
  const navigation = useAuthNavigation();
  const { form, onSubmit, isLoading, serverError } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    formState: { errors },
  } = form;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.logo}>SoftTime</Text>
            <Text style={styles.title}>Войти</Text>
          </View>

          <View style={styles.form}>
            {serverError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="worker@test.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  leftIcon={
                    <Mail
                      size={iconSize.md}
                      color={colors.textSecondary}
                      strokeWidth={iconStrokeWidth}
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Пароль"
                  placeholder="Минимум 8 символов"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={
                    <Lock
                      size={iconSize.md}
                      color={colors.textSecondary}
                      strokeWidth={iconStrokeWidth}
                    />
                  }
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {showPassword ? (
                        <EyeOff
                          size={iconSize.md}
                          color={colors.textSecondary}
                          strokeWidth={iconStrokeWidth}
                        />
                      ) : (
                        <Eye
                          size={iconSize.md}
                          color={colors.textSecondary}
                          strokeWidth={iconStrokeWidth}
                        />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Button
              variant="primary"
              size="full"
              loading={isLoading}
              onPress={onSubmit}
            >
              Войти
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Нет аккаунта?{'  '}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoleSelect')}>
              <Text style={styles.footerLink}>Зарегистрироваться</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space[4],
    paddingBottom: space[6],
    justifyContent: 'center',
    gap: space[6],
  },
  hero: {
    alignItems: 'center',
    gap: space[2],
    paddingTop: space[8],
  },
  logo: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  title: {
    ...typography['2xl'],
    color: colors.textPrimary,
  },
  form: {
    gap: space[4],
  },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  errorBannerText: {
    ...typography.sm,
    color: colors.dangerText,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: space[4],
  },
  footerText: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
});

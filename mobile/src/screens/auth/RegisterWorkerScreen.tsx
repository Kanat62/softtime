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
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Hash,
  Lock,
  Mail,
  User,
} from 'lucide-react-native';
import {
  colors,
  iconSize,
  iconStrokeWidth,
  space,
  typography,
} from '@/shared/config/theme';
import { Button, Input } from '@/shared/ui';
import { useAuthNavigation } from '@/shared/navigation/hooks';
import { useRegisterWorker } from '@/features/auth/register-worker/model/useRegisterWorker';

export function RegisterWorkerScreen() {
  const navigation = useAuthNavigation();
  const { form, onSubmit, isLoading, serverError } = useRegisterWorker();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    formState: { errors },
  } = form;

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Регистрация</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {serverError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            )}
            {/* ФИО */}
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="ФИО"
                  placeholder="Иванов Иван Иванович"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                  leftIcon={
                    <User
                      size={iconSize.md}
                      color={colors.textSecondary}
                      strokeWidth={iconStrokeWidth}
                    />
                  }
                />
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="worker@company.com"
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

            {/* Пароль */}
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

            {/* Код компании */}
            <Controller
              control={control}
              name="companyCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Код компании"
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                  onBlur={onBlur}
                  error={errors.companyCode?.message}
                  leftIcon={
                    <Hash
                      size={iconSize.md}
                      color={colors.textSecondary}
                      strokeWidth={iconStrokeWidth}
                    />
                  }
                />
              )}
            />

            <Button variant="primary" size="full" loading={isLoading} onPress={onSubmit}>
              Зарегистрироваться
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },

  // Top bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    ...typography.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Form
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[6],
  },
  form: {
    gap: space[4],
  },

  // Error banner
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

});

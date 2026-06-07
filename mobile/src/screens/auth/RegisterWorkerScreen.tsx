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
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react-native';
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { Button, Input, OtpInput } from '@/shared/ui';
import { useAuthNavigation } from '@/shared/navigation/hooks';
import { useRegisterWorker } from '@/features/auth/register-worker/model/useRegisterWorker';

export function RegisterWorkerScreen() {
  const navigation = useAuthNavigation();
  const { form, onSubmit, isLoading, submittedEmail } = useRegisterWorker();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    formState: { errors },
  } = form;

  if (submittedEmail) {
    return <PendingView email={submittedEmail} />;
  }

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
              render={({ field: { onChange, value } }) => (
                <OtpInput
                  label="Код компании"
                  value={value}
                  onChange={onChange}
                  error={errors.companyCode?.message}
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

// ─── Pending view (inline после отправки) ─────────────────────────────────────

function PendingView({ email }: { email: string }) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.pendingContainer}>
        <View style={styles.clockWrap}>
          <Clock size={40} color={colors.warning} strokeWidth={iconStrokeWidth} />
        </View>
        <Text style={styles.pendingTitle}>Заявка отправлена</Text>
        <Text style={styles.pendingSubtitle}>
          Ждите подтверждения администратора
        </Text>
        <Text style={styles.pendingEmail}>{email}</Text>
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

  // Pending
  pendingContainer: {
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
  pendingTitle: {
    ...typography['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pendingSubtitle: {
    ...typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pendingEmail: {
    ...typography.sm,
    fontFamily: fontFamily.medium,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: space[1],
  },
});

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
  Building2,
  Check,
  ChevronLeft,
  Copy,
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
import { Button, Input } from '@/shared/ui';
import { useAuthNavigation } from '@/shared/navigation/hooks';
import { useRegisterAdmin } from '@/features/auth/register-admin/model/useRegisterAdmin';

export function RegisterAdminScreen() {
  const navigation = useAuthNavigation();
  const { form, onSubmit, isLoading, companyCode, serverError } = useRegisterAdmin();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    control,
    formState: { errors },
  } = form;

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (companyCode) {
    return <SuccessView code={companyCode} copied={copied} onCopy={handleCopy} onLogin={() => navigation.navigate('Login')} />;
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
        <Text style={styles.topBarTitle}>Создать компанию</Text>
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
            {/* Название компании */}
            <Controller
              control={control}
              name="companyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Название компании"
                  placeholder="ООО «Моя компания»"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.companyName?.message}
                  leftIcon={
                    <Building2
                      size={iconSize.md}
                      color={colors.textSecondary}
                      strokeWidth={iconStrokeWidth}
                    />
                  }
                />
              )}
            />

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
                  placeholder="admin@company.com"
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

            <Button variant="primary" size="full" loading={isLoading} onPress={onSubmit}>
              Создать
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────

interface SuccessViewProps {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onLogin: () => void;
}

function SuccessView({ code, copied, onCopy, onLogin }: SuccessViewProps) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.successContainer}>
        {/* Icon */}
        <View style={styles.successIconWrap}>
          <Building2 size={40} color={colors.primary} strokeWidth={iconStrokeWidth} />
        </View>

        {/* Title */}
        <Text style={styles.successTitle}>Компания создана!</Text>
        <Text style={styles.successSubtitle}>Код для сотрудников</Text>

        {/* Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeText}>{code}</Text>
        </View>

        {/* Copy button */}
        <TouchableOpacity style={styles.copyBtn} onPress={onCopy} activeOpacity={0.8}>
          {copied ? (
            <Check size={iconSize.md} color={colors.success} strokeWidth={iconStrokeWidth} />
          ) : (
            <Copy size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
          )}
          <Text style={[styles.copyBtnText, copied && styles.copyBtnTextCopied]}>
            {copied ? 'Скопировано!' : 'Скопировать код'}
          </Text>
        </TouchableOpacity>

        {/* Hint */}
        <Text style={styles.hint}>
          Передайте код сотрудникам для регистрации
        </Text>
      </View>

      {/* Login button pinned to bottom */}
      <View style={styles.successFooter}>
        <Button variant="primary" size="full" onPress={onLogin}>
          Войти
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

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[6],
    gap: space[4],
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  successTitle: {
    ...typography['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: space[5],
    paddingHorizontal: space[8],
    marginVertical: space[2],
  },
  codeText: {
    fontSize: 36,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    letterSpacing: 8,
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[4],
  },
  copyBtnText: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  copyBtnTextCopied: {
    color: colors.success,
  },
  hint: {
    ...typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: space[4],
  },
  successFooter: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
});

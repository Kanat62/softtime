import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { deleteMyAccountApi } from '@/entities/user/api/profile';
import { useAuth } from '@/app/providers/AuthProvider';
import { ErrorCode } from '@softtime/shared';
import type { AppError } from '@/shared/api/errors';
import { Button, Input } from '@/shared/ui';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  radius,
  space,
  typography,
} from '@/shared/config/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Удаление аккаунта: предупреждение, пароль, подтверждение.
 *
 * Ошибки приходят уже переведёнными: normalizeError подставляет текст по
 * машинному коду (errors:CURRENT_PASSWORD_INVALID, errors:LAST_ADMIN_CANNOT_DELETE
 * и т.д.), поэтому здесь достаточно показать err.message.
 * После успеха — обычный logout: очистит токены и вернёт на экран входа.
 */
export function DeleteAccountModal({ visible, onClose }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // 'password' — обычное удаление; 'closeCompany' — второй шаг для единственного
  // админа: сервер ответил LAST_ADMIN_CANNOT_DELETE, нужно отдельное подтверждение.
  const [step, setStep] = useState<'password' | 'closeCompany'>('password');

  function close() {
    if (loading) return;
    setPassword('');
    setError(null);
    setStep('password');
    onClose();
  }

  async function confirm() {
    const closing = step === 'closeCompany';
    if (!password) {
      // Ключ словаря validation: Input сам переведёт его через i18n.exists.
      setError('validation:required.password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await deleteMyAccountApi(password, closing);
      // Аккаунта больше нет: выходим. logout глотает ошибки сети/401.
      await logout();
    } catch (e) {
      const err = e as Partial<AppError>;
      setLoading(false);
      if (!closing && err.code === ErrorCode.LAST_ADMIN_CANNOT_DELETE) {
        // Пароль уже проверен сервером (проверка идёт до этой ошибки).
        // Просим отдельное подтверждение и только потом шлём closeCompany: true.
        setStep('closeCompany');
        return;
      }
      setError(err.message || t('common:error'));
    }
  }

  function backToPassword() {
    if (loading) return;
    setStep('password');
    setError(null);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={close}>
          <TouchableOpacity activeOpacity={1} style={styles.modal}>
            {step === 'password' ? (
              <>
                <View style={styles.iconRow}>
                  <View style={styles.iconBg}>
                    <Trash2 size={24} color={colors.danger} strokeWidth={iconStrokeWidth} />
                  </View>
                </View>

                <Text style={styles.title}>{t('profile:deleteAccount.title')}</Text>
                <Text style={styles.warning}>{t('profile:deleteAccount.warning')}</Text>
                <Text style={styles.details}>{t('profile:deleteAccount.details')}</Text>

                <Input
                  label={t('profile:deleteAccount.passwordLabel')}
                  placeholder={t('profile:deleteAccount.passwordPlaceholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  error={error ?? undefined}
                />

                <View style={styles.buttons}>
                  <Button variant="outline" size="full" onPress={close} disabled={loading}>
                    {t('common:cancel')}
                  </Button>
                  <Button variant="danger" size="full" onPress={confirm} loading={loading}>
                    {t('profile:deleteAccount.confirm')}
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View style={styles.iconRow}>
                  <View style={styles.iconBg}>
                    <TriangleAlert size={24} color={colors.danger} strokeWidth={iconStrokeWidth} />
                  </View>
                </View>

                <Text style={styles.title}>{t('profile:deleteAccount.closeTitle')}</Text>
                {/* Жирное предупреждение: удаление закрывает всю компанию */}
                <Text style={styles.closeWarning}>{t('profile:deleteAccount.closeWarning')}</Text>
                <Text style={styles.details}>{t('profile:deleteAccount.closeDetails')}</Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.buttons}>
                  <Button variant="outline" size="full" onPress={backToPassword} disabled={loading}>
                    {t('profile:deleteAccount.back')}
                  </Button>
                  <Button variant="danger" size="full" onPress={confirm} loading={loading}>
                    {t('profile:deleteAccount.closeConfirm')}
                  </Button>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'center',
    padding: space[4],
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[5],
    gap: space[3],
  },
  iconRow: { alignItems: 'center' },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  warning: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.dangerText,
    textAlign: 'center',
  },
  closeWarning: {
    ...typography.base,
    fontFamily: fontFamily.bold,
    color: colors.dangerText,
    textAlign: 'center',
  },
  errorText: {
    ...typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.danger,
    textAlign: 'center',
  },
  details: {
    ...typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  buttons: { gap: space[2], marginTop: space[2] },
});

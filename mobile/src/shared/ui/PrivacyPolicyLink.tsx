import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { openPrivacyPolicy, privacyPolicyUrl } from '@/shared/lib/privacy';
import { colors, fontFamily, space, typography } from '@/shared/config/theme';

/**
 * Ссылка на политику конфиденциальности.
 *
 *  - variant="link"   — отдельная ссылка (экран входа);
 *  - variant="notice" — «Регистрируясь, вы принимаете Политику
 *    конфиденциальности» под кнопкой регистрации. Чекбокса нет намеренно:
 *    Terms of Service ещё не готовы, это только уведомление.
 *
 * Если адрес веб-панели не задан (EXPO_PUBLIC_WEB_PANEL_URL), компонент не
 * рендерится — показывать неработающую ссылку хуже, чем не показывать её.
 */
export function PrivacyPolicyLink({ variant = 'link' }: { variant?: 'link' | 'notice' }) {
  const { t } = useTranslation(['common', 'auth']);
  if (!privacyPolicyUrl()) return null;

  if (variant === 'notice') {
    return (
      <Text style={styles.notice}>
        {t('auth:register.privacyNotice')}{' '}
        <Text style={styles.noticeLink} onPress={() => void openPrivacyPolicy()}>
          {t('auth:register.privacyNoticeLink')}
        </Text>
      </Text>
    );
  }

  return (
    <View style={styles.linkWrap}>
      <TouchableOpacity onPress={() => void openPrivacyPolicy()} activeOpacity={0.7}>
        <Text style={styles.link}>{t('common:privacyPolicy')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...typography.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space[2],
  },
  noticeLink: {
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  linkWrap: {
    alignItems: 'center',
    paddingBottom: space[4],
  },
  link: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
});

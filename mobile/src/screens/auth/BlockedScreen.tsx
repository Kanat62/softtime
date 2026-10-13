import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, typography } from '@/shared/config/theme';

export function BlockedScreen() {
  const { t } = useTranslation('auth');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>BlockedScreen</Text>
      <Text style={styles.sub}>{t('auth:blocked.subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  text: { ...typography.xl, color: colors.danger, fontFamily: fontFamily.bold },
  sub: { ...typography.base, color: colors.textSecondary, marginTop: 8, fontFamily: fontFamily.regular },
});

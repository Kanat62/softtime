import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, typography } from '@/shared/config/theme';

export function BlockedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>BlockedScreen</Text>
      <Text style={styles.sub}>Доступ заблокирован</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  text: { ...typography.xl, color: colors.danger, fontFamily: fontFamily.bold },
  sub: { ...typography.base, color: colors.textSecondary, marginTop: 8, fontFamily: fontFamily.regular },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import {
  colors,
  iconStrokeWidth,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { Button } from '@/shared/ui';
import { useAuth } from '@/app/providers/AuthProvider';

export function PendingScreen() {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.clockWrap}>
          <Clock size={40} color={colors.warning} strokeWidth={iconStrokeWidth} />
        </View>
        <Text style={styles.title}>Заявка отправлена</Text>
        <Text style={styles.subtitle}>Ждите подтверждения администратора</Text>
      </View>

      <View style={styles.footer}>
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
  },
  footer: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
});

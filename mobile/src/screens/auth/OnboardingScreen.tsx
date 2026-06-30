import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, space, typography } from '@/shared/config/theme';
import { Button } from '@/shared/ui';
import { useAuthNavigation } from '@/shared/navigation/hooks';

export function OnboardingScreen() {
  const navigation = useAuthNavigation();

  return (
    <SafeAreaView style={styles.root}>
      {/* Logo + слоган — занимают всё свободное пространство по центру */}
      <View style={styles.hero}>
        <Text style={styles.logo}>SoftTime</Text>
        <Text style={styles.slogan}>
          Умный учёт рабочего времени{'\n'}для вашей команды
        </Text>
      </View>

      {/* Кнопки — прикреплены ко дну */}
      <View style={styles.actions}>
        <Button
          variant="primary"
          size="full"
          onPress={() => navigation.navigate('Login')}
        >
          Войти
        </Button>
        <Button
          variant="outline"
          size="full"
          onPress={() => navigation.navigate('RoleSelect')}
        >
          Зарегистрироваться
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
  },
  logo: {
    fontSize: 40,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    letterSpacing: -1,
  },
  slogan: {
    ...typography.base,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: space[3],
  },
});

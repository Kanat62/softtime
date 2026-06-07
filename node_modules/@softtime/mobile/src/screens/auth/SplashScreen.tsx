import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, typography } from '@/shared/config/theme';
import { useAuthNavigation } from '@/shared/navigation/hooks';

export function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const navigation = useAuthNavigation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Onboarding'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.logo}>SoftTime</Text>
        <Text style={styles.tagline}>Учёт рабочего времени</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 38,
    fontFamily: fontFamily.bold,
    color: colors.surface,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.sm,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.72)',
  },
});

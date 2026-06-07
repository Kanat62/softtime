import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
  type ViewProps,
} from 'react-native';
import { colors, radius, shadows, space } from '../config/theme';

interface CardProps extends ViewProps {
  padding?: number;
  children: React.ReactNode;
}

interface PressableCardProps extends TouchableOpacityProps {
  padding?: number;
  children: React.ReactNode;
}

export function Card({ padding = space[4], children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

export function PressableCard({ padding = space[4], children, style, ...props }: PressableCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.card, { padding }, style]} {...props}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
});

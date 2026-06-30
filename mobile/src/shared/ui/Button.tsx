import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { colors, fontFamily, radius, typography } from '../config/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-outline';
type Size = 'sm' | 'md' | 'lg' | 'full';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: object; text: object; spinner: string }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.surface },
    spinner: colors.surface,
  },
  secondary: {
    container: { backgroundColor: colors.primaryLight },
    text: { color: colors.primary },
    spinner: colors.primary,
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
    text: { color: colors.primary },
    spinner: colors.primary,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.textSecondary },
    spinner: colors.textSecondary,
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: colors.surface },
    spinner: colors.surface,
  },
  'danger-outline': {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
    text: { color: colors.danger },
    spinner: colors.danger,
  },
};

const sizeStyles: Record<Size, { container: object; text: object; borderRadius: number }> = {
  sm: {
    container: { height: 36, paddingHorizontal: 16 },
    text: { ...typography.sm, fontFamily: fontFamily.medium },
    borderRadius: radius.sm,
  },
  md: {
    container: { height: 48, paddingHorizontal: 20 },
    text: { ...typography.base, fontFamily: fontFamily.semiBold },
    borderRadius: radius.md,
  },
  lg: {
    container: { height: 56, paddingHorizontal: 24 },
    text: { ...typography.lg, fontFamily: fontFamily.semiBold },
    borderRadius: radius.md,
  },
  full: {
    container: { height: 56, paddingHorizontal: 24, width: '100%' },
    text: { ...typography.base, fontFamily: fontFamily.semiBold },
    borderRadius: radius.md,
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[
        styles.base,
        { borderRadius: ss.borderRadius },
        ss.container,
        vs.container,
        isDisabled && styles.disabled,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.spinner} />
      ) : (
        <Text style={[styles.baseText, ss.text, vs.text]} numberOfLines={1}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});

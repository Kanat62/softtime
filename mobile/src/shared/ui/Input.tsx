import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { colors, fontFamily, radius, typography } from '../config/theme';

/**
 * Сообщения zod бывают двух видов: ключ словаря ('validation:format.email')
 * или готовый текст (дефолт zod, либо уже переведённый бэкендом message).
 * Переводим ТОЛЬКО то, что реально есть в словарях — иначе i18next примет
 * ':' за разделитель namespace и обрежет строку
 * ('Формат даты: YYYY-MM-DD' -> ' YYYY-MM-DD').
 *
 * Делается здесь, в одном месте: все формы выводят ошибку через этот prop.
 */
function useErrorText(error?: string): string | undefined {
  const { t, i18n } = useTranslation();
  if (!error) return undefined;
  return i18n.exists(error) ? t(error) : error;
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, rightIcon, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const errorText = useErrorText(error);

  const borderColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : colors.borderStrong;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, { borderColor }]}>
        {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            style,
          ]}
          placeholderTextColor={colors.textDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconWrap}>{rightIcon}</View>}
      </View>
      {errorText && <Text style={styles.error}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    ...typography.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  inputRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  iconWrap: {
    paddingLeft: 12,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
    fontSize: typography.base.fontSize,
    lineHeight: undefined,
  },
  inputWithIcon: {
    paddingLeft: 4,
  },
  inputWithRightIcon: {
    paddingRight: 4,
  },
  rightIconWrap: {
    paddingRight: 12,
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    ...typography.xs,
    color: colors.danger,
    marginTop: 2,
  },
});

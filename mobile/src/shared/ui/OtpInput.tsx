import React, { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { colors, fontFamily, radius, typography } from '../config/theme';

const CELL_COUNT = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

export function OtpInput({ value, onChange, error, label }: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const cells = Array.from({ length: CELL_COUNT }, (_, i) => value[i] ?? '');

  const buildChars = () =>
    Array.from({ length: CELL_COUNT }, (_, i) => value[i] ?? '');

  const moveFocus = (index: number) =>
    setTimeout(() => inputRefs.current[index]?.focus(), 0);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (cleaned === '') {
      // Android fires onChangeText('') on backspace — handle it here
      const chars = buildChars();
      if (chars[index]) {
        chars[index] = '';
        onChange(chars.join(''));
      } else if (index > 0) {
        chars[index - 1] = '';
        onChange(chars.join(''));
        moveFocus(index - 1);
      }
      return;
    }

    // Take the last char (handles Android sending old+new char at once)
    const char = cleaned.slice(-1);
    const chars = buildChars();
    chars[index] = char;
    onChange(chars.join(''));

    if (index < CELL_COUNT - 1) {
      moveFocus(index + 1);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    // iOS: onKeyPress('Backspace') is reliable; Android handled in onChangeText
    if (e.nativeEvent.key === 'Backspace' && !cells[index] && index > 0) {
      const chars = buildChars();
      chars[index - 1] = '';
      onChange(chars.join(''));
      moveFocus(index - 1);
    }
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {cells.map((char, index) => {
          const isFocused = focusedIndex === index;
          const hasError = !!error;
          const borderColor = hasError
            ? colors.danger
            : isFocused
            ? colors.primary
            : colors.borderStrong;

          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.cell, { borderColor }]}
              value={char}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              maxLength={2}
              autoCapitalize="characters"
              keyboardType="default"
              selectTextOnFocus
              caretHidden
              accessibilityLabel={`Символ ${index + 1} из ${CELL_COUNT}`}
            />
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: typography.lg.fontSize,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  error: {
    ...typography.xs,
    color: colors.danger,
    marginTop: 2,
  },
});

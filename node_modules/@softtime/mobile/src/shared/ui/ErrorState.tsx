import { XCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, iconStrokeWidth, space, typography } from '../config/theme';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Что-то пошло не так',
  description = 'Не удалось загрузить данные. Проверьте соединение.',
  onRetry,
  retryLabel = 'Повторить',
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <XCircle size={48} color={colors.danger} strokeWidth={iconStrokeWidth} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onRetry && (
        <Button variant="outline" size="md" onPress={onRetry} style={styles.button}>
          {retryLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    gap: space[3],
  },
  title: {
    ...typography.baseMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: space[2],
  },
});

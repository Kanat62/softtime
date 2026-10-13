import { XCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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
  title,
  description,
  onRetry,
  retryLabel,
}: ErrorStateProps) {
  const { t } = useTranslation('common');
  return (
    <View style={styles.container}>
      <XCircle size={48} color={colors.danger} strokeWidth={iconStrokeWidth} />
      <Text style={styles.title}>{title ?? t('common:state.errorTitle')}</Text>
      <Text style={styles.description}>{description ?? t('common:state.errorDescription')}</Text>
      {onRetry && (
        <Button variant="outline" size="md" onPress={onRetry} style={styles.button}>
          {retryLabel ?? t('common:retry')}
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

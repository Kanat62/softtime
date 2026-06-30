import { FileText } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, iconStrokeWidth, space, typography } from '../config/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        {icon ?? (
          <FileText
            size={48}
            color={colors.textDisabled}
            strokeWidth={iconStrokeWidth}
          />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onPress={onAction} style={styles.button}>
          {actionLabel}
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
  iconWrap: {
    marginBottom: space[2],
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

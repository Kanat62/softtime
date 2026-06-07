import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, typography } from '../config/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  const palette = [
    '#1877F2', '#22C55E', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  ];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const fontSize = Math.round(size * 0.38);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize, lineHeight: size, fontFamily: fontFamily.semiBold },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.surface,
    textAlign: 'center',
  },
});

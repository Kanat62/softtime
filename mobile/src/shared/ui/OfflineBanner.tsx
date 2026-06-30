import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WifiOff, Clock } from 'lucide-react-native';
import { useIsOnline } from '@/shared/lib/network';
import { colors, iconStrokeWidth, space, typography } from '@/shared/config/theme';

interface OfflineBannerProps {
  /**
   * "block" — red banner for screens with mutations.
   *           "Нет подключения к интернету"
   * "stale" — amber banner for read-only screens.
   *           "Данные могли устареть"
   */
  variant?: 'block' | 'stale';
}

export function OfflineBanner({ variant = 'block' }: OfflineBannerProps) {
  const isOnline = useIsOnline();
  if (isOnline) return null;

  const isBlock = variant === 'block';

  return (
    <View style={[s.banner, isBlock ? s.bannerBlock : s.bannerStale]}>
      {isBlock ? (
        <WifiOff size={14} color={colors.dangerText} strokeWidth={iconStrokeWidth} />
      ) : (
        <Clock size={14} color={colors.warningText} strokeWidth={iconStrokeWidth} />
      )}
      <Text style={[s.text, isBlock ? s.textBlock : s.textStale]}>
        {isBlock ? 'Нет подключения к интернету' : 'Данные могли устареть'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[4],
  },
  bannerBlock: {
    backgroundColor: colors.dangerLight,
  },
  bannerStale: {
    backgroundColor: colors.warningLight,
  },
  text: {
    ...typography.sm,
  },
  textBlock: {
    color: colors.dangerText,
  },
  textStale: {
    color: colors.warningText,
  },
});

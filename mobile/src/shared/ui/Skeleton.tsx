import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius } from '../config/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.base,
        { width: width as any, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  gap?: number;
}

export function SkeletonGroup({ children, gap = 8 }: SkeletonGroupProps) {
  return <View style={{ gap }}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  shimmer: {
    width: '60%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    opacity: 0.8,
  },
});

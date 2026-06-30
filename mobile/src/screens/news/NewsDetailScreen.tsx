import React, { useEffect, useRef } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Check, ChevronLeft } from 'lucide-react-native';
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  layout,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { ErrorState, OfflineBanner, Skeleton } from '@/shared/ui';
import type { NewsStackParamList } from '@/shared/navigation/types';
import { useNewsDetail } from '@/features/news/detail/model/useNewsDetail';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function formatFullDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function NewsDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute<RouteProp<NewsStackParamList, 'NewsDetail'>>();
  const { id }     = route.params;

  const { item, isLoading, isError, refetch } = useNewsDetail(id);

  const readOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!item) return;
    const timer = setTimeout(() => {
      Animated.timing(readOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1000);
    return () => clearTimeout(timer);
  }, [item, readOpacity]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Новость</Text>
        <View style={styles.backBtn} />
      </View>
      <OfflineBanner variant="stale" />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <DetailSkeleton />
        </ScrollView>
      ) : item ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.newsBadge}>
              <Text style={styles.newsBadgeText}>Новость</Text>
            </View>
            <Text style={styles.metaDate}>{formatFullDate(item.createdAt)}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.divider} />

          <Text style={styles.body}>{item.body}</Text>

          {/* Read badge — fades in after 1 second */}
          <Animated.View style={{ opacity: readOpacity, alignSelf: 'flex-start' }}>
            <View style={styles.readBadge}>
              <Check
                size={iconSize.sm}
                color={colors.success}
                strokeWidth={iconStrokeWidth}
              />
              <Text style={styles.readBadgeText}>Отмечено как прочитанное</Text>
            </View>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Detail skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <View style={{ gap: space[4] }}>
      <View style={[styles.metaRow]}>
        <Skeleton width={60} height={22} borderRadius={11} />
        <Skeleton width={100} height={12} />
      </View>
      <Skeleton width="80%" height={26} />
      <View style={styles.divider} />
      <View style={{ gap: space[3] }}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="95%" height={14} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    ...typography.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[4],
    gap: space[4],
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
  },
  newsBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  metaDate: {
    ...typography.sm,
    color: colors.textSecondary,
  },

  title: {
    ...typography['2xl'],
    color: colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },

  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
  },
  readBadgeText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: colors.successText,
  },

  bottomSpacer: {
    height: space[8],
  },
});

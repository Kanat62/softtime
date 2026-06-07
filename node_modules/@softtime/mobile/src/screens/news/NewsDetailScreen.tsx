import React, { useEffect, useRef } from 'react';
import {
  Animated,
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
import { EmptyState } from '@/shared/ui';
import { currentMockNews } from '@/entities/news';
import type { NewsStackParamList } from '@/shared/navigation/types';

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

  const item = currentMockNews.find((n) => n.id === id) ?? null;

  const readOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(readOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1000);
    return () => clearTimeout(timer);
  }, [readOpacity]);

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

      {/* Content */}
      {item ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.newsBadge}>
              <Text style={styles.newsBadgeText}>Новость</Text>
            </View>
            <Text style={styles.metaDate}>{formatFullDate(item.createdAt)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Body */}
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
      ) : (
        <EmptyState
          title="Новость не найдена"
          description="Возможно, она была удалена"
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Top bar
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

  // Content
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[4],
    gap: space[4],
  },

  // Meta row
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

  // Title
  title: {
    ...typography['2xl'],
    color: colors.textPrimary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Body
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },

  // Read badge
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

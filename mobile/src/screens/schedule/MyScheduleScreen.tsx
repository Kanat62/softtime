import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import {
  colors,
  iconStrokeWidth,
  layout,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { ErrorState, OfflineBanner, Skeleton } from '@/shared/ui';
import { ScheduleWeek } from '@/widgets/schedule-week/ScheduleWeek';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import { useMySchedule } from '@/features/schedule/model/useMySchedule';

export function MyScheduleScreen() {
  const navigation = useWorkerNavigation();
  const { schedule, isLoading, isError, refetch } = useMySchedule();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <Text style={styles.title}>Мой график</Text>
        <View style={styles.backBtn} />
      </View>
      <OfflineBanner variant="stale" />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
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
          {isLoading ? (
            <ScheduleSkeleton />
          ) : schedule ? (
            <ScheduleWeek schedule={schedule} />
          ) : null}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ScheduleSkeleton() {
  return (
    <View style={styles.skeletonRoot}>
      {/* Hero card */}
      <View style={styles.skeletonHero}>
        <View style={{ gap: space[2] }}>
          <Skeleton width={100} height={12} />
          <Skeleton width={120} height={34} />
          <Skeleton width={160} height={14} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Day cards */}
      {([0, 1, 2, 3, 4, 5, 6] as const).map((i) => (
        <View key={i} style={styles.skeletonDayCard}>
          <Skeleton width={38} height={38} borderRadius={19} />
          <View style={{ flex: 1, gap: space[2] }}>
            <Skeleton width={100} height={14} />
            <Skeleton width={70} height={12} />
          </View>
          <Skeleton width={40} height={12} />
        </View>
      ))}
    </View>
  );
}

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
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    ...typography.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[3],
  },
  bottomSpacer: {
    height: space[8],
  },
  skeletonRoot: {
    gap: space[3],
  },
  skeletonHero: {
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    padding: space[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonDayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
});

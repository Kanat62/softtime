import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompanyStatus, Weekday } from '@softtime/shared';
import type { EmployeeSchedule } from '@softtime/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import { colors, layout, radius, space } from '@/shared/config/theme';
import { ErrorState, OfflineBanner, Skeleton } from '@/shared/ui';
import { HomeHeader } from '@/widgets/home-header/HomeHeader';
import { EmployeesToday } from '@/widgets/employees-today/EmployeesToday';
import { AttendanceCard } from '@/widgets/attendance-card/AttendanceCard';
import { ScheduleMini } from '@/widgets/schedule-mini/ScheduleMini';
import { useHomeData } from '@/features/home/model/useHomeData';

const JS_DAY_TO_WEEKDAY: Record<number, Weekday> = {
  0: Weekday.SUN,
  1: Weekday.MON,
  2: Weekday.TUE,
  3: Weekday.WED,
  4: Weekday.THU,
  5: Weekday.FRI,
  6: Weekday.SAT,
};

function getTodaySchedule(schedule: EmployeeSchedule[] | null) {
  if (!schedule) return { startTime: null, endTime: null };
  const todayWeekday = JS_DAY_TO_WEEKDAY[new Date().getDay()];
  const entry = schedule.find((s) => s.weekday === todayWeekday);
  if (!entry?.isWorkingDay) return { startTime: null, endTime: null };
  return { startTime: entry.startTime, endTime: entry.endTime };
}

export function HomeScreen() {
  const navigation = useWorkerNavigation();
  const { companyStatus } = useAuth();
  const { profile, schedule, todayAttendance, employeesToday, isLoading, isError, refetchAll } =
    useHomeData();

  const isSuspended = companyStatus === CompanyStatus.SUSPENDED;
  const todaySchedule = getTodaySchedule(schedule);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <HomeSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ErrorState
          title="Не удалось загрузить данные"
          description="Проверьте подключение к интернету и повторите."
          onRetry={refetchAll}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <OfflineBanner variant="stale" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetchAll}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <HomeHeader
          name={profile?.fullName ?? ''}
          avatarUrl={profile?.avatarUrl ?? null}
          onAvatarPress={() => navigation.getParent()?.navigate('Profile' as never)}
        />

        {employeesToday !== null && (
          <EmployeesToday
            total={employeesToday.total}
            inOffice={employeesToday.inOffice}
            left={employeesToday.left}
            absent={0}
            topEmployees={[]}
            onPress={() => navigation.navigate('Office')}
          />
        )}

        <AttendanceCard
          scheduleStart={todaySchedule.startTime}
          scheduleEnd={todaySchedule.endTime}
          checkInAt={todayAttendance?.checkInAt ?? null}
          checkOutAt={todayAttendance?.checkOutAt ?? null}
          isSuspended={isSuspended}
          onCheckIn={() => navigation.navigate('QrScanner', { mode: 'checkIn' })}
          onCheckOut={() => navigation.navigate('QrScanner', { mode: 'checkOut' })}
        />

        {schedule && (
          <ScheduleMini
            schedule={schedule}
            onMorePress={() => navigation.navigate('MySchedule')}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeSkeleton() {
  return (
    <>
      <View style={[styles.skeletonCard, styles.skeletonRow]}>
        <View style={{ flex: 1, gap: space[2] }}>
          <Skeleton width={160} height={22} />
          <Skeleton width={120} height={14} />
        </View>
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>

      <View style={[styles.skeletonCard, { gap: space[3] }]}>
        <View style={{ flexDirection: 'row', gap: space[3], alignItems: 'center' }}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <View style={{ gap: space[1] }}>
            <Skeleton width={80} height={14} />
            <Skeleton width={120} height={12} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          <Skeleton height={60} style={{ flex: 1 }} borderRadius={8} />
          <Skeleton height={60} style={{ flex: 1 }} borderRadius={8} />
          <Skeleton height={60} style={{ flex: 1 }} borderRadius={8} />
        </View>
      </View>

      <View style={[styles.skeletonCard, { gap: space[3] }]}>
        <Skeleton width={140} height={16} />
        <Skeleton width={180} height={12} />
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          <Skeleton height={56} style={{ flex: 1 }} borderRadius={8} />
          <Skeleton height={56} style={{ flex: 1 }} borderRadius={8} />
        </View>
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          <Skeleton height={52} style={{ flex: 1 }} borderRadius={8} />
          <Skeleton height={52} style={{ flex: 1 }} borderRadius={8} />
        </View>
      </View>

      <View style={[styles.skeletonCard, { gap: space[3] }]}>
        <Skeleton width={100} height={16} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {([0, 1, 2, 3, 4, 5, 6] as const).map((i) => (
            <View key={i} style={{ alignItems: 'center', gap: space[1] }}>
              <Skeleton width={30} height={30} borderRadius={15} />
              <Skeleton width={24} height={10} />
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[4],
    gap: space[4],
  },
  bottomSpacer: {
    height: space[4],
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

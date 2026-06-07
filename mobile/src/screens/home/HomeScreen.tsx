import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompanyStatus } from '@softtime/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { mockWorker } from '@/entities/user';
import { mockSchedule } from '@/entities/schedule';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import { colors, layout, space } from '@/shared/config/theme';
import { HomeHeader } from '@/widgets/home-header/HomeHeader';
import { EmployeesToday } from '@/widgets/employees-today/EmployeesToday';
import { AttendanceCard } from '@/widgets/attendance-card/AttendanceCard';
import { ScheduleMini } from '@/widgets/schedule-mini/ScheduleMini';

const MOCK_EMPLOYEES_SUMMARY = { total: 11, inOffice: 7, left: 2, absent: 2 };

const MOCK_TOP_EMPLOYEES = [
  { id: 'e1', fullName: 'Аманда К', avatarUrl: null },
  { id: 'e2', fullName: 'Михаил С', avatarUrl: null },
  { id: 'e3', fullName: 'Светлана К', avatarUrl: null },
  { id: 'e4', fullName: 'Константин Д', avatarUrl: null },
];

const MOCK_SCHEDULE_TODAY = { startTime: '10:15', endTime: '18:00' };

export function HomeScreen() {
  const navigation = useWorkerNavigation();
  const { companyStatus } = useAuth();

  const isSuspended = companyStatus === CompanyStatus.SUSPENDED;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          name={mockWorker.fullName}
          avatarUrl={mockWorker.avatarUrl}
          onAvatarPress={() => navigation.getParent()?.navigate('Profile' as never)}
        />

        <EmployeesToday
          total={MOCK_EMPLOYEES_SUMMARY.total}
          inOffice={MOCK_EMPLOYEES_SUMMARY.inOffice}
          left={MOCK_EMPLOYEES_SUMMARY.left}
          absent={MOCK_EMPLOYEES_SUMMARY.absent}
          topEmployees={MOCK_TOP_EMPLOYEES}
          onPress={() => navigation.navigate('Office')}
        />

        <AttendanceCard
          scheduleStart={MOCK_SCHEDULE_TODAY.startTime}
          scheduleEnd={MOCK_SCHEDULE_TODAY.endTime}
          checkInAt={null}
          checkOutAt={null}
          isSuspended={isSuspended}
          onCheckIn={() => navigation.navigate('QrScanner')}
          onCheckOut={() => navigation.navigate('QrScanner')}
        />

        <ScheduleMini
          schedule={mockSchedule}
          onMorePress={() => navigation.navigate('MySchedule')}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
});

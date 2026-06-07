import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, X } from 'lucide-react-native';
import { DayStatus } from '@softtime/shared';
import type { Attendance } from '@softtime/shared';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  layout,
  radius,
  shadows,
  space,
  typography,
} from '@/shared/config/theme';
import { StatusBadge } from '@/shared/ui';
import { HistoryList, formatDate, formatTime, formatMinutes } from '@/widgets/history-list/HistoryList';
import { mockAttendanceHistory } from '@/entities/attendance';
import { useWorkerNavigation } from '@/shared/navigation/hooks';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'range';

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'week',  label: 'Неделя' },
  { key: 'month', label: 'Месяц'  },
  { key: 'range', label: 'Период' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterByPeriod(items: Attendance[], period: Period): Attendance[] {
  const now = new Date();
  const cutoff = new Date(now);
  if (period === 'week')  cutoff.setDate(now.getDate() - 7);
  if (period === 'month') cutoff.setDate(now.getDate() - 30);
  if (period === 'range') return items;
  return items.filter((a) => a.date >= cutoff);
}

function formatTotalHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ч` : `${h} ч ${m} м`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AttendanceHistoryScreen() {
  const navigation = useWorkerNavigation();
  const [period, setPeriod] = useState<Period>('week');
  const [selectedItem, setSelectedItem] = useState<Attendance | null>(null);

  const filtered = useMemo(
    () => filterByPeriod(mockAttendanceHistory, period),
    [period],
  );

  const totalMinutes = useMemo(
    () => filtered.reduce((sum, a) => sum + (a.workedMinutes ?? 0), 0),
    [filtered],
  );
  const lateCount   = filtered.filter((a) => a.status === DayStatus.LATE).length;
  const absentCount = filtered.filter((a) => a.status === DayStatus.ABSENT).length;

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
        <Text style={styles.topBarTitle}>История посещаемости</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Segmented control — fixed, doesn't scroll */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentTrack}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.segment, period === p.key && styles.segmentActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, period === p.key && styles.segmentTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <StatCol
            value={totalMinutes > 0 ? formatTotalHours(totalMinutes) : '—'}
            label="всего часов"
          />
          <View style={styles.divider} />
          <StatCol
            value={String(lateCount)}
            label={lateCount === 1 ? 'опоздание' : 'опоздания'}
            valueColor={lateCount > 0 ? colors.warningText : colors.textPrimary}
          />
          <View style={styles.divider} />
          <StatCol
            value={String(absentCount)}
            label={absentCount === 1 ? 'пропуск' : 'пропуска'}
            valueColor={absentCount > 0 ? colors.dangerText : colors.textPrimary}
          />
        </View>

        {/* List */}
        <HistoryList items={filtered} onItemPress={setSelectedItem} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Detail modal */}
      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </SafeAreaView>
  );
}

// ─── Stat column ──────────────────────────────────────────────────────────────

function StatCol({
  value,
  label,
  valueColor = colors.textPrimary,
}: {
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Detail modal (bottom sheet) ─────────────────────────────────────────────

function DetailModal({ item, onClose }: { item: Attendance | null; onClose: () => void }) {
  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {item ? formatDate(item.date) : ''}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          {/* Details */}
          {item && (
            <View style={styles.sheetBody}>
              <DetailRow label="Статус">
                <StatusBadge status={item.status} />
              </DetailRow>
              <DetailRow label="Приход">
                <Text style={styles.detailValue}>{formatTime(item.checkInAt)}</Text>
              </DetailRow>
              <DetailRow label="Уход">
                <Text style={styles.detailValue}>{formatTime(item.checkOutAt)}</Text>
              </DetailRow>
              <DetailRow label="Отработано">
                <Text style={styles.detailValue}>{formatMinutes(item.workedMinutes)}</Text>
              </DetailRow>
              {item.note && (
                <DetailRow label="Примечание">
                  <Text style={[styles.detailValue, styles.detailNote]}>{item.note}</Text>
                </DetailRow>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {children}
    </View>
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

  // Segmented control
  segmentWrap: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space[3],
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: colors.neutralLight,
    borderRadius: radius.sm,
    padding: 3,
  },
  segment: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...(shadows.xs as object),
  },
  segmentText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },

  // Scroll
  scroll: {
    paddingHorizontal: layout.screenPadding,
    gap: space[3],
  },
  bottomSpacer: {
    height: space[8],
  },

  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    flexDirection: 'row',
    paddingVertical: space[4],

  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: space[8],
    ...(shadows.lg as object),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: space[3],
    marginBottom: space[2],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    ...typography.lg,
    color: colors.textPrimary,
  },
  sheetBody: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    gap: space[4],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    ...typography.base,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  detailNote: {
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    paddingLeft: space[4],
  },
});

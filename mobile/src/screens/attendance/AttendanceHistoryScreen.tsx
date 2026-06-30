import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react-native';
import type { Attendance } from '@softtime/shared';
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  layout,
  radius,
  shadows,
  space,
  typography,
} from '@/shared/config/theme';
import { Button, ErrorState, OfflineBanner, Skeleton, StatusBadge } from '@/shared/ui';
import { HistoryList, formatDate, formatTime, formatMinutes } from '@/widgets/history-list/HistoryList';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import {
  useAttendanceHistory,
  type Period,
} from '@/features/attendance/history/model/useAttendanceHistory';
import { clearTodayAttendanceApi } from '@/entities/attendance';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'range', label: 'Период' },
];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateToYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
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
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [showRangePicker, setShowRangePicker] = useState(false);

  const customRange =
    period === 'range' && customFrom && customTo
      ? { from: dateToYMD(customFrom), to: dateToYMD(customTo) }
      : undefined;

  const { items, totalMinutes, lateCount, absentCount, isLoading, isError, refetch } =
    useAttendanceHistory(period, { customRange });

  function handleClearToday() {
    Alert.alert(
      'Очистить данные',
      'Удалить приход и уход за сегодня?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearTodayAttendanceApi();
              refetch();
            } catch {
              Alert.alert('Ошибка', 'Не удалось очистить данные');
            }
          },
        },
      ],
    );
  }

  const rangeLabel = useMemo(() => {
    if (customFrom && customTo) {
      return `${formatDateShort(customFrom)} — ${formatDateShort(customTo)}`;
    }
    return 'Последние 3 месяца';
  }, [customFrom, customTo]);

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleClearToday}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Очистить данные за сегодня"
        >
          <Trash2 size={20} color={colors.danger} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
      </View>
      <OfflineBanner variant="stale" />

      {/* Segmented control */}
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

        {/* Range label — shown when Период is active */}
        {period === 'range' && (
          <TouchableOpacity
            style={styles.rangeRow}
            onPress={() => setShowRangePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
            <Text style={styles.rangeText}>{rangeLabel}</Text>
            <ChevronRight size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </TouchableOpacity>
        )}
      </View>

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
            <HistorySkeleton />
          ) : (
            <>
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

              <HistoryList items={items} onItemPress={setSelectedItem} />
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <DateRangeSheet
        visible={showRangePicker}
        initialFrom={customFrom}
        initialTo={customTo}
        onApply={(from, to) => {
          setCustomFrom(from);
          setCustomTo(to);
          setShowRangePicker(false);
        }}
        onClose={() => setShowRangePicker(false)}
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

// ─── Detail modal ─────────────────────────────────────────────────────────────

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
          <View style={styles.handle} />

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

// ─── Date range sheet ─────────────────────────────────────────────────────────

function DateRangeSheet({
  visible,
  initialFrom,
  initialTo,
  onApply,
  onClose,
}: {
  visible: boolean;
  initialFrom: Date | null;
  initialTo: Date | null;
  onApply: (from: Date, to: Date) => void;
  onClose: () => void;
}) {
  const todayRef = useRef(new Date());
  const today = todayRef.current;

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selFrom, setSelFrom] = useState<Date | null>(null);
  const [selTo, setSelTo] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) {
      setSelFrom(initialFrom);
      setSelTo(initialTo);
      const base = initialFrom ?? today;
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const rows = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const offset = (firstWeekday + 6) % 7; // Mon = 0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const result: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [viewYear, viewMonth]);

  function toYMD(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  function getDayState(day: number | null): 'start' | 'end' | 'inRange' | 'today' | 'normal' | 'empty' {
    if (!day) return 'empty';
    const dStr = toYMD(new Date(viewYear, viewMonth, day));
    const todayStr = toYMD(today);
    const fromStr = selFrom ? toYMD(selFrom) : null;
    const toStr = selTo ? toYMD(selTo) : null;
    if (fromStr && dStr === fromStr) return 'start';
    if (toStr && dStr === toStr) return 'end';
    if (fromStr && toStr && dStr > fromStr && dStr < toStr) return 'inRange';
    if (dStr === todayStr) return 'today';
    return 'normal';
  }

  function handleDayPress(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    const dStr = toYMD(d);
    if (dStr > toYMD(today)) return;

    if (!selFrom || (selFrom && selTo)) {
      setSelFrom(d);
      setSelTo(null);
    } else {
      const fromStr = toYMD(selFrom);
      if (dStr === fromStr) return;
      if (d < selFrom) {
        setSelTo(selFrom);
        setSelFrom(d);
      } else {
        setSelTo(d);
      }
    }
  }

  const isFutureMonth =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (!isFutureMonth) {
      if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
      else setViewMonth((m) => m + 1);
    }
  }

  const canApply = selFrom !== null && selTo !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Выберите период</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          {/* Month navigation */}
          <View style={cal.monthNav}>
            <TouchableOpacity style={cal.navBtn} onPress={prevMonth}>
              <ChevronLeft size={iconSize.md} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
            <Text style={cal.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity style={cal.navBtn} onPress={nextMonth} disabled={isFutureMonth}>
              <ChevronRight
                size={iconSize.md}
                color={isFutureMonth ? colors.textDisabled : colors.textPrimary}
                strokeWidth={iconStrokeWidth}
              />
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={cal.weekRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={cal.weekLabel}>{label}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={cal.grid}>
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={cal.gridRow}>
                {row.map((day, colIdx) => {
                  const state = getDayState(day);
                  const isFuture = day
                    ? toYMD(new Date(viewYear, viewMonth, day)) > toYMD(today)
                    : false;
                  return (
                    <TouchableOpacity
                      key={colIdx}
                      style={[
                        cal.cell,
                        state === 'start' && cal.cellStart,
                        state === 'end' && cal.cellEnd,
                        state === 'inRange' && cal.cellInRange,
                      ]}
                      onPress={day && !isFuture ? () => handleDayPress(day) : undefined}
                      disabled={!day || isFuture}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          cal.cellText,
                          (state === 'start' || state === 'end') && cal.cellTextSelected,
                          state === 'today' && cal.cellTextToday,
                          (isFuture || !day) && cal.cellTextDisabled,
                        ]}
                      >
                        {day ?? ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Selection row */}
          <View style={cal.selRow}>
            <View style={cal.selItem}>
              <Text style={cal.selLabel}>Начало</Text>
              <Text style={cal.selValue}>{selFrom ? formatDateShort(selFrom) : '—'}</Text>
            </View>
            <View style={cal.selDivider} />
            <View style={cal.selItem}>
              <Text style={cal.selLabel}>Конец</Text>
              <Text style={cal.selValue}>{selTo ? formatDateShort(selTo) : '—'}</Text>
            </View>
          </View>

          {/* Apply */}
          <View style={cal.footer}>
            <Button
              variant="primary"
              size="full"
              onPress={canApply ? () => onApply(selFrom!, selTo!) : undefined}
              disabled={!canApply}
            >
              Применить
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <>
      <View style={[styles.summaryCard, { gap: 0 }]}>
        {([0, 1, 2] as const).map((i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.statCol}>
              <Skeleton width={60} height={22} />
              <Skeleton width={50} height={12} style={{ marginTop: space[1] }} />
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={{ gap: space[2] }}>
        {([0, 1, 2, 3, 4] as const).map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <View style={{ flex: 1, gap: space[2] }}>
              <Skeleton width={140} height={14} />
              <Skeleton width={100} height={12} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: space[2] }}>
              <Skeleton width={60} height={20} borderRadius={10} />
              <Skeleton width={40} height={12} />
            </View>
          </View>
        ))}
      </View>
    </>
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

  segmentWrap: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space[3],
    gap: space[2],
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

  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingVertical: 5,
    paddingHorizontal: space[3],
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    alignSelf: 'center',
  },
  rangeText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },

  scroll: {
    paddingHorizontal: layout.screenPadding,
    gap: space[3],
  },
  bottomSpacer: {
    height: space[8],
  },

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

  skeletonRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },

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

// ─── Calendar styles (DateRangeSheet) ─────────────────────────────────────────

const cal = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },

  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: space[4],
    paddingBottom: space[1],
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },

  grid: {
    paddingHorizontal: space[4],
    gap: 2,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  cellStart: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  cellEnd: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  cellInRange: {
    backgroundColor: colors.primaryLight,
    borderRadius: 0,
  },
  cellText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  cellTextSelected: {
    color: '#fff',
    fontFamily: fontFamily.semiBold,
  },
  cellTextToday: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
  cellTextDisabled: {
    color: colors.textDisabled,
  },

  selRow: {
    flexDirection: 'row',
    marginHorizontal: space[5],
    marginTop: space[4],
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: space[3],
  },
  selItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  selLabel: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  selValue: {
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  selDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  footer: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
  },
});

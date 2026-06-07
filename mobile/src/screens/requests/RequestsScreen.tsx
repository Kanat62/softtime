import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react-native';
import { RequestType, RequestStatus } from '@softtime/shared';
import type { AbsenceRequest } from '@softtime/shared';
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
import { Button, EmptyState, StatusBadge } from '@/shared/ui';
import { mockMyRequests } from '@/entities/request';

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.SICK]:          'Больничный',
  [RequestType.FAMILY]:        'Семейные обстоятельства',
  [RequestType.VACATION]:      'Отпуск',
  [RequestType.BUSINESS_TRIP]: 'Командировка',
  [RequestType.REMOTE]:        'Удалённая работа',
  [RequestType.LATE_REASON]:   'Опоздание (по причине)',
  [RequestType.EARLY_LEAVE]:   'Ранний уход (по причине)',
  [RequestType.OTHER]:         'Другое',
};

const REQUEST_TYPES = Object.entries(REQUEST_TYPE_LABELS) as Array<[RequestType, string]>;

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const MONTHS_NOMINATIVE = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFullDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateRange(start: Date, end: Date | null | undefined): string {
  const startDay = start.getDate();
  const startMonth = MONTHS_SHORT[start.getMonth()];

  if (!end || end.toDateString() === start.toDateString()) {
    return `${startDay} ${startMonth} ${start.getFullYear()}`;
  }

  const endDay = end.getDate();
  const endMonth = MONTHS_SHORT[end.getMonth()];

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}–${endDay} ${endMonth} ${end.getFullYear()}`;
  }

  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${end.getFullYear()}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Tab = 'new' | 'my';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'new', label: 'Новая заявка' },
  { key: 'my',  label: 'Мои заявки'  },
];

export function RequestsScreen() {
  const [activeTab, setActiveTab]         = useState<Tab>('new');
  const [myRequests, setMyRequests]       = useState<AbsenceRequest[]>(mockMyRequests);

  // Form state
  const [selectedType, setSelectedType]   = useState<RequestType | null>(null);
  const [startDate, setStartDate]         = useState<Date | null>(null);
  const [endDate, setEndDate]             = useState<Date | null>(null);
  const [comment, setComment]             = useState('');
  const [submitting, setSubmitting]       = useState(false);

  // Date picker target: which field is being edited
  const [dateTarget, setDateTarget]       = useState<'start' | 'end' | null>(null);

  const canSubmit = selectedType !== null && startDate !== null && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    const newReq: AbsenceRequest = {
      id: `req-${Date.now()}`,
      companyId: 'company-001',
      userId: 'user-worker-001',
      type: selectedType!,
      startDate: startDate!,
      endDate: endDate ?? null,
      desiredTime: null,
      comment: comment.trim() || null,
      status: RequestStatus.PENDING,
      decidedBy: null,
      decisionNote: null,
      createdAt: new Date(),
    };

    setMyRequests((prev) => [newReq, ...prev]);
    setSelectedType(null);
    setStartDate(null);
    setEndDate(null);
    setComment('');
    setSubmitting(false);
    setActiveTab('my');
  }

  function handleDateSelect(date: Date) {
    if (dateTarget === 'start') setStartDate(date);
    if (dateTarget === 'end')   setEndDate(date);
    setDateTarget(null);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Page title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Заявки</Text>
      </View>

      {/* Inner tab switcher */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentTrack}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.segment, activeTab === tab.key && styles.segmentActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.segmentText,
                activeTab === tab.key && styles.segmentTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab content */}
      {activeTab === 'new' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.newTabScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Type section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ТИП ЗАЯВКИ</Text>
              <View style={styles.chipsWrap}>
                {REQUEST_TYPES.map(([type, label]) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, selectedType === type && styles.chipActive]}
                    onPress={() => setSelectedType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedType === type && styles.chipTextActive,
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Period section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ПЕРИОД</Text>

              {/* Start date */}
              <TouchableOpacity
                style={styles.dateCard}
                onPress={() => setDateTarget('start')}
                activeOpacity={0.7}
              >
                <View style={styles.dateCardLeft}>
                  <CalendarDays
                    size={iconSize.md}
                    color={startDate ? colors.primary : colors.textDisabled}
                    strokeWidth={iconStrokeWidth}
                  />
                  <View style={styles.dateCardText}>
                    <Text style={styles.dateCardLabel}>Дата начала</Text>
                    <Text style={[
                      styles.dateCardValue,
                      !startDate && styles.dateCardPlaceholder,
                    ]}>
                      {startDate ? formatFullDate(startDate) : 'Выберите дату'}
                    </Text>
                  </View>
                </View>
                <ChevronRight
                  size={iconSize.sm}
                  color={colors.textDisabled}
                  strokeWidth={iconStrokeWidth}
                />
              </TouchableOpacity>

              {/* End date */}
              <TouchableOpacity
                style={styles.dateCard}
                onPress={() => setDateTarget('end')}
                activeOpacity={0.7}
              >
                <View style={styles.dateCardLeft}>
                  <CalendarDays
                    size={iconSize.md}
                    color={endDate ? colors.primary : colors.textDisabled}
                    strokeWidth={iconStrokeWidth}
                  />
                  <View style={styles.dateCardText}>
                    <Text style={styles.dateCardLabel}>Дата окончания</Text>
                    <Text style={[
                      styles.dateCardValue,
                      !endDate && styles.dateCardPlaceholder,
                    ]}>
                      {endDate ? formatFullDate(endDate) : 'Не выбрано (необязательно)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.dateCardRight}>
                  {endDate !== null && (
                    <TouchableOpacity
                      onPress={() => setEndDate(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
                    </TouchableOpacity>
                  )}
                  <ChevronRight
                    size={iconSize.sm}
                    color={colors.textDisabled}
                    strokeWidth={iconStrokeWidth}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Comment section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>КОММЕНТАРИЙ</Text>
              <TextInput
                style={styles.textarea}
                value={comment}
                onChangeText={setComment}
                placeholder="Опишите причину..."
                placeholderTextColor={colors.textDisabled}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit */}
            <View style={styles.submitWrap}>
              <Button
                variant="primary"
                size="full"
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={submitting}
              >
                Отправить заявку
              </Button>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={myRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.myTabList,
            myRequests.length === 0 && styles.myTabListEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <RequestRow item={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={
                <FileText size={48} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />
              }
              title="Нет заявок"
              description="Здесь появятся ваши заявки"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Date picker modal */}
      <DatePickerModal
        visible={dateTarget !== null}
        onClose={() => setDateTarget(null)}
        onSelect={handleDateSelect}
        selectedDate={dateTarget === 'start' ? startDate : endDate}
      />
    </SafeAreaView>
  );
}

// ─── Request row ──────────────────────────────────────────────────────────────

function RequestRow({ item }: { item: AbsenceRequest }) {
  const pendingLabel = item.status === RequestStatus.PENDING ? 'На рассмотрении' : undefined;

  return (
    <View style={styles.requestRow}>
      <View style={styles.requestRowTop}>
        <View style={styles.requestRowInfo}>
          <Text style={styles.requestType}>{REQUEST_TYPE_LABELS[item.type]}</Text>
          <Text style={styles.requestDate}>{formatDateRange(item.startDate, item.endDate)}</Text>
        </View>
        <StatusBadge status={item.status} label={pendingLabel} />
      </View>

      {item.status === RequestStatus.REJECTED && item.decisionNote ? (
        <Text style={styles.decisionNote}>{item.decisionNote}</Text>
      ) : null}
    </View>
  );
}

// ─── Date picker modal ────────────────────────────────────────────────────────

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
}

function DatePickerModal({ visible, onClose, onSelect, selectedDate }: DatePickerModalProps) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const offset      = (firstDay + 6) % 7; // Monday = 0

  const cells: Array<number | null> = [
    ...Array.from<null>({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

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
          {/* Handle */}
          <View style={styles.handle} />

          {/* Month navigation */}
          <View style={styles.calHeader}>
            <TouchableOpacity
              onPress={prevMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft
                size={iconSize.md}
                color={colors.textSecondary}
                strokeWidth={iconStrokeWidth}
              />
            </TouchableOpacity>
            <Text style={styles.calMonthText}>
              {MONTHS_NOMINATIVE[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight
                size={iconSize.md}
                color={colors.textSecondary}
                strokeWidth={iconStrokeWidth}
              />
            </TouchableOpacity>
          </View>

          {/* Day name headers */}
          <View style={styles.calRow}>
            {DAY_NAMES.map((d) => (
              <View key={d} style={styles.calCell}>
                <Text style={styles.calDayName}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.calGrid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.calRow}>
                {row.map((day, ci) => {
                  if (!day) return <View key={ci} style={styles.calCell} />;

                  const cellDate  = new Date(viewYear, viewMonth, day);
                  const isSelected = selectedDate !== null &&
                    cellDate.toDateString() === selectedDate.toDateString();
                  const isToday = cellDate.toDateString() === today.toDateString();

                  return (
                    <TouchableOpacity
                      key={ci}
                      style={styles.calCell}
                      onPress={() => { onSelect(cellDate); onClose(); }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.calDayCircle, isSelected && styles.calDayCircleSelected]}>
                        <Text style={[
                          styles.calDayText,
                          isSelected && styles.calDayTextSelected,
                          isToday && !isSelected && styles.calDayTextToday,
                        ]}>
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.calBottom} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },

  // Page header
  pageHeader: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  pageTitle: {
    ...typography.xl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },

  // Tab switcher
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

  // New request tab
  newTabScroll: {
    paddingHorizontal: layout.screenPadding,
    gap: space[4],
  },

  // Section
  section: {
    gap: space[2],
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textDisabled,
    letterSpacing: 0.8,
  },

  // Type chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  chip: {
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },

  // Date cards
  dateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  dateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    flex: 1,
  },
  dateCardText: {
    gap: 2,
    flex: 1,
  },
  dateCardLabel: {
    ...typography.xs,
    color: colors.textSecondary,
  },
  dateCardValue: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  dateCardPlaceholder: {
    color: colors.textDisabled,
    fontFamily: fontFamily.regular,
  },
  dateCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },

  // Textarea
  textarea: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    minHeight: 100,
    ...typography.base,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    ...(shadows.xs as object),
  },

  // Submit
  submitWrap: {
    marginTop: space[2],
  },
  bottomSpacer: {
    height: space[8],
  },

  // My requests tab
  myTabList: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[2],
    paddingBottom: space[8],
  },
  myTabListEmpty: {
    flex: 1,
  },
  separator: {
    height: space[2],
  },

  // Request row
  requestRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    gap: space[2],

  },
  requestRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space[3],
  },
  requestRowInfo: {
    flex: 1,
    gap: 3,
  },
  requestType: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  requestDate: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  decisionNote: {
    ...typography.sm,
    color: colors.dangerText,
    fontFamily: fontFamily.regular,
  },

  // Date picker modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...(shadows.lg as object),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: space[3],
    marginBottom: space[1],
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  calMonthText: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  calRow: {
    flexDirection: 'row',
    paddingHorizontal: space[3],
  },
  calGrid: {
    gap: 2,
    paddingHorizontal: space[3],
  },
  calCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayName: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textDisabled,
    letterSpacing: 0.3,
  },
  calDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCircleSelected: {
    backgroundColor: colors.primary,
  },
  calDayText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  calDayTextSelected: {
    color: colors.surface,
    fontFamily: fontFamily.semiBold,
  },
  calDayTextToday: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
  calBottom: {
    height: space[6],
  },
});

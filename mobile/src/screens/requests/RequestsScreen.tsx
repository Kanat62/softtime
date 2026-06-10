import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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
import type { AppError } from '@/shared/api/errors';
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
import { Button, EmptyState, ErrorState, OfflineBanner, Skeleton, StatusBadge } from '@/shared/ui';
import { useIsOnline } from '@/shared/lib/network';
import { useSubmitRequest } from '@/features/request/submit/model/useSubmitRequest';
import { useMyRequests } from '@/features/request/history/model/useMyRequests';

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
  const startDay   = start.getDate();
  const startMonth = MONTHS_SHORT[start.getMonth()];

  if (!end || end.toDateString() === start.toDateString()) {
    return `${startDay} ${startMonth} ${start.getFullYear()}`;
  }

  const endDay   = end.getDate();
  const endMonth = MONTHS_SHORT[end.getMonth()];

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}–${endDay} ${endMonth} ${end.getFullYear()}`;
  }

  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${end.getFullYear()}`;
}

function mapSubmitError(err: AppError): string {
  if (err.isNetworkError) return 'Нет соединения. Проверьте интернет.';
  if (err.statusCode === 409) return 'Заявка на этот период уже существует.';
  if (err.statusCode === 400) return 'Проверьте правильность заполнения формы.';
  return err.message ?? 'Не удалось отправить заявку.';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Tab = 'new' | 'my';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'new', label: 'Новая заявка' },
  { key: 'my',  label: 'Мои заявки'  },
];

export function RequestsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const isOnline = useIsOnline();

  const submitMutation = useSubmitRequest();
  const { items: myRequests, isLoading: requestsLoading, isError: requestsError, refetch: refetchRequests } =
    useMyRequests();

  // Form state
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [startDate, setStartDate]       = useState<Date | null>(null);
  const [endDate, setEndDate]           = useState<Date | null>(null);
  const [comment, setComment]           = useState('');

  // Date picker
  const [dateTarget, setDateTarget] = useState<'start' | 'end' | null>(null);

  // Detail sheet
  const [detailItem, setDetailItem] = useState<AbsenceRequest | null>(null);

  const canSubmit = isOnline && selectedType !== null && startDate !== null && !submitMutation.isPending;

  function resetForm() {
    setSelectedType(null);
    setStartDate(null);
    setEndDate(null);
    setComment('');
    submitMutation.reset();
  }

  function handleTypeChange(type: RequestType) {
    setSelectedType(type);
    if (submitMutation.isError) submitMutation.reset();
  }

  function handleSubmit() {
    if (!canSubmit) return;
    submitMutation.mutate(
      {
        type: selectedType!,
        startDate: startDate!.toISOString().slice(0, 10),
        endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
        comment: comment.trim() || null,
      },
      {
        onSuccess: () => {
          resetForm();
          setActiveTab('my');
        },
      },
    );
  }

  function handleDateSelect(date: Date) {
    if (dateTarget === 'start') setStartDate(date);
    if (dateTarget === 'end')   setEndDate(date);
    setDateTarget(null);
  }

  const submitError = submitMutation.isError
    ? mapSubmitError(submitMutation.error as unknown as AppError)
    : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Page title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Заявки</Text>
      </View>
      <OfflineBanner variant="block" />

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
                    onPress={() => handleTypeChange(type)}
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

            {/* Submit error */}
            {submitError ? (
              <View style={styles.submitError}>
                <Text style={styles.submitErrorText}>{submitError}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <View style={styles.submitWrap}>
              <Button
                variant="primary"
                size="full"
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={submitMutation.isPending}
              >
                Отправить заявку
              </Button>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : requestsError ? (
        <ErrorState onRetry={refetchRequests} />
      ) : (
        <FlatList
          data={requestsLoading ? null : myRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.myTabList,
            !requestsLoading && myRequests.length === 0 && styles.myTabListEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <RequestRow item={item} onPress={() => setDetailItem(item)} />}
          ListHeaderComponent={requestsLoading ? <RequestsSkeleton /> : null}
          ListEmptyComponent={
            requestsLoading ? null : (
              <EmptyState
                icon={
                  <FileText size={48} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />
                }
                title="Нет заявок"
                description="Здесь появятся ваши заявки"
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetchRequests}
              tintColor={colors.primary}
              colors={[colors.primary]}
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

      {/* Request detail sheet */}
      <RequestDetailSheet
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </SafeAreaView>
  );
}

// ─── Request row ──────────────────────────────────────────────────────────────

function RequestRow({ item, onPress }: { item: AbsenceRequest; onPress: () => void }) {
  const pendingLabel = item.status === RequestStatus.PENDING ? 'На рассмотрении' : undefined;

  return (
    <TouchableOpacity style={styles.requestRow} onPress={onPress} activeOpacity={0.8}>
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
    </TouchableOpacity>
  );
}

// ─── Requests loading skeleton ────────────────────────────────────────────────

function RequestsSkeleton() {
  return (
    <View style={{ gap: space[2] }}>
      {([0, 1, 2] as const).map((i) => (
        <View key={i} style={styles.requestRow}>
          <View style={styles.requestRowTop}>
            <View style={[styles.requestRowInfo, { gap: space[2] }]}>
              <Skeleton width={160} height={14} />
              <Skeleton width={100} height={12} />
            </View>
            <Skeleton width={80} height={22} borderRadius={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Request detail sheet ─────────────────────────────────────────────────────

function RequestDetailSheet({
  item,
  onClose,
}: {
  item: AbsenceRequest | null;
  onClose: () => void;
}) {
  const statusLabels: Record<string, string> = {
    [RequestStatus.PENDING]:  'На рассмотрении',
    [RequestStatus.APPROVED]: 'Одобрено',
    [RequestStatus.REJECTED]: 'Отклонено',
  };

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

          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Детали заявки</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          {item && (
            <View style={styles.detailBody}>
              <DetailPair label="Тип" value={REQUEST_TYPE_LABELS[item.type]} />
              <DetailPair label="Период" value={formatDateRange(item.startDate, item.endDate)} />
              <View style={styles.detailPair}>
                <Text style={styles.detailLabel}>Статус</Text>
                <StatusBadge
                  status={item.status}
                  label={statusLabels[item.status] ?? item.status}
                />
              </View>
              {item.comment ? (
                <DetailPair label="Ваш комментарий" value={item.comment} />
              ) : null}
              {item.status === RequestStatus.REJECTED && item.decisionNote ? (
                <View style={styles.decisionBlock}>
                  <Text style={styles.decisionBlockLabel}>Комментарий администратора</Text>
                  <Text style={styles.decisionBlockText}>{item.decisionNote}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.detailBottom} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailPair}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  const offset      = (firstDay + 6) % 7;

  const cells: Array<number | null> = [
    ...(new Array(offset).fill(null) as null[]),
    ...(Array.from({ length: daysInMonth }, (_, i) => i + 1) as number[]),
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
          <View style={styles.handle} />

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

          <View style={styles.calRow}>
            {DAY_NAMES.map((d) => (
              <View key={d} style={styles.calCell}>
                <Text style={styles.calDayName}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calGrid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.calRow}>
                {row.map((day, ci) => {
                  if (!day) return <View key={ci} style={styles.calCell} />;

                  const cellDate   = new Date(viewYear, viewMonth, day);
                  const isSelected = selectedDate !== null &&
                    cellDate.toDateString() === selectedDate.toDateString();
                  const isTodayDay = cellDate.toDateString() === today.toDateString();

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
                          isTodayDay && !isSelected && styles.calDayTextToday,
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

  newTabScroll: {
    paddingHorizontal: layout.screenPadding,
    gap: space[4],
  },

  section: {
    gap: space[2],
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.textDisabled,
    letterSpacing: 0.8,
  },

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

  submitError: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  submitErrorText: {
    ...typography.sm,
    color: colors.dangerText,
    fontFamily: fontFamily.medium,
  },

  submitWrap: {
    marginTop: space[2],
  },
  bottomSpacer: {
    height: space[8],
  },

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

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailTitle: {
    ...typography.lg,
    color: colors.textPrimary,
  },
  detailBody: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    gap: space[4],
  },
  detailPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  detailLabel: {
    ...typography.base,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  decisionBlock: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[2],
  },
  decisionBlockLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.dangerText,
    letterSpacing: 0.5,
  },
  decisionBlockText: {
    ...typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.dangerText,
    lineHeight: 18,
  },
  detailBottom: {
    height: space[8],
  },
});

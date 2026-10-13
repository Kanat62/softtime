import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/shared/i18n';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FileText, X } from 'lucide-react-native';
import { RequestStatus, RequestType } from '@softtime/shared';
import { Avatar, Button, EmptyState, StatusBadge } from '@/shared/ui';
import type { RequestWithUser } from '@/entities/request/api/admin';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  radius,
  shadows,
  space,
  typography,
} from '@/shared/config/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'pending' | 'resolved';

const FILTERS: FilterTab[] = ['all', 'pending', 'resolved'];

const LOCALE_TAGS: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

function formatDateRange(start: Date, end: Date | null): string {
  const tag = LOCALE_TAGS[i18n.language] ?? LOCALE_TAGS.ru;
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  if (!end || start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString(tag, { ...opts, year: 'numeric' });
  }
  return `${start.toLocaleDateString(tag, opts)} – ${end.toLocaleDateString(tag, opts)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface IncomingRequestsProps {
  requests: RequestWithUser[];
  onApprove: (id: string) => void;
  onReject: (id: string, note?: string | null) => void;
  processingId?: string | null;
}

export function IncomingRequests({
  requests,
  onApprove,
  onReject,
  processingId,
}: IncomingRequestsProps) {
  const { t } = useTranslation(['management', 'enums', 'common']);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<RequestWithUser | null>(null);

  const filtered = requests.filter((r) => {
    if (filter === 'pending') return r.status === RequestStatus.PENDING;
    if (filter === 'resolved') return r.status !== RequestStatus.PENDING;
    return true;
  });

  function handleApprove(id: string) {
    onApprove(id);
    setSelected(null);
  }

  function handleReject(id: string, note: string) {
    onReject(id, note || null);
    setSelected(null);
  }

  return (
    <View>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterLabel, filter === f && s.filterLabelActive]}>
              {t(`management:incoming.filters.${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />}
          title={t('management:incoming.emptyTitle')}
          description={
            filter === 'pending'
              ? t('management:incoming.emptyAllResolved')
              : t('management:incoming.emptyNone')
          }
        />
      ) : (
        <View style={s.list}>
          {filtered.map((req, idx) => {
            const name = req.user?.fullName ?? t('common:employee');
            return (
              <React.Fragment key={req.id}>
                {idx > 0 && <View style={s.divider} />}
                <RequestRow
                  request={req}
                  name={name}
                  onPress={() => setSelected(req)}
                  isProcessing={processingId === req.id}
                />
              </React.Fragment>
            );
          })}
        </View>
      )}

      {/* Detail sheet */}
      <RequestDetailSheet
        request={selected}
        name={selected ? (selected.user?.fullName ?? t('common:employee')) : ''}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </View>
  );
}

// ─── Request row ──────────────────────────────────────────────────────────────

interface RequestRowProps {
  request: RequestWithUser;
  name: string;
  onPress: () => void;
  isProcessing: boolean;
}

function RequestRow({ request, name, onPress, isProcessing }: RequestRowProps) {
  const { t } = useTranslation(['management', 'enums', 'common']);
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.85}>
      <Avatar uri={request.user?.avatarUrl ?? null} name={name} size={40} />

      <View style={s.rowInfo}>
        <Text style={s.rowName} numberOfLines={1}>{name}</Text>
        <Text style={s.rowType}>{t(`enums:requestType.${request.type}`)}</Text>
        <Text style={s.rowDate}>{formatDateRange(request.startDate, request.endDate)}</Text>
      </View>

      {isProcessing ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <StatusBadge status={request.status} />
      )}
    </TouchableOpacity>
  );
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

type SheetStep = 'view' | 'reject';

interface RequestDetailSheetProps {
  request: RequestWithUser | null;
  name: string;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
}

function RequestDetailSheet({
  request,
  name,
  onClose,
  onApprove,
  onReject,
}: RequestDetailSheetProps) {
  const { t } = useTranslation(['management', 'enums', 'common']);
  const [step, setStep] = useState<SheetStep>('view');
  const [comment, setComment] = useState('');

  function handleClose() {
    setStep('view');
    setComment('');
    onClose();
  }

  function handleRejectConfirm() {
    if (!request) return;
    onReject(request.id, comment.trim());
    setStep('view');
    setComment('');
  }

  const isPending = request?.status === RequestStatus.PENDING;

  return (
    <Modal
      visible={request !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>
              {step === 'reject'
                ? t('management:incoming.rejectTitle')
                : t('management:incoming.detailTitle')}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          {step === 'view' && request ? (
            <View style={s.sheetBody}>
              {/* Employee */}
              <View style={s.detailRow}>
                <Avatar uri={request.user?.avatarUrl ?? null} name={name} size={40} />
                <View style={s.detailInfo}>
                  <Text style={s.detailName}>{name}</Text>
                  <StatusBadge status={request.status} />
                </View>
              </View>

              {/* Fields */}
              <View style={s.fieldList}>
                <DetailField
                  label={t('management:incoming.fieldType')}
                  value={t(`enums:requestType.${request.type}`)}
                />
                <DetailField
                  label={t('management:incoming.fieldDates')}
                  value={formatDateRange(request.startDate, request.endDate)}
                />
                {request.comment ? (
                  <DetailField label={t('management:incoming.fieldComment')} value={request.comment} />
                ) : null}
                {request.decisionNote ? (
                  <DetailField label={t('management:incoming.fieldDecision')} value={request.decisionNote} />
                ) : null}
              </View>

              {/* Actions — only for PENDING */}
              {isPending && (
                <View style={s.sheetActions}>
                  <Button
                    variant="danger-outline"
                    size="md"
                    style={s.sheetBtn}
                    onPress={() => setStep('reject')}
                  >
                    {t('common:reject')}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    style={s.sheetBtn}
                    onPress={() => onApprove(request.id)}
                  >
                    {t('common:approve')}
                  </Button>
                </View>
              )}
            </View>
          ) : (
            <View style={s.sheetBody}>
              <Text style={s.rejectLabel}>{t('management:incoming.rejectReasonLabel')}</Text>
              <TextInput
                style={s.rejectInput}
                value={comment}
                onChangeText={setComment}
                placeholder={t('management:incoming.rejectReasonPlaceholder')}
                placeholderTextColor={colors.textDisabled}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <View style={s.sheetActions}>
                <Button
                  variant="ghost"
                  size="md"
                  style={s.sheetBtn}
                  onPress={() => setStep('view')}
                >
                  {t('common:back')}
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  style={s.sheetBtn}
                  onPress={handleRejectConfirm}
                >
                  {t('common:confirm')}
                </Button>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: space[2],
    paddingBottom: space[3],
  },
  filterChip: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.full,
    backgroundColor: colors.neutralLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterLabel: {
    ...typography.sm,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  filterLabelActive: {
    color: colors.primary,
  },

  // List
  list: {},
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    gap: space[3],
    minHeight: 60,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  rowType: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  rowDate: {
    ...typography.xs,
    color: colors.textDisabled,
  },

  // Sheet
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
    paddingTop: space[5],
    gap: space[4],
  },
  sheetActions: {
    flexDirection: 'row',
    gap: space[3],
    marginTop: space[2],
  },
  sheetBtn: {
    flex: 1,
  },

  // Detail
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  detailInfo: {
    flex: 1,
    gap: space[2],
  },
  detailName: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  fieldList: {
    gap: space[3],
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    ...typography.xs,
    color: colors.textSecondary,
  },
  fieldValue: {
    ...typography.base,
    color: colors.textPrimary,
  },

  // Reject
  rejectLabel: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  rejectInput: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    ...typography.base,
    color: colors.textPrimary,
    minHeight: 80,
  },
});

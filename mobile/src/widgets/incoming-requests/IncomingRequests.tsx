import React, { useState } from 'react';
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

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [RequestType.SICK]: 'Больничный',
  [RequestType.FAMILY]: 'По семейным обстоятельствам',
  [RequestType.VACATION]: 'Отпуск',
  [RequestType.BUSINESS_TRIP]: 'Командировка',
  [RequestType.REMOTE]: 'Удалённая работа',
  [RequestType.LATE_REASON]: 'Причина опоздания',
  [RequestType.EARLY_LEAVE]: 'Ранний уход',
  [RequestType.OTHER]: 'Другое',
};

type FilterTab = 'all' | 'pending' | 'resolved';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'На рассмотрении' },
  { key: 'resolved', label: 'Решённые' },
];

function formatDateRange(start: Date, end: Date | null): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  if (!end || start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' });
  }
  return `${start.toLocaleDateString('ru-RU', opts)} – ${end.toLocaleDateString('ru-RU', opts)}`;
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
            key={f.key}
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterLabel, filter === f.key && s.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />}
          title="Нет заявок"
          description={filter === 'pending' ? 'Все заявки рассмотрены' : 'Заявки отсутствуют'}
        />
      ) : (
        <View style={s.list}>
          {filtered.map((req, idx) => {
            const name = req.user?.fullName ?? 'Сотрудник';
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
        name={selected ? (selected.user?.fullName ?? 'Сотрудник') : ''}
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
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.85}>
      <Avatar uri={request.user?.avatarUrl ?? null} name={name} size={40} />

      <View style={s.rowInfo}>
        <Text style={s.rowName} numberOfLines={1}>{name}</Text>
        <Text style={s.rowType}>{REQUEST_TYPE_LABELS[request.type]}</Text>
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
              {step === 'reject' ? 'Причина отклонения' : 'Детали заявки'}
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
                <DetailField label="Тип" value={REQUEST_TYPE_LABELS[request.type]} />
                <DetailField
                  label="Даты"
                  value={formatDateRange(request.startDate, request.endDate)}
                />
                {request.comment ? (
                  <DetailField label="Комментарий" value={request.comment} />
                ) : null}
                {request.decisionNote ? (
                  <DetailField label="Решение" value={request.decisionNote} />
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
                    Отклонить
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    style={s.sheetBtn}
                    onPress={() => onApprove(request.id)}
                  >
                    Одобрить
                  </Button>
                </View>
              )}
            </View>
          ) : (
            <View style={s.sheetBody}>
              <Text style={s.rejectLabel}>Укажите причину (необязательно)</Text>
              <TextInput
                style={s.rejectInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Например: нет замены на этот период"
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
                  Назад
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  style={s.sheetBtn}
                  onPress={handleRejectConfirm}
                >
                  Подтвердить
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

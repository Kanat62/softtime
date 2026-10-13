import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { usePendingEmployees } from '@/features/employee/pending/model/usePendingEmployees';
import { useAdminRequests } from '@/features/requests/admin/model/useAdminRequests';
import { useOfficeData } from '@/features/office/model/useOfficeData';
import type { AttendanceWithUser } from '@/entities/attendance/api/office';
import { Avatar, Button, ErrorState, OfflineBanner } from '@/shared/ui';
import { PendingEmployees } from '@/widgets/pending-employees/PendingEmployees';
import { IncomingRequests } from '@/widgets/incoming-requests/IncomingRequests';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ─── ManagementScreen ─────────────────────────────────────────────────────────

export function ManagementScreen() {
  const { t } = useTranslation(['management', 'common']);
  const navigation = useNavigation<any>();

  const pendingEmp = usePendingEmployees();
  const adminReqs = useAdminRequests();
  const officeData = useOfficeData();

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('common:back')}
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>{t('management:title')}</Text>
        <View style={s.backBtn} />
      </View>
      <OfflineBanner variant="stale" />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: Pending employees ── */}
        <Section
          title={t('management:employeesSection')}
          subtitle={t('management:pendingCount', { count: pendingEmp.employees.length })}
        >
          {pendingEmp.isError ? (
            <ErrorState title={t('common:loadFailed')} onRetry={pendingEmp.refetch} />
          ) : (
            <PendingEmployees
              workers={pendingEmp.employees}
              onAccept={pendingEmp.approve}
              onReject={pendingEmp.reject}
              processingId={pendingEmp.processingId}
            />
          )}
        </Section>

        {/* ── Section 2: Incoming requests ── */}
        <Section title={t('management:requestsSection')}>
          {adminReqs.isError ? (
            <ErrorState title={t('common:loadFailed')} onRetry={adminReqs.refetch} />
          ) : (
            <IncomingRequests
              requests={adminReqs.items}
              onApprove={adminReqs.approve}
              onReject={adminReqs.reject}
              processingId={adminReqs.processingId}
            />
          )}
        </Section>

        {/* ── Section 3: Office now ── */}
        <OfficeSection
          entries={officeData.entries}
          isLoading={officeData.isLoading}
          isError={officeData.isError}
          onRefetch={officeData.refetch}
          onCheckout={(id, checkOutAt) =>
            officeData.checkoutMutation.mutate({ id, checkOutAt })
          }
          isCheckingOut={officeData.checkoutMutation.isPending}
          onViewAll={() => navigation.navigate('Office')}
        />

        <View style={s.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <View style={s.card}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Office section ───────────────────────────────────────────────────────────

interface OfficeSectionProps {
  entries: AttendanceWithUser[];
  isLoading: boolean;
  isError: boolean;
  onRefetch: () => void;
  onCheckout: (id: string, checkOutAt: Date) => void;
  isCheckingOut: boolean;
  onViewAll: () => void;
}

function OfficeSection({
  entries,
  isLoading,
  isError,
  onRefetch,
  onCheckout,
  isCheckingOut,
  onViewAll,
}: OfficeSectionProps) {
  const { t } = useTranslation(['management', 'common']);
  const [checkoutTarget, setCheckoutTarget] = useState<AttendanceWithUser | null>(null);
  const preview = entries.slice(0, 3);

  return (
    <View style={s.card}>
      {/* Header with count + "View all" */}
      <TouchableOpacity
        style={s.officeSectionHeader}
        onPress={onViewAll}
        activeOpacity={0.85}
      >
        <View>
          <Text style={s.sectionTitle}>{t('management:inOfficeTitle')}</Text>
          <Text style={s.sectionSubtitle}>{t('management:peopleCount', { count: entries.length })}</Text>
        </View>
        <View style={s.viewAllRow}>
          <Text style={s.viewAllText}>{t('common:all')}</Text>
          <ChevronRight size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
        </View>
      </TouchableOpacity>

      <View style={s.sectionBody}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={s.loader} />
        ) : isError ? (
          <ErrorState title={t('common:loadFailed')} onRetry={onRefetch} />
        ) : (
          preview.map((entry, idx) => (
            <React.Fragment key={entry.id}>
              {idx > 0 && <View style={s.divider} />}
              <OfficeRow
                entry={entry}
                onMorePress={() => setCheckoutTarget(entry)}
              />
            </React.Fragment>
          ))
        )}
      </View>

      <CheckoutSheet
        entry={checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onSave={(checkOutAt) => {
          if (checkoutTarget) {
            onCheckout(checkoutTarget.id, checkOutAt);
            setCheckoutTarget(null);
          }
        }}
        isSaving={isCheckingOut}
      />
    </View>
  );
}

// ─── Office row ───────────────────────────────────────────────────────────────

interface OfficeRowProps {
  entry: AttendanceWithUser;
  onMorePress: () => void;
}

function OfficeRow({ entry, onMorePress }: OfficeRowProps) {
  const { t } = useTranslation(['management', 'common']);
  const name = entry.user?.fullName ?? t('common:employee');
  return (
    <View style={s.officeRow}>
      <Avatar uri={entry.user?.avatarUrl ?? null} name={name} size={40} />
      <View style={s.officeRowInfo}>
        <Text style={s.officeRowName} numberOfLines={1}>{name}</Text>
        {entry.checkInAt && (
          <Text style={s.officeRowTime}>{t('management:since', { time: formatTime(entry.checkInAt) })}</Text>
        )}
      </View>
      <TouchableOpacity
        style={s.moreBtn}
        onPress={onMorePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={t('management:setLeaveLabel')}
      >
        <MoreHorizontal size={iconSize.md} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Checkout sheet ───────────────────────────────────────────────────────────

interface CheckoutSheetProps {
  entry: AttendanceWithUser | null;
  onClose: () => void;
  onSave: (checkOutAt: Date) => void;
  isSaving: boolean;
}

function CheckoutSheet({ entry, onClose, onSave, isSaving }: CheckoutSheetProps) {
  const { t } = useTranslation(['management', 'common']);
  const now = new Date();
  const [hours, setHours] = useState(now.getHours().toString().padStart(2, '0'));
  const [minutes, setMinutes] = useState(now.getMinutes().toString().padStart(2, '0'));
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      setError(t('common:time.invalid'));
      return;
    }
    setError(null);
    const checkOutAt = new Date();
    checkOutAt.setHours(h, m, 0, 0);
    onSave(checkOutAt);
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Modal
      visible={entry !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />

          <View style={s.sheetHeader}>
            <View>
              <Text style={s.sheetTitle}>{t('management:setLeaveTitle')}</Text>
              {entry && (
                <Text style={s.sheetSub}>{entry.user?.fullName ?? t('common:employee')}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          <View style={s.sheetBody}>
            <Text style={s.timeLabel}>{t('management:leaveTime')}</Text>
            <View style={s.timePicker}>
              <View style={s.timeSegmentWrap}>
                <TextInput
                  style={s.timeSegment}
                  value={hours}
                  onChangeText={(v) => { setError(null); setHours(v.replace(/\D/g, '').slice(0, 2)); }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholder={t('common:time.hoursPlaceholder')}
                  placeholderTextColor={colors.textDisabled}
                />
                <Text style={s.timeSegmentLabel}>{t('common:time.hours')}</Text>
              </View>
              <Text style={s.timeColon}>:</Text>
              <View style={s.timeSegmentWrap}>
                <TextInput
                  style={s.timeSegment}
                  value={minutes}
                  onChangeText={(v) => { setError(null); setMinutes(v.replace(/\D/g, '').slice(0, 2)); }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholder={t('common:time.minutesPlaceholder')}
                  placeholderTextColor={colors.textDisabled}
                />
                <Text style={s.timeSegmentLabel}>{t('common:time.minutes')}</Text>
              </View>
            </View>
            {error && <Text style={s.timeError}>{error}</Text>}
            <Button
              variant="primary"
              size="full"
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t('common:saving') : t('common:save')}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Top bar
  topBar: {
    height: layout.topBarHeight,
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
  topBarTitle: {
    flex: 1,
    ...typography.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Scroll
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[3],
    gap: space[3],
  },
  bottomSpacer: {
    height: space[8],
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[2],
    gap: 2,
  },
  sectionTitle: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  sectionBody: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
  },

  // Office section header
  officeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },

  // Office rows
  loader: {
    marginVertical: space[4],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    gap: space[3],
    minHeight: 56,
  },
  officeRowInfo: {
    flex: 1,
    gap: 2,
  },
  officeRowName: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  officeRowTime: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  moreBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Checkout sheet
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
    alignItems: 'flex-start',
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
  sheetSub: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sheetBody: {
    paddingHorizontal: space[5],
    paddingTop: space[5],
    gap: space[4],
  },
  timeLabel: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
  },
  timeSegmentWrap: {
    alignItems: 'center',
    gap: 6,
  },
  timeSegment: {
    width: 88,
    height: 64,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 32,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  timeSegmentLabel: {
    ...typography.xs,
    color: colors.textSecondary,
  },
  timeColon: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  timeError: {
    ...typography.sm,
    color: colors.danger,
    textAlign: 'center',
  },
});

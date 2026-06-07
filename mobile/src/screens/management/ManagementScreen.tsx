import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
} from 'lucide-react-native';
import { UserStatus } from '@softtime/shared';
import { useNavigation } from '@react-navigation/native';
import { mockWorkers } from '@/entities/user';
import { mockIncomingRequests } from '@/entities/request';
import { mockTodayInOffice, type OfficeEntry } from '@/entities/attendance';
import { Avatar, Button } from '@/shared/ui';
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

const PENDING_WORKERS = mockWorkers.filter((w) => w.status === UserStatus.PENDING);

const USER_NAME_MAP: Record<string, string> = Object.fromEntries(
  mockWorkers.map((w) => [w.id, w.fullName]),
);

function getUserName(userId: string): string {
  return USER_NAME_MAP[userId] ?? 'Сотрудник';
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ─── ManagementScreen ─────────────────────────────────────────────────────────

export function ManagementScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Управление</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: Pending employees ── */}
        <Section title="Сотрудники" subtitle={`Ожидают подтверждения: ${PENDING_WORKERS.length}`}>
          <PendingEmployees workers={PENDING_WORKERS} />
        </Section>

        {/* ── Section 2: Incoming requests ── */}
        <Section title="Заявки сотрудников">
          <IncomingRequests
            requests={mockIncomingRequests}
            getUserName={getUserName}
          />
        </Section>

        {/* ── Section 3: Office now ── */}
        <OfficeSection onViewAll={() => navigation.navigate('Office')} />

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
  onViewAll: () => void;
}

function OfficeSection({ onViewAll }: OfficeSectionProps) {
  const [checkoutTarget, setCheckoutTarget] = useState<OfficeEntry | null>(null);
  const preview = mockTodayInOffice.slice(0, 3);

  return (
    <View style={s.card}>
      {/* Header with count + "View all" */}
      <TouchableOpacity
        style={s.officeSectionHeader}
        onPress={onViewAll}
        activeOpacity={0.85}
      >
        <View>
          <Text style={s.sectionTitle}>Сейчас в офисе</Text>
          <Text style={s.sectionSubtitle}>{mockTodayInOffice.length} человек</Text>
        </View>
        <View style={s.viewAllRow}>
          <Text style={s.viewAllText}>Все</Text>
          <ChevronRight size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />
        </View>
      </TouchableOpacity>

      <View style={s.sectionBody}>
        {preview.map((entry, idx) => (
          <React.Fragment key={entry.user.id}>
            {idx > 0 && <View style={s.divider} />}
            <OfficeRow
              entry={entry}
              onMorePress={() => setCheckoutTarget(entry)}
            />
          </React.Fragment>
        ))}
      </View>

      <CheckoutSheet
        entry={checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
      />
    </View>
  );
}

// ─── Office row ───────────────────────────────────────────────────────────────

interface OfficeRowProps {
  entry: OfficeEntry;
  onMorePress: () => void;
}

function OfficeRow({ entry, onMorePress }: OfficeRowProps) {
  return (
    <View style={s.officeRow}>
      <Avatar uri={entry.user.avatarUrl} name={entry.user.fullName} size={40} />
      <View style={s.officeRowInfo}>
        <Text style={s.officeRowName} numberOfLines={1}>{entry.user.fullName}</Text>
        <Text style={s.officeRowTime}>с {formatTime(entry.checkInAt)}</Text>
      </View>
      <TouchableOpacity
        style={s.moreBtn}
        onPress={onMorePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Указать уход"
      >
        <MoreHorizontal size={iconSize.md} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Checkout sheet ───────────────────────────────────────────────────────────

interface CheckoutSheetProps {
  entry: OfficeEntry | null;
  onClose: () => void;
}

function CheckoutSheet({ entry, onClose }: CheckoutSheetProps) {
  const now = new Date();
  const [hours, setHours] = useState(now.getHours().toString().padStart(2, '0'));
  const [minutes, setMinutes] = useState(now.getMinutes().toString().padStart(2, '0'));
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      setError('Введите корректное время (ЧЧ:ММ)');
      return;
    }
    setError(null);
    onClose();
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
              <Text style={s.sheetTitle}>Указать время ухода</Text>
              {entry && <Text style={s.sheetSub}>{entry.user.fullName}</Text>}
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          <View style={s.sheetBody}>
            <Text style={s.timeLabel}>Время ухода</Text>
            <View style={s.timePicker}>
              <View style={s.timeSegmentWrap}>
                <TextInput
                  style={s.timeSegment}
                  value={hours}
                  onChangeText={(v) => { setError(null); setHours(v.replace(/\D/g, '').slice(0, 2)); }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholder="ЧЧ"
                  placeholderTextColor={colors.textDisabled}
                />
                <Text style={s.timeSegmentLabel}>часы</Text>
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
                  placeholder="ММ"
                  placeholderTextColor={colors.textDisabled}
                />
                <Text style={s.timeSegmentLabel}>минуты</Text>
              </View>
            </View>
            {error && <Text style={s.timeError}>{error}</Text>}
            <Button variant="primary" size="full" onPress={handleSave}>
              Сохранить
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

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Building2,
  Camera,
  ChevronRight,
  CreditCard,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import { UserRole, Weekday } from '@softtime/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { useProfile } from '@/features/profile/model/useProfile';
import { useMySchedule } from '@/features/schedule/model/useMySchedule';
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  layout,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { useNavigation } from '@react-navigation/native';
import { OfflineBanner } from '@/shared/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS: Record<Weekday, string> = {
  [Weekday.MON]: 'Пн',
  [Weekday.TUE]: 'Вт',
  [Weekday.WED]: 'Ср',
  [Weekday.THU]: 'Чт',
  [Weekday.FRI]: 'Пт',
  [Weekday.SAT]: 'Сб',
  [Weekday.SUN]: 'Вс',
};

const WEEKDAY_ORDER: Weekday[] = [
  Weekday.MON,
  Weekday.TUE,
  Weekday.WED,
  Weekday.THU,
  Weekday.FRI,
  Weekday.SAT,
  Weekday.SUN,
];

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarBlock({
  initials,
  onCameraPress,
}: {
  initials: string;
  onCameraPress: () => void;
}) {
  return (
    <View style={s.avatarWrapper}>
      <View style={s.avatar}>
        <Text style={s.avatarInitial}>{initials}</Text>
      </View>
      <TouchableOpacity
        style={s.cameraBtn}
        onPress={onCameraPress}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        accessibilityLabel="Сменить фото"
      >
        <Camera size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
      </TouchableOpacity>
    </View>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const label = role === UserRole.ADMIN ? 'Администратор' : 'Сотрудник';
  return (
    <View style={s.roleBadge}>
      <ShieldCheck size={14} color={colors.primary} strokeWidth={iconStrokeWidth} />
      <Text style={s.roleBadgeText}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>{icon}</View>
      <View style={s.infoText}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ScheduleRow({
  day,
  isWorking,
  startTime,
  endTime,
}: {
  day: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
}) {
  return (
    <View style={s.scheduleRow}>
      <View style={[s.scheduleDot, isWorking ? s.scheduleDotActive : s.scheduleDotOff]} />
      <Text style={s.scheduleDay}>{day}</Text>
      <Text style={[s.scheduleTime, !isWorking && s.scheduleTimeOff]}>
        {isWorking && startTime && endTime ? `${startTime} – ${endTime}` : 'Выходной'}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  variant = 'default',
  showChevron = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  showChevron?: boolean;
}) {
  const isDanger = variant === 'danger';
  return (
    <TouchableOpacity
      style={[s.actionRow, isDanger && s.actionRowDanger]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={label}
    >
      <View style={s.actionIcon}>{icon}</View>
      <Text style={[s.actionLabel, isDanger && s.actionLabelDanger]}>{label}</Text>
      {showChevron && (
        <ChevronRight size={iconSize.md} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
      )}
    </TouchableOpacity>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modal}>
          <View style={s.modalHandle} />
          <View style={s.modalIconRow}>
            <View style={s.modalIconBg}>
              <Lock size={24} color={colors.primary} strokeWidth={iconStrokeWidth} />
            </View>
          </View>
          <Text style={s.modalTitle}>Смена пароля</Text>
          <Text style={s.modalDesc}>
            Функция смены пароля доступна в следующей версии приложения.
          </Text>
          <TouchableOpacity style={s.modalBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.modalBtnText}>Закрыть</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { userRole, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const { user, isLoading } = useProfile();
  const { schedule } = useMySchedule();

  const isAdmin = userRole === UserRole.ADMIN;

  const initials = user
    ? user.fullName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  function handleLogout() {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  }

  function handleAvatarCamera() {
    Alert.alert('Фото профиля', 'Выбор фото будет доступен в следующей версии.');
  }

  function handleOpenWebPanel() {
    Linking.openURL('https://softtime.app').catch(() => {
      Alert.alert('Ошибка', 'Не удалось открыть браузер.');
    });
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <OfflineBanner variant="stale" />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header card ── */}
        <View style={s.headerCard}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <AvatarBlock initials={initials} onCameraPress={handleAvatarCamera} />
              <View style={s.headerInfo}>
                <Text style={s.fullName}>{user?.fullName ?? ''}</Text>
                <RoleBadge role={user?.role ?? (isAdmin ? UserRole.ADMIN : UserRole.WORKER)} />
              </View>
            </>
          )}
        </View>

        {/* ── Info card ── */}
        <View style={s.card}>
          <InfoRow
            icon={<Mail size={iconSize.md} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />}
            label="Email"
            value={user?.email ?? '—'}
          />
          <View style={s.divider} />
          <InfoRow
            icon={<Building2 size={iconSize.md} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />}
            label="Компания"
            value={user?.companyId ? 'SoftTime Ltd.' : '—'}
          />
        </View>

        {/* ── Schedule card ── */}
        <TouchableOpacity
          style={s.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Home', { screen: 'MySchedule' } as any)}
          accessibilityLabel="Мой график"
        >
          <View style={s.scheduleHeader}>
            <Text style={s.cardTitle}>График работы</Text>
            <ChevronRight size={iconSize.md} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
          </View>
          <View style={s.scheduleList}>
            {WEEKDAY_ORDER.map((weekday) => {
              const entry = schedule?.find((e) => e.weekday === weekday);
              return (
                <ScheduleRow
                  key={weekday}
                  day={WEEKDAY_LABELS[weekday]}
                  isWorking={entry?.isWorkingDay ?? false}
                  startTime={entry?.startTime ?? null}
                  endTime={entry?.endTime ?? null}
                />
              );
            })}
          </View>
        </TouchableOpacity>

        {/* ── Admin-only actions ── */}
        {isAdmin && (
          <View style={s.card}>
            <ActionRow
              icon={<CreditCard size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />}
              label="Подписка и оплата"
              onPress={() => navigation.navigate('Subscription')}
              showChevron
            />
            <View style={s.divider} />
            <ActionRow
              icon={<ExternalLink size={iconSize.md} color={colors.primary} strokeWidth={iconStrokeWidth} />}
              label="Открыть веб-панель"
              onPress={handleOpenWebPanel}
              showChevron
            />
          </View>
        )}

        {/* ── Common actions ── */}
        <View style={s.card}>
          <ActionRow
            icon={<KeyRound size={iconSize.md} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />}
            label="Сменить пароль"
            onPress={() => setShowPasswordModal(true)}
            showChevron
          />
        </View>

        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
          accessibilityLabel="Выйти из аккаунта"
        >
          <LogOut size={iconSize.md} color={colors.danger} strokeWidth={iconStrokeWidth} />
          <Text style={s.logoutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

        <View style={s.bottomSpacer} />
      </ScrollView>

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[4],
    gap: space[3],
  },

  // Header card
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space[4],
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  headerInfo: {
    flex: 1,
    gap: space[2],
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullName: {
    ...typography.lg,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: space[2],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  roleBadgeText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: space[4],
    paddingVertical: space[2],

  },
  cardTitle: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space[1],
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    gap: space[3],
  },
  infoIcon: {
    width: 20,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    ...typography.xs,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.base,
    color: colors.textPrimary,
  },

  // Schedule
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3],
  },
  scheduleList: {
    gap: space[1],
    paddingBottom: space[2],
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[1] + 2,
    gap: space[2],
  },
  scheduleDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  scheduleDotActive: {
    backgroundColor: colors.success,
  },
  scheduleDotOff: {
    backgroundColor: colors.textDisabled,
  },
  scheduleDay: {
    ...typography.sm,
    color: colors.textSecondary,
    width: 28,
  },
  scheduleTime: {
    ...typography.sm,
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
  },
  scheduleTimeOff: {
    color: colors.textDisabled,
    fontFamily: fontFamily.regular,
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    gap: space[3],
    minHeight: 44,
  },
  actionRowDanger: {},
  actionIcon: {
    width: 20,
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    ...typography.base,
    color: colors.textPrimary,
  },
  actionLabelDanger: {
    color: colors.danger,
  },

  // Logout button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: space[4],
    backgroundColor: colors.surface,
    minHeight: 52,
  },
  logoutText: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.danger,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space[4],
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: space[6],
    paddingTop: space[4],
    paddingBottom: space[6],
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: space[3],
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: space[2],
  },
  modalIconRow: {
    alignItems: 'center',
  },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.lg,
    color: colors.textPrimary,
  },
  modalDesc: {
    ...typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space[4],
    paddingHorizontal: space[6],
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: space[1],
  },
  modalBtnText: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.surface,
  },

  bottomSpacer: {
    height: space[4],
  },
});

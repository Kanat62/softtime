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
  FileText,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import { UserRole } from '@softtime/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { useProfile } from '@/features/profile/model/useProfile';
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
import { useNavigation } from '@react-navigation/native';
import { OfflineBanner } from '@/shared/ui';

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarBlock({ initials, onCameraPress }: { initials: string; onCameraPress: () => void }) {
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

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function ActionRow({
  icon,
  label,
  onPress,
  variant = 'default',
  showChevron = false,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
  showChevron?: boolean;
  borderColor?: string;
}) {
  const isDanger = variant === 'danger';
  return (
    <TouchableOpacity
      style={[s.actionRow, borderColor ? { borderWidth: 1.5, borderColor, borderRadius: radius.md } : undefined]}
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

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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

  const isAdmin = userRole === UserRole.ADMIN;

  const initials = user
    ? user.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  // Tax data is incomplete if INN or citizenship is missing
  const taxIncomplete = !user?.inn || !user?.citizenship;

  function handleLogout() {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти из аккаунта?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
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
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Профиль</Text>
      </View>
      <OfflineBanner variant="stale" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

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
            value={user?.companyName ?? '—'}
          />
        </View>

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
          <View style={s.divider} />
          {/* Tax data button (task 9) — red border if incomplete */}
          <ActionRow
            icon={
              <FileText
                size={iconSize.md}
                color={taxIncomplete ? colors.danger : colors.textPrimary}
                strokeWidth={iconStrokeWidth}
              />
            }
            label="Налоговые данные"
            onPress={() => navigation.navigate('TaxData')}
            showChevron
            borderColor={taxIncomplete ? colors.danger : undefined}
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

      <ChangePasswordModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pageHeader: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  pageTitle: { ...typography.xl, fontFamily: fontFamily.bold, color: colors.textPrimary },
  scroll: { paddingHorizontal: layout.screenPadding, gap: space[3] },

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
    ...(shadows.card as object),
  },
  headerInfo: { flex: 1, gap: space[2] },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 24, lineHeight: 30, fontFamily: fontFamily.bold, color: colors.primary },
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
  fullName: { ...typography.lg, fontFamily: fontFamily.bold, color: colors.textPrimary },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: space[2],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  roleBadgeText: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.medium, color: colors.primary },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    ...(shadows.card as object),
  },
  cardTitle: { ...typography.baseMedium, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space[1] },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    gap: space[3],
  },
  infoIcon: { width: 20, alignItems: 'center' },
  infoText: { flex: 1, gap: 2 },
  infoLabel: { ...typography.xs, color: colors.textSecondary },
  infoValue: { ...typography.base, color: colors.textPrimary },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[1],
    gap: space[3],
    minHeight: 44,
  },
  actionIcon: { width: 20, alignItems: 'center' },
  actionLabel: { flex: 1, ...typography.base, color: colors.textPrimary },
  actionLabelDanger: { color: colors.danger },

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
    ...(shadows.card as object),
  },
  logoutText: { ...typography.base, fontFamily: fontFamily.semiBold, color: colors.danger },

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
  modalIconRow: { alignItems: 'center' },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { ...typography.lg, color: colors.textPrimary },
  modalDesc: { ...typography.sm, color: colors.textSecondary, textAlign: 'center' },
  modalBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space[4],
    paddingHorizontal: space[6],
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: space[1],
  },
  modalBtnText: { ...typography.base, fontFamily: fontFamily.semiBold, color: colors.surface },
  bottomSpacer: { height: space[4] },
});

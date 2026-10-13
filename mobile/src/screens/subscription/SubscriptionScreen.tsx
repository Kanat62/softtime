import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  History,
  X,
} from 'lucide-react-native';
import { SubStatus, PaymentStatus } from '@softtime/shared';
import type { Subscription, Payment } from '@softtime/shared';
import { useAdminProfileNavigation } from '@/shared/navigation/hooks';
import { useSubscription } from '@/features/subscription/model/useSubscription';
import { Button, ErrorState, OfflineBanner, Skeleton, StatusBadge } from '@/shared/ui';
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isNonActive(status: SubStatus): boolean {
  return status !== SubStatus.ACTIVE;
}

// ─── Features list ────────────────────────────────────────────────────────────

const FEATURE_KEYS = ['employees', 'qr', 'push', 'schedules', 'history'] as const;

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusConfig {
  badgeStatus: string;
  bannerColor: string;
  bannerTextColor: string;
  /** Ключ в subscription:banners.*; пустая строка — баннера нет. */
  bannerKey: string;
}

const STATUS_CONFIGS: Record<SubStatus, StatusConfig> = {
  [SubStatus.ACTIVE]: {
    badgeStatus: 'ACTIVE',
    bannerColor: colors.successLight,
    bannerTextColor: colors.successText,
    bannerKey: '',
  },
  [SubStatus.TRIAL]: {
    badgeStatus: 'TRIAL',
    bannerColor: colors.warningLight,
    bannerTextColor: colors.warningText,
    bannerKey: 'trial',
  },
  [SubStatus.GRACE]: {
    badgeStatus: 'GRACE',
    bannerColor: colors.warningLight,
    bannerTextColor: colors.warningText,
    bannerKey: 'grace',
  },
  [SubStatus.EXPIRED]: {
    badgeStatus: 'ABSENT',
    bannerColor: colors.dangerLight,
    bannerTextColor: colors.dangerText,
    bannerKey: 'expired',
  },
  [SubStatus.CANCELLED]: {
    badgeStatus: 'REJECTED',
    bannerColor: colors.dangerLight,
    bannerTextColor: colors.dangerText,
    bannerKey: 'cancelled',
  },
};

// ─── SubscriptionScreen ───────────────────────────────────────────────────────

export function SubscriptionScreen() {
  const { t } = useTranslation(['subscription', 'enums', 'common']);
  const navigation = useAdminProfileNavigation();
  const [showHistory, setShowHistory] = useState(false);
  const { subscription, isLoading, isError, refetch, payments } = useSubscription();

  if (isLoading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.topBar}>
          <View style={s.backBtn} />
          <Text style={s.topBarTitle}>{t('subscription:title')}</Text>
          <View style={s.backBtn} />
        </View>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Skeleton height={220} borderRadius={16} />
          <Skeleton height={160} borderRadius={16} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !subscription) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>{t('subscription:title')}</Text>
          <View style={s.backBtn} />
        </View>
        <ErrorState title={t('subscription:loadFailed')} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const sub = subscription;
  const cfg = STATUS_CONFIGS[sub.status];
  const needsPayment = isNonActive(sub.status);

  function handleCancel() {
    Alert.alert(
      t('subscription:cancelTitle'),
      t('subscription:cancelMessage'),
      [
        { text: t('common:back'), style: 'cancel' },
        { text: t('subscription:cancelConfirm'), style: 'destructive', onPress: () => {} },
      ],
    );
  }

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
        <Text style={s.topBarTitle}>{t('subscription:title')}</Text>
        <View style={s.backBtn} />
      </View>
      <OfflineBanner variant="stale" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <HeroCard
          sub={sub}
          cfg={cfg}
          needsPayment={needsPayment}
          onHistoryPress={() => setShowHistory(true)}
        />

        {/* ── Warning banner (non-active) ── */}
        {needsPayment && cfg.bannerKey ? (
          <View style={[s.banner, { backgroundColor: cfg.bannerColor }]}>
            <AlertTriangle
              size={iconSize.md}
              color={cfg.bannerTextColor}
              strokeWidth={iconStrokeWidth}
            />
            <Text style={[s.bannerText, { color: cfg.bannerTextColor }]}>
              {t(`subscription:banners.${cfg.bannerKey}`)}
            </Text>
          </View>
        ) : null}

        {/* ── What's included ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('subscription:included')}</Text>
          <View style={s.featureList}>
            {FEATURE_KEYS.map((feature) => (
              <FeatureRow key={feature} text={t(`subscription:features.${feature}`)} />
            ))}
          </View>
        </View>

        {/* ── CTA (non-active) ── */}
        {needsPayment && (
          <Button variant="primary" size="full" onPress={() => navigation.navigate('Payment')}>
            {t('subscription:pay')}
          </Button>
        )}

        {/* ── Cancel (active) ── */}
        {!needsPayment && (
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={s.cancelText}>{t('subscription:cancelAction')}</Text>
          </TouchableOpacity>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* Payment history sheet */}
      <PaymentHistorySheet
        visible={showHistory}
        payments={payments}
        onClose={() => setShowHistory(false)}
      />
    </SafeAreaView>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────

interface HeroCardProps {
  sub: Subscription;
  cfg: StatusConfig;
  needsPayment: boolean;
  onHistoryPress: () => void;
}

function HeroCard({ sub, cfg, needsPayment, onHistoryPress }: HeroCardProps) {
  const { t } = useTranslation(['subscription', 'enums', 'common']);
  const days = sub.periodEnd ? daysUntil(sub.periodEnd) : 0;

  return (
    <View style={s.hero}>
      {/* Badge */}
      <View style={s.heroBadgeRow}>
        <StatusBadge status={cfg.badgeStatus} label={t(`enums:subStatus.${sub.status}`)} />
      </View>

      {/* Tariff name */}
      <Text style={s.heroTitle}>{t('subscription:planName')}</Text>

      {/* Status-specific info */}
      {sub.status === SubStatus.ACTIVE && sub.nextBillingAt ? (
        <View style={s.heroInfoBlock}>
          <Text style={s.heroLabel}>{t('subscription:nextCharge')}</Text>
          <Text style={s.heroDate}>{formatDate(sub.nextBillingAt)}</Text>
        </View>
      ) : (
        <View style={s.heroInfoBlock}>
          <Text style={s.heroLabel}>
            {sub.status === SubStatus.EXPIRED || sub.status === SubStatus.CANCELLED
              ? t('subscription:inactive')
              : t('subscription:daysLeft', { count: days })}
          </Text>
        </View>
      )}

      {/* Price */}
      <Text style={s.heroPrice}>{t('subscription:price')}</Text>

      {/* "История платежей" — only for ACTIVE */}
      {!needsPayment && (
        <TouchableOpacity style={s.heroOutlineBtn} onPress={onHistoryPress} activeOpacity={0.85}>
          <History size={iconSize.sm} color={colors.surface} strokeWidth={iconStrokeWidth} />
          <Text style={s.heroOutlineBtnText}>{t('subscription:paymentHistory')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={s.featureRow}>
      <View style={s.featureCheck}>
        <Check size={12} color={colors.successText} strokeWidth={2.5} />
      </View>
      <Text style={s.featureText}>{text}</Text>
    </View>
  );
}

// ─── Payment history sheet ────────────────────────────────────────────────────

interface PaymentHistorySheetProps {
  visible: boolean;
  payments: Payment[];
  onClose: () => void;
}

function PaymentHistorySheet({ visible, payments, onClose }: PaymentHistorySheetProps) {
  const { t } = useTranslation(['subscription', 'enums', 'common']);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />

          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{t('subscription:paymentHistory')}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.sheetScroll}
            contentContainerStyle={s.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {payments.map((pay, idx) => (
              <React.Fragment key={pay.id}>
                {idx > 0 && <View style={s.payDivider} />}
                <PaymentRow payment={pay} />
              </React.Fragment>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const { t } = useTranslation(['subscription', 'enums', 'common']);
  const isPaid = payment.status === PaymentStatus.PAID;
  return (
    <View style={s.payRow}>
      <View style={s.payInfo}>
        <Text style={s.payAmount}>${payment.amountUsd}</Text>
        <Text style={s.payPeriod}>
          {formatShortDate(payment.periodStart)} – {formatShortDate(payment.periodEnd)}
        </Text>
        <Text style={s.payDate}>{formatDate(payment.createdAt)}</Text>
      </View>
      <StatusBadge
        status={isPaid ? 'PAID' : 'REJECTED'}
        label={isPaid ? t('enums:paymentStatus.PAID') : t('common:error')}
      />
    </View>
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

  // Hero
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: space[5],
    gap: space[3],
  },
  heroBadgeRow: {
    alignSelf: 'flex-start',
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamily.bold,
    color: colors.surface,
  },
  heroInfoBlock: {
    gap: space[1],
  },
  heroLabel: {
    ...typography.sm,
    color: 'rgba(255,255,255,0.75)',
  },
  heroDate: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fontFamily.bold,
    color: colors.surface,
  },
  heroPrice: {
    ...typography.base,
    color: 'rgba(255,255,255,0.85)',
  },
  heroOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    alignSelf: 'flex-start',
    marginTop: space[1],
  },
  heroOutlineBtnText: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.surface,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    borderRadius: radius.md,
    padding: space[4],
  },
  bannerText: {
    flex: 1,
    ...typography.sm,
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[4],

  },
  cardTitle: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },

  // Features
  featureList: {
    gap: space[3],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    ...typography.base,
    color: colors.textPrimary,
  },

  // Cancel
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: space[3],
  },
  cancelText: {
    ...typography.sm,
    color: colors.textSecondary,
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
    maxHeight: '70%',
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
  sheetScroll: {
    flexShrink: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    paddingBottom: space[8],
  },

  // Payment row
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    gap: space[3],
  },
  payInfo: {
    flex: 1,
    gap: 3,
  },
  payAmount: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  payPeriod: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  payDate: {
    ...typography.xs,
    color: colors.textDisabled,
  },
  payDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

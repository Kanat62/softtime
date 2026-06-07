import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CreditCard,
  Lock,
  ShieldCheck,
} from 'lucide-react-native';
import { useAdminProfileNavigation } from '@/shared/navigation/hooks';
import { mockSubscription } from '@/entities/subscription';
import { Button } from '@/shared/ui';
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

// ─── PaymentScreen ────────────────────────────────────────────────────────────

export function PaymentScreen() {
  const navigation = useAdminProfileNavigation();

  function handlePay() {
    Alert.alert(
      'Выбор способа оплаты',
      'Интеграция с платёжным провайдером будет доступна в следующей версии.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Продолжить (мок)',
          onPress: () => navigation.navigate('PaymentSuccess'),
        },
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
          accessibilityLabel="Назад"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Оплата</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Amount card ── */}
        <View style={s.amountCard}>
          <View style={s.iconWrap}>
            <CreditCard size={32} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
          <Text style={s.amount}>$30.00</Text>
          <Text style={s.description}>Подписка SoftTime на 1 месяц</Text>

          {/* Period */}
          <View style={s.periodRow}>
            <PeriodItem label="Начало периода" value={formatDate(mockSubscription.periodEnd)} />
            <View style={s.periodSep} />
            <PeriodItem label="Конец периода" value={formatDatePlusMonth(mockSubscription.periodEnd)} />
          </View>
        </View>

        {/* ── What you get ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Тариф SoftTime Pro</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Стоимость</Text>
            <Text style={s.summaryValue}>$30</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Период</Text>
            <Text style={s.summaryValue}>1 месяц</Text>
          </View>
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={s.totalLabel}>Итого</Text>
            <Text style={s.totalValue}>$30.00</Text>
          </View>
        </View>

        {/* ── Security note ── */}
        <View style={s.securityRow}>
          <Lock size={iconSize.sm} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
          <Text style={s.securityText}>Оплата защищена шифрованием</Text>
          <ShieldCheck size={iconSize.sm} color={colors.success} strokeWidth={iconStrokeWidth} />
        </View>

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* Sticky CTA */}
      <View style={s.footer}>
        <Button variant="primary" size="full" onPress={handlePay}>
          Выбрать способ оплаты
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PeriodItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.periodItem}>
      <Text style={s.periodLabel}>{label}</Text>
      <Text style={s.periodValue}>{value}</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDatePlusMonth(date: Date): string {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return formatDate(next);
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
    paddingTop: space[4],
    gap: space[3],
  },
  bottomSpacer: {
    height: space[4],
  },

  // Amount card
  amountCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: space[6],
    alignItems: 'center',
    gap: space[3],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 48,
    lineHeight: 56,
    fontFamily: fontFamily.bold,
    color: colors.surface,
  },
  description: {
    ...typography.base,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: space[2],
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    padding: space[3],
  },
  periodItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  periodSep: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  periodLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  periodValue: {
    ...typography.sm,
    fontFamily: fontFamily.semiBold,
    color: colors.surface,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[3],

  },
  cardTitle: {
    ...typography.baseMedium,
    color: colors.textPrimary,
    marginBottom: space[1],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.base,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.base,
    color: colors.textPrimary,
  },
  summaryTotal: {
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: space[1],
  },
  totalLabel: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  // Security
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  securityText: {
    ...typography.sm,
    color: colors.textSecondary,
  },

  // Footer
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space[6],
    paddingTop: space[3],
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

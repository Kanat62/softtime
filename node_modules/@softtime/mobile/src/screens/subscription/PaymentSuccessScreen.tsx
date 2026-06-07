import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useAdminProfileNavigation } from '@/shared/navigation/hooks';
import { mockSubscription } from '@/entities/subscription';
import { Button } from '@/shared/ui';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  layout,
  radius,
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

function addMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

// ─── PaymentSuccessScreen ─────────────────────────────────────────────────────

export function PaymentSuccessScreen() {
  const navigation = useAdminProfileNavigation();

  // Animations
  const scale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1 — ring pulse out
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 70,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1.6,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 2 — text fades in
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const activeUntil = addMonth(mockSubscription.periodEnd);

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.body}>
        {/* ── Animated checkmark ── */}
        <View style={s.iconContainer}>
          {/* Expanding ring */}
          <Animated.View
            style={[
              s.ring,
              {
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />
          {/* Circle with check */}
          <Animated.View style={[s.circle, { transform: [{ scale }] }]}>
            <Check size={44} color={colors.surface} strokeWidth={2.5} strokeLinejoin="round" />
          </Animated.View>
        </View>

        {/* ── Text block ── */}
        <Animated.View style={[s.textBlock, { opacity: contentOpacity }]}>
          <Text style={s.title}>Оплата прошла ✓</Text>
          <Text style={s.subtitle}>Подписка активна до</Text>
          <Text style={s.date}>{formatDate(activeUntil)}</Text>
        </Animated.View>

        {/* ── Details card ── */}
        <Animated.View style={[s.detailCard, { opacity: contentOpacity }]}>
          <DetailRow label="Тариф" value="SoftTime Pro" />
          <View style={s.detailDivider} />
          <DetailRow label="Сумма" value="$30.00" />
          <View style={s.detailDivider} />
          <DetailRow label="Период" value={`до ${formatDate(activeUntil)}`} />
        </Animated.View>
      </View>

      {/* ── Done button ── */}
      <View style={s.footer}>
        <Button
          variant="primary"
          size="full"
          onPress={() => navigation.popToTop()}
        >
          Готово
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CIRCLE_SIZE = 100;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: space[6],
  },

  // Animated icon
  iconContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.success,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  textBlock: {
    alignItems: 'center',
    gap: space[2],
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.base,
    color: colors.textSecondary,
    marginTop: space[1],
  },
  date: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },

  // Details card
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: space[5],
    paddingVertical: space[2],
    width: '100%',

  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space[3],
  },
  detailLabel: {
    ...typography.base,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Footer
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space[6],
    paddingTop: space[3],
  },
});

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Building2, ChevronLeft, User } from 'lucide-react-native';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { useAuthNavigation } from '@/shared/navigation/hooks';

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

function RoleCard({ icon, title, description, onPress }: RoleCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{description}</Text>
    </TouchableOpacity>
  );
}

export function RoleSelectScreen() {
  const navigation = useAuthNavigation();

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
        >
          <ChevronLeft
            size={24}
            color={colors.textPrimary}
            strokeWidth={iconStrokeWidth}
          />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Кто вы?</Text>

        {/* placeholder для выравнивания заголовка по центру */}
        <View style={styles.backBtn} />
      </View>

      {/* Карточки ролей */}
      <View style={styles.cards}>
        <RoleCard
          icon={
            <Building2
              size={40}
              color={colors.primary}
              strokeWidth={iconStrokeWidth}
            />
          }
          title="Я администратор"
          description="Создаю компанию"
          onPress={() => navigation.navigate('RegisterAdmin')}
        />

        <RoleCard
          icon={
            <User
              size={40}
              color={colors.primary}
              strokeWidth={iconStrokeWidth}
            />
          }
          title="Я сотрудник"
          description="Есть код компании"
          onPress={() => navigation.navigate('RegisterWorker')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ─── Top bar ─────────────────────────────────────────────────────────────
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
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

  // ─── Cards ───────────────────────────────────────────────────────────────
  cards: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingTop: space[8],
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: space[6],
    paddingHorizontal: space[4],
    alignItems: 'center',
    gap: space[3],

  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.baseMedium,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cardDesc: {
    ...typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronRight, Users } from "lucide-react-native";
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  radius,
  shadows,
  space,
  typography,
} from "@/shared/config/theme";

interface EmployeeEntry {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

interface EmployeesTodayProps {
  total: number;
  inOffice: number;
  left: number;
  absent: number;
  topEmployees: EmployeeEntry[];
  onPress?: () => void;
}

export function EmployeesToday({
  total,
  inOffice,
  left,
  absent,
  topEmployees,
  onPress,
}: EmployeesTodayProps) {
  const shown = topEmployees.slice(0, 5);
  const extra = total - shown.length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users
            size={iconSize.md}
            color={colors.primary}
            strokeWidth={iconStrokeWidth}
          />
          <View>
            <Text style={styles.title}>Сегодня</Text>
            <Text style={styles.subtitle}>Всего {total} сотрудников</Text>
          </View>
        </View>
        <ChevronRight
          size={iconSize.md}
          color={colors.textSecondary}
          strokeWidth={iconStrokeWidth}
        />
      </View>

      <View style={styles.counters}>
        <View
          style={[styles.counter, { backgroundColor: colors.successLight }]}
        >
          <Text style={[styles.counterNum, { color: colors.successText }]}>
            {inOffice}
          </Text>
          <Text style={[styles.counterLabel, { color: colors.successText }]}>
            В офисе
          </Text>
        </View>
        <View
          style={[styles.counter, { backgroundColor: colors.neutralLight }]}
        >
          <Text style={[styles.counterNum, { color: colors.neutralText }]}>
            {left}
          </Text>
          <Text style={[styles.counterLabel, { color: colors.neutralText }]}>
            Ушли
          </Text>
        </View>
        <View style={[styles.counter, { backgroundColor: colors.dangerLight }]}>
          <Text style={[styles.counterNum, { color: colors.dangerText }]}>
            {absent}
          </Text>
          <Text style={[styles.counterLabel, { color: colors.dangerText }]}>
            Нет
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[4],
    ...(shadows.card as object),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  title: {
    ...typography.baseMedium,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  counters: {
    flexDirection: "row",
    gap: space[2],
  },
  counter: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[2],
    alignItems: "center",
    gap: space[1],
  },
  counterNum: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    lineHeight: 30,
  },
  counterLabel: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    lineHeight: 16,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[1],
  },
  extraBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutralLight,
    alignItems: "center",
    justifyContent: "center",
  },
  extraText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.neutralText,
  },
});

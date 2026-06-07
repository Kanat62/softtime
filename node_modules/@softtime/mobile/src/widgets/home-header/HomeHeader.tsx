import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarDays, ChevronDown } from "lucide-react-native";
import { Avatar } from "@/shared/ui";
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

const WEEKDAYS_RU = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];
const MONTHS_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function formatDate(date: Date): string {
  return `${WEEKDAYS_RU[date.getDay()]}, ${date.getDate()} ${MONTHS_RU[date.getMonth()]}`;
}

interface HomeHeaderProps {
  name: string;
  avatarUrl?: string | null;
  onAvatarPress?: () => void;
}

export function HomeHeader({
  name,
  avatarUrl,
  onAvatarPress,
}: HomeHeaderProps) {
  const firstName = name.split(" ")[0];
  const dateStr = formatDate(new Date());

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.greeting}>Привет, {firstName}</Text>
        <View style={styles.dateRow}>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        <Avatar uri={avatarUrl} name={name} size={48} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    ...(shadows.card as object),
  },
  left: {
    gap: space[1],
  },
  greeting: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[1],
  },
  date: {
    ...typography.sm,
    color: colors.textSecondary,
  },
});

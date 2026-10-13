import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarDays, ChevronDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
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

const LOCALE_TAGS: Record<string, string> = {
  ru: "ru-RU",
  en: "en-US",
};

/**
 * "Вторник, 13 октября" / "Tuesday, October 13".
 * Intl отдаёт день недели со строчной буквы в русском — приводим к виду,
 * который был здесь до перевода.
 */
function formatHeaderDate(date: Date, language: string): string {
  const tag = LOCALE_TAGS[language] ?? LOCALE_TAGS.ru;
  const formatted = date.toLocaleDateString(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
  const { t, i18n } = useTranslation("home");
  const firstName = name.split(" ")[0];
  const dateStr = formatHeaderDate(new Date(), i18n.language);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.greeting}>{t("greeting", { name: firstName })}</Text>
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

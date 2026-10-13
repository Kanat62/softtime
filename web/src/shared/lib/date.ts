import i18n from "@/shared/i18n";

/**
 * Теги локалей для Intl по текущему языку интерфейса.
 * resolvedLanguage, а не language: детектор отдаёт полный тег браузера.
 */
const LOCALE_TAGS: Record<string, string> = {
  ru: "ru-RU",
  en: "en-US",
};

function localeTag(): string {
  return LOCALE_TAGS[i18n.resolvedLanguage ?? "ru"] ?? LOCALE_TAGS.ru;
}

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(localeTag(), { day: "2-digit", month: "long", year: "numeric" });
}

export { localeTag };

import type { Locale } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import i18n from "@/shared/i18n";

const LOCALES: Record<string, Locale> = { ru, en: enUS };

/**
 * Локаль date-fns по текущему языку интерфейса.
 *
 * Нужна там, где вызывается format() из date-fns: его нельзя привязать
 * к языку иначе, чем передав объект локали. Язык берётся из
 * resolvedLanguage, потому что i18n.language может быть полным тегом
 * браузера ("en-US"), а ключи локалей — по базовому языку.
 */
export function dateFnsLocale(): Locale {
  return LOCALES[i18n.resolvedLanguage ?? "ru"] ?? ru;
}

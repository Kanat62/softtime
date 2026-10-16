import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGES,
  dictionaries,
  type Language,
} from "@softtime/shared";

import ruCommon from "./locales/ru/common.json";
import ruSettings from "./locales/ru/settings.json";
import ruEmployees from "./locales/ru/employees.json";
import ruProvider from "./locales/ru/provider.json";
import ruNetworks from "./locales/ru/networks.json";
import ruAudit from "./locales/ru/audit.json";
import ruReports from "./locales/ru/reports.json";
import ruNews from "./locales/ru/news.json";
import ruQr from "./locales/ru/qr.json";
import ruRequests from "./locales/ru/requests.json";
import ruSchedules from "./locales/ru/schedules.json";
import ruAttendance from "./locales/ru/attendance.json";
import ruSubscription from "./locales/ru/subscription.json";
import ruAuth from "./locales/ru/auth.json";
import ruDashboard from "./locales/ru/dashboard.json";
import ruNav from "./locales/ru/nav.json";
import ruLegal from "./locales/ru/legal.json";
import enCommon from "./locales/en/common.json";
import enSettings from "./locales/en/settings.json";
import enEmployees from "./locales/en/employees.json";
import enProvider from "./locales/en/provider.json";
import enNetworks from "./locales/en/networks.json";
import enAudit from "./locales/en/audit.json";
import enReports from "./locales/en/reports.json";
import enNews from "./locales/en/news.json";
import enQr from "./locales/en/qr.json";
import enRequests from "./locales/en/requests.json";
import enSchedules from "./locales/en/schedules.json";
import enAttendance from "./locales/en/attendance.json";
import enSubscription from "./locales/en/subscription.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enNav from "./locales/en/nav.json";
import enLegal from "./locales/en/legal.json";

import { LANGUAGE_KEY, languageStorage } from "./language-storage";

export { languageStorage } from "./language-storage";

/**
 * Namespace:
 *  - enums, validation, errors — общий словарь из @softtime/shared (один
 *    источник с mobile и backend, чтобы тексты не разошлись); errors —
 *    текст на машинный код ошибки API, ключ = значение ErrorCode;
 *  - common, settings и по домену страницы — веб-строки,
 *    JSON в ./locales/{ru,en}/.
 */
const resources = {
  ru: {
    enums: dictionaries.ru.enums,
    validation: dictionaries.ru.validation,
    errors: dictionaries.ru.errors,
    common: ruCommon,
    settings: ruSettings,
    employees: ruEmployees,
    provider: ruProvider,
    networks: ruNetworks,
    audit: ruAudit,
    reports: ruReports,
    news: ruNews,
    qr: ruQr,
    requests: ruRequests,
    schedules: ruSchedules,
    attendance: ruAttendance,
    subscription: ruSubscription,
    auth: ruAuth,
    dashboard: ruDashboard,
    nav: ruNav,
    legal: ruLegal,
  },
  en: {
    enums: dictionaries.en.enums,
    validation: dictionaries.en.validation,
    errors: dictionaries.en.errors,
    common: enCommon,
    settings: enSettings,
    employees: enEmployees,
    provider: enProvider,
    networks: enNetworks,
    audit: enAudit,
    reports: enReports,
    news: enNews,
    qr: enQr,
    requests: enRequests,
    schedules: enSchedules,
    attendance: enAttendance,
    subscription: enSubscription,
    auth: enAuth,
    dashboard: enDashboard,
    nav: enNav,
    legal: enLegal,
  },
} as const;

i18n
  // Определяет язык: сохранённый выбор в localStorage, иначе язык браузера.
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    // Без этого ru-RU и en-US не сводятся к ru / en.
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    ns: [
      "common",
      "nav",
      "legal",
      "settings",
      "auth",
      "dashboard",
      "employees",
      "attendance",
      "schedules",
      "requests",
      "qr",
      "news",
      "reports",
      "audit",
      "networks",
      "provider",
      "subscription",
      "enums",
      "validation",
      "errors",
    ],
    defaultNS: "common",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_KEY,
      // Записью занимается changeLanguage ниже, чтобы ключ был один.
      caches: [],
    },
    interpolation: {
      // React сам экранирует вывод.
      escapeValue: false,
    },
    returnNull: false,
  });

/** Текущий язык интерфейса — его отправляем в регистрацию компании. */
export function currentLanguage(): Language {
  return (i18n.resolvedLanguage ?? i18n.language ?? FALLBACK_LANGUAGE) as Language;
}

/** Смена языка пользователем: применить и запомнить. */
export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  languageStorage.set(language);
}

export default i18n;

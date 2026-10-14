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
import ruQr from "./locales/ru/qr.json";
import ruRequests from "./locales/ru/requests.json";
import ruSchedules from "./locales/ru/schedules.json";
import ruAttendance from "./locales/ru/attendance.json";
import ruSubscription from "./locales/ru/subscription.json";
import ruAuth from "./locales/ru/auth.json";
import ruDashboard from "./locales/ru/dashboard.json";
import ruNav from "./locales/ru/nav.json";
import enCommon from "./locales/en/common.json";
import enSettings from "./locales/en/settings.json";
import enEmployees from "./locales/en/employees.json";
import enQr from "./locales/en/qr.json";
import enRequests from "./locales/en/requests.json";
import enSchedules from "./locales/en/schedules.json";
import enAttendance from "./locales/en/attendance.json";
import enSubscription from "./locales/en/subscription.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enNav from "./locales/en/nav.json";

import { LANGUAGE_KEY, languageStorage } from "./language-storage";

export { languageStorage } from "./language-storage";

/**
 * Namespace:
 *  - enums, validation — общий словарь из @softtime/shared (один источник
 *    с mobile и backend, чтобы тексты не разошлись);
 *  - common, settings и по домену страницы — веб-строки,
 *    JSON в ./locales/{ru,en}/.
 */
const resources = {
  ru: {
    enums: dictionaries.ru.enums,
    validation: dictionaries.ru.validation,
    common: ruCommon,
    settings: ruSettings,
    employees: ruEmployees,
    qr: ruQr,
    requests: ruRequests,
    schedules: ruSchedules,
    attendance: ruAttendance,
    subscription: ruSubscription,
    auth: ruAuth,
    dashboard: ruDashboard,
    nav: ruNav,
  },
  en: {
    enums: dictionaries.en.enums,
    validation: dictionaries.en.validation,
    common: enCommon,
    settings: enSettings,
    employees: enEmployees,
    qr: enQr,
    requests: enRequests,
    schedules: enSchedules,
    attendance: enAttendance,
    subscription: enSubscription,
    auth: enAuth,
    dashboard: enDashboard,
    nav: enNav,
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
      "settings",
      "auth",
      "dashboard",
      "employees",
      "attendance",
      "schedules",
      "requests",
      "qr",
      "subscription",
      "enums",
      "validation",
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

/** Смена языка пользователем: применить и запомнить. */
export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  languageStorage.set(language);
}

export default i18n;

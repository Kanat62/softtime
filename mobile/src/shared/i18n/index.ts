import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import {
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGES,
  dictionaries,
  type Language,
} from '@softtime/shared';

import ruCommon from './locales/ru/common.json';
import ruSettings from './locales/ru/settings.json';
import ruHome from './locales/ru/home.json';
import ruAttendance from './locales/ru/attendance.json';
import ruAuth from './locales/ru/auth.json';
import ruManagement from './locales/ru/management.json';
import ruNav from './locales/ru/nav.json';
import ruNews from './locales/ru/news.json';
import ruOffice from './locales/ru/office.json';
import ruProfile from './locales/ru/profile.json';
import ruRequests from './locales/ru/requests.json';
import ruSchedule from './locales/ru/schedule.json';
import ruSubscription from './locales/ru/subscription.json';
import ruErrors from './locales/ru/errors.json';
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enHome from './locales/en/home.json';
import enAttendance from './locales/en/attendance.json';
import enAuth from './locales/en/auth.json';
import enManagement from './locales/en/management.json';
import enNav from './locales/en/nav.json';
import enNews from './locales/en/news.json';
import enOffice from './locales/en/office.json';
import enProfile from './locales/en/profile.json';
import enRequests from './locales/en/requests.json';
import enSchedule from './locales/en/schedule.json';
import enSubscription from './locales/en/subscription.json';
import enErrors from './locales/en/errors.json';

import { languageStorage } from './language-storage';

export { languageStorage } from './language-storage';

/**
 * Namespace:
 *  - enums, validation — общий словарь из @softtime/shared (один источник
 *    с web и backend, чтобы тексты не разошлись);
 *  - остальные (common, nav, settings и по домену экрана) — мобильные
 *    строки, JSON в ./locales/{ru,en}/.
 */
const resources = {
  ru: {
    enums: dictionaries.ru.enums,
    validation: dictionaries.ru.validation,
    common: ruCommon,
    settings: ruSettings,
    home: ruHome,
    attendance: ruAttendance,
    auth: ruAuth,
    management: ruManagement,
    nav: ruNav,
    news: ruNews,
    office: ruOffice,
    profile: ruProfile,
    requests: ruRequests,
    schedule: ruSchedule,
    subscription: ruSubscription,
    errors: ruErrors,
  },
  en: {
    enums: dictionaries.en.enums,
    validation: dictionaries.en.validation,
    common: enCommon,
    settings: enSettings,
    home: enHome,
    attendance: enAttendance,
    auth: enAuth,
    management: enManagement,
    nav: enNav,
    news: enNews,
    office: enOffice,
    profile: enProfile,
    requests: enRequests,
    schedule: enSchedule,
    subscription: enSubscription,
    errors: enErrors,
  },
} as const;

/** Язык устройства, если он поддерживается. Иначе запасной. */
function getDeviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code ?? '')
    ? (code as Language)
    : FALLBACK_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  ns: [
    'common',
    'nav',
    'settings',
    'home',
    'auth',
    'attendance',
    'office',
    'schedule',
    'requests',
    'news',
    'profile',
    'management',
    'subscription',
    'errors',
    'enums',
    'validation',
  ],
  defaultNS: 'common',
  interpolation: {
    // React сам экранирует вывод.
    escapeValue: false,
  },
  returnNull: false,
});

/**
 * Применяет сохранённый выбор пользователя поверх языка устройства.
 * Вызывается один раз при старте; пока выбор не прочитан, приложение
 * уже работает на языке устройства, так что ждать нечего.
 */
export async function restoreSavedLanguage(): Promise<void> {
  const saved = await languageStorage.get();
  if (saved && saved !== i18n.language) {
    await i18n.changeLanguage(saved);
  }
}

/** Смена языка пользователем: применить и запомнить. */
export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  await languageStorage.set(language);
}

export default i18n;

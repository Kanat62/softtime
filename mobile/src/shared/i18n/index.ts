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
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enHome from './locales/en/home.json';

import { languageStorage } from './language-storage';

export { languageStorage } from './language-storage';

/**
 * Namespace:
 *  - enums, validation — общий словарь из @softtime/shared (один источник
 *    с web и backend, чтобы тексты не разошлись);
 *  - common, settings, home — мобильные строки (JSON рядом с этим файлом).
 */
const resources = {
  ru: {
    enums: dictionaries.ru.enums,
    validation: dictionaries.ru.validation,
    common: ruCommon,
    settings: ruSettings,
    home: ruHome,
  },
  en: {
    enums: dictionaries.en.enums,
    validation: dictionaries.en.validation,
    common: enCommon,
    settings: enSettings,
    home: enHome,
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
  ns: ['common', 'settings', 'home', 'enums', 'validation'],
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

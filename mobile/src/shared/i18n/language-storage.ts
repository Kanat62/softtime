import * as SecureStore from 'expo-secure-store';
import { SUPPORTED_LANGUAGES, type Language } from '@softtime/shared';

const LANGUAGE_KEY = 'softtime_language';

function isLanguage(value: string | null): value is Language {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Выбор языка пользователя в expo-secure-store.
 *
 * Хранилище может быть недоступно (например, на вебе или при сбросе
 * keychain), поэтому ошибки глушим: отсутствие выбора — не ошибка,
 * приложение просто берёт язык устройства.
 */
export const languageStorage = {
  async get(): Promise<Language | null> {
    try {
      const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
      return isLanguage(saved) ? saved : null;
    } catch {
      return null;
    }
  },

  async set(language: Language): Promise<void> {
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    } catch {
      // Выбор не сохранился — на текущую сессию язык всё равно применён.
    }
  },
};

import { SUPPORTED_LANGUAGES, type Language } from "@softtime/shared";

const LANGUAGE_KEY = "softtime_language";

function isLanguage(value: string | null): value is Language {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Выбор языка пользователя в localStorage.
 *
 * Доступ обёрнут в try/catch: в приватном режиме или при запрете
 * cookies/storage обращение бросает исключение. Отсутствие выбора — не
 * ошибка, тогда берётся язык браузера.
 */
export const languageStorage = {
  get(): Language | null {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_KEY);
      return isLanguage(saved) ? saved : null;
    } catch {
      return null;
    }
  },

  set(language: Language): void {
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Выбор не сохранился — на текущую сессию язык всё равно применён.
    }
  },
};

export { LANGUAGE_KEY };

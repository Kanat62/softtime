import {
  dictionaries,
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type Language,
} from '@softtime/shared';

/**
 * Перевод серверных текстов (push-уведомления) на язык получателя.
 *
 * Своя реализация, а не i18next/nestjs-i18n: нужны ровно подстановка
 * {{x}} и выбор формы множественного числа, словарь уже лежит
 * в @softtime/shared, а Intl.PluralRules встроен в Node — новых
 * зависимостей не требуется.
 */

/** Значения для подстановки. Число под ключом `count` включает плюрализацию. */
export type TrParams = Record<string, string | number>;

const PLURAL_RULES: Record<Language, Intl.PluralRules> = {
  ru: new Intl.PluralRules('ru'),
  en: new Intl.PluralRules('en'),
};

/**
 * Приводит значение из User.language к поддерживаемому языку.
 * Всё неизвестное (null, 'kk', 'ru-RU', мусор) → ru.
 */
export function resolveLanguage(value: string | null | undefined): Language {
  if (!value) return FALLBACK_LANGUAGE;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
    ? (value as Language)
    : FALLBACK_LANGUAGE;
}

/**
 * Достаёт строку по пути в словаре.
 *
 * Понимает две формы:
 *  - 'push.newEmployee.title' — точечный путь (серверные ключи);
 *  - 'validation:format.email' — форма i18next `namespace:путь`, в которой
 *    ключи лежат в zod-схемах: их читают и клиенты через i18n.exists/t().
 *    Первое двоеточие — тот же разделитель, что точка.
 */
function lookup(lang: Language, path: string): string | undefined {
  let node: unknown = dictionaries[lang];
  for (const part of path.replace(':', '.').split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Для `count` выбирает форму `<path>_<one|few|many|other>`.
 * Если формы нет — откатывается на `_other`, затем на сам `path`,
 * так что непюрализованные ключи работают с тем же вызовом.
 */
function lookupPlural(
  lang: Language,
  path: string,
  count: number | undefined,
): string | undefined {
  if (count === undefined) return lookup(lang, path);

  const category = PLURAL_RULES[lang].select(count);
  return (
    lookup(lang, `${path}_${category}`) ??
    lookup(lang, `${path}_other`) ??
    lookup(lang, path)
  );
}

/**
 * Язык из заголовка Accept-Language: берём первый тег и отбрасываем регион
 * ('en-US;q=0.9,ru' → 'en'). Всё, что не ru/en, и отсутствующий заголовок → ru.
 *
 * Отдельно от resolveLanguage: там на входе сохранённая настройка User.language,
 * где 'en-US' — мусор, а здесь это нормальный браузерный тег.
 */
export function languageFromAcceptHeader(
  header: string | string[] | undefined,
): Language {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) return FALLBACK_LANGUAGE;

  const firstTag = raw.split(',')[0].split(';')[0].trim().toLowerCase();
  const base = firstTag.split('-')[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base)
    ? (base as Language)
    : FALLBACK_LANGUAGE;
}

/** Подставляет {{key}} из params. Неизвестные плейсхолдеры остаются как есть. */
function interpolate(template: string, params: TrParams): string {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => {
    const value = params[key];
    return value === undefined ? whole : String(value);
  });
}

/**
 * Переводит `key` на `lang` и подставляет `params`.
 *
 * Язык вне ru/en → ru. Если ключа нет ни в запрошенном языке, ни в ru,
 * возвращается сам ключ: лучше увидеть 'push.foo.title' в уведомлении,
 * чем пустую строку, — и это сразу заметно в тестах.
 */
export function tr(
  lang: string | null | undefined,
  key: string,
  params: TrParams = {},
): string {
  const language = resolveLanguage(lang);
  const count = typeof params.count === 'number' ? params.count : undefined;

  const template =
    lookupPlural(language, key, count) ??
    (language === FALLBACK_LANGUAGE
      ? undefined
      : lookupPlural(FALLBACK_LANGUAGE, key, count));

  if (template === undefined) return key;
  return interpolate(template, params);
}

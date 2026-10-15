/**
 * Публичный API общего словаря.
 *
 * Формат — .ts-модули, а не JSON: так словарь гарантированно попадает
 * в packages/shared/dist, откуда его читает backend (его tsconfig
 * указывает paths на ../packages/shared/dist). Web (Vite) и mobile
 * (Metro) читают src напрямую.
 */
import { ru } from './ru';
import { en } from './en';
import type { Dictionary } from './ru';

export { ru } from './ru';
export { en } from './en';
export type { Dictionary, ErrorMessages } from './ru';

/** Поддерживаемые языки. Запасной — ru. */
export const SUPPORTED_LANGUAGES = ['ru', 'en'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: Language = 'ru';

/** Словари по языку — для подключения в i18next на следующих этапах. */
export const dictionaries: Record<Language, Dictionary> = { ru, en };

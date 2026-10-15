import { UserStatus, type Language } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';
import i18n from '@/shared/i18n';

/**
 * Язык push-уведомлений хранится на сервере (User.language) — бэкенд
 * формирует текст уведомления на нём, потому что в момент отправки
 * приложение может быть закрыто.
 */
export async function updateMyLanguageApi(
  language: Language,
): Promise<{ id: string; language: Language }> {
  const { data } = await apiClient.patch<{ id: string; language: Language }>(
    '/users/me/language',
    { language },
  );
  return data;
}

/** Текущий язык приложения — его же отправляем при регистрации. */
export function currentAppLanguage(): Language {
  return (i18n.resolvedLanguage ?? i18n.language) as Language;
}

/**
 * Приводит серверный язык к языку приложения, если они разошлись.
 *
 * Тихая операция: ошибку глотаем — промах не критичен, push просто
 * придёт на прежнем языке, а следующий логин или переключение в Профиле
 * попробуют снова. Тоста быть не должно.
 *
 * PENDING и BLOCKED пропускаем: их режет StatusGuard (403), для них язык
 * уже уехал на сервер при регистрации.
 */
export async function syncMyLanguage(
  serverLanguage: Language | null | undefined,
  status: UserStatus | string | null | undefined,
): Promise<void> {
  if (status !== UserStatus.ACTIVE && status !== UserStatus.WARNING) return;

  const appLanguage = currentAppLanguage();
  if (serverLanguage === appLanguage) return;

  try {
    await updateMyLanguageApi(appLanguage);
  } catch {
    // Намеренно молча — см. комментарий выше.
  }
}

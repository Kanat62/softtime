import { Linking } from 'react-native';
import i18n from '@/shared/i18n';
import { env } from '@/shared/config/env';

/**
 * Ссылка на политику конфиденциальности на сайте.
 *
 * Своей страницы в приложении нет — открываем публичную /privacy веб-панели
 * и передаём текущий язык приложения через ?lang, чтобы страница открылась
 * на нём, а не на языке браузера устройства.
 *
 * Возвращает null, если EXPO_PUBLIC_WEB_PANEL_URL не задан: тогда ссылку
 * в интерфейсе нужно скрыть, а не показывать сломанную.
 */
export function privacyPolicyUrl(): string | null {
  if (!env.webPanelUrl) return null;
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const base = env.webPanelUrl.replace(/\/+$/, '');
  return `${base}/privacy?lang=${encodeURIComponent(lang)}`;
}

/** Открывает политику во внешнем браузере. Ошибку глушит: это не критично. */
export async function openPrivacyPolicy(): Promise<void> {
  const url = privacyPolicyUrl();
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    // Браузер недоступен — молча ничего не делаем.
  }
}

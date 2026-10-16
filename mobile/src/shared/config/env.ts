const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Адрес веб-панели (ссылка «Открыть веб-панель» в Профиле).
 * Задаётся переменной EXPO_PUBLIC_WEB_PANEL_URL (eas.json / mobile/.env).
 * Если не задан — пункт в Профиле скрывается, а не открывает пустой адрес.
 */
const WEB_PANEL_URL = process.env.EXPO_PUBLIC_WEB_PANEL_URL?.trim() || null;

export const env = {
  apiBaseUrl: API_BASE_URL,
  webPanelUrl: WEB_PANEL_URL,
} as const;

export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1",
  /**
   * Адрес для запросов об удалении данных (страница /delete-account).
   * Единственное место, где хранится адрес: страница /delete-account берёт
   * его отсюда. По умолчанию — общий ящик поддержки, переопределяется
   * переменной VITE_SUPPORT_EMAIL.
   */
  supportEmail:
    (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || "softtime.support@gmail.com",
};

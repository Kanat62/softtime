export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1",
  /**
   * Адрес для запросов об удалении данных (страница /delete-account).
   * Заглушка до появления настоящего адреса — задаётся VITE_SUPPORT_EMAIL.
   */
  supportEmail:
    (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || "privacy@example.com",
};

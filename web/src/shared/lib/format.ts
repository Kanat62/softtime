import i18n from "@/shared/i18n";

export function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hoursShort = i18n.t("common:duration.hoursShort");
  const minutesShort = i18n.t("common:duration.minutesShort");
  return `${h}${hoursShort} ${m.toString().padStart(2, "0")}${minutesShort}`;
}

/**
 * Суммы и валюта по смыслу НЕ меняются: локаль форматирования числа
 * остаётся ru-RU, currency — как передали. Правка валют и цен вне
 * рамок перевода интерфейса (docs/PLAN_i18n.md).
 */
export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(amount);
}

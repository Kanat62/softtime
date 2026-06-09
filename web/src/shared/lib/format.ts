export function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}ч ${m.toString().padStart(2, "0")}м`;
}
export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(amount);
}

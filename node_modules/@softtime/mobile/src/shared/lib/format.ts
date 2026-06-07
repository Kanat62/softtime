export function formatCurrency(amount: number, currency = 'KZT'): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount);
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

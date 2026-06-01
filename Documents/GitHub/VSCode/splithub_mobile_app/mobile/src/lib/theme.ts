export const colors = {
  accent: '#F59E0B',
  accentDark: '#B45309',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#15803D',
  warning: '#92400E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export function formatPrice(value: number) {
  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}

import { getCurrencySymbol } from './constants';

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
};

export const formatCompact = (amount: number, currency = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
  return `${symbol}${formatted}`;
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatMonthYear = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const todayISO = (): string => new Date().toISOString().split('T')[0];

export const currentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const isSameMonth = (date: string, monthKey: string): boolean => {
  const d = new Date(date);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return key === monthKey;
};

export const getMonthRange = (monthKey: string): { start: Date; end: Date } => {
  const [y, m] = monthKey.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { start, end };
};

export const daysInMonth = (date = new Date()): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const daysPassedInMonth = (date = new Date()): number => {
  return Math.min(date.getDate(), daysInMonth(date));
};

export const cn = (...classes: (string | false | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ');

export const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const round2 = (n: number): number => Math.round(n * 100) / 100;

import {
  Home, ArrowLeftRight, Wallet, FileText, Sparkles, User, Settings,
  TrendingUp, TrendingDown, PiggyBank, Target, BarChart3, ShoppingCart,
  Car, UtensilsCrossed, Plane, Home as HomeIcon, HeartPulse, Film,
  Briefcase, Gift, Zap, BookOpen, Dumbbell, Wrench, Repeat, CreditCard, Receipt,
  type LucideIcon,
} from 'lucide-react';

export type NavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export const dashboardNav: NavLink[] = [
  { to: '/app', label: 'Dashboard', icon: Home },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/recurring', label: 'Recurring', icon: Repeat },
  { to: '/app/budget', label: 'Budget', icon: Wallet },
  { to: '/app/goals', label: 'Savings Goals', icon: Target },
  { to: '/app/investments', label: 'Investments', icon: TrendingUp },
  { to: '/app/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/ai-assistant', label: 'AI Advisor', icon: Sparkles },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export type CategoryMeta = {
  name: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  type: 'expense' | 'income' | 'both';
};

export const categories: CategoryMeta[] = [
  { name: 'Food', icon: UtensilsCrossed, color: '#f59e0b', gradient: 'gradient-warm', type: 'expense' },
  { name: 'Food & Dining', icon: UtensilsCrossed, color: '#f59e0b', gradient: 'gradient-warm', type: 'expense' },
  { name: 'Shopping', icon: ShoppingCart, color: '#ec4899', gradient: 'gradient-violet', type: 'expense' },
  { name: 'Travel', icon: Plane, color: '#06b6d4', gradient: 'gradient-accent', type: 'expense' },
  { name: 'Bills', icon: Receipt, color: '#eab308', gradient: 'gradient-warm', type: 'expense' },
  { name: 'Entertainment', icon: Film, color: '#14b8a6', gradient: 'gradient-brand', type: 'expense' },
  { name: 'Healthcare', icon: HeartPulse, color: '#ef4444', gradient: 'gradient-warm', type: 'expense' },
  { name: 'Education', icon: BookOpen, color: '#6366f1', gradient: 'gradient-violet', type: 'expense' },
  { name: 'Housing', icon: HomeIcon, color: '#8b5cf6', gradient: 'gradient-violet', type: 'expense' },
  { name: 'Transport', icon: Car, color: '#3b82f6', gradient: 'gradient-accent', type: 'expense' },
  { name: 'Utilities', icon: Zap, color: '#eab308', gradient: 'gradient-warm', type: 'expense' },
  { name: 'Fitness', icon: Dumbbell, color: '#22c55e', gradient: 'gradient-brand', type: 'expense' },
  { name: 'Other', icon: Wrench, color: '#64748b', gradient: 'gradient-cool', type: 'expense' },
  { name: 'Salary', icon: Briefcase, color: '#19b97e', gradient: 'gradient-brand', type: 'income' },
  { name: 'Freelance', icon: Briefcase, color: '#0d9a66', gradient: 'gradient-brand', type: 'income' },
  { name: 'Investment', icon: TrendingUp, color: '#3b82f6', gradient: 'gradient-accent', type: 'income' },
  { name: 'Gift', icon: Gift, color: '#ec4899', gradient: 'gradient-violet', type: 'income' },
];

export const expenseCategories = categories.filter((c) => c.type === 'expense');
export const incomeCategories = categories.filter((c) => c.type === 'income');

export const categoryMap = categories.reduce((acc, c) => {
  acc[c.name] = c;
  return acc;
}, {} as Record<string, CategoryMeta>);

export const getCategoryMeta = (name: string): CategoryMeta =>
  categoryMap[name] ?? { name, icon: Wrench, color: '#64748b', gradient: 'gradient-cool', type: 'expense' };

export const summaryIcons = {
  income: TrendingUp,
  expense: TrendingDown,
  savings: PiggyBank,
  investments: BarChart3,
  budget: Wallet,
  goal: Target,
};

export const currencies = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

export const currencyMap = currencies.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {} as Record<string, (typeof currencies)[number]>);

export const getCurrencySymbol = (code: string): string => currencyMap[code]?.symbol ?? '$';

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ja', label: '日本語' },
];

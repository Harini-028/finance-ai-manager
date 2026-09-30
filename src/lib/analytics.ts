import type { Transaction, Budget } from './supabase';
import { round2, daysPassedInMonth, daysInMonth, currentMonthKey, isSameMonth } from './format';

export type TransactionRow = Transaction & { amount: number };

export type Summary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  investments: number;
  monthlyBudgetTotal: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUtilization: number;
  aiScore: number;
};

export const computeSummary = (
  transactions: TransactionRow[],
  budgets: Budget[],
  monthKey = currentMonthKey(),
): Summary => {
  const monthTx = transactions.filter((t) => isSameMonth(t.date, monthKey));
  const totalIncome = round2(monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0));
  const totalExpense = round2(monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  const savings = round2(totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? round2((savings / totalIncome) * 100) : 0;

  const investments = round2(
    monthTx
      .filter((t) => t.type === 'income' && t.category === 'Investment')
      .reduce((s, t) => s + t.amount, 0),
  );

  const monthlyBudgets = budgets.filter((b) => b.period === 'monthly' && b.month === monthKey);
  const monthlyBudgetTotal = round2(monthlyBudgets.reduce((s, b) => s + b.amount, 0));

  const spentByCategory = new Map<string, number>();
  monthTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      spentByCategory.set(t.category, (spentByCategory.get(t.category) ?? 0) + t.amount);
    });

  const budgetUsed = round2(
    monthlyBudgets.reduce((s, b) => {
      const spent = spentByCategory.get(b.category) ?? 0;
      return s + Math.min(spent, b.amount);
    }, 0),
  );
  const budgetRemaining = round2(monthlyBudgetTotal - budgetUsed);
  const budgetUtilization = monthlyBudgetTotal > 0 ? round2((budgetUsed / monthlyBudgetTotal) * 100) : 0;

  const aiScore = computeAiScore({
    savingsRate,
    budgetUtilization,
    hasBudget: monthlyBudgetTotal > 0,
    totalIncome,
  });

  return {
    totalIncome,
    totalExpense,
    savings,
    savingsRate,
    investments,
    monthlyBudgetTotal,
    budgetUsed,
    budgetRemaining,
    budgetUtilization,
    aiScore,
  };
};

export const computeAiScore = (params: {
  savingsRate: number;
  budgetUtilization: number;
  hasBudget: boolean;
  totalIncome: number;
}): number => {
  let score = 50;
  if (params.savingsRate >= 20) score += 25;
  else if (params.savingsRate >= 10) score += 15;
  else if (params.savingsRate >= 0) score += 5;
  else score -= 10;

  if (params.hasBudget) {
    if (params.budgetUtilization <= 80) score += 15;
    else if (params.budgetUtilization <= 100) score += 5;
    else score -= 10;
  } else {
    score -= 5;
  }

  if (params.totalIncome > 0) score += 5;
  return clampScore(score);
};

const clampScore = (n: number): number => Math.min(Math.max(Math.round(n), 0), 100);

export type CategorySpending = { category: string; amount: number; count: number };

export const spendingByCategory = (transactions: TransactionRow[], monthKey = currentMonthKey()): CategorySpending[] => {
  const map = new Map<string, { amount: number; count: number }>();
  transactions
    .filter((t) => t.type === 'expense' && isSameMonth(t.date, monthKey))
    .forEach((t) => {
      const cur = map.get(t.category) ?? { amount: 0, count: 0 };
      cur.amount += t.amount;
      cur.count += 1;
      map.set(t.category, cur);
    });
  return Array.from(map.entries())
    .map(([category, v]) => ({ category, amount: round2(v.amount), count: v.count }))
    .sort((a, b) => b.amount - a.amount);
};

export type DailyPoint = { date: string; label: string; income: number; expense: number };

export const dailyTrend = (transactions: TransactionRow[], monthKey = currentMonthKey()): DailyPoint[] => {
  const [y, m] = monthKey.split('-').map(Number);
  const total = daysInMonth(new Date(y, m - 1));
  const points: DailyPoint[] = [];
  for (let day = 1; day <= total; day++) {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dayTx = transactions.filter((t) => t.date === dateStr);
    points.push({
      date: dateStr,
      label: String(day),
      income: round2(dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)),
      expense: round2(dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)),
    });
  }
  return points;
};

export type MonthlyComparison = { month: string; label: string; income: number; expense: number; savings: number };

export const monthlyComparison = (transactions: TransactionRow[], months = 6): MonthlyComparison[] => {
  const now = new Date();
  const result: MonthlyComparison[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter((t) => isSameMonth(t.date, key));
    const income = round2(monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0));
    const expense = round2(monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
    result.push({
      month: key,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      income,
      expense,
      savings: round2(income - expense),
    });
  }
  return result;
};

export type Insight = {
  id: string;
  type: 'positive' | 'warning' | 'negative' | 'info' | 'tip';
  title: string;
  message: string;
  icon: string;
};

export const generateInsights = (
  transactions: TransactionRow[],
  budgets: Budget[],
  monthKey = currentMonthKey(),
): Insight[] => {
  const insights: Insight[] = [];
  const summary = computeSummary(transactions, budgets, monthKey);
  const catSpending = spendingByCategory(transactions, monthKey);
  const now = new Date();
  const passed = daysPassedInMonth(now);
  const total = daysInMonth(now);
  const monthFraction = passed / total;

  if (summary.savingsRate >= 20) {
    insights.push({
      id: 'savings-good',
      type: 'positive',
      title: 'Strong savings rate',
      message: `You're saving ${summary.savingsRate}% of your income this month — well above the recommended 20%. Keep it up!`,
      icon: 'trending-up',
    });
  } else if (summary.savingsRate > 0) {
    insights.push({
      id: 'savings-ok',
      type: 'info',
      title: 'Savings rate could improve',
      message: `Your savings rate is ${summary.savingsRate}%. Aim for at least 20% to build long-term financial resilience.`,
      icon: 'target',
    });
  } else if (summary.totalExpense > 0) {
    insights.push({
      id: 'savings-negative',
      type: 'negative',
      title: 'Spending exceeds income',
      message: `You've spent more than you earned this month. Review discretionary categories to get back on track.`,
      icon: 'alert-triangle',
    });
  }

  if (summary.monthlyBudgetTotal > 0) {
    if (summary.budgetUtilization > 90) {
      insights.push({
        id: 'budget-high',
        type: 'warning',
        title: 'Budget nearly exhausted',
        message: `You've used ${summary.budgetUtilization}% of your monthly budget with ${(1 - monthFraction) * 100 | 0}% of the month remaining. Slow down spending to stay on track.`,
        icon: 'wallet',
      });
    } else if (summary.budgetUtilization > 70 && summary.budgetUtilization <= 90) {
      insights.push({
        id: 'budget-mid',
        type: 'info',
        title: 'Budget on track',
        message: `Budget utilization is at ${summary.budgetUtilization}%, pacing well for day ${passed} of ${total}.`,
        icon: 'gauge',
      });
    } else {
      insights.push({
        id: 'budget-good',
        type: 'positive',
        title: 'Well under budget',
        message: `Only ${summary.budgetUtilization}% of your budget used. You're in great shape this month.`,
        icon: 'check-circle',
      });
    }
  }

  const monthlyBudgets = budgets.filter((b) => b.period === 'monthly' && b.month === monthKey);
  monthlyBudgets.forEach((b) => {
    const spent = catSpending.find((c) => c.category === b.category)?.amount ?? 0;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    if (pct > 100) {
      insights.push({
        id: `over-${b.category}`,
        type: 'negative',
        title: `${b.category} over budget`,
        message: `You've spent ${Math.round(pct)}% of your ${b.category} budget (${Math.round(pct - 100)}% over). Consider trimming this category next month.`,
        icon: 'trending-down',
      });
    }
  });

  if (catSpending.length > 0) {
    const top = catSpending[0];
    const prevMonthKey = (() => {
      const [y, m] = monthKey.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const prevSpent = transactions
      .filter((t) => t.type === 'expense' && t.category === top.category && isSameMonth(t.date, prevMonthKey))
      .reduce((s, t) => s + t.amount, 0);
    if (prevSpent > 0) {
      const change = ((top.amount - prevSpent) / prevSpent) * 100;
      if (change > 20) {
        insights.push({
          id: `spend-up-${top.category}`,
          type: 'warning',
          title: `${top.category} spending increased`,
          message: `Your ${top.category} spending is up ${Math.round(change)}% compared to last month. Review recent transactions to spot the cause.`,
          icon: 'trending-up',
        });
      } else if (change < -15) {
        insights.push({
          id: `spend-down-${top.category}`,
          type: 'positive',
          title: `${top.category} spending decreased`,
          message: `Nice work — your ${top.category} spending dropped ${Math.round(Math.abs(change))}% versus last month.`,
          icon: 'trending-down',
        });
      }
    }
  }

  if (summary.savings > 0 && summary.savingsRate >= 10) {
    const suggestedInvest = round2(summary.savings * 0.4);
    insights.push({
      id: 'invest-suggestion',
      type: 'tip',
      title: 'Consider investing your surplus',
      message: `You have ${summary.savings} in surplus this month. Investing ~${suggestedInvest} (40% of savings) could accelerate long-term wealth growth.`,
      icon: 'lightbulb',
    });
  }

  insights.push({
    id: 'monthly-summary',
    type: 'info',
    title: 'Monthly financial summary',
    message: `Income: ${summary.totalIncome} · Expenses: ${summary.totalExpense} · Net savings: ${summary.savings} · Budget used: ${summary.budgetUtilization}% · AI Score: ${summary.aiScore}/100.`,
    icon: 'file-text',
  });

  return insights;
};

export const aiScoreLabel = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: 'Excellent', color: '#19b97e' };
  if (score >= 65) return { label: 'Good', color: '#40d39b' };
  if (score >= 50) return { label: 'Fair', color: '#f59e0b' };
  if (score >= 35) return { label: 'Needs Work', color: '#f97316' };
  return { label: 'At Risk', color: '#ef4444' };
};

export const projectedMonthEnd = (transactions: TransactionRow[], monthKey = currentMonthKey()): number => {
  const passed = daysPassedInMonth();
  const total = daysInMonth();
  const monthTx = transactions.filter((t) => t.type === 'expense' && isSameMonth(t.date, monthKey));
  const spent = monthTx.reduce((s, t) => s + t.amount, 0);
  if (passed === 0) return 0;
  return round2((spent / passed) * total);
};

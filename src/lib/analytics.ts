import type { Transaction, Budget } from './supabase';
import { round2, daysPassedInMonth, daysInMonth, currentMonthKey, isSameMonth } from './format';

export type TransactionRow = Transaction & { amount: number };

export type Summary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  expenseRatio: number;
  investments: number;
  monthlyBudgetTotal: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUtilization: number;
  aiScore: number;
  isInsufficientData: boolean;
};

export const computeSummary = (
  transactions: TransactionRow[],
  budgets: Budget[],
  monthKey = currentMonthKey(),
  investmentsTotal = 0,
): Summary => {
  const monthTx = transactions.filter((t) => isSameMonth(t.date, monthKey));
  const totalIncome = round2(monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0));
  const totalExpense = round2(monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  const savings = round2(totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? round2((savings / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? round2((totalExpense / totalIncome) * 100) : (totalExpense > 0 ? 100 : 0);

  const investments = investmentsTotal > 0
    ? round2(investmentsTotal)
    : round2(
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
  const budgetRemaining = Math.max(0, round2(monthlyBudgetTotal - budgetUsed));
  const budgetUtilization = monthlyBudgetTotal > 0 ? round2((budgetUsed / monthlyBudgetTotal) * 100) : 0;

  const isInsufficientData = transactions.length === 0;

  const aiScore = computeAiScore({
    savingsRate,
    expenseRatio,
    budgetUtilization,
    hasBudget: monthlyBudgetTotal > 0,
    totalIncome,
    totalExpense,
    investments,
    hasTransactions: transactions.length > 0,
  });

  return {
    totalIncome,
    totalExpense,
    savings,
    savingsRate,
    expenseRatio,
    investments,
    monthlyBudgetTotal,
    budgetUsed,
    budgetRemaining,
    budgetUtilization,
    aiScore,
    isInsufficientData,
  };
};

export const computeAiScore = (params: {
  savingsRate: number;
  expenseRatio?: number;
  budgetUtilization: number;
  hasBudget: boolean;
  totalIncome: number;
  totalExpense?: number;
  investments?: number;
  hasTransactions?: boolean;
}): number => {
  if (params.hasTransactions === false || (params.totalIncome === 0 && (params.totalExpense || 0) === 0)) {
    return 0;
  }

  let score = 0;

  // 1. Savings Rate (up to 30 pts)
  if (params.totalIncome > 0) {
    if (params.savingsRate >= 25) score += 30;
    else if (params.savingsRate >= 15) score += 22;
    else if (params.savingsRate >= 5) score += 14;
    else if (params.savingsRate >= 0) score += 6;
  } else if ((params.totalExpense || 0) === 0) {
    score += 15;
  }

  // 2. Expense Discipline (up to 25 pts)
  const ratio = params.expenseRatio ?? (params.totalIncome > 0 ? ((params.totalExpense || 0) / params.totalIncome) * 100 : 100);
  if (params.totalIncome > 0) {
    if (ratio <= 50) score += 25;
    else if (ratio <= 70) score += 20;
    else if (ratio <= 85) score += 12;
    else score += 4;
  } else {
    score += (params.totalExpense || 0) === 0 ? 15 : 5;
  }

  // 3. Budget Adherence (up to 25 pts)
  if (params.hasBudget) {
    if (params.budgetUtilization <= 80) score += 25;
    else if (params.budgetUtilization <= 100) score += 18;
    else score += 5;
  } else {
    score += 12;
  }

  // 4. Wealth Buffer (up to 20 pts)
  if ((params.investments || 0) > 0) {
    score += 20;
  } else {
    score += 5;
  }

  return clampScore(score);
};

const clampScore = (n: number): number => Math.min(Math.max(Math.round(n), 0), 100);

export type CategorySpending = { category: string; amount: number; count: number; percentage: number };

export const spendingByCategory = (transactions: TransactionRow[], monthKey = currentMonthKey()): CategorySpending[] => {
  const map = new Map<string, { amount: number; count: number }>();
  let total = 0;
  transactions
    .filter((t) => t.type === 'expense' && isSameMonth(t.date, monthKey))
    .forEach((t) => {
      const cur = map.get(t.category) ?? { amount: 0, count: 0 };
      cur.amount += t.amount;
      cur.count += 1;
      total += t.amount;
      map.set(t.category, cur);
    });

  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      amount: round2(v.amount),
      count: v.count,
      percentage: total > 0 ? round2((v.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export type DailyPoint = { date: string; label: string; income: number; expense: number };

export const dailyTrend = (transactions: TransactionRow[], monthKey = currentMonthKey()): DailyPoint[] => {
  const [y, m] = monthKey.split('-').map(Number);
  const total = daysInMonth(new Date(y, m - 1));
  const points: DailyPoint[] = [];
  for (let day = 1; day <= total; day++) {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dayTx = transactions.filter((t) => t.date && t.date.slice(0, 10) === dateStr);
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

  if (summary.totalIncome === 0 && summary.totalExpense > 0) {
    insights.push({
      id: 'no-income-recorded',
      type: 'warning',
      title: 'No income logged this month',
      message: `You've recorded ${summary.totalExpense} in expenses with zero income logged. Add your salary or freelance earnings.`,
      icon: 'alert-triangle',
    });
  } else if (summary.savingsRate >= 20) {
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
        message: `You've used ${summary.budgetUtilization}% of your monthly budget with ${(1 - monthFraction) * 100 | 0}% of the month remaining.`,
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
        message: `You've spent ${Math.round(pct)}% of your ${b.category} budget (${Math.round(pct - 100)}% over).`,
        icon: 'trending-down',
      });
    }
  } );

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
          message: `Your ${top.category} spending is up ${Math.round(change)}% compared to last month. Review recent transactions.`,
          icon: 'trending-up',
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

  return insights;
};

export const aiScoreLabel = (score: number, isInsufficientData = false): { label: string; color: string; grade: string } => {
  if (isInsufficientData || score === 0) {
    return { label: 'Setup Needed', color: '#94a3b8', grade: 'N/A' };
  }
  if (score >= 80) return { label: 'Excellent', color: '#10b981', grade: 'A+' };
  if (score >= 65) return { label: 'Good', color: '#34d399', grade: 'B' };
  if (score >= 50) return { label: 'Fair', color: '#f59e0b', grade: 'C' };
  if (score >= 35) return { label: 'Needs Work', color: '#f97316', grade: 'D' };
  return { label: 'At Risk', color: '#ef4444', grade: 'F' };
};

export const projectedMonthEnd = (transactions: TransactionRow[], monthKey = currentMonthKey()): number => {
  const passed = daysPassedInMonth();
  const total = daysInMonth();
  const monthTx = transactions.filter((t) => t.type === 'expense' && isSameMonth(t.date, monthKey));
  const spent = monthTx.reduce((s, t) => s + t.amount, 0);
  if (passed === 0) return 0;
  return round2((spent / passed) * total);
};

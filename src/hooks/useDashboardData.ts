import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Transaction, Budget, SavingsGoal } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { currentMonthKey } from '../lib/format';

export type InvestmentItem = {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  type: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  created_at: string;
};

export type DashboardSummaryData = {
  selectedMonth: string;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
    expenseRatio: number;
    totalInvestments: number;
    investmentsCount: number;
    totalBudget: number;
    budgetSpent: number;
    remainingBudget: number;
    budgetUtilization: number;
    totalSavingsGoals: number;
    financialHealth: {
      score: number;
      label: string;
      grade: string;
      color: string;
      isInsufficientData: boolean;
      breakdown: {
        factor: string;
        scoreContribution: number;
        maxScore: number;
        status: 'positive' | 'warning' | 'negative';
        reason: string;
      }[];
      recommendations: string[];
    };
  };
  momComparison: {
    hasPrevData: boolean;
    prevMonthStr: string;
    prevIncome: number;
    prevExpense: number;
    prevSavings: number;
    incomeChangePct: number | null;
    expenseChangePct: number | null;
    savingsChangePct: number | null;
  };
  predictions: {
    predictedExpense: number;
    predictedSavings: number;
    method: string;
    confidence: string;
    insightText: string;
    riskCategories: {
      category: string;
      amount: number;
      riskLevel: string;
      reason: string;
    }[];
    isInsufficientData: boolean;
  };
  smartAlerts: {
    id: string;
    type: 'warning' | 'danger' | 'info' | 'success';
    category: string;
    title: string;
    message: string;
    actionLink?: string;
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  budgetComparison: {
    id: string;
    category: string;
    allocated: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'normal' | 'warning' | 'exceeded';
  }[];
  historicalTrend: {
    month: string;
    label: string;
    income: number;
    expense: number;
    savings: number;
  }[];
  recentTransactions: Transaction[];
};

export type DashboardData = {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  investments: InvestmentItem[];
  dashboardSummary: DashboardSummaryData | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<{ error: string | null }>;
  deleteTransaction: (id: string) => Promise<{ error: string | null }>;
  upsertBudget: (b: Partial<Budget> & { category: string; amount: number; period: Budget['period'] }) => Promise<{ error: string | null }>;
  deleteBudget: (id: string) => Promise<{ error: string | null }>;
  upsertGoal: (g: Partial<SavingsGoal> & { name: string; target_amount: number }) => Promise<{ error: string | null }>;
  deleteGoal: (id: string) => Promise<{ error: string | null }>;
};

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [dashRes, txRes, budgetRes, goalRes, invRes] = await Promise.allSettled([
        api.get(`/dashboard?month=${selectedMonth}`),
        api.get('/transactions'),
        api.get(`/budgets?month=${selectedMonth}`),
        api.get('/savings'),
        api.get('/investments'),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
        setDashboardSummary(dashRes.value.data.data);
      }

      if (txRes.status === 'fulfilled' && txRes.value.data.data) {
        const txList: Transaction[] = txRes.value.data.data.map((t: any) => ({
          id: t.id || t._id,
          user_id: t.userId || t.user_id || user.id,
          type: t.type,
          amount: Number(t.amount) || 0,
          category: t.category,
          description: t.description || '',
          date: t.date ? new Date(t.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          created_at: t.createdAt || t.created_at || new Date().toISOString(),
        }));
        setTransactions(txList);
      }

      if (budgetRes.status === 'fulfilled' && budgetRes.value.data.data) {
        const budgetList: Budget[] = budgetRes.value.data.data.map((b: any) => ({
          id: b.id || b._id,
          user_id: b.userId || b.user_id || user.id,
          category: b.category,
          amount: Number(b.amount) || 0,
          spent: Number(b.spent) || 0,
          period: b.period || 'monthly',
          month: b.month,
          created_at: b.createdAt || b.created_at || new Date().toISOString(),
        }));
        setBudgets(budgetList);
      }

      if (goalRes.status === 'fulfilled' && goalRes.value.data.data) {
        const goalList: SavingsGoal[] = goalRes.value.data.data.map((g: any) => ({
          id: g.id || g._id,
          user_id: g.userId || g.user_id || user.id,
          name: g.goalName || g.name,
          target_amount: Number(g.targetAmount || g.target_amount) || 0,
          current_amount: Number(g.currentAmount || g.current_amount) || 0,
          target_date: g.deadline || g.target_date || null,
          created_at: g.createdAt || g.created_at || new Date().toISOString(),
        }));
        setGoals(goalList);
      }

      if (invRes.status === 'fulfilled' && invRes.value.data.data) {
        const invList: InvestmentItem[] = invRes.value.data.data.map((i: any) => ({
          id: i.id || i._id,
          user_id: i.userId || i.user_id || user.id,
          symbol: i.symbol,
          name: i.name,
          type: i.type,
          shares: Number(i.shares) || 0,
          purchase_price: Number(i.purchasePrice || i.purchase_price) || 0,
          current_price: Number(i.currentPrice || i.current_price) || 0,
          purchase_date: i.purchaseDate || i.purchase_date,
          created_at: i.createdAt || i.created_at || new Date().toISOString(),
        }));
        setInvestments(invList);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addTransaction: DashboardData['addTransaction'] = async (t) => {
    try {
      const res = await api.post('/transactions', t);
      if (res.data.success) {
        await refetch();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to add transaction' };
    } catch (e: any) {
      return { error: e.response?.data?.message || e.message || 'Failed to add transaction' };
    }
  };

  const updateTransaction: DashboardData['updateTransaction'] = async (id, updates) => {
    try {
      const res = await api.put(`/transactions/${id}`, updates);
      if (res.data.success) {
        await refetch();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to update transaction' };
    } catch (e: any) {
      return { error: e.response?.data?.message || e.message || 'Failed to update transaction' };
    }
  };

  const deleteTransaction: DashboardData['deleteTransaction'] = async (id) => {
    try {
      const res = await api.delete(`/transactions/${id}`);
      if (res.data.success) {
        await refetch();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to delete transaction' };
    } catch (e: any) {
      return { error: e.response?.data?.message || e.message || 'Failed to delete transaction' };
    }
  };

  const upsertBudget: DashboardData['upsertBudget'] = async (b) => {
    try {
      const month = b.month || selectedMonth || currentMonthKey();
      const payload = {
        category: b.category,
        amount: b.amount,
        period: b.period || 'monthly',
        month,
      };

      const res = b.id
        ? await api.put(`/budgets/${b.id}`, payload)
        : await api.post('/budgets', payload);

      if (res.data.success) {
        await refetch();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to save budget' };
    } catch (e: any) {
      return { error: e.response?.data?.message || e.message || 'Failed to save budget' };
    }
  };

  const deleteBudget: DashboardData['deleteBudget'] = async (id) => {
    try {
      const res = await api.delete(`/budgets/${id}`);
      if (res.data.success) {
        await refetch();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to delete budget' };
    } catch (e: any) {
      return { error: e.response?.data?.message || e.message || 'Failed to delete budget' };
    }
  };

  const upsertGoal: DashboardData['upsertGoal'] = async (g) => {
    try {
      const payload = {
        goalName: g.name,
        name: g.name,
        targetAmount: g.target_amount,
        target_amount: g.target_amount,
        currentAmount: g.current_amount || 0,
        current_amount: g.current_amount || 0,
        deadline: g.target_date,
        target_date: g.target_date,
      };

      const res = g.id
        ? await api.put(`/savings/${g.id}`, payload)
        : await api.post('/savings', payload);

      if (res.data.success) {
        await refetch();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to save savings goal' };
    } catch (e: any) {
      return { error: e.response?.data?.message || e.message || 'Failed to save savings goal' };
    }
  };

  const deleteGoal: DashboardData['deleteGoal'] = async (id) => {
    try {
      const res = await api.delete(`/savings/${id}`);
      if (res.data.success) {
        await refetch();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to delete goal' };
    } catch (e: any) {
      return { error: e.response?.data?.message || e.message || 'Failed to delete goal' };
    }
  };

  return {
    transactions,
    budgets,
    goals,
    investments,
    dashboardSummary,
    selectedMonth,
    setSelectedMonth,
    loading,
    error,
    refetch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    upsertBudget,
    deleteBudget,
    upsertGoal,
    deleteGoal,
  };
}

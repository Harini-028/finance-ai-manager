import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Transaction, Budget, SavingsGoal } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type DashboardData = {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
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
      const [txRes, budgetRes, goalRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/budgets'),
        api.get('/savings'),
      ]);

      const txList: Transaction[] = (txRes.data.data || []).map((t: any) => ({
        id: t.id || t._id,
        user_id: t.userId || t.user_id || user.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description || '',
        date: t.date,
        created_at: t.createdAt || t.created_at || new Date().toISOString(),
      }));

      const budgetList: Budget[] = (budgetRes.data.data || []).map((b: any) => ({
        id: b.id || b._id,
        user_id: b.userId || b.user_id || user.id,
        category: b.category,
        amount: b.amount,
        spent: b.spent || 0,
        period: b.period || 'monthly',
        month: b.month,
        created_at: b.createdAt || b.created_at || new Date().toISOString(),
      }));

      const goalList: SavingsGoal[] = (goalRes.data.data || []).map((g: any) => ({
        id: g.id || g._id,
        user_id: g.userId || g.user_id || user.id,
        name: g.goalName || g.name,
        target_amount: g.targetAmount || g.target_amount,
        current_amount: g.currentAmount || g.current_amount || 0,
        target_date: g.deadline || g.target_date || null,
        created_at: g.createdAt || g.created_at || new Date().toISOString(),
      }));

      setTransactions(txList);
      setBudgets(budgetList);
      setGoals(goalList);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      const month = b.month || new Date().toISOString().slice(0, 7);
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
    transactions, budgets, goals, loading, error, refetch,
    addTransaction, updateTransaction, deleteTransaction,
    upsertBudget, deleteBudget, upsertGoal, deleteGoal,
  };
}

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export type RecurringItem = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDue: string;
  active: boolean;
};

export function useRecurring() {
  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecurring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/recurring');
      if (res.data.success) {
        setRecurring(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const addRecurring = async (item: Omit<RecurringItem, 'id'>) => {
    try {
      const res = await api.post('/recurring', item);
      if (res.data.success) {
        await fetchRecurring();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to add recurring transaction' };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  const updateRecurring = async (id: string, updates: Partial<RecurringItem>) => {
    try {
      const res = await api.put(`/recurring/${id}`, updates);
      if (res.data.success) {
        await fetchRecurring();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to update recurring transaction' };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  const deleteRecurring = async (id: string) => {
    try {
      const res = await api.delete(`/recurring/${id}`);
      if (res.data.success) {
        await fetchRecurring();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to delete recurring transaction' };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  return {
    recurring,
    loading,
    error,
    refetch: fetchRecurring,
    addRecurring,
    updateRecurring,
    deleteRecurring,
  };
}

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export type SubscriptionItem = {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  category: string;
  nextBillingDate: string;
  active: boolean;
  icon?: string;
  description?: string;
};

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/subscriptions');
      if (res.data.success) {
        setSubscriptions(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = async (item: Omit<SubscriptionItem, 'id'>) => {
    try {
      const res = await api.post('/subscriptions', item);
      if (res.data.success) {
        await fetchSubscriptions();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to create subscription' };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  const updateSubscription = async (id: string, updates: Partial<SubscriptionItem>) => {
    try {
      const res = await api.put(`/subscriptions/${id}`, updates);
      if (res.data.success) {
        await fetchSubscriptions();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to update subscription' };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const res = await api.delete(`/subscriptions/${id}`);
      if (res.data.success) {
        await fetchSubscriptions();
        return { error: null };
      }
      return { error: res.data.message || 'Failed to delete subscription' };
    } catch (err: any) {
      return { error: err.response?.data?.message || err.message };
    }
  };

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
}

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, PauseCircle, PlayCircle, Clock, Bell, Trash2, Pencil,
  X, ShieldAlert, Receipt,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatDate } from '../lib/format';

export type SubscriptionItem = {
  _id: string;
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'annual';
  category: string;
  nextBillingDate: string;
  daysUntilDue: number | null;
  urgency: 'normal' | 'due_soon' | 'due_today' | 'overdue';
  active: boolean;
  icon?: string;
  description?: string;
  monthlyCost: number;
  yearlyCost: number;
};

export type DuplicateAlert = {
  subscriptionA: { id: string; name: string; amount: number };
  subscriptionB: { id: string; name: string; amount: number };
  reason: string;
};

export type InAppReminder = {
  id: string;
  name: string;
  amount: number;
  urgency: string;
  nextBillingDate: string;
  message: string;
};

export default function SubscriptionsPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'INR';

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [duplicateAlerts, setDuplicateAlerts] = useState<DuplicateAlert[]>([]);
  const [reminders, setReminders] = useState<InAppReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [logConfirmSub, setLogConfirmSub] = useState<SubscriptionItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as SubscriptionItem['frequency'],
    category: 'Entertainment',
    nextBillingDate: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions');
      if (res.data?.success) {
        setSubscriptions(res.data.data || []);
        setDuplicateAlerts(res.data.summary?.duplicateAlerts || []);
        setReminders(res.data.summary?.reminders || []);
      }
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
      notify('error', err.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSub(null);
    setForm({
      name: '',
      amount: '',
      frequency: 'monthly',
      category: 'Entertainment',
      nextBillingDate: new Date().toISOString().slice(0, 10),
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setForm({
      name: sub.name,
      amount: sub.amount.toString(),
      frequency: sub.frequency,
      category: sub.category || 'Entertainment',
      nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      description: sub.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) {
      notify('warning', 'Please provide a valid subscription name and positive amount');
      return;
    }

    const payload = {
      name: form.name.trim(),
      amount,
      frequency: form.frequency,
      category: form.category,
      nextBillingDate: form.nextBillingDate,
      description: form.description.trim(),
    };

    try {
      if (editingSub) {
        await api.put(`/subscriptions/${editingSub.id || editingSub._id}`, payload);
        notify('success', `Subscription "${payload.name}" updated`);
      } else {
        await api.post('/subscriptions', payload);
        notify('success', `Subscription "${payload.name}" created`);
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to save subscription');
    }
  };

  const handleToggleStatus = async (sub: SubscriptionItem) => {
    try {
      await api.patch(`/subscriptions/${sub.id || sub._id}/status`);
      notify('info', `${sub.name} is now ${sub.active ? 'paused' : 'active'}`);
      await loadData();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from subscriptions?`)) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      notify('success', `Subscription "${name}" removed`);
      await loadData();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleLogPayment = async () => {
    if (!logConfirmSub) return;
    try {
      const res = await api.post(`/subscriptions/${logConfirmSub.id || logConfirmSub._id}/log-payment`);
      notify('success', res.data?.message || 'Logged payment to expenses');
      setLogConfirmSub(null);
      await loadData();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to log payment');
    }
  };

  // Cost calculations
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.active), [subscriptions]);
  const totalMonthlyCost = useMemo(() => activeSubs.reduce((sum, s) => sum + s.monthlyCost, 0), [activeSubs]);
  const totalYearlyCost = useMemo(() => activeSubs.reduce((sum, s) => sum + s.yearlyCost, 0), [activeSubs]);

  // Upcoming Timeline sorting
  const upcomingTimeline = useMemo(() => {
    return [...activeSubs].sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
  }, [activeSubs]);

  const filteredSubs = useMemo(() => {
    if (filter === 'all') return subscriptions;
    if (filter === 'active') return subscriptions.filter((s) => s.active);
    return subscriptions.filter((s) => !s.active);
  }, [subscriptions, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
            Subscription & Recurring Payments
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Audit recurring commitments, detect duplicate services, and project annualized costs
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Subscription
        </button>
      </div>

      {/* Safety Notice: Distinct from Transactions */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs text-ink-700 dark:text-ink-300">
        <Receipt className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-brand-700 dark:text-brand-300">Isolated Recurring Tracker: </span>
          Subscriptions are kept completely distinct from actual bank transactions to prevent artificial double-counting. You can optionally log a specific billing cycle as an expense using the "Log Payment" action.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Monthly Commitment</p>
          <p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">{formatCurrency(totalMonthlyCost, currency)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Across {activeSubs.length} active services</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Annual Projected Spend</p>
          <p className="mt-1 text-xl font-bold text-accent-600 dark:text-accent-400">{formatCurrency(totalYearlyCost, currency)}</p>
          <p className="text-xs text-ink-400 mt-0.5">12-month normalized</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Due in Next 7 Days</p>
          <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
            {reminders.filter((r) => r.urgency === 'due_soon' || r.urgency === 'due_today').length}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">{reminders.filter((r) => r.urgency === 'overdue').length} overdue</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Potential Duplicates</p>
          <p className={`mt-1 text-xl font-bold ${duplicateAlerts.length > 0 ? 'text-error-600 dark:text-error-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {duplicateAlerts.length}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">{duplicateAlerts.length > 0 ? 'Review alerts below' : 'No duplicates found'}</p>
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {duplicateAlerts.length > 0 && (
        <div className="card p-4 border border-error-500/30 bg-error-500/5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-error-700 dark:text-error-300 font-bold text-sm">
            <ShieldAlert className="h-5 w-5 text-error-500" />
            <span>Duplicate Subscription Warnings ({duplicateAlerts.length})</span>
          </div>
          <div className="space-y-2">
            {duplicateAlerts.map((dup, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-ink-900 border border-error-500/20 text-xs"
              >
                <div>
                  <span className="font-semibold text-ink-800 dark:text-white">
                    "{dup.subscriptionA.name}" & "{dup.subscriptionB.name}"
                  </span>
                  <p className="text-ink-500 dark:text-ink-400 mt-0.5">{dup.reason}</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-error-500/10 text-error-600 dark:text-error-400 font-semibold self-start sm:self-auto">
                  Audit Recommended
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-App Reminders Section */}
      {reminders.length > 0 && (
        <div className="card p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Bell className="h-4 w-4 text-amber-500" />
            <span>Payment Reminders</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-ink-900 border border-amber-500/20 text-xs"
              >
                <div>
                  <p className="font-semibold text-ink-800 dark:text-white">{r.name}</p>
                  <p className="text-ink-400 text-[11px]">{r.message}</p>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400 ml-2">
                  {formatCurrency(r.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Payments Timeline View */}
      <div className="card p-5 border border-ink-100 dark:border-ink-800">
        <h3 className="font-display font-bold text-base text-ink-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-500" />
          <span>Upcoming Payment Timeline</span>
        </h3>
        {upcomingTimeline.length === 0 ? (
          <p className="text-xs text-ink-400 py-3">No active recurring commitments in timeline.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {upcomingTimeline.map((sub) => {
              const isOverdue = sub.urgency === 'overdue';
              const isDueToday = sub.urgency === 'due_today';
              const isDueSoon = sub.urgency === 'due_soon';

              return (
                <div
                  key={sub.id || sub._id}
                  className={`min-w-[210px] p-3.5 rounded-xl border text-xs shrink-0 flex flex-col justify-between ${
                    isOverdue
                      ? 'border-error-500/30 bg-error-500/5'
                      : isDueToday
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : isDueSoon
                      ? 'border-brand-500/30 bg-brand-500/5'
                      : 'border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-900'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-ink-900 dark:text-white truncate">{sub.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-ink-200 dark:bg-ink-800 text-ink-700 dark:text-ink-300">
                        {sub.frequency}
                      </span>
                    </div>
                    <p className="text-ink-400 text-[11px] mt-0.5">{sub.category}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-ink-100 dark:border-ink-800 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-ink-400">Due Date</p>
                      <p className="font-semibold text-ink-800 dark:text-white">{formatDate(sub.nextBillingDate)}</p>
                    </div>
                    <p className="font-bold text-sm text-brand-600 dark:text-brand-400">
                      {formatCurrency(sub.amount, currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscriptions Table / Grid */}
      <div className="card p-5 border border-ink-100 dark:border-ink-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-bold text-base text-ink-900 dark:text-white">All Subscriptions</h3>
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'paused'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === t
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filteredSubs.length === 0 ? (
          <p className="text-center text-sm text-ink-400 py-8">No subscriptions found for this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Service</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Billing Cycle</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Monthly Normalized</th>
                  <th className="py-3 px-3">Next Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id || sub._id} className="hover:bg-ink-50/50 dark:hover:bg-ink-850/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-ink-900 dark:text-white">{sub.name}</td>
                    <td className="py-3 px-3 text-ink-500 dark:text-ink-400">{sub.category}</td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded-full bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 font-medium text-[11px]">
                        {sub.frequency}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-ink-900 dark:text-white">{formatCurrency(sub.amount, currency)}</td>
                    <td className="py-3 px-3 text-brand-600 dark:text-brand-400 font-medium">
                      {formatCurrency(sub.monthlyCost, currency)}/mo
                    </td>
                    <td className="py-3 px-3 text-ink-600 dark:text-ink-300">{formatDate(sub.nextBillingDate)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleStatus(sub)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          sub.active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-ink-200 dark:bg-ink-700 text-ink-600 dark:text-ink-300'
                        }`}
                      >
                        {sub.active ? <PlayCircle className="h-3 w-3" /> : <PauseCircle className="h-3 w-3" />}
                        <span>{sub.active ? 'Active' : 'Paused'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setLogConfirmSub(sub)}
                          title="Log this bill to Expense Transactions"
                          className="px-2 py-1 rounded bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-[11px] font-semibold transition-colors"
                        >
                          Log Payment
                        </button>
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-1 rounded text-ink-400 hover:text-ink-700 dark:hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id || sub._id, sub.name)}
                          className="p-1 rounded text-error-400 hover:text-error-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Subscription Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                {editingSub ? 'Edit Subscription' : 'Add Subscription'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Subscription Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Netflix, Spotify, AWS, Gym"
                  className="input-field text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Amount ({currency}) *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="649"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Frequency *</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value as SubscriptionItem['frequency'] })}
                    className="input-field text-sm"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly / Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities & Cloud</option>
                    <option value="Fitness">Fitness & Health</option>
                    <option value="Education">Education & Courses</option>
                    <option value="Shopping">Shopping & Delivery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Next Payment Date</label>
                  <input
                    type="date"
                    value={form.nextBillingDate}
                    onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Notes (Optional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Shared with roommates"
                  className="input-field text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingSub ? 'Save Changes' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Log Payment Confirmation Dialog */}
      {logConfirmSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
            <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white mb-2">
              Confirm Payment Logging
            </h3>
            <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
              Do you want to log a payment of{' '}
              <strong className="text-ink-900 dark:text-white">
                {formatCurrency(logConfirmSub.amount, currency)}
              </strong>{' '}
              for <strong className="text-ink-900 dark:text-white">{logConfirmSub.name}</strong> as an expense transaction for today?
            </p>
            <p className="text-xs text-ink-400 mb-5">
              This will add a real transaction record and automatically advance the next billing date for this subscription.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setLogConfirmSub(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleLogPayment} className="btn-primary flex-1">
                Yes, Log Expense
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

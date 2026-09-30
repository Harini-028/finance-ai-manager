import { useState } from 'react';
import { Plus, CreditCard, Calendar, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useSubscriptions, type SubscriptionItem } from '../hooks/useSubscriptions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatDate, todayISO, cn } from '../lib/format';

export default function SubscriptionsPage() {
  const { profile } = useAuth();
  const { subscriptions, loading, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'USD';

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    amount: string;
    frequency: 'monthly' | 'yearly';
    category: string;
    nextBillingDate: string;
  }>({
    name: '',
    amount: '',
    frequency: 'monthly',
    category: 'Entertainment',
    nextBillingDate: todayISO(),
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.name || !amount || amount <= 0) {
      notify('warning', 'Please provide a valid subscription name and amount');
      return;
    }
    setSaving(true);
    const { error } = await addSubscription({
      name: form.name,
      amount,
      frequency: form.frequency,
      category: form.category,
      nextBillingDate: form.nextBillingDate,
      active: true,
    });
    setSaving(false);
    if (error) {
      notify('error', error);
      return;
    }
    notify('success', 'Subscription added successfully');
    setModalOpen(false);
    setForm({ name: '', amount: '', frequency: 'monthly', category: 'Entertainment', nextBillingDate: todayISO() });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await deleteSubscription(deleteId);
    setDeleteId(null);
    if (error) {
      notify('error', error);
      return;
    }
    notify('success', 'Subscription deleted');
  };

  const toggleStatus = async (sub: SubscriptionItem) => {
    const { error } = await updateSubscription(sub.id, { active: !sub.active });
    if (error) notify('error', error);
    else notify('info', `${sub.name} updated`);
  };

  const activeSubs = subscriptions.filter((s) => s.active);
  const totalMonthlyCost = activeSubs.reduce(
    (sum, s) => sum + (s.frequency === 'yearly' ? s.amount / 12 : s.amount),
    0
  );
  const totalYearlyCost = totalMonthlyCost * 12;

  if (loading) return <div className="flex justify-center py-32"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
            Subscription Manager
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Track paid memberships, streaming services & recurring software
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Subscription
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Active Subscriptions</p>
          <p className="font-display text-2xl font-bold text-ink-900 dark:text-white mt-1">{activeSubs.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Total Monthly Cost</p>
          <p className="font-display text-2xl font-bold text-warning-500 mt-1">{formatCurrency(totalMonthlyCost, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Total Yearly Cost</p>
          <p className="font-display text-2xl font-bold text-accent-500 mt-1">{formatCurrency(totalYearlyCost, currency)}</p>
        </div>
      </div>

      {/* Subscription Grid Cards */}
      {subscriptions.length === 0 ? (
        <div className="card p-16 text-center">
          <CreditCard className="h-12 w-12 text-ink-300 dark:text-ink-700 mx-auto mb-3" />
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">No subscriptions added yet</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> Track your first subscription
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="card p-5 space-y-4 relative hover:border-brand-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white font-bold text-lg">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900 dark:text-white">{sub.name}</h3>
                    <span className="text-xs text-ink-400">{sub.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(sub)}
                  className={cn(
                    'badge cursor-pointer',
                    sub.active ? 'bg-brand-500/10 text-brand-500' : 'bg-ink-200 dark:bg-ink-800 text-ink-400'
                  )}
                >
                  {sub.active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-ink-100 dark:border-ink-800">
                <div>
                  <p className="text-xs text-ink-400">Billing Cost</p>
                  <p className="font-display text-xl font-bold text-ink-900 dark:text-white">
                    {formatCurrency(sub.amount, currency)}{' '}
                    <span className="text-xs font-normal text-ink-400">/{sub.frequency === 'monthly' ? 'mo' : 'yr'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-400">Next Renewal</p>
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-300">{formatDate(sub.nextBillingDate)}</p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button onClick={() => setDeleteId(sub.id)} className="text-ink-400 hover:text-error-500 text-xs flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Subscription" description="Keep track of monthly or yearly paid services">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Service Name</label>
            <input type="text" required placeholder="e.g. Netflix, Spotify, Amazon Prime" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Amount</label>
              <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as any }))} className="input-field">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
                <option value="Entertainment">Entertainment</option>
                <option value="Software">Software</option>
                <option value="Fitness">Fitness</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Next Renewal Date</label>
              <input type="date" required value={form.nextBillingDate} onChange={(e) => setForm((f) => ({ ...f, nextBillingDate: e.target.value }))} className="input-field" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {saving ? <Spinner size={18} className="text-white" /> : 'Save Subscription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Subscription?" description="This action cannot be undone.">
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleDelete} className="btn-primary flex-1 justify-center bg-error-500 hover:bg-error-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

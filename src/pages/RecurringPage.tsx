import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Repeat, Calendar, Trash2, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { useRecurring, type RecurringItem } from '../hooks/useRecurring';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { categories, expenseCategories, incomeCategories, getCategoryMeta } from '../lib/constants';
import { formatCurrency, formatDate, todayISO, cn } from '../lib/format';

export default function RecurringPage() {
  const { profile } = useAuth();
  const { recurring, loading, addRecurring, updateRecurring, deleteRecurring } = useRecurring();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'USD';

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    amount: string;
    type: 'income' | 'expense';
    category: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDue: string;
  }>({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    frequency: 'monthly',
    nextDue: todayISO(),
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.title || !amount || amount <= 0) {
      notify('warning', 'Please provide a valid title and amount');
      return;
    }
    setSaving(true);
    const { error } = await addRecurring({
      title: form.title,
      amount,
      type: form.type,
      category: form.category,
      frequency: form.frequency,
      nextDue: form.nextDue,
      active: true,
    });
    setSaving(false);
    if (error) {
      notify('error', error);
      return;
    }
    notify('success', 'Recurring transaction added');
    setModalOpen(false);
    setForm({ title: '', amount: '', type: 'expense', category: 'Food', frequency: 'monthly', nextDue: todayISO() });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await deleteRecurring(deleteId);
    setDeleteId(null);
    if (error) {
      notify('error', error);
      return;
    }
    notify('success', 'Recurring transaction deleted');
  };

  const toggleActive = async (item: RecurringItem) => {
    const { error } = await updateRecurring(item.id, { active: !item.active });
    if (error) notify('error', error);
    else notify('info', `${item.title} status updated`);
  };

  const upcomingPayments = recurring.filter((r) => r.active);
  const totalMonthlyCommitment = upcomingPayments
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + (r.frequency === 'yearly' ? r.amount / 12 : r.amount), 0);

  if (loading) return <div className="flex justify-center py-32"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
            Recurring Transactions
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Automate and track your regular income & bill payments
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Recurring
        </button>
      </div>

      {/* Summary card */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Active Recurring</p>
          <p className="font-display text-2xl font-bold text-ink-900 dark:text-white mt-1">{upcomingPayments.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Est. Monthly Expense</p>
          <p className="font-display text-2xl font-bold text-warning-500 mt-1">{formatCurrency(totalMonthlyCommitment, currency)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Next Payment Due</p>
          <p className="font-display text-xl font-bold text-brand-500 mt-1">
            {upcomingPayments.length > 0 ? formatDate(upcomingPayments[0].nextDue) : 'None'}
          </p>
        </div>
      </div>

      {/* Upcoming & All List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 dark:border-ink-800 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">Upcoming & Active Payments</h3>
        </div>

        {recurring.length === 0 ? (
          <div className="py-16 text-center">
            <Repeat className="h-12 w-12 text-ink-300 dark:text-ink-700 mx-auto mb-3" />
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">No recurring transactions added yet</p>
            <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Add your first recurring transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {recurring.map((item) => {
              const meta = getCategoryMeta(item.category);
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0', meta.gradient)}>
                      <meta.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink-900 dark:text-white">{item.title}</p>
                        <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 capitalize">
                          {item.frequency}
                        </span>
                      </div>
                      <p className="text-xs text-ink-400 mt-0.5">
                        Category: {item.category} · Next Due: {formatDate(item.nextDue)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={cn('font-display font-bold text-base', item.type === 'income' ? 'text-brand-500' : 'text-ink-900 dark:text-white')}>
                      {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency)}
                    </span>
                    <button
                      onClick={() => toggleActive(item)}
                      className={cn('badge cursor-pointer', item.active ? 'bg-brand-500/10 text-brand-500' : 'bg-ink-200 dark:bg-ink-800 text-ink-400')}
                    >
                      {item.active ? 'Active' : 'Paused'}
                    </button>
                    <button onClick={() => setDeleteId(item.id)} className="text-ink-400 hover:text-error-500 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Recurring Transaction" description="Schedule automatic bills or income">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Title</label>
            <input type="text" required placeholder="e.g. Netflix, Rent, Salary" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))} className="input-field">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Amount</label>
              <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
                {(form.type === 'income' ? incomeCategories : expenseCategories).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as any }))} className="input-field">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">First Due Date</label>
            <input type="date" required value={form.nextDue} onChange={(e) => setForm((f) => ({ ...f, nextDue: e.target.value }))} className="input-field" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {saving ? <Spinner size={18} className="text-white" /> : 'Save Recurring'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Recurring Transaction?" description="This action cannot be undone.">
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleDelete} className="btn-primary flex-1 justify-center bg-error-500 hover:bg-error-600">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle, X, Check,
} from 'lucide-react';
import type { Transaction } from '../../lib/supabase';
import { formatCurrency, formatDateShort } from '../../lib/format';
import { getCategoryMeta, categories } from '../../lib/constants';

type RecentTransactionsSectionProps = {
  transactions: Transaction[];
  currency?: string;
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
  onAddClick?: () => void;
};

export function RecentTransactionsSection({
  transactions,
  currency = 'INR',
  onUpdate,
  onDelete,
  onAddClick,
}: RecentTransactionsSectionProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const startEdit = (t: Transaction) => {
    setEditingTx(t);
    setEditForm({
      description: t.description || '',
      amount: String(t.amount || ''),
      category: t.category,
      type: t.type,
      date: t.date ? t.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setSubmitting(true);
    await onUpdate(editingTx.id, {
      description: editForm.description,
      amount: Number(editForm.amount),
      category: editForm.category,
      type: editForm.type,
      date: editForm.date,
    });
    setSubmitting(false);
    setEditingTx(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setSubmitting(true);
    await onDelete(deletingTx.id);
    setSubmitting(false);
    setDeletingTx(null);
  };

  return (
    <div className="card p-6 border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-ink-900 dark:text-white">Recent Transactions</h3>
          <p className="text-xs text-ink-400">Latest financial movements on your account</p>
        </div>
        <div className="flex items-center gap-2">
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
          <Link
            to="/app/transactions"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* List */}
      {transactions.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <p className="text-xs text-ink-400">No transactions recorded yet.</p>
          <Link to="/app/transactions" className="btn-primary text-xs inline-flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Record First Transaction
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-ink-100 dark:divide-ink-800/50">
          {transactions.slice(0, 8).map((t) => {
            const meta = getCategoryMeta(t.category);
            const isIncome = t.type === 'income';

            return (
              <div
                key={t.id}
                className="group flex items-center justify-between gap-3 py-3 px-1 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 rounded-xl transition-colors"
              >
                {/* Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.gradient} text-white shrink-0 shadow-sm`}>
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">
                      {t.description || t.category}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-ink-400 mt-0.5">
                      <span>{formatDateShort(t.date)}</span>
                      <span>•</span>
                      <span className="truncate">{t.category}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-display text-sm font-bold flex items-center gap-0.5 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-900 dark:text-white'}`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                    )}
                    {isIncome ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </span>

                  {/* Quick Edit / Delete Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(t)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
                      title="Edit transaction"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingTx(t)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-md p-6 border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-ink-800">
                <h4 className="font-display font-bold text-lg text-ink-900 dark:text-white">Edit Transaction</h4>
                <button onClick={() => setEditingTx(null)} className="text-ink-400 hover:text-ink-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, type: 'expense' }))}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${editForm.type === 'expense' ? 'bg-white dark:bg-ink-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-ink-500'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, type: 'income' }))}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${editForm.type === 'income' ? 'bg-white dark:bg-ink-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-ink-500'}`}
                  >
                    Income
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    className="input-field text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional note"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="btn-secondary flex-1 text-sm py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-sm p-6 border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-2.5 rounded-xl bg-rose-500/10">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-ink-900 dark:text-white">Delete Transaction</h4>
                  <p className="text-xs text-ink-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-xs text-ink-600 dark:text-ink-300">
                Are you sure you want to permanently delete{' '}
                <strong>{deletingTx.description || deletingTx.category}</strong> ({formatCurrency(deletingTx.amount, currency)})?
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingTx(null)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl flex-1 text-xs py-2 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

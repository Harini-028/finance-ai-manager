import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight, ChevronLeft,
  ChevronRight, SlidersHorizontal, X, Inbox, Download,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { categories, expenseCategories, incomeCategories, getCategoryMeta } from '../lib/constants';
import { formatCurrency, formatDate, todayISO, cn } from '../lib/format';
import type { Transaction } from '../lib/supabase';

type TxnForm = {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: string;
};

const emptyForm: TxnForm = { type: 'expense', amount: '', category: 'Food & Dining', description: '', date: todayISO() };

export default function TransactionsPage() {
  const { profile } = useAuth();
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useDashboardData();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'USD';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TxnForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [search, typeFilter, categoryFilter, dateFrom, dateTo, sortBy]);

  const exportToCSV = () => {
    if (filtered.length === 0) {
      notify('error', 'No transactions to export');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = filtered.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('success', 'Exported transactions to CSV');
  };

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.category.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') result = result.filter((t) => t.type === typeFilter);
    if (categoryFilter !== 'all') result = result.filter((t) => t.category === categoryFilter);
    if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
    if (dateTo) result = result.filter((t) => t.date <= dateTo);
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return a.date < b.date ? 1 : -1;
      if (sortBy === 'date-asc') return a.date > b.date ? 1 : -1;
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });
    return result;
  }, [transactions, search, typeFilter, categoryFilter, dateFrom, dateTo, sortBy]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t: Transaction) => {
    setEditId(t.id);
    setForm({ type: t.type, amount: String(t.amount), category: t.category, description: t.description, date: t.date });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { notify('warning', 'Enter a valid amount'); return; }
    setSaving(true);
    const payload = { type: form.type, amount, category: form.category, description: form.description, date: form.date };
    const { error } = editId ? await updateTransaction(editId, payload) : await addTransaction(payload);
    setSaving(false);
    if (error) { notify('error', error); return; }
    notify('success', editId ? 'Transaction updated' : 'Transaction added');
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await deleteTransaction(deleteId);
    setDeleteId(null);
    if (error) { notify('error', error); return; }
    notify('success', 'Transaction deleted');
  };

  const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const clearFilters = () => { setTypeFilter('all'); setCategoryFilter('all'); setDateFrom(''); setDateTo(''); setSortBy('date-desc'); };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportToCSV} className="btn-secondary text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by description or category…" className="input-field pl-11" />
          </div>
          <div className="flex gap-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="input-field py-2.5 w-auto">
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
            <button onClick={() => setShowFilters((p) => !p)} className={cn('btn-secondary text-sm', activeFilterCount > 0 && 'ring-2 ring-brand-500/30')}>
              <SlidersHorizontal className="h-4 w-4" /> Filters {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-brand-500 text-white text-xs px-1.5">{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-4 mt-4 border-t border-ink-100 dark:border-ink-800 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Type</label>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="input-field py-2.5">
                    <option value="all">All types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Category</label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field py-2.5">
                    <option value="all">All categories</option>
                    {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">From date</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field py-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">To date</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field py-2.5" />
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn-ghost text-sm text-error-500 col-span-full w-fit"><X className="h-4 w-4" /> Clear filters</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {paged.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="h-12 w-12 text-ink-300 dark:text-ink-700 mx-auto mb-3" />
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">No transactions found</p>
            <button onClick={openAdd} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add your first transaction</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800 text-left">
                    <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide">Description</th>
                    <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide hidden sm:table-cell">Category</th>
                    <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide text-right">Amount</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((t) => {
                    const meta = getCategoryMeta(t.category);
                    return (
                      <tr key={t.id} className="border-b border-ink-50 dark:border-ink-800/50 last:border-0 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-white shrink-0', meta.gradient)}>
                              <meta.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink-900 dark:text-white truncate">{t.description || t.category}</p>
                              <p className="text-xs text-ink-400 sm:hidden">{t.category} · {formatDate(t.date)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">{t.category}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell text-ink-500 dark:text-ink-400">{formatDate(t.date)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={cn('font-semibold inline-flex items-center gap-1', t.type === 'income' ? 'text-brand-600 dark:text-brand-400' : 'text-ink-700 dark:text-ink-200')}>
                            {t.type === 'income' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {formatCurrency(t.amount, currency)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-500/10 transition-colors" aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteId(t.id)} className="p-2 rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-500/10 transition-colors" aria-label="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-ink-100 dark:border-ink-800">
                <p className="text-xs text-ink-400">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={cn('h-9 w-9 rounded-lg text-sm font-medium transition-colors', page === p ? 'gradient-brand text-white' : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800')}>{p}</button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-40 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Transaction' : 'Add Transaction'} description="Record your income or expense with details.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-ink-100 dark:bg-ink-800">
            {(['expense', 'income'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t, category: t === 'income' ? 'Salary' : 'Food & Dining' }))}
                className={cn('rounded-lg py-2.5 text-sm font-medium capitalize transition-all', form.type === t ? 'gradient-brand text-white shadow-soft' : 'text-ink-500')}>
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 font-medium">{currency === 'USD' ? '$' : ''}</span>
              <input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="input-field pl-8" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
              {(form.type === 'income' ? incomeCategories : expenseCategories).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional note" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {saving ? <Spinner size={18} className="text-white" /> : editId ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete transaction?" description="This action cannot be undone.">
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleDelete} className="btn-primary flex-1 justify-center bg-error-500 hover:bg-error-600" style={{ backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

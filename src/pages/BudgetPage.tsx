import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Wallet, AlertTriangle, CheckCircle2, Target,
  Trash2, Pencil, Trophy,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { expenseCategories, getCategoryMeta } from '../lib/constants';
import { formatCurrency, cn, currentMonthKey, isSameMonth, monthLabel, formatDate, daysInMonth, daysPassedInMonth } from '../lib/format';
import type { Budget, SavingsGoal } from '../lib/supabase';

type Period = 'daily' | 'weekly' | 'monthly';
const periods: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export default function BudgetPage() {
  const { profile } = useAuth();
  const { transactions, budgets, goals, loading, upsertBudget, deleteBudget, upsertGoal, deleteGoal } = useDashboardData();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'USD';
  const monthKey = currentMonthKey();

  const [activePeriod, setActivePeriod] = useState<Period>('monthly');
  const [budgetModal, setBudgetModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [saving, setSaving] = useState(false);

  const [budgetForm, setBudgetForm] = useState({ category: 'Food & Dining', amount: '' });
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '', current_amount: '', target_date: '' });

  const periodBudgets = useMemo(() => budgets.filter((b) => b.period === activePeriod), [budgets, activePeriod]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t) => t.type === 'expense' && isSameMonth(t.date, monthKey)).forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return map;
  }, [transactions, monthKey]);

  const totalBudget = periodBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = periodBudgets.reduce((s, b) => s + Math.min(spentByCategory.get(b.category) ?? 0, b.amount), 0);
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const openAddBudget = () => { setEditBudget(null); setBudgetForm({ category: 'Food & Dining', amount: '' }); setBudgetModal(true); };
  const openEditBudget = (b: Budget) => { setEditBudget(b); setBudgetForm({ category: b.category, amount: String(b.amount) }); setBudgetModal(true); };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetForm.amount);
    if (!amount || amount <= 0) { notify('warning', 'Enter a valid amount'); return; }
    setSaving(true);
    const { error } = await upsertBudget({ category: budgetForm.category, amount, period: activePeriod });
    setSaving(false);
    if (error) { notify('error', error); return; }
    notify('success', editBudget ? 'Budget updated' : 'Budget created');
    setBudgetModal(false);
  };

  const handleDeleteBudget = async (id: string) => {
    const { error } = await deleteBudget(id);
    if (error) { notify('error', error); return; }
    notify('success', 'Budget deleted');
  };

  const openAddGoal = () => { setEditGoal(null); setGoalForm({ name: '', target_amount: '', current_amount: '', target_date: '' }); setGoalModal(true); };
  const openEditGoal = (g: SavingsGoal) => { setEditGoal(g); setGoalForm({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), target_date: g.target_date ?? '' }); setGoalModal(true); };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalForm.target_amount);
    const current = parseFloat(goalForm.current_amount) || 0;
    if (!target || target <= 0) { notify('warning', 'Enter a valid target amount'); return; }
    setSaving(true);
    const payload = { name: goalForm.name, target_amount: target, current_amount: current, target_date: goalForm.target_date || null };
    const { error } = await upsertGoal(editGoal ? { ...payload, id: editGoal.id } : payload);
    setSaving(false);
    if (error) { notify('error', error); return; }
    notify('success', editGoal ? 'Goal updated' : 'Goal created');
    setGoalModal(false);
  };

  const handleDeleteGoal = async (id: string) => {
    const { error } = await deleteGoal(id);
    if (error) { notify('error', error); return; }
    notify('success', 'Goal deleted');
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">Budget & Goals</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage spending limits and savings targets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddBudget} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add Budget</button>
          <button onClick={openAddGoal} className="btn-secondary text-sm"><Target className="h-4 w-4" /> New Goal</button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="inline-flex p-1 rounded-xl bg-ink-100 dark:bg-ink-800">
        {periods.map((p) => (
          <button key={p.key} onClick={() => setActivePeriod(p.key)}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', activePeriod === p.key ? 'gradient-brand text-white shadow-soft' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-200')}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Overview card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide">Total {activePeriod} Budget</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{formatCurrency(totalBudget, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide">Spent</p>
            <p className="mt-1 font-display text-2xl font-bold text-warning-600 dark:text-warning-400">{formatCurrency(totalSpent, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide">Remaining</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(totalBudget - totalSpent, currency)}</p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-ink-400 mb-1.5">
              <span>{Math.round(utilization)}% utilized</span>
              <span>{activePeriod === 'monthly' ? `Day ${daysPassedInMonth()} of ${daysInMonth()}` : ''}</span>
            </div>
            <div className="h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(utilization, 100)}%` }} transition={{ duration: 1 }}
                className={cn('h-full rounded-full', utilization > 90 ? 'gradient-warm' : utilization > 70 ? 'bg-gradient-to-r from-brand-500 to-warning-500' : 'gradient-brand')} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Budget list */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-3">{activePeriod === 'monthly' ? `${monthLabel(monthKey)} Budgets` : `${activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Budgets`}</h2>
        {periodBudgets.length === 0 ? (
          <div className="card p-10 text-center">
            <Wallet className="h-10 w-10 text-ink-300 dark:text-ink-700 mx-auto mb-3" />
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">No {activePeriod} budgets set yet</p>
            <button onClick={openAddBudget} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Create a budget</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {periodBudgets.map((b) => {
              const meta = getCategoryMeta(b.category);
              const spent = spentByCategory.get(b.category) ?? 0;
              const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
              const remaining = b.amount - spent;
              const isOver = pct > 100;
              const isWarning = pct > 80 && pct <= 100;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white', meta.gradient)}>
                        <meta.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900 dark:text-white">{b.category}</p>
                        <p className="text-xs text-ink-400">{formatCurrency(b.amount, currency)} {activePeriod}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditBudget(b)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-500/10"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDeleteBudget(b.id)} className="p-1.5 rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden mb-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }}
                      className={cn('h-full rounded-full', isOver ? 'bg-error-500' : isWarning ? 'gradient-warm' : 'gradient-brand')} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-400">{formatCurrency(spent, currency)} spent</span>
                    <span className={cn('font-medium', isOver ? 'text-error-500' : remaining > 0 ? 'text-brand-500' : 'text-ink-400')}>
                      {isOver ? `${formatCurrency(Math.abs(remaining), currency)} over` : `${formatCurrency(remaining, currency)} left`}
                    </span>
                  </div>
                  {isOver && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-error-500/10 px-3 py-2 text-xs text-error-600 dark:text-error-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> Over budget by {formatCurrency(spent - b.amount, currency)}
                    </div>
                  )}
                  {isWarning && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning-500/10 px-3 py-2 text-xs text-warning-600 dark:text-warning-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> Approaching limit — {Math.round(100 - pct)}% remaining
                    </div>
                  )}
                  {pct <= 80 && pct > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-600 dark:text-brand-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> On track — well within budget
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Savings goals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Savings Goals</h2>
          <button onClick={openAddGoal} className="btn-ghost text-sm"><Plus className="h-4 w-4" /> Add goal</button>
        </div>
        {goals.length === 0 ? (
          <div className="card p-10 text-center">
            <Target className="h-10 w-10 text-ink-300 dark:text-ink-700 mx-auto mb-3" />
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">No savings goals yet</p>
            <button onClick={openAddGoal} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Create a goal</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
              const complete = pct >= 100;
              return (
                <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 group relative">
                  {complete && <Trophy className="absolute top-4 right-4 h-5 w-5 text-warning-400" />}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent text-white">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-900 dark:text-white truncate">{g.name}</p>
                      {g.target_date && <p className="text-xs text-ink-400">By {formatDate(g.target_date)}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditGoal(g)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-500/10"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDeleteGoal(g.id)} className="p-1.5 rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden mb-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full gradient-accent" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-400">{formatCurrency(g.current_amount, currency)} saved</span>
                    <span className="font-medium text-accent-500">{Math.round(pct)}%</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-400">Target: {formatCurrency(g.target_amount, currency)}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget modal */}
      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title={editBudget ? 'Edit Budget' : 'Create Budget'} description={`Set a ${activePeriod} spending limit for a category.`}>
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Category</label>
            <select value={budgetForm.category} onChange={(e) => setBudgetForm((f) => ({ ...f, category: e.target.value }))} className="input-field" disabled={!!editBudget}>
              {expenseCategories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">{activePeriod === 'monthly' ? 'Monthly' : activePeriod === 'weekly' ? 'Weekly' : 'Daily'} limit</label>
            <input type="number" step="0.01" min="0" required value={budgetForm.amount} onChange={(e) => setBudgetForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setBudgetModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {saving ? <Spinner size={18} className="text-white" /> : editBudget ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Goal modal */}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title={editGoal ? 'Edit Savings Goal' : 'Create Savings Goal'} description="Set a target and track your progress.">
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Goal name</label>
            <input type="text" required value={goalForm.name} onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency Fund" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Target amount</label>
              <input type="number" step="0.01" min="0" required value={goalForm.target_amount} onChange={(e) => setGoalForm((f) => ({ ...f, target_amount: e.target.value }))} placeholder="10000" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Current savings</label>
              <input type="number" step="0.01" min="0" value={goalForm.current_amount} onChange={(e) => setGoalForm((f) => ({ ...f, current_amount: e.target.value }))} placeholder="0" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Target date (optional)</label>
            <input type="date" value={goalForm.target_date} onChange={(e) => setGoalForm((f) => ({ ...f, target_date: e.target.value }))} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setGoalModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {saving ? <Spinner size={18} className="text-white" /> : editGoal ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

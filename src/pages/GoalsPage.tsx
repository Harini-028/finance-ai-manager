import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Plus, AlertTriangle,
  PauseCircle, PlayCircle, ArrowUpRight, ArrowDownLeft,
  Pencil, Trash2, X, History, Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatDate } from '../lib/format';

export type GoalHistoryItem = {
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  note: string;
};

export type SmartSavingsGoal = {
  _id: string;
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  category: string;
  status: 'active' | 'paused' | 'completed';
  deadline: string | null;
  remainingAmount: number;
  progressPercentage: number;
  monthsRemaining: number | null;
  requiredMonthlyContribution: number;
  estimatedCompletionDate: string | null;
  isUnrealistic: boolean;
  unrealisticReason: string;
  history: GoalHistoryItem[];
  description: string;
  createdAt: string;
};

const goalPresets = [
  { name: 'Emergency Fund', category: 'Emergency Fund', target: 100000, monthly: 10000 },
  { name: 'MacBook / Tech Purchase', category: 'Tech & Gadgets', target: 120000, monthly: 15000 },
  { name: 'Travel & Vacation', category: 'Travel & Vacation', target: 60000, monthly: 8000 },
  { name: 'Higher Education Fund', category: 'Education', target: 200000, monthly: 20000 },
  { name: 'Vehicle Downpayment', category: 'Vehicle', target: 150000, monthly: 12000 },
];

export default function GoalsPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'INR';

  const [goals, setGoals] = useState<SmartSavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');

  // Modals state
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal?: SmartSavingsGoal | null }>({ open: false });
  const [txModal, setTxModal] = useState<{ open: boolean; goal?: SmartSavingsGoal | null; mode: 'deposit' | 'withdrawal' }>({
    open: false,
    mode: 'deposit',
  });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; goal?: SmartSavingsGoal | null }>({ open: false });

  // Goal form state
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    monthlyContribution: '',
    category: 'General',
    deadline: '',
    description: '',
  });

  // Transaction form state
  const [txForm, setTxForm] = useState({
    amount: '',
    note: '',
  });

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/savings');
      if (res.data?.success) {
        setGoals(res.data.data || []);
      }
    } catch (e: any) {
      console.error('Failed to load goals:', e);
      notify('error', e.response?.data?.message || 'Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const openCreateModal = (preset?: typeof goalPresets[0]) => {
    if (preset) {
      setForm({
        name: preset.name,
        targetAmount: preset.target.toString(),
        currentAmount: '0',
        monthlyContribution: preset.monthly.toString(),
        category: preset.category,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        description: `Dedicated ${preset.name} savings fund`,
      });
    } else {
      setForm({
        name: '',
        targetAmount: '',
        currentAmount: '',
        monthlyContribution: '',
        category: 'General',
        deadline: '',
        description: '',
      });
    }
    setGoalModal({ open: true, goal: null });
  };

  const openEditModal = (g: SmartSavingsGoal) => {
    setForm({
      name: g.goalName,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      monthlyContribution: g.monthlyContribution ? g.monthlyContribution.toString() : '',
      category: g.category || 'General',
      deadline: g.deadline ? g.deadline.slice(0, 10) : '',
      description: g.description || '',
    });
    setGoalModal({ open: true, goal: g });
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const tAmount = parseFloat(form.targetAmount);
    if (!form.name.trim() || isNaN(tAmount) || tAmount <= 0) {
      notify('warning', 'Please provide a valid goal name and target amount');
      return;
    }

    const payload = {
      goalName: form.name.trim(),
      targetAmount: tAmount,
      currentAmount: parseFloat(form.currentAmount || '0'),
      monthlyContribution: parseFloat(form.monthlyContribution || '0'),
      category: form.category,
      deadline: form.deadline || null,
      description: form.description.trim(),
    };

    try {
      if (goalModal.goal) {
        await api.put(`/savings/${goalModal.goal.id || goalModal.goal._id}`, payload);
        notify('success', `Goal "${payload.goalName}" updated successfully`);
      } else {
        await api.post('/savings', payload);
        notify('success', `Goal "${payload.goalName}" created successfully`);
      }
      setGoalModal({ open: false });
      await loadGoals();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleDeleteGoal = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the goal "${name}"?`)) return;
    try {
      await api.delete(`/savings/${id}`);
      notify('success', `Goal "${name}" deleted`);
      await loadGoals();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to delete goal');
    }
  };

  const handleToggleStatus = async (goal: SmartSavingsGoal) => {
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    try {
      await api.patch(`/savings/${goal.id || goal._id}/status`, { status: newStatus });
      notify('info', `Goal "${goal.goalName}" ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      await loadGoals();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txModal.goal) return;
    const amount = parseFloat(txForm.amount);
    if (isNaN(amount) || amount <= 0) {
      notify('warning', 'Please enter a valid positive amount');
      return;
    }

    try {
      const res = await api.post(`/savings/${txModal.goal.id || txModal.goal._id}/transaction`, {
        type: txModal.mode,
        amount,
        note: txForm.note.trim(),
      });
      notify('success', res.data.message || 'Transaction recorded');
      setTxModal({ open: false, mode: 'deposit' });
      setTxForm({ amount: '', note: '' });
      await loadGoals();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to record transaction');
    }
  };

  // Summary Metrics
  const summary = useMemo(() => {
    const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalRequiredMonthly = goals
      .filter((g) => g.status === 'active')
      .reduce((acc, g) => acc + (g.requiredMonthlyContribution || 0), 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    return { totalTarget, totalSaved, totalRequiredMonthly, overallProgress };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals;
    return goals.filter((g) => g.status === filter);
  }, [goals, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
            Smart Savings Goals
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Track targets, required monthly contributions, and estimated completion timelines
          </p>
        </div>
        <button onClick={() => openCreateModal()} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Create Savings Goal
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Total Saved</p>
          <p className="mt-1 text-xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(summary.totalSaved, currency)}</p>
          <p className="text-xs text-ink-400 mt-0.5">{summary.overallProgress}% of overall targets</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Total Target</p>
          <p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">{formatCurrency(summary.totalTarget, currency)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Across {goals.length} goals</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Required Monthly</p>
          <p className="mt-1 text-xl font-bold text-accent-600 dark:text-accent-400">{formatCurrency(summary.totalRequiredMonthly, currency)}</p>
          <p className="text-xs text-ink-400 mt-0.5">To meet active deadlines</p>
        </div>
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Active Goals</p>
          <p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">
            {goals.filter((g) => g.status === 'active').length}
            <span className="text-xs text-ink-400 font-normal ml-1">
              ({goals.filter((g) => g.status === 'completed').length} completed)
            </span>
          </p>
          <p className="text-xs text-ink-400 mt-0.5">{goals.filter((g) => g.status === 'paused').length} paused</p>
        </div>
      </div>

      {/* Quick Goal Templates Bar */}
      <div className="card p-4 border border-ink-100 dark:border-ink-800 bg-gradient-to-r from-brand-500/5 to-accent-500/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-xs font-bold text-ink-700 dark:text-ink-200 uppercase tracking-wider">Quick Start Templates</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {goalPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => openCreateModal(preset)}
              className="text-xs px-3 py-1.5 rounded-xl border border-ink-200 dark:border-ink-700 hover:border-brand-500 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02]"
            >
              <Target className="h-3.5 w-3.5 text-brand-500" />
              <span>{preset.name}</span>
              <span className="text-ink-400 text-[11px]">({formatCurrency(preset.target, currency)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-ink-200 dark:border-ink-800 pb-3">
        {(['all', 'active', 'paused', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === tab
                ? 'bg-brand-500 text-white shadow-soft'
                : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white'
            }`}
          >
            {tab === 'all' ? 'All Goals' : tab}
          </button>
        ))}
      </div>

      {/* Goals List / Empty State */}
      {filteredGoals.length === 0 ? (
        <div className="card p-12 text-center border border-dashed border-ink-200 dark:border-ink-800">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">No savings goals found</h3>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
            {filter === 'all'
              ? 'Start building disciplined savings habits by creating your first milestone goal.'
              : `You have no ${filter} savings goals right now.`}
          </p>
          <button onClick={() => openCreateModal()} className="btn-primary text-xs mt-5">
            <Plus className="h-4 w-4" /> Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const isCompleted = goal.status === 'completed' || goal.currentAmount >= goal.targetAmount;
            const isPaused = goal.status === 'paused';

            return (
              <motion.div
                key={goal.id || goal._id}
                layout
                className={`card p-6 border transition-all relative overflow-hidden ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isPaused
                    ? 'border-ink-200 dark:border-ink-800 opacity-80'
                    : 'border-ink-100 dark:border-ink-800 hover:border-brand-500/30'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">{goal.goalName}</h3>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : isPaused
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                        }`}
                      >
                        {goal.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">{goal.category} {goal.description ? `· ${goal.description}` : ''}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(goal)}
                      title={goal.status === 'paused' ? 'Resume Goal' : 'Pause Goal'}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    >
                      {goal.status === 'paused' ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(goal)}
                      title="Edit Goal"
                      className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id || goal._id, goal.goalName)}
                      title="Delete Goal"
                      className="p-1.5 rounded-lg text-error-400 hover:text-error-600 hover:bg-error-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="font-bold text-ink-900 dark:text-white text-lg">
                      {formatCurrency(goal.currentAmount, currency)}
                    </span>
                    <span className="text-xs text-ink-500 dark:text-ink-400">
                      Target: {formatCurrency(goal.targetAmount, currency)}
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden relative">
                    <motion.div
                      className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'gradient-brand'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progressPercentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-ink-400">
                    <span>{goal.progressPercentage}% Completed</span>
                    <span>Remaining: {formatCurrency(goal.remainingAmount, currency)}</span>
                  </div>
                </div>

                {/* Unrealistic Warning Alert */}
                {goal.isUnrealistic && !isCompleted && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs mb-4">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <span className="font-semibold">Unrealistic Target Alert: </span>
                      <span>{goal.unrealisticReason}</span>
                    </div>
                  </div>
                )}

                {/* Goal Parameters Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-ink-50 dark:bg-ink-900 p-3 rounded-xl border border-ink-100 dark:border-ink-800 mb-4">
                  <div>
                    <span className="text-ink-400 block">Required Monthly:</span>
                    <span className="font-semibold text-ink-800 dark:text-white">
                      {goal.requiredMonthlyContribution > 0 ? formatCurrency(goal.requiredMonthlyContribution, currency) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-400 block">Target Deadline:</span>
                    <span className="font-semibold text-ink-800 dark:text-white">
                      {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-400 block">Est. Completion:</span>
                    <span className="font-semibold text-ink-800 dark:text-white">
                      {goal.estimatedCompletionDate ? formatDate(goal.estimatedCompletionDate) : 'Not projected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-400 block">History Records:</span>
                    <button
                      onClick={() => setHistoryModal({ open: true, goal })}
                      className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <History className="h-3 w-3" />
                      <span>{goal.history?.length || 0} transactions</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setTxModal({ open: true, goal, mode: 'deposit' });
                      setTxForm({ amount: '', note: '' });
                    }}
                    className="btn-primary text-xs flex-1 py-2"
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    <span>Contribute</span>
                  </button>
                  <button
                    onClick={() => {
                      setTxModal({ open: true, goal, mode: 'withdrawal' });
                      setTxForm({ amount: '', note: '' });
                    }}
                    disabled={goal.currentAmount <= 0}
                    className="btn-secondary text-xs flex-1 py-2 disabled:opacity-50"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>Withdraw</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Modal (Create / Edit) */}
      {goalModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                {goalModal.goal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
              </h3>
              <button onClick={() => setGoalModal({ open: false })} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Goal Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. MacBook Pro, Emergency Fund, Bali Vacation"
                  className="input-field text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Target Amount *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    placeholder="100000"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Initial / Current Saved</label>
                  <input
                    type="number"
                    step="any"
                    value={form.currentAmount}
                    onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                    placeholder="0"
                    className="input-field text-sm"
                  />
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
                    <option value="General">General</option>
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Tech & Gadgets">Tech & Gadgets</option>
                    <option value="Travel & Vacation">Travel & Vacation</option>
                    <option value="Education">Higher Education</option>
                    <option value="Vehicle">Vehicle Purchase</option>
                    <option value="Home & Property">Home & Property</option>
                    <option value="Retirement">Retirement</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Target Monthly Contribution (Optional)</label>
                <input
                  type="number"
                  step="any"
                  value={form.monthlyContribution}
                  onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
                  placeholder="e.g. 10000"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Notes / Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details regarding this goal..."
                  className="input-field text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setGoalModal({ open: false })} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {goalModal.goal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Transaction Modal (Deposit / Withdrawal) */}
      {txModal.open && txModal.goal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                {txModal.mode === 'deposit' ? 'Contribute to Goal' : 'Withdraw from Goal'}
              </h3>
              <button onClick={() => setTxModal({ open: false, mode: 'deposit' })} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
              Goal: <strong className="text-ink-800 dark:text-white">{txModal.goal.goalName}</strong> · Current Balance:{' '}
              {formatCurrency(txModal.goal.currentAmount, currency)}
            </p>

            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Amount ({currency}) *</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="input-field text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Note / Reason</label>
                <input
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  placeholder={txModal.mode === 'deposit' ? 'e.g. Salary contribution, side income' : 'e.g. Emergency expense'}
                  className="input-field text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTxModal({ open: false, mode: 'deposit' })} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-primary flex-1 ${txModal.mode === 'withdrawal' ? 'bg-error-600 hover:bg-error-700' : ''}`}
                >
                  Confirm {txModal.mode === 'deposit' ? 'Contribution' : 'Withdrawal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* History Log Modal */}
      {historyModal.open && historyModal.goal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg card p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-ink-800">
              <div>
                <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">Transaction History</h3>
                <p className="text-xs text-ink-400">{historyModal.goal.goalName}</p>
              </div>
              <button onClick={() => setHistoryModal({ open: false })} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {(!historyModal.goal.history || historyModal.goal.history.length === 0) ? (
                <p className="text-center text-sm text-ink-400 py-8">No contributions or withdrawals recorded yet.</p>
              ) : (
                historyModal.goal.history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          item.type === 'deposit'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-error-500/10 text-error-600 dark:text-error-400'
                        }`}
                      >
                        {item.type === 'deposit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="font-semibold text-ink-800 dark:text-white capitalize">
                          {item.type === 'deposit' ? 'Contribution' : 'Withdrawal'}
                        </p>
                        <p className="text-ink-400 text-[11px]">{item.note || 'No notes'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${item.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-error-600 dark:text-error-400'}`}>
                        {item.type === 'deposit' ? '+' : '-'}{formatCurrency(item.amount, currency)}
                      </p>
                      <p className="text-[11px] text-ink-400">{formatDate(item.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-ink-100 dark:border-ink-800">
              <button onClick={() => setHistoryModal({ open: false })} className="btn-secondary w-full text-xs">
                Close History
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

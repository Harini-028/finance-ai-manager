import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Calendar, TrendingUp, X, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import type { SavingsGoal } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency } from '../lib/format';

const gradients = ['gradient-brand', 'gradient-accent', 'gradient-warm', 'gradient-violet'];

function GoalModal({
  goal, onClose, onSave,
}: { goal?: SavingsGoal | null; onClose: () => void; onSave: (g: Partial<SavingsGoal>) => void }) {
  const [form, setForm] = useState({
    name: goal?.name || '',
    target_amount: goal?.target_amount?.toString() || '',
    current_amount: goal?.current_amount?.toString() || '',
    target_date: goal?.target_date || '',
  });
  const h = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: form.name, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount || '0'), target_date: form.target_date || null });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">{goal ? 'Edit Goal' : 'New Goal'}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Goal Name</label>
            <input required value={form.name} onChange={e => h('name', e.target.value)} placeholder="Emergency Fund" className="input-field text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Target Amount</label>
              <input required type="number" step="any" value={form.target_amount} onChange={e => h('target_amount', e.target.value)} placeholder="10000" className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Saved So Far</label>
              <input type="number" step="any" value={form.current_amount} onChange={e => h('current_amount', e.target.value)} placeholder="0" className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Target Date (optional)</label>
            <input type="date" value={form.target_date} onChange={e => h('target_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{goal ? 'Save Changes' : 'Create Goal'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; goal?: SavingsGoal | null }>({ open: false });

  const load = async () => {
    try {
      const res = await api.get('/savings');
      const list = (res.data.data || []).map((g: any) => ({
        id: g.id || g._id,
        user_id: g.userId || g.user_id,
        name: g.goalName || g.name,
        target_amount: g.targetAmount || g.target_amount,
        current_amount: g.currentAmount || g.current_amount || 0,
        target_date: g.deadline || g.target_date || null,
        created_at: g.createdAt || g.created_at || new Date().toISOString(),
      }));
      setGoals(list);
    } catch (e) {
      console.error('Error fetching savings goals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (g: Partial<SavingsGoal>) => {
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

    if (modal.goal) {
      await api.put(`/savings/${modal.goal.id}`, payload);
    } else {
      await api.post('/savings', payload);
    }
    setModal({ open: false });
    load();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/savings/${id}`);
    setGoals(p => p.filter(g => g.id !== id));
  };

  const handleContribute = async (goal: SavingsGoal, amount: number) => {
    try {
      await api.patch(`/savings/${goal.id}/add`, { amount });
      load();
    } catch (e) {
      console.error('Error adding money to goal:', e);
    }
  };

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      {modal.open && <GoalModal goal={modal.goal} onClose={() => setModal({ open: false })} onSave={handleSave} />}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white">Savings Goals</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Track your financial milestones</p>
        </div>
        <button onClick={() => setModal({ open: true, goal: null })} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Saved', value: formatCurrency(totalSaved, 'USD'), sub: 'across all goals', gradient: 'gradient-brand' },
          { label: 'Total Target', value: formatCurrency(totalTarget, 'USD'), sub: 'combined goal amount', gradient: 'gradient-accent' },
          { label: 'Overall Progress', value: `${totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%`, sub: 'of total goals reached', gradient: 'gradient-violet' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card p-4 flex items-center gap-4">
            <div className={`h-12 w-12 flex items-center justify-center rounded-xl ${s.gradient} text-white shrink-0`}>
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-ink-400">{s.label}</p>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-ink-400">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Goals grid */}
      {goals.length === 0 ? (
        <div className="card p-12 text-center">
          <Target className="h-12 w-12 text-ink-300 dark:text-ink-600 mx-auto mb-3" />
          <p className="font-semibold text-ink-500 dark:text-ink-400 mb-2">No goals yet</p>
          <p className="text-sm text-ink-400 mb-4">Create your first savings goal to get started</p>
          <button onClick={() => setModal({ open: true, goal: null })} className="btn-primary text-sm mx-auto"><Plus className="h-4 w-4" /> Create Goal</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal, i) => {
            const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
            const remaining = goal.target_amount - goal.current_amount;
            const isComplete = pct >= 100;
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`card p-5 relative overflow-hidden ${isComplete ? 'ring-2 ring-brand-500/40' : ''}`}
              >
                {isComplete && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-500" />
                  </div>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${gradients[i % 4]} text-white shrink-0`}>
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-ink-900 dark:text-white truncate">{goal.name}</p>
                    {goal.target_date && (
                      <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-ink-900 dark:text-white">{formatCurrency(goal.current_amount, 'USD')}</span>
                    <span className="text-ink-400">{formatCurrency(goal.target_amount, 'USD')}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`h-full rounded-full ${gradients[i % 4]}`}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-ink-400">
                    <span>{pct.toFixed(0)}% complete</span>
                    <span>{isComplete ? '🎉 Goal reached!' : `${formatCurrency(remaining, 'USD')} to go`}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleContribute(goal, 100)}
                    disabled={isComplete}
                    className="flex-1 btn-primary text-xs py-2 disabled:opacity-40"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> +$100
                  </button>
                  <button onClick={() => setModal({ open: true, goal })} className="btn-secondary text-xs p-2">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="btn-secondary text-xs p-2 text-error-500 hover:bg-error-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

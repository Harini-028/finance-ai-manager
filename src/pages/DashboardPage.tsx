import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, Target,
  Sparkles, ArrowRight, Plus, AlertTriangle, CheckCircle2, Lightbulb, Info, FileText,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/ui/SummaryCard';
import { Spinner } from '../components/ui/Spinner';
import {
  computeSummary, dailyTrend, spendingByCategory, generateInsights, aiScoreLabel, projectedMonthEnd,
} from '../lib/analytics';
import { formatCurrency, formatCompact, formatDateShort, currentMonthKey, monthLabel } from '../lib/format';
import { FinancialHealthScore } from '../components/dashboard/FinancialHealthScore';
import { SpendingPredictions } from '../components/dashboard/SpendingPredictions';
import { getCategoryMeta, summaryIcons } from '../lib/constants';

const insightIcons: Record<string, typeof TrendingUp> = {
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle2, lightbulb: Lightbulb, info: Info, 'file-text': FileText,
  target: Target, wallet: Wallet, gauge: BarChart3,
};

const insightStyles: Record<string, string> = {
  positive: 'border-brand-500/30 bg-brand-500/5',
  warning: 'border-warning-500/30 bg-warning-500/5',
  negative: 'border-error-500/30 bg-error-500/5',
  info: 'border-accent-500/30 bg-accent-500/5',
  tip: 'border-violet-500/30 bg-violet-500/5',
};

const insightIconColors: Record<string, string> = {
  positive: 'text-brand-500', warning: 'text-warning-500', negative: 'text-error-500',
  info: 'text-accent-500', tip: 'text-violet-500',
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const { transactions, budgets, loading } = useDashboardData();
  const currency = profile?.currency ?? 'USD';
  const monthKey = currentMonthKey();

  const summary = useMemo(() => computeSummary(transactions, budgets, monthKey), [transactions, budgets, monthKey]);
  const trend = useMemo(() => dailyTrend(transactions, monthKey), [transactions, monthKey]);
  const catData = useMemo(() => spendingByCategory(transactions, monthKey), [transactions, monthKey]);
  const insights = useMemo(() => generateInsights(transactions, budgets, monthKey), [transactions, budgets, monthKey]);
  const projected = useMemo(() => projectedMonthEnd(transactions, monthKey), [transactions, monthKey]);
  const scoreInfo = aiScoreLabel(summary.aiScore);

  const recentTx = useMemo(() => [...transactions].slice(0, 6), [transactions]);

  const pieData = catData.slice(0, 6).map((c) => ({ name: c.category, value: c.amount, color: getCategoryMeta(c.category).color }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{monthLabel(monthKey)} · Your financial overview</p>
        </div>
        <Link to="/app/transactions" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Transaction
        </Link>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard label="Total Income" value={formatCurrency(summary.totalIncome, currency)} icon={summaryIcons.income} gradient="gradient-brand" delay={0} />
        <SummaryCard label="Total Expenses" value={formatCurrency(summary.totalExpense, currency)} icon={summaryIcons.expense} gradient="gradient-warm" delay={0.05} />
        <SummaryCard label="Net Savings" value={formatCurrency(summary.savings, currency)} icon={summaryIcons.savings} gradient="gradient-accent" delay={0.1} changeLabel={`${summary.savingsRate}% rate`} />
        <SummaryCard label="Investments" value={formatCurrency(summary.investments, currency)} icon={summaryIcons.investments} gradient="gradient-violet" delay={0.15} />
        <SummaryCard label="Monthly Budget" value={formatCurrency(summary.monthlyBudgetTotal, currency)} icon={summaryIcons.budget} gradient="gradient-cool" delay={0.2} changeLabel={`${summary.budgetUtilization}% used`} />
        <SummaryCard label="AI Score" value={`${summary.aiScore}/100`} icon={summaryIcons.goal} gradient="gradient-brand" delay={0.25} changeLabel={scoreInfo.label} />
      </div>

      {/* Financial Health Score Breakdown */}
      <FinancialHealthScore
        savingsRate={summary.savingsRate}
        budgetUtilization={summary.budgetUtilization}
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        investments={summary.investments}
      />

      {/* AI Predictions */}
      <SpendingPredictions
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        currency={currency}
        categorySpending={catData}
      />

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Income vs Expense trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-ink-900 dark:text-white">Income vs Expenses</h3>
              <p className="text-xs text-ink-400">Daily breakdown this month</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Income</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning-500" /> Expense</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="incomeG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#19b97e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#19b97e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v, currency)} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12 }}
                formatter={(v) => formatCurrency(Number(v), currency)}
              />
              <Area type="monotone" dataKey="income" stroke="#19b97e" strokeWidth={2} fill="url(#incomeG)" />
              <Area type="monotone" dataKey="expense" stroke="#f59e0b" strokeWidth={2} fill="url(#expenseG)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Spending by category pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Spending Breakdown</h3>
          <p className="text-xs text-ink-400 mb-4">By category this month</p>
          {pieData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-ink-400">No expenses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* AI Insights + Recent transactions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-violet text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-ink-900 dark:text-white">AI Financial Insights</h3>
                <p className="text-xs text-ink-400">Personalized recommendations</p>
              </div>
            </div>
            <Link to="/app/ai-assistant" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {insights.slice(0, 5).map((ins) => {
              const Icon = insightIcons[ins.icon] ?? Info;
              return (
                <div key={ins.id} className={`rounded-xl border p-4 ${insightStyles[ins.type]}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${insightIconColors[ins.type]}`} />
                    <div>
                      <p className="font-semibold text-sm text-ink-900 dark:text-white">{ins.title}</p>
                      <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400 leading-snug">{ins.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent transactions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">Recent Activity</h3>
            <Link to="/app/transactions" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">All</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-ink-400 mb-3">No transactions yet</p>
              <Link to="/app/transactions" className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add first</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTx.map((t) => {
                const meta = getCategoryMeta(t.category);
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.gradient} text-white shrink-0`}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{t.description || t.category}</p>
                      <p className="text-xs text-ink-400">{formatDateShort(t.date)} · {t.category}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-brand-600 dark:text-brand-400' : 'text-ink-700 dark:text-ink-200'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Budget projection bar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">Month-End Projection</h3>
            <p className="text-xs text-ink-400">Based on your current spending pace</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-ink-400">Spent so far</p>
              <p className="font-display font-bold text-ink-900 dark:text-white">{formatCurrency(summary.totalExpense, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Projected total</p>
              <p className="font-display font-bold text-warning-600 dark:text-warning-400">{formatCurrency(projected, currency)}</p>
            </div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(summary.budgetUtilization, 100)}%` }}
            transition={{ duration: 1, delay: 0.4 }}
            className={`h-full rounded-full ${summary.budgetUtilization > 90 ? 'gradient-warm' : 'gradient-brand'}`}
          />
        </div>
        <p className="mt-2 text-xs text-ink-400">
          {summary.monthlyBudgetTotal > 0
            ? `${summary.budgetUtilization}% of ${formatCurrency(summary.monthlyBudgetTotal, currency)} budget used`
            : 'Set up a budget to unlock projection alerts'}
        </p>
      </motion.div>
    </div>
  );
}

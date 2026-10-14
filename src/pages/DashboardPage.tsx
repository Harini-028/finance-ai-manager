import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Sparkles, ArrowRight, Plus, AlertTriangle, CheckCircle2,
  Lightbulb, Info, FileText, Target, Wallet, BarChart3, Calendar, Check, X,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/ui/SummaryCard';
import { Spinner } from '../components/ui/Spinner';
import {
  computeSummary, spendingByCategory, generateInsights, aiScoreLabel,
} from '../lib/analytics';
import { formatCurrency, monthLabel } from '../lib/format';
import { FinancialHealthScore } from '../components/dashboard/FinancialHealthScore';
import { SpendingPredictions } from '../components/dashboard/SpendingPredictions';
import { MonthlyFinancialOverview } from '../components/dashboard/MonthlyFinancialOverview';
import { SmartAlertsSection } from '../components/dashboard/SmartAlertsSection';
import { RecentTransactionsSection } from '../components/dashboard/RecentTransactionsSection';
import { summaryIcons, categories } from '../lib/constants';

const insightIcons: Record<string, typeof TrendingUp> = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle2,
  lightbulb: Lightbulb,
  info: Info,
  'file-text': FileText,
  target: Target,
  wallet: Wallet,
  gauge: BarChart3,
};

const insightStyles: Record<string, string> = {
  positive: 'border-emerald-500/30 bg-emerald-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  negative: 'border-rose-500/30 bg-rose-500/5',
  info: 'border-blue-500/30 bg-blue-500/5',
  tip: 'border-violet-500/30 bg-violet-500/5',
};

const insightIconColors: Record<string, string> = {
  positive: 'text-emerald-500',
  warning: 'text-amber-500',
  negative: 'text-rose-500',
  info: 'text-blue-500',
  tip: 'text-violet-500',
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const {
    transactions,
    budgets,
    investments,
    dashboardSummary,
    selectedMonth,
    setSelectedMonth,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useDashboardData();

  // Respect user preference or default to INR
  const currency = profile?.currency || 'INR';

  // Add Transaction Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    description: '',
    amount: '',
    category: 'Food & Dining',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().slice(0, 10),
  });
  const [addingSubmitting, setAddingSubmitting] = useState(false);

  // Month options for filtering (last 6 months)
  const monthOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      list.push({
        key,
        label: i === 0 ? `${monthLabel(key)} (Current)` : monthLabel(key),
      });
    }
    return list;
  }, []);

  // Summary Metrics: prioritize backend-verified summary, fallback to client-side compute
  const totalInvestmentsVal = dashboardSummary?.summary?.totalInvestments ?? investments.reduce((s, i) => s + i.shares * (i.current_price || i.purchase_price), 0);
  const clientSummary = useMemo(
    () => computeSummary(transactions, budgets, selectedMonth, totalInvestmentsVal),
    [transactions, budgets, selectedMonth, totalInvestmentsVal]
  );

  const summary = dashboardSummary?.summary || {
    totalIncome: clientSummary.totalIncome,
    totalExpense: clientSummary.totalExpense,
    netSavings: clientSummary.savings,
    savingsRate: clientSummary.savingsRate,
    expenseRatio: clientSummary.expenseRatio,
    totalInvestments: totalInvestmentsVal,
    investmentsCount: investments.length,
    totalBudget: clientSummary.monthlyBudgetTotal,
    budgetSpent: clientSummary.budgetUsed,
    remainingBudget: clientSummary.budgetRemaining,
    budgetUtilization: clientSummary.budgetUtilization,
    totalSavingsGoals: 0,
    financialHealth: {
      score: clientSummary.aiScore,
      label: aiScoreLabel(clientSummary.aiScore).label,
      grade: aiScoreLabel(clientSummary.aiScore).grade,
      color: aiScoreLabel(clientSummary.aiScore).color,
      isInsufficientData: clientSummary.isInsufficientData,
      breakdown: [],
      recommendations: [],
    },
  };

  const momComparison = dashboardSummary?.momComparison || {
    hasPrevData: false,
    prevMonthStr: '',
    prevIncome: 0,
    prevExpense: 0,
    prevSavings: 0,
    incomeChangePct: null,
    expenseChangePct: null,
    savingsChangePct: null,
  };

  const predictions = dashboardSummary?.predictions;
  const smartAlerts = dashboardSummary?.smartAlerts || [];
  const categoryBreakdown = dashboardSummary?.categoryBreakdown || spendingByCategory(transactions, selectedMonth);
  const budgetComparison = dashboardSummary?.budgetComparison || [];
  const historicalTrend = dashboardSummary?.historicalTrend || [];
  const recentTransactions = dashboardSummary?.recentTransactions || transactions.slice(0, 8);

  const insights = useMemo(() => generateInsights(transactions, budgets, selectedMonth), [transactions, budgets, selectedMonth]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.amount || Number(addForm.amount) <= 0) return;
    setAddingSubmitting(true);
    await addTransaction({
      description: addForm.description,
      amount: Number(addForm.amount),
      category: addForm.category,
      type: addForm.type,
      date: addForm.date,
    });
    setAddingSubmitting(false);
    setShowAddModal(false);
    setAddForm({
      description: '',
      amount: '',
      category: 'Food & Dining',
      type: 'expense',
      date: new Date().toISOString().slice(0, 10),
    });
  };

  if (loading && !dashboardSummary && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-36 space-y-4">
        <Spinner size={36} />
        <p className="text-sm text-ink-400">Loading your financial dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-12">
      {/* Header Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-500 dark:text-ink-400">
            {monthLabel(selectedMonth)} · AI-powered cash flow and wealth analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector Dropdown */}
          <div className="relative flex items-center gap-1.5 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-3 py-1.5 shadow-sm">
            <Calendar className="h-4 w-4 text-ink-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-ink-800 dark:text-ink-200 focus:outline-none cursor-pointer pr-1"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-white dark:bg-ink-900 text-ink-900 dark:text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-soft"
          >
            <Plus className="h-4 w-4" /> Add Transaction
          </button>
        </div>
      </motion.div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {/* 1. Total Income */}
        <SummaryCard
          label="Total Income"
          value={formatCurrency(summary.totalIncome, currency)}
          icon={summaryIcons.income}
          gradient="gradient-brand"
          change={momComparison.hasPrevData ? momComparison.incomeChangePct : null}
          changeLabel={momComparison.hasPrevData ? 'vs prev mo' : 'Current month'}
          tooltip="Sum of all verified income received during the selected month."
          delay={0}
        />

        {/* 2. Total Expenses */}
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(summary.totalExpense, currency)}
          icon={summaryIcons.expense}
          gradient="gradient-warm"
          change={momComparison.hasPrevData ? momComparison.expenseChangePct : null}
          changeLabel={momComparison.hasPrevData ? 'vs prev mo' : 'Current month'}
          invertChangeColor={true}
          tooltip="Sum of all expense transactions across all categories."
          delay={0.04}
        />

        {/* 3. Net Savings */}
        <SummaryCard
          label="Net Savings"
          value={formatCurrency(summary.netSavings, currency)}
          icon={summaryIcons.savings}
          gradient="gradient-accent"
          changeLabel={summary.totalIncome > 0 ? `${summary.savingsRate}% rate` : (summary.totalExpense > 0 ? 'Deficit' : 'Balanced')}
          tooltip="Total Income minus Total Expenses. A positive figure indicates wealth accumulation."
          delay={0.08}
        />

        {/* 4. Investments */}
        <SummaryCard
          label="Investments"
          value={formatCurrency(summary.totalInvestments, currency)}
          icon={summaryIcons.investments}
          gradient="gradient-violet"
          changeLabel={summary.investmentsCount > 0 ? `${summary.investmentsCount} holdings` : 'Track assets'}
          tooltip="Total current market valuation of your stocks, mutual funds, gold, and portfolio assets."
          delay={0.12}
        />

        {/* 5. Monthly Budget */}
        <SummaryCard
          label="Monthly Budget"
          value={formatCurrency(summary.totalBudget, currency)}
          icon={summaryIcons.budget}
          gradient="gradient-cool"
          changeLabel={summary.totalBudget > 0 ? `${summary.budgetUtilization}% used` : 'No budget set'}
          tooltip="Total active budget limit configured for this month across all categories."
          delay={0.16}
        />

        {/* 6. AI Health Score */}
        <SummaryCard
          label="AI Health Score"
          value={summary.financialHealth.isInsufficientData ? '--/100' : `${summary.financialHealth.score}/100`}
          icon={summaryIcons.goal}
          gradient="gradient-brand"
          changeLabel={summary.financialHealth.label}
          tooltip="Holistic score (0-100) assessing cash flow, savings rate, budget discipline, and wealth buffer."
          delay={0.2}
        />
      </div>

      {/* Smart Alerts Section */}
      <SmartAlertsSection alerts={smartAlerts} />

      {/* Unified Financial Health Score Breakdown */}
      <FinancialHealthScore
        healthData={summary.financialHealth}
        savingsRate={summary.savingsRate}
        expenseRatio={summary.expenseRatio}
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        investments={summary.totalInvestments}
        currency={currency}
      />

      {/* AI Spending Predictions */}
      <SpendingPredictions
        predictions={predictions}
        historicalTrend={historicalTrend}
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        currency={currency}
        categorySpending={categoryBreakdown}
      />

      {/* Monthly Financial Overview */}
      <MonthlyFinancialOverview
        historicalTrend={historicalTrend}
        categoryBreakdown={categoryBreakdown}
        budgetComparison={budgetComparison}
        momComparison={momComparison}
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        currency={currency}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* Grid: AI Insights + Recent Transactions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions with Inline Edit and Delete Modals */}
        <RecentTransactionsSection
          transactions={recentTransactions}
          currency={currency}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
          onAddClick={() => setShowAddModal(true)}
        />

        {/* AI Financial Recommendations & Insights */}
        <div className="card p-6 border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-soft">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink-900 dark:text-white">
                  AI Financial Insights
                </h3>
                <p className="text-xs text-ink-400">Contextual advice based on your current cash flow</p>
              </div>
            </div>
            <Link
              to="/app/ai-assistant"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Ask AI Advisor <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {insights.map((ins) => {
              const Icon = insightIcons[ins.icon] ?? Info;
              const style = insightStyles[ins.type] || insightStyles.info;
              const iconCol = insightIconColors[ins.type] || 'text-brand-500';

              return (
                <div key={ins.id} className={`rounded-xl border p-3.5 ${style}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconCol}`} />
                    <div>
                      <p className="font-semibold text-xs text-ink-900 dark:text-white">{ins.title}</p>
                      <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
                        {ins.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-md p-6 border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-ink-800">
                <h4 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                  Add Transaction
                </h4>
                <button onClick={() => setShowAddModal(false)} className="text-ink-400 hover:text-ink-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-ink-100 dark:bg-ink-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAddForm((p) => ({ ...p, type: 'expense' }))}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${addForm.type === 'expense' ? 'bg-white dark:bg-ink-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-ink-500'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddForm((p) => ({ ...p, type: 'income' }))}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${addForm.type === 'income' ? 'bg-white dark:bg-ink-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-ink-500'}`}
                  >
                    Income
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 5000"
                    value={addForm.amount}
                    onChange={(e) => setAddForm((p) => ({ ...p, amount: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">Category</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))}
                    className="input-field text-sm"
                  >
                    {categories
                      .filter((c) => (addForm.type === 'income' ? c.type === 'income' || c.type === 'both' : c.type === 'expense' || c.type === 'both'))
                      .map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Salary, Rent, Grocery shopping"
                    value={addForm.description}
                    onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={addForm.date}
                    onChange={(e) => setAddForm((p) => ({ ...p, date: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary flex-1 text-sm py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingSubmitting}
                    className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

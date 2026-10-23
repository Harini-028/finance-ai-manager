import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, BarChart3, Wallet,
} from 'lucide-react';
import { formatCurrency, formatCompact } from '../../lib/format';
import { getCategoryMeta } from '../../lib/constants';

type MonthlyOverviewProps = {
  historicalTrend: { month: string; label: string; income: number; expense: number; savings: number }[];
  categoryBreakdown: { category: string; amount: number; count: number; percentage: number }[];
  budgetComparison: {
    id: string;
    category: string;
    allocated: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'normal' | 'warning' | 'exceeded';
  }[];
  momComparison: {
    hasPrevData: boolean;
    prevMonthStr: string;
    prevIncome: number;
    prevExpense: number;
    prevSavings: number;
    incomeChangePct: number | null;
    expenseChangePct: number | null;
    savingsChangePct: number | null;
  };
  totalIncome: number;
  totalExpense: number;
  currency?: string;
  selectedMonth: string;
  onMonthChange?: (month: string) => void;
};

export function MonthlyFinancialOverview({
  historicalTrend = [],
  categoryBreakdown = [],
  budgetComparison = [],
  momComparison,
  totalIncome,
  totalExpense,
  currency = 'INR',
  selectedMonth,
}: MonthlyOverviewProps) {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'categories' | 'budgets'>('cashflow');

  const pieData = categoryBreakdown.map((c) => ({
    name: c.category,
    value: c.amount,
    color: getCategoryMeta(c.category).color,
    percentage: c.percentage,
  }));

  const netSavings = totalIncome - totalExpense;

  return (
    <div className="card p-6 border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900 shadow-card space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-soft shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                Monthly Financial Overview
              </h3>
              <p className="text-xs text-ink-400">
                Income vs Expense, category distribution, and budget tracking
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-800/50 p-1 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'cashflow' ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-white shadow-sm font-semibold' : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'}`}
          >
            Cash Flow Trend
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'categories' ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-white shadow-sm font-semibold' : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'}`}
          >
            Category Share
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'budgets' ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-white shadow-sm font-semibold' : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'}`}
          >
            Budget Adherence ({budgetComparison.length})
          </button>
        </div>
      </div>

      {/* MoM Comparison Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-ink-100 dark:border-ink-800/80 bg-ink-50/50 dark:bg-ink-800/20">
        <div>
          <p className="text-[11px] font-medium text-ink-400">Income vs Prev Month</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-display text-base font-bold text-ink-900 dark:text-white">
              {formatCurrency(totalIncome, currency)}
            </span>
            {momComparison.hasPrevData && momComparison.incomeChangePct !== null ? (
              <span
                className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md ${momComparison.incomeChangePct >= 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}
              >
                {momComparison.incomeChangePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(momComparison.incomeChangePct)}%
              </span>
            ) : (
              <span className="text-[11px] text-ink-400">Baseline</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-ink-400">Expenses vs Prev Month</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-display text-base font-bold text-ink-900 dark:text-white">
              {formatCurrency(totalExpense, currency)}
            </span>
            {momComparison.hasPrevData && momComparison.expenseChangePct !== null ? (
              <span
                className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md ${momComparison.expenseChangePct <= 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}
              >
                {momComparison.expenseChangePct > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(momComparison.expenseChangePct)}%
              </span>
            ) : (
              <span className="text-[11px] text-ink-400">Baseline</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-ink-400">Net Monthly Savings</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`font-display text-base font-bold ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
            >
              {formatCurrency(netSavings, currency)}
            </span>
            {momComparison.hasPrevData && momComparison.prevSavings !== undefined && (
              <span className="text-[11px] text-ink-400">
                (prev: {formatCurrency(momComparison.prevSavings, currency)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Cash Flow & Savings Trend */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <p className="text-ink-400 font-medium">6-Month Historical Flow (Actual MongoDB Records)</p>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Expenses
              </span>
              <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Savings
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalTrend}>
                <defs>
                  <linearGradient id="flowIncomeG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="flowExpenseG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(v, currency)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                    fontSize: 12,
                  }}
                  formatter={(v: any) => [formatCurrency(Number(v), currency), '']}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#flowIncomeG)" />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke="#f59e0b" strokeWidth={2.5} fill="url(#flowExpenseG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Category Distribution */}
      {activeTab === 'categories' && (
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          {pieData.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs text-ink-400">
              No expenses recorded for this month yet.
            </div>
          ) : (
            <>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(Number(v), currency), 'Total']}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: '#0F172A',
                        color: '#fff',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Legend Table */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2">
                {categoryBreakdown.map((cat) => {
                  const meta = getCategoryMeta(cat.category);
                  return (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-800/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                        <span className="text-xs font-semibold text-ink-900 dark:text-white truncate">
                          {cat.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-ink-900 dark:text-white">
                          {formatCurrency(cat.amount, currency)}
                        </p>
                        <p className="text-[10px] text-ink-400">{cat.percentage}% of total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Budget Adherence by Category */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          {budgetComparison.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-ink-400">
              <Wallet className="h-8 w-8 mx-auto text-ink-300 dark:text-ink-600" />
              <p className="text-xs">No budgets set for this month ({selectedMonth}).</p>
              <p className="text-[11px] text-ink-400">Navigate to the Budget page to configure category allocations.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {budgetComparison.map((b) => (
                <div key={b.id} className="space-y-1.5 p-3 rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-800/30">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink-900 dark:text-white">{b.category}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${b.status === 'exceeded' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : b.status === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}
                      >
                        {b.percentage}% used
                      </span>
                    </div>
                    <span className="text-ink-400">
                      {formatCurrency(b.spent, currency)} / {formatCurrency(b.allocated, currency)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-ink-200 dark:bg-ink-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(b.percentage, 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${b.status === 'exceeded' ? 'bg-rose-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    />
                  </div>

                  <p className="text-[11px] text-ink-400 text-right">
                    {b.status === 'exceeded'
                      ? `Over budget by ${formatCurrency(b.spent - b.allocated, currency)}`
                      : `${formatCurrency(b.remaining, currency)} remaining`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

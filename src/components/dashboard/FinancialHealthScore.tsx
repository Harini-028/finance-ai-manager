import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, TrendingUp, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

export type HealthScoreBreakdownItem = {
  factor: string;
  scoreContribution: number;
  maxScore: number;
  status: 'positive' | 'warning' | 'negative';
  reason: string;
};

export type HealthScoreData = {
  score: number;
  label: string;
  grade: string;
  color: string;
  isInsufficientData: boolean;
  breakdown: HealthScoreBreakdownItem[];
  recommendations: string[];
};

type HealthScoreProps = {
  healthData?: HealthScoreData | null;
  savingsRate: number;
  expenseRatio: number;
  totalIncome: number;
  totalExpense: number;
  investments: number;
  currency?: string;
};

export function FinancialHealthScore({
  healthData,
  savingsRate,
  expenseRatio,
  totalIncome,
  totalExpense,
  investments,
  currency = 'INR',
}: HealthScoreProps) {
  const isInsufficient = healthData?.isInsufficientData || (totalIncome === 0 && totalExpense === 0);
  const score = isInsufficient ? 0 : (healthData?.score ?? 0);
  const label = isInsufficient ? 'Setup Needed' : (healthData?.label ?? 'Fair');
  const grade = isInsufficient ? 'N/A' : (healthData?.grade ?? 'C');
  const color = isInsufficient ? '#94a3b8' : (healthData?.color ?? '#10b981');
  const breakdown = healthData?.breakdown || [];
  const recommendations = healthData?.recommendations || [];

  // SVG circular gauge math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isInsufficient ? circumference : circumference - (score / 100) * circumference;

  return (
    <div className="card p-6 border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900 shadow-card">
      {/* Top Header with Circular Indicator */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-ink-100 dark:border-ink-800/60">
        <div className="flex items-center gap-5">
          {/* Circular SVG Gauge */}
          <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-ink-100 dark:stroke-ink-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress Animated Circle */}
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke={color}
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-2xl font-bold text-ink-900 dark:text-white leading-none">
                {isInsufficient ? '--' : score}
              </span>
              <span className="text-[10px] uppercase font-semibold text-ink-400 mt-1">
                {isInsufficient ? 'Data' : '/ 100'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">
                Financial Health Score
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide"
                style={{ backgroundColor: `${color}18`, color }}
              >
                {label} {grade !== 'N/A' && `· Grade ${grade}`}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400 max-w-xl leading-relaxed">
              AI-driven assessment evaluating your savings rate, budget discipline, expense ratio, and wealth safety buffer.
            </p>
          </div>
        </div>

        {/* Quick Snapshot Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
          <div className="glass-card px-3.5 py-2.5 text-center min-w-[95px]">
            <p className="text-[11px] text-ink-400 font-medium">Savings Rate</p>
            <p className="font-display text-base font-bold text-emerald-600 dark:text-emerald-400">
              {totalIncome > 0 ? `${savingsRate}%` : 'N/A'}
            </p>
          </div>
          <div className="glass-card px-3.5 py-2.5 text-center min-w-[95px]">
            <p className="text-[11px] text-ink-400 font-medium">Expense Ratio</p>
            <p className="font-display text-base font-bold text-amber-600 dark:text-amber-400">
              {totalIncome > 0 ? `${expenseRatio}%` : (totalExpense > 0 ? '100%' : '0%')}
            </p>
          </div>
          <div className="glass-card px-3.5 py-2.5 text-center min-w-[95px]">
            <p className="text-[11px] text-ink-400 font-medium">Investments</p>
            <p className="font-display text-base font-bold text-indigo-600 dark:text-indigo-400 truncate">
              {formatCurrency(investments, currency)}
            </p>
          </div>
          <div className="glass-card px-3.5 py-2.5 text-center min-w-[95px]">
            <p className="text-[11px] text-ink-400 font-medium">Monthly Cashflow</p>
            <p className={`font-display text-base font-bold ${totalIncome >= totalExpense ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(totalIncome - totalExpense, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Insufficient Data State */}
      {isInsufficient && (
        <div className="mt-5 p-4 rounded-xl border border-brand-500/30 bg-brand-500/5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
          <div className="text-xs text-ink-600 dark:text-ink-300">
            <p className="font-semibold text-ink-900 dark:text-white mb-0.5">Welcome to FinPilot AI!</p>
            <p>
              Your personal financial health score will calculate automatically as soon as you record your monthly salary or income and day-to-day expenses.
            </p>
          </div>
        </div>
      )}

      {/* Breakdown Factors Grid */}
      <div className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-400">
            Transparent Contributing Factors
          </h3>
          <span className="text-[11px] text-ink-400">Score Range: 0 to 100</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {breakdown.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-800/30 transition-colors hover:border-ink-200 dark:hover:border-ink-700"
            >
              <div className="flex items-start gap-3">
                {item.status === 'positive' ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : item.status === 'warning' ? (
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{item.factor}</p>
                    <span className="text-[10px] font-bold text-ink-400">
                      +{item.scoreContribution}/{item.maxScore} pts
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations on How to Improve */}
      {recommendations.length > 0 && (
        <div className="mt-5 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingUp className="h-4 w-4" /> Recommended Steps to Improve Your Score
          </p>
          <ul className="space-y-1.5 text-xs text-ink-600 dark:text-ink-300">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className="mt-5 pt-4 border-t border-ink-100 dark:border-ink-800/60 flex items-center gap-2 text-[11px] text-ink-400">
        <HelpCircle className="h-3.5 w-3.5 shrink-0" />
        <span>
          Educational Metric · FinPilot AI calculates this health score from your real recorded transactions, budgets, and savings goals. This is not an official credit score or banking credit rating.
        </span>
      </div>
    </div>
  );
}

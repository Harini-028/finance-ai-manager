import { useState, useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { formatCurrency, formatCompact } from '../../lib/format';

export type SpendingRiskCategory = {
  category: string;
  amount: number;
  riskLevel: string;
  reason: string;
};

export type PredictionsData = {
  predictedExpense: number;
  predictedSavings: number;
  method: string;
  confidence: string;
  insightText: string;
  riskCategories: SpendingRiskCategory[];
  isInsufficientData: boolean;
};

type ForecastPoint = {
  name: string;
  Actual: number;
  Predicted: number;
  type?: string;
  isPrediction?: boolean;
};

type PredictionsProps = {
  predictions?: PredictionsData | null;
  historicalTrend?: { month: string; label: string; income: number; expense: number; savings: number }[];
  totalIncome?: number;
  totalExpense: number;
  currency?: string;
  categorySpending?: { category: string; amount: number; percentage?: number }[];
};

export function SpendingPredictions({
  predictions,
  historicalTrend = [],
  totalExpense,
  currency = 'INR',
}: PredictionsProps) {
  const [viewMode, setViewMode] = useState<'comparison' | 'trend'>('comparison');

  const isInsufficient = predictions?.isInsufficientData || (totalExpense === 0 && historicalTrend.every((h) => h.expense === 0));
  const predictedExpense = isInsufficient ? 0 : (predictions?.predictedExpense ?? totalExpense);
  const confidence = predictions?.confidence ?? (totalExpense > 0 ? 'Moderate' : 'Low');
  const riskCategories = predictions?.riskCategories || [];

  // Chart Data: Next Month Outlook comparison
  const comparisonData: ForecastPoint[] = useMemo(() => {
    return [
      {
        name: 'Current Outflow',
        Actual: totalExpense,
        Predicted: 0,
        type: 'actual',
        isPrediction: false,
      },
      {
        name: 'Next Month (AI Est.)',
        Actual: 0,
        Predicted: predictedExpense,
        type: 'predicted',
        isPrediction: true,
      },
    ];
  }, [totalExpense, predictedExpense]);

  // Chart Data: 6-month historical trend plus next month
  const trendData: ForecastPoint[] = useMemo(() => {
    const points: ForecastPoint[] = historicalTrend.map((h) => ({
      name: h.label,
      Actual: h.expense,
      Predicted: 0,
      type: 'actual',
      isPrediction: false,
    }));

    if (!isInsufficient && predictedExpense > 0) {
      points.push({
        name: 'Next Mo (AI)',
        Actual: 0,
        Predicted: predictedExpense,
        type: 'predicted',
        isPrediction: true,
      });
    }

    return points;
  }, [historicalTrend, predictedExpense, isInsufficient]);

  return (
    <div className="card p-6 space-y-6 border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900 shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-soft shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                AI Spending Forecast
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {confidence} Confidence
              </span>
            </div>
            <p className="text-xs text-ink-400">
              Data-driven projections calculated from your verified transaction history
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-800/50 p-1 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'comparison' ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-white shadow-sm' : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'}`}
          >
            Outlook Comparison
          </button>
          <button
            onClick={() => setViewMode('trend')}
            className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'trend' ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-white shadow-sm' : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200'}`}
          >
            Historical + AI Trend
          </button>
        </div>
      </div>

      {/* Main Content / Insufficient Data Guard */}
      {isInsufficient ? (
        <div className="py-12 px-6 rounded-2xl border border-dashed border-ink-200 dark:border-ink-800 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 dark:bg-ink-800 text-ink-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h4 className="font-display font-semibold text-ink-800 dark:text-white">
            Insufficient Historical Data for Spending Predictions
          </h4>
          <p className="text-xs text-ink-400 max-w-md mx-auto">
            FinPilot AI computes predictions using real cash-outflow patterns. Add your regular transactions and monthly bills to generate accurate, non-fabricated predictive forecasts.
          </p>
        </div>
      ) : (
        <>
          {/* AI Forecast Banner */}
          <div className="p-4 rounded-xl border border-violet-500/25 bg-violet-500/5 text-sm text-ink-800 dark:text-ink-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-violet-700 dark:text-violet-300">
                  Forecast Overview
                </p>
                <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                  {predictions?.insightText || `Your estimated total outflow for next month is projected at ${formatCurrency(predictedExpense, currency)}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viewMode === 'comparison' ? comparisonData : trendData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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
                  formatter={(v: any) => [formatCurrency(Number(v), currency), 'Amount']}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar name="Actual Spending" dataKey="Actual" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar name="AI Estimated Outflow" dataKey="Predicted" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category-Wise Spending Risk Section */}
          <div className="pt-2 border-t border-ink-100 dark:border-ink-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Category Spending Risk Analysis
              </h4>
              <span className="text-[11px] text-ink-400">Based on budget adherence & proportion</span>
            </div>

            {riskCategories.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {riskCategories.map((rc, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-800/30"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-ink-900 dark:text-white truncate">{rc.category}</p>
                        <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">
                          {formatCurrency(rc.amount, currency)}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-400 mt-0.5">{rc.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>All category spending levels are well-balanced and within healthy thresholds.</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer Disclaimer */}
      <div className="pt-2 text-[11px] text-ink-400 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" />
        <span>
          AI Estimation · Forecasts are estimates generated from historical transaction trends and budget limits. They are not guaranteed financial outcomes.
        </span>
      </div>
    </div>
  );
}

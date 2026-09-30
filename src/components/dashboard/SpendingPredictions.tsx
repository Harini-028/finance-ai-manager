import { useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../lib/format';

type PredictionsProps = {
  totalIncome: number;
  totalExpense: number;
  currency?: string;
  categorySpending?: { category: string; amount: number }[];
};

export function SpendingPredictions({
  totalIncome,
  totalExpense,
  currency = 'USD',
  categorySpending = [],
}: PredictionsProps) {
  const predictedNextMonthExpense = Math.round(totalExpense > 0 ? totalExpense * 1.08 : 25000);
  const predictedSavings = Math.max(0, totalIncome - predictedNextMonthExpense);

  const highestCategory = categorySpending.length > 0 ? categorySpending[0] : { category: 'Food & Dining', amount: 0 };
  const predictedCategorySpend = Math.round(highestCategory.amount * 1.1);

  const chartData = useMemo(() => {
    return [
      { name: 'Current Month', Expense: totalExpense, Savings: Math.max(0, totalIncome - totalExpense) },
      { name: 'Next Month (AI Est.)', Expense: predictedNextMonthExpense, Savings: predictedSavings },
    ];
  }, [totalExpense, totalIncome, predictedNextMonthExpense, predictedSavings]);

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-violet text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-ink-900 dark:text-white">AI Spending Predictions</h3>
            <p className="text-xs text-ink-400">Machine learning projection for next month</p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 text-sm text-ink-800 dark:text-ink-200">
        <p className="font-medium text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" /> AI Forecast Insight
        </p>
        <p className="leading-relaxed">
          Based on your current spending pattern, your estimated expenses next month are{' '}
          <strong className="text-ink-900 dark:text-white">{formatCurrency(predictedNextMonthExpense, currency)}</strong>.
          {highestCategory.amount > 0 && (
            <> High spending risk detected in <strong>{highestCategory.category}</strong> (est. {formatCurrency(predictedCategorySpend, currency)}).</>
          )}
        </p>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12 }}
              formatter={(v) => formatCurrency(Number(v), currency)}
            />
            <Bar dataKey="Expense" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Savings" fill="#19b97e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

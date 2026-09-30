import { useMemo } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { aiScoreLabel } from '../../lib/analytics';

type HealthScoreProps = {
  savingsRate: number;
  budgetUtilization: number;
  totalIncome: number;
  totalExpense: number;
  investments: number;
  emergencySavings?: number;
};

export function FinancialHealthScore({
  savingsRate,
  budgetUtilization,
  totalIncome,
  totalExpense,
  investments,
}: HealthScoreProps) {
  const expenseToIncomeRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 100;
  const investmentRatio = totalIncome > 0 ? Math.round((investments / totalIncome) * 100) : 0;

  const scoreDetails = useMemo(() => {
    let score = 50; // base score
    const breakdown: { factor: string; scoreContribution: number; status: 'positive' | 'warning' | 'negative'; reason: string }[] = [];

    // 1. Savings Rate (up to 25 pts)
    if (savingsRate >= 20) {
      score += 25;
      breakdown.push({ factor: 'Savings Rate', scoreContribution: 25, status: 'positive', reason: `High savings rate at ${savingsRate}% (target: >=20%).` });
    } else if (savingsRate >= 10) {
      score += 15;
      breakdown.push({ factor: 'Savings Rate', scoreContribution: 15, status: 'warning', reason: `Moderate savings rate at ${savingsRate}%. Aim for 20%.` });
    } else if (savingsRate >= 0) {
      score += 5;
      breakdown.push({ factor: 'Savings Rate', scoreContribution: 5, status: 'warning', reason: `Low savings rate at ${savingsRate}%.` });
    } else {
      score -= 15;
      breakdown.push({ factor: 'Savings Rate', scoreContribution: -15, status: 'negative', reason: 'Negative savings rate. You are spending more than earned.' });
    }

    // 2. Expense-to-Income Ratio (up to 20 pts)
    if (expenseToIncomeRatio <= 60) {
      score += 20;
      breakdown.push({ factor: 'Expense Ratio', scoreContribution: 20, status: 'positive', reason: `Low expense-to-income ratio (${expenseToIncomeRatio}%).` });
    } else if (expenseToIncomeRatio <= 80) {
      score += 10;
      breakdown.push({ factor: 'Expense Ratio', scoreContribution: 10, status: 'warning', reason: `Expense ratio at ${expenseToIncomeRatio}%. Keep expenses below 70%.` });
    } else {
      score -= 10;
      breakdown.push({ factor: 'Expense Ratio', scoreContribution: -10, status: 'negative', reason: `High expense ratio (${expenseToIncomeRatio}%).` });
    }

    // 3. Budget Utilization (up to 15 pts)
    if (budgetUtilization > 0) {
      if (budgetUtilization <= 80) {
        score += 15;
        breakdown.push({ factor: 'Budget Utilization', scoreContribution: 15, status: 'positive', reason: `Well within budget at ${budgetUtilization}%.` });
      } else if (budgetUtilization <= 100) {
        score += 5;
        breakdown.push({ factor: 'Budget Utilization', scoreContribution: 5, status: 'warning', reason: `Near budget limit (${budgetUtilization}%).` });
      } else {
        score -= 10;
        breakdown.push({ factor: 'Budget Utilization', scoreContribution: -10, status: 'negative', reason: `Budget exceeded (${budgetUtilization}%).` });
      }
    }

    // 4. Investment Ratio (up to 15 pts)
    if (investmentRatio >= 15) {
      score += 15;
      breakdown.push({ factor: 'Investments', scoreContribution: 15, status: 'positive', reason: `Strong investment allocation (${investmentRatio}% of income).` });
    } else if (investmentRatio > 0) {
      score += 8;
      breakdown.push({ factor: 'Investments', scoreContribution: 8, status: 'warning', reason: `Investing ${investmentRatio}% of income. Increase allocation.` });
    }

    // Clamp score 0 to 100
    const finalScore = Math.min(Math.max(Math.round(score), 0), 100);
    return { score: finalScore, breakdown };
  }, [savingsRate, budgetUtilization, totalIncome, totalExpense, investments, expenseToIncomeRatio, investmentRatio]);

  const rating = aiScoreLabel(scoreDetails.score);

  return (
    <div className="card p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-ink-100 dark:border-ink-800">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center h-24 w-24 rounded-full gradient-brand text-white shadow-glow">
            <span className="font-display text-3xl font-bold">{scoreDetails.score}</span>
            <span className="text-xs text-white/80 absolute bottom-3">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">Financial Health Score</h2>
              <span className="badge" style={{ backgroundColor: `${rating.color}20`, color: rating.color }}>
                {rating.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Evaluates savings rate, expense-to-income, budget control, and investments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-3 text-center min-w-[100px]">
            <p className="text-xs text-ink-400">Savings Rate</p>
            <p className="font-display text-lg font-bold text-brand-500">{savingsRate}%</p>
          </div>
          <div className="glass-card px-4 py-3 text-center min-w-[100px]">
            <p className="text-xs text-ink-400">Expense Ratio</p>
            <p className="font-display text-lg font-bold text-accent-500">{expenseToIncomeRatio}%</p>
          </div>
        </div>
      </div>

      {/* Breakdown explanation */}
      <div className="pt-5 space-y-3">
        <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Score Breakdown & Analysis</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {scoreDetails.breakdown.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/40">
              {item.status === 'positive' ? (
                <ShieldCheck className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
              ) : item.status === 'warning' ? (
                <AlertCircle className="h-5 w-5 text-warning-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-error-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{item.factor}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-snug">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

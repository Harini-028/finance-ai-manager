import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Investment from '../models/Investment.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Subscription from '../models/Subscription.js';

// Helper: round to 2 decimals safely
const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

// Helper: Calculate Unified Financial Health Score
const calculateFinancialHealthScore = ({
  totalIncome,
  totalExpense,
  totalInvestments,
  totalSavingsGoals,
  totalBudget,
  budgetSpent,
  hasTransactions,
}) => {
  if (!hasTransactions) {
    return {
      score: 0,
      label: 'Insufficient Data',
      grade: 'N/A',
      color: '#94a3b8',
      isInsufficientData: true,
      breakdown: [
        {
          factor: 'Transaction History',
          scoreContribution: 0,
          maxScore: 30,
          status: 'warning',
          reason: 'No transactions recorded yet. Add your income and expenses to unlock health scoring.',
        },
        {
          factor: 'Budget Tracking',
          scoreContribution: 0,
          maxScore: 25,
          status: 'warning',
          reason: 'Create monthly category budgets to track adherence.',
        },
        {
          factor: 'Expense Discipline',
          scoreContribution: 0,
          maxScore: 25,
          status: 'warning',
          reason: 'Maintain spending within 70% of income.',
        },
        {
          factor: 'Wealth Buffer',
          scoreContribution: 0,
          maxScore: 20,
          status: 'warning',
          reason: 'Track investments and savings goals to build resilience.',
        },
      ],
      recommendations: [
        'Add your primary income sources (salary, freelance, investments).',
        'Record regular living expenses to establish your financial baseline.',
        'Set up realistic monthly category budgets in the Budget tab.',
      ],
    };
  }

  let score = 0;
  const breakdown = [];
  const recommendations = [];

  // 1. Savings Rate (Up to 30 points)
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? round2((savings / totalIncome) * 100) : (totalExpense === 0 ? 0 : -100);

  if (totalIncome > 0) {
    if (savingsRate >= 25) {
      score += 30;
      breakdown.push({
        factor: 'Savings Rate',
        scoreContribution: 30,
        maxScore: 30,
        status: 'positive',
        reason: `Excellent savings rate of ${savingsRate}% (benchmark: ≥20%).`,
      });
    } else if (savingsRate >= 15) {
      score += 22;
      breakdown.push({
        factor: 'Savings Rate',
        scoreContribution: 22,
        maxScore: 30,
        status: 'positive',
        reason: `Solid savings rate of ${savingsRate}%. Aim for 25% to maximize growth.`,
      });
    } else if (savingsRate >= 5) {
      score += 14;
      breakdown.push({
        factor: 'Savings Rate',
        scoreContribution: 14,
        maxScore: 30,
        status: 'warning',
        reason: `Modest savings rate of ${savingsRate}%. Try reducing non-essential expenses.`,
      });
      recommendations.push('Increase your monthly savings to at least 15–20% of net income.');
    } else if (savingsRate >= 0) {
      score += 6;
      breakdown.push({
        factor: 'Savings Rate',
        scoreContribution: 6,
        maxScore: 30,
        status: 'warning',
        reason: `Break-even savings rate (${savingsRate}%). Any unexpected expense may cause a deficit.`,
      });
      recommendations.push('Audit recurring subscriptions and dining expenses to boost savings.');
    } else {
      score += 0;
      breakdown.push({
        factor: 'Savings Rate',
        scoreContribution: 0,
        maxScore: 30,
        status: 'negative',
        reason: `Negative savings rate (${savingsRate}%). Spending exceeds earned income this month.`,
      });
      recommendations.push('Immediate action needed: Trim discretionary expenses to stop debt accumulation.');
    }
  } else {
    // Zero income recorded for the month
    if (totalExpense > 0) {
      score += 0;
      breakdown.push({
        factor: 'Savings Rate',
        scoreContribution: 0,
        maxScore: 30,
        status: 'negative',
        reason: `No income logged this month with expenses of ${round2(totalExpense)}.`,
      });
      recommendations.push('Record your monthly income to accurately evaluate savings rate.');
    } else {
      score += 15;
      breakdown.push({
        factor: 'Savings Rate',
        scoreContribution: 15,
        maxScore: 30,
        status: 'warning',
        reason: 'Zero income and zero expenses logged for this period.',
      });
    }
  }

  // 2. Expense-to-Income Ratio (Up to 25 points)
  const expenseRatio = totalIncome > 0 ? round2((totalExpense / totalIncome) * 100) : (totalExpense > 0 ? 100 : 0);

  if (totalIncome > 0) {
    if (expenseRatio <= 50) {
      score += 25;
      breakdown.push({
        factor: 'Expense Discipline',
        scoreContribution: 25,
        maxScore: 25,
        status: 'positive',
        reason: `Superior expense control (${expenseRatio}% of income used).`,
      });
    } else if (expenseRatio <= 70) {
      score += 20;
      breakdown.push({
        factor: 'Expense Discipline',
        scoreContribution: 20,
        maxScore: 25,
        status: 'positive',
        reason: `Healthy expense-to-income ratio at ${expenseRatio}% (target: ≤70%).`,
      });
    } else if (expenseRatio <= 85) {
      score += 12;
      breakdown.push({
        factor: 'Expense Discipline',
        scoreContribution: 12,
        maxScore: 25,
        status: 'warning',
        reason: `High expense ratio at ${expenseRatio}%. Leaves little room for emergencies.`,
      });
      recommendations.push('Aim to keep fixed and discretionary expenses under 70% of total income.');
    } else {
      score += 4;
      breakdown.push({
        factor: 'Expense Discipline',
        scoreContribution: 4,
        maxScore: 25,
        status: 'negative',
        reason: `Critical expense ratio (${expenseRatio}%). Budget is under severe strain.`,
      });
      recommendations.push('Review high-spending categories to bring total outlays down.');
    }
  } else {
    score += totalExpense === 0 ? 15 : 5;
    breakdown.push({
      factor: 'Expense Discipline',
      scoreContribution: totalExpense === 0 ? 15 : 5,
      maxScore: 25,
      status: totalExpense === 0 ? 'positive' : 'warning',
      reason: totalExpense === 0 ? 'No expenses recorded this month.' : 'Expenses present without registered income.',
    });
  }

  // 3. Budget Adherence (Up to 25 points)
  if (totalBudget > 0) {
    const budgetPct = round2((budgetSpent / totalBudget) * 100);
    if (budgetPct <= 80) {
      score += 25;
      breakdown.push({
        factor: 'Budget Adherence',
        scoreContribution: 25,
        maxScore: 25,
        status: 'positive',
        reason: `Comfortably within budget (${budgetPct}% allocated spent).`,
      });
    } else if (budgetPct <= 100) {
      score += 18;
      breakdown.push({
        factor: 'Budget Adherence',
        scoreContribution: 18,
        maxScore: 25,
        status: 'warning',
        reason: `Close to budget limit (${budgetPct}% spent).`,
      });
      recommendations.push('Monitor remaining category budgets to prevent month-end overspending.');
    } else {
      score += 5;
      breakdown.push({
        factor: 'Budget Adherence',
        scoreContribution: 5,
        maxScore: 25,
        status: 'negative',
        reason: `Budget exceeded by ${round2(budgetPct - 100)}% (${budgetPct}% total used).`,
      });
      recommendations.push('Reallocate category limits or cut back on over-budget items.');
    }
  } else {
    score += 12; // Neutral baseline when no budget set yet
    breakdown.push({
      factor: 'Budget Adherence',
      scoreContribution: 12,
      maxScore: 25,
      status: 'warning',
      reason: 'No monthly category budgets configured for this period.',
    });
    recommendations.push('Set monthly budgets for top categories like Food, Utilities, and Shopping.');
  }

  // 4. Financial Buffer & Wealth Growth (Up to 20 points)
  const totalAssets = totalInvestments + totalSavingsGoals;
  if (totalAssets > 0) {
    if (totalAssets >= (totalExpense * 3) && totalExpense > 0) {
      score += 20;
      breakdown.push({
        factor: 'Wealth Buffer & Assets',
        scoreContribution: 20,
        maxScore: 20,
        status: 'positive',
        reason: `Strong safety buffer with investment portfolio & goals covering >3 months of expenses.`,
      });
    } else {
      score += 14;
      breakdown.push({
        factor: 'Wealth Buffer & Assets',
        scoreContribution: 14,
        maxScore: 20,
        status: 'positive',
        reason: `Active investment portfolio / savings goals detected.`,
      });
      recommendations.push('Continue building an emergency fund covering 3 to 6 months of living expenses.');
    }
  } else {
    score += 5;
    breakdown.push({
      factor: 'Wealth Buffer & Assets',
      scoreContribution: 5,
      maxScore: 20,
      status: 'warning',
      reason: 'No investments or savings goals tracked yet.',
    });
    recommendations.push('Add your mutual funds, stocks, or savings goals to build wealth tracking.');
  }

  const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

  let label = 'Needs Improvement';
  let grade = 'D';
  let color = '#ef4444';

  if (finalScore >= 80) {
    label = 'Excellent';
    grade = 'A+';
    color = '#10b981';
  } else if (finalScore >= 65) {
    label = 'Good';
    grade = 'B';
    color = '#34d399';
  } else if (finalScore >= 50) {
    label = 'Fair';
    grade = 'C';
    color = '#f59e0b';
  } else if (finalScore >= 35) {
    label = 'Needs Work';
    grade = 'D';
    color = '#f97316';
  }

  return {
    score: finalScore,
    label,
    grade,
    color,
    isInsufficientData: false,
    breakdown,
    recommendations: recommendations.slice(0, 3),
  };
};

// @desc    Get dashboard analytics & summary
// @route   GET /api/dashboard
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Selected month (defaults to current month: YYYY-MM)
    const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7);
    const [yearNum, monthNum] = selectedMonth.split('-').map(Number);

    const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    // Previous month range
    const prevDate = new Date(Date.UTC(yearNum, monthNum - 2, 1));
    const prevMonthStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const startOfPrevMonth = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth(), 1, 0, 0, 0, 0));
    const endOfPrevMonth = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    // 1. Current Month Aggregation (Income & Expense)
    const currentMonthAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    currentMonthAgg.forEach((item) => {
      if (item._id === 'income') {
        totalIncome = round2(item.total);
        incomeCount = item.count;
      }
      if (item._id === 'expense') {
        totalExpense = round2(item.total);
        expenseCount = item.count;
      }
    });

    const netSavings = round2(totalIncome - totalExpense);
    const savingsRate = totalIncome > 0 ? round2((netSavings / totalIncome) * 100) : 0;
    const expenseRatio = totalIncome > 0 ? round2((totalExpense / totalIncome) * 100) : (totalExpense > 0 ? 100 : 0);

    // 2. Previous Month Aggregation for MoM Comparison
    const prevMonthAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let prevIncome = 0;
    let prevExpense = 0;
    let hasPrevData = false;

    prevMonthAgg.forEach((item) => {
      hasPrevData = true;
      if (item._id === 'income') prevIncome = round2(item.total);
      if (item._id === 'expense') prevExpense = round2(item.total);
    });

    const prevSavings = round2(prevIncome - prevExpense);
    const incomeChangePct = prevIncome > 0 ? round2(((totalIncome - prevIncome) / prevIncome) * 100) : null;
    const expenseChangePct = prevExpense > 0 ? round2(((totalExpense - prevExpense) / prevExpense) * 100) : null;
    const savingsChangePct = prevIncome > 0 ? round2(((netSavings - prevSavings) / Math.abs(prevSavings || 1)) * 100) : null;

    // 3. Investments Total
    const investmentsDocs = await Investment.find({ userId });
    const totalInvestments = round2(
      investmentsDocs.reduce((sum, inv) => sum + (inv.shares || 0) * (inv.currentPrice || inv.purchasePrice || 0), 0)
    );
    const investmentsCount = investmentsDocs.length;

    // 4. Budgets and category spending for selected month
    const budgetsDocs = await Budget.find({ userId, month: selectedMonth });
    const totalBudget = round2(budgetsDocs.reduce((sum, b) => sum + (b.amount || 0), 0));

    // Category-wise expenses in current month
    const categorySpendingAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const categorySpendingMap = new Map();
    const categoryBreakdown = categorySpendingAgg.map((item) => {
      const amt = round2(item.totalAmount);
      categorySpendingMap.set(item._id, amt);
      return {
        category: item._id,
        amount: amt,
        count: item.count,
        percentage: totalExpense > 0 ? round2((amt / totalExpense) * 100) : 0,
      };
    });

    // Budget Comparison by Category
    const budgetComparison = budgetsDocs.map((b) => {
      const spent = round2(categorySpendingMap.get(b.category) || 0);
      const allocated = round2(b.amount || 0);
      const pct = allocated > 0 ? round2((spent / allocated) * 100) : 0;
      let status = 'normal';
      if (pct >= 100) status = 'exceeded';
      else if (pct >= 80) status = 'warning';

      return {
        id: b._id.toString(),
        category: b.category,
        allocated,
        spent,
        remaining: Math.max(0, round2(allocated - spent)),
        percentage: pct,
        status,
      };
    });

    const budgetSpent = round2(
      budgetsDocs.reduce((sum, b) => sum + (categorySpendingMap.get(b.category) || 0), 0)
    );
    const remainingBudget = Math.max(0, round2(totalBudget - budgetSpent));
    const budgetUtilization = totalBudget > 0 ? round2((budgetSpent / totalBudget) * 100) : 0;

    // 5. Savings Goals
    const savingsGoalsDocs = await SavingsGoal.find({ userId });
    const totalSavingsGoals = round2(savingsGoalsDocs.reduce((sum, g) => sum + (g.currentAmount || 0), 0));

    // 6. Check total transaction count across all time to know if user has any data
    const totalTxCount = await Transaction.countDocuments({ userId });
    const hasTransactions = totalTxCount > 0;

    // 7. Unified Financial Health Score
    const financialHealth = calculateFinancialHealthScore({
      totalIncome,
      totalExpense,
      totalInvestments,
      totalSavingsGoals,
      totalBudget,
      budgetSpent,
      hasTransactions,
    });

    // 8. Multi-month Historical Trend (Past 6 Months)
    const pastMonthsData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const mStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
      const mEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

      const monthAgg = await Transaction.aggregate([
        {
          $match: {
            userId,
            date: { $gte: mStart, $lte: mEnd },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);

      let mInc = 0;
      let mExp = 0;
      monthAgg.forEach((item) => {
        if (item._id === 'income') mInc = round2(item.total);
        if (item._id === 'expense') mExp = round2(item.total);
      });

      pastMonthsData.push({
        month: mStr,
        label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        income: mInc,
        expense: mExp,
        savings: round2(mInc - mExp),
      });
    }

    // 9. AI Spending Predictions based on real data
    // Calculate 3-month expense history
    const nonZeroExpenseMonths = pastMonthsData.filter((m) => m.expense > 0);
    let predictedExpense = 0;
    let predictionMethod = 'insufficient_data';
    let predictionInsight = '';
    const riskCategories = [];

    if (nonZeroExpenseMonths.length >= 2) {
      // Weighted moving average
      const recent = nonZeroExpenseMonths.slice(-3);
      if (recent.length === 3) {
        predictedExpense = round2(recent[0].expense * 0.2 + recent[1].expense * 0.3 + recent[2].expense * 0.5);
      } else {
        predictedExpense = round2(recent.reduce((sum, m) => sum + m.expense, 0) / recent.length);
      }
      predictionMethod = 'weighted_average';
      predictionInsight = `Based on your past ${recent.length} months of spending activity, your estimated outflow next month is ${predictedExpense}.`;
    } else if (totalExpense > 0) {
      // Single month run rate: extrapolate or baseline
      predictedExpense = totalExpense;
      predictionMethod = 'single_month_baseline';
      predictionInsight = `Based on your current month spending of ${totalExpense}, estimated baseline for next month is ${totalExpense}.`;
    } else {
      predictedExpense = 0;
      predictionMethod = 'insufficient_data';
      predictionInsight = 'Add recurring transactions to unlock accurate ML predictions.';
    }

    // Determine category risks based on actual data
    categoryBreakdown.forEach((cat) => {
      // Check if category spending exceeds category budget
      const matchingBudget = budgetsDocs.find((b) => b.category === cat.category);
      if (matchingBudget && cat.amount > matchingBudget.amount) {
        riskCategories.push({
          category: cat.category,
          amount: cat.amount,
          riskLevel: 'high',
          reason: `Exceeded budget limit by ${round2(cat.amount - matchingBudget.amount)}`,
        });
      } else if (totalExpense > 0 && (cat.amount / totalExpense) >= 0.35) {
        riskCategories.push({
          category: cat.category,
          amount: cat.amount,
          riskLevel: 'moderate',
          reason: `Represents ${cat.percentage}% of your monthly expenses`,
        });
      }
    });

    const predictedSavings = Math.max(0, round2(totalIncome - predictedExpense));

    // 10. Smart Financial Alerts (Dynamic & Rule-based)
    const smartAlerts = [];

    // Alert: Budget warnings
    budgetComparison.forEach((b) => {
      if (b.status === 'exceeded') {
        smartAlerts.push({
          id: `budget-exceeded-${b.category}`,
          type: 'danger',
          category: 'budget',
          title: `${b.category} Budget Exceeded`,
          message: `You've spent ${b.spent} against an allocated budget of ${b.allocated} (${b.percentage}% used).`,
          actionLink: '/app/budget',
        });
      } else if (b.status === 'warning') {
        smartAlerts.push({
          id: `budget-warning-${b.category}`,
          type: 'warning',
          category: 'budget',
          title: `${b.category} Budget Near Limit`,
          message: `You've utilized ${b.percentage}% of your ${b.category} budget. ${b.remaining} remaining.`,
          actionLink: '/app/budget',
        });
      }
    });

    // Alert: Zero income with expenses
    if (totalExpense > 0 && totalIncome === 0) {
      smartAlerts.push({
        id: 'zero-income-alert',
        type: 'warning',
        category: 'income',
        title: 'Zero Income Logged This Month',
        message: `You have logged ${totalExpense} in expenses with ₹0 in income. Make sure to record your salary or earnings.`,
        actionLink: '/app/transactions',
      });
    }

    // Alert: MoM Expense surge (>20%)
    if (expenseChangePct && expenseChangePct > 20 && prevExpense > 0) {
      smartAlerts.push({
        id: 'expense-surge-alert',
        type: 'warning',
        category: 'expense',
        title: 'Spending Surge Detected',
        message: `Your monthly expenses increased by ${expenseChangePct}% compared to last month (${totalExpense} vs ${prevExpense}).`,
        actionLink: '/app/reports',
      });
    }

    // Alert: Upcoming recurring transactions (next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);

    const upcomingRecurring = await RecurringTransaction.find({
      userId,
      active: true,
      nextDue: { $gte: new Date(), $lte: upcomingDate },
    });

    upcomingRecurring.forEach((r) => {
      smartAlerts.push({
        id: `recurring-due-${r._id}`,
        type: 'info',
        category: 'recurring',
        title: `Upcoming Payment: ${r.title}`,
        message: `${r.category} payment of ${r.amount} is due on ${new Date(r.nextDue).toISOString().slice(0, 10)}.`,
        actionLink: '/app/recurring',
      });
    });

    // Alert: Upcoming subscriptions (next 7 days)
    const upcomingSubs = await Subscription.find({
      userId,
      active: true,
      nextBillingDate: { $gte: new Date(), $lte: upcomingDate },
    });

    upcomingSubs.forEach((s) => {
      smartAlerts.push({
        id: `sub-due-${s._id}`,
        type: 'info',
        category: 'subscription',
        title: `Subscription Renewal: ${s.name}`,
        message: `${s.name} subscription renewal (${s.amount}) is scheduled for ${new Date(s.nextBillingDate).toISOString().slice(0, 10)}.`,
        actionLink: '/app/subscriptions',
      });
    });

    // 11. Recent 10 Transactions
    const recentTxDocs = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    const recentTransactions = recentTxDocs.map((t) => ({
      _id: t._id,
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description || '',
      date: t.date ? new Date(t.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      created_at: t.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        selectedMonth,
        summary: {
          totalIncome,
          totalExpense,
          netSavings,
          savingsRate,
          expenseRatio,
          totalInvestments,
          investmentsCount,
          totalBudget,
          budgetSpent,
          remainingBudget,
          budgetUtilization,
          totalSavingsGoals,
          financialHealth,
        },
        momComparison: {
          hasPrevData,
          prevMonthStr,
          prevIncome,
          prevExpense,
          prevSavings,
          incomeChangePct,
          expenseChangePct,
          savingsChangePct,
        },
        predictions: {
          predictedExpense,
          predictedSavings,
          method: predictionMethod,
          confidence: nonZeroExpenseMonths.length >= 3 ? 'High' : (nonZeroExpenseMonths.length >= 1 ? 'Moderate' : 'Low'),
          insightText: predictionInsight,
          riskCategories,
          isInsufficientData: !hasTransactions || totalExpense === 0,
        },
        smartAlerts,
        categoryBreakdown,
        budgetComparison,
        historicalTrend: pastMonthsData,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

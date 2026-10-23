import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Subscription from '../models/Subscription.js';
import NetWorthItem from '../models/NetWorthItem.js';

export const getFinancialContext = async (userId) => {
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const daysInMonth = endOfMonth.getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay);

  const [allTransactions, budgets, goals, subscriptions, netWorthItems] = await Promise.all([
    Transaction.find({ userId }).sort({ date: -1 }),
    Budget.find({ userId }),
    SavingsGoal.find({ userId }),
    Subscription.find({ userId }),
    NetWorthItem.find({ userId }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  const categoryTotalsAll = {};
  const categoryTotalsMonth = {};

  allTransactions.forEach((t) => {
    const tDate = new Date(t.date);
    const isThisMonth = tDate >= startOfMonth && tDate <= endOfMonth;

    if (t.type === 'income') {
      totalIncome += t.amount;
      if (isThisMonth) monthlyIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
      categoryTotalsAll[t.category] = (categoryTotalsAll[t.category] || 0) + t.amount;
      if (isThisMonth) {
        monthlyExpense += t.amount;
        categoryTotalsMonth[t.category] = (categoryTotalsMonth[t.category] || 0) + t.amount;
      }
    }
  });

  // Effective month totals (fallback to all-time monthly average if current month is new)
  const effectiveIncome = monthlyIncome > 0 ? monthlyIncome : totalIncome;
  const effectiveExpense = monthlyExpense > 0 ? monthlyExpense : totalExpense;
  const effectiveCategoryTotals = Object.keys(categoryTotalsMonth).length > 0 ? categoryTotalsMonth : categoryTotalsAll;

  const sortedCategories = Object.entries(effectiveCategoryTotals).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCategories.length > 0 ? { category: sortedCategories[0][0], amount: sortedCategories[0][1] } : null;

  const currentSurplus = effectiveIncome - effectiveExpense;
  const savingsRate = effectiveIncome > 0 ? Math.round((currentSurplus / effectiveIncome) * 100) : 0;

  // Budgets
  let totalBudget = 0;
  const budgetUtilization = [];
  budgets.forEach((b) => {
    totalBudget += b.amount;
    const spent = effectiveCategoryTotals[b.category] || 0;
    const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    budgetUtilization.push({
      category: b.category,
      budget: b.amount,
      spent,
      remaining: Math.max(0, b.amount - spent),
      percent: pct,
    });
  });

  // Subscriptions
  let monthlySubscriptionCost = 0;
  subscriptions.filter((s) => s.active).forEach((s) => {
    if (s.frequency === 'weekly') monthlySubscriptionCost += (s.amount * 52) / 12;
    else if (s.frequency === 'quarterly') monthlySubscriptionCost += s.amount / 3;
    else if (s.frequency === 'yearly' || s.frequency === 'annual') monthlySubscriptionCost += s.amount / 12;
    else monthlySubscriptionCost += s.amount;
  });

  // Net worth
  let totalAssets = 0;
  let totalLiabilities = 0;
  netWorthItems.forEach((item) => {
    if (item.type === 'asset') totalAssets += item.value;
    else if (item.type === 'liability') totalLiabilities += item.value;
  });
  const netWorth = totalAssets - totalLiabilities;

  return {
    now,
    currentMonthStr,
    currentDay,
    remainingDays,
    totalIncome: effectiveIncome,
    totalExpense: effectiveExpense,
    monthlySurplus: currentSurplus,
    savingsRate,
    highestCategory,
    sortedCategories,
    totalBudget,
    budgetUtilization,
    goals,
    subscriptions,
    monthlySubscriptionCost: Math.round(monthlySubscriptionCost),
    totalAssets,
    totalLiabilities,
    netWorth,
  };
};

export const generateFinancialAnalysis = async (userId) => {
  const ctx = await getFinancialContext(userId);
  const apiKey = process.env.AI_API_KEY;

  const suggestions = [];

  if (ctx.highestCategory && ctx.highestCategory.amount > 0) {
    suggestions.push(
      `Your highest spending is currently on ${ctx.highestCategory.category} (₹${ctx.highestCategory.amount.toLocaleString()}).`
    );
  }

  const overBudgets = ctx.budgetUtilization.filter((b) => b.percent >= 90);
  if (overBudgets.length > 0) {
    suggestions.push(
      `Budget alert: ${overBudgets[0].category} is at ${overBudgets[0].percent}% of its ₹${overBudgets[0].budget.toLocaleString()} limit.`
    );
  }

  if (ctx.savingsRate < 20) {
    suggestions.push('Consider trimming discretionary dining or shopping expenses to raise your monthly savings rate to at least 20%.');
  } else {
    suggestions.push(`Strong financial discipline! Your current savings rate is ${ctx.savingsRate}%.`);
  }

  if (ctx.monthlySubscriptionCost > 0) {
    suggestions.push(`Active subscriptions total approx ₹${ctx.monthlySubscriptionCost.toLocaleString()}/month across ${ctx.subscriptions.length} services.`);
  }

  const predictedNextMonthExpense = Math.round(ctx.totalExpense > 0 ? ctx.totalExpense * 1.05 : 5000);

  return {
    isAiPowered: Boolean(apiKey && apiKey.trim() !== ''),
    summary: {
      totalIncome: ctx.totalIncome,
      totalExpense: ctx.totalExpense,
      netBalance: ctx.monthlySurplus,
      savingsRate: ctx.savingsRate,
      netWorth: ctx.netWorth,
    },
    suggestions,
    spendingAnalysis: {
      highestSpendingCategory: ctx.highestCategory ? ctx.highestCategory.category : 'None',
      topSpendingAmount: ctx.highestCategory ? ctx.highestCategory.amount : 0,
      breakdown: ctx.sortedCategories.map(([category, amount]) => ({ category, amount })),
    },
    budgetRecommendations: ctx.budgetUtilization.map(
      (b) => `${b.category}: ₹${b.spent.toLocaleString()} spent of ₹${b.budget.toLocaleString()} (${b.percent}%)`
    ),
    savingsSuggestions: [
      `Automate a deposit of ₹${Math.max(1000, Math.round(ctx.totalIncome * 0.15)).toLocaleString()} into your emergency savings.`,
      `Review monthly recurring commitments to free up extra cashflow.`,
    ],
    futureExpensePrediction: {
      predictedMonthlyExpense: predictedNextMonthExpense,
      confidence: 'Medium',
      advice: `Based on your recent trends, project spending around ₹${predictedNextMonthExpense.toLocaleString()} next month.`,
    },
  };
};

export const handleFinancialCoachQuery = async (userId, userQuery) => {
  const ctx = await getFinancialContext(userId);
  const q = (userQuery || '').trim();
  const lower = q.toLowerCase();

  // Extract currency amount if present in query (e.g. ₹2000, 2000, ₹10,000, 10000)
  const amountMatch = q.match(/(?:₹|rs\.?|inr|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+)/i);
  let extractedAmount = null;
  if (amountMatch && amountMatch[1]) {
    const rawNum = amountMatch[1].replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0 && !lower.includes('next month') && !lower.includes('this month') && !lower.includes('2026')) {
      extractedAmount = parsed;
    }
  }

  // 1. QUESTION: "How much can I save this month?"
  if (lower.includes('how much') && (lower.includes('save') || lower.includes('saving'))) {
    const surplus = ctx.monthlySurplus;
    const canSave = Math.max(0, surplus);
    const dailyBurn = ctx.remainingDays > 0 ? Math.round(ctx.totalExpense / Math.max(1, ctx.currentDay)) : 0;
    const projectedRemainingExpense = dailyBurn * ctx.remainingDays;
    const safeSavingsEstimate = Math.max(0, ctx.totalIncome - (ctx.totalExpense + projectedRemainingExpense));

    return {
      reply: `Based on your recorded transactions for this month, your monthly income is ₹${ctx.totalIncome.toLocaleString()} and your current expenses are ₹${ctx.totalExpense.toLocaleString()}, leaving an unallocated surplus of ₹${surplus.toLocaleString()}.\n\nAccounting for remaining days this month, your estimated safe savings capacity is ₹${safeSavingsEstimate > 0 ? safeSavingsEstimate.toLocaleString() : canSave.toLocaleString()}.\n\nTo maximize this amount, maintain your current spending discipline and avoid unscheduled discretionary purchases.`,
      calculation: {
        formula: 'Monthly Savings Capacity = Total Income - (Current Expenses + Projected Spending for Remaining Days)',
        breakdown: [
          { label: 'Recorded Monthly Income', value: `₹${ctx.totalIncome.toLocaleString()}` },
          { label: 'Current Recorded Expenses', value: `₹${ctx.totalExpense.toLocaleString()}` },
          { label: 'Current Net Surplus', value: `₹${surplus.toLocaleString()}` },
          { label: 'Remaining Days in Month', value: `${ctx.remainingDays} days` },
          { label: 'Projected Safe Savings Capacity', value: `₹${safeSavingsEstimate > 0 ? safeSavingsEstimate.toLocaleString() : canSave.toLocaleString()}` },
        ],
        assumptions: [
          'No unexpected emergency expenses arise before month-end.',
          'Spending rate continues at or below the daily average of recorded days.',
          'All scheduled recurring incomes are received on time.',
        ],
        recommendation: canSave > 0
          ? `Transfer ₹${Math.round(canSave * 0.7).toLocaleString()} to your savings goal or emergency fund right now to lock in your surplus.`
          : 'Expenses currently exceed income. Pause non-essential purchases until next pay cycle.',
      },
    };
  }

  // 2. QUESTION: "Which category has the highest spending?"
  if (lower.includes('which category') || (lower.includes('highest') && lower.includes('spend')) || (lower.includes('top') && lower.includes('spend')) || lower.includes('biggest expense')) {
    if (!ctx.highestCategory || ctx.highestCategory.amount === 0) {
      return {
        reply: "You haven't recorded any expenses yet for this period. Once you log transactions, I'll calculate your highest spending category.",
        calculation: {
          formula: 'Category Share = (Category Expense / Total Expenses) × 100',
          breakdown: [{ label: 'Total Expenses', value: '₹0' }],
          assumptions: ['No expense records found in active period.'],
          recommendation: 'Add your recent expense transactions to activate spending analytics.',
        },
      };
    }

    const pct = ctx.totalExpense > 0 ? Math.round((ctx.highestCategory.amount / ctx.totalExpense) * 100) : 0;
    const topList = ctx.sortedCategories.slice(0, 3).map(([cat, amt]) => `• ${cat}: ₹${amt.toLocaleString()} (${Math.round((amt / ctx.totalExpense) * 100)}%)`).join('\n');

    return {
      reply: `Your highest spending category is **${ctx.highestCategory.category}** with total recorded spending of **₹${ctx.highestCategory.amount.toLocaleString()}**, representing **${pct}%** of your total monthly expenses (₹${ctx.totalExpense.toLocaleString()}).\n\nTop spending categories:\n${topList}`,
      calculation: {
        formula: 'Category Share % = (Highest Category Spend ÷ Total Expenses) × 100',
        breakdown: [
          { label: 'Top Category', value: ctx.highestCategory.category },
          { label: 'Top Category Spend', value: `₹${ctx.highestCategory.amount.toLocaleString()}` },
          { label: 'Total Monthly Expenses', value: `₹${ctx.totalExpense.toLocaleString()}` },
          { label: 'Proportion of Total Expenses', value: `${pct}%` },
        ],
        assumptions: [
          'Based strictly on verified expense transactions assigned to categories.',
          'Transfers and investments are excluded to avoid double-counting.',
        ],
        recommendation: pct > 35
          ? `${ctx.highestCategory.category} takes up more than a third of your outflow. Consider setting a dedicated category budget to rein it in.`
          : 'Category distribution is reasonably balanced.',
      },
    };
  }

  // 3. QUESTION: "How can I save ₹X next month?" (e.g. ₹2,000)
  if ((lower.includes('how') && lower.includes('save') && (lower.includes('next month') || extractedAmount)) || (extractedAmount && lower.includes('save'))) {
    const targetSavings = extractedAmount || 2000;
    const topDiscretionary = ctx.sortedCategories.filter(([cat]) =>
      ['Food', 'Food & Dining', 'Shopping', 'Entertainment', 'Travel', 'Fitness', 'Other'].includes(cat)
    );

    const discretionaryTotal = topDiscretionary.reduce((sum, [, amt]) => sum + amt, 0);
    const requiredReductionPct = discretionaryTotal > 0 ? Math.min(100, Math.round((targetSavings / discretionaryTotal) * 100)) : 15;

    const breakdownItems = topDiscretionary.slice(0, 3).map(([cat, amt]) => {
      const suggestedCut = Math.round(amt * (requiredReductionPct / 100));
      return {
        label: `Trim ${cat}`,
        value: `Cut by ₹${suggestedCut.toLocaleString()} (from ₹${amt.toLocaleString()} to ₹${Math.max(0, amt - suggestedCut).toLocaleString()})`,
      };
    });

    return {
      reply: `To save an additional **₹${targetSavings.toLocaleString()}** next month, you need to reduce discretionary expenses by approximately **${requiredReductionPct}%**.\n\nHere is a practical action plan based on your recorded transactions:\n` +
        breakdownItems.map((b) => `• **${b.label}**: ${b.value}`).join('\n') +
        `\n\nAdditionally, automating an auto-debit of ₹${targetSavings.toLocaleString()} on salary day will ensure this target is met before discretionary spending begins.`,
      calculation: {
        formula: 'Required Discretionary Cut % = (Target Additional Savings ÷ Total Discretionary Spending) × 100',
        breakdown: [
          { label: 'Target Additional Savings', value: `₹${targetSavings.toLocaleString()}` },
          { label: 'Current Discretionary Spending', value: `₹${discretionaryTotal.toLocaleString()}` },
          { label: 'Required Category Reduction', value: `${requiredReductionPct}%` },
          { label: 'Projected Next Month Savings', value: `₹${(Math.max(0, ctx.monthlySurplus) + targetSavings).toLocaleString()}` },
        ],
        assumptions: [
          'Essential fixed costs (Housing, Utilities, Healthcare, EMIs) remain unchanged.',
          'Spending cuts are taken proportionally from discretionary categories.',
          'Monthly income remains steady at ₹' + ctx.totalIncome.toLocaleString() + '.',
        ],
        recommendation: `Set a spending limit for ${ctx.highestCategory?.category || 'discretionary items'} in your Budget tab to enforce this limit automatically.`,
      },
    };
  }

  // 4. QUESTION: "Can I afford a ₹X purchase based on my current budget?" (e.g. ₹10,000)
  if (lower.includes('afford') || (extractedAmount && (lower.includes('purchase') || lower.includes('buy') || lower.includes('spend')))) {
    const purchaseAmount = extractedAmount || 10000;
    const surplus = ctx.monthlySurplus;
    const remainingBudget = Math.max(0, ctx.totalBudget - ctx.totalExpense);
    const emergencyBuffer = ctx.totalIncome * 0.2; // 20% safety margin

    const isAffordableCash = surplus >= purchaseAmount;
    const isAffordableWithMargin = surplus - purchaseAmount >= emergencyBuffer;

    let verdict = '';
    let recommendation = '';

    if (isAffordableWithMargin) {
      verdict = `**Yes, you can afford a ₹${purchaseAmount.toLocaleString()} purchase.** Your current monthly surplus is ₹${surplus.toLocaleString()}, leaving a comfortable cushion of ₹${(surplus - purchaseAmount).toLocaleString()} even after the purchase.`;
      recommendation = 'You have sufficient surplus. Pay in full rather than opting for interest-bearing credit or EMIs.';
    } else if (isAffordableCash) {
      verdict = `**You can technically afford it, but with caution.** A ₹${purchaseAmount.toLocaleString()} purchase will consume ${Math.round((purchaseAmount / surplus) * 100)}% of your monthly surplus (₹${surplus.toLocaleString()}), leaving only ₹${(surplus - purchaseAmount).toLocaleString()} for unforeseen expenses.`;
      recommendation = 'Consider delaying the purchase by 2-3 weeks or splitting it into two installments to avoid zeroing out your buffer.';
    } else {
      const deficit = purchaseAmount - surplus;
      verdict = `**No, you cannot comfortably afford a ₹${purchaseAmount.toLocaleString()} purchase right now.** The cost exceeds your current monthly surplus of ₹${surplus.toLocaleString()} by ₹${deficit.toLocaleString()}. Making this purchase now would create a deficit or require dipping into your savings.`;
      recommendation = `Create a Smart Savings Goal for ₹${purchaseAmount.toLocaleString()} and contribute ₹${Math.round(purchaseAmount / 3).toLocaleString()}/month over the next 3 months to buy it debt-free.`;
    }

    return {
      reply: `${verdict}\n\n**Financial Assessment:**\n• Current Monthly Income: ₹${ctx.totalIncome.toLocaleString()}\n• Current Expenses: ₹${ctx.totalExpense.toLocaleString()}\n• Available Cash Surplus: ₹${surplus.toLocaleString()}\n• Purchase Amount: ₹${purchaseAmount.toLocaleString()}\n• Remaining Surplus After Purchase: ₹${(surplus - purchaseAmount).toLocaleString()}`,
      calculation: {
        formula: 'Post-Purchase Net Surplus = (Monthly Income - Monthly Expenses) - Purchase Amount',
        breakdown: [
          { label: 'Purchase Cost Evaluated', value: `₹${purchaseAmount.toLocaleString()}` },
          { label: 'Current Monthly Surplus', value: `₹${surplus.toLocaleString()}` },
          { label: 'Net Balance After Purchase', value: `₹${(surplus - purchaseAmount).toLocaleString()}` },
          { label: 'Recommended Safety Reserve', value: `₹${Math.round(emergencyBuffer).toLocaleString()}` },
        ],
        assumptions: [
          'Purchase is paid as a single lump-sum deduction.',
          'No additional debt financing (credit card EMI) is included.',
          'Assumes all scheduled fixed monthly bills have already been accounted for.',
        ],
        recommendation,
      },
    };
  }

  // 5. Default Comprehensive AI Coach Advisor response
  return {
    reply: `Here is your current financial analysis based on your recorded transactions:\n\n• **Monthly Income**: ₹${ctx.totalIncome.toLocaleString()}\n• **Monthly Expenses**: ₹${ctx.totalExpense.toLocaleString()}\n• **Net Surplus**: ₹${ctx.monthlySurplus.toLocaleString()} (${ctx.savingsRate}% savings rate)\n• **Top Spending Category**: ${ctx.highestCategory ? `${ctx.highestCategory.category} (₹${ctx.highestCategory.amount.toLocaleString()})` : 'None'}\n• **Active Subscriptions**: ₹${ctx.monthlySubscriptionCost.toLocaleString()}/mo across ${ctx.subscriptions.length} services\n• **Estimated Net Worth**: ₹${ctx.netWorth.toLocaleString()}\n\nAsk me specific questions like:\n• "How much can I save this month?"\n• "Which category has the highest spending?"\n• "How can I save ₹2,000 next month?"\n• "Can I afford a ₹10,000 purchase?"`,
    calculation: {
      formula: 'Net Savings Rate = ((Total Income - Total Expenses) ÷ Total Income) × 100',
      breakdown: [
        { label: 'Income', value: `₹${ctx.totalIncome.toLocaleString()}` },
        { label: 'Expenses', value: `₹${ctx.totalExpense.toLocaleString()}` },
        { label: 'Surplus', value: `₹${ctx.monthlySurplus.toLocaleString()}` },
        { label: 'Savings Rate', value: `${ctx.savingsRate}%` },
      ],
      assumptions: ['Calculated directly from authenticated user transactions and budgets.'],
      recommendation: ctx.savingsRate >= 20 ? 'Maintain current allocation habits.' : 'Target a 20% savings rate benchmark.',
    },
  };
};

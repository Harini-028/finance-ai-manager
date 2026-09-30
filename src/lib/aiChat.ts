import type { Transaction, Budget, Profile } from './supabase';
import { computeSummary, spendingByCategory, monthlyComparison, aiScoreLabel } from './analytics';
import { formatCurrency, currentMonthKey, formatDate } from './format';

const LOWER = (s: string) => s.toLowerCase();

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

type Intent =
  | 'summary'
  | 'spending'
  | 'savings'
  | 'budget'
  | 'top_category'
  | 'compare'
  | 'score'
  | 'advice'
  | 'transactions'
  | 'income'
  | 'greeting'
  | 'help'
  | 'unknown';

const detectIntent = (query: string): Intent => {
  const q = LOWER(query);
  if (has(q, 'hello', 'hi ', 'hey', 'greetings') && q.length < 20) return 'greeting';
  if (has(q, 'help', 'what can you do', 'features')) return 'help';
  if (has(q, 'score', 'ai score', 'financial score', 'how am i doing')) return 'score';
  if (has(q, 'summary', 'overview', 'how much', 'summary of', 'recap')) return 'summary';
  if (has(q, 'spending', 'spent', 'expenses', 'expense')) return 'spending';
  if (has(q, 'saving', 'savings', 'save')) return 'savings';
  if (has(q, 'budget', 'limit')) return 'budget';
  if (has(q, 'top', 'biggest', 'most', 'largest', 'category')) return 'top_category';
  if (has(q, 'compare', 'last month', 'previous', 'trend', 'vs', 'versus')) return 'compare';
  if (has(q, 'advice', 'tip', 'recommend', 'suggest', 'should i', 'how to', 'improve')) return 'advice';
  if (has(q, 'transaction', 'recent', 'latest', 'history')) return 'transactions';
  if (has(q, 'income', 'earn', 'salary', 'revenue')) return 'income';
  return 'unknown';
};

export type ChatContext = {
  transactions: Transaction[];
  budgets: Budget[];
  profile: Profile | null;
};

export const generateChatReply = (query: string, ctx: ChatContext): string => {
  const intent = detectIntent(query);
  const monthKey = currentMonthKey();
  const currency = ctx.profile?.currency ?? 'USD';
  const summary = computeSummary(ctx.transactions, ctx.budgets, monthKey);
  const catSpending = spendingByCategory(ctx.transactions, monthKey);
  const comparison = monthlyComparison(ctx.transactions, 3);
  const c = (n: number) => formatCurrency(n, currency);

  switch (intent) {
    case 'greeting':
      return `Hi there! I'm your FinPilot AI assistant. I can analyze your transactions, budgets, and spending patterns to give you personalized financial guidance. Try asking me "How are my savings?" or "What's my top spending category?"`;

    case 'help':
      return `I can help you with:\n\n• Financial summaries — "Give me an overview"\n• Spending analysis — "How much did I spend?"\n• Savings insights — "How are my savings?"\n• Budget tracking — "Am I over budget?"\n• Category breakdown — "What's my biggest expense?"\n• Month-over-month comparison — "Compare this month to last"\n• AI score — "What's my financial score?"\n• Personalized advice — "How can I improve my finances?"\n\nWhat would you like to know?`;

    case 'score': {
      const s = aiScoreLabel(summary.aiScore);
      return `Your AI Financial Score is ${summary.aiScore}/100 — rated "${s.label}". This is based on your savings rate (${summary.savingsRate}%), budget utilization (${summary.budgetUtilization}%), and income consistency. ${
        summary.aiScore >= 65
          ? `You're in a healthy position. Keep maintaining your current habits.`
          : `Focus on increasing your savings rate and keeping spending within budget to push this higher.`
      }`;
    }

    case 'summary':
      return `Here's your financial snapshot for this month:\n\n• Income: ${c(summary.totalIncome)}\n• Expenses: ${c(summary.totalExpense)}\n• Net savings: ${c(summary.savings)}\n• Savings rate: ${summary.savingsRate}%\n• Budget used: ${summary.budgetUtilization}%\n• AI Score: ${summary.aiScore}/100\n\n${
        summary.savings > 0
          ? `You're net positive this month — great work staying in the green.`
          : `You're spending more than you earn this month. Let's look at where the money is going.`
      }`;

    case 'spending':
      return `You've spent ${c(summary.totalExpense)} this month across ${catSpending.length} categories.${
        catSpending.length > 0
          ? ` Your top spending areas are:\n\n${catSpending
              .slice(0, 3)
              .map((c2, i) => `  ${i + 1}. ${c2.category}: ${c(c2.amount)} (${c2.count} transactions)`)
              .join('\n')}\n\n${catSpending[0] ? `Your largest expense is ${c(catSpending[0].amount)} on ${catSpending[0].category}.` : ''}`
          : ' No expense transactions recorded yet this month. Add some to get detailed insights.'
      }`;

    case 'savings':
      return `Your savings this month: ${c(summary.savings)} (${summary.savingsRate}% of income).${
        summary.savingsRate >= 20
          ? ` That's above the 20% benchmark — excellent financial discipline.`
          : summary.savingsRate > 0
            ? ` The general recommendation is to save at least 20% of your income. Consider trimming discretionary spending to reach that target.`
            : ` You're currently spending more than you earn. Prioritize reducing non-essential expenses immediately.`
      }`;

    case 'budget': {
      if (summary.monthlyBudgetTotal === 0) {
        return "You haven't set up a monthly budget yet. Head to the Budget page to set spending limits per category — this unlocks real-time tracking and alerts when you're approaching your limits.";
      }
      return `Your monthly budget is ${c(summary.monthlyBudgetTotal)}. So far you've used ${c(summary.budgetUsed)} (${summary.budgetUtilization}%), leaving ${c(summary.budgetRemaining)} remaining.${
        summary.budgetUtilization > 90
          ? ` You're close to your limit — be cautious with discretionary purchases for the rest of the month.`
          : summary.budgetUtilization <= 80
            ? ` You're well within budget. Nice pacing!`
            : ` You're on track but should monitor spending for the rest of the month.`
      }`;
    }

    case 'top_category': {
      if (catSpending.length === 0) return "You haven't logged any expenses this month yet. Once you add transactions, I can tell you your top spending categories.";
      const top = catSpending[0];
      const pct = summary.totalExpense > 0 ? Math.round((top.amount / summary.totalExpense) * 100) : 0;
      return `Your biggest spending category this month is ${top.category} at ${c(top.amount)} — that's ${pct}% of your total expenses, across ${top.count} transactions. ${
        pct > 40 ? 'This category dominates your spending; finding ways to reduce it could significantly impact your savings.' : ''
      }`;
    }

    case 'compare': {
      if (comparison.length < 2) return 'I need at least two months of data to make a comparison. Keep logging transactions and ask me again later.';
      const current = comparison[comparison.length - 1];
      const prev = comparison[comparison.length - 2];
      const expenseChange = prev.expense > 0 ? Math.round(((current.expense - prev.expense) / prev.expense) * 100) : 0;
      const incomeChange = prev.income > 0 ? Math.round(((current.income - prev.income) / prev.income) * 100) : 0;
      return `Comparing this month to last month:\n\n• Income: ${c(current.income)} vs ${c(prev.income)} (${incomeChange >= 0 ? '+' : ''}${incomeChange}%)\n• Expenses: ${c(current.expense)} vs ${c(prev.expense)} (${expenseChange >= 0 ? '+' : ''}${expenseChange}%)\n• Savings: ${c(current.savings)} vs ${c(prev.savings)}\n\n${
        expenseChange > 15
          ? 'Your spending is up notably — worth investigating which categories drove the increase.'
          : expenseChange < -10
            ? 'You cut spending this month — great work tightening things up.'
            : 'Your spending is fairly stable month over month.'
      }`;
    }

    case 'advice': {
      const tips: string[] = [];
      if (summary.savingsRate < 20) tips.push('Increase your savings rate toward 20% by automating a transfer to savings right after payday.');
      if (summary.monthlyBudgetTotal === 0) tips.push('Set up category budgets so you get real-time alerts before overspending.');
      if (catSpending[0] && summary.totalExpense > 0 && catSpending[0].amount / summary.totalExpense > 0.35) {
        tips.push(`Your ${catSpending[0].category} spending is over a third of your expenses — target it for cuts first.`);
      }
      if (summary.savings > 0) tips.push(`Consider investing part of your ${c(summary.savings)} surplus instead of letting it sit idle.`);
      if (tips.length === 0) tips.push(`You're in great shape — keep automating savings and reviewing budgets monthly.`);
      return `Here are personalized recommendations based on your finances:\n\n${tips.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}`;
    }

    case 'transactions': {
      const recent = [...ctx.transactions]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5);
      if (recent.length === 0) return "You don't have any transactions logged yet. Add your first one from the Transactions page.";
      return `Your 5 most recent transactions:\n\n${recent
        .map((t) => `  • ${formatDate(t.date)} — ${t.type === 'income' ? '+' : '-'}${c(t.amount)} · ${t.category}${t.description ? ` (${t.description})` : ''}`)
        .join('\n')}`;
    }

    case 'income':
      return `You've earned ${c(summary.totalIncome)} this month.${
        ctx.profile && ctx.profile.monthly_income > 0
          ? ` Your recorded monthly income target is ${c(ctx.profile.monthly_income)}. ${
              summary.totalIncome >= ctx.profile.monthly_income
                ? "You've met or exceeded your expected income this month."
                : `You're at ${Math.round((summary.totalIncome / ctx.profile.monthly_income) * 100)}% of your expected monthly income.`
            }`
          : ''
      }`;

    case 'unknown':
      return `I'm not quite sure what you're asking, but I can help with spending, savings, budgets, category breakdowns, month-over-month comparisons, your AI score, and personalized advice. Try "How much have I spent this month?" or "Give me tips to improve my finances."`;
  }
};

export const suggestedPrompts = [
  'Give me a financial summary',
  "How are my savings this month?",
  "What's my top spending category?",
  'Am I over budget?',
  'Compare this month to last',
  "What's my AI score?",
  'Give me advice to improve',
  'Show my recent transactions',
];

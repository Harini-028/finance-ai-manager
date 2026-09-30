import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';

// @desc    Get dashboard analytics & summary
// @route   GET /api/dashboard
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Current month dates
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = new Date(`${currentMonthStr}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    // MongoDB Aggregations
    // 1. Overall Income vs Expense
    const totalsAgg = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    totalsAgg.forEach((item) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    const balance = totalIncome - totalExpense;

    // 2. Current Month Income vs Expense
    const monthlyAgg = await Transaction.aggregate([
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
        },
      },
    ]);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    monthlyAgg.forEach((item) => {
      if (item._id === 'income') monthlyIncome = item.total;
      if (item._id === 'expense') monthlyExpense = item.total;
    });

    // 3. Savings goals summary
    const goals = await SavingsGoal.find({ userId });
    const totalSavings = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const savingsGoalsFormatted = goals.map((g) => {
      const target = g.targetAmount || 0;
      const current = g.currentAmount || 0;
      return {
        _id: g._id,
        id: g._id.toString(),
        goalName: g.goalName,
        name: g.goalName,
        targetAmount: target,
        target_amount: target,
        currentAmount: current,
        current_amount: current,
        remainingAmount: Math.max(0, target - current),
        progressPercentage: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
        deadline: g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : null,
      };
    });

    // 4. Budgets and remaining budget for current month
    const budgets = await Budget.find({ userId, month: currentMonthStr });
    const totalBudgetAmount = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const remainingBudget = Math.max(0, totalBudgetAmount - monthlyExpense);

    // 5. Top spending categories for current month using aggregation
    const topCategoriesAgg = await Transaction.aggregate([
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
      { $limit: 5 },
    ]);

    const topCategories = topCategoriesAgg.map((item) => ({
      category: item._id,
      totalAmount: item.totalAmount,
      count: item.count,
    }));

    // 6. Recent 6 transactions
    const recentTransactionsDocs = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(6);

    const recentTransactions = recentTransactionsDocs.map((t) => ({
      _id: t._id,
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date ? new Date(t.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      created_at: t.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        totalSavings,
        monthlyIncome,
        monthlyExpense,
        totalBudgetAmount,
        remainingBudget,
        topCategories,
        recentTransactions,
        savingsGoals: savingsGoalsFormatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';

// Helper function to map MongoDB document
const formatBudget = (doc, calculatedSpent = null) => ({
  _id: doc._id,
  id: doc._id.toString(),
  userId: doc.userId,
  user_id: doc.userId.toString(),
  category: doc.category,
  amount: doc.amount,
  spent: calculatedSpent !== null ? calculatedSpent : (doc.spent || 0),
  period: doc.period || 'monthly',
  month: doc.month,
  year: doc.year || (doc.month ? parseInt(doc.month.split('-')[0]) : new Date().getFullYear()),
  createdAt: doc.createdAt,
  created_at: doc.createdAt,
});

// @desc    Create budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, period } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Category and amount are required' });
    }

    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const year = parseInt(currentMonth.split('-')[0]);

    // Check if budget for this category & month already exists
    let budget = await Budget.findOne({
      userId: req.user._id,
      category,
      month: currentMonth,
    });

    if (budget) {
      budget.amount = Number(amount);
      if (period) budget.period = period;
      await budget.save();
    } else {
      budget = await Budget.create({
        userId: req.user._id,
        category,
        amount: Number(amount),
        month: currentMonth,
        year,
        period: period || 'monthly',
      });
    }

    // Calculate actual spent for this category/month
    const startOfMonth = new Date(`${currentMonth}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const expenseAgg = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          category: budget.category,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const actualSpent = expenseAgg.length > 0 ? expenseAgg[0].totalSpent : 0;
    budget.spent = actualSpent;
    await budget.save();

    return res.status(201).json({
      success: true,
      data: formatBudget(budget, actualSpent),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user budgets with calculated spent amounts
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const budgets = await Budget.find({
      userId: req.user._id,
      month,
    });

    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    // Calculate actual spending per category in current month using MongoDB aggregation
    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spentMap = {};
    expensesByCategory.forEach((item) => {
      spentMap[item._id] = item.totalSpent;
    });

    const formattedBudgets = budgets.map((b) => {
      const calculatedSpent = spentMap[b.category] || 0;
      return formatBudget(b, calculatedSpent);
    });

    return res.json({
      success: true,
      count: formattedBudgets.length,
      data: formattedBudgets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res, next) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found or unauthorized' });
    }

    const { amount, category, period, month } = req.body;

    if (amount !== undefined) budget.amount = Number(amount);
    if (category) budget.category = category;
    if (period) budget.period = period;
    if (month) {
      budget.month = month;
      budget.year = parseInt(month.split('-')[0]);
    }

    await budget.save();

    // Recalculate spent
    const startOfMonth = new Date(`${budget.month}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const expenseAgg = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          category: budget.category,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const actualSpent = expenseAgg.length > 0 ? expenseAgg[0].totalSpent : 0;
    budget.spent = actualSpent;
    await budget.save();

    return res.json({
      success: true,
      data: formatBudget(budget, actualSpent),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Budget deleted successfully',
      data: formatBudget(budget),
    });
  } catch (error) {
    next(error);
  }
};

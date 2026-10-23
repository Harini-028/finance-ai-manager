import SavingsGoal from '../models/SavingsGoal.js';
import Transaction from '../models/Transaction.js';

// Helper function to format and enrich savings goal with calculations
const formatSavingsGoal = (doc, userMonthlySurplus = null) => {
  const target = Number(doc.targetAmount) || 0;
  const current = Number(doc.currentAmount) || 0;
  const remaining = Math.max(0, target - current);
  const progressPercentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const monthlyContrib = Number(doc.monthlyContribution) || 0;

  let monthsRemaining = null;
  let requiredMonthlyContribution = 0;
  let isUnrealistic = false;
  let unrealisticReason = '';

  const now = new Date();

  if (doc.deadline) {
    const deadlineDate = new Date(doc.deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    monthsRemaining = Math.max(0.1, diffDays / 30.44);

    if (diffDays <= 0 && remaining > 0) {
      isUnrealistic = true;
      unrealisticReason = 'Target deadline has already passed but goal is incomplete.';
      requiredMonthlyContribution = remaining;
    } else if (remaining > 0) {
      requiredMonthlyContribution = Math.round(remaining / monthsRemaining);
      if (userMonthlySurplus !== null && userMonthlySurplus > 0 && requiredMonthlyContribution > userMonthlySurplus * 1.5) {
        isUnrealistic = true;
        unrealisticReason = `Requires ₹${requiredMonthlyContribution.toLocaleString()}/mo, which significantly exceeds your recorded monthly surplus (₹${Math.round(userMonthlySurplus).toLocaleString()}).`;
      }
    }
  }

  // Estimated completion date based on user's monthly contribution or recent rate
  let estimatedCompletionDate = null;
  const rate = monthlyContrib > 0 ? monthlyContrib : (requiredMonthlyContribution > 0 ? requiredMonthlyContribution : 0);
  if (rate > 0 && remaining > 0) {
    const monthsNeeded = Math.ceil(remaining / rate);
    const completion = new Date();
    completion.setMonth(completion.getMonth() + monthsNeeded);
    estimatedCompletionDate = completion.toISOString().slice(0, 10);
  } else if (remaining === 0) {
    estimatedCompletionDate = doc.updatedAt ? new Date(doc.updatedAt).toISOString().slice(0, 10) : now.toISOString().slice(0, 10);
  }

  return {
    _id: doc._id,
    id: doc._id.toString(),
    userId: doc.userId,
    user_id: doc.userId.toString(),
    goalName: doc.goalName,
    name: doc.goalName, // compatibility
    targetAmount: target,
    target_amount: target, // compatibility
    currentAmount: current,
    current_amount: current, // compatibility
    monthlyContribution: monthlyContrib,
    monthly_contribution: monthlyContrib,
    category: doc.category || 'General',
    status: doc.status || (remaining === 0 ? 'completed' : 'active'),
    remainingAmount: remaining,
    progressPercentage,
    deadline: doc.deadline ? new Date(doc.deadline).toISOString().slice(0, 10) : null,
    target_date: doc.deadline ? new Date(doc.deadline).toISOString().slice(0, 10) : null,
    monthsRemaining: monthsRemaining ? Math.round(monthsRemaining * 10) / 10 : null,
    requiredMonthlyContribution,
    estimatedCompletionDate,
    isUnrealistic,
    unrealisticReason,
    history: doc.history || [],
    description: doc.description || '',
    createdAt: doc.createdAt,
    created_at: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// @desc    Get all savings goals for user
// @route   GET /api/savings
// @access  Private
export const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Fetch user surplus for realistic target checks
    const recentTx = await Transaction.find({ userId: req.user._id });
    let income = 0;
    let expense = 0;
    recentTx.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });
    const surplus = income - expense;

    return res.json({
      success: true,
      count: goals.length,
      data: goals.map((g) => formatSavingsGoal(g, surplus)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create savings goal
// @route   POST /api/savings
// @access  Private
export const createSavingsGoal = async (req, res, next) => {
  try {
    const {
      goalName,
      name,
      targetAmount,
      target_amount,
      currentAmount,
      current_amount,
      monthlyContribution,
      monthly_contribution,
      category,
      deadline,
      target_date,
      description,
    } = req.body;

    const gName = goalName || name;
    const tAmount = targetAmount !== undefined ? targetAmount : target_amount;
    const cAmount = currentAmount !== undefined ? currentAmount : (current_amount || 0);
    const mContrib = monthlyContribution !== undefined ? monthlyContribution : (monthly_contribution || 0);
    const dLine = deadline || target_date;

    if (!gName || tAmount === undefined || Number(tAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid goal name and positive target amount are required' });
    }

    const initialHistory = [];
    if (Number(cAmount) > 0) {
      initialHistory.push({
        type: 'deposit',
        amount: Number(cAmount),
        date: new Date(),
        note: 'Initial deposit',
      });
    }

    const goal = await SavingsGoal.create({
      userId: req.user._id,
      goalName: gName.trim(),
      targetAmount: Number(tAmount),
      currentAmount: Number(cAmount),
      monthlyContribution: Number(mContrib),
      category: category || 'General',
      status: Number(cAmount) >= Number(tAmount) ? 'completed' : 'active',
      deadline: dLine ? new Date(dLine) : null,
      history: initialHistory,
      description: description || '',
    });

    return res.status(201).json({
      success: true,
      data: formatSavingsGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update savings goal
// @route   PUT /api/savings/:id
// @access  Private
export const updateSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found or unauthorized' });
    }

    const {
      goalName,
      name,
      targetAmount,
      target_amount,
      currentAmount,
      current_amount,
      monthlyContribution,
      monthly_contribution,
      category,
      status,
      deadline,
      target_date,
      description,
    } = req.body;

    if (goalName || name) goal.goalName = (goalName || name).trim();
    if (targetAmount !== undefined || target_amount !== undefined) {
      goal.targetAmount = Number(targetAmount !== undefined ? targetAmount : target_amount);
    }
    if (currentAmount !== undefined || current_amount !== undefined) {
      goal.currentAmount = Number(currentAmount !== undefined ? currentAmount : current_amount);
    }
    if (monthlyContribution !== undefined || monthly_contribution !== undefined) {
      goal.monthlyContribution = Number(monthlyContribution !== undefined ? monthlyContribution : monthly_contribution);
    }
    if (category !== undefined) goal.category = category;
    if (status !== undefined) goal.status = status;
    if (deadline !== undefined || target_date !== undefined) {
      const d = deadline !== undefined ? deadline : target_date;
      goal.deadline = d ? new Date(d) : null;
    }
    if (description !== undefined) goal.description = description;

    // Check if auto-complete status
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
    }

    await goal.save();

    return res.json({
      success: true,
      data: formatSavingsGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record deposit or withdrawal to a savings goal
// @route   POST /api/savings/:id/transaction
// @access  Private
export const recordGoalTransaction = async (req, res, next) => {
  try {
    const { type, amount, note } = req.body;
    const numAmount = Number(amount);

    if (!type || !['deposit', 'withdrawal'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be either 'deposit' or 'withdrawal'" });
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid positive amount' });
    }

    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found or unauthorized' });
    }

    if (type === 'withdrawal' && numAmount > goal.currentAmount) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw ₹${numAmount.toLocaleString()}. Current balance is ₹${goal.currentAmount.toLocaleString()}.`,
      });
    }

    if (type === 'deposit') {
      goal.currentAmount += numAmount;
      if (goal.currentAmount >= goal.targetAmount) {
        goal.status = 'completed';
      }
    } else if (type === 'withdrawal') {
      goal.currentAmount -= numAmount;
      if (goal.status === 'completed' && goal.currentAmount < goal.targetAmount) {
        goal.status = 'active';
      }
    }

    goal.history.push({
      type,
      amount: numAmount,
      date: new Date(),
      note: note || (type === 'deposit' ? 'Savings contribution' : 'Savings withdrawal'),
    });

    await goal.save();

    return res.json({
      success: true,
      message: `${type === 'deposit' ? 'Contributed' : 'Withdrew'} ₹${numAmount.toLocaleString()} successfully`,
      data: formatSavingsGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add money to savings goal (backward compatibility)
// @route   PATCH /api/savings/:id/add
// @access  Private
export const addSavingsAmount = async (req, res, next) => {
  req.body.type = 'deposit';
  return recordGoalTransaction(req, res, next);
};

// @desc    Change goal status (pause, resume, complete)
// @route   PATCH /api/savings/:id/status
// @access  Private
export const toggleGoalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active', 'paused', or 'completed'" });
    }

    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found or unauthorized' });
    }

    goal.status = status;
    await goal.save();

    return res.json({
      success: true,
      message: `Goal status updated to ${status}`,
      data: formatSavingsGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings/:id
// @access  Private
export const deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Savings goal deleted successfully',
      data: formatSavingsGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

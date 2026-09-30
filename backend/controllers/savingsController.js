import SavingsGoal from '../models/SavingsGoal.js';

// Helper function to map MongoDB document
const formatSavingsGoal = (doc) => {
  const target = doc.targetAmount || 0;
  const current = doc.currentAmount || 0;
  const remaining = Math.max(0, target - current);
  const progressPercentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return {
    _id: doc._id,
    id: doc._id.toString(),
    userId: doc.userId,
    user_id: doc.userId.toString(),
    goalName: doc.goalName,
    name: doc.goalName, // compatibility with existing frontend
    targetAmount: target,
    target_amount: target, // compatibility with existing frontend
    currentAmount: current,
    current_amount: current, // compatibility with existing frontend
    remainingAmount: remaining,
    progressPercentage,
    deadline: doc.deadline ? new Date(doc.deadline).toISOString().slice(0, 10) : null,
    target_date: doc.deadline ? new Date(doc.deadline).toISOString().slice(0, 10) : null,
    description: doc.description || '',
    createdAt: doc.createdAt,
    created_at: doc.createdAt,
  };
};

// @desc    Create savings goal
// @route   POST /api/savings
// @access  Private
export const createSavingsGoal = async (req, res, next) => {
  try {
    const { goalName, name, targetAmount, target_amount, currentAmount, current_amount, deadline, target_date, description } = req.body;

    const gName = goalName || name;
    const tAmount = targetAmount !== undefined ? targetAmount : target_amount;
    const cAmount = currentAmount !== undefined ? currentAmount : (current_amount || 0);
    const dLine = deadline || target_date;

    if (!gName || tAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Goal name and target amount are required' });
    }

    const goal = await SavingsGoal.create({
      userId: req.user._id,
      goalName: gName,
      targetAmount: Number(tAmount),
      currentAmount: Number(cAmount),
      deadline: dLine ? new Date(dLine) : null,
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

// @desc    Get all savings goals for user
// @route   GET /api/savings
// @access  Private
export const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: goals.length,
      data: goals.map(formatSavingsGoal),
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
    let goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found or unauthorized' });
    }

    const { goalName, name, targetAmount, target_amount, currentAmount, current_amount, deadline, target_date, description } = req.body;

    if (goalName || name) goal.goalName = goalName || name;
    if (targetAmount !== undefined || target_amount !== undefined) {
      goal.targetAmount = Number(targetAmount !== undefined ? targetAmount : target_amount);
    }
    if (currentAmount !== undefined || current_amount !== undefined) {
      goal.currentAmount = Number(currentAmount !== undefined ? currentAmount : current_amount);
    }
    if (deadline !== undefined || target_date !== undefined) {
      const d = deadline !== undefined ? deadline : target_date;
      goal.deadline = d ? new Date(d) : null;
    }
    if (description !== undefined) goal.description = description;

    await goal.save();

    return res.json({
      success: true,
      data: formatSavingsGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add money to savings goal
// @route   PATCH /api/savings/:id/add
// @access  Private
export const addSavingsAmount = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a positive amount to add' });
    }

    let goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found or unauthorized' });
    }

    goal.currentAmount = (goal.currentAmount || 0) + Number(amount);
    await goal.save();

    return res.json({
      success: true,
      message: `Added $${amount} to ${goal.goalName}`,
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
      message: 'Savings goal deleted',
      data: formatSavingsGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

import FinancialScenario from '../models/FinancialScenario.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

// Calculate simulation numbers without altering database records
export const computeSimulationMetrics = async (userId, adjustments = {}) => {
  const {
    incomeChangePercent = 0,
    incomeChangeAbsolute = 0,
    categoryAdjustments = [], // [{ category: 'Food', percentChange: -10 }, ...]
    savingsContributionChange = 0,
    customBudgetCap = 0,
  } = adjustments;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await Transaction.find({ userId });

  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let allIncome = 0;
  let allExpense = 0;
  const currentCategoryExpenses = {};
  const allCategoryExpenses = {};

  transactions.forEach((t) => {
    const tDate = new Date(t.date);
    const isThisMonth = tDate >= startOfMonth && tDate <= endOfMonth;

    if (t.type === 'income') {
      allIncome += t.amount;
      if (isThisMonth) monthlyIncome += t.amount;
    } else if (t.type === 'expense') {
      allExpense += t.amount;
      allCategoryExpenses[t.category] = (allCategoryExpenses[t.category] || 0) + t.amount;
      if (isThisMonth) {
        monthlyExpense += t.amount;
        currentCategoryExpenses[t.category] = (currentCategoryExpenses[t.category] || 0) + t.amount;
      }
    }
  });

  // Fallback to average/all-time if user has not yet recorded transactions this month
  const baseIncome = monthlyIncome > 0 ? monthlyIncome : (allIncome > 0 ? allIncome : 50000);
  const baseExpenseCategories = Object.keys(currentCategoryExpenses).length > 0 ? currentCategoryExpenses : (Object.keys(allCategoryExpenses).length > 0 ? allCategoryExpenses : { Food: 12000, Shopping: 8000, Bills: 5000, Transport: 4000, Other: 3000 });
  const baseExpense = Object.values(baseExpenseCategories).reduce((sum, val) => sum + val, 0);
  const baseSavings = baseIncome - baseExpense;
  const baseSavingsRate = baseIncome > 0 ? Math.round((baseSavings / baseIncome) * 100) : 0;

  // 1. Calculate Simulated Income
  const simIncome = Math.round(Math.max(0, baseIncome * (1 + Number(incomeChangePercent) / 100) + Number(incomeChangeAbsolute)));

  // 2. Calculate Simulated Category Expenses
  const adjustmentMap = {};
  if (Array.isArray(categoryAdjustments)) {
    categoryAdjustments.forEach((item) => {
      if (item && item.category) {
        adjustmentMap[item.category] = Number(item.percentChange) || 0;
      }
    });
  }

  const simulatedCategoryExpenses = {};
  let simTotalExpense = 0;

  Object.entries(baseExpenseCategories).forEach(([cat, originalAmount]) => {
    const percentAdj = adjustmentMap[cat] !== undefined ? adjustmentMap[cat] : 0;
    const adjustedAmount = Math.max(0, Math.round(originalAmount * (1 + percentAdj / 100)));
    simulatedCategoryExpenses[cat] = {
      baselineAmount: originalAmount,
      simulatedAmount: adjustedAmount,
      difference: adjustedAmount - originalAmount,
      percentChange: percentAdj,
    };
    simTotalExpense += adjustedAmount;
  });

  // Apply custom budget cap if specified and non-zero
  if (customBudgetCap > 0 && simTotalExpense > customBudgetCap) {
    simTotalExpense = Number(customBudgetCap);
  }

  // 3. Simulated Savings & Differences
  const simSavings = simIncome - simTotalExpense;
  const simSavingsRate = simIncome > 0 ? Math.round((simSavings / simIncome) * 100) : 0;
  const monthlyNetDifference = simSavings - baseSavings;
  const annualImpact = monthlyNetDifference * 12;
  const savingsRateChange = simSavingsRate - baseSavingsRate;

  // 4. Generate 12-Month Projections Array for Charts
  const projectionMonths = [];
  let cumBaseline = 0;
  let cumSimulated = 0;

  for (let m = 1; m <= 12; m++) {
    cumBaseline += Math.max(0, baseSavings);
    cumSimulated += Math.max(0, simSavings);
    projectionMonths.push({
      monthIndex: m,
      monthLabel: `Month ${m}`,
      baselineCumulative: cumBaseline,
      simulatedCumulative: cumSimulated,
      difference: cumSimulated - cumBaseline,
    });
  }

  return {
    isEstimate: true,
    disclaimer: 'This simulation uses hypothetical adjustments. None of your real accounts, budgets, or transactions have been modified.',
    baseline: {
      monthlyIncome: baseIncome,
      monthlyExpense: baseExpense,
      monthlySavings: baseSavings,
      savingsRate: baseSavingsRate,
      categoryExpenses: baseExpenseCategories,
    },
    simulated: {
      monthlyIncome: simIncome,
      monthlyExpense: simTotalExpense,
      monthlySavings: simSavings,
      savingsRate: simSavingsRate,
      categoryExpenses: simulatedCategoryExpenses,
    },
    impact: {
      monthlyNetDifference,
      annualImpact,
      savingsRateChange,
    },
    projections: projectionMonths,
  };
};

// @desc    Calculate what-if scenario metrics on the fly
// @route   POST /api/scenarios/calculate
// @access  Private
export const calculateScenario = async (req, res, next) => {
  try {
    const results = await computeSimulationMetrics(req.user._id, req.body);
    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved scenarios for user
// @route   GET /api/scenarios
// @access  Private
export const getScenarios = async (req, res, next) => {
  try {
    const scenarios = await FinancialScenario.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: scenarios.length,
      data: scenarios,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save a new scenario
// @route   POST /api/scenarios
// @access  Private
export const createScenario = async (req, res, next) => {
  try {
    const { name, description, adjustments } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Scenario name is required' });
    }

    const calculated = await computeSimulationMetrics(req.user._id, adjustments || {});

    const scenario = await FinancialScenario.create({
      userId: req.user._id,
      name: name.trim(),
      description: description || '',
      adjustments: adjustments || {},
      resultsSnapshot: {
        baselineIncome: calculated.baseline.monthlyIncome,
        baselineExpense: calculated.baseline.monthlyExpense,
        baselineSavings: calculated.baseline.monthlySavings,
        simulatedIncome: calculated.simulated.monthlyIncome,
        simulatedExpense: calculated.simulated.monthlyExpense,
        simulatedSavings: calculated.simulated.monthlySavings,
        monthlyNetDifference: calculated.impact.monthlyNetDifference,
        annualImpact: calculated.impact.annualImpact,
        savingsRateChange: calculated.impact.savingsRateChange,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Scenario "${scenario.name}" saved successfully`,
      data: scenario,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update / rename saved scenario
// @route   PUT /api/scenarios/:id
// @access  Private
export const updateScenario = async (req, res, next) => {
  try {
    const scenario = await FinancialScenario.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found or unauthorized' });
    }

    const { name, description, adjustments } = req.body;

    if (name) scenario.name = name.trim();
    if (description !== undefined) scenario.description = description;

    if (adjustments) {
      scenario.adjustments = adjustments;
      const calculated = await computeSimulationMetrics(req.user._id, adjustments);
      scenario.resultsSnapshot = {
        baselineIncome: calculated.baseline.monthlyIncome,
        baselineExpense: calculated.baseline.monthlyExpense,
        baselineSavings: calculated.baseline.monthlySavings,
        simulatedIncome: calculated.simulated.monthlyIncome,
        simulatedExpense: calculated.simulated.monthlyExpense,
        simulatedSavings: calculated.simulated.monthlySavings,
        monthlyNetDifference: calculated.impact.monthlyNetDifference,
        annualImpact: calculated.impact.annualImpact,
        savingsRateChange: calculated.impact.savingsRateChange,
      };
    }

    await scenario.save();

    return res.json({
      success: true,
      message: 'Scenario updated successfully',
      data: scenario,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete scenario
// @route   DELETE /api/scenarios/:id
// @access  Private
export const deleteScenario = async (req, res, next) => {
  try {
    const scenario = await FinancialScenario.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Scenario deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

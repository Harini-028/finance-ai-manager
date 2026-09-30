import Investment from '../models/Investment.js';

// @desc    Get user investments
// @route   GET /api/investments
// @access  Private
export const getInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const totalValue = investments.reduce((acc, inv) => acc + inv.shares * inv.currentPrice, 0);
    const totalCost = investments.reduce((acc, inv) => acc + inv.shares * inv.purchasePrice, 0);
    const totalReturn = totalValue - totalCost;
    const returnPercentage = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    res.status(200).json({
      success: true,
      count: investments.length,
      summary: {
        totalValue,
        totalCost,
        totalReturn,
        returnPercentage,
      },
      data: investments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add investment
// @route   POST /api/investments
// @access  Private
export const addInvestment = async (req, res, next) => {
  try {
    const { symbol, name, type, shares, purchasePrice, currentPrice, purchaseDate } = req.body;

    const investment = await Investment.create({
      userId: req.user._id,
      symbol,
      name,
      type: type || 'stock',
      shares: Number(shares),
      purchasePrice: Number(purchasePrice),
      currentPrice: Number(currentPrice || purchasePrice),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
    });

    res.status(201).json({
      success: true,
      data: investment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update investment
// @route   PUT /api/investments/:id
// @access  Private
export const updateInvestment = async (req, res, next) => {
  try {
    let investment = await Investment.findById(req.params.id);

    if (!investment) {
      res.status(404);
      throw new Error('Investment not found');
    }

    if (investment.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    investment = await Investment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: investment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete investment
// @route   DELETE /api/investments/:id
// @access  Private
export const deleteInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      res.status(404);
      throw new Error('Investment not found');
    }

    if (investment.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await investment.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

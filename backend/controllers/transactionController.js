import Transaction from '../models/Transaction.js';

// Helper function to map MongoDB document to expected response structure
const formatTransaction = (doc) => ({
  _id: doc._id,
  id: doc._id.toString(),
  userId: doc.userId,
  user_id: doc.userId.toString(),
  type: doc.type,
  amount: doc.amount,
  category: doc.category,
  description: doc.description,
  date: doc.date ? new Date(doc.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  createdAt: doc.createdAt,
  created_at: doc.createdAt,
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
export const addTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ success: false, message: 'Type, amount, and category are required' });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount: Number(amount),
      category,
      description: description || '',
      date: date ? new Date(date) : new Date(),
    });

    return res.status(201).json({
      success: true,
      data: formatTransaction(transaction),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user transactions with filtering & search
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res, next) => {
  try {
    const { type, category, search, startDate, endDate, month } = req.query;

    const query = { userId: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (month) {
      // YYYY-MM
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: transactions.length,
      data: transactions.map(formatTransaction),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    return res.json({
      success: true,
      data: formatTransaction(transaction),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
    }

    const { type, amount, category, description, date } = req.body;

    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);

    await transaction.save();

    return res.json({
      success: true,
      data: formatTransaction(transaction),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Transaction removed',
      data: formatTransaction(transaction),
    });
  } catch (error) {
    next(error);
  }
};

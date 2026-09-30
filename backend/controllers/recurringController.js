import RecurringTransaction from '../models/RecurringTransaction.js';

const formatRecurring = (doc) => ({
  _id: doc._id,
  id: doc._id.toString(),
  userId: doc.userId,
  user_id: doc.userId.toString(),
  title: doc.title,
  amount: doc.amount,
  type: doc.type,
  category: doc.category,
  frequency: doc.frequency || 'monthly',
  nextDue: doc.nextDue ? new Date(doc.nextDue).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  active: doc.active !== undefined ? doc.active : true,
  createdAt: doc.createdAt,
  created_at: doc.createdAt,
});

export const getRecurringTransactions = async (req, res, next) => {
  try {
    const items = await RecurringTransaction.find({ userId: req.user._id }).sort({ nextDue: 1 });
    return res.json({
      success: true,
      count: items.length,
      data: items.map(formatRecurring),
    });
  } catch (error) {
    next(error);
  }
};

export const createRecurringTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, frequency, nextDue } = req.body;

    if (!title || !amount || !type || !category) {
      return res.status(400).json({ success: false, message: 'Title, amount, type, and category are required' });
    }

    const item = await RecurringTransaction.create({
      userId: req.user._id,
      title,
      amount: Number(amount),
      type,
      category,
      frequency: frequency || 'monthly',
      nextDue: nextDue ? new Date(nextDue) : new Date(),
    });

    return res.status(201).json({
      success: true,
      data: formatRecurring(item),
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecurringTransaction = async (req, res, next) => {
  try {
    let item = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    const { title, amount, type, category, frequency, nextDue, active } = req.body;

    if (title !== undefined) item.title = title;
    if (amount !== undefined) item.amount = Number(amount);
    if (type !== undefined) item.type = type;
    if (category !== undefined) item.category = category;
    if (frequency !== undefined) item.frequency = frequency;
    if (nextDue !== undefined) item.nextDue = new Date(nextDue);
    if (active !== undefined) item.active = active;

    await item.save();

    return res.json({
      success: true,
      data: formatRecurring(item),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecurringTransaction = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    return res.json({
      success: true,
      message: 'Recurring transaction deleted',
    });
  } catch (error) {
    next(error);
  }
};

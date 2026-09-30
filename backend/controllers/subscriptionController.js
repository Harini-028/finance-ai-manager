import Subscription from '../models/Subscription.js';

const formatSubscription = (doc) => ({
  _id: doc._id,
  id: doc._id.toString(),
  userId: doc.userId,
  name: doc.name,
  amount: doc.amount,
  frequency: doc.frequency || 'monthly',
  category: doc.category || 'Other',
  nextBillingDate: doc.nextBillingDate ? new Date(doc.nextBillingDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  active: doc.active !== undefined ? doc.active : true,
  icon: doc.icon || '',
  description: doc.description || '',
  createdAt: doc.createdAt,
});

export const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ nextBillingDate: 1 });
    return res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions.map(formatSubscription),
    });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const { name, amount, frequency, category, nextBillingDate, icon, description } = req.body;

    if (!name || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Name and amount are required' });
    }

    const subscription = await Subscription.create({
      userId: req.user._id,
      name,
      amount: Number(amount),
      frequency: frequency || 'monthly',
      category: category || 'Entertainment',
      nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : new Date(),
      icon: icon || '',
      description: description || '',
    });

    return res.status(201).json({
      success: true,
      data: formatSubscription(subscription),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    let subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const { name, amount, frequency, category, nextBillingDate, active, icon, description } = req.body;

    if (name !== undefined) subscription.name = name;
    if (amount !== undefined) subscription.amount = Number(amount);
    if (frequency !== undefined) subscription.frequency = frequency;
    if (category !== undefined) subscription.category = category;
    if (nextBillingDate !== undefined) subscription.nextBillingDate = new Date(nextBillingDate);
    if (active !== undefined) subscription.active = active;
    if (icon !== undefined) subscription.icon = icon;
    if (description !== undefined) subscription.description = description;

    await subscription.save();

    return res.json({
      success: true,
      data: formatSubscription(subscription),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    return res.json({
      success: true,
      message: 'Subscription removed',
    });
  } catch (error) {
    next(error);
  }
};

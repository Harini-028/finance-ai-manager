import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';

// Calculate monthly and yearly cost based on frequency
export const calculateNormalizedCosts = (amount, frequency) => {
  const num = Number(amount) || 0;
  const freq = (frequency || 'monthly').toLowerCase();

  let monthly = 0;
  let yearly = 0;

  switch (freq) {
    case 'weekly':
      monthly = Math.round((num * 52) / 12);
      yearly = Math.round(num * 52);
      break;
    case 'quarterly':
      monthly = Math.round(num / 3);
      yearly = Math.round(num * 4);
      break;
    case 'yearly':
    case 'annual':
      monthly = Math.round(num / 12);
      yearly = Math.round(num);
      break;
    case 'monthly':
    default:
      monthly = Math.round(num);
      yearly = Math.round(num * 12);
      break;
  }

  return { monthlyCost: monthly, yearlyCost: yearly };
};

const formatSubscription = (doc) => {
  const costs = calculateNormalizedCosts(doc.amount, doc.frequency);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let daysUntilDue = null;
  let urgency = 'normal';

  if (doc.nextBillingDate) {
    const nextDate = new Date(doc.nextBillingDate);
    nextDate.setHours(0, 0, 0, 0);
    const diffTime = nextDate.getTime() - now.getTime();
    daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) urgency = 'overdue';
    else if (daysUntilDue === 0) urgency = 'due_today';
    else if (daysUntilDue <= 7) urgency = 'due_soon';
  }

  return {
    _id: doc._id,
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    amount: doc.amount,
    frequency: doc.frequency || 'monthly',
    category: doc.category || 'Other',
    nextBillingDate: doc.nextBillingDate ? new Date(doc.nextBillingDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    daysUntilDue,
    urgency,
    active: doc.active !== undefined ? doc.active : true,
    icon: doc.icon || '',
    description: doc.description || '',
    monthlyCost: costs.monthlyCost,
    yearlyCost: costs.yearlyCost,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// Duplicate detection logic
const detectDuplicates = (subscriptions) => {
  const activeSubs = subscriptions.filter((s) => s.active);
  const duplicates = [];

  for (let i = 0; i < activeSubs.length; i++) {
    for (let j = i + 1; j < activeSubs.length; j++) {
      const a = activeSubs[i];
      const b = activeSubs[j];

      const nameA = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const nameB = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check name similarity or exact category + amount match
      const isSameName = nameA.includes(nameB) || nameB.includes(nameA);
      const isSameCostCategory = a.amount === b.amount && a.category === b.category && a.frequency === b.frequency;

      if (isSameName || isSameCostCategory) {
        duplicates.push({
          subscriptionA: { id: a._id, name: a.name, amount: a.amount },
          subscriptionB: { id: b._id, name: b.name, amount: b.amount },
          reason: isSameName
            ? `Similar service name detected ("${a.name}" & "${b.name}")`
            : `Identical charge (₹${a.amount} ${a.frequency}) in category "${a.category}"`,
        });
      }
    }
  }

  return duplicates;
};

// @desc    Get all subscriptions with calculations and alerts
// @route   GET /api/subscriptions
// @access  Private
export const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ nextBillingDate: 1 });

    const formatted = subscriptions.map(formatSubscription);
    const activeSubs = formatted.filter((s) => s.active);

    const totalMonthlyCost = activeSubs.reduce((sum, s) => sum + s.monthlyCost, 0);
    const totalYearlyCost = activeSubs.reduce((sum, s) => sum + s.yearlyCost, 0);

    const duplicateAlerts = detectDuplicates(subscriptions);

    // In-app reminders (upcoming in next 14 days or overdue)
    const reminders = activeSubs
      .filter((s) => s.urgency !== 'normal')
      .map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        urgency: s.urgency,
        nextBillingDate: s.nextBillingDate,
        message:
          s.urgency === 'due_today'
            ? `Payment of ₹${s.amount.toLocaleString()} for ${s.name} is due today!`
            : s.urgency === 'due_soon'
              ? `Payment of ₹${s.amount.toLocaleString()} for ${s.name} is due in ${s.daysUntilDue} days (${s.nextBillingDate}).`
              : `Payment of ₹${s.amount.toLocaleString()} for ${s.name} was due on ${s.nextBillingDate}.`,
      }));

    return res.json({
      success: true,
      count: subscriptions.length,
      data: formatted,
      summary: {
        activeCount: activeSubs.length,
        totalMonthlyCost,
        totalYearlyCost,
        duplicateAlerts,
        reminders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subscription
// @route   POST /api/subscriptions
// @access  Private
export const createSubscription = async (req, res, next) => {
  try {
    const { name, amount, frequency, category, nextBillingDate, icon, description } = req.body;

    if (!name || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid subscription name and positive amount are required' });
    }

    const subscription = await Subscription.create({
      userId: req.user._id,
      name: name.trim(),
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

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
    }

    const { name, amount, frequency, category, nextBillingDate, active, icon, description } = req.body;

    if (name !== undefined) subscription.name = name.trim();
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

// @desc    Pause or resume subscription
// @route   PATCH /api/subscriptions/:id/status
// @access  Private
export const toggleSubscriptionStatus = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
    }

    subscription.active = !subscription.active;
    await subscription.save();

    return res.json({
      success: true,
      message: `Subscription ${subscription.active ? 'resumed' : 'paused'}`,
      data: formatSubscription(subscription),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a payment into real Transactions with user confirmation, and advance next billing date
// @route   POST /api/subscriptions/:id/log-payment
// @access  Private
export const logSubscriptionPaymentAsTransaction = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
    }

    // 1. Create real transaction
    const newTx = await Transaction.create({
      userId: req.user._id,
      type: 'expense',
      amount: subscription.amount,
      category: subscription.category || 'Bills',
      description: `Subscription: ${subscription.name}`,
      date: new Date(),
    });

    // 2. Advance nextBillingDate based on frequency
    const currentBilling = new Date(subscription.nextBillingDate || new Date());
    const freq = subscription.frequency || 'monthly';

    if (freq === 'weekly') {
      currentBilling.setDate(currentBilling.getDate() + 7);
    } else if (freq === 'quarterly') {
      currentBilling.setMonth(currentBilling.getMonth() + 3);
    } else if (freq === 'yearly' || freq === 'annual') {
      currentBilling.setFullYear(currentBilling.getFullYear() + 1);
    } else {
      // Monthly
      currentBilling.setMonth(currentBilling.getMonth() + 1);
    }

    subscription.nextBillingDate = currentBilling;
    await subscription.save();

    return res.json({
      success: true,
      message: `Logged ₹${subscription.amount.toLocaleString()} to expenses and advanced next billing date to ${currentBilling.toISOString().slice(0, 10)}.`,
      data: {
        subscription: formatSubscription(subscription),
        transaction: newTx,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

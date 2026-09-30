import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

const formatNotification = (doc) => ({
  _id: doc._id,
  id: doc._id.toString(),
  userId: doc.userId,
  title: doc.title,
  message: doc.message,
  type: doc.type || 'alert',
  read: doc.read || false,
  createdAt: doc.createdAt,
  created_at: doc.createdAt,
});

export const getNotifications = async (req, res, next) => {
  try {
    let notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // If notifications list is empty, generate initial smart financial alerts
    if (notifications.length === 0) {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);

      const transactions = await Transaction.find({ userId: req.user._id });
      const budgets = await Budget.find({ userId: req.user._id, month: currentMonth });

      const defaultAlerts = [
        {
          userId: req.user._id,
          title: '🎉 Welcome to FinPilot AI',
          message: 'Your account is ready! Track transactions, set smart budgets, and monitor your wealth.',
          type: 'tip',
          read: false,
        },
      ];

      // Check budget overrun
      budgets.forEach((b) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category === b.category)
          .reduce((sum, t) => sum + t.amount, 0);
        if (b.amount > 0 && spent > b.amount) {
          defaultAlerts.push({
            userId: req.user._id,
            title: `⚠️ Budget Exceeded: ${b.category}`,
            message: `You have exceeded your ${b.category} budget limit (${spent}/${b.amount}).`,
            type: 'budget',
            read: false,
          });
        }
      });

      notifications = await Notification.insertMany(defaultAlerts);
    }

    return res.json({
      success: true,
      count: notifications.length,
      data: notifications.map(formatNotification),
    });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const notification = await Notification.create({
      userId: req.user._id,
      title,
      message,
      type: type || 'alert',
    });

    return res.status(201).json({
      success: true,
      data: formatNotification(notification),
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({
      success: true,
      data: formatNotification(notification),
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({
      success: true,
      message: 'Notification removed',
    });
  } catch (error) {
    next(error);
  }
};

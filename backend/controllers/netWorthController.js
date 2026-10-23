import NetWorthItem from '../models/NetWorthItem.js';
import NetWorthSnapshot from '../models/NetWorthSnapshot.js';

// Calculate summary metrics
export const calculateNetWorthData = async (userId) => {
  const items = await NetWorthItem.find({ userId }).sort({ createdAt: -1 });

  const assets = [];
  const liabilities = [];
  const assetCategoryMap = {};
  const liabilityCategoryMap = {};

  let totalAssets = 0;
  let totalLiabilities = 0;

  items.forEach((item) => {
    const val = Number(item.value) || 0;
    if (item.type === 'asset') {
      assets.push(item);
      totalAssets += val;
      assetCategoryMap[item.category] = (assetCategoryMap[item.category] || 0) + val;
    } else if (item.type === 'liability') {
      liabilities.push(item);
      totalLiabilities += val;
      liabilityCategoryMap[item.category] = (liabilityCategoryMap[item.category] || 0) + val;
    }
  });

  const netWorth = totalAssets - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0;

  const assetBreakdown = Object.entries(assetCategoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalAssets > 0 ? Math.round((amount / totalAssets) * 100) : 0,
  }));

  const liabilityBreakdown = Object.entries(liabilityCategoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalLiabilities > 0 ? Math.round((amount / totalLiabilities) * 100) : 0,
  }));

  // Fetch snapshots
  let snapshots = await NetWorthSnapshot.find({ userId }).sort({ date: 1 });

  // If no snapshots exist, create an initial one
  if (snapshots.length === 0 && items.length > 0) {
    const initSnapshot = await NetWorthSnapshot.create({
      userId,
      date: new Date(),
      totalAssets,
      totalLiabilities,
      netWorth,
      assetBreakdown,
      liabilityBreakdown,
      notes: 'Initial valuation snapshot',
    });
    snapshots = [initSnapshot];
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    debtToAssetRatio,
    assets,
    liabilities,
    assetBreakdown,
    liabilityBreakdown,
    snapshots,
  };
};

// @desc    Get complete net worth overview, breakdown, and historical snapshots
// @route   GET /api/net-worth
// @access  Private
export const getNetWorthSummary = async (req, res, next) => {
  try {
    const summary = await calculateNetWorthData(req.user._id);
    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add an asset or liability item
// @route   POST /api/net-worth/items
// @access  Private
export const createNetWorthItem = async (req, res, next) => {
  try {
    const { type, category, name, value, currency, notes, lastValuationDate } = req.body;

    if (!type || !['asset', 'liability'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be either 'asset' or 'liability'" });
    }

    if (!category || !name || value === undefined || Number(value) < 0) {
      return res.status(400).json({ success: false, message: 'Category, name, and valid non-negative value are required' });
    }

    const item = await NetWorthItem.create({
      userId: req.user._id,
      type,
      category: category.trim(),
      name: name.trim(),
      value: Number(value),
      currency: currency || 'INR',
      notes: notes || '',
      lastValuationDate: lastValuationDate ? new Date(lastValuationDate) : new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `${type === 'asset' ? 'Asset' : 'Liability'} "${item.name}" added successfully`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an asset or liability item
// @route   PUT /api/net-worth/items/:id
// @access  Private
export const updateNetWorthItem = async (req, res, next) => {
  try {
    const item = await NetWorthItem.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found or unauthorized' });
    }

    const { type, category, name, value, currency, notes, lastValuationDate } = req.body;

    if (type && ['asset', 'liability'].includes(type)) item.type = type;
    if (category) item.category = category.trim();
    if (name) item.name = name.trim();
    if (value !== undefined) {
      if (Number(value) < 0) return res.status(400).json({ success: false, message: 'Value cannot be negative' });
      item.value = Number(value);
      item.lastValuationDate = lastValuationDate ? new Date(lastValuationDate) : new Date();
    }
    if (currency) item.currency = currency;
    if (notes !== undefined) item.notes = notes;
    if (lastValuationDate && !value) item.lastValuationDate = new Date(lastValuationDate);

    await item.save();

    return res.json({
      success: true,
      message: 'Item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an asset or liability item
// @route   DELETE /api/net-worth/items/:id
// @access  Private
export const deleteNetWorthItem = async (req, res, next) => {
  try {
    const item = await NetWorthItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: `${item.type === 'asset' ? 'Asset' : 'Liability'} "${item.name}" removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a dated historical snapshot of current Net Worth
// @route   POST /api/net-worth/snapshots
// @access  Private
export const recordNetWorthSnapshot = async (req, res, next) => {
  try {
    const { date, notes } = req.body;
    const summary = await calculateNetWorthData(req.user._id);

    const snapshot = await NetWorthSnapshot.create({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      totalAssets: summary.totalAssets,
      totalLiabilities: summary.totalLiabilities,
      netWorth: summary.netWorth,
      assetBreakdown: summary.assetBreakdown,
      liabilityBreakdown: summary.liabilityBreakdown,
      notes: notes || 'Manual valuation snapshot',
    });

    return res.status(201).json({
      success: true,
      message: `Net worth snapshot of ₹${summary.netWorth.toLocaleString()} recorded successfully`,
      data: snapshot,
    });
  } catch (error) {
    next(error);
  }
};

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'finance_manager_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    if (user) {
      const token = generateToken(user._id);
      return res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          full_name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          currency: user.currency,
          phone: user.phone,
          occupation: user.occupation,
          monthly_income: user.monthly_income,
          financial_goal: user.financial_goal,
          avatar_url: user.avatar_url,
          language: user.language,
          notify_budget: user.notify_budget,
          notify_transactions: user.notify_transactions,
          notify_insights: user.notify_insights,
        },
        token,
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          full_name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          currency: user.currency,
          phone: user.phone,
          occupation: user.occupation,
          monthly_income: user.monthly_income,
          financial_goal: user.financial_goal,
          avatar_url: user.avatar_url,
          language: user.language,
          notify_budget: user.notify_budget,
          notify_transactions: user.notify_transactions,
          notify_insights: user.notify_insights,
        },
        token,
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        full_name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        currency: user.currency,
        phone: user.phone,
        occupation: user.occupation,
        monthly_income: user.monthly_income,
        financial_goal: user.financial_goal,
        avatar_url: user.avatar_url,
        language: user.language,
        notify_budget: user.notify_budget,
        notify_transactions: user.notify_transactions,
        notify_insights: user.notify_insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || req.body.full_name || user.name;
    if (req.body.email) user.email = req.body.email.toLowerCase();
    if (req.body.password) user.password = req.body.password;
    if (req.body.currency !== undefined) user.currency = req.body.currency;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.occupation !== undefined) user.occupation = req.body.occupation;
    if (req.body.monthly_income !== undefined) user.monthly_income = req.body.monthly_income;
    if (req.body.financial_goal !== undefined) user.financial_goal = req.body.financial_goal;
    if (req.body.avatar_url !== undefined) user.avatar_url = req.body.avatar_url;
    if (req.body.language !== undefined) user.language = req.body.language;
    if (req.body.notify_budget !== undefined) user.notify_budget = req.body.notify_budget;
    if (req.body.notify_transactions !== undefined) user.notify_transactions = req.body.notify_transactions;
    if (req.body.notify_insights !== undefined) user.notify_insights = req.body.notify_insights;

    const updatedUser = await user.save();

    return res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        id: updatedUser._id,
        name: updatedUser.name,
        full_name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        currency: updatedUser.currency,
        phone: updatedUser.phone,
        occupation: updatedUser.occupation,
        monthly_income: updatedUser.monthly_income,
        financial_goal: updatedUser.financial_goal,
        avatar_url: updatedUser.avatar_url,
        language: updatedUser.language,
        notify_budget: updatedUser.notify_budget,
        notify_transactions: updatedUser.notify_transactions,
        notify_insights: updatedUser.notify_insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

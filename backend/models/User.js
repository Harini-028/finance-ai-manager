import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    phone: {
      type: String,
      default: '',
    },
    occupation: {
      type: String,
      default: '',
    },
    monthly_income: {
      type: Number,
      default: 0,
    },
    financial_goal: {
      type: String,
      default: '',
    },
    avatar_url: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    notify_budget: {
      type: Boolean,
      default: true,
    },
    notify_transactions: {
      type: Boolean,
      default: true,
    },
    notify_insights: {
      type: Boolean,
      default: true,
    },
    themeMode: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark',
    },
    dashboardWidgets: {
      type: Object,
      default: {
        income: true,
        expenses: true,
        savings: true,
        investments: true,
        budget: true,
        aiScore: true,
        charts: true,
        recentTransactions: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

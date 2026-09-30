import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please specify budget amount'],
      min: [0, 'Budget amount cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'monthly',
    },
    month: {
      type: String, // format YYYY-MM
      required: true,
    },
    year: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;

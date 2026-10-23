import mongoose from 'mongoose';

const netWorthItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['asset', 'liability'],
      required: [true, 'Please specify whether this item is an asset or liability'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please enter an item name'],
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Please enter a monetary value'],
      min: [0, 'Value cannot be negative'],
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    lastValuationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

netWorthItemSchema.index({ userId: 1, type: 1 });

const NetWorthItem = mongoose.model('NetWorthItem', netWorthItemSchema);
export default NetWorthItem;

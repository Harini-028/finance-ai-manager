import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a subscription name'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add an amount'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    frequency: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    category: {
      type: String,
      trim: true,
      default: 'Other',
    },
    nextBillingDate: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1, active: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;

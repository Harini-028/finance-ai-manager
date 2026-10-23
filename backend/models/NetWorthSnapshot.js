import mongoose from 'mongoose';

const netWorthSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    totalAssets: {
      type: Number,
      required: true,
      default: 0,
    },
    totalLiabilities: {
      type: Number,
      required: true,
      default: 0,
    },
    netWorth: {
      type: Number,
      required: true,
      default: 0,
    },
    assetBreakdown: [
      {
        category: String,
        amount: Number,
      },
    ],
    liabilityBreakdown: [
      {
        category: String,
        amount: Number,
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

netWorthSnapshotSchema.index({ userId: 1, date: -1 });

const NetWorthSnapshot = mongoose.model('NetWorthSnapshot', netWorthSnapshotSchema);
export default NetWorthSnapshot;

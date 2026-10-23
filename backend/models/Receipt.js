import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    storedFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    extractedData: {
      merchant: {
        type: String,
        trim: true,
        default: 'Unknown Merchant',
      },
      date: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        trim: true,
        default: 'INR',
      },
      category: {
        type: String,
        trim: true,
        default: 'Other',
      },
      rawText: {
        type: String,
        default: '',
      },
      confidence: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['pending_review', 'confirmed', 'discarded'],
      default: 'pending_review',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

receiptSchema.index({ userId: 1, createdAt: -1 });

const Receipt = mongoose.model('Receipt', receiptSchema);
export default Receipt;

import mongoose from 'mongoose';

const financialScenarioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a scenario name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    adjustments: {
      incomeChangePercent: {
        type: Number,
        default: 0,
      },
      incomeChangeAbsolute: {
        type: Number,
        default: 0,
      },
      categoryAdjustments: [
        {
          category: { type: String, required: true },
          percentChange: { type: Number, default: 0 },
        },
      ],
      savingsContributionChange: {
        type: Number,
        default: 0,
      },
      customBudgetCap: {
        type: Number,
        default: 0,
      },
    },
    resultsSnapshot: {
      baselineIncome: { type: Number, default: 0 },
      baselineExpense: { type: Number, default: 0 },
      baselineSavings: { type: Number, default: 0 },
      simulatedIncome: { type: Number, default: 0 },
      simulatedExpense: { type: Number, default: 0 },
      simulatedSavings: { type: Number, default: 0 },
      monthlyNetDifference: { type: Number, default: 0 },
      annualImpact: { type: Number, default: 0 },
      savingsRateChange: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

financialScenarioSchema.index({ userId: 1, createdAt: -1 });

const FinancialScenario = mongoose.model('FinancialScenario', financialScenarioSchema);
export default FinancialScenario;

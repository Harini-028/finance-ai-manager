import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders, Sparkles, Save, RotateCcw, AlertCircle, Bookmark,
  Trash2, X,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency } from '../lib/format';

type SavedScenario = {
  _id: string;
  name: string;
  description: string;
  adjustments: {
    incomeChangePercent?: number;
    incomeChangeAbsolute?: number;
    categoryAdjustments?: Array<{ category: string; percentChange: number }>;
    customBudgetCap?: number;
  };
  resultsSnapshot: {
    baselineIncome: number;
    baselineExpense: number;
    baselineSavings: number;
    simulatedIncome: number;
    simulatedExpense: number;
    simulatedSavings: number;
    monthlyNetDifference: number;
    annualImpact: number;
    savingsRateChange: number;
  };
  createdAt: string;
};

type SimulationData = {
  isEstimate: boolean;
  disclaimer: string;
  baseline: {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    savingsRate: number;
    categoryExpenses: Record<string, number>;
  };
  simulated: {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    savingsRate: number;
    categoryExpenses: Record<string, {
      baselineAmount: number;
      simulatedAmount: number;
      difference: number;
      percentChange: number;
    }>;
  };
  impact: {
    monthlyNetDifference: number;
    annualImpact: number;
    savingsRateChange: number;
  };
  projections: Array<{
    monthIndex: number;
    monthLabel: string;
    baselineCumulative: number;
    simulatedCumulative: number;
    difference: number;
  }>;
};

export default function WhatIfSimulatorPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'INR';

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [simData, setSimData] = useState<SimulationData | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  // Adjustments State
  const [incomePercent, setIncomePercent] = useState<number>(0);
  const [categorySliders, setCategorySliders] = useState<Record<string, number>>({});
  const [budgetCap, setBudgetCap] = useState<number>(0);

  // Save Modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');

  // Run calculation
  const calculate = async (adjustmentsOverride?: {
    incomeChangePercent?: number;
    categoryAdjustments?: Array<{ category: string; percentChange: number }>;
    customBudgetCap?: number;
  }) => {
    setCalculating(true);
    try {
      const payload = adjustmentsOverride || {
        incomeChangePercent: incomePercent,
        categoryAdjustments: Object.entries(categorySliders).map(([category, percentChange]) => ({
          category,
          percentChange,
        })),
        customBudgetCap: budgetCap,
      };

      const res = await api.post('/scenarios/calculate', payload);
      if (res.data?.success && res.data.data) {
        setSimData(res.data.data);
      }
    } catch (err: any) {
      console.error('Calculation error:', err);
      notify('error', err.response?.data?.message || 'Failed to compute scenario');
    } finally {
      setCalculating(false);
      setLoading(false);
    }
  };

  const loadSavedScenarios = async () => {
    try {
      const res = await api.get('/scenarios');
      if (res.data?.success) {
        setSavedScenarios(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load saved scenarios:', err);
    }
  };

  useEffect(() => {
    calculate();
    loadSavedScenarios();
  }, []);

  // Presets
  const applyPreset = (type: 'food10' | 'shop20' | 'income15' | 'frugal' | 'reset') => {
    if (type === 'reset') {
      setIncomePercent(0);
      setCategorySliders({});
      setBudgetCap(0);
      calculate({ incomeChangePercent: 0, categoryAdjustments: [], customBudgetCap: 0 });
      notify('info', 'Reset simulator to current baseline');
      return;
    }

    if (type === 'food10') {
      const updated = { ...categorySliders, 'Food': -10, 'Food & Dining': -10 };
      setCategorySliders(updated);
      calculate({
        incomeChangePercent: incomePercent,
        categoryAdjustments: Object.entries(updated).map(([category, percentChange]) => ({ category, percentChange })),
      });
      notify('success', 'Applied preset: 10% reduction in food expenses');
    } else if (type === 'shop20') {
      const updated = { ...categorySliders, 'Shopping': -20 };
      setCategorySliders(updated);
      calculate({
        incomeChangePercent: incomePercent,
        categoryAdjustments: Object.entries(updated).map(([category, percentChange]) => ({ category, percentChange })),
      });
      notify('success', 'Applied preset: 20% reduction in shopping expenses');
    } else if (type === 'income15') {
      setIncomePercent(15);
      calculate({
        incomeChangePercent: 15,
        categoryAdjustments: Object.entries(categorySliders).map(([category, percentChange]) => ({ category, percentChange })),
      });
      notify('success', 'Applied preset: 15% increase in monthly income');
    } else if (type === 'frugal') {
      const updated = {
        'Food & Dining': -15,
        'Food': -15,
        'Shopping': -30,
        'Entertainment': -40,
        'Travel': -20,
      };
      setCategorySliders(updated);
      calculate({
        incomeChangePercent: incomePercent,
        categoryAdjustments: Object.entries(updated).map(([category, percentChange]) => ({ category, percentChange })),
      });
      notify('success', 'Applied preset: Frugal living mode on discretionary categories');
    }
  };

  const handleSliderChange = (cat: string, val: number) => {
    const next = { ...categorySliders, [cat]: val };
    setCategorySliders(next);
  };

  const handleApplySliders = () => {
    calculate();
  };

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) {
      notify('warning', 'Please enter a scenario name');
      return;
    }

    try {
      const payload = {
        name: scenarioName.trim(),
        description: scenarioDesc.trim(),
        adjustments: {
          incomeChangePercent: incomePercent,
          categoryAdjustments: Object.entries(categorySliders).map(([category, percentChange]) => ({
            category,
            percentChange,
          })),
          customBudgetCap: budgetCap,
        },
      };

      await api.post('/scenarios', payload);
      notify('success', `Scenario "${payload.name}" saved successfully`);
      setSaveModalOpen(false);
      setScenarioName('');
      setScenarioDesc('');
      await loadSavedScenarios();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to save scenario');
    }
  };

  const handleLoadScenario = (scen: SavedScenario) => {
    const inc = scen.adjustments?.incomeChangePercent || 0;
    const catMap: Record<string, number> = {};
    if (scen.adjustments?.categoryAdjustments) {
      scen.adjustments.categoryAdjustments.forEach((item) => {
        catMap[item.category] = item.percentChange;
      });
    }

    setIncomePercent(inc);
    setCategorySliders(catMap);
    setBudgetCap(scen.adjustments?.customBudgetCap || 0);

    calculate({
      incomeChangePercent: inc,
      categoryAdjustments: scen.adjustments?.categoryAdjustments || [],
      customBudgetCap: scen.adjustments?.customBudgetCap || 0,
    });

    notify('info', `Loaded scenario: "${scen.name}"`);
  };

  const handleDeleteScenario = async (id: string, name: string) => {
    if (!window.confirm(`Delete saved scenario "${name}"?`)) return;
    try {
      await api.delete(`/scenarios/${id}`);
      notify('success', `Deleted scenario "${name}"`);
      await loadSavedScenarios();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to delete scenario');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  const baseline = simData?.baseline;
  const simulated = simData?.simulated;
  const impact = simData?.impact;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl gradient-brand text-white shadow-soft">
              <Sliders className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
              What-If Financial Simulator
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Model hypothetical income, category spending adjustments, and project multi-year wealth impacts
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => applyPreset('reset')} className="btn-secondary text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button onClick={() => setSaveModalOpen(true)} className="btn-primary text-xs">
            <Save className="h-3.5 w-3.5" /> Save Scenario
          </button>
        </div>
      </div>

      {/* Strict Simulation Disclaimer Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-800 dark:text-violet-300">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" />
        <div>
          <span className="font-bold">Hypothetical Simulation Mode: </span>
          All values and projections displayed on this page are non-destructive mathematical estimates. Your actual transactions, budgets, account balances, and goal records are 100% untouched.
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="card p-4 border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/50">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-xs font-bold text-ink-700 dark:text-ink-200 uppercase tracking-wider">Interactive Scenario Presets</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset('food10')}
            className="text-xs px-3 py-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:border-brand-500 text-ink-700 dark:text-ink-200 transition-all shadow-2xs"
          >
            🥗 Reduce Food Expenses by 10%
          </button>
          <button
            onClick={() => applyPreset('shop20')}
            className="text-xs px-3 py-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:border-brand-500 text-ink-700 dark:text-ink-200 transition-all shadow-2xs"
          >
            🛍️ Reduce Shopping by 20%
          </button>
          <button
            onClick={() => applyPreset('income15')}
            className="text-xs px-3 py-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:border-brand-500 text-ink-700 dark:text-ink-200 transition-all shadow-2xs"
          >
            💼 +15% Income Hike / Side Gig
          </button>
          <button
            onClick={() => applyPreset('frugal')}
            className="text-xs px-3 py-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:border-brand-500 text-ink-700 dark:text-ink-200 transition-all shadow-2xs"
          >
            ⚡ Frugal Living Mode (Cut Discretionary 25%)
          </button>
        </div>
      </div>

      {/* Comparison KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Savings Impact */}
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
            Simulated Monthly Impact
          </span>
          <p className={`mt-2 text-2xl font-bold ${(impact?.monthlyNetDifference || 0) >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-error-600 dark:text-error-400'}`}>
            {(impact?.monthlyNetDifference || 0) >= 0 ? '+' : ''}{formatCurrency(impact?.monthlyNetDifference || 0, currency)}/mo
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Simulated: {formatCurrency(simulated?.monthlySavings || 0, currency)} (Baseline: {formatCurrency(baseline?.monthlySavings || 0, currency)})
          </p>
        </div>

        {/* Annualized Wealth Impact */}
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 font-bold uppercase tracking-wider">
            1-Year Net Gain
          </span>
          <p className={`mt-2 text-2xl font-bold ${(impact?.annualImpact || 0) >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-error-600 dark:text-error-400'}`}>
            {(impact?.annualImpact || 0) >= 0 ? '+' : ''}{formatCurrency(impact?.annualImpact || 0, currency)}/yr
          </p>
          <p className="text-xs text-ink-400 mt-1">Compound annual wealth impact</p>
        </div>

        {/* Savings Rate Shift */}
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider">
            Savings Rate Shift
          </span>
          <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
            {simulated?.savingsRate}%
            <span className={`text-xs ml-2 font-semibold ${(impact?.savingsRateChange || 0) >= 0 ? 'text-brand-500' : 'text-error-500'}`}>
              {(impact?.savingsRateChange || 0) >= 0 ? '+' : ''}{impact?.savingsRateChange}%
            </span>
          </p>
          <p className="text-xs text-ink-400 mt-1">Baseline was {baseline?.savingsRate}%</p>
        </div>

        {/* Total Monthly Spend */}
        <div className="card p-4 border border-ink-100 dark:border-ink-800">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 font-bold uppercase tracking-wider">
            Simulated Outflow
          </span>
          <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
            {formatCurrency(simulated?.monthlyExpense || 0, currency)}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Difference: {formatCurrency((simulated?.monthlyExpense || 0) - (baseline?.monthlyExpense || 0), currency)}
          </p>
        </div>
      </div>

      {/* Main Interactive Controls & Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders (5 cols) */}
        <div className="lg:col-span-5 card p-5 border border-ink-100 dark:border-ink-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-ink-800">
            <h3 className="font-display font-bold text-base text-ink-900 dark:text-white">Simulator Controls</h3>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Live Simulation</span>
          </div>

          {/* Income Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink-700 dark:text-ink-200">Monthly Income Change</span>
              <span className={`font-bold ${incomePercent >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-error-600 dark:text-error-400'}`}>
                {incomePercent >= 0 ? `+${incomePercent}%` : `${incomePercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="100"
              step="5"
              value={incomePercent}
              onChange={(e) => setIncomePercent(parseInt(e.target.value))}
              onMouseUp={handleApplySliders}
              onTouchEnd={handleApplySliders}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-400">
              <span>-40% cut</span>
              <span>Baseline: {formatCurrency(baseline?.monthlyIncome || 0, currency)}</span>
              <span>+100% double</span>
            </div>
          </div>

          {/* Category Sliders */}
          <div className="space-y-4 pt-2 border-t border-ink-100 dark:border-ink-800">
            <p className="text-xs font-bold text-ink-700 dark:text-ink-200 uppercase tracking-wider">
              Category Expense Sliders
            </p>

            {baseline?.categoryExpenses &&
              Object.entries(baseline.categoryExpenses).map(([cat, baseAmt]) => {
                const currentSliderVal = categorySliders[cat] !== undefined ? categorySliders[cat] : 0;
                const simAmt = simulated?.categoryExpenses[cat]?.simulatedAmount ?? baseAmt;

                return (
                  <div key={cat} className="space-y-1.5 bg-ink-50/60 dark:bg-ink-900/60 p-2.5 rounded-xl border border-ink-100 dark:border-ink-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-ink-800 dark:text-white truncate">{cat}</span>
                      <span className={`font-mono text-[11px] font-bold ${currentSliderVal < 0 ? 'text-emerald-600 dark:text-emerald-400' : currentSliderVal > 0 ? 'text-error-600 dark:text-error-400' : 'text-ink-400'}`}>
                        {currentSliderVal > 0 ? `+${currentSliderVal}%` : `${currentSliderVal}%`} ({formatCurrency(simAmt, currency)})
                      </span>
                    </div>

                    <input
                      type="range"
                      min="-70"
                      max="50"
                      step="5"
                      value={currentSliderVal}
                      onChange={(e) => handleSliderChange(cat, parseInt(e.target.value))}
                      onMouseUp={handleApplySliders}
                      onTouchEnd={handleApplySliders}
                      className="w-full accent-brand-500 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-ink-400">
                      <span>Cut 70%</span>
                      <span>Base: {formatCurrency(baseAmt, currency)}</span>
                      <span>+50%</span>
                    </div>
                  </div>
                );
              })}
          </div>

          <button
            onClick={handleApplySliders}
            disabled={calculating}
            className="btn-primary w-full text-xs py-2.5"
          >
            {calculating ? 'Calculating...' : 'Recalculate Projections'}
          </button>
        </div>

        {/* Right Column: Chart & Projections (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 12-Month Cumulative Wealth Chart */}
          <div className="card p-5 border border-ink-100 dark:border-ink-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-ink-900 dark:text-white">
                  12-Month Cumulative Savings Trajectory
                </h3>
                <p className="text-xs text-ink-400">Baseline Trajectory vs. Simulated Scenario</p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold">
                Estimate
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simData?.projections || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#19b97e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#19b97e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="baselineCumulative"
                    name="Current Baseline Path"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#baseGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="simulatedCumulative"
                    name="Simulated Scenario Path"
                    stroke="#19b97e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#simGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saved Scenarios Card */}
          <div className="card p-5 border border-ink-100 dark:border-ink-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-brand-500" />
                <span>Saved Scenarios ({savedScenarios.length})</span>
              </h3>
            </div>

            {savedScenarios.length === 0 ? (
              <p className="text-xs text-ink-400 py-4 text-center">
                No saved scenarios yet. Use the "Save Scenario" button above to preserve your simulated models.
              </p>
            ) : (
              <div className="space-y-2.5">
                {savedScenarios.map((scen) => (
                  <div
                    key={scen._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-800 gap-3"
                  >
                    <div>
                      <p className="font-bold text-sm text-ink-800 dark:text-white">{scen.name}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{scen.description || 'Custom simulation'}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                        <span>Monthly Delta: +{formatCurrency(scen.resultsSnapshot?.monthlyNetDifference || 0, currency)}</span>
                        <span>·</span>
                        <span>Annual Impact: +{formatCurrency(scen.resultsSnapshot?.annualImpact || 0, currency)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleLoadScenario(scen)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        Load Model
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(scen._id, scen.name)}
                        className="p-1.5 text-error-400 hover:text-error-600 hover:bg-error-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Scenario Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">Save Current Scenario</h3>
              <button onClick={() => setSaveModalOpen(false)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScenario} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Scenario Name *</label>
                <input
                  required
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. Cut Dining by 15% + New Promotion"
                  className="input-field text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={scenarioDesc}
                  onChange={(e) => setScenarioDesc(e.target.value)}
                  placeholder="Notes on the hypotheses in this scenario..."
                  className="input-field text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-900 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-400">Monthly Net Gain:</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    +{formatCurrency(impact?.monthlyNetDifference || 0, currency)}/mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Annual Projection:</span>
                  <span className="font-bold text-accent-600 dark:text-accent-400">
                    +{formatCurrency(impact?.annualImpact || 0, currency)}/yr
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSaveModalOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save Scenario
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

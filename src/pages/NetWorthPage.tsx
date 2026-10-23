import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Landmark, Plus, TrendingUp, TrendingDown,
  Scale, Pencil, Trash2, X, Camera,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatDate } from '../lib/format';

type NetWorthItem = {
  _id: string;
  type: 'asset' | 'liability';
  category: string;
  name: string;
  value: number;
  currency: string;
  notes: string;
  lastValuationDate: string;
  createdAt: string;
  updatedAt: string;
};

type NetWorthSnapshot = {
  _id: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  notes?: string;
};

type NetWorthSummaryData = {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtToAssetRatio: number;
  assets: NetWorthItem[];
  liabilities: NetWorthItem[];
  assetBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  liabilityBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  snapshots: NetWorthSnapshot[];
};

const assetCategories = [
  'Cash & Bank Accounts',
  'Investments & Mutual Funds',
  'Stocks & Equity',
  'Real Estate & Property',
  'Vehicles',
  'Retirement & Pension',
  'Gold & Valuables',
  'Other Assets',
];

const liabilityCategories = [
  'Mortgages & Home Loans',
  'Auto Loans',
  'Student Loans',
  'Credit Card Balances',
  'Personal Loans',
  'Business Debt',
  'Other Liabilities',
];

const ASSET_COLORS = ['#19b97e', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#64748b'];
const LIABILITY_COLORS = ['#ef4444', '#f97316', '#eab308', '#dc2626', '#b91c1c', '#7c2d12', '#991b1b'];

export default function NetWorthPage() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'INR';

  const [data, setData] = useState<NetWorthSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NetWorthItem | null>(null);
  const [modalType, setModalType] = useState<'asset' | 'liability'>('asset');
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    value: '',
    notes: '',
    lastValuationDate: new Date().toISOString().slice(0, 10),
  });

  // Snapshot modal
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotNotes, setSnapshotNotes] = useState('');

  const loadNetWorth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/net-worth');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load net worth:', err);
      notify('error', err.response?.data?.message || 'Failed to load net worth data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetWorth();
  }, []);

  const openAddItemModal = (type: 'asset' | 'liability') => {
    setEditingItem(null);
    setModalType(type);
    setItemForm({
      name: '',
      category: type === 'asset' ? assetCategories[0] : liabilityCategories[0],
      value: '',
      notes: '',
      lastValuationDate: new Date().toISOString().slice(0, 10),
    });
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: NetWorthItem) => {
    setEditingItem(item);
    setModalType(item.type);
    setItemForm({
      name: item.name,
      category: item.category,
      value: item.value.toString(),
      notes: item.notes || '',
      lastValuationDate: item.lastValuationDate ? item.lastValuationDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(itemForm.value);
    if (!itemForm.name.trim() || isNaN(val) || val < 0) {
      notify('warning', 'Please provide a valid item name and non-negative value');
      return;
    }

    const payload = {
      type: modalType,
      category: itemForm.category,
      name: itemForm.name.trim(),
      value: val,
      currency,
      notes: itemForm.notes.trim(),
      lastValuationDate: itemForm.lastValuationDate,
    };

    try {
      if (editingItem) {
        await api.put(`/net-worth/items/${editingItem._id}`, payload);
        notify('success', `${modalType === 'asset' ? 'Asset' : 'Liability'} "${payload.name}" updated`);
      } else {
        await api.post('/net-worth/items', payload);
        notify('success', `${modalType === 'asset' ? 'Asset' : 'Liability'} "${payload.name}" added`);
      }
      setItemModalOpen(false);
      await loadNetWorth();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      await api.delete(`/net-worth/items/${id}`);
      notify('success', `Removed "${name}"`);
      await loadNetWorth();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleRecordSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/net-worth/snapshots', {
        date: new Date(),
        notes: snapshotNotes.trim() || 'Manual valuation checkpoint',
      });
      notify('success', res.data?.message || 'Historical net worth snapshot recorded');
      setSnapshotModalOpen(false);
      setSnapshotNotes('');
      await loadNetWorth();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to record snapshot');
    }
  };

  // Format historical snapshots for chart
  const snapshotChartData = useMemo(() => {
    if (!data?.snapshots) return [];
    return data.snapshots.map((s) => ({
      date: formatDate(s.date),
      netWorth: s.netWorth,
      assets: s.totalAssets,
      liabilities: s.totalLiabilities,
    }));
  }, [data?.snapshots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} />
      </div>
    );
  }

  const netWorthVal = data?.netWorth ?? 0;
  const isPositiveNetWorth = netWorthVal >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl gradient-brand text-white shadow-soft">
              <Landmark className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
              Net Worth Tracker
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Total asset wealth minus total debt liabilities with dated manual valuations
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setSnapshotModalOpen(true)} className="btn-secondary text-xs">
            <Camera className="h-3.5 w-3.5" /> Record Snapshot
          </button>
          <button onClick={() => openAddItemModal('asset')} className="btn-primary text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Asset
          </button>
          <button
            onClick={() => openAddItemModal('liability')}
            className="btn-secondary text-xs border-error-500/30 text-error-600 dark:text-error-400 hover:bg-error-500/10"
          >
            <Plus className="h-3.5 w-3.5" /> Add Liability
          </button>
        </div>
      </div>

      {/* Safety Notice: Distinct from Cashflow */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-xs text-ink-700 dark:text-ink-300">
        <Scale className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-brand-700 dark:text-brand-300">Balance Sheet Isolation: </span>
          Net Worth measures total cumulative assets minus liabilities (your overall wealth). It is calculated independently and never mixed with monthly income, expenses, or savings cashflow.
        </div>
      </div>

      {/* Hero Net Worth Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="md:col-span-2 card p-6 border border-ink-100 dark:border-ink-800 relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-850 to-ink-950 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Net Worth</span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-brand-300 font-semibold">
              Assets - Liabilities
            </span>
          </div>

          <p className={`mt-3 font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${isPositiveNetWorth ? 'text-brand-400' : 'text-error-400'}`}>
            {formatCurrency(netWorthVal, currency)}
          </p>

          <p className="mt-2 text-xs text-ink-400">
            Across {data?.assets?.length || 0} asset holdings and {data?.liabilities?.length || 0} active debts
          </p>
        </div>

        {/* Total Assets */}
        <div className="card p-5 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Assets</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
            {formatCurrency(data?.totalAssets || 0, currency)}
          </p>
          <p className="text-xs text-ink-400 mt-1">{data?.assets?.length || 0} items valued</p>
        </div>

        {/* Total Liabilities */}
        <div className="card p-5 border border-error-500/20 bg-error-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-error-600 dark:text-error-400">Total Liabilities</span>
            <TrendingDown className="h-4 w-4 text-error-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
            {formatCurrency(data?.totalLiabilities || 0, currency)}
          </p>
          <p className="text-xs text-ink-400 mt-1">Debt-to-Asset: {data?.debtToAssetRatio || 0}%</p>
        </div>
      </div>

      {/* Historical Net Worth Snapshot Chart */}
      <div className="card p-6 border border-ink-100 dark:border-ink-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-base text-ink-900 dark:text-white">Historical Net Worth Trajectory</h3>
            <p className="text-xs text-ink-400">Dated valuation snapshots over time</p>
          </div>
          <span className="text-xs text-ink-400 font-semibold">{snapshotChartData.length} checkpoints</span>
        </div>

        {snapshotChartData.length <= 1 ? (
          <p className="text-center text-xs text-ink-400 py-12">
            Record multiple dated snapshots over time using the "Record Snapshot" button to view trajectory trends.
          </p>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshotChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#19b97e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#19b97e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#19b97e" strokeWidth={2.5} fillOpacity={1} fill="url(#nwGrad)" />
                <Area type="monotone" dataKey="assets" name="Total Assets" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={0} />
                <Area type="monotone" dataKey="liabilities" name="Total Liabilities" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Asset & Liability Allocation Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asset Breakdown */}
        <div className="card p-5 border border-ink-100 dark:border-ink-800">
          <h3 className="font-display font-bold text-base text-ink-900 dark:text-white mb-3">Asset Allocation</h3>
          {(!data?.assetBreakdown || data.assetBreakdown.length === 0) ? (
            <p className="text-xs text-ink-400 py-8 text-center">No assets recorded yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.assetBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {data.assetBreakdown.map((_, index) => (
                        <Cell key={`asset-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrency(Number(val), currency), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-ink-100 dark:border-ink-800">
                {data.assetBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length] }} />
                      <span className="text-ink-700 dark:text-ink-300">{item.category}</span>
                    </div>
                    <span className="font-semibold text-ink-900 dark:text-white">
                      {formatCurrency(item.amount, currency)} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Liability Breakdown */}
        <div className="card p-5 border border-ink-100 dark:border-ink-800">
          <h3 className="font-display font-bold text-base text-ink-900 dark:text-white mb-3">Liability & Debt Breakdown</h3>
          {(!data?.liabilityBreakdown || data.liabilityBreakdown.length === 0) ? (
            <p className="text-xs text-ink-400 py-8 text-center">No liabilities or debts recorded.</p>
          ) : (
            <div className="space-y-3">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.liabilityBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {data.liabilityBreakdown.map((_, index) => (
                        <Cell key={`liab-${index}`} fill={LIABILITY_COLORS[index % LIABILITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrency(Number(val), currency), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-ink-100 dark:border-ink-800">
                {data.liabilityBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LIABILITY_COLORS[idx % LIABILITY_COLORS.length] }} />
                      <span className="text-ink-700 dark:text-ink-300">{item.category}</span>
                    </div>
                    <span className="font-semibold text-ink-900 dark:text-white">
                      {formatCurrency(item.amount, currency)} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Asset and Liability Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets List */}
        <div className="card p-5 border border-ink-100 dark:border-ink-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>Assets Portfolio ({data?.assets?.length || 0})</span>
            </h3>
            <button onClick={() => openAddItemModal('asset')} className="btn-secondary text-xs py-1 px-2.5">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          {(!data?.assets || data.assets.length === 0) ? (
            <p className="text-xs text-ink-400 py-6 text-center">No assets added yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.assets.map((asset) => (
                <div
                  key={asset._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-800 text-xs"
                >
                  <div>
                    <p className="font-bold text-ink-800 dark:text-white">{asset.name}</p>
                    <p className="text-ink-500 dark:text-ink-400 text-[11px]">{asset.category}</p>
                    <p className="text-ink-400 text-[10px] mt-0.5">Valuation: {formatDate(asset.lastValuationDate)}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(asset.value, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditItemModal(asset)} className="p-1 text-ink-400 hover:text-ink-700 dark:hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteItem(asset._id, asset.name)} className="p-1 text-error-400 hover:text-error-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Liabilities List */}
        <div className="card p-5 border border-ink-100 dark:border-ink-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-ink-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-error-500" />
              <span>Liabilities & Debts ({data?.liabilities?.length || 0})</span>
            </h3>
            <button onClick={() => openAddItemModal('liability')} className="btn-secondary text-xs py-1 px-2.5">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          {(!data?.liabilities || data.liabilities.length === 0) ? (
            <p className="text-xs text-ink-400 py-6 text-center">No liabilities added. You are debt-free!</p>
          ) : (
            <div className="space-y-2.5">
              {data.liabilities.map((liab) => (
                <div
                  key={liab._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-800 text-xs"
                >
                  <div>
                    <p className="font-bold text-ink-800 dark:text-white">{liab.name}</p>
                    <p className="text-ink-500 dark:text-ink-400 text-[11px]">{liab.category}</p>
                    <p className="text-ink-400 text-[10px] mt-0.5">Valuation: {formatDate(liab.lastValuationDate)}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-bold text-error-600 dark:text-error-400 text-sm">
                        {formatCurrency(liab.value, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditItemModal(liab)} className="p-1 text-ink-400 hover:text-ink-700 dark:hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteItem(liab._id, liab.name)} className="p-1 text-error-400 hover:text-error-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                {editingItem ? 'Edit ' : 'Add '}
                {modalType === 'asset' ? 'Asset Item' : 'Liability Item'}
              </h3>
              <button onClick={() => setItemModalOpen(false)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Item Name *</label>
                <input
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder={modalType === 'asset' ? 'e.g. HDFC Savings, Vanguard Index, Apartment' : 'e.g. Home Loan, Car EMI, HDFC Credit Card'}
                  className="input-field text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Category *</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="input-field text-sm"
                >
                  {(modalType === 'asset' ? assetCategories : liabilityCategories).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Monetary Valuation ({currency}) *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={itemForm.value}
                    onChange={(e) => setItemForm({ ...itemForm, value: e.target.value })}
                    placeholder="0.00"
                    className="input-field text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Valuation Date</label>
                  <input
                    type="date"
                    value={itemForm.lastValuationDate}
                    onChange={(e) => setItemForm({ ...itemForm, lastValuationDate: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Notes / Institution (Optional)</label>
                <input
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  placeholder="e.g. Fixed rate mortgage 6.5%"
                  className="input-field text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setItemModalOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingItem ? 'Save Changes' : `Add ${modalType === 'asset' ? 'Asset' : 'Liability'}`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Record Snapshot Modal */}
      {snapshotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">Record Net Worth Snapshot</h3>
              <button onClick={() => setSnapshotModalOpen(false)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
              Capture your current net worth of <strong className="text-ink-900 dark:text-white">{formatCurrency(netWorthVal, currency)}</strong> as a dated checkpoint on your historical growth timeline.
            </p>

            <form onSubmit={handleRecordSnapshot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Checkpoint Note (Optional)</label>
                <input
                  value={snapshotNotes}
                  onChange={(e) => setSnapshotNotes(e.target.value)}
                  placeholder="e.g. Q4 Net Worth Audit, Year-end review"
                  className="input-field text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSnapshotModalOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Record Snapshot
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

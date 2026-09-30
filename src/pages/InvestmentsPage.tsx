import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Plus, Trash2, X, DollarSign,
  BarChart3, PieChart as PieIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../services/api';
import type { Investment } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency } from '../lib/format';

const typeColors: Record<string, string> = {
  stock: '#19b97e',
  crypto: '#f59e0b',
  etf: '#3b82f6',
  bond: '#6366f1',
  mutual_fund: '#ec4899',
  fixed_deposit: '#8b5cf6',
  gold: '#eab308',
  other: '#64748b',
};

function AddModal({ onClose, onSave }: { onClose: () => void; onSave: (inv: Partial<Investment>) => void }) {
  const [form, setForm] = useState({
    symbol: '', name: '', type: 'stock', shares: '', purchase_price: '', current_price: '', purchase_date: '',
  });

  const handle = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      type: form.type as Investment['type'],
      shares: parseFloat(form.shares),
      purchase_price: parseFloat(form.purchase_price),
      current_price: parseFloat(form.current_price),
      purchase_date: form.purchase_date,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">Add Investment</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Symbol</label>
              <input required value={form.symbol} onChange={e => handle('symbol', e.target.value)} placeholder="AAPL" className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Type</label>
              <select value={form.type} onChange={e => handle('type', e.target.value)} className="input-field text-sm">
                <option value="stock">Stock</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="fixed_deposit">Fixed Deposit</option>
                <option value="gold">Gold</option>
                <option value="etf">ETF</option>
                <option value="bond">Bond</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Full Name</label>
            <input required value={form.name} onChange={e => handle('name', e.target.value)} placeholder="Apple Inc." className="input-field text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Shares</label>
              <input required type="number" step="any" value={form.shares} onChange={e => handle('shares', e.target.value)} placeholder="10" className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Buy Price</label>
              <input required type="number" step="any" value={form.purchase_price} onChange={e => handle('purchase_price', e.target.value)} placeholder="150.00" className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Current</label>
              <input required type="number" step="any" value={form.current_price} onChange={e => handle('current_price', e.target.value)} placeholder="189.50" className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1 block">Purchase Date</label>
            <input required type="date" value={form.purchase_date} onChange={e => handle('purchase_date', e.target.value)} className="input-field text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Add Investment</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/investments');
      const list = (res.data.data || []).map((i: any) => ({
        id: i._id || i.id,
        user_id: i.userId || i.user_id,
        symbol: i.symbol,
        name: i.name,
        type: i.type,
        shares: i.shares,
        purchase_price: i.purchasePrice ?? i.purchase_price,
        current_price: i.currentPrice ?? i.current_price,
        purchase_date: i.purchaseDate ?? i.purchase_date,
        created_at: i.createdAt ?? i.created_at,
      }));
      setInvestments(list);
    } catch (e) {
      console.error('Error loading investments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (inv: Partial<Investment>) => {
    try {
      await api.post('/investments', {
        symbol: inv.symbol,
        name: inv.name,
        type: inv.type,
        shares: inv.shares,
        purchasePrice: inv.purchase_price,
        currentPrice: inv.current_price,
        purchaseDate: inv.purchase_date,
      });
      setShowAdd(false);
      load();
    } catch (e) {
      console.error('Error adding investment:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/investments/${id}`);
      setInvestments(p => p.filter(i => i.id !== id));
    } catch (e) {
      console.error('Error deleting investment:', e);
    }
  };

  const totalValue = investments.reduce((s, i) => s + i.shares * i.current_price, 0);
  const totalCost = investments.reduce((s, i) => s + i.shares * i.purchase_price, 0);
  const totalReturn = totalValue - totalCost;
  const returnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  const pieData = Object.entries(
    investments.reduce((acc: Record<string, number>, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.shares * inv.current_price;
      return acc;
    }, {})
  ).map(([type, value]) => ({ name: type.charAt(0).toUpperCase() + type.slice(1), value: Math.round(value), color: typeColors[type] }));

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white">Investment Portfolio</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Track your stocks, crypto, and ETF holdings</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Investment
        </button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Portfolio Value', value: formatCurrency(totalValue, 'USD'), icon: BarChart3, gradient: 'gradient-brand' },
          { label: 'Total Invested', value: formatCurrency(totalCost, 'USD'), icon: DollarSign, gradient: 'gradient-accent' },
          { label: 'Total Return', value: formatCurrency(totalReturn, 'USD'), icon: totalReturn >= 0 ? TrendingUp : TrendingDown, gradient: totalReturn >= 0 ? 'gradient-brand' : 'gradient-warm' },
          { label: 'Return %', value: `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%`, icon: PieIcon, gradient: returnPct >= 0 ? 'gradient-violet' : 'gradient-warm' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.gradient} text-white`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-xs text-ink-400">{c.label}</p>
            </div>
            <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Holdings table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-4">Holdings</h3>
          {investments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ink-400 mb-3">No investments yet</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add first</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800">
                    {['Asset', 'Shares', 'Price', 'Value', 'Return', ''].map((h) => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-ink-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50 dark:divide-ink-800/50">
                  {investments.map((inv) => {
                    const value = inv.shares * inv.current_price;
                    const cost = inv.shares * inv.purchase_price;
                    const ret = value - cost;
                    const retPct = cost > 0 ? (ret / cost) * 100 : 0;
                    return (
                      <tr key={inv.id} className="group hover:bg-ink-50 dark:hover:bg-ink-800/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: typeColors[inv.type] }}>
                              {inv.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-ink-900 dark:text-white">{inv.symbol}</p>
                              <p className="text-xs text-ink-400">{inv.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-ink-700 dark:text-ink-200">{inv.shares}</td>
                        <td className="py-3 px-2 text-ink-700 dark:text-ink-200">{formatCurrency(inv.current_price, 'USD')}</td>
                        <td className="py-3 px-2 font-semibold text-ink-900 dark:text-white">{formatCurrency(value, 'USD')}</td>
                        <td className="py-3 px-2">
                          <span className={`text-sm font-semibold ${ret >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-error-500'}`}>
                            {ret >= 0 ? '+' : ''}{formatCurrency(ret, 'USD')} ({retPct.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <button onClick={() => handleDelete(inv.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-error-400 hover:text-error-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Allocation pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Allocation</h3>
          <p className="text-xs text-ink-400 mb-4">By asset type</p>
          {pieData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-ink-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v), 'USD')} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-100/50 dark:bg-ink-900/50 text-xs text-ink-500 dark:text-ink-400 flex items-center justify-between">
        <p>⚠️ <strong>Disclaimer:</strong> FinPilot AI provides tracking and analytics for informational purposes only. We do not provide guaranteed financial advice or investment recommendations.</p>
      </div>
    </div>
  );
}

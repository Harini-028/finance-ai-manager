import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { FileText, Download, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatCompact, formatDate, cn, round2 } from '../lib/format';
import { getCategoryMeta } from '../lib/constants';
import { monthlyComparison } from '../lib/analytics';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const periodTabs: { key: ReportPeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const inRange = (date: string, period: ReportPeriod, ref: Date): boolean => {
  const d = new Date(date);
  if (period === 'daily') return d.toDateString() === ref.toDateString();
  if (period === 'weekly') {
    const start = new Date(ref);
    start.setDate(ref.getDate() - ref.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  }
  if (period === 'monthly') return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
  return d.getFullYear() === ref.getFullYear();
};

const rangeLabel = (period: ReportPeriod, ref: Date): string => {
  if (period === 'daily') return ref.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (period === 'weekly') {
    const start = new Date(ref);
    start.setDate(ref.getDate() - ref.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  if (period === 'monthly') return ref.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return String(ref.getFullYear());
};

export default function ReportsPage() {
  const { profile } = useAuth();
  const { transactions, loading } = useDashboardData();
  const { notify } = useToast();
  const currency = profile?.currency ?? 'USD';
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const refDate = new Date();

  const rangeTx = useMemo(() => transactions.filter((t) => inRange(t.date, period, refDate)), [transactions, period]);
  const summary = useMemo(() => {
    const income = round2(rangeTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0));
    const expense = round2(rangeTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
    return { income, expense, net: round2(income - expense), count: rangeTx.length };
  }, [rangeTx]);

  const catBreakdown = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    rangeTx.filter((t) => t.type === 'expense').forEach((t) => {
      const cur = map.get(t.category) ?? { amount: 0, count: 0 };
      cur.amount += t.amount; cur.count += 1;
      map.set(t.category, cur);
    });
    return Array.from(map.entries()).map(([category, v]) => ({ category, amount: round2(v.amount), count: v.count })).sort((a, b) => b.amount - a.amount);
  }, [rangeTx]);

  const trendData = useMemo(() => {
    if (period === 'daily') {
      return rangeTx.map((t) => ({ date: t.date, income: t.type === 'income' ? t.amount : 0, expense: t.type === 'expense' ? t.amount : 0 }));
    }
    if (period === 'weekly') {
      const days: { date: string; income: number; expense: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() - refDate.getDay() + i);
        const ds = d.toISOString().split('T')[0];
        const dayTx = rangeTx.filter((t) => t.date === ds);
        days.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), income: round2(dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)), expense: round2(dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)) });
      }
      return days;
    }
    if (period === 'monthly') {
      const weeks: { date: string; income: number; expense: number }[] = [];
      for (let i = 1; i <= 4; i++) {
        const weekTx = rangeTx.filter((t) => {
          const d = new Date(t.date).getDate();
          return d >= (i - 1) * 7 + 1 && d <= i * 7;
        });
        weeks.push({ date: `Week ${i}`, income: round2(weekTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)), expense: round2(weekTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)) });
      }
      return weeks;
    }
    const months: { date: string; income: number; expense: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(refDate.getFullYear(), m, 1);
      const monthTx = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === refDate.getFullYear();
      });
      months.push({ date: d.toLocaleDateString('en-US', { month: 'short' }), income: round2(monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)), expense: round2(monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)) });
    }
    return months;
  }, [rangeTx, transactions, period]);

  const monthlyData = useMemo(() => monthlyComparison(transactions, 6), [transactions]);

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = rangeTx.map((t) => [t.date, t.type, t.category, `"${t.description.replace(/"/g, '""')}"`, t.amount]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpilot-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Report exported as CSV');
  };

  const exportPDF = () => {
    const win = window.open('', '_blank');
    if (!win) { notify('error', 'Popup blocked. Please allow popups to export PDF.'); return; }
    const c = (n: number) => formatCurrency(n, currency);
    const rowsHtml = rangeTx.map((t) => `<tr><td>${formatDate(t.date)}</td><td>${t.type}</td><td>${t.category}</td><td>${t.description || '-'}</td><td style="text-align:right">${c(t.amount)}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>FinPilot AI Report</title><style>
      body{font-family:Inter,Arial,sans-serif;margin:40px;color:#0f172a}
      h1{color:#19b97e;font-size:24px;margin:0 0 4px}
      .sub{color:#64748b;font-size:13px;margin-bottom:24px}
      .summary{display:flex;gap:24px;margin-bottom:32px}
      .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;flex:1}
      .card .label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em}
      .card .value{font-size:20px;font-weight:700;margin-top:4px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{text-align:left;padding:10px 12px;background:#f1f5f9;border-bottom:2px solid #e2e8f9;font-size:11px;text-transform:uppercase;color:#64748b}
      td{padding:10px 12px;border-bottom:1px solid #e2e8f0}
      .footer{margin-top:32px;font-size:11px;color:#94a3b8;text-align:center}
    </style></head><body>
      <h1>FinPilot AI — Financial Report</h1>
      <p class="sub">${rangeLabel(period, refDate)} · Generated ${new Date().toLocaleString()}</p>
      <div class="summary">
        <div class="card"><div class="label">Income</div><div class="value" style="color:#19b97e">${c(summary.income)}</div></div>
        <div class="card"><div class="label">Expenses</div><div class="value" style="color:#f59e0b">${c(summary.expense)}</div></div>
        <div class="card"><div class="label">Net Savings</div><div class="value" style="color:${summary.net >= 0 ? '#19b97e' : '#ef4444'}">${c(summary.net)}</div></div>
        <div class="card"><div class="label">Transactions</div><div class="value">${summary.count}</div></div>
      </div>
      <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <p class="footer">FinPilot AI · This report was generated automatically and reflects data entered by the user.</p>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
    notify('success', 'Opening print dialog for PDF export');
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>;

  const summaryCards = [
    { label: 'Income', value: summary.income, icon: TrendingUp, gradient: 'gradient-brand' },
    { label: 'Expenses', value: summary.expense, icon: TrendingDown, gradient: 'gradient-warm' },
    { label: 'Net Savings', value: summary.net, icon: PiggyBank, gradient: 'gradient-accent' },
    { label: 'Transactions', value: summary.count, icon: FileText, gradient: 'gradient-violet' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{rangeLabel(period, refDate)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={exportPDF} className="btn-primary text-sm"><FileText className="h-4 w-4" /> Export PDF</button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="inline-flex p-1 rounded-xl bg-ink-100 dark:bg-ink-800">
        {periodTabs.map((t) => (
          <button key={t.key} onClick={() => setPeriod(t.key)}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', period === t.key ? 'gradient-brand text-white shadow-soft' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-200')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl text-white mb-3', s.gradient)}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-400">{s.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-ink-900 dark:text-white">
              {s.label === 'Transactions' ? s.value : formatCurrency(s.value, currency)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Trend chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-ink-900 dark:text-white">{period === 'yearly' ? 'Monthly Trend' : `${period.charAt(0).toUpperCase() + period.slice(1)} Trend`}</h3>
            <p className="text-xs text-ink-400">Income vs expenses over time</p>
          </div>
        </div>
        {trendData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-ink-400">No data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v, currency)} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12 }} formatter={(v) => formatCurrency(Number(v), currency)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#19b97e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* 6-month comparison + category breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">6-Month Overview</h3>
          <p className="text-xs text-ink-400 mb-4">Income, expenses, and savings trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v, currency)} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => formatCurrency(Number(v), currency)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="income" name="Income" stroke="#19b97e" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="savings" name="Savings" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white mb-1">Category Breakdown</h3>
          <p className="text-xs text-ink-400 mb-4">Spending by category this {period === 'yearly' ? 'year' : period === 'monthly' ? 'month' : 'period'}</p>
          {catBreakdown.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-ink-400">No expense data</div>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {catBreakdown.map((c) => {
                const meta = getCategoryMeta(c.category);
                const pct = summary.expense > 0 ? (c.amount / summary.expense) * 100 : 0;
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <meta.icon className="h-4 w-4" style={{ color: meta.color }} />
                        <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{c.category}</span>
                      </div>
                      <span className="text-sm font-semibold text-ink-900 dark:text-white">{formatCurrency(c.amount, currency)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: meta.color }} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-400">{c.count} transactions · {Math.round(pct)}% of expenses</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Transaction log */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
        <div className="p-5 border-b border-ink-100 dark:border-ink-800">
          <h3 className="font-display font-semibold text-ink-900 dark:text-white">Transaction Log</h3>
          <p className="text-xs text-ink-400">{rangeTx.length} transactions in this period</p>
        </div>
        {rangeTx.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-400">No transactions in this period</div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-ink-900">
                <tr className="border-b border-ink-100 dark:border-ink-800 text-left">
                  <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide hidden sm:table-cell">Description</th>
                  <th className="px-5 py-3 font-medium text-ink-400 text-xs uppercase tracking-wide text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rangeTx.map((t) => (
                  <tr key={t.id} className="border-b border-ink-50 dark:border-ink-800/50 last:border-0">
                    <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{formatDate(t.date)}</td>
                    <td className="px-5 py-3 text-ink-700 dark:text-ink-200">{t.category}</td>
                    <td className="px-5 py-3 text-ink-500 dark:text-ink-400 hidden sm:table-cell truncate max-w-[200px]">{t.description || '-'}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${t.type === 'income' ? 'text-brand-600 dark:text-brand-400' : 'text-ink-700 dark:text-ink-200'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

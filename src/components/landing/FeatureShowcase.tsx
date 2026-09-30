import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Sparkles, BarChart3,
  CheckCircle2, ArrowRight, BrainCircuit, Target, Bell,
} from 'lucide-react';

const showcases = [
  {
    badge: 'Smart Dashboard',
    badgeColor: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
    heading: 'Your entire financial life at a glance',
    body: 'See income, expenses, savings, investments, and AI health score — all in one beautifully designed dashboard that updates in real time.',
    benefits: [
      'Live financial health score (0–100)',
      'Daily income vs expense trend charts',
      'Budget utilization progress bars',
      'Month-end spending projection',
    ],
    gradient: 'gradient-brand',
    icon: BarChart3,
    mockup: <DashboardMockup />,
    flip: false,
  },
  {
    badge: 'AI Copilot',
    badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    heading: 'An AI that truly understands your money',
    body: 'Chat with your personal AI financial advisor. Ask questions, get budget recommendations, understand spending patterns, and receive proactive alerts before problems arise.',
    benefits: [
      'Natural language financial Q&A',
      'Proactive spending anomaly alerts',
      'Personalized saving recommendations',
      'Tax-season insights & category tips',
    ],
    gradient: 'gradient-violet',
    icon: BrainCircuit,
    mockup: <AiMockup />,
    flip: true,
  },
  {
    badge: 'Budget Management',
    badgeColor: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
    heading: 'Stop overspending before it happens',
    body: 'Set budgets by category, day, week, or month. Get real-time alerts as you approach limits, and see every budget track automatically as you log transactions.',
    benefits: [
      'Per-category budget limits',
      'Real-time budget consumption bars',
      'Instant overspend notifications',
      'Historical budget performance reports',
    ],
    gradient: 'gradient-accent',
    icon: Target,
    mockup: <BudgetMockup />,
    flip: false,
  },
];

function DashboardMockup() {
  return (
    <div className="glass-card p-5 w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-400">Total Balance</p>
          <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">$24,580.00</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
          <BarChart3 className="h-5 w-5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Income', val: '$8.4k', icon: TrendingUp, color: 'text-brand-500' },
          { label: 'Expense', val: '$3.2k', icon: TrendingDown, color: 'text-warning-500' },
          { label: 'Score', val: '87/100', icon: Sparkles, color: 'text-violet-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-ink-50 dark:bg-ink-800/60 p-3">
            <s.icon className={`h-3.5 w-3.5 ${s.color} mb-1`} />
            <p className="text-[10px] text-ink-400">{s.label}</p>
            <p className="text-sm font-bold text-ink-900 dark:text-white">{s.val}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[
          { label: 'Housing', pct: 80, color: 'gradient-warm' },
          { label: 'Food', pct: 55, color: 'gradient-brand' },
          { label: 'Transport', pct: 30, color: 'gradient-accent' },
        ].map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-[10px] text-ink-400 mb-1">
              <span>{b.label}</span><span>{b.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-800">
              <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiMockup() {
  const msgs = [
    { role: 'user', text: 'How can I save more this month?' },
    { role: 'ai', text: 'Based on your spending, dining out is 40% above your usual. Cutting back by $120 would boost your savings rate to 28%! 🎯' },
    { role: 'user', text: 'Show me my top expense category' },
    { role: 'ai', text: 'Your top expense is Housing ($1,200). That\'s 24% of income — right in the healthy range. Great job!' },
  ];
  return (
    <div className="glass-card p-4 w-full space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-ink-100 dark:border-ink-800">
        <div className="h-8 w-8 rounded-xl gradient-violet flex items-center justify-center text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900 dark:text-white">AI Assistant</p>
          <p className="text-[10px] text-brand-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-500 inline-block" />Online</p>
        </div>
      </div>
      <div className="space-y-2 max-h-52 overflow-hidden">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`text-xs rounded-2xl px-3 py-2 max-w-[85%] leading-relaxed ${
              m.role === 'user'
                ? 'gradient-brand text-white'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetMockup() {
  const budgets = [
    { cat: 'Housing', spent: 1200, total: 1500, color: 'gradient-warm', pct: 80 },
    { cat: 'Food & Dining', spent: 320, total: 500, color: 'gradient-brand', pct: 64 },
    { cat: 'Transport', spent: 95, total: 300, color: 'gradient-accent', pct: 32 },
    { cat: 'Entertainment', spent: 180, total: 150, color: 'gradient-violet', pct: 100 },
  ];
  return (
    <div className="glass-card p-5 w-full space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-display font-semibold text-ink-900 dark:text-white text-sm">Monthly Budgets</p>
        <div className="flex items-center gap-1.5 text-xs text-warning-600 dark:text-warning-400 font-medium bg-warning-500/10 px-2 py-1 rounded-lg">
          <Bell className="h-3 w-3" /> 1 alert
        </div>
      </div>
      <div className="space-y-3">
        {budgets.map((b) => (
          <div key={b.cat}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-ink-700 dark:text-ink-200">{b.cat}</span>
              <span className={`font-semibold ${b.pct >= 100 ? 'text-error-500' : 'text-ink-500 dark:text-ink-400'}`}>
                ${b.spent} / ${b.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${b.pct >= 100 ? 'gradient-warm' : b.color}`}
                style={{ width: `${Math.min(b.pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeatureShowcase() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24 lg:space-y-32">
        {showcases.map((s, i) => (
          <motion.div
            key={s.badge}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${s.flip ? 'lg:grid-flow-col-dense' : ''}`}
          >
            {/* Text side */}
            <div className={s.flip ? 'lg:col-start-2' : ''}>
              <span className={`badge ${s.badgeColor} mb-4`}>{s.badge}</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink-900 dark:text-white tracking-tight text-balance leading-tight mt-2">
                {s.heading}
              </h2>
              <p className="mt-4 text-base text-ink-500 dark:text-ink-400 leading-relaxed">{s.body}</p>
              <ul className="mt-6 space-y-3">
                {s.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-ink-600 dark:text-ink-300">
                    <CheckCircle2 className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary mt-8 w-fit">
                Try it free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mockup side */}
            <motion.div
              className={`relative ${s.flip ? 'lg:col-start-1' : ''}`}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
            >
              {/* Glow blob */}
              <div className={`absolute -inset-4 rounded-3xl opacity-20 blur-2xl ${s.gradient}`} />
              <div className="relative">{s.mockup}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

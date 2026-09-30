import { motion } from 'framer-motion';
import {
  ArrowLeftRight, Wallet, BarChart3, Sparkles, FileText, Shield,
  RefreshCw, TrendingUp, Globe,
} from 'lucide-react';

const features = [
  {
    icon: ArrowLeftRight,
    title: 'Smart Transaction Tracking',
    desc: 'Log income and expenses in seconds. Search, filter, and sort every transaction with powerful tools. Supports bulk import.',
    gradient: 'gradient-brand',
    tag: 'Core',
  },
  {
    icon: Wallet,
    title: 'Intelligent Budgeting',
    desc: 'Set daily, weekly, and monthly budgets per category. Get real-time alerts before you overspend. See budget health at a glance.',
    gradient: 'gradient-accent',
    tag: 'Core',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics & Charts',
    desc: 'Beautiful area charts, pie breakdowns, and bar comparisons reveal spending patterns, trends, and category insights.',
    gradient: 'gradient-warm',
    tag: 'Analytics',
  },
  {
    icon: Sparkles,
    title: 'AI Financial Insights',
    desc: 'Our AI engine analyzes your data, detects anomalies, and delivers personalized recommendations to improve your finances.',
    gradient: 'gradient-violet',
    tag: 'AI',
  },
  {
    icon: FileText,
    title: 'Instant Reports & Export',
    desc: 'Generate daily, weekly, monthly, or yearly reports. Export to CSV or PDF with a single click for tax season or audits.',
    gradient: 'gradient-brand',
    tag: 'Reports',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    desc: 'Your data is encrypted with AES-256 and protected with row-level security. You own and control everything you enter.',
    gradient: 'gradient-accent',
    tag: 'Security',
  },
  {
    icon: RefreshCw,
    title: 'Recurring Transactions',
    desc: 'Track subscriptions, rent, and recurring income automatically. Never forget a bill — get reminders before due dates.',
    gradient: 'gradient-warm',
    tag: 'Automation',
  },
  {
    icon: TrendingUp,
    title: 'Investment Portfolio',
    desc: 'Monitor stocks, ETFs, and crypto holdings. See real-time gains, asset allocation, and total portfolio performance.',
    gradient: 'gradient-violet',
    tag: 'Investments',
  },
  {
    icon: Globe,
    title: 'Multi-Currency Support',
    desc: 'Track finances in USD, EUR, GBP, INR, JPY, AUD, or CAD. Switch currencies anytime without losing your data.',
    gradient: 'gradient-brand',
    tag: 'Global',
  },
];

const tagColors: Record<string, string> = {
  Core: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  Analytics: 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
  AI: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Reports: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
  Security: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  Automation: 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
  Investments: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Global: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
};

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="badge bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-4">Everything you need</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white tracking-tight text-balance">
            A complete finance toolkit, <span className="gradient-text">powered by AI</span>
          </h2>
          <p className="mt-4 text-lg text-ink-500 dark:text-ink-400">
            From tracking every penny to forecasting your financial future — FinPilot AI does it all.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ y: -6 }}
              className="group card p-6 hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.gradient} text-white shadow-soft transition-transform group-hover:scale-110`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <span className={`badge text-xs ${tagColors[f.tag] || 'bg-ink-100 text-ink-500'}`}>{f.tag}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

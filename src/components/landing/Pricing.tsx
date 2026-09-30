import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    annualPrice: '$0',
    period: 'forever',
    desc: 'Perfect for getting started',
    features: [
      'Up to 100 transactions/mo',
      '3 active budgets',
      'Basic AI insights',
      'CSV export',
      '1 savings goal',
      '7-day transaction history',
    ],
    cta: 'Get Started',
    highlight: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '$9',
    annualPrice: '$7',
    period: '/month',
    desc: 'For serious money managers',
    features: [
      'Unlimited transactions',
      'Unlimited budgets',
      'Advanced AI insights & chatbot',
      'CSV + PDF export',
      'Unlimited savings goals',
      'Investment portfolio tracker',
      'Recurring transactions',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    price: '$29',
    annualPrice: '$23',
    period: '/month',
    desc: 'For teams & families',
    features: [
      'Everything in Pro',
      'Up to 5 member accounts',
      'Shared budgets & goals',
      'Consolidated reports',
      'API access',
      'Custom categories',
      'White-label reports',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    highlight: false,
    badge: null,
  },
];

const comparisonRows = [
  { feature: 'Transactions per month', free: '100', pro: 'Unlimited', business: 'Unlimited' },
  { feature: 'Active budgets', free: '3', pro: 'Unlimited', business: 'Unlimited' },
  { feature: 'Savings goals', free: '1', pro: 'Unlimited', business: 'Unlimited' },
  { feature: 'AI insights', free: 'Basic', pro: 'Advanced', business: 'Advanced' },
  { feature: 'AI chatbot', free: false, pro: true, business: true },
  { feature: 'Investment tracker', free: false, pro: true, business: true },
  { feature: 'Recurring transactions', free: false, pro: true, business: true },
  { feature: 'PDF export', free: false, pro: true, business: true },
  { feature: 'Team accounts', free: false, pro: false, business: '5 seats' },
  { feature: 'API access', free: false, pro: false, business: true },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [showTable, setShowTable] = useState(false);

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="badge bg-accent-500/10 text-accent-600 dark:text-accent-400 mb-4">Simple pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white tracking-tight text-balance">
            Choose the plan that fits
          </h2>
          <p className="mt-4 text-base text-ink-500 dark:text-ink-400">
            All plans include core features. Upgrade or cancel anytime — no lock-in.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full glass p-1">
            <button onClick={() => setAnnual(false)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${!annual ? 'gradient-brand text-white' : 'text-ink-500'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${annual ? 'gradient-brand text-white' : 'text-ink-500'}`}>
              Annual <span className="text-xs opacity-80">-20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => {
            const price = annual ? p.annualPrice : p.price;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative card p-6 ${p.highlight ? 'ring-2 ring-brand-500 shadow-glow' : ''}`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full gradient-brand px-3 py-1 text-xs font-semibold text-white shadow-soft">
                    <Sparkles className="h-3 w-3" /> {p.badge}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-ink-900 dark:text-white">{p.name}</h3>
                <p className="text-sm text-ink-400 mt-1">{p.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-ink-900 dark:text-white">{price}</span>
                  <span className="text-sm text-ink-400">{p.period}</span>
                </div>
                {annual && p.price !== '$0' && (
                  <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 font-medium">
                    Save ${(Number(p.price.slice(1)) - Number(p.annualPrice.slice(1))) * 12}/yr
                  </p>
                )}
                <Link to="/register" className={`mt-5 w-full ${p.highlight ? 'btn-primary' : 'btn-secondary'} justify-center`}>{p.cta}</Link>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                      <Check className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10 max-w-xl mx-auto"
        >
          <div className="flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400">
            <Shield className="h-5 w-5 text-brand-500 shrink-0" />
            <span>30-day money-back guarantee, no questions asked</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400">
            <Zap className="h-5 w-5 text-warning-500 shrink-0" />
            <span>Cancel anytime, keep your data</span>
          </div>
        </motion.div>

        {/* Feature comparison table toggle */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowTable(!showTable)}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {showTable ? 'Hide' : 'View'} full feature comparison ↓
          </button>
        </div>

        {showTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-8 overflow-hidden"
          >
            <div className="overflow-x-auto rounded-2xl border border-ink-100 dark:border-ink-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink-50 dark:bg-ink-900/60">
                    <th className="text-left py-4 px-5 font-semibold text-ink-700 dark:text-ink-200">Feature</th>
                    {plans.map((p) => (
                      <th key={p.name} className={`py-4 px-5 font-semibold ${p.highlight ? 'text-brand-600 dark:text-brand-400' : 'text-ink-700 dark:text-ink-200'}`}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="bg-white dark:bg-ink-900">
                      <td className="py-3 px-5 text-ink-600 dark:text-ink-300">{row.feature}</td>
                      {['free', 'pro', 'business'].map((plan) => {
                        const val = row[plan as keyof typeof row];
                        return (
                          <td key={plan} className="py-3 px-5 text-center">
                            {val === true ? (
                              <Check className="h-4 w-4 text-brand-500 mx-auto" />
                            ) : val === false ? (
                              <span className="text-ink-300 dark:text-ink-700">—</span>
                            ) : (
                              <span className="text-ink-700 dark:text-ink-200 font-medium">{String(val)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { UserPlus, LayoutDashboard, Sparkles, TrendingUp } from 'lucide-react';

const steps = [
  { num: '01', icon: UserPlus, title: 'Create your account', desc: 'Sign up in seconds. No credit card, no commitment. Your secure financial workspace is ready instantly.' },
  { num: '02', icon: LayoutDashboard, title: 'Track your money', desc: 'Add transactions, set budgets, and define savings goals. Everything updates in real time across your dashboard.' },
  { num: '03', icon: Sparkles, title: 'Get AI insights', desc: 'Our AI analyzes your patterns and surfaces personalized recommendations, alerts, and opportunities.' },
  { num: '04', icon: TrendingUp, title: 'Grow your wealth', desc: 'Act on insights, watch your savings rate climb, and export reports to stay accountable over time.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white/50 dark:bg-ink-900/30 border-y border-ink-100 dark:border-ink-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="badge bg-accent-500/10 text-accent-600 dark:text-accent-400 mb-4">Simple & powerful</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 dark:text-white tracking-tight text-balance">
            From signup to savings in <span className="gradient-text">four steps</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative"
            >
              <div className="card p-6 h-full">
                <span className="font-display text-4xl font-bold gradient-text opacity-80">{s.num}</span>
                <div className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white shadow-soft">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 h-px w-6 bg-gradient-to-r from-brand-400 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

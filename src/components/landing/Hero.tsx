import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, TrendingDown, Wallet, PiggyBank, Play, Star } from 'lucide-react';

function useCountUp(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

const floatingCards = [
  { icon: TrendingUp, label: 'Income', value: '+$8,450', gradient: 'gradient-brand', delay: 0, pos: 'top-6 -left-4 sm:left-6' },
  { icon: TrendingDown, label: 'Expenses', value: '$3,210', gradient: 'gradient-warm', delay: 1.5, pos: 'top-20 -right-2 sm:right-4' },
  { icon: PiggyBank, label: 'Savings', value: '$5,240', gradient: 'gradient-accent', delay: 0.8, pos: 'bottom-24 left-0 sm:left-4' },
  { icon: Wallet, label: 'Budget', value: '72% used', gradient: 'gradient-violet', delay: 2.2, pos: 'bottom-4 right-2 sm:right-10' },
];

const trustedAvatars = ['SC', 'MJ', 'PP', 'DK', 'AL', 'RB'];

export function Hero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const usersCount = useCountUp(180000, 2200, inView);
  const trackedCount = useCountUp(24, 1800, inView);

  return (
    <section ref={ref} className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 bg-hero-glow" />
      <div className="absolute inset-0 -z-10 bg-grid bg-grid-light dark:bg-grid-dark opacity-60" />
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium text-ink-600 dark:text-ink-300 mb-6">
              <Sparkles className="h-4 w-4 text-brand-500" />
              AI-powered personal finance copilot
              <span className="inline-flex items-center gap-1 ml-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 rounded-full px-2 py-0.5">New v2.0</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 dark:text-white text-balance leading-[1.1]">
              Master your money with{' '}
              <span className="gradient-text">AI-powered</span> intelligence
            </h1>
            <p className="mt-6 text-lg text-ink-500 dark:text-ink-400 max-w-xl leading-relaxed">
              FinPilot AI tracks your spending, manages budgets, and delivers personalized financial insights — so you can make smarter money decisions every day.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="btn-primary text-base">
                Start for Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="btn-secondary text-base gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15">
                  <Play className="h-3 w-3 text-brand-600 dark:text-brand-400 fill-current" />
                </div>
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {trustedAvatars.slice(0, 5).map((a) => (
                    <div key={a} className="h-8 w-8 rounded-full gradient-brand border-2 border-white dark:border-ink-900 flex items-center justify-center text-white text-[10px] font-bold">
                      {a}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-ink-500 dark:text-ink-400">
                  <span className="font-bold text-ink-900 dark:text-white">{inView ? usersCount.toLocaleString() : '0'}+</span> users
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning-400 text-warning-400" />
                ))}
                <span className="text-sm font-semibold text-ink-700 dark:text-ink-200 ml-1">4.9/5</span>
              </div>
            </div>

            {/* Trust pills */}
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-ink-400">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-500" /> No credit card required</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent-500" /> Bank-grade security</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500" /> Cancel anytime</span>
            </div>
          </motion.div>

          {/* Right: floating cards visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative h-[440px] lg:h-[500px]"
          >
            {/* Central dashboard mockup */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full max-w-sm glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-ink-400">Total Balance</p>
                    <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">
                      ${inView ? trackedCount.toLocaleString() : '0'},580.00
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '68%' }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    className="h-full gradient-brand"
                  />
                </div>
                {/* Mini sparkline bars */}
                <div className="flex items-end gap-1 mb-4 h-10">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 88, 72].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 + 1 }}
                      className={`flex-1 rounded-sm ${i === 11 ? 'gradient-brand' : 'bg-brand-500/20'}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Income', value: '$8.4k', icon: TrendingUp, color: 'text-brand-500' },
                    { label: 'Expenses', value: '$3.2k', icon: TrendingDown, color: 'text-warning-500' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-3">
                      <s.icon className={`h-4 w-4 ${s.color} mb-1`} />
                      <p className="text-xs text-ink-400">{s.label}</p>
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{s.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Floating cards */}
            {floatingCards.map((card) => (
              <motion.div
                key={card.label}
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
                className={`absolute ${card.pos} glass-card p-3.5 w-36 shadow-glow`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.gradient} text-white`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-ink-400">{card.label}</span>
                </div>
                <p className="font-display text-lg font-bold text-ink-900 dark:text-white">{card.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from './ui/Logo';
import { type ReactNode } from 'react';

const benefits = [
  'AI-powered financial insights',
  'Real-time budget tracking & alerts',
  'Beautiful charts and reports',
  'Bank-grade security & encryption',
];

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-50 dark:bg-ink-950">
      {/* Left: form */}
      <div className="flex flex-col p-6 sm:p-10 lg:p-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white transition-colors mb-8 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8 lg:hidden">
            <Logo size="lg" />
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white tracking-tight">{title}</h1>
            <p className="mt-2 text-ink-500 dark:text-ink-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>

      {/* Right: visual panel */}
      <div className="hidden lg:flex relative overflow-hidden gradient-cool">
        <div className="absolute inset-0 bg-grid bg-grid-dark opacity-20" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <Logo size="lg" className="mb-12" />
          <h2 className="font-display text-4xl font-bold leading-tight text-balance">
            Your money, <span className="gradient-text">supercharged</span> by AI.
          </h2>
          <p className="mt-4 text-lg text-white/70 max-w-md">
            Join 180,000+ users who are tracking smarter, saving more, and growing their wealth with FinPilot AI.
          </p>
          <ul className="mt-10 space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 shrink-0">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm">
            {[
              { v: '180K+', l: 'Users' },
              { v: '$2.4B', l: 'Tracked' },
              { v: '32%', l: 'More savings' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/10 backdrop-blur p-3 text-center border border-white/10">
                <p className="font-display text-xl font-bold">{s.v}</p>
                <p className="text-xs text-white/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

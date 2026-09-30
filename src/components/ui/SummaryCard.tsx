import { motion } from 'framer-motion';
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/format';

type SummaryCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  change?: number;
  changeLabel?: string;
  delay?: number;
};

export function SummaryCard({ label, value, icon: Icon, gradient, change, changeLabel, delay = 0 }: SummaryCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card transition-all duration-300 hover:shadow-glow"
    >
      <div className={cn('absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20', gradient)} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft', gradient)}>
            <Icon className="h-5 w-5" />
          </div>
          {change !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                isPositive ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-error-500/10 text-error-600 dark:text-error-400',
              )}
            >
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white tracking-tight">{value}</p>
        {changeLabel && <p className="mt-0.5 text-xs text-ink-400">{changeLabel}</p>}
      </div>
    </motion.div>
  );
}

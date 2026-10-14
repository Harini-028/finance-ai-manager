import { useState } from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { cn } from '../../lib/format';

type SummaryCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  accentColor?: string;
  change?: number | null;
  changeLabel?: string;
  invertChangeColor?: boolean; // For expenses: positive change is bad (red), negative change is good (green)
  tooltip?: string;
  delay?: number;
  isLoading?: boolean;
};

export function SummaryCard({
  label,
  value,
  icon: Icon,
  gradient,
  change,
  changeLabel,
  invertChangeColor = false,
  tooltip,
  delay = 0,
  isLoading = false,
}: SummaryCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900/90 p-5 shadow-card animate-pulse min-h-[148px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="h-11 w-11 rounded-xl bg-ink-200 dark:bg-ink-800" />
          <div className="h-5 w-16 rounded-full bg-ink-200 dark:bg-ink-800" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-3.5 w-24 rounded bg-ink-200 dark:bg-ink-800" />
          <div className="h-6 w-32 rounded bg-ink-200 dark:bg-ink-800" />
        </div>
      </div>
    );
  }

  // Determine if change is positive in sentiment
  const isUp = change !== null && change !== undefined && change > 0;
  const isDown = change !== null && change !== undefined && change < 0;
  
  let changeColor = 'text-ink-400 bg-ink-100 dark:bg-ink-800';
  if (change !== null && change !== undefined) {
    const isGood = invertChangeColor ? isDown : isUp;
    const isBad = invertChangeColor ? isUp : isDown;
    if (isGood) {
      changeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    } else if (isBad) {
      changeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900/90 shadow-card transition-all duration-300 hover:shadow-glow hover:border-ink-200 dark:hover:border-ink-700 min-h-[148px]"
    >
      <div className={cn('absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20 pointer-events-none', gradient)} />
      
      <div className="p-5 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft shrink-0', gradient)}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex items-center gap-1">
            {change !== null && change !== undefined && !isNaN(change) ? (
              <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold', changeColor)}>
                {isUp ? <ArrowUpRight className="h-3 w-3" /> : isDown ? <ArrowDownRight className="h-3 w-3" /> : null}
                {Math.abs(change)}%
              </span>
            ) : changeLabel ? (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">
                {changeLabel}
              </span>
            ) : null}

            {tooltip && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip((p) => !p)}
                  className="p-1 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors"
                  aria-label="Info"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute right-0 top-6 z-50 w-52 rounded-xl bg-ink-950 p-2.5 text-xs text-white shadow-xl border border-ink-800 animate-in fade-in zoom-in-95 pointer-events-none">
                    {tooltip}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-400">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white tracking-tight truncate" title={value}>
            {value}
          </p>
          {changeLabel && change !== null && change !== undefined && (
            <p className="mt-0.5 text-[11px] text-ink-400 dark:text-ink-500 truncate">{changeLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

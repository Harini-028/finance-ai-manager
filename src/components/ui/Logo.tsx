import { motion } from 'framer-motion';
import { cn } from '../../lib/format';

type LogoProps = { className?: string; showText?: boolean; size?: 'sm' | 'md' | 'lg' };

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const dims = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-12 w-12' }[size];
  const textSize = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <motion.div
        initial={{ rotate: -10, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={cn('relative rounded-xl gradient-brand shadow-glow flex items-center justify-center', dims)}
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 fill-white">
          <path d="M12 4l-5 9h3l-1 7 5-9h-3l1-7z" />
        </svg>
      </motion.div>
      {showText && (
        <span className={cn('font-display font-bold tracking-tight text-ink-900 dark:text-white', textSize)}>
          FinPilot<span className="gradient-text"> AI</span>
        </span>
      )}
    </div>
  );
}

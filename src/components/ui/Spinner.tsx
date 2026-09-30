import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/format';

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 className={cn('animate-spin text-brand-500', className)} style={{ width: size, height: size }} />;
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-50 dark:bg-ink-950">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
            <path d="M12 4l-5 9h3l-1 7 5-9h-3l1-7z" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-2xl gradient-brand blur-xl opacity-40 animate-pulse-slow" />
      </div>
      <div className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
        <Spinner size={16} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

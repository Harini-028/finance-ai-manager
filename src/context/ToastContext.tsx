import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type Toast = { id: string; type: ToastType; message: string };

type ToastContextValue = { notify: (type: ToastType, message: string) => void };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const config: Record<ToastType, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-brand-600 dark:text-brand-400', bg: 'border-brand-500/30' },
  error: { icon: XCircle, color: 'text-error-600 dark:text-error-400', bg: 'border-error-500/30' },
  warning: { icon: AlertCircle, color: 'text-warning-600 dark:text-warning-400', bg: 'border-warning-500/30' },
  info: { icon: Info, color: 'text-accent-600 dark:text-accent-400', bg: 'border-accent-500/30' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, color, bg } = config[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className={`pointer-events-auto glass-card flex items-start gap-3 px-4 py-3.5 pr-3 max-w-sm ${bg}`}
              >
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} />
                <p className="text-sm text-ink-800 dark:text-ink-100 flex-1 leading-snug">{t.message}</p>
                <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-ink-700 dark:hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

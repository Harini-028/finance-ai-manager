import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X, ArrowRight, ShieldCheck,
} from 'lucide-react';

export type SmartAlert = {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  category: string;
  title: string;
  message: string;
  actionLink?: string;
};

type SmartAlertsSectionProps = {
  alerts: SmartAlert[];
};

export function SmartAlertsSection({ alerts }: SmartAlertsSectionProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  const alertStyles = {
    danger: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/5',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      icon: Info,
      iconColor: 'text-blue-500',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  };

  return (
    <div className="card p-6 border border-ink-100 dark:border-ink-800/80 bg-white dark:bg-ink-900 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-ink-900 dark:text-white">
              Smart Financial Alerts
            </h3>
            <p className="text-xs text-ink-400">Real-time alerts triggered by your spending rules</p>
          </div>
        </div>
        {visibleAlerts.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {visibleAlerts.length} Active
          </span>
        )}
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              All Clear! No budget overruns, unusual spikes, or urgent payments detected.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {visibleAlerts.map((alert) => {
            const style = alertStyles[alert.type] || alertStyles.info;
            const IconComponent = style.icon;

            return (
              <div
                key={alert.id}
                className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border ${style.border} ${style.bg} transition-all`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <IconComponent className={`h-4 w-4 shrink-0 mt-0.5 ${style.iconColor}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-ink-900 dark:text-white">{alert.title}</p>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${style.badge}`}>
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 dark:text-ink-300 mt-1 leading-snug">
                      {alert.message}
                    </p>
                    {alert.actionLink && (
                      <Link
                        to={alert.actionLink}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline mt-1.5"
                      >
                        Take Action <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismiss(alert.id)}
                  className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 p-1 rounded-lg transition-colors shrink-0"
                  title="Dismiss alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

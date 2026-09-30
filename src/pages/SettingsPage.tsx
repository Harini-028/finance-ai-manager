import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun, Moon, DollarSign, Globe, Bell, Shield, Check, Save, Monitor, Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { currencies, languages } from '../lib/constants';
import { cn } from '../lib/format';

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { notify } = useToast();

  const [currency, setCurrency] = useState(profile?.currency ?? 'USD');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [notifyBudget, setNotifyBudget] = useState(profile?.notify_budget ?? true);
  const [notifyTransactions, setNotifyTransactions] = useState(profile?.notify_transactions ?? true);
  const [notifyInsights, setNotifyInsights] = useState(profile?.notify_insights ?? true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      currency,
      language,
      notify_budget: notifyBudget,
      notify_transactions: notifyTransactions,
      notify_insights: notifyInsights,
    });
    setSaving(false);
    if (error) { notify('error', error); return; }
    notify('success', 'Settings saved');
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'gradient-brand' : 'bg-ink-200 dark:bg-ink-700')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow', checked ? 'left-[22px]' : 'left-0.5')}
      />
    </button>
  );

  const settingCards = [
    {
      icon: DollarSign, title: 'Currency', desc: 'Choose your preferred currency for all amounts',
      content: (
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field mt-3">
          {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.label} ({c.symbol})</option>)}
        </select>
      ),
    },
    {
      icon: Globe, title: 'Language', desc: 'Select your interface language',
      content: (
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field mt-3">
          {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Customize your FinPilot AI experience</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
          {saving ? <Spinner size={16} className="text-white" /> : <><Save className="h-4 w-4" /> Save Settings</>}
        </button>
      </div>

      {/* Appearance / Theme */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="h-5 w-5 text-ink-400" />
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Appearance</h2>
        </div>
        <p className="text-xs text-ink-400 mb-5">Choose how FinPilot AI looks to you</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {([
            { key: 'light', label: 'Light', icon: Sun },
            { key: 'dark', label: 'Dark', icon: Moon },
            { key: 'system', label: 'System', icon: Monitor },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setThemeMode(opt.key)}
              className={cn(
                'relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all',
                themeMode === opt.key ? 'border-brand-500 bg-brand-500/5' : 'border-ink-100 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-600',
              )}
            >
              <opt.icon className="h-5 w-5 text-ink-500 dark:text-ink-400" />
              <span className="font-medium text-ink-900 dark:text-white">{opt.label}</span>
              {themeMode === opt.key && <Check className="h-4 w-4 text-brand-500 ml-auto" />}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Currency & Language */}
      <div className="grid sm:grid-cols-2 gap-6">
        {settingCards.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-6">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-5 w-5 text-ink-400" />
              <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">{s.title}</h2>
            </div>
            <p className="text-xs text-ink-400">{s.desc}</p>
            {s.content}
          </motion.div>
        ))}
      </div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-5 w-5 text-ink-400" />
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Notifications</h2>
        </div>
        <p className="text-xs text-ink-400 mb-5">Control what alerts you receive</p>
        <div className="space-y-4">
          {[
            { label: 'Budget alerts', desc: 'Get notified when you approach or exceed budget limits', value: notifyBudget, set: setNotifyBudget },
            { label: 'Transaction alerts', desc: 'Notifications for new transactions and unusual spending', value: notifyTransactions, set: setNotifyTransactions },
            { label: 'AI insights', desc: 'Weekly AI-generated financial insights and recommendations', value: notifyInsights, set: setNotifyInsights },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-white">{n.label}</p>
                <p className="text-xs text-ink-400">{n.desc}</p>
              </div>
              <Toggle checked={n.value} onChange={n.set} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-ink-400" />
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Security</h2>
        </div>
        <p className="text-xs text-ink-400 mb-5">Protect your account with additional security measures</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-white">Two-factor authentication</p>
              <p className="text-xs text-ink-400">Add an extra layer of security to your account</p>
            </div>
            <Toggle checked={twoFactor} onChange={(v) => { setTwoFactor(v); notify(v ? 'info' : 'info', v ? '2FA enabled (demo)' : '2FA disabled (demo)'); }} />
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-white">Login alerts</p>
              <p className="text-xs text-ink-400">Get notified of new sign-ins to your account</p>
            </div>
            <Toggle checked={true} onChange={() => notify('info', 'Login alerts are always on for security')} />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 mt-2">
            <Smartphone className="h-5 w-5 text-ink-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900 dark:text-white">Active sessions</p>
              <p className="text-xs text-ink-400">You're currently signed in on this device</p>
            </div>
            <span className="badge bg-brand-500/10 text-brand-600 dark:text-brand-400">Active</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

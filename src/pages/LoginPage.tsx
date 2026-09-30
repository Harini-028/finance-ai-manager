import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      notify('error', error);
    } else {
      notify('success', 'Welcome back!');
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/app';
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your FinPilot AI account to continue.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field pl-11"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pl-11 pr-11"
            />
            <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
          <span className="text-sm text-ink-600 dark:text-ink-400">Remember me for 30 days</span>
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base disabled:opacity-60">
          {loading ? <Spinner size={18} className="text-white" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 rounded-xl bg-ink-100 dark:bg-ink-800/50 p-3.5 text-xs text-ink-500 dark:text-ink-400">
        <p className="font-medium text-ink-600 dark:text-ink-300 mb-1">Demo tip</p>
        Create a free account below — no credit card needed. Your profile is auto-created on signup.
      </motion.div>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">Create one free</Link>
      </p>
    </AuthLayout>
  );
}

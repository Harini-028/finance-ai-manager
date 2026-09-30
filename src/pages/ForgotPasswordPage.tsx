import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) {
      notify('error', error.message);
    } else {
      setSent(true);
      notify('success', 'Password reset link sent to your email.');
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a secure link to reset your password.">
      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand text-white shadow-glow mb-5">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-ink-900 dark:text-white">Check your inbox</h3>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            We've sent a password reset link to <span className="font-semibold text-ink-700 dark:text-ink-200">{email}</span>. The link expires in 1 hour.
          </p>
          <Link to="/login" className="mt-6 btn-secondary justify-center">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-11" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base disabled:opacity-60">
            {loading ? <Spinner size={18} className="text-white" /> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

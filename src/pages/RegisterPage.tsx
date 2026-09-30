import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwStrength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-error-500', 'bg-error-500', 'bg-warning-500', 'bg-brand-500', 'bg-brand-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    if (password.length < 6) { notify('warning', 'Password must be at least 6 characters'); return; }
    if (!agreed) { notify('warning', 'Please accept the terms to continue'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      notify('error', error);
    } else {
      notify('success', 'Account created! Welcome to FinPilot AI.');
      navigate('/app', { replace: true });
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start your journey to financial freedom — it's free.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Full name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="input-field pl-11" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-11" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field pl-11 pr-11" />
            <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < pwStrength ? strengthColors[pwStrength] : 'bg-ink-200 dark:bg-ink-700'}`} />
                ))}
              </div>
              <span className="text-xs text-ink-400 w-16">{strengthLabels[pwStrength]}</span>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 mt-0.5 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
          <span className="text-sm text-ink-600 dark:text-ink-400">
            I agree to the <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Terms</a> and <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</a>
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base disabled:opacity-60">
          {loading ? <Spinner size={18} className="text-white" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {['No credit card', 'Free forever', 'Secure'].map((t) => (
          <div key={t} className="flex items-center justify-center gap-1.5 rounded-lg bg-ink-100 dark:bg-ink-800/50 px-2 py-2 text-xs text-ink-500 dark:text-ink-400">
            <Check className="h-3 w-3 text-brand-500" /> {t}
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

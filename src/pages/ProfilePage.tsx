import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Briefcase, DollarSign, Target, Camera, Lock, Save, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import { supabase } from '../lib/supabase';
import { initials } from '../lib/format';
import { currencies } from '../lib/constants';

export default function ProfilePage() {
  const { profile, user, updateProfile, refreshProfile } = useAuth();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    occupation: profile?.occupation ?? '',
    monthly_income: profile?.monthly_income ? String(profile.monthly_income) : '',
    financial_goal: profile?.financial_goal ?? '',
    currency: profile?.currency ?? 'USD',
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({
      full_name: form.full_name,
      phone: form.phone,
      occupation: form.occupation,
      monthly_income: parseFloat(form.monthly_income) || 0,
      financial_goal: form.financial_goal,
      currency: form.currency,
    });
    setSaving(false);
    if (error) { notify('error', error); return; }
    notify('success', 'Profile updated successfully');
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { notify('warning', 'Image must be under 2MB'); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    setSaving(true);
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setSaving(false);
      notify('error', 'Could not upload image. Storage bucket may not be configured.');
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: profErr } = await updateProfile({ avatar_url: urlData.publicUrl });
    setSaving(false);
    if (profErr) { notify('error', profErr); return; }
    await refreshProfile();
    notify('success', 'Profile picture updated');
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new.length < 6) { notify('warning', 'New password must be at least 6 characters'); return; }
    if (pwForm.new !== pwForm.confirm) { notify('warning', 'Passwords do not match'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.new });
    setPwSaving(false);
    if (error) { notify('error', error.message); return; }
    setPwForm({ current: '', new: '', confirm: '' });
    notify('success', 'Password changed successfully');
  };

  const fields = [
    { key: 'full_name', label: 'Full name', icon: User, type: 'text', placeholder: 'Jane Doe' },
    { key: 'phone', label: 'Phone', icon: Phone, type: 'tel', placeholder: '+1 555 0123' },
    { key: 'occupation', label: 'Occupation', icon: Briefcase, type: 'text', placeholder: 'Software Engineer' },
    { key: 'monthly_income', label: 'Monthly income', icon: DollarSign, type: 'number', placeholder: '5000' },
    { key: 'financial_goal', label: 'Financial goal', icon: Target, type: 'text', placeholder: 'Save $50k for a home' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage your personal information and account security</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 text-center">
          <div className="relative inline-block">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="h-24 w-24 rounded-2xl object-cover shadow-card" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl gradient-brand text-white text-2xl font-bold shadow-glow">
                {initials(profile?.full_name || 'User')}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 shadow-card border border-ink-100 dark:border-ink-700 hover:text-brand-600 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink-900 dark:text-white">{profile?.full_name || 'User'}</h3>
          <p className="text-sm text-ink-400">{user?.email}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Free Plan member
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-left">
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-3">
              <p className="text-xs text-ink-400">Occupation</p>
              <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{profile?.occupation || 'Not set'}</p>
            </div>
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-3">
              <p className="text-xs text-ink-400">Currency</p>
              <p className="text-sm font-medium text-ink-900 dark:text-white">{profile?.currency || 'USD'}</p>
            </div>
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-3">
              <p className="text-xs text-ink-400">Member Since</p>
              <p className="text-sm font-medium text-ink-900 dark:text-white truncate">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
              </p>
            </div>
          </div>
          {saving && <div className="mt-3 flex justify-center"><Spinner size={16} /></div>}
        </motion.div>

        {/* Edit form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2 card p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white mb-1">Personal Information</h2>
          <p className="text-xs text-ink-400 mb-5">Update your profile details</p>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input type="email" value={user?.email ?? ''} disabled className="input-field pl-11 opacity-60 cursor-not-allowed" />
              </div>
            </div>
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="input-field pl-11"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Currency</label>
              <select value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} className="input-field">
                {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.label} ({c.symbol})</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center disabled:opacity-60">
              {saving ? <Spinner size={18} className="text-white" /> : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Change password */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-5 w-5 text-ink-400" />
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Change Password</h2>
        </div>
        <p className="text-xs text-ink-400 mb-5">Keep your account secure with a strong password</p>
        <form onSubmit={handlePassword} className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Current password</label>
            <input type="password" value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" className="input-field" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">New password</label>
            <input type="password" required value={pwForm.new} onChange={(e) => setPwForm((p) => ({ ...p, new: e.target.value }))} placeholder="••••••••" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">Confirm new password</label>
            <input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" className="input-field" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={pwSaving} className="btn-primary justify-center disabled:opacity-60">
              {pwSaving ? <Spinner size={18} className="text-white" /> : <><Lock className="h-4 w-4" /> Update Password</>}
            </button>
            <p className="mt-2 text-xs text-ink-400">Note: current password field is not required for this demo — Supabase updates directly.</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

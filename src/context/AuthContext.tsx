import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../services/api';
import type { Profile } from '../lib/supabase';

export type User = {
  id: string;
  _id: string;
  email: string;
  name?: string;
  full_name?: string;
  created_at?: string;
};

export type Session = {
  user: User;
  access_token: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        const uData = res.data.user;
        const mappedUser: User = {
          id: uData.id || uData._id,
          _id: uData._id || uData.id,
          email: uData.email,
          name: uData.name || uData.full_name,
          full_name: uData.name || uData.full_name,
        };
        const mappedProfile: Profile = {
          id: uData.id || uData._id,
          full_name: uData.name || uData.full_name || '',
          phone: uData.phone || '',
          occupation: uData.occupation || '',
          monthly_income: uData.monthly_income || 0,
          financial_goal: uData.financial_goal || '',
          avatar_url: uData.avatar_url || '',
          currency: uData.currency || 'USD',
          language: uData.language || 'en',
          notify_budget: uData.notify_budget !== undefined ? uData.notify_budget : true,
          notify_transactions: uData.notify_transactions !== undefined ? uData.notify_transactions : true,
          notify_insights: uData.notify_insights !== undefined ? uData.notify_insights : true,
          created_at: uData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(mappedUser);
        setProfile(mappedProfile);
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await api.post('/auth/register', {
        name: fullName,
        email,
        password,
      });

      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        const uData = res.data.user;
        const mappedUser: User = {
          id: uData.id || uData._id,
          _id: uData._id || uData.id,
          email: uData.email,
          name: uData.name || uData.full_name,
          full_name: uData.name || uData.full_name,
        };
        const mappedProfile: Profile = {
          id: uData.id || uData._id,
          full_name: uData.name || uData.full_name || '',
          phone: uData.phone || '',
          occupation: uData.occupation || '',
          monthly_income: uData.monthly_income || 0,
          financial_goal: uData.financial_goal || '',
          avatar_url: uData.avatar_url || '',
          currency: uData.currency || 'USD',
          language: uData.language || 'en',
          notify_budget: true,
          notify_transactions: true,
          notify_insights: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(mappedUser);
        setProfile(mappedProfile);
        return { error: null };
      }
      return { error: res.data.message || 'Registration failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      return { error: msg };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
      });

      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        const uData = res.data.user;
        const mappedUser: User = {
          id: uData.id || uData._id,
          _id: uData._id || uData.id,
          email: uData.email,
          name: uData.name || uData.full_name,
          full_name: uData.name || uData.full_name,
        };
        const mappedProfile: Profile = {
          id: uData.id || uData._id,
          full_name: uData.name || uData.full_name || '',
          phone: uData.phone || '',
          occupation: uData.occupation || '',
          monthly_income: uData.monthly_income || 0,
          financial_goal: uData.financial_goal || '',
          avatar_url: uData.avatar_url || '',
          currency: uData.currency || 'USD',
          language: uData.language || 'en',
          notify_budget: uData.notify_budget !== undefined ? uData.notify_budget : true,
          notify_transactions: uData.notify_transactions !== undefined ? uData.notify_transactions : true,
          notify_insights: uData.notify_insights !== undefined ? uData.notify_insights : true,
          created_at: uData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(mappedUser);
        setProfile(mappedProfile);
        return { error: null };
      }
      return { error: res.data.message || 'Login failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      return { error: msg };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const res = await api.put('/auth/profile', updates);
      if (res.data.success && res.data.user) {
        const uData = res.data.user;
        setProfile((prev) => (prev ? { ...prev, ...updates, full_name: uData.name || uData.full_name || prev.full_name } : null));
        setUser((prev) => (prev ? { ...prev, name: uData.name || uData.full_name || prev.name } : null));
        return { error: null };
      }
      return { error: res.data.message || 'Update failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      return { error: msg };
    }
  };

  const token = localStorage.getItem('token');
  const session: Session | null = user && token ? { user, access_token: token } : null;

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signUp, signIn, signOut, refreshProfile, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

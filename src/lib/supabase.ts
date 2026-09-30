// Local storage mock implementation of Supabase
// to run the app without backend dependencies/credentials

import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

export type Transaction = {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  month: string;
  created_at: string;
};

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  occupation: string;
  monthly_income: number;
  financial_goal: string;
  avatar_url: string;
  currency: string;
  language: string;
  notify_budget: boolean;
  notify_transactions: boolean;
  notify_insights: boolean;
  created_at: string;
  updated_at: string;
};

export type AiMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf' | 'bond';
  shares: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  created_at: string;
};

export type RecurringTransaction = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  next_due: string;
  active: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'budget' | 'insight' | 'tip' | 'alert' | 'achievement';
  read: boolean;
  created_at: string;
};

// Database Query Builder Mock
class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAscending: boolean = true;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getData() {
    const data = localStorage.getItem(`sb_${this.tableName}`);
    return data ? JSON.parse(data) : this.getDefaultData();
  }

  private saveData(data: any[]) {
    localStorage.setItem(`sb_${this.tableName}`, JSON.stringify(data));
  }

  private getDefaultData(): any[] {
    if (this.tableName === 'profiles') {
      return [
        {
          id: 'demo-user-id',
          full_name: 'Demo User',
          phone: '',
          occupation: 'Financial Enthusiast',
          monthly_income: 5000,
          financial_goal: 'Save for a new home',
          avatar_url: '',
          currency: 'USD',
          language: 'en',
          notify_budget: true,
          notify_transactions: true,
          notify_insights: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
    }
    if (this.tableName === 'transactions') {
      // Set some cool initial mock transactions
      return [
        {
          id: 'tx-1',
          user_id: 'demo-user-id',
          type: 'income',
          amount: 5000,
          category: 'Salary',
          description: 'Monthly Salary',
          date: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-2',
          user_id: 'demo-user-id',
          type: 'expense',
          amount: 1200,
          category: 'Housing',
          description: 'Rent payment',
          date: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-3',
          user_id: 'demo-user-id',
          type: 'expense',
          amount: 150,
          category: 'Food',
          description: 'Groceries',
          date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // yesterday
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-4',
          user_id: 'demo-user-id',
          type: 'expense',
          amount: 80,
          category: 'Transportation',
          description: 'Gas',
          date: new Date(Date.now() - 172800000).toISOString().slice(0, 10), // 2 days ago
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-5',
          user_id: 'demo-user-id',
          type: 'expense',
          amount: 200,
          category: 'Entertainment',
          description: 'Concert ticket',
          date: new Date(Date.now() - 259200000).toISOString().slice(0, 10), // 3 days ago
          created_at: new Date().toISOString()
        }
      ];
    }
    if (this.tableName === 'budgets') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return [
        {
          id: 'b-1',
          user_id: 'demo-user-id',
          category: 'Housing',
          amount: 1500,
          period: 'monthly',
          month: currentMonth,
          created_at: new Date().toISOString()
        },
        {
          id: 'b-2',
          user_id: 'demo-user-id',
          category: 'Food',
          amount: 500,
          period: 'monthly',
          month: currentMonth,
          created_at: new Date().toISOString()
        },
        {
          id: 'b-3',
          user_id: 'demo-user-id',
          category: 'Transportation',
          amount: 300,
          period: 'monthly',
          month: currentMonth,
          created_at: new Date().toISOString()
        }
      ];
    }
    if (this.tableName === 'savings_goals') {
      return [
        {
          id: 'g-1',
          user_id: 'demo-user-id',
          name: 'Emergency Fund',
          target_amount: 10000,
          current_amount: 3500,
          target_date: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        },
        {
          id: 'g-2',
          user_id: 'demo-user-id',
          name: 'Dream Vacation',
          target_amount: 5000,
          current_amount: 1200,
          target_date: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        },
        {
          id: 'g-3',
          user_id: 'demo-user-id',
          name: 'New MacBook Pro',
          target_amount: 3000,
          current_amount: 2400,
          target_date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
          created_at: new Date().toISOString()
        }
      ];
    }
    if (this.tableName === 'investments') {
      return [
        { id: 'inv-1', user_id: 'demo-user-id', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', shares: 10, purchase_price: 150, current_price: 189.5, purchase_date: '2024-01-15', created_at: new Date().toISOString() },
        { id: 'inv-2', user_id: 'demo-user-id', symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', shares: 5, purchase_price: 350, current_price: 415.2, purchase_date: '2024-02-01', created_at: new Date().toISOString() },
        { id: 'inv-3', user_id: 'demo-user-id', symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', shares: 8, purchase_price: 140, current_price: 168.7, purchase_date: '2024-03-10', created_at: new Date().toISOString() },
        { id: 'inv-4', user_id: 'demo-user-id', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', shares: 0.25, purchase_price: 42000, current_price: 67500, purchase_date: '2024-01-01', created_at: new Date().toISOString() },
        { id: 'inv-5', user_id: 'demo-user-id', symbol: 'ETH', name: 'Ethereum', type: 'crypto', shares: 2, purchase_price: 2200, current_price: 3800, purchase_date: '2024-02-14', created_at: new Date().toISOString() },
      ];
    }
    if (this.tableName === 'recurring_transactions') {
      const today = new Date();
      const nextMonth = (d: number) => new Date(today.getFullYear(), today.getMonth() + 1, d).toISOString().slice(0, 10);
      const thisMonth = (d: number) => new Date(today.getFullYear(), today.getMonth(), d).toISOString().slice(0, 10);
      return [
        { id: 'rt-1', user_id: 'demo-user-id', title: 'Monthly Salary', amount: 5000, type: 'income', category: 'Salary', frequency: 'monthly', next_due: nextMonth(1), active: true, created_at: new Date().toISOString() },
        { id: 'rt-2', user_id: 'demo-user-id', title: 'Rent Payment', amount: 1200, type: 'expense', category: 'Housing', frequency: 'monthly', next_due: nextMonth(1), active: true, created_at: new Date().toISOString() },
        { id: 'rt-3', user_id: 'demo-user-id', title: 'Netflix', amount: 15.99, type: 'expense', category: 'Entertainment', frequency: 'monthly', next_due: thisMonth(22), active: true, created_at: new Date().toISOString() },
        { id: 'rt-4', user_id: 'demo-user-id', title: 'Spotify Premium', amount: 9.99, type: 'expense', category: 'Entertainment', frequency: 'monthly', next_due: thisMonth(18), active: true, created_at: new Date().toISOString() },
        { id: 'rt-5', user_id: 'demo-user-id', title: 'Gym Membership', amount: 49.99, type: 'expense', category: 'Fitness', frequency: 'monthly', next_due: nextMonth(5), active: true, created_at: new Date().toISOString() },
        { id: 'rt-6', user_id: 'demo-user-id', title: 'Internet Bill', amount: 89, type: 'expense', category: 'Utilities', frequency: 'monthly', next_due: thisMonth(25), active: true, created_at: new Date().toISOString() },
        { id: 'rt-7', user_id: 'demo-user-id', title: 'Freelance Income', amount: 800, type: 'income', category: 'Freelance', frequency: 'weekly', next_due: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), active: true, created_at: new Date().toISOString() },
        { id: 'rt-8', user_id: 'demo-user-id', title: 'Car Insurance', amount: 120, type: 'expense', category: 'Transport', frequency: 'monthly', next_due: nextMonth(10), active: true, created_at: new Date().toISOString() },
      ];
    }
    if (this.tableName === 'notifications') {
      return [
        { id: 'n-1', user_id: 'demo-user-id', title: '🎉 Welcome to FinPilot AI!', message: 'Your account is set up. Start by adding your first transaction or exploring the dashboard.', type: 'tip', read: false, created_at: new Date().toISOString() },
        { id: 'n-2', user_id: 'demo-user-id', title: '⚠️ Budget Alert: Entertainment', message: 'You have reached 120% of your Entertainment budget this month. Consider reducing spending.', type: 'budget', read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'n-3', user_id: 'demo-user-id', title: '💡 AI Insight: Dining Trend', message: 'Your food spending increased 28% vs last month. Meal prepping could save you ~$120/month.', type: 'insight', read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 'n-4', user_id: 'demo-user-id', title: '🏆 Achievement Unlocked!', message: 'You stayed within budget for 3 consecutive categories this month. Keep it up!', type: 'achievement', read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'n-5', user_id: 'demo-user-id', title: '📅 Upcoming Bill: Netflix', message: 'Netflix ($15.99) is due in 3 days on the 22nd.', type: 'alert', read: false, created_at: new Date(Date.now() - 10800000).toISOString() },
        { id: 'n-6', user_id: 'demo-user-id', title: '💡 Tip: Start an Emergency Fund', message: 'Financial experts recommend 3-6 months of expenses saved. You currently have $3,500 — you\'re 35% there!', type: 'tip', read: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'n-7', user_id: 'demo-user-id', title: '📈 Portfolio Update', message: 'Your investment portfolio gained $420.50 (2.1%) today. AAPL led with +3.2%.', type: 'insight', read: false, created_at: new Date(Date.now() - 14400000).toISOString() },
        { id: 'n-8', user_id: 'demo-user-id', title: '🎯 Goal Progress: MacBook Pro', message: 'You\'re 80% of the way to your MacBook Pro goal! Only $600 more to go.', type: 'achievement', read: true, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: 'n-9', user_id: 'demo-user-id', title: '⚠️ Unusual Spending Detected', message: 'We noticed $200 spent on Entertainment in a single day — significantly above your average.', type: 'alert', read: false, created_at: new Date(Date.now() - 18000000).toISOString() },
        { id: 'n-10', user_id: 'demo-user-id', title: '💡 Savings Rate Insight', message: 'Your savings rate is 24% this month — above the recommended 20%. You\'re doing great!', type: 'insight', read: true, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      ];
    }
    return [];
  }

  select(_columns?: string) {
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAscending = ascending;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  async maybeSingle() {
    let list = this.getData();
    for (const filter of this.filters) {
      list = list.filter(filter);
    }
    const item = list.length > 0 ? list[0] : null;
    return { data: item, error: null };
  }

  async then(onfulfilled?: (value: any) => any) {
    let list = this.getData();
    for (const filter of this.filters) {
      list = list.filter(filter);
    }
    if (this.orderCol) {
      list.sort((a: any, b: any) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }
    const res = { data: list, error: null };
    return onfulfilled ? onfulfilled(res) : res;
  }

  async insert(payload: any) {
    const list = this.getData();
    const items = Array.isArray(payload) ? payload : [payload];
    const newItems = items.map((item) => ({
      id: Math.random().toString(36).substring(2, 11),
      user_id: 'demo-user-id',
      created_at: new Date().toISOString(),
      ...item,
    }));
    list.push(...newItems);
    this.saveData(list);
    return { data: Array.isArray(payload) ? newItems : newItems[0], error: null };
  }

  async update(updates: any) {
    let list = this.getData();
    const indicesToUpdate: number[] = [];
    list.forEach((item: any, index: number) => {
      let match = true;
      for (const filter of this.filters) {
        if (!filter(item)) {
          match = false;
          break;
        }
      }
      if (match) {
        indicesToUpdate.push(index);
      }
    });

    indicesToUpdate.forEach((idx) => {
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    });
    this.saveData(list);

    const updatedData = indicesToUpdate.map(idx => list[idx]);

    const chainResult = {
      select: () => ({
        maybeSingle: async () => ({ data: updatedData[0] || null, error: null }),
        then: async (onfulfilled?: any) => {
          const res = { data: updatedData, error: null };
          return onfulfilled ? onfulfilled(res) : res;
        }
      }),
      then: async (onfulfilled?: any) => {
        const res = { data: updatedData, error: null };
        return onfulfilled ? onfulfilled(res) : res;
      }
    };
    return chainResult as any;
  }

  async upsert(payload: any) {
    let list = this.getData();
    const items = Array.isArray(payload) ? payload : [payload];
    const upserted: any[] = [];
    items.forEach((item) => {
      const id = item.id || 'demo-user-id';
      const existingIdx = list.findIndex((existingItem: any) => existingItem.id === id);
      if (existingIdx !== -1) {
        list[existingIdx] = { ...list[existingIdx], ...item, updated_at: new Date().toISOString() };
        upserted.push(list[existingIdx]);
      } else {
        const newItem = {
          id: item.id || Math.random().toString(36).substring(2, 11),
          user_id: 'demo-user-id',
          created_at: new Date().toISOString(),
          ...item,
        };
        list.push(newItem);
        upserted.push(newItem);
      }
    });
    this.saveData(list);
    return { data: Array.isArray(payload) ? upserted : upserted[0], error: null };
  }

  async delete() {
    let list = this.getData();
    list = list.filter((item: any) => {
      let match = true;
      for (const filter of this.filters) {
        if (!filter(item)) {
          match = false;
          break;
        }
      }
      return !match;
    });
    this.saveData(list);
    return { data: null, error: null };
  }
}

// Authentication listeners
const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>();

const getSessionData = (): { session: Session | null } => {
  const sessionStr = localStorage.getItem('sb_session');
  if (sessionStr) {
    try {
      return JSON.parse(sessionStr);
    } catch (e) {}
  }
  // Pre-authenticated demo session
  const defaultSession = {
    session: {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      user: {
        id: 'demo-user-id',
        email: 'demo@example.com',
        app_metadata: {},
        user_metadata: { full_name: 'Demo User' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as User
    } as Session
  };
  localStorage.setItem('sb_session', JSON.stringify(defaultSession));
  return defaultSession;
};

const mockAuth = {
  getSession: async (): Promise<{ data: { session: Session | null }; error: null }> => {
    return { data: getSessionData(), error: null };
  },
  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    listeners.add(callback);
    const currentSession = getSessionData();
    // Call immediately in next microtask to let the component mount and prevent react warnings
    setTimeout(() => {
      if (listeners.has(callback)) {
        callback('SIGNED_IN', currentSession.session);
      }
    }, 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          }
        }
      }
    };
  },
  signUp: async ({ email, password, options }: any): Promise<{ data: { user: User | null }; error: { message: string } | null }> => {
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    if (users.some((u: any) => u.email === email)) {
      return { data: { user: null }, error: { message: 'User already exists' } };
    }
    const userId = Math.random().toString(36).substring(2, 11);
    const user = {
      id: userId,
      email,
      user_metadata: options?.data || {},
      created_at: new Date().toISOString()
    } as unknown as User;
    users.push({ ...user, password });
    localStorage.setItem('sb_users', JSON.stringify(users));

    const newSession = {
      session: {
        access_token: 'token_' + userId,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'refresh_' + userId,
        user
      } as Session
    };
    localStorage.setItem('sb_session', JSON.stringify(newSession));
    listeners.forEach(cb => cb('SIGNED_IN', newSession.session));
    return { data: { user }, error: null };
  },
  signInWithPassword: async ({ email, password }: any): Promise<{ data: { session: Session | null; user: User | null }; error: { message: string } | null }> => {
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    let user = users.find((u: any) => u.email === email && u.password === password);
    if (!user && email === 'demo@example.com') {
      user = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        user_metadata: { full_name: 'Demo User' },
        created_at: new Date().toISOString()
      };
    }
    if (!user) {
      return { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } };
    }

    const castedUser = user as unknown as User;

    const newSession = {
      session: {
        access_token: 'token_' + user.id,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'refresh_' + user.id,
        user: castedUser
      } as Session
    };
    localStorage.setItem('sb_session', JSON.stringify(newSession));
    listeners.forEach(cb => cb('SIGNED_IN', newSession.session));
    return { data: { session: newSession.session, user: castedUser }, error: null };
  },
  signOut: async (): Promise<{ error: null }> => {
    localStorage.removeItem('sb_session');
    listeners.forEach(cb => cb('SIGNED_OUT', null));
    return { error: null };
  },
  updateUser: async ({ password }: any): Promise<{ data: { user: User | null }; error: { message: string } | null }> => {
    const session = getSessionData();
    if (session?.session?.user) {
      const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
      const userIdx = users.findIndex((u: any) => u.id === session.session!.user.id);
      if (userIdx !== -1) {
        users[userIdx].password = password;
        localStorage.setItem('sb_users', JSON.stringify(users));
      }
      return { data: { user: session.session.user }, error: null };
    }
    return { data: { user: null }, error: { message: 'No session' } };
  },
  resetPasswordForEmail: async (_email: string, _options?: any): Promise<{ data: any; error: { message: string } | null }> => {
    return { data: {}, error: null };
  }
};

const mockStorage = {
  from: (bucketName: string) => ({
    upload: async (path: string, file: File, _options?: any) => {
      const reader = new FileReader();
      const promise = new Promise<{ data: { path: string }, error: null }>((resolve) => {
        reader.onloadend = () => {
          localStorage.setItem(`sb_storage_${bucketName}_${path}`, reader.result as string);
          resolve({ data: { path }, error: null });
        };
      });
      reader.readAsDataURL(file);
      return promise;
    },
    getPublicUrl: (path: string) => {
      const dataUrl = localStorage.getItem(`sb_storage_${bucketName}_${path}`);
      const url = dataUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${path}`;
      return { data: { publicUrl: url } };
    }
  })
};

// Export the mock Supabase client
export const supabase = {
  from: (tableName: string) => new MockQueryBuilder(tableName) as any,
  auth: mockAuth,
  storage: mockStorage as any
};

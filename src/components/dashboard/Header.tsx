import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Sun, Moon, ChevronDown, Settings, User, LogOut, CheckCheck, Trash2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useDashboardData } from '../../hooks/useDashboardData';
import { cn, initials, formatCurrency } from '../../lib/format';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { transactions, budgets, goals } = useDashboardData();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (profile?.full_name || 'there').split(' ')[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();

    const matchedTx = transactions
      .filter((t) => t.category.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      .slice(0, 4)
      .map((t) => ({ type: 'Transaction', title: t.description || t.category, sub: `${t.type === 'income' ? '+' : '-'}${t.amount}`, link: '/app/transactions' }));

    const matchedBudgets = budgets
      .filter((b) => b.category.toLowerCase().includes(q))
      .slice(0, 3)
      .map((b) => ({ type: 'Budget', title: `${b.category} Budget`, sub: `Limit: ${b.amount}`, link: '/app/budget' }));

    const matchedGoals = goals
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((g) => ({ type: 'Goal', title: g.name, sub: `Target: ${g.target_amount}`, link: '/app/goals' }));

    return [...matchedTx, ...matchedBudgets, ...matchedGoals];
  }, [searchQuery, transactions, budgets, goals]);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-ink-100 dark:border-ink-800 bg-white/80 dark:bg-ink-900/80 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <div className="hidden sm:block">
          <p className="text-sm text-ink-400">{greeting},</p>
          <p className="font-display font-semibold text-ink-900 dark:text-white leading-tight">{firstName}</p>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-auto hidden md:block relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search transactions, categories, goals…"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/50 pl-10 pr-4 py-2 text-sm text-ink-900 dark:text-white placeholder-ink-400 transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none"
            />
          </div>

          <AnimatePresence>
            {searchOpen && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute left-0 right-0 mt-2 card p-2 z-50 max-h-80 overflow-y-auto shadow-card"
              >
                {searchResults.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-center text-ink-400">No matching results found</p>
                ) : (
                  searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        navigate(item.link);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-900 dark:text-white">{item.title}</p>
                        <span className="text-[10px] text-brand-500 font-semibold uppercase tracking-wider">{item.type}</span>
                      </div>
                      <span className="text-xs text-ink-400">{item.sub}</span>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <Sun className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Moon className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Notification Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((p) => !p)}
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-brand-500 ring-2 ring-white dark:ring-ink-900" />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 mt-2 w-80 card p-2 z-50 max-h-96 flex flex-col shadow-card"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-ink-100 dark:border-ink-800">
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                      Notifications ({unreadCount} new)
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-brand-500 hover:underline flex items-center gap-1 font-medium"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1 divide-y divide-ink-50 dark:divide-ink-800/40 my-1">
                    {notifications.length === 0 ? (
                      <p className="px-3 py-6 text-xs text-center text-ink-400">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors',
                            !n.read ? 'bg-brand-500/5' : 'hover:bg-ink-50 dark:hover:bg-ink-800'
                          )}
                        >
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => markAsRead(n.id)}>
                            <p className={cn('text-xs font-semibold', !n.read ? 'text-brand-600 dark:text-brand-400' : 'text-ink-800 dark:text-white')}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 leading-snug">{n.message}</p>
                          </div>
                          <button onClick={() => deleteNotification(n.id)} className="text-ink-400 hover:text-error-500 p-1">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-white text-xs font-bold">
                {initials(profile?.full_name || 'User')}
              </div>
              <ChevronDown className="h-4 w-4 text-ink-400 hidden sm:block" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 mt-2 w-56 card p-2 z-50"
                >
                  <div className="px-3 py-2.5 border-b border-ink-100 dark:border-ink-800 mb-1">
                    <p className="text-sm font-semibold text-ink-800 dark:text-white truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-ink-400 truncate">Free Plan member</p>
                  </div>
                  {[
                    { label: 'Profile', icon: User, to: '/app/profile' },
                    { label: 'Settings', icon: Settings, to: '/app/settings' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.to); setMenuOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-ink-100 dark:border-ink-800" />
                  <button
                    onClick={async () => { await signOut(); navigate('/'); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

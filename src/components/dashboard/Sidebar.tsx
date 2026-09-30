import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import { dashboardNav } from '../../lib/constants';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { cn, initials } from '../../lib/format';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100 dark:border-ink-800">
        <Logo size="sm" />
        <button onClick={onClose} className="lg:hidden text-ink-400 hover:text-ink-700 dark:hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {dashboardNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-white shadow-soft'
                  : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white',
              )
            }
            style={({ isActive }) => (isActive ? { backgroundImage: 'linear-gradient(135deg, #19b97e 0%, #0d9a66 100%)' } : undefined)}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-xl gradient-brand -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-100 dark:border-ink-800 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-white text-xs font-bold shrink-0">
            {initials(profile?.full_name || 'User')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-800 dark:text-white">{profile?.full_name || 'User'}</p>
            <p className="truncate text-xs text-ink-400">{profile?.id ? 'Free Plan' : ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-error-600 dark:text-error-400 transition-all duration-200 hover:bg-error-500/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-screen w-64 bg-white dark:bg-ink-900 lg:hidden"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

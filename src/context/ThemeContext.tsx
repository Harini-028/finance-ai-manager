import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

type ThemeContextValue = {
  themeMode: ThemeMode;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setThemeMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('finpilot-theme-mode') as ThemeMode | null;
    return saved || 'dark';
  });

  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const applyTheme = () => {
      let isDark = true;
      if (themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = themeMode === 'dark';
      }

      const root = document.documentElement;
      root.classList.toggle('dark', isDark);
      setActiveTheme(isDark ? 'dark' : 'light');
      localStorage.setItem('finpilot-theme-mode', themeMode);
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (m: ThemeMode) => setThemeModeState(m);

  return (
    <ThemeContext.Provider value={{ themeMode, theme: activeTheme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

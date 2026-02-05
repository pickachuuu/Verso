import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

// Get initial theme from system or storage
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('theme-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme === 'light' || parsed.state?.theme === 'dark') {
        return parsed.state.theme;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Fallback to legacy storage or system preference
  const legacy = localStorage.getItem('theme');
  if (legacy === 'light' || legacy === 'dark') {
    return legacy;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set, get) => ({
      theme: 'light', // Will be initialized on client

      setTheme: (theme) => {
        set({ theme });
        // Apply to DOM
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
          // Also update legacy storage for compatibility
          localStorage.setItem('theme', theme);
          // Dispatch custom event for other components
          window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(newTheme);
      },

      initializeTheme: () => {
        const theme = getInitialTheme();
        set({ theme });
        // Apply to DOM
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Subscribe to system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const stored = localStorage.getItem('theme-storage');
    // Only auto-switch if user hasn't manually set a preference
    if (!stored) {
      useThemeStore.getState().setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

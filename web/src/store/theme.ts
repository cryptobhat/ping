'use client';

import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setMode: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
      }
      return { isDark: next };
    }),
  setMode: (dark) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    }
    set({ isDark: dark });
  },
}));

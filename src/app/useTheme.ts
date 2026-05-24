import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'luck-today.theme';

function readStored(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : 'auto';
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => readStored());

  useEffect(() => {
    applyTheme(mode);
    if (typeof window === 'undefined') return;
    if (mode === 'auto') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  const cycle = useCallback(() => {
    setMode(prev => (prev === 'auto' ? 'light' : prev === 'light' ? 'dark' : 'auto'));
  }, []);

  return { mode, setMode, cycle };
}

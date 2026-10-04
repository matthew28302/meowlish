'use client';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'meowlish_theme';
const EVENT_NAME = 'meowlish-theme-changed';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getStoredTheme(): Theme | null {
  if (!isBrowser()) return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

export function getPreferredTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (isBrowser() && typeof window.matchMedia === 'function') {
    try {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {}
  }
  return 'light';
}

export function applyTheme(theme: Theme) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    root.style.colorScheme = theme;
  } catch {}
}

export function setTheme(theme: Theme) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  applyTheme(theme);
  try {
    window.dispatchEvent(new CustomEvent<Theme>(EVENT_NAME, { detail: theme }));
  } catch {}
}

export function initTheme(): Theme {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
}

export function subscribeTheme(listener: (theme: Theme) => void): () => void {
  if (!isBrowser()) return () => {};
  const onCustom = (e: Event) => {
    listener((e as CustomEvent<Theme>).detail);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
      applyTheme(e.newValue);
      listener(e.newValue);
    }
    // Tab khác xóa lựa chọn -> quay về light mặc định
    if (e.key === STORAGE_KEY && e.newValue === null) {
      applyTheme('light');
      listener('light');
    }
  };
  window.addEventListener(EVENT_NAME, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export const THEME_STORAGE_KEY = STORAGE_KEY;
export const THEME_EVENT_NAME = EVENT_NAME;

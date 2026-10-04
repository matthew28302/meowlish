'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { getPreferredTheme, setTheme, subscribeTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getPreferredTheme());
    setMounted(true);
    return subscribeTheme((t) => setThemeState(t));
  }, []);

  const toggle = () => {
    sound.playClick();
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    setTheme(next);
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={isDark}
      className={`w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center rounded-2xl border transition active:scale-95 cursor-pointer shadow-xs shrink-0 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-white/10'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
      } ${className}`}
    >
      {!mounted || !isDark ? (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  );
}

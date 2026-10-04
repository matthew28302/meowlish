import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPreferredTheme, getStoredTheme } from '@/lib/theme';

function setBrowserMock(opts: {
  stored?: string | null | 'throw';
  matchDark?: boolean;
  matchMediaMissing?: boolean;
} = {}) {
  const { stored = null, matchDark = false, matchMediaMissing = false } = opts;
  const store = new Map<string, string>();
  if (stored !== null && stored !== 'throw') store.set('meowlish_theme', stored);
  const getItem = stored === 'throw' ? () => { throw new Error('denied'); } : (k: string) => store.get(k) ?? null;
  const localStorage = {
    getItem: vi.fn(getItem),
    setItem: vi.fn((k: string, v: string) => { store.set(k, v); }),
    removeItem: vi.fn((k: string) => { store.delete(k); }),
  };
  const matchMedia = matchMediaMissing
    ? undefined
    : vi.fn(() => ({ matches: matchDark }));
  (globalThis as any).window = { localStorage, matchMedia };
  (globalThis as any).document = { documentElement: { classList: { add() {}, remove() {} }, style: {} } };
}

afterEach(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).document;
  vi.restoreAllMocks();
});

describe('theme utils (getPreferredTheme)', () => {
  it('returns light when not in a browser', () => {
    expect(getStoredTheme()).toBeNull();
    expect(getPreferredTheme()).toBe('light');
  });

  it('returns stored dark theme', () => {
    setBrowserMock({ stored: 'dark' });
    expect(getStoredTheme()).toBe('dark');
    expect(getPreferredTheme()).toBe('dark');
  });

  it('returns stored light theme', () => {
    setBrowserMock({ stored: 'light' });
    expect(getStoredTheme()).toBe('light');
    expect(getPreferredTheme()).toBe('light');
  });

  it('ignores invalid stored values and falls back to light', () => {
    setBrowserMock({ stored: 'blue', matchDark: false });
    expect(getStoredTheme()).toBeNull();
    expect(getPreferredTheme()).toBe('light');
  });

  it('follows OS dark preference when nothing stored', () => {
    setBrowserMock({ stored: null, matchDark: true });
    expect(getPreferredTheme()).toBe('dark');
  });

  it('follows OS light preference when nothing stored', () => {
    setBrowserMock({ stored: null, matchDark: false });
    expect(getPreferredTheme()).toBe('light');
  });

  it('falls back to light when matchMedia is unavailable', () => {
    setBrowserMock({ stored: null, matchMediaMissing: true });
    expect(getPreferredTheme()).toBe('light');
  });

  it('stored value wins over OS preference', () => {
    setBrowserMock({ stored: 'light', matchDark: true });
    expect(getPreferredTheme()).toBe('light');
    setBrowserMock({ stored: 'dark', matchDark: false });
    expect(getPreferredTheme()).toBe('dark');
  });

  it('survives localStorage throwing (privacy mode)', () => {
    setBrowserMock({ stored: 'throw', matchDark: false });
    expect(getStoredTheme()).toBeNull();
    expect(getPreferredTheme()).toBe('light');
  });
});

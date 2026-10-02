'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AccessTracker() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Tránh ghi log trùng lặp khi re-render cùng một URL
    if (lastLoggedPath.current === pathname) return;
    lastLoggedPath.current = pathname;

    // Không log request API hoặc static asset
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
      return;
    }

    let clientUserId: string | null = null;
    let clientUsername: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('meowlish_current_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          clientUserId = parsed?.id || null;
          clientUsername = parsed?.username || null;
        }
      } catch {}
    }

    try {
      fetch('/api/log/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathname,
          title: typeof document !== 'undefined' ? document.title : '',
          clientUserId,
          clientUsername,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  return null;
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

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

    // Gán danh thuộc cho phiên đăng nhập. Trước đây đọc thẳng key
    // 'meowlish_current_user' — key này KHÔNG chỗ nào trong repo ghi vào, nên
    // clientUserId/clientUsername LUÔN null ⇒ mọi dòng log vô danh (đo
    // 2026-10-09). Key thật do src/lib/auth.ts quản lý
    // ('english_for_me_user'); getCurrentUser() đọc đúng key đó và trả null
    // khi khách — đúng ý nghĩa (không bịa danh demo fallback).
    let clientUserId: string | null = null;
    let clientUsername: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const user = getCurrentUser();
        clientUserId = user?.id || null;
        clientUsername = user?.username || null;
      } catch {}
    }

    try {
      // Phía server có thể BỎ QUA clientUserId/clientUsername (không tin client
      // tự khai danh tính) và tự gán danh từ session/cookie. Gửi kèm 2 field
      // này chỉ là best-effort cho log cũ: `.catch(() => {})` + try/catch bảo đảm
      // tracker hỏng hoàn toàn im lặng, không chặn render trang (đo 2026-10-09).
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

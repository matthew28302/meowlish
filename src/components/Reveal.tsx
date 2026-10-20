'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Reveal — entrance animation khi phần tử vào viewport.
 *
 * - Dùng IntersectionObserver (không scroll listener, không re-render mỗi frame).
 * - Chỉ chạy MỘT lần: sau khi hiện, phần tử giữ nguyên style tĩnh.
 * - Tôn trọng prefers-reduced-motion: không animate, chỉ hiện nội dung.
 * - Dùng <div> luôn để tránh vấn đề ref type khi render thẻ khác nhau.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Độ trễ (ms) để tạo hiệu ứng so le nhiều phần tử. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

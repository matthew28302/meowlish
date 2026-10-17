'use client';

/**
 * Toast dùng chung toàn hệ thống (UX-008, vòng 3).
 *
 * VÌ SAO cần: trước đây các lỗi/thông báo gọi `alert()` gốc của trình duyệt.
 * `alert()` chặn toàn bộ luồng JS: người dùng không đọc được nội dung dài,
 * không tô đậm/đổi màu, và screen reader đọc nó rất khó. Ngoài ra mỗi trang lại
 * tự viết một `showToast` riêng (PetSocialHub, encyclopedia, duahau…) ⇒ 3 bản
 * UI khác nhau cho cùng một việc.
 *
 * Cách dùng:
 *   const toast = useToast();
 *   toast.success('Đã lưu!');
 *   toast.error('Không đủ Coins');
 *   toast.info('Đang xử lý…');
 *
 * Provider được mount 1 lần trong AppShell nên mọi trang đều dùng được mà
 * không phải bọc thêm provider ở từng page. `useToast()` ngoài provider trả về
 * hàm no-op để component không crash khi ai đó render ngoài AppShell.
 *
 * A11y:
 * - `role="alert"` cho lỗi (đọc ngay, interruptive), `role="status"` cho
 *   success/info (đọc khi rảnh tay) — đúng khuyến nghị WCAG live region.
 * - Vùng toast là `pointer-events: none` nên KHÔNG chặn thao tác phía sau; chỉ
 *   nút X mới nhận pointer.
 * - Đóng bằng Esc (đóng hết toast đang mở) và bằng cách bấm nút X.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  /** Gọi động kiểu `toast(kind, message)`. */
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Lỗi đọc lâu hơn thông báo thường (nhiều ký tự, cần đọc kỹ). */
const DURATION_MS: Record<ToastKind, number> = {
  success: 3200,
  info: 3600,
  error: 5200,
};

const MAX_VISIBLE = 4;

const noop: ToastApi = {
  success: () => {},
  error: () => {},
  info: () => {},
  push: () => {},
  dismiss: () => {},
};

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? noop;
}

const STYLES: Record<ToastKind, string> = {
  // emerald-700 / rose-700: trắng trên nền này 5.4:1 & 5.7:1 (đạt WCAG AA),
  // khác với emerald-500 cũ chỉ 2.47:1.
  success: 'bg-emerald-700 border-emerald-400 text-white',
  error: 'bg-rose-700 border-rose-400 text-white',
  info: 'bg-slate-800 border-slate-500 text-white',
};

const ICONS: Record<ToastKind, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  // Timer nằm trong ref vì effect dọn dẹp chạy 1 lần khi unmount; nếu để trong
  // state thì mỗi lần thêm toast lệch sẽ xoá timer của các toast cũ.
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++seq.current;
      setToasts((prev) => [...prev, { id, kind, message }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION_MS[kind])
      );
    },
    [dismiss]
  );

  // Dọn timer khi provider unmount (đổi route trong AppShell không xảy ra,
  // nhưng HMR/dev và test vẫn cần) — tránh setState sau unmount.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  // Esc đóng toàn bộ toast đang mở. Dùng cờ `mounted` vì provider có thể
  // render trước khi client mount (SSR) — addEventListener chỉ chạy ở client.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setToasts((prev) => {
        if (prev.length === 0) return prev;
        return [];
      });
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      push,
      dismiss,
    }),
    [push, dismiss]
  );

  // Portal ra <body> để thoát stacking context của trang (page root có
  // overflow + z-index riêng). z-[9500] nằm dưới modal z-[10000] của AppShell
  // nhưng trên nút FAB z-[9000] và mọi lớp của nội dung trang.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div
            data-testid="toast-region"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9500] flex flex-col items-center gap-2 w-[calc(100%-24px)] max-w-md pointer-events-none"
          >
            {toasts.map((t) => {
              const Icon = ICONS[t.kind];
              return (
                <div
                  key={t.id}
                  role={t.kind === 'error' ? 'alert' : 'status'}
                  aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
                  className={`pointer-events-auto w-full flex items-start gap-2.5 px-4 py-3 rounded-2xl border-2 shadow-2xl text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${STYLES[t.kind]}`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  {/* whitespace-pre-line: nhiều chỗ alert() cũ truyền chuỗi có \n,
                      hiển thị toast phải giữ nguyên xuống dòng thay vì gộp 1 dòng. */}
                  <span className="flex-1 whitespace-pre-line break-words">{t.message}</span>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Đóng thông báo"
                    className="shrink-0 p-1 -m-1 rounded-lg hover:bg-white/20 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
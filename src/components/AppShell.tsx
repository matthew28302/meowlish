'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Library,
  BookOpen,
  Sparkles,
  Mic,
  PenTool,
  Headphones,
  Gamepad2,
  Layers,
  Bookmark,
  Flame,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Zap,
  Award,
  Coins,
  Heart,
  CloudUpload,
  Check,
  ArrowRight,
  HelpCircle,
  Pencil,
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { formatCoins } from '@/lib/formatNumber';
import { initTheme } from '@/lib/theme';
import ThemeToggle from './ThemeToggle';
import { AuthUser, getCurrentUser, setStoredUser, clearStoredUser, removeSavedAccount } from '@/lib/auth';
import { fetchProgress } from '@/lib/progressFetch';
import UserAvatar from './UserAvatar';
import AuthModal from './AuthModal';
import EmailVerifyModal from './EmailVerifyModal';
import ProfileEditModal from './ProfileEditModal';
import FloatingAiChat from './FloatingAiChat';
import ToastProvider from './Toast';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/duahau');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isEmailVerifyOpen, setIsEmailVerifyOpen] = useState(false);
  const [emailVerifySessionId, setEmailVerifySessionId] = useState<string | null>(null);
  const [disabledNotice, setDisabledNotice] = useState<string | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  // Vị trí dropdown avatar — render bằng portal ra body để thoát stacking
  // context của header (z-30) và không bị modal/toast z-50 của page đè.
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const [avatarMenuPos, setAvatarMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  // H5 (audit 2026-10-08): guest gate ĐÓNG ĐƯỢC THẬT — sau khi đóng, user xem
  // nội dung đằng sau và có thể bấm "Đăng nhập" từ header để mở lại. Reset về
  // true khi user trở về null (đăng xuất) để gate hiện lại cho khách, khớp hành
  // vi cũ: guest trên route bảo vệ luôn được chào bằng gate.
  const [guestGateOpen, setGuestGateOpen] = useState(true);

  // SIDEBAR ẨN/HIỆN (chủ nhân: "thanh bên trái có thể ẩn hiện để tăng không gian").
  // Chỉ áp dụng DESKTOP (lg+): trạng thái "gọn" = icon rail 76px, hover vào mục
  // hiện tooltip title. Mobile drawer giữ nguyên 100%.
  // Key localStorage theo pattern mới nhất trong repo (`meowlish_theme`,
  // xem src/lib/theme.ts). Mặc định MỞ (false) khớp hành vi cũ.
  const [sidebarCompact, setSidebarCompact] = useState(false);

  // (đo 2026-10-09) userId giữ trong ref vì hai effect đăng ký listener
  // ('auth-state-changed' và 'account-disabled') dùng deps `[]` — chúng đóng
  // over handleAccountDisabled của render ĐẦU TIÊN, nơi currentUser === null.
  // ⇒ removeSavedAccount(currentUser.id) không bao giờ chạy ⇒ tài khoản bị
  // vô hiệu hóa vẫn nằm trong danh sách "tài khoản đã lưu" và chọn lại được.
  // Ref đọc được giá trị mới nhất mà không cần đăng ký lại listener.
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  // Đồng bộ theme (dark class) ngay khi AppShell mount — khớp với FOUC script trong layout
  useEffect(() => {
    initTheme();
  }, []);

  // SIDEBAR: đọc trạng thái gọn từ localStorage SAU mount (không đọc lúc render)
  // để server-render và client-render khớp nhau — tránh hydration mismatch.
  // Đánh đổi: nếu user đã chọn gọn, sidebar hiện bản mở ~1 frame rồi thu lại
  // (flash nhỏ, chấp nhận — xem ghi chú trong docs/ux-content-2026-10-18.md).
  useEffect(() => {
    try {
      setSidebarCompact(window.localStorage.getItem('meowlish_sidebar_collapsed') === '1');
    } catch {}
  }, []);

  const toggleSidebarCompact = () => {
    const next = !sidebarCompact;
    setSidebarCompact(next);
    try {
      window.localStorage.setItem('meowlish_sidebar_collapsed', next ? '1' : '0');
    } catch {}
    sound.playClick();
  };

  // Đóng menu avatar khi đổi trang
  useEffect(() => {
    setShowAvatarMenu(false);
  }, [pathname]);

  // M12 (audit 2026-10-08): đóng menu avatar / mobile drawer bằng phím Escape.
  // Backdrop bắt click ra ngoài chỉ dành cho chuột — overlay toàn màn hình vô
  // hình KHÔNG nên thành role="button" tabIndex=0 (tạo tab stop khổng lồ giữa
  // tab order); keyboard users đóng qua Escape, mouse users đóng qua click.
  useEffect(() => {
    if (!showAvatarMenu && !mobileDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showAvatarMenu) setShowAvatarMenu(false);
      if (mobileDrawerOpen) setMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAvatarMenu, mobileDrawerOpen]);

  // Dropdown avatar render bằng portal (fixed theo toạ độ nút) — nếu trang
  // cuộn hoặc cửa sổ resize thì toạ độ cũ lệch, đóng luôn cho an toàn.
  useEffect(() => {
    if (!showAvatarMenu) return;
    const close = () => setShowAvatarMenu(false);
    window.addEventListener('scroll', close, true); // capture: bắt cả scroll của container con
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [showAvatarMenu]);

  // Xử lý đăng xuất lập tức khi tài khoản bị vô hiệu hóa
  const handleAccountDisabled = (reason?: string) => {
    const msg = reason || 'Tài khoản của bạn đã bị Quản trị viên vô hiệu hóa. Bạn đã được đăng xuất an toàn khỏi hệ thống.';
    setDisabledNotice(msg);
    // Đọc id qua ref, không đọc currentUser trực tiếp: hàm này được effect
    // deps `[]` gọi lại nhiều lần, nếu đóng theo `currentUser` sẽ kẹt ở null
    // (render đầu) và tài khoản bị khóa không bị gỡ khỏi danh sách thiết bị.
    const disabledId = userIdRef.current;
    if (disabledId) {
      removeSavedAccount(disabledId);
    }
    clearStoredUser();
    setCurrentUser(null);
    setShowAuth(true);
    sound.playWrong();
  };

  // Listen for open-email-verify-modal and open-auth-modal events
  useEffect(() => {
    const handleOpenVerify = (e: any) => {
      setEmailVerifySessionId(e.detail?.sessionId || null);
      setIsEmailVerifyOpen(true);
    };
    const handleOpenAuth = () => {
      setShowAuth(true);
    };
    window.addEventListener('open-email-verify-modal', handleOpenVerify);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => {
      window.removeEventListener('open-email-verify-modal', handleOpenVerify);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
    };
  }, []);

  // Sync user state on mount and on custom event
  useEffect(() => {
    // Mỗi lần sync mới huỷ request của lượt trước (AbortController) và tăng
    // seq ⇒ response tới trễ bị bỏ qua, không đè ngược số coin mới bằng giá
    // trị cũ hơn (đo 2026-10-09).
    let activeController: AbortController | null = null;
    let seq = 0;

    const syncUser = () => {
      if (activeController) activeController.abort();
      const controller = new AbortController();
      activeController = controller;
      const mySeq = ++seq;
      const isStale = () => mySeq !== seq || controller.signal.aborted;
      const user = getCurrentUser();
      if (user?.username === 'admin' || user?.role === 'admin') {
        clearStoredUser();
        setCurrentUser(null);
        setIsAuthChecked(true);
        return;
      }
      if (user?.status === 'disabled') {
        handleAccountDisabled('Tài khoản của bạn đã bị Quản trị viên vô hiệu hóa.');
        setIsAuthChecked(true);
        return;
      }
      // H5 (audit 2026-10-08): user demo fallback (id 'user_demo_default' —
      // getStoredUser() tự tạo khi CHƯA đăng nhập thật, ví dụ trang /pet tự lưu
      // demo user vào localStorage khi mount) KHÔNG phải đăng nhập thật. Trước
      // fix H5, children không render cho guest nên fallback này không bao giờ
      // lọt vào AppShell; nay children render nên phải coi như guest để gate
      // hiện đúng thay vì biến mất.
      //
      // SỬA 2026-10-09: KHÔNG được check một mình `id === 'user_demo_default'`
      // — tài khoản demo THẬT trong DB được seed với đúng id đó (db.ts) nên
      // user bấm "Thử nhanh với tài khoản Demo", đăng nhập thành công, vẫn bị
      // coi là khách: gate chặn /vocabulary, header hiện "Đăng Nhập" dù đã
      // vào đúng (test e2e vocabulary bắt được triệu chứng này). Phân biệt
      // bằng cờ `isDemoFallback` (fallback mới) + heuristic `status`/
      // `created_at` (fallback cũ đã kịp nằm trong localStorage của user,
      // chưa có cờ — response đăng nhập thật từ server LUÔN có 2 field này).
      const isDemoFallback =
        user?.isDemoFallback === true ||
        (user?.id === 'user_demo_default' && !user?.status && !user?.created_at);
      // TỐI ƯU LOAD: hiển thị trang NGAY từ localStorage, không chờ /api/progress
      // (chậm trên cold instance Vercel) — làm mới số coin/trạng thái ở nền sau.
      if (user && !isDemoFallback) {
        setCurrentUser((prev) => (prev ? prev : user));
        setGuestGateOpen(false);
      } else {
        setCurrentUser(null);
        if (!user || isDemoFallback) setGuestGateOpen(true);
      }
      setIsAuthChecked(true);

      if (user?.id && !isDemoFallback) {
        fetchProgress(user.id)
          .then((res) => {
            if (res.status === 403) {
              return res.json().then((data) => {
                if (isStale()) return;
                if (data.status === 'disabled' || data.error?.includes('vô hiệu hóa')) {
                  handleAccountDisabled(data.error);
                }
              });
            }
            return res.json();
          })
          .then((data) => {
            if (isStale()) return;
            if (data?.user) {
              if (data.user.status === 'disabled') {
                handleAccountDisabled('Tài khoản của bạn đã bị Quản trị viên vô hiệu hóa.');
                return;
              }
              // READ-YOUR-WRITES cho `coins` (đo 2026-10-09): GET /api/progress
              // đọc DB nên trên Vercel multi-instance (SQLite file cũ, sync lag
              // ~28s) nó trả số TRƯỚC transaction. Mỗi lần mua/cho pet,
              // POST /api/pet trả số mới → setStoredUser() ghi localStorage →
              // dispatch 'auth-state-changed' → syncUser() chạy lại → nếu ghi
              // đè bằng GET thì pill coin ở header LÙI về số cũ rồi action sau
              // lại nhảy lên (đúng triệu chứng "coin không đồng bộ"). Cùng lý
              // do và cùng cách sửa như src/app/pet/page.tsx (~288-298): giữ
              // giá trị client đang có, chỉ nhận coins từ server khi client
              // chưa có (lần đầu đăng nhập trên thiết bị mới).
              setCurrentUser((prev) =>
                prev
                  ? { ...prev, ...data.user, coins: prev.coins ?? data.user.coins }
                  : data.user
              );
            }
          })
          .catch(() => {})
          .finally(() => {
            // Response cũ bị bỏ qua ở trên nhưng vẫn phải mở splash lần đầu —
            // lượt sync mới hơn tự setIsAuthChecked(true) ở nhánh của nó.
            setIsAuthChecked(true);
          });
      } else {
        setIsAuthChecked(true);
      }
    };

    syncUser();
    window.addEventListener('auth-state-changed', syncUser);
    return () => {
      if (activeController) activeController.abort();
      window.removeEventListener('auth-state-changed', syncUser);
    };
  }, []);

  // Giám sát phiên người dùng theo thời gian thực (Heartbeat): Đăng xuất ngay khi bị Admin vô hiệu hóa
  useEffect(() => {
    if (!currentUser?.id || isAdminRoute) return;

    let lastChecked = Date.now();

    const checkSession = async () => {
      // Throttle: avoid redundant checks within 30 seconds
      if (Date.now() - lastChecked < 30000) return;
      lastChecked = Date.now();
      try {
        const res = await fetchProgress(currentUser.id);
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (data.status === 'disabled' || data.error?.includes('vô hiệu hóa')) {
            handleAccountDisabled(data.error);
          }
        } else if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.user?.status === 'disabled') {
            handleAccountDisabled('Tài khoản của bạn đã bị Quản trị viên vô hiệu hóa.');
          }
        }
      } catch {}
    };

    const interval = setInterval(checkSession, 90000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkSession();
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [currentUser?.id, isAdminRoute]);

  // Lắng nghe sự kiện toàn cục account-disabled từ bất kỳ API call nào
  useEffect(() => {
    const onAccountDisabled = (e: any) => {
      handleAccountDisabled(e.detail?.reason);
    };
    window.addEventListener('account-disabled', onAccountDisabled);
    return () => window.removeEventListener('account-disabled', onAccountDisabled);
  }, []);

  // 1. ISOLATION: On Admin Route (/duahau), render purely the admin console with full-viewport scrolling
  if (isAdminRoute) {
    return (
      <div className="h-dvh w-full overflow-y-auto overscroll-y-contain custom-scrollbar bg-slate-950 text-slate-100">
        {children}
      </div>
    );
  }

  // 2. PREVENT FLASH OF CONTENT: During initial hydration / session check, show minimal smooth splash
  if (!isAuthChecked) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center p-4 select-none">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-bounce mb-3 shadow-xl shadow-emerald-500/10">
          {/* Linh vật brand: GIF pixel của khách (avatar trống → mèo mặc định) */}
          <UserAvatar avatar={null} format="gif" size={56} alt="Linh vật Meowlish" />
        </div>
        <div className="text-white font-black text-xl tracking-wide flex items-center gap-2">
          <span>Meowlish</span>
          <span className="text-emerald-400 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 font-bold">English</span>
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Đang tải không gian học tập...</span>
        </div>
      </div>
    );
  }

  // 3. UNAUTHENTICATED USERS — H5 (audit 2026-10-08): guest VẪN nhận children
  // (nội dung trang render vào DOM — Googlebot render JS sẽ thấy, không còn là
  // "SPA shell rỗng" chỉ có login gate). Gate hiện NỘI TRÊN nội dung như một
  // overlay đè lên thay vì THAY THẾ children — không phải cloaking: nội dung
  // vẫn hiện cho user thật (đóng modal bằng nút X là thấy nội dung đằng sau,
  // và có thể bấm "Đăng nhập" từ header để mở lại). Điều kiện gate GIỮ NGUYÊN.
  // /reset-password phải NỘI NGOẠI: người quên mật khẩu chắc chắn ĐANG đăng
  // xuất — bấm link trong email mà bị modal login đè kín form đặt lại mật
  // khẩu thì mất lối (rà UI 2026-10-17).
  const isGuestOnProtectedRoute =
    !currentUser &&
    pathname !== '/encyclopedia' &&
    pathname !== '/reset-password';
  const showGuestGate = isGuestOnProtectedRoute && guestGateOpen;

  const navGroups: NavGroup[] = [
    {
      title: 'HỌC TẬP',
      items: [
        { href: '/', label: 'Lộ Trình Học', icon: Compass },
        { href: '/encyclopedia', label: 'Bách Khoa Từ Điển', icon: Library },
        { href: '/grammar', label: 'Ngữ Pháp Lego', icon: BookOpen },
        { href: '/vocabulary', label: 'Từ Vựng Giao Tiếp', icon: Sparkles },
      ],
    },
    {
      title: 'PHÒNG LUYỆN TẬP',
      items: [
        { href: '/practice/speaking', label: 'Luyện Nói AI Voice', icon: Mic },
        { href: '/practice/writing', label: 'Luyện Viết Phản Xạ', icon: PenTool },
        { href: '/practice/listening', label: 'Luyện Nghe Tốc Độ', icon: Headphones },
        { href: '/practice/roleplay', label: 'Đóng Vai Scrum', icon: Gamepad2 },
      ],
    },
    {
      title: 'THÚ CƯNG & KHU VƯỜN',
      items: [
        { href: '/pet', label: 'Khu Vườn Thú Cưng', icon: Heart },
      ],
    },
    {
      title: 'ÔN TẬP & KHO TỪ',
      items: [
        { href: '/flashcards', label: 'Flashcard 3D', icon: Layers },
        { href: '/bookmarks', label: 'Sổ Từ Bookmark', icon: Bookmark },
      ],
    },
    {
      title: 'HỖ TRỢ & HƯỚNG DẪN',
      items: [
        { href: '/support', label: 'Hướng Dẫn & Góp Ý', icon: HelpCircle },
      ],
    },
  ];

  const mobilePrimaryLinks = [
    { href: '/', label: 'Lộ Trình', icon: Compass },
    { href: '/encyclopedia', label: 'Từ Điển', icon: Library },
    { href: '/pet', label: 'Thú Cưng', icon: Heart },
    { href: '/practice/speaking', label: 'Luyện Nói', icon: Mic },
  ];

  // Helper to determine current page title for the header
  const getPageTitle = () => {
    if (pathname === '/') return 'Lộ Trình Học Giao Tiếp';
    if (pathname === '/pet') return 'Khu Vườn Thú Cưng & Trang Viên';
    if (pathname === '/encyclopedia') return 'Bách Khoa Toàn Thư Từ Điển';
    if (pathname === '/grammar') return 'Ngữ Pháp Lego Trực Quan';
    if (pathname === '/vocabulary') return 'Từ Vựng Giao Tiếp & IT';
    if (pathname === '/practice/speaking') return 'Phòng Luyện Nói AI Voice';
    if (pathname === '/practice/writing') return 'Phòng Luyện Viết Phản Xạ';
    if (pathname === '/practice/listening') return 'Phòng Luyện Nghe Tốc Độ';
    if (pathname === '/practice/roleplay') return 'Đóng Vai Daily Scrum';
    if (pathname === '/flashcards') return 'Flashcard 3D Spaced Repetition';
    if (pathname === '/bookmarks') return 'Sổ Từ Vựng Đã Lưu';
    if (pathname === '/support') return 'Hỗ Trợ & Hướng Dẫn Sử Dụng';
    return 'Meowlish';
  };

  // L7c (audit 2026-10-08): /support tự có <main> riêng bên trong children
  // (src/app/support/page.tsx) — nếu AppShell cũng bọc <main> thì /support sẽ
  // có 2 <main> lồng nhau (HTML spec: main không được lồng trong main).
  // → Ở /support AppShell bọc bằng <div> CÙNG class (layout/cuộn không đổi —
  //   rule `main, .custom-scrollbar` trong globals.css áp qua class nên vẫn
  //   nhận đủ behavior), các trang còn lại giữ <main> làm landmark chính.
  const stageScrollerClassName =
    'flex-1 min-h-0 flex flex-col w-full overflow-y-auto overscroll-y-contain custom-scrollbar lg:pb-0 scroll-pb-32 [&>div.overflow-x-hidden:not(.flex-1)]:shrink-0';

  return (
    // UX-008: ToastProvider bọc ở đây (một lần cho MỌI trang) nên mọi `alert()`
    // cũ đã chuyển sang `useToast()` đều hoạt động mà không cần page nào tự
    // mount provider. Các early-return phía trên (/duahau + splash) không cần
    // toast nên cố ý không bọc — chúng không render component dùng toast.
    <ToastProvider>
    <div className="h-dvh w-full bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden relative">
      {/* Thông báo bảo mật khi tài khoản bị vô hiệu hóa */}
      {disabledNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[calc(100%-32px)] bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
            <span className="text-lg shrink-0">⛔</span>
            <span>{disabledNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDisabledNotice(null)}
            className="p-1 hover:bg-rose-700 rounded-lg text-white font-bold cursor-pointer transition shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. DESKTOP FIXED SIDEBAR (Standard Duolingo/Notion App Layout)
          — có 2 trạng thái: MỞ (w-64) ↔ GỌN (icon rail w-[76px]). Nút chevron
          trong khối logo toggle + lưu localStorage; main content đổi offset
          tương ứng (lg:pl-64 ↔ lg:pl-[76px]) với transition 300ms. */}
      <aside
        data-testid="desktop-sidebar"
        data-compact={sidebarCompact ? 'true' : 'false'}
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r-2 border-slate-100 dark:border-white/10 shadow-xs select-none transition-[width] duration-300 ease-in-out ${
          sidebarCompact ? 'w-[88px]' : 'w-72'
        }`}
      >
        {/* Logo Brand — khung GIF pixel + wordmark "Meowlish" (trở lại theo yêu
            cầu: trước đây chỉ icon; khung gradient giữ nguyên, GIF trong suốt nổi trên nền).
            Khi GỌN: logo căn giữa, wordmark ẩn, nút toggle xuống dưới logo. */}
        <div className={`border-b border-slate-100 dark:border-white/10 shrink-0 ${sidebarCompact ? 'px-2 py-4' : 'p-5'}`}>
          <div className={sidebarCompact ? 'flex flex-col items-center gap-3' : 'flex items-center justify-between gap-2'}>
            <Link
              href="/"
              onClick={() => sound.playClick()}
              title="Về trang chủ Meowlish"
              className="flex items-center gap-2.5 group min-w-0"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/30 group-hover:scale-105 transition-transform shrink-0 brand-glow">
                {/* GIF TƯƠNG ỨNG avatar user đã chọn (kèm chữ Meowlish bên cạnh).
                    Guest — chưa có avatar — hiện Linh Vật mặc định (cat). */}
                <UserAvatar avatar={currentUser?.avatar} format="gif" size={48} alt="Linh vật Meowlish" />
              </div>
              {!sidebarCompact && (
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  Meowlish
                </span>
              )}
            </Link>

            {/* Nút thu gọn / mở rộng sidebar — keyboard-accessible, aria-expanded,
                icon chevron xoay 180° mượt theo trạng thái. */}
            <button
              type="button"
              data-testid="sidebar-collapse-toggle"
              onClick={toggleSidebarCompact}
              aria-expanded={!sidebarCompact}
              aria-controls="desktop-sidebar-nav"
              aria-label={sidebarCompact ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng để lấy thêm không gian'}
              title={sidebarCompact ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors active:scale-90 cursor-pointer"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCompact ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Groups */}
        <div id="desktop-sidebar-nav" className={`flex-1 overflow-y-auto py-4 space-y-6 ${sidebarCompact ? 'px-2' : 'px-3.5'}`} tabIndex={0}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {/* UX-007: `nav-group-label` lấy màu từ token (xem globals.css).
                  Đừng thêm lại `text-slate-400 dark:text-slate-500` — đó là
                  nguyên nhân 2.63:1 / 3.74:1 FAIL trên cả 13 trang.
                  Chế độ gọn: thay tiêu đề nhóm bằng dải phân cách mảnh (đỡ rối). */}
              {sidebarCompact ? (
                <div className="mx-2 h-px bg-slate-100 dark:bg-white/10" aria-hidden="true" />
              ) : (
                <div className="nav-group-label px-3 text-[12px] font-black uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={sidebarCompact ? item.label : undefined}
                      aria-label={sidebarCompact ? item.label : undefined}
                      onClick={(e) => {
                        if (!currentUser && item.href !== '/encyclopedia' && item.href !== '/support') {
                          e.preventDefault();
                          setShowAuth(true);
                        } else if (currentUser && currentUser.email && currentUser.email_verified === false && item.href !== '/encyclopedia' && item.href !== '/support') {
                          e.preventDefault();
                          sound.playWrong();
                          setIsEmailVerifyOpen(true);
                        } else {
                          sound.playClick();
                        }
                      }}
                      className={`flex items-center rounded-2xl text-xs font-bold transition-all cursor-pointer border-b-2 border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                        sidebarCompact ? 'justify-center px-0 py-3.5' : 'justify-between px-3.5 py-3.5'
                      } ${
                        isActive
                          ? 'nav-link-active font-black shadow-md shadow-emerald-500/25 border-b-4'
                          : 'nav-link hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.97]'
                      }`}
                    >
                      <div className={`flex items-center ${sidebarCompact ? '' : 'gap-3'}`}>
                        <Icon className={`w-[18px] h-[18px] nav-icon ${isActive ? 'text-white' : ''}`} />
                        {!sidebarCompact && <span>{item.label}</span>}
                      </div>
                      {!sidebarCompact && item.badge && (
                        <span className={`text-[12px] font-black px-2 py-0.5 rounded-full ${
                          isActive ? 'nav-badge-active' : item.badgeColor
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer User Profile Card — M12 (audit 2026-10-08): div onClick →
            button để keyboard-accessible (Enter/Space mặc định của button).
            Chế độ GỌN: chỉ còn avatar căn giữa + tooltip tên. */}
        <div className={`border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 shrink-0 ${sidebarCompact ? 'p-2.5' : 'p-3.5'}`}>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowAuth(true);
            }}
            title={sidebarCompact ? `${currentUser?.display_name || 'Học Viên'} — Level ${currentUser?.level || 1}` : undefined}
            aria-label={sidebarCompact ? 'Tài khoản học viên' : undefined}
            className={`w-full text-left flex items-center p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xs hover:border-emerald-400 cursor-pointer transition active:scale-[0.98] ${
              sidebarCompact ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className={`flex items-center min-w-0 ${sidebarCompact ? '' : 'gap-2.5'}`}>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-lg shrink-0">
                <UserAvatar avatar={currentUser?.avatar} size={44} />
              </div>
              {!sidebarCompact && (
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {currentUser?.display_name || 'Học Viên'}
                  </div>
                  {/* UX-007: footer card cũng nằm trong sidebar — cùng token contrast. */}
                  <div className="text-[12px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>Level {currentUser?.level || 1}</span>
                    <span>•</span>
                    <span className="text-amber-700 dark:text-amber-300">{currentUser?.exp || 0} EXP</span>
                  </div>
                </div>
              )}
            </div>
            {!sidebarCompact && <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT STAGE (Offset on desktop for the sidebar — đổi theo
          trạng thái gọn/mở với cùng nhịp transition 300ms để không giật). */}
      <div className={`flex-1 flex flex-col min-w-0 h-dvh overflow-hidden transition-[padding-left] duration-300 ease-in-out ${
        sidebarCompact ? 'lg:pl-[88px]' : 'lg:pl-72'
      }`}>
        {/* Top Status Header (Single Minimal Row with Zero Clutter) */}
        <header className="shrink-0 z-30 bg-white dark:bg-slate-900 lg:bg-white/90 lg:dark:bg-slate-900/90 lg:backdrop-blur-md border-b border-slate-100 dark:border-white/10 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
              {/* Left: Mobile hamburger & Page Title
               *
               * PHẢI cho cụm này co lại được (`flex-1 min-w-0`). Trước đây nó
               * không có, còn cụm phải thì `shrink-0` ⇒ cả thanh có sàn cứng
               * ~440px. Đo được: ở 360px nút đổi theme nằm ở [359..395] và avatar
               * ở [401..430] — tức nằm NGOÀI khung nhìn. Mà `<html>` có
               * `overflow-x:hidden` nên không có thanh cuộn cứu: người dùng mất
               * trắng nút đổi theme và nút mở menu tài khoản mà không có gì báo.
               * Nay tiêu đề co lại trước, hai nút đó luôn còn.
               */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sound.playClick();
                    setMobileDrawerOpen(true);
                  }}
                  className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 active:scale-95 text-slate-800 dark:text-slate-100 cursor-pointer shadow-xs border border-slate-200 dark:border-white/10 shrink-0 touch-manipulation select-none"
                  title="Mở menu"
                >
                  <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                </button>

                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="lg:hidden w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                    {/* GIF tương ứng avatar user — khớp logo sidebar desktop, guest hiện cat */}
                    <UserAvatar avatar={currentUser?.avatar} format="gif" size={28} alt="Linh vật Meowlish" />
                  </div>
                  {/* `xs:` không phải breakpoint của Tailwind ⇒ class chết, đã gỡ.
                      Tiêu đề tự co nhờ `flex-1 min-w-0` bên trên. */}
                  <h1 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate min-w-0">
                    {getPageTitle()}
                  </h1>
                </div>
              </div>

              {/* Right: Gamified Stats (Flame Streak, EXP, Level, Profile) */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Streak Flame Pill — M12: div onClick → button (keyboard-accessible) */}
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => sound.playFlame()}
                    title={`Chuỗi học liên tục ${currentUser.streak || 1} ngày!`}
                    className="tap-target flex items-center gap-1 sm:gap-1.5 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer hover:scale-105 transition active:scale-95 select-none"
                  >
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-orange-500 animate-flame" />
                    <span className="text-[12px] sm:text-xs font-black text-orange-700 dark:text-orange-300">
                      {currentUser.streak || 1}
                    </span>
                    <span className="hidden sm:inline text-[12px] font-extrabold text-orange-600 dark:text-orange-400 uppercase">
                      ngày
                    </span>
                  </button>
                )}

                {/* EXP Pill */}
                {currentUser && (
                  <div
                    title={`${currentUser.exp || 0} Điểm kinh nghiệm`}
                    className="hidden xs:flex items-center gap-1 sm:gap-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full select-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
                    <span className="text-[12px] sm:text-xs font-black text-amber-800 dark:text-amber-200">
                      {currentUser.exp || 0}
                    </span>
                    <span className="hidden sm:inline text-[12px] font-extrabold text-amber-600 dark:text-amber-400 uppercase">
                      EXP
                    </span>
                  </div>
                )}

                {/* Coins Pill (Direct link to Pet Sanctuary Shop) */}
                {currentUser && (
                  <Link
                    href="/pet"
                    onClick={() => sound.playClick()}
                    title={`Số dư: ${formatCoins(currentUser.coins)} Coins. Bấm để ghé thăm Khu Vườn Thú Cưng!`}
                    className="tap-target flex items-center gap-1 sm:gap-1.5 bg-amber-100/70 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer transition select-none hover:scale-105 active:scale-95 shadow-xs"
                  >
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-300 fill-amber-400 transition-transform hover:scale-110" />
                    <span className="text-[12px] sm:text-xs font-black text-amber-900 dark:text-amber-200">
                      {formatCoins(currentUser.coins)}
                    </span>
                    <span className="hidden sm:inline text-[12px] font-extrabold text-amber-700 dark:text-amber-400 uppercase">
                      Coins
                    </span>
                  </Link>
                )}

                {/* Level Pill */}
                {currentUser && (
                  <div
                    title={`Cấp độ học viên`}
                    className="hidden md:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full select-none"
                  >
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                      Lv.{currentUser.level || 1}
                    </span>
                  </div>
                )}

                {/* Nút chuyển giao diện Sáng / Tối */}
                <ThemeToggle />

                {/* User Avatar Button + Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    ref={avatarBtnRef}
                    onClick={() => {
                      sound.playClick();
                      if (currentUser) {
                        const rect = avatarBtnRef.current?.getBoundingClientRect();
                        if (rect) setAvatarMenuPos({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
                        setShowAvatarMenu((v) => !v);
                      } else setShowAuth(true);
                    }}
                    className="tap-target flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
                  >
                    <UserAvatar avatar={currentUser?.avatar} size={22} />
                    <span className="hidden sm:inline max-w-[140px] truncate">
                      {currentUser?.display_name || 'Đăng Nhập'}
                    </span>
                  </button>

                  {showAvatarMenu && currentUser && avatarMenuPos && createPortal(
                    <>
                      {/* M12: Bắt click ra ngoài để đóng menu — overlay toàn màn
                          hình vô hình, không phải control thật nên aria-hidden
                          (keyboard đóng qua Escape — effect ở đầu file).
                          H6 (2026-10-12): render qua portal ra <body> để dropdown
                          thoát stacking context z-30 của header — hết bị modal
                          z-50 của page (shop/toast…) đè lên. */}
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setShowAvatarMenu(false)}
                        aria-hidden="true"
                      />
                      <div
                        className="fixed w-60 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-2 shadow-2xl z-[9999] animate-in fade-in zoom-in-95 duration-150"
                        style={{ top: avatarMenuPos.top, right: avatarMenuPos.right }}
                      >
                        <div className="px-3 py-2 mb-1 border-b border-slate-100 dark:border-slate-800">
                          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {currentUser.display_name}
                          </div>
                          <div className="text-[12px] font-mono text-slate-400 truncate">
                            @{currentUser.username}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setShowAvatarMenu(false);
                            setShowProfileEdit(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 text-xs font-black transition cursor-pointer text-left"
                        >
                          <Pencil className="w-4 h-4 text-emerald-500 shrink-0" />
                          Sửa thông tin cá nhân
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setShowAvatarMenu(false);
                            setShowAuth(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black transition cursor-pointer text-left"
                        >
                          <User className="w-4 h-4 text-cyan-500 shrink-0" />
                          Tài khoản &amp; Bảo mật
                        </button>
                      </div>
                    </>, document.body
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Unverified Email Warning Bar */}
        {currentUser && currentUser.email && currentUser.email_verified === false && (
          <div className="shrink-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold flex items-center justify-between shadow-xs select-none z-20">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="text-base shrink-0">✉️</span>
              <span className="truncate">
                Tài khoản chưa xác thực email ({currentUser.email}). Vui lòng xác thực email để kích hoạt tính năng!
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsEmailVerifyOpen(true);
              }}
              className="shrink-0 px-2.5 sm:px-3 py-1 bg-white hover:bg-amber-50 text-amber-900 rounded-xl text-[12px] sm:text-[12px] font-black transition cursor-pointer shadow-sm active:scale-95"
            >
              Kích hoạt ngay ✉️
            </button>
          </div>
        )}

        {/* L7c: /support → div (tránh 2 <main> lồng nhau), còn lại → <main>.
            [&>div.overflow-x-hidden:not(.flex-1)]:shrink-0 — page roots with
            overflow-x-hidden compute overflow-y:auto (spec) => min-size 0 =>
            flex-shrink collapses them to the viewport, so MAIN ends up with
            nothing to scroll and wheel events over the right/left blank margins
            did nothing. Keep those roots at content height so MAIN scrolls.
            .flex-1 excluded: pet page root is intentionally a full-height
            internal scroller. */}
        {pathname === '/support' ? (
          <div className={stageScrollerClassName} tabIndex={0}>{children}</div>
        ) : (
          <main className={stageScrollerClassName} tabIndex={0}>{children}</main>
        )}

      {/* 3. MOBILE BOTTOM NAVIGATION — inside the flex-col container so it takes
          space and content never scrolls underneath it. Trước đây là `fixed
          bottom-0` ⇒ nav nổi trên nội dung và che nút. */}
      <nav className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-white/10 h-16 pb-[calc(env(safe-area-inset-bottom,0px))] flex items-center justify-around px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {mobilePrimaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                if (!currentUser && link.href !== '/encyclopedia') {
                  e.preventDefault();
                  setShowAuth(true);
                } else if (currentUser && currentUser.email && currentUser.email_verified === false && link.href !== '/encyclopedia') {
                  e.preventDefault();
                  sound.playWrong();
                  setIsEmailVerifyOpen(true);
                } else {
                  sound.playClick();
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[12px] font-extrabold transition cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-600 ${
                isActive
                  ? 'nav-bottom-active scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}

        {/* "Thêm" Button opens full mobile drawer */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            sound.playClick();
            setMobileDrawerOpen(true);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[12px] font-extrabold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer touch-manipulation select-none ${
            mobileDrawerOpen ? 'text-emerald-600' : ''
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>Thêm</span>
        </button>
      </nav>
      </div>

      {/* 4. MOBILE SLIDE-OVER DRAWER (When pressing Menu on Mobile) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          {/* M12: Backdrop — bắt click ra ngoài để đóng drawer; overlay toàn màn
              hình vô hình nên aria-hidden (keyboard đóng qua Escape — effect ở
              đầu file, hoặc nút X trong drawer) */}
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              sound.playClick();
              setMobileDrawerOpen(false);
            }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto z-10 animate-drawer-slide pointer-events-auto" tabIndex={0}>
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5 font-black text-lg text-slate-900 dark:text-slate-100">
                  {/* Brand khớp logo sidebar: GIF TƯƠNG ỨNG avatar user đã chọn,
                      guest — chưa có avatar — hiện Linh Vật mặc định (cat). */}
                  <UserAvatar avatar={currentUser?.avatar} format="gif" size={40} alt="Linh vật Meowlish" />
                  <span className="text-xl">Meow<span className="text-emerald-600 dark:text-emerald-400">lish</span></span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sound.playClick();
                    setMobileDrawerOpen(false);
                  }}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 cursor-pointer touch-manipulation"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              {/* Navigation Groups in Drawer */}
              <div className="space-y-5">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    {/* UX-007: drawer dùng CHUNG token với sidebar — trước đây
                        nó tự chọn `text-slate-400 dark:text-slate-500` nên sửa
                        sidebar xong thì drawer vẫn FAIL. */}
                    <div className="nav-group-label text-[12px] font-black uppercase tracking-wider px-2">
                      {group.title}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => {
                              if (!currentUser && item.href !== '/encyclopedia' && item.href !== '/support') {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowAuth(true);
                              } else if (currentUser && currentUser.email && currentUser.email_verified === false && item.href !== '/encyclopedia' && item.href !== '/support') {
                                e.preventDefault();
                                e.stopPropagation();
                                sound.playWrong();
                                setMobileDrawerOpen(false);
                                setIsEmailVerifyOpen(true);
                              } else {
                                e.stopPropagation();
                                sound.playClick();
                                setMobileDrawerOpen(false);
                              }
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                              isActive
                                ? 'nav-link-active font-black shadow-xs'
                                : 'nav-link hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-[18px] h-[18px] nav-icon ${isActive ? 'text-white' : ''}`} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className={`text-[12px] font-black px-2 py-0.5 rounded-full ${
                                isActive ? 'nav-badge-active' : item.badgeColor
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer User Card */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileDrawerOpen(false);
                    setShowAuth(true);
                  }}
                  className="flex-1 btn-3d btn-3d-white p-3 text-xs font-black text-slate-800 touch-manipulation"
                >
                  <UserAvatar avatar={currentUser?.avatar} size={28} />
                  <span>{currentUser ? currentUser.display_name : 'Đăng Nhập Tài Khoản'}</span>
                </button>
                <ThemeToggle />
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileDrawerOpen(false);
                    setShowProfileEdit(true);
                  }}
                  className="w-full btn-3d btn-3d-white p-3 text-xs font-black text-slate-800 touch-manipulation mt-2"
                >
                  <span>✏️</span>
                  <span>Sửa thông tin cá nhân</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. GUEST GATE OVERLAY — H5 (audit 2026-10-08): đè NỘI TRÊN children thay
          vì thay thế children — nội dung trang vẫn nằm trong DOM (SEO). Chỉ là
          overlay fixed + blur phía sau modal, KHÔNG display:none/visibility:hidden.
          z-40 nằm DƯỚI AuthModal (z-[10000]) để modal luôn đè lên như hành vi cũ;
          `data-guest-gate` để kiểm chứng DOM bằng Playwright. */}
      {showGuestGate && (
        <div data-guest-gate className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative z-10 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center shadow-xl">
              {/* Linh vật brand pixel — khớp style với splash/guest gate */}
              <UserAvatar avatar={null} size={64} alt="Linh vật Meowlish" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Meowlish English</h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Nền tảng luyện giao tiếp tiếng Anh phản xạ, luyện thi TOEIC/IELTS & tiếng Anh chuyên ngành IT cùng linh vật thú cưng.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowAuth(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Đăng Nhập / Đăng Ký Học Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/encyclopedia"
                onClick={() => sound.playClick()}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-700/80 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Library className="w-4 h-4 text-emerald-400" />
                <span>Tra cứu Bách Khoa Từ Điển (Miễn Phí)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5.b FLOATING AI CHAT — Trợ Lý Mèo AI 24/7 mọi trang (không hiện trên /support) */}
      <FloatingAiChat />

      {/* 6. AUTH MODAL — H5: với guest gate, modal mở ép như cũ NHƯNG onClose
          THẬT: đóng modal (nút X / Escape) = gỡ cả gate → user thấy nội dung
          đằng sau và bấm được; mở lại từ header ("Đăng nhập") vẫn hoạt động. */}
      <AuthModal
        isOpen={showAuth || showGuestGate}
        onClose={() => {
          setShowAuth(false);
          setGuestGateOpen(false);
        }}
        currentUser={currentUser}
        onAuthChange={(user) => setCurrentUser(user)}
      />

      {/* 7. EMAIL VERIFICATION MODAL */}
      <EmailVerifyModal
        isOpen={isEmailVerifyOpen}
        onClose={() => {
          setIsEmailVerifyOpen(false);
          setEmailVerifySessionId(null);
        }}
        user={currentUser}
        initialSessionId={emailVerifySessionId}
        onVerified={(updated) => {
          setCurrentUser(updated);
          setStoredUser(updated);
        }}
      />

      {/* 8. PROFILE EDIT MODAL (Sửa thông tin cá nhân) */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        user={currentUser}
        onUpdated={(updated) => {
          setCurrentUser(updated);
          setStoredUser(updated);
        }}
      />
    </div>
    </ToastProvider>
  );
}

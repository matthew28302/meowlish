'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { AuthUser, getCurrentUser, setStoredUser, clearStoredUser, removeSavedAccount } from '@/lib/auth';
import AuthModal from './AuthModal';
import EmailVerifyModal from './EmailVerifyModal';

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

  // Xử lý đăng xuất lập tức khi tài khoản bị vô hiệu hóa
  const handleAccountDisabled = (reason?: string) => {
    const msg = reason || 'Tài khoản của bạn đã bị Quản trị viên vô hiệu hóa. Bạn đã được đăng xuất an toàn khỏi hệ thống.';
    setDisabledNotice(msg);
    if (currentUser?.id) {
      removeSavedAccount(currentUser.id);
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
    const syncUser = () => {
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
      setCurrentUser(user);

      if (user?.id) {
        fetch(`/api/progress?userId=${user.id}`)
          .then((res) => {
            if (res.status === 403) {
              return res.json().then((data) => {
                if (data.status === 'disabled' || data.error?.includes('vô hiệu hóa')) {
                  handleAccountDisabled(data.error);
                }
              });
            }
            return res.json();
          })
          .then((data) => {
            if (data?.user) {
              if (data.user.status === 'disabled') {
                handleAccountDisabled('Tài khoản của bạn đã bị Quản trị viên vô hiệu hóa.');
                return;
              }
              setCurrentUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
            }
          })
          .catch(() => {})
          .finally(() => setIsAuthChecked(true));
      } else {
        setIsAuthChecked(true);
      }
    };

    syncUser();
    window.addEventListener('auth-state-changed', syncUser);
    return () => window.removeEventListener('auth-state-changed', syncUser);
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
        const res = await fetch(`/api/progress?userId=${currentUser.id}`);
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

  // 1. ISOLATION: On Admin Route (/duahau), render purely the admin console without any learning layout
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // 2. PREVENT FLASH OF CONTENT: During initial hydration / session check, show minimal smooth splash
  if (!isAuthChecked) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center p-4 select-none">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-3xl animate-bounce mb-3 shadow-xl shadow-emerald-500/10">
          🐱
        </div>
        <div className="text-white font-black text-lg tracking-wide flex items-center gap-2">
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

  // 3. UNAUTHENTICATED USERS: On protected routes, display the Welcome & Login interface directly
  // This completely eliminates flashing the dashboard before jumping to login!
  if (!currentUser && pathname !== '/encyclopedia') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative z-10 space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-4xl shadow-xl">
            🐱
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Meowlish English</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Nền tảng luyện giao tiếp tiếng Anh phản xạ, luyện thi TOEIC/IELTS & tiếng Anh chuyên ngành IT cùng linh vật thú cưng.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
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

        {/* AuthModal is open directly */}
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          currentUser={currentUser}
          onAuthChange={(user) => {
            setCurrentUser(user);
            setShowAuth(false);
          }}
        />
      </div>
    );
  }

  const navGroups: NavGroup[] = [
    {
      title: 'HỌC TẬP',
      items: [
        { href: '/', label: 'Lộ Trình Học', icon: Compass },
        { href: '/encyclopedia', label: 'Bách Khoa Từ Điển', icon: Library, badge: '26.5k', badgeColor: 'bg-emerald-100 text-emerald-800' },
        { href: '/grammar', label: 'Ngữ Pháp Lego', icon: BookOpen },
        { href: '/vocabulary', label: 'Từ Vựng Giao Tiếp', icon: Sparkles },
      ],
    },
    {
      title: 'PHÒNG LUYỆN TẬP',
      items: [
        { href: '/practice/speaking', label: 'Luyện Nói AI Voice', icon: Mic, badge: 'AI', badgeColor: 'bg-amber-100 text-amber-900' },
        { href: '/practice/writing', label: 'Luyện Viết Phản Xạ', icon: PenTool },
        { href: '/practice/listening', label: 'Luyện Nghe Tốc Độ', icon: Headphones },
        { href: '/practice/roleplay', label: 'Đóng Vai Scrum', icon: Gamepad2 },
      ],
    },
    {
      title: 'THÚ CƯNG & KHU VƯỜN',
      items: [
        { href: '/pet', label: 'Khu Vườn Thú Cưng', icon: Heart, badge: 'Hot', badgeColor: 'bg-rose-100 text-rose-800' },
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
        { href: '/support', label: 'Hướng Dẫn & Góp Ý', icon: HelpCircle, badge: 'Mới', badgeColor: 'bg-emerald-100 text-emerald-800' },
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

  return (
    <div className="h-dvh w-full bg-[#f8fafc] text-slate-900 flex overflow-hidden relative">
      {/* Thông báo bảo mật khi tài khoản bị vô hiệu hóa */}
      {disabledNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[calc(100%-32px)] bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
            <span className="text-lg shrink-0">⛔</span>
            <span>{disabledNotice}</span>
          </div>
          <button 
            onClick={() => setDisabledNotice(null)} 
            className="p-1 hover:bg-rose-700 rounded-lg text-white font-bold cursor-pointer transition shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. DESKTOP FIXED SIDEBAR (Standard Duolingo/Notion App Layout) */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40 bg-white border-r-2 border-slate-100 shadow-xs select-none">
        {/* Logo Brand */}
        <div className="p-5 border-b border-slate-100">
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform text-2xl">
              🐱
            </div>
            <div>
              <div className="font-black text-xl text-slate-900 tracking-tight flex items-center">
                Meow<span className="text-emerald-600">lish</span>
              </div>
              <div className="text-[11px] font-bold text-slate-400">
                Giao Tiếp Thực Chiến
              </div>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
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
                          setShowAuth(true);
                        } else if (currentUser && currentUser.email && currentUser.email_verified === false && item.href !== '/encyclopedia' && item.href !== '/support') {
                          e.preventDefault();
                          sound.playWrong();
                          setIsEmailVerifyOpen(true);
                        } else {
                          sound.playClick();
                        }
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/25 border-b-4 border-emerald-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-700 text-emerald-100' : item.badgeColor
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

        {/* Footer User Profile Card */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
          <div
            onClick={() => {
              sound.playClick();
              setShowAuth(true);
            }}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">
                {currentUser?.avatar || '🐱'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate">
                  {currentUser?.display_name || 'Học Viên'}
                </div>
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <span>Level {currentUser?.level || 1}</span>
                  <span>•</span>
                  <span className="text-amber-600">{currentUser?.exp || 0} EXP</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT STAGE (Offset on desktop for the sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-dvh overflow-hidden">
        {/* Top Status Header (Single Minimal Row with Zero Clutter) */}
        <header className="shrink-0 z-30 bg-white lg:bg-white/90 lg:backdrop-blur-md border-b border-slate-100 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Left: Mobile hamburger & Page Title */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sound.playClick();
                    setMobileDrawerOpen(true);
                  }}
                  className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 cursor-pointer shadow-xs border border-slate-200 shrink-0 touch-manipulation select-none"
                  title="Mở menu"
                >
                  <Menu className="w-6 h-6 text-slate-700" />
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <div className="lg:hidden w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-base shrink-0">
                    🐱
                  </div>
                  <h1 className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate max-w-[110px] xs:max-w-[170px] sm:max-w-none">
                    {getPageTitle()}
                  </h1>
                </div>
              </div>

              {/* Right: Gamified Stats (Flame Streak, EXP, Level, Profile) */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Streak Flame Pill */}
                {currentUser && (
                  <div
                    onClick={() => sound.playFlame()}
                    title={`Chuỗi học liên tục ${currentUser.streak || 1} ngày!`}
                    className="flex items-center gap-1 sm:gap-1.5 bg-orange-50 border border-orange-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer hover:scale-105 transition active:scale-95 select-none"
                  >
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-orange-500 animate-flame" />
                    <span className="text-[11px] sm:text-xs font-black text-orange-700">
                      {currentUser.streak || 1}
                    </span>
                    <span className="hidden sm:inline text-[10px] font-extrabold text-orange-600 uppercase">
                      ngày
                    </span>
                  </div>
                )}

                {/* EXP Pill */}
                {currentUser && (
                  <div
                    title={`${currentUser.exp || 0} Điểm kinh nghiệm`}
                    className="hidden xs:flex items-center gap-1 sm:gap-1.5 bg-amber-50 border border-amber-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full select-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
                    <span className="text-[11px] sm:text-xs font-black text-amber-800">
                      {currentUser.exp || 0}
                    </span>
                    <span className="hidden sm:inline text-[10px] font-extrabold text-amber-600 uppercase">
                      EXP
                    </span>
                  </div>
                )}

                {/* Coins Pill (Direct link to Pet Sanctuary Shop) */}
                {currentUser && (
                  <Link
                    href="/pet"
                    onClick={() => sound.playClick()}
                    title={`Số dư: ${currentUser.coins || 0} Coins. Bấm để ghé thăm Khu Vườn Thú Cưng!`}
                    className="flex items-center gap-1 sm:gap-1.5 bg-amber-100/70 hover:bg-amber-100 border border-amber-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer transition select-none hover:scale-105 active:scale-95 shadow-xs"
                  >
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 fill-amber-400 transition-transform hover:scale-110" />
                    <span className="text-[11px] sm:text-xs font-black text-amber-900">
                      {currentUser.coins || 0}
                    </span>
                    <span className="hidden sm:inline text-[10px] font-extrabold text-amber-700 uppercase">
                      Coins
                    </span>
                  </Link>
                )}

                {/* Level Pill */}
                {currentUser && (
                  <div
                    title={`Cấp độ học viên`}
                    className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full select-none"
                  >
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-800">
                      Lv.{currentUser.level || 1}
                    </span>
                  </div>
                )}

                {/* User Avatar Button */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowAuth(true);
                  }}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl text-xs font-bold transition border border-slate-200 cursor-pointer shadow-xs"
                >
                  <span className="text-sm">{currentUser?.avatar || '🐱'}</span>
                  <span className="hidden sm:inline max-w-[90px] truncate">
                    {currentUser?.display_name || 'Đăng Nhập'}
                  </span>
                </button>
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
              onClick={() => {
                sound.playClick();
                setIsEmailVerifyOpen(true);
              }}
              className="shrink-0 px-2.5 sm:px-3 py-1 bg-white hover:bg-amber-50 text-amber-900 rounded-xl text-[10px] sm:text-[11px] font-black transition cursor-pointer shadow-sm active:scale-95"
            >
              Kích hoạt ngay ✉️
            </button>
          </div>
        )}

        <main
          className="flex-1 min-h-0 flex flex-col w-full overflow-y-auto overscroll-y-contain custom-scrollbar pb-24 lg:pb-0"
        >
          {children}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (Native App Feel on Handheld Devices) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 h-16 pb-[calc(env(safe-area-inset-bottom,0px))] flex items-center justify-around px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
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
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-extrabold transition cursor-pointer touch-manipulation ${
                isActive
                  ? 'text-emerald-600 scale-105'
                  : 'text-slate-400 hover:text-slate-700'
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
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-extrabold text-slate-400 hover:text-slate-700 cursor-pointer touch-manipulation select-none ${
            mobileDrawerOpen ? 'text-emerald-600' : ''
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>Thêm</span>
        </button>
      </nav>

      {/* 4. MOBILE SLIDE-OVER DRAWER (When pressing Menu on Mobile) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              sound.playClick();
              setMobileDrawerOpen(false);
            }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto z-10 animate-drawer-slide pointer-events-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 font-black text-lg text-slate-900">
                  <span className="text-2xl">🐱</span>
                  <span>Meow<span className="text-emerald-600">lish</span></span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sound.playClick();
                    setMobileDrawerOpen(false);
                  }}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer touch-manipulation"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Navigation Groups in Drawer */}
              <div className="space-y-5">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">
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
                            className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition touch-manipulation ${
                              isActive
                                ? 'bg-emerald-500 text-white font-black shadow-xs'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-emerald-700 text-emerald-100' : item.badgeColor
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
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileDrawerOpen(false);
                  setShowAuth(true);
                }}
                className="w-full btn-3d btn-3d-white p-3 text-xs font-black text-slate-800 touch-manipulation"
              >
                <span>{currentUser?.avatar || '🐱'}</span>
                <span>{currentUser ? currentUser.display_name : 'Đăng Nhập Tài Khoản'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUTH MODAL */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        currentUser={currentUser}
        onAuthChange={(user) => setCurrentUser(user)}
      />

      {/* 6. EMAIL VERIFICATION MODAL */}
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
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flame,
  BookOpen,
  Mic,
  PenTool,
  Bookmark,
  Layers,
  Sparkles,
  User,
  Headphones,
  Gamepad2,
  Menu,
  X,
  Compass,
  Library,
  Trophy,
  LogIn,
  LogOut,
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { AuthUser, getCurrentUser, clearStoredUser } from '@/lib/auth';
import AuthModal from './AuthModal';

const NAV_LINKS = [
  { href: '/', label: 'Lộ Trình', icon: Compass },
  { href: '/exam', label: 'Bộ Đề Thi & Test', icon: Trophy, highlight: true },
  { href: '/encyclopedia', label: 'Bách Khoa Toàn Thư', icon: Library, highlight: true },
  { href: '/grammar', label: 'Ngữ Pháp Lego', icon: BookOpen },
  { href: '/vocabulary', label: 'Từ Vựng IT & Daily', icon: Sparkles },
  { href: '/practice/speaking', label: 'Luyện Nói Voice', icon: Mic },
  { href: '/practice/writing', label: 'Luyện Viết', icon: PenTool },
  { href: '/practice/listening', label: 'Luyện Nghe', icon: Headphones },
  { href: '/practice/roleplay', label: 'Đóng Vai', icon: Gamepad2 },
  { href: '/flashcards', label: 'Flashcard 3D', icon: Layers },
  { href: '/bookmarks', label: 'Sổ Bookmark', icon: Bookmark },
];

export default function Navbar() {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync user state on mount and on custom event
  useEffect(() => {
    const syncUser = () => {
      const user = getCurrentUser();
      setCurrentUser(user);

      // Also refresh live stats from database
      if (user?.id) {
        fetch(`/api/progress?userId=${user.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.user) {
              setCurrentUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
            }
          })
          .catch(() => {});
      }
    };

    syncUser();

    window.addEventListener('auth-state-changed', syncUser);
    return () => window.removeEventListener('auth-state-changed', syncUser);
  }, []);

  const navLinks = NAV_LINKS;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-100 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <Link
              href="/"
              onClick={() => sound.playClick()}
              className="flex items-center gap-2.5 font-black text-lg sm:text-xl text-slate-900 tracking-tight group shrink-0"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform text-xl">
                🦉
              </div>
              <div className="flex flex-col">
                <span className="leading-none text-slate-900 font-extrabold text-base sm:text-lg">
                  English<span className="text-emerald-600">ForMe</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Giao Tiếp Thực Chiến
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.slice(0, 6).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => sound.playClick()}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                        : item.highlight
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Stats & Profile Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {currentUser ? (
                <>
                  {/* Streak Pill */}
                  <div
                    onClick={() => sound.playFlame()}
                    title={`Chuỗi học liên tục ${currentUser.streak || 1} ngày!`}
                    className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full cursor-pointer hover:scale-105 transition"
                  >
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-flame" />
                    <span className="text-xs font-black text-orange-700">
                      {currentUser.streak || 1}
                    </span>
                  </div>

                  {/* EXP Pill */}
                  <div
                    title={`${currentUser.exp || 0} Điểm kinh nghiệm`}
                    className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span className="text-xs font-bold text-amber-800">
                      {currentUser.exp || 0}
                    </span>
                  </div>

                  {/* Coins Pill */}
                  <Link
                    href="/pet"
                    onClick={() => sound.playClick()}
                    title={`Số dư: ${currentUser.coins || 1000} Coins (Bấm để ghé thăm Khu Vườn & Cửa Hàng)`}
                    className="hidden md:flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-black text-amber-800 transition cursor-pointer"
                  >
                    <span>🪙</span>
                    <span>{currentUser.coins || 1000}</span>
                  </Link>

                  {/* User Profile Button */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowAuth(true);
                    }}
                    title="Xem hồ sơ cá nhân"
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-2xl text-xs font-bold transition border border-slate-200 cursor-pointer shadow-xs"
                  >
                    <span className="text-sm">{currentUser.avatar || '🦉'}</span>
                    <span className="max-w-[90px] truncate hidden sm:inline">
                      {currentUser.display_name}
                    </span>
                  </button>

                  {/* Logout Icon Button */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      clearStoredUser();
                      setCurrentUser(null);
                    }}
                    title="Đăng xuất khỏi thiết bị"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowAuth(true);
                  }}
                  className="btn-3d btn-3d-emerald px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>
              )}

              {/* Mobile Menu Hamburger Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar for Desktop Extra Links */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => sound.playClick()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : item.highlight
                      ? 'bg-amber-100 text-amber-900 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t border-slate-100 grid grid-cols-2 gap-2 animate-in fade-in duration-150">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      sound.playClick();
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : item.highlight
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        currentUser={currentUser}
        onAuthChange={(user) => setCurrentUser(user)}
      />
    </>
  );
}

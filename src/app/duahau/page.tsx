'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Coins,
  Award,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  CloudUpload,
  ArrowLeft,
  Edit3,
  Trash2,
  Eye,
  LogOut,
  Flame,
  Sparkles,
  Mail,
  Send,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { maskEmail } from '@/lib/auth';

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  display_name: string;
  avatar: string;
  streak: number;
  exp: number;
  level: number;
  coins: number;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  two_factor_enabled?: boolean | number;
  email_verified?: boolean | number;
  last_active_date?: string;
  created_at: string;
  pet_type?: string;
  pet_name?: string;
  pet_level?: number;
  selected_habitat?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  totalCoins: number;
  s3Status?: {
    configured: boolean;
    bucket: string;
    isSyncing: boolean;
    remoteExists: boolean;
    remoteSize: number | null;
    lastSyncTime: string | null;
    lastSyncStatus: string;
    lastSyncMessage: string;
  };
}

export default function DuaHauAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // 2FA Login Flow States
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginOtp, setLoginOtp] = useState<string>('');
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otpMaskedEmail, setOtpMaskedEmail] = useState<string>('vuki*****02@gmail.com');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(300); // 5 mins

  // Admin Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalType, setModalType] = useState<'coins' | 'level' | 'password' | null>(null);
  const [editCoinsInput, setEditCoinsInput] = useState<number>(0);
  const [editLevelInput, setEditLevelInput] = useState<number>(1);
  const [editExpInput, setEditExpInput] = useState<number>(0);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Show Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    if (type === 'success') sound.playSuccess();
    else sound.playWrong();
    setTimeout(() => setNotification(null), 3500);
  };

  // OTP Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (loginStep === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loginStep, otpCountdown]);

  // Check saved session on mount
  useEffect(() => {
    // Đảm bảo không bao giờ tồn tại tài khoản admin trong localStorage của người dùng
    try {
      const rawUser = localStorage.getItem('english_for_me_user');
      if (rawUser && rawUser.includes('"username":"admin"')) {
        localStorage.removeItem('english_for_me_user');
      }
    } catch {}

    const checkSavedSession = async () => {
      const savedToken = sessionStorage.getItem('duahau_admin_token');
      if (!savedToken) return;

      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify_session', token: savedToken }),
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setAdminToken(savedToken);
          setIsAuthenticated(true);
          fetchAdminData(savedToken);
        } else {
          sessionStorage.removeItem('duahau_admin_token');
          setIsAuthenticated(false);
        }
      } catch {
        sessionStorage.removeItem('duahau_admin_token');
        setIsAuthenticated(false);
      }
    };

    checkSavedSession();
  }, []);

  // Fetch admin stats & user list (Secured with AES-256 Bearer Token)
  const fetchAdminData = async (tokenToUse?: string) => {
    const token = tokenToUse || adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setStats(data.stats || null);
      } else {
        showToast(data.error || 'Không thể tải dữ liệu quản trị', 'error');
        if (res.status === 401) {
          setIsAuthenticated(false);
          setAdminToken(null);
          sessionStorage.removeItem('duahau_admin_token');
          setLoginStep('credentials');
        }
      }
    } catch {
      showToast('Lỗi kết nối máy chủ quản trị', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1: Request 2FA OTP to Email
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setLoginSuccessNotice(null);
    setIsRequestingOtp(true);
    sound.playClick();

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_otp',
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpSessionId(data.sessionId);
        setOtpMaskedEmail(data.maskedEmail || 'vuki*****02@gmail.com');
        setLoginStep('otp');
        setOtpCountdown(300);
        setLoginOtp('');
        setLoginSuccessNotice(data.message || `Mã xác thực 2FA 6 số đã được gửi đến email ${data.maskedEmail || 'vuki*****02@gmail.com'}!`);
        sound.playSuccess();
      } else {
        setLoginError(data.error || 'Tên đăng nhập hoặc mật khẩu quản trị không đúng.');
        sound.playWrong();
      }
    } catch {
      setLoginError('Lỗi kết nối máy chủ khi gửi mã xác thực bảo mật.');
      sound.playWrong();
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // STEP 2: Verify OTP and Obtain Encrypted Session Token
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = loginOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setLoginError('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.');
      sound.playWrong();
      return;
    }

    setLoginError(null);
    setIsVerifyingOtp(true);
    sound.playClick();

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          sessionId: otpSessionId,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sound.playCelebration();
        sessionStorage.setItem('duahau_admin_token', data.token);
        setAdminToken(data.token);
        setIsAuthenticated(true);
        setLoginStep('credentials');
        setLoginPassword('');
        setLoginOtp('');
        fetchAdminData(data.token);
        showToast('Xác thực 2 lớp thành công! Chào mừng Quản trị viên.', 'success');
      } else {
        setLoginError(data.error || 'Mã xác thực không chính xác.');
        sound.playWrong();
      }
    } catch {
      setLoginError('Lỗi kết nối máy chủ khi xác minh mã OTP.');
      sound.playWrong();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = () => {
    sound.playClick();
    sessionStorage.removeItem('duahau_admin_token');
    try {
      const rawUser = localStorage.getItem('english_for_me_user');
      if (rawUser && rawUser.includes('"username":"admin"')) {
        localStorage.removeItem('english_for_me_user');
      }
    } catch {}
    setAdminToken(null);
    setIsAuthenticated(false);
    setLoginStep('credentials');
    setLoginPassword('');
    setLoginOtp('');
    setUsers([]);
    setStats(null);
  };

  // Perform Admin User Actions (Secured with AES-256 Bearer Token)
  const executeAdminAction = async (payload: any) => {
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) {
      showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
      setIsAuthenticated(false);
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token,
          ...payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setModalType(null);
        setSelectedUser(null);
        fetchAdminData(token);
      } else {
        showToast(data.error || 'Thao tác thất bại', 'error');
        if (res.status === 401) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('duahau_admin_token');
        }
      }
    } catch {
      showToast('Lỗi máy chủ khi thực hiện thao tác', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Trigger Filebase Backup (Secured with Bearer Token)
  const handleTriggerBackup = async () => {
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    setIsBackingUp(true);
    sound.playClick();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token,
          action: 'trigger_backup',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        fetchAdminData(token);
      } else {
        showToast(data.error || 'Sao lưu thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối S3 Filebase', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return u.status !== 'disabled';
    if (statusFilter === 'disabled') return u.status === 'disabled';
    return true;
  });

  // =========================================================================
  // VIEW 1: ADMIN LOGIN SCREEN (MÀN HÌNH ĐĂNG NHẬP BẢO MẬT 2FA DƯA HẤU)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-slate-100 flex items-center justify-center p-4 select-none">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Neon Glow Watermelon Accents */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-emerald-500 text-3xl shadow-lg ring-4 ring-rose-500/20 mb-2">
              {loginStep === 'credentials' ? '🍉' : '🛡️'}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>{loginStep === 'credentials' ? 'Quản Trị Dưa Hấu' : 'Xác Thực 2 Lớp (2FA)'}</span>
              <span className="text-xs bg-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {loginStep === 'credentials'
                ? 'Hệ thống bảo mật AES-256-GCM & Xác thực qua Email'
                : 'Nhập mã 6 chữ số đã được gửi tới email quản trị'}
            </p>
          </div>

          {/* Success notice */}
          {loginSuccessNotice && (
            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{loginSuccessNotice}</span>
            </div>
          )}

          {/* Error notice */}
          {loginError && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS INPUT */}
          {loginStep === 'credentials' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tài khoản Quản Trị:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-2.5 text-sm text-white font-mono outline-none transition"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật khẩu Root:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-2.5 text-sm text-white outline-none transition"
                    placeholder="Nhập mật khẩu quản trị..."
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400 flex items-start gap-2">
                <Mail className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Để bảo mật tuyệt đối, hệ thống sẽ gửi mã OTP gồm 6 chữ số về email quản trị{' '}
                  <strong className="text-emerald-400 font-mono">{otpMaskedEmail}</strong> để bạn xác thực trước khi cấp quyền truy cập.
                </span>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full mt-2 py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-emerald-600 hover:opacity-95 active:scale-98 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRequestingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi mã 2FA tới Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Mã Xác Thực 2FA</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP INPUT */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                <div className="text-[11px] text-slate-400">Email nhận mã:</div>
                <div className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                  {otpMaskedEmail}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                  Nhập mã 6 số (OTP):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl py-3 text-center text-3xl font-black text-white font-mono tracking-[0.4em] outline-none transition shadow-inner"
                    placeholder="••••••"
                    required
                  />
                </div>
              </div>

              {/* Countdown timer */}
              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Hết hạn: <strong className="text-amber-300 font-mono">{Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={isRequestingOtp || otpCountdown > 240}
                  className="text-xs text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer disabled:opacity-40 disabled:no-underline"
                >
                  {isRequestingOtp ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || loginOtp.trim().length !== 6}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-rose-600 hover:opacity-95 active:scale-98 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra OTP...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Xác Nhận & Đăng Nhập</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('credentials');
                    setLoginError(null);
                    setLoginSuccessNotice(null);
                    setLoginOtp('');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  ← Quay lại nhập mật khẩu
                </button>
              </div>
            </form>
          )}

          {/* Footer Back link */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại ứng dụng học tập</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN CONSOLE (DASHBOARD & USER CONTROLLER)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-black flex items-center gap-2 animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-600 border-emerald-400 text-white'
              : 'bg-rose-600 border-rose-400 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-emerald-500 flex items-center justify-center text-xl shadow-md">
            🍉
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Dưa Hấu Admin
              </h1>
              <span className="text-[10px] bg-rose-600/30 text-rose-400 border border-rose-500/50 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                /duahau
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Trung tâm quản lý thành viên & cơ sở dữ liệu</p>
          </div>
        </div>

        {/* 2FA Security Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl text-[11px] text-emerald-300 font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>Bảo mật 2FA AES-256-GCM: {otpMaskedEmail}</span>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Filebase S3 Quick Backup */}
          <button
            onClick={handleTriggerBackup}
            disabled={isBackingUp}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-sky-950 border border-sky-700/60 hover:bg-sky-900 text-sky-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Thực hiện sao lưu thủ công SQLite lên Filebase S3"
          >
            {isBackingUp ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            <span>{isBackingUp ? 'Đang sao lưu...' : 'Sao Lưu Filebase S3'}</span>
          </button>

          <Link
            href="/"
            onClick={() => {
              try {
                const rawUser = localStorage.getItem('english_for_me_user');
                if (rawUser && rawUser.includes('"username":"admin"')) {
                  localStorage.removeItem('english_for_me_user');
                }
              } catch {}
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Về App</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Đăng xuất khỏi hệ thống quản trị"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {/* MAIN ADMIN CONTENT */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Users */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Tổng Thành Viên</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats?.totalUsers || 0}</div>
            <div className="text-[11px] text-emerald-400 font-medium">Tất cả tài khoản trong SQLite</div>
          </div>

          {/* Card 2: Active Users */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Đang Hoạt Động</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400">{stats?.activeUsers || 0}</div>
            <div className="text-[11px] text-slate-400 font-medium">
              Khóa: <span className="text-rose-400 font-bold">{stats?.disabledUsers || 0}</span> tài khoản
            </div>
          </div>

          {/* Card 3: Total Coins */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Tổng Coins Lưu Thông</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {stats?.totalCoins?.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Số dư xu của mọi thành viên</div>
          </div>

          {/* Card 4: S3 Backup */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Sao Lưu Filebase</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-black text-emerald-400 truncate">
              {stats?.s3Status?.remoteSize
                ? `${(stats.s3Status.remoteSize / 1024 / 1024).toFixed(2)} MB (Synced)`
                : 'Tự động 15 phút'}
            </div>
            <div className="text-[11px] text-slate-400 truncate font-mono">
              Bucket: {stats?.s3Status?.bucket || 'meowlish-db'}
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo username, tên, email..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Hoạt động ({users.filter((u) => u.status !== 'disabled').length})
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'disabled'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Bị khóa ({users.filter((u) => u.status === 'disabled').length})
            </button>
            <button
              onClick={() => fetchAdminData()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Người Dùng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Cấp & EXP</th>
                  <th className="py-3 px-4">Số Xu (Coins)</th>
                  <th className="py-3 px-4">Thú Cưng</th>
                  <th className="py-3 px-4">Hoạt Động</th>
                  <th className="py-3 px-4 text-right">Quản Trị Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      Không tìm thấy người dùng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isRootAdmin = user.username === 'admin';
                    const isDisabled = user.status === 'disabled';

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-800/40 transition ${
                          isDisabled ? 'opacity-65 bg-rose-950/10' : ''
                        }`}
                      >
                        {/* 1. User Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-1.5 rounded-xl bg-slate-800 border border-slate-700">
                              {user.avatar || '🦉'}
                            </span>
                            <div>
                              <div className="font-black text-white flex items-center gap-1.5">
                                <span>{user.display_name}</span>
                                {isRootAdmin && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-mono">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                @{user.username}
                              </div>
                              {user.email && (
                                <div className="text-[10px] text-slate-500 font-mono" title={user.email}>
                                  {maskEmail(user.email)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Status */}
                        <td className="py-3.5 px-4">
                          {isDisabled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                              <Lock className="w-3 h-3" />
                              Bị Khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <Unlock className="w-3 h-3" />
                              Hoạt Động
                            </span>
                          )}
                        </td>

                        {/* 3. Level & EXP */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-sky-400">Lv.{user.level || 1}</div>
                          <div className="text-[11px] text-slate-400">{user.exp || 0} EXP</div>
                        </td>

                        {/* 4. Coins */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-amber-400 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{(user.coins || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* 5. Pet */}
                        <td className="py-3.5 px-4">
                          {user.pet_type ? (
                            <div>
                              <div className="font-bold text-white text-xs capitalize">
                                {user.pet_name || user.pet_type}
                              </div>
                              <div className="text-[10px] text-emerald-400">
                                Lv.{user.pet_level || 1} • {user.pet_type}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs font-mono">Chưa có</span>
                          )}
                        </td>

                        {/* 6. Activity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-xs text-orange-400 font-bold">
                            <Flame className="w-3 h-3" />
                            <span>{user.streak || 0} ngày</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {user.last_active_date || 'Gần đây'}
                          </div>
                        </td>

                        {/* 7. Action Tools */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Enable/Disable Toggle */}
                            {!isRootAdmin && (
                              <button
                                onClick={() =>
                                  executeAdminAction({
                                    action: 'toggle_status',
                                    targetUserId: user.id,
                                  })
                                }
                                disabled={isSubmittingAction}
                                className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                  isDisabled
                                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 hover:bg-emerald-600 hover:text-white'
                                    : 'bg-rose-600/20 text-rose-300 border-rose-500 hover:bg-rose-600 hover:text-white'
                                }`}
                                title={isDisabled ? 'Kích hoạt lại tài khoản' : 'Khóa tài khoản'}
                              >
                                {isDisabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Set Coins */}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEditCoinsInput(user.coins || 0);
                                setModalType('coins');
                              }}
                              className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                              title="Chỉnh sửa số Xu (Set Coins)"
                            >
                              <Coins className="w-4 h-4" />
                            </button>

                            {/* Set Level & EXP */}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEditLevelInput(user.level || 1);
                                setEditExpInput(user.exp || 0);
                                setModalType('level');
                              }}
                              className="p-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500 hover:text-white transition cursor-pointer"
                              title="Chỉnh sửa Cấp độ & EXP (Set Level)"
                            >
                              <Award className="w-4 h-4" />
                            </button>

                            {/* Set Password */}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setNewPasswordInput('');
                                setModalType('password');
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                              title="Đặt lại mật khẩu cho thành viên"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ================= MODAL: EDIT COINS ================= */}
      {modalType === 'coins' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-black text-base">
              <Coins className="w-5 h-5" />
              <span>Chỉnh Sửa Xu: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Cập nhật trực tiếp số dư Coins cho tài khoản {selectedUser.display_name}.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Số Coins mới:</label>
              <input
                type="number"
                min="0"
                value={editCoinsInput}
                onChange={(e) => setEditCoinsInput(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-base font-black text-amber-300 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  executeAdminAction({
                    action: 'set_coins',
                    targetUserId: selectedUser.id,
                    coins: editCoinsInput,
                  })
                }
                disabled={isSubmittingAction}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT LEVEL & EXP ================= */}
      {modalType === 'level' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-sky-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-black text-base">
              <Award className="w-5 h-5" />
              <span>Chỉnh Sửa Cấp Độ: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Thiết lập Level và điểm kinh nghiệm EXP cho {selectedUser.display_name}.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cấp Độ (Level):</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={editLevelInput}
                  onChange={(e) => setEditLevelInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-2xl px-4 py-2 text-sm font-black text-sky-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Điểm EXP:</label>
                <input
                  type="number"
                  min="0"
                  value={editExpInput}
                  onChange={(e) => setEditExpInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-2xl px-4 py-2 text-sm font-black text-sky-300 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  executeAdminAction({
                    action: 'set_level',
                    targetUserId: selectedUser.id,
                    level: editLevelInput,
                    exp: editExpInput,
                  })
                }
                disabled={isSubmittingAction}
                className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs cursor-pointer disabled:opacity-50"
              >
                Cập Nhật Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SET PASSWORD ================= */}
      {modalType === 'password' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-black text-base">
              <KeyRound className="w-5 h-5" />
              <span>Đổi Mật Khẩu: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Nhập mật khẩu mới cho tài khoản {selectedUser.display_name}. Mật khẩu sẽ được mã hóa SHA-256 an toàn.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mật khẩu mới:</label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Nhập ít nhất 4 ký tự..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-2xl px-4 py-2.5 text-sm font-mono text-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  executeAdminAction({
                    action: 'set_password',
                    targetUserId: selectedUser.id,
                    newPassword: newPasswordInput,
                  })
                }
                disabled={isSubmittingAction || newPasswordInput.trim().length < 4}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer disabled:opacity-50"
              >
                Xác Nhận Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  User,
  Lock,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Zap,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CloudUpload,
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  Plus,
  Users,
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import {
  AuthUser,
  setStoredUser,
  clearStoredUser,
  getSavedAccounts,
  saveAccountToDevice,
  removeSavedAccount,
} from '@/lib/auth';
import { validateRegistrationPassword } from '@/lib/passwordPolicy';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthChange: (user: AuthUser | null) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Multi-account states
  const [savedAccounts, setSavedAccounts] = useState<AuthUser[]>([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  // Tài khoản đang chờ nhập mật khẩu để chuyển phiên (xem handleSwitchToAccount).
  const [switchTarget, setSwitchTarget] = useState<AuthUser | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');

  // Sync saved accounts on modal open
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        saveAccountToDevice(currentUser);
      }
      setSavedAccounts(getSavedAccounts());
      setIsAddingAccount(false);
      // M4: đóng form xác nhận 2FA cũ khi mở lại modal
      setTwoFaConfirmOpen(false);
      setTwoFaPassword('');
    }
  }, [isOpen, currentUser]);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [forgotInput, setForgotInput] = useState('');
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // Status feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // User 2FA Login & Settings states
  const [loginRequires2fa, setLoginRequires2fa] = useState(false);
  const [userOtpSessionId, setUserOtpSessionId] = useState<string | null>(null);
  const [userMaskedEmail, setUserMaskedEmail] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [isToggling2fa, setIsToggling2fa] = useState(false);
  // M4 (audit 2026-10-08): bật/tắt 2FA phải xác thực lại bằng mật khẩu hiện tại
  // — bấm nút chỉ mở form nhỏ xác nhận, request chỉ gửi sau khi nhập đúng MK.
  const [twoFaConfirmOpen, setTwoFaConfirmOpen] = useState(false);
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [isConfirming2fa, setIsConfirming2fa] = useState(false);

  // H8 (audit 2026-10-08): focus-trap + Esc + trả focus về trigger khi đóng.
  // - Mở modal: nhớ element đang focus (nút trigger), đưa focus vào control đầu
  //   tiên trong modal — trước đây Tab thoát modal ngay từ nhịp #0 vì focus
  //   vẫn nằm ở body (ngoài overlay) nên Tab nhảy sang nội dung trang phía sau.
  // - Tab / Shift-Tab: cycle trong modal, không thoát ra ngoài.
  // - Esc: đóng modal qua onClose.
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    triggerRef.current = (document.activeElement as HTMLElement) || null;

    // Đưa focus vào control đầu tiên — đợi 1 frame để các node con đã mount.
    const raf = requestAnimationFrame(() => {
      const container = modalRef.current;
      if (!container) return;
      const first = container.querySelector<HTMLElement>(FOCUSABLE) || container;
      first.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Chặn lan truyền để component phía sau không xử lý kép Esc.
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const container = modalRef.current;
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && container.contains(current);
      if (e.shiftKey) {
        if (!inside || current === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // capture=true: bắt phím sớm, kể cả khi focus chưa nằm trong modal.
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown, true);
      // Trả focus về trigger khi modal đóng/unmount.
      const prev = triggerRef.current;
      if (prev && document.contains(prev)) {
        prev.focus();
      }
      triggerRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Cat mascot pointer that appears to the left of the active/hovered input box
  const CatPointer = ({ isVisible }: { isVisible: boolean }) => (
    <div
      className={`absolute -left-11 sm:-left-12 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out z-30 ${
        isVisible
          ? 'opacity-100 translate-x-0 scale-100 rotate-0'
          : 'opacity-0 -translate-x-3 scale-75 -rotate-6'
      }`}
    >
      <Image
        src="/meo.png"
        alt="Mèo trỏ bút"
        width={176}
        height={144}
        sizes="44px"
        className="w-9 sm:w-11 h-auto drop-shadow-md select-none pointer-events-none"
      />
    </div>
  );

  // Switch between Login, Register, Forgot tabs smoothly
  const handleTabClick = (newMode: 'login' | 'register' | 'forgot') => {
    sound.playClick();
    setError(null);
    setSuccessMsg(null);
    setLoginRequires2fa(false);
    setOtpInput('');
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    sound.playClick();

    // 1. FORGOT PASSWORD
    if (mode === 'forgot') {
      if (!forgotInput.trim()) {
        setError('Vui lòng nhập địa chỉ email hoặc tên đăng nhập của bạn.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          sound.playError();
          setError(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
        } else {
          sound.playSuccess();
          setSuccessMsg(data.message || 'Mật khẩu mới đã được thiết lập!');
        }
      } catch {
        setError('Lỗi kết nối máy chủ, vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. LOGIN & REGISTER
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    // M3 (audit 2026-10-08): validate phía client khớp chính sách mật khẩu đăng
    // ký của server (≥8 ký tự + 1 hoa + 1 thường + 1 số, chặn mật khẩu phổ biến)
    // để UX nhất quán — server vẫn là lớp cuối cùng bắt buộc.
    if (mode === 'register') {
      const policyError = validateRegistrationPassword(password.trim());
      if (policyError) {
        sound.playWrong();
        setError(policyError);
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        action: mode,
        username: username.trim(),
        password: password.trim(),
        displayName: displayName.trim(),
      };
      if (mode === 'register') {
        payload.email = email.trim();
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        sound.playError();
        setError(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      } else if (data.requires_2fa) {
        // User has 2FA enabled -> prompt for OTP
        sound.playSuccess();
        setLoginRequires2fa(true);
        setUserOtpSessionId(data.sessionId);
        setUserMaskedEmail(data.maskedEmail);
        setSuccessMsg(data.message || 'Mã xác thực 2FA đã được gửi đến email đăng ký của bạn.');
      } else {
        sound.playSuccess();
        setSuccessMsg(
          data.message ||
            (mode === 'login'
              ? 'Đăng nhập thành công! Chúc bạn học tốt.'
              : 'Đăng ký thành công! Bạn nhận được 1.000 Coins 🪙')
        );
        setStoredUser(data.user);
        onAuthChange(data.user);
        setIsAddingAccount(false);

        // If newly registered user with email needs verification:
        if (data.requires_email_verification && data.verifySessionId) {
          window.dispatchEvent(
            new CustomEvent('open-email-verify-modal', {
              detail: { sessionId: data.verifySessionId },
            })
          );
        }

        setTimeout(() => {
          onClose();
          setError(null);
          setSuccessMsg(null);
        }, 800);
      }
    } catch {
      setError('Lỗi kết nối máy chủ, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // VERIFY 2FA FOR USER LOGIN
  const handleVerify2faLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.');
      sound.playWrong();
      return;
    }

    setLoading(true);
    setError(null);
    sound.playClick();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_2fa',
          sessionId: userOtpSessionId,
          otp: otpInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        sound.playCelebration();
        setSuccessMsg('Xác thực 2 lớp thành công! Đang vào học...');
        setStoredUser(data.user);
        onAuthChange(data.user);
        setIsAddingAccount(false);
        setTimeout(() => {
          onClose();
          setLoginRequires2fa(false);
          setOtpInput('');
          setError(null);
          setSuccessMsg(null);
        }, 600);
      } else {
        sound.playWrong();
        setError(data.error || 'Mã OTP không chính xác.');
      }
    } catch {
      sound.playWrong();
      setError('Lỗi kết nối máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  // TOGGLE 2FA FOR CURRENT LOGGED IN USER
  // M4 (audit 2026-10-08): server BẮT BUỘC currentPassword cho toggle_2fa
  // (re-auth chống session hijack), nên bấm nút chỉ MỞ form nhập mật khẩu xác
  // nhận — giữ UX đơn giản: 1 input mật khẩu hiện tại + nút xác nhận.
  const handleToggle2fa = () => {
    if (!currentUser) return;
    if (!currentUser.email) {
      setError('Tài khoản cần có email trước khi bật xác thực 2 lớp (2FA).');
      sound.playWrong();
      return;
    }

    sound.playClick();
    setTwoFaPassword('');
    setTwoFaConfirmOpen(true);
  };

  const confirmToggle2fa = async () => {
    if (!currentUser) return;
    if (!twoFaPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại để xác nhận.');
      sound.playWrong();
      return;
    }

    setIsConfirming2fa(true);
    setIsToggling2fa(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_2fa',
          userId: currentUser.id,
          enable: !currentUser.two_factor_enabled,
          currentPassword: twoFaPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        sound.playSuccess();
        setStoredUser(data.user);
        onAuthChange(data.user);
        setSuccessMsg(data.message);
        setTwoFaConfirmOpen(false);
        setTwoFaPassword('');
      } else {
        sound.playWrong();
        setError(data.error || 'Không thể thay đổi cài đặt bảo mật.');
      }
    } catch {
      sound.playWrong();
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setIsToggling2fa(false);
      setIsConfirming2fa(false);
    }
  };

  const handleFillDemo = async () => {
    sound.playClick();
    setUsername('demo');
    setPassword('123456');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: 'demo',
          password: '123456',
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        sound.playSuccess();
        setStoredUser(data.user);
        onAuthChange(data.user);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sound.playClick();
    clearStoredUser();
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {});
    onAuthChange(null);
    onClose();
  };

  const handleSwitchToAccount = async (targetAccount: AuthUser) => {
    sound.playClick();
    setError(null);
    setSuccessMsg(null);

    // Chuyển tài khoản PHẢI đăng nhập lại bằng mật khẩu, không chỉ đổi hồ sơ ở
    // localStorage.
    //
    // Vì sao: bản vá IDOR đã gỡ việc `GET /api/auth?userId=<tài khoản khác>` trả
    // hồ sơ đầy đủ, giờ chỉ còn `{id, username, status}`. Nếu cứ
    // `setStoredUser(data.user)` thì giao diện hiện tài khoản mới nhưng cookie
    // phiên vẫn là tài khoản CŨ ⇒ mọi thao tác ghi (lưu bookmark, ghi tiến độ,
    // mua đồ…) trả 403 "IDOR". Người dùng bấm "đổi tài khoản" xong thì mọi thứ
    // hỏng và không có lối ra. Đã xác nhận trên production.
    setSwitchTarget(targetAccount);
    setSwitchPassword('');
  };

  /** Đăng nhập bằng tài khoản đã lưu (có mật khẩu), rồi cập nhật giao diện. */
  const performSwitchLogin = async (targetAccount: AuthUser, password: string) => {
    setSwitchingId(targetAccount.id);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: targetAccount.username,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        sound.playWrong();
        if (data.requires_2fa) {
          setSwitchTarget(null);
          setLoginRequires2fa(true);
          setUserOtpSessionId(data.sessionId);
          setUserMaskedEmail(data.maskedEmail);
          setSuccessMsg(data.message || 'Mã xác thực đã gửi tới email tài khoản bạn chọn.');
          return;
        }
        if (/vô hiệu hóa|không tồn tại/i.test(data.error || '')) {
          removeSavedAccount(targetAccount.id);
          setSwitchTarget(null);
        }
        setError(data.error || 'Không đăng nhập được tài khoản này.');
        return;
      }

      setStoredUser(data.user);
      onAuthChange(data.user);
      setSwitchTarget(null);
      sound.playCelebration();
      setSuccessMsg(`Đã chuyển sang tài khoản @${data.user.username}!`);
    } catch {
      setError('Lỗi kết nối máy chủ, vui lòng thử lại.');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, accId: string) => {
    e.stopPropagation();
    sound.playClick();
    removeSavedAccount(accId);
    setSavedAccounts(getSavedAccounts());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[10000] w-screen h-screen bg-slate-950 overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Floating Global Close Button */}
      <button
        onClick={onClose}
        title="Đóng cửa sổ"
        aria-label="Đóng cửa sổ"
        className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white/90 hover:text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 cursor-pointer shadow-2xl active:scale-95"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Full-Screen Split Layout: Fixed 30% Form on Left / 70% Image on Right */}
      <div className="flex flex-col md:flex-row w-full h-full overflow-hidden bg-slate-950">
        {/* ========================================================================= */}
        {/* 30% FORM CONTAINER (FIXED ON LEFT) */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[35%] lg:w-[30%] h-full flex flex-col justify-between py-6 sm:py-8 lg:py-10 pr-6 sm:pr-8 lg:pr-10 pl-14 sm:pl-16 lg:pl-16 overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 z-20 shadow-2xl shrink-0">
          {/* Top Header & Branding */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xl shadow-xs">
                  🐱
                </div>
                <div>
                  <h1
                    id="auth-modal-title"
                    className="text-lg font-black text-slate-900 dark:text-white tracking-tight"
                  >
                    Meowlish
                  </h1>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    English For Me
                  </p>
                </div>
              </div>
            </div>

            {/* Profile View if User is already Logged In (and not adding another account) */}
            {currentUser && !isAddingAccount ? (
              <div className="space-y-6 pt-4 animate-in fade-in duration-200">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-3xl shadow-sm border border-emerald-200 dark:border-emerald-700">
                      {currentUser.avatar || '👨‍💻'}
                    </div>
                    <div>
                      <div className="font-black text-base text-slate-900 dark:text-white">
                        {currentUser.display_name}
                      </div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        @{currentUser.username}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 text-center">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Streak</span>
                      <span className="text-base font-black text-orange-500">🔥 {currentUser.streak} ngày</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Coins</span>
                      <span className="text-base font-black text-amber-500">🪙 {currentUser.coins || 1000}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Điểm EXP</span>
                      <span className="text-base font-black text-emerald-500">⭐ {currentUser.exp}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Cấp Độ</span>
                      <span className="text-base font-black text-cyan-500">Lv.{currentUser.level}</span>
                    </div>
                  </div>

                  {/* 2FA & Security Settings Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-white">Bảo Mật 2 Lớp (2FA)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggle2fa}
                        disabled={isToggling2fa}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          currentUser.two_factor_enabled
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${currentUser.two_factor_enabled ? 'bg-white' : 'bg-slate-400'}`} />
                        <span>{isToggling2fa ? '...' : currentUser.two_factor_enabled ? 'Đang Bật' : 'Đang Tắt'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {currentUser.two_factor_enabled
                        ? 'Đang bật bảo vệ. Mỗi lần đăng nhập hệ thống sẽ gửi mã OTP về email của bạn.'
                        : 'Bật để nhận mã OTP 6 số qua email mỗi khi đăng nhập trên thiết bị mới.'}
                    </p>

                    {/* M4 (audit 2026-10-08): xác nhận bằng mật khẩu hiện tại
                        trước khi bật/tắt 2FA — yêu cầu re-auth của server. */}
                    {twoFaConfirmOpen && (
                      <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-2">
                          Nhập mật khẩu hiện tại để {currentUser.two_factor_enabled ? 'tắt' : 'bật'} bảo mật 2 lớp
                        </div>
                        <input
                          type="password"
                          value={twoFaPassword}
                          onChange={(e) => setTwoFaPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && twoFaPassword && !isConfirming2fa) {
                              confirmToggle2fa();
                            }
                          }}
                          placeholder="Mật khẩu hiện tại"
                          autoFocus
                          className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={confirmToggle2fa}
                            disabled={!twoFaPassword || isConfirming2fa}
                            className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
                          >
                            {isConfirming2fa ? 'Đang xác nhận…' : 'Xác nhận'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTwoFaConfirmOpen(false);
                              setTwoFaPassword('');
                            }}
                            className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 min-h-[44px]"
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Email Verification Status */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Email tài khoản</div>
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                          {currentUser.email || 'Chưa liên kết email'}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {currentUser.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Đã kích hoạt
                          </span>
                        ) : currentUser.email ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              window.dispatchEvent(new CustomEvent('open-email-verify-modal'));
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700 hover:bg-amber-100 transition cursor-pointer"
                          >
                            <Mail className="w-3 h-3" /> Kích hoạt ngay
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Cần email</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chuyển đổi nhanh giữa các tài khoản đã lưu trên thiết bị */}
                {savedAccounts.filter((acc) => acc.id !== currentUser.id).length > 0 && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                          Đổi Tài Khoản Nhanh ({savedAccounts.filter((acc) => acc.id !== currentUser.id).length})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">Đã lưu trên máy</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {/* Ô nhập mật khẩu để chuyển tài khoản: bắt buộc phải xác thực
                          lại, nếu không giao diện đổi tài khoản nhưng cookie phiên vẫn
                          là tài khoản cũ ⇒ mọi thao tác ghi đều bị chặn 403. */}
                      {switchTarget && (
                        <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-2">
                            Nhập mật khẩu để chuyển sang @{switchTarget.username}
                          </div>
                          <input
                            type="password"
                            value={switchPassword}
                            onChange={(e) => setSwitchPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && switchPassword) {
                                performSwitchLogin(switchTarget, switchPassword);
                              }
                            }}
                            placeholder="Mật khẩu"
                            autoFocus
                            className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => performSwitchLogin(switchTarget, switchPassword)}
                              disabled={!switchPassword || switchingId === switchTarget.id}
                              className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
                            >
                              {switchingId === switchTarget.id ? 'Đang chuyển…' : 'Chuyển tài khoản'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSwitchTarget(null);
                                setSwitchPassword('');
                              }}
                              className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 min-h-[44px]"
                            >
                              Huỷ
                            </button>
                          </div>
                        </div>
                      )}

                      {savedAccounts
                        .filter((acc) => acc.id !== currentUser.id)
                        .map((acc) => (
                          <div
                            key={acc.id}
                            onClick={() => handleSwitchToAccount(acc)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="text-2xl shrink-0">{acc.avatar || '🐱'}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 transition">
                                  {acc.display_name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 truncate">
                                  @{acc.username}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                                {switchingId === acc.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  'Đổi sang ⚡'
                                )}
                              </span>
                              <button
                                type="button"
                                title="Xóa khỏi danh sách thiết bị này"
                                aria-label="Xóa khỏi danh sách thiết bị này"
                                onClick={(e) => handleRemoveAccount(e, acc.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Hàng nút tác vụ: Đăng nhập thêm tài khoản & Đăng xuất */}
                <div className="space-y-2.5 pt-1">
                  <div
                    className="relative"
                    onMouseEnter={() => setActiveInput('add-account-btn')}
                    onMouseLeave={() => setActiveInput(null)}
                  >
                    <CatPointer isVisible={activeInput === 'add-account-btn'} />
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsAddingAccount(true);
                        setMode('login');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className={`w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-98 ${
                        activeInput === 'add-account-btn' ? 'translate-x-1 ring-2 ring-emerald-400/40' : ''
                      }`}
                    >
                      <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Đăng Nhập Thêm Tài Khoản Mới
                    </button>
                  </div>

                  <div
                    className="relative"
                    onMouseEnter={() => setActiveInput('logout-btn')}
                    onMouseLeave={() => setActiveInput(null)}
                  >
                    <CatPointer isVisible={activeInput === 'logout-btn'} />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 ${
                        activeInput === 'logout-btn' ? 'translate-x-1 ring-2 ring-rose-400/40' : ''
                      }`}
                    >
                      <LogOut className="w-4 h-4" /> Đăng Xuất Khỏi Thiết Bị
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* 3 TABS ON THE SAME ROW: Đăng Nhập | Đăng Ký | Quên Mật Khẩu */
              /* ========================================================================= */
              <div>
                {/* Back to current account button if in adding account mode */}
                {isAddingAccount && currentUser && (
                  <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsAddingAccount(false);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ← Quay lại tài khoản ({currentUser.display_name})
                    </button>
                    <span className="text-[10px] text-slate-400 font-semibold">Thêm tài khoản</span>
                  </div>
                )}
                {/* Switcher: 3 buttons on the same row */}
                <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl text-xs font-bold gap-1 mb-6 border border-slate-200 dark:border-slate-700/60 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleTabClick('login')}
                    className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mode === 'login'
                        ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Đăng Nhập</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabClick('register')}
                    className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mode === 'register'
                        ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Đăng Ký</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabClick('forgot')}
                    className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mode === 'forgot'
                        ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Quên Mật Khẩu</span>
                  </button>
                </div>

                {/* Form Titles */}
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {mode === 'login' && 'Đăng Nhập'}
                    {mode === 'register' && 'Đăng Ký Tài Khoản'}
                    {mode === 'forgot' && 'Khôi Phục Mật Khẩu'}
                  </h2>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2FA LOGIN OTP OR STANDARD FORMS */}
                {/* ========================================================================= */}
                {loginRequires2fa ? (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Email nhận mã xác thực 2FA:</div>
                      <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {userMaskedEmail}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                        Nhập mã OTP 6 chữ số:
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-500 rounded-2xl py-3 text-center text-3xl font-black text-slate-900 dark:text-white font-mono tracking-[0.4em] outline-none transition shadow-inner"
                        placeholder="••••••"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerify2faLogin}
                      disabled={loading || otpInput.trim().length !== 6}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 text-xs sm:text-sm transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>Xác Nhận & Đăng Nhập (2FA)</span>
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginRequires2fa(false);
                          setOtpInput('');
                          setError(null);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                      >
                        ← Quay lại nhập mật khẩu
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* FORM 1: LOGIN */}
                  {mode === 'login' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Tên đăng nhập:
                        </label>
                        <div
                          className="relative"
                          onMouseEnter={() => setActiveInput('login-username')}
                          onMouseLeave={() => setActiveInput((cur) => cur === 'login-username' ? null : cur)}
                        >
                          <CatPointer isVisible={activeInput === 'login-username'} />
                          <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={username}
                            onFocus={() => setActiveInput('login-username')}
                            onBlur={() => setActiveInput((cur) => cur === 'login-username' ? null : cur)}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tên đăng nhập của bạn..."
                            className={`w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-2xl text-xs font-medium focus:outline-none transition-all select-text ${
                              activeInput === 'login-username'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-x-1'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Mật khẩu:
                        </label>
                        <div
                          className="relative"
                          onMouseEnter={() => setActiveInput('login-password')}
                          onMouseLeave={() => setActiveInput((cur) => cur === 'login-password' ? null : cur)}
                        >
                          <CatPointer isVisible={activeInput === 'login-password'} />
                          <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onFocus={() => setActiveInput('login-password')}
                            onBlur={() => setActiveInput((cur) => cur === 'login-password' ? null : cur)}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu..."
                            className={`w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-2xl text-xs font-medium focus:outline-none transition-all select-text ${
                              activeInput === 'login-password'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-x-1'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            aria-pressed={showPassword}
                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORM 2: REGISTER */}
                  {mode === 'register' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Tên hiển thị:
                        </label>
                        <div
                          className="relative"
                          onMouseEnter={() => setActiveInput('register-displayName')}
                          onMouseLeave={() => setActiveInput((cur) => cur === 'register-displayName' ? null : cur)}
                        >
                          <CatPointer isVisible={activeInput === 'register-displayName'} />
                          <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={displayName}
                            onFocus={() => setActiveInput('register-displayName')}
                            onBlur={() => setActiveInput((cur) => cur === 'register-displayName' ? null : cur)}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="VD: Tuấn Anh (IT Dev)"
                            className={`w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-2xl text-xs font-medium focus:outline-none transition-all select-text ${
                              activeInput === 'register-displayName'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-x-1'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Địa chỉ Email:
                        </label>
                        <div
                          className="relative"
                          onMouseEnter={() => setActiveInput('register-email')}
                          onMouseLeave={() => setActiveInput((cur) => cur === 'register-email' ? null : cur)}
                        >
                          <CatPointer isVisible={activeInput === 'register-email'} />
                          <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onFocus={() => setActiveInput('register-email')}
                            onBlur={() => setActiveInput((cur) => cur === 'register-email' ? null : cur)}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="VD: tuananh@example.com"
                            className={`w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-2xl text-xs font-medium focus:outline-none transition-all select-text ${
                              activeInput === 'register-email'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-x-1'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Tên đăng nhập (viết liền):
                        </label>
                        <div
                          className="relative"
                          onMouseEnter={() => setActiveInput('register-username')}
                          onMouseLeave={() => setActiveInput((cur) => cur === 'register-username' ? null : cur)}
                        >
                          <CatPointer isVisible={activeInput === 'register-username'} />
                          <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={username}
                            onFocus={() => setActiveInput('register-username')}
                            onBlur={() => setActiveInput((cur) => cur === 'register-username' ? null : cur)}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="VD: tuananh2026"
                            className={`w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-2xl text-xs font-mono focus:outline-none transition-all select-text ${
                              activeInput === 'register-username'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-x-1'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Mật khẩu:
                        </label>
                        <div
                          className="relative"
                          onMouseEnter={() => setActiveInput('register-password')}
                          onMouseLeave={() => setActiveInput((cur) => cur === 'register-password' ? null : cur)}
                        >
                          <CatPointer isVisible={activeInput === 'register-password'} />
                          <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onFocus={() => setActiveInput('register-password')}
                            onBlur={() => setActiveInput((cur) => cur === 'register-password' ? null : cur)}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tạo mật khẩu an toàn..."
                            className={`w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-2xl text-xs font-medium focus:outline-none transition-all select-text ${
                              activeInput === 'register-password'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-x-1'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            aria-pressed={showPassword}
                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Welcome Bonus Notice */}
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Tặng ngay <strong>1.000 Coins 🪙</strong> và <strong>Thú cưng khởi đầu</strong> khi tạo tài khoản!</span>
                      </div>
                    </div>
                  )}

                  {/* FORM 3: FORGOT PASSWORD */}
                  {mode === 'forgot' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Email hoặc Tên đăng nhập của bạn:
                        </label>
                        <div
                          className="relative"
                          onMouseEnter={() => setActiveInput('forgot-input')}
                          onMouseLeave={() => setActiveInput((cur) => cur === 'forgot-input' ? null : cur)}
                        >
                          <CatPointer isVisible={activeInput === 'forgot-input'} />
                          <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={forgotInput}
                            onFocus={() => setActiveInput('forgot-input')}
                            onBlur={() => setActiveInput((cur) => cur === 'forgot-input' ? null : cur)}
                            onChange={(e) => setForgotInput(e.target.value)}
                            placeholder="Nhập email hoặc username đã đăng ký..."
                            className={`w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border rounded-2xl text-xs font-medium focus:outline-none transition-all select-text ${
                              activeInput === 'forgot-input'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 translate-x-1'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>
                          Hệ thống sẽ xác thực và gửi mật khẩu mới về email của bạn, hoặc cấp ngay mã truy cập an toàn.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 text-xs sm:text-sm transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      'Đang xử lý...'
                    ) : mode === 'login' ? (
                      <>
                        <span>Đăng Nhập Vào Học</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : mode === 'register' ? (
                      <>
                        <span>Hoàn Tất Đăng Ký (+1.000 Coins 🪙)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Khôi Phục Mật Khẩu</span>
                        <KeyRound className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

                {/* Quick Demo Login Option */}
                {mode === 'login' && (
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={handleFillDemo}
                      className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Thử nhanh với tài khoản Demo có sẵn (demo / 123456)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note inside form */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              © 2026 Meowlish. Lộ trình phản xạ tiếng Anh tự nhiên.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 70% IMAGE CONTAINER (CINEMATIC CROSSFADE & KEN-BURNS DISSOLVE)            */}
        {/* ========================================================================= */}
        <div className="hidden md:block md:w-[65%] lg:w-[70%] h-full relative overflow-hidden bg-slate-950 select-none">
          {currentUser ? (
            /* Khi đã đăng nhập xong: hiển thị hình nền home.png với hiệu ứng điện ảnh */
            <div className="absolute inset-0 w-full h-full animate-in fade-in duration-700">
              <Image
                src="/home.jpg"
                alt="Meowlish Home"
                fill
                sizes="(min-width: 768px) 70vw, 0px"
                loading="lazy"
                className="object-cover select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            /* Khi chưa đăng nhập: Cinematic Multi-layer Depth Cross-Dissolve */
            <>
              {/* Layer 1: Đăng Nhập */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,filter] ${
                  mode === 'login'
                    ? 'opacity-100 scale-100 filter-none z-10'
                    : 'opacity-0 scale-105 blur-[3px] pointer-events-none z-0'
                }`}
              >
                <Image
                  src="/login.jpg"
                  alt="Meowlish Đăng Nhập"
                  fill
                  sizes="(min-width: 768px) 70vw, 0px"
                  loading="lazy"
                  className="object-cover select-none pointer-events-none"
                />
              </div>

              {/* Layer 2: Đăng Ký */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,filter] ${
                  mode === 'register'
                    ? 'opacity-100 scale-100 filter-none z-10'
                    : 'opacity-0 scale-105 blur-[3px] pointer-events-none z-0'
                }`}
              >
                <Image
                  src="/register.jpg"
                  alt="Meowlish Đăng Ký"
                  fill
                  sizes="(min-width: 768px) 70vw, 0px"
                  loading="lazy"
                  className="object-cover select-none pointer-events-none"
                />
              </div>

              {/* Layer 3: Quên Mật Khẩu */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity,filter] ${
                  mode === 'forgot'
                    ? 'opacity-100 scale-100 filter-none z-10'
                    : 'opacity-0 scale-105 blur-[3px] pointer-events-none z-0'
                }`}
              >
                <Image
                  src="/forgot.jpg"
                  alt="Meowlish Quên Mật Khẩu"
                  fill
                  sizes="(min-width: 768px) 70vw, 0px"
                  loading="lazy"
                  className="object-cover select-none pointer-events-none"
                />
              </div>

              {/* Luminous Light Sweep on tab switch */}
              <div
                key={`sweep-${mode}`}
                className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
              >
                <div className="w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-light-sweep" />
              </div>

              {/* Subtle soft edge gradient on border between form and image */}
              <div className="absolute top-0 bottom-0 left-0 w-12 pointer-events-none bg-gradient-to-r from-black/20 to-transparent z-20" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

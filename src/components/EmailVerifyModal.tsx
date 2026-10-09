'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Clock, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, Send, ArrowLeft } from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { AuthUser, setStoredUser } from '@/lib/auth';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

interface EmailVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  initialSessionId?: string | null;
  onVerified?: (updatedUser: AuthUser) => void;
}

export default function EmailVerifyModal({
  isOpen,
  onClose,
  user,
  initialSessionId,
  onVerified,
}: EmailVerifyModalProps) {
  const [step, setStep] = useState<'request' | 'otp'>(initialSessionId ? 'otp' : 'request');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [customEmail, setCustomEmail] = useState<string>(user?.email || '');
  const [countdown, setCountdown] = useState<number>(300); // 5 mins
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const lastAutoSentTimeRef = React.useRef<number>(0);
  // Timeout đóng modal sau khi xác thực thành công — phải hủy được, nếu không
  // sẽ gọi onClose() của parent sau khi component đã unmount.
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // a11y (audit 2026-10-09): modal OTP trước đây không có role=dialog, không
  // trap focus (Tab thoát ra trang nền) và không đóng được bằng Esc. Dùng lại
  // đúng mẫu của AuthModal.tsx (~dòng 115-178): bắt phím capture, cycle focus,
  // trả focus về trigger khi đóng.
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Esc đóng modal (trừ lúc đang gọi API để không mất kết quả).
  // useCallback để useEscapeToClose không đăng ký lại listener mỗi render.
  const handleEscapeClose = useCallback(() => onCloseRef.current(), []);
  useEscapeToClose(isOpen, handleEscapeClose, !loading && !resending);

  useEffect(() => {
    if (!isOpen) return;

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    triggerRef.current = (document.activeElement as HTMLElement) || null;

    const raf = requestAnimationFrame(() => {
      const container = modalRef.current;
      if (!container) return;
      const first = container.querySelector<HTMLElement>(FOCUSABLE) || container;
      first.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const container = modalRef.current;
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
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

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown, true);
      const prev = triggerRef.current;
      if (prev && document.contains(prev)) prev.focus();
      triggerRef.current = null;
    };
  }, [isOpen]);

  // Dọn timeout đóng modal khi unmount (tránh gọi onClose của component đã chết).
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  // Sync state whenever modal opens: Tự động gửi mã OTP ngay nếu tài khoản đã có email
  useEffect(() => {
    if (!isOpen || !user) return;

    setError(null);
    setSuccess(null);
    setOtp('');

    if (user.email) {
      setCustomEmail(user.email);
    }

    // Đã có mã OTP gửi sẵn từ lúc đăng ký (server gửi + trả verifySessionId)
    // ⇒ KHÔNG gửi lại. Điều kiện này cố tình KHÔNG phụ thuộc user.email: lúc mới
    // đăng ký, `user` từ localStorage có thể chưa kịp có email ⇒ rơi xuống nhánh
    // "tự động gửi", gọi request_email_verification ngay lúc session cookie
    // chưa được trình duyệt lưu ⇒ 401 ⇒ UI báo "Lỗi kết nối máy chủ" dù đăng ký
    // đã thành công (đo 2026-10-09: request chạy song song register → 401).
    if (initialSessionId) {
      setSessionId(initialSessionId);
      setStep('otp');
      setSuccess(
        `Mã xác thực OTP đã được gửi đến email ${user.email || 'bạn'}! Vui lòng kiểm tra hộp thư.`
      );
      return;
    }

    // Nếu người dùng đã có email trong tài khoản: TỰ ĐỘNG GỬI MÃ OTP NGAY LẬP TỨC
    const target = (user.email || customEmail).trim();
    if (target && target.includes('@') && target.includes('.')) {
      setStep('otp');
      const now = Date.now();
      // Chống gửi lặp lại trong vòng 20s
      if (now - lastAutoSentTimeRef.current > 20000) {
        lastAutoSentTimeRef.current = now;
        handleRequestCode(undefined, target);
      }
    } else {
      // Nếu chưa có email, hiển thị bước nhập email
      setStep('request');
    }
  }, [isOpen, initialSessionId, user?.id, user?.email]);

  // Countdown timer for OTP (single stable interval without per-second teardown)
  useEffect(() => {
    if (!isOpen || step !== 'otp') return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  if (!isOpen || !user) return null;

  const targetEmail = (user.email || customEmail).trim();

  // Gửi hoặc gửi lại mã OTP xác thực
  const handleRequestCode = async (e?: React.FormEvent, forcedEmail?: string) => {
    if (e) e.preventDefault();
    const emailToSend = (forcedEmail || user.email || customEmail).trim();
    if (!emailToSend || !emailToSend.includes('@') || !emailToSend.includes('.')) {
      setError('Vui lòng nhập đúng định dạng email hợp lệ (ví dụ: ten@gmail.com).');
      sound.playWrong();
      return;
    }

    setResending(true);
    setError(null);
    setSuccess(null);
    sound.playClick();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_email_verification',
          userId: user.id,
          email: emailToSend,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        setSessionId(data.sessionId);
        setCountdown(300);
        setOtp('');
        setSuccess(`Đã gửi mã OTP 6 số đến ${emailToSend}! Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.`);
        setStep('otp');
      } else {
        setError(data.error || 'Không thể gửi mã xác thực. Vui lòng thử lại sau.');
        sound.playWrong();
      }
    } catch {
      setError('Lỗi kết nối máy chủ gửi email. Vui lòng kiểm tra kết nối mạng.');
      sound.playWrong();
    } finally {
      setResending(false);
    }
  };

  // BƯỚC 2: Nhập mã OTP và kích hoạt tài khoản
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã xác thực.');
      sound.playWrong();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    sound.playClick();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_email',
          userId: user.id,
          sessionId,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        sound.playCelebration();
        setSuccess('Xác thực email thành công! Toàn bộ tính năng đã được kích hoạt.');
        setStoredUser(data.user);
        if (onVerified) onVerified(data.user);
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
          closeTimerRef.current = null;
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Mã xác thực không chính xác hoặc đã hết hạn.');
        sound.playWrong();
      }
    } catch {
      setError('Lỗi kết nối máy chủ, vui lòng thử lại.');
      sound.playWrong();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-verify-modal-title"
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        {/* Floating close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          title="Đóng"
          aria-label="Đóng cửa sổ xác thực email"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Notices */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* BƯỚC 1: XÁC NHẬN CHỦ ĐỘNG GỬI MÃ (Tránh spam email) */}
        {step === 'request' && (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-2xl shadow-inner mx-auto mb-1">
              ✉️
            </div>
            <div>
              <h2
                id="email-verify-modal-title"
                className="text-xl font-black text-slate-900 dark:text-white"
              >
                Kích Hoạt Tài Khoản Email
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed px-2">
                Để bảo vệ tiến độ học tập và mở khóa toàn bộ bài học, hãy nhấn nút bên dưới để nhận mã OTP xác thực qua email:
              </p>
            </div>

            {/* Email display or input */}
            <div className="pt-2">
              {user.email ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.email}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nhập địa chỉ email của bạn:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="vidu@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Anti-spam notice */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2 text-left">
              <span className="shrink-0 text-sm">💡</span>
              <p className="leading-relaxed">
                Hệ thống chỉ gửi mã OTP khi bạn chủ động ấn nút bên dưới để tránh gửi nhiều thư làm phiền hòm thư của bạn.
              </p>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => handleRequestCode()}
              disabled={resending || (!user.email && (!customEmail || !customEmail.includes('@')))}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang gửi mã xác thực...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Mã Xác Thực Đến Email</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* BƯỚC 2: NHẬP MÃ OTP 6 SỐ */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xl shadow-inner mx-auto">
                🔐
              </div>
              <h2
                id="email-verify-modal-title"
                className="text-xl font-black text-slate-900 dark:text-white"
              >
                Nhập Mã Xác Thực OTP
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2 flex items-center justify-center gap-1.5">
                {resending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500 inline" />
                    <span className="text-emerald-600 font-bold">Đang gửi mã xác thực tới email:</span>
                  </>
                ) : (
                  <span>Đã gửi mã OTP 6 số đến email:</span>
                )}
              </p>
              <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {targetEmail}
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Nhập mã OTP 6 chữ số:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-500 rounded-2xl py-3 text-center text-3xl font-black text-slate-900 dark:text-white font-mono tracking-[0.4em] outline-none transition shadow-inner"
                  placeholder="••••••"
                  required
                />
              </div>

              {/* Countdown & Resend */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Hiệu lực: <strong className="font-mono text-amber-600 dark:text-amber-400">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRequestCode()}
                  disabled={resending || countdown > 285}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer disabled:opacity-40 disabled:no-underline"
                >
                  {resending
                    ? 'Đang gửi...'
                    : countdown > 285
                    ? `Gửi lại sau (${countdown - 285}s)`
                    : 'Gửi lại mã'}
                </button>
              </div>

              {/* Spam folder tip */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <span className="shrink-0 text-sm">💡</span>
                <span>
                  Mẹo: Nếu chưa thấy email trong Hộp thư đến, vui lòng kiểm tra cả thư mục <strong>Spam / Thư rác / Quảng cáo</strong> nhé!
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={loading || otp.trim().length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Kích Hoạt Tài Khoản</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại bước trước</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

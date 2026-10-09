'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Pencil, KeyRound, Save } from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { AuthUser, saveAccountToDevice } from '@/lib/auth';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onUpdated: (user: AuthUser) => void;
}

/** Bộ emoji ảnh đại diện (cùng phong cách avatar emoji toàn app). */
const EMOJI_AVATARS = [
  '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯',
  '🐰', '🐸', '🐵', '🦄', '🐮', '🐷', '🐧', '🐦',
  '🦋', '🐢', '🐙', '🦖', '🐳', '🌸', '⭐', '🔥',
];

const INPUT_CLS =
  'w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-400 dark:focus:border-emerald-500 outline-none text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 transition';

export default function ProfileEditModal({ isOpen, onClose, user, onUpdated }: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('🐱');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form mỗi lần mở modal (deps = isOpen; KHÔNG lấy user vào deps để
  // tránh effect chạy lại khi onUpdated đổi object user và xóa mất banner thành công)
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.display_name || '');
      setAvatar(user.avatar || '🐱');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Timeout đóng modal sau khi lưu thành công — phải hủy được khi unmount,
  // nếu không sẽ gọi onClose() của parent sau khi modal đã biến mất.
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // a11y (audit 2026-10-09): modal sửa hồ sơ thiếu role=dialog, thiếu focus
  // trap (Tab thoát ra nền trang) và không đóng bằng Esc. Dùng lại mẫu của
  // AuthModal.tsx (~dòng 115-178).
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Esc đóng modal, trừ lúc đang submit để không mất kết quả vừa lưu.
  // useCallback để useEscapeToClose không đăng ký lại listener mỗi render.
  const handleEscapeClose = useCallback(() => onCloseRef.current(), []);
  useEscapeToClose(isOpen, handleEscapeClose, !loading);

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

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  if (!isOpen || !user) return null;

  const nameChanged = displayName.trim() !== (user.display_name || '');
  const avatarChanged = avatar !== (user.avatar || '');
  const passwordChanged = newPassword.length > 0 || currentPassword.length > 0;
  const dirty = nameChanged || avatarChanged || passwordChanged;

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (displayName.trim().length < 2) {
      setError('Tên hiển thị phải có ít nhất 2 ký tự.');
      sound.playWrong();
      return;
    }
    if (passwordChanged) {
      if (!currentPassword) {
        setError('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.');
        sound.playWrong();
        return;
      }
      if (newPassword.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
        sound.playWrong();
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        sound.playWrong();
        return;
      }
    }

    const body: Record<string, unknown> = { action: 'update_profile', userId: user.id };
    if (nameChanged) body.displayName = displayName.trim();
    if (avatarChanged) body.avatar = avatar;
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Không lưu được thay đổi. Vui lòng thử lại.');
        sound.playWrong();
        return;
      }

      const updated = data.user as AuthUser;
      onUpdated(updated);
      try {
        saveAccountToDevice(updated);
      } catch {}
      window.dispatchEvent(new Event('auth-state-changed'));

      setSuccess(data.message || 'Đã lưu thay đổi!');
      sound.playSuccess();
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        onClose();
      }, 900);
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
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
        aria-labelledby="profile-edit-modal-title"
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer z-10"
          title="Đóng"
          aria-label="Đóng cửa sổ sửa thông tin cá nhân"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Thông báo */}
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

        {/* Tiêu đề */}
        <div className="text-center pt-2 pb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-2xl shadow-inner mx-auto mb-2">
            <Pencil className="w-6 h-6" />
          </div>
          <h2
            id="profile-edit-modal-title"
            className="text-lg font-black text-slate-900 dark:text-white tracking-tight"
          >
            Sửa Thông Tin Cá Nhân
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">@{user.username}</p>
        </div>

        <div className="space-y-5">
          {/* Ảnh đại diện */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
              Ảnh đại diện (emoji)
            </label>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 border-2 border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-3xl shadow-sm shrink-0">
                {avatar}
              </div>
              <span className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Chọn 1 emoji làm ảnh đại diện của bạn.
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
              {EMOJI_AVATARS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAvatar(e);
                  }}
                  className={`aspect-square flex items-center justify-center text-xl rounded-xl transition cursor-pointer active:scale-90 ${
                    avatar === e
                      ? 'bg-emerald-500 shadow-sm scale-105'
                      : 'hover:bg-white dark:hover:bg-slate-700 bg-transparent'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Tên hiển thị */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
              maxLength={30}
              placeholder="Tên của bạn..."
              className={INPUT_CLS}
            />
            <div className="text-[10px] text-slate-400 mt-1 text-right font-semibold">
              {displayName.trim().length}/30
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-slate-800 dark:text-white">Đổi mật khẩu</span>
              <span className="text-[10px] text-slate-400 font-bold ml-auto">Để trống nếu không đổi</span>
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              autoComplete="current-password"
              className={INPUT_CLS}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              autoComplete="new-password"
              className={INPUT_CLS}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              autoComplete="new-password"
              className={INPUT_CLS}
            />
          </div>

          {/* Nút hành động */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition cursor-pointer active:scale-95"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || loading}
              className={`py-3 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                !dirty || loading
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
              }`}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sound } from '@/lib/soundFx';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Thiếu token đặt lại mật khẩu. Vui lòng yêu cầu lại qua trang Quên mật khẩu.');
    }
  }, [token]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (!/[A-Z]/.test(pwd)) return 'Mật khẩu phải có ít nhất 1 chữ hoa.';
    if (!/[a-z]/.test(pwd)) return 'Mật khẩu phải có ít nhất 1 chữ thường.';
    if (!/[0-9]/.test(pwd)) return 'Mật khẩu phải có ít nhất 1 chữ số.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      sound.playWrong();
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      sound.playWrong();
      return;
    }
    if (!token) {
      setError('Token không hợp lệ.');
      sound.playWrong();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Đặt lại mật khẩu thất bại.');
        sound.playWrong();
        return;
      }

      sound.playSuccess();
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      // Chuyển về đăng nhập sau 3 giây
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 3000);
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      sound.playWrong();
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Yếu', color: 'bg-rose-500', width: '33%' };
    if (score <= 3) return { label: 'Trung bình', color: 'bg-amber-500', width: '66%' };
    return { label: 'Mạnh', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = passwordStrength(password);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-xl mx-auto mb-4">
            <span className="text-3xl">🐱</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Đặt Lại Mật Khẩu
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Mật khẩu đã được đặt lại!
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {error || 'Mật khẩu mới đã sẵn sàng sử dụng.'}
              </p>
              <p className="text-sm text-slate-400">
                Đang chuyển về trang chủ...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Độ an toàn: <span className="font-medium">{strength.label}</span>
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  'Đặt lại mật khẩu'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nhớ mật khẩu?{' '}
              <Link href="/" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Hoặc{' '}
              <Link href="/api/auth/forgot-password" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Yêu cầu link mới
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Link này chỉ dùng được 1 lần và hết hạn sau 60 phút.
        </p>
      </div>
    </div>
  );
}
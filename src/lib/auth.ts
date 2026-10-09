'use client';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  display_name: string;
  avatar: string;
  streak: number;
  exp: number;
  level: number;
  coins?: number;
  target_exam?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'disabled';
  two_factor_enabled?: boolean;
  email_verified?: boolean;
  /** Thời điểm tạo tài khoản — response đăng nhập thật từ server LUÔN có. */
  created_at?: string;
  /**
   * CHỈ object fallback demo do getStoredUser() tự tạo khi CHƯA đăng nhập —
   * KHÔNG phải kết quả đăng nhập thật. Tài khoản demo thật trong DB được seed
   * với đúng id 'user_demo_default' (db.ts) nên KHÔNG thể phân biệt hai nguồn
   * bằng id: phải dùng cờ này (thêm 2026-10-09, sửa gate chặn nhầm user demo
   * đã đăng nhập thật).
   */
  isDemoFallback?: boolean;
}

const STORAGE_KEY = 'english_for_me_user';
const LOGGED_OUT_KEY = 'english_for_me_logged_out';

/**
 * Làm mờ email để bảo mật thông tin (ẩn khoảng 1/2 phần tên định danh):
 * Ví dụ: <email quan tri> => <email quan tri>
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return email || '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 4) {
    return `${localPart[0]}***@${domain}`;
  }
  const suffixLen = localPart.length >= 6 ? 2 : 1;
  const prefixLen = Math.max(2, Math.round(localPart.length * 0.3));
  const prefix = localPart.slice(0, prefixLen);
  const suffix = localPart.slice(-suffixLen);
  return `${prefix}*****${suffix}@${domain}`;
}

// Get current logged in user, or null if logged out / not authenticated
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        // BẢO VỆ PHÂN QUYỀN: Tài khoản Admin chỉ dùng riêng cho /duahau
        // Không bao giờ để tài khoản admin hoạt động như một học viên trên web gốc!
        if (parsed.username === 'admin' || parsed.role === 'admin') {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        // BẢO VỆ TÀI KHOẢN BỊ KHÓA: Nếu tài khoản bị vô hiệu hóa, tự động đăng xuất ngay lập tức
        if (parsed.status === 'disabled') {
          clearStoredUser();
          return null;
        }

        // KHÔNG tự gán 1000 khi thiếu coins (bản trước): giá trị đó che mất số
        // dư thật — pet toolbar hiện "1.000" trong khi DB có giá trị khác, đúng
        // triệu chứng "coin chưa đồng bộ" (2026-10-09). Thiếu coins thì để
        // undefined — UI hiện 0 trung thực; đăng ký/đăng nhập luôn trả coins
        // từ DB nên field hiếm khi thiếu (chỉ object localStorage đời cũ).
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

// Get user with guaranteed non-null fallback (for practice labs & progress tracking)
export function getStoredUser(): AuthUser {
  const current = getCurrentUser();
  if (current) return current;

  // Fallback demo user with 1000 coins
  return {
    id: 'user_demo_default',
    username: 'demo',
    display_name: 'Nguyễn Văn Minh (IT Dev)',
    avatar: '👨‍💻',
    streak: 4,
    exp: 340,
    level: 2,
    coins: 1000,
    two_factor_enabled: false,
    email_verified: true,
    // Đánh dấu rõ đây là fallback client, KHÔNG phải đăng nhập thật (xem
    // AuthUser.isDemoFallback). Pet page có thể ghi object này vào localStorage
    // (setStoredUser trong applyCoinDelta cho khách) — cờ giúp AppShell phân
    // biệt với user demo đăng nhập THẬT, cùng id 'user_demo_default'.
    isDemoFallback: true,
  };
}

const SAVED_ACCOUNTS_KEY = 'meowlish_saved_accounts';

export function getSavedAccounts(): AuthUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter((u: any) => u && u.id && u.username !== 'admin' && u.role !== 'admin');
  } catch {
    return [];
  }
}

export function saveAccountToDevice(user: AuthUser) {
  if (typeof window === 'undefined' || !user || !user.id || user.username === 'admin' || user.status === 'disabled') return;
  const currentList = getSavedAccounts();
  const updated = [user, ...currentList.filter((u) => u.id !== user.id && u.status !== 'disabled')].slice(0, 6);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
}

export function removeSavedAccount(userId: string) {
  if (typeof window === 'undefined') return;
  const currentList = getSavedAccounts();
  const updated = currentList.filter((u) => u.id !== userId);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === 'undefined') return;
  // BẢO VỆ TÀI KHOẢN VÔ HIỆU HÓA: Không lưu và tự động đăng xuất
  if (user.status === 'disabled') {
    clearStoredUser();
    removeSavedAccount(user.id);
    return;
  }
  // BẢO VỆ PHÂN QUYỀN: Tuyệt đối không cho lưu Admin vào localStorage web người dùng
  if (user.username === 'admin' || user.role === 'admin') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('auth-state-changed'));
    return;
  }
  localStorage.removeItem(LOGGED_OUT_KEY);
  // KHÔNG ép coins = 1000 khi thiếu (bản trước): che mất số dư thật.
  // Đăng ký/đăng nhập luôn trả coins từ DB — field hiếm khi thiếu.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // Tự động lưu tài khoản vào danh sách thiết bị để chuyển đổi nhanh
  saveAccountToDevice(user);
  window.dispatchEvent(new Event('auth-state-changed'));
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOGGED_OUT_KEY, 'true');
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('auth-state-changed'));
}

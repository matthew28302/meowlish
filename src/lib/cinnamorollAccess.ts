/**
 * Kiểm tra quyền mở khoá thú cưng đặc quyền (Cinnamoroll).
 *
 * ⚠️ MODULE NÀY CHỈ ĐƯỢC IMPORT TỪ SERVER (API route, script).
 *
 * Lý do tách riêng: danh sách email được cấp quyền là dữ liệu cá nhân thật.
 * Trước đây nó nằm trong `petData.ts` — file này được client import (`PETS_CATALOG`)
 * ⇒ email bị đóng gói vào JS tải về cho mọi khách truy cập, ai cũng đọc được
 * trong DevTools, và repo public cũng lộ. Đã xác minh trên production.
 *
 * Phía client KHÔNG được tự tính quyền này (cần biết danh sách email). Server
 * tính sẵn và trả kèm `cinnamorollAccess` trong `GET /api/pet`; client chỉ đọc
 * cờ `isUnlocked` / `status`.
 *
 * `tests/unit/no-client-pii.test.ts` chặn tái phát.
 */

/** Email được cấp quyền — KHÔNG đưa vào mã phía client. */
const CINNAMOROLL_ALLOWED_EMAILS = [
  'xuanmai032004@gmail.com',
  'liuyufishball@gmail.com',
  '22520841@gm.uit.edu.vn',
];

export interface CinnamorollUserLike {
  email?: string | null;
  email_verified?: boolean | number;
}

export type CinnamorollAccess = {
  isUnlocked: boolean;
  status: 'locked_not_logged_in' | 'locked_unauthorized_email' | 'locked_unverified_email' | 'unlocked';
  message: string;
};

export function checkCinnamorollAccess(user: CinnamorollUserLike | null | undefined): CinnamorollAccess {
  if (!user) {
    return {
      isUnlocked: false,
      status: 'locked_not_logged_in',
      message: 'Bé Cinnamoroll là Thú Cưng Độc Quyền Giới Hạn dành riêng cho Quản Trị Viên (Admin). Vui lòng đăng nhập để kiểm tra điều kiện mở khoá!',
    };
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  if (!userEmail) {
    return {
      isUnlocked: false,
      status: 'locked_unauthorized_email',
      message: '🔒 Bé Cinnamoroll là Thú Cưng Độc Quyền Giới Hạn chỉ dành riêng cho Quản Trị Viên (Admin) được cấp quyền.',
    };
  }

  // So sánh thời gian hằng số để không lộ email hợp lệ qua phản hồi nhanh/chậm.
  const target = userEmail;
  let matched = 0;
  for (const allowed of CINNAMOROLL_ALLOWED_EMAILS) {
    const candidate = allowed.toLowerCase();
    // So sánh chuỗi có độ dài bằng nhau, cộng dồn kết quả để không rẽ nhánh sớm.
    const diff = candidate.length ^ target.length;
    let same = diff === 0 ? 1 : 0;
    const len = Math.max(candidate.length, target.length);
    for (let i = 0; i < len; i++) {
      same &= (candidate.charCodeAt(i) | 0) === (target.charCodeAt(i) | 0) ? 1 : 0;
    }
    matched |= same;
  }

  if (matched !== 1) {
    return {
      isUnlocked: false,
      status: 'locked_unauthorized_email',
      message: '🔒 Bé Cinnamoroll là Thú Cưng Độc Quyền Giới Hạn chỉ dành riêng cho Quản Trị Viên (Admin) được cấp quyền đặc biệt.',
    };
  }

  const isVerified = user.email_verified === true || user.email_verified === 1;
  if (!isVerified) {
    return {
      isUnlocked: false,
      status: 'locked_unverified_email',
      message: '✉️ Tài khoản của bạn đủ điều kiện kích hoạt đặc quyền sở hữu bé Cinnamoroll! Vui lòng hoàn tất xác thực mã OTP email để mở khoá bé về khu vườn của mình.',
    };
  }

  return {
    isUnlocked: true,
    status: 'unlocked',
    message: '🎉 Chúc mừng Quản Trị Viên! Bạn đã mở khoá thành công bé Cinnamoroll Bồng Bềnh!',
  };
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đặt Lại Mật Khẩu - Meowlish',
  description: 'Đặt lại mật khẩu tài khoản Meowlish qua link một lần dùng.',
  // Trang cá nhân sau đăng nhập — chặn index để không lộ URL chứa link
  // mật khẩu một lần dùng ra kết quả tìm kiếm.
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
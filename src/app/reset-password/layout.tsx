import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đặt Lại Mật Khẩu - Meowlish',
  description: 'Đặt lại mật khẩu tài khoản Meowlish qua link một lần dùng.',
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
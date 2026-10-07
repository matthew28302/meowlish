import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đặt Lại Mật Khẩu - Meowlish',
  description: 'Đặt lại mật khẩu tài khoản Meowlish qua link một lần dùng.',
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const { ResetPasswordClient } = await import('./ResetPasswordClient');
  return <ResetPasswordClient initialToken={token} />;
}
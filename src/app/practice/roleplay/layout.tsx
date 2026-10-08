import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luyện Hội thoại Roleplay AI - Meowlish',
  description: 'Luyện giao tiếp tiếng Anh qua các tình huống roleplay với AI: đặt hàng, phỏng vấn, trò chuyện hàng ngày.',
};

export default function roleplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
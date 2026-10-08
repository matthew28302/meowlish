import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hỗ Trợ & Câu Hỏi Thường Gặp - Meowlish',
  description: 'Trung tâm hỗ trợ Meowlish: hướng dẫn sử dụng, câu hỏi thường gặp, gửi ticket góp ý và trợ lý AI giải đáp tức thì.',

};

export default function supportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Từ Vựng Tiếng Anh IT & Giao Tiếp - Meowlish',
  description: 'Học từ vựng tiếng Anh chuyên ngành IT, giao tiếp hàng ngày theo chủ đề với phiên âm IPA, ví dụ thực chiến và bài tập phản xạ.',

};

export default function vocabularyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ngữ Pháp Lego Trực Quan - Meowlish',
  description: 'Học ngữ pháp tiếng Anh bằng phương pháp Lego trực quan: ghép khối màu theo cấu trúc câu, ghi nhớ tự nhiên không học vẹt.',

};

export default function grammarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
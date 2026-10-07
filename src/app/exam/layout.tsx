import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thi Thử TOEIC IELTS & Bài Quiz - Meowlish',
  description: 'Phòng thi thử định dạng chuẩn TOEIC, IELTS với đồng hồ đếm ngược, chấm điểm và giải thích đáp án chi tiết từng câu.',

};

export default function examLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
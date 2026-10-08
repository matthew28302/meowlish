import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luyện Viết Tiếng Anh AI - Meowlish',
  description: 'Luyện viết tiếng Anh với AI: gợi ý từ vựng, sửa lỗi ngữ pháp, cải thiện câu chuyện và bài luận theo chủ đề.',
};

export default function writingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
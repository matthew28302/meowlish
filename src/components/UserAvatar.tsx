'use client';

import React from 'react';
import {
  parsePixelAvatar,
  emojiToPixel,
  pixelPngSrc,
  pixelGifSrc,
} from '@/lib/pixelAvatars';

interface UserAvatarProps {
  /** Giá trị lưu DB: "pixel:<slug>" hoặc 1 emoji legacy (bộ cũ). */
  avatar: string | undefined | null;
  /** Kích thước hiển thị bằng px CSS (file gốc 100×100, hiển thị <=50 sắc nét). */
  size: number;
  /** 'png' = ảnh tĩnh cho avatar thường; 'gif' = ảnh động cho logo brand. */
  format?: 'png' | 'gif';
  /** Class bọc ngoài nếu render site muốn thêm (shrink-0, rounded-full…). */
  className?: string;
  /** Văn bản thay thế cho ảnh — mặc định "Ảnh đại diện". */
  alt?: string;
}

/**
 * Ảnh đại diện pixel dùng chung toàn app (thay chuỗi emoji cũ).
 *
 * Hành vi:
 *  - "pixel:<slug>" hợp lệ → <img> PNG/GIF tương ứng với width/height tường minh.
 *  - Emoji legacy có hình gần đúng trong bảng EMOJI_TO_PIXEL (lib/pixelAvatars)
 *    → vẫn dùng ảnh pixel như user mới (hiển thị xuyên suốt).
 *  - Emoji legacy không có hình (🦄 🔥 👨‍💻 🎀 ⚡…) → hiển thị đúng emoji như cũ.
 *  - Không có avatar (undefined/null/'') → mèo mặc định (pixel:cat).
 *
 * Vì sao dùng <img> thường thay vì next/image: toàn bộ ảnh là tài nguyên tĩnh
 * 100×100 có width/height khai báo sẵn (không lo layout shift hay cần tối ưu
 * transform), còn GIF động dùng trong logo thì next/image không render động
 * được — đồng bộ cách repo đã làm với ảnh khuyên nút (src/lib/emailTemplates.ts).
 *
 * Lưu ý: component KHÔNG tự wrap ảnh vào khung gradient tròn/vuông — render
 * site giàu style (sidebar, modal…) tự giữ khung của nó, UserAvatar chỉ vẽ
 * hình với nền trong suốt nổi lên khung đó.
 */
export default function UserAvatar({
  avatar,
  size,
  format = 'png',
  className,
  alt,
}: UserAvatarProps) {
  const label = alt ?? 'Ảnh đại diện';
  const trimmed = typeof avatar === 'string' ? avatar.trim() : '';

  // 1) Giá trị mới "pixel:<slug>" → slug thật (whitelist 99 ảnh).
  let slug = parsePixelAvatar(trimmed);
  // 2) Emoji legacy khớp gần đúng → dùng luôn ảnh pixel như hệ thống mới.
  if (!slug && trimmed) slug = emojiToPixel(trimmed);
  // 3) Chuỗi rỗng/không có → mặc định mèo (hành vi cũ: '🐱').
  if (!slug && !trimmed) slug = 'cat';

  if (!slug) {
    // 4) Emoji/ảnh ngoài bộ pixel (🦄, 👨‍💻, 🎀…) — giữ nguyên cách hiển thị
    //    chuỗi cũ: <span> không font-size riêng, kế thừa size của khung cha
    //    (text-2xl, text-sm…) để pixel ảnh và emoji lẻ đứng cạnh khớp nhau.
    return (
      <span role="img" aria-label={label} className={className}>
        {trimmed}
      </span>
    );
  }

  const src = format === 'gif' ? pixelGifSrc(slug) : pixelPngSrc(slug);
  // File gốc 100px: hiển thị >100px mới cần "pixelated" để chống nhòe khi
  // phóng; <=100 trình duyệt tự thu nhỏ mượt, không cần can thiệp.
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={label}
      className={className}
      style={size > 100 ? { imageRendering: 'pixelated' as const } : undefined}
    />
  );
}

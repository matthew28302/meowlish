import React from 'react';

/**
 * FlagIcon — cờ quốc gia vẽ bằng SVG NỘI TUYẾN (không ảnh, không dependency).
 *
 * VÌ SAO CẦN (chủ nhân báo 2026-10-18: "phần dịch VN trước đã sửa thành cờ,
 * giờ lại thành chữ VN"):
 * Emoji cờ (🇻🇳 🇬🇧 🇺🇸) là chuỗi 2 "regional indicator" — font hiển thị phải có
 * glyph cờ. Windows/Chromium KHÔNG có (Segoe UI Emoji không vẽ cờ) nên trình
 * duyệt rơi về 2 ký tự chữ cái trần "VN" / "GB" / "US". Đó là lý do "cờ biến
 * thành chữ". SVG nội tuyến render GIỐNG NHAU trên mọi HĐH nên hết tái diễn.
 *
 * Props:
 * - code: 'VN' | 'GB' | 'US' (mã ISO-2, không phân biệt hoa/thường)
 * - size: chiều rộng px (chiều cao = size × 2/3, tỉ lệ cờ 3:2)
 * - className: class bổ sung (viền riêng, căn lề…)
 * - label: nhãn cho trình đọc màn hình (mặc định theo quốc gia)
 * - title: tooltip khi rê chuột (không bắt buộc)
 *
 * Bo góc nhẹ + viền mảnh (ring) để nổi trên cả nền sáng lẫn dark mode.
 */

export type FlagCode = 'VN' | 'GB' | 'US' | (string & {});

/** Mã quốc gia → nhãn đọc màn hình mặc định (tiếng Việt, khớp ngữ cảnh app). */
const DEFAULT_LABELS: Record<string, string> = {
  VN: 'Tiếng Việt (Việt Nam)',
  GB: 'Giọng Anh - Anh (Vương quốc Anh)',
  US: 'Giọng Anh - Mỹ (Hoa Kỳ)',
  AU: 'Giọng Anh - Úc',
  CA: 'Giọng Anh - Canada',
};

/**
 * Giải mã cặp "regional indicator" (emoji cờ) thành mã ISO-2.
 * Ví dụ: "🇻🇳" → "VN". Trả null nếu không phải emoji cờ.
 *
 * Làm việc bằng code point thay vì so khớp chuỗi literal để không cần nhúng
 * emoji cờ trong source (tránh lặp lại chính biến cố "cờ hỏng thành chữ").
 */
export function flagEmojiToCode(emoji: string): string | null {
  // 2 regional indicator = 2 code point, mỗi code point chiếm 1-2 code unit.
  const cps = Array.from(emoji).map((c) => c.codePointAt(0) ?? 0);
  if (cps.length !== 2) return null;
  const withinRange = (cp: number) => cp >= 0x1f1e6 && cp <= 0x1f1ff; // 🇦..🇿
  if (!cps.every(withinRange)) return null;
  return cps.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 65)).join('');
}

/** Regex bắt 1 cặp regional indicator (không cần literal emoji trong source). */
const FLAG_EMOJI_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
/** Bản không cờ /g để test (tránh lastIndex stateful của regex toàn cục). */
const FLAG_EMOJI_TEST_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/u;

/** Cờ Việt Nam: nền đỏ #DA251D + sao vàng 5 cánh. */
function VietnamFlag() {
  return (
    <>
      <rect width="30" height="20" fill="#DA251D" />
      {/* Sao vàng 5 cánh, tâm (15,10), R ngoài 5.5 / R trong 2.4 */}
      <path
        d="M15 4.5 16.41 8.06 20.23 8.3 17.28 10.74 18.23 14.45 15 12.4 11.77 14.45 12.72 10.74 9.77 8.3 13.59 8.06Z"
        fill="#FFDE00"
      />
    </>
  );
}

/** Cờ Vương quốc Anh (Union Jack — bản đơn giản hoá đủ nhận diện ở cỡ 13-14px). */
function UnitedKingdomFlag() {
  return (
    <>
      <rect width="30" height="20" fill="#012169" />
      {/* Chéo trắng phủ lên nền xanh, rồi chéo đỏ mảnh ở giữa */}
      <path d="M0 0 30 20 M30 0 0 20" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0 0 30 20 M30 0 0 20" stroke="#C8102E" strokeWidth="1.6" />
      {/* Chữ thập: nền trắng rộng, lõi đỏ thập hẹp */}
      <path d="M15 0V20 M0 10H30" stroke="#FFFFFF" strokeWidth="7" />
      <path d="M15 0V20 M0 10H30" stroke="#C8102E" strokeWidth="4" />
    </>
  );
}

/** Cờ Hoa Kỳ: 13 sọc đỏ/trắng + bang hội xanh (lược hoá còn 6 ngôi sao 2 hàng). */
function UnitedStatesFlag() {
  const stripeH = 20 / 13;
  return (
    <>
      <rect width="30" height="20" fill="#FFFFFF" />
      {Array.from({ length: 13 }, (_, i) =>
        i % 2 === 0 ? <rect key={i} x="0" y={i * stripeH} width="30" height={stripeH} fill="#B22234" /> : null,
      )}
      <rect width="12" height={stripeH * 7} fill="#3C3B6E" />
      {[2.6, 5.9].map((cy) =>
        [2, 4.6, 7.2, 9.8].map((cx) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.62" fill="#FFFFFF" />
        )),
      )}
    </>
  );
}

/** Bản vẽ cờ theo mã ISO-2. Mã không có bản vẽ → trả null (rơi xuống pill chữ). */
function FlagDrawing({ code }: { code: string }) {
  switch (code) {
    case 'VN':
      return <VietnamFlag />;
    case 'GB':
      return <UnitedKingdomFlag />;
    case 'US':
      return <UnitedStatesFlag />;
    default:
      return null;
  }
}

interface FlagIconProps {
  code: FlagCode;
  /** Chiều rộng px (cao = rộng × 2/3). Mặc định 14 — cỡ chữ nhỏ trong câu. */
  size?: number;
  className?: string;
  /** Nhãn trình đọc màn hình. Mặc định lấy theo mã quốc gia. */
  label?: string;
  /** Tooltip chuột (title). */
  title?: string;
}

export default function FlagIcon({ code, size = 14, className = '', label, title }: FlagIconProps) {
  const normalized = String(code || '').trim().toUpperCase();
  const width = size;
  const height = Math.round((size * 20) / 30); // tỉ lệ 3:2
  const ariaLabel = label || DEFAULT_LABELS[normalized] || `Cờ ${normalized || 'quốc gia'}`;

  // Mã chưa có bản vẽ (ví dụ 🇦🇺 khi thêm sau): hiển thị "pill" 2 chữ cái —
  // vẫn là thông tin quốc gia đọc được, KHÔNG phải 2 ký tự regional rời rạc.
  const drawing = FlagDrawing({ code: normalized });
  const hasDrawing = drawing !== null;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] align-[-0.08em] ring-1 ring-black/15 dark:ring-white/25 shadow-[0_1px_2px_rgba(15,23,42,0.25)] ${className}`}
      style={{ width, height }}
      title={title}
    >
      {hasDrawing ? (
        <svg
          width={width}
          height={height}
          viewBox="0 0 30 20"
          role="img"
          aria-label={ariaLabel}
          focusable="false"
          style={{ display: 'block' }}
        >
          <title>{ariaLabel}</title>
          {drawing}
        </svg>
      ) : (
        <span
          role="img"
          aria-label={ariaLabel}
          className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black leading-none"
          style={{ fontSize: Math.max(8, Math.round(height * 0.66)) }}
        >
          {normalized.slice(0, 2)}
        </span>
      )}
    </span>
  );
}

interface FlagTextProps {
  /** Chuỗi có thể chứa emoji cờ — ký tự khác giữ nguyên 100%. */
  text: string;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * FlagText — thay MỌI emoji cờ trong một CHUỖI bằng FlagIcon, phần chữ còn lại
 * giữ nguyên. Dùng cho dữ liệu render động (nhãn đề thi, icon lộ trình…) để
 * không phải sửa từng ký tự trong file dữ liệu.
 */
export function FlagText({ text, size = 14, className = '', label }: FlagTextProps) {
  const raw = String(text ?? '');
  if (!FLAG_EMOJI_TEST_RE.test(raw)) return <>{raw}</>;

  // BÀI HỌC (bug 2026-10-18): bản đầu dùng `raw.split(FLAG_EMOJI_RE)` với hy vọng
  // "capturing group giữ lại emoji cờ" — nhưng regex KHÔNG có ngoặc đơn nên split
  // XOÁ LUÔN ký tự khớp: cờ mất cả chữ lẫn SVG (chip " VSTEP BGD", tab "VSTEP"
  // trống icon). matchAll() quét vị trí thật, không phụ thuộc ngoặc đơn.
  const parts: Array<{ code: string | null; value: string }> = [];
  let lastIndex = 0;
  for (const match of raw.matchAll(FLAG_EMOJI_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push({ code: null, value: raw.slice(lastIndex, start) });
    parts.push({ code: flagEmojiToCode(match[0]), value: match[0] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < raw.length) parts.push({ code: null, value: raw.slice(lastIndex) });

  return (
    <>
      {parts.map((part, idx) =>
        part.code ? (
          <FlagIcon key={idx} code={part.code} size={size} className={className} label={label} />
        ) : (
          <React.Fragment key={idx}>{part.value}</React.Fragment>
        ),
      )}
    </>
  );
}

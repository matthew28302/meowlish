/**
 * Bộ ảnh đại diện pixel (thay bộ emoji cũ của ProfileEditModal).
 *
 * Nguồn ảnh: `pixel_avatars_v2_100/` 100×100 (RGBA trong suốt, GIF 4 frame),
 * bản deploy đã copy sang `public/pixel-avatars/png/` + `public/pixel-avatars/gif/`
 * (thư mục `public/pixel-avatars/` được commit; thư mục gốc bên ngoài được
 * .gitignore làm nguồn lấy asset, đừng di chuyển / xoá nó).
 *
 * Giá trị avatar lưu DB:
 *  - Embed NEW: "pixel:<slug>" với slug ∈ PIXEL_AVATAR_SLUGS.
 *  - Embed LEGACY: 1 emoji đơn lẻ (ví dụ "🐼"). Bảng EMOJI_TO_PIXEL đổi những
 *    emoji khớp "gần đúng" sang slug pixel để toàn app hiển thị thống nhất;
 *    emoji không có hình tương ứng (🦄 🦖 🔥 👨‍💻 🎀 ⚡…) KHÔNG có trong bảng,
 *    UserAvatar sẽ hiển thị đúng emoji đó như cũ thay vì ép sang ảnh khác.
 */

/** 99 slug — lấy đúng tên file (không đuôi) trong pixel_avatars_v2_100/png. */
export const PIXEL_AVATAR_SLUGS: readonly string[] = [
  'aggretsuko', 'ant', 'anya', 'badtz_maru', 'bear', 'bee', 'beetle',
  'berry_cherry', 'butterfly', 'cat', 'caterpillar', 'charmmy_kitty', 'chick',
  'chococat', 'chopper', 'cinnamoroll', 'clownfish', 'cogimyun', 'conan',
  'corocorokuririn', 'cow', 'crab', 'dear_daniel', 'deer', 'dog', 'dolphin',
  'doraemon', 'dragonfly', 'duck', 'edward_elric', 'elephant', 'eren',
  'firefly', 'fox', 'frog', 'gojo', 'goku', 'goldfish', 'gon', 'gudetama',
  'hamster', 'hangyodon', 'hello_kitty', 'ichigo', 'jellyfish', 'jiraiya',
  'kakashi', 'keroppi', 'kiki_lala', 'killua', 'koala', 'kuromi', 'ladybug',
  'levi', 'lion', 'luffy', 'l_deathnote', 'mimmy', 'monkey', 'monkichi',
  'moth', 'my_melody', 'naruto', 'natsu', 'nezuko', 'octopus', 'owl', 'panda',
  'pekkle', 'penguin', 'pig', 'pikachu', 'pochacco', 'pompompurin', 'rabbit',
  'raccoon', 'sailor_moon', 'saitama', 'seahorse', 'seal', 'sea_turtle',
  'shark', 'sheep', 'shin_chan', 'shrimp', 'snail', 'spider', 'squid',
  'starfish', 'stingray', 'tanjiro', 'tiger', 'totoro', 'turtle', 'tuxedosam',
  'usahana', 'whale', 'wish_me_mell', 'wolf',
];

const SLUG_SET: ReadonlySet<string> = new Set(PIXEL_AVATAR_SLUGS);

const PREFIX = 'pixel:';

/**
 * Tách slug từ giá trị "pixel:<slug>".
 * Trả về slug nếu giá trị đúng format và slug nằm trong whitelist 99 ảnh;
 * còn lại trả về null (giá trị không hợp lệ / không phải kiểu pixel).
 */
export function parsePixelAvatar(value: string | undefined | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith(PREFIX)) return null;
  const slug = trimmed.slice(PREFIX.length);
  // Chỉ nhận slug thật trong whitelist (chặn "pixel:", "pixel:hel lo", "pixel:../x"…).
  if (!slug || !/^[a-z0-9_]+$/.test(slug) || !SLUG_SET.has(slug)) return null;
  return slug;
}

/**
 * Bảng đổi emoji LEGACY (bộ 24 emoji cũ của ProfileEditModal) → slug pixel.
 * Chỉ đổi khi có hình gần đúng; emoji thiếu hình (🦄 🦖 🔥) cố tình bỏ khỏi
 * bảng để tiếp tục hiển thị như emoji cũ, không ép sang hình khác.
 */
const EMOJI_TO_PIXEL: ReadonlyMap<string, string> = new Map([
  ['🐱', 'cat'],
  ['🐶', 'dog'],
  ['🦊', 'fox'],
  ['🐻', 'bear'],
  ['🐼', 'panda'],
  ['🐨', 'koala'],
  ['🦁', 'lion'],
  ['🐯', 'tiger'],
  ['🐰', 'rabbit'],
  ['🐸', 'frog'],
  ['🐵', 'monkey'],
  ['🐮', 'cow'],
  ['🐷', 'pig'],
  ['🐧', 'penguin'],
  ['🐦', 'chick'], // không có chim chung — gần đúng nhất là con gà con
  ['🦋', 'butterfly'],
  ['🐢', 'turtle'],
  ['🐙', 'octopus'],
  ['🐳', 'whale'],
  ['🌸', 'berry_cherry'], // không có hoa — cherry gần đúng
  ['⭐', 'starfish'], // không có sao — sao biển gần đúng
]);

/** Đổi 1 emoji legacy → slug trong bộ pixel; không khớp thì trả về null. */
export function emojiToPixel(emoji: string | undefined | null): string | null {
  if (typeof emoji !== 'string') return null;
  const slug = EMOJI_TO_PIXEL.get(emoji.trim());
  return slug ?? null;
}

/** Đường dẫn ảnh TĨNH (PNG) của 1 slug — dùng cho avatar thường. */
export function pixelPngSrc(slug: string): string {
  return `/pixel-avatars/png/${slug}.png`;
}

/** Đường dẫn ảnh ĐỘNG (GIF) của 1 slug — dùng cho logo/thương hiệu. */
export function pixelGifSrc(slug: string): string {
  return `/pixel-avatars/gif/${slug}.gif`;
}

/** Tên hiển thị dễ đọc từ slug (dùng cho alt/aria-label của ảnh chọn). */
export function prettyAvatarName(slug: string): string {
  return slug
    .split('_')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

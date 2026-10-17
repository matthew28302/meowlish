import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  PIXEL_AVATAR_SLUGS,
  parsePixelAvatar,
  emojiToPixel,
  pixelPngSrc,
  pixelGifSrc,
  prettyAvatarName,
} from '@/lib/pixelAvatars';

/**
 * Bộ avatar pixel 99 ảnh (thay bộ emoji cũ). Chốt 3 thứ tính năng cần giữ:
 * format đường dẫn chung public, whitelist chặt khi parse "pixel:<slug>" và
 * bảng legacy emoji → pixel (user cũ lưu "🐼" vẫn hiện đúng ảnh panda).
 */
describe('pixelAvatars', () => {
  describe('PIXEL_AVATAR_SLUGS', () => {
    it('co dung 99 slug, khong trung lap va thoa chuan ten file khong dau', () => {
      expect(PIXEL_AVATAR_SLUGS).toHaveLength(99);
      expect(new Set(PIXEL_AVATAR_SLUGS).size).toBe(99);
      for (const slug of PIXEL_AVATAR_SLUGS) {
        expect(slug).toMatch(/^[a-z0-9_]+$/);
      }
    });

    it('moi slug deu co file PNG va GIF trong public/pixel-avatars', () => {
      const root = process.cwd();
      for (const slug of PIXEL_AVATAR_SLUGS) {
        const png = path.join(root, 'public', 'pixel-avatars', 'png', `${slug}.png`);
        const gif = path.join(root, 'public', 'pixel-avatars', 'gif', `${slug}.gif`);
        expect({ slug, pngExists: fs.existsSync(png) }).toEqual({ slug, pngExists: true });
        expect({ slug, gifExists: fs.existsSync(gif) }).toEqual({ slug, gifExists: true });
      }
    });
  });

  describe('parsePixelAvatar', () => {
    it('phan tich dung gia tri "pixel:<slug>" hop le', () => {
      expect(parsePixelAvatar('pixel:cat')).toBe('cat');
      expect(parsePixelAvatar('pixel:hello_kitty')).toBe('hello_kitty');
      expect(parsePixelAvatar('pixel:l_deathnote')).toBe('l_deathnote');
      expect(parsePixelAvatar('pixel:keroppi')).toBe('keroppi');
      // Tự động bỏ khoảng trắng hai đầu (giá trị trim trước khi parse).
      expect(parsePixelAvatar(' pixel:panda ')).toBe('panda');
    });

    it('tra null voi slug khong nam trong whitelist', () => {
      expect(parsePixelAvatar('pixel:unicorn')).toBeNull();
      expect(parsePixelAvatar('pixel:')).toBeNull();
      expect(parsePixelAvatar('pixel:cat fan')).toBeNull();
      expect(parsePixelAvatar('pixel:../hack')).toBeNull();
      expect(parsePixelAvatar('pixel:Cat')).toBeNull(); // có phân biệt hoa/thường
    });

    it('tra null khi thieu prefix "pixel:"', () => {
      expect(parsePixelAvatar('cat')).toBeNull();
      expect(parsePixelAvatar('🐱')).toBeNull();
      expect(parsePixelAvatar('')).toBeNull();
    });

    it('tra null voi du lieu khong phai chuoi', () => {
      expect(parsePixelAvatar(undefined)).toBeNull();
      expect(parsePixelAvatar(null)).toBeNull();
      // @ts-expect-error — dữ liệu rác từ body không tin cậy
      expect(parsePixelAvatar(42)).toBeNull();
    });
  });

  describe('emojiToPixel (mapping legacy)', () => {
    it('doi dung cac emoji cu sang ang pixel tuong ung', () => {
      expect(emojiToPixel('🐱')).toBe('cat');
      expect(emojiToPixel('🐶')).toBe('dog');
      expect(emojiToPixel('🦊')).toBe('fox');
      expect(emojiToPixel('🐼')).toBe('panda');
      expect(emojiToPixel('🐨')).toBe('koala');
      expect(emojiToPixel('🦁')).toBe('lion');
      expect(emojiToPixel('🐯')).toBe('tiger');
      expect(emojiToPixel('🐰')).toBe('rabbit');
      expect(emojiToPixel('🐸')).toBe('frog');
      expect(emojiToPixel('🐵')).toBe('monkey');
      expect(emojiToPixel('🐮')).toBe('cow');
      expect(emojiToPixel('🐷')).toBe('pig');
      expect(emojiToPixel('🐧')).toBe('penguin');
      expect(emojiToPixel('🐦')).toBe('chick');
      expect(emojiToPixel('🦋')).toBe('butterfly');
      expect(emojiToPixel('🐢')).toBe('turtle');
      expect(emojiToPixel('🐙')).toBe('octopus');
      expect(emojiToPixel('🐳')).toBe('whale');
      expect(emojiToPixel('🌸')).toBe('berry_cherry');
      expect(emojiToPixel('⭐')).toBe('starfish');
    });

    it('tra null cho emoji khong co hinh tuong ung trong bo pixel', () => {
      // 🦄 🦖 🔥 cố tình bị bỏ khỏi mapping — hiển thị emoji như cũ, không ép
      // sang ảnh khác. Cả các emoji dữ liệu rác (👨‍💻 🎀 ⚡) cũng trả về null.
      expect(emojiToPixel('🦄')).toBeNull();
      expect(emojiToPixel('🦖')).toBeNull();
      expect(emojiToPixel('🔥')).toBeNull();
      expect(emojiToPixel('👨‍💻')).toBeNull();
      expect(emojiToPixel('🎀')).toBeNull();
      expect(emojiToPixel('⚡')).toBeNull();
      expect(emojiToPixel('')).toBeNull();
      expect(emojiToPixel(undefined)).toBeNull();
      expect(emojiToPixel(null)).toBeNull();
    });

    it('moi slug trong mapping deu nam trong whitelist 99 anh', () => {
      const mapped = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐰', '🐸', '🐵', '🐮', '🐷', '🐧', '🐦', '🦋', '🐢', '🐙', '🐳', '🌸', '⭐'];
      for (const e of mapped) {
        const slug = emojiToPixel(e);
        expect({ emoji: e, slug, valid: slug !== null && (PIXEL_AVATAR_SLUGS as readonly string[]).includes(slug) })
          .toEqual({ emoji: e, slug, valid: true });
      }
    });
  });

  describe('duong dan anh', () => {
    it('pixelPngSrc tra dung /pixel-avatars/png/<slug>.png', () => {
      expect(pixelPngSrc('cat')).toBe('/pixel-avatars/png/cat.png');
      expect(pixelPngSrc('berry_cherry')).toBe('/pixel-avatars/png/berry_cherry.png');
    });

    it('pixelGifSrc tra dung /pixel-avatars/gif/<slug>.gif', () => {
      expect(pixelGifSrc('cat')).toBe('/pixel-avatars/gif/cat.gif');
      expect(pixelGifSrc('tuxedosam')).toBe('/pixel-avatars/gif/tuxedosam.gif');
    });

    it('prettyAvatarName bo dau "_" va viet hoa chu cai dau', () => {
      expect(prettyAvatarName('cat')).toBe('Cat');
      expect(prettyAvatarName('berry_cherry')).toBe('Berry Cherry');
      expect(prettyAvatarName('hello_kitty')).toBe('Hello Kitty');
    });
  });
});

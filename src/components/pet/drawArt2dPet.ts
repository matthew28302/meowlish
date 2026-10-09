/**
 * Art2D Pet Standee Renderer — vẽ thú cưng dạng "tranh 2D" (sprite WebP) lên canvas
 * kèm chuyển động tự sinh theo state. Giữ nguyên contract tọa độ của drawChibiPet
 * để hai loại sprite (vector chibi / standee art2d) thay thế nhau liền mạch
 * trong Đấu Trường PvP & Đua Thú Cưng mà caller không cần đổi hệ tọa độ.
 */

import { PETS_CATALOG, PetConfig } from '@/lib/petData';

export interface DrawArt2dPetOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  scale?: number;
  species: string;
  state?: 'idle' | 'walk' | 'run' | 'attack' | 'hit' | 'stunned' | 'happy';
  frame?: number;
  direction?: 1 | -1;
  /** Sprite WebP đã preload sẵn. null → không vẽ gì, caller tự fallback về chibi. */
  img: CanvasImageSource | null;
  /** Tỉ lệ w/h của ảnh gốc — caller truyền sẵn để kích thước vẽ không phụ thuộc trình duyệt decode xong chưa. */
  imgAspect?: number;
}

/** Pet "tranh 2D" nhận diện bằng tiền tố art2d_ trong species id (contract với petData). */
export function isArt2dSpecies(species: string): boolean {
  return typeof species === 'string' && species.startsWith('art2d_');
}

/**
 * ĐƯỜNG NỀN CHUNG (baseline): drawChibiPet vẽ bóng ellipse tại local y≈18 và
 * bàn chân chibi nằm ~y=13-18, tức mặt đất của chibi nằm 18px DƯỚI điểm neo (x, y).
 * Standee đặt chân vào đúng y=18 đó để hai loại sprite đứng chung một mặt đất
 * khi caller truyền cùng tọa độ.
 */
const GROUND_Y = 18;
/** Chiều cao nhân vật (px world): chibi ~60px, standee 64px cho dáng người đậm chất "2D art". */
const STANDEE_H = 64;
/** Aspect dự phòng khi chưa biết kích thước ảnh: dáng người đứng hơi cao. */
const FALLBACK_ASPECT = 0.75;

function resolveAspect(img: CanvasImageSource, imgAspect?: number): number {
  if (imgAspect && imgAspect > 0) return imgAspect;
  // Ảnh đã preload xong thì naturalWidth đáng tin; chưa có thì dùng dự phòng.
  const el = img as HTMLImageElement;
  if (el.naturalWidth && el.naturalHeight) return el.naturalWidth / el.naturalHeight;
  return FALLBACK_ASPECT;
}

export function drawArt2dPet({
  ctx,
  x,
  y,
  scale = 1,
  state = 'idle',
  frame = 0,
  direction = 1,
  img,
  imgAspect,
}: DrawArt2dPetOptions) {
  // Chưa có ảnh (lỗi load / chưa xong) → không vẽ gì cả, nhường lại cho caller vẽ chibi.
  if (!img) return;

  const aspect = resolveAspect(img, imgAspect);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction * scale, scale);

  // 1. Bóng đất trước — y hệt chibi (cùng màu, cùng cỡ, nới rộng khi chạy) để
  //    hai loại sprite có "mặt đất" giống nhau trong cùng khung hình.
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, GROUND_Y, 22 * (state === 'run' ? 1.2 : 1), 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Chuyển động tự sinh — mọi phép xoay/nén đều lấy CHÂN làm trục nên nhân
  //    vật không bị "trôi" khỏi mặt đất. Chú ý: hệ tọa độ đã bị lật bởi
  //    scale(direction), nên nghiêng dấu cố định (+) là nghiêng VỀ PHÍA TRƯỚC
  //    của cả 2 hướng quay mặt, còn nhân direction (như tilt của chibi) sẽ
  //    nghiêng về +x thế giới — làm theo chibi cho walk/run để đồng bộ arena.
  let bob = 0; // nhún dọc cả thân (dấu + xuống dưới, khớp pha chibi)
  let lift = 0; // bật rời mặt đất (happy)
  let lean = 0; // nghiêng người theo trục trước/sau
  let sway = 0; // đung đưa ngang thân
  let scaleX = 1;
  let scaleY = 1;
  let dim = false;

  switch (state) {
    case 'walk':
      bob = Math.sin(frame * 0.2) * 4; // hệ số 0.2 giống chibi để các arena cùng nhịp
      sway = Math.sin(frame * 0.1) * 0.021; // ±1.2°
      lean = direction * 0.044; // ~2.5° theo tilt-convention của chibi
      scaleY *= 1 - 0.015 * Math.abs(Math.cos(frame * 0.2)); // nén nhẹ nhịp bước
      break;
    case 'run':
      bob = Math.sin(frame * 0.35) * 7;
      sway = Math.sin(frame * 0.175) * 0.035;
      lean = direction * 0.087; // 5°
      scaleY *= 1 - 0.03 * Math.abs(Math.cos(frame * 0.35));
      break;
    case 'attack':
      // Lao tới nhanh: nghiêng trước 0.12rad (dấu cố định vì hệ đã lật — xem chú ý mục 2)
      // kèm phồng ngang nhẹ nhịp nhanh cho cảm giác phóng người.
      lean = 0.12;
      scaleX *= 1 + 0.03 * (0.5 + 0.5 * Math.sin(frame * 0.9));
      break;
    case 'hit':
      // Giật lùi: ngả sau 0.1rad (dấu âm cố định → lùi theo thế giới ở cả 2 hướng)
      // và nén dúm 0.95 để ăn dmg trông "đau" thật.
      lean = -0.1;
      scaleY *= 0.95;
      break;
    case 'stunned':
      sway = Math.sin(frame * 0.06) * 0.15; // lảo đảo chậm ±8.6°
      dim = true;
      break;
    case 'happy': {
      // Bật nhảy: chân rời đất theo |sin|, squash lúc chạm đất - stretch trên cao,
      // hai phép scale cùng pha với độ bật để giữ "khối" nhân vật tự nhiên.
      const hop = Math.abs(Math.sin(frame * 0.15));
      lift = hop * 8;
      scaleY *= 0.92 + 0.12 * hop;
      scaleX *= 1.05 - 0.09 * hop;
      break;
    }
    default:
      // idle: thở (chu kỳ ~3.2s tại 60fps → ω=2π/192) phồng 1→1.012,
      // đung đưa nhẹ ±0.8° chu kỳ ~6s (ω=2π/360) cho đứng yên vẫn "sống".
      scaleY *= 1 + 0.006 * (1 + Math.sin(frame * 0.0327));
      sway = Math.sin(frame * 0.0175) * 0.014;
      break;
  }

  // 3. Dời trục về chân (trên đường nền chung), áp bob/lift rồi mới xoay + nén.
  ctx.translate(0, GROUND_Y + bob - lift);
  ctx.rotate(lean + sway);
  ctx.scale(scaleX, scaleY);
  if (dim) ctx.globalAlpha = 0.8; // choáng: chìm màu nhẹ báo hiệu mất điều khiển

  // 4. Standee: đáy ảnh nằm đúng trục chân (y=0 cục bộ) → drawImage từ -h lên.
  const h = STANDEE_H;
  const w = h * aspect;
  ctx.drawImage(img, -w / 2, -h, w, h);

  ctx.restore();
}

/**
 * Nạp sẵn sprite WebP của pet art2d theo contract `sprite2d` trong PETS_CATALOG.
 * Trường sprite2d có thể chưa tồn tại với catalog cũ / loài thường → resolve null,
 * caller cứ việc fallback về drawChibiPet. Không bao giờ reject để caller
 * khỏi try/catch trong effect.
 */
export function preloadArt2dSprite(species: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const config = PETS_CATALOG[species] as (PetConfig & { sprite2d?: string }) | undefined;
    const src = config?.sprite2d;
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

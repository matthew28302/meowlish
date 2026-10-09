'use client';

import React, { useId, useState } from 'react';
import PixelPetSprite, { PetAnimationState } from './PixelPetSprite';
import { PETS_CATALOG, PetConfig } from '@/lib/petData';

export interface Art2dPetSpriteProps {
  species: string;
  animationState?: PetAnimationState;
  facing?: 'left' | 'right';
  scale?: number;
  /** Chấp nhận cho tương thích drop-in với PixelPetSprite, nhưng BỎ QUA có chủ đích:
   *  nhân vật người đã mặc trang phục gốc của tác phẩm trong tranh — mũ/áo chibi
   *  không khớp nhân vật nên không bao giờ gắn vào standee. */
  equippedHat?: string | null;
  equippedOutfit?: string | null;
  equippedAccessory?: string | null;
  className?: string;
  isSleeping?: boolean;
}

/**
 * Entry catalog forward-compatible: agent dữ liệu sẽ thêm `sprite2d` +
 * `art2dFranchise` (optional) vào PetConfig — intersect ở đây để file compile
 * cả TRƯỚC lẫn SAU khi field đó đổ về (không được sửa petData.ts từ agent này).
 */
type CatalogEntry = PetConfig & { sprite2d?: string; art2dFranchise?: string };

/**
 * Chiều cao khung sprite theo cùng "pipeline scale" của chibi (chibi: 64×scale).
 * SỬA 2026-10-09 (yêu cầu user): "kích cỡ pet bằng với các pet ban đầu" —
 * bản trước để 96 = 1.5×64 khiến nhân vật 2D nổi bật to hơn hẳn thú chibi
 * (TinyFish đo trên prod: ~1/3 chiều cao khu vườn, "bigger" hơn chibi).
 * Sprite giờ đã TRIM SÁT nhân vật (bỏ padding poster + nền đã xóa bằng
 * rembg ở scripts/build-pet-art-2d.mjs) nên 64 là chiều cao THẬT của nhân
 * vật, so sánh trực tiếp với chibi 64 được.
 */
const ART2D_BASE_H = 64;

/** Aspect mặc định trước khi ảnh load — median đo thật của 34 sprite sau
 * trim (2026-10-09): 0.598. Chỉ tránh CLS khung hình lúc ảnh chưa decode. */
const DEFAULT_ASPECT = 0.6;

/** Fallback chibi theo franchise khi sprite thiếu/404 — giữ vườn không trống pet. */
const FALLBACK_CHIBI: Record<string, string> = {
  sanrio: 'hello_kitty',
  harry_potter: 'hedwig',
  naruto: 'kurama',
  onepiece: 'chopper',
  avengers: 'rocket',
  doraemon: 'doraemon',
};

/**
 * Lớp animation scoped — mirror quy ước buildPetAnimCss của PixelPetSprite:
 * tên keyframe CỐ ĐỊNH (keyframe không phải selector, trùng tên giữa các instance
 * là vô hại vì rule giống hệt nhau), còn CLASS thì tiền tố uid mỗi instance.
 *
 * Chuyển động "người thật": mọi motion gốc bottom center (người xoay từ gan chân,
 * không phải từ tâm). Motion phức hợp (2 animation cùng thuộc tính transform) phải
 * tách 2 div lồng nhau — 1 element chỉ có 1 transform thắng trong cascade.
 *
 * A11y (quy ước M13, globals.css:1299-1316): prefers-reduced-motion: reduce ⇒
 * TẮT HẲN animation. Mọi keyframe đều mở/đóng ở tư thế nghỉ nên đứng im là đúng;
 * riêng độ nghiêng tiến là pose tĩnh (không phải animation) nên được giữ nguyên.
 */
function buildArt2dAnimCss(uid: string): string {
  const all = [
    `${uid}-breathe`,
    `${uid}-shift`,
    `${uid}-sway-walk`,
    `${uid}-bob-walk`,
    `${uid}-sway-run`,
    `${uid}-bob-run`,
    `${uid}-jump`,
    `${uid}-shadow-jump`,
    `${uid}-breathe-slow`,
    `${uid}-wobble`,
    `${uid}-eat`,
    `${uid}-sniff`,
    `${uid}-climb`,
    `${uid}-swim`,
  ];
  return [
    /* idle: thở rất chậm 3.2s, scale dọc 1→1.012 quanh gan chân */
    `@keyframes a2p-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.012)}}`,
    /* idle: dịch trọng lượng ~6s/lần — hông nghiêng ±0.8°, đọc như người đứng thở */
    `@keyframes a2p-shift{0%,100%{transform:rotate(0deg)}30%{transform:rotate(0.8deg)}70%{transform:rotate(-0.8deg)}}`,
    /* walk: đung đưa thân ±1.2° đúng TẦN SỐ BƯỚC (0.55s/bước trái-phải) */
    `@keyframes a2p-sway-walk{0%,100%{transform:rotate(1.2deg)}50%{transform:rotate(-1.2deg)}}`,
    /* walk: nhún dọc GẤP ĐÔI tần số bước (người nhún 2 lần/chu kỳ bước trái-phải);
       chân chạm đất = điểm thấp ⇒ squash scaleY 0.985, nhún lên ~4px giữa 2 bước */
    `@keyframes a2p-bob-walk{0%,100%{transform:translateY(0) scaleY(0.985)}50%{transform:translateY(-4px) scaleY(1)}}`,
    /* run: cùng công thức, nhanh & mạnh hơn — ±2°, -7px, squash 0.97 */
    `@keyframes a2p-sway-run{0%,100%{transform:rotate(2deg)}50%{transform:rotate(-2deg)}}`,
    `@keyframes a2p-bob-run{0%,100%{transform:translateY(0) scaleY(0.97)}50%{transform:translateY(-7px) scaleY(1)}}`,
    /* jump/happy: squash-and-stretch ~0.9s — chồm xuống (0.94) → phóng lên
       (1.06, -10px) → chạm đất (0.96) → vươn lại */
    `@keyframes a2p-jump{0%{transform:translateY(0) scale(1,1)}14%{transform:translateY(0.5px) scale(1.03,0.94)}38%{transform:translateY(-10px) scale(0.97,1.06)}62%{transform:translateY(-4px) scale(1,1)}82%{transform:translateY(0) scale(1.015,0.96)}100%{transform:translateY(0) scale(1,1)}}`,
    /* bóng đất: co scaleX tới 0.9 đúng lúc nhân vật ở điểm cao nhất của cung nhảy
       (38%) — neo vật lý; translateX(-50%) phải nằm trong keyframe vì animation
       override transform inline (Tailwind v4 dùng thuộc tính translate riêng) */
    `@keyframes a2p-shadow-jump{0%,100%{transform:translateX(-50%) scaleX(1)}38%{transform:translateX(-50%) scaleX(0.9)}62%{transform:translateX(-50%) scaleX(0.94)}82%{transform:translateX(-50%) scaleX(0.98)}}`,
    /* sleep: thở chậm 4s + wobble ±1.5° như người ngủ gật */
    `@keyframes a2p-breathe-slow{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.02)}}`,
    `@keyframes a2p-wobble{0%,100%{transform:rotate(0deg)}25%{transform:rotate(1.5deg)}75%{transform:rotate(-1.5deg)}}`,
    /* eat: gật người về phía trước nhịp 0.45s như đang cúi ăn */
    `@keyframes a2p-eat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(1px) rotate(2.5deg)}}`,
    /* sniff: nghiêng tò mò trái-phải (mirror nhịp ppet-sniff của chibi) */
    `@keyframes a2p-sniff{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-0.8px) rotate(1.3deg)}75%{transform:translateY(-0.8px) rotate(-1.3deg)}}`,
    /* climb: leo chậm — nhích -2px rồi tịnh lại */
    `@keyframes a2p-climb{0%,100%{transform:translateY(0)}45%{transform:translateY(-2px)}70%{transform:translateY(-0.4px)}}`,
    /* swim: lượn thân chậm 1.4s — người lội nước */
    `@keyframes a2p-swim{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-1.2px) rotate(1.6deg)}}`,
    `.${uid}-breathe{animation:a2p-breathe 3.2s ease-in-out infinite}`,
    `.${uid}-shift{animation:a2p-shift 6.4s ease-in-out infinite}`,
    `.${uid}-sway-walk{animation:a2p-sway-walk 0.55s ease-in-out infinite}`,
    `.${uid}-bob-walk{animation:a2p-bob-walk 0.275s ease-in-out infinite}`,
    `.${uid}-sway-run{animation:a2p-sway-run 0.32s ease-in-out infinite}`,
    `.${uid}-bob-run{animation:a2p-bob-run 0.16s ease-in-out infinite}`,
    `.${uid}-jump{animation:a2p-jump 0.9s ease-in-out infinite}`,
    `.${uid}-shadow-jump{animation:a2p-shadow-jump 0.9s ease-in-out infinite}`,
    `.${uid}-breathe-slow{animation:a2p-breathe-slow 4s ease-in-out infinite}`,
    `.${uid}-wobble{animation:a2p-wobble 6s ease-in-out infinite}`,
    `.${uid}-eat{animation:a2p-eat 0.45s ease-in-out infinite}`,
    `.${uid}-sniff{animation:a2p-sniff 0.5s ease-in-out infinite}`,
    `.${uid}-climb{animation:a2p-climb 0.7s ease-in-out infinite}`,
    `.${uid}-swim{animation:a2p-swim 1.4s ease-in-out infinite}`,
    `@media (prefers-reduced-motion: reduce){${all.map((c) => `.${c}`).join(',')}{animation:none !important}}`,
  ].join('');
}

function Art2dPetSprite({
  species = 'owl',
  animationState = 'idle',
  facing = 'right',
  scale = 1,
  className = '',
  isSleeping = false,
}: Art2dPetSpriteProps) {
  const rawId = useId();
  const uid = `a2p${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  // Lưu aspect thật sau onLoad để đặt aspect-ratio — layout không shift sau load
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [failed, setFailed] = useState(false);

  const entry = PETS_CATALOG[species] as CatalogEntry | undefined;
  const sprite = entry?.sprite2d;

  const effectiveState: PetAnimationState = isSleeping ? 'sleep' : animationState;
  const isLeft = facing === 'left';
  // Dấu nghiêng tiến: +1 = theo kim đồng hồ (nghiêng về PHẢI = "về trước" khi nhìn
  // phải). Lớp lật scaleX nằm BÊN TRONG lớp nghiêng nên không cần đổi dấu khi trái.
  const facingSign = isLeft ? -1 : 1;
  const isAirborne = effectiveState === 'jump' || effectiveState === 'happy';

  // Phân lớp: trạng thái có 2 motion phức hợp (idle/sleep/walk/run) dùng cả 2 div,
  // còn lại chỉ dùng div trong.
  let outerAnim = '';
  let innerAnim = '';
  switch (effectiveState) {
    case 'idle':
      outerAnim = `${uid}-shift`;
      innerAnim = `${uid}-breathe`;
      break;
    case 'walk':
      outerAnim = `${uid}-sway-walk`;
      innerAnim = `${uid}-bob-walk`;
      break;
    case 'run':
      outerAnim = `${uid}-sway-run`;
      innerAnim = `${uid}-bob-run`;
      break;
    case 'sleep':
      outerAnim = `${uid}-wobble`;
      innerAnim = `${uid}-breathe-slow`;
      break;
    case 'jump':
    case 'happy':
      innerAnim = `${uid}-jump`;
      break;
    case 'eat':
      innerAnim = `${uid}-eat`;
      break;
    case 'sniff':
      innerAnim = `${uid}-sniff`;
      break;
    case 'climb':
      innerAnim = `${uid}-climb`;
      break;
    case 'swim':
      innerAnim = `${uid}-swim`;
      break;
  }

  // Nghiêng tiến là POSE TĨNH (không animation): walk 2.5°, run 5° — người dồn
  // thân về hướng đi; đứng im tuyệt đối dưới reduced-motion vẫn đọc đúng hướng.
  const leanDeg = effectiveState === 'run' ? 5 : effectiveState === 'walk' ? 2.5 : 0;

  // Fallback an toàn: id art2d hỏng (catalog chưa có sprite2d, hoặc webp 404 qua
  // onError) ⇒ chibi cùng vũ trụ thay thế — vườn không bao giờ trắng pet.
  if (!sprite || failed) {
    const franchise = species.split('__')[0]?.replace(/^art2d_/, '') || '';
    return (
      <PixelPetSprite
        species={FALLBACK_CHIBI[franchise] ?? 'owl'}
        animationState={animationState}
        facing={facing}
        scale={scale} /* fallback chibi cùng khung 64 — cao bằng sprite 2D */
        className={className}
        isSleeping={isSleeping}
      />
    );
  }

  const boxH = ART2D_BASE_H * scale;

  return (
    <div
      className={`relative inline-block select-none pointer-events-none ${className}`}
      style={{ height: boxH, aspectRatio: aspect }}
    >
      <style data-art2d-anim={uid}>{buildArt2dAnimCss(uid)}</style>

      {/* Bóng đất ellipse ~70% bề ngang (radial-gradient mềm) — nằm NGOÀI lớp
          nghiêng/lật để luôn phẳng dưới chân; airborne thì co theo cung nhảy */}
      <div
        className={`absolute bottom-0 left-1/2 ${isAirborne ? `${uid}-shadow-jump` : ''}`}
        style={{
          transform: 'translateX(-50%)',
          width: '70%',
          height: Math.max(5, boxH * 0.07),
          background: 'radial-gradient(closest-side, rgba(0, 0, 0, 0.26) 55%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* Lớp 1 — nghiêng tiến (pose tĩnh) */}
      <div
        className="absolute inset-0"
        style={{
          transform: leanDeg ? `rotate(${facingSign * leanDeg}deg)` : undefined,
          transformOrigin: 'bottom center',
        }}
      >
        {/* Lớp 2 — lật ngang khi quay trái; wrapper riêng để scaleX không ghi đè
            keyframe bob/sway của lớp trong */}
        <div
          className="absolute inset-0"
          style={{ transform: `scaleX(${isLeft ? -1 : 1})`, transition: 'transform 0.15s ease-out' }}
        >
          {/* Lớp 3+4 — hai lớp keyframe lồng nhau cho motion phức hợp */}
          <div className={`absolute inset-0 ${outerAnim}`} style={{ transformOrigin: 'bottom center' }}>
            <div className={`absolute inset-0 ${innerAnim}`} style={{ transformOrigin: 'bottom center' }}>
              <img
                src={sprite}
                alt=""
                loading="eager"
                decoding="async"
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setAspect(img.naturalWidth / img.naturalHeight);
                  }
                }}
                onError={() => setFailed(true)}
                className="block h-full w-full object-contain object-bottom"
                /* ngủ: tối ảnh như chibi (filter brightness .8) — nằm ngoài keyframe
                   vì filter không tham gia transform nên không xung đột lớp */
                style={effectiveState === 'sleep' ? { filter: 'brightness(0.8)' } : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Art2dPetSprite);

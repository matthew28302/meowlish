const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/components/pet/PixelPetSprite.tsx');

const fullCode = `'use client';

import React from 'react';

export type PetAnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sleep'
  | 'eat'
  | 'happy'
  | 'sniff'
  | 'climb'
  | 'swim'
  | 'jump';

export interface PixelPetSpriteProps {
  species:
    | 'owl'
    | 'cat'
    | 'dog'
    | 'fox'
    | 'panda'
    | 'bunny'
    | 'hello_kitty'
    | 'kuromi'
    | 'cinnamoroll'
    | 'my_melody'
    | 'pompompurin'
    | 'keroppi'
    | 'chopper'
    | 'karoo'
    | 'bepo'
    | 'kurama'
    | 'pakkun'
    | 'gamakichi'
    | 'hedwig'
    | 'crookshanks'
    | 'fawkes'
    | 'goose'
    | 'rocket'
    | 'alligator_loki'
    | 'doraemon'
    | 'dorami'
    | 'kirby'
    | string;
  animationState?: PetAnimationState;
  facing?: 'left' | 'right';
  scale?: number;
  equippedHat?: string | null;
  equippedOutfit?: string | null;
  equippedAccessory?: string | null;
  className?: string;
  isSleeping?: boolean;
}

export default function PixelPetSprite({
  species = 'owl',
  animationState = 'idle',
  facing = 'right',
  scale = 3.5,
  equippedHat,
  equippedOutfit,
  equippedAccessory,
  className = '',
  isSleeping = false,
}: PixelPetSpriteProps) {
  const isLeft = facing === 'left';
  const effectiveState = isSleeping ? 'sleep' : animationState;

  // Animation CSS classes based on state
  const getAnimClass = () => {
    switch (effectiveState) {
      case 'walk':
        return 'animate-pixel-walk';
      case 'run':
        return 'animate-pixel-run';
      case 'sleep':
        return 'animate-pixel-sleep';
      case 'eat':
        return 'animate-pixel-eat';
      case 'happy':
        return 'animate-pixel-happy';
      case 'climb':
        return 'animate-pixel-climb';
      case 'swim':
        return 'animate-pixel-swim';
      case 'jump':
        return 'animate-pixel-jump';
      case 'idle':
      default:
        return 'animate-pixel-idle';
    }
  };

  return (
    <div
      className={\`relative inline-block select-none pointer-events-none \${className}\`}
      style={{
        transform: \`scaleX(\${isLeft ? -1 : 1})\`,
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* SVG Canvas for 2D Vector Art Character (64x64 grid) */}
      <svg
        viewBox="0 0 64 64"
        width={64 * scale}
        height={64 * scale}
        className={\`overflow-visible \${getAnimClass()}\`}
      >
        <defs>
          <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <radialGradient id="highlight" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Lớp 0: Ground Shadow hoặc Gợn Sóng Nước khi Bơi */}
        {effectiveState === 'swim' ? (
          <g className="pixel-swim-waves">
            <ellipse cx="32" cy="54" rx="28" ry="8" fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
            <ellipse cx="32" cy="54" rx="18" ry="5" fill="none" stroke="#e0f2fe" strokeWidth="0.8" />
          </g>
        ) : (
          <ellipse cx="32" cy="58" rx="18" ry="4.5" fill="rgba(0, 0, 0, 0.18)" />
        )}

        {/* Lớp 1: Cánh & Phụ Kiện Lưng (Back Accessory) */}
        {equippedAccessory === 'angel_wings' && (
          <g className="pixel-wings-layer">
            <path d="M 16 22 C 8 22, 4 14, 10 10 C 12 8, 16 10, 16 14 Z" fill="#ffffff" stroke="#e0f2fe" strokeWidth="1" />
            <path d="M 14 18 C 8 18, 6 12, 10 10" fill="none" stroke="#bae6fd" strokeWidth="1" />
            <path d="M 48 22 C 56 22, 60 14, 54 10 C 52 8, 48 10, 48 14 Z" fill="#ffffff" stroke="#e0f2fe" strokeWidth="1" />
            <path d="M 50 18 C 56 18, 58 12, 54 10" fill="none" stroke="#bae6fd" strokeWidth="1" />
          </g>
        )}

        {equippedAccessory === 'demon_wings' && (
          <g className="pixel-demon-wings-layer">
            <path d="M 20 28 L 2 18 L 6 14 L 14 18 L 12 30 Z" fill="#312e81" stroke="#1e1b4b" strokeWidth="1" />
            <path d="M 2 18 L 6 10 L 10 16" fill="#4338ca" />
            <path d="M 44 28 L 62 18 L 58 14 L 50 18 L 52 30 Z" fill="#312e81" stroke="#1e1b4b" strokeWidth="1" />
            <path d="M 62 18 L 58 10 L 54 16" fill="#4338ca" />
          </g>
        )}

        {equippedAccessory === 'zoro_bamboo_sword' && (
          <g className="pixel-zoro-sword-layer">
            <line x1="44" y1="20" x2="56" y2="8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <rect x="46" y="17" width="6" height="3" fill="#facc15" rx="1" />
            <line x1="40" y1="24" x2="44" y2="20" stroke="#15803d" strokeWidth="4" />
          </g>
        )}

        {/* ========================================================================= */}
        {/* LỚP 2: THÂN THÚ CƯNG (27 LOÀI CHUẨN ANIME & POP CULTURE CHÍNH XÁC 100%) */}
        {/* ========================================================================= */}

        {/* 1. HELLO KITTY (SANRIO) */}
        {species === 'hello_kitty' && (
          <g id="species-hello-kitty">
            <polygon points="16,18 12,8 24,14" fill="#ffffff" stroke="#334155" strokeWidth="1.6" strokeLinejoin="round" />
            <polygon points="40,14 52,8 48,18" fill="#ffffff" stroke="#334155" strokeWidth="1.6" strokeLinejoin="round" />
            <ellipse cx="32" cy="26" rx="20" ry="14" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
            <g id="kitty-bow">
              <ellipse cx="38" cy="12" rx="4.5" ry="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" transform="rotate(-15 38 12)" />
              <ellipse cx="48" cy="16" rx="4.5" ry="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" transform="rotate(15 48 16)" />
              <circle cx="43" cy="14" r="3.2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" />
              <circle cx="42" cy="13" r="0.9" fill="#fca5a5" />
            </g>
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 20 28 Q 23 31 26 28" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 38 28 Q 41 31 44 28" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="23" cy="27" rx="1.8" ry="2.6" fill="#111827" />
                <ellipse cx="41" cy="27" rx="1.8" ry="2.6" fill="#111827" />
              </>
            )}
            <ellipse cx="32" cy="29.5" rx="2.4" ry="1.6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <line x1="8" y1="24" x2="16" y2="25" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="7" y1="28" x2="16" y2="28" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="8" y1="32" x2="16" y2="31" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="48" y1="25" x2="56" y2="24" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="48" y1="28" x2="57" y2="28" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="48" y1="31" x2="56" y2="32" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 21 38 L 43 38 L 45 44 L 19 44 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.2" />
            <path d="M 22 43 L 42 43 L 43 54 L 21 54 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.2" />
            <line x1="25" y1="38" x2="25" y2="45" stroke="#1d4ed8" strokeWidth="2.5" />
            <circle cx="25" cy="45" r="1.3" fill="#facc15" />
            <line x1="39" y1="38" x2="39" y2="45" stroke="#1d4ed8" strokeWidth="2.5" />
            <circle cx="39" cy="45" r="1.3" fill="#facc15" />
            <circle cx="18" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="46" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="26" cy="55" rx="4" ry="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="38" cy="55" rx="4" ry="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          </g>
        )}

        {/* 2. KUROMI (SANRIO) */}
        {species === 'kuromi' && (
          <g id="species-kuromi">
            <path d="M 21 22 C 18 13, 11 9, 10 3 C 16 7, 24 14, 26 20 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="9" cy="3" r="2.8" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
            <path d="M 43 22 C 46 13, 53 9, 54 3 C 48 7, 40 14, 38 20 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="55" cy="3" r="2.8" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
            <path d="M 18 32 C 18 16, 46 16, 46 32 C 46 37, 44 41, 41 42 C 37 40, 27 40, 23 42 C 20 41, 18 37, 18 32 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="1.2" />
            <ellipse cx="32" cy="33" rx="13" ry="10" fill="#ffffff" />
            <g id="kuromi-skull">
              <ellipse cx="32" cy="18" rx="3.6" ry="3" fill="#f43f5e" />
              <circle cx="30.6" cy="17.8" r="0.8" fill="#1e1b4b" />
              <circle cx="33.4" cy="17.8" r="0.8" fill="#1e1b4b" />
              <rect x="30.5" y="20.5" width="3" height="1.2" rx="0.5" fill="#f43f5e" />
            </g>
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 32 Q 25 35 28 31" fill="none" stroke="#581c87" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 42 32 Q 39 35 36 31" fill="none" stroke="#581c87" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="31" rx="2.8" ry="3.8" fill="#581c87" transform="rotate(8 25 31)" />
                <circle cx="24.2" cy="29.5" r="1.3" fill="#ffffff" />
                <circle cx="25.8" cy="33" r="0.6" fill="#ffffff" />
                <path d="M 21.5 27 L 19.5 25 M 27.5 28 L 29 27" stroke="#1e1b4b" strokeWidth="1.2" strokeLinecap="round" />
                <ellipse cx="39" cy="31" rx="2.8" ry="3.8" fill="#581c87" transform="rotate(-8 39 31)" />
                <circle cx="38.2" cy="29.5" r="1.3" fill="#ffffff" />
                <circle cx="39.8" cy="33" r="0.6" fill="#ffffff" />
                <path d="M 42.5 27 L 44.5 25 M 36.5 28 L 35 27" stroke="#1e1b4b" strokeWidth="1.2" strokeLinecap="round" />
              </>
            )}
            <circle cx="32" cy="33.5" r="0.9" fill="#f43f5e" />
            <path d="M 29.5 35.5 Q 32 37.5 34.5 35.5" fill="none" stroke="#1e1b4b" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="20" cy="34.5" rx="2.2" ry="1.4" fill="#fda4af" />
            <ellipse cx="44" cy="34.5" rx="2.2" ry="1.4" fill="#fda4af" />
            <path d="M 22 42 L 26 46 L 32 43 L 38 46 L 42 42 Z" fill="#312e81" stroke="#1e1b4b" strokeWidth="1" />
            <circle cx="26" cy="46" r="1.5" fill="#f43f5e" />
            <circle cx="32" cy="44" r="1.5" fill="#f43f5e" />
            <circle cx="38" cy="46" r="1.5" fill="#f43f5e" />
            <rect x="25" y="44" width="14" height="9" rx="2" fill="#1e1b4b" />
            <path d="M 39 49 Q 47 51 46 44" fill="none" stroke="#1e1b4b" strokeWidth="1.5" />
            <polygon points="46,44 43,41 49,41" fill="#f43f5e" />
            <ellipse cx="28" cy="54" rx="3" ry="1.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="36" cy="54" rx="3" ry="1.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
        )}

        {/* 3. CINNAMOROLL (SANRIO) */}
        {species === 'cinnamoroll' && (
          <g id="species-cinnamoroll">
            <path d="M 18 28 C 7 24, 0 31, 2 38 C 5 43, 14 41, 18 34 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            <path d="M 46 28 C 57 24, 64 31, 62 38 C 59 43, 50 41, 46 34 Z" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            <ellipse cx="32" cy="30" rx="16" ry="12" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 30 Q 24 33 27 30" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 37 30 Q 40 33 43 30" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="29" rx="2.8" ry="3.8" fill="#0284c7" />
                <circle cx="23.2" cy="27.6" r="1.3" fill="#ffffff" />
                <circle cx="25" cy="31" r="0.7" fill="#ffffff" />
                <ellipse cx="40" cy="29" rx="2.8" ry="3.8" fill="#0284c7" />
                <circle cx="39.2" cy="27.6" r="1.3" fill="#ffffff" />
                <circle cx="41" cy="31" r="0.7" fill="#ffffff" />
              </>
            )}
            <ellipse cx="18" cy="33.5" rx="3.2" ry="1.8" fill="#fbcfe8" />
            <ellipse cx="46" cy="33.5" rx="3.2" ry="1.8" fill="#fbcfe8" />
            <path d="M 29.5 32.5 Q 32 34.5 34.5 32.5" fill="none" stroke="#0369a1" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="32" cy="45" rx="12" ry="9" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="44" cy="45" r="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            <path d="M 44 43 A 1.8 1.8 0 1 1 43 46" fill="none" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="24" cy="44" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="40" cy="44" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="27" cy="54" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="37" cy="54" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
        )}

        {/* 4. MY MELODY (SANRIO) */}
        {species === 'my_melody' && (
          <g id="species-my-melody">
            <rect x="20" y="4" width="7" height="18" rx="3.5" fill="#f472b6" stroke="#db2777" strokeWidth="1.2" />
            <path d="M 37 4 C 41 4, 44 7, 44 14 L 44 22 L 37 22 Z" fill="#f472b6" stroke="#db2777" strokeWidth="1.2" />
            <ellipse cx="32" cy="27" rx="17" ry="14" fill="#f472b6" stroke="#db2777" strokeWidth="1.2" />
            <circle cx="21" cy="14" r="2.2" fill="#ffffff" />
            <circle cx="25" cy="15" r="2.2" fill="#ffffff" />
            <circle cx="24" cy="19" r="2.2" fill="#ffffff" />
            <circle cx="19" cy="19" r="2.2" fill="#ffffff" />
            <circle cx="18" cy="15" r="2.2" fill="#ffffff" />
            <circle cx="21.5" cy="16.5" r="2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
            <ellipse cx="32" cy="30" rx="12" ry="9" fill="#ffffff" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 24 30 Q 26 33 28 30" fill="none" stroke="#1e1b4b" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M 36 30 Q 38 33 40 30" fill="none" stroke="#1e1b4b" strokeWidth="1.6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="26" cy="29" rx="1.8" ry="2.6" fill="#1e1b4b" />
                <ellipse cx="38" cy="29" rx="1.8" ry="2.6" fill="#1e1b4b" />
              </>
            )}
            <ellipse cx="32" cy="32" rx="2" ry="1.4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
            <path d="M 30 35 Q 32 36.5 34 35" fill="none" stroke="#1e1b4b" strokeWidth="1" strokeLinecap="round" />
            <path d="M 23 40 L 41 40 L 43 51 L 21 51 Z" fill="#f472b6" stroke="#db2777" strokeWidth="1.2" />
            <circle cx="32" cy="41" r="2" fill="#ffffff" />
            <ellipse cx="27" cy="54" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="37" cy="54" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
        )}

        {/* 5. POMPOMPURIN (SANRIO) */}
        {species === 'pompompurin' && (
          <g id="species-pompompurin">
            <ellipse cx="32" cy="14" rx="9" ry="3.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <rect x="31" y="9" width="2" height="3" fill="#78350f" rx="1" />
            <rect x="13" y="19" width="6" height="14" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1" transform="rotate(10 16 26)" />
            <rect x="45" y="19" width="6" height="14" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1" transform="rotate(-10 48 26)" />
            <ellipse cx="32" cy="27" rx="16" ry="12" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="23" y1="26" x2="27" y2="26" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="37" y1="26" x2="41" y2="26" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="25" cy="26" r="2" fill="#78350f" />
                <circle cx="39" cy="26" r="2" fill="#78350f" />
              </>
            )}
            <ellipse cx="32" cy="28.5" rx="2.2" ry="1.5" fill="#78350f" />
            <path d="M 28 31 Q 30 33 32 31 Q 34 33 36 31" fill="none" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="32" cy="44" rx="15" ry="11" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
            <circle cx="19" cy="43" r="3" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="45" cy="43" r="3" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
            <ellipse cx="26" cy="55" rx="4" ry="2.2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <ellipse cx="38" cy="55" rx="4" ry="2.2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="47" cy="45" r="2.5" fill="#eab308" />
          </g>
        )}

        {/* 6. KEROPPI (SANRIO) */}
        {species === 'keroppi' && (
          <g id="species-keroppi">
            <rect x="16" y="20" width="32" height="18" rx="9" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
            <circle cx="24" cy="14" r="8" fill="#ffffff" stroke="#16a34a" strokeWidth="1.5" />
            <circle cx="40" cy="14" r="8" fill="#ffffff" stroke="#16a34a" strokeWidth="1.5" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="18" y1="14" x2="30" y2="14" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="34" y1="14" x2="46" y2="14" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="25" cy="14" r="3.2" fill="#111827" />
                <circle cx="24" cy="13" r="1" fill="#ffffff" />
                <circle cx="39" cy="14" r="3.2" fill="#111827" />
                <circle cx="38" cy="13" r="1" fill="#ffffff" />
              </>
            )}
            <circle cx="19" cy="28" r="4.5" fill="#fda4af" />
            <circle cx="45" cy="28" r="4.5" fill="#fda4af" />
            <path d="M 29 27 L 32 30 L 35 27" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="22" y="37" width="20" height="15" rx="2" fill="#ef4444" stroke="#dc2626" strokeWidth="1.2" />
            <rect x="27" y="37" width="3.5" height="15" fill="#ffffff" />
            <rect x="33.5" y="37" width="3.5" height="15" fill="#ffffff" />
            <ellipse cx="26" cy="54" rx="4" ry="2.5" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
            <ellipse cx="38" cy="54" rx="4" ry="2.5" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
          </g>
        )}

        {/* 7. TONY TONY CHOPPER (ONE PIECE) */}
        {species === 'chopper' && (
          <g id="species-chopper">
            <path d="M 22 17 Q 15 11 11 5 M 15 10 Q 10 10 8 13" fill="none" stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 42 17 Q 49 11 53 5 M 49 10 Q 54 10 56 13" fill="none" stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 21 20 C 20 8, 44 8, 43 20 Z" fill="#ec4899" stroke="#db2777" strokeWidth="1.2" />
            <rect x="30" y="10" width="4" height="8" rx="0.5" fill="#ffffff" />
            <rect x="28" y="12" width="8" height="4" rx="0.5" fill="#ffffff" />
            <ellipse cx="32" cy="20" rx="19" ry="5" fill="#be185d" stroke="#9d174d" strokeWidth="1.2" />
            <polygon points="17,21 10,23 18,26" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
            <polygon points="16,22 12,23 16,24" fill="#fbcfe8" />
            <polygon points="47,21 54,23 46,26" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
            <polygon points="48,22 52,23 48,24" fill="#fbcfe8" />
            <ellipse cx="32" cy="32" rx="13" ry="10" fill="#d97706" stroke="#92400e" strokeWidth="1.2" />
            <ellipse cx="32" cy="35" rx="8" ry="5.5" fill="#fef3c7" />
            <circle cx="32" cy="32" r="3.2" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
            <circle cx="31" cy="31" r="1" fill="#e0f2fe" />
            <path d="M 29.5 37 Q 32 39.5 34.5 37" fill="none" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 30 Q 24 33 27 30" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 37 30 Q 40 33 43 30" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="29" rx="3.2" ry="4.5" fill="#1e1b4b" />
                <circle cx="23" cy="27.5" r="1.5" fill="#ffffff" />
                <circle cx="25.2" cy="31" r="0.8" fill="#ffffff" />
                <ellipse cx="40" cy="29" rx="3.2" ry="4.5" fill="#1e1b4b" />
                <circle cx="39" cy="27.5" r="1.5" fill="#ffffff" />
                <circle cx="41.2" cy="31" r="0.8" fill="#ffffff" />
              </>
            )}
            <circle cx="18" cy="33" r="2.8" fill="#fda4af" opacity="0.9" />
            <circle cx="46" cy="33" r="2.8" fill="#fda4af" opacity="0.9" />
            <rect x="24" y="42" width="16" height="10" rx="2" fill="#831843" stroke="#4c0519" strokeWidth="1" />
            <rect x="30.5" y="43" width="3" height="2" fill="#facc15" />
            <rect x="25" y="52" width="4" height="3" rx="1" fill="#1e293b" />
            <rect x="35" y="52" width="4" height="3" rx="1" fill="#1e293b" />
          </g>
        )}

        {/* 8. KAROO (ONE PIECE) */}
        {species === 'karoo' && (
          <g id="species-karoo">
            <ellipse cx="32" cy="18" rx="14" ry="7" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 18 18 C 18 10, 46 10, 46 18 Z" fill="#1e3a8a" />
            <rect x="21" y="14" width="9" height="6" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="34" y="14" width="9" height="6" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.2" />
            <line x1="30" y1="17" x2="34" y2="17" stroke="#0f172a" strokeWidth="2" />
            <ellipse cx="32" cy="27" rx="14" ry="11" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="22" y1="25" x2="28" y2="25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <line x1="36" y1="25" x2="42" y2="25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="25" cy="24" r="3.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <circle cx="26" cy="24" r="1.8" fill="#0f172a" />
                <circle cx="25.5" cy="23.2" r="0.6" fill="#ffffff" />
                <circle cx="39" cy="24" r="3.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <circle cx="38" cy="24" r="1.8" fill="#0f172a" />
                <circle cx="37.5" cy="23.2" r="0.6" fill="#ffffff" />
              </>
            )}
            <path d="M 23 29 Q 32 27 41 29 Q 32 38 23 29 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1.2" />
            <line x1="26" y1="30" x2="38" y2="30" stroke="#c2410c" strokeWidth="0.8" />
            <rect x="22" y="37" width="20" height="5" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
            <line x1="27" y1="37" x2="27" y2="42" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="37" y1="37" x2="37" y2="42" stroke="#ffffff" strokeWidth="2.5" />
            <polygon points="40,40 48,43 42,46" fill="#2563eb" />
            <ellipse cx="32" cy="46" rx="13" ry="9" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <ellipse cx="18" cy="44" rx="3.5" ry="5" fill="#eab308" transform="rotate(-15 18 44)" />
            <ellipse cx="46" cy="44" rx="3.5" ry="5" fill="#eab308" transform="rotate(15 46 44)" />
            <polygon points="25,54 20,58 30,58" fill="#f97316" />
            <polygon points="39,54 34,58 44,58" fill="#f97316" />
          </g>
        )}

        {/* 9. BEPO (ONE PIECE) */}
        {species === 'bepo' && (
          <g id="species-bepo">
            <circle cx="19" cy="18" r="4.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="19" cy="18" r="2.2" fill="#fbcfe8" />
            <circle cx="45" cy="18" r="4.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="45" cy="18" r="2.2" fill="#fbcfe8" />
            <ellipse cx="32" cy="27" rx="16" ry="12" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
            <ellipse cx="32" cy="32" rx="6" ry="4.5" fill="#f1f5f9" />
            <ellipse cx="32" cy="30.5" rx="2.5" ry="1.6" fill="#0f172a" />
            <path d="M 32 32.1 L 32 34 M 30 34.5 Q 32 36 34 34.5" stroke="#0f172a" strokeWidth="1" fill="none" strokeLinecap="round" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 23 27 Q 26 30 29 27" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 35 27 Q 38 30 41 27" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="26" cy="26" r="2" fill="#0f172a" />
                <circle cx="25.5" cy="25.3" r="0.7" fill="#ffffff" />
                <circle cx="38" cy="26" r="2" fill="#0f172a" />
                <circle cx="37.5" cy="25.3" r="0.7" fill="#ffffff" />
              </>
            )}
            <ellipse cx="20" cy="31" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="44" cy="31" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <path d="M 21 38 L 43 38 L 44 54 L 20 54 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="1.2" />
            <path d="M 28 38 L 32 43 L 36 38" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="32" y1="43" x2="32" y2="54" stroke="#c2410c" strokeWidth="1.2" />
            <circle cx="26" cy="45" r="2.5" fill="#facc15" stroke="#1e1b4b" strokeWidth="0.6" />
            <circle cx="25" cy="44.5" r="0.4" fill="#1e1b4b" />
            <circle cx="27" cy="44.5" r="0.4" fill="#1e1b4b" />
            <path d="M 24.5 45.8 Q 26 47 27.5 45.8" fill="none" stroke="#1e1b4b" strokeWidth="0.5" />
            <circle cx="17" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="47" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="26" cy="55" rx="3.5" ry="2" fill="#78350f" />
            <ellipse cx="38" cy="55" rx="3.5" ry="2" fill="#78350f" />
          </g>
        )}

        {/* 10. DORAEMON */}
        {species === 'doraemon' && (
          <g id="species-doraemon">
            <circle cx="32" cy="24" r="16" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
            <ellipse cx="32" cy="27" rx="13" ry="11" fill="#ffffff" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 25 18 Q 28 21 31 18" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 33 18 Q 36 21 39 18" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="28" cy="18" rx="3.8" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="29" cy="18" rx="1.5" ry="2.2" fill="#0f172a" />
                <circle cx="28.5" cy="17" r="0.6" fill="#ffffff" />
                <ellipse cx="36" cy="18" rx="3.8" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="35" cy="18" rx="1.5" ry="2.2" fill="#0f172a" />
                <circle cx="34.5" cy="17" r="0.6" fill="#ffffff" />
              </>
            )}
            <circle cx="32" cy="23" r="2.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
            <circle cx="31" cy="22" r="0.9" fill="#ffffff" />
            <line x1="32" y1="25.8" x2="32" y2="33" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 23 29 Q 32 39 41 29" fill="#dc2626" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 28 34 Q 32 32 36 34" fill="#fda4af" />
            <line x1="17" y1="25" x2="25" y2="26" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="16" y1="28" x2="25" y2="28" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="17" y1="31" x2="25" y2="30" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="39" y1="26" x2="47" y2="25" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="39" y1="28" x2="48" y2="28" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="39" y1="30" x2="47" y2="31" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <rect x="22" y="38" width="20" height="3" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="32" cy="41" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <line x1="30" y1="41" x2="34" y2="41" stroke="#854d0e" strokeWidth="0.8" />
            <circle cx="32" cy="42.5" r="0.6" fill="#854d0e" />
            <path d="M 23 41 L 41 41 L 42 53 L 22 53 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
            <circle cx="32" cy="46" r="6" fill="#ffffff" />
            <path d="M 28 46 L 36 46 A 4 4 0 0 1 28 46" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
            <circle cx="19" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="45" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="27" cy="55" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="37" cy="55" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
        )}

        {/* 11. DORAMI */}
        {species === 'dorami' && (
          <g id="species-dorami">
            <ellipse cx="24" cy="9" rx="6.5" ry="4.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" transform="rotate(-15 24 9)" />
            <ellipse cx="40" cy="9" rx="6.5" ry="4.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" transform="rotate(15 40 9)" />
            <circle cx="32" cy="10" r="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.2" />
            <circle cx="32" cy="24" r="16" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <ellipse cx="32" cy="27" rx="13" ry="11" fill="#ffffff" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 25 18 Q 28 21 31 18" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 33 18 Q 36 21 39 18" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="28" cy="18" rx="3.8" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="29" cy="18" rx="1.8" ry="2.5" fill="#0284c7" />
                <ellipse cx="29" cy="18" rx="1" ry="1.5" fill="#0f172a" />
                <circle cx="28.5" cy="17" r="0.8" fill="#ffffff" />
                <path d="M 24 14 L 26 15" stroke="#0f172a" strokeWidth="1" />
                <ellipse cx="36" cy="18" rx="3.8" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="35" cy="18" rx="1.8" ry="2.5" fill="#0284c7" />
                <ellipse cx="35" cy="18" rx="1" ry="1.5" fill="#0f172a" />
                <circle cx="34.5" cy="17" r="0.8" fill="#ffffff" />
                <path d="M 40 14 L 38 15" stroke="#0f172a" strokeWidth="1" />
              </>
            )}
            <circle cx="32" cy="23" r="2.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
            <line x1="32" y1="25.8" x2="32" y2="33" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 24 29 Q 32 38 40 29" fill="#dc2626" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 28 33 Q 32 31 36 33" fill="#fda4af" />
            <circle cx="20" cy="31" r="2.5" fill="#fbcfe8" />
            <circle cx="44" cy="31" r="2.5" fill="#fbcfe8" />
            <line x1="18" y1="26" x2="25" y2="26.5" stroke="#0f172a" strokeWidth="0.8" />
            <line x1="18" y1="29" x2="25" y2="28.5" stroke="#0f172a" strokeWidth="0.8" />
            <line x1="39" y1="26.5" x2="46" y2="26" stroke="#0f172a" strokeWidth="0.8" />
            <line x1="39" y1="28.5" x2="46" y2="29" stroke="#0f172a" strokeWidth="0.8" />
            <rect x="22" y="38" width="20" height="3" rx="1.5" fill="#0284c7" />
            <circle cx="32" cy="41" r="2.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <path d="M 23 41 L 41 41 L 42 53 L 22 53 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <circle cx="32" cy="46" r="5.5" fill="#ffffff" />
            <path d="M 28 46 L 36 46 A 4 4 0 0 1 28 46" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="44" cy="48" r="2.2" fill="#ef4444" />
            <circle cx="44" cy="48" r="0.8" fill="#ffffff" />
            <circle cx="19" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="45" cy="44" r="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="27" cy="55" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <ellipse cx="37" cy="55" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          </g>
        )}

        {/* 12. KIRBY */}
        {species === 'kirby' && (
          <g id="species-kirby">
            <ellipse cx="24" cy="48" rx="6" ry="4" fill="#ef4444" stroke="#dc2626" strokeWidth="1.2" transform="rotate(-15 24 48)" />
            <ellipse cx="40" cy="48" rx="6" ry="4" fill="#ef4444" stroke="#dc2626" strokeWidth="1.2" transform="rotate(15 40 48)" />
            <circle cx="32" cy="34" r="16" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" />
            <ellipse cx="16" cy="34" rx="4" ry="3" fill="#f472b6" stroke="#db2777" strokeWidth="1.2" transform="rotate(-25 16 34)" />
            <ellipse cx="48" cy="34" rx="4" ry="3" fill="#f472b6" stroke="#db2777" strokeWidth="1.2" transform="rotate(25 48 34)" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 24 30 Q 27 34 30 30" fill="none" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
                <path d="M 34 30 Q 37 34 40 30" fill="none" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="27" cy="30" rx="3" ry="5.5" fill="#1e1b4b" />
                <ellipse cx="27" cy="32.5" rx="2.5" ry="2.5" fill="#0284c7" />
                <ellipse cx="27" cy="27.5" rx="1.8" ry="2.2" fill="#ffffff" />
                <ellipse cx="37" cy="30" rx="3" ry="5.5" fill="#1e1b4b" />
                <ellipse cx="37" cy="32.5" rx="2.5" ry="2.5" fill="#0284c7" />
                <ellipse cx="37" cy="27.5" rx="1.8" ry="2.2" fill="#ffffff" />
              </>
            )}
            <ellipse cx="20" cy="35" rx="3" ry="1.8" fill="#f43f5e" transform="rotate(-10 20 35)" />
            <ellipse cx="44" cy="35" rx="3" ry="1.8" fill="#f43f5e" transform="rotate(10 44 35)" />
            <path d="M 30 35 Q 32 40 34 35 Z" fill="#be123c" />
            <path d="M 30.5 37 Q 32 36 33.5 37" fill="#fda4af" />
          </g>
        )}

        {/* 13. CAT (ANIME GINGER KITTEN) */}
        {species === 'cat' && (
          <g id="species-cat">
            <path d="M 42 46 C 52 44, 55 32, 50 25" fill="none" stroke="#fb923c" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 52 30 C 53 27, 51 25, 50 25" fill="none" stroke="#fff7ed" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" />
            <ellipse cx="32" cy="44" rx="6.5" ry="6" fill="#fff7ed" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />
            <polygon points="18,19 12,8 24,15" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="17,17 14,10 22,15" fill="#fbcfe8" />
            <polygon points="46,19 52,8 40,15" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="47,17 50,10 42,15" fill="#fbcfe8" />
            <ellipse cx="32" cy="27" rx="16" ry="13" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" />
            <path d="M 32 17 L 32 21 M 28 18 L 29 22 M 36 18 L 35 22" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="32" cy="32.5" rx="9" ry="6" fill="#fff7ed" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 27 Q 24 30 27 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 37 27 Q 40 31 43 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="26" rx="3.5" ry="4.5" fill="#059669" stroke="#047857" strokeWidth="0.8" />
                <ellipse cx="24" cy="26" rx="2" ry="3.5" fill="#0f172a" />
                <circle cx="23" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="25" cy="28" r="0.7" fill="#ffffff" />
                <ellipse cx="40" cy="26" rx="3.5" ry="4.5" fill="#059669" stroke="#047857" strokeWidth="0.8" />
                <ellipse cx="40" cy="26" rx="2" ry="3.5" fill="#0f172a" />
                <circle cx="39" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="41" cy="28" r="0.7" fill="#ffffff" />
              </>
            )}
            <path d="M 31 30.5 L 33 30.5 L 32 32 Z" fill="#f43f5e" />
            <path d="M 29.5 33 Q 31 35 32 33 Q 33 35 34.5 33" fill="none" stroke="#431407" strokeWidth="1" strokeLinecap="round" />
            <ellipse cx="18" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="46" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <line x1="12" y1="30" x2="20" y2="31" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="13" y1="33" x2="20" y2="33" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="44" y1="31" x2="52" y2="30" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="44" y1="33" x2="51" y2="33" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />
          </g>
        )}

        {/* 14. DOG (SHIBA INU) */}
        {species === 'dog' && (
          <g id="species-dog">
            <path d="M 40 45 C 48 42, 50 34, 46 32 C 43 30, 42 34, 45 36" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.4" />
            <ellipse cx="32" cy="44" rx="6.5" ry="6" fill="#fef3c7" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
            <polygon points="18,18 12,8 24,14" fill="#d97706" stroke="#b45309" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="17,17 14,10 22,14" fill="#fef3c7" />
            <polygon points="46,18 52,8 40,14" fill="#d97706" stroke="#b45309" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="47,17 50,10 42,14" fill="#fef3c7" />
            <ellipse cx="32" cy="27" rx="16" ry="13" fill="#f59e0b" stroke="#b45309" strokeWidth="1.4" />
            <path d="M 20 28 C 17 38, 47 38, 44 28 C 41 36, 23 36, 20 28 Z" fill="#fef3c7" />
            <circle cx="25" cy="21" r="1.5" fill="#fef3c7" />
            <circle cx="39" cy="21" r="1.5" fill="#fef3c7" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 26 Q 25 29 28 26" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 36 26 Q 39 29 42 26" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="26" rx="2.5" ry="3.5" fill="#1e1b4b" />
                <circle cx="24.2" cy="25" r="1.2" fill="#ffffff" />
                <ellipse cx="39" cy="26" rx="2.5" ry="3.5" fill="#1e1b4b" />
                <circle cx="38.2" cy="25" r="1.2" fill="#ffffff" />
              </>
            )}
            <ellipse cx="32" cy="29.5" rx="2" ry="1.5" fill="#1e1b4b" />
            <path d="M 30.5 32 Q 32 35.5 33.5 32 Z" fill="#f43f5e" stroke="#1e1b4b" strokeWidth="0.8" />
            <ellipse cx="19" cy="32" rx="2" ry="1.2" fill="#fda4af" />
            <ellipse cx="45" cy="32" rx="2" ry="1.2" fill="#fda4af" />
          </g>
        )}

        {/* 15. FOX (KITSUNE) */}
        {species === 'fox' && (
          <g id="species-fox">
            <path d="M 42 46 C 54 44, 60 32, 54 24 C 50 20, 44 26, 45 34" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" />
            <path d="M 54 24 C 52 21, 48 22, 47 25 C 49 27, 52 26, 54 24 Z" fill="#ffffff" />
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" />
            <ellipse cx="32" cy="44" rx="6.5" ry="6" fill="#ffffff" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#1e293b" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#1e293b" />
            <polygon points="19,19 11,5 25,14" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="15,10 11,5 18,9" fill="#1e293b" />
            <polygon points="18,17 14,10 22,15" fill="#ffffff" />
            <polygon points="45,19 53,5 39,14" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="49,10 53,5 46,9" fill="#1e293b" />
            <polygon points="46,17 50,10 42,15" fill="#ffffff" />
            <ellipse cx="32" cy="27" rx="15" ry="12" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" />
            <polygon points="18,27 26,34 24,25" fill="#ffffff" />
            <polygon points="46,27 38,34 40,25" fill="#ffffff" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 26 Q 25 28 28 25" fill="none" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 36 25 Q 39 28 42 26" fill="none" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="25" rx="2.5" ry="3.5" fill="#d97706" transform="rotate(-10 25 25)" />
                <ellipse cx="25" cy="25" rx="1.5" ry="2.8" fill="#1e1b4b" />
                <circle cx="24.2" cy="24" r="1" fill="#ffffff" />
                <ellipse cx="39" cy="25" rx="2.5" ry="3.5" fill="#d97706" transform="rotate(10 39 25)" />
                <ellipse cx="39" cy="25" rx="1.5" ry="2.8" fill="#1e1b4b" />
                <circle cx="38.2" cy="24" r="1" fill="#ffffff" />
              </>
            )}
            <circle cx="32" cy="30" r="1.5" fill="#0f172a" />
            <path d="M 30.5 32 Q 32 33.5 33.5 32" fill="none" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* 16. PANDA */}
        {species === 'panda' && (
          <g id="species-panda">
            <circle cx="18" cy="16" r="4.5" fill="#0f172a" />
            <circle cx="46" cy="16" r="4.5" fill="#0f172a" />
            <ellipse cx="32" cy="26" rx="16" ry="13" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
            <ellipse cx="24" cy="26" rx="4.5" ry="3.5" fill="#0f172a" transform="rotate(-15 24 26)" />
            <ellipse cx="40" cy="26" rx="4.5" ry="3.5" fill="#0f172a" transform="rotate(15 40 26)" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="22" y1="26" x2="26" y2="26" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="38" y1="26" x2="42" y2="26" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="24.5" cy="25.5" r="1.8" fill="#ffffff" />
                <circle cx="25" cy="25.8" r="0.8" fill="#0f172a" />
                <circle cx="39.5" cy="25.5" r="1.8" fill="#ffffff" />
                <circle cx="39" cy="25.8" r="0.8" fill="#0f172a" />
              </>
            )}
            <ellipse cx="32" cy="29.5" rx="1.8" ry="1.2" fill="#0f172a" />
            <path d="M 30.5 32 Q 32 33.5 33.5 32" fill="none" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
            <path d="M 22 38 L 42 38 L 44 44 L 20 44 Z" fill="#0f172a" />
            <circle cx="18" cy="43" r="3.2" fill="#0f172a" />
            <circle cx="46" cy="43" r="3.2" fill="#0f172a" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#0f172a" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#0f172a" />
          </g>
        )}

        {/* 17. BUNNY */}
        {species === 'bunny' && (
          <g id="species-bunny">
            <rect x="20" y="5" width="6.5" height="17" rx="3.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <rect x="21.8" y="8" width="3" height="11" rx="1.5" fill="#fbcfe8" />
            <rect x="37.5" y="5" width="6.5" height="17" rx="3.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <rect x="39.2" y="8" width="3" height="11" rx="1.5" fill="#fbcfe8" />
            <circle cx="32" cy="28" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 23 28 Q 26 31 29 28" fill="none" stroke="#db2777" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 35 28 Q 38 31 41 28" fill="none" stroke="#db2777" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="27" rx="3" ry="4" fill="#db2777" />
                <circle cx="24" cy="25.5" r="1.3" fill="#ffffff" />
                <circle cx="26" cy="29" r="0.7" fill="#ffffff" />
                <ellipse cx="39" cy="27" rx="3" ry="4" fill="#db2777" />
                <circle cx="38" cy="25.5" r="1.3" fill="#ffffff" />
                <circle cx="40" cy="29" r="0.7" fill="#ffffff" />
              </>
            )}
            <polygon points="31,31 33,31 32,32.5" fill="#f43f5e" />
            <path d="M 30.5 33 Q 32 34.5 33.5 33" fill="none" stroke="#db2777" strokeWidth="1" strokeLinecap="round" />
            <ellipse cx="18" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" />
            <ellipse cx="46" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" />
            <ellipse cx="32" cy="45" rx="11" ry="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="43" cy="45" r="3.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#fbcfe8" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#fbcfe8" />
          </g>
        )}

        {/* 18. OWL (MEOWLISH EMERALD MASCOT) */}
        {species === 'owl' && (
          <g id="species-owl">
            <polygon points="19,18 15,9 26,16" fill="#047857" stroke="#064e3b" strokeWidth="1" />
            <polygon points="45,18 49,9 38,16" fill="#047857" stroke="#064e3b" strokeWidth="1" />
            <ellipse cx="32" cy="30" rx="16" ry="15" fill="#059669" stroke="#047857" strokeWidth="1.4" />
            <path d="M 23 28 C 23 44, 41 44, 41 28 Z" fill="#d1fae5" />
            <path d="M 28 34 Q 32 37 36 34 M 27 39 Q 32 42 37 39" fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 16 26 C 14 36, 17 44, 20 46" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 48 26 C 50 36, 47 44, 44 46" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 18 24 Q 24 29 30 24" fill="none" stroke="#064e3b" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 34 24 Q 40 29 46 24" fill="none" stroke="#064e3b" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="24" cy="24" r="6.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="24" cy="24" r="3.8" fill="#0f172a" />
                <circle cx="23" cy="22.5" r="1.3" fill="#ffffff" />
                <circle cx="40" cy="24" r="6.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="40" cy="24" r="3.8" fill="#0f172a" />
                <circle cx="39" cy="22.5" r="1.3" fill="#ffffff" />
              </>
            )}
            <polygon points="30,27 34,27 32,32" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
            <ellipse cx="27" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
            <ellipse cx="37" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
          </g>
        )}

        {/* 19. KURAMA (NARUTO) */}
        {species === 'kurama' && (
          <g id="species-kurama">
            <path d="M 26 40 C 14 36, 6 26, 10 18 C 14 26, 22 34, 26 40 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <path d="M 28 40 C 18 32, 12 18, 18 12 C 22 22, 26 32, 28 40 Z" fill="#f97316" stroke="#9a3412" strokeWidth="1" />
            <path d="M 30 40 C 24 28, 22 12, 28 8 C 30 20, 31 30, 30 40 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <path d="M 34 40 C 40 28, 42 12, 36 8 C 34 20, 33 30, 34 40 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <path d="M 36 40 C 46 32, 52 18, 46 12 C 42 22, 38 32, 36 40 Z" fill="#f97316" stroke="#9a3412" strokeWidth="1" />
            <path d="M 38 40 C 50 36, 58 26, 54 18 C 50 26, 42 34, 38 40 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <polygon points="18,19 10,4 25,14" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="16,14 13,8 20,13" fill="#1e1b4b" />
            <polygon points="46,19 54,4 39,14" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="48,14 51,8 44,13" fill="#1e1b4b" />
            <ellipse cx="32" cy="27" rx="15" ry="12" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" />
            <path d="M 17 22 L 23 25 L 20 28 Z" fill="#0f172a" />
            <path d="M 47 22 L 41 25 L 44 28 Z" fill="#0f172a" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="22" y1="26" x2="27" y2="26" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <line x1="37" y1="26" x2="42" y2="26" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="25" rx="2.5" ry="3.5" fill="#dc2626" />
                <line x1="25" y1="22" x2="25" y2="28" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="24.2" cy="23.5" r="0.8" fill="#ffffff" />
                <ellipse cx="39" cy="25" rx="2.5" ry="3.5" fill="#dc2626" />
                <line x1="39" y1="22" x2="39" y2="28" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="38.2" cy="23.5" r="0.8" fill="#ffffff" />
              </>
            )}
            <circle cx="32" cy="29" r="1.5" fill="#0f172a" />
            <path d="M 28 32 Q 32 35 36 32" fill="#451a03" stroke="#0f172a" strokeWidth="1" />
            <polygon points="29,32 30,33.5 31,32" fill="#ffffff" />
            <polygon points="33,32 34,33.5 35,32" fill="#ffffff" />
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
          </g>
        )}

        {/* 20. PAKKUN (NARUTO) */}
        {species === 'pakkun' && (
          <g id="species-pakkun">
            <path d="M 18 18 C 14 18, 12 26, 16 30 C 18 28, 20 22, 20 18 Z" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <path d="M 46 18 C 50 18, 52 26, 48 30 C 46 28, 44 22, 44 18 Z" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <ellipse cx="32" cy="27" rx="15" ry="12" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
            <rect x="22" y="14" width="20" height="6" rx="2" fill="#1e3a8a" stroke="#0f172a" strokeWidth="0.8" />
            <rect x="25" y="15" width="14" height="4" rx="1" fill="#cbd5e1" />
            <circle cx="32" cy="17" r="1.2" fill="#0f172a" />
            <path d="M 27 22 Q 32 20 37 22" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
            <path d="M 28 24 Q 32 22 36 24" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="22" y1="27" x2="27" y2="27" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="37" y1="27" x2="42" y2="27" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="25" cy="27" r="3.2" fill="#1e1b4b" />
                <circle cx="24.2" cy="26" r="1.2" fill="#ffffff" />
                <circle cx="39" cy="27" r="3.2" fill="#1e1b4b" />
                <circle cx="38.2" cy="26" r="1.2" fill="#ffffff" />
              </>
            )}
            <ellipse cx="32" cy="32" rx="7" ry="5" fill="#451a03" />
            <ellipse cx="32" cy="30" rx="2.5" ry="1.6" fill="#0f172a" />
            <path d="M 30.5 33 Q 32 35.5 33.5 33" fill="#f43f5e" stroke="#1e1b4b" strokeWidth="0.6" />
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
            <polygon points="26,38 32,43 38,38" fill="#1e3a8a" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#78350f" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#78350f" />
          </g>
        )}

        {/* 21. GAMAKICHI (NARUTO) */}
        {species === 'gamakichi' && (
          <g id="species-gamakichi">
            <circle cx="24" cy="18" r="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <line x1="19" y1="18" x2="29" y2="18" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy="18" r="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <line x1="35" y1="18" x2="45" y2="18" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="32" cy="27" rx="17" ry="12" fill="#ea580c" stroke="#9a3412" strokeWidth="1.4" />
            <path d="M 30 19 L 32 17 L 34 19" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            <path d="M 20 29 Q 32 35 44 29" fill="none" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" />
            <path d="M 21 38 L 43 38 L 45 52 L 19 52 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.2" />
            <polygon points="26,38 32,46 38,38" fill="#ea580c" />
            <ellipse cx="18" cy="50" rx="5" ry="3.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <ellipse cx="46" cy="50" rx="5" ry="3.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <ellipse cx="25" cy="54" rx="4" ry="2" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
            <ellipse cx="39" cy="54" rx="4" ry="2" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
          </g>
        )}

        {/* 22. HEDWIG (HARRY POTTER) */}
        {species === 'hedwig' && (
          <g id="species-hedwig">
            <polygon points="19,17 16,8 26,15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <polygon points="45,17 48,8 38,15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="32" cy="30" rx="16" ry="15" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.4" />
            {/* Snowy flecks */}
            <path d="M 26 34 L 28 36 M 36 34 L 38 36 M 30 40 L 32 42" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
            {/* Wings */}
            <path d="M 16 26 C 14 36, 17 44, 20 46" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 48 26 C 50 36, 47 44, 44 46" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 18 24 Q 24 29 30 24" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 34 24 Q 40 29 46 24" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="24" cy="24" r="6.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="24" cy="24" r="3.8" fill="#0f172a" />
                <circle cx="23" cy="22.5" r="1.3" fill="#ffffff" />
                <circle cx="40" cy="24" r="6.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="40" cy="24" r="3.8" fill="#0f172a" />
                <circle cx="39" cy="22.5" r="1.3" fill="#ffffff" />
              </>
            )}
            <polygon points="30,27 34,27 32,32" fill="#0f172a" />
            <ellipse cx="27" cy="46" rx="2.5" ry="1.5" fill="#64748b" />
            <ellipse cx="37" cy="46" rx="2.5" ry="1.5" fill="#64748b" />
          </g>
        )}

        {/* 23. CROOKSHANKS (HARRY POTTER) */}
        {species === 'crookshanks' && (
          <g id="species-crookshanks">
            <path d="M 42 45 C 52 43, 56 30, 50 22" fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
            <path d="M 22 38 C 21 53, 43 53, 42 38 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1.4" />
            <polygon points="18,19 12,8 24,15" fill="#f97316" stroke="#c2410c" strokeWidth="1.4" />
            <polygon points="46,19 52,8 40,15" fill="#f97316" stroke="#c2410c" strokeWidth="1.4" />
            <ellipse cx="32" cy="27" rx="17" ry="13" fill="#f97316" stroke="#c2410c" strokeWidth="1.4" />
            {/* Grumpy flat muzzle */}
            <ellipse cx="32" cy="32" rx="8" ry="5" fill="#ea580c" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="21" y1="26" x2="27" y2="26" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
                <line x1="37" y1="26" x2="43" y2="26" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="26" rx="3.5" ry="4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <circle cx="24" cy="26" r="2.2" fill="#0f172a" />
                <circle cx="23.2" cy="24.8" r="0.8" fill="#ffffff" />
                <ellipse cx="40" cy="26" rx="3.5" ry="4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <circle cx="40" cy="26" r="2.2" fill="#0f172a" />
                <circle cx="39.2" cy="24.8" r="0.8" fill="#ffffff" />
              </>
            )}
            <polygon points="31,30.5 33,30.5 32,32" fill="#451a03" />
            <path d="M 30 33 Q 32 32 34 33" fill="none" stroke="#451a03" strokeWidth="1" strokeLinecap="round" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#ea580c" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#ea580c" />
          </g>
        )}

        {/* 24. FAWKES (HARRY POTTER PHOENIX) */}
        {species === 'fawkes' && (
          <g id="species-fawkes">
            {/* Golden Crest */}
            <path d="M 32 15 Q 35 6 42 4 M 32 17 Q 37 9 44 8" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
            {/* Shimmering Long Tail */}
            <path d="M 32 46 Q 30 56 26 62 M 32 46 Q 34 56 38 62" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 32 46 Q 32 58 32 63" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="32" cy="30" rx="15" ry="14" fill="#dc2626" stroke="#991b1b" strokeWidth="1.4" />
            <path d="M 23 28 C 23 44, 41 44, 41 28 Z" fill="#f59e0b" />
            <path d="M 17 26 C 14 36, 17 44, 20 46" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
            <path d="M 47 26 C 50 36, 47 44, 44 46" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 20 25 Q 24 28 28 25" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <path d="M 36 25 Q 40 28 44 25" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="24" cy="24" r="5" fill="#facc15" />
                <circle cx="24" cy="24" r="2.8" fill="#0f172a" />
                <circle cx="23.2" cy="23" r="1" fill="#ffffff" />
                <circle cx="40" cy="24" r="5" fill="#facc15" />
                <circle cx="40" cy="24" r="2.8" fill="#0f172a" />
                <circle cx="39.2" cy="23" r="1" fill="#ffffff" />
              </>
            )}
            <polygon points="30,27 34,27 32,33" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <ellipse cx="27" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
            <ellipse cx="37" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
          </g>
        )}

        {/* 25. GOOSE (MARVEL FLERKEN CAT) */}
        {species === 'goose' && (
          <g id="species-goose">
            <path d="M 42 46 C 52 44, 55 32, 50 25" fill="none" stroke="#fb923c" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" />
            <rect x="22" y="38" width="20" height="3" rx="1.5" fill="#1e3a8a" />
            <circle cx="32" cy="40.5" r="1.5" fill="#cbd5e1" />
            <polygon points="18,19 12,8 24,15" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" />
            <polygon points="46,19 52,8 40,15" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" />
            <ellipse cx="32" cy="27" rx="16" ry="13" fill="#fb923c" stroke="#c2410c" strokeWidth="1.4" />
            <ellipse cx="32" cy="32.5" rx="8" ry="5.5" fill="#fff7ed" />
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 27 Q 24 30 27 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 37 27 Q 40 31 43 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="26" rx="3.2" ry="4" fill="#f59e0b" />
                <circle cx="24" cy="26" r="2.2" fill="#0f172a" />
                <circle cx="23" cy="24.5" r="1" fill="#ffffff" />
                <ellipse cx="40" cy="26" rx="3.2" ry="4" fill="#f59e0b" />
                <circle cx="40" cy="26" r="2.2" fill="#0f172a" />
                <circle cx="39" cy="24.5" r="1" fill="#ffffff" />
              </>
            )}
            <polygon points="31,30.5 33,30.5 32,32" fill="#f43f5e" />
            <ellipse cx="26" cy="54" rx="3.5" ry="2" fill="#fff7ed" />
            <ellipse cx="38" cy="54" rx="3.5" ry="2" fill="#fff7ed" />
          </g>
        )}

        {/* 26. ROCKET (MARVEL RACCOON) */}
        {species === 'rocket' && (
          <g id="species-rocket">
            <path d="M 42 46 C 52 44, 56 34, 52 26" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            <polygon points="18,18 11,7 24,14" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
            <polygon points="46,18 53,7 40,14" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
            <ellipse cx="32" cy="27" rx="16" ry="13" fill="#64748b" stroke="#334155" strokeWidth="1.4" />
            {/* Bandit Eye Mask */}
            <path d="M 17 25 Q 32 28 47 25 L 45 30 Q 32 33 19 30 Z" fill="#0f172a" />
            {/* White eyebrow/whiskers tufts */}
            <path d="M 21 22 Q 25 21 27 23 M 43 22 Q 39 21 37 23" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="22" y1="27" x2="27" y2="27" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="37" y1="27" x2="42" y2="27" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="25" cy="27" r="2.5" fill="#f59e0b" />
                <circle cx="25" cy="27" r="1.5" fill="#0f172a" />
                <circle cx="24.2" cy="26" r="0.8" fill="#ffffff" />
                <circle cx="39" cy="27" r="2.5" fill="#f59e0b" />
                <circle cx="39" cy="27" r="1.5" fill="#0f172a" />
                <circle cx="38.2" cy="26" r="0.8" fill="#ffffff" />
              </>
            )}
            <ellipse cx="32" cy="32" rx="5" ry="3.5" fill="#ffffff" />
            <ellipse cx="32" cy="30.5" rx="1.8" ry="1.2" fill="#0f172a" />
            {/* Orange Flight Jumpsuit */}
            <path d="M 22 38 L 42 38 L 44 54 L 20 54 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="1.2" />
            <rect x="25" y="42" width="14" height="4" fill="#334155" />
            <ellipse cx="26" cy="55" rx="3.5" ry="2" fill="#0f172a" />
            <ellipse cx="38" cy="55" rx="3.5" ry="2" fill="#0f172a" />
          </g>
        )}

        {/* 27. ALLIGATOR LOKI (MARVEL LOKI) */}
        {species === 'alligator_loki' && (
          <g id="species-alligator-loki">
            {/* Golden Horned Helmet */}
            <path d="M 25 18 C 20 12, 12 6, 10 2 C 14 4, 24 12, 28 17 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <path d="M 39 18 C 44 12, 52 6, 54 2 C 50 4, 40 12, 36 17 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <rect x="23" y="17" width="18" height="4" rx="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            {/* Green Alligator Head */}
            <ellipse cx="32" cy="28" rx="17" ry="11" fill="#15803d" stroke="#166534" strokeWidth="1.4" />
            {/* Snout with nostrils */}
            <path d="M 24 33 Q 32 37 40 33" fill="none" stroke="#166534" strokeWidth="1.5" />
            <circle cx="28" cy="33" r="0.8" fill="#14532d" />
            <circle cx="36" cy="33" r="0.8" fill="#14532d" />
            {/* Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <line x1="23" y1="25" x2="28" y2="25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <line x1="36" y1="25" x2="41" y2="25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="26" cy="24" r="3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <line x1="26" y1="21" x2="26" y2="27" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="38" cy="24" r="3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <line x1="38" y1="21" x2="38" y2="27" stroke="#0f172a" strokeWidth="1.5" />
              </>
            )}
            {/* Green body & tail */}
            <path d="M 23 38 C 22 53, 42 53, 41 38 Z" fill="#15803d" stroke="#166534" strokeWidth="1.4" />
            <path d="M 41 46 Q 52 48 54 42" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="24" cy="54" rx="4" ry="2" fill="#166534" />
            <ellipse cx="40" cy="54" rx="4" ry="2" fill="#166534" />
          </g>
        )}
      </svg>
    </div>
  );
}
`;

fs.writeFileSync(targetFile, fullCode, 'utf8');
console.log('Successfully wrote pristine, authentic 27-species PixelPetSprite.tsx!');

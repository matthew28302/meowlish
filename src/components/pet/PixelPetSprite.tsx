'use client';

import React, { useId } from 'react';
import { getOutfitFit, getOutfitTransform, getHatFit, getHatTransform, getGlassesFit, getGlassesTransform } from './petFit';

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

function PixelPetSprite({
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
  const outfitFit = getOutfitFit(species);
  const outfitTransform = getOutfitTransform(outfitFit);
  const outfitClipId = `outfit-clip-${useId().replace(/:/g, '')}`;
  const hatFit = getHatFit(species);
  const hatTransform = getHatTransform(hatFit);
  const glassesFit = getGlassesFit(species);
  const glassesTransform = getGlassesTransform(glassesFit);

  // Species-specific 3D movement & life animation classes
  const getAnimClass = () => {
    if (effectiveState === 'idle') {
      if (['cinnamoroll', 'hedwig', 'fawkes'].includes(species)) return 'animate-pet-float-idle';
      if (species === 'kirby') return 'animate-pet-bounce-idle';
      if (['fox', 'kurama', 'dog', 'cat', 'crookshanks', 'goose', 'pakkun'].includes(species)) return 'animate-pet-tail-idle';
      return 'animate-pixel-idle';
    }

    if (effectiveState === 'walk' || effectiveState === 'run') {
      const isRun = effectiveState === 'run';
      // Group 1: Bipedal Waddlers (Doraemon, Dorami, Hello Kitty, Kuromi, My Melody)
      if (['doraemon', 'dorami', 'hello_kitty', 'kuromi', 'my_melody'].includes(species)) {
        return isRun ? 'animate-pet-waddle-run' : 'animate-pet-waddle-walk';
      }
      // Group 2: Cloud Flying / Wing Flappers (Cinnamoroll, Hedwig, Fawkes)
      if (['cinnamoroll', 'hedwig', 'fawkes'].includes(species)) {
        return isRun ? 'animate-pet-float-run' : 'animate-pet-float-walk';
      }
      // Group 3: Elastic Bouncing Ball (Kirby)
      if (species === 'kirby') {
        return isRun ? 'animate-pet-bounce-run' : 'animate-pet-bounce-walk';
      }
      // Group 4: Agile Quadruped Trot / Gallop (Fox, Kurama, Dog, Cat, Pakkun, Rocket, Goose, Crookshanks)
      if (['fox', 'kurama', 'dog', 'cat', 'pakkun', 'rocket', 'goose', 'crookshanks'].includes(species)) {
        return isRun ? 'animate-pet-trot-run' : 'animate-pet-trot-walk';
      }
      // Group 5: Springy Hopping (Bunny, Gamakichi, Karoo)
      if (['bunny', 'gamakichi', 'karoo'].includes(species)) {
        return isRun ? 'animate-pet-hop-run' : 'animate-pet-hop-walk';
      }
      // Group 6: Heavy Plump Roll (Pompompurin, Panda, Bepo, Chopper)
      if (['pompompurin', 'panda', 'bepo', 'chopper'].includes(species)) {
        return isRun ? 'animate-pet-pudgy-run' : 'animate-pet-pudgy-walk';
      }
      // Group 7: Low Reptilian Crawl (Alligator Loki)
      if (species === 'alligator_loki') {
        return isRun ? 'animate-pet-crawl-run' : 'animate-pet-crawl-walk';
      }
      // Group 8: Owl Mascot Flutter (Owl)
      if (species === 'owl') {
        return isRun ? 'animate-pet-flutter-run' : 'animate-pet-flutter-walk';
      }
      return isRun ? 'animate-pixel-run' : 'animate-pixel-walk';
    }

    switch (effectiveState) {
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
      default:
        return 'animate-pixel-idle';
    }
  };

  return (
    <div
      className={`relative inline-block select-none pointer-events-none ${className}`}
      style={{
        transform: `scaleX(${isLeft ? -1 : 1})`,
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* SVG Canvas for 2D/3D Vector Art Character (64x64 grid) */}
      <svg
        viewBox="0 0 64 64"
        width={64 * scale}
        height={64 * scale}
        className={`overflow-visible ${getAnimClass()}`}
      >
        <defs>
          {/* Volumetric 3D Shading Gradients */}
          <linearGradient id="doraemonBlue3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#00a0ea" />
            <stop offset="100%" stopColor="#0277bd" />
          </linearGradient>
          <linearGradient id="doramiYellow3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fff59d" />
            <stop offset="40%" stopColor="#ffd600" />
            <stop offset="100%" stopColor="#f57f17" />
          </linearGradient>
          <linearGradient id="cinnaCloud3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fcfefe" />
            <stop offset="85%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
          <radialGradient id="cinnaEyeShine" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </radialGradient>
          <radialGradient id="bellGold3D" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>
          <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <radialGradient id="kirbyPink3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="40%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </radialGradient>
          <linearGradient id="purinCustard3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="melodyPink3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="35%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          <linearGradient id="kittyWhite3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="keroppiGreen3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="40%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="shibaGold3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="foxOrange3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <radialGradient id="pandaWhite3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </radialGradient>
          <radialGradient id="bunnyCream3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#fdf2f8" />
            <stop offset="100%" stopColor="#fce7f3" />
          </radialGradient>
          <linearGradient id="owlEmerald3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="chopperHat3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="45%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#9d174d" />
          </linearGradient>
          <linearGradient id="kuromiDark3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="45%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="karooYellow3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <radialGradient id="bepoWhite3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </radialGradient>
          <linearGradient id="kuramaOrange3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="35%" stopColor="#f97316" />
            <stop offset="75%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <linearGradient id="pakkunTan3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="40%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="gamakichiOrange3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <radialGradient id="hedwigWhite3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </radialGradient>
          <linearGradient id="crookshanksOrange3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="40%" stopColor="#fb923c" />
            <stop offset="80%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="fawkesRed3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="75%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="fawkesGold3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <radialGradient id="rocketGrey3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>
          <linearGradient id="lokiGreen3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="80%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="lokiGold3D" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
          {/* Clip path for swimming (hides lower body below waterline y=41) */}
          <clipPath id="swimWaterClip">
            <rect x="-30" y="-30" width="124" height="71" />
          </clipPath>
        </defs>

        {/* Lớp 0: Ground Shadow hoặc Gợn Sóng Nước khi Bơi */}
        {effectiveState === 'swim' ? (
          <g className="pixel-swim-waves-bg">
            {/* Underwater body tint */}
            <ellipse cx="32" cy="46" rx="14" ry="5.5" fill="rgba(2, 132, 199, 0.25)" />
            {/* Back water ripples */}
            <ellipse cx="32" cy="41" rx="26" ry="7" fill="rgba(56, 189, 248, 0.45)" stroke="#38bdf8" strokeWidth="1.2" />
            <ellipse cx="32" cy="42" rx="20" ry="5" fill="none" stroke="#e0f2fe" strokeWidth="0.8" strokeDasharray="4 2" />
          </g>
        ) : (
          <ellipse cx="32" cy="58" rx="18" ry="4.5" fill="rgba(0, 0, 0, 0.18)" />
        )}

        {/* Lớp 1, 2, 3: Thân pet & trang phục (Cắt nửa thân dưới khi bơi) */}
        <g clipPath={effectiveState === 'swim' ? 'url(#swimWaterClip)' : undefined}>

                {/* Lớp 1: Cánh & Phụ Kiện Lưng (Back Accessory) */}
        {equippedAccessory === 'angel_wings' && (
          <g className="pixel-wings-layer">
            <path d="M 18 30 C 6 28, 2 16, 10 10 C 14 7, 20 12, 19 18 Z" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.2" />
            <path d="M 14 22 C 8 20, 6 14, 10 10" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
            <path d="M 46 30 C 58 28, 62 16, 54 10 C 50 7, 44 12, 45 18 Z" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.2" />
            <path d="M 50 22 C 56 20, 58 14, 54 10" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
          </g>
        )}

        {equippedAccessory === 'demon_wings' && (
          <g className="pixel-demon-wings-layer">
            <path d="M 20 28 L 2 16 L 8 12 L 14 18 L 12 30 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 2 16 L 8 8 L 12 14" fill="#4338ca" />
            <path d="M 44 28 L 62 16 L 56 12 L 50 18 L 52 30 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 62 16 L 56 8 L 52 14" fill="#4338ca" />
          </g>
        )}

        {equippedAccessory === 'flame_ninja_scarf' && (
          <g className="pixel-ninja-scarf-back">
            {/* Trailing fiery scarf flutter in the wind */}
            <path d="M 21 38 Q 12 35 6 42 Q 10 44 13 50 Q 17 44 22 41 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
          </g>
        )}

        {/* ========================================================================= */}
        {/* LỚP 2: THÂN THÚ CƯNG (27 LOÀI CHUẨN ANIME & POP CULTURE CHÍNH XÁC 100%) */}
        {/* ========================================================================= */}

        {/* 1. HELLO KITTY (SANRIO) */}
        {species === 'hello_kitty' && (
          <g id="species-hello-kitty">
            {/* Rounded White Ears */}
            <path d="M 15 18 C 12 11, 16 6, 22 9 C 25 11, 26 14, 25 18 Z" fill="url(#kittyWhite3D)" stroke="#334155" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M 39 18 C 40 14, 41 11, 44 9 C 50 6, 54 11, 51 18 Z" fill="url(#kittyWhite3D)" stroke="#334155" strokeWidth="1.3" strokeLinejoin="round" />
            
            {/* Pearlescent White Body Base */}
            <path d="M 22 36 C 18 42, 18 52, 24 54 C 28 54.5, 36 54.5, 40 54 C 46 52, 46 42, 42 36 Z" fill="url(#kittyWhite3D)" stroke="#334155" strokeWidth="1.2" />
            
            {/* Red Shirt Sleeves */}
            <path d="M 20 37 L 25 37 L 23 44 L 18 43 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="0.8" />
            <path d="M 44 37 L 39 37 L 41 44 L 46 43 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="0.8" />

            {/* Blue Denim Dungarees / Overalls */}
            <path d="M 23 41 C 23 39, 41 39, 41 41 L 43 53 C 43 54, 21 54, 21 53 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.1" />
            {/* Straps with Yellow Buttons */}
            <line x1="25" y1="37" x2="25" y2="43" stroke="#1d4ed8" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="25" cy="43.5" r="1.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
            <line x1="39" y1="37" x2="39" y2="43" stroke="#1d4ed8" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="39" cy="43.5" r="1.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
            {/* Pocket Detail */}
            <path d="M 28 46 L 36 46 C 36 49, 28 49, 28 46 Z" fill="#1d4ed8" opacity="0.4" />

            {/* White Paws & Feet */}
            <ellipse cx="18" cy="43" rx="3.2" ry="2.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="46" cy="43" rx="3.2" ry="2.8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="26" cy="54.5" rx="4" ry="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="38" cy="54.5" rx="4" ry="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* Iconic Wide Hello Kitty Head */}
            <ellipse cx="32" cy="25" rx="18.5" ry="13" fill="url(#kittyWhite3D)" stroke="#334155" strokeWidth="1.3" />

            {/* Signature Red Ribbon Bow at Left Ear with 3D Gloss */}
            <g id="kitty-bow">
              {/* Left loop */}
              <path d="M 43 14 C 39 9, 33 11, 35 16 C 36 18, 42 16, 43 14 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <line x1="36" y1="14" x2="41" y2="14" stroke="#991b1b" strokeWidth="0.8" />
              {/* Right loop */}
              <path d="M 43 14 C 47 9, 53 11, 51 16 C 50 18, 44 16, 43 14 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
              <line x1="49" y1="14" x2="45" y2="14" stroke="#991b1b" strokeWidth="0.8" />
              {/* Center knot */}
              <circle cx="43" cy="14" r="3.2" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
              <circle cx="42" cy="13" r="0.9" fill="#fca5a5" />
            </g>

            {/* Face: Eyes with Sparkling Highlights */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 20 26 Q 23 29 26 26" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 38 26 Q 41 29 44 26" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="23" cy="26" rx="2" ry="2.8" fill="#111827" />
                <circle cx="22.3" cy="25" r="0.8" fill="#ffffff" />
                <ellipse cx="41" cy="26" rx="2" ry="2.8" fill="#111827" />
                <circle cx="40.3" cy="25" r="0.8" fill="#ffffff" />
              </>
            )}

            {/* Pastel Pink Cheek Blush */}
            <ellipse cx="17.5" cy="28.5" rx="2.8" ry="1.6" fill="#fda4af" opacity="0.8" />
            <ellipse cx="46.5" cy="28.5" rx="2.8" ry="1.6" fill="#fda4af" opacity="0.8" />

            {/* Yellow Oval Nose */}
            <ellipse cx="32" cy="28.5" rx="2.5" ry="1.7" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="31.3" cy="28" r="0.6" fill="#ffffff" />

            {/* 3 Iconic Whiskers on Each Cheek */}
            <line x1="10" y1="24.5" x2="18" y2="25.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9" y1="28" x2="18" y2="28" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="10" y1="31.5" x2="18" y2="30.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />

            <line x1="46" y1="25.5" x2="54" y2="24.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="46" y1="28" x2="55" y2="28" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="46" y1="30.5" x2="54" y2="31.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* 2. KUROMI (SANRIO) */}
        {species === 'kuromi' && (
          <g id="species-kuromi">
            {/* Jester Horns with Pink Baubles */}
            <path d="M 21 21 C 18 12, 10 7, 7 3 C 14 6, 23 12, 26 19 Z" fill="url(#kuromiDark3D)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="7" cy="3" r="3" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
            <circle cx="6.2" cy="2.2" r="0.8" fill="#ffffff" />
            <path d="M 43 21 C 46 12, 54 7, 57 3 C 50 6, 41 12, 38 19 Z" fill="url(#kuromiDark3D)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="57" cy="3" r="3" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
            <circle cx="56.2" cy="2.2" r="0.8" fill="#ffffff" />

            {/* Devil Tail Ending in Pink Spade */}
            <path d="M 39 49 Q 49 51 47 43" fill="none" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
            <polygon points="47,43 43,40 50,40" fill="#f43f5e" stroke="#be123c" strokeWidth="0.6" />

            {/* Chubby Black Body */}
            <path d="M 23 42 C 20 46, 21 53, 27 54 C 29 54.5, 35 54.5, 37 54 C 43 53, 44 46, 41 42 Z" fill="url(#kuromiDark3D)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="21" cy="44" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <circle cx="43" cy="44" r="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
            <ellipse cx="27" cy="54.5" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="37" cy="54.5" rx="3.5" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* Jester Neck Collar with Pink Balls */}
            <path d="M 21 40 L 24 45 L 29 42 L 32 46 L 35 42 L 40 45 L 43 40 Z" fill="#312e81" stroke="#0f172a" strokeWidth="1.1" />
            <circle cx="24" cy="45" r="1.6" fill="#f43f5e" />
            <circle cx="32" cy="46" r="1.6" fill="#f43f5e" />
            <circle cx="40" cy="45" r="1.6" fill="#f43f5e" />

            {/* Black Jester Hood Contour */}
            <path d="M 17 31 C 16 18, 48 18, 47 31 C 47 37, 43 41, 32 41 C 21 41, 17 37, 17 31 Z" fill="url(#kuromiDark3D)" stroke="#0f172a" strokeWidth="1.2" />
            {/* White Face Cutout */}
            <ellipse cx="32" cy="31" rx="12.5" ry="9" fill="#ffffff" />

            {/* Kuromi Pink Skull Emblem */}
            <g id="kuromi-skull">
              <ellipse cx="32" cy="18" rx="3.8" ry="3.2" fill="#f43f5e" />
              <circle cx="28.5" cy="17" r="1.1" fill="#f43f5e" />
              <circle cx="35.5" cy="17" r="1.1" fill="#f43f5e" />
              <circle cx="30.5" cy="18" r="0.9" fill="#1e1b4b" />
              <circle cx="33.5" cy="18" r="0.9" fill="#1e1b4b" />
              <rect x="30.5" y="20.5" width="3" height="1.2" rx="0.5" fill="#f43f5e" />
            </g>

            {/* Eyes & Eyelashes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 31 Q 25 34 28 30" fill="none" stroke="#581c87" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 42 31 Q 39 34 36 30" fill="none" stroke="#581c87" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="30" rx="2.8" ry="3.8" fill="#581c87" transform="rotate(8 25 30)" />
                <circle cx="24.2" cy="28.5" r="1.2" fill="#ffffff" />
                <circle cx="26" cy="32" r="0.6" fill="#ffffff" />
                <path d="M 21.5 26 L 19 24 M 27.5 27 L 29 26" stroke="#0f172a" strokeWidth="1.3" strokeLinecap="round" />

                <ellipse cx="39" cy="30" rx="2.8" ry="3.8" fill="#581c87" transform="rotate(-8 39 30)" />
                <circle cx="38.2" cy="28.5" r="1.2" fill="#ffffff" />
                <circle cx="40" cy="32" r="0.6" fill="#ffffff" />
                <path d="M 42.5 26 L 45 24 M 36.5 27 L 35 26" stroke="#0f172a" strokeWidth="1.3" strokeLinecap="round" />
              </>
            )}

            {/* Pink Nose & Mischievous Smirk */}
            <circle cx="32" cy="32.5" r="0.9" fill="#f43f5e" />
            <path d="M 29.5 34 Q 32 36 34.5 34" fill="none" stroke="#1e1b4b" strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="20" cy="33.5" rx="2.2" ry="1.3" fill="#fda4af" />
            <ellipse cx="44" cy="33.5" rx="2.2" ry="1.3" fill="#fda4af" />
          </g>
        )}

        {/* 3. CINNAMOROLL (SANRIO - ULTRA-CUTE PETITE 3D CLOUD PUPPY) */}
        {species === 'cinnamoroll' && (
          <g id="species-cinnamoroll">
            {/* Cinnamon Roll Spiral Tail on Left with 3D Depth */}
            <path
              d="M 23 41.5 C 16 38, 13 46, 18 49 C 22.5 50.5, 25 48, 24 45 C 23.2 42.5, 17.5 43, 17.5 46 C 17.5 47.5, 19.5 48.2, 20.5 47"
              fill="url(#cinnaCloud3D)"
              stroke="#93c5fd"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Tail inner swirl highlight */}
            <path
              d="M 17 44.5 C 17 41.5, 22 41, 22.5 44"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.9"
              strokeLinecap="round"
            />

            {/* Petite Chubby Cloud Body (Lower height for maximum cuteness) */}
            <path
              d="M 23 34 C 18 38, 18 46, 24 49 C 27 50.5, 37 50.5, 40 49 C 46 46, 46 38, 41 34 Z"
              fill="url(#cinnaCloud3D)"
              stroke="#93c5fd"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Tiny Chubby Cloud Feet at Bottom */}
            <ellipse cx="26.5" cy="49.5" rx="3.5" ry="2" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
            <circle cx="25.5" cy="49" r="0.6" fill="#e0f2fe" />
            <ellipse cx="37.5" cy="49.5" rx="3.5" ry="2" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
            <circle cx="36.5" cy="49" r="0.6" fill="#e0f2fe" />

            {/* Soft Chubby Cloud Paws (Gently pressed together at chest) */}
            <ellipse cx="28" cy="38" rx="2.5" ry="3.2" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" transform="rotate(18 28 38)" />
            <ellipse cx="36" cy="38" rx="2.5" ry="3.2" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" transform="rotate(-18 36 38)" />
            <circle cx="27.5" cy="37" r="0.5" fill="#e0f2fe" />
            <circle cx="36.5" cy="37" r="0.5" fill="#e0f2fe" />

            {/* Animated Wing-like Flying Puppy Ears (Flap rhythmically when moving) */}
            {/* Left Ear */}
            <g className={effectiveState === 'walk' || effectiveState === 'run' ? 'animate-cinna-ear-l' : ''}>
              <path
                d="M 18 22 C 9 17, 0 21, 1 28 C 2 33, 10 33, 16 27 Z"
                fill="url(#cinnaCloud3D)"
                stroke="#93c5fd"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Soft inner ear curve gloss */}
              <path
                d="M 14 23 C 8 20, 3 23, 4 28"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>

            {/* Right Ear */}
            <g className={effectiveState === 'walk' || effectiveState === 'run' ? 'animate-cinna-ear-r' : ''}>
              <path
                d="M 46 22 C 55 17, 64 21, 63 28 C 62 33, 54 33, 48 27 Z"
                fill="url(#cinnaCloud3D)"
                stroke="#93c5fd"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Soft inner ear curve gloss */}
              <path
                d="M 50 23 C 56 20, 61 23, 60 28"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>

            {/* Soft Marshmallow Head (Petite, wide and adorably squishy) */}
            <ellipse cx="32" cy="26" rx="17" ry="11.5" fill="url(#cinnaCloud3D)" stroke="#93c5fd" strokeWidth="1.2" />

            {/* Forehead Soft Cloud Sheen */}
            <path
              d="M 23 18.5 Q 32 16 41 18.5 Q 32 17.5 23 18.5 Z"
              fill="#ffffff"
              opacity="0.8"
            />

            {/* Face: Eyes (Glowing Deep Sky-Blue with Sparkling Manga Catchlights) */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21.5 25.5 Q 24.5 28.5 27.5 25.5" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 36.5 25.5 Q 39.5 28.5 42.5 25.5" fill="none" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Left Eye */}
                <ellipse cx="24.5" cy="25.5" rx="2.5" ry="3.5" fill="url(#cinnaEyeShine)" />
                <ellipse cx="24.5" cy="25" rx="1.8" ry="2.6" fill="#0284c7" />
                <circle cx="23.7" cy="24" r="1.1" fill="#ffffff" />
                <circle cx="25.4" cy="27" r="0.6" fill="#ffffff" />
                <circle cx="23.8" cy="26.7" r="0.4" fill="#e0f2fe" />

                {/* Right Eye */}
                <ellipse cx="39.5" cy="25.5" rx="2.5" ry="3.5" fill="url(#cinnaEyeShine)" />
                <ellipse cx="39.5" cy="25" rx="1.8" ry="2.6" fill="#0284c7" />
                <circle cx="38.7" cy="24" r="1.1" fill="#ffffff" />
                <circle cx="40.4" cy="27" r="0.6" fill="#ffffff" />
                <circle cx="38.8" cy="26.7" r="0.4" fill="#e0f2fe" />
              </>
            )}

            {/* Soft Rosy Pastel Pink Cheek Blush with Dreamy Highlights */}
            <ellipse cx="17.5" cy="28.5" rx="3.4" ry="1.9" fill="#fbcfe8" opacity="0.95" />
            <circle cx="16.8" cy="27.8" r="0.6" fill="#ffffff" opacity="0.9" />
            <ellipse cx="46.5" cy="28.5" rx="3.4" ry="1.9" fill="#fbcfe8" opacity="0.95" />
            <circle cx="47.2" cy="27.8" r="0.6" fill="#ffffff" opacity="0.9" />

            {/* Signature :3 Puppy-Mouth with Tiny Pink Tongue */}
            <path
              d="M 29.8 27.8 Q 30.9 29.5 32 28.3 Q 33.1 29.5 34.2 27.8"
              fill="none"
              stroke="#78350f"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <ellipse cx="32" cy="29.2" rx="1.3" ry="0.9" fill="#f43f5e" opacity="0.9" />
          </g>
        )}

        {/* 4. MY MELODY (SANRIO) */}
        {species === 'my_melody' && (
          <g id="species-my-melody">
            {/* Bunny Hood Ears (Left upright, Right cutely folded at tip) */}
            <path d="M 19 22 C 16 11, 18 3, 23 3 C 28 3, 29 11, 26 22 Z" fill="url(#melodyPink3D)" stroke="#db2777" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 37 22 C 35 12, 38 6, 44 6 C 47 6, 49 9, 46 12 C 43 15, 41 18, 46 22 Z" fill="url(#melodyPink3D)" stroke="#db2777" strokeWidth="1.2" strokeLinejoin="round" />

            {/* Pink Hood Head */}
            <ellipse cx="32" cy="27" rx="17" ry="13" fill="url(#melodyPink3D)" stroke="#db2777" strokeWidth="1.2" />

            {/* Iconic 5-Petal Daisy Flower at Right Ear */}
            <g id="melody-flower">
              <circle cx="39" cy="15" r="2.3" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.6" />
              <circle cx="43.5" cy="13" r="2.3" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.6" />
              <circle cx="46.5" cy="16.5" r="2.3" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.6" />
              <circle cx="44" cy="20.5" r="2.3" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.6" />
              <circle cx="39.5" cy="19.5" r="2.3" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.6" />
              <circle cx="42.5" cy="16.8" r="2.1" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
            </g>

            {/* White Face Cutout */}
            <ellipse cx="32" cy="29" rx="12" ry="9" fill="#ffffff" />

            {/* Eyes with Sparkling Highlights */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 24 29 Q 26 32 28 29" fill="none" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 36 29 Q 38 32 40 29" fill="none" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="26" cy="28.5" rx="2" ry="2.8" fill="#1e1b4b" />
                <circle cx="25.2" cy="27.5" r="0.8" fill="#ffffff" />
                <circle cx="26.8" cy="29.8" r="0.4" fill="#ffffff" />

                <ellipse cx="38" cy="28.5" rx="2" ry="2.8" fill="#1e1b4b" />
                <circle cx="37.2" cy="27.5" r="0.8" fill="#ffffff" />
                <circle cx="38.8" cy="29.8" r="0.4" fill="#ffffff" />
              </>
            )}

            {/* Yellow Button Nose & Mouth */}
            <ellipse cx="32" cy="31" rx="2" ry="1.4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
            <path d="M 30 33.5 Q 32 35 34 33.5" fill="none" stroke="#1e1b4b" strokeWidth="1.1" strokeLinecap="round" />
            <ellipse cx="21" cy="31" rx="2.8" ry="1.6" fill="#fda4af" opacity="0.85" />
            <ellipse cx="43" cy="31" rx="2.8" ry="1.6" fill="#fda4af" opacity="0.85" />

            {/* Chubby Pink Cape Body with White Collar Button */}
            <path d="M 23 38 C 20 42, 20 52, 26 53.5 C 29 54, 35 54, 38 53.5 C 44 52, 44 42, 41 38 Z" fill="url(#melodyPink3D)" stroke="#db2777" strokeWidth="1.2" />
            <circle cx="32" cy="39.5" r="2" fill="#ffffff" stroke="#db2777" strokeWidth="0.8" />
            <circle cx="21" cy="42" r="2.8" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.8" />
            <circle cx="43" cy="42" r="2.8" fill="#ffffff" stroke="#fbcfe8" strokeWidth="0.8" />
            <ellipse cx="27" cy="54.5" rx="3.5" ry="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="37" cy="54.5" rx="3.5" ry="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          </g>
        )}

        {/* 5. POMPOMPURIN (SANRIO) */}
        {species === 'pompompurin' && (
          <g id="species-pompompurin">
            {/* Floppy Golden Retriever Ears */}
            <path d="M 18 19 C 12 19, 11 30, 15 33 C 18 35, 20 31, 20 22 Z" fill="#d97706" stroke="#b45309" strokeWidth="1.1" />
            <path d="M 46 19 C 52 19, 53 30, 49 33 C 46 35, 44 31, 44 22 Z" fill="#d97706" stroke="#b45309" strokeWidth="1.1" />

            {/* Pear-shaped Golden Custard Body */}
            <path d="M 21 34 C 17 40, 16 52, 23 54 C 27 55, 37 55, 41 54 C 48 52, 47 40, 43 34 Z" fill="url(#purinCustard3D)" stroke="#ca8a04" strokeWidth="1.2" />
            {/* Arms Resting on Tummy */}
            <ellipse cx="21" cy="40" rx="3.5" ry="4.5" fill="url(#purinCustard3D)" stroke="#ca8a04" strokeWidth="0.9" transform="rotate(20 21 40)" />
            <ellipse cx="43" cy="40" rx="3.5" ry="4.5" fill="url(#purinCustard3D)" stroke="#ca8a04" strokeWidth="0.9" transform="rotate(-20 43 40)" />
            {/* Feet */}
            <ellipse cx="26" cy="54.5" rx="4" ry="2.2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            <ellipse cx="38" cy="54.5" rx="4" ry="2.2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            {/* Little Caramel Tail on Right */}
            <path d="M 46 45 C 50 44, 52 48, 48 50 Z" fill="#d97706" />

            {/* Round Chubby Head */}
            <ellipse cx="32" cy="25" rx="16" ry="12" fill="url(#purinCustard3D)" stroke="#ca8a04" strokeWidth="1.2" />

            {/* Brown Beret Hat on Top with Stem */}
            <g id="purin-beret">
              <ellipse cx="32" cy="13" rx="8" ry="3.2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
              <rect x="31.2" y="9.5" width="1.6" height="3.5" fill="#78350f" rx="0.8" />
            </g>

            {/* Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <line x1="23" y1="24.5" x2="27" y2="24.5" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="37" y1="24.5" x2="41" y2="24.5" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="25" cy="24.5" r="2.2" fill="#78350f" />
                <circle cx="24.3" cy="23.8" r="0.7" fill="#ffffff" />
                <circle cx="39" cy="24.5" r="2.2" fill="#78350f" />
                <circle cx="38.3" cy="23.8" r="0.7" fill="#ffffff" />
              </>
            )}

            {/* Brown Nose & Iconic :3 Omega Mouth with Pink Tongue */}
            <ellipse cx="32" cy="26.8" rx="2.2" ry="1.5" fill="#78350f" />
            <path d="M 28 29.5 Q 30 31.8 32 29.8 Q 34 31.8 36 29.5" fill="none" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 30.5 30.5 Q 32 32.5 33.5 30.5 Z" fill="#fda4af" />
            <ellipse cx="19.5" cy="28" rx="2.8" ry="1.6" fill="#fed7aa" opacity="0.9" />
            <ellipse cx="44.5" cy="28" rx="2.8" ry="1.6" fill="#fed7aa" opacity="0.9" />
          </g>
        )}

        {/* 6. KEROPPI (SANRIO) */}
        {species === 'keroppi' && (
          <g id="species-keroppi">
            {/* Big Expressive Frog Eyes Touching in Middle */}
            <circle cx="24" cy="15" r="8" fill="#ffffff" stroke="#16a34a" strokeWidth="1.3" />
            <circle cx="40" cy="15" r="8" fill="#ffffff" stroke="#16a34a" strokeWidth="1.3" />
            {effectiveState === 'sleep' ? (
              <>
                <line x1="18" y1="15" x2="30" y2="15" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="34" y1="15" x2="46" y2="15" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="25.5" cy="15" r="3.2" fill="#111827" />
                <circle cx="24.5" cy="13.8" r="1.1" fill="#ffffff" />
                <circle cx="38.5" cy="15" r="3.2" fill="#111827" />
                <circle cx="37.5" cy="13.8" r="1.1" fill="#ffffff" />
              </>
            )}

            {/* Seamless Rounded Lime-Green Head */}
            <path d="M 16 23 C 14 28, 14 36, 21 38 C 26 39.5, 38 39.5, 43 38 C 50 36, 50 28, 48 23 Z" fill="url(#keroppiGreen3D)" stroke="#16a34a" strokeWidth="1.3" />

            {/* Joyful Pink Cheek Circles & V-Smile */}
            <circle cx="18" cy="29" r="4.2" fill="#fda4af" />
            <circle cx="46" cy="29" r="4.2" fill="#fda4af" />
            <path d="M 28 29 L 32 33 L 36 29" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Red and White Vertically Striped Shirt Body */}
            <path d="M 22 38 C 19 44, 19 51, 23 53 C 27 54, 37 54, 41 53 C 45 51, 45 44, 42 38 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1.2" />
            <rect x="26.5" y="38" width="3.5" height="15" fill="#ffffff" />
            <rect x="34" y="38" width="3.5" height="15" fill="#ffffff" />
            {/* White Bow Tie Collar */}
            <polygon points="26,38 32,41 38,38 32,39" fill="#ffffff" stroke="#dc2626" strokeWidth="0.6" />

            {/* Webbed Hands and Frog Feet */}
            <circle cx="18" cy="42" r="3.2" fill="url(#keroppiGreen3D)" stroke="#16a34a" strokeWidth="0.9" />
            <circle cx="46" cy="42" r="3.2" fill="url(#keroppiGreen3D)" stroke="#16a34a" strokeWidth="0.9" />
            <ellipse cx="25" cy="54.5" rx="4.5" ry="2.2" fill="#22c55e" stroke="#15803d" strokeWidth="1.1" />
            <ellipse cx="39" cy="54.5" rx="4.5" ry="2.2" fill="#22c55e" stroke="#15803d" strokeWidth="1.1" />
          </g>
        )}

        {/* 7. TONY TONY CHOPPER (ONE PIECE) */}
        {species === 'chopper' && (
          <g id="species-chopper">
            {/* 3D Branched Reindeer Antlers */}
            <path d="M 21 16 Q 16 11 11 5 C 10 3 13 3 14 5 Q 16 9 20 12 L 18 8 C 17 6 20 6 21 8 L 22 13 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
            <path d="M 43 16 Q 48 11 53 5 C 54 3 51 3 50 5 Q 48 9 44 12 L 46 8 C 47 6 44 6 43 8 L 42 13 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />

            {/* Reindeer Ears under Hat */}
            <path d="M 16 20 C 11 20 9 25 15 26 Z" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
            <path d="M 15 21 C 12 21 11 24 15 25 Z" fill="#fbcfe8" />
            <path d="M 48 20 C 53 20 55 25 49 26 Z" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
            <path d="M 49 21 C 52 21 53 24 49 25 Z" fill="#fbcfe8" />

            {/* Torso & Maroon Shorts with Gold Buckle */}
            <path d="M 23 37 C 21 42, 21 51, 26 52 C 28 52.5, 36 52.5, 38 52 C 43 51, 43 42, 41 37 Z" fill="#831843" stroke="#4c0519" strokeWidth="1.1" />
            <rect x="30.5" y="42" width="3" height="2" rx="0.5" fill="#facc15" />

            {/* Hoof Arms */}
            <ellipse cx="19" cy="40" rx="3" ry="4" fill="#d97706" stroke="#92400e" strokeWidth="0.8" transform="rotate(20 19 40)" />
            <rect x="16.5" y="41" width="3.5" height="2.5" rx="0.5" fill="#1e293b" />
            <ellipse cx="45" cy="40" rx="3" ry="4" fill="#d97706" stroke="#92400e" strokeWidth="0.8" transform="rotate(-20 45 40)" />
            <rect x="44" y="41" width="3.5" height="2.5" rx="0.5" fill="#1e293b" />

            {/* Hoof Feet */}
            <rect x="25" y="52" width="4.5" height="3" rx="1" fill="#1e293b" />
            <rect x="34.5" y="52" width="4.5" height="3" rx="1" fill="#1e293b" />

            {/* Brown Reindeer Head */}
            <ellipse cx="32" cy="29" rx="14" ry="11" fill="#d97706" stroke="#92400e" strokeWidth="1.2" />

            {/* Pink Hat with White Medical X Cross */}
            <path d="M 20 20 C 19 8, 45 8, 44 20 Z" fill="url(#chopperHat3D)" stroke="#db2777" strokeWidth="1.2" />
            <rect x="30" y="10" width="4" height="8" rx="0.6" fill="#ffffff" />
            <rect x="28" y="12" width="8" height="4" rx="0.6" fill="#ffffff" />
            {/* Padded Magenta Brim */}
            <ellipse cx="32" cy="20" rx="18" ry="4.8" fill="#be185d" stroke="#9d174d" strokeWidth="1.1" />

            {/* Cream Fur Muzzle */}
            <ellipse cx="32" cy="32.5" rx="8" ry="5.5" fill="#fef3c7" />

            {/* Chopper's Signature Shiny Blue Nose */}
            <circle cx="32" cy="30" r="3" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
            <circle cx="31" cy="29" r="0.9" fill="#e0f2fe" />
            <path d="M 29.5 34.5 Q 32 37 34.5 34.5" fill="none" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />

            {/* Big Sparkling Manga Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 28 Q 24 31 27 28" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 37 28 Q 40 31 43 28" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="26" rx="3.2" ry="3.8" fill="#1e1b4b" />
                <circle cx="24" cy="24.8" r="1.3" fill="#ffffff" />
                <circle cx="26" cy="28" r="0.7" fill="#ffffff" />
                <ellipse cx="39" cy="26" rx="3.2" ry="3.8" fill="#1e1b4b" />
                <circle cx="38" cy="24.8" r="1.3" fill="#ffffff" />
                <circle cx="40" cy="28" r="0.7" fill="#ffffff" />
              </>
            )}

            {/* Rosy Cheeks */}
            <circle cx="19" cy="30" r="2.8" fill="#fda4af" opacity="0.9" />
            <circle cx="45" cy="30" r="2.8" fill="#fda4af" opacity="0.9" />
          </g>
        )}

        {/* 8. KAROO (ONE PIECE - SUPER SPOT-BILLED DUCK) */}
        {species === 'karoo' && (
          <g id="species-karoo">
            {/* Round Fluffy Duck Body */}
            <path
              d="M 21 35 C 16 41, 16 52, 23 54 C 27 55, 37 55, 41 54 C 48 52, 48 41, 43 35 Z"
              fill="url(#karooYellow3D)"
              stroke="#ca8a04"
              strokeWidth="1.2"
            />

            {/* Vivi's Blue Traveler Saddle & Canteen Strap with Gold Buckle */}
            <rect x="22" y="38" width="20" height="5.5" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
            <line x1="27" y1="38" x2="27" y2="43.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="37" y1="38" x2="37" y2="43.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="40.7" r="1.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />

            {/* Cute Flapping Duck Wings with Layered Feathers */}
            <path
              d="M 17 40 C 13 41, 12 47, 17 50 C 20 48, 20 43, 17 40 Z"
              fill="url(#karooYellow3D)"
              stroke="#ca8a04"
              strokeWidth="1"
            />
            <path
              d="M 47 40 C 51 41, 52 47, 47 50 C 44 48, 44 43, 47 40 Z"
              fill="url(#karooYellow3D)"
              stroke="#ca8a04"
              strokeWidth="1"
            />

            {/* Orange Webbed Duck Feet */}
            <ellipse cx="25" cy="54.5" rx="4.5" ry="2.2" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
            <ellipse cx="39" cy="54.5" rx="4.5" ry="2.2" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />

            {/* Soft Yellow Duck Head */}
            <ellipse cx="32" cy="26" rx="15" ry="12.5" fill="url(#karooYellow3D)" stroke="#ca8a04" strokeWidth="1.2" />

            {/* Karoo's Iconic Aviator Helmet & Dual Goggles */}
            <path d="M 18 19 C 18 10, 46 10, 46 19 C 46 22, 18 22, 18 19 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="20.5" y="13" width="9.5" height="7" rx="2.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.1" />
            <rect x="34" y="13" width="9.5" height="7" rx="2.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.1" />
            <line x1="22.5" y1="15" x2="27.5" y2="15" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="36" y1="15" x2="41" y2="15" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="30" y1="16.5" x2="34" y2="16.5" stroke="#0f172a" strokeWidth="2" />

            {/* Big Goofy & Loving Duck Anime Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 26 Q 25 29 29 26" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <path d="M 35 26 Q 39 29 43 26" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="25" rx="3.8" ry="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <ellipse cx="25.5" cy="25" rx="2.4" ry="3.2" fill="#0f172a" />
                <circle cx="24.8" cy="23.5" r="1.1" fill="#ffffff" />
                <circle cx="26.5" cy="26.8" r="0.6" fill="#ffffff" />

                <ellipse cx="39" cy="25" rx="3.8" ry="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <ellipse cx="38.5" cy="25" rx="2.4" ry="3.2" fill="#0f172a" />
                <circle cx="37.8" cy="23.5" r="1.1" fill="#ffffff" />
                <circle cx="39.5" cy="26.8" r="0.6" fill="#ffffff" />
              </>
            )}

            {/* Soft Rosy Cheeks */}
            <ellipse cx="17.5" cy="29" rx="2.6" ry="1.5" fill="#fda4af" opacity="0.85" />
            <ellipse cx="46.5" cy="29" rx="2.6" ry="1.5" fill="#fda4af" opacity="0.85" />

            {/* Friendly Orange Duck Bill with Smile & Nostrils */}
            <path d="M 22 28 Q 32 25 42 28 Q 32 37 22 28 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1.2" />
            <line x1="25" y1="29.8" x2="39" y2="29.8" stroke="#ea580c" strokeWidth="0.9" />
            <circle cx="30" cy="28.2" r="0.6" fill="#9a3412" />
            <circle cx="34" cy="28.2" r="0.6" fill="#9a3412" />
          </g>
        )}

        {/* 9. BEPO (ONE PIECE - HEART PIRATES KAWAI POLAR BEAR) */}
        {species === 'bepo' && (
          <g id="species-bepo">
            {/* Chubby White Polar Bear Body with Orange Jumpsuit */}
            <path
              d="M 20 36 C 16 42, 16 52, 23 54 C 27 55, 37 55, 41 54 C 48 52, 48 42, 44 36 Z"
              fill="#ea580c"
              stroke="#c2410c"
              strokeWidth="1.2"
            />
            {/* White Neck Collar / Under-suit & Front Zipper */}
            <polygon points="27,36 32,42 37,36" fill="url(#bepoWhite3D)" stroke="#cbd5e1" strokeWidth="0.8" />
            <line x1="32" y1="42" x2="32" y2="54" stroke="#c2410c" strokeWidth="1.2" />

            {/* Law's Heart Pirates Yellow Smiley Jolly Roger Badge on Chest */}
            <circle cx="26" cy="45.5" r="2.8" fill="#facc15" stroke="#1e1b4b" strokeWidth="0.7" />
            <circle cx="25" cy="45" r="0.5" fill="#1e1b4b" />
            <circle cx="27" cy="45" r="0.5" fill="#1e1b4b" />
            <path d="M 24.6 46.4 Q 26 47.6 27.4 46.4" fill="none" stroke="#1e1b4b" strokeWidth="0.6" strokeLinecap="round" />

            {/* White Bear Paws & Brown Martial Arts Boots */}
            <circle cx="17" cy="43" r="3.4" fill="url(#bepoWhite3D)" stroke="#cbd5e1" strokeWidth="0.9" />
            <circle cx="47" cy="43" r="3.4" fill="url(#bepoWhite3D)" stroke="#cbd5e1" strokeWidth="0.9" />
            <ellipse cx="26" cy="54.5" rx="3.8" ry="2.2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
            <ellipse cx="38" cy="54.5" rx="3.8" ry="2.2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />

            {/* Fluffy Round Polar Bear Ears */}
            <circle cx="18" cy="17" r="4.8" fill="url(#bepoWhite3D)" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="18" cy="17" r="2.4" fill="#fbcfe8" />
            <circle cx="46" cy="17" r="4.8" fill="url(#bepoWhite3D)" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="46" cy="17" r="2.4" fill="#fbcfe8" />

            {/* Round Fluffy Bear Head */}
            <ellipse cx="32" cy="27" rx="16" ry="12.5" fill="url(#bepoWhite3D)" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Soft Cream Muzzle */}
            <ellipse cx="32" cy="32" rx="6.5" ry="4.8" fill="#f8fafc" />
            {/* Black Button Nose */}
            <ellipse cx="32" cy="30.2" rx="2.5" ry="1.6" fill="#0f172a" />
            {/* Cute Apologetic :3 Bear Mouth */}
            <path
              d="M 29.5 33.5 Q 31 35 32 33.5 Q 33 35 34.5 33.5"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            {/* Soulful Apologetic Anime Eyes with Catchlights */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 23 27 Q 26 30 29 27" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 35 27 Q 38 30 41 27" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="26" rx="2.5" ry="3.2" fill="#0f172a" />
                <circle cx="24.2" cy="25" r="1.1" fill="#ffffff" />
                <circle cx="25.8" cy="27.5" r="0.5" fill="#ffffff" />

                <ellipse cx="39" cy="26" rx="2.5" ry="3.2" fill="#0f172a" />
                <circle cx="38.2" cy="25" r="1.1" fill="#ffffff" />
                <circle cx="39.8" cy="27.5" r="0.5" fill="#ffffff" />
              </>
            )}

            {/* Rosy Pastel Cheeks */}
            <ellipse cx="19" cy="31" rx="2.6" ry="1.6" fill="#fda4af" opacity="0.85" />
            <ellipse cx="45" cy="31" rx="2.6" ry="1.6" fill="#fda4af" opacity="0.85" />
          </g>
        )}

        {/* 10. DORAEMON */}
        {species === 'doraemon' && (
          <g id="species-doraemon">
            {/* Red Tail on Back */}
            <circle cx="43" cy="50" r="2.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />

            {/* Seamless Chubby Blue Torso */}
            <path
              d="M 20 35 C 16 42, 16 52, 23 54 C 27 55, 37 55, 41 54 C 48 52, 48 42, 44 35 Z"
              fill="url(#doraemonBlue3D)"
              stroke="#0284c7"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* White Oval Feet */}
            <ellipse cx="25" cy="54.5" rx="4.8" ry="2.4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
            <ellipse cx="39" cy="54.5" rx="4.8" ry="2.4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />

            {/* White Belly Pouch & 4D Half-Moon Pocket */}
            <circle cx="32" cy="45.5" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <path d="M 26.5 45 A 5.5 5.5 0 0 0 37.5 45 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
            <line x1="26.5" y1="45" x2="37.5" y2="45" stroke="#64748b" strokeWidth="1.1" strokeLinecap="round" />

            {/* Blue Arms Extending Seamlessly from Shoulders to Hands */}
            {/* Left Arm & White Ball Hand */}
            <path d="M 21 36 Q 14 40 14 44.5 Q 18 45.5 22 40 Z" fill="url(#doraemonBlue3D)" stroke="#0284c7" strokeWidth="1" />
            <circle cx="14" cy="45" r="3.6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* Right Arm & White Ball Hand */}
            <path d="M 43 36 Q 50 40 50 44.5 Q 46 45.5 42 40 Z" fill="url(#doraemonBlue3D)" stroke="#0284c7" strokeWidth="1" />
            <circle cx="50" cy="45" r="3.6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* Perfectly Round Blue Head (Directly joined with body under collar) */}
            <circle cx="32" cy="22" r="15.5" fill="url(#doraemonBlue3D)" stroke="#0284c7" strokeWidth="1.2" />

            {/* White Face Mask */}
            <ellipse cx="32" cy="25" rx="13" ry="10.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

            {/* Snug Red Collar & 3D Golden Bell (Anchors head to body seamlessly) */}
            <rect x="19" y="34.5" width="26" height="3.2" rx="1.6" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="32" cy="38" r="3.5" fill="url(#bellGold3D)" stroke="#854d0e" strokeWidth="0.8" />
            <line x1="29.5" y1="37.5" x2="34.5" y2="37.5" stroke="#713f12" strokeWidth="0.8" />
            <circle cx="32" cy="39.2" r="0.8" fill="#713f12" />

            {/* Eyes Touching at Top Center */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 25.5 16 Q 28.5 19 31.5 16" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 32.5 16 Q 35.5 19 38.5 16" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="28.5" cy="15.5" rx="3.5" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="29.5" cy="15.5" rx="1.5" ry="2.2" fill="#0f172a" />
                <circle cx="29" cy="14.5" r="0.6" fill="#ffffff" />

                <ellipse cx="35.5" cy="15.5" rx="3.5" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="34.5" cy="15.5" rx="1.5" ry="2.2" fill="#0f172a" />
                <circle cx="34" cy="14.5" r="0.6" fill="#ffffff" />
              </>
            )}

            {/* Red Shiny Cherry Nose */}
            <circle cx="32" cy="20.5" r="3" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
            <circle cx="31" cy="19.5" r="0.9" fill="#ffffff" />

            {/* Philtrum & Open Smile with Pink Tongue */}
            <line x1="32" y1="23.5" x2="32" y2="30.5" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 23 28 Q 32 37 41 28 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 28 32 Q 32 29.5 36 32 Q 32 35.5 28 32 Z" fill="#fda4af" />

            {/* 3 Whiskers on Each Cheek */}
            <line x1="17" y1="24" x2="25" y2="25" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="16" y1="27" x2="25" y2="27" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="17" y1="30" x2="25" y2="29" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />

            <line x1="39" y1="25" x2="47" y2="24" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="39" y1="27" x2="48" y2="27" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <line x1="39" y1="29" x2="47" y2="30" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* 11. DORAMI */}
        {species === 'dorami' && (
          <g id="species-dorami">
            {/* Iconic Large Red Ribbon Bow (Dorami's Canonical Ears) */}
            {/* Left Bow Wing */}
            <path
              d="M 31 10 C 22 4, 12 5, 15 13 C 18 17, 27 14, 31 11 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M 20 10 C 24 10.5, 27 11.5, 31 11" fill="none" stroke="#991b1b" strokeWidth="0.8" />

            {/* Right Bow Wing */}
            <path
              d="M 33 10 C 42 4, 52 5, 49 13 C 46 17, 37 14, 33 11 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M 44 10 C 40 10.5, 37 11.5, 33 11" fill="none" stroke="#991b1b" strokeWidth="0.8" />

            {/* Bow Center Knot */}
            <ellipse cx="32" cy="10.5" rx="3.2" ry="3.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />

            {/* Red Flower Tail on Back */}
            <g id="dorami-flower-tail" transform="translate(44, 49)">
              <circle cx="-1.5" cy="0" r="1.4" fill="#ef4444" />
              <circle cx="1.5" cy="0" r="1.4" fill="#ef4444" />
              <circle cx="0" cy="-1.5" r="1.4" fill="#ef4444" />
              <circle cx="0" cy="1.5" r="1.4" fill="#ef4444" />
              <circle cx="0" cy="0" r="1" fill="#fef08a" />
            </g>

            {/* Seamless Sunny Yellow Body */}
            <path
              d="M 20 35 C 16 42, 16 52, 23 54 C 27 55, 37 55, 41 54 C 48 52, 48 42, 44 35 Z"
              fill="url(#doramiYellow3D)"
              stroke="#ca8a04"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* White Oval Feet */}
            <ellipse cx="25" cy="54.5" rx="4.8" ry="2.4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="39" cy="54.5" rx="4.8" ry="2.4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* White Belly Pouch & Yellow Checkered Gingham Pocket */}
            <circle cx="32" cy="45.5" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <path d="M 26.5 45 A 5.5 5.5 0 0 0 37.5 45 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
            <line x1="26.5" y1="45" x2="37.5" y2="45" stroke="#ca8a04" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="29.5" y1="45" x2="29.5" y2="49.5" stroke="#eab308" strokeWidth="0.8" />
            <line x1="34.5" y1="45" x2="34.5" y2="49.5" stroke="#eab308" strokeWidth="0.8" />
            <line x1="27.5" y1="47.5" x2="36.5" y2="47.5" stroke="#eab308" strokeWidth="0.8" />

            {/* Yellow Arms Extending Seamlessly from Shoulders to Hands */}
            {/* Left Arm & White Ball Hand */}
            <path d="M 21 36 Q 14 40 14 44.5 Q 18 45.5 22 40 Z" fill="url(#doramiYellow3D)" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="14" cy="45" r="3.6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* Right Arm & White Ball Hand */}
            <path d="M 43 36 Q 50 40 50 44.5 Q 46 45.5 42 40 Z" fill="url(#doramiYellow3D)" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="50" cy="45" r="3.6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

            {/* Sunny Yellow Head (Anchored to body) */}
            <circle cx="32" cy="22" r="15.5" fill="url(#doramiYellow3D)" stroke="#ca8a04" strokeWidth="1.2" />

            {/* White Face Mask */}
            <ellipse cx="32" cy="25" rx="13" ry="10.5" fill="#ffffff" stroke="#fef08a" strokeWidth="0.8" />

            {/* Dorami's Canonical White Collar with Golden Bell */}
            <rect x="19" y="34.5" width="26" height="3.2" rx="1.6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.9" />
            <circle cx="32" cy="38" r="3.5" fill="url(#bellGold3D)" stroke="#854d0e" strokeWidth="0.8" />
            <line x1="29.5" y1="37.5" x2="34.5" y2="37.5" stroke="#713f12" strokeWidth="0.8" />
            <circle cx="32" cy="39.2" r="0.8" fill="#713f12" />
            <circle cx="32" cy="37.8" r="1" fill="#ef4444" />

            {/* Big Sparkling Anime Eyes with Eyelashes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 25 17 Q 28 20.5 31 17" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 33 17 Q 36 20.5 39 17" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="24.5" y1="17" x2="23" y2="15.5" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="39.5" y1="17" x2="41" y2="15.5" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Left Eye */}
                <ellipse cx="28" cy="16.5" rx="3.6" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="28.8" cy="16.5" rx="2" ry="2.8" fill="#0284c7" />
                <ellipse cx="28.8" cy="16.5" rx="1.2" ry="1.8" fill="#0f172a" />
                <circle cx="28" cy="15" r="1" fill="#ffffff" />
                <circle cx="29.5" cy="18" r="0.5" fill="#ffffff" />
                {/* Left Eyelashes */}
                <line x1="25" y1="13" x2="23" y2="11.5" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="26.5" y1="12" x2="25.5" y2="10" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="28.5" y1="11.8" x2="28.5" y2="9.8" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />

                {/* Right Eye */}
                <ellipse cx="36" cy="16.5" rx="3.6" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
                <ellipse cx="35.2" cy="16.5" rx="2" ry="2.8" fill="#0284c7" />
                <ellipse cx="35.2" cy="16.5" rx="1.2" ry="1.8" fill="#0f172a" />
                <circle cx="34.4" cy="15" r="1" fill="#ffffff" />
                <circle cx="35.9" cy="18" r="0.5" fill="#ffffff" />
                {/* Right Eyelashes */}
                <line x1="39" y1="13" x2="41" y2="11.5" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="37.5" y1="12" x2="38.5" y2="10" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="35.5" y1="11.8" x2="35.5" y2="9.8" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
              </>
            )}

            {/* Red Shiny Cherry Nose */}
            <circle cx="32" cy="21.5" r="2.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
            <circle cx="31.2" cy="20.7" r="0.7" fill="#ffffff" />

            {/* Philtrum & Sweet Anime Smile */}
            <line x1="32" y1="24" x2="32" y2="28" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 25 27 Q 32 35 39 27" fill="#dc2626" stroke="#0f172a" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 28 30.5 Q 32 28.5 36 30.5 Q 32 33.5 28 30.5 Z" fill="#fda4af" />

            {/* Soft Pastel Pink Cheek Blush (Dorami does not have whiskers) */}
            <ellipse cx="20.5" cy="28.5" rx="3.2" ry="1.8" fill="#fda4af" opacity="0.85" />
            <ellipse cx="43.5" cy="28.5" rx="3.2" ry="1.8" fill="#fda4af" opacity="0.85" />
          </g>
        )}

        {/* 12. KIRBY */}
        {species === 'kirby' && (
          <g id="species-kirby">
            {/* Iconic Red Shoes / Feet at the Bottom Supporting Kirby */}
            <ellipse cx="22" cy="46" rx="7" ry="4.8" fill="#ef4444" stroke="#991b1b" strokeWidth="1" transform="rotate(-15 22 46)" />
            <ellipse cx="42" cy="46" rx="7" ry="4.8" fill="#ef4444" stroke="#991b1b" strokeWidth="1" transform="rotate(15 42 46)" />

            {/* Pure Adorable 3D Pink Spherical Body */}
            <circle cx="32" cy="30" r="16" fill="url(#kirbyPink3D)" stroke="#db2777" strokeWidth="1.2" />
            {/* Soft 3D Specular Highlight on Top-Left */}
            <ellipse cx="26" cy="20" rx="6" ry="2.5" fill="#ffffff" opacity="0.4" transform="rotate(-25 26 20)" />

            {/* Stubby Pink Arms Raised Happily in Joy */}
            <ellipse cx="16" cy="30" rx="4.5" ry="3.5" fill="url(#kirbyPink3D)" stroke="#db2777" strokeWidth="1" transform="rotate(-25 16 30)" />
            <ellipse cx="48" cy="30" rx="4.5" ry="3.5" fill="url(#kirbyPink3D)" stroke="#db2777" strokeWidth="1" transform="rotate(25 48 30)" />

            {/* Classic Kirby Anime Eyes (Vertical Black-to-Blue with White Shines) */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 24 26 Q 27 30 30 26" fill="none" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
                <path d="M 34 26 Q 37 30 40 26" fill="none" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="27" cy="26" rx="2.8" ry="5.5" fill="#1e1b4b" />
                <ellipse cx="27" cy="28.5" rx="2.3" ry="2.6" fill="#0284c7" />
                <ellipse cx="27" cy="23.5" rx="1.6" ry="2.2" fill="#ffffff" />
                <circle cx="27" cy="29.5" r="0.6" fill="#38bdf8" />

                <ellipse cx="37" cy="26" rx="2.8" ry="5.5" fill="#1e1b4b" />
                <ellipse cx="37" cy="28.5" rx="2.3" ry="2.6" fill="#0284c7" />
                <ellipse cx="37" cy="23.5" rx="1.6" ry="2.2" fill="#ffffff" />
                <circle cx="37" cy="29.5" r="0.6" fill="#38bdf8" />
              </>
            )}

            {/* Diagonal Oval Rosy Pink Cheek Blush */}
            <ellipse cx="20" cy="31" rx="3.5" ry="2" fill="#f43f5e" opacity="0.9" transform="rotate(-10 20 31)" />
            <ellipse cx="44" cy="31" rx="3.5" ry="2" fill="#f43f5e" opacity="0.9" transform="rotate(10 44 31)" />

            {/* Open Joyful Mouth with Tongue */}
            <path d="M 29.5 31 Q 32 37 34.5 31 Z" fill="#be123c" stroke="#9f1239" strokeWidth="0.8" />
            <path d="M 30.2 33.5 Q 32 32 33.8 33.5" fill="#fda4af" />
          </g>
        )}

        {/* 13. CAT (ANIME GINGER KITTEN) */}
        {species === 'cat' && (
          <g id="species-cat">
            {/* Gracefully Curving Tail with White Tip */}
            <path d="M 42 46 C 54 44, 57 32, 51 24 C 49 21, 46 23, 47 26 C 51 32, 48 42, 40 44 Z" fill="url(#catGrad)" stroke="#c2410c" strokeWidth="1.2" />
            <path d="M 51 24 C 49 21, 46 23, 47 26 C 49 27, 51 25, 51 24 Z" fill="#fff7ed" />

            {/* Chubby Ginger Body with Cream Belly */}
            <path d="M 22 36 C 18 42, 18 52, 24 54 C 28 54.5, 36 54.5, 40 54 C 46 52, 46 42, 42 36 Z" fill="url(#catGrad)" stroke="#c2410c" strokeWidth="1.2" />
            <ellipse cx="32" cy="45" rx="7.5" ry="6.5" fill="#fff7ed" />
            <ellipse cx="26" cy="54.5" rx="3.5" ry="2.2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />
            <ellipse cx="38" cy="54.5" rx="3.5" ry="2.2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />

            {/* Rounded Cat Ears with Pink Inner Tufts */}
            <path d="M 16 19 C 12 11, 17 6, 23 10 C 26 12, 26 16, 25 19 Z" fill="url(#catGrad)" stroke="#c2410c" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 17 17 C 14 11, 18 8, 22 11 Z" fill="#fbcfe8" />
            <path d="M 48 19 C 52 11, 47 6, 41 10 C 38 12, 38 16, 39 19 Z" fill="url(#catGrad)" stroke="#c2410c" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 47 17 C 50 11, 46 8, 42 11 Z" fill="#fbcfe8" />

            {/* Kitten Head */}
            <ellipse cx="32" cy="27" rx="16" ry="13" fill="url(#catGrad)" stroke="#c2410c" strokeWidth="1.2" />
            {/* Forehead Stripes */}
            <path d="M 32 16 L 32 20 M 28 17 L 29 21 M 36 17 L 35 21" stroke="#c2410c" strokeWidth="1.2" strokeLinecap="round" />
            {/* Cream Cheeks / Muzzle */}
            <ellipse cx="32" cy="32.5" rx="9" ry="6" fill="#fff7ed" />

            {/* Big Expressive Emerald Green Anime Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 27 Q 24 30 27 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 37 27 Q 40 31 43 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="26" rx="3.5" ry="4.5" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
                <ellipse cx="24" cy="26" rx="2" ry="3.5" fill="#0f172a" />
                <circle cx="23" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="25" cy="28" r="0.7" fill="#ffffff" />

                <ellipse cx="40" cy="26" rx="3.5" ry="4.5" fill="#10b981" stroke="#047857" strokeWidth="0.8" />
                <ellipse cx="40" cy="26" rx="2" ry="3.5" fill="#0f172a" />
                <circle cx="39" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="41" cy="28" r="0.7" fill="#ffffff" />
              </>
            )}

            {/* Pink Nose & Cute :3 Mouth */}
            <polygon points="31,30.5 33,30.5 32,32" fill="#f43f5e" />
            <path d="M 29.5 33 Q 31 35 32 33 Q 33 35 34.5 33" fill="none" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="18" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.85" />
            <ellipse cx="46" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.85" />

            {/* Whiskers */}
            <line x1="11" y1="30" x2="19" y2="31" stroke="#9a3412" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="12" y1="33" x2="19" y2="33" stroke="#9a3412" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="45" y1="31" x2="53" y2="30" stroke="#9a3412" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="45" y1="33" x2="52" y2="33" stroke="#9a3412" strokeWidth="0.9" strokeLinecap="round" />
          </g>
        )}

        {/* 14. DOG (SHIBA INU) */}
        {species === 'dog' && (
          <g id="species-dog">
            {/* Curled Donut Shiba Tail */}
            <path d="M 40 45 C 50 42, 53 32, 47 28 C 43 25, 39 30, 43 34" fill="none" stroke="#d97706" strokeWidth="3.6" strokeLinecap="round" />

            {/* Golden Shiba Body with Cream Belly */}
            <path d="M 22 36 C 18 42, 18 52, 24 54 C 28 54.5, 36 54.5, 40 54 C 46 52, 46 42, 42 36 Z" fill="url(#shibaGold3D)" stroke="#b45309" strokeWidth="1.2" />
            <ellipse cx="32" cy="45" rx="7.5" ry="6.5" fill="#fef3c7" />
            <ellipse cx="26" cy="54.5" rx="3.5" ry="2.2" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
            <ellipse cx="38" cy="54.5" rx="3.5" ry="2.2" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />

            {/* Triangular Shiba Ears with Cream Centers */}
            <path d="M 16 19 C 13 11, 17 6, 23 10 C 26 12, 26 16, 25 19 Z" fill="url(#shibaGold3D)" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 17 16 C 15 11, 18 8, 22 11 Z" fill="#fef3c7" />
            <path d="M 48 19 C 51 11, 47 6, 41 10 C 38 12, 38 16, 39 19 Z" fill="url(#shibaGold3D)" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 47 16 C 49 11, 46 8, 42 11 Z" fill="#fef3c7" />

            {/* Shiba Head */}
            <ellipse cx="32" cy="27" rx="16" ry="13" fill="url(#shibaGold3D)" stroke="#b45309" strokeWidth="1.2" />
            {/* Signature Shiba White Cheek Mask */}
            <path d="M 20 28 C 17 38, 47 38, 44 28 C 41 36, 23 36, 20 28 Z" fill="#fef3c7" />

            {/* Signature Shiba Eyebrow Dots ("Maro Eyebrows") */}
            <circle cx="25" cy="20.5" r="1.6" fill="#fef3c7" />
            <circle cx="39" cy="20.5" r="1.6" fill="#fef3c7" />

            {/* Eyes with Sparkling Catchlights */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 26 Q 25 29 28 26" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 36 26 Q 39 29 42 26" fill="none" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="26" rx="2.6" ry="3.6" fill="#1e1b4b" />
                <circle cx="24.2" cy="25" r="1.2" fill="#ffffff" />
                <circle cx="25.8" cy="27.8" r="0.6" fill="#ffffff" />
                <ellipse cx="39" cy="26" rx="2.6" ry="3.6" fill="#1e1b4b" />
                <circle cx="38.2" cy="25" r="1.2" fill="#ffffff" />
                <circle cx="39.8" cy="27.8" r="0.6" fill="#ffffff" />
              </>
            )}

            {/* Black Nose & Cheerful Open Tongue */}
            <ellipse cx="32" cy="29.5" rx="2.2" ry="1.6" fill="#1e1b4b" />
            <path d="M 30.5 32 Q 32 36 33.5 32 Z" fill="#f43f5e" stroke="#1e1b4b" strokeWidth="0.8" />
            <ellipse cx="19" cy="32" rx="2.4" ry="1.4" fill="#fda4af" opacity="0.85" />
            <ellipse cx="45" cy="32" rx="2.4" ry="1.4" fill="#fda4af" opacity="0.85" />
          </g>
        )}

        {/* 15. FOX (KITSUNE) */}
        {species === 'fox' && (
          <g id="species-fox">
            {/* Big Fluffy White-Tipped Fox Tail */}
            <path d="M 42 46 C 54 44, 62 32, 55 23 C 50 19, 44 26, 45 34" fill="url(#foxOrange3D)" stroke="#9a3412" strokeWidth="1.2" />
            <path d="M 55 23 C 53 20, 49 21, 48 24 C 50 26, 53 25, 55 23 Z" fill="#ffffff" />

            {/* Fox Body */}
            <path d="M 22 36 C 18 42, 18 52, 24 54 C 28 54.5, 36 54.5, 40 54 C 46 52, 46 42, 42 36 Z" fill="url(#foxOrange3D)" stroke="#9a3412" strokeWidth="1.2" />
            <ellipse cx="32" cy="45" rx="7.5" ry="6.5" fill="#ffffff" />
            <ellipse cx="26" cy="54.5" rx="3.5" ry="2" fill="#1e293b" />
            <ellipse cx="38" cy="54.5" rx="3.5" ry="2" fill="#1e293b" />

            {/* Pointed Fox Ears with Black Outer Tips & White Inner Fur */}
            <polygon points="19,19 11,4 25,13" fill="url(#foxOrange3D)" stroke="#9a3412" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="15,9 11,4 18,8" fill="#1e293b" />
            <polygon points="18,17 14,10 22,14" fill="#ffffff" />

            <polygon points="45,19 53,4 39,13" fill="url(#foxOrange3D)" stroke="#9a3412" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="49,9 53,4 46,8" fill="#1e293b" />
            <polygon points="46,17 50,10 42,14" fill="#ffffff" />

            {/* Fox Head & White Cheek Tufts */}
            <ellipse cx="32" cy="27" rx="15" ry="12" fill="url(#foxOrange3D)" stroke="#9a3412" strokeWidth="1.2" />
            <polygon points="17,26 26,34 24,24" fill="#ffffff" />
            <polygon points="47,26 38,34 40,24" fill="#ffffff" />

            {/* Fox Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 26 Q 25 28 28 25" fill="none" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 36 25 Q 39 28 42 26" fill="none" stroke="#1e1b4b" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="25" rx="2.6" ry="3.5" fill="#d97706" transform="rotate(-10 25 25)" />
                <ellipse cx="25" cy="25" rx="1.6" ry="2.8" fill="#1e1b4b" />
                <circle cx="24.2" cy="24" r="1" fill="#ffffff" />
                <ellipse cx="39" cy="25" rx="2.6" ry="3.5" fill="#d97706" transform="rotate(10 39 25)" />
                <ellipse cx="39" cy="25" rx="1.6" ry="2.8" fill="#1e1b4b" />
                <circle cx="38.2" cy="24" r="1" fill="#ffffff" />
              </>
            )}

            <circle cx="32" cy="30" r="1.6" fill="#0f172a" />
            <path d="M 30.5 32 Q 32 33.8 33.5 32" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="20" cy="31" rx="2.2" ry="1.4" fill="#fed7aa" opacity="0.8" />
            <ellipse cx="44" cy="31" rx="2.2" ry="1.4" fill="#fed7aa" opacity="0.8" />
          </g>
        )}

        {/* 16. PANDA */}
        {species === 'panda' && (
          <g id="species-panda">
            {/* Fluffy White Body with Black Shoulders & Paws */}
            <path d="M 22 36 C 18 42, 18 52, 24 54 C 28 54.5, 36 54.5, 40 54 C 46 52, 46 42, 42 36 Z" fill="url(#pandaWhite3D)" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M 22 37 C 22 43, 42 43, 42 37 L 44 44 L 20 44 Z" fill="#0f172a" />
            <circle cx="18" cy="43" r="3.4" fill="#0f172a" />
            <circle cx="46" cy="43" r="3.4" fill="#0f172a" />
            <ellipse cx="26" cy="54.5" rx="3.8" ry="2.2" fill="#0f172a" />
            <ellipse cx="38" cy="54.5" rx="3.8" ry="2.2" fill="#0f172a" />

            {/* Black Rounded Panda Ears */}
            <circle cx="18" cy="15" r="4.8" fill="#0f172a" />
            <circle cx="46" cy="15" r="4.8" fill="#0f172a" />

            {/* Round White Head */}
            <ellipse cx="32" cy="26" rx="16" ry="13" fill="url(#pandaWhite3D)" stroke="#0f172a" strokeWidth="1.2" />

            {/* Iconic Black Eye Patches */}
            <ellipse cx="24" cy="26" rx="4.8" ry="3.8" fill="#0f172a" transform="rotate(-15 24 26)" />
            <ellipse cx="40" cy="26" rx="4.8" ry="3.8" fill="#0f172a" transform="rotate(15 40 26)" />

            {/* Big Sparkling Liquid Anime Eyes inside Patches */}
            {effectiveState === 'sleep' ? (
              <>
                <line x1="22" y1="26" x2="26" y2="26" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="38" y1="26" x2="42" y2="26" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="24.5" cy="25.5" r="2.2" fill="#ffffff" />
                <circle cx="24.8" cy="25.8" r="1.3" fill="#0f172a" />
                <circle cx="24.2" cy="24.8" r="0.6" fill="#ffffff" />

                <circle cx="39.5" cy="25.5" r="2.2" fill="#ffffff" />
                <circle cx="39.2" cy="25.8" r="1.3" fill="#0f172a" />
                <circle cx="38.8" cy="24.8" r="0.6" fill="#ffffff" />
              </>
            )}

            <ellipse cx="32" cy="29.5" rx="2" ry="1.4" fill="#0f172a" />
            <path d="M 30.5 32 Q 32 34 33.5 32" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="19" cy="30" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="45" cy="30" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />

            {/* Fresh Green Bamboo Shoot in Paw */}
            <g id="panda-bamboo">
              <line x1="44" y1="47" x2="48" y2="38" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="48,38 52,36 47,40" fill="#22c55e" />
            </g>
          </g>
        )}

        {/* 17. BUNNY */}
        {species === 'bunny' && (
          <g id="species-bunny">
            {/* Long Soft Rabbit Ears with Pink Centers */}
            <rect x="20" y="5" width="6.5" height="17" rx="3.2" fill="url(#bunnyCream3D)" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="21.8" y="7.5" width="3" height="12" rx="1.5" fill="#fbcfe8" />
            <rect x="37.5" y="5" width="6.5" height="17" rx="3.2" fill="url(#bunnyCream3D)" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="39.2" y="7.5" width="3" height="12" rx="1.5" fill="#fbcfe8" />

            {/* Round Fluffy Body & Cottontail */}
            <ellipse cx="32" cy="44" rx="12" ry="10" fill="url(#bunnyCream3D)" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="44" cy="44" r="3.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <ellipse cx="26" cy="54.5" rx="3.5" ry="2.2" fill="#fbcfe8" />
            <ellipse cx="38" cy="54.5" rx="3.5" ry="2.2" fill="#fbcfe8" />

            {/* Round Bunny Head */}
            <circle cx="32" cy="27" r="14" fill="url(#bunnyCream3D)" stroke="#cbd5e1" strokeWidth="1.2" />

            {/* Sparkling Ruby Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 23 27 Q 26 30 29 27" fill="none" stroke="#db2777" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 35 27 Q 38 30 41 27" fill="none" stroke="#db2777" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="26" rx="3" ry="4" fill="#e11d48" />
                <circle cx="24" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="26" cy="28" r="0.7" fill="#ffffff" />
                <ellipse cx="39" cy="26" rx="3" ry="4" fill="#e11d48" />
                <circle cx="38" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="40" cy="28" r="0.7" fill="#ffffff" />
              </>
            )}

            {/* Pink Nose & Bunny Mouth */}
            <polygon points="31,30.5 33,30.5 32,32" fill="#f43f5e" />
            <path d="M 30.5 32.5 Q 32 34 33.5 32.5" fill="none" stroke="#db2777" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="18" cy="30.5" rx="2.8" ry="1.6" fill="#fda4af" opacity="0.85" />
            <ellipse cx="46" cy="30.5" rx="2.8" ry="1.6" fill="#fda4af" opacity="0.85" />
          </g>
        )}

        {/* 18. OWL (MEOWLISH EMERALD MASCOT LEXI) */}
        {species === 'owl' && (
          <g id="species-owl">
            {/* Emerald Tuft Ears */}
            <polygon points="19,18 15,8 26,16" fill="#047857" stroke="#064e3b" strokeWidth="1" />
            <polygon points="45,18 49,8 38,16" fill="#047857" stroke="#064e3b" strokeWidth="1" />

            {/* Round Wise Emerald Body */}
            <ellipse cx="32" cy="30" rx="16" ry="15" fill="url(#owlEmerald3D)" stroke="#047857" strokeWidth="1.3" />

            {/* Soft Cream/Mint Feathered Belly with Chevrons */}
            <path d="M 23 28 C 23 44, 41 44, 41 28 Z" fill="#d1fae5" />
            <path d="M 28 34 Q 32 37 36 34 M 27 39 Q 32 42 37 39" fill="none" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" />

            {/* Wings */}
            <path d="M 16 26 C 14 36, 17 44, 20 46" fill="none" stroke="#047857" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 48 26 C 50 36, 47 44, 44 46" fill="none" stroke="#047857" strokeWidth="2.8" strokeLinecap="round" />

            {/* Intellectual Golden Owl Eyes */}
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
                <circle cx="25" cy="25.5" r="0.6" fill="#ffffff" />
                <circle cx="40" cy="24" r="6.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="40" cy="24" r="3.8" fill="#0f172a" />
                <circle cx="39" cy="22.5" r="1.3" fill="#ffffff" />
                <circle cx="41" cy="25.5" r="0.6" fill="#ffffff" />
              </>
            )}

            {/* Golden Beak & Talons */}
            <polygon points="30,27 34,27 32,32" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
            <ellipse cx="27" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
            <ellipse cx="37" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
          </g>
        )}

        {/* 19. KURAMA (NARUTO - 9 TAILED FOX KYUUBI CHIBI CUB) */}
        {species === 'kurama' && (
          <g id="species-kurama">
            {/* 9 Magnificent Fiery Tails Fanning Out Across the Back */}
            {/* Tail 1 (Far Left) */}
            <path d="M 24 44 C 12 42, 2 34, 4 22 C 7 28, 16 38, 24 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="4,22 8,26 6,21" fill="#fef08a" />
            {/* Tail 2 */}
            <path d="M 26 44 C 14 36, 6 22, 10 12 C 14 20, 20 34, 26 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="10,12 13,17 11,12" fill="#fef08a" />
            {/* Tail 3 */}
            <path d="M 28 44 C 18 30, 14 14, 20 6 C 23 16, 25 32, 28 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="20,6 22,12 21,6" fill="#fef08a" />
            {/* Tail 4 */}
            <path d="M 30 44 C 24 26, 23 10, 27 3 C 29 14, 30 30, 30 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="27,3 28,8 27.5,3" fill="#fef08a" />
            {/* Tail 5 (Crown Center) */}
            <path d="M 32 44 C 30 24, 30 6, 32 1 C 34 6, 34 24, 32 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="32,1 33,5 31,5" fill="#fef08a" />
            {/* Tail 6 */}
            <path d="M 34 44 C 40 26, 41 10, 37 3 C 35 14, 34 30, 34 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="37,3 36,8 36.5,3" fill="#fef08a" />
            {/* Tail 7 */}
            <path d="M 36 44 C 46 30, 50 14, 44 6 C 41 16, 39 32, 36 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="44,6 42,12 43,6" fill="#fef08a" />
            {/* Tail 8 */}
            <path d="M 38 44 C 50 36, 58 22, 54 12 C 50 20, 44 34, 38 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="54,12 51,17 53,12" fill="#fef08a" />
            {/* Tail 9 (Far Right) */}
            <path d="M 40 44 C 52 42, 62 34, 60 22 C 57 28, 48 38, 40 44 Z" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <polygon points="60,22 56,26 58,21" fill="#fef08a" />

            {/* Powerful Yet Chubby Fiery Baby Fox Body */}
            <path
              d="M 21 36 C 17 42, 17 52, 23 54 C 27 55, 37 55, 41 54 C 47 52, 47 42, 43 36 Z"
              fill="url(#kuramaOrange3D)"
              stroke="#9a3412"
              strokeWidth="1.2"
            />
            {/* Cream Chest Fur Tuft */}
            <path d="M 27 37 Q 32 44 37 37 Q 32 41 27 37 Z" fill="#ffedd5" />

            {/* Front Paws with Dark Claws */}
            <ellipse cx="25" cy="54.5" rx="3.8" ry="2.2" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="0.9" />
            <line x1="23.5" y1="53.5" x2="23.5" y2="55.8" stroke="#1e1b4b" strokeWidth="0.9" />
            <line x1="25" y1="53.5" x2="25" y2="56.2" stroke="#1e1b4b" strokeWidth="0.9" />
            <line x1="26.5" y1="53.5" x2="26.5" y2="55.8" stroke="#1e1b4b" strokeWidth="0.9" />

            <ellipse cx="39" cy="54.5" rx="3.8" ry="2.2" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="0.9" />
            <line x1="37.5" y1="53.5" x2="37.5" y2="55.8" stroke="#1e1b4b" strokeWidth="0.9" />
            <line x1="39" y1="53.5" x2="39" y2="56.2" stroke="#1e1b4b" strokeWidth="0.9" />
            <line x1="40.5" y1="53.5" x2="40.5" y2="55.8" stroke="#1e1b4b" strokeWidth="0.9" />

            {/* Long Pointed Fox Ears with Dark Edges & White Inner Tuft */}
            <polygon points="19,19 9,3 26,13" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="15,11 9,3 19,8" fill="#1e1b4b" />
            <polygon points="18,17 14,10 22,14" fill="#ffedd5" />

            <polygon points="45,19 55,3 38,13" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="49,11 55,3 45,8" fill="#1e1b4b" />
            <polygon points="46,17 50,10 42,14" fill="#ffedd5" />

            {/* Fierce Yet Cute Chibi Fox Head */}
            <ellipse cx="32" cy="27" rx="15.5" ry="12.5" fill="url(#kuramaOrange3D)" stroke="#9a3412" strokeWidth="1.2" />

            {/* White Cheek Tufts */}
            <polygon points="17,27 24,33 23,24" fill="#ffedd5" />
            <polygon points="47,27 40,33 41,24" fill="#ffedd5" />

            {/* Kurama's Signature Bold Black Eye Bands (Fox Markings Extending to Ears) */}
            <path d="M 17 24 L 23 25.5 L 20 28.5 Z" fill="#0f172a" />
            <path d="M 47 24 L 41 25.5 L 44 28.5 Z" fill="#0f172a" />

            {/* Sparkling Crimson/Ruby Anime Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 26 Q 25 29 28 26" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 36 26 Q 39 29 42 26" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="25.5" rx="3.2" ry="4.2" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
                <ellipse cx="25" cy="25.5" rx="1.5" ry="3.5" fill="#0f172a" />
                <circle cx="24.2" cy="24" r="1.1" fill="#ffffff" />
                <circle cx="25.8" cy="27" r="0.5" fill="#ffffff" />

                <ellipse cx="39" cy="25.5" rx="3.2" ry="4.2" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
                <ellipse cx="39" cy="25.5" rx="1.5" ry="3.5" fill="#0f172a" />
                <circle cx="38.2" cy="24" r="1.1" fill="#ffffff" />
                <circle cx="39.8" cy="27" r="0.5" fill="#ffffff" />
              </>
            )}

            {/* Rosy Cheek Blush */}
            <ellipse cx="19" cy="31" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="45" cy="31" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />

            {/* Black Fox Button Nose & Fanged Confident Grin */}
            <circle cx="32" cy="29.2" r="1.4" fill="#0f172a" />
            <path d="M 28 32 Q 32 35.5 36 32" fill="#451a03" stroke="#0f172a" strokeWidth="0.9" />
            <polygon points="29,32 30,34 31,32" fill="#ffffff" />
            <polygon points="33,32 34,34 35,32" fill="#ffffff" />
          </g>
        )}

        {/* 20. PAKKUN (NARUTO - CHIBI NINKEN PUG) */}
        {species === 'pakkun' && (
          <g id="species-pakkun">
            {/* Floppy Chocolate Brown Pug Ears with Fold */}
            <path d="M 18 19 C 12 18, 10 27, 15 31 C 18 29, 20 23, 20 19 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.1" />
            <path d="M 46 19 C 52 18, 54 27, 49 31 C 46 29, 44 23, 44 19 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.1" />

            {/* Pug Body with Blue Ninja Vest & White Fleece Collar */}
            <path
              d="M 21 36 C 17 42, 17 52, 23 54 C 27 55, 37 55, 41 54 C 47 52, 47 42, 43 36 Z"
              fill="url(#pakkunTan3D)"
              stroke="#78350f"
              strokeWidth="1.2"
            />
            {/* Blue Ninja Vest */}
            <polygon points="25,37 32,45 39,37" fill="#1e3a8a" stroke="#0f172a" strokeWidth="0.8" />
            {/* White Fleece Collar */}
            <ellipse cx="32" cy="38" rx="8" ry="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />

            {/* Little Paws with Pink Pads */}
            <ellipse cx="26" cy="54.5" rx="3.6" ry="2.2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
            <circle cx="26" cy="54.5" r="1.1" fill="#fbcfe8" />
            <ellipse cx="38" cy="54.5" rx="3.6" ry="2.2" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
            <circle cx="38" cy="54.5" r="1.1" fill="#fbcfe8" />

            {/* Squishy Brown Pug Head */}
            <ellipse cx="32" cy="27" rx="16" ry="12.5" fill="url(#pakkunTan3D)" stroke="#78350f" strokeWidth="1.2" />

            {/* Konoha Ninja Forehead Protector Band (Positioned at Forehead y=11..16.5) */}
            <rect x="21" y="11" width="22" height="6.5" rx="2" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1" />
            <rect x="24" y="12" width="16" height="4.5" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.6" />
            {/* Konoha Leaf Swirl */}
            <circle cx="32" cy="14.2" r="1.2" fill="none" stroke="#0f172a" strokeWidth="0.8" />
            <line x1="31" y1="14.2" x2="34" y2="13.5" stroke="#0f172a" strokeWidth="0.8" />

            {/* Cute Brow Wrinkles */}
            <path d="M 27 19 Q 32 17.5 37 19" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
            <path d="M 28 21 Q 32 19.5 36 21" fill="none" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />

            {/* Soulful Glassy Brown Puppy Eyes with Dual Catchlights */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 22 26 Q 25 29 28 26" fill="none" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
                <path d="M 36 26 Q 39 29 42 26" fill="none" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="25.5" rx="3.2" ry="3.8" fill="#1e1b4b" />
                <circle cx="24.2" cy="24.5" r="1.2" fill="#ffffff" />
                <circle cx="26" cy="27" r="0.6" fill="#ffffff" />

                <ellipse cx="39" cy="25.5" rx="3.2" ry="3.8" fill="#1e1b4b" />
                <circle cx="38.2" cy="24.5" r="1.2" fill="#ffffff" />
                <circle cx="40" cy="27" r="0.6" fill="#ffffff" />
              </>
            )}

            {/* Rosy Pug Cheeks */}
            <ellipse cx="19" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="45" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />

            {/* Dark Chocolate Pug Muzzle & Snout */}
            <ellipse cx="32" cy="31.5" rx="7.2" ry="5.2" fill="#451a03" />
            <ellipse cx="32" cy="29.8" rx="2.6" ry="1.7" fill="#0f172a" />
            {/* Cute Little Tongue Blep */}
            <path d="M 30.5 33.5 Q 32 36.5 33.5 33.5 Z" fill="#f43f5e" stroke="#1e1b4b" strokeWidth="0.5" />
          </g>
        )}

        {/* 21. GAMAKICHI (NARUTO - TOAD PRINCE OF MOUNT MYOBOKU) */}
        {species === 'gamakichi' && (
          <g id="species-gamakichi">
            {/* Toad Eyes on Top of Head with Horizontal Bar Pupils */}
            <circle cx="24" cy="17" r="6.8" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <line x1="19.5" y1="17" x2="28.5" y2="17" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="23" cy="15.2" r="1.1" fill="#ffffff" />
            <circle cx="25.5" cy="18.5" r="0.6" fill="#ffffff" />

            <circle cx="40" cy="17" r="6.8" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <line x1="35.5" y1="17" x2="44.5" y2="17" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="39" cy="15.2" r="1.1" fill="#ffffff" />
            <circle cx="41.5" cy="18.5" r="0.6" fill="#ffffff" />

            {/* Orange Toad Head with Distinctive Blue Lightning Markings */}
            <ellipse cx="32" cy="27" rx="17" ry="12.5" fill="url(#gamakichiOrange3D)" stroke="#9a3412" strokeWidth="1.3" />
            {/* Blue Lightning Crest on Brow */}
            <path d="M 30 19 L 32 15 L 34 19" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Traditional Blue Happi Coat (Summon Vest) */}
            <path d="M 20 38 L 44 38 L 46 53 L 18 53 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.2" />
            {/* Orange Chest under Coat */}
            <polygon points="26,38 32,46 38,38" fill="#ffedd5" />
            {/* White Lapel Lines */}
            <line x1="21" y1="38" x2="21" y2="53" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="43" y1="38" x2="43" y2="53" stroke="#ffffff" strokeWidth="1.5" />
            {/* Black Obi Sash */}
            <rect x="21" y="47" width="22" height="2.5" fill="#0f172a" />

            {/* Wide Cheerful Smirk */}
            <path d="M 21 29 Q 32 36 43 29" fill="none" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" />
            <path d="M 28 31 Q 32 33.5 36 31" fill="#f43f5e" />

            {/* Toad Squat Webbed Arms and Legs with Round Suction Toes */}
            <ellipse cx="17" cy="49" rx="5" ry="3.5" fill="url(#gamakichiOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <ellipse cx="47" cy="49" rx="5" ry="3.5" fill="url(#gamakichiOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <ellipse cx="25" cy="54.5" rx="4.5" ry="2.2" fill="url(#gamakichiOrange3D)" stroke="#9a3412" strokeWidth="1" />
            <ellipse cx="39" cy="54.5" rx="4.5" ry="2.2" fill="url(#gamakichiOrange3D)" stroke="#9a3412" strokeWidth="1" />
          </g>
        )}

        {/* 22. HEDWIG (HARRY POTTER - SNOWY OWL) */}
        {species === 'hedwig' && (
          <g id="species-hedwig">
            {/* Soft Snowy Feathers Crest */}
            <polygon points="19,18 15,8 26,16" fill="url(#hedwigWhite3D)" stroke="#cbd5e1" strokeWidth="0.8" />
            <polygon points="45,18 49,8 38,16" fill="url(#hedwigWhite3D)" stroke="#cbd5e1" strokeWidth="0.8" />

            {/* Pure White Snowy Owl Volumetric Body */}
            <ellipse cx="32" cy="30" rx="16" ry="15" fill="url(#hedwigWhite3D)" stroke="#cbd5e1" strokeWidth="1.2" />

            {/* Characteristic Snowy Slate Chevron Flecks */}
            <path d="M 25 33 L 28 35 M 36 33 L 39 35 M 29 40 L 32 42 M 33 40 L 35 42 M 30 44 L 34 44" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />

            {/* Rounded Scalloped Wings at Sides */}
            <path d="M 16 26 C 14 36, 17 44, 20 46" fill="none" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 48 26 C 50 36, 47 44, 44 46" fill="none" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />

            {/* Glowing Amber-Gold Owl Eyes with Starry Dual Catchlights */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 18 24 Q 24 29 30 24" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 34 24 Q 40 29 46 24" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="24" cy="24" r="6.8" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
                <circle cx="24" cy="24" r="3.8" fill="#0f172a" />
                <circle cx="23" cy="22.5" r="1.3" fill="#ffffff" />
                <circle cx="25.5" cy="25.5" r="0.6" fill="#ffffff" />

                <circle cx="40" cy="24" r="6.8" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
                <circle cx="40" cy="24" r="3.8" fill="#0f172a" />
                <circle cx="39" cy="22.5" r="1.3" fill="#ffffff" />
                <circle cx="41.5" cy="25.5" r="0.6" fill="#ffffff" />
              </>
            )}

            {/* Soft Cheek Blush */}
            <ellipse cx="17.5" cy="29" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="46.5" cy="29" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />

            {/* Dark Beak & Talons */}
            <polygon points="30,27 34,27 32,32" fill="#0f172a" />
            <circle cx="31.3" cy="28.2" r="0.5" fill="#94a3b8" />
            <ellipse cx="27" cy="46" rx="2.5" ry="1.5" fill="#64748b" />
            <ellipse cx="37" cy="46" rx="2.5" ry="1.5" fill="#64748b" />
          </g>
        )}

        {/* 23. CROOKSHANKS (HARRY POTTER - FLUFFY PERSIAN KNEAZLE) */}
        {species === 'crookshanks' && (
          <g id="species-crookshanks">
            {/* Bushy Bottle-Brush Tail Curling Up */}
            <path d="M 42 45 C 54 43, 60 28, 53 19 C 50 16, 46 19, 48 23 C 51 28, 48 38, 40 43 Z" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />

            {/* Voluminous Ginger Persian Cat Body */}
            <path
              d="M 21 36 C 17 42, 17 52, 23 54 C 27 55, 37 55, 41 54 C 47 52, 47 42, 43 36 Z"
              fill="url(#crookshanksOrange3D)"
              stroke="#c2410c"
              strokeWidth="1.2"
            />
            {/* Fluffy Lion-like Neck Mane/Ruff */}
            <ellipse cx="32" cy="38" rx="10" ry="3.5" fill="#fed7aa" stroke="#f97316" strokeWidth="0.8" />

            {/* White Paws */}
            <ellipse cx="26" cy="54.5" rx="3.6" ry="2.2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />
            <ellipse cx="38" cy="54.5" rx="3.6" ry="2.2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />

            {/* Folded Persian Cat Ears */}
            <polygon points="18,19 12,8 24,15" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />
            <polygon points="16,16 13,10 20,14" fill="#fbcfe8" />
            <polygon points="46,19 52,8 40,15" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />
            <polygon points="48,16 51,10 44,14" fill="#fbcfe8" />

            {/* Squashed Adorably Grumpy-Cute Persian Face */}
            <ellipse cx="32" cy="27" rx="16.5" ry="12.5" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />
            <ellipse cx="32" cy="32" rx="8.5" ry="5.5" fill="#fed7aa" />

            {/* Grumpy-Cute Amber Eyes with Vertical Pupils */}
            {effectiveState === 'sleep' ? (
              <>
                <line x1="21" y1="26" x2="27" y2="26" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="37" y1="26" x2="43" y2="26" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="26" rx="3.6" ry="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <ellipse cx="24" cy="26" rx="1.8" ry="3.5" fill="#0f172a" />
                <circle cx="23.2" cy="24.5" r="1.1" fill="#ffffff" />
                <circle cx="25" cy="28" r="0.5" fill="#ffffff" />

                <ellipse cx="40" cy="26" rx="3.6" ry="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <ellipse cx="40" cy="26" rx="1.8" ry="3.5" fill="#0f172a" />
                <circle cx="39.2" cy="24.5" r="1.1" fill="#ffffff" />
                <circle cx="41" cy="28" r="0.5" fill="#ffffff" />
              </>
            )}

            {/* Rosy Cheeks & Whiskers */}
            <ellipse cx="18" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="46" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <line x1="12" y1="31" x2="19" y2="32" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="45" y1="32" x2="52" y2="31" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />

            {/* Flat Grumpy Persian Muzzle */}
            <polygon points="31,30.5 33,30.5 32,32" fill="#f43f5e" />
            <path d="M 29.5 33.5 Q 32 32 34.5 33.5" fill="none" stroke="#451a03" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* 24. FAWKES (HARRY POTTER - MAJESTIC RADIANT PHOENIX) */}
        {species === 'fawkes' && (
          <g id="species-fawkes">
            {/* Flowing Golden Flame Crown Crest Curling Gracefully Back */}
            <path d="M 32 15 Q 36 4 45 2 M 32 17 Q 39 7 47 6" fill="none" stroke="url(#fawkesGold3D)" strokeWidth="3" strokeLinecap="round" />

            {/* 3 Shimmering Trailing Golden Flame Ribbons with Sparkles */}
            <path d="M 30 46 Q 26 56 22 63" fill="none" stroke="url(#fawkesRed3D)" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 32 46 Q 32 58 32 64" fill="none" stroke="url(#fawkesGold3D)" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 34 46 Q 38 56 42 63" fill="none" stroke="url(#fawkesRed3D)" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="22" cy="63" r="1" fill="#fef08a" />
            <circle cx="32" cy="64" r="1.2" fill="#fef08a" />
            <circle cx="42" cy="63" r="1" fill="#fef08a" />

            {/* Radiant Scarlet & Crimson Body */}
            <ellipse cx="32" cy="30" rx="15" ry="14" fill="url(#fawkesRed3D)" stroke="#991b1b" strokeWidth="1.2" />
            {/* Shimmering Golden Flame Breast */}
            <path d="M 23 28 C 23 44, 41 44, 41 28 Z" fill="url(#fawkesGold3D)" />

            {/* Layered Wings with Gold-Tipped Feathers */}
            <path d="M 17 26 C 14 36, 17 44, 20 46" fill="none" stroke="url(#fawkesGold3D)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 47 26 C 50 36, 47 44, 44 46" fill="none" stroke="url(#fawkesGold3D)" strokeWidth="3" strokeLinecap="round" />

            {/* Wise Golden Phoenix Eyes with Diamond Catchlights */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 20 25 Q 24 28 28 25" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <path d="M 36 25 Q 40 28 44 25" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="24" cy="24" r="5.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <circle cx="24" cy="24" r="3" fill="#0f172a" />
                <polygon points="23.2,22.2 24.2,23.2 23.2,24.2 22.2,23.2" fill="#ffffff" />
                <circle cx="25" cy="25.5" r="0.6" fill="#ffffff" />

                <circle cx="40" cy="24" r="5.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <circle cx="40" cy="24" r="3" fill="#0f172a" />
                <polygon points="39.2,22.2 40.2,23.2 39.2,24.2 38.2,23.2" fill="#ffffff" />
                <circle cx="41" cy="25.5" r="0.6" fill="#ffffff" />
              </>
            )}

            {/* Curved Golden Beak & Talons */}
            <polygon points="30,27 34,27 32,33" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <ellipse cx="27" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
            <ellipse cx="37" cy="46" rx="2.5" ry="1.5" fill="#f59e0b" />
          </g>
        )}

        {/* 25. GOOSE (MARVEL FLERKEN CAT) */}
        {species === 'goose' && (
          <g id="species-goose">
            {/* Ginger Cat Tail with Hidden Playful Flerken Tentacle Curl */}
            <path d="M 42 46 C 54 44, 57 32, 51 24 C 49 21, 46 23, 47 26 C 51 32, 48 42, 40 44 Z" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />
            {/* Cute Little Flerken Tentacle Peek */}
            <path d="M 49 22 Q 54 18 53 14 Q 51 12 50 15" fill="none" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="53" cy="14" r="0.8" fill="#e9d5ff" />

            {/* Ginger Cat Body with Cream Belly */}
            <path
              d="M 21 36 C 17 42, 17 52, 23 54 C 27 55, 37 55, 41 54 C 47 52, 47 42, 43 36 Z"
              fill="url(#crookshanksOrange3D)"
              stroke="#c2410c"
              strokeWidth="1.2"
            />
            <ellipse cx="32" cy="45" rx="7" ry="6" fill="#fff7ed" />
            <ellipse cx="26" cy="54.5" rx="3.5" ry="2.2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />
            <ellipse cx="38" cy="54.5" rx="3.5" ry="2.2" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.8" />

            {/* Blue Collar with Golden "GOOSE" Medal Tag */}
            <rect x="22" y="38" width="20" height="3.5" rx="1.5" fill="#1e3a8a" stroke="#0f172a" strokeWidth="0.6" />
            <circle cx="32" cy="41.5" r="2.2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
            <text x="32" y="42.5" fontSize="2.2" textAnchor="middle" fill="#78350f" fontWeight="bold">G</text>

            {/* Ears with Pink Inner Tufts */}
            <polygon points="18,19 12,8 24,15" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />
            <polygon points="16,16 13,10 20,14" fill="#fbcfe8" />
            <polygon points="46,19 52,8 40,15" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />
            <polygon points="48,16 51,10 44,14" fill="#fbcfe8" />

            {/* Cat Head & Tabby Markings */}
            <ellipse cx="32" cy="27" rx="16" ry="13" fill="url(#crookshanksOrange3D)" stroke="#c2410c" strokeWidth="1.2" />
            <path d="M 32 16 L 32 20 M 28 17 L 29 21 M 36 17 L 35 21" stroke="#c2410c" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="32" cy="32.5" rx="8.5" ry="5.5" fill="#fff7ed" />

            {/* Big Expressive Amber-Hazel Kitten Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <path d="M 21 27 Q 24 30 27 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 37 27 Q 40 31 43 27" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="24" cy="26" rx="3.5" ry="4.5" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
                <ellipse cx="24" cy="26" rx="2" ry="3.5" fill="#0f172a" />
                <circle cx="23" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="25" cy="28" r="0.7" fill="#ffffff" />

                <ellipse cx="40" cy="26" rx="3.5" ry="4.5" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
                <ellipse cx="40" cy="26" rx="2" ry="3.5" fill="#0f172a" />
                <circle cx="39" cy="24.5" r="1.3" fill="#ffffff" />
                <circle cx="41" cy="28" r="0.7" fill="#ffffff" />
              </>
            )}

            {/* Pink Nose & Cute Kitten Mouth */}
            <polygon points="31,30.5 33,30.5 32,32" fill="#f43f5e" />
            <path d="M 29.5 33 Q 31 35 32 33 Q 33 35 34.5 33" fill="none" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="18" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.85" />
            <ellipse cx="46" cy="31.5" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.85" />
          </g>
        )}

        {/* 26. ROCKET (MARVEL RACCOON - CHIBI SPACE GUARDIAN) */}
        {species === 'rocket' && (
          <g id="species-rocket">
            {/* Bushy Ring-Striped Tail with Dark Rings */}
            <path d="M 42 46 C 54 44, 58 32, 52 24 C 49 21, 46 23, 47 26 C 50 32, 48 42, 40 44 Z" fill="url(#rocketGrey3D)" stroke="#334155" strokeWidth="1.2" />
            <path d="M 46 39 L 51 36 M 48 33 L 53 30 M 49 27 L 53 25" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />

            {/* Raccoon Body & Orange Ravager Flight Suit */}
            <path
              d="M 21 36 C 17 42, 17 52, 23 54 C 27 55, 37 55, 41 54 C 47 52, 47 42, 43 36 Z"
              fill="#ea580c"
              stroke="#c2410c"
              strokeWidth="1.2"
            />
            {/* Tactical Vest Straps & Silver Buckle */}
            <rect x="25" y="42" width="14" height="4" fill="#334155" />
            <rect x="30.5" y="42.5" width="3" height="3" fill="#cbd5e1" rx="0.5" />
            <ellipse cx="26" cy="54.5" rx="3.5" ry="2.2" fill="#0f172a" />
            <ellipse cx="38" cy="54.5" rx="3.5" ry="2.2" fill="#0f172a" />

            {/* Round Fluffy Raccoon Ears with White Rims */}
            <circle cx="18" cy="18" r="4.8" fill="url(#rocketGrey3D)" stroke="#334155" strokeWidth="1.2" />
            <circle cx="18" cy="18" r="2.2" fill="#fbcfe8" />
            <circle cx="46" cy="18" r="4.8" fill="url(#rocketGrey3D)" stroke="#334155" strokeWidth="1.2" />
            <circle cx="46" cy="18" r="2.2" fill="#fbcfe8" />

            {/* Fluffy Raccoon Head */}
            <ellipse cx="32" cy="27" rx="16" ry="12.5" fill="url(#rocketGrey3D)" stroke="#334155" strokeWidth="1.2" />

            {/* Iconic Dark Bandit Eye Mask Across Face */}
            <path d="M 16 24 Q 32 27 48 24 L 46 29 Q 32 33 18 29 Z" fill="#0f172a" />
            {/* White Eyebrow & Whiskers Fur Tufts */}
            <path d="M 20 22 Q 25 21 27 23 M 44 22 Q 39 21 37 23" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="17,28 23,33 22,25" fill="#f8fafc" />
            <polygon points="47,28 41,33 42,25" fill="#f8fafc" />

            {/* Sparkling Hazel-Amber Anime Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <line x1="22" y1="27" x2="27" y2="27" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <line x1="37" y1="27" x2="42" y2="27" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="27" rx="2.8" ry="3.5" fill="#f59e0b" />
                <ellipse cx="25" cy="27" rx="1.6" ry="2.6" fill="#0f172a" />
                <circle cx="24.2" cy="25.8" r="1" fill="#ffffff" />
                <circle cx="25.8" cy="28.2" r="0.5" fill="#ffffff" />

                <ellipse cx="39" cy="27" rx="2.8" ry="3.5" fill="#f59e0b" />
                <ellipse cx="39" cy="27" rx="1.6" ry="2.6" fill="#0f172a" />
                <circle cx="38.2" cy="25.8" r="1" fill="#ffffff" />
                <circle cx="39.8" cy="28.2" r="0.5" fill="#ffffff" />
              </>
            )}

            {/* White Muzzle & Button Nose with Smirk & Tiny Fang */}
            <ellipse cx="32" cy="32.2" rx="5.5" ry="3.8" fill="#ffffff" />
            <ellipse cx="32" cy="30.5" rx="2" ry="1.4" fill="#0f172a" />
            <path d="M 30 33 Q 32 35 34.5 33" fill="none" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
            <polygon points="33,33 34,34.5 35,33" fill="#ffffff" />
          </g>
        )}

        {/* 27. ALLIGATOR LOKI (MARVEL LOKI - REPTILIAN CHIBI PRINCE) */}
        {species === 'alligator_loki' && (
          <g id="species-alligator-loki">
            {/* Magnificent Golden Loki Crown with Curved Horns */}
            <path d="M 25 18 C 20 12, 11 4, 7 1 C 12 3, 23 10, 28 17 Z" fill="url(#lokiGold3D)" stroke="#a16207" strokeWidth="1" />
            <path d="M 39 18 C 44 12, 53 4, 57 1 C 52 3, 41 10, 36 17 Z" fill="url(#lokiGold3D)" stroke="#a16207" strokeWidth="1" />
            <rect x="21" y="15.5" width="22" height="5" rx="1.8" fill="url(#lokiGold3D)" stroke="#a16207" strokeWidth="1" />
            <circle cx="32" cy="18" r="1.3" fill="#15803d" />

            {/* Emerald Green Alligator Body with Scuted Tail */}
            <path
              d="M 21 36 C 17 42, 17 52, 23 54 C 27 55, 37 55, 41 54 C 47 52, 47 42, 43 36 Z"
              fill="url(#lokiGreen3D)"
              stroke="#14532d"
              strokeWidth="1.2"
            />
            {/* Pale Lime Belly */}
            <ellipse cx="32" cy="45" rx="7.5" ry="6" fill="#dcfce7" />

            {/* Curved Scuted Tail with Dragon Ridge Scales */}
            <path d="M 41 46 Q 53 48 55 41" fill="none" stroke="url(#lokiGreen3D)" strokeWidth="4" strokeLinecap="round" />
            <polygon points="45,43 47,40 49,43" fill="#14532d" />
            <polygon points="50,42 52,38 54,41" fill="#14532d" />

            {/* Webbed Claw Feet */}
            <ellipse cx="24" cy="54.5" rx="4.2" ry="2.2" fill="#15803d" stroke="#14532d" strokeWidth="0.8" />
            <ellipse cx="40" cy="54.5" rx="4.2" ry="2.2" fill="#15803d" stroke="#14532d" strokeWidth="0.8" />

            {/* Broad Smiling Alligator Head & Snout */}
            <ellipse cx="32" cy="28" rx="17" ry="11.5" fill="url(#lokiGreen3D)" stroke="#14532d" strokeWidth="1.2" />

            {/* Broad Cute Snout Line & Nostrils */}
            <path d="M 23 33 Q 32 37.5 41 33" fill="none" stroke="#14532d" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="28" cy="33.5" r="0.8" fill="#14532d" />
            <circle cx="36" cy="33.5" r="0.8" fill="#14532d" />
            {/* Tiny Cute White Teeth Peeking Out */}
            <polygon points="26,33 27,34.5 28,33" fill="#ffffff" />
            <polygon points="36,33 37,34.5 38,33" fill="#ffffff" />

            {/* Golden Reptilian Slit Eyes with Glossy Highlights */}
            {effectiveState === 'sleep' ? (
              <>
                <line x1="23" y1="24.5" x2="28" y2="24.5" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="36" y1="24.5" x2="41" y2="24.5" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="26" cy="24" r="3.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <line x1="26" y1="20.8" x2="26" y2="27.2" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="24.8" cy="22.5" r="0.8" fill="#ffffff" />

                <circle cx="38" cy="24" r="3.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <line x1="38" y1="20.8" x2="38" y2="27.2" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="36.8" cy="22.5" r="0.8" fill="#ffffff" />
              </>
            )}

            {/* Rosy Blush on Green Cheeks */}
            <ellipse cx="19" cy="30" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.75" />
            <ellipse cx="45" cy="30" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.75" />
          </g>
        )}

        {/* 28. ICE DRAGON (RỒNG BĂNG TUYẾT - CHIBI FROST WYRM) */}
        {species === 'ice_dragon' && (
          <g id="species-ice-dragon">
            {/* Dragon Wings with Icy Spine Spikes */}
            <path
              d="M 20 36 C 8 28, 2 35, 4 45 C 10 44, 16 41, 20 40 Z"
              fill="#7dd3fc"
              stroke="#0284c7"
              strokeWidth="1"
            />
            <path
              d="M 44 36 C 56 28, 62 35, 60 45 C 54 44, 48 41, 44 40 Z"
              fill="#7dd3fc"
              stroke="#0284c7"
              strokeWidth="1"
            />
            {/* Ice Crystal Horns */}
            <path d="M 22 20 L 14 8 L 22 14 Z" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
            <path d="M 42 20 L 50 8 L 42 14 Z" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
            <polygon points="32,10 29,15 35,15" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" />

            {/* Dragon Body */}
            <path
              d="M 21 34 C 17 40, 17 50, 23 54 C 27 55, 37 55, 41 54 C 47 50, 47 40, 43 34 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="1.2"
            />
            {/* Pale Frost Belly with Ice Rune Scales */}
            <ellipse cx="32" cy="45" rx="7.5" ry="6" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="0.8" />
            <path d="M 29 43 Q 32 46 35 43" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
            <path d="M 29 47 Q 32 50 35 47" fill="none" stroke="#38bdf8" strokeWidth="0.8" />

            {/* Dragon Tail with Ice Spines */}
            <path d="M 41 47 Q 54 49 57 41" fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
            <polygon points="46,43 48,39 50,43" fill="#0284c7" />
            <polygon points="51,41 53,37 55,41" fill="#0284c7" />
            <polygon points="56,39 59,34 57,41" fill="#7dd3fc" stroke="#0284c7" strokeWidth="0.6" />

            {/* Dragon Paws */}
            <ellipse cx="24" cy="54" rx="4" ry="2.2" fill="#0284c7" />
            <ellipse cx="40" cy="54" rx="4" ry="2.2" fill="#0284c7" />

            {/* Chubby Dragon Head */}
            <ellipse cx="32" cy="27" rx="16" ry="11" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />

            {/* Cute Snout & Tiny Frost Breaths */}
            <ellipse cx="32" cy="33" rx="7" ry="4.5" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" />
            <circle cx="29.5" cy="32.5" r="0.9" fill="#0369a1" />
            <circle cx="34.5" cy="32.5" r="0.9" fill="#0369a1" />
            <path d="M 30 34.5 Q 32 36.5 34 34.5" fill="none" stroke="#0369a1" strokeWidth="1" strokeLinecap="round" />

            {/* Eyes */}
            {effectiveState === 'sleep' ? (
              <>
                <line x1="23" y1="24" x2="28" y2="24" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="36" y1="24" x2="41" y2="24" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="26" cy="24" r="3.6" fill="#0284c7" />
                <circle cx="25" cy="23" r="1.3" fill="#ffffff" />
                <circle cx="38" cy="24" r="3.6" fill="#0284c7" />
                <circle cx="37" cy="23" r="1.3" fill="#ffffff" />
              </>
            )}

            {/* Rosy Icy Cheeks */}
            <ellipse cx="20" cy="29" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
            <ellipse cx="44" cy="29" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.8" />
          </g>
        )}
      
        {/* ========================================================================= */}
        {/* LỚP 3: TRANG PHỤC THÚ CƯNG (EQUIPPED OUTFITS - ÔM SÁT THÂN VỪA KHÍT 64x64) */}
        {/* ========================================================================= */}
        {outfitFit?.clip && (
          <clipPath id={outfitClipId}>
            <ellipse
              cx={outfitFit.clip.cx}
              cy={outfitFit.clip.cy}
              rx={outfitFit.clip.rx}
              ry={outfitFit.clip.ry}
            />
          </clipPath>
        )}
        <g
          clipPath={outfitFit?.clip ? `url(#${outfitClipId})` : undefined}
          transform={outfitTransform}
        >
        {equippedOutfit === 'dev_hoodie' && (
          <g id="outfit-dev-hoodie">
            {/* Cozy Green IT Tech Hoodie */}
            <path d="M 23 38.5 Q 32 41.5 41 38.5 L 43 43 Q 32 46 21 43 Z" fill="#047857" stroke="#065f46" strokeWidth="1" />
            <path d="M 21 42 L 43 42 L 44 53 L 20 53 Z" fill="#059669" stroke="#047857" strokeWidth="1.2" />
            <path d="M 25 47 L 39 47 L 40 52 L 24 52 Z" fill="#047857" stroke="#065f46" strokeWidth="0.8" />
            <line x1="28" y1="39" x2="28" y2="44" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
            <line x1="36" y1="39" x2="36" y2="44" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {equippedOutfit === 'farmer_overalls' && (
          <g id="outfit-farmer-overalls">
            {/* Denim Overalls with Suspenders */}
            <path d="M 20 38.5 L 44 38.5 L 44 43 L 20 43 Z" fill="#facc15" />
            <path d="M 24 41.5 L 40 41.5 L 44 53 L 20 53 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.2" />
            <line x1="25" y1="38.5" x2="25" y2="44" stroke="#1d4ed8" strokeWidth="2.5" />
            <circle cx="25" cy="43.5" r="1.3" fill="#facc15" />
            <line x1="39" y1="38.5" x2="39" y2="44" stroke="#1d4ed8" strokeWidth="2.5" />
            <circle cx="39" cy="43.5" r="1.3" fill="#facc15" />
            <rect x="28" y="44" width="8" height="5" rx="1" fill="#1d4ed8" />
          </g>
        )}

        {equippedOutfit === 'business_suit' && (
          <g id="outfit-business-suit">
            {/* Sharp Business Suit Jacket */}
            <path d="M 21 38.5 L 43 38.5 L 44 53 L 20 53 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
            <polygon points="28,38.5 36,38.5 32,46" fill="#ffffff" />
            <polygon points="31,40 33,40 33.5,48 32,50 30.5,48" fill="#dc2626" />
            <circle cx="32" cy="51" r="0.8" fill="#cbd5e1" />
          </g>
        )}

        {equippedOutfit === 'master_gi' && (
          <g id="outfit-master-gi">
            {/* Karate Black Belt Gi */}
            <path d="M 21 38.5 L 43 38.5 L 44 53 L 20 53 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1="24" y1="38.5" x2="36" y2="46" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="40" y1="38.5" x2="28" y2="46" stroke="#94a3b8" strokeWidth="1.2" />
            <rect x="21" y="46.5" width="22" height="3" fill="#0f172a" />
            <rect x="30" y="45.5" width="4" height="4" rx="0.5" fill="#0f172a" />
            <path d="M 31 49.5 L 29 54 M 33 49.5 L 34 54" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        )}

        {equippedOutfit === 'cozy_scarf' && (
          <g id="outfit-cozy-scarf">
            {/* Chunky Winter Knit Scarf */}
            <rect x="20" y="38" width="24" height="5.5" rx="2.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <rect x="25" y="42" width="6" height="9" rx="1.5" fill="#dc2626" stroke="#b91c1c" strokeWidth="0.8" />
            <line x1="26" y1="50" x2="26" y2="52" stroke="#b91c1c" strokeWidth="1" />
            <line x1="28" y1="50" x2="28" y2="52" stroke="#b91c1c" strokeWidth="1" />
            <line x1="30" y1="50" x2="30" y2="52" stroke="#b91c1c" strokeWidth="1" />
          </g>
        )}

        {equippedOutfit === 'akatsuki_cloak' && (
          <g id="outfit-akatsuki-cloak">
            {/* Akatsuki Black Cloak with Red Cloud */}
            <path d="M 20 38.5 L 44 38.5 L 45 53 L 19 53 Z" fill="#09090b" stroke="#27272a" strokeWidth="1.2" />
            <polygon points="26,38.5 32,44 38,38.5" fill="#dc2626" />
            <path d="M 29 45 C 27 44, 27 42, 29 42 C 30 40.5, 33 40.5, 34 42 C 36 41, 37 42.5, 36.5 44 C 37.5 45, 36.5 47, 35 47 C 33.5 47.5, 30.5 47.5, 29 45 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="0.7" />
          </g>
        )}

        {equippedOutfit === 'gryffindor_robe' && (
          <g id="outfit-gryffindor-robe">
            {/* Hogwarts Gryffindor Robe */}
            <path d="M 21 38 L 43 38 L 44 53 L 20 53 Z" fill="#18181b" stroke="#09090b" strokeWidth="1.2" />
            <rect x="23" y="37" width="18" height="4.5" rx="1.5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.6" />
            <line x1="27" y1="37" x2="27" y2="41.5" stroke="#facc15" strokeWidth="2" />
            <line x1="33" y1="37" x2="33" y2="41.5" stroke="#facc15" strokeWidth="2" />
            <circle cx="26" cy="45" r="2.2" fill="#b91c1c" stroke="#facc15" strokeWidth="0.6" />
          </g>
        )}

        {equippedOutfit === 'stark_nano_armor' && (
          <g id="outfit-stark-nano-armor">
            {/* Iron Man Nano Chest Armor */}
            <path d="M 21 38 L 43 38 L 44 53 L 20 53 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.2" />
            <rect x="21" y="40" width="3" height="9" fill="#f59e0b" />
            <rect x="40" y="40" width="3" height="9" fill="#f59e0b" />
            <circle cx="32" cy="45" r="3.2" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
            <circle cx="32" cy="45" r="1.6" fill="#e0f2fe" />
          </g>
        )}

        {equippedOutfit === 'doraemon_pocket' && (
          <g id="outfit-doraemon-pocket">
            {/* Doraemon 4D Pocket on Belly */}
            <path d="M 24 43 Q 32 43 40 43 C 40 51.5, 24 51.5, 24 43 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1="26" y1="44" x2="38" y2="44" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {equippedOutfit === 'festival_kimono' && (
          <g id="outfit-festival-kimono">
            {/* Japanese Matsuri Kimono */}
            <path d="M 21 38 L 43 38 L 44 53 L 20 53 Z" fill="#fb7185" stroke="#e11d48" strokeWidth="1.2" />
            <line x1="24" y1="38" x2="35" y2="45" stroke="#be123c" strokeWidth="1" />
            <line x1="40" y1="38" x2="29" y2="45" stroke="#be123c" strokeWidth="1" />
            <rect x="21" y="45" width="22" height="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <rect x="30" y="44.5" width="4" height="5.5" rx="1" fill="#dc2626" />
          </g>
        )}

        {equippedOutfit === 'helloworld_tshirt' && (
          <g id="outfit-helloworld-tshirt">
            {/* Developer Hello World Tee */}
            <path d="M 21 38 L 43 38 L 44 53 L 20 53 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
            <ellipse cx="32" cy="38.5" rx="6" ry="1.8" fill="#334155" />
            <rect x="25" y="43" width="14" height="6" rx="1.5" fill="#0f172a" stroke="#0ea5e9" strokeWidth="0.8" />
            <text x="32" y="47.5" textAnchor="middle" fill="#38bdf8" fontSize="4.2" fontWeight="bold" fontFamily="monospace">{'<dev/>'}</text>
          </g>
        )}

        {equippedOutfit === 'super_saiyan_gi' && (
          <g id="outfit-super-saiyan-gi">
            {/* Goku Kame Sen-nin Dogi */}
            <path d="M 21 38 L 43 38 L 44 53 L 20 53 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="1.2" />
            <polygon points="27,38 37,38 32,44" fill="#1d4ed8" />
            <rect x="21" y="47" width="22" height="3" fill="#1e3a8a" />
            <circle cx="27" cy="43" r="2.8" fill="#ffffff" stroke="#0f172a" strokeWidth="0.6" />
            <circle cx="27" cy="43" r="1.4" fill="none" stroke="#0f172a" strokeWidth="0.6" />
          </g>
        )}

        {equippedOutfit === 'detective_trenchcoat' && (
          <g id="outfit-detective-trenchcoat">
            {/* Conan Detective Trenchcoat */}
            <path d="M 20 38 L 44 38 L 45 54 L 19 54 Z" fill="#d97706" stroke="#b45309" strokeWidth="1.2" />
            <polygon points="23,38 21,45 27,44" fill="#b45309" />
            <polygon points="41,38 43,45 37,44" fill="#b45309" />
            <polygon points="29,39 31,41.5 29,44 35,44 33,41.5 35,39" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.6" />
            <circle cx="32" cy="41.5" r="1.1" fill="#ef4444" />
            <circle cx="28" cy="48" r="0.8" fill="#78350f" />
            <circle cx="36" cy="48" r="0.8" fill="#78350f" />
          </g>
        )}
        </g>
        </g>

        {/* ========================================================================= */}
        {/* LỚP 4: PHỤ KIỆN PHÍA TRƯỚC (EQUIPPED ACCESSORIES - MẮT KÍNH, CHUÔNG, VŨ KHÍ) */}
        {/* ========================================================================= */}
        {equippedAccessory === 'smart_glasses' && (
          <g id="acc-smart-glasses" transform={glassesTransform}>
            <line x1="18" y1="18.5" x2="22.5" y2="18.5" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="41.5" y1="18.5" x2="46" y2="18.5" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
            {/* Left Lens */}
            <circle cx="26" cy="18.5" r="3.6" fill="rgba(224, 242, 254, 0.3)" stroke="#0f172a" strokeWidth="1.2" />
            <line x1="24.5" y1="17" x2="26" y2="18.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
            {/* Right Lens */}
            <circle cx="38" cy="18.5" r="3.6" fill="rgba(224, 242, 254, 0.3)" stroke="#0f172a" strokeWidth="1.2" />
            <line x1="36.5" y1="17" x2="38" y2="18.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
            {/* Bridge */}
            <path d="M 29.6 18 Q 32 17 34.4 18" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {equippedAccessory === 'sunglasses' && (
          <g id="acc-sunglasses" transform={glassesTransform}>
            <path d="M 20 16 L 44 16 L 42 22 Q 38 24 35 22 L 32 19 L 29 22 Q 26 24 22 22 Z" fill="#0f172a" stroke="#020617" strokeWidth="1" strokeLinejoin="round" />
            <line x1="24" y1="17" x2="26" y2="20" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
            <line x1="38" y1="17" x2="40" y2="20" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
            {/* Temples */}
            <line x1="20" y1="17" x2="16" y2="16.5" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
            <line x1="44" y1="17" x2="48" y2="16.5" stroke="#0f172a" strokeWidth="1.1" strokeLinecap="round" />
          </g>
        )}

        {equippedAccessory === 'golden_bell' && (
          <g id="acc-golden-bell">
            <path d="M 22 38 Q 32 40.5 42 38" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="32" cy="41" r="3.2" fill="url(#bellGold3D)" stroke="#ca8a04" strokeWidth="0.8" />
            <line x1="29.5" y1="41" x2="34.5" y2="41" stroke="#854d0e" strokeWidth="0.7" />
            <circle cx="32" cy="42.2" r="0.7" fill="#854d0e" />
            <circle cx="30.8" cy="39.8" r="0.7" fill="#ffffff" />
          </g>
        )}

        {equippedAccessory === 'doraemon_bell' && (
          <g id="acc-doraemon-bell">
            <path d="M 22 38 Q 32 40.5 42 38" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32" cy="41" r="3.4" fill="url(#bellGold3D)" stroke="#ca8a04" strokeWidth="0.8" />
            <line x1="29.5" y1="41" x2="34.5" y2="41" stroke="#713f12" strokeWidth="0.7" />
            <circle cx="32" cy="42.2" r="0.7" fill="#713f12" />
            <circle cx="30.8" cy="39.8" r="0.7" fill="#ffffff" />
          </g>
        )}

        {equippedAccessory === 'pokeball_pendant' && (
          <g id="acc-pokeball-pendant">
            <path d="M 25 38 Q 32 42 39 38" fill="none" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="32" cy="43" r="3.4" fill="#ffffff" stroke="#0f172a" strokeWidth="0.8" />
            <path d="M 28.6 43 A 3.4 3.4 0 0 1 35.4 43 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="0.8" />
            <line x1="28.6" y1="43" x2="35.4" y2="43" stroke="#0f172a" strokeWidth="0.8" />
            <circle cx="32" cy="43" r="1.1" fill="#ffffff" stroke="#0f172a" strokeWidth="0.6" />
            <circle cx="32" cy="43" r="0.4" fill="#0f172a" />
          </g>
        )}

        {equippedAccessory === 'flame_ninja_scarf' && (
          <g id="acc-flame-ninja-scarf">
            {/* Front neck wrap sitting comfortably around neck */}
            <path d="M 21 37.5 Q 32 40.5 43 37.5 L 43 41 Q 32 44 21 41 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.9" />
          </g>
        )}

        {equippedAccessory === 'elder_wand' && (
          <g id="acc-elder-wand">
            <line x1="46" y1="49" x2="57" y2="29" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            <circle cx="49" cy="44" r="1.4" fill="#92400e" />
            <circle cx="52" cy="39" r="1.3" fill="#92400e" />
            <circle cx="54.5" cy="34" r="1.2" fill="#92400e" />
            <polygon points="57,26 58,28 60,29 58,30 57,32 56,30 54,29 56,28" fill="#38bdf8" />
          </g>
        )}

        {equippedAccessory === 'vibranium_shield' && (
          <g id="acc-vibranium-shield">
            <circle cx="15" cy="43" r="6.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
            <circle cx="15" cy="43" r="4.8" fill="#e2e8f0" />
            <circle cx="15" cy="43" r="3.3" fill="#dc2626" />
            <circle cx="15" cy="43" r="2" fill="#1d4ed8" />
            <polygon points="15,41.5 15.5,42.5 16.5,42.5 15.7,43.2 16,44.1 15,43.6 14,44.1 14.3,43.2 13.5,42.5 14.5,42.5" fill="#ffffff" />
          </g>
        )}

        {equippedAccessory === 'rgb_gaming_headset' && (
          <g id="acc-rgb-headset">
            <path d="M 14 18 C 14 5, 50 5, 50 18" fill="none" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
            <rect x="11" y="16" width="5" height="9" rx="2.5" fill="#06b6d4" stroke="#0891b2" strokeWidth="0.8" />
            <rect x="48" y="16" width="5" height="9" rx="2.5" fill="#ec4899" stroke="#db2777" strokeWidth="0.8" />
            <path d="M 14 22 Q 18 27 24 26" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="24" cy="26" r="1.2" fill="#22c55e" />
          </g>
        )}

        {equippedAccessory === 'zoro_bamboo_sword' && (
          <g id="acc-zoro-sword">
            <line x1="44" y1="37" x2="57" y2="52" stroke="#e2e8f0" strokeWidth="2.6" strokeLinecap="round" />
            <line x1="40" y1="32" x2="44" y2="37" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" />
            <rect x="42" y="35" width="3.5" height="3.5" rx="0.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" transform="rotate(45 44 37)" />
          </g>
        )}

        {equippedAccessory === 'infinity_gauntlet' && (
          <g id="acc-infinity-gauntlet">
            <path d="M 44 41 L 50 39 L 53 45 L 51 50 L 45 49 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <circle cx="48" cy="44" r="1.4" fill="#facc15" stroke="#ffffff" strokeWidth="0.5" />
            <circle cx="46" cy="41" r="0.8" fill="#38bdf8" />
            <circle cx="48" cy="40" r="0.8" fill="#ef4444" />
            <circle cx="50" cy="42" r="0.8" fill="#a855f7" />
            <circle cx="51" cy="45" r="0.8" fill="#22c55e" />
            <circle cx="46" cy="47" r="0.8" fill="#f97316" />
          </g>
        )}

        {equippedAccessory === 'fairy_wand' && (
          <g id="acc-fairy-wand">
            <line x1="46" y1="52" x2="55" y2="33" stroke="#f472b6" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 53 31 A 4.5 4.5 0 1 1 58 24 A 3.5 3.5 0 1 0 53 31 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="53.5" cy="32.5" r="0.8" fill="#f43f5e" />
          </g>
        )}

        {/* ========================================================================= */}
        {/* LỚP 5: MŨ & NÓN (EQUIPPED HATS - ĐỘI CAO TRÊN ĐỈNH ĐẦU y=2..14, KHÔNG CHE MẶT) */}
        {/* ========================================================================= */}
        <g transform={hatTransform}>
        {equippedHat === 'grad_cap' && (
          <g id="hat-grad-cap">
            {/* Cap Base Ring */}
            <path d="M 24 10 L 24 13 Q 32 15 40 13 L 40 10 Z" fill="#0f172a" stroke="#020617" strokeWidth="0.8" />
            {/* Diamond Mortarboard Top */}
            <polygon points="32,3 47,8 32,13 17,8" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
            <polygon points="32,4 45,8 32,12 19,8" fill="#334155" />
            <circle cx="32" cy="8" r="1.2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
            {/* Golden Tassel */}
            <path d="M 32 8 Q 44 8 44 14 L 44 18" fill="none" stroke="#facc15" strokeWidth="1" strokeLinecap="round" />
            <rect x="42.8" y="17.5" width="2.4" height="3.5" rx="0.6" fill="#eab308" />
          </g>
        )}

        {equippedHat === 'wizard_hat' && (
          <g id="hat-wizard-hat">
            {/* Brim perched gracefully on top of head */}
            <ellipse cx="32" cy="11" rx="14" ry="3.2" fill="#312e81" stroke="#1e1b4b" strokeWidth="0.9" />
            {/* Cone Top */}
            <path d="M 23 10 Q 28 3 36 0 Q 34 5 41 10 Z" fill="#3730a3" stroke="#1e1b4b" strokeWidth="1" strokeLinejoin="round" />
            <path d="M 23 10 Q 32 12.5 41 10 L 41 8.5 Q 32 11 23 8.5 Z" fill="#4338ca" />
            <rect x="29.5" y="8.5" width="5" height="2.8" rx="0.5" fill="none" stroke="#facc15" strokeWidth="0.8" />
            {/* Magic Star Emblem */}
            <polygon points="32,4 32.7,5.5 34.2,5.5 33,6.4 33.4,7.8 32,7 30.6,7.8 31,6.4 29.8,5.5 31.3,5.5" fill="#fde047" />
          </g>
        )}

        {equippedHat === 'royal_crown' && (
          <g id="hat-royal-crown">
            {/* Golden Crown Base Rim */}
            <path d="M 22 13 Q 32 15 42 13 L 42 11 Q 32 13 22 11 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.9" />
            {/* Crown Peaks */}
            <polygon points="22,12 23,6 27,9 32,3 37,9 41,6 42,12" fill="#fbbf24" stroke="#b45309" strokeWidth="0.9" strokeLinejoin="round" />
            {/* Royal Jewels */}
            <circle cx="32" cy="6" r="1.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
            <circle cx="27" cy="9.5" r="1.1" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.4" />
            <circle cx="37" cy="9.5" r="1.1" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.4" />
            <circle cx="23" cy="6" r="0.9" fill="#facc15" />
            <circle cx="41" cy="6" r="0.9" fill="#facc15" />
          </g>
        )}

        {equippedHat === 'gamer_headset' && (
          <g id="hat-gamer-headset">
            {/* Headband Arched High over Head */}
            <path d="M 14 18 C 14 5, 50 5, 50 18" fill="none" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 16 17 C 16 7, 48 7, 48 17" fill="none" stroke="#334155" strokeWidth="1.2" />
            {/* Sleek Side Earcups */}
            <rect x="11" y="16" width="5" height="9" rx="2.5" fill="#06b6d4" stroke="#0891b2" strokeWidth="0.8" />
            <circle cx="13.5" cy="20.5" r="1.6" fill="#22d3ee" />
            <rect x="48" y="16" width="5" height="9" rx="2.5" fill="#ec4899" stroke="#db2777" strokeWidth="0.8" />
            <circle cx="50.5" cy="20.5" r="1.6" fill="#f472b6" />
            {/* Jawline Mic */}
            <path d="M 14 22 Q 18 27 24 26" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="24" cy="26" r="1.2" fill="#22c55e" />
          </g>
        )}

        {equippedHat === 'cool_cap' && (
          <g id="hat-cool-cap">
            {/* Cap Dome on Crown of Head */}
            <path d="M 21 11 C 21 4, 43 4, 43 11 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="0.9" />
            {/* Front Visor */}
            <path d="M 18 11 Q 32 14.5 46 11 Q 43 15 32 15 Q 21 15 18 11 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" />
            <circle cx="32" cy="4" r="1" fill="#ffffff" />
            <polygon points="32,6 32.5,7.2 33.7,7.2 32.7,8 33.1,9.2 32,8.5 30.9,9.2 31.3,8 30.3,7.2 31.5,7.2" fill="#ffffff" />
          </g>
        )}

        {equippedHat === 'farmer_straw_hat' && (
          <g id="hat-farmer-straw-hat">
            <ellipse cx="32" cy="11" rx="16" ry="3.8" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
            <ellipse cx="32" cy="7.5" rx="9" ry="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
            <path d="M 23 9 Q 32 11 41 9 L 41 10.5 Q 32 12.5 23 10.5 Z" fill="#16a34a" />
          </g>
        )}

        {equippedHat === 'luffy_straw_hat' && (
          <g id="hat-luffy-straw-hat">
            {/* Luffy Straw Hat Brim perched above brow */}
            <ellipse cx="32" cy="11" rx="16" ry="3.8" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            {/* Straw Hat Crown */}
            <path d="M 23 9.5 C 23 3.5, 41 3.5, 41 9.5 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
            {/* Iconic Red Ribbon Band */}
            <path d="M 23 9 Q 32 11 41 9 L 41 10.5 Q 32 12.5 23 10.5 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
          </g>
        )}

        {equippedHat === 'konoha_headband' && (
          <g id="hat-konoha-headband">
            {/* Navy Blue Forehead Cloth sitting squarely at brow/forehead */}
            <path d="M 17 10 Q 32 13 47 10 L 47 14 Q 32 17 17 14 Z" fill="#1e3a8a" stroke="#172554" strokeWidth="0.8" />
            {/* Silver Metal Plate */}
            <rect x="23" y="10" width="18" height="5" rx="1.2" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
            {/* 4 Corner Rivets */}
            <circle cx="24.2" cy="11.2" r="0.5" fill="#334155" />
            <circle cx="24.2" cy="13.8" r="0.5" fill="#334155" />
            <circle cx="39.8" cy="11.2" r="0.5" fill="#334155" />
            <circle cx="39.8" cy="13.8" r="0.5" fill="#334155" />
            {/* Engraved Konoha Leaf Swirl */}
            <path d="M 32 12.5 m -1.6,0 a 1.6,1.6 0 1,1 3.2,0 a 1.6,1.6 0 0,1 -2.7 1.1 L 34 11.2" fill="none" stroke="#334155" strokeWidth="0.8" strokeLinecap="round" />
            {/* Trailing Ninja Cloth Knot at Left */}
            <path d="M 17 12 Q 11 11 8 16 Q 12 17 16 14 Z" fill="#1e3a8a" />
          </g>
        )}

        {equippedHat === 'sorting_hat' && (
          <g id="hat-sorting-hat">
            <path d="M 17 12 Q 32 9 47 12 Q 44 15 32 14 Q 20 15 17 12 Z" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <path d="M 23 11 Q 27 5 32 1 Q 38 -2 40 1 Q 37 6 41 11 Z" fill="#92400e" stroke="#451a03" strokeWidth="1" />
            <path d="M 27 7 Q 29 5 31 7" fill="none" stroke="#451a03" strokeWidth="1" strokeLinecap="round" />
            <path d="M 33 8 Q 35 6 37 8" fill="none" stroke="#451a03" strokeWidth="1" strokeLinecap="round" />
            <path d="M 28 9.5 Q 32 11 36 9.5" fill="none" stroke="#451a03" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {equippedHat === 'ironman_mask' && (
          <g id="hat-ironman-mask">
            {/* Stark Tech Nano-Visor Crown (Rests on Forehead, Leaving Eyes & Face Open) */}
            <path d="M 22 13 L 26 7 L 38 7 L 42 13 L 32 14 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.9" />
            <path d="M 26 8 L 38 8 L 36 13 L 32 14 L 28 13 Z" fill="#f59e0b" stroke="#ca8a04" strokeWidth="0.7" />
            {/* Cyan HUD Arc Eyes on Brow */}
            <rect x="28" y="9.5" width="2.8" height="1.1" rx="0.3" fill="#38bdf8" />
            <rect x="33.2" y="9.5" width="2.8" height="1.1" rx="0.3" fill="#38bdf8" />
          </g>
        )}

        {equippedHat === 'bamboo_copter' && (
          <g id="hat-bamboo-copter">
            {/* Suction Cup mounted at the top peak of the head */}
            <ellipse cx="32" cy="7.5" rx="3.5" ry="1.4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <line x1="32" y1="7.5" x2="32" y2="1.5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="1.5" r="1.3" fill="#ca8a04" />
            {/* Spinning Rotor Blades */}
            <ellipse cx="32" cy="1.5" rx="13" ry="1.6" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
            <ellipse cx="32" cy="1.5" rx="14" ry="0.8" fill="none" stroke="rgba(253, 224, 71, 0.6)" strokeWidth="0.6" strokeDasharray="3 2" />
          </g>
        )}

        {equippedHat === 'kirby_star_crown' && (
          <g id="hat-kirby-star-crown">
            <path d="M 21 13 Q 32 15 43 13 L 43 11 Q 32 13 21 11 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <polygon points="32,2 34,7 39,7 35,10 37,15 32,12 27,15 29,10 25,7 30,7" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="31" cy="6" r="0.7" fill="#ffffff" />
          </g>
        )}

        {equippedHat === 'cowboy_hat' && (
          <g id="hat-cowboy-hat">
            <path d="M 14 12 Q 18 16 32 15 Q 46 16 50 12 Q 46 10 32 11 Q 18 10 14 12 Z" fill="#92400e" stroke="#713f12" strokeWidth="0.9" />
            <path d="M 24 12 L 25 6 Q 32 9 39 6 L 40 12 Z" fill="#b45309" stroke="#713f12" strokeWidth="0.9" />
            <line x1="24.5" y1="11.5" x2="39.5" y2="11.5" stroke="#0d9488" strokeWidth="1.2" />
          </g>
        )}

        {equippedHat === 'astronaut_helmet' && (
          <g id="hat-astronaut-helmet">
            {/* Transparent Airy Crystal Bubble Helmet */}
            <ellipse cx="32" cy="18" rx="19" ry="17" fill="rgba(224, 242, 254, 0.22)" stroke="#38bdf8" strokeWidth="1.2" />
            {/* Glass Curvature Reflection */}
            <path d="M 20 8 Q 32 4 44 8" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
            <path d="M 17 18 Q 17 25 21 30" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            {/* Base Collar Ring */}
            <ellipse cx="32" cy="35" rx="16" ry="3.5" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
          </g>
        )}

        {equippedHat === 'bear_beanie' && (
          <g id="hat-bear-beanie">
            {/* Beanie Dome */}
            <path d="M 21 12 C 21 5, 43 5, 43 12 Z" fill="#78716c" stroke="#44403c" strokeWidth="1" />
            {/* Folded Cuff */}
            <rect x="20" y="10.5" width="24" height="4" rx="1.5" fill="#57534e" stroke="#44403c" strokeWidth="0.8" />
            {/* Cute Bear Ears on Beanie */}
            <circle cx="23" cy="5" r="2.8" fill="#78716c" stroke="#44403c" strokeWidth="0.8" />
            <circle cx="23" cy="5" r="1.3" fill="#d6d3d1" />
            <circle cx="41" cy="5" r="2.8" fill="#78716c" stroke="#44403c" strokeWidth="0.8" />
            <circle cx="41" cy="5" r="1.3" fill="#d6d3d1" />
          </g>
        )}

        {equippedHat === 'pikachu_cap' && (
          <g id="hat-pikachu-cap">
            {/* Yellow Cap Dome */}
            <path d="M 21 12 C 21 5, 43 5, 43 12 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
            {/* Red Visor */}
            <path d="M 19 12 Q 32 15 45 12 Q 42 15.5 32 15.5 Q 22 15.5 19 12 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
            {/* Pikachu Lightning Ears */}
            <polygon points="23,7 13,-2 19,0 27,6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <polygon points="17,1 13,-2 19,0" fill="#0f172a" />
            <polygon points="41,7 51,-2 45,0 37,6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <polygon points="47,1 51,-2 45,0" fill="#0f172a" />
          </g>
        )}

        </g>
        {/* ========================================================================= */}
        {/* LỚP 5: GỢN SÓNG NƯỚC & BỌT SÓNG PHÍA TRƯỚC KHI BƠI (FOREGROUND WATER EFFECT) */}
        {/* ========================================================================= */}
        {effectiveState === 'swim' && (
          <g className="pixel-swim-foreground-waves">
            {/* Lớp nước trong suốt phủ lên mép cắt thân dưới */}
            <path
              d="M 6 41 Q 19 44 32 41.5 Q 45 39 58 41.5 Q 45 46 32 44 Q 19 46 6 41 Z"
              fill="rgba(56, 189, 248, 0.75)"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            {/* Bọt sóng trắng chuyển động quanh mép nước */}
            <path
              d="M 10 41 Q 21 39 32 41.5 Q 43 43.5 54 41"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Giọt nước bắn tung tóe quanh thú cưng */}
            <circle cx="12" cy="37" r="1.3" fill="#bae6fd" />
            <circle cx="9" cy="39" r="0.8" fill="#ffffff" />
            <circle cx="52" cy="37" r="1.3" fill="#bae6fd" />
            <circle cx="55" cy="39" r="0.8" fill="#ffffff" />
            {/* Vòng lan tỏa sóng nước xung quanh */}
            <ellipse cx="32" cy="44" rx="22" ry="4.5" fill="none" stroke="rgba(224, 242, 254, 0.85)" strokeWidth="1" strokeDasharray="5 2.5" />
          </g>
        )}

      </svg>
    </div>
  );
}

export default React.memo(PixelPetSprite);

'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import PixelPetSprite, { PetAnimationState } from './PixelPetSprite';
import {
  DutchWindmillSVG,
  GrandOakTreeSVG,
  FarmhouseVillaSVG,
  LotusPondSVG,
  BouncyMushroomSVG,
  ChickenCoopSVG,
  VeggiePatchSVG,
  LighthouseSVG,
  PalmTreeSVG,
  BeachVolleyballSVG,
  TikiBarCabanaSVG,
  SandcastleBonfireSVG,
  SailboatWavesSVG,
  FullWidthOceanWavesSVG,
  ServerRackSVG,
  DevWorkstationSVG,
  LibraryBookshelfSVG,
  BeanbagLoungeSVG,
  EspressoBarKitchenetteSVG,
  ScrumKanbanWhiteboardSVG,
  CrystalCastleSVG,
  CelestialAngelFountainSVG,
  GemstoneTreasureChestSVG,
  RainbowBridgeArchSVG,
  StarryCloudPlatformSVG,
  // --- ANIME HABITAT ASSETS ---
  ThousandSunnyLionFigureheadSVG,
  PirateMastJollyRogerSVG,
  PirateTreasureChestSVG,
  PirateHelmAndDeckRailingSVG,
  PirateCannonAndRumBarrelsSVG,
  NamiTangerineTreesSVG,
  HokageRockMonumentSVG,
  IchirakuRamenShopSVG,
  OnsenHotSpringSVG,
  BambooToriiShrineSVG,
  NinjaTrainingPostSVG,
  FloatingCandlesGothicHallSVG,
  HogwartsGreatFireplaceSVG,
  MagicFeastTableSVG,
  SortingHatPedestalSVG,
  HogwartsHouseBannersSVG,
  DoraemonConcretePipesSVG,
  AnywhereDoorPropSVG,
  NostalgicWoodenFenceFieldSVG,
  NobitaBaseballGearSVG,
  JapaneseNeighborhoodPoleSVG,
  GiantLollipopTreeSVG,
  KirbyWarpStarSVG,
  RainbowRiverWaterfallSVG,
  WhispyWoodsAppleTreeSVG,
  StarRodMonumentSVG,
} from './PixelMapAssets';
import { sound } from '@/lib/soundFx';
import confetti from '@/lib/confetti';

export interface PixelFarmHandle {
  tossBall: () => void;
  dropTreat: () => void;
  callPet: () => void;
  toggleSleep: () => boolean;
  toggleSpeed: () => boolean;
  performMapAction: (actionKey: string) => void;
  goSwim: () => void;
  goClimb: () => void;
  goJump: () => void;
}

export interface PixelFarmGameProps {
  species: string;
  petName: string;
  habitat:
    | 'emerald_garden'
    | 'cozy_den'
    | 'sunset_beach'
    | 'sky_castle'
    | 'thousand_sunny'
    | 'konoha_valley'
    | 'hogwarts_hall'
    | 'doraemon_field'
    | 'dream_land'
    | string;
  equippedHat?: string | null;
  equippedOutfit?: string | null;
  equippedAccessory?: string | null;
  hunger?: number;
  happiness?: number;
  level?: number;
  exp?: number;
  userCoins?: number;
  onPet?: () => void;
  onFeedClick?: () => void;
  onOpenShop?: () => void;
  onOpenWardrobe?: () => void;
  onOpenHabitat?: () => void;
  onSwitchPet?: () => void;
  speechText?: string;
  onSpeechChange?: (text: string) => void;
  onStateChange?: (state: { isSleeping: boolean; isSpeedFast: boolean }) => void;
  isCouple?: boolean;
  coupleTitle?: string;
}

const PixelFarmGame = forwardRef<PixelFarmHandle, PixelFarmGameProps>(function PixelFarmGame(
  {
    species = 'owl',
    petName = 'Thú Cưng',
    habitat = 'emerald_garden',
    equippedHat,
    equippedOutfit,
    equippedAccessory,
    hunger = 80,
    happiness = 90,
    level = 1,
    exp = 0,
    userCoins = 0,
    onPet,
    onSwitchPet,
    speechText,
    onSpeechChange,
    onStateChange,
    isCouple = false,
    coupleTitle,
  },
  ref
) {
  // Pet Coordinates (% inside screen-bounded canvas: x: 8 to 92, y: 16 to 84)
  const [petPos, setPetPos] = useState({ x: 50, y: 55 });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [dayTimeMode, setDayTimeMode] = useState<'day' | 'sunset' | 'night'>('day');
  const [animState, setAnimState] = useState<PetAnimationState>(() => {
    if (typeof window === 'undefined') return 'idle';
    try {
      return localStorage.getItem('meowlish_pet_is_sleeping') === 'true' ? 'sleep' : 'idle';
    } catch {
      return 'idle';
    }
  });
  const [isSpeedFast, setIsSpeedFast] = useState(false);
  const [isSleeping, setIsSleeping] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('meowlish_pet_is_sleeping') === 'true';
    } catch {
      return false;
    }
  });

  // Click target marker
  const [targetMarker, setTargetMarker] = useState<{ x: number; y: number } | null>(null);

  // Toy ball position for Fetch minigame with 3D arc flight
  const [toyBall, setToyBall] = useState<{
    x: number;
    y: number;
    targetX?: number;
    targetY?: number;
    phase: 'flying' | 'bouncing' | 'caught';
  } | null>(null);

  // Dropped treat position
  const [droppedTreat, setDroppedTreat] = useState<{ x: number; y: number; emoji: string } | null>(null);

  // Animated micro-particles / object states
  const [butterflyPos, setButterflyPos] = useState({ x: 45, y: 30 });
  const [seagullPos, setSeagullPos] = useState({ x: 30, y: 14 });
  const [sakuraPetalPos, setSakuraPetalPos] = useState({ x: 50, y: 30 });
  const [isBouncingMushroom, setIsBouncingMushroom] = useState<boolean>(false);
  const [isBouncingBeanbag, setIsBouncingBeanbag] = useState<boolean>(false);
  const [isBouncingPipes, setIsBouncingPipes] = useState<boolean>(false);

  // Responsive scale helper: Desktop keeps 100% original size, mobile scales objects down to 0.55x
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scaleObj = (desktopScale: number) => {
    return isMobile ? +(desktopScale * 0.55).toFixed(2) : desktopScale;
  };
  const [isSunnyTreasureOpen, setIsSunnyTreasureOpen] = useState<boolean>(false);
  const [isAnywhereDoorOpen, setIsAnywhereDoorOpen] = useState<boolean>(false);
  const [isCandleLit, setIsCandleLit] = useState<boolean>(false);
  const [isWarpStarActive, setIsWarpStarActive] = useState<boolean>(false);
  const [flyingShuriken, setFlyingShuriken] = useState<{ x: number; y: number; rot: number; type: 'kunai' | 'shuriken' } | null>(null);
  const [isNinjaTargetHit, setIsNinjaTargetHit] = useState<boolean>(false);

  // ===== Sân Vườn Linh Vật: trạng thái tương tác thật cho mọi vật thể =====
  // Rương báu trên mây (sky_castle) mở nắp + vàng bay ra
  const [isSkyTreasureOpen, setIsSkyTreasureOpen] = useState<boolean>(false);
  const [treasureLoot, setTreasureLoot] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  // Máy tính dev: pet ngồi code, popup overlay gõ phím + dòng code chạy + EXP vui
  const [isCoding, setIsCoding] = useState<boolean>(false);
  const [codeLines, setCodeLines] = useState<string[]>([]);
  const [codeExp, setCodeExp] = useState<number>(0);
  // Cầu vồng: pet đi bộ dọc vòng cung / Cầu trượt mây: pet trượt từ đỉnh xuống
  const [isRainbowWalking, setIsRainbowWalking] = useState<boolean>(false);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  // Xích đu cây sồi: pet ngồi đung đưa / Ao sen: tia nước bắn / Bồn hoa: hoa nở rộ
  const [isSwinging, setIsSwinging] = useState<boolean>(false);
  const [pondSplashId, setPondSplashId] = useState<number>(0);
  const [bloomId, setBloomId] = useState<number>(0);
  const [windGustId, setWindGustId] = useState<number>(0);

  // ===== Juice FX layer (game-feel-juice): one-shot particles + object ticks =====
  // fx: mảng particle dùng chung mọi habitat — transform/opacity only, tự dọn,
  // cap 40, replay ngay. objPulse: tick anticipation HIỆN NGAY khi click (≤200ms).
  // objHit: rung vật thể tại frame tiếp xúc (contact frame).
  interface FxBit { id: number; x: number; y: number; emoji: string; cls: string; delay?: number }
  const [fx, setFx] = useState<FxBit[]>([]);
  const [objPulse, setObjPulse] = useState<{ key: string; id: number } | null>(null);
  const [objHit, setObjHit] = useState<{ key: string; id: number } | null>(null);
  const fxIdRef = useRef(0);
  const fxTimersRef = useRef<number[]>([]);
  const touchTapRef = useRef(0);
  // Timer KHÔNG gắn generation: chỉ dọn particle/pulse, không chạm pet/timers action.
  const fxLater = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      fxTimersRef.current = fxTimersRef.current.filter((x) => x !== id);
      fn();
    }, ms);
    fxTimersRef.current.push(id);
  };
  const spawnFx = (items: { x: number; y: number; emoji: string; cls: string; delay?: number }[], ttlMs: number) => {
    const batch: FxBit[] = items.map((it) => ({ ...it, id: (fxIdRef.current += 1) }));
    setFx((prev) => [...prev, ...batch].slice(-40));
    fxLater(() => {
      setFx((prev) => prev.filter((f) => !batch.some((b) => b.id === f.id)));
    }, ttlMs);
  };
  const fxJitter = (cx: number, cy: number, spreadX = 5, up = 3) => ({
    x: cx + (Math.random() * spreadX * 2 - spreadX),
    y: cy - Math.random() * up,
  });
  // Sóng gợn 3 vòng (ao / suối / đài phun) — delay so le 180ms
  const fxRings = (cx: number, cy: number) => {
    spawnFx([0, 1, 2].map((i) => ({ x: cx, y: cy, emoji: '', cls: 'fx-ring', delay: i * 180 })), 2000);
  };
  // Rơi + nảy + mờ (táo / dừa / cam rụng khi rung cây)
  const fxDropLoot = (cx: number, cy: number, emojis: string[]) => {
    spawnFx(emojis.map((emoji) => ({ ...fxJitter(cx, cy, 5, 3), emoji, cls: 'fx-drop' })), 1700);
  };
  // Bay lên + mờ (cánh hoa / hơi nước / tia bắn / nốt nhạc)
  const fxFloatUp = (cx: number, cy: number, emojis: string[]) => {
    spawnFx(emojis.map((emoji) => ({ ...fxJitter(cx, cy, 6, 4), emoji, cls: 'fx-float' })), 1600);
  };
  // Nảy nở + settle (trứng / cà rốt / bóng / sao)
  const fxPop = (cx: number, cy: number, emojis: string[]) => {
    spawnFx(emojis.map((emoji) => ({ ...fxJitter(cx, cy, 4, 2), emoji, cls: 'fx-pop' })), 2000);
  };
  // Vệt gió / xoáy cổng (trôi ngang + mờ)
  const fxDrift = (cx: number, cy: number, emojis: string[]) => {
    spawnFx(emojis.map((emoji) => ({ ...fxJitter(cx, cy, 3, 6), emoji, cls: 'fx-drift' })), 1400);
  };
  // Vàng bay vòng cung (mở rương / bắn đại bác)
  const fxArc = (cx: number, cy: number, emojis: string[]) => {
    spawnFx(emojis.map((emoji) => ({ ...fxJitter(cx, cy, 7, 2), emoji, cls: 'fx-arc' })), 1500);
  };
  // Rung vật thể tại contact frame (kèm tick âm thanh chạm)
  const fxHitObject = (key: string) => {
    const id = Date.now() + Math.random();
    setObjHit({ key, id });
    fxLater(() => {
      setObjHit((prev) => (prev && prev.id === id ? null : prev));
    }, 650);
  };

  // Floating hearts when petted
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Speech bubble
  const [currentSpeech, setCurrentSpeech] = useState<string>(speechText || `Chào bạn! Mình là ${petName}!`);

  const containerRef = useRef<HTMLDivElement>(null);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef(false);
  // Generation counter: mỗi hành động mới tăng gen; timer cũ sai gen thì bỏ qua.
  // Chặn stale timer bắn muộn (teleport/bounce nhầm vật thể) khi spam click.
  const actionGenRef = useRef(0);
  const actionTimersRef = useRef<number[]>([]);
  const petPosRef = useRef(petPos);
  useEffect(() => {
    petPosRef.current = petPos;
  }, [petPos]);
  const clearActionTimers = () => {
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    actionTimersRef.current.forEach((id) => clearTimeout(id));
    actionTimersRef.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    const g = actionGenRef.current;
    const id = window.setTimeout(() => {
      actionTimersRef.current = actionTimersRef.current.filter((x) => x !== id);
      if (actionGenRef.current !== g) return;
      fn();
    }, ms);
    actionTimersRef.current.push(id);
    return id;
  };
  const resetTransientStates = () => {
    setIsSwinging(false);
    setIsSliding(false);
    setIsRainbowWalking(false);
    setIsBouncingMushroom(false);
    setIsBouncingBeanbag(false);
    setIsBouncingPipes(false);
    setIsWarpStarActive(false);
    setIsCoding(false);
    setFlyingShuriken(null);
    setIsNinjaTargetHit(false);
    setIsSkyTreasureOpen(false);
    setIsSunnyTreasureOpen(false);
    setIsAnywhereDoorOpen(false);
    setIsCandleLit(false);
    setPondSplashId(0);
    setBloomId(0);
    setWindGustId(0);
  };
  const beginNewAction = () => {
    actionGenRef.current += 1;
    clearActionTimers();
    resetTransientStates();
    isInteractingRef.current = true;
  };
  // Đổi habitat: hủy toàn bộ timer/action cũ để không còn animation rớt lại sai map.
  useEffect(() => {
    actionGenRef.current += 1;
    clearActionTimers();
    resetTransientStates();
    isInteractingRef.current = false;
    setFx([]);
    setObjPulse(null);
    setObjHit(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitat]);

  // y-sorting-depth: thứ tự vẽ theo CHÂN vật (feet Y), tiebreak ổn định theo DOM.
  // Band 5..26 (dưới pet z-40) để pet luôn đọc được khi tương tác; phối cảnh bù bằng depth-scale.
  const EMERALD_FEET_Z = { windmill: 5, oak: 6, coop: 8, mushroom: 10, villa: 14, flower: 25, pond: 26 } as const;
  // 2.5D depth-scale: pet xa (y nhỏ) nhỏ lại, gần (y lớn) to ra — bù cho việc pet luôn vẽ trước cảnh.
  const petDepthScale = 0.92 + (Math.min(84, Math.max(16, petPos.y)) / 84) * 0.14;
  // billboard-sprites: kẹp speech bubble trong arena (không tràn mép khi pet sát biên).
  // Dùng CSS `translate` (Tailwind v4 cũng dùng prop này) để cộng hưởng với keyframe bounce (dùng `transform`).
  const speechShift = petPos.x < 20 ? '-12% 0' : petPos.x > 80 ? '-88% 0' : '-50% 0';
  const speechTailLeft = petPos.x < 20 ? '12%' : petPos.x > 80 ? '88%' : '50%';

  // Synchronize external speech prop
  useEffect(() => {
    if (speechText) {
      setCurrentSpeech(speechText);
    }
  }, [speechText]);

  // Cleanup confetti and movement timer on unmount
  useEffect(() => {
    return () => {
      confetti.reset();
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      actionTimersRef.current.forEach((id) => clearTimeout(id));
      actionTimersRef.current = [];
      fxTimersRef.current.forEach((id) => clearTimeout(id));
      fxTimersRef.current = [];
      actionGenRef.current += 1;
    };
  }, []);

  // Ambient Butterfly fluttering loop (Emerald Farm)
  useEffect(() => {
    if (habitat !== 'emerald_garden') return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setButterflyPos({
        x: 25 + Math.random() * 50,
        y: 20 + Math.random() * 40,
      });
    }, 3800);
    return () => clearInterval(interval);
  }, [habitat]);

  // Ambient Seagulls / Ocean breeze loop (Sunset Beach & Sunny)
  useEffect(() => {
    if (habitat !== 'sunset_beach' && habitat !== 'thousand_sunny') return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setSeagullPos({
        x: 15 + Math.random() * 70,
        y: 8 + Math.random() * 20,
      });
    }, 4200);
    return () => clearInterval(interval);
  }, [habitat]);

  // Ambient Sakura Petals loop (Konoha Valley)
  useEffect(() => {
    if (habitat !== 'konoha_valley') return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setSakuraPetalPos({
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 60,
      });
    }, 3200);
    return () => clearInterval(interval);
  }, [habitat]);

  // Detect which environmental zone coordinates fall into for currently active habitat
  const getZoneAt = (x: number, y: number) => {
    if (habitat === 'emerald_garden') {
      if (x >= 70 && y >= 68) return 'water'; // Lotus Pond
      if (x >= 80 && y <= 35) return 'climb'; // Oak Tree
      if (x >= 70 && x <= 82 && y >= 38 && y <= 52) return 'jump'; // Trampoline
      return 'land';
    }
    if (habitat === 'sunset_beach') {
      if (y <= 32) return 'water'; // Ocean waves
      if (x >= 78 && y <= 35) return 'climb'; // Palm tree
      if (x >= 42 && x <= 58 && y >= 46 && y <= 62) return 'jump'; // Volleyball net
      return 'land';
    }
    if (habitat === 'cozy_den') {
      if (x <= 30 && y >= 65) return 'jump'; // Beanbag couch
      if (x <= 26 && y <= 40) return 'climb'; // Bookshelf ladder
      return 'land';
    }
    if (habitat === 'sky_castle') {
      if (x <= 32 && y >= 65) return 'water'; // Celestial Fountain
      if (x >= 42 && x <= 58 && y <= 35) return 'climb'; // Cloud stairs
      if (x >= 60 && y <= 46) return 'jump'; // Rainbow arch
      return 'land';
    }
    if (habitat === 'thousand_sunny') {
      if (y <= 24 || y >= 82 || x <= 14) return 'water'; // Deep blue ocean surrounding deck
      if (x >= 40 && x <= 60 && y <= 38) return 'climb'; // Main mast rigging ladder
      if (x >= 74 && y >= 64) return 'jump'; // Sunny lion head prow
      return 'land';
    }
    if (habitat === 'konoha_valley') {
      if (x >= 68 && y >= 68) return 'water'; // Onsen thermal hot spring pool
      if (y <= 32) return 'climb'; // Hokage mountain rock
      if (x <= 32 && y >= 68) return 'jump'; // Ninja training target post
      return 'land';
    }
    if (habitat === 'hogwarts_hall') {
      if (y <= 32) return 'climb'; // Gothic arches & floating candle tier
      if (x <= 32 && y >= 66) return 'jump'; // Sorting hat stool / banquet bench
      return 'land';
    }
    if (habitat === 'doraemon_field') {
      if (x <= 25 && y >= 75) return 'water'; // Grassy rain puddle
      if (x >= 75 && y <= 35) return 'climb'; // Neighborhood utility pole
      if (x >= 40 && x <= 62 && y >= 38 && y <= 62) return 'jump'; // 3 Concrete Pipes
      return 'land';
    }
    if (habitat === 'dream_land') {
      if (y >= 74 && x >= 36 && x <= 80) return 'water'; // Rainbow river stream
      if (x <= 32 && y >= 66) return 'climb'; // Whispy Woods apple tree
      if (x <= 36 && y <= 45) return 'jump'; // Golden Warp Star launchpad
      return 'land';
    }
    return 'land';
  };

  // Autonomous Roaming AI customized per habitat
  useEffect(() => {
    if (isSleeping) return;

    const startRoaming = () => {
      if (isInteractingRef.current) return;

      const roll = Math.random();

      // 55% chance to interact with a map-specific object
      if (roll < 0.55) {
        if (habitat === 'emerald_garden') {
          const attractions = [
            { x: 84, y: 80, anim: 'swim', speech: 'Bơi lội dưới hồ sen mát rượi thích quá! 🏊🪷' },
            { x: 88, y: 16, anim: 'climb', speech: 'Trèo thang lên ngọn cây đại thụ hái táo chín! 🍎🧗' },
            { x: 76, y: 42, anim: 'jump', speech: 'Boingggg! Nấm lò xo bật nhảy lên trời! 🍄🚀' },
            { x: 48, y: 44, anim: 'sniff', speech: 'Chào đàn gà con lon ton mổ thóc nha! 🐔🐣' },
            { x: 18, y: 55, anim: 'happy', speech: 'Ngắm biệt thự mái ngói đỏ ấm áp đón nắng sớm! 🏡' },
            { x: 20, y: 78, anim: 'eat', speech: 'Dâu tây và cà rốt ở luống rau ngọt lịm! 🥕🍓' },
            { x: 16, y: 28, anim: 'happy', speech: 'Cối xay gió Hà Lan đón gió mát quay tít mù! 💨' },
          ];
          const chosen = attractions[Math.floor(Math.random() * attractions.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState(getZoneAt(chosen.x, chosen.y) === 'water' ? 'swim' : 'idle'), 3000);
          });
          return;
        } else if (habitat === 'sunset_beach') {
          const beachPoi = [
            { x: 50, y: 20, anim: 'swim', speech: 'Lướt trên những con sóng biển hoàng hôn dạt dào! 🏄🌊' },
            { x: 86, y: 20, anim: 'climb', speech: 'Leo cây dừa cong vút hái dừa xiêm mát lạnh! 🌴🥥' },
            { x: 50, y: 54, anim: 'jump', speech: 'Đập bóng chuyền bãi biển qua lưới siêu ngầu! 🏐🔥' },
            { x: 84, y: 76, anim: 'eat', speech: 'Thưởng thức nước dừa ngọt lịm tại quầy Tiki Bar! 🍹' },
            { x: 18, y: 78, anim: 'happy', speech: 'Ngồi bên đống lửa trại ấm áp ngắm lâu đài cát! 🏰🔥' },
            { x: 16, y: 28, anim: 'happy', speech: 'Ngắm ngọn hải đăng xoay đèn rực rỡ trong ráng chiều! 🏮' },
          ];
          const chosen = beachPoi[Math.floor(Math.random() * beachPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        } else if (habitat === 'cozy_den') {
          const denPoi = [
            { x: 50, y: 36, anim: 'happy', speech: 'Đang gõ code fix bug trên dàn màn hình cong! 💻⚡' },
            { x: 18, y: 24, anim: 'climb', speech: 'Trèo thang thư viện lấy cuốn sách thuật toán xịn sò! 📚🧗' },
            { x: 20, y: 74, anim: 'jump', speech: 'Boing! Nhún đệm lười Beanbag êm như bông gòn! 🛋️✨' },
            { x: 82, y: 76, anim: 'eat', speech: 'Nhâm nhi tách Espresso thơm lừng & pizza nóng hổi! ☕🍕' },
            { x: 84, y: 34, anim: 'sniff', speech: 'Tủ Server Rack 42U đèn LED nhấp nháy 100% uptime! 🖲️' },
            { x: 50, y: 84, anim: 'happy', speech: 'Xem bảng Kanban Sprint 42: Tất cả task đã Done! 📋✅' },
          ];
          const chosen = denPoi[Math.floor(Math.random() * denPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        } else if (habitat === 'sky_castle') {
          const skyPoi = [
            { x: 20, y: 74, anim: 'swim', speech: 'Tắm trong đài phun sao pha lê mát rượi lấp lánh! ⛲✨' },
            { x: 50, y: 26, anim: 'climb', speech: 'Bước từng bậc thang mây bay lên đỉnh lâu đài pha lê! 🏰☁️' },
            { x: 65, y: 30, anim: 'jump', speech: 'Bật nhảy dọc cầu vồng rực rỡ bắt sao băng! 🌈⭐' },
            { x: 80, y: 74, anim: 'happy', speech: 'Mở rương báu tri thức tìm thấy những viên kim cương quý! 💎🎉' },
          ];
          const chosen = skyPoi[Math.floor(Math.random() * skyPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        } else if (habitat === 'thousand_sunny') {
          const sunnyPoi = [
            { x: 50, y: 18, anim: 'climb', speech: 'Trèo lên đài quan sát ngắm hải trình Grand Line bao la! 🔭🏴‍☠️' },
            { x: 84, y: 78, anim: 'jump', speech: 'Gomu Gomu no...! Đứng trên đầu sư tử Sunny đón gió biển! 🦁⚓' },
            { x: 50, y: 72, anim: 'happy', speech: 'Căng buồm hướng về kho báu Vua Hải Tặc One Piece! ☸️🌊' },
            { x: 18, y: 76, anim: 'eat', speech: 'Tìm thấy rương vàng đầy ắp ngọc ngà châu báu rồi! 💎💰' },
            { x: 20, y: 32, anim: 'sniff', speech: 'Khẩu đại bác sẵn sàng bảo vệ đồng đội! Uống cạn thùng Cola nào! 💥🥤' },
            { x: 82, y: 32, anim: 'eat', speech: 'Hái cam ngọt lịm từ vườn Mikan của hoa tiêu Nami! 🍊✨' },
          ];
          const chosen = sunnyPoi[Math.floor(Math.random() * sunnyPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        } else if (habitat === 'konoha_valley') {
          const konohaPoi = [
            { x: 20, y: 36, anim: 'eat', speech: 'Xì xụp... Bát mì ramen xá xíu của bác Teuchi ngon đỉnh của chóp! 🍜😋' },
            { x: 82, y: 78, anim: 'swim', speech: 'Ngâm mình trong suối Onsen nước nóng hồi phục 100% Chakra! ♨️🧘' },
            { x: 50, y: 22, anim: 'climb', speech: 'Trèo lên đỉnh đầu cụ Đệ Tứ ngắm toàn cảnh Làng Lá thanh bình! 🗿🧗' },
            { x: 20, y: 76, anim: 'jump', speech: 'Kage Bunshin no Jutsu! Phóng phi tiêu Kunai trúng ngay hồng tâm! 🎯⚡' },
            { x: 80, y: 32, anim: 'happy', speech: 'Bước qua cổng Torii đỏ, Ý chí của Lửa bùng cháy trong tim! 🍃🔥' },
          ];
          const chosen = konohaPoi[Math.floor(Math.random() * konohaPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        } else if (habitat === 'hogwarts_hall') {
          const hogwartsPoi = [
            { x: 50, y: 72, anim: 'eat', speech: 'Măm măm gà quay thơm phức và nhấp ngụm Bia Bơ ngọt ngào! 🍗🍺' },
            { x: 20, y: 74, anim: 'jump', speech: 'Nón Phân Loại: Trí tuệ xuất chúng, cộng 100 điểm cho Nhà của bạn! 🧙‍♂️🎩✨' },
            { x: 80, y: 74, anim: 'happy', speech: 'Ngọn lửa mạng Floo xanh ngọc bập bùng ấm áp quá! 🔥🟢' },
            { x: 50, y: 24, anim: 'happy', speech: 'Lumos Maxima! Hàng trăm ngọn nến bùng sáng rực rỡ trên không trung! 🕯️✨' },
            { x: 82, y: 28, anim: 'climb', speech: 'Ngắm cờ hiệu kiêu hãnh của bốn Nhà Gryffindor, Ravenclaw, Hufflepuff, Slytherin! 🦁🦅🦡🐍' },
          ];
          const chosen = hogwartsPoi[Math.floor(Math.random() * hogwartsPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        } else if (habitat === 'doraemon_field') {
          const doraemonPoi = [
            { x: 50, y: 48, anim: 'jump', speech: 'Boing! Nhảy lên đỉnh 3 ống cống bê tông đứng hát như Jaian! 🎤🧱' },
            { x: 82, y: 68, anim: 'happy', speech: 'Mở Cửa Thần Kỳ bước qua lớp học tiếng Anh ngay tức khắc! 🚪🌸' },
            { x: 42, y: 72, anim: 'sleep', speech: 'Nằm trong lòng ống cống mát rượi đọc truyện tranh Doraemon thật bình yên! 📖🐾' },
            { x: 20, y: 76, anim: 'eat', speech: 'Bánh rán Dorayaki nhân đậu đỏ ngọt lịm ngon tuyệt cú mèo! 🥞😋' },
            { x: 84, y: 28, anim: 'climb', speech: 'Gương cầu lồi phản chiếu ánh chiều tà khu phố tuổi thơ êm đềm! 🪞🌇' },
          ];
          const chosen = doraemonPoi[Math.floor(Math.random() * doraemonPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        } else if (habitat === 'dream_land') {
          const dreamPoi = [
            { x: 22, y: 42, anim: 'jump', speech: 'Cưỡi Ngôi Sao Vàng Warp Star vút bay qua dải ngân hà kỳ diệu! ⭐🚀' },
            { x: 80, y: 32, anim: 'eat', speech: 'Kẹo mút dâu xoắn 7 màu ngọt ngào tan chảy trên đầu lưỡi! 🍭🍬' },
            { x: 50, y: 78, anim: 'swim', speech: 'Tắm mát dưới dòng suối cầu vồng kẹo dẻo lung linh bọt tuyết! 🌈🏊' },
            { x: 20, y: 76, anim: 'climb', speech: 'Trèo lên cây thần Whispy Woods hái những quả táo ngôi sao may mắn! 🍎✨' },
            { x: 82, y: 76, anim: 'happy', speech: 'Trượng Sao phát sáng, ban cho bạn điều ước nói tiếng Anh lưu loát! 🪄💫' },
          ];
          const chosen = dreamPoi[Math.floor(Math.random() * dreamPoi.length)];
          walkTo(chosen.x, chosen.y, () => {
            setAnimState(chosen.anim as PetAnimationState);
            showSpeech(chosen.speech);
            later(() => setAnimState('idle'), 3000);
          });
          return;
        }
      }

      // Default: Walk around open ground
      const nextX = 18 + Math.random() * 64;
      const nextY = 32 + Math.random() * 42;
      walkTo(nextX, nextY, () => {
        setAnimState('idle');
      });
    };

    const roamingInterval = setInterval(() => {
      if (document.hidden) return;
      startRoaming();
    }, 6000 + Math.random() * 3500);
    return () => {
      clearInterval(roamingInterval);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [habitat, species, isSleeping]);

  // Smooth path movement with zone awareness (gen-aware: hủy khi action mới đè lên)
  const walkTo = (targetX: number, targetY: number, onArrival?: () => void, isFast = isSpeedFast) => {
    const zone = getZoneAt(targetX, targetY);
    const cur = petPosRef.current;
    setFacing((prev) => (targetX < cur.x ? 'left' : targetX > cur.x ? 'right' : prev));

    if (zone === 'water') {
      setAnimState('swim');
    } else if (zone === 'climb') {
      setAnimState('climb');
    } else {
      setAnimState(isFast ? 'run' : 'walk');
    }

    const dist = Math.hypot(targetX - cur.x, targetY - cur.y);
    const duration = isFast ? Math.max(600, dist * 24) : Math.max(1000, dist * 48);

    setPetPos({ x: targetX, y: targetY });

    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    const g = actionGenRef.current;
    moveTimerRef.current = setTimeout(() => {
      if (actionGenRef.current !== g) return;
      const arrivedZone = getZoneAt(targetX, targetY);
      if (arrivedZone === 'water') {
        setAnimState('swim');
      } else if (arrivedZone === 'climb') {
        setAnimState('climb');
      } else if (arrivedZone === 'jump') {
        setAnimState('jump');
        sound.playCelebration();
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { x: targetX / 100, y: targetY / 100 },
        });
        later(() => setAnimState('idle'), 2800);
      } else {
        setAnimState('idle');
      }
      if (onArrival) onArrival();
    }, duration);
  };

  // Ground Click to Move (Constrained within viewport bounds)
  const handleGroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.pointer-events-auto')) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Viewport-contained bounds (X: 8 to 92, Y: 18 to 84)
    const clampedX = Math.max(8, Math.min(92, clickX));
    const clampedY = Math.max(18, Math.min(84, clickY));

    sound.playClick();
    setTargetMarker({ x: clampedX, y: clampedY });
    later(() => setTargetMarker(null), 1200);

    // Click đất là ý định mới: hủy action cũ đang dở (tránh timer cũ teleport pet về sau)
    beginNewAction();
    if (isSleeping) {
      setIsSleeping(false);
      try { localStorage.setItem('meowlish_pet_is_sleeping', 'false'); } catch {}
      onStateChange?.({ isSleeping: false, isSpeedFast });
    }

    walkTo(clampedX, clampedY, () => {
      isInteractingRef.current = false;
    });
  };

  // Click on Pet to Cuddle / Pet
  const handlePetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playCelebration();

    const busy = isInteractingRef.current;
    if (isSleeping) {
      setIsSleeping(false);
      try { localStorage.setItem('meowlish_pet_is_sleeping', 'false'); } catch {}
      onStateChange?.({ isSleeping: false, isSpeedFast });
    }

    const newHeart = {
      id: Date.now(),
      x: petPos.x + (Math.random() - 0.5) * 4,
      y: petPos.y - 6 - Math.random() * 4,
    };
    setHearts((prev) => [...prev, newHeart]);
    later(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1500);

    const happyQuotes = [
      'Moah! Bạn vuốt ve làm mình hạnh phúc quá! 💖',
      'Cảm ơn bạn! Năng lượng học tiếng Anh lại tràn đầy rồi! ✨',
      'Mình thích ở cạnh bạn nhất trên đời! 🐾',
      'Hôm nay chúng mình cùng học thật giỏi nhé! 🌟',
    ];
    showSpeech(happyQuotes[Math.floor(Math.random() * happyQuotes.length)]);

    if (onPet) onPet();
    // Đang bận chạy action thì chỉ thả tim + speech, KHÔNG đổi anim (tránh đè animation của action)
    if (!busy) {
      setAnimState('happy');
      later(() => {
        if (getZoneAt(petPosRef.current.x, petPosRef.current.y) === 'water') {
          setAnimState('swim');
        } else {
          setAnimState('idle');
        }
      }, 1800);
    }
  };

  const showSpeech = (msg: string) => {
    setCurrentSpeech(msg);
    if (onSpeechChange) onSpeechChange(msg);
  };

  // ===== Helpers tương tác thật (dùng sound có sẵn, chữ tiếng Việt) =====
  // Vàng bạc đá quý bay ra từ rương + confetti + thông báo (tối thiểu hiệu ứng,
  // không gọi API lạ để tránh lỗi trang; coins thật do server cộng khi thu hoạch).
  const burstTreasureLoot = (cx: number, cy: number) => {
    const emojis = ['🪙', '💰', '💎', '✨', '🪙', '💎', '🌟', '🪙'];
    const batch = emojis.map((emoji, i) => ({
      id: Date.now() + i,
      x: cx + (Math.random() * 14 - 7),
      y: cy - 4 - Math.random() * 6,
      emoji,
    }));
    setTreasureLoot((prev) => [...prev, ...batch]);
    sound.playCelebration();
    confetti({ particleCount: 55, spread: 75, origin: { x: cx / 100, y: cy / 100 } });
    later(() => {
      setTreasureLoot((prev) => prev.filter((l) => !batch.some((b) => b.id === l.id)));
    }, 2200);
  };

  // Pet ĐI BỘ dọc vòng cung cầu vồng: nội suy bezier từ chân trái -> đỉnh -> chân phải
  const walkRainbowArc = (leftX: number, leftY: number, topX: number, topY: number, rightX: number, rightY: number, done?: () => void) => {
    setIsRainbowWalking(true);
    setAnimState('walk');
    sound.playFlame();
    const steps = 12;
    let i = 0;
    const step = () => {
      i += 1;
      const t = Math.min(1, i / steps);
      // Quadratic bezier: P0(left) -> Pc(top*2 - mid) -> P2(right). Đơn giản: x lerp, y parabola
      const x = leftX + (rightX - leftX) * t;
      const baseY = leftY + (rightY - leftY) * t;
      const arcH = (leftY - topY) * 4 * t * (1 - t);
      setPetPos({ x, y: baseY - arcH });
      setFacing(rightX >= leftX ? 'right' : 'left');
      if (i === Math.floor(steps / 2)) {
        sound.playCelebration();
        fxFloatUp(topX, topY - 2, ['⭐', '🌈', '✨']);
        confetti({ particleCount: 30, spread: 50, origin: { x: topX / 100, y: topY / 100 } });
        showSpeech('Đang đi bộ trên cầu vồng nè! Cao ơi là cao! 🌈🐾');
      }
      if (t < 1) {
        later(step, 160);
      } else {
        setIsRainbowWalking(false);
        setAnimState('happy');
        sound.playSuccess();
        if (done) done();
      }
    };
    setPetPos({ x: leftX, y: leftY });
    later(step, 200);
  };

  // Pet TRƯỢT từ đỉnh xuống chân (cầu trượt mây / thác cầu vồng): nhanh + vui
  const slideDownRide = (topX: number, topY: number, footX: number, footY: number, label: string, done?: () => void) => {
    setIsSliding(true);
    showSpeech(label);
    setPetPos({ x: topX, y: topY });
    setAnimState('jump');
    fxDrift(topX, topY, ['💨', '✨']);
    sound.playWhoosh();
    later(() => {
      setPetPos({ x: footX, y: footY });
    }, 120);
    later(() => {
      sound.playCelebration();
      fxRings(footX, footY);
      fxFloatUp(footX, footY - 2, ['💦', '✨']);
      confetti({ particleCount: 40, spread: 60, origin: { x: footX / 100, y: footY / 100 } });
      setAnimState('happy');
      showSpeech('Wheeee! Trượt xuống mát rượi, vui quá đi! 🛝🎉');
      later(() => {
        setIsSliding(false);
        setAnimState('idle');
        if (done) done();
      }, 1600);
    }, 750);
  };

  // Xích đu cây sồi: pet ngồi đung đưa qua lại 3 nhịp
  const rideOakSwing = (done?: () => void) => {
    setIsSwinging(true);
    setAnimState('happy');
    sound.playFlame();
    showSpeech('Ngồi xích đu gỗ đung đưa, gió thổi mát rượi! 🍃🪵');
    const baseX = 84;
    const baseY = 34;
    const swings = [4, -4, 3, -3, 2, 0];
    swings.forEach((dx, idx) => {
      later(() => {
        setPetPos({ x: baseX + dx, y: baseY + Math.abs(dx) * 0.3 });
        sound.playClick();
        if (idx === 2) {
          fxFloatUp(84, 30, ['🍃', '🍎', '✨']);
          confetti({ particleCount: 20, spread: 40, origin: { x: 0.84, y: 0.3 } });
          showSpeech('Đung đưa cao ơi là cao, táo rơi lộp độp nè! 🍎😆');
        }
      }, 350 * (idx + 1));
    });
    later(() => {
      setIsSwinging(false);
      setAnimState('idle');
      if (done) done();
    }, 350 * (swings.length + 2));
  };

  // Máy tính dev: pet ngồi vào, popup "đang code" gõ phím + dòng code chạy + EXP vui
  const startCodingSession = (done?: () => void) => {
    showSpeech('Ngồi vào bàn làm việc gõ code fix bug nào! 💻⚡');
    walkTo(50, 36, () => {
      setAnimState('happy');
      fxFloatUp(50, 30, ['⌨️', '⚡', '✨']);
      setIsCoding(true);
      setCodeLines([]);
      setCodeExp(0);
      sound.playClick();
      const demoLines = [
        '> npm run dev ... ✅ server 3000',
        'const hello = "Xin chào!" 🇻🇳',
        'function hocTiengAnh() { return "fun"; }',
        'git add . && git commit "fix bug" 🐛',
        '✅ All tests passed! +5 EXP',
      ];
      demoLines.forEach((line, idx) => {
        later(() => {
          setCodeLines((prev) => [...prev, line]);
          sound.playClick();
          if (idx === demoLines.length - 1) {
            setCodeExp(5);
            sound.playCelebration();
            confetti({ particleCount: 30, spread: 50, origin: { x: 0.5, y: 0.3 } });
            showSpeech('Code compile thành công 100%! Bé được +5 EXP vui vẻ! ✅🚀');
          }
        }, 550 * (idx + 1));
      });
      later(() => {
        if (done) done();
        // Giữ popup thêm 2.5s cho bé khoe thành quả rồi tự đóng (không kẹt màn hình)
        later(() => {
          setIsCoding(false);
          setAnimState('idle');
        }, 2500);
      }, 550 * (demoLines.length + 2));
    }, true);
  };

  // Perform specific actions tailored to the active habitat
  const handlePerformMapAction = (actionKey: string) => {
    // Action mới đè lên: hủy toàn bộ timer/animation của action cũ (chống bounce/teleport nhầm vật thể)
    beginNewAction();
    if (isSleeping) {
      setIsSleeping(false);
      try { localStorage.setItem('meowlish_pet_is_sleeping', 'false'); } catch {}
      onStateChange?.({ isSleeping: false, isSpeedFast });
    }
    // Lưới an toàn: action lạ hoặc chuỗi nào quên nhả khóa cũng tự nhả sau 30s (đúng gen mới chạy)
    later(() => {
      isInteractingRef.current = false;
    }, 30000);

    if (habitat === 'emerald_garden') {
      if (actionKey === 'swim') {
        showSpeech('Đi ra cầu ván nhảy xuống hồ sen mát rượi thôi! 🏊🪷');
        walkTo(74, 76, () => {
          sound.playWhoosh();
          fxRings(84, 80);
          fxFloatUp(84, 76, ['💦', '🐟', '💧']);
          setPondSplashId(Date.now());
          later(() => setPondSplashId(0), 3000);
          setPetPos({ x: 84, y: 80 });
          setAnimState('swim');
          sound.playCelebration();
          confetti({ particleCount: 25, spread: 45, origin: { x: 0.8, y: 0.78 } });
          showSpeech('Tõm! Nước bắn tung tóe! Bơi cùng đàn cá Koi mát rượi! 🏊🐟');
          later(() => {
            setPetPos({ x: 86, y: 78 });
            sound.playPop();
            later(() => {
              setPetPos({ x: 82, y: 82 });
              isInteractingRef.current = false;
            }, 1800);
          }, 1800);
        }, true);
      } else if (actionKey === 'climb') {
        showSpeech('Lại thang cây đại thụ leo lên hái táo nào! 🍎🧗');
        walkTo(88, 32, () => {
          setAnimState('climb');
          sound.playSuccess();
          showSpeech('Đang thoăn thoắt trèo từng bậc thang gỗ... 🪜🐾');
          later(() => {
            setPetPos({ x: 88, y: 16 });
            later(() => {
              setAnimState('happy');
              fxHitObject('oak');
              sound.playPop();
              fxDropLoot(88, 12, ['🍎', '🍎', '🍏']);
              sound.playCelebration();
              confetti({ particleCount: 30, spread: 45, origin: { x: 0.88, y: 0.16 } });
              showSpeech('Rung cây rụng táo nè! Hái được quả táo chín mọng ngọt lịm! 🍎✨');
              later(() => {
                setAnimState('climb');
                setPetPos({ x: 88, y: 32 });
                later(() => {
                  // Leo xong thì ngồi xích đu đung đưa cho vui (xích đu dưới tán cây)
                  setPetPos({ x: 84, y: 34 });
                  rideOakSwing(() => {
                    setAnimState('idle');
                    isInteractingRef.current = false;
                  });
                }, 800);
              }, 2200);
            }, 800);
          }, 400);
        }, true);
      } else if (actionKey === 'swing') {
        showSpeech('Chạy ra xích đu gỗ dưới tán cây đại thụ nào! 🪵🍃');
        walkTo(84, 34, () => {
          rideOakSwing(() => {
            setAnimState('idle');
            isInteractingRef.current = false;
          });
        }, true);
      } else if (actionKey === 'jump') {
        showSpeech('Chạy ra nấm lò xo ma thuật bật nhảy thôi! 🍄💨');
        walkTo(76, 42, () => {
          setIsBouncingMushroom(true);
          setAnimState('jump');
          fxFloatUp(76, 38, ['✨', '🍄', '💨']);
          sound.playCelebration();
          confetti({ particleCount: 40, spread: 60, origin: { x: 0.76, y: 0.35 } });
          showSpeech('Boingggg! Nấm bật tung chạm mây luôn! 🍄🚀');

          later(() => {
            setPetPos({ x: 76, y: 26 });
            later(() => {
              setPetPos({ x: 76, y: 42 });
              later(() => {
                setIsBouncingMushroom(false);
                setAnimState('happy');
                sound.playSuccess();
                later(() => {
                  isInteractingRef.current = false;
                  setAnimState('idle');
                }, 1500);
              }, 450);
            }, 600);
          }, 350);
        }, true);
      } else if (actionKey === 'coop') {
        showSpeech('Lại chuồng gà rải thóc cho gà ăn nhé! 🌾🐔');
        walkTo(48, 44, () => {
          setAnimState('eat');
          fxFloatUp(48, 40, ['🌾', '🌾', '🐣']);
          fxPop(52, 37, ['🥚']);
          sound.playPop();
          sound.playSuccess();
          confetti({ particleCount: 20, spread: 40, origin: { x: 0.48, y: 0.4 } });
          showSpeech('Gà mẹ và đàn gà con mổ thóc tíu tít! Cục tác... đẻ trứng vàng nè! 🐣🥚');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'veggie') {
        showSpeech('Ra bồn hoa & luống rau thu hoạch nào! 🥕🌷');
        walkTo(20, 78, () => {
          setAnimState('eat');
          fxFloatUp(20, 74, ['🌸', '🌷', '✨']);
          fxPop(24, 72, ['🥕', '🍓']);
          setBloomId(Date.now());
          later(() => setBloomId(0), 3000);
          sound.playPop();
          sound.playSuccess();
          confetti({ particleCount: 25, spread: 45, origin: { x: 0.2, y: 0.75 } });
          showSpeech('Hoa nở rộ thơm ngát! Cà rốt giòn ngọt quá chừng! 🥕🌷✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'windmill') {
        showSpeech('Chạy ra cối xay gió đón cơn gió mát nào! 💨🏡');
        walkTo(16, 28, () => {
          setWindGustId(Date.now());
          fxDrift(16, 24, ['💨', '💨', '🍃']);
          fxFloatUp(16, 22, ['✨']);
          later(() => setWindGustId(0), 3000);
          setAnimState('happy');
          sound.playWhoosh();
          sound.playSuccess();
          showSpeech('Cối xay gió quay tít mù! Gió mát thổi bay tóc nè! 💨😆');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2200);
        }, true);
      } else if (actionKey === 'villa') {
        showSpeech('Về biệt thự mái ngói đỏ nghỉ chân nào! 🏡✨');
        walkTo(18, 55, () => {
          setAnimState('happy');
          fxFloatUp(18, 50, ['✨', '🍞', '💨']);
          sound.playSuccess();
          confetti({ particleCount: 20, spread: 40, origin: { x: 0.18, y: 0.5 } });
          showSpeech('Biệt thự ấm áp, khói bếp bay lên, thơm mùi bánh mới! 🏡🍞');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2200);
        }, true);
      }
    } else if (habitat === 'sunset_beach') {
      if (actionKey === 'surf' || actionKey === 'swim') {
        showSpeech('Lướt trên sóng biển nhiệt đới thôi! 🏄🌊');
        walkTo(50, 20, () => {
          setAnimState('swim');
          fxRings(50, 22);
          fxFloatUp(50, 18, ['🌊', '🐬', '💦']);
          sound.playCelebration();
          showSpeech('Cưỡi trên ngọn sóng biển hoàng hôn thật sảng khoái! 🏄✨');
          isInteractingRef.current = false;
        }, true);
      } else if (actionKey === 'climb') {
        showSpeech('Leo cây dừa cong vút hái dừa xiêm nào! 🌴🥥');
        walkTo(86, 30, () => {
          setAnimState('climb');
          sound.playSuccess();
          later(() => {
            setPetPos({ x: 86, y: 16 });
            later(() => {
              setAnimState('happy');
              fxHitObject('palm');
              sound.playPop();
              fxDropLoot(86, 12, ['🥥', '🥥']);
              sound.playCelebration();
              showSpeech('Rung cây dừa rụng quả nè! Quả nào quả nấy mọng nước! 🥥✨');
              later(() => {
                setAnimState('climb');
                setPetPos({ x: 86, y: 30 });
                later(() => {
                  setAnimState('idle');
                  isInteractingRef.current = false;
                }, 800);
              }, 2500);
            }, 800);
          }, 350);
        }, true);
      } else if (actionKey === 'volleyball') {
        showSpeech('Ra sân đập bóng chuyền bãi biển nhé! 🏐🔥');
        walkTo(50, 52, () => {
          setAnimState('jump');
          fxHitObject('volleyball');
          fxPop(50, 46, ['🏐']);
          fxFloatUp(50, 48, ['✨', '🔥']);
          sound.playCelebration();
          confetti({ particleCount: 35, spread: 50, origin: { x: 0.5, y: 0.52 } });
          showSpeech('Cú đập bóng ăn điểm tuyệt đỉnh! 🏐🎉');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'tiki') {
        showSpeech('Ghé quầy Tiki Bar uống nước dừa thơm ngon! 🍹🥥');
        walkTo(84, 76, () => {
          setAnimState('eat');
          fxFloatUp(84, 72, ['🥥', '🍹', '✨']);
          sound.playPop();
          sound.playSuccess();
          showSpeech('Nước dừa ngọt lịm mát lạnh tan biến cơn khát! 🌴😋');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'sandcastle') {
        showSpeech('Xây lâu đài cát & sưởi ấm bên đốm lửa bập bùng! 🏰🔥');
        walkTo(20, 76, () => {
          setAnimState('happy');
          fxFloatUp(20, 70, ['🔥', '⭐', '🐚']);
          sound.playFlame();
          sound.playCelebration();
          confetti({ particleCount: 30, spread: 50, origin: { x: 0.2, y: 0.76 } });
          showSpeech('Lâu đài cát thật đồ sộ với vỏ ốc và sao biển xinh xắn! 🐚⭐');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'lighthouse') {
        showSpeech('Tới ngọn hải đăng ngắm biển đêm! 🗼🌟');
        walkTo(16, 28, () => {
          setAnimState('happy');
          fxFloatUp(16, 20, ['✨', '💡', '⭐']);
          sound.playCelebration();
          showSpeech('Đèn hải đăng sáng rực rỡ, chiếu rọi cả bầu trời! 🗼✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      }
    } else if (habitat === 'cozy_den') {
      if (actionKey === 'code') {
        startCodingSession(() => {
          isInteractingRef.current = false;
        });
      } else if (actionKey === 'climb') {
        showSpeech('Trèo thang kệ sách lấy tài liệu thuật toán! 📚🧗');
        walkTo(18, 34, () => {
          setAnimState('climb');
          sound.playSuccess();
          showSpeech('Đang thoăn thoắt trèo từng bậc thang đồng... 🪜🐾');
          later(() => {
            setPetPos({ x: 18, y: 18 });
            later(() => {
              setAnimState('happy');
              fxFloatUp(18, 14, ['📚', '✨', '💨']);
              sound.playCelebration();
              showSpeech('Tìm thấy cuốn sách bí kíp tiếng Anh công nghệ rồi! 📖✨');
              later(() => {
                setAnimState('climb');
                setPetPos({ x: 18, y: 34 });
                later(() => {
                  setAnimState('idle');
                  isInteractingRef.current = false;
                }, 800);
              }, 2500);
            }, 800);
          }, 350);
        }, true);
      } else if (actionKey === 'beanbag') {
        showSpeech('Nhảy phóc lên ghế lười Beanbag êm ái! 🛋️✨');
        walkTo(20, 74, () => {
          setIsBouncingBeanbag(true);
          setAnimState('jump');
          fxFloatUp(20, 68, ['⭐', '💤', '✨']);
          sound.playCelebration();
          confetti({ particleCount: 30, spread: 50, origin: { x: 0.2, y: 0.74 } });
          showSpeech('Boinggg! Đệm lười êm như nhung, nhún sướng quá! 🛋️🎉');

          later(() => {
            setPetPos({ x: 20, y: 60 });
            later(() => {
              setPetPos({ x: 20, y: 74 });
              later(() => {
                setIsBouncingBeanbag(false);
                setAnimState('happy');
                sound.playSuccess();
                later(() => {
                  isInteractingRef.current = false;
                  setAnimState('idle');
                }, 1500);
              }, 400);
            }, 550);
          }, 350);
        }, true);
      } else if (actionKey === 'coffee') {
        showSpeech('Lại quầy máy pha ly cafe Espresso & ăn pizza nào! ☕🍕');
        walkTo(82, 74, () => {
          setAnimState('eat');
          fxFloatUp(82, 68, ['♨️', '☕', '🍕']);
          sound.playPop();
          sound.playSuccess();
          showSpeech('Mùi cafe thơm lừng! Trí tuệ tỉnh táo tập trung học tiếp! ☕😋');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'kanban') {
        showSpeech('Xem bảng Scrum Kanban tiến độ dự án học tập! 📋🚀');
        walkTo(50, 54, () => {
          setAnimState('happy');
          fxPop(50, 50, ['✅']);
          fxFloatUp(50, 50, ['📋', '🎉']);
          sound.playCelebration();
          showSpeech('Sprint hoàn thành 100%! Không còn con bug nào nữa! ✅🎉');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'server') {
        showSpeech('Kiểm tra tủ Server Rack 42U nào! 🖥️⚡');
        walkTo(84, 34, () => {
          setAnimState('happy');
          fxFloatUp(84, 28, ['🟢', '⚡', '✨']);
          sound.playFlip();
          sound.playSuccess();
          showSpeech('Uptime 100%! Server chạy mượt mà không có lỗi! 🚀✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      }
    } else if (habitat === 'sky_castle') {
      if (actionKey === 'fountain' || actionKey === 'swim') {
        showSpeech('Tắm trong đài phun sao pha lê mát rượi! ⛲✨');
        walkTo(20, 74, () => {
          setAnimState('swim');
          fxRings(20, 76);
          fxFloatUp(20, 72, ['💧', '⭐', '✨']);
          sound.playCelebration();
          confetti({ particleCount: 25, spread: 45, origin: { x: 0.2, y: 0.7 } });
          showSpeech('Tõm! Nước sao bắn tung tóe mát lạnh! Những giọt sao rơi quanh mình! ⛲⭐');
          isInteractingRef.current = false;
        }, true);
      } else if (actionKey === 'climb') {
        showSpeech('Trèo lên đỉnh bậc thang mây rồi trượt xuống nào! ☁️🛝');
        walkTo(24, 30, () => {
          slideDownRide(24, 28, 32, 46, 'Lên đỉnh mây rồi... trượt xuống thôi! Wheee! ☁️🛝', () => {
            isInteractingRef.current = false;
          });
        }, true);
      } else if (actionKey === 'rainbow') {
        showSpeech('Chạy ra chân cầu vồng, đi bộ qua vòng cung nè! 🌈🐾');
        walkTo(56, 36, () => {
          walkRainbowArc(56, 36, 66, 20, 76, 36, () => {
            sound.playCelebration();
            fxPop(66, 22, ['⭐']);
            fxFloatUp(66, 24, ['🌈', '✨']);
            confetti({ particleCount: 40, spread: 55, origin: { x: 0.66, y: 0.25 } });
            showSpeech('Đi hết cầu vồng rồi! Bắt được ngôi sao ước nguyện! ⭐🎉');
            later(() => {
              isInteractingRef.current = false;
              setAnimState('idle');
            }, 2200);
          });
        }, true);
      } else if (actionKey === 'treasure') {
        showSpeech('Mở rương kho báu tri thức trên mây! 💎✨');
        walkTo(80, 74, () => {
          setIsSkyTreasureOpen(true);
          setAnimState('happy');
          fxHitObject('skytreasure');
          sound.playPop();
          sound.playSuccess();
          showSpeech('Cạch! Nắp rương bật mở, ánh sáng tỏa ra! ✨🔓');
          later(() => {
            burstTreasureLoot(80, 70);
            fxArc(80, 64, ['🪙', '💎', '🪙', '🌟']);
            showSpeech('Kho báu tuôn ra: vàng + kim cương + từ vựng mới! +20 Coins! 💎🪙');
            later(() => {
              setIsSkyTreasureOpen(false);
              isInteractingRef.current = false;
              setAnimState('idle');
            }, 2600);
          }, 700);
        }, true);
      } else if (actionKey === 'castle') {
        showSpeech('Bay lên Cổng Thành Thần Tiên Lâu Đài Pha Lê! 🏰✨');
        walkTo(50, 44, () => {
          setAnimState('climb');
          sound.playCelebration();
          later(() => {
            setPetPos({ x: 50, y: 22 });
            later(() => {
              setAnimState('happy');
              fxFloatUp(50, 16, ['✨', '🏰', '💫']);
              sound.playCelebration();
              confetti({ particleCount: 45, spread: 60, origin: { x: 0.5, y: 0.22 } });
              showSpeech('Đã chạm tới cổng ngọc bích lâu đài mây nguy nga lộng lẫy! 🏰🌈✨');
              later(() => {
                setAnimState('climb');
                setPetPos({ x: 50, y: 44 });
                later(() => {
                  setAnimState('idle');
                  isInteractingRef.current = false;
                }, 800);
              }, 2500);
            }, 800);
          }, 400);
        }, true);
      }
    } else if (habitat === 'thousand_sunny') {
      if (actionKey === 'helm') {
        showSpeech('Bẻ bánh lái tàu Sunny, tiến vào Tân Thế Giới! ☸️🏴‍☠️');
        walkTo(50, 72, () => {
          setAnimState('happy');
          fxFloatUp(50, 66, ['✨', '🧭', '🌊']);
          sound.playFlip();
          sound.playCelebration();
          showSpeech('Bánh lái xoay tít! Tàu đang lướt sóng thẳng tiến One Piece! 🌊🚀');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'climb' || actionKey === 'mast') {
        showSpeech('Leo dây cột buồm lên đài quan sát Crow\'s Nest! 🧗🔭');
        walkTo(50, 38, () => {
          setAnimState('climb');
          sound.playSuccess();
          later(() => {
            setPetPos({ x: 50, y: 18 });
            later(() => {
              setAnimState('happy');
              fxFloatUp(50, 14, ['🚩', '🕊️', '✨']);
              sound.playCelebration();
              confetti({ particleCount: 35, spread: 50, origin: { x: 0.5, y: 0.18 } });
              showSpeech('Đã đứng trên đỉnh cột buồm Mũ Rơm! Nhìn thấy đảo tiếp theo rồi! 🏴‍☠️✨');
              later(() => {
                setAnimState('climb');
                setPetPos({ x: 50, y: 38 });
                later(() => {
                  setAnimState('idle');
                  isInteractingRef.current = false;
                }, 800);
              }, 2500);
            }, 800);
          }, 400);
        }, true);
      } else if (actionKey === 'jump' || actionKey === 'lion') {
        showSpeech('Nhảy phóc lên đầu sư tử Thousand Sunny đón gió! 🦁✨');
        walkTo(84, 76, () => {
          setAnimState('jump');
          fxFloatUp(84, 70, ['🔥', '🦁', '✨']);
          sound.playFlame();
          sound.playCelebration();
          confetti({ particleCount: 40, spread: 55, origin: { x: 0.84, y: 0.76 } });
          showSpeech('Gaon Cannon sẵn sàng! Niềm kiêu hãnh của băng Mũ Rơm! 🦁💥');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'treasure') {
        showSpeech('Mở rương kho báu cướp biển xem có gì nào! 💎💰');
        walkTo(18, 76, () => {
          setIsSunnyTreasureOpen(true);
          setAnimState('happy');
          fxHitObject('sunnytreasure');
          sound.playPop();
          sound.playSuccess();
          showSpeech('Cạch! Nắp rương bật mở tung! ✨🔓');
          later(() => {
            burstTreasureLoot(18, 70);
            fxArc(18, 64, ['🪙', '💰', '💎']);
            showSpeech('Vàng bạc châu báu tuôn ra sáng chói mắt! +20 Coins! 💰✨');
            later(() => {
              setIsSunnyTreasureOpen(false);
              isInteractingRef.current = false;
              setAnimState('idle');
            }, 2600);
          }, 700);
        }, true);
      } else if (actionKey === 'tangerine') {
        showSpeech('Lại vườn cam của Nami hái quả mọng nước nào! 🍊😋');
        walkTo(82, 32, () => {
          setAnimState('eat');
          fxHitObject('tangerine');
          sound.playPop();
          fxDropLoot(82, 26, ['🍊', '🍊', '🍊']);
          sound.playSuccess();
          showSpeech('Cam Mikan ngọt lịm và thơm mát vô cùng! 🍊✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'cannon') {
        showSpeech('Kiểm tra khẩu đại bác bảo vệ mạn tàu! 💥⚓');
        walkTo(20, 32, () => {
          setAnimState('happy');
          fxArc(22, 30, ['⚫']);
          fxFloatUp(24, 28, ['💥', '💨']);
          sound.playHit();
          sound.playCelebration();
          showSpeech('Đại bác sẵn sàng! Uống ngụm Cola nạp đầy năng lượng! 🥤🔥');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      }
    } else if (habitat === 'konoha_valley') {
      if (actionKey === 'ramen' || actionKey === 'eat') {
        showSpeech('Ghé quán mì Ichiraku làm một bát ramen nóng hổi! 🍜😋');
        walkTo(20, 36, () => {
          setAnimState('eat');
          fxFloatUp(20, 30, ['♨️', '🍜', '✨']);
          sound.playPop();
          sound.playSuccess();
          showSpeech('Xì xụp... Mì ramen xá xíu của bác Teuchi ngon đỉnh của chóp! 🍜🔥');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'onsen' || actionKey === 'swim') {
        showSpeech('Nhảy xuống suối nước nóng Onsen ngâm mình thư giãn! ♨️🧘');
        walkTo(82, 78, () => {
          setAnimState('swim');
          fxRings(82, 80);
          fxFloatUp(82, 74, ['♨️', '💧', '✨']);
          sound.playCelebration();
          showSpeech('Nước khoáng nóng bốc hơi nghi ngút, hồi phục 100% Chakra! ♨️✨');
          later(() => {
            isInteractingRef.current = false;
          }, 2500);
        }, true);
      } else if (actionKey === 'climb' || actionKey === 'hokage') {
        showSpeech('Trèo lên vách đá ngắm tượng các cụ Hokage! 🗿🧗');
        walkTo(50, 38, () => {
          setAnimState('climb');
          sound.playSuccess();
          later(() => {
            setPetPos({ x: 50, y: 18 });
            later(() => {
              setAnimState('happy');
              fxFloatUp(50, 14, ['🍃', '✨', '⛰️']);
              sound.playCelebration();
              confetti({ particleCount: 35, spread: 50, origin: { x: 0.5, y: 0.18 } });
              showSpeech('Đứng trên đỉnh tượng cụ Đệ Tứ ngắm toàn cảnh Làng Lá tuyệt đẹp! 🍃✨');
              later(() => {
                setAnimState('climb');
                setPetPos({ x: 50, y: 38 });
                later(() => {
                  setAnimState('idle');
                  isInteractingRef.current = false;
                }, 800);
              }, 2500);
            }, 800);
          }, 400);
        }, true);
      } else if (actionKey === 'jump' || actionKey === 'target') {
        showSpeech('Vào vị trí tập luyện phóng phi tiêu Shuriken & Kunai! 🎯⚡');
        // Pet đứng ở vị trí ngắm bắn (x: 44, y: 78), quay mặt sang trái về phía cột bia (x: 20, y: 78)
        walkTo(44, 78, () => {
          setFacing('left');
          setAnimState('jump');
          showSpeech('Nhẫn pháp Phóng Phi Tiêu: Shuriken Kage Bunshin! 🌀🥷');
          sound.playWhoosh();

          // Phi tiêu 1 (Kunai) bay từ vị trí Pet sang bia cột gỗ
          setFlyingShuriken({ x: 40, y: 76, rot: 0, type: 'kunai' });
          later(() => {
            setFlyingShuriken({ x: 23, y: 77, rot: -25, type: 'kunai' });
          }, 40);

          // Cắm trúng bia 1
          later(() => {
            sound.playHit();
            setIsNinjaTargetHit(true);
            later(() => setIsNinjaTargetHit(false), 300);

            // Phi tiêu 2 (Shuriken 4 cánh) bay tiếp
            later(() => {
              sound.playWhoosh();
              setFlyingShuriken({ x: 40, y: 74, rot: 45, type: 'shuriken' });
              later(() => {
                setFlyingShuriken({ x: 22, y: 75, rot: 360, type: 'shuriken' });
              }, 40);

              // Cắm trúng hồng tâm bia 2
              later(() => {
                sound.playHit();
                sound.playCelebration();
                setIsNinjaTargetHit(true);
                confetti({
                  particleCount: 45,
                  spread: 60,
                  origin: { x: 0.20, y: 0.76 },
                  colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
                });
                setAnimState('happy');
                fxPop(20, 72, ['🎯']);
                showSpeech('Trúng ngay tâm bia 100 điểm tuyệt đối! Xuất sắc lắm Nhẫn giả! 🎯🔥✨');

                later(() => {
                  setIsNinjaTargetHit(false);
                  setFlyingShuriken(null);
                  isInteractingRef.current = false;
                  setAnimState('idle');
                }, 2200);
              }, 280);
            }, 300);
          }, 280);
        }, true);
      } else if (actionKey === 'torii') {
        showSpeech('Bước qua cổng Torii đỏ thắp hương cầu may mắn học tập! ⛩️🍃');
        walkTo(80, 32, () => {
          setAnimState('happy');
          fxFloatUp(80, 28, ['🏮', '🌸', '✨']);
          sound.playSuccess();
          showSpeech('Ý chí của Lửa luôn soi sáng con đường thành công của bạn! 🔥🌸');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      }
    } else if (habitat === 'hogwarts_hall') {
      if (actionKey === 'feast' || actionKey === 'eat') {
        showSpeech('Ngồi vào bàn tiệc Đại Sảnh Đường thưởng thức tiệc pháp thuật! 🍗🍺');
        walkTo(50, 72, () => {
          setAnimState('eat');
          fxFloatUp(50, 66, ['🍗', '🍺', '💖']);
          sound.playPop();
          sound.playSuccess();
          showSpeech('Gà quay giòn rụm và cốc Bia Bơ béo ngậy ngon tuyệt cú mèo! 🍗✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'sorting_hat' || actionKey === 'jump') {
        showSpeech('Chạy lại ghế ngồi đội chiếc Nón Phân Loại cổ kính! 🎩🧙‍♂️');
        walkTo(20, 74, () => {
          setAnimState('jump');
          fxHitObject('sortinghat');
          fxFloatUp(20, 68, ['🎩', '⭐', '✨']);
          sound.playCelebration();
          confetti({ particleCount: 45, spread: 60, origin: { x: 0.2, y: 0.74 } });
          showSpeech('Nón Phân Loại: Tư chất xuất sắc! Cộng 100 điểm cho Nhà của bạn! 🦁✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2800);
        }, true);
      } else if (actionKey === 'fireplace') {
        showSpeech('Sưởi ấm bên ngọn lửa Floo xanh ngọc tại lò sưởi đá! 🔥🟢');
        walkTo(80, 74, () => {
          setAnimState('happy');
          fxFloatUp(80, 68, ['🔥', '🟢', '✨']);
          sound.playFlame();
          sound.playCelebration();
          showSpeech('Ngọn lửa Floo xanh ngọc bùng lên ấm áp, sẵn sàng du hành! 🪄✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'candles') {
        showSpeech('Vung đũa phép niệm câu thần chú Lumos Maxima! 🪄🕯️');
        walkTo(50, 24, () => {
          setIsCandleLit(true);
          setAnimState('happy');
          fxFloatUp(50, 18, ['🕯️', '✨', '💫']);
          sound.playCelebration();
          confetti({ particleCount: 35, spread: 50, origin: { x: 0.5, y: 0.24 } });
          showSpeech('Hàng trăm ngọn nến ma thuật bùng sáng lung linh khắp sảnh đường! 🕯️🌟');
          later(() => {
            setIsCandleLit(false);
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 3000);
        }, true);
      } else if (actionKey === 'banners') {
        showSpeech('Tiến về phía cờ hiệu bốn Nhà vinh danh thành tích học tập! 🚩🦁');
        walkTo(82, 28, () => {
          setAnimState('happy');
          fxFloatUp(82, 22, ['🚩', '🦁', '⭐']);
          sound.playCelebration();
          confetti({
            particleCount: 40,
            spread: 55,
            origin: { x: 0.82, y: 0.28 },
            colors: ['#dc2626', '#16a34a', '#2563eb', '#ca8a04'],
          });
          showSpeech('Gryffindor dũng cảm, Ravenclaw trí tuệ, Slytherin tham vọng, Hufflepuff trung thành! 🏰✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2600);
        }, true);
      }
    } else if (habitat === 'doraemon_field') {
      if (actionKey === 'pipes' || actionKey === 'jump') {
        showSpeech('Chạy ra 3 ống cống bê tông bật nhảy lên đỉnh ngồi hát! 🧱🎤');
        walkTo(50, 48, () => {
          setIsBouncingPipes(true);
          setAnimState('jump');
          fxHitObject('pipes');
          fxFloatUp(50, 42, ['🎵', '🎶', '✨']);
          sound.playCelebration();
          confetti({ particleCount: 45, spread: 60, origin: { x: 0.5, y: 0.4 } });
          showSpeech('Boing! Đứng trên đỉnh 3 ống bê tông tổ chức liveshow âm nhạc! 🎤🎶');

          later(() => {
            setPetPos({ x: 50, y: 34 });
            later(() => {
              setPetPos({ x: 50, y: 48 });
              later(() => {
                setIsBouncingPipes(false);
                setAnimState('happy');
                sound.playSuccess();
                later(() => {
                  isInteractingRef.current = false;
                  setAnimState('idle');
                }, 1500);
              }, 450);
            }, 600);
          }, 350);
        }, true);
      } else if (actionKey === 'door' || actionKey === 'anywhere_door') {
        showSpeech('Mở Cửa Thần Kỳ xuyên không gian nào! 🚪🌸');
        walkTo(82, 68, () => {
          setIsAnywhereDoorOpen(true);
          setAnimState('happy');
          fxDrift(82, 64, ['🌀', '✨']);
          fxFloatUp(82, 62, ['🌸']);
          sound.playCelebration();
          confetti({ particleCount: 40, spread: 55, origin: { x: 0.82, y: 0.68 } });
          showSpeech('Cánh Cửa Thần Kỳ đã mở! Bước qua là đến ngay London học tiếng Anh! 🚪✈️');
          later(() => {
            setIsAnywhereDoorOpen(false);
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 3000);
        }, true);
      } else if (actionKey === 'dorayaki' || actionKey === 'eat') {
        showSpeech('Thưởng thức đĩa bánh rán Dorayaki thơm lừng của Doraemon! 🥞😋');
        walkTo(20, 76, () => {
          setAnimState('eat');
          fxFloatUp(20, 70, ['🥞', '💖', '✨']);
          sound.playPop();
          sound.playSuccess();
          showSpeech('Bánh rán nhân đậu đỏ ngọt ngào giòn xốp ngon tuyệt cú mèo! 🥞✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'pole') {
        showSpeech('Chạy tới Cột Điện Khu Phố ngắm hoàng hôn! ⚡🌇');
        walkTo(84, 28, () => {
          setAnimState('happy');
          fxFloatUp(84, 22, ['✨', '🕊️', '🌇']);
          sound.playSuccess();
          showSpeech('Cảnh chiều tà tuổi thơ thật yên bình và hoài niệm! 🌇✨');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      }
    } else if (habitat === 'dream_land') {
      if (actionKey === 'warp_star' || actionKey === 'jump') {
        showSpeech('Nhảy lên Ngôi Sao Vàng Warp Star vút bay! ⭐🚀');
        walkTo(22, 42, () => {
          setIsWarpStarActive(true);
          setAnimState('jump');
          fxFloatUp(22, 36, ['⭐', '💫', '✨']);
          sound.playCelebration();
          confetti({ particleCount: 45, spread: 60, origin: { x: 0.22, y: 0.35 } });
          showSpeech('Warp Star phóng vút qua bầu trời dải ngân hà lấp lánh! ⭐🌌');

          later(() => {
            setPetPos({ x: 22, y: 24 });
            later(() => {
              setPetPos({ x: 22, y: 42 });
              later(() => {
                setIsWarpStarActive(false);
                setAnimState('happy');
                sound.playSuccess();
                later(() => {
                  isInteractingRef.current = false;
                  setAnimState('idle');
                }, 1500);
              }, 450);
            }, 600);
          }, 350);
        }, true);
      } else if (actionKey === 'lollipop' || actionKey === 'eat') {
        showSpeech('Lại cây kẹo mút khổng lồ bảy sắc nếm thử vị ngọt! 🍭🍬');
        walkTo(80, 32, () => {
          setAnimState('eat');
          fxFloatUp(80, 26, ['🍬', '✨', '💖']);
          sound.playPop();
          sound.playSuccess();
          showSpeech('Kẹo mút dâu xoắn 7 màu ngọt ngào tan biến mọi âu lo! 🍭💖');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'rainbow' || actionKey === 'swim') {
        showSpeech('Leo lên đỉnh thác cầu vồng rồi trượt xuống suối kẹo! 🌈🛝');
        walkTo(50, 44, () => {
          slideDownRide(50, 42, 52, 76, 'Lên đỉnh thác rồi... trượt xuống thôi! Wheee! 🌈🛝', () => {
            setAnimState('swim');
            sound.playCelebration();
            showSpeech('Tõm xuống suối cầu vồng mát lạnh thơm như kẹo bông gòn! 🌈🏊');
            later(() => {
              isInteractingRef.current = false;
            }, 1800);
          });
        }, true);
      } else if (actionKey === 'star_rod') {
        showSpeech('Chạm tay vào Trượng Sao Star Rod ước nguyện! 🪄⭐');
        walkTo(82, 76, () => {
          setAnimState('happy');
          fxPop(82, 70, ['🪄']);
          fxFloatUp(82, 70, ['⭐', '💫', '✨']);
          sound.playCelebration();
          confetti({ particleCount: 50, spread: 65, origin: { x: 0.82, y: 0.76 } });
          showSpeech('Trượng Sao phát sáng rực rỡ! Bạn đã được tiếp thêm 100% năng lượng! 🪄💫');
          later(() => {
            isInteractingRef.current = false;
            setAnimState('idle');
          }, 2500);
        }, true);
      } else if (actionKey === 'apple') {
        showSpeech('Trèo lên cây Whispy Woods hái táo nào! 🍎🌳');
        walkTo(20, 76, () => {
          setAnimState('climb');
          sound.playSuccess();
          later(() => {
            setPetPos({ x: 20, y: 50 });
            later(() => {
              setAnimState('happy');
              fxHitObject('apple');
              sound.playPop();
              fxDropLoot(20, 46, ['🍎', '⭐', '🍏']);
              sound.playCelebration();
              showSpeech('Rung cây rụng táo nè! Táo Whispy Woods to đùng ngọt lịm! 🍎✨');
              later(() => {
                setAnimState('climb');
                setPetPos({ x: 20, y: 76 });
                later(() => {
                  setAnimState('idle');
                  isInteractingRef.current = false;
                }, 800);
              }, 2500);
            }, 800);
          }, 400);
        }, true);
      }
    }
  };

  // ===== Tap hợp nhất cho MỌI vật thể (physics-raycasting: target ≥44px, tap = full beat) =====
  // Anticipation (0ms): tick + vòng pulse HIỆN NGAY trên vật thể → click nào cũng
  // có phản ứng nhìn thấy trong 200ms, kể cả khi pet còn đang chạy tới.
  // Contact frame (pet tới nơi): từng action tự bắn effect + sound chạm.
  const goTapObject = (actionKey: string, objKey: string) => {
    sound.playClick();
    handlePerformMapAction(actionKey);
    const id = Date.now() + Math.random();
    setObjPulse({ key: objKey, id });
    fxLater(() => {
      setObjPulse((prev) => (prev && prev.id === id ? null : prev));
    }, 550);
  };
  const onObjClick = (e: React.MouseEvent | React.TouchEvent, actionKey: string, objKey: string) => {
    e.stopPropagation();
    // TouchEnd đi trước Click ~300ms trên mobile: bỏ qua Click dội (tránh đè action 2 lần)
    if (Date.now() - touchTapRef.current < 800) return;
    goTapObject(actionKey, objKey);
  };
  const onObjTouch = (e: React.TouchEvent, actionKey: string, objKey: string) => {
    e.stopPropagation();
    touchTapRef.current = Date.now();
    goTapObject(actionKey, objKey);
  };
  // Hàng rào gỗ Doraemon: trước đây click chết (chỉ đi bộ, không reaction).
  // Nay: pet chạy lại → hít hà (sniff) + hoa bồ công anh bay + speech ngay.
  const handleFenceTap = () => {
    sound.playClick();
    beginNewAction();
    showSpeech('Hàng rào gỗ tuổi thơ thơm mùi nắng! Bé hít hà hương hoa bồ công anh! 🌼🦋');
    walkTo(25, 34, () => {
      setAnimState('sniff');
      fxFloatUp(25, 28, ['🌼', '🦋', '✨']);
      sound.playSuccess();
      later(() => {
        setAnimState('idle');
        isInteractingRef.current = false;
      }, 2200);
    });
    const id = Date.now() + Math.random();
    setObjPulse({ key: 'fence', id });
    fxLater(() => {
      setObjPulse((prev) => (prev && prev.id === id ? null : prev));
    }, 550);
  };
  const onFenceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Date.now() - touchTapRef.current < 800) return;
    handleFenceTap();
  };
  const onFenceTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchTapRef.current = Date.now();
    handleFenceTap();
  };
  // Vòng pulse anticipation phủ lên vật thể (replay ngay nhờ key=id)
  const pulseRing = (objKey: string) =>
    objPulse?.key === objKey ? (
      <span
        key={objPulse.id}
        className="fx-obj-pulse pointer-events-none absolute inset-0 rounded-full border-[3px] border-white/80"
      />
    ) : null;
  // Lớp rung cho cây/rương/mũ (remount bằng key để replay ngay)
  const shakeWrapKey = (objKey: string) =>
    objHit?.key === objKey ? `hit-${objHit.id}` : `idle-${objKey}`;
  const shakeWrapCls = (objKey: string) => (objHit?.key === objKey ? 'fx-obj-shake' : '');

  // Ném Bóng: chỉ ném QUẢ BÓNG (pet đá bóng, không ném vợt) — bóng bay parabol, pet chạy nhặt
  const handleTossBall = () => {
    sound.playWhoosh();
    const ballX = 30 + Math.random() * 40;
    const ballY = 42 + Math.random() * 26;

    if (isSleeping) {
      setIsSleeping(false);
      try { localStorage.setItem('meowlish_pet_is_sleeping', 'false'); } catch {}
      onStateChange?.({ isSleeping: false, isSpeedFast });
    }

    beginNewAction();
    // Pet đá bóng đi: tư thế nhảy đá, bóng xuất phát từ chân pet
    setAnimState('jump');
    showSpeech(`${petName} đá quả bóng bay vút đi nè! ⚽💨`);

    const startX = Math.max(10, Math.min(90, petPos.x));
    const startY = Math.max(24, petPos.y - 4);
    // Step 1: Bóng bắt đầu ngay chân pet (vợt ở lại tay — không có vợt bay theo)
    setToyBall({ x: startX, y: startY, targetX: ballX, targetY: ballY, phase: 'flying' });

    // Step 2: Bóng bay parabol tới điểm rơi (CSS animate-ball-arc lo vòng cung)
    later(() => {
      setToyBall((prev) => (prev ? { ...prev, x: ballX, y: ballY } : null));
    }, 30);

    // Step 3: Bóng chạm đất sau 650ms, pet chạy nhặt về
    later(() => {
      setToyBall((prev) => (prev ? { ...prev, phase: 'bouncing' } : null));

      // Pet chạy tới nhặt bóng!
      walkTo(ballX, ballY, () => {
        setAnimState('happy');
        sound.playCelebration();
        showSpeech('Bắt được bóng rồi nè bạn ơi! ⚽🎉');
        setToyBall((prev) => (prev ? { ...prev, phase: 'caught' } : null));
        confetti({ particleCount: 25, spread: 40, origin: { x: ballX / 100, y: ballY / 100 } });
        later(() => {
          setToyBall(null);
          isInteractingRef.current = false;
          setAnimState('idle');
        }, 1400);
      }, true);
    }, 680);
  };

  // Drop Food Treat
  const handleDropTreat = () => {
    sound.playSuccess();
    const treatX = 30 + Math.random() * 40;
    const treatY = 40 + Math.random() * 30;
    const treats = ['🍎', '🥕', '🍪', '🍔', '🍓', '🍰'];
    const chosenTreat = treats[Math.floor(Math.random() * treats.length)];
    setDroppedTreat({ x: treatX, y: treatY, emoji: chosenTreat });
    showSpeech('Mùi thức ăn thơm lừng hấp dẫn quá! 😋');

    beginNewAction();
    if (isSleeping) {
      setIsSleeping(false);
      try { localStorage.setItem('meowlish_pet_is_sleeping', 'false'); } catch {}
      onStateChange?.({ isSleeping: false, isSpeedFast });
    }

    later(() => {
      walkTo(treatX, treatY, () => {
        setAnimState('eat');
        sound.playSuccess();
        showSpeech(`Măm măm ngon tuyệt vời! Cảm ơn bạn! ${chosenTreat}`);
        later(() => {
          setDroppedTreat(null);
          isInteractingRef.current = false;
          setAnimState('idle');
        }, 2000);
      }, true);
    }, 300);
  };

  // Call Pet (Whistle)
  const handleCallPet = () => {
    sound.playFlame();
    showSpeech(`${petName} ơi! Lại đây với mình nào! 📢`);
    beginNewAction();
    if (isSleeping) {
      setIsSleeping(false);
      try { localStorage.setItem('meowlish_pet_is_sleeping', 'false'); } catch {}
      onStateChange?.({ isSleeping: false, isSpeedFast });
    }

    walkTo(50, 56, () => {
      setAnimState('happy');
      sound.playCelebration();
      showSpeech('Mình có mặt ngay đây rồi nè! Bạn cần gì nào? 🐾');
      later(() => {
        isInteractingRef.current = false;
        setAnimState('idle');
      }, 1500);
    }, true);
  };

  // Toggle Sleep / Nap
  const handleToggleSleep = () => {
    sound.playClick();
    const next = !isSleeping;
    setIsSleeping(next);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('meowlish_pet_is_sleeping', next ? 'true' : 'false');
      }
    } catch {}
    if (next) {
      setAnimState('sleep');
      showSpeech('Khò khò... Chúc bạn học tiếng Anh tốt nhé, bé ngủ một lát nha... 💤');
    } else {
      setAnimState('idle');
      showSpeech('Oáp... Chào buổi sáng! Bé đã nạp đầy năng lượng rồi! ☀️');
    }
    onStateChange?.({ isSleeping: next, isSpeedFast });
    return next;
  };

  // Toggle Speed
  const handleToggleSpeed = () => {
    sound.playClick();
    const next = !isSpeedFast;
    setIsSpeedFast(next);
    onStateChange?.({ isSleeping, isSpeedFast: next });
    return next;
  };

  // Imperative handle for parent to control pet actions
  useImperativeHandle(ref, () => ({
    tossBall: handleTossBall,
    dropTreat: handleDropTreat,
    callPet: handleCallPet,
    toggleSleep: handleToggleSleep,
    toggleSpeed: handleToggleSpeed,
    performMapAction: handlePerformMapAction,
    goSwim: () => handlePerformMapAction('swim'),
    goClimb: () => handlePerformMapAction('climb'),
    goJump: () => handlePerformMapAction('jump'),
  }));

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none">
      {/* ================= IN-GAME TOP HUD BAR ================= */}
      <div className="absolute top-2 inset-x-2 z-30 flex items-start justify-between gap-1.5 sm:gap-2 pointer-events-none">
        {/* Left: Pet Info & Vitals Pill */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-[56%] sm:max-w-[46%] md:max-w-none bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-slate-900/60 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-2xl border border-white/15 text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.75)]">
          <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 grid place-items-center text-base sm:text-lg">🐾</div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black leading-tight">
              <span className="truncate">{petName}</span>
              <span className="shrink-0 text-[9px] px-1.5 py-[1px] rounded-md bg-emerald-500 text-white font-mono ring-1 ring-emerald-300/50">
                Lv.{level}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-slate-200 font-bold whitespace-nowrap">
              <span>🍗 {hunger}%</span>
              <span>💖 {happiness}%</span>
              <span className="text-amber-300 font-mono hidden sm:inline">{exp % 50}/50 EXP</span>
            </div>
          </div>
        </div>

        {/* Right: stacked coin counter + day/night cycle (one flex row => never collides on mobile) */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 px-2.5 sm:px-3 py-1.5 rounded-2xl border-b-2 border-amber-500 text-[11px] sm:text-xs font-black shadow-lg">
              <span>🪙</span>
              <span>{userCoins.toLocaleString()}</span>
            </div>
            {onSwitchPet && (
              <button
                onClick={onSwitchPet}
                className="btn-3d btn-3d-white px-2.5 py-1.5 min-h-[32px] text-xs font-black text-slate-800 cursor-pointer shadow-md flex items-center gap-1"
                title="Chọn nuôi thú cưng khác"
              >
                <span>🔄</span>
                <span className="hidden md:inline">Đổi Bé</span>
              </button>
            )}
          </div>

          {/* Time of Day Cycle Switcher (Ngày / Hoàng Hôn / Đêm) — lives in the HUD row so it can never overlap the coin chip */}
          <div className="flex items-center gap-0.5 bg-slate-950/70 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-lg">
            {([
              { key: 'day', icon: '☀️', label: 'Ngày', active: 'bg-amber-400 text-slate-950 shadow-md' },
              { key: 'sunset', icon: '🌇', label: 'Hoàng Hôn', active: 'bg-orange-500 text-white shadow-md' },
              { key: 'night', icon: '🌙', label: 'Đêm', active: 'bg-indigo-500 text-white shadow-md' },
            ] as const).map((mode) => (
              <button
                key={mode.key}
                onClick={(e) => {
                  e.stopPropagation();
                  setDayTimeMode(mode.key);
                }}
                className={`px-1.5 sm:px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                  dayTimeMode === mode.key ? mode.active : 'text-slate-300 hover:text-white'
                }`}
                title={`Chuyển cảnh: ${mode.label}`}
              >
                <span>{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= VIEWPORT-CONTAINED GAME ARENA ================= */}
      <div
        ref={containerRef}
        onClick={handleGroundClick}
        className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-emerald-950/85 ring-[3px] ring-emerald-400/70 shadow-[0_22px_45px_-20px_rgba(4,47,34,0.9)] cursor-crosshair select-none touch-none"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Environmental Atmospheric Lighting Overlay */}
        {dayTimeMode === 'sunset' && (
          <div className="absolute inset-0 z-35 bg-gradient-to-b from-orange-500/25 via-rose-600/15 to-amber-900/10 pointer-events-none transition-opacity duration-700" />
        )}
        {dayTimeMode === 'night' && (
          <div className="absolute inset-0 z-35 bg-gradient-to-b from-indigo-950/65 via-slate-950/50 to-slate-900/40 pointer-events-none transition-opacity duration-700">
            {/* Glowing Fireflies */}
            <div className="absolute top-1/4 left-1/5 w-2.5 h-2.5 rounded-full bg-yellow-300 blur-[1px] animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-1/2 left-3/4 w-2 h-2 rounded-full bg-emerald-300 blur-[1px] animate-ping" style={{ animationDuration: '4s' }} />
            <div className="absolute top-2/3 left-1/3 w-2 h-2 rounded-full bg-yellow-200 blur-[1px] animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute top-1/3 left-2/3 w-2.5 h-2.5 rounded-full bg-lime-300 blur-[1px] animate-ping" style={{ animationDuration: '3.5s' }} />
            {/* Moon in sky */}
            <div className="absolute top-4 left-6 text-3xl opacity-85 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">🌙</div>
          </div>
        )}

        {/* Ambient Falling Sakura Petals (Nostalgic Meadow Aura) */}
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
          <div className="absolute top-2 left-[12%] text-sm opacity-70 animate-bounce" style={{ animationDuration: '4s' }}>🌸</div>
          <div className="absolute top-8 left-[38%] text-xs opacity-60 animate-bounce" style={{ animationDuration: '5.5s' }}>🌸</div>
          <div className="absolute top-5 left-[64%] text-sm opacity-75 animate-bounce" style={{ animationDuration: '4.8s' }}>🌸</div>
          <div className="absolute top-12 left-[82%] text-xs opacity-65 animate-bounce" style={{ animationDuration: '6s' }}>🌸</div>
        </div>

        {/* ================= 1. EMERALD FARM (NÔNG TRẠI XANH) ================= */}
        {habitat === 'emerald_garden' && (
          <div className="absolute inset-0 overflow-hidden bg-[#3ec97b]">
            {/* Layer 1: meadow base gradient (light at the horizon, richer green toward the viewer) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, #7ee2a8 0%, #5ad792 20%, #45cd82 48%, #33bf74 78%, #2ab26b 100%)' }}
            />

            {/* Layer 2: soft mowed lawn stripes for depth */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.07]"
              style={{ backgroundImage: 'repeating-linear-gradient(101deg, rgba(255,255,255,0.6) 0 58px, rgba(0,0,0,0.5) 58px 116px)' }}
            />

            {/* Layer 3: distant rolling hills along the horizon */}
            <div className="absolute -top-3 left-[6%] w-56 h-24 rounded-[50%] bg-[#2ec27e] opacity-70 blur-[3px] pointer-events-none z-0" />
            <div className="absolute -top-5 left-[36%] w-72 h-28 rounded-[50%] bg-[#35d08a] opacity-60 blur-[3px] pointer-events-none z-0" />
            <div className="absolute -top-3 right-[5%] w-64 h-24 rounded-[50%] bg-[#2ebf79] opacity-65 blur-[3px] pointer-events-none z-0" />

            {/* Layer 4: sunlit clearings & shaded corners */}
            <div className="absolute top-[16%] left-[10%] w-72 h-40 rounded-full bg-emerald-100/25 blur-2xl pointer-events-none z-0" />
            <div className="absolute bottom-[4%] right-[8%] w-80 h-44 rounded-full bg-emerald-950/15 blur-2xl pointer-events-none z-0" />
            <div className="absolute bottom-[10%] left-[6%] w-64 h-36 rounded-full bg-emerald-950/10 blur-2xl pointer-events-none z-0" />

            {/* Layer 5: fine two-tone pixel grass texture */}
            <div
              className="absolute inset-0 opacity-35 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#15803d 1px, transparent 1px), radial-gradient(#86efac 1px, transparent 1px)`,
                backgroundSize: '18px 18px, 27px 27px',
                backgroundPosition: '0 0, 11px 14px',
              }}
            />

            {/* Layer 5b (2.5D): vệt nắng xiên cùng hướng + sương xa + cỏ tiền cảnh — absolute, không đổi layout */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 22%, rgba(255,255,255,0) 38%)' }}
            />
            <div
              className="absolute inset-x-0 top-[10%] h-10 pointer-events-none z-0 bg-gradient-to-b from-white/25 to-transparent blur-md"
            />
            <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none z-30 overflow-hidden opacity-90">
              <div className="absolute bottom-0 left-[4%] text-lg">🌱</div>
              <div className="absolute bottom-0 left-[22%] text-xl">🌿</div>
              <div className="absolute bottom-0 left-[47%] text-lg">🌱</div>
              <div className="absolute bottom-0 left-[68%] text-xl">🌿</div>
              <div className="absolute bottom-0 left-[88%] text-lg">🌱</div>
              <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-emerald-950/25 to-transparent" />
            </div>

            {/* Clouds drifting over the meadow */}
            <div className="absolute top-3 left-10 text-4xl opacity-50 pointer-events-none animate-pulse z-0" style={{ animationDuration: '6s' }}>☁️</div>
            <div className="absolute top-7 right-20 text-3xl opacity-40 pointer-events-none animate-pulse z-0" style={{ animationDuration: '8s' }}>☁️</div>
            <div className="absolute top-4 left-1/2 text-2xl opacity-40 pointer-events-none animate-pulse z-0" style={{ animationDuration: '7s' }}>☁️</div>

            {/* Layer 6: top perimeter — trimmed hedge, twin rails and a picket fence with ground shadow */}
            <div className="absolute top-0 inset-x-0 h-14 pointer-events-none z-0 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-11 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-700/70" />
              <div className="absolute inset-x-0 top-[10px] h-[4px] rounded-full bg-[#92400e]/85 shadow-[0_1px_0_rgba(0,0,0,0.25)]" />
              <div className="absolute inset-x-0 top-[26px] h-[4px] rounded-full bg-[#b45309]/85 shadow-[0_1px_0_rgba(0,0,0,0.25)]" />
              <div className="absolute inset-x-0 top-[6px] flex items-end justify-between px-1.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 sm:w-3 h-9 sm:h-10 rounded-t-[3px] border border-[#78350f]/70 bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 shadow-[0_2px_0_rgba(0,0,0,0.22)]"
                  />
                ))}
              </div>
              <div className="absolute inset-x-0 top-[46px] h-3 bg-gradient-to-b from-black/25 to-transparent blur-[2px]" />
            </div>

            {/* Bush with yellow flowers */}
            <div className="absolute top-[18%] left-[45%] pointer-events-none z-10 flex items-end drop-shadow-md">
              <div className="w-14 h-12 bg-emerald-800 rounded-full blur-[1px]"></div>
              <div className="w-10 h-10 bg-emerald-700 rounded-full -ml-6 mb-1"></div>
              <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full absolute top-3 left-4 shadow-sm"></div>
              <div className="w-2 h-2 bg-yellow-300 rounded-full absolute top-6 left-10 shadow-sm"></div>
            </div>

            {/* Red Tulip patch */}
            <div className="absolute top-[65%] left-[55%] pointer-events-none z-10 drop-shadow-md">
              <div className="w-20 h-10 bg-green-800 rounded-full blur-[1px]"></div>
              <div className="w-3 h-4 bg-red-500 rounded-t-full absolute top-1 left-4 shadow-sm"></div>
              <div className="w-3 h-4 bg-rose-500 rounded-t-full absolute top-3 left-10 shadow-sm"></div>
              <div className="w-3 h-4 bg-red-400 rounded-t-full absolute top-2 left-14 shadow-sm"></div>
            </div>

            {/* Mossy Rocks */}
            <div className="absolute top-[35%] left-[30%] pointer-events-none z-10 drop-shadow-md flex items-end">
              <div className="w-10 h-8 bg-slate-500 rounded-full"></div>
              <div className="w-6 h-5 bg-slate-400 rounded-full -ml-2 mb-1"></div>
              <div className="w-4 h-2 bg-emerald-600 rounded-full absolute top-2 left-2 opacity-80"></div>
            </div>

            {/* Pine Trees */}
            <div className="absolute top-[75%] left-[65%] pointer-events-none z-10 drop-shadow-xl opacity-90 text-4xl">🌲🌲</div>

            {/* Large Potted Plant */}
            <div className="absolute top-[85%] left-[40%] pointer-events-none z-20 text-3xl drop-shadow-md">🪴</div>

            {/* Dutch Windmill with Rotating Lattice Sails (Top-Left) */}
            <div
              data-testid="garden-windmill"
              onClick={(e) => onObjClick(e, 'windmill', 'windmill')}
              onTouchEnd={(e) => onObjTouch(e, 'windmill', 'windmill')}
              style={{ left: '16%', top: '22%', zIndex: EMERALD_FEET_Z.windmill }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cối xay gió Hà Lan xoay cánh quạt nan gỗ"
            >
              <DutchWindmillSVG scale={scaleObj(1.40)} />
              {pulseRing('windmill')}
              {windGustId > 0 && (
                <div key={windGustId} className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl animate-bounce pointer-events-none">💨</div>
              )}
            </div>

            {/* Grand Oak Tree with Climbing Ladder & Swing (Top-Right) */}
            <div
              data-testid="garden-swing"
              onClick={(e) => onObjClick(e, 'climb', 'oak')}
              onTouchEnd={(e) => onObjTouch(e, 'climb', 'oak')}
              style={{ left: '88%', top: '22%', zIndex: EMERALD_FEET_Z.oak }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform transition-transform hover:shadow-lg hover:scale-105"
              title="Cây đại thụ + Xích đu gỗ - Bấm để Bé trèo hái táo rồi ngồi xích đu đung đưa!"
            >
              <div key={shakeWrapKey('oak')} className={shakeWrapCls('oak')}>
                <GrandOakTreeSVG scale={scaleObj(1.40)} />
              </div>
              {pulseRing('oak')}
              {isSwinging && (
                <>
                  {/* Ghế xích đu đung đưa (con lắc) — cây đứng yên, chỉ ghế + Bé chuyển động */}
                  <div
                    className="absolute pointer-events-none"
                    style={{ left: '19.5%', top: '36%', width: '13%', height: '36%' }}
                  >
                    <div className="animate-swing-pendulum relative w-full h-full">
                      <div className="absolute top-0 left-[15%] w-[2px] h-[94%] bg-amber-900/80" />
                      <div className="absolute top-0 right-[15%] w-[2px] h-[94%] bg-amber-900/80" />
                      <div className="absolute bottom-0 left-0 right-0 h-[10%] min-h-[3px] rounded bg-amber-800 border border-amber-950" />
                    </div>
                  </div>
                  <div className="absolute top-[62%] left-1/2 -translate-x-1/2 text-sm animate-bounce pointer-events-none">🍎🍎</div>
                </>
              )}
            </div>

            {/* Farmhouse Villa with Smoking Chimney (Center-Left) */}
            <div
              data-testid="garden-villa"
              onClick={(e) => onObjClick(e, 'villa', 'villa')}
              onTouchEnd={(e) => onObjTouch(e, 'villa', 'villa')}
              style={{ left: '18%', top: '50%', zIndex: EMERALD_FEET_Z.villa }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Biệt thự nông trại mái ngói đỏ"
            >
              <FarmhouseVillaSVG scale={scaleObj(1.40)} />
              {pulseRing('villa')}
            </div>

            {/* Chicken Coop with Golden Haystack (Center) */}
            <div
              data-testid="garden-coop"
              onClick={(e) => onObjClick(e, 'coop', 'coop')}
              onTouchEnd={(e) => onObjTouch(e, 'coop', 'coop')}
              style={{ left: '48%', top: '40%', zIndex: EMERALD_FEET_Z.coop }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Chuồng gà & Đụn rơm - Bấm để cho gà ăn!"
            >
              <ChickenCoopSVG scale={scaleObj(1.40)} />
              {pulseRing('coop')}
            </div>

            {/* Bouncy Mushroom Trampoline (Center-Right) */}
            <div
              data-testid="garden-mushroom"
              onClick={(e) => onObjClick(e, 'jump', 'mushroom')}
              onTouchEnd={(e) => onObjTouch(e, 'jump', 'mushroom')}
              style={{ left: '76%', top: '48%', zIndex: EMERALD_FEET_Z.mushroom }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transition-transform duration-300 ${
                isBouncingMushroom
                  ? 'scale-y-70 scale-x-125'
                  : 'hover:scale-115'
              }`}
              title="Nấm lò xo ma thuật - Bấm để Bé bật nhảy lên trời!"
            >
              <BouncyMushroomSVG scale={scaleObj(1.40)} />
              {pulseRing('mushroom')}
            </div>

            {/* Veggie Garden Beds (Bottom-Left) — bồn hoa + luống rau */}
            <div
              data-testid="garden-flower"
              onClick={(e) => onObjClick(e, 'veggie', 'flower')}
              onTouchEnd={(e) => onObjTouch(e, 'veggie', 'flower')}
              style={{ left: '20%', top: '80%', zIndex: EMERALD_FEET_Z.flower }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform transition-transform ${bloomId > 0 ? 'scale-110' : 'hover:shadow-lg hover:scale-105'}`}
              title="Bồn hoa & Luống rau củ 4 mùa bội thu - Bấm để thu hoạch!"
            >
              <VeggiePatchSVG scale={scaleObj(1.40)} />
              {pulseRing('flower')}
              {bloomId > 0 && (
                <div key={bloomId} className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg animate-bounce pointer-events-none">🌷✨🥕</div>
              )}
            </div>

            {/* Lotus Pond with Pier, Lily Pads & Koi (Bottom-Right) — ao sen */}
            <div
              data-testid="garden-pond"
              onClick={(e) => onObjClick(e, 'swim', 'pond')}
              onTouchEnd={(e) => onObjTouch(e, 'swim', 'pond')}
              style={{ left: '80%', top: '78%', zIndex: EMERALD_FEET_Z.pond }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Đầm hồ sen sinh thái - Bấm để Bé nhảy xuống bơi lội mát rượi!"
            >
              <LotusPondSVG scale={scaleObj(1.40)} />
              {pulseRing('pond')}
              {pondSplashId > 0 && (
                <div key={pondSplashId} className="absolute top-[30%] left-1/2 -translate-x-1/2 text-2xl animate-bounce pointer-events-none">💦🐟</div>
              )}
            </div>

            {/* Fluttering Butterflies */}
            <div
              className="absolute z-40 pointer-events-none transition-all duration-1000 ease-in-out text-lg drop-shadow-md"
              style={{ left: `${butterflyPos.x}%`, top: `${butterflyPos.y}%` }}
            >
              🦋
            </div>
            <div
              className="absolute z-40 pointer-events-none transition-all duration-1200 ease-in-out text-base drop-shadow-md"
              style={{ left: `${100 - butterflyPos.x}%`, top: `${butterflyPos.y + 10}%` }}
            >
              🐝
            </div>
          </div>
        )}

        
        {/* ================= 2. SUNSET BEACH (BÃI BIỂN HOÀNG HÔN) ================= */}
        {habitat === 'sunset_beach' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#fcd34d] to-[#fde047] overflow-hidden">
            {/* Sunset Sky and Clouds */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#f97316] via-[#fb923c] to-transparent opacity-50 pointer-events-none z-0" />
            <div className="absolute top-10 left-[15%] text-4xl opacity-60 pointer-events-none animate-pulse" style={{ animationDuration: '7s' }}>☁️</div>
            <div className="absolute top-8 left-[75%] text-3xl opacity-50 pointer-events-none animate-pulse" style={{ animationDuration: '9s' }}>☁️</div>
            <div className="absolute top-14 left-[45%] text-2xl opacity-40 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}>☁️</div>
            <div className="absolute top-4 left-[85%] text-5xl opacity-80 pointer-events-none blur-[1px]">☀️</div>

            {/* Sand Textures */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none z-0"
              style={{
                backgroundImage: `radial-gradient(#b45309 1px, transparent 1px), radial-gradient(#d97706 1.5px, transparent 1.5px)`,
                backgroundSize: '20px 20px, 30px 30px',
                backgroundPosition: '0 0, 15px 15px',
              }}
            />

            {/* Decorative Fillers (Seashells, Starfish, Crabs, Driftwood) */}
            {/* Smooth sand dunes */}
            <div className="absolute top-[40%] left-[10%] w-[40%] h-[30%] bg-[#fbbf24] rounded-full opacity-30 blur-2xl pointer-events-none z-0 transform -rotate-6"></div>
            <div className="absolute top-[60%] right-[10%] w-[30%] h-[20%] bg-[#fbbf24] rounded-full opacity-30 blur-2xl pointer-events-none z-0 transform rotate-12"></div>

            {/* Seashells & Starfish Clusters */}
            <div className="absolute top-[38%] left-[25%] pointer-events-none z-0 flex items-center gap-1 drop-shadow-sm opacity-90">
              <div className="text-xl">🐚</div>
              <div className="w-2 h-2 bg-rose-400 rounded-full mt-2"></div>
            </div>
            <div className="absolute top-[65%] left-[15%] pointer-events-none z-0 flex items-center gap-1 drop-shadow-sm opacity-90">
              <div className="text-xl">⭐</div>
              <div className="text-lg mt-2 -ml-2">🐚</div>
            </div>
            
            {/* Crabs & Driftwood */}
            <div className="absolute top-[45%] left-[75%] pointer-events-none z-10 flex flex-col items-center drop-shadow-sm">
              <div className="text-2xl animate-pulse" style={{animationDuration: '3s'}}>🦀</div>
            </div>
            <div className="absolute top-[40%] left-[5%] pointer-events-none z-10 flex items-end drop-shadow-md">
              <div className="text-3xl">🪵</div>
              <div className="w-3 h-2 bg-emerald-600 rounded-full mb-1 -ml-2"></div>
            </div>
            <div className="absolute top-[85%] left-[85%] pointer-events-none z-10 text-xl">⭐</div>

            {/* Tropical Shrubs */}
            <div className="absolute top-[35%] left-[90%] pointer-events-none z-10 drop-shadow-md flex items-center">
              <div className="w-12 h-8 bg-emerald-800 rounded-full"></div>
              <div className="text-xl absolute top-0 left-2">🥥</div>
            </div>
            <div className="absolute top-[55%] left-[85%] pointer-events-none z-10 text-3xl drop-shadow-lg opacity-90">🌴</div>

            {/* Ocean Waves */}
            <div
              onClick={(e) => onObjClick(e, 'surf', 'ocean')}
              onTouchEnd={(e) => onObjTouch(e, 'surf', 'ocean')}
              className="absolute top-0 left-0 right-0 h-32 z-10 cursor-pointer touch-manipulation min-h-[44px] overflow-hidden group shadow-lg"
              title="Vùng biển nhiệt đới tràn hàng ngang - Bấm để Bé lướt sóng & ngắm cá heo!"
            >
              <FullWidthOceanWavesSVG height={128} />
              {pulseRing('ocean')}
            </div>

            {/* Flying Seagull particle */}
            <div
              className="absolute z-40 pointer-events-none transition-all duration-1000 ease-in-out text-xl drop-shadow-md"
              style={{ left: `${seagullPos.x}%`, top: `${seagullPos.y}%` }}
            >
              🕊️
            </div>

            {/* Coastal Lighthouse on Cliff Rock (Top-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'lighthouse', 'lighthouse')}
              onTouchEnd={(e) => onObjTouch(e, 'lighthouse', 'lighthouse')}
              style={{ left: '16%', top: '26%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Ngọn hải đăng xoay đèn rực rỡ"
            >
              <LighthouseSVG scale={scaleObj(1.40)} />
              {pulseRing('lighthouse')}
            </div>

            {/* Tropical Coconut Palm Tree (Top-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'climb', 'palm')}
              onTouchEnd={(e) => onObjTouch(e, 'climb', 'palm')}
              style={{ left: '86%', top: '26%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cây dừa nhiệt đới - Bấm để Bé leo hái dừa xiêm!"
            >
              <div key={shakeWrapKey('palm')} className={shakeWrapCls('palm')}>
                <PalmTreeSVG scale={scaleObj(1.40)} />
              </div>
              {pulseRing('palm')}
            </div>

            {/* Beach Volleyball Court (Center) */}
            <div
              onClick={(e) => onObjClick(e, 'volleyball', 'volleyball')}
              onTouchEnd={(e) => onObjTouch(e, 'volleyball', 'volleyball')}
              style={{ left: '50%', top: '52%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Sân bóng chuyền bãi biển - Bấm để Bé đập bóng ăn điểm!"
            >
              <div key={shakeWrapKey('volleyball')} className={shakeWrapCls('volleyball')}>
                <BeachVolleyballSVG scale={scaleObj(1.40)} />
              </div>
              {pulseRing('volleyball')}
            </div>

            {/* Bonfire, Campfire Pit & Sandcastle (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'sandcastle', 'sandcastle')}
              onTouchEnd={(e) => onObjTouch(e, 'sandcastle', 'sandcastle')}
              style={{ left: '20%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Lâu đài cát & Lửa trại bãi biển - Bấm để vui chơi!"
            >
              <SandcastleBonfireSVG scale={scaleObj(1.40)} />
              {pulseRing('sandcastle')}
            </div>

            {/* Tropical Tiki Bar Cabana & Surfboard (Bottom-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'tiki', 'tiki')}
              onTouchEnd={(e) => onObjTouch(e, 'tiki', 'tiki')}
              style={{ left: '82%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Quầy Tiki Bar nhiệt đới - Bấm để uống nước dừa mát lạnh!"
            >
              <TikiBarCabanaSVG scale={scaleObj(1.40)} />
              {pulseRing('tiki')}
            </div>
          </div>
        )}

        {/* ================= 3. COZY DEV DEN (CĂN PHÒNG IT DEV) ================= */}
        {habitat === 'cozy_den' && (
          <div className="absolute inset-0 bg-[#78350f] overflow-hidden">
            {/* Parquet Floor Pattern */}
            <div
              className="absolute inset-0 bg-[#d97706]"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, #b45309, #b45309 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, #b45309, #b45309 1px, transparent 1px, transparent 36px)`,
              }}
            />
            
            {/* Soft Fluffy Carpet */}
            <div className="absolute top-[40%] left-[25%] right-[25%] bottom-[10%] bg-[#cbd5e1] rounded-3xl opacity-80 shadow-inner z-0 border-2 border-[#94a3b8] pointer-events-none" style={{
                backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                backgroundSize: '10px 10px',
            }}></div>

            {/* Window Light Ray (Late Afternoon) */}
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#fef08a] to-transparent opacity-20 transform -skew-x-12 z-0 pointer-events-none"></div>

            {/* Ceiling Warm Ambient Light */}
            <div className="absolute top-[-20px] left-[50%] -translate-x-1/2 w-[300px] h-[150px] bg-[#fef08a] rounded-full opacity-30 blur-[40px] pointer-events-none z-0"></div>

            {/* RGB LED Backlight Behind Workstation */}
            <div className="absolute top-[25%] left-[50%] -translate-x-1/2 w-[180px] h-[80px] rounded-full blur-[30px] opacity-40 animate-pulse pointer-events-none z-0" style={{ animationDuration: '4s', backgroundColor: '#a855f7' }}></div>
            <div className="absolute top-[25%] left-[40%] w-[100px] h-[60px] rounded-full blur-[25px] opacity-50 animate-pulse pointer-events-none z-0" style={{ animationDuration: '3s', backgroundColor: '#38bdf8' }}></div>

            {/* Scattered Items (Books, Coffee, Notes) - Replaced with Rich CSS */}
            {/* Persian fluffy rug (thảm lông Ba Tư) */}
            <div className="absolute top-[60%] left-[50%] -translate-x-1/2 w-[60%] h-[35%] bg-gradient-to-br from-rose-900 via-rose-800 to-rose-900 rounded-[40px] opacity-90 shadow-lg z-0 border-4 border-rose-950 flex items-center justify-center pointer-events-none">
              <div className="w-[90%] h-[80%] border-2 border-dashed border-rose-400 rounded-[30px] opacity-50"></div>
              <div className="absolute w-[40%] h-[40%] border border-rose-300 rounded-full opacity-30"></div>
            </div>

            {/* Oak Wood Floor Planks (Ván sàn) */}
            <div className="absolute top-[50%] left-[20%] w-[10%] h-[2%] bg-amber-900 rounded-sm opacity-50 z-0 rotate-12"></div>
            <div className="absolute top-[70%] left-[80%] w-[12%] h-[2%] bg-amber-900 rounded-sm opacity-40 z-0 -rotate-6"></div>

            {/* Monstera plant (cây Monstera) */}
            <div className="absolute top-[45%] left-[25%] pointer-events-none z-10 flex items-end drop-shadow-lg">
              <div className="w-8 h-10 bg-amber-800 rounded-b-lg rounded-t-sm z-10"></div>
              <div className="absolute bottom-8 -left-4 w-12 h-12 bg-emerald-700 rounded-full opacity-90 transform -rotate-12"></div>
              <div className="absolute bottom-10 left-2 w-10 h-10 bg-emerald-600 rounded-full opacity-90 transform rotate-12"></div>
              <div className="absolute bottom-12 -left-1 w-14 h-14 bg-green-800 rounded-full opacity-95"></div>
            </div>

            {/* Fairy lights (đèn dây) */}
            <div className="absolute top-[10%] left-0 w-full h-[50%] pointer-events-none z-0">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0 20 Q 25 40 50 10 T 100 30" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.5"/>
                <circle cx="20" cy="25" r="1.5" fill="#fef08a" className="animate-pulse" />
                <circle cx="40" cy="18" r="1.5" fill="#fef08a" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                <circle cx="60" cy="12" r="1.5" fill="#fef08a" className="animate-pulse" style={{ animationDelay: '1s' }} />
                <circle cx="80" cy="23" r="1.5" fill="#fef08a" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              </svg>
            </div>

            {/* Bookshelf with Brass Rail & Rolling Ladder (Top-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'climb', 'bookshelf')}
              onTouchEnd={(e) => onObjTouch(e, 'climb', 'bookshelf')}
              style={{ left: '18%', top: '28%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Kệ sách thuật toán & thang lăn - Bấm để trèo thang đọc sách!"
            >
              <LibraryBookshelfSVG scale={scaleObj(1.37)} />
              {pulseRing('bookshelf')}
            </div>

            {/* Dual-Monitor Developer Workstation (Top-Center) — máy tính ngồi code */}
            <div
              data-testid="garden-computer"
              onClick={(e) => onObjClick(e, 'code', 'workstation')}
              onTouchEnd={(e) => onObjTouch(e, 'code', 'workstation')}
              style={{ left: '50%', top: '28%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Dàn máy dual monitor - Bấm để Bé NGỒI code, nhận EXP!"
            >
              <DevWorkstationSVG scale={scaleObj(1.40)} />
              {pulseRing('workstation')}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black bg-white/90 text-slate-800 px-1.5 py-px rounded-full border border-indigo-300 pointer-events-none whitespace-nowrap">💻 Ngồi code +EXP</div>
            </div>

            {/* Enterprise 42U Server Rack (Top-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'server', 'server')}
              onTouchEnd={(e) => onObjTouch(e, 'server', 'server')}
              style={{ left: '84%', top: '28%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Tủ server rack 42U đèn LED nhấp nháy - Bấm để kiểm tra hạ tầng và uptime!"
            >
              <ServerRackSVG scale={scaleObj(1.35)} />
              {pulseRing('server')}
            </div>

            {/* Mobile Scrum Kanban Whiteboard (Center) */}
            <div
              onClick={(e) => onObjClick(e, 'kanban', 'kanban')}
              onTouchEnd={(e) => onObjTouch(e, 'kanban', 'kanban')}
              style={{ left: '50%', top: '54%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Bảng Scrum Kanban tiến độ dự án - Bấm để Bé kiểm tra sprint!"
            >
              <ScrumKanbanWhiteboardSVG scale={scaleObj(1.30)} />
              {pulseRing('kanban')}
            </div>

            {/* Giant Plush Velvet Beanbag Couch (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'beanbag', 'beanbag')}
              onTouchEnd={(e) => onObjTouch(e, 'beanbag', 'beanbag')}
              style={{ left: '20%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Đệm lười Beanbag êm ái - Bấm để Bé nhún nhảy cực vui!"
            >
              <BeanbagLoungeSVG scale={scaleObj(1.12)} isBouncing={isBouncingBeanbag} />
              {pulseRing('beanbag')}
            </div>

            {/* Espresso Bar Machine & Pizza Kitchenette (Bottom-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'coffee', 'coffee')}
              onTouchEnd={(e) => onObjTouch(e, 'coffee', 'coffee')}
              style={{ left: '82%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Quầy pha cafe Espresso & Pizza - Bấm để nạp năng lượng!"
            >
              <EspressoBarKitchenetteSVG scale={scaleObj(1.35)} />
              {pulseRing('coffee')}
            </div>
          </div>
        )}

        {habitat === 'sky_castle' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#4f46e5] overflow-hidden">
            {/* Celestial Background Elements */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#4c1d95] via-[#5b21b6] to-transparent opacity-60 pointer-events-none z-0" />
            
            {/* Sparkling Stars */}
            <div className="absolute top-[10%] left-[20%] pointer-events-none animate-ping" style={{ animationDuration: '3s' }}><div className="w-2 h-2 bg-yellow-100 rounded-full blur-[1px]"></div></div>
            <div className="absolute top-[15%] left-[80%] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}><div className="w-3 h-3 bg-yellow-200 rotate-45 transform"></div></div>
            <div className="absolute top-[5%] left-[50%] pointer-events-none animate-pulse" style={{ animationDuration: '2s' }}><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
            <div className="absolute top-[30%] left-[10%] pointer-events-none animate-ping" style={{ animationDuration: '5s' }}><div className="w-2 h-2 bg-yellow-300 rotate-45 transform"></div></div>
            <div className="absolute top-[25%] left-[90%] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}><div className="w-2.5 h-2.5 bg-yellow-100 rounded-full blur-[1px]"></div></div>
            <div className="absolute top-[45%] left-[85%] pointer-events-none animate-ping" style={{ animationDuration: '4s' }}><div className="w-4 h-4 bg-yellow-200 rotate-45 transform blur-[1px]"></div></div>
            <div className="absolute top-[35%] left-[45%] pointer-events-none animate-pulse" style={{ animationDuration: '3s' }}><div className="w-2 h-2 bg-white rounded-full"></div></div>

            {/* Drifting Clouds (CSS Clusters) */}
            <div className="absolute top-[5%] left-[5%] pointer-events-none animate-pulse flex items-center" style={{ animationDuration: '8s' }}>
              <div className="w-12 h-6 bg-indigo-200 rounded-full opacity-30 blur-[2px]"></div>
            </div>
            <div className="absolute top-[12%] left-[85%] pointer-events-none animate-pulse flex items-center" style={{ animationDuration: '10s' }}>
              <div className="w-16 h-8 bg-indigo-300 rounded-full opacity-20 blur-[3px]"></div>
            </div>
            <div className="absolute top-[22%] left-[65%] pointer-events-none animate-pulse flex items-center" style={{ animationDuration: '12s' }}>
              <div className="w-20 h-10 bg-indigo-200 rounded-full opacity-10 blur-[4px]"></div>
            </div>
            <div className="absolute top-[60%] left-[8%] pointer-events-none animate-pulse flex items-center" style={{ animationDuration: '9s' }}>
              <div className="w-14 h-6 bg-indigo-300 rounded-full opacity-20 blur-[2px]"></div>
            </div>

            {/* Ambient Nebula Aura */}
            <div className="absolute top-[15%] left-[30%] w-64 h-32 bg-[#818cf8] rounded-full opacity-10 blur-[20px] pointer-events-none z-0"></div>
            <div className="absolute top-[45%] right-[20%] w-48 h-48 bg-[#c084fc] rounded-full opacity-10 blur-[30px] pointer-events-none z-0"></div>

            {/* Cloud/Marble Floor Texture */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none z-0"
              style={{
                backgroundImage: `radial-gradient(#c7d2fe 1px, transparent 1px), radial-gradient(#e0e7ff 2px, transparent 2px)`,
                backgroundSize: '24px 24px, 40px 40px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            {/* Shimmering Crystal Sky Citadel (Top-Center) */}
            <div
              onClick={(e) => onObjClick(e, 'castle', 'castle')}
              onTouchEnd={(e) => onObjTouch(e, 'castle', 'castle')}
              style={{ left: '50%', top: '22%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Lâu đài pha lê trên mây - Bấm để Bé bay lên cổng thành!"
            >
              <CrystalCastleSVG scale={scaleObj(1.40)} />
              {pulseRing('castle')}
            </div>

            {/* Rainbow Crystal Arch (Upper-Right) — cầu vồng đi bộ được */}
            <div
              data-testid="garden-rainbow"
              onClick={(e) => onObjClick(e, 'rainbow', 'rainbow')}
              onTouchEnd={(e) => onObjTouch(e, 'rainbow', 'rainbow')}
              style={{ left: '72%', top: '30%' }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform transition-transform ${isRainbowWalking ? 'scale-105' : 'hover:shadow-lg hover:scale-105'}`}
              title="Cầu vồng pha lê 7 màu - Bấm để Bé ĐI BỘ qua cầu vồng!"
            >
              <RainbowBridgeArchSVG scale={scaleObj(1.40)} />
              {pulseRing('rainbow')}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black bg-white/90 text-slate-800 px-1.5 py-px rounded-full border border-pink-300 pointer-events-none whitespace-nowrap">🌈 Đi bộ qua cầu</div>
            </div>

            {/* Ascending Starry Cloud Stepping Stones (Upper-Left) — cầu trượt mây */}
            <div
              data-testid="garden-slide"
              onClick={(e) => onObjClick(e, 'climb', 'slide')}
              onTouchEnd={(e) => onObjTouch(e, 'climb', 'slide')}
              style={{ left: '28%', top: '38%' }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform transition-transform ${isSliding ? 'scale-110' : 'hover:shadow-lg hover:scale-105'}`}
              title="Cầu trượt mây bồng bềnh - Bấm để Bé TRƯỢT từ đỉnh xuống!"
            >
              <StarryCloudPlatformSVG scale={scaleObj(1.37)} />
              {pulseRing('slide')}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black bg-white/90 text-slate-800 px-1.5 py-px rounded-full border border-sky-300 pointer-events-none whitespace-nowrap">🛝 Trượt xuống</div>
            </div>

            {/* Celestial Marble Angel Fountain (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'fountain', 'fountain')}
              onTouchEnd={(e) => onObjTouch(e, 'fountain', 'fountain')}
              style={{ left: '20%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Đài phun nước thiên thần sao - Bấm để tắm mát lấp lánh!"
            >
              <CelestialAngelFountainSVG scale={scaleObj(1.37)} />
              {pulseRing('fountain')}
            </div>

            {/* Gemstone Treasure Chest (Bottom-Right) — rương báu mở nắp */}
            <div
              data-testid="garden-treasure"
              onClick={(e) => onObjClick(e, 'treasure', 'skytreasure')}
              onTouchEnd={(e) => onObjTouch(e, 'treasure', 'skytreasure')}
              style={{ left: '80%', top: '78%' }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform transition-transform ${isSkyTreasureOpen ? 'scale-110' : 'hover:shadow-lg hover:scale-105'}`}
              title="Rương ngọc báu tri thức - Bấm để MỞ rương, vàng bay ra!"
            >
              <div className="relative" key={shakeWrapKey('skytreasure')}>
                <div className={shakeWrapCls('skytreasure')}>
                  <GemstoneTreasureChestSVG scale={scaleObj(1.37)} />
                </div>
                {pulseRing('skytreasure')}
                {isSkyTreasureOpen && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce pointer-events-none">✨💎🪙</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. THOUSAND SUNNY (BOONG TÀU HẢI TẶC ONE PIECE) ================= */}
        {habitat === 'thousand_sunny' && (
          <div className="absolute inset-0 bg-[#0369a1] overflow-hidden">
            {/* Animated Sky Background & Clouds */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#38bdf8] to-transparent opacity-80 pointer-events-none z-0" />
            <div className="absolute top-[5%] left-[20%] w-20 h-10 bg-white rounded-full opacity-80 blur-[2px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute top-[8%] left-[70%] w-16 h-8 bg-white rounded-full opacity-70 blur-[1px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute top-[15%] left-[45%] w-24 h-12 bg-white rounded-full opacity-60 blur-[3px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            {/* Surrounding Deep Blue Ocean Waves (Animated Bobbing) */}
            <div className="absolute inset-0 opacity-45 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(#38bdf8 2px, transparent 2px), radial-gradient(#0ea5e9 2px, transparent 2px)`,
                  backgroundSize: '30px 30px, 40px 40px',
                  backgroundPosition: '0 0, 15px 15px',
                }}
              />
            </div>

            {/* Animated Water Bubbles & Sea foam */}
            <div className="absolute bottom-[5%] left-[10%] w-3 h-3 rounded-full border border-sky-200 opacity-60 pointer-events-none animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute bottom-[15%] left-[85%] w-4 h-4 rounded-full border border-sky-300 opacity-70 pointer-events-none animate-bounce" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-[8%] left-[40%] w-2 h-2 rounded-full border border-sky-200 opacity-50 pointer-events-none animate-ping" style={{ animationDuration: '5s' }}></div>

            {/* Flying Ocean Seagulls */}
            <div
              className="absolute z-40 pointer-events-none transition-all duration-1200 ease-in-out text-2xl drop-shadow-md"
              style={{ left: `${seagullPos.x}%`, top: `${seagullPos.y}%` }}
            >
              🕊️
            </div>
            <div
              className="absolute z-40 pointer-events-none transition-all duration-1000 ease-in-out text-lg drop-shadow-md"
              style={{ left: `${100 - seagullPos.x}%`, top: `${seagullPos.y + 6}%` }}
            >
              🕊️
            </div>

            {/* Oval Wooden Ship Deck Planks Center Area */}
            <div
              className="absolute inset-x-8 top-12 bottom-6 rounded-[48px] border-8 border-[#451a03] bg-[#d97706] shadow-2xl overflow-hidden z-0"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, #b45309, #b45309 2px, transparent 2px, transparent 24px), repeating-linear-gradient(90deg, #b45309, #b45309 1px, transparent 1px, transparent 48px)`,
              }}
            >
              {/* Nautical Deck Compass Rose in Deck Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none text-[120px] font-black">
                🧭
              </div>
            </div>

            {/* Ship Ropes & Rigging Decorations */}
            <div className="absolute top-[40%] left-[15%] pointer-events-none z-10 w-16 h-1 bg-[#854d0e] rotate-45 border-y border-[#78350f]"></div>
            <div className="absolute top-[60%] left-[80%] pointer-events-none z-10 w-24 h-1 bg-[#854d0e] -rotate-45 border-y border-[#78350f]"></div>
            
            {/* Stacked Pirate Barrels */}
            <div className="absolute top-[20%] left-[30%] pointer-events-none z-10 flex items-end drop-shadow-md">
              <div className="w-10 h-12 bg-amber-800 rounded-lg border-2 border-amber-950 flex flex-col justify-evenly overflow-hidden">
                <div className="w-full h-0.5 bg-amber-950 opacity-50"></div>
                <div className="w-full h-0.5 bg-amber-950 opacity-50"></div>
                <div className="w-full h-0.5 bg-amber-950 opacity-50"></div>
              </div>
              <div className="w-8 h-10 bg-amber-700 rounded-lg border-2 border-amber-950 -ml-4 flex flex-col justify-evenly overflow-hidden">
                <div className="w-full h-0.5 bg-amber-950 opacity-50"></div>
                <div className="w-full h-0.5 bg-amber-950 opacity-50"></div>
              </div>
            </div>

            {/* Lifebuoys */}
            <div className="absolute top-[65%] left-[10%] pointer-events-none z-10 w-12 h-12 rounded-full border-4 border-red-500 bg-transparent flex items-center justify-center transform -rotate-12 drop-shadow-md">
              <div className="w-8 h-8 rounded-full border-4 border-white"></div>
            </div>
            
            <div className="absolute top-[20%] left-[65%] pointer-events-none z-10 animate-bounce" style={{ animationDuration: '2s' }}>
              <div className="w-10 h-10 rounded-full border-4 border-red-500 bg-white flex items-center justify-center drop-shadow-md">
                <div className="w-4 h-4 rounded-full border-2 border-red-500"></div>
              </div>
            </div>

            {/* Pirate Main Mast & Crow's Nest with Straw Hat Jolly Roger (Top-Center) */}
            <div
              onClick={(e) => onObjClick(e, 'mast', 'mast')}
              onTouchEnd={(e) => onObjTouch(e, 'mast', 'mast')}
              style={{ left: '50%', top: '25%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cột buồm Mũ Rơm & Đài quan sát - Bấm để Bé trèo lên hóng gió biển!"
            >
              <PirateMastJollyRogerSVG scale={scaleObj(1.37)} />
              {pulseRing('mast')}
            </div>

            {/* Naval Cannon & Cola Barrels (Top-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'cannon', 'cannon')}
              onTouchEnd={(e) => onObjTouch(e, 'cannon', 'cannon')}
              style={{ left: '20%', top: '30%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Khẩu đại bác mạ đồng & Thùng Cola sồi - Bấm để nạp năng lượng!"
            >
              <PirateCannonAndRumBarrelsSVG scale={scaleObj(1.35)} />
              {pulseRing('cannon')}
            </div>

            {/* Nami's Mikan Tangerine Trees (Top-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'tangerine', 'tangerine')}
              onTouchEnd={(e) => onObjTouch(e, 'tangerine', 'tangerine')}
              style={{ left: '82%', top: '30%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Vườn cam Mikan của hoa tiêu Nami - Bấm để ăn cam ngọt lịm!"
            >
              <div key={shakeWrapKey('tangerine')} className={shakeWrapCls('tangerine')}>
                <NamiTangerineTreesSVG scale={scaleObj(1.35)} />
              </div>
              {pulseRing('tangerine')}
            </div>

            {/* Ship Steering Helm Wheel & Balusters (Center-Bottom) */}
            <div
              onClick={(e) => onObjClick(e, 'helm', 'helm')}
              onTouchEnd={(e) => onObjTouch(e, 'helm', 'helm')}
              style={{ left: '50%', top: '74%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Bánh lái tàu Thousand Sunny - Bấm để Bé bẻ lái hướng tới Grand Line!"
            >
              <PirateHelmAndDeckRailingSVG scale={scaleObj(1.40)} />
              {pulseRing('helm')}
            </div>

            {/* Sunny Lion Figurehead on Bow Prow (Bottom-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'jump', 'lion')}
              onTouchEnd={(e) => onObjTouch(e, 'jump', 'lion')}
              style={{ left: '84%', top: '76%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Đầu sư tử Sunny vàng óng - Bấm để Bé nhảy lên bờm hoa hướng dương!"
            >
              <ThousandSunnyLionFigureheadSVG scale={scaleObj(1.40)} />
              {pulseRing('lion')}
            </div>

            {/* Pirate Spilling Treasure Chest (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'treasure', 'sunnytreasure')}
              onTouchEnd={(e) => onObjTouch(e, 'treasure', 'sunnytreasure')}
              style={{ left: '18%', top: '76%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-110 transition-transform"
              title="Rương vàng kho báu hải tặc - Bấm để mở nắp tung vàng!"
            >
              <div key={shakeWrapKey('sunnytreasure')} className={shakeWrapCls('sunnytreasure')}>
                <PirateTreasureChestSVG scale={scaleObj(1.18)} isOpen={isSunnyTreasureOpen} />
              </div>
              {pulseRing('sunnytreasure')}
            </div>
          </div>
        )}

        {/* ================= 6. KONOHA VALLEY (THUNG LŨNG NHẪN GIẢ LÀNG LÁ) ================= */}
        {habitat === 'konoha_valley' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#fde68a] to-[#fcd34d] overflow-hidden">
            {/* Sunset Gradient Aura behind Hokage Rock */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#fb923c] via-[#f59e0b] to-transparent opacity-50 pointer-events-none z-0" />
            <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-64 h-32 bg-[#ef4444] rounded-full blur-[40px] opacity-20 pointer-events-none z-0" />

            {/* Kitchen Smoke (Ichiraku Ramen) */}
            <div className="absolute top-[25%] left-[18%] text-3xl opacity-60 pointer-events-none animate-pulse z-0" style={{ animationDuration: '4s' }}>💨</div>
            <div className="absolute top-[20%] left-[20%] text-2xl opacity-40 pointer-events-none animate-bounce z-0" style={{ animationDuration: '3s' }}>💨</div>

            {/* Fireflies / Đom đóm ban đêm */}
            <div className="absolute bottom-[20%] left-[15%] text-xs opacity-80 pointer-events-none animate-ping" style={{ animationDuration: '2s' }}>✨</div>
            <div className="absolute bottom-[30%] left-[85%] text-sm opacity-90 pointer-events-none animate-ping" style={{ animationDuration: '3s' }}>✨</div>
            <div className="absolute top-[40%] left-[10%] text-xs opacity-70 pointer-events-none animate-ping" style={{ animationDuration: '4s' }}>✨</div>
            <div className="absolute top-[45%] right-[10%] text-sm opacity-80 pointer-events-none animate-pulse" style={{ animationDuration: '2.5s' }}>🌟</div>

            {/* Japanese Garden Stone Path & Grass Texture */}
            <div
              className="absolute inset-0 bg-[#84cc16] opacity-90 z-0"
              style={{
                backgroundImage: `radial-gradient(#65a30d 1.5px, transparent 1.5px), radial-gradient(#4d7c0f 1.5px, #84cc16 1.5px)`,
                backgroundSize: '18px 18px',
                backgroundPosition: '0 0, 9px 9px',
              }}
            />

            {/* Scatter Elements (Stones, Small Bamboo) */}
            {/* Shuriken Wooden Fence */}
            <div className="absolute top-[65%] left-[25%] pointer-events-none z-10 flex items-end drop-shadow-md">
              <div className="w-2 h-10 bg-amber-900 rounded-sm"></div>
              <div className="w-10 h-2 bg-amber-800 absolute top-2 -left-4"></div>
              <div className="w-10 h-2 bg-amber-800 absolute top-6 -left-4"></div>
              <div className="w-2 h-10 bg-amber-900 rounded-sm ml-6"></div>
              <div className="w-3 h-3 bg-slate-300 rounded-full absolute top-4 left-3 rotate-45 transform"></div>
            </div>

            {/* Bamboo Clusters */}
            <div className="absolute top-[50%] left-[70%] pointer-events-none z-10 flex items-end drop-shadow-md">
              <div className="w-2 h-16 bg-green-500 rounded-sm transform rotate-3"></div>
              <div className="w-2 h-14 bg-green-600 rounded-sm ml-1 transform -rotate-3"></div>
              <div className="w-2 h-12 bg-emerald-500 rounded-sm ml-1"></div>
            </div>

            {/* Ninja Lantern */}
            <div className="absolute top-[35%] left-[40%] pointer-events-none z-10 drop-shadow-md">
              <div className="w-6 h-8 bg-red-600 rounded-sm flex items-center justify-center border-t-2 border-b-2 border-slate-900">
                <div className="w-3 h-3 bg-yellow-300 rounded-full blur-[1px]"></div>
              </div>
            </div>

            {/* Cobblestone Dirt Path to ramen and torii */}
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 w-48 h-12 bg-[#854d0e] rounded-full blur-[10px] opacity-30 pointer-events-none z-0"></div>
            <div className="absolute top-[52%] left-[45%] w-6 h-4 bg-slate-400 rounded-full opacity-60 z-0"></div>
            <div className="absolute top-[50%] left-[55%] w-5 h-3 bg-slate-400 rounded-full opacity-60 z-0"></div>
            <div className="absolute top-[53%] left-[50%] w-7 h-4 bg-slate-500 rounded-full opacity-60 z-0"></div>

            {/* Drifting Sakura Cherry Blossom Petals & Bamboo Leaves */}
            <div
              className="absolute z-40 pointer-events-none transition-all duration-1000 ease-in-out text-2xl drop-shadow-sm"
              style={{ left: `${sakuraPetalPos.x}%`, top: `${sakuraPetalPos.y}%` }}
            >
              🌸
            </div>
            <div
              className="absolute z-40 pointer-events-none transition-all duration-1200 ease-in-out text-lg drop-shadow-sm"
              style={{ left: `${100 - sakuraPetalPos.x}%`, top: `${sakuraPetalPos.y + 12}%` }}
            >
              🍃
            </div>
            <div
              className="absolute z-40 pointer-events-none transition-all duration-[1500ms] ease-in-out text-xl drop-shadow-sm"
              style={{ left: `${(sakuraPetalPos.x + 30) % 100}%`, top: `${(sakuraPetalPos.y + 20) % 100}%` }}
            >
              🌸
            </div>

            {/* Hokage Rock Monument Mountain Silhouette (Top-Center) */}
            <div
              onClick={(e) => onObjClick(e, 'hokage', 'hokage')}
              onTouchEnd={(e) => onObjTouch(e, 'hokage', 'hokage')}
              style={{ left: '50%', top: '22%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Vách đá chạm khắc 4 tượng Hokage - Bấm để Bé leo lên đỉnh núi!"
            >
              <HokageRockMonumentSVG scale={scaleObj(1.37)} />
              {pulseRing('hokage')}
            </div>

            {/* Ichiraku Ramen Shop Stall (Top-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'ramen', 'ramen')}
              onTouchEnd={(e) => onObjTouch(e, 'ramen', 'ramen')}
              style={{ left: '18%', top: '34%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Tiệm mì Ichiraku Ramen - Bấm để thưởng thức bát ramen nóng hổi!"
            >
              <IchirakuRamenShopSVG scale={scaleObj(1.40)} />
              {pulseRing('ramen')}
            </div>

            {/* Red Torii Gate & Bamboo Grove (Top-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'torii', 'torii')}
              onTouchEnd={(e) => onObjTouch(e, 'torii', 'torii')}
              style={{ left: '84%', top: '32%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cổng Torii đỏ rực & Rừng trúc - Bấm để thắp sáng Ý chí của Lửa!"
            >
              <BambooToriiShrineSVG scale={scaleObj(1.37)} />
              {pulseRing('torii')}
            </div>

            {/* Ninja Training Target Post & Kunai (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'target', 'target')}
              onTouchEnd={(e) => onObjTouch(e, 'target', 'target')}
              style={{ left: '20%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Bia gỗ tập luyện phóng Kunai & Shuriken - Bấm để phóng phi tiêu!"
            >
              <NinjaTrainingPostSVG scale={scaleObj(1.40)} isHit={isNinjaTargetHit} />
              {pulseRing('target')}
            </div>

            {/* Onsen Natural Hot Spring Pool (Bottom-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'onsen', 'onsen')}
              onTouchEnd={(e) => onObjTouch(e, 'onsen', 'onsen')}
              style={{ left: '80%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Suối nước nóng Onsen bốc khói - Bấm để Bé nhảy vào ngâm mình thư giãn!"
            >
              <OnsenHotSpringSVG scale={scaleObj(1.40)} />
              {pulseRing('onsen')}
            </div>
          </div>
        )}

        {/* ================= 7. HOGWARTS GREAT HALL (ĐẠI SẢNH ĐƯỜNG HOGWARTS) ================= */}
        {habitat === 'hogwarts_hall' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#312e81] overflow-hidden">
            {/* Enchanted Starry Night Sky Ceiling */}
            <div
              className="absolute inset-x-0 top-0 h-48 opacity-60 pointer-events-none z-0"
              style={{
                backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#fef08a 1.5px, transparent 1.5px)`,
                backgroundSize: '24px 24px, 40px 40px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            {/* Glowing Magic Aura & Beams */}
            <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-[#6366f1] rounded-full blur-[80px] opacity-20 pointer-events-none z-0 animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-0 right-[20%] w-[100px] h-full bg-gradient-to-b from-[#818cf8] to-transparent opacity-10 transform skew-x-12 pointer-events-none z-0"></div>

            {/* Golden Magic Dust Particles */}
            <div className="absolute top-[40%] left-[30%] text-sm opacity-80 pointer-events-none animate-ping" style={{ animationDuration: '3s' }}>✨</div>
            <div className="absolute top-[50%] left-[60%] text-xs opacity-60 pointer-events-none animate-bounce" style={{ animationDuration: '2.5s' }}>🌟</div>
            <div className="absolute top-[65%] left-[25%] text-sm opacity-90 pointer-events-none animate-ping" style={{ animationDuration: '4s' }}>✨</div>
            <div className="absolute top-[35%] left-[75%] text-lg opacity-70 pointer-events-none animate-pulse" style={{ animationDuration: '3.5s' }}>⭐</div>
            <div className="absolute top-[75%] left-[50%] text-xs opacity-90 pointer-events-none animate-bounce" style={{ animationDuration: '3s' }}>✨</div>

            {/* Floating Candles Scatter */}
            <div className="absolute top-[15%] left-[25%] pointer-events-none z-10 animate-bounce" style={{ animationDuration: '3.2s' }}>
              <div className="w-1 h-3 bg-white mx-auto"></div><div className="w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[1px]"></div>
            </div>
            <div className="absolute top-[10%] left-[65%] pointer-events-none z-10 animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="w-1 h-3 bg-white mx-auto"></div><div className="w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[1px]"></div>
            </div>

            {/* Gothic Castle Flagstone Paved Floor */}
            <div
              className="absolute inset-x-0 bottom-0 h-[50%] opacity-30 pointer-events-none z-0"
              style={{
                backgroundImage: `linear-gradient(to right, #475569 2px, transparent 2px), linear-gradient(to bottom, #475569 2px, transparent 2px)`,
                backgroundSize: '32px 32px',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#1e1b4b] opacity-60" />
            </div>

            {/* Oak long tables with gold plates & House Crest Rugs */}
            <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[5%] bg-amber-900 border-2 border-amber-950 pointer-events-none z-0 transform -skew-x-12 flex justify-around items-center">
              <div className="w-4 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-4 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-4 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[5%] bg-amber-900 border-2 border-amber-950 pointer-events-none z-0 transform skew-x-12 flex justify-around items-center">
              <div className="w-4 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-4 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-4 h-2 bg-yellow-400 rounded-full"></div>
            </div>

            <div className="absolute top-[60%] left-[25%] w-[10%] h-[15%] bg-red-700 border-2 border-yellow-500 rounded-md transform -skew-x-12 opacity-60 pointer-events-none z-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-yellow-400 rotate-45 transform"></div>
            </div>
            <div className="absolute top-[60%] right-[25%] w-[10%] h-[15%] bg-green-700 border-2 border-slate-300 rounded-md transform skew-x-12 opacity-60 pointer-events-none z-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-slate-200 rotate-45 transform"></div>
            </div>

            {/* Floating Candles Array across Hall (Top-Center) */}
            <div
              onClick={(e) => onObjClick(e, 'candles', 'candles')}
              onTouchEnd={(e) => onObjTouch(e, 'candles', 'candles')}
              style={{ left: '50%', top: '22%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Nến phép thuật bay lơ lửng - Bấm để niệm thần chú Lumos Maxima!"
            >
              <FloatingCandlesGothicHallSVG scale={scaleObj(1.15)} isLit={isCandleLit} />
              {pulseRing('candles')}
            </div>

            {/* 4 Hogwarts House Heraldic Banners (Top-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'banners', 'banners')}
              onTouchEnd={(e) => onObjTouch(e, 'banners', 'banners')}
              style={{ left: '82%', top: '25%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cờ hiệu 4 Nhà: Gryffindor, Ravenclaw, Hufflepuff, Slytherin - Bấm để vinh danh thành tích!"
            >
              <HogwartsHouseBannersSVG scale={scaleObj(1.30)} />
              {pulseRing('banners')}
            </div>

            {/* Grand Banquet Feast Table (Center) */}
            <div
              onClick={(e) => onObjClick(e, 'feast', 'feast')}
              onTouchEnd={(e) => onObjTouch(e, 'feast', 'feast')}
              style={{ left: '50%', top: '60%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Bàn tiệc phép thuật thịnh soạn - Bấm để chén gà quay và uống Bia Bơ!"
            >
              <MagicFeastTableSVG scale={scaleObj(1.37)} />
              {pulseRing('feast')}
            </div>

            {/* The Sentient Sorting Hat on Stool (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'sorting_hat', 'sortinghat')}
              onTouchEnd={(e) => onObjTouch(e, 'sorting_hat', 'sortinghat')}
              style={{ left: '20%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-110 transition-transform"
              title="Chiếc Nón Phân Loại cổ kính - Bấm để Nón phán xét Nhà cho bạn!"
            >
              <div key={shakeWrapKey('sortinghat')} className={shakeWrapCls('sortinghat')}>
                <SortingHatPedestalSVG scale={scaleObj(1.40)} />
              </div>
              {pulseRing('sortinghat')}
            </div>

            {/* Massive Stone Fireplace with Emerald Floo Fire (Bottom-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'fireplace', 'fireplace')}
              onTouchEnd={(e) => onObjTouch(e, 'fireplace', 'fireplace')}
              style={{ left: '82%', top: '76%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Lò sưởi đá khổng lồ & Ngọn lửa Floo - Bấm để sưởi ấm bập bùng!"
            >
              <HogwartsGreatFireplaceSVG scale={scaleObj(1.40)} />
              {pulseRing('fireplace')}
            </div>

            {/* Flickering Fireplace Glow */}
            <div className="absolute top-[76%] left-[82%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#10b981] rounded-full blur-[25px] opacity-20 pointer-events-none z-10 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
          </div>
        )}

        {/* ================= 8. DORAEMON FIELD (BÃI ĐẤT TRỐNG ỐNG BÊ TÔNG DORAEMON) ================= */}
        {habitat === 'doraemon_field' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6] to-[#93c5fd] overflow-hidden">
            {/* Summer Sunlight Ray */}
            <div className="absolute top-0 left-[10%] w-[200px] h-full bg-gradient-to-b from-[#fef08a] to-transparent opacity-20 transform -skew-x-12 pointer-events-none z-0"></div>

            {/* Sunny Summer Blue Sky with Fluffy Drifting Clouds */}
            <div className="absolute top-[8%] left-[15%] w-16 h-8 bg-white rounded-full opacity-90 blur-[1px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute top-[12%] left-[75%] w-20 h-10 bg-white rounded-full opacity-80 blur-[2px] pointer-events-none animate-bounce" style={{ animationDuration: '5s' }}></div>
            <div className="absolute top-[5%] left-[45%] w-24 h-12 bg-white rounded-full opacity-70 blur-[3px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute top-[18%] left-[90%] w-14 h-6 bg-white rounded-full opacity-80 blur-[1px] pointer-events-none animate-pulse" style={{ animationDuration: '7s' }}></div>

            {/* Flying Dragonfly/Birds */}
            <div className="absolute top-[25%] left-[30%] pointer-events-none animate-ping flex items-center justify-center w-4 h-2 opacity-80" style={{ animationDuration: '4s' }}>
              <div className="w-2 h-0.5 bg-black rotate-45 transform"></div><div className="w-2 h-0.5 bg-black -rotate-45 transform -ml-1"></div>
            </div>
            <div className="absolute top-[20%] left-[80%] pointer-events-none animate-ping flex items-center justify-center w-3 h-1.5 opacity-60" style={{ animationDuration: '3s' }}>
              <div className="w-1.5 h-0.5 bg-black rotate-45 transform"></div><div className="w-1.5 h-0.5 bg-black -rotate-45 transform -ml-1"></div>
            </div>

            {/* Vacant Grassy Ground with Sandy Dirt Layer */}
            <div
              className="absolute inset-x-0 bottom-0 h-[70%] bg-[#4ade80] z-0"
              style={{
                backgroundImage: `radial-gradient(#22c55e 1.5px, transparent 1.5px), radial-gradient(#16a34a 1.5px, #4ade80 1.5px)`,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 8px 8px',
              }}
            >
              {/* Sandy dirt worn path in center */}
              <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[70%] h-[50%] bg-[#fef08a] rounded-full blur-[15px] opacity-40 pointer-events-none"></div>
            </div>

            {/* Dandelion & Wildflowers (Khóm bồ công anh và hoa dại) */}
            <div className="absolute top-[65%] left-[20%] pointer-events-none z-10 flex items-center gap-1 drop-shadow-sm">
              <div className="w-3 h-3 bg-yellow-300 rounded-full blur-[1px]"></div>
              <div className="w-2 h-2 bg-yellow-200 rounded-full mt-2"></div>
            </div>
            <div className="absolute top-[80%] left-[35%] pointer-events-none z-10 flex items-center">
              <div className="w-4 h-4 bg-white rounded-full blur-[2px] opacity-80"></div>
              <div className="w-3 h-3 bg-slate-100 rounded-full -ml-1 mt-1 blur-[1px]"></div>
            </div>
            <div className="absolute top-[55%] left-[75%] pointer-events-none z-10">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            </div>

            {/* Tree Shadows (Bóng cây râm mát) */}
            <div className="absolute top-[85%] left-[80%] w-[30%] h-[15%] bg-[#166534] rounded-full blur-[20px] opacity-40 pointer-events-none z-0"></div>
            <div className="absolute top-[60%] left-[10%] w-[20%] h-[10%] bg-[#166534] rounded-full blur-[15px] opacity-40 pointer-events-none z-0 transform -rotate-12"></div>

            {/* Japanese Neighborhood Background & Paved Sidewalk */}
            <div className="absolute top-[35%] left-0 w-full h-[5%] bg-slate-300 border-t-4 border-slate-400 opacity-60 z-0"></div>
            <div className="absolute top-[25%] left-[10%] w-[20%] h-[10%] bg-blue-200 opacity-30 z-0 border-t-8 border-blue-400 rounded-sm"></div>
            <div className="absolute top-[20%] left-[50%] w-[25%] h-[15%] bg-amber-100 opacity-30 z-0 border-t-8 border-amber-600 rounded-sm"></div>
            <div className="absolute top-[28%] left-[85%] w-[15%] h-[7%] bg-rose-100 opacity-30 z-0 border-t-8 border-rose-400 rounded-sm"></div>

            {/* Nostalgic Suburban Wooden Fence along Upper Edge (Top-Left) */}
            <div
              onClick={onFenceClick}
              onTouchEnd={onFenceTouch}
              style={{ left: '26%', top: '28%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center"
              title="Hàng rào gỗ nhà hàng xóm & Bãi hoa bồ công anh"
            >
              <NostalgicWoodenFenceFieldSVG scale={scaleObj(1.33)} />
              {pulseRing('fence')}
            </div>

            {/* Concrete Utility Pole & Safety Convex Mirror (Top-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'pole', 'pole')}
              onTouchEnd={(e) => onObjTouch(e, 'pole', 'pole')}
              style={{ left: '84%', top: '28%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cột điện khu phố & Gương cầu lồi ngã ba - Bấm để ngắm hoàng hôn tuổi thơ!"
            >
              <JapaneseNeighborhoodPoleSVG scale={scaleObj(1.30)} />
              {pulseRing('pole')}
            </div>

            {/* The Legendary 3 Concrete Pipes (Center - Main Attraction) */}
            <div
              onClick={(e) => onObjClick(e, 'pipes', 'pipes')}
              onTouchEnd={(e) => onObjTouch(e, 'pipes', 'pipes')}
              style={{ left: '50%', top: '56%' }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transition-transform duration-300 ${
                isBouncingPipes ? 'scale-120' : 'hover:scale-108'
              }`}
              title="3 ống cống bê tông tròn kinh điển - Bấm để Bé nhảy lên đỉnh ngồi hát liveshow!"
            >
              <div className="relative" key={shakeWrapKey('pipes')}>
                <div className={shakeWrapCls('pipes')}>
                  <DoraemonConcretePipesSVG scale={scaleObj(1.40)} />
                </div>
                {pulseRing('pipes')}
                {/* Grass growing around pipes */}
                <div className="absolute bottom-[-10px] left-[-10px] text-xl z-30 pointer-events-none">🌿</div>
                <div className="absolute bottom-[-5px] right-[10px] text-lg z-30 pointer-events-none">🌱</div>
              </div>
            </div>

            {/* Anywhere Door Dokodemo (Bottom-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'door', 'door')}
              onTouchEnd={(e) => onObjTouch(e, 'door', 'door')}
              style={{ left: '82%', top: '74%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-110 transition-transform"
              title="Cánh Cửa Thần Kỳ màu hồng - Bấm để mở cửa bay xuyên không gian!"
            >
              <AnywhereDoorPropSVG scale={scaleObj(1.15)} isOpen={isAnywhereDoorOpen} />
              {pulseRing('door')}
            </div>

            {/* Nobita's Baseball Mitt & Dorayaki Bean Pancakes (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'dorayaki', 'dorayaki')}
              onTouchEnd={(e) => onObjTouch(e, 'dorayaki', 'dorayaki')}
              style={{ left: '20%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-108 transition-transform"
              title="Găng bóng chày & Bánh rán Dorayaki - Bấm để thưởng thức bánh ngọt lịm!"
            >
              <NobitaBaseballGearSVG scale={scaleObj(1.37)} />
              {pulseRing('dorayaki')}
            </div>
          </div>
        )}

        {/* ================= 9. DREAM LAND (VƯƠNG QUỐC GIẤC MƠ KIRBY) ================= */}
        {habitat === 'dream_land' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#fbcfe8] via-[#e9d5ff] to-[#bae6fd] overflow-hidden">
            {/* Dreamy Gradient Sky & Rainbow Aura */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#d8b4fe] via-[#c084fc] to-transparent opacity-40 pointer-events-none z-0" />
            <div className="absolute top-[-50%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-[100%] border-[20px] border-[#f472b6] opacity-10 pointer-events-none z-0 blur-[5px]" />
            <div className="absolute top-[-45%] left-[50%] -translate-x-1/2 w-[700px] h-[350px] rounded-[100%] border-[20px] border-[#38bdf8] opacity-10 pointer-events-none z-0 blur-[5px]" />

            {/* Shooting Stars (Animated) */}
            <div className="absolute top-[10%] left-[80%] text-sm opacity-80 pointer-events-none animate-pulse transform -rotate-45" style={{ animationDuration: '2s' }}>💫</div>
            <div className="absolute top-[20%] left-[20%] text-md opacity-70 pointer-events-none animate-ping transform -rotate-45" style={{ animationDuration: '3.5s' }}>💫</div>

            {/* Stardust scattered */}
            <div className="absolute top-[15%] left-[45%] text-xs opacity-90 pointer-events-none animate-pulse">✨</div>
            <div className="absolute top-[35%] left-[85%] text-lg opacity-60 pointer-events-none animate-bounce" style={{ animationDuration: '3s' }}>⭐</div>
            <div className="absolute top-[5%] left-[10%] text-md opacity-80 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}>✨</div>
            
            {/* Drifting Pastel Stardust Particles */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none z-0"
              style={{
                backgroundImage: `radial-gradient(#ec4899 2px, transparent 2px), radial-gradient(#38bdf8 2px, transparent 2px)`,
                backgroundSize: '32px 32px',
                backgroundPosition: '0 0, 16px 16px',
              }}
            />

            {/* Scatter Elements (Whispy Flowers, Clouds) */}
            {/* Cotton Candy Clouds (Mây kẹo bông gòn) */}
            <div className="absolute top-[75%] left-[30%] w-16 h-10 bg-pink-200 rounded-full blur-[2px] opacity-80 pointer-events-none z-0 flex items-center justify-center"><div className="w-10 h-10 bg-pink-300 rounded-full -mt-4"></div></div>
            <div className="absolute top-[45%] left-[65%] w-20 h-12 bg-purple-200 rounded-full blur-[2px] opacity-70 pointer-events-none z-0 flex items-center justify-center"><div className="w-12 h-12 bg-purple-300 rounded-full -mt-6"></div></div>
            
            {/* Small Rainbows & Star-shaped flowers */}
            <div className="absolute top-[65%] left-[20%] w-8 h-4 border-t-4 border-rose-400 rounded-t-full pointer-events-none z-10 opacity-80 border-x-transparent"></div>
            <div className="absolute top-[55%] left-[15%] w-3 h-3 bg-yellow-300 rotate-45 transform pointer-events-none z-10"></div>
            <div className="absolute top-[80%] left-[70%] w-4 h-4 bg-yellow-200 rotate-45 transform pointer-events-none z-10 drop-shadow-md"></div>

            {/* Golden Warp Star Launchpad (Upper-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'warp_star', 'warpstar')}
              onTouchEnd={(e) => onObjTouch(e, 'warp_star', 'warpstar')}
              style={{ left: '22%', top: '34%' }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transition-transform duration-300 ${
                isWarpStarActive ? 'scale-125' : 'hover:scale-110'
              }`}
              title="Ngôi Sao Vàng Warp Star - Bấm để Bé cưỡi sao phóng vút lên dải ngân hà!"
            >
              <KirbyWarpStarSVG scale={scaleObj(1.40)} />
              {pulseRing('warpstar')}
            </div>

            {/* Giant Swirling Rainbow Lollipop Tree (Upper-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'lollipop', 'lollipop')}
              onTouchEnd={(e) => onObjTouch(e, 'lollipop', 'lollipop')}
              style={{ left: '80%', top: '30%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cây kẹo mút khổng lồ bảy sắc - Bấm để thưởng thức kẹo bông gòn ngọt ngào!"
            >
              <GiantLollipopTreeSVG scale={scaleObj(1.40)} />
              {pulseRing('lollipop')}
            </div>

            {/* Cascading Pastel Rainbow River Waterfall (Center) */}
            <div
              onClick={(e) => onObjClick(e, 'rainbow', 'river')}
              onTouchEnd={(e) => onObjTouch(e, 'rainbow', 'river')}
              style={{ left: '50%', top: '56%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Suối thác cầu vồng kẹo dẻo - Bấm để Bé bơi lội mát rượi!"
            >
              <RainbowRiverWaterfallSVG scale={scaleObj(1.40)} />
              {pulseRing('river')}
            </div>

            {/* Whispy Woods Apple Tree (Bottom-Left) */}
            <div
              onClick={(e) => onObjClick(e, 'apple', 'apple')}
              onTouchEnd={(e) => onObjTouch(e, 'apple', 'apple')}
              style={{ left: '18%', top: '78%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:shadow-lg hover:scale-105 transition-transform"
              title="Cây táo thần Whispy Woods - Bấm để hái táo ngôi sao may mắn!"
            >
              <div key={shakeWrapKey('apple')} className={shakeWrapCls('apple')}>
                <WhispyWoodsAppleTreeSVG scale={scaleObj(1.37)} />
              </div>
              {pulseRing('apple')}
            </div>

            {/* Star Rod Monument Fountain (Bottom-Right) */}
            <div
              onClick={(e) => onObjClick(e, 'star_rod', 'starrod')}
              onTouchEnd={(e) => onObjTouch(e, 'star_rod', 'starrod')}
              style={{ left: '82%', top: '76%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] grid place-items-center transform hover:scale-110 transition-transform"
              title="Bệ đài Trượng Sao Star Rod - Bấm để ước nguyện học tiếng Anh thành tài!"
            >
              <StarRodMonumentSVG scale={scaleObj(1.40)} />
              {pulseRing('starrod')}
            </div>
          </div>
        )}

        {/* Juice FX layer: one-shot particles (billboard, screen-space, self-cleaning) */}
        <div className="absolute inset-0 z-[35] pointer-events-none overflow-hidden">
          {fx.map((f) => (
            <div
              key={f.id}
              className={`fx-particle ${f.cls}`}
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                animationDelay: f.delay ? `${f.delay}ms` : undefined,
              }}
            >
              {f.emoji}
            </div>
          ))}
        </div>

        {/* Target Click Ripple */}
        {targetMarker && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: `${targetMarker.x}%`, top: `${targetMarker.y}%` }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-300/40 animate-ping" />
            <div className="absolute text-xs">🎯</div>
          </div>
        )}

        {/* ================= SHARED ATMOSPHERE (ALL HABITATS): edge vignette + top/bottom shade for depth ================= */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{ background: 'radial-gradient(125% 95% at 50% 45%, rgba(15,23,42,0) 42%, rgba(15,23,42,0.26) 100%)' }}
        />
        <div className="absolute inset-x-0 top-0 h-20 z-[3] pointer-events-none bg-gradient-to-b from-slate-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 z-[3] pointer-events-none bg-gradient-to-t from-slate-950/15 to-transparent" />

        {/* Tossed Toy Ball with 3D Arc Throw & Ground Landing Shadow */}
        {toyBall && (
          <>
            {/* Ground Landing Target Shadow Indicator */}
            {toyBall.phase === 'flying' && toyBall.targetX !== undefined && toyBall.targetY !== undefined && (
              <div
                className="absolute z-15 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${toyBall.targetX}%`, top: `${toyBall.targetY}%` }}
              >
                <div className="w-9 h-3.5 rounded-full bg-black/25 animate-ball-shadow blur-[1px]" />
                <div className="absolute inset-0 flex items-center justify-center -top-2">
                  <div className="w-6 h-6 rounded-full border border-amber-400/60 animate-ping" />
                </div>
              </div>
            )}

            {/* Flying / Bouncing Ball — chỉ QUẢ BÓNG bay (không có vợt) */}
            <div
              data-testid="toy-ball"
              className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${toyBall.x}%`,
                top: `${toyBall.y}%`,
                transition:
                  toyBall.phase === 'flying'
                    ? 'left 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    : undefined,
              }}
            >
              <div
                className={`text-2xl sm:text-3xl select-none filter drop-shadow-md ${
                  toyBall.phase === 'flying'
                    ? 'animate-ball-arc'
                    : toyBall.phase === 'bouncing'
                    ? 'animate-bounce'
                    : 'scale-90 animate-pulse'
                }`}
              >
                ⚽
              </div>
            </div>
          </>
        )}

        {/* Dropped Food Treat */}
        {droppedTreat && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 text-2xl animate-bounce drop-shadow-md"
            style={{ left: `${droppedTreat.x}%`, top: `${droppedTreat.y}%` }}
          >
            {droppedTreat.emoji}
          </div>
        )}

        {/* Flying Ninja Shuriken / Kunai Projectile */}
        {flyingShuriken && (
          <div
            className="absolute z-35 pointer-events-none -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
            style={{
              left: `${flyingShuriken.x}%`,
              top: `${flyingShuriken.y}%`,
              transform: `translate(-50%, -50%) rotate(${flyingShuriken.rot}deg)`,
              transition: 'left 0.26s cubic-bezier(0.25, 1, 0.5, 1), top 0.26s cubic-bezier(0.25, 1, 0.5, 1), transform 0.26s ease-out',
            }}
          >
            {flyingShuriken.type === 'kunai' ? (
              <div className="relative text-2xl filter drop-shadow-md select-none transform -scale-x-100">
                🗡️
                <div className="absolute inset-0 blur-xs text-cyan-300 opacity-60">🗡️</div>
              </div>
            ) : (
              <div className="relative text-2xl filter drop-shadow-md select-none">
                <span className="inline-block animate-spin" style={{ animationDuration: '0.15s' }}>
                  ✴️
                </span>
                <div className="absolute inset-0 blur-xs text-amber-300 opacity-60">✴️</div>
              </div>
            )}
          </div>
        )}

        {/* Vàng bạc đá quý bay ra từ rương báu */}
        {treasureLoot.map((l) => (
          <div
            key={l.id}
            data-testid="treasure-loot"
            className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-1/2 text-xl animate-bounce drop-shadow-lg"
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
          >
            {l.emoji}
          </div>
        ))}

        {/* Popup overlay "Bé đang code" — nằm gọn trong arena, không gây cuộn trang */}
        {isCoding && (
          <div
            data-testid="coding-overlay"
            className="absolute inset-0 z-50 grid place-items-center pointer-events-none p-2"
          >
            <div className="pointer-events-auto w-[86%] max-w-[330px] max-h-[86%] overflow-hidden rounded-2xl border-2 border-indigo-400 bg-slate-950/95 shadow-2xl">
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600">
                <span className="text-[11px] font-black text-white">💻 Bé đang code... gõ phím lách cách!</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    setIsCoding(false);
                    setAnimState('idle');
                    isInteractingRef.current = false;
                  }}
                  className="w-6 h-6 grid place-items-center rounded-full bg-white/20 text-white text-xs font-black hover:bg-white/30 cursor-pointer"
                  title="Đóng cửa sổ code"
                >
                  ✕
                </button>
              </div>
              <div className="px-3 py-2 font-mono text-[10px] leading-relaxed text-emerald-300 min-h-[96px]">
                {codeLines.length === 0 && <span className="text-slate-400">_ đang mở máy...</span>}
                {codeLines.map((line, i) => (
                  <div key={i} className="truncate">{line}</div>
                ))}
                <span className="inline-block w-2 h-3 bg-emerald-300 animate-pulse align-middle">▍</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/10 text-[10px] font-black">
                <span className="text-amber-300">⭐ +{codeExp} EXP vui vẻ</span>
                <span className="text-slate-300">⌨️ lách cách... vui tai!</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Hearts from Petting */}
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-1/2 text-xl animate-pixel-happy"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            💖
          </div>
        ))}

        {/* THE LIVING PIXEL PET (Scale 1.15x for balanced game proportion) */}
        <div
          onClick={handlePetClick}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handlePetClick(e as any);
          }}
          className="absolute z-40 cursor-pointer -translate-x-1/2 -translate-y-1/2 group touch-manipulation p-2"
          style={{
            left: `${petPos.x}%`,
            top: `${petPos.y}%`,
            willChange: 'left, top',
            transition:
              isBouncingMushroom || isBouncingBeanbag || isBouncingPipes || isWarpStarActive
                ? 'top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.3s ease'
                : animState === 'walk'
                ? 'left 0.8s linear, top 0.8s linear'
                : animState === 'run'
                ? 'left 0.4s linear, top 0.4s linear'
                : animState === 'swim'
                ? 'left 1.1s ease-in-out, top 1.1s ease-in-out'
                : animState === 'climb'
                ? 'top 0.7s linear, left 0.7s linear'
                : 'none',
          }}
        >
          {/* Couple Romantic Hearts & Title */}
          {isCouple && (
            <div className="absolute -top-15 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-lg animate-pulse whitespace-nowrap z-45 border border-pink-300/60 pointer-events-none">
              <span>💍💖</span>
              <span>{coupleTitle || 'Uyên Ương Tri Kỷ'}</span>
            </div>
          )}

          {/* Dynamic Speech Bubble over Pet */}
          {currentSpeech && (
            <div
              className="absolute -top-9 left-1/2 bg-white/95 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-xl shadow-xl border-2 border-emerald-500 text-[10px] font-black z-40 pointer-events-none animate-bounce w-max max-w-[60vw] sm:max-w-xs text-center leading-snug break-words"
              style={{ animationDuration: '3s', translate: speechShift }}
            >
              <span>{currentSpeech}</span>
              <div className="absolute -bottom-1 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-emerald-500" style={{ left: speechTailLeft, transform: 'translateX(-50%)' }} />
            </div>
          )}

          {/* Pixel Art Sprite Component (Scale 1.15x) */}
          <div
            className="relative transform group-hover:scale-120 transition-transform"
            style={{ filter: 'drop-shadow(0 3px 5px rgba(0, 0, 0, 0.4))' }}
          >
            <PixelPetSprite
              species={species}
              animationState={animState}
              facing={facing}
              scale={(isMobile ? 1.05 : 1.35) * petDepthScale}
              equippedHat={equippedHat}
              equippedOutfit={equippedOutfit}
              equippedAccessory={equippedAccessory}
              isSleeping={isSleeping}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default PixelFarmGame;

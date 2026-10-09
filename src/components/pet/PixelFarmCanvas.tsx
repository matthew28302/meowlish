'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Sparkles, Utensils, Award, RefreshCw, Volume2, Info, ChevronRight, Check } from 'lucide-react';
import { drawChibiChicken, drawChibiDairyCow } from './drawFarmLivestock';
import { LIVESTOCK_CATALOG } from '@/lib/petFarmData';

type LivestockStatus = 'idle' | 'producing' | 'ready';

// Chu kỳ mặc định (bắt buộc khớp với server): GÀ 3 GIỜ / BÒ 24 GIỜ
const DEFAULT_CYCLE_SECONDS: Record<'chicken' | 'cow', number> = {
  chicken: 3 * 60 * 60,
  cow: 24 * 60 * 60,
};

/** Dòng trạng thái server trả về cho mỗi loài (nguồn sự thật của chu kỳ). */
interface LivestockState {
  animal_type: 'chicken' | 'cow';
  fed_at?: string | null;
  ready_at?: string | null;
  last_fed_at?: string | null;
  producing_until?: string | null;
  cycle_seconds?: number | null;
  produced_count?: number;
  status: LivestockStatus;
  remaining_seconds: number;
  total_seconds: number;
  progress: number;
  server_time?: number;
}

interface FoodDrop {
  id: string;
  type: 'wheat' | 'hay';
  x: number;
  y: number;
  remaining: number;
}

interface FarmProduce {
  id: string;
  type: 'egg' | 'milk';
  x: number;
  y: number;
  rewardCoins: number;
  rewardExp: number;
  bounceOffset: number;
  createdAt: number;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

interface AnimalState {
  id: string;
  type: 'chicken' | 'cow';
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: 'idle' | 'walk' | 'eating' | 'producing';
  direction: 1 | -1;
  actionTimer: number;
  animFrame: number;
  isHungry: boolean;
  heartTimer: number;
  isRooster?: boolean;
  isChick?: boolean;
}

export interface PixelFarmCanvasProps {
  userCoins: number;
  /** Nhận DELTA (dương = cộng, âm = trừ) chứ không nhận số dư tuyệt đối. */
  onUpdateCoinsDelta: (delta: number) => void;
  onUpdatePetExp?: (exp: number) => void;
  userId?: string;
  playerSpecies?: string;
  playerPetName?: string;
}

export default function PixelFarmCanvas({
  userCoins,
  onUpdateCoinsDelta,
  onUpdatePetExp,
  userId,
  playerSpecies = 'owl',
  playerPetName = 'Lexi Trí Tuệ',
}: PixelFarmCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Stats
  const [harvestedEggs, setHarvestedEggs] = useState(0);
  const [harvestedMilk, setHarvestedMilk] = useState(0);
  const [activeTool, setActiveTool] = useState<'wheat' | 'hay' | 'hand'>('wheat');
  const [bannerMsg, setBannerMsg] = useState<string>(
    'Chào mừng đến Nông Trại Meowlish 2.5D! Chạm vào đồng cỏ để rải thóc 🌾 cho gà hoặc cỏ 🌿 cho bò!'
  );

  // High-DPI Dimensions
  const canvasWidth = 840;
  const canvasHeight = 520;

  // Entities
  const animalsRef = useRef<AnimalState[]>([
    // Chickens (Hen, Rooster, Baby Chick)
    { id: 'chk_1', type: 'chicken', name: 'Gà Mái Hoa Mơ', x: 190, y: 240, targetX: 190, targetY: 240, state: 'idle', direction: 1, actionTimer: 60, animFrame: 0, isHungry: true, heartTimer: 0 },
    { id: 'chk_2', type: 'chicken', name: 'Gà Trống Cồ', x: 270, y: 200, targetX: 270, targetY: 200, state: 'idle', direction: -1, actionTimer: 90, animFrame: 0, isHungry: true, heartTimer: 0, isRooster: true },
    { id: 'chk_3', type: 'chicken', name: 'Gà Con Chíp Chíp', x: 220, y: 280, targetX: 220, targetY: 280, state: 'idle', direction: 1, actionTimer: 45, animFrame: 0, isHungry: true, heartTimer: 0, isChick: true },
    // Dairy Cows
    { id: 'cow_1', type: 'cow', name: 'Bò Sữa Daisy', x: 570, y: 270, targetX: 570, targetY: 270, state: 'idle', direction: -1, actionTimer: 100, animFrame: 0, isHungry: true, heartTimer: 0 },
    { id: 'cow_2', type: 'cow', name: 'Bò Sữa Bella', x: 680, y: 340, targetX: 680, targetY: 340, state: 'idle', direction: 1, actionTimer: 120, animFrame: 0, isHungry: true, heartTimer: 0 },
  ]);

  const foodsRef = useRef<FoodDrop[]>([]);
  const producesRef = useRef<FarmProduce[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const frameCountRef = useRef<number>(0);

  // ===== SERVER-SIDE PRODUCTION TIMERS (3h gà / 24h bò) =====
  const livestockRef = useRef<Record<'chicken' | 'cow', LivestockState | null>>({
    chicken: null,
    cow: null,
  });
  const [livestockUi, setLivestockUi] = useState<Record<'chicken' | 'cow', LivestockState | null>>({
    chicken: null,
    cow: null,
  });
  // Khóa đồng bộ tạm thời: true trong lúc POST đang chạy để tránh rải thêm thức ăn
  const feedLockRef = useRef<boolean>(false);
  // Chu kỳ đã spawn sản phẩm lên canvas (không spawn trùng khi poll lại)
  const spawnedCycleRef = useRef<Record<string, string>>({});
  const isMountedRef = useRef(true);
  // Chống dữ liệu cũ ghi đè dữ liệu mới (poll GET về trễ sau khi POST đã ghi)
  const lastServerTimeRef = useRef<number>(0);

  // Ref đồng bộ số dư mới nhất: handler bất đồng bộ (.then của fetch) không
  // được đọc `userCoins` của lần render đã đóng lại.
  const userCoinsRef = useRef<number>(userCoins);
  useEffect(() => {
    userCoinsRef.current = userCoins;
  });

  /** Cộng/trừ delta và cập nhật ref ngay — giữ ref khớp parent giữa 2 render. */
  const applyCoinDelta = (delta: number) => {
    userCoinsRef.current += delta;
    onUpdateCoinsDelta(delta);
  };

  /** Server trả số dư TUYỆT ĐỐI → đổi thành delta so với số dư đang giữ. */
  const syncCoinsFromServer = (serverCoins: number) => {
    const delta = serverCoins - userCoinsRef.current;
    userCoinsRef.current = serverCoins;
    onUpdateCoinsDelta(delta);
  };

  const catalog = (type: 'chicken' | 'cow') =>
    LIVESTOCK_CATALOG[type] || LIVESTOCK_CATALOG.chicken;

  // ===== Helpers: chu kỳ sản xuất phía máy chủ =====
  const formatCountdown = (totalSeconds: number) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  };

  const cycleKeyOf = (row: LivestockState) =>
    String(row?.producing_until ?? row?.ready_at ?? '');

  /** Đẩy sản phẩm (trứng/sữa) lên đồng cỏ khi server báo chu kỳ đã xong. */
  const spawnProduceFor = (type: 'chicken' | 'cow', row: LivestockState) => {
    const key = cycleKeyOf(row);
    if (!key) return;
    if (spawnedCycleRef.current[type] === key) return;
    const produceType = type === 'chicken' ? 'egg' : 'milk';
    if (producesRef.current.some((p) => p.type === produceType)) return;
    spawnedCycleRef.current[type] = key;

    const meta = catalog(type);
    const siblings = animalsRef.current.filter((a) => a.type === type);
    const anchor = siblings[Math.floor(Math.random() * siblings.length)];
    const x = Math.max(70, Math.min(canvasWidth - 70, (anchor?.x ?? canvasWidth / 2) + (Math.random() * 44 - 22)));
    const y = Math.max(170, Math.min(canvasHeight - 70, (anchor?.y ?? canvasHeight / 2) + 18));

    producesRef.current.push({
      id: `prod-${type}-${key}`,
      type: produceType,
      x,
      y,
      rewardCoins: meta.rewardCoins,
      rewardExp: meta.rewardExp,
      bounceOffset: 0,
      createdAt: Date.now(),
    });
    addFloatText(
      produceType === 'egg' ? '🥚 Trứng Vàng!' : '🥛 Sữa Tươi!',
      x,
      y - 26,
      produceType === 'egg' ? '#fef08a' : '#93c5fd'
    );
    sound.playPop();
  };

  /** Cập nhật trạng thái server vào ref + UI (và spawn sản phẩm nếu chu kỳ xong). */
  const applyLivestock = (rows: any[] | undefined | null) => {
    if (!Array.isArray(rows) || rows.length === 0) return;

    // Bỏ qua phản hồi cũ: poll GET về trễ không được ghi đè trạng thái mới hơn
    const serverTime = Number(rows[0]?.server_time) || 0;
    if (serverTime > 0) {
      if (serverTime < lastServerTimeRef.current) return;
      lastServerTimeRef.current = serverTime;
    }

    const next: Record<'chicken' | 'cow', LivestockState | null> = { chicken: null, cow: null };
    rows.forEach((raw) => {
      if (!raw) return;
      const type: 'chicken' | 'cow' = raw.animal_type === 'cow' ? 'cow' : 'chicken';
      next[type] = {
        ...raw,
        animal_type: type,
        status: (raw.status as LivestockStatus) || 'idle',
        remaining_seconds: Number(raw.remaining_seconds) || 0,
        total_seconds: Number(raw.total_seconds) || 0,
        progress: Number(raw.progress) || 0,
      };
    });
    livestockRef.current = next;
    if (isMountedRef.current) setLivestockUi(next);
    (['chicken', 'cow'] as const).forEach((type) => {
      const row = next[type];
      if (row && row.status === 'ready') spawnProduceFor(type, row);
    });
  };

  /** Poll trạng thái chu kỳ từ server (nguồn sự thật duy nhất). */
  const syncLivestock = async () => {
    if (!userId) return;
    if (feedLockRef.current) return; // đừng poll lúc đang có POST chưa xong
    try {
      const res = await fetch(`/api/pet?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!isMountedRef.current) return;
      if (data?.livestock) applyLivestock(data.livestock);
    } catch {
      // offline — giữ nguyên trạng thái hiện tại
    }
  };

  // Add floating text
  const addFloatText = (text: string, x: number, y: number, color = '#fef08a') => {
    floatTextsRef.current.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      alpha: 1.0,
    });
  };

  // Drop food on ground (BỊ KHÓA khi server đang đếm chu kỳ sản xuất)
  const dropFoodAt = (x: number, y: number, type: 'wheat' | 'hay') => {
    const animalType: 'chicken' | 'cow' = type === 'wheat' ? 'chicken' : 'cow';
    const meta = catalog(animalType);
    const row = livestockRef.current[animalType];
    const status: LivestockStatus = row?.status ?? 'idle';

    // 1. KHÓA CHO ĂN: đang trong chu kỳ 3h/24h → không cho rải thức ăn nữa
    if (status === 'producing') {
      setBannerMsg(
        `⛔ ${meta.name} đang sản xuất — còn ${formatCountdown(row?.remaining_seconds ?? 0)} nữa mới cho ăn tiếp được!`
      );
      sound.playError();
      return;
    }

    // 2. Đã chín nhưng chưa thu hoạch → cho ăn sẽ mất thành quả, chặn lại
    if (status === 'ready') {
      setBannerMsg(
        `🧺 ${meta.name} đã sẵn sàng ${meta.produceName}! Nhấp vào sản phẩm (hoặc bấm Thu Hoạch Hết) trước khi cho ăn đợt mới.`
      );
      sound.playError();
      return;
    }

    // 3. Đang chờ server xác nhận bữa ăn trước đó
    if (feedLockRef.current) {
      setBannerMsg('⏳ Đang xử lý bữa ăn trước đó, chờ một giây nhé!');
      sound.playError();
      return;
    }

    const cost = meta.feedPrice;
    if (userCoins < cost) {
      setBannerMsg(`Bạn cần ít nhất ${cost} Coins để mua ${type === 'wheat' ? 'thóc cho gà' : 'cỏ cho bò'}!`);
      sound.playError();
      return;
    }

    // Delta âm: parent cộng dồn nên số xu kiếm được trong lúc request chạy không
    // bị ghi đè (bug cũ: truyền `userCoins - cost` chụp lúc render).
    applyCoinDelta(-cost);
    sound.playClick();

    const foodId = `food-${Date.now()}-${Math.random()}`;
    foodsRef.current.push({
      id: foodId,
      type,
      x: Math.max(90, Math.min(canvasWidth - 90, x)),
      y: Math.max(160, Math.min(canvasHeight - 60, y)),
      remaining: type === 'wheat' ? 3 : 4,
    });

    addFloatText(`-${cost} 🪙`, x, y - 10, '#ef4444');
    setBannerMsg(
      type === 'wheat'
        ? '🌾 Đã rải thóc vàng! Đàn gà đang hớn hở chạy lại mổ...'
        : '🌿 Đã rải bó cỏ ngọt thơm! Đàn bò sữa đang ung dung tới ăn...'
    );

    if (!userId) return; // Khách chơi vui — không có chu kỳ server

    feedLockRef.current = true;
    fetch('/api/pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'feed_livestock',
        animalType,
      }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data: any) => {
        if (!isMountedRef.current) return;
        if (data?.livestock) applyLivestock(data.livestock);
        if (data?.error) {
          // Server từ chối (đang đếm ngược / chưa đủ xu) → hoàn đúng số đã trừ & gỡ thức ăn
          applyCoinDelta(cost);
          foodsRef.current = foodsRef.current.filter((f) => f.id !== foodId);
          setBannerMsg(`⛔ ${data.error}`);
          sound.playError();
          return;
        }
        if (typeof data?.userCoins === 'number') syncCoinsFromServer(data.userCoins);
        if (data?.message) setBannerMsg(data.message);
      })
      .catch(() => {
        if (isMountedRef.current) setBannerMsg('⚠️ Mất kết nối máy chủ — chu kỳ cho ăn chưa được ghi nhận.');
      })
      .finally(() => {
        feedLockRef.current = false;
      });
  };

  // Collect Produce (Egg / Milk) — server kiểm tra chu kỳ mới cho nhận
  const collectProduce = (item: FarmProduce) => {
    const animalType: 'chicken' | 'cow' = item.type === 'egg' ? 'chicken' : 'cow';

    // `coinsDelta` = phần CỘNG (không phải số dư tuyệt đối) để không ghi đè số xu
    // kiếm được trong lúc request harvest đang bay.
    const celebrate = (coinsDelta: number, exp: number) => {
      sound.playCelebration();
      applyCoinDelta(coinsDelta);
      if (onUpdatePetExp) onUpdatePetExp(exp);

      if (item.type === 'egg') setHarvestedEggs((prev) => prev + 1);
      else setHarvestedMilk((prev) => prev + 1);

      addFloatText(`+${item.rewardCoins} 🪙`, item.x, item.y - 20, '#facc15');
      addFloatText(`+${item.rewardExp} EXP ⭐`, item.x, item.y - 38, '#60a5fa');
      confetti({ particleCount: 20, spread: 50, origin: { x: item.x / canvasWidth, y: item.y / canvasHeight } });
      producesRef.current = producesRef.current.filter((p) => p.id !== item.id);
    };

    if (!userId) {
      celebrate(item.rewardCoins, item.rewardExp);
      return;
    }

    fetch('/api/pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'harvest_livestock', animalType }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data: any) => {
        if (!isMountedRef.current) return;
        if (data?.livestock) applyLivestock(data.livestock);
        if (data?.error) {
          sound.playError();
          const row = livestockRef.current[animalType];
          if (row && row.status !== 'ready') {
            // Sản phẩm không còn hiệu lực trên server → dọn khỏi đồng cỏ
            producesRef.current = producesRef.current.filter((p) => p.id !== item.id);
          }
          setBannerMsg(`⛔ ${data.error}`);
          return;
        }
        // Server có số dư mới → đồng bộ bằng delta; không có thì cộng đúng phần thưởng
        if (typeof data?.userCoins === 'number') syncCoinsFromServer(data.userCoins);
        celebrate(0, item.rewardExp);
        if (data?.message) setBannerMsg(data.message);
      })
      .catch(() => {
        if (isMountedRef.current) {
          setBannerMsg('⚠️ Mất kết nối máy chủ — sản phẩm vẫn còn trên đồng cỏ, thử lại sau.');
        }
      });
  };

  // Collect All Produce
  const handleCollectAll = () => {
    const readyNow = (['chicken', 'cow'] as const).filter((t) => livestockRef.current[t]?.status === 'ready');
    if (producesRef.current.length === 0 && readyNow.length === 0) {
      setBannerMsg('Hiện chưa có Trứng hoặc Sữa nào chín. Hãy cho gà và bò ăn no rồi đợi chu kỳ nhé!');
      return;
    }

    if (!userId) {
      let totalCoins = 0;
      let totalExp = 0;
      producesRef.current.forEach((item) => {
        totalCoins += item.rewardCoins;
        totalExp += item.rewardExp;
        if (item.type === 'egg') setHarvestedEggs((prev) => prev + 1);
        else setHarvestedMilk((prev) => prev + 1);
        addFloatText(`+${item.rewardCoins}🪙`, item.x, item.y - 20, '#facc15');
      });
      applyCoinDelta(totalCoins);
      if (onUpdatePetExp) onUpdatePetExp(totalExp);
      producesRef.current = [];
      sound.playCelebration();
      confetti({ particleCount: 35, spread: 65 });
      setBannerMsg(`🧺 Đã thu hoạch toàn bộ! Nhận được +${totalCoins} Coins và +${totalExp} EXP! 🎉`);
      return;
    }

    fetch('/api/pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'harvest_all_livestock' }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data: any) => {
        if (!isMountedRef.current) return;
        if (data?.livestock) applyLivestock(data.livestock);
        if (data?.error) {
          sound.playError();
          setBannerMsg(`⛔ ${data.error}`);
          return;
        }

        const stillReady = new Set(
          (Array.isArray(data?.livestock) ? data.livestock : [])
            .filter((r: any) => r.status === 'ready')
            .map((r: any) => (r.animal_type === 'cow' ? 'cow' : 'chicken'))
        );
        const collected = producesRef.current.filter(
          (p) => !stillReady.has(p.type === 'egg' ? 'chicken' : 'cow')
        );
        let totalCoins = 0;
        let totalExp = 0;
        collected.forEach((item) => {
          totalCoins += item.rewardCoins;
          totalExp += item.rewardExp;
          if (item.type === 'egg') setHarvestedEggs((prev) => prev + 1);
          else setHarvestedMilk((prev) => prev + 1);
          addFloatText(`+${item.rewardCoins}🪙`, item.x, item.y - 20, '#facc15');
        });
        producesRef.current = producesRef.current.filter((p) => collected.indexOf(p) === -1);

        if (typeof data?.userCoins === 'number') syncCoinsFromServer(data.userCoins);
        if (onUpdatePetExp && totalExp > 0) onUpdatePetExp(totalExp);

        sound.playCelebration();
        confetti({ particleCount: 35, spread: 65 });
        setBannerMsg(
          data?.message ||
            `🧺 Đã thu hoạch toàn bộ! Nhận được +${totalCoins} Coins và +${totalExp} EXP! 🎉`
        );
      })
      .catch(() => {
        if (isMountedRef.current) setBannerMsg('⚠️ Mất kết nối máy chủ — chưa thu hoạch được, thử lại sau.');
      });
  };

  // Canvas Click & Touch Interaction Handler
  const handleInteractionAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // 1. Check if clicked on Produce (Egg / Milk)
    for (let i = producesRef.current.length - 1; i >= 0; i--) {
      const p = producesRef.current[i];
      const dist = Math.hypot(clickX - p.x, clickY - p.y);
      if (dist < 32) {
        collectProduce(p);
        return;
      }
    }

    // 2. Check if clicked on an animal directly (Petting)
    for (const a of animalsRef.current) {
      const dist = Math.hypot(clickX - a.x, clickY - a.y);
      if (dist < 40) {
        a.heartTimer = 70;
        sound.playPop();
        addFloatText('❤️ Moah~', a.x, a.y - 30, '#f43f5e');
        setBannerMsg(`${a.name} được bạn vuốt ve nên vô cùng sung sướng!`);
        return;
      }
    }

    // 3. Drop food if inside paddock
    if (activeTool === 'wheat' || activeTool === 'hay') {
      dropFoodAt(clickX, clickY, activeTool);
    } else {
      if (clickX < canvasWidth * 0.48) {
        dropFoodAt(clickX, clickY, 'wheat');
      } else {
        dropFoodAt(clickX, clickY, 'hay');
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInteractionAt(e.clientX, e.clientY);
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    handleInteractionAt(touch.clientX, touch.clientY);
  };

  // High-DPI 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina / HiDPI Scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);

    let animId: number;

    const gameLoop = () => {
      frameCountRef.current++;
      const frame = frameCountRef.current;

      // 1. UPDATE ANIMALS AI
      animalsRef.current.forEach((animal) => {
        if (animal.heartTimer > 0) animal.heartTimer--;

        // Search for nearest suitable food drop
        const targetFood = foodsRef.current.find(
          (f) =>
            f.remaining > 0 &&
            ((animal.type === 'chicken' && f.type === 'wheat') ||
              (animal.type === 'cow' && f.type === 'hay'))
        );

        if (targetFood && animal.state !== 'eating' && animal.state !== 'producing') {
          animal.targetX = targetFood.x + (Math.random() * 20 - 10);
          animal.targetY = targetFood.y + (Math.random() * 20 - 10);

          const dx = animal.targetX - animal.x;
          const dy = animal.targetY - animal.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 16) {
            // Arrived at food -> Eat!
            animal.state = 'eating';
            animal.actionTimer = animal.type === 'chicken' ? 50 : 80;
            animal.direction = dx > 0 ? 1 : -1;
            targetFood.remaining--;
            if (targetFood.remaining <= 0) {
              foodsRef.current = foodsRef.current.filter((f) => f.id !== targetFood.id);
            }
          } else {
            animal.state = 'walk';
            animal.direction = dx > 0 ? 1 : -1;
            const speed = animal.type === 'chicken' ? 1.6 : 1.0;
            animal.x += (dx / dist) * speed;
            animal.y += (dy / dist) * speed;
          }
        } else if (animal.state === 'eating') {
          animal.actionTimer--;
          if (animal.actionTimer <= 0) {
            // Ăn xong → vui mừng. TRỨNG/SỮA KHÔNG sinh ở đây nữa:
            // chu kỳ 3h/24h chạy trên server, client chỉ spawn khi server báo xong.
            animal.state = 'producing';
            animal.actionTimer = 40;
            animal.heartTimer = 80;
          }
        } else if (animal.state === 'producing') {
          animal.actionTimer--;
          if (animal.actionTimer <= 0) {
            animal.state = 'idle';
            animal.actionTimer = 60 + Math.random() * 80;
          }
        } else {
          // Wander peacefully
          animal.actionTimer--;
          if (animal.actionTimer <= 0) {
            if (animal.state === 'idle') {
              const minX = animal.type === 'chicken' ? 130 : 440;
              const maxX = animal.type === 'chicken' ? 390 : 760;
              const minY = 200;
              const maxY = 450;
              animal.targetX = minX + Math.random() * (maxX - minX);
              animal.targetY = minY + Math.random() * (maxY - minY);
              animal.state = 'walk';
              animal.direction = animal.targetX > animal.x ? 1 : -1;
              animal.actionTimer = 80 + Math.random() * 100;
            } else {
              animal.state = 'idle';
              animal.actionTimer = 60 + Math.random() * 90;
            }
          }

          if (animal.state === 'walk') {
            const dx = animal.targetX - animal.x;
            const dy = animal.targetY - animal.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 4) {
              const speed = animal.type === 'chicken' ? 1.0 : 0.65;
              animal.x += (dx / dist) * speed;
              animal.y += (dy / dist) * speed;
            } else {
              animal.state = 'idle';
            }
          }
        }
      });

      // 2. UPDATE FLOATING TEXTS
      for (let i = floatTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatTextsRef.current[i];
        ft.y -= 0.7;
        ft.alpha -= 0.018;
        if (ft.alpha <= 0) {
          floatTextsRef.current.splice(i, 1);
        }
      }

      // 3. RENDER ULTRA-CRISP RETINA CANVAS
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Scale coordinates for razor-sharp vector rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // --- LAYER 1: BẦU TRỜI SỚM MAI DỊU MẮT + ĐỒI XA CÓ CHIỀU SÂU ---
      // Trời chuyển tông nhạt dần về chân trời (tạo phối cảnh xa)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 182);
      skyGrad.addColorStop(0, '#8ecae6');
      skyGrad.addColorStop(0.55, '#cdeffd');
      skyGrad.addColorStop(1, '#fdf6e3');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasWidth, 182);

      // Ông mặt trời ấm áp + quầng sáng mềm
      ctx.fillStyle = 'rgba(255, 230, 109, 0.28)';
      ctx.beginPath();
      ctx.arc(canvasWidth - 92, 46, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 236, 150, 0.5)';
      ctx.beginPath();
      ctx.arc(canvasWidth - 92, 46, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe66d';
      ctx.beginPath();
      ctx.arc(canvasWidth - 92, 46, 26, 0, Math.PI * 2);
      ctx.fill();
      // Tia nắng nhẹ
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      for (let r = 0; r < 8; r++) {
        const a = (r / 8) * Math.PI * 2 + frame * 0.002;
        ctx.beginPath();
        ctx.moveTo(canvasWidth - 92 + Math.cos(a) * 32, 46 + Math.sin(a) * 32);
        ctx.lineTo(canvasWidth - 92 + Math.cos(a) * 38, 46 + Math.sin(a) * 38);
        ctx.stroke();
      }

      // Mây trắng trôi chậm, có bóng mềm bên dưới
      drawFarmCloud(ctx, 120 + ((frame * 0.12) % (canvasWidth + 220)) - 110, 42, 0.95);
      drawFarmCloud(ctx, 430 + ((frame * 0.08) % (canvasWidth + 220)) - 110, 30, 0.7);
      drawFarmCloud(ctx, 660 + ((frame * 0.1) % (canvasWidth + 220)) - 110, 58, 0.85);

      // Dãy núi xa (nhạt) + đồi gần (đậm hơn) → chiều sâu 2.5D
      ctx.fillStyle = '#b8e6c3';
      ctx.beginPath();
      ctx.moveTo(0, 182);
      ctx.quadraticCurveTo(150, 118, 330, 152);
      ctx.quadraticCurveTo(560, 108, canvasWidth, 168);
      ctx.lineTo(canvasWidth, 182);
      ctx.lineTo(0, 182);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#8fd8a8';
      ctx.beginPath();
      ctx.moveTo(0, 182);
      ctx.quadraticCurveTo(230, 138, 510, 172);
      ctx.quadraticCurveTo(710, 142, canvasWidth, 182);
      ctx.lineTo(canvasWidth, 182);
      ctx.lineTo(0, 182);
      ctx.closePath();
      ctx.fill();

      // Hàng cây xa mờ trên chân đồi
      for (let tx = 30; tx < canvasWidth; tx += 58) {
        const ty = 158 + Math.sin(tx * 0.05) * 7;
        ctx.fillStyle = 'rgba(46, 125, 75, 0.55)';
        ctx.beginPath();
        ctx.arc(tx, ty, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(46, 125, 75, 0.35)';
        ctx.fillRect(tx - 1.5, ty + 6, 3, 8);
      }

      // --- LAYER 2: ĐỒNG CỎ CHUYỂN TÔNG THEO CHIỀU DỌC (xa sáng → gần đậm) ---
      const grassGrad = ctx.createLinearGradient(0, 170, 0, canvasHeight);
      grassGrad.addColorStop(0, '#a8e063');
      grassGrad.addColorStop(0.35, '#83cc5e');
      grassGrad.addColorStop(0.7, '#5cae4e');
      grassGrad.addColorStop(1, '#478f3e');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 170, canvasWidth, canvasHeight - 170);

      // --- 2.5D: ĐỘ SÂU CỦA NỀN ĐẤT ---
      // Sương mù chân trời (horizon haze) tạo không khí xa
      const hazeGrad = ctx.createLinearGradient(0, 168, 0, 250);
      hazeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      hazeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 168, canvasWidth, 84);

      // Các dải cỏ theo chiều sâu: xa thì sáng, gần thì tối dần (mô phỏng phối cảnh)
      const depthBands = [
        { y: 238, color: 'rgba(27, 77, 32, 0.05)' },
        { y: 296, color: 'rgba(27, 77, 32, 0.08)' },
        { y: 354, color: 'rgba(27, 77, 32, 0.11)' },
        { y: 412, color: 'rgba(27, 77, 32, 0.15)' },
        { y: 470, color: 'rgba(27, 77, 32, 0.20)' },
      ];
      depthBands.forEach((band) => {
        ctx.fillStyle = band.color;
        ctx.beginPath();
        ctx.moveTo(0, band.y);
        ctx.quadraticCurveTo(canvasWidth * 0.5, band.y - 9, canvasWidth, band.y);
        ctx.lineTo(canvasWidth, band.y + 58);
        ctx.quadraticCurveTo(canvasWidth * 0.5, band.y + 49, 0, band.y + 58);
        ctx.closePath();
        ctx.fill();
      });

      // Cỏ non + hoa dại thưa (dịu mắt, không rối)
      for (let gx = 30; gx < canvasWidth - 30; gx += 62) {
        for (let gy = 196; gy < canvasHeight - 40; gy += 52) {
          const shiftX = (gy * 13) % 35;
          ctx.strokeStyle = 'rgba(52, 120, 45, 0.8)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(gx + shiftX, gy);
          ctx.lineTo(gx + shiftX - 3, gy - 6);
          ctx.moveTo(gx + shiftX, gy);
          ctx.lineTo(gx + shiftX + 3, gy - 7);
          ctx.stroke();

          // Hoa cúc dại điểm xuyết
          if ((gx + gy) % 11 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(gx + shiftX + 8, gy - 5, 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(gx + shiftX + 8, gy - 5, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
          // Cỏ ba lá may mắn
          if ((gx * 7 + gy) % 23 === 0) {
            ctx.fillStyle = 'rgba(34, 150, 70, 0.85)';
            ctx.beginPath();
            ctx.arc(gx + shiftX - 8, gy - 3, 2.2, 0, Math.PI * 2);
            ctx.arc(gx + shiftX - 5, gy - 3, 2.2, 0, Math.PI * 2);
            ctx.arc(gx + shiftX - 6.5, gy - 5.5, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // --- ĐƯỜNG MÒN UỐN LƯỢN nối 2 chuồng ra tiền cảnh ---
      drawWindingTrail(ctx, canvasWidth, canvasHeight, frame);

      // --- LAYER 3: AO SEN THƠ MỘNG (bờ cỏ + nước trong + lá sen) ---
      ctx.save();
      const pondX = 95;
      const pondY = 430;
      // Bóng đổ mềm của ao trên cỏ
      ctx.fillStyle = 'rgba(27, 77, 32, 0.22)';
      ctx.beginPath();
      ctx.ellipse(pondX + 6, pondY + 8, 88, 52, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Bờ ao đất + viền cỏ
      ctx.fillStyle = '#d9b98f';
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, 82, 50, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7fbf6a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, 82, 50, -0.15, 0, Math.PI * 2);
      ctx.stroke();

      // Mặt nước trong xanh chuyển tông
      const waterGrad = ctx.createLinearGradient(pondX - 60, pondY - 30, pondX + 60, pondY + 30);
      waterGrad.addColorStop(0, '#7dd3fc');
      waterGrad.addColorStop(0.5, '#38bdf8');
      waterGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, 72, 42, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Vệt sáng mặt nước
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(pondX - 22, pondY - 14, 26, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Gợn sóng lan tỏa
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      const ripple = (frame * 0.04) % 18;
      ctx.beginPath();
      ctx.arc(pondX - 8, pondY, 14 + ripple, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(pondX + 10, pondY + 6, 8 + ripple * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Lá sen + hoa sen hồng
      drawLilyPad(ctx, pondX - 30, pondY - 10, 11);
      drawLilyPad(ctx, pondX + 28, pondY + 10, 13);
      drawLotusFlower(ctx, pondX - 10, pondY + 12);
      drawLotusFlower(ctx, pondX + 34, pondY - 8);

      // Cầu gỗ nhỏ + cỏ lau bên bờ
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(pondX + 44, pondY - 32, 28, 11);
      ctx.fillStyle = '#a8713a';
      ctx.fillRect(pondX + 44, pondY - 30, 28, 3);
      ctx.fillRect(pondX + 44, pondY - 24, 28, 3);
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pondX - 72, pondY - 18);
      ctx.quadraticCurveTo(pondX - 76, pondY - 34, pondX - 70, pondY - 40);
      ctx.moveTo(pondX - 64, pondY - 16);
      ctx.quadraticCurveTo(pondX - 64, pondY - 32, pondX - 58, pondY - 36);
      ctx.stroke();
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.ellipse(pondX - 70, pondY - 42, 3, 6, 0.2, 0, Math.PI * 2);
      ctx.ellipse(pondX - 58, pondY - 38, 3, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- 2.5D: MẶT ĐẤT PHÍA TRƯỚC + HÀNG RÀO ĐÁ TIỀN CẢNH ---
      drawForegroundLedge(ctx, canvasWidth, canvasHeight);
      drawStoneRow(ctx, canvasWidth, canvasHeight);

      // --- LAYER 4: HÀNG RÀO GỖ + 2 CHUỒNG RIÊNG CÓ MÁI ---
      // Hàng rào gỗ chạy ngang sau lưng đàn vật (2 khoảnh: gà / bò)
      drawWoodFenceRun(ctx, 108, 372, 196);
      drawWoodFenceRun(ctx, 468, 752, 196);
      // Cột phân cách 2 khoảnh ở giữa
      ctx.fillStyle = 'rgba(27, 77, 32, 0.25)';
      ctx.beginPath();
      ctx.ellipse(421, 232, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7c4a1e';
      ctx.fillRect(415, 188, 12, 44);
      ctx.fillStyle = '#a8713a';
      ctx.fillRect(415, 188, 5, 44);
      ctx.fillStyle = '#c98f4e';
      ctx.beginPath();
      ctx.ellipse(421, 187, 8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cụm cây có bóng đổ (phải xa + trái gần ao)
      drawFarmTree(ctx, 792, 208, 1.0, frame);
      drawFarmTree(ctx, 748, 226, 0.7, frame + 20);
      drawFarmTree(ctx, 52, 218, 0.62, frame + 40);

      // Bồn hoa cạnh 2 chuồng
      drawFlowerBed(ctx, 330, 172, ['#ef4444', '#f472b6', '#facc15']);
      drawFlowerBed(ctx, 560, 172, ['#ffffff', '#f472b6', '#fb923c']);

      // COZY CHICKEN BARN (Chuồng Gà Meowlish)
      drawCozyChickenCoop(ctx, 45, 55);

      // COZY DAIRY BARN (Chuồng Bò Meowlish)
      drawCozyDairyBarn(ctx, canvasWidth - 235, 45);

      // --- LAYER 5: FOOD DROPS ---
      foodsRef.current.forEach((food) => {
        ctx.save();
        if (food.type === 'wheat') {
          // Golden Wheat Pile
          ctx.fillStyle = '#facc15';
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(food.x + (i % 3) * 6 - 6, food.y + Math.floor(i / 3) * 5, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#ca8a04';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('🌾', food.x - 7, food.y - 8);
        } else {
          // Sweet Green/Yellow Hay Bale
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(food.x - 14, food.y - 8, 28, 17);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(food.x - 12, food.y - 6, 24, 13);
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(food.x - 5, food.y - 8, 2, 17);
          ctx.fillRect(food.x + 5, food.y - 8, 2, 17);
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('🌿', food.x - 7, food.y - 12);
        }
        ctx.restore();
      });

      // --- LAYER 6: PRODUCE (GOLDEN EGGS & FRESH MILK) ---
      producesRef.current.forEach((prod) => {
        ctx.save();
        const bounce = Math.sin((Date.now() - prod.createdAt) * 0.008) * 3;
        const py = prod.y + bounce;

        // Radiant Sparkle Glow Aura
        const glowGrad = ctx.createRadialGradient(prod.x, py, 4, prod.x, py, 22);
        if (prod.type === 'egg') {
          glowGrad.addColorStop(0, 'rgba(250, 204, 21, 0.7)');
          glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        } else {
          glowGrad.addColorStop(0, 'rgba(147, 197, 253, 0.7)');
          glowGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
        }
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(prod.x, py, 22, 0, Math.PI * 2);
        ctx.fill();

        if (prod.type === 'egg') {
          // Radiant Golden Egg
          const eggGrad = ctx.createLinearGradient(prod.x - 6, py - 12, prod.x + 6, py + 12);
          eggGrad.addColorStop(0, '#fef08a');
          eggGrad.addColorStop(0.5, '#facc15');
          eggGrad.addColorStop(1, '#ca8a04');
          ctx.fillStyle = eggGrad;
          ctx.beginPath();
          ctx.ellipse(prod.x, py, 9.5, 13.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // White shine curve
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(prod.x - 3.5, py - 4, 5, -0.8, 0.5);
          ctx.stroke();

          // Twinkling Star
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText('✨', prod.x + 6, py - 8);
        } else {
          // Classic Glass Milk Bottle
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(prod.x - 8, py - 10, 16, 20); // Bottle body
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(prod.x - 6, py - 8, 12, 16); // White milk inside
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(prod.x - 8, py - 10, 16, 20);

          // Bottle Neck & Blue Foil Cap
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(prod.x - 5, py - 15, 10, 5);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(prod.x - 5, py - 15, 10, 5);

          // Cute Label Heart
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(prod.x, py, 3, 0, Math.PI * 2);
          ctx.fill();

          // Sparkle
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText('✨', prod.x + 8, py - 9);
        }

        // Crisp Harvest Pill Badge
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(prod.x - 26, py + 16, 52, 15, 7.5);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Chạm Nhặt', prod.x, py + 27);

        ctx.restore();
      });

      // --- LAYER 7: ANIMALS RENDERING (Depth sorted, 2.5D nổi khối) ---
      const sortedAnimals = [...animalsRef.current].sort((a, b) => a.y - b.y);

      sortedAnimals.forEach((animal) => {
        const isCow = animal.type === 'cow';

        // 1) Bóng đổ đậm ngay dưới thân — làm con vật "đứng trên mặt đất"
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.beginPath();
        ctx.ellipse(animal.x + 7, animal.y + (isCow ? 24 : 15), isCow ? 42 : 26, isCow ? 13 : 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2) Hào quang sáng nhẹ để tách con vật khỏi nền (nổi bật hơn)
        const haloRadius = isCow ? 62 : 44;
        const halo = ctx.createRadialGradient(animal.x, animal.y - 8, 6, animal.x, animal.y - 8, haloRadius);
        halo.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        halo.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
        halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(animal.x, animal.y - 8, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // 3) Phóng to 14% quanh điểm đặt chân — con vật to, dễ nhìn hơn
        ctx.save();
        const scaleUp = 1.14;
        ctx.translate(animal.x, animal.y);
        ctx.scale(scaleUp, scaleUp);
        ctx.translate(-animal.x, -animal.y);

        if (animal.type === 'chicken') {
          drawChibiChicken({
            ctx,
            x: animal.x,
            y: animal.y,
            direction: animal.direction,
            state: animal.state,
            frame,
            isRooster: animal.isRooster,
            isChick: animal.isChick,
            heartTimer: animal.heartTimer,
          });
        } else {
          drawChibiDairyCow({
            ctx,
            x: animal.x,
            y: animal.y,
            direction: animal.direction,
            state: animal.state,
            frame,
            heartTimer: animal.heartTimer,
          });
        }
        ctx.restore();
      });

      // --- LAYER 7b: THANH ĐẾM NGƯỢC CHU KỲ NGAY TRÊN ĐẦU CON VẬT ---
      const nowMs = Date.now();
      sortedAnimals.forEach((animal) => {
        const row = livestockRef.current[animal.type];
        if (!row) return;
        const isCow = animal.type === 'cow';
        const barTop = animal.y - (isCow ? 66 : 52);

        if (row.status === 'producing') {
          const start = Number(row.last_fed_at ?? row.fed_at ?? 0);
          const end = Number(row.producing_until ?? row.ready_at ?? 0);
          const progress = end > start ? Math.min(1, Math.max(0, (nowMs - start) / (end - start))) : 0;
          const remain = end > 0 ? Math.max(0, Math.ceil((end - nowMs) / 1000)) : 0;
          drawCountdownBar(ctx, animal.x, barTop, progress, formatCountdown(remain), animal.type);
        } else if (row.status === 'ready') {
          drawReadyBadge(ctx, animal.x, barTop, animal.type, frame);
        }
      });

      // --- LAYER 8: CRISP FLOATING TEXTS ---
      floatTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        // Drop shadow for legibility
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  // KHÔNG để `userCoins` vào deps (đo 2026-10-09): mỗi lần đổi số dư là cả
  // canvas 60fps bị dựng lại (set canvas.width/height → xoá framebuffer, nháy
  // hình). Vòng lặp không đọc coins — chỉ đọc qua userCoinsRef khi cần.
  }, [userId]);

  // ===== Đồng hồ chu kỳ: poll server + tick 1s cho UI =====
  // useState(0) chứ không phải Date.now() trong initializer: Date.now() khác
  // nhau giữa server và client → hydration mismatch (render lại toàn bộ).
  const [nowTick, setNowTick] = useState<number>(0);
  useEffect(() => {
    isMountedRef.current = true;
    // Nhánh setTimeout(0) cho `now` khớp ngay sau hydrate; set trực tiếp trong
    // thân effect sẽ gây cascading render (react-hooks/set-state-in-effect).
    const firstTick = window.setTimeout(() => setNowTick(Date.now()), 0);
    syncLivestock();
    const pollTimer = window.setInterval(() => {
      syncLivestock();
    }, 4000);
    const tickTimer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => {
      isMountedRef.current = false;
      window.clearTimeout(firstTick);
      window.clearInterval(pollTimer);
      window.clearInterval(tickTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="w-full flex flex-col gap-3" ref={containerRef}>
      {/* Top Banner Status (Purged of all external trademarks) */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-white shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🌾</span>
          <div>
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              Nông Trại Meowlish 2.5D
              <span className="text-[12px] px-2 py-0.5 bg-emerald-500/40 text-emerald-200 rounded-full font-extrabold border border-emerald-400/40">
                HD 60 FPS · SERVER TIMER
              </span>
            </h3>
            <p className="text-xs text-slate-200 font-medium" data-testid="farm-banner">
              {bannerMsg}
            </p>
          </div>
        </div>

        {/* Harvest Counter & Collect All Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 bg-black/45 px-3 py-1.5 rounded-xl border border-white/15 text-xs font-black">
            <div className="flex items-center gap-1 text-amber-300">
              <span>🥚 Trứng:</span>
              <span>{harvestedEggs}</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-1 text-sky-300">
              <span>🥛 Sữa:</span>
              <span>{harvestedMilk}</span>
            </div>
          </div>

          <button
            onClick={handleCollectAll}
            data-testid="harvest-all"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1 active:scale-95 border-b-[3px] border-amber-700"
            title="Thu hoạch tất cả trứng và sữa đã chín"
          >
            <span>🧺</span>
            <span>Thu Hoạch Hết</span>
          </button>
        </div>
      </div>

      {/* ===== THANH ĐẾM NGƯỢC CHU KỲ SERVER (Gà 3 giờ / Bò 24 giờ) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <LivestockCountdownCard type="chicken" state={livestockUi.chicken} now={nowTick} />
        <LivestockCountdownCard type="cow" state={livestockUi.cow} now={nowTick} />
      </div>

      {/* Main 2D Canvas Viewport (High-DPI Native Sharpness) */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-900 bg-slate-950 flex justify-center items-center select-none">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchEnd={handleCanvasTouchEnd}
          className="cursor-crosshair w-full max-w-[840px] h-auto object-contain block touch-none"
        />

        {/* Floating Tool Bar Inside Canvas Top-Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/25 shadow-2xl">
          <button
            onClick={() => setActiveTool('wheat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'wheat'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={`Rải thóc cho gà ăn (${LIVESTOCK_CATALOG.chicken.feedPrice} xu) — khóa khi đang đếm chu kỳ`}
          >
            <span>🌾</span>
            <span>{`Rải Thóc (${LIVESTOCK_CATALOG.chicken.feedPrice}🪙)`}</span>
          </button>

          <button
            onClick={() => setActiveTool('hay')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'hay'
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={`Rải cỏ cho bò ăn (${LIVESTOCK_CATALOG.cow.feedPrice} xu) — khóa khi đang đếm chu kỳ`}
          >
            <span>🌿</span>
            <span>{`Rải Cỏ (${LIVESTOCK_CATALOG.cow.feedPrice}🪙)`}</span>
          </button>
        </div>
      </div>

      {/* Farm Activity Guide Card */}
      <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-100 font-medium">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <b>Mẹo Nông Dân Meowlish:</b> Gà đẻ 🥚 mỗi <b>3 giờ</b>, bò cho 🥛 mỗi <b>24 giờ</b> — chu kỳ tính trên máy chủ nên tải lại trang vẫn giữ nguyên. Trong lúc đếm ngược, đàn vật <b>không ăn thêm</b> được; hết chu kỳ thì chạm vào sản phẩm để nhận Coins &amp; EXP!
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Thẻ trạng thái chu kỳ sản xuất phía server (đếm ngược 3h/24h)
 * — hiển thị song song với thanh vẽ trên đầu con vật trong canvas.
 */
function LivestockCountdownCard({
  type,
  state,
  now,
}: {
  type: 'chicken' | 'cow';
  state: LivestockState | null;
  now: number;
}) {
  const meta = LIVESTOCK_CATALOG[type] || LIVESTOCK_CATALOG.chicken;
  const status: LivestockStatus = state?.status ?? 'idle';
  const end = Number(state?.producing_until ?? state?.ready_at ?? 0);
  const start = Number(state?.last_fed_at ?? state?.fed_at ?? 0);
  const cycle = Number(state?.total_seconds) || DEFAULT_CYCLE_SECONDS[type];
  // `now` = 0 nghĩa là đồng hồ client chưa được set (xem useState(0) ở trên) →
  // không được tính đếm ngược từ mốc 0 (sẽ ra số giờ khổng lồ 1 khung hình).
  const remain = status === 'producing' && end > 0 && now > 0 ? Math.max(0, Math.ceil((end - now) / 1000)) : 0;

  let progress = 0;
  if (status === 'ready') progress = 1;
  else if (end > start && now > 0 && now >= start) progress = Math.min(1, Math.max(0, (now - start) / (end - start)));

  const fmt = (total: number) => {
    const s = Math.max(0, Math.floor(total));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  };

  const badgeText =
    status === 'producing' ? 'ĐANG SẢN XUẤT' : status === 'ready' ? 'SẴN SÀNG THU HOẠCH' : 'CHƯA CHO ĂN';
  const badgeClass =
    status === 'producing'
      ? 'bg-sky-500/25 text-sky-200 border-sky-400/60'
      : status === 'ready'
        ? 'bg-amber-400 text-slate-950 border-amber-200 animate-pulse'
        : 'bg-white/10 text-emerald-200 border-emerald-400/40';
  const fill =
    status === 'ready'
      ? '#facc15'
      : type === 'chicken'
        ? 'linear-gradient(90deg, #f59e0b, #fde047)'
        : 'linear-gradient(90deg, #0ea5e9, #7dd3fc)';

  return (
    <div
      data-testid={`livestock-status-${type}`}
      data-status={status}
      data-remaining={String(remain)}
      data-progress={String(Math.round(progress * 100))}
      className={`relative overflow-hidden rounded-2xl border-2 px-3 py-2 flex items-center gap-3 shadow-lg ${
        status === 'ready'
          ? 'border-amber-400 bg-amber-500/20'
          : status === 'producing'
            ? 'border-sky-400/60 bg-emerald-950/70'
            : 'border-emerald-500/40 bg-emerald-950/50'
      }`}
    >
      <div className="text-2xl leading-none shrink-0">{type === 'chicken' ? '🐔' : '🐄'}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[12px] font-black uppercase tracking-wider truncate ${
              status === 'ready' ? 'text-amber-950' : 'text-amber-300'
            }`}
          >
            {type === 'chicken' ? 'Gà Đẻ (chu kỳ 3 giờ)' : 'Bò Sữa (chu kỳ 24 giờ)'}
          </span>
          <span
            data-testid={`livestock-badge-${type}`}
            className={`text-[12px] px-2 py-0.5 rounded-full font-black border whitespace-nowrap ${badgeClass}`}
          >
            {badgeText}
          </span>
        </div>

        <div className="mt-1.5 h-2.5 w-full rounded-full bg-black/55 border border-white/15 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%`, background: fill }}
          />
        </div>

        <div
          className={`mt-1 flex items-center justify-between gap-2 text-[12px] font-bold ${
            status === 'ready' ? 'text-amber-950/90' : 'text-emerald-100/90'
          }`}
        >
          <span className="truncate">
            {status === 'producing'
              ? `⏳ Còn ${fmt(remain)} nữa`
              : status === 'ready'
                ? '🧺 Chạm vào trứng/sữa để thu hoạch'
                : `${meta.name} chưa ăn · chu kỳ ${fmt(cycle)}`}
          </span>
          <span className={`shrink-0 ${status === 'ready' ? 'text-amber-950' : 'text-amber-200/90'}`}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: Draw Soft Puffy Cloud (giữ lại cho tương thích)
 */
function drawPuffyCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1.0) {
  drawFarmCloud(ctx, x, y, scale);
}

/**
 * Helper 2.5D: Mây nông trại — trắng mềm, có bóng đổ nhẹ bên dưới
 */
function drawFarmCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Bóng mềm dưới mây
  ctx.fillStyle = 'rgba(148, 184, 220, 0.35)';
  ctx.beginPath();
  ctx.ellipse(16, 10, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Thân mây trắng
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.arc(16, -7, 15, 0, Math.PI * 2);
  ctx.arc(33, -1, 16, 0, Math.PI * 2);
  ctx.arc(16, 6, 14, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  // Điểm sáng trên đỉnh mây
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.ellipse(14, -8, 12, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Helper 2.5D: Đường mòn uốn lượn nối 2 chuồng ra tiền cảnh
 */
function drawWindingTrail(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
  ctx.save();
  // Bóng đổ mềm của đường
  ctx.fillStyle = 'rgba(27, 77, 32, 0.20)';
  ctx.beginPath();
  ctx.moveTo(288, 186);
  ctx.bezierCurveTo(360, 250, 300, 330, 372, 400);
  ctx.bezierCurveTo(410, 440, 420, 470, 430, height - 44);
  ctx.lineTo(386, height - 44);
  ctx.bezierCurveTo(376, 470, 366, 440, 330, 402);
  ctx.bezierCurveTo(258, 332, 318, 252, 246, 188);
  ctx.closePath();
  ctx.fill();
  // Nền cát
  ctx.fillStyle = '#ecd9a8';
  ctx.beginPath();
  ctx.moveTo(280, 182);
  ctx.bezierCurveTo(352, 246, 292, 326, 364, 396);
  ctx.bezierCurveTo(402, 436, 412, 466, 422, height - 48);
  ctx.lineTo(382, height - 48);
  ctx.bezierCurveTo(372, 466, 362, 436, 326, 398);
  ctx.bezierCurveTo(254, 328, 314, 248, 242, 184);
  ctx.closePath();
  ctx.fill();
  // Lòng đường sáng hơn
  ctx.fillStyle = '#f6e8c4';
  ctx.beginPath();
  ctx.moveTo(282, 188);
  ctx.bezierCurveTo(344, 250, 296, 328, 360, 394);
  ctx.bezierCurveTo(394, 432, 402, 462, 410, height - 52);
  ctx.lineTo(394, height - 52);
  ctx.bezierCurveTo(386, 462, 378, 432, 344, 396);
  ctx.bezierCurveTo(280, 330, 328, 252, 264, 190);
  ctx.closePath();
  ctx.fill();
  // Đá lát uốn theo đường
  const stones = 7;
  for (let i = 0; i < stones; i++) {
    const t = i / (stones - 1);
    const sx = 302 + Math.sin(t * 5.2) * 34 + t * 96;
    const sy = 210 + t * 250;
    const wobble = Math.sin(frame * 0.02 + i) * 0.8;
    ctx.fillStyle = '#c9a06a';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 13, 7, wobble * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f6e8c4';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Helper 2.5D: Hàng rào gỗ chạy ngang (2 thanh + cọc có nắp)
 */
function drawWoodFenceRun(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number) {
  ctx.save();
  // Bóng đổ dưới chân rào
  ctx.fillStyle = 'rgba(27, 77, 32, 0.22)';
  ctx.fillRect(x0 - 4, y + 22, x1 - x0 + 8, 7);
  // 2 thanh ngang
  ctx.fillStyle = '#a8713a';
  ctx.fillRect(x0, y, x1 - x0, 7);
  ctx.fillRect(x0, y + 13, x1 - x0, 7);
  ctx.fillStyle = '#c98f4e';
  ctx.fillRect(x0, y, x1 - x0, 2.5);
  ctx.fillRect(x0, y + 13, x1 - x0, 2.5);
  // Cọc đứng
  for (let px = x0 + 6; px <= x1; px += 52) {
    ctx.fillStyle = 'rgba(27, 77, 32, 0.2)';
    ctx.beginPath();
    ctx.ellipse(px, y + 27, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7c4a1e';
    ctx.fillRect(px - 5, y - 8, 10, 34);
    ctx.fillStyle = '#a8713a';
    ctx.fillRect(px - 5, y - 8, 4, 34);
    ctx.fillStyle = '#c98f4e';
    ctx.beginPath();
    ctx.ellipse(px, y - 8, 6.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7c4a1e';
    ctx.fillRect(px - 1, y + 2, 2, 4);
  }
  ctx.restore();
}

/**
 * Helper 2.5D: Cụm cây có bóng đổ (thân + 3 tầng tán + táo điểm)
 */
function drawFarmTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, frame: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Bóng đổ lệch theo nắng (nắng bên phải → bóng lệch trái)
  ctx.fillStyle = 'rgba(27, 77, 32, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-12, 46, 44, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Thân cây
  const trunk = ctx.createLinearGradient(-8, 0, 8, 0);
  trunk.addColorStop(0, '#6b3f17');
  trunk.addColorStop(0.5, '#8a5a2b');
  trunk.addColorStop(1, '#5d3410');
  ctx.fillStyle = trunk;
  ctx.beginPath();
  ctx.moveTo(-8, 46);
  ctx.quadraticCurveTo(-5, 20, -7, 0);
  ctx.lineTo(7, 0);
  ctx.quadraticCurveTo(5, 20, 8, 46);
  ctx.closePath();
  ctx.fill();
  // Tán lá 3 tầng (xanh dịu)
  const sway = Math.sin(frame * 0.03 + x) * 1.5;
  const leaf = (cx: number, cy: number, r: number, c: string) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(cx + sway, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  leaf(-18, -18, 22, '#3d8b4f');
  leaf(18, -18, 22, '#3d8b4f');
  leaf(0, -32, 26, '#4da65e');
  leaf(-10, -40, 14, '#7ccf8a');
  leaf(8, -44, 12, '#8fd8a0');
  // Táo đỏ điểm xuyết
  ctx.fillStyle = '#e05252';
  [[-14, -28], [4, -34], [16, -22]].forEach(([ax, ay]) => {
    ctx.beginPath();
    ctx.arc(ax + sway, ay, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(ax + sway - 1, ay - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e05252';
  });
  ctx.restore();
}

/**
 * Helper 2.5D: Bồn hoa tròn (đất + viền đá + hoa tulip/cúc)
 */
function drawFlowerBed(ctx: CanvasRenderingContext2D, x: number, y: number, colors: string[]) {
  ctx.save();
  ctx.fillStyle = 'rgba(27, 77, 32, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 12, 52, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Đất
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 48, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6f4420';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 40, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Viền đá nhỏ
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const sx = x + Math.cos(a) * 48;
    const sy = y + 6 + Math.sin(a) * 13;
    ctx.fillStyle = i % 2 ? '#d6d3d1' : '#a8a29e';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 5, 4, a, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hoa: thân + bông
  const spots = [-30, -15, 0, 15, 30];
  spots.forEach((dx, i) => {
    const fx = x + dx;
    const fy = y - 4 - (i % 2) * 4;
    ctx.strokeStyle = '#3d8b4f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fx, y + 4);
    ctx.quadraticCurveTo(fx + 2, fy + 8, fx, fy);
    ctx.stroke();
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(fx - 3, fy - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(fx + 3, fy - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(fx, fy + 1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(fx, fy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/**
 * Helper 2.5D: Hàng rào đá tiền cảnh nằm trên mép khối đất
 */
function drawStoneRow(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const top = height - 46;
  ctx.save();
  for (let i = 0; i < 15; i++) {
    const sx = 26 + i * ((width - 52) / 14) + (i % 2 ? 6 : -4);
    const sy = top + (i % 3) * 3;
    const r = 10 + (i % 3) * 2.5;
    ctx.fillStyle = 'rgba(27, 77, 32, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx - 3, sy + 6, r, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(sx - r, sy - r, sx + r, sy + r);
    g.addColorStop(0, '#e7e5e4');
    g.addColorStop(1, '#a8a29e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx, sy, r, r * 0.72, (i % 2 ? 0.12 : -0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(sx - r * 0.3, sy - r * 0.3, r * 0.32, r * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Helper: Draw Lily Pad & Lotus
 */
function drawLilyPad(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0.2, Math.PI * 1.85);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawLotusFlower(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.ellipse(x - 5, y, 4, 7, -0.4, 0, Math.PI * 2);
  ctx.ellipse(x + 5, y, 4, 7, 0.4, 0, Math.PI * 2);
  ctx.ellipse(x, y - 2, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(x, y + 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Helper: Draw Cozy Chicken Coop
 */
function drawCozyChickenCoop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // --- 2.5D: BÓNG ĐỔ DỌC THEO ÁNH SÁNG (chèn xuống đất trước khi vẽ nhà) ---
  ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
  ctx.beginPath();
  ctx.ellipse(54, 150, 100, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
  ctx.beginPath();
  ctx.ellipse(34, 152, 74, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Coop Main Wood Walls
  const wallGrad = ctx.createLinearGradient(0, 40, 0, 120);
  wallGrad.addColorStop(0, '#b45309');
  wallGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 40, 140, 85);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 40, 140, 85);

  // Wood Planks
  ctx.fillStyle = '#92400e';
  for (let px = 15; px < 135; px += 20) {
    ctx.fillRect(px, 40, 3, 85);
  }

  // Mặt bên trái tối hơn → khối nhà có bề sâu 2.5D
  ctx.fillStyle = 'rgba(69, 26, 3, 0.62)';
  ctx.beginPath();
  ctx.moveTo(-2, 47);
  ctx.lineTo(-15, 54);
  ctx.lineTo(-15, 132);
  ctx.lineTo(-2, 125);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(28, 10, 2, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Gable Shingled Roof (Terracotta Red)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(-12, 45);
  ctx.lineTo(70, 0);
  ctx.lineTo(152, 45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Roof Eaves Trim
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(-12, 42, 164, 5);

  // Weathercock / Rooster Silhouette
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(70, 0);
  ctx.lineTo(70, -14);
  ctx.stroke();
  ctx.arc(70, -18, 4, 0, Math.PI * 2);
  ctx.fill();

  // Arched Hen Doorway with Straw Bedding
  ctx.fillStyle = '#291402';
  ctx.beginPath();
  ctx.arc(70, 85, 18, Math.PI, 0);
  ctx.lineTo(88, 125);
  ctx.lineTo(52, 125);
  ctx.closePath();
  ctx.fill();

  // Golden Straw in doorway
  ctx.fillStyle = '#fde047';
  ctx.fillRect(48, 120, 44, 7);

  // Little Wooden Ramp with Steps
  ctx.fillStyle = '#a16207';
  ctx.beginPath();
  ctx.moveTo(56, 125);
  ctx.lineTo(44, 150);
  ctx.lineTo(72, 150);
  ctx.lineTo(84, 125);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (let step = 0; step < 3; step++) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(49 + step * 8, 131 + step * 7, 18, 2);
  }

  // Cửa sổ tròn + hộp hoa bên hông chuồng gà
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(22, 70, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(11, 70);
  ctx.lineTo(33, 70);
  ctx.moveTo(22, 59);
  ctx.lineTo(22, 81);
  ctx.stroke();
  // Hộp hoa dưới cửa sổ
  ctx.fillStyle = '#7c4a1e';
  ctx.fillRect(10, 82, 24, 8);
  ['#ef4444', '#facc15', '#f472b6'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(14 + i * 8, 80, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Wooden Signboard: "CHUỒNG GÀ MEOWLISH"
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(14, 22, 112, 18, 4);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHUỒNG GÀ MEOWLISH', 70, 35);

  ctx.restore();
}

/**
 * Helper: Draw Cozy Dairy Barn
 */
function drawCozyDairyBarn(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // --- 2.5D: BÓNG ĐỔ DÀI TRÊN SÂN (trước khi vẽ khối nhà) ---
  ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
  ctx.beginPath();
  ctx.ellipse(66, 131, 114, 23, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.13)';
  ctx.beginPath();
  ctx.ellipse(40, 133, 84, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stone Foundation
  ctx.fillStyle = '#78716c';
  ctx.fillRect(0, 95, 170, 30);
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 95, 170, 30);

  // Mặt bên trái tối hơn → nhà bò có bề sâu 2.5D
  ctx.fillStyle = 'rgba(28, 15, 7, 0.6)';
  ctx.beginPath();
  ctx.moveTo(-2, 42);
  ctx.lineTo(-17, 50);
  ctx.lineTo(-17, 131);
  ctx.lineTo(-2, 125);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 6, 3, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Red Timber Main Wall
  const barnGrad = ctx.createLinearGradient(0, 35, 0, 95);
  barnGrad.addColorStop(0, '#991b1b');
  barnGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = barnGrad;
  ctx.fillRect(0, 35, 170, 60);
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 35, 170, 60);

  // Barn Gambrel Roof
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(-10, 40);
  ctx.lineTo(25, 8);
  ctx.lineTo(85, 0);
  ctx.lineTo(145, 8);
  ctx.lineTo(180, 40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 2;
  ctx.stroke();

  // White Cross-bracing on Barn Doors
  ctx.fillStyle = '#3f1508';
  ctx.fillRect(45, 60, 80, 65);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 60, 80, 65);
  ctx.beginPath();
  ctx.moveTo(45, 60); ctx.lineTo(125, 125);
  ctx.moveTo(125, 60); ctx.lineTo(45, 125);
  ctx.stroke();

  // Sweet Hay Trough
  ctx.fillStyle = '#78350f';
  ctx.fillRect(20, 112, 130, 18);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(24, 108, 122, 7); // golden hay

  // Cửa sổ gác mái hình tròn + chong chóng gió trên nóc
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(140, 62, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(130, 62);
  ctx.lineTo(150, 62);
  ctx.moveTo(140, 52);
  ctx.lineTo(140, 72);
  ctx.stroke();
  // Chong chóng gió
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(85, 0);
  ctx.lineTo(85, -10);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.save();
  ctx.translate(85, -13);
  ctx.rotate(0.6);
  ctx.fillRect(-8, -1.5, 16, 3);
  ctx.rotate(Math.PI / 2);
  ctx.fillRect(-8, -1.5, 16, 3);
  ctx.restore();

  // Wooden Signboard: "CHUỒNG BÒ MEOWLISH"
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(28, 20, 114, 18, 4);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHUỒNG BÒ MEOWLISH', 85, 33);

  ctx.restore();
}

/**
 * Helper 2.5D: Mặt đất phía trước — dải cỏ trên cùng + mặt cắt đất đá sỏi,
 * tạo cảm giác khối nền nổi có độ dày.
 */
function drawForegroundLedge(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const top = height - 40;
  ctx.save();

  // Bóng đổ mềm ngay trên mép khối đất (tách mặt đất và thân khối)
  const shade = ctx.createLinearGradient(0, top - 26, 0, top + 6);
  shade.addColorStop(0, 'rgba(15, 23, 42, 0)');
  shade.addColorStop(1, 'rgba(15, 23, 42, 0.3)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, top - 26, width, 32);

  // Thân khối đất (mặt cắt có chiều sâu)
  const soil = ctx.createLinearGradient(0, top, 0, height);
  soil.addColorStop(0, '#8a5a2b');
  soil.addColorStop(0.35, '#73441f');
  soil.addColorStop(1, '#4a2a11');
  ctx.fillStyle = soil;
  ctx.beginPath();
  ctx.moveTo(0, top + 6);
  ctx.quadraticCurveTo(width * 0.5, top - 6, width, top + 6);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Sỏi đá lấp lánh trên mặt cắt
  for (let i = 0; i < 22; i++) {
    const sx = 16 + ((i * 47) % (width - 32));
    const sy = top + 14 + ((i * 13) % 20);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 237, 213, 0.35)' : 'rgba(28, 15, 5, 0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 4 + (i % 3), 2.5 + (i % 2), i * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mép cỏ nhô lên trên mặt khối (viền cỏ sáng)
  ctx.strokeStyle = '#6cc23a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, top + 5);
  ctx.quadraticCurveTo(width * 0.5, top - 5, width, top + 5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, top + 8);
  ctx.quadraticCurveTo(width * 0.5, top - 2, width, top + 8);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper 2.5D: Thanh đếm ngược chu kỳ sản xuất vẽ ngay trên đầu con vật.
 */
function drawCountdownBar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  progress: number,
  label: string,
  type: 'chicken' | 'cow'
) {
  const w = 78;
  const h = 10;
  const x = cx - w / 2;
  const accent = type === 'chicken' ? '#fbbf24' : '#38bdf8';
  const accentLight = type === 'chicken' ? '#fde047' : '#93c5fd';
  const icon = type === 'chicken' ? '🥚' : '🥛';

  ctx.save();

  // Nhãn đồng hồ phía trên thanh
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  const labelText = `${icon} ${label}`;
  const textWidth = Math.max(w, ctx.measureText(labelText).width + 16);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(cx - textWidth / 2, top - 20, textWidth, 17, 8.5);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = accentLight;
  ctx.fillText(labelText, cx, top - 7.5);

  // Nền thanh (track)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(x, top, w, h, 5);
  ctx.fill();

  // Phần đã chạy
  const fillW = Math.max(6, (w - 6) * Math.min(1, Math.max(0, progress)));
  const fillGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  fillGrad.addColorStop(0, accent);
  fillGrad.addColorStop(1, accentLight);
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.roundRect(x + 3, top + 3, fillW, h - 6, 3);
  ctx.fill();

  // Viền + vạch chia 1/4 cho cảm giác chính xác
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, top, w, h, 5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.lineWidth = 1;
  for (let q = 1; q < 4; q++) {
    const qx = x + (w * q) / 4;
    ctx.beginPath();
    ctx.moveTo(qx, top + 2);
    ctx.lineTo(qx, top + h - 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Helper: Huy hiệu "SẴN SÀNG THU HOẠCH" nhấp nháy khi chu kỳ đã kết thúc.
 */
function drawReadyBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  type: 'chicken' | 'cow',
  frame: number
) {
  const pulse = 0.5 + Math.sin(frame * 0.12) * 0.5;
  const icon = type === 'chicken' ? '🥚' : '🥛';
  const label = `${icon} SẴN SÀNG!`;

  ctx.save();
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  const textWidth = ctx.measureText(label).width + 20;

  // Glow nhấp nháy quanh huy hiệu
  ctx.fillStyle = `rgba(250, 204, 21, ${0.18 + pulse * 0.22})`;
  ctx.beginPath();
  ctx.roundRect(cx - textWidth / 2 - 4, top - 22, textWidth + 8, 21, 10.5);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.roundRect(cx - textWidth / 2, top - 19, textWidth, 17, 8.5);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#451a03';
  ctx.fillText(label, cx, top - 6.5);

  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#fef3c7';
  ctx.fillText('Chạm để thu hoạch', cx, top + 6);

  ctx.restore();
}

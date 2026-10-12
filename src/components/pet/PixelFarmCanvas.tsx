'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Sparkles, Utensils, Award, RefreshCw, Volume2, Info, ChevronRight, Check } from 'lucide-react';
import { drawChibiChicken, drawChibiDairyCow, drawChibiSheep, drawChibiDog, drawChibiCat, drawChibiFish } from './drawFarmLivestock';
import { LIVESTOCK_CATALOG, FARM_ANIMAL_SHOP, DOG_BREEDS, CAT_BREEDS, FARM_INCUBATOR } from '@/lib/petFarmData';

type LivestockStatus = 'idle' | 'producing' | 'ready';

// Chu kỳ mặc định (bắt buộc khớp với server): GÀ 3 GIỜ / BÒ 24 GIỜ / CỪU 12 GIỜ
const DEFAULT_CYCLE_SECONDS: Record<string, number> = {
  chicken: 3 * 60 * 60,
  cow: 24 * 60 * 60,
  sheep: 12 * 60 * 60,
};

/** Bản đồ sản phẩm theo loài (dùng chung cho spawn/thu hoạch). */
const PRODUCE_OF: Record<string, 'egg' | 'milk' | 'wool'> = {
  chicken: 'egg',
  cow: 'milk',
  sheep: 'wool',
};
const LIVESTOCK_OF_PRODUCE: Record<string, string> = {
  egg: 'chicken',
  milk: 'cow',
  wool: 'sheep',
};

// H18: ranh giới từng khu vực trên bản đồ 840x520.
const ZONES: Record<string, { minX: number; maxX: number; minY: number; maxY: number }> = {
  chicken: { minX: 110, maxX: 340, minY: 205, maxY: 320 },
  cow: { minX: 460, maxX: 770, minY: 205, maxY: 320 },
  sheep: { minX: 100, maxX: 400, minY: 340, maxY: 450 },
  dog: { minX: 340, maxX: 510, minY: 210, maxY: 300 },
  cat: { minX: 560, maxX: 730, minY: 150, maxY: 215 },
};
// H18: hồ sen lớn (nuôi cá) góc dưới-phải.
const POND = { x: 620, y: 420, rx: 110, ry: 38 };

/** Dòng trạng thái server trả về cho mỗi loài (nguồn sự thật của chu kỳ). */
interface LivestockState {
  animal_type: string;
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
  type: 'egg' | 'milk' | 'wool';
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
  // H18: gà (CHỈ gà mái mới đẻ) / bò / cừu / chó / mèo / cá.
  type: 'chicken' | 'cow' | 'sheep' | 'dog' | 'cat' | 'fish';
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
  /** Giống chó/mèo (id trong DOG_BREEDS/CAT_BREEDS) — quyết định màu vẽ. */
  breed?: string;
  /** Cá dùng actionTimer làm pha bơi quanh hồ. */
  coat?: string;
  coatDark?: string;
  extra?: string;
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
  const [harvestedWool, setHarvestedWool] = useState(0);
  const [activeTool, setActiveTool] = useState<'wheat' | 'hay' | 'hand'>('wheat');
  const [bannerMsg, setBannerMsg] = useState<string>(
    'Chào mừng đến Nông Trại Meowlish 2.5D! Rải thóc 🌾 cho gà mái, rải cỏ 🌿 cho bò (rải trong đồng cỏ để cho cừu)! Mở 🏪 Cửa Hàng để mua/bán vật nuôi và ấp trứng!'
  );

  // High-DPI Dimensions
  const canvasWidth = 840;
  const canvasHeight = 520;

  // Entities — H18: đàn vật nuôi dựng ĐỘNG từ tồn kho shop (mua/bán).
  // Gà trống + gà con đã bỏ — CHỈ GÀ MÁI mới đẻ trứng.
  const HEN_NAMES = ['Gà Mái Hoa Mơ', 'Gà Mái Lúa Vàng', 'Gà Mái Trứng Ngọt', 'Gà Mái Cục Tác', 'Gà Mái Vàng Óng', 'Gà Mái Chăm Chỉ'];
  const COW_NAMES = ['Bò Sữa Daisy', 'Bò Sữa Bella', 'Bò Sữa Kem Tươi', 'Bò Sữa Đốm Bi'];
  const SHEEP_NAMES = ['Cừu Mây Trắng', 'Cừu Bông Xù', 'Cừu Len Mềm', 'Cừu Cỏ Non'];
  const FISH_NAMES = ['Cá Chép Vàng', 'Cá Chép Đỏ', 'Cá Koi Trắng', 'Cá Vàng Óng', 'Cá Chép Bạc', 'Cá Koi Đen', 'Cá Vảy Hồng', 'Cá Hồ Sen'];

  // Tồn kho vật nuôi (kind → số con). Khách dùng mặc định local.
  const [farmStockUi, setFarmStockUi] = useState<Record<string, number>>({ hen: 3, cow: 2, sheep: 1, fish: 2 });
  const [incubatorUi, setIncubatorUi] = useState<any>(null);
  const [showShop, setShowShop] = useState(false);
  const [selectedDogBreed, setSelectedDogBreed] = useState<string>(DOG_BREEDS[0].id);
  const [selectedCatBreed, setSelectedCatBreed] = useState<string>(CAT_BREEDS[0].id);

  function buildAnimalsFromStock(stock: Record<string, number>): AnimalState[] {
    const list: AnimalState[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const mk = (
      id: string,
      type: AnimalState['type'],
      name: string,
      z: { minX: number; maxX: number; minY: number; maxY: number },
      extra?: Partial<AnimalState>
    ): AnimalState => {
      const x = rnd(z.minX, z.maxX);
      const y = rnd(z.minY, z.maxY);
      return {
        id, type, name, x, y, targetX: x, targetY: y,
        state: 'idle', direction: Math.random() > 0.5 ? 1 : -1,
        actionTimer: 40 + Math.random() * 80, animFrame: 0,
        isHungry: true, heartTimer: 0, ...extra,
      };
    };
    const countOf = (kind: string, fallback: number, cap: number) =>
      Math.max(0, Math.min(cap, Math.round(stock[kind] ?? fallback)));
    for (let i = 0; i < countOf('hen', 3, 6); i++)
      list.push(mk(`hen_${i}`, 'chicken', HEN_NAMES[i % HEN_NAMES.length], ZONES.chicken));
    for (let i = 0; i < countOf('cow', 2, 4); i++)
      list.push(mk(`cow_${i}`, 'cow', COW_NAMES[i % COW_NAMES.length], ZONES.cow));
    for (let i = 0; i < countOf('sheep', 1, 4); i++)
      list.push(mk(`sheep_${i}`, 'sheep', SHEEP_NAMES[i % SHEEP_NAMES.length], ZONES.sheep));
    // Chó/mèo theo từng giống đã mua (kind 'dog:shiba', 'cat:muop'...)
    let dogTotal = 0;
    for (const [kind, c] of Object.entries(stock)) {
      if (!kind.startsWith('dog:') || dogTotal >= 3) continue;
      const breed = DOG_BREEDS.find((b) => b.id === kind.slice(4)) ?? DOG_BREEDS[0];
      const n = Math.max(0, Math.min(3 - dogTotal, Math.round(c)));
      for (let i = 0; i < n; i++) {
        list.push(mk(`dog_${breed.id}_${i}`, 'dog', `Chó ${breed.name}`, ZONES.dog, {
          breed: breed.id, coat: breed.coat, coatDark: breed.coatDark, extra: breed.extra,
        }));
        dogTotal++;
      }
    }
    let catTotal = 0;
    for (const [kind, c] of Object.entries(stock)) {
      if (!kind.startsWith('cat:') || catTotal >= 3) continue;
      const breed = CAT_BREEDS.find((b) => b.id === kind.slice(4)) ?? CAT_BREEDS[0];
      const n = Math.max(0, Math.min(3 - catTotal, Math.round(c)));
      for (let i = 0; i < n; i++) {
        list.push(mk(`cat_${breed.id}_${i}`, 'cat', `Mèo ${breed.name}`, ZONES.cat, {
          breed: breed.id, coat: breed.coat, coatDark: breed.coatDark, extra: breed.extra,
        }));
        catTotal++;
      }
    }
    // Cá bơi quanh hồ (pha bơi lệch nhau để không chập một chỗ)
    for (let i = 0; i < countOf('fish', 2, 8); i++) {
      list.push({
        id: `fish_${i}`, type: 'fish', name: FISH_NAMES[i % FISH_NAMES.length],
        x: POND.x, y: POND.y, targetX: POND.x, targetY: POND.y,
        state: 'walk', direction: 1, actionTimer: i * 2.4, animFrame: 0,
        isHungry: false, heartTimer: 0, coat: i % 2 === 0 ? '#fb923c' : '#f87171',
      });
    }
    return list;
  }

  const animalsRef = useRef<AnimalState[]>(buildAnimalsFromStock({ hen: 3, cow: 2, sheep: 1, fish: 2 }));
  // Dựng lại đàn khi tồn kho đổi (mua/bán) — vị trí random lại trong khu vực.
  useEffect(() => {
    animalsRef.current = buildAnimalsFromStock(farmStockUi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmStockUi]);

  const foodsRef = useRef<FoodDrop[]>([]);
  const producesRef = useRef<FarmProduce[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const frameCountRef = useRef<number>(0);

  // ===== SERVER-SIDE PRODUCTION TIMERS (gà 3h / bò 24h / cừu 12h) =====
  const livestockRef = useRef<Record<string, LivestockState | null>>({});
  const [livestockUi, setLivestockUi] = useState<Record<string, LivestockState | null>>({});
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

  const catalog = (type: string) =>
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

  /** Đẩy sản phẩm (trứng/sữa/len) lên đồng cỏ khi server báo chu kỳ đã xong. */
  const spawnProduceFor = (type: string, row: LivestockState) => {
    const key = cycleKeyOf(row);
    if (!key) return;
    if (spawnedCycleRef.current[type] === key) return;
    const produceType = PRODUCE_OF[type] ?? 'egg';
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
      produceType === 'egg' ? '🥚 Trứng Vàng!' : produceType === 'milk' ? '🥛 Sữa Tươi!' : '🧶 Len Mềm!',
      x,
      y - 26,
      produceType === 'egg' ? '#fef08a' : produceType === 'milk' ? '#93c5fd' : '#d8b4fe'
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

    const next: Record<string, LivestockState | null> = {};
    rows.forEach((raw) => {
      if (!raw) return;
      const type: string = LIVESTOCK_CATALOG[raw.animal_type] ? raw.animal_type : 'chicken';
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
    Object.keys(next).forEach((type) => {
      const row = next[type];
      if (row && row.status === 'ready') spawnProduceFor(type, row);
    });
  };

  /** Poll trạng thái chu kỳ + tồn kho + lò ấp từ server (nguồn sự thật duy nhất). */
  const syncLivestock = async () => {
    if (!userId) return;
    if (feedLockRef.current) return; // đừng poll lúc đang có POST chưa xong
    try {
      const res = await fetch(`/api/pet?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!isMountedRef.current) return;
      if (data?.livestock) applyLivestock(data.livestock);
      if (Array.isArray(data?.farmStock)) {
        const map: Record<string, number> = {};
        for (const r of data.farmStock) {
          if (r && typeof r.kind === 'string') map[r.kind] = Number(r.count) || 0;
        }
        // So sánh theo ngữ nghĩa (sắp xếp key): JSON.stringify thô khác nhau
        // khi server trả thứ tự hàng khác nhau → setState mỗi poll 4s → đàn
        // vật bị dựng lại vị trí liên tục.
        setFarmStockUi((prev) => {
          const ka = Object.keys(prev).sort();
          const kb = Object.keys(map).sort();
          const same =
            ka.length === kb.length && ka.every((k, i) => k === kb[i] && prev[k] === map[k]);
          return same ? prev : map;
        });
      }
      if (data?.incubator !== undefined) setIncubatorUi(data.incubator);
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
    // H18: thóc → gà mái; cỏ → cừu nếu rải trong đồng cỏ, còn lại → bò sữa.
    const animalType: string = type === 'wheat' ? 'chicken' : x < 440 && y > 335 ? 'sheep' : 'cow';
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
      setBannerMsg(`Bạn cần ít nhất ${cost} Coins để mua ${type === 'wheat' ? 'thóc cho gà mái' : animalType === 'sheep' ? 'cỏ cho cừu' : 'cỏ cho bò'}!`);
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
        ? '🌾 Đã rải thóc vàng! Đàn gà mái đang hớn hở chạy lại mổ...'
        : animalType === 'sheep'
          ? '🌿 Đã rải cỏ non! Đàn cừu bông đang tung tăng tới gặm...'
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

  // Collect Produce (Egg / Milk / Wool) — server kiểm tra chu kỳ mới cho nhận
  const collectProduce = (item: FarmProduce) => {
    const animalType: string = LIVESTOCK_OF_PRODUCE[item.type] ?? 'chicken';

    // `coinsDelta` = phần CỘNG (không phải số dư tuyệt đối) để không ghi đè số xu
    // kiếm được trong lúc request harvest đang bay.
    const celebrate = (coinsDelta: number, exp: number) => {
      sound.playCelebration();
      applyCoinDelta(coinsDelta);
      if (onUpdatePetExp) onUpdatePetExp(exp);

      if (item.type === 'egg') setHarvestedEggs((prev) => prev + 1);
      else if (item.type === 'milk') setHarvestedMilk((prev) => prev + 1);
      else setHarvestedWool((prev) => prev + 1);

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
    const readyNow = Object.keys(livestockRef.current).filter((t) => livestockRef.current[t]?.status === 'ready');
    if (producesRef.current.length === 0 && readyNow.length === 0) {
      setBannerMsg('Hiện chưa có Trứng, Sữa hay Len nào chín. Hãy cho gà, bò và cừu ăn no rồi đợi chu kỳ nhé!');
      return;
    }

    if (!userId) {
      let totalCoins = 0;
      let totalExp = 0;
      producesRef.current.forEach((item) => {
        totalCoins += item.rewardCoins;
        totalExp += item.rewardExp;
        if (item.type === 'egg') setHarvestedEggs((prev) => prev + 1);
        else if (item.type === 'milk') setHarvestedMilk((prev) => prev + 1);
        else setHarvestedWool((prev) => prev + 1);
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
            .map((r: any) => (LIVESTOCK_CATALOG[r.animal_type] ? r.animal_type : 'chicken'))
        );
        const collected = producesRef.current.filter(
          (p) => !stillReady.has(LIVESTOCK_OF_PRODUCE[p.type] ?? 'chicken')
        );
        let totalCoins = 0;
        let totalExp = 0;
        collected.forEach((item) => {
          totalCoins += item.rewardCoins;
          totalExp += item.rewardExp;
          if (item.type === 'egg') setHarvestedEggs((prev) => prev + 1);
          else if (item.type === 'milk') setHarvestedMilk((prev) => prev + 1);
          else setHarvestedWool((prev) => prev + 1);
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

        // H18: cá bơi vòng quanh hồ sen (không đi bộ, không ăn).
        if (animal.type === 'fish') {
          const phase = animal.actionTimer;
          const nx = POND.x + Math.cos(frame * 0.012 + phase) * (POND.rx - 28);
          const ny = POND.y + Math.sin(frame * 0.016 + phase) * (POND.ry - 13);
          animal.direction = nx >= animal.x ? 1 : -1;
          animal.x = nx;
          animal.y = ny;
          animal.state = 'walk';
          return;
        }

        const isProducer = animal.type === 'chicken' || animal.type === 'cow' || animal.type === 'sheep';
        // Search for nearest suitable food drop (gà→thóc, bò/cừu→cỏ)
        const targetFood = isProducer
          ? foodsRef.current.find(
              (f) =>
                f.remaining > 0 &&
                ((animal.type === 'chicken' && f.type === 'wheat') ||
                  ((animal.type === 'cow' || animal.type === 'sheep') && f.type === 'hay'))
            )
          : undefined;

        if (targetFood && animal.state !== 'eating' && animal.state !== 'producing') {
          animal.targetX = targetFood.x + (Math.random() * 20 - 10);
          animal.targetY = targetFood.y + (Math.random() * 20 - 10);
          // H18: kẹp mục tiêu trong khu vực của loài — không lội xuống hồ sen.
          const zz = ZONES[animal.type];
          if (zz) {
            animal.targetX = Math.max(zz.minX, Math.min(zz.maxX, animal.targetX));
            animal.targetY = Math.max(zz.minY, Math.min(zz.maxY, animal.targetY));
          }

          const dx = animal.targetX - animal.x;
          const dy = animal.targetY - animal.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 16) {
            // Arrived at food -> Eat!
            animal.state = 'eating';
            animal.actionTimer = animal.type === 'chicken' ? 50 : animal.type === 'cow' ? 80 : 65;
            animal.direction = dx > 0 ? 1 : -1;
            targetFood.remaining--;
            if (targetFood.remaining <= 0) {
              foodsRef.current = foodsRef.current.filter((f) => f.id !== targetFood.id);
            }
          } else {
            animal.state = 'walk';
            animal.direction = dx > 0 ? 1 : -1;
            const speed = animal.type === 'chicken' ? 1.6 : animal.type === 'cow' ? 1.0 : 1.2;
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
          // Wander peacefully — mỗi loài đi trong khu vực riêng (H18)
          animal.actionTimer--;
          if (animal.actionTimer <= 0) {
            if (animal.state === 'idle') {
              const z = ZONES[animal.type] ?? ZONES.chicken;
              animal.targetX = z.minX + Math.random() * (z.maxX - z.minX);
              animal.targetY = z.minY + Math.random() * (z.maxY - z.minY);
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
              const speed =
                animal.type === 'chicken' ? 1.0
                : animal.type === 'cow' ? 0.65
                : animal.type === 'sheep' ? 0.8
                : animal.type === 'dog' ? 0.9
                : 0.7;
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

      // --- LAYER 3: HỒ SEN LỚN NUÔI CÁ (H18 — to gấp đôi, có cá bơi) ---
      ctx.save();
      const pondX = POND.x;
      const pondY = POND.y;
      const bankRx = POND.rx + 14;
      const bankRy = POND.ry + 14;
      // Bóng đổ mềm của hồ trên cỏ
      ctx.fillStyle = 'rgba(27, 77, 32, 0.22)';
      ctx.beginPath();
      ctx.ellipse(pondX + 8, pondY + 10, bankRx, bankRy, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Bờ hồ đất + viền cỏ
      ctx.fillStyle = '#d9b98f';
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, bankRx, bankRy, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7fbf6a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, bankRx, bankRy, -0.1, 0, Math.PI * 2);
      ctx.stroke();
      // Đá trang trí quanh bờ
      ctx.fillStyle = '#a8a29e';
      for (let si = 0; si < 12; si++) {
        const a = (si / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(pondX + Math.cos(a) * (bankRx - 3), pondY + Math.sin(a) * (bankRy - 3), 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mặt nước trong xanh chuyển tông
      const waterGrad = ctx.createLinearGradient(pondX - 110, pondY - 50, pondX + 110, pondY + 50);
      waterGrad.addColorStop(0, '#7dd3fc');
      waterGrad.addColorStop(0.5, '#38bdf8');
      waterGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, POND.rx, POND.ry, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Vệt sáng mặt nước
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(pondX - 40, pondY - 20, 44, 12, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(pondX + 52, pondY + 18, 30, 8, -0.25, 0, Math.PI * 2);
      ctx.fill();

      // Gợn sóng lan tỏa
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      const ripple = (frame * 0.04) % 18;
      ctx.beginPath();
      ctx.arc(pondX - 16, pondY, 20 + ripple, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(pondX + 24, pondY + 8, 12 + ripple * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Lá sen + hoa sen hồng (nhiều cụm hơn cho hồ lớn)
      drawLilyPad(ctx, pondX - 66, pondY - 16, 12);
      drawLilyPad(ctx, pondX - 10, pondY + 20, 14);
      drawLilyPad(ctx, pondX + 58, pondY - 12, 11);
      drawLotusFlower(ctx, pondX - 40, pondY + 14);
      drawLotusFlower(ctx, pondX + 30, pondY - 18);
      drawLotusFlower(ctx, pondX + 78, pondY + 12);

      // Cỏ lau hai bên bờ
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        const bx = pondX + side * (bankRx - 4);
        ctx.beginPath();
        ctx.moveTo(bx, pondY - 6);
        ctx.quadraticCurveTo(bx + side * 6, pondY - 26, bx + side * 2, pondY - 34);
        ctx.moveTo(bx - side * 8, pondY - 4);
        ctx.quadraticCurveTo(bx - side * 8, pondY - 22, bx - side * 2, pondY - 28);
        ctx.stroke();
        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.ellipse(bx + side * 2, pondY - 36, 3, 6, side * 0.2, 0, Math.PI * 2);
        ctx.ellipse(bx - side * 2, pondY - 30, 3, 6, -side * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
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

      // H18: BỎ chuồng gà + chuồng bò → ĐỒNG CỎ cho cừu + CHUỒNG CHÓ + CHUỒNG MÈO
      drawMeadowPatch(ctx, canvasWidth, canvasHeight, frame);
      drawDogHouse(ctx, 350, 148);
      drawCatHouse(ctx, 540, 148);

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
        } else if (prod.type === 'milk') {
          glowGrad.addColorStop(0, 'rgba(147, 197, 253, 0.7)');
          glowGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
        } else {
          glowGrad.addColorStop(0, 'rgba(192, 132, 252, 0.7)');
          glowGrad.addColorStop(1, 'rgba(192, 132, 252, 0)');
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
        } else if (prod.type === 'milk') {
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
        } else {
          // H18: Cuộn len tím mềm mại (cừu)
          const woolGrad = ctx.createLinearGradient(prod.x - 9, py - 9, prod.x + 9, py + 9);
          woolGrad.addColorStop(0, '#e9d5ff');
          woolGrad.addColorStop(0.5, '#c084fc');
          woolGrad.addColorStop(1, '#9333ea');
          ctx.fillStyle = woolGrad;
          ctx.beginPath();
          ctx.arc(prod.x, py, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#7e22ce';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(126, 34, 206, 0.7)';
          ctx.lineWidth = 1.2;
          for (let w = -2; w <= 2; w++) {
            ctx.beginPath();
            ctx.moveTo(prod.x - 9, py + w * 4);
            ctx.quadraticCurveTo(prod.x, py + w * 4 - 4, prod.x + 9, py + w * 4);
            ctx.stroke();
          }
          // Đầu sợi len thõng xuống
          ctx.strokeStyle = '#7e22ce';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(prod.x + 9, py + 6);
          ctx.quadraticCurveTo(prod.x + 18, py + 10, prod.x + 16, py + 18);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText('✨', prod.x - 10, py - 10);
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
        const isSheep = animal.type === 'sheep';
        const isFish = animal.type === 'fish';
        // Kích thước bóng/hào quang theo loài (H18)
        const shadowY = isCow ? 24 : isSheep ? 18 : 15;
        const shadowRx = isCow ? 42 : isSheep ? 30 : 24;
        const shadowRy = isCow ? 13 : isSheep ? 10 : 8;

        // 1) Bóng đổ đậm ngay dưới thân — làm con vật "đứng trên mặt đất"
        // (cá bơi trong nước nên không vẽ bóng)
        if (!isFish) {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
          ctx.beginPath();
          ctx.ellipse(animal.x + 7, animal.y + shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 2) Hào quang sáng nhẹ để tách con vật khỏi nền (nổi bật hơn)
        const haloRadius = isCow ? 62 : isSheep ? 52 : 44;
        if (!isFish) {
          const halo = ctx.createRadialGradient(animal.x, animal.y - 8, 6, animal.x, animal.y - 8, haloRadius);
          halo.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          halo.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
          halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(animal.x, animal.y - 8, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3) Phóng to 14% quanh điểm đặt chân — con vật to, dễ nhìn hơn
        ctx.save();
        const scaleUp = 1.14;
        ctx.translate(animal.x, animal.y);
        ctx.scale(scaleUp, scaleUp);
        ctx.translate(-animal.x, -animal.y);

        if (animal.type === 'chicken') {
          // H18: chỉ còn gà mái (đã bỏ gà trống/gà con)
          drawChibiChicken({
            ctx,
            x: animal.x,
            y: animal.y,
            direction: animal.direction,
            state: animal.state,
            frame,
            heartTimer: animal.heartTimer,
          });
        } else if (animal.type === 'sheep') {
          drawChibiSheep({
            ctx,
            x: animal.x,
            y: animal.y,
            direction: animal.direction,
            state: animal.state,
            frame,
            heartTimer: animal.heartTimer,
          });
        } else if (animal.type === 'dog') {
          const breed = DOG_BREEDS.find((b) => b.id === animal.breed) ?? DOG_BREEDS[0];
          drawChibiDog({
            ctx,
            x: animal.x,
            y: animal.y,
            direction: animal.direction,
            state: animal.state,
            frame,
            coat: animal.coat ?? breed.coat,
            coatDark: animal.coatDark ?? breed.coatDark,
            extra: animal.extra ?? breed.extra,
            heartTimer: animal.heartTimer,
          });
        } else if (animal.type === 'cat') {
          const breed = CAT_BREEDS.find((b) => b.id === animal.breed) ?? CAT_BREEDS[0];
          drawChibiCat({
            ctx,
            x: animal.x,
            y: animal.y,
            direction: animal.direction,
            state: animal.state,
            frame,
            coat: animal.coat ?? breed.coat,
            coatDark: animal.coatDark ?? breed.coatDark,
            extra: animal.extra ?? breed.extra,
            heartTimer: animal.heartTimer,
          });
        } else if (animal.type === 'fish') {
          drawChibiFish({
            ctx,
            x: animal.x,
            y: animal.y,
            direction: animal.direction,
            frame,
            coat: animal.coat,
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
        // Chó/mèo/cá không có chu kỳ nên không bao giờ tới đây (row undefined).
        const barTop = animal.y - (animal.type === 'cow' ? 66 : animal.type === 'sheep' ? 58 : 52);

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

  // ===== H18: CỬA HÀNG + LÒ ẤP (gọi API farm_shop_buy/sell, farm_incubate_*) =====
  const postFarmAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!userId) {
      sound.playWrong();
      setBannerMsg('Vui lòng đăng nhập để dùng cửa hàng nông trại!');
      return null;
    }
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!isMountedRef.current) return null;
      if (Array.isArray(data?.farmStock)) {
        const map: Record<string, number> = {};
        for (const r of data.farmStock) {
          if (r && typeof r.kind === 'string') map[r.kind] = Number(r.count) || 0;
        }
        setFarmStockUi(map);
      }
      if (data?.incubator !== undefined) setIncubatorUi(data.incubator);
      if (typeof data?.userCoins === 'number') syncCoinsFromServer(data.userCoins);
      if (data?.error) {
        sound.playError();
        setBannerMsg(`⛔ ${data.error}`);
        return null;
      }
      if (data?.message) setBannerMsg(data.message);
      sound.playSuccess();
      // Lò ấp cho EXP linh vật (server đã cộng) — báo parent cộng local theo
      // đúng pattern thu hoạch ở trên (celebrate → onUpdatePetExp).
      if (action === 'farm_incubate_collect' && onUpdatePetExp) {
        onUpdatePetExp(FARM_INCUBATOR.rewardExp);
      }
      return data;
    } catch {
      if (isMountedRef.current) setBannerMsg('⚠️ Mất kết nối máy chủ — thử lại sau nhé!');
      return null;
    }
  };

  const shopBuy = (kind: string) => postFarmAction('farm_shop_buy', { kind });
  const shopSell = (kind: string) => postFarmAction('farm_shop_sell', { kind });

  const ownedOf = (kind: string, fallback = 0) => farmStockUi[kind] ?? fallback;

  const incubatorRemain = (() => {
    if (!incubatorUi) return 0;
    if (nowTick > 0 && incubatorUi.ready_at) {
      return Math.max(0, Math.ceil((Number(incubatorUi.ready_at) - nowTick) / 1000));
    }
    return Number(incubatorUi.remaining_seconds) || 0;
  })();

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
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-1 text-violet-300">
              <span>🧶 Len:</span>
              <span>{harvestedWool}</span>
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

      {/* ===== THANH ĐẾM NGƯỢC CHU KỲ SERVER (Gà 3 giờ / Cừu 12 giờ / Bò 24 giờ) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <LivestockCountdownCard type="chicken" state={livestockUi.chicken ?? null} now={nowTick} />
        <LivestockCountdownCard type="sheep" state={livestockUi.sheep ?? null} now={nowTick} />
        <LivestockCountdownCard type="cow" state={livestockUi.cow ?? null} now={nowTick} />
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
            title={`Rải cỏ cho bò sữa & cừu ăn (${LIVESTOCK_CATALOG.cow.feedPrice} xu bò / ${LIVESTOCK_CATALOG.sheep.feedPrice} xu cừu) — rải trong đồng cỏ để cho cừu, còn lại cho bò; khóa khi đang đếm chu kỳ`}
          >
            <span>🌿</span>
            <span>{`Rải Cỏ (bò/cừu)`}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowShop(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer bg-white/10 text-white hover:bg-white/20"
            title="Cửa hàng nông trại: mua/bán gà, bò, cừu, cá, chó, mèo + ấp trứng"
          >
            <span>🏪</span>
            <span>Cửa Hàng</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowShop(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              incubatorUi && incubatorUi.status === 'ready'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200 animate-pulse'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Lò ấp trứng: ấp nở gà mái mới (trong cửa hàng)"
          >
            <span>🥚</span>
            <span>Ấp Trứng{incubatorUi && incubatorUi.status === 'ready' ? '!' : ''}</span>
          </button>
        </div>
      </div>

      {/* ===== H18: MODAL CỬA HÀNG NÔNG TRẠI + LÒ ẤP TRỨNG ===== */}
      {showShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowShop(false)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border-4 border-amber-500 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏪</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">Cửa Hàng Nông Trại</h3>
                  <p className="text-[12px] text-amber-100 font-medium">Mua/bán vật nuôi • Ấp trứng nở gà mái • Số dư: {userCoinsRef.current.toLocaleString()} 🪙</p>
                </div>
              </div>
              <button
                onClick={() => setShowShop(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Đóng cửa hàng"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
              {/* Lò ấp trứng */}
              <div className={`rounded-2xl border-2 p-3.5 ${incubatorUi && incubatorUi.status === 'ready' ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 animate-pulse' : 'border-orange-200 bg-orange-50 dark:bg-slate-800 dark:border-orange-800'}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">🥚 Lò Ấp Trứng</h4>
                    <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">
                      {!incubatorUi && `Tốn ${FARM_INCUBATOR.costCoins} xu + chờ 8 giờ → nở 1 gà mái (+${FARM_INCUBATOR.rewardExp} EXP)`}
                      {incubatorUi && incubatorUi.status !== 'ready' && `Đang ấp… còn ${formatCountdown(incubatorRemain)} nữa mới nở!`}
                      {incubatorUi && incubatorUi.status === 'ready' && 'Trứng đã nở! Đón bé gà mái mới nào!'}
                    </p>
                  </div>
                  {!incubatorUi && (
                    <button
                      onClick={() => postFarmAction('farm_incubate_start')}
                      className="px-4 py-2 min-h-[44px] rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-black shadow transition cursor-pointer"
                    >
                      Bắt đầu ấp ({FARM_INCUBATOR.costCoins}🪙)
                    </button>
                  )}
                  {incubatorUi && incubatorUi.status === 'ready' && (
                    <button
                      onClick={() => postFarmAction('farm_incubate_collect')}
                      className="px-4 py-2 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow transition cursor-pointer"
                    >
                      Đón gà mái! (+{FARM_INCUBATOR.rewardExp} EXP)
                    </button>
                  )}
                </div>
              </div>

              {/* Vật nuôi sản xuất + cá */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {['hen', 'cow', 'sheep', 'fish'].map((species) => {
                  const entry = FARM_ANIMAL_SHOP[species];
                  const owned = ownedOf(species, entry.defaultCount);
                  return (
                    <div key={species} className="rounded-2xl border-2 border-slate-200 dark:border-white/10 p-3 bg-slate-50 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{entry.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-slate-800 truncate dark:text-slate-100">{entry.name}</h5>
                          <p className="text-[10px] text-slate-500 font-bold dark:text-slate-400">Đang có: {owned}/{entry.maxOwned}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug dark:text-slate-400">{entry.description}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => shopBuy(species)}
                          disabled={owned >= entry.maxOwned}
                          className="flex-1 px-2 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-black transition cursor-pointer"
                        >
                          Mua {entry.buyPrice}🪙
                        </button>
                        <button
                          onClick={() => shopSell(species)}
                          disabled={owned <= (entry.isProducer ? 1 : 0)}
                          title={entry.isProducer ? 'Giữ lại ít nhất 1 con để chăm sóc chu kỳ' : undefined}
                          className="flex-1 px-2 py-2 min-h-[40px] rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-black border border-rose-200 disabled:opacity-40 transition cursor-pointer dark:bg-slate-800 dark:border-rose-800"
                        >
                          Bán +{entry.sellPrice}🪙
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chó cảnh theo giống */}
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-3 dark:bg-slate-800/60 dark:border-amber-800">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">🐶 Chó Cảnh (nuôi cho đẹp) — Đang có: {DOG_BREEDS.reduce((s, b) => s + ownedOf(`dog:${b.id}`, 0), 0)}/3</h5>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {DOG_BREEDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { sound.playClick(); setSelectedDogBreed(b.id); }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border-2 transition cursor-pointer ${selectedDogBreed === b.id ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                      {b.emoji} {b.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => shopBuy(`dog:${selectedDogBreed}`)}
                    className="flex-1 px-2 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition cursor-pointer"
                  >
                    Mua {FARM_ANIMAL_SHOP.dog.buyPrice}🪙
                  </button>
                </div>
                {DOG_BREEDS.filter((b) => ownedOf(`dog:${b.id}`, 0) > 0).map((b) => (
                  <div key={b.id} className="flex items-center justify-between mt-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>{b.emoji} {b.name} × {ownedOf(`dog:${b.id}`, 0)}</span>
                    <button onClick={() => shopSell(`dog:${b.id}`)} className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition cursor-pointer dark:bg-slate-800">
                      Bán +{FARM_ANIMAL_SHOP.dog.sellPrice}🪙
                    </button>
                  </div>
                ))}
              </div>

              {/* Mèo cảnh theo giống */}
              <div className="rounded-2xl border-2 border-pink-200 bg-pink-50/60 p-3 dark:bg-slate-800/60 dark:border-pink-800">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">🐱 Mèo Cảnh (nuôi cho đẹp) — Đang có: {CAT_BREEDS.reduce((s, b) => s + ownedOf(`cat:${b.id}`, 0), 0)}/3</h5>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {CAT_BREEDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { sound.playClick(); setSelectedCatBreed(b.id); }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border-2 transition cursor-pointer ${selectedCatBreed === b.id ? 'bg-pink-500 text-white border-pink-600' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                      {b.emoji} {b.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => shopBuy(`cat:${selectedCatBreed}`)}
                    className="flex-1 px-2 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition cursor-pointer"
                  >
                    Mua {FARM_ANIMAL_SHOP.cat.buyPrice}🪙
                  </button>
                </div>
                {CAT_BREEDS.filter((b) => ownedOf(`cat:${b.id}`, 0) > 0).map((b) => (
                  <div key={b.id} className="flex items-center justify-between mt-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>{b.emoji} {b.name} × {ownedOf(`cat:${b.id}`, 0)}</span>
                    <button onClick={() => shopSell(`cat:${b.id}`)} className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition cursor-pointer dark:bg-slate-800">
                      Bán +{FARM_ANIMAL_SHOP.cat.sellPrice}🪙
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Farm Activity Guide Card */}
      <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-100 font-medium">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <b>Mẹo Nông Dân Meowlish:</b> Gà mái đẻ 🥚 mỗi <b>3 giờ</b>, cừu cho 🧶 mỗi <b>12 giờ</b>, bò cho 🥛 mỗi <b>24 giờ</b> — chu kỳ tính trên máy chủ nên tải lại trang vẫn giữ nguyên. Trong lúc đếm ngược, đàn vật <b>không ăn thêm</b> được; hết chu kỳ thì chạm vào sản phẩm để nhận Coins &amp; EXP!
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
  type: string;
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
        : type === 'sheep'
          ? 'linear-gradient(90deg, #9333ea, #d8b4fe)'
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
      <div className="text-2xl leading-none shrink-0">{meta.emoji}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[12px] font-black uppercase tracking-wider truncate ${
              status === 'ready' ? 'text-amber-950' : 'text-amber-300'
            }`}
          >
            {meta.name} (chu kỳ {fmt(cycle)})
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
                ? `🧺 Chạm vào ${meta.produceEmoji} để thu hoạch`
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
/**
 * H18: Thảm đồng cỏ cho cừu (thay chuồng gà/chuồng bò đã bỏ).
 */
function drawMeadowPatch(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
  void width;
  void height;
  ctx.save();
  // Thảm cỏ non mềm hình elip ở góc dưới-trái
  ctx.fillStyle = 'rgba(134, 239, 172, 0.55)';
  ctx.beginPath();
  ctx.ellipse(245, 400, 165, 62, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.ellipse(245, 400, 165, 62, -0.06, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Cỏ non đung đưa
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const gx = 110 + i * 20 + Math.sin(frame * 0.05 + i) * 2;
    const gy = 360 + ((i * 37) % 80);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + 2, gy - 8, gx + 5, gy - 11);
    ctx.stroke();
  }
  // Hoa dại trên đồng cỏ
  const meadowFlowers: [number, number, string][] = [
    [150, 375, '#f472b6'], [210, 425, '#ffffff'], [280, 370, '#facc15'],
    [330, 420, '#f472b6'], [180, 440, '#fb923c'], [300, 445, '#ffffff'],
  ];
  for (const [fx, fy, col] of meadowFlowers) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Biển gỗ "ĐỒNG CỎ XANH"
  ctx.fillStyle = 'rgba(27, 77, 32, 0.25)';
  ctx.beginPath();
  ctx.ellipse(116, 344, 26, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7c4a1e';
  ctx.fillRect(112, 312, 7, 32);
  ctx.fillStyle = '#a8713a';
  ctx.fillRect(88, 296, 58, 20);
  ctx.strokeStyle = '#5b3410';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(88, 296, 58, 20);
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ĐỒNG CỎ', 117, 304);
  ctx.fillText('XANH', 117, 312);
  ctx.restore();
}

/**
 * H18: Chuồng chó gỗ ấm cúng.
 */
function drawDogHouse(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(27, 77, 32, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 45, y + 62, 52, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Thân chuồng
  const wallGrad = ctx.createLinearGradient(0, y, 0, y + 58);
  wallGrad.addColorStop(0, '#d29a5b');
  wallGrad.addColorStop(1, '#8a5a2b');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x, y + 8, 90, 50);
  ctx.strokeStyle = '#5b3410';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y + 8, 90, 50);
  // Vân gỗ
  ctx.strokeStyle = 'rgba(91, 52, 16, 0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + 8 + i * 12);
    ctx.lineTo(x + 90, y + 8 + i * 12);
    ctx.stroke();
  }
  // Mái đỏ
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 10);
  ctx.lineTo(x + 45, y - 22);
  ctx.lineTo(x + 98, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cửa vòm tối
  ctx.fillStyle = '#291402';
  ctx.beginPath();
  ctx.arc(x + 45, y + 58, 17, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // Biển xương "CHUỒNG CHÓ"
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(x + 12, y - 14, 66, 15, 7);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 8.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🦴 CHUỒNG CHÓ', x + 45, y - 3);
  // Bát ăn
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(x + 78, y + 58, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(x + 78, y + 56, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * H18: Chuồng mèo pastel đáng yêu.
 */
function drawCatHouse(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(27, 77, 32, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 40, y + 58, 46, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Thân chuồng hồng pastel
  const wallGrad = ctx.createLinearGradient(0, y, 0, y + 54);
  wallGrad.addColorStop(0, '#fbcfe8');
  wallGrad.addColorStop(1, '#f472b6');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x, y + 8, 80, 46);
  ctx.strokeStyle = '#9d174d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y + 8, 80, 46);
  // Mái tím
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.moveTo(x - 7, y + 10);
  ctx.lineTo(x + 40, y - 20);
  ctx.lineTo(x + 87, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6b21a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cửa sổ tròn + đệm
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(x + 40, y + 30, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9d174d';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = '#9d174d';
  ctx.beginPath();
  ctx.moveTo(x + 29, y + 30);
  ctx.lineTo(x + 51, y + 30);
  ctx.moveTo(x + 40, y + 19);
  ctx.lineTo(x + 40, y + 41);
  ctx.stroke();
  // Biển cá "CHUỒNG MÈO"
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(x + 7, y - 13, 66, 15, 7);
  ctx.fill();
  ctx.strokeStyle = '#9d174d';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#9d174d';
  ctx.font = 'bold 8.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐟 CHUỒNG MÈO', x + 40, y - 2);
  // Đệm nằm trước cửa
  ctx.fillStyle = '#c084fc';
  ctx.beginPath();
  ctx.ellipse(x + 40, y + 58, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

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
  type: string
) {
  const w = 78;
  const h = 10;
  const x = cx - w / 2;
  const accent = type === 'chicken' ? '#fbbf24' : type === 'sheep' ? '#c084fc' : '#38bdf8';
  const accentLight = type === 'chicken' ? '#fde047' : type === 'sheep' ? '#e9d5ff' : '#93c5fd';
  const icon = type === 'chicken' ? '🥚' : type === 'sheep' ? '🧶' : '🥛';

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
  type: string,
  frame: number
) {
  const pulse = 0.5 + Math.sin(frame * 0.12) * 0.5;
  const icon = type === 'chicken' ? '🥚' : type === 'sheep' ? '🧶' : '🥛';
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

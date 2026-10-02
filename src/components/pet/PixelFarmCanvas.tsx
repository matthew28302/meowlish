'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Sparkles, Utensils, Award, RefreshCw, Volume2, Info, ChevronRight, Check } from 'lucide-react';
import { drawChibiChicken, drawChibiDairyCow } from './drawFarmLivestock';

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
  onUpdateCoins: (newCoins: number) => void;
  onUpdatePetExp?: (exp: number) => void;
  userId?: string;
  playerSpecies?: string;
  playerPetName?: string;
}

export default function PixelFarmCanvas({
  userCoins,
  onUpdateCoins,
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
    'Chào mừng đến Nông Trại Meowlish 2D! Chạm vào đồng cỏ để rải thóc 🌾 cho gà hoặc cỏ 🌿 cho bò!'
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

  // Drop food on ground
  const dropFoodAt = (x: number, y: number, type: 'wheat' | 'hay') => {
    const cost = type === 'wheat' ? 5 : 10;
    if (userCoins < cost) {
      setBannerMsg(`Bạn cần ít nhất ${cost} Coins để mua ${type === 'wheat' ? 'thóc cho gà' : 'cỏ cho bò'}!`);
      sound.playError();
      return;
    }

    onUpdateCoins(Math.max(0, userCoins - cost));
    sound.playClick();

    foodsRef.current.push({
      id: `food-${Date.now()}-${Math.random()}`,
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

    if (userId) {
      fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'feed_livestock',
          animalType: type === 'wheat' ? 'chicken' : 'cow',
        }),
      }).catch(() => {});
    }
  };

  // Collect Produce (Egg / Milk)
  const collectProduce = (item: FarmProduce) => {
    sound.playCelebration();
    onUpdateCoins(userCoins + item.rewardCoins);
    if (onUpdatePetExp) onUpdatePetExp(item.rewardExp);

    if (item.type === 'egg') {
      setHarvestedEggs((prev) => prev + 1);
    } else {
      setHarvestedMilk((prev) => prev + 1);
    }

    addFloatText(`+${item.rewardCoins} 🪙`, item.x, item.y - 20, '#facc15');
    addFloatText(`+${item.rewardExp} EXP ⭐`, item.x, item.y - 38, '#60a5fa');
    confetti({ particleCount: 20, spread: 50, origin: { x: item.x / canvasWidth, y: item.y / canvasHeight } });

    if (userId) {
      fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'harvest_livestock',
          animalType: item.type === 'egg' ? 'chicken' : 'cow',
        }),
      }).catch(() => {});
    }

    producesRef.current = producesRef.current.filter((p) => p.id !== item.id);
  };

  // Collect All Produces
  const handleCollectAll = () => {
    if (producesRef.current.length === 0) {
      setBannerMsg('Hiện chưa có Trứng hoặc Sữa nào trên nông trại. Hãy cho gà và bò ăn no để thu hoạch nhé!');
      return;
    }
    let totalCoins = 0;
    let totalExp = 0;

    producesRef.current.forEach((item) => {
      totalCoins += item.rewardCoins;
      totalExp += item.rewardExp;
      if (item.type === 'egg') setHarvestedEggs((prev) => prev + 1);
      else setHarvestedMilk((prev) => prev + 1);
      addFloatText(`+${item.rewardCoins}🪙`, item.x, item.y - 20, '#facc15');
    });

    onUpdateCoins(userCoins + totalCoins);
    if (onUpdatePetExp) onUpdatePetExp(totalExp);
    producesRef.current = [];

    sound.playCelebration();
    confetti({ particleCount: 35, spread: 65 });
    setBannerMsg(`🧺 Đã thu hoạch toàn bộ! Nhận được +${totalCoins} Coins và +${totalExp} EXP! 🎉`);
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
            // Produce Egg or Milk!
            animal.state = 'producing';
            animal.actionTimer = 40;
            animal.heartTimer = 80;

            if (animal.type === 'chicken') {
              producesRef.current.push({
                id: `egg-${Date.now()}-${Math.random()}`,
                type: 'egg',
                x: animal.x + (animal.direction === 1 ? -18 : 18),
                y: animal.y + 10,
                rewardCoins: 40,
                rewardExp: 15,
                bounceOffset: 0,
                createdAt: Date.now(),
              });
              addFloatText('🥚 Trứng Vàng!', animal.x, animal.y - 20, '#fef08a');
              sound.playPop();
            } else {
              producesRef.current.push({
                id: `milk-${Date.now()}-${Math.random()}`,
                type: 'milk',
                x: animal.x + (animal.direction === 1 ? -28 : 28),
                y: animal.y + 14,
                rewardCoins: 80,
                rewardExp: 30,
                bounceOffset: 0,
                createdAt: Date.now(),
              });
              addFloatText('🥛 Sữa Tươi!', animal.x, animal.y - 24, '#93c5fd');
              sound.playCelebration();
            }
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

      // --- LAYER 1: SKY, SUN, DISTANT HILLS ---
      // Morning Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
      skyGrad.addColorStop(0, '#7dd3fc');
      skyGrad.addColorStop(0.6, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasWidth, 180);

      // Warm Golden Sun
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(canvasWidth - 90, 45, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
      ctx.beginPath();
      ctx.arc(canvasWidth - 90, 45, 42, 0, Math.PI * 2);
      ctx.fill();

      // Soft Floating Clouds
      drawPuffyCloud(ctx, 120 + ((frame * 0.15) % (canvasWidth + 200)) - 100, 40, 0.9);
      drawPuffyCloud(ctx, 420 + ((frame * 0.1) % (canvasWidth + 200)) - 100, 30, 0.75);
      drawPuffyCloud(ctx, 650 + ((frame * 0.12) % (canvasWidth + 200)) - 100, 55, 0.85);

      // Distant Rolling Mountain Hills
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.quadraticCurveTo(180, 110, 360, 150);
      ctx.quadraticCurveTo(580, 100, canvasWidth, 170);
      ctx.lineTo(canvasWidth, 180);
      ctx.lineTo(0, 180);
      ctx.closePath();
      ctx.fill();

      // Midground Green Hills with Tree Silhouettes
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(0, 180);
      ctx.quadraticCurveTo(240, 135, 520, 175);
      ctx.quadraticCurveTo(720, 140, canvasWidth, 180);
      ctx.lineTo(canvasWidth, 180);
      ctx.lineTo(0, 180);
      ctx.closePath();
      ctx.fill();

      // Distant Trees on Hilltops
      for (let tx = 40; tx < canvasWidth; tx += 65) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(tx, 145 + Math.sin(tx * 0.05) * 10, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- LAYER 2: LUSH EMERALD PASTURE GROUND ---
      const grassGrad = ctx.createLinearGradient(0, 170, 0, canvasHeight);
      grassGrad.addColorStop(0, '#52a42b');
      grassGrad.addColorStop(0.3, '#62b534');
      grassGrad.addColorStop(0.7, '#489624');
      grassGrad.addColorStop(1, '#347218');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 170, canvasWidth, canvasHeight - 170);

      // Detailed Grass Tufts & Wildflowers
      for (let gx = 30; gx < canvasWidth - 30; gx += 55) {
        for (let gy = 190; gy < canvasHeight - 30; gy += 45) {
          const shiftX = (gy * 13) % 35;
          // Grass blades
          ctx.strokeStyle = '#3e841f';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gx + shiftX, gy);
          ctx.lineTo(gx + shiftX - 3, gy - 6);
          ctx.moveTo(gx + shiftX, gy);
          ctx.lineTo(gx + shiftX + 3, gy - 7);
          ctx.stroke();

          // Tiny blooming daisy flowers
          if ((gx + gy) % 9 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(gx + shiftX + 6, gy - 5, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(gx + shiftX + 6, gy - 5, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Cobblestone / Sandy Farm Paths
      ctx.fillStyle = '#e2ba86';
      ctx.beginPath();
      ctx.ellipse(canvasWidth * 0.48, canvasHeight * 0.58, 125, 215, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d4a26e';
      ctx.beginPath();
      ctx.ellipse(canvasWidth * 0.48, canvasHeight * 0.58, 95, 185, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shaded Cobblestone Stepping Stones
      for (let step = 0; step < 7; step++) {
        const sy = 220 + step * 40;
        const sx = canvasWidth * 0.48 + Math.sin(step * 0.8) * 18;
        ctx.fillStyle = '#a88661';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 18, 10, step * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ebd2b2';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // --- LAYER 3: LOTUS POND (Ao Sen Thơ Mộng) ---
      ctx.save();
      const pondX = 95;
      const pondY = 430;
      // Pond Bank
      ctx.fillStyle = '#caa376';
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, 82, 50, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Clear Turquoise Water
      const waterGrad = ctx.createLinearGradient(pondX - 60, pondY - 30, pondX + 60, pondY + 30);
      waterGrad.addColorStop(0, '#38bdf8');
      waterGrad.addColorStop(0.5, '#0284c7');
      waterGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, 74, 44, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Animated Water Ripple
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      const ripple = (frame * 0.04) % 18;
      ctx.beginPath();
      ctx.arc(pondX - 8, pondY, 14 + ripple, 0, Math.PI * 2);
      ctx.stroke();

      // Water Lily Pads & Pink Lotus Blossom 🪷
      drawLilyPad(ctx, pondX - 30, pondY - 10, 11);
      drawLilyPad(ctx, pondX + 28, pondY + 10, 13);
      drawLotusFlower(ctx, pondX - 10, pondY + 12);

      // Rustic Wooden Pier
      ctx.fillStyle = '#78350f';
      ctx.fillRect(pondX + 42, pondY - 32, 28, 12);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(pondX + 42, pondY - 30, 28, 3);
      ctx.fillRect(pondX + 42, pondY - 24, 28, 3);
      ctx.restore();

      // --- LAYER 4: WOODEN FENCES & CHARMING BARNS ---
      // Paddock Division Fence
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(canvasWidth * 0.45, 140);
      ctx.lineTo(canvasWidth * 0.45, canvasHeight - 25);
      ctx.stroke();
      // Fence Posts
      for (let fy = 150; fy < canvasHeight - 30; fy += 38) {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(canvasWidth * 0.45 - 6, fy, 12, 14);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(canvasWidth * 0.45 - 4, fy + 2, 8, 10);
      }

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

      // --- LAYER 7: ANIMALS RENDERING (Depth sorted) ---
      const sortedAnimals = [...animalsRef.current].sort((a, b) => a.y - b.y);

      sortedAnimals.forEach((animal) => {
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
  }, [userCoins, userId]);

  return (
    <div className="w-full flex flex-col gap-3" ref={containerRef}>
      {/* Top Banner Status (Purged of all external trademarks) */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-white shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🌾</span>
          <div>
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              Nông Trại Meowlish 2D
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/40 text-emerald-200 rounded-full font-extrabold border border-emerald-400/40">
                HD Retina 60 FPS
              </span>
            </h3>
            <p className="text-xs text-slate-200 font-medium">{bannerMsg}</p>
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
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1 active:scale-95"
            title="Thu hoạch tất cả trứng và sữa trên nông trại"
          >
            <span>🧺</span>
            <span>Thu Hoạch Hết</span>
          </button>
        </div>
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
            title="Rải thóc cho gà ăn (5 xu)"
          >
            <span>🌾</span>
            <span>Rải Thóc (5🪙)</span>
          </button>

          <button
            onClick={() => setActiveTool('hay')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'hay'
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Rải cỏ cho bò ăn (10 xu)"
          >
            <span>🌿</span>
            <span>Rải Cỏ (10🪙)</span>
          </button>
        </div>
      </div>

      {/* Farm Activity Guide Card */}
      <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-100 font-medium">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <b>Mẹo Nông Dân Meowlish:</b> Chăm chỉ cho gà ăn thóc vàng và bò ăn cỏ ngọt để thu hoạch Trứng Vàng 🥚 và Sữa Tươi 🥛, tích lũy Coins & EXP nâng cấp thú cưng!
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: Draw Soft Puffy Cloud
 */
function drawPuffyCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(16, -6, 15, 0, Math.PI * 2);
  ctx.arc(32, 0, 17, 0, Math.PI * 2);
  ctx.arc(16, 6, 14, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
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

  // Stone Foundation
  ctx.fillStyle = '#78716c';
  ctx.fillRect(0, 95, 170, 30);
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 95, 170, 30);

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

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Sparkles, Utensils, Award, RefreshCw, Volume2, Info } from 'lucide-react';

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
  direction: 1 | -1; // 1 = right, -1 = left
  actionTimer: number;
  animFrame: number;
  isHungry: boolean;
  heartTimer: number;
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
    'Chào mừng đến Nông Trại TeaMobi Avatar! Click vào đất để rải thóc 🌾 cho gà hoặc cỏ 🌿 cho bò!'
  );

  // Entities
  const animalsRef = useRef<AnimalState[]>([
    // Chickens
    { id: 'chk_1', type: 'chicken', name: 'Gà Mái Hoa Mơ', x: 180, y: 220, targetX: 180, targetY: 220, state: 'idle', direction: 1, actionTimer: 60, animFrame: 0, isHungry: true, heartTimer: 0 },
    { id: 'chk_2', type: 'chicken', name: 'Gà Trống Cồ', x: 260, y: 190, targetX: 260, targetY: 190, state: 'idle', direction: -1, actionTimer: 90, animFrame: 0, isHungry: true, heartTimer: 0 },
    { id: 'chk_3', type: 'chicken', name: 'Gà Con Chíp', x: 210, y: 260, targetX: 210, targetY: 260, state: 'idle', direction: 1, actionTimer: 45, animFrame: 0, isHungry: true, heartTimer: 0 },
    // Dairy Cows
    { id: 'cow_1', type: 'cow', name: 'Bò Sữa Daisy', x: 560, y: 260, targetX: 560, targetY: 260, state: 'idle', direction: -1, actionTimer: 100, animFrame: 0, isHungry: true, heartTimer: 0 },
    { id: 'cow_2', type: 'cow', name: 'Bò Sữa Bella', x: 670, y: 320, targetX: 670, targetY: 320, state: 'idle', direction: 1, actionTimer: 120, animFrame: 0, isHungry: true, heartTimer: 0 },
  ]);

  const foodsRef = useRef<FoodDrop[]>([]);
  const producesRef = useRef<FarmProduce[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const frameCountRef = useRef<number>(0);

  // Dimensions
  const canvasWidth = 840;
  const canvasHeight = 520;

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
    // Check user coins if buying feed (5 coins per drop)
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
      x: Math.max(80, Math.min(canvasWidth - 80, x)),
      y: Math.max(140, Math.min(canvasHeight - 60, y)),
      remaining: type === 'wheat' ? 3 : 4,
    });

    addFloatText(`-${cost} 🪙`, x, y - 10, '#ef4444');
    setBannerMsg(
      type === 'wheat'
        ? '🌾 Đã rải thóc! Đàn gà đang chạy lại mổ thóc...'
        : '🌿 Đã rải bó cỏ thơm ngon! Đàn bò sữa đang tới ăn...'
    );

    // Call API to sync livestock feed
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
    addFloatText(`+${item.rewardExp} EXP ⭐`, item.x, item.y - 36, '#60a5fa');
    confetti({ particleCount: 15, spread: 45, origin: { x: item.x / canvasWidth, y: item.y / canvasHeight } });

    // Sync to DB
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
      setBannerMsg('Hiện chưa có Trứng hoặc Sữa nào trên nông trại. Hãy cho gà và bò ăn để thu hoạch nhé!');
      return;
    }
    const count = producesRef.current.length;
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
    confetti({ particleCount: 30, spread: 60 });
    setBannerMsg(`🧺 Đã thu hoạch toàn bộ! Nhận được +${totalCoins} Coins và +${totalExp} EXP! 🎉`);
  };

  // Canvas Click & Touch Interaction Handler
  const handleInteractionAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // Check if clicked on a Produce (Egg / Milk)
    for (let i = producesRef.current.length - 1; i >= 0; i--) {
      const p = producesRef.current[i];
      const dist = Math.hypot(clickX - p.x, clickY - p.y);
      if (dist < 32) {
        collectProduce(p);
        return;
      }
    }

    // Check if clicked on an animal directly
    for (const a of animalsRef.current) {
      const dist = Math.hypot(clickX - a.x, clickY - a.y);
      if (dist < 40) {
        // Pet the animal
        a.heartTimer = 60;
        sound.playPop();
        addFloatText('❤️ Moah~', a.x, a.y - 28, '#f43f5e');
        setBannerMsg(`${a.name} được bạn vuốt ve nên rất thích thú!`);
        return;
      }
    }

    // If active tool is wheat or hay, drop food
    if (activeTool === 'wheat' || activeTool === 'hay') {
      dropFoodAt(clickX, clickY, activeTool);
    } else {
      // Hand tool: check proximity
      if (clickX < canvasWidth * 0.5) {
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

  // Main Canvas 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      frameCountRef.current++;
      const frame = frameCountRef.current;

      // 1. UPDATE ANIMALS AI
      animalsRef.current.forEach((animal) => {
        // Decrement timers
        if (animal.heartTimer > 0) animal.heartTimer--;

        // Search for nearest suitable food drop
        const targetFood = foodsRef.current.find(
          (f) =>
            f.remaining > 0 &&
            ((animal.type === 'chicken' && f.type === 'wheat') ||
              (animal.type === 'cow' && f.type === 'hay'))
        );

        if (targetFood && animal.state !== 'eating' && animal.state !== 'producing') {
          // Move towards food
          animal.targetX = targetFood.x + (Math.random() * 20 - 10);
          animal.targetY = targetFood.y + (Math.random() * 20 - 10);

          const dx = animal.targetX - animal.x;
          const dy = animal.targetY - animal.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 15) {
            // Arrived at food -> start eating
            animal.state = 'eating';
            animal.actionTimer = 100; // ~1.6 seconds eating
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
            // Finished eating -> Produce egg/milk!
            animal.state = 'producing';
            animal.actionTimer = 40;
            animal.heartTimer = 80;

            if (animal.type === 'chicken') {
              producesRef.current.push({
                id: `egg-${Date.now()}-${Math.random()}`,
                type: 'egg',
                x: animal.x + (animal.direction === 1 ? -16 : 16),
                y: animal.y + 12,
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
                x: animal.x + (animal.direction === 1 ? -24 : 24),
                y: animal.y + 16,
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
          // Wander randomly
          animal.actionTimer--;
          if (animal.actionTimer <= 0) {
            if (animal.state === 'idle') {
              // Pick random position within paddock
              const minX = animal.type === 'chicken' ? 120 : 420;
              const maxX = animal.type === 'chicken' ? 380 : 760;
              const minY = 180;
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
              const speed = animal.type === 'chicken' ? 0.9 : 0.6;
              animal.x += (dx / dist) * speed;
              animal.y += (dy / dist) * speed;
            } else {
              animal.state = 'idle';
            }
          }
        }

        // Animate legs/wings
        if (animal.state === 'walk' || animal.state === 'eating') {
          if (frame % 8 === 0) {
            animal.animFrame = (animal.animFrame + 1) % 4;
          }
        } else {
          animal.animFrame = 0;
        }
      });

      // 2. UPDATE FLOATING TEXTS
      for (let i = floatTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatTextsRef.current[i];
        ft.y -= 0.65;
        ft.alpha -= 0.016;
        if (ft.alpha <= 0) {
          floatTextsRef.current.splice(i, 1);
        }
      }

      // 3. RENDER CANVAS
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // --- LAYER 1: GRASS & COUNTRYSIDE BACKGROUND ---
      // Ground gradient: TeaMobi Avatar emerald green
      const grassGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      grassGrad.addColorStop(0, '#5ea83b');
      grassGrad.addColorStop(0.3, '#74be42');
      grassGrad.addColorStop(0.8, '#599f36');
      grassGrad.addColorStop(1, '#447d28');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Grass tufts / pixel patterns
      ctx.fillStyle = '#4c8b2d';
      for (let gx = 20; gx < canvasWidth; gx += 48) {
        for (let gy = 40; gy < canvasHeight; gy += 44) {
          ctx.fillRect(gx + ((gy * 7) % 24), gy, 4, 3);
          ctx.fillRect(gx + ((gy * 7) % 24) - 2, gy - 2, 2, 2);
        }
      }

      // Dirt Paths (Lối đi đất nện nông trại Avatar)
      ctx.fillStyle = '#d2a679';
      ctx.beginPath();
      ctx.ellipse(canvasWidth * 0.5, canvasHeight * 0.55, 120, 220, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c59567';
      ctx.beginPath();
      ctx.ellipse(canvasWidth * 0.5, canvasHeight * 0.55, 95, 190, 0, 0, Math.PI * 2);
      ctx.fill();

      // Small Lotus Pond on lower left
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(90, 430, 75, 45, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Water ripples
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      const rippleOffset = (frame * 0.05) % 15;
      ctx.beginPath();
      ctx.arc(85, 430, 15 + rippleOffset, 0, Math.PI * 2);
      ctx.stroke();

      // Lotus leaves
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(65, 420, 12, 0, Math.PI * 1.8);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(115, 435, 10, 0.4, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- LAYER 2: WOODEN FENCES & BARNS ---
      // Wooden fence dividing Chicken Run & Cow Pasture
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(canvasWidth * 0.46, 120);
      ctx.lineTo(canvasWidth * 0.46, canvasHeight - 30);
      ctx.stroke();

      // Fence rails
      for (let fy = 130; fy < canvasHeight - 40; fy += 40) {
        ctx.fillStyle = '#a16207';
        ctx.fillRect(canvasWidth * 0.46 - 6, fy, 12, 14);
      }

      // CHICKEN COOP (Chuồng Gà góc trên trái)
      ctx.save();
      // Walls
      ctx.fillStyle = '#b45309';
      ctx.fillRect(50, 60, 130, 90);
      ctx.fillStyle = '#d97706';
      for (let px = 55; px < 175; px += 20) {
        ctx.fillRect(px, 60, 4, 90);
      }
      // Roof (red shingles)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(35, 65);
      ctx.lineTo(115, 20);
      ctx.lineTo(195, 65);
      ctx.closePath();
      ctx.fill();
      // Door & Straw
      ctx.fillStyle = '#451a03';
      ctx.fillRect(95, 95, 40, 55);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(90, 142, 50, 10); // straw nest
      // Signboard
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(75, 40, 80, 20);
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHUỒNG GÀ', 115, 54);
      ctx.restore();

      // DAIRY COW BARN (Chuồng Bò góc trên phải)
      ctx.save();
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(canvasWidth - 220, 50, 160, 100);
      ctx.fillStyle = '#9a3412';
      for (let bx = canvasWidth - 215; bx < canvasWidth - 65; bx += 25) {
        ctx.fillRect(bx, 50, 4, 100);
      }
      // Roof
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(canvasWidth - 235, 55);
      ctx.lineTo(canvasWidth - 140, 15);
      ctx.lineTo(canvasWidth - 45, 55);
      ctx.closePath();
      ctx.fill();
      // Trough with Hay
      ctx.fillStyle = '#78350f';
      ctx.fillRect(canvasWidth - 200, 125, 120, 26);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(canvasWidth - 195, 120, 110, 10);
      // Signboard
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(canvasWidth - 180, 35, 80, 20);
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHUỒNG BÒ', canvasWidth - 140, 49);
      ctx.restore();

      // --- LAYER 3: FOOD DROPS ---
      foodsRef.current.forEach((food) => {
        ctx.save();
        if (food.type === 'wheat') {
          // Yellow wheat grain pile
          ctx.fillStyle = '#facc15';
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(food.x + (i % 3) * 6 - 6, food.y + Math.floor(i / 3) * 5, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#ca8a04';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('🌾', food.x - 7, food.y - 8);
        } else {
          // Hay bale bundle
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(food.x - 12, food.y - 8, 24, 16);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(food.x - 10, food.y - 6, 20, 12);
          ctx.fillStyle = '#a16207';
          ctx.fillRect(food.x - 4, food.y - 8, 2, 16);
          ctx.fillRect(food.x + 4, food.y - 8, 2, 16);
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('🌿', food.x - 6, food.y - 12);
        }
        ctx.restore();
      });

      // --- LAYER 4: PRODUCE (EGGS & MILK) ---
      producesRef.current.forEach((prod) => {
        ctx.save();
        const bounce = Math.sin((Date.now() - prod.createdAt) * 0.008) * 3;
        const py = prod.y + bounce;

        // Glowing circle indicator
        ctx.fillStyle = prod.type === 'egg' ? 'rgba(250, 204, 21, 0.4)' : 'rgba(96, 165, 250, 0.4)';
        ctx.beginPath();
        ctx.arc(prod.x, py, 18, 0, Math.PI * 2);
        ctx.fill();

        if (prod.type === 'egg') {
          // Golden egg pixel art
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.ellipse(prod.x, py, 9, 13, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Shiny glint
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(prod.x - 4, py - 6, 3, 3);
        } else {
          // Milk bottle pixel art
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(prod.x - 7, py - 9, 14, 18);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(prod.x - 5, py - 13, 10, 5); // cap
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(prod.x - 7, py - 9, 14, 18);
          // Label
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(prod.x - 5, py - 4, 10, 6);
        }

        // Tap hint badge
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Chạm nhặt', prod.x, py + 22);
        ctx.restore();
      });

      // --- LAYER 5: ANIMALS RENDERING ---
      // Sort by Y position for 2.5D depth
      const sortedAnimals = [...animalsRef.current].sort((a, b) => a.y - b.y);

      sortedAnimals.forEach((animal) => {
        ctx.save();
        ctx.translate(animal.x, animal.y);
        if (animal.direction === -1) {
          ctx.scale(-1, 1);
        }

        // Animal Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, animal.type === 'chicken' ? 6 : 14, animal.type === 'chicken' ? 12 : 28, animal.type === 'chicken' ? 5 : 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (animal.type === 'chicken') {
          // --- CHICKEN SPRITE ---
          const legHop = animal.state === 'walk' ? Math.sin(frame * 0.4) * 2 : 0;
          const pecking = animal.state === 'eating' ? Math.sin(frame * 0.5) * 5 : 0;

          // Legs
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-4, 2);
          ctx.lineTo(-4, 8 + legHop);
          ctx.moveTo(4, 2);
          ctx.lineTo(4, 8 - legHop);
          ctx.stroke();

          // Body (Chubby Round Hen)
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.ellipse(0, -4 + pecking * 0.3, 13, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Wing
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.ellipse(-3, -4 + pecking * 0.3, 7, 5, 0.2, 0, Math.PI * 2);
          ctx.fill();

          // Head & Beak
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(8, -11 + pecking, 7, 0, Math.PI * 2);
          ctx.fill();

          // Comb (Mào gà đỏ)
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(8, -17 + pecking, 3, 0, Math.PI * 2);
          ctx.arc(5, -16 + pecking, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Eye
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(9, -13 + pecking, 2, 2);

          // Orange Beak
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(13, -11 + pecking);
          ctx.lineTo(19, -9 + pecking);
          ctx.lineTo(13, -7 + pecking);
          ctx.closePath();
          ctx.fill();
        } else {
          // --- DAIRY COW SPRITE ---
          const legWalk = animal.state === 'walk' ? Math.sin(frame * 0.25) * 4 : 0;
          const chewOffset = animal.state === 'eating' ? Math.sin(frame * 0.3) * 2 : 0;

          // 4 Legs
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-18, 4, 7, 14 + legWalk);
          ctx.fillRect(-8, 4, 7, 14 - legWalk);
          ctx.fillRect(8, 4, 7, 14 + legWalk);
          ctx.fillRect(18, 4, 7, 14 - legWalk);

          // Black Hooves
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-18, 16 + legWalk, 7, 3);
          ctx.fillRect(-8, 16 - legWalk, 7, 3);
          ctx.fillRect(8, 16 + legWalk, 7, 3);
          ctx.fillRect(18, 16 - legWalk, 7, 3);

          // Large Body (White with black patches)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, -6, 28, 17, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Cow Spots
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.ellipse(-10, -8, 9, 7, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(10, -4, 7, 9, -0.2, 0, Math.PI * 2);
          ctx.fill();

          // Udder (Bầu vú hồng)
          ctx.fillStyle = '#fbcfe8';
          ctx.fillRect(-6, 6, 12, 5);

          // Tail
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-26, -6);
          ctx.lineTo(-32 + Math.sin(frame * 0.1) * 4, 2);
          ctx.stroke();

          // Cow Head
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(24, -14 + chewOffset, 13, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Pink Snout / Muzzle
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.ellipse(32, -10 + chewOffset, 9, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          // Nostrils
          ctx.fillStyle = '#475569';
          ctx.fillRect(33, -11 + chewOffset, 2, 2);
          ctx.fillRect(33, -8 + chewOffset, 2, 2);

          // Eye & Ears
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(24, -18 + chewOffset, 3, 3);
          // Little Horns
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(18, -25 + chewOffset, 3, 5);
        }

        // Heart animation above head if happy
        if (animal.heartTimer > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('❤️', 0, -32);
        }

        // Status exclamation if moving to food
        if (animal.state === 'walk') {
          const targetFood = foodsRef.current.find((f) => f.remaining > 0);
          if (targetFood) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('❗', 0, -28);
          }
        }

        ctx.restore();
      });

      // --- LAYER 6: FLOATING TEXTS ---
      floatTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
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
      {/* Top Banner Status */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 border border-emerald-500/40 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌾</span>
          <div>
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              Nông Trại TeaMobi Avatar 2D
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded-full font-bold">
                Canvas 60 FPS
              </span>
            </h3>
            <p className="text-xs text-slate-200 font-medium">{bannerMsg}</p>
          </div>
        </div>

        {/* Harvest Counter */}
        <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black">
          <div className="flex items-center gap-1 text-amber-300">
            <span>🥚 Đã thu:</span>
            <span>{harvestedEggs}</span>
          </div>
          <div className="h-3 w-px bg-white/20" />
          <div className="flex items-center gap-1 text-sky-300">
            <span>🥛 Sữa tươi:</span>
            <span>{harvestedMilk}</span>
          </div>
        </div>
      </div>

      {/* Main 2D Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-800 bg-slate-950 flex justify-center items-center select-none">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          onTouchEnd={handleCanvasTouchEnd}
          className="cursor-crosshair max-w-full h-auto object-contain block touch-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Floating Tool Bar Inside Canvas Top-Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl">
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
            <span>Thóc Gà (5🪙)</span>
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
            <span>Cỏ Bò (10🪙)</span>
          </button>

          <button
            onClick={() => setActiveTool('hand')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'hand'
                ? 'bg-sky-500 text-white ring-2 ring-sky-300'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Chạm tay để vuốt ve hoặc nhặt sản phẩm"
          >
            <span>✋</span>
            <span>Chạm Tay</span>
          </button>
        </div>

        {/* Bottom Left Quick Action: Thu hoạch tất cả */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <button
            onClick={handleCollectAll}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg border border-amber-300 cursor-pointer active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>Thu Hoạch Tất Cả Trứng & Sữa</span>
          </button>
        </div>
      </div>

      {/* Guide Footer */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 shrink-0 text-amber-500" />
        <span>
          <strong>Mẹo Nhà Nông:</strong> Click bất kỳ chỗ nào trên đất để rải thức ăn. Đàn gà và đàn bò sẽ tự động chạy tới mổ thóc/ăn cỏ và sinh ra Trứng Vàng 🥚 hoặc Sữa Tươi 🥛. Chạm vào sản phẩm để thu hoạch Coins và EXP!
        </span>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { CROPS_CATALOG, LIVESTOCK_CATALOG, FarmPlotState, LivestockState, CropInfo } from '@/lib/petFarmData';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Sparkles, Droplets, ShoppingBag, Plus, RefreshCw, Check, ArrowRight } from 'lucide-react';

export interface PixelFarmPlotsProps {
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onUpdatePetExp?: (addedExp: number) => void;
  userId?: string;
  initialPlots?: any[];
  initialLivestock?: any[];
}

export default function PixelFarmPlots({
  userCoins,
  onUpdateCoins,
  onUpdatePetExp,
  userId,
  initialPlots,
  initialLivestock,
}: PixelFarmPlotsProps) {
  const [plots, setPlots] = useState<FarmPlotState[]>(() => {
    if (initialPlots && initialPlots.length > 0) {
      return initialPlots.map((p: any) => ({
        plotIndex: p.plot_index,
        cropType: p.crop_type,
        stage: p.stage || 'empty',
        plantedAt: p.planted_at ? parseInt(p.planted_at, 10) : null,
        wateredAt: p.watered_at ? parseInt(p.watered_at, 10) : null,
        harvestReadyAt: p.harvest_ready_at ? parseInt(p.harvest_ready_at, 10) : null,
      }));
    }
    // Default 8 empty plots
    return Array.from({ length: 8 }, (_, i) => ({
      plotIndex: i,
      cropType: null,
      stage: 'empty',
      plantedAt: null,
      wateredAt: null,
      harvestReadyAt: null,
    }));
  });

  const [livestock, setLivestock] = useState<Record<string, any>>(() => {
    const defaultState: Record<string, any> = {
      chicken: { isFed: false, fedAt: null, readyAt: null, producedCount: 0 },
      cow: { isFed: false, fedAt: null, readyAt: null, producedCount: 0 },
    };
    if (initialLivestock) {
      initialLivestock.forEach((item: any) => {
        defaultState[item.animal_type] = {
          isFed: Boolean(item.ready_at),
          fedAt: item.fed_at ? parseInt(item.fed_at, 10) : null,
          readyAt: item.ready_at ? parseInt(item.ready_at, 10) : null,
          producedCount: item.produced_count || 0,
        };
      });
    }
    return defaultState;
  });

  const [selectedPlotForSeed, setSelectedPlotForSeed] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; x: number; y: number; color: string }[]>([]);

  // Ticker for real-time plant growth every 500ms
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const triggerFloatingText = (text: string, e: React.MouseEvent, color = 'text-amber-400') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, text, x: rect.left + rect.width / 2, y: rect.top, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1500);
  };

  // 1. Plant Seed
  const handlePlantSeed = async (plotIndex: number, crop: CropInfo) => {
    if (userCoins < crop.seedPrice) {
      sound.playWrong();
      alert(`Bạn đang có ${userCoins} xu, không đủ ${crop.seedPrice} xu để mua hạt giống ${crop.name}!`);
      return;
    }

    sound.playSuccess();
    setSelectedPlotForSeed(null);

    // Optimistic Update
    const readyTime = Date.now() + crop.growthTimeSeconds * 1000;
    setPlots((prev) =>
      prev.map((p) =>
        p.plotIndex === plotIndex
          ? {
              ...p,
              cropType: crop.id,
              stage: 'growing',
              plantedAt: Date.now(),
              wateredAt: null,
              harvestReadyAt: readyTime,
            }
          : p
      )
    );
    onUpdateCoins(userCoins - crop.seedPrice);

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'plant_crop',
          plotIndex,
          cropType: crop.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);
      }
    } catch {}
  };

  // 2. Water Plot
  const handleWaterPlot = async (plotIndex: number | 'all', e?: React.MouseEvent) => {
    sound.playClick();
    const currNow = Date.now();

    setPlots((prev) =>
      prev.map((p) => {
        if (plotIndex === 'all' || p.plotIndex === plotIndex) {
          if (p.cropType && p.harvestReadyAt && p.harvestReadyAt > currNow) {
            const remaining = p.harvestReadyAt - currNow;
            const newReady = currNow + Math.floor(remaining * 0.65);
            return { ...p, wateredAt: currNow, harvestReadyAt: newReady };
          }
        }
        return p;
      })
    );

    if (e) triggerFloatingText('💧 Tăng Tốc +35%!', e, 'text-sky-400');

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'water_crop',
          plotIndex,
        }),
      });
    } catch {}
  };

  // 3. Harvest Plot
  const handleHarvestPlot = async (plotIndex: number, e: React.MouseEvent) => {
    const plot = plots.find((p) => p.plotIndex === plotIndex);
    if (!plot || !plot.cropType) return;
    const crop = CROPS_CATALOG[plot.cropType];
    if (!crop) return;

    sound.playCelebration();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    triggerFloatingText(`+${crop.harvestCoins} 🪙 | +${crop.harvestExp} EXP`, e, 'text-emerald-400');

    onUpdateCoins(userCoins + crop.harvestCoins);
    onUpdatePetExp?.(crop.harvestExp);

    setPlots((prev) =>
      prev.map((p) =>
        p.plotIndex === plotIndex
          ? { ...p, cropType: null, stage: 'empty', plantedAt: null, wateredAt: null, harvestReadyAt: null }
          : p
      )
    );

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'harvest_crop',
          plotIndex,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);
      }
    } catch {}
  };

  // 4. Harvest All
  const handleHarvestAll = async (e: React.MouseEvent) => {
    const ripePlots = plots.filter((p) => p.cropType && p.harvestReadyAt && now >= p.harvestReadyAt);
    if (ripePlots.length === 0) {
      alert('Chưa có luống rau nào chín mọng để thu hoạch!');
      return;
    }

    sound.playCelebration();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });

    let totalCoins = 0;
    let totalExp = 0;
    ripePlots.forEach((p) => {
      const c = CROPS_CATALOG[p.cropType!];
      if (c) {
        totalCoins += c.harvestCoins;
        totalExp += c.harvestExp;
      }
    });

    triggerFloatingText(`+${totalCoins} 🪙 | +${totalExp} EXP`, e, 'text-yellow-400');
    onUpdateCoins(userCoins + totalCoins);
    onUpdatePetExp?.(totalExp);

    setPlots((prev) =>
      prev.map((p) => {
        if (p.cropType && p.harvestReadyAt && now >= p.harvestReadyAt) {
          return { ...p, cropType: null, stage: 'empty', plantedAt: null, wateredAt: null, harvestReadyAt: null };
        }
        return p;
      })
    );

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'harvest_all_crops',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);
      }
    } catch {}
  };

  // 5. Feed Livestock (Chicken / Cow)
  const handleFeedLivestock = async (type: 'chicken' | 'cow', e: React.MouseEvent) => {
    const animal = LIVESTOCK_CATALOG[type];
    if (userCoins < animal.feedPrice) {
      sound.playWrong();
      alert(`Bạn cần ${animal.feedPrice} xu để mua thức ăn cho ${animal.name}!`);
      return;
    }

    sound.playSuccess();
    triggerFloatingText(`-${animal.feedPrice} 🪙 (Cho ăn)`, e, 'text-rose-400');
    onUpdateCoins(userCoins - animal.feedPrice);

    const readyAt = Date.now() + animal.cycleSeconds * 1000;
    setLivestock((prev) => ({
      ...prev,
      [type]: { ...prev[type], isFed: true, fedAt: Date.now(), readyAt },
    }));

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'feed_livestock',
          animalType: type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);
      }
    } catch {}
  };

  // 6. Harvest Livestock (Eggs / Milk)
  const handleHarvestLivestock = async (type: 'chicken' | 'cow', e: React.MouseEvent) => {
    const animal = LIVESTOCK_CATALOG[type];
    sound.playCelebration();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    triggerFloatingText(`+${animal.rewardCoins} 🪙 | +${animal.rewardExp} EXP`, e, 'text-amber-400');

    onUpdateCoins(userCoins + animal.rewardCoins);
    onUpdatePetExp?.(animal.rewardExp);

    setLivestock((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        isFed: false,
        fedAt: null,
        readyAt: null,
        producedCount: (prev[type]?.producedCount || 0) + 1,
      },
    }));

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'harvest_livestock',
          animalType: type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);
      }
    } catch {}
  };

  const ripeCount = plots.filter((p) => p.cropType && p.harvestReadyAt && now >= p.harvestReadyAt).length;

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Floating Gain Texts */}
      {floatingTexts.map((ft) => (
        <div
          key={ft.id}
          className={`fixed pointer-events-none z-50 font-black text-sm sm:text-base drop-shadow-md animate-bounce ${ft.color}`}
          style={{ left: ft.x, top: ft.y - 20 }}
        >
          {ft.text}
        </div>
      ))}

      {/* ================= FARM HEADER & TOOLBAR ================= */}
      <div className="bg-gradient-to-r from-amber-900/90 via-emerald-950/90 to-amber-950/90 text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-amber-600/60 shadow-xl flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner">
            🌾
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-wide flex items-center gap-1.5 text-amber-300">
              <span>Nông Trại TeaMobi Avatar</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700/80 text-white font-bold">
                8 Luống Đất
              </span>
            </h3>
            <p className="text-[11px] text-amber-100/80 font-medium">
              Gieo hạt giống, tưới nước mát và thu hoạch nông sản bội thu tích lũy Coins & EXP!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleWaterPlot('all', e)}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-md hover:scale-102 active:scale-95"
            title="Tưới nước cho tất cả các luống cây để giảm 35% thời gian sinh trưởng!"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Tưới Tất Cả</span>
          </button>

          <button
            onClick={handleHarvestAll}
            disabled={ripeCount === 0}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-md hover:scale-102 active:scale-95 ${
              ripeCount > 0
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
            }`}
            title="Thu hoạch tất cả nông sản đã chín!"
          >
            <span>🧺</span>
            <span>Thu Hoạch Hết ({ripeCount})</span>
          </button>
        </div>
      </div>

      {/* ================= 8-PLOT CROPS GRID ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {plots.map((plot) => {
          const crop = plot.cropType ? CROPS_CATALOG[plot.cropType] : null;
          const isGrowing = Boolean(crop && plot.harvestReadyAt && now < plot.harvestReadyAt);
          const isRipe = Boolean(crop && plot.harvestReadyAt && now >= plot.harvestReadyAt);
          const remainingSecs = isGrowing ? Math.ceil((plot.harvestReadyAt! - now) / 1000) : 0;
          const totalSecs = crop ? crop.growthTimeSeconds : 1;
          const progressPercent = isGrowing ? Math.min(100, Math.floor(((totalSecs - remainingSecs) / totalSecs) * 100)) : isRipe ? 100 : 0;

          return (
            <div
              key={plot.plotIndex}
              className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 flex flex-col justify-between items-center text-center transition-all duration-200 border-2 sm:border-3 min-h-[160px] sm:min-h-[175px] shadow-md group overflow-hidden"
              style={{
                backgroundColor: '#78350f', // Rich Avatar earthy brown
                borderColor: isRipe ? '#facc15' : '#b45309',
                boxShadow: isRipe ? '0 0 15px rgba(250, 204, 21, 0.4)' : undefined,
              }}
            >
              {/* Plot Dirt Texture Background */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#451a03 1.5px, transparent 1.5px)',
                  backgroundSize: '10px 10px',
                }}
              />

              {/* Plot Header Tag */}
              <div className="w-full flex items-center justify-between text-[10px] font-black z-10">
                <span className="px-2 py-0.5 rounded-full bg-black/40 text-amber-200 border border-amber-500/30">
                  #{plot.plotIndex + 1}
                </span>
                {isRipe && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black animate-pulse flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> CHÍN RỘ
                  </span>
                )}
                {isGrowing && (
                  <span className="px-1.5 py-0.5 rounded-full bg-sky-900/80 text-sky-200 border border-sky-400/40">
                    ⏱️ {remainingSecs}s
                  </span>
                )}
              </div>

              {/* Plant Visual Centerpiece */}
              <div className="my-auto z-10 flex flex-col items-center justify-center">
                {crop ? (
                  <div className="relative flex flex-col items-center">
                    {isRipe ? (
                      <div className="text-4xl sm:text-5xl animate-bounce filter drop-shadow-lg cursor-pointer transform hover:scale-115 transition-transform">
                        {crop.emoji}
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Sprout vs Stem Growth */}
                        <div className="text-3xl sm:text-4xl transform scale-90 transition-transform">
                          {progressPercent < 50 ? '🌱' : '🌿'}
                        </div>
                        <div className="text-xs opacity-50 absolute -bottom-1 -right-1">
                          {crop.emoji}
                        </div>
                      </div>
                    )}
                    <span className="text-xs font-black text-amber-100 mt-1 line-clamp-1">
                      {crop.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2 text-amber-300/60 group-hover:text-amber-300 transition-colors">
                    <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-amber-500/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🌱
                    </div>
                    <span className="text-[11px] font-bold mt-1 text-amber-200/70">Đất Đã Xới Sẵn</span>
                  </div>
                )}
              </div>

              {/* Growth Progress Bar */}
              {isGrowing && (
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-amber-600/40 my-1 z-10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Bottom Actions */}
              <div className="w-full z-10 pt-1">
                {isRipe ? (
                  <button
                    onClick={(e) => handleHarvestPlot(plot.plotIndex, e)}
                    className="w-full py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span>🧺 Thu Hoạch</span>
                    <span className="text-[10px] opacity-80">(+{crop?.harvestCoins} xu)</span>
                  </button>
                ) : isGrowing ? (
                  <button
                    onClick={(e) => handleWaterPlot(plot.plotIndex, e)}
                    className="w-full py-1 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white font-black text-[11px] transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Droplets className="w-3 h-3 text-sky-200" />
                    <span>Tưới Nước</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPlotForSeed(plot.plotIndex)}
                    className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gieo Hạt</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= LIVESTOCK BARN (CHUỒNG GÀ & BÒ SỮA) ================= */}
      <div className="bg-gradient-to-b from-stone-900/90 via-amber-950/80 to-stone-900/90 p-4 rounded-3xl border-3 border-amber-700/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <div>
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                Khu Chăn Nuôi Gia Súc & Gia Cầm
              </h4>
              <p className="text-[11px] text-amber-100/70 font-medium">
                Chăm sóc đàn gà đẻ trứng vàng và vắt sữa bò Hà Lan thanh trùng!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. CHICKEN COOP */}
          {(() => {
            const chicken = LIVESTOCK_CATALOG.chicken;
            const state = livestock.chicken || {};
            const isWaiting = state.isFed && state.readyAt && now < state.readyAt;
            const isReady = state.isFed && state.readyAt && now >= state.readyAt;
            const remaining = isWaiting ? Math.ceil((state.readyAt - now) / 1000) : 0;

            return (
              <div className="p-3.5 rounded-2xl bg-amber-950/60 border-2 border-amber-600/50 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-900/50 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner relative">
                    {isReady ? '🥚' : '🐔'}
                    {isReady && (
                      <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
                    )}
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-amber-200 flex items-center gap-1">
                      <span>{chicken.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-800 text-amber-200">
                        x{state.producedCount || 0} Trứng
                      </span>
                    </h5>
                    <p className="text-[10px] text-amber-100/60 font-medium">
                      {isReady
                        ? 'Ổ rơm có trứng vàng óng ả!'
                        : isWaiting
                        ? `Đang ấp trứng... còn ${remaining}s`
                        : 'Gà đang đói, cần kê vàng!'}
                    </p>
                  </div>
                </div>

                <div>
                  {isReady ? (
                    <button
                      onClick={(e) => handleHarvestLivestock('chicken', e)}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer shadow-md animate-bounce"
                    >
                      Nhặt Trứng (+{chicken.rewardCoins} xu)
                    </button>
                  ) : isWaiting ? (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-900/60 text-amber-200 text-xs font-black border border-amber-600/40">
                      ⏳ {remaining}s
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleFeedLivestock('chicken', e)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-xs active:scale-95"
                    >
                      🌾 Cho Ăn ({chicken.feedPrice} xu)
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 2. DAIRY COW */}
          {(() => {
            const cow = LIVESTOCK_CATALOG.cow;
            const state = livestock.cow || {};
            const isWaiting = state.isFed && state.readyAt && now < state.readyAt;
            const isReady = state.isFed && state.readyAt && now >= state.readyAt;
            const remaining = isWaiting ? Math.ceil((state.readyAt - now) / 1000) : 0;

            return (
              <div className="p-3.5 rounded-2xl bg-amber-950/60 border-2 border-amber-600/50 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-900/50 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner relative">
                    {isReady ? '🥛' : '🐮'}
                    {isReady && (
                      <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
                    )}
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-amber-200 flex items-center gap-1">
                      <span>{cow.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-800 text-amber-200">
                        x{state.producedCount || 0} Sữa
                      </span>
                    </h5>
                    <p className="text-[10px] text-amber-100/60 font-medium">
                      {isReady
                        ? 'Xô sữa đầy tràn thơm ngon!'
                        : isWaiting
                        ? `Đang gặm cỏ non... còn ${remaining}s`
                        : 'Bò sữa cần bổ sung cỏ tươi!'}
                    </p>
                  </div>
                </div>

                <div>
                  {isReady ? (
                    <button
                      onClick={(e) => handleHarvestLivestock('cow', e)}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer shadow-md animate-bounce"
                    >
                      Vắt Sữa (+{cow.rewardCoins} xu)
                    </button>
                  ) : isWaiting ? (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-900/60 text-amber-200 text-xs font-black border border-amber-600/40">
                      ⏳ {remaining}s
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleFeedLivestock('cow', e)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-xs active:scale-95"
                    >
                      🌿 Cho Ăn ({cow.feedPrice} xu)
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ================= SEED SELECTOR MODAL ================= */}
      {selectedPlotForSeed !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border-4 border-amber-500 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌱</span>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Chọn Hạt Giống Cho Luống #{selectedPlotForSeed + 1}
                  </h4>
                  <p className="text-[11px] text-slate-500">Mỗi loại hạt có thời gian sinh trưởng và sản lượng khác nhau!</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlotForSeed(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar p-0.5">
              {Object.values(CROPS_CATALOG).map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => handlePlantSeed(selectedPlotForSeed, crop)}
                  className="p-2.5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/60 text-left transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl group-hover:scale-115 transition-transform">{crop.emoji}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      🪙 {crop.seedPrice} xu
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <div className="font-black text-xs text-slate-900 line-clamp-1">{crop.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">⏱️ {crop.growthTimeSeconds} giây</div>
                    <div className="text-[9.5px] font-bold text-emerald-700 mt-1">
                      Thu: +{crop.harvestCoins} xu, +{crop.harvestExp} EXP
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

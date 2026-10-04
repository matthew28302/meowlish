'use client';

import React, { useState, useEffect, useRef } from 'react';
import PixelPetSprite from './PixelPetSprite';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Zap, Trophy, Play, RotateCcw, Flame } from 'lucide-react';

export interface PetRacingDerbyProps {
  playerSpecies: string;
  playerPetName: string;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onUpdatePetExp?: (addedExp: number) => void;
  userId?: string;
}

interface Racer {
  id: string;
  name: string;
  species: string;
  isPlayer: boolean;
  lane: number;
  progress: number; // 0 to 100
  speed: number;
  stamina: number; // 0 to 100
  state: 'running' | 'boosted' | 'slipped' | 'finished';
  finishPosition?: number;
}

export default function PetRacingDerby({
  playerSpecies = 'owl',
  playerPetName = 'Lexi Trí Tuệ',
  userCoins,
  onUpdateCoins,
  onUpdatePetExp,
  userId,
}: PetRacingDerbyProps) {
  const [selectedBet, setSelectedBet] = useState<number>(100);
  const [raceState, setRaceState] = useState<'betting' | 'countdown' | 'racing' | 'finished'>('betting');
  const [countdown, setCountdown] = useState<number>(3);
  const [playerStamina, setPlayerStamina] = useState<number>(100);
  const [finishOrder, setFinishOrder] = useState<Racer[]>([]);

  // 4 Racers
  const [racers, setRacers] = useState<Racer[]>(() => [
    { id: 'player', name: playerPetName, species: playerSpecies, isPlayer: true, lane: 0, progress: 0, speed: 0.28, stamina: 100, state: 'running' },
    { id: 'racer_chopper', name: 'Chopper Tuần Lộc', species: 'chopper', isPlayer: false, lane: 1, progress: 0, speed: 0.27, stamina: 100, state: 'running' },
    { id: 'racer_kurama', name: 'Kurama Hỏa Hồ', species: 'kurama', isPlayer: false, lane: 2, progress: 0, speed: 0.29, stamina: 100, state: 'running' },
    { id: 'racer_kirby', name: 'Kirby Sao Vàng', species: 'kirby', isPlayer: false, lane: 3, progress: 0, speed: 0.26, stamina: 100, state: 'running' },
  ]);

  const animFrameRef = useRef<number | null>(null);
  const finishedRacersRef = useRef<Racer[]>([]);

  // Countdown timer
  useEffect(() => {
    if (raceState !== 'countdown') return;

    if (countdown > 0) {
      sound.playClick();
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      sound.playCelebration();
      setRaceState('racing');
    }
  }, [raceState, countdown]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (raceState !== 'racing') return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;

      setRacers((prevRacers) => {
        let allFinished = true;

        const updated = prevRacers.map((racer) => {
          if (racer.progress >= 100) return racer;

          allFinished = false;

          // AI variance / random acceleration
          let currentSpeed = racer.speed;

          if (racer.state === 'boosted') {
            currentSpeed *= 1.7;
          } else if (racer.state === 'slipped') {
            currentSpeed *= 0.35;
          }

          // Random AI spurts
          if (!racer.isPlayer && Math.random() < 0.03 && racer.stamina > 20) {
            currentSpeed *= 1.5;
          }

          // Calculate next progress
          const progressStep = (currentSpeed * delta) / 16;
          const nextProgress = Math.min(100, racer.progress + progressStep);

          // Check finish line
          if (nextProgress >= 100 && !finishedRacersRef.current.some((f) => f.id === racer.id)) {
            const finishedRacer = { ...racer, progress: 100, finishPosition: finishedRacersRef.current.length + 1 };
            finishedRacersRef.current.push(finishedRacer);
            return finishedRacer;
          }

          return {
            ...racer,
            progress: nextProgress,
            state: racer.state === 'boosted' && Math.random() < 0.05 ? 'running' : racer.state,
          };
        });

        if (allFinished || finishedRacersRef.current.length === 4) {
          handleRaceFinished(finishedRacersRef.current);
        }

        return updated;
      });

      // Regenerate player stamina slowly
      setPlayerStamina((s) => Math.min(100, s + 0.3));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [raceState]);

  // Start Race Handler
  const handleStartRace = () => {
    if (userCoins < selectedBet) {
      sound.playWrong();
      alert(`Bạn đang có ${userCoins} xu, không đủ ${selectedBet} xu để đặt cược!`);
      return;
    }

    sound.playClick();
    onUpdateCoins(userCoins - selectedBet);
    finishedRacersRef.current = [];
    setFinishOrder([]);
    setPlayerStamina(100);

    // Reset racers with slightly randomized base speed for excitement
    setRacers([
      { id: 'player', name: playerPetName, species: playerSpecies, isPlayer: true, lane: 0, progress: 0, speed: 0.28, stamina: 100, state: 'running' },
      { id: 'racer_chopper', name: 'Chopper Tuần Lộc', species: 'chopper', isPlayer: false, lane: 1, progress: 0, speed: 0.26 + Math.random() * 0.05, stamina: 100, state: 'running' },
      { id: 'racer_kurama', name: 'Kurama Hỏa Hồ', species: 'kurama', isPlayer: false, lane: 2, progress: 0, speed: 0.27 + Math.random() * 0.05, stamina: 100, state: 'running' },
      { id: 'racer_kirby', name: 'Kirby Sao Vàng', species: 'kirby', isPlayer: false, lane: 3, progress: 0, speed: 0.26 + Math.random() * 0.05, stamina: 100, state: 'running' },
    ]);

    setCountdown(3);
    setRaceState('countdown');
  };

  // Player Tap "Boost" button
  const handleBoost = () => {
    if (raceState !== 'racing' || playerStamina < 20) return;

    sound.playSuccess();
    setPlayerStamina((s) => Math.max(0, s - 25));

    setRacers((prev) =>
      prev.map((r) =>
        r.isPlayer
          ? { ...r, state: 'boosted', speed: r.speed * 1.5 }
          : r
      )
    );

    setTimeout(() => {
      setRacers((prev) =>
        prev.map((r) =>
          r.isPlayer && r.state === 'boosted' ? { ...r, state: 'running', speed: 0.28 } : r
        )
      );
    }, 600);
  };

  // Race Finish Handler
  const handleRaceFinished = async (order: Racer[]) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setFinishOrder(order);
    setRaceState('finished');

    const playerFinish = order.find((r) => r.isPlayer);
    const position = playerFinish?.finishPosition || 4;

    let payout = 0;
    let earnedExp = 20;

    if (position === 1) {
      payout = Math.floor(selectedBet * 2.5);
      earnedExp = 60;
      sound.playCelebration();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } else if (position === 2) {
      payout = Math.floor(selectedBet * 1.2);
      earnedExp = 35;
      sound.playSuccess();
    } else {
      sound.playWrong();
    }

    if (payout > 0) {
      onUpdateCoins(userCoins - selectedBet + payout);
      onUpdatePetExp?.(earnedExp);
    }

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'claim_racing_reward',
          rewardCoins: payout,
          rewardExp: earnedExp,
        }),
      });
    } catch {}
  };

  const laneColors = ['#15803d', '#166534', '#15803d', '#166534'];

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* ================= DERBY HEADER & BETTING BAR ================= */}
      <div className="bg-gradient-to-r from-emerald-900 via-amber-950 to-emerald-950 text-white p-3.5 sm:p-4 rounded-3xl border-3 border-amber-500/50 shadow-xl flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner">
            🏁
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-1.5">
              <span>Đấu Trường Đua Thú Cưng (Pet Racing Derby)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                4 Làn Đua
              </span>
            </h3>
            <p className="text-[11px] text-amber-100/80 font-medium">
              So tài tốc độ kinh điển Meowlish Derby, nhấn Cổ Vũ Boost để về đích đầu tiên!
            </p>
          </div>
        </div>

        {/* Betting Selector */}
        {raceState === 'betting' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-200 hidden sm:inline">Mức Cược:</span>
            {[50, 100, 200, 500].map((bet) => (
              <button
                key={bet}
                onClick={() => setSelectedBet(bet)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  selectedBet === bet
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🪙 {bet}
              </button>
            ))}

            <button
              onClick={handleStartRace}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center gap-1 active:scale-95 ml-1"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Vào Cuộc Đua</span>
            </button>
          </div>
        )}

        {/* In-Race Action: BOOST BUTTON */}
        {raceState === 'racing' && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-amber-200">Thể Lực (Stamina)</span>
              <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-amber-500/40">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-200"
                  style={{ width: `${playerStamina}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleBoost}
              disabled={playerStamina < 20}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center gap-1.5 active:scale-90 ${
                playerStamina >= 20
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Flame className="w-4 h-4 fill-amber-300 text-orange-600" />
              <span>BỨT TỐC! ⚡</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= THE 4-LANE RACING DERBY TRACK ================= */}
      <div
        className="relative rounded-3xl overflow-hidden border-3 border-amber-600/70 shadow-2xl p-2.5 sm:p-4 space-y-2 bg-[#2d5a27]"
        style={{
          minHeight: '320px',
          backgroundImage: 'radial-gradient(#1e3f1a 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        {/* Countdown Overlay */}
        {raceState === 'countdown' && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
            <div className="text-6xl sm:text-7xl font-black text-amber-300 animate-ping">
              {countdown === 0 ? 'XUẤT PHÁT! 🚀' : countdown}
            </div>
            <p className="text-xs text-amber-100/80 font-bold mt-4">Chuẩn bị nhấn Bứt Tốc để dẫn đầu!</p>
          </div>
        )}

        {/* Checkered Finish Line Banner */}
        <div className="absolute top-0 bottom-0 right-10 sm:right-16 w-5 sm:w-7 z-20 pointer-events-none flex flex-col opacity-85">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 w-full"
              style={{
                backgroundColor: i % 2 === 0 ? '#ffffff' : '#0f172a',
              }}
            />
          ))}
        </div>

        {/* 4 Lanes */}
        {racers.map((racer, index) => (
          <div
            key={racer.id}
            className="relative h-16 sm:h-18 rounded-2xl flex items-center px-3 border border-emerald-600/40 shadow-inner overflow-hidden"
            style={{ backgroundColor: laneColors[index] }}
          >
            {/* Lane Number & Racer Tag */}
            <div className="absolute left-2 z-10 flex items-center gap-1.5 pointer-events-none opacity-80">
              <span className="w-5 h-5 rounded-full bg-black/40 text-amber-300 text-[10px] font-black flex items-center justify-center border border-amber-500/30">
                {index + 1}
              </span>
              <span className="text-[10px] font-black text-white/90 drop-shadow-md truncate max-w-[90px] sm:max-w-none">
                {racer.name}
              </span>
            </div>

            {/* Moving Pet Sprite on Track */}
            <div
              className="absolute z-30 transition-all duration-75 flex flex-col items-center"
              style={{
                left: `calc(8% + ${racer.progress * 0.78}%)`,
              }}
            >
              {racer.state === 'boosted' && (
                <span className="text-xs absolute -top-4 animate-bounce">⚡ BỨT TỐC!</span>
              )}
              <PixelPetSprite
                species={racer.species}
                scale={0.875}
                animationState={raceState === 'racing' ? 'run' : 'idle'}
                facing="right"
              />
              <div className="w-8 h-2 bg-black/35 rounded-full blur-[0.5px] -mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= VICTORY CEREMONY / RESULTS ================= */}
      {raceState === 'finished' && finishOrder.length > 0 && (
        <div className="bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-3 border-amber-400 p-4 sm:p-5 rounded-3xl text-center space-y-3 text-white shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">🏆</span>
            <h4 className="text-base sm:text-lg font-black text-amber-300 uppercase">
              Bảng Xếp Hạng Về Đích Đua Thú Cưng
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
            {finishOrder.map((racer, idx) => {
              const isWinner = idx === 0;
              const isSecond = idx === 1;

              return (
                <div
                  key={racer.id}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between ${
                    isWinner
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg ring-2 ring-amber-300'
                      : isSecond
                      ? 'border-slate-300 bg-slate-700/50'
                      : 'border-slate-700 bg-slate-900/60 opacity-80'
                  }`}
                >
                  <div className="text-2xl mb-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}</div>
                  <div className="font-black text-xs text-white truncate max-w-full">{racer.name}</div>
                  <div className="text-[10px] text-amber-200/80 mt-0.5">
                    Hạng {idx + 1}
                  </div>
                  {racer.isPlayer && (
                    <div className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      Bé Của Bạn
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outcome Announcement */}
          {(() => {
            const playerPos = finishOrder.findIndex((r) => r.isPlayer) + 1;
            const wonMoney = playerPos === 1 ? Math.floor(selectedBet * 2.5) : playerPos === 2 ? Math.floor(selectedBet * 1.2) : 0;

            return (
              <div className="pt-2">
                {wonMoney > 0 ? (
                  <p className="text-sm font-black text-emerald-300">
                    🎉 Xin chúc mừng! Bé đã về đích Hạng {playerPos}! Nhận thưởng +{wonMoney} Coins!
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">
                    Bé về đích Hạng {playerPos}! Cố gắng bứt tốc nhịp nhàng ở trận đua tiếp theo nhé!
                  </p>
                )}
              </div>
            );
          })()}

          <button
            onClick={() => setRaceState('betting')}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md hover:scale-102 transition cursor-pointer"
          >
            Đua Chặng Mới
          </button>
        </div>
      )}
    </div>
  );
}

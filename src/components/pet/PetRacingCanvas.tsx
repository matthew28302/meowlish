'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateRacingQuestion, QuizQuestion } from '@/lib/petQuizData';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Trophy, Zap, Flag, RefreshCw, CheckCircle, XCircle, Award } from 'lucide-react';
import { OpponentData } from './PetPvPArenaCanvas';

export interface PetRacingCanvasProps {
  playerSpecies: string;
  playerPetName: string;
  playerLevel?: number;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onUpdatePetExp?: (addedExp: number) => void;
  userId?: string;
  realOpponents?: OpponentData[];
}

interface Racer {
  id: string;
  name: string;
  species: string;
  ownerName: string;
  x: number;
  lane: number;
  speed: number;
  isPlayer: boolean;
  isStunned: boolean;
  isFinished: boolean;
  finishRank?: number;
  boostTimer: number;
}

export default function PetRacingCanvas({
  playerSpecies = 'owl',
  playerPetName = 'Lexi Trí Tuệ',
  playerLevel = 1,
  userCoins,
  onUpdateCoins,
  onUpdatePetExp,
  userId,
  realOpponents = [],
}: PetRacingCanvasProps) {
  // Opponent pool
  const defaultOpponents: OpponentData[] = [
    { id: 'opp_vukiet', username: 'vukiet28032002', display_name: 'Vũ Tuấn Kiệt', avatar: '🐱', pet_type: 'cat', pet_name: 'Meowlish', pet_level: 2 },
    { id: 'opp_sinhvien', username: 'sinhvienuitk15', display_name: 'Sinh Viên UIT', avatar: '🦆', pet_type: 'karoo', pet_name: 'Karoo Vịt', pet_level: 3 },
    { id: 'opp_admin', username: 'admin', display_name: 'Quản Trị Viên', avatar: '🛡️', pet_type: 'corgi', pet_name: 'Corgi Dũng Cảm', pet_level: 4 },
  ];

  const opponentsPool = realOpponents.length >= 3 ? realOpponents : defaultOpponents;

  // Betting & Game State
  const [betCoins, setBetCoins] = useState<number>(100);
  const [raceState, setRaceState] = useState<'lobby' | 'countdown' | 'racing' | 'finished'>('lobby');
  const [countdown, setCountdown] = useState<number>(3);
  const [currentRank, setCurrentRank] = useState<number>(1);
  const [finalRankings, setFinalRankings] = useState<Racer[]>([]);

  // Rapid English Quiz State
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFeedbackShowing, setIsFeedbackShowing] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWidth = 840;
  const canvasHeight = 440;
  const trackDistance = 2400; // Finish line distance in virtual units
  const cameraXRef = useRef<number>(0);

  // Racers
  const racersRef = useRef<Racer[]>([]);
  const animFrameRef = useRef<number>(0);
  const rankCountRef = useRef<number>(1);

  // Initialize Racers
  const initRacers = () => {
    const opp1 = opponentsPool[0] || defaultOpponents[0];
    const opp2 = opponentsPool[1] || defaultOpponents[1];
    const opp3 = opponentsPool[2] || defaultOpponents[2];

    racersRef.current = [
      {
        id: 'player_racer',
        name: playerPetName,
        species: playerSpecies,
        ownerName: 'Bạn',
        x: 60,
        lane: 0,
        speed: 1.2,
        isPlayer: true,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
      {
        id: opp1.id,
        name: opp1.pet_name,
        species: opp1.pet_type,
        ownerName: opp1.display_name,
        x: 60,
        lane: 1,
        speed: 1.4 + (opp1.pet_level || 1) * 0.1,
        isPlayer: false,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
      {
        id: opp2.id,
        name: opp2.pet_name,
        species: opp2.pet_type,
        ownerName: opp2.display_name,
        x: 60,
        lane: 2,
        speed: 1.35 + (opp2.pet_level || 1) * 0.12,
        isPlayer: false,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
      {
        id: opp3.id,
        name: opp3.pet_name,
        species: opp3.pet_type,
        ownerName: opp3.display_name,
        x: 60,
        lane: 3,
        speed: 1.3 + (opp3.pet_level || 1) * 0.15,
        isPlayer: false,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
    ];
    rankCountRef.current = 1;
    cameraXRef.current = 0;
  };

  // Start Race
  const handleStartRace = () => {
    if (userCoins < betCoins) {
      sound.playError();
      return;
    }

    onUpdateCoins(userCoins - betCoins);
    initRacers();
    setFinalRankings([]);
    setRaceState('countdown');
    setCountdown(3);
    sound.playClick();

    // 3-2-1 Countdown
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        sound.playPop();
      } else {
        clearInterval(interval);
        setRaceState('racing');
        sound.playCelebration();
        loadNextQuestion();
      }
    }, 1000);
  };

  const loadNextQuestion = () => {
    const q = generateRacingQuestion();
    setCurrentQuestion(q);
    setSelectedOption(null);
    setIsFeedbackShowing(false);
    setIsAnswerCorrect(null);
  };

  // Handle Question Answer
  const handleChooseAnswer = (option: string) => {
    if (!currentQuestion || isFeedbackShowing) return;

    setSelectedOption(option);
    setIsFeedbackShowing(true);

    const isCorrect = option.trim().toLowerCase() === (currentQuestion.correctAnswer as string).trim().toLowerCase();
    setIsAnswerCorrect(isCorrect);

    const playerRacer = racersRef.current.find((r) => r.isPlayer);

    if (isCorrect) {
      sound.playCelebration();
      // BOOST: Thú cưng phóng vọt về phía trước 1 đoạn xa!
      if (playerRacer && !playerRacer.isFinished) {
        playerRacer.x += 160; // Advance one big chunk!
        playerRacer.boostTimer = 45; // Nitro flame effect
      }
    } else {
      sound.playError();
      // STUMBLE: Trả lời sai bị khựng lại!
      if (playerRacer && !playerRacer.isFinished) {
        playerRacer.isStunned = true;
        setTimeout(() => {
          if (playerRacer) playerRacer.isStunned = false;
        }, 1200);
      }
    }

    // Auto next question quickly for non-stop racing excitement
    setTimeout(() => {
      if (raceState === 'racing') {
        loadNextQuestion();
      }
    }, 800);
  };

  // Main 60 FPS Racing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      animFrameRef.current++;
      const frame = animFrameRef.current;

      if (raceState === 'racing') {
        // Update racers
        racersRef.current.forEach((racer) => {
          if (racer.isFinished) return;

          if (racer.boostTimer > 0) racer.boostTimer--;

          if (racer.isPlayer) {
            // Player base movement (crawls forward slowly, huge surges come from correct answers!)
            if (!racer.isStunned) {
              racer.x += racer.boostTimer > 0 ? 3.5 : 0.8;
            }
          } else {
            // Bot movement: periodic surges simulating answering
            const botSurge = Math.sin(frame * 0.05 + racer.lane) > 0.85 ? 2.5 : 0.9;
            racer.x += racer.speed * botSurge;
          }

          // Check Finish Line
          if (racer.x >= trackDistance && !racer.isFinished) {
            racer.isFinished = true;
            racer.finishRank = rankCountRef.current++;

            if (racer.isPlayer) {
              setCurrentRank(racer.finishRank);
              // If player finishes, complete race
              setTimeout(() => {
                setRaceState('finished');
                sound.playCelebration();
                confetti({ particleCount: 80, spread: 90 });

                // Claim reward if 1st place (x3.5 coins)
                if (racer.finishRank === 1) {
                  const rewardCoins = Math.round(betCoins * 3.5);
                  const rewardExp = 80;
                  onUpdateCoins(userCoins + rewardCoins);
                  if (onUpdatePetExp) onUpdatePetExp(rewardExp);

                  if (userId) {
                    fetch('/api/pet', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId,
                        action: 'claim_racing_reward',
                        rewardCoins,
                        rewardExp,
                      }),
                    }).catch(() => {});
                  }
                }
              }, 1000);
            }
          }
        });

        // Camera tracks player racer
        const playerRacer = racersRef.current.find((r) => r.isPlayer);
        if (playerRacer) {
          const targetCamX = Math.max(0, playerRacer.x - 200);
          cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;
        }
      }

      // --- RENDER 2D RACING TRACK CANVAS ---
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const camX = cameraXRef.current;

      // 1. Sky & Crowd Grandstand (Khán đài cổ vũ TeaMobi Avatar)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 110);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasWidth, 110);

      // Cheering Avatar Crowd on Grandstand
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 70, canvasWidth, 40);
      for (let cx = 10 - (camX % 30); cx < canvasWidth + 30; cx += 28) {
        ctx.font = '16px sans-serif';
        ctx.fillText('🐱', cx, 88);
        ctx.fillText('🐶', cx + 14, 88);
      }

      // 2. 4-Lane Racing Track (Đường đua cỏ & đất đỏ 4 làn)
      const trackStartY = 110;
      const laneHeight = 78;

      for (let l = 0; l < 4; l++) {
        const ly = trackStartY + l * laneHeight;
        // Lane background
        ctx.fillStyle = l % 2 === 0 ? '#15803d' : '#16a34a';
        ctx.fillRect(0, ly, canvasWidth, laneHeight);

        // White dashed lane boundary lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([20, 15]);
        ctx.lineDashOffset = camX % 35;
        ctx.beginPath();
        ctx.moveTo(0, ly + laneHeight);
        ctx.lineTo(canvasWidth, ly + laneHeight);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Lane Number Label on track
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`LÀN ${l + 1}`, 20, ly + 48);
      }

      // 3. FINISH LINE (Kẻ ô caro trắng đen)
      const finishScreenX = trackDistance - camX;
      if (finishScreenX >= -100 && finishScreenX <= canvasWidth + 100) {
        const checkerW = 16;
        for (let fy = trackStartY; fy < trackStartY + 4 * laneHeight; fy += checkerW) {
          for (let col = 0; col < 2; col++) {
            ctx.fillStyle = (Math.floor(fy / checkerW) + col) % 2 === 0 ? '#ffffff' : '#0f172a';
            ctx.fillRect(finishScreenX + col * checkerW, fy, checkerW, checkerW);
          }
        }
        // Finish Line Ribbon Banner
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(finishScreenX - 5, trackStartY - 25, 40, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('ĐÍCH', finishScreenX + 3, trackStartY - 9);
      }

      // 4. RENDER RACERS (Thú cưng 2D trên 4 làn)
      racersRef.current.forEach((racer) => {
        const rx = racer.x - camX;
        const ry = trackStartY + racer.lane * laneHeight + 42;
        const runHop = racer.isStunned ? 0 : Math.sin(frame * 0.3 + racer.lane) * 3;

        ctx.save();
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(rx, ry + 16, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nitro Boost Fire / Smoke
        if (racer.boostTimer > 0) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(rx - 25, ry + 6, 10 + Math.sin(frame * 0.5) * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(rx - 32, ry + 6, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Stumble Effect
        if (racer.isStunned) {
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('❓', rx, ry - 32);
        }

        // Pet Icon Body
        ctx.fillStyle = racer.isPlayer ? '#4f46e5' : '#475569';
        ctx.beginPath();
        ctx.arc(rx, ry + runHop, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = racer.isPlayer ? '#fbbf24' : '#94a3b8';
        ctx.lineWidth = racer.isPlayer ? 3 : 1.5;
        ctx.stroke();

        // Pet Emoji
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        const emoji =
          racer.species === 'cat'
            ? '🐱'
            : racer.species === 'corgi'
            ? '🐶'
            : racer.species === 'ice_dragon'
            ? '🐉'
            : racer.species === 'karoo'
            ? '🦆'
            : '🦉';
        ctx.fillText(emoji, rx, ry + 8 + runHop);

        // Name & Owner Badge
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`${racer.name}`, rx, ry - 22 + runHop);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px sans-serif';
        ctx.fillText(`(${racer.ownerName})`, rx, ry - 11 + runHop);

        // Finish Tag if finished
        if (racer.isFinished && racer.finishRank) {
          ctx.fillStyle = racer.finishRank === 1 ? '#eab308' : '#64748b';
          ctx.fillRect(rx - 22, ry + 20, 44, 15);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`HẠNG ${racer.finishRank}`, rx, ry + 31);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [raceState, betCoins, userCoins]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Header / Bet Bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-500/40 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏁</span>
          <div>
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              Trường Đua Thú Cưng Tiếng Anh TeaMobi
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded-full font-bold">
                Tốc Độ Siêu Tốc
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Trả lời đúng 1 câu = thú cưng bứt tốc chạy thêm 1 khúc! Về Nhất nhận x3.5 tiền cược!
            </p>
          </div>
        </div>

        {/* Bet Selector */}
        {raceState === 'lobby' && (
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-xs font-bold text-amber-300">Mức Cược:</span>
            {[50, 100, 200, 500].map((amount) => (
              <button
                key={amount}
                onClick={() => setBetCoins(amount)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  betCoins === amount
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {amount}🪙
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main 2D Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 flex justify-center items-center select-none">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="max-w-full h-auto object-contain block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* LOBBY MODAL */}
        {raceState === 'lobby' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-5xl mb-2">🏁</div>
            <h2 className="text-xl font-black text-amber-300 mb-1">
              ĐẤU TRƯỜNG TỐC ĐỘ 4 LÀN: CƯỢC {betCoins} COINS
            </h2>
            <p className="text-xs text-slate-300 max-w-md mb-4">
              Cạnh tranh cùng 3 thú cưng của người chơi thật trong cộng đồng. Trả lời từ vựng tiếng Anh chính xác để kích hoạt Nitro tăng tốc thần sầu!
            </p>
            <button
              onClick={handleStartRace}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-5 h-5 text-amber-300" />
              <span>Sẵn Sàng Xuất Phát!</span>
            </button>
          </div>
        )}

        {/* COUNTDOWN OVERLAY */}
        {raceState === 'countdown' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
            <span className="text-7xl font-black text-amber-300 animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {/* FINISHED RESULTS MODAL */}
        {raceState === 'finished' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-6xl mb-2">{currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : '🥉'}</div>
            <h2 className="text-2xl font-black text-amber-300 mb-1">
              {currentRank === 1 ? 'VÔ ĐỊCH ĐƯỜNG ĐUA!' : `VỀ ĐÍCH HẠNG ${currentRank}!`}
            </h2>
            <p className="text-xs text-slate-200 mb-4">
              {currentRank === 1
                ? `Thú cưng ${playerPetName} đã chiến thắng áp đảo! Bạn nhận được thưởng x3.5 cược!`
                : 'Đã nỗ lực hết mình! Hãy trau dồi thêm phản xạ từ vựng để giành cúp vàng lần tới!'}
            </p>
            {currentRank === 1 && (
              <div className="flex items-center gap-3 bg-amber-500/20 px-4 py-2 rounded-xl mb-4 text-xs font-bold text-amber-300 border border-amber-400/40">
                <span>+{Math.round(betCoins * 3.5)} Coins 🪙</span>
                <span>+80 EXP ⭐</span>
              </div>
            )}
            <button
              onClick={() => setRaceState('lobby')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Trở Về Bãi Đua
            </button>
          </div>
        )}
      </div>

      {/* RAPID QUIZ INTERACTION PANEL (Bottom) */}
      {raceState === 'racing' && currentQuestion && (
        <div className="p-4 bg-slate-900 border-2 border-blue-600/50 rounded-2xl flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
              Bứt Tốc Anh Ngữ: {currentQuestion.prompt}
            </span>
            <span className="text-xs font-bold text-amber-300">
              {currentQuestion.subPrompt}
            </span>
          </div>

          {/* 4 Choices */}
          {currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentQuestion.options.map((opt, idx) => {
                let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700';

                if (isFeedbackShowing) {
                  if (opt === currentQuestion.correctAnswer) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300';
                  } else if (opt === selectedOption && !isAnswerCorrect) {
                    btnStyle = 'bg-red-600 text-white border-red-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isFeedbackShowing}
                    onClick={() => handleChooseAnswer(opt)}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isFeedbackShowing && opt === currentQuestion.correctAnswer && (
                      <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                    )}
                    {isFeedbackShowing && opt === selectedOption && !isAnswerCorrect && (
                      <XCircle className="w-4 h-4 text-red-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generatePvPQuestion, QuizQuestion } from '@/lib/petQuizData';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Swords, Shield, Heart, Zap, Sparkles, Trophy, RotateCcw, Flame, CheckCircle, XCircle } from 'lucide-react';
import { drawChibiPet } from './drawChibiPet';

export interface OpponentData {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  user_level?: number;
  pet_type: string;
  pet_name: string;
  pet_level?: number;
}

export interface PetPvPArenaCanvasProps {
  playerSpecies: string;
  playerPetName: string;
  playerLevel?: number;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onUpdatePetExp?: (addedExp: number) => void;
  userId?: string;
  realOpponents?: OpponentData[];
}

interface CombatFloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  size: number;
}

export default function PetPvPArenaCanvas({
  playerSpecies = 'owl',
  playerPetName = 'Lexi Trí Tuệ',
  playerLevel = 1,
  userCoins,
  onUpdateCoins,
  onUpdatePetExp,
  userId,
  realOpponents = [],
}: PetPvPArenaCanvasProps) {
  // Opponent pool: use real players from DB
  const defaultOpponents: OpponentData[] = [
    {
      id: 'opp_vukiet',
      username: 'vukiet28032002',
      display_name: 'Vũ Tuấn Kiệt',
      avatar: '🐱',
      user_level: 2,
      pet_type: 'cat',
      pet_name: 'Meowlish Bá Đạo',
      pet_level: 2,
    },
    {
      id: 'opp_sinhvien',
      username: 'sinhvienuitk15',
      display_name: 'Sinh Viên UIT',
      avatar: '🦆',
      user_level: 3,
      pet_type: 'karoo',
      pet_name: 'Karoo Tốc Độ',
      pet_level: 3,
    },
    {
      id: 'opp_admin',
      username: 'admin',
      display_name: 'Quản Trị Viên (Admin)',
      avatar: '🛡️',
      user_level: 5,
      pet_type: 'ice_dragon',
      pet_name: 'Rồng Băng Cực Bắc',
      pet_level: 5,
    },
  ];

  const opponentsPool = realOpponents.length > 0 ? realOpponents : defaultOpponents;
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentData>(opponentsPool[0]);

  // Battle State
  const [gameState, setGameState] = useState<'lobby' | 'battle' | 'victory' | 'defeat'>('lobby');
  const [roundNumber, setRoundNumber] = useState<number>(1);

  // Health & Mana (Calculated based on level)
  const playerMaxHp = 1000 + playerLevel * 100;
  const rivalMaxHp = 1000 + (selectedOpponent.pet_level || 1) * 100;

  const [playerHp, setPlayerHp] = useState<number>(playerMaxHp);
  const [rivalHp, setRivalHp] = useState<number>(rivalMaxHp);

  // Status Effects
  // Choáng (Stun): boolean
  const [rivalStunned, setRivalStunned] = useState<boolean>(false);
  const [playerStunned, setPlayerStunned] = useState<boolean>(false);
  // Trúng độc (Poison stacks): each stack -5% maxHp per turn for 3 turns
  const [rivalPoisonStacks, setRivalPoisonStacks] = useState<{ turnsLeft: number; stacks: number }>({ turnsLeft: 0, stacks: 0 });
  const [playerPoisonStacks, setPlayerPoisonStacks] = useState<{ turnsLeft: number; stacks: number }>({ turnsLeft: 0, stacks: 0 });

  // Quiz State
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [unscrambleSelected, setUnscrambleSelected] = useState<string[]>([]);
  const [unscramblePool, setUnscramblePool] = useState<string[]>([]);
  const [effectProcMessage, setEffectProcMessage] = useState<string | null>(null);

  // 2D Canvas References & Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWidth = 800;
  const canvasHeight = 400;

  const animFrameRef = useRef<number>(0);
  const playerXOffset = useRef<number>(0);
  const rivalXOffset = useRef<number>(0);
  const screenShakeOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const floatingTextsRef = useRef<CombatFloatingText[]>([]);
  const projectileFxRef = useRef<{ active: boolean; x: number; y: number; targetX: number; targetY: number; color: string } | null>(null);

  const addCombatText = (text: string, x: number, y: number, color = '#facc15', size = 18) => {
    floatingTextsRef.current.push({
      id: `ct-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      alpha: 1.0,
      size,
    });
  };

  const triggerScreenShake = (intensity = 8) => {
    let shakes = 10;
    const interval = setInterval(() => {
      if (shakes <= 0) {
        screenShakeOffset.current = { x: 0, y: 0 };
        clearInterval(interval);
      } else {
        screenShakeOffset.current = {
          x: (Math.random() - 0.5) * intensity,
          y: (Math.random() - 0.5) * intensity,
        };
        shakes--;
      }
    }, 25);
  };

  // Start Battle
  const handleStartBattle = () => {
    sound.playClick();
    setPlayerHp(playerMaxHp);
    setRivalHp(rivalMaxHp);
    setRivalStunned(false);
    setPlayerStunned(false);
    setRivalPoisonStacks({ turnsLeft: 0, stacks: 0 });
    setPlayerPoisonStacks({ turnsLeft: 0, stacks: 0 });
    setRoundNumber(1);
    setGameState('battle');
    loadNextQuestion();
  };

  const loadNextQuestion = () => {
    const q = generatePvPQuestion();
    setCurrentQuestion(q);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsAnswerCorrect(null);
    setEffectProcMessage(null);
    if (q.type === 'unscramble' && q.scrambledTokens) {
      setUnscrambleSelected([]);
      setUnscramblePool([...q.scrambledTokens]);
    }
  };

  // Handle Answer Submission
  const handleAnswerSubmit = (chosenAnswer?: string) => {
    if (!currentQuestion || isAnswerChecked) return;

    let isCorrect = false;

    if (currentQuestion.type === 'unscramble') {
      const correctArr = currentQuestion.correctAnswer as string[];
      isCorrect =
        unscrambleSelected.length === correctArr.length &&
        unscrambleSelected.every((w, idx) => w.toLowerCase() === correctArr[idx].toLowerCase());
    } else {
      const ans = chosenAnswer || selectedAnswer;
      if (!ans) return;
      isCorrect = ans.trim().toLowerCase() === (currentQuestion.correctAnswer as string).trim().toLowerCase();
    }

    setIsAnswerChecked(true);
    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      sound.playCelebration();
      // PLAYER ATTACKS RIVAL!
      // Dash animation forward
      playerXOffset.current = 60;
      setTimeout(() => (playerXOffset.current = 0), 300);

      // Launch projectile to rival
      projectileFxRef.current = {
        active: true,
        x: 240,
        y: 250,
        targetX: 560,
        targetY: 250,
        color: '#38bdf8',
      };

      // Base Damage: 220 + level * 25
      let damage = Math.round(220 + playerLevel * 25);
      let procText = '';

      // Random Proc Check according to prompt rules:
      // 1. Bạo kích x2 (25% chance)
      // 2. Choáng (20% chance)
      // 3. Hồi phục 10% hoặc 20% máu (20% chance)
      // 4. Trúng độc: 5% mỗi hiệp duy trì 3 hiệp có thể cộng dồn (25% chance)
      const roll = Math.random();

      if (roll < 0.25) {
        // BẠO KÍCH X2!
        damage *= 2;
        procText = '💥 BẠO KÍCH X2! SÁT THƯƠNG ĐÔI!';
        triggerScreenShake(14);
        addCombatText(`CRITICAL! -${damage} HP!`, 560, 200, '#fbbf24', 24);
      } else if (roll < 0.45) {
        // CHOÁNG ĐỐI THỦ!
        setRivalStunned(true);
        procText = '💫 GÂY CHOÁNG! Đối thủ bị choáng không thể phản công!';
        triggerScreenShake(8);
        addCombatText(`CHOÁNG! -${damage} HP`, 560, 200, '#38bdf8', 20);
      } else if (roll < 0.65) {
        // HỒI PHỤC 10% HOẶC 20% MÁU!
        const healPercent = Math.random() > 0.5 ? 0.2 : 0.1;
        const healAmount = Math.round(playerMaxHp * healPercent);
        setPlayerHp((prev) => Math.min(playerMaxHp, prev + healAmount));
        procText = `💚 HỒI PHỤC! Hồi +${Math.round(healPercent * 100)}% Máu (+${healAmount} HP)!`;
        triggerScreenShake(6);
        addCombatText(`-${damage} HP`, 560, 200, '#ef4444', 18);
        addCombatText(`+${healAmount} HP 💚`, 220, 200, '#22c55e', 20);
      } else if (roll < 0.90) {
        // TRÚNG ĐỘC: -5% MÁU MỖI HIỆP DUY TRÌ 3 HIỆP CỘNG DỒN!
        setRivalPoisonStacks((prev) => ({
          stacks: prev.stacks + 1,
          turnsLeft: 3,
        }));
        procText = '🧪 ĐẦM ĐỘC! Đối thủ trúng độc (-5% HP/hiệp trong 3 hiệp, cộng dồn)!';
        triggerScreenShake(8);
        addCombatText(`NHIỄM ĐỘC! -${damage} HP`, 560, 200, '#a855f7', 20);
      } else {
        // Normal Hit
        triggerScreenShake(6);
        addCombatText(`-${damage} HP`, 560, 200, '#ef4444', 18);
      }

      setEffectProcMessage(procText);

      // Apply damage to rival
      setTimeout(() => {
        const nextRivalHp = Math.max(0, rivalHp - damage);
        setRivalHp(nextRivalHp);

        if (nextRivalHp <= 0) {
          // VICTORY!
          handleVictory();
          return;
        }

        // Apply Poison ticks on Rival if any
        if (rivalPoisonStacks.stacks > 0) {
          const poisonDmg = Math.round(rivalMaxHp * 0.05 * rivalPoisonStacks.stacks);
          setRivalHp((cur) => Math.max(0, cur - poisonDmg));
          addCombatText(`☠️ Độc: -${poisonDmg} HP`, 560, 230, '#c084fc', 16);
          setRivalPoisonStacks((cur) => ({
            stacks: cur.turnsLeft > 1 ? cur.stacks : 0,
            turnsLeft: Math.max(0, cur.turnsLeft - 1),
          }));
        }

        // RIVAL'S TURN TO ATTACK (If not stunned!)
        setTimeout(() => {
          if (rivalStunned) {
            addCombatText('💫 ĐỐI THỦ BỊ CHOÁNG! BỎ LƯỢT!', 560, 180, '#38bdf8', 18);
            setRivalStunned(false); // remove stun after skipped turn
            setTimeout(loadNextQuestion, 1500);
          } else {
            // Rival strikes back
            rivalXOffset.current = -60;
            setTimeout(() => (rivalXOffset.current = 0), 300);

            // Rival damage
            const rivalDmg = Math.round(180 + (selectedOpponent.pet_level || 1) * 20);
            triggerScreenShake(7);
            sound.playHit();
            addCombatText(`-${rivalDmg} HP`, 220, 200, '#ef4444', 18);

            setPlayerHp((curPlayerHp) => {
              const nextPlayerHp = Math.max(0, curPlayerHp - rivalDmg);
              if (nextPlayerHp <= 0) {
                setTimeout(handleDefeat, 600);
              } else {
                setTimeout(loadNextQuestion, 1500);
              }
              return nextPlayerHp;
            });
          }
        }, 1200);
      }, 400);
    } else {
      // INCORRECT ANSWER: Player misses, Rival gets a free counter-attack!
      sound.playError();
      addCombatText('MISS! Sai rồi!', 220, 200, '#94a3b8', 18);
      setEffectProcMessage('❌ Trả lời chưa chính xác! Đối thủ chớp thời cơ phản công!');

      setTimeout(() => {
        rivalXOffset.current = -60;
        setTimeout(() => (rivalXOffset.current = 0), 300);

        const counterDmg = Math.round(200 + (selectedOpponent.pet_level || 1) * 25);
        triggerScreenShake(9);
        sound.playHit();
        addCombatText(`PHẢN CÔNG! -${counterDmg} HP`, 220, 200, '#ef4444', 20);

        setPlayerHp((cur) => {
          const next = Math.max(0, cur - counterDmg);
          if (next <= 0) {
            setTimeout(handleDefeat, 600);
          } else {
            setTimeout(loadNextQuestion, 2000);
          }
          return next;
        });
      }, 800);
    }

    setRoundNumber((r) => r + 1);
  };

  // VICTORY HANDLER
  const handleVictory = () => {
    setGameState('victory');
    sound.playCelebration();
    confetti({ particleCount: 70, spread: 80 });

    const rewardCoins = 150 + playerLevel * 30;
    const rewardExp = 50 + playerLevel * 10;
    onUpdateCoins(userCoins + rewardCoins);
    if (onUpdatePetExp) onUpdatePetExp(rewardExp);

    // Call API to persist PvP victory
    if (userId) {
      fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'claim_pvp_reward',
          rewardCoins,
          rewardExp,
        }),
      }).catch(() => {});
    }
  };

  // DEFEAT HANDLER
  const handleDefeat = () => {
    setGameState('defeat');
    sound.playError();
  };

  // 2D CANVAS DRAW LOOP (RETINA HD)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);

    let animId: number;

    const render = () => {
      animFrameRef.current++;
      const frame = animFrameRef.current;

      // Update floating texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 0.8;
        ft.alpha -= 0.015;
        if (ft.alpha <= 0) floatingTextsRef.current.splice(i, 1);
      }

      // Update projectile
      if (projectileFxRef.current && projectileFxRef.current.active) {
        const p = projectileFxRef.current;
        p.x += 18;
        if (p.x >= p.targetX) {
          p.active = false;
        }
      }

      // Retina coordinate transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply screen shake
      ctx.save();
      ctx.translate(screenShakeOffset.current.x, screenShakeOffset.current.y);

      // --- 1. ARENA BACKGROUND (Meowlish Colosseum / Thảo Nguyên Đấu Trường) ---
      // Sunset Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight * 0.7);
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.4, '#4c0519');
      skyGrad.addColorStop(0.7, '#881337');
      skyGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Distant stone pillars & Colosseum arches
      ctx.fillStyle = '#1c1917';
      for (let arch = 30; arch < canvasWidth; arch += 95) {
        ctx.fillRect(arch, 110, 18, 120);
        ctx.beginPath();
        ctx.arc(arch + 9, 110, 9, Math.PI, 0);
        ctx.fill();
      }

      // Stone Arena Floor (Đấu trường đá Meowlish)
      const floorGrad = ctx.createLinearGradient(0, 210, 0, canvasHeight);
      floorGrad.addColorStop(0, '#57534e');
      floorGrad.addColorStop(0.5, '#44403c');
      floorGrad.addColorStop(1, '#1c1917');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 210, canvasWidth, canvasHeight - 210);

      // Floor stone tiles
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1.5;
      for (let tx = 0; tx < canvasWidth; tx += 65) {
        ctx.beginPath();
        ctx.moveTo(tx, 210);
        ctx.lineTo(tx - 35, canvasHeight);
        ctx.stroke();
      }
      for (let ty = 240; ty < canvasHeight; ty += 45) {
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(canvasWidth, ty);
        ctx.stroke();
      }

      // Center Arena Magic Crest (Vòng ma pháp triệu hồi)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(canvasWidth * 0.5, 310, 110, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fill();

      // Burning Torches on Left & Right Pillars
      drawTorch(ctx, 65, 160, frame);
      drawTorch(ctx, canvasWidth - 85, 160, frame);

      // --- 2. RENDER PLAYER CHIBI PET (Left Fighter) ---
      const pBaseX = 220 + playerXOffset.current;
      const pBaseY = 305;
      const pHop = Math.sin(frame * 0.12) * 3;

      ctx.save();
      // Render Player Chibi Vector Sprite
      drawChibiPet({
        ctx,
        x: pBaseX,
        y: pBaseY - 10 + pHop,
        scale: 1.35,
        species: playerSpecies,
        state: playerStunned ? 'stunned' : playerXOffset.current > 10 ? 'attack' : 'idle',
        frame,
        direction: 1,
      });

      // Player Name & Level Badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`${playerPetName} (Lv.${playerLevel})`, pBaseX, pBaseY - 60 + pHop);

      // Player HP Bar on Canvas
      const pHpWidth = 96;
      const pCurHpWidth = Math.max(0, (playerHp / playerMaxHp) * pHpWidth);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(pBaseX - 48, pBaseY - 76 + pHop, pHpWidth, 8);
      ctx.fillStyle = playerHp / playerMaxHp > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(pBaseX - 48, pBaseY - 76 + pHop, pCurHpWidth, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(pBaseX - 48, pBaseY - 76 + pHop, pHpWidth, 8);
      ctx.restore();

      // --- 3. RENDER RIVAL CHIBI PET (Right Fighter) ---
      const rBaseX = 580 + rivalXOffset.current;
      const rBaseY = 305;
      const rHop = Math.sin(frame * 0.12 + 1) * 3;

      ctx.save();
      // Render Rival Chibi Vector Sprite
      drawChibiPet({
        ctx,
        x: rBaseX,
        y: rBaseY - 10 + rHop,
        scale: 1.35,
        species: selectedOpponent.pet_type,
        state: rivalStunned ? 'stunned' : rivalXOffset.current < -10 ? 'attack' : 'idle',
        frame,
        direction: -1,
      });

      // Rival Stunned Visual FX (Spinning Stars)
      if (rivalStunned) {
        const starRot = frame * 0.15;
        ctx.fillStyle = '#facc15';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💫', rBaseX + Math.cos(starRot) * 22, rBaseY - 55 + Math.sin(starRot) * 8);
        ctx.fillText('⭐', rBaseX + Math.cos(starRot + Math.PI) * 22, rBaseY - 55 + Math.sin(starRot + Math.PI) * 8);
      }

      // Rival Poison Visual FX (Bubbles)
      if (rivalPoisonStacks.stacks > 0) {
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`☠️ Độc x${rivalPoisonStacks.stacks}`, rBaseX, rBaseY - 86 + rHop);
      }

      // Rival Name & Level Badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(
        `${selectedOpponent.pet_name} (Lv.${selectedOpponent.pet_level || 1})`,
        rBaseX,
        rBaseY - 60 + rHop
      );

      // Rival HP Bar on Canvas
      const rHpWidth = 96;
      const rCurHpWidth = Math.max(0, (rivalHp / rivalMaxHp) * rHpWidth);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(rBaseX - 48, rBaseY - 76 + rHop, rHpWidth, 8);
      ctx.fillStyle = rivalHp / rivalMaxHp > 0.4 ? '#ef4444' : '#b91c1c';
      ctx.fillRect(rBaseX - 48, rBaseY - 76 + rHop, rCurHpWidth, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(rBaseX - 48, rBaseY - 76 + rHop, rHpWidth, 8);
      ctx.restore();

      // --- 4. RENDER PROJECTILE FX ---
      if (projectileFxRef.current && projectileFxRef.current.active) {
        const p = projectileFxRef.current;
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- 5. RENDER FLOATING TEXTS ---
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore(); // restore screen shake

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [playerHp, rivalHp, rivalStunned, rivalPoisonStacks, selectedOpponent, playerSpecies, playerLevel]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Header / Mode Switcher */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-red-900 via-rose-950 to-slate-900 border border-red-500/40 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <div>
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              Đấu Trường PvP Tiếng Anh Meowlish
              <span className="text-[10px] px-2 py-0.5 bg-red-500/30 text-red-200 rounded-full font-bold">
                Quyết Đấu Trí Tuệ
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Trả lời câu hỏi tiếng Anh để ra đòn! Tỷ lệ bạo kích x2, gây choáng, hồi phục & đầm độc!
            </p>
          </div>
        </div>

        {/* Rival Selector (Real DB Users) */}
        {gameState === 'lobby' && (
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10">
            <span className="text-xs text-slate-300 font-bold ml-1">Chọn Đối Thủ:</span>
            <select
              value={selectedOpponent.id}
              onChange={(e) => {
                const found = opponentsPool.find((o) => o.id === e.target.value);
                if (found) setSelectedOpponent(found);
              }}
              className="bg-slate-800 text-amber-300 text-xs font-bold px-2 py-1 rounded-lg border border-slate-600 focus:outline-hidden"
            >
              {opponentsPool.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.display_name} ({opp.pet_name} Lv.{opp.pet_level || 1})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main 2D Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 flex justify-center items-center select-none">
        <canvas
          ref={canvasRef}
          className="w-full max-w-[800px] h-auto object-contain block touch-none"
        />

        {/* LOBBY OVERLAY */}
        {gameState === 'lobby' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-4xl mb-2">⚔️</div>
            <h2 className="text-xl font-black text-amber-300 mb-1">
              THÁCH ĐẤU THÚ CƯNG: {selectedOpponent.display_name}
            </h2>
            <p className="text-xs text-slate-300 max-w-md mb-4">
              Đối đầu trực tiếp với thú cưng {selectedOpponent.pet_name} (Lv.{selectedOpponent.pet_level || 1}) của{' '}
              {selectedOpponent.display_name}. Mỗi câu trả lời đúng sẽ giải phóng sát thương phép thuật đánh bại đối thủ!
            </p>
            <button
              onClick={handleStartBattle}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <Swords className="w-5 h-5" />
              <span>Vào Trận Quyết Đấu Ngay!</span>
            </button>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-2xl font-black text-amber-300 mb-1">CHIẾN THẮNG HUY HOÀNG!</h2>
            <p className="text-xs text-slate-200 mb-3">
              Thú cưng {playerPetName} đã xuất sắc hạ gục đối thủ bằng trí tuệ Anh ngữ sắc bén!
            </p>
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl mb-4 text-xs font-bold text-amber-300 border border-amber-400/30">
              <span>+{150 + playerLevel * 30} Coins 🪙</span>
              <span>+{50 + playerLevel * 10} EXP ⭐</span>
            </div>
            <button
              onClick={() => setGameState('lobby')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Tiếp Tục Khiêu Chiến
            </button>
          </div>
        )}

        {/* DEFEAT OVERLAY */}
        {gameState === 'defeat' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-5xl mb-2">💀</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">THẤT BẠI TRONG TRẬN CHIẾN</h2>
            <p className="text-xs text-slate-300 mb-4 max-w-sm">
              Linh vật đã kiệt sức trước đòn phản công! Hãy rèn luyện thêm từ vựng để phục thù!
            </p>
            <button
              onClick={() => setGameState('lobby')}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Rút Về Luyện Tập
            </button>
          </div>
        )}
      </div>

      {/* QUIZ INTERACTION PANEL (Bottom) */}
      {gameState === 'battle' && currentQuestion && (
        <div className="p-4 bg-slate-900 border-2 border-slate-700 rounded-2xl flex flex-col gap-3 shadow-xl">
          {/* Header of Round */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Hiệp {roundNumber}: {currentQuestion.prompt}
              </span>
            </div>
            {effectProcMessage && (
              <span className="text-xs font-black text-emerald-400 animate-pulse">
                {effectProcMessage}
              </span>
            )}
          </div>

          {/* Sub Prompt / Vocabulary keyword */}
          {currentQuestion.subPrompt && (
            <div className="p-3 bg-slate-800/80 rounded-xl text-center border border-slate-700/60">
              <span className="text-base sm:text-lg font-black text-amber-300">
                {currentQuestion.subPrompt}
              </span>
              {currentQuestion.ipa && (
                <span className="text-xs text-slate-400 ml-2 font-mono">{currentQuestion.ipa}</span>
              )}
            </div>
          )}

          {/* TYPE 1 & 2: MULTIPLE CHOICE OPTIONS */}
          {currentQuestion.options && currentQuestion.type !== 'unscramble' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentQuestion.options.map((opt, idx) => {
                let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700';

                if (isAnswerChecked) {
                  if (opt === currentQuestion.correctAnswer) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300';
                  } else if (opt === selectedAnswer && !isAnswerCorrect) {
                    btnStyle = 'bg-red-600 text-white border-red-400';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => {
                      setSelectedAnswer(opt);
                      handleAnswerSubmit(opt);
                    }}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerChecked && opt === currentQuestion.correctAnswer && (
                      <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                    )}
                    {isAnswerChecked && opt === selectedAnswer && !isAnswerCorrect && (
                      <XCircle className="w-4 h-4 text-red-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TYPE 3: SENTENCE UNSCRAMBLE */}
          {currentQuestion.type === 'unscramble' && (
            <div className="flex flex-col gap-3">
              {/* Selected Words Drop Area */}
              <div className="min-h-12 p-2.5 bg-slate-950/70 border-2 border-dashed border-amber-500/40 rounded-xl flex items-center flex-wrap gap-1.5">
                {unscrambleSelected.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Chạm vào các từ bên dưới để ghép thành câu hoàn chỉnh...
                  </span>
                ) : (
                  unscrambleSelected.map((word, wIdx) => (
                    <button
                      key={wIdx}
                      disabled={isAnswerChecked}
                      onClick={() => {
                        // Return word to pool
                        setUnscrambleSelected((prev) => prev.filter((_, i) => i !== wIdx));
                        setUnscramblePool((prev) => [...prev, word]);
                      }}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black shadow-xs hover:bg-amber-400 transition cursor-pointer"
                    >
                      {word} ✕
                    </button>
                  ))
                )}
              </div>

              {/* Scrambled Word Bank */}
              <div className="flex items-center flex-wrap gap-1.5">
                {unscramblePool.map((word, pIdx) => (
                  <button
                    key={pIdx}
                    disabled={isAnswerChecked}
                    onClick={() => {
                      setUnscrambleSelected((prev) => [...prev, word]);
                      setUnscramblePool((prev) => prev.filter((_, i) => i !== pIdx));
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>

              {/* Submit Sentence Button */}
              {!isAnswerChecked && unscrambleSelected.length > 0 && (
                <button
                  onClick={() => handleAnswerSubmit()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Xác Nhận Xếp Câu & Xuất Chiêu!</span>
                </button>
              )}
            </div>
          )}

          {/* Explanation Banner */}
          {isAnswerChecked && (
            <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 text-xs text-slate-200 whitespace-pre-line">
              {currentQuestion.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Helper: Draw Flaming Colosseum Torch
 */
function drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Wooden sconce bracket
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 3, y, 6, 22);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(x - 6, y - 4, 12, 6);

  // Flame glow
  const flicker = Math.sin(frame * 0.3) * 2;
  const flameGrad = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, 16);
  flameGrad.addColorStop(0, '#fef08a');
  flameGrad.addColorStop(0.4, '#f97316');
  flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.arc(x, y - 10, 16 + flicker, 0, Math.PI * 2);
  ctx.fill();

  // Core fire tear
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 6);
  ctx.quadraticCurveTo(x - 6, y - 16 - flicker, x, y - 22 - flicker);
  ctx.quadraticCurveTo(x + 6, y - 16 - flicker, x + 4, y - 6);
  ctx.closePath();
  ctx.fill();
}

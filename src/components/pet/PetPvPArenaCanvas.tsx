'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generatePvPQuestion, QuizQuestion } from '@/lib/petQuizData';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { 
  Swords, Shield, Heart, Zap, Sparkles, Trophy, RotateCcw, 
  Flame, CheckCircle, XCircle, Plus, Users, Clock, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { drawChibiPet } from './drawChibiPet';

export interface OpponentData {
  id: string;
  username: string;
  display_name: string;
  avatar?: string;
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
  userDisplayName?: string;
  activeRooms?: any[];
  acceptedFriends?: any[];
  onRefreshData?: () => void;
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
  userDisplayName = 'Bạn',
  activeRooms = [],
  acceptedFriends = [],
  onRefreshData,
}: PetPvPArenaCanvasProps) {
  // Battle State: 'lobby' | 'waiting_guest' | 'battle' | 'victory' | 'defeat'
  const [gameState, setGameState] = useState<'lobby' | 'waiting_guest' | 'battle' | 'victory' | 'defeat'>('lobby');
  const [roundNumber, setRoundNumber] = useState<number>(1);

  // Current active room / matchup
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentData | null>(null);

  // Modal / Form state for room creation
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>(`${userDisplayName} Thách Đấu`);
  const [newRoomBet, setNewRoomBet] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Health & Mana (Calculated based on level)
  const playerMaxHp = 1000 + playerLevel * 100;
  const rivalMaxHp = 1000 + (selectedOpponent?.pet_level || 1) * 100;

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

  // Filter PVP rooms
  const pvpRooms = activeRooms.filter((r) => r.game_type === 'pvp' && r.status === 'waiting');

  // Lắng nghe / Polling phòng khi đang ở trạng thái 'waiting_guest'
  useEffect(() => {
    if (gameState !== 'waiting_guest' || !currentRoom?.id || !userId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pet?userId=${userId}&roomId=${currentRoom.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.roomDetail) {
            if (data.roomDetail.status === 'in_progress' && data.roomDetail.guest_id) {
              // Real guest has joined! Start match immediately!
              const guestOpponent: OpponentData = {
                id: data.roomDetail.guest_id,
                username: data.roomDetail.guest_name,
                display_name: data.roomDetail.guest_name,
                pet_type: data.roomDetail.guest_pet_type || 'cat',
                pet_name: data.roomDetail.guest_pet_type === 'owl' ? 'Lexi' : data.roomDetail.guest_pet_type === 'cat' ? 'Meowlish' : 'Linh Vật',
                pet_level: data.roomDetail.guest_pet_level || 1,
              };
              setCurrentRoom(data.roomDetail);
              startBattleWithOpponent(guestOpponent, data.roomDetail);
            }
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [gameState, currentRoom, userId]);

  // Handle Create Battle Room
  const handleCreateRoom = async () => {
    if (!userId) {
      alert('Vui lòng đăng nhập để tạo phòng quyết đấu!');
      return;
    }
    if (userCoins < newRoomBet) {
      alert(`Bạn không đủ Coins (${userCoins} xu) để tạo phòng cược ${newRoomBet} xu!`);
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'create_battle_room',
          roomName: newRoomName || `${userDisplayName} Thách Đấu`,
          gameType: 'pvp',
          betCoins: newRoomBet,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo phòng');

      if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);
      setCurrentRoom(data.room);
      setShowCreateModal(false);
      setGameState('waiting_guest');
      sound.playSuccess();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionError(err.message);
      sound.playWrong();
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Join Battle Room
  const handleJoinRoom = async (room: any) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để vào phòng quyết đấu!');
      return;
    }
    if (userCoins < room.bet_coins) {
      alert(`Bạn không đủ Coins (${userCoins} xu) để vào phòng cược ${room.bet_coins} xu!`);
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'join_battle_room',
          roomId: room.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi vào phòng');

      if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);

      // Real host opponent
      const hostOpponent: OpponentData = {
        id: room.host_id,
        username: room.host_name,
        display_name: room.host_name,
        pet_type: room.host_pet_type || 'owl',
        pet_name: room.host_pet_type === 'owl' ? 'Lexi' : room.host_pet_type === 'cat' ? 'Meowlish' : 'Linh Vật',
        pet_level: room.host_pet_level || 1,
      };

      setCurrentRoom(data.room || room);
      sound.playCelebration();
      startBattleWithOpponent(hostOpponent, data.room || room);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionError(err.message);
      sound.playWrong();
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancel Battle Room
  const handleCancelRoom = async () => {
    if (!currentRoom?.id || !userId) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'cancel_battle_room',
          roomId: currentRoom.id,
        }),
      });
      const data = await res.json();
      if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);
      setCurrentRoom(null);
      setGameState('lobby');
      sound.playClick();
      if (onRefreshData) onRefreshData();
    } catch {}
    finally {
      setIsProcessing(false);
    }
  };

  // Handle Challenge Friend
  const handleChallengeFriend = async (friend: any) => {
    if (!userId) return;
    const friendBet = 100;
    if (userCoins < friendBet) {
      alert(`Bạn cần ít nhất ${friendBet} xu để thách đấu bạn bè!`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'create_battle_room',
          roomName: `Thách Đấu Cùng ${friend.display_name}`,
          gameType: 'pvp',
          betCoins: friendBet,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.userCoins !== undefined) onUpdateCoins(data.userCoins);

      // Setup opponent from friend
      const friendOpponent: OpponentData = {
        id: friend.friend_id || friend.id,
        username: friend.username || friend.display_name,
        display_name: friend.display_name,
        pet_type: friend.pet_type || 'cat',
        pet_name: friend.pet_name || 'Linh Vật',
        pet_level: friend.pet_level || friend.level || 1,
      };

      setCurrentRoom(data.room);
      sound.playCelebration();
      startBattleWithOpponent(friendOpponent, data.room);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Không thể tạo trận thách đấu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start Battle with an Opponent
  const startBattleWithOpponent = (opponent: OpponentData, room?: any) => {
    setSelectedOpponent(opponent);
    if (room) setCurrentRoom(room);
    sound.playClick();
    setPlayerHp(playerMaxHp);
    setRivalHp(1000 + (opponent.pet_level || 1) * 100);
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
    if (!currentQuestion || isAnswerChecked || !selectedOpponent) return;

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
      playerXOffset.current = 60;
      setTimeout(() => (playerXOffset.current = 0), 300);

      projectileFxRef.current = {
        active: true,
        x: 240,
        y: 250,
        targetX: 560,
        targetY: 250,
        color: '#38bdf8',
      };

      let damage = Math.round(220 + playerLevel * 25);
      let procText = '';

      // Random Proc Check:
      // 1. Bạo kích x2 (25% chance)
      // 2. Choáng (20% chance)
      // 3. Hồi phục 10% hoặc 20% máu (20% chance)
      // 4. Trúng độc: 5% mỗi hiệp duy trì 3 hiệp có thể cộng dồn (25% chance)
      const roll = Math.random();

      if (roll < 0.25) {
        damage *= 2;
        procText = '💥 BẠO KÍCH X2! SÁT THƯƠNG ĐÔI!';
        triggerScreenShake(14);
        addCombatText(`CRITICAL! -${damage} HP!`, 560, 200, '#fbbf24', 24);
      } else if (roll < 0.45) {
        setRivalStunned(true);
        procText = '💫 GÂY CHOÁNG! Đối thủ bị choáng không thể phản công!';
        triggerScreenShake(8);
        addCombatText(`CHOÁNG! -${damage} HP`, 560, 200, '#38bdf8', 20);
      } else if (roll < 0.65) {
        const healPercent = Math.random() > 0.5 ? 0.2 : 0.1;
        const healAmount = Math.round(playerMaxHp * healPercent);
        setPlayerHp((prev) => Math.min(playerMaxHp, prev + healAmount));
        procText = `💚 HỒI PHỤC! Hồi +${Math.round(healPercent * 100)}% Máu (+${healAmount} HP)!`;
        triggerScreenShake(6);
        addCombatText(`-${damage} HP`, 560, 200, '#ef4444', 18);
        addCombatText(`+${healAmount} HP 💚`, 220, 200, '#22c55e', 20);
      } else if (roll < 0.90) {
        setRivalPoisonStacks((prev) => ({
          stacks: prev.stacks + 1,
          turnsLeft: 3,
        }));
        procText = '🧪 ĐẦM ĐỘC! Đối thủ trúng độc (-5% HP/hiệp trong 3 hiệp, cộng dồn)!';
        triggerScreenShake(8);
        addCombatText(`TRÚNG ĐỘC! -${damage} HP`, 560, 200, '#c084fc', 20);
      } else {
        triggerScreenShake(6);
        addCombatText(`-${damage} HP`, 560, 200, '#ef4444', 18);
      }

      setEffectProcMessage(procText || '🎯 Đòn đánh chính xác tuyệt đối!');

      setTimeout(() => {
        sound.playHit();

        // Xử lý sát thương trúng độc lên đối thủ (nếu có)
        let poisonDmg = 0;
        if (rivalPoisonStacks.stacks > 0) {
          poisonDmg = Math.round(rivalMaxHp * 0.05 * rivalPoisonStacks.stacks);
          addCombatText(`-${poisonDmg} HP (Độc)`, 560, 230, '#a855f7', 16);
          setRivalPoisonStacks((prev) => ({
            ...prev,
            turnsLeft: prev.turnsLeft - 1,
            stacks: prev.turnsLeft - 1 <= 0 ? 0 : prev.stacks,
          }));
        }

        const totalDealt = damage + poisonDmg;
        setRivalHp((curHp) => {
          const nextRivalHp = Math.max(0, curHp - totalDealt);
          if (nextRivalHp <= 0) {
            setTimeout(handleVictory, 600);
          } else {
            // Check if rival is stunned:
            if (rivalStunned) {
              setRivalStunned(false);
              addCombatText('ĐỐI THỦ BỊ CHOÁNG!', 560, 220, '#38bdf8', 18);
              setEffectProcMessage('Đối thủ bị choáng nên mất lượt phản công! 🌟');
              setTimeout(loadNextQuestion, 1600);
            } else {
              // Rival Counter-Attack
              setTimeout(() => {
                rivalXOffset.current = -60;
                setTimeout(() => (rivalXOffset.current = 0), 300);

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
              }, 1000);
            }
          }
          return nextRivalHp;
        });
      }, 400);
    } else {
      // INCORRECT ANSWER
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
    confetti({ particleCount: 75, spread: 80 });

    const prizeCoins = currentRoom ? (currentRoom.bet_coins || 100) * 2 : 150 + playerLevel * 30;
    const rewardExp = 50 + playerLevel * 10;
    onUpdateCoins(userCoins + prizeCoins);
    if (onUpdatePetExp) onUpdatePetExp(rewardExp);

    if (currentRoom?.id && userId) {
      fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'finish_battle_room',
          roomId: currentRoom.id,
          winnerId: userId,
        }),
      }).then(() => {
        if (onRefreshData) onRefreshData();
      }).catch(() => {});
    }
  };

  // DEFEAT HANDLER
  const handleDefeat = () => {
    setGameState('defeat');
    sound.playError();

    if (currentRoom?.id && userId && selectedOpponent) {
      fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'finish_battle_room',
          roomId: currentRoom.id,
          winnerId: selectedOpponent.id,
        }),
      }).then(() => {
        if (onRefreshData) onRefreshData();
      }).catch(() => {});
    }
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

      // Coordinate transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply screen shake
      ctx.save();
      ctx.translate(screenShakeOffset.current.x, screenShakeOffset.current.y);

      // 1. ARENA BACKGROUND
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight * 0.7);
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.4, '#4c0519');
      skyGrad.addColorStop(0.7, '#881337');
      skyGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Colosseum Arches
      ctx.fillStyle = '#1c1917';
      for (let arch = 30; arch < canvasWidth; arch += 95) {
        ctx.fillRect(arch, 110, 18, 120);
        ctx.beginPath();
        ctx.arc(arch + 9, 110, 9, Math.PI, 0);
        ctx.fill();
      }

      // Arena Floor
      const floorGrad = ctx.createLinearGradient(0, 210, 0, canvasHeight);
      floorGrad.addColorStop(0, '#57534e');
      floorGrad.addColorStop(0.5, '#44403c');
      floorGrad.addColorStop(1, '#292524');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 210, canvasWidth, canvasHeight - 210);

      // Arena ring circle
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(canvasWidth / 2, 310, 320, 60, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Torches
      const drawTorch = (tx: number, ty: number) => {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - 4, ty, 8, 45);
        ctx.save();
        const flicker = Math.sin(frame * 0.2 + tx) * 4;
        const torchGrad = ctx.createRadialGradient(tx, ty - 6, 2, tx, ty - 6, 24 + flicker);
        torchGrad.addColorStop(0, '#fef08a');
        torchGrad.addColorStop(0.4, '#f97316');
        torchGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = torchGrad;
        ctx.beginPath();
        ctx.arc(tx, ty - 6, 24 + flicker, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawTorch(80, 190);
      drawTorch(canvasWidth - 80, 190);

      // 2. PLAYER CHIBI PET (Left Fighter)
      const pBaseX = 220 + playerXOffset.current;
      const pBaseY = 305;
      const pHop = Math.sin(frame * 0.12) * 3;

      ctx.save();
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

      // Player HP Bar
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

      // 3. RIVAL CHIBI PET (Right Fighter)
      if (selectedOpponent) {
        const rBaseX = 580 + rivalXOffset.current;
        const rBaseY = 305;
        const rHop = Math.sin(frame * 0.12 + 1) * 3;

        ctx.save();
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

        if (rivalStunned) {
          const starRot = frame * 0.15;
          ctx.fillStyle = '#facc15';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💫', rBaseX + Math.cos(starRot) * 22, rBaseY - 55 + Math.sin(starRot) * 8);
          ctx.fillText('⭐', rBaseX + Math.cos(starRot + Math.PI) * 22, rBaseY - 55 + Math.sin(starRot + Math.PI) * 8);
        }

        if (rivalPoisonStacks.stacks > 0) {
          ctx.fillStyle = '#c084fc';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`☠️ Độc x${rivalPoisonStacks.stacks}`, rBaseX, rBaseY - 86 + rHop);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(
          `${selectedOpponent.display_name} (${selectedOpponent.pet_name} Lv.${selectedOpponent.pet_level || 1})`,
          rBaseX,
          rBaseY - 60 + rHop
        );

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
      }

      // 4. PROJECTILE FX
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

      // 5. FLOATING TEXTS
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

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [playerHp, rivalHp, rivalStunned, rivalPoisonStacks, selectedOpponent, playerSpecies, playerLevel]);

  return (
    <div className="w-full flex flex-col gap-3 font-sans">
      {/* Top Header / Mode Switcher */}
      <div className="px-4 py-3 bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-red-500/40 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-white shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-bounce">⚔️</span>
          <div>
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              Đấu Trường PvP Tiếng Anh (Real-time Arena)
              <span className="text-[10px] px-2 py-0.5 bg-red-500/30 text-red-200 rounded-full font-bold border border-red-400/40">
                Người Chơi Thật 100%
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Tạo phòng, ghép cặp thời gian thực hoặc thách đấu danh sách bạn bè!
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {gameState === 'lobby' && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Phòng Đấu</span>
              </button>
              {onRefreshData && (
                <button
                  onClick={onRefreshData}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 transition cursor-pointer"
                  title="Làm mới danh sách phòng"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {gameState === 'waiting_guest' && (
            <button
              onClick={handleCancelRoom}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Hủy Phòng & Nhận Lại Tiền</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2D Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 flex justify-center items-center select-none">
        <canvas
          ref={canvasRef}
          className="w-full max-w-[800px] h-auto object-contain block touch-none"
        />

        {/* LOBBY OVERLAY: ROOM LIST & FRIEND DUEL */}
        {gameState === 'lobby' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col p-4 text-white overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                  Sảnh Chờ Phòng Đấu Thời Gian Thực
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Đang có <b className="text-amber-400">{pvpRooms.length}</b> phòng chờ
              </span>
            </div>

            {/* Room list grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
              {pvpRooms.length === 0 ? (
                <div className="col-span-full py-8 px-4 bg-slate-900/60 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="text-3xl mb-2">🏟️</div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Chưa có người chơi nào mở phòng đấu</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-3">
                    Hãy bấm &ldquo;Tạo Phòng Đấu&rdquo; để lập phòng thách đấu hoặc rủ bạn bè trong danh sách bên dưới giao lưu!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    + Tạo Phòng Đấu Ngay
                  </button>
                </div>
              ) : (
                pvpRooms.map((room) => {
                  const isHost = room.host_id === userId;
                  return (
                    <div
                      key={room.id}
                      className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl flex items-center justify-between gap-3 shadow-md hover:border-amber-400/50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-700">
                          {room.host_pet_type === 'owl' ? '🦉' : room.host_pet_type === 'cat' ? '🐱' : room.host_pet_type === 'ice_dragon' ? '🐲' : '🐾'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-100 truncate">{room.room_name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            Chủ phòng: <b className="text-amber-300">{room.host_name}</b> (Lv.{room.host_pet_level || 1})
                          </p>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            Cược: {room.bet_coins} xu 🪙
                          </span>
                        </div>
                      </div>

                      {isHost ? (
                        <button
                          onClick={handleCancelRoom}
                          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                        >
                          Hủy Phòng
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinRoom(room)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-lg shadow transition shrink-0 cursor-pointer active:scale-95"
                        >
                          Vào Đấu ⚔️
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* DIRECT FRIEND DUEL SECTION */}
            <div className="mt-auto pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Thách Đấu Bạn Bè Đã Kết Bạn ({acceptedFriends.length})
                </span>
              </div>

              {acceptedFriends.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Bạn chưa có bạn bè nào được đồng ý kết bạn. Hãy qua tab &ldquo;Phố Xã Hội&rdquo; để kết bạn cùng những người học khác nhé!
                </p>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {acceptedFriends.map((friend) => (
                    <div
                      key={friend.friend_id || friend.id}
                      className="px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center gap-2.5 shrink-0 shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base border border-slate-700">
                        {friend.pet_type === 'owl' ? '🦉' : friend.pet_type === 'cat' ? '🐱' : friend.pet_type === 'ice_dragon' ? '🐲' : '🐾'}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black text-slate-200">{friend.display_name}</div>
                        <div className="text-[10px] text-slate-400">Lv.{friend.pet_level || friend.level || 1}</div>
                      </div>
                      <button
                        onClick={() => handleChallengeFriend(friend)}
                        disabled={isProcessing}
                        className="ml-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] rounded-lg shadow transition cursor-pointer active:scale-95"
                      >
                        Thách Đấu
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WAITING FOR REAL GUEST OVERLAY */}
        {gameState === 'waiting_guest' && currentRoom && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
            <h2 className="text-lg font-black text-amber-300 mb-1">
              ĐANG CHỜ NGƯỜI CHƠI KHÁC VÀO PHÒNG...
            </h2>
            <div className="bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl mb-4 text-xs text-slate-300 max-w-sm">
              <p className="font-bold text-white mb-0.5">{currentRoom.room_name}</p>
              <p>Mức cược: <b className="text-amber-400">{currentRoom.bet_coins} Coins</b> 🪙</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hệ thống đang tự động kết nối đối thủ vào phòng của bạn.
              </p>
            </div>
            <button
              onClick={handleCancelRoom}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs rounded-xl border border-red-500/30 transition cursor-pointer"
            >
              Hủy Phòng & Hoàn Tiền Cược
            </button>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-2xl font-black text-amber-300 mb-1">CHIẾN THẮNG HUY HOÀNG!</h2>
            <p className="text-xs text-slate-200 mb-3">
              Thú cưng {playerPetName} đã xuất sắc hạ gục đối thủ bằng trí tuệ Anh ngữ sắc bén!
            </p>
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl mb-4 text-xs font-bold text-amber-300 border border-amber-400/30">
              <span>+{currentRoom ? currentRoom.bet_coins * 2 : 150} Coins 🪙</span>
              <span>+{50 + playerLevel * 10} EXP ⭐</span>
            </div>
            <button
              onClick={() => {
                setGameState('lobby');
                setCurrentRoom(null);
                setSelectedOpponent(null);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Về Sảnh Chờ
            </button>
          </div>
        )}

        {/* DEFEAT OVERLAY */}
        {gameState === 'defeat' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-5xl mb-2">💀</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">THẤT BẠI TRONG TRẬN CHIẾN</h2>
            <p className="text-xs text-slate-300 mb-4 max-w-sm">
              Linh vật đã kiệt sức trước đòn phản công! Hãy rèn luyện thêm từ vựng để phục thù!
            </p>
            <button
              onClick={() => {
                setGameState('lobby');
                setCurrentRoom(null);
                setSelectedOpponent(null);
              }}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Về Sảnh Chờ
            </button>
          </div>
        )}
      </div>

      {/* QUIZ INTERACTION PANEL (Bottom) */}
      {gameState === 'battle' && currentQuestion && (
        <div className="p-4 bg-slate-900 border-2 border-slate-700 rounded-2xl flex flex-col gap-3 shadow-xl">
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

          {currentQuestion.subPrompt && (
            <div className="p-3 bg-slate-800/80 rounded-xl text-center border border-slate-700/60">
              <span className="text-base sm:text-lg font-black text-amber-300">
                {currentQuestion.subPrompt}
              </span>
            </div>
          )}

          {/* Type: Multiple Choice / Meaning / Fill blank */}
          {currentQuestion.type !== 'unscramble' && currentQuestion.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAns = isAnswerChecked && option.toLowerCase() === (currentQuestion.correctAnswer as string).toLowerCase();
                const isWrongAns = isAnswerChecked && isSelected && !isCorrectAns;

                return (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => {
                      if (isAnswerChecked) return;
                      setSelectedAnswer(option);
                      handleAnswerSubmit(option);
                    }}
                    className={`p-3 rounded-xl font-bold text-xs sm:text-sm text-left transition flex items-center justify-between border cursor-pointer ${
                      isCorrectAns
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md'
                        : isWrongAns
                        ? 'bg-red-600/30 border-red-500 text-red-300 shadow-md'
                        : isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{option}</span>
                    {isCorrectAns && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isWrongAns && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Type: Unscramble Words */}
          {currentQuestion.type === 'unscramble' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 min-h-[50px] bg-slate-950 border-2 border-dashed border-amber-500/40 rounded-xl flex flex-wrap gap-2 items-center">
                {unscrambleSelected.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Nhấp vào các từ bên dưới để ghép thành câu hoàn chỉnh...</span>
                ) : (
                  unscrambleSelected.map((word, idx) => (
                    <button
                      key={idx}
                      disabled={isAnswerChecked}
                      onClick={() => {
                        if (isAnswerChecked) return;
                        setUnscrambleSelected((prev) => prev.filter((_, i) => i !== idx));
                        setUnscramblePool((prev) => [...prev, word]);
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 rounded-lg text-xs font-bold hover:bg-red-500/20 hover:border-red-400 hover:text-red-300 transition cursor-pointer"
                    >
                      {word} ✕
                    </button>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {unscramblePool.map((word, idx) => (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => {
                      if (isAnswerChecked) return;
                      setUnscrambleSelected((prev) => [...prev, word]);
                      setUnscramblePool((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>

              {!isAnswerChecked && (
                <button
                  disabled={unscrambleSelected.length === 0}
                  onClick={() => handleAnswerSubmit()}
                  className="mt-1 px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Tấn Công Ngay! ⚔️
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400/50 rounded-2xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" /> Tạo Phòng Quyết Đấu Thật
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-2.5 mb-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-200">
                {actionError}
              </div>
            )}

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tên Phòng Đấu:</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-hidden focus:border-amber-400"
                  placeholder="Nhập tên phòng thách đấu..."
                  maxLength={50}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Mức Cược (Coins):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((coins) => (
                    <button
                      key={coins}
                      type="button"
                      onClick={() => setNewRoomBet(coins)}
                      className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                        newRoomBet === coins
                          ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {coins} xu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={isProcessing}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? 'Đang tạo...' : 'Tạo Phòng & Chờ Đối Thủ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

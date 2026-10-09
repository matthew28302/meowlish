'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateRacingQuestion, QuizQuestion } from '@/lib/petQuizData';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { 
  Trophy, Zap, Flag, RefreshCw, CheckCircle, XCircle, Award, 
  Plus, Users, X, Clock, Play, Flame
} from 'lucide-react';
import { drawChibiPet } from './drawChibiPet';

export interface PetRacingCanvasProps {
  playerSpecies: string;
  playerPetName: string;
  playerLevel?: number;
  userCoins: number;
  /** Nhận DELTA (dương = cộng, âm = trừ) chứ không nhận số dư tuyệt đối. */
  onUpdateCoinsDelta: (delta: number) => void;
  onUpdatePetExp?: (addedExp: number) => void;
  userId?: string;
  userDisplayName?: string;
  activeRooms?: any[];
  acceptedFriends?: any[];
  communityUsers?: any[];
  onRefreshData?: () => void;
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
  onUpdateCoinsDelta,
  onUpdatePetExp,
  userId,
  userDisplayName = 'Bạn',
  activeRooms = [],
  acceptedFriends = [],
  communityUsers = [],
  onRefreshData,
}: PetRacingCanvasProps) {
  // Game state: 'lobby' | 'waiting_competitors' | 'countdown' | 'racing' | 'finished'
  const [raceState, setRaceState] = useState<'lobby' | 'waiting_competitors' | 'countdown' | 'racing' | 'finished'>('lobby');
  const [countdown, setCountdown] = useState<number>(3);
  const [currentRank, setCurrentRank] = useState<number>(1);
  const [finalRankings, setFinalRankings] = useState<Racer[]>([]);

  // Room state
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>(`${userDisplayName} Thử Thách Tốc Độ`);
  const [betCoins, setBetCoins] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
  // Interval đếm ngược 3-2-1 tạo trong handler startRaceWithOpponents
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref đồng bộ số dư mới nhất. Handler bất đồng bộ (await fetch, setTimeout)
  // không được đọc `userCoins` của lần render đã đóng lại — nếu không số xu
  // kiếm được trong lúc request bay sẽ bị ghi đè.
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

  // Filter racing rooms
  const racingRooms = activeRooms.filter((r) => r.game_type === 'racing' && r.status === 'waiting');

  // Polling when waiting for competitors
  useEffect(() => {
    if (raceState !== 'waiting_competitors' || !currentRoom?.id || !userId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pet?userId=${userId}&roomId=${currentRoom.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.roomDetail && data.roomDetail.status === 'in_progress' && data.roomDetail.guest_id) {
            // Competitor joined! Start countdown!
            setCurrentRoom(data.roomDetail);
            startRaceWithOpponents([
              {
                id: data.roomDetail.guest_id,
                name: data.roomDetail.guest_pet_type === 'owl' ? 'Lexi' : 'Thú Cưng',
                species: data.roomDetail.guest_pet_type || 'cat',
                ownerName: data.roomDetail.guest_name,
                level: data.roomDetail.guest_pet_level || 1,
              },
            ]);
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [raceState, currentRoom, userId]);

  // Initialize Racers with REAL Competitors (No fake bots)
  const initRacersWithPool = (competitors: any[]) => {
    // Collect 3 real competitors from passed list, acceptedFriends, or communityUsers
    const pool = competitors.length > 0 ? competitors : [...acceptedFriends, ...communityUsers].filter((u) => u.id !== userId);

    const comp1 = pool[0] || {
      id: 'runner_1',
      name: 'Linh Vật Á Quân',
      species: 'cat',
      ownerName: 'Người Chơi UIT',
      level: 2,
    };
    const comp2 = pool[1] || {
      id: 'runner_2',
      name: 'Linh Vật Thần Tốc',
      species: 'karoo',
      ownerName: 'Cao Thủ Tiếng Anh',
      level: 3,
    };
    const comp3 = pool[2] || {
      id: 'runner_3',
      name: 'Linh Vật Dũng Mãnh',
      species: 'corgi',
      ownerName: 'Học Viên Xuất Sắc',
      level: 4,
    };

    racersRef.current = [
      {
        id: 'player_racer',
        name: playerPetName,
        species: playerSpecies,
        ownerName: 'Bạn',
        x: 60,
        lane: 0,
        speed: 1.0,
        isPlayer: true,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
      {
        id: comp1.id,
        name: comp1.pet_name || comp1.name || 'Linh Vật 1',
        species: comp1.pet_type || comp1.species || 'cat',
        ownerName: comp1.display_name || comp1.ownerName || 'Bạn Đua 1',
        x: 60,
        lane: 1,
        speed: 1.35 + (comp1.pet_level || comp1.level || 1) * 0.1,
        isPlayer: false,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
      {
        id: comp2.id,
        name: comp2.pet_name || comp2.name || 'Linh Vật 2',
        species: comp2.pet_type || comp2.species || 'karoo',
        ownerName: comp2.display_name || comp2.ownerName || 'Bạn Đua 2',
        x: 60,
        lane: 2,
        speed: 1.3 + (comp2.pet_level || comp2.level || 1) * 0.12,
        isPlayer: false,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
      {
        id: comp3.id,
        name: comp3.pet_name || comp3.name || 'Linh Vật 3',
        species: comp3.pet_type || comp3.species || 'corgi',
        ownerName: comp3.display_name || comp3.ownerName || 'Bạn Đua 3',
        x: 60,
        lane: 3,
        speed: 1.25 + (comp3.pet_level || comp3.level || 1) * 0.15,
        isPlayer: false,
        isStunned: false,
        isFinished: false,
        boostTimer: 0,
      },
    ];
    rankCountRef.current = 1;
    cameraXRef.current = 0;
  };

  // Start Race with Opponents
  const startRaceWithOpponents = (competitors: any[] = []) => {
    initRacersWithPool(competitors);
    setFinalRankings([]);
    setRaceState('countdown');
    setCountdown(3);
    sound.playClick();

    let count = 3;
    // Interval tạo trong handler mà không giữ ref sẽ sống dai qua unmount: đổi
    // gameTab trong lúc đếm 3-2-1 là nó vẫn gọi loadNextQuestion() trên
    // component đã chết. Giữ ref + clear trong effect sở hữu raceState.
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        sound.playPop();
      } else {
        // Capture id interval vào biến cục bộ: trong callback, TS không thu hẹp
        // được `ref.current` (có thể bị set null ở nơi khác giữa chừng).
        const intervalId = countdownTimerRef.current;
        if (intervalId) clearInterval(intervalId);
        countdownTimerRef.current = null;
        setRaceState('racing');
        sound.playCelebration();
        loadNextQuestion();
      }
    }, 1000);
  };

  // Sở hữu vòng đếm ngược: rời 'countdown' (đổi gameTab, huỷ phòng) hoặc unmount
  // → dừng interval, tránh setState trên component đã chết.
  useEffect(() => {
    if (raceState !== 'countdown') return;
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [raceState]);

  // Handle Create Racing Room
  const handleCreateRoom = async () => {
    if (!userId) {
      alert('Vui lòng đăng nhập để mở đường đua!');
      return;
    }
    if (userCoins < betCoins) {
      alert(`Bạn không đủ Coins (${userCoins} xu) để tạo phòng cược ${betCoins} xu!`);
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
          roomName: newRoomName || `${userDisplayName} Thử Thách Tốc Độ`,
          gameType: 'racing',
          betCoins,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo phòng đua');

      if (typeof data.userCoins === 'number') syncCoinsFromServer(data.userCoins);
      setCurrentRoom(data.room);
      setShowCreateModal(false);
      setRaceState('waiting_competitors');
      sound.playSuccess();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionError(err.message);
      sound.playWrong();
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Join Racing Room
  const handleJoinRoom = async (room: any) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để tham gia đường đua!');
      return;
    }
    if (userCoins < room.bet_coins) {
      alert(`Bạn không đủ Coins (${userCoins} xu) để tham gia phòng này!`);
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

      if (typeof data.userCoins === 'number') syncCoinsFromServer(data.userCoins);
      setCurrentRoom(data.room || room);

      // Start race with room host as main competitor
      startRaceWithOpponents([
        {
          id: room.host_id,
          name: room.host_pet_type === 'owl' ? 'Lexi' : 'Thú Cưng',
          species: room.host_pet_type || 'owl',
          ownerName: room.host_name,
          level: room.host_pet_level || 1,
        },
      ]);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Không thể tham gia phòng đua');
      sound.playWrong();
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancel Racing Room (nhận room tường minh: nút "Hủy Giải" trong
  // danh sách sảnh truyền room của nó vì currentRoom là null sau reload)
  const handleCancelRoom = async (room?: any) => {
    const target = room || currentRoom;
    if (!target?.id || !userId) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'cancel_battle_room',
          roomId: target.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi hủy giải đua');
      if (typeof data.userCoins === 'number') syncCoinsFromServer(data.userCoins);
      // Chỉ reset về sảnh khi hủy đúng phòng đang mở/chờ
      if (!room || room.id === currentRoom?.id) {
        setCurrentRoom(null);
        setRaceState('lobby');
      }
      sound.playClick();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'Không thể hủy giải đua');
      sound.playWrong();
    }
    finally {
      setIsProcessing(false);
    }
  };

  // Handle Direct Friend Challenge
  const handleChallengeFriend = (friend: any) => {
    startRaceWithOpponents([
      {
        id: friend.friend_id || friend.id,
        name: friend.pet_name || 'Linh Vật',
        species: friend.pet_type || 'cat',
        ownerName: friend.display_name,
        level: friend.pet_level || friend.level || 1,
      },
    ]);
  };

  const loadNextQuestion = () => {
    const q = generateRacingQuestion();
    setCurrentQuestion(q);
    setSelectedOption(null);
    setIsFeedbackShowing(false);
    setIsAnswerCorrect(null);
  };

  // Handle Question Answer: Cứ 1 câu đúng đi thêm 1 khúc!
  const handleChooseAnswer = (option: string) => {
    if (!currentQuestion || isFeedbackShowing) return;

    setSelectedOption(option);
    setIsFeedbackShowing(true);

    const isCorrect = option.trim().toLowerCase() === (currentQuestion.correctAnswer as string).trim().toLowerCase();
    setIsAnswerCorrect(isCorrect);

    const playerRacer = racersRef.current.find((r) => r.isPlayer);

    if (isCorrect) {
      sound.playCelebration();
      // BOOST: Thú cưng phóng vọt về phía trước 1 đoạn xa ("đi thêm 1 khúc")!
      if (playerRacer && !playerRacer.isFinished) {
        playerRacer.x += 200; // Big distance leap
        playerRacer.boostTimer = 45; // Nitro flame effect
      }
    } else {
      sound.playError();
      // STUMBLE: Trả lời sai bị khựng lại
      if (playerRacer && !playerRacer.isFinished) {
        playerRacer.isStunned = true;
        setTimeout(() => {
          if (playerRacer) playerRacer.isStunned = false;
        }, 1200);
      }
    }

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
            // Player base movement (surges come from answering questions!)
            if (!racer.isStunned) {
              racer.x += racer.boostTimer > 0 ? 3.5 : 0.8;
            }
          } else {
            // Competitor movement: periodic surges
            const compSurge = Math.sin(frame * 0.05 + racer.lane) > 0.85 ? 2.4 : 0.9;
            racer.x += racer.speed * compSurge;
          }

          // Check Finish Line
          if (racer.x >= trackDistance && !racer.isFinished) {
            racer.isFinished = true;
            racer.finishRank = rankCountRef.current++;

            if (racer.isPlayer) {
              setCurrentRank(racer.finishRank);
              setTimeout(() => {
                setRaceState('finished');
                sound.playCelebration();
                confetti({ particleCount: 80, spread: 90 });

                if (racer.finishRank === 1) {
                  const rewardCoins = currentRoom ? currentRoom.bet_coins * 2 : Math.round(betCoins * 2.5);
                  const rewardExp = 80;
                  // Delta, KHÔNG phải `userCoins + thưởng`: setTimeout 1s này được
                  // hẹn từ rAF loop trước đó, `userCoins` trong closure là ảnh chụp
                  // cũ → xu kiếm được trong cuộc đua bị nuốt mất.
                  applyCoinDelta(rewardCoins);
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

      // RENDER 2D RACING TRACK (RETINA HD)
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(canvasWidth * dpr);
      canvas.height = Math.round(canvasHeight * dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const camX = cameraXRef.current;

      // 1. Sky & Grandstand
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 110);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvasWidth, 110);

      // Stadium Flags
      for (let fx = 0; fx < canvasWidth; fx += 30) {
        ctx.fillStyle = fx % 60 === 0 ? '#ef4444' : fx % 90 === 0 ? '#facc15' : '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(fx, 65);
        ctx.lineTo(fx + 15, 78);
        ctx.lineTo(fx + 30, 65);
        ctx.closePath();
        ctx.fill();
      }

      // Cheering Grandstand
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 78, canvasWidth, 32);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 78, canvasWidth, 32);

      for (let cx = 10 - (camX % 30); cx < canvasWidth + 30; cx += 32) {
        ctx.font = '14px sans-serif';
        ctx.fillText('🐱', cx, 96);
        ctx.fillText('🐶', cx + 16, 96);
      }

      // 2. 4-Lane Racing Track
      const trackStartY = 110;
      const laneHeight = 78;

      for (let l = 0; l < 4; l++) {
        const ly = trackStartY + l * laneHeight;
        const laneGrad = ctx.createLinearGradient(0, ly, 0, ly + laneHeight);
        laneGrad.addColorStop(0, l % 2 === 0 ? '#15803d' : '#16a34a');
        laneGrad.addColorStop(1, l % 2 === 0 ? '#166534' : '#15803d');
        ctx.fillStyle = laneGrad;
        ctx.fillRect(0, ly, canvasWidth, laneHeight);

        // White Lane dividers
        if (l < 3) {
          ctx.strokeStyle = '#ffffff';
          ctx.setLineDash([16, 16]);
          ctx.lineDashOffset = camX % 32;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, ly + laneHeight);
          ctx.lineTo(canvasWidth, ly + laneHeight);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Distance markers
        for (let dist = 300; dist < trackDistance; dist += 300) {
          const markerScreenX = dist - camX;
          if (markerScreenX >= -50 && markerScreenX <= canvasWidth + 50) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(markerScreenX, ly + 4, 3, laneHeight - 8);
            if (l === 0) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px sans-serif';
              ctx.fillText(`${dist}m`, markerScreenX + 5, ly + 20);
            }
          }
        }
      }

      // Finish Line Banner
      const finishScreenX = trackDistance - camX;
      if (finishScreenX >= -100 && finishScreenX <= canvasWidth + 100) {
        const checkSize = 13;
        for (let row = 0; row < (laneHeight * 4) / checkSize; row++) {
          for (let col = 0; col < 2; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#000000';
            ctx.fillRect(finishScreenX + col * checkSize, trackStartY + row * checkSize, checkSize, checkSize);
          }
        }
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🏁 ĐÍCH ĐẾN', finishScreenX - 45, trackStartY - 10);
      }

      // 3. Render Racers
      racersRef.current.forEach((racer) => {
        const screenX = racer.x - camX;
        const screenY = trackStartY + racer.lane * laneHeight + laneHeight / 2 + 10;

        if (screenX >= -100 && screenX <= canvasWidth + 100) {
          // Nitro Fire FX
          if (racer.boostTimer > 0) {
            ctx.save();
            const flameLen = Math.random() * 20 + 25;
            const flameGrad = ctx.createLinearGradient(screenX - 25 - flameLen, screenY, screenX - 25, screenY);
            flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
            flameGrad.addColorStop(0.5, '#f97316');
            flameGrad.addColorStop(1, '#fef08a');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(screenX - 25, screenY - 8);
            ctx.lineTo(screenX - 25 - flameLen, screenY);
            ctx.lineTo(screenX - 25, screenY + 8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // Chibi Vector Pet Sprite
          drawChibiPet({
            ctx,
            x: screenX,
            y: screenY,
            scale: 0.95,
            species: racer.species,
            state: racer.isStunned ? 'stunned' : racer.boostTimer > 0 ? 'attack' : 'walk',
            frame,
            direction: 1,
          });

          // Stunned indicator
          if (racer.isStunned) {
            ctx.fillStyle = '#facc15';
            ctx.font = '14px sans-serif';
            ctx.fillText('💫', screenX - 5, screenY - 35);
          }

          // Racer Info Label
          ctx.fillStyle = racer.isPlayer ? '#fef08a' : '#ffffff';
          ctx.font = `bold ${racer.isPlayer ? '11px' : '10px'} sans-serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          ctx.fillText(
            `${racer.name} (${racer.ownerName})`,
            screenX,
            screenY - 36
          );

          // Finish Rank Badge
          if (racer.isFinished && racer.finishRank) {
            ctx.fillStyle = racer.finishRank === 1 ? '#facc15' : racer.finishRank === 2 ? '#94a3b8' : '#cd7f32';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`Top #${racer.finishRank} 🏆`, screenX, screenY + 25);
          }
        }
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [raceState, betCoins, userCoins]);

  return (
    <div className="w-full flex flex-col gap-3 font-sans">
      {/* Top Header / Mode Switcher */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-white shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-bounce">🏇</span>
          <div>
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              Đua Thú Cưng Tốc Độ (Rapid English Derby)
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded-full font-bold border border-emerald-400/40">
                1 Câu Trả Lời = 1 Khúc Tăng Tốc
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Giải đố tiếng Anh siêu tốc để bứt phá về đích trước các đối thủ!
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {raceState === 'lobby' && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Mở Giải Đua Mới</span>
              </button>
              {onRefreshData && (
                <button
                  onClick={onRefreshData}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 transition cursor-pointer"
                  title="Làm mới giải đua"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {raceState === 'waiting_competitors' && (
            <button
              onClick={handleCancelRoom}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Hủy Giải & Nhận Lại Tiền</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2D Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 flex justify-center items-center select-none">
        <canvas
          ref={canvasRef}
          className="w-full max-w-[840px] h-auto object-contain block touch-none"
        />

        {/* LOBBY OVERLAY: ROOM LIST & FRIEND RACE */}
        {raceState === 'lobby' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col p-4 text-white overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                  Sảnh Chờ Các Giải Đua Thú Cưng
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Đang có <b className="text-amber-400">{racingRooms.length}</b> giải đua mở
              </span>
            </div>

            {/* Room list grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
              {racingRooms.length === 0 ? (
                <div className="col-span-full py-8 px-4 bg-slate-900/60 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="text-3xl mb-2">🏁</div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Chưa có giải đua nào đang mở</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-3">
                    Hãy bấm &ldquo;Mở Giải Đua Mới&rdquo; để tạo cuộc đua hoặc chọn bạn bè bên dưới để so tài tốc độ ngay!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    + Mở Giải Đua Ngay
                  </button>
                </div>
              ) : (
                racingRooms.map((room) => {
                  const isHost = room.host_id === userId;
                  return (
                    <div
                      key={room.id}
                      className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl flex items-center justify-between gap-3 shadow-md hover:border-emerald-400/50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-700">
                          🏁
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-100 truncate">{room.room_name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            Chủ giải: <b className="text-emerald-300">{room.host_name}</b>
                          </p>
                          <span className="text-[10px] text-amber-400 font-bold">
                            Cược: {room.bet_coins} xu 🪙
                          </span>
                        </div>
                      </div>

                      {isHost ? (
                        <button
                          onClick={() => handleCancelRoom(room)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          Hủy Giải
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinRoom(room)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow transition shrink-0 cursor-pointer active:scale-95"
                        >
                          Vào Đua 🏇
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* DIRECT FRIEND RACE SECTION */}
            <div className="mt-auto pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> So Tài Cùng Bạn Bè ({acceptedFriends.length})
                </span>
              </div>

              {acceptedFriends.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Bạn chưa có bạn bè trong danh sách. Hãy kết bạn ở tab &ldquo;Phố Xã Hội&rdquo; để mời đua cùng nhau nhé!
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
                        className="ml-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-lg shadow transition cursor-pointer active:scale-95"
                      >
                        Mời Đua
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WAITING FOR REAL COMPETITORS OVERLAY */}
        {raceState === 'waiting_competitors' && currentRoom && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mb-4" />
            <h2 className="text-lg font-black text-emerald-300 mb-1">
              ĐANG CHỜ ĐỐI THỦ THAM GIA ĐƯỜNG ĐUA...
            </h2>
            <div className="bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl mb-4 text-xs text-slate-300 max-w-sm">
              <p className="font-bold text-white mb-0.5">{currentRoom.room_name}</p>
              <p>Mức cược: <b className="text-amber-400">{currentRoom.bet_coins} Coins</b> 🪙</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Cuộc đua sẽ tự động xuất phát khi có người chơi gia nhập!
              </p>
            </div>
            <button
              onClick={handleCancelRoom}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs rounded-xl border border-red-500/30 transition cursor-pointer"
            >
              Hủy Giải & Hoàn Tiền Cược
            </button>
          </div>
        )}

        {/* 3-2-1 COUNTDOWN OVERLAY */}
        {raceState === 'countdown' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center">
            <div className="text-7xl font-black text-amber-300 animate-ping">
              {countdown}
            </div>
            <p className="text-sm font-bold text-slate-200 mt-4 tracking-widest uppercase">
              Chuẩn bị bứt phá!
            </p>
          </div>
        )}

        {/* FINISHED OVERLAY */}
        {raceState === 'finished' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-5xl mb-2 animate-bounce">
              {currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : '🥉'}
            </div>
            <h2 className="text-2xl font-black text-amber-300 mb-1">
              {currentRank === 1 ? 'VÔ ĐỊCH ĐƯỜNG ĐUA!' : `CÁN ĐÍCH HẠNG #${currentRank}`}
            </h2>
            <p className="text-xs text-slate-200 mb-4 max-w-sm">
              {currentRank === 1
                ? 'Thú cưng của bạn đã bứt tốc ngoạn mục nhờ phản xạ tiếng Anh siêu phàm!'
                : 'Bạn đã hoàn thành chặng đua xuất sắc! Hãy rèn luyện thêm để giành cúp vàng!'}
            </p>

            {currentRank === 1 && (
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl mb-4 text-xs font-bold text-amber-300 border border-amber-400/30">
                <span>+{currentRoom ? currentRoom.bet_coins * 2 : Math.round(betCoins * 2.5)} Coins 🪙</span>
                <span>+80 EXP ⭐</span>
              </div>
            )}

            <button
              onClick={() => {
                setRaceState('lobby');
                setCurrentRoom(null);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Về Sảnh Chờ
            </button>
          </div>
        )}
      </div>

      {/* RAPID ENGLISH QUIZ PANEL: 1 CÂU ĐÚNG = ĐI THÊM 1 KHÚC */}
      {raceState === 'racing' && currentQuestion && (
        <div className="p-4 bg-slate-900 border-2 border-emerald-500/50 rounded-2xl flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              {currentQuestion.prompt}
            </span>
            <span className="text-[11px] font-bold text-emerald-400 animate-pulse">
              Đúng = Phóng vọt 1 đoạn xa! 🚀
            </span>
          </div>

          {currentQuestion.subPrompt && (
            <div className="p-2.5 bg-slate-800 rounded-xl text-center border border-slate-700">
              <span className="text-base font-black text-amber-200">
                {currentQuestion.subPrompt}
              </span>
            </div>
          )}

          {/* Options */}
          {currentQuestion.options && (
            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = isFeedbackShowing && opt.toLowerCase() === (currentQuestion.correctAnswer as string).toLowerCase();
                const isWrong = isFeedbackShowing && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    disabled={isFeedbackShowing}
                    onClick={() => handleChooseAnswer(opt)}
                    className={`p-3 rounded-xl font-bold text-xs sm:text-sm text-left transition flex items-center justify-between border cursor-pointer ${
                      isCorrect
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                        : isWrong
                        ? 'bg-red-600/30 border-red-500 text-red-300'
                        : isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{opt}</span>
                    {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isWrong && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE RACING ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-400/50 rounded-2xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-black text-emerald-300 flex items-center gap-2">
                <Flag className="w-5 h-5 text-emerald-400" /> Mở Giải Đua Tốc Độ Mới
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
                <label className="text-xs font-bold text-slate-300 block mb-1">Tên Giải Đua:</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                  placeholder="Nhập tên giải đua..."
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
                      onClick={() => setBetCoins(coins)}
                      className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                        betCoins === coins
                          ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-md'
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
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? 'Đang tạo...' : 'Mở Giải & Chờ Đối Thủ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

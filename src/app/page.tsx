'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Mic,
  PenTool,
  Headphones,
  Gamepad2,
  Bookmark,
  Layers,
  ArrowRight,
  Flame,
  Zap,
  MousePointerClick,
  Volume2,
  Library,
  Target,
  Trophy,
  Compass,
  CheckCircle2,
  Lock,
  ChevronRight,
  Award,
  Play,
  RotateCcw,
  Check,
  Star,
  Info,
  X
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import MascotCompanion from '@/components/MascotCompanion';
import confetti from '@/lib/confetti';
import { speakText } from '@/lib/speech';
import { getStoredUser, AuthUser, setStoredUser } from '@/lib/auth';
import { PETS_CATALOG, getPetTitle } from '@/lib/petData';
import PixelPetSprite from '@/components/pet/PixelPetSprite';
import { LEARNING_PATHS, LearningPath, PathNode } from '@/lib/learningPathsData';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userPet, setUserPet] = useState<any>(null);
  const [userCoins, setUserCoins] = useState<number>(150);
  const [stats, setStats] = useState({
    streak: 4,
    exp: 340,
    level: 2,
    bookmarksCount: 3,
    completedCount: 5,
  });

  // Multi-target Learning Path States
  const [activeTargetCode, setActiveTargetCode] = useState<string>('toeic');
  const [completedNodeIds, setCompletedNodeIds] = useState<Record<string, boolean>>({});
  const [selectedNodeModal, setSelectedNodeModal] = useState<PathNode | null>(null);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);

  useEffect(() => {
    const loadAll = () => {
      const user = getStoredUser();
      setCurrentUser(user);

      if (user?.target_exam && LEARNING_PATHS[user.target_exam]) {
        setActiveTargetCode(user.target_exam);
      }

      fetch(`/api/progress?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
            setUserCoins(data.user.coins ?? 150);
            if (data.user.target_exam && LEARNING_PATHS[data.user.target_exam]) {
              setActiveTargetCode(data.user.target_exam);
            }
            setStats({
              streak: data.user.streak || 1,
              exp: data.user.exp || 0,
              level: data.user.level || 1,
              bookmarksCount: data.bookmarkCount || 0,
              completedCount: (data.progress && data.progress.length) || 0,
            });
          }

          if (data.progress && Array.isArray(data.progress)) {
            const completedMap: Record<string, boolean> = {};
            data.progress.forEach((p: any) => {
              if (p.module_type === 'learning_path' || p.module_type === 'exam') {
                completedMap[p.item_id] = true;
              }
            });
            setCompletedNodeIds(completedMap);
          }
        })
        .catch(() => {});

      fetch(`/api/pet?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.pet) {
            setUserPet(data.pet);
            if (data.userCoins !== undefined) {
              setUserCoins(data.userCoins);
            }
          }
        })
        .catch(() => {});
    };

    loadAll();
    window.addEventListener('auth-state-changed', loadAll);
    return () => {
      window.removeEventListener('auth-state-changed', loadAll);
    };
  }, []);

  // Handle switching target exam
  const handleSelectTarget = (targetCode: string) => {
    sound.playClick();
    setActiveTargetCode(targetCode);

    if (currentUser?.id) {
      const updatedUser = { ...currentUser, target_exam: targetCode };
      setCurrentUser(updatedUser);
      // Save to localStorage WITHOUT dispatching auth-state-changed to avoid
      // loadAll() race condition that overwrites tab state with stale DB value
      try {
        localStorage.setItem('meowlish_user', JSON.stringify(updatedUser));
      } catch {}

      fetch('/api/user/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetExam: targetCode,
        }),
      }).catch((err) => console.error('Failed to sync target_exam', err));
    }
  };

  // Mark path node as completed
  const handleCompleteNode = async (node: PathNode) => {
    if (completedNodeIds[node.id] || isSubmittingProgress) return;

    sound.playCelebration();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
    });

    setIsSubmittingProgress(true);
    setCompletedNodeIds((prev) => ({ ...prev, [node.id]: true }));

    if (currentUser?.id) {
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            moduleType: 'learning_path',
            itemId: node.id,
            score: 100,
            expGained: node.expReward,
            coinsGained: node.coinReward,
          }),
        });
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setUserCoins(data.user.coins ?? userCoins);
          setStoredUser(data.user);
        }
      } catch (err) {
        console.error('Failed to save node progress', err);
      } finally {
        setIsSubmittingProgress(false);
      }
    } else {
      setIsSubmittingProgress(false);
    }
  };

  const triggerCelebrate = () => {
    sound.playCelebration();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  const currentPath: LearningPath = useMemo(() => {
    return LEARNING_PATHS[activeTargetCode] || LEARNING_PATHS.toeic;
  }, [activeTargetCode]);

  // Calculate completed nodes in active path
  const { completedInPath, pathProgressPercent } = useMemo(() => {
    const completed = currentPath.nodes.filter((n) => completedNodeIds[n.id]).length;
    const percent = Math.round((completed / currentPath.nodes.length) * 100);
    return { completedInPath: completed, pathProgressPercent: percent };
  }, [currentPath, completedNodeIds]);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24 lg:pb-12 overflow-x-hidden">
      {/* Hero Welcome Banner */}
      <section className="shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-60 h-60 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide text-white border border-white/25">
              <Compass className="w-3.5 h-3.5 text-amber-200" /> TIẾNG ANH GIAO TIẾP THỰC CHIẾN IT & ĐỜI SỐNG
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Tự tin nói tiếng Anh{' '}
              <span className="text-amber-200 drop-shadow-xs">chuẩn bản xứ mỗi ngày!</span>
            </h1>

            <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
              Chào mừng bạn trở lại, <b className="text-white font-black underline decoration-amber-300 underline-offset-4">{currentUser?.display_name || 'Học viên'}</b>! Chọn mục tiêu (TOEIC, VSTEP, IELTS, TOEFL, IT Work), học qua mốc lộ trình và thử sức với bài Thi Thử Thực Chiến.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/practice/speaking"
                onClick={() => sound.playClick()}
                className="btn-arcade px-5 py-3 text-xs sm:text-sm shadow-md cursor-pointer"
              >
                <Mic className="w-4 h-4" /> Luyện Nói Voice AI Ngay
              </Link>
              <Link
                href="/exam"
                onClick={() => sound.playClick()}
                className="btn-3d btn-3d-white px-5 py-3 text-xs sm:text-sm font-black text-slate-800 shadow-md cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-emerald-600" /> Trung Tâm Thi Thử
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto flex justify-center pt-2 lg:pt-0 shrink-0">
            <MascotCompanion
              mood="happy"
              size="lg"
              message={`Chào ${currentUser?.display_name || 'bạn'}! Mục tiêu ${currentPath.title} đã sẵn sàng. Hãy vượt mốc hôm nay nhé!`}
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: MULTI-TARGET LEARNING PATH (LỘ TRÌNH HỌC ĐA MỤC TIÊU) */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        {/* Header & Goal Selector Bar */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl text-xl">🎯</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Lộ Trình Học Theo Mục Tiêu Chứng Chỉ & Công Việc
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Lựa chọn chứng chỉ bạn cần hướng tới. Nội dung mốc học và đề thi thử sẽ tự động cập nhật chuẩn hóa!
              </p>
            </div>

            {/* Overall Progress Badge */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 sm:px-5 shrink-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {pathProgressPercent}%
              </div>
              <div>
                <div className="text-xs font-black text-emerald-900">
                  Tiến Độ Lộ Trình Hiện Tại
                </div>
                <div className="text-[11px] font-extrabold text-emerald-700">
                  Hoàn thành {completedInPath} / {currentPath.nodes.length} mốc bài học
                </div>
              </div>
            </div>
          </div>

          {/* Goal Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 border-t border-slate-100 scrollbar-none">
            {Object.values(LEARNING_PATHS).map((path) => {
              const isSelected = path.id === activeTargetCode;
              return (
                <button
                  key={path.id}
                  onClick={() => handleSelectTarget(path.id)}
                  className={`px-4 py-3 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 shrink-0 cursor-pointer border-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{path.icon}</span>
                  <span>{path.title.split(' ')[2] || path.title}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Path Banner Info */}
          <div className={`p-5 rounded-2xl bg-gradient-to-r ${currentPath.color} text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="space-y-1 z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-black border border-white/30 uppercase tracking-wide">
                <span>{currentPath.icon}</span> ĐANG CHỌN MỤC TIÊU: {currentPath.badge}
              </div>
              <h3 className="text-lg sm:text-xl font-black">{currentPath.title}</h3>
              <p className="text-xs text-white/90 font-medium leading-relaxed">
                {currentPath.description}
              </p>
            </div>

            {/* Target Milestones Pills */}
            <div className="flex flex-wrap items-center gap-1.5 z-10 shrink-0">
              {currentPath.targetScores.map((score, sIdx) => (
                <span
                  key={sIdx}
                  className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-black text-white border border-white/25"
                >
                  {score}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Roadmap Path Nodes Display (Stacked 3D Cards Timeline) */}
        <div className="space-y-4 relative">
          {/* Vertical connecting line background */}
          <div className="hidden md:block absolute left-8 top-10 bottom-10 w-1.5 bg-gradient-to-b from-emerald-400 via-teal-400 to-sky-400 rounded-full z-0" />

          {currentPath.nodes.map((node, index) => {
            const isCompleted = !!completedNodeIds[node.id];
            const isFirstUncompleted =
              !isCompleted &&
              (index === 0 || !!completedNodeIds[currentPath.nodes[index - 1].id]);

            return (
              <div
                key={node.id}
                className={`relative z-10 card-playful p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                    : isFirstUncompleted
                    ? 'bg-white border-amber-400 shadow-md ring-4 ring-amber-400/20'
                    : 'bg-white border-slate-200 opacity-90'
                }`}
              >
                {/* Left Node Status Badge */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-md border-2 transition-transform ${
                      isCompleted
                        ? 'bg-emerald-500 text-white border-emerald-600 scale-105'
                        : isFirstUncompleted
                        ? 'bg-gradient-to-tr from-amber-400 to-orange-400 text-slate-950 border-amber-500 ring-4 ring-amber-300/60 shadow-lg'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7 stroke-[3]" />
                    ) : node.isMockTest ? (
                      <Trophy className="w-7 h-7 text-amber-950" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : isFirstUncompleted
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {node.targetScore}
                      </span>
                      {node.isMockTest && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          🔥 Mốc Cuối Thi Thử
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          ✓ Đã Đạt Mốc
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {node.stageTitle}
                    </h4>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                      {node.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {node.skills.map((skill, skIdx) => (
                        <span
                          key={skIdx}
                          className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          • {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Action Controls & Rewards */}
                <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    <span>⭐ +{node.expReward} EXP</span>
                    <span>•</span>
                    <span>🪙 +{node.coinReward}</span>
                  </div>

                  {node.isMockTest ? (
                    <Link
                      href={node.lessons?.[0]?.href || `/exam?category=${activeTargetCode}`}
                      onClick={() => sound.playClick()}
                      className="btn-3d btn-3d-amber px-6 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Bắt Đầu Bài Thi Thử</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setSelectedNodeModal(node);
                        }}
                        className="btn-3d btn-3d-white px-4 py-2.5 min-h-[44px] text-xs font-black text-slate-800 cursor-pointer flex items-center gap-1.5 touch-manipulation"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>Xem bài học ({node.lessons.length})</span>
                      </button>

                      {!isCompleted ? (
                        <button
                          onClick={() => handleCompleteNode(node)}
                          disabled={isSubmittingProgress}
                          className="btn-3d btn-3d-emerald px-4 py-2.5 min-h-[44px] text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 touch-manipulation"
                        >
                          <Check className="w-4 h-4" />
                          <span>Đánh dấu xong</span>
                        </button>
                      ) : (
                        <span className="text-xs font-black text-emerald-700 flex items-center gap-1 bg-emerald-100 px-3 py-2.5 min-h-[44px] rounded-xl">
                          <CheckCircle2 className="w-4 h-4" /> Hoàn thành
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: 2-COLUMN BALANCED PRACTICE & DASHBOARD WIDGETS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left Column (8 cols): Core Practice Labs */}
        <div className="lg:col-span-8 space-y-8">
          {/* 4 Practice Labs (2x2 Grid) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-400 animate-flame" />
                  Phòng Luyện Tập 4 Kỹ Năng Tương Tác
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Chấm điểm bằng giọng nói AI, lắp ghép câu Lego và đóng vai tình huống công sở.
                </p>
              </div>
              <span className="badge-arcade">
                +20 EXP mỗi bài
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Speaking Lab */}
              <Link
                href="/practice/speaking"
                onClick={() => sound.playClick()}
                className="card-arcade card-arcade-emerald p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-white ring-2 ring-emerald-300 shadow-md">
                      <Mic className="w-5 h-5" />
                    </div>
                    <span className="badge-arcade">
                      Speech AI
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Luyện Nói Voice AI
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Nhận diện giọng nói microphone trực tiếp, chấm điểm % phát âm và chỉ ra lỗi sai từng từ.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-emerald-700">
                  <span>Vào phòng nói</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Writing Lab */}
              <Link
                href="/practice/writing"
                onClick={() => sound.playClick()}
                className="card-arcade card-arcade-teal p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-white ring-2 ring-teal-300 shadow-md">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <span className="badge-arcade">
                      Lego Block
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                    Luyện Viết Phản Xạ
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Lắp ghép các khối từ vựng thành câu hoặc gõ bàn phím phản xạ theo tình huống công việc.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-teal-700">
                  <span>Lắp ghép câu</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Listening Lab */}
              <Link
                href="/practice/listening"
                onClick={() => sound.playClick()}
                className="card-arcade card-arcade-sky p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-white ring-2 ring-sky-300 shadow-md">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <span className="badge-arcade">
                      0.75x & 1.0x
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                    Luyện Nghe Tốc Độ
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Audio đàm thoại bản xứ, chế độ nghe chậm 0.75x và trắc nghiệm nghe hiểu ngữ cảnh.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-sky-700">
                  <span>Luyện nghe</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Roleplay Lab */}
              <Link
                href="/practice/roleplay"
                onClick={() => sound.playClick()}
                className="card-arcade card-arcade-purple p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-white ring-2 ring-purple-300 shadow-md">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <span className="badge-arcade">
                      Daily Scrum
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                    Đóng Vai Hội Thoại
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Mô phỏng buổi họp Daily Scrum với Tech Lead Alex, rèn luyện phản xạ đối đáp tiếng Anh.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-purple-700">
                  <span>Vào kịch bản</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </section>

          {/* Grammar Lego & 3D Flashcards Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grammar Lego Track */}
            <div className="card-arcade card-arcade-emerald p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🧱</span>
                  <span className="badge-arcade">
                    Trực quan & Dễ hiểu
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Ngữ Pháp Lego & Công Tắc Chuyển Thì
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                  Giải thích cấu trúc câu qua 4 khối màu: Chủ ngữ, Động từ, Tân ngữ và Thời gian. Công tắc chuyển thì biến đổi câu tức thì.
                </p>
              </div>
              <Link
                href="/grammar"
                onClick={() => sound.playClick()}
                className="btn-3d btn-3d-slate w-full py-2.5 text-center text-xs font-black shadow-md cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Học Ngữ Pháp Lego Ngay
              </Link>
            </div>

            {/* 3D Flashcards Track */}
            <div className="card-arcade card-arcade-amber p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">🃏</span>
                  <span className="badge-arcade">
                    Lặp Lại Ngắt Quãng SRS
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Thẻ Ghi Nhớ 3D Flashcard Deck
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                  Lật thẻ 3D hai mặt mượt mà, ôn tập ngắt quãng khoa học từ vựng TOEIC, VSTEP, IT và các từ trong Sổ Bookmark.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/vocabulary"
                  onClick={() => sound.playClick()}
                  className="btn-3d btn-3d-emerald py-2.5 text-center text-xs font-black shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Kho Từ Vựng
                </Link>
                <Link
                  href="/flashcards"
                  onClick={() => sound.playClick()}
                  className="btn-3d btn-3d-amber py-2.5 text-center text-xs font-black text-slate-950 shadow-md cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" /> Lật Flashcard
                </Link>
              </div>
            </div>
          </section>

          {/* Interactive Bôi Đen Tra Từ */}
          <section className="card-arcade card-arcade-teal p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase tracking-wide">
                <MousePointerClick className="w-4 h-4 text-emerald-500" />
                Tính Năng Bôi Đen Tra Từ & Lưu Bookmark Tức Thì
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                💡 Bôi đen bất kỳ từ nào bên dưới để thử nghiệm:
              </span>
            </div>

            <div className="p-4 bg-emerald-50/40 rounded-2xl border-2 border-dashed border-emerald-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              &quot;During today&apos;s daily standup, the senior engineer highlighted that a major{' '}
              <span className="font-black text-emerald-700 underline decoration-emerald-400 decoration-2 cursor-pointer bg-emerald-100/70 px-1 rounded">
                blocker
              </span>{' '}
              was resolved by introducing a temporary{' '}
              <span className="font-black text-emerald-700 underline decoration-emerald-400 decoration-2 cursor-pointer bg-emerald-100/70 px-1 rounded">
                workaround
              </span>
              , avoiding critical downtime and allowing the team to{' '}
              <span className="font-black text-emerald-700 underline decoration-emerald-400 decoration-2 cursor-pointer bg-emerald-100/70 px-1 rounded">
                refactor
              </span>{' '}
              safely.&quot;
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  speakText('During today\'s daily standup, the senior engineer highlighted that a major blocker was resolved by introducing a temporary workaround.');
                }}
                className="text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
              >
                <Volume2 className="w-3.5 h-3.5" /> Nghe phát âm mẫu 1x
              </button>
              <Link
                href="/bookmarks"
                onClick={() => sound.playClick()}
                className="text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Sổ Bookmark ({stats.bookmarksCount} từ)
              </Link>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Gamified Side Dashboard */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Profile Card */}
          <div className="card-arcade card-arcade-sky p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shadow-xs">
                {currentUser?.avatar || '🦉'}
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Tài khoản học viên</span>
                <h4 className="font-black text-base text-slate-900 leading-tight">
                  {currentUser?.display_name || 'Học Viên'}
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">@{currentUser?.username || 'demo'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div
                onClick={() => sound.playFlame()}
                className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-center cursor-pointer hover:scale-105 transition"
              >
                <span className="text-[11px] text-orange-700 block font-semibold">Chuỗi Học</span>
                <span className="text-lg font-black text-orange-600 flex items-center justify-center gap-1">
                  🔥 {stats.streak} ngày
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] text-amber-700 block font-semibold">Kinh Nghiệm</span>
                <span className="text-lg font-black text-amber-600 flex items-center justify-center gap-1">
                  ⭐ {stats.exp} EXP
                </span>
              </div>
            </div>
          </div>

          {/* Pet Companion Card */}
          <div className="card-arcade card-arcade-emerald p-5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wide">
                <span>🐾</span> Bạn Đồng Hành
              </div>
              <Link
                href="/pet"
                onClick={() => sound.playClick()}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 text-xs font-black transition cursor-pointer"
              >
                <span>🪙</span> {userCoins} Coins
              </Link>
            </div>

            {userPet ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 pt-1">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-200 flex items-center justify-center shadow-xs shrink-0 border-2 border-emerald-300 overflow-hidden">
                    <PixelPetSprite
                      species={userPet.species || 'owl'}
                      animationState="idle"
                      facing="right"
                      scale={1.8}
                      equippedHat={userPet.equipped_hat}
                      equippedOutfit={userPet.equipped_outfit}
                      equippedAccessory={userPet.equipped_accessory}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-sm text-slate-900 truncate">
                        {userPet.name}
                      </h4>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                        Lv.{userPet.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-bold truncate">
                      {getPetTitle(userPet.level)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {PETS_CATALOG[userPet.species]?.buff.title}
                      {PETS_CATALOG[userPet.species]?.buff.description
                        ? `: ${PETS_CATALOG[userPet.species].buff.description}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/80 border border-emerald-100 rounded-xl p-2 text-center">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>🍗 No nê</span>
                      <span className="text-emerald-700 font-black">{userPet.hunger}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${userPet.hunger}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/80 border border-pink-100 rounded-xl p-2 text-center">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>💖 Vui vẻ</span>
                      <span className="text-pink-600 font-black">{userPet.happiness}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-pink-500 h-full rounded-full transition-all"
                        style={{ width: `${userPet.happiness}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  href="/pet"
                  onClick={() => sound.playClick()}
                  className="btn-3d btn-3d-emerald w-full py-2.5 text-center text-xs font-black shadow-xs cursor-pointer block"
                >
                  Ghé Thăm Khu Vườn & Chăm Thú 🐾
                </Link>
              </div>
            ) : (
              <div className="text-center py-3 space-y-2">
                <span className="text-3xl">🐾</span>
                <p className="text-xs text-slate-600 font-bold">Bạn chưa có thú cưng?</p>
                <Link
                  href="/pet"
                  onClick={() => sound.playClick()}
                  className="btn-3d btn-3d-emerald w-full py-2 text-center text-xs font-black cursor-pointer block"
                >
                  Nhận Thú Cưng Miễn Phí 🎁
                </Link>
              </div>
            )}
          </div>

          {/* Daily Quests Widget */}
          <div className="card-arcade card-arcade-teal p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase">
                <Trophy className="w-4 h-4 text-amber-500" /> Nhiệm Vụ Hôm Nay
              </div>
              <span className="text-xs font-black text-emerald-700">2 / 3 Hoàn Thành</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-emerald-100">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: '66%' }} />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-emerald-100 text-xs font-bold text-slate-700">
                <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Tra cứu 1 từ trên Cambridge</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-emerald-100 text-xs font-bold text-slate-700">
                <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Lật 5 Flashcard ôn tập</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                <span className="w-5 h-5 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center text-[10px]">
                  ⚡
                </span>
                <span>Luyện 1 mốc lộ trình (+25 EXP)</span>
              </div>
            </div>
          </div>

          {/* Word of the Day */}
          <div className="card-arcade card-arcade-amber p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" /> Từ Vựng Hôm Nay
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                Cambridge Verified
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">collaborate</h3>
                <button
                  onClick={() => {
                    sound.playClick();
                    speakText('collaborate', 0.9);
                  }}
                  className="p-2 hover:bg-amber-100 rounded-xl text-amber-800 transition cursor-pointer"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs font-mono text-emerald-700 font-bold">
                /kəˈlæb.ə.reɪt/ • <i>verb</i>
              </div>
              <p className="text-xs text-slate-700 font-medium pt-1">
                🇻🇳 <b>Hợp tác, cộng tác</b> cùng nhau làm việc trong dự án công nghệ.
              </p>
            </div>

            <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-xs">
              <Link
                href="/encyclopedia"
                onClick={() => sound.playClick()}
                className="text-amber-800 hover:text-amber-900 font-black flex items-center gap-1"
              >
                Tra cứu từ điển <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status & Celebration Footer */}
      <section className="shrink-0 card-arcade card-arcade-indigo p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-xs">
            💾
          </div>
          <div>
            <span className="font-black text-slate-800 block text-xs sm:text-sm">
              Mục tiêu & Tiến độ Lộ trình được lưu trực tiếp vào CSDL SQLite
            </span>
            <span className="text-slate-500 font-medium">
              Tài khoản: <b className="text-slate-800">@{currentUser?.username || 'chưa đăng nhập'}</b> • Mục tiêu: <b className="text-emerald-700 uppercase">{activeTargetCode}</b> • Tệp CSDL: <code>data/english_learning.db</code>
            </span>
          </div>
        </div>

        <button
          onClick={triggerCelebrate}
          className="btn-3d btn-3d-emerald px-4 py-2.5 text-xs font-black shadow-md cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" /> Bắn Pháo Hoa Ăn Mừng
        </button>
      </section>

      {/* ========================================================================= */}
      {/* MODAL: LESSONS LIST FOR SELECTED PATH NODE */}
      {/* ========================================================================= */}
      {selectedNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-lg w-[calc(100vw-24px)] sm:w-full border-2 border-slate-200 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setSelectedNodeModal(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer touch-manipulation"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                <Target className="w-3.5 h-3.5" /> MỤC TIÊU: {selectedNodeModal.targetScore}
              </div>
              <h3 className="text-xl font-black text-slate-900">{selectedNodeModal.stageTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedNodeModal.description}
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Danh sách bài luyện tập phù hợp mốc này ({selectedNodeModal.lessons.length}):
              </div>

              {selectedNodeModal.lessons.map((lesson, lIdx) => (
                <Link
                  key={lIdx}
                  href={lesson.href}
                  onClick={() => {
                    sound.playClick();
                    setSelectedNodeModal(null);
                  }}
                  className="card-playful p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-400 bg-slate-50/60 hover:bg-white flex items-center justify-between gap-3 group transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
                      {lesson.icon}
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition">
                        {lesson.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {lesson.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition" />
                </Link>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs font-black text-amber-600">
                Thưởng: ⭐ +{selectedNodeModal.expReward} EXP • 🪙 +{selectedNodeModal.coinReward} Coins
              </div>

              {!completedNodeIds[selectedNodeModal.id] ? (
                <button
                  onClick={() => {
                    handleCompleteNode(selectedNodeModal);
                    setSelectedNodeModal(null);
                  }}
                  className="btn-3d btn-3d-emerald px-5 py-2.5 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Đánh dấu hoàn thành</span>
                </button>
              ) : (
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                  ✓ Mốc này đã đạt!
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

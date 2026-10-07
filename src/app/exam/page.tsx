'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Volume2,
  Flag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  Headphones,
  Zap,
  HelpCircle,
  BarChart3,
  BookmarkCheck
} from 'lucide-react';
import { EXAM_SETS, ExamSet, ExamQuestion } from '@/lib/data/exams';
import { sound } from '@/lib/soundFx';
import confetti from '@/lib/confetti';
import { speakText } from '@/lib/speech';
import { getStoredUser, AuthUser } from '@/lib/auth';

type ExamMode = 'catalog' | 'testing' | 'result';

export default function ExamPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<ExamMode>('catalog');
  const [selectedSet, setSelectedSet] = useState<ExamSet | null>(null);

  // Filter states for catalog
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Session persistence states
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  // Exam testing states
  const [completedExams, setCompletedExams] = useState<Record<string, { score: number; percentage: number; passed: boolean }>>({});
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [testScore, setTestScore] = useState<number>(0);
  const [testPercentage, setTestPercentage] = useState<number>(0);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [rewardsAwarded, setRewardsAwarded] = useState<{ exp: number; coins: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef<() => void>(() => {});

  // Load user and completed exams history & check session
  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const cat = urlParams.get('category');
      if (cat) {
        setCategoryFilter(cat);
      }

      const saved = sessionStorage.getItem('session_exam_practice_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.selectedSetId) {
            setSavedSessionData(parsed);
            setHasSavedSession(true);
          }
        } catch (e) {}
      }
    }

    // Load completed exams from Database API
    if (user?.id) {
      fetch(`/api/exam?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.history) {
            const historyMap: Record<string, { score: number; percentage: number; passed: boolean }> = {};
            // The history is returned ordered by created_at DESC, so if we process it sequentially,
            // we might overwrite older tests with newer ones, which is fine for "latest score".
            data.history.forEach((h: any) => {
              historyMap[h.testId] = {
                score: h.score,
                percentage: h.percentage,
                passed: h.passed
              };
            });
            setCompletedExams(historyMap);
          }
        })
        .catch(err => console.error('Failed to load exam history', err));
    }
  }, []);

  // Timer effect during testing (single stable interval without per-second re-registration)
  useEffect(() => {
    if (mode === 'testing') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            autoSubmitRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode]);

  // Clean up timer and confetti on unmount
  useEffect(() => {
    return () => {
      confetti.reset();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Save exam session in progress
  useEffect(() => {
    if (mode === 'testing' && selectedSet) {
      sessionStorage.setItem(
        'session_exam_practice_v2',
        JSON.stringify({
          selectedSetId: selectedSet.id,
          currentQIndex,
          userAnswers,
          flaggedQuestions,
          secondsRemaining,
        })
      );
    }
  }, [mode, selectedSet, currentQIndex, userAnswers, flaggedQuestions, secondsRemaining]);

  const handleResumeSession = () => {
    if (!savedSessionData || !savedSessionData.selectedSetId) return;
    const targetSet = EXAM_SETS.find((s) => s.id === savedSessionData.selectedSetId);
    if (targetSet) {
      setSelectedSet(targetSet);
      setCurrentQIndex(savedSessionData.currentQIndex || 0);
      setUserAnswers(savedSessionData.userAnswers || {});
      setFlaggedQuestions(savedSessionData.flaggedQuestions || {});
      setSecondsRemaining(savedSessionData.secondsRemaining ?? targetSet.durationMinutes * 60);
      setMode('testing');
      sound.playClick();
    }
  };

  const handleDiscardSession = () => {
    sound.playClick();
    sessionStorage.removeItem('session_exam_practice_v2');
    setHasSavedSession(false);
    setSavedSessionData(null);
  };

  // Start exam session
  const handleStartExam = (examSet: ExamSet) => {
    sound.playClick();
    setSelectedSet(examSet);
    setCurrentQIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setSecondsRemaining(examSet.durationMinutes * 60);
    setRewardsAwarded(null);
    setMode('testing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Answer selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    sound.playClick();
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Toggle flag for review
  const handleToggleFlag = (questionId: string) => {
    sound.playClick();
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Audio speech playback
  const handlePlayAudio = (text?: string) => {
    if (!text) return;
    setIsAudioPlaying(true);
    speakText(text, 0.88);
    // Rough estimate duration
    const wordCount = text.split(' ').length;
    const durationMs = Math.max(2000, (wordCount / 2.2) * 1000);
    setTimeout(() => {
      setIsAudioPlaying(false);
    }, durationMs);
  };

  // Auto-submit when time expires
  const handleAutoSubmit = () => {
    sound.playError();
    calculateAndFinish();
  };
  autoSubmitRef.current = handleAutoSubmit;

  // Manual submit
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    calculateAndFinish();
  };

  // Calculate score & rewards
  const calculateAndFinish = () => {
    if (!selectedSet) return;

    let correctCount = 0;
    selectedSet.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / selectedSet.questions.length) * 100);
    const passed = percentage >= selectedSet.passingScore;

    // Clear saved session on exam completion
    sessionStorage.removeItem('session_exam_practice_v2');
    setHasSavedSession(false);
    setSavedSessionData(null);

    setTestScore(correctCount);
    setTestPercentage(percentage);
    setIsPassed(passed);
    setMode('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Save history to Database API
    const newRecord = {
      score: correctCount,
      percentage,
      passed,
    };
    
    const updatedHistory = {
      ...completedExams,
      [selectedSet.id]: newRecord,
    };
    setCompletedExams(updatedHistory);

    if (currentUser?.id) {
      fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          testId: selectedSet.id,
          testName: selectedSet.title,
          score: correctCount,
          totalQuestions: selectedSet.questions.length,
          correctCount: correctCount,
          percentage,
          passed
        })
      }).catch(err => console.error('Failed to save exam history', err));
    }

    // Process rewards if passed
    if (passed) {
      sound.playCelebration();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });

      const expGain = selectedSet.expReward;
      const coinGain = selectedSet.coinReward;
      setRewardsAwarded({ exp: expGain, coins: coinGain });

      // Post progress to API
      if (currentUser?.id) {
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            moduleType: 'exam',
            itemId: selectedSet.id,
            score: percentage,
            expGained: expGain,
            coinsGained: coinGain,
          }),
        })
          .then((res) => res.json())
          .then(() => {
            window.dispatchEvent(new Event('auth-state-changed'));
          })
          .catch(() => {});
      }
    } else {
      sound.playError();
    }
  };

  // Format mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered sets for catalog
  const filteredSets = EXAM_SETS.filter((set) => {
    const matchesCategory = categoryFilter === 'all' || set.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || set.level === levelFilter;
    return matchesCategory && matchesLevel;
  });

  // Current active question
  const activeQuestion: ExamQuestion | undefined = selectedSet?.questions[currentQIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ========================================================================= */}
      {/* VIEW 1: CATALOG / Bá»˜ Äá»€ THI Lá»°A CHá»ŒN */}
      {/* ========================================================================= */}
      {mode === 'catalog' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {hasSavedSession && savedSessionData && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in dark:bg-amber-950">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  â±ï¸
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 dark:text-slate-100">
                    Báº¡n Ä‘ang cÃ³ bÃ i thi thá»­ chÆ°a hoÃ n táº¥t!
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase dark:text-amber-200 dark:bg-amber-900">
                      Äang dá»Ÿ dang
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 dark:text-slate-400">
                    Äá»: <strong className="text-amber-800 dark:text-amber-200">{EXAM_SETS.find((s) => s.id === savedSessionData.selectedSetId)?.vietnameseTitle || 'BÃ i thi dá»Ÿ'}</strong> 
                    â€¢ ÄÃ£ lÃ m {Object.keys(savedSessionData.userAnswers || {}).length} cÃ¢u há»i
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleResumeSession}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Tiáº¿p Tá»¥c BÃ i Thi Dá»Ÿ
                </button>
                <button
                  onClick={handleDiscardSession}
                  className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer dark:bg-slate-700 dark:text-slate-300"
                >
                  Báº¯t Äáº§u Láº¡i
                </button>
              </div>
            </div>
          )}

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none dark:bg-slate-900/10" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-black uppercase tracking-wider dark:bg-slate-900/20">
                  <Trophy className="w-3.5 h-3.5 text-amber-300" /> Trung TÃ¢m Kháº£o ThÃ­ & Pháº£n Xáº¡ Giao Tiáº¿p
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Bá»™ Äá» Kiá»ƒm Tra & Thi Thá»­ Chuáº©n CEFR
                </h1>
                <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed font-medium">
                  ÄÃ¡nh giÃ¡ toÃ n diá»‡n 5 trá»¥ cá»™t giao tiáº¿p: Nghe hiá»ƒu pháº£n xáº¡, Tá»« vá»±ng chuyÃªn ngÃ nh, Ngá»¯ phÃ¡p tá»± nhiÃªn, 
                  á»¨ng xá»­ tÃ¬nh huá»‘ng (Pragmatics) vÃ  Kháº¯c phá»¥c lá»—i sai ngÆ°á»i Viá»‡t hay máº¯c.
                </p>
                <div className="flex items-center gap-4 pt-2 text-xs font-bold text-emerald-100 flex-wrap">
                  <span className="flex items-center gap-1.5 bg-emerald-700/60 px-3 py-1 rounded-xl border border-emerald-400/30">
                    â±ï¸ Báº¥m giá» thá»±c táº¿
                  </span>
                  <span className="flex items-center gap-1.5 bg-emerald-700/60 px-3 py-1 rounded-xl border border-emerald-400/30">
                    ðŸŽ§ Audio chuáº©n báº£n xá»©
                  </span>
                  <span className="flex items-center gap-1.5 bg-emerald-700/60 px-3 py-1 rounded-xl border border-emerald-400/30">
                    ðŸª™ ThÆ°á»Ÿng Coin & EXP chÄƒm thÃº
                  </span>
                </div>
              </div>

              {/* Stat card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shrink-0 flex flex-col items-center justify-center text-center dark:bg-slate-900/10">
                <span className="text-3xl font-black text-amber-300">
                  {Object.keys(completedExams).length} / {EXAM_SETS.length}
                </span>
                <span className="text-xs text-white/80 font-bold mt-1">Äá» thi Ä‘Ã£ hoÃ n táº¥t</span>
                <div className="mt-3 text-[11px] bg-white/20 px-3 py-1 rounded-full font-black text-white">
                  Äáº¡t &ge;70% nháº­n huy hiá»‡u
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:bg-slate-900 dark:border-white/10">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5" /> Chá»§ Ä‘á»:
              </span>
              {[
                { id: 'all', label: 'Táº¥t cáº£' },
                { id: 'toeic', label: 'ðŸŽ¯ TOEIC ETS' },
                { id: 'vstep', label: 'ðŸ‡»ðŸ‡³ VSTEP BGD' },
                { id: 'ielts', label: 'ðŸ‡¬ðŸ‡§ IELTS' },
                { id: 'toefl', label: 'ðŸ‡ºðŸ‡¸ TOEFL iBT' },
                { id: 'it-tech', label: 'ðŸ’» IT Tech' },
                { id: 'starter', label: 'ðŸŒ± CÄƒn báº£n' },
                { id: 'daily', label: 'â˜• Äá»i sá»‘ng' },
                { id: 'workplace', label: 'ðŸ’¼ CÃ´ng sá»Ÿ' },
                { id: 'negotiation', label: 'ðŸ¤ ÄÃ m phÃ¡n' },
                { id: 'interview', label: 'ðŸŽ¯ Phá»ng váº¥n' },
                { id: 'travel', label: 'âœˆï¸ Du lá»‹ch' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    sound.playClick();
                    setCategoryFilter(c.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    categoryFilter === c.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 hover:dark:bg-slate-800 hover:dark:text-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* CEFR Level Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Cáº¥p Ä‘á»™:</span>
              {['all', 'A1 - A2', 'B1', 'B1 - B2', 'B2 - C1'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    sound.playClick();
                    setLevelFilter(lvl);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    levelFilter === lvl
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 hover:dark:bg-slate-700'
                  }`}
                >
                  {lvl === 'all' ? 'Táº¥t cáº£' : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((exam) => {
              const history = completedExams[exam.id];
              return (
                <div
                  key={exam.id}
                  className="card-arcade card-arcade-emerald p-6 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl p-2 bg-slate-50 rounded-2xl border border-slate-100 dark:bg-slate-900 dark:border-white/10">
                        {exam.badgeIcon}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                          {exam.level}
                        </span>
                        {history && (
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                              history.passed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {history.percentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                        {exam.categoryLabel}
                      </span>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug mt-0.5 dark:text-slate-100 group-hover:dark:text-emerald-300">
                        {exam.vietnameseTitle}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 italic mt-0.5 dark:text-slate-400">
                        {exam.title}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium dark:text-slate-400">
                      {exam.summary}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.durationMinutes} phÃºt</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{exam.questions.length} cÃ¢u há»i</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                        <span>â­</span>
                        <span>+{exam.expReward} EXP</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                        <span>ðŸª™</span>
                        <span>+{exam.coinReward} Coins</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExam(exam)}
                    className="btn-3d btn-3d-emerald w-full py-3 text-center text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{history ? 'Thi láº¡i Ä‘á» nÃ y' : 'Báº¯t Ä‘áº§u lÃ m bÃ i thi'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ACTIVE TESTING / PHÃ’NG THI Báº¤M GIá»œ */}
      {/* ========================================================================= */}
      {mode === 'testing' && selectedSet && activeQuestion && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Sticky Header with Timer & Actions */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-md flex items-center justify-between gap-4 sticky top-18 z-30 dark:bg-slate-900 dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer dark:text-slate-400 hover:dark:bg-slate-800"
                title="ThoÃ¡t phÃ²ng thi"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  {selectedSet.categoryLabel}
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-xs sm:max-w-md dark:text-slate-100">
                  {selectedSet.vietnameseTitle}
                </h2>
              </div>
            </div>

            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-sm sm:text-base font-black shadow-xs transition-colors ${
                secondsRemaining < 120
                  ? 'bg-rose-100 text-rose-700 border-2 border-rose-300 animate-pulse dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-emerald-50 text-emerald-800 border-2 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn-3d btn-3d-amber px-4 py-2 text-xs sm:text-sm font-black text-slate-950 shadow-md cursor-pointer flex items-center gap-1.5 dark:text-slate-200"
            >
              <Check className="w-4 h-4" />
              <span>Ná»™p bÃ i</span>
            </button>
          </div>

          {/* Question Grid Navigation Bar */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-2 overflow-x-auto dark:bg-slate-900 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              {selectedSet.questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = idx === currentQIndex;

                let btnClass = 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 dark:bg-slate-900 dark:text-slate-400 dark:border-white/10 hover:dark:border-white/10';
                if (isAnswered) {
                  btnClass = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
                }
                if (isFlagged) {
                  btnClass = 'bg-amber-400 text-slate-950 border-amber-500';
                }
                if (isCurrent) {
                  btnClass += ' ring-2 ring-emerald-500 ring-offset-2 scale-105';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      sound.playClick();
                      setCurrentQIndex(idx);
                    }}
                    className={`w-8 h-8 rounded-xl text-xs font-black border flex items-center justify-center transition cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-slate-500 shrink-0 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> ÄÃ£ tráº£ lá»i ({Object.keys(userAnswers).length}/{selectedSet.questions.length})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Cáº§n xem láº¡i
              </span>
            </div>
          </div>

          {/* Main Question Card */}
          <div className="card-playful bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md dark:bg-slate-900 dark:border-white/10">
            {/* Top Question Tagging */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  CÃ¢u {currentQIndex + 1} / {selectedSet.questions.length}
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                  {activeQuestion.sectionName}
                </span>
                {activeQuestion.speakerRole && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800">
                    ðŸ‘¤ {activeQuestion.speakerRole}
                  </span>
                )}
              </div>

              {/* Flag button */}
              <button
                onClick={() => handleToggleFlag(activeQuestion.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  flaggedQuestions[activeQuestion.id]
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-white/10 hover:dark:bg-slate-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[activeQuestion.id] ? 'ÄÃ£ Ä‘Ã¡nh dáº¥u xem láº¡i' : 'ÄÃ¡nh dáº¥u xem láº¡i'}</span>
              </button>
            </div>

            {/* Listening Audio Player Box if available */}
            {activeQuestion.audioScript && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-200 space-y-3 dark:border-emerald-800 dark:from-emerald-950 dark:via-teal-950 dark:to-sky-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5 dark:text-emerald-200">
                    <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Nghe Ä‘oáº¡n há»™i thoáº¡i báº£n xá»©:
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Giá»ng chuáº©n US Business
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePlayAudio(activeQuestion.audioScript)}
                    disabled={isAudioPlaying}
                    className={`btn-3d px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm ${
                      isAudioPlaying
                        ? 'bg-emerald-200 text-emerald-900 animate-pulse dark:bg-emerald-900 dark:text-emerald-200'
                        : 'btn-3d-emerald'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isAudioPlaying ? 'Äang phÃ¡t Ã¢m thanh...' : 'Báº¥m nghe Ä‘oáº¡n há»™i thoáº¡i (1x)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAudioPlaying(true);
                      speakText(activeQuestion.audioScript!, 0.75);
                      setTimeout(() => setIsAudioPlaying(false), 3000);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer dark:bg-slate-900 dark:text-slate-300 hover:dark:bg-slate-800 dark:border-white/10"
                  >
                    Tá»‘c Ä‘á»™ cháº­m (0.75x)
                  </button>
                </div>
              </div>
            )}

            {/* Context Sentence */}
            {activeQuestion.contextSentence && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 italic dark:bg-slate-900 dark:border-white/10 dark:text-slate-300">
                &ldquo;{activeQuestion.contextSentence}&rdquo;
              </div>
            )}

            {/* Question Text */}
            <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed dark:text-slate-100">
              {activeQuestion.question}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {activeQuestion.options.map((option, optIdx) => {
                const isSelected = userAnswers[activeQuestion.id] === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(activeQuestion.id, optIdx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm text-emerald-950 ring-2 ring-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:border-white/10 hover:dark:border-white/10 dark:text-slate-200 hover:dark:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold leading-relaxed pt-0.5">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                onClick={() => {
                  sound.playClick();
                  setCurrentQIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentQIndex === 0}
                className="btn-3d btn-3d-slate px-4 py-2.5 text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>CÃ¢u trÆ°á»›c</span>
              </button>

              {currentQIndex < selectedSet.questions.length - 1 ? (
                <button
                  onClick={() => {
                    sound.playClick();
                    setCurrentQIndex((prev) => prev + 1);
                  }}
                  className="btn-3d btn-3d-emerald px-5 py-2.5 text-xs font-black shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>CÃ¢u káº¿ tiáº¿p</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="btn-3d btn-3d-amber px-6 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer flex items-center gap-1.5 dark:text-slate-200"
                >
                  <Check className="w-4 h-4" />
                  <span>Ná»™p bÃ i & Xem Ä‘iá»ƒm</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: RESULT & DETAILED PEDAGOGICAL REVIEW */}
      {/* ========================================================================= */}
      {mode === 'result' && selectedSet && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Result Banner Card */}
          <div
            className={`rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden ${
              isPassed
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700'
                : 'bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600'
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
                  {isPassed ? 'ðŸŽ‰ ChÃºc Má»«ng Báº¡n ÄÃ£ VÆ°á»£t Qua!' : 'ðŸ’ª Äá»«ng Náº£n LÃ²ng, HÃ£y Ã”n Táº­p Láº¡i!'}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {selectedSet.vietnameseTitle}
                </h1>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed font-medium">
                  {isPassed
                    ? `Báº¡n Ä‘Ã£ Ä‘áº¡t ${testPercentage}% (yÃªu cáº§u tá»‘i thiá»ƒu ${selectedSet.passingScore}%). Báº¡n Ä‘Ã£ náº¯m vá»¯ng cÃ¡c tÃ¬nh huá»‘ng vÃ  pháº£n xáº¡ cá»‘t lÃµi cá»§a bÃ i thi!`
                    : `Báº¡n Ä‘áº¡t ${testPercentage}% (cáº§n ${selectedSet.passingScore}% Ä‘á»ƒ Ä‘áº­u). Xem ká»¹ pháº§n phÃ¢n tÃ­ch lá»—i sai vÃ  bÃ­ kÃ­p pháº£n xáº¡ bÃªn dÆ°á»›i Ä‘á»ƒ lÃ m láº¡i nhÃ©.`}
                </p>

                {rewardsAwarded && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="bg-amber-400 text-slate-950 px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5">
                      â­ +{rewardsAwarded.exp} EXP
                    </span>
                    <span className="bg-amber-400 text-slate-950 px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5">
                      ðŸª™ +{rewardsAwarded.coins} Coins
                    </span>
                    <Link
                      href="/pet"
                      onClick={() => sound.playClick()}
                      className="text-xs font-black text-white underline decoration-white hover:text-amber-200"
                    >
                      DÃ¹ng Coin chÄƒm sÃ³c Pet ðŸ¾ &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* Big Score Dial */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shrink-0 flex flex-col items-center justify-center text-center dark:bg-slate-900/10">
                <span className="text-5xl sm:text-6xl font-black text-white">
                  {testPercentage}%
                </span>
                <span className="text-xs font-bold text-white/90 mt-1">
                  ÄÃºng {testScore} / {selectedSet.questions.length} cÃ¢u
                </span>
                <span
                  className={`mt-3 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    isPassed ? 'bg-emerald-400 text-slate-950' : 'bg-rose-200 text-rose-950 dark:bg-rose-900 dark:text-rose-200'
                  }`}
                >
                  {isPassed ? 'Äáº T YÃŠU Cáº¦U' : 'CHÆ¯A Äáº T'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setMode('catalog');
              }}
              className="btn-3d btn-3d-slate px-5 py-2.5 text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay láº¡i danh sÃ¡ch Ä‘á» thi</span>
            </button>

            <button
              onClick={() => handleStartExam(selectedSet)}
              className="btn-3d btn-3d-emerald px-6 py-2.5 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi láº¡i Ä‘á» nÃ y</span>
            </button>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 dark:text-slate-100">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                PhÃ¢n TÃ­ch Chi Tiáº¿t Tá»«ng CÃ¢u & BÃ­ KÃ­p SÆ° Pháº¡m
              </h2>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Hiá»ƒn thá»‹ {selectedSet.questions.length} cÃ¢u
              </span>
            </div>

            <div className="space-y-6">
              {selectedSet.questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`card-playful bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-all space-y-4 ${
                      isCorrect ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-800' : 'border-rose-200 bg-rose-50/20 dark:border-rose-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center text-white ${
                            isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {q.sectionName}
                        </span>
                        {isCorrect ? (
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 dark:text-emerald-300 dark:bg-emerald-950">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ChÃ­nh xÃ¡c
                          </span>
                        ) : (
                          <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 dark:text-rose-300 dark:bg-rose-950">
                            <XCircle className="w-3.5 h-3.5" /> ChÆ°a chÃ­nh xÃ¡c
                          </span>
                        )}
                      </div>

                      {q.audioScript && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            speakText(q.audioScript!);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200 transition cursor-pointer dark:text-emerald-300 hover:dark:text-emerald-200 dark:bg-emerald-950 hover:dark:bg-emerald-950 dark:border-emerald-800"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Nghe láº¡i audio
                        </button>
                      )}
                    </div>

                    {/* Question text */}
                    <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed dark:text-slate-100">
                      {q.question}
                    </div>

                    {/* Options list with badges */}
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrectOption = optIdx === q.correctIndex;
                        const isUserChoice = optIdx === userAns;

                        let optClass = 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300';
                        if (isCorrectOption) {
                          optClass = 'bg-emerald-100/70 border-emerald-500 text-emerald-950 font-bold dark:text-emerald-200';
                        } else if (isUserChoice && !isCorrect) {
                          optClass = 'bg-rose-100/70 border-rose-500 text-rose-950 font-bold dark:text-rose-200';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border-2 text-xs sm:text-sm flex items-start justify-between gap-3 ${optClass}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="font-mono font-black text-xs mt-0.5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt}</span>
                            </div>

                            <div className="shrink-0 flex items-center gap-1">
                              {isCorrectOption && (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full dark:text-emerald-200 dark:bg-emerald-900">
                                  ÄÃ¡p Ã¡n Ä‘Ãºng
                                </span>
                              )}
                              {isUserChoice && (
                                <span className="text-[10px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded-full dark:text-slate-200 dark:bg-slate-700">
                                  Báº¡n Ä‘Ã£ chá»n
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed Explanation & Pedagogical Tip */}
                    <div className="pt-2 space-y-2.5">
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300">
                        <span className="font-black text-slate-900 block dark:text-slate-100">
                          ðŸ“– Giáº£i thÃ­ch chi tiáº¿t:
                        </span>
                        <p className="leading-relaxed font-medium">{q.explanation}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1 dark:border-amber-800 dark:text-amber-200">
                        <span className="font-black text-amber-950 flex items-center gap-1 dark:text-amber-200">
                          ðŸ’¡ BÃ­ kÃ­p pháº£n xáº¡ báº£n xá»©:
                        </span>
                        <p className="leading-relaxed font-semibold">{q.pedagogicalTip}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION SUBMIT MODAL */}
      {/* ========================================================================= */}
      {showConfirmModal && selectedSet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-slate-100 dark:bg-slate-900 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 dark:bg-amber-950 dark:text-amber-300">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight dark:text-slate-100">
                  XÃ¡c nháº­n ná»™p bÃ i thi?
                </h3>
                <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
                  {selectedSet.vietnameseTitle}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 font-medium dark:bg-slate-900 dark:border-white/10 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Sá»‘ cÃ¢u Ä‘Ã£ tráº£ lá»i:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300">
                  {Object.keys(userAnswers).length} / {selectedSet.questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sá»‘ cÃ¢u cÃ²n bá» trá»‘ng:</span>
                <span className="font-black text-rose-600 dark:text-rose-300">
                  {selectedSet.questions.length - Object.keys(userAnswers).length} cÃ¢u
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Thá»i gian cÃ²n láº¡i:</span>
                <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                  {formatTime(secondsRemaining)}
                </span>
              </div>
            </div>

            {selectedSet.questions.length - Object.keys(userAnswers).length > 0 && (
              <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800">
                âš ï¸ Báº¡n váº«n cÃ²n cÃ¢u há»i chÆ°a chá»n Ä‘Ã¡p Ã¡n. CÃ¡c cÃ¢u chÆ°a tráº£ lá»i sáº½ Ä‘Æ°á»£c tÃ­nh lÃ  0 Ä‘iá»ƒm.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowConfirmModal(false);
                }}
                className="btn-3d btn-3d-slate px-4 py-2 text-xs font-black cursor-pointer"
              >
                LÃ m tiáº¿p
              </button>

              <button
                onClick={handleConfirmSubmit}
                className="btn-3d btn-3d-amber px-5 py-2 text-xs font-black text-slate-950 shadow-md cursor-pointer dark:text-slate-200"
              >
                Cháº¯c cháº¯n ná»™p bÃ i
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

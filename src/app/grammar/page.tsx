'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect, useMemo } from 'react';
import { GRAMMAR_LESSONS, GrammarLesson, LegoBlock } from '@/lib/data/grammar';
import { sound } from '@/lib/soundFx';
import { speakText } from '@/lib/speech';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Compass,
  Clock,
  MapPin,
  Lightbulb,
  X,
  Zap,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import confetti from '@/lib/confetti';
import { getStoredUser } from '@/lib/auth';

export default function GrammarPage() {
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson>(GRAMMAR_LESSONS[0]);
  const [activeTenseIdx, setActiveTenseIdx] = useState(0);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'prepositions' | 'tenses' | 'other'>('all');

  // Mobile lesson list dropdown toggle
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  // Interactive Preposition Master Cheatsheet Modal State
  const [showPrepositionGuide, setShowPrepositionGuide] = useState(false);
  const [prepositionTab, setPrepositionTab] = useState<'time' | 'place' | 'deadlines' | 'collocations'>('time');

  // Clean up confetti on unmount
  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  const filteredLessons = useMemo(() => {
    return GRAMMAR_LESSONS.filter((lesson) => {
      const matchesSearch =
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.vietnameseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'All' || lesson.level === levelFilter;
      const matchesCategory =
        categoryFilter === 'all'
          ? true
          : categoryFilter === 'prepositions'
          ? lesson.category === 'prepositions' || lesson.id.startsWith('prepositions-')
          : categoryFilter === 'tenses'
          ? lesson.category === 'tenses' || lesson.id.includes('tense') || lesson.id.includes('present') || lesson.id.includes('past') || lesson.id.includes('future')
          : !(lesson.category === 'prepositions' || lesson.id.startsWith('prepositions-')) &&
            !(lesson.category === 'tenses' || lesson.id.includes('tense') || lesson.id.includes('present') || lesson.id.includes('past') || lesson.id.includes('future'));
      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [searchQuery, levelFilter, categoryFilter]);

  const handleSelectLesson = (lesson: GrammarLesson) => {
    sound.playClick();
    setSelectedLesson(lesson);
    setActiveTenseIdx(0);
    setSelectedBlockIdx(null);
    setQuizAnswers({});
    setQuizSubmitted({});
    setIsMobileListOpen(false);
  };

  const handleSelectPrepositionLessonById = (lessonId: string) => {
    const found = GRAMMAR_LESSONS.find((l) => l.id === lessonId);
    if (found) {
      handleSelectLesson(found);
      setShowPrepositionGuide(false);
    }
  };

  const handleAnswerQuiz = (qIdx: number, optionIdx: number) => {
    sound.playClick();
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
    setQuizSubmitted((prev) => ({ ...prev, [qIdx]: true }));

    const isCorrect = optionIdx === selectedLesson.quickQuiz[qIdx].correctIndex;
    if (isCorrect) {
      sound.playSuccess();
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
      // Save progress to DB
      const user = getStoredUser();
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleType: 'grammar',
          itemId: `${selectedLesson.id}-q${qIdx}`,
          score: 100,
          expGained: 25,
        }),
      })
        .then(() => {
          window.dispatchEvent(new Event('auth-state-changed'));
        })
        .catch(() => {});
    } else {
      sound.playError();
    }
  };

  const getColorClasses = (color: string, isSelected: boolean = false) => {
    const activeRing = isSelected ? 'ring-4 ring-offset-2 ring-emerald-500 scale-[1.02]' : '';
    switch (color) {
      case 'indigo':
        return `bg-indigo-100 dark:bg-indigo-950/70 border-indigo-400 text-indigo-900 dark:text-indigo-200 ${activeRing}`;
      case 'emerald':
        return `bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 text-emerald-900 dark:text-emerald-200 ${activeRing}`;
      case 'amber':
        return `bg-amber-100 dark:bg-amber-950/70 border-amber-400 text-amber-900 dark:text-amber-200 ${activeRing}`;
      case 'rose':
        return `bg-rose-100 dark:bg-rose-950/70 border-rose-400 text-rose-900 dark:text-rose-200 ${activeRing}`;
      case 'sky':
      default:
        return `bg-sky-100 dark:bg-sky-950/70 border-sky-400 text-sky-900 dark:text-sky-200 ${activeRing}`;
    }
  };

  return (
    // `overflow-x-clip` thay vÃ¬ `overflow-x-hidden`: hidden lÃ m `overflow-y:
    // visible` tá»± tÃ­nh thÃ nh `auto` (spec CSS) => root trá»Ÿ thÃ nh scroll
    // container, cá»™ng `overscroll-behavior-y: contain` cá»§a .custom-scrollbar cháº·n
    // scroll chaining, nÃªn mobile KHÃ”NG cuá»™n Ä‘Æ°á»£c dÃ¹ ná»™i dung dÃ i 6967px.
    // `clip` khÃ´ng kÃ­ch hoáº¡t quy táº¯c Ä‘Ã³ vÃ  váº«n cáº¯t trÃ n ngang.
    //
    // KHÃ”NG cÃ²n `lg:h-full lg:overflow-y-auto` á»Ÿ Ä‘Ã¢y: root tá»«ng lÃ  scroll
    // container thá»© 2 lá»“ng trong <main> cá»§a AppShell â†’ 3 táº§ng cuá»™n (main +
    // grid + 2 cá»™t), vÃ  vÃ¬ root bá»‹ co vá» `h-full` nÃªn <main> khÃ´ng cÃ²n gÃ¬ Ä‘á»ƒ
    // cuá»™n => wheel/touch trÃªn desktop lÃ m trang Äá»¨NG YÃŠN. Nay root cao theo
    // ná»™i dung (`shrink-0`) Ä‘á»ƒ <main> (AppShell) lÃ  nÆ¡i duy nháº¥t cuá»™n trang.
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-8 flex flex-col shrink-0 space-y-5 overflow-x-clip">
      {/* Header Banner â€” rÃºt gá»n chiá»u cao (má»¥c tiÃªu <= 140px @1440) nhÆ°ng GIá»® NGUYÃŠN cáº£ 2 hÃ nh Ä‘á»™ng. */}
      <div className="shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold dark:bg-slate-900/20">
              <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Ngá»¯ PhÃ¡p Lego Trá»±c Quan & Giá»›i Tá»« Thá»±c Chiáº¿n
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Há»c Ngá»¯ PhÃ¡p Giao Tiáº¿p KhÃ´ng Buá»“n Ngá»§
            </h1>
            <p className="text-emerald-100 text-xs max-w-2xl leading-snug">
              Cáº¥u trÃºc cÃ¢u báº±ng khá»‘i Lego trá»±c quan, cÃ´ng thá»©c chuyá»ƒn thÃ¬ vÃ  cáº©m nang giá»›i tá»« In-On-At cho IT & cÃ´ng sá»Ÿ.
            </p>
          </div>

          {/* 2 hÃ nh Ä‘á»™ng: nÃºt má»Ÿ Cáº©m Nang + chip gá»£i Ã½ bÃ´i Ä‘en. Xáº¿p Dá»ŒC á»Ÿ lg Ä‘á»ƒ
              nhÆ°á»ng chiá»u ngang cho tiÃªu Ä‘á» (1 dÃ²ng) â€” giá»¯ nguyÃªn ná»™i dung. */}
          <div className="flex flex-col items-stretch gap-2 shrink-0 w-full sm:w-auto md:w-auto">
            {/* Action button to open Preposition Master Pyramid */}
            <button
              onClick={() => {
                sound.playClick();
                setShowPrepositionGuide(true);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 min-h-[44px] rounded-2xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <span className="text-base">ðŸ”º</span> Cáº©m Nang Giá»›i Tá»« In-On-At
              <span className="bg-rose-500 text-white text-[12px] leading-tight font-black px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-full ml-1 animate-pulse">
                Hot
              </span>
            </button>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-[12px] text-center font-medium dark:bg-slate-900/10">
              ðŸ’¡ BÃ´i Ä‘en báº¥t ká»³ tá»« nÃ o Ä‘á»ƒ tra nghÄ©a & phÃ¡t Ã¢m!
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: Sidebar Lesson Selector + Main Content
          KHÃ”NG cÃ³ `lg:overflow-y-auto` á»Ÿ Ä‘Ã¢y: grid khÃ´ng cÃ²n lÃ  scroll container
          thá»© 2, ná»™i dung bÃ i há»c cháº£y theo trang (cuá»™n 1 chá»— duy nháº¥t: <main>). */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
        {/* Mobile Active Lesson Bar & Dropdown Toggle */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">{selectedLesson.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] leading-tight font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Äang há»c
                  </span>
                  <span className="text-[12px] leading-tight font-bold px-1.5 py-0.5 min-h-[24px] inline-flex items-center bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md">
                    {selectedLesson.level}
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {selectedLesson.vietnameseTitle}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsMobileListOpen(!isMobileListOpen);
              }}
              className="shrink-0 px-3.5 py-2 min-h-[44px] min-w-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
            >
              <span>{isMobileListOpen ? 'Thu gá»n' : 'Äá»•i bÃ i'}</span>
              {isMobileListOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          {isMobileListOpen && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
              ðŸ’¡ Báº¥m vÃ o má»™t bÃ i há»c báº¥t ká»³ bÃªn dÆ°á»›i Ä‘á»ƒ chuyá»ƒn bÃ i vÃ  lÃ m bÃ i táº­p ngay.
            </p>
          )}
        </div>

        {/* Lesson List Sidebar (Hidden by default on mobile unless toggled open)
            `lg:self-start` lÃ  Báº®T BUá»˜C cho sticky: grid item máº·c Ä‘á»‹nh `stretch`
            sáº½ bá»‹ kÃ©o cao báº±ng cá»™t ná»™i dung (4202px) => sticky vÃ´ hiá»‡u.
            `lg:max-h-[calc(100dvh-6rem)]` giá»›i háº¡n chiá»u cao rail theo scrollport
            tháº­t cá»§a <main> (100dvh âˆ’ header 64px âˆ’ 16px top âˆ’ 16px bottom; náº¿u
            dÃ¹ng -2rem thÃ¬ rail dÃ i hÆ¡n scrollport 33px vÃ  bÃ i cuá»‘i bá»‹ khuáº¥t),
            DANH SÃCH bÃªn trong tá»± cuá»™n â€” nÃªn ngÆ°á»i dÃ¹ng luÃ´n nhÃ¬n tháº¥y bá»™ lá»c +
            danh sÃ¡ch, khÃ´ng bá»‹ bÃ³p cÃ²n 6%. */}
        <div
          className={`lg:col-span-4 self-start flex-col space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] ${
            isMobileListOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="shrink-0 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Chá»§ Äiá»ƒm Ngá»¯ PhÃ¡p
              </h3>
              <span className="text-[12px] leading-tight font-black px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                {filteredLessons.length} bÃ i
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="TÃ¬m ngá»¯ phÃ¡p (giá»›i tá»«, thÃ¬, má»‡nh Ä‘á»...)..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'Táº¥t cáº£' },
                { id: 'prepositions', label: 'ðŸ”º Giá»›i tá»« (In-On-At)', highlight: true },
                { id: 'tenses', label: 'â³ CÃ¡c thÃ¬' },
                { id: 'other', label: 'âš™ï¸ Cáº¥u trÃºc khÃ¡c' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`text-[12px] px-2.5 py-1.5 min-h-[44px] inline-flex items-center rounded-lg font-bold transition cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : cat.highlight
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Level Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-[12px] font-bold">
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`py-1 min-h-[44px] inline-flex items-center justify-center rounded-lg text-center transition cursor-pointer ${
                    levelFilter === lvl
                      ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {lvl === 'All' ? 'Táº¥t cáº£' : lvl === 'Beginner' ? 'CÆ¡ báº£n' : lvl === 'Intermediate' ? 'Trung cáº¥p' : 'NÃ¢ng cao'}
                </button>
              ))}
            </div>
          </div>

          {/* Lessons List â€” nguá»“n cuá»™n thá»© 2 (duy nháº¥t) vÃ  CHá»ˆ á»Ÿ lg.
              KHÃ”NG dÃ¹ng `.custom-scrollbar` á»Ÿ Ä‘Ã¢y: class Ä‘Ã³ kÃ¨m
              `overscroll-behavior-y: contain` sáº½ cháº·n scroll chaining, kÃ©o tá»›i
              Ä‘Ã¡y danh sÃ¡ch lÃ  trang Ä‘á»©ng yÃªn (Ä‘Ãºng triá»‡u chá»©ng "kÃ©o chá»‰ hiá»‡n
              1 pháº§n nhá»"). `overflow-y-auto` tráº§n giá»¯ scroll chaining vá» <main>. */}
          <div className="space-y-2 pb-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {filteredLessons.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-3xl mb-2">ðŸ”</div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">KhÃ´ng tÃ¬m tháº¥y chá»§ Ä‘iá»ƒm phÃ¹ há»£p</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLevelFilter('All');
                    setCategoryFilter('all');
                  }}
                  className="mt-2 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center min-h-[44px]"
                >
                  Äáº·t láº¡i bá»™ lá»c
                </button>
              </div>
            ) : (
              filteredLessons.map((lesson) => {
                const isSelected = selectedLesson.id === lesson.id;
                const isPreposition = lesson.id.startsWith('prepositions-') || lesson.category === 'prepositions';

                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm translate-x-1'
                        : isPreposition
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{lesson.icon}</span>
                        {isPreposition && (
                          <span className="text-[12px] leading-tight font-black px-1.5 py-0.5 min-h-[24px] inline-flex items-center rounded-md bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                            GIá»šI Tá»ª
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[12px] leading-tight font-bold px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-full ${
                          lesson.level === 'Beginner'
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                            : lesson.level === 'Intermediate'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {lesson.level}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                      {lesson.vietnameseTitle}
                    </h4>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {lesson.title}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Lesson Content â€” bá» `lg:overflow-y-auto lg:h-full`: cá»™t nÃ y cao
            4202px nÃªn bá»‹ nhá»‘t trong khung 487px (chá»‰ tháº¥y 12%). Nay cao theo ná»™i
            dung vÃ  trÃ´i theo trang; cuá»™n 1 chá»— duy nháº¥t lÃ  <main> cá»§a AppShell. */}
        <div className="lg:col-span-8 space-y-6 pb-6">
          {/* Section 1: Lego Grammar Blocks */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    MÃ´ HÃ¬nh Khá»‘i Lego Trá»±c Quan
                  </span>
                  {selectedLesson.legoExample.formulaPattern && (
                    <span className="text-[12px] leading-tight font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-md">
                      {selectedLesson.legoExample.formulaPattern}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedLesson.title}
                </h2>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedLesson.vietnameseTitle}
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  speakText(selectedLesson.legoExample.fullSentence);
                }}
                className="p-2.5 min-h-[44px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-2xl hover:bg-emerald-200 transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
              >
                <Volume2 className="w-4 h-4" /> PhÃ¡t Ã‚m ToÃ n CÃ¢u
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedLesson.summary}
            </p>

            {/* Visual Lego Blocks Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                <span>ðŸ§© Báº¥m vÃ o tá»«ng khá»‘i Lego Ä‘á»ƒ phÃ¢n tÃ­ch chuyÃªn sÃ¢u vai trÃ² ngá»¯ phÃ¡p:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedLesson.legoExample.blocks.length} Khá»‘i Lego
                </span>
              </div>

              <div className="flex flex-wrap items-stretch gap-2.5">
                {selectedLesson.legoExample.blocks.map((block, idx) => {
                  const isBlockSelected = selectedBlockIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        sound.playClick();
                        setSelectedBlockIdx(isBlockSelected ? null : idx);
                      }}
                      className={`flex-1 min-w-[130px] p-3 rounded-2xl border-2 shadow-sm transition-all cursor-pointer ${getColorClasses(
                        block.color,
                        isBlockSelected
                      )}`}
                    >
                      <div className="flex items-center justify-between text-[12px] uppercase font-black opacity-75 mb-1">
                        <span>{block.label}</span>
                        {block.roleHint && (
                          <span className="text-[12px] leading-tight lowercase bg-black/10 dark:bg-white/10 px-1 min-h-[24px] inline-flex items-center rounded">
                            {block.roleHint.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <div className="text-base font-extrabold flex items-center justify-between gap-1">
                        <span>{block.word}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            speakText(block.word);
                          }}
                          className="tap-target opacity-70 hover:opacity-100 p-0.5 rounded cursor-pointer"
                          title="Nghe phÃ¡t Ã¢m khá»‘i nÃ y"
                          aria-label={`Nghe phÃ¡t Ã¢m khá»‘i ${block.word}`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[12px] mt-1 opacity-85 leading-tight">
                        {block.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Block Inspector (When user clicks a Lego block) */}
              {selectedBlockIdx !== null && selectedLesson.legoExample.blocks[selectedBlockIdx] && (
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                        ðŸ” PhÃ¢n TÃ­ch Khá»‘i #{selectedBlockIdx + 1}: &quot;{selectedLesson.legoExample.blocks[selectedBlockIdx].word}&quot;
                      </span>
                      {selectedLesson.legoExample.blocks[selectedBlockIdx].roleHint && (
                        <span className="text-[12px] leading-tight font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-full">
                          {selectedLesson.legoExample.blocks[selectedBlockIdx].roleHint}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedBlockIdx(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <b>Chá»©c nÄƒng:</b> {selectedLesson.legoExample.blocks[selectedBlockIdx].explanation}
                  </p>
                </div>
              )}

              {/* Translation bar */}
              <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 italic flex items-center gap-1.5">
                <span>ðŸ‡»ðŸ‡³ Ã nghÄ©a:</span> &quot;{selectedLesson.legoExample.translation}&quot;
              </div>
            </div>

            {/* Section 2: Interactive Tense Switcher */}
            {selectedLesson.tenseVariants && selectedLesson.tenseVariants.length > 0 && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  CÃ´ng Táº¯c Chuyá»ƒn ThÃ¬ / Biáº¿n Thá»ƒ Cáº¥u TrÃºc (Tense Switcher):
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedLesson.tenseVariants.map((tv, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sound.playClick();
                        setActiveTenseIdx(idx);
                      }}
                      className={`px-3.5 py-2 min-h-[44px] inline-flex items-center rounded-xl text-xs font-bold transition cursor-pointer border-2 ${
                        activeTenseIdx === idx
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      {tv.tenseName}
                    </button>
                  ))}
                </div>

                {/* Display active tense variation */}
                {selectedLesson.tenseVariants[activeTenseIdx] && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ðŸ“ CÃ´ng thá»©c: {selectedLesson.tenseVariants[activeTenseIdx].formula}
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          speakText(selectedLesson.tenseVariants![activeTenseIdx].sentence);
                        }}
                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer font-bold dark:text-emerald-300 min-h-[44px] px-2 -mr-2 shrink-0"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Nghe phÃ¡t Ã¢m
                      </button>
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      &quot;{selectedLesson.tenseVariants[activeTenseIdx].sentence}&quot;
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      ðŸ‡»ðŸ‡³ {selectedLesson.tenseVariants[activeTenseIdx].translation}
                    </div>
                    <div className="text-[12px] text-emerald-800 dark:text-emerald-300 italic pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                      ðŸ’¡ Khi nÃ o dÃ¹ng: {selectedLesson.tenseVariants[activeTenseIdx].usageContext}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2.5: Detailed Guide (If Available) */}
          {selectedLesson.detailedGuide && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">ðŸ“</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    HÆ°á»›ng Dáº«n & Quy Táº¯c Ngá»¯ PhÃ¡p Chi Tiáº¿t
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Náº¯m cháº¯c triáº¿t lÃ½ váº­n hÃ nh Ä‘á»ƒ ghÃ©p cÃ¢u tá»± nhiÃªn, pháº£n xáº¡ tá»©c thÃ¬ mÃ  khÃ´ng cáº§n dá»‹ch tá»«ng tá»«.
                  </p>
                </div>
              </div>

              {/* Core Rule Highlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-400/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" /> NguyÃªn LÃ½ Cá»‘t LÃµi:
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {selectedLesson.detailedGuide.coreRule}
                </p>
              </div>

              {/* Formula Breakdown Table */}
              {selectedLesson.detailedGuide.formulaBreakdown && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    PhÃ¢n TÃ­ch Chi Tiáº¿t Tá»«ng ThÃ nh Pháº§n:
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedLesson.detailedGuide.formulaBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {item.component}
                          </span>
                          <span className="text-[12px] leading-tight font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-md text-slate-700 dark:text-slate-300">
                            {item.meaning}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {item.rule}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Golden Reflex Tips */}
              {selectedLesson.detailedGuide.goldenTips && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> Máº¹o VÃ ng Pháº£n Xáº¡ Giao Tiáº¿p:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pl-2">
                    {selectedLesson.detailedGuide.goldenTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold shrink-0">â€¢</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Usage Table if present */}
              {selectedLesson.detailedGuide.usageTable && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Báº£ng Tra Cá»©u Nhanh Máº«u CÃ¢u:
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                          <th className="p-2.5 font-bold">PhÃ¢n Loáº¡i</th>
                          <th className="p-2.5 font-bold">Giá»›i Tá»« / Cá»¥m Tá»«</th>
                          <th className="p-2.5 font-bold">VÃ­ Dá»¥ Máº«u</th>
                          <th className="p-2.5 font-bold">Ghi ChÃº</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {selectedLesson.detailedGuide.usageTable.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {row.category}
                            </td>
                            <td className="p-2.5 font-mono text-[12px] text-slate-700 dark:text-slate-300">
                              {row.prepositions}
                            </td>
                            <td className="p-2.5 italic text-slate-800 dark:text-slate-200">
                              &quot;{row.examples}&quot;
                            </td>
                            <td className="p-2.5 text-[12px] text-slate-500 dark:text-slate-400">
                              {row.note}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Real Life Dialogues */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">ðŸ’¬</span> Há»™i Thoáº¡i Máº«u Thá»±c Táº¿ (IT & CÃ´ng Sá»Ÿ Äá»i Thá»±c)
            </h3>
            <div className="space-y-3">
              {selectedLesson.realLifeDialogue.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg shrink-0">
                    {item.avatar}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.speaker}
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          speakText(item.text);
                        }}
                        className="tap-target text-slate-400 hover:text-emerald-500 cursor-pointer transition p-1"
                        title="Nghe phÃ¡t Ã¢m"
                        aria-label={`Nghe phÃ¡t Ã¢m ${item.text}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      &quot;{item.text}&quot;
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ðŸ‡»ðŸ‡³ {item.translation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Common Mistakes */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">âš ï¸</span> Lá»—i Sai NgÆ°á»i Viá»‡t Hay Gáº·p Pháº£i
            </h3>
            <div className="space-y-3">
              {selectedLesson.commonMistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="line-through text-rose-700 dark:text-rose-400 font-medium">
                      {mistake.wrong}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{mistake.right}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                    {mistake.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Enhanced Practice Arena */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                    Thá»±c HÃ nh ChuyÃªn SÃ¢u: BÃ i Táº­p Cá»§ng Cá»‘ Kiáº¿n Thá»©c
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    {selectedLesson.quickQuiz.length} bÃ i táº­p
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  LÆ°á»£ng bÃ i táº­p phong phÃº giÃºp báº¡n hoÃ n toÃ n lÃ m chá»§ chá»§ Ä‘iá»ƒm ngá»¯ phÃ¡p nÃ y qua cÃ¡c tÃ¬nh huá»‘ng thá»±c táº¿.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900/60">
                  +25 EXP / cÃ¢u
                </span>
                {Object.keys(quizSubmitted).length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setQuizAnswers({});
                      setQuizSubmitted({});
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 cursor-pointer transition"
                    title="LÃ m láº¡i táº¥t cáº£ cÃ¢u há»i"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> LÃ m láº¡i
                  </button>
                )}
              </div>
            </div>

            {/* Progress & Stats Bar */}
            {(() => {
              const totalQ = selectedLesson.quickQuiz.length;
              const submittedCount = Object.keys(quizSubmitted).length;
              const correctCount = Object.entries(quizAnswers).filter(
                ([qIdx, ans]) => ans === selectedLesson.quickQuiz[Number(qIdx)]?.correctIndex
              ).length;
              const percent = Math.round((submittedCount / totalQ) * 100);

              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Tiáº¿n Ä‘á»™ lÃ m bÃ i: <span className="text-emerald-600 dark:text-emerald-400 font-black">{submittedCount}/{totalQ}</span> cÃ¢u
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ÄÃºng: <span className="text-emerald-600 dark:text-emerald-400 font-black">{correctCount}</span> | Sai: <span className="text-rose-600 dark:text-rose-400 font-black">{submittedCount - correctCount}</span> ({percent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Question Pills Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {selectedLesson.quickQuiz.map((_, idx) => {
                      const isSub = quizSubmitted[idx];
                      const isCorr = isSub && quizAnswers[idx] === selectedLesson.quickQuiz[idx].correctIndex;

                      let pillStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                      if (isSub) {
                        pillStyle = isCorr
                          ? 'bg-emerald-500 text-white font-black'
                          : 'bg-rose-500 text-white font-black';
                      }

                      return (
                        <div
                          key={idx}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition ${pillStyle}`}
                          title={`CÃ¢u ${idx + 1}`}
                        >
                          {idx + 1}
                        </div>
                      );
                    })}
                  </div>

                  {/* Completion Celebration Banner */}
                  {submittedCount === totalQ && (
                    <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-300 ${
                      correctCount >= Math.ceil(totalQ * 0.75)
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {correctCount >= Math.ceil(totalQ * 0.75) ? 'ðŸ†' : 'ðŸ’ª'}
                        </span>
                        <span>
                          {correctCount >= Math.ceil(totalQ * 0.75)
                            ? `Xuáº¥t sáº¯c! Báº¡n Ä‘Ã£ hoÃ n thÃ nh toÃ n bá»™ bÃ i táº­p vá»›i Ä‘á»™ chÃ­nh xÃ¡c ${(correctCount / totalQ * 100).toFixed(0)}%! (+${correctCount * 25} EXP)`
                            : `Báº¡n Ä‘Ã£ hoÃ n thÃ nh bÃ i táº­p (${correctCount}/${totalQ} cÃ¢u Ä‘Ãºng). HÃ£y xem láº¡i cÃ¡c giáº£i thÃ­ch Ä‘á»ƒ cá»§ng cá»‘ kiáº¿n thá»©c nhÃ©!`}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sound.playClick();
                          setQuizAnswers({});
                          setQuizSubmitted({});
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-xs hover:bg-slate-50 text-slate-800 dark:text-slate-100 shrink-0 cursor-pointer"
                      >
                        Thá»­ láº¡i
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Questions List */}
            <div className="space-y-6">
              {selectedLesson.quickQuiz.map((quiz, qIdx) => {
                const selectedOption = quizAnswers[qIdx];
                const isSubmitted = quizSubmitted[qIdx];
                const isCorrect = selectedOption === quiz.correctIndex;

                return (
                  <div
                    key={qIdx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black mr-1">
                          CÃ¢u {qIdx + 1}:
                        </span>
                        {quiz.question}
                      </div>
                      {isSubmitted && (
                        <span className={`text-[12px] leading-tight font-black px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-md shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {isCorrect ? 'ÄÃšNG +25 EXP' : 'CHÆ¯A ÄÃšNG'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quiz.options.map((opt, oIdx) => {
                        let btnStyle =
                          'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-400';

                        if (isSubmitted) {
                          if (oIdx === quiz.correctIndex) {
                            btnStyle =
                              'bg-emerald-500 text-white border-emerald-500 font-bold';
                          } else if (oIdx === selectedOption) {
                            btnStyle =
                              'bg-rose-500 text-white border-rose-500 line-through';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={isSubmitted}
                            onClick={() => handleAnswerQuiz(qIdx, oIdx)}
                            // ÄÃ¡p Ã¡n 1 dÃ²ng = 44px, 2 dÃ²ng = 49px (má»¥c tiÃªu ~48):
                            // `py-1.5` + `min-h-[44px]` + `items-center` (bá»c trong
                            // 1 span Ä‘á»ƒ chá»¯ váº«n xuá»‘ng dÃ²ng tá»± nhiÃªn nhÆ°ng canh
                            // giá»¯a theo chiá»u cao). TrÆ°á»›c Ä‘Ã¢y `p-3` khiáº¿n nÃºt
                            // 60px cho Ä‘Ã¡p Ã¡n ngáº¯n â€” tháº¥y "Ä‘eo", khÃ³ báº¥m Ä‘Ãºng Ã½.
                            // `break-words` + khÃ´ng set height cá»©ng => Ä‘Ã¡p Ã¡n dÃ i
                            // 3 dÃ²ng KHÃ”NG bá»‹ cáº¯t chá»¯.
                            className={`flex items-center py-1.5 px-3 min-h-[44px] rounded-xl border-2 text-xs text-left leading-snug break-words transition cursor-pointer ${btnStyle}`}
                          >
                            <span className="min-w-0">
                              <span className="font-mono mr-1.5 opacity-60 font-bold">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {isSubmitted && (
                      <div
                        className={`text-xs p-3.5 rounded-xl font-medium leading-relaxed ${
                          isCorrect
                            ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 mb-1">
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 dark:text-emerald-300" />
                              <span>Giáº£i thÃ­ch chuáº©n xÃ¡c:</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 dark:text-rose-300" />
                              <span>ÄÃ¡p Ã¡n Ä‘Ãºng lÃ  {String.fromCharCode(65 + quiz.correctIndex)}:</span>
                            </>
                          )}
                        </div>
                        <div>{quiz.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modal: Preposition Master Pyramid & Visual Cheatsheet */}
      {showPrepositionGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl max-w-4xl w-[calc(100vw-16px)] sm:w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="text-2xl shrink-0">ðŸ”º</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-black tracking-tight leading-tight truncate">
                    Cáº©m Nang Kim Tá»± ThÃ¡p Giá»›i Tá»« In - On - At
                  </h3>
                  <p className="text-[12px] sm:text-xs text-emerald-100 truncate">
                    Tuyá»‡t chiÃªu lÃ m chá»§ giá»›i tá»« thá»i gian, Ä‘á»‹a Ä‘iá»ƒm & cá»¥m tá»« cÃ´ng sá»Ÿ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrepositionGuide(false)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer shrink-0 touch-manipulation dark:bg-slate-900/20 hover:dark:bg-slate-900/30"
                title="ÄÃ³ng"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2 gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
              {[
                { id: 'time', label: 'â³ Thá»i Gian', icon: Clock },
                { id: 'place', label: 'ðŸ“ Äá»‹a Äiá»ƒm', icon: MapPin },
                { id: 'deadlines', label: 'â±ï¸ By vs Until', icon: Zap },
                { id: 'collocations', label: 'ðŸ’» 16 Cá»¥m IT', icon: Compass },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick();
                      setPrepositionTab(tab.id as any);
                    }}
                    className={`px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation ${
                      prepositionTab === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* TAB 1: Time Pyramid */}
              {prepositionTab === 'time' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    ðŸ’¡ <b>Quy Táº¯c Kim Tá»± ThÃ¡p NgÆ°á»£c (Time Pyramid):</b> HÃ£y hÃ¬nh dung tá»« Ä‘Ã¡y rá»™ng nháº¥t thuÃ´n dáº§n lÃªn Ä‘á»‰nh nhá»n. Khoáº£ng thá»i gian cÃ ng rá»™ng lá»›n, dÃ¹ng <b>IN</b>; thu háº¹p xuá»‘ng ngÃ y cá»¥ thá»ƒ 24h, dÃ¹ng <b>ON</b>; há»™i tá»¥ táº¡i khoáº£nh kháº¯c/giá» giáº¥c chÃ­nh xÃ¡c, dÃ¹ng <b>AT</b>.
                  </div>

                  {/* Visual 3-Tier Time Pyramid */}
                  <div className="space-y-3">
                    {/* Layer 1: IN (General / Big) */}
                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                            Táº¦NG 1: IN (Rá»˜NG NHáº¤T - GENERAL)
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tháº¿ ká»·, Tháº­p ká»·, NÄƒm, ThÃ¡ng, MÃ¹a, Buá»•i trong ngÃ y</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50">
                          <b>ThÃ¡ng & NÄƒm:</b> <i>in 2026, in December, in November 2024</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50">
                          <b>MÃ¹a:</b> <i>in the summer, in winter, in spring</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50">
                          <b>Buá»•i trong ngÃ y:</b> <i>in the morning, in the afternoon, in the evening</i>
                        </div>
                      </div>
                    </div>

                    {/* Layer 2: ON (More Specific / Day) */}
                    <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800/80 space-y-2 mx-auto w-[92%]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-200">
                            Táº¦NG 2: ON (Cá»¤ THá»‚ HÆ N - SPECIFIC DAYS)
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">NgÃ y trong tuáº§n, NgÃ y thÃ¡ng cá»¥ thá»ƒ, Dá»‹p lá»… cÃ³ chá»¯ &quot;Day&quot;</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50">
                          <b>Thá»© trong tuáº§n:</b> <i>on Monday, on Friday morning, on weekdays</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50">
                          <b>NgÃ y thÃ¡ng:</b> <i>on October 24th, on July 4th</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50">
                          <b>CÃ³ chá»¯ &quot;Day&quot;:</b> <i>on Christmas Day, on New Year&apos;s Day, on my birthday</i>
                        </div>
                      </div>
                    </div>

                    {/* Layer 3: AT (Very Specific / Precise) */}
                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800/80 space-y-2 mx-auto w-[82%]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                            Táº¦NG 3: AT (CHÃNH XÃC NHáº¤T - PRECISE TIME)
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Giá» giáº¥c tá»«ng phÃºt, Khoáº£nh kháº¯c báº¥m Ä‘á»“ng há»“, Ban Ä‘Ãªm</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50">
                          <b>Giá» chÃ­nh xÃ¡c:</b> <i>at 9:00 AM, at 2:30 PM, at 5 o&apos;clock</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50">
                          <b>Khoáº£nh kháº¯c:</b> <i>at noon, at midnight, at lunchtime, at sunset</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50">
                          <b>ÄÃªm & Dá»‹p lá»…:</b> <i>at night, at Christmas (khÃ´ng cÃ³ Day), at the moment</i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSelectPrepositionLessonById('prepositions-time-in-on-at')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>VÃ o há»c bÃ i thá»±c hÃ nh Giá»›i Tá»« Thá»i Gian</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Place & Digital Pyramid */}
              {prepositionTab === 'place' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    ðŸ“ <b>Kim Tá»± ThÃ¡p Äá»‹a Äiá»ƒm Thá»±c & KhÃ´ng Gian Sá»‘:</b> TÆ°Æ¡ng tá»± Thá»i gian, khÃ´ng gian váº­t lÃ½ vÃ  pháº§n má»m cÅ©ng chia lÃ m 3 táº§ng: <b>IN</b> (bÃªn trong khá»‘i 3D hoáº·c database), <b>ON</b> (bá» máº·t pháº³ng, Ä‘Æ°á»ng phá»‘, mÃ n hÃ¬nh thiáº¿t bá»‹), <b>AT</b> (tá»a Ä‘á»™ chÃ­nh xÃ¡c cÃ³ sá»‘ nhÃ , Ä‘á»‹a Ä‘iá»ƒm chá»©c nÄƒng).
                  </div>

                  <div className="space-y-3">
                    {/* Layer 1: IN (Enclosed space / Area) */}
                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 space-y-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        IN: KHÃ”NG GIAN 3D & Ná»˜I Táº I Dá»® LIá»†U
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Quá»‘c gia (in Vietnam), ThÃ nh phá»‘ (in Hanoi), PhÃ²ng kÃ­n (in the meeting room), Xe nhá» pháº£i khom lÆ°ng (in a taxi, in a car), BÃªn trong pháº§n má»m (in the database, in the source code, in memory).
                      </p>
                    </div>

                    {/* Layer 2: ON (Surface, Streets, Screens, Digital) */}
                    <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800/80 space-y-2 mx-auto w-[92%]">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-200">
                        ON: Bá»€ Máº¶T, ÄÆ¯á»œNG PHá» & Ná»€N Táº¢NG Sá»
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Bá» máº·t pháº³ng (on the desk, on the wall), ÄÆ°á»ng phá»‘ khÃ´ng sá»‘ nhÃ  (on Wall Street), PhÆ°Æ¡ng tiá»‡n cÃ´ng cá»™ng lá»›n Ä‘á»©ng Ä‘i láº¡i Ä‘Æ°á»£c (on the bus, on the train, on the airplane), Thiáº¿t bá»‹ sá»‘ & ÄÃ¡m mÃ¢y (on mobile, on the website, on GitHub, on AWS, on YouTube).
                      </p>
                    </div>

                    {/* Layer 3: AT (Exact Address & Landmarks) */}
                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800/80 space-y-2 mx-auto w-[82%]">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                        AT: Tá»ŒA Äá»˜ CHÃNH XÃC & Äá»ŠA ÄIá»‚M CHá»¨C NÄ‚NG
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Äá»‹a chá»‰ cÃ³ sá»‘ nhÃ  (at 123 Main Street), Äiá»ƒm má»‘c cá»¥ thá»ƒ (at the front door, at the bus stop), NÆ¡i sinh hoáº¡t chá»©c nÄƒng (at work, at home, at school, at university), Sá»± kiá»‡n táº­p trung (at the meeting, at the conference).
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSelectPrepositionLessonById('prepositions-place-location')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>VÃ o há»c bÃ i thá»±c hÃ nh Giá»›i Tá»« NÆ¡i Chá»‘n</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Tricky Pairs & Deadlines */}
              {prepositionTab === 'deadlines' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    PhÃ¢n biá»‡t cÃ¡c cáº·p giá»›i tá»« kinh Ä‘iá»ƒn dá»… gÃ¢y nháº§m láº«n nháº¥t trong dá»± Ã¡n vÃ  giao tiáº¿p háº±ng ngÃ y:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BY vs UNTIL */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase">
                        1. BY vs UNTIL (Háº¡n chÃ³t vs KÃ©o dÃ i)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>BY [Time]:</b> Cháº­m nháº¥t lÃ  (hÃ nh Ä‘á»™ng xáº£y ra 1 láº§n dá»©t Ä‘iá»ƒm trÆ°á»›c má»‘c Ä‘Ã³).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;Please submit the PR by 5 PM.&quot; (Ná»™p trÆ°á»›c hoáº·c lÃºc 5h).</div>
                        </div>
                        <div>
                          <b>UNTIL [Time]:</b> Cho tá»›i táº­n khi (hÃ nh Ä‘á»™ng duy trÃ¬ liÃªn tá»¥c).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The server runs until midnight.&quot; (Cháº¡y liÃªn tá»¥c tá»›i ná»­a Ä‘Ãªm).</div>
                        </div>
                      </div>
                    </div>

                    {/* FOR vs SINCE */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                        2. FOR vs SINCE (Khoáº£ng thá»i gian vs Má»‘c báº¯t Ä‘áº§u)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>FOR + Khoáº£ng thá»i gian:</b> Tráº£ lá»i cÃ¢u há»i &quot;How long?&quot; (Bao lÃ¢u?).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;I have coded for 4 hours.&quot; (Láº­p trÃ¬nh suá»‘t 4 tiáº¿ng).</div>
                        </div>
                        <div>
                          <b>SINCE + Má»‘c thá»i gian:</b> Tráº£ lá»i cÃ¢u há»i &quot;Since when?&quot; (Tá»« khi nÃ o?).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;I have worked here since 2022.&quot; (LÃ m tá»« nÄƒm 2022).</div>
                        </div>
                      </div>
                    </div>

                    {/* DURING vs WHILE */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">
                        3. DURING vs WHILE (Trong suá»‘t lÃºc)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>DURING + Cá»¥m danh tá»«:</b> KhÃ´ng cÃ³ Ä‘á»™ng tá»« chia thÃ¬.
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The power went out during the demo.&quot; (Trong buá»•i demo).</div>
                        </div>
                        <div>
                          <b>WHILE + Má»‡nh Ä‘á» (S + V):</b> Báº¯t buá»™c cÃ³ chá»§ ngá»¯ vÃ  Ä‘á»™ng tá»«.
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The power went out while we were presenting.&quot;</div>
                        </div>
                      </div>
                    </div>

                    {/* IN TIME vs ON TIME */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase">
                        4. IN TIME vs ON TIME (Ká»‹p giá» vs ÄÃºng giá»)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>ON TIME:</b> ÄÃºng chuáº©n giá» theo lá»‹ch trÃ¬nh quy Ä‘á»‹nh (punctual).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The standup meeting started on time at 9:00.&quot;</div>
                        </div>
                        <div>
                          <b>IN TIME:</b> Ká»‹p giá» trÆ°á»›c khi quÃ¡ muá»™n hoáº·c trÆ°á»›c khi sá»± cá»‘ xáº£y ra.
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;We arrived just in time to stop the faulty deploy.&quot;</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSelectPrepositionLessonById('prepositions-duration-deadlines')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>VÃ o há»c bÃ i thá»±c hÃ nh By vs Until & Deadlines</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: Tech Collocations */}
              {prepositionTab === 'collocations' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    16 cá»¥m Äá»™ng tá»« / TÃ­nh tá»« Ä‘i kÃ¨m giá»›i tá»« cá»‘ Ä‘á»‹nh (Dependent Prepositions) xuáº¥t hiá»‡n dÃ y Ä‘áº·c trong tÃ i liá»‡u ká»¹ thuáº­t, email khÃ¡ch hÃ ng vÃ  há»p standup:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { verb: 'rely on / depend on', meaning: 'phá»¥ thuá»™c, dá»±a vÃ o', ex: 'Our microservice relies on Redis cache.' },
                      { verb: 'consist of', meaning: 'bao gá»“m cÃ¡c pháº§n tá»­', ex: 'The cluster consists of three master nodes.' },
                      { verb: 'adhere to / conform to', meaning: 'tuÃ¢n thá»§ tiÃªu chuáº©n', ex: 'All code must adhere to clean architecture.' },
                      { verb: 'integrate with', meaning: 'tÃ­ch há»£p cÃ¹ng há»‡ thá»‘ng', ex: 'The app integrates seamlessly with Stripe.' },
                      { verb: 'deploy to / onto', meaning: 'triá»ƒn khai lÃªn mÃ¡y chá»§', ex: 'We deploy the build onto production.' },
                      { verb: 'merge into', meaning: 'gá»™p nhÃ¡nh vÃ o', ex: 'Merge your pull request into main.' },
                      { verb: 'subscribe to', meaning: 'Ä‘Äƒng kÃ½ theo dÃµi sá»± kiá»‡n', ex: 'Frontend subscribes to the WebSocket channel.' },
                      { verb: 'responsible for', meaning: 'chá»‹u trÃ¡ch nhiá»‡m vá»', ex: 'He is responsible for database backups.' },
                      { verb: 'proficient in', meaning: 'thÃ nh tháº¡o ká»¹ nÄƒng/ngÃ´n ngá»¯', ex: 'She is highly proficient in TypeScript.' },
                      { verb: 'compatible with', meaning: 'tÆ°Æ¡ng thÃ­ch vá»›i', ex: 'Is this library compatible with Next.js 16?' },
                      { verb: 'capable of', meaning: 'cÃ³ kháº£ nÄƒng lÃ m gÃ¬', ex: 'The engine is capable of 10k req/sec.' },
                      { verb: 'dive deep into', meaning: 'Ä‘i sÃ¢u phÃ¢n tÃ­ch ká»¹ lÆ°á»¡ng', ex: 'Let us dive deep into the crash logs.' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {item.verb}
                          </span>
                          <span className="text-[12px] leading-tight bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 min-h-[24px] inline-flex items-center rounded text-slate-700 dark:text-slate-300">
                            {item.meaning}
                          </span>
                        </div>
                        <div className="text-[12px] text-slate-600 dark:text-slate-300 italic flex items-center justify-between">
                          <span>&quot;{item.ex}&quot;</span>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              speakText(item.ex);
                            }}
                            className="text-slate-400 hover:text-emerald-500 p-0.5"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSelectPrepositionLessonById('prepositions-dependent-collocations')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>VÃ o há»c bÃ i thá»±c hÃ nh Cá»¥m Giá»›i Tá»« IT</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 dark:text-slate-400">
                ðŸ’¡ Nháº¥n phÃ­m Esc hoáº·c nÃºt X Ä‘á»ƒ Ä‘Ã³ng cáº©m nang báº¥t ká»³ lÃºc nÃ o.
              </span>
              <button
                onClick={() => setShowPrepositionGuide(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold rounded-xl transition cursor-pointer"
              >
                ÄÃ³ng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

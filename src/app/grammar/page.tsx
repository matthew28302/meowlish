'use client';

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
    // `overflow-x-clip` thay vì `overflow-x-hidden`: hidden làm `overflow-y:
    // visible` tự tính thành `auto` (spec CSS) => root trở thành scroll
    // container, cộng `overscroll-behavior-y: contain` của .custom-scrollbar chặn
    // scroll chaining, nên mobile KHÔNG cuộn được dù nội dung dài 6967px.
    // `clip` không kích hoạt quy tắc đó và vẫn cắt tràn ngang.
    //
    // KHÔNG còn `lg:h-full lg:overflow-y-auto` ở đây: root từng là scroll
    // container thứ 2 lồng trong <main> của AppShell → 3 tầng cuộn (main +
    // grid + 2 cột), và vì root bị co về `h-full` nên <main> không còn gì để
    // cuộn => wheel/touch trên desktop làm trang ĐỨNG YÊN. Nay root cao theo
    // nội dung (`shrink-0`) để <main> (AppShell) là nơi duy nhất cuộn trang.
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-8 flex flex-col shrink-0 space-y-5 overflow-x-clip">
      {/* Header Banner — rút gọn chiều cao (mục tiêu <= 140px @1440) nhưng GIỮ NGUYÊN cả 2 hành động. */}
      <div className="shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold dark:bg-slate-900/20">
              <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Ngữ Pháp Lego Trực Quan & Giới Từ Thực Chiến
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Học Ngữ Pháp Giao Tiếp Không Buồn Ngủ
            </h1>
            <p className="text-emerald-100 text-xs max-w-2xl leading-snug">
              Cấu trúc câu bằng khối Lego trực quan, công thức chuyển thì và cẩm nang giới từ In-On-At cho IT & công sở.
            </p>
          </div>

          {/* 2 hành động: nút mở Cẩm Nang + chip gợi ý bôi đen. Xếp DỌC ở lg để
              nhường chiều ngang cho tiêu đề (1 dòng) — giữ nguyên nội dung. */}
          <div className="flex flex-col items-stretch gap-2 shrink-0 w-full sm:w-auto md:w-auto">
            {/* Action button to open Preposition Master Pyramid */}
            <button
              onClick={() => {
                sound.playClick();
                setShowPrepositionGuide(true);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 min-h-[44px] rounded-2xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <span className="text-base">🔺</span> Cẩm Nang Giới Từ In-On-At
              <span className="bg-rose-500 text-white text-[12px] leading-tight font-black px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-full ml-1 animate-pulse">
                Hot
              </span>
            </button>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-[12px] text-center font-medium dark:bg-slate-900/10">
              💡 Bôi đen bất kỳ từ nào để tra nghĩa & phát âm!
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: Sidebar Lesson Selector + Main Content
          KHÔNG có `lg:overflow-y-auto` ở đây: grid không còn là scroll container
          thứ 2, nội dung bài học chảy theo trang (cuộn 1 chỗ duy nhất: <main>). */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
        {/* Mobile Active Lesson Bar & Dropdown Toggle */}
        <div className="lg:hidden bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">{selectedLesson.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] leading-tight font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Đang học
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
              <span>{isMobileListOpen ? 'Thu gọn' : 'Đổi bài'}</span>
              {isMobileListOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          {isMobileListOpen && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
              💡 Bấm vào một bài học bất kỳ bên dưới để chuyển bài và làm bài tập ngay.
            </p>
          )}
        </div>

        {/* Lesson List Sidebar (Hidden by default on mobile unless toggled open)
            `lg:self-start` là BẮT BUỘC cho sticky: grid item mặc định `stretch`
            sẽ bị kéo cao bằng cột nội dung (4202px) => sticky vô hiệu.
            `lg:max-h-[calc(100dvh-6rem)]` giới hạn chiều cao rail theo scrollport
            thật của <main> (100dvh − header 64px − 16px top − 16px bottom; nếu
            dùng -2rem thì rail dài hơn scrollport 33px và bài cuối bị khuất),
            DANH SÁCH bên trong tự cuộn — nên người dùng luôn nhìn thấy bộ lọc +
            danh sách, không bị bóp còn 6%. */}
        <div
          className={`lg:col-span-4 self-start flex-col space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] ${
            isMobileListOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="shrink-0 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Chủ Điểm Ngữ Pháp
              </h3>
              <span className="text-[12px] leading-tight font-black px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                {filteredLessons.length} bài
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm ngữ pháp (giới từ, thì, mệnh đề...)..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'prepositions', label: '🔺 Giới từ (In-On-At)', highlight: true },
                { id: 'tenses', label: '⏳ Các thì' },
                { id: 'other', label: '⚙️ Cấu trúc khác' },
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
                  {lvl === 'All' ? 'Tất cả' : lvl === 'Beginner' ? 'Cơ bản' : lvl === 'Intermediate' ? 'Trung cấp' : 'Nâng cao'}
                </button>
              ))}
            </div>
          </div>

          {/* Lessons List — nguồn cuộn thứ 2 (duy nhất) và CHỈ ở lg.
              KHÔNG dùng `.custom-scrollbar` ở đây: class đó kèm
              `overscroll-behavior-y: contain` sẽ chặn scroll chaining, kéo tới
              đáy danh sách là trang đứng yên (đúng triệu chứng "kéo chỉ hiện
              1 phần nhỏ"). `overflow-y-auto` trần giữ scroll chaining về <main>. */}
          <div className="space-y-2 pb-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {filteredLessons.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Không tìm thấy chủ điểm phù hợp</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLevelFilter('All');
                    setCategoryFilter('all');
                  }}
                  className="mt-2 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer inline-flex items-center min-h-[44px]"
                >
                  Đặt lại bộ lọc
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
                            GIỚI TỪ
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

        {/* Selected Lesson Content — bỏ `lg:overflow-y-auto lg:h-full`: cột này cao
            4202px nên bị nhốt trong khung 487px (chỉ thấy 12%). Nay cao theo nội
            dung và trôi theo trang; cuộn 1 chỗ duy nhất là <main> của AppShell. */}
        <div className="lg:col-span-8 space-y-6 pb-6">
          {/* Section 1: Lego Grammar Blocks */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Mô Hình Khối Lego Trực Quan
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
                <Volume2 className="w-4 h-4" /> Phát Âm Toàn Câu
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedLesson.summary}
            </p>

            {/* Visual Lego Blocks Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                <span>🧩 Bấm vào từng khối Lego để phân tích chuyên sâu vai trò ngữ pháp:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedLesson.legoExample.blocks.length} Khối Lego
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
                          title="Nghe phát âm khối này"
                          aria-label={`Nghe phát âm khối ${block.word}`}
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
                        🔍 Phân Tích Khối #{selectedBlockIdx + 1}: &quot;{selectedLesson.legoExample.blocks[selectedBlockIdx].word}&quot;
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
                    <b>Chức năng:</b> {selectedLesson.legoExample.blocks[selectedBlockIdx].explanation}
                  </p>
                </div>
              )}

              {/* Translation bar */}
              <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 italic flex items-center gap-1.5">
                <span>🇻🇳 Ý nghĩa:</span> &quot;{selectedLesson.legoExample.translation}&quot;
              </div>
            </div>

            {/* Section 2: Interactive Tense Switcher */}
            {selectedLesson.tenseVariants && selectedLesson.tenseVariants.length > 0 && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  Công Tắc Chuyển Thì / Biến Thể Cấu Trúc (Tense Switcher):
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
                        📐 Công thức: {selectedLesson.tenseVariants[activeTenseIdx].formula}
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          speakText(selectedLesson.tenseVariants![activeTenseIdx].sentence);
                        }}
                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer font-bold dark:text-emerald-300 min-h-[44px] px-2 -mr-2 shrink-0"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Nghe phát âm
                      </button>
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      &quot;{selectedLesson.tenseVariants[activeTenseIdx].sentence}&quot;
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      🇻🇳 {selectedLesson.tenseVariants[activeTenseIdx].translation}
                    </div>
                    <div className="text-[12px] text-emerald-800 dark:text-emerald-300 italic pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                      💡 Khi nào dùng: {selectedLesson.tenseVariants[activeTenseIdx].usageContext}
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
                <span className="text-xl">📐</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Hướng Dẫn & Quy Tắc Ngữ Pháp Chi Tiết
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nắm chắc triết lý vận hành để ghép câu tự nhiên, phản xạ tức thì mà không cần dịch từng từ.
                  </p>
                </div>
              </div>

              {/* Core Rule Highlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-400/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" /> Nguyên Lý Cốt Lõi:
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {selectedLesson.detailedGuide.coreRule}
                </p>
              </div>

              {/* Formula Breakdown Table */}
              {selectedLesson.detailedGuide.formulaBreakdown && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Phân Tích Chi Tiết Từng Thành Phần:
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
                    <Lightbulb className="w-4 h-4 text-amber-500" /> Mẹo Vàng Phản Xạ Giao Tiếp:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pl-2">
                    {selectedLesson.detailedGuide.goldenTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
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
                    Bảng Tra Cứu Nhanh Mẫu Câu:
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                          <th className="p-2.5 font-bold">Phân Loại</th>
                          <th className="p-2.5 font-bold">Giới Từ / Cụm Từ</th>
                          <th className="p-2.5 font-bold">Ví Dụ Mẫu</th>
                          <th className="p-2.5 font-bold">Ghi Chú</th>
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
              <span className="text-lg">💬</span> Hội Thoại Mẫu Thực Tế (IT & Công Sở Đời Thực)
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
                        title="Nghe phát âm"
                        aria-label={`Nghe phát âm ${item.text}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      &quot;{item.text}&quot;
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      🇻🇳 {item.translation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Common Mistakes */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">⚠️</span> Lỗi Sai Người Việt Hay Gặp Phải
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
                    Thực Hành Chuyên Sâu: Bài Tập Củng Cố Kiến Thức
                  </h3>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    {selectedLesson.quickQuiz.length} bài tập
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lượng bài tập phong phú giúp bạn hoàn toàn làm chủ chủ điểm ngữ pháp này qua các tình huống thực tế.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900/60">
                  +25 EXP / câu
                </span>
                {Object.keys(quizSubmitted).length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setQuizAnswers({});
                      setQuizSubmitted({});
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 cursor-pointer transition"
                    title="Làm lại tất cả câu hỏi"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Làm lại
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
                      Tiến độ làm bài: <span className="text-emerald-600 dark:text-emerald-400 font-black">{submittedCount}/{totalQ}</span> câu
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Đúng: <span className="text-emerald-600 dark:text-emerald-400 font-black">{correctCount}</span> | Sai: <span className="text-rose-600 dark:text-rose-400 font-black">{submittedCount - correctCount}</span> ({percent}%)
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
                          title={`Câu ${idx + 1}`}
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
                          {correctCount >= Math.ceil(totalQ * 0.75) ? '🏆' : '💪'}
                        </span>
                        <span>
                          {correctCount >= Math.ceil(totalQ * 0.75)
                            ? `Xuất sắc! Bạn đã hoàn thành toàn bộ bài tập với độ chính xác ${(correctCount / totalQ * 100).toFixed(0)}%! (+${correctCount * 25} EXP)`
                            : `Bạn đã hoàn thành bài tập (${correctCount}/${totalQ} câu đúng). Hãy xem lại các giải thích để củng cố kiến thức nhé!`}
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
                        Thử lại
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
                          Câu {qIdx + 1}:
                        </span>
                        {quiz.question}
                      </div>
                      {isSubmitted && (
                        <span className={`text-[12px] leading-tight font-black px-2 py-0.5 min-h-[24px] inline-flex items-center rounded-md shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {isCorrect ? 'ĐÚNG +25 EXP' : 'CHƯA ĐÚNG'}
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
                            // Đáp án 1 dòng = 44px, 2 dòng = 49px (mục tiêu ~48):
                            // `py-1.5` + `min-h-[44px]` + `items-center` (bọc trong
                            // 1 span để chữ vẫn xuống dòng tự nhiên nhưng canh
                            // giữa theo chiều cao). Trước đây `p-3` khiến nút
                            // 60px cho đáp án ngắn — thấy "đeo", khó bấm đúng ý.
                            // `break-words` + không set height cứng => đáp án dài
                            // 3 dòng KHÔNG bị cắt chữ.
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
                              <span>Giải thích chuẩn xác:</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0 dark:text-rose-300" />
                              <span>Đáp án đúng là {String.fromCharCode(65 + quiz.correctIndex)}:</span>
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
                <span className="text-2xl shrink-0">🔺</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-black tracking-tight leading-tight truncate">
                    Cẩm Nang Kim Tự Tháp Giới Từ In - On - At
                  </h3>
                  <p className="text-[12px] sm:text-xs text-emerald-100 truncate">
                    Tuyệt chiêu làm chủ giới từ thời gian, địa điểm & cụm từ công sở
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrepositionGuide(false)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer shrink-0 touch-manipulation dark:bg-slate-900/20 hover:dark:bg-slate-900/30"
                title="Đóng"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2 gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
              {[
                { id: 'time', label: '⏳ Thời Gian', icon: Clock },
                { id: 'place', label: '📍 Địa Điểm', icon: MapPin },
                { id: 'deadlines', label: '⏱️ By vs Until', icon: Zap },
                { id: 'collocations', label: '💻 16 Cụm IT', icon: Compass },
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
                    💡 <b>Quy Tắc Kim Tự Tháp Ngược (Time Pyramid):</b> Hãy hình dung từ đáy rộng nhất thuôn dần lên đỉnh nhọn. Khoảng thời gian càng rộng lớn, dùng <b>IN</b>; thu hẹp xuống ngày cụ thể 24h, dùng <b>ON</b>; hội tụ tại khoảnh khắc/giờ giấc chính xác, dùng <b>AT</b>.
                  </div>

                  {/* Visual 3-Tier Time Pyramid */}
                  <div className="space-y-3">
                    {/* Layer 1: IN (General / Big) */}
                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                            TẦNG 1: IN (RỘNG NHẤT - GENERAL)
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Thế kỷ, Thập kỷ, Năm, Tháng, Mùa, Buổi trong ngày</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50">
                          <b>Tháng & Năm:</b> <i>in 2026, in December, in November 2024</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50">
                          <b>Mùa:</b> <i>in the summer, in winter, in spring</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50">
                          <b>Buổi trong ngày:</b> <i>in the morning, in the afternoon, in the evening</i>
                        </div>
                      </div>
                    </div>

                    {/* Layer 2: ON (More Specific / Day) */}
                    <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800/80 space-y-2 mx-auto w-[92%]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-200">
                            TẦNG 2: ON (CỤ THỂ HƠN - SPECIFIC DAYS)
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ngày trong tuần, Ngày tháng cụ thể, Dịp lễ có chữ &quot;Day&quot;</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50">
                          <b>Thứ trong tuần:</b> <i>on Monday, on Friday morning, on weekdays</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50">
                          <b>Ngày tháng:</b> <i>on October 24th, on July 4th</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/50">
                          <b>Có chữ &quot;Day&quot;:</b> <i>on Christmas Day, on New Year&apos;s Day, on my birthday</i>
                        </div>
                      </div>
                    </div>

                    {/* Layer 3: AT (Very Specific / Precise) */}
                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800/80 space-y-2 mx-auto w-[82%]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                            TẦNG 3: AT (CHÍNH XÁC NHẤT - PRECISE TIME)
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Giờ giấc từng phút, Khoảnh khắc bấm đồng hồ, Ban đêm</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50">
                          <b>Giờ chính xác:</b> <i>at 9:00 AM, at 2:30 PM, at 5 o&apos;clock</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50">
                          <b>Khoảnh khắc:</b> <i>at noon, at midnight, at lunchtime, at sunset</i>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50">
                          <b>Đêm & Dịp lễ:</b> <i>at night, at Christmas (không có Day), at the moment</i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSelectPrepositionLessonById('prepositions-time-in-on-at')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Vào học bài thực hành Giới Từ Thời Gian</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Place & Digital Pyramid */}
              {prepositionTab === 'place' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    📍 <b>Kim Tự Tháp Địa Điểm Thực & Không Gian Số:</b> Tương tự Thời gian, không gian vật lý và phần mềm cũng chia làm 3 tầng: <b>IN</b> (bên trong khối 3D hoặc database), <b>ON</b> (bề mặt phẳng, đường phố, màn hình thiết bị), <b>AT</b> (tọa độ chính xác có số nhà, địa điểm chức năng).
                  </div>

                  <div className="space-y-3">
                    {/* Layer 1: IN (Enclosed space / Area) */}
                    <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 space-y-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        IN: KHÔNG GIAN 3D & NỘI TẠI DỮ LIỆU
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Quốc gia (in Vietnam), Thành phố (in Hanoi), Phòng kín (in the meeting room), Xe nhỏ phải khom lưng (in a taxi, in a car), Bên trong phần mềm (in the database, in the source code, in memory).
                      </p>
                    </div>

                    {/* Layer 2: ON (Surface, Streets, Screens, Digital) */}
                    <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800/80 space-y-2 mx-auto w-[92%]">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-200">
                        ON: BỀ MẶT, ĐƯỜNG PHỐ & NỀN TẢNG SỐ
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Bề mặt phẳng (on the desk, on the wall), Đường phố không số nhà (on Wall Street), Phương tiện công cộng lớn đứng đi lại được (on the bus, on the train, on the airplane), Thiết bị số & Đám mây (on mobile, on the website, on GitHub, on AWS, on YouTube).
                      </p>
                    </div>

                    {/* Layer 3: AT (Exact Address & Landmarks) */}
                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-800/80 space-y-2 mx-auto w-[82%]">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                        AT: TỌA ĐỘ CHÍNH XÁC & ĐỊA ĐIỂM CHỨC NĂNG
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Địa chỉ có số nhà (at 123 Main Street), Điểm mốc cụ thể (at the front door, at the bus stop), Nơi sinh hoạt chức năng (at work, at home, at school, at university), Sự kiện tập trung (at the meeting, at the conference).
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSelectPrepositionLessonById('prepositions-place-location')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Vào học bài thực hành Giới Từ Nơi Chốn</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Tricky Pairs & Deadlines */}
              {prepositionTab === 'deadlines' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Phân biệt các cặp giới từ kinh điển dễ gây nhầm lẫn nhất trong dự án và giao tiếp hằng ngày:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* BY vs UNTIL */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase">
                        1. BY vs UNTIL (Hạn chót vs Kéo dài)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>BY [Time]:</b> Chậm nhất là (hành động xảy ra 1 lần dứt điểm trước mốc đó).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;Please submit the PR by 5 PM.&quot; (Nộp trước hoặc lúc 5h).</div>
                        </div>
                        <div>
                          <b>UNTIL [Time]:</b> Cho tới tận khi (hành động duy trì liên tục).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The server runs until midnight.&quot; (Chạy liên tục tới nửa đêm).</div>
                        </div>
                      </div>
                    </div>

                    {/* FOR vs SINCE */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                        2. FOR vs SINCE (Khoảng thời gian vs Mốc bắt đầu)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>FOR + Khoảng thời gian:</b> Trả lời câu hỏi &quot;How long?&quot; (Bao lâu?).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;I have coded for 4 hours.&quot; (Lập trình suốt 4 tiếng).</div>
                        </div>
                        <div>
                          <b>SINCE + Mốc thời gian:</b> Trả lời câu hỏi &quot;Since when?&quot; (Từ khi nào?).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;I have worked here since 2022.&quot; (Làm từ năm 2022).</div>
                        </div>
                      </div>
                    </div>

                    {/* DURING vs WHILE */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">
                        3. DURING vs WHILE (Trong suốt lúc)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>DURING + Cụm danh từ:</b> Không có động từ chia thì.
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The power went out during the demo.&quot; (Trong buổi demo).</div>
                        </div>
                        <div>
                          <b>WHILE + Mệnh đề (S + V):</b> Bắt buộc có chủ ngữ và động từ.
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The power went out while we were presenting.&quot;</div>
                        </div>
                      </div>
                    </div>

                    {/* IN TIME vs ON TIME */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase">
                        4. IN TIME vs ON TIME (Kịp giờ vs Đúng giờ)
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                        <div>
                          <b>ON TIME:</b> Đúng chuẩn giờ theo lịch trình quy định (punctual).
                          <div className="italic text-slate-500 dark:text-slate-400">&quot;The standup meeting started on time at 9:00.&quot;</div>
                        </div>
                        <div>
                          <b>IN TIME:</b> Kịp giờ trước khi quá muộn hoặc trước khi sự cố xảy ra.
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
                      <span>Vào học bài thực hành By vs Until & Deadlines</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: Tech Collocations */}
              {prepositionTab === 'collocations' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    16 cụm Động từ / Tính từ đi kèm giới từ cố định (Dependent Prepositions) xuất hiện dày đặc trong tài liệu kỹ thuật, email khách hàng và họp standup:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { verb: 'rely on / depend on', meaning: 'phụ thuộc, dựa vào', ex: 'Our microservice relies on Redis cache.' },
                      { verb: 'consist of', meaning: 'bao gồm các phần tử', ex: 'The cluster consists of three master nodes.' },
                      { verb: 'adhere to / conform to', meaning: 'tuân thủ tiêu chuẩn', ex: 'All code must adhere to clean architecture.' },
                      { verb: 'integrate with', meaning: 'tích hợp cùng hệ thống', ex: 'The app integrates seamlessly with Stripe.' },
                      { verb: 'deploy to / onto', meaning: 'triển khai lên máy chủ', ex: 'We deploy the build onto production.' },
                      { verb: 'merge into', meaning: 'gộp nhánh vào', ex: 'Merge your pull request into main.' },
                      { verb: 'subscribe to', meaning: 'đăng ký theo dõi sự kiện', ex: 'Frontend subscribes to the WebSocket channel.' },
                      { verb: 'responsible for', meaning: 'chịu trách nhiệm về', ex: 'He is responsible for database backups.' },
                      { verb: 'proficient in', meaning: 'thành thạo kỹ năng/ngôn ngữ', ex: 'She is highly proficient in TypeScript.' },
                      { verb: 'compatible with', meaning: 'tương thích với', ex: 'Is this library compatible with Next.js 16?' },
                      { verb: 'capable of', meaning: 'có khả năng làm gì', ex: 'The engine is capable of 10k req/sec.' },
                      { verb: 'dive deep into', meaning: 'đi sâu phân tích kỹ lưỡng', ex: 'Let us dive deep into the crash logs.' },
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
                      <span>Vào học bài thực hành Cụm Giới Từ IT</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 dark:text-slate-400">
                💡 Nhấn phím Esc hoặc nút X để đóng cẩm nang bất kỳ lúc nào.
              </span>
              <button
                onClick={() => setShowPrepositionGuide(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ENCYCLOPEDIA_DATA } from '@/lib/data/encyclopedia';
import { sound } from '@/lib/soundFx';
import { speakText } from '@/lib/speech';
import { getStoredUser } from '@/lib/auth';
import {
  BookOpen,
  Search,
  Volume2,
  Bookmark,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Code2,
  Coffee,
  Database
} from 'lucide-react';
import MascotCompanion from '@/components/MascotCompanion';

interface CambridgeSense {
  enDef: string;
  viTrans: string;
  examples: string[];
}

export default function EncyclopediaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeLevel, setActiveLevel] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    if (type === 'success') sound.playSuccess();
    else sound.playWrong();
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 3500);
  };

  // Server Search State (26,500+ words from SQLite)
  const [searchResults, setSearchResults] = useState<{
    total: number;
    page: number;
    totalPages: number;
    items: any[];
  }>({
    total: 26500,
    page: 1,
    totalPages: Math.ceil(26500 / 24),
    items: ENCYCLOPEDIA_DATA,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Live Groq AI Translation State
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [isTranslatingAI, setIsTranslatingAI] = useState<boolean>(false);

  // Live Cambridge Crawler State
  const [crawledResult, setCrawledResult] = useState<any | null>(null);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlerError, setCrawlerError] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const categories = [
    { id: 'all', label: 'Tất Cả Mục Từ (26.500+)', icon: Database },
    { id: 'toeic', label: '🎯 Từ Vựng TOEIC', icon: Briefcase },
    { id: 'vstep', label: '🎓 Từ Vựng VSTEP', icon: GraduationCap },
    { id: 'it-dev', label: '💻 IT: Code & Dev', icon: Code2 },
    { id: 'it-arch', label: '🏗️ IT: Kiến Trúc', icon: Database },
    { id: 'it-scrum', label: '⏱️ IT: Scrum & Agile', icon: Sparkles },
    { id: 'workplace', label: '💼 Công Sở & Họp', icon: Briefcase },
    { id: 'phrasal-verbs', label: '🧩 Phrasal Verbs', icon: Layers },
    { id: 'idioms', label: '💡 Idioms Giao Tiếp', icon: Sparkles },
    { id: 'daily', label: '☕ Đời Sống & Chào Hỏi', icon: Coffee },
  ];

  const levels = ['all', 'A1', 'A2', 'B1', 'B2', 'C1'];

  const quickPicks = [
    'hello',
    'technology',
    'algorithm',
    'collaborate',
    'feasible',
    'ubiquitous',
    'meticulous',
    'resilient',
    'database',
    'refactor',
    'appreciate',
    'experience',
  ];

  // Fetch words from SQLite 26,500 database
  const fetchEntries = async (q: string, cat: string, lvl: string, page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: q.trim(),
        category: cat,
        level: lvl,
        page: String(page),
        limit: '24',
      });
      const res = await fetch(`/api/dictionary/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Fetch dictionary entries error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search trigger when filter or query changes
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchEntries(searchQuery, activeCategory, activeLevel, currentPage);
    }, 200);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, activeCategory, activeLevel, currentPage]);

  // Execute Smart Groq AI Translation API
  const handleAITranslate = async (customQuery?: string) => {
    const q = (customQuery || searchQuery).trim();
    if (!q) return;

    sound.playClick();
    setIsTranslatingAI(true);
    setCrawlerError(null);
    setCrawledResult(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: q }),
      });
      const data = await res.json();

      if (res.ok && data.data) {
        sound.playSuccess();
        setAiResult(data.data);
      } else {
        sound.playError();
        setCrawlerError(data.error || 'Lỗi xử lý dịch thuật AI.');
      }
    } catch {
      sound.playError();
      setCrawlerError('Lỗi kết nối máy chủ dịch thuật AI Groq.');
    } finally {
      setIsTranslatingAI(false);
    }
  };

  // Execute Live Cambridge Crawler API
  const handleCrawl = async (customQuery?: string) => {
    const q = (customQuery || searchQuery).trim().toLowerCase();
    if (!q) return;

    sound.playClick();
    setIsCrawling(true);
    setCrawlerError(null);
    setAiResult(null);

    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.ok && data.entry) {
        sound.playSuccess();
        setCrawledResult(data.entry);
      } else {
        sound.playError();
        setCrawlerError(data.error || `Không tìm thấy từ "${q}" trên Cambridge English-Vietnamese.`);
      }
    } catch {
      setCrawlerError('Lỗi kết nối máy chủ crawler.');
    } finally {
      setIsCrawling(false);
    }
  };

  const handlePlayAudio = (entry: any) => {
    sound.playClick();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (entry.audioUrl) {
      const audio = new Audio(entry.audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        if (audioPlayerRef.current === audio) audioPlayerRef.current = null;
      };
      audio.play().catch(() => speakText(entry.word));
    } else {
      speakText(entry.word);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handleSaveBookmark = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    sound.playClick();
    const currentUser = getStoredUser();

    // Chưa đăng nhập: không gửi request vô nghĩa, báo rõ cho người dùng.
    if (!currentUser) {
      showToast('Vui lòng đăng nhập để lưu từ vựng.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          word: item.word,
          phonetic: item.ipa,
          translation: item.meaningVi,
          contextSentence: item.exampleSentences?.[0]?.en || item.allSenses?.[0]?.examples?.[0] || '',
          note: item.detailedExplanation || 'Được tra cứu từ Bách Khoa Toàn Thư',
          tags: item.category || 'general',
        }),
      });

      if (res.ok) {
        sound.playSuccess();
        setSavedIds((prev) => ({ ...prev, [item.id || item.word]: true }));
        showToast('Đã lưu vào sổ tay của bạn.');
      } else if (res.status === 401 || res.status === 403) {
        // Trước đây nhánh này rơi vào `catch`/không làm gì — người dùng
        // bấm nútBookmark mà không thấy phản hồi nào.
        showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
      } else {
        showToast('Không thể lưu từ vựng. Vui lòng thử lại.', 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ. Vui lòng thử lại.', 'error');
    }
  };

  const displayedItems = searchResults.items.length > 0 ? searchResults.items : ENCYCLOPEDIA_DATA;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12 space-y-8 overflow-x-hidden">
      {/* Toast Notification — feedback cho bookmark/save */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-black flex items-center gap-2 animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-700 border-emerald-400 text-white'
              : 'bg-rose-700 border-rose-400 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-600/15 border-2 border-emerald-400/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide text-white border border-white/25">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" /> BÁCH KHOA TOÀN THƯ TỪ ĐIỂN ANH - VIỆT
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Từ Điển 26.500+ Mục Từ & Cambridge Trực Tiếp
            </h1>
            <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed font-medium">
              Kho dữ liệu khổng lồ <b>26.500+ từ vựng</b> chuẩn quốc tế (TOEIC, VSTEP, IT Dev/Arch/Scrum, giao tiếp đời sống) tích hợp phiên âm IPA, giải nghĩa tiếng Việt chi tiết, ví dụ song ngữ, phát âm bản xứ và crawler trực tiếp từ <b>Cambridge Dictionary</b>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              href="/bookmarks"
              onClick={() => sound.playClick()}
              className="btn-3d btn-3d-amber px-4 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer dark:text-slate-200"
            >
              <Bookmark className="w-4 h-4" /> Sổ Bookmark
            </Link>
            <Link
              href="/flashcards"
              onClick={() => sound.playClick()}
              className="btn-3d btn-3d-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-md cursor-pointer dark:text-slate-200"
            >
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Lật Flashcard 3D
            </Link>
          </div>
        </div>
      </div>

      {/* Instant Search Bar + Fast Cambridge Crawler Action */}
      <div className="card-playful p-5 sm:p-6 border-2 border-emerald-100 bg-white shadow-sm space-y-4 dark:border-emerald-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-emerald-600 dark:text-emerald-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAITranslate();
                }
              }}
              placeholder="Nhập từ hoặc câu/đoạn văn tiếng Anh để AI dịch & giải nghĩa (VD: bottleneck, I am swamped...)"
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white transition dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCrawledResult(null);
                  setAiResult(null);
                  setCurrentPage(1);
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer hover:dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAITranslate()}
              disabled={isTranslatingAI || !searchQuery.trim()}
              className="btn-3d btn-3d-emerald px-5 py-3 min-h-[44px] text-xs font-black shadow-md cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 touch-manipulation"
              title="Dịch thuật thông minh & giải nghĩa chuẩn ngữ cảnh bằng Groq AI siêu tốc"
            >
              {isTranslatingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> Đang dịch AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> Dịch AI (Groq)
                </>
              )}
            </button>

            <button
              onClick={() => handleCrawl()}
              disabled={isCrawling || !searchQuery.trim()}
              className="btn-3d btn-3d-white px-4 py-3 min-h-[44px] text-xs font-black shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50 text-slate-700 hover:text-emerald-700 border border-slate-300 flex items-center gap-1.5 touch-manipulation dark:text-slate-300 hover:dark:text-emerald-300 dark:border-white/10"
              title="Crawl định nghĩa từ từ điển Cambridge"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-300" /> Crawling...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Cambridge
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Pick Words Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-slate-500 font-black flex items-center gap-1 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Thử tra nhanh bằng AI:
          </span>
          {quickPicks.map((word) => (
            <button
              key={word}
              onClick={() => {
                setSearchQuery(word);
                setCurrentPage(1);
                sound.playClick();
                handleAITranslate(word);
              }}
              className="lego-chip text-xs py-1 px-3 hover:border-emerald-500 font-semibold"
            >
              {word}
            </button>
          ))}
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setActiveCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Level Filters & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Cấp độ CEFR:
            </span>
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  sound.playClick();
                  setActiveLevel(lvl);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[12px] ${
                  activeLevel === lvl
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:bg-white/10'
                }`}
              >
                {lvl === 'all' ? 'Tất cả' : lvl}
              </button>
            ))}
          </div>

          <div className="text-slate-500 text-xs font-bold flex items-center gap-1.5 dark:text-slate-400">
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-300" />}
            <span>Tìm thấy <b>{searchResults.total.toLocaleString()}</b> mục từ</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950 dark:border-emerald-800">
              ⚡ SQLite Cache 0.1ms
            </span>
          </div>
        </div>
      </div>

      {/* Groq AI Smart Translation & Analysis Card */}
      {aiResult && (
        <div className="bg-gradient-to-br from-indigo-50/90 via-sky-50/70 to-emerald-50/90 border-2 border-indigo-300 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 animate-in fade-in duration-200 dark:border-indigo-800 dark:from-indigo-950 dark:via-sky-950 dark:to-emerald-950">
          {aiResult.isSentence ? (
            /* ================= FULL SENTENCE / IDIOM TRANSLATION ================= */
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Bản Dịch Ngữ Cảnh Tự Nhiên (Groq AI)
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800">
                      Sắc thái: {aiResult.tone}
                    </span>
                    {aiResult.source === 'cache' && (
                      <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold dark:text-amber-200 dark:bg-amber-900">
                        ⚡ SQLite Cache 0.1ms
                      </span>
                    )}
                  </div>

                  <div className="text-lg sm:text-xl font-bold text-slate-800 italic pt-1 dark:text-slate-200">
                    &quot;{aiResult.originalText}&quot;
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => speakText(aiResult.originalText)}
                    className="btn-3d btn-3d-emerald px-4 py-2 text-xs font-black shadow-md cursor-pointer"
                    title="Nghe phát âm cả câu"
                  >
                    <Volume2 className="w-4 h-4" /> Nghe Câu
                  </button>
                  <button
                    onClick={(e) =>
                      handleSaveBookmark(e, {
                        id: `ai-sentence-${Date.now()}`,
                        word: aiResult.originalText.length > 50 ? aiResult.originalText.slice(0, 48) + '...' : aiResult.originalText,
                        ipa: `[${aiResult.tone}]`,
                        meaningVi: aiResult.vietnameseTranslation,
                        detailedExplanation: aiResult.nuanceExplanation,
                        category: 'groq_ai_sentence',
                        exampleSentences: [],
                      })
                    }
                    className="btn-3d btn-3d-white px-4 py-2 text-xs font-black text-slate-800 shadow-md cursor-pointer dark:text-slate-200"
                  >
                    <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-300" /> Lưu Bookmark
                  </button>
                </div>
              </div>

              {/* Natural Vietnamese Translation */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-indigo-200 shadow-xs space-y-2 dark:bg-slate-900 dark:border-indigo-800">
                <div className="text-xs font-black text-indigo-600 uppercase tracking-wider dark:text-indigo-300">
                  🇻🇳 Bản dịch tiếng Việt tự nhiên:
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-900 leading-snug dark:text-slate-100">
                  {aiResult.vietnameseTranslation}
                </div>
              </div>

              {/* Communicative Nuance & Idioms Explanation */}
              {aiResult.nuanceExplanation && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1 dark:border-amber-800 dark:text-amber-200">
                  <div className="font-black text-amber-900 flex items-center gap-1.5 dark:text-amber-200">
                    <span>💡 Phân tích sắc thái giao tiếp & ngữ cảnh:</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    {aiResult.nuanceExplanation}
                  </p>
                </div>
              )}

              {/* Key Phrases Breakdown */}
              {aiResult.keyPhrases && aiResult.keyPhrases.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Các cụm từ & thành ngữ then chốt trong câu:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {aiResult.keyPhrases.map((kp: any, kIdx: number) => (
                      <div key={kIdx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-xs dark:bg-slate-900 dark:border-white/10">
                        <div className="font-bold text-indigo-700 flex items-center justify-between dark:text-indigo-300">
                          <span>{kp.en}</span>
                          <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">→ {kp.vi}</span>
                        </div>
                        {kp.explanation && (
                          <div className="text-[12px] text-slate-500 italic dark:text-slate-400">
                            {kp.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Styles (Casual vs Formal) */}
              {aiResult.alternativeTranslations && aiResult.alternativeTranslations.length > 0 && (
                <div className="p-4 bg-white/80 rounded-2xl border border-slate-200 space-y-2 text-xs dark:bg-slate-900/80 dark:border-white/10">
                  <div className="font-black text-slate-700 dark:text-slate-300">Các cách diễn đạt tương đương:</div>
                  <div className="space-y-1.5">
                    {aiResult.alternativeTranslations.map((alt: any, aIdx: number) => (
                      <div key={aIdx} className="flex items-start gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[12px] shrink-0 dark:bg-slate-800 dark:text-slate-300">
                          {alt.style}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">&quot;{alt.text}&quot;</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ================= SINGLE WORD / TERM DICTIONARY ================= */
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Giải Nghĩa Chuyên Sâu (Groq AI)
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                      {aiResult.partOfSpeech}
                    </span>
                    {aiResult.source === 'cache' && (
                      <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold dark:text-amber-200 dark:bg-amber-900">
                        ⚡ SQLite Cache 0.1ms
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 dark:text-slate-100">
                    {aiResult.word}
                  </h2>
                  <div className="text-base font-ipa text-emerald-700 mt-1 font-semibold tracking-wide dark:text-emerald-300">
                    {aiResult.ipa}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => speakText(aiResult.word)}
                    className="btn-3d btn-3d-emerald px-4 py-2.5 text-xs font-black shadow-md cursor-pointer"
                    title="Phát âm chuẩn (TTS)"
                  >
                    <Volume2 className="w-4 h-4" /> Nghe Phát Âm
                  </button>
                  <button
                    onClick={(e) =>
                      handleSaveBookmark(e, {
                        id: `ai-${aiResult.word}`,
                        word: aiResult.word,
                        ipa: aiResult.ipa,
                        meaningVi: aiResult.meaningVi,
                        detailedExplanation: aiResult.detailedExplanation,
                        category: 'groq_ai',
                        exampleSentences: aiResult.exampleSentences,
                      })
                    }
                    className="btn-3d btn-3d-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-md cursor-pointer dark:text-slate-200"
                  >
                    <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Lưu Bookmark
                  </button>
                </div>
              </div>

              {/* Primary Meaning */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-200 space-y-1.5 shadow-xs dark:bg-slate-900 dark:border-emerald-800">
                <div className="text-xs font-black text-emerald-700 uppercase tracking-wider dark:text-emerald-300">
                  🇻🇳 Nghĩa tiếng Việt chuẩn ngữ cảnh:
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  {aiResult.meaningVi}
                </div>
                {aiResult.detailedExplanation && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium pt-1 border-t border-slate-100 dark:text-slate-400 dark:border-white/10">
                    {aiResult.detailedExplanation}
                  </p>
                )}
              </div>

              {/* Common Collocations */}
              {aiResult.collocations && aiResult.collocations.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-black text-slate-600 uppercase tracking-wider dark:text-slate-400">
                    Cụm từ thường đi kèm (Collocations):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.collocations.map((col: string, cIdx: number) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          setSearchQuery(col);
                          handleAITranslate(col);
                        }}
                        className="lego-chip text-xs py-1 px-3 bg-white hover:border-emerald-500 font-bold text-slate-700 cursor-pointer dark:bg-slate-900 dark:text-slate-300"
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Sentences */}
              {aiResult.exampleSentences && aiResult.exampleSentences.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-600 uppercase tracking-wider dark:text-slate-400">
                    Mẫu câu ví dụ song ngữ thực tế:
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {aiResult.exampleSentences.map((eg: any, eIdx: number) => (
                      <div key={eIdx} className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs space-y-1 shadow-xs dark:bg-slate-900 dark:border-white/10">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800 text-sm dark:text-slate-200">
                            &quot;{eg.en}&quot;
                          </span>
                          <button
                            onClick={() => speakText(eg.en)}
                            className="p-1 hover:bg-slate-100 rounded text-emerald-600 cursor-pointer shrink-0 hover:dark:bg-slate-800 dark:text-emerald-300"
                            title="Nghe câu"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-emerald-700 font-medium dark:text-emerald-300">
                          → {eg.vi}
                        </div>
                        {eg.context && (
                          <div className="text-[12px] text-slate-400 font-bold">
                            Ngữ cảnh: {eg.context}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedagogical Pro Tips */}
              {aiResult.proTips && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1 dark:border-amber-800 dark:text-amber-200">
                  <div className="font-black text-amber-900 flex items-center gap-1.5 dark:text-amber-200">
                    <span>💡 Bí quyết sư phạm & lưu ý giao tiếp:</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    {aiResult.proTips}
                  </p>
                </div>
              )}

              {/* Synonyms */}
              {aiResult.synonyms && aiResult.synonyms.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Từ đồng nghĩa:</span>
                  {aiResult.synonyms.map((syn: string, sIdx: number) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        setSearchQuery(syn);
                        handleAITranslate(syn);
                      }}
                      className="px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-slate-300"
                    >
                      {syn}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Crawled Cambridge Result Card (Hero Banner) */}
      {crawledResult && (
        <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-sky-50/80 border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-200 dark:from-emerald-950 dark:via-teal-950 dark:to-sky-950 dark:border-emerald-800">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kết quả trực tiếp từ Cambridge English-Vietnamese
                </span>
                {crawledResult.source === 'cache' && (
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold dark:text-amber-200 dark:bg-amber-900">
                    ⚡ SQLite Cache 0.1ms
                  </span>
                )}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 dark:text-slate-100">
                {crawledResult.word}
              </h2>
              <div className="text-base font-ipa text-emerald-700 mt-1 font-semibold tracking-wide dark:text-emerald-300">
                {crawledResult.ipa} • <span className="italic text-slate-600 font-sans text-sm dark:text-slate-400">{crawledResult.partOfSpeech}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => handlePlayAudio(crawledResult)}
                className="btn-3d btn-3d-emerald px-4 py-2.5 text-xs font-black shadow-md cursor-pointer"
                title="Phát âm bản xứ"
              >
                <Volume2 className="w-4 h-4" /> Nghe Phát Âm
              </button>
              <button
                onClick={(e) => handleSaveBookmark(e, crawledResult)}
                className="btn-3d btn-3d-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-md cursor-pointer dark:text-slate-200"
              >
                <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Lưu Bookmark
              </button>
            </div>
          </div>

          {/* Primary Meaning */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-200 space-y-1.5 shadow-xs dark:bg-slate-900 dark:border-emerald-800">
            <div className="text-base font-black text-emerald-800 flex items-center gap-1.5 dark:text-emerald-200">
              <span>🇻🇳 Định nghĩa tiếng Việt:</span>
              <span>{crawledResult.meaningVi}</span>
            </div>
            {crawledResult.detailedExplanation && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium dark:text-slate-400">
                {crawledResult.detailedExplanation}
              </p>
            )}
          </div>

          {/* Senses & Real Cambridge Examples */}
          {crawledResult.allSenses && crawledResult.allSenses.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Các ngữ nghĩa và ví dụ câu (Cambridge Crawler):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {crawledResult.allSenses.map((sense: CambridgeSense, sIdx: number) => (
                  <div
                    key={sIdx}
                    className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs shadow-xs dark:bg-slate-900 dark:border-white/10"
                  >
                    <div className="font-black text-emerald-700 text-sm dark:text-emerald-300">
                      {sIdx + 1}. {sense.viTrans || sense.enDef}
                    </div>
                    {sense.enDef && (
                      <p className="text-slate-500 italic font-medium dark:text-slate-400">
                        {sense.enDef}
                      </p>
                    )}
                    {sense.examples && sense.examples.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-white/10">
                        {sense.examples.map((eg, egIdx) => (
                          <div
                            key={egIdx}
                            className="p-2 rounded-xl bg-slate-50 flex items-start justify-between gap-2 dark:bg-slate-900"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              &quot;{eg}&quot;
                            </span>
                            <button
                              onClick={() => {
                                sound.playClick();
                                speakText(eg);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer shrink-0 dark:text-emerald-300 hover:dark:text-emerald-300"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crawler Error Notice */}
      {crawlerError && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
          ⚠️ {crawlerError}
        </div>
      )}

      {/* Vocabulary Grid (26,500+ Items) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>
            Hiển thị trang <b>{searchResults.page}</b> / <b>{searchResults.totalPages || 1}</b> (
            {searchResults.total.toLocaleString()} từ vựng phù hợp)
          </span>
          {isLoading && (
            <span className="text-emerald-600 flex items-center gap-1 dark:text-emerald-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedItems.map((item) => {
            const isSaved = savedIds[item.id || item.word];
            return (
              <div
                key={item.id || item.word}
                onClick={() => setSelectedEntry(item)}
                className="card-arcade card-arcade-emerald p-5 flex flex-col justify-between space-y-4 cursor-pointer group content-auto transform-gpu"
              >
                <div className="space-y-3">
                  {/* Top Word & IPA */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors dark:text-slate-100 group-hover:dark:text-emerald-300">
                          {item.word}
                        </h3>
                        <span className="text-[12px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                          {item.level || 'B1'}
                        </span>
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10">
                          {item.categoryLabel?.split(' ')[0] || '📖'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-ipa mt-0.5 font-semibold tracking-wide dark:text-slate-400">
                        {item.ipa} • <span className="italic text-slate-600 font-sans dark:text-slate-400">{item.partOfSpeech}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(item);
                        }}
                        title="Nghe phát âm chuẩn"
                        className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-700 cursor-pointer transition hover:dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vietnamese Meaning Badge */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 dark:bg-emerald-950 dark:border-emerald-800">
                    <div className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                      🇻🇳 {item.meaningVi}
                    </div>
                  </div>

                  {/* Deep explanation preview */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium dark:text-slate-400">
                    {item.detailedExplanation}
                  </p>

                  {/* Collocations tags */}
                  {item.collocations && item.collocations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.collocations.slice(0, 3).map((col: string, cIdx: number) => (
                        <span
                          key={cIdx}
                          className="text-[12px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs dark:border-white/10">
                  <span className="text-[12px] font-bold text-slate-500 group-hover:text-emerald-700 flex items-center gap-1 transition-colors dark:text-slate-400 group-hover:dark:text-emerald-300">
                    Chi tiết & ví dụ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleSaveBookmark(e, item)}
                    className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isSaved
                        ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950'
                        : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 hover:dark:text-emerald-300 hover:dark:bg-emerald-950'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-600 text-emerald-600 dark:text-emerald-300' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar */}
        {searchResults.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-4">
            <button
              onClick={() => {
                sound.playClick();
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage <= 1}
              className="btn-3d btn-3d-white px-3 py-2 text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Trang trước
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                Trang {currentPage} / {searchResults.totalPages}
              </span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setCurrentPage((p) => Math.min(searchResults.totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage >= searchResults.totalPages}
              className="btn-3d btn-3d-white px-3 py-2 text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              Trang sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detailed Modal When Clicking an Entry */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-[calc(100vw-24px)] sm:w-full p-5 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl dark:bg-slate-900 dark:border-white/10">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                    {selectedEntry.categoryLabel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
                    Level {selectedEntry.level}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 truncate dark:text-slate-100">
                  {selectedEntry.word}
                </h2>
                <div className="text-sm sm:text-base font-ipa text-emerald-700 mt-1 font-semibold tracking-wide dark:text-emerald-300">
                  {selectedEntry.ipa} • <span className="italic text-slate-600 font-sans text-xs sm:text-sm dark:text-slate-400">{selectedEntry.partOfSpeech}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(selectedEntry)}
                  className="w-11 h-11 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 rounded-2xl text-emerald-800 cursor-pointer transition shadow-xs touch-manipulation dark:bg-emerald-950 dark:text-emerald-200"
                  title="Nghe phát âm bản xứ"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 hover:text-slate-800 cursor-pointer transition touch-manipulation dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-slate-400 hover:dark:text-slate-200"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Meaning Box */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2 dark:bg-emerald-950 dark:border-emerald-800">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                Định nghĩa tiếng Việt:
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                🇻🇳 {selectedEntry.meaningVi}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium dark:text-slate-300">
                {selectedEntry.detailedExplanation}
              </p>
            </div>

            {/* Example Sentences */}
            {selectedEntry.exampleSentences && selectedEntry.exampleSentences.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ví dụ thực tế song ngữ Anh - Việt:
                </div>
                <div className="space-y-2">
                  {selectedEntry.exampleSentences.map((eg: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 dark:bg-slate-900 dark:border-white/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          &quot;{eg.en}&quot;
                        </span>
                        <button
                          onClick={() => {
                            sound.playClick();
                            speakText(eg.en);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 p-1 cursor-pointer shrink-0 dark:text-emerald-300 hover:dark:text-emerald-300"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 font-medium dark:text-slate-400">
                        {eg.vi}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collocations */}
            {selectedEntry.collocations && selectedEntry.collocations.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cụm từ thường đi kèm (Collocations):
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.collocations.map((col: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-white/10"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Cambridge External Link */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs dark:bg-slate-900 dark:border-white/10">
              <span className="text-slate-600 font-medium dark:text-slate-400">
                Tra cứu sâu hơn trên Cambridge English-Vietnamese:
              </span>
              <a
                href={`https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(
                  selectedEntry.word.toLowerCase()
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline dark:text-emerald-300"
              >
                Mở Cambridge <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleSaveBookmark(e, selectedEntry)}
                className="btn-3d btn-3d-amber px-5 py-2.5 text-xs font-black text-slate-950 cursor-pointer dark:text-slate-200"
              >
                <Bookmark className="w-4 h-4" /> Lưu vào Sổ Từ
              </button>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="btn-3d btn-3d-white px-5 py-2.5 text-xs font-bold text-slate-800 cursor-pointer dark:text-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mascot Companion Floating Support */}
      <MascotCompanion message="Bạn đang mở Bách Khoa Toàn Thư 26.500+ từ vựng! Tìm bất cứ từ nào hoặc lọc theo TOEIC, VSTEP, IT để học nha!" />
    </div>
  );
}

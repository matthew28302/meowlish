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

export const metadata: Metadata = {
  title: 'Bách Khoa Toàn Thư Tiếng Anh 26.500+ Từ - Meowlish',
  description: 'Tra cứu từ vựng tiếng Anh với phiên âm IPA, giải nghĩa chi tiết, collocations, ví dụ tình huống IT và đời sống. Lưu từ vào sổ tay cá nhân.',
};

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
    { id: 'all', label: 'Táº¥t Cáº£ Má»¥c Tá»« (26.500+)', icon: Database },
    { id: 'toeic', label: 'ðŸŽ¯ Tá»« Vá»±ng TOEIC', icon: Briefcase },
    { id: 'vstep', label: 'ðŸŽ“ Tá»« Vá»±ng VSTEP', icon: GraduationCap },
    { id: 'it-dev', label: 'ðŸ’» IT: Code & Dev', icon: Code2 },
    { id: 'it-arch', label: 'ðŸ—ï¸ IT: Kiáº¿n TrÃºc', icon: Database },
    { id: 'it-scrum', label: 'â±ï¸ IT: Scrum & Agile', icon: Sparkles },
    { id: 'workplace', label: 'ðŸ’¼ CÃ´ng Sá»Ÿ & Há»p', icon: Briefcase },
    { id: 'phrasal-verbs', label: 'ðŸ§© Phrasal Verbs', icon: Layers },
    { id: 'idioms', label: 'ðŸ’¡ Idioms Giao Tiáº¿p', icon: Sparkles },
    { id: 'daily', label: 'â˜• Äá»i Sá»‘ng & ChÃ o Há»i', icon: Coffee },
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
        setCrawlerError(data.error || 'Lá»—i xá»­ lÃ½ dá»‹ch thuáº­t AI.');
      }
    } catch {
      sound.playError();
      setCrawlerError('Lá»—i káº¿t ná»‘i mÃ¡y chá»§ dá»‹ch thuáº­t AI Groq.');
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
        setCrawlerError(data.error || `KhÃ´ng tÃ¬m tháº¥y tá»« "${q}" trÃªn Cambridge English-Vietnamese.`);
      }
    } catch {
      setCrawlerError('Lá»—i káº¿t ná»‘i mÃ¡y chá»§ crawler.');
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

    // ChÆ°a Ä‘Äƒng nháº­p: khÃ´ng gá»­i request vÃ´ nghÄ©a, bÃ¡o rÃµ cho ngÆ°á»i dÃ¹ng.
    if (!currentUser) {
      showToast('Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ lÆ°u tá»« vá»±ng.', 'error');
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
          note: item.detailedExplanation || 'ÄÆ°á»£c tra cá»©u tá»« BÃ¡ch Khoa ToÃ n ThÆ°',
          tags: item.category || 'general',
        }),
      });

      if (res.ok) {
        sound.playSuccess();
        setSavedIds((prev) => ({ ...prev, [item.id || item.word]: true }));
        showToast('ÄÃ£ lÆ°u vÃ o sá»• tay cá»§a báº¡n.');
      } else if (res.status === 401 || res.status === 403) {
        // TrÆ°á»›c Ä‘Ã¢y nhÃ¡nh nÃ y rÆ¡i vÃ o `catch`/khÃ´ng lÃ m gÃ¬ â€” ngÆ°á»i dÃ¹ng
        // báº¥m nÃºtBookmark mÃ  khÃ´ng tháº¥y pháº£n há»“i nÃ o.
        showToast('PhiÃªn lÃ m viá»‡c Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i.', 'error');
      } else {
        showToast('KhÃ´ng thá»ƒ lÆ°u tá»« vá»±ng. Vui lÃ²ng thá»­ láº¡i.', 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i mÃ¡y chá»§. Vui lÃ²ng thá»­ láº¡i.', 'error');
    }
  };

  const displayedItems = searchResults.items.length > 0 ? searchResults.items : ENCYCLOPEDIA_DATA;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12 space-y-8 overflow-x-hidden">
      {/* Toast Notification â€” feedback cho bookmark/save */}
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
              <BookOpen className="w-3.5 h-3.5 text-amber-300" /> BÃCH KHOA TOÃ€N THÆ¯ Tá»ª ÄIá»‚N ANH - VIá»†T
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Tá»« Äiá»ƒn 26.500+ Má»¥c Tá»« & Cambridge Trá»±c Tiáº¿p
            </h1>
            <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed font-medium">
              Kho dá»¯ liá»‡u khá»•ng lá»“ <b>26.500+ tá»« vá»±ng</b> chuáº©n quá»‘c táº¿ (TOEIC, VSTEP, IT Dev/Arch/Scrum, giao tiáº¿p Ä‘á»i sá»‘ng) tÃ­ch há»£p phiÃªn Ã¢m IPA, giáº£i nghÄ©a tiáº¿ng Viá»‡t chi tiáº¿t, vÃ­ dá»¥ song ngá»¯, phÃ¡t Ã¢m báº£n xá»© vÃ  crawler trá»±c tiáº¿p tá»« <b>Cambridge Dictionary</b>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              href="/bookmarks"
              onClick={() => sound.playClick()}
              className="btn-3d btn-3d-amber px-4 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer dark:text-slate-200"
            >
              <Bookmark className="w-4 h-4" /> Sá»• Bookmark
            </Link>
            <Link
              href="/flashcards"
              onClick={() => sound.playClick()}
              className="btn-3d btn-3d-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-md cursor-pointer dark:text-slate-200"
            >
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Láº­t Flashcard 3D
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
              placeholder="Nháº­p tá»« hoáº·c cÃ¢u/Ä‘oáº¡n vÄƒn tiáº¿ng Anh Ä‘á»ƒ AI dá»‹ch & giáº£i nghÄ©a (VD: bottleneck, I am swamped...)"
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
              title="Dá»‹ch thuáº­t thÃ´ng minh & giáº£i nghÄ©a chuáº©n ngá»¯ cáº£nh báº±ng Groq AI siÃªu tá»‘c"
            >
              {isTranslatingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> Äang dá»‹ch AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> Dá»‹ch AI (Groq)
                </>
              )}
            </button>

            <button
              onClick={() => handleCrawl()}
              disabled={isCrawling || !searchQuery.trim()}
              className="btn-3d btn-3d-white px-4 py-3 min-h-[44px] text-xs font-black shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50 text-slate-700 hover:text-emerald-700 border border-slate-300 flex items-center gap-1.5 touch-manipulation dark:text-slate-300 hover:dark:text-emerald-300 dark:border-white/10"
              title="Crawl Ä‘á»‹nh nghÄ©a tá»« tá»« Ä‘iá»ƒn Cambridge"
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
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Thá»­ tra nhanh báº±ng AI:
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
              <Filter className="w-3.5 h-3.5" /> Cáº¥p Ä‘á»™ CEFR:
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
                {lvl === 'all' ? 'Táº¥t cáº£' : lvl}
              </button>
            ))}
          </div>

          <div className="text-slate-500 text-xs font-bold flex items-center gap-1.5 dark:text-slate-400">
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-300" />}
            <span>TÃ¬m tháº¥y <b>{searchResults.total.toLocaleString()}</b> má»¥c tá»«</span>
            <span className="text-slate-300">â€¢</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950 dark:border-emerald-800">
              âš¡ SQLite Cache 0.1ms
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
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Báº£n Dá»‹ch Ngá»¯ Cáº£nh Tá»± NhiÃªn (Groq AI)
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800">
                      Sáº¯c thÃ¡i: {aiResult.tone}
                    </span>
                    {aiResult.source === 'cache' && (
                      <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold dark:text-amber-200 dark:bg-amber-900">
                        âš¡ SQLite Cache 0.1ms
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
                    title="Nghe phÃ¡t Ã¢m cáº£ cÃ¢u"
                  >
                    <Volume2 className="w-4 h-4" /> Nghe CÃ¢u
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
                    <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-300" /> LÆ°u Bookmark
                  </button>
                </div>
              </div>

              {/* Natural Vietnamese Translation */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-indigo-200 shadow-xs space-y-2 dark:bg-slate-900 dark:border-indigo-800">
                <div className="text-xs font-black text-indigo-600 uppercase tracking-wider dark:text-indigo-300">
                  ðŸ‡»ðŸ‡³ Báº£n dá»‹ch tiáº¿ng Viá»‡t tá»± nhiÃªn:
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-900 leading-snug dark:text-slate-100">
                  {aiResult.vietnameseTranslation}
                </div>
              </div>

              {/* Communicative Nuance & Idioms Explanation */}
              {aiResult.nuanceExplanation && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1 dark:border-amber-800 dark:text-amber-200">
                  <div className="font-black text-amber-900 flex items-center gap-1.5 dark:text-amber-200">
                    <span>ðŸ’¡ PhÃ¢n tÃ­ch sáº¯c thÃ¡i giao tiáº¿p & ngá»¯ cáº£nh:</span>
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
                    CÃ¡c cá»¥m tá»« & thÃ nh ngá»¯ then chá»‘t trong cÃ¢u:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {aiResult.keyPhrases.map((kp: any, kIdx: number) => (
                      <div key={kIdx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-xs dark:bg-slate-900 dark:border-white/10">
                        <div className="font-bold text-indigo-700 flex items-center justify-between dark:text-indigo-300">
                          <span>{kp.en}</span>
                          <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">â†’ {kp.vi}</span>
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
                  <div className="font-black text-slate-700 dark:text-slate-300">CÃ¡c cÃ¡ch diá»…n Ä‘áº¡t tÆ°Æ¡ng Ä‘Æ°Æ¡ng:</div>
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
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Giáº£i NghÄ©a ChuyÃªn SÃ¢u (Groq AI)
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                      {aiResult.partOfSpeech}
                    </span>
                    {aiResult.source === 'cache' && (
                      <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold dark:text-amber-200 dark:bg-amber-900">
                        âš¡ SQLite Cache 0.1ms
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
                    title="PhÃ¡t Ã¢m chuáº©n (TTS)"
                  >
                    <Volume2 className="w-4 h-4" /> Nghe PhÃ¡t Ã‚m
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
                    <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> LÆ°u Bookmark
                  </button>
                </div>
              </div>

              {/* Primary Meaning */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-200 space-y-1.5 shadow-xs dark:bg-slate-900 dark:border-emerald-800">
                <div className="text-xs font-black text-emerald-700 uppercase tracking-wider dark:text-emerald-300">
                  ðŸ‡»ðŸ‡³ NghÄ©a tiáº¿ng Viá»‡t chuáº©n ngá»¯ cáº£nh:
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
                    Cá»¥m tá»« thÆ°á»ng Ä‘i kÃ¨m (Collocations):
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
                    Máº«u cÃ¢u vÃ­ dá»¥ song ngá»¯ thá»±c táº¿:
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
                            title="Nghe cÃ¢u"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-emerald-700 font-medium dark:text-emerald-300">
                          â†’ {eg.vi}
                        </div>
                        {eg.context && (
                          <div className="text-[12px] text-slate-400 font-bold">
                            Ngá»¯ cáº£nh: {eg.context}
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
                    <span>ðŸ’¡ BÃ­ quyáº¿t sÆ° pháº¡m & lÆ°u Ã½ giao tiáº¿p:</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    {aiResult.proTips}
                  </p>
                </div>
              )}

              {/* Synonyms */}
              {aiResult.synonyms && aiResult.synonyms.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Tá»« Ä‘á»“ng nghÄ©a:</span>
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
                  <CheckCircle2 className="w-3.5 h-3.5" /> Káº¿t quáº£ trá»±c tiáº¿p tá»« Cambridge English-Vietnamese
                </span>
                {crawledResult.source === 'cache' && (
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold dark:text-amber-200 dark:bg-amber-900">
                    âš¡ SQLite Cache 0.1ms
                  </span>
                )}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 dark:text-slate-100">
                {crawledResult.word}
              </h2>
              <div className="text-base font-ipa text-emerald-700 mt-1 font-semibold tracking-wide dark:text-emerald-300">
                {crawledResult.ipa} â€¢ <span className="italic text-slate-600 font-sans text-sm dark:text-slate-400">{crawledResult.partOfSpeech}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => handlePlayAudio(crawledResult)}
                className="btn-3d btn-3d-emerald px-4 py-2.5 text-xs font-black shadow-md cursor-pointer"
                title="PhÃ¡t Ã¢m báº£n xá»©"
              >
                <Volume2 className="w-4 h-4" /> Nghe PhÃ¡t Ã‚m
              </button>
              <button
                onClick={(e) => handleSaveBookmark(e, crawledResult)}
                className="btn-3d btn-3d-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-md cursor-pointer dark:text-slate-200"
              >
                <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> LÆ°u Bookmark
              </button>
            </div>
          </div>

          {/* Primary Meaning */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-200 space-y-1.5 shadow-xs dark:bg-slate-900 dark:border-emerald-800">
            <div className="text-base font-black text-emerald-800 flex items-center gap-1.5 dark:text-emerald-200">
              <span>ðŸ‡»ðŸ‡³ Äá»‹nh nghÄ©a tiáº¿ng Viá»‡t:</span>
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
                CÃ¡c ngá»¯ nghÄ©a vÃ  vÃ­ dá»¥ cÃ¢u (Cambridge Crawler):
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
          âš ï¸ {crawlerError}
        </div>
      )}

      {/* Vocabulary Grid (26,500+ Items) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>
            Hiá»ƒn thá»‹ trang <b>{searchResults.page}</b> / <b>{searchResults.totalPages || 1}</b> (
            {searchResults.total.toLocaleString()} tá»« vá»±ng phÃ¹ há»£p)
          </span>
          {isLoading && (
            <span className="text-emerald-600 flex items-center gap-1 dark:text-emerald-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Äang táº£i...
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
                          {item.categoryLabel?.split(' ')[0] || 'ðŸ“–'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-ipa mt-0.5 font-semibold tracking-wide dark:text-slate-400">
                        {item.ipa} â€¢ <span className="italic text-slate-600 font-sans dark:text-slate-400">{item.partOfSpeech}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(item);
                        }}
                        title="Nghe phÃ¡t Ã¢m chuáº©n"
                        className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-700 cursor-pointer transition hover:dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vietnamese Meaning Badge */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 dark:bg-emerald-950 dark:border-emerald-800">
                    <div className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                      ðŸ‡»ðŸ‡³ {item.meaningVi}
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
                    Chi tiáº¿t & vÃ­ dá»¥ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
              <ChevronLeft className="w-4 h-4" /> Trang trÆ°á»›c
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
                  {selectedEntry.ipa} â€¢ <span className="italic text-slate-600 font-sans text-xs sm:text-sm dark:text-slate-400">{selectedEntry.partOfSpeech}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(selectedEntry)}
                  className="w-11 h-11 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 rounded-2xl text-emerald-800 cursor-pointer transition shadow-xs touch-manipulation dark:bg-emerald-950 dark:text-emerald-200"
                  title="Nghe phÃ¡t Ã¢m báº£n xá»©"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 hover:text-slate-800 cursor-pointer transition touch-manipulation dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-slate-400 hover:dark:text-slate-200"
                  title="ÄÃ³ng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Meaning Box */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2 dark:bg-emerald-950 dark:border-emerald-800">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                Äá»‹nh nghÄ©a tiáº¿ng Viá»‡t:
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                ðŸ‡»ðŸ‡³ {selectedEntry.meaningVi}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium dark:text-slate-300">
                {selectedEntry.detailedExplanation}
              </p>
            </div>

            {/* Example Sentences */}
            {selectedEntry.exampleSentences && selectedEntry.exampleSentences.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  VÃ­ dá»¥ thá»±c táº¿ song ngá»¯ Anh - Viá»‡t:
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
                  Cá»¥m tá»« thÆ°á»ng Ä‘i kÃ¨m (Collocations):
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
                Tra cá»©u sÃ¢u hÆ¡n trÃªn Cambridge English-Vietnamese:
              </span>
              <a
                href={`https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(
                  selectedEntry.word.toLowerCase()
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline dark:text-emerald-300"
              >
                Má»Ÿ Cambridge <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleSaveBookmark(e, selectedEntry)}
                className="btn-3d btn-3d-amber px-5 py-2.5 text-xs font-black text-slate-950 cursor-pointer dark:text-slate-200"
              >
                <Bookmark className="w-4 h-4" /> LÆ°u vÃ o Sá»• Tá»«
              </button>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="btn-3d btn-3d-white px-5 py-2.5 text-xs font-bold text-slate-800 cursor-pointer dark:text-slate-200"
              >
                ÄÃ³ng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mascot Companion Floating Support */}
      <MascotCompanion message="Báº¡n Ä‘ang má»Ÿ BÃ¡ch Khoa ToÃ n ThÆ° 26.500+ tá»« vá»±ng! TÃ¬m báº¥t cá»© tá»« nÃ o hoáº·c lá»c theo TOEIC, VSTEP, IT Ä‘á»ƒ há»c nha!" />
    </div>
  );
}

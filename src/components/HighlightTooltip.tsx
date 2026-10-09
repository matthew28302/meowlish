'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Volume2, Bookmark, Check, X, Sparkles, MessageSquare, Zap, Loader2, Brain, BookOpen } from 'lucide-react';
import { lookupWord, DictionaryEntry } from '@/lib/data/dictionary';
import { speakText } from '@/lib/speech';
import { sound } from '@/lib/soundFx';
import { getStoredUser } from '@/lib/auth';

interface AIResultState {
  translation: string;
  ipa?: string;
  ipaUS?: string;
  ipaUK?: string;
  vietnamesePhonetic?: string;
  stressGuide?: string;
  audioTip?: string;
  partOfSpeech?: string;
  tone?: string;
  notes?: string;
  source?: string;
}

interface AIPedagogicalState {
  grammarStructure: string;
  collocationBreakdown: Array<{ phrase: string; meaning: string; usageReason: string }>;
  pedagogicalTip: string;
  similarExamples: Array<{ en: string; vi: string }>;
  suggestedImprovement?: string;
}

export default function HighlightTooltip() {
  const pathname = usePathname();

  // BỎ TÍNH NĂNG BÔI ĐEN DỊCH TRÊN TRANG ADMIN DƯA HẤU (/duahau).
  // CHỈ tính cờ ở đây — KHÔNG return sớm: component này mount trong ROOT
  // layout (src/app/layout.tsx) nên chạy trên mọi trang. Trước fix, `return null`
  // ngay dòng 37 đứng TRƯỚC ~20 hook ⇒ điều hướng client sang /duahau làm số
  // hook giảm từ ~20 xuống 1 ⇒ React ném "Rendered fewer hooks than expected" ⇒
  // mà src/app/ không có error.tsx nào ⇒ MÀN TRẮNG (đo 2026-10-09). Guard thật
  // phải nằm SAU cùng mọi hook, xem dưới cùng component.
  const isAdminRoute = pathname?.startsWith('/duahau');

  const [selectedText, setSelectedText] = useState('');
  const [contextSentence, setContextSentence] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number; isMobile?: boolean } | null>(null);
  const [mobileTranslateBtn, setMobileTranslateBtn] = useState<{ text: string; sentence: string } | null>(null);
  const [dictionaryResult, setDictionaryResult] = useState<DictionaryEntry | null>(null);
  const [aiResult, setAiResult] = useState<AIResultState | null>(null);
  const [pedagogicalResult, setPedagogicalResult] = useState<AIPedagogicalState | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dict' | 'pedagogy'>('dict');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // Viewport rect của vùng bôi đen (để kẹp popup trong màn hình khi nội dung AI về)
  const lastRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAITranslation = async (text: string, context: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          const d = data.data;
          if (d.isSentence) {
            setAiResult({
              translation: d.vietnameseTranslation,
              tone: d.tone,
              notes: d.nuanceExplanation,
              source: d.source,
            });
          } else {
            setAiResult({
              translation: d.meaningVi,
              ipa: d.ipaUS || d.ipa,
              ipaUS: d.ipaUS || d.ipa,
              ipaUK: d.ipaUK,
              vietnamesePhonetic: d.vietnamesePhonetic,
              stressGuide: d.stressGuide,
              audioTip: d.audioTip,
              partOfSpeech: d.partOfSpeech,
              notes: d.proTips || d.detailedExplanation,
              source: d.source,
            });
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Highlight AI translation error:', err);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchPedagogicalAnalysis = async () => {
    if (!selectedText) return;
    sound.playClick();
    setIsAnalysisLoading(true);
    setActiveTab('pedagogy');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          context: contextSentence,
          mode: 'pedagogical_analysis',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.isPedagogical) {
          setPedagogicalResult({
            grammarStructure: data.data.grammarStructure,
            collocationBreakdown: data.data.collocationBreakdown || [],
            pedagogicalTip: data.data.pedagogicalTip,
            similarExamples: data.data.similarExamples || [],
            suggestedImprovement: data.data.suggestedImprovement,
          });
        }
      }
    } catch (err) {
      console.warn('Pedagogical analysis error:', err);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  };

  const executeTranslation = (text: string, sentence: string, rect?: DOMRect, isMobile: boolean = false) => {
    const staticDict = lookupWord(text);
    setSelectedText(text);
    setContextSentence(sentence);
    setDictionaryResult(staticDict);
    setAiResult(null);
    setPedagogicalResult(null);
    setActiveTab('dict');
    setIsSaved(false);
    setMobileTranslateBtn(null);

    if (isMobile || !rect) {
      setPosition({
        x: 0,
        y: 0,
        isMobile: true,
      });
    } else {
      // DESKTOP: định vị FIXED theo viewport (miễn nhiễm scroller là <main>
      // hay window) + ước lượng kích thước, useLayoutEffect sẽ kẹp chính xác
      // sau khi đo popup thật.
      const w = Math.min(400, window.innerWidth - 24);
      lastRectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      const estH = 340;
      let x = rect.left + rect.width / 2 - w / 2;
      x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
      let y: number;
      if (rect.top >= estH + 16) {
        y = rect.top - estH - 10; // hiện phía trên vùng bôi đen
      } else {
        y = Math.max(8, rect.top + rect.height + 10); // hiện phía dưới
      }

      setPosition({ x, y, isMobile: false });
    }

    fetchAITranslation(text, sentence);
  };

  const selectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (document.documentElement.classList.contains('mouse-dragging')) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (!showNoteInput && !isSaved && !pedagogicalResult && !position) {
        setMobileTranslateBtn(null);
      }
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2 || text.length > 350) {
      setMobileTranslateBtn(null);
      return;
    }

    // Capture surrounding context sentence
    const anchorNode = selection.anchorNode;
    let sentence = '';
    if (anchorNode && anchorNode.textContent) {
      sentence = anchorNode.textContent.trim();
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Check device type
    if (isMobileDevice()) {
      // ON MOBILE: ALWAYS update mobileTranslateBtn dynamically whenever selection stops
      setMobileTranslateBtn({
        text,
        sentence,
      });
      // If a previous popup was open, dismiss it so the new selection is immediately ready
      if (position) {
        setPosition(null);
        setSelectedText('');
        setAiResult(null);
        setPedagogicalResult(null);
      }
      return;
    }

    // ON DESKTOP: auto translate immediately
    executeTranslation(text, sentence, rect, false);
  }, [showNoteInput, isSaved, pedagogicalResult, position]);

  // Click / Touch outside to dismiss tooltip or mobile translate button
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (tooltipRef.current && tooltipRef.current.contains(target)) {
        return;
      }
      const mobBtn = document.getElementById('mobile-highlight-translate-btn');
      if (mobBtn && mobBtn.contains(target)) {
        return;
      }

      if (position) {
        setPosition(null);
        setSelectedText('');
        setAiResult(null);
        setPedagogicalResult(null);
        setShowNoteInput(false);
      }
      setMobileTranslateBtn(null);
    };

    if (position || mobileTranslateBtn) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [position, mobileTranslateBtn]);

  // Kẹp popup desktop trong viewport sau mỗi lần nội dung đổi (AI về / đổi tab):
  // đo kích thước thật, căn giữa theo vùng bôi đen, lật trên/dưới, không tràn.
  useLayoutEffect(() => {
    if (!position || position.isMobile) return;
    const el = tooltipRef.current;
    const r = lastRectRef.current;
    if (!el || !r) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;

    const idealX = r.left + r.width / 2 - w / 2;
    const minX = 8;
    const maxX = Math.max(minX, window.innerWidth - w - 8);
    const newX = Math.max(minX, Math.min(maxX, idealX));

    const aboveTop = r.top - h - 10;
    const belowTop = r.top + r.height + 10;
    let newY: number;
    if (r.top >= h + 16) {
      newY = aboveTop;
    } else if (belowTop + h + 8 <= window.innerHeight) {
      newY = belowTop;
    } else {
      // Cao hơn cả khoảng trên lẫn dưới: ghim sát mép trên, nội dung cuộn trong
      newY = 8;
    }

    if (Math.abs(newX - position.x) > 1 || Math.abs(newY - position.y) > 1) {
      setPosition({ x: newX, y: newY, isMobile: false });
    }
  }, [position, aiResult, pedagogicalResult, activeTab, dictionaryResult]);

  // Clean up all timers and in-flight fetch requests on unmount
  useEffect(() => {
    return () => {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Listen to selectionchange (with 200ms debounce whenever selection stops), touchend and mouseup
  useEffect(() => {
    // /duahau không dùng bôi đen dịch ⇒ không đăng ký listener toàn document
    // (tiết kiệm một chút việc vô ích trên trang admin). `return;` không trả
    // cleanup — hợp lệ với quy tắc của React.
    if (isAdminRoute) return;

    const onSelectionChange = () => {
      // ON MOBILE: selectionchange fires repeatedly during every finger scroll/touch!
      // Ignore during touch to prevent forced synchronous layout thrashing & scroll stutter.
      if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
        return;
      }
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current);
      }
      selectionTimerRef.current = setTimeout(() => {
        handleSelection();
      }, 250);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = setTimeout(handleSelection, 20);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const target = e.target as Node;
      if (tooltipRef.current && tooltipRef.current.contains(target)) {
        return;
      }
      const mobBtn = document.getElementById('mobile-highlight-translate-btn');
      if (mobBtn && mobBtn.contains(target)) {
        return;
      }
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = setTimeout(handleSelection, 120);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleSelection, isAdminRoute]);

  const handlePronounce = (e: React.MouseEvent, rate: number = 1.0) => {
    e.stopPropagation();
    sound.playClick();
    speakText(selectedText, rate);
  };

  const effectiveTranslation = aiResult?.translation || dictionaryResult?.vietnamese || '';
  const effectivePhonetic = aiResult?.ipa || dictionaryResult?.phonetic || '';
  const effectiveNotes = aiResult?.notes || dictionaryResult?.notes || '';

  const handleSaveBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedText || !effectiveTranslation) return;

    setIsSaving(true);
    sound.playClick();

    try {
      const activeUser = getStoredUser();
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          word: selectedText,
          phonetic: effectivePhonetic,
          translation: effectiveTranslation,
          contextSentence: contextSentence || dictionaryResult?.example || '',
          note: note.trim() || (aiResult?.tone ? `Sắc thái: ${aiResult.tone}` : 'Tra cứu bài học'),
          tags: aiResult ? 'groq_ai' : 'highlight',
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        sound.playSuccess();
        saveTimerRef.current = setTimeout(() => {
          setPosition(null);
          setSelectedText('');
          setShowNoteInput(false);
          setNote('');
          setAiResult(null);
          setPedagogicalResult(null);
        }, 1800);
      }
    } catch (err) {
      console.error('Save bookmark error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // BỎ TÍNH NĂNG BÔI ĐEN DỊCH TRÊN TRANG ADMIN DƯA HẤU (/duahau).
  // Guard đặt SAU toàn bộ hook/effect phía trên (xem lý do ở đầu component).
  if (isAdminRoute) return null;

  if ((!position || !selectedText) && !mobileTranslateBtn) return null;

  return (
    <>
      {/* MOBILE FLOATING TRANSLATE PILL (Appears on touch / mobile text selection) */}
      {mobileTranslateBtn && !position && (
        <div
          id="mobile-highlight-translate-btn"
          style={{
            position: 'fixed',
            bottom: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
          }}
          className="animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              executeTranslation(mobileTranslateBtn.text, mobileTranslateBtn.sentence, undefined, true);
            }}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-xs shadow-2xl border-2 border-emerald-300 flex items-center gap-2 active:scale-95 cursor-pointer ring-4 ring-emerald-500/25 select-none dark:border-emerald-800"
          >
            <span className="text-sm animate-pulse">✨</span>
            <span className="max-w-[160px] truncate">
              Dịch: &ldquo;{mobileTranslateBtn.text}&rdquo;
            </span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold dark:bg-slate-900/20">
              Tra từ
            </span>
          </button>
        </div>
      )}

      {/* TRANSLATION POPUP CARD (Desktop positioned, or Mobile Bottom-Sheet) */}
      {position && selectedText && (
        <div
          ref={tooltipRef}
          style={
            (position as any).isMobile
              ? {
                  position: 'fixed',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  width: 'calc(100vw - 20px)',
                  maxWidth: '430px',
                }
              : {
                  position: 'fixed',
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  zIndex: 9999,
                  // Kích cỡ theo nội dung: co giãn tự nhiên, tối đa 400px
                  width: 'fit-content',
                  maxWidth: 'min(400px, calc(100vw - 24px))',
                  minWidth: 'min(280px, calc(100vw - 24px))',
                }
          }
          className="animate-in fade-in zoom-in-95 duration-150 filter drop-shadow-2xl"
        >
          <div className="bg-slate-900/98 text-white backdrop-blur-md border border-emerald-500/60 rounded-3xl p-4 shadow-2xl w-full text-sm space-y-3 max-h-[82vh] overflow-y-auto custom-scrollbar">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2 sticky top-0 bg-slate-900/95 pt-0.5 z-10">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="font-bold text-emerald-400 truncate max-w-[170px] text-base" title={selectedText}>
              {selectedText}
            </span>
            {effectivePhonetic && (
              <span className="text-xs text-slate-300 font-ipa bg-slate-800 px-1.5 py-0.5 rounded tracking-wide font-semibold">
                {effectivePhonetic}
              </span>
            )}
            {aiResult?.partOfSpeech && (
              <span className="text-[10px] text-teal-300 italic">
                {aiResult.partOfSpeech}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handlePronounce(e, 1.0)}
              title="Phát âm chuẩn (TTS)"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-emerald-400 transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setPosition(null);
                setSelectedText('');
                setPedagogicalResult(null);
              }}
              title="Đóng popup"
              className="p-1.5 bg-slate-800 hover:bg-rose-600 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('dict');
            }}
            className={`flex-1 py-1 px-2.5 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'dict'
                ? 'bg-emerald-500 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Tra Nghĩa & Phát Âm
          </button>
          <button
            onClick={fetchPedagogicalAnalysis}
            className={`flex-1 py-1 px-2.5 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'pedagogy'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-500/30'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-400" /> 🧠 Phân Tích AI
          </button>
        </div>

        {/* Tab 1: Standard Dictionary & AI Pronunciation / Translation */}
        {activeTab === 'dict' && (
          <div className="space-y-2.5">
            {/* Dedicated Pronunciation & IPA Card */}
            <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/80 space-y-2">
              {isAiLoading && !aiResult ? (
                <div className="flex items-center justify-between py-1 text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>AI đang phân tích ngữ âm US/UK & trọng âm...</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handlePronounce(e, 1.0)}
                      title="Nghe tốc độ chuẩn (1.0x)"
                      className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span className="text-[10px]">1.0x</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                        Phát Âm
                      </span>
                      {(aiResult?.ipaUS || effectivePhonetic) && (
                        <span className="text-xs text-emerald-300 font-ipa font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded tracking-wide">
                          🇺🇸 {aiResult?.ipaUS || effectivePhonetic}
                        </span>
                      )}
                      {aiResult?.ipaUK && aiResult.ipaUK !== (aiResult.ipaUS || effectivePhonetic) && (
                        <span className="text-xs text-sky-300 font-ipa font-semibold bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded tracking-wide">
                          🇬🇧 {aiResult.ipaUK}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handlePronounce(e, 1.0)}
                        title="Nghe tốc độ chuẩn (1.0x)"
                        className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span className="text-[10px]">1.0x</span>
                      </button>
                      <button
                        onClick={(e) => handlePronounce(e, 0.75)}
                        title="Nghe chậm rõ âm đuôi (0.75x)"
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="text-[10px]">🐢 0.75x</span>
                      </button>
                    </div>
                  </div>

                  {/* Vietnamese phonetic guide */}
                  {aiResult?.vietnamesePhonetic && (
                    <div className="flex items-center gap-1.5 text-xs bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded-lg">
                      <span className="text-[11px]">🗣️</span>
                      <span className="text-slate-300 text-[11px]">Đọc mô phỏng:</span>
                      <span className="font-bold text-amber-300 text-xs">
                        {aiResult.vietnamesePhonetic}
                      </span>
                    </div>
                  )}

                  {/* Stress guide & audio tip */}
                  {(aiResult?.stressGuide || aiResult?.audioTip) && (
                    <div className="text-[11px] text-sky-200 bg-sky-950/40 p-2 rounded-lg border border-sky-800/40 leading-relaxed">
                      <div className="font-bold text-sky-300 text-[10px] uppercase flex items-center gap-1 mb-0.5">
                        <span>🎯</span> Trọng âm & Âm đuôi:
                      </div>
                      <div>{aiResult.stressGuide || aiResult.audioTip}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Translation & Meaning Section */}
            {isAiLoading && !effectiveTranslation ? (
              <div className="py-3 flex items-center justify-center gap-2 text-xs text-amber-300 font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>AI đang phân tích nghĩa ngữ cảnh & phát âm...</span>
              </div>
            ) : effectiveTranslation ? (
              <div className="space-y-1.5 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-xs font-semibold text-emerald-300 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug text-sm font-bold text-white">{effectiveTranslation}</span>
                </div>
                {aiResult?.tone && (
                  <div className="text-[10px] text-sky-300 font-bold bg-sky-950/60 px-2 py-0.5 rounded-full inline-block border border-sky-800">
                    Sắc thái: {aiResult.tone}
                  </div>
                )}
                {effectiveNotes && (
                  <div className="text-[11px] text-slate-300 italic leading-relaxed pt-0.5">
                    💡 {effectiveNotes}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-xs text-slate-400">Chưa có trong từ điển mẫu.</span>
                <button
                  onClick={() => fetchAITranslation(selectedText, contextSentence)}
                  className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-600/50 cursor-pointer"
                >
                  <Zap className="w-3 h-3" /> Dịch AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Pedagogical Analysis */}
        {activeTab === 'pedagogy' && (
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
            {isAnalysisLoading ? (
              <div className="py-4 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400 mx-auto" />
                <p className="text-xs text-amber-300 font-bold">
                  AI đang phân tích cấu trúc ngữ pháp & collocations...
                </p>
              </div>
            ) : pedagogicalResult ? (
              <div className="space-y-2.5 text-xs">
                {/* Grammar Structure */}
                <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-1">
                  <div className="font-black text-amber-300 uppercase tracking-wide text-[10px] flex items-center gap-1">
                    <span>🧱</span> Cấu Trúc Ngữ Pháp
                  </div>
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {pedagogicalResult.grammarStructure}
                  </p>
                </div>

                {/* Collocation Breakdown */}
                {pedagogicalResult.collocationBreakdown.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-1.5">
                    <div className="font-black text-emerald-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                      <span>✨</span> Cụm Từ & Lý Do Sử Dụng
                    </div>
                    {pedagogicalResult.collocationBreakdown.map((item, idx) => (
                      <div key={idx} className="border-t border-slate-700/60 pt-1 text-[11px] space-y-0.5">
                        <div className="font-bold text-emerald-300">
                          &bull; {item.phrase}: <span className="text-white font-normal">{item.meaning}</span>
                        </div>
                        <div className="text-slate-400 italic text-[10px]">
                          👉 {item.usageReason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pedagogical Tip */}
                {pedagogicalResult.pedagogicalTip && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-1">
                    <div className="font-black uppercase tracking-wide text-[10px] flex items-center gap-1 text-amber-400">
                      <span>💡</span> Mẹo Học & Lưu Ý
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {pedagogicalResult.pedagogicalTip}
                    </p>
                  </div>
                )}

                {/* Similar Examples */}
                {pedagogicalResult.similarExamples.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/40 space-y-1">
                    <div className="font-black uppercase tracking-wide text-[10px] flex items-center gap-1 text-sky-300">
                      <span>📝</span> Mẫu Câu Tương Tự
                    </div>
                    {pedagogicalResult.similarExamples.map((eg, idx) => (
                      <div key={idx} className="text-[11px] space-y-0.5">
                        <div className="font-mono text-sky-200">&bull; {eg.en}</div>
                        <div className="text-slate-400 italic text-[10px]">🇻🇳 {eg.vi}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-400">
                Nhấn nút 🧠 Phân Tích AI để xem giải thích chuyên sâu.
              </div>
            )}
          </div>
        )}

        {/* Note input box */}
        {showNoteInput && (
          <div className="animate-in fade-in duration-150">
            <div className="flex items-center gap-1 text-[11px] text-slate-300 mb-1">
              <MessageSquare className="w-3 h-3 text-amber-400" /> Ghi chú riêng của bạn:
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Dùng khi gửi email khách hàng..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              autoFocus
            />
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
          {!showNoteInput ? (
            <button
              onClick={() => setShowNoteInput(true)}
              className="text-xs text-slate-300 hover:text-emerald-300 flex items-center gap-1 transition px-1.5 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" /> + Chú thích
            </button>
          ) : (
            <span className="text-[10px] text-slate-400">Gắn vào ngữ cảnh</span>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleSaveBookmark}
              disabled={isSaving || isSaved || !effectiveTranslation}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isSaved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white active:scale-95 disabled:opacity-50'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Đã lưu Sổ
                </>
              ) : isSaving ? (
                'Đang lưu...'
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" /> Lưu Từ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</>
  );
}

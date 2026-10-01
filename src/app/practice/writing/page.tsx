'use client';

import React, { useState, useEffect } from 'react';
import { WRITING_PROMPTS, WritingPrompt } from '@/lib/data/practice';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import {
  PenTool,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lightbulb,
  HelpCircle,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  Zap,
  Play,
  X,
  Loader2
} from 'lucide-react';
import MascotCompanion from '@/components/MascotCompanion';
import { getStoredUser } from '@/lib/auth';

const SESSION_KEY = 'session_writing_practice_v2';

export default function WritingPracticePage() {
  const [promptsList, setPromptsList] = useState<WritingPrompt[]>(WRITING_PROMPTS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [typedInput, setTypedInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [useFreeType, setUseFreeType] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Pointer-based Drag & Drop state (retains custom cat cursor & avoids OS cursor override)
  const [activeDrag, setActiveDrag] = useState<{
    source: 'available' | 'selected';
    index: number;
    token: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
  } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isOverAssembly, setIsOverAssembly] = useState(false);
  const [isOverPool, setIsOverPool] = useState(false);
  const activeDragRef = React.useRef(activeDrag);
  activeDragRef.current = activeDrag;

  // Session persistence banner state
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  // AI Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Filtered prompts
  const filteredPrompts = promptsList.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  const prompt = filteredPrompts[currentIdx] || filteredPrompts[0] || WRITING_PROMPTS[0];

  const isRestoringRef = React.useRef(false);

  // Initialize & Check Session on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.promptId) {
            setSavedSessionData(parsed);
            setHasSavedSession(true);
          }
        } catch (e) {
          console.warn('Failed to parse saved writing session', e);
        }
      }
    }
  }, []);

  // Shuffle available tokens on prompt change
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    if (prompt && prompt.scrambledWords) {
      const words = [...prompt.scrambledWords];
      setAvailableTokens(words.sort(() => Math.random() - 0.5));
      setSelectedTokens([]);
      setTypedInput('');
      setIsSubmitted(false);
      setIsCorrect(false);
    }
  }, [currentIdx, categoryFilter, promptsList]);

  // AI Explanation state
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isFetchingAiExplanation, setIsFetchingAiExplanation] = useState(false);

  // Save session state to sessionStorage
  const saveCurrentSession = (updatedSelected = selectedTokens, updatedAvailable = availableTokens) => {
    if (typeof window !== 'undefined' && prompt) {
      const sessionData = {
        promptId: prompt.id,
        currentIdx,
        categoryFilter,
        selectedTokens: updatedSelected,
        availableTokens: updatedAvailable,
        typedInput,
        useFreeType,
        isSubmitted,
        isCorrect,
        promptsList,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }
  };

  // Restore saved session
  const handleRestoreSession = () => {
    sound.playClick();
    if (savedSessionData) {
      isRestoringRef.current = true;
      if (savedSessionData.promptsList && savedSessionData.promptsList.length > 0) {
        setPromptsList(savedSessionData.promptsList);
      }
      if (savedSessionData.categoryFilter) setCategoryFilter(savedSessionData.categoryFilter);
      if (savedSessionData.currentIdx !== undefined) setCurrentIdx(savedSessionData.currentIdx);
      if (savedSessionData.selectedTokens) setSelectedTokens(savedSessionData.selectedTokens);
      if (savedSessionData.availableTokens) setAvailableTokens(savedSessionData.availableTokens);
      if (savedSessionData.typedInput) setTypedInput(savedSessionData.typedInput);
      if (savedSessionData.useFreeType !== undefined) setUseFreeType(savedSessionData.useFreeType);
      if (savedSessionData.isSubmitted !== undefined) setIsSubmitted(savedSessionData.isSubmitted);
      if (savedSessionData.isCorrect !== undefined) setIsCorrect(savedSessionData.isCorrect);
    }
    setHasSavedSession(false);
  };

  const handleFetchAiExplanation = async () => {
    if (aiExplanation) return;
    setIsFetchingAiExplanation(true);
    sound.playClick();

    try {
      const userSubmittedText = useFreeType ? typedInput : selectedTokens.join(' ');
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt.referenceAnswer,
          context: `Tình huống: ${prompt.situation}. Dịch tiếng Việt: ${prompt.vietnamesePrompt}. Câu học viên làm: ${userSubmittedText}`,
          mode: 'pedagogical_analysis',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.isPedagogical) {
          const d = data.data;
          let explanationText = `🧱 Cấu trúc ngữ pháp:\n${d.grammarStructure}\n\n`;
          if (d.collocationBreakdown && d.collocationBreakdown.length > 0) {
            explanationText += `✨ Cụm từ trọng tâm & Lý do dùng:\n` + d.collocationBreakdown.map((c: any) => `• ${c.phrase}: ${c.meaning} (${c.usageReason})`).join('\n') + `\n\n`;
          }
          if (d.pedagogicalTip) {
            explanationText += `💡 Mẹo ghi nhớ & Lỗi sai người Việt hay mắc:\n${d.pedagogicalTip}\n\n`;
          }
          if (d.similarExamples && d.similarExamples.length > 0) {
            explanationText += `📝 Mẫu câu tự nhiên tương đương:\n` + d.similarExamples.map((e: any) => `• ${e.en} (${e.vi})`).join('\n');
          }
          setAiExplanation(explanationText);
        } else {
          setAiExplanation(`🧱 Cấu trúc chuẩn: ${prompt.referenceAnswer}\n💡 Giải thích: ${prompt.explanation}\n✨ Cụm từ quan trọng: ${prompt.keyVocabHints.join(', ')}`);
        }
      }
    } catch (err) {
      setAiExplanation(`💡 Giải thích thêm: ${prompt.explanation}\n\nCấu trúc chuẩn: ${prompt.referenceAnswer}`);
    } finally {
      setIsFetchingAiExplanation(false);
    }
  };

  // Clear saved session & start new
  const handleClearSession = () => {
    sound.playClick();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setHasSavedSession(false);
  };

  // Handle Token Selection
  const handleSelectToken = (token: string, tokenIdx: number) => {
    sound.playClick();
    const nextSelected = [...selectedTokens, token];
    const nextAvailable = [...availableTokens];
    nextAvailable.splice(tokenIdx, 1);

    setSelectedTokens(nextSelected);
    setAvailableTokens(nextAvailable);
    saveCurrentSession(nextSelected, nextAvailable);
  };

  // Handle Token Removal
  const handleRemoveToken = (token: string, tokenIdx: number) => {
    sound.playClick();
    const nextSelected = [...selectedTokens];
    nextSelected.splice(tokenIdx, 1);
    const nextAvailable = [...availableTokens, token];

    setSelectedTokens(nextSelected);
    setAvailableTokens(nextAvailable);
    saveCurrentSession(nextSelected, nextAvailable);
  };

  // Move Token Left in Assembly Area
  const handleMoveTokenLeft = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx <= 0) return;
    sound.playClick();
    const updated = [...selectedTokens];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setSelectedTokens(updated);
    saveCurrentSession(updated, availableTokens);
  };

  // Move Token Right in Assembly Area
  const handleMoveTokenRight = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx >= selectedTokens.length - 1) return;
    sound.playClick();
    const updated = [...selectedTokens];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setSelectedTokens(updated);
    saveCurrentSession(updated, availableTokens);
  };

  // Pointer-based Drag & Drop Handlers (preserves custom cat cursor & avoids OS native cursor replacement)
  const handleTokenPointerDown = (
    e: React.PointerEvent,
    source: 'available' | 'selected',
    index: number,
    token: string
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }

    setActiveDrag({
      source,
      index,
      token,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
    });
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const current = activeDragRef.current;
      if (!current) return;

      const dist = Math.hypot(e.clientX - current.startX, e.clientY - current.startY);
      if (dist > 5 || current.isDragging) {
        document.documentElement.classList.add('mouse-dragging');
        if (typeof window !== 'undefined') {
          window.getSelection()?.removeAllRanges();
        }

        // Hit testing elements under pointer
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const tokenEl = el?.closest('[data-token-idx]');
        if (tokenEl) {
          const idx = Number(tokenEl.getAttribute('data-token-idx'));
          setHoveredIdx(idx);
        } else {
          setHoveredIdx(null);
        }

        const assemblyEl = el?.closest('[data-drop-zone="assembly"]');
        setIsOverAssembly(!!assemblyEl);

        const poolEl = el?.closest('[data-drop-zone="pool"]');
        setIsOverPool(!!poolEl);

        setActiveDrag((prev) =>
          prev ? { ...prev, currentX: e.clientX, currentY: e.clientY, isDragging: true } : null
        );
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      const current = activeDragRef.current;
      document.documentElement.classList.remove('mouse-dragging');

      if (current) {
        if (!current.isDragging) {
          // If moved less than 5px, it's a simple click!
          if (current.source === 'available') {
            handleSelectToken(current.token, current.index);
          } else {
            handleRemoveToken(current.token, current.index);
          }
        } else {
          // Dragged and released
          sound.playClick();
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const tokenEl = el?.closest('[data-token-idx]');
          const assemblyEl = el?.closest('[data-drop-zone="assembly"]');
          const poolEl = el?.closest('[data-drop-zone="pool"]');
          const tokenStr = current.token;

          if (tokenEl) {
            const targetIdx = Number(tokenEl.getAttribute('data-token-idx'));
            if (current.source === 'available') {
              const nextSelected = [...selectedTokens];
              nextSelected.splice(targetIdx, 0, tokenStr);
              const nextAvailable = [...availableTokens];
              nextAvailable.splice(current.index, 1);
              setSelectedTokens(nextSelected);
              setAvailableTokens(nextAvailable);
              saveCurrentSession(nextSelected, nextAvailable);
            } else if (current.source === 'selected') {
              if (current.index !== targetIdx) {
                const nextSelected = [...selectedTokens];
                const [moved] = nextSelected.splice(current.index, 1);
                nextSelected.splice(targetIdx, 0, moved);
                setSelectedTokens(nextSelected);
                saveCurrentSession(nextSelected, availableTokens);
              }
            }
          } else if (assemblyEl) {
            if (current.source === 'available') {
              const nextSelected = [...selectedTokens, tokenStr];
              const nextAvailable = [...availableTokens];
              nextAvailable.splice(current.index, 1);
              setSelectedTokens(nextSelected);
              setAvailableTokens(nextAvailable);
              saveCurrentSession(nextSelected, nextAvailable);
            }
          } else if (poolEl) {
            if (current.source === 'selected') {
              const nextSelected = [...selectedTokens];
              nextSelected.splice(current.index, 1);
              const nextAvailable = [...availableTokens, tokenStr];
              setSelectedTokens(nextSelected);
              setAvailableTokens(nextAvailable);
              saveCurrentSession(nextSelected, nextAvailable);
            }
          }
        }
      }

      setActiveDrag(null);
      setHoveredIdx(null);
      setIsOverAssembly(false);
      setIsOverPool(false);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [activeDrag, selectedTokens, availableTokens]);

  // Check Answer
  const handleCheckAnswer = () => {
    const userAnswer = useFreeType
      ? typedInput.trim().toLowerCase().replace(/[^a-z0-9]/g, ' ')
      : selectedTokens.join(' ').toLowerCase().replace(/[^a-z0-9]/g, ' ');

    const targetAnswer = prompt.referenceAnswer
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ');

    const correct = userAnswer.trim() === targetAnswer.trim();
    setIsSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      sound.playSuccess();
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
      });
      const user = getStoredUser();
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleType: 'writing',
          itemId: prompt.id,
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

  const handleNextPrompt = () => {
    sound.playClick();
    const nextIdx = (currentIdx + 1) % filteredPrompts.length;
    setCurrentIdx(nextIdx);
  };

  const handleReset = () => {
    sound.playClick();
    setSelectedTokens([]);
    setAvailableTokens(
      [...prompt.scrambledWords].sort(() => Math.random() - 0.5)
    );
    setTypedInput('');
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  // Generate Custom Multi-Question Practice Set via AI
  const handleGenerateAiPrompt = async () => {
    if (!aiTopicInput.trim()) return;
    sound.playClick();
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiTopicInput,
          context: 'Tạo bộ 20 câu hỏi luyện tập viết phản xạ',
          mode: 'generate_practice_set',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const questions = data.data?.questions || [];
        if (questions.length > 0) {
          const aiPrompts: WritingPrompt[] = questions.map((q: any, idx: number) => {
            const sentence = q.referenceAnswer || 'Could you please check this pull request?';
            const words = sentence.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
            return {
              id: `ai-set-${Date.now()}-${idx}`,
              situation: `✨ Bộ Đề AI (${idx + 1}/${questions.length}): ${q.situation || aiTopicInput}`,
              category: 'IT',
              vietnamesePrompt: q.vietnamesePrompt || aiTopicInput,
              referenceAnswer: sentence,
              scrambledWords: words,
              keyVocabHints: q.keyVocabHints || words.slice(0, 3),
              explanation: q.explanation || 'Câu luyện tập được tạo tự động từ AI Sư Phạm.',
            };
          });

          setPromptsList(aiPrompts);
          setCurrentIdx(0);
          setShowAiModal(false);
          setAiTopicInput('');
          sound.playCelebration();

          // Save AI set directly to sessionStorage
          if (typeof window !== 'undefined') {
            const sessionData = {
              promptId: aiPrompts[0].id,
              currentIdx: 0,
              categoryFilter,
              selectedTokens: [],
              availableTokens: [...aiPrompts[0].scrambledWords].sort(() => Math.random() - 0.5),
              typedInput: '',
              useFreeType: false,
              isSubmitted: false,
              isCorrect: false,
              promptsList: aiPrompts,
            };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          }
        }
      }
    } catch (err) {
      console.warn('AI prompt set generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8 pb-24 lg:pb-12 overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <PenTool className="w-3.5 h-3.5 text-amber-300" /> Phòng Luyện Viết Phản Xạ Lego
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Luyện Viết Câu & Kéo Thả Khối Từ Giao Tiếp
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl mt-1">
              Sắp xếp khối từ chuẩn xác, hỗ trợ kéo thả vị trí linh hoạt hoặc gõ tự do theo ngữ cảnh IT công sở.
            </p>
          </div>
          <button
            onClick={() => setShowAiModal(true)}
            className="btn-3d btn-3d-amber px-4 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>✨ Tạo Đề AI Tự Do</span>
          </button>
        </div>
      </div>

      {/* Session Persistence Alert Banner */}
      {hasSavedSession && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📌</span>
            <div>
              <h4 className="font-black text-sm text-amber-950">
                Bạn có 1 bài luyện viết dở chưa hoàn thành!
              </h4>
              <p className="text-xs text-amber-800 font-medium">
                Bạn muốn tiếp tục tiến độ dở dang hay bắt đầu bài mới?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRestoreSession}
              className="btn-3d btn-3d-emerald px-4 py-2 text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5" /> Tiếp tục bài dở
            </button>
            <button
              onClick={handleClearSession}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 cursor-pointer"
            >
              Bắt đầu bài mới
            </button>
          </div>
        </div>
      )}

      {/* Topic Filter Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-500 flex items-center gap-1 shrink-0 uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5" /> Chủ đề bài tập:
          </span>
          {[
            { id: 'all', label: 'Tất cả chủ đề' },
            { id: 'IT', label: '💻 IT Công Sở' },
            { id: 'Daily', label: '☕ Giao Tiếp Đời Sống' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setCategoryFilter(cat.id);
                setCurrentIdx(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-500 shrink-0">
          Câu {currentIdx + 1} / {filteredPrompts.length}
        </div>
      </div>

      {/* Main Practice Container */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Situation prompt */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">
              {prompt.category} • Tình huống thực tế:
            </span>
            <button
              onClick={() => {
                sound.playClick();
                setUseFreeType(!useFreeType);
              }}
              className="text-xs text-slate-600 hover:text-emerald-700 underline font-extrabold cursor-pointer"
            >
              {useFreeType ? '🧱 Chuyển sang xếp khối từ Lego' : '⌨️ Chuyển sang gõ bàn phím tự do'}
            </button>
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug">
            {prompt.situation}
          </p>
          <div className="text-sm font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            🇻🇳 Hãy dịch sang tiếng Anh: &quot;{prompt.vietnamesePrompt}&quot;
          </div>
        </div>

        {/* Key Vocabulary Hints */}
        {prompt.keyVocabHints && prompt.keyVocabHints.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
            <span className="font-bold flex items-center gap-1 text-amber-600">
              <Lightbulb className="w-3.5 h-3.5" /> Gợi ý cụm từ:
            </span>
            {prompt.keyVocabHints.map((hint, idx) => (
              <span
                key={idx}
                className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-[11px] text-amber-900 font-bold"
              >
                {hint}
              </span>
            ))}
          </div>
        )}

        {/* Mode A: Word Tokens Reordering & Drag-and-Drop */}
        {!useFreeType ? (
          <div className="space-y-4">
            {/* Target Assembly Area with Drag & Drop */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                <span>Vùng ghép câu (Kéo thả từ để đổi vị trí hoặc bấm vào từ để bỏ):</span>
                {selectedTokens.length > 0 && (
                  <span>Đã ghép {selectedTokens.length} từ</span>
                )}
              </div>

              <div
                data-drop-zone="assembly"
                className={`min-h-[85px] p-4 rounded-2xl border-2 border-dashed flex flex-wrap items-center gap-2 transition-all ${
                  isOverAssembly
                    ? 'border-emerald-500 bg-emerald-100/50 shadow-md ring-2 ring-emerald-400/40'
                    : 'border-emerald-500/50 bg-emerald-50/30'
                }`}
              >
                {selectedTokens.length === 0 ? (
                  <span className="text-xs text-slate-400 italic pointer-events-none">
                    Kéo thả các khối từ bên dưới vào đây hoặc bấm để ghép câu hoàn chỉnh...
                  </span>
                ) : (
                  selectedTokens.map((tok, idx) => (
                    <div
                      key={idx}
                      data-token-idx={idx}
                      onPointerDown={(e) => handleTokenPointerDown(e, 'selected', idx, tok)}
                      title="Kéo thả để đổi vị trí hoặc bấm vào để bỏ"
                      className={`px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-sm cursor-grab active:cursor-grabbing transition-all transform hover:scale-105 select-none touch-none ${
                        activeDrag?.source === 'selected' && activeDrag.index === idx && activeDrag.isDragging
                          ? 'opacity-30 scale-95'
                          : ''
                      } ${hoveredIdx === idx && activeDrag?.isDragging ? 'ring-3 ring-amber-400 scale-110 shadow-lg' : ''}`}
                    >
                      <span>{tok}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Tokens Pool */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 px-1">
                Các khối từ có sẵn (Kéo thả vào khung trên hoặc bấm để thêm vào câu):
              </span>
              <div
                data-drop-zone="pool"
                className={`flex flex-wrap gap-2.5 pt-1 min-h-[50px] p-2 rounded-2xl transition-all ${
                  isOverPool && activeDrag?.source === 'selected'
                    ? 'bg-rose-50 border-2 border-dashed border-rose-300 ring-2 ring-rose-200'
                    : ''
                }`}
                suppressHydrationWarning
              >
                {availableTokens.map((tok, idx) => (
                  <div
                    key={`${currentIdx}-${tok}-${idx}`}
                    onPointerDown={(e) => handleTokenPointerDown(e, 'available', idx, tok)}
                    className={`lego-chip text-xs font-black hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing shadow-xs border-2 border-slate-200 select-none touch-none ${
                      activeDrag?.source === 'available' && activeDrag.index === idx && activeDrag.isDragging
                        ? 'opacity-30 scale-95'
                        : ''
                    }`}
                    title="Kéo thả vào vùng ghép câu hoặc bấm để thêm"
                  >
                    {tok}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Ghost Chip that follows cursor while dragging */}
            {activeDrag && activeDrag.isDragging && (
              <div
                className="fixed pointer-events-none z-[99999] px-4 py-2 bg-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-black shadow-2xl scale-105 -rotate-2 select-none border-2 border-white/80 will-change-transform"
                style={{
                  left: activeDrag.currentX,
                  top: activeDrag.currentY,
                  transform: 'translate(calc(-100% + 14px), calc(-100% + 12px))',
                }}
              >
                <span>{activeDrag.token}</span>
              </div>
            )}
          </div>
        ) : (
          /* Mode B: Free Typing */
          <div className="space-y-2">
            <textarea
              rows={3}
              value={typedInput}
              onChange={(e) => {
                setTypedInput(e.target.value);
                saveCurrentSession();
              }}
              placeholder="Gõ câu trả lời tiếng Anh của bạn tại đây..."
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>
        )}

        {/* Check & Submit Actions */}
        <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-xl touch-manipulation"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Xếp lại từ đầu
          </button>

          <button
            onClick={handleCheckAnswer}
            disabled={!useFreeType && selectedTokens.length === 0}
            className="btn-3d btn-3d-emerald px-6 py-2.5 min-h-[44px] text-xs font-black shadow-md cursor-pointer disabled:opacity-50 touch-manipulation"
          >
            Kiểm Tra Câu Trả Lời
          </button>
        </div>

        {/* Feedback Card */}
        {isSubmitted && (
          <div
            className={`p-5 rounded-2xl border-2 space-y-3 animate-in fade-in duration-200 ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-rose-50 border-rose-400 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-sm">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>🎉 Xuất sắc! Câu của bạn hoàn toàn chính xác (+25 EXP)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>Chưa hoàn toàn chuẩn xác, hãy so sánh với câu chuẩn:</span>
                </>
              )}
            </div>

            <div className="text-xs sm:text-sm font-mono font-bold bg-white p-3 rounded-xl border border-emerald-200">
              Đáp án mẫu: &quot;{prompt.referenceAnswer}&quot;
            </div>

            <div className="text-xs leading-relaxed opacity-90 font-medium">
              💡 Giải thích: {prompt.explanation}
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={handleFetchAiExplanation}
                disabled={isFetchingAiExplanation}
                className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isFetchingAiExplanation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" /> 🧠 AI Giải Thích Chi Tiết Sư Phạm
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setAiExplanation(null);
                  handleNextPrompt();
                }}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                Câu Tiếp Theo <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {aiExplanation && (
              <div className="mt-3 p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2.5 animate-in fade-in border border-amber-500/40 shadow-xl">
                <div className="font-black text-amber-300 text-xs flex items-center gap-1.5 border-b border-slate-700 pb-1.5">
                  <span>🧠</span> PHÂN TÍCH CHI TIẾT TỪ AI SƯ PHẠM MEOWLISH
                </div>
                <div className="whitespace-pre-line leading-relaxed text-slate-200 font-medium">
                  {aiExplanation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <MascotCompanion
          mood="happy"
          message="Bạn có thể kéo thả trực tiếp khối từ để thay đổi vị trí câu cực kỳ linh hoạt đấy!"
        />
      </div>

      {/* AI Practice Prompt Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-[calc(100vw-24px)] sm:w-full border-2 border-slate-200 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer touch-manipulation"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                <Zap className="w-3.5 h-3.5 text-amber-600" /> TẠO ĐỀ THI BẰNG AI
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Tạo Bài Tập Luyện Viết Tùy Chọn
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Nhập chủ đề tình huống bất kỳ (Ví dụ: Thương lượng tăng lương, giải thích lỗi server với khách Singapore, gọi món cafe Mỹ...).
              </p>
            </div>

            <textarea
              rows={3}
              value={aiTopicInput}
              onChange={(e) => setAiTopicInput(e.target.value)}
              placeholder="Nhập tình huống bạn muốn thực hành viết..."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleGenerateAiPrompt}
                disabled={isGeneratingAi || !aiTopicInput.trim()}
                className="btn-3d btn-3d-amber px-5 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>AI đang tạo bộ đề...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Tạo bài luyện ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

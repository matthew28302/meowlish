'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect, useMemo } from 'react';
import { useEscapeToClose } from '@/lib/useEscapeToClose';
import { WRITING_PROMPTS, WritingPrompt } from '@/lib/data/practice';
import { sound } from '@/lib/soundFx';
import confetti from '@/lib/confetti';
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
  Loader2,
  History
} from 'lucide-react';
import MascotCompanion from '@/components/MascotCompanion';
import { getStoredUser } from '@/lib/auth';

const SESSION_KEY = 'session_writing_practice_v2';
// Lá»‹ch sá»­ cÃ¡c bá»™ Ä‘á» AI Ä‘Ã£ táº¡o (thay tháº¿ session Ä‘Æ¡n dÃ¹ng má»™t láº§n): lÆ°u Ä‘á» +
// Ä‘Ã¡p Ã¡n tá»«ng cÃ¢u Ä‘á»ƒ lÃ m tiáº¿p, lÃ m láº¡i hoáº·c xÃ³a.
const HISTORY_KEY = 'writing_exam_history_v1';
const MAX_HISTORY = 20;

interface ExamAnswerSnapshot {
  selected: string[];
  available: string[];
  typed: string;
  submitted: boolean;
  correct: boolean;
}

interface ExamHistoryEntry {
  id: string;
  topic: string;
  createdAt: number;
  prompts: WritingPrompt[];
  answers: Record<string, ExamAnswerSnapshot>;
  currentIdx: number;
}

function loadExamHistory(): ExamHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveExamHistory(entries: ExamHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {}
}

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

  // Exam history (localStorage, persistent): resume / restart / delete
  const [examHistory, setExamHistory] = useState<ExamHistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Náº¡p lá»‹ch sá»­ Ä‘á» Ä‘Ã£ táº¡o khi má»Ÿ trang
  useEffect(() => {
    setExamHistory(loadExamHistory());
  }, []);

  // accessibility: Esc Ä‘Ã³ng Ä‘Æ°á»£c cáº£ 2 modal (trÆ°á»›c Ä‘Ã¢y chá»‰ cÃ³ nÃºt X + click ná»n)
  useEscapeToClose(showHistoryModal, () => setShowHistoryModal(false));
  useEscapeToClose(showAiModal, () => { if (!isGeneratingAi) setShowAiModal(false); }, !isGeneratingAi);

  // LÆ°u vá»‹ trÃ­ cÃ¢u Ä‘ang lÃ m vÃ o entry lá»‹ch sá»­ (ká»ƒ cáº£ khi chÆ°a submit)
  useEffect(() => {
    if (!activeHistoryId) return;
    const next = loadExamHistory().map((e) =>
      e.id === activeHistoryId ? { ...e, currentIdx } : e
    );
    saveExamHistory(next);
    setExamHistory(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // Clean up confetti on unmount
  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    return promptsList.filter((p) => {
      if (categoryFilter === 'all') return true;
      return p.category === categoryFilter;
    });
  }, [promptsList, categoryFilter]);

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
          context: `TÃ¬nh huá»‘ng: ${prompt.situation}. Dá»‹ch tiáº¿ng Viá»‡t: ${prompt.vietnamesePrompt}. CÃ¢u há»c viÃªn lÃ m: ${userSubmittedText}`,
          mode: 'pedagogical_analysis',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.isPedagogical) {
          const d = data.data;
          let explanationText = `ðŸ§± Cáº¥u trÃºc ngá»¯ phÃ¡p:\n${d.grammarStructure}\n\n`;
          if (d.collocationBreakdown && d.collocationBreakdown.length > 0) {
            explanationText += `âœ¨ Cá»¥m tá»« trá»ng tÃ¢m & LÃ½ do dÃ¹ng:\n` + d.collocationBreakdown.map((c: any) => `â€¢ ${c.phrase}: ${c.meaning} (${c.usageReason})`).join('\n') + `\n\n`;
          }
          if (d.pedagogicalTip) {
            explanationText += `ðŸ’¡ Máº¹o ghi nhá»› & Lá»—i sai ngÆ°á»i Viá»‡t hay máº¯c:\n${d.pedagogicalTip}\n\n`;
          }
          if (d.similarExamples && d.similarExamples.length > 0) {
            explanationText += `ðŸ“ Máº«u cÃ¢u tá»± nhiÃªn tÆ°Æ¡ng Ä‘Æ°Æ¡ng:\n` + d.similarExamples.map((e: any) => `â€¢ ${e.en} (${e.vi})`).join('\n');
          }
          setAiExplanation(explanationText);
        } else {
          setAiExplanation(`ðŸ§± Cáº¥u trÃºc chuáº©n: ${prompt.referenceAnswer}\nðŸ’¡ Giáº£i thÃ­ch: ${prompt.explanation}\nâœ¨ Cá»¥m tá»« quan trá»ng: ${prompt.keyVocabHints.join(', ')}`);
        }
      }
    } catch (err) {
      setAiExplanation(`ðŸ’¡ Giáº£i thÃ­ch thÃªm: ${prompt.explanation}\n\nCáº¥u trÃºc chuáº©n: ${prompt.referenceAnswer}`);
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

    // LÆ°u Ä‘Ã¡p Ã¡n vÃ o lá»‹ch sá»­ Ä‘á» Ä‘ang lÃ m (Ä‘á»ƒ thoÃ¡t ra vÃ o láº¡i lÃ m tiáº¿p)
    if (activeHistoryId && prompt?.id) {
      persistAnswerToHistory(
        activeHistoryId,
        prompt.id,
        {
          selected: useFreeType ? [] : [...selectedTokens],
          available: [...availableTokens],
          typed: typedInput,
          submitted: true,
          correct,
        },
        currentIdx
      );
    }

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
          context: 'Táº¡o bá»™ 20 cÃ¢u há»i luyá»‡n táº­p viáº¿t pháº£n xáº¡',
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
              situation: `âœ¨ Bá»™ Äá» AI (${idx + 1}/${questions.length}): ${q.situation || aiTopicInput}`,
              category: 'IT',
              vietnamesePrompt: q.vietnamesePrompt || aiTopicInput,
              referenceAnswer: sentence,
              scrambledWords: words,
              keyVocabHints: q.keyVocabHints || words.slice(0, 3),
              explanation: q.explanation || 'CÃ¢u luyá»‡n táº­p Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng tá»« AI SÆ° Pháº¡m.',
            };
          });

          setPromptsList(aiPrompts);
          setCurrentIdx(0);
          setShowAiModal(false);
          setAiTopicInput('');
          sound.playCelebration();

          // LÆ°u bá»™ Ä‘á» vÃ o lá»‹ch sá»­ (thay tháº¿ session Ä‘Æ¡n): Ä‘á»ƒ lÃ m tiáº¿p/lÃ m láº¡i
          const entry: ExamHistoryEntry = {
            id: `exam-${Date.now()}`,
            topic: aiTopicInput.trim(),
            createdAt: Date.now(),
            prompts: aiPrompts,
            answers: {},
            currentIdx: 0,
          };
          const nextHistory = [entry, ...loadExamHistory()].slice(0, MAX_HISTORY);
          saveExamHistory(nextHistory);
          setExamHistory(nextHistory);
          setActiveHistoryId(entry.id);
        }
      }
    } catch (err) {
      console.warn('AI prompt set generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // LÆ°u Ä‘Ã¡p Ã¡n cÃ¢u hiá»‡n táº¡i vÃ o entry lá»‹ch sá»­ Ä‘ang lÃ m (náº¿u cÃ³)
  const persistAnswerToHistory = (
    entryId: string,
    promptId: string,
    snapshot: ExamAnswerSnapshot,
    idx: number
  ) => {
    const next = loadExamHistory().map((e) =>
      e.id === entryId
        ? { ...e, answers: { ...e.answers, [promptId]: snapshot }, currentIdx: idx }
        : e
    );
    saveExamHistory(next);
    setExamHistory(next);
  };

  // Má»Ÿ Ä‘á» tá»« lá»‹ch sá»­ Ä‘á»ƒ lÃ m tiáº¿p (giá»¯ nguyÃªn Ä‘Ã¡p Ã¡n Ä‘Ã£ Ä‘iá»n)
  const handleResumeEntry = (entry: ExamHistoryEntry, restart = false) => {
    sound.playClick();
    isRestoringRef.current = true;
    setCategoryFilter('all'); // Ä‘á» lá»‹ch sá»­ chá»©a Ä‘á»§ loáº¡i â€” reset filter Ä‘á»ƒ tháº¥y háº¿t cÃ¢u
    setPromptsList(entry.prompts);
    const idx = restart ? 0 : Math.min(entry.currentIdx, entry.prompts.length - 1);
    setCurrentIdx(idx);
    const snap = restart ? undefined : entry.answers[entry.prompts[idx]?.id];
    if (snap) {
      setSelectedTokens(snap.selected);
      setAvailableTokens(snap.available);
      setTypedInput(snap.typed);
      setIsSubmitted(snap.submitted);
      setIsCorrect(snap.correct);
    } else {
      const words = [...(entry.prompts[idx]?.scrambledWords || [])].sort(() => Math.random() - 0.5);
      setSelectedTokens([]);
      setAvailableTokens(words);
      setTypedInput('');
      setIsSubmitted(false);
      setIsCorrect(false);
    }
    if (restart) {
      const next = loadExamHistory().map((e) =>
        e.id === entry.id ? { ...e, answers: {}, currentIdx: 0 } : e
      );
      saveExamHistory(next);
      setExamHistory(next);
    }
    setActiveHistoryId(entry.id);
    setShowHistoryModal(false);
  };

  // XÃ³a 1 Ä‘á» khá»i lá»‹ch sá»­
  const handleDeleteEntry = (entryId: string) => {
    sound.playClick();
    const next = loadExamHistory().filter((e) => e.id !== entryId);
    saveExamHistory(next);
    setExamHistory(next);
    if (activeHistoryId === entryId) setActiveHistoryId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8 pb-24 lg:pb-12 overflow-x-hidden w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-3xl p-5 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 dark:bg-slate-900/20">
              <PenTool className="w-3.5 h-3.5 text-amber-300 shrink-0" /> PhÃ²ng Luyá»‡n Viáº¿t Pháº£n Xáº¡ Lego
            </div>
            <h1 className="text-xl sm:text-3xl font-black">
              Luyá»‡n Viáº¿t CÃ¢u & KÃ©o Tháº£ Khá»‘i Tá»« Giao Tiáº¿p
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl mt-1">
              Sáº¯p xáº¿p khá»‘i tá»« chuáº©n xÃ¡c, há»— trá»£ kÃ©o tháº£ vá»‹ trÃ­ linh hoáº¡t hoáº·c gÃµ tá»± do theo ngá»¯ cáº£nh IT cÃ´ng sá»Ÿ.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowAiModal(true)}
            className="btn-3d btn-3d-amber w-full sm:w-auto px-4 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0 dark:text-slate-200"
          >
            <Zap className="w-4 h-4" />
            <span>âœ¨ Táº¡o Äá» AI Tá»± Do</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setExamHistory(loadExamHistory());
              setShowHistoryModal(true);
            }}
            className="btn-3d btn-3d-white w-full sm:w-auto px-4 py-2.5 text-xs font-black text-slate-800 shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            title="Xem láº¡i cÃ¡c bá»™ Ä‘á» Ä‘Ã£ táº¡o vÃ  lÃ m tiáº¿p"
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Lá»‹ch Sá»­ Äá» Thi{examHistory.length > 0 ? ` (${examHistory.length})` : ''}</span>
          </button>
          </div>
        </div>
      </div>

      {/* Session Persistence Alert Banner */}
      {hasSavedSession && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200 dark:bg-amber-950 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">ðŸ“Œ</span>
            <div>
              <h4 className="font-black text-sm text-amber-950 dark:text-amber-200">
                Báº¡n cÃ³ 1 bÃ i luyá»‡n viáº¿t dá»Ÿ chÆ°a hoÃ n thÃ nh!
              </h4>
              <p className="text-xs text-amber-800 font-medium dark:text-amber-200">
                Báº¡n muá»‘n tiáº¿p tá»¥c tiáº¿n Ä‘á»™ dá»Ÿ dang hay báº¯t Ä‘áº§u bÃ i má»›i?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleRestoreSession}
              className="flex-1 sm:flex-initial btn-3d btn-3d-emerald px-4 py-2 text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Play className="w-3.5 h-3.5" /> Tiáº¿p tá»¥c bÃ i dá»Ÿ
            </button>
            <button
              onClick={handleClearSession}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 cursor-pointer text-center dark:text-slate-400 hover:dark:text-slate-100 dark:bg-slate-900 dark:border-white/10"
            >
              Báº¯t Ä‘áº§u bÃ i má»›i
            </button>
          </div>
        </div>
      )}

      {/* Topic Filter Selector Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:bg-slate-900 dark:border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto touch-auto pb-1 sm:pb-0 custom-scrollbar max-w-full">
          <span className="text-xs font-black text-slate-500 flex items-center gap-1 shrink-0 uppercase tracking-wide dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Chá»§ Ä‘á»:
          </span>
          {[
            { id: 'all', label: 'Táº¥t cáº£ chá»§ Ä‘á»' },
            { id: 'IT', label: 'ðŸ’» IT CÃ´ng Sá»Ÿ' },
            { id: 'Daily', label: 'â˜• Giao Tiáº¿p Äá»i Sá»‘ng' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setCategoryFilter(cat.id);
                setCurrentIdx(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap shrink-0 ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 hover:dark:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-500 shrink-0 self-end sm:self-center dark:text-slate-400">
          CÃ¢u {currentIdx + 1} / {filteredPrompts.length}
        </div>
      </div>

      {/* Main Practice Container */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm space-y-5 sm:space-y-6 max-w-full overflow-hidden dark:bg-slate-900 dark:border-white/10">
        {/* Situation prompt */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 dark:bg-slate-900 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
            <span className="text-xs font-black uppercase text-emerald-600 tracking-wider dark:text-emerald-300">
              {prompt.category} â€¢ TÃ¬nh huá»‘ng thá»±c táº¿:
            </span>
            <button
              onClick={() => {
                sound.playClick();
                setUseFreeType(!useFreeType);
              }}
              className="text-xs text-slate-600 hover:text-emerald-700 underline font-extrabold cursor-pointer self-start sm:self-auto dark:text-slate-400 hover:dark:text-emerald-300"
            >
              {useFreeType ? 'ðŸ§± Chuyá»ƒn sang xáº¿p khá»‘i tá»« Lego' : 'âŒ¨ï¸ Chuyá»ƒn sang gÃµ bÃ n phÃ­m tá»± do'}
            </button>
          </div>
          <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words dark:text-slate-100">
            {prompt.situation}
          </p>
          <div className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 p-2.5 sm:p-3 rounded-xl border border-emerald-200 break-words dark:text-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
            ðŸ‡»ðŸ‡³ HÃ£y dá»‹ch sang tiáº¿ng Anh: &quot;{prompt.vietnamesePrompt}&quot;
          </div>
        </div>

        {/* Key Vocabulary Hints */}
        {prompt.keyVocabHints && prompt.keyVocabHints.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-300">
              <Lightbulb className="w-3.5 h-3.5" /> Gá»£i Ã½ cá»¥m tá»«:
            </span>
            {prompt.keyVocabHints.map((hint, idx) => (
              <span
                key={idx}
                className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-[11px] text-amber-900 font-bold dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-bold text-slate-400 px-1 gap-1">
                <span>VÃ¹ng ghÃ©p cÃ¢u (KÃ©o tháº£ tá»« Ä‘á»ƒ Ä‘á»•i vá»‹ trÃ­ hoáº·c báº¥m vÃ o tá»« Ä‘á»ƒ bá»):</span>
                {selectedTokens.length > 0 && (
                  <span className="shrink-0 text-emerald-600 font-bold dark:text-emerald-300">ÄÃ£ ghÃ©p {selectedTokens.length} tá»«</span>
                )}
              </div>

              <div
                data-drop-zone="assembly"
                className={`min-h-[85px] p-3 sm:p-4 rounded-2xl border-2 border-dashed flex flex-wrap items-center gap-1.5 sm:gap-2 transition-all max-w-full ${
                  isOverAssembly
                    ? 'border-emerald-500 bg-emerald-100/50 shadow-md ring-2 ring-emerald-400/40'
                    : 'border-emerald-500/50 bg-emerald-50/30'
                }`}
              >
                {selectedTokens.length === 0 ? (
                  <span className="text-xs text-slate-400 italic pointer-events-none">
                    KÃ©o tháº£ cÃ¡c khá»‘i tá»« bÃªn dÆ°á»›i vÃ o Ä‘Ã¢y hoáº·c báº¥m Ä‘á»ƒ ghÃ©p cÃ¢u hoÃ n chá»‰nh...
                  </span>
                ) : (
                  selectedTokens.map((tok, idx) => (
                    <div
                      key={idx}
                      data-token-idx={idx}
                      onPointerDown={(e) => handleTokenPointerDown(e, 'selected', idx, tok)}
                      title="KÃ©o tháº£ Ä‘á»ƒ Ä‘á»•i vá»‹ trÃ­ hoáº·c báº¥m vÃ o Ä‘á»ƒ bá»"
                      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-sm cursor-grab active:cursor-grabbing transition-all transform hover:scale-105 select-none touch-none break-words max-w-full ${
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
                CÃ¡c khá»‘i tá»« cÃ³ sáºµn (KÃ©o tháº£ vÃ o khung trÃªn hoáº·c báº¥m Ä‘á»ƒ thÃªm vÃ o cÃ¢u):
              </span>
              <div
                data-drop-zone="pool"
                className={`flex flex-wrap gap-2 pt-1 min-h-[50px] p-2 rounded-2xl transition-all max-w-full ${
                  isOverPool && activeDrag?.source === 'selected'
                    ? 'bg-rose-50 border-2 border-dashed border-rose-300 ring-2 ring-rose-200 dark:bg-rose-950 dark:border-rose-800'
                    : ''
                }`}
                suppressHydrationWarning
              >
                {availableTokens.map((tok, idx) => (
                  <div
                    key={`${currentIdx}-${tok}-${idx}`}
                    onPointerDown={(e) => handleTokenPointerDown(e, 'available', idx, tok)}
                    className={`lego-chip text-xs font-black hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing shadow-xs border-2 border-slate-200 dark:border-white/10 select-none touch-none break-words ${
                      activeDrag?.source === 'available' && activeDrag.index === idx && activeDrag.isDragging
                        ? 'opacity-30 scale-95'
                        : ''
                    }`}
                    title="KÃ©o tháº£ vÃ o vÃ¹ng ghÃ©p cÃ¢u hoáº·c báº¥m Ä‘á»ƒ thÃªm"
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
              placeholder="GÃµ cÃ¢u tráº£ lá»i tiáº¿ng Anh cá»§a báº¡n táº¡i Ä‘Ã¢y..."
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900"
            />
          </div>
        )}

        {/* Check & Submit Actions */}
        <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-xl touch-manipulation dark:text-slate-400 hover:dark:text-slate-200 dark:bg-slate-900 hover:dark:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Xáº¿p láº¡i tá»« Ä‘áº§u
          </button>

          <button
            onClick={handleCheckAnswer}
            disabled={!useFreeType && selectedTokens.length === 0}
            className="flex-1 sm:flex-initial btn-3d btn-3d-emerald px-6 py-2.5 min-h-[44px] text-xs font-black shadow-md cursor-pointer disabled:opacity-50 touch-manipulation text-center"
          >
            Kiá»ƒm Tra CÃ¢u Tráº£ Lá»i
          </button>
        </div>

        {/* Feedback Card */}
        {isSubmitted && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 animate-in fade-in duration-200 max-w-full overflow-hidden ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50 border-rose-400 text-rose-950 dark:bg-rose-950 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 dark:text-emerald-300" />
                  <span>ðŸŽ‰ Xuáº¥t sáº¯c! CÃ¢u cá»§a báº¡n hoÃ n toÃ n chÃ­nh xÃ¡c (+25 EXP)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 dark:text-rose-300" />
                  <span>ChÆ°a hoÃ n toÃ n chuáº©n xÃ¡c, hÃ£y so sÃ¡nh vá»›i cÃ¢u chuáº©n:</span>
                </>
              )}
            </div>

            <div className="text-xs sm:text-sm font-mono font-bold bg-white p-3 rounded-xl border border-emerald-200 break-words dark:bg-slate-900 dark:border-emerald-800">
              ÄÃ¡p Ã¡n máº«u: &quot;{prompt.referenceAnswer}&quot;
            </div>

            <div className="text-xs leading-relaxed opacity-90 font-medium break-words">
              ðŸ’¡ Giáº£i thÃ­ch: {prompt.explanation}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                onClick={handleFetchAiExplanation}
                disabled={isFetchingAiExplanation}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isFetchingAiExplanation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Äang phÃ¢n tÃ­ch AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" /> ðŸ§  AI Giáº£i ThÃ­ch Chi Tiáº¿t SÆ° Pháº¡m
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setAiExplanation(null);
                  handleNextPrompt();
                }}
                className="w-full sm:w-auto justify-center px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition inline-flex items-center gap-1.5 cursor-pointer shadow-md dark:bg-white dark:text-slate-900 hover:dark:bg-white"
              >
                CÃ¢u Tiáº¿p Theo <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {aiExplanation && (
              <div className="mt-3 p-3.5 sm:p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2.5 animate-in fade-in border border-amber-500/40 shadow-xl max-w-full overflow-hidden dark:bg-white dark:text-slate-900">
                <div className="font-black text-amber-300 text-xs flex items-center gap-1.5 border-b border-slate-700 pb-1.5 dark:border-white/10">
                  <span>ðŸ§ </span> PHÃ‚N TÃCH CHI TIáº¾T Tá»ª AI SÆ¯ PHáº M MEOWLISH
                </div>
                <div className="whitespace-pre-line leading-relaxed text-slate-200 font-medium break-words">
                  {aiExplanation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center max-w-full overflow-hidden px-2">
        <MascotCompanion
          mood="happy"
          message="Báº¡n cÃ³ thá»ƒ kÃ©o tháº£ trá»±c tiáº¿p khá»‘i tá»« Ä‘á»ƒ thay Ä‘á»•i vá»‹ trÃ­ cÃ¢u cá»±c ká»³ linh hoáº¡t Ä‘áº¥y!"
        />
      </div>

      {/* AI Practice Prompt Generator Modal */}
      {/* History Modal: cÃ¡c bá»™ Ä‘á» AI Ä‘Ã£ táº¡o + lÃ m tiáº¿p / lÃ m láº¡i / xÃ³a */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-[calc(100vw-24px)] sm:w-full border-2 border-slate-200 shadow-2xl space-y-4 relative dark:bg-slate-900 dark:border-white/10 max-h-[85dvh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer touch-manipulation dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              title="ÄÃ³ng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black dark:bg-emerald-950 dark:text-emerald-200">
                <History className="w-3.5 h-3.5" /> Lá»ŠCH Sá»¬ Äá»€ THI
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                CÃ¡c Bá»™ Äá» ÄÃ£ Táº¡o
              </h3>
              <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
                Má»—i láº§n táº¡o Ä‘á» Ä‘Æ°á»£c lÆ°u láº¡i kÃ¨m Ä‘Ã¡p Ã¡n Ä‘Ã£ Ä‘iá»n â€” báº¥m vÃ o Ä‘á»ƒ lÃ m tiáº¿p báº¥t cá»© lÃºc nÃ o.
              </p>
            </div>

            {examHistory.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-4xl">ðŸ“</div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  ChÆ°a cÃ³ bá»™ Ä‘á» nÃ o. Báº¥m â€œTáº¡o Äá» AI Tá»± Doâ€ Ä‘á»ƒ táº¡o Ä‘á» Ä‘áº§u tiÃªn!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {examHistory.map((entry) => {
                  const doneCount = Object.keys(entry.answers || {}).length;
                  const total = entry.prompts?.length || 0;
                  const correctCount = Object.values(entry.answers || {}).filter((a) => a.correct).length;
                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition ${
                        activeHistoryId === entry.id
                          ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-700'
                          : 'border-slate-200 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {entry.topic}
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          {new Date(entry.createdAt).toLocaleString('vi-VN')} â€¢ {doneCount}/{total} cÃ¢u Ä‘Ã£ lÃ m
                          {doneCount > 0 && ` â€¢ âœ… ${correctCount} Ä‘Ãºng`}
                          {activeHistoryId === entry.id && ' â€¢ Äang lÃ m'}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: total > 0 ? `${Math.round((doneCount / total) * 100)}%` : '0%' }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleResumeEntry(entry, false)}
                          className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5" /> LÃ m tiáº¿p
                        </button>
                        <button
                          onClick={() => handleResumeEntry(entry, true)}
                          className="py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> LÃ m láº¡i
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 text-[11px] font-black transition cursor-pointer active:scale-95"
                        >
                          XÃ³a
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 dark:bg-white/60">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-[calc(100vw-24px)] sm:w-full border-2 border-slate-200 shadow-2xl space-y-5 relative dark:bg-slate-900 dark:border-white/10">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer touch-manipulation hover:dark:text-slate-300 dark:bg-slate-800 hover:dark:bg-slate-700"
              title="ÄÃ³ng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black dark:bg-amber-950 dark:text-amber-200">
                <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" /> Táº O Äá»€ THI Báº°NG AI
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Táº¡o BÃ i Táº­p Luyá»‡n Viáº¿t TÃ¹y Chá»n
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed dark:text-slate-400">
                Nháº­p chá»§ Ä‘á» tÃ¬nh huá»‘ng báº¥t ká»³ (VÃ­ dá»¥: ThÆ°Æ¡ng lÆ°á»£ng tÄƒng lÆ°Æ¡ng, giáº£i thÃ­ch lá»—i server vá»›i khÃ¡ch Singapore, gá»i mÃ³n cafe Má»¹...).
              </p>
            </div>

            <textarea
              rows={3}
              value={aiTopicInput}
              onChange={(e) => setAiTopicInput(e.target.value)}
              placeholder="Nháº­p tÃ¬nh huá»‘ng báº¡n muá»‘n thá»±c hÃ nh viáº¿t..."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl dark:text-slate-400 hover:dark:bg-slate-800"
              >
                Há»§y
              </button>
              <button
                onClick={handleGenerateAiPrompt}
                disabled={isGeneratingAi || !aiTopicInput.trim()}
                className="btn-3d btn-3d-amber px-5 py-2.5 text-xs font-black text-slate-950 shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 dark:text-slate-200"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950 dark:text-slate-200" />
                    <span>AI Ä‘ang táº¡o bá»™ Ä‘á»...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Táº¡o bÃ i luyá»‡n ngay</span>
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

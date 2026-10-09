'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect } from 'react';
import { VOCABULARY_LIST } from '@/lib/data/vocabulary';
import { sound } from '@/lib/soundFx';
import { speakText } from '@/lib/speech';
import { getStoredUser } from '@/lib/auth';
import confetti from '@/lib/confetti';
import {
  Layers,
  Volume2,
  RotateCw,
  Check,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Bookmark,
} from 'lucide-react';
import MascotCompanion from '@/components/MascotCompanion';

interface FlashcardItem {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  exampleSentence?: string;
  note?: string;
  tags?: string;
  source: 'bookmark' | 'curated';
}

export default function FlashcardsPage() {
  const [deck, setDeck] = useState<FlashcardItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    // Load bookmarks from SQLite DB
    const user = getStoredUser();
    fetch(`/api/bookmarks?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const bookmarks = (data.bookmarks || []).map((bm: {
          id: string;
          word: string;
          phonetic: string;
          translation: string;
          context_sentence: string;
          note: string;
          tags: string;
        }) => ({
          id: bm.id,
          word: bm.word,
          phonetic: bm.phonetic,
          translation: bm.translation,
          exampleSentence: bm.context_sentence,
          note: bm.note,
          tags: bm.tags,
          source: 'bookmark' as const,
        }));

        const curated = VOCABULARY_LIST.map((v) => ({
          id: v.id,
          word: v.word,
          phonetic: v.phonetic,
          translation: v.meaningVi,
          exampleSentence: v.exampleSentence,
          note: v.tips,
          tags: v.category,
          source: 'curated' as const,
        }));

        if (activeTab === 'bookmarks' && bookmarks.length > 0) {
          setDeck(bookmarks);
        } else {
          // Combine or default to curated + bookmarks
          setDeck([...bookmarks, ...curated]);
        }
      })
      .catch(() => {
        // Fallback to curated
        setDeck(
          VOCABULARY_LIST.map((v) => ({
            id: v.id,
            word: v.word,
            phonetic: v.phonetic,
            translation: v.meaningVi,
            exampleSentence: v.exampleSentence,
            note: v.tips,
            tags: v.category,
            source: 'curated' as const,
          }))
        );
      });
  }, [activeTab]);

  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  const card = deck[currentIdx];

  const handleFlip = () => {
    sound.playFlip();
    setIsFlipped(!isFlipped);
  };

  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (card) {
      speakText(card.word);
    }
  };

  const handleNextCard = (mastered: boolean) => {
    if (mastered) {
      sound.playSuccess();
      setMasteredCount((prev) => prev + 1);
      // If it's a bookmark, update mastery in DB
      if (card?.source === 'bookmark') {
        fetch('/api/bookmarks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: card.id, masteryLevel: 5 }),
        }).catch(() => {});
      }
    } else {
      sound.playError();
    }

    setIsFlipped(false);
    if (currentIdx + 1 < deck.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      sound.playCelebration();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      // Award EXP and Coins for completing deck
      const user = getStoredUser();
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleType: 'vocab',
          itemId: 'flashcard-deck-complete',
          score: 100,
          expGained: 40,
        }),
      })
        .then(() => {
          window.dispatchEvent(new Event('auth-state-changed'));
        })
        .catch(() => {});
    }
  };

  const handleRestart = () => {
    sound.playClick();
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setMasteredCount(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 dark:bg-slate-900/20">
              <Layers className="w-3.5 h-3.5 text-amber-200" /> Flashcard 3D Spaced Repetition
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Lật Thẻ Ghi Nhớ Từ Vựng & Sổ Tay
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl mt-1">
              Ôn tập từ vựng bằng phương pháp ngắt quãng khoa học, kết hợp phiên âm, ví dụ và âm thanh sống động.
            </p>
          </div>

          {/* Tab Filter */}
          <div className="flex bg-white/20 p-1 rounded-2xl text-xs font-bold backdrop-blur-md dark:bg-slate-900/20">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('all');
                setCurrentIdx(0);
                setIsFlipped(false);
                setIsCompleted(false);
              }}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-300' : 'text-white'
              }`}
            >
              Tất cả từ ({deck.length})
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('bookmarks');
                setCurrentIdx(0);
                setIsFlipped(false);
                setIsCompleted(false);
              }}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'bookmarks'
                  ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-300'
                  : 'text-white'
              }`}
            >
              <Bookmark className="w-3 h-3" /> Sổ Bookmark của bạn
            </button>
          </div>
        </div>
      </div>

      {/* Main Flashcard Arena */}
      {!isCompleted && card ? (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>
              Thẻ {currentIdx + 1} / {deck.length}
            </span>
            <span className="text-emerald-600 dark:text-emerald-300">Đã thuộc: {masteredCount} từ</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / deck.length) * 100}%` }}
            />
          </div>

          {/* 3D Flippable Card
              a11y (audit 2026-10-09): đây là TƯƠNG TÁC CỐT LÕI của trang nhưng
              là <div onClick> nên bàn phím không dùng được. Không đổi sang
              <button> vì bên trong đã có nút "Nghe Phát Âm" — button lồng button
              là HTML không hợp lệ và phá semantics. Vì vậy thêm role/tabIndex/
              onKeyDown theo mẫu keyboard-accessible div. Chỉ xử lý khi sự kiện
              phát ra từ chính thẻ (target === currentTarget) để Enter/Space trên
              nút nghe phát âm bên trong không lật nhầm thẻ. */}
          <div
            onClick={handleFlip}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFlip();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={
              isFlipped
                ? `Lật thẻ ${card.word} về mặt trước`
                : `Lật thẻ ${card.word} để xem nghĩa`
            }
            className="w-full h-80 sm:h-96 relative cursor-pointer select-none perspective-1000 group transform-gpu"
          >
            <div
              className={`w-full h-full relative duration-500 transform-style-3d will-change-transform transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl p-8 flex flex-col justify-between items-center text-center shadow-lg group-hover:border-amber-500 transition-colors">
                <div className="w-full flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    {card.source === 'bookmark' ? '⭐ Sổ tay cá nhân' : '📚 Bộ từ chuẩn'}
                  </span>
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <RotateCw className="w-3.5 h-3.5" /> Bấm để lật xem nghĩa
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {card.word}
                  </h2>
                  <div className="text-base font-ipa text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
                    {card.phonetic}
                  </div>
                  <button
                    onClick={handlePronounce}
                    className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl hover:scale-110 transition shadow-sm cursor-pointer inline-flex items-center gap-2 text-xs font-bold"
                  >
                    <Volume2 className="w-5 h-5" /> Nghe Phát Âm Chuẩn
                  </button>
                </div>

                <div className="text-xs text-slate-400">
                  Lật mặt sau để xem giải nghĩa, ví dụ và ngữ cảnh!
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 border-2 border-emerald-400 rounded-3xl p-8 flex flex-col justify-between items-center text-center shadow-lg text-white">
                <div className="w-full flex items-center justify-between text-xs text-amber-300 font-black">
                  <span>MẶT SAU: GIẢI NGHĨA & NGỮ CẢNH</span>
                  <span className="flex items-center gap-1 text-emerald-100">
                    <RotateCw className="w-3.5 h-3.5" /> Bấm để lật lại
                  </span>
                </div>

                <div className="space-y-4 max-w-lg">
                  <h3 className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-sm">
                    🇻🇳 {card.translation}
                  </h3>

                  {card.exampleSentence && (
                    <div className="p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-xs sm:text-sm text-white leading-relaxed font-medium">
                      &quot;{card.exampleSentence}&quot;
                    </div>
                  )}

                  {card.note && (
                    <div className="text-xs text-amber-200 font-semibold italic bg-amber-400/20 px-3 py-1 rounded-xl">
                      💡 Mẹo nhớ: {card.note}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-emerald-100 font-medium">
                  Hãy tự đánh giá mức độ ghi nhớ của bạn bên dưới:
                </div>
              </div>
            </div>
          </div>

          {/* Action Decision Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleNextCard(false)}
              className="btn-3d btn-3d-white py-4 text-xs sm:text-sm font-black text-rose-600 border-rose-200 border-b-rose-400 shadow-md cursor-pointer dark:text-rose-300 dark:border-rose-800"
            >
              <X className="w-5 h-5 text-rose-500" /> Chưa Thuộc (Ôn Lại)
            </button>

            <button
              onClick={() => handleNextCard(true)}
              className="btn-3d btn-3d-emerald py-4 text-xs sm:text-sm font-black shadow-md cursor-pointer"
            >
              <Check className="w-5 h-5" /> Đã Thuộc Lòng (+1)
            </button>
          </div>
        </div>
      ) : (
        /* Completion Screen */
        <div className="card-arcade card-arcade-emerald p-8 sm:p-12 text-center space-y-5">
          <div className="text-5xl animate-bounce">🎉</div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Tuyệt Vời! Bạn Đã Hoàn Thành Bộ Thẻ
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium dark:text-slate-400">
            Bạn đã ghi nhớ được <b className="text-emerald-700 dark:text-emerald-300">{masteredCount}</b> / {deck.length} từ trong phiên ôn tập này. Toàn bộ kết quả đã được cập nhật vào tiến độ cá nhân.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="btn-3d btn-3d-emerald px-6 py-3 text-xs font-black shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Ôn Tập Lại Bộ Này
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <MascotCompanion
          mood="happy"
          message="Mỗi ngày chỉ cần lật 10 flashcard, sau một tháng bạn sẽ làm chủ 300 từ vựng giao tiếp tự nhiên!"
        />
      </div>
    </div>
  );
}

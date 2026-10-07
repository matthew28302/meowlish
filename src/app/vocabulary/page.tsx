'use client';

import type { Metadata } from 'next';

import React, { useState, useMemo } from 'react';
import { VOCABULARY_LIST, VocabItem } from '@/lib/data/vocabulary';
import { sound } from '@/lib/soundFx';
import { speakText } from '@/lib/speech';
import { getStoredUser } from '@/lib/auth';
import {
  Sparkles,
  Volume2,
  Bookmark,
  Check,
  Search,
  Mic,
  Tag,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Từ Vựng Tiếng Anh IT & Giao Tiếp - Meowlish',
  description: 'Học từ vựng tiếng Anh chuyên ngành IT, giao tiếp hàng ngày theo chủ đề với phiên âm IPA, ví dụ thực chiến và bài tập phản xạ.',
};

export default function VocabularyPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'all', label: 'Táº¥t Cáº£ Tá»« Vá»±ng' },
    { id: 'it-scrum', label: 'ðŸ’» IT: Daily Standup' },
    { id: 'it-review', label: 'ðŸ› ï¸ IT: Code Review' },
    { id: 'it-bug', label: 'ðŸ› IT: Debug & Bug Triage' },
    { id: 'it-architecture', label: 'ðŸ›ï¸ IT: System Architecture' },
    { id: 'office-english', label: 'ðŸ¢ Office & Workplace' },
    { id: 'daily-smalltalk', label: 'ðŸ¤ Daily: Small Talk' },
    { id: 'daily-travel', label: 'âœˆï¸ Daily: Travel & Commute' },
    { id: 'daily-cafe', label: 'â˜• Daily: Cafe & Dining' },
    { id: 'daily-opinion', label: 'ðŸ’¡ Daily: BÃ y Tá» Quan Äiá»ƒm' },
    { id: 'daily-family', label: 'ðŸ  Daily: Gia ÄÃ¬nh & NhÃ  Cá»­a' },
    { id: 'daily-food', label: 'ðŸœ Daily: Ä‚n Uá»‘ng & Náº¥u NÆ°á»›ng' },
    { id: 'daily-health', label: 'ðŸ’ª Daily: Sá»©c Khá»e & Thá»ƒ Cháº¥t' },
    { id: 'daily-shopping', label: 'ðŸ›ï¸ Daily: Mua Sáº¯m & Tiá»n Báº¡c' },
    { id: 'daily-fun', label: 'ðŸŽ¬ Daily: Phim Nháº¡c & Giáº£i TrÃ­' },
    { id: 'daily-weather', label: 'ðŸŒ¦ï¸ Daily: Thá»i Tiáº¿t & Bá»‘n MÃ¹a' },
    { id: 'it-interview', label: 'ðŸŽ¯ IT: Tech Interview' },
  ];

  const filteredWords = useMemo(() => {
    return VOCABULARY_LIST.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meaningVi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSaveBookmark = async (item: VocabItem) => {
    sound.playClick();
    try {
      const activeUser = getStoredUser();
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          word: item.word,
          phonetic: item.phonetic,
          translation: item.meaningVi,
          contextSentence: item.exampleSentence,
          note: item.tips || 'Tá»« vá»±ng tá»« thÆ° viá»‡n',
          tags: item.category,
        }),
      });
      if (res.ok) {
        sound.playSuccess();
        setSavedIds((prev) => ({ ...prev, [item.id]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12 space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 dark:bg-slate-900/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> ThÆ° Viá»‡n Tá»« Vá»±ng IT & Daily
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Há»c Tá»« Vá»±ng Giao Tiáº¿p Theo Ngá»¯ Cáº£nh
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl mt-1">
              PhÃ¡t Ã¢m chuáº©n IPA, collocations báº£n xá»©, ghi nhá»› báº±ng tÃ¬nh huá»‘ng thá»±c táº¿ vÃ  lÆ°u vÃ o sá»• tay cÃ¡ nhÃ¢n.
            </p>
          </div>
          <Link
            href="/flashcards"
            onClick={() => sound.playClick()}
            className="btn-3d btn-3d-white px-4 py-2.5 min-h-[44px] text-xs font-black text-slate-800 shadow-md transition flex items-center gap-1.5 cursor-pointer touch-manipulation dark:text-slate-200"
          >
            Láº­t Flashcard Ã”n Táº­p
          </Link>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="TÃ¬m kiáº¿m tá»« vá»±ng (VD: blocker, refactor, cafe...)"
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setActiveCategory(cat.id);
              }}
              className={`px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border-2 touch-manipulation flex items-center ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Empty state: search khÃ´ng tráº£ káº¿t quáº£ -> nÃ³i rÃµ thay vÃ¬ Ä‘á»ƒ trang tráº¯ng */}
        {filteredWords.length === 0 && (
          <div
            role="status"
            aria-live="polite"
            className="col-span-full flex flex-col items-center justify-center gap-3 py-16 px-6 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl"
          >
            <span className="text-5xl" aria-hidden="true">ðŸ”</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              KhÃ´ng tÃ¬m tháº¥y tá»« nÃ o phÃ¹ há»£p
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
              KhÃ´ng cÃ³ tá»« nÃ o khá»›p vá»›i tá»« khÃ³a hoáº·c nhÃ³m Ä‘ang chá»n. HÃ£y thá»­:
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-left max-w-md list-disc list-inside">
              <li>Kiá»ƒm tra láº¡i chÃ­nh táº£ tá»« khÃ³a (vÃ­ dá»¥: <span className="font-bold">recieve</span> â†’ nháº­p <span className="font-bold">receive</span>)</li>
              <li>Báº¥m <span className="font-bold">Táº¥t Cáº£ Tá»« Vá»±ng</span> Ä‘á»ƒ bá» giá»›i háº¡n nhÃ³m Ä‘ang lá»c</li>
              <li>Hoáº·c tra cá»©u trong <span className="font-bold">BÃ¡ch Khoa Tá»« Äiá»ƒn</span> (26.500+ má»¥c)</li>
            </ul>
            {(searchQuery || activeCategory !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition cursor-pointer touch-manipulation"
              >
                ðŸ”„ XÃ³a tÃ¬m kiáº¿m & xem táº¥t cáº£ tá»«
              </button>
            )}
          </div>
        )}
        {filteredWords.map((item) => {
          const isSaved = savedIds[item.id];
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 content-auto transform-gpu"
            >
              <div className="space-y-3">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {item.word}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-ipa font-semibold tracking-wide">
                      {item.phonetic} â€¢{' '}
                      <span className="italic text-emerald-600 dark:text-emerald-400 font-sans">
                        {item.type}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      speakText(item.word);
                    }}
                    title="Nghe phÃ¡t Ã¢m chuáº©n"
                    className="w-10 h-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 transition cursor-pointer touch-manipulation shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Meaning */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    ðŸ‡»ðŸ‡³ {item.meaningVi}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.definitionEn}
                  </div>
                </div>

                {/* Example sentence */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Ngá»¯ cáº£nh cÃ¢u thá»±c táº¿:</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        speakText(item.exampleSentence);
                      }}
                      className="text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer text-[10px] dark:text-emerald-300"
                    >
                      <Volume2 className="w-3 h-3" /> Nghe cÃ¢u
                    </button>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    &quot;{item.exampleSentence}&quot;
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic px-1">
                    {item.exampleTranslation}
                  </p>
                </div>

                {/* Pro Tips / Collocations */}
                {item.tips && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item.tips}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  href={`/practice/speaking`}
                  onClick={() => sound.playClick()}
                  className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 font-semibold"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-500" /> Luyá»‡n NÃ³i
                </Link>

                <button
                  onClick={() => handleSaveBookmark(item)}
                  disabled={isSaved}
                  className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                    isSaved
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> ÄÃ£ LÆ°u Bookmark
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" /> LÆ°u Sá»• Tay
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

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

export default function VocabularyPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'all', label: 'Tất Cả Từ Vựng' },
    { id: 'it-scrum', label: '💻 IT: Daily Standup' },
    { id: 'it-review', label: '🛠️ IT: Code Review' },
    { id: 'it-bug', label: '🐛 IT: Debug & Bug Triage' },
    { id: 'it-architecture', label: '🏛️ IT: System Architecture' },
    { id: 'office-english', label: '🏢 Office & Workplace' },
    { id: 'daily-smalltalk', label: '🤝 Daily: Small Talk' },
    { id: 'daily-travel', label: '✈️ Daily: Travel & Commute' },
    { id: 'daily-cafe', label: '☕ Daily: Cafe & Dining' },
    { id: 'daily-opinion', label: '💡 Daily: Bày Tỏ Quan Điểm' },
    { id: 'daily-family', label: '🏠 Daily: Gia Đình & Nhà Cửa' },
    { id: 'daily-food', label: '🍜 Daily: Ăn Uống & Nấu Nướng' },
    { id: 'daily-health', label: '💪 Daily: Sức Khỏe & Thể Chất' },
    { id: 'daily-shopping', label: '🛍️ Daily: Mua Sắm & Tiền Bạc' },
    { id: 'daily-fun', label: '🎬 Daily: Phim Nhạc & Giải Trí' },
    { id: 'daily-weather', label: '🌦️ Daily: Thời Tiết & Bốn Mùa' },
    { id: 'it-interview', label: '🎯 IT: Tech Interview' },
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
          note: item.tips || 'Từ vựng từ thư viện',
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
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Thư Viện Từ Vựng IT & Daily
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Học Từ Vựng Giao Tiếp Theo Ngữ Cảnh
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl mt-1">
              Phát âm chuẩn IPA, collocations bản xứ, ghi nhớ bằng tình huống thực tế và lưu vào sổ tay cá nhân.
            </p>
          </div>
          <Link
            href="/flashcards"
            onClick={() => sound.playClick()}
            className="btn-3d btn-3d-white px-4 py-2.5 min-h-[44px] text-xs font-black text-slate-800 shadow-md transition flex items-center gap-1.5 cursor-pointer touch-manipulation dark:text-slate-200"
          >
            Lật Flashcard Ôn Tập
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
              placeholder="Tìm kiếm từ vựng (VD: blocker, refactor, cafe...)"
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
        {/* Empty state: search không trả kết quả -> nói rõ thay vì để trang trắng */}
        {filteredWords.length === 0 && (
          <div
            role="status"
            aria-live="polite"
            className="col-span-full flex flex-col items-center justify-center gap-3 py-16 px-6 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl"
          >
            <span className="text-5xl" aria-hidden="true">🔍</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Không tìm thấy từ nào phù hợp
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
              Không có từ nào khớp với từ khóa hoặc nhóm đang chọn. Hãy thử:
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-left max-w-md list-disc list-inside">
              <li>Kiểm tra lại chính tả từ khóa (ví dụ: <span className="font-bold">recieve</span> → nhập <span className="font-bold">receive</span>)</li>
              <li>Bấm <span className="font-bold">Tất Cả Từ Vựng</span> để bỏ giới hạn nhóm đang lọc</li>
              <li>Hoặc tra cứu trong <span className="font-bold">Bách Khoa Từ Điển</span> (26.500+ mục)</li>
            </ul>
            {(searchQuery || activeCategory !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="mt-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition cursor-pointer touch-manipulation"
              >
                🔄 Xóa tìm kiếm & xem tất cả từ
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
                      {item.phonetic} •{' '}
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
                    title="Nghe phát âm chuẩn"
                    className="w-10 h-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 transition cursor-pointer touch-manipulation shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Meaning */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    🇻🇳 {item.meaningVi}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.definitionEn}
                  </div>
                </div>

                {/* Example sentence */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Ngữ cảnh câu thực tế:</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        speakText(item.exampleSentence);
                      }}
                      className="text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer text-[10px] dark:text-emerald-300"
                    >
                      <Volume2 className="w-3 h-3" /> Nghe câu
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
                  <Mic className="w-3.5 h-3.5 text-emerald-500" /> Luyện Nói
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
                      <Check className="w-3.5 h-3.5" /> Đã Lưu Bookmark
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" /> Lưu Sổ Tay
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

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { sound } from '@/lib/soundFx';
import { speakText } from '@/lib/speech';
import { getStoredUser } from '@/lib/auth';
import {
  Bookmark,
  Volume2,
  Trash2,
  Edit3,
  Check,
  Search,
  Layers,
  Sparkles,
  Download,
  Plus,
} from 'lucide-react';

interface BookmarkItem {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  context_sentence: string;
  note: string;
  tags: string;
  mastery_level: number;
  created_at: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual new word modal/inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newNote, setNewNote] = useState('');

  const fetchBookmarks = () => {
    const user = getStoredUser();
    fetch(`/api/bookmarks?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setBookmarks(data.bookmarks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookmarks();
    window.addEventListener('auth-state-changed', fetchBookmarks);
    return () => window.removeEventListener('auth-state-changed', fetchBookmarks);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá từ vựng này khỏi sổ tay?')) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (b: BookmarkItem) => {
    sound.playClick();
    setEditingId(b.id);
    setEditNote(b.note || '');
  };

  const handleSaveEdit = async (id: string) => {
    sound.playClick();
    const target = bookmarks.find((b) => b.id === id);
    if (!target) return;

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getStoredUser().id,
          word: target.word,
          phonetic: target.phonetic,
          translation: target.translation,
          contextSentence: target.context_sentence,
          note: editNote,
          tags: target.tags,
        }),
      });
      if (res.ok) {
        sound.playSuccess();
        setBookmarks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, note: editNote } : b))
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newTranslation) return;
    sound.playClick();

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getStoredUser().id,
          word: newWord.trim(),
          phonetic: `/${newWord.trim().toLowerCase()}/`,
          translation: newTranslation.trim(),
          note: newNote.trim() || 'Thêm thủ công',
          tags: 'manual',
        }),
      });
      if (res.ok) {
        sound.playSuccess();
        setShowAddModal(false);
        setNewWord('');
        setNewTranslation('');
        setNewNote('');
        fetchBookmarks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJSON = () => {
    sound.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `english-bookmarks-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchQuery =
        b.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.note && b.note.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = selectedTag === 'all' || b.tags.includes(selectedTag);
      return matchQuery && matchTag;
    });
  }, [bookmarks, searchQuery, selectedTag]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Bookmark className="w-3.5 h-3.5 text-amber-200" /> Sổ Tay Từ Vựng Cá Nhân (SQLite Vault)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Kho Từ Vựng & Ghi Chú Của Bạn
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl mt-1">
              Toàn bộ từ bạn bôi đen trên web hoặc lưu lại đều nằm tại đây, sẵn sàng ôn tập bằng Flashcard 3D.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-white text-orange-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow hover:bg-orange-50 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm Từ Mới
            </button>
            <Link
              href="/flashcards"
              onClick={() => sound.playClick()}
              className="px-4 py-2 bg-slate-900 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow hover:bg-slate-800 transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-400" /> Ôn Bằng Flashcard
            </Link>
            <button
              onClick={handleExportJSON}
              title="Xuất file JSON sao lưu"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-2xl transition text-white cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trong sổ tay (từ vựng, nghĩa, ghi chú cá nhân)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'highlight', 'IT', 'Daily', 'manual'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                sound.playClick();
                setSelectedTag(tag);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTag === tag
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tag === 'all' ? 'Tất cả' : `#${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Đang tải dữ liệu từ SQLite database...
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">
            Chưa có từ vựng nào trong danh mục này!
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bạn có thể bôi đen bất kỳ từ tiếng Anh nào trên website rồi bấm <b>&quot;Lưu Bookmark&quot;</b> hoặc tự bấm <b>&quot;Thêm Từ Mới&quot;</b> ở trên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map((b) => {
            const isEditing = editingId === b.id;
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-3 content-auto transform-gpu"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {b.word}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {b.tags}
                        </span>
                      </h3>
                      {b.phonetic && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-ipa font-semibold tracking-wide">
                          {b.phonetic}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          sound.playClick();
                          speakText(b.word);
                        }}
                        title="Nghe phát âm"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-emerald-600 cursor-pointer transition"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        title="Xoá khỏi sổ tay"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    🇻🇳 {b.translation}
                  </div>

                  {b.context_sentence && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                      &quot;{b.context_sentence}&quot;
                    </div>
                  )}

                  {/* Note Section */}
                  <div className="pt-1">
                    {isEditing ? (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <textarea
                          rows={2}
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border focus:border-amber-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(b.id)}
                          className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Lưu Ghi Chú
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <p className="leading-snug">
                          📝 {b.note || 'Chưa có ghi chú'}
                        </p>
                        <button
                          onClick={() => handleStartEdit(b)}
                          className="text-slate-400 hover:text-amber-500 p-1 cursor-pointer"
                          title="Sửa ghi chú"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Mức độ nhớ: {b.mastery_level}/5</span>
                  <span>{new Date(b.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Thêm Từ Vựng Mới Vào Sổ Tay
            </h3>
            <form onSubmit={handleAddManual} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Từ / Cụm từ tiếng Anh:
                </label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="VD: hotfix, scalability, make sense..."
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nghĩa tiếng Việt:
                </label>
                <input
                  type="text"
                  required
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="VD: sửa lỗi nóng tức thì trên production..."
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Ghi chú riêng:
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="VD: Dùng khi họp báo cáo sự cố..."
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow"
                >
                  Lưu Vào Sổ Tay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

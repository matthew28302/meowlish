'use client';

import React, { useState } from 'react';
import { LISTENING_EXERCISES, ListeningExercise } from '@/lib/data/practice';
import { sound } from '@/lib/soundFx';
import { speakText } from '@/lib/speech';
import confetti from '@/lib/confetti';
import {
  Headphones,
  Volume2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { getStoredUser } from '@/lib/auth';

export default function ListeningPracticePage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Session persistence states
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('session_listening_practice_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.currentIdx !== undefined) {
            setSavedSessionData(parsed);
            setHasSavedSession(true);
          }
        } catch (e) {}
      }
    }
  }, []);

  React.useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  const exercise = LISTENING_EXERCISES[currentIdx];

  const handlePlayAudio = (rate: number = 0.9) => {
    sound.playClick();
    speakText(exercise.audioScript, rate);
  };

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    sound.playClick();
    setSelectedOption(idx);
    setIsSubmitted(true);

    const isCorrect = idx === exercise.correctIndex;
    if (isCorrect) {
      sound.playSuccess();
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
      });
      const user = getStoredUser();
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleType: 'listening',
          itemId: exercise.id,
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

  const handleNext = () => {
    sound.playClick();
    setCurrentIdx((prev) => (prev + 1) % LISTENING_EXERCISES.length);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowTranscript(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12 space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 dark:bg-slate-900/20">
              <Headphones className="w-3.5 h-3.5 text-amber-300" /> Phòng Luyện Nghe Phản Xạ
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Luyện Nghe Hội Thoại IT & Đời Thường
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm max-w-xl mt-1">
              Nghe audio bản xứ, bắt từ khoá trọng tâm và trả lời câu hỏi trắc nghiệm ngữ cảnh.
            </p>
          </div>
          <div className="text-xs bg-white/10 px-4 py-2 rounded-2xl border border-white/20 font-bold dark:bg-slate-900/10">
            Bài {currentIdx + 1} / {LISTENING_EXERCISES.length}
          </div>
        </div>
      </div>

      {/* Session Persistence Alert Banner */}
      {hasSavedSession && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200 dark:bg-amber-950 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📌</span>
            <div>
              <h4 className="font-black text-sm text-amber-950 dark:text-amber-200">
                Bạn có 1 bài luyện nghe dở chưa hoàn thành!
              </h4>
              <p className="text-xs text-amber-800 font-medium dark:text-amber-200">
                Bạn muốn tiếp tục tiến độ dở dang hay bắt đầu bài mới?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                if (savedSessionData?.currentIdx !== undefined) setCurrentIdx(savedSessionData.currentIdx);
                if (savedSessionData?.selectedOption !== undefined) setSelectedOption(savedSessionData.selectedOption);
                if (savedSessionData?.isSubmitted !== undefined) setIsSubmitted(savedSessionData.isSubmitted);
                setHasSavedSession(false);
              }}
              className="btn-3d btn-3d-emerald px-4 py-2 text-xs font-black shadow-xs cursor-pointer"
            >
              ▶️ Tiếp tục bài dở
            </button>
            <button
              onClick={() => {
                sound.playClick();
                if (typeof window !== 'undefined') sessionStorage.removeItem('session_listening_practice_v2');
                setHasSavedSession(false);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 cursor-pointer dark:text-slate-400 hover:dark:text-slate-100 dark:bg-slate-900 dark:border-white/10"
            >
              Bắt đầu bài mới
            </button>
          </div>
        </div>
      )}

      {/* Topic Filter & Random Set Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 dark:bg-slate-900 dark:border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0">
            Chủ đề:
          </span>
          <button
            onClick={() => {
              sound.playClick();
              setCurrentIdx(0);
              setSelectedOption(null);
              setIsSubmitted(false);
            }}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer shrink-0"
          >
            🌟 Tất cả bài nghe
          </button>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            const randomIdx = Math.floor(Math.random() * LISTENING_EXERCISES.length);
            setCurrentIdx(randomIdx);
            setSelectedOption(null);
            setIsSubmitted(false);
            setShowTranscript(false);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          🎲 Chọn Đề Ngẫu Nhiên
        </button>
      </div>

      {/* Audio Player Card */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">
            Người nói: {exercise.speakerRole}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePlayAudio(0.95)}
              className="px-4 py-2.5 min-h-[40px] bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer touch-manipulation"
            >
              <Volume2 className="w-4 h-4" /> Nghe Tốc Độ Chuẩn (1x)
            </button>
            <button
              onClick={() => handlePlayAudio(0.75)}
              className="px-3.5 py-2.5 min-h-[40px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer touch-manipulation"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" /> Nghe Chậm (0.75x)
            </button>
          </div>
        </div>

        {/* Audio Wave Visualizer mockup */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="flex items-center justify-center gap-1 h-12">
            {[40, 60, 20, 80, 100, 50, 70, 30, 90, 65, 45, 85, 35, 75].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="w-1.5 bg-gradient-to-t from-sky-500 to-teal-400 rounded-full transition-all"
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bấm nút &quot;Nghe Tốc Độ Chuẩn&quot; ở trên để bắt đầu nghe đoạn audio mẫu.
          </p>

          {/* Transcript Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs text-slate-500 hover:text-sky-600 font-semibold flex items-center gap-1.5 mx-auto cursor-pointer dark:text-slate-400 hover:dark:text-sky-300"
            >
              {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showTranscript ? 'Ẩn lời thoại văn bản' : 'Xem lời thoại văn bản (Transcript)'}
            </button>

            {showTranscript && (
              <div className="mt-3 p-4 bg-white dark:bg-slate-900 border rounded-2xl text-left space-y-2 text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  &quot;{exercise.audioScript}&quot;
                </p>
                <p className="text-slate-500 italic dark:text-slate-400">
                  🇻🇳 {exercise.transcriptVi}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comprehension Question */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Câu hỏi: {exercise.question}
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {exercise.options.map((opt, idx) => {
              let btnStyle =
                'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-sky-400';

              if (isSubmitted) {
                if (idx === exercise.correctIndex) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-500 font-bold';
                } else if (idx === selectedOption) {
                  btnStyle = 'bg-rose-500 text-white border-rose-500 line-through';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-3.5 rounded-2xl border-2 text-xs sm:text-sm text-left transition cursor-pointer ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {isSubmitted && (
            <div
              className={`p-4 rounded-2xl border-2 text-xs sm:text-sm font-medium animate-in fade-in duration-200 ${
                selectedOption === exercise.correctIndex
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="font-bold mb-1">
                {selectedOption === exercise.correctIndex
                  ? '🎉 Rất chính xác! (+25 EXP)'
                  : '❌ Chưa chính xác!'}
              </div>
              {exercise.explanation}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              setSelectedOption(null);
              setIsSubmitted(false);
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer dark:text-slate-400 hover:dark:text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Nghe lại từ đầu
          </button>

          <button
            onClick={handleNext}
            className="btn-3d btn-3d-slate px-5 py-2.5 min-h-[44px] text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md touch-manipulation"
          >
            Bài Nghe Tiếp Theo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

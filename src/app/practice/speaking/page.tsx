'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SPEAKING_PROMPTS, SpeakingPrompt } from '@/lib/data/practice';
import { sound } from '@/lib/soundFx';
import {
  speakText,
  evaluatePronunciation,
  PronunciationResult,
  createSpeechRecognizer,
  SpeechRecognitionController,
} from '@/lib/speech';
import confetti from '@/lib/confetti';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ArrowRight,
  Filter,
} from 'lucide-react';
import MascotCompanion from '@/components/MascotCompanion';
import { getStoredUser } from '@/lib/auth';

export default function SpeakingPracticePage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [showManualTest, setShowManualTest] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'IT' | 'Daily'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Challenging'>('all');

  // Session persistence states
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('session_speaking_practice_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.promptId) {
            setSavedSessionData(parsed);
            setHasSavedSession(true);
          }
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    return SPEAKING_PROMPTS.filter((p) => {
      const catMatch = categoryFilter === 'all' || p.category === categoryFilter;
      const diffMatch = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
      return catMatch && diffMatch;
    });
  }, [categoryFilter, difficultyFilter]);

  const prompt = filteredPrompts[currentIdx % filteredPrompts.length] || SPEAKING_PROMPTS[0];

  // Speech recognizer ref with proper cleanup
  const recognizerRef = useRef<SpeechRecognitionController | null>(null);

  // Stable evaluate callback using useCallback
  const handleEvaluate = useCallback(
    (spoken: string) => {
      if (!spoken.trim()) return;
      const evalResult = evaluatePronunciation(prompt.targetSentence, spoken);
      setResult(evalResult);

      if (evalResult.overallScore >= 75) {
        sound.playCelebration();
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        // Save progress to SQLite DB
        const user = getStoredUser();
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            moduleType: 'speaking',
            itemId: prompt.id,
            score: evalResult.overallScore,
            expGained: 30,
          }),
        })
          .then(() => {
            window.dispatchEvent(new Event('auth-state-changed'));
          })
          .catch(() => {});
      } else {
        sound.playError();
      }
    },
    [prompt.targetSentence, prompt.id]
  );

  // BUG FIX: Proper cleanup on prompt change / unmount - destroy old recognizer
  useEffect(() => {
    // Destroy previous recognizer if exists
    if (recognizerRef.current) {
      recognizerRef.current.destroy();
      recognizerRef.current = null;
    }

    const recognizer = createSpeechRecognizer(
      (text, isFinal) => {
        setRecognizedText(text);
        if (isFinal) {
          handleEvaluate(text);
        }
      },
      (error) => {
        console.warn('Speech error:', error);
        setIsListening(false);
      },
      (listening) => {
        setIsListening(listening);
      }
    );

    recognizerRef.current = recognizer;
    setSpeechSupported(recognizer.isSupported);

    // Cleanup: destroy recognizer when prompt changes or component unmounts
    return () => {
      recognizer.destroy();
    };
  }, [prompt.id, handleEvaluate]);

  const handleToggleRecord = () => {
    sound.playClick();
    if (isListening) {
      // Stopping: the recognizer will emit the last transcript as final via onend handler
      recognizerRef.current?.stop();
    } else {
      setRecognizedText('');
      setResult(null);
      recognizerRef.current?.start();
    }
  };

  const handleManualTestSubmit = () => {
    if (!customInput.trim()) return;
    sound.playClick();
    setRecognizedText(customInput.trim());
    handleEvaluate(customInput.trim());
  };

  const handleNextPrompt = () => {
    sound.playClick();
    // Stop any active recording first
    if (isListening) {
      recognizerRef.current?.destroy();
      setIsListening(false);
    }
    setCurrentIdx((prev) => (prev + 1) % filteredPrompts.length);
    setRecognizedText('');
    setResult(null);
    setCustomInput('');
  };

  const handlePrevPrompt = () => {
    sound.playClick();
    if (isListening) {
      recognizerRef.current?.destroy();
      setIsListening(false);
    }
    setCurrentIdx((prev) => (prev - 1 + filteredPrompts.length) % filteredPrompts.length);
    setRecognizedText('');
    setResult(null);
    setCustomInput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12 space-y-8 overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 dark:bg-slate-900/20">
              <Mic className="w-3.5 h-3.5 text-amber-300" /> Phòng Luyện Nói AI Voice & Shadowing
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Luyện Phát Âm & Chấm Điểm Giọng Nói
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl mt-1">
              Hệ thống tự động lắng nghe giọng nói của bạn, phân tích độ chuẩn xác từng từ bằng thuật toán LCS và chấm điểm phản xạ.
            </p>
          </div>
          <div className="text-xs bg-white/10 px-4 py-2 rounded-2xl border border-white/20 font-bold dark:bg-slate-900/10">
            Câu {(currentIdx % filteredPrompts.length) + 1} / {filteredPrompts.length}
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
                Bạn có 1 bài luyện nói dở chưa hoàn thành!
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
                if (savedSessionData?.recognizedText) setRecognizedText(savedSessionData.recognizedText);
                setHasSavedSession(false);
              }}
              className="btn-3d btn-3d-emerald px-4 py-2 text-xs font-black shadow-xs cursor-pointer"
            >
              ▶️ Tiếp tục bài dở
            </button>
            <button
              onClick={() => {
                sound.playClick();
                if (typeof window !== 'undefined') sessionStorage.removeItem('session_speaking_practice_v2');
                setHasSavedSession(false);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 cursor-pointer dark:text-slate-400 hover:dark:text-slate-100 dark:bg-slate-900 dark:border-white/10"
            >
              Bắt đầu bài mới
            </button>
          </div>
        </div>
      )}

      {/* BUG FIX: Browser support warning when speech is not supported */}
      {!speechSupported && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 dark:text-amber-300" />
          <div>
            <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">Trình duyệt không hỗ trợ nhận diện giọng nói</h3>
            <p className="text-xs text-amber-800 mt-1 dark:text-amber-200">
              Trình duyệt hiện tại của bạn không hỗ trợ Web Speech API. Vui lòng sử dụng <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> để trải nghiệm tính năng luyện nói bằng microphone. Bạn vẫn có thể dùng bộ giả lập nhập văn bản bên dưới để test chấm điểm.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 dark:bg-slate-900 dark:border-white/10">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5" /> Lọc bài:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'IT', 'Daily'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => { sound.playClick(); setCategoryFilter(cat); setCurrentIdx(0); setResult(null); setRecognizedText(''); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                categoryFilter === cat ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 hover:dark:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'Tất cả' : cat === 'IT' ? '💻 IT & Scrum' : '☕ Đời sống'}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-slate-200 hidden sm:block dark:bg-slate-700" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'Easy', 'Medium', 'Challenging'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => { sound.playClick(); setDifficultyFilter(diff); setCurrentIdx(0); setResult(null); setRecognizedText(''); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                difficultyFilter === diff ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 hover:dark:bg-slate-700'
              }`}
            >
              {diff === 'all' ? 'Mọi cấp độ' : diff === 'Easy' ? '🌱 Easy' : diff === 'Medium' ? '⚡ Medium' : '🔥 Challenging'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Practice Arena */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 dark:bg-slate-900 dark:border-white/10">
        {/* Topic Info */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {prompt.category} • {prompt.topic}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              prompt.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' :
              prompt.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
            }`}>
              {prompt.difficulty === 'Easy' ? '🌱' : prompt.difficulty === 'Medium' ? '⚡' : '🔥'} {prompt.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                sound.playClick();
                speakText(prompt.targetSentence, 0.9);
              }}
              className="px-3.5 py-2 min-h-[40px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200 touch-manipulation dark:bg-emerald-950 hover:dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
            >
              <Volume2 className="w-4 h-4" /> Nghe mẫu 1x
            </button>
            <button
              onClick={() => {
                sound.playClick();
                speakText(prompt.targetSentence, 0.65);
              }}
              className="px-3.5 py-2 min-h-[40px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer touch-manipulation dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-slate-300"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" /> Chậm 0.65x
            </button>
          </div>
        </div>

        {/* Target Sentence Card */}
        <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-emerald-400/50 text-center space-y-3 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Câu Mẫu Cần Nói:
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-relaxed dark:text-slate-100">
            &quot;{prompt.targetSentence}&quot;
          </p>
          <div className="text-xs sm:text-sm font-ipa text-emerald-600 font-semibold tracking-wide dark:text-emerald-300">
            {prompt.phonetic}
          </div>
          <div className="text-xs text-slate-500 italic dark:text-slate-400">
            🇻🇳 {prompt.translation}
          </div>
          {prompt.tips && (
            <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 inline-block dark:text-amber-200 dark:bg-amber-950 dark:border-amber-800">
              💡 Mẹo phát âm: {prompt.tips}
            </div>
          )}
        </div>

        {/* Live Mic Recording Action */}
        <div className="flex flex-col items-center justify-center space-y-4 pt-2">
          <button
            onClick={handleToggleRecord}
            disabled={!speechSupported}
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
              !speechSupported
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:text-slate-400'
                : isListening
                ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-300 scale-105'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white hover:scale-105 active:scale-95'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 sm:w-10 sm:h-10" />
            ) : (
              <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
            )}

            {/* Pulsing ring animation when recording */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-30" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-400 animate-bounce flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                </span>
              </>
            )}
          </button>

          <span className="text-xs sm:text-sm font-bold text-slate-700 text-center max-w-md dark:text-slate-300">
            {!speechSupported
              ? '⚠️ Trình duyệt chưa hỗ trợ mic. Dùng Chrome hoặc Edge, hoặc nhập text bên dưới.'
              : isListening
              ? '🎙️ Đang lắng nghe... Nói xong câu rồi bấm nút đỏ để dừng và chấm điểm'
              : '🎤 Bấm micro rồi nói to, rõ ràng theo câu mẫu phía trên'}
          </span>

          {recognizedText && (
            <div className="w-full max-w-lg p-3.5 bg-slate-100 rounded-2xl text-center space-y-1 dark:bg-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Hệ thống nghe được:</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">&quot;{recognizedText}&quot;</p>
            </div>
          )}
        </div>

        {/* Evaluation Results Card */}
        {result && (
          <div className="bg-slate-50 rounded-2xl p-6 border-2 border-emerald-500/40 space-y-5 animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${
                    result.overallScore >= 75
                      ? 'bg-emerald-500 text-white'
                      : result.overallScore >= 50
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {result.overallScore}%
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {result.overallScore >= 80
                      ? '🎉 Phát âm rất xuất sắc!'
                      : result.overallScore >= 60
                      ? '👍 Khá tốt! Hãy chú ý các từ màu cam'
                      : '💪 Cần luyện thêm ngữ điệu và trọng âm nhé!'}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Phân tích độ chính xác theo từng từ bên dưới:
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-bold dark:text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Chuẩn
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-bold dark:text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Gần đúng
                </span>
                <span className="flex items-center gap-1 text-rose-600 font-bold dark:text-rose-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Chưa khớp
                </span>
              </div>
            </div>

            {/* Word by word breakdown - BUG FIX: compare cleaned words to avoid punctuation mismatch */}
            <div className="flex flex-wrap gap-2 pt-2">
              {result.wordResults.map((w, idx) => {
                let badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800';
                if (w.isCorrect) {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold dark:bg-emerald-950 dark:text-emerald-200';
                } else if (w.isClose) {
                  badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800';
                }

                // Clean both words for comparison to avoid false "nghe:" display due to punctuation
                const targetClean = w.targetWord.toLowerCase().replace(/[^a-z0-9']/g, '');
                const spokenClean = w.spokenWord?.toLowerCase().replace(/[^a-z0-9']/g, '') || '';

                return (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl border-2 text-xs flex flex-col items-center ${badgeClass}`}
                  >
                    <span>{w.targetWord}</span>
                    {w.spokenWord && spokenClean !== targetClean && (
                      <span className="text-[9px] opacity-75 font-mono">
                        (nghe: {w.spokenWord})
                      </span>
                    )}
                    {!w.spokenWord && (
                      <span className="text-[9px] opacity-60 font-mono text-rose-600 dark:text-rose-300">
                        (chưa nghe thấy)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fallback Simulator if microphone is not available */}
        <div className="pt-4 border-t border-slate-100 text-center dark:border-white/10">
          <button
            onClick={() => setShowManualTest(!showManualTest)}
            className="text-xs text-slate-500 hover:text-emerald-600 underline cursor-pointer dark:text-slate-400 hover:dark:text-emerald-300"
          >
            {showManualTest ? 'Ẩn bộ giả lập' : '⚙️ Không có mic? Thử bộ giả lập nhập văn bản để test chấm điểm'}
          </button>

          {showManualTest && (
            <div className="mt-3 flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualTestSubmit(); }}
                placeholder="Nhập câu bạn muốn test chấm điểm..."
                className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs dark:bg-slate-900"
              />
              <button
                onClick={handleManualTestSubmit}
                className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Chấm điểm
              </button>
            </div>
          )}
        </div>

        {/* Navigation bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrevPrompt}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer border border-slate-200 touch-manipulation dark:text-slate-400 hover:dark:bg-slate-800 dark:border-white/10"
            >
              ← Câu Trước
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setRecognizedText('');
                setResult(null);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer touch-manipulation dark:text-slate-400 hover:dark:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Thử Lại
            </button>
          </div>

          <button
            onClick={handleNextPrompt}
            className="btn-3d btn-3d-emerald px-6 py-2.5 min-h-[44px] text-xs font-black shadow-md cursor-pointer touch-manipulation"
          >
            Câu Tiếp Theo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mascot cheer */}
      <div className="flex justify-center">
        <MascotCompanion
          mood="focused"
          message="Hãy mở to khẩu hình miệng và nói dứt khoát các âm cuối như /s/, /t/, /d/ nhé!"
        />
      </div>
    </div>
  );
}

'use client';

import type { Metadata } from 'next';

import React, { useState } from 'react';
import { ROLEPLAY_SCENARIOS, RoleplayScenario } from '@/lib/data/practice';
import { sound } from '@/lib/soundFx';
import { speakText } from '@/lib/speech';
import confetti from '@/lib/confetti';
import {
  Gamepad2,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ChevronRight,
  Users,
} from 'lucide-react';
import MascotCompanion from '@/components/MascotCompanion';
import { getStoredUser } from '@/lib/auth';

type RoleplayMode = 'select' | 'playing';

export const metadata: Metadata = {
  title: 'Luyện Hội thoại Roleplay AI - Meowlish',
  description: 'Luyện giao tiếp tiếng Anh qua các tình huống roleplay với AI: đặt hàng, phỏng vấn, trò chuyện hàng ngày.',
};

export default function RoleplayPage() {
  const [mode, setMode] = useState<RoleplayMode>(ROLEPLAY_SCENARIOS.length > 1 ? 'select' : 'playing');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedRespId, setSelectedRespId] = useState<string | null>(null);
  const [history, setHistory] = useState<
    { speaker: string; text: string; isPartner: boolean }[]
  >([]);
  const [score, setScore] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);

  // Session persistence states
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('session_roleplay_practice_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.scenarioIdx !== undefined) {
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

  const scenario = ROLEPLAY_SCENARIOS[scenarioIdx];
  const currentStep = scenario?.steps[currentStepIdx];
  const isFinished = currentStepIdx >= (scenario?.steps.length || 0);

  const startScenario = (idx: number) => {
    sound.playClick();
    setScenarioIdx(idx);
    const sc = ROLEPLAY_SCENARIOS[idx];
    setCurrentStepIdx(0);
    setSelectedRespId(null);
    setScore(0);
    setTotalResponses(0);
    setHistory([
      {
        speaker: sc.partnerRole,
        text: sc.steps[0].partnerMessage,
        isPartner: true,
      },
    ]);
    setMode('playing');
  };

  const handleSelectResponse = (resp: {
    id: string;
    text: string;
    translation: string;
    isPoliteAndEffective: boolean;
    feedback: string;
  }) => {
    sound.playClick();
    setSelectedRespId(resp.id);
    setTotalResponses((prev) => prev + 1);

    if (resp.isPoliteAndEffective) {
      sound.playSuccess();
      setScore((prev) => prev + 1);
    } else {
      sound.playError();
    }

    // Add user response to history
    const newHist = [
      ...history,
      { speaker: scenario.userRole, text: resp.text, isPartner: false },
    ];
    setHistory(newHist);
  };

  const handleNextTurn = () => {
    sound.playClick();
    const nextIdx = currentStepIdx + 1;

    if (nextIdx < scenario.steps.length) {
      setCurrentStepIdx(nextIdx);
      setSelectedRespId(null);
      setHistory((prev) => [
        ...prev,
        {
          speaker: scenario.partnerRole,
          text: scenario.steps[nextIdx].partnerMessage,
          isPartner: true,
        },
      ]);
    } else {
      setCurrentStepIdx(nextIdx); // Finished
      sound.playCelebration();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      const user = getStoredUser();
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleType: 'roleplay',
          itemId: scenario.id,
          score: totalResponses > 0 ? Math.round((score / totalResponses) * 100) : 100,
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
    setCurrentStepIdx(0);
    setSelectedRespId(null);
    setScore(0);
    setTotalResponses(0);
    setHistory([
      {
        speaker: scenario.partnerRole,
        text: scenario.steps[0].partnerMessage,
        isPartner: true,
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12 space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7c6cc4] via-[#5f66b3] to-[#42968e] dark:from-[#4c4480] dark:via-[#3d4270] dark:to-[#285f5a] rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 dark:bg-slate-900/20">
              <Gamepad2 className="w-3.5 h-3.5 text-amber-300" /> MÃ´ Phá»ng TÃ¬nh Huá»‘ng Thá»±c Táº¿
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              ÄÃ³ng Vai Há»™i Thoáº¡i (Role-play Simulation)
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm max-w-xl mt-1">
              RÃ¨n luyá»‡n pháº£n xáº¡ Ä‘á»‘i Ä‘Ã¡p trong cÃ¡c tÃ¬nh huá»‘ng thá»±c táº¿: Há»p Daily Scrum, phá»ng váº¥n, trao Ä‘á»•i cÃ´ng viá»‡c, gá»i mÃ³n...
            </p>
          </div>
          <div className="text-xs bg-white/10 px-4 py-2 rounded-2xl border border-white/20 font-bold dark:bg-slate-900/10">
            {ROLEPLAY_SCENARIOS.length} ká»‹ch báº£n
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
                Báº¡n cÃ³ 1 ká»‹ch báº£n Ä‘Ã³ng vai dá»Ÿ chÆ°a hoÃ n thÃ nh!
              </h4>
              <p className="text-xs text-amber-800 font-medium dark:text-amber-200">
                Báº¡n muá»‘n tiáº¿p tá»¥c tiáº¿n Ä‘á»™ dá»Ÿ dang hay chá»n ká»‹ch báº£n má»›i?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                if (savedSessionData?.scenarioIdx !== undefined) setScenarioIdx(savedSessionData.scenarioIdx);
                if (savedSessionData?.currentStepIdx !== undefined) setCurrentStepIdx(savedSessionData.currentStepIdx);
                if (savedSessionData?.history) setHistory(savedSessionData.history);
                setMode('playing');
                setHasSavedSession(false);
              }}
              className="btn-3d btn-3d-emerald px-4 py-2 text-xs font-black shadow-xs cursor-pointer"
            >
              â–¶ï¸ Tiáº¿p tá»¥c ká»‹ch báº£n dá»Ÿ
            </button>
            <button
              onClick={() => {
                sound.playClick();
                if (typeof window !== 'undefined') sessionStorage.removeItem('session_roleplay_practice_v2');
                setHasSavedSession(false);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 cursor-pointer dark:text-slate-400 hover:dark:text-slate-100 dark:bg-slate-900 dark:border-white/10"
            >
              Báº¯t Ä‘áº§u bÃ i má»›i
            </button>
          </div>
        </div>
      )}

      {/* Scenario Selection Screen */}
      {mode === 'select' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 dark:text-slate-100">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            Chá»n Ká»‹ch Báº£n Há»™i Thoáº¡i
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROLEPLAY_SCENARIOS.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => startScenario(idx)}
                className="card-arcade card-arcade-purple p-5 text-left space-y-3 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{sc.partnerAvatar}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800">
                    {sc.steps.length} lÆ°á»£t Ä‘á»‘i thoáº¡i
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors leading-snug dark:text-slate-100 group-hover:dark:text-purple-300">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                  {sc.situation}
                </p>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-slate-100 dark:text-slate-400 dark:border-white/10">
                  <span>Vai báº¡n: <span className="text-purple-700 dark:text-purple-300">{sc.userRole}</span></span>
                  <span className="flex items-center gap-1 text-purple-600 group-hover:translate-x-1 transition-transform dark:text-purple-300">
                    Báº¯t Ä‘áº§u <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Conversation Canvas */}
      {mode === 'playing' && scenario && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150 dark:bg-slate-900 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex-1 dark:bg-purple-950 dark:border-purple-800">
              <div className="text-xs font-black uppercase text-purple-700 tracking-wider dark:text-purple-300">
                Ká»‹ch Báº£n: {scenario.title}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
                {scenario.situation}
              </p>
            </div>
            {ROLEPLAY_SCENARIOS.length > 1 && (
              <button
                onClick={() => { sound.playClick(); setMode('select'); }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer shrink-0 dark:text-slate-400 dark:bg-slate-900 hover:dark:bg-slate-800 dark:border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                Äá»•i ká»‹ch báº£n
              </button>
            )}
          </div>

          {/* Conversation Stream */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${
                  msg.isPartner ? 'justify-start' : 'justify-end flex-row-reverse'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-lg shrink-0 dark:bg-slate-700">
                  {msg.isPartner ? scenario.partnerAvatar : 'ðŸ§‘â€ðŸ’»'}
                </div>
                <div
                  className={`max-w-md p-4 rounded-2xl shadow-sm text-xs sm:text-sm space-y-1 ${
                    msg.isPartner
                      ? 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-white/10'
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold opacity-75">
                    <span>{msg.speaker}</span>
                    {msg.isPartner && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          speakText(msg.text);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition cursor-pointer touch-manipulation text-slate-500 hover:text-emerald-600 hover:dark:bg-slate-700 dark:text-slate-400 hover:dark:text-emerald-300"
                        title="Nghe cÃ¢u nÃ y"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="font-medium leading-relaxed">&quot;{msg.text}&quot;</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Panel for Current Step */}
          {!isFinished && currentStep && (
            <div className="pt-4 border-t border-slate-100 space-y-4 dark:border-white/10">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Chá»n cÃ¢u pháº£n há»“i phÃ¹ há»£p vÃ  chuyÃªn nghiá»‡p nháº¥t:
              </div>

              <div className="space-y-3">
                {currentStep.suggestedResponses.map((resp) => {
                  const isSelected = selectedRespId === resp.id;
                  return (
                    <div key={resp.id} className="space-y-2">
                      <button
                        disabled={selectedRespId !== null}
                        onClick={() => handleSelectResponse(resp)}
                        className={`w-full p-4 min-h-[48px] rounded-2xl border-2 text-left text-xs sm:text-sm transition cursor-pointer flex items-start justify-between gap-3 touch-manipulation ${
                          isSelected
                            ? resp.isPoliteAndEffective
                              ? 'bg-emerald-50 border-emerald-500 font-bold dark:bg-emerald-950'
                              : 'bg-rose-50 border-rose-400 font-bold dark:bg-rose-950'
                            : 'bg-white border-slate-200 hover:border-emerald-400 dark:bg-slate-900 dark:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="text-slate-900 font-semibold dark:text-slate-100">
                            &quot;{resp.text}&quot;
                          </div>
                          <div className="text-slate-500 text-xs mt-1 dark:text-slate-400">
                            ðŸ‡»ðŸ‡³ {resp.translation}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            speakText(resp.text);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-500 shrink-0 touch-manipulation hover:dark:bg-slate-800"
                          title="Nghe cÃ¢u"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </button>

                      {isSelected && (
                        <div
                          className={`p-3 rounded-xl text-xs font-medium ${
                            resp.isPoliteAndEffective
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          }`}
                        >
                          {resp.isPoliteAndEffective ? 'âœ¨ ' : 'âš ï¸ '}
                          {resp.feedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedRespId && (
                <div className="pt-2 text-right">
                  <button
                    onClick={handleNextTurn}
                    className="btn-3d btn-3d-emerald px-6 py-2.5 min-h-[44px] text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-1.5 ml-auto cursor-pointer touch-manipulation"
                  >
                    Tiáº¿p Tá»¥c Há»™i Thoáº¡i <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Finished Screen */}
          {isFinished && (
            <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-500 text-center space-y-3 dark:bg-emerald-950">
              <div className="text-4xl">ðŸŽ‰</div>
              <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-200">
                HoÃ n ThÃ nh Ká»‹ch Báº£n Há»™i Thoáº¡i! (+40 EXP)
              </h3>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Äiá»ƒm pháº£n xáº¡: {score}/{totalResponses} cÃ¢u tráº£ lá»i chuyÃªn nghiá»‡p ({totalResponses > 0 ? Math.round((score/totalResponses)*100) : 100}%)
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto dark:text-slate-400">
                Báº¡n Ä‘Ã£ xá»­ lÃ½ tÃ¬nh huá»‘ng giao tiáº¿p ráº¥t tá»‘t. HÃ£y thá»­ cÃ¡c ká»‹ch báº£n khÃ¡c Ä‘á»ƒ nÃ¢ng cao pháº£n xáº¡!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRestart}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition inline-flex items-center gap-1.5 cursor-pointer dark:bg-white dark:text-slate-900 hover:dark:bg-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Thá»±c HÃ nh Láº¡i
                </button>
                {ROLEPLAY_SCENARIOS.length > 1 && (
                  <button
                    onClick={() => { sound.playClick(); setMode('select'); }}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Chá»n Ká»‹ch Báº£n KhÃ¡c <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <MascotCompanion
          mood="proud"
          message="Trong mÃ´i trÆ°á»ng IT quá»‘c táº¿, thÃ¡i Ä‘á»™ chá»§ Ä‘á»™ng vÃ  bÃ¡o cÃ¡o Ä‘Ãºng trá»ng tÃ¢m luÃ´n Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ cao nháº¥t!"
        />
      </div>
    </div>
  );
}

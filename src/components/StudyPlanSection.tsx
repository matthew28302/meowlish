'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Lock, ClipboardList, CalendarDays, TriangleAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/sound';
import { getStoredUser, getCurrentUser, setStoredUser } from '@/lib/auth';
import {
  buildStudyPlan,
  STUDY_DAY_REWARD,
  STUDY_PENALTIES,
  studyDayItemId,
  studyDayId,
  penaltyItemId,
  todayStr,
  type StudyItemKind,
} from '@/lib/studyPlanData';

/**
 * StudyPlanSection — Kế hoạch học 28 ngày theo lộ trình (H17 — 2026-10-12).
 *
 * - Học bài bản theo thứ tự từng bài, ngày sau khoá tới khi xong ngày trước.
 * - Mỗi ngày: bài học + ôn lại (spaced repetition) + test hằng ngày.
 * - Bỏ bài (-10🪙-10⭐) / bỏ test (-20/-20) / bỏ cả ngày (-40/-40) → trừ thật
 *   qua nhánh `study_penalty` của /api/progress (kẹp sàn 0, mỗi khoản 1 lần).
 * - Tự chứa dữ liệu (fetch /api/progress riêng), gắn dưới section lộ trình.
 */
export default function StudyPlanSection({ pathId }: { pathId: string }) {
  const plan = useMemo(() => buildStudyPlan(pathId), [pathId]);
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const reloadProgress = () => {
    const user = getStoredUser();
    if (!user?.id) return;
    fetch(`/api/progress?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.progress)) {
          const s = new Set<string>();
          for (const p of data.progress) {
            if (p.module_type === 'study_day_item' || p.module_type === 'study_day' || p.module_type === 'study_penalty') {
              s.add(`${p.module_type}:${p.item_id}`);
            }
          }
          setDoneKeys(s);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    reloadProgress();
    window.addEventListener('auth-state-changed', reloadProgress);
    return () => window.removeEventListener('auth-state-changed', reloadProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  const postProgress = async (payload: Record<string, unknown>) => {
    const user = getCurrentUser();
    if (!user?.id) {
      sound.playWrong();
      alert('Vui lòng đăng nhập để lưu tiến độ kế hoạch học!');
      return null;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...payload }),
      });
      const data = await res.json();
      if (data.user) setStoredUser(data.user);
      return data;
    } catch {
      sound.playWrong();
      return null;
    } finally {
      setBusy(false);
    }
  };

  const penaltyPrefix = (day: number, what: string) =>
    `study_penalty:plan:${pathId}:d${day}:penalty:${what}:`;

  const isDaySkipped = (day: number) =>
    [...doneKeys].some((k) => k.startsWith(penaltyPrefix(day, 'skipday')));

  const isDayCompleted = (day: number) => doneKeys.has(`study_day:${studyDayId(pathId, day)}`);

  const isDayResolved = (day: number) => isDayCompleted(day) || isDaySkipped(day);

  const isItemDone = (day: number, kind: StudyItemKind, idx: number) =>
    doneKeys.has(`study_day_item:${studyDayItemId(pathId, day, kind, idx)}`);

  const isItemSkipped = (day: number, kind: string, idx: number) =>
    [...doneKeys].some((k) => k.startsWith(penaltyPrefix(day, `${kind}-${idx}`)));

  const isItemResolved = (day: number, kind: StudyItemKind, idx: number) =>
    isItemDone(day, kind, idx) || isItemSkipped(day, kind, idx);

  const markItemDone = async (day: number, kind: StudyItemKind, idx: number) => {
    sound.playClick();
    const data = await postProgress({
      moduleType: 'study_day_item',
      itemId: studyDayItemId(pathId, day, kind, idx),
      score: 100,
      expGained: 5,
      coinsGained: 3,
    });
    if (data && (data.success || data.alreadyCompleted)) {
      setDoneKeys((prev) => new Set(prev).add(`study_day_item:${studyDayItemId(pathId, day, kind, idx)}`));
      sound.playSuccess();
    }
  };

  const skipItem = async (day: number, kind: 'lesson' | 'test', idx: number) => {
    const pen = kind === 'test' ? STUDY_PENALTIES.skipTest : STUDY_PENALTIES.skipLesson;
    if (!confirm(`${pen.label}: trừ ${pen.coins} Coins và ${pen.exp} EXP. Bạn chắc chắn muốn bỏ qua?`)) return;
    sound.playClick();
    const data = await postProgress({
      moduleType: 'study_penalty',
      itemId: penaltyItemId(pathId, day, `${kind}-${idx}`, todayStr()),
      expPenalty: pen.exp,
      coinsPenalty: pen.coins,
    });
    if (data && (data.penalized || data.alreadyPenalized)) {
      reloadProgress();
      sound.playWrong();
    }
  };

  const completeDay = async (day: number, hasSkip: boolean) => {
    sound.playCelebration();
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
    // Ngày có mục bỏ qua thì thưởng rút gọn (đã bị phạt riêng từng mục).
    const reward = hasSkip ? { exp: 10, coins: 5 } : STUDY_DAY_REWARD;
    const data = await postProgress({
      moduleType: 'study_day',
      itemId: studyDayId(pathId, day),
      score: 100,
      expGained: reward.exp,
      coinsGained: reward.coins,
    });
    if (data && (data.success || data.alreadyCompleted)) {
      setDoneKeys((prev) => new Set(prev).add(`study_day:${studyDayId(pathId, day)}`));
    }
  };

  const skipDay = async (day: number) => {
    const pen = STUDY_PENALTIES.skipDay;
    if (!confirm(`${pen.label}: trừ ${pen.coins} Coins và ${pen.exp} EXP, ngày sau sẽ mở khoá. Bạn chắc chắn?`)) return;
    sound.playClick();
    const data = await postProgress({
      moduleType: 'study_penalty',
      itemId: penaltyItemId(pathId, day, 'skipday', todayStr()),
      expPenalty: pen.exp,
      coinsPenalty: pen.coins,
    });
    if (data && (data.penalized || data.alreadyPenalized)) {
      reloadProgress();
      sound.playWrong();
    }
  };

  if (!plan) return null;

  const resolvedCount = plan.days.filter((d) => isDayResolved(d.day)).length;
  const percent = Math.round((resolvedCount / plan.totalDays) * 100);
  const currentDay = plan.days.find((d) => !isDayResolved(d.day)) ?? null;

  const dayItemsResolved = (day: number, lessonCount: number, needTest: boolean, needReview: boolean) => {
    for (let i = 0; i < lessonCount; i++) if (!isItemResolved(day, 'lesson', i)) return false;
    if (needTest && !isItemResolved(day, 'test', 0)) return false;
    if (needReview && !isItemResolved(day, 'review', 0)) return false;
    return true;
  };
  const dayHasSkip = (day: number, lessonCount: number, needTest: boolean, needReview: boolean) => {
    for (let i = 0; i < lessonCount; i++) if (isItemSkipped(day, 'lesson', i)) return true;
    if (needTest && isItemSkipped(day, 'test', 0)) return true;
    if (needReview && isItemSkipped(day, 'review', 0)) return true;
    return false;
  };

  const renderItemRow = (
    day: number,
    kind: StudyItemKind,
    idx: number,
    icon: string,
    title: string,
    sub: string,
    href?: string
  ) => {
    const done = isItemDone(day, kind, idx);
    const skipped = isItemSkipped(day, kind, idx);
    return (
      <div
        key={`${kind}-${idx}`}
        className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition ${
          done
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
            : skipped
            ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-white/10'
        }`}
      >
        <span className="text-xl shrink-0">{done ? '✅' : skipped ? '⚠️' : icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black text-slate-800 truncate dark:text-slate-100">{title}</div>
          <div className="text-[11px] text-slate-500 font-medium truncate dark:text-slate-400">{sub}</div>
        </div>
        {href && !done && !skipped && (
          <Link
            href={href}
            onClick={() => sound.playClick()}
            className="px-3 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition cursor-pointer flex items-center shrink-0"
          >
            Học →
          </Link>
        )}
        {!done && !skipped && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => markItemDone(day, kind, idx)}
              className="px-3 py-2 min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-black transition cursor-pointer disabled:opacity-50 shrink-0 dark:bg-white dark:text-slate-900"
            >
              Xong
            </button>
            {kind !== 'review' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => skipItem(day, kind as 'lesson' | 'test', idx)}
                title={kind === 'test' ? `Bỏ test (−${STUDY_PENALTIES.skipTest.coins}🪙 −${STUDY_PENALTIES.skipTest.exp}⭐)` : `Bỏ bài (−${STUDY_PENALTIES.skipLesson.coins}🪙 −${STUDY_PENALTIES.skipLesson.exp}⭐)`}
                className="px-2.5 py-2 min-h-[40px] rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-[11px] font-black border border-rose-200 transition cursor-pointer disabled:opacity-50 shrink-0 dark:bg-slate-800 dark:border-rose-800"
              >
                Bỏ
              </button>
            )}
          </>
        )}
        {(done || skipped) && (
          <span className={`text-[11px] font-black px-2 py-1 rounded-lg shrink-0 ${done ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}>
            {done ? 'Đã xong' : 'Đã bỏ'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200 shadow-sm space-y-5 dark:bg-slate-900 dark:border-indigo-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-2xl text-xl dark:bg-indigo-950 dark:text-indigo-200">📅</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight dark:text-slate-100">
              Kế Hoạch Học 28 Ngày
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 dark:text-slate-400">
            {plan.pathTitle} — mỗi ngày vừa đủ bài, có ôn lại, có test. Bỏ bài/test/ngày sẽ bị trừ Coins & EXP!
          </p>
        </div>
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-3 sm:px-5 shrink-0 flex items-center gap-3 dark:bg-indigo-950 dark:border-indigo-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
            {percent}%
          </div>
          <div>
            <div className="text-xs font-black text-indigo-900 dark:text-indigo-200">Tiến Độ 28 Ngày</div>
            <div className="text-[12px] font-extrabold text-indigo-700 dark:text-indigo-300">
              Xong {resolvedCount} / {plan.totalDays} ngày
            </div>
          </div>
        </div>
      </div>

      {/* Quy tắc phạt */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
        <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Kỷ luật thép: bỏ 1 bài −{STUDY_PENALTIES.skipLesson.coins}🪙 −{STUDY_PENALTIES.skipLesson.exp}⭐ •
          bỏ test ngày −{STUDY_PENALTIES.skipTest.coins}🪙 −{STUDY_PENALTIES.skipTest.exp}⭐ •
          bỏ cả ngày −{STUDY_PENALTIES.skipDay.coins}🪙 −{STUDY_PENALTIES.skipDay.exp}⭐.
          Ngày sau chỉ mở khi xong (hoặc chịu phạt) ngày trước.
        </span>
      </div>

      {/* Dải 28 chấm */}
      <div className="flex items-center gap-1.5 flex-wrap" aria-label="Tiến độ 28 ngày">
        {plan.days.map((d) => {
          const st = isDayCompleted(d.day) ? 'done' : isDaySkipped(d.day) ? 'skipped' : currentDay?.day === d.day ? 'current' : 'locked';
          return (
            <div
              key={d.day}
              title={`Ngày ${d.day}${d.isMockDay ? ' (Thi thử)' : d.isReviewDay ? ' (Ôn tập)' : ''}`}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border-2 ${
                st === 'done'
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : st === 'skipped'
                  ? 'bg-rose-400 text-white border-rose-500'
                  : st === 'current'
                  ? 'bg-indigo-500 text-white border-indigo-600 ring-2 ring-indigo-300 animate-pulse'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
              }`}
            >
              {st === 'done' ? '✓' : d.day}
            </div>
          );
        })}
      </div>

      {/* Thẻ ngày hiện tại */}
      {currentDay ? (
        <div className="rounded-3xl border-2 border-indigo-300 bg-indigo-50/50 p-4 sm:p-5 space-y-3 dark:bg-indigo-950/30 dark:border-indigo-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black">
              <CalendarDays className="w-3.5 h-3.5" /> NGÀY {currentDay.day} / {plan.totalDays}
            </span>
            {currentDay.isMockDay && (
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black">🏆 THI THỬ TỔNG HỢP</span>
            )}
            {currentDay.isReviewDay && (
              <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black">🔁 NGÀY ÔN TẬP</span>
            )}
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              ⏱ ~{currentDay.minutes} phút • 🎯 {currentDay.focus}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{currentDay.theme}</h3>

          <div className="space-y-2">
            {currentDay.lessons.map((l, i) =>
              renderItemRow(currentDay.day, 'lesson', i, l.icon || '📘', l.title, l.description, l.href)
            )}
            {currentDay.reviewOfDays.length > 0 &&
              renderItemRow(
                currentDay.day,
                'review',
                0,
                '🔁',
                currentDay.isReviewDay ? 'Ôn toàn bộ các ngày trước' : `Ôn lại ngày ${currentDay.reviewOfDays.join(', ')}`,
                'Mở flashcards / sổ từ để ôn nhanh',
                '/flashcards'
              )}
            {currentDay.hasDailyTest &&
              renderItemRow(
                currentDay.day,
                'test',
                0,
                '📝',
                'Test kiểm tra ngày',
                'Làm bài test rồi quay lại bấm "Đã làm"',
                currentDay.testHref
              )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={
                busy ||
                !dayItemsResolved(
                  currentDay.day,
                  currentDay.lessons.length,
                  currentDay.hasDailyTest,
                  currentDay.reviewOfDays.length > 0
                )
              }
              onClick={() =>
                completeDay(
                  currentDay.day,
                  dayHasSkip(currentDay.day, currentDay.lessons.length, currentDay.hasDailyTest, currentDay.reviewOfDays.length > 0)
                )
              }
              className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>
                Hoàn thành ngày {currentDay.day} (+{STUDY_DAY_REWARD.exp}⭐ +{STUDY_DAY_REWARD.coins}🪙)
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => skipDay(currentDay.day)}
              className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-black border-2 border-rose-200 transition cursor-pointer dark:bg-slate-800 dark:border-rose-800"
            >
              Bỏ cả ngày (−{STUDY_PENALTIES.skipDay.coins}🪙 −{STUDY_PENALTIES.skipDay.exp}⭐)
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">
            Nút "Hoàn thành" chỉ sáng khi mọi mục trong ngày đều Xong (hoặc đã chịu phạt mục đó).
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center space-y-2 dark:bg-emerald-950/30 dark:border-emerald-700">
          <div className="text-4xl">🎓</div>
          <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-200">
            Xuất sắc! Bạn đã đi hết 28 ngày của lộ trình!
          </h3>
          <p className="text-xs text-emerald-700 font-medium dark:text-emerald-300">
            Hãy chọn lộ trình khác ở trên để chinh phục tiếp, hoặc làm lại từ ngày 1 để giữ chuỗi streak.
          </p>
        </div>
      )}

      {/* Danh sách ngày khoá (xem trước) */}
      <details className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <summary className="px-4 py-3 text-xs font-black text-slate-600 cursor-pointer hover:bg-slate-50 flex items-center gap-2 dark:text-slate-300 dark:hover:bg-white/5">
          <ClipboardList className="w-4 h-4" /> Xem toàn bộ 28 ngày (ngày sau khoá tới khi xong ngày trước)
        </summary>
        <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-72 overflow-y-auto custom-scrollbar">
          {plan.days.map((d) => {
            const unlocked = d.day === 1 || isDayResolved(d.day - 1);
            return (
              <div key={d.day} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isDayResolved(d.day)
                      ? 'bg-emerald-500 text-white'
                      : unlocked
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
                  }`}
                >
                  {isDayResolved(d.day) ? '✓' : unlocked ? d.day : <Lock className="w-3 h-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-black text-slate-700 dark:text-slate-200">Ngày {d.day}: </span>
                  <span className="font-medium text-slate-500 dark:text-slate-400 truncate">{d.theme}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 shrink-0 hidden sm:inline">
                  {d.lessons.length > 0 ? `${d.lessons.length} bài` : 'Ôn tập'} • {d.hasDailyTest || d.isMockDay ? 'có test' : ''} • ~{d.minutes}&apos;
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

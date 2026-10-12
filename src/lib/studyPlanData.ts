import { LEARNING_PATHS, type PathLesson } from './learningPathsData';

/**
 * Kế hoạch học 28 ngày theo lộ trình (H17 — 2026-10-12).
 *
 * Yêu cầu user: chọn 1 lộ trình trong các lộ trình sẵn có → học bài bản theo
 * thứ tự từng bài, chia theo ngày (vừa đủ, có ôn lại, có test mỗi ngày, đủ
 * 4 kỹ năng khi tới level), bỏ bài/bỏ test/bỏ ngày → trừ xu & EXP.
 *
 * Thiết kế:
 * - Sinh XÁC ĐỊNH (deterministic) từ LEARNING_PATHS sẵn có — không hardcode
 *   bài theo từng path, thêm path mới là tự có kế hoạch.
 * - 28 ngày: ngày 1–27 học + test hằng ngày, ngày 7/14/21 ÔN TẬP tuần,
 *   ngày 28 thi thử tổng hợp (lấy từ node mock của path).
 * - Spaced repetition: mỗi ngày thường ôn lại ngày d-7, d-14, d-21.
 * - Tiến độ lưu qua /api/progress với module_type riêng:
 *   `study_day_item` (từng bài/test/ôn), `study_day` (xong ngày, +thưởng),
 *   `study_penalty` (khoản phạt — xem nhánh trừ trong progress/route.ts).
 */

export const STUDY_PLAN_DAYS = 28;
export const REVIEW_INTERVAL = 7;

export interface StudyPlanLesson extends PathLesson {
  nodeId: string;
  nodeTitle: string;
}

export type StudyItemKind = 'lesson' | 'test' | 'review';

export interface StudyDay {
  day: number;
  theme: string;
  focus: string;
  minutes: number;
  lessons: StudyPlanLesson[];
  reviewOfDays: number[];
  hasDailyTest: boolean;
  testHref: string;
  isReviewDay: boolean;
  isMockDay: boolean;
}

export interface StudyPlan {
  pathId: string;
  pathTitle: string;
  totalDays: number;
  days: StudyDay[];
}

const FOCUS_LABEL: Record<string, string> = {
  speaking: 'Nói',
  listening: 'Nghe',
  writing: 'Viết',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
  flashcards: 'Ôn từ',
  exam: 'Thi thử',
  roleplay: 'Đóng vai',
};

const range = (from: number, to: number): number[] => {
  const out: number[] = [];
  for (let d = from; d <= to; d++) out.push(d);
  return out;
};

/** Gọn tên mốc cho thẻ ngày (bỏ tiền tố "Mốc N:" nếu có). */
const shortTheme = (stageTitle: string): string =>
  stageTitle.replace(/^Mốc\s*\d+\s*:\s*/i, '').slice(0, 64);

export function buildStudyPlan(pathId: string): StudyPlan | null {
  const path = LEARNING_PATHS[pathId];
  if (!path) return null;

  // Pool bài thường (bỏ bài thi mock), giữ đúng thứ tự node của lộ trình.
  const pool: StudyPlanLesson[] = [];
  const mockLessons: StudyPlanLesson[] = [];
  for (const node of path.nodes) {
    for (const l of node.lessons) {
      const item: StudyPlanLesson = { ...l, nodeId: node.id, nodeTitle: node.stageTitle };
      if (node.isMockTest && l.type === 'exam') mockLessons.push(item);
      else pool.push(item);
    }
  }
  if (pool.length === 0) return null;

  const days: StudyDay[] = [];
  let cursor = 0;
  for (let d = 1; d <= STUDY_PLAN_DAYS; d++) {
    // Ngày cuối: thi thử tổng hợp.
    if (d === STUDY_PLAN_DAYS) {
      days.push({
        day: d,
        theme: 'Thi thử tổng hợp cả lộ trình',
        focus: 'Thi thử',
        minutes: 45,
        lessons: mockLessons,
        reviewOfDays: [d - 7, d - 6, d - 5],
        hasDailyTest: false,
        testHref: mockLessons[0]?.href ?? '/exam',
        isReviewDay: false,
        isMockDay: true,
      });
      continue;
    }
    // Ngày ôn tập tuần: không bài mới, chỉ ôn + test.
    if (d % REVIEW_INTERVAL === 0) {
      days.push({
        day: d,
        theme: `Ôn tập tuần ${d / REVIEW_INTERVAL} + Test tuần`,
        focus: 'Ôn tập + Test',
        minutes: 25,
        lessons: [],
        reviewOfDays: range(d - REVIEW_INTERVAL + 1, d - 1),
        hasDailyTest: true,
        testHref: `/exam?category=${path.examCode}`,
        isReviewDay: true,
        isMockDay: false,
      });
      continue;
    }
    // Ngày thường: 2 bài mới xoay vòng theo thứ tự pool (hết vòng lặp lại —
    // chính là ôn cách quãng), kèm ôn ngày cũ.
    const a = pool[cursor % pool.length];
    cursor++;
    const b = pool[cursor % pool.length];
    cursor++;
    const lessons = a === b ? [a] : [a, b];
    const reviewOfDays: number[] = [];
    if (d - 7 >= 1) reviewOfDays.push(d - 7);
    if (d - 14 >= 1) reviewOfDays.push(d - 14);
    if (d - 21 >= 1) reviewOfDays.push(d - 21);
    const focus = [...new Set(lessons.map((l) => FOCUS_LABEL[l.type] ?? l.type))].join(' + ');
    days.push({
      day: d,
      theme: shortTheme(a.nodeTitle),
      focus,
      minutes: 20 + lessons.length * 5,
      lessons,
      reviewOfDays,
      hasDailyTest: true,
      testHref: `/exam?category=${path.examCode}`,
      isReviewDay: false,
      isMockDay: false,
    });
  }

  return { pathId: path.id, pathTitle: path.title, totalDays: STUDY_PLAN_DAYS, days };
}

/** Thưởng khi hoàn thành 1 ngày (đi qua flow cộng thường của /api/progress). */
export const STUDY_DAY_REWARD = { exp: 25, coins: 15 } as const;

/** Mức phạt (đi qua nhánh `study_penalty` — server clamp mỗi khoản ≤ 60). */
export const STUDY_PENALTIES = {
  skipLesson: { exp: 10, coins: 10, label: 'Bỏ 1 bài học trong ngày' },
  skipTest: { exp: 20, coins: 20, label: 'Bỏ test ngày' },
  skipDay: { exp: 40, coins: 40, label: 'Bỏ cả ngày học' },
} as const;

export type StudyPenaltyKind = keyof typeof STUDY_PENALTIES;

/** itemId hoàn thành từng mục trong ngày (module `study_day_item`). */
export const studyDayItemId = (pathId: string, day: number, kind: StudyItemKind, idx: number): string =>
  `plan:${pathId}:d${day}:${kind}:${idx}`;

/** itemId hoàn thành ngày (module `study_day`). */
export const studyDayId = (pathId: string, day: number): string => `plan:${pathId}:d${day}`;

/** itemId khoản phạt (module `study_penalty`) — gắn ngày để mỗi khoản 1 lần. */
export const penaltyItemId = (pathId: string, day: number, what: string, dateStr: string): string =>
  `plan:${pathId}:d${day}:penalty:${what}:${dateStr}`;

export const todayStr = (): string => new Date().toISOString().split('T')[0];

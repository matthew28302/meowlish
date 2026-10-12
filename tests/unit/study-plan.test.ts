import { describe, expect, it } from 'vitest';
import {
  buildStudyPlan,
  STUDY_PLAN_DAYS,
  STUDY_PENALTIES,
  STUDY_DAY_REWARD,
  studyDayItemId,
  studyDayId,
  penaltyItemId,
} from '@/lib/studyPlanData';
import { LEARNING_PATHS } from '@/lib/learningPathsData';

const PATH_IDS = ['toeic', 'vstep', 'ielts', 'toefl', 'it_work', 'daily_comm'];

describe('Study plan 28 ngay — sinh tu LEARNING_PATHS', () => {
  it('tra ve null voi path khong ton tai', () => {
    expect(buildStudyPlan('khong-co')).toBeNull();
  });

  it('moi lo trinh co dung 28 ngay', () => {
    for (const id of PATH_IDS) {
      const plan = buildStudyPlan(id);
      expect(plan, `plan "${id}"`).not.toBeNull();
      expect(plan!.totalDays).toBe(STUDY_PLAN_DAYS);
      expect(plan!.days.length).toBe(STUDY_PLAN_DAYS);
      expect(plan!.days.map((d) => d.day)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
    }
  });

  it('ngay 7/14/21 la ngay on tap (khong bai moi, co test)', () => {
    for (const id of PATH_IDS) {
      const plan = buildStudyPlan(id)!;
      for (const d of [7, 14, 21]) {
        const day = plan.days[d - 1];
        expect(day.isReviewDay, `${id} ngay ${d}`).toBe(true);
        expect(day.lessons.length, `${id} ngay ${d} khong bai moi`).toBe(0);
        expect(day.hasDailyTest, `${id} ngay ${d} co test`).toBe(true);
        expect(day.reviewOfDays.length, `${id} ngay ${d} on 6 ngay`).toBe(6);
      }
    }
  });

  it('ngay 28 la thi thu tong hop', () => {
    for (const id of PATH_IDS) {
      const plan = buildStudyPlan(id)!;
      const last = plan.days[27];
      expect(last.isMockDay, `${id} ngay 28`).toBe(true);
      expect(last.hasDailyTest, `${id} ngay 28 khong test rieng`).toBe(false);
      expect(last.lessons.length, `${id} ngay 28 co bai thi`).toBeGreaterThan(0);
      expect(last.lessons[0].type, `${id} ngay 28 la exam`).toBe('exam');
      expect(last.lessons[0].href.startsWith('/exam'), `${id} ngay 28 href exam`).toBe(true);
    }
  });

  it('ngay thuong co 1-2 bai theo dung thu tu lo trinh', () => {
    const plan = buildStudyPlan('toeic')!;
    const day1 = plan.days[0];
    expect(day1.lessons.length).toBeGreaterThanOrEqual(1);
    expect(day1.lessons.length).toBeLessThanOrEqual(2);
    expect(day1.hasDailyTest).toBe(true);
    expect(day1.testHref.startsWith('/exam')).toBe(true);
    // Deterministic: sinh 2 lan giong nhau
    const again = buildStudyPlan('toeic')!;
    expect(JSON.stringify(again.days)).toBe(JSON.stringify(plan.days));
  });

  it('spaced repetition: ngay 8 on ngay 1, ngay 15 on 8+1, ngay 22 on 15+8+1', () => {
    const plan = buildStudyPlan('toeic')!;
    expect(plan.days[7].reviewOfDays).toEqual([1]);
    expect(plan.days[14].reviewOfDays).toEqual([8, 1]);
    expect(plan.days[21].reviewOfDays).toEqual([15, 8, 1]);
  });

  it('moi bai trong ngay deu co lesson hop le (title, href noi bo)', () => {
    for (const id of PATH_IDS) {
      const plan = buildStudyPlan(id)!;
      for (const day of plan.days) {
        for (const l of day.lessons) {
          expect(l.title.length, `${id} d${day.day} title`).toBeGreaterThan(0);
          expect(l.href.startsWith('/'), `${id} d${day} href`).toBe(true);
          expect(l.nodeId.length, `${id} d${day} nodeId`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('Study plan — muc phat va itemId', () => {
  it('muc phat duong va trong han muc server (<=60)', () => {
    for (const k of Object.keys(STUDY_PENALTIES) as (keyof typeof STUDY_PENALTIES)[]) {
      expect(STUDY_PENALTIES[k].exp).toBeGreaterThan(0);
      expect(STUDY_PENALTIES[k].coins).toBeGreaterThan(0);
      expect(STUDY_PENALTIES[k].exp).toBeLessThanOrEqual(60);
      expect(STUDY_PENALTIES[k].coins).toBeLessThanOrEqual(60);
    }
    // Thu tu nang dan: bo bai < bo test < bo ngay
    expect(STUDY_PENALTIES.skipLesson.coins).toBeLessThan(STUDY_PENALTIES.skipTest.coins);
    expect(STUDY_PENALTIES.skipTest.coins).toBeLessThan(STUDY_PENALTIES.skipDay.coins);
  });

  it('thuong ngay duong', () => {
    expect(STUDY_DAY_REWARD.exp).toBeGreaterThan(0);
    expect(STUDY_DAY_REWARD.coins).toBeGreaterThan(0);
  });

  it('itemId duy nhat theo (path, ngay, loai, index)', () => {
    const ids = new Set<string>();
    for (const id of PATH_IDS) {
      const plan = buildStudyPlan(id)!;
      for (const day of plan.days) {
        ids.add(studyDayId(id, day.day));
        day.lessons.forEach((_, i) => ids.add(studyDayItemId(id, day.day, 'lesson', i)));
        if (day.hasDailyTest) ids.add(studyDayItemId(id, day.day, 'test', 0));
        if (day.reviewOfDays.length > 0) ids.add(studyDayItemId(id, day.day, 'review', 0));
      }
    }
    // 6 path * (28 ngay + items) — khong trung nhau
    expect(ids.size).toBeGreaterThan(6 * 28);
    expect(penaltyItemId('toeic', 3, 'skipday', '2026-10-12')).toBe('plan:toeic:d3:penalty:skipday:2026-10-12');
  });

  it('LEARNING_PATHS goc khong bi thay doi', () => {
    expect(Object.keys(LEARNING_PATHS).sort()).toEqual([...PATH_IDS].sort());
  });
});

import { describe, expect, it } from 'vitest';
import { LEARNING_PATHS } from '@/lib/learningPathsData';

const EXPECTED_PATH_IDS = ['toeic', 'vstep', 'ielts', 'toefl', 'it_work', 'daily_comm'];
const LESSON_TYPES = [
  'speaking',
  'listening',
  'writing',
  'grammar',
  'vocabulary',
  'flashcards',
  'exam',
  'roleplay',
] as const;

describe('LEARNING_PATHS integrity', () => {
  it('has exactly 6 learning paths', () => {
    expect(Object.keys(LEARNING_PATHS).sort()).toEqual([...EXPECTED_PATH_IDS].sort());
  });

  it('every path has required metadata and at least one node', () => {
    for (const id of EXPECTED_PATH_IDS) {
      const p = LEARNING_PATHS[id];
      expect(p, `path "${id}" exists`).toBeDefined();
      expect(p.id, `path "${id}" id matches key`).toBe(id);
      expect(p.shortLabel.length, `path "${id}" shortLabel`).toBeGreaterThan(0);
      expect(p.title.length, `path "${id}" title`).toBeGreaterThan(0);
      expect(p.badge.length, `path "${id}" badge`).toBeGreaterThan(0);
      expect(p.description.length, `path "${id}" description`).toBeGreaterThan(0);
      expect(p.targetScores.length, `path "${id}" targetScores`).toBeGreaterThan(0);
      expect(p.nodes.length, `path "${id}" nodes`).toBeGreaterThan(0);
    }
  });

  it('node ids are globally unique and rewards are positive', () => {
    const seen = new Set<string>();
    for (const p of Object.values(LEARNING_PATHS)) {
      for (const n of p.nodes) {
        expect(n.id.length, `node id non-empty (${p.id})`).toBeGreaterThan(0);
        expect(seen.has(n.id), `duplicate node id "${n.id}"`).toBe(false);
        seen.add(n.id);
        expect(n.stageTitle.length, `node "${n.id}" stageTitle`).toBeGreaterThan(0);
        expect(n.targetScore.length, `node "${n.id}" targetScore`).toBeGreaterThan(0);
        expect(n.description.length, `node "${n.id}" description`).toBeGreaterThan(0);
        expect(n.skills.length, `node "${n.id}" skills`).toBeGreaterThan(0);
        expect(n.expReward, `node "${n.id}" expReward`).toBeGreaterThan(0);
        expect(n.coinReward, `node "${n.id}" coinReward`).toBeGreaterThan(0);
        expect(n.lessons.length, `node "${n.id}" lessons`).toBeGreaterThan(0);
      }
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it('every lesson has valid type and internal href', () => {
    for (const p of Object.values(LEARNING_PATHS)) {
      for (const n of p.nodes) {
        for (const l of n.lessons) {
          expect(l.title.length, `lesson title (${n.id})`).toBeGreaterThan(0);
          expect(
            (LESSON_TYPES as readonly string[]).includes(l.type),
            `lesson type "${l.type}" (${n.id})`,
          ).toBe(true);
          expect(l.href.startsWith('/'), `lesson href "${l.href}" (${n.id})`).toBe(true);
          expect(l.description.length, `lesson description (${n.id})`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('each path ends with a mock-test exam node', () => {
    for (const p of Object.values(LEARNING_PATHS)) {
      const mocks = p.nodes.filter((n) => n.isMockTest);
      expect(mocks.length, `path "${p.id}" has a mock test node`).toBeGreaterThan(0);
      const last = p.nodes[p.nodes.length - 1];
      expect(last.isMockTest, `path "${p.id}" last node is mock test`).toBe(true);
      const examLesson = last.lessons.find((l) => l.type === 'exam');
      expect(examLesson, `path "${p.id}" mock node has exam lesson`).toBeDefined();
      expect(examLesson!.href.startsWith('/exam'), `path "${p.id}" exam href`).toBe(true);
    }
  });
});

import { describe, expect, it, vi } from 'vitest';
import { generatePvPQuestion, generateRacingQuestion } from '@/lib/petQuizData';

describe('petQuizData generators', () => {
  it('generateRacingQuestion returns 4 unique options containing the answer (x20)', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateRacingQuestion();
      expect(q.options, `q${i} options defined`).toBeDefined();
      expect(q.options!.length, `q${i} has 4 options`).toBe(4);
      expect(new Set(q.options!).size, `q${i} options unique`).toBe(4);
      expect(
        q.options!.includes(q.correctAnswer as string),
        `q${i} answer inside options`,
      ).toBe(true);
      expect(['meaning_en_vi', 'meaning_vi_en'], `q${i} type`).toContain(q.type);
      expect(q.prompt.length, `q${i} prompt`).toBeGreaterThan(0);
      expect(String(q.subPrompt ?? '').length, `q${i} subPrompt`).toBeGreaterThan(0);
      expect(q.explanation.length, `q${i} explanation`).toBeGreaterThan(0);
      expect(q.vocabRef.id.length, `q${i} vocabRef`).toBeGreaterThan(0);
      expect(q.id.length, `q${i} id`).toBeGreaterThan(0);
    }
  });

  it('generateRacingQuestion is deterministic under seeded RNG and still valid', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    try {
      const q = generateRacingQuestion();
      expect(q.options!.length).toBe(4);
      expect(q.options!.includes(q.correctAnswer as string)).toBe(true);
      expect(q.type).toBe('meaning_en_vi');
    } finally {
      spy.mockRestore();
    }
  });

  it('generateRacingQuestion reverse branch (vi->en) is valid under seeded RNG', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    try {
      const q = generateRacingQuestion();
      expect(q.options!.length).toBe(4);
      expect(q.options!.includes(q.correctAnswer as string)).toBe(true);
      expect(q.type).toBe('meaning_vi_en');
    } finally {
      spy.mockRestore();
    }
  });

  it('generateRacingQuestion respects excludeIds without crashing', () => {
    const q = generateRacingQuestion(['it-1', 'it-2', 'it-3']);
    expect(q.options!.length).toBe(4);
    expect(q.options!.includes(q.correctAnswer as string)).toBe(true);
    expect(q.vocabRef).toBeDefined();
  });

  it('generatePvPQuestion smoke: valid shape across branches (x10)', () => {
    for (let i = 0; i < 10; i++) {
      const q = generatePvPQuestion();
      expect(q.id.length, `pvp${i} id`).toBeGreaterThan(0);
      expect(q.explanation.length, `pvp${i} explanation`).toBeGreaterThan(0);
      expect(q.vocabRef.id.length, `pvp${i} vocabRef`).toBeGreaterThan(0);
      if (q.type === 'unscramble') {
        expect(Array.isArray(q.correctAnswer), `pvp${i} unscramble answer array`).toBe(true);
        expect(q.scrambledTokens!.length, `pvp${i} scrambled`).toBeGreaterThan(3);
        expect([...q.scrambledTokens!].sort().join(' ')).toBe(
          [...(q.correctAnswer as string[])].sort().join(' '),
        );
      } else {
        expect(q.options!.length, `pvp${i} 4 options`).toBe(4);
        expect(q.options!.includes(q.correctAnswer as string), `pvp${i} answer in options`).toBe(true);
      }
    }
  });
});

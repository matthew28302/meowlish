/**
 * Công thức Lego phải khớp 1-1 với số khối.
 *
 * Lỗi đã gặp: `formulaPattern` tách [Adverb of Frequency] và [Present Simple V]
 * thành 2 slot trong khi cả hai nằm chung một khối "usually code in Python," và
 * để [Connector] lẻ một slot dù khối Time Signal đã gộp cả "but currently".
 * Hậu quả trên UI: công thức dài hơn hẳn dãy khối, người học đối chiếu không
 * khớp và tưởng dữ liệu lỗi. Tổng cộng 3 bài bị lệch (5/4, 5/4, 6/5).
 */
import { describe, it, expect } from 'vitest';
import { GRAMMAR_LESSONS } from '@/lib/data/grammar';

const countSlots = (pattern: string) => (pattern.match(/\[[^\]]+\]/g) || []).length;

// `formulaPattern` là optional: một số bài chỉ có khối, không khai công thức.
// Chỉ kiểm tra những bài thực sự có công thức.
const legoLessons = GRAMMAR_LESSONS.filter((l) => l.legoExample?.blocks?.length);
const withFormula = legoLessons.filter((l) => !!l.legoExample?.formulaPattern);

describe('Ngu phap Lego — cong thuc khop so khoi', () => {
  it('co bai lego de kiem tra', () => {
    expect(legoLessons.length).toBeGreaterThan(3);
  });

  it('MOI cong thuc khop 1-1 voi so khoi', () => {
    const mismatched = withFormula
      .filter((l) => countSlots(l.legoExample!.formulaPattern!) !== l.legoExample!.blocks!.length)
      .map(
        (l) =>
          `${l.id}: cong thuc ${countSlots(l.legoExample!.formulaPattern!)} slot ` +
          `nhưng co ${l.legoExample!.blocks!.length} khoi`
      );
    expect(mismatched.join('\n')).toBe('');
  });

  it('cong thuc khong rong va giu dau ngoac', () => {
    const bad = withFormula
      .filter((l) => {
        const p = l.legoExample!.formulaPattern!;
        return !p.includes('[') || !p.includes(']') || p.trim().length === 0;
      })
      .map((l) => l.id);
    expect(bad.join('\n')).toBe('');
  });

  it('moi khoi co label, word, mau va giai thich', () => {
    const incomplete = legoLessons
      .flatMap((l) =>
        l.legoExample!.blocks!.map((b, i) =>
          b.label && b.word && b.color && b.explanation ? null : `${l.id} khoi #${i}`
        )
      )
      .filter(Boolean);
    expect(incomplete.join('\n')).toBe('');
  });
});

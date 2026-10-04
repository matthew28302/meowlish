import { describe, it, expect } from 'vitest';
import { cleanCollocations, isPlaceholderCollocation } from '@/lib/collocations';

/**
 * Regression guard: `scripts/importFullDictionary.mjs` từng sinh placeholder cho
 * 100% mục từ (26.416/26.416) trong DB, và API từng tự fallback
 * `["<word> in context"]` khi danh sách rỗng. Cả hai làm UI hiện chip vô
 * nghĩa. Bộ lọc này phải chặn được chúng ở tầng API, kể cả khi DB còn dữ liệu
 * cũ (đã nạp trước, hoặc được khôi phục lại từ S3).
 */
describe('isPlaceholderCollocation', () => {
  it('nhận diện placeholder sinh từ template của script import', () => {
    expect(isPlaceholderCollocation('a', 'common a')).toBe(true);
    expect(isPlaceholderCollocation('a', 'a in context')).toBe(true);
    expect(isPlaceholderCollocation('a', 'use a')).toBe(true);
    expect(isPlaceholderCollocation('a', 'use a in sentence')).toBe(true);
    expect(isPlaceholderCollocation('test', 'test in context')).toBe(true);
    expect(isPlaceholderCollocation('api', 'api in context')).toBe(true);
    expect(isPlaceholderCollocation('sql', 'sql in context')).toBe(true);
  });

  it('nhận diện placeholder của endpoint tra cứu 1 từ', () => {
    expect(isPlaceholderCollocation('test', 'test in communication')).toBe(true);
    expect(isPlaceholderCollocation('test', 'standard usage of test')).toBe(true);
  });

  it('không vơ đũa với collocation thật', () => {
    expect(isPlaceholderCollocation('code', 'code review')).toBe(false);
    expect(isPlaceholderCollocation('test', 'unit test')).toBe(false);
    expect(isPlaceholderCollocation('deploy', 'deploy to production')).toBe(false);
    expect(isPlaceholderCollocation('a', 'a lot of')).toBe(false);
  });

  it('coi chuỗi rỗng / không phải chuỗi là placeholder', () => {
    expect(isPlaceholderCollocation('a', '')).toBe(true);
    expect(isPlaceholderCollocation('a', '   ')).toBe(true);
    expect(isPlaceholderCollocation('a', null)).toBe(true);
    expect(isPlaceholderCollocation('a', undefined)).toBe(true);
    expect(isPlaceholderCollocation('a', 42)).toBe(true);
  });

  it('không vỡ khi thiếu từ', () => {
    expect(isPlaceholderCollocation('', 'code review')).toBe(false);
  });
});

describe('cleanCollocations', () => {
  it('loại sạch placeholder, giữ collocation thật và thứ tự', () => {
    expect(cleanCollocations('a', ['common a', 'a in context', 'use a'])).toEqual([]);
    expect(cleanCollocations('code', ['code review', 'code style', 'code in context'])).toEqual([
      'code review',
      'code style',
    ]);
  });

  it('lọc được dữ liệu thực tế đã nạp trong DB (dạng hỗn hợp)', () => {
    const dbRow = ['common a', 'a in context', 'use a'];
    expect(cleanCollocations('a', dbRow)).toEqual([]);
  });

  it('bỏ trùng lặp và trim', () => {
    expect(cleanCollocations('api', [' REST API ', 'REST API', 'api in context'])).toEqual(['REST API']);
  });

  it('trả về mảng rỗng cho input không hợp lệ (UI sẽ ẩn khối)', () => {
    expect(cleanCollocations('a', null)).toEqual([]);
    expect(cleanCollocations('a', undefined)).toEqual([]);
    expect(cleanCollocations('a', 'not-an-array')).toEqual([]);
    expect(cleanCollocations('a', [])).toEqual([]);
  });

  it('giữ nguyên collocation thật của từ ngắn', () => {
    expect(cleanCollocations('a', ['a lot', 'a few'])).toEqual(['a lot', 'a few']);
  });
});
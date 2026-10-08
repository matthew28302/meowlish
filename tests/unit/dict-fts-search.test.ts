/**
 * M8 (audit 2026-10-08): /api/dictionary/search phải dùng FTS5 MATCH prefix
 * (87ms LIKE full-scan → ~0.1ms) và bỏ cột json gộp ~20MB khỏi SELECT.
 *
 * Test ở lớp dữ liệu (giống dictionary-split.test.ts): xác nhận phrase FTS5
 * sinh từ input người dùng (đã vô hiệu hoá toán tử MATCH) tra được từ, nhánh
 * LIKE fallback có ESCAPE đúng wildcard, và route không còn SELECT cột json
 * gộp. Tự bỏ qua khi máy chưa có data/dictionary.db (CI/máy sạch).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const dictPath = path.join(process.cwd(), 'data', 'dictionary.db');
const dictReady = fs.existsSync(dictPath) && fs.statSync(dictPath).size >= 1_000_000;

/** Bản sao buildFtsMatchPhrase trong src/app/api/dictionary/search/route.ts */
function buildFtsMatchPhrase(rawQuery: string): string | null {
  const cleaned = rawQuery
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return `"${cleaned}"*`;
}

describe.skipIf(!dictReady)('dictionary FTS search — data layer (M8)', () => {
  it('FTS5 MATCH prefix tra được từ đúng (q="hello" → hello đứng đầu)', async () => {
    const { dictDb } = await import('@/lib/db');
    const phrase = buildFtsMatchPhrase('hello');
    expect(phrase).toBe('"hello"*');
    const rows = dictDb
      .prepare(
        `SELECT word FROM dictionary_entries
         WHERE rowid IN (SELECT rowid FROM dictionary_fts WHERE dictionary_fts MATCH ?)
         ORDER BY CASE WHEN word = 'hello' THEN 1 ELSE 2 END, length(word) ASC
         LIMIT 5`
      )
      .all(phrase) as Array<{ word: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.word).toBe('hello');
  });

  it('FTS5 prefix trả về cả biến thể từ (q="block" → blocker/…)', async () => {
    const { dictDb } = await import('@/lib/db');
    const phrase = buildFtsMatchPhrase('block');
    expect(phrase).toBe('"block"*');
    const rows = dictDb
      .prepare(
        `SELECT word FROM dictionary_entries
         WHERE rowid IN (SELECT rowid FROM dictionary_fts WHERE dictionary_fts MATCH ?)
         LIMIT 20`
      )
      .all(phrase) as Array<{ word: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.word.startsWith('block'))).toBe(true);
  });

  it('toán tử FTS5 của user bị vô hiệu hoá (không inject được cú pháp MATCH)', async () => {
    const { dictDb } = await import('@/lib/db');
    // Input chứa toán tử MATCH: nếu không vô hiệu hoá, "hello" OR ... trả kết
    // quả của nhiều từ riêng biệt. Sau khi sanitize chỉ còn phrase prefix.
    const phrase = buildFtsMatchPhrase('hello" OR blocker:1');
    // Route đã lowercase q trước khi gọi; hàm chỉ làm sạch ký tự đặc biệt.
    expect(phrase).toBe('"hello OR blocker 1"*');
    // Quan trọng nhất: truy vấn đã vô hiệu hoá chạy được (không ném lỗi cú pháp).
    const rows = dictDb
      .prepare('SELECT COUNT(*) c FROM dictionary_fts WHERE dictionary_fts MATCH ?')
      .get(phrase) as { c: number };
    expect(rows.c).toBeGreaterThanOrEqual(0);
  });

  it('nhánh LIKE fallback có ESCAPE — wildcard % không còn khớp mọi thứ', async () => {
    const { dictDb } = await import('@/lib/db');
    // Không escape: '%' là wildcard → khớp toàn bộ mục từ.
    const unescaped = dictDb
      .prepare('SELECT COUNT(*) c FROM dictionary_entries WHERE word LIKE ?')
      .get('%') as { c: number };
    // Có escape '\%' + ESCAPE '\': chỉ khớp từ chứa dấu % thật (≈0 mục).
    const escaped = dictDb
      .prepare("SELECT COUNT(*) c FROM dictionary_entries WHERE word LIKE ? ESCAPE '\\'")
      .get('\\%') as { c: number };
    expect(unescaped.c).toBeGreaterThan(1000);
    expect(escaped.c).toBeLessThan(10);
  });

  it('route search dùng FTS và không còn SELECT cột json gộp ~20MB', async () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/dictionary/search/route.ts'),
      'utf8',
    );
    expect(routeSource).toContain('dictionary_fts MATCH');
    // Cột json gộp chỉ được phép xuất hiện trong comment, không nằm trong code
    // (SELECT/mapping) — tránh fetch ~20MB vô ích cho mỗi request.
    const codeLines = routeSource
      .split(/\r?\n/)
      .filter((l) => l.includes('data_json') && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    expect(
      codeLines,
      `data_json vẫn nằm trong code (không phải comment): ${codeLines.join(' | ')}`,
    ).toEqual([]);
  });
});

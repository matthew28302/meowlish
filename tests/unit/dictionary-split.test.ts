/**
 * Kiểm chứng việc TÁCH TỪ ĐIỂN khỏi file đồng bộ english_learning.db
 * (audit SRE 2026-10-08: 95% dung lượng DB chính là dictionary_entries +
 * dictionary_cache + FTS — nội dung tĩnh, làm mỗi lần sync S3 đẩy 67MB).
 *
 * File data/ do scripts/split-dictionary.mjs tạo ra và bị .gitignore — test
 * này TỰ BỎ QUA khi chưa có data/dictionary.db (máy sạch/CI), nhưng trên máy
 * dev đã chạy split thì phải pass toàn bộ: đó là kiểm chứng bằng đo, không
 * phải bằng niềm tin.
 *
 * Trạng thái sau khi đã chạy `split-dictionary.mjs --apply`: bảng dictionary
 * KHÔNG còn trong DB chính nữa — mọi truy vấn từ điển phải qua dictDb.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dataDir = path.join(process.cwd(), 'data');
const dictPath = path.join(dataDir, 'dictionary.db');
const mainPath = path.join(dataDir, 'english_learning.db');

// Từ điển hợp lệ: ≥1MB (thực tế ~64MB với 26k mục từ) — ngưỡng giống
// MIN_VALID_DICT_BYTES trong src/lib/db.ts / scripts/restore-s3.js.
const dictReady = fs.existsSync(dictPath) && fs.statSync(dictPath).size >= 1_000_000;

describe.skipIf(!dictReady)('dictionary split — data/dictionary.db', () => {
  it('dictDb (export từ @/lib/db) mở được và trỏ đúng file dictionary.db', async () => {
    const { dictDb } = await import('@/lib/db');
    const rows = dictDb.pragma('database_list') as Array<{ seq: number; name: string; file: string }>;
    const main = rows.find((r) => r.name === 'main');
    expect(main).toBeTruthy();
    expect(path.basename(String(main?.file))).toBe('dictionary.db');
    // Connection sống thật (không phải proxy rỗng)
    expect(dictDb.prepare('SELECT 1 AS ok').get()).toEqual({ ok: 1 });
  });

  it('dictionary_entries có hơn 20.000 mục từ (bản tách đủ, không rỗng)', async () => {
    const { dictDb } = await import('@/lib/db');
    const row = dictDb.prepare('SELECT COUNT(*) c FROM dictionary_entries').get() as { c: number };
    expect(row.c).toBeGreaterThan(20_000);
  });

  it('search LIKE hoạt động trên dictDb (đúng kiểu route /api/dictionary/search)', async () => {
    const { dictDb } = await import('@/lib/db');
    // Câu truy vấn mô phỏng where-clause của route: word LIKE 'q%' OR '%q%'
    const rows = dictDb
      .prepare(
        `SELECT word FROM dictionary_entries
         WHERE (word LIKE ? OR word LIKE ? OR meaning_vi LIKE ?)
         ORDER BY CASE WHEN word = ? THEN 1 WHEN word LIKE ? THEN 2 ELSE 3 END,
                  length(word) ASC, word ASC
         LIMIT 12`
      )
      .all('hel%', '%hel%', '%hel%', 'hello', 'hel%') as Array<{ word: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.word)).toContain('hello');
  });

  it('FTS5 external-content nhất quán với bảng nội dung (MATCH chạy được)', async () => {
    const { dictDb } = await import('@/lib/db');
    // integrity-check ném lỗi nếu index lệch content table
    dictDb.exec(`INSERT INTO dictionary_fts(dictionary_fts) VALUES('integrity-check');`);
    const hit = dictDb
      .prepare(`SELECT COUNT(*) c FROM dictionary_fts WHERE dictionary_fts MATCH 'hello'`)
      .get() as { c: number };
    expect(hit.c).toBeGreaterThan(0);
  });

  it('dictionary_cache tồn tại trong dictionary.db (ghi cache khi tra từ)', async () => {
    const { dictDb } = await import('@/lib/db');
    const row = dictDb.prepare('SELECT COUNT(*) c FROM dictionary_cache').get() as { c: number };
    expect(row.c).toBeGreaterThan(0);
  });

  it('DB chính KHÔNG còn bảng dictionary sau --apply, và file co còn < 10MB', () => {
    // Mở trực tiếp readonly để không kích migration của createDb() trong db.ts
    expect(fs.existsSync(mainPath)).toBe(true);
    const ro = new Database(mainPath, { readonly: true });
    try {
      const leftover = ro
        .prepare(`SELECT name FROM sqlite_master WHERE name LIKE '%dictionary%'`)
        .all() as Array<{ name: string }>;
      expect(
        leftover,
        `DB chính vẫn còn đối tượng dictionary: ${leftover.map((r) => r.name).join(', ')} — chạy lại scripts/split-dictionary.mjs --apply`
      ).toEqual([]);
      // 95% dung lượng cũ là từ điển: sau --apply phải còn dưới 10MB (đo được ~3.5MB)
      expect(fs.statSync(mainPath).size).toBeLessThan(10 * 1024 * 1024);
    } finally {
      ro.close();
    }
  });
});

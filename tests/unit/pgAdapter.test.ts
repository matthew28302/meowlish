/**
 * Bộ dịch placeholder và adapter Postgres.
 *
 * Ý nghĩa: giữ nguyên câu SQL dạng SQLite (`?`) để không phải sửa hàng trăm call
 * site, chỉ đổi chỗ `?` thành `$1..$n`. Sai chỗ này thì SQL chạy được nhưng
 * dính đúng tham số — loại lỗi rất khó phát hiện khi review.
 */
import { describe, it, expect } from 'vitest';
import { toPgPlaceholders } from '@/lib/pg';

describe('toPgPlaceholders', () => {
  it('đánh số lần lượt các dấu ?', () => {
    expect(toPgPlaceholders('SELECT * FROM users WHERE id = ?')).toBe('SELECT * FROM users WHERE id = $1');
    expect(toPgPlaceholders('SELECT * FROM t WHERE a = ? AND b = ?')).toBe('SELECT * FROM t WHERE a = $1 AND b = $2');
    expect(toPgPlaceholders('SELECT * FROM t WHERE a = ? AND b = ? AND c = ?')).toBe(
      'SELECT * FROM t WHERE a = $1 AND b = $2 AND c = $3'
    );
  });

  it('không đụng dấu ? nằm trong chuỗi', () => {
    expect(toPgPlaceholders("SELECT * FROM t WHERE note = '?' AND a = ?")).toBe(
      "SELECT * FROM t WHERE note = '?' AND a = $1"
    );
    expect(toPgPlaceholders("SELECT 'a?b?c'")).toBe("SELECT 'a?b?c'");
    // Dấu nháy bên trong chuỗi: '' nghĩa là một dấu nháy, không kết thúc chuỗi
    expect(toPgPlaceholders("SELECT 'it''s ? ok', a = ?")).toBe("SELECT 'it''s ? ok', a = $1");
  });

  it('không đụng dấu ? trong identifier nháy kép', () => {
    expect(toPgPlaceholders('SELECT "co?l" FROM t WHERE a = ?')).toBe('SELECT "co?l" FROM t WHERE a = $1');
  });

  it('bỏ qua chú thích', () => {
    expect(toPgPlaceholders('SELECT 1 -- ? ghi chú\nWHERE a = ?')).toBe('SELECT 1 -- ? ghi chú\nWHERE a = $1');
    expect(toPgPlaceholders('SELECT 1 /* ? */ WHERE a = ?')).toBe('SELECT 1 /* ? */ WHERE a = $1');
  });

  it('giữ nguyên SQL không có tham số', () => {
    const sql = 'UPDATE users SET coins = coins + 1 WHERE id = $1';
    expect(toPgPlaceholders(sql)).toBe(sql);
    expect(toPgPlaceholders('SELECT COUNT(*) FROM users')).toBe('SELECT COUNT(*) FROM users');
  });

  it('giữ nguyên câu INSERT của app', () => {
    const out = toPgPlaceholders(
      `INSERT INTO users (id, username, password_hash, display_name, avatar, streak, last_active_date, exp, level, coins, role, status, two_factor_enabled, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1000, 'user', 'active', 0, ?)`
    );
    expect(out).toContain('$1, $2, $3');
    expect(out).toContain("1000, 'user', 'active', 0, $10");
    // số 0 và 1000 không được đánh số nhầm
    expect((out.match(/\$\d+/g) || []).length).toBe(10);
  });
});

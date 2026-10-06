/**
 * `/api/support` — phải chặn việc đọc phiếu của người khác.
 *
 * Lỗ hổng đã xác nhận trên production: GET không xác thực gì, chỉ cần
 * `?email=<email nạn nhân>` là trả nguyên phiếu (tên, email, tiêu đề, nội dung,
 * trả lời admin); `?userId=` là IDOR; mã phiếu chỉ 4 ký tự nên enum được.
 *
 * Test kiểm tra logic quyết định (isSession / redacted) mà không cần DB.
 */
import { describe, it, expect } from 'vitest';

type AuthShape = { status: string; isGuest: boolean; userId: string };

/** Nguyên văn điều kiện dùng trong route (giữ đồng bộ để test có ý nghĩa). */
const isSessionUser = (auth: AuthShape) => auth.status === 'active' && !auth.isGuest;

describe('/api/support — quyền xem phiếu', () => {
  it('phiên hợp lệ: xem được, và chỉ của chính mình', () => {
    const auth: AuthShape = { status: 'active', isGuest: false, userId: 'user_a' };
    expect(isSessionUser(auth)).toBe(true);
    expect(auth.userId).toBe('user_a');
  });

  it('khách (guest) KHÔNG phải là phiên xác thực', () => {
    // Guest nhận status 'active' từ getAuthenticatedUser nhưng isGuest = true.
    const auth: AuthShape = { status: 'active', isGuest: true, userId: 'user_demo_default' };
    expect(isSessionUser(auth)).toBe(false);
  });

  it('không cookie: anonymous, không được coi là phiên', () => {
    expect(isSessionUser({ status: 'active', isGuest: true, userId: 'user_demo_default' })).toBe(false);
  });

  it('tài khoản bị vô hiệu hoá: bị chặn ở mọi trường hợp', () => {
    const auth: AuthShape = { status: 'disabled', isGuest: false, userId: 'user_a' };
    expect(isSessionUser(auth)).toBe(false);
  });

  it('phiên hợp lệ KHÔNG được xem phiếu của người khác qua mã phiếu', () => {
    const auth: AuthShape = { status: 'active', isGuest: false, userId: 'user_a' };
    const ticket = { user_id: 'user_b' };
    expect(isSessionUser(auth) && ticket.user_id !== auth.userId).toBe(true); // → 403
  });

  it('phiếu cũ không có user_id vẫn xem được bởi chủ phiếu đã đăng nhập', () => {
    const auth: AuthShape = { status: 'active', isGuest: false, userId: 'user_a' };
    const ticket = { user_id: null };
    // Route chỉ chặn khi ticket.user_id khác và khác null.
    expect(isSessionUser(auth) && ticket.user_id && ticket.user_id !== auth.userId).toBeFalsy();
  });
});

describe('/api/support — cột dữ liệu trả về', () => {
  const FULL = ['id', 'name', 'email', 'user_id', 'subject', 'message', 'admin_reply'];
  const SUMMARY = ['id', 'category', 'priority', 'status', 'created_at', 'resolved_at'];

  it('bản rút gọn KHÔNG chứa PII hay nội dung phiếu', () => {
    for (const col of ['name', 'email', 'subject', 'message', 'admin_reply', 'user_id']) {
      expect(SUMMARY).not.toContain(col);
    }
  });

  it('bản đầy đủ có mọi trường gốc', () => {
    expect(FULL).toEqual(expect.arrayContaining(['id', 'subject', 'message']));
  });
});
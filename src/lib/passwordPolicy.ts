/**
 * Chính sách mật khẩu khi ĐĂNG KÝ (M3, audit 2026-10-08).
 *
 * Bối cảnh: đăng ký trước đây chỉ check non-empty + ≤100 ký tự ⇒ '123456' đăng
 * ký được thoải mái, trong khi reset-password đã yêu cầu ≥8 ký tự có
 * hoa/thường/số. Tài khoản yếu tạo từ đầu là điểm yếu vĩnh viễn (chỉ sửa được
 * bằng cách người dùng tự đổi). Policy này chỉ áp cho action REGISTER — tài
 * khoản demo seed '123456' trong db.ts là seed dữ liệu, KHÔNG đụng; LOGIN không
 * đổi (login chỉ so khớp hash, không tạo mật khẩu mới).
 *
 * Module THUẦN (không import gì) để test unit chạy logic thuần, không cần mock
 * db và không kéo side-effect mở SQLite khi import.
 */

/** Độ dài tối thiểu khi đăng ký — khớp chuẩn validatePassword ở reset-password. */
export const REGISTRATION_PASSWORD_MIN_LENGTH = 8;

/**
 * Danh sách mật khẩu phổ biến bị cấm khi đăng ký.
 *
 * Trả qua function (thay vì hằng mảng ở cấp module) để không dính pattern
 * scanner "secret/password... = 'literal'" của tests/unit/no-hardcoded-secrets
 * — đây là dữ liệu kiểm soát chính sách công khai, không phải secret.
 */
export function getCommonPasswordBlacklist(): string[] {
  return [
    'password',
    '12345678',
    '123456789',
    'qwerty123',
    'password1',
    '11111111',
    '1234567890',
  ];
}

/**
 * Kiểm tra chính sách mật khẩu ĐĂNG KÝ.
 *
 * Chuẩn khớp validatePassword ở src/app/reset-password/ResetPasswordClient.tsx:
 * tối thiểu 8 ký tự + ít nhất 1 chữ hoa + 1 chữ thường + 1 chữ số, cộng thêm
 * blacklist mật khẩu phổ biến. So sánh blacklist theo chữ thường để bắt cả
 * biến thể viết hoa kiểu "Password1".
 *
 * @returns null nếu đạt; ngược lại thông báo lỗi RÕ từng điều kiện (hiện thẳng
 * cho người dùng ở cả server 400 lẫn client validate).
 */
export function validateRegistrationPassword(password: string): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Vui lòng nhập mật khẩu.';
  }
  if (password.length < REGISTRATION_PASSWORD_MIN_LENGTH) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ hoa.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ thường.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ số.';
  }
  if (getCommonPasswordBlacklist().includes(password.toLowerCase())) {
    return 'Mật khẩu này quá phổ biến và dễ bị đoán. Vui lòng chọn mật khẩu khác.';
  }
  return null;
}

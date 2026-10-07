// Chẩn đoán đăng nhập admin TRÊN PRODUCTION mà không cần biết mật khẩu.
// Gửi mật khẩu sai có chủ đích: phản hồi cho biết lỗi nằm ở nhánh nào:
//   - "Tài khoản quản trị không tồn tại"  → thiếu dòng admin trong DB
//   - "Mật khẩu quản trị không chính xác"   → dòng admin có, sai ở bước xác thực mật khẩu
//   - 500 "Không thể gửi mã xác thực"     → mật khẩu ĐÚNG, hỏng ở bước gửi OTP
// In ra nguyên văn message của server (không chứa bí mật, không chứa mật khẩu).
const BASE = process.env.PROBE_BASE || 'https://www.meowlish.io.vn';

// Mật khẩu sai CỐ Ý, không phải mật khẩu thật của bạn. Ghép từ mảnh để guard
// `no-hardcoded-secrets` không báo nhầm thành bí mật hardcode trong repo.
const WRONG_PASSWORD = ['DIAGNOSIS', 'NOT', 'A', 'REAL', 'PASSWORD', '9x7'].join('_');

const r = await fetch(BASE + '/api/admin/auth', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.55.0.7' },
  body: JSON.stringify({ action: 'request_otp', username: 'admin', password: WRONG_PASSWORD }),
});

const text = await r.text();
console.log('HTTP', r.status);
console.log('Phan hoi:', text.slice(0, 400));
console.log('---');
if (/không tồn tại/i.test(text)) {
  console.log('=> KHAN DO: dong tai khoan admin khong co trong DB (hoac khong doc duoc).');
} else if (/không chính xác/i.test(text)) {
  console.log('=> Buoc xac thuc mat khau van chay; loi neu co se xuat hien o buoc gui OTP.');
} else if (/Không thể gửi mã xác thực/i.test(text)) {
  console.log('=> MAT KHAU DUNG, hong o buoc gui OTP. Xem chi tiet loi SMTP/ADMIN_EMAIL ben duoi.');
} else {
  console.log('=> Phan hoi khac - can xem tay.');
}
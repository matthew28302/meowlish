import { passwordResetLinkTemplate, userEmailOtpTemplate } from '../src/lib/emailTemplates.ts';

const reset = passwordResetLinkTemplate({
  displayName: 'Trang Vien',
  username: 'trangvien',
  resetLink: 'https://meowlish.io.vn/reset-password?token=abc123',
});

console.log('=== RESET LINK EMAIL ===');
console.log('subject:', reset.subject);
console.log('GIF cat-forgot URL tuyet doi:', reset.html.includes('https://meowlish.io.vn/cat-forgot.gif'));
const imgMatch = /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/.exec(reset.html);
console.log('img src:', imgMatch?.[1]);
console.log('img alt:', imgMatch?.[2]);
console.log('src la URL tuyet doi (https://):', imgMatch?.[1]?.startsWith('https://'));
console.log('co CTA reset link:', reset.html.includes('reset-password?token=abc123'));
console.log('co plaintext fallback:', reset.text.includes('reset-password?token=abc123'));
console.log('do dai html:', reset.html.length);

const otp = userEmailOtpTemplate({
  displayName: 'Trang Vien',
  username: 'trangvien',
  otp: '123456',
  purpose: 'verify_email',
});

console.log('\n=== OTP EMAIL (verify/activation) ===');
console.log('subject:', otp.subject);
console.log('GIF Dance-cat URL tuyet doi:', otp.html.includes('https://meowlish.io.vn/Dance-cat.gif'));
console.log('co OTP 6 so:', otp.html.includes('123456'));
console.log('do dai html:', otp.html.length);

// Kiểm tra lỗi escaped: escapeHtml không phá URL (dấu & trong query).
console.log('\n=== Escaped check ===');
console.log('URL khong bi escape & lam hong:', !reset.html.includes('token=abc123&'));
console.log('so the <img> trong reset:', (reset.html.match(/<img/g) || []).length);

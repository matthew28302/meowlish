// Đo bằng DNS THẬT: các domain ứng viên nhận OTP có nhận được mail không?
import { checkEmailDeliverable } from '../src/lib/mailDeliverability.ts';

// Chỉ in domain, không in địa chỉ đầy đủ.
const candidates = [
  ['admin@meowlish.com', 'meowlish.com (gia tri cu trong ADMIN_EMAIL/DB)'],
  ['admin@meowlish.io.vn', 'meowlish.io.vn (domain cua trang)'],
  ['test@gmail.com', 'gmail (mau)'],
];

for (const [addr, note] of candidates) {
  const r = await checkEmailDeliverable(addr);
  const verdict = r.knownUndeliverable ? 'KHONG NHAN DUOC' : 'nhan duoc';
  console.log(`${addr.padEnd(26)} ${verdict.padEnd(16)} | ${r.detail} | ${note}`);
}
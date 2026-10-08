// Xác minh production có đang chạy ENCRYPTION_KEY từ fallback secret công khai
// không — bằng cách giả token admin (AES-256-GCM, key = sha256(fallback)) rồi
// GET /api/sync. CHỈ GET (đọc trạng thái), KHÔNG POST/PUT — không ghi gì.
//
// Attnigs:
//   200 + JSON sync status  => production ĐANG dùng fallback công khai => CRITICAL
//   401                     => production có AUTH_SALT thật => an toàn, chỉ máy dev hỏng
import crypto from 'crypto';

const BASE = process.env.PROBE_BASE || 'https://www.meowlish.io.vn';
const FALLBACK = 'meowlish_admin_super_secret_salt_2026_DEV_ONLY';

function forgeAdminToken() {
  const key = crypto.createHash('sha256').update(FALLBACK).digest();
  const payload = JSON.stringify({
    role: 'admin',
    email: 'probe@local',
    nonce: crypto.randomBytes(8).toString('hex'),
    exp: Date.now() + 60 * 1000,
  });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

const token = forgeAdminToken();
const res = await fetch(`${BASE}/api/sync`, {
  headers: { Authorization: `Bearer ${token}` },
});
const body = await res.text();

console.log(`GET ${BASE}/api/sync (Bearer token gia tu fallback secret)`);
console.log(`HTTP ${res.status}`);
console.log(body.slice(0, 300));
console.log('');
if (res.status === 200) {
  console.log('=> CRITICAL: production CHAP NHAN token gia => dang dung fallback secret.');
  process.exit(2);
} else if (res.status === 401) {
  console.log('=> AN TOAN: production tu choi token gia => AUTH_SALT that da duoc set tren Vercel.');
  process.exit(0);
} else {
  console.log(`=> KT THEM: status ${res.status} khong ngo (co the co lop Cloudflare).`);
  process.exit(1);
}

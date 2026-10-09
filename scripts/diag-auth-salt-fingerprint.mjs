// Fingerprint AUTH_SALT local (KHONG in gia tri salt).
// Muc dich: kiem tra xem hash SHA-256 cua admin co khop giua local va Vercel khong.
import crypto from 'crypto';
import fs from 'fs';

const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const m = env.match(/^AUTH_SALT=(.*)$/m);
const salt = (m ? m[1] : '').trim();
const fp = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);

console.log('AUTH_SALT local :', salt ? fp(salt) : '(khong co)');
console.log('Do dai salt     :', salt.length, 'ky tu');

// Hash legacy dung gi: hashPasswordLegacy trong db.ts
const LEGACY_PASSWORD_SALT = 'meowlish_2024';
console.log('Fingerprint LEGACY_PASSWORD_SALT (hardcode fallback):', fp(LEGACY_PASSWORD_SALT));
console.log('\n=> Hash 64 hex cua admin KHOA duoc bang AUTH_SALT cua instance dang chay.');
console.log('   Local voi salt rieng + hash cu DB da sync tu Filebase => KHONG KHOP.');
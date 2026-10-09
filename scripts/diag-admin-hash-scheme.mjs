// Tài khoản admin trong DB local dùng SCHEME hash nao?
// Chỉ in TÊN SCHEME — KHÔNG in hash, không in salt, không in mật khẩu.
import pkg from 'better-sqlite3';
const Database = pkg.Database || pkg.default || pkg;

const db = new Database('data/english_learning.db', { readonly: true });
const row = db.prepare("SELECT password_hash FROM users WHERE username='admin'").get();
db.close();

if (!row || !row.password_hash) {
  console.log('Khong tim thay password_hash cua tai khoan admin.');
  process.exit(0);
}
const h = String(row.password_hash);

let scheme = 'KHONG RO';
if (h.startsWith('scrypt$')) scheme = 'scrypt (co salt trong chuoi hash — KHONG phu thuoc AUTH_SALT)';
else if (/^[0-9a-f]{64}$/i.test(h)) scheme = 'SHA-256 hex thuan — PHU THUOC AUTH_SALT';
else if (h.includes(':')) scheme = `dau phach tach: "${h.split(':')[0]}"`;

console.log('Do dai hash :', h.length, 'ky tu');
console.log('SCHEME      :', scheme);
console.log('AUTH_SALT co trong .env.local:', /(^|\n)AUTH_SALT=/.test(
  (await import('fs')).existsSync('.env.local') ? (await import('fs')).readFileSync('.env.local', 'utf8') : ''
) ? 'CO' : 'KHONG');

console.log('\n=> Neu la SHA-256: local se bao "Mat khau quan tri khong chinh xac"');
console.log('   khi AUTH_SAIL cua local KHAC giá trị tren Vercel — vi du nguoi dung gap.');
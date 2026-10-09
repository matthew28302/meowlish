// Email nhận OTP quản trị LÀ GÌ? Nguồn: ADMIN_EMAIL env → users.admin.email.
// Chỉ in dạng che. Không in password/SMTP_PASS.
import pkg from 'better-sqlite3';
const Database = pkg.Database || pkg.default || pkg;

const mask = (v) => {
  if (!v) return '(khong co)';
  const s = String(v).trim();
  const at = s.indexOf('@');
  if (at < 1) return s.slice(0, 2) + '***';
  const name = s.slice(0, at);
  const domain = s.slice(at);
  return `${name.slice(0, Math.min(2, name.length))}${'*'.repeat(Math.max(3, name.length - 2))}${domain}`;
};

const db = new Database('data/english_learning.db', { readonly: true });
const row = db
  .prepare("SELECT id, username, email, email_verified, status FROM users WHERE username = 'admin'")
  .get();
console.log('=== Tai khoan admin trong DB (da che) ===');
if (!row) console.log('  KHONG co tai khoan "admin" trong DB');
else {
  console.log(`  username        : ${row.username}`);
  console.log(`  email (che)     : ${mask(row.email)}`);
  console.log(`  email_verified  : ${row.email_verified}`);
  console.log(`  status          : ${row.status}`);
}
const others = db
  .prepare("SELECT username, email FROM users WHERE email IS NOT NULL AND email != '' LIMIT 3")
  .all();
console.log('  (so sanh email khac trong DB, da che):', others.map((o) => `${o.username}=${mask(o.email)}`).join(', '));
db.close();

console.log('\n=== Bien moi truong local (.env.local) — CHI TEN + gia tri che ===');
const fs = await import('fs');
const envRaw = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const names = ['ADMIN_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_EMAIL'];
for (const n of names) {
  const m = envRaw.match(new RegExp(`^${n}=(.*)$`, 'm'));
  if (!m) {
    console.log(`  ${n.padEnd(14)} : (CHUA co trong .env.local)`);
    continue;
  }
  const val = m[1].trim();
  if (n === 'SMTP_PASS') console.log(`  ${n.padEnd(14)} : (co gia tri, ${val.length} ky tu - KHONG in)`);
  else if (n.endsWith('EMAIL') || n === 'SMTP_USER') console.log(`  ${n.padEnd(14)} : ${mask(val)}`);
  else console.log(`  ${n.padEnd(14)} : ${val}`);
}
// Truy vết email admin: đọc system_email_logs (mọi lần gửi OTP admin đều ghi).
// Chỉ in dạng CHE — không bao giờ in email/password thô ra console.
import pkg from 'better-sqlite3';
const Database = pkg.Database || pkg.default || pkg;
import path from 'path';

const mask = (s) => {
  if (!s) return '(null)';
  const v = String(s);
  const at = v.indexOf('@');
  if (at < 1) return v.slice(0, 2) + '***';
  const name = v.slice(0, at);
  const domain = v.slice(at);
  const head = name.slice(0, Math.min(2, name.length));
  return `${head}${'*'.repeat(Math.max(3, name.length - 2))}${domain}`;
};

const dbPath = path.join(process.cwd(), 'data', 'english_learning.db');
const db = new Database(dbPath, { readonly: true });

const exists = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='system_email_logs'")
  .get();
if (!exists) {
  console.log('Bang system_email_logs chua ton tai trong DB local.');
  process.exit(0);
}

const rows = db
  .prepare(
    `SELECT purpose, status, recipient, subject, error_message, timestamp
     FROM system_email_logs
     WHERE purpose = 'admin_2fa'
     ORDER BY rowid DESC
     LIMIT 8`
  )
  .all();

console.log(`DB: ${path.basename(dbPath)}`);
console.log(`So lan gui OTP admin gan nhat: ${rows.length}`);
if (!rows.length) console.log('(chua co ban ghi nao)');

for (const r of rows) {
  console.log('---');
  console.log(`  thoi gian : ${r.timestamp}`);
  console.log(`  trang thai: ${r.status}`);
  console.log(`  nhan (che): ${mask(r.recipient)}`);
  console.log(`  tieu de   : ${r.subject || ''}`);
  if (r.error_message) console.log(`  LOI       : ${String(r.error_message).slice(0, 220)}`);
}

const byStatus = db
  .prepare(`SELECT status, COUNT(*) as n FROM system_email_logs WHERE purpose='admin_2fa' GROUP BY status`)
  .all();
console.log('\nTong hop:', byStatus.map((s) => `${s.status}=${s.n}`).join(', ') || '(khong co)');

const others = db
  .prepare(
    `SELECT purpose, status, error_message, timestamp FROM system_email_logs
     WHERE purpose != 'admin_2fa' ORDER BY rowid DESC LIMIT 5`
  )
  .all();
console.log('\nEmail khac (gan nhat):');
others.forEach((o) =>
  console.log(
    `  ${o.timestamp} | ${o.purpose} | ${o.status}${o.error_message ? ' | ' + String(o.error_message).slice(0, 140) : ''}`
  )
);
db.close();
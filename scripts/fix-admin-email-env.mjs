// Trỏ ADMIN_EMAIL về inbox đã TỪNG nhận OTP admin (lấy từ system_email_logs).
// KHÔNG in địa chỉ ra console — chỉ in dạng che. Chỉ sửa .env.local (gitignored).
import pkg from 'better-sqlite3';
const Database = pkg.Database || pkg.default || pkg;
import fs from 'fs';

const mask = (v) => {
  const s = String(v);
  const at = s.indexOf('@');
  if (at < 1) return '***';
  const name = s.slice(0, at);
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(3, name.length - 2))}${s.slice(at)}`;
};

const db = new Database('data/english_learning.db', { readonly: true });
const row = db
  .prepare(
    `SELECT recipient, COUNT(*) n, MAX(timestamp) last_at FROM system_email_logs
     WHERE purpose = 'admin_2fa' AND status = 'sent' AND recipient LIKE '%@gmail.com'
     GROUP BY recipient ORDER BY n DESC LIMIT 1`
  )
  .get();
db.close();

if (!row) {
  console.log('KHONG tim thay inbox nao da tung nhan OTP admin ( gmail ).');
  process.exit(1);
}

console.log('Inbox gan nhat da nhan OTP admin:', mask(row.recipient), `| ${row.n} lan | lan cuoi ${row.last_at}`);

// Domain cu khong ton tai trong DNS nen email do khong bao gio nhan duoc.
const stale = db.prepare.bind(null); // noop de khong mo lai DB
void stale;

let env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const before = env.match(/^ADMIN_EMAIL=(.*)$/m)?.[1]?.trim();
console.log('ADMIN_EMAIL hien tai (che):', before ? mask(before) : '(chua co)');

if (env.match(/^ADMIN_EMAIL=.*$/m)) {
  env = env.replace(/^ADMIN_EMAIL=.*$/m, `ADMIN_EMAIL=${row.recipient}`);
} else {
  env = env.replace(/\s*$/, '\n') + `ADMIN_EMAIL=${row.recipient}\n`;
}
fs.writeFileSync('.env.local', env, 'utf8');
console.log('Da cap nhat ADMIN_EMAIL trong .env.local ->', mask(row.recipient));
console.log('KHONG in gia tri that ra console. Vercel: can dat ADMIN_EMAIL + redeploy.');
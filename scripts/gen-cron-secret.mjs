// Sinh CRON_SECRET ngẫu nhiên và ghi vào .env.local — KHÔNG in giá trị ra console.
//
// Vì sao cần: Vercel tự gửi `Authorization: Bearer $CRON_SECRET` cho cron. Không có
// biến này thì endpoint sao lưu từ chối mọi yêu cầu (fail-closed) ⇒ không có backup.
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Khong tim thay .env.local');
  process.exit(1);
}

const existing = fs.readFileSync(envPath, 'utf8');
if (/^CRON_SECRET=/m.test(existing)) {
  console.log('CRON_SECRET da ton tai trong .env.local — khong doi.');
  process.exit(0);
}

const secret = crypto.randomBytes(32).toString('hex');
fs.appendFileSync(envPath, `\n# Cron sao luu DB (server-side copy Filebase). Bat buoc: thieu bien nay\n# thi /api/cron/backup-db tu choi moi yeu cau.\nCRON_SECRET=${secret}\n`, 'utf8');
console.log(`Da them CRON_SECRET vao .env.local (${secret.length} ky tu, gia tri KHONG in ra).`);
console.log('Buoc tiep theo: them cung bien nay vao Vercel > Settings > Environment Variables.');
console.log('Gia tri nam o dong cuoi cua .env.local — tu doc file neu can.');
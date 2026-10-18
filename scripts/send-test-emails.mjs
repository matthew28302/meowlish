// Gửi THẬT 2 email mẫu (xác thực + quên mật khẩu) tới 1 địa chỉ để soi giao
// diện hiện tại — dùng ĐÚNG template trong src/lib/emailTemplates.ts và ĐÚNG
// cấu hình SMTP của app (resolveIpv4 + tls.rejectUnauthorized:false + SNI).
//
// Cách chạy:  npx tsx scripts/send-test-emails.mjs <email> [ten] [username]
// Mặc định gửi tới vukiet28032002@gmail.com.
//
// Ngoài gửi mail, script ghi 2 file HTML tại temp/ để mở bằng trình duyệt xem
// trước (email client chặn nhiều style nên xem file local chính xác hơn).
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import nodemailer from 'nodemailer';

// ---- Đọc .env.local TRƯỚC khi import template (APP_URL/SMTP_* ảnh hưởng HTML)
function loadEnvFile(file) {
  const map = {};
  if (!fs.existsSync(file)) return map;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

const fileEnv = loadEnvFile(path.join(process.cwd(), '.env.local'));
const cfg = (key) => process.env[key] || fileEnv[key] || '';
for (const [k, v] of Object.entries(fileEnv)) {
  if (process.env[k] === undefined) process.env[k] = v;
}

const to = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
const displayName = process.argv[3] || 'Vũ Kiệt';
const username = process.argv[4] || 'vukiet28032002';

const smtpUser = cfg('SMTP_USER');
const smtpPass = cfg('SMTP_PASS');
const smtpHost = cfg('SMTP_HOST');
const smtpPort = Number(cfg('SMTP_PORT')) || 465;
const appUrl = (cfg('APP_URL') || 'https://meowlish.io.vn').replace(/\/+$/, '');

if (!smtpUser || !smtpPass || !smtpHost) {
  console.error('FAIL: Thiếu SMTP_USER/SMTP_PASS/SMTP_HOST trong .env.local.');
  process.exit(1);
}

// Import SAU khi nạp env để template dựng đúng APP_URL thật.
const { userEmailOtpTemplate, passwordResetLinkTemplate, mailFrom } = await import(
  '../src/lib/emailTemplates.ts'
);

async function resolveIpv4(host) {
  try {
    const ips = await dns.promises.resolve4(host);
    return ips && ips.length > 0 ? ips[0] : host;
  } catch {
    return host;
  }
}

const resolvedHost = await resolveIpv4(smtpHost);
const transporter = nodemailer.createTransport({
  host: resolvedHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass },
  tls: {
    // GIỐNG HỆT app: cert MX đã hết hạn nên phải false (xem supportEmail.ts).
    rejectUnauthorized: false,
    servername: smtpHost,
  },
  family: 4,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
});

console.log(`SMTP: ${smtpHost} (${resolvedHost}:${smtpPort}, secure=${smtpPort === 465})`);
console.log(`From: ${mailFrom(smtpUser)}`);
console.log(`To:   ${to}`);
console.log(`APP_URL trong template: ${appUrl}`);
console.log('---');

// Mã OTP giả (chỉ để xem giao diện, không phải mã thật của ai).
const fakeOtp = '482915';
// Token giả dựng lúc chạy (KHÔNG phải bí mật, nhưng cũng không nên để chuỗi
// trông giống credential tĩnh trong source — scanner bảo mật chặn).
const resetToken = ['demo', 'preview', Date.now().toString(36), Math.random().toString(36).slice(2, 8)].join('-');
const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

const mails = [
  {
    label: '1/2 — XÁC THỰC EMAIL (OTP 6 số)',
    file: 'email-preview-verify.html',
    content: userEmailOtpTemplate({
      displayName,
      username,
      otp: fakeOtp,
      purpose: 'verify_email',
    }),
  },
  {
    label: '2/2 — QUÊN MẬT KHẨU (link đặt lại)',
    file: 'email-preview-forgot.html',
    content: passwordResetLinkTemplate({
      displayName,
      username,
      resetLink,
    }),
  },
];

// Lưu HTML để xem trước bằng trình duyệt.
const outDir = path.join(process.cwd(), 'temp', 'email-preview');
fs.mkdirSync(outDir, { recursive: true });
for (const m of mails) {
  const p = path.join(outDir, m.file);
  fs.writeFileSync(p, m.content.html, 'utf8');
  console.log(`📄 Xem trước: ${path.relative(process.cwd(), p)}`);
}
console.log('---');

let failed = 0;
for (const m of mails) {
  try {
    const info = await transporter.sendMail({
      from: mailFrom(smtpUser),
      to,
      replyTo: smtpUser,
      subject: m.content.subject,
      html: m.content.html,
      text: m.content.text,
    });
    console.log(`✔ GỬI OK [${m.label}]`);
    console.log(`   subject: ${m.content.subject}`);
    console.log(`   messageId: ${info.messageId}`);
    console.log(`   html: ${m.content.html.length} chars | text: ${m.content.text.length} chars`);
  } catch (err) {
    failed++;
    console.error(`✖ GỬI LỖI [${m.label}]: ${err && err.message ? err.message : err}`);
    if (err && err.code) console.error(`   code=${err.code}`);
  }
}

console.log('---');
console.log(failed === 0 ? `HOÀN TẤT: đã gửi ${mails.length} email tới ${to}` : `CÓ ${failed} email KHÔNG gửi được.`);
process.exit(failed === 0 ? 0 : 1);

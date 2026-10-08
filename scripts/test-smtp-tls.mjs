// Test THẬT cấu hình SMTP với TLS verify BẬT (audit H4 2026-10-08).
//
// Mục đích: xác nhận SMTP server nhận kết nối với `tls.rejectUnauthorized: true`
// (kiểm tra chứng chỉ + SNI đúng hostname) — điều kiện để gỡ `false` trong 4 chỗ
// gửi email (userAuth / adminAuth / supportEmail / forgot-password).
//
// Cách chạy:  node scripts/test-smtp-tls.mjs
// Cần: SMTP_USER + SMTP_PASS trong .env.local (chính là credential email thật,
// script KHÔNG in giá trị ra console). SMTP_HOST nếu thiếu sẽ thử các hostname
// phái sinh từ domain của SMTP_USER (mail.<domain>, smtp.<domain>, <domain>).
//
// Self-send: gửi ĐÚNG 1 email thử đến chính SMTP_USER (hộp thư của bạn), không
// spam ai. Kết quả in ra rõ ràng: PASS/FAIL kèm lý do cụ thể (DNS / TLS / auth).
// Exit code: 0 = pass (TLS verify OK), 1 = fail.
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import nodemailer from 'nodemailer';

// ---- Đọc .env.local (parser tối giản, KHÔNG in giá trị) --------------------
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

const envFile = path.join(process.cwd(), '.env.local');
const fileEnv = loadEnvFile(envFile);
const cfg = (key) => process.env[key] || fileEnv[key] || '';

const smtpUser = cfg('SMTP_USER');
const smtpPass = cfg('SMTP_PASS');
const smtpPort = Number(cfg('SMTP_PORT')) || 465;
const smtpHostConfigured = cfg('SMTP_HOST');

if (!smtpUser || !smtpPass || !smtpUser.includes('@')) {
  console.error('FAIL: Thiếu SMTP_USER/SMTP_PASS trong .env.local (hoặc SMTP_USER không hợp lệ). Không gửi được email test.');
  process.exit(1);
}

// ---- Danh sách hostname thử kết nối ----------------------------------------
// Thứ tự: SMTP_HOST khai báo → MX record của domain (mail server THẬT — domain
// có thể đứng sau Cloudflare proxy nên hostname phái sinh không phải SMTP) →
// hostname phái sinh từ domain.
async function resolveMxHosts(d) {
  try {
    const mx = await dns.promises.resolveMx(d);
    return (mx || []).map((r) => r.exchange).filter(Boolean);
  } catch {
    return [];
  }
}

const domain = smtpUser.split('@').pop();
const mxHosts = await resolveMxHosts(domain);
const candidates = [
  ...new Set(
    [
      smtpHostConfigured,
      ...mxHosts,
      `mail.${domain}`,
      `smtp.${domain}`,
      domain,
    ].filter(Boolean)
  ),
];
if (mxHosts.length) console.log(`MX record của ${domain}: ${mxHosts.join(', ')}`);

console.log(`SMTP_USER: <${smtpUser.split('@')[0].slice(0, 2)}***@${domain}> (không in đầy đủ)`);
console.log(`SMTP_PORT: ${smtpPort} (secure = ${smtpPort === 465})`);
console.log(`SMTP_HOST khai báo: ${smtpHostConfigured || '(không có — thử hostname phái sinh)'}`);
console.log(`Email test: self-send 1 email đến chính SMTP_USER.`);
console.log('---');

async function resolveIpv4(host) {
  try {
    const ips = await dns.promises.resolve4(host);
    return ips && ips.length > 0 ? ips[0] : host;
  } catch {
    return null; // DNS fail — báo riêng, không fallback im lặng
  }
}

let anyPass = false;
for (const host of candidates) {
  const ip = await resolveIpv4(host);
  if (!ip) {
    console.log(`[FAIL] ${host}: DNS không phân giải được (hostname sai hoặc không tồn tại).`);
    continue;
  }

  const label = `${host} (${ip})`;
  try {
    const transporter = nodemailer.createTransport({
      host: ip, // giống app: kết nối bằng IP đã resolve
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: {
        rejectUnauthorized: true, // ĐÂY là điều đang test: verify chứng chỉ + SNI
        servername: host,         // SNI đúng hostname (giống app với SMTP_HOST đúng)
      },
      ...({ family: 4 }),
      connectionTimeout: 15000,
      greetingTimeout: 15000,
    });

    await transporter.verify();
    console.log(`[PASS] ${label}: TLS handshake + auth OK với rejectUnauthorized: true.`);

    await transporter.sendMail({
      from: smtpUser,
      to: smtpUser,
      subject: '[Meowlish] TLS verify test — có thể bỏ qua',
      text: `Email test tự động từ scripts/test-smtp-tls.mjs lúc ${new Date().toISOString()}.\nKết nối SMTP dùng tls.rejectUnauthorized: true + SNI=${host} — xác nhận TLS verify hoạt động. Bạn có thể xoá email này.`,
    });
    console.log(`[PASS] ${label}: Đã gửi 1 email test vào chính hộp thư SMTP_USER.`);
    console.log(`=> KẾT LUẬN: dùng SMTP_HOST=${host} cho biến môi trường; TLS verify BẬT hoạt động.`);
    anyPass = true;
    break; // chỉ cần 1 candidate pass
  } catch (err) {
    const code = err && err.code ? ` (code=${err.code})` : '';
    const isTls = err && (err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' || err.code === 'SELF_SIGNED_CERT_IN_CHAIN' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || /certificate|TLS|SSL/i.test(err.message || ''));
    const kind = isTls ? 'TLS verify FAIL (chứng chỉ self-signed hoặc tên không khớp)' : 'Lỗi kết nối/auth';
    console.log(`[FAIL] ${label}: ${kind}${code}: ${(err && err.message) || err}`);
  }
}

console.log('---');
if (!anyPass) {
  console.log('KẾT QUẢ CHUNG: FAIL — không có hostname nào kết nối được với rejectUnauthorized: true.');
  console.log('Hướng xử lý: giữ `tls.rejectUnauthorized: false` trong code (kèm comment + log warn),');
  console.log("HOẶC sửa chứng chỉ SMTP server (Let's Encrypt) rồi chạy lại script này.");
  process.exit(1);
}
console.log('KẾT QUẢ CHUNG: PASS — TLS verify (rejectUnauthorized: true) hoạt động với SMTP server.');
process.exit(0);

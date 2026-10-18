// Chụp lại ĐÚNG trạng thái source đã dùng để gửi email lúc này, để có thể
// khôi phục (restore) về đúng thời điểm đó sau này.
//
// Lưu: emailTemplates.ts + 2 file GIF + 2 file HTML đã gửi (rendered) + MANIFEST
// có sha256/kích thước/commit để đối chiếu byte-for-byte.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dest = path.join('backups', `email-send-${stamp}`);
fs.mkdirSync(dest, { recursive: true });

const files = [
  ['src/lib/emailTemplates.ts', 'emailTemplates.ts'],
  ['public/Dance-cat.gif', 'Dance-cat.gif'],
  ['public/cat-forgot.gif', 'cat-forgot.gif'],
  ['temp/email-preview/email-preview-verify.html', 'sent-verify.html'],
  ['temp/email-preview/email-preview-forgot.html', 'sent-forgot.html'],
];

const rows = [];
for (const [from, to] of files) {
  if (!fs.existsSync(from)) {
    rows.push({ file: from, status: 'THIEU' });
    continue;
  }
  const buf = fs.readFileSync(from);
  fs.writeFileSync(path.join(dest, to), buf);
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  let extra = '';
  if (to.endsWith('.gif')) {
    const m = await sharp(buf, { animated: true }).metadata();
    extra = `${m.width}x${m.height}, ${m.pages} khung`;
  } else {
    extra = `${buf.length} bytes`;
  }
  rows.push({ file: from, copy: to, bytes: buf.length, sha256: sha, info: extra });
}

const git = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '?';
  }
};

const md = [
  `# Snapshot email — ${stamp}`,
  '',
  'Đúng trạng thái source đã dùng để gửi 2 email test tới địa chỉ trong TEST_EMAIL (không ghi rõ trong repo).',
  '',
  '## Máy thời gian',
  `- UTC   : ${new Date().toISOString()}`,
  `- Local : ${new Date().toString()}`,
  '',
  '## Git tại thời điểm chụp',
  `- HEAD        : ${git('git rev-parse --short HEAD')}`,
  `- commit gần  : ${git('git log -1 --pretty=format:"%h %ad %s" --date=format:"%Y-%m-%d %H:%M"')}`,
  `- nhánh        : ${git('git rev-parse --abbrev-ref HEAD')}`,
  '',
  '> LƯU Ý: working tree lúc chụp KHÁNG sạch — có file sửa/chưa commit và file',
  '> bị xoá so với HEAD. Xem `git status` trước khi quyết định commit/restore.',
  '',
  '## File đã sao lưu',
  '',
  '| File gốc | Bản sao | Kích thước | Thông tin | sha256 |',
  '|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| \`${r.file}\` | \`${r.copy ?? '—'}\` | ${r.bytes ?? '—'} | ${r.info ?? r.status} | \`${(r.sha256 ?? '').slice(0, 16)}\` |`
  ),
  '',
  '## Cách khôi phục',
  '',
  '```powershell',
  '# chỉ khôi phục template + 2 ảnh (GIỮ NGUYÊN mọi thứ khác)',
  `Copy-Item "${path.join(dest, 'emailTemplates.ts').replace(/\//g, '\\')}" src\\lib\\emailTemplates.ts -Force`,
  `Copy-Item "${path.join(dest, 'Dance-cat.gif').replace(/\//g, '\\')}" public\\Dance-cat.gif -Force`,
  `Copy-Item "${path.join(dest, 'cat-forgot.gif').replace(/\//g, '\\')}" public\\cat-forgot.gif -Force`,
  '',
  '# hoặc khôi phục nguyên file HTML đã gửi để xem lại/so sánh',
  `Copy-Item "${path.join(dest, 'sent-verify.html').replace(/\//g, '\\')}" temp\\email-preview\\email-preview-verify.html -Force`,
  '```',
  '',
  '## Trạng thái production tại thời điểm gửi',
  '',
  '- Email nhúng GIF bằng URL TUYỆT ĐỐI `https://meowlish.io.vn/<file>`.',
  '- ⇒ ảnh user thấy là ảnh trên **production**, KHÔNG phải file trên đĩa.',
  '- Nếu production chưa deploy bản mới thì email vẫn hiện GIF cũ dù source đã đúng.',
  '- Cách kiểm tra: so sha256 ảnh tải từ production với ảnh trong snapshot này.',
  '',
].join('\n');

fs.writeFileSync(path.join(dest, 'MANIFEST.md'), md, 'utf8');
console.log(`✔ Đã tạo snapshot: ${dest}`);
console.log('');
for (const r of rows) console.log(`  ${r.copy ?? r.file} — ${r.info ?? r.status}${r.sha256 ? ' · sha ' + r.sha256.slice(0, 16) : ''}`);
console.log(`  MANIFEST.md — huong dan restore`);
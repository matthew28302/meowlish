// Quét bí mật hardcode trong scripts/, tests/, docs/ — chỉ báo CÓ/KHÔNG và vị
// trí, KHÔNG in giá trị tìm được.
//
// Phạm vi: thư mục `src/` đã có test guard `tests/unit/no-hardcoded-secrets.test.ts`
// chạy trong `npm test`. Script này phủ phần còn lại.
import fs from 'fs';
import path from 'path';

// Mỗi pattern có group 1 = giá trị bí mật bị gán hằng, để lọc allowlist chính xác.
const PATTERNS = [
  { name: 'accessKeyId gán giá trị hằng', re: /accessKeyId\s*[:=]\s*['"]([A-Za-z0-9._-]{8,})['"]/g },
  { name: 'secretAccessKey gán giá trị hằng', re: /secretAccessKey\s*[:=]\s*['"]([A-Za-z0-9._+/=-]{8,})['"]/g },
  { name: 'mật khẩu gán giá trị hằng', re: /password\s*[:=]\s*['"]([^'"]{6,})['"]/gi },
  { name: 'DATABASE_URL chứa mật khẩu', re: /postgres(?:ql)?:\/\/[^\s'"`]*?:([^\s'"`@]{3,})@[^\s'"`]+/g },
  { name: 'khóa SSH/PEM', re: /(-----BEGIN [A-Z ]*PRIVATE KEY-----)/g },
  { name: 'token dạng GitHub', re: /\b(gh[pousr]_[A-Za-z0-9]{16,})\b/g },
  { name: 'API key Google', re: /\b(AIza[0-9A-Za-z_-]{20,})\b/g },
  { name: 'AWS access key id', re: /\b(AKIA[0-9A-Z]{16})\b/g },
  { name: 'JWT', re: /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,})\b/g },
  {
    name: 'biến môi trường bí mật gán hằng',
    // SALT cũng là bí mật: đó là khoá ký HMAC của phiên người dùng và khoá
    // mã hoá token admin. Thiếu SALT ở đây là lỗ hổng thật của scanner.
    re: /\b[A-Z_]*(?:SECRET|SALT|PASSWORD|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY)[A-Z_]*\s*=\s*['"]([^'"]+)['"]/g,
  },
];

// Giá trị được phép xuất hiện: tài khoản demo là công khai (hiện ngay trên trang
// đăng nhập, dùng chung cho mọi khách), và placeholder mô tả trong comment.
const ALLOWED_LITERALS = new Set([
  '123456',
  '<user>',
  '<password>',
  '<host>',
  'your_password_here',
  'changeme',
  'meowlish_user_session_secret_2026',
]);

const isCommentLine = (line) => {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('<!--');
};

// File tự kiểm chứng cố tình chứa các chuỗi giống bí mật làm probe — không
// phải bí mật thật, nên loại trừ để không báo nhiễu mỗi lần chạy.
const EXCLUDE_FILES = [path.join('scripts', 'scan-script-secrets.selftest.mjs')];

const dirs = ['scripts', 'tests', 'docs'];
const files = [];
for (const dir of dirs) {
  const root = path.join(process.cwd(), dir);
  if (!fs.existsSync(root)) continue;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(ts|tsx|mjs|js|json|md|ya?ml)$/.test(entry.name)) files.push(p);
    }
  };
  walk(root);
}

const findings = [];
for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  if (EXCLUDE_FILES.includes(rel)) continue;
  const text = fs.readFileSync(file, 'utf8');
  text.split(/\r?\n/).forEach((line, idx) => {
    // Comment mô tả ("// URL chuẩn: postgresql://<user>:<password>@...") không phải bí mật.
    if (isCommentLine(line)) return;
    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const value = m[1];
        if (ALLOWED_LITERALS.has(value)) continue;
        findings.push({ name, file: rel, line: idx + 1 });
      }
    }
  });
}

for (const f of findings) {
  console.log(`HIT  ${f.name}  ${f.file}:${f.line}`);
}
console.log(`\nDa quet ${files.length} file trong ${dirs.join(', ')}.`);
console.log(
  findings.length === 0
    ? 'KHONG co secret hardcode.'
    : `Phat hien ${findings.length} cho kiem tra.`
);

if (process.env.SECRET_SCAN_JSON) {
  // Chế độ máy đọc: KHÔNG kèm giá trị bí mật, chỉ có tên mẫu + vị trí.
  console.log(JSON.stringify({ scanned: files.length, findings }, null, 2));
}
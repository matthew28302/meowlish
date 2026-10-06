// Tự kiểm chứng scanner bí mật: cắm probe vào scripts/, chạy scanner ở chế độ
// JSON, đòi phải bắt đúng từng dòng; dọn sạch sau đó.
//
// Một công cụ quét mà không chứng minh được nó bắt được thì nguy hiểm hơn là
// không có: nó tạo cảm giác an toàn giả.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = process.cwd();
const PROBE_REL = path.join('scripts', '_scan_selftest', 'probe.mjs');
const probeFile = path.join(ROOT, PROBE_REL);

// Mỗi probe là MỘT dòng, kỳ vọng scanner báo đúng số dòng đó VÀ đúng tên mẫu
// (probe.mjs chỉ chứa dòng probe, không có dòng khác).
const PROBES = [
  { line: 1, expect: 'AWS access key id', code: `const id = 'AKIAIOSFODNN7EXAMPLE';\n` },
  { line: 2, expect: 'token dạng GitHub', code: `const t = 'ghp_abcdefghijklmnopqrstuvwxyz0123';\n` },
  { line: 3, expect: 'API key Google', code: `const k = 'AIzaSyD-1234567890abcdefghijklmnopqrs';\n` },
  { line: 4, expect: 'secretAccessKey gán giá trị hằng', code: `const cfg = { secretAccessKey: 'wJalrXUtnFEMIabc0123456789' };\n` },
  { line: 5, expect: 'mật khẩu gán giá trị hằng', code: `const password = 'Kh0ngPhaiBiMatThat';\n` },
  { line: 6, expect: 'DATABASE_URL chứa mật khẩu', code: `const u = 'postgresql://u:s3cretpw@db.supabase.co:5432/postgres';\n` },
  { line: 7, expect: 'khóa SSH/PEM', code: `const k = '-----BEGIN RSA PRIVATE KEY-----';\n` },
  { line: 8, expect: 'JWT', code: `const j = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N';\n` },
  { line: 9, expect: 'biến môi trường bí mật gán hằng', code: `process.env.AUTH_SALT = 'hardcoded-salt-value';\n` },
];

function runScannerJson() {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'scan-script-secrets.mjs')], {
    encoding: 'utf8',
    cwd: ROOT,
    env: { ...process.env, SECRET_SCAN_JSON: '1' },
  });
  const start = out.indexOf('{');
  if (start === -1) throw new Error('Scanner khong tra ve JSON');
  return JSON.parse(out.slice(start));
}

const failures = [];
try {
  fs.mkdirSync(path.dirname(probeFile), { recursive: true });
  for (const p of PROBES) fs.appendFileSync(probeFile, p.code, 'utf8');

  const { findings } = runScannerJson();
  const inProbe = findings.filter((f) => f.file === PROBE_REL);

  console.log('Scanner bat duoc trong file probe:');
  for (const p of PROBES) {
    const hit = inProbe.find((f) => f.line === p.line);
    const ok = Boolean(hit) && hit.name === p.expect;
    console.log(`  ${ok ? 'PASS' : 'MISS'}  dong ${p.line}  ${p.expect}`);
    if (!ok) failures.push(p);
  }

  // Chống nạn dương giả: probe là mật khẩu demo công khai ở ngữ cảnh mật khẩu —
  // scanner vẫn phải báo, vì allowlist chỉ bỏ qua giá trị chứ không bỏ qua ngữ cảnh.
  console.log(`\n${PROBES.length - failures.length}/${PROBES.length} probe bi bat.`);
} finally {
  fs.rmSync(path.dirname(probeFile), { recursive: true, force: true });
}

// Chạy lại trên repo sạch và BÁO CÁO (không fail): các phát hiện còn lại là
// phát hiện thật cần người xử lý, không phải lỗi của scanner.
const clean = runScannerJson();
console.log(`\nRepo sau khi don dep: ${clean.findings.length} phat hien can xem lai:`);
for (const f of clean.findings) console.log(`  ${f.name}  ${f.file}:${f.line}`);

if (failures.length > 0) {
  console.error('\nSCANNER KHONG TIN DUY — khong dua vao dung khi con probe bi bo sot.');
  process.exit(1);
}
console.log('\nScanner dinh chinh: bat duoc tat ca probe.');
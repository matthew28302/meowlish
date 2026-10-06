// Thử các biến thể mật khẩu đọc từ .env.local mà KHÔNG in giá trị ra log.
// Chỉ in tên phương án + kết quả kết nối.
import fs from 'fs';
import path from 'path';

const envFile = path.join(process.cwd(), '.env.local');
const line = fs
  .readFileSync(envFile, 'utf8')
  .split(/\r?\n/)
  .find((l) => l.startsWith('DATABASE_URL='));
if (!line) {
  console.error('Khong co DATABASE_URL trong .env.local');
  process.exit(1);
}
const raw = line.slice('DATABASE_URL='.length).trim();

// URL chuẩn: postgresql://<user>:<password>@<host>:6543/postgres
const scheme = 'postgresql://';
const afterScheme = raw.slice(scheme.length);
const firstColon = afterScheme.indexOf(':');
const lastAt = afterScheme.lastIndexOf('@');
const user = afterScheme.slice(0, firstColon);
const typedPassword = afterScheme.slice(firstColon + 1, lastAt);
const tail = afterScheme.slice(lastAt + 1); // host:port/db

console.log('user            :', user);
console.log('host            :', tail);
console.log('do dai password :', typedPassword.length);
console.log('chua encode     :', /[@:/?#[\]@!$&'()*+,;=]/.test(typedPassword) ? 'CO ky tu dac biet' : 'chi chu va so');

const candidates = [
  ['A. giong nguyen ban, @ -> %40', encodeURIComponent(typedPassword)],
  ['B. giong nguyen ban, nguyen @ dau', encodeURIComponent(typedPassword.split('@')[0] + '@')],
  ['C. phan truoc dau @ dau tien', encodeURIComponent(typedPassword.split('@')[0])],
  ['D. giong nguyen ban, bo @', encodeURIComponent(typedPassword.replace(/@/g, ''))],
];

const postgres = (await import('postgres')).default;
for (const [label, pw] of candidates) {
  const url = `${scheme}${user}:${pw}@${tail}`;
  const client = postgres(url, { max: 1, prepare: false, ssl: 'require', connect_timeout: 15 });
  try {
    const r = await client`select current_user as u, count(*)::int as n from users`;
    console.log(`  ${label}: KET NOI OK (user=${r[0].u}, ${r[0].n} tai khoan)`);
  } catch (e) {
    console.log(`  ${label}: that bai (${String(e.message).split('\n')[0].slice(0, 40)})`);
  } finally {
    await client.end({ timeout: 3 }).catch(() => {});
  }
}

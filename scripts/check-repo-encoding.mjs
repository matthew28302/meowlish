import { execFileSync } from 'node:child_process';
import { mojibakeScore } from './lib/cp1252.mjs';

const rev = process.argv[2] || 'HEAD';

// git show xuất ra stdout dạng byte thô; execFileSync với encoding 'buffer'
// giữ nguyên byte để không bị PowerShell đổi encoding.
const files = execFileSync('git', ['ls-tree', '-r', '--name-only', rev], {
  encoding: 'buffer',
})
  .toString('utf8')
  .split('\n')
  .filter((f) => /\.(ts|tsx|mjs|css|md)$/.test(f) && !f.includes('node_modules'));

const bad = [];
for (const f of files) {
  let buf;
  try {
    buf = execFileSync('git', ['cat-file', 'blob', `${rev}:${f}`], { encoding: 'buffer' });
  } catch {
    continue;
  }
  const score = mojibakeScore(buf.toString('utf8'));
  if (score > 0) bad.push({ f, score });
}

bad.sort((a, b) => b.score - a.score);
console.log(`${rev}: ${bad.length} file mojibake / ${files.length} file\n`);
for (const { f, score } of bad) console.log(`  ${String(score).padStart(5)}  ${f}`);

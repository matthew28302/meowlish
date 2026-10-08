// Kiểm tra formulaPattern có khớp 1-1 với số khối blocks không.
// Quy ước repo: mỗi slot [...] trong công thức tương ứng đúng 1 khối lego.
import { GRAMMAR_LESSONS } from '../src/lib/data/grammar.ts';

const countSlots = (pattern) => (pattern.match(/\[[^\]]+\]/g) || []).length;

let bad = 0;
console.log('| Bai | Cong thuc | Slot | Khoi | Ket qua |');
console.log('|---|---|---|---|---|');

for (const lesson of GRAMMAR_LESSONS) {
  const lego = lesson.legoExample;
  if (!lego?.formulaPattern || !lego.blocks?.length) continue;

  const slots = countSlots(lego.formulaPattern);
  const blocks = lego.blocks.length;
  const ok = slots === blocks;
  if (!ok) bad++;

  console.log(
    `| ${lesson.id} | ${lego.formulaPattern.slice(0, 46)}${lego.formulaPattern.length > 46 ? '…' : ''} | ${slots} | ${blocks} | ${ok ? 'PASS' : 'FAIL'} |`
  );
}

console.log('');
console.log(
  bad === 0
    ? 'PASS — moi cong thuc khop 1-1 voi so khoi.'
    : `FAIL — ${bad} bai co cong thuc lech so khoi.`
);
if (bad > 0) process.exitCode = 1;

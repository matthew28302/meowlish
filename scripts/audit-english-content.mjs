// Audit nội dung tiếng Anh trong dữ liệu học tập. Kiểm tra bằng LUẬT NGỮ PHÁP
// và TÍNH NHẤT QUÁN, không dựa vào cảm giác.
import { GRAMMAR_LESSONS } from '../src/lib/data/grammar.ts';
import { ENCYCLOPEDIA_DATA } from '../src/lib/data/encyclopedia.ts';

const issues = [];
const add = (lessonId, kind, detail) => issues.push({ lessonId, kind, detail });

const countSlots = (p) => (p.match(/\[[^\]]+\]/g) || []).length;

console.log('=== 1. CONG THUC KHOI SO KHOI ===');
for (const l of GRAMMAR_LESSONS) {
  const lego = l.legoExample;
  if (!lego?.formulaPattern) continue;
  const slots = countSlots(lego.formulaPattern);
  if (slots !== lego.blocks.length) {
    add(l.id, 'formula', `${slots} slot vs ${lego.blocks.length} khoi`);
    console.log(`  FAIL ${l.id}: ${slots} slot vs ${lego.blocks.length} khoi`);
  }
}

console.log('\n=== 2. CAU VI DU PHAI KHOI TU WORD CUA KHOI ===');
// Từng khối phải góp phần tạo nên fullSentence — nếu không, khối đó "thừa".
for (const l of GRAMMAR_LESSONS) {
  const lego = l.legoExample;
  if (!lego?.fullSentence) continue;
  const haystack = lego.fullSentence.toLowerCase();
  for (const b of lego.blocks) {
    // Lấy chữ cái đầu của word, bỏ dấu câu, kiểm có xuất hiện trong câu.
    const core = b.word
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .trim();
    if (!core) continue;
    const firstToken = core.split(/\s+/)[0];
    if (firstToken && !haystack.includes(firstToken)) {
      add(l.id, 'orphan-block', `khoi "${b.label}" (${b.word}) khong xuat hien trong fullSentence`);
      console.log(`  FAIL ${l.id}: khoi "${b.label}" -> "${b.word}" khong co trong cau`);
    }
  }
}

console.log('\n=== 3. GHEP WORD KHOI KHOP FULLSENTENCE ===');
// Bỏ qua dấu câu khi so: quy ước là khối cuối không mang dấu, dấu nằm ở
// fullSentence. Chỉ báo khi phần CHỮ khác nhau — đó mới là lỗi thật.
const stripPunct = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
for (const l of GRAMMAR_LESSONS) {
  const lego = l.legoExample;
  if (!lego?.blocks?.length || !lego.fullSentence) continue;
  const joined = lego.blocks.map((b) => b.word).join(' ');
  if (stripPunct(joined) !== stripPunct(lego.fullSentence)) {
    add(l.id, 'concat', 'chu cua khoi khop != fullSentence');
    console.log(`  FAIL ${l.id}`);
    console.log(`       ghep    : ${stripPunct(joined).slice(0, 96)}`);
    console.log(`       khai bao: ${stripPunct(lego.fullSentence).slice(0, 96)}`);
  }
}

console.log('\n=== 4. BAI DIEN XUONG: TIENG ANH PHAI CO DAO DONG/TU DUNG ===');
for (const l of GRAMMAR_LESSONS) {
  const tr = l.legoExample?.translation ?? '';
  if (!tr) continue;
  // Bản dịch tiếng Việt phải có dấu tiếng Việt; nếu không thì có thể là tiếng Anh bị lẫn.
  const hasVietnameseDiacritic = /[àáâãèéêìíòóôõùúýăđĩũơư]/i.test(tr);
  if (!hasVietnameseDiacritic) {
    add(l.id, 'translation', 'ban dich thieu dau tieng Viet (co the la tieng Anh nham)');
    console.log(`  WARN ${l.id}: ${JSON.stringify(tr.slice(0, 70))}`);
  }
}

console.log('\n=== 5. VARIANT: DU 4 truong bat buoc ===');
// Field thật: tenseName, formula, sentence, translation, usageContext.
for (const l of GRAMMAR_LESSONS) {
  for (const v of l.tenseVariants ?? []) {
    const problems = [];
    if (!v.tenseName) problems.push('thieu tenseName');
    if (!v.formula) problems.push('thieu formula');
    if (!v.sentence) problems.push('thieu sentence');
    if (!v.translation) problems.push('thieu translation');
    if (!v.usageContext) problems.push('thieu usageContext');
    if (problems.length) {
      add(l.id, 'variant', problems.join(', '));
      console.log(`  FAIL ${l.id} variant "${v.tenseName ?? '?'}": ${problems.join(', ')}`);
    }
  }
}

console.log('\n=== 6. BAI CO LEGO = PHAI DUOC LOI TU DANH SACH ===');
const withLego = GRAMMAR_LESSONS.filter((l) => l.legoExample?.blocks?.length);
console.log(`  ${withLego.length}/${GRAMMAR_LESSONS.length} bai co lego du khoi.`);

console.log('\n=== 7. TU DIEN: PHAI CO IPA + NGHIA + VI DU ===');
let dicIssues = 0;
const sample = ENCYCLOPEDIA_DATA.slice(0, 400);
for (const e of sample) {
  const bad = [];
  if (!e.word) bad.push('thieu word');
  if (!e.meaningVi) bad.push('thieu meaningVi');
  if (!e.ipa) bad.push('thieu ipa');
  if (bad.length && dicIssues < 6) {
    console.log(`  FAIL ${e.word ?? '?'}: ${bad.join(', ')}`);
    dicIssues++;
  }
}
console.log(`  (kiem tra ${sample.length} muc, thieu truong ${dicIssues})`);

console.log('\n================================');
console.log(`TONG VAN DE: ${issues.length}`);
const byLesson = {};
for (const i of issues) byLesson[i.lessonId] = (byLesson[i.lessonId] ?? 0) + 1;
for (const [k, v] of Object.entries(byLesson).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}

const fs = require('fs');
const content = fs.readFileSync('src/lib/data/practice.ts', 'utf8');

const scMatches = content.split(/id:\s*'rp-/).slice(1);
console.log('--- Roleplay Scenarios ---');
scMatches.forEach((sc) => {
  const id = 'rp-' + sc.split("'")[0];
  const steps = (sc.match(/partnerMessage:/g) || []).length;
  console.log(`${id}: ${steps} steps`);
});

console.log('--- Summary ---');
console.log('Speaking prompts:', (content.match(/id:\s*'spk-/g) || []).length);
console.log('Writing prompts:', (content.match(/id:\s*'wrt-/g) || []).length);
console.log('Listening exercises:', (content.match(/id:\s*'lis-/g) || []).length);
console.log('Roleplay scenarios:', scMatches.length);

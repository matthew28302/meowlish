import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'data', 'english_learning.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary_cache (
    word        TEXT PRIMARY KEY,
    data_json   TEXT NOT NULL,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const IT_DEV_WORDS = [
  'abstraction','accessor','annotation','api','array','assertion','asynchronous',
  'attribute','authentication','authorization','binary','boolean','branch',
  'breakpoint','buffer','build','bytecode','callback','class','closure',
  'coercion','collection','command','compile','compiler','component','concurrency',
  'conditional','configuration','constructor','container','context','controller',
  'convention','coroutine','cursor','daemon','data','datatype','deadlock','debug',
  'debugger','declaration','decorator','default','delegation','dependency',
  'deprecation','deserialization','destructuring','dictionary','directive',
  'dispatch','documentation','domain','dynamic','encapsulation','endpoint','enum',
  'environment','error','event','exception','expression','extension','factory',
  'field','filter','flag','flow','function','generator','getter','global',
  'handler','hook','immutable','implementation','import','index','inheritance',
  'injection','instance','instruction','integration','interface','iterator',
  'keyword','lambda','latency','lifecycle','literal','loader','local','logging',
  'loop','map','memory','method','middleware','migration','mixin','model',
  'module','mutation','namespace','network','null','object','observer','operation',
  'overloading','override','package','parameter','parsing','pattern','payload',
  'pipeline','pointer','polymorphism','priority','procedure','process','property',
  'protocol','prototype','proxy','query','queue','recursion','refactoring',
  'register','rendering','repository','request','response','runtime','scope',
  'serialization','service','session','setter','singleton','socket',
  'specification','stack','statement','state','static','string','structure',
  'syntax','template','testing','thread','token','transaction','transformation',
  'trigger','tuple','type','undefined','unit','validation','variable','version',
  'virtual','void','webhook'
];

const IT_ARCH_WORDS = [
  'aggregation','anomaly','authentication','availability','backend','balancer',
  'bandwidth','bottleneck','cache','canary','capacity','cdn','circuit','cluster',
  'cohesion','container','containerization','coupling','data-center','decomposition',
  'deployment','devops','distributed','docker','domain','durability','elasticity',
  'encryption','failover','fallback','federation','firewall','frontend','gateway',
  'horizontal','idempotency','immutability','infrastructure','ingress','instance',
  'isolation','kubernetes','load-balancing','microservice','monolith','multitenancy',
  'network','node','orchestration','partition','persistence','pipeline','protocol',
  'proxy','queue','redundancy','replication','resilience','rollback','routing',
  'scalability','schema','security','service-mesh','sharding','singleton','ssl',
  'storage','synchronization','throughput','timeout','tls','topology','transaction',
  'versioning','virtual','vpc','vulnerability','webhook','zone'
];

const IT_SCRUM_WORDS = [
  'acceptance','agile','artifact','backlog','burndown','capacity','ceremony',
  'commitment','dailyscrum','definition','deliverable','demo','dependency','done',
  'epic','estimation','feedback','groove','increment','iteration','kanban','lean',
  'milestone','mvp','obstacle','persona','planning','poker','prioritization',
  'retrospective','roadmap','scrum','scrummaster','spike','sprint','standup',
  'story','velocity','vision','workflow'
];

const WORDS_TO_CRAWL = [
  ...IT_DEV_WORDS.map(w => ({ word: w, category: 'it-dev', categoryLabel: '\u{1F4BB} IT: Code & Dev', level: 'B2' })),
  ...IT_ARCH_WORDS.map(w => ({ word: w, category: 'it-arch', categoryLabel: '\u{1F3D7}\uFE0F IT: Ki\u1EBFn Tr\xFAc', level: 'B2' })),
  ...IT_SCRUM_WORDS.map(w => ({ word: w, category: 'it-scrum', categoryLabel: '\u23F1\uFE0F IT: Scrum & Agile', level: 'B2' })),
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));
function stripTags(html) { return html.replace(/<[^>]+>/g, '').trim(); }

async function crawlCambridge(cleanWord) {
  const slug = cleanWord.replace(/\s+/g, '-');
  const url = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(slug)}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      }
    });
  } catch { return null; }
  if (!res.ok) return null;
  const html = await res.text();
  if (!html.includes('dtrans') && !html.includes('ddef_d')) return null;

  const ipaMatch = html.match(/<span[^>]*class="[^"]*ipa dipa[^"]*"[^>]*>([^<]+)<\/span>/i);
  const ipa = ipaMatch ? `/${ipaMatch[1].trim()}/` : null;
  const posMatch = html.match(/<span[^>]*class="[^"]*pos dpos[^"]*"[^>]*>([^<]+)<\/span>/i);
  const partOfSpeech = posMatch ? posMatch[1].trim() : null;
  const audioMatch = html.match(/<source[^>]*type="audio\/mpeg"[^>]*src="([^"]+)"/i);
  let audioUrl = audioMatch ? audioMatch[1] : null;
  if (audioUrl && audioUrl.startsWith('/')) audioUrl = `https://dictionary.cambridge.org${audioUrl}`;

  const viMatches = [];
  const viRe = /<span[^>]*class="[^"]*trans dtrans[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let vm;
  while ((vm = viRe.exec(html)) !== null && viMatches.length < 5) {
    const t = stripTags(vm[1]); if (t) viMatches.push(t);
  }
  const examples = [];
  const egRe = /<span[^>]*class="[^"]*eg deg[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let egM;
  while ((egM = egRe.exec(html)) !== null && examples.length < 4) {
    const t = stripTags(egM[1]); if (t) examples.push(t);
  }
  if (viMatches.length === 0 && !ipa) return null;
  return { ipa, partOfSpeech, audioUrl, meaningVi: viMatches[0] || null, allViMeanings: viMatches, exampleSentences: examples, source: 'cambridge', cambridgeUrl: url };
}

async function crawlFallback(cleanWord) {
  const [dictRes, transRes] = await Promise.allSettled([
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`).then(r => r.ok ? r.json() : null),
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`).then(r => r.ok ? r.json() : null),
  ]);
  const dict = dictRes.status === 'fulfilled' ? dictRes.value?.[0] : null;
  const trans = transRes.status === 'fulfilled' ? transRes.value?.responseData?.translatedText : null;
  const ipa = dict?.phonetic || dict?.phonetics?.find(p => p.text)?.text || `/${cleanWord}/`;
  const audioUrl = dict?.phonetics?.find(p => p.audio)?.audio || null;
  const partOfSpeech = dict?.meanings?.[0]?.partOfSpeech || 'noun';
  const meaningVi = trans || cleanWord;
  const enDef = dict?.meanings?.[0]?.definitions?.[0]?.definition || '';
  const examples = dict?.meanings?.[0]?.definitions?.[0]?.example ? [dict.meanings[0].definitions[0].example] : [];
  return { ipa, partOfSpeech, audioUrl, meaningVi, allViMeanings: [meaningVi], exampleSentences: examples, enDef, source: 'fallback_api', cambridgeUrl: `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(cleanWord)}` };
}

async function crawlWord(item) {
  const cleanWord = item.word.toLowerCase();
  const cached = db.prepare('SELECT data_json FROM dictionary_cache WHERE word = ?').get(cleanWord);
  if (cached) { try { return { ...item, ...JSON.parse(cached.data_json), fromCache: true }; } catch {} }
  let data = null;
  try { data = await crawlCambridge(cleanWord); } catch {}
  if (!data) { try { data = await crawlFallback(cleanWord); } catch { return null; } }
  if (!data) return null;
  const row = { word: cleanWord, ...data };
  db.prepare('INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(cleanWord, JSON.stringify(row));
  return { ...item, ...row, fromCache: false };
}

function buildEntry(r) {
  const exampleSentences = (r.exampleSentences || []).map(eg => ({
    en: eg, vi: '', context: r.source === 'cambridge' ? 'Cambridge English-Vietnamese' : 'Free Dictionary API'
  }));
  if (exampleSentences.length === 0) exampleSentences.push({
    en: `The concept of '${r.word}' is fundamental in ${r.categoryLabel} contexts.`,
    vi: `Khai niem '${r.word}' rat quan trong trong ngu canh ${r.categoryLabel}.`,
    context: 'Generated context'
  });
  const meaningVi = r.meaningVi || r.word;
  return {
    word: r.word, category: r.category, categoryLabel: r.categoryLabel,
    level: r.level || 'B2', ipa: r.ipa || `/${r.word}/`,
    partOfSpeech: r.partOfSpeech || 'noun', meaningVi,
    detailedExplanation: r.enDef || `Core term used in ${r.categoryLabel}: ${meaningVi}`,
    exampleSentences, audioUrl: r.audioUrl || null,
    collocations: [`${r.word} in context`, `effective ${r.word}`, `standard ${r.word}`],
    source: r.source, fromCache: r.fromCache
  };
}

async function run() {
  console.log(`\n Starting Batch 2: ${WORDS_TO_CRAWL.length} words (IT Dev + IT Arch + Scrum)\n`);
  const cacheKeys = new Set(db.prepare('SELECT word FROM dictionary_cache').all().map(r => r.word));
  const results = []; let cachedCount = 0, crawledCount = 0, failedCount = 0;

  for (let i = 0; i < WORDS_TO_CRAWL.length; i++) {
    const item = WORDS_TO_CRAWL[i];
    const cleanWord = item.word.toLowerCase();
    const isInCache = cacheKeys.has(cleanWord);
    process.stdout.write(`[${String(i+1).padStart(3)}/${WORDS_TO_CRAWL.length}] ${item.category.padEnd(8)} | ${cleanWord.padEnd(22)} ... `);
    const res = await crawlWord(item);
    if (res) {
      results.push(buildEntry(res));
      if (res.fromCache) { cachedCount++; console.log(`CACHE  [${res.ipa||'N/A'}]`); }
      else { crawledCount++; console.log(`OK(${res.source}) [${res.ipa||'N/A'}]`); }
    } else { failedCount++; console.log(`FAILED`); }
    if (!isInCache) await delay(80);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Batch 2 complete!`);
  console.log(`  Total   : ${WORDS_TO_CRAWL.length}`);
  console.log(`  Cache   : ${cachedCount}`);
  console.log(`  Crawled : ${crawledCount}`);
  console.log(`  Failed  : ${failedCount}`);
  console.log(`  Saved   : ${cachedCount + crawledCount}`);
  console.log(`${'='.repeat(60)}\n`);

  const outPath = path.join(projectRoot, 'scripts', 'results_batch2.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`results_batch2.json written -> ${outPath}`);
  console.log(`Entries: ${results.length}\n`);
}

run().catch(err => { console.error('Fatal error:', err); process.exit(1); });
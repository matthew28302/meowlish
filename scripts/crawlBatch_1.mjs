import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────
const projectRoot = process.cwd();
const dbPath      = path.join(projectRoot, 'data', 'english_learning.db');
const outPath     = path.join(projectRoot, 'scripts', 'results_batch1.json');
const DELAY_MS    = 80;

// ─── Database ─────────────────────────────────────────────────────────────────
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary_cache (
    word        TEXT PRIMARY KEY,
    data_json   TEXT NOT NULL,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Level map ────────────────────────────────────────────────────────────────
const LEVEL_MAP = {
  comply:'B1', delegate:'B1', negotiate:'B1', allocate:'B1', implement:'B1',
  modify:'B1', notify:'B1', revise:'B1', submit:'B1', verify:'B1', evaluate:'B1',
  generate:'B1', maximize:'B1', minimize:'B1', optimize:'B1', retain:'B1',
  commence:'B1', endorse:'B1', postpone:'B1', specify:'B1', coordinate:'B1',
  compensate:'B1', terminate:'B1', adhere:'B1', oversee:'B1', supervise:'B1',
  waive:'B1', withhold:'B1', ratify:'B1', invoice:'B1', inaugurate:'B1', prohibit:'B1',
  annual:'B1', applicable:'B1', available:'B1', domestic:'B1', effective:'B1',
  efficient:'B1', financial:'B1', flexible:'B1', global:'B1', immediate:'B1',
  primary:'B1', productive:'B1', profitable:'B1', prompt:'B1', relevant:'B1',
  reliable:'B1', significant:'B1', sufficient:'B1', timely:'B1', transparent:'B1',
  capable:'B1', confident:'B1', creative:'B1', dedicated:'B1', determined:'B1',
  enthusiastic:'B1', focused:'B1', hardworking:'B1', honest:'B1', independent:'B1',
  logical:'B1', motivated:'B1', organized:'B1', patient:'B1', punctual:'B1',
  resourceful:'B1', strategic:'B1', versatile:'B1',
  accommodate:'B2', collaborate:'B2', reimburse:'B2', authorize:'B2', benchmark:'B2',
  restructure:'B2', depreciate:'B2', discontinue:'B2', facilitate:'B2', subsidize:'B2',
  revenue:'B2', initiative:'B2', contingency:'B2', audit:'B2', precaution:'B2',
  depreciation:'B2', eligible:'B2', feasible:'B2', confidential:'B2', mandatory:'B2',
  tentative:'B2', comprehensive:'B2', competitive:'B2', consecutive:'B2',
  considerable:'B2', contractual:'B2', exhaustive:'B2', extensive:'B2', fiscal:'B2',
  functional:'B2', hourly:'B2', incremental:'B2', innovative:'B2', integral:'B2',
  interim:'B2', joint:'B2', marginal:'B2', mutual:'B2', nominal:'B2',
  obligatory:'B2', optimal:'B2', partial:'B2', periodic:'B2', preliminary:'B2',
  principal:'B2', progressive:'B2', prospective:'B2', provisional:'B2',
  quarterly:'B2', regulatory:'B2', responsive:'B2', satisfactory:'B2',
  substantial:'B2', supplementary:'B2', sustainable:'B2', systematic:'B2',
  transferable:'B2', unanimous:'B2', collaborative:'B2', commercial:'B2',
  adequate:'B2', advantageous:'B2', affordable:'B2', aggressive:'B2',
  ambitious:'B2', analytical:'B2', assertive:'B2', attentive:'B2',
  authentic:'B2', beneficial:'B2', cautious:'B2', committed:'B2',
  competent:'B2', consistent:'B2', constructive:'B2', decisive:'B2',
  dependable:'B2', diplomatic:'B2', dynamic:'B2', empathetic:'B2',
  experienced:'B2', insightful:'B2', methodical:'B2', objective:'B2',
  proactive:'B2', tactful:'B2',
  streamline:'C1', discrepancy:'C1', expedite:'C1', procurement:'C1',
  liability:'C1', prerequisite:'C1', meticulous:'C1', visionary:'C1',
  influential:'C1', consensus:'C1',
};

function assignLevel(word) {
  const key = word.toLowerCase().replace(/[^a-z]/g, '');
  return LEVEL_MAP[key] || 'B2';
}

// ─── Word list ─────────────────────────────────────────────────────────────────
const RAW_WORDS = [
  'accommodate','collaborate','comply','eligible','feasible','confidential',
  'mandatory','reimburse','delegate','negotiate','consensus','tentative',
  'initiative','revenue','expedite','facilitate','contingency','benchmark',
  'comprehensive','streamline','allocate','authorize','discrepancy','subsidize',
  'precaution','procurement','audit','implement','liability','prerequisite',
  'restructure','terminate','adhere','commence','compensate','coordinate',
  'depreciate','depreciation','discontinue','endorse','evaluate','generate',
  'inaugurate','invoice','maximize','minimize','modify','notify','optimize',
  'oversee','postpone','prohibit','ratify','retain','revise','specify',
  'submit','supervise','verify','waive','withhold',
  'adjacent','annual','applicable','approximate','available','collaborative',
  'commercial','competitive','consecutive','considerable','contractual',
  'domestic','effective','efficient','exhaustive','extensive','financial',
  'fiscal','flexible','functional','global','hourly','immediate','incremental',
  'innovative','integral','interim','joint','marginal','mutual','negligible',
  'nominal','obligatory','optimal','partial','periodic','preliminary','primary',
  'principal','productive','profitable','progressive','prompt','prospective',
  'provisional','quarterly','regulatory','relevant','reliable','responsive',
  'satisfactory','significant','substantial','sufficient','supplementary',
  'sustainable','systematic','timely','transferable','transparent','unanimous',
  'adequate','advantageous','affordable','aggressive','ambitious','analytical',
  'assertive','attentive','authentic','beneficial','capable','cautious',
  'committed','competent','confident','consistent','constructive','creative',
  'decisive','dedicated','dependable','determined','diplomatic','dynamic',
  'empathetic','enthusiastic','experienced','flexible','focused',
  'goal-oriented','hardworking','honest','independent','influential',
  'initiative','innovative','insightful','logical','methodical','meticulous',
  'motivated','objective','organized','patient','proactive','punctual',
  'reliable','resourceful','results-oriented','self-disciplined','strategic',
  'systematic','tactful','team-oriented','versatile','visionary',
];

const WORDS_TO_CRAWL = [...new Set(RAW_WORDS)].map(w => ({
  word: w,
  category: 'toeic',
  categoryLabel: '\ud83c\udfaf T\u1eeb V\u1ef1ng TOEIC',
  level: assignLevel(w),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function stripTags(h) {
  return h.replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .trim();
}

// ─── Cambridge HTML parser ────────────────────────────────────────────────────
function parseCambridge(html) {
  const ipaM = html.match(/<span[^>]*class="[^"]*ipa dipa[^"]*"[^>]*>([^<]+)<\/span>/i);
  const ipa  = ipaM ? `/${ipaM[1].trim()}/` : null;

  const posM = html.match(/<span[^>]*class="[^"]*pos dpos[^"]*"[^>]*>([^<]+)<\/span>/i);
  const partOfSpeech = posM ? posM[1].trim() : 'verb';

  const audM = html.match(/<source[^>]*type="audio\/mpeg"[^>]*src="([^"]+)"/i);
  let audioUrl = audM ? audM[1] : null;
  if (audioUrl && audioUrl.startsWith('/')) {
    audioUrl = 'https://dictionary.cambridge.org' + audioUrl;
  }

  const senses = [];
  const defRe = /<div[^>]*class="[^"]*def-block[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let m;
  while ((m = defRe.exec(html)) !== null && senses.length < 3) {
    const blk = m[1];
    const edM  = blk.match(/<div[^>]*class="[^"]*def[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const enDef = edM ? stripTags(edM[1]) : '';
    const vtM   = blk.match(/<span[^>]*class="[^"]*trans[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const viTrans = vtM ? stripTags(vtM[1]) : '';
    const examples = [];
    const egRe = /<span[^>]*class="[^"]*eg[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    let em;
    while ((em = egRe.exec(blk)) !== null && examples.length < 2) {
      examples.push(stripTags(em[1]));
    }
    if (viTrans || enDef) senses.push({ enDef, viTrans, examples });
  }
  return { ipa, partOfSpeech, audioUrl, senses };
}

// ─── Crawl one word ───────────────────────────────────────────────────────────
async function crawlWord(item) {
  const cw   = item.word.toLowerCase();
  const slug = cw.replace(/\s+/g, '-');

  // Cache hit
  const cached = db.prepare('SELECT data_json FROM dictionary_cache WHERE word = ?').get(cw);
  if (cached) {
    try {
      const d = JSON.parse(cached.data_json);
      return { ...item, ...d, fromCache: true };
    } catch { /* corrupt – re-fetch */ }
  }

  // Cambridge
  const cambridgeUrl = 'https://dictionary.cambridge.org/dictionary/english-vietnamese/' + encodeURIComponent(slug);
  try {
    const res = await fetch(cambridgeUrl, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
    });
    if (res.ok) {
      const html = await res.text();
      if (html.includes('dtrans') || html.includes('ddef_d') || html.includes('def-block')) {
        const parsed = parseCambridge(html);
        if (parsed.senses.length > 0) {
          const result = { word: cw, ...parsed, source: 'cambridge', cambridgeUrl };
          db.prepare('INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
            .run(cw, JSON.stringify(result));
          return { ...item, ...result, fromCache: false };
        }
      }
    }
  } catch { /* fall through */ }

  // Fallback
  try {
    const [dr, tr] = await Promise.allSettled([
      fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(cw))
        .then(r => r.ok ? r.json() : null),
      fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(cw) + '&langpair=en|vi')
        .then(r => r.ok ? r.json() : null),
    ]);
    const dict = dr.status === 'fulfilled' ? dr.value?.[0] : null;
    const vi   = tr.status === 'fulfilled' ? tr.value?.responseData?.translatedText : '';
    const ipa        = dict?.phonetic || dict?.phonetics?.find(p => p.text)?.text || `/${cw}/`;
    const audioUrl   = dict?.phonetics?.find(p => p.audio)?.audio || null;
    const enDef      = dict?.meanings?.[0]?.definitions?.[0]?.definition || 'Key TOEIC / business term';
    const partOfSpeech = dict?.meanings?.[0]?.partOfSpeech || 'verb';
    const fallback = {
      word: cw, ipa, audioUrl, partOfSpeech,
      senses: [{ enDef, viTrans: vi || cw, examples: [] }],
      source: 'fallback_api', cambridgeUrl,
    };
    db.prepare('INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
      .run(cw, JSON.stringify(fallback));
    return { ...item, ...fallback, fromCache: false };
  } catch { return null; }
}

// ─── Build output entry ───────────────────────────────────────────────────────
function buildEntry(r, idx) {
  const p = r.senses?.[0] || {};
  const viMeaning  = p.viTrans || r.word;
  const enExplain  = p.enDef   || 'Essential TOEIC / Business English term';
  const ex = (p.examples || []).map(e => ({
    en: e,
    vi: '(C\u00e2u v\u00ed d\u1ee5 t\u1eeb Cambridge English-Vietnamese Dictionary)',
    context: 'Cambridge English-Vietnamese',
  }));
  if (ex.length === 0) {
    ex.push({
      en:  `Professionals frequently use "${r.word}" in formal workplace communication.`,
      vi:  `C\u00e1c chuy\u00ean gia th\u01b0\u1eddng xuy\u00ean d\u00f9ng "${r.word}" trong giao ti\u1ebfp chuy\u00ean nghi\u1ec7p.`,
      context: 'TOEIC / Business English',
    });
  }
  const s2 = r.senses?.[1];
  if (s2?.examples?.[0]) {
    ex.push({
      en: s2.examples[0],
      vi: '(V\u00ed d\u1ee5 b\u1ed5 sung \u2013 Cambridge)',
      context: 'Cambridge English-Vietnamese',
    });
  }
  return {
    id:                  `toeic-${idx + 1}-${r.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    word:                r.word,
    category:            r.category,
    categoryLabel:       r.categoryLabel,
    level:               r.level || 'B2',
    ipa:                 r.ipa || `/${r.word}/`,
    partOfSpeech:        r.partOfSpeech || 'verb',
    meaningVi:           viMeaning,
    detailedExplanation: enExplain,
    exampleSentences:    ex,
    audioUrl:            r.audioUrl || null,
    collocations: [
      `${r.word} effectively`,
      `to ${r.word} a plan`,
      `${r.word} with colleagues`,
    ],
    source: r.source || 'unknown',
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\nStarting Batch-1 crawl -- ${WORDS_TO_CRAWL.length} unique TOEIC words`);
  console.log(`DB  : ${dbPath}`);
  console.log(`Out : ${outPath}\n`);

  const results = [];
  let saved = 0, fromCache = 0;

  for (let i = 0; i < WORDS_TO_CRAWL.length; i++) {
    const item = WORDS_TO_CRAWL[i];
    process.stdout.write(`[${String(i + 1).padStart(3)}/${WORDS_TO_CRAWL.length}] ${item.word.padEnd(22)} `);
    const r = await crawlWord(item);
    if (r) {
      results.push(r);
      saved++;
      if (r.fromCache) { fromCache++; process.stdout.write('CACHE '); }
      else              { process.stdout.write(`OK(${r.source}) `); }
      console.log(`[${r.level}] ${r.ipa || ''}`);
    } else {
      console.log('FAILED');
    }
    await sleep(DELAY_MS);
  }

  console.log('\n---');
  console.log(`Total crawled : ${saved}/${WORDS_TO_CRAWL.length}`);
  console.log(`From cache    : ${fromCache}`);
  console.log(`Fresh fetch   : ${saved - fromCache}`);

  const entries = results.map(buildEntry);
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), 'utf-8');
  console.log(`JSON written  : ${outPath} (${entries.length} entries)`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });

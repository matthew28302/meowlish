import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'data', 'english_learning.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary_cache (
    word TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const DAILY_WORDS = ['absolutely','accommodation','acknowledge','actually','admire','adventure','advice','afraid','agree','almost','already','although','amazing','angry','announce','anxious','apologize','argue','around','arrive','aspect','attitude','awful','balance','basic','beautiful','beginning','believe','besides','bother','brave','bright','broad','busy','calm','careful','casual','certain','challenge','change','check','cheerful','clear','clever','comfortable','communicate','complain','compliment','concerned','confident','confuse','congratulate','consider','contact','continue','control','convince','curious','daily','deal','decide','definitely','describe','deserve','detail','difficult','discuss','doubt','eager','early','easy','embarrass','emotion','encourage','engage','enjoy','enough','enter','even','eventually','example','excellent','excited','excuse','explain','express','fact','fail','fair','familiar','fantastic','feel','final','finish','focus','follow','forget','forward','free','frequently','friendly','funny','gather','general','glad','good','grateful','great','happen','happy','have','helpful','honest','hope','important','improve','include','information','interest','invite','join','just','keep','kind','knowledge','later','laugh','learn','listen','lonely','look','manage','matter','mean','mention','mind','miss','more','mostly','move','necessary','need','normal','notice','once','open','participate','perhaps','plan','popular','positive','prepare','pretty','probably','promise','proud','provide','reason','relax','remember','repeat','respect','respond','result','satisfied','seem','serious','share','simple','sincere','smart','solve','sometimes','sorry','start','stay','strong','study','suggest','surprise','thankful','think','together','tough','trust','try','typical','understand','unique','update','upset','useful','visit','wait','welcome','willing','wonderful','work','worry','wrong'];

const PHRASES = ['give it a shot','take it easy','hang in there','it depends','no worries','fair enough','as far as I know','by the way','for the time being','in the meantime','on the other hand','first of all','last but not least','in conclusion','to be honest','to be precise','in other words','that being said','needless to say','at the end of the day','more often than not','as a matter of fact','in addition to','in terms of','with regard to','due to the fact','regardless of','in spite of','even though','as long as','provided that','keep in mind','bear in mind','take into account','come to think of it','now that you mention it','I see what you mean','if you ask me','as I see it','speaking of which','not to mention','what is more','above all','in any case','after all','all in all','on top of that','let alone',"let's say",'so to speak','so far so good'];

const IDIOMS = ['piece of cake','once in a blue moon','bite the bullet','cost an arm and a leg','see eye to eye','under the weather','break a leg','hit the nail on the head','spill the beans','hit the sack','pull someone leg','on the fence','beat around the bush','the ball is in your court','bite off more than you can chew','burn bridges','catch someone off guard','cut corners','every cloud has a silver lining','face the music','get out of hand','get the ball rolling','give someone the benefit of the doubt','hit the ground running','jump on the bandwagon','kick the bucket','let the cat out of the bag','miss the boat','no pain no gain','once bitten twice shy','on the tip of my tongue','put your foot in it','saved by the bell','sit on the fence','speak of the devil','steal someone thunder','the last straw','throw in the towel','up in the air','wrap your head around','you can say that again','burning the midnight oil','in the same boat','kill two birds with one stone','under the radar','take the bull by the horns','bite the hand that feeds you','get off on the wrong foot','hit the books','go back to the drawing board'];

const PV = ['bring about','bring along','bring back','bring forward','bring in','bring on','bring out','bring up','build on','build up','call back','call for','call off','call on','call out','call up','calm down','carry on','carry out','catch on','catch up','check in','check out','clear up','come about','come across','come along','come back','come down','come forward','come in','come out','come up','come up with','count on','cut back','cut down','cut off','cut out','deal with','die down','drop in','drop off','drop out','end up','fall apart','fall back on','fall behind','fall for','fall out','fall through','figure out','fill in','fill out','find out','get along','get away','get back','get by','get down','get in','get off','get on','get out','get over','get through','get together','get up','give away','give back','give in','give out','give up','go ahead','go along with','go back','go by','go down','go for','go in for','go on','go out','go over','go through','go up','grow up','hand in','hand out','hang on','hang out','hang up','hold back','hold on','hold out','hold up','keep away','keep back','keep on','keep up','knock out','lay off','lead to','leave out','let down','let in','let off','let out','look after','look ahead','look back','look forward to','look into','look out','look over','look up','make out','make up','move on','move out','pay back','pay off','pick out','pick up','put away','put back','put down','put off','put on','put out','put up','run away','run into','run out of','see off','set off','set out','set up','show off','show up','shut down','sit back','slow down','sort out','speak up','stand by','stand for','stand out','stand up','stay in','stay out','step back','step up','take after','take away','take back','take off','take on','take out','take over','take up','think about','think of','think over','throw away','try on','try out','turn around','turn back','turn down','turn off','turn on','turn out','turn over','turn up','use up','wake up','watch out','wind up','work on','work out','write back','write off'];

const WORDS_BATCH3 = [
  ...DAILY_WORDS.map(w => ({ word: w, category: 'daily', categoryLabel: '\u2615 \u0110\u1eddi S\u1ed1ng & Ch\u00e0o H\u1ecfi', level: 'A2' })),
  ...PHRASES.map(w => ({ word: w, category: 'phrases', categoryLabel: '\ud83d\udcac C\u1ee5m T\u1eeb & Th\u00e0nh Ng\u1eef', level: 'B1' })),
  ...IDIOMS.map(w => ({ word: w, category: 'idioms', categoryLabel: '\ud83d\udca1 Idioms Giao Ti\u1ebfp', level: 'B2' })),
  ...PV.map(w => ({ word: w, category: 'phrasal-verbs', categoryLabel: '\ud83d\udd25 Phrasal Verbs', level: 'B1' })),
];

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function absoluteAudio(src) {
  if (!src) return null;
  return src.startsWith('/') ? `https://dictionary.cambridge.org${src}` : src;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function crawlCambridge(cleanWord) {
  const slug = cleanWord.replace(/\s+/g, '-');
  const url = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  if (!html.includes('dtrans') && !html.includes('ddef_d')) return null;

  const ipaMatch = html.match(/<span[^>]*class="[^"]*ipa dipa[^"]*"[^>]*>([^<]+)<\/span>/i);
  const ipa = ipaMatch ? `/${ipaMatch[1].trim()}/` : `/${cleanWord}/`;

  const posMatch = html.match(/<span[^>]*class="[^"]*pos dpos[^"]*"[^>]*>([^<]+)<\/span>/i);
  const partOfSpeech = posMatch ? posMatch[1].trim() : null;

  const audioMatch = html.match(/<source[^>]*type="audio\/mpeg"[^>]*src="([^"]+)"/i);
  const audioUrl = absoluteAudio(audioMatch ? audioMatch[1] : null);

  const viMatch = html.match(/<span[^>]*class="[^"]*trans dtrans[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  const meaningVi = viMatch ? stripTags(viMatch[1]) : '';

  const allViMatches = [...html.matchAll(/<span[^>]*class="[^"]*trans dtrans[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)];
  const allVi = allViMatches.map(m => stripTags(m[1])).filter(Boolean).slice(0, 3);

  const egMatches = [...html.matchAll(/<span[^>]*class="[^"]*eg deg[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)];
  const exampleSentences = egMatches.slice(0, 3).map(m => ({
    en: stripTags(m[1]),
    vi: 'Cambridge English-Vietnamese Dictionary',
    context: 'Cambridge Dictionary',
  }));

  const enDefMatch = html.match(/<div[^>]*class="[^"]*def ddef_d[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const detailedExplanation = enDefMatch ? stripTags(enDefMatch[1]) : `Key term: ${cleanWord}`;

  return {
    ipa, partOfSpeech, audioUrl,
    meaningVi: meaningVi || (allVi[0] ?? cleanWord),
    detailedExplanation, exampleSentences,
    collocations: allVi.length > 1 ? allVi.slice(1) : [],
    source: 'cambridge',
    cambridgeUrl: url,
  };
}

async function crawlFallback(cleanWord, item) {
  const [dictRes, transRes] = await Promise.allSettled([
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`).then(r => r.ok ? r.json() : null),
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`).then(r => r.ok ? r.json() : null),
  ]);
  const dict = dictRes.status === 'fulfilled' ? dictRes.value?.[0] : null;
  const viRaw = transRes.status === 'fulfilled' ? transRes.value?.responseData?.translatedText : null;
  const ipa = dict?.phonetic || dict?.phonetics?.find(p => p.text)?.text || `/${cleanWord}/`;
  const audioUrl = dict?.phonetics?.find(p => p.audio)?.audio || null;
  const partOfSpeech = dict?.meanings?.[0]?.partOfSpeech
    || (item.category === 'phrasal-verbs' ? 'phrasal verb'
      : item.category === 'idioms' ? 'idiom'
      : item.category === 'phrases' ? 'phrase' : 'word');
  const detailedExplanation = dict?.meanings?.[0]?.definitions?.[0]?.definition || `Common ${item.categoryLabel} expression.`;
  const meaningVi = viRaw || cleanWord;
  const exampleSentences = [{
    en: `"${cleanWord}" is commonly used in everyday English communication.`,
    vi: `"${cleanWord}" \u0111\u01b0\u1ee3c d\u00f9ng trong giao ti\u1ebfp ti\u1ebfng Anh h\u00e0ng ng\u00e0y.`,
    context: 'General',
  }];
  return { ipa, partOfSpeech, audioUrl, meaningVi, detailedExplanation, exampleSentences,
    collocations: [], source: 'fallback_api',
    cambridgeUrl: `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(cleanWord.replace(/\s+/g, '-'))}` };
}

async function crawlWord(item) {
  const cleanWord = item.word.toLowerCase().trim();
  const cached = db.prepare('SELECT data_json FROM dictionary_cache WHERE word = ?').get(cleanWord);
  if (cached) {
    try {
      const data = JSON.parse(cached.data_json);
      return { ...item, ...data, word: item.word, fromCache: true };
    } catch {}
  }
  let result = null;
  try { result = await crawlCambridge(cleanWord); } catch {}
  if (!result) {
    try { result = await crawlFallback(cleanWord, item); } catch { return null; }
  }
  db.prepare('INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(cleanWord, JSON.stringify(result));
  return { ...item, ...result, word: item.word, fromCache: false };
}

async function run() {
  const total = WORDS_BATCH3.length;
  console.log(`\n\ud83d\ude80 B\u1eaft \u0111\u1ea7u crawl ${total} t\u1eeb/c\u1ee5m t\u1eeb (Batch 3)...\n`);
  const results = [];
  let successCount = 0, cacheCount = 0;
  for (let i = 0; i < WORDS_BATCH3.length; i++) {
    const item = WORDS_BATCH3[i];
    process.stdout.write(`[${String(i + 1).padStart(3)}/${total}] ${item.word.padEnd(40)} `);
    const res = await crawlWord(item);
    if (res) {
      results.push(res);
      successCount++;
      if (res.fromCache) cacheCount++;
      const srcLabel = res.fromCache ? 'CACHE  ' : (res.source === 'cambridge' ? 'CAMB   ' : 'FALLBCK');
      console.log(`\u2705 ${srcLabel}  ${res.ipa || ''}`);
    } else {
      console.log('\u274c SKIP');
    }
    await delay(80);
  }
  console.log(`\n\ud83c\udf89 Xong! ${successCount}/${total} t\u1eeb th\u00e0nh c\u00f4ng (${cacheCount} t\u1eeb cache).\n`);

  const entries = results.map((r) => {
    const rawExamples = Array.isArray(r.exampleSentences) ? r.exampleSentences : [];
    const examples = rawExamples.length > 0 ? rawExamples : [{
      en: `"${r.word}" is frequently used in ${r.categoryLabel} contexts.`,
      vi: `"${r.word}" th\u01b0\u1eddng \u0111\u01b0\u1ee3c d\u00f9ng trong c\u00e1c ng\u1eef c\u1ea3nh ${r.categoryLabel}.`,
      context: r.categoryLabel,
    }];
    const collocations = Array.isArray(r.collocations) && r.collocations.length > 0
      ? r.collocations : [`${r.word} (usage)`, `common ${r.category}`, 'everyday English'];
    return {
      word: r.word, category: r.category, categoryLabel: r.categoryLabel,
      level: r.level || 'B1',
      ipa: r.ipa || `/${r.word}/`,
      partOfSpeech: r.partOfSpeech || (r.category === 'phrasal-verbs' ? 'phrasal verb' : r.category === 'idioms' ? 'idiom' : r.category === 'phrases' ? 'phrase' : 'word'),
      meaningVi: r.meaningVi || r.word,
      detailedExplanation: r.detailedExplanation || `Key term in ${r.categoryLabel}`,
      exampleSentences: examples,
      audioUrl: r.audioUrl || null,
      collocations,
    };
  });

  const outPath = path.join(projectRoot, 'scripts', 'results_batch3.json');
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), 'utf-8');
  console.log(`\ud83d\udcc4 \u0110\u00e3 ghi ${entries.length} m\u1ee5c ra: scripts/results_batch3.json`);
  console.log(`\n\ud83d\udcca T\u1ed5ng k\u1ebft:`);
  console.log(`   \u2022 T\u1ed5ng t\u1eeb crawl th\u00e0nh c\u00f4ng : ${successCount}`);
  console.log(`   \u2022 L\u1ea5y t\u1eeb cache SQLite       : ${cacheCount}`);
  console.log(`   \u2022 Crawl m\u1edbi t\u1eeb internet     : ${successCount - cacheCount}`);
  console.log(`   \u2022 File k\u1ebft qu\u1ea3              : scripts/results_batch3.json\n`);
}

run().catch(console.error);

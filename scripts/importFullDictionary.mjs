import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'data', 'english_learning.db');
const db = new Database(dbPath);

console.log('📖 Đang chuẩn bị nạp cơ sở dữ liệu từ điển 25.000+ từ vựng...');

// 1. Tạo bảng dictionary_cache, dictionary_entries, và FTS5
db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary_cache (
    word TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dictionary_entries (
    word TEXT PRIMARY KEY,
    ipa TEXT,
    part_of_speech TEXT,
    category TEXT,
    category_label TEXT,
    level TEXT,
    meaning_vi TEXT,
    detailed_explanation TEXT,
    examples_json TEXT,
    collocations_json TEXT,
    audio_url TEXT,
    data_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_entries_category ON dictionary_entries(category);
  CREATE INDEX IF NOT EXISTS idx_entries_level ON dictionary_entries(level);
  CREATE INDEX IF NOT EXISTS idx_entries_word ON dictionary_entries(word);

  DROP TABLE IF EXISTS dictionary_fts;
  CREATE VIRTUAL TABLE dictionary_fts USING fts5(
    word,
    meaning_vi,
    content='dictionary_entries',
    content_rowid='rowid'
  );
`);

// 2. Đọc danh sách 20k tần suất cao từ Google
const path20k = path.join(projectRoot, 'data', '20k.txt');
const text20k = fs.readFileSync(path20k, 'utf-8');
const words20k = text20k.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean);
const rankMap = new Map();
words20k.forEach((w, idx) => {
  rankMap.set(w, idx + 1);
});

// 3. Đọc từ điển Anh - Việt 109k
const pathDict = path.join(projectRoot, 'data', 'anhviet109K.txt');
const textDict = fs.readFileSync(pathDict, 'utf-8');
const lines = textDict.split('\n');

console.log(`Đã nạp file nguồn: 20k list (${words20k.length} từ), từ điển gốc 109k lines (${lines.length} dòng)`);

// 4. Danh sách từ khóa chuyên biệt theo ngành
const itKeywords = new Set([
  'algorithm', 'api', 'app', 'application', 'array', 'async', 'asynchronous', 'backend', 'frontend',
  'bandwidth', 'binary', 'bit', 'byte', 'block', 'boolean', 'buffer', 'bug', 'build', 'byte', 'cache',
  'client', 'cloud', 'cluster', 'code', 'compiler', 'component', 'concurrency', 'container', 'controller',
  'core', 'crypto', 'cryptography', 'daemon', 'data', 'database', 'deadlock', 'debug', 'debugger',
  'declaration', 'dependency', 'deploy', 'deployment', 'devops', 'directory', 'disk', 'docker', 'domain',
  'driver', 'dynamic', 'encryption', 'endpoint', 'engine', 'entity', 'error', 'event', 'exception',
  'execution', 'expression', 'failover', 'field', 'file', 'filter', 'firewall', 'folder', 'fork',
  'framework', 'function', 'gateway', 'git', 'global', 'graph', 'handler', 'hardware', 'hash', 'header',
  'heap', 'hook', 'host', 'hostname', 'html', 'http', 'https', 'hyperlink', 'index', 'inheritance',
  'input', 'instance', 'instruction', 'integer', 'interface', 'internet', 'interpreter', 'ip', 'iteration',
  'json', 'kernel', 'keyboard', 'latency', 'library', 'lifecycle', 'link', 'linux', 'list', 'load',
  'local', 'lock', 'log', 'logging', 'loop', 'macro', 'malware', 'memory', 'message', 'method',
  'microservice', 'middleware', 'migration', 'module', 'monitor', 'multithreading', 'mutation', 'namespace',
  'network', 'node', 'null', 'object', 'operation', 'operator', 'optimization', 'orchestration', 'output',
  'package', 'packet', 'page', 'parameter', 'parser', 'parsing', 'partition', 'patch', 'path', 'payload',
  'pipeline', 'platform', 'plugin', 'pointer', 'polymorphism', 'port', 'process', 'processor', 'program',
  'protocol', 'proxy', 'query', 'queue', 'ram', 'recursion', 'redirect', 'refactor', 'regex', 'register',
  'registry', 'release', 'render', 'repository', 'request', 'response', 'rest', 'rollback', 'router',
  'routing', 'runtime', 'scalability', 'schema', 'scope', 'script', 'sdk', 'security', 'semaphore',
  'server', 'service', 'session', 'sharding', 'shell', 'signal', 'singleton', 'socket', 'software',
  'source', 'spam', 'sql', 'ssh', 'ssl', 'stack', 'statement', 'static', 'storage', 'stream', 'string',
  'structure', 'subnet', 'synchronous', 'syntax', 'system', 'table', 'tag', 'task', 'tcp', 'template',
  'terminal', 'test', 'thread', 'throughput', 'timeout', 'tls', 'token', 'trace', 'transaction',
  'trigger', 'type', 'udp', 'ui', 'unix', 'update', 'upload', 'uri', 'url', 'user', 'validation',
  'variable', 'version', 'virtual', 'virtualization', 'vulnerability', 'web', 'webhook', 'websocket',
  'window', 'workflow', 'xml', 'zip'
]);

const scrumKeywords = new Set([
  'agile', 'backlog', 'blocker', 'burndown', 'ceremony', 'commitment', 'deliverable', 'demo', 'epic',
  'estimate', 'estimation', 'facilitator', 'feedback', 'increment', 'iteration', 'kanban', 'lean',
  'milestone', 'mvp', 'obstacle', 'poker', 'prioritization', 'refinement', 'release', 'retrospective',
  'roadmap', 'scrum', 'scrummaster', 'sprint', 'stakeholder', 'standup', 'story', 'velocity', 'workaround'
]);

const businessKeywords = new Set([
  'accommodate', 'accounting', 'acquisition', 'adjacent', 'advertisement', 'agenda', 'allocation',
  'allowance', 'annual', 'applicant', 'appraisal', 'approval', 'audit', 'authorization', 'bankrupt',
  'bankruptcy', 'benchmark', 'beneficiary', 'bid', 'billing', 'bonus', 'branch', 'brand', 'briefing',
  'broker', 'budget', 'bulletin', 'campaign', 'capital', 'career', 'carrier', 'cartel', 'cashier',
  'ceo', 'cfo', 'chairman', 'collaboration', 'collateral', 'colleague', 'commence', 'commerce',
  'commercial', 'commission', 'commodity', 'compensation', 'competitor', 'compliance', 'comply',
  'compromise', 'concession', 'conference', 'confidential', 'conglomerate', 'consensus', 'consignment',
  'consumer', 'contingency', 'contract', 'cooperation', 'corporate', 'corporation', 'cost', 'counsel',
  'coupon', 'credential', 'credit', 'currency', 'customer', 'deadline', 'deal', 'dealer', 'debit',
  'debt', 'debtor', 'deduction', 'deficit', 'delegate', 'delegation', 'delivery', 'depreciation',
  'director', 'discount', 'discrepancy', 'dividend', 'downsizing', 'duty', 'earnings', 'eligible',
  'embargo', 'employee', 'employer', 'employment', 'endorse', 'enterprise', 'entrepreneur', 'equity',
  'estimate', 'executive', 'expenditure', 'expense', 'feasible', 'finance', 'financial', 'fiscal',
  'fluctuation', 'forecast', 'franchise', 'fund', 'goodwill', 'gross', 'headquarters', 'hierarchy',
  'incentive', 'income', 'incorporate', 'indemnity', 'inflation', 'infrastructure', 'initiative',
  'insolvency', 'installment', 'insurance', 'interest', 'inventory', 'investment', 'investor',
  'invoice', 'joint-venture', 'leadership', 'lease', 'ledger', 'liability', 'liaison', 'liquidation',
  'logistics', 'lucrative', 'management', 'manager', 'mandatory', 'margin', 'market', 'merchandise',
  'merger', 'monopoly', 'mortgage', 'negotiate', 'negotiation', 'net', 'niche', 'nomination',
  'obligation', 'occupant', 'occupation', 'offshore', 'onboarding', 'operating', 'operations',
  'outsource', 'outsourcing', 'overdue', 'overhead', 'oversee', 'partnership', 'patent', 'payroll',
  'pension', 'perk', 'personnel', 'petition', 'portfolio', 'postpone', 'precaution', 'premium',
  'prerequisite', 'privatization', 'procurement', 'productivity', 'profit', 'profitability', 'promotion',
  'proposal', 'prospectus', 'provision', 'purchase', 'purchaser', 'qualification', 'quarterly', 'quota',
  'quotation', 'rebate', 'receipt', 'recession', 'recruit', 'recruitment', 'redundancy', 'refund',
  'reimburse', 'reimbursement', 'reorganization', 'restructure', 'retail', 'retainer', 'revenue',
  'salary', 'sales', 'sanction', 'shareholder', 'shipment', 'stakeholder', 'stipend', 'stock',
  'stockholder', 'strategy', 'streamline', 'subsidiary', 'subsidize', 'subsidy', 'supplier', 'surplus',
  'takeover', 'tariff', 'tax', 'taxation', 'tenant', 'tentative', 'terminate', 'termination', 'transaction',
  'transfer', 'turnover', 'unanimous', 'underwrite', 'unemployment', 'union', 'valuation', 'venture',
  'viability', 'voucher', 'wage', 'waiver', 'warranty', 'wholesale', 'workforce', 'workload', 'yield'
]);

// 5. Parse dictionary lines into clean structured map
const dictMap = new Map();
let curWord = null;
let curIpa = '';
let curPos = '';
let curMeanings = [];
let curExamples = [];

function finalizeCur() {
  if (curWord && curMeanings.length > 0) {
    if (!dictMap.has(curWord)) {
      dictMap.set(curWord, {
        word: curWord,
        ipa: curIpa || `/${curWord}/`,
        pos: curPos || 'noun',
        meanings: curMeanings.slice(0, 4),
        examples: curExamples.slice(0, 3)
      });
    }
  }
}

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith('@')) {
    finalizeCur();
    const slashIdx = l.indexOf('/');
    curWord = (slashIdx !== -1 ? l.slice(1, slashIdx) : l.slice(1)).trim().toLowerCase();
    curIpa = slashIdx !== -1 ? l.slice(slashIdx).trim() : '';
    curPos = '';
    curMeanings = [];
    curExamples = [];
  } else if (l.startsWith('*')) {
    curPos = l.replace(/^\*\s*/, '').trim();
  } else if (l.startsWith('-')) {
    const m = l.replace(/^-\s*/, '').trim();
    if (m && m.length > 1) curMeanings.push(m);
  } else if (l.startsWith('=')) {
    const parts = l.replace(/^=\s*/, '').split('+');
    if (parts[0] && parts[1]) {
      curExamples.push({
        en: parts[0].trim(),
        vi: parts[1].trim()
      });
    }
  }
}
finalizeCur();

console.log(`Đã bóc tách thành công ${dictMap.size} mục từ trong từ điển gốc.`);

// 6. Tuyển chọn 26.000 từ vựng tối ưu nhất
const selectedEntries = [];
const seenWords = new Set();

function normalizePos(raw) {
  const p = (raw || '').toLowerCase();
  if (p.includes('danh từ')) return 'noun';
  if (p.includes('động từ') || p.includes('nội động') || p.includes('ngoại động')) return 'verb';
  if (p.includes('tính từ')) return 'adjective';
  if (p.includes('phó từ') || p.includes('trạng từ')) return 'adverb';
  if (p.includes('giới từ')) return 'preposition';
  if (p.includes('liên từ')) return 'conjunction';
  if (p.includes('thán từ')) return 'interjection';
  if (p.includes('mạo từ')) return 'article';
  return 'word';
}

function classifyWord(word, data, rank) {
  const w = word.toLowerCase();
  const meaningsText = data.meanings.join(' ').toLowerCase();

  // IT Scrum & Agile
  if (scrumKeywords.has(w)) {
    return { category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile' };
  }

  // IT Architecture & Dev
  if (itKeywords.has(w) || meaningsText.includes('(tin học)') || meaningsText.includes('(điện toán)')) {
    if (w.includes('net') || w.includes('cloud') || w.includes('server') || w.includes('cluster') || w.includes('proxy') || w.includes('mesh')) {
      return { category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc' };
    }
    return { category: 'it-dev', categoryLabel: '💻 IT: Code & Dev' };
  }

  // Business & TOEIC
  if (businessKeywords.has(w) || meaningsText.includes('(thương nghiệp)') || meaningsText.includes('(kinh tế)') || meaningsText.includes('(tài chính)')) {
    return { category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC' };
  }

  // Workplace communication
  if (w.includes('meet') || w.includes('report') || w.includes('work') || w.includes('office') || w.includes('staff')) {
    return { category: 'workplace', categoryLabel: '💼 Công Sở & Họp' };
  }

  // Phrasal Verbs
  if (w.includes(' ') && (w.includes(' up') || w.includes(' out') || w.includes(' in') || w.includes(' off') || w.includes(' down') || w.includes(' on') || w.includes(' for'))) {
    return { category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs' };
  }

  // Idioms
  if (w.includes(' ') && w.split(' ').length >= 3) {
    return { category: 'idioms', categoryLabel: '💡 Idioms Giao Tiếp' };
  }

  // VSTEP Academic
  if (rank > 6000 || w.endsWith('tion') || w.endsWith('ment') || w.endsWith('able') || w.endsWith('ible') || w.endsWith('ence') || w.endsWith('ance') || w.endsWith('ology')) {
    return { category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP' };
  }

  // Daily Communication
  return { category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi' };
}

function determineLevel(rank) {
  if (!rank || rank <= 1200) return 'A1';
  if (rank <= 3500) return 'A2';
  if (rank <= 8500) return 'B1';
  if (rank <= 17000) return 'B2';
  return 'C1';
}

// 6.1 Lấy toàn bộ từ thuộc 20k Google frequency list
for (const w of words20k) {
  if (dictMap.has(w) && !seenWords.has(w)) {
    const raw = dictMap.get(w);
    const rank = rankMap.get(w) || 99999;
    const catInfo = classifyWord(w, raw, rank);
    const level = determineLevel(rank);
    const pos = normalizePos(raw.pos);

    seenWords.add(w);
    selectedEntries.push({
      word: w,
      ipa: raw.ipa,
      partOfSpeech: pos,
      category: catInfo.category,
      categoryLabel: catInfo.categoryLabel,
      level,
      meaningVi: raw.meanings[0] || w,
      detailedExplanation: raw.meanings.join('; '),
      examples: raw.examples.length > 0 ? raw.examples : [
        { en: `We often encounter '${w}' in communication.`, vi: `Chúng ta thường gặp từ '${w}' trong giao tiếp.` }
      ],
      audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w)}&type=2`,
      // KHÔNG sinh collocations từ template: `common X` / `X in context` /
      // `use X` là placeholder vô nghĩa (hiển thị dính chữ trong UI và làm mất
      // uy tín từ điển). Nguồn Cambridge không có collocations nên để rỗng —
      // UI đã ẩn khi rỗng.
      collocations: []
    });
  }
}

console.log(`Đã thu thập ${selectedEntries.length} từ phổ biến theo danh sách 20k.`);

// 6.2 Thêm các từ còn lại trong từ điển để đạt mốc 26.000 từ chất lượng
for (const [w, raw] of dictMap.entries()) {
  if (selectedEntries.length >= 26500) break;
  if (!seenWords.has(w) && /^[a-z]+(-[a-z]+)*$/.test(w) && w.length >= 2 && w.length <= 18) {
    seenWords.add(w);
    const rank = rankMap.get(w) || 20000;
    const catInfo = classifyWord(w, raw, rank);
    const level = determineLevel(rank);
    const pos = normalizePos(raw.pos);

    selectedEntries.push({
      word: w,
      ipa: raw.ipa,
      partOfSpeech: pos,
      category: catInfo.category,
      categoryLabel: catInfo.categoryLabel,
      level,
      meaningVi: raw.meanings[0] || w,
      detailedExplanation: raw.meanings.join('; '),
      examples: raw.examples.length > 0 ? raw.examples : [
        { en: `We often encounter '${w}' in communication.`, vi: `Chúng ta thường gặp từ '${w}' trong giao tiếp.` }
      ],
      audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w)}&type=2`,
      // Xem giải thích ở khối trên: không sinh collocations từ template.
      collocations: []
    });
  }
}

console.log(`🎯 Tổng số lượng từ vựng sẵn sàng nạp vào SQLite: ${selectedEntries.length} từ!`);

// 7. Thực hiện nạp hàng loạt vào SQLite qua Transaction (cực nhanh < 2 giây)
const insertCache = db.prepare(`
  INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
`);

const insertEntry = db.prepare(`
  INSERT OR REPLACE INTO dictionary_entries (
    word, ipa, part_of_speech, category, category_label, level,
    meaning_vi, detailed_explanation, examples_json, collocations_json,
    audio_url, data_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertFts = db.prepare(`
  INSERT INTO dictionary_fts (rowid, word, meaning_vi)
  SELECT rowid, word, meaning_vi FROM dictionary_entries WHERE word = ?
`);

console.log('⚡ Đang thực thi SQLite Transaction...');
const insertAll = db.transaction((entries) => {
  for (const item of entries) {
    const jsonStr = JSON.stringify({
      word: item.word,
      ipa: item.ipa,
      partOfSpeech: item.partOfSpeech,
      category: item.category,
      categoryLabel: item.categoryLabel,
      level: item.level,
      meaningVi: item.meaningVi,
      detailedExplanation: item.detailedExplanation,
      senses: [
        {
          enDef: item.detailedExplanation,
          viTrans: item.meaningVi,
          examples: item.examples.map(e => e.en)
        }
      ],
      exampleSentences: item.examples.map(e => ({ en: e.en, vi: e.vi, context: item.categoryLabel })),
      audioUrl: item.audioUrl,
      source: 'anhviet_master_25k'
    });

    insertCache.run(item.word, jsonStr);
    insertEntry.run(
      item.word,
      item.ipa,
      item.partOfSpeech,
      item.category,
      item.categoryLabel,
      item.level,
      item.meaningVi,
      item.detailedExplanation,
      JSON.stringify(item.examples),
      JSON.stringify(item.collocations),
      item.audioUrl,
      jsonStr
    );
    try {
      insertFts.run(item.word);
    } catch {}
  }
});

insertAll(selectedEntries);

console.log(`✅ Thành công! Đã nạp trọn vẹn ${selectedEntries.length} từ vào SQLite cache và FTS index!`);

// 8. Tạo dataset Showcase (~600 từ tiêu biểu đa dạng ngành) cho client bundle siêu nhẹ
const showcaseEntries = [];
const categoryCounts = {};

for (const item of selectedEntries) {
  const cat = item.category;
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  if (categoryCounts[cat] <= 70) {
    showcaseEntries.push({
      id: `enc-${item.word}`,
      word: item.word,
      ipa: item.ipa,
      partOfSpeech: item.partOfSpeech,
      category: item.category,
      categoryLabel: item.categoryLabel,
      meaningVi: item.meaningVi,
      detailedExplanation: item.detailedExplanation,
      collocations: item.collocations,
      exampleSentences: item.examples.map(e => ({ en: e.en, vi: e.vi, context: item.categoryLabel })),
      level: item.level,
      audioUrl: item.audioUrl
    });
  }
}

const encyclopediaTsContent = `export interface EncyclopediaEntry {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  category: 'it-dev' | 'it-scrum' | 'it-arch' | 'toeic' | 'vstep' | 'workplace' | 'daily' | 'phrasal-verbs' | 'idioms' | 'online' | string;
  categoryLabel: string;
  meaningVi: string;
  detailedExplanation: string;
  collocations: string[];
  synonyms?: string[];
  antonyms?: string[];
  exampleSentences: {
    en: string;
    vi: string;
    context: string;
  }[];
  proTips?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | string;
  audioUrl?: string | null;
}

export const ENCYCLOPEDIA_DATA: EncyclopediaEntry[] = ${JSON.stringify(showcaseEntries, null, 2)};
`;

fs.writeFileSync(path.join(projectRoot, 'src', 'lib', 'data', 'encyclopedia.ts'), encyclopediaTsContent, 'utf-8');
console.log(`📚 Đã cập nhật file src/lib/data/encyclopedia.ts với ${showcaseEntries.length} mục từ showcase siêu tốc!`);

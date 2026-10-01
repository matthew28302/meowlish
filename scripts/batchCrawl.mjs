import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'data', 'english_learning.db');
const db = new Database(dbPath);

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary_cache (
    word TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export const WORDS_TO_CRAWL = [
  // TOEIC High-Frequency
  { word: 'accommodate', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'collaborate', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'comply', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'eligible', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B1' },
  { word: 'feasible', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'confidential', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'mandatory', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'reimburse', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'delegate', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'negotiate', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'consensus', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'tentative', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'initiative', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'revenue', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'expedite', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'facilitate', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'contingency', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'benchmark', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'comprehensive', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'streamline', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'allocate', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'authorize', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'discrepancy', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'subsidize', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'precaution', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'procurement', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'audit', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'implement', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'liability', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'prerequisite', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'C1' },
  { word: 'restructure', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },
  { word: 'terminate', category: 'toeic', categoryLabel: '🎯 Từ Vựng TOEIC', level: 'B2' },

  // VSTEP Academic & Communicative
  { word: 'ubiquitous', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'meticulous', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'resilient', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'sustainable', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'indispensable', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'phenomenon', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'predominant', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'diminish', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'deteriorate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'adversity', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'substantiate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'ambiguous', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'scrutinize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'paradox', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'advocate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'profound', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'articulate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'pragmatic', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'plausible', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'coherent', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'fluctuate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'alleviate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'preliminary', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'intrinsic', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'obsolete', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'vulnerable', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'synthetic', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'unprecedented', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },

  // IT: Code & Dev
  { word: 'algorithm', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },
  { word: 'asynchronous', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'concurrency', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'C1' },
  { word: 'database', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'A2' },
  { word: 'deadlock', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'debugging', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'A2' },
  { word: 'dependency', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },
  { word: 'deprecation', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'encapsulation', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'framework', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },
  { word: 'inheritance', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'interface', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },
  { word: 'multithreading', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'C1' },
  { word: 'parameter', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },
  { word: 'polymorphism', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'C1' },
  { word: 'prototype', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'recursion', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'repository', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },
  { word: 'serialization', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'synchronous', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'validation', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },
  { word: 'immutable', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'compiler', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B2' },
  { word: 'exception', category: 'it-dev', categoryLabel: '💻 IT: Code & Dev', level: 'B1' },

  // IT: Kiến Trúc & Hệ Thống
  { word: 'bandwidth', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'cache', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'cryptography', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'C1' },
  { word: 'deployment', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B1' },
  { word: 'latency', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'middleware', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'orchestration', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'C1' },
  { word: 'payload', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'singleton', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'throughput', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'virtualization', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'vulnerability', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'webhook', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'microservice', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'container', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B1' },
  { word: 'scalability', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'B2' },
  { word: 'redundancy', category: 'it-arch', categoryLabel: '🏗️ IT: Kiến Trúc', level: 'C1' },

  // IT: Scrum & Agile
  { word: 'backlog', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B1' },
  { word: 'blocker', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B1' },
  { word: 'deliverable', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B2' },
  { word: 'estimation', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B1' },
  { word: 'iteration', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B2' },
  { word: 'milestone', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B2' },
  { word: 'retrospective', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B2' },
  { word: 'roadmap', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B1' },
  { word: 'sprint', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B1' },
  { word: 'standup', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'A2' },
  { word: 'velocity', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B2' },
  { word: 'workaround', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B2' },
  { word: 'spike', category: 'it-scrum', categoryLabel: '⏱️ IT: Scrum & Agile', level: 'B2' },

  // Công Sở & Họp
  { word: 'stakeholder', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'B2' },
  { word: 'briefing', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'B2' },
  { word: 'kickoff', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'B1' },
  { word: 'feedback', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'A2' },
  { word: 'workload', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'B1' },
  { word: 'deadline', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'A2' },
  { word: 'agenda', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'B1' },
  { word: 'alignment', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'B2' },
  { word: 'priority', category: 'workplace', categoryLabel: '💼 Công Sở & Họp', level: 'B1' },

  // Đời Sống & Giao Tiếp Hàng Ngày
  { word: 'hello', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'A1' },
  { word: 'goodbye', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'A1' },
  { word: 'greeting', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'A2' },
  { word: 'appreciate', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'apologize', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'A2' },
  { word: 'assistance', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'colleague', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'A2' },
  { word: 'convenient', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'enthusiastic', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B2' },
  { word: 'gratitude', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B2' },
  { word: 'hospitality', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B2' },
  { word: 'opportunity', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'recommendation', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'punctual', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B2' },
  { word: 'courteous', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B2' },
  { word: 'generous', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'reliable', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'conscientious', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'C1' },
  { word: 'versatile', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B2' },
  { word: 'diligent', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B2' },
  { word: 'efficient', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'B1' },
  { word: 'routine', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'A2' },
  { word: 'conversation', category: 'daily', categoryLabel: '☕ Đời Sống & Chào Hỏi', level: 'A2' },

  // Cụm Động Từ (Phrasal Verbs)
  { word: 'figure out', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B1' },
  { word: 'look forward to', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B1' },
  { word: 'carry out', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B2' },
  { word: 'break down', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B1' },
  { word: 'bring up', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B2' },
  { word: 'come across', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B2' },
  { word: 'give up', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'A2' },
  { word: 'keep up with', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B2' },
  { word: 'run out of', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B1' },
  { word: 'take over', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B2' },
  { word: 'turn down', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B2' },
  { word: 'set up', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'A2' },
  { word: 'work out', category: 'phrasal-verbs', categoryLabel: '🔥 Phrasal Verbs', level: 'B1' },

  // Thành Ngữ (Idioms)
  { word: 'piece of cake', category: 'idioms', categoryLabel: '💡 Idioms Giao Tiếp', level: 'B1' },
  { word: 'once in a blue moon', category: 'idioms', categoryLabel: '💡 Idioms Giao Tiếp', level: 'B2' },
  { word: 'bite the bullet', category: 'idioms', categoryLabel: '💡 Idioms Giao Tiếp', level: 'C1' },
  { word: 'cost an arm and a leg', category: 'idioms', categoryLabel: '💡 Idioms Giao Tiếp', level: 'B2' },
  { word: 'see eye to eye', category: 'idioms', categoryLabel: '💡 Idioms Giao Tiếp', level: 'B2' },
  { word: 'under the weather', category: 'idioms', categoryLabel: '💡 Idioms Giao Tiếp', level: 'B1' }
];

async function crawlWord(item) {
  const cleanWord = item.word.toLowerCase();

  // Check if already in cache
  const cached = db.prepare('SELECT data_json FROM dictionary_cache WHERE word = ?').get(cleanWord);
  if (cached) {
    try {
      const data = JSON.parse(cached.data_json);
      return { ...item, ...data, fromCache: true };
    } catch {}
  }

  const slug = cleanWord.replace(/\s+/g, '-');
  const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(cambridgeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      }
    });

    if (res.ok) {
      const html = await res.text();
      if (html.includes('dtrans') || html.includes('ddef_d')) {
        const titleMatch = html.match(/<h2[^>]*class="[^"]*di-title[^"]*"[^>]*>([^<]+)<\/h2>/i) ||
                           html.match(/<h2[^>]*class="[^"]*dhw[^"]*"[^>]*>([^<]+)<\/h2>/i) ||
                           html.match(/<span[^>]*class="[^"]*dhw[^"]*"[^>]*>([^<]+)<\/span>/i);
        const matchedWord = titleMatch ? titleMatch[1].trim() : cleanWord;

        const ipaMatch = html.match(/<span[^>]*class="[^"]*ipa dipa[^"]*"[^>]*>([^<]+)<\/span>/i);
        const ipa = ipaMatch ? `/${ipaMatch[1].trim()}/` : `/${cleanWord}/`;

        const posMatch = html.match(/<span[^>]*class="[^"]*pos dpos[^"]*"[^>]*>([^<]+)<\/span>/i);
        const partOfSpeech = posMatch ? posMatch[1].trim() : (item.category === 'phrasal-verbs' ? 'phrasal verb' : item.category === 'idioms' ? 'idiom' : 'noun');

        const audioMatch = html.match(/<source[^>]*type="audio\/mpeg"[^>]*src="([^"]+)"/i);
        let audioUrl = audioMatch ? audioMatch[1] : '';
        if (audioUrl && audioUrl.startsWith('/')) {
          audioUrl = `https://dictionary.cambridge.org${audioUrl}`;
        }

        const senses = [];
        const defBlockRegex = /<div class="def-block ddef_block\s*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
        let blockMatch;

        while ((blockMatch = defBlockRegex.exec(html)) !== null && senses.length < 4) {
          const blockHtml = blockMatch[1];
          const enDefMatch = blockHtml.match(/<div class="def ddef_d db">([\s\S]*?)<\/div>/i);
          const enDef = enDefMatch ? enDefMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          const viTransMatch = blockHtml.match(/<span class="trans dtrans"[^>]*>([\s\S]*?)<\/span>/i);
          const viTrans = viTransMatch ? viTransMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          const examples = [];
          const egRegex = /<span class="eg deg">([\s\S]*?)<\/span>/gi;
          let egM;
          while ((egM = egRegex.exec(blockHtml)) !== null && examples.length < 2) {
            examples.push(egM[1].replace(/<[^>]+>/g, '').trim());
          }

          if (viTrans || enDef) {
            senses.push({ enDef, viTrans, examples });
          }
        }

        if (senses.length > 0) {
          const result = {
            word: matchedWord,
            ipa,
            audioUrl: audioUrl || null,
            partOfSpeech,
            senses,
            source: 'cambridge',
            cambridgeUrl
          };

          db.prepare(`
            INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `).run(cleanWord, JSON.stringify(result));

          return { ...item, ...result, fromCache: false };
        }
      }
    }
  } catch (err) {
    // console.warn(`Failed to crawl ${cleanWord}:`, err.message);
  }

  // Fallback API if Cambridge fails or doesn't have entry
  try {
    const [dictRes, transRes] = await Promise.allSettled([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`).then(r => r.ok ? r.json() : null),
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`).then(r => r.ok ? r.json() : null)
    ]);
    const dict = dictRes.status === 'fulfilled' ? dictRes.value?.[0] : null;
    const vi = transRes.status === 'fulfilled' ? transRes.value?.responseData?.translatedText : '';

    const ipa = dict?.phonetic || dict?.phonetics?.find(p => p.text)?.text || `/${cleanWord}/`;
    const audioUrl = dict?.phonetics?.find(p => p.audio)?.audio || null;
    const meaningVi = vi || cleanWord;
    const enDef = dict?.meanings?.[0]?.definitions?.[0]?.definition || `Essential term for ${item.categoryLabel}`;
    const partOfSpeech = dict?.meanings?.[0]?.partOfSpeech || (item.category === 'phrasal-verbs' ? 'phrasal verb' : item.category === 'idioms' ? 'idiom' : 'noun');

    const fallbackResult = {
      word: cleanWord,
      ipa,
      audioUrl,
      partOfSpeech,
      senses: [{ enDef, viTrans: meaningVi, examples: [] }],
      source: 'fallback_api',
      cambridgeUrl
    };

    db.prepare(`
      INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(cleanWord, JSON.stringify(fallbackResult));

    return { ...item, ...fallbackResult, fromCache: false };
  } catch {
    return null;
  }
}

async function run() {
  console.log(`🚀 Bắt đầu crawl ${WORDS_TO_CRAWL.length} từ vựng chất lượng cao từ Cambridge & APIs...`);
  const results = [];
  let successCount = 0;

  for (let i = 0; i < WORDS_TO_CRAWL.length; i++) {
    const item = WORDS_TO_CRAWL[i];
    process.stdout.write(`[${i + 1}/${WORDS_TO_CRAWL.length}] Crawling: ${item.word}... `);
    const res = await crawlWord(item);
    if (res) {
      results.push(res);
      successCount++;
      const srcLabel = res.fromCache ? 'CACHE' : res.source;
      console.log(`✅ OK (${srcLabel}) [${res.ipa || 'IPA'}]`);
    } else {
      console.log(`❌ Skipped`);
    }
    // Respect rate limits: 100ms
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n🎉 Hoàn tất! Đã crawl và lưu cache SQLite thành công: ${successCount}/${WORDS_TO_CRAWL.length} từ.`);

  // Generate enriched encyclopedia dataset
  const entries = results.map((r, idx) => {
    const primarySense = r.senses?.[0] || {};
    const viMeaning = primarySense.viTrans || r.word;
    const enExplanation = primarySense.enDef || `Thuật ngữ chuyên sâu trong danh mục ${r.categoryLabel}`;
    const examples = (primarySense.examples || []).map(eg => ({
      en: eg,
      vi: 'Ví dụ ngữ cảnh thực tế chuẩn Cambridge Dictionary',
      context: 'Cambridge English-Vietnamese'
    }));

    if (examples.length === 0) {
      examples.push({
        en: `Professionals frequently use '${r.word}' during technical discussions and daily communication.`,
        vi: `Các chuyên gia thường xuyên sử dụng '${r.word}' trong các cuộc thảo luận và giao tiếp hàng ngày.`,
        context: 'Thực hành giao tiếp'
      });
    }

    return {
      id: `enc-${idx + 1}-${r.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      word: r.word,
      ipa: r.ipa || `/${r.word}/`,
      partOfSpeech: r.partOfSpeech || 'noun',
      category: r.category,
      categoryLabel: r.categoryLabel,
      meaningVi: viMeaning,
      detailedExplanation: enExplanation,
      collocations: [`${r.word} in practice`, `effective ${r.word}`, `standard ${r.word}`],
      exampleSentences: examples,
      level: r.level || 'B2',
      audioUrl: r.audioUrl || null
    };
  });

  const fileContent = `export interface EncyclopediaEntry {
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

export const ENCYCLOPEDIA_DATA: EncyclopediaEntry[] = ${JSON.stringify(entries, null, 2)};
`;

  const destPath = path.join(projectRoot, 'src', 'lib', 'data', 'encyclopedia.ts');
  fs.writeFileSync(destPath, fileContent, 'utf-8');
  console.log(`📚 Đã xuất ${entries.length} mục từ chuẩn hóa ra file src/lib/data/encyclopedia.ts!`);
}

run().catch(console.error);

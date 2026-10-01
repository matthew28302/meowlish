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

const WORDS_TO_CRAWL = [
  // ── VSTEP Academic ──────────────────────────────────────────────────────────
  { word: 'absolute', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'abstract', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'academic', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'accessible', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'accumulate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'accurate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'acknowledge', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'acquire', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'adapt', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'adequate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'adjust', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'affect', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'aggregate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'alleviate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'alter', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'ambiguous', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'amplify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'analyze', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'anticipate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'apparatus', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'apparent', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'appreciate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'approach', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'appropriate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'approximate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'arbitrary', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'argue', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'aspect', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'assess', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'assist', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'assume', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'attain', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'attribute', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'benefit', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'broaden', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'calculate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'categorize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'challenge', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'characterize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'clarify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'classify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'collaborate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'communicate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'compensate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'complex', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'concentrate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'concept', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'conclude', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'confirm', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'consequence', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'constitute', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'construct', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'contribute', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'contrast', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'controversial', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'coordinate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'correspond', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'create', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'criteria', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'cultivate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'deduce', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'demonstrate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'depend', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'derive', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'determine', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'differentiate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'diminish', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'distinguish', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'diversify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'elaborate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'emphasize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'enable', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'encourage', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'enhance', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'ensure', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'estimate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'evaluate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'examine', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'exclude', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'explain', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'expose', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'extend', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'extract', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'facilitate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'formulate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'generate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'govern', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'guarantee', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'hypothesize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'identify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'illustrate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'implement', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'indicate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'induce', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'integrate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'interpret', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'investigate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'involve', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'justify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'maintain', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'manipulate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'measure', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'modify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'motivate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'negotiate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'observe', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'obtain', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'optimize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'outline', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'perceive', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'perform', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'predict', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'prevent', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'process', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'produce', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'propose', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'prove', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'provide', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'qualify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'react', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'recognize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'reduce', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'reinforce', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'relate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'represent', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'require', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'restrict', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'reveal', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'revise', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'select', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'separate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'simulate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'specify', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'stimulate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'strengthen', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'structure', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'summarize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'supplement', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'support', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'sustain', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'synthesize', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'target', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'transfer', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'translate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'underlying', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'validate', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'vary', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  // ── Grammar & Linguistics ────────────────────────────────────────────────────
  { word: 'adjective', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A1' },
  { word: 'adverb', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'affirmative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'clause', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'coherence', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'cohesion', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'collocation', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'conditional', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'conjunction', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'context', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'contraction', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'definition', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'demonstrative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'determiner', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'discourse', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'emphasis', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'expression', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'figurative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'formal', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'fragment', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'function', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'gerund', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'grammar', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A1' },
  { word: 'idiomatic', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'imperative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'indefinite', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'indirect', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'infinitive', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'intensifier', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'interrogative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'linking', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'modal', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'modifier', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'narrative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'negation', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'nominal', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'particle', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'passive', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'perfect', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'phonetic', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'phrase', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'plural', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A1' },
  { word: 'polite', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'prefix', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'preposition', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'pronoun', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'punctuation', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'quantifier', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B2' },
  { word: 'referent', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'register', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'relative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'rhetoric', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'singular', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A1' },
  { word: 'subjunctive', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'suffix', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'superlative', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'syllable', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'B1' },
  { word: 'syntax', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'C1' },
  { word: 'tense', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A2' },
  { word: 'vocabulary', category: 'vstep', categoryLabel: '🎓 Từ Vựng VSTEP', level: 'A1' },
  // ── Online & Social Media ────────────────────────────────────────────────────
  { word: 'analytics', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'avatar', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'bandwidth', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'bookmark', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'browser', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'caption', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'chatbot', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'click', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
  { word: 'cloud', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'comment', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'community', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'content', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'creator', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'cyber', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'dashboard', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'digital', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'download', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'emoji', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'engagement', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'feed', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'filter', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'follower', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'hashtag', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'inbox', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'influence', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'infographic', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'interaction', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'interface', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'keyword', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'like', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
  { word: 'link', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'livestream', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'malware', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'meme', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'mention', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'mobile', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'monetize', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'C1' },
  { word: 'navigation', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'network', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'notification', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'online', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
  { word: 'page', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
  { word: 'password', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'phishing', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'platform', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'podcast', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'post', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
  { word: 'privacy', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'profile', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'reach', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'repost', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'security', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'share', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
  { word: 'shortcut', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'social', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'software', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'spam', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'streaming', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'subscribe', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'tag', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'thread', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'timeline', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'trending', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'upload', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'username', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A2' },
  { word: 'video', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
  { word: 'viral', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'visibility', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'vlog', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B1' },
  { word: 'webinar', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'B2' },
  { word: 'website', category: 'online', categoryLabel: '🌐 Online & Social Media', level: 'A1' },
];

const DELAY_MS = 80;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function crawlCambridge(item) {
  const cleanWord = item.word.toLowerCase();
  const slug = cleanWord.replace(/\s+/g, '-');
  const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(slug)}`;
  const res = await fetch(cambridgeUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
    }
  });
  if (!res.ok) return null;
  const html = await res.text();
  if (!html.includes('dtrans') && !html.includes('ddef_d')) return null;

  const ipaMatch = html.match(/<span[^>]*class="[^"]*ipa dipa[^"]*"[^>]*>([^<]+)<\/span>/i);
  const ipa = ipaMatch ? `/${ipaMatch[1].trim()}/` : `/${cleanWord}/`;

  const posMatch = html.match(/<span[^>]*class="[^"]*pos dpos[^"]*"[^>]*>([^<]+)<\/span>/i);
  const partOfSpeech = posMatch ? posMatch[1].trim() : 'noun';

  const audioMatches = [...html.matchAll(/<source[^>]*type="audio\/mpeg"[^>]*src="([^"]+)"/gi)];
  let audioUrl = audioMatches.find(m => m[1].includes('/us/'))?.[1]
    || audioMatches.find(m => m[1].includes('/uk/'))?.[1]
    || audioMatches[0]?.[1] || '';
  if (audioUrl && audioUrl.startsWith('/')) audioUrl = `https://dictionary.cambridge.org${audioUrl}`;

  const senses = [];
  const defBlockRegex = /<div[^>]*class="[^"]*def-block[^"]*ddef_block[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  let blockMatch;
  while ((blockMatch = defBlockRegex.exec(html)) !== null && senses.length < 4) {
    const blockHtml = blockMatch[1];
    const enDefMatch = blockHtml.match(/<div[^>]*class="[^"]*def[^"]*ddef_d[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      || blockHtml.match(/<div class="def ddef_d db">([\s\S]*?)<\/div>/i);
    const enDef = enDefMatch ? enDefMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const viTransMatch = blockHtml.match(/<span[^>]*class="[^"]*trans dtrans[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const viTrans = viTransMatch ? viTransMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const examples = [];
    const egRegex = /<span[^>]*class="[^"]*eg[^"]*deg[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    let egM;
    while ((egM = egRegex.exec(blockHtml)) !== null && examples.length < 2) {
      const t = egM[1].replace(/<[^>]+>/g, '').trim();
      if (t) examples.push(t);
    }
    const viEgMatches = [...blockHtml.matchAll(/<span[^>]*class="[^"]*trans[^"]*dtrans[^"]*eg[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)];
    const viExamples = viEgMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    if (viTrans || enDef) senses.push({ enDef, viTrans, examples, viExamples });
  }

  const collocations = [];
  const collocRegex = /<span[^>]*class="[^"]*colloc[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let cm;
  while ((cm = collocRegex.exec(html)) !== null && collocations.length < 5) {
    const c = cm[1].replace(/<[^>]+>/g, '').trim();
    if (c) collocations.push(c);
  }
  return { word: cleanWord, ipa, partOfSpeech, audioUrl: audioUrl || null, senses, collocations, source: 'cambridge', cambridgeUrl };
}

async function crawlFallback(item) {
  const cleanWord = item.word.toLowerCase();
  const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(cleanWord.replace(/\s+/g, '-'))}`;
  const [dictRes, transRes] = await Promise.allSettled([
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`).then(r => r.ok ? r.json() : null),
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`).then(r => r.ok ? r.json() : null),
  ]);
  const dict = dictRes.status === 'fulfilled' ? dictRes.value?.[0] : null;
  const viData = transRes.status === 'fulfilled' ? transRes.value?.responseData?.translatedText : '';
  const ipa = dict?.phonetic || dict?.phonetics?.find(p => p.text)?.text || `/${cleanWord}/`;
  const audioUrl = dict?.phonetics?.find(p => p.audio && p.audio.trim())?.audio || null;
  const partOfSpeech = dict?.meanings?.[0]?.partOfSpeech || 'noun';
  const enDef = dict?.meanings?.[0]?.definitions?.[0]?.definition || `Key term in ${item.categoryLabel}`;
  const viTrans = viData || cleanWord;
  const apiExample = dict?.meanings?.[0]?.definitions?.[0]?.example || '';
  return { word: cleanWord, ipa, partOfSpeech, audioUrl, senses: [{ enDef, viTrans, examples: apiExample ? [apiExample] : [], viExamples: [] }], collocations: [], source: 'fallback_api', cambridgeUrl };
}

async function crawlWord(item) {
  const cleanWord = item.word.toLowerCase();
  const cached = db.prepare('SELECT data_json FROM dictionary_cache WHERE word = ?').get(cleanWord);
  if (cached) {
    try { return { ...item, ...JSON.parse(cached.data_json), fromCache: true }; } catch {}
  }
  let result = null;
  try {
    const d = await crawlCambridge(item);
    if (d && d.senses.length > 0) result = d;
  } catch {}
  if (!result) {
    try { result = await crawlFallback(item); } catch { return null; }
  }
  db.prepare('INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
    .run(cleanWord, JSON.stringify(result));
  return { ...item, ...result, fromCache: false };
}

function buildEntry(r, idx) {
  const ps = r.senses?.[0] || {};
  const viMeaning = ps.viTrans || r.word;
  const enExplanation = ps.enDef || `Thuật ngữ trong danh mục ${r.categoryLabel}`;
  const exampleSentences = (ps.examples || []).map((eg, i) => ({
    en: eg,
    vi: (ps.viExamples || [])[i] || 'Xem thêm ví dụ tại Cambridge Dictionary.',
    context: 'Cambridge English-Vietnamese',
  }));
  if (exampleSentences.length === 0) {
    exampleSentences.push({
      en: `The word "${r.word}" is commonly used in academic and professional contexts.`,
      vi: `Từ "${r.word}" thường được sử dụng trong ngữ cảnh học thuật và chuyên nghiệp.`,
      context: 'Thực hành giao tiếp',
    });
  }
  const collocations = (r.collocations && r.collocations.length > 0)
    ? r.collocations
    : [`${r.word} effectively`, `use ${r.word}`, `${r.word} in context`];
  return {
    id: `b4-${idx + 1}-${r.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    word: r.word,
    category: r.category,
    categoryLabel: r.categoryLabel,
    level: r.level || 'B2',
    ipa: r.ipa || `/${r.word}/`,
    partOfSpeech: r.partOfSpeech || 'noun',
    meaningVi: viMeaning,
    detailedExplanation: enExplanation,
    exampleSentences,
    audioUrl: r.audioUrl || null,
    collocations,
    source: r.source || 'unknown',
  };
}

async function run() {
  console.log(`🚀 crawlBatch_4.mjs — ${WORDS_TO_CRAWL.length} words (VSTEP + Grammar + Online & Social Media)`);
  console.log(`📦 DB: ${dbPath}\n`);
  const results = [];
  let cacheHits = 0, crawledFresh = 0, failed = 0;

  for (let i = 0; i < WORDS_TO_CRAWL.length; i++) {
    const item = WORDS_TO_CRAWL[i];
    process.stdout.write(`[${String(i + 1).padStart(3)}/${WORDS_TO_CRAWL.length}] ${item.word.padEnd(22)} → `);
    const res = await crawlWord(item);
    if (res) {
      results.push(res);
      if (res.fromCache) {
        cacheHits++;
        console.log(`💾 CACHE   [${res.ipa || ''}]`);
      } else {
        crawledFresh++;
        console.log(`✅ ${res.source === 'cambridge' ? '🌐 Cambridge' : '🔀 Fallback '} [${res.ipa || ''}]`);
      }
    } else {
      failed++;
      console.log('❌ Failed');
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Total : ${results.length}/${WORDS_TO_CRAWL.length}  💾 Cache: ${cacheHits}  🌐 Fresh: ${crawledFresh}  ❌ Failed: ${failed}`);

  const entries = results.map(buildEntry);
  const outputPath = path.join(projectRoot, 'scripts', 'results_batch4.json');
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2), 'utf-8');
  console.log(`\n📄 Written ${entries.length} entries → ${outputPath}`);
  console.log('🎉 Done!');
}

run().catch(console.error);

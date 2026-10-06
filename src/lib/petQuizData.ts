import { VOCABULARY_LIST, VocabItem } from './data/vocabulary';

export interface QuizQuestion {
  id: string;
  type: 'meaning_en_vi' | 'meaning_vi_en' | 'unscramble' | 'fill_blank';
  prompt: string;
  subPrompt?: string;
  ipa?: string;
  options?: string[];
  correctAnswer: string | string[]; // string for choice, string[] for unscramble tokens
  scrambledTokens?: string[]; // for unscramble
  explanation: string;
  vocabRef: VocabItem;
}

// Utility to shuffle an array
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const normOption = (s: string) => (s ?? '').trim().toLowerCase();

/**
 * Chọn N đáp án nhiễu KHÔNG trùng đáp án đúng và không trùng nhau.
 *
 * Vì sao cần: nhiều từ trong từ điển có CÙNG nghĩa tiếng Việt (ví dụ "error" và
 * "mistake" cùng dịch là "lỗi"). Lọc bằng `v.id !== target.id` rồi lấy
 * `v.meaningVi` vẫn để lọt giá trị trùng ⇒ sinh câu hỏi có hai đáp án giống
 * nhau, người chơi thấy câu hỏi hỏng. Đã dính lỗi này ở nhánh EN→VI và ở PvP.
 */
function pickDistractors<T>(items: T[], getValue: (item: T) => string, correct: string, count: number): string[] {
  const seen = new Set<string>([normOption(correct)]);
  const out: string[] = [];
  for (const item of shuffle(items)) {
    if (out.length >= count) break;
    const raw = getValue(item);
    const key = normOption(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
  }
  return out;
}

/**
 * Generate a PvP Battle English Question
 * Supports: Meaning analysis, sentence unscramble, and fill-in-the-blank
 */
export function generatePvPQuestion(excludeIds: string[] = []): QuizQuestion {
  const pool = VOCABULARY_LIST.filter((v) => !excludeIds.includes(v.id));
  const activePool = pool.length > 5 ? pool : VOCABULARY_LIST;
  const target = activePool[Math.floor(Math.random() * activePool.length)];

  // Choose question type: 40% meaning_en_vi, 35% unscramble, 25% fill_blank
  const rand = Math.random();

  if (rand < 0.35 && target.exampleSentence && target.exampleSentence.split(' ').length >= 4 && target.exampleSentence.split(' ').length <= 10) {
    // SENTENCE UNSCRAMBLE
    const rawTokens = target.exampleSentence.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim().split(/\s+/);
    const scrambled = shuffle([...rawTokens]);

    return {
      id: `q-unscramble-${target.id}-${Date.now()}`,
      type: 'unscramble',
      prompt: `Xếp câu hoàn chỉnh theo nghĩa: "${target.exampleTranslation}"`,
      subPrompt: `Từ khóa chính: "${target.word}" (${target.meaningVi})`,
      correctAnswer: rawTokens,
      scrambledTokens: scrambled,
      explanation: `Câu hoàn chỉnh: "${target.exampleSentence}"\nNghĩa: ${target.exampleTranslation}`,
      vocabRef: target,
    };
  } else if (rand < 0.65 && target.exampleSentence && target.exampleSentence.includes(target.word)) {
    // FILL IN THE BLANK
    const regex = new RegExp(`\\b${target.word}\\b`, 'i');
    const blankSentence = target.exampleSentence.replace(regex, '________');

    // Get 3 distractors
    const otherWords = pickDistractors(VOCABULARY_LIST, (v) => v.word, target.word, 3);
    const options = shuffle([target.word, ...otherWords]);

    return {
      id: `q-blank-${target.id}-${Date.now()}`,
      type: 'fill_blank',
      prompt: `Chọn từ thích hợp điền vào chỗ trống:`,
      subPrompt: blankSentence,
      options,
      correctAnswer: target.word,
      explanation: `Từ đúng: "${target.word}" (${target.meaningVi})\nCâu hoàn chỉnh: ${target.exampleSentence}`,
      vocabRef: target,
    };
  } else {
    // VOCABULARY MEANING ANALYSIS (EN -> VI)
    const otherMeanings = pickDistractors(VOCABULARY_LIST, (v) => v.meaningVi, target.meaningVi, 3);
    const options = shuffle([target.meaningVi, ...otherMeanings]);

    return {
      id: `q-meaning-${target.id}-${Date.now()}`,
      type: 'meaning_en_vi',
      prompt: `Từ vựng này có nghĩa là gì?`,
      subPrompt: target.word,
      ipa: target.phonetic,
      options,
      correctAnswer: target.meaningVi,
      explanation: `"${target.word}" (${target.phonetic}) [${target.type}]: ${target.meaningVi}.\nVí dụ: ${target.exampleSentence}`,
      vocabRef: target,
    };
  }
}

/**
 * Generate a Rapid Racing English Question
 * Fast 4-choice questions to boost speed during the derby
 */
export function generateRacingQuestion(excludeIds: string[] = []): QuizQuestion {
  const pool = VOCABULARY_LIST.filter((v) => !excludeIds.includes(v.id));
  const activePool = pool.length > 5 ? pool : VOCABULARY_LIST;
  const target = activePool[Math.floor(Math.random() * activePool.length)];

  const isReverse = Math.random() > 0.5;

  if (isReverse) {
    // Gợi ý nghĩa tiếng Việt -> Chọn từ tiếng Anh
    const otherWords = pickDistractors(VOCABULARY_LIST, (v) => v.word, target.word, 3);
    const options = shuffle([target.word, ...otherWords]);

    return {
      id: `race-q-vi-en-${target.id}-${Date.now()}`,
      type: 'meaning_vi_en',
      prompt: `Từ tiếng Anh nào mang nghĩa:`,
      subPrompt: `"${target.meaningVi}"?`,
      options,
      correctAnswer: target.word,
      explanation: `"${target.word}": ${target.meaningVi}`,
      vocabRef: target,
    };
  } else {
    // Cho từ tiếng Anh -> Chọn nghĩa tiếng Việt
    // Đây là chỗ dễ sinh đáp án trùng: các từ khác nhau hay có cùng meaningVi.
    const otherMeanings = pickDistractors(VOCABULARY_LIST, (v) => v.meaningVi, target.meaningVi, 3);
    const options = shuffle([target.meaningVi, ...otherMeanings]);

    return {
      id: `race-q-en-vi-${target.id}-${Date.now()}`,
      type: 'meaning_en_vi',
      prompt: `Nghĩa đúng của từ:`,
      subPrompt: `"${target.word}" ${target.phonetic || ''}`,
      options,
      correctAnswer: target.meaningVi,
      explanation: `"${target.word}": ${target.meaningVi}`,
      vocabRef: target,
    };
  }
}

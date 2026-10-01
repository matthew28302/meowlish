import { db } from './db';
import { lookupWord } from './data/dictionary';

// Multi-Provider AI Credentials (strictly loaded from environment variables)
const GROQ_API_KEYS = (process.env.GROQ_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Ensure SQLite cache table exists for sub-millisecond repeated lookups
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_translation_cache (
    query_key TEXT PRIMARY KEY,
    query_type TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface AIWordTranslationResult {
  isSentence: false;
  word: string;
  ipa: string;
  ipaUS?: string;
  ipaUK?: string;
  vietnamesePhonetic?: string;
  stressGuide?: string;
  audioTip?: string;
  partOfSpeech: string;
  meaningVi: string;
  detailedExplanation: string;
  collocations: string[];
  exampleSentences: Array<{ en: string; vi: string; context?: string }>;
  proTips: string;
  synonyms?: string[];
  audioUrl?: string | null;
  source: 'groq_ai' | 'gemini_ai' | 'cache' | 'offline_fallback';
}

export interface AISentenceTranslationResult {
  isSentence: true;
  originalText: string;
  vietnameseTranslation: string;
  tone: string;
  nuanceExplanation: string;
  keyPhrases: Array<{
    en: string;
    vi: string;
    explanation: string;
  }>;
  alternativeTranslations: Array<{
    text: string;
    style: string;
  }>;
  source: 'groq_ai' | 'gemini_ai' | 'cache' | 'offline_fallback';
}

export interface AIPedagogicalAnalysisResult {
  isPedagogical: true;
  originalText: string;
  grammarStructure: string;
  collocationBreakdown: Array<{
    phrase: string;
    meaning: string;
    usageReason: string;
  }>;
  pedagogicalTip: string;
  similarExamples: Array<{ en: string; vi: string }>;
  suggestedImprovement?: string;
  source: 'groq_ai' | 'gemini_ai' | 'cache' | 'offline_fallback';
}

export type AISmartTranslationResult = AIWordTranslationResult | AISentenceTranslationResult | AIPedagogicalAnalysisResult;

/**
 * Check if the input is a single word or short compound phrase vs a full sentence/clause
 */
export function isSingleWordOrTerm(text: string): boolean {
  const trimmed = text.trim();
  // If it has sentence-ending punctuation or line breaks, it's a sentence
  if (/[.?!;\n]/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  return words.length <= 3;
}

function extractJson(content: string): any {
  if (typeof content !== 'string') return content;
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('No JSON found in response');
  }
}

/**
 * Core Multi-Provider AI Fallback Engine
 * Tier 1: Groq AI Pool (super-fast LPU)
 * Tier 2: Google Gemini AI Studio (high quota, bilingual expert)
 */
async function callMultiProviderAI(
  messages: Array<{ role: string; content: string }>,
  jsonMode = true
): Promise<{ data: any; source: 'groq_ai' | 'gemini_ai' }> {
  // 1. TIER 1: Groq AI Pool
  const groqModels = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b'];
  for (const key of GROQ_API_KEYS) {
    for (const model of groqModels) {
      try {
        const payload: any = {
          model,
          messages,
          temperature: 0.25,
        };
        if (jsonMode) {
          payload.response_format = { type: 'json_object' };
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            return {
              data: jsonMode ? extractJson(content) : content,
              source: 'groq_ai',
            };
          }
        } else {
          console.warn(`Groq model ${model} failed (${res.status}), trying next candidate...`);
        }
      } catch (err: any) {
        console.warn(`Groq error with model ${model}:`, err.message);
      }
    }
  }

  // 2. TIER 2: Google Gemini AI Studio Fallback
  if (GEMINI_API_KEY) {
    const geminiModels = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];
    const promptText = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    for (const model of geminiModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: jsonMode ? 'application/json' : 'text/plain',
              },
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            console.info(`[AI Fallback Active] Successfully handled by Google Gemini (${model})`);
            return {
              data: jsonMode ? extractJson(content) : content,
              source: 'gemini_ai',
            };
          }
        } else {
          console.warn(`Gemini model ${model} failed (${res.status}), trying next candidate...`);
        }
      } catch (err: any) {
        console.warn(`Gemini error with model ${model}:`, err.message);
      }
    }
  }

  throw new Error('Tất cả các nhà cung cấp AI (Groq, Gemini) hiện đang quá tải. Hệ thống chuyển sang chế độ dự phòng.');
}

/**
 * Smart AI Word & Term Dictionary Lookup
 */
export async function translateWordWithAI(
  rawWord: string,
  contextSentence?: string
): Promise<AIWordTranslationResult> {
  const cleanWord = rawWord.trim();
  const cacheKey = `word:${cleanWord.toLowerCase()}:${(contextSentence || '').trim().slice(0, 40).toLowerCase()}`;

  // 1. Check SQLite cache
  try {
    const cached = db.prepare('SELECT result_json FROM ai_translation_cache WHERE query_key = ?').get(cacheKey) as
      | { result_json: string }
      | undefined;
    if (cached) {
      const parsed = JSON.parse(cached.result_json);
      return { ...parsed, source: 'cache' };
    }
  } catch (err) {
    console.warn('Cache read warning:', err);
  }

  // 2. Build smart system prompt following smart-translator guidelines
  const systemPrompt = `Bạn là chuyên gia ngữ âm học và từ điển song ngữ Anh - Việt cao cấp, tuân thủ nghiêm ngặt kỹ năng 'smart-translator':
1. Dịch chuẩn xác theo ngữ cảnh thực tế, văn phong tự nhiên, súc tích, không dịch máy móc word-by-word.
2. BẮT BUỘC cung cấp phiên âm IPA chuẩn xác tuyệt đối cho cả Anh - Mỹ (US) và Anh - Anh (UK), có đánh dấu trọng âm chính (ˈ) và trọng âm phụ (ˌ) đầy đủ.
3. Cung cấp hướng dẫn phát âm mô phỏng bằng tiếng Việt dễ nhớ (vietnamesePhonetic) và mẹo trọng âm/âm cuối (stressGuide).

Trả về đúng định dạng JSON có cấu trúc sau:
{
  "word": string (từ gốc chính xác dạng nguyên thể),
  "ipa": string (phiên âm quốc tế IPA chuẩn, ví dụ "/ˈbɑː.t̬əl.nek/"),
  "ipaUS": string (phiên âm chuẩn Mỹ US, ví dụ "/ˈskedʒ.uːl/"),
  "ipaUK": string (phiên âm chuẩn Anh UK, ví dụ "/ˈʃedʒ.uːl/"),
  "vietnamesePhonetic": string (cách đọc mô phỏng tiếng Việt gần gũi, ví dụ "x-két-đu-ồ", "bót-tồ-néc"),
  "stressGuide": string (hướng dẫn trọng âm và âm đuôi, ví dụ "Nhấn mạnh âm 1 (SKED-zhool). Bật nhẹ âm đuôi /l/"),
  "audioTip": string (mẹo phát âm thực chiến: nuốt âm, nối âm hoặc âm câm nếu có),
  "partOfSpeech": string ("noun", "verb", "adjective", "adverb", "idiom", "phrasal verb"),
  "meaningVi": string (nghĩa tiếng Việt tự nhiên và chuẩn xác nhất trong ngữ cảnh),
  "detailedExplanation": string (giải thích ngắn gọn bằng tiếng Anh về định nghĩa và cách sử dụng),
  "collocations": string[] (3-5 cụm từ thường đi kèm phổ biến trong giao tiếp hoặc công việc IT),
  "exampleSentences": [
    { "en": string, "vi": string, "context": string }
  ] (2-3 câu ví dụ song ngữ thực tế, sát đời sống hoặc IT),
  "proTips": string (lưu ý ngữ pháp, lỗi người Việt hay mắc, hoặc cách dùng phân biệt formal/casual),
  "synonyms": string[] (2-4 từ đồng nghĩa tương đương)
}`;

  const userPrompt = contextSentence
    ? `Hãy phân tích ngữ âm, phát âm chuẩn và dịch từ/thuật ngữ "${cleanWord}" khi xuất hiện trong câu ngữ cảnh: "${contextSentence}".`
    : `Hãy phân tích ngữ âm, phát âm chuẩn và giải nghĩa từ/thuật ngữ tiếng Anh: "${cleanWord}".`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let aiData: any;
  let activeSource: 'groq_ai' | 'gemini_ai' | 'offline_fallback' = 'groq_ai';

  try {
    const aiResponse = await callMultiProviderAI(messages, true);
    aiData = aiResponse.data;
    activeSource = aiResponse.source;
  } catch (err: any) {
    console.warn('All AI providers exhausted, using offline fallback:', err.message);
    const localEntry = lookupWord(cleanWord);
    if (localEntry) {
      aiData = {
        word: localEntry.word,
        ipa: localEntry.phonetic,
        ipaUS: localEntry.phonetic,
        ipaUK: localEntry.phonetic,
        partOfSpeech: localEntry.partOfSpeech,
        meaningVi: localEntry.vietnamese,
        detailedExplanation: localEntry.notes || `Từ vựng tiếng Anh: ${localEntry.word}`,
        collocations: localEntry.collocation ? localEntry.collocation.split(', ') : [],
        exampleSentences: localEntry.example
          ? [{ en: localEntry.example, vi: localEntry.vietnamese, context: 'Từ điển mẫu' }]
          : [],
        proTips: localEntry.notes || '',
        synonyms: [],
      };
      activeSource = 'offline_fallback';
    } else {
      throw err;
    }
  }

  const primaryIpa = aiData.ipaUS || aiData.ipa || `/${cleanWord}/`;

  const result: AIWordTranslationResult = {
    isSentence: false,
    word: aiData.word || cleanWord,
    ipa: primaryIpa,
    ipaUS: aiData.ipaUS || primaryIpa,
    ipaUK: aiData.ipaUK || aiData.ipa || primaryIpa,
    vietnamesePhonetic: aiData.vietnamesePhonetic || '',
    stressGuide: aiData.stressGuide || '',
    audioTip: aiData.audioTip || '',
    partOfSpeech: aiData.partOfSpeech || 'word',
    meaningVi: aiData.meaningVi || 'Bản dịch ngữ cảnh',
    detailedExplanation: aiData.detailedExplanation || '',
    collocations: Array.isArray(aiData.collocations) ? aiData.collocations : [],
    exampleSentences: Array.isArray(aiData.exampleSentences)
      ? aiData.exampleSentences.map((eg: any) => ({
          en: eg.en || '',
          vi: eg.vi || '',
          context: eg.context || 'Giao tiếp hàng ngày',
        }))
      : [],
    proTips: aiData.proTips || 'Sử dụng tự nhiên theo ngữ cảnh giao tiếp.',
    synonyms: Array.isArray(aiData.synonyms) ? aiData.synonyms : [],
    source: activeSource,
  };

  // 3. Save to SQLite cache
  try {
    db.prepare(
      'INSERT OR REPLACE INTO ai_translation_cache (query_key, query_type, result_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(cacheKey, 'word', JSON.stringify(result));
  } catch (err) {
    console.warn('Cache write warning:', err);
  }

  return result;
}

/**
 * Smart AI Sentence & Paragraph Contextual Translation
 */
export async function translateSentenceWithAI(rawText: string): Promise<AISentenceTranslationResult> {
  const cleanText = rawText.trim();
  const cacheKey = `sentence:${cleanText.toLowerCase()}`;

  // 1. Check SQLite cache
  try {
    const cached = db.prepare('SELECT result_json FROM ai_translation_cache WHERE query_key = ?').get(cacheKey) as
      | { result_json: string }
      | undefined;
    if (cached) {
      const parsed = JSON.parse(cached.result_json);
      return { ...parsed, source: 'cache' };
    }
  } catch (err) {
    console.warn('Cache read warning:', err);
  }

  // 2. Build smart system prompt
  const systemPrompt = `Bạn là dịch giả AI chuyên nghiệp theo chuẩn 'smart-translator'. Nhiệm vụ của bạn là dịch câu/đoạn văn tiếng Anh sang tiếng Việt một cách tự nhiên, trôi chảy, đúng sắc thái văn hoá và ngữ cảnh giao tiếp.
Tuyệt đối không dịch thô word-by-word.

Trả về đúng định dạng JSON sau:
{
  "vietnameseTranslation": string (bản dịch tiếng Việt tự nhiên nhất),
  "tone": string (ví dụ: "Thân mật / Hàng ngày", "Trang trọng / Công sở", "Kỹ thuật / IT"),
  "nuanceExplanation": string (giải thích sắc thái nghĩa, thành ngữ ẩn ý hoặc lý do chọn cách dịch này),
  "keyPhrases": [
    {
      "en": string (cụm từ/thành ngữ mấu chốt trong câu),
      "vi": string (nghĩa tiếng Việt),
      "explanation": string (giải thích cách dùng)
    }
  ],
  "alternativeTranslations": [
    {
      "text": string (cách dịch thay thế khác),
      "style": string ("Văn phong thân mật" | "Văn phong trang trọng / Email")
    }
  ]
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Hãy dịch và phân tích câu/đoạn văn sau:\n"${cleanText}"` },
  ];

  const { data: aiData, source } = await callMultiProviderAI(messages, true);

  const result: AISentenceTranslationResult = {
    isSentence: true,
    originalText: cleanText,
    vietnameseTranslation: aiData.vietnameseTranslation || '',
    tone: aiData.tone || 'Tự nhiên / Chuẩn mực',
    nuanceExplanation: aiData.nuanceExplanation || '',
    keyPhrases: Array.isArray(aiData.keyPhrases) ? aiData.keyPhrases : [],
    alternativeTranslations: Array.isArray(aiData.alternativeTranslations) ? aiData.alternativeTranslations : [],
    source,
  };

  // 3. Save to SQLite cache
  try {
    db.prepare(
      'INSERT OR REPLACE INTO ai_translation_cache (query_key, query_type, result_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(cacheKey, 'sentence', JSON.stringify(result));
  } catch (err) {
    console.warn('Cache write warning:', err);
  }

  return result;
}

/**
 * AI Pedagogical Analysis for Highlighted Text & Sentences
 */
export async function analyzeSentenceWithAI(
  rawText: string,
  contextSentence?: string
): Promise<AIPedagogicalAnalysisResult> {
  const cleanText = rawText.trim();
  const cacheKey = `pedagogy:${cleanText.toLowerCase()}:${(contextSentence || '').trim().slice(0, 40).toLowerCase()}`;

  // 1. Check SQLite cache
  try {
    const cached = db.prepare('SELECT result_json FROM ai_translation_cache WHERE query_key = ?').get(cacheKey) as
      | { result_json: string }
      | undefined;
    if (cached) {
      const parsed = JSON.parse(cached.result_json);
      return { ...parsed, source: 'cache' };
    }
  } catch (err) {
    console.warn('Cache read warning:', err);
  }

  // 2. Build AI system prompt
  const systemPrompt = `BẮT BUỘC TỐI THƯỢNG: TOÀN BỘ NỘI DUNG GIẢI THÍCH, NGHĨA, LÝ DO VÀ MẸO HỌC BẮT BUỘC PHẢI VIẾT BẰNG TIẾNG VIỆT THUẦN TÚY 100%, DỄ HIỂU, NGẮN GỌN (DƯỚI 3 CÂU MỖI MỤC). KHÔNG VIẾT ĐOẠN VĂN TIẾNG ANH DÀI DÒNG.

Nhiệm vụ: Phân tích nhanh sư phạm câu/cụm từ Tiếng Anh dành cho người Việt học giao tiếp.

Trả về duy nhất JSON có dạng:
{
  "grammarStructure": "Giải thích ngắn gọn cấu trúc chính hoàn toàn bằng TIẾNG VIỆT (Ví dụ: Cấu trúc yêu cầu lịch sự: Could + Chủ ngữ (you) + Động từ (check). Dùng 'could' thay cho 'can' để ngữ điệu nhẹ nhàng hơn). Max 2-3 câu ngắn.",
  "collocationBreakdown": [
    {
      "phrase": "Cụm từ tiếng Anh",
      "meaning": "Nghĩa tiếng Việt ngắn gọn",
      "usageReason": "Giải thích lý do chọn cụm này bằng TIẾNG VIỆT trong 1 câu ngắn."
    }
  ],
  "pedagogicalTip": "Mẹo ghi nhớ hoặc lỗi sai người Việt hay mắc bằng TIẾNG VIỆT ngắn gọn.",
  "similarExamples": [
    { "en": "Câu tiếng Anh ví dụ", "vi": "Dịch tiếng Việt" }
  ],
  "suggestedImprovement": "Cách diễn đạt tự nhiên hơn bằng TIẾNG VIỆT (nếu có)."
}`;

  const userPrompt = contextSentence
    ? `Hãy phân tích sư phạm câu/đoạn văn: "${cleanText}" trong ngữ cảnh bài làm: "${contextSentence}".`
    : `Hãy phân tích sư phạm câu/đoạn văn: "${cleanText}".`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const { data: aiData, source } = await callMultiProviderAI(messages, true);

  const result: AIPedagogicalAnalysisResult = {
    isPedagogical: true,
    originalText: cleanText,
    grammarStructure: aiData.grammarStructure || 'Phân tích cấu trúc câu tiếng Anh.',
    collocationBreakdown: Array.isArray(aiData.collocationBreakdown) ? aiData.collocationBreakdown : [],
    pedagogicalTip: aiData.pedagogicalTip || 'Ghi nhớ cấu trúc câu để phản xạ tự nhiên.',
    similarExamples: Array.isArray(aiData.similarExamples) ? aiData.similarExamples : [],
    suggestedImprovement: aiData.suggestedImprovement || '',
    source,
  };

  // 3. Save to SQLite cache
  try {
    db.prepare(
      'INSERT OR REPLACE INTO ai_translation_cache (query_key, query_type, result_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(cacheKey, 'pedagogy', JSON.stringify(result));
  } catch (err) {
    console.warn('Cache write warning:', err);
  }

  return result;
}

/**
 * Generate a multi-question AI practice set (5 items) for a specified topic
 */
export async function generateAIPracticeSet(topic: string, count: number = 20): Promise<any> {
  const cleanTopic = topic.trim();
  const cacheKey = `practice_set:${cleanTopic.toLowerCase()}:${count}`;

  try {
    const cached = db.prepare('SELECT result_json FROM ai_translation_cache WHERE query_key = ?').get(cacheKey) as
      | { result_json: string }
      | undefined;
    if (cached) {
      return { isPracticeSet: true, questions: JSON.parse(cached.result_json), source: 'cache' };
    }
  } catch (err) {}

  const systemPrompt = `BẮT BUỘC TỐI THƯỢNG: BẠN PHẢI TẠO MỘT BỘ BÀI TẬP HOÀN CHỈNH GỒM ĐÚNG ${count} CÂU HỎI TIẾNG ANH PHẢN XẠ VỀ CHỦ ĐỀ: "${cleanTopic}".
TẤT CẢ TÌNH HUỐNG, TIẾNG VIỆT, GỢI Ý VÀ GIẢI THÍCH BẮT BUỘC BẰNG TIẾNG VIỆT 100%.

Trả về duy nhất định dạng JSON có cấu trúc sau:
{
  "questions": [
    {
      "situation": "Tình huống công sở/giao tiếp bằng tiếng Việt ngắn gọn",
      "vietnamesePrompt": "Câu tiếng Việt cần dịch sang tiếng Anh",
      "referenceAnswer": "Câu tiếng Anh chuẩn bản xứ tương ứng",
      "keyVocabHints": ["cụm từ 1", "cụm từ 2"],
      "explanation": "Giải thích cấu trúc và từ vựng mấu chốt bằng tiếng Việt"
    }
  ]
}`;

  const userPrompt = `Hãy sinh đúng ${count} câu hỏi bài tập viết phản xạ phong cách IT & giao tiếp công sở cho chủ đề: "${cleanTopic}".`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let questionsList: any[] = [];
  let activeSource: 'groq_ai' | 'gemini_ai' = 'groq_ai';
  try {
    const aiResponse = await callMultiProviderAI(messages, true);
    const aiData = aiResponse.data;
    activeSource = aiResponse.source;
    if (Array.isArray(aiData)) {
      questionsList = aiData;
    } else if (aiData && Array.isArray(aiData.questions)) {
      questionsList = aiData.questions;
    } else if (aiData && Array.isArray(aiData.prompts)) {
      questionsList = aiData.prompts;
    }
  } catch (err) {
    console.warn('Failed to generate AI set via multi-provider:', err);
  }

  if (questionsList.length === 0) {
    // Generate 20 fallback practice items
    questionsList = Array.from({ length: 20 }, (_, idx) => {
      const num = idx + 1;
      return {
        situation: `Tình huống ${num}: Thực hành phản xạ chuyên sâu về ${cleanTopic}`,
        vietnamesePrompt: `Bạn cần trao đổi chủ đề ${cleanTopic} (bài ${num}) với khách hàng.`,
        referenceAnswer: `We would like to coordinate with you on ${cleanTopic} for milestone ${num}.`,
        keyVocabHints: ['coordinate with you on', `milestone ${num}`],
        explanation: `Dùng "coordinate with you on" để làm việc ăn ý giữa hai bên cho mốc dự án ${num}.`,
      };
    });
  }

  try {
    db.prepare(
      'INSERT OR REPLACE INTO ai_translation_cache (query_key, query_type, result_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(cacheKey, 'practice_set', JSON.stringify(questionsList));
  } catch (err) {}

  return { isPracticeSet: true, questions: questionsList, source: activeSource };
}

/**
 * Universal Entry Point: Automatically routes to Word Lookup, Sentence Translation, Pedagogical Analysis, or AI Practice Set Generator
 */
export async function smartTranslateWithAI(
  inputText: string,
  contextSentence?: string,
  mode?: string
): Promise<AISmartTranslationResult> {
  if (mode === 'generate_practice_set') {
    return generateAIPracticeSet(inputText, 20);
  }
  if (mode === 'pedagogical_analysis') {
    return analyzeSentenceWithAI(inputText, contextSentence);
  }
  const isWord = isSingleWordOrTerm(inputText);
  if (isWord) {
    return translateWordWithAI(inputText, contextSentence);
  } else {
    return translateSentenceWithAI(inputText);
  }
}

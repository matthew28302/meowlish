import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ENCYCLOPEDIA_DATA } from '@/lib/data/encyclopedia';
import { crawlCambridgeDictionary } from '@/lib/cambridgeCrawler';
import { translateWordWithAI, isSingleWordOrTerm } from '@/lib/groqTranslator';
import { getClientIp, checkRateLimitPersistent, rateLimitExceededResponse } from '@/lib/rateLimit';
import { cleanCollocations } from '@/lib/collocations';
import logger from '@/lib/logger';
import { logError } from '@/lib/systemLogs';

/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Route này có thể ghi cache khi tra từ — nhưng từ khi tách file, `dictionary_cache`
 * nằm trong dictionary.db (dictDb) KHÔNG BAO GIỜ đồng bộ lên S3, nên tra từ
 * không còn kích upload DB 67MB. Phần ghi còn lại (ai_translation_cache qua Groq/
 * Gemini) nằm trong DB chính, giờ chỉ còn ~3.5MB.
 */
export const maxDuration = 60;

/**
 * Độ dài tối đa cho `context` trước khi nhúng vào prompt LLM.
 *
 * `context` là dữ liệu KHÔNG TIN CẬY lấy thẳng từ query-string của GET và được
 * `translateWordWithAI` nối vào prompt. Không phải SQL injection, nhưng nó cho
 * phép (1) prompt-injection, (2) dồn input để tốn token. 300 ký tự là đủ cho
 * một câu ngữ cảnh và bỏ hết ký tự điều khiển để không làm vỡ prompt.
 */
const MAX_CONTEXT_CHARS = 300;

/** Bỏ ký tự điều khiển (control chars) khỏi chuỗi người dùng gửi lên. */
function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u001F\u007F]/g, ' ');
}

/**
 * Đường ĐỌC-ONLY cho kết quả AI đã cache.
 *
 * VÌ SAO CẦN (audit 2026-10-09 — S3 upload amplifier):
 * `translateWordWithAI` trong `src/lib/groqTranslator.ts` INSERT
 * `ai_translation_cache` nằm trong DB CHÍNH, còn fingerprint S3 là
 * `size:mtimeMs` ⇒ mỗi từ MỚI vừa cache là DB thành "dirty" và kích một lần
 * upload ~3.5MB. Vòng lặp GET không đăng nhập trên từ ngẫu nhiên vì thế
 * biến endpoint tra từ thành bộ khuếch đại upload.
 *
 * Hàm này dựng ĐÚNG cache key mà groqTranslator ghi
 * (`word:<word>:<context 40 ký tự>`) và trả kết quả nếu đã có — SELECT thuần,
 * KHÔNG ghi DB. Nhánh cache-hit trong groqTranslator vốn cũng không ghi, nên
 * phần giá trị thật nằm ở chỗ: cache-hit không còn phải gọi vào hàm ghi được
 * bất kỳ lần nào, và caller có thể quyết định bỏ hẳn nhánh ghi.
 *
 * Xem hạn chế còn lại trong báo cáo: cache MISS vẫn ghi, vì lệnh INSERT nằm
 * trong `groqTranslator.ts` (file không thuộc phạm vi sửa của route này).
 */
function readCachedAiWord(word: string, context: string): Record<string, unknown> | null {
  try {
    const cacheKey = `word:${word.trim().toLowerCase()}:${(context || '').trim().slice(0, 40).toLowerCase()}`;
    const row = db
      .prepare('SELECT result_json FROM ai_translation_cache WHERE query_key = ?')
      .get(cacheKey) as { result_json: string } | undefined;
    if (!row?.result_json) return null;
    const parsed = JSON.parse(row.result_json);
    if (!parsed || typeof parsed !== 'object') return null;
    return { ...parsed, source: 'cache' };
  } catch {
    // Cache hỏng / bảng chưa tồn tại → coi như không có, rơi xuống đường AI.
    return null;
  }
}

/**
 * Tra từ qua AI, ưu tiên đường ĐỌC-ONLY.
 *
 * Cache-hit → không gọi `translateWordWithAI` ⇒ không có lệnh INSERT nào chạy
 * ⇒ DB không đổi ⇒ không kích upload S3. Chỉ khi cache MISS mới gọi hàm AI
 * (ghi cache — xem hạn chế còn lại trong `readCachedAiWord`).
 */
async function lookupAiWord(word: string, context: string): Promise<any> {
  const cached = readCachedAiWord(word, context);
  if (cached) return cached;
  return translateWordWithAI(word, context);
}

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  try {
    // Endpoint tốn phí AI (Groq/Gemini) KHÔNG yêu cầu đăng nhập → limiter
    // phải bền vững giữa các instance (Upstash Redis khi có env, fallback
    // in-memory khi chưa cấu hình). `checkRateLimit` in-memory bị chia nhỏ
    // theo instance Vercel ⇒ vòng lặp từ nhiều IP vẫn vượt hạn mức.
    const rateCheck = await checkRateLimitPersistent(
      `dict_lookup:${clientIp}`,
      60,
      60 * 1000
    );
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất tra cứu từ vựng quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(request.url);
    const word = (searchParams.get('word') || '').trim().slice(0, 100);
    const mode = (searchParams.get('mode') || 'auto').trim().toLowerCase(); // 'ai', 'cambridge', 'auto'
    // context là input không tin cậy → cắt còn 300 ký tự + bỏ ký tự điều khiển
    // trước khi nó đi vào prompt LLM (xem MAX_CONTEXT_CHARS).
    const context = stripControlChars(searchParams.get('context') || '')
      .trim()
      .slice(0, MAX_CONTEXT_CHARS);

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    const clean = word.toLowerCase();
    const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(clean)}`;

    // 1. If explicitly requesting AI translation
    if (mode === 'ai') {
      try {
        const aiData = await lookupAiWord(word, context);
        const entry = {
          id: `ai-${clean}-${Date.now()}`,
          word: aiData.word || word,
          ipa: aiData.ipa || `/${clean}/`,
          partOfSpeech: aiData.partOfSpeech || 'word',
          category: 'ai_smart',
          categoryLabel: '⚡ AI Dịch Thuật Thông Minh (Groq LPU)',
          meaningVi: aiData.meaningVi,
          detailedExplanation: aiData.detailedExplanation,
          collocations: cleanCollocations(clean, aiData.collocations),
          exampleSentences: aiData.exampleSentences,
          proTips: aiData.proTips,
          synonyms: aiData.synonyms,
          source: aiData.source === 'cache' ? 'ai_cache' : 'groq_ai',
          cambridgeUrl,
        };

        return NextResponse.json({
          success: true,
          source: entry.source,
          entry,
          cambridgeUrl,
        });
      } catch (aiErr: any) {
        console.warn('AI dictionary lookup failed, falling back to crawler:', aiErr);
      }
    }

    // 2. Try Cambridge English-Vietnamese Dictionary Crawler
    let cambridgeData = null;
    if (isSingleWordOrTerm(clean)) {
      try {
        cambridgeData = await crawlCambridgeDictionary(clean);
      } catch (crawlErr) {
        console.warn('Cambridge crawl error:', crawlErr);
      }
    }

    if (cambridgeData && cambridgeData.senses.length > 0) {
      const primarySense = cambridgeData.senses[0];
      const entry = {
        id: `cambridge-${clean}-${Date.now()}`,
        word: cambridgeData.word || clean,
        ipa: cambridgeData.ipa || `/${clean}/`,
        partOfSpeech: cambridgeData.partOfSpeech || 'word',
        category: 'cambridge',
        categoryLabel: '🏛️ Cambridge English-Vietnamese (Crawled)',
        meaningVi: primarySense.viTrans,
        detailedExplanation: primarySense.enDef,
        // Không tự sinh collocations từ tên từ: "X in communication" /
        // "standard usage of X" là placeholder, không mang thông tin và làm mất
        // uy tín từ điển. Lọc thêm cả placeholder do template import sinh ra.
        collocations: cleanCollocations(clean, (cambridgeData as { collocations?: unknown }).collocations),
        exampleSentences: primarySense.examples.map((eg) => ({
          en: eg,
          vi: 'Ví dụ chính thức trích xuất từ Cambridge Dictionary',
          context: 'Cambridge Dictionary',
        })),
        allSenses: cambridgeData.senses,
        audioUrl: cambridgeData.audioUrl || null,
        level: 'B1',
        source: cambridgeData.source,
        cambridgeUrl,
        proTips: 'Nội dung định nghĩa và bản dịch chính thức từ Cambridge English-Vietnamese Dictionary.',
      };

      return NextResponse.json({
        success: true,
        source: cambridgeData.source,
        entry,
        cambridgeUrl,
      });
    }

    // 3. Fallback to Groq AI if Cambridge doesn't have it or for phrases/slang
    try {
      const aiData = await lookupAiWord(word, context);
      const entry = {
        id: `ai-${clean}-${Date.now()}`,
        word: aiData.word || word,
        ipa: aiData.ipa || `/${clean}/`,
        partOfSpeech: aiData.partOfSpeech || 'word',
        category: 'ai_smart',
        categoryLabel: '⚡ AI Dịch Thuật Thông Minh (Groq LPU)',
        meaningVi: aiData.meaningVi,
        detailedExplanation: aiData.detailedExplanation,
        collocations: cleanCollocations(clean, aiData.collocations),
        exampleSentences: aiData.exampleSentences,
        proTips: aiData.proTips,
        synonyms: aiData.synonyms,
        source: aiData.source === 'cache' ? 'ai_cache' : 'groq_ai',
        cambridgeUrl,
      };

      return NextResponse.json({
        success: true,
        source: entry.source,
        entry,
        cambridgeUrl,
      });
    } catch (aiErr: any) {
      console.warn('Groq AI fallback error:', aiErr);
    }

    // 4. Check local rich curated dataset as final fallback
    const localMatch = ENCYCLOPEDIA_DATA.find(
      (e) => e.word.toLowerCase() === clean
    );
    if (localMatch) {
      return NextResponse.json({
        success: true,
        source: 'local',
        entry: localMatch,
        cambridgeUrl,
      });
    }

    return NextResponse.json(
      {
        error: `Không tìm thấy từ "${word}" trong từ điển.`,
        cambridgeUrl,
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    // KHÔNG trả err.message thô: better-sqlite3 lộ tên bảng/cột, lỗi
    // JSON.stringify của dữ liệu provider... là chi tiết nội bộ.
    logger.error('Error in GET /api/dictionary', { error: err });
    logError({
      endpoint: 'GET /api/dictionary',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    return NextResponse.json(
      { error: 'Không thể tra cứu từ vựng lúc này. Vui lòng thử lại sau giây lát.' },
      { status: 500 }
    );
  }
}

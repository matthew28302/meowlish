import { NextResponse } from 'next/server';
// Ghi chú kiến trúc (sau khi tách từ điển): route này KHÔNG truy vấn bảng
// dictionary_* nào — smartTranslateWithAI chỉ ghi `ai_translation_cache` trong
// DB CHÍNH (dữ liệu nhỏ, gắn user, thuộc diện đồng bộ S3 ~3.5MB). Toàn bộ
// dictionary_entries/dictionary_cache đã chuyển sang dictDb ở search route +
// cambridgeCrawler.
import { smartTranslateWithAI } from '@/lib/groqTranslator';
import { db } from '@/lib/db';
import { getClientIp, checkRateLimitPersistent, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import { logError } from '@/lib/systemLogs';

/**
 * Độ dài tối đa cho `context` trước khi nhúng vào prompt LLM.
 *
 * `context` là dữ liệu KHÔNG TIN CẬY của client (POST body hoặc GET
 * query-string) và được `smartTranslateWithAI` nối thẳng vào prompt. Không
 * phải SQL injection, nhưng nó cho phép prompt-injection và dồn input để tốn
 * token. 500 ký tự là đủ cho vài câu ngữ cảnh; bỏ hết ký tự điều khiển để
 * không làm vỡ prompt (ký tự \r\n, ESC, DEL...).
 */
const MAX_CONTEXT_CHARS = 500;

/** Bỏ ký tự điều khiển (control chars) khỏi chuỗi người dùng gửi lên. */
function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u001F\u007F]/g, ' ');
}

/**
 * Đường ĐỌC-ONLY cho kết quả AI đã cache (audit 2026-10-09 — S3 upload
 * amplifier).
 *
 * `smartTranslateWithAI` (và các hàm nó gọi) INSERT `ai_translation_cache` trong
 * DB CHÍNH. Fingerprint S3 là `size:mtimeMs` ⇒ mỗi truy vấn MỚI làm DB dirty
 * và kích một lần upload ~3.5MB. Endpoint này không yêu cầu đăng nhập, nên
 * vòng lặp trên nội dung ngẫu nhiên biến nó thành bộ khuếch đại upload.
 *
 * Hàm này dựng ĐÚNG cache key mà `groqTranslator` ghi, đọc thuần bằng SELECT
 * và trả kết quả nếu có. Nhánh cache-hit trong groqTranslator vốn đã không
 * ghi, nhưng ở đây caller được quyền BỎ HẲN lệnh ghi khi cache đã có.
 *
 * Cache key của groqTranslator (xem src/lib/groqTranslator.ts):
 *   practice_set:<topic>:<count> | pedagogy:<text>:<ctx40>
 *   word:<text>:<ctx40>           | sentence:<text>
 * Nếu key lệch do thay đổi groqTranslator thì chỉ tốn 1 vòng lặp rồi rơi xuống
 * đường AI bình thường — không sai dữ liệu, chỉ mất hiệu quả.
 */
function readCachedAiResult(
  text: string,
  context: string,
  mode: string
): Record<string, unknown> | null {
  try {
    const cleanText = text.trim();
    const cleanCtx = (context || '').trim().slice(0, 40).toLowerCase();
    let cacheKey: string;
    if (mode === 'generate_practice_set') {
      // smartTranslateWithAI gọi generateAIPracticeSet(inputText, 20)
      cacheKey = `practice_set:${cleanText.toLowerCase()}:20`;
    } else if (mode === 'pedagogical_analysis') {
      cacheKey = `pedagogy:${cleanText.toLowerCase()}:${cleanCtx}`;
    } else if (!/[.?!;\n]/.test(cleanText) && cleanText.split(/\s+/).filter(Boolean).length <= 3) {
      // isSingleWordOrTerm: không có dấu câu kết thúc + <= 3 từ
      cacheKey = `word:${cleanText.toLowerCase()}:${cleanCtx}`;
    } else {
      cacheKey = `sentence:${cleanText.toLowerCase()}`;
    }

    const row = db
      .prepare('SELECT result_json FROM ai_translation_cache WHERE query_key = ?')
      .get(cacheKey) as { result_json: string } | undefined;
    if (!row?.result_json) return null;

    const parsed = JSON.parse(row.result_json);
    if (!parsed || typeof parsed !== 'object') return null;

    // `generateAIPracticeSet` lưu MẢNG câu hỏi thô (không phải object entry)
    if (mode === 'generate_practice_set') {
      if (!Array.isArray(parsed)) return null;
      return { isPracticeSet: true, questions: parsed, source: 'cache' };
    }
    return { ...parsed, source: 'cache' };
  } catch {
    // Cache hỏng / bảng chưa tồn tại → coi như không có, rơi xuống đường AI.
    return null;
  }
}

/**
 * Gọi `smartTranslateWithAI` nhưng ưu tiên cache đọc-thuần.
 *
 * Cache-hit → không gọi hàm AI ⇒ không có lệnh INSERT nào chạy ⇒ DB không đổi
 * ⇒ không kích upload S3. Chỉ khi cache MISS mới gọi hàm AI (ghi cache).
 */
async function smartTranslateCached(
  text: string,
  context: string,
  mode: string
): Promise<any> {
  const cached = readCachedAiResult(text, context, mode);
  if (cached) return cached;
  return smartTranslateWithAI(text, context, mode);
}

/**
 * Đọc + kiểm tra body JSON.
 *
 * JSON hỏng (body rỗng / cắt ngang) là lỗi CLIENT, không phải lỗi hệ thống:
 * không bắt thì `request.json()` ném SyntaxError → 500 kèm chi tiết driver.
 */
async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await request.json();
    // JSON hợp lệ nhưng không phải object (vd `"abc"`, `123`, `null`) cũng không
    // có field nào đọc được → coi như body vô dụng, trả 400 cho nhất quán.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Log nội bộ + thông báo chung cho client (không lộ err.message của driver). */
function internalErrorResponse(endpoint: string, err: unknown, ip: string) {
  logger.error(`Error in ${endpoint}`, { error: err });
  logError({
    endpoint,
    error_message: err instanceof Error ? err.message : String(err),
    stack_trace: err instanceof Error ? err.stack : null,
    ip,
    severity: 'error',
  });
  return NextResponse.json(
    { error: 'Lỗi xử lý dịch thuật/phân tích AI. Vui lòng thử lại sau giây lát.' },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  // Khai báo NGOÀI try: khối catch cũng cần clientIp để ghi logError.
  const clientIp = getClientIp(request);
  try {
    // Endpoint tốn phí AI (Groq/Gemini) KHÔNG yêu cầu đăng nhập → limiter
    // phải bền vững giữa các instance (Upstash Redis khi có env, fallback
    // in-memory khi chưa cấu hình). `checkRateLimit` in-memory bị chia nhỏ
    // theo instance Vercel ⇒ dàn request qua nhiều IP vẫn vượt hạn mức.
    // `mode=generate_practice_set` là đường đắt nhất (sinh 20 câu hỏi).
    const rateCheck = await checkRateLimitPersistent(
      `translate_post:${clientIp}`,
      30,
      60 * 1000
    );
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Bạn đang gọi API dịch thuật quá nhanh. Vui lòng thử lại sau ít phút.', rateCheck.resetInSeconds);
    }

    const body = await readJsonBody(request);
    if (!body) {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    }

    // Mọi field đều là input không tin cậy: `String(x ?? '')` ở biên để không
    // bao giờ gọi `.trim()` trên number/object (→ TypeError 500).
    const text = String(body.text ?? '').trim().slice(0, 3000);
    // context không tin cậy → bỏ ký tự điều khiển + cắt còn 500 ký tự.
    const context = stripControlChars(String(body.context ?? '')).trim().slice(0, MAX_CONTEXT_CHARS);
    const mode = String(body.mode ?? '').trim().slice(0, 50);

    if (!text) {
      return NextResponse.json({ error: 'Nội dung cần xử lý không được để trống' }, { status: 400 });
    }

    const result = await smartTranslateCached(text, context, mode);
    return NextResponse.json({
      success: true,
      data: result,
      source: result.source,
    });
  } catch (err: unknown) {
    return internalErrorResponse('POST /api/translate', err, clientIp);
  }
}

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  try {
    const rateCheck = await checkRateLimitPersistent(
      `translate_get:${clientIp}`,
      30,
      60 * 1000
    );
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Bạn đang gọi API dịch thuật quá nhanh. Vui lòng thử lại sau ít phút.', rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(request.url);
    const text = (searchParams.get('text') || searchParams.get('q') || '').trim().slice(0, 3000);
    // context không tin cậy → bỏ ký tự điều khiển + cắt còn 500 ký tự.
    const context = stripControlChars(searchParams.get('context') || '')
      .trim()
      .slice(0, MAX_CONTEXT_CHARS);
    const mode = (searchParams.get('mode') || '').trim().slice(0, 50);

    if (!text) {
      return NextResponse.json({ error: 'Nội dung cần xử lý không được để trống' }, { status: 400 });
    }

    const result = await smartTranslateCached(text, context, mode);
    return NextResponse.json({
      success: true,
      data: result,
      source: result.source,
    });
  } catch (err: unknown) {
    return internalErrorResponse('GET /api/translate', err, clientIp);
  }
}
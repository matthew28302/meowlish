import { NextResponse } from 'next/server';
import { getClientIp, checkRateLimitPersistent, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import { logError } from '@/lib/systemLogs';

/**
 * Chỉ phản chiếu lại status của Google khi nó mang ý nghĩa cho CLIENT.
 *
 * Vì sao: `res.status` thô có thể là bất kỳ số nào (403 bot-block, 404, 451,
 * 500...). Trả nguyên văn số đó vừa vô nghĩa với trình duyệt (file .mp3), vừa
 * là đường để upstream điều khiển status của API ta. Chỉ giữ:
 *   - 400: text/lang sai định dạng → client sửa được
 *   - 429: Google đang throttle → client nên chậm lại
 *   - 502: lỗi phía Google → client biết là upstream chết
 * Mọi thứ khác → 502 (gateway hỏng), không lộ chi tiết driver.
 */
const PROPAGATED_UPSTREAM_STATUS = new Set([400, 429]);

export async function GET(request: Request) {
  const clientIp = getClientIp(request);
  try {
    // H1 (audit 2026-10-08): TTS relay sang Google — tốn băng thông ra ngoài,
    // cần limiter bền vững giữa các instance (Upstash Redis khi có env,
    // fallback in-memory). Guest được dùng, chỉ chống spam; 30 lần/phút/IP.
    const rateCheck = await checkRateLimitPersistent(
      `tts:${clientIp}`,
      30,
      60 * 1000
    );
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất phát âm TTS quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(request.url);
    const text = (searchParams.get('text') || searchParams.get('q') || '').trim();
    const lang = (searchParams.get('lang') || 'en-US').trim();

    // Làm sạch và ràng buộc độ dài text để tránh lạm dụng dịch vụ Google TTS
    const cleanText = text.replace(/[\r\n\t]/g, ' ').trim().slice(0, 200);
    const cleanLang = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/.test(lang) ? lang : 'en-US';

    if (!cleanText) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    // Google Translate TTS URL
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
      cleanLang
    )}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!res.ok) {
      // Chi tiết giữ nội bộ; client chỉ thấy status đã clamp + thông báo chung.
      logger.error(`TTS upstream trả HTTP ${res.status}`, { text: cleanText.slice(0, 60) });
      logError({
        endpoint: 'GET /api/tts',
        error_message: `Google Translate TTS trả HTTP ${res.status}`,
        ip: clientIp,
        severity: 'error',
      });
      const status = PROPAGATED_UPSTREAM_STATUS.has(res.status) ? res.status : 502;
      return NextResponse.json(
        { error: 'Không phát được âm thanh lúc này. Vui lòng thử lại sau giây lát.' },
        { status }
      );
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable', // Cache for 7 days
      },
    });
  } catch (err: unknown) {
    // KHÔNG trả err.message thô: có thể chứa URL upstream, thông tin proxy/TLS.
    logger.error('TTS route error', { error: err });
    logError({
      endpoint: 'GET /api/tts',
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : null,
      ip: clientIp,
      severity: 'error',
    });
    return NextResponse.json({ error: 'Lỗi phát âm thanh. Vui lòng thử lại sau giây lát.' }, { status: 500 });
  }
}

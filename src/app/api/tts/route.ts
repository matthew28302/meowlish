import { NextResponse } from 'next/server';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';

export async function GET(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `tts:${clientIp}`,
      maxAttempts: 60,
      windowMs: 60 * 1000,
    });
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
      return NextResponse.json({ error: 'Failed to fetch TTS audio' }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable', // Cache for 7 days
      },
    });
  } catch (err: any) {
    console.error('TTS route error:', err);
    return NextResponse.json({ error: err.message || 'TTS Error' }, { status: 500 });
  }
}

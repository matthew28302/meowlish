import { NextResponse } from 'next/server';
import { smartTranslateWithAI } from '@/lib/groqTranslator';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `translate_post:${clientIp}`,
      maxAttempts: 30,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Bạn đang gọi API dịch thuật quá nhanh. Vui lòng thử lại sau ít phút.', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const text = (body.text || '').trim().slice(0, 3000);
    const context = (body.context || '').trim().slice(0, 500);
    const mode = (body.mode || '').trim().slice(0, 50);

    if (!text) {
      return NextResponse.json({ error: 'Nội dung cần xử lý không được để trống' }, { status: 400 });
    }

    const result = await smartTranslateWithAI(text, context, mode);
    return NextResponse.json({
      success: true,
      data: result,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Translation/Analysis API error:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi xử lý dịch thuật/phân tích AI' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `translate_get:${clientIp}`,
      maxAttempts: 30,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Bạn đang gọi API dịch thuật quá nhanh. Vui lòng thử lại sau ít phút.', rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(request.url);
    const text = (searchParams.get('text') || searchParams.get('q') || '').trim().slice(0, 3000);
    const context = (searchParams.get('context') || '').trim().slice(0, 500);
    const mode = (searchParams.get('mode') || '').trim().slice(0, 50);

    if (!text) {
      return NextResponse.json({ error: 'Nội dung cần xử lý không được để trống' }, { status: 400 });
    }

    const result = await smartTranslateWithAI(text, context, mode);
    return NextResponse.json({
      success: true,
      data: result,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Translation/Analysis API error:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi xử lý dịch thuật/phân tích AI' },
      { status: 500 }
    );
  }
}

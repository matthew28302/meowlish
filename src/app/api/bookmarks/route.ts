import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';

/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:
 * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị
 * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    const auth = getAuthenticatedUser(request, requestedUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền truy cập.' }, { status: 403 });
    }

    const bookmarks = db
      .prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC')
      .all(auth.userId);

    return NextResponse.json({ bookmarks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `bm_post:${clientIp}`,
      maxAttempts: 60,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất lưu từ quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const {
      userId: rawUserId,
      word,
      phonetic = '',
      translation,
      contextSentence = '',
      note = '',
      tags = 'general',
    } = body;

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để lưu từ vựng.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền thao tác trên tài khoản khác.' }, { status: 403 });
    }

    const userId = auth.userId;

    if (!word || !translation) {
      return NextResponse.json({ error: 'Từ vựng và bản dịch nghĩa là bắt buộc' }, { status: 400 });
    }

    // Làm sạch dữ liệu đầu vào chống XSS / HTML Injection
    const cleanWord = sanitizeText(word).slice(0, 100);
    const cleanPhonetic = sanitizeText(phonetic).slice(0, 100);
    const cleanTranslation = sanitizeText(translation).slice(0, 200);
    const cleanSentence = sanitizeText(contextSentence).slice(0, 500);
    const cleanNote = sanitizeText(note).slice(0, 500);
    const cleanTags = sanitizeText(tags || 'general').slice(0, 50);

    const id = `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Kiểm tra xem từ đã được lưu trước đó chưa
    const existing = db
      .prepare('SELECT id FROM bookmarks WHERE user_id = ? AND LOWER(word) = LOWER(?)')
      .get(userId, cleanWord);

    if (existing) {
      db.prepare(`
        UPDATE bookmarks 
        SET note = ?, context_sentence = ?, translation = ?, phonetic = ?, tags = ?
        WHERE id = ? AND user_id = ?
      `).run(cleanNote, cleanSentence, cleanTranslation, cleanPhonetic, cleanTags, (existing as { id: string }).id, userId);

      const updated = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get((existing as { id: string }).id, userId);
      return NextResponse.json({ success: true, bookmark: updated, updated: true });
    }

    db.prepare(`
      INSERT INTO bookmarks (id, user_id, word, phonetic, translation, context_sentence, note, tags, mastery_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, userId, cleanWord, cleanPhonetic, cleanTranslation, cleanSentence, cleanNote, cleanTags);

    const created = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(id, userId);

    return NextResponse.json({ success: true, bookmark: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `bm_del:${clientIp}`,
      maxAttempts: 60,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Quá nhiều yêu cầu xóa. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const rawUserId = searchParams.get('userId');

    if (!id) {
      return NextResponse.json({ error: 'Mã từ vựng (Bookmark ID) là bắt buộc' }, { status: 400 });
    }

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({ error: 'Tài khoản đã bị vô hiệu hóa.', status: 'disabled' }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thao tác.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: 'Bạn không có quyền xóa từ vựng của người dùng khác.' }, { status: 403 });
    }

    // BẢO MẬT IDOR: BẮT BUỘC lọc theo cả id và user_id của phiên người dùng
    db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?').run(id, auth.userId);

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `bm_patch:${clientIp}`,
      maxAttempts: 60,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Quá nhiều yêu cầu cập nhật. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const { id, masteryLevel, userId: rawUserId } = body;

    if (!id || masteryLevel === undefined) {
      return NextResponse.json({ error: 'Mã từ vựng và cấp độ thành thạo là bắt buộc' }, { status: 400 });
    }

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({ error: 'Tài khoản đã bị vô hiệu hóa.', status: 'disabled' }, { status: 403 });
    }
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thao tác.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: 'Bạn không có quyền sửa từ vựng của người khác.' }, { status: 403 });
    }

    const cleanLevel = Math.min(5, Math.max(0, parseInt(masteryLevel, 10) || 0));
    const now = new Date().toISOString();

    // BẢO MẬT IDOR: BẮT BUỘC lọc theo user_id phiên người dùng
    const result = db.prepare(`
      UPDATE bookmarks 
      SET mastery_level = ?, last_reviewed = ?
      WHERE id = ? AND user_id = ?
    `).run(cleanLevel, now, id, auth.userId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ vựng hoặc bạn không có quyền sửa đổi.' }, { status: 404 });
    }

    const updated = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(id, auth.userId);

    return NextResponse.json({ success: true, bookmark: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

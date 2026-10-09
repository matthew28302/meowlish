import { NextResponse } from 'next/server';
import { dictDb } from '@/lib/db';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { cleanCollocations } from '@/lib/collocations';

/**
 * Route đọc từ điển tĩnh từ FILE RIÊNG dictionary.db (dictDb) — file này
 * KHÔNG bao giờ được đồng bộ lên S3, nên tra từ không còn kích upload 67MB
 * như trước. Nếu cold start Vercel chưa restore kịp từ điển (MISS/timeout),
 * dictDb mở với bảng rỗng → trả danh sách trống graceful, không crash.
 *
 * M8 (audit 2026-10-08): truy vấn từ dùng FTS5 MATCH prefix `q*` thay LIKE
 * full-scan (đo được 87ms → ~0.1ms), và bỏ cột json gộp ~20MB khỏi SELECT
 * (mapping bên dưới không đọc cột đó). Fallback LIKE khi FTS trống/không khả
 * dụng (try/catch) — kết quả đúng như cũ cho các truy vấn FTS không bắt được
 * (substring), chỉ chậm hơn cho chính các truy vấn đó.
 */
export const maxDuration = 60;

/**
 * Tạo phrase FTS5 cho prefix search: chỉ giữ chữ/số/khoảng trắng rồi bọc trong
 * ngoặc kép + '*'. Nhờ vậy mọi toán tử FTS5 do user gõ (AND/OR/NOT/NEAR, :,
 * ^, ngoặc, dấu nháy) đều bị vô hiệu hoá — không inject được cú pháp MATCH.
 * Trả về null nếu sau khi làm sạch không còn ký tự nào (toàn dấu/ký tự đặc
 * biệt) — lúc đó nhánh LIKE vẫn tra theo literal được.
 */
function buildFtsMatchPhrase(rawQuery: string): string | null {
  const cleaned = rawQuery
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return `"${cleaned}"*`;
}

/** Escape wildcard %/_/\ cho nhánh LIKE — user không được tự inject wildcard. */
function escapeLikeTerm(rawQuery: string): string {
  return rawQuery.replace(/[\\%_]/g, '\\$1');
}

export async function GET(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `dict_search:${clientIp}`,
      maxAttempts: 100,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất tìm kiếm quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase().slice(0, 100);
    const category = (searchParams.get('category') || 'all').trim().slice(0, 50);
    const level = (searchParams.get('level') || 'all').trim().slice(0, 20);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(60, Math.max(12, parseInt(searchParams.get('limit') || '24', 10) || 24));
    const offset = (page - 1) * limit;

    const ftsPhrase = q ? buildFtsMatchPhrase(q) : null;
    const likeQ = q ? escapeLikeTerm(q) : '';

    // Quyết định dùng FTS: index phải có dữ liệu, MATCH không lỗi và trả về ít
    // nhất 1 dòng. Mọi trường hợp khác — FTS trống (cold-start restore thiếu
    // rebuild), cú pháp lỗi, truy vấn substring FTS không bắt được — rơi về
    // nhánh LIKE nên kết quả không bao giờ "thiếu" so với hành vi cũ.
    let useFts = false;
    if (q && ftsPhrase) {
      try {
        useFts = !!dictDb
          .prepare('SELECT rowid FROM dictionary_fts WHERE dictionary_fts MATCH ? LIMIT 1')
          .get(ftsPhrase);
      } catch {
        useFts = false;
      }
    }

    const runSearch = (withFts: boolean): { total: number; rows: any[] } => {
      const whereClauses: string[] = [];
      const params: (string | number)[] = [];

      // Filter by query using parameterized ? placeholders
      if (q) {
        if (withFts && ftsPhrase) {
          // FTS5 external-content: JOIN về dictionary_entries qua rowid (bảng
          // index dùng chung rowid với bảng gốc — xem schema trong src/lib/db.ts).
          whereClauses.push('rowid IN (SELECT rowid FROM dictionary_fts WHERE dictionary_fts MATCH ?)');
          params.push(ftsPhrase);
        } else {
          whereClauses.push("(word LIKE ? ESCAPE '\\' OR word LIKE ? ESCAPE '\\' OR meaning_vi LIKE ? ESCAPE '\\')");
          params.push(`${likeQ}%`, `%${likeQ}%`, `%${likeQ}%`);
        }
      }

      // Filter by category using parameterized ? placeholders
      if (category && category !== 'all') {
        whereClauses.push('category = ?');
        params.push(category);
      }

      // Filter by level using parameterized ? placeholders
      if (level && level !== 'all') {
        whereClauses.push('level = ?');
        params.push(level);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count total matches
      const countRow = dictDb
        .prepare(`SELECT COUNT(*) as total FROM dictionary_entries ${whereSql}`)
        .get(...params) as { total: number } | undefined;

      // Get paginated items. Cột json gộp ~20MB KHÔNG còn được SELECT — mapping
      // dưới đây chỉ đọc các cột tường minh, không đọc cột đó.
      const querySql = `
      SELECT word, ipa, part_of_speech as partOfSpeech, category, category_label as categoryLabel,
             level, meaning_vi as meaningVi, detailed_explanation as detailedExplanation,
             examples_json, collocations_json, audio_url as audioUrl
      FROM dictionary_entries
      ${whereSql}
      ORDER BY
        CASE
          WHEN word = ? THEN 1
          WHEN word LIKE ? ESCAPE '\\' THEN 2
          ELSE 3
        END,
        length(word) ASC,
        word ASC
      LIMIT ? OFFSET ?
    `;

      const queryParams = [
        ...params,
        q || '',
        `${likeQ || ''}%`,
        limit,
        offset
      ];

      const rows = dictDb.prepare(querySql).all(...queryParams) as any[];
      return { total: countRow?.total || 0, rows };
    };

    let searchResult: { total: number; rows: any[] } | null = null;
    try {
      searchResult = runSearch(useFts);
    } catch (ftsErr) {
      if (useFts) {
        // FTS lỗi giữa chừng (index hỏng/MATCH invalid): thử lại MỘT lần bằng
        // LIKE trước khi bỏ cuộc — kết quả vẫn đúng.
        console.warn('Dictionary FTS MATCH lỗi — thử lại bằng LIKE:', ftsErr);
        try {
          searchResult = runSearch(false);
        } catch (retryErr) {
          console.error('Dictionary DB chưa sẵn sàng — trả kết quả rỗng graceful:', retryErr);
        }
      } else {
        console.error('Dictionary DB chưa sẵn sàng — trả kết quả rỗng graceful:', ftsErr);
      }
    }

    if (!searchResult) {
      // Cold-start restore từ điển MISS/timeout hoặc file hỏng: trả danh sách
      // RỖNG graceful thay vì 500 — UI vẫn hoạt động, user data không liên quan.
      return NextResponse.json({
        success: true,
        total: 0,
        page,
        limit,
        totalPages: 0,
        items: [],
        dictionaryUnavailable: true,
      });
    }

    const total = searchResult.total;
    const rows = searchResult.rows;

    const items = rows.map((r) => {
      let examples = [];
      let collocations = [];
      try {
        examples = JSON.parse(r.examples_json || '[]');
      } catch {}
      try {
        collocations = JSON.parse(r.collocations_json || '[]');
      } catch {}

      return {
        id: `enc-${r.word}`,
        word: r.word,
        ipa: r.ipa || `/${r.word}/`,
        partOfSpeech: r.partOfSpeech || 'noun',
        category: r.category,
        categoryLabel: r.categoryLabel,
        meaningVi: r.meaningVi,
        detailedExplanation: r.detailedExplanation,
        // KHÔNG tự sinh placeholder khi rỗng. Trước đây fallback `["<word> in
        // context"]` khiến MỌI từ trong từ điển (26.416 mục) hiện một chip vô
        // nghĩa; UI đã ẩn khối collocations khi mảng rỗng nên để rỗng là đúng.
        // `cleanCollocations` lọc phòng thủ để dữ liệu cũ (đã nạp trước, hoặc
        // được khôi phục lại từ S3) cũng không còn chip rác.
        collocations: cleanCollocations(r.word, collocations),
        exampleSentences: examples.map((eg: any) => ({
          en: eg.en,
          vi: eg.vi,
          context: r.categoryLabel
        })),
        level: r.level,
        audioUrl: r.audioUrl
      };
    });

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items
    });
  } catch (error: any) {
    console.error('Dictionary search error:', error);
    // KHÔNG trả err.message thô: better-sqlite3 lộ tên bảng/cột và text driver
    // là chi tiết nội bộ. Thông báo chung + chi tiết chỉ trong log.
    console.error('Dictionary search error:', error);
    return NextResponse.json({ error: 'Dictionary search failed' }, { status: 500 });
  }
}

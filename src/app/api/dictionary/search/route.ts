import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';

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

    let whereClauses: string[] = [];
    let params: (string | number)[] = [];

    // Filter by query using parameterized ? placeholders
    if (q) {
      whereClauses.push('(word LIKE ? OR word LIKE ? OR meaning_vi LIKE ?)');
      params.push(`${q}%`, `%${q}%`, `%${q}%`);
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
    const countSql = `SELECT COUNT(*) as total FROM dictionary_entries ${whereSql}`;
    const countRow = db.prepare(countSql).get(...params) as { total: number } | undefined;
    const total = countRow?.total || 0;

    // Get paginated items
    const querySql = `
      SELECT word, ipa, part_of_speech as partOfSpeech, category, category_label as categoryLabel,
             level, meaning_vi as meaningVi, detailed_explanation as detailedExplanation,
             examples_json, collocations_json, audio_url as audioUrl, data_json
      FROM dictionary_entries
      ${whereSql}
      ORDER BY
        CASE
          WHEN word = ? THEN 1
          WHEN word LIKE ? THEN 2
          ELSE 3
        END,
        length(word) ASC,
        word ASC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [
      ...params,
      q || '',
      `${q || ''}%`,
      limit,
      offset
    ];

    const rows = db.prepare(querySql).all(...queryParams) as any[];

    const items = rows.map((r, idx) => {
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
        collocations: collocations.length > 0 ? collocations : [`${r.word} in context`],
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
    return NextResponse.json({ error: error.message || 'Dictionary search failed' }, { status: 500 });
  }
}

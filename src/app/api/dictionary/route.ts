import { NextResponse } from 'next/server';
import { ENCYCLOPEDIA_DATA } from '@/lib/data/encyclopedia';
import { crawlCambridgeDictionary } from '@/lib/cambridgeCrawler';
import { translateWordWithAI, isSingleWordOrTerm } from '@/lib/groqTranslator';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { cleanCollocations } from '@/lib/collocations';

export async function GET(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `dict_lookup:${clientIp}`,
      maxAttempts: 60,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất tra cứu từ vựng quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(request.url);
    const word = (searchParams.get('word') || '').trim().slice(0, 100);
    const mode = (searchParams.get('mode') || 'auto').trim().toLowerCase(); // 'ai', 'cambridge', 'auto'
    const context = (searchParams.get('context') || '').trim().slice(0, 300);

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    const clean = word.toLowerCase();
    const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(clean)}`;

    // 1. If explicitly requesting AI translation
    if (mode === 'ai') {
      try {
        const aiData = await translateWordWithAI(word, context);
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
      const aiData = await translateWordWithAI(word, context);
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
    const message = err instanceof Error ? err.message : 'Dictionary lookup error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

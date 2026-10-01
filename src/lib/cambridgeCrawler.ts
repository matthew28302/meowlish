import { db } from './db';

export interface CambridgeSense {
  enDef: string;
  viTrans: string;
  examples: string[];
}

export interface CrawledDictionaryResult {
  word: string;
  ipa: string;
  audioUrl?: string | null;
  partOfSpeech: string;
  senses: CambridgeSense[];
  source: 'cambridge' | 'fallback_api' | 'cache';
  cambridgeUrl: string;
  rawExplanation?: string;
}

// Ensure cache table exists in SQLite
db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary_cache (
    word TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export async function crawlCambridgeDictionary(rawWord: string): Promise<CrawledDictionaryResult | null> {
  const cleanWord = rawWord.trim().toLowerCase();
  if (!cleanWord) return null;

  // 1. Check local cache first for instant 1ms response
  try {
    const cached = db.prepare('SELECT data_json FROM dictionary_cache WHERE word = ?').get(cleanWord) as { data_json: string } | undefined;
    if (cached) {
      const parsed = JSON.parse(cached.data_json);
      return { ...parsed, source: 'cache' };
    }
  } catch (err) {
    console.warn('Cache read error:', err);
  }

  const cambridgeUrl = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(cleanWord)}`;

  try {
    // 2. Crawl Cambridge English-Vietnamese dictionary directly
    const res = await fetch(cambridgeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
      next: { revalidate: 86400 }, // Cache 24h
    });

    if (res.ok) {
      const html = await res.text();

      // Check if page actually has translation definitions (class dtrans)
      if (html.includes('dtrans') || html.includes('ddef_d')) {
        // Parse Title / Word
        const titleMatch = html.match(/<h2[^>]*class="[^"]*di-title[^"]*"[^>]*>([^<]+)<\/h2>/i) ||
                           html.match(/<h2[^>]*class="[^"]*dhw[^"]*"[^>]*>([^<]+)<\/h2>/i) ||
                           html.match(/<span[^>]*class="[^"]*dhw[^"]*"[^>]*>([^<]+)<\/span>/i);
        const matchedWord = titleMatch ? titleMatch[1].trim() : cleanWord;

        // Parse IPA
        const ipaMatch = html.match(/<span[^>]*class="[^"]*ipa dipa[^"]*"[^>]*>([^<]+)<\/span>/i);
        const ipa = ipaMatch ? `/${ipaMatch[1].trim()}/` : '';

        // Parse Part of Speech
        const posMatch = html.match(/<span[^>]*class="[^"]*pos dpos[^"]*"[^>]*>([^<]+)<\/span>/i);
        const partOfSpeech = posMatch ? posMatch[1].trim() : 'word';

        // Parse Audio URL
        const audioMatch = html.match(/<source[^>]*type="audio\/mpeg"[^>]*src="([^"]+)"/i);
        let audioUrl = audioMatch ? audioMatch[1] : '';
        if (audioUrl && audioUrl.startsWith('/')) {
          audioUrl = `https://dictionary.cambridge.org${audioUrl}`;
        }

        // Parse Senses & Translations
        const senses: CambridgeSense[] = [];
        const defBlockRegex = /<div class="def-block ddef_block\s*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
        let blockMatch;

        while ((blockMatch = defBlockRegex.exec(html)) !== null && senses.length < 5) {
          const blockHtml = blockMatch[1];

          // English definition
          const enDefMatch = blockHtml.match(/<div class="def ddef_d db">([\s\S]*?)<\/div>/i);
          const enDef = enDefMatch ? enDefMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Vietnamese translation
          const viTransMatch = blockHtml.match(/<span class="trans dtrans"[^>]*>([\s\S]*?)<\/span>/i);
          const viTrans = viTransMatch ? viTransMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Examples
          const examples: string[] = [];
          const egRegex = /<span class="eg deg">([\s\S]*?)<\/span>/gi;
          let egM;
          while ((egM = egRegex.exec(blockHtml)) !== null && examples.length < 3) {
            examples.push(egM[1].replace(/<[^>]+>/g, '').trim());
          }

          if (viTrans || enDef) {
            senses.push({
              enDef,
              viTrans,
              examples,
            });
          }
        }

        // If at least 1 sense was extracted
        if (senses.length > 0) {
          const result: CrawledDictionaryResult = {
            word: matchedWord,
            ipa,
            audioUrl: audioUrl || null,
            partOfSpeech,
            senses,
            source: 'cambridge',
            cambridgeUrl,
          };

          // Save to SQLite cache for instant subsequent lookups
          try {
            db.prepare(`
              INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at)
              VALUES (?, ?, CURRENT_TIMESTAMP)
            `).run(cleanWord, JSON.stringify(result));
          } catch (cacheErr) {
            console.warn('Cache write warning:', cacheErr);
          }

          return result;
        }
      }
    }
  } catch (err) {
    console.warn('Cambridge fetch warning:', err);
  }

  // 3. Fallback to Free Dictionary API + MyMemory translation if Cambridge doesn't have specialized/slang words
  try {
    const [dictRes, transRes] = await Promise.allSettled([
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`).then((r) =>
        r.ok ? r.json() : null
      ),
    ]);

    const dictData = dictRes.status === 'fulfilled' && dictRes.value ? dictRes.value[0] : null;
    const viTrans =
      transRes.status === 'fulfilled' && transRes.value
        ? transRes.value?.responseData?.translatedText || ''
        : '';

    if (dictData || viTrans) {
      const phonetic =
        dictData?.phonetic ||
        dictData?.phonetics?.find((p: any) => p.text)?.text ||
        `/${cleanWord}/`;

      const audio =
        dictData?.phonetics?.find((p: any) => p.audio && p.audio.endsWith('.mp3'))?.audio || null;

      const firstMeaning = dictData?.meanings?.[0];
      const pos = firstMeaning?.partOfSpeech || 'word';
      const enDef = firstMeaning?.definitions?.[0]?.definition || `Term: "${cleanWord}"`;
      const example = firstMeaning?.definitions?.[0]?.example;

      const result: CrawledDictionaryResult = {
        word: dictData?.word || cleanWord,
        ipa: phonetic,
        audioUrl: audio,
        partOfSpeech: pos,
        senses: [
          {
            enDef,
            viTrans: viTrans || 'Dịch thuật trực tuyến',
            examples: example ? [example] : [],
          },
        ],
        source: 'fallback_api',
        cambridgeUrl,
      };

      try {
        db.prepare(`
          INSERT OR REPLACE INTO dictionary_cache (word, data_json, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(cleanWord, JSON.stringify(result));
      } catch (cacheErr) {
        console.warn('Cache write warning:', cacheErr);
      }

      return result;
    }
  } catch (apiErr) {
    console.warn('Fallback API warning:', apiErr);
  }

  return null;
}

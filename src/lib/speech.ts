// Speech Recognition and Text-To-Speech (TTS) Helpers

export interface PronunciationResult {
  overallScore: number;
  wordResults: {
    targetWord: string;
    spokenWord?: string;
    isCorrect: boolean;
    isClose: boolean;
  }[];
  recognizedText: string;
}

// Text-to-speech with high-fidelity voices and fallback to /api/tts
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function playNativeAudio(text: string, rate: number = 1.0): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=en-US`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = rate;
      audio.onended = () => resolve();
      audio.onerror = () => {
        // Fallback to Web Speech API
        speakWithWebSpeech(text, rate);
        resolve();
      };
      audio.play().catch(() => {
        speakWithWebSpeech(text, rate);
        resolve();
      });
    } catch {
      speakWithWebSpeech(text, rate);
      resolve();
    }
  });
}

function speakWithWebSpeech(text: string, rate: number = 0.9, pitch: number = 1.0) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = 'en-US';

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const englishVoice = voices.find(
    (v) => (v.lang === 'en-US' || v.lang.startsWith('en-US')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Guy') || v.name.includes('Samantha') || v.name.includes('Aria'))
  ) || voices.find((v) => v.lang.startsWith('en-US')) || voices.find((v) => v.lang.startsWith('en'));

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function speakText(text: string, rate: number = 0.9, pitch: number = 1.0) {
  if (typeof window === 'undefined') return;

  // For words and short phrases, use native audio API for 100% authentic pronunciation
  if (text.trim().split(/\s+/).length <= 6) {
    playNativeAudio(text, rate);
  } else {
    speakWithWebSpeech(text, rate, pitch);
  }
}

// Levenshtein similarity algorithm
function getSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const editDistance = (a: string, b: string): number => {
    const costs: number[] = [];
    for (let i = 0; i <= a.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= b.length; j++) {
        if (i === 0) costs[j] = j;
        else if (j > 0) {
          let newValue = costs[j - 1];
          if (a.charAt(i - 1) !== b.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[b.length] = lastValue;
    }
    return costs[b.length];
  };

  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

// Clean and normalize text for comparison (strip punctuation)
function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '');
}

// ============================================================================
// BUG FIX: LCS-based word alignment instead of index-based comparison
// This prevents the "offset shift" problem where skipping/adding one word
// causes ALL subsequent words to be misaligned and scored 0.
// ============================================================================
function alignWords(targetWords: string[], spokenWords: string[]): { targetIdx: number; spokenIdx: number }[] {
  const n = targetWords.length;
  const m = spokenWords.length;

  // Build LCS table using cleaned words
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const tClean = cleanWord(targetWords[i - 1]);
      const sClean = cleanWord(spokenWords[j - 1]);
      const sim = getSimilarity(tClean, sClean);

      if (sim >= 0.55) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find aligned pairs
  const aligned: { targetIdx: number; spokenIdx: number }[] = [];
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const tClean = cleanWord(targetWords[i - 1]);
    const sClean = cleanWord(spokenWords[j - 1]);
    const sim = getSimilarity(tClean, sClean);

    if (sim >= 0.55 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      aligned.unshift({ targetIdx: i - 1, spokenIdx: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return aligned;
}

// Pronunciation evaluation with LCS alignment (fixes offset shift bug)
export function evaluatePronunciation(targetSentence: string, recognizedText: string): PronunciationResult {
  const targetWords = targetSentence.trim().split(/\s+/).filter(Boolean);
  const spokenWords = recognizedText.trim().split(/\s+/).filter(Boolean);

  let totalScore = 0;
  const wordResults: PronunciationResult['wordResults'] = [];

  // Get aligned pairs using LCS
  const aligned = alignWords(targetWords, spokenWords);
  const alignedMap = new Map<number, number>(); // targetIdx -> spokenIdx
  aligned.forEach((pair) => {
    alignedMap.set(pair.targetIdx, pair.spokenIdx);
  });

  targetWords.forEach((rawTarget, idx) => {
    const targetClean = cleanWord(rawTarget);
    const spokenIdx = alignedMap.get(idx);

    if (spokenIdx === undefined) {
      // No matching spoken word found for this target word
      wordResults.push({
        targetWord: rawTarget,
        isCorrect: false,
        isClose: false,
      });
      return;
    }

    const spokenClean = cleanWord(spokenWords[spokenIdx]);
    const similarity = getSimilarity(targetClean, spokenClean);

    if (similarity >= 0.85 || targetClean === spokenClean) {
      wordResults.push({
        targetWord: rawTarget,
        spokenWord: spokenWords[spokenIdx],
        isCorrect: true,
        isClose: true,
      });
      totalScore += 100;
    } else if (similarity >= 0.55) {
      wordResults.push({
        targetWord: rawTarget,
        spokenWord: spokenWords[spokenIdx],
        isCorrect: false,
        isClose: true,
      });
      totalScore += 65;
    } else {
      wordResults.push({
        targetWord: rawTarget,
        spokenWord: spokenWords[spokenIdx],
        isCorrect: false,
        isClose: false,
      });
      totalScore += 10;
    }
  });

  const overallScore = targetWords.length > 0 ? Math.round(totalScore / targetWords.length) : 0;

  return {
    overallScore,
    wordResults,
    recognizedText,
  };
}

// Web Speech Recognition wrapper
export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  destroy: () => void;
  isSupported: boolean;
  // Expose the last interim transcript so the caller can grab it on manual stop
  getLastTranscript: () => string;
}

export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onStateChange?: (listening: boolean) => void
): SpeechRecognitionController {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, destroy: () => {}, isSupported: false, getLastTranscript: () => '' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, destroy: () => {}, isSupported: false, getLastTranscript: () => '' };
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  // BUG FIX: Use continuous = true so the mic doesn't auto-stop after 1 second of silence
  // This allows learners time to think between words without the mic cutting off
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let lastTranscript = '';
  let manualStop = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let fullTranscript = '';

    for (let i = 0; i < event.results.length; i++) {
      fullTranscript += event.results[i][0].transcript;
    }

    lastTranscript = fullTranscript.trim();

    // Check if ALL results are final
    const allFinal = Array.from(event.results).every((r: any) => r.isFinal);

    if (allFinal && fullTranscript.trim()) {
      onResult(fullTranscript.trim(), true);
    } else if (fullTranscript.trim()) {
      onResult(fullTranscript.trim(), false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    // Ignore 'no-speech' and 'aborted' errors (normal when user stops mic)
    if (event.error === 'no-speech' || event.error === 'aborted') {
      if (onStateChange) onStateChange(false);
      return;
    }
    onError(event.error || 'Speech recognition error');
    if (onStateChange) onStateChange(false);
  };

  recognition.onstart = () => {
    manualStop = false;
    if (onStateChange) onStateChange(true);
  };

  recognition.onend = () => {
    if (onStateChange) onStateChange(false);
    // BUG FIX: When user manually stops, if we have interim transcript but no final result,
    // emit it as final so the scoring engine can process it
    if (manualStop && lastTranscript) {
      onResult(lastTranscript, true);
    }
  };

  return {
    start: () => {
      lastTranscript = '';
      manualStop = false;
      try {
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition start warning:', err);
      }
    },
    stop: () => {
      manualStop = true;
      try {
        recognition.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop warning:', err);
      }
    },
    // BUG FIX: destroy() for proper cleanup when component unmounts or prompt changes
    destroy: () => {
      manualStop = false;
      try {
        recognition.abort();
      } catch (err) {
        console.warn('SpeechRecognition abort warning:', err);
      }
    },
    isSupported: true,
    getLastTranscript: () => lastTranscript,
  };
}

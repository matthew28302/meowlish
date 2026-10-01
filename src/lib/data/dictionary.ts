export interface DictionaryEntry {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  vietnamese: string;
  example: string;
  collocation?: string;
  notes?: string;
}

export const DICTIONARY: Record<string, DictionaryEntry> = {
  // IT & Tech terms
  blocker: {
    word: 'blocker',
    phonetic: '/ˈblɑː.kɚ/',
    partOfSpeech: 'noun',
    vietnamese: 'trở ngại, nút thắt cản trở tiến độ công việc',
    example: 'I have a blocker with database credentials.',
    collocation: 'hit a blocker, resolve a blocker',
    notes: 'Thuật ngữ tiêu chuẩn trong Agile/Scrum.',
  },
  refactor: {
    word: 'refactor',
    phonetic: '/ˌriːˈfæk.tɚ/',
    partOfSpeech: 'verb',
    vietnamese: 'tái cấu trúc code (cải thiện thiết kế không đổi chức năng)',
    example: 'We need to refactor the payment gateway integration.',
    collocation: 'refactor code, continuous refactoring',
    notes: 'Trọng âm rơi vào âm tiết thứ hai.',
  },
  bottleneck: {
    word: 'bottleneck',
    phonetic: '/ˈbɑː.t̬əl.nek/',
    partOfSpeech: 'noun',
    vietnamese: 'điểm nghẽn hiệu năng, chỗ thắt cổ chai',
    example: 'Database queries are creating a bottleneck.',
    collocation: 'performance bottleneck',
  },
  'edge case': {
    word: 'edge case',
    phonetic: '/edʒ keɪs/',
    partOfSpeech: 'noun',
    vietnamese: 'trường hợp biên, tình huống hiếm gặp',
    example: 'Make sure our tests cover edge cases.',
    collocation: 'handle edge cases',
  },
  reproduce: {
    word: 'reproduce',
    phonetic: '/ˌriː.prəˈduːs/',
    partOfSpeech: 'verb',
    vietnamese: 'tái hiện (lỗi, bug phần mềm)',
    example: 'Can you reproduce the issue locally?',
    collocation: 'steps to reproduce',
  },
  'root cause': {
    word: 'root cause',
    phonetic: '/ruːt kɑːz/',
    partOfSpeech: 'noun',
    vietnamese: 'nguyên nhân gốc rễ',
    example: 'We must identify the root cause before applying the hotfix.',
    collocation: 'root cause analysis',
  },
  hotfix: {
    word: 'hotfix',
    phonetic: '/ˈhɑːt.fɪks/',
    partOfSpeech: 'noun',
    vietnamese: 'bản vá lỗi nóng trực tiếp trên server production',
    example: 'We rolled out a hotfix to stop data leakage.',
  },
  workaround: {
    word: 'workaround',
    phonetic: '/ˈwɝːk.ə.raʊnd/',
    partOfSpeech: 'noun',
    vietnamese: 'giải pháp thay thế tạm thời',
    example: 'We implemented a temporary workaround while investigating.',
  },
  'pull request': {
    word: 'pull request',
    phonetic: '/pʊl rɪˈkwest/',
    partOfSpeech: 'noun',
    vietnamese: 'yêu cầu gộp code (PR trên GitHub/GitLab)',
    example: 'Could you review my pull request?',
  },
  'sync up': {
    word: 'sync up',
    phonetic: '/sɪŋk ʌp/',
    partOfSpeech: 'phrase',
    vietnamese: 'họp nhanh, kết nối đồng bộ thông tin',
    example: 'Let us sync up for 5 minutes after lunch.',
  },
  'wrap up': {
    word: 'wrap up',
    phonetic: '/ræp ʌp/',
    partOfSpeech: 'phrase',
    vietnamese: 'hoàn tất, khép lại',
    example: 'Let us wrap up today’s discussion.',
  },
  'behind schedule': {
    word: 'behind schedule',
    phonetic: '/bɪˈhaɪnd ˈskedʒ.uːl/',
    partOfSpeech: 'phrase',
    vietnamese: 'chậm tiến độ so với kế hoạch ban đầu',
    example: 'The sprint is slightly behind schedule.',
  },
  'from my perspective': {
    word: 'from my perspective',
    phonetic: '/frʌm maɪ pɚˈspek.tɪv/',
    partOfSpeech: 'phrase',
    vietnamese: 'theo quan điểm / góc nhìn của tôi',
    example: 'From my perspective, this architecture is more scalable.',
  },
  'make sense': {
    word: 'make sense',
    phonetic: '/meɪk sens/',
    partOfSpeech: 'phrase',
    vietnamese: 'hợp lý, có lý, dễ hiểu',
    example: 'Does that suggestion make sense to you?',
  },
  'catch up': {
    word: 'catch up',
    phonetic: '/kætʃ ʌp/',
    partOfSpeech: 'phrase',
    vietnamese: 'gặp gỡ trò chuyện cập nhật tình hình',
    example: 'We should catch up over coffee sometime soon.',
  },
  deployment: {
    word: 'deployment',
    phonetic: '/dɪˈplɔɪ.mənt/',
    partOfSpeech: 'noun',
    vietnamese: 'sự triển khai phần mềm lên máy chủ',
    example: 'The production deployment was completed successfully.',
  },
  scalable: {
    word: 'scalable',
    phonetic: '/ˈskeɪ.lə.bəl/',
    partOfSpeech: 'adjective',
    vietnamese: 'có khả năng mở rộng (chịu tải lớn)',
    example: 'We built a highly scalable microservice system.',
  },
};

// Smart fallback translation generator
export function lookupWord(rawText: string): DictionaryEntry {
  const clean = rawText.trim().toLowerCase();

  if (DICTIONARY[clean]) {
    return DICTIONARY[clean];
  }

  // Check substring or word match
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val;
    }
  }

  // Fallback for general words
  return {
    word: rawText.trim(),
    phonetic: `/${rawText.trim().toLowerCase()}/`,
    partOfSpeech: 'word / phrase',
    vietnamese: `Nghĩa theo ngữ cảnh: ${rawText.trim()}`,
    example: `Context: "${rawText.trim()}" in communication.`,
    notes: 'Từ vựng được chọn từ văn bản giao tiếp.',
  };
}

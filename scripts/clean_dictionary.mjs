import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'data', 'english_learning.db');
const db = new Database(dbPath);

console.log('🧹 BẮT ĐẦU DỌN DẸP VÀ CHUẨN HOÁ TỪ ĐIỂN BÁCH KHOA TOÀN THƯ...');

// 1. Danh sách các từ cốt lõi bị lỗi nghĩa do từ điển cũ và định nghĩa chuẩn hoá tiếng Việt
const CORE_WORD_CORRECTIONS = {
  'a': {
    ipa: '/ə, eɪ/',
    partOfSpeech: 'article',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'một (mạo từ không xác định trước phụ âm)',
    detailedExplanation: 'Mạo từ bất định dùng trước danh từ đếm được số ít bắt đầu bằng một phụ âm (a book, a car, a developer).',
    examples: [
      { en: 'I am a software engineer.', vi: 'Tôi là một kỹ sư phần mềm.' },
      { en: 'She bought a new laptop yesterday.', vi: 'Hôm qua cô ấy đã mua một chiếc laptop mới.' }
    ]
  },
  'an': {
    ipa: '/ən, æn/',
    partOfSpeech: 'article',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'một (mạo từ không xác định trước nguyên âm: u, e, o, a, i)',
    detailedExplanation: 'Mạo từ bất định dùng trước danh từ đếm được số ít bắt đầu bằng nguyên âm hoặc âm câm (an apple, an hour, an API).',
    examples: [
      { en: 'We need to design an intuitive interface.', vi: 'Chúng ta cần thiết kế một giao diện trực quan.' },
      { en: 'He has an interview this afternoon.', vi: 'Anh ấy có một buổi phỏng vấn chiều nay.' }
    ]
  },
  'or': {
    ipa: '/ɔːr/',
    partOfSpeech: 'conjunction',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'hoặc, hay là (liên từ lựa chọn)',
    detailedExplanation: 'Dùng để nối các từ, cụm từ hoặc mệnh đề chỉ sự lựa chọn giữa hai hay nhiều phương án.',
    examples: [
      { en: 'Would you prefer coffee or tea?', vi: 'Bạn thích dùng cà phê hay trà hơn?' },
      { en: 'You can sign in with Google or GitHub.', vi: 'Bạn có thể đăng nhập bằng Google hoặc GitHub.' }
    ]
  },
  'are': {
    ipa: '/ɑːr, ər/',
    partOfSpeech: 'verb',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'thì, là, ở (dạng số nhiều của động từ to be: you/we/they are)',
    detailedExplanation: 'Động từ to be ở thì hiện tại đơn, dùng với các chủ ngữ số nhiều (we, you, they) hoặc danh từ số nhiều.',
    examples: [
      { en: 'They are working on the production deployment.', vi: 'Họ đang thực hiện triển khai lên môi trường production.' },
      { en: 'You are welcome anytime!', vi: 'Bạn luôn được hoan nghênh bất cứ lúc nào!' }
    ]
  },
  'can': {
    ipa: '/kæn, kən/',
    partOfSpeech: 'modal verb / noun',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'có thể (khả năng, cho phép); lon, hộp thiếc',
    detailedExplanation: 'Động từ khuyết thiếu diễn tả khả năng, năng lực hoặc sự xin phép làm điều gì đó; Danh từ: lon nước, lon đồ hộp.',
    examples: [
      { en: 'Can you help me review this pull request?', vi: 'Bạn có thể giúp tôi xem qua pull request này không?' },
      { en: 'I can speak communicative English confidently.', vi: 'Tôi có thể giao tiếp tiếng Anh một cách tự tin.' }
    ]
  },
  'i': {
    ipa: '/aɪ/',
    partOfSpeech: 'pronoun',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'tôi, mình, tớ (đại từ nhân xưng ngôi thứ nhất số ít)',
    detailedExplanation: 'Đại từ nhân xưng làm chủ ngữ ngôi thứ nhất số ít, luôn luôn được viết hoa trong tiếng Anh.',
    examples: [
      { en: 'I am learning English for my career advancement.', vi: 'Tôi đang học tiếng Anh để phát triển sự nghiệp.' },
      { en: 'I think this architecture is scalable.', vi: 'Tôi nghĩ kiến trúc này có khả năng mở rộng tốt.' }
    ]
  },
  'am': {
    ipa: '/æm, əm/',
    partOfSpeech: 'verb',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'thì, là, ở (dạng to be đi với chủ ngữ I: I am)',
    detailedExplanation: 'Động từ to be ở thì hiện tại đơn đi kèm với đại từ ngôi thứ nhất số ít I.',
    examples: [
      { en: 'I am ready for the interview.', vi: 'Tôi đã sẵn sàng cho buổi phỏng vấn.' },
      { en: 'I am currently refactoring the backend services.', vi: 'Tôi hiện đang tái cấu trúc các dịch vụ backend.' }
    ]
  },
  'fit': {
    ipa: '/fɪt/',
    partOfSpeech: 'adjective / verb',
    category: 'workplace',
    categoryLabel: '💼 Công Sở & Đời Sống',
    level: 'A2',
    meaningVi: 'vừa vặn, phù hợp; khoẻ khoắn, cân đối',
    detailedExplanation: 'Tính từ: khoẻ khoắn, phù hợp; Động từ: vừa vặn kích cỡ hoặc thích hợp với vị trí công việc (cultural fit).',
    examples: [
      { en: 'He is a great cultural fit for our engineering team.', vi: 'Anh ấy rất phù hợp về mặt văn hoá với đội ngũ kỹ sư của chúng ta.' },
      { en: 'This task fits well into our current sprint goals.', vi: 'Task này rất phù hợp với mục tiêu sprint hiện tại của chúng ta.' }
    ]
  },
  'let': {
    ipa: '/let/',
    partOfSpeech: 'verb',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'để cho, cho phép (Let me know, Let us go)',
    detailedExplanation: 'Động từ cho phép ai đó làm gì (let + sb + do sth); Câu rủ: Let\'s = Let us (chúng ta hãy).',
    examples: [
      { en: 'Please let me know if you need any clarification.', vi: 'Xin vui lòng cho tôi biết nếu bạn cần làm rõ điều gì.' },
      { en: 'Let us sync up after the daily standup.', vi: 'Chúng ta hãy kết nối nhanh sau buổi họp standup nhé.' }
    ]
  },
  'will': {
    ipa: '/wɪl/',
    partOfSpeech: 'modal verb / noun',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'sẽ (thì tương lai đơn); ý chí, quyết tâm, di chúc',
    detailedExplanation: 'Động từ khuyết thiếu diễn tả hành động sẽ xảy ra trong tương lai hoặc quyết định tức thì tại thời điểm nói.',
    examples: [
      { en: 'We will release the update by Friday.', vi: 'Chúng tôi sẽ phát hành bản cập nhật trước thứ Sáu.' },
      { en: 'I will send you the meeting notes shortly.', vi: 'Tôi sẽ gửi cho bạn biên bản cuộc họp ngay sau đây.' }
    ]
  },
  'may': {
    ipa: '/meɪ/',
    partOfSpeech: 'modal verb / noun',
    category: 'workplace',
    categoryLabel: '💼 Công Sở & Lịch Thiệp',
    level: 'A2',
    meaningVi: 'có thể (xin phép lịch sự); tháng Năm',
    detailedExplanation: 'Động từ khuyết thiếu diễn đạt sự xin phép trang trọng (May I ask...) hoặc khả năng không chắc chắn (It may rain).',
    examples: [
      { en: 'May I ask a question regarding the database schema?', vi: 'Tôi có thể hỏi một câu về cấu trúc cơ sở dữ liệu được không?' },
      { en: 'The release date may be adjusted depending on testing results.', vi: 'Ngày phát hành có thể được điều chỉnh tuỳ vào kết quả kiểm thử.' }
    ]
  },
  'do': {
    ipa: '/duː, də/',
    partOfSpeech: 'verb / auxiliary verb',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'làm, thực hiện; trợ động từ trong câu hỏi và phủ định',
    detailedExplanation: 'Động từ chỉ hành động thực hiện việc gì; Trợ động từ dùng tạo câu hỏi hoặc phủ định ở thì hiện tại đơn.',
    examples: [
      { en: 'What do you think about this solution?', vi: 'Bạn nghĩ gì về giải pháp này?' },
      { en: 'I do not see any performance issues.', vi: 'Tôi không thấy bất kỳ vấn đề hiệu năng nào.' }
    ]
  },
  'so': {
    ipa: '/soʊ/',
    partOfSpeech: 'adverb / conjunction',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'vì vậy, cho nên; đến mức như thế, rất',
    detailedExplanation: 'Liên từ chỉ kết quả (vì thế, do đó); Trạng từ chỉ mức độ (so good, so fast).',
    examples: [
      { en: 'The build failed, so we rolled back to the previous version.', vi: 'Bản build bị lỗi, vì vậy chúng tôi đã quay về phiên bản trước.' },
      { en: 'Thank you so much for your assistance!', vi: 'Cảm ơn bạn rất nhiều vì sự hỗ trợ!' }
    ]
  },
  'toward': {
    ipa: '/təˈwɔːrd, tɔːrd/',
    partOfSpeech: 'preposition',
    category: 'workplace',
    categoryLabel: '💼 Công Sở & Giao Tiếp',
    level: 'B1',
    meaningVi: 'hướng về phía, tiến tới, đối với',
    detailedExplanation: 'Giới từ chỉ hướng chuyển động hoặc thái độ hướng tới mục tiêu/đối tượng nào đó.',
    examples: [
      { en: 'We are making great progress toward our quarterly milestones.', vi: 'Chúng ta đang đạt tiến độ rất tốt hướng tới các cột mốc quý.' }
    ]
  },
  'towards': {
    ipa: '/təˈwɔːrdz, tɔːrdz/',
    partOfSpeech: 'preposition',
    category: 'workplace',
    categoryLabel: '💼 Công Sở & Giao Tiếp',
    level: 'B1',
    meaningVi: 'về phía, hướng tới (biến thể phổ biến trong tiếng Anh Anh)',
    detailedExplanation: 'Biến thể ngữ pháp đồng nghĩa với "toward", rất hay gặp trong văn cảnh công sở và đời sống.',
    examples: [
      { en: 'The team worked collaboratively towards the common deadline.', vi: 'Nhóm đã phối hợp làm việc hướng tới hạn chót chung.' }
    ]
  },
  'page': {
    ipa: '/peɪdʒ/',
    partOfSpeech: 'noun / verb',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Tech',
    level: 'A1',
    meaningVi: 'trang (sách, tài liệu, trang web)',
    detailedExplanation: 'Danh từ: một mặt của tờ giấy, hoặc trang web (web page, landing page); Động từ: gửi tin nhắn nhắn gọi.',
    examples: [
      { en: 'The landing page loads in less than 500 milliseconds.', vi: 'Trang đích tải trong chưa đầy 500 mili-giây.' }
    ]
  },
  'free': {
    ipa: '/friː/',
    partOfSpeech: 'adjective / verb',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'miễn phí; tự do; rảnh rỗi (không bận)',
    detailedExplanation: 'Tính từ: không mất tiền (free of charge), không bận rộn (Are you free tomorrow?), tự do.',
    examples: [
      { en: 'Are you free for a quick 10-minute call this afternoon?', vi: 'Chiều nay bạn có rảnh để gọi nhanh 10 phút không?' },
      { en: 'This open-source framework is completely free to use.', vi: 'Framework mã nguồn mở này hoàn toàn miễn phí sử dụng.' }
    ]
  },
  'about': {
    ipa: '/əˈbaʊt/',
    partOfSpeech: 'preposition / adverb',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Căn Bản',
    level: 'A1',
    meaningVi: 'về (chủ đề gì); khoảng chừng, xấp xỉ',
    detailedExplanation: 'Giới từ chỉ chủ đề (talk about work); Trạng từ chỉ ước lượng số lượng/thời gian (about 2 hours).',
    examples: [
      { en: 'We had an insightful discussion about system architecture.', vi: 'Chúng tôi đã có cuộc thảo luận sâu sắc về kiến trúc hệ thống.' },
      { en: 'The migration took about thirty minutes.', vi: 'Việc chuyển đổi dữ liệu mất khoảng ba mươi phút.' }
    ]
  },
  're': {
    ipa: '/riː/',
    partOfSpeech: 'preposition',
    category: 'workplace',
    categoryLabel: '💼 Công Sở & Email',
    level: 'B1',
    meaningVi: 'về vấn đề, hồi đáp (tiêu đề email: Re: Meeting)',
    detailedExplanation: 'Từ viết tắt gốc Latin (in re) dùng trong thư từ, email công sở để chỉ chủ đề đang được phản hồi.',
    examples: [
      { en: 'Re: Sprint 24 Planning - Please find the agenda attached.', vi: 'V/v: Lập kế hoạch Sprint 24 - Vui lòng xem chương trình họp đính kèm.' }
    ]
  }
};

// 2. Thực hiện lọc và xoá các từ vô nghĩa / rác trong SQLite
console.log('🗑️ Đang phân tích và xoá các từ rác / vô nghĩa...');

// 2.1 Xoá các ký tự đơn lẻ (chữ cái rời rạc vô nghĩa: b, c, d, e, f, g, h, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z)
const delSingleLetters = db.prepare("DELETE FROM dictionary_entries WHERE length(word) = 1 AND word NOT IN ('a', 'i')");
const singleRes = delSingleLetters.run();
console.log(`- Đã xoá ${singleRes.changes} chữ cái đơn lẻ vô nghĩa (b, c, d, x, z...).`);

// 2.2 Xoá các từ ghép cổ lỗ sĩ, không dùng trong giao tiếp thực tế
const archaicJunk = [
  'about-sledge', 'adder-spit', 'addle-head', 'addle-pate', 'addle-brained', 'ague-cake',
  'air-ball', 'air-barrage', 'basket-work', 'book-work', 'booking-office', 'brain-work',
  'brass-works', 'breastwork', 'brickwork', 'by-work', 'cabinet-work', 'camp-meeting',
  'churn-staff', 'collar-work', 'copper-works', 'day-work', 'distaff', 'drawn-work',
  'dye-works', 'earthwork', 'falsework', 'falstaffian', 'fancy-work', 'fellow-worker',
  'field-officer', 'field-work', 'field-worker', 'fire-office', 'flag-officer', 'footwork',
  'fretwork', 'frost-work', 'gas-works', 'gate-meeting', 'acid-resisting', 'a-going',
  'a-plenty', 'a-power', 'aard-wolf', 'advance-guard', 'after-grass', 'after-pains',
  'air-balloon', 'ab', 'ea', 'lo', 'apr', 'vol'
];

const delArchaic = db.prepare(`DELETE FROM dictionary_entries WHERE word IN (${archaicJunk.map(() => '?').join(',')})`);
const archaicRes = delArchaic.run(...archaicJunk);
console.log(`- Đã xoá ${archaicRes.changes} từ ghép cổ lỗ sĩ, rác rưởi.`);

// 2.3 Xoá các mục có nghĩa bị đứt đoạn / lỗi cú pháp scraper (như "resisting)", "pate)", "dʤi:z/")
const delBroken = db.prepare(`
  DELETE FROM dictionary_entries 
  WHERE meaning_vi LIKE '%resisting)%' 
     OR meaning_vi LIKE '%pate)%' 
     OR meaning_vi LIKE '%dʤi:z/%'
     OR meaning_vi LIKE '%(như)[air bail]%'
     OR length(trim(meaning_vi)) < 2
`);
const brokenRes = delBroken.run();
console.log(`- Đã xoá ${brokenRes.changes} mục từ có định nghĩa bị lỗi phân tích cú pháp.`);

// 3. Cập nhật các từ cốt lõi với định nghĩa chuẩn giao tiếp
console.log('✨ Đang cập nhật lại định nghĩa chuẩn cho các từ tiếng Anh cốt lõi...');
const updateStmt = db.prepare(`
  UPDATE dictionary_entries
  SET ipa = ?, part_of_speech = ?, category = ?, category_label = ?, level = ?,
      meaning_vi = ?, detailed_explanation = ?, examples_json = ?, data_json = ?
  WHERE word = ?
`);

for (const [w, info] of Object.entries(CORE_WORD_CORRECTIONS)) {
  const jsonStr = JSON.stringify({
    word: w,
    ipa: info.ipa,
    partOfSpeech: info.partOfSpeech,
    category: info.category,
    categoryLabel: info.categoryLabel,
    level: info.level,
    meaningVi: info.meaningVi,
    detailedExplanation: info.detailedExplanation,
    senses: [
      {
        enDef: info.detailedExplanation,
        viTrans: info.meaningVi,
        examples: info.examples.map(e => e.en)
      }
    ],
    exampleSentences: info.examples.map(e => ({ en: e.en, vi: e.vi, context: info.categoryLabel })),
    audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w)}&type=2`,
    source: 'communicative_curated'
  });

  updateStmt.run(
    info.ipa,
    info.partOfSpeech,
    info.category,
    info.categoryLabel,
    info.level,
    info.meaningVi,
    info.detailedExplanation,
    JSON.stringify(info.examples),
    jsonStr,
    w
  );
}
console.log(`- Đã hiệu chỉnh hoàn hảo ${Object.keys(CORE_WORD_CORRECTIONS).length} từ ngữ cốt lõi nhất.`);

// 4. Đồng bộ lại FTS5 Search Index
console.log('🔄 Đang đồng bộ lại chỉ mục tìm kiếm FTS5...');
db.exec(`
  DROP TABLE IF EXISTS dictionary_fts;
  CREATE VIRTUAL TABLE dictionary_fts USING fts5(
    word,
    meaning_vi,
    content='dictionary_entries',
    content_rowid='rowid'
  );
  INSERT INTO dictionary_fts(rowid, word, meaning_vi)
  SELECT rowid, word, meaning_vi FROM dictionary_entries;
`);
console.log('- Đã rebuild toàn bộ FTS index.');

// 5. Tuyển chọn danh sách Showcase cực chuẩn cho src/lib/data/encyclopedia.ts
console.log('💎 Đang tuyển chọn bộ dữ liệu Showcase chuẩn cho Bách khoa toàn thư...');

// Lấy những từ chất lượng cao nhất theo từng chuyên mục:
// 1) IT Dev & Kiến trúc (algorithm, api, async, backend, cache, database, docker, framework, kubernetes, microservice, refactor, scalability, webhook...)
// 2) IT Scrum & Agile (agile, backlog, blocker, burndown, increment, iteration, kanban, milestone, mvp, retrospective, roadmap, sprint, standup, velocity, workaround...)
// 3) Công sở & Phỏng vấn (agenda, benchmark, brainstorm, collaborate, compromise, deadline, facilitate, feedback, negotiate, prioritize, proposal, revenue, stakeholder, timeline...)
// 4) Giao tiếp đời sống & Collocations (appreciate, apologize, celebrate, delicious, feasible, grateful, hesitate, impressive, marvelous, recommend, spontaneous, wonderful...)
// 5) Phrasal Verbs & Idioms thông dụng nhất

const curatedWordsSql = `
  SELECT word, ipa, part_of_speech as partOfSpeech, category, category_label as categoryLabel,
         level, meaning_vi as meaningVi, detailed_explanation as detailedExplanation,
         examples_json, collocations_json, audio_url as audioUrl
  FROM dictionary_entries
  WHERE length(word) >= 3
    AND word NOT LIKE '%-%'
    AND meaning_vi NOT LIKE '%(từ cổ%'
    AND meaning_vi NOT LIKE '%ở huy hiệu%'
    AND meaning_vi NOT LIKE '%thực vật học%'
    AND meaning_vi NOT LIKE '%giải phẫu%'
    AND meaning_vi NOT LIKE '%khoáng vật%'
  ORDER BY
    CASE category
      WHEN 'it-dev' THEN 1
      WHEN 'it-scrum' THEN 2
      WHEN 'workplace' THEN 3
      WHEN 'toeic' THEN 4
      WHEN 'daily' THEN 5
      ELSE 6
    END,
    length(word) ASC
`;

const candidateRows = db.prepare(curatedWordsSql).all();
console.log(`- Tìm thấy ${candidateRows.length} từ ứng viên chất lượng cao.`);

// Lọc 50 từ mỗi chuyên mục để có Showcase 350-400 từ thực sự tinh hoa, không rác rưởi
const categoryBuckets = {};
const finalShowcase = [];

// Thêm các từ cốt lõi đã được sửa trước
for (const [w, info] of Object.entries(CORE_WORD_CORRECTIONS)) {
  finalShowcase.push({
    id: `enc-${w}`,
    word: w,
    ipa: info.ipa,
    partOfSpeech: info.partOfSpeech,
    category: info.category,
    categoryLabel: info.categoryLabel,
    meaningVi: info.meaningVi,
    detailedExplanation: info.detailedExplanation,
    collocations: [`common ${w}`, `use ${w} in sentence`],
    exampleSentences: info.examples.map(e => ({ en: e.en, vi: e.vi, context: info.categoryLabel })),
    level: info.level,
    audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w)}&type=2`
  });
}

for (const row of candidateRows) {
  if (CORE_WORD_CORRECTIONS[row.word]) continue; // đã thêm ở trên
  const cat = row.category;
  categoryBuckets[cat] = (categoryBuckets[cat] || 0) + 1;

  // Giới hạn số từ mỗi danh mục để đảm bảo cân bằng
  const limit = (cat === 'it-dev' || cat === 'it-scrum' || cat === 'workplace' || cat === 'toeic') ? 60 : 40;
  if (categoryBuckets[cat] <= limit) {
    let parsedExamples = [];
    try {
      parsedExamples = JSON.parse(row.examples_json || '[]');
    } catch {
      parsedExamples = [];
    }

    let parsedCollocations = [];
    try {
      parsedCollocations = JSON.parse(row.collocations_json || '[]');
    } catch {
      parsedCollocations = [`effective ${row.word}`, `${row.word} in context`];
    }

    if (parsedExamples.length === 0) {
      parsedExamples = [
        { en: `We often use "${row.word}" in daily and professional communication.`, vi: `Chúng ta thường dùng từ "${row.word}" trong giao tiếp hàng ngày và công việc.` }
      ];
    }

    finalShowcase.push({
      id: `enc-${row.word}`,
      word: row.word,
      ipa: row.ipa || '/.../',
      partOfSpeech: row.partOfSpeech || 'noun',
      category: row.category,
      categoryLabel: row.categoryLabel || 'Từ Vựng Thực Chiến',
      meaningVi: row.meaningVi,
      detailedExplanation: row.detailedExplanation || row.meaningVi,
      collocations: parsedCollocations,
      exampleSentences: parsedExamples.map(e => ({ en: e.en, vi: e.vi, context: row.categoryLabel || 'Giao Tiếp' })),
      level: row.level || 'B1',
      audioUrl: row.audioUrl || `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(row.word)}&type=2`
    });
  }
}

console.log(`⭐ Tổng số mục từ trong Showcase sạch: ${finalShowcase.length} từ tinh hoa!`);

// 6. Ghi đè vào src/lib/data/encyclopedia.ts
const targetFile = path.join(projectRoot, 'src', 'lib', 'data', 'encyclopedia.ts');
const fileContent = `export interface EncyclopediaEntry {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  category: 'it-dev' | 'it-scrum' | 'it-arch' | 'toeic' | 'vstep' | 'workplace' | 'daily' | 'phrasal-verbs' | 'idioms' | 'online' | string;
  categoryLabel: string;
  meaningVi: string;
  detailedExplanation: string;
  collocations: string[];
  synonyms?: string[];
  antonyms?: string[];
  exampleSentences: {
    en: string;
    vi: string;
    context: string;
  }[];
  proTips?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | string;
  audioUrl?: string | null;
}

export const ENCYCLOPEDIA_DATA: EncyclopediaEntry[] = ${JSON.stringify(finalShowcase, null, 2)};
`;

fs.writeFileSync(targetFile, fileContent, 'utf-8');
console.log(`🎉 Đã cập nhật thành công ${targetFile}!`);

const remainingCount = db.prepare("SELECT COUNT(*) as c FROM dictionary_entries").get().c;
console.log(`📊 Tổng số từ trong SQLite DB sau dọn dẹp: ${remainingCount} từ chuẩn.`);

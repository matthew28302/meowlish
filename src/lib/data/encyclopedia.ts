export interface EncyclopediaEntry {
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

export const ENCYCLOPEDIA_DATA: EncyclopediaEntry[] = [
  {
    "id": "enc-a",
    "word": "a",
    "ipa": "/ə, eɪ/",
    "partOfSpeech": "article",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "một (mạo từ không xác định trước phụ âm)",
    "detailedExplanation": "Mạo từ bất định dùng trước danh từ đếm được số ít bắt đầu bằng một phụ âm (a book, a car, a developer).",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "I am a software engineer.",
        "vi": "Tôi là một kỹ sư phần mềm.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "She bought a new laptop yesterday.",
        "vi": "Hôm qua cô ấy đã mua một chiếc laptop mới.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=a&type=2"
  },
  {
    "id": "enc-an",
    "word": "an",
    "ipa": "/ən, æn/",
    "partOfSpeech": "article",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "một (mạo từ không xác định trước nguyên âm: u, e, o, a, i)",
    "detailedExplanation": "Mạo từ bất định dùng trước danh từ đếm được số ít bắt đầu bằng nguyên âm hoặc âm câm (an apple, an hour, an API).",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We need to design an intuitive interface.",
        "vi": "Chúng ta cần thiết kế một giao diện trực quan.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "He has an interview this afternoon.",
        "vi": "Anh ấy có một buổi phỏng vấn chiều nay.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=an&type=2"
  },
  {
    "id": "enc-or",
    "word": "or",
    "ipa": "/ɔːr/",
    "partOfSpeech": "conjunction",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "hoặc, hay là (liên từ lựa chọn)",
    "detailedExplanation": "Dùng để nối các từ, cụm từ hoặc mệnh đề chỉ sự lựa chọn giữa hai hay nhiều phương án.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "Would you prefer coffee or tea?",
        "vi": "Bạn thích dùng cà phê hay trà hơn?",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "You can sign in with Google or GitHub.",
        "vi": "Bạn có thể đăng nhập bằng Google hoặc GitHub.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=or&type=2"
  },
  {
    "id": "enc-are",
    "word": "are",
    "ipa": "/ɑːr, ər/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "thì, là, ở (dạng số nhiều của động từ to be: you/we/they are)",
    "detailedExplanation": "Động từ to be ở thì hiện tại đơn, dùng với các chủ ngữ số nhiều (we, you, they) hoặc danh từ số nhiều.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "They are working on the production deployment.",
        "vi": "Họ đang thực hiện triển khai lên môi trường production.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "You are welcome anytime!",
        "vi": "Bạn luôn được hoan nghênh bất cứ lúc nào!",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=are&type=2"
  },
  {
    "id": "enc-can",
    "word": "can",
    "ipa": "/kæn, kən/",
    "partOfSpeech": "modal verb / noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "có thể (khả năng, cho phép); lon, hộp thiếc",
    "detailedExplanation": "Động từ khuyết thiếu diễn tả khả năng, năng lực hoặc sự xin phép làm điều gì đó; Danh từ: lon nước, lon đồ hộp.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "Can you help me review this pull request?",
        "vi": "Bạn có thể giúp tôi xem qua pull request này không?",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "I can speak communicative English confidently.",
        "vi": "Tôi có thể giao tiếp tiếng Anh một cách tự tin.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=can&type=2"
  },
  {
    "id": "enc-i",
    "word": "i",
    "ipa": "/aɪ/",
    "partOfSpeech": "pronoun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "tôi, mình, tớ (đại từ nhân xưng ngôi thứ nhất số ít)",
    "detailedExplanation": "Đại từ nhân xưng làm chủ ngữ ngôi thứ nhất số ít, luôn luôn được viết hoa trong tiếng Anh.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "I am learning English for my career advancement.",
        "vi": "Tôi đang học tiếng Anh để phát triển sự nghiệp.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "I think this architecture is scalable.",
        "vi": "Tôi nghĩ kiến trúc này có khả năng mở rộng tốt.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=i&type=2"
  },
  {
    "id": "enc-am",
    "word": "am",
    "ipa": "/æm, əm/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "thì, là, ở (dạng to be đi với chủ ngữ I: I am)",
    "detailedExplanation": "Động từ to be ở thì hiện tại đơn đi kèm với đại từ ngôi thứ nhất số ít I.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "I am ready for the interview.",
        "vi": "Tôi đã sẵn sàng cho buổi phỏng vấn.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "I am currently refactoring the backend services.",
        "vi": "Tôi hiện đang tái cấu trúc các dịch vụ backend.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=am&type=2"
  },
  {
    "id": "enc-fit",
    "word": "fit",
    "ipa": "/fɪt/",
    "partOfSpeech": "adjective / verb",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Đời Sống",
    "meaningVi": "vừa vặn, phù hợp; khoẻ khoắn, cân đối",
    "detailedExplanation": "Tính từ: khoẻ khoắn, phù hợp; Động từ: vừa vặn kích cỡ hoặc thích hợp với vị trí công việc (cultural fit).",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "He is a great cultural fit for our engineering team.",
        "vi": "Anh ấy rất phù hợp về mặt văn hoá với đội ngũ kỹ sư của chúng ta.",
        "context": "💼 Công Sở & Đời Sống"
      },
      {
        "en": "This task fits well into our current sprint goals.",
        "vi": "Task này rất phù hợp với mục tiêu sprint hiện tại của chúng ta.",
        "context": "💼 Công Sở & Đời Sống"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=fit&type=2"
  },
  {
    "id": "enc-let",
    "word": "let",
    "ipa": "/let/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "để cho, cho phép (Let me know, Let us go)",
    "detailedExplanation": "Động từ cho phép ai đó làm gì (let + sb + do sth); Câu rủ: Let's = Let us (chúng ta hãy).",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "Please let me know if you need any clarification.",
        "vi": "Xin vui lòng cho tôi biết nếu bạn cần làm rõ điều gì.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "Let us sync up after the daily standup.",
        "vi": "Chúng ta hãy kết nối nhanh sau buổi họp standup nhé.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=let&type=2"
  },
  {
    "id": "enc-will",
    "word": "will",
    "ipa": "/wɪl/",
    "partOfSpeech": "modal verb / noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "sẽ (thì tương lai đơn); ý chí, quyết tâm, di chúc",
    "detailedExplanation": "Động từ khuyết thiếu diễn tả hành động sẽ xảy ra trong tương lai hoặc quyết định tức thì tại thời điểm nói.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We will release the update by Friday.",
        "vi": "Chúng tôi sẽ phát hành bản cập nhật trước thứ Sáu.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "I will send you the meeting notes shortly.",
        "vi": "Tôi sẽ gửi cho bạn biên bản cuộc họp ngay sau đây.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=will&type=2"
  },
  {
    "id": "enc-may",
    "word": "may",
    "ipa": "/meɪ/",
    "partOfSpeech": "modal verb / noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Lịch Thiệp",
    "meaningVi": "có thể (xin phép lịch sự); tháng Năm",
    "detailedExplanation": "Động từ khuyết thiếu diễn đạt sự xin phép trang trọng (May I ask...) hoặc khả năng không chắc chắn (It may rain).",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "May I ask a question regarding the database schema?",
        "vi": "Tôi có thể hỏi một câu về cấu trúc cơ sở dữ liệu được không?",
        "context": "💼 Công Sở & Lịch Thiệp"
      },
      {
        "en": "The release date may be adjusted depending on testing results.",
        "vi": "Ngày phát hành có thể được điều chỉnh tuỳ vào kết quả kiểm thử.",
        "context": "💼 Công Sở & Lịch Thiệp"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=may&type=2"
  },
  {
    "id": "enc-do",
    "word": "do",
    "ipa": "/duː, də/",
    "partOfSpeech": "verb / auxiliary verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "làm, thực hiện; trợ động từ trong câu hỏi và phủ định",
    "detailedExplanation": "Động từ chỉ hành động thực hiện việc gì; Trợ động từ dùng tạo câu hỏi hoặc phủ định ở thì hiện tại đơn.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "What do you think about this solution?",
        "vi": "Bạn nghĩ gì về giải pháp này?",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "I do not see any performance issues.",
        "vi": "Tôi không thấy bất kỳ vấn đề hiệu năng nào.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=do&type=2"
  },
  {
    "id": "enc-so",
    "word": "so",
    "ipa": "/soʊ/",
    "partOfSpeech": "adverb / conjunction",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "vì vậy, cho nên; đến mức như thế, rất",
    "detailedExplanation": "Liên từ chỉ kết quả (vì thế, do đó); Trạng từ chỉ mức độ (so good, so fast).",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "The build failed, so we rolled back to the previous version.",
        "vi": "Bản build bị lỗi, vì vậy chúng tôi đã quay về phiên bản trước.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "Thank you so much for your assistance!",
        "vi": "Cảm ơn bạn rất nhiều vì sự hỗ trợ!",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=so&type=2"
  },
  {
    "id": "enc-toward",
    "word": "toward",
    "ipa": "/təˈwɔːrd, tɔːrd/",
    "partOfSpeech": "preposition",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Giao Tiếp",
    "meaningVi": "hướng về phía, tiến tới, đối với",
    "detailedExplanation": "Giới từ chỉ hướng chuyển động hoặc thái độ hướng tới mục tiêu/đối tượng nào đó.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We are making great progress toward our quarterly milestones.",
        "vi": "Chúng ta đang đạt tiến độ rất tốt hướng tới các cột mốc quý.",
        "context": "💼 Công Sở & Giao Tiếp"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=toward&type=2"
  },
  {
    "id": "enc-towards",
    "word": "towards",
    "ipa": "/təˈwɔːrdz, tɔːrdz/",
    "partOfSpeech": "preposition",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Giao Tiếp",
    "meaningVi": "về phía, hướng tới (biến thể phổ biến trong tiếng Anh Anh)",
    "detailedExplanation": "Biến thể ngữ pháp đồng nghĩa với \"toward\", rất hay gặp trong văn cảnh công sở và đời sống.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "The team worked collaboratively towards the common deadline.",
        "vi": "Nhóm đã phối hợp làm việc hướng tới hạn chót chung.",
        "context": "💼 Công Sở & Giao Tiếp"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=towards&type=2"
  },
  {
    "id": "enc-page",
    "word": "page",
    "ipa": "/peɪdʒ/",
    "partOfSpeech": "noun / verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Tech",
    "meaningVi": "trang (sách, tài liệu, trang web)",
    "detailedExplanation": "Danh từ: một mặt của tờ giấy, hoặc trang web (web page, landing page); Động từ: gửi tin nhắn nhắn gọi.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "The landing page loads in less than 500 milliseconds.",
        "vi": "Trang đích tải trong chưa đầy 500 mili-giây.",
        "context": "☕ Đời Sống & Tech"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=page&type=2"
  },
  {
    "id": "enc-free",
    "word": "free",
    "ipa": "/friː/",
    "partOfSpeech": "adjective / verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "miễn phí; tự do; rảnh rỗi (không bận)",
    "detailedExplanation": "Tính từ: không mất tiền (free of charge), không bận rộn (Are you free tomorrow?), tự do.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "Are you free for a quick 10-minute call this afternoon?",
        "vi": "Chiều nay bạn có rảnh để gọi nhanh 10 phút không?",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "This open-source framework is completely free to use.",
        "vi": "Framework mã nguồn mở này hoàn toàn miễn phí sử dụng.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=free&type=2"
  },
  {
    "id": "enc-about",
    "word": "about",
    "ipa": "/əˈbaʊt/",
    "partOfSpeech": "preposition / adverb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Căn Bản",
    "meaningVi": "về (chủ đề gì); khoảng chừng, xấp xỉ",
    "detailedExplanation": "Giới từ chỉ chủ đề (talk about work); Trạng từ chỉ ước lượng số lượng/thời gian (about 2 hours).",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We had an insightful discussion about system architecture.",
        "vi": "Chúng tôi đã có cuộc thảo luận sâu sắc về kiến trúc hệ thống.",
        "context": "☕ Đời Sống & Căn Bản"
      },
      {
        "en": "The migration took about thirty minutes.",
        "vi": "Việc chuyển đổi dữ liệu mất khoảng ba mươi phút.",
        "context": "☕ Đời Sống & Căn Bản"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=about&type=2"
  },
  {
    "id": "enc-re",
    "word": "re",
    "ipa": "/riː/",
    "partOfSpeech": "preposition",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Email",
    "meaningVi": "về vấn đề, hồi đáp (tiêu đề email: Re: Meeting)",
    "detailedExplanation": "Từ viết tắt gốc Latin (in re) dùng trong thư từ, email công sở để chỉ chủ đề đang được phản hồi.",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "Re: Sprint 24 Planning - Please find the agenda attached.",
        "vi": "V/v: Lập kế hoạch Sprint 24 - Vui lòng xem chương trình họp đính kèm.",
        "context": "💼 Công Sở & Email"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=re&type=2"
  },
  {
    "id": "enc-web",
    "word": "web",
    "ipa": "/web/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "vi dệt; tấm vi",
    "detailedExplanation": "vi dệt; tấm vi; súc giấy, cuộn giấy lớn; (động vật học) mạng; (động vật học) t (lông chim)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "web paper",
        "vi": "giấy súc (chưa cắt ra từng tờ)",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "spider's web",
        "vi": "mạng nhện",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=web&type=2"
  },
  {
    "id": "enc-log",
    "word": "log",
    "ipa": "/lɔg/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "khúc gỗ mới đốn, khúc gỗ mới xẻ",
    "detailedExplanation": "khúc gỗ mới đốn, khúc gỗ mới xẻ; (hàng hải) máy đo tốc độ (tàu); (như) log-book; người đần, người ngu, người ngớ ngẩn",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "in the log",
        "vi": "còn chưa xẻ",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=log&type=2"
  },
  {
    "id": "enc-bit",
    "word": "bit",
    "ipa": "/bit/",
    "partOfSpeech": "adjective",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "miếng (thức ăn...); mảnh mẫu",
    "detailedExplanation": "miếng (thức ăn...); mảnh mẫu; một chút, một tí; đoạn ngắn (của một vai kịch nói, trong sách...); (một) góc phong cảnh (thực hoặc vẽ)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a dainty bit",
        "vi": "một miếng ngon",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "a bit of wood",
        "vi": "một mẫu gỗ",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "a bit of string",
        "vi": "một mẫu dây",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bit&type=2"
  },
  {
    "id": "enc-zip",
    "word": "zip",
    "ipa": "/zip/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "tiếng rít (của đạn bay); tiếng xé vải",
    "detailedExplanation": "tiếng rít (của đạn bay); tiếng xé vải; (nghĩa bóng) sức sống, nghị lực; rít, vèo (như đạn bay)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to zip past",
        "vi": "chạy vụt qua (xe); vèo qua, rít qua (đạn)",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=zip&type=2"
  },
  {
    "id": "enc-bug",
    "word": "bug",
    "ipa": "/bʌg/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "con rệp",
    "detailedExplanation": "con rệp; (từ Mỹ,nghĩa Mỹ) sâu bọ; (từ Mỹ,nghĩa Mỹ),  (thông tục) lỗi kỹ thuật, thiếu sót về kỹ thuật; (từ lóng) ý nghĩ điên rồ; sự điên rồ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to go bugs",
        "vi": "hoá điên, mất trí",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bug&type=2"
  },
  {
    "id": "enc-tag",
    "word": "tag",
    "ipa": "/tæ/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "sắt bịt đầu (dây giày...)",
    "detailedExplanation": "sắt bịt đầu (dây giày...); mép khuy giày ủng; thẻ ghi tên và địa chỉ (buộc vào va li...); mảnh (vải, giấy, da...) buộc lòng thòng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "price tag",
        "vi": "thẻ ghi giá tiền",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "old tag",
        "vi": "ngạn ngữ, tục ngữ",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to tag together",
        "vi": "buộc vào (khâu vào, đính vào) với nhau",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tag&type=2"
  },
  {
    "id": "enc-sql",
    "word": "sql",
    "ipa": "/sql/",
    "partOfSpeech": "word",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "Ngôn ngữ vấn đáp do IBM soạn thảo được sử dụng rộng rãi trong máy tính lớn và hệ thống máy tính mini SQL đang được trang bị trong các mạng khách/chủ như là một phương pháp làm cho các máy tính cá nhân có khả năng thâm nhập vào các tài nguyên của các cơ sở dữ liệu hợp tác",
    "detailedExplanation": "Ngôn ngữ vấn đáp do IBM soạn thảo được sử dụng rộng rãi trong máy tính lớn và hệ thống máy tính mini SQL đang được trang bị trong các mạng khách/chủ như là một phương pháp làm cho các máy tính cá nhân có khả năng thâm nhập vào các tài nguyên của các cơ sở dữ liệu hợp tác",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'sql' in communication.",
        "vi": "Chúng ta thường gặp từ 'sql' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=sql&type=2"
  },
  {
    "id": "enc-ram",
    "word": "ram",
    "ipa": "/ræm/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cừu đực (chưa thiến)",
    "detailedExplanation": "cừu đực (chưa thiến); (hàng hải) mũi nhọn (của tàu chiến để đâm thủng hông tàu địch); tàu chiến có mũi nhọn; (kỹ thuật) đấm nện; búa đóng cọc, búa đập, búa thuỷ động; sức nện của búa đóng cọc",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to ram one's clothes into a bag",
        "vi": "nhét quần áo vào một cái túi",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to ram one's head against the wall",
        "vi": "đụng đầu vào tường",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ram&type=2"
  },
  {
    "id": "enc-api",
    "word": "api",
    "ipa": "/api/",
    "partOfSpeech": "word",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "(vt của Application Programming Interface)giao diện chương trình ứng dụng",
    "detailedExplanation": "(vt của Application Programming Interface)giao diện chương trình ứng dụng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'api' in communication.",
        "vi": "Chúng ta thường gặp từ 'api' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=api&type=2"
  },
  {
    "id": "enc-tcp",
    "word": "tcp",
    "ipa": "/ip",
    "partOfSpeech": "word",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "Một tập các giao thức dùng cho quá trình phát truyền và sửa lỗi đối với các dữ liệu, cho phép chuyển dữ liệu từ máy tính được ghép với mạng Internet sang các máy tính khác",
    "detailedExplanation": "Một tập các giao thức dùng cho quá trình phát truyền và sửa lỗi đối với các dữ liệu, cho phép chuyển dữ liệu từ máy tính được ghép với mạng Internet sang các máy tính khác",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'tcp' in communication.",
        "vi": "Chúng ta thường gặp từ 'tcp' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tcp&type=2"
  },
  {
    "id": "enc-ren",
    "word": "ren",
    "ipa": "/ren/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "số nhiều renes",
    "detailedExplanation": "số nhiều renes; (giải phẫu) học thận; (tin học) viết tắt của rename : đặt tên lại",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'ren' in communication.",
        "vi": "Chúng ta thường gặp từ 'ren' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ren&type=2"
  },
  {
    "id": "enc-list",
    "word": "list",
    "ipa": "/list/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "trạng thái nghiêng; mặt nghiêng",
    "detailedExplanation": "trạng thái nghiêng; mặt nghiêng; mép vải; dải; mép vải nhét khe cửa; (số nhiều) hàng rào bao quanh trường đấu; trường đấu, vũ đài",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to have a list",
        "vi": "(hàng hải) nghiêng về một bên",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "this wall has a decided list",
        "vi": "bức tường này nghiêng hẳn về một bên",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to line edges of door with list",
        "vi": "bịt khe cửa bằng mép vửi (cho khỏi gió lùa)",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=list&type=2"
  },
  {
    "id": "enc-data",
    "word": "data",
    "ipa": "/'deitə/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "số nhiều của datum",
    "detailedExplanation": "số nhiều của datum; ((thường) dùng như số ít) số liệu, dữ kiện; tài liệu, cứ liệu (cung cấp những điều cần thiết)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'data' in communication.",
        "vi": "Chúng ta thường gặp từ 'data' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=data&type=2"
  },
  {
    "id": "enc-user",
    "word": "user",
    "ipa": "/'ju:z /",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "người dùng, người hay dùng",
    "detailedExplanation": "người dùng, người hay dùng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "telephone user",
        "vi": "người dùng dây nói",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=user&type=2"
  },
  {
    "id": "enc-type",
    "word": "type",
    "ipa": "/taip/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "kiểu mẫu",
    "detailedExplanation": "kiểu mẫu; kiểu; chữ in; (sinh vật học) đại diện điển hình (của một nhóm phân loại)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a fine type of patriotism",
        "vi": "kiểu mẫu đẹp đẽ của tinh thần yêu nước",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "Nordic type",
        "vi": "kiểu người Bắc Âu",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "printed in large type",
        "vi": "in chữ lớn",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=type&type=2"
  },
  {
    "id": "enc-code",
    "word": "code",
    "ipa": "/koud/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "bộ luật, luật",
    "detailedExplanation": "bộ luật, luật; điều lệ, luật lệ, quy tắc; đạo lý (của một xã hội, của một giai cấp); mã, mật mã; viết bằng mã, viết bằng mật mã (bức điện)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "labour code",
        "vi": "luật lao động",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "code of honour",
        "vi": "luân thường đạo lý",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "the code of the school",
        "vi": "điều lệ nhà trường",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=code&type=2"
  },
  {
    "id": "enc-file",
    "word": "file",
    "ipa": "/fail/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cái giũa",
    "detailedExplanation": "cái giũa; (từ lóng) thằng cha láu cá, thằng cha quay quắt; lấy thúng úp voi; lấy gậy chọc trời; giũa",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a deep (an old) file",
        "vi": "thằng cha quay quắt",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to file one's finger nails",
        "vi": "giũa móng tay",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to file something",
        "vi": "giũa nhãn vật gì",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=file&type=2"
  },
  {
    "id": "enc-link",
    "word": "link",
    "ipa": "/liɳk/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "đuốc, cây đuốc",
    "detailedExplanation": "đuốc, cây đuốc; mắt xích, vòng xích, khâu xích; mắt dây đạc (= 0, 20 m); (số nhiều) khuy cửa tay",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'link' in communication.",
        "vi": "Chúng ta thường gặp từ 'link' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=link&type=2"
  },
  {
    "id": "enc-test",
    "word": "test",
    "ipa": "/test/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "(động vật học) vỏ (tôm, cua); mai (rùa)",
    "detailedExplanation": "(động vật học) vỏ (tôm, cua); mai (rùa); sự thử thách; sự thử, sự làm thử; sự sát hạch; bài kiểm tra",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to put on test",
        "vi": "đem thử thách",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to stand the test",
        "vi": "chịu thử thách",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "test bench",
        "vi": "giá để thử xe",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=test&type=2"
  },
  {
    "id": "enc-html",
    "word": "html",
    "ipa": "/html/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "<tin>(vt của HyperText Markup Language) Ngôn ngữ Đánh dấu Siêu văn bản",
    "detailedExplanation": "<tin>(vt của HyperText Markup Language) Ngôn ngữ Đánh dấu Siêu văn bản",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'html' in communication.",
        "vi": "Chúng ta thường gặp từ 'html' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=html&type=2"
  },
  {
    "id": "enc-port",
    "word": "port",
    "ipa": "/pɔ:t/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cảng",
    "detailedExplanation": "cảng; (nghĩa bóng) nơi ẩn náu; nơi tỵ nạn; (Ê-cốt) cổng thành; (hàng hải) cửa tàu (để ra vào, bốc xếp hàng hoá...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "close port",
        "vi": "cảng ở cửa sông",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "port arms!",
        "vi": "chuẩn bị khám súng!",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to put the helm to port",
        "vi": "quay bánh lái sang trái",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=port&type=2"
  },
  {
    "id": "enc-rest",
    "word": "rest",
    "ipa": "/rest/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "sự nghỉ ngơi; lúc nghỉ ngơi; giấc ngủ",
    "detailedExplanation": "sự nghỉ ngơi; lúc nghỉ ngơi; giấc ngủ; sự yên tâm, sự yên lòng, sự thanh thản, sự thư thái (trong tâm hồn); sự yên nghỉ (người chết); sự ngừng lại",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a day of rest",
        "vi": "ngày nghỉ",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to go (retire) to rest",
        "vi": "đi ngủ",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to take a rest",
        "vi": "nghỉ ngơi, đi ngủ",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=rest&type=2"
  },
  {
    "id": "enc-core",
    "word": "core",
    "ipa": "/kɔ:/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "lõi, hạch (quả táo, quả lê...)",
    "detailedExplanation": "lõi, hạch (quả táo, quả lê...); điểm trung tâm, nòng cốt, hạt nhân; lõi dây thừng; (kỹ thuật) nòng, lõi, ruột",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the core of a subject",
        "vi": "điểm trung tâm của một vấn đề, điểm chính của một vấn đề",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "the core of an organization",
        "vi": "nòng cốt của một tổ chức",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "in my heart's core",
        "vi": "tận đáy lòng tôi",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=core&type=2"
  },
  {
    "id": "enc-host",
    "word": "host",
    "ipa": "/houst/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "chủ nhà",
    "detailedExplanation": "chủ nhà; chủ tiệc; chủ khách sạn, chủ quán trọ; (sinh vật học) cây chủ, vật chủ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a host of people",
        "vi": "đông người",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "a host of difficult",
        "vi": "một loạt khó khăn",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "he is a host in himself",
        "vi": "mình anh ấy bằng cả một đám đông (có thể làm việc bằng năm bằng mười người gộp lại)",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=host&type=2"
  },
  {
    "id": "enc-path",
    "word": "path",
    "ipa": "/pɑ:θ, snh pɑ:ðz/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "đường mòn, đường nhỏ",
    "detailedExplanation": "đường mòn, đường nhỏ; con đường, đường đi, đường lối",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "mountain path",
        "vi": "đường mòn trên núi",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "the path of a comes",
        "vi": "đường đi của sao chổi",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "on the path of honour",
        "vi": "trên con đường danh vọng",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=path&type=2"
  },
  {
    "id": "enc-task",
    "word": "task",
    "ipa": "/tɑ:sk/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "nhiệm vụ, nghĩa vụ, phận sự",
    "detailedExplanation": "nhiệm vụ, nghĩa vụ, phận sự; bài làm, bài tập; công tác, công việc; lời quở trách, lời phê bình, lời mắng nhiếc",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a difficult task",
        "vi": "một nhiệm vụ khó khăn",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "give the boys a task to do",
        "vi": "hãy ra bài tập cho các học sinh làm",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to task someone to do something",
        "vi": "giao cho ai làm việc gì",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=task&type=2"
  },
  {
    "id": "enc-load",
    "word": "load",
    "ipa": "/loud/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "vậy nặng, gánh nặng",
    "detailedExplanation": "vậy nặng, gánh nặng; vật gánh, vật chở, vật đội (trên lưng súc vật, trên xe, tàu...); trách nhiệm nặng nề; điều lo lắng, nỗi buồn phiền; (kỹ thuật) sự tải; tải; trọng tải (của một con tàu...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to carry a heavy load",
        "vi": "mang một gánh nặng",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "periodic load",
        "vi": "tải tuần hoàn",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "loads of money",
        "vi": "hàng đống tiền, hàng bồ bạc",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=load&type=2"
  },
  {
    "id": "enc-disk",
    "word": "disk",
    "ipa": "/disk/ (disc) /disk/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "(thể dục,thể thao) đĩa",
    "detailedExplanation": "(thể dục,thể thao) đĩa; đĩa hát; đĩa, vật hình đĩa, bộ phận hình đĩa",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'disk' in communication.",
        "vi": "Chúng ta thường gặp từ 'disk' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=disk&type=2"
  },
  {
    "id": "enc-spam",
    "word": "spam",
    "ipa": "/spæm/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "(thương nghiệp) đồ hộp Mỹ",
    "detailedExplanation": "(thương nghiệp) đồ hộp Mỹ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'spam' in communication.",
        "vi": "Chúng ta thường gặp từ 'spam' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=spam&type=2"
  },
  {
    "id": "enc-null",
    "word": "null",
    "ipa": "/nʌl/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "vô hiệu, không có hiệu lực",
    "detailedExplanation": "vô hiệu, không có hiệu lực; vô dụng, vô giá trị; không có cá tính, không biểu lộ tâm tính; (toán học) bằng không, không",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "null and void",
        "vi": "không còn hiệu lực nữa, không còn giá trị nữa (đạo luật, tờ di chúc, chứng thư, hiệp ước...)",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=null&type=2"
  },
  {
    "id": "enc-unix",
    "word": "unix",
    "ipa": "/unix/",
    "partOfSpeech": "word",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "Một hệ điều hành được dùng trong nhiều loại máy tính khác nhau, từ các máy tính lớn cho đến các máy tính lớn cho đến các máy tính cá nhân, nó có khả năng đa nhiệm phù hợp một cách lý tưỏng đối với các ứng dụng nhiều người dùng",
    "detailedExplanation": "Một hệ điều hành được dùng trong nhiều loại máy tính khác nhau, từ các máy tính lớn cho đến các máy tính lớn cho đến các máy tính cá nhân, nó có khả năng đa nhiệm phù hợp một cách lý tưỏng đối với các ứng dụng nhiều người dùng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'unix' in communication.",
        "vi": "Chúng ta thường gặp từ 'unix' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=unix&type=2"
  },
  {
    "id": "enc-lock",
    "word": "lock",
    "ipa": "/lɔk/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "món tóc, mớ tóc; mớ bông, mớ len",
    "detailedExplanation": "món tóc, mớ tóc; mớ bông, mớ len; (số nhiều) mái tóc, tóc; khoá; chốt (để giữ bánh xe, ghi...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "hoary locks",
        "vi": "mái tóc bạc",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to keep under lock and key",
        "vi": "cất vào tủ khoá lại; nhốt kỹ, giam giữ",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to pick a lock",
        "vi": "mở khoá bằng móc",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=lock&type=2"
  },
  {
    "id": "enc-loop",
    "word": "loop",
    "ipa": "/lu:p/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "vòng; thòng lọng; cái khâu, cái móc, khuyết áo)",
    "detailedExplanation": "vòng; thòng lọng; cái khâu, cái móc, khuyết áo); đường nhánh, đường vòng (đường xe lửa, đường dây điện báo ((cũng) loop line); (vật lý) bụng (sóng); (điện học) cuộn; mạch",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "coupling loop",
        "vi": "cuộn ghép",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "closed loop",
        "vi": "mạch kín",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=loop&type=2"
  },
  {
    "id": "enc-hook",
    "word": "hook",
    "ipa": "/huk/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cái móc, cái mác",
    "detailedExplanation": "cái móc, cái mác; bản lề cửa; (từ lóng) cái neo; lưỡi câu ((cũng) fish hook)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'hook' in communication.",
        "vi": "Chúng ta thường gặp từ 'hook' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=hook&type=2"
  },
  {
    "id": "enc-byte",
    "word": "byte",
    "ipa": "/byte/",
    "partOfSpeech": "word",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "(Tech) bai (8 bit)",
    "detailedExplanation": "(Tech) bai (8 bit)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'byte' in communication.",
        "vi": "Chúng ta thường gặp từ 'byte' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=byte&type=2"
  },
  {
    "id": "enc-fork",
    "word": "fork",
    "ipa": "/fɔ:k/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cái nĩa (để xiên thức ăn)",
    "detailedExplanation": "cái nĩa (để xiên thức ăn); cái chĩa (dùng để gảy rơm...); chạc cây; chỗ ngã ba (đường, sông)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "where the road forks",
        "vi": "ở chỗ con đường chia ngã; ở chỗ ngã ba đường",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=fork&type=2"
  },
  {
    "id": "enc-hash",
    "word": "hash",
    "ipa": "/hæʃ/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "món thịt băm",
    "detailedExplanation": "món thịt băm; (nghĩa bóng) bình mới rượu cũ (đồ cũ sửa lại với hình thức mới); mớ lộn xộn, mớ linh tinh; làm hỏng việc, làm cho việc trở bên be bét rối tinh",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'hash' in communication.",
        "vi": "Chúng ta thường gặp từ 'hash' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=hash&type=2"
  },
  {
    "id": "enc-heap",
    "word": "heap",
    "ipa": "/hi:p/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "đống",
    "detailedExplanation": "đống; (thông tục) rất nhiều; (số nhiều dùng như phó từ) nhiều, lắm; điếng người, sửng sốt, rụng rời, mất vía",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a heap of sand",
        "vi": "một đống cát",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "there is heaps more to say on this question",
        "vi": "còn có thể nói rất nhiều về vấn đề này",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "heaps of times",
        "vi": "rất nhiều lần",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=heap&type=2"
  },
  {
    "id": "enc-local",
    "word": "local",
    "ipa": "/'loukəl/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "địa phương",
    "detailedExplanation": "địa phương; bộ phận, cục bộ; (toán học) (thuộc) quỹ tích; người dân địa phương; người làm nghề tự do ở địa phương; người giảng đạo ở địa phương",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "local authorities",
        "vi": "nhà đương cục địa phương",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "local time",
        "vi": "giờ địa phương",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "local colour",
        "vi": "(văn học) màu sắc địa phương",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=local&type=2"
  },
  {
    "id": "enc-index",
    "word": "index",
    "ipa": "/'indeks/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "ngón tay trỏ ((cũng) index finger)",
    "detailedExplanation": "ngón tay trỏ ((cũng) index finger); chỉ số; sự biểu thị; kim (trên đồng hồ đo...); bảng mục lục (các đề mục cuối sách); bản liệt kê",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a library index",
        "vi": "bản liệt kê của thư viện",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to put a book on the index",
        "vi": "cấm lưu hành một cuốn sách",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=index&type=2"
  },
  {
    "id": "enc-table",
    "word": "table",
    "ipa": "/'teibl/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cái bàn",
    "detailedExplanation": "cái bàn; bàn ăn; thức ăn bày bàn, mâm cỗ, cỗ bàn; những người ngồi quanh bàn, những người ngồi ăn",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "at table",
        "vi": "đang bàn ăn, trong lúc ngồi ăn",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to lay (set) the table",
        "vi": "bày ban ăn",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to clear the table",
        "vi": "dọn bàn",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=table&type=2"
  },
  {
    "id": "enc-field",
    "word": "field",
    "ipa": "/fi:ld/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "đồng ruộng, cánh đồng",
    "detailedExplanation": "đồng ruộng, cánh đồng; mỏ, khu khai thác; bâi chiến trường; nơi hành quân; trận đánh; sân (bóng đá,  crickê)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to hold the field",
        "vi": "giữ vững trận địa",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to take the field",
        "vi": "bắt đầu hành quân",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "of art field",
        "vi": "lĩnh vực nghệ thuật",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=field&type=2"
  },
  {
    "id": "enc-event",
    "word": "event",
    "ipa": "/i'vent/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "sự việc, sự kiện",
    "detailedExplanation": "sự việc, sự kiện; sự kiện quan trọng; (thể dục,thể thao) cuộc đấu, cuộc thi; trường hợp, khả năng có thể xảy ra",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "in the event of success",
        "vi": "trong trường hợp thành công",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "at all events; in any event",
        "vi": "trong bất kỳ trường hợp nào",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=event&type=2"
  },
  {
    "id": "enc-error",
    "word": "error",
    "ipa": "/'erə/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "sự sai lầm, sự sai sót, lỗi; ý kiến sai lầm; tình trạng sai lầm",
    "detailedExplanation": "sự sai lầm, sự sai sót, lỗi; ý kiến sai lầm; tình trạng sai lầm; (kỹ thuật) sai số; độ sai; sự vi phạm; (rađiô) sự mất thích ứng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to commit (make) an error",
        "vi": "phạm sai lầm, mắc lỗi",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "in error",
        "vi": "vì lầm lẫn",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=error&type=2"
  },
  {
    "id": "enc-build",
    "word": "build",
    "ipa": "/bild/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "sự xây dựng",
    "detailedExplanation": "sự xây dựng; kiểu kiến trúc; khổ người tầm vóc; xây, xây dựng, xây cất; dựng nên, lập nên, làm nên",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "man of strong build",
        "vi": "người có tầm vóc khoẻ",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to be of the same build",
        "vi": "cùng tầm vóc",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to build a railway",
        "vi": "xây dựng đường xe lửa",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=build&type=2"
  },
  {
    "id": "enc-input",
    "word": "input",
    "ipa": "/'input/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cái cho vào",
    "detailedExplanation": "cái cho vào; lực truyền vào (máy...); dòng điện truyền vào (máy...); (kỹ thuật) tài liệu viết bằng ký hiệu (cung cấp vào máy tính điện tử); sự cung cấp tài liệu (cho máy tính điện tử); (Ê-cốt) số tiền cúng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'input' in communication.",
        "vi": "Chúng ta thường gặp từ 'input' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=input&type=2"
  },
  {
    "id": "enc-block",
    "word": "block",
    "ipa": "/blɔk/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "khối, tảng, súc (đá, gỗ...)",
    "detailedExplanation": "khối, tảng, súc (đá, gỗ...); cái thớt, đon kê, tấm gỗ kê để chặt đầu (người bị tử hình); khuôn (mũ); đầu giả (để trưng bày mũ, tóc giả...); khuôn nhà lớn, nhà khối (ở giữa bốn con đường)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to block the enemy's plant",
        "vi": "chặn đứng những kế hoạch của địch",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to block out a plan",
        "vi": "phác ra một kế hoạch",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to block in a pictủe",
        "vi": "vẽ phác một bức tranh",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=block&type=2"
  },
  {
    "id": "enc-patch",
    "word": "patch",
    "ipa": "/pætʃ/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "miếng vá",
    "detailedExplanation": "miếng vá; miếng băng dính, miếng thuốc cao (trên vết thương...); miếng bông che mắt đau; nốt ruồi giả (để tô điểm trên mặt)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a patch of potatoes",
        "vi": "một đám (mảnh) khoai",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to patch a tyre",
        "vi": "vá một cái lốp",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "it will patch the hole well enough",
        "vi": "miếng đó đủ để vá cho cái lỗ thủng",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=patch&type=2"
  },
  {
    "id": "enc-query",
    "word": "query",
    "ipa": "/'kwiəri/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "câu hỏi, câu chất vấn; thắc mắc",
    "detailedExplanation": "câu hỏi, câu chất vấn; thắc mắc; ((viết tắt),  qu.) thử hỏi, chẳng biết; dấu chấm hỏi; (+ whether,  if) hỏi, hỏi xem, chất vấn",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "query (qu.), has the letter been answered?",
        "vi": "chẳng biết bức thư đó đã được trả lời hay chưa?",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=query&type=2"
  },
  {
    "id": "enc-array",
    "word": "array",
    "ipa": "/ə'rei/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "sự dàn trận, sự bày binh bố trận",
    "detailedExplanation": "sự dàn trận, sự bày binh bố trận; lực lượng quân đội; dãy sắp xếp ngay ngắn; hàng ngũ chỉnh tề; (pháp lý) danh sách hội thẩm",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "an array of bottles and glasses",
        "vi": "một dãy những chai cốc sắp xếp ngăn nắp",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to array onself in one's finest clothes",
        "vi": "mặc những quần áo đẹp nhất",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to array forces",
        "vi": "(quân sự) dàn lực lượng, dàn trận, bày binh bố trận",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=array&type=2"
  },
  {
    "id": "enc-scope",
    "word": "scope",
    "ipa": "/skoup/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "phạm vi, tầm xa (kiến thức); dịp; nơi phát huy",
    "detailedExplanation": "phạm vi, tầm xa (kiến thức); dịp; nơi phát huy; (hàng hải) chiều dài dây neo (khi tàu bỏ neo); (quân sự) tầm tên lửa; (từ hiếm,nghĩa hiếm) mục tiêu, mục đích, ý định",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "that is beyond my scope",
        "vi": "tôi không làm nổi việc đó; tôi không đủ thẩm quyền giải quyết việc đó",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "the job will give ample scope to his ability",
        "vi": "làm việc đó anh ta sẽ có đất để dụng võ; làm việc đó anh ta sẽ có dịp để phát huy khả năng của mình",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "we must read to broaden the scope of our knowledge",
        "vi": "chúng ta phải đọc để mở rộng kiến thức",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=scope&type=2"
  },
  {
    "id": "enc-shell",
    "word": "shell",
    "ipa": "/ʃelf/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "vỏ; bao; mai",
    "detailedExplanation": "vỏ; bao; mai; vỏ tàu; tường nhà; quan tài trong; thuyền đua",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to retire into one's shell",
        "vi": "rút vào vỏ của mình",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to come out of one's shell",
        "vi": "ra khỏi vỏ, chan hoà với mọi người",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "ion shell",
        "vi": "vỏ ion",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=shell&type=2"
  },
  {
    "id": "enc-cache",
    "word": "cache",
    "ipa": "/kæʃ/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "nơi giấu, nơi trữ (lương thực, đạn dược... nhất là các nhà thám hiểm để dùng sau này)",
    "detailedExplanation": "nơi giấu, nơi trữ (lương thực, đạn dược... nhất là các nhà thám hiểm để dùng sau này); lương thực, vật dụng giấu kín; thức ăn dự trữ (của động vật qua đông); giấu kín, trữ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to make a cache",
        "vi": "xây dựng nơi trữ",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cache&type=2"
  },
  {
    "id": "enc-graph",
    "word": "graph",
    "ipa": "/græf/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "đồ thị",
    "detailedExplanation": "đồ thị; (toán học) mạch; vẽ đồ thị; minh hoạ bằng đồ thị; máy in thạch",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'graph' in communication.",
        "vi": "Chúng ta thường gặp từ 'graph' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=graph&type=2"
  },
  {
    "id": "enc-trace",
    "word": "trace",
    "ipa": "/treis/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "dây kéo (buộc vào ngựa để kéo xe)",
    "detailedExplanation": "dây kéo (buộc vào ngựa để kéo xe); đang thắng cương (đen & bóng); (xem) kick; ((thường) số nhiều) dấu, vết, vết tích",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the traces of an ancient civilization",
        "vi": "những vết tích của một nền văn minh cổ",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "not to show a trace of fear",
        "vi": "không để lộ ra một chút gì là sợ hãi cả",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to trace out a plan",
        "vi": "vạch một kế hoạch",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=trace&type=2"
  },
  {
    "id": "enc-stack",
    "word": "stack",
    "ipa": "/stæk/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "cây rơm, đụn rơm",
    "detailedExplanation": "cây rơm, đụn rơm; Xtec (đơn vị đo gỗ bằng khoảng 3 mét khối); đống (than, củi); (thông tục) một số lượng lớn, nhiều",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to have stacks of work",
        "vi": "có nhiều việc",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=stack&type=2"
  },
  {
    "id": "enc-macro",
    "word": "macro",
    "ipa": "/macro/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "lớn, khổng lồ (về kích thước, khả năng...)",
    "detailedExplanation": "lớn, khổng lồ (về kích thước, khả năng...); <tin> một lệnh đơn độc, dùng trong chương trình máy tính, thay thế cho một chuỗi các lệnh hoặc phím gõ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'macro' in communication.",
        "vi": "Chúng ta thường gặp từ 'macro' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=macro&type=2"
  },
  {
    "id": "enc-debug",
    "word": "debug",
    "ipa": "/debug/",
    "partOfSpeech": "word",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "(Tech) chỉnh lỗi, gỡ rối",
    "detailedExplanation": "(Tech) chỉnh lỗi, gỡ rối",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'debug' in communication.",
        "vi": "Chúng ta thường gặp từ 'debug' trong giao tiếp.",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=debug&type=2"
  },
  {
    "id": "enc-queue",
    "word": "queue",
    "ipa": "/kju:/",
    "partOfSpeech": "verb",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "đuôi sam",
    "detailedExplanation": "đuôi sam; hàng (người, xe ô tô ở ngã tư khi có đèn đỏ...) xếp nối đuôi; ((thường) + up) xếp hàng nối đuôi nhau; tết (tóc thành đuôi sam)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to stand in a queue",
        "vi": "xếp hàng nối đuôi nhau",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "to queue up for a tram",
        "vi": "xếp hàng nối đuôi nhau để lên xe điện",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=queue&type=2"
  },
  {
    "id": "enc-token",
    "word": "token",
    "ipa": "/'toukən/",
    "partOfSpeech": "noun",
    "category": "it-dev",
    "categoryLabel": "💻 IT: Code & Dev",
    "meaningVi": "dấu hiệu, biểu hiện",
    "detailedExplanation": "dấu hiệu, biểu hiện; vật kỷ niệm, vật lưu niệm; bằng chứng, chứng; vả lại; ngoài ra; thêm vào đó",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "as a token of our gratitude",
        "vi": "như là một biểu hiện của lòng biết ơn của chúng tôi",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "I'll keep it as a token",
        "vi": "tôi giữ cái đó như là một vật kỷ niệm",
        "context": "💻 IT: Code & Dev"
      },
      {
        "en": "token payment",
        "vi": "món tiền trả trước để làm bằng (làm tin)",
        "context": "💻 IT: Code & Dev"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=token&type=2"
  },
  {
    "id": "enc-demo",
    "word": "demo",
    "ipa": "/demo/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "cuộc biểu tình",
    "detailedExplanation": "cuộc biểu tình; <tin> giới thiệu, chương trình giới thiệu",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'demo' in communication.",
        "vi": "Chúng ta thường gặp từ 'demo' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=demo&type=2"
  },
  {
    "id": "enc-epic",
    "word": "epic",
    "ipa": "/'epik/",
    "partOfSpeech": "adjective",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "thiên anh hùng ca, thiên sử thi",
    "detailedExplanation": "thiên anh hùng ca, thiên sử thi; có tính chất anh hùng ca, có tính chất sử thi; có thể viết thành anh hùng ca, có thể viết thành sử thi",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'epic' in communication.",
        "vi": "Chúng ta thường gặp từ 'epic' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=epic&type=2"
  },
  {
    "id": "enc-lean",
    "word": "lean",
    "ipa": "/li:n/",
    "partOfSpeech": "verb",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "độ nghiêng, độ dốc",
    "detailedExplanation": "độ nghiêng, độ dốc; chỗ nạc; gầy còm; nạc, không dính mỡ (thịt)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a lean year",
        "vi": "một năm đói kém, một năm mất mùa",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "to lean forward",
        "vi": "ngả người về phía trước",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "to lean against the wall",
        "vi": "dựa vào tường",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=lean&type=2"
  },
  {
    "id": "enc-story",
    "word": "story",
    "ipa": "/'stɔ:ri/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "chuyện, câu chuyện",
    "detailedExplanation": "chuyện, câu chuyện; truyện; cốt truyện, tình tiết (một truyện, một vở kịch...); tiểu sử, quá khứ (của một người)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "they all tell the same story",
        "vi": "họ đều kể một câu chuyện như nhau",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "as the story goes",
        "vi": "người ta nói chuyện rằng",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "but that is another story",
        "vi": "nhưng đó lại là chuyện khác",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=story&type=2"
  },
  {
    "id": "enc-poker",
    "word": "poker",
    "ipa": "/'poukə/",
    "partOfSpeech": "verb",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "(đánh bài) Pôke, bài xì",
    "detailedExplanation": "(đánh bài) Pôke, bài xì; que cời; giùi khắc nung; cứng như khúc gỗ, thẳng đuồn đuỗn",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'poker' in communication.",
        "vi": "Chúng ta thường gặp từ 'poker' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=poker&type=2"
  },
  {
    "id": "enc-agile",
    "word": "agile",
    "ipa": "/'ædʤail/",
    "partOfSpeech": "adjective",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "nhanh nhẹn, nhanh nhẩu, lẹ làng, lanh lợi",
    "detailedExplanation": "nhanh nhẹn, nhanh nhẩu, lẹ làng, lanh lợi",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'agile' in communication.",
        "vi": "Chúng ta thường gặp từ 'agile' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=agile&type=2"
  },
  {
    "id": "enc-sprint",
    "word": "sprint",
    "ipa": "/sprint/",
    "partOfSpeech": "verb",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "sự chạy nhanh, sự chạy nước rút; nước rút",
    "detailedExplanation": "sự chạy nhanh, sự chạy nước rút; nước rút; chạy nước rút, chạy hết tốc lực",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'sprint' in communication.",
        "vi": "Chúng ta thường gặp từ 'sprint' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=sprint&type=2"
  },
  {
    "id": "enc-release",
    "word": "release",
    "ipa": "/ri'li:s/",
    "partOfSpeech": "verb",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "sự giải thoát, sự thoát khỏi (điều lo lắng, sầu muộn, bệnh tật...)",
    "detailedExplanation": "sự giải thoát, sự thoát khỏi (điều lo lắng, sầu muộn, bệnh tật...); sự thả, sự phóng thích; sự phát hành (cuốn sách, bản tin); sự đưa ra bàn (một loại ô tô mới...); giấy biên lai, giấy biên nhận",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a release of war prisoners",
        "vi": "sự phóng thích tù binh",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "energy release",
        "vi": "sự giải phóng năng lượng",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "to release a prisoner",
        "vi": "tha một người tù",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=release&type=2"
  },
  {
    "id": "enc-blocker",
    "word": "blocker",
    "ipa": "/blocker/",
    "partOfSpeech": "word",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "xem block",
    "detailedExplanation": "xem block",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'blocker' in communication.",
        "vi": "Chúng ta thường gặp từ 'blocker' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=blocker&type=2"
  },
  {
    "id": "enc-roadmap",
    "word": "roadmap",
    "ipa": "/roadmap/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "bản đồ chỉ dẫn đường sá; bản đồ đường bộ",
    "detailedExplanation": "bản đồ chỉ dẫn đường sá; bản đồ đường bộ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'roadmap' in communication.",
        "vi": "Chúng ta thường gặp từ 'roadmap' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=roadmap&type=2"
  },
  {
    "id": "enc-backlog",
    "word": "backlog",
    "ipa": "/'bæklɔg/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "dự trữ",
    "detailedExplanation": "dự trữ; phần đơn hàng chưa thực hiện được",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'backlog' in communication.",
        "vi": "Chúng ta thường gặp từ 'backlog' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=backlog&type=2"
  },
  {
    "id": "enc-feedback",
    "word": "feedback",
    "ipa": "/'fi:dbæk/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "(raddiô) sự nối tiếp",
    "detailedExplanation": "(raddiô) sự nối tiếp; (điện học) sự hoàn ngược",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'feedback' in communication.",
        "vi": "Chúng ta thường gặp từ 'feedback' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=feedback&type=2"
  },
  {
    "id": "enc-estimate",
    "word": "estimate",
    "ipa": "/'estimit - 'estimeit/",
    "partOfSpeech": "verb",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "'estimeit/",
    "detailedExplanation": "'estimeit/; sự đánh giá, sự ước lượng; số lượng ước đoán; bản kê giá cả (thầu khoán)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'estimate' in communication.",
        "vi": "Chúng ta thường gặp từ 'estimate' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=estimate&type=2"
  },
  {
    "id": "enc-velocity",
    "word": "velocity",
    "ipa": "/vi'lɔsiti/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "tốc độ, tốc lực",
    "detailedExplanation": "tốc độ, tốc lực",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "initial velocity",
        "vi": "tốc độ ban đầu",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "muzzle velocity",
        "vi": "tốc độ ban đầu (của đạn...)",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=velocity&type=2"
  },
  {
    "id": "enc-ceremony",
    "word": "ceremony",
    "ipa": "/'seriməni/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "nghi thức, nghi lễ",
    "detailedExplanation": "nghi thức, nghi lễ; sự khách sáo, sự kiểu cách; (xem) stand; tự nhiên không khách sáo",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "there is no need for ceremony between friends",
        "vi": "giữa bạn bè với nhau không cần phải khách sáo",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ceremony&type=2"
  },
  {
    "id": "enc-obstacle",
    "word": "obstacle",
    "ipa": "/'ɔbstəkl/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "vật chướng ngại, trở lực",
    "detailedExplanation": "vật chướng ngại, trở lực; sự cản trở, sự trở ngại",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'obstacle' in communication.",
        "vi": "Chúng ta thường gặp từ 'obstacle' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=obstacle&type=2"
  },
  {
    "id": "enc-milestone",
    "word": "milestone",
    "ipa": "/'mailstoun/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "cột kilômét cọc",
    "detailedExplanation": "cột kilômét cọc; (nghĩa bóng) sự kiện quan trọng, mốc lịch sử, giai đoạn quan trọng (trong đời ai)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'milestone' in communication.",
        "vi": "Chúng ta thường gặp từ 'milestone' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=milestone&type=2"
  },
  {
    "id": "enc-increment",
    "word": "increment",
    "ipa": "/'inkrimənt/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "sự lớn lên (của cây cối); độ lớn lên",
    "detailedExplanation": "sự lớn lên (của cây cối); độ lớn lên; tiền lãi, tiền lời; (toán học) lượng gia, số gia",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "increment of a function",
        "vi": "lượng gia của một hàm",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=increment&type=2"
  },
  {
    "id": "enc-iteration",
    "word": "iteration",
    "ipa": "/iteration/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "sự nhắc đi nhắc lại",
    "detailedExplanation": "sự nhắc đi nhắc lại; tính lặp đi lặp lại",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'iteration' in communication.",
        "vi": "Chúng ta thường gặp từ 'iteration' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=iteration&type=2"
  },
  {
    "id": "enc-commitment",
    "word": "commitment",
    "ipa": "/kə'mitmənt/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "(như) committal",
    "detailedExplanation": "(như) committal; trát bắt giam; sự phạm (tội...); (từ Mỹ,nghĩa Mỹ) sự đưa (quân) đi đánh",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'commitment' in communication.",
        "vi": "Chúng ta thường gặp từ 'commitment' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=commitment&type=2"
  },
  {
    "id": "enc-estimation",
    "word": "estimation",
    "ipa": "/,esti'meiʃn/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "sự đánh giá; sự ước lượng",
    "detailedExplanation": "sự đánh giá; sự ước lượng; sự kính mến, sự quý trọng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to hold someone in estimation",
        "vi": "kính mến ai, quý trọng ai",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=estimation&type=2"
  },
  {
    "id": "enc-refinement",
    "word": "refinement",
    "ipa": "/ri'fainmənt/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "sự lọc; sự tinh chế (dầu, đường); sự luyện tinh (kim loại)",
    "detailedExplanation": "sự lọc; sự tinh chế (dầu, đường); sự luyện tinh (kim loại); sự tinh tế, sự tế nhị, sự tao nhã, sự lịch sự, sự sành sỏi; cái hay, cái đẹp, cái tinh tuý, cái tao nhã; thủ đoạn tinh vi, phương pháp tinh vi, lập luận tế nhị, sự phân biệt tinh vi",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "all the refinements of the age",
        "vi": "tất cả cái tinh tuý (cái hay, cái đẹp) của thời đại",
        "context": "⏱️ IT: Scrum & Agile"
      },
      {
        "en": "refinements of cruelty",
        "vi": "những thủ đoạn tàn ác tinh vi",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=refinement&type=2"
  },
  {
    "id": "enc-workaround",
    "word": "workaround",
    "ipa": "/workaround/",
    "partOfSpeech": "word",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "khắc phục",
    "detailedExplanation": "khắc phục",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'workaround' in communication.",
        "vi": "Chúng ta thường gặp từ 'workaround' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=workaround&type=2"
  },
  {
    "id": "enc-stakeholder",
    "word": "stakeholder",
    "ipa": "/'steik,houldə/",
    "partOfSpeech": "noun",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "người giữ tiền đặt cược",
    "detailedExplanation": "người giữ tiền đặt cược",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'stakeholder' in communication.",
        "vi": "Chúng ta thường gặp từ 'stakeholder' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=stakeholder&type=2"
  },
  {
    "id": "enc-retrospective",
    "word": "retrospective",
    "ipa": "/,retrou'spektiv/",
    "partOfSpeech": "adjective",
    "category": "it-scrum",
    "categoryLabel": "⏱️ IT: Scrum & Agile",
    "meaningVi": "hồi tưởng quá khứ, nhìn lại dĩ vãng",
    "detailedExplanation": "hồi tưởng quá khứ, nhìn lại dĩ vãng; (pháp lý) có hiệu lực trở về trước (đạo luật); ngó lại sau, nhìn lại sau (cái nhìn); ở đằng sau (phong cảnh)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'retrospective' in communication.",
        "vi": "Chúng ta thường gặp từ 'retrospective' trong giao tiếp.",
        "context": "⏱️ IT: Scrum & Agile"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=retrospective&type=2"
  },
  {
    "id": "enc-work",
    "word": "work",
    "ipa": "/wə:k/",
    "partOfSpeech": "verb",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "sự làm việc; việc, công việc, công tác",
    "detailedExplanation": "sự làm việc; việc, công việc, công tác; việc làm; nghề nghiệp; đồ làm ra, sản phẩm; tác phẩm",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to be at work",
        "vi": "đang làm việc",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to set to work",
        "vi": "bắt tay vào việc",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to make short work of",
        "vi": "làm xong nhanh; đánh bại nhanh, diệt nhanh; tống nhanh đi",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=work&type=2"
  },
  {
    "id": "enc-meet",
    "word": "meet",
    "ipa": "/mi:t/",
    "partOfSpeech": "adjective",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "cuộc gặp gỡ (của những người đi săn ở một nơi đã hẹn trước, của những nhà thể thao để thi đấu)",
    "detailedExplanation": "cuộc gặp gỡ (của những người đi săn ở một nơi đã hẹn trước, của những nhà thể thao để thi đấu); gặp, gặp gỡ; đi đón; (từ Mỹ,nghĩa Mỹ) xin giới thiệu, làm quen (với người nào)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to meet someone in the street",
        "vi": "gặp ai ở ngoài phố",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to meet somebody half-way",
        "vi": "gặp ai giữa đường; (nghĩa bóng) thoả hiệp với ai",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to meet someone at the station",
        "vi": "đi đón ai ở ga",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=meet&type=2"
  },
  {
    "id": "enc-staff",
    "word": "staff",
    "ipa": "/stɑ:f/",
    "partOfSpeech": "verb",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "gậy, ba toong",
    "detailedExplanation": "gậy, ba toong; gậy quyền (gậy biểu thị chức vị quyền lực); cán, cột; chỗ dựa, chỗ nương tựa",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to be the staff of someone",
        "vi": "là chỗ nương tựa của ai",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "regimental staff",
        "vi": "bộ tham mưu trung đoàn",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "staff officer",
        "vi": "sĩ quan tham mưu",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=staff&type=2"
  },
  {
    "id": "enc-report",
    "word": "report",
    "ipa": "/ri'pɔ:t/",
    "partOfSpeech": "verb",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "bản báo cáo; biên bản",
    "detailedExplanation": "bản báo cáo; biên bản; bản tin, bản dự báo; phiếu thành tích học tập (hằng tháng hoặc từng học kỳ của học sinh); tin đồn; tiếng tăm, danh tiếng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to give a report on...",
        "vi": "báo cáo về...",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to make a report",
        "vi": "làm một bản báo cáo; làm biên bản",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "weather report",
        "vi": "bản dự báo thời tiết",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=report&type=2"
  },
  {
    "id": "enc-office",
    "word": "office",
    "ipa": "/'ɔfis/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "sự giúp đỡ",
    "detailedExplanation": "sự giúp đỡ; nhiệm vụ; chức vụ; lễ nghi",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "by the good offices of...",
        "vi": "nhờ sự giúp đỡ của...",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to take (enter upon) office",
        "vi": "nhận chức, nhậm chức",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to resign (leave) office",
        "vi": "từ chức",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=office&type=2"
  },
  {
    "id": "enc-worker",
    "word": "worker",
    "ipa": "/'wə:kə/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "người lao động, người làm việc",
    "detailedExplanation": "người lao động, người làm việc; thợ, công nhân; (số nhiều) giai cấp công nhân, nhân dân lao động; (động vật học) ong thợ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'worker' in communication.",
        "vi": "Chúng ta thường gặp từ 'worker' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=worker&type=2"
  },
  {
    "id": "enc-working",
    "word": "working",
    "ipa": "/'wə:kiɳ/",
    "partOfSpeech": "adjective",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "sự làm việc, sự làm",
    "detailedExplanation": "sự làm việc, sự làm; sự lên men, sự để lên men (rượu, bia); (kỹ thuật) sự hoạt động, sự chuyển vận, sự vận hành, sự dùng (máy móc); sự khai thác (mỏ)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "working clothes",
        "vi": "quần áo đi làm",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "working day",
        "vi": "ngày làm việc",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "working order",
        "vi": "tình trạng chạy được",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=working&type=2"
  },
  {
    "id": "enc-meeting",
    "word": "meeting",
    "ipa": "/'mi:tiɳ/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "(chính trị) cuộc mít tinh, cuộc biểu tình",
    "detailedExplanation": "(chính trị) cuộc mít tinh, cuộc biểu tình; cuộc gặp gỡ, cuộc hội họp, hội nghị",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to address a meeting",
        "vi": "nói chuyện với hội nghị",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "to open a meeting",
        "vi": "khai mạc hội nghị",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=meeting&type=2"
  },
  {
    "id": "enc-officer",
    "word": "officer",
    "ipa": "/'ɔfisə/",
    "partOfSpeech": "verb",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "sĩ quan",
    "detailedExplanation": "sĩ quan; nhân viên chính quyền, nhân viên, viên chức; cảnh sát; giám đốc; thư ký; thủ quỹ (một công ty, một hội)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "staff officer",
        "vi": "sĩ quan tham mưu",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "officer of the day",
        "vi": "sĩ quan trực nhật",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "the regiment was well officered",
        "vi": "trung đoàn được cung cấp đầy đủ sĩ quan chỉ huy",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=officer&type=2"
  },
  {
    "id": "enc-artwork",
    "word": "artwork",
    "ipa": "/artwork/",
    "partOfSpeech": "word",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "(Tech) nguyên cảo; nguyên đồ; đồ trang sức; đồ nghệ thuật",
    "detailedExplanation": "(Tech) nguyên cảo; nguyên đồ; đồ trang sức; đồ nghệ thuật",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'artwork' in communication.",
        "vi": "Chúng ta thường gặp từ 'artwork' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=artwork&type=2"
  },
  {
    "id": "enc-workout",
    "word": "workout",
    "ipa": "/'wə:kaut/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "(từ Mỹ,nghĩa Mỹ),  (thể dục,thể thao) buổi luyện tập",
    "detailedExplanation": "(từ Mỹ,nghĩa Mỹ),  (thể dục,thể thao) buổi luyện tập",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'workout' in communication.",
        "vi": "Chúng ta thường gặp từ 'workout' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=workout&type=2"
  },
  {
    "id": "enc-reported",
    "word": "reported",
    "ipa": "/ri'pɔ:tid/",
    "partOfSpeech": "adjective",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "(ngôn ngữ học) gián tiếp",
    "detailedExplanation": "(ngôn ngữ học) gián tiếp",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "reported speech",
        "vi": "lời dẫn gián tiếp",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=reported&type=2"
  },
  {
    "id": "enc-workshop",
    "word": "workshop",
    "ipa": "/'wə:kʃɔp/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "xưởng",
    "detailedExplanation": "xưởng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'workshop' in communication.",
        "vi": "Chúng ta thường gặp từ 'workshop' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=workshop&type=2"
  },
  {
    "id": "enc-reporter",
    "word": "reporter",
    "ipa": "/ri'pɔ:tə/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "người báo cáo",
    "detailedExplanation": "người báo cáo; phóng viên nhà báo",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'reporter' in communication.",
        "vi": "Chúng ta thường gặp từ 'reporter' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=reporter&type=2"
  },
  {
    "id": "enc-homework",
    "word": "homework",
    "ipa": "/'houmwə:k/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "bài làm ở nhà (cho học sinh)",
    "detailedExplanation": "bài làm ở nhà (cho học sinh); công việc làm ở nhà",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'homework' in communication.",
        "vi": "Chúng ta thường gặp từ 'homework' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=homework&type=2"
  },
  {
    "id": "enc-workbook",
    "word": "workbook",
    "ipa": "/workbook/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "sách bài tập",
    "detailedExplanation": "sách bài tập",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'workbook' in communication.",
        "vi": "Chúng ta thường gặp từ 'workbook' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=workbook&type=2"
  },
  {
    "id": "enc-bodywork",
    "word": "bodywork",
    "ipa": "/'bɔdiwə:k/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "thân xe",
    "detailedExplanation": "thân xe",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'bodywork' in communication.",
        "vi": "Chúng ta thường gặp từ 'bodywork' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bodywork&type=2"
  },
  {
    "id": "enc-fireworks",
    "word": "fireworks",
    "ipa": "/'faiəwud/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "pháo hoa, pháo bông; cuộc đốt pháo hoa",
    "detailedExplanation": "pháo hoa, pháo bông; cuộc đốt pháo hoa; sự sắc sảo; sự nổi nóng; đánh ai nảy đom đóm mắt",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'fireworks' in communication.",
        "vi": "Chúng ta thường gặp từ 'fireworks' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=fireworks&type=2"
  },
  {
    "id": "enc-paperwork",
    "word": "paperwork",
    "ipa": "/paperwork/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "công việc giấy tờ",
    "detailedExplanation": "công việc giấy tờ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'paperwork' in communication.",
        "vi": "Chúng ta thường gặp từ 'paperwork' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=paperwork&type=2"
  },
  {
    "id": "enc-worksheet",
    "word": "worksheet",
    "ipa": "/worksheet/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "giấy chấm công",
    "detailedExplanation": "giấy chấm công",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'worksheet' in communication.",
        "vi": "Chúng ta thường gặp từ 'worksheet' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=worksheet&type=2"
  },
  {
    "id": "enc-workgroup",
    "word": "workgroup",
    "ipa": "/workgroup/",
    "partOfSpeech": "word",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "nhóm làm việc",
    "detailedExplanation": "nhóm làm việc",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'workgroup' in communication.",
        "vi": "Chúng ta thường gặp từ 'workgroup' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=workgroup&type=2"
  },
  {
    "id": "enc-flagstaff",
    "word": "flagstaff",
    "ipa": "/'flægstɑ:f/",
    "partOfSpeech": "noun",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "cột cờ",
    "detailedExplanation": "cột cờ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'flagstaff' in communication.",
        "vi": "Chúng ta thường gặp từ 'flagstaff' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=flagstaff&type=2"
  },
  {
    "id": "enc-clockwork",
    "word": "clockwork",
    "ipa": "/'klɔkwə:k/",
    "partOfSpeech": "adjective",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "bộ máy đồng hồ",
    "detailedExplanation": "bộ máy đồng hồ; đều đặn, máy móc như một cái máy; như bộ máy đồng hồ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "like clockwork",
        "vi": "đều đặn như một cái máy",
        "context": "💼 Công Sở & Họp"
      },
      {
        "en": "with clockwork precision",
        "vi": "chính xác như bộ máy đồng hồ",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=clockwork&type=2"
  },
  {
    "id": "enc-reportedly",
    "word": "reportedly",
    "ipa": "/reportedly/",
    "partOfSpeech": "adverb",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "theo như đưa tin, tường trình",
    "detailedExplanation": "theo như đưa tin, tường trình",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'reportedly' in communication.",
        "vi": "Chúng ta thường gặp từ 'reportedly' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=reportedly&type=2"
  },
  {
    "id": "enc-workstation",
    "word": "workstation",
    "ipa": "/workstation/",
    "partOfSpeech": "word",
    "category": "workplace",
    "categoryLabel": "💼 Công Sở & Họp",
    "meaningVi": "trạm làm việc",
    "detailedExplanation": "trạm làm việc",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'workstation' in communication.",
        "vi": "Chúng ta thường gặp từ 'workstation' trong giao tiếp.",
        "context": "💼 Công Sở & Họp"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=workstation&type=2"
  },
  {
    "id": "enc-tax",
    "word": "tax",
    "ipa": "/tæks/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "thuế, cước",
    "detailedExplanation": "thuế, cước; (nghĩa bóng) gánh nặng; sự thử thách, sự đòi hỏi lớn; đánh thuế, đánh cước; (nghĩa bóng) đè nặng lên, bắt phải cố gắng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a tax on one's strength",
        "vi": "một gánh nặng đối với sức mình",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to tax someone's patience",
        "vi": "đòi hỏi ai phải kiên nhẫn rất nhiều",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to tax someone with neglect",
        "vi": "chê người nào sao lãng",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tax&type=2"
  },
  {
    "id": "enc-net",
    "word": "net",
    "ipa": "/net/",
    "partOfSpeech": "adjective",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "lưới, mạng (tóc, nhện...)",
    "detailedExplanation": "lưới, mạng (tóc, nhện...); cạm, bẫy; vải màn; vải lưới; mạng lưới",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to cast (throw) a net",
        "vi": "quăng lưới",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to fall into a net",
        "vi": "rơi vào cạm bẫy, mắc bẫy",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to net fish",
        "vi": "đánh cá bằng lưới",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=net&type=2"
  },
  {
    "id": "enc-bid",
    "word": "bid",
    "ipa": "/bid/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự đặt giá, sự trả giá (trong một cuộc bán đấu giá)",
    "detailedExplanation": "sự đặt giá, sự trả giá (trong một cuộc bán đấu giá); sự bỏ thầu; (thông tục) sự mời; sự xướng bài (bài brit)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "he bids 300d for the bicycle",
        "vi": "anh ấy đặt giá cái xe đạp 300 đồng",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "the firm decided to bid on the new bridge",
        "vi": "công ty ấy quyết định thầu làm cái cầu mới",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a bidden guest",
        "vi": "người khách được mời đến",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bid&type=2"
  },
  {
    "id": "enc-ceo",
    "word": "ceo",
    "ipa": "/ceo/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "viết tắt của Chief Executive Officer",
    "detailedExplanation": "viết tắt của Chief Executive Officer; Người lãnh đạo cao nhất trong một công ty hoặc một tổ chức, chịu trách nhiệm thực hiện hàng ngày các chính sách của hội đồng quản trị; danh từ, viết tắt của Chief Executive Officer; Người lãnh đạo cao nhất trong một công ty hoặc một tổ chức, chịu trách nhiệm thực hiện hàng ngày các chính sách của hội đồng quản trị",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'ceo' in communication.",
        "vi": "Chúng ta thường gặp từ 'ceo' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ceo&type=2"
  },
  {
    "id": "enc-date",
    "word": "date",
    "ipa": "/deit/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "quả chà là",
    "detailedExplanation": "quả chà là; (thực vật học) cây chà là; ngày tháng; niên hiệu, niên kỷ; (thương nghiệp) kỳ, kỳ hạn",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "what's the date today?",
        "vi": "hôm nay ngày bao nhiêu?",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "date of birth",
        "vi": "ngày tháng năm sinh",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to pay at fixed dates",
        "vi": "trả đúng kỳ hạn",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=date&type=2"
  },
  {
    "id": "enc-even",
    "word": "even",
    "ipa": "/'i:vən/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "chiều, chiều hôm",
    "detailedExplanation": "chiều, chiều hôm; bằng phẳng; ngang bằng, ngang; (pháp lý); (thương nghiệp) cùng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "of even date",
        "vi": "cùng ngày",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "an even temper",
        "vi": "tính khí điềm đạm",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "an even tempo",
        "vi": "nhịp độ đều đều",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=even&type=2"
  },
  {
    "id": "enc-game",
    "word": "game",
    "ipa": "/geim/",
    "partOfSpeech": "adjective",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "trò chơi (như bóng đá, quần vợt, bài lá...)",
    "detailedExplanation": "trò chơi (như bóng đá, quần vợt, bài lá...); (thương nghiệp) dụng cụ để chơi (các trò chơi); (số nhiều) cuộc thi điền kinh, cuộc thi đấu; ván (bài, cờ...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to win four games in the first set",
        "vi": "thắng bốn ván trong trận đầu",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to have a game with somebody",
        "vi": "trêu chọc, chế nhạo ai",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to make game of somebody",
        "vi": "đùa cợt ai, chế nhạo ai, giễu ai",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=game&type=2"
  },
  {
    "id": "enc-cost",
    "word": "cost",
    "ipa": "/kɔst/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "giá",
    "detailedExplanation": "giá; chi phí, phí tổn; sự phí (thì giờ, sức lực); (pháp lý) (số nhiều) án phí",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the cost of living",
        "vi": "giá sinh hoạt",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "prime (first) cost",
        "vi": "giá vốn",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to cut costs",
        "vi": "giảm các món chi",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cost&type=2"
  },
  {
    "id": "enc-easy",
    "word": "easy",
    "ipa": "/'i:zi/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "thoải mái, thanh thản, không lo lắng; thanh thoát, ung dung",
    "detailedExplanation": "thoải mái, thanh thản, không lo lắng; thanh thoát, ung dung; dễ, dễ dàng; dễ dãi, dễ tính; dễ thuyết phục; (thương nghiệp) ít người mua, ế ẩm",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "easy manners",
        "vi": "cử chỉ ung dung",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "easy of access",
        "vi": "dễ gần; dễ đi đến",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "easy money",
        "vi": "tiền kiếm được dễ dàng",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=easy&type=2"
  },
  {
    "id": "enc-plus",
    "word": "plus",
    "ipa": "/pʌls/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "cộng với",
    "detailedExplanation": "cộng với; cộng, thêm vào; (toán học); (vật lý) dương (số...); (thương nghiệp) ở bên có của tài khoản",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "3 plus 4",
        "vi": "ba cộng với 4",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=plus&type=2"
  },
  {
    "id": "enc-mean",
    "word": "mean",
    "ipa": "/mi:n/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "khoảng giữa, trung độ, trung gian, trung dung",
    "detailedExplanation": "khoảng giữa, trung độ, trung gian, trung dung; (toán học) giá trị trung bình; số trung bình; (số nhiều) ((thường) dùng như số ít) phương tiện, kế, biện pháp, cách; (số nhiều) của, của cải, tài sản, khả năng (kinh tế)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the happy mean; the holden mean",
        "vi": "trung dung, chính sách chiết trung",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "means of living",
        "vi": "kế sinh nhai",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "means of communication",
        "vi": "phương tiện giao thông",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=mean&type=2"
  },
  {
    "id": "enc-fund",
    "word": "fund",
    "ipa": "/fʌnd/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "kho",
    "detailedExplanation": "kho; quỹ; (số nhiều) tiền của; (số nhiều) quỹ công trái nhà nước",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a fund of humour",
        "vi": "một kho hài hước",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "in funds",
        "vi": "có tiền, nhiều tiền",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=fund&type=2"
  },
  {
    "id": "enc-deal",
    "word": "deal",
    "ipa": "/di:l/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "gỗ tùng, gỗ thông",
    "detailedExplanation": "gỗ tùng, gỗ thông; tấm ván cây; số lượng; sự chia bài, lượt chia bài, ván bài",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a great deal of",
        "vi": "rất nhiều",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a good deal of money",
        "vi": "khá nhiều tiền",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a good deal better",
        "vi": "tố hơn nhiều",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=deal&type=2"
  },
  {
    "id": "enc-debt",
    "word": "debt",
    "ipa": "/det/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "nợ",
    "detailedExplanation": "nợ; món nợ không hy vọng được trả; mang công mắc nợ; mắc nợ ai",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'debt' in communication.",
        "vi": "Chúng ta thường gặp từ 'debt' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=debt&type=2"
  },
  {
    "id": "enc-duty",
    "word": "duty",
    "ipa": "/'dju:ti/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự tôn kính, lòng kính trọng (người trên)",
    "detailedExplanation": "sự tôn kính, lòng kính trọng (người trên); bổn phận, nhiệm vụ, trách nhiệm; phận sự, chức vụ, công việc, phần việc làm; phiên làm, phiên trực nhật; thuế (hải quan...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "in duty to...",
        "vi": "vì lòng tôn kính đối với...",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to pay one's duty to...",
        "vi": "để tỏ lòng tôn kính đối với...",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to do one's duty",
        "vi": "làm nhiệm vụ, làm bổn phận",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=duty&type=2"
  },
  {
    "id": "enc-bond",
    "word": "bond",
    "ipa": "/bɔnd/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "dây đai, đay buộc; ((nghĩa bóng)) mối quan hệ, mối ràng buộc",
    "detailedExplanation": "dây đai, đay buộc; ((nghĩa bóng)) mối quan hệ, mối ràng buộc; giao kèo, khế ước, lời cam kết; (tài chính) phiếu nợ, bông; (số nhiều) gông cùm, xiềng xích, sự tù tội",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to enter in to a bond to",
        "vi": "ký giao kèo, cam kết (làm gì)",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "in bonds",
        "vi": "bị gông cùm, bị giam cầm",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "in bond",
        "vi": "gửi vào kho (hàng hoá)",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bond&type=2"
  },
  {
    "id": "enc-wage",
    "word": "wage",
    "ipa": "/weidʤ/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "tiền lương, tiền công",
    "detailedExplanation": "tiền lương, tiền công; (từ cổ,nghĩa cổ) phần thưởng; hậu quả; tiến hành; (từ cổ,nghĩa cổ) đánh cuộc",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to earn (get) good wages",
        "vi": "được trả lương cao",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "starving wages",
        "vi": "đồng lương chết đói",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "the wages of sin is death",
        "vi": "hậu quả của tội lỗi là chết",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=wage&type=2"
  },
  {
    "id": "enc-hose",
    "word": "hose",
    "ipa": "/houz/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "(thương nghiệp) bít tất dài",
    "detailedExplanation": "(thương nghiệp) bít tất dài; (số nhiều) ống vòi; lắp ống, lắp vòi; tưới nước bằng vòi",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "rubber hoses",
        "vi": "ống cao su",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=hose&type=2"
  },
  {
    "id": "enc-memo",
    "word": "memo",
    "ipa": "/,memə'rændə/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự ghi để nhớ",
    "detailedExplanation": "sự ghi để nhớ; (ngoại giao) giác thư, bị vong lục; (pháp lý) bản ghi điều khoản (của giao kèo); (thương nghiệp) bản sao, thư báo",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to make a memoranda of something",
        "vi": "ghi một chuyện gì để nhớ",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=memo&type=2"
  },
  {
    "id": "enc-kite",
    "word": "kite",
    "ipa": "/kait/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "cái diều",
    "detailedExplanation": "cái diều; (động vật học) diều hâu; (nghĩa bóng) kẻ tham tàn; kẻ bịp bợm, quân bạc bịp; (thương nghiệp),  (từ lóng) văn tự giả; hối phiếu giả",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'kite' in communication.",
        "vi": "Chúng ta thường gặp từ 'kite' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=kite&type=2"
  },
  {
    "id": "enc-opal",
    "word": "opal",
    "ipa": "/'oupəl/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "(khoáng chất) Opan",
    "detailedExplanation": "(khoáng chất) Opan; (thương nghiệp) kính trắng đục",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'opal' in communication.",
        "vi": "Chúng ta thường gặp từ 'opal' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=opal&type=2"
  },
  {
    "id": "enc-agio",
    "word": "agio",
    "ipa": "/'ædʤiou/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "tiền lời, đổi tiền (thu được trong việc đổi chác tiền bạc)",
    "detailedExplanation": "tiền lời, đổi tiền (thu được trong việc đổi chác tiền bạc); nghề đổi tiền; (tài chính) giá tiền chênh lệch (giá trị chênh lệch giữa hai loại tiền)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'agio' in communication.",
        "vi": "Chúng ta thường gặp từ 'agio' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=agio&type=2"
  },
  {
    "id": "enc-cony",
    "word": "cony",
    "ipa": "/'kouni/ (coney) /'kouni/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "(từ Mỹ,nghĩa Mỹ) con thỏ",
    "detailedExplanation": "(từ Mỹ,nghĩa Mỹ) con thỏ; (thương nghiệp) da lông thỏ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "cony skin",
        "vi": "da thỏ",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cony&type=2"
  },
  {
    "id": "enc-value",
    "word": "value",
    "ipa": "/'vælju:/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "giá trị",
    "detailedExplanation": "giá trị; (thương nghiệp); (tài chính) giá cả, giá; (vật lý) năng suất; (văn học) nghĩa, ý nghĩa",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "of a great value",
        "vi": "có giá trị lớn, quý",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "of no value",
        "vi": "không có giá trị",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to be of value",
        "vi": "có giá trị",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=value&type=2"
  },
  {
    "id": "enc-stock",
    "word": "stock",
    "ipa": "/stɔk/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "kho dữ trữ, kho; hàng trong kho",
    "detailedExplanation": "kho dữ trữ, kho; hàng trong kho; (tài chính) vốn; cổ phân; (thực vật học) thân chính; (thực vật học) gốc ghép",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "stock in hand",
        "vi": "hàng hoá trong kho",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "in stock",
        "vi": "tồn kho, cất trong kho",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "bank stock",
        "vi": "vốn của một ngân hàng",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=stock&type=2"
  },
  {
    "id": "enc-brand",
    "word": "brand",
    "ipa": "/brænd/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "nhãn (hàng hoá)",
    "detailedExplanation": "nhãn (hàng hoá); loại hàng; dấu sắt nung (đóng vào vai tội nhân); vết dấu sắt nung; vết nhơ, vết nhục",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "he was branded as a war criminal",
        "vi": "hắn bị quy là tội phạm chiến tranh",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=brand&type=2"
  },
  {
    "id": "enc-union",
    "word": "union",
    "ipa": "/'ju:njən/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự hợp nhất, sự kết hợp, sự liên kết; liên minh, liên hiệp",
    "detailedExplanation": "sự hợp nhất, sự kết hợp, sự liên kết; liên minh, liên hiệp; sự nhất trí, sự cộng đồng, sự đoàn kết, sự hoà hợp; hiệp hội, liên hiệp; đồng minh; liên bang; sự kết hôn, hôn nhân",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the union of several co-operatives",
        "vi": "sự hợp nhất của nhiều hợp tác xã",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a union by treaty",
        "vi": "sự liên kết bằng hiệp ước",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "union is strength",
        "vi": "đoàn kết là sức mạnh",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=union&type=2"
  },
  {
    "id": "enc-allow",
    "word": "allow",
    "ipa": "/ə'lau/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "cho phép để cho",
    "detailedExplanation": "cho phép để cho; thừa nhận, công nhận, chấp nhận; cho, cấp cho, trợ cấp, cấp phát; (thương nghiệp); (tài chính) trừ bớt; thêm",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "allow me to help you",
        "vi": "cho phép tôi được giúp anh một tay",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "smoking is not allowed here",
        "vi": "không được hút thuốc lá ở đây",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to allow oneself",
        "vi": "tự cho phép mình",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=allow&type=2"
  },
  {
    "id": "enc-trial",
    "word": "trial",
    "ipa": "/'traiəl/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự thử",
    "detailedExplanation": "sự thử; (pháp lý) việc xét xử, sự xử án; điều thử thách; nỗi gian nan; (tài chính)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to give something a trial",
        "vi": "đưa một vật ra thử",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to make the trial",
        "vi": "làm thử, làm thí nghiệm",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to proceed by trial and error",
        "vi": "tiến hành bằng cách mò mẫm",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=trial&type=2"
  },
  {
    "id": "enc-piece",
    "word": "piece",
    "ipa": "/pi:s/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "mảnh, mẩu, miếng, viên, cục, khúc...",
    "detailedExplanation": "mảnh, mẩu, miếng, viên, cục, khúc...; bộ phận, mảnh rời; (thương nghiệp) đơn vị, cái, chiếc, tấm cuộn (vải); thùng (rượu...); bức (tranh); bài (thơ); bản (nhạc); vở (kịch)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a piece of paper",
        "vi": "một mảnh giấy",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a piece of wood",
        "vi": "một mảnh gỗ",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a piece of bread",
        "vi": "một mẩu bánh mì",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=piece&type=2"
  },
  {
    "id": "enc-bonus",
    "word": "bonus",
    "ipa": "/'bounəs/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "tiền thưởng",
    "detailedExplanation": "tiền thưởng; tiền các; lợi tức chia thêm (cho người có cổ phần; (từ Mỹ,nghĩa Mỹ) cho người có bảo hiểm)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'bonus' in communication.",
        "vi": "Chúng ta thường gặp từ 'bonus' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bonus&type=2"
  },
  {
    "id": "enc-audit",
    "word": "audit",
    "ipa": "/'ɔ:dit/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự kiểm tra (sổ sách)",
    "detailedExplanation": "sự kiểm tra (sổ sách); sự thanh toán các khoản (theo kỳ hạn) giữa tá điền và địa chủ; kiểm tra (sổ sách)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "audit ale",
        "vi": "bia đặc biệt trong ngày kiểm tra sổ sách",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=audit&type=2"
  },
  {
    "id": "enc-meant",
    "word": "meant",
    "ipa": "/mi:n/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "khoảng giữa, trung độ, trung gian, trung dung",
    "detailedExplanation": "khoảng giữa, trung độ, trung gian, trung dung; (toán học) giá trị trung bình; số trung bình; (số nhiều) ((thường) dùng như số ít) phương tiện, kế, biện pháp, cách; (số nhiều) của, của cải, tài sản, khả năng (kinh tế)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the happy mean; the holden mean",
        "vi": "trung dung, chính sách chiết trung",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "means of living",
        "vi": "kế sinh nhai",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "means of communication",
        "vi": "phương tiện giao thông",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=meant&type=2"
  },
  {
    "id": "enc-lease",
    "word": "lease",
    "ipa": "/li:s/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "hợp đồng cho thuê",
    "detailedExplanation": "hợp đồng cho thuê; đem cho thuê; cho thuê theo hợp đồng; lại hoạt động, lại vui sống (sau khi ốm nặng hay sau khi một việc lo buồn)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to take a house on a lease of several years",
        "vi": "thuê một căn nhà có ký hợp đồng trong nhiều năm",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "long lease",
        "vi": "hợp đồng cho thuê dài hạn",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=lease&type=2"
  },
  {
    "id": "enc-gross",
    "word": "gross",
    "ipa": "/grous/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "mười hai tá, gốt ((cũng) small gross)",
    "detailedExplanation": "mười hai tá, gốt ((cũng) small gross); gộp cả, tính tổng quát, nói chung; to béo, phì nộm, béo phị (người); thô và béo ngậy (thức ăn)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "great gross",
        "vi": "144 tá",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "gross habit of body",
        "vi": "thân hình to béo phì nộm",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a gross feeder",
        "vi": "người thích những món ăn thô và béo ngậy; cây ăn tốn màu",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=gross&type=2"
  },
  {
    "id": "enc-yield",
    "word": "yield",
    "ipa": "/ji:ld/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sản lượng, hoa lợi (thửa ruộng); hiệu suất (máy...)",
    "detailedExplanation": "sản lượng, hoa lợi (thửa ruộng); hiệu suất (máy...); (tài chính) lợi nhuận, lợi tức; (kỹ thuật) sự cong, sự oằn; (nông nghiệp) sản xuất, sản ra, mang lại",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "in full yield",
        "vi": "có hiệu suất cao; đang sinh lợi nhiều",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a tree yields fruit",
        "vi": "cây sinh ra quả",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "this land yields good crops",
        "vi": "miếng đất này mang lại thu hoạch tốt",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=yield&type=2"
  },
  {
    "id": "enc-debit",
    "word": "debit",
    "ipa": "/'debit/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự ghi nợ",
    "detailedExplanation": "sự ghi nợ; món nợ khoản nợ; (kế toán) bên nợ; ghi (một món nợ) vào sổ nợ (debit against,  to) ghi (một món nợ) vào sổ ai",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to put to the debit of somebody",
        "vi": "ghi vào sổ nợ của ai",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=debit&type=2"
  },
  {
    "id": "enc-niche",
    "word": "niche",
    "ipa": "/nitʃ/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "(kiến trúc) hốc thường (thường để đặt tượng...)",
    "detailedExplanation": "(kiến trúc) hốc thường (thường để đặt tượng...); (nghĩa bóng) chỗ thích hợp; quyền được người ta tưởng nhớ đến công lao; đặt (tượng) vào hốc tường",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "thg to niche oneself",
        "vi": "nép; náu; ngồi gọn",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=niche&type=2"
  },
  {
    "id": "enc-quota",
    "word": "quota",
    "ipa": "/'kwoutə/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "phần (phải đóng góp hoặc được chia)",
    "detailedExplanation": "phần (phải đóng góp hoặc được chia); chỉ tiêu",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'quota' in communication.",
        "vi": "Chúng ta thường gặp từ 'quota' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "B2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=quota&type=2"
  },
  {
    "id": "enc-tally",
    "word": "tally",
    "ipa": "/'tæli/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự kiểm điểm (hàng hoá, tên...)",
    "detailedExplanation": "sự kiểm điểm (hàng hoá, tên...); nhãn (ghi tên hàng); biển (khắc tên cây ở vường bách thảo...); (pháp lý) bản đối chiếu, vật đối chiếu; (thương nghiệp) số tính toán (chục, tá, trăm...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "what you say doesn't tally with what he told me",
        "vi": "điều anh nói không phù hợp với điều nó đã nói với tôi",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tally&type=2"
  },
  {
    "id": "enc-appro",
    "word": "appro",
    "ipa": "/'æprou/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "(thương nghiệp),  (thông tục) (như) approval,  approbation",
    "detailedExplanation": "(thương nghiệp),  (thông tục) (như) approval,  approbation; nếu không ưng ý xin trả về (hàng hoá gửi đi)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'appro' in communication.",
        "vi": "Chúng ta thường gặp từ 'appro' trong giao tiếp.",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=appro&type=2"
  },
  {
    "id": "enc-bulge",
    "word": "bulge",
    "ipa": "/bʌldʤ/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "chỗ phình, chỗ phồng, chỗ lồi ra",
    "detailedExplanation": "chỗ phình, chỗ phồng, chỗ lồi ra; (thương nghiệp),  (thông tục) sự tăng tạm thời (số lượng, chất lượng); sự nêu giá; (hàng hải) đáy tàu; the bulge (từ Mỹ,nghĩa Mỹ),  (từ lóng) thế lợi, ưu thế",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to have the bulge on somebody",
        "vi": "nắm ưu thế hơn ai",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bulge&type=2"
  },
  {
    "id": "enc-coney",
    "word": "coney",
    "ipa": "/'kouni/ (coney) /'kouni/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "(từ Mỹ,nghĩa Mỹ) con thỏ",
    "detailedExplanation": "(từ Mỹ,nghĩa Mỹ) con thỏ; (thương nghiệp) da lông thỏ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "cony skin",
        "vi": "da thỏ",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "C1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=coney&type=2"
  },
  {
    "id": "enc-travel",
    "word": "travel",
    "ipa": "/'træveil/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự đi du lịch; cuộc du hành",
    "detailedExplanation": "sự đi du lịch; cuộc du hành; sự chạy đi chạy lại; đường chạy (của máy,  pittông...); đi du lịch; du hành; (thương nghiệp) đi mời hàng, đi chào hàng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to go on a travel",
        "vi": "đi du lịch, du hành",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to travel by sea",
        "vi": "đi du lịch bằng đường biển",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to travel light",
        "vi": "đi du lịch mang theo ít hành lý",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=travel&type=2"
  },
  {
    "id": "enc-return",
    "word": "return",
    "ipa": "/ri'tə:n/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự trở lại, sự trở về, sự quay trở lại",
    "detailedExplanation": "sự trở lại, sự trở về, sự quay trở lại; vé khứ hồi ((cũng) return ticket); sự gửi trả lại, sự trả lại (một vật gì); vật được trả lại; ((thường) số nhiều) (thương nghiệp) hàng hoá gửi trả lại; sách báo ế; hàng ế",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to reply by return of post",
        "vi": "trả lời qua chuyến thư về",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "in return for someone's kindness",
        "vi": "để đền đáp lại lòng tốt của ai",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "return of the killed and wounded",
        "vi": "bản thống kê những người chết và bị thương",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=return&type=2"
  },
  {
    "id": "enc-credit",
    "word": "credit",
    "ipa": "/'kredit/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự tin, lòng tin",
    "detailedExplanation": "sự tin, lòng tin; danh tiếng; danh vọng, uy tín; nguồn vẻ vang; sự vẻ vang; thế lực, ảnh hưởng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to give credit to a story",
        "vi": "tin một câu chuyện",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a man of the highest credit",
        "vi": "người có uy tín nhất",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to do someone credit; to do credit to someone",
        "vi": "làm ai nổi tiếng",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=credit&type=2"
  },
  {
    "id": "enc-market",
    "word": "market",
    "ipa": "/'mɑ:kit/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "chợ",
    "detailedExplanation": "chợ; thị trường, nơi tiêu thụ; khách hàng; giá thị trường; tình hình thị trường; làm hỏng việc, làm lỡ việc; hỏng kế hoạch, tính sai",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to go to market",
        "vi": "đi chợ",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "the foreign market",
        "vi": "thị trường nước ngoài",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "the market fell",
        "vi": "giá thị trường xuống",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=market&type=2"
  },
  {
    "id": "enc-future",
    "word": "future",
    "ipa": "/'fju:tʃə/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "tương lai",
    "detailedExplanation": "tương lai; tương lai; (số nhiều) (thương nghiệp) hàng hoá bán sẽ giao sau; hợp đông về hàng hoá bán giao sau",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "future tense",
        "vi": "(ngôn ngữ học) thời tương lai",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "future state",
        "vi": "kiếp sau",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "future wife",
        "vi": "vợ sắp cưới",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=future&type=2"
  },
  {
    "id": "enc-record",
    "word": "record",
    "ipa": "/'rekɔ:d/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "(pháp lý) hồ sơ",
    "detailedExplanation": "(pháp lý) hồ sơ; biên bản; sự ghi chép; (số nhiều) văn thư; (thương nghiệp) sổ sách",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to be on record",
        "vi": "được ghi vào hồ sơ; có thực (vì đã được ghi vào hồ sơ)",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "it is on record that...",
        "vi": "trong sử có ghi chép rằng...",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to have a clean record",
        "vi": "có lý lịch trong sạch",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=record&type=2"
  },
  {
    "id": "enc-annual",
    "word": "annual",
    "ipa": "/'ænjuəl/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "hàng năm, năm một, từng năm",
    "detailedExplanation": "hàng năm, năm một, từng năm; sống một năm (cây); xuất bản hàng năm (sách); (thực vật học) cây một năm",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "annual report",
        "vi": "bản báo cáo hàng năm",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "annual ring",
        "vi": "(thực vật học) vòng năm (cây)",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=annual&type=2"
  },
  {
    "id": "enc-agency",
    "word": "agency",
    "ipa": "/'eidʤənsi/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "tác dụng, lực",
    "detailedExplanation": "tác dụng, lực; sự môi giới, sự trung gian; (thương nghiệp) đại lý, phân điểm, chi nhánh; cơ quan, sở, hãng, hãng thông tấn",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "through (by) the agency of...",
        "vi": "nhờ sự môi giới của...",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "Vietnam News Agency",
        "vi": "Việt Nam thông tấn xã",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=agency&type=2"
  },
  {
    "id": "enc-income",
    "word": "income",
    "ipa": "/'inkəm/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "thu nhập, doanh thu, lợi tức",
    "detailedExplanation": "thu nhập, doanh thu, lợi tức",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "national income",
        "vi": "thu nhập quốc dân",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to live within one's income",
        "vi": "sống trong phạm vi số tiền thu nhập",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to live beyond one's income",
        "vi": "sống quá phạm vi số tiền thu nhập, vung tay quá trán",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=income&type=2"
  },
  {
    "id": "enc-mature",
    "word": "mature",
    "ipa": "/mə'tjuə/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "chín, thành thực, trưởng thành",
    "detailedExplanation": "chín, thành thực, trưởng thành; cẩn thận, chín chắn, kỹ càng; (thương nghiệp) đến kỳ hạn phải thanh toán; mân kỳ (hoá đơn); làm cho chín, làm cho chín chắn, làm cho hoàn thiện (kế hoạch...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "mature years",
        "vi": "tuổi trưởng thành, tuổi thành niên",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "after mature deliberation",
        "vi": "sau khi đã suy xét kỹ càng; sau khi đã đắn đo suy nghĩ",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "the plan is not mature yet",
        "vi": "kế hoạch chưa chín chắn",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=mature&type=2"
  },
  {
    "id": "enc-advice",
    "word": "advice",
    "ipa": "/əd'vais/",
    "partOfSpeech": "noun",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "lời khuyên, lời chỉ bảo",
    "detailedExplanation": "lời khuyên, lời chỉ bảo; ((thường) số nhiều) tin tức; theo những tin tức cuối cùng chúng tôi nhận được; (số nhiều) (thương nghiệp) thư thông báo ((cũng) letter of advice)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to act on advice",
        "vi": "làm (hành động) theo lời khuyên",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to take advice",
        "vi": "theo lời khuyên, nghe theo lời khuyên",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "a piece of advice",
        "vi": "lời khuyên",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=advice&type=2"
  },
  {
    "id": "enc-career",
    "word": "career",
    "ipa": "/kə'riə/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "nghề, nghề nghiệp",
    "detailedExplanation": "nghề, nghề nghiệp; sự nghiệp (của một người); đời hoạt động; quá trình phát triển (của một đảng phái, một nguyên tắc); tốc lực; sự chạy nhanh; sự lao nhanh; đà lao nhanh; (định ngữ),  (từ Mỹ,nghĩa Mỹ) nhà nghề, chuyên nghiệp (ngoại giao...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to choose a career",
        "vi": "chọn nghề",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "at the end of his career",
        "vi": "vào cuối đời hoạt động của anh ta",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "we can learn much by reading about the careers of great men",
        "vi": "chúng ta học tập được nhiều điều khi đọc về sự nghiệp của các vĩ nhân",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=career&type=2"
  },
  {
    "id": "enc-budget",
    "word": "budget",
    "ipa": "/'bʌdʤit/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "ngân sách, ngân quỹ",
    "detailedExplanation": "ngân sách, ngân quỹ; túi (đầy), bao (đầy); (nghĩa rộng) đống, kho, cô khối; dự thảo ngân sách; ghi vào ngân sách",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "budget of news",
        "vi": "vô khối tin tức",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to budget for the coming year",
        "vi": "dự thảo ngân sách cho năm tới",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=budget&type=2"
  },
  {
    "id": "enc-retail",
    "word": "retail",
    "ipa": "/'ri:teil/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "sự bán lẻ",
    "detailedExplanation": "sự bán lẻ; bán lẻ; bán lẻ; thuật lại, kể lại chi tiết; truyền đi, phao, loan (tin đồn)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "retail price",
        "vi": "giá bán lẻ",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "retail trading",
        "vi": "việc buôn bán lẻ",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "retail dealer",
        "vi": "người buôn bán lẻ",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=retail&type=2"
  },
  {
    "id": "enc-accept",
    "word": "accept",
    "ipa": "/ək'sept/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "nhận, chấp nhận, chấp thuận",
    "detailedExplanation": "nhận, chấp nhận, chấp thuận; thừa nhận; đảm nhận (công việc...); (thương nghiệp) chịu trách nhiệm về; nhận thanh toán (hoá đơn, hối phiếu...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to accept a proposal",
        "vi": "chấp nhận một đề nghị",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to accept a present",
        "vi": "nhận một món quà",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to accept an invitation",
        "vi": "nhận lời mời",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=accept&type=2"
  },
  {
    "id": "enc-branch",
    "word": "branch",
    "ipa": "/brɑ:ntʃ/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "cành cây",
    "detailedExplanation": "cành cây; nhánh (sông); ngả (đường)...; chi (của một dòng họ...); chi nhánh (ngân hàng...); ngành (sản xuất; mậu dịch...); (xem) root",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a branch of a river",
        "vi": "một nhánh sông",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "the road branches here",
        "vi": "ở chỗ này đường chia ra nhiều ngã",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=branch&type=2"
  },
  {
    "id": "enc-corner",
    "word": "corner",
    "ipa": "/'kɔ:nə/",
    "partOfSpeech": "verb",
    "category": "toeic",
    "categoryLabel": "🎯 Từ Vựng TOEIC",
    "meaningVi": "góc (tường, nhà, phố...)",
    "detailedExplanation": "góc (tường, nhà, phố...); nơi kín đáo, xó xỉnh; chỗ ẩn náu, chỗ giấu giếm; nơi, phương; (thương nghiệp) sự đầu cơ, sự lũng đoạn thị trường",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the corner of the street",
        "vi": "góc phố",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "to put a child in the corner",
        "vi": "bắt phạt đứa trẻ đứng vào góc tường",
        "context": "🎯 Từ Vựng TOEIC"
      },
      {
        "en": "done in a corner",
        "vi": "làm giấu giếm, làm lén lút",
        "context": "🎯 Từ Vựng TOEIC"
      }
    ],
    "level": "A2",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=corner&type=2"
  },
  {
    "id": "enc-the",
    "word": "the",
    "ipa": "/ði:, ði, ðə/",
    "partOfSpeech": "adverb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "cái, con, người...",
    "detailedExplanation": "cái, con, người...; ấy, này (người, cái, con...); duy nhất (người, vật...); (trước một từ so sánh) càng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the house",
        "vi": "cái nhà",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "the cat",
        "vi": "con mèo",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "I dislike the man",
        "vi": "tôi không thích người này",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=the&type=2"
  },
  {
    "id": "enc-and",
    "word": "and",
    "ipa": "/ænd, ənd, ən/",
    "partOfSpeech": "conjunction",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "và, cùng, với",
    "detailedExplanation": "và, cùng, với; nếu dường như, tuồng như là; còn; (không dịch)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to buy and sell",
        "vi": "mua và bán",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "you and I",
        "vi": "anh với (và) tôi",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "let him go and need be",
        "vi": "hãy để anh ta đi nếu cần",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=and&type=2"
  },
  {
    "id": "enc-for",
    "word": "for",
    "ipa": "/fɔ:,fə/",
    "partOfSpeech": "conjunction",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "thay cho, thế cho, đại diện cho",
    "detailedExplanation": "thay cho, thế cho, đại diện cho; ủng hộ, về phe, về phía; để, với mục đích là; để lấy, để được",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to sit for Hanoi",
        "vi": "đại diện cho Hà nội (ở quốc hội...)",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to stand for a noun",
        "vi": "(ngôn ngữ học) thay cho một danh từ (đại từ)",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "he signed it for me",
        "vi": "anh ta ký cái đó thay tôi",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=for&type=2"
  },
  {
    "id": "enc-you",
    "word": "you",
    "ipa": "/ju:/",
    "partOfSpeech": "word",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "anh, chị, ông, bà, ngài, ngươi, mày; các anh, các chị, các ông, các bà, các ngài, các người, chúng mày",
    "detailedExplanation": "anh, chị, ông, bà, ngài, ngươi, mày; các anh, các chị, các ông, các bà, các ngài, các người, chúng mày; ai, người ta",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "you all know that...",
        "vi": "tất cả các anh đều biết rằng...",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "he spoke of you",
        "vi": "hắn ta nói về anh",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "if I were you",
        "vi": "nếu tôi là anh",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=you&type=2"
  },
  {
    "id": "enc-not",
    "word": "not",
    "ipa": "/nɔt/",
    "partOfSpeech": "adverb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "không",
    "detailedExplanation": "không; hẳn là, chắc là; (xem) but; (xem) half",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "I did not say so",
        "vi": "tôi không hề nói như vậy",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "not without reason",
        "vi": "không phải là không có lý",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "he'll be at home now, as likes as not",
        "vi": "hẳn là bây giờ nó có nhà",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=not&type=2"
  },
  {
    "id": "enc-all",
    "word": "all",
    "ipa": "/ɔ:l/",
    "partOfSpeech": "adverb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "tất cả, hết thảy, toàn bộ, suốt trọn, mọi",
    "detailedExplanation": "tất cả, hết thảy, toàn bộ, suốt trọn, mọi; tất cả, tất thảy, hết thảy, toàn thể, toàn bộ; (xem) above; (xem) after",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "all my life",
        "vi": "suốt đời tôi, trọn đời tôi",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "all day",
        "vi": "suốt ngày",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "with all speed",
        "vi": "hết tốc độ",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=all&type=2"
  },
  {
    "id": "enc-new",
    "word": "new",
    "ipa": "/nju:/",
    "partOfSpeech": "adverb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "mới, mới mẻ, mới lạ",
    "detailedExplanation": "mới, mới mẻ, mới lạ; khác hẳn; tân tiến, tân thời, hiện đại; mới nổi (gia đình, người)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the new year",
        "vi": "năm mới",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "a new suit of clothes",
        "vi": "một bộ quần áo mới; như mới",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to do up like new",
        "vi": "sửa lại như mới",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=new&type=2"
  },
  {
    "id": "enc-was",
    "word": "was",
    "ipa": "/bi:/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "thì, là",
    "detailedExplanation": "thì, là; có, tồn tại, ở, sống; trở nên, trở thành; xảy ra, diễn ra",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the earth is round",
        "vi": "quả đất (thì) tròn",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "he is a teacher",
        "vi": "anh ta là giáo viên",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "there is a concert today",
        "vi": "hôm nay có một buổi hoà nhạc",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=was&type=2"
  },
  {
    "id": "enc-has",
    "word": "has",
    "ipa": "/hæv, həv, v/ (has) /hæz, həz, əz, z/ (hast) /hæst/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "có",
    "detailedExplanation": "có; (+ from) nhận được, biết được; ăn; uống; hút; hưởng; bị",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to have nothing to do",
        "vi": "không có việc gì làm",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "June has 30 days",
        "vi": "tháng sáu có 30 ngày",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to have news from somebody",
        "vi": "nhận được tin ở ai, nhờ ai mà biết tin",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=has&type=2"
  },
  {
    "id": "enc-but",
    "word": "but",
    "ipa": "/bʌt/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "nhưng, nhưng mà",
    "detailedExplanation": "nhưng, nhưng mà; nếu không; không còn cách nào khác; mà lại không; chỉ, chỉ là, chỉ mới",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "we tried to do it but couldn't",
        "vi": "chúng tôi đã thử làm cái đó nhưng không được",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "I can't but answer in the negative",
        "vi": "chúng tôi không còn cách nào khác là phải trả lời từ chối",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "he never comes but he borrows books from me",
        "vi": "chẳng lần nào nó đến mà lại không mượn sách của tôi",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=but&type=2"
  },
  {
    "id": "enc-our",
    "word": "our",
    "ipa": "/'auə/",
    "partOfSpeech": "adjective",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "của chúng ta, của chúng tôi, của chúng mình",
    "detailedExplanation": "của chúng ta, của chúng tôi, của chúng mình; của trẫm (vua chúa...); thượng đế; Đức Chúa Giê-xu (đối với người theo đạo Thiên chúa)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "in our opinion",
        "vi": "theo ý kiến chúng tôi",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=our&type=2"
  },
  {
    "id": "enc-one",
    "word": "one",
    "ipa": "/wʌn/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "một",
    "detailedExplanation": "một; như thế không thay đổi; (xem) all; kết hôn, lấy nhau",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "room one",
        "vi": "phòng một",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "volume one",
        "vi": "tập một",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "the Vietnamese nation is one and undivided",
        "vi": "dân tộc Việt Nam là một và thống nhất",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=one&type=2"
  },
  {
    "id": "enc-out",
    "word": "out",
    "ipa": "/aut/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "ngoài, ở ngoài, ra ngoài",
    "detailedExplanation": "ngoài, ở ngoài, ra ngoài; ra; hẳn, hoàn toàn hết; không nắm chính quyền",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to be out in the rain",
        "vi": "ở ngoài mưa",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to be out",
        "vi": "đi vắng",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to put out to sea",
        "vi": "ra khơi",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=out&type=2"
  },
  {
    "id": "enc-use",
    "word": "use",
    "ipa": "/ju:s/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "sự dùng; cách dùng",
    "detailedExplanation": "sự dùng; cách dùng; quyền dùng, quyền sử dụng; năng lực sử dụng; thói quen, tập quán",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to put to use",
        "vi": "đưa ra dùng",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "in common use",
        "vi": "thường dùng",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "in use",
        "vi": "được dùng, thông dụng",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=use&type=2"
  },
  {
    "id": "enc-any",
    "word": "any",
    "ipa": "/'eni/",
    "partOfSpeech": "adverb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "một, một (người, vật) nào đó (trong câu hỏi)",
    "detailedExplanation": "một, một (người, vật) nào đó (trong câu hỏi); tuyệt không, không tí nào (ý phủ định); bất cứ (ý khẳng định); một, một người nào đó, một vật nào đó (trong câu hỏi)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "have you any book(s)?",
        "vi": "anh có quyển sách nào không?",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "I haven't any penny",
        "vi": "tôi tuyệt không có đồng xu nào",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to prevent any casualtry",
        "vi": "tránh không bị thương tổn",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=any&type=2"
  },
  {
    "id": "enc-see",
    "word": "see",
    "ipa": "/si:/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "thấy, trông thấy, nhìn thấy; xem, quan sát, xem xét",
    "detailedExplanation": "thấy, trông thấy, nhìn thấy; xem, quan sát, xem xét; xem, đọc (trang báo chí); hiểu rõ, nhận ra; trải qua, từng trải, đã qua",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "seeing is believing",
        "vi": "trông thấy thì mới tin",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "I saw him in the distance",
        "vi": "tôi trông thấy nó từ xa",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "things seen",
        "vi": "những vật ta có thể nhìn thấy, những vật cụ thể, những vật có thật",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=see&type=2"
  },
  {
    "id": "enc-his",
    "word": "his",
    "ipa": "/hiz/",
    "partOfSpeech": "word",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "của nó, của hắn, của ông ấy, của anh ấy",
    "detailedExplanation": "của nó, của hắn, của ông ấy, của anh ấy; cái của nó, cái của hắn, cái của ông ấy, cái của anh ấy",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "his hat",
        "vi": "cái mũ của hắn",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "that book is his",
        "vi": "quyển sách kia là của hắn",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=his&type=2"
  },
  {
    "id": "enc-who",
    "word": "who",
    "ipa": "/hu:/",
    "partOfSpeech": "word",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "ai, người nào, kẻ nào, người như thế nào",
    "detailedExplanation": "ai, người nào, kẻ nào, người như thế nào; (những) người mà; hắn, họ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "who came?",
        "vi": "người nào đ  đến?",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "who is speaking?",
        "vi": "ai đang nói đó?",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "the witnesses were called, who declared...",
        "vi": "những nhân chứng được gọi đến, đ  khai...",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=who&type=2"
  },
  {
    "id": "enc-now",
    "word": "now",
    "ipa": "/nau/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "bây giờ, lúc này, giờ đây, hiện nay, ngày nay",
    "detailedExplanation": "bây giờ, lúc này, giờ đây, hiện nay, ngày nay; ngay bây giờ, ngay tức khắc, lập tức; lúc ấy, lúc đó, lúc bấy giờ (trong lúc kể chuyện); trong tình trạng đó, trong hoàn cảnh ấy, trong tình thế ấy",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "just (even, but) now",
        "vi": "đúng lúc này; vừa mới xong, ngay vừa rồi",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "do it now!",
        "vi": "hây làm cái đó ngay tức khắc!",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "now or never",
        "vi": "ngay bây giờ hoặc không bao giờ hết",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=now&type=2"
  },
  {
    "id": "enc-get",
    "word": "get",
    "ipa": "/get/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "được, có được, kiếm được, lấy được",
    "detailedExplanation": "được, có được, kiếm được, lấy được; nhận được, xin được, hỏi được; tìm ra, tính ra; mua",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to get a living",
        "vi": "kiếm sống",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to get little by it",
        "vi": "không được lợi lộc gì ở cái đó",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to get fame",
        "vi": "nổi tiếng",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=get&type=2"
  },
  {
    "id": "enc-how",
    "word": "how",
    "ipa": "/hau/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "thế nào, như thế nào; sao, ra sao, làm sao",
    "detailedExplanation": "thế nào, như thế nào; sao, ra sao, làm sao; bao nhiêu; giá bao nhiêu; làm sao, biết bao, xiếc bao, biết bao nhiêu, sao mà... đến thế; rằng, là",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "he doesn't know how to behave",
        "vi": "hắn không biết xử sự thế nào",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "how comes it? how is it?",
        "vi": "sao, sự thể ra sao? sao lại ra như vậy?",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "how now?",
        "vi": "sao, thế là thế nào?",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=how&type=2"
  },
  {
    "id": "enc-its",
    "word": "its",
    "ipa": "/its/",
    "partOfSpeech": "word",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "của cái đó, của điều đó, của con vật đó",
    "detailedExplanation": "của cái đó, của điều đó, của con vật đó; cái của điều đó, cái của con vật đó",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'its' in communication.",
        "vi": "Chúng ta thường gặp từ 'its' trong giao tiếp.",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=its&type=2"
  },
  {
    "id": "enc-top",
    "word": "top",
    "ipa": "/tɔp/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "con cù, con quay",
    "detailedExplanation": "con cù, con quay; (thân mật) bạn tri kỷ, bạn nối khố; ngủ say; chóp, đỉnh, ngọn, đầu",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the top sleeps; the top is asleep",
        "vi": "con cù quay tít",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "the top of a hill",
        "vi": "đỉnh đồi",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "the top of the page",
        "vi": "đầu trang",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=top&type=2"
  },
  {
    "id": "enc-had",
    "word": "had",
    "ipa": "/hæv, həv, v/ (has) /hæz, həz, əz, z/ (hast) /hæst/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "có",
    "detailedExplanation": "có; (+ from) nhận được, biết được; ăn; uống; hút; hưởng; bị",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to have nothing to do",
        "vi": "không có việc gì làm",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "June has 30 days",
        "vi": "tháng sáu có 30 ngày",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to have news from somebody",
        "vi": "nhận được tin ở ai, nhờ ai mà biết tin",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=had&type=2"
  },
  {
    "id": "enc-day",
    "word": "day",
    "ipa": "/dei/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "ban ngày",
    "detailedExplanation": "ban ngày; ngày; ngày lễ, ngày kỷ niệm; (số nhiều) thời kỳ, thời đại, thời buổi",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "the sun gives us light during the day",
        "vi": "ban ngày mặt trời cho ta ánh sáng",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "by day",
        "vi": "ban ngày",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "it was broad day",
        "vi": "trời đã sáng rõ; giữa ban ngày",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=day&type=2"
  },
  {
    "id": "enc-two",
    "word": "two",
    "ipa": "/tu:/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "hai, đôi",
    "detailedExplanation": "hai, đôi; số hai; đôi, cặp; quân hai (quân bài); con hai (súc sắc...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "he is two",
        "vi": "nó lên hai",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "in twos; two and two; two by two",
        "vi": "từng đôi một, từng cặp một",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "one or two",
        "vi": "một vài",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=two&type=2"
  },
  {
    "id": "enc-buy",
    "word": "buy",
    "ipa": "/bai/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "mua",
    "detailedExplanation": "mua; (nghĩa bóng) trã bằng giá; đạt được, được (cái gì bằng một sự hy sinh nào đó); mua chuộc, đút lót, hối lộ (ai); mua lại (cái gì mình đã bán đi)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to buy in coal for the winter",
        "vi": "mua trữ than cho mùa đông",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "a good buy",
        "vi": "món hời",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=buy&type=2"
  },
  {
    "id": "enc-her",
    "word": "her",
    "ipa": "/hə:/",
    "partOfSpeech": "adjective",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "nó, cô ấy, bà ấy, chị ấy...",
    "detailedExplanation": "nó, cô ấy, bà ấy, chị ấy...; của nó, của cô ấy, của bà ấy, của chị ấy...",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "give it her",
        "vi": "đưa cái đó cho cô ấy",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "was that her?",
        "vi": "có phải cô ta đó không?",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "her book",
        "vi": "quyển sách của cô ấy",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=her&type=2"
  },
  {
    "id": "enc-add",
    "word": "add",
    "ipa": "/æd/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "((thường) + up,  together) cộng",
    "detailedExplanation": "((thường) + up,  together) cộng; thêm vào, làm tăng thêm; nói thêm; (+ in) kế vào, tính vào, gộp vào",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "add some more hot water to your tea",
        "vi": "cho thêm ít nước nóng nữa vào tách trà của anh",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "music added to our joy",
        "vi": "âm nhạc làm tăng thêm niềm vui của chúng ta",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "he added that",
        "vi": "anh ta nói thêm rằng",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=add&type=2"
  },
  {
    "id": "enc-jan",
    "word": "jan",
    "ipa": "/jan/",
    "partOfSpeech": "word",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "tháng giêng (January)",
    "detailedExplanation": "tháng giêng (January); viết tắt; tháng giêng (January)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'jan' in communication.",
        "vi": "Chúng ta thường gặp từ 'jan' trong giao tiếp.",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=jan&type=2"
  },
  {
    "id": "enc-she",
    "word": "she",
    "ipa": "/ʃi:/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "nó, bà ấy, chị ấy, cô ấy...",
    "detailedExplanation": "nó, bà ấy, chị ấy, cô ấy...; nó (chỉ tàu, xe... đã được nhân cách hoá), tàu ấy, xe ấy; người đàn bà, chị; đàn bà, con gái",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "she sings beautifully",
        "vi": "chị ấy hát hay",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "she sails tomorrow",
        "vi": "ngày mai chiếc tàu ấy nhổ neo",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "she of the black hair",
        "vi": "người đàn bà tóc đen, chị tóc đen",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=she&type=2"
  },
  {
    "id": "enc-sex",
    "word": "sex",
    "ipa": "/seks/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "giới tính",
    "detailedExplanation": "giới tính; giới đàn ông, giới phụ nữ; vấn đề sinh lý, vấn đề dục tính; (từ Mỹ,nghĩa Mỹ) sự giao cấu",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "without distinction of age and sex",
        "vi": "không phân biệt tuổi tác và nam nữ",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "the fair (gentle, softer, weaker) sex",
        "vi": "giới phụ nữ",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "the sterner sex",
        "vi": "giới đàn ông",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=sex&type=2"
  },
  {
    "id": "enc-set",
    "word": "set",
    "ipa": "/set/",
    "partOfSpeech": "adjective",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "bộ",
    "detailedExplanation": "bộ; (toán học) tập hợp; (thể dục,thể thao) ván, xéc (quần vợt...); bọn, đám, đoàn, lũ, giới",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a set of chair",
        "vi": "một bộ ghế",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "a set of artificial teeth",
        "vi": "một bộ răng giả",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "a carpentry set",
        "vi": "một bộ đồ mộc",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=set&type=2"
  },
  {
    "id": "enc-map",
    "word": "map",
    "ipa": "/mæp/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "bản đồ",
    "detailedExplanation": "bản đồ; (toán học) bản đồ; ảnh tượng; (từ lóng) mặt; (thông tục) không quan trọng",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to map out one's time",
        "vi": "sắp xếp thời gian",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to map out a strategy",
        "vi": "vạch ra một chiến lược",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=map&type=2"
  },
  {
    "id": "enc-way",
    "word": "way",
    "ipa": "/wei/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "đường, đường đi, lối đi",
    "detailedExplanation": "đường, đường đi, lối đi; đoạn đường, quãng đường, khoảng cách; phía, phương, hướng, chiều; cách, phương pháp, phương kế, biện pháp",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "way in",
        "vi": "lối vào",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "way out",
        "vi": "lối ra",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "way through",
        "vi": "lối đi qua",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=way&type=2"
  },
  {
    "id": "enc-off",
    "word": "off",
    "ipa": "/ɔ:f/",
    "partOfSpeech": "interjection",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "tắt",
    "detailedExplanation": "tắt; đi, đi rồi; ra khỏi, đứt, rời; xa cách",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "is the lamp off?",
        "vi": "đèn đã tắt chưa?",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "they are off",
        "vi": "họ đã đi rồi",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "off with you",
        "vi": "đi đi, cút đi",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=off&type=2"
  },
  {
    "id": "enc-car",
    "word": "car",
    "ipa": "/kɑ:/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "xe ô tô; xe",
    "detailedExplanation": "xe ô tô; xe; (từ Mỹ,nghĩa Mỹ) toa (xe lửa, xe điện); giỏ khí cầu; (từ Mỹ,nghĩa Mỹ) buồng thang máy",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to go by car",
        "vi": "đi bằng ô tô",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "armoured car",
        "vi": "(quân sự) xe bọc thép",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "amphibious car",
        "vi": "(quân sự) xe lội nước",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=car&type=2"
  },
  {
    "id": "enc-own",
    "word": "own",
    "ipa": "/oun/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "của chính mình, của riêng mình",
    "detailedExplanation": "của chính mình, của riêng mình; độc lập cho bản thân mình; tự mình chịu trách nhiệm; với phương tiện của bản thân mình; (xem) man; (thông tục) trả thù",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "I saw it with my own eyes",
        "vi": "chính mắt tôi trông thấy",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "I have nothing of my own",
        "vi": "tôi chẳng có cái gì riêng cả",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to do something on one's own",
        "vi": "làm việc gì tự ý mình",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=own&type=2"
  },
  {
    "id": "enc-end",
    "word": "end",
    "ipa": "/end/",
    "partOfSpeech": "verb",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "giới hạn",
    "detailedExplanation": "giới hạn; đầu, đầu mút (dây...); đuôi; đáy (thùng...) đoạn cuối; mẩu thừa, mẩu còn lại; sự kết thúc",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "candle ends",
        "vi": "mẩu nến",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to be near one's end",
        "vi": "chẳng còn sống được bao lâu nữa, gần kề miệng lỗ",
        "context": "☕ Đời Sống & Chào Hỏi"
      },
      {
        "en": "to gain one's ends",
        "vi": "đạt được mục đích của mình",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=end&type=2"
  },
  {
    "id": "enc-him",
    "word": "him",
    "ipa": "/him/",
    "partOfSpeech": "noun",
    "category": "daily",
    "categoryLabel": "☕ Đời Sống & Chào Hỏi",
    "meaningVi": "nó, hắn, ông ấy, anh ấy",
    "detailedExplanation": "nó, hắn, ông ấy, anh ấy",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'him' in communication.",
        "vi": "Chúng ta thường gặp từ 'him' trong giao tiếp.",
        "context": "☕ Đời Sống & Chào Hỏi"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=him&type=2"
  },
  {
    "id": "enc-gen",
    "word": "gen",
    "ipa": "/dʤen/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(viết tắt) của general information",
    "detailedExplanation": "(viết tắt) của general information; bản tin (phát cho tất cả sĩ quan các cấp trước khi bước vào chiến dịch)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'gen' in communication.",
        "vi": "Chúng ta thường gặp từ 'gen' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=gen&type=2"
  },
  {
    "id": "enc-gel",
    "word": "gel",
    "ipa": "/dʤel/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(hoá học) chất gien",
    "detailedExplanation": "(hoá học) chất gien",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'gel' in communication.",
        "vi": "Chúng ta thường gặp từ 'gel' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=gel&type=2"
  },
  {
    "id": "enc-aaa",
    "word": "aaa",
    "ipa": "/aaa/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(Amateur Athletic Association) Hội thể thao không chuyên",
    "detailedExplanation": "(Amateur Athletic Association) Hội thể thao không chuyên; (American Automobile Association) Hiệp hội xe hơi Mỹ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'aaa' in communication.",
        "vi": "Chúng ta thường gặp từ 'aaa' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=aaa&type=2"
  },
  {
    "id": "enc-std",
    "word": "std",
    "ipa": "/std/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "hệ thống điện thoại gọi đường dài cho người thuê bao (subscriber trunk dialling)",
    "detailedExplanation": "hệ thống điện thoại gọi đường dài cho người thuê bao (subscriber trunk dialling)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'std' in communication.",
        "vi": "Chúng ta thường gặp từ 'std' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=std&type=2"
  },
  {
    "id": "enc-tri",
    "word": "tri",
    "ipa": "/tri/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "hình thái ghép",
    "detailedExplanation": "hình thái ghép; ba; tripartite; ba bên",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'tri' in communication.",
        "vi": "Chúng ta thường gặp từ 'tri' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tri&type=2"
  },
  {
    "id": "enc-pal",
    "word": "pal",
    "ipa": "/pæl/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(từ lóng) bạn",
    "detailedExplanation": "(từ lóng) bạn; ((thường) + up) đánh bạn, kết bạn",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to pal up with (to) someone",
        "vi": "đánh bạn với ai",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=pal&type=2"
  },
  {
    "id": "enc-mat",
    "word": "mat",
    "ipa": "/mæt/",
    "partOfSpeech": "adjective",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "chiếu",
    "detailedExplanation": "chiếu; thảm chùi chân; (thể dục,thể thao) đệm (cho đồ vật...); miếng vải lót cốc (đĩa...) (cho khỏi nóng hay để trang hoàng)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'mat' in communication.",
        "vi": "Chúng ta thường gặp từ 'mat' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=mat&type=2"
  },
  {
    "id": "enc-ted",
    "word": "ted",
    "ipa": "/ted/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "giũ, trở (cỏ, để phơi khô)",
    "detailedExplanation": "giũ, trở (cỏ, để phơi khô)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'ted' in communication.",
        "vi": "Chúng ta thường gặp từ 'ted' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ted&type=2"
  },
  {
    "id": "enc-gym",
    "word": "gym",
    "ipa": "/dʤim/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(như) gymnasium",
    "detailedExplanation": "(như) gymnasium; thể dục",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'gym' in communication.",
        "vi": "Chúng ta thường gặp từ 'gym' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=gym&type=2"
  },
  {
    "id": "enc-tan",
    "word": "tan",
    "ipa": "/tæn/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "vỏ dà, vỏ thuộc da",
    "detailedExplanation": "vỏ dà, vỏ thuộc da; màu nâu; màu da rám nắng; màu vỏ dà, màu nâu",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "this leather tans easily",
        "vi": "loại da này dễ thuộc",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tan&type=2"
  },
  {
    "id": "enc-alt",
    "word": "alt",
    "ipa": "/ælt/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(âm nhạc) nốt cao",
    "detailedExplanation": "(âm nhạc) nốt cao",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "in alt",
        "vi": "nốt cao trên quãng tám của thang âm; (nghĩa bóng) vô cùng cao hứng",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=alt&type=2"
  },
  {
    "id": "enc-pie",
    "word": "pie",
    "ipa": "/pai/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(động vật học) ác là",
    "detailedExplanation": "(động vật học) ác là; bánh pa-tê; bánh nướng nhân ngọt; (xem) humble; có dính dáng đến việc ấy, có nhúng tay vào việc ấy",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "meat pie",
        "vi": "bánh pa-tê",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "jam pie",
        "vi": "bánh nướng nhân mứt",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "cream pie",
        "vi": "bánh kem",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=pie&type=2"
  },
  {
    "id": "enc-cbs",
    "word": "cbs",
    "ipa": "/cbs/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "Mạng lưới phát thanh Columbia (Columbia Broadcasting System)",
    "detailedExplanation": "Mạng lưới phát thanh Columbia (Columbia Broadcasting System)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'cbs' in communication.",
        "vi": "Chúng ta thường gặp từ 'cbs' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cbs&type=2"
  },
  {
    "id": "enc-bow",
    "word": "bow",
    "ipa": "/bou/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "cái cung",
    "detailedExplanation": "cái cung; vĩ (viôlông); cầu vồng; cái nơ con bướm",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "ro draw (bend) the bow",
        "vi": "giương cung",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "to make one's bow",
        "vi": "cúi đầu chào",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "to return a bow",
        "vi": "chào lại",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bow&type=2"
  },
  {
    "id": "enc-hon",
    "word": "hon",
    "ipa": "/hon/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "ngài, tướng công (tiếng tôn xưng đối với các tước công trở xuống, các nhân vật cao cấp ở Mỹ, các đại biểu hạ nghị viện Anh trong các cuộc họp...) vt của honourable",
    "detailedExplanation": "ngài, tướng công (tiếng tôn xưng đối với các tước công trở xuống, các nhân vật cao cấp ở Mỹ, các đại biểu hạ nghị viện Anh trong các cuộc họp...) vt của honourable",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'hon' in communication.",
        "vi": "Chúng ta thường gặp từ 'hon' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=hon&type=2"
  },
  {
    "id": "enc-atm",
    "word": "atm",
    "ipa": "/atm/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "atmosphere",
    "detailedExplanation": "atmosphere; viết tắt; atmosphere",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'atm' in communication.",
        "vi": "Chúng ta thường gặp từ 'atm' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=atm&type=2"
  },
  {
    "id": "enc-cox",
    "word": "cox",
    "ipa": "/kɔks/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "lái (tàu, thuyền)",
    "detailedExplanation": "lái (tàu, thuyền)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'cox' in communication.",
        "vi": "Chúng ta thường gặp từ 'cox' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cox&type=2"
  },
  {
    "id": "enc-vic",
    "word": "vic",
    "ipa": "/vic/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "người tù",
    "detailedExplanation": "người tù; viết tắt của convict",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'vic' in communication.",
        "vi": "Chúng ta thường gặp từ 'vic' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=vic&type=2"
  },
  {
    "id": "enc-cab",
    "word": "cab",
    "ipa": "/kæb/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "xe tắc xi; xe ngựa thuê",
    "detailedExplanation": "xe tắc xi; xe ngựa thuê; (ngành đường sắt) buồng lái; cabin, buồng lái (ở xe vận tải); đi xe tắc xi; đi xe ngựa thuê",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'cab' in communication.",
        "vi": "Chúng ta thường gặp từ 'cab' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cab&type=2"
  },
  {
    "id": "enc-dam",
    "word": "dam",
    "ipa": "/dæm/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(động vật học) vật mẹ",
    "detailedExplanation": "(động vật học) vật mẹ; ma quỷ; đập (ngăn nước); nước ngăn lại, bể nước",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to dam up one's emotion",
        "vi": "kiềm chế nỗi xúc động",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=dam&type=2"
  },
  {
    "id": "enc-sox",
    "word": "sox",
    "ipa": "/sɔks/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(từ Mỹ,nghĩa Mỹ) bít tất",
    "detailedExplanation": "(từ Mỹ,nghĩa Mỹ) bít tất",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'sox' in communication.",
        "vi": "Chúng ta thường gặp từ 'sox' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=sox&type=2"
  },
  {
    "id": "enc-tub",
    "word": "tub",
    "ipa": "/tʌb/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "chậu, bồn",
    "detailedExplanation": "chậu, bồn; (thông tục) bồn tắm; sự tắm rửa; (ngành mỏ) goòng (chở than); (hàng hải) xuồng tập (để tập lái)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'tub' in communication.",
        "vi": "Chúng ta thường gặp từ 'tub' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tub&type=2"
  },
  {
    "id": "enc-ash",
    "word": "ash",
    "ipa": "/æʃ/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "((thường) số nhiều) tro; tàn (thuốc lá)",
    "detailedExplanation": "((thường) số nhiều) tro; tàn (thuốc lá); (số nhiều) tro hoả táng; đốt ra tro, đốt sạch; tiêu tan, tan thành mây khói (hy vọng...)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to reduce (burn) something to ashes",
        "vi": "đốt vật gì thành tro",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ash&type=2"
  },
  {
    "id": "enc-tap",
    "word": "tap",
    "ipa": "/tæp/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "vòi (nước)",
    "detailedExplanation": "vòi (nước); nút thùng rượu; loại, hạng (rượu); quán rượu, tiệm rượu",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to turn the tap on",
        "vi": "mở vòi",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "to turn the tap off",
        "vi": "đóng vòi",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "wine of an excellent tap",
        "vi": "rượu vang thượng hạng",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=tap&type=2"
  },
  {
    "id": "enc-bee",
    "word": "bee",
    "ipa": "/bi:/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(động vật học) con ong",
    "detailedExplanation": "(động vật học) con ong; nhà thơ; người bận nhiều việc; (từ Mỹ,nghĩa Mỹ) buổi vui chơi tập thể, buổi lao động tập thể",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to keep bees",
        "vi": "nuôi ong",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bee&type=2"
  },
  {
    "id": "enc-mba",
    "word": "mba",
    "ipa": "/mba/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "cử nhân quản trị kinh doanh (Master of Business  Administration)",
    "detailedExplanation": "cử nhân quản trị kinh doanh (Master of Business  Administration)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'mba' in communication.",
        "vi": "Chúng ta thường gặp từ 'mba' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=mba&type=2"
  },
  {
    "id": "enc-pit",
    "word": "pit",
    "ipa": "/pit/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "hồ",
    "detailedExplanation": "hồ; hầm khai thác, nơi khai thác; hầm bẫy, hố bẫy (thú rừng...) ((cũng) pifall); (như) cockpit",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to dig a pit for someone",
        "vi": "(nghĩa bóng) đặt bẫy ai, định đưa ai vào bẫy",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "the pit of the stomach",
        "vi": "lõm thượng vị",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "to pit someone against someone",
        "vi": "đưa ai ra đọ sức với ai",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=pit&type=2"
  },
  {
    "id": "enc-mag",
    "word": "mag",
    "ipa": "/mæg/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(từ lóng) đồng nửa xu (Anh)",
    "detailedExplanation": "(từ lóng) đồng nửa xu (Anh); (viết tắt) của magneto",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'mag' in communication.",
        "vi": "Chúng ta thường gặp từ 'mag' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=mag&type=2"
  },
  {
    "id": "enc-rec",
    "word": "rec",
    "ipa": "/rec/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "sân chơi (recreation ground)",
    "detailedExplanation": "sân chơi (recreation ground); viết tắt; sân chơi (recreation ground)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'rec' in communication.",
        "vi": "Chúng ta thường gặp từ 'rec' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=rec&type=2"
  },
  {
    "id": "enc-ton",
    "word": "ton",
    "ipa": "/tʌn/",
    "partOfSpeech": "adjective",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "tấn",
    "detailedExplanation": "tấn; ton (đơn vị dung tích tàu bè bằng 2, 831 m3); ton (đơn vị trọng tải của tàu bè bằng 1, 12 m3); (thông tục) rất nhiều",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "long ton; gross ton",
        "vi": "tấn Anh (1016 kg)",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "metric ton",
        "vi": "tấn (1000 kg)",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "short ton; net ton",
        "vi": "tấn Mỹ (907, 2 kg)",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ton&type=2"
  },
  {
    "id": "enc-gif",
    "word": "gif",
    "ipa": "/gif/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "Một khuôn thức tệp đồ họa màu ánh xạ bit dùng cho máy tính loại tương thích-IBM",
    "detailedExplanation": "Một khuôn thức tệp đồ họa màu ánh xạ bit dùng cho máy tính loại tương thích-IBM",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'gif' in communication.",
        "vi": "Chúng ta thường gặp từ 'gif' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=gif&type=2"
  },
  {
    "id": "enc-bra",
    "word": "bra",
    "ipa": "/brɑ:/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(thông tục) ((viết tắt) của brassière) cái nịt vú, cái yếm",
    "detailedExplanation": "(thông tục) ((viết tắt) của brassière) cái nịt vú, cái yếm",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'bra' in communication.",
        "vi": "Chúng ta thường gặp từ 'bra' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=bra&type=2"
  },
  {
    "id": "enc-phi",
    "word": "phi",
    "ipa": "/fai/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "Fi (chữ cái Hy lạp)",
    "detailedExplanation": "Fi (chữ cái Hy lạp)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'phi' in communication.",
        "vi": "Chúng ta thường gặp từ 'phi' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=phi&type=2"
  },
  {
    "id": "enc-cow",
    "word": "cow",
    "ipa": "/kau/",
    "partOfSpeech": "verb",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "bò cái",
    "detailedExplanation": "bò cái; voi cái; tê giác cái; cá voi cái; chó biển cái; (từ Mỹ,nghĩa Mỹ),  (từ lóng) đàn bà con gái; mãi mãi, lâu dài, vô tận",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "to milk the cow",
        "vi": "vắt bò sữa",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "milking cow",
        "vi": "bò sữa",
        "context": "🎓 Từ Vựng VSTEP"
      },
      {
        "en": "a cow eith (in) calf",
        "vi": "bò chửa",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cow&type=2"
  },
  {
    "id": "enc-cet",
    "word": "cet",
    "ipa": "/cet/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "Giờ Trung Âu (Central European Time)",
    "detailedExplanation": "Giờ Trung Âu (Central European Time)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'cet' in communication.",
        "vi": "Chúng ta thường gặp từ 'cet' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cet&type=2"
  },
  {
    "id": "enc-div",
    "word": "div",
    "ipa": "/di:v/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "ác ma (thần thoại Ba-tư)",
    "detailedExplanation": "ác ma (thần thoại Ba-tư)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'div' in communication.",
        "vi": "Chúng ta thường gặp từ 'div' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=div&type=2"
  },
  {
    "id": "enc-ide",
    "word": "ide",
    "ipa": "/aid/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(động vật học) cá chép đỏ",
    "detailedExplanation": "(động vật học) cá chép đỏ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'ide' in communication.",
        "vi": "Chúng ta thường gặp từ 'ide' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=ide&type=2"
  },
  {
    "id": "enc-leo",
    "word": "leo",
    "ipa": "/'li:ou/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "(thiên văn học) cung Sư t",
    "detailedExplanation": "(thiên văn học) cung Sư t",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'leo' in communication.",
        "vi": "Chúng ta thường gặp từ 'leo' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=leo&type=2"
  },
  {
    "id": "enc-diy",
    "word": "diy",
    "ipa": "/diy/",
    "partOfSpeech": "word",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "tự tay mình làm (Do It Yourself)",
    "detailedExplanation": "tự tay mình làm (Do It Yourself)",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'diy' in communication.",
        "vi": "Chúng ta thường gặp từ 'diy' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=diy&type=2"
  },
  {
    "id": "enc-doe",
    "word": "doe",
    "ipa": "/dou/",
    "partOfSpeech": "noun",
    "category": "vstep",
    "categoryLabel": "🎓 Từ Vựng VSTEP",
    "meaningVi": "hươu cái, hoãng cái; nai cái",
    "detailedExplanation": "hươu cái, hoãng cái; nai cái; thỏ cái; thỏ rừng cái",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'doe' in communication.",
        "vi": "Chúng ta thường gặp từ 'doe' trong giao tiếp.",
        "context": "🎓 Từ Vựng VSTEP"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=doe&type=2"
  },
  {
    "id": "enc-cloud",
    "word": "cloud",
    "ipa": "/klaud/",
    "partOfSpeech": "verb",
    "category": "it-arch",
    "categoryLabel": "🏗️ IT: Kiến Trúc",
    "meaningVi": "mây, đám mây",
    "detailedExplanation": "mây, đám mây; đám (khói, bụi); đàn, đoàn, bầy (ruồi, muỗi đang bay, ngựa đang phi...); (nghĩa bóng) bóng mây, bóng đen; sự buồn rầu; điều bất hạnh",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a cloud of dust",
        "vi": "đám bụi",
        "context": "🏗️ IT: Kiến Trúc"
      },
      {
        "en": "a cloud of horsemen",
        "vi": "đoàn kỵ sĩ (đang phi ngựa)",
        "context": "🏗️ IT: Kiến Trúc"
      },
      {
        "en": "a cloud of flies",
        "vi": "đàn ruồi (đang bay)",
        "context": "🏗️ IT: Kiến Trúc"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cloud&type=2"
  },
  {
    "id": "enc-proxy",
    "word": "proxy",
    "ipa": "/proxy/",
    "partOfSpeech": "noun",
    "category": "it-arch",
    "categoryLabel": "🏗️ IT: Kiến Trúc",
    "meaningVi": "sự uỷ nhiệm, sự uỷ quyền",
    "detailedExplanation": "sự uỷ nhiệm, sự uỷ quyền; người đại diện, người thay mặt, người được uỷ nhiệm (làm thay việc gì); giấy uỷ nhiệm bầu thay; sự bầu thay; (định ngữ) do uỷ nhiệm, do uỷ quyền",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "by proxy",
        "vi": "do uỷ nhiệm",
        "context": "🏗️ IT: Kiến Trúc"
      },
      {
        "en": "to be (stand) proxy for somebody",
        "vi": "đại diện cho ai",
        "context": "🏗️ IT: Kiến Trúc"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=proxy&type=2"
  },
  {
    "id": "enc-server",
    "word": "server",
    "ipa": "/sə:v/",
    "partOfSpeech": "noun",
    "category": "it-arch",
    "categoryLabel": "🏗️ IT: Kiến Trúc",
    "meaningVi": "người hầu; người hầu bàn",
    "detailedExplanation": "người hầu; người hầu bàn; khay bưng thức ăn; (thể dục,thể thao) người giao bóng (quần vợt...); người phụ lễ",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'server' in communication.",
        "vi": "Chúng ta thường gặp từ 'server' trong giao tiếp.",
        "context": "🏗️ IT: Kiến Trúc"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=server&type=2"
  },
  {
    "id": "enc-network",
    "word": "network",
    "ipa": "/'netwə:k/",
    "partOfSpeech": "noun",
    "category": "it-arch",
    "categoryLabel": "🏗️ IT: Kiến Trúc",
    "meaningVi": "lưới, đồ dùng kiểu lưới",
    "detailedExplanation": "lưới, đồ dùng kiểu lưới; mạng lưới, hệ thống; (kỹ thuật) hệ thống mắc cáo; (raddiô) mạng lưới truyền thanh",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a network purse",
        "vi": "cái túi lưới đựng tiền",
        "context": "🏗️ IT: Kiến Trúc"
      },
      {
        "en": "a network of railways",
        "vi": "mạng lưới đường sắt",
        "context": "🏗️ IT: Kiến Trúc"
      },
      {
        "en": "a network of canals",
        "vi": "hệ thống sông đào",
        "context": "🏗️ IT: Kiến Trúc"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=network&type=2"
  },
  {
    "id": "enc-cluster",
    "word": "cluster",
    "ipa": "/'klʌstə/",
    "partOfSpeech": "verb",
    "category": "it-arch",
    "categoryLabel": "🏗️ IT: Kiến Trúc",
    "meaningVi": "đám, bó, cụm; đàn, bầy",
    "detailedExplanation": "đám, bó, cụm; đàn, bầy; mọc thành đám, mọc thành cụm (cây cối); ra thành cụm (hoa quả); tụ họp lại, tụm lại; thu gộp, góp lại, hợp lại, bó lại",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "a cluster of people",
        "vi": "đám người",
        "context": "🏗️ IT: Kiến Trúc"
      },
      {
        "en": "a cluster of flowers",
        "vi": "bó hoa",
        "context": "🏗️ IT: Kiến Trúc"
      },
      {
        "en": "a cluster of bees",
        "vi": "đàn ong",
        "context": "🏗️ IT: Kiến Trúc"
      }
    ],
    "level": "B1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=cluster&type=2"
  },
  {
    "id": "enc-internet",
    "word": "internet",
    "ipa": "/internet/",
    "partOfSpeech": "word",
    "category": "it-arch",
    "categoryLabel": "🏗️ IT: Kiến Trúc",
    "meaningVi": "Một hệ thống các mạng máy tính được liên kết với nhau trên phạm vi toàn thế giới",
    "detailedExplanation": "Một hệ thống các mạng máy tính được liên kết với nhau trên phạm vi toàn thế giới",
    "collocations": [],
    "exampleSentences": [
      {
        "en": "We often encounter 'internet' in communication.",
        "vi": "Chúng ta thường gặp từ 'internet' trong giao tiếp.",
        "context": "🏗️ IT: Kiến Trúc"
      }
    ],
    "level": "A1",
    "audioUrl": "https://dict.youdao.com/dictvoice?audio=internet&type=2"
  }
];

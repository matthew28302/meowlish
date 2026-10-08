export interface LegoBlock {
  label: string;
  word: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  explanation: string;
  roleHint?: string;
  audioHint?: string;
}

export interface DetailedGuide {
  coreRule: string;
  formulaBreakdown: { component: string; meaning: string; rule: string }[];
  goldenTips: string[];
  usageTable?: { category: string; prepositions: string; examples: string; note: string }[];
}

export interface TenseVariant {
  tenseName: string;
  formula: string;
  sentence: string;
  translation: string;
  usageContext: string;
}

export interface GrammarLesson {
  id: string;
  title: string;
  vietnameseTitle: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  icon: string;
  category?: 'tenses' | 'prepositions' | 'sentences' | 'clauses' | 'advanced';
  legoExample: {
    blocks: LegoBlock[];
    fullSentence: string;
    translation: string;
    formulaPattern?: string;
  };
  detailedGuide?: DetailedGuide;
  tenseVariants?: TenseVariant[];
  commonMistakes: {
    wrong: string;
    right: string;
    explanation: string;
  }[];
  quickQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  realLifeDialogue: {
    speaker: string;
    avatar: string;
    text: string;
    translation: string;
  }[];
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  {
    id: 'present-simple-vs-continuous',
    title: 'Present Simple vs Continuous',
    vietnameseTitle: 'Thì Hiện Tại Đơn vs Tiếp Diễn',
    level: 'Beginner',
    category: 'tenses',
    summary: 'Phân biệt thói quen hằng ngày (Hiện tại đơn) và việc đang diễn ra/tạm thời (Hiện tại tiếp diễn) trong công việc.',
    icon: '⏳',
    legoExample: {
      // Công thức phải khớp 1-1 với `blocks` (4 khối). Bản cũ tách
      // [Adverb of Frequency] và [Present Simple V] thành 2 slot trong khi cả hai
      // nằm chung 1 khối "usually code in Python," và để [Connector] lẻ một slot
      // dù khối Time Signal đã gộp cả "but currently" ⇒ công thức dài hơn khối,
      // gây rối khi soạn bài.
      formulaPattern: '[Subject] + [Adverb of Frequency + Present Simple V] + [Connector / Time Signal] + [Present Continuous V-ing]',
      blocks: [
        { label: 'Subject', word: 'I', color: 'indigo', explanation: 'Chủ thể', roleHint: 'Chủ ngữ câu' },
        { label: 'Routine (V1)', word: 'usually code in Python,', color: 'emerald', explanation: 'Thói quen: Hiện tại đơn', roleHint: 'Động từ chỉ thói quen' },
        { label: 'Time Signal', word: 'but currently', color: 'amber', explanation: 'Trạng từ chuyển đổi ngữ cảnh', roleHint: 'Dấu hiệu thì tiếp diễn' },
        { label: 'In Progress (V-ing)', word: 'I am debugging a Java app.', color: 'rose', explanation: 'Hành động đang làm hiện tại', roleHint: 'Động từ to be + V-ing' },
      ],
      fullSentence: 'I usually code in Python, but currently I am debugging a Java app.',
      translation: 'Tôi thường lập trình bằng Python, nhưng hiện tại tôi đang gỡ lỗi một ứng dụng Java.',
    },
    detailedGuide: {
      coreRule: 'Nguyên lý chiếc máy ảnh: Hiện tại đơn là "Bức ảnh Panorama chụp chu kỳ dài hạn" (sự thật hiển nhiên, tính chất hệ thống, lịch trình lặp lại); Hiện tại tiếp diễn là "Đoạn video đang quay tại chỗ" (hành động đang diễn ra trước mắt hoặc trạng thái tạm thời trong khoảng thời gian ngắn).',
      formulaBreakdown: [
        { component: 'Present Simple (S + V_s/es)', meaning: 'Sự thật & Thói quen', rule: 'Đi với các từ chỉ tần suất: always, usually, often, everyday, every sprint. Áp dụng cho tính năng hệ thống: "The API returns JSON".' },
        { component: 'Present Continuous (S + am/is/are + V-ing)', meaning: 'Đang diễn ra hoặc Tạm thời', rule: 'Đi với dấu hiệu: right now, currently, at the moment, this week. Dùng cho dự án đang chạy: "We are migrating to Next.js".' },
        { component: 'Stative Verbs Exception', meaning: 'Động từ chỉ trạng thái cấm V-ing', rule: 'Các động từ nhận thức, sở hữu, cảm xúc KHÔNG chia V-ing: know, understand, need, want, belong to, contain. (Nói "I understand the code", KHÔNG nói "I am understanding").' }
      ],
      goldenTips: [
        '💡 Thần chú ngôi 3 số ít: He / She / It / Danh từ số ít (The server, The API, The user) -> Luôn thêm S hoặc ES vào động từ hiện tại đơn.',
        '💡 Trạng từ chỉ tần suất đứng trước động từ thường nhưng đứng sau động từ To Be: "He *always tests* code" nhưng "He *is always* on time".',
        '💡 Phàn nàn khó chịu với ALWAYS + V-ing: "He is always pushing to main without PR!" (Anh ta suốt ngày push thẳng lên main không thèm tạo PR).'
      ]
    },
    tenseVariants: [
      {
        tenseName: 'Present Simple (Routine & Facts)',
        formula: 'S + V(s/es)',
        sentence: 'The system runs automated nightly backups every day at 2:00 AM.',
        translation: 'Hệ thống tự động chạy sao lưu hằng đêm vào lúc 2:00 sáng mỗi ngày.',
        usageContext: 'Fact, routine, schedule (Sự thật hiển nhiên, thói quen, lịch trình).',
      },
      {
        tenseName: 'Present Continuous (In Progress / Temporary)',
        formula: 'S + am/is/are + V-ing',
        sentence: 'The DevOps team is migrating database shards right now.',
        translation: 'Đội ngũ DevOps hiện đang tiến hành di chuyển các phân đoạn cơ sở dữ liệu.',
        usageContext: 'Temporary situation, action happening now (Tình huống tạm thời, đang diễn ra).',
      },
      {
        tenseName: 'Annoyance / Repeated Habit with Always',
        formula: 'S + is/are + always + V-ing',
        sentence: 'He is always pushing directly to main without opening a pull request.',
        translation: 'Anh ta suốt ngày push thẳng lên nhánh main mà không thèm tạo pull request.',
        usageContext: 'Phàn nàn, bực mình về một thói quen xấu lặp đi lặp lại trong nhóm.',
      },
      {
        tenseName: 'Future Timetable / Scheduled Event',
        formula: 'S + V(s/es) + at [time] on [day]',
        sentence: 'The scheduled system maintenance begins at midnight this Saturday.',
        translation: 'Lịch bảo trì hệ thống định kỳ bắt đầu vào lúc nửa đêm thứ Bảy này.',
        usageContext: 'Lịch trình cố định của hệ thống hoặc sự kiện công cộng.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I am understanding this code.',
        right: 'I understand this code.',
        explanation: 'Các động từ chỉ trạng thái (understand, know, like, want...) không dùng ở thì tiếp diễn.',
      },
      {
        wrong: 'He fix bugs everyday.',
        right: 'He fixes bugs everyday.',
        explanation: 'Ngôi thứ 3 số ít (He/She/It) ở thì hiện tại đơn phải thêm "s" hoặc "es" vào động từ.',
      }
    ],
    quickQuiz: [
      {
        question: 'Choose the correct form: "Where is John?" - "He _____ a meeting with the client."',
        options: ['has', 'having', 'is having', 'have'],
        correctIndex: 2,
        explanation: 'Hành động đang diễn ra tại thời điểm nói ("right now"), nên dùng thì hiện tại tiếp diễn.',
      },
      {
        question: 'The API _____ data in JSON format by default.',
        options: ['return', 'returns', 'is returning', 'returning'],
        correctIndex: 1,
        explanation: 'Đây là một sự thật hiển nhiên/tính năng mặc định, nên dùng hiện tại đơn với ngôi thứ 3 số ít ("The API" = "It").',
      },
      {
        question: 'Identify the INCORRECT sentence regarding stative verbs:',
        options: ['I understand the microservice architecture now.', 'The system is containing three distinct databases.', 'He wants to refactor the payment gateway.', 'They know how to resolve this merge conflict.'],
        correctIndex: 1,
        explanation: 'Động từ "contain" là động từ chỉ trạng thái (stative verb), không được dùng ở dạng tiếp diễn. Phải sửa thành: "The system contains...".',
      },
      {
        question: 'Complete the sentence: "Every sprint, our QA team _____ regression tests, but right now they _____ a critical security patch."',
        options: ['runs / are testing', 'is running / test', 'run / testing', 'runs / tests'],
        correctIndex: 0,
        explanation: '"Every sprint" chỉ thói quen lặp lại (Hiện tại đơn: runs), còn "right now" chỉ hành động đang diễn ra tại thời điểm nói (Hiện tại tiếp diễn: are testing).',
      },
      {
        question: 'When expressing annoyance about a repeated bad habit, which structure is correct?',
        options: ['He always pushes untested code to the main branch.', 'He is always pushing untested code to the main branch.', 'He always is push untested code to the main branch.', 'He pushes always untested code to the main branch.'],
        correctIndex: 1,
        explanation: 'Cấu trúc "S + is/are + always + V-ing" được dùng trong giao tiếp để nhấn mạnh sự bực bội, phàn nàn về một thói quen xấu lặp đi lặp lại.',
      },
      {
        question: 'Choose the correct form: "Look at the CPU monitoring dashboard! The server temperature _____ rapidly."',
        options: ['rises', 'is rising', 'rise', 'are rising'],
        correctIndex: 1,
        explanation: 'Dấu hiệu "Look at...!" báo hiệu một sự việc đang trực tiếp diễn ra trước mắt người nói, dùng hiện tại tiếp diễn ("is rising").',
      },
      {
        question: 'Which tense is used for fixed public timetables or schedules (e.g. flight, meeting starts)?',
        options: ['Present Continuous', 'Present Simple', 'Past Continuous', 'Future Continuous'],
        correctIndex: 1,
        explanation: 'Lịch trình tàu xe, giờ khai mạc hội nghị hoặc lịch họp cố định được diễn đạt bằng Hiện tại đơn (e.g., "The client call starts at 4 PM").',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Dev A', avatar: '🧑‍💻', text: 'Do you normally handle the backend?', translation: 'Bạn thường xử lý phần backend phải không?' },
      { speaker: 'Dev B', avatar: '👩‍💻', text: 'Yes, but this sprint I am helping the frontend team.', translation: 'Đúng vậy, nhưng sprint này tôi đang giúp nhóm frontend.' },
      { speaker: 'Dev A', avatar: '🧑‍💻', text: 'Are they facing any issues?', translation: 'Họ đang gặp vấn đề gì à?' },
      { speaker: 'Dev B', avatar: '👩‍💻', text: 'Yes, they are rewriting the UI components.', translation: 'Ừ, họ đang viết lại các component UI.' }
    ]
  },
  {
    id: 'subject-verb-agreement',
    title: 'Subject-Verb Agreement',
    vietnameseTitle: 'Sự hòa hợp giữa Chủ ngữ và Động từ',
    level: 'Beginner',
    summary: 'Cách chia động từ đúng với các loại chủ ngữ khác nhau, đặc biệt với các danh từ tập hợp trong ngành IT.',
    icon: '⚖️',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'The development team', color: 'indigo', explanation: 'Danh từ tập hợp' },
        { label: 'Verb', word: 'is working', color: 'emerald', explanation: 'Động từ số ít (xem team như 1 khối)' },
        { label: 'Preposition', word: 'on', color: 'sky', explanation: 'Giới từ' },
        { label: 'Object', word: 'a new feature', color: 'rose', explanation: 'Tân ngữ' }
      ],
      fullSentence: 'The development team is working on a new feature.',
      translation: 'Nhóm phát triển đang làm việc trên một tính năng mới.',
    },
    tenseVariants: [
      {
        tenseName: 'Collective Nouns as a Single Unit',
        formula: 'Collective Subject (team, committee) + Singular Verb (is / has / V_s/es)',
        sentence: 'The DevOps team is deploying the emergency hotfix to production.',
        translation: 'Đội ngũ DevOps đang triển khai bản vá khẩn cấp lên môi trường production.',
        usageContext: 'Khi xem tập thể/nhóm như một thực thể thống nhất, động từ chia số ít.',
      },
      {
        tenseName: 'Proximity Rule with Either... Or / Neither... Nor',
        formula: 'Either A or B + Verb (agrees with B)',
        sentence: 'Either the lead architect or the frontend developers are testing the new API gateway.',
        translation: 'Hoặc kiến trúc sư trưởng hoặc các lập trình viên frontend đang kiểm thử cổng API mới.',
        usageContext: 'Động từ hòa hợp theo chủ ngữ gần nó nhất (B: frontend developers -> are).',
      },
      {
        tenseName: 'Indefinite Pronouns (Each / Every / None of)',
        formula: 'Each / Every of + Plural Noun + Singular Verb',
        sentence: 'Each of the microservices requires independent unit and integration tests.',
        translation: 'Mỗi vi dịch vụ đều đòi hỏi các bài kiểm thử đơn vị và tích hợp độc lập.',
        usageContext: 'Sau Each / Every of, danh từ số nhiều nhưng động từ luôn chia số ít.',
      },
      {
        tenseName: 'Uncountable Data & Quantities',
        formula: 'Uncountable / Measurement + Singular Verb',
        sentence: 'Ten gigabytes of application log data is purged automatically each morning.',
        translation: 'Mười gigabyte dữ liệu log ứng dụng được xóa tự động vào mỗi buổi sáng.',
        usageContext: 'Dung lượng, khoảng cách, thời gian, số tiền xem như một khối số ít.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'The list of users are empty.',
        right: 'The list of users is empty.',
        explanation: 'Chủ ngữ chính là "The list" (số ít), không phải "users". Do đó động từ là "is".',
      },
      {
        wrong: 'Every developer have to attend the meeting.',
        right: 'Every developer has to attend the meeting.',
        explanation: 'Sau "Every", "Each", danh từ luôn ở dạng số ít và động từ chia ở số ít.',
      }
    ],
    quickQuiz: [
      {
        question: 'Either the frontend devs or the backend lead _____ responsible for this bug.',
        options: ['is', 'are', 'be', 'have'],
        correctIndex: 0,
        explanation: 'Với cấu trúc "Either A or B", động từ chia theo chủ ngữ gần nhất (B). "the backend lead" là số ít, nên dùng "is".',
      },
      {
        question: 'Data _____ transferred securely over HTTPS.',
        options: ['are', 'is', 'were', 'have been'],
        correctIndex: 1,
        explanation: 'Trong tiếng Anh hiện đại, "data" thường được coi là danh từ không đếm được số ít (mặc dù là số nhiều của "datum").',
      },
      {
        question: 'Choose the correct verb: "Neither the product manager nor the frontend developers _____ satisfied with the current load time."',
        options: ['is', 'are', 'was', 'has been'],
        correctIndex: 1,
        explanation: 'Với cấu trúc "Neither A nor B", động từ hòa hợp theo chủ ngữ gần nhất (B). "frontend developers" là số nhiều nên động từ là "are".',
      },
      {
        question: 'Fill in the blank: "A large amount of confidential user data _____ leaked during the cyber incident."',
        options: ['were', 'was', 'are', 'have been'],
        correctIndex: 1,
        explanation: '"A large amount of" đi với danh từ không đếm được ("data"), nên động từ chia ở số ít ("was").',
      },
      {
        question: 'Choose the correct sentence:',
        options: ['Each of the pull requests require two approvals before merge.', 'Each of the pull requests requires two approvals before merge.', 'Each of the pull requests are requiring two approvals.', 'Each of the pull requests have required two approvals.'],
        correctIndex: 1,
        explanation: 'Sau "Each of + Danh từ số nhiều", động từ luôn chia ở ngôi thứ 3 số ít ("requires").',
      },
      {
        question: 'Select the correct option: "Ten gigabytes of log files _____ too large to attach to an email."',
        options: ['are', 'is', 'were', 'have been'],
        correctIndex: 1,
        explanation: 'Các cụm từ chỉ dung lượng, khoảng cách, thời gian, số tiền được xem như một đại lượng số ít (Ten gigabytes is...).',
      },
      {
        question: 'Fill in the blank: "The committee of software architects _____ meeting every Thursday to review system proposals."',
        options: ['is', 'are', 'were', 'have'],
        correctIndex: 0,
        explanation: 'Khi danh từ tập hợp ("The committee") hành động như một khối thống nhất, động từ chia ở số ít ("is").',
      }
    ],
    realLifeDialogue: [
      { speaker: 'PM', avatar: '👨‍💼', text: 'Is the QA team ready for the release?', translation: 'Đội QA đã sẵn sàng cho bản phát hành chưa?' },
      { speaker: 'Dev', avatar: '👩‍💻', text: 'Not yet. A number of critical bugs are still open.', translation: 'Chưa. Một số lỗi nghiêm trọng vẫn còn mở.' },
      { speaker: 'PM', avatar: '👨‍💼', text: 'Okay. Everyone needs to focus on resolving them today.', translation: 'Được rồi. Mọi người cần tập trung giải quyết chúng hôm nay.' }
    ]
  },
  {
    id: 'articles-a-an-the',
    title: 'Articles A/An/The',
    vietnameseTitle: 'Mạo từ A/An/The',
    level: 'Beginner',
    summary: 'Khi nào dùng A/An (chung chung, nhắc lần đầu) và The (cụ thể, đã biết).',
    icon: '📝',
    legoExample: {
      blocks: [
        { label: 'Action', word: 'I found', color: 'indigo', explanation: 'Hành động' },
        { label: 'Article A', word: 'a bug', color: 'rose', explanation: 'Nhắc đến lần đầu' },
        { label: 'Action', word: 'but', color: 'sky', explanation: 'Liên từ' },
        { label: 'Article The', word: 'the bug', color: 'emerald', explanation: 'Đã xác định (bug vừa nhắc)' },
        { label: 'Predicate', word: 'is minor', color: 'amber', explanation: 'Đặc điểm' }
      ],
      fullSentence: 'I found a bug, but the bug is minor.',
      translation: 'Tôi đã tìm thấy một lỗi, nhưng lỗi đó không nghiêm trọng.',
    },
    tenseVariants: [
      {
        tenseName: 'Indefinite Article (A / An) for First Mention',
        formula: 'a + consonant sound / an + vowel sound + Singular Countable Noun',
        sentence: 'We recruited an experienced full-stack engineer and a QA specialist yesterday.',
        translation: 'Hôm qua chúng tôi đã tuyển mộ một kỹ sư full-stack giàu kinh nghiệm và một chuyên viên QA.',
        usageContext: 'Nhắc đến đối tượng lần đầu tiên hoặc chưa xác định cụ thể.',
      },
      {
        tenseName: 'Definite Article (The) for Specific / Unique Entities',
        formula: 'the + Specific / Previously Mentioned Noun',
        sentence: 'The outage was caused by a configuration drift on the payment gateway.',
        translation: 'Sự cố gián đoạn bị gây ra bởi sự sai lệch cấu hình trên cổng thanh toán.',
        usageContext: 'Đối tượng cả người nói và người nghe đều đã biết rõ hoặc là duy nhất.',
      },
      {
        tenseName: 'Zero Article (No Article) for General Plurals & Tech Environments',
        formula: 'Zero Article + Plural Noun / Uncountable / Environment',
        sentence: 'Developers write clean code and deploy directly to production without friction.',
        translation: 'Các lập trình viên viết mã nguồn sạch và triển khai thẳng lên production không gặp trở ngại.',
        usageContext: 'Môi trường triển khai (production, staging) và danh từ số nhiều nói chung không dùng mạo từ.',
      },
      {
        tenseName: 'Superlatives & Ordinal Numbers',
        formula: 'the + most [adj] / [adj]-est / first / second',
        sentence: 'Zero-day vulnerability mitigation is the highest priority for our cybersecurity squad.',
        translation: 'Khắc phục lỗ hổng zero-day là ưu tiên cao nhất của đội ngũ an ninh mạng chúng tôi.',
        usageContext: 'Luôn dùng "the" trước dạng so sánh nhất hoặc số thứ tự.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I am a IT engineer.',
        right: 'I am an IT engineer.',
        explanation: 'Dùng "an" trước từ bắt đầu bằng nguyên âm (A, E, I, O, U) - dựa vào phát âm. "IT" phát âm là /ai-ti/.',
      },
      {
        wrong: 'Internet is down.',
        right: 'The Internet is down.',
        explanation: '"The" luôn đứng trước những danh từ duy nhất như "the Internet", "the moon", "the sun".',
      }
    ],
    quickQuiz: [
      {
        question: 'We need to deploy _____ application to _____ cloud.',
        options: ['a / a', 'the / the', 'an / the', 'the / a'],
        correctIndex: 2,
        explanation: 'Nhắc đến một application (bắt đầu bằng âm /æ/), dùng "an". Cloud đã xác định trong ngữ cảnh IT, dùng "the cloud".',
      },
      {
        question: 'She is _____ best developer in our team.',
        options: ['a', 'an', 'the', 'no article'],
        correctIndex: 2,
        explanation: 'Luôn dùng "the" trước cấu trúc so sánh nhất (best, most).',
      },
      {
        question: 'Choose the correct pair: "We hired _____ DevOps specialist with _____ extensive background in Kubernetes."',
        options: ['a / an', 'an / a', 'the / a', 'a / the'],
        correctIndex: 0,
        explanation: '"DevOps specialist" bắt đầu bằng phụ âm /d/ dùng "a"; "extensive background" bắt đầu bằng nguyên âm /ɪ/ dùng "an".',
      },
      {
        question: 'Which sentence uses articles CORRECTLY?',
        options: ['We deployed the code to the production yesterday.', 'We deployed the code to production yesterday.', 'We deployed a code to production yesterday.', 'We deployed code to the production yesterday.'],
        correctIndex: 1,
        explanation: 'Trong thuật ngữ IT, môi trường triển khai "production / staging / development" thường đứng độc lập không có "the" (deploy to production), và code là danh từ không đếm được.',
      },
      {
        question: 'Fill in: "_____ higher the server load becomes, _____ slower the API response time is."',
        options: ['A / a', 'The / the', 'The / a', 'A / the'],
        correctIndex: 1,
        explanation: 'Cấu trúc so sánh càng... càng... luôn dùng: "The + comparative, the + comparative".',
      },
      {
        question: 'Select the correct phrase: "She has been working as _____ engineer at Google for five years."',
        options: ['a', 'an', 'the', 'no article'],
        correctIndex: 1,
        explanation: 'Khi nói về nghề nghiệp của một người (engineer), ta dùng "a/an". Vì "engineer" bắt đầu bằng nguyên âm, ta dùng "an".',
      },
      {
        question: 'Choose the correct form: "Please check _____ error message displayed on your terminal window."',
        options: ['a', 'an', 'the', 'no article'],
        correctIndex: 2,
        explanation: 'Lỗi cụ thể đang hiển thị trên màn hình terminal của người nghe đã được xác định rõ ràng, do đó bắt buộc dùng "the".',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Tester', avatar: '🕵️', text: 'I caught an exception during login.', translation: 'Tôi bắt được một ngoại lệ trong lúc đăng nhập.' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'Can you send me the error log?', translation: 'Bạn có thể gửi tôi log lỗi đó được không?' },
      { speaker: 'Tester', avatar: '🕵️', text: 'Sure, I will attach it to the ticket.', translation: 'Chắc chắn rồi, tôi sẽ đính kèm nó vào ticket.' }
    ]
  },
  {
    id: 'basic-question-forms',
    title: 'Basic Question Forms',
    vietnameseTitle: 'Cấu trúc Đặt câu hỏi',
    level: 'Beginner',
    summary: 'Cách tạo câu hỏi Yes/No, câu hỏi Wh- (What, Where, Why...) và câu hỏi đuôi (Tag questions) trong giao tiếp.',
    icon: '❓',
    legoExample: {
      blocks: [
        { label: 'Wh- word', word: 'Why', color: 'amber', explanation: 'Từ để hỏi' },
        { label: 'Auxiliary', word: 'did', color: 'emerald', explanation: 'Trợ động từ' },
        { label: 'Subject', word: 'the build', color: 'indigo', explanation: 'Chủ ngữ' },
        { label: 'Main Verb', word: 'fail', color: 'rose', explanation: 'Động từ chính (nguyên thể)' }
      ],
      fullSentence: 'Why did the build fail?',
      translation: 'Tại sao quá trình build lại thất bại?',
    },
    tenseVariants: [
      {
        tenseName: 'Yes/No Questions with Auxiliary Verbs',
        formula: 'Auxiliary (Do/Does/Did/Have/Is/Are) + S + Main Verb...?',
        sentence: 'Did you benchmark the database latency before and after indexing?',
        translation: 'Bạn đã đo độ trễ cơ sở dữ liệu trước và sau khi đánh index chưa?',
        usageContext: 'Hỏi xác nhận thông tin Có/Không trong công việc hàng ngày.',
      },
      {
        tenseName: 'Wh- Questions Seeking Information',
        formula: 'Wh-word + Auxiliary + S + Main Verb...?',
        sentence: 'Why did the automated deployment pipeline fail on the linting step?',
        translation: 'Tại sao đường ống triển khai tự động lại thất bại ở bước kiểm tra linting?',
        usageContext: 'Hỏi lý do, thời gian, cách thức xử lý sự cố.',
      },
      {
        tenseName: 'Subject Questions without Auxiliary',
        formula: 'Who / What + Past Verb + Object...?',
        sentence: 'Who modified the environment variables without notifying the team?',
        translation: 'Ai đã chỉnh sửa các biến môi trường mà không thông báo cho nhóm?',
        usageContext: 'Khi từ để hỏi đóng vai trò là chủ ngữ của câu, không dùng trợ động từ do/did.',
      },
      {
        tenseName: 'Tag Questions for Clarification',
        formula: 'Statement (+/-) , Auxiliary (-/+) + Subject Pronoun?',
        sentence: 'The SSL certificate expires next month, doesn\'t it?',
        translation: 'Chứng chỉ SSL sẽ hết hạn vào tháng tới, đúng không nhỉ?',
        usageContext: 'Xác nhận lại thông tin trong các cuộc họp sprint và rà soát kỹ thuật.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'You finished the task?',
        right: 'Did you finish the task?',
        explanation: 'Câu hỏi Yes/No ở quá khứ phải có trợ động từ "Did" đảo lên trước chủ ngữ.',
      },
      {
        wrong: 'What time the meeting starts?',
        right: 'What time does the meeting start?',
        explanation: 'Câu hỏi Wh- cần có trợ động từ (do/does/did) đứng trước chủ ngữ.',
      }
    ],
    quickQuiz: [
      {
        question: '_____ you committed the code yet?',
        options: ['Do', 'Did', 'Have', 'Are'],
        correctIndex: 2,
        explanation: 'Có từ "yet" và động từ ở dạng V3/ed (committed), đây là thì hiện tại hoàn thành, dùng "Have".',
      },
      {
        question: 'The server is running smoothly, _____?',
        options: ['isn\\\'t it', 'is it', 'doesn\\\'t it', 'does it'],
        correctIndex: 0,
        explanation: 'Câu hỏi đuôi: vế trước là khẳng định (is), vế sau là phủ định (isn\\\'t).',
      },
      {
        question: 'Choose the correct Wh-question: "_____ database indexing technique did the architect recommend for our high-throughput service?"',
        options: ['Which', 'Who', 'Where', 'How much'],
        correctIndex: 0,
        explanation: '"Which" được dùng khi lựa chọn giữa một số lượng phương án kỹ thuật xác định.',
      },
      {
        question: 'Identify the correct question asking about the subject: "_____ modified the production configuration file without notifying the team?"',
        options: ['Who did modify', 'Who modified', 'Whom modified', 'Who was modified'],
        correctIndex: 1,
        explanation: 'Khi từ để hỏi ("Who") đóng vai trò là chủ ngữ của câu hỏi, không dùng trợ động từ "did", mà chia động từ trực tiếp ở quá khứ: "Who modified...".',
      },
      {
        question: 'Complete the negative question: "_____ you notice that the webhook failed to trigger after the payment was processed?"',
        options: ['Did not', 'Didn\\\'t', 'Do not', 'Have not'],
        correctIndex: 1,
        explanation: 'Câu hỏi phủ định ở quá khứ dùng "Didn\\\'t you notice...?" để thể hiện sự ngạc nhiên hoặc xác nhận thông tin.',
      },
      {
        question: 'Choose the correct word order for this question:',
        options: ['Why the deployment failed during the maintenance window?', 'Why did the deployment fail during the maintenance window?', 'Why failed the deployment during the maintenance window?', 'Why does the deployment failed during the maintenance window?'],
        correctIndex: 1,
        explanation: 'Trật tự chuẩn của câu hỏi Wh- trong quá khứ đơn: Wh-word + did + Subject + V-nguyên thể.',
      },
      {
        question: 'Form the correct question: "How long _____ for the migration script to finish running?"',
        options: ['did it take', 'it took', 'did it took', 'has it take'],
        correctIndex: 0,
        explanation: 'Cấu trúc hỏi thời lượng: "How long did it take for [something] to [do something]?"',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Client', avatar: '💼', text: 'When will the new version be released?', translation: 'Khi nào phiên bản mới sẽ được phát hành?' },
      { speaker: 'PM', avatar: '👨‍💼', text: 'We are aiming for next Friday. Does that work for you?', translation: 'Chúng tôi đang nhắm tới thứ Sáu tuần sau. Bạn thấy ổn chứ?' },
      { speaker: 'Client', avatar: '💼', text: 'Yes, it does. Who should I contact for support?', translation: 'Vâng, ổn. Tôi nên liên hệ với ai để được hỗ trợ?' }
    ]
  },
  {
    id: 'modal-verbs-polite',
    title: 'Modal Verbs for Workplace Politeness',
    vietnameseTitle: 'Động từ Khuyết thiếu cho Sự Lịch sự',
    level: 'Intermediate',
    summary: 'Sử dụng would, could, might để giảm nhẹ mức độ trực tiếp, tránh thô lỗ trong giao tiếp công việc.',
    icon: '🤝',
    legoExample: {
      blocks: [
        { label: 'Polite opener', word: 'Could you', color: 'indigo', explanation: 'Hỏi xin lịch sự' },
        { label: 'Action', word: 'please review', color: 'emerald', explanation: 'Hành động cần làm' },
        { label: 'Object', word: 'my pull request', color: 'rose', explanation: 'Đối tượng' },
        { label: 'Condition', word: 'when you have time?', color: 'sky', explanation: 'Tạo khoảng không thoải mái cho người nghe' },
      ],
      fullSentence: 'Could you please review my pull request when you have time?',
      translation: 'Bạn có thể vui lòng xem lại pull request của tôi khi bạn có thời gian không?',
    },
    tenseVariants: [
      {
        tenseName: 'Direct Request (Less polite)',
        formula: 'Can you / Please + V',
        sentence: 'Can you fix this bug now?',
        translation: 'Bạn sửa lỗi này ngay được không?',
        usageContext: 'Giao tiếp với người thân thiết, cấp dưới.',
      },
      {
        tenseName: 'Polite Request',
        formula: 'Could you / Would you + V',
        sentence: 'Could you look into this issue?',
        translation: 'Bạn có thể xem xét vấn đề này không?',
        usageContext: 'Giao tiếp công việc, đồng nghiệp, khách hàng.',
      },
      {
        tenseName: 'Very Polite / Indirect',
        formula: 'I was wondering if you could + V',
        sentence: 'I was wondering if you could help me with this.',
        translation: 'Tôi tự hỏi liệu bạn có thể giúp tôi việc này không.',
        usageContext: 'Nhờ vả sếp, khách hàng hoặc việc khó.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I want you to give me admin access.',
        right: 'Could you please grant me admin access?',
        explanation: '"I want you to" nghe như ra lệnh. Nên dùng "Could you please" để nhờ vả.',
      },
      {
        wrong: 'You must change this code.',
        right: 'You might want to change this code.',
        explanation: '"Must" mang tính bắt buộc mạnh. Khi review code, dùng "might want to" hoặc "suggest" sẽ chuyên nghiệp hơn.',
      }
    ],
    quickQuiz: [
      {
        question: 'Which sentence is most appropriate when giving feedback on a PR?',
        options: ['Change this function!', 'You should consider rewriting this function.', 'Rewrite this function now.', 'You have to rewrite this.'],
        correctIndex: 1,
        explanation: '"You should consider" mang tính gợi ý nhẹ nhàng, lịch sự nhất trong các lựa chọn.',
      },
      {
        question: '_____ you mind sharing your screen?',
        options: ['Would', 'Could', 'Do', 'Are'],
        correctIndex: 0,
        explanation: 'Cấu trúc lịch sự chuẩn: "Would you mind + V-ing".',
      },
      {
        question: 'In a professional client email, which phrasing is the MOST polite for requesting a status update?',
        options: ['Send me the status update right now.', 'You must give me the status update.', 'Could you please provide an update on the milestone status when you have a moment?', 'I want the milestone status update today.'],
        correctIndex: 2,
        explanation: '"Could you please provide... when you have a moment?" thể hiện văn phong công sở lịch sự, tôn trọng thời gian của đối tác.',
      },
      {
        question: 'Select the correct modal for polite suggestion: "We _____ consider implementing a rate limiter to protect the API from DDoS attacks."',
        options: ['might want to', 'have to strictly', 'must certainly', 'are forcing to'],
        correctIndex: 0,
        explanation: '"might want to [verb]" là cách đưa ra đề xuất kỹ thuật cực kỳ tinh tế và ngoại giao trong các cuộc họp thiết kế kiến trúc.',
      },
      {
        question: 'Choose the best phrase to decline a meeting politely due to a sprint deadline:',
        options: ['I can\\\'t come because I\\\'m busy.', 'I would love to attend, but I have a conflicting deadline with the production release.', 'Do not invite me to this meeting.', 'Your meeting is not important to me.'],
        correctIndex: 1,
        explanation: '"I would love to..., but I have a conflicting deadline..." là mẫu câu từ chối chuẩn mực, chuyên nghiệp trong môi trường quốc tế.',
      },
      {
        question: 'Which modal verb expresses permission in a formal business document?',
        options: ['can', 'may', 'should', 'will'],
        correctIndex: 1,
        explanation: 'Trong các tài liệu quy định và chính sách công ty, "may" được dùng để chỉ sự cho phép chính thức (e.g., "Employees may request remote work approval").',
      },
      {
        question: 'Complete the diplomatic question: "Would you mind _____ me through the payment refund workflow again?"',
        options: ['walking', 'to walk', 'walk', 'walked'],
        correctIndex: 0,
        explanation: 'Cấu trúc lịch sự tối cao: "Would you mind + V-ing...?"',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Dev A', avatar: '🧑‍💻', text: 'I think the database query is slow.', translation: 'Tôi nghĩ truy vấn cơ sở dữ liệu bị chậm.' },
      { speaker: 'Dev B', avatar: '👩‍💻', text: 'Would you mind creating an index for that table?', translation: 'Bạn có phiền tạo index cho bảng đó không?' },
      { speaker: 'Dev A', avatar: '🧑‍💻', text: 'Sure, I can do that right away.', translation: 'Chắc chắn rồi, tôi có thể làm ngay.' }
    ]
  },
  {
    id: 'present-perfect-achievements',
    title: 'Present Perfect for Achievements',
    vietnameseTitle: 'Thì Hiện tại Hoàn thành (Báo cáo & Kinh nghiệm)',
    level: 'Intermediate',
    summary: 'Dùng thì hiện tại hoàn thành để báo cáo tiến độ (vừa mới làm xong) hoặc kinh nghiệm (đã từng làm).',
    icon: '🏆',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'I', color: 'indigo', explanation: 'Chủ ngữ' },
        { label: 'Auxiliary', word: 'have just', color: 'amber', explanation: 'Trợ động từ + từ chỉ thời gian' },
        { label: 'Past Participle', word: 'deployed', color: 'emerald', explanation: 'Động từ phân từ II' },
        { label: 'Object', word: 'the hotfix', color: 'rose', explanation: 'Tân ngữ' }
      ],
      fullSentence: 'I have just deployed the hotfix.',
      translation: 'Tôi vừa mới triển khai bản sửa lỗi khẩn cấp.',
    },
    tenseVariants: [
      {
        tenseName: 'Experience (Kinh nghiệm)',
        formula: 'S + have/has + V3/ed',
        sentence: 'I have worked with React for 3 years.',
        translation: 'Tôi đã làm việc với React được 3 năm.',
        usageContext: 'Kể về kinh nghiệm tính đến hiện tại.',
      },
      {
        tenseName: 'Recent completion (Vừa hoàn thành)',
        formula: 'S + have/has + just/already + V3/ed',
        sentence: 'She has already finished the documentation.',
        translation: 'Cô ấy đã hoàn thành tài liệu rồi.',
        usageContext: 'Báo cáo việc đã xong trước hạn hoặc vừa xong.',
      },
      {
        tenseName: 'Incomplete action (Chưa xong)',
        formula: 'S + have/has + not + V3/ed + yet',
        sentence: 'We haven\'t resolved the issue yet.',
        translation: 'Chúng tôi vẫn chưa giải quyết xong sự cố.',
        usageContext: 'Báo cáo việc được giao nhưng chưa xong (dùng yet).',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I have finished the ticket yesterday.',
        right: 'I finished the ticket yesterday.',
        explanation: 'Khi có thời gian cụ thể trong quá khứ (yesterday, last week), phải dùng Quá khứ đơn, KHÔNG dùng Hiện tại hoàn thành.',
      },
      {
        wrong: 'Did you ever used Docker?',
        right: 'Have you ever used Docker?',
        explanation: 'Hỏi về trải nghiệm từ trước đến nay (ever), dùng thì Hiện tại hoàn thành.',
      }
    ],
    quickQuiz: [
      {
        question: 'We _____ the API performance significantly this sprint.',
        options: ['improve', 'improved', 'have improved', 'are improving'],
        correctIndex: 2,
        explanation: 'Báo cáo thành tựu đạt được trong một khoảng thời gian kéo dài tới hiện tại (this sprint), dùng Hiện tại hoàn thành.',
      },
      {
        question: '_____ you pushed the code to the repository yet?',
        options: ['Did', 'Do', 'Have', 'Are'],
        correctIndex: 2,
        explanation: 'Từ "yet" đi kèm động từ V3 (pushed) là dấu hiệu của thì Hiện tại hoàn thành (Have).',
      },
      {
        question: 'Which time expression is COMMONLY used with the Present Perfect tense to show recent completion?',
        options: ['just', 'yesterday', 'two weeks ago', 'last year'],
        correctIndex: 0,
        explanation: '"just" (vừa mới làm xong) là trạng từ kinh điển đi với thì hiện tại hoàn thành (e.g. "We have just deployed the hotfix").',
      },
      {
        question: 'Choose the correct form: "Our engineering department _____ five major client releases so far this quarter."',
        options: ['completed', 'has completed', 'is completing', 'completes'],
        correctIndex: 1,
        explanation: '"so far" (cho đến nay) là dấu hiệu nhận biết điển hình của thì Hiện tại hoàn thành để báo cáo thành tựu tích lũy.',
      },
      {
        question: 'Fill in: "The security team _____ any unauthorized access attempts since the firewall was updated."',
        options: ['has not detected', 'did not detect', 'was not detected', 'is not detecting'],
        correctIndex: 0,
        explanation: 'Mệnh đề chính đi với "since + mốc quá khứ" luôn chia ở thì Hiện tại hoàn thành: "has not detected".',
      },
      {
        question: 'Identify the difference between "have gone to" and "have been to":',
        options: ['have been to" means currently there; "have gone to" means already returned.', 'have gone to" means currently there or on the way; "have been to" means has visited and returned.', 'Both phrases mean exactly the same thing.', 'Neither phrase is grammatically acceptable.'],
        correctIndex: 1,
        explanation: '"He has gone to Singapore" nghĩa là anh ấy đang ở Singapore chưa về; "He has been to Singapore" nghĩa là anh ấy đã từng đến đó và hiện đã quay về.',
      },
      {
        question: 'Complete the resume achievement bullet: "Successfully _____ infrastructure costs by 35% through Docker optimization."',
        options: ['reduced', 'reducing', 'have reduce', 'reduce'],
        correctIndex: 0,
        explanation: 'Trong CV/resume tiếng Anh, các gạch đầu dòng kinh nghiệm quá khứ thường dùng Action Verbs ở thì Quá khứ đơn (reduced, improved, led).',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Scrum Master', avatar: '🧔', text: 'Have we completed all the sprint tasks?', translation: 'Chúng ta đã hoàn thành tất cả task của sprint chưa?' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'I have already merged my code, but QA hasn\'t tested it yet.', translation: 'Tôi đã merge code rồi, nhưng QA chưa test.' },
      { speaker: 'QA', avatar: '🕵️', text: 'I\'ll test it as soon as the environment is up.', translation: 'Tôi sẽ test ngay khi môi trường sẵn sàng.' }
    ]
  },
  {
    id: 'comparatives-superlatives',
    title: 'Comparatives & Superlatives',
    vietnameseTitle: 'So Sánh Hơn và So Sánh Nhất',
    level: 'Intermediate',
    summary: 'Cách so sánh hiệu suất, giải pháp công nghệ (faster, most secure, more efficient).',
    icon: '📊',
    legoExample: {
      blocks: [
        { label: 'Subject 1', word: 'GraphQL', color: 'indigo', explanation: 'Đối tượng 1' },
        { label: 'Verb', word: 'is', color: 'amber', explanation: 'Động từ to be' },
        { label: 'Comparative', word: 'more flexible than', color: 'emerald', explanation: 'Cấu trúc so sánh hơn (tính từ dài)' },
        { label: 'Subject 2', word: 'REST', color: 'rose', explanation: 'Đối tượng 2' }
      ],
      fullSentence: 'GraphQL is more flexible than REST for this use case.',
      translation: 'GraphQL linh hoạt hơn REST cho trường hợp sử dụng này.',
    },
    tenseVariants: [
      {
        tenseName: 'Short Adjective Comparison',
        formula: 'S1 + be + Adj-er + than + S2',
        sentence: 'Go is significantly faster and lighter than Python for high-concurrency network services.',
        translation: 'Go nhanh và nhẹ hơn đáng kể so với Python đối với các dịch vụ mạng xử lý đồng thời cao.',
        usageContext: 'So sánh tính từ ngắn (thêm đuôi -er).',
      },
      {
        tenseName: 'Long Adjective Comparison',
        formula: 'S1 + be + more + Adj + than + S2',
        sentence: 'Event-driven microservices are more resilient than monolithic architectures during traffic surges.',
        translation: 'Kiến trúc vi dịch vụ hướng sự kiện có khả năng phục hồi tốt hơn kiến trúc nguyên khối trong các đợt bùng nổ truy cập.',
        usageContext: 'So sánh tính từ dài từ 2-3 âm tiết trở lên.',
      },
      {
        tenseName: 'Superlative Form',
        formula: 'S + be + the most + Adj / the Adj-est + in/of',
        sentence: 'Data privacy and transaction integrity are the most critical metrics in modern banking systems.',
        translation: 'Quyền riêng tư dữ liệu và tính toàn vẹn giao dịch là các chỉ số quan trọng nhất trong các hệ thống ngân hàng hiện đại.',
        usageContext: 'So sánh một đối tượng vượt trội nhất trong toàn bộ tập thể.',
      },
      {
        tenseName: 'Parallel Comparison (The more... the more...)',
        formula: 'The + comparative + S + V, the + comparative + S + V',
        sentence: 'The more efficiently we cache queries, the lower our cloud infrastructure bill becomes.',
        translation: 'Chúng ta lưu bộ nhớ đệm truy vấn càng hiệu quả, thì hóa đơn hạ tầng đám mây càng giảm xuống.',
        usageContext: 'Diễn tả mối quan hệ tỷ lệ thuận hoặc nghịch giữa hai đại lượng.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'This algorithm is more faster.',
        right: 'This algorithm is faster.',
        explanation: 'Không dùng "more" cùng với tính từ ngắn thêm "-er".',
      },
      {
        wrong: 'It is the most easiest way to deploy.',
        right: 'It is the easiest way to deploy.',
        explanation: 'Tương tự, không dùng "most" với tính từ ngắn thêm "-est".',
      }
    ],
    quickQuiz: [
      {
        question: 'Using caching makes the app load _____ than before.',
        options: ['fast', 'more fast', 'faster', 'fastest'],
        correctIndex: 2,
        explanation: '"fast" là tính từ ngắn, so sánh hơn thêm đuôi "-er" (faster).',
      },
      {
        question: 'AWS is one of the _____ cloud providers in the world.',
        options: ['popular', 'more popular', 'most popular', 'popularest'],
        correctIndex: 2,
        explanation: '"popular" là tính từ dài, so sánh nhất dùng "most popular". Cụm "one of the..." + so sánh nhất.',
      },
      {
        question: 'Choose the correct comparative: "PostgreSQL is often considered _____ MongoDB for strictly structured relational queries."',
        options: ['more reliable than', 'more reliable as', 'reliabler than', 'most reliable than'],
        correctIndex: 0,
        explanation: '"Reliable" là tính từ dài có 3 âm tiết, so sánh hơn dùng: "more reliable than".',
      },
      {
        question: 'Select the correct sentence with equal comparison:',
        options: ['This framework is as efficient as the previous one.', 'This framework is as efficient than the previous one.', 'This framework is so efficient than the previous one.', 'This framework is more efficient as the previous one.'],
        correctIndex: 0,
        explanation: 'Cấu trúc so sánh bằng: "as + adjective + as".',
      },
      {
        question: 'Fill in: "Among all the cloud providers we benchmarked, AWS offered _____ global infrastructure presence."',
        options: ['the broadest', 'broadest', 'the broader', 'more broad'],
        correctIndex: 0,
        explanation: 'So sánh nhất trong một nhóm đối tượng bắt buộc phải có mạo từ "the": "the broadest".',
      },
      {
        question: 'Choose the correct form: "The rewritten microservice performs _____ faster than the legacy monolith."',
        options: ['significantly', 'more', 'very', 'too'],
        correctIndex: 0,
        explanation: 'Để bổ nghĩa mức độ cho so sánh hơn ("faster"), ta dùng các trạng từ: significantly, much, far, slightly (KHÔNG dùng very trước tính từ so sánh hơn).',
      },
      {
        question: 'Identify the irregular comparative form of "far" when indicating extra or additional information:',
        options: ['farther', 'further', 'farthest', 'more far'],
        correctIndex: 1,
        explanation: '"Further" được dùng để chỉ mức độ sâu rộng, chi tiết hơn hoặc bổ sung (e.g., "for further details"), trong khi "farther" thiên về khoảng cách vật lý.',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Architect', avatar: '🏗️', text: 'Should we use NoSQL or SQL for this project?', translation: 'Chúng ta nên dùng NoSQL hay SQL cho dự án này?' },
      { speaker: 'Data Engineer', avatar: '💾', text: 'NoSQL is better for unstructured data, but SQL is more reliable for transactions.', translation: 'NoSQL tốt hơn cho dữ liệu phi cấu trúc, nhưng SQL đáng tin cậy hơn cho giao dịch.' },
      { speaker: 'Architect', avatar: '🏗️', text: 'Let\'s go with SQL. Data integrity is the most important factor here.', translation: 'Hãy chọn SQL. Tính toàn vẹn dữ liệu là yếu tố quan trọng nhất ở đây.' }
    ]
  },
  {
    id: 'reported-speech',
    title: 'Reported Speech',
    vietnameseTitle: 'Câu Tường Thuật',
    level: 'Intermediate',
    summary: 'Cách tường thuật lại lời nói của người khác, rất hữu ích khi truyền đạt thông tin từ cuộc họp hoặc khách hàng.',
    icon: '🗣️',
    legoExample: {
      blocks: [
        { label: 'Reporter', word: 'The client said', color: 'indigo', explanation: 'Người tường thuật + động từ tường thuật' },
        { label: 'Connector', word: '(that)', color: 'sky', explanation: 'Từ nối (có thể lược bỏ)' },
        { label: 'Subject', word: 'they wanted', color: 'emerald', explanation: 'Chủ ngữ mới + Động từ lùi thì (want -> wanted)' },
        { label: 'Object', word: 'a new dashboard', color: 'rose', explanation: 'Tân ngữ' }
      ],
      fullSentence: 'The client said they wanted a new dashboard.',
      translation: 'Khách hàng nói rằng họ muốn một trang tổng quan mới.',
    },
    tenseVariants: [
      {
        tenseName: 'Reporting Statements with Tense Backshift',
        formula: 'S + said (that) + S + Past Verb',
        sentence: 'The lead DevOps engineer said that the database replication had completed without packet loss.',
        translation: 'Kỹ sư DevOps trưởng nói rằng quá trình nhân bản cơ sở dữ liệu đã hoàn tất mà không bị mất gói tin nào.',
        usageContext: 'Tường thuật lại lời tuyên bố, lùi thì tương ứng (Present -> Past, Past -> Past Perfect).',
      },
      {
        tenseName: 'Reporting Yes/No Questions with If / Whether',
        formula: 'S + asked + if/whether + S + Verb (statement order)',
        sentence: 'The product owner asked if the frontend was ready for the staging acceptance test.',
        translation: 'Product owner đã hỏi liệu giao diện frontend đã sẵn sàng cho bài kiểm thử chấp nhận staging chưa.',
        usageContext: 'Tường thuật câu hỏi Yes/No, không dùng trợ động từ đảo ngữ.',
      },
      {
        tenseName: 'Reporting Wh- Questions',
        formula: 'S + asked + Wh-word + S + Verb (statement order)',
        sentence: 'The client asked when our squad would release the multi-currency payment feature.',
        translation: 'Khách hàng đã hỏi khi nào nhóm chúng tôi sẽ phát hành tính năng thanh toán đa tiền tệ.',
        usageContext: 'Tường thuật câu hỏi thông tin, trật tự từ như câu khẳng định.',
      },
      {
        tenseName: 'Reporting Requests & Commands',
        formula: 'S + asked / told / advised + Object + to V (or not to V)',
        sentence: 'The cybersecurity team instructed us to rotate all staging API keys immediately.',
        translation: 'Đội ngũ an ninh mạng đã hướng dẫn chúng tôi thay đổi tất cả các khóa API staging ngay lập tức.',
        usageContext: 'Tường thuật yêu cầu, chỉ thị hoặc lời khuyên kỹ thuật.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'She told to me that the server was down.',
        right: 'She told me that the server was down. / She said to me that...',
        explanation: 'Dùng "told + tân ngữ" (không có to) hoặc "said to + tân ngữ".',
      },
      {
        wrong: 'He said he will fix it tomorrow.',
        right: 'He said he would fix it the next day.',
        explanation: 'Trong câu tường thuật, phải lùi thì (will -> would) và đổi trạng từ chỉ thời gian (tomorrow -> the next day).',
      }
    ],
    quickQuiz: [
      {
        question: 'Direct: "I am writing the tests." -> Reported: He said he _____ the tests.',
        options: ['is writing', 'was writing', 'writes', 'has written'],
        correctIndex: 1,
        explanation: 'Lùi một thì: Hiện tại tiếp diễn (am writing) -> Quá khứ tiếp diễn (was writing).',
      },
      {
        question: 'The manager asked me _____ I had finished the report.',
        options: ['that', 'what', 'if', 'did'],
        correctIndex: 2,
        explanation: 'Tường thuật câu hỏi Yes/No dùng "if" hoặc "whether".',
      },
      {
        question: 'Convert to reported speech: The client said, "We need the mobile build by tomorrow."',
        options: ['The client said that they needed the mobile build by the following day.', 'The client said that we need the mobile build by tomorrow.', 'The client said that they need the mobile build by yesterday.', 'The client told that they needed the mobile build by tomorrow.'],
        correctIndex: 0,
        explanation: 'Lùi thì từ Present Simple (need) -> Past Simple (needed), đổi ngôi "we" -> "they", đổi trạng từ "tomorrow" -> "the following day".',
      },
      {
        question: 'Direct: "Can you review my pull request?" -> Reported: "She asked me _____ her pull request."',
        options: ['if I could review', 'could I review', 'that I can review', 'if could I review'],
        correctIndex: 0,
        explanation: 'Câu hỏi Yes/No chuyển sang gián tiếp dùng "if / whether + S + V (trật tự câu khẳng định)": "if I could review".',
      },
      {
        question: 'Choose the correct reporting verb: "The Tech Lead _____ the junior developer not to run destructive scripts on production."',
        options: ['warned', 'suggested', 'explained', 'said'],
        correctIndex: 0,
        explanation: 'Cấu trúc cảnh báo nguy hiểm: "warn someone (not) to do something".',
      },
      {
        question: 'When reporting an ongoing general truth (e.g. "The Earth orbits the Sun" or "HTTPS encrypts data"), what happens to the tense?',
        options: ['The tense MUST always shift back to past.', 'The tense can remain in the Present Simple because the fact is still true.', 'The sentence must be converted to passive voice.', 'The verb changes to past perfect.'],
        correctIndex: 1,
        explanation: 'Khi tường thuật một chân lý vĩnh cửu hoặc sự thật kỹ thuật hiển nhiên vẫn còn đúng ở hiện tại, ta có thể giữ nguyên thì hiện tại đơn.',
      },
      {
        question: 'Reported question word order: "The Scrum Master asked the dev team _____."',
        options: ['when would the sprint backlog be completed', 'when the sprint backlog would be completed', 'would when the sprint backlog be completed', 'when will the sprint backlog be completed'],
        correctIndex: 1,
        explanation: 'Trong câu hỏi gián tiếp, tuyệt đối KHÔNG đảo ngữ. Trật tự luôn là: Từ để hỏi (when) + Chủ ngữ + Động từ.',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'What did the CTO say in the meeting?', translation: 'CTO đã nói gì trong cuộc họp vậy?' },
      { speaker: 'Team Lead', avatar: '👨‍🏫', text: 'He said that we needed to migrate to microservices by Q3.', translation: 'Ông ấy nói rằng chúng ta cần chuyển đổi sang microservices trước quý 3.' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'Did he mention the budget?', translation: 'Ông ấy có nhắc đến ngân sách không?' },
      { speaker: 'Team Lead', avatar: '👨‍🏫', text: 'Yes, he told us that they would approve a higher budget.', translation: 'Có, ông ấy bảo chúng ta rằng họ sẽ phê duyệt ngân sách cao hơn.' }
    ]
  },
  {
    id: 'conditionals-it-logic',
    title: 'Conditionals for IT Logic',
    vietnameseTitle: 'Câu Điều Kiện trong Logic Lập trình',
    level: 'Advanced',
    summary: 'Cách dùng If/Else trong tiếng Anh (Loại 0, 1, 2, 3) tương ứng với logic lập trình.',
    icon: '🔀',
    legoExample: {
      blocks: [
        { label: 'If Clause', word: 'If the server crashes,', color: 'indigo', explanation: 'Điều kiện (If + Hiện tại đơn)' },
        { label: 'Main Subject', word: 'the load balancer', color: 'emerald', explanation: 'Chủ ngữ mệnh đề chính' },
        { label: 'Action', word: 'will redirect', color: 'amber', explanation: 'Kết quả (Will + V)' },
        { label: 'Object', word: 'the traffic.', color: 'rose', explanation: 'Tân ngữ' },
      ],
      fullSentence: 'If the server crashes, the load balancer will redirect the traffic.',
      translation: 'Nếu máy chủ gặp sự cố, bộ cân bằng tải sẽ chuyển hướng lưu lượng truy cập.',
    },
    tenseVariants: [
      {
        tenseName: 'Type 0 (General Truth / Logic)',
        formula: 'If + Present, Present',
        sentence: 'If you divide by zero, the program throws an error.',
        translation: 'Nếu bạn chia cho 0, chương trình sẽ báo lỗi.',
        usageContext: 'Sự thật hiển nhiên, logic lập trình luôn đúng.',
      },
      {
        tenseName: 'Type 1 (Real possibility)',
        formula: 'If + Present, Will + V',
        sentence: 'If we use Redis, the response time will improve.',
        translation: 'Nếu ta dùng Redis, thời gian phản hồi sẽ tốt hơn.',
        usageContext: 'Khả năng có thể xảy ra trong tương lai.',
      },
      {
        tenseName: 'Type 2 (Unreal present/future)',
        formula: 'If + Past, Would + V',
        sentence: 'If we had more time, we would refactor this module.',
        translation: 'Nếu có nhiều thời gian hơn, ta sẽ đập đi xây lại module này.',
        usageContext: 'Giả định không có thật ở hiện tại/tương lai.',
      },
      {
        tenseName: 'Type 3 (Unreal past)',
        formula: 'If + Past Perfect, Would have + V3',
        sentence: 'If they had tested it, the bug wouldn\'t have occurred.',
        translation: 'Nếu họ đã test nó, lỗi đã không xảy ra.',
        usageContext: 'Sự việc đã xảy ra, giả định ngược lại ở quá khứ (thường dùng để tiếc nuối/trách móc).',
      }
    ],
    commonMistakes: [
      {
        wrong: 'If the user will click here, show a modal.',
        right: 'If the user clicks here, show a modal.',
        explanation: 'Tuyệt đối không dùng "will" trong mệnh đề chứa "If".',
      },
      {
        wrong: 'If I was the PM, I would prioritize tech debt.',
        right: 'If I were the PM, I would prioritize tech debt.',
        explanation: 'Trong câu điều kiện loại 2, luôn dùng "were" cho mọi ngôi (to be) thay vì "was".',
      }
    ],
    quickQuiz: [
      {
        question: 'If you _____ this script, it will format all your code.',
        options: ['run', 'will run', 'ran', 'running'],
        correctIndex: 0,
        explanation: 'Điều kiện loại 1: Mệnh đề if dùng thì hiện tại đơn.',
      },
      {
        question: 'We would have caught the bug earlier if we _____ unit tests.',
        options: ['have written', 'wrote', 'had written', 'write'],
        correctIndex: 2,
        explanation: 'Điều kiện loại 3 (would have caught): mệnh đề If phải chia ở Quá khứ hoàn thành (had written).',
      },
      {
        question: 'Choose the correct Zero Conditional: "If an unhandled exception _____, the server automatically _____ a 500 error code."',
        options: ['occurs / returns', 'occur / will return', 'occurred / returned', 'will occur / returns'],
        correctIndex: 0,
        explanation: 'Zero Conditional diễn tả quy luật logic chắc chắn luôn xảy ra: If + Present Simple, Present Simple.',
      },
      {
        question: 'Identify the Second Conditional sentence (hypothetical situation in the present):',
        options: ['If we have more memory, the app will run faster.', 'If we had a distributed Redis cluster, our cache hit rate would improve drastically.', 'If we had deployed on Friday, the crash would have happened.', 'If you run tests, bugs are caught early.'],
        correctIndex: 1,
        explanation: 'Câu điều kiện loại 2 giả định điều không có thật ở hiện tại: If + S + V2/ed, S + would + V_nguyên thể.',
      },
      {
        question: 'Third Conditional (regret about the past): "If we _____ unit tests for that edge case, the database corruption _____."',
        options: ['had written / would not have occurred', 'wrote / would not occur', 'write / will not occur', 'have written / had not occurred'],
        correctIndex: 0,
        explanation: 'Điều kiện loại 3 diễn tả sự việc trái ngược với quá khứ: If + had + V3/ed, S + would have + V3/ed.',
      },
      {
        question: 'Replace "If" with a professional conditional connector: "The deployment will proceed smoothly _____ all automated test suites pass."',
        options: ['provided that', 'unless', 'even though', 'in spite of'],
        correctIndex: 0,
        explanation: '"Provided that" (miễn là / với điều kiện là) tương đương với "Only if", rất phổ biến trong tài liệu và hợp đồng kỹ thuật.',
      },
      {
        question: 'Choose the correct meaning: "Unless you configure CORS properly, external clients cannot access the API."',
        options: ['If you configure CORS, clients cannot access.', 'If you do NOT configure CORS properly, external clients cannot access the API.', 'Because you configured CORS, external clients can access.', 'When CORS is configured, the API will crash.'],
        correctIndex: 1,
        explanation: '"Unless" = "If... not" (Trừ phi / Nếu không... thì).',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Tester', avatar: '🕵️', text: 'The app crashes when I upload a 50MB file.', translation: 'App bị crash khi tôi tải lên file 50MB.' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'Ah, if the file is larger than 20MB, the memory limit is exceeded.', translation: 'À, nếu file lớn hơn 20MB, giới hạn bộ nhớ sẽ bị vượt quá.' },
      { speaker: 'Tester', avatar: '🕵️', text: 'If we had known that, we would have added a file size validation earlier.', translation: 'Nếu chúng ta biết điều đó, chúng ta đã thêm validate kích thước file sớm hơn rồi.' }
    ]
  },
  {
    id: 'passive-voice-workplace',
    title: 'Passive Voice in Workplace',
    vietnameseTitle: 'Câu Bị Động trong Công sở',
    level: 'Advanced',
    summary: 'Khi nào nên dùng câu bị động (Passive voice) để nhấn mạnh vào hành động thay vì người thực hiện (Bug reports, System logs).',
    icon: '🛡️',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'The issue', color: 'indigo', explanation: 'Đối tượng bị tác động (Tân ngữ đảo lên)' },
        { label: 'Be verb', word: 'was', color: 'amber', explanation: 'Động từ to be (chia theo thì)' },
        { label: 'Past Participle', word: 'resolved', color: 'emerald', explanation: 'Động từ chính (V3/ed)' },
        { label: 'Agent (optional)', word: 'by the ops team', color: 'sky', explanation: 'Người thực hiện (có thể bỏ qua)' },
      ],
      fullSentence: 'The issue was resolved by the ops team.',
      translation: 'Vấn đề đã được đội vận hành giải quyết.',
    },
    tenseVariants: [
      {
        tenseName: 'Present Simple Passive',
        formula: 'S + is/are/am + V3',
        sentence: 'Passwords are encrypted before saving.',
        translation: 'Mật khẩu được mã hóa trước khi lưu.',
        usageContext: 'Quy trình, hệ thống tự động.',
      },
      {
        tenseName: 'Present Perfect Passive',
        formula: 'S + have/has been + V3',
        sentence: 'The database has been updated.',
        translation: 'Cơ sở dữ liệu đã được cập nhật.',
        usageContext: 'Thông báo hoàn tất công việc.',
      },
      {
        tenseName: 'Modal Passive',
        formula: 'S + modal + be + V3',
        sentence: 'This feature must be tested thoroughly.',
        translation: 'Tính năng này phải được kiểm thử kỹ lưỡng.',
        usageContext: 'Yêu cầu, quy định bắt buộc.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'The bug fixed yesterday.',
        right: 'The bug was fixed yesterday.',
        explanation: 'Bug không tự fix được. Phải dùng cấu trúc bị động (be + V3).',
      },
      {
        wrong: 'The report has sent to the client.',
        right: 'The report has been sent to the client.',
        explanation: 'Báo cáo không tự gửi. Thì hiện tại hoàn thành bị động phải có "been" trước V3.',
      }
    ],
    quickQuiz: [
      {
        question: 'All user data _____ securely in the cloud.',
        options: ['stores', 'is storing', 'is stored', 'stored'],
        correctIndex: 2,
        explanation: 'Dữ liệu không tự lưu trữ, phải dùng bị động (is stored).',
      },
      {
        question: 'The server _____ tomorrow night for maintenance.',
        options: ['will restart', 'will be restarted', 'restarted', 'is restarted'],
        correctIndex: 1,
        explanation: 'Tương lai đơn bị động (will be + V3) chỉ hành động sẽ xảy ra có dự định.',
      },
      {
        question: 'Convert to Passive Voice: "The QA lead discovered a critical security vulnerability."',
        options: ['A critical security vulnerability was discovered by the QA lead.', 'A critical security vulnerability has been discovered by the QA lead.', 'A critical security vulnerability is discovered by the QA lead.', 'A critical security vulnerability discovered the QA lead.'],
        correctIndex: 0,
        explanation: 'Câu chủ động ở quá khứ đơn (discovered) -> Bị động ở quá khứ đơn: was/were + V3/ed ("was discovered").',
      },
      {
        question: 'Why is the Passive Voice preferred in technical incident reports?',
        options: ['To make sentences longer and sound complex.', 'To focus objectively on the problem and the affected system, avoiding personal finger-pointing.', 'Because active voice is grammatically incorrect in engineering.', 'To confuse non-technical managers.'],
        correctIndex: 1,
        explanation: 'Trong văn hóa công nghệ quốc tế, câu bị động giúp báo cáo sự cố khách quan (e.g., "The database was corrupted"), tập trung giải quyết vấn đề thay vì đổ lỗi cá nhân.',
      },
      {
        question: 'Complete the sentence in the Present Continuous Passive: "Please be patient while the database index _____."',
        options: ['is being rebuilt', 'is rebuilding', 'is rebuilt', 'was being rebuilt'],
        correctIndex: 0,
        explanation: 'Bị động của hiện tại tiếp diễn: S + am/is/are + being + V3/ed ("is being rebuilt").',
      },
      {
        question: 'Choose the Modal Passive form: "All environment credentials _____ in a secure secrets vault."',
        options: ['must be stored', 'must store', 'must been stored', 'must to be stored'],
        correctIndex: 0,
        explanation: 'Bị động với động từ khuyết thiếu: Modal + be + V3/ed ("must be stored").',
      },
      {
        question: 'Fill in: "The pull request _____ yet by the repository maintainers."',
        options: ['has not been approved', 'did not approve', 'is not approved', 'was not approving'],
        correctIndex: 0,
        explanation: 'Dấu hiệu "yet" đi với thì Hiện tại hoàn thành bị động: "has not been approved".',
      }
    ],
    realLifeDialogue: [
      { speaker: 'SysAdmin', avatar: '👨‍🔧', text: 'The servers will be upgraded tonight at 2 AM.', translation: 'Các máy chủ sẽ được nâng cấp đêm nay lúc 2h sáng.' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'Will a notification be sent to the users?', translation: 'Sẽ có thông báo gửi cho người dùng chứ?' },
      { speaker: 'SysAdmin', avatar: '👨‍🔧', text: 'Yes, an email has already been prepared.', translation: 'Có, một email đã được chuẩn bị sẵn rồi.' }
    ]
  },
  {
    id: 'relative-clauses',
    title: 'Relative Clauses',
    vietnameseTitle: 'Mệnh Đề Quan Hệ',
    level: 'Advanced',
    summary: 'Sử dụng who, which, that, whose để kết nối thông tin, mô tả hệ thống, lỗi, hoặc con người một cách rõ ràng và chuyên nghiệp.',
    icon: '🔗',
    legoExample: {
      blocks: [
        { label: 'Main Clause start', word: 'The module', color: 'indigo', explanation: 'Chủ đề chính' },
        { label: 'Relative Pronoun', word: 'which', color: 'amber', explanation: 'Đại từ quan hệ thay thế cho vật' },
        { label: 'Relative Clause', word: 'handles authentication', color: 'sky', explanation: 'Mệnh đề giải thích' },
        { label: 'Main Clause end', word: 'needs a refactor', color: 'rose', explanation: 'Phần còn lại của câu chính' }
      ],
      fullSentence: 'The module which handles authentication needs a refactor.',
      translation: 'Module xử lý xác thực cần được tái cấu trúc.',
    },
    tenseVariants: [
      {
        tenseName: 'Defining Relative Clause for People',
        formula: 'Noun (Person) + who / that + V + O',
        sentence: 'The senior architect who designed our event-driven system will conduct today\'s design review.',
        translation: 'Kiến trúc sư trưởng người đã thiết kế hệ thống hướng sự kiện của chúng ta sẽ chủ trì buổi đánh giá thiết kế hôm nay.',
        usageContext: 'Xác định rõ người được nhắc đến là ai.',
      },
      {
        tenseName: 'Defining Relative Clause for Things',
        formula: 'Noun (Thing) + which / that + V + O',
        sentence: 'We upgraded the Redis instance that was throttling customer login sessions.',
        translation: 'Chúng tôi đã nâng cấp phiên bản Redis đang bóp nghẽn các phiên đăng nhập của khách hàng.',
        usageContext: 'Xác định cụ thể sự vật, công cụ hoặc mã nguồn.',
      },
      {
        tenseName: 'Non-defining Relative Clause (Extra Information)',
        formula: 'Noun, which / who + extra clause, Main clause',
        sentence: 'Kubernetes, which was initially open-sourced by Google, orchestrates our container fleet.',
        translation: 'Kubernetes, công nghệ ban đầu được Google mã nguồn mở, đang điều phối toàn bộ đội tàu container của chúng tôi.',
        usageContext: 'Cung cấp thông tin bổ sung, nằm giữa 2 dấu phẩy, không dùng "that".',
      },
      {
        tenseName: 'Possessive Relative Clause with Whose',
        formula: 'Noun + whose + Noun + Verb',
        sentence: 'We integrated an AI transcription service whose latency averages under 300 milliseconds.',
        translation: 'Chúng tôi đã tích hợp một dịch vụ chuyển âm AI có độ trễ trung bình dưới 300 mili-giây.',
        usageContext: 'Chỉ quyền sở hữu hoặc đặc tính thuộc về đối tượng đi trước.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'The developer which wrote this code left the company.',
        right: 'The developer who wrote this code left the company.',
        explanation: '"Developer" là người, phải dùng "who" (hoặc "that"), không dùng "which".',
      },
      {
        wrong: 'The function, that processes payments, is complex.',
        right: 'The function, which processes payments, is complex.',
        explanation: 'Trong mệnh đề quan hệ không xác định (có dấu phẩy), KHÔNG dùng "that".',
      }
    ],
    quickQuiz: [
      {
        question: 'We need to fix the bug _____ is causing the memory leak.',
        options: ['who', 'whom', 'that', 'whose'],
        correctIndex: 2,
        explanation: '"bug" là vật, dùng "that" hoặc "which" đóng vai trò chủ ngữ.',
      },
      {
        question: 'I talked to the DevOps engineer _____ script automated our deployment.',
        options: ['who', 'which', 'whose', 'whom'],
        correctIndex: 2,
        explanation: 'Chỉ sở hữu (script của engineer đó), dùng "whose".',
      },
      {
        question: 'Choose the correct relative pronoun: "The developer _____ authored this caching library is hosting a tech talk today."',
        options: ['who', 'which', 'whose', 'whom'],
        correctIndex: 0,
        explanation: '"who" thay thế cho danh từ chỉ người làm chủ ngữ ("The developer").',
      },
      {
        question: 'Select the correct pronoun for possession: "We are partnering with a startup _____ AI models achieve 99% speech recognition accuracy."',
        options: ['whose', 'which', 'who', 'that'],
        correctIndex: 0,
        explanation: '"whose" chỉ quyền sở hữu của sự vật/người đứng trước (mô hình AI của công ty startup đó).',
      },
      {
        question: 'Which sentence contains a NON-DEFINING relative clause (extra information between commas)?',
        options: ['Docker, which was released in 2013, revolutionized software deployment.', 'The developer who wrote this code needs to fix the bug.', 'The server that crashed was running out of RAM.', 'Any pull request that fails the linter will be rejected.'],
        correctIndex: 0,
        explanation: 'Mệnh đề quan hệ không xác định nằm giữa hai dấu phẩy, bổ sung thông tin cho danh từ riêng/xác định và KHÔNG dùng "that".',
      },
      {
        question: 'When can the relative pronoun (who, which, that) be OMITTED?',
        options: ['When it functions as the object of the relative clause.', 'When it functions as the subject of the relative clause.', 'When it is followed by a comma.', 'It can never be omitted under any circumstances.'],
        correctIndex: 0,
        explanation: 'Đại từ quan hệ có thể được lược bỏ khi nó đóng vai trò tân ngữ (e.g., "The API [that] we built last year works flawlessly").',
      },
      {
        question: 'Choose the correct prepositional relative clause: "This is the secure protocol _____ all customer transactions are processed."',
        options: ['through which', 'which', 'who', 'whereby that'],
        correctIndex: 0,
        explanation: '"through which" mang nghĩa "thông qua giao thức đó", rất trang trọng và chính xác trong tài liệu kỹ thuật.',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Reviewer', avatar: '👀', text: 'Who wrote the script that handles data backup?', translation: 'Ai đã viết script xử lý sao lưu dữ liệu vậy?' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'It was John, whose contract ended last month.', translation: 'Là John, người mà hợp đồng đã kết thúc tháng trước.' },
      { speaker: 'Reviewer', avatar: '👀', text: 'Well, the logic which he implemented is failing.', translation: 'Chà, logic mà anh ấy triển khai đang bị lỗi.' }
    ]
  },
  {
    id: 'advanced-tense-review',
    title: 'Advanced Tense Review',
    vietnameseTitle: 'Tổng hợp 12 Thì trong Công việc',
    level: 'Advanced',
    summary: 'Kết hợp nhiều thì khác nhau trong cùng một đoạn văn, email, hoặc báo cáo tiến độ (Stand-up meeting).',
    icon: '🕰️',
    legoExample: {
      blocks: [
        { label: 'Past', word: 'Yesterday I fixed', color: 'rose', explanation: 'Quá khứ đơn (Đã làm xong)' },
        { label: 'Present Perf.', word: 'and have already pushed', color: 'amber', explanation: 'Hiện tại hoàn thành (Kết quả hiện tại)' },
        { label: 'Present Cont.', word: 'Currently I am working', color: 'emerald', explanation: 'Hiện tại tiếp diễn (Đang làm)' },
        { label: 'Future', word: 'and will deploy tomorrow', color: 'sky', explanation: 'Tương lai đơn (Dự định)' }
      ],
      fullSentence: 'Yesterday I fixed the bug and have already pushed the code; currently I am working on UI and will deploy tomorrow.',
      translation: 'Hôm qua tôi đã sửa lỗi và đã đẩy mã lên; hiện tại tôi đang làm giao diện và sẽ triển khai vào ngày mai.',
    },
    tenseVariants: [
      {
        tenseName: 'Past Perfect for Sequence of Past Events',
        formula: 'S + had + V3/ed + before + S + V2/ed',
        sentence: 'The incident response team had mitigated the DDoS attack before customers noticed any downtime.',
        translation: 'Đội ứng phó sự cố đã ngăn chặn xong cuộc tấn công DDoS trước khi khách hàng nhận thấy bất kỳ sự gián đoạn nào.',
        usageContext: 'Hành động xảy ra và hoàn tất trước một hành động khác trong quá khứ.',
      },
      {
        tenseName: 'Past Perfect Continuous for Past Duration',
        formula: 'S + had been + V-ing + before + Past event',
        sentence: 'We had been profiling the server for five hours before we finally isolated the memory leak.',
        translation: 'Chúng tôi đã phân tích hiệu năng máy chủ suốt 5 tiếng trước khi cuối cùng cô lập được lỗi rò rỉ bộ nhớ.',
        usageContext: 'Nhấn mạnh tính liên tục của hành động kéo dài đến một thời điểm quá khứ.',
      },
      {
        tenseName: 'Future Continuous for In-Progress Actions',
        formula: 'S + will be + V-ing + at [specific future time]',
        sentence: 'At 10:00 AM tomorrow, our QA engineers will be executing full regression tests on staging.',
        translation: 'Lúc 10:00 sáng mai, các kỹ sư QA của chúng tôi sẽ đang thực thi toàn bộ kiểm thử hồi quy trên staging.',
        usageContext: 'Hành động sẽ đang diễn ra tại một thời điểm xác định trong tương lai.',
      },
      {
        tenseName: 'Future Perfect for Target Deadlines',
        formula: 'S + will have + V3/ed + by [deadline]',
        sentence: 'By the end of this sprint, the engineering team will have deployed the single sign-on upgrade.',
        translation: 'Trước khi kết thúc sprint này, đội ngũ kỹ thuật sẽ hoàn thành việc triển khai nâng cấp đăng nhập một lần.',
        usageContext: 'Hành động sẽ hoàn tất trước một mốc thời gian trong tương lai (By + deadline).',
      }
    ],
    commonMistakes: [
      {
        wrong: 'When I was coding, the power goes out.',
        right: 'When I was coding, the power went out.',
        explanation: 'Hành động đang xảy ra (was coding) thì hành động khác xen vào phải dùng Quá khứ đơn (went out). Không thể kết hợp Quá khứ với Hiện tại ở đây.',
      },
      {
        wrong: 'By the time you wake up, the deployment finished.',
        right: 'By the time you wake up, the deployment will have finished.',
        explanation: '"By the time + Hiện tại" yêu cầu dùng Tương lai hoàn thành ở mệnh đề chính (will have + V3).',
      }
    ],
    quickQuiz: [
      {
        question: 'By next Friday, we _____ phase 1 of the project.',
        options: ['will finish', 'will have finished', 'are finishing', 'finished'],
        correctIndex: 1,
        explanation: 'Dấu hiệu "By + thời gian tương lai" dùng thì Tương lai hoàn thành (hoàn thành trước một mốc trong tương lai).',
      },
      {
        question: 'I _____ on this feature for 3 hours before I finally found the solution.',
        options: ['worked', 'was working', 'had been working', 'have worked'],
        correctIndex: 2,
        explanation: 'Hành động kéo dài liên tục trước một thời điểm trong quá khứ ("before I found...") dùng Quá khứ hoàn thành tiếp diễn.',
      },
      {
        question: 'Select the Future Perfect tense expressing completion before a future deadline:',
        options: ['By the end of this sprint, the team will have migrated all user accounts to Cognito.', 'By the end of this sprint, the team will migrate all user accounts.', 'The team is migrating user accounts right now.', 'The team had migrated user accounts before lunch.'],
        correctIndex: 0,
        explanation: 'Cấu trúc "By + mốc tương lai, S + will have + V3/ed" (Tương lai hoàn thành) chỉ hành động sẽ hoàn tất trước thời điểm đó.',
      },
      {
        question: 'Past Perfect vs Past Simple: "The server crashed because someone _____ a heavy script directly on the database."',
        options: ['had executed', 'has executed', 'executes', 'was executed'],
        correctIndex: 0,
        explanation: 'Hành động chạy script xảy ra trước hành động máy chủ bị sập (crashed), do đó hành động xảy ra trước phải chia ở Quá khứ hoàn thành ("had executed").',
      },
      {
        question: 'Future Continuous: "At 3:00 PM tomorrow, our DevOps engineers _____ live failover drills."',
        options: ['will be conducting', 'will conduct', 'conducted', 'have conducted'],
        correctIndex: 0,
        explanation: 'Tại một thời điểm cụ thể trong tương lai ("At 3:00 PM tomorrow"), hành động sẽ đang diễn ra, dùng thì Tương lai tiếp diễn ("will be conducting").',
      },
      {
        question: 'Which sentence shows an ongoing duration up to a point in the past (Past Perfect Continuous)?',
        options: ['We had been debugging for five hours before we finally located the memory leak.', 'We debugged for five hours and found the leak.', 'We have been debugging for five hours.', 'We were debugging when the power went off.'],
        correctIndex: 0,
        explanation: '"had been + V-ing" nhấn mạnh khoảng thời gian kéo dài liên tục trước một sự kiện trong quá khứ.',
      },
      {
        question: 'Choose the correct combination: "When I arrived at the office, the morning standup _____ already _____."',
        options: ['had / started', 'has / started', 'did / start', 'was / starting'],
        correctIndex: 0,
        explanation: 'Hành động cuộc họp bắt đầu trước khi tôi đến văn phòng: Quá khứ hoàn thành ("had already started").',
      }
    ],
    realLifeDialogue: [
      { speaker: 'Scrum Master', avatar: '🧔', text: 'Can you give your update?', translation: 'Bạn có thể báo cáo tiến độ không?' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'Yesterday, I was investigating the login bug. I have found the root cause.', translation: 'Hôm qua, tôi đang điều tra lỗi đăng nhập. Tôi đã tìm ra nguyên nhân gốc rễ.' },
      { speaker: 'Dev', avatar: '🧑‍💻', text: 'Right now, I am writing the fix. I will have it deployed by noon.', translation: 'Ngay lúc này, tôi đang viết code sửa lỗi. Tôi sẽ triển khai xong trước buổi trưa.' }
    ]
  }
,
  {
    id: 'indirect-questions-diplomatic',
    title: 'Indirect Questions for Diplomatic Communication',
    vietnameseTitle: 'Câu Hỏi Gián Tiếp: Ngoại Giao Lịch Thiệp Với Sếp & Khách Hàng',
    level: 'Intermediate',
    summary: 'Người bản xứ hiếm khi hỏi cụt lủn "Where is the API doc?" hay "When will you finish?". Họ dùng câu hỏi gián tiếp "Could you tell me where..." để thể hiện sự tôn trọng tối đa.',
    icon: '🤝',
    legoExample: {
      blocks: [
        { label: 'Polite Opener', word: 'Could you please tell me', color: 'indigo', explanation: 'Lời mở đầu lịch thiệp' },
        { label: 'Question Word', word: 'where', color: 'emerald', explanation: 'Từ để hỏi' },
        { label: 'Subject', word: 'the staging credentials', color: 'amber', explanation: 'Chủ ngữ (không đảo trợ động từ)' },
        { label: 'Verb', word: 'are located?', color: 'rose', explanation: 'Động từ giữ nguyên trật tự khẳng định' },
      ],
      fullSentence: 'Could you please tell me where the staging credentials are located?',
      translation: 'Bạn có thể vui lòng cho tôi biết thông tin đăng nhập staging được lưu ở đâu không?',
    },
    tenseVariants: [
      {
        tenseName: 'Could you let me know + Wh-',
        formula: 'Could you let me know + [Wh-word] + S + V?',
        sentence: 'Could you let me know when the design review will begin?',
        translation: 'Bạn có thể cho tôi biết khi nào buổi đánh giá thiết kế sẽ bắt đầu không?',
        usageContext: 'Hỏi lịch trình cuộc họp hoặc hạn chót công việc.',
      },
      {
        tenseName: 'I was wondering if...',
        formula: 'I was wondering if + S + V...',
        sentence: 'I was wondering if we could reschedule our sync to 3 PM.',
        translation: 'Tôi đang tự hỏi liệu chúng ta có thể đổi lịch họp sang 3 giờ chiều được không.',
        usageContext: 'Xin phép hoặc đề xuất thay đổi kế hoạch cực kỳ nhã nhặn.',
      },
      {
        tenseName: 'Do you happen to know...',
        formula: 'Do you happen to know if/whether + S + V?',
        sentence: 'Do you happen to know if the client approved the revised budget?',
        translation: 'Bạn có tình cờ biết liệu khách hàng đã phê duyệt ngân sách điều chỉnh chưa?',
        usageContext: 'Hỏi dò thông tin một cách tự nhiên không gây áp lực.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'Could you tell me where is the server?',
        right: 'Could you tell me where the server is?',
        explanation: 'Trong câu hỏi gián tiếp, trật tự từ phải quay về dạng khẳng định (S + V: the server is), không được đảo "is the server".',
      },
      {
        wrong: 'Do you know what time does the meeting start?',
        right: 'Do you know what time the meeting starts?',
        explanation: 'Bỏ trợ động từ "does" và chia động từ "starts" theo ngôi thứ 3 số ít.',
      },
    ],
    quickQuiz: [
      {
        question: 'Câu hỏi gián tiếp nào sau đây đúng ngữ pháp và lịch thiệp nhất?',
        options: ['Can you tell me where does he live?', 'Could you please let me know what time the deployment starts?', 'Where is the deployment starting, tell me?', 'Do you know when will they finish?'],
        correctIndex: 1,
        explanation: 'Could you please let me know what time the deployment starts là chuẩn xác vì giữ nguyên trật tự khẳng định S + V (the deployment starts).',
      },
      {
        question: 'Which indirect question is the MOST natural and diplomatic for asking a colleague about a PR?',
        options: ['Do you know when you might have time to review my pull request?', 'When you review my pull request?', 'Do you know when will you review my pull request?', 'Tell me when you review my PR.'],
        correctIndex: 0,
        explanation: 'Câu hỏi gián tiếp giữ nguyên trật tự khẳng định (S + V) và dùng các từ làm mềm như "might have time" để tạo ngữ điệu lịch sự.',
      },
      {
        question: 'Convert to indirect: "Where is the API documentation hosted?" -> "Could you tell me _____?"',
        options: ['where the API documentation is hosted', 'where is the API documentation hosted', 'where does the API documentation host', 'where hosted the API documentation'],
        correctIndex: 0,
        explanation: 'Sau "Could you tell me...", trật tự từ là Wh-word + Subject + Verb: "where the API documentation is hosted".',
      },
      {
        question: 'Complete: "I was wondering _____ you could help me troubleshoot this network timeout."',
        options: ['whether', 'that', 'what', 'which'],
        correctIndex: 0,
        explanation: '"I was wondering if/whether..." là mẫu câu kinh điển để nhờ vả đồng nghiệp một cách tế nhị.',
      },
      {
        question: 'Which introductory phrase is NOT suitable for indirect questions?',
        options: ['I would like to know...', 'Could you please clarify...', 'Answer me immediately...', 'Do you happen to know...'],
        correctIndex: 2,
        explanation: '"Answer me immediately" mang tính mệnh lệnh gay gắt, không phải là cấu trúc gián tiếp ngoại giao.',
      },
      {
        question: 'Choose the correct indirect question structure for Yes/No inquiry:',
        options: ['Do you know if the staging deployment succeeded?', 'Do you know did the staging deployment succeed?', 'Do you know succeeded the staging deployment?', 'Do you know whether did the staging deployment succeed?'],
        correctIndex: 0,
        explanation: 'Câu hỏi Yes/No chuyển thành gián tiếp dùng "if / whether + S + V" (không dùng trợ động từ did/do/does).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Junior Developer',
        avatar: '👨‍💻',
        text: 'Excuse me Alex, I was wondering if you have five minutes to look at this database index.',
        translation: 'Xin lỗi anh Alex, em đang tự hỏi liệu anh có 5 phút để xem qua chỉ mục cơ sở dữ liệu này không ạ.',
      },
      {
        speaker: 'Tech Lead Alex',
        avatar: '👨‍💼',
        text: 'Sure Nam! Let me grab my coffee and I will sit with you.',
        translation: 'Được chứ Nam! Để anh lấy cốc cà phê rồi qua ngồi cùng em ngay.',
      },
    ],
  },
  {
    id: 'past-simple-vs-past-continuous',
    title: 'Past Simple vs. Past Continuous for Incident Stories',
    vietnameseTitle: 'Quá Khứ Đơn vs Quá Khứ Tiếp Diễn: Kể Lại Sự Cố & Tình Huống Gián Đoạn',
    level: 'Beginner',
    summary: 'Khi giải thích sự cố (Post-mortem) hoặc kể lại một trải nghiệm du lịch, bạn cần kết hợp hành động đang diễn ra trong quá khứ (was/were V-ing) thì bị một hành động khác xen vào (V2/ed).',
    icon: '⚡',
    legoExample: {
      blocks: [
        { label: 'Interrupted Action', word: 'We were migrating', color: 'indigo', explanation: 'Hành động đang diễn ra (Past Continuous)' },
        { label: 'Object', word: 'the user database', color: 'emerald', explanation: 'Tân ngữ' },
        { label: 'Connecting Word', word: 'when', color: 'amber', explanation: 'Liên từ chỉ sự xen vào' },
        { label: 'Interrupting Event', word: 'the network dropped.', color: 'rose', explanation: 'Sự việc đột ngột cắt ngang (Past Simple)' },
      ],
      fullSentence: 'We were migrating the user database when the network connection dropped.',
      translation: 'Chúng tôi đang chuyển đổi cơ sở dữ liệu người dùng thì kết nối mạng đột ngột bị rớt.',
    },
    tenseVariants: [
      {
        tenseName: 'Past Continuous (Background)',
        formula: 'S + was/were + V-ing',
        sentence: 'The engineers were investigating the latency spike all night.',
        translation: 'Các kỹ sư đã điều tra sự tăng vọt độ trễ suốt cả đêm.',
        usageContext: 'Hành động kéo dài liên tục trong một khoảng thời gian quá khứ.',
      },
      {
        tenseName: 'Past Simple (Sudden Event)',
        formula: 'S + V2/ed',
        sentence: 'Suddenly, the monitoring alert triggered.',
        translation: 'Đột nhiên, chuông cảnh báo giám sát hệ thống đã kích hoạt.',
        usageContext: 'Hành động xảy ra dứt khoát tại một thời điểm xác định.',
      },
      {
        tenseName: 'While + Past Continuous',
        formula: 'While + S + was/were + V-ing, S + V2/ed',
        sentence: 'While I was boarding the plane, my phone rang.',
        translation: 'Trong lúc tôi đang lên máy bay thì điện thoại reo.',
        usageContext: 'Dùng "While" để mở đầu cho hành động đang diễn ra nền tảng.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'When I code yesterday, the electricity was going out.',
        right: 'While I was coding yesterday, the electricity went out.',
        explanation: 'Hành động đang diễn ra dùng "was coding", hành động mất điện bất ngờ cắt ngang dùng "went out".',
      },
      {
        wrong: 'At 8 AM yesterday, I had breakfast.',
        right: 'At 8 AM yesterday, I was having breakfast.',
        explanation: 'Tại một thời điểm chính xác trong quá khứ (At 8 AM yesterday), phải dùng thì Quá khứ tiếp diễn để chỉ hành động đang diễn ra.',
      }
    ],
    quickQuiz: [
      {
        question: 'Chọn câu diễn đạt đúng tình huống sự cố xen vào trong quá khứ:',
        options: ['The server crashed while we were running the benchmark test.', 'The server was crashing while we ran the test.', 'The server crashed when we was running test.', 'While the server crashed, we ran test.'],
        correctIndex: 0,
        explanation: 'Hành động ngắn cắt ngang (crashed) dùng Quá khứ đơn, hành động đang diễn ra nền tảng (were running) dùng Quá khứ tiếp diễn sau while.',
      },
      {
        question: 'Interrupted action in past: "While our DevOps engineer _____ the live cluster, the power suddenly _____ out."',
        options: ['was upgrading / went', 'upgraded / was going', 'is upgrading / goes', 'was upgraded / had gone'],
        correctIndex: 0,
        explanation: 'Hành động đang diễn ra trong quá khứ dùng Quá khứ tiếp diễn ("was upgrading"), hành động ngắn chen ngang vào dùng Quá khứ đơn ("went").',
      },
      {
        question: 'Parallel actions in past: "While the data team _____ the models, the backend team _____ the API endpoints."',
        options: ['was training / was building', 'trained / built', 'has trained / built', 'were trained / were built'],
        correctIndex: 0,
        explanation: 'Hai hành động song song cùng diễn ra đồng thời trong quá khứ được nối bằng "while" đều chia ở Quá khứ tiếp diễn.',
      },
      {
        question: 'Choose the correct sentence:',
        options: ['At 10:00 AM yesterday, the team was demoing the mobile prototype to the client.', 'At 10:00 AM yesterday, the team has demoed the mobile prototype.', 'At 10:00 AM yesterday, the team was demo the mobile prototype.', 'At 10:00 AM yesterday, the team demos the mobile prototype.'],
        correctIndex: 0,
        explanation: 'Tại một thời điểm xác định trong quá khứ ("At 10:00 AM yesterday"), hành động đang diễn ra nên dùng Quá khứ tiếp diễn.',
      },
      {
        question: 'Fill in: "When the notification alert _____, everyone stopped what they were doing."',
        options: ['sounded', 'was sounding', 'sounds', 'had been sounding'],
        correctIndex: 0,
        explanation: 'Âm thanh thông báo phát lên là một hành động dứt điểm chớp nhoáng (Quá khứ đơn: sounded).',
      },
      {
        question: 'Which word is usually followed by the Past Continuous?',
        options: ['While', 'Suddenly', 'Yesterday', 'Ago'],
        correctIndex: 0,
        explanation: '"While" (trong khi) thường đứng trước một mệnh đề ở thì tiếp diễn (Past Continuous).',
      },
      {
        question: 'Interrupted action in past: "While our DevOps engineer _____ the live cluster, the power suddenly _____ out."',
        options: ['was upgrading / went', 'upgraded / was going', 'is upgrading / goes', 'was upgraded / had gone'],
        correctIndex: 0,
        explanation: 'Hành động đang diễn ra trong quá khứ dùng Quá khứ tiếp diễn ("was upgrading"), hành động ngắn chen ngang vào dùng Quá khứ đơn ("went").',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'DevOps Engineer',
        avatar: '👩‍💻',
        text: 'What were you doing when the primary cluster failed?',
        translation: 'Bạn đang làm gì khi cụm máy chủ chính bị lỗi?',
      },
      {
        speaker: 'Backend Lead',
        avatar: '👨‍💻',
        text: 'We were applying the security patch when the power outage hit the data center.',
        translation: 'Chúng tôi đang áp dụng bản vá bảo mật thì sự cố mất điện ập vào trung tâm dữ liệu.',
      },
    ],
  },
  {
    id: 'gerund-vs-infinitive-workplace',
    title: 'Gerunds (V-ing) vs. Infinitives (To V) in Workplace English',
    vietnameseTitle: 'Danh Động Từ (V-ing) vs Động Từ Nguyên Mẫu (To V): Tránh Lỗi Ngớ Ngẩn',
    level: 'Intermediate',
    summary: 'Nhiều người Việt hay nói "I suggest to go" hay "I look forward to see you". Đó là lỗi sai phổ biến! Bài học này giúp bạn nắm vững động từ nào đi với V-ing, động từ nào đi với To V.',
    icon: '🎯',
    legoExample: {
      blocks: [
        { label: 'Subject + Verb', word: 'I look forward to', color: 'indigo', explanation: 'Cụm động từ cố định đi với V-ing' },
        { label: 'Gerund (V-ing)', word: 'collaborating', color: 'emerald', explanation: 'Danh động từ' },
        { label: 'Partner', word: 'with your team', color: 'amber', explanation: 'Đối tượng hợp tác' },
        { label: 'Time Buffer', word: 'on this upcoming project.', color: 'rose', explanation: 'Thời gian / dự án' },
      ],
      fullSentence: 'I look forward to collaborating with your team on this upcoming project.',
      translation: 'Tôi rất mong đợi được hợp tác cùng đội ngũ của bạn trong dự án sắp tới.',
    },
    tenseVariants: [
      {
        tenseName: 'Verbs + Gerund (V-ing)',
        formula: 'recommend / suggest / consider / avoid + V-ing',
        sentence: 'I highly recommend using TypeScript to prevent runtime type errors.',
        translation: 'Tôi đặc biệt khuyên nên dùng TypeScript để ngăn ngừa lỗi kiểu dữ liệu lúc chạy.',
        usageContext: 'Các động từ khuyên nhủ, đề xuất, cân nhắc luôn đi cùng V-ing.',
      },
      {
        tenseName: 'Verbs + Infinitive (To V)',
        formula: 'decide / agree / plan / manage / refuse + To V',
        sentence: 'We managed to deploy the hotfix before peak traffic hours.',
        translation: 'Chúng tôi đã xoay sở triển khai được bản vá nóng trước giờ cao điểm truy cập.',
        usageContext: 'Các động từ chỉ kế hoạch, quyết định, nỗ lực đạt được.',
      },
      {
        tenseName: 'Verbs with Meaning Shift (Remember / Stop / Forget)',
        formula: 'Remember to V (future duty) vs Remember V-ing (past memory)',
        sentence: 'Remember to commit your changes with clean messages; I still remember fixing that race condition last sprint.',
        translation: 'Hãy nhớ commit thay đổi của bạn với tin nhắn rõ ràng; tôi vẫn nhớ việc sửa lỗi race condition ở sprint trước.',
        usageContext: 'Động từ đổi nghĩa hoàn toàn khi đi với To V hoặc V-ing.',
      },
      {
        tenseName: 'Preposition + Gerund Rule',
        formula: 'Preposition (in, on, for, about, without) + V-ing',
        sentence: 'Thank you for reviewing the pull request so thoroughly without delaying the release.',
        translation: 'Cảm ơn bạn vì đã xem xét pull request một cách kỹ lưỡng mà không làm chậm trễ bản phát hành.',
        usageContext: 'Sau mọi giới từ bắt buộc động từ phải ở dạng V-ing.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I recommend you to restart the container.',
        right: 'I recommend restarting the container. (hoặc: I recommend that you restart...)',
        explanation: '"Recommend" không đi với "sb to do sth". Phải dùng "recommend + V-ing" hoặc "recommend that + S + V".',
      },
      {
        wrong: 'I am looking forward to hear from you.',
        right: 'I am looking forward to hearing from you.',
        explanation: 'Trong cụm "look forward to", từ "to" là giới từ, do đó động từ theo sau bắt buộc phải ở dạng V-ing.',
      },
    ],
    quickQuiz: [
      {
        question: 'Chọn câu đúng chuẩn tiếng Anh giao tiếp công sở:',
        options: ['We decided to upgrade the database yesterday.', 'We decided upgrading the database yesterday.', 'We decided upgrade the database.', 'We decided for upgrade.'],
        correctIndex: 0,
        explanation: 'Sau động từ "decide" luôn đi với động từ nguyên mẫu có to ("decided to upgrade").',
      },
      {
        question: 'Complete: "The team agreed _____ the release date to ensure complete automated test coverage."',
        options: ['to postpone', 'postponing', 'postpone', 'postponed'],
        correctIndex: 0,
        explanation: 'Động từ "agree" luôn đi với "to V": "agree to postpone".',
      },
      {
        question: 'Meaning change: "Remember to back up the database" vs "I remember backing up the database":',
        options: ['Remember to back up" is a reminder for a future action; "remember backing up" is a memory of a past event.', 'Both sentences have the identical meaning.', 'Remember backing up" is grammatically incorrect.', 'Remember to back up" refers to past events only.'],
        correctIndex: 0,
        explanation: 'Remember + to V: Nhớ phải làm gì (tương lai/nhiệm vụ); Remember + V-ing: Nhớ lại một trải nghiệm trong quá khứ.',
      },
      {
        question: 'Select the correct form after a preposition: "Thank you for _____ such clear documentation for our open-source repo."',
        options: ['providing', 'to provide', 'provide', 'provided'],
        correctIndex: 0,
        explanation: 'Sau tất cả các giới từ (for, in, on, about, without...), động từ bắt buộc phải ở dạng V-ing: "for providing".',
      },
      {
        question: 'Fill in: "Our product manager suggested _____ a user survey before redesigning the checkout funnel."',
        options: ['conducting', 'to conduct', 'conduct', 'conducted'],
        correctIndex: 0,
        explanation: 'Sau động từ "suggest" đi trực tiếp với danh động từ: "suggest conducting".',
      },
      {
        question: 'Which verb is followed ONLY by a Gerund (V-ing)?',
        options: ['avoid', 'decide', 'agree', 'hope'],
        correctIndex: 0,
        explanation: 'Sau "avoid" (tránh) luôn luôn là V-ing (e.g. "We must avoid hardcoding API secrets"). Các từ decide, agree, hope đi với "to V".',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Product Owner',
        avatar: '👩‍💼',
        text: 'Do you mind reviewing the requirements specification before tomorrow morning?',
        translation: 'Bạn có phiền xem qua tài liệu đặc tả yêu cầu trước sáng mai không?',
      },
      {
        speaker: 'QA Lead',
        avatar: '👨‍💻',
        text: 'Not at all! I will finish reviewing it tonight.',
        translation: 'Không phiền chút nào ạ! Tôi sẽ hoàn tất việc xem lại nó trong tối nay.',
      },
    ],
  },
  {
    id: 'prepositions-time-place',
    title: 'Prepositions: In, On, At Master Overview',
    vietnameseTitle: 'Giới Từ In, On, At: Bức Tranh Tổng Thể Kim Tự Tháp Thời Gian & Không Gian',
    level: 'Beginner',
    category: 'prepositions',
    summary: 'Bản đồ tư duy toàn diện của 3 giới từ vàng IN - ON - AT. Nắm chắc nguyên lý hình phễu: từ không gian/thời gian rộng lớn (IN) thu hẹp dần xuống bề mặt/ngày cụ thể (ON) và hội tụ tại tọa độ/giờ giấc chính xác nhất (AT).',
    icon: '🔺',
    legoExample: {
      formulaPattern: '[Event] + [Action] + [At + Time] + [On + Day] + [In + Room/City]',
      blocks: [
        { label: 'Event (Subject)', word: 'The quarterly tech demo', color: 'indigo', explanation: 'Chủ thể sự kiện', roleHint: 'Chủ ngữ sự kiện' },
        { label: 'Action (Verb)', word: 'will take place', color: 'emerald', explanation: 'Sẽ diễn ra', roleHint: 'Cụm động từ chỉ thời điểm' },
        { label: 'Prep: AT (Time)', word: 'at 2:30 PM', color: 'amber', explanation: 'Giờ chuẩn xác dùng AT', roleHint: 'AT cho giờ phút' },
        { label: 'Prep: ON (Day)', word: 'on Friday', color: 'rose', explanation: 'Thứ trong tuần dùng ON', roleHint: 'ON cho ngày thứ' },
        { label: 'Prep: IN (Room)', word: 'in Room 302.', color: 'sky', explanation: 'Không gian phòng ốc dùng IN', roleHint: 'IN cho không gian khép kín' },
      ],
      fullSentence: 'The quarterly tech demo will take place at 2:30 PM on Friday in Room 302.',
      translation: 'Buổi demo kỹ thuật quý sẽ diễn ra lúc 2:30 chiều vào thứ Sáu tại Phòng 302.',
    },
    detailedGuide: {
      coreRule: 'Kim Tự Tháp Đôi (Double In-On-At Pyramid): Cả Thời Gian (Time) và Không Gian (Space) đều tuân theo cùng một nguyên lý phễu: Tầng 1 IN (Rộng nhất: Thế kỷ, năm, mùa, quốc gia, thành phố, không gian 3D); Tầng 2 ON (Hẹp hơn: Ngày cụ thể, bề mặt phẳng, đường phố, màn hình thiết bị); Tầng 3 AT (Chóp nhọn: Giờ giấc bấm giây, số nhà địa chỉ, địa điểm chức năng).',
      formulaBreakdown: [
        { component: 'Tầng Đáy: IN', meaning: 'Thời gian dài & Không gian bao bọc', rule: 'in 2026, in December, in summer, in the morning; in Vietnam, in Hanoi, in the meeting room, in the database.' },
        { component: 'Tầng Giữa: ON', meaning: 'Ngày cụ thể & Bề mặt phẳng', rule: 'on Monday, on October 10th, on Christmas Day, on the weekend; on the table, on Wall Street, on the bus, on mobile, on the website.' },
        { component: 'Tầng Đỉnh: AT', meaning: 'Điểm hội tụ siêu chính xác', rule: 'at 9:00 AM, at noon, at midnight, at sunset; at 45 Le Loi Street, at the bus stop, at work, at school, at the conference.' }
      ],
      goldenTips: [
        '💡 Ghi nhớ bằng ngón tay: Ngón cái (To nhất = IN: tháng, năm, đất nước) -> Ngón trỏ (Vừa vừa = ON: ngày, đường phố) -> Đầu ngón út (Chấm nhỏ = AT: giờ phút, số nhà).',
        '💡 Thiết bị điện tử & Màn hình: Luôn dùng ON: on Facebook, on GitHub, on YouTube, on my screen, on the laptop.',
        '💡 Thời gian có chữ "Day" là auto ON: on Tuesday, on Independence Day, on Christmas Day.'
      ]
    },
    tenseVariants: [
      {
        tenseName: 'Prepositions of Time',
        formula: 'at [time] / on [day/date] / in [month/year/part of day]',
        sentence: 'The project kicks off on Monday at 9:00 AM in November.',
        translation: 'Dự án sẽ khởi động vào thứ Hai lúc 9:00 sáng trong tháng Mười Một.',
        usageContext: 'Quy tắc 3 bậc: At (giờ), On (ngày), In (tháng/năm).',
      },
      {
        tenseName: 'Tech & Digital Prepositions',
        formula: 'on [platform/website/device] / in [database/app/code]',
        sentence: 'I found an edge case on the iOS app, specifically in the payment module.',
        translation: 'Tôi phát hiện một lỗi góc trên ứng dụng iOS, cụ thể là trong mô-đun thanh toán.',
        usageContext: 'Thiết bị/nền tảng dùng ON (on mobile, on desktop, on web), bên trong code/data dùng IN (in the code, in the database).',
      },
      {
        tenseName: 'Prepositions of Duration & Deadlines (By, Until, For, During)',
        formula: 'by [deadline] / until [endpoint] / during [event] / for [duration]',
        sentence: 'We must merge the pull request by 4:00 PM, because the server will run until midnight during the load test.',
        translation: 'Chúng ta phải merge pull request trước 4:00 chiều, vì máy chủ sẽ chạy liên tục tới nửa đêm trong suốt bài kiểm thử tải.',
        usageContext: 'Hạn chót dứt điểm dùng BY, duy trì liên tục dùng UNTIL, trong một sự kiện danh từ dùng DURING.',
      },
      {
        tenseName: 'Prepositions of Movement (Through, Across, Into, Onto)',
        formula: 'pass through [gateway] / navigate across [platforms] / insert into [database]',
        sentence: 'The incoming traffic passes through the API gateway and is routed into the caching cluster.',
        translation: 'Lưu lượng truy cập đi xuyên qua cổng API gateway và được định hướng vào bên trong cụm bộ nhớ đệm.',
        usageContext: 'Chuyển động không gian vật lý và dòng chảy dữ liệu kỹ thuật số.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'The meeting is in Monday at the morning.',
        right: 'The meeting is on Monday in the morning.',
        explanation: 'Thứ trong tuần dùng "on Monday", buổi trong ngày dùng "in the morning".',
      },
      {
        wrong: 'I saw the bug in the screen.',
        right: 'I saw the bug on the screen.',
        explanation: 'Màn hình hiển thị bề mặt luôn dùng "on the screen / on the page".',
      },
    ],
    quickQuiz: [
      {
        question: 'Điền giới từ đúng: "The sprint review starts _____ 3:00 PM _____ Thursday."',
        options: ['at / on', 'in / at', 'on / at', 'at / in'],
        correctIndex: 0,
        explanation: 'Giờ chính xác dùng "at 3:00 PM", thứ trong tuần dùng "on Thursday".',
      },
      {
        question: 'Fill in: "The microservice is hosted _____ AWS, but the source code repository is located _____ GitHub."',
        options: ['on / on', 'in / on', 'at / in', 'on / at'],
        correctIndex: 0,
        explanation: 'Cả dịch vụ đám mây (AWS) và nền tảng quản lý mã nguồn (GitHub) đều là nền tảng trực tuyến dùng "on".',
      },
      {
        question: 'Which phrase is INCORRECT?',
        options: ['in the afternoon', 'at night', 'on last Friday', 'at the airport'],
        correctIndex: 2,
        explanation: 'Trước "last, next, every, this" KHÔNG được dùng giới từ. Viết "on last Friday" là sai, phải bỏ "on" -> "last Friday".',
      },
      {
        question: 'Complete: "The client team will arrive _____ Vietnam _____ November 15th."',
        options: ['in / on', 'at / in', 'to / at', 'in / at'],
        correctIndex: 0,
        explanation: 'Đến một quốc gia dùng "in Vietnam", ngày tháng cụ thể dùng "on November 15th".',
      },
      {
        question: 'Select the correct option: "I found an interesting article _____ machine learning _____ the new tech magazine."',
        options: ['on / in', 'about / on', 'in / at', 'for / on'],
        correctIndex: 0,
        explanation: 'Bài báo về chủ đề gì dùng "on/about", nằm bên trong một tạp chí/sách dùng "in".',
      },
      {
        question: 'Fill in: "She has been sitting _____ her desk _____ the office all morning."',
        options: ['at / in', 'on / at', 'in / on', 'at / on'],
        correctIndex: 0,
        explanation: 'Ngồi tại bàn làm việc dùng "at her desk", bên trong văn phòng dùng "in the office".',
      },
      {
        question: 'Choose the sentence with correct prepositions:',
        options: ['The workshop begins at 9:00 AM on Monday in Room 4.', 'The workshop begins in 9:00 AM at Monday on Room 4.', 'The workshop begins on 9:00 AM in Monday at Room 4.', 'The workshop begins at 9:00 AM in Monday on Room 4.'],
        correctIndex: 0,
        explanation: 'Giờ (at), ngày thứ (on), phòng kín (in) - chuẩn xác 100% theo kim tự tháp giới từ.',
      },
      {
        question: 'Choose the correct prepositions: "Our company hackathon starts _____ Friday morning _____ 8:30 AM _____ the auditorium."',
        options: ['on / at / in', 'in / on / at', 'at / on / in', 'on / in / at'],
        correctIndex: 0,
        explanation: 'Thứ trong tuần dùng "on Friday morning", giờ chính xác dùng "at 8:30 AM", phòng lớn/hội trường dùng "in the auditorium".',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Scrum Master',
        avatar: '👩‍💼',
        text: 'When is our retrospective scheduled?',
        translation: 'Buổi họp cải tiến của chúng ta được lên lịch vào lúc nào thế?',
      },
      {
        speaker: 'Developer',
        avatar: '👨‍💻',
        text: 'It is on Friday at 4 PM in the main conference room.',
        translation: 'Nó diễn ra vào thứ Sáu lúc 4 giờ chiều tại phòng hội nghị chính.',
      },
    ],
  },
  {
    id: 'prepositions-time-in-on-at',
    title: 'Prepositions of Time: In, On, At Master Pyramid',
    vietnameseTitle: 'Giới Từ Thời Gian: Kim Tự Tháp In - On - At Từ Tổng Quát Đến Chi Tiết',
    level: 'Beginner',
    category: 'prepositions',
    summary: 'Nắm vững tuyệt chiêu Kim Tự Tháp 3 tầng: IN cho khoảng thời gian rộng lớn (năm, tháng, mùa), ON cho các ngày cụ thể và dịp lễ có chữ "Day", AT cho mốc thời gian chính xác từng phút, ban đêm và dịp lễ.',
    icon: '⏳',
    legoExample: {
      formulaPattern: '[Subject] + [Verb Phrase] + [In + Month/Year] + [On + Day] + [At + Exact Time]',
      blocks: [
        { label: 'Subject', word: 'The team', color: 'indigo', explanation: 'Chủ thể thực hiện', roleHint: 'Chủ ngữ câu' },
        { label: 'Will deploy', word: 'will release the update', color: 'emerald', explanation: 'Hành động tương lai', roleHint: 'Cụm động từ chính' },
        { label: 'Prep: IN (Month)', word: 'in November', color: 'amber', explanation: 'Khoảng thời gian rộng (Tháng)', roleHint: 'Giới từ IN cho tháng/năm' },
        { label: 'Prep: ON (Day)', word: 'on Monday', color: 'rose', explanation: 'Ngày cụ thể trong tuần', roleHint: 'Giới từ ON cho ngày/thứ' },
        { label: 'Prep: AT (Time)', word: 'at 9:00 AM sharp.', color: 'sky', explanation: 'Mốc giờ chính xác', roleHint: 'Giới từ AT cho giờ giấc' },
      ],
      fullSentence: 'The team will release the update in November on Monday at 9:00 AM sharp.',
      translation: 'Nhóm sẽ phát hành bản cập nhật vào tháng Mười Một, đúng vào thứ Hai lúc 9:00 sáng chuẩn xác.',
    },
    detailedGuide: {
      coreRule: 'Kim Tự Tháp Thời Gian (Time Pyramid): Đi từ RỘNG NHẤT (IN) -> CỤ THỂ HƠN (ON) -> CHÍNH XÁC NHẤT (AT). Bất kỳ khoảng thời gian nào kéo dài nhiều tuần/tháng/năm dùng IN. Ngày cụ thể có 24h dùng ON. Thời điểm bấm được đồng hồ dùng AT.',
      formulaBreakdown: [
        { component: 'IN + Big Time', meaning: 'Khoảng thời gian lớn', rule: 'Thế kỷ (in the 21st century), Thập kỷ (in the 90s), Năm (in 2026), Mùa (in summer), Tháng (in July), Buổi trong ngày (in the morning/afternoon/evening).' },
        { component: 'ON + Specific Day/Date', meaning: 'Ngày cụ thể 24h', rule: 'Thứ trong tuần (on Tuesday), Ngày tháng (on May 15th), Ngày lễ có chữ "Day" (on Christmas Day, on New Year\'s Day), Cuối tuần US (on the weekend).' },
        { component: 'AT + Precise Moment', meaning: 'Thời điểm kim đồng hồ chỉ', rule: 'Giờ chính xác (at 8:30 AM), Thời điểm đặc thù (at noon, at midnight, at lunchtime, at sunset), Ban đêm (at night), Dịp lễ KHÔNG có chữ "Day" (at Christmas, at Easter).' },
      ],
      goldenTips: [
        '💡 Thần chú chữ "Day": Cứ thấy chữ "Day" xuất hiện (Monday, Birthday, Christmas Day, Valentine\'s Day...) là 100% dùng ON!',
        '💡 In time vs On time: "On time" là đúng giờ theo lịch (punctual: The train arrived on time); "In time" là kịp giờ trước khi quá muộn (We arrived in time to catch the flight).',
        '💡 At night vs In the night: "At night" là nói chung về ban đêm (I sleep at night); "In the night" là một khoảnh khắc/sự việc cụ thể xảy ra trong một đêm (I woke up in the night).',
        '💡 KHÔNG dùng In/On/At trước: last, next, every, this (Ví dụ: I saw him last week - KHÔNG nói in last week; see you next Monday - KHÔNG nói on next Monday).'
      ],
      usageTable: [
        { category: 'IN (Rộng)', prepositions: 'in 2026, in December, in the morning, in 2 weeks', examples: 'We launched the product in 2024.', note: 'Chỉ cả khoảng thời gian tương lai: in two weeks (sau 2 tuần nữa).' },
        { category: 'ON (Cụ thể)', prepositions: 'on Friday, on Oct 10th, on my birthday, on weekends', examples: 'The sprint review is on Friday.', note: 'Anh - Mỹ dùng on the weekend; Anh - Anh dùng at the weekend.' },
        { category: 'AT (Chính xác)', prepositions: 'at 10:15 AM, at noon, at midnight, at sunrise', examples: 'The server restarts at midnight.', note: 'Luôn dùng AT cho các thời khắc chớp nhoáng hoặc giờ cố định.' }
      ]
    },
    tenseVariants: [
      {
        tenseName: 'Future Deadline (In + Period)',
        formula: 'S + will + V + in [duration]',
        sentence: 'The new feature will be ready in three days.',
        translation: 'Tính năng mới sẽ sẵn sàng sau 3 ngày nữa.',
        usageContext: 'Dùng "in" với nghĩa "sau bao lâu nữa" trong tương lai.',
      },
      {
        tenseName: 'Past Punctuality (On Time vs In Time)',
        formula: 'S + arrived + on time / in time for + N',
        sentence: 'Despite the heavy rain, everyone arrived on time for the client demo.',
        translation: 'Dù trời mưa to, mọi người đều đến đúng giờ cho buổi demo với khách hàng.',
        usageContext: 'On time: đúng chuẩn giờ theo lịch trình quy định.',
      },
      {
        tenseName: 'Recurring Schedule (On + Days)',
        formula: 'S + V(s/es) + on [Plural Days]',
        sentence: 'Our team conducts backlog refinement on Wednesdays at 2:00 PM.',
        translation: 'Nhóm chúng tôi tiến hành tỉa gọn backlog vào các ngày thứ Tư lúc 2:00 chiều.',
        usageContext: 'Thêm "s" vào thứ (on Wednesdays) để chỉ thói quen lặp lại hàng tuần.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I have a standup meeting in Monday morning at 9 AM.',
        right: 'I have a standup meeting on Monday morning at 9 AM.',
        explanation: 'Khi có cả Thứ và Buổi, từ mang tính cụ thể hơn là "Monday" quyết định giới từ, do đó phải dùng "on Monday morning".',
      },
      {
        wrong: 'See you on next Friday in the office.',
        right: 'See you next Friday in the office.',
        explanation: 'Trước các từ "next, last, this, every", TUYỆT ĐỐI KHÔNG dùng giới từ In/On/At.',
      },
      {
        wrong: 'The incident happened in midnight.',
        right: 'The incident happened at midnight.',
        explanation: 'Midnight (nửa đêm) là một mốc thời gian chính xác (12:00 đêm), bắt buộc dùng "at midnight".',
      }
    ],
    quickQuiz: [
      {
        question: 'Chọn giới từ đúng: "The annual tech conference will take place _____ October 24th _____ 8:30 AM."',
        options: ['in / at', 'on / at', 'at / on', 'on / in'],
        correctIndex: 1,
        explanation: 'Ngày tháng cụ thể (October 24th) dùng "on", giờ chính xác (8:30 AM) dùng "at".',
      },
      {
        question: 'Câu nào sau đây sử dụng giới từ thời gian CHÍNH XÁC?',
        options: ['The server backup runs automatically at night.', 'We will deploy the patch on next Tuesday.', 'I graduated from university at 2022.', 'The workshop starts in 2:00 PM.'],
        correctIndex: 0,
        explanation: '"at night" là chính xác. Bỏ "on" trước "next Tuesday", dùng "in 2022" cho năm, dùng "at 2:00 PM" cho giờ.',
      },
      {
        question: 'Which holiday expression requires the preposition "ON"?',
        options: ['Christmas Day', 'Christmas', 'Easter', 'Thanksgiving (without Day)'],
        correctIndex: 0,
        explanation: 'Bất cứ dịp lễ nào có chữ "Day" đi kèm đều dùng giới từ ON (on Christmas Day, on New Year\'s Day).',
      },
      {
        question: 'Complete: "The payment gateway migration will complete _____ two hours."',
        options: ['in', 'at', 'on', 'by of'],
        correctIndex: 0,
        explanation: '"in + khoảng thời gian" diễn tả hành động sẽ hoàn thành sau bao lâu nữa trong tương lai (sau 2 tiếng nữa).',
      },
      {
        question: 'Fill in: "In American English people say _____ the weekend, but in British English they often say _____ the weekend."',
        options: ['on / at', 'at / on', 'in / on', 'on / in'],
        correctIndex: 0,
        explanation: 'Người Mỹ chuộng dùng "on the weekend", người Anh chuộng dùng "at the weekend".',
      },
      {
        question: 'Choose the correct form: "The cron job triggers automatically _____ midnight every night."',
        options: ['at', 'in', 'on', 'during'],
        correctIndex: 0,
        explanation: '"midnight" (nửa đêm 12:00) là một mốc thời gian chính xác, luôn dùng "at midnight".',
      },
      {
        question: 'Điền vào chỗ trống: "The build completed just _____ time to prevent the pipeline failure."',
        options: ['at', 'on', 'in', 'by'],
        correctIndex: 2,
        explanation: '"in time" nghĩa là vừa kịp lúc trước khi sự cố xảy ra (just in time).',
      },
      {
        question: 'Thứ Ba hàng tuần chúng tôi có họp. Ta nói: "We have an all-hands meeting _____."',
        options: ['in Tuesdays', 'at Tuesdays', 'on Tuesdays', 'for Tuesdays'],
        correctIndex: 2,
        explanation: 'Các ngày thứ trong tuần (kể cả số nhiều chỉ thói quen) luôn đi với giới từ "on".',
      },
      {
        question: 'Which holiday expression requires the preposition "ON"?',
        options: ['Christmas Day', 'Christmas', 'Easter', 'Thanksgiving (without Day)'],
        correctIndex: 0,
        explanation: 'Bất cứ dịp lễ nào có chữ "Day" đi kèm đều dùng giới từ ON (on Christmas Day, on New Year\'s Day).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Tech Lead',
        avatar: '👨‍💼',
        text: 'When is the production release scheduled for the payment gateway?',
        translation: 'Bản phát hành sản phẩm cho cổng thanh toán được lên lịch vào lúc nào thế em?',
      },
      {
        speaker: 'DevOps Engineer',
        avatar: '👩‍💻',
        text: 'It is scheduled on Thursday night at 11:30 PM, when traffic is lowest.',
        translation: 'Nó được lên lịch vào tối thứ Năm lúc 11:30 đêm, khi lượng truy cập là thấp nhất ạ.',
      },
      {
        speaker: 'Tech Lead',
        avatar: '👨‍💼',
        text: 'Great. Let us do a dry-run in the staging environment on Wednesday.',
        translation: 'Tuyệt vời. Chúng ta hãy chạy thử nghiệm trên môi trường staging vào thứ Tư nhé.',
      },
      {
        speaker: 'DevOps Engineer',
        avatar: '👩‍💻',
        text: 'Understood! I will make sure everything is ready in advance.',
        translation: 'Dạ rõ ạ! Em sẽ đảm bảo mọi thứ sẵn sàng trước thời điểm đó.',
      }
    ],
  },
  {
    id: 'prepositions-place-location',
    title: 'Prepositions of Place: In, On, At in Physical & Digital Spaces',
    vietnameseTitle: 'Giới Từ Nơi Chốn: In, On, At trong Không Gian Thực & Không Gian Số',
    level: 'Beginner',
    category: 'prepositions',
    summary: 'Quy tắc không gian đa chiều: IN (bên trong không gian khép kín 3D, thành phố, quốc gia, database), ON (trên bề mặt phẳng, màn hình thiết bị số, đường phố), AT (tại một điểm tọa độ chính xác, số nhà cụ thể, sự kiện).',
    icon: '📍',
    legoExample: {
      formulaPattern: '[Subject] + [Verb] + [In + 3D Space/DB] + [On + Device/Surface] + [At + Venue/Point]',
      blocks: [
        { label: 'Subject', word: 'Our senior engineer', color: 'indigo', explanation: 'Chủ thể', roleHint: 'Chủ ngữ' },
        { label: 'Action', word: 'is debugging the queries', color: 'emerald', explanation: 'Hành động hiện tại', roleHint: 'Vị ngữ' },
        { label: 'Prep: IN (Inside)', word: 'in the primary database', color: 'amber', explanation: 'Bên trong cơ sở dữ liệu', roleHint: 'IN cho không gian 3D/hệ thống' },
        { label: 'Prep: ON (Surface)', word: 'on his dual-monitor setup', color: 'rose', explanation: 'Trên màn hình thiết bị', roleHint: 'ON cho bề mặt/thiết bị' },
        { label: 'Prep: AT (Point)', word: 'at the central tech hub.', color: 'sky', explanation: 'Tại trụ sở chính', roleHint: 'AT cho địa điểm cụ thể' },
      ],
      fullSentence: 'Our senior engineer is debugging the queries in the primary database on his dual-monitor setup at the central tech hub.',
      translation: 'Kỹ sư cao cấp của chúng tôi đang gỡ lỗi các truy vấn trong cơ sở dữ liệu chính trên hệ thống hai màn hình tại trung tâm công nghệ.',
    },
    detailedGuide: {
      coreRule: 'Quy tắc 3 chiều không gian: IN là "Bên Trong" một thể tích khép kín hoặc địa giới; ON là "Tiếp Xúc Bề Mặt" (mặt phẳng, đường đi, màn hình thiết bị điện tử); AT là "Tọa Độ Điểm" (điểm mốc, số nhà, sự kiện chức năng).',
      formulaBreakdown: [
        { component: 'IN + Enclosed Space / Area', meaning: 'Không gian khép kín hoặc vùng lãnh thổ', rule: 'Phòng ốc (in the room, in the office), Tòa nhà (in the building), Thành phố & Quốc gia (in Da Nang, in Japan), Không gian lưu trữ dữ liệu (in the database, in the cloud storage bucket, in the file).' },
        { component: 'ON + Surface / Electronic Line', meaning: 'Bề mặt tiếp xúc & Môi trường truyền dẫn số', rule: 'Bề mặt phẳng (on the desk, on the wall), Đường phố KHÔNG số nhà (on Wall Street, on Nguyen Hue street), Phương tiện công cộng (on the bus, on the train, on the airplane), Thiết bị số & Mạng (on the internet, on the phone, on the screen, on GitHub, on AWS).' },
        { component: 'AT + Specific Point / Landmark', meaning: 'Tọa độ chính xác hoặc địa điểm chức năng', rule: 'Địa chỉ CÓ số nhà (at 100 Main Street), Điểm mốc (at the traffic light, at the bus stop, at the entrance), Sự kiện (at the meeting, at the conference), Nơi chốn mang tính hoạt động (at work, at home, at school).' },
      ],
      goldenTips: [
        '💡 Mẹo số nhà: CÓ số nhà dùng AT (at 72 Nguyen Trai St), KHÔNG có số nhà chỉ có tên đường dùng ON (on Nguyen Trai St).',
        '💡 Phương tiện di chuyển: Đi lại đứng thẳng người được (xe buýt, tàu hỏa, máy bay, tàu thủy) dùng ON (on the bus, on the plane). Phải khom lưng chui vào (ô tô con, taxi, trực thăng) dùng IN (in the car, in the taxi).',
        '💡 Thế giới công nghệ: Nền tảng hiển thị dùng ON (on mobile, on desktop, on web, on the server dashboard); dữ liệu nằm sâu bên trong dùng IN (in the config file, in the database, in memory).'
      ],
      usageTable: [
        { category: 'IN (Bên trong)', prepositions: 'in the office, in Vietnam, in the database, in a taxi', examples: 'The records are stored in the SQL database.', note: 'Không gian có biên giới bao quanh.' },
        { category: 'ON (Bề mặt & Nền tảng)', prepositions: 'on the screen, on the bus, on AWS, on Nguyen Trai street', examples: 'The app is running smoothly on iOS and Android.', note: 'Bề mặt phẳng hoặc kênh truyền thông số.' },
        { category: 'AT (Tọa độ chính xác)', prepositions: 'at 45 Le Loi Street, at the conference, at work, at the door', examples: 'He is currently at the Google I/O conference.', note: 'Địa chỉ cụ thể hoặc điểm quy tụ.' }
      ]
    },
    tenseVariants: [
      {
        tenseName: 'Digital & Software Context',
        formula: 'on [platform/device] vs in [code/database]',
        sentence: 'We observed the rendering issue on Safari, but the root cause is in the CSS flexbox layout.',
        translation: 'Chúng tôi thấy lỗi hiển thị trên trình duyệt Safari, nhưng nguyên nhân gốc rễ lại nằm trong bố cục CSS flexbox.',
        usageContext: 'Trình duyệt/nền tảng dùng ON, mã nguồn/nội tại dùng IN.',
      },
      {
        tenseName: 'Physical Address vs Street',
        formula: 'at [Number + Street] vs on [Street Name]',
        sentence: 'The office is located at 120 Pasteur Street, right on the corner of the avenue.',
        translation: 'Văn phòng tọa lạc tại số 120 đường Pasteur, ngay trên góc của đại lộ.',
        usageContext: 'Có số nhà dùng AT, góc đường/bề mặt dùng ON.',
      },
      {
        tenseName: 'Events & Venues',
        formula: 'at [event/venue] vs in [city]',
        sentence: 'The developers gathered at the international hackathon in Singapore.',
        translation: 'Các lập trình viên đã hội tụ tại cuộc thi hackathon quốc tế ở Singapore.',
        usageContext: 'Sự kiện dùng AT, thành phố dùng IN.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I saw your message in my phone screen.',
        right: 'I saw your message on my phone screen.',
        explanation: 'Màn hình là bề mặt hiển thị hình ảnh, bắt buộc phải dùng "on the screen / on my phone".',
      },
      {
        wrong: 'Our headquarters is on 45 Oxford Street.',
        right: 'Our headquarters is at 45 Oxford Street.',
        explanation: 'Khi có số nhà cụ thể (45), đây là một tọa độ chính xác nên phải dùng "at". Chỉ dùng "on" khi không có số nhà (on Oxford Street).',
      },
      {
        wrong: 'She is traveling in the train right now.',
        right: 'She is traveling on the train right now.',
        explanation: 'Tàu hỏa là phương tiện công cộng lớn có thể đứng và đi lại trên sàn, phải dùng "on the train".',
      }
    ],
    quickQuiz: [
      {
        question: 'Điền giới từ: "The full user profile is stored _____ the Postgres database, but the notification appears _____ the user\\\'s mobile screen."',
        options: ['on / in', 'in / on', 'at / in', 'in / at'],
        correctIndex: 1,
        explanation: 'Dữ liệu bên trong DB dùng "in", thông báo trên màn hình thiết bị dùng "on".',
      },
      {
        question: 'Chọn câu đúng: "Where is Mark right now?" - "He is _____ work _____ 99 Queen Street."',
        options: ['in / on', 'at / at', 'at / in', 'on / at'],
        correctIndex: 1,
        explanation: '"at work" (đang ở chỗ làm - vị trí chức năng) và "at 99 Queen Street" (địa chỉ có số nhà cụ thể). Cả hai đều dùng "at".',
      },
      {
        question: 'Điền giới từ: "We met each other while commuting _____ the subway _____ Tokyo."',
        options: ['on / in', 'in / at', 'at / on', 'on / at'],
        correctIndex: 0,
        explanation: 'Phương tiện tàu điện ngầm dùng "on the subway", thành phố lớn dùng "in Tokyo".',
      },
      {
        question: 'Chọn câu có giới từ nền tảng trực tuyến CHÍNH XÁC:',
        options: ['The code is hosted on GitHub.', 'The code is hosted in GitHub.', 'The code is hosted at GitHub.', 'The code is hosted by GitHub.'],
        correctIndex: 0,
        explanation: 'Nền tảng trực tuyến, website, thiết bị luôn dùng giới từ ON ("on GitHub", "on the server").',
      },
      {
        question: 'Fill in: "The sensitive credentials must not be hardcoded _____ the repository file."',
        options: ['in', 'on', 'at', 'onto'],
        correctIndex: 0,
        explanation: 'Dữ liệu nằm bên trong tệp tin hoặc mã nguồn dùng "in the file".',
      },
      {
        question: 'Choose the correct prepositions: "We are meeting _____ the coffee shop located _____ 102 Nguyen Hue Street."',
        options: ['at / at', 'in / on', 'at / on', 'on / at'],
        correctIndex: 0,
        explanation: 'Địa điểm gặp gỡ chức năng dùng "at the coffee shop", địa chỉ có số nhà cụ thể (102) dùng "at". Cả hai đều dùng "at".',
      },
      {
        question: 'Select the correct sentence for public transit vs private car:',
        options: ['He was working on his laptop on the bus, while she was riding in a taxi.', 'He was working on his laptop in the bus, while she was riding on a taxi.', 'He was working at his laptop on the bus, while she was riding at a taxi.', 'He was working in his laptop in the bus, while she was riding in a taxi.'],
        correctIndex: 0,
        explanation: 'Phương tiện công cộng lớn đứng đi lại được dùng "on the bus"; phương tiện nhỏ phải khom người chui vào dùng "in a taxi".',
      },
      {
        question: 'Complete: "The system status dashboard is live _____ status.ourcompany.com."',
        options: ['at', 'on', 'in', 'by'],
        correctIndex: 0,
        explanation: 'Khi nói về địa chỉ web/URL cụ thể, người ta thường dùng "at" (at this URL / at status.company.com) hoặc "on the site".',
      },
      {
        question: 'Fill in: "The sensitive credentials must not be hardcoded _____ the repository file."',
        options: ['in', 'on', 'at', 'onto'],
        correctIndex: 0,
        explanation: 'Dữ liệu nằm bên trong tệp tin dùng "in the file".',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Frontend Lead',
        avatar: '👩‍💻',
        text: 'Where can I find the environment variables for this deployment?',
        translation: 'Tôi có thể tìm các biến môi trường cho lần triển khai này ở đâu?',
      },
      {
        speaker: 'DevOps Engineer',
        avatar: '🧑‍💻',
        text: 'They are defined in the .env.production file on the remote server.',
        translation: 'Chúng được định nghĩa trong tệp .env.production trên máy chủ từ xa.',
      },
      {
        speaker: 'Frontend Lead',
        avatar: '👩‍💻',
        text: 'Got it. Is the client team already at the office?',
        translation: 'Hiểu rồi. Đội ngũ khách hàng đã có mặt ở văn phòng chưa?',
      },
      {
        speaker: 'DevOps Engineer',
        avatar: '🧑‍💻',
        text: 'Yes, they are sitting in Conference Room A on the 4th floor.',
        translation: 'Dạ rồi, họ đang ngồi trong Phòng họp A ở tầng 4 ạ.',
      }
    ],
  },
  {
    id: 'prepositions-movement-direction',
    title: 'Prepositions of Movement: Into, Onto, Through, Across, Towards',
    vietnameseTitle: 'Giới Từ Chuyển Động: Dòng Chảy Không Gian & Luồng Dữ Liệu IT',
    level: 'Intermediate',
    category: 'prepositions',
    summary: 'Diễn tả hướng đi và sự dịch chuyển chính xác: Into (đi sâu vào trong), Onto (đáp lên bề mặt), Through (xuyên qua một đường hầm/hệ thống), Across (băng qua từ bên này sang bên kia), Towards (hướng về phía).',
    icon: '🚀',
    legoExample: {
      formulaPattern: '[Subject] + [Action Verb] + [Object] + [Prep: Into/Onto/Through] + [Destination]',
      blocks: [
        { label: 'Subject', word: 'The CI/CD pipeline', color: 'indigo', explanation: 'Hệ thống tự động', roleHint: 'Chủ ngữ' },
        { label: 'Action', word: 'streams the compiled assets', color: 'emerald', explanation: 'Chuyển dữ liệu', roleHint: 'Động từ chính' },
        { label: 'Prep: THROUGH', word: 'through the security scanner', color: 'amber', explanation: 'Xuyên qua cổng quét', roleHint: 'Through: đi xuyên qua' },
        { label: 'Prep: INTO', word: 'into the container registry', color: 'rose', explanation: 'Vào hẳn bên trong', roleHint: 'Into: chuyển vào trong' },
        { label: 'Prep: ONTO', word: 'onto cloud edge nodes.', color: 'sky', explanation: 'Đáp lên bề mặt các node', roleHint: 'Onto: đáp lên bề mặt' },
      ],
      fullSentence: 'The CI/CD pipeline streams the compiled assets through the security scanner into the container registry onto cloud edge nodes.',
      translation: 'Đường ống CI/CD truyền các tệp biên dịch xuyên qua bộ quét bảo mật vào trong kho lưu trữ container rồi đẩy lên các nút biên đám mây.',
    },
    detailedGuide: {
      coreRule: 'Giới từ chuyển động luôn đi kèm ĐỘNG TỪ CHỈ HÀNH ĐỘNG (verbs of motion: walk, push, stream, migrate, jump, fly). Chúng mô tả quỹ đạo di chuyển từ điểm xuất phát tới đích đến.',
      formulaBreakdown: [
        { component: 'INTO (In + To)', meaning: 'Từ ngoài di chuyển vào tận bên trong', rule: 'Ví dụ: import data into MongoDB, step into the room, translate into Vietnamese.' },
        { component: 'ONTO (On + To)', meaning: 'Di chuyển và đáp lên trên một bề mặt', rule: 'Ví dụ: upload images onto the S3 bucket, drag the widget onto the canvas.' },
        { component: 'THROUGH', meaning: 'Xuyên qua không gian 3 chiều có giới hạn (đường hầm, quy trình, mảng dữ liệu)', rule: 'Ví dụ: iterate through an array, pass data through an API gateway, walk through the door.' },
        { component: 'ACROSS', meaning: 'Băng ngang qua một mặt phẳng từ bên này sang bên kia', rule: 'Ví dụ: sync state across multiple microservices, swim across the river, walk across the street.' },
        { component: 'TOWARDS', meaning: 'Di chuyển theo hướng tiến gần về phía mục tiêu', rule: 'Ví dụ: moving towards full automation, heading towards the exit.' },
      ],
      goldenTips: [
        '💡 In vs Into: "In" chỉ trạng thái nằm yên bên trong (The cat is in the box); "Into" chỉ hành động nhảy/đi từ ngoài vào trong (The cat jumped into the box). Tương tự: On (trên bề mặt) vs Onto (nhảy/đặt lên bề mặt).',
        '💡 Through vs Across: "Through" là đi xuyên qua một không gian 3D bao bọc xung quanh (through a tunnel, through a forest, through an array); "Across" là đi ngang qua một mặt phẳng 2D (across the bridge, across the screen, across regions).',
        '💡 Out of (ngược lại của Into): export records out of the database.'
      ],
      usageTable: [
        { category: 'INTO (Vào trong)', prepositions: 'into the database, into production, dive into the code', examples: 'We merged the hotfix branch into main.', note: 'Chuyển đổi trạng thái hoặc không gian.' },
        { category: 'ONTO (Lên trên)', prepositions: 'onto the server, onto the board, drag onto the dropzone', examples: 'Drag and drop your file onto the upload zone.', note: 'Di chuyển tiếp đất trên bề mặt.' },
        { category: 'THROUGH (Xuyên qua)', prepositions: 'through the proxy, loop through the list, walk through', examples: 'Requests are routed through a reverse proxy.', note: 'Xuyên qua hệ thống/đường truyền.' },
        { category: 'ACROSS (Băng qua/Khắp)', prepositions: 'across clusters, across the team, across regions', examples: 'Database replicas are distributed across three availability zones.', note: 'Lan tỏa khắp các khu vực.' }
      ]
    },
    tenseVariants: [
      {
        tenseName: 'Code Iteration (Through)',
        formula: 'loop / iterate + through + [collection]',
        sentence: 'The function iterates through the JSON array to find matching user IDs.',
        translation: 'Hàm lặp qua từng phần tử trong mảng JSON để tìm các ID người dùng trùng khớp.',
        usageContext: 'Duyệt qua danh sách/mảng luôn dùng "through".',
      },
      {
        tenseName: 'Deployment Transition (Into / Onto)',
        formula: 'merge + into [branch] / deploy + onto [server]',
        sentence: 'Once you merge your pull request into main, the webhook deploys artifacts onto the live cluster.',
        translation: 'Khi bạn gộp pull request vào nhánh main, webhook sẽ triển khai các tệp tạo tác lên cụm máy chủ đang chạy.',
        usageContext: 'Gộp nhánh dùng "into", triển khai lên máy chủ dùng "onto" hoặc "to".',
      },
      {
        tenseName: 'System Migration (From ... To / Towards)',
        formula: 'migrate + from [A] + to [B] / work towards [goal]',
        sentence: 'Our engineering department is actively migrating from monolithic architecture towards microservices.',
        translation: 'Bộ phận kỹ thuật của chúng tôi đang tích cực chuyển đổi từ kiến trúc nguyên khối hướng tới các microservices.',
        usageContext: 'Chuyển hướng chiến lược dùng "towards".',
      }
    ],
    commonMistakes: [
      {
        wrong: 'Please merge this pull request to main branch.',
        right: 'Please merge this pull request into the main branch.',
        explanation: 'Hành động tích hợp code từ nhánh phụ gộp sâu vào trong nhánh chính dùng "merge into", không dùng "to".',
      },
      {
        wrong: 'The function loops across all user objects.',
        right: 'The function loops through all user objects.',
        explanation: 'Duyệt từng phần tử từ đầu đến cuối một danh sách/mảng phải dùng "loop through", không dùng "across".',
      },
      {
        wrong: 'He jumped in the pool.',
        right: 'He jumped into the pool.',
        explanation: 'Hành động có sự di chuyển từ ngoài vào trong môi trường nước/không gian mới bắt buộc dùng "into".',
      }
    ],
    quickQuiz: [
      {
        question: 'Chọn giới từ đúng: "All inbound HTTP traffic is filtered _____ an API Gateway before reaching our internal services."',
        options: ['across', 'through', 'into', 'onto'],
        correctIndex: 1,
        explanation: 'Lưu lượng mạng đi xuyên qua một cổng lọc bảo mật dùng "through the API Gateway".',
      },
      {
        question: 'Điền giới từ: "Drag the component _____ the editor canvas to add it to your UI layout."',
        options: ['onto', 'into', 'through', 'past'],
        correctIndex: 0,
        explanation: 'Kéo thả một vật thể đáp lên bề mặt bảng vẽ dùng "onto the canvas".',
      },
      {
        question: 'Chọn câu diễn đạt chuẩn: "Data is synchronized _____ all edge servers in under 50 milliseconds."',
        options: ['through', 'across', 'into', 'towards'],
        correctIndex: 1,
        explanation: 'Đồng bộ hóa dữ liệu trải rộng khắp tất cả các máy chủ dùng "across all edge servers".',
      },
      {
        question: 'Điền giới từ: "Let us dive deep _____ the logs to pinpoint why memory usage spiked."',
        options: ['onto', 'across', 'into', 'towards'],
        correctIndex: 2,
        explanation: 'Cụm thành ngữ "dive deep into something" nghĩa là đi sâu tìm hiểu kỹ lưỡng một vấn đề.',
      },
      {
        question: 'Fill in: "The deployment script exports the build artifacts _____ the build server and uploads them _____ AWS S3."',
        options: ['out of / onto', 'out of / into', 'off / in', 'through / across'],
        correctIndex: 0,
        explanation: '"out of" chỉ hành động lấy từ bên trong ra ngoài; "onto/into" chỉ tải lên bề mặt lưu trữ đám mây.',
      },
      {
        question: 'Choose the correct preposition: "The data packet travels _____ multiple network routers before arriving at the destination."',
        options: ['through', 'across', 'into', 'onto'],
        correctIndex: 0,
        explanation: 'Gói tin đi xuyên qua các bộ định tuyến trong mạng dùng "through".',
      },
      {
        question: 'Complete: "The engineering team is moving _____ a zero-trust security model."',
        options: ['towards', 'into', 'onto', 'through'],
        correctIndex: 0,
        explanation: '"move towards something" mang nghĩa chuyển dịch, tiến dần về phía một mục tiêu/mô hình mới.',
      },
      {
        question: 'Select the right sentence: "The developer walked _____ the conference hall to greet the guest speaker."',
        options: ['across', 'through', 'into', 'onto'],
        correctIndex: 0,
        explanation: 'Đi băng qua sàn của hội trường từ phía này sang phía kia dùng "across the hall".',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Senior Architect',
        avatar: '👨‍🏫',
        text: 'How does user authentication flow through our new infrastructure?',
        translation: 'Luồng xác thực người dùng đi qua hạ tầng mới của chúng ta như thế nào?',
      },
      {
        speaker: 'Security Engineer',
        avatar: '🛡️',
        text: 'The request passes through Cloudflare, heads towards the OAuth server, and injects the JWT token into the request header.',
        translation: 'Yêu cầu đi qua Cloudflare, hướng về máy chủ OAuth, và bơm mã thông báo JWT vào tiêu đề yêu cầu.',
      },
      {
        speaker: 'Senior Architect',
        avatar: '👨‍🏫',
        text: 'And when the token expires, do we redirect them out of the dashboard?',
        translation: 'Và khi token hết hạn, chúng ta có chuyển hướng họ ra khỏi bảng điều khiển không?',
      },
      {
        speaker: 'Security Engineer',
        avatar: '🛡️',
        text: 'Exactly! They are navigated out of the private area back into the login screen.',
        translation: 'Chính xác ạ! Họ sẽ được điều hướng ra khỏi khu vực riêng tư quay trở lại màn hình đăng nhập.',
      }
    ],
  },
  {
    id: 'prepositions-duration-deadlines',
    title: 'Deadlines & Duration: By vs Until, For vs Since, During vs While',
    vietnameseTitle: 'Hạn Chót & Thời Lượng: Phân Biệt By vs Until, For vs Since, During vs While',
    level: 'Intermediate',
    category: 'prepositions',
    summary: 'Không còn nhầm lẫn hạn chót dự án: BY (hạn chót, hoàn thành trước hoặc chậm nhất tại thời điểm đó) vs UNTIL (hành động kéo dài liên tục tới thời điểm đó); FOR (khoảng thời gian) vs SINCE (mốc thời gian bắt đầu); DURING (+ Noun) vs WHILE (+ Clause).',
    icon: '⏱️',
    legoExample: {
      // Khớp 1-1 với 4 khối: "because" nằm chung khối Continuous, không tách
      // thành slot [Connector] riêng.
      formulaPattern: '[Task Action] + [Prep: BY + Deadline] + [Connector + Continuous Action] + [Prep: UNTIL + End Point]',
      blocks: [
        { label: 'Requirement', word: 'You must submit the pull request', color: 'indigo', explanation: 'Yêu cầu công việc', roleHint: 'Mệnh đề chính' },
        { label: 'Deadline (BY)', word: 'by 5:00 PM today,', color: 'rose', explanation: 'Hạn chót cuối cùng', roleHint: 'BY: chậm nhất là' },
        { label: 'Continuous', word: 'because the staging server will run', color: 'emerald', explanation: 'Hành động duy trì liên tục', roleHint: 'Hành động tiếp diễn' },
        { label: 'Duration (UNTIL)', word: 'until midnight for regression tests.', color: 'sky', explanation: 'Duy trì tới tận mốc đó', roleHint: 'UNTIL: kéo dài cho tới' },
      ],
      fullSentence: 'You must submit the pull request by 5:00 PM today, because the staging server will run until midnight for regression tests.',
      translation: 'Bạn phải nộp pull request trước hoặc chậm nhất là 5:00 chiều nay, vì máy chủ staging sẽ chạy liên tục tới nửa đêm để kiểm thử hồi quy.',
    },
    detailedGuide: {
      coreRule: 'Phân định rõ ranh giới: BY là "Điểm kết thúc muộn nhất" (chỉ một hành động xảy ra 1 lần trước mốc đó); UNTIL là "Duy trì trạng thái liên tục" cho tới khi chạm mốc thời gian đó.',
      formulaBreakdown: [
        { component: 'BY + Point in Time', meaning: 'Chậm nhất là / Trước thời điểm đó', rule: 'Hành động dứt điểm trước hoặc đúng deadline: "Finish the report by Friday" (Nộp vào thứ 4, thứ 5 hoặc muộn nhất thứ 6 đều được).' },
        { component: 'UNTIL / TILL + Point in Time', meaning: 'Cho tới tận khi', rule: 'Hành động kéo dài liên tục không gián đoạn: "Wait until tomorrow" (Chờ suốt từ giờ đến ngày mai).' },
        { component: 'FOR + Duration', meaning: 'Trong bao lâu (khoảng thời gian)', rule: 'Đi kèm con số / khoảng thời gian: for 3 hours, for 2 weeks, for 5 years.' },
        { component: 'SINCE + Starting Point', meaning: 'Kể từ mốc thời gian nào', rule: 'Đi kèm mốc thời gian trong quá khứ kéo dài đến hiện tại: since 2020, since yesterday, since 9:00 AM.' },
        { component: 'DURING + Noun vs WHILE + Clause', meaning: 'Trong suốt lúc', rule: 'DURING đi với Danh từ (during the meeting, during the sprint); WHILE đi với Mệnh đề có S + V (while we were reviewing the code).' },
      ],
      goldenTips: [
        '💡 Mẹo BY vs UNTIL: Hãy tự hỏi "Hành động này xảy ra 1 lần là xong (nộp bài, gửi mail, tắt máy) hay làm liên tục kéo dài (chờ đợi, ngủ, chạy server)?". Xảy ra 1 lần -> chọn BY; Làm liên tục -> chọn UNTIL.',
        '💡 Cặp FOR và SINCE: "For" trả lời câu hỏi "How long?" (Bao lâu? -> For 10 days); "Since" trả lời câu hỏi "Since when?" (Từ khi nào? -> Since Monday).',
        '💡 DURING vs WHILE: Sau DURING là cụm từ không có động từ chia thì (during the sprint review); sau WHILE bắt buộc phải có Chủ ngữ và Động từ (while I was checking the logs).'
      ],
      usageTable: [
        { category: 'BY (Hạn chót)', prepositions: 'by tomorrow, by 5 PM, by end of month', examples: 'Please sign the contract by Friday.', note: 'Hành động xảy ra trước hoặc tại thời điểm đó.' },
        { category: 'UNTIL (Duy trì)', prepositions: 'until next week, until the bug is fixed', examples: 'The server remains in maintenance mode until 6 AM.', note: 'Trạng thái duy trì liên tục.' },
        { category: 'FOR (Khoảng thời gian)', prepositions: 'for 6 months, for two hours, for years', examples: 'He has worked here for 5 years.', note: 'Tổng lượng thời gian tích lũy.' },
        { category: 'SINCE (Mốc bắt đầu)', prepositions: 'since 2018, since last month, since morning', examples: 'We have not restarted the server since Monday.', note: 'Mốc khởi đầu kéo dài đến nay.' }
      ]
    },
    tenseVariants: [
      {
        tenseName: 'Present Perfect with For & Since',
        formula: 'S + have/has + V3/ed + for [duration] / since [point]',
        sentence: 'Our team has been maintaining this microservice for over two years, since it was first deployed in 2024.',
        translation: 'Nhóm chúng tôi đã duy trì dịch vụ microservice này hơn hai năm nay, kể từ khi nó được triển khai lần đầu vào năm 2024.',
        usageContext: 'For chỉ tổng độ dài 2 năm, Since chỉ mốc năm 2024.',
      },
      {
        tenseName: 'Deadline Commitment with By',
        formula: 'S + will have + V3/ed + by [deadline]',
        sentence: 'By the end of this sprint, the team will have completed all high-priority backlog tickets.',
        translation: 'Trước khi kết thúc sprint này, nhóm sẽ hoàn thành tất cả các thẻ công việc có độ ưu tiên cao.',
        usageContext: 'Tương lai hoàn thành kết hợp với "by".',
      },
      {
        tenseName: 'During vs While Contrast',
        formula: 'during [event noun] vs while [S + was/were + V-ing]',
        sentence: 'An alert fired during the demo while the presenter was showcasing the dashboard.',
        translation: 'Một cảnh báo đã phát ra trong buổi demo khi người trình bày đang giới thiệu bảng điều khiển.',
        usageContext: 'During the demo (Danh từ) vs While the presenter was showcasing (Mệnh đề).',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I have been coding in Python since 5 years.',
        right: 'I have been coding in Python for 5 years.',
        explanation: '"5 years" là khoảng thời gian (duration), bắt buộc dùng "for". "Since" chỉ đi với mốc thời gian (since 2019).',
      },
      {
        wrong: 'Please complete the task until 5 PM today.',
        right: 'Please complete the task by 5 PM today.',
        explanation: 'Hoàn thành công việc là hành động dứt điểm, 5 PM là hạn chót nên phải dùng "by". Dùng "until" nghĩa là bạn phải ngồi làm liên tục đến đúng 5 giờ mới được phép dừng.',
      },
      {
        wrong: 'He fell asleep during he was debugging.',
        right: 'He fell asleep while he was debugging.',
        explanation: 'Phía sau là mệnh đề "he was debugging" (có chủ ngữ và động từ), bắt buộc dùng liên từ "while", không dùng giới từ "during".',
      }
    ],
    quickQuiz: [
      {
        question: 'Điền từ thích hợp: "The project manager requested that all timesheets be submitted _____ Friday at 4 PM."',
        options: ['until', 'by', 'since', 'for'],
        correctIndex: 1,
        explanation: 'Hạn chót nộp phiếu chấm công (trước hoặc đúng 4 PM) dùng "by".',
      },
      {
        question: 'Chọn từ đúng: "We waited in the Zoom lobby _____ the host finally admitted us at 10:15."',
        options: ['by', 'until', 'since', 'during'],
        correctIndex: 1,
        explanation: 'Hành động chờ đợi diễn ra liên tục kéo dài cho tới khi người chủ trì duyệt vào, dùng "until".',
      },
      {
        question: 'Điền cặp từ đúng: "I have lived in Ho Chi Minh City _____ 2021, which means I have been here _____ almost 5 years."',
        options: ['for / since', 'since / for', 'from / during', 'since / during'],
        correctIndex: 1,
        explanation: '2021 là mốc thời gian -> dùng "since"; almost 5 years là khoảng thời gian -> dùng "for".',
      },
      {
        question: 'Chọn câu viết CHÍNH XÁC:',
        options: ['A fatal error occurred during the system upgrade.', 'A fatal error occurred while the system upgrade.', 'A fatal error occurred since the system upgrade.', 'A fatal error occurred by the system upgrade.'],
        correctIndex: 0,
        explanation: '"the system upgrade" là một cụm danh từ, do đó phải dùng giới từ "during". "while" chỉ đi kèm mệnh đề có S + V.',
      },
      {
        question: 'Choose the correct contrast: "The system upgrade must finish _____ 6:00 AM, but maintenance staff will stay on standby _____ 8:00 AM."',
        options: ['by / until', 'until / by', 'for / since', 'during / while'],
        correctIndex: 0,
        explanation: 'Hoàn thành trước 6h là hạn chót (by), trực liên tục tới 8h là trạng thái kéo dài (until).',
      },
      {
        question: 'Fill in: "She has been the Scrum Master of this team _____ more than two years."',
        options: ['for', 'since', 'during', 'by'],
        correctIndex: 0,
        explanation: '"more than two years" là một khoảng thời gian (duration) tích lũy, dùng "for".',
      },
      {
        question: 'Complete: "The internet connection dropped _____ the live sprint demo was taking place."',
        options: ['while', 'during', 'since', 'until'],
        correctIndex: 0,
        explanation: 'Phía sau là mệnh đề có chủ ngữ và động từ ("the live sprint demo was taking place"), bắt buộc dùng liên từ "while".',
      },
      {
        question: 'Identify the correct preposition: "Please make sure your quarterly goal self-assessment is submitted _____ Friday."',
        options: ['by', 'until', 'for', 'since'],
        correctIndex: 0,
        explanation: 'Nộp bài trước hoặc chậm nhất vào thứ Sáu là hạn chót dứt điểm, dùng "by".',
      },
      {
        question: 'Choose the correct contrast: "The system upgrade must finish _____ 6:00 AM, but maintenance staff will stay on standby _____ 8:00 AM."',
        options: ['by / until', 'until / by', 'for / since', 'during / while'],
        correctIndex: 0,
        explanation: 'Hoàn thành trước 6h là hạn chót (by), trực liên tục tới 8h là trạng thái kéo dài (until).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Product Owner',
        avatar: '👨‍💼',
        text: 'Can we deliver the automated billing feature by next Wednesday?',
        translation: 'Liệu chúng ta có thể bàn giao tính năng thanh toán tự động trước thứ Tư tuần sau không?',
      },
      {
        speaker: 'Tech Lead',
        avatar: '🧑‍💻',
        text: 'Yes, if we work without blockers until Monday, we will easily finish it by Wednesday.',
        translation: 'Dạ được, nếu chúng ta làm việc trơn tru liên tục tới thứ Hai, chúng ta sẽ dễ dàng hoàn thành trước thứ Tư.',
      },
      {
        speaker: 'Product Owner',
        avatar: '👨‍💼',
        text: 'How long has QA been running integration tests on it?',
        translation: 'Đội QA đã chạy các kiểm thử tích hợp trên tính năng này được bao lâu rồi?',
      },
      {
        speaker: 'Tech Lead',
        avatar: '🧑‍💻',
        text: 'They have been testing it for two straight days, since Tuesday morning.',
        translation: 'Họ đã kiểm thử nó trong suốt hai ngày liền, kể từ sáng thứ Ba đến nay rồi ạ.',
      }
    ],
  },
  {
    id: 'prepositions-dependent-collocations',
    title: 'Dependent Prepositions: Essential Collocations in Tech & Business',
    vietnameseTitle: 'Cụm Giới Từ Cố Định (Collocations) Không Thể Thiếu Trong IT & Công Sở',
    level: 'Intermediate',
    category: 'prepositions',
    summary: 'Làm chủ các động từ và tính từ luôn đi kèm một giới từ nhất định trong tiếng Anh: rely on, depend on, consist of, adhere to, integrate with, subscribe to, compatible with, responsible for, capable of, proficient in.',
    icon: '🤝',
    legoExample: {
      // Khớp 1-1 với 5 khối: "and is" nằm chung khối "Adj + Prep".
      formulaPattern: '[Subject] + [Verb + Prep] + [Object] + [Connector + Adj + Prep] + [Complement]',
      blocks: [
        { label: 'Subject', word: 'Our microservice architecture', color: 'indigo', explanation: 'Hệ thống công nghệ', roleHint: 'Chủ ngữ' },
        { label: 'Verb + Prep', word: 'relies heavily on', color: 'emerald', explanation: 'Phụ thuộc nhiều vào (rely on)', roleHint: 'Cụm Động từ + Giới từ cố định' },
        { label: 'Object', word: 'Redis distributed cache', color: 'amber', explanation: 'Bộ nhớ tạm Redis', roleHint: 'Tân ngữ' },
        { label: 'Adj + Prep', word: 'and is compatible with', color: 'rose', explanation: 'Và tương thích với (compatible with)', roleHint: 'Cụm Tính từ + Giới từ cố định' },
        { label: 'Context', word: 'all major cloud providers.', color: 'sky', explanation: 'Các nhà cung cấp đám mây', roleHint: 'Bổ ngữ mở rộng' },
      ],
      fullSentence: 'Our microservice architecture relies heavily on Redis distributed cache and is compatible with all major cloud providers.',
      translation: 'Kiến trúc microservice của chúng tôi phụ thuộc rất lớn vào bộ nhớ đệm phân tán Redis và tương thích hoàn toàn với tất cả nhà cung cấp đám mây lớn.',
    },
    detailedGuide: {
      coreRule: 'Dependent Prepositions (Giới từ phụ thuộc) là những cặp bài trùng cố định trong tiếng Anh: một Động từ hoặc Tính từ bắt buộc phải đi cùng một Giới từ xác định để tạo nên nghĩa hoàn chỉnh. Người học tuyệt đối không được dịch word-by-word từ tiếng Việt.',
      formulaBreakdown: [
        { component: 'Verb + ON', meaning: 'Phụ thuộc, dựa vào', rule: 'rely on (tin cậy vào), depend on (phụ thuộc vào), focus on (tập trung vào), agree on (đồng thuận về điều gì).' },
        { component: 'Verb + TO / WITH', meaning: 'Kết nối, tuân thủ, tích hợp', rule: 'adhere to (tuân thủ theo quy chuẩn), subscribe to (đăng ký theo dõi), conform to (phù hợp với), integrate with (tích hợp cùng), collaborate with (hợp tác cùng).' },
        { component: 'Verb + OF / FOR', meaning: 'Bao gồm, chịu trách nhiệm', rule: 'consist of (bao gồm các phần tử), approve of (tán thành), apologize for (xin lỗi vì), apply for (ứng tuyển vào vị trí).' },
        { component: 'Adjective + Preposition', meaning: 'Tính từ đi kèm giới từ', rule: 'responsible for (chịu trách nhiệm về), proficient in (thành thạo về), capable of (có năng lực làm gì), familiar with (quen thuộc với), compatible with (tương thích với).' },
      ],
      goldenTips: [
        '💡 Tránh lỗi dịch tiếng Việt: Người Việt hay dịch "phụ thuộc vào" -> depend into (SAI! Phải là depend on); "thành thạo tiếng Anh" -> proficient about (SAI! Phải là proficient in); "tương thích với" -> compatible to (SAI! Phải là compatible with).',
        '💡 Sau giới từ luôn là V-ing hoặc Danh từ: Ví dụ: capable of *handling* heavy loads (KHÔNG dùng capable of handle); responsible for *deploying* the code.',
        '💡 Ghi nhớ theo nhóm động từ cùng họ: rely ON, depend ON, count ON, base ON; adhere TO, conform TO, listen TO; consist OF, approve OF, beware OF.'
      ],
      usageTable: [
        { category: 'Động từ + ON', prepositions: 'rely on, depend on, focus on, insist on', examples: 'The app depends on stable network connection.', note: 'Chỉ sự nương tựa, tập trung.' },
        { category: 'Động từ + TO / WITH', prepositions: 'adhere to, apply to, integrate with, sync with', examples: 'All pull requests must adhere to our styling guide.', note: 'Chỉ sự gắn kết hoặc tuân thủ.' },
        { category: 'Tính từ + FOR / IN', prepositions: 'responsible for, famous for, proficient in, interested in', examples: 'She is proficient in React and Next.js.', note: 'Nói về thế mạnh, trách nhiệm.' },
        { category: 'Tính từ + OF / ABOUT', prepositions: 'capable of, aware of, proud of, optimistic about', examples: 'The system is capable of serving 10,000 requests per second.', note: 'Khả năng và nhận thức.' }
      ]
    },
    tenseVariants: [
      {
        tenseName: 'System Architecture (Consist of & Integrate with)',
        formula: 'S + consists of [components] + and integrates with [services]',
        sentence: 'The payment platform consists of three core microservices and integrates with Stripe seamlessly.',
        translation: 'Nền tảng thanh toán bao gồm ba microservice cốt lõi và tích hợp liền mạch với Stripe.',
        usageContext: 'Mô tả kiến trúc công nghệ chuẩn tài liệu quốc tế.',
      },
      {
        tenseName: 'Team Ownership (Responsible for + V-ing)',
        formula: 'S + is/are responsible for + V-ing/Noun',
        sentence: 'Our DevOps team is responsible for ensuring 99.99% system availability and uptime.',
        translation: 'Đội DevOps của chúng tôi chịu trách nhiệm đảm bảo hệ thống duy trì tính sẵn sàng 99.99%.',
        usageContext: 'Phân chia quyền sở hữu và vai trò trong công việc.',
      },
      {
        tenseName: 'Compliance & Quality (Adhere to)',
        formula: 'S + must adhere to + [standard/policy]',
        sentence: 'Every developer must adhere strictly to the security guidelines to prevent vulnerabilities.',
        translation: 'Mọi lập trình viên đều phải tuân thủ nghiêm ngặt các hướng dẫn bảo mật để ngăn ngừa các lỗ hổng.',
        usageContext: 'Quy chuẩn bắt buộc trong dự án công nghệ.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'Our company consists from twenty developers.',
        right: 'Our company consists of twenty developers.',
        explanation: 'Động từ "consist" bắt buộc phải đi với giới từ "of" ("consist of"), không dùng "from".',
      },
      {
        wrong: 'He is responsible to write unit tests.',
        right: 'He is responsible for writing unit tests.',
        explanation: 'Cấu trúc chuẩn là "responsible for + V-ing" (chịu trách nhiệm cho việc gì).',
      },
      {
        wrong: 'Is this component compatible to the latest iOS release?',
        right: 'Is this component compatible with the latest iOS release?',
        explanation: 'Tính từ "compatible" luôn đi với giới từ "with" ("compatible with" = tương thích với).',
      }
    ],
    quickQuiz: [
      {
        question: 'Điền giới từ: "The success of our product launch depends largely _____ customer feedback."',
        options: ['in', 'on', 'at', 'with'],
        correctIndex: 1,
        explanation: '"depend on" là cụm giới từ cố định mang nghĩa phụ thuộc vào / dựa vào.',
      },
      {
        question: 'Chọn câu chính xác: "Our frontend engineer is highly proficient _____ TypeScript and Tailwind CSS."',
        options: ['about', 'at', 'in', 'with'],
        correctIndex: 2,
        explanation: '"proficient in something" là cấu trúc chuẩn để chỉ sự thành thạo một ngôn ngữ/kỹ năng nào đó.',
      },
      {
        question: 'Điền vào chỗ trống: "The new authentication library conforms _____ OAuth 2.0 industry standards."',
        options: ['to', 'with', 'for', 'by'],
        correctIndex: 0,
        explanation: '"conform to something" mang nghĩa tuân thủ, phù hợp với một tiêu chuẩn kỹ thuật.',
      },
      {
        question: 'Chọn cụm từ đúng: "The backend server is capable _____ processing over one million queries daily."',
        options: ['to process', 'of processing', 'for processing', 'with processing'],
        correctIndex: 1,
        explanation: 'Cấu trúc "capable of + V-ing" (có khả năng làm được việc gì).',
      },
      {
        question: 'Fill in: "Our microservice architecture relies _____ asynchronous message queues to handle peak load."',
        options: ['on', 'in', 'at', 'with'],
        correctIndex: 0,
        explanation: '"rely on" (dựa vào / phụ thuộc vào) là cụm giới từ cố định.',
      },
      {
        question: 'Choose the correct preposition: "All code contributions must strictly adhere _____ our style guide and linting standards."',
        options: ['to', 'with', 'in', 'for'],
        correctIndex: 0,
        explanation: '"adhere to" mang nghĩa tuân thủ quy chuẩn, tiêu chuẩn kỹ thuật.',
      },
      {
        question: 'Complete: "Is the new payment API compatible _____ third-party e-wallets?"',
        options: ['with', 'to', 'for', 'by'],
        correctIndex: 0,
        explanation: '"compatible with" mang nghĩa tương thích với hệ thống/thiết bị khác.',
      },
      {
        question: 'Select the correct pair: "Who is responsible _____ deploying the release, and who is capable _____ fixing urgent regressions?"',
        options: ['for / of', 'to / of', 'for / for', 'of / for'],
        correctIndex: 0,
        explanation: 'Cấu trúc "responsible for" (chịu trách nhiệm về) và "capable of" (có năng lực làm gì).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Engineering Director',
        avatar: '👨‍💼',
        text: 'Who is currently responsible for managing our database migrations?',
        translation: 'Ai đang là người chịu trách nhiệm quản lý việc dịch chuyển cơ sở dữ liệu của chúng ta vậy?',
      },
      {
        speaker: 'Lead Engineer',
        avatar: '🧑‍💻',
        text: 'Sarah is responsible for migrations. She is extremely proficient in PostgreSQL optimization.',
        translation: 'Chị Sarah chịu trách nhiệm về các migration ạ. Chị ấy cực kỳ thành thạo về tối ưu hóa PostgreSQL.',
      },
      {
        speaker: 'Engineering Director',
        avatar: '👨‍💼',
        text: 'Does our current schema adhere to the new data privacy regulations?',
        translation: 'Cấu trúc lược đồ dữ liệu hiện tại có tuân thủ các quy định bảo mật mới không?',
      },
      {
        speaker: 'Lead Engineer',
        avatar: '🧑‍💻',
        text: 'Yes, we made sure it conforms to GDPR standards before deploying to production.',
        translation: 'Dạ có, chúng em đã đảm bảo nó tuân thủ các tiêu chuẩn GDPR trước khi triển khai lên production.',
      }
    ],
  },
  {
    id: 'prepositions-spatial-relationships',
    title: 'Spatial Prepositions: Above, Below, Over, Under, Between, Among',
    vietnameseTitle: 'Giới Từ Vị Trí Tương Đối: Phân Biệt Above vs Over, Under vs Below, Between vs Among',
    level: 'Intermediate',
    category: 'prepositions',
    summary: 'Mô tả vị trí trực quan chuẩn xác trong sơ đồ kiến trúc hệ thống và đời sống: Above vs Over (cao hơn), Under vs Below (thấp hơn), Between (giữa 2 đối tượng) vs Among (giữa một nhóm 3 đối tượng trở lên), Opposite vs In front of.',
    icon: '📐',
    legoExample: {
      formulaPattern: '[Component A] + [Verb] + [Between + X and Y] + [Prep: Above/Below + Z]',
      blocks: [
        { label: 'Component A', word: 'The API Gateway sits', color: 'indigo', explanation: 'Thành phần hệ thống', roleHint: 'Chủ ngữ + Động từ vị trí' },
        { label: 'Prep: BETWEEN', word: 'between the client applications', color: 'emerald', explanation: 'Nằm giữa 2 đối tượng', roleHint: 'Between: giữa 2 đối tượng' },
        { label: 'Connector & Obj', word: 'and the backend microservices,', color: 'amber', explanation: 'Đối tượng thứ hai', roleHint: 'Vế liên kết đối tượng' },
        { label: 'Prep: ABOVE', word: 'directly above the data tier.', color: 'rose', explanation: 'Cao hơn một tầng', roleHint: 'Above: tầng cao hơn' },
      ],
      fullSentence: 'The API Gateway sits between the client applications and the backend microservices, directly above the data tier.',
      translation: 'Cổng API Gateway nằm ở giữa các ứng dụng phía máy khách và các dịch vụ microservice phía máy chủ, ngay phía trên tầng dữ liệu.',
    },
    detailedGuide: {
      coreRule: 'Giới từ vị trí tương đối giúp xác định tọa độ một đối tượng so với đối tượng tham chiếu. Phân biệt rõ sự tiếp xúc bề mặt và số lượng đối tượng tham gia so sánh.',
      formulaBreakdown: [
        { component: 'BETWEEN vs AMONG', meaning: 'Ở giữa', rule: 'BETWEEN dùng khi nói về 2 đối tượng riêng biệt (between A and B); AMONG dùng khi nói về một đối tượng nằm giữa một nhóm/tập thể 3 đối tượng trở lên (among the crowd, among top developers).' },
        { component: 'ABOVE vs OVER', meaning: 'Phía trên, cao hơn', rule: 'ABOVE chỉ vị trí cao hơn về mặt độ cao/tầng lớp không nhất thiết thẳng đứng (above sea level, the title above the paragraph); OVER chỉ vị trí bao phủ ngay thẳng đứng phía trên hoặc vượt qua chướng ngại vật (a bridge over the river, put a cover over the keyboard).' },
        { component: 'BELOW vs UNDER', meaning: 'Phía dưới, thấp hơn', rule: 'UNDER chỉ vật bị che khuất/nằm ngay bên dưới vật khác (under the desk, under construction); BELOW chỉ vị trí thấp hơn về thước đo/nấc thang (below 0 degrees Celsius, see comments below).' },
        { component: 'IN FRONT OF vs OPPOSITE', meaning: 'Phía trước vs Đối diện', rule: 'IN FRONT OF là ở đằng trước (quay cùng hướng hoặc đứng trước mặt); OPPOSITE là mặt đối mặt, có khoảng cách ngăn giữa (facing each other across the street/table).' },
      ],
      goldenTips: [
        '💡 Between 2 vs Among 3+: "Between the two options" (giữa 2 lựa chọn) vs "Among all candidates" (giữa tất cả các ứng viên).',
        '💡 Bảng biểu và văn bản: Luôn dùng "See table above" (xem bảng phía trên) và "See notes below" (xem ghi chú phía dưới), KHÔNG dùng over/under ở đây.',
        '💡 Nhiệt độ và chỉ số: Cao hơn nhiệt độ trung bình dùng "above average", thấp hơn mức tối thiểu dùng "below the threshold".'
      ],
      usageTable: [
        { category: 'BETWEEN (2 vật)', prepositions: 'between A and B, between the two servers', examples: 'Data is synchronized between the primary and replica databases.', note: 'Phân cách giữa 2 thực thể.' },
        { category: 'AMONG (Nhiều vật)', prepositions: 'among the files, among engineers, among options', examples: 'React remains the most popular among modern frontend frameworks.', note: 'Nằm trong một tập hợp từ 3 trở lên.' },
        { category: 'ABOVE / BELOW', prepositions: 'above 90%, below average, listed below', examples: 'System CPU utilization climbed above 85 percent.', note: 'So sánh mức độ/tọa độ không tiếp xúc.' },
        { category: 'OVER / UNDER', prepositions: 'over the network, under load, under review', examples: 'The PR is currently under review by our tech lead.', note: 'Bao phủ, chịu tác động trực tiếp.' }
      ]
    },
    tenseVariants: [
      {
        tenseName: 'Metrics & Performance (Above vs Below)',
        formula: 'metric + rises above / drops below + threshold',
        sentence: 'When server latency climbs above 200ms, traffic automatically reroutes to fallback nodes.',
        translation: 'Khi độ trễ máy chủ tăng lên vượt quá 200 mili-giây, lưu lượng sẽ tự động điều hướng sang các nút dự phòng.',
        usageContext: 'Mô tả ngưỡng hiệu năng trong giám sát hệ thống.',
      },
      {
        tenseName: 'Architectural Layering (Between ... and)',
        formula: 'Layer + sits between [A] and [B]',
        sentence: 'The caching layer operates between the web application and the database to accelerate queries.',
        translation: 'Tầng bộ nhớ đệm hoạt động ở giữa ứng dụng web và cơ sở dữ liệu để tăng tốc độ truy vấn.',
        usageContext: 'Mô tả vị trí tầng trung gian trong kiến trúc.',
      },
      {
        tenseName: 'Status & State (Under)',
        formula: 'subject + is currently under + [noun state]',
        sentence: 'The database cluster is currently under heavy load during the flash sale event.',
        translation: 'Cụm cơ sở dữ liệu hiện đang chịu tải rất lớn trong sự kiện bán hàng chớp nhoáng.',
        usageContext: 'Các trạng thái: under load, under maintenance, under review.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'Please choose among React and Vue.',
        right: 'Please choose between React and Vue.',
        explanation: 'Khi chỉ có 2 sự lựa chọn riêng biệt ("React and Vue"), bắt buộc phải dùng "between", không dùng "among".',
      },
      {
        wrong: 'The temperature dropped under zero degrees.',
        right: 'The temperature dropped below zero degrees.',
        explanation: 'Khi nói về thang đo nhiệt độ, cao độ, cấp bậc ta dùng "below" (below zero), không dùng "under".',
      },
      {
        wrong: 'He sat in front of me during the dinner across the table.',
        right: 'He sat opposite me during the dinner across the table.',
        explanation: 'Hai người ngồi đối diện nhau qua mặt bàn quay mặt vào nhau phải dùng "opposite", không dùng "in front of".',
      }
    ],
    quickQuiz: [
      {
        question: 'Điền từ đúng: "The team had to decide _____ three competing cloud architecture proposals."',
        options: ['between', 'among', 'across', 'through'],
        correctIndex: 1,
        explanation: 'Lựa chọn giữa một tập hợp từ 3 phương án trở lên ("three competing proposals") ta dùng "among".',
      },
      {
        question: 'Chọn câu chính xác: "Please review the detailed logs provided in the table _____."',
        options: ['under', 'below', 'down', 'lower'],
        correctIndex: 1,
        explanation: 'Trong tài liệu và văn bản, vị trí phía dưới luôn dùng từ "below" ("in the table below").',
      },
      {
        question: 'Điền từ: "The load balancer distributes traffic evenly _____ the primary and secondary servers."',
        options: ['among', 'between', 'above', 'opposite'],
        correctIndex: 1,
        explanation: 'Phân phối giữa 2 máy chủ cụ thể ("the primary and secondary servers") dùng "between".',
      },
      {
        question: 'Chọn cụm từ chuẩn: "The server infrastructure is currently _____ heavy load."',
        options: ['below', 'under', 'beneath', 'down'],
        correctIndex: 1,
        explanation: 'Thành ngữ công nghệ "under heavy load" (đang chịu tải nặng).',
      },
      {
        question: 'Fill in: "The reverse proxy layer sits _____ the client requests and the backend microservices."',
        options: ['between', 'among', 'above', 'opposite'],
        correctIndex: 0,
        explanation: 'Nằm ở giữa 2 đối tượng xác định dùng "between A and B".',
      },
      {
        question: 'Choose the right word: "Python and TypeScript are _____ the most widely adopted languages in our enterprise."',
        options: ['among', 'between', 'above', 'over'],
        correctIndex: 0,
        explanation: 'Nằm trong một tập thể nhiều ngôn ngữ (từ 3 trở lên) dùng "among".',
      },
      {
        question: 'Complete: "When the server CPU load climbed _____ 90%, auto-scaling kicked in."',
        options: ['above', 'over', 'between', 'under'],
        correctIndex: 0,
        explanation: 'Vượt trên một ngưỡng chỉ số định lượng ta dùng "above 90%".',
      },
      {
        question: 'Select the correct preposition: "The pull request is currently _____ code review by senior engineers."',
        options: ['under', 'below', 'beneath', 'bottom'],
        correctIndex: 0,
        explanation: '"under code review" là cụm thành ngữ công nghệ chỉ trạng thái đang được duyệt mã.',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'DevOps Lead',
        avatar: '👨‍💼',
        text: 'Why did the alerting system notify us? Is memory usage above the critical threshold?',
        translation: 'Sao hệ thống cảnh báo lại báo động vậy em? Mức sử dụng bộ nhớ có vượt trên ngưỡng tới hạn không?',
      },
      {
        speaker: 'Site Reliability Engineer',
        avatar: '🧑‍💻',
        text: 'Yes, it climbed above 90% because worker nodes are stuck between two competing locks.',
        translation: 'Dạ có, nó đã tăng vượt trên 90% vì các nút worker đang bị kẹt ở giữa hai khóa tranh chấp.',
      },
      {
        speaker: 'DevOps Lead',
        avatar: '👨‍💼',
        text: 'Can we distribute the load among other idle instances?',
        translation: 'Chúng ta có thể phân bổ bớt tải ra giữa các máy chủ rảnh rỗi khác không?',
      },
      {
        speaker: 'Site Reliability Engineer',
        avatar: '🧑‍💻',
        text: 'I just did that! Memory has dropped below 60% and is stable now.',
        translation: 'Em vừa làm điều đó xong rồi ạ! Bộ nhớ đã tụt xuống dưới 60% và hiện đã ổn định.',
      }
    ],
  },

  {
    id: 'conjunctions-transition-words',
    title: 'Transition Words: However, Furthermore, Therefore in Business Writing',
    vietnameseTitle: 'Từ Nối & Trạng Từ Liên Kết: Viết Báo Cáo & Email Mạch Lạc, Chặt Chẽ',
    level: 'Advanced',
    summary: 'Chuyển từ câu đơn vụn vặt sang văn phong chuyên nghiệp bằng các từ nối quyền lực: However (tuy nhiên), Furthermore (hơn nữa), Therefore (do đó), Consequently (hệ quả là).',
    icon: '🔗',
    legoExample: {
      blocks: [
        { label: 'Premise', word: 'The initial test passed;', color: 'indigo', explanation: 'Vế tiền đề thứ nhất' },
        { label: 'Transition Word', word: 'however,', color: 'emerald', explanation: 'Từ chuyển tiếp tương phản (kèm dấu phẩy)' },
        { label: 'Contrast', word: 'under high concurrent load,', color: 'amber', explanation: 'Ngữ cảnh thử thách' },
        { label: 'Consequence', word: 'latency increased exponentially.', color: 'rose', explanation: 'Kết quả tương phản' },
      ],
      fullSentence: 'The initial test passed; however, under high concurrent load, latency increased exponentially.',
      translation: 'Kiểm thử ban đầu đã vượt qua; tuy nhiên, dưới tải đồng thời cao, độ trễ đã tăng theo cấp số nhân.',
    },
    tenseVariants: [
      {
        tenseName: 'Cause & Effect (Therefore / As a result)',
        formula: 'Clause 1. Therefore, Clause 2.',
        sentence: 'The third-party API is experiencing downtime. Therefore, we must enable fallback mode.',
        translation: 'API bên thứ ba đang bị gián đoạn. Do đó, chúng ta phải kích hoạt chế độ dự phòng.',
        usageContext: 'Diễn giải nguyên nhân - kết quả logic trong giải pháp kỹ thuật.',
      },
      {
        tenseName: 'Addition (Furthermore / In addition)',
        formula: 'Clause 1. Furthermore, Clause 2.',
        sentence: 'The new design simplifies checkout. Furthermore, it reduces cart abandonment by 15%.',
        translation: 'Thiết kế mới giúp đơn giản hóa thanh toán. Hơn nữa, nó giảm tỷ lệ bỏ giỏ hàng đi 15%.',
        usageContext: 'Bổ sung thêm luận điểm mạnh mẽ khi thuyết trình hoặc viết đề xuất.',
      },
      {
        tenseName: 'Contrast with Nevertheless & In contrast',
        formula: 'Clause 1. Nevertheless, Clause 2.',
        sentence: 'The refactoring scope is substantial; nevertheless, the investment is vital for our system reliability.',
        translation: 'Phạm vi tái cấu trúc là rất lớn; tuy nhiên, khoản đầu tư này mang tính sống còn cho độ tin cậy của hệ thống chúng ta.',
        usageContext: 'Thể hiện sự nhượng bộ trang trọng trong đề xuất kỹ thuật.',
      },
      {
        tenseName: 'Condition & Alternative (Otherwise / Alternatively)',
        formula: 'Imperative / Modal. Otherwise, negative consequence.',
        sentence: 'We must provision additional read replicas; otherwise, database connection pooling will fail under load.',
        translation: 'Chúng ta phải cấp phát thêm các bản sao đọc; nếu không, cơ chế pooling kết nối cơ sở dữ liệu sẽ sụp đổ dưới tải.',
        usageContext: 'Cảnh báo hệ quả tiêu cực nếu không thực hiện hành động.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'The server was slow, however we fixed it.',
        right: 'The server was slow; however, we fixed it. (hoặc: The server was slow. However, we fixed it.)',
        explanation: '"However" là trạng từ liên kết (conjunctive adverb), không phải liên từ nối thông thường như "but". Phải có dấu chấm phẩy hoặc dấu chấm trước nó, và dấu phẩy sau nó.',
      },
      {
        wrong: 'Although the team was tired, but we finished the deployment.',
        right: 'Although the team was tired, we finished the deployment. (hoặc: The team was tired, but we finished the deployment.)',
        explanation: 'Trong tiếng Anh, TUYỆT ĐỐI KHÔNG dùng cả "Although" và "But" trong cùng một câu (người Việt hay mắc lỗi "Mặc dù... nhưng...").',
      }
    ],
    quickQuiz: [
      {
        question: 'Từ nối nào thể hiện quan hệ nhân quả (Cause & Effect) trang trọng nhất?',
        options: ['Consequently', 'Furthermore', 'Nevertheless', 'Although'],
        correctIndex: 0,
        explanation: '"Consequently" (hệ quả là / do đó) là trạng từ liên kết trang trọng chỉ kết quả trực tiếp của hành động trước đó.',
      },
      {
        question: 'Choose the correct contrast transition: "The initial unit tests passed; _____, under high concurrent load, memory leaks occurred."',
        options: ['however', 'therefore', 'furthermore', 'similarly'],
        correctIndex: 0,
        explanation: '"however" (tuy nhiên) dùng để nối hai vế mang ý nghĩa tương phản đối lập.',
      },
      {
        question: 'Fill in the cause & effect connector: "The third-party payment gateway is down. _____, all checkout operations must fallback to PayPal."',
        options: ['Consequently', 'Nevertheless', 'On the contrary', 'Although'],
        correctIndex: 0,
        explanation: '"Consequently" (kết quả là / do đó) diễn tả hệ quả logic trực tiếp từ nguyên nhân phía trước.',
      },
      {
        question: 'Addition connector: "Next.js provides server-side rendering. _____, its built-in image optimization boosts performance."',
        options: ['Furthermore', 'In contrast', 'Otherwise', 'Even though'],
        correctIndex: 0,
        explanation: '"Furthermore" (hơn nữa / thêm vào đó) dùng để bổ sung một luận điểm tích cực cùng hướng.',
      },
      {
        question: 'Choose the correct punctuation: Which sentence is punctuated PROPERLY?',
        options: ['We wanted to release on Friday; however, QA discovered a critical bug.', 'We wanted to release on Friday, however QA discovered a critical bug.', 'We wanted to release on Friday however; QA discovered a critical bug.', 'We wanted to release on Friday. However QA discovered a critical bug.'],
        correctIndex: 0,
        explanation: 'Trạng từ liên kết "however" khi nối hai mệnh đề độc lập thường đứng sau dấu chấm phẩy (;) và theo sau bởi dấu phẩy (,).',
      },
      {
        question: 'Condition connector: "You must backup the database; _____, data might be permanently lost during migration."',
        options: ['otherwise', 'therefore', 'in addition', 'likewise'],
        correctIndex: 0,
        explanation: '"otherwise" (nếu không thì) đưa ra cảnh báo về hậu quả tiêu cực nếu hành động trước không được thực hiện.',
      },
      {
        question: 'Choose the correct contrast transition: "The initial unit tests passed; _____, under high concurrent load, memory leaks occurred."',
        options: ['however', 'therefore', 'furthermore', 'similarly'],
        correctIndex: 0,
        explanation: '"however" (tuy nhiên) dùng để nối hai vế mang ý nghĩa tương phản đối lập.',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Engineering Manager',
        avatar: '👨‍💼',
        text: 'Why do you recommend migrating to Kubernetes now?',
        translation: 'Tại sao bạn lại đề xuất chuyển đổi sang Kubernetes ngay lúc này?',
      },
      {
        speaker: 'DevOps Architect',
        avatar: '👩‍💻',
        text: 'It automates autoscaling; furthermore, it reduces our monthly cloud infrastructure costs by thirty percent.',
        translation: 'Nó tự động hoá việc co giãn tài nguyên; hơn nữa, nó giúp giảm chi phí hạ tầng đám mây hàng tháng đi 30%.',
      },
    ],
  },
  {
    id: 'wish-subjunctive-proposals',
    title: 'Wishes & Subjunctive Mood for Professional Proposals',
    vietnameseTitle: 'Câu Điều Ước & Thể Giả Định: Đưa Ra Đề Xuất & Nguyện Vọng Tinh Tế',
    level: 'Advanced',
    summary: 'Thể hiện mong muốn cải tiến quy trình ("I wish we had a dedicated QA team") và đề xuất trang trọng trong ban điều hành ("We recommend that the policy be updated").',
    icon: '✨',
    legoExample: {
      blocks: [
        { label: 'Recommendation', word: 'The security auditor recommended', color: 'indigo', explanation: 'Lời khuyến nghị từ chuyên gia' },
        { label: 'Subjunctive Connector', word: 'that', color: 'emerald', explanation: 'Liên từ that' },
        { label: 'Subject', word: 'all passwords', color: 'amber', explanation: 'Chủ ngữ giả định' },
        { label: 'Base Verb', word: 'be encrypted with bcrypt.', color: 'rose', explanation: 'Động từ nguyên thể không chia (be encrypted)' },
      ],
      fullSentence: 'The security auditor recommended that all passwords be encrypted with bcrypt.',
      translation: 'Chuyên gia kiểm toán bảo mật đã khuyến nghị rằng tất cả mật khẩu phải được mã hóa bằng bcrypt.',
    },
    tenseVariants: [
      {
        tenseName: 'Wish about Present',
        formula: 'S + wish(es) + S + Past Simple (were/V2)',
        sentence: 'I wish we had more automated integration tests in our CI/CD pipeline.',
        translation: 'Ước gì chúng ta có nhiều bài kiểm thử tích hợp tự động hơn trong quy trình CI/CD.',
        usageContext: 'Bày tỏ mong muốn về một thực tế hiện tại chưa được như ý.',
      },
      {
        tenseName: 'Subjunctive Mood (Formal Proposal)',
        formula: 'S + recommend/insist/suggest + that + S + (should) be/V-bare',
        sentence: 'I suggest that he be given access to the repository today.',
        translation: 'Tôi đề xuất rằng anh ấy nên được cấp quyền truy cập vào kho mã nguồn trong hôm nay.',
        usageContext: 'Dùng trong văn bản chính thức, email gửi khách hàng hoặc ban giám đốc.',
      },
      {
        tenseName: 'Polite Complaint or Desire with Wish + Would',
        formula: 'S + wish + someone + would + V-bare',
        sentence: 'I wish the external payment gateway would maintain higher uptime during peak hours.',
        translation: 'Tôi ước gì cổng thanh toán bên ngoài duy trì thời gian hoạt động ổn định hơn trong giờ cao điểm.',
        usageContext: 'Phàn nàn lịch sự hoặc mong muốn ai đó thay đổi hành vi/trạng thái.',
      },
      {
        tenseName: 'High Urgency Subjunctive (It is imperative/crucial that...)',
        formula: 'It is imperative that + S + (should) be + V3/ed',
        sentence: 'It is imperative that all production database credentials be encrypted at rest and in transit.',
        translation: 'Điều tối cấp thiết là toàn bộ thông tin đăng nhập cơ sở dữ liệu production phải được mã hóa khi lưu trữ và truyền tải.',
        usageContext: 'Quy chuẩn an ninh thông tin bắt buộc trong tài liệu tuân thủ (Compliance).',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I wish we have more time.',
        right: 'I wish we had more time.',
        explanation: 'Ước điều không có thật ở hiện tại phải lùi thì về quá khứ đơn: "I wish we had".',
      },
      {
        wrong: 'The manager requested that she is present at the meeting.',
        right: 'The manager requested that she be present at the meeting.',
        explanation: 'Trong thể giả định (Subjunctive), động từ sau "that + S" luôn ở dạng nguyên mẫu không chia: "she be present".',
      },
    ],
    quickQuiz: [
      {
        question: 'Chọn câu giả định đúng chuẩn ngữ pháp quốc tế:',
        options: ['It is crucial that everyone attend the security briefing.', 'It is crucial that everyone attends the security briefing.', 'It is crucial that everyone attended.', 'It is crucial that everyone is attending.'],
        correctIndex: 0,
        explanation: 'Cấu trúc giả định "It is crucial that + S + V-nguyên thể" không chia số ít hay quá khứ (attend).',
      },
      {
        question: 'Past regret with wish: "I wish I _____ the database schema before running that destructive migration script."',
        options: ['had backed up', 'backed up', 'have backed up', 'would back up'],
        correctIndex: 0,
        explanation: 'Ước một điều trong quá khứ (hối tiếc): S + wish + S + Quá khứ hoàn thành (had backed up).',
      },
      {
        question: 'Formal Subjunctive in proposals: "The CTO recommended that every engineer _____ two-factor authentication on their GitHub accounts."',
        options: ['enable', 'enables', 'enabled', 'is enabling'],
        correctIndex: 0,
        explanation: 'Cấu trúc giả định thức formal: "recommend that + S + V-nguyên thể không chia" (enable, không chia enables).',
      },
      {
        question: 'Subjunctive structure: "It is essential that the security patch _____ deployed immediately."',
        options: ['be', 'is', 'was', 'to be'],
        correctIndex: 0,
        explanation: 'Cấu trúc "It is essential that + S + (should) be + V3/ed": dùng "be" nguyên thể.',
      },
      {
        question: 'Choose the sentence showing polite complaint using wish + would:',
        options: ['I wish the client would reply to our design proposals in a timely manner.', 'I wish the client will reply.', 'I wish the client replies.', 'I wish the client replied already.'],
        correctIndex: 0,
        explanation: '"I wish someone would do something" diễn tả mong muốn ai đó thay đổi hành vi hoặc phàn nàn nhẹ nhàng.',
      },
      {
        question: 'Present unreal wish: "Our team _____ we had more automated tests for the legacy module."',
        options: ['wishes', 'is wishing', 'wished', 'wish that'],
        correctIndex: 0,
        explanation: 'Ước một điều trái ngược với hiện tại: S + wish(es) + S + Quá khứ đơn (had).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Tech Lead',
        avatar: '👨‍💼',
        text: 'The security audit found several exposed environment variables.',
        translation: 'Đợt kiểm toán bảo mật đã phát hiện một số biến môi trường bị lộ.',
      },
      {
        speaker: 'Senior Security Engineer',
        avatar: '👩‍💻',
        text: 'I strongly suggest that all secret keys be rotated immediately.',
        translation: 'Tôi đề nghị khẩn thiết rằng toàn bộ các khóa bí mật phải được thay đổi ngay lập tức.',
      },
    ],
  },
  {
    id: 'passive-voice-tech-engineering',
    title: 'Passive Voice for Tech Documentation & Standard Operating Procedures',
    vietnameseTitle: 'Câu Bị Động Trong Viết Log, Báo Cáo Sự Cố & Quy Trình Kỹ Thuật (Passive Voice)',
    level: 'Intermediate',
    summary: 'Nhấn mạnh hành động và đối tượng bị tác động thay vì chủ thể. Rất phổ biến khi viết Ticket, Release Note, Bug Report và Email công sở.',
    icon: '⚙️',
    legoExample: {
      blocks: [
        { label: 'Target Object', word: 'The critical security patch', color: 'indigo', explanation: 'Đối tượng được tác động' },
        { label: 'Auxiliary Passive', word: 'was deployed', color: 'rose', explanation: 'Trợ động từ be + V3/ed (Quá khứ bị động)' },
        { label: 'Agent / Time', word: 'to production at midnight by the DevOps team.', color: 'emerald', explanation: 'Thơi gian & Người thực hiện' },
      ],
      fullSentence: 'The critical security patch was deployed to production at midnight by the DevOps team.',
      translation: 'Bản vá bảo mật quan trọng đã được triển khai lên môi trường sản xuất lúc nửa đêm bởi đội DevOps.',
    },
    tenseVariants: [
      {
        tenseName: 'Present Passive',
        formula: 'S + am/is/are + V3/ed',
        sentence: 'Database backups are created automatically every three hours.',
        translation: 'Bản sao lưu cơ sở dữ liệu được tạo tự động mỗi ba giờ.',
        usageContext: 'Mô tả quy trình hệ thống tự động hóa.',
      },
      {
        tenseName: 'Present Perfect Passive',
        formula: 'S + have/has been + V3/ed',
        sentence: 'The pull request has been approved by two senior reviewers.',
        translation: 'Yêu cầu hợp nhất mã nguồn đã được chấp thuận bởi hai người kiểm duyệt cấp cao.',
        usageContext: 'Thông báo kết quả công việc vừa mới hoàn thành.',
      },
      {
        tenseName: 'Modal Passive for Architectural Rules',
        formula: 'Modal (must/should/can) + be + V3/ed',
        sentence: 'Authentication tokens must be validated on every private endpoint before granting access.',
        translation: 'Mã xác thực phải được kiểm tra hợp lệ trên mọi endpoint riêng tư trước khi cấp quyền truy cập.',
        usageContext: 'Quy định các tiêu chuẩn kỹ thuật bắt buộc trong tài liệu API.',
      },
      {
        tenseName: 'Future Passive for Deployment Commitments',
        formula: 'S + will be + V3/ed + by [date]',
        sentence: 'The legacy monolith will be completely decommissioned by the end of Q3.',
        translation: 'Hệ thống nguyên khối cũ sẽ được ngừng hoạt động hoàn toàn trước cuối Quý 3.',
        usageContext: 'Cam kết tiến độ và lộ trình chuyển đổi kỹ thuật.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'The bug was happened yesterday.',
        right: 'The bug happened yesterday.',
        explanation: 'Nội động từ (happen, occur, die, arrive) không bao giờ chia ở dạng bị động.',
      },
      {
        wrong: 'The API is call by frontend.',
        right: 'The API is called by frontend.',
        explanation: 'Động từ chính trong câu bị động bắt buộc phải ở dạng Quá khứ phân từ V3/V-ed (called).',
      },
    ],
    quickQuiz: [
      {
        question: 'Điền dạng đúng của bị động: "All credentials must _____ before saving to disk."',
        options: ['encrypt', 'be encrypted', 'being encrypted', 'encrypted'],
        correctIndex: 1,
        explanation: 'Sau động từ khuyết thiếu (must), bị động có dạng "must + be + V3/ed" (must be encrypted).',
      },
      {
        question: 'Convert to engineering passive: "Engineers serialize the data payload before transmitting it over WebSocket."',
        options: ['The data payload is serialized before being transmitted over WebSocket.', 'The data payload serializes before transmission.', 'The data payload was serialized by engineers.', 'The data payload has been serializing.'],
        correctIndex: 0,
        explanation: 'Câu bị động hiện tại đơn miêu tả quy trình kỹ thuật: is/are + V3/ed ("is serialized... before being transmitted").',
      },
      {
        question: 'Fill in: "The microservice cluster _____ automatically when traffic exceeds the baseline threshold."',
        options: ['is scaled', 'scales', 'is scaling', 'was scaled'],
        correctIndex: 0,
        explanation: 'Mô tả cơ chế tự động hóa trong tài liệu hệ thống: "is scaled automatically".',
      },
      {
        question: 'Complete: "All sensitive passwords _____ hashed with bcrypt with a salt factor of 12."',
        options: ['must be', 'must', 'must have', 'must to be'],
        correctIndex: 0,
        explanation: 'Quy chuẩn kỹ thuật bị động: Modal + be + V3/ed ("must be hashed").',
      },
      {
        question: 'Identify the correct sentence in software release notes:',
        options: ['A memory leak in the billing service has been resolved in version 2.4.', 'A memory leak in the billing service resolved.', 'We have been resolving a memory leak.', 'A memory leak was resolve.'],
        correctIndex: 0,
        explanation: 'Trong ghi chú phát hành (release notes), thì Hiện tại hoàn thành bị động ("has been resolved") là chuẩn mực quốc tế.',
      },
      {
        question: 'Choose the passive form: "Incoming requests are queued _____ the worker threads are freed up."',
        options: ['until', 'by', 'since', 'during'],
        correctIndex: 0,
        explanation: 'Các yêu cầu được xếp vào hàng đợi cho tới khi các luồng worker được giải phóng (until).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Product Owner',
        avatar: '👨‍💼',
        text: 'Has the user authentication feature been tested yet?',
        translation: 'Tính năng xác thực người dùng đã được kiểm thử chưa?',
      },
      {
        speaker: 'QA Lead',
        avatar: '👩‍💻',
        text: 'Yes, it was thoroughly tested, and all edge cases were verified yesterday.',
        translation: 'Rồi ạ, nó đã được kiểm thử kỹ lưỡng và mọi trường hợp ngoại lệ đều đã được xác minh vào ngày hôm qua.',
      },
    ],
  },
  {
    id: 'inversion-emphasis-reflexive',
    title: 'Inversion Structures for High-Impact Professional Speech',
    vietnameseTitle: 'Cấu Trúc Đảo Ngữ: Tạo Điểm Nhấn Thuyết Phục Trong Thuyết Trình & Đàm Phán',
    level: 'Advanced',
    summary: 'Sử dụng "Not only... but also", "Only after", "Hardly... when" để biến câu nói thành sắc bén, ấn tượng khi bảo vệ quan điểm kỹ thuật hoặc phỏng vấn.',
    icon: '⚡',
    legoExample: {
      blocks: [
        { label: 'Negative Adverb', word: 'Not only', color: 'rose', explanation: 'Trạng từ phủ định đứng đầu câu' },
        { label: 'Auxiliary Verb', word: 'did we optimize', color: 'amber', explanation: 'Đảo trợ động từ lên trước chủ ngữ (did + S + V-bare)' },
        { label: 'Target / Addition', word: 'the query, but we also reduced memory usage by 50%.', color: 'emerald', explanation: 'Mệnh đề bổ sung giá trị' },
      ],
      fullSentence: 'Not only did we optimize the query, but we also reduced memory usage by 50%.',
      translation: 'Không những chúng tôi tối ưu hóa câu truy vấn, mà chúng tôi còn giảm 50% dung lượng bộ nhớ sử dụng.',
    },
    tenseVariants: [
      {
        tenseName: 'Inversion with "Not only"',
        formula: 'Not only + Aux + S + V, but S + also + V',
        sentence: 'Not only does this framework improve performance, but it also simplifies unit testing.',
        translation: 'Không chỉ khung làm việc này cải thiện hiệu năng, mà nó còn đơn giản hóa việc viết bài kiểm thử đơn vị.',
        usageContext: 'Nhấn mạnh 2 lợi ích vượt trội trong báo cáo hoặc pitching sản phẩm.',
      },
      {
        tenseName: 'Inversion with "Under no circumstances"',
        formula: 'Under no circumstances + Aux + S + V',
        sentence: 'Under no circumstances should production keys be committed to Git repositories.',
        translation: 'Trong bất kỳ hoàn cảnh nào cũng không được commit các khóa môi trường thật vào kho Git.',
        usageContext: 'Cảnh báo nguyên tắc an ninh tối quan trọng trong tài liệu kỹ thuật.',
      },
      {
        tenseName: 'Inversion with Seldom / Rarely',
        formula: 'Seldom / Rarely + Auxiliary + S + Main Verb',
        sentence: 'Rarely do we encounter an unhandled exception in our automated end-to-end test suite.',
        translation: 'Hiếm khi chúng tôi gặp phải ngoại lệ chưa được xử lý trong bộ kiểm thử đầu-cuối tự động của mình.',
        usageContext: 'Nhấn mạnh tần suất hiếm hoi một cách tự tin, chuyên nghiệp.',
      },
      {
        tenseName: 'Inversion with Hardly / Scarcely... when',
        formula: 'Hardly + had + S + V3/ed + when + S + V2/ed',
        sentence: 'Hardly had the new version been released when the customer success team received glowing feedback.',
        translation: 'Phiên bản mới vừa mới được phát hành thì đội ngũ chăm sóc khách hàng đã nhận được những phản hồi rất tích cực.',
        usageContext: 'Diễn tả hai sự việc xảy ra nối tiếp nhau chớp nhoáng.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'Not only we improved performance, but also saved cost.',
        right: 'Not only did we improve performance, but we also saved cost.',
        explanation: 'Khi đưa "Not only" lên đầu câu, bắt buộc phải đảo trợ động từ (did/does/is) lên trước chủ ngữ.',
      },
      {
        wrong: 'Only when you finish testing, you can deploy.',
        right: 'Only when you finish testing can you deploy.',
        explanation: 'Đảo ngữ với "Only when + S + V": mệnh đề chính phía sau phải đảo trợ động từ lên trước chủ ngữ ("can you deploy").',
      }
    ],
    quickQuiz: [
      {
        question: 'Chọn câu đảo ngữ chính xác:',
        options: ['Only after running the load test did we deploy the app.', 'Only after running the load test we deployed the app.', 'Only after running the load test we did deploy the app.', 'Only after running the load test deployed we the app.'],
        correctIndex: 0,
        explanation: 'Cấu trúc đảo ngữ: "Only after + V-ing/clause + Aux + S + V-bare": "did we deploy".',
      },
      {
        question: 'Negative inversion with "Never": "Never _____ such a severe DDoS attack in our company\'s history."',
        options: ['have we experienced', 'we have experienced', 'did we experienced', 'we experienced'],
        correctIndex: 0,
        explanation: 'Đảo ngữ với trạng từ phủ định "Never": Never + trợ động từ (have) + S (we) + V3/ed (experienced).',
      },
      {
        question: 'Negative inversion with "Rarely": "Rarely _____ the server restart during business hours."',
        options: ['does', 'is', 'did', 'has'],
        correctIndex: 0,
        explanation: 'Rarely + trợ động từ hiện tại đơn (does) + the server + restart.',
      },
      {
        question: 'Complete: "Not only _____ the migration on schedule, but they also reduced database query latency by 40%."',
        options: ['did the team complete', 'the team completed', 'completed the team', 'did the team completed'],
        correctIndex: 0,
        explanation: 'Đảo ngữ "Not only + did + S + V-nguyên thể, but S also...".',
      },
      {
        question: 'Choose the correct reflexive pronoun: "The cloud cluster scales _____ up and down based on real-time demand."',
        options: ['itself', 'himself', 'themselves', 'it'],
        correctIndex: 0,
        explanation: 'Cụm máy chủ ("The cloud cluster" - số ít) tự mở rộng quy mô, dùng đại từ phản chiếu "itself".',
      },
      {
        question: 'Identify the inverted conditional: "_____ you encounter any configuration errors, please contact the DevOps team immediately."',
        options: ['Should', 'Had', 'Were', 'If did'],
        correctIndex: 0,
        explanation: 'Đảo ngữ điều kiện loại 1: "Should you encounter..." = "If you encounter...".',
      },
      {
        question: 'Negative inversion with "Never": "Never _____ such a severe DDoS attack in our company\'s history."',
        options: ['have we experienced', 'we have experienced', 'did we experienced', 'we experienced'],
        correctIndex: 0,
        explanation: 'Đảo ngữ với trạng từ phủ định "Never": Never + trợ động từ (have) + S (we) + V3/ed (experienced).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'CTO',
        avatar: '👨‍💼',
        text: 'How confident are you about system security during peak traffic?',
        translation: 'Bạn tự tin đến mức nào về tính bảo mật của hệ thống khi lưu lượng truy cập đạt đỉnh?',
      },
      {
        speaker: 'Lead Architect',
        avatar: '👩‍💻',
        text: 'Under no circumstances will user data be exposed, as all payload data is end-to-end encrypted.',
        translation: 'Trong bất kỳ tình huống nào dữ liệu người dùng cũng không bị rò rỉ, vì toàn bộ dữ liệu gói tin đều được mã hóa đầu-cuối.',
      },
    ],
  },
{
    id: 'future-forms-commitments',
    title: 'Future Forms: Will vs Going To vs Present Continuous',
    vietnameseTitle: 'Các Thì Tương Lai: Lên Kế Hoạch & Cam Kết Deadline',
    level: 'Beginner',
    summary: 'Phân biệt Will (quyết định tức thì, dự đoán), Be Going To (dự định sẵn) và Present Continuous (lịch hẹn cố định với đối tác/team).',
    icon: '🚀',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'Our team', color: 'indigo', explanation: 'Chủ ngữ' },
        { label: 'Fixed Plan', word: 'is deploying', color: 'emerald', explanation: 'Hiện tại tiếp diễn: Lịch cố định đã chốt' },
        { label: 'Object', word: 'the v2.0 release', color: 'rose', explanation: 'Tân ngữ' },
        { label: 'Time marker', word: 'this Friday at 10 PM', color: 'sky', explanation: 'Mốc thời gian cụ thể trong tương lai' },
      ],
      fullSentence: 'Our team is deploying the v2.0 release this Friday at 10 PM.',
      translation: 'Nhóm chúng tôi sẽ triển khai bản phát hành v2.0 vào thứ Sáu tuần này lúc 10 giờ tối.',
    },
    tenseVariants: [
      {
        tenseName: 'Will for Immediate Decision / Offer',
        formula: 'S + will + V (bare)',
        sentence: 'I will check the server logs right now to see what happened.',
        translation: 'Tôi sẽ kiểm tra nhật ký máy chủ ngay bây giờ xem chuyện gì đã xảy ra.',
        usageContext: 'Quyết định đưa ra ngay tại thời điểm nói hoặc lời đề nghị giúp đỡ.',
      },
      {
        tenseName: 'Be Going To for Prior Intention / Signs',
        formula: 'S + am/is/are + going to + V (bare)',
        sentence: 'We are going to migrate our database to AWS next quarter.',
        translation: 'Chúng tôi dự định chuyển cơ sở dữ liệu lên AWS vào quý tới.',
        usageContext: 'Dự định hoặc kế hoạch đã được thảo luận từ trước.',
      },
      {
        tenseName: 'Present Continuous for Fixed Arrangement',
        formula: 'S + am/is/are + V-ing',
        sentence: 'I am presenting the demo to our Japanese client tomorrow morning.',
        translation: 'Tôi sẽ thuyết trình bản demo cho khách hàng Nhật Bản vào sáng mai.',
        usageContext: 'Lịch hẹn đã chốt chắc chắn với người khác, có giờ giấc cụ thể.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'I will meet the candidate tomorrow at 9 AM, it is already in my calendar.',
        right: 'I am meeting the candidate tomorrow at 9 AM, it is already in my calendar.',
        explanation: 'Lịch phỏng vấn đã được ấn định vào lịch làm việc (calendar), bắt buộc dùng Hiện tại tiếp diễn thay vì Will.',
      },
      {
        wrong: 'Look at the high CPU load! The server will crash.',
        right: 'Look at the high CPU load! The server is going to crash.',
        explanation: 'Khi có bằng chứng nhãn tiền ở hiện tại (CPU load 99%), ta dùng "be going to" để dự đoán sự việc sắp xảy ra.',
      },
    ],
    quickQuiz: [
      {
        question: 'Dev: "The staging environment is broken!" - Lead: "Don\'t worry, I _____ it right away."',
        options: ['am going to fix', 'will fix', 'am fixing', 'fix'],
        correctIndex: 1,
        explanation: 'Quyết định tức thì ngay khi nghe đồng nghiệp báo tin, dùng "will + V".',
      },
      {
        question: 'We _____ a retrospective meeting this Thursday at 3 PM. Everyone confirmed attendance.',
        options: ['will have', 'are having', 'have had', 'had'],
        correctIndex: 1,
        explanation: 'Lịch họp cố định mà mọi người đã xác nhận tham gia dùng Hiện tại tiếp diễn ("are having").',
      },

      {
        question: 'Sudden decision at the moment of speaking: "The site is down!" - "Don\'t panic, I _____ check the logs right away."',
        options: ['will', 'am going to', 'am checking', 'shall be'],
        correctIndex: 0,
        explanation: 'Quyết định chớp nhoáng đưa ra ngay tại thời điểm nói luôn dùng "will" (I will check...).',
      },
      {
        question: 'Pre-planned intention: "We _____ migrate our databases to Aurora PostgreSQL next quarter."',
        options: ['are going to', 'will have', 'shall', 'would'],
        correctIndex: 0,
        explanation: 'Kế hoạch đã có dự định từ trước dùng "be going to".',
      },
      {
        question: 'Official arrangement: "Our Tech Lead _____ a meeting with the overseas client this Thursday at 3 PM."',
        options: ['is having', 'will have had', 'has had', 'was having'],
        correctIndex: 0,
        explanation: 'Lịch hẹn đã được sắp xếp cụ thể với người khác trong tương lai dùng Hiện tại tiếp diễn ("is having").',
      },
      {
        question: 'Future timetable: "The international developer conference _____ at 9:00 AM sharp tomorrow."',
        options: ['begins', 'is beginning', 'will have begun', 'was beginning'],
        correctIndex: 0,
        explanation: 'Lịch trình hội nghị cố định dùng Hiện tại đơn mang nghĩa tương lai ("begins").',
      },
      {
        question: 'Which form indicates an action in progress at a specific future moment?',
        options: ['Future Continuous (will be + V-ing)', 'Future Simple (will + V)', 'Future Perfect (will have + V3)', 'Present Simple'],
        correctIndex: 0,
        explanation: 'Thì Tương lai tiếp diễn chỉ hành động đang diễn ra tại một thời điểm xác định trong tương lai.',
      },
    ],
    realLifeDialogue: [
      {
        speaker: 'Scrum Master',
        avatar: '👩‍💼',
        text: 'Can we promise the client that the checkout feature will be ready this sprint?',
        translation: 'Chúng ta có thể hứa với khách hàng là tính năng thanh toán sẽ sẵn sàng trong sprint này không?',
      },
      {
        speaker: 'Backend Lead',
        avatar: '👨‍💻',
        text: 'We are finishing the API integration today, and QA is testing it tomorrow morning. We are going to make it.',
        translation: 'Chúng tôi đang hoàn tất tích hợp API hôm nay, và QA sẽ kiểm thử vào sáng mai. Chúng ta sẽ kịp tiến độ.',
      },
    ],
  },
  {
    id: 'past-simple-vs-present-perfect',
    title: 'Past Simple vs Present Perfect',
    vietnameseTitle: 'Quá Khứ Đơn vs Hiện Tại Hoàn Thành: Phân Biệt Triệt Để',
    level: 'Beginner',
    summary: 'Không còn nhầm lẫn giữa sự việc đã chấm dứt tại mốc thời gian xác định (Quá khứ đơn) và trải nghiệm, kết quả liên đới đến hiện tại (Hiện tại hoàn thành).',
    icon: '⏮️',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'We', color: 'indigo', explanation: 'Chủ ngữ' },
        { label: 'Auxiliary', word: 'have already', color: 'emerald', explanation: 'Trợ động từ + Trạng từ hoàn tất' },
        { label: 'Past Participle', word: 'resolved', color: 'rose', explanation: 'Động từ V3/ed' },
        { label: 'Result Object', word: 'the critical memory leak', color: 'sky', explanation: 'Kết quả hiện tại máy chủ đã chạy mượt' },
      ],
      fullSentence: 'We have already resolved the critical memory leak.',
      translation: 'Chúng tôi đã giải quyết xong sự cố rò rỉ bộ nhớ nghiêm trọng (và hiện tại hệ thống đã ổn).',
    },
    tenseVariants: [
      {
        tenseName: 'Past Simple (Definite Time Anchor)',
        formula: 'S + V2/ed + (yesterday / last week / in 2024 / ago)',
        sentence: 'The DevOps engineer restarted the cluster two hours ago.',
        translation: 'Kỹ sư DevOps đã khởi động lại cụm máy chủ cách đây 2 giờ.',
        usageContext: 'Thời điểm hành động xảy ra đã kết thúc trong quá khứ.',
      },
      {
        tenseName: 'Present Perfect (Result Relevance / Experience)',
        formula: 'S + have/has + V3/ed + (already / yet / just / so far / since)',
        sentence: 'Have you tested the payment gateway with real credit cards yet?',
        translation: 'Bạn đã kiểm thử cổng thanh toán với thẻ tín dụng thực tế chưa?',
        usageContext: 'Hỏi về sự hoàn tất hoặc kinh nghiệm tính đến thời điểm hiện tại.',
      },
      {
        tenseName: 'Unfinished Time Period with Present Perfect',
        formula: 'S + have/has + V3/ed + this morning / this week / this quarter',
        sentence: 'Our engineering squad has closed twelve major bug tickets this week.',
        translation: 'Nhóm kỹ thuật chúng tôi đã đóng 12 ticket lỗi lớn trong tuần này (tuần này vẫn chưa kết thúc).',
        usageContext: 'Hành động xảy ra trong khoảng thời gian chưa kết thúc ở hiện tại.',
      },
      {
        tenseName: 'Duration Up to the Present with Since / For',
        formula: 'S + have/has been / worked + since [start point] / for [duration]',
        sentence: 'She has served as our principal cloud architect since the platform migrated to AWS.',
        translation: 'Cô ấy đã giữ vai trò kiến trúc sư trưởng đám mây kể từ khi nền tảng chuyển dịch lên AWS.',
        usageContext: 'Một trạng thái hoặc công việc bắt đầu trong quá khứ và vẫn tiếp diễn ở hiện tại.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'I have pushed the hotfix yesterday afternoon.',
        right: 'I pushed the hotfix yesterday afternoon.',
        explanation: 'Khi có mốc thời gian quá khứ xác định ("yesterday afternoon"), KHÔNG ĐƯỢC dùng hiện tại hoàn thành.',
      },
      {
        wrong: 'Did you commit the changes yet?',
        right: 'Have you committed the changes yet?',
        explanation: 'Trong tiếng Anh chuẩn (đặc biệt trong báo cáo kỹ thuật), từ "yet" liên kết trạng thái hiện tại nên dùng Hiện tại hoàn thành.',
      },
    ],
    quickQuiz: [
      {
        question: 'Our startup _____ over 50,000 active users since launching the mobile app.',
        options: ['acquired', 'has acquired', 'was acquiring', 'acquires'],
        correctIndex: 1,
        explanation: 'Có dấu hiệu "since + V-ing/Mốc quá khứ", hành động bắt đầu từ quá khứ và kéo dài/tích lũy đến hiện tại nên dùng Hiện tại hoàn thành.',
      },
      {
        question: 'When _____ the security breach occur?',
        options: ['has', 'did', 'was', 'is'],
        correctIndex: 1,
        explanation: 'Câu hỏi bắt đầu với "When" (hỏi về thời điểm cụ thể) luôn dùng Quá khứ đơn ("did... occur").',
      },
      {
        question: 'Choose the correct pair: "Our startup _____ two years ago, and we _____ over 500,000 active users so far."',
        options: ['launched / have gained', 'has launched / gained', 'launched / gained', 'was launched / had gained'],
        correctIndex: 0,
        explanation: '"two years ago" là mốc kết thúc trong quá khứ (Quá khứ đơn: launched); "so far" chỉ kết quả tích lũy đến hiện tại (Hiện tại hoàn thành: have gained).',
      },
      {
        question: 'Identify the INCORRECT sentence:',
        options: ['I have lived in Da Nang since 2021.', 'I lived in Da Nang for two years, but now I live in Hanoi.', 'I have graduated from college in 2020.', 'I graduated from college in 2020.'],
        correctIndex: 2,
        explanation: 'Có mốc thời gian xác định trong quá khứ ("in 2020") KHÔNG ĐƯỢC dùng hiện tại hoàn thành. Câu 3 là câu sai.',
      },
      {
        question: 'Fill in: "The developer _____ five bug tickets yesterday, but he _____ any today."',
        options: ['closed / has not resolved', 'has closed / did not resolve', 'closed / did not resolve', 'had closed / is not resolving'],
        correctIndex: 0,
        explanation: '"yesterday" thuộc về quá khứ đã qua (closed); "today" là khoảng thời gian chưa kết thúc (has not resolved).',
      },
      {
        question: 'Complete: "How many pull requests _____ today?"',
        options: ['have you reviewed', 'did you review', 'were you reviewed', 'had you reviewed'],
        correctIndex: 0,
        explanation: 'Khoảng thời gian hôm nay (today) vẫn đang tiếp tục, câu hỏi về thành quả dùng Hiện tại hoàn thành.',
      },
      {
        question: 'Which question asks about lifetime experience?',
        options: ['Have you ever deployed to a production Kubernetes cluster?', 'Did you deploy to Kubernetes yesterday?', 'Are you deploying to Kubernetes right now?', 'Were you deploying when it crashed?'],
        correctIndex: 0,
        explanation: '"Have you ever...?" là cấu trúc chuẩn để hỏi về trải nghiệm từ trước đến nay trong đời.',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Product Owner',
        avatar: '👩‍💼',
        text: 'Has the QA team signed off on the release build?',
        translation: 'Đội ngũ QA đã nghiệm thu phê duyệt bản build phát hành chưa?',
      },
      {
        speaker: 'QA Lead',
        avatar: '🧑‍💻',
        text: 'Yes! We completed the final regression test at 4 PM and we have just approved the release notes.',
        translation: 'Rồi ạ! Chúng tôi đã hoàn tất bài kiểm thử hồi quy cuối cùng lúc 4 giờ chiều và vừa mới phê duyệt tài liệu phát hành xong.',
      },
    ],
  },
  {
    id: 'used-to-be-used-to-get-used-to',
    title: 'Used to vs Be used to vs Get used to',
    vietnameseTitle: 'Used To & Thói Quen Thích Nghi Môi Trường Mới',
    level: 'Intermediate',
    summary: 'Phân biệt sâu sắc 3 cấu trúc dễ nhầm nhất: Used to + V (từng làm), Be used to + V-ing (đã quen với), và Get used to + V-ing (đang dần làm quen).',
    icon: '🔄',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'I', color: 'indigo', explanation: 'Chủ ngữ' },
        { label: 'Habit Marker', word: 'am used to', color: 'emerald', explanation: 'Đã quen thuộc (Be used to)' },
        { label: 'Gerund Action', word: 'reviewing code', color: 'rose', explanation: 'Động từ V-ing' },
        { label: 'Context', word: 'across multiple time zones', color: 'sky', explanation: 'Bối cảnh làm việc từ xa quốc tế' },
      ],
      fullSentence: 'I am used to reviewing code across multiple time zones.',
      translation: 'Tôi đã quen với việc thẩm định code xuyên các múi giờ khác nhau.',
    },
    tenseVariants: [
      {
        tenseName: 'Used to + V (Past Habit / Fact)',
        formula: 'S + used to + V (bare)',
        sentence: 'We used to deploy code manually before adopting CI/CD pipelines.',
        translation: 'Chúng tôi từng triển khai code thủ công trước khi áp dụng quy trình CI/CD.',
        usageContext: 'Thói quen hoặc tình trạng trong quá khứ nay không còn nữa.',
      },
      {
        tenseName: 'Be used to + V-ing (Familiar with)',
        formula: 'S + am/is/are + used to + V-ing / Noun',
        sentence: 'Senior developers are used to working under tight sprint deadlines.',
        translation: 'Các lập trình viên kỳ cựu đã quen với việc làm việc dưới áp lực deadline sprint gắt gao.',
        usageContext: 'Đã quá quen thuộc, không còn cảm thấy khó khăn hay bỡ ngỡ.',
      },
      {
        tenseName: 'Get used to + V-ing (Adaptation Process)',
        formula: 'S + get / become + used to + V-ing / Noun',
        sentence: 'The new intern is slowly getting used to our Git workflow.',
        translation: 'Bạn thực tập sinh mới đang dần làm quen với quy trình Git của nhóm chúng ta.',
        usageContext: 'Quá trình chuyển biến từ lạ lẫm sang dần quen thuộc.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'I am used to write code in JavaScript every day.',
        right: 'I am used to writing code in JavaScript every day.',
        explanation: 'Sau "be used to", "to" là giới từ, bắt buộc phải theo sau bởi danh từ hoặc V-ing ("writing").',
      },
      {
        wrong: 'Did you used to work remotely?',
        right: 'Did you use to work remotely?',
        explanation: 'Trong câu hỏi hoặc câu phủ định với trợ động từ "did/didn\'t", "used" phải đổi về nguyên thể "use".',
      },
    ],
    quickQuiz: [
      {
        question: 'When I first switched to Vim, it felt strange, but now I _____ it.',
        options: ['used to', 'am used to', 'get used to', 'use to'],
        correctIndex: 1,
        explanation: 'Nói về trạng thái hiện tại đã hoàn toàn quen thuộc: "am used to + it".',
      },
      {
        question: 'Our company _____ use monolithic architecture, but we broke it into microservices last year.',
        options: ['was used to', 'got used to', 'used to', 'is used to'],
        correctIndex: 2,
        explanation: 'Thói quen/trạng thái trong quá khứ đã chấm dứt ("used to + bare verb").',
      },
      {
        question: 'Past habit that no longer exists: "We _____ use monolithic architecture, but now we use microservices."',
        options: ['used to', 'are used to', 'got used to', 'use to'],
        correctIndex: 0,
        explanation: '"used to + V" diễn tả thói quen hoặc trạng thái trong quá khứ nay đã không còn nữa.',
      },
      {
        question: 'Accustomed to (familiarity): "After living in Tokyo for three years, she is used to _____ the crowded subway."',
        options: ['taking', 'take', 'took', 'taken'],
        correctIndex: 0,
        explanation: '"be used to + V-ing" mang nghĩa đã quen với một việc gì đó (taking).',
      },
      {
        question: 'Gradual process of becoming familiar: "Working from home was difficult at first, but I am gradually getting used to _____ my own hours."',
        options: ['managing', 'manage', 'managed', 'be manage'],
        correctIndex: 0,
        explanation: '"get used to + V-ing" chỉ quá trình đang dần dần làm quen với điều gì.',
      },
      {
        question: 'Identify the INCORRECT sentence:',
        options: ['I am used to write code in dark mode.', 'I am used to writing code in dark mode.', 'I used to code in light mode.', 'I got used to coding in dark mode.'],
        correctIndex: 0,
        explanation: 'Sau "am used to" (quen với), động từ bắt buộc phải ở dạng V-ing. Do đó câu 1 "am used to write" là sai.',
      },
      {
        question: 'Passive voice of "use": "This authentication token is used to _____ requests from client applications."',
        options: ['validate', 'validating', 'validated', 'validation'],
        correctIndex: 0,
        explanation: 'Đây là câu bị động của động từ "use" (được dùng để làm gì): "be used to + V-nguyên thể" (validate).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'New Dev',
        avatar: '👨‍🎓',
        text: 'The daily 8:30 AM standup is quite early for me. I am not a morning person.',
        translation: 'Cuộc họp standup lúc 8:30 sáng hơi sớm đối với em. Em không quen dậy sớm.',
      },
      {
        speaker: 'Senior Mentor',
        avatar: '👩‍🏫',
        text: 'Don\'t worry! It takes a couple of weeks to get used to the rhythm. You\'ll be fine.',
        translation: 'Đừng lo! Mất khoảng đôi ba tuần để dần quen với nhịp độ này thôi. Em sẽ ổn ngay mà.',
      },
    ],
  },
  {
    id: 'tag-questions-clarification',
    title: 'Tag Questions for Meeting Clarification',
    vietnameseTitle: 'Câu Hỏi Đuôi: Xác Nhận Thông Tin & Thuyết Phục Trong Họp',
    level: 'Intermediate',
    summary: 'Kỹ thuật đặt câu hỏi đuôi tự nhiên để kiểm tra tiến độ, xin xác nhận từ Tech Lead hoặc tạo sự đồng thuận trong các buổi thảo luận kỹ thuật.',
    icon: '❓',
    legoExample: {
      blocks: [
        { label: 'Statement (+)', word: 'The payment service', color: 'indigo', explanation: 'Chủ ngữ vế khẳng định' },
        { label: 'Positive Verb', word: 'is running smoothly', color: 'emerald', explanation: 'Động từ khẳng định' },
        { label: 'Comma', word: ',', color: 'amber', explanation: 'Dấu phẩy ngăn cách' },
        { label: 'Tag Question (-)', word: 'isn\'t it?', color: 'rose', explanation: 'Trợ động từ phủ định + Đại từ' },
      ],
      fullSentence: 'The payment service is running smoothly, isn\'t it?',
      translation: 'Dịch vụ thanh toán đang vận hành êm đẹp, đúng không nào?',
    },
    tenseVariants: [
      {
        tenseName: 'Positive Statement -> Negative Tag',
        formula: 'S + V(+) ..., Aux(-) + Pronoun?',
        sentence: 'You have pushed the security patch to production, haven\'t you?',
        translation: 'Bạn đã đẩy bản vá bảo mật lên môi trường production rồi, phải không?',
        usageContext: 'Mong đợi sự đồng tình xác nhận (Falling intonation: giọng đi xuống ở cuối).',
      },
      {
        tenseName: 'Negative Statement -> Positive Tag',
        formula: 'S + V(-) ..., Aux(+) + Pronoun?',
        sentence: 'The database isn\'t locked by any background migration, is it?',
        translation: 'Cơ sở dữ liệu không bị khóa bởi bất kỳ tiến trình dịch chuyển ngầm nào, đúng không?',
        usageContext: 'Kiểm tra lại một nỗi lo lắng hoặc nghi vấn kỹ thuật.',
      },
      {
        tenseName: 'Modal Auxiliary Tag',
        formula: 'S + modal ..., modal(-) + Pronoun?',
        sentence: 'We should run load tests before the Black Friday sale, shouldn\'t we?',
        translation: 'Chúng ta nên chạy kiểm thử tải trọng trước dịp siêu khuyến mãi Black Friday, đúng chứ?',
        usageContext: 'Đề xuất ý kiến mang tính xây dựng và tìm kiếm sự đồng lòng của cả team.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'Let\'s review the pull request together, don\'t we?',
        right: 'Let\'s review the pull request together, shall we?',
        explanation: 'Khi câu bắt đầu bằng "Let\'s", câu hỏi đuôi chuẩn mực bắt buộc là "shall we?".',
      },
      {
        wrong: 'Nobody noticed the API latency spike, didn\'t they?',
        right: 'Nobody noticed the API latency spike, did they?',
        explanation: 'Với các từ mang nghĩa phủ định (Nobody, Nothing, Never, Hardly), vế chính được tính là phủ định nên câu hỏi đuôi phải ở dạng khẳng định ("did they?").',
      },
    ],
    quickQuiz: [
      {
        question: 'The frontend developers haven\\\'t updated the GraphQL schema yet, _____?',
        options: ['have they', 'haven\\\'t they', 'did they', 'do they'],
        correctIndex: 0,
        explanation: 'Vế trước phủ định ("haven\\\'t updated") -> đuôi khẳng định ("have they?").',
      },
      {
        question: 'There is no memory leak in this release, _____?',
        options: ['isn\\\'t there', 'is there', 'is it', 'isn\\\'t it'],
        correctIndex: 1,
        explanation: '"There is no..." là câu phủ định có chủ ngữ giả "there", câu hỏi đuôi phải là "is there?".',
      },
      {
        question: 'Complete the tag question: "The production deploy was successful, _____?"',
        options: ['wasn\\\'t it', 'was it', 'isn\\\'t it', 'didn\\\'t it'],
        correctIndex: 0,
        explanation: 'Vế đầu khẳng định với "was" -> Câu hỏi đuôi phủ định: "wasn\\\'t it?".',
      },
      {
        question: 'Tag question with negative statement: "Our team hasn\\\'t merged the pull request yet, _____?"',
        options: ['have we', 'haven\\\'t we', 'did we', 'has it'],
        correctIndex: 0,
        explanation: 'Vế đầu phủ định ("hasn\\\'t") -> Câu hỏi đuôi khẳng định ("have we" hoặc "has it").',
      },
      {
        question: 'Imperative invitation tag question: "Let\\\'s review the system architecture diagram together, _____?"',
        options: ['shall we', 'will you', 'do we', 'aren\\\'t we'],
        correctIndex: 0,
        explanation: 'Sau lời rủ rê "Let\\\'s...", câu hỏi đuôi chuẩn luôn là "shall we?".',
      },
      {
        question: 'Negative words rule: "Nobody noticed the memory leak during QA testing, _____?"',
        options: ['did they', 'didn\\\'t they', 'did he', 'had they'],
        correctIndex: 0,
        explanation: 'Chủ ngữ "Nobody" mang nghĩa phủ định, nên câu hỏi đuôi phải ở thể khẳng định ("did they?").',
      },
      {
        question: 'Polite request tag: "Please don\\\'t share the API keys publicly, _____?"',
        options: ['will you', 'do you', 'shall we', 'can you not'],
        correctIndex: 0,
        explanation: 'Sau câu mệnh lệnh phủ định ("Please don\\\'t..."), câu hỏi đuôi là "will you?".',
      },
      {
        question: 'Tag question with negative statement: "Our team hasn\'t merged the pull request yet, _____?"',
        options: ['have we', 'haven\'t we', 'did we', 'has it'],
        correctIndex: 0,
        explanation: 'Vế đầu phủ định ("hasn\'t") -> Câu hỏi đuôi khẳng định ("have we" hoặc "has it").',
      },
      {
        question: 'Imperative invitation tag question: "Let\'s review the system architecture diagram together, _____?"',
        options: ['shall we', 'will you', 'do we', 'aren\'t we'],
        correctIndex: 0,
        explanation: 'Sau lời rủ rê "Let\'s...", câu hỏi đuôi chuẩn luôn là "shall we?".',
      },
      {
        question: 'Polite request tag: "Please don\'t share the API keys publicly, _____?"',
        options: ['will you', 'do you', 'shall we', 'can you not'],
        correctIndex: 0,
        explanation: 'Sau câu mệnh lệnh phủ định ("Please don\'t..."), câu hỏi đuôi là "will you?".',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Tech Lead',
        avatar: '👨‍💼',
        text: 'You checked all unit test cases before merging the pull request, didn\'t you?',
        translation: 'Bạn đã kiểm tra tất cả các ca kiểm thử đơn vị trước khi ghép nhánh pull request rồi, đúng không?',
      },
      {
        speaker: 'Junior Dev',
        avatar: '🧑‍💻',
        text: 'Yes, all 142 tests passed with 100% green status, so we are completely safe.',
        translation: 'Dạ rồi, tất cả 142 bài kiểm thử đều xanh 100%, nên chúng ta hoàn toàn yên tâm.',
      },
    ],
  },
  {
    id: 'causative-have-get-done',
    title: 'Causative Form: Have / Get Something Done',
    vietnameseTitle: 'Thể Sai Khiến: Nhờ Vả & Uỷ Quyền Công Việc Chuyên Nghiệp',
    level: 'Intermediate',
    summary: 'Cách diễn đạt phân công công việc, thuê ngoài hoặc nhờ đối tác phụ trách: Have someone do something, Get someone to do something, Have something done.',
    icon: '🤝',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'The CTO', color: 'indigo', explanation: 'Người uỷ quyền' },
        { label: 'Causative Verb', word: 'had', color: 'emerald', explanation: 'Động từ sai khiến (Have)' },
        { label: 'Agent', word: 'the security auditor', color: 'amber', explanation: 'Người thực hiện' },
        { label: 'Bare Verb', word: 'inspect', color: 'rose', explanation: 'Động từ nguyên mẫu không "to"' },
        { label: 'Target', word: 'our cloud architecture', color: 'sky', explanation: 'Đối tượng được kiểm tra' },
      ],
      fullSentence: 'The CTO had the security auditor inspect our cloud architecture.',
      translation: 'Giám đốc Công nghệ đã yêu cầu chuyên gia kiểm toán bảo mật kiểm tra kiến trúc đám mây của chúng tôi.',
    },
    tenseVariants: [
      {
        tenseName: 'Have someone do something (Direct Request/Duty)',
        formula: 'S + have + Person + V (bare)',
        sentence: 'I will have the DBA optimize the slow queries by this afternoon.',
        translation: 'Tôi sẽ nhờ chuyên viên cơ sở dữ liệu tối ưu các truy vấn chậm trước chiều nay.',
        usageContext: 'Giao việc hoặc nhờ người có chuyên môn phụ trách công việc theo vai trò.',
      },
      {
        tenseName: 'Get someone to do something (Persuasion)',
        formula: 'S + get + Person + to + V',
        sentence: 'We finally got the client to approve the technical specification.',
        translation: 'Cuối cùng chúng tôi cũng thuyết phục được khách hàng phê duyệt đặc tả kỹ thuật.',
        usageContext: 'Thuyết phục hoặc đàm phán thành công để ai đó đồng ý làm điều gì.',
      },
      {
        tenseName: 'Have / Get something done (Passive Causative)',
        formula: 'S + have/get + Thing + V3/ed',
        sentence: 'We need to get our mobile application penetration-tested before public launch.',
        translation: 'Chúng ta cần kiểm thử bảo mật thâm nhập cho ứng dụng di động trước khi mở bán chính thức.',
        usageContext: 'Tập trung vào kết quả công việc được hoàn thành bởi chuyên gia bên ngoài.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'I had the designer to export all asset icons.',
        right: 'I had the designer export all asset icons.',
        explanation: 'Cấu trúc với "have someone" bắt buộc dùng động từ nguyên thể KHÔNG có "to" (export). Nếu dùng "to export" phải đổi sang "got the designer to export".',
      },
      {
        wrong: 'We must get the SSL certificate renew as soon as possible.',
        right: 'We must get the SSL certificate renewed as soon as possible.',
        explanation: 'Cấu trúc bị động "get something + V3/ed": chứng chỉ SSL được gia hạn ("renewed").',
      },
    ],
    quickQuiz: [
      {
        question: 'Can you please have the infrastructure team _____ more memory to the Redis server?',
        options: ['allocate', 'to allocate', 'allocated', 'allocating'],
        correctIndex: 0,
        explanation: 'Cấu trúc "have + Person + V (bare)": have the infrastructure team allocate.',
      },
      {
        question: 'We need to get this bug report _____ to the core development team before the standup.',
        options: ['send', 'to send', 'sent', 'sending'],
        correctIndex: 2,
        explanation: 'Cấu trúc "get something + V3/ed": get this bug report sent.',
      },
      {
        question: 'Passive causative (having a service done by someone): "We need to have our servers _____ by a certified security auditor."',
        options: ['audited', 'audit', 'auditing', 'to audit'],
        correctIndex: 0,
        explanation: 'Cấu trúc bị động thể sai khiến: "have + Object + V3/ed" (have our servers audited).',
      },
      {
        question: 'Active causative with GET: "The project manager got the lead developer _____ the timeline estimation."',
        options: ['to revise', 'revise', 'revising', 'revised'],
        correctIndex: 0,
        explanation: 'Cấu trúc chủ động với GET: "get someone + to V" (get the developer to revise).',
      },
      {
        question: 'Active causative with HAVE: "The tech lead had the junior engineer _____ the unit test suite."',
        options: ['refactor', 'to refactor', 'refactored', 'refactoring'],
        correctIndex: 0,
        explanation: 'Cấu trúc chủ động với HAVE: "have someone + V-nguyên thể" (have the engineer refactor).',
      },
      {
        question: 'Active causative with MAKE (compulsion): "The strict compliance regulation made all companies _____ data encryption."',
        options: ['implement', 'to implement', 'implemented', 'implementing'],
        correctIndex: 0,
        explanation: 'Cấu trúc bắt buộc: "make someone + V-nguyên thể" (make all companies implement).',
      },
      {
        question: 'Choose the sentence that means: "I hired an expert to set up our CI/CD pipeline."',
        options: ['I had our CI/CD pipeline set up by an expert.', 'I set up our CI/CD pipeline myself.', 'I got an expert set up our pipeline.', 'I had set up an expert.'],
        correctIndex: 0,
        explanation: 'Cấu trúc "have something done by someone" thể hiện việc thuê hoặc nhờ chuyên gia thực hiện giúp.',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Project Manager',
        avatar: '👩‍💼',
        text: 'The UI looks slightly misaligned on mobile Safari. How should we handle this?',
        translation: 'Giao diện nhìn hơi bị lệch trên trình duyệt Safari di động. Chúng ta nên xử lý việc này thế nào?',
      },
      {
        speaker: 'Tech Lead',
        avatar: '👨‍💻',
        text: 'I will have our CSS specialist fix the flexbox layout and get it deployed to staging right away.',
        translation: 'Tôi sẽ bảo chuyên gia CSS sửa lại bố cục flexbox và cho triển khai lên môi trường staging ngay lập tức.',
      },
    ],
  },
  {
    id: 'modals-of-deduction-troubleshooting',
    title: 'Modals of Deduction: Must have, Can\'t have, Might have',
    vietnameseTitle: 'Động Từ Khuyết Thiếu Phỏng Đoán: Phân Tích Nguyên Nhân Sự Cố',
    level: 'Intermediate',
    summary: 'Diễn đạt mức độ chắc chắn khi truy tìm nguyên nhân gốc (Root Cause Analysis): Phỏng đoán suy luận về các tình huống kỹ thuật trong hiện tại và quá khứ.',
    icon: '🔍',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'The authentication server', color: 'indigo', explanation: 'Đối tượng được phỏng đoán' },
        { label: 'Deduction Modal', word: 'must have run out of', color: 'rose', explanation: 'Khẳng định chắc chắn 99% trong quá khứ' },
        { label: 'Resource', word: 'database connection pool slots', color: 'amber', explanation: 'Tài nguyên cạn kiệt' },
        { label: 'Evidence', word: 'during the flash sale spike', color: 'sky', explanation: 'Bằng chứng thực tế' },
      ],
      fullSentence: 'The authentication server must have run out of database connection pool slots during the flash sale spike.',
      translation: 'Máy chủ xác thực chắc chắn là đã cạn kiệt số lượng kết nối cơ sở dữ liệu trong đợt tăng đột biến flash sale.',
    },
    tenseVariants: [
      {
        tenseName: 'Must have V3 (95% Certain Positive)',
        formula: 'S + must have + V3/ed',
        sentence: 'Someone must have altered the production firewall configuration, as port 443 is blocked.',
        translation: 'Chắc chắn ai đó đã sửa cấu hình tường lửa production, vì cổng 443 hiện đang bị chặn.',
        usageContext: 'Có bằng chứng rõ ràng chứng minh sự việc chắc chắn đã xảy ra.',
      },
      {
        tenseName: 'Can\'t have V3 (95% Certain Negative)',
        formula: 'S + can\'t have + V3/ed',
        sentence: 'The hacker can\'t have decrypted user passwords because they were hashed with bcrypt.',
        translation: 'Kẻ tấn công không thể nào giải mã được mật khẩu người dùng vì chúng đã được băm bằng thuật toán bcrypt.',
        usageContext: 'Có căn cứ kỹ thuật khẳng định sự việc bất khả thi.',
      },
      {
        tenseName: 'Might / Could have V3 (50% Possibility)',
        formula: 'S + might/could/may have + V3/ed',
        sentence: 'The background worker might have timed out while exporting the oversized CSV file.',
        translation: 'Tiến trình ngầm có thể đã bị quá thời gian chờ (timeout) trong khi xuất file CSV quá dung lượng.',
        usageContext: 'Đưa ra giả thuyết khả dĩ khi đang điều tra sự cố.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'The server mustn\'t have processed the request.',
        right: 'The server can\'t have processed the request.',
        explanation: 'Để phỏng đoán chắc chắn phủ định ("chắc chắn không thể nào"), người bản xứ bắt buộc dùng "can\'t have + V3", KHÔNG DÙNG "mustn\'t have".',
      },
      {
        wrong: 'He must committed the bug yesterday.',
        right: 'He must have committed the bug yesterday.',
        explanation: 'Phỏng đoán về một hành động trong quá khứ bắt buộc phải có trợ động từ "have" + V3 ("must have committed").',
      },
    ],
    quickQuiz: [
      {
        question: 'Look at the clean error log! The deployment script _____ executed without any syntax errors.',
        options: ['must have', 'can\\\'t have', 'should', 'would'],
        correctIndex: 0,
        explanation: 'Nhật ký sạch không có lỗi là bằng chứng rõ ràng -> Chắc chắn đã thực thi suôn sẻ: "must have executed".',
      },
      {
        question: 'The intern _____ deleted the production database because he doesn\\\'t have root credentials.',
        options: ['might have', 'can\\\'t have', 'must have', 'should have'],
        correctIndex: 1,
        explanation: 'Không có quyền truy cập root chứng minh chắc chắn bạn ấy không thể nào xóa được: "can\\\'t have deleted".',
      },
      {
        question: 'Logical certainty in past (troubleshooting): "The logs show zero incoming requests. The reverse proxy _____ crashed."',
        options: ['must have', 'can\\\'t have', 'should have', 'might not'],
        correctIndex: 0,
        explanation: '"must have + V3/ed" diễn tả sự suy đoán chắc chắn 99% trong quá khứ dựa trên bằng chứng rõ ràng.',
      },
      {
        question: 'Logical impossibility: "He _____ pushed that buggy commit; he was on vacation with no laptop access."',
        options: ['can\\\'t have', 'must have', 'should have', 'might have'],
        correctIndex: 0,
        explanation: '"can\\\'t have + V3/ed" diễn tả điều chắc chắn không thể nào xảy ra trong quá khứ.',
      },
      {
        question: 'Uncertain possibility: "The API latency is unusually high. It _____ be due to database connection pool exhaustion."',
        options: ['might', 'must', 'can\\\'t', 'should'],
        correctIndex: 0,
        explanation: '"might / could + V" diễn tả khả năng có thể xảy ra ở hiện tại nhưng chưa có bằng chứng chắc chắn.',
      },
      {
        question: 'Criticism of past action: "You _____ pushed directly to production without running the automated test suite first!"',
        options: ['shouldn\\\'t have', 'mustn\\\'t have', 'can\\\'t have', 'wouldn\\\'t'],
        correctIndex: 0,
        explanation: '"shouldn\\\'t have + V3/ed" dùng để phê bình, trách móc một hành động sai lầm đáng lẽ không nên làm trong quá khứ.',
      },
      {
        question: 'Past expectation not met: "The database backup _____ finished by 6 AM, but it is still running."',
        options: ['should have', 'must have', 'could have', 'might have'],
        correctIndex: 0,
        explanation: '"should have + V3/ed" diễn đạt điều lẽ ra đã phải hoàn thành theo kế hoạch nhưng thực tế chưa xong.',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Incident Commander',
        avatar: '👨‍💼',
        text: 'All API requests are returning 504 Gateway Timeout. What happened?',
        translation: 'Tất cả yêu cầu API đều trả về mã lỗi 504 Gateway Timeout. Chuyện gì đã xảy ra vậy?',
      },
      {
        speaker: 'Site Reliability Engineer',
        avatar: '👩‍💻',
        text: 'The load balancer can\'t have failed because its health check is green. The upstream backend service must have stalled.',
        translation: 'Bộ cân bằng tải không thể nào hỏng được vì bài kiểm tra sức khỏe vẫn xanh. Chắc chắn là dịch vụ backend phía trên đã bị treo.',
      },
    ],
  },
  {
    id: 'mixed-conditionals-regrets',
    title: 'Mixed Conditionals for Tech Incident Post-Mortem',
    vietnameseTitle: 'Câu Điều Kiện Hỗn Hợp: Rút Kinh Nghiệm Sau Sự Cố',
    level: 'Advanced',
    summary: 'Kết hợp giả định quá khứ dẫn đến hệ quả hiện tại (Loại 3 + Loại 2): Đánh giá các quyết định kiến trúc và bài học kỹ thuật sau sự cố hệ thống.',
    icon: '🌪️',
    legoExample: {
      blocks: [
        { label: 'Past Condition (Type 3)', word: 'If we had configured automated backups', color: 'indigo', explanation: 'Điều kiện giả định trái quá khứ (Had + V3)' },
        { label: 'Comma', word: ',', color: 'amber', explanation: 'Dấu ngăn cách' },
        { label: 'Present Result (Type 2)', word: 'we would not be manually restoring data', color: 'rose', explanation: 'Hệ quả trái hiện tại (Would be + V-ing)' },
        { label: 'Context', word: 'right now', color: 'sky', explanation: 'Mốc thời gian ngay bây giờ' },
      ],
      fullSentence: 'If we had configured automated backups, we would not be manually restoring data right now.',
      translation: 'Nếu trước đây chúng ta cấu hình sao lưu tự động, thì ngay lúc này chúng ta đã không phải khôi phục dữ liệu bằng tay.',
    },
    tenseVariants: [
      {
        tenseName: 'Past Action -> Present Result (Most Common)',
        formula: 'If + had + V3/ed, S + would/could + V (bare) + (now / today)',
        sentence: 'If the team had refactored the legacy module last month, this bug would not exist today.',
        translation: 'Nếu nhóm đã tái cấu trúc mô-đun cũ vào tháng trước, thì lỗi này hôm nay đã không tồn tại.',
        usageContext: 'Hành động không làm trong quá khứ gây ra hậu quả nhức nhối ở hiện tại.',
      },
      {
        tenseName: 'Present Trait/State -> Past Action Result',
        formula: 'If + were / V2, S + would have + V3/ed',
        sentence: 'If our lead architect weren\'t so meticulous, we would have missed that critical race condition during testing.',
        translation: 'Nếu kiến trúc sư trưởng của chúng ta không cẩn trọng kỹ tính như vậy, thì đợt kiểm thử vừa rồi chúng ta đã bỏ lọt lỗi tương tranh nguy hiểm đó.',
        usageContext: 'Bản chất/tính cách hiện tại của một người đã giúp/ảnh hưởng đến một sự việc trong quá khứ.',
      },
      {
        tenseName: 'Continuous Mixed Conditional (Past Action -> Ongoing Present State)',
        formula: 'If + had + V3/ed, S + would be + V-ing + right now',
        sentence: 'If we had configured automated CI/CD alerts, we would not be manually tracking failed jobs right now.',
        translation: 'Nếu trước đó chúng ta cấu hình cảnh báo CI/CD tự động, thì ngay bây giờ chúng ta đã không phải theo dõi các tác vụ lỗi bằng tay.',
        usageContext: 'Hành động trong quá khứ dẫn đến trạng thái đang phải diễn ra ngay tại thời điểm nói.',
      },
      {
        tenseName: 'Inverted Mixed Conditional (Formal Post-Mortem Style)',
        formula: 'Had + S + V3/ed, S + would / could + V-bare (now)',
        sentence: 'Had the team adopted TypeScript from day one, runtime type errors would be virtually nonexistent today.',
        translation: 'Giá như nhóm áp dụng TypeScript ngay từ ngày đầu, thì các lỗi kiểu dữ liệu lúc thực thi hôm nay đã hầu như không tồn tại.',
        usageContext: 'Văn phong báo cáo sự cố cấp cao (Post-mortem), lược bỏ "If" và đảo "Had" lên đầu.',
      }
    ],
    commonMistakes: [
      {
        wrong: 'If we had implemented caching, the app would have been faster now.',
        right: 'If we had implemented caching, the app would be faster now.',
        explanation: 'Vì vế kết quả có từ "now" (ở hiện tại), mệnh đề chính phải dùng dạng Loại 2 ("would be faster"), không dùng "would have been".',
      },
      {
        wrong: 'If I was knowing Python better, I would have automated this task.',
        right: 'If I knew Python better, I would have automated this task.',
        explanation: 'Giả định năng lực hiện tại: dùng "knew" (quá khứ đơn), không dùng tiếp diễn "was knowing".',
      },
    ],
    quickQuiz: [
      {
        question: 'If the team _____ automated integration tests last quarter, we wouldn\\\'t be fixing so many regressions today.',
        options: ['wrote', 'had written', 'have written', 'write'],
        correctIndex: 1,
        explanation: 'Điều kiện trong quá khứ ("last quarter") gây ra hệ quả ở hiện tại ("today") -> Mệnh đề IF dùng quá khứ hoàn thành ("had written").',
      },
      {
        question: 'If our database server _____ so reliable, we would have suffered multiple outages last weekend.',
        options: ['weren\\\'t', 'hadn\\\'t been', 'isn\\\'t', 'won\\\'t be'],
        correctIndex: 0,
        explanation: 'Bản chất bền bỉ của máy chủ là sự thật liên tục ở hiện tại, kết hợp với hệ quả quá khứ ("last weekend") -> Dùng "weren\\\'t".',
      },
      {
        question: 'Past cause with Present result: "If we _____ clean architecture principles when designing the app two years ago, our maintenance costs _____ so high today."',
        options: ['had adopted / would not be', 'adopted / will not be', 'have adopted / would not have been', 'had adopted / were not'],
        correctIndex: 0,
        explanation: 'Điều kiện hỗn hợp (Quá khứ ảnh hưởng đến Hiện tại): If + had + V3/ed (quá khứ) -> S + would + V_nguyên thể (hiện tại: today).',
      },
      {
        question: 'Present state with Past result: "If Sarah _____ so proficient in Python, she _____ the machine learning pipeline in just two days."',
        options: ['weren\\\'t / couldn\\\'t have optimized', 'hadn\\\'t been / couldn\\\'t optimize', 'isn\\\'t / wouldn\\\'t optimize', 'were not / won\\\'t have optimized'],
        correctIndex: 0,
        explanation: 'Điều kiện hỗn hợp (Tính chất hiện tại dẫn đến kết quả quá khứ): If + were (hiện tại) -> S + could have + V3/ed (quá khứ).',
      },
      {
        question: 'Identify the mixed conditional sentence:',
        options: ['If I had studied computer science, I would be working as a software engineer now.', 'If I study computer science, I will be an engineer.', 'If I had studied computer science, I would have become an engineer.', 'If I studied computer science, I would become an engineer.'],
        correctIndex: 0,
        explanation: 'Vế If là quá khứ (had studied), vế chính là hiện tại (would be working... now) -> Mixed Conditional.',
      },
      {
        question: 'Complete: "If the server cluster _____ properly configured, we _____ facing this downtime right now."',
        options: ['had been / wouldn\\\'t be', 'was / won\\\'t be', 'is / wouldn\\\'t have been', 'has been / aren\\\'t'],
        correctIndex: 0,
        explanation: 'Hành động cấu hình trong quá khứ (had been) ảnh hưởng trực tiếp đến trạng thái sập máy chủ hiện tại (wouldn\\\'t be... right now).',
      },
      {
        question: 'Choose the correct meaning: "If he weren\\\'t afraid of public speaking, he would have delivered the keynote presentation yesterday."',
        options: ['He is naturally afraid of public speaking, so he did not deliver the keynote yesterday.', 'He delivered the keynote yesterday without fear.', 'He was afraid yesterday, but today he loves speaking.', 'He will speak at the conference tomorrow.'],
        correctIndex: 0,
        explanation: 'Anh ấy có bản tính sợ nói trước đám đông (hiện tại), nên hôm qua anh ấy đã không dám thuyết trình (quá khứ).',
      },
      {
        question: 'Choose the correct meaning: "If he weren\'t afraid of public speaking, he would have delivered the keynote presentation yesterday."',
        options: ['He is naturally afraid of public speaking, so he did not deliver the keynote yesterday.', 'He delivered the keynote yesterday without fear.', 'He was afraid yesterday, but today he loves speaking.', 'He will speak at the conference tomorrow.'],
        correctIndex: 0,
        explanation: 'Anh ấy có bản tính sợ nói trước đám đông (hiện tại), nên hôm qua anh ấy đã không dám thuyết trình (quá khứ).',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'DevOps Lead',
        avatar: '👨‍💻',
        text: 'The deployment rollback took over two hours because we didn\'t have container snapshots.',
        translation: 'Việc thu hồi bản triển khai mất hơn 2 tiếng vì chúng ta không có bản snapshot vùng chứa.',
      },
      {
        speaker: 'Engineering Manager',
        avatar: '👩‍💼',
        text: 'Exactly. If we had automated our snapshot process, our service would be fully recovered by now.',
        translation: 'Chính xác. Nếu chúng ta tự động hóa quy trình snapshot từ trước, thì giờ này dịch vụ đã phục hồi hoàn toàn rồi.',
      },
    ],
  },
  {
    id: 'reduced-relative-clauses',
    title: 'Reduced Relative Clauses in Technical Documentation',
    vietnameseTitle: 'Mệnh Đề Quan Hệ Rút Gọn Trong Tài Liệu Kỹ Thuật',
    level: 'Advanced',
    summary: 'Kỹ thuật rút gọn câu bằng V-ing (chủ động) và V-ed (bị động) giúp viết email, PR description và tài liệu API súc tích, chuẩn văn phong kỹ sư chuyên nghiệp.',
    icon: '✂️',
    legoExample: {
      blocks: [
        { label: 'Core Subject', word: 'The microservice', color: 'indigo', explanation: 'Danh từ chính' },
        { label: 'Reduced Active Clause', word: 'handling user authentication', color: 'emerald', explanation: 'Rút gọn từ "which handles" -> V-ing' },
        { label: 'Main Verb', word: 'scales', color: 'rose', explanation: 'Động từ chính của câu' },
        { label: 'Adverbial Context', word: 'automatically on Kubernetes', color: 'sky', explanation: 'Trạng từ bổ nghĩa' },
      ],
      fullSentence: 'The microservice handling user authentication scales automatically on Kubernetes.',
      translation: 'Dịch vụ vi mô xử lý xác thực người dùng tự động co giãn linh hoạt trên nền tảng Kubernetes.',
    },
    tenseVariants: [
      {
        tenseName: 'Active Reduction (V-ing)',
        formula: 'Noun + V-ing + Object (from: Noun + who/which + Verb)',
        sentence: 'Developers working on this repository must follow the Gitflow branching strategy.',
        translation: 'Các lập trình viên làm việc trên kho lưu trữ này phải tuân thủ chiến lược phân nhánh Gitflow.',
        usageContext: 'Rút gọn mệnh đề quan hệ dạng chủ động (bỏ who/which, chuyển động từ sang V-ing).',
      },
      {
        tenseName: 'Passive Reduction (V3/ed)',
        formula: 'Noun + V3/ed (from: Noun + which/that + be + V3/ed)',
        sentence: 'The critical vulnerability discovered by our security scanner was patched within an hour.',
        translation: 'Lỗ hổng nghiêm trọng được phát hiện bởi trình quét bảo mật đã được vá trong vòng một giờ.',
        usageContext: 'Rút gọn mệnh đề quan hệ dạng bị động (bỏ which/that và to be, giữ lại V3/ed).',
      },
      {
        tenseName: 'To-Infinitive Reduction for First / Only / Purpose',
        formula: 'The first / last / only + Noun + to + V',
        sentence: 'Tuấn was the first engineer in our team to achieve AWS Solutions Architect certification.',
        translation: 'Tuấn là kỹ sư đầu tiên trong nhóm chúng tôi đạt được chứng chỉ Kiến trúc sư Giải pháp AWS.',
        usageContext: 'Rút gọn khi danh từ có các từ bổ nghĩa như the first, the second, the only, the best.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'The pull request merging by lead yesterday contained several conflicts.',
        right: 'The pull request merged by the lead yesterday contained several conflicts.',
        explanation: 'Pull request "được ghép nhánh" bởi lead là nghĩa bị động, phải dùng V3/ed ("merged"), không dùng V-ing.',
      },
      {
        wrong: 'Any user wants to delete their account should contact support.',
        right: 'Any user wanting to delete their account should contact support.',
        explanation: 'Rút gọn chủ động từ "Any user who wants" thành "Any user wanting", không thể để hai động từ chia thì đứng liền nhau.',
      },
    ],
    quickQuiz: [
      {
        question: 'All requests _____ the rate limit will automatically receive an HTTP 429 status code.',
        options: ['exceeded', 'exceeding', 'are exceeding', 'which exceeding'],
        correctIndex: 1,
        explanation: 'Yêu cầu "vượt quá" hạn mức là hành động chủ động -> Rút gọn bằng V-ing ("exceeding").',
      },
      {
        question: 'The database migration script _____ during the weekend deployment caused zero downtime.',
        options: ['executing', 'executed', 'was executed', 'which executed by'],
        correctIndex: 1,
        explanation: 'Kịch bản di chuyển dữ liệu "được thực thi" mang nghĩa bị động -> Rút gọn bằng V3/ed ("executed").',
      },
      {
        question: 'Reduce the active clause: "The background worker that processes transaction logs needs more memory." -> "The background worker _____ transaction logs needs more memory."',
        options: ['processing', 'processed', 'being processed', 'to process'],
        correctIndex: 0,
        explanation: 'Rút gọn mệnh đề quan hệ chủ động (that processes) -> dùng V-ing: "processing".',
      },
      {
        question: 'Reduce the passive clause: "The security patch which was released yesterday fixed three zero-day vulnerabilities." -> "The security patch _____ yesterday fixed three zero-day vulnerabilities."',
        options: ['released', 'releasing', 'being released', 'to release'],
        correctIndex: 0,
        explanation: 'Rút gọn mệnh đề quan hệ bị động (which was released) -> dùng V3/ed: "released".',
      },
      {
        question: 'Infinitive reduction after "the first / the only": "He was the only engineer who _____ the legacy codebase." -> "He was the only engineer _____ the legacy codebase."',
        options: ['to understand', 'understanding', 'understood', 'understand'],
        correctIndex: 0,
        explanation: 'Sau các cụm từ "the first, the second, the only, the best", mệnh đề quan hệ được rút gọn bằng "to V": "to understand".',
      },
      {
        question: 'Choose the sentence with correct reduced relative clause:',
        options: ['All pull requests failing automated checks will be blocked.', 'All pull requests fail automated checks will be blocked.', 'All pull requests to failing automated checks will be blocked.', 'All pull requests failed by automated checks will be blocked.'],
        correctIndex: 0,
        explanation: '"failing automated checks" rút gọn từ "that fail automated checks" (chủ động -> V-ing).',
      },
      {
        question: 'Identify the full form of: "The encrypted tokens stored in Redis expire after 24 hours."',
        options: ['The encrypted tokens which are stored in Redis expire after 24 hours.', 'The encrypted tokens storing in Redis expire.', 'The encrypted tokens that stores in Redis expire.', 'The encrypted tokens which store in Redis expire.'],
        correctIndex: 0,
        explanation: '"stored in Redis" là dạng rút gọn bị động của "which are stored in Redis".',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Security Auditor',
        avatar: '🕵️‍♂️',
        text: 'What is your policy regarding third-party packages added to the package.json file?',
        translation: 'Chính sách của bạn đối với các gói thư viện bên thứ ba được thêm vào tệp package.json là gì?',
      },
      {
        speaker: 'Lead Architect',
        avatar: '👩‍💻',
        text: 'Any external package containing unverified code is automatically rejected by our CI pipeline.',
        translation: 'Bất kỳ gói thư viện bên ngoài nào chứa mã nguồn chưa qua kiểm định đều tự động bị đường ống CI từ chối.',
      },
    ],
  },
  {
    id: 'quantifiers-data-reporting',
    title: 'Quantifiers & Determiners in Data & Analytics',
    vietnameseTitle: 'Lượng Từ: Báo Cáo Số Liệu & Metrics Chính Xác',
    level: 'Beginner',
    summary: 'Sử dụng chuẩn xác Few vs A Few, Little vs A Little, None of vs Neither of khi báo cáo số liệu bug, hiệu năng hệ thống và KPI dự án công nghệ.',
    icon: '📊',
    legoExample: {
      blocks: [
        { label: 'Quantifier', word: 'A few', color: 'indigo', explanation: 'Một vài (mang ý nghĩa tích cực, có đủ dùng)' },
        { label: 'Countable Noun', word: 'critical bugs', color: 'rose', explanation: 'Danh từ đếm được số nhiều' },
        { label: 'Verb Phrase', word: 'were identified and resolved', color: 'emerald', explanation: 'Động từ bị động' },
        { label: 'Milestone', word: 'before the staging freeze', color: 'sky', explanation: 'Mốc thời gian đóng băng code' },
      ],
      fullSentence: 'A few critical bugs were identified and resolved before the staging freeze.',
      translation: 'Một vài lỗi nghiêm trọng đã được phát hiện và xử lý xong trước khi đóng băng môi trường staging.',
    },
    tenseVariants: [
      {
        tenseName: 'Few vs A Few (Countable Nouns)',
        formula: 'Few = Rất ít, gần như không có (Tiêu cực) | A few = Một vài, đủ để làm gì đó (Tích cực)',
        sentence: 'Few developers understand the internal mechanics of this legacy assembly module.',
        translation: 'Rất ít lập trình viên hiểu được cơ chế hoạt động bên trong của mô-đun hợp ngữ cũ này.',
        usageContext: 'Báo cáo sự khan hiếm nhân lực hoặc số lượng cực kỳ hạn chế.',
      },
      {
        tenseName: 'Little vs A Little (Uncountable Nouns)',
        formula: 'Little = Rất ít, không đủ (Tiêu cực) | A little = Một chút, còn một lượng nhỏ (Tích cực)',
        sentence: 'We have little time left before the demo, so let\'s focus only on core user flows.',
        translation: 'Chúng ta còn rất ít thời gian trước giờ demo, vì vậy hãy chỉ tập trung vào các luồng người dùng cốt lõi.',
        usageContext: 'Đánh giá dung lượng tài nguyên thời gian, bộ nhớ, hoặc độ trễ.',
      },
      {
        tenseName: 'Neither of vs None of',
        formula: 'Neither of + 2 things | None of + 3 or more things',
        sentence: 'None of the microservices experienced downtime during the server migration.',
        translation: 'Không có bất kỳ dịch vụ vi mô nào trong số các dịch vụ bị gián đoạn hoạt động trong đợt chuyển đổi máy chủ.',
        usageContext: 'Khẳng định tỷ lệ khả dụng 100% khi so sánh từ 3 thực thể trở lên.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'There is few memory available on the host machine.',
        right: 'There is little memory available on the host machine.',
        explanation: 'Bộ nhớ "memory" là danh từ không đếm được, bắt buộc phải dùng "little/a little", không dùng "few".',
      },
      {
        wrong: 'Neither of the five servers responded to the ping request.',
        right: 'None of the five servers responded to the ping request.',
        explanation: '"Neither" chỉ dùng cho đúng 2 đối tượng. Từ 3 đối tượng trở lên (five servers) phải dùng "None of".',
      },
    ],
    quickQuiz: [
      {
        question: 'Fortunately, we experienced _____ latency issues after deploying the Redis caching layer.',
        options: ['few', 'little', 'a few', 'many'],
        correctIndex: 0,
        explanation: '"latency issues" có đuôi "s" là danh từ đếm được số nhiều. Từ "Fortunately" (May mắn thay) ngụ ý rất ít vấn đề xảy ra -> dùng "few".',
      },
      {
        question: 'We tested two different load balancing algorithms, but _____ of them met our throughput requirements.',
        options: ['none', 'neither', 'either', 'both'],
        correctIndex: 1,
        explanation: 'So sánh giữa 2 giải thuật ("two different algorithms") và mang nghĩa phủ định ("nhưng không cái nào đạt") -> Dùng "neither".',
      },
      {
        question: 'Uncountable noun with little/few: "We have _____ memory remaining on the Redis node, so we must purge expired keys."',
        options: ['little', 'few', 'a few', 'many'],
        correctIndex: 0,
        explanation: '"Memory" là danh từ không đếm được. "little memory" mang nghĩa gần như không còn bộ nhớ (tiêu cực, cần giải phóng gấp).',
      },
      {
        question: 'Countable noun: "Only _____ developers attended the early morning sprint standup."',
        options: ['a few', 'a little', 'much', 'little'],
        correctIndex: 0,
        explanation: '"Developers" là danh từ đếm được số nhiều, đi với "a few" (một vài người).',
      },
      {
        question: 'Formal reporting: "_____ of the tested endpoints returned a 200 OK status code."',
        options: ['The majority', 'The most', 'Much', 'A little'],
        correctIndex: 0,
        explanation: 'Trong báo cáo kỹ thuật, "The majority of + Danh từ số nhiều" (Phần lớn...) là cấu trúc chuẩn xác.',
      },
      {
        question: 'Complete: "There was _____ controversy regarding the decision to migrate from Vue to React."',
        options: ['a great deal of', 'a large number of', 'many', 'few'],
        correctIndex: 0,
        explanation: '"Controversy" (sự tranh cãi) là danh từ không đếm được, đi với "a great deal of" hoặc "a lot of".',
      },
      {
        question: 'Choose the sentence with correct subject-verb agreement with quantifiers:',
        options: ['A number of critical bugs have been reported today.', 'The number of critical bugs have been reported today.', 'A number of critical bugs has been reported today.', 'A number of critical bug has been reported today.'],
        correctIndex: 0,
        explanation: '"A number of + Danh từ số nhiều" chia động từ ở số nhiều ("have been reported").',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Client Manager',
        avatar: '👨‍💼',
        text: 'How much downtime should we expect during the scheduled maintenance tonight?',
        translation: 'Chúng ta dự kiến hệ thống sẽ gián đoạn bao lâu trong đợt bảo trì định kỳ tối nay?',
      },
      {
        speaker: 'DevOps Lead',
        avatar: '👩‍💻',
        text: 'Very little downtime, probably less than two minutes, thanks to our zero-downtime rolling update strategy.',
        translation: 'Rất ít thời gian gián đoạn, có lẽ chưa đầy hai phút, nhờ vào chiến lược cập nhật luân phiên không thời gian chết của chúng tôi.',
      },
    ],
  },
  {
    id: 'phrasal-verbs-workplace-flow',
    title: 'Essential Phrasal Verbs in Workplace Daily Flow',
    vietnameseTitle: 'Cụm Động Từ (Phrasal Verbs) Tối Quan Trọng Trong Công Việc',
    level: 'Intermediate',
    summary: 'Nắm vững quy tắc ngữ pháp đặt câu và sắc thái sử dụng của các cụm động từ cốt lõi trong ngành công nghệ: look into, figure out, wrap up, walk through, back up, roll back.',
    icon: '⚡',
    legoExample: {
      blocks: [
        { label: 'Subject', word: 'I', color: 'indigo', explanation: 'Chủ ngữ' },
        { label: 'Phrasal Verb', word: 'will look into', color: 'emerald', explanation: 'Cụm động từ: Điều tra / Tìm hiểu kỹ' },
        { label: 'Object', word: 'the payment webhook failure', color: 'rose', explanation: 'Tân ngữ: Sự cố webhook thanh toán' },
        { label: 'Action Promise', word: 'and report back by noon', color: 'sky', explanation: 'Cam kết hành động trước buổi trưa' },
      ],
      fullSentence: 'I will look into the payment webhook failure and report back by noon.',
      translation: 'Tôi sẽ tìm hiểu kỹ nguyên nhân lỗi webhook thanh toán và báo cáo lại trước buổi trưa.',
    },
    tenseVariants: [
      {
        tenseName: 'Separable Phrasal Verbs (Đại từ ở giữa)',
        formula: 'Verb + Pronoun (it/them) + Particle',
        sentence: 'When you identify a suspicious log entry, make sure to back it up immediately.',
        translation: 'Khi bạn phát hiện một dòng nhật ký đáng ngờ, hãy nhớ sao lưu nó lại ngay lập tức.',
        usageContext: 'Với các cụm như back up, figure out, roll back, khi tân ngữ là đại từ (it/them), đại từ BẮT BUỘC phải nằm ở giữa.',
      },
      {
        tenseName: 'Inseparable Phrasal Verbs (Tân ngữ luôn đi sau)',
        formula: 'Verb + Preposition + Object',
        sentence: 'Our team ran into a weird dependency conflict during the build process.',
        translation: 'Nhóm chúng tôi đã tình cờ đụng độ một xung đột phụ thuộc kỳ lạ trong quá trình build.',
        usageContext: 'Các cụm như run into, look into, come across không thể tách rời.',
      },
      {
        tenseName: 'Three-Word Phrasal Verbs',
        formula: 'Verb + Particle + Preposition + Object',
        sentence: 'We must not cut corners just to catch up with the competitors\' release date.',
        translation: 'Chúng ta không được làm ẩu chỉ để bắt kịp ngày phát hành của đối thủ cạnh tranh.',
        usageContext: 'Các cụm 3 từ cố định như catch up with, run out of, look forward to.',
      },
    ],
    commonMistakes: [
      {
        wrong: 'We need to roll back it right now.',
        right: 'We need to roll it back right now.',
        explanation: 'Với cụm động từ tách rời ("roll back"), khi tân ngữ là đại từ "it", bắt buộc phải đặt ở giữa: "roll it back".',
      },
      {
        wrong: 'I look forward to hear your feedback on the pull request.',
        right: 'I look forward to hearing your feedback on the pull request.',
        explanation: 'Trong cụm "look forward to", "to" là giới từ, do đó động từ theo sau bắt buộc phải ở dạng V-ing ("hearing").',
      },
    ],
    quickQuiz: [
      {
        question: 'The legacy authentication service has an unhandled exception, but the developer finally figured _____ after hours of debugging.',
        options: ['out it', 'it out', 'it up', 'up it'],
        correctIndex: 1,
        explanation: '"figure out" là cụm động từ tách được. Với đại từ "it", bắt buộc phải nói: "figured it out".',
      },
      {
        question: 'Could you please _____ the new architecture diagram with the client during tomorrow\\\'s meeting?',
        options: ['walk through', 'walk it through', 'walk over', 'walk by'],
        correctIndex: 0,
        explanation: '"walk through something" mang nghĩa giải thích/hướng dẫn chi tiết từng bước cho ai đó.',
      },
      {
        question: 'Separable phrasal verb with pronoun: "We discovered an edge case, and our tech lead asked us to _____ right away."',
        options: ['iron it out', 'iron out it', 'iron out them', 'ironing it out'],
        correctIndex: 0,
        explanation: 'Với các cụm động từ tách được ("iron out" = giải quyết triệt để), khi tân ngữ là đại từ "it/them", bắt buộc phải đứng ở giữa: "iron it out".',
      },
      {
        question: 'Three-word phrasal verb: "We are struggling to _____ the relentless release schedule of our competitors."',
        options: ['keep up with', 'keep up to', 'keep on with', 'keep away from'],
        correctIndex: 0,
        explanation: '"keep up with someone/something" là cụm 3 từ cố định mang nghĩa theo kịp / bắt kịp tốc độ của ai đó.',
      },
      {
        question: 'Rollback incident: "Due to database index corruption, the DevOps team had to _____ the release to version 3.1."',
        options: ['roll back', 'roll out', 'roll over', 'roll through'],
        correctIndex: 0,
        explanation: '"roll back" mang nghĩa hoàn tác / quay trở lại phiên bản phần mềm trước đó.',
      },
      {
        question: 'Code walkthrough: "Could you please _____ me through the payment refund process?"',
        options: ['walk', 'step', 'talk', 'guide to'],
        correctIndex: 0,
        explanation: '"walk someone through something" nghĩa là giải thích, hướng dẫn chi tiết từng bước cho ai đó.',
      },
      {
        question: 'Complete the standup update: "I spent yesterday afternoon _____ why the authentication token was expiring prematurely."',
        options: ['figuring out', 'running into', 'calling off', 'pointing out'],
        correctIndex: 0,
        explanation: '"figure out" mang nghĩa tìm ra nguyên nhân / hiểu được điều gì sau quá trình suy nghĩ, điều tra.',
      }
    ],
    realLifeDialogue: [
      {
        speaker: 'Scrum Master',
        avatar: '👩‍💼',
        text: 'Are there any blockers preventing us from wrapping up Sprint 24 today?',
        translation: 'Có trở ngại nào ngăn cản chúng ta khép lại Sprint 24 trong ngày hôm nay không?',
      },
      {
        speaker: 'Backend Dev',
        avatar: '🧑‍💻',
        text: 'No blockers. We just ironed out the last edge case and we are ready to deploy.',
        translation: 'Dạ không có trở ngại nào. Chúng tôi vừa giải quyết triệt để trường hợp ngoại lệ cuối cùng và sẵn sàng triển khai rồi.',
      },
    ],
  }
];

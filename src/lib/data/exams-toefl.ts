import type { ExamSet } from './exams';

/**
 * TOEFL iBT Official Practice Test 1 (định dạng áp dụng từ 21/01/2026).
 * Nguồn: ETS "TOEFL iBT Practice Test 1" (PDF công khai tại ets.org).
 * 54 câu trắc nghiệm (Reading 20 + Listening 34) kèm đáp án chính thức ETS,
 * cùng các task điền chữ cái / xếp câu / viết / nói theo đúng định dạng mới.
 * Bổ sung giải thích tiếng Việt để luyện tập.
 */
export const TOEFL_ETS_P1_SET: ExamSet = {
  id: 'exam-toefl-ibt-ets-p1',
  title: 'TOEFL iBT Official Practice Test 1 (2026 Format)',
  vietnameseTitle: 'Đề Thi 20: TOEFL iBT - Đề Thực Hành Chính Thức ETS (Form 2026)',
  category: 'toefl',
  categoryLabel: '🎓 TOEFL iBT Quốc Tế',
  level: 'B2 - C1',
  durationMinutes: 90,
  passingScore: 60,
  expReward: 800,
  coinReward: 1000,
  badgeIcon: '🎓',
  summary:
    'Đề thực hành chính thức ETS TOEFL iBT (form 2026): Reading 2 module (điền chữ cái + đọc hiểu) và Listening 2 module (chọn phản hồi, hội thoại, bài giảng — có transcript gốc) + Writing 12 nhiệm vụ (xếp câu, email, thảo luận học thuật) + Speaking 2 nhiệm vụ. Có đáp án chuẩn ETS và giải thích tiếng Việt.',
  questions: [
    // ============ READING MODULE 1 ============
    {
      id: 'q20-r1-fill',
      section: 'reading',
      sectionName: 'Reading M1: Complete the Words (Điền chữ cái)',
      taskType: 'writing',
      question:
        'Reading Module 1 - Task 1: Complete the Words. Điền phần chữ cái còn thiếu vào 10 chỗ trống trong đoạn văn (nhập lần lượt 10 cụm, cách nhau bởi dấu phẩy).',
      writingPrompt:
        'Đoạn văn (mỗi "_" là một chữ cái bị khuyết — điền đúng phần còn thiếu của từ):\n\nWe know from drawings that have been preserved in caves for over 10,000 years that early humans performed dances as a group activity. We mi[1] think th[2] prehistoric peo[3] concentrated on[4] on ba[5] survival. How[6], it i[7] clear fr[8] the rec[9] that dan[10] was important to them. They recorded more drawings of dances than of any other group activity. Dances served various purposes, including ritualistic communication with the divine, storytelling, and social cohesion.\n\nVí dụ: mi[1] = might → nhập "ght".',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án chính thức ETS: 1 ght (might), 2 at (that), 3 ple (people), 4 ly (only), 5 sic (basic), 6 ever (however), 7 s (is), 8 om (from), 9 ord (record), 10 cing (dancing).',
      pedagogicalTip:
        'Dạng "Complete the Words" (2026): đọc cả câu để suy ra từ đúng ngữ pháp và ngữ nghĩa — quan hệ từ (however), thì của động từ (is), giới từ (from) là các điểm hay được kiểm tra.',
    },
    {
      id: 'q20-r11',
      section: 'reading',
      sectionName: 'Reading M1: Read in Daily Life (Notice)',
      question: 'What type of business issued the notice?',
      readingPassage:
        'Municipal Charter\nSign up for paperless billing statements today.\nSafe, convenient, easy. Enroll in paperless billing to receive monthly savings account statements in an electronic PDF document. Access your Municipal Charter account through the mobile app and select account preferences in the upper right-hand corner to enroll.',
      options: ['An Internet provider', 'A computer company', 'A paper company', 'A bank'],
      correctIndex: 3,
      explanation:
        'Thông báo nói về "savings account statements" (sao kê tài khoản tiết kiệm) — đặc trưng dịch vụ ngân hàng → Municipal Charter là một ngân hàng (a bank).',
      pedagogicalTip:
        'Câu hỏi loại hình doanh nghiệp: tìm từ khóa chuyên ngành trong văn bản (savings account → bank).',
    },
    {
      id: 'q20-r12',
      section: 'reading',
      sectionName: 'Reading M1: Read in Daily Life (Notice)',
      question: 'How can customers enroll in paperless billing?',
      readingPassage:
        'Municipal Charter\nSign up for paperless billing statements today.\nSafe, convenient, easy. Enroll in paperless billing to receive monthly savings account statements in an electronic PDF document. Access your Municipal Charter account through the mobile app and select account preferences in the upper right-hand corner to enroll.',
      options: [
        'By visiting a Municipal Charter office',
        'By accessing the Municipal Charter website',
        'By using the Municipal Charter app',
        'By calling a Municipal Charter customer service representative',
      ],
      correctIndex: 2,
      explanation:
        'Văn bản hướng dẫn: "Access your Municipal Charter account through the mobile app... to enroll" → đăng ký qua ứng dụng di động (the app).',
      pedagogicalTip:
        'Phân biệt website với app: văn bản chỉ nhắc "mobile app" — đừng suy diễn thêm.',
    },
    {
      id: 'q20-r13',
      section: 'reading',
      sectionName: 'Reading M1: Read in Daily Life (Social Post)',
      question: 'What is the main purpose of the post?',
      readingPassage:
        "Sofia Baker: Every Saturday, our local farmer's market is the place to be! Fresh fruits, veggies, homemade goodies, and unique crafts await you. The Thompson family's organic produce is a must-try, known for its quality and cordial service. Their stall is always bustling with customers eager to buy fresh, pesticide-free vegetables from the welcoming staff.\nDon't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options. The smell of freshly baked goods fills the air, and these treats sell out fast!\nIn addition to food, the market sells handmade crafts like jewelry, pottery, and textiles. These unique items make perfect gifts and support local artisans. Plus, enjoy live music while you shop. Talented local musicians help create a vibrant atmosphere, and the community spirit makes it a delightful experience for all. See you there!",
      options: [
        'To explain the benefits of organic farming',
        'To describe the variety of products available at the farmer\u2019s market',
        'To compare different farmer\u2019s markets in the area',
        'To offer advice on starting a stall at the farmer\u2019s market',
      ],
      correctIndex: 1,
      explanation:
        'Bài đăng liệt kê lần lượt các sản phẩm của chợ (trái cây, rau, bánh, đồ thủ công, nhạc sống...) → mục đích chính là mô tả sự đa dạng hàng hóa của chợ.',
      pedagogicalTip:
        'Câu hỏi main purpose của bài ngắn: chọn đáp án bao quát TOÀN bài, không chỉ một chi tiết (như "organic farming").',
    },
    {
      id: 'q20-r14',
      section: 'reading',
      sectionName: 'Reading M1: Read in Daily Life (Social Post)',
      question: "What reason is given for the popularity of the Thompson family's stall?",
      readingPassage:
        "Sofia Baker: Every Saturday, our local farmer's market is the place to be! ... The Thompson family's organic produce is a must-try, known for its quality and cordial service. Their stall is always bustling with customers eager to buy fresh, pesticide-free vegetables from the welcoming staff.\nDon't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options. ...",
      options: [
        'They offer cooking tips and recipes.',
        'They offer the lowest prices at the market.',
        'They provide friendly service and excellent products.',
        'They have a beautiful and well-decorated stall.',
      ],
      correctIndex: 2,
      explanation:
        'Văn bản ghi: "known for its quality and cordial service" + "welcoming staff" → chất lượng tốt và thái độ phục vụ thân thiện.',
      pedagogicalTip:
        'Paraphrase: cordial/welcoming = friendly; quality produce = excellent products.',
    },
    {
      id: 'q20-r15',
      section: 'reading',
      sectionName: 'Reading M1: Read in Daily Life (Social Post)',
      question: 'Why do customers go to the bakery stall early?',
      readingPassage:
        "Sofia Baker: ... Don't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options. The smell of freshly baked goods fills the air, and these treats sell out fast! ...",
      options: [
        'To get the free samples given in mornings',
        'To get freshly baked bread and pastries before they are gone',
        'To meet the famous baker',
        'To take advantage of early morning discounts',
      ],
      correctIndex: 1,
      explanation:
        'Văn bản: "get there early for the best bread and pastries... these treats sell out fast!" → đến sớm để mua được bánh tươi trước khi hết hàng.',
      pedagogicalTip:
        '"sell out fast" = bán hết nhanh → lý do phải đến sớm. Học các cụm chỉ sự khan hiếm trong bài đọc.',
    },
    {
      id: 'q20-r16',
      section: 'reading',
      sectionName: 'Reading M1: Academic Passage — The Mirror Test',
      question: 'What is the passage mainly about?',
      readingPassage:
        'The Mirror Test\nVery young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?\nFor many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape\'s body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.\nApes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.',
      options: [
        'Stages of early childhood development',
        'Research on animal cognition',
        'Differences between apes, elephants, and dolphins',
        'Recent experiments on fish',
      ],
      correctIndex: 1,
      explanation:
        'Bài viết xoay quanh nghiên cứu về khả năng tự nhận biết của động vật (mirror test với tinh tinh, voi, cá heo, cá cleaner) → nghiên cứu nhận thức động vật (animal cognition).',
      pedagogicalTip:
        'Câu hỏi chủ đề chính: gom các đối tượng được nhắc (apes, elephants, dolphins, fish) về một phạm trù chung (animal cognition).',
    },
    {
      id: 'q20-r17',
      section: 'reading',
      sectionName: 'Reading M1: Academic Passage — The Mirror Test',
      question: 'The word "milestone" in the first sentence is closest in meaning to',
      readingPassage:
        'Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. ...',
      options: ['accomplishment', 'distance', 'weight', 'discovery'],
      correctIndex: 0,
      explanation:
        '"achieve this milestone" = đạt được cột mốc (thành tựu phát triển) → accomplishment. "milestone" còn nghĩa cột cây số, nhưng ở đây là nghĩa ẩn dụ.',
      pedagogicalTip:
        'Từ đồng nghĩa: dùng ngữ cảnh "achieve + milestone" (đạt được) để chọn accomplishment, không chọn nghĩa đen (distance).',
    },
    {
      id: 'q20-r18',
      section: 'reading',
      sectionName: 'Reading M1: Academic Passage — The Mirror Test',
      question: "Why did scientists put colored marks on animals' bodies?",
      readingPassage:
        "For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the \"mirror test,\" which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.",
      options: [
        'It made it possible to track the animals\u2019 movements.',
        'It helped them determine whether the animals recognized themselves.',
        'It made it easier to tell the animals apart.',
        'It showed whether some animals can detect color differences.',
      ],
      correctIndex: 1,
      explanation:
        'Văn bản giải thích: nếu con vật cố gỡ vết màu trên chính mình, các nhà khoa học biết nó NHẬN RA hình phản chiếu là nó → đánh dấu để kiểm tra khả năng tự nhận biết.',
      pedagogicalTip:
        'Câu hỏi why: đọc ngay câu điều kiện "If the ape tried to remove the mark... scientists knew that..." — đó là mục đích.',
    },
    {
      id: 'q20-r19',
      section: 'reading',
      sectionName: 'Reading M1: Academic Passage — The Mirror Test',
      question: 'According to the passage, all of the following are true about elephants EXCEPT:',
      readingPassage:
        'Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals.',
      options: [
        'They can recognize themselves in mirrors.',
        'They are highly intelligent animals.',
        'They possess qualities in common with apes.',
        'They understand certain signs from other animals.',
      ],
      correctIndex: 3,
      explanation:
        'Bài chỉ nói voi: nhận ra mình trong gương (A ✓), rất thông minh (B ✓), có điểm giống tinh tinh (C ✓). Không hề nói voi hiểu ký hiệu từ động vật khác → D là đáp án EXCEPT.',
      pedagogicalTip:
        'Câu hỏi EXCEPT: 3 đáp án có thông tin trong bài, 1 đáp án KHÔNG — kiểm tra từng đáp án với văn bản.',
    },
    {
      id: 'q20-r20',
      section: 'reading',
      sectionName: 'Reading M1: Academic Passage — The Mirror Test',
      question: 'Why does the author mention cleaner fish?',
      readingPassage:
        'But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.',
      options: [
        'To suggest that a wide range of animals may possess self-awareness',
        'To imply that ocean animals are highly intelligent',
        'To demonstrate a flaw in a recent experiment',
        'To provide an example of an animal that does not recognize itself',
      ],
      correctIndex: 0,
      explanation:
        'Ngay sau ví dụ cá cleaner: "This suggests that even less intelligent animals may possess more self-awareness than previously suspected" → gợi ý nhiều loài (kể cả kém thông minh) có thể có khả năng tự nhận biết.',
      pedagogicalTip:
        'Câu hỏi "why does the author mention X": tìm câu kết luận ngay sau ví dụ — thường là mục đích của tác giả.',
    },
    // ============ READING MODULE 2 ============
    {
      id: 'q20-r2-fill',
      section: 'reading',
      sectionName: 'Reading M2: Complete the Words (Điền chữ cái)',
      taskType: 'writing',
      question:
        'Reading Module 2 - Task 1: Complete the Words. Điền phần chữ cái còn thiếu vào 10 chỗ trống (nhập lần lượt 10 cụm, cách nhau bởi dấu phẩy).',
      writingPrompt:
        'Đoạn văn (mỗi "[n]" là một chỗ trống):\n\nThe human brain is a complex organ responsible for controlling all bodily functions and enabling thought, emotion, and memory. It i[1] divided in[2] several reg[3], each wi[4] specific ro[5]. The cerebrum, i[6] largest pa[7], is invo[8] in cogn[9] functions su[10] as reasoning, planning, and language. The cerebellum coordinates movement and balance, while the brainstem controls vital bodily functions like breathing and heart rate. Together, they enable the brain to perform its various tasks.\n\nHướng dẫn: mỗi [n] đánh dấu vị trí chữ cái bị khuyết; điền phần chữ cái còn thiếu của từ (ví dụ "in[2]" → "to" để thành "into").',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án chính thức ETS: 1 s (is), 2 to (into), 3 ions (regions), 4 th (with), 5 les (roles), 6 ts (its), 7 rt (part), 8 lved (involved), 9 itive (cognitive), 10 ch (such).',
      pedagogicalTip:
        'Chú ý phân biệt trợ động từ (is), giới từ (into/with), danh từ số nhiều (regions/roles) — dạng bài kiểm tra ngữ pháp ẩn trong đoạn văn.',
    },
    {
      id: 'q20-r211',
      section: 'reading',
      sectionName: 'Reading M2: Read in Daily Life (E-mail)',
      question: 'When is the date of the art workshop?',
      readingPassage:
        'To: edward56L@dmail.com\nFrom: artforeveryone@dmail.com\nDate: 10/09/2025\nSubject: Art Workshop Reservation Confirmation\n\nDear Ms. Edwards,\nThe reservation for the art workshop that you made on September 10th has been confirmed. The workshop will take place on September 20th at 3:00 PM. All necessary arts supplies will be provided, but please bring your own apron or smock.\n\nBest regards,\nLaura Bennett',
      options: ['September 10th', 'September 12th', 'September 20th', 'September 30th'],
      correctIndex: 2,
      explanation:
        'Email xác nhận: "The workshop will take place on September 20th at 3:00 PM" → ngày diễn ra hội thảo là 20/9. Ngày 10/9 là ngày ĐẶT chỗ (bẫy).',
      pedagogicalTip:
        'Bẫy ngày tháng: phân biệt ngày đăng ký (made on...) với ngày diễn ra (will take place on...).',
    },
    {
      id: 'q20-r212',
      section: 'reading',
      sectionName: 'Reading M2: Read in Daily Life (E-mail)',
      question: 'What should Ms. Edwards bring to the workshop?',
      readingPassage:
        'The reservation for the art workshop that you made on September 10th has been confirmed. The workshop will take place on September 20th at 3:00 PM. All necessary arts supplies will be provided, but please bring your own apron or smock.\n\nBest regards,\nLaura Bennett',
      options: ['A payment method', 'Extra paint', 'A protective garment', 'Proof of reservation'],
      correctIndex: 2,
      explanation:
        '"Please bring your own apron or smock" — tạp dề/áo khoác chống bẩn = protective garment. Đồ dùng vẽ được cung cấp sẵn (không cần mang sơn).',
      pedagogicalTip:
        'Paraphrase: apron/smock = a protective garment (đồ bảo hộ). Học từ vựng đồ vật thường gặp.',
    },
    {
      id: 'q20-r213',
      section: 'reading',
      sectionName: 'Reading M2: Read in Daily Life (E-mail)',
      question: 'What is the main purpose of the email?',
      readingPassage:
        "To: nguyenbooklover@dmail.com\nFrom: part.gymworkers@dmail.com\nSubject: You're Invited - Bring Friends & Family to Our Grand Opening!\n\nDear Ms. Nguyen,\nWe're excited to invite you—and your friends and family—to the grand opening of our new branch at 25 Orchid Street, happening next Monday.\nThis event is a great opportunity to explore our state-of-the-art facility, featuring top-tier equipment, energizing group classes, and expert personal training.\nThis celebration, exclusively for our valued members and their guests, will include guided tours, live fitness demonstrations, and complimentary refreshments. It's the perfect chance to experience our community-focused approach to wellness and introduce others to a space designed for all fitness levels.\nBring your friends and family! We're offering a special one-day-only discount on memberships for all attendees.\nFor questions or to RSVP, contact our customer service team at 555-1234.\n\nWarm regards,\nJohn Parker",
      options: [
        'To attract customers to a new fitness center',
        'To provide Ms. Nguyen with an opportunity to provide expert personal training',
        'To celebrate Ms. Nguyen\u2019s achievements in wellness',
        'To announce a discount available to fitness-center members',
      ],
      correctIndex: 0,
      explanation:
        'Email mời thành viên và người thân đến khai trương chi nhánh mới, giới thiệu cơ sở vật chất + ưu đãi → mục đích là thu hút khách đến trung tâm thể hình mới.',
      pedagogicalTip:
        'Đừng chọn đáp án chỉ đúng một phần (the discount) — mục đích chính bao quát cả email (invite → attract customers).',
    },
    {
      id: 'q20-r214',
      section: 'reading',
      sectionName: 'Reading M2: Read in Daily Life (E-mail)',
      question: "What can be inferred about Ms. Nguyen's relationship with the fitness center?",
      readingPassage:
        "This celebration, exclusively for our valued members and their guests, will include guided tours, live fitness demonstrations, and complimentary refreshments.",
      options: [
        'She helps the fitness center to organize activities.',
        'She has already explored the new facility.',
        'She is a member at one of the fitness center\u2019s other locations.',
        'She is new to using fitness centers and exercise equipment.',
      ],
      correctIndex: 2,
      explanation:
        'Sự kiện "exclusively for our valued members and their guests" + lời mời "you—and your friends and family... to the grand opening of our new branch" → Ms. Nguyen là thành viên hiện tại ở một chi nhánh khác.',
      pedagogicalTip:
        'Câu hỏi suy luận: ghép "valued members" + "new branch" → cô ấy là thành viên ở chi nhánh cũ.',
    },
    {
      id: 'q20-r215',
      section: 'reading',
      sectionName: 'Reading M2: Read in Daily Life (E-mail)',
      question: 'The new fitness center is intended for use by which of the following groups of people?',
      readingPassage:
        "It's the perfect chance to experience our community-focused approach to wellness and introduce others to a space designed for all fitness levels.",
      options: [
        'Expert personal trainers',
        'Top-tier athletes',
        'Existing fitness-center members',
        'Community members of all fitness levels',
      ],
      correctIndex: 3,
      explanation:
        '"A space designed for all fitness levels" → dành cho mọi người ở mọi trình độ thể lực (all fitness levels), không riêng vận động viên hay thành viên cũ.',
      pedagogicalTip:
        'Tìm cụm giới hạn phạm vi trong bài: "designed for all fitness levels" → đáp án "of all fitness levels".',
    },
    {
      id: 'q20-r216',
      section: 'reading',
      sectionName: 'Reading M2: Academic Passage — The Paradox of Choice',
      question: 'Which of the following best states a main idea of the passage?',
      readingPassage:
        'The Paradox of Choice\nThe paradox of choice, a concept popularized by psychologist Barry Schwartz, suggests that more options can lead to less satisfaction. While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. This paradox implies that the vast array of possibilities available today might actually diminish consumer contentment, as the fear of making the wrong choice looms large.\nResearch supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. The limited selection eased the decision process, reducing the pressure to find the \'perfect\' option and making the experience more enjoyable. This phenomenon reveals that fewer choices can sometimes make consumers happier, which is a valuable insight for marketers and retailers aiming to boost satisfaction by curating their offerings.\nThe paradox also has broader implications. In individualistic cultures, where personal choice is highly valued, the burden of decision-making can be significant. Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.',
      options: [
        'Effective marketing strategies focus on increasing product options.',
        'Modern consumer culture is driven by a demand for fewer products.',
        'Individualism enhances consumer contentment.',
        'Limiting consumer choices can lead to higher satisfaction.',
      ],
      correctIndex: 3,
      explanation:
        'Luận điểm xuyên suốt: quá nhiều lựa chọn làm giảm hài lòng; ít lựa chọn hơn (6 loại mứt thay vì 24) → khách mua nhiều hơn, hài lòng hơn. Đáp án D tóm đúng ý chính.',
      pedagogicalTip:
        'Main idea: chọn câu khái quát đúng toàn bài; loại các đáp án sai hướng (tăng options, individualism enhances...).',
    },
    {
      id: 'q20-r217',
      section: 'reading',
      sectionName: 'Reading M2: Academic Passage — The Paradox of Choice',
      question: 'What is one effect of decision fatigue as mentioned in the passage?',
      readingPassage:
        'While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. ... the fear of making the wrong choice looms large.',
      options: [
        'Desire to make the same choices as other consumers',
        'Anxiety about making the wrong choice',
        'Preference for consumer cultures',
        'Enhanced freedom to choose',
      ],
      correctIndex: 1,
      explanation:
        'Đoạn 1 nêu: quá nhiều lựa chọn gây anxiety and decision fatigue + "the fear of making the wrong choice" → tác động là lo lắng chọn sai.',
      pedagogicalTip:
        'Câu hỏi detail: "fear of making the wrong choice" ≈ "anxiety about making the wrong choice" — paraphrase gần như trực tiếp.',
    },
    {
      id: 'q20-r218',
      section: 'reading',
      sectionName: 'Reading M2: Academic Passage — The Paradox of Choice',
      question: 'Why does the author mention Sheena Iyengar\u2019s experiment?',
      readingPassage:
        "Research supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. ... This phenomenon reveals that fewer choices can sometimes make consumers happier...",
      options: [
        'To highlight the effectiveness of marketing strategies',
        'To explain the methodology used in consumer psychology',
        'To provide evidence supporting the paradox of choice',
        'To criticize the abundance of products in modern markets',
      ],
      correctIndex: 2,
      explanation:
        'Câu mở đầu đoạn: "Research supports this notion" — thí nghiệm được nêu để làm BẰNG CHỨNG ủng hộ nghịch lý lựa chọn.',
      pedagogicalTip:
        'Câu hỏi why mention: đọc câu chủ đề ngay trước ví dụ ("Research supports this notion") — đó là mục đích.',
    },
    {
      id: 'q20-r219',
      section: 'reading',
      sectionName: 'Reading M2: Academic Passage — The Paradox of Choice',
      question: 'The word "curating" in the passage is closest in meaning to',
      readingPassage:
        '...which is a valuable insight for marketers and retailers aiming to boost satisfaction by curating their offerings.',
      options: ['eliminating', 'organizing', 'increasing', 'changing'],
      correctIndex: 1,
      explanation:
        '"Curating their offerings" = tuyển chọn/sắp xếp có chủ đích danh mục sản phẩm (như giám tuyển) → organizing. Không phải loại bỏ hoàn toàn (eliminating) hay tăng thêm (increasing).',
      pedagogicalTip:
        'Curate = chọn lọc và tổ chức cẩn thận. Trong marketing, "curated selection" = danh mục được tuyển chọn.',
    },
    {
      id: 'q20-r220',
      section: 'reading',
      sectionName: 'Reading M2: Academic Passage — The Paradox of Choice',
      question: 'What can be inferred about consumers in collectivist cultures?',
      readingPassage:
        'Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.',
      options: [
        'They tend to report lower levels of satisfaction.',
        'They are more affected by the paradox of choice.',
        'They generally have fewer choices available.',
        'They prefer individual decision-making.',
      ],
      correctIndex: 2,
      explanation:
        'Văn bản: "collectivist cultures, which often provide fewer choices" → có thể suy ra họ thường có ít lựa chọn hơn; họ lại báo mức hài lòng CAO hơn (loại A).',
      pedagogicalTip:
        'Câu hỏi suy luận trực tiếp: đáp án C chỉ diễn đạt lại thông tin "often provide fewer choices".',
    },
    // ============ LISTENING MODULE 1 ============
    {
      id: 'q20-l11',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: Didn\u2019t I just see you in the library an hour ago?\n(A) As a matter of fact, I was returning a book.\n(B) Yes, you can find it in the reference section.\n(C) I don\u2019t think I\u2019ll have enough time to do that.\n(D) Actually, I think I can get there a little earlier.',
      speakerRole: 'Listen and Choose a Response',
      options: [
        'As a matter of fact, I was returning a book.',
        'Yes, you can find it in the reference section.',
        'I don\u2019t think I\u2019ll have enough time to do that.',
        'Actually, I think I can get there a little earlier.',
      ],
      correctIndex: 0,
      explanation:
        'Câu hỏi dạng xác nhận (Didn\u2019t I just see you...?) → phản hồi hợp lý là giải thích lý do có mặt: "I was returning a book". (B) nói về vị trí sách — lạc đề.',
      pedagogicalTip:
        'Dạng "Choose a Response": xác định chức năng câu nói (hỏi/xác nhận/đề nghị) rồi chọn phản hồi đúng chức năng.',
    },
    {
      id: 'q20-l12',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Man: Where is the nearest bus stop?\n(A) I nearly missed the bus.\n(B) Every 30 minutes.\n(C) I can help you find it.\n(D) I\u2019ll take the subway instead.',
      speakerRole: 'Listen and Choose a Response',
      options: ['I nearly missed the bus.', 'Every 30 minutes.', 'I can help you find it.', "I'll take the subway instead."],
      correctIndex: 2,
      explanation:
        'Câu hỏi vị trí (Where is...?) → trả lời giúp tìm: "I can help you find it". (B) "Every 30 minutes" trả lời cho How often.',
      pedagogicalTip:
        'Bẫy: "Every 30 minutes" nghe hợp với bus nhưng sai loại câu hỏi (where ≠ how often).',
    },
    {
      id: 'q20-l13',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: How do I contact customer service?\n(A) Yes, you\u2019re allowed to do that.\n(B) Use the convenient chat feature.\n(C) No, I don\u2019t mind.\n(D) They provide good service.',
      speakerRole: 'Listen and Choose a Response',
      options: [
        'Yes, you\u2019re allowed to do that.',
        'Use the convenient chat feature.',
        'No, I don\u2019t mind.',
        'They provide good service.',
      ],
      correctIndex: 1,
      explanation:
        'Câu hỏi cách thức (How do I...?) → đưa hướng dẫn cụ thể: "Use the convenient chat feature".',
      pedagogicalTip:
        'Câu hỏi How → đáp án là cách làm/công cụ. (A)(C) là câu trả lời Yes/No — sai loại.',
    },
    {
      id: 'q20-l14',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: I\u2019m afraid I\u2019m not available this evening.\n(A) Oh, that\u2019s too early.\n(B) How about tomorrow night then?\n(C) She arrived this afternoon.\n(D) No, that\u2019s not necessary.',
      speakerRole: 'Listen and Choose a Response',
      options: ["Oh, that's too early.", 'How about tomorrow night then?', 'She arrived this afternoon.', "No, that's not necessary."],
      correctIndex: 1,
      explanation:
        'Người nói không rảnh tối nay → đề xuất phương án khác: "How about tomorrow night then?" (thế còn tối mai?).',
      pedagogicalTip:
        'Khi người nói từ chối lịch hẹn, phản hồi tự nhiên là đề xuất thời gian/địa điểm khác.',
    },
    {
      id: 'q20-l15',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Man: Isn\u2019t the post office open today?\n(A) No, it\u2019s my package.\n(B) It\u2019s just around the corner!\n(C) I think he\u2019s come home already.\n(D) Let\u2019s check the schedule online.',
      speakerRole: 'Listen and Choose a Response',
      options: ["No, it's my package.", "It's just around the corner!", "I think he's come home already.", "Let's check the schedule online."],
      correctIndex: 3,
      explanation:
        'Câu hỏi nghi vấn phủ định (Isn\u2019t the post office open today?) — người nói không chắc → phản hồi "Let\u2019s check the schedule online" (cùng kiểm tra lịch).',
      pedagogicalTip:
        'Với câu hỏi tu từ/không chắc chắn, đáp án hay là đề xuất cùng kiểm tra/giải quyết thông tin.',
    },
    {
      id: 'q20-l16',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: If you need me, just text.\n(A) I can help you with that.\n(B) You don\u2019t need any more information.\n(C) You have a lot of questions, don\u2019t you?\n(D) You haven\u2019t given me your number yet.',
      speakerRole: 'Listen and Choose a Response',
      options: [
        'I can help you with that.',
        'You don\u2019t need any more information.',
        'You have a lot of questions, don\u2019t you?',
        'You haven\u2019t given me your number yet.',
      ],
      correctIndex: 3,
      explanation:
        'Người phụ nữ nói "cứ nhắn tin cho tôi" nhưng chưa cho số → phản hồi logic: "You haven\u2019t given me your number yet" (bạn chưa cho tôi số mà).',
      pedagogicalTip:
        'Dạng câu "If you need me, just text" hàm ý đã trao đổi số liên lạc — đáp án khai thác điểm chưa hợp lý này.',
    },
    {
      id: 'q20-l17',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: So the store is open for business all weekend?\n(A) Yes, there is a major power outage.\n(B) Yes, it\u2019s under renovation.\n(C) Yes, it\u2019s closed all day on Sunday.\n(D) Yes, they\u2019re having a huge sale.',
      speakerRole: 'Listen and Choose a Response',
      options: [
        'Yes, there is a major power outage.',
        'Yes, it\u2019s under renovation.',
        'Yes, it\u2019s closed all day on Sunday.',
        'Yes, they\u2019re having a huge sale.',
      ],
      correctIndex: 3,
      explanation:
        'Câu hỏi "mở cửa cả cuối tuần?" → xác nhận hợp lý kèm thông tin tích cực: "they\u2019re having a huge sale" (đang giảm giá lớn). (C) mâu thuẫn (đóng cả Chủ nhật).',
      pedagogicalTip:
        'Loại đáp án mâu thuẫn với chính câu xác nhận (open all weekend ≠ closed on Sunday).',
    },
    {
      id: 'q20-l18',
      section: 'listening',
      sectionName: 'Listening M1: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Man: Did you attend the seminar?\n(A) I overslept.\n(B) No, not very well.\n(C) Have you asked your professor?\n(D) I forgot to look.',
      speakerRole: 'Listen and Choose a Response',
      options: ['I overslept.', 'No, not very well.', 'Have you asked your professor?', 'I forgot to look.'],
      correctIndex: 0,
      explanation:
        'Câu hỏi Yes/No "Did you attend the seminar?" → lý do không tham dự: "I overslept" (tôi ngủ quên) = ngầm trả lời "No".',
      pedagogicalTip:
        'Đáp án có thể KHÔNG có từ Yes/No nhưng hàm ý trả lời — "I overslept" = không đến được.',
    },
    {
      id: 'q20-l19',
      section: 'listening',
      sectionName: 'Listening M1: Conversation (Supermarket)',
      question: 'What does the woman imply that she was about to do?',
      audioScript:
        'Woman: Need anything from the supermarket?\nMan: Huh? Aren\u2019t we getting ready to go see that play in a few minutes?\nWoman: That\u2019s tomorrow.\nMan: Oh. Wow, I\u2019d forget my head if it wasn\u2019t screwed on\u2026. Guess I don\u2019t need to change my clothes after all.\nWoman: So, you weren\u2019t planning to prepare dinner?\nMan: No, but I can. What do you want?\nWoman: Just something light and healthy. So, can you go shopping instead?\nMan: Yeah, sure. How about salmon and salad? Want anything else?\nWoman: No, that\u2019s good. Thanks!',
      speakerRole: 'Two Speakers at Home',
      options: ['See a play', 'Change her clothes', 'Go shopping', 'Eat dinner'],
      correctIndex: 2,
      explanation:
        'Người phụ nữ mở đầu: "Need anything from the supermarket?" và sau đó hỏi "can you go shopping instead?" → cô ấy đang chuẩn bị đi siêu thị (go shopping).',
      pedagogicalTip:
        'Câu hỏi imply: ghép câu mở đầu (hỏi mua gì ở siêu thị) + câu chốt (nhờ đi mua thay) → suy ra ý định ban đầu.',
    },
    {
      id: 'q20-l110',
      section: 'listening',
      sectionName: 'Listening M1: Conversation (Supermarket)',
      question: 'Why does the man say "I\u2019d forget my head if it wasn\u2019t screwed on"?',
      audioScript:
        'Woman: Need anything from the supermarket?\nMan: Huh? Aren\u2019t we getting ready to go see that play in a few minutes?\nWoman: That\u2019s tomorrow.',
      speakerRole: 'Two Speakers at Home',
      options: [
        'He forgot what the woman wanted him to buy.',
        'He forgot about the timing of their plans.',
        'He forgot what they were going to eat for dinner.',
        'He forgot to buy salmon and salad at the supermarket.',
      ],
      correctIndex: 1,
      explanation:
        'Anh ấy tưởng tối nay đi xem kịch nhưng thực ra là ngày mai → quên THỜI GIAN của kế hoạch (timing of their plans), nên tự trào "quên cả đầu".',
      pedagogicalTip:
        'Thành ngữ tự trào "I\u2019d forget my head if it wasn\u2019t screwed on" = hay quên — nhưng phải xác định quên ĐIỀU GÌ trong ngữ cảnh.',
    },
    {
      id: 'q20-l111',
      section: 'listening',
      sectionName: 'Listening M1: Conversation (Air-conditioning)',
      question: 'Why did the woman call a technician?',
      audioScript:
        'Man: Did you see the maintenance request about the air-conditioning?\nWoman: Yes, I called the technician this morning. They said someone should be here shortly.\nMan: That\u2019s a relief. It\u2019s getting uncomfortably warm in here.\nWoman: I know—I called as soon as I noticed. Hopefully, it\u2019s just a minor issue and they can get it working again without too much delay. In the meantime, why don\u2019t you go out to lunch early? Maybe it\u2019ll be better when you get back.',
      speakerRole: 'Two Office Workers',
      options: ['An air-conditioner is leaking.', 'A room is too hot.', 'An elevator needs maintenance.', 'A window will not open.'],
      correctIndex: 1,
      explanation:
        'Man nói: "It\u2019s getting uncomfortably warm in here" — phòng quá nóng nên mới gọi thợ sửa điều hòa. Không nhắc đến rò nước hay thang máy.',
      pedagogicalTip:
        'Câu hỏi why: ghép sự việc (gọi thợ điều hòa) với lý do được nêu (phòng nóng) — không suy diễn thêm.',
    },
    {
      id: 'q20-l112',
      section: 'listening',
      sectionName: 'Listening M1: Conversation (Air-conditioning)',
      question: 'What does the woman suggest the man do?',
      audioScript:
        'Woman: ... In the meantime, why don\u2019t you go out to lunch early? Maybe it\u2019ll be better when you get back.',
      speakerRole: 'Two Office Workers',
      options: ['Finish an assignment early', 'Wait for a service agent', 'Open a door', 'Take a break early'],
      correctIndex: 3,
      explanation:
        '"Why don\u2019t you go out to lunch early?" → gợi ý đi ăn trưa sớm (nghỉ giải lao sớm) để lúc quay lại phòng đã mát hơn.',
      pedagogicalTip:
        'Cấu trúc gợi ý "Why don\u2019t you...?" — đáp án thường là hành động được nhắc, ở dạng paraphrase (go out to lunch = take a break).',
    },
    {
      id: 'q20-l113',
      section: 'listening',
      sectionName: 'Listening M1: Announcement (Guest Lecture)',
      question: 'What is the announcement about?',
      audioScript:
        'Man: Good afternoon, everyone. I am excited to inform you that Dr. Cynthia Palmer, a renowned expert in environmental science, will be giving a guest lecture next Monday at 2 PM in Waldman Auditorium. Dr. Palmer will discuss the latest advancements in sustainable energy solutions and their impact on global climate change. Due to her popularity and the high interest in her work, I highly recommend arriving early to secure a seat.',
      speakerRole: 'Announcement in a Classroom',
      options: [
        'A guest lecture',
        'A different location for a class',
        'Requirements for a class',
        'A new university science course',
      ],
      correctIndex: 0,
      explanation:
        '"Dr. Cynthia Palmer... will be giving a guest lecture" → thông báo về một buổi diễn giảng khách mời (guest lecture).',
      pedagogicalTip:
        'Câu hỏi chủ đề thông báo: nghe câu chứa động từ chính (will be giving a guest lecture).',
    },
    {
      id: 'q20-l114',
      section: 'listening',
      sectionName: 'Listening M1: Announcement (Guest Lecture)',
      question: 'Why does the professor mention Dr. Palmer\u2019s popularity?',
      audioScript:
        'Man: ... Due to her popularity and the high interest in her work, I highly recommend arriving early to secure a seat.',
      speakerRole: 'Announcement in a Classroom',
      options: [
        'To encourage students to read her work',
        'To indicate why she was invited to the university',
        'To compare her to other invited experts',
        'To explain why students should arrive early',
      ],
      correctIndex: 3,
      explanation:
        '"Due to her popularity..., I highly recommend arriving early" → mục đích nêu sự nổi tiếng là để giải thích nên đến sớm giữ chỗ.',
      pedagogicalTip:
        'Cụm "Due to X, ... recommend Y" — X là lý do dẫn đến lời khuyên Y; câu hỏi hỏi mục đích nêu X.',
    },
    {
      id: 'q20-l115',
      section: 'listening',
      sectionName: 'Listening M1: Podcast (Two Types of Fascination)',
      question: 'What is the topic of the talk?',
      audioScript:
        'Podcast Host: Did you see that new thriller movie that came out last week? I did and loved it. The action, the plot twists... I was totally captivated. Time just flew by. Not a single thought occurred to me that was unrelated to the movie. What I experienced is what psychologists call hard fascination. Hard fascination means intense focus and concentration. ... There\u2019s another type of fascination—soft fascination. There\u2019s still effortless attention...',
      speakerRole: 'Podcast about Psychology',
      options: ['How psychologists study attention', 'How to keep the mind focused', 'Two types of fascination', 'The benefits of hard fascination'],
      correctIndex: 2,
      explanation:
        'Người nói giới thiệu và so sánh HAI loại fascination: hard fascination và soft fascination → chủ đề là hai loại fascination.',
      pedagogicalTip:
        'Chủ đề bài nói: chú ý cấu trúc đối lập "There\u2019s another type..." — dấu hiệu bài nói về nhiều loại/phạm trù.',
    },
    {
      id: 'q20-l116',
      section: 'listening',
      sectionName: 'Listening M1: Podcast (Two Types of Fascination)',
      question: 'Why does the speaker mention a movie?',
      audioScript:
        'Podcast Host: Did you see that new thriller movie that came out last week? I did and loved it. ... What I experienced is what psychologists call hard fascination. Hard fascination means intense focus and concentration.',
      speakerRole: 'Podcast about Psychology',
      options: [
        'To compare different types of movies',
        'To introduce a concept in psychology',
        'To explain how movies affect emotions',
        'To encourage listeners to watch more movies',
      ],
      correctIndex: 1,
      explanation:
        'Câu chuyện xem phim là ví dụ trải nghiệm dẫn vào khái niệm "hard fascination" → dùng để giới thiệu một khái niệm tâm lý học.',
      pedagogicalTip:
        'Câu hỏi why mention: ví dụ mở đầu bài giảng/podcast thường để dẫn nhập khái niệm chính.',
    },
    {
      id: 'q20-l117',
      section: 'listening',
      sectionName: 'Listening M1: Podcast (Two Types of Fascination)',
      question: 'What does the speaker say about her walk in the park?',
      audioScript:
        'Podcast Host: There\u2019s another type of fascination—soft fascination. There\u2019s still effortless attention, meaning that no special effort is required for you to stay focused, but there\u2019s still room for other thoughts. When I take a walk in the park and look at the flowers and trees, for example, I might be thinking in the back of my mind about my dinner plans.',
      speakerRole: 'Podcast about Psychology',
      options: [
        'It is similar to her experience watching a good movie.',
        'Her mind has space for thoughts unrelated to nature.',
        'She needs to put in special effort to stay focused on flowers and trees.',
        'She gets mental fatigue from her mind engaging in hard fascination.',
      ],
      correctIndex: 1,
      explanation:
        'Ví dụ về soft fascination: dạo công viên nhưng "in the back of my mind" vẫn nghĩ về kế hoạch bữa tối → đầu vẫn có chỗ cho suy nghĩ không liên quan đến thiên nhiên. Không cần nỗ lực đặc biệt (loại C).',
      pedagogicalTip:
        'Chú ý phủ định: "no special effort is required" → loại đáp án nói "needs to put in special effort".',
    },
    {
      id: 'q20-l118',
      section: 'listening',
      sectionName: 'Listening M1: Podcast (Two Types of Fascination)',
      question: 'What does the speaker say about Default Mode Network?',
      audioScript:
        'Podcast Host: Soft fascination, in contrast, engages a different part of the brain—the DMN, or Default Mode Network, which soothes the mind and helps combat mental fatigue. So next time you feel like your mind is on overload, turn off the TV, put down your phone. Take a walk, or simply sit and stare at the clouds.',
      speakerRole: 'Podcast about Psychology',
      options: [
        'It is involved in soft fascination.',
        'It leads to irritability and stress.',
        'It is easily tired from overuse.',
        'Its effect is unknown to psychologists.',
      ],
      correctIndex: 0,
      explanation:
        '"Soft fascination... engages... the DMN, or Default Mode Network" → DMN liên quan đến soft fascination; nó làm dịu đầu óc (soothes the mind).',
      pedagogicalTip:
        'Bẫy B/C mô tả hard fascination (irritable, stressed, tired) — kiểm tra gán đúng khái niệm nào với khái niệm nào.',
    },
    // ============ LISTENING MODULE 2 ============
    {
      id: 'q20-l21',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: Who is the new manager?\n(A) She started last week.\n(B) I\u2019m unsure, but I can find out.\n(C) Let\u2019s welcome the new manager.\n(D) The position has been filled.',
      speakerRole: 'Listen and Choose a Response',
      options: ['She started last week.', 'I\u2019m unsure, but I can find out.', "Let's welcome the new manager.", 'The position has been filled.'],
      correctIndex: 1,
      explanation:
        'Câu hỏi "Who is...?" → người trả lời không biết và đề nghị tìm giúp: "I\u2019m unsure, but I can find out".',
      pedagogicalTip:
        'Đáp án hợp lệ cho câu hỏi Wh- cũng có thể là thừa nhận chưa biết + đề nghị hỗ trợ.',
    },
    {
      id: 'q20-l22',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Man: When is the due date for the report?\n(A) Please wait while I look that up.\n(B) Give me some dates.\n(C) No, I have another due date.\n(D) Yes, that\u2019s correct.',
      speakerRole: 'Listen and Choose a Response',
      options: [
        'Please wait while I look that up.',
        'Give me some dates.',
        'No, I have another due date.',
        'Yes, that\u2019s correct.',
      ],
      correctIndex: 0,
      explanation:
        '"When is the due date...?" hỏi thời hạn → người trả lời cần tra cứu: "Please wait while I look that up".',
      pedagogicalTip:
        'Câu hỏi When → đáp án chấp nhận được có thể là phản hồi quy trình (chờ tra cứu), không nhất thiết nêu ngày cụ thể.',
    },
    {
      id: 'q20-l23',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Man: I\u2019m going to get some groceries.\n(A) Every Wednesday.\n(B) In aisle 4.\n(C) The cinema is not open today.\n(D) Let\u2019s go together.',
      speakerRole: 'Listen and Choose a Response',
      options: ['Every Wednesday.', 'In aisle 4.', 'The cinema is not open today.', "Let's go together."],
      correctIndex: 3,
      explanation:
        'Thông báo ý định "I\u2019m going to get some groceries" → phản hồi tự nhiên là tham gia: "Let\u2019s go together".',
      pedagogicalTip:
        'Với câu trần thuật về kế hoạch, đáp án hay gặp: đề nghị cùng làm/đi cùng hoặc hỏi thêm chi tiết.',
    },
    {
      id: 'q20-l24',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: Would you like a copy of my notes?\n(A) The research facility.\n(B) That would be great.\n(C) The break is in an hour.\n(D) Two bullet points.',
      speakerRole: 'Listen and Choose a Response',
      options: ['The research facility.', 'That would be great.', 'The break is in an hour.', 'Two bullet points.'],
      correctIndex: 1,
      explanation:
        'Lời đề nghị "Would you like...?" → chấp nhận lịch sự: "That would be great."',
      pedagogicalTip:
        'Câu hỏi đề nghị (Would you like...?) → đáp án cảm ơn/chấp nhận hoặc từ chối lịch sự.',
    },
    {
      id: 'q20-l25',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Man: Sami and Layla are on their way to the caf\u00e9.\n(A) Should we join them?\n(B) Did you like the concert?\n(C) Yesterday evening.\n(D) The best coffee.',
      speakerRole: 'Listen and Choose a Response',
      options: ['Should we join them?', 'Did you like the concert?', 'Yesterday evening.', 'The best coffee.'],
      correctIndex: 0,
      explanation:
        'Thông tin hai người đang đến quán cà phê → phản hồi hợp lý: "Should we join them?" (mình có nên đến cùng không?).',
      pedagogicalTip:
        'Dạng câu trần thuật cập nhật tình hình → đáp án liên quan trực tiếp (join them / meet them).',
    },
    {
      id: 'q20-l26',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: I\u2019d like to hear your thoughts on the job candidates.\n(A) I\u2019m revising my r\u00e9sum\u00e9.\n(B) I\u2019ll set up a meeting for us to talk.\n(C) She just got a promotion.\n(D) Yes, the training is complete.',
      speakerRole: 'Listen and Choose a Response',
      options: [
        'I\u2019m revising my r\u00e9sum\u00e9.',
        'I\u2019ll set up a meeting for us to talk.',
        'She just got a promotion.',
        'Yes, the training is complete.',
      ],
      correctIndex: 1,
      explanation:
        'Người nói muốn nghe ý kiến về ứng viên → phản hồi tổ chức trao đổi: "I\u2019ll set up a meeting for us to talk".',
      pedagogicalTip:
        'Lời đề nghị chia sẻ ý kiến → đáp án hay là sắp xếp buổi trao đổi (meeting) — hợp logic công việc.',
    },
    {
      id: 'q20-l27',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Woman: How much does expedited shipping cost?\n(A) It\u2019s one of many.\n(B) Twice last week.\n(C) We don\u2019t offer that.\n(D) I\u2019d like the bill, please.',
      speakerRole: 'Listen and Choose a Response',
      options: ["It's one of many.", 'Twice last week.', 'We don\u2019t offer that.', "I'd like the bill, please."],
      correctIndex: 2,
      explanation:
        'Hỏi giá dịch vụ giao nhanh → đáp án hợp lý: dịch vụ đó không được cung cấp "We don\u2019t offer that".',
      pedagogicalTip:
        'Đáp án có thể PHỦ ĐỊNH dịch vụ (không cung cấp) — vẫn là phản hồi đúng cho câu hỏi.',
    },
    {
      id: 'q20-l28',
      section: 'listening',
      sectionName: 'Listening M2: Listen and Choose a Response',
      question: 'Listen and Choose a Response: chọn phản hồi phù hợp nhất cho câu bạn nghe.',
      audioScript:
        'Man: If you need more information, contact Ms. Lee.\n(A) I can help with that.\n(B) What is her role in the company?\n(C) You ask a lot of questions.\n(D) And whom should I contact?',
      speakerRole: 'Listen and Choose a Response',
      options: [
        'I can help with that.',
        'What is her role in the company?',
        'You ask a lot of questions.',
        'And whom should I contact?',
      ],
      correctIndex: 1,
      explanation:
        'Được giới thiệu liên hệ Ms. Lee → hỏi thêm thông tin về cô ấy: "What is her role in the company?" (vai trò của cô ấy là gì?).',
      pedagogicalTip:
        'Sau lời giới thiệu một người, đáp án hay gặp là câu hỏi về danh tính/vai trò của người đó.',
    },
    {
      id: 'q20-l29',
      section: 'listening',
      sectionName: 'Listening M2: Conversation (Smartphone vs Tablet)',
      question: 'What is the man trying to decide between?',
      audioScript:
        'Man: I\u2019m trying to decide whether to get a smartphone or a tablet. What do you think?\nWoman: It depends on what you need it for. If you want something portable and easy to use on the go, a smartphone is better.\nMan: That\u2019s true. But I like the larger screen on a tablet for watching videos and reading.\nWoman: In that case....\nMan: I better think about it some more.',
      speakerRole: 'Two Friends',
      options: [
        'A laptop and a smartphone',
        'A smartphone and a tablet',
        'A tablet and a desktop computer',
        'A smartphone and a smartwatch',
      ],
      correctIndex: 1,
      explanation:
        'Người đàn ông nói rõ: "I\u2019m trying to decide whether to get a smartphone or a tablet" → đang cân nhắc giữa điện thoại và máy tính bảng.',
      pedagogicalTip:
        'Câu hỏi "decide between" → nghe ngay câu đầu tiên có "decide whether to get X or Y".',
    },
    {
      id: 'q20-l210',
      section: 'listening',
      sectionName: 'Listening M2: Conversation (Smartphone vs Tablet)',
      question: 'What reason does the woman give for her suggestion?',
      audioScript:
        'Woman: It depends on what you need it for. If you want something portable and easy to use on the go, a smartphone is better.',
      speakerRole: 'Two Friends',
      options: ['The device is cheaper.', 'The device is easier to use on the go.', 'The device has a larger screen.', 'The device has better battery life.'],
      correctIndex: 1,
      explanation:
        'Người phụ nữ gợi ý smartphone vì "portable and easy to use on the go" → dễ mang theo và sử dụng khi di chuyển. Màn hình lớn là lý do người đàn ông thích tablet (lý do anh ấy nêu, không phải cô ấy).',
      pedagogicalTip:
        'Phân biệt ai nói lý do nào: larger screen là của MAN, còn suggestion + lý do của WOMAN là "on the go".',
    },
    {
      id: 'q20-l211',
      section: 'listening',
      sectionName: 'Listening M2: Announcement (Student Lounge)',
      question: 'What is the main purpose of the announcement?',
      audioScript:
        'Man: Attention everyone! The student lounge will be closed tomorrow from one P.M. to three P.M. for maintenance. We will be repairing a broken pipe in the ceiling. We apologize for any inconvenience this may cause. Please plan accordingly and consider using the library or the campus caf\u00e9 during this time.',
      speakerRole: 'Announcement in a Student Lounge',
      options: [
        'To inform students about a schedule change',
        'To announce new lounge amenities',
        'To notify students of a new facility',
        'To encourage students to use the lounge more',
      ],
      correctIndex: 0,
      explanation:
        'Thông báo phòng sinh hoạt đóng cửa 1-3 giờ chiều mai để sửa chữa → thông tin thay đổi lịch (schedule change).',
      pedagogicalTip:
        'Câu hỏi main purpose: xác định hành động thông báo (đóng cửa tạm thời = schedule change).',
    },
    {
      id: 'q20-l212',
      section: 'listening',
      sectionName: 'Listening M2: Announcement (Student Lounge)',
      question: 'What should students do during the closure?',
      audioScript:
        'Man: ... Please plan accordingly and consider using the library or the campus caf\u00e9 during this time.',
      speakerRole: 'Announcement in a Student Lounge',
      options: ['Wait in the lounge', 'Assist with the maintenance', 'Use alternate spaces', 'Visit the library website'],
      correctIndex: 2,
      explanation:
        '"Consider using the library or the campus caf\u00e9 during this time" → dùng không gian thay thế (thư viện, quán cà phê khuôn viên) = alternate spaces.',
      pedagogicalTip:
        'Paraphrase: "using the library or the campus caf\u00e9" = alternate spaces (địa điểm khác).',
    },
    {
      id: 'q20-l213',
      section: 'listening',
      sectionName: 'Listening M2: Class Talk (Ecological Footprint)',
      question: 'What is the main topic of the talk?',
      audioScript:
        'Professor: An ecological footprint is a measure of the environmental impact of an individual, community, or country. It calculates the amount of natural resources consumed and the waste generated by human activities, usually expressed in global hectares. ... Understanding ecological footprints is crucial for promoting sustainability.',
      speakerRole: 'Environmental Science Class',
      options: [
        'Changes in consumption in societies over time',
        'A measure of environmental impact',
        'Environmentally damaging activities',
        'The role of governments in sustainability',
      ],
      correctIndex: 1,
      explanation:
        'Câu định nghĩa mở đầu: "An ecological footprint is a measure of the environmental impact..." → chủ đề là một thước đo tác động môi trường.',
      pedagogicalTip:
        'Chủ đề bài giảng thường nằm ở câu định nghĩa đầu tiên — "X is a measure of...".',
    },
    {
      id: 'q20-l214',
      section: 'listening',
      sectionName: 'Listening M2: Class Talk (Ecological Footprint)',
      question: 'Why does the speaker mention developed and developing countries?',
      audioScript:
        'Professor: By comparing ecological footprints, we can understand how different lifestyles and practices contribute to resource depletion and environmental degradation. For instance, the ecological footprint of someone living in a developed country is typically larger than that of someone living in a developing country, mainly due to higher consumption levels and waste production.',
      speakerRole: 'Environmental Science Class',
      options: [
        'To contradict a theory related to the ecological footprint',
        'To show that resource depletion can be similar regardless of lifestyle',
        'To illustrate the usefulness of comparing ecological footprints',
        'To point out that production efficiency reduces the ecological footprint',
      ],
      correctIndex: 2,
      explanation:
        'Câu trước ví dụ: "By comparing ecological footprints, we can understand..." → ví dụ nước phát triển vs đang phát triển minh họa LỢI ÍCH của việc so sánh dấu chân sinh thái.',
      pedagogicalTip:
        'Câu hỏi why mention: đọc câu ngay trước ví dụ ("By comparing..., we can understand...") — đó là mục đích.',
    },
    {
      id: 'q20-l215',
      section: 'listening',
      sectionName: 'Listening M2: Class Talk (Ecological Footprint)',
      question: 'What does the speaker mention as a way that people can reduce their ecological footprint?',
      audioScript:
        'Professor: ... For example, if you consume locally produced foods, you\u2019ll likely reduce your ecological footprint because less energy will be used for transporting that food.',
      speakerRole: 'Environmental Science Class',
      options: [
        'By disposing of waste appropriately',
        'By joining an environmental organization',
        'By using environmentally friendly forms of transportation',
        'By eating locally produced food',
      ],
      correctIndex: 3,
      explanation:
        'Giáo sư nêu ví dụ: "if you consume locally produced foods, you\u2019ll likely reduce your ecological footprint" → ăn thực phẩm sản xuất tại địa phương.',
      pedagogicalTip:
        'Câu hỏi "what way": tìm câu điều kiện "if you..., you\u2019ll reduce..." — đáp án nằm trong mệnh đề if.',
    },
    {
      id: 'q20-l216',
      section: 'listening',
      sectionName: 'Listening M2: Class Talk (Ecological Footprint)',
      question: 'What will the speaker most likely discuss next?',
      audioScript:
        'Professor: ... Governments and organizations can use ecological footprint data to develop policies aimed at achieving sustainable development. I\u2019ll discuss some examples of that next.',
      speakerRole: 'Environmental Science Class',
      options: [
        'How information about ecological footprints has been used in creating policies',
        'How data about ecological footprints has been collected',
        'Why the idea of ecological footprint is often misunderstood',
        'Why sustainable development can be difficult to achieve',
      ],
      correctIndex: 0,
      explanation:
        'Câu cuối: "Governments... use ecological footprint data to develop policies... I\u2019ll discuss some examples of that next" → phần tiếp theo là ví dụ về dùng dữ liệu dấu chân sinh thái để HOẠCH ĐỊNH CHÍNH SÁCH.',
      pedagogicalTip:
        'Câu hỏi "what will the speaker discuss next": tìm câu báo hiệu "I\u2019ll discuss... next" và bám đúng "that" chỉ điều gì.',
    },
    // ============ WRITING ============
    {
      id: 'q20-w1',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 1): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: What was the highlight of your trip?\n\nThe ____ ____ ____ ____ ____ ____ fantastic.\n\nTừ cho sẵn: were / the / old city / showed us around / who / tour guides',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “The tour guides who showed us around the old city were fantastic.” — mệnh đề quan hệ “who showed us around the old city” bổ nghĩa cho “tour guides”; động từ chính “were” hợp với chủ ngữ số nhiều.',
      pedagogicalTip:
        'Dạng xếp câu kiểm tra mệnh đề quan hệ: chủ ngữ + who + V + tân ngữ + động từ chính + bổ ngữ.',
    },
    {
      id: 'q20-w2',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 2): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: I heard Anna got a promotion.\n\n____ ____ ____ ____ she will be ____ ____ ?\n\nTừ cho sẵn: a different department / if / moving to / know / do / you',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “Do you know if she will be moving to a different department?” — câu hỏi gián tiếp Yes/No dùng “if”: Do you know + if + S + will be + V-ing?',
      pedagogicalTip:
        'Câu hỏi gián tiếp: KHÔNG đảo ngữ trong mệnh đề phụ (if she will be… chứ không phải if will she be…).',
    },
    {
      id: 'q20-w3',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 3): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: We’re planning a trip to the mountains next weekend.\n\n____ ____ tell me ____ ____ ____ ____ ?\n\nTừ cho sẵn: the cabins / available / whether / can / will be / you',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “Can you tell me whether the cabins will be available?” — “whether” dùng cho câu hỏi gián tiếp lựa chọn/có-không: whether + S + will be + adj.',
      pedagogicalTip:
        '“whether” ≈ “if” trong câu hỏi gián tiếp; sau “whether” giữ trật tự S + V, không đảo ngữ.',
    },
    {
      id: 'q20-w4',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 4): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: I’m looking forward to the concert this weekend.\n\n____ ____ ____ ____ ____ ?\n\nTừ cho sẵn: does / what / time / it / start',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “What time does it start?” — câu hỏi trực tiếp Wh- với thì hiện tại đơn: What time + does + it + start?',
      pedagogicalTip:
        'Trật tự câu hỏi: từ hỏi + trợ động từ + chủ ngữ + động từ nguyên thể (does it start).',
    },
    {
      id: 'q20-w5',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 5): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: The museum exhibition opens next month.\n\n____ ____ ____ ____ ____ ____ ____ ?\n\nTừ cho sẵn: do / you / how / know / tickets / will cost / much',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “Do you know how much tickets will cost?” — cấu trúc: Do you know + how much + S + will cost?',
      pedagogicalTip:
        '“how much” đứng liền trước danh từ/cụm cần hỏi giá (how much tickets); mệnh đề sau giữ trật tự S + V.',
    },
    {
      id: 'q20-w6',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 6): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: I’m planning to go to the beach tomorrow.\n\n____ ____ ____ ____ ____ ____ ____ ?\n\nTừ cho sẵn: is / time of year / what / the water / this / like / temperature',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “What is the water temperature like this time of year?” — cấu trúc hỏi “What is X like?” (X như thế nào?) + cụm trạng ngữ “this time of year”.',
      pedagogicalTip:
        '“What is … like?” hỏi đặc điểm, khác với “What does X like?” (X thích gì). Chú ý cụm cố định “this time of year”.',
    },
    {
      id: 'q20-w7',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 7): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: I need to buy groceries today.\n\n____ ____ ____ ____ ____ ____ ?\n\nTừ cho sẵn: list / do / a / have / shopping / you',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “Do you have a shopping list?” — “shopping” ghép trước “list” thành cụm danh từ “shopping list”; câu hỏi Yes/No thì hiện tại đơn với “do”.',
      pedagogicalTip:
        'Trong dạng xếp câu, có thể phải GHÉP hai ô thành một cụm danh từ (shopping + list) mới đúng.',
    },
    {
      id: 'q20-w8',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 8): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: I’ll be taking a cooking class this weekend.\n\n____ ____ ____ ____ ____ ?\n\nTừ cho sẵn: learn / what / will / you / recipes',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “What recipes will you learn?” — câu hỏi Wh- thì tương lai đơn: What + N + will + S + V?',
      pedagogicalTip:
        '“What recipes” = những công thức nấu ăn nào — danh từ theo ngay sau “what”, trợ động từ “will” đứng trước chủ ngữ.',
    },
    {
      id: 'q20-w9',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 9): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: What did Maria ask you about the book you’re reading?\n\nShe ____ ____ ____ ____ ____ ____ ____ .\n\nTừ cho sẵn: she / wanted / a copy / buy / to know / could / where',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “She wanted to know where she could buy a copy.” — tường thuật câu hỏi: wanted to know + where + S + could + V + tân ngữ.',
      pedagogicalTip:
        'Câu tường thuật: lùi thì (can → could) và giữ trật tự S + V trong mệnh đề “where …”.',
    },
    {
      id: 'q20-w10',
      section: 'writing',
      sectionName: 'Writing: Build a Sentence (Xếp câu 1-10)',
      taskType: 'writing',
      question: 'Build a Sentence (Câu 10): Di chuyển các từ trong ô để tạo thành câu đúng ngữ pháp.',
      writingPrompt:
        'Ngữ cảnh: How did you prepare for the exam?\n\nI used ____ ____ ____ ____ ____ .\n\nTừ cho sẵn: by / the professor / that / the study guide / was provided / it',
      options: [],
      correctIndex: -1,
      explanation:
        'Đáp án ETS: “I used the study guide that was provided by the professor.” — mệnh đề quan hệ bị động “that was provided by the professor” bổ nghĩa cho “the study guide”; “it” là từ gây nhiễu.',
      pedagogicalTip:
        'Mệnh đề quan hệ bị động: N + that + was/were + V3/ed (+ by O). Nhận diện từ nhiễu (it) không cần dùng.',
    },
    {
      id: 'q20-w11',
      section: 'writing',
      sectionName: 'Writing: Write an Email (Viết Email)',
      taskType: 'writing',
      question: 'Write an Email (7 phút): viết email cho biên tập viên tạp chí thơ về bài dự thi đã gửi.',
      writingPrompt:
        'You will read some information and use the information to write an email. You will have 7 minutes to write the email.\n\nA new poetry magazine has asked its readers for submissions, and you decided to submit two of your poems. However, you had a problem using the online submission form, and you are not certain that your submissions were received.\n\nWrite an email to the editor of the magazine. In your email, do the following:\n• Tell the editor what you like about the new magazine.\n• Describe the problem you experienced.\n• Ask about the status of your submissions.\n\nWrite as much as you can and in complete sentences.\n\nTo: editor@sunshinepoetrymagazine.com\nSubject: Problem using submission form',
      minWords: 100,
      options: [],
      correctIndex: -1,
      explanation:
        'Email cần đủ 3 mục đề yêu cầu: (1) điều bạn thích ở tạp chí mới, (2) mô tả vấn đề khi dùng form nộp bài trực tuyến, (3) hỏi tình trạng 2 bài thơ đã gửi. Có lời chào, thân bài mạch lạc và ký tên lịch sự.',
      pedagogicalTip:
        'Đề chỉ cho 7 phút: chia 3 đoạn theo 3 bullet, mỗi bullet 1-2 câu. Dùng câu hỏi lịch sự: “Could you please let me know…?”, “I would appreciate it if…”.',
      modelAnswer:
        'Dear Editor,\n\nI am writing to follow up on two poems I submitted to Sunshine Poetry Magazine last week. First, I would like to say how much I enjoy the new magazine. The selection of contemporary poets is refreshing, and the layout makes every poem a pleasure to read.\n\nUnfortunately, I had a problem using the online submission form. When I clicked Submit, the page froze, and I never received a confirmation email. I am not sure whether my two poems were actually received.\n\nCould you please check the status of my submissions and let me know if I need to send them again? I would be happy to resubmit them by email if that is easier.\n\nThank you for your time, and congratulations on the launch of the magazine.\n\nBest regards,\nMai Anh',
    },
    {
      id: 'q20-w12',
      section: 'writing',
      sectionName: 'Writing: Academic Discussion (Thảo luận học thuật)',
      taskType: 'writing',
      question:
        'Write for an Academic Discussion (10 phút, tối thiểu 100 từ): học sinh THPT có nên bắt buộc tham gia hoạt động tình nguyện?',
      writingPrompt:
        'Your professor is teaching a class on social studies. Write a post responding to the professor’s question. In your response, you should do the following:\n• Express and support your opinion.\n• Make a contribution to the discussion in your own words.\nAn effective response will contain at least 100 words.\n\nProfessor: Volunteerism refers to the act of offering your time and service without financial compensation to benefit a community, organization, or cause. While many people volunteer mainly to help others, some institutions have mandatory volunteer programs. High schools are one example, where students may be required to complete a certain number of volunteer hours to graduate. What do you think? Should high school students be required to do volunteer work? Why or why not?\n\nStudent 1: Yes, I think high schools should require volunteer hours because it helps students build a sense of civic responsibility. Many teenagers don’t naturally think about helping others, and this requirement can introduce them to the idea that their time and effort can make a real difference in the lives of others.\n\nStudent 2: I don’t think volunteer hours should be required because many students already have limited free time. Some have part-time jobs or take care of younger siblings after school. Adding a mandatory volunteer requirement could create extra stress and make it harder for those students to balance their existing responsibilities.',
      minWords: 100,
      options: [],
      correctIndex: -1,
      explanation:
        'Bài cần: quan điểm rõ ràng (ủng hộ/phản đối/trung dung), 1-2 lý do + ví dụ cụ thể, và đóng góp riêng thay vì lặp lại nguyên ý hai bạn khác. Đủ tối thiểu 100 từ, văn phong học thuật.',
      pedagogicalTip:
        'Academic Discussion (10 phút): mở bài 1 câu nêu quan điểm → 2 lý do/ví dụ → có thể bắc cầu với ý của bạn học (“While I understand the concern that…”). Không cần mở/kết bài dài như essay.',
      modelAnswer:
        'In my opinion, high schools should require volunteer work, but the requirement should be flexible. I agree with the first student that volunteering builds civic responsibility, and I have seen this in my own community: when our class helped clean up the local park, many of my classmates said they wanted to come back and do it again. At the same time, I understand the second student’s concern about limited free time. Therefore, schools could offer different ways to complete the hours — for example, during summer break or as part of a class project — so that students with jobs or family duties are not overwhelmed. In this way, everyone gains the benefits of service without adding too much stress.',
    },
    // ============ SPEAKING ============
    {
      id: 'q20-s1',
      section: 'speaking',
      sectionName: 'Speaking: Listen and Repeat (Nghe và lặp lại)',
      taskType: 'speaking',
      question:
        'Speaking: Listen and Repeat (7 câu) — nghe từng câu và lặp lại y hệt, chỉ lặp 1 lần, không có thời gian chuẩn bị.',
      speakingPrompt:
        'You are learning to welcome visitors to the zoo. Listen to your manager and repeat what she says. Repeat only once.\n\nTrainer: We have a variety of wildlife.\nTrainer: Bears, wolves, and large cats are to the right.\nTrainer: You can find sea lions and elephants further down the path.\nTrainer: Please, no outside food or drinks, and do not feed the animals.\nTrainer: Avoid banging or tapping on the displays and enclosures.\nTrainer: For those with children, we offer summer camps and educational opportunities.\nTrainer: The visitor’s center, located near the front entrance, can give you more information.\n\nHướng dẫn: bấm nút phát để nghe từng câu (hoặc đọc câu), sau đó lặp lại y hệt — chỉ nói 1 lần. Lưu câu trả lời của bạn vào ô ghi chú bên dưới.',
      prepTimeSeconds: 0,
      options: [],
      correctIndex: -1,
      explanation:
        'Dạng Listen and Repeat chấm độ chính xác khi lặp lại, ngữ điệu và độ trôi chảy. Chú ý các từ khó: variety of wildlife, sea lions, enclosures, educational opportunities, visitor’s center.',
      pedagogicalTip:
        'Mẹo: lặp lại theo đúng nhịp câu gốc; chú ý âm đuôi và số nhiều (cats, animals, opportunities). Nếu lỡ quên, đừng dừng lại — tiếp tục nói phần còn nhớ.',
      modelAnswer:
        'Cách luyện: bật audio từng câu → tạm dừng → nhắc lại to, rõ trong 2-3 giây. Ghi âm giọng mình rồi so sánh với câu gốc để sửa trọng âm và ngữ điệu.',
    },
    {
      id: 'q20-s2',
      section: 'speaking',
      sectionName: 'Speaking: Take an Interview (Phỏng vấn)',
      taskType: 'speaking',
      question: 'Speaking: Take an Interview — trả lời 4 câu hỏi phỏng vấn về cuộc sống đô thị (không có thời gian chuẩn bị).',
      speakingPrompt:
        'You have agreed to take part in a research study about urban life. You will have a short online interview with a researcher. The researcher will ask you some questions.\n\nInterviewer: Do you currently live in a big city, a small town, or a village?\nInterviewer: Cities affect people in different ways. Some people find cities dynamic and exciting. Others find that cities are overwhelming and drain them of energy. What kind of reaction do you have to cities? Why do you think you react in this way?\nInterviewer: Some people believe that those who live in cities lead more interesting lives — for example, they have more access to professional opportunities and interesting leisure activities. Do you agree that people who live in cities lead more interesting lives? Why or why not?\nInterviewer: For some time now, researchers have been interested in whether green spaces, such as parks, make people who live in cities happier. Do you think that city governments should create more parks in urban areas to promote a general sense of happiness and life satisfaction? Why or why not?\n\nHướng dẫn: trả lời ngay (không chuẩn bị); mỗi câu trả lời dài 30-45 giây, nêu quan điểm + lý do + ví dụ cá nhân. Ghi lại câu trả lời (dàn ý) vào ô bên dưới.',
      prepTimeSeconds: 0,
      options: [],
      correctIndex: -1,
      explanation:
        'Chấm điểm: độ đầy đủ (trả lời đúng trọng tâm), phát triển ý (lý do + ví dụ), ngữ pháp, từ vựng, độ trôi chảy. Mỗi câu 30-45 giây — nêu quan điểm ngay rồi bồi chi tiết.',
      pedagogicalTip:
        'Cấu trúc vàng cho câu hỏi ý kiến: (1) câu trả lời trực tiếp, (2) lý do “because…”, (3) ví dụ cá nhân “For example, in my neighborhood…”, (4) câu kết ngắn.',
      modelAnswer:
        'Gợi ý khung trả lời:\n• Q1: “I currently live in a big city — Ho Chi Minh City — although I grew up in a smaller town.”\n• Q2: “Overall, I find cities exciting. I love that there is always something to do… It energizes me because…”\n• Q3: “I partly agree. Cities definitely offer more job opportunities, but I don’t think the place itself makes a life interesting — what matters is how you use the opportunities…”\n• Q4: “Yes, I strongly believe so. Parks give people a free place to relax and exercise… In my city, a new riverside park became a favorite spot for families, and it clearly improved the neighborhood’s mood.”',
    },
  ],
};

export const TOEFL_ETS_SETS: ExamSet[] = [TOEFL_ETS_P1_SET];

import type { ExamSet } from './exams';

/**
 * TOEIC ETS Official Sample Form ST-05 (Listening & Reading).
 * Nguồn: ETS "TOEIC Listening and Reading Sample Tests" (PDF công khai tại ets.org).
 * 58 câu được chọn lọc giữ nguyên nội dung gốc (audio transcript chính thức + đáp án ETS),
 * bổ sung giải thích tiếng Việt để luyện tập.
 */
export const TOEIC_ETS_ST05_SET: ExamSet = {
  id: 'exam-toeic-ets-st05',
  title: 'TOEIC L&R Official Sample (Form ST-05)',
  vietnameseTitle: 'Đề Thi 18: TOEIC Listening & Reading - Đề Mẫu Chính Thức ETS (Form ST-05)',
  category: 'toeic',
  categoryLabel: '🎯 TOEIC ETS Quốc Tế',
  level: 'B1 - B2',
  durationMinutes: 70,
  passingScore: 60,
  expReward: 500,
  coinReward: 700,
  badgeIcon: '🎯',
  summary:
    '58 câu chính thức từ đề mẫu ETS TOEIC Form ST-05: Listening Part 2-4 (kèm transcript gốc) và Reading Part 5-7 (đoạn văn gốc: email, quảng cáo, tin nhắn, biên bản). Đáp án chuẩn ETS + giải thích tiếng Việt.',
  questions: [
    // ===================== PART 2: QUESTION-RESPONSE =====================
    {
      id: 'q-tets-7',
      section: 'listening',
      sectionName: 'Part 2: Question-Response (Hỏi & Đáp)',
      question: 'Part 2: Nghe câu hỏi và chọn phản hồi (A)-(C) phù hợp nhất.',
      audioScript:
        "Woman: Where's the new fax machine?\n(A) Next to the water fountain.\n(B) I'll send a fax tomorrow.\n(C) By Wednesday.",
      speakerRole: 'Question-Response',
      options: ['Next to the water fountain.', "I'll send a fax tomorrow.", 'By Wednesday.'],
      correctIndex: 0,
      explanation:
        'Câu hỏi "Where\'s the new fax machine?" hỏi vị trí → trả lời đúng phải là nơi chốn: "Next to the water fountain." (Cạnh máy nước). (B) nói về gửi fax — không trả lời "where". (C) "By Wednesday" trả lời cho câu hỏi "When".',
      pedagogicalTip:
        'Part 2: xác định từ hỏi (Where/When/Who/Why/How) và loại thông tin cần trả lời. Đáp án nhiễu thường lái theo từ khóa trong câu hỏi (fax → send a fax).',
    },
    {
      id: 'q-tets-8',
      section: 'listening',
      sectionName: 'Part 2: Question-Response (Hỏi & Đáp)',
      question: 'Part 2: Nghe câu hỏi và chọn phản hồi (A)-(C) phù hợp nhất.',
      audioScript:
        "Woman: How well does Thomas play the violin?\n(A) Sure, I really like it.\n(B) Oh, he's a professional.\n(C) I'll turn down the volume.",
      speakerRole: 'Question-Response',
      options: ['Sure, I really like it.', "Oh, he's a professional.", "I'll turn down the volume."],
      correctIndex: 1,
      explanation:
        'Câu hỏi "How well does Thomas play the violin?" hỏi mức độ chơi đàn → "he\'s a professional" (anh ấy chơi chuyên nghiệp) là câu trả lời phù hợp. (A) trả lời cho "Do you like...". (C) nói về giảm âm lượng — nhiễu theo từ "violin".',
      pedagogicalTip:
        'Câu hỏi "How well..." hỏi trình độ/kỹ năng. Đáp án đúng thường là nhận xét về kỹ năng (professional, very well...).',
    },
    {
      id: 'q-tets-9',
      section: 'listening',
      sectionName: 'Part 2: Question-Response (Hỏi & Đáp)',
      question: 'Part 2: Nghe câu hỏi và chọn phản hồi (A)-(C) phù hợp nhất.',
      audioScript:
        'Woman: Martin, are you driving to the client meeting?\n(A) Oh, would you like a ride?\n(B) Nice to meet you, too.\n(C) I thought it went well!',
      speakerRole: 'Question-Response',
      options: ['Oh, would you like a ride?', 'Nice to meet you, too.', 'I thought it went well!'],
      correctIndex: 0,
      explanation:
        'Câu hỏi Yes/No "are you driving to the client meeting?" → câu đáp phù hợp là "would you like a ride?" (bạn có muốn đi nhờ không?) — liên quan trực tiếp đến việc lái xe. (B)/(C) không khớp ngữ cảnh.',
      pedagogicalTip:
        'Với câu hỏi Yes/No, đáp án có thể là một lời đề nghị/hỏi lại liên quan đến nội dung câu hỏi.',
    },
    {
      id: 'q-tets-10',
      section: 'listening',
      sectionName: 'Part 2: Question-Response (Hỏi & Đáp)',
      question: 'Part 2: Nghe câu hỏi và chọn phản hồi (A)-(C) phù hợp nhất.',
      audioScript:
        "Man: Mariko announced that she's retiring in April.\n(A) How many did you count?\n(B) I'm not tired at all.\n(C) Right, she's been here twenty-five years.",
      speakerRole: 'Question-Response',
      options: [
        'How many did you count?',
        "I'm not tired at all.",
        "Right, she's been here twenty-five years.",
      ],
      correctIndex: 2,
      explanation:
        'Câu trần thuật thông báo Mariko nghỉ hưu tháng 4 → đáp lại bằng thông tin liên quan: "she\'s been here twenty-five years" (cô ấy làm ở đây 25 năm) — hợp lý. (A) hỏi số lượng, (B) bắt sai từ "retiring" thành "tired" (bẫy đồng âm).',
      pedagogicalTip:
        'Bẫy kinh điển Part 2: từ đồng âm gần giống (retiring ≈ tired; retiring ≈ tyred). Đừng chọn theo âm thanh giống mà theo nghĩa.',
    },
    // ===================== PART 3: CONVERSATIONS =====================
    {
      id: 'q-tets-32',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 32-34 gốc)',
      question: 'Why is the woman calling?',
      audioScript:
        "Woman: Hello. I'm calling about a coffee machine I purchased from your Web site. It stopped working even though I haven't had it for very long. I expected it to last much longer than this.\nMan: Oh, I'm sorry to hear that. Our warranty covers products for up to a year. Do you know when you bought it?\nWoman: I've had it for a little over a year, so the warranty has probably just expired. This is so disappointing.\nMan: Well, I'll tell you what we can do. Although we can't replace it, since you're a valued customer I can offer you a coupon for forty percent off your next purchase.",
      speakerRole: 'Customer & Customer Service',
      options: ['To cancel an order', 'To complain about a product', 'To redeem a gift card', 'To renew a warranty'],
      correctIndex: 1,
      explanation:
        'Người phụ nữ nói máy pha cà phê "stopped working" và "This is so disappointing" → đang phàn nàn về sản phẩm. Cô ấy không hủy đơn, không dùng thẻ quà tặng, không gia hạn bảo hành.',
      pedagogicalTip:
        'Câu hỏi "Why is the woman calling?" → nghe mục đích cuộc gọi ở đầu hội thoại (I\'m calling about...).',
    },
    {
      id: 'q-tets-33',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 32-34 gốc)',
      question: 'What does the man ask the woman about?',
      audioScript:
        "Woman: Hello. I'm calling about a coffee machine I purchased from your Web site. It stopped working even though I haven't had it for very long. I expected it to last much longer than this.\nMan: Oh, I'm sorry to hear that. Our warranty covers products for up to a year. Do you know when you bought it?\nWoman: I've had it for a little over a year, so the warranty has probably just expired. This is so disappointing.\nMan: Well, I'll tell you what we can do. Although we can't replace it, since you're a valued customer I can offer you a coupon for forty percent off your next purchase.",
      speakerRole: 'Customer & Customer Service',
      options: ['A model name', 'A brand of coffee', 'A catalog number', 'A date of purchase'],
      correctIndex: 3,
      explanation:
        'Người đàn ông hỏi: "Do you know when you bought it?" — hỏi về thời điểm mua (date of purchase) để xác định bảo hành.',
      pedagogicalTip:
        'Chú ý câu hỏi nghi vấn trong hội thoại: "Do you know when...?" ↔ đáp án diễn đạt lại thành "A date of purchase".',
    },
    {
      id: 'q-tets-34',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 32-34 gốc)',
      question: 'What does the man offer to do?',
      audioScript:
        "Woman: Hello. I'm calling about a coffee machine I purchased from your Web site. It stopped working even though I haven't had it for very long. I expected it to last much longer than this.\nMan: Oh, I'm sorry to hear that. Our warranty covers products for up to a year. Do you know when you bought it?\nWoman: I've had it for a little over a year, so the warranty has probably just expired. This is so disappointing.\nMan: Well, I'll tell you what we can do. Although we can't replace it, since you're a valued customer I can offer you a coupon for forty percent off your next purchase.",
      speakerRole: 'Customer & Customer Service',
      options: ['Provide a discount', 'Send a free sample', 'Extend a warranty', 'Issue a refund'],
      correctIndex: 0,
      explanation:
        'Người đàn ông nói: "I can offer you a coupon for forty percent off your next purchase" → tặng phiếu giảm giá 40% = provide a discount. Ông nói rõ "we can\'t replace it" và không gia hạn bảo hành.',
      pedagogicalTip:
        'Cụm "offer you a coupon for X percent off" = giảm giá. Học các cách diễn đạt giảm giá: discount, coupon, percent off, price reduction.',
    },
    {
      id: 'q-tets-35',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 35-37 gốc)',
      question: 'Where do the speakers work?',
      audioScript:
        "Man: Oh, hi Yolanda—I'm surprised to see you at the front desk this late. Don't you usually work at the hotel in the morning?\nWoman: Actually, I'm going to be working the evening shift for a while; I'm covering for a front-desk supervisor who was just promoted, but only until the hotel hires a permanent replacement.\nMan: Oh, so there's a front-desk supervisor position open? I've been looking for a chance to take on a managerial role. Are they still accepting applications?\nWoman: Yes, and if you don't mind working evening hours, I think you have a good chance at the job. I'd contact the manager right now, though—she's starting interviews this week.",
      speakerRole: 'Two Hotel Employees',
      options: ['At a hotel', 'At a department store', 'At a restaurant', 'At a call center'],
      correctIndex: 0,
      explanation:
        'Hội thoại nhắc đến "front desk", "the hotel" (khách sạn) ở cả hai lượt lời đầu tiên → họ làm việc tại khách sạn.',
      pedagogicalTip:
        'Câu hỏi nơi làm việc: nghe các từ chỉ địa điểm/danh từ đặc thù (front desk, hotel, guests, check-in...).',
    },
    {
      id: 'q-tets-36',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 35-37 gốc)',
      question: 'What does the man ask about?',
      audioScript:
        "Man: Oh, hi Yolanda—I'm surprised to see you at the front desk this late. Don't you usually work at the hotel in the morning?\nWoman: Actually, I'm going to be working the evening shift for a while; I'm covering for a front-desk supervisor who was just promoted, but only until the hotel hires a permanent replacement.\nMan: Oh, so there's a front-desk supervisor position open? I've been looking for a chance to take on a managerial role. Are they still accepting applications?\nWoman: Yes, and if you don't mind working evening hours, I think you have a good chance at the job. I'd contact the manager right now, though—she's starting interviews this week.",
      speakerRole: 'Two Hotel Employees',
      options: [
        'How many people have applied for a promotion',
        'If a manager is in the lobby',
        'Whether a position is available',
        'When new shifts will be assigned',
      ],
      correctIndex: 2,
      explanation:
        'Người đàn ông hỏi: "so there\'s a front-desk supervisor position open? ... Are they still accepting applications?" → hỏi xem vị trí còn tuyển không (whether a position is available).',
      pedagogicalTip:
        'Nhận diện câu hỏi gián tiếp trong hội thoại; đáp án thường paraphrase: "position open / accepting applications" = a position is available.',
    },
    {
      id: 'q-tets-37',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 35-37 gốc)',
      question: 'What does the woman say the man should be prepared to do?',
      audioScript:
        "Man: Oh, hi Yolanda—I'm surprised to see you at the front desk this late. Don't you usually work at the hotel in the morning?\nWoman: Actually, I'm going to be working the evening shift for a while; I'm covering for a front-desk supervisor who was just promoted, but only until the hotel hires a permanent replacement.\nMan: Oh, so there's a front-desk supervisor position open? I've been looking for a chance to take on a managerial role. Are they still accepting applications?\nWoman: Yes, and if you don't mind working evening hours, I think you have a good chance at the job. I'd contact the manager right now, though—she's starting interviews this week.",
      speakerRole: 'Two Hotel Employees',
      options: ['Handle customer complaints', 'Work within a budget', 'Get to know local clients', 'Work evening hours'],
      correctIndex: 3,
      explanation:
        'Người phụ nữ nói: "if you don\'t mind working evening hours, I think you have a good chance at the job" → ứng viên cần sẵn sàng làm ca tối (work evening hours).',
      pedagogicalTip:
        'Điều kiện "if you don\'t mind doing X" = bạn cần sẵn sàng làm X. Đây thường là đáp án cho câu hỏi "what should he be prepared to do".',
    },
    {
      id: 'q-tets-38',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 38-40 gốc)',
      question: 'What is the conversation mainly about?',
      audioScript:
        "Man 1: Have you two taken a look at the progress they've made upstairs on the office expansion? It looks great!\nWoman: I know! I can't believe it! And the offices up there have amazing views of the city.\nMan 2: I wonder which division will move up there when it's finished.\nWoman: I heard it's the research department.\nMan 1: Ah, because they have the most people.\nWoman: Probably. I'd love to have an office on that floor, though.\nMan 2: Yeah. Well, the company must be making good money if they're adding that space!\nMan 1: I think you're right, there!",
      speakerRole: 'Three Colleagues',
      options: ['An enlargement of office space', 'A move into a new market', 'An increase in staff numbers', 'A change in company leadership'],
      correctIndex: 0,
      explanation:
        'Cả hội thoại xoay quanh "the office expansion" (mở rộng văn phòng), tầng mới, phòng ban nào sẽ chuyển lên → chủ đề chính là việc mở rộng không gian văn phòng.',
      pedagogicalTip:
        'Câu hỏi chủ đề chính (mainly about): tổng hợp từ khóa lặp lại — expansion, upstairs, offices, space.',
    },
    {
      id: 'q-tets-39',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 38-40 gốc)',
      question: 'Why does the woman say, "I can\'t believe it!"?',
      audioScript:
        "Man 1: Have you two taken a look at the progress they've made upstairs on the office expansion? It looks great!\nWoman: I know! I can't believe it! And the offices up there have amazing views of the city.\nMan 2: I wonder which division will move up there when it's finished.\nWoman: I heard it's the research department.\nMan 1: Ah, because they have the most people.\nWoman: Probably. I'd love to have an office on that floor, though.\nMan 2: Yeah. Well, the company must be making good money if they're adding that space!\nMan 1: I think you're right, there!",
      speakerRole: 'Three Colleagues',
      options: ['She strongly disagrees.', 'She would like an explanation.', 'She feels disappointed.', 'She is happily surprised.'],
      correctIndex: 3,
      explanation:
        'Ngay sau "I can\'t believe it!" cô ấy nói "the offices up there have amazing views" — ngữ điệu tích cực → ngạc nhiên vui sướng. Cần nghe ngữ cảnh xung quanh, không chỉ cụm từ.',
      pedagogicalTip:
        'Câu hỏi "why does she say X": luôn nghe câu TRƯỚC và SAU cụm từ đó để suy ra thái độ (tích cực/tiêu cực).',
    },
    {
      id: 'q-tets-40',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 38-40 gốc)',
      question: 'What do the men imply about the company?',
      audioScript:
        "Man 1: Have you two taken a look at the progress they've made upstairs on the office expansion? It looks great!\nWoman: I know! I can't believe it! And the offices up there have amazing views of the city.\nMan 2: I wonder which division will move up there when it's finished.\nWoman: I heard it's the research department.\nMan 1: Ah, because they have the most people.\nWoman: Probably. I'd love to have an office on that floor, though.\nMan 2: Yeah. Well, the company must be making good money if they're adding that space!\nMan 1: I think you're right, there!",
      speakerRole: 'Three Colleagues',
      options: [
        'It was recently founded.',
        'It is planning to adjust salaries.',
        'It is in a good financial situation.',
        'It has offices in other countries.',
      ],
      correctIndex: 2,
      explanation:
        'Man 2 nói: "the company must be making good money if they\'re adding that space" → công ty đang làm ăn tốt (good financial situation). Man 1 đồng tình "I think you\'re right".',
      pedagogicalTip:
        'Câu hỏi imply/suggest: nghe câu suy đoán với "must be", "probably" — thường là đáp án cho câu hỏi suy luận.',
    },
    {
      id: 'q-tets-41',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 41-43 gốc)',
      question: 'What does the woman ask the man to do?',
      audioScript:
        "Woman: Larry, we have a new graphic designer starting next month and we'll need to set her up with a laptop and extra monitor. Can you place orders for those?\nMan: Sure. You know our vendor has raised their prices, right?\nWoman: Really?\nMan: Yes. I just looked at the catalog a few minutes ago, and their current models are more expensive.\nWoman: Right. Well, our budget per work area is $1,000 maximum. So let's order the system with the largest screen that falls within that price.\nMan: OK. I'll take a look at the prices again and place the order.",
      speakerRole: 'Two Office Workers',
      options: ['Order some equipment', 'Find a new vendor', 'Repair a laptop', 'Contact a job candidate'],
      correctIndex: 0,
      explanation:
        'Người phụ nữ nhờ: "we\'ll need to set her up with a laptop and extra monitor. Can you place orders for those?" → đặt mua thiết bị (order equipment).',
      pedagogicalTip:
        'Câu hỏi "what does she ask him to do" → tìm câu cầu khiến/yêu cầu: "Can you place orders...?", "Could you...?".',
    },
    {
      id: 'q-tets-42',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 41-43 gốc)',
      question: 'What problem does the man mention?',
      audioScript:
        "Woman: Larry, we have a new graphic designer starting next month and we'll need to set her up with a laptop and extra monitor. Can you place orders for those?\nMan: Sure. You know our vendor has raised their prices, right?\nWoman: Really?\nMan: Yes. I just looked at the catalog a few minutes ago, and their current models are more expensive.\nWoman: Right. Well, our budget per work area is $1,000 maximum. So let's order the system with the largest screen that falls within that price.\nMan: OK. I'll take a look at the prices again and place the order.",
      speakerRole: 'Two Office Workers',
      options: [
        'A designer has left the company.',
        'A supplier has increased its prices.',
        'A computer model has been discontinued.',
        'A departmental budget has been reduced.',
      ],
      correctIndex: 1,
      explanation:
        'Man nói: "our vendor has raised their prices" và "their current models are more expensive" → nhà cung cấp (vendor/supplier) đã tăng giá.',
      pedagogicalTip:
        'Paraphrase: vendor = supplier, raise prices = increase prices. Học cặp từ đồng nghĩa thường xuất hiện trong đáp án.',
    },
    {
      id: 'q-tets-43',
      section: 'listening',
      sectionName: 'Part 3: Conversation (Câu 41-43 gốc)',
      question: 'Look at the graphic. What size screen will the man order? (Đề gốc kèm bảng giá sản phẩm)',
      audioScript:
        "Woman: Larry, we have a new graphic designer starting next month and we'll need to set her up with a laptop and extra monitor. Can you place orders for those?\nMan: Sure. You know our vendor has raised their prices, right?\nWoman: Really?\nMan: Yes. I just looked at the catalog a few minutes ago, and their current models are more expensive.\nWoman: Right. Well, our budget per work area is $1,000 maximum. So let's order the system with the largest screen that falls within that price.\nMan: OK. I'll take a look at the prices again and place the order.",
      speakerRole: 'Two Office Workers',
      options: ['11 inches', '13 inches', '15 inches', '17 inches'],
      correctIndex: 2,
      explanation:
        'Người phụ nữ yêu cầu: "order the system with the largest screen that falls within" ngân sách $1,000. Theo bảng giá trong đề gốc, model 15 inch là màn hình lớn nhất trong mức $1,000 → đáp án C. (Đáp án theo key chính thức ETS.)',
      pedagogicalTip:
        'Dạng câu hỏi kết hợp hình ảnh (graphic): nghe điều kiện trong audio (ngân sách, kích thước), rồi đối chiếu bảng/hình để chọn.',
    },
    // ===================== PART 4: SHORT TALKS =====================
    {
      id: 'q-tets-71',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 71-73 gốc)',
      question: 'What does the speaker say about the repair?',
      audioScript:
        "Hello Mr. Lee, this is Thomas from BKS Auto Shop calling with some information about your car repair. I know we told you that it would take until next week to get the part we ordered, but we got the part early, and I was able to finish the repair. We're going to be closing for the day in a few minutes, but you're welcome to come get your car anytime tomorrow. If you need a ride to the shop tomorrow, let me know, and I can arrange one for you.",
      speakerRole: 'Telephone Message - Auto Shop',
      options: ['It is not required.', 'It has been finished early.', 'It will be inexpensive.', 'It is covered by a warranty.'],
      correctIndex: 1,
      explanation:
        'Người nói: "we got the part early, and I was able to finish the repair" → việc sửa xe đã xong sớm hơn dự kiến (ban đầu nói "take until next week").',
      pedagogicalTip:
        'Chú ý cấu trúc tương phản: "I know we told you... BUT..." — thông tin sau "but" thường là điểm chính của câu hỏi.',
    },
    {
      id: 'q-tets-72',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 71-73 gốc)',
      question: 'When can the listener pick up his car?',
      audioScript:
        "Hello Mr. Lee, this is Thomas from BKS Auto Shop calling with some information about your car repair. I know we told you that it would take until next week to get the part we ordered, but we got the part early, and I was able to finish the repair. We're going to be closing for the day in a few minutes, but you're welcome to come get your car anytime tomorrow. If you need a ride to the shop tomorrow, let me know, and I can arrange one for you.",
      speakerRole: 'Telephone Message - Auto Shop',
      options: ['Today', 'Tomorrow', 'Next week', 'In two weeks'],
      correctIndex: 1,
      explanation:
        'Người nói: "you\'re welcome to come get your car anytime tomorrow" → có thể lấy xe vào ngày mai. "Today" bị loại vì "we\'re going to be closing for the day in a few minutes".',
      pedagogicalTip:
        'Bẫy thời gian: nghe rõ từng mốc thời gian và điều kiện đi kèm (today → closing soon; tomorrow → welcome to come).',
    },
    {
      id: 'q-tets-73',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 71-73 gốc)',
      question: 'What does the speaker offer to do?',
      audioScript:
        "Hello Mr. Lee, this is Thomas from BKS Auto Shop calling with some information about your car repair. I know we told you that it would take until next week to get the part we ordered, but we got the part early, and I was able to finish the repair. We're going to be closing for the day in a few minutes, but you're welcome to come get your car anytime tomorrow. If you need a ride to the shop tomorrow, let me know, and I can arrange one for you.",
      speakerRole: 'Telephone Message - Auto Shop',
      options: ['Look for a used part', 'Refund the cost of a charge', 'Send an invoice', 'Arrange a ride'],
      correctIndex: 3,
      explanation:
        'Người nói: "If you need a ride to the shop tomorrow, let me know, and I can arrange one for you" → đề nghị sắp xếp phương tiện đi lại (arrange a ride).',
      pedagogicalTip:
        'Câu hỏi "what does the speaker offer to do": tìm câu điều kiện + đề nghị "If you need..., I can...".',
    },
    {
      id: 'q-tets-74',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 74-76 gốc)',
      question: 'What kind of business does the speaker work for?',
      audioScript:
        "OK, before you start serving food, I want to let you know that the restaurant is a bit understaffed tonight. Tamara called me this afternoon to let me know that she has a cold. So I'm asking each of you to be in charge of one extra table tonight. Please also remember to tell each table of guests about our new menu special—it's a rice dish with assorted grilled vegetables. I think it'll be very popular because many of our customers have been asking for more vegetarian options. That's all for tonight.",
      speakerRole: 'Restaurant Manager - Staff Briefing',
      options: ['A restaurant', 'A supermarket', 'A furniture store', 'A fitness center'],
      correctIndex: 0,
      explanation:
        'Từ khóa: "serving food", "the restaurant", "menu special", "tables of guests" → người nói làm việc tại nhà hàng.',
      pedagogicalTip:
        'Câu hỏi loại hình kinh doanh: gom các từ khóa cùng chủ đề (food, menu, tables → restaurant).',
    },
    {
      id: 'q-tets-75',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 74-76 gốc)',
      question: 'Why does the speaker assign extra work to the listeners?',
      audioScript:
        "OK, before you start serving food, I want to let you know that the restaurant is a bit understaffed tonight. Tamara called me this afternoon to let me know that she has a cold. So I'm asking each of you to be in charge of one extra table tonight. Please also remember to tell each table of guests about our new menu special—it's a rice dish with assorted grilled vegetables. I think it'll be very popular because many of our customers have been asking for more vegetarian options. That's all for tonight.",
      speakerRole: 'Restaurant Manager - Staff Briefing',
      options: ['A deadline is approaching.', 'A staff member is unwell.', 'Many customers are expected.', 'Equipment needs to be unpacked.'],
      correctIndex: 1,
      explanation:
        'Người nói: "the restaurant is a bit understaffed tonight. Tamara... has a cold" → thiếu nhân viên vì một người bị ốm (a staff member is unwell).',
      pedagogicalTip:
        'Paraphrase nguyên nhân: "understaffed + has a cold" = a staff member is unwell. Nghe cả lý do được nêu, không chỉ hiện tượng.',
    },
    {
      id: 'q-tets-76',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 74-76 gốc)',
      question: 'What does the speaker ask listeners to tell customers about?',
      audioScript:
        "OK, before you start serving food, I want to let you know that the restaurant is a bit understaffed tonight. Tamara called me this afternoon to let me know that she has a cold. So I'm asking each of you to be in charge of one extra table tonight. Please also remember to tell each table of guests about our new menu special—it's a rice dish with assorted grilled vegetables. I think it'll be very popular because many of our customers have been asking for more vegetarian options. That's all for tonight.",
      speakerRole: 'Restaurant Manager - Staff Briefing',
      options: ['New business hours', 'Discount cards', 'A special dish', 'A holiday sale'],
      correctIndex: 2,
      explanation:
        'Người nói yêu cầu: "remember to tell each table of guests about our new menu special" → giới thiệu món đặc biệt mới (a special dish).',
      pedagogicalTip:
        '"menu special" = món đặc biệt của thực đơn → cần map sang đáp án "a special dish".',
    },
    {
      id: 'q-tets-77',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 77-79 gốc)',
      question: 'What bothers the man about Torland Advertising?',
      audioScript:
        "So I called this meeting to discuss our contract with Torland Advertising and to decide whether we should continue to use them to develop our radio advertising materials. I had a discussion with their people yesterday and I have to say, I'm a little concerned. They seem much more focused on cutting their costs than they are on providing good quality advertising for us. Here's the thing. If we decide to end this business relationship, we'll need to pay them for anything they've already developed. Please take a minute to look at this contract with me. You'll see that's part of the agreement we made.",
      speakerRole: 'Meeting - Contract Discussion',
      options: [
        'Their failure to meet deadlines',
        'Their problems with staffing',
        'Their request to revise a contract',
        'Their focus on cost cutting',
      ],
      correctIndex: 3,
      explanation:
        'Người nói: "They seem much more focused on cutting their costs than they are on providing good quality advertising" → điều làm ông ấy băn khoăn là việc công ty chỉ chú trọng cắt giảm chi phí.',
      pedagogicalTip:
        '"I\'m concerned / what bothers me" thường đi trước lý do: "They seem more focused on X than Y".',
    },
    {
      id: 'q-tets-78',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 77-79 gốc)',
      question: 'What does the man mean when he says, "Here\'s the thing"?',
      audioScript:
        "So I called this meeting to discuss our contract with Torland Advertising and to decide whether we should continue to use them to develop our radio advertising materials. I had a discussion with their people yesterday and I have to say, I'm a little concerned. They seem much more focused on cutting their costs than they are on providing good quality advertising for us. Here's the thing. If we decide to end this business relationship, we'll need to pay them for anything they've already developed. Please take a minute to look at this contract with me. You'll see that's part of the agreement we made.",
      speakerRole: 'Meeting - Contract Discussion',
      options: [
        'He will demonstrate a product.',
        'He has forgotten a word.',
        'He has found what he was looking for.',
        'He will introduce a point to consider.',
      ],
      correctIndex: 3,
      explanation:
        'Sau "Here\'s the thing", ông ấy nêu một vấn đề quan trọng cần cân nhắc: nếu kết thúc hợp đồng sẽ phải trả tiền cho phần đã phát triển → giới thiệu một điểm cần lưu ý.',
      pedagogicalTip:
        'Cụm chức năng "Here\'s the thing / The thing is..." = dẫn dắt vào một điểm quan trọng cần cân nhắc.',
    },
    {
      id: 'q-tets-79',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 77-79 gốc)',
      question: 'What are the listeners asked to look at?',
      audioScript:
        "So I called this meeting to discuss our contract with Torland Advertising and to decide whether we should continue to use them to develop our radio advertising materials. I had a discussion with their people yesterday and I have to say, I'm a little concerned. They seem much more focused on cutting their costs than they are on providing good quality advertising for us. Here's the thing. If we decide to end this business relationship, we'll need to pay them for anything they've already developed. Please take a minute to look at this contract with me. You'll see that's part of the agreement we made.",
      speakerRole: 'Meeting - Contract Discussion',
      options: ['A design idea', 'A business contract', 'An advertisement', 'A budget'],
      correctIndex: 1,
      explanation:
        'Người nói: "Please take a minute to look at this contract with me" → người nghe được yêu cầu xem hợp đồng (business contract).',
      pedagogicalTip:
        'Câu hỏi "what are the listeners asked to look at": nghe động từ hành động (look at / review / check) + tân ngữ ngay sau.',
    },
    {
      id: 'q-tets-80',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 80-82 gốc)',
      question: 'Where most likely is the speaker?',
      audioScript:
        "We're happy to see you all at this seminar this afternoon—we have a lot of useful information to cover. But before we start, a few administrative details. There will be one break, half way through the afternoon. You can leave your laptops here if you leave the room—there will always be someone in here—but do keep your money and phones or other small electronic devices with you. Don't leave them at the tables. And please note that there's an error in your printed program: there will be a change—a switch—in times for the last two presenters. Ms. Ohta has to leave a little early today.",
      speakerRole: 'Seminar Administrator',
      options: ['At an award ceremony', 'At a musical performance', 'At a retirement celebration', 'At a training seminar'],
      correctIndex: 3,
      explanation:
        'Người nói: "at this seminar... useful information to cover... the last two presenters" → đang ở một hội thảo/khóa đào tạo (training seminar).',
      pedagogicalTip:
        'Từ khóa loại sự kiện: seminar, presenters, program → hội thảo. So sánh với các lựa chọn nhiễu (award, performance, retirement).',
    },
    {
      id: 'q-tets-81',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 80-82 gốc)',
      question: 'What are listeners asked to do?',
      audioScript:
        "We're happy to see you all at this seminar this afternoon—we have a lot of useful information to cover. But before we start, a few administrative details. There will be one break, half way through the afternoon. You can leave your laptops here if you leave the room—there will always be someone in here—but do keep your money and phones or other small electronic devices with you. Don't leave them at the tables. And please note that there's an error in your printed program: there will be a change—a switch—in times for the last two presenters. Ms. Ohta has to leave a little early today.",
      speakerRole: 'Seminar Administrator',
      options: ['Stay seated during the break', 'Carry their valuables with them', "Return any borrowed equipment", 'Share printed programs with others'],
      correctIndex: 1,
      explanation:
        'Người nói: "do keep your money and phones or other small electronic devices with you. Don\'t leave them at the tables" → mang theo đồ có giá trị (valuables). Laptops được phép để lại, nên đáp án không phải "equipment".',
      pedagogicalTip:
        'Chú ý yêu cầu trực tiếp "do keep... with you / don\'t leave..." — đáp án paraphrase "carry valuables with them".',
    },
    {
      id: 'q-tets-82',
      section: 'listening',
      sectionName: 'Part 4: Short Talk (Câu 80-82 gốc)',
      question: 'Look at the graphic. Who will be the final presenter? (Đề gốc kèm chương trình hội thảo)',
      audioScript:
        "We're happy to see you all at this seminar this afternoon—we have a lot of useful information to cover. But before we start, a few administrative details. There will be one break, half way through the afternoon. You can leave your laptops here if you leave the room—there will always be someone in here—but do keep your money and phones or other small electronic devices with you. Don't leave them at the tables. And please note that there's an error in your printed program: there will be a change—a switch—in times for the last two presenters. Ms. Ohta has to leave a little early today.",
      speakerRole: 'Seminar Administrator',
      options: ['Ms. Carbajal', 'Mr. Buteux', 'Mr. Chambers', 'Ms. Ohta'],
      correctIndex: 2,
      explanation:
        'Người nói thông báo "there will be a switch in times for the last two presenters. Ms. Ohta has to leave a little early" → hai người cuối đổi thứ tự, Ms. Ohta rời sớm nên người trình bày cuối là Mr. Chambers (theo chương trình trong đề gốc và key ETS).',
      pedagogicalTip:
        'Dạng câu hỏi graphic + thay đổi thứ tự: nghe kỹ thông tin điều chỉnh ("a switch / change / swap") rồi đối chiếu chương trình gốc.',
    },
    // ===================== PART 5: INCOMPLETE SENTENCES =====================
    {
      id: 'q-tets-101',
      section: 'reading',
      sectionName: 'Part 5: Incomplete Sentences (Điền câu)',
      question: 'Customer reviews indicate that many modern mobile devices are often unnecessarily ------- .',
      options: ['complication', 'complicates', 'complicate', 'complicated'],
      correctIndex: 3,
      explanation:
        'Sau trạng từ "unnecessarily" và động từ "are" cần một tính từ (bổ ngữ cho chủ ngữ "devices"): "devices are ... complicated" (bị làm phức tạp). complication (danh từ), complicates/complicate (động từ) không phù hợp.',
      pedagogicalTip:
        'Câu có "be + adverb + ___" → chỗ trống cần TÍNH TỪ. Nhận diện đuôi từ: -tion (n), -s/— (v), -ed (adj).',
    },
    {
      id: 'q-tets-102',
      section: 'reading',
      sectionName: 'Part 5: Incomplete Sentences (Điền câu)',
      question: 'Jamal Nawzad has received top performance reviews ------- he joined the sales department two years ago.',
      options: ['despite', 'except', 'since', 'during'],
      correctIndex: 2,
      explanation:
        '"since + mệnh đề quá khứ đơn" (kể từ khi) đi với thì hiện tại hoàn thành "has received" → "since he joined the sales department two years ago". despite/except/during không đi với mệnh đề (S + V).',
      pedagogicalTip:
        'Dấu hiệu thì: hiện tại hoàn thành + since + S + V (quá khứ đơn). Despite + N/V-ing; during + N.',
    },
    {
      id: 'q-tets-103',
      section: 'reading',
      sectionName: 'Part 5: Incomplete Sentences (Điền câu)',
      question: "Gyeon Corporation's continuing education policy states that ------- learning new skills enhances creativity and focus.",
      options: ['regular', 'regularity', 'regulate', 'regularly'],
      correctIndex: 0,
      explanation:
        'Cần tính từ bổ nghĩa cho danh động từ "learning": "regular learning" (việc học thường xuyên). regularity (danh từ), regulate (động từ), regularly (trạng từ) không đúng vị trí trước danh từ.',
      pedagogicalTip:
        'Vị trí trước danh từ/gerund → TÍNH TỪ. Lưu ý "regular learning" là cụm chuẩn trong văn phong công sở.',
    },
    {
      id: 'q-tets-104',
      section: 'reading',
      sectionName: 'Part 5: Incomplete Sentences (Điền câu)',
      question: 'Among ------- recognized at the company awards ceremony were senior business analyst Natalie Obi and sales associate Peter Comeau.',
      options: ['who', 'whose', 'they', 'those'],
      correctIndex: 3,
      explanation:
        '"Among those recognized at the ceremony" = trong số những người được vinh danh (those = đại từ thay cho the people). who/whose là đại từ quan hệ (cần mệnh đề), they không đứng sau among theo cấu trúc này.',
      pedagogicalTip:
        'Cấu trúc đảo: "Among + those + V-ed ... were + [danh sách]" — those thay cho danh từ số nhiều chỉ người.',
    },
    {
      id: 'q-tets-105',
      section: 'reading',
      sectionName: 'Part 5: Incomplete Sentences (Điền câu)',
      question: "All clothing sold in Develyn's Boutique is made from natural materials and contains no ------- dyes.",
      options: ['immediate', 'synthetic', 'reasonable', 'assumed'],
      correctIndex: 1,
      explanation:
        'Ngữ cảnh "made from natural materials and contains no ___ dyes" → cần tính từ trái nghĩa với "natural": synthetic (tổng hợp) → "no synthetic dyes" (không có thuốc nhuộm tổng hợp/hóa học).',
      pedagogicalTip:
        'Câu hỏi từ vựng: ghép cặp trái nghĩa natural ≠ synthetic. Đọc hết câu để nắm ngữ cảnh, đừng dịch từng từ rời.',
    },
    // ===================== PART 6: TEXT COMPLETION =====================
    {
      id: 'q-tets-131',
      section: 'reading',
      sectionName: 'Part 6: Text Completion (Email - Chỗ trống 131)',
      question: 'Trong email, chọn từ đúng nhất cho chỗ trống [131]: "several training sessions for ------- employees"',
      readingPassage:
        'To: Project Leads\nFrom: James Pak\nSubject: Training Courses\n\nTo all Pak Designs project leaders:\n\nIn the coming weeks, we will be organizing several training sessions for [131] employees. At Pak Designs, we believe that with the proper help and support from our senior project leaders, less experienced staff can quickly [132] a deep understanding of the design process. [133], they can improve their ability to communicate effectively across divisions. When employees at all experience levels interact, every employee\'s competency level rises and the business overall benefits. For that reason, we are urging experienced project leaders to attend each one of the interactive seminars that will be held throughout the coming month. [134]\n\nThank you for your support.\nJames Pak\nPak Designs',
      options: ['interest', 'interests', 'interested', 'interesting'],
      correctIndex: 2,
      explanation:
        'Cần tính từ bổ nghĩa cho "employees": "interested employees" (những nhân viên quan tâm) — tính từ đuôi -ed diễn tả cảm xúc của người. "interesting" tả vật gây hứng thú; interest/interests là danh từ/động từ.',
      pedagogicalTip:
        'Phân biệt -ed/-ing: -ed cho người (interested employees), -ing cho vật/sự việc (an interesting course).',
    },
    {
      id: 'q-tets-132',
      section: 'reading',
      sectionName: 'Part 6: Text Completion (Email - Chỗ trống 132)',
      question: 'Chọn từ đúng nhất cho chỗ trống [132]: "less experienced staff can quickly ------- a deep understanding"',
      readingPassage:
        'To: Project Leads\nFrom: James Pak\nSubject: Training Courses\n\nTo all Pak Designs project leaders:\n\nIn the coming weeks, we will be organizing several training sessions for [131] employees. At Pak Designs, we believe that with the proper help and support from our senior project leaders, less experienced staff can quickly [132] a deep understanding of the design process. [133], they can improve their ability to communicate effectively across divisions. When employees at all experience levels interact, every employee\'s competency level rises and the business overall benefits. For that reason, we are urging experienced project leaders to attend each one of the interactive seminars that will be held throughout the coming month. [134]\n\nThank you for your support.\nJames Pak\nPak Designs',
      options: ['develop', 'raise', 'open', 'complete'],
      correctIndex: 0,
      explanation:
        '"develop a deep understanding of..." (hình thành hiểu biết sâu sắc) là collocation chuẩn. raise (nâng lên) + raise awareness, không đi với "understanding"; open/complete không hợp nghĩa.',
      pedagogicalTip:
        'Học collocation: develop an understanding / develop skills / develop a plan. Đáp án Part 6 thường là cụm từ cố định.',
    },
    {
      id: 'q-tets-133',
      section: 'reading',
      sectionName: 'Part 6: Text Completion (Email - Chỗ trống 133)',
      question: 'Chọn từ/cụm nối đúng nhất cho chỗ trống [133]: "-------, they can improve their ability to communicate"',
      readingPassage:
        'To: Project Leads\nFrom: James Pak\nSubject: Training Courses\n\nTo all Pak Designs project leaders:\n\nIn the coming weeks, we will be organizing several training sessions for [131] employees. At Pak Designs, we believe that with the proper help and support from our senior project leaders, less experienced staff can quickly [132] a deep understanding of the design process. [133], they can improve their ability to communicate effectively across divisions. When employees at all experience levels interact, every employee\'s competency level rises and the business overall benefits. For that reason, we are urging experienced project leaders to attend each one of the interactive seminars that will be held throughout the coming month. [134]\n\nThank you for your support.\nJames Pak\nPak Designs',
      options: ['After all', 'For', 'Even so', 'At the same time'],
      correctIndex: 3,
      explanation:
        'Hai hoạt động diễn ra song song (hiểu quy trình thiết kế → đồng thời cải thiện giao tiếp): "At the same time" (đồng thời). "Even so" (dù vậy) chỉ sự tương phản không có trong ngữ cảnh; For/After all không đúng logic.',
      pedagogicalTip:
        'Phân tích quan hệ logic giữa hai câu (song song/tương phản/nhân quả) để chọn từ nối: same time = đồng thời.',
    },
    {
      id: 'q-tets-134',
      section: 'reading',
      sectionName: 'Part 6: Text Completion (Email - Chỗ trống 134)',
      question: 'Chọn câu đúng nhất cho chỗ trống [134] (cuối email): "...seminars that will be held throughout the coming month. [134] Thank you for your support."',
      readingPassage:
        'To: Project Leads\nFrom: James Pak\nSubject: Training Courses\n\nTo all Pak Designs project leaders:\n\nIn the coming weeks, we will be organizing several training sessions for [131] employees. At Pak Designs, we believe that with the proper help and support from our senior project leaders, less experienced staff can quickly [132] a deep understanding of the design process. [133], they can improve their ability to communicate effectively across divisions. When employees at all experience levels interact, every employee\'s competency level rises and the business overall benefits. For that reason, we are urging experienced project leaders to attend each one of the interactive seminars that will be held throughout the coming month. [134]\n\nThank you for your support.\nJames Pak\nPak Designs',
      options: [
        'Let me explain our plans for on-site staff training.',
        'We hope that you will strongly consider joining us.',
        'Today\'s training session will be postponed until Monday.',
        'This is the first in a series of such lectures.',
      ],
      correctIndex: 1,
      explanation:
        'Trước chỗ trống là lời kêu gọi "we are urging experienced project leaders to attend" → câu phù hợp tiếp theo là "We hope that you will strongly consider joining us." (mong bạn cân nhắc tham gia). Các câu còn lại không khớp mạch (buổi tập huấn chưa diễn ra, không phải buổi đầu tiên).',
      pedagogicalTip:
        'Câu chèn (sentence insertion): đọc câu TRƯỚC và SAU để chọn câu nối mạch ý — ở đây là lời mời → lời kết.',
    },
    // ===================== PART 7: READING COMPREHENSION =====================
    {
      id: 'q-tets-147',
      section: 'reading',
      sectionName: 'Part 7: Advertisement (Đọc hiểu)',
      question: 'What is suggested about the car?',
      readingPassage:
        'Used Car For Sale. Six-year-old Carlisle Custom. Only one owner. Low mileage. Car used to commute short distances to town. Brakes and tires replaced six months ago. Struts replaced two weeks ago. Air conditioning works well, but heater takes a while to warm up. Brand new spare tire included. Priced to sell. Owner going overseas at the end of this month and must sell the car. Call Firoozeh Ghorbani at (848) 555-0132.',
      options: ['It was recently repaired.', 'It has had more than one owner.', 'It is very fuel efficient.', 'It has been on sale for six months.'],
      correctIndex: 0,
      explanation:
        'Quảng cáo nêu: "Brakes and tires replaced six months ago. Struts replaced two weeks ago" → xe mới được sửa chữa gần đây (recently repaired). Đây là xe "Only one owner" (không phải nhiều chủ), không nói về mức tiêu hao nhiên liệu.',
      pedagogicalTip:
        'Câu hỏi suy luận nhẹ: liệt kê các bộ phận vừa thay = recently repaired. Chú ý từ "replaced" (thay mới).',
    },
    {
      id: 'q-tets-148',
      section: 'reading',
      sectionName: 'Part 7: Advertisement (Đọc hiểu)',
      question: 'According to the advertisement, why is Ms. Ghorbani selling her car?',
      readingPassage:
        'Used Car For Sale. Six-year-old Carlisle Custom. Only one owner. Low mileage. Car used to commute short distances to town. Brakes and tires replaced six months ago. Struts replaced two weeks ago. Air conditioning works well, but heater takes a while to warm up. Brand new spare tire included. Priced to sell. Owner going overseas at the end of this month and must sell the car. Call Firoozeh Ghorbani at (848) 555-0132.',
      options: [
        "She cannot repair the car's temperature control.",
        'She finds it difficult to maintain.',
        'She would like to have a newer model.',
        'She is leaving for another country.',
      ],
      correctIndex: 3,
      explanation:
        'Quảng cáo ghi: "Owner going overseas at the end of this month and must sell the car" → bà ấy đi nước ngoài (leaving for another country).',
      pedagogicalTip:
        'Paraphrase: going overseas = leaving for another country. Đáp án thường thay từ đồng nghĩa, không lặp từ gốc.',
    },
    {
      id: 'q-tets-149',
      section: 'reading',
      sectionName: 'Part 7: Newspaper Article (Đọc hiểu)',
      question: 'What is suggested about Mr. Benavidez?',
      readingPassage:
        "On Monday, Salinas Products, a large food distributor based in Mexico City, announced its plans to acquire the Pablo's restaurant chain. Pablo Benavidez, the chain's owner, had been considering holding an auction for ownership of the chain. He ultimately made the decision to sell to Salinas without seeking other offers. According to inside sources, Salinas has agreed to keep the restaurant's name as part of the deal. Mr. Benavidez started the business 40 years ago right after finishing school. He opened a small food stand in his hometown of Cancún. Following that, he opened restaurants in Puerto Vallarta and Veracruz, and there are now over 50 Pablo's restaurants nationwide.",
      options: [
        'He has hired Salinas Products to distribute his products.',
        'He has agreed to sell his business to Salinas Products.',
        'He has recently been hired as an employee of a school.',
        'He has been chosen to be the new president of Salinas Products.',
      ],
      correctIndex: 1,
      explanation:
        'Bài báo nêu: "He ultimately made the decision to sell to Salinas without seeking other offers" → ông Benavidez đồng ý bán chuỗi nhà hàng cho Salinas Products.',
      pedagogicalTip:
        'Câu hỏi "What is suggested about X": tìm hành động chính liên quan đến X trong đoạn (decided to sell to Salinas).',
    },
    {
      id: 'q-tets-150',
      section: 'reading',
      sectionName: 'Part 7: Newspaper Article (Đọc hiểu)',
      question: 'According to the article, where is Mr. Benavidez from?',
      readingPassage:
        "On Monday, Salinas Products, a large food distributor based in Mexico City, announced its plans to acquire the Pablo's restaurant chain. Pablo Benavidez, the chain's owner, had been considering holding an auction for ownership of the chain. He ultimately made the decision to sell to Salinas without seeking other offers. According to inside sources, Salinas has agreed to keep the restaurant's name as part of the deal. Mr. Benavidez started the business 40 years ago right after finishing school. He opened a small food stand in his hometown of Cancún. Following that, he opened restaurants in Puerto Vallarta and Veracruz, and there are now over 50 Pablo's restaurants nationwide.",
      options: ['Cancún', 'Veracruz', 'Mexico City', 'Puerto Vallarta'],
      correctIndex: 0,
      explanation:
        'Bài báo ghi: "He opened a small food stand in his hometown of Cancún" → quê của ông là Cancún (hometown = quê hương). Puerto Vallarta/Veracruz là nơi mở nhà hàng, Mexico City là trụ sở Salinas.',
      pedagogicalTip:
        'Câu hỏi chi tiết "where is he from": tìm "hometown" — phân biệt với các địa danh xuất hiện nhưng ở vai trò khác.',
    },
    {
      id: 'q-tets-151',
      section: 'reading',
      sectionName: 'Part 7: Newspaper Article (Đọc hiểu)',
      question: "What is indicated about the Pablo's restaurant chain?",
      readingPassage:
        "On Monday, Salinas Products, a large food distributor based in Mexico City, announced its plans to acquire the Pablo's restaurant chain. Pablo Benavidez, the chain's owner, had been considering holding an auction for ownership of the chain. He ultimately made the decision to sell to Salinas without seeking other offers. According to inside sources, Salinas has agreed to keep the restaurant's name as part of the deal. Mr. Benavidez started the business 40 years ago right after finishing school. He opened a small food stand in his hometown of Cancún. Following that, he opened restaurants in Puerto Vallarta and Veracruz, and there are now over 50 Pablo's restaurants nationwide.",
      options: ['It was recently sold in an auction.', 'It will soon change its name.', 'It was founded 40 years ago.', 'It operates in several countries.'],
      correctIndex: 2,
      explanation:
        '"Mr. Benavidez started the business 40 years ago right after finishing school" → chuỗi được thành lập cách đây 40 năm. Lưu ý: ông CÂN NHẮC bán đấu giá nhưng quyết định bán trực tiếp (không phải "sold in an auction"); Salinas giữ nguyên tên (không đổi tên).',
      pedagogicalTip:
        'Bẫy chi tiết: "considering holding an auction" ≠ "was sold in an auction". Đọc kỹ thì của câu và trạng từ.',
    },
    {
      id: 'q-tets-152',
      section: 'reading',
      sectionName: 'Part 7: Text Message Chain (Đọc hiểu)',
      question: 'What is suggested about Mr. Bach?',
      readingPassage:
        "SAM BACH 11:59 — My first flight was delayed, so I missed my connection in Beijing.\nSAM BACH 12:00 — So now, I'm going to be on a flight arriving in Kansai at 18:00.\nAKIRA OTANI 12:05 — OK. Same airline?\nSAM BACH 12:06 — It's still Fly Right Airlines. It will be later in the day but still in time for our client meeting.\nAKIRA OTANI 12:06 — I'll confirm the arrival time. Do you have any checked bags?\nSAM BACH 12:10 — I do. Would you mind meeting me at the door after I go through customs?\nAKIRA OTANI 12:15 — Sure thing. Parking spots can be hard to find, but now I'll have extra time to drive around and look.\nSAM BACH 12:16 — Yes, sorry about that. See you then!",
      options: ['He has been to Kansai more than once.', 'He currently works in Beijing.', 'He is on a business trip.', 'He works for Fly Right Airlines.'],
      correctIndex: 2,
      explanation:
        'Sam Bach nhắc "our client meeting" và chuyển chuyến bay để kịp cuộc họp với khách hàng → anh ấy đang đi công tác (on a business trip). Fly Right Airlines là hãng bay (không phải nơi làm việc).',
      pedagogicalTip:
        'Suy luận từ cụm từ: "client meeting" + đang di chuyển → business trip. Phân biệt hãng bay (airline) với công ty của khách hàng.',
    },
    {
      id: 'q-tets-153',
      section: 'reading',
      sectionName: 'Part 7: Text Message Chain (Đọc hiểu)',
      question: 'At 12:15, what does Mr. Otani mean when he writes, "Sure thing"?',
      readingPassage:
        "SAM BACH 11:59 — My first flight was delayed, so I missed my connection in Beijing.\nSAM BACH 12:00 — So now, I'm going to be on a flight arriving in Kansai at 18:00.\nAKIRA OTANI 12:05 — OK. Same airline?\nSAM BACH 12:06 — It's still Fly Right Airlines. It will be later in the day but still in time for our client meeting.\nAKIRA OTANI 12:06 — I'll confirm the arrival time. Do you have any checked bags?\nSAM BACH 12:10 — I do. Would you mind meeting me at the door after I go through customs?\nAKIRA OTANI 12:15 — Sure thing. Parking spots can be hard to find, but now I'll have extra time to drive around and look.\nSAM BACH 12:16 — Yes, sorry about that. See you then!",
      options: [
        'He has confirmed the arrival time of a flight.',
        'He is certain he will be able to find a parking place.',
        'He agrees to wait at the door near the customs area.',
        'He knows Mr. Bach must pass through customs.',
      ],
      correctIndex: 2,
      explanation:
        'Trước đó Sam Bach hỏi: "Would you mind meeting me at the door after I go through customs?" → "Sure thing" của Otani = đồng ý đón ở cửa khu hải quan (agrees to wait at the door near the customs area).',
      pedagogicalTip:
        'Câu hỏi "what does X mean": tìm câu hỏi/đề nghị NGAY TRƯỚC đó — đáp án là lời đồng ý cho đề nghị ấy.',
    },
    {
      id: 'q-tets-161',
      section: 'reading',
      sectionName: 'Part 7: Notice (Đọc hiểu)',
      question: 'What is indicated about advertising space on the Mooringtown Library notice board?',
      readingPassage:
        'Notice Board Space Available to Community Groups\nMooringtown Library is pleased to invite local community groups to use the free advertising space on its new notice board, located outside the front entrance of the library. Space on the board is available for up to four weeks at a time. Notices must be approved in advance at the library\'s front desk and must meet the following requirements. All content must be suitable for public display. The notice must be written or printed on standard-quality paper with dimensions of either 8.5 in x 11 in or 5.5 in x 8.5 in. The desired start and end date for display should be written in the front bottom right corner. — [1] —. Any notices that do not meet these requirements will not be considered and will be discarded. — [2] —. — [3] —. Submissions are now being accepted at the Mooringtown Library front desk. Please have the actual notice, in the format in which you would like it to appear, with you when you arrive. Within one business day, you will receive a call confirming that your notice has been added to the board. — [4] —.\nMooringtown Library\nwww.mooringtownlib.co.au',
      options: ['It is available at no charge.', 'It can be used for any length of time.', 'It is open to all area businesses.', 'It is intended mainly for sporting events.'],
      correctIndex: 0,
      explanation:
        'Thông báo ghi: "invite local community groups to use the free advertising space" → không gian quảng cáo miễn phí (available at no charge). Chỉ tối đa 4 tuần (không phải "any length of time"); dành cho community groups (không phải mọi doanh nghiệp).',
      pedagogicalTip:
        'Paraphrase: free = at no charge. Chú ý các giới hạn đi kèm (up to four weeks) để loại đáp án nhiễu "any length of time".',
    },
    {
      id: 'q-tets-162',
      section: 'reading',
      sectionName: 'Part 7: Notice (Đọc hiểu)',
      question: 'What is NOT a stated requirement for a notice to be placed on the board?',
      readingPassage:
        'Notice Board Space Available to Community Groups\nMooringtown Library is pleased to invite local community groups to use the free advertising space on its new notice board, located outside the front entrance of the library. Space on the board is available for up to four weeks at a time. Notices must be approved in advance at the library\'s front desk and must meet the following requirements. All content must be suitable for public display. The notice must be written or printed on standard-quality paper with dimensions of either 8.5 in x 11 in or 5.5 in x 8.5 in. The desired start and end date for display should be written in the front bottom right corner. — [1] —. Any notices that do not meet these requirements will not be considered and will be discarded. — [2] —. — [3] —. Submissions are now being accepted at the Mooringtown Library front desk. Please have the actual notice, in the format in which you would like it to appear, with you when you arrive. Within one business day, you will receive a call confirming that your notice has been added to the board. — [4] —.\nMooringtown Library\nwww.mooringtownlib.co.au',
      options: ['It must meet certain size requirements.', 'It must be marked with posting dates.', 'It must be reviewed beforehand.', 'It must be signed by a librarian.'],
      correctIndex: 3,
      explanation:
        'Thông báo yêu cầu: kích thước chuẩn (8.5x11 in...) ✓ A; ngày bắt đầu/kết thúc ghi ở góc phải dưới ✓ B; phải được duyệt trước tại quầy (approved in advance) ✓ C. Không hề yêu cầu "signed by a librarian" → D là đáp án (câu hỏi NOT).',
      pedagogicalTip:
        'Câu hỏi NOT: kiểm tra từng đáp án với văn bản, chọn đáp án KHÔNG được đề cập. Đáp án đúng thường là thông tin "nghe hợp lý" nhưng không có trong bài.',
    },
    {
      id: 'q-tets-163',
      section: 'reading',
      sectionName: 'Part 7: Notice (Đọc hiểu)',
      question: 'What should an advertiser bring to the library when making a submission?',
      readingPassage:
        'Notice Board Space Available to Community Groups\nMooringtown Library is pleased to invite local community groups to use the free advertising space on its new notice board, located outside the front entrance of the library. Space on the board is available for up to four weeks at a time. Notices must be approved in advance at the library\'s front desk and must meet the following requirements. All content must be suitable for public display. The notice must be written or printed on standard-quality paper with dimensions of either 8.5 in x 11 in or 5.5 in x 8.5 in. The desired start and end date for display should be written in the front bottom right corner. — [1] —. Any notices that do not meet these requirements will not be considered and will be discarded. — [2] —. — [3] —. Submissions are now being accepted at the Mooringtown Library front desk. Please have the actual notice, in the format in which you would like it to appear, with you when you arrive. Within one business day, you will receive a call confirming that your notice has been added to the board. — [4] —.\nMooringtown Library\nwww.mooringtownlib.co.au',
      options: ['An outline of proposed content', 'A final version of the notice', 'A completed submission form', 'A letter from an organization'],
      correctIndex: 1,
      explanation:
        'Thông báo ghi: "Please have the actual notice, in the format in which you would like it to appear, with you when you arrive" → mang bản hoàn chỉnh của thông báo (final version of the notice). Không có mẫu đơn (submission form) nào được nhắc.',
      pedagogicalTip:
        'Paraphrase: "the actual notice in the format you would like it to appear" = a final version of the notice.',
    },
    {
      id: 'q-tets-164',
      section: 'reading',
      sectionName: 'Part 7: Notice (Đọc hiểu)',
      question:
        'In which of the positions marked [1], [2], [3], and [4] does the following sentence best belong? "The name and telephone number of the person posting the notice must be clearly marked on the back."',
      readingPassage:
        'Notice Board Space Available to Community Groups\nMooringtown Library is pleased to invite local community groups to use the free advertising space on its new notice board, located outside the front entrance of the library. Space on the board is available for up to four weeks at a time. Notices must be approved in advance at the library\'s front desk and must meet the following requirements. All content must be suitable for public display. The notice must be written or printed on standard-quality paper with dimensions of either 8.5 in x 11 in or 5.5 in x 8.5 in. The desired start and end date for display should be written in the front bottom right corner. — [1] —. Any notices that do not meet these requirements will not be considered and will be discarded. — [2] —. — [3] —. Submissions are now being accepted at the Mooringtown Library front desk. Please have the actual notice, in the format in which you would like it to appear, with you when you arrive. Within one business day, you will receive a call confirming that your notice has been added to the board. — [4] —.\nMooringtown Library\nwww.mooringtownlib.co.au',
      options: ['[1]', '[2]', '[3]', '[4]'],
      correctIndex: 0,
      explanation:
        'Câu cần chèn nói về YÊU CẦU ghi tên + số điện thoại ở mặt sau thông báo — đây là yêu cầu về nội dung/hình thức, nên nằm ngay sau nhóm câu liệt kê các yêu cầu (kích thước, ngày tháng) tức vị trí [1], trước câu "Any notices that do not meet these requirements...". Các vị trí [2], [3], [4] thuộc phần hướng dẫn nộp bài.',
      pedagogicalTip:
        'Câu chèn dạng yêu cầu (must be...) nên nằm trong nhóm câu yêu cầu; dạng hướng dẫn (please, submissions) nằm ở phần hướng dẫn.',
    },
    {
      id: 'q-tets-176',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + E-mail (Đọc hiểu)',
      question: 'According to the advertisement, why should customers visit the Business Audio Pro Web site?',
      readingPassage:
        'BUSINESS AUDIO PRO (www.businessaudiopro.com)\nEnhance Your Company\'s Image with a Professionally Recorded Telephone Greeting\nA professional, personalized voicemail message creates an excellent first impression. Business Audio Pro meets your specifications to record a customized telephone greeting within three business days!\nServices We Offer:\n1. Professional Voice Talent for Voicemail Messages — We have numerous male and female voice actors with a wide range of tones, accents, and dialects. Visit businessaudiopro.com to hear examples of what each actor sounds like and choose the one that best suits your needs.\n2. On-Hold Messages — We also create professional on-hold messages with pleasant music to enhance your customers\' experience.\n3. Customized Script Writing — Our experienced script writers can help you craft a personalized message that distinguishes you and your business.\n4. Multilingual Voice Production — For those with a multilingual customer base, we offer services in a wide range of languages.\nSend us an e-mail (inquiry@businessaudiopro.com) with your contact information and your specific needs. A representative will call you within 24 hours to discuss your project and provide a price estimate.\n\nE-MAIL\nTo: inquiry@businessaudiopro.com\nFrom: j.annesly@anneslydata.com\nDate: June 25\nSubject: Request\nI found your notice in the newspaper and wish to use your services for my data-processing and transcription business. I am looking specifically for a professionally recorded voicemail greeting intended for my clients, and I wonder if you would be available to write and record this for me, and how soon. Since I work with English- and Spanish-speaking clients, I would like the message to be recorded in both languages. Please reach out to me at my mobile phone between the hours of 10:00 A.M. and 5:00 P.M. I hope to hear from you soon.\nThank you,\nJody Annesly\nAnnesly Data\n512-555-6879 (mobile)\n342 Maymill Road, Fort Worth, TX 70609',
      options: ['To hear voice samples', 'To add a new phone number', 'To submit a credit card payment', 'To request recording equipment'],
      correctIndex: 0,
      explanation:
        'Dịch vụ 1 ghi: "Visit businessaudiopro.com to hear examples of what each actor sounds like" → khách truy cập website để nghe thử giọng đọc mẫu (voice samples).',
      pedagogicalTip:
        'Câu hỏi "why visit the website": tìm lý do gắn với website trong bài — "to hear examples of what each actor sounds like".',
    },
    {
      id: 'q-tets-177',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + E-mail (Đọc hiểu)',
      question: 'What is suggested about Business Audio Pro?',
      readingPassage:
        'BUSINESS AUDIO PRO (www.businessaudiopro.com)\nEnhance Your Company\'s Image with a Professionally Recorded Telephone Greeting\nA professional, personalized voicemail message creates an excellent first impression. Business Audio Pro meets your specifications to record a customized telephone greeting within three business days!\nServices We Offer:\n1. Professional Voice Talent for Voicemail Messages — We have numerous male and female voice actors with a wide range of tones, accents, and dialects. Visit businessaudiopro.com to hear examples of what each actor sounds like and choose the one that best suits your needs.\n2. On-Hold Messages — We also create professional on-hold messages with pleasant music to enhance your customers\' experience.\n3. Customized Script Writing — Our experienced script writers can help you craft a personalized message that distinguishes you and your business.\n4. Multilingual Voice Production — For those with a multilingual customer base, we offer services in a wide range of languages.\nSend us an e-mail (inquiry@businessaudiopro.com) with your contact information and your specific needs. A representative will call you within 24 hours to discuss your project and provide a price estimate.\n\nE-MAIL\nTo: inquiry@businessaudiopro.com\nFrom: j.annesly@anneslydata.com\nDate: June 25\nSubject: Request\nI found your notice in the newspaper and wish to use your services for my data-processing and transcription business. I am looking specifically for a professionally recorded voicemail greeting intended for my clients, and I wonder if you would be available to write and record this for me, and how soon. Since I work with English- and Spanish-speaking clients, I would like the message to be recorded in both languages. Please reach out to me at my mobile phone between the hours of 10:00 A.M. and 5:00 P.M. I hope to hear from you soon.\nThank you,\nJody Annesly\nAnnesly Data\n512-555-6879 (mobile)\n342 Maymill Road, Fort Worth, TX 70609',
      options: ['It fills orders once a week.', 'It advertises in the newspaper.', 'It specializes in data-processing services.', 'It has recently expanded its business.'],
      correctIndex: 1,
      explanation:
        'Trong email, bà Annesly viết: "I found your notice in the newspaper" → Business Audio Pro có quảng cáo trên báo (advertises in the newspaper). Công ty bà Annesly (Annesly Data) mới làm data-processing, không phải Business Audio Pro.',
      pedagogicalTip:
        'Câu hỏi "what is suggested about X": cẩn thận với thông tin về công ty KHÁC trong email — đọc xác định chủ thể.',
    },
    {
      id: 'q-tets-178',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + E-mail (Đọc hiểu)',
      question: 'Who most likely is Ms. Annesly?',
      readingPassage:
        'BUSINESS AUDIO PRO (www.businessaudiopro.com)\nEnhance Your Company\'s Image with a Professionally Recorded Telephone Greeting\nA professional, personalized voicemail message creates an excellent first impression. Business Audio Pro meets your specifications to record a customized telephone greeting within three business days!\nServices We Offer:\n1. Professional Voice Talent for Voicemail Messages — We have numerous male and female voice actors with a wide range of tones, accents, and dialects. Visit businessaudiopro.com to hear examples of what each actor sounds like and choose the one that best suits your needs.\n2. On-Hold Messages — We also create professional on-hold messages with pleasant music to enhance your customers\' experience.\n3. Customized Script Writing — Our experienced script writers can help you craft a personalized message that distinguishes you and your business.\n4. Multilingual Voice Production — For those with a multilingual customer base, we offer services in a wide range of languages.\nSend us an e-mail (inquiry@businessaudiopro.com) with your contact information and your specific needs. A representative will call you within 24 hours to discuss your project and provide a price estimate.\n\nE-MAIL\nTo: inquiry@businessaudiopro.com\nFrom: j.annesly@anneslydata.com\nDate: June 25\nSubject: Request\nI found your notice in the newspaper and wish to use your services for my data-processing and transcription business. I am looking specifically for a professionally recorded voicemail greeting intended for my clients, and I wonder if you would be available to write and record this for me, and how soon. Since I work with English- and Spanish-speaking clients, I would like the message to be recorded in both languages. Please reach out to me at my mobile phone between the hours of 10:00 A.M. and 5:00 P.M. I hope to hear from you soon.\nThank you,\nJody Annesly\nAnnesly Data\n512-555-6879 (mobile)\n342 Maymill Road, Fort Worth, TX 70609',
      options: ['An actor', 'A script writer', 'A sales associate', 'A business owner'],
      correctIndex: 3,
      explanation:
        'Email ký tên "Jody Annesly / Annesly Data" và viết "my data-processing and transcription business", "my clients" → bà là chủ doanh nghiệp (a business owner).',
      pedagogicalTip:
        'Câu hỏi nghề nghiệp: dựa vào chữ ký email + cụm sở hữu "my business/my clients".',
    },
    {
      id: 'q-tets-179',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + E-mail (Đọc hiểu)',
      question: 'What service does Ms. Annesly NOT request from Business Audio Pro?',
      readingPassage:
        'BUSINESS AUDIO PRO (www.businessaudiopro.com)\nEnhance Your Company\'s Image with a Professionally Recorded Telephone Greeting\nA professional, personalized voicemail message creates an excellent first impression. Business Audio Pro meets your specifications to record a customized telephone greeting within three business days!\nServices We Offer:\n1. Professional Voice Talent for Voicemail Messages — We have numerous male and female voice actors with a wide range of tones, accents, and dialects. Visit businessaudiopro.com to hear examples of what each actor sounds like and choose the one that best suits your needs.\n2. On-Hold Messages — We also create professional on-hold messages with pleasant music to enhance your customers\' experience.\n3. Customized Script Writing — Our experienced script writers can help you craft a personalized message that distinguishes you and your business.\n4. Multilingual Voice Production — For those with a multilingual customer base, we offer services in a wide range of languages.\nSend us an e-mail (inquiry@businessaudiopro.com) with your contact information and your specific needs. A representative will call you within 24 hours to discuss your project and provide a price estimate.\n\nE-MAIL\nTo: inquiry@businessaudiopro.com\nFrom: j.annesly@anneslydata.com\nDate: June 25\nSubject: Request\nI found your notice in the newspaper and wish to use your services for my data-processing and transcription business. I am looking specifically for a professionally recorded voicemail greeting intended for my clients, and I wonder if you would be available to write and record this for me, and how soon. Since I work with English- and Spanish-speaking clients, I would like the message to be recorded in both languages. Please reach out to me at my mobile phone between the hours of 10:00 A.M. and 5:00 P.M. I hope to hear from you soon.\nThank you,\nJody Annesly\nAnnesly Data\n512-555-6879 (mobile)\n342 Maymill Road, Fort Worth, TX 70609',
      options: ['Professional voice talent', 'On-hold messages', 'Customized script writing', 'Multilingual voice production'],
      correctIndex: 1,
      explanation:
        'Bà yêu cầu: "professionally recorded voicemail greeting" (= voice talent ✓ A), "available to write and record this for me" (= script writing ✓ C), "recorded in both languages" (= multilingual ✓ D). Không đề cập on-hold messages (nhạc chờ) → B.',
      pedagogicalTip:
        'Câu hỏi NOT: đối chiếu từng dịch vụ trong quảng cáo với nội dung email; dịch vụ không xuất hiện trong yêu cầu là đáp án.',
    },
    {
      id: 'q-tets-180',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + E-mail (Đọc hiểu)',
      question: 'What will Ms. Annesly most likely do within 24 hours?',
      readingPassage:
        'BUSINESS AUDIO PRO (www.businessaudiopro.com)\nEnhance Your Company\'s Image with a Professionally Recorded Telephone Greeting\nA professional, personalized voicemail message creates an excellent first impression. Business Audio Pro meets your specifications to record a customized telephone greeting within three business days!\nServices We Offer:\n1. Professional Voice Talent for Voicemail Messages — We have numerous male and female voice actors with a wide range of tones, accents, and dialects. Visit businessaudiopro.com to hear examples of what each actor sounds like and choose the one that best suits your needs.\n2. On-Hold Messages — We also create professional on-hold messages with pleasant music to enhance your customers\' experience.\n3. Customized Script Writing — Our experienced script writers can help you craft a personalized message that distinguishes you and your business.\n4. Multilingual Voice Production — For those with a multilingual customer base, we offer services in a wide range of languages.\nSend us an e-mail (inquiry@businessaudiopro.com) with your contact information and your specific needs. A representative will call you within 24 hours to discuss your project and provide a price estimate.\n\nE-MAIL\nTo: inquiry@businessaudiopro.com\nFrom: j.annesly@anneslydata.com\nDate: June 25\nSubject: Request\nI found your notice in the newspaper and wish to use your services for my data-processing and transcription business. I am looking specifically for a professionally recorded voicemail greeting intended for my clients, and I wonder if you would be available to write and record this for me, and how soon. Since I work with English- and Spanish-speaking clients, I would like the message to be recorded in both languages. Please reach out to me at my mobile phone between the hours of 10:00 A.M. and 5:00 P.M. I hope to hear from you soon.\nThank you,\nJody Annesly\nAnnesly Data\n512-555-6879 (mobile)\n342 Maymill Road, Fort Worth, TX 70609',
      options: ['Meet with an actor', 'Visit a recording studio', 'Write a script', 'Speak with a representative'],
      correctIndex: 3,
      explanation:
        'Quảng cáo ghi: "A representative will call you within 24 hours" → trong 24 giờ tới, bà Annesly sẽ nói chuyện với nhân viên đại diện (speak with a representative). Không có thông tin về gặp diễn viên, đến studio hay viết kịch bản.',
      pedagogicalTip:
        'Câu hỏi "what will X most likely do": tìm hoạt động tương lai gắn với khung thời gian được hỏi (within 24 hours → representative will call).',
    },
    {
      id: 'q-tets-196',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + Cart + E-mail (Đọc hiểu)',
      question: 'In the advertisement, the word "top" in paragraph 1, line 2, is closest in meaning to',
      readingPassage:
        'SPARKY PAINTS ADVERTISEMENT\nSparky Paints, Inc., makes it easy to select the right colors for your home. Browse through hundreds of colors on our Web site, www.sparkypaints.com. Select your top colors, and we\'ll send free samples right to your door. Our color samples are three times larger than typical samples found in home-improvement stores and come with self-adhesive backing, allowing you to adhere them to your walls so you can easily see how colors will coordinate in your home. When you\'re ready to begin painting, simply select your chosen colors online, and we\'ll ship the paint of your choice to arrive at your home within 3-5 business days, or within 2 business days for an additional expedited shipping fee.\n*Actual colors may differ slightly from what appears on your monitor. For this reason, we recommend ordering several samples in similar shades.\n\nONLINE SHOPPING CART\nOrder Summary #3397  Customer: Arun Phan\nCaspian Blue SP 237 — n/a — Qty 1 — $0.00\nDeep Sea Blue SP 298 — n/a — Qty 1 — $0.00\nStormy Blue SP 722 — n/a — Qty 1 — $0.00\nMisty Gray SP 944 — Gallon — Qty 2 — $50.00\nTax (8 percent) $4.00 / Expedited shipping $18.99 / Total $72.99\n[Proceed to Checkout]\n\nE-MAIL\nFrom: Arun Phan <arun.phan@tnet.com>\nTo: Customer Support <support@sparkypaints.com>\nDate: March 12\nSubject: Order #3397\nHello,\nThanks for sending my order #3397—it arrived this morning. Unfortunately, the paint was not the one I had asked for. I had selected color SP 944 but received SP 945 (Ocean Waves). They appear right next to each other on your Web site, so the two may have been confused at your end. Could you send me the correct paint, along with additional samples that are close in color to SP 722? That sample worked well in my house; the others looked too green on my walls.\nThank you,\nArun Phan',
      options: ['maximum', 'favorite', 'important', 'upper'],
      correctIndex: 1,
      explanation:
        '"Select your top colors, and we\'ll send free samples" — trong ngữ cảnh chọn màu yêu thích để phối, "top" = favorite (ưu thích nhất). Không phải "maximum/upper" (nghĩa vị trí) hay "important".',
      pedagogicalTip:
        'Câu hỏi từ đồng nghĩa: dùng NGỮ CẢNH để chọn nghĩa — chọn màu để gửi mẫu → màu yêu thích, không phải nghĩa "cao/trên".',
    },
    {
      id: 'q-tets-197',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + Cart + E-mail (Đọc hiểu)',
      question: 'What are Sparky Paints customers advised to do?',
      readingPassage:
        'SPARKY PAINTS ADVERTISEMENT\nSparky Paints, Inc., makes it easy to select the right colors for your home. Browse through hundreds of colors on our Web site, www.sparkypaints.com. Select your top colors, and we\'ll send free samples right to your door. Our color samples are three times larger than typical samples found in home-improvement stores and come with self-adhesive backing, allowing you to adhere them to your walls so you can easily see how colors will coordinate in your home. When you\'re ready to begin painting, simply select your chosen colors online, and we\'ll ship the paint of your choice to arrive at your home within 3-5 business days, or within 2 business days for an additional expedited shipping fee.\n*Actual colors may differ slightly from what appears on your monitor. For this reason, we recommend ordering several samples in similar shades.\n\nONLINE SHOPPING CART\nOrder Summary #3397  Customer: Arun Phan\nCaspian Blue SP 237 — n/a — Qty 1 — $0.00\nDeep Sea Blue SP 298 — n/a — Qty 1 — $0.00\nStormy Blue SP 722 — n/a — Qty 1 — $0.00\nMisty Gray SP 944 — Gallon — Qty 2 — $50.00\nTax (8 percent) $4.00 / Expedited shipping $18.99 / Total $72.99\n[Proceed to Checkout]\n\nE-MAIL\nFrom: Arun Phan <arun.phan@tnet.com>\nTo: Customer Support <support@sparkypaints.com>\nDate: March 12\nSubject: Order #3397\nHello,\nThanks for sending my order #3397—it arrived this morning. Unfortunately, the paint was not the one I had asked for. I had selected color SP 944 but received SP 945 (Ocean Waves). They appear right next to each other on your Web site, so the two may have been confused at your end. Could you send me the correct paint, along with additional samples that are close in color to SP 722? That sample worked well in my house; the others looked too green on my walls.\nThank you,\nArun Phan',
      options: ['Apply an adhesive to color samples', 'Visit a store to compare paint colors', 'Adjust the color on their computer monitor', 'Order samples of several similar colors'],
      correctIndex: 3,
      explanation:
        'Ghi chú cuối quảng cáo: "*Actual colors may differ slightly from what appears on your monitor. For this reason, we recommend ordering several samples in similar shades." → khuyến nghị đặt nhiều mẫu màu tương tự (order several samples in similar shades). Mẫu đã có keo sẵn (self-adhesive), không cần bôi keo.',
      pedagogicalTip:
        'Câu hỏi "what are customers advised to do": tìm động từ khuyến nghị "recommend/advise/suggest" + hành động theo sau.',
    },
    {
      id: 'q-tets-198',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + Cart + E-mail (Đọc hiểu)',
      question: 'What is most likely true about order #3397?',
      readingPassage:
        'SPARKY PAINTS ADVERTISEMENT\nSparky Paints, Inc., makes it easy to select the right colors for your home. Browse through hundreds of colors on our Web site, www.sparkypaints.com. Select your top colors, and we\'ll send free samples right to your door. Our color samples are three times larger than typical samples found in home-improvement stores and come with self-adhesive backing, allowing you to adhere them to your walls so you can easily see how colors will coordinate in your home. When you\'re ready to begin painting, simply select your chosen colors online, and we\'ll ship the paint of your choice to arrive at your home within 3-5 business days, or within 2 business days for an additional expedited shipping fee.\n*Actual colors may differ slightly from what appears on your monitor. For this reason, we recommend ordering several samples in similar shades.\n\nONLINE SHOPPING CART\nOrder Summary #3397  Customer: Arun Phan\nCaspian Blue SP 237 — n/a — Qty 1 — $0.00\nDeep Sea Blue SP 298 — n/a — Qty 1 — $0.00\nStormy Blue SP 722 — n/a — Qty 1 — $0.00\nMisty Gray SP 944 — Gallon — Qty 2 — $50.00\nTax (8 percent) $4.00 / Expedited shipping $18.99 / Total $72.99\n[Proceed to Checkout]\n\nE-MAIL\nFrom: Arun Phan <arun.phan@tnet.com>\nTo: Customer Support <support@sparkypaints.com>\nDate: March 12\nSubject: Order #3397\nHello,\nThanks for sending my order #3397—it arrived this morning. Unfortunately, the paint was not the one I had asked for. I had selected color SP 944 but received SP 945 (Ocean Waves). They appear right next to each other on your Web site, so the two may have been confused at your end. Could you send me the correct paint, along with additional samples that are close in color to SP 722? That sample worked well in my house; the others looked too green on my walls.\nThank you,\nArun Phan',
      options: ['It arrived within two business days.', 'It included an extra sample.', 'It was shipped in February.', 'It contained four gallons of paint.'],
      correctIndex: 0,
      explanation:
        'Giỏ hàng ghi "Expedited shipping $18.99" — dịch vụ giao nhanh 2 ngày làm việc (theo quảng cáo: "within 2 business days for an additional expedited shipping fee"), và email ngày 12/3 xác nhận "it arrived this morning" → đơn đến trong vòng 2 ngày làm việc. Giỏ chỉ có 2 gallon (không phải 4).',
      pedagogicalTip:
        'Câu hỏi suy luận nhiều nguồn: kết hợp quảng cáo (thời gian giao) + giỏ hàng (phí expedited) + email (ngày nhận) để suy ra.',
    },
    {
      id: 'q-tets-199',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + Cart + E-mail (Đọc hiểu)',
      question: 'Which color does Mr. Phan indicate that he likes?',
      readingPassage:
        'SPARKY PAINTS ADVERTISEMENT\nSparky Paints, Inc., makes it easy to select the right colors for your home. Browse through hundreds of colors on our Web site, www.sparkypaints.com. Select your top colors, and we\'ll send free samples right to your door. Our color samples are three times larger than typical samples found in home-improvement stores and come with self-adhesive backing, allowing you to adhere them to your walls so you can easily see how colors will coordinate in your home. When you\'re ready to begin painting, simply select your chosen colors online, and we\'ll ship the paint of your choice to arrive at your home within 3-5 business days, or within 2 business days for an additional expedited shipping fee.\n*Actual colors may differ slightly from what appears on your monitor. For this reason, we recommend ordering several samples in similar shades.\n\nONLINE SHOPPING CART\nOrder Summary #3397  Customer: Arun Phan\nCaspian Blue SP 237 — n/a — Qty 1 — $0.00\nDeep Sea Blue SP 298 — n/a — Qty 1 — $0.00\nStormy Blue SP 722 — n/a — Qty 1 — $0.00\nMisty Gray SP 944 — Gallon — Qty 2 — $50.00\nTax (8 percent) $4.00 / Expedited shipping $18.99 / Total $72.99\n[Proceed to Checkout]\n\nE-MAIL\nFrom: Arun Phan <arun.phan@tnet.com>\nTo: Customer Support <support@sparkypaints.com>\nDate: March 12\nSubject: Order #3397\nHello,\nThanks for sending my order #3397—it arrived this morning. Unfortunately, the paint was not the one I had asked for. I had selected color SP 944 but received SP 945 (Ocean Waves). They appear right next to each other on your Web site, so the two may have been confused at your end. Could you send me the correct paint, along with additional samples that are close in color to SP 722? That sample worked well in my house; the others looked too green on my walls.\nThank you,\nArun Phan',
      options: ['Caspian Blue', 'Deep Sea Blue', 'Stormy Blue', 'Misty Gray'],
      correctIndex: 2,
      explanation:
        'Email viết: "additional samples that are close in color to SP 722. That sample worked well in my house" → màu SP 722 = Stormy Blue (theo giỏ hàng). Ông ấy thích Stormy Blue.',
      pedagogicalTip:
        'Câu hỏi nối thông tin chéo: tìm mã màu (SP 722) trong email → tra tên màu trong giỏ hàng (Stormy Blue).',
    },
    {
      id: 'q-tets-200',
      section: 'reading',
      sectionName: 'Part 7: Advertisement + Cart + E-mail (Đọc hiểu)',
      question: 'What problem does Mr. Phan mention in his e-mail?',
      readingPassage:
        'SPARKY PAINTS ADVERTISEMENT\nSparky Paints, Inc., makes it easy to select the right colors for your home. Browse through hundreds of colors on our Web site, www.sparkypaints.com. Select your top colors, and we\'ll send free samples right to your door. Our color samples are three times larger than typical samples found in home-improvement stores and come with self-adhesive backing, allowing you to adhere them to your walls so you can easily see how colors will coordinate in your home. When you\'re ready to begin painting, simply select your chosen colors online, and we\'ll ship the paint of your choice to arrive at your home within 3-5 business days, or within 2 business days for an additional expedited shipping fee.\n*Actual colors may differ slightly from what appears on your monitor. For this reason, we recommend ordering several samples in similar shades.\n\nONLINE SHOPPING CART\nOrder Summary #3397  Customer: Arun Phan\nCaspian Blue SP 237 — n/a — Qty 1 — $0.00\nDeep Sea Blue SP 298 — n/a — Qty 1 — $0.00\nStormy Blue SP 722 — n/a — Qty 1 — $0.00\nMisty Gray SP 944 — Gallon — Qty 2 — $50.00\nTax (8 percent) $4.00 / Expedited shipping $18.99 / Total $72.99\n[Proceed to Checkout]\n\nE-MAIL\nFrom: Arun Phan <arun.phan@tnet.com>\nTo: Customer Support <support@sparkypaints.com>\nDate: March 12\nSubject: Order #3397\nHello,\nThanks for sending my order #3397—it arrived this morning. Unfortunately, the paint was not the one I had asked for. I had selected color SP 944 but received SP 945 (Ocean Waves). They appear right next to each other on your Web site, so the two may have been confused at your end. Could you send me the correct paint, along with additional samples that are close in color to SP 722? That sample worked well in my house; the others looked too green on my walls.\nThank you,\nArun Phan',
      options: ['He received the wrong item.', 'He was charged the wrong price.', 'The delivery time was too long.', 'The instructions were too confusing.'],
      correctIndex: 0,
      explanation:
        'Email: "the paint was not the one I had asked for. I had selected color SP 944 but received SP 945" → nhận sai sản phẩm (received the wrong item). Không phàn nàn giá, thời gian giao hay hướng dẫn.',
      pedagogicalTip:
        'Paraphrase vấn đề: "selected SP 944 but received SP 945" = received the wrong item (nhận nhầm hàng).',
    },
  ],
};

/**
 * TOEIC ETS Official Sample — Speaking & Writing Tasks.
 * Nguồn: ETS "TOEIC Speaking and Writing Sample Tests" (PDF công khai tại ets.org).
 * Giữ nguyên đề bài chính thức (đề bài nói/viết) + hướng dẫn chấm và gợi ý trả lời.
 */
export const TOEIC_ETS_SW_SET: ExamSet = {
  id: 'exam-toeic-ets-sw',
  title: 'TOEIC S&W Official Sample Tasks',
  vietnameseTitle: 'Đề Thi 19: TOEIC Speaking & Writing - Đề Mẫu Chính Thức ETS',
  category: 'toeic',
  categoryLabel: '🎯 TOEIC ETS Quốc Tế',
  level: 'B1 - B2',
  durationMinutes: 80,
  passingScore: 65,
  expReward: 400,
  coinReward: 500,
  badgeIcon: '🎤',
  summary:
    'Đề mẫu Speaking & Writing chính thức của ETS: 11 câu Nói (đọc to đoạn văn, trả lời câu hỏi, trả lời dùng thông tin cho sẵn, nêu quan điểm) + 3 nhiệm vụ Viết (viết câu theo ảnh, trả lời email, bài luận quan điểm). Kèm tiêu chí chấm điểm và gợi ý trả lời mẫu.',
  questions: [
    // ===================== SPEAKING =====================
    {
      id: 'q19-s1',
      section: 'speaking',
      sectionName: 'Speaking Q1-2: Read a Text Aloud (Đọc to)',
      taskType: 'speaking',
      question: 'Speaking Q1-2: Đọc to đoạn văn (45 giây chuẩn bị → 45 giây đọc).',
      speakingPrompt:
        'Directions: Read the text aloud. You will have 45 seconds to prepare. Then you will have 45 seconds to read the text aloud.\n\n— ĐOẠN VĂN —\nIf you\'re shopping, sightseeing and running around every minute, your vacation can seem like hard work. To avoid vacation stress, come to the Blue Valley Inn on beautiful Lake Mead. While staying at our inn, you\'ll breathe clean country air as you view spectacular sights. With its spacious rooms, swimming pool and many outdoor activities, the inn is the perfect place for a vacation you won\'t forget. The Blue Valley Inn prides itself on the personal attention it provides to every guest. The Blue Valley motto has always been "A happy guest is our greatest treasure."',
      prepTimeSeconds: 45,
      options: [],
      correctIndex: -1,
      explanation:
        'Đọc chậm rãi, rõ ràng, chú ý trọng âm từ: va-CA-tion, SIGHT-seeing, spec-TA-cu-lar, spa-cious, AT-ten-tion, TREA-sure. Ngắt câu theo dấu câu: nghỉ ngắn ở dấu phẩy, nghỉ rõ ở dấu chấm. Nhấn vào từ khóa: "hard work", "vacation stress", "perfect place", "greatest treasure".',
      pedagogicalTip:
        'Tiêu chí chấm Q1-2: phát âm (pronunciation) + ngữ điệu và trọng âm (intonation & stress). Luyện đọc thành tiếng 2-3 lần, đánh dấu chỗ ngắt câu trước khi bấm ghi âm.',
      modelAnswer:
        'Mẹo luyện: chọn 1 câu dài và đọc to 3 lần — lần 1 đúng tốc độ, lần 2 chậm hơn để rõ âm cuối (minutes, sights, guests), lần 3 tự nhiên có lên/xuống giọng ở cuối câu hỏi/kể.',
    },
    {
      id: 'q19-s2',
      section: 'speaking',
      sectionName: 'Speaking Q5-7 (Example 1): Respond to Questions',
      taskType: 'speaking',
      question: 'Speaking Q5: How often do you watch television? (3 giây chuẩn bị → 15 giây trả lời)',
      speakingPrompt:
        'Narrator: Imagine that a Canadian marketing firm is doing research in your country. You have agreed to participate in a telephone interview about television viewing.\n\nQuestion: How often do you watch television?',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Câu hỏi tần suất (how often) → trả lời bằng trạng từ tần suất + thời điểm: "I watch TV about an hour a day, usually in the evening after dinner." Nên thêm 1 chi tiết phụ (khi nào, ở đâu) để câu trả lời đủ 15 giây.',
      pedagogicalTip:
        'Q5-6 (15 giây): trả lời trực tiếp câu hỏi trong 2-3 câu là đủ. Đừng trả lời 1 từ — luôn kèm thông tin bổ sung ngắn.',
      modelAnswer:
        'I usually watch television for about an hour every evening, after I finish my dinner. On weekends, I sometimes watch longer — maybe two or three hours, especially if there is a good movie on.',
    },
    {
      id: 'q19-s3',
      section: 'speaking',
      sectionName: 'Speaking Q5-7 (Example 1): Respond to Questions',
      taskType: 'speaking',
      question: 'Speaking Q6: What kinds of programs do you usually watch? (3 giây chuẩn bị → 15 giây trả lời)',
      speakingPrompt:
        'Narrator: Imagine that a Canadian marketing firm is doing research in your country. You have agreed to participate in a telephone interview about television viewing.\n\nQuestion: What kinds of programs do you usually watch?',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Liệt kê 2-3 loại chương trình + lý do ngắn: "I mostly watch the news and sports. I also enjoy documentaries..." Dùng từ chỉ loại: news, sports, documentaries, talk shows, sitcoms, movies.',
      pedagogicalTip:
        'Với câu hỏi "what kinds": đưa 2-3 ví dụ cụ thể thay vì chỉ nói "many kinds". Ví dụ cụ thể giúp đạt tiêu chí completeness.',
      modelAnswer:
        'I mostly watch the news in the evening because I like to keep up with current events. I also enjoy sports programs, especially football matches, and sometimes I watch documentaries about nature or history on weekends.',
    },
    {
      id: 'q19-s4',
      section: 'speaking',
      sectionName: 'Speaking Q5-7 (Example 1): Respond to Questions',
      taskType: 'speaking',
      question: 'Speaking Q7: Describe your favorite television program. (3 giây chuẩn bị → 30 giây trả lời)',
      speakingPrompt:
        'Narrator: Imagine that a Canadian marketing firm is doing research in your country. You have agreed to participate in a telephone interview about television viewing.\n\nQuestion: Describe your favorite television program.',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Q7 có 30 giây → cần mô tả theo cấu trúc: (1) tên chương trình + thể loại, (2) nội dung chính, (3) khi nào phát sóng / bạn xem khi nào, (4) lý do bạn thích. Dùng hiện tại đơn.',
      pedagogicalTip:
        'Câu hỏi "describe": nói liền mạch, thêm chi tiết (who/what/when/why). 30 giây ≈ 6-8 câu đơn giản.',
      modelAnswer:
        'My favorite program is a weekly science show called "How Things Work." It explains how everyday objects — like elevators or smartphones — are made and how they function. It airs on Saturday evenings, and I never miss it. I like it because the hosts make complicated topics easy to understand, and I always learn something new.',
    },
    {
      id: 'q19-s5',
      section: 'speaking',
      sectionName: 'Speaking Q5-7 (Example 2): Respond to Questions',
      taskType: 'speaking',
      question: 'Speaking Q5: How many grocery stores are in your neighborhood, and can you walk to them? (3 giây → 15 giây)',
      speakingPrompt:
        'Narrator: Imagine that a friend will be moving to your neighborhood. You are having a telephone conversation about where you live.\n\nQuestion: How many grocery stores are in your neighborhood, and can you walk to them?',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Câu hỏi kép (how many + can you walk) → trả lời cả 2 vế: "There are two grocery stores near my house. One of them is just a five-minute walk away, so yes, I can easily walk there."',
      pedagogicalTip:
        'Câu hỏi 2 vế: luôn trả lời đủ cả hai. Nếu bỏ 1 vế, phần completeness sẽ bị trừ điểm.',
      modelAnswer:
        'There are two grocery stores in my neighborhood. One is a small family store just a five-minute walk from my house, so I can easily walk there. The other one is bigger, but it\'s about a fifteen-minute walk, so I usually go there by motorbike.',
    },
    {
      id: 'q19-s6',
      section: 'speaking',
      sectionName: 'Speaking Q5-7 (Example 2): Respond to Questions',
      taskType: 'speaking',
      question: "Speaking Q6: What's the best time of day to go to the grocery store, and why? (3 giây → 15 giây)",
      speakingPrompt:
        'Narrator: Imagine that a friend will be moving to your neighborhood. You are having a telephone conversation about where you live.\n\nQuestion: What\'s the best time of day to go to the grocery store, and why?',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Nêu thời điểm + lý do: "The best time is early in the morning, right after the store opens, because it\'s quiet and the shelves are fully stocked."',
      pedagogicalTip:
        'Dạng "best time ... and why": trả lời thời điểm (buổi sáng/chiều muộn...) kèm 1-2 lý do cụ thể (ít người, hàng tươi...).',
      modelAnswer:
        'I think the best time to go is early in the morning, right after the store opens around seven. It\'s quiet then, there are no long lines at the checkout, and the fresh vegetables have just been put out, so the quality is better.',
    },
    {
      id: 'q19-s7',
      section: 'speaking',
      sectionName: 'Speaking Q5-7 (Example 2): Respond to Questions',
      taskType: 'speaking',
      question: 'Speaking Q7: Do you usually buy all your groceries from the same store? Why or why not? (3 giây → 30 giây)',
      speakingPrompt:
        'Narrator: Imagine that a friend will be moving to your neighborhood. You are having a telephone conversation about where you live.\n\nQuestion: Do you usually buy all your groceries from the same store? Why or why not?',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Câu hỏi ý kiến + lý do (30 giây) → trả lời quan điểm trước, rồi đưa 2 lý do/ví dụ: "Not really — I buy most things at one store because it\'s close and cheap, but I go to the market for fresh meat and vegetables."',
      pedagogicalTip:
        'Q7 cần dài hơn (30 giây): nêu quan điểm → lý do 1 → lý do 2/ví dụ → câu kết ngắn. Đừng quên trả lời cả phần "why".',
      modelAnswer:
        'Not really. I buy most of my groceries from one supermarket near my house because the prices are good and I know where everything is. But for fresh meat and vegetables, I prefer going to the open-air market on Sunday mornings — the food there is fresher and I can choose exactly what I want.',
    },
    {
      id: 'q19-s8',
      section: 'speaking',
      sectionName: 'Speaking Q8-10: Respond Using Information (Hội thảo)',
      taskType: 'speaking',
      question: 'Speaking Q8: Could you tell me what time the conference starts and how long it will last? (3 giây → 15 giây)',
      speakingPrompt:
        'Narrator: Hello, I\'m calling about a conference on May 27 I saw advertised in the newspaper. It\'s about starting your own business. I was hoping you could give me some information.\n\nQuestion: Could you tell me what time the conference starts and how long it will last?\n\n— THÔNG TIN HỘI THẢO —\nSTARTING AND MANAGING YOUR OWN BUSINESS\nMay 27 — Bristol Office Building\n\n9:00 A.M.  Financing Your Business, Room 210 (Martha Ross, CPA)\n11:00 A.M. How to Promote Your Own Business, Room 312 (Howard Brown, Brown Publishers)\n           hoặc: Planning for Profit, Room 318 (John Phillips, Phillips Associates)\n1:00 P.M.  Lunch*\n2:00 P.M.  Sales Techniques Workshop, Room 246 (Helen King, West Side Consultants)\n4:00 P.M.  General Discussion\n\nRegistration fee: Individuals $95.00 / Members of the Business Information Center $75.00\n*Lunch not included.',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Tra thông tin trong bảng: bắt đầu 9:00 A.M., sự kiện cuối là General Discussion lúc 4:00 P.M. → "The conference starts at nine and runs until four, with a general discussion at the end — so it lasts about seven hours."',
      pedagogicalTip:
        'Q8-10 (dùng thông tin): CHỈ trả lời bằng dữ liệu trong bảng. Trả lời cả hai vế của câu hỏi (giờ bắt đầu + thời lượng).',
      modelAnswer:
        'The conference starts at nine o\'clock in the morning and finishes at four in the afternoon, with a general discussion at the end. So it lasts about seven hours in total.',
    },
    {
      id: 'q19-s9',
      section: 'speaking',
      sectionName: 'Speaking Q8-10: Respond Using Information (Hội thảo)',
      taskType: 'speaking',
      question: 'Speaking Q9: How much does conference attendance cost? (3 giây → 15 giây)',
      speakingPrompt:
        'Narrator: Hello, I\'m calling about a conference on May 27 I saw advertised in the newspaper. It\'s about starting your own business. I was hoping you could give me some information.\n\nQuestion: How much does conference attendance cost?\n\n— THÔNG TIN HỘI THẢO —\nSTARTING AND MANAGING YOUR OWN BUSINESS\nMay 27 — Bristol Office Building\n\n9:00 A.M.  Financing Your Business, Room 210 (Martha Ross, CPA)\n11:00 A.M. How to Promote Your Own Business, Room 312 (Howard Brown, Brown Publishers)\n           hoặc: Planning for Profit, Room 318 (John Phillips, Phillips Associates)\n1:00 P.M.  Lunch*\n2:00 P.M.  Sales Techniques Workshop, Room 246 (Helen King, West Side Consultants)\n4:00 P.M.  General Discussion\n\nRegistration fee: Individuals $95.00 / Members of the Business Information Center $75.00\n*Lunch not included.',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Bảng ghi 2 mức phí: khách thường $95, thành viên Business Information Center $75 → trả lời cả hai mức để đầy đủ thông tin.',
      pedagogicalTip:
        'Khi bảng có nhiều mức giá/đối tượng: nêu tất cả các mức trong câu trả lời (individuals ... members ...).',
      modelAnswer:
        'Registration costs ninety-five dollars for individuals. If you are a member of the Business Information Center, you pay only seventy-five dollars. The fee doesn\'t include lunch, by the way.',
    },
    {
      id: 'q19-s10',
      section: 'speaking',
      sectionName: 'Speaking Q8-10: Respond Using Information (Hội thảo)',
      taskType: 'speaking',
      question: 'Speaking Q10: I may not be available for the full day. Could you give me information about the activities in the morning, before lunchtime? (3 giây → 30 giây)',
      speakingPrompt:
        'Narrator: Hello, I\'m calling about a conference on May 27 I saw advertised in the newspaper. It\'s about starting your own business. I was hoping you could give me some information.\n\nQuestion: I may not be available for the full day. Could you give me information about the activities in the morning, before lunchtime?\n\n— THÔNG TIN HỘI THẢO —\nSTARTING AND MANAGING YOUR OWN BUSINESS\nMay 27 — Bristol Office Building\n\n9:00 A.M.  Financing Your Business, Room 210 (Martha Ross, CPA)\n11:00 A.M. How to Promote Your Own Business, Room 312 (Howard Brown, Brown Publishers)\n           hoặc: Planning for Profit, Room 318 (John Phillips, Phillips Associates)\n1:00 P.M.  Lunch*\n2:00 P.M.  Sales Techniques Workshop, Room 246 (Helen King, West Side Consultants)\n4:00 P.M.  General Discussion\n\nRegistration fee: Individuals $95.00 / Members of the Business Information Center $75.00\n*Lunch not included.',
      prepTimeSeconds: 3,
      options: [],
      correctIndex: -1,
      explanation:
        'Các hoạt động buổi sáng (trước 1:00 P.M. Lunch): 9:00 Financing Your Business (Room 210); 11:00 chọn 1 trong 2 — How to Promote Your Own Business (Room 312) hoặc Planning for Profit (Room 318). Nêu đủ cả 3 hoạt động + số phòng.',
      pedagogicalTip:
        'Q10 (30 giây): liệt kê theo trật tự thời gian, nhấn mạnh điểm cần lưu ý (2 hội thảo 11:00 diễn ra song song — phải chọn 1). Đây là câu nghe 2 lần trong đề thi thật.',
      modelAnswer:
        'Certainly. The first session starts at nine — it\'s called "Financing Your Business," in Room 210. At eleven, you can choose between two sessions: "How to Promote Your Own Business" in Room 312, or "Planning for Profit" in Room 318. Then lunch is at one o\'clock. That\'s everything before lunchtime.',
    },
    {
      id: 'q19-s11',
      section: 'speaking',
      sectionName: 'Speaking Q11: Express an Opinion (Nêu quan điểm)',
      taskType: 'speaking',
      question: 'Speaking Q11: Nêu quan điểm về công việc lương thấp nhưng nhiều kỳ nghỉ (45 giây chuẩn bị → 60 giây nói).',
      speakingPrompt:
        'Narrator: Some people prefer to take a job that does not pay well but does provide a lot of time off from work. What is your opinion about taking a job with a low salary that has a lot of vacation time? Give reasons for your opinion.\n\n(Directions: You will have 45 seconds to prepare. Then you will have 60 seconds to speak.)',
      prepTimeSeconds: 45,
      options: [],
      correctIndex: -1,
      explanation:
        'Cấu trúc 60 giây: (1) Nêu quan điểm rõ ("In my opinion, ..."), (2) Lý do 1 (sức khỏe/cân bằng cuộc sống), (3) Lý do 2 (thời gian học thêm/kỹ năng mới), (4) Ví dụ hoặc nhượng bộ nhẹ ("Of course, salary still matters..."), (5) Kết luận ngắn. Nêu quan điểm NGAY ở câu đầu — không "dạo đầu" dài.',
      pedagogicalTip:
        'Q11 chấm mức độ phát triển ý: 1 quan điểm + 2 lý do + ví dụ. Tránh lặp từ; dùng đa dạng cấu trúc (Although..., I would choose..., What matters most is...).',
      modelAnswer:
        'In my opinion, I would consider a job with a lower salary if it offered a lot of vacation time, as long as the pay still covered my basic needs. First, time is something you can never get back — extra free time lets me rest, travel, and spend more time with my family, which improves my mental health. Second, I could use the time off to learn new skills or start a small side project. Of course, salary is still important, and a very low income would cause stress, but for a reasonable trade-off, I believe that time is more valuable than money.',
    },
    // ===================== WRITING =====================
    {
      id: 'q19-w1',
      section: 'writing',
      sectionName: 'Writing Q1-5: Write a Sentence Based on a Picture',
      taskType: 'writing',
      question: 'Writing Q1-5: Viết MỘT câu dựa trên bức ảnh, dùng 2 từ cho sẵn (8 phút).',
      writingPrompt:
        'Đề gốc: bức ảnh chụp sân bay (khu vực nhà ga). Từ bắt buộc: "airport terminal, so".\n\nHãy viết MỘT câu tiếng Anh hoàn chỉnh dựa trên bối cảnh sân bay, trong đó BẮT BUỘC dùng cả hai từ "airport terminal" và "so". Bạn có thể đổi dạng từ và đặt từ theo thứ tự bất kỳ.',
      minWords: 10,
      options: [],
      correctIndex: -1,
      explanation:
        'Câu mẫu: "The airport terminal was so crowded that the passengers had to wait in a long line." — dùng "so" ở cấu trúc so...that và "airport terminal" làm chủ ngữ. Chấm điểm dựa trên (1) ngữ pháp đúng, (2) câu liên quan đến bối cảnh bức ảnh.',
      pedagogicalTip:
        'Đủ 2 từ khóa + 1 câu hoàn chỉnh là được điểm tối đa phần này. Đừng viết 2 câu rời; đừng quên chia thì cho động từ.',
      modelAnswer:
        'The airport terminal was so busy that I had to wait over an hour to check in for my flight.',
    },
    {
      id: 'q19-w2',
      section: 'writing',
      sectionName: 'Writing Q6-7: Respond to a Written Request',
      taskType: 'writing',
      question: 'Writing Q6-7: Viết email trả lời Dale City Welcome Committee (10 phút, ≥ 2 yêu cầu thông tin).',
      writingPrompt:
        'Read the e-mail.\nFrom: Dale City Welcome Committee\nTo: New Dale City Resident\nSubject: Welcome to your new home!\nSent: July 23, 4:32 P.M.\n\nWelcome! We would like to be the first to welcome you to Dale City. We know that there are many things to do when you move, from finding your way around town to setting up your utilities. Please contact us if you need any help at all.\n\nDirections: Respond to the e-mail. Respond as if you have recently moved to a new city. In your e-mail to the committee, make at least TWO requests for information.',
      minWords: 100,
      options: [],
      correctIndex: -1,
      explanation:
        'Email cần có: (1) lời cảm ơn + xác nhận vừa chuyển đến, (2) ÍT NHẤT 2 câu hỏi thông tin (ví dụ: thủ tục đăng ký điện/nước, giờ mở cửa thư viện, tuyến xe buýt, trường học cho con...), (3) lời kết + tên ký. Lưu ý đề yêu cầu "at least TWO requests" — thiếu sẽ mất điểm.',
      pedagogicalTip:
        'Tiêu chí chấm Q6-7: chất lượng và đa dạng câu, từ vựng, tổ chức. Mở bài (Dear...), thân bài (requests rõ ràng), kết bài (Thank you / Best regards). Dùng câu hỏi lịch sự: "Could you tell me...?", "I was wondering if...".',
      modelAnswer:
        'Dear Dale City Welcome Committee,\n\nThank you very much for your warm welcome. My family and I moved to Dale City last week, and we are very happy to be here.\n\nI would like to ask for a little help with a few things. First, could you tell me where I need to go to set up our water and electricity services? I\'m not sure if there is a special office for new residents. Second, I would like to know the best way to find out about school options for my son, who is nine years old. If you can share any information about school registration deadlines, that would be very helpful.\n\nThank you again for your kindness. I look forward to hearing from you.\n\nBest regards,\nNguyen Van A',
    },
    {
      id: 'q19-w3',
      section: 'writing',
      sectionName: 'Writing Q8: Write an Opinion Essay',
      taskType: 'writing',
      question: 'Writing Q8: Viết bài luận nêu quan điểm, tối thiểu 300 từ (30 phút).',
      writingPrompt:
        'There are many ways to find a job: newspaper advertisements, Internet job search websites, and personal recommendations.\n\nWhat do you think is the best way to find a job? Give reasons or examples to support your opinion.\n\n(Directions: You have 30 minutes to plan, write, and revise your essay. Typically, an effective essay will contain a minimum of 300 words.)',
      minWords: 300,
      options: [],
      correctIndex: -1,
      explanation:
        'Cấu trúc bài luận: (1) Mở bài — paraphrase câu hỏi + nêu quan điểm rõ (ví dụ: personal recommendations là tốt nhất), (2) Thân bài 1 — lý do 1 + ví dụ cụ thể, (3) Thân bài 2 — lý do 2 + ví dụ, có thể nhượng bộ (dù Internet tiện nhưng...), (4) Kết bài — khẳng định lại + mở rộng. Chấm điểm: quan điểm có được hỗ trợ bởi lý do/ví dụ không, ngữ pháp, từ vựng, tổ chức.',
      pedagogicalTip:
        'Bí quyết đạt đủ 300 từ: mỗi thân bài viết theo công thức PEEL (Point — giải thích — Example — Link lại quan điểm). Dành 3-4 phút cuối để soát lỗi chia động từ và dấu câu.',
      modelAnswer:
        'Gợi ý dàn ý:\n• Intro: "When looking for a job, people usually rely on job websites, newspapers, or personal contacts. In my opinion, personal recommendations are the most effective way to find good work."\n• Body 1: Lý do — người giới thiệu hiểu rõ tính cách và năng lực của bạn hơn CV; ví dụ — 1 người bạn được đồng nghiệp cũ giới thiệu và được nhận sau 1 buổi phỏng vấn ngắn.\n• Body 2: Lý do — công việc qua giới thiệu thường có tỉ lệ phù hợp cao hơn, giảm rủi ro cho cả hai bên; nhượng bộ — dù các trang web tuyển dụng có hàng nghìn tin, cạnh tranh rất cao và nhiều tin không đáng tin.\n• Conclusion: "In conclusion, although online job boards are useful, I believe personal recommendations remain the best method, because trust and insider knowledge are hard to replace."',
    },
  ],
};

export const TOEIC_ETS_SETS: ExamSet[] = [TOEIC_ETS_ST05_SET, TOEIC_ETS_SW_SET];

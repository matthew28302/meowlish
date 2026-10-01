export interface ExamQuestion {
  id: string;
  section: 'listening' | 'vocabulary' | 'grammar' | 'pragmatics' | 'error_correction';
  sectionName: string;
  question: string;
  audioScript?: string;
  speakerRole?: string;
  contextSentence?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  pedagogicalTip: string;
}

export interface ExamSet {
  id: string;
  title: string;
  vietnameseTitle: string;
  category: 'starter' | 'daily' | 'workplace' | 'it-tech' | 'negotiation' | 'interview' | 'travel' | 'toeic' | 'vstep' | 'ielts' | 'toefl';
  categoryLabel: string;
  level: 'A1 - A2' | 'B1' | 'B1 - B2' | 'B2 - C1';
  durationMinutes: number;
  passingScore: number; // percentage, e.g. 70
  expReward: number;
  coinReward: number;
  badgeIcon: string;
  summary: string;
  questions: ExamQuestion[];
}

export const EXAM_SETS: ExamSet[] = [
  // =========================================================================
  // BỘ ĐỀ 1: PHẢN XẠ GIAO TIẾP CƠ BẢN (A1 - A2 STARTER)
  // =========================================================================
  {
    id: 'exam-starter-reflex',
    title: 'Basic Communicative Reflex & Daily Essentials',
    vietnameseTitle: 'Đề Thi 1: Phản Xạ Giao Tiếp Cơ Bản & Đời Sống Thường Nhật',
    category: 'starter',
    categoryLabel: '🌱 Căn Bản & Phản Xạ Nhanh',
    level: 'A1 - A2',
    durationMinutes: 15,
    passingScore: 70,
    expReward: 120,
    coinReward: 150,
    badgeIcon: '🌱',
    summary: 'Kiểm tra độ nhạy bén trong các tình huống chào hỏi, tự giới thiệu, gọi món cafe, hỏi đường và các câu phản xạ lịch thiệp căn bản.',
    questions: [
      {
        id: 'q1-1',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Một đồng nghiệp nước ngoài nói: "Thank you so much for your help today!" Cách đáp lại tự nhiên và thân thiện nhất là gì?',
        options: [
          'Nothing.',
          'You are welcome! Happy to help.',
          'Never mind, I am busy.',
          'Yes, of course I did it.'
        ],
        correctIndex: 1,
        explanation: '"You are welcome! Happy to help." (Không có gì đâu! Rất vui được giúp bạn) là câu trả lời chuẩn mực, thể hiện sự nhiệt tình.',
        pedagogicalTip: 'Tránh dùng "Nothing" vì mang sắc thái cộc lốc trong tiếng Anh.'
      },
      {
        id: 'q1-2',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Nghe đoạn thoại tại quán cafe. Người phụ nữ muốn gọi loại thức uống nào?',
        audioScript: 'Good morning! Could I get an iced Americano with no sugar, and a chocolate muffin to go, please?',
        speakerRole: 'Customer at Coffee Shop',
        options: [
          'Hot latte with extra sugar',
          'Iced Americano with no sugar',
          'Hot tea with honey',
          'Chocolate milk shake'
        ],
        correctIndex: 1,
        explanation: 'Khách hàng nói rõ: "Could I get an iced Americano with no sugar..." (Cho tôi một ly Americano đá không đường).',
        pedagogicalTip: 'Cụm "to go" nghĩa là mang đi (takeaway), dùng rất phổ biến ở Bắc Mỹ.'
      },
      {
        id: 'q1-3',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Chọn từ thích hợp điền vào chỗ trống: "Excuse me, could you tell me the _______ to the nearest subway station?"',
        options: [
          'roadway',
          'way',
          'street',
          'travel'
        ],
        correctIndex: 1,
        explanation: 'Cụm từ chuẩn để hỏi đường là "tell me the way to + địa điểm" (chỉ cho tôi đường tới...).',
        pedagogicalTip: 'Học cả cụm "could you tell me the way to..." thay vì ghép từng từ rời rạc.'
      },
      {
        id: 'q1-4',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu đúng khi hỏi về hành động đang diễn ra lúc này:',
        options: [
          'What do you do right now?',
          'What are you doing right now?',
          'What did you doing right now?',
          'What you are doing right now?'
        ],
        correctIndex: 1,
        explanation: 'Dấu hiệu "right now" chỉ hành động đang diễn ra ở hiện tại, công thức câu hỏi là: Wh-word + am/is/are + S + V-ing?',
        pedagogicalTip: '"What do you do?" nghĩa là hỏi nghề nghiệp ("Bạn làm nghề gì?"), còn "What are you doing?" là hỏi đang làm gì.'
      },
      {
        id: 'q1-5',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Tìm lỗi sai trong câu sau: "I am agree with your opinion about this plan."',
        options: [
          'Sai ở "am agree" -> nên sửa thành "agree"',
          'Sai ở "with" -> nên sửa thành "to"',
          'Sai ở "opinion" -> nên sửa thành "thought"',
          'Câu trên hoàn toàn đúng'
        ],
        correctIndex: 0,
        explanation: '"Agree" là một động từ (verb), không phải tính từ. Do đó ta nói "I agree with you", không dùng "I am agree".',
        pedagogicalTip: 'Lỗi "I am agree" là lỗi kinh điển của người Việt do dịch thô từ "Tôi đồng ý".'
      },
      {
        id: 'q1-6',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khi bạn không nghe rõ người đối diện vừa nói gì trong cuộc trò chuyện, câu nào lịch thiệp nhất để nhờ họ nhắc lại?',
        options: [
          'What? Speak louder.',
          'Pardon me, could you please repeat that?',
          'Say again now.',
          'Why you speak so fast?'
        ],
        correctIndex: 1,
        explanation: '"Pardon me, could you please repeat that?" (Xin lỗi, bạn có thể nhắc lại giúp tôi được không?) là cách lịch thiệp và tự nhiên nhất.',
        pedagogicalTip: 'Có thể dùng "Sorry, I did not catch that" trong môi trường thân mật.'
      },
      {
        id: 'q1-7',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Chọn cụm từ thích hợp: "It is getting late. Let us _______ and go home."',
        options: [
          'wrap it up',
          'make it up',
          'break it down',
          'put it off'
        ],
        correctIndex: 0,
        explanation: '"wrap it up" là thành ngữ mang nghĩa hoàn thành, kết thúc công việc để nghỉ ngơi.',
        pedagogicalTip: 'Cụm này dùng rất nhiều vào cuối ngày làm việc hoặc cuối buổi họp.'
      },
      {
        id: 'q1-8',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Điền từ vào câu mời lịch sự: "_______ you like to join us for lunch today?"',
        options: [
          'Do',
          'Would',
          'Will',
          'Can'
        ],
        correctIndex: 1,
        explanation: 'Cấu trúc lời mời trang trọng, lịch sự: "Would you like to + V-inf?" (Bạn có muốn... không?).',
        pedagogicalTip: 'Học thuộc lòng cấu trúc "Would you like + noun / to V" để mời mọc tự nhiên.'
      },
      {
        id: 'q1-9',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Theo lời người nói, cuộc họp sẽ diễn ra vào lúc nào và ở đâu?',
        audioScript: 'Hi guys, just a quick reminder that our sprint review meeting will be in Conference Room B at two thirty this afternoon.',
        speakerRole: 'Team Coordinator',
        options: [
          'Conference Room A at 2:00 PM',
          'Conference Room B at 2:30 PM',
          'Online via Zoom at 3:30 PM',
          'Cafeteria at 12:30 PM'
        ],
        correctIndex: 1,
        explanation: 'Người nói nêu rõ: "Conference Room B at two thirty this afternoon" (Phòng họp B lúc 2:30 chiều nay).',
        pedagogicalTip: 'Hai mươi ba mươi ("two thirty") là cách đọc giờ thông dụng thay cho "half past two".'
      },
      {
        id: 'q1-10',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Chọn câu diễn đạt chuẩn xác nhất khi muốn nói "Hẹn gặp lại bạn vào ngày mai nhé":',
        options: [
          'See you on tomorrow morning.',
          'See you tomorrow morning.',
          'I see you tomorrow at morning.',
          'See you in tomorrow.'
        ],
        correctIndex: 1,
        explanation: 'Trước các từ "tomorrow", "yesterday", "today", "next week" không dùng giới từ "in", "on", "at".',
        pedagogicalTip: 'Nói ngay: "See you tomorrow" - không thêm giới từ!'
      }
    ]
  },

  // =========================================================================
  // BỘ ĐỀ 2: GIAO TIẾP ĐỜI SỐNG, DU LỊCH & KẾT BẠN (B1 DAILY & TRAVEL)
  // =========================================================================
  {
    id: 'exam-daily-life',
    title: 'Social Small Talk, Travel & Everyday Fluency',
    vietnameseTitle: 'Đề Thi 2: Giao Tiếp Đời Sống, Du Lịch & Phá Băng Xã Hội',
    category: 'daily',
    categoryLabel: '☕ Đời Sống & Du Lịch',
    level: 'B1',
    durationMinutes: 18,
    passingScore: 70,
    expReward: 160,
    coinReward: 200,
    badgeIcon: '✈️',
    summary: 'Đánh giá khả năng bắt chuyện (Small Talk), đặt phòng khách sạn, làm thủ tục hải quan sân bay, giải quyết sự cố và chia sẻ quan điểm cá nhân.',
    questions: [
      {
        id: 'q2-1',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Bạn gặp một người bạn nước ngoài mới quen ở thang máy. Đâu là câu "bắt chuyện phá băng" (icebreaker) tự nhiên nhất?',
        options: [
          'How much money do you make a month?',
          'Nice weather we are having today, isn\'t it?',
          'Why are you not married yet?',
          'Tell me your personal secrets.'
        ],
        correctIndex: 1,
        explanation: 'Trong văn hóa phương Tây, thời tiết và môi trường xung quanh là đề tài Small Talk an toàn và nhã nhặn nhất. Các câu hỏi về tiền bạc hay hôn nhân là điều tối kỵ.',
        pedagogicalTip: 'Hỏi về thời tiết, thể thao hoặc món ăn yêu thích là chìa khoá bắt chuyện vàng.'
      },
      {
        id: 'q2-2',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Nghe nhân viên lễ tân khách sạn thông báo. Bữa sáng tự chọn được phục vụ ở đâu và trong khung giờ nào?',
        audioScript: 'Welcome to Grand Pacific Hotel! Here is your room key for room 402. Breakfast is served at the Sky Lounge on the 10th floor from 6:30 AM to 10:00 AM every day.',
        speakerRole: 'Hotel Receptionist',
        options: [
          'Ground floor restaurant from 7:00 AM to 11:00 AM',
          'Sky Lounge on the 10th floor from 6:30 AM to 10:00 AM',
          'In your room from 8:00 AM to 9:00 AM',
          'Poolside cafe from 6:00 AM to 9:30 AM'
        ],
        correctIndex: 1,
        explanation: 'Lễ tân nói: "...at the Sky Lounge on the 10th floor from 6:30 AM to 10:00 AM every day."',
        pedagogicalTip: 'Khi nghe thông tin khách sạn, chú ý các số phòng (room key), tầng (floor) và giờ phục vụ (serving hours).'
      },
      {
        id: 'q2-3',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Tại sân bay, khu vực hành khách lấy lại hành lý ký gửi sau khi hạ cánh được gọi là:',
        options: [
          'Boarding gate',
          'Baggage claim',
          'Security checkpoint',
          'Duty-free zone'
        ],
        correctIndex: 1,
        explanation: '"Baggage claim" là khu vực băng chuyền trả hành lý ký gửi tại sân bay.',
        pedagogicalTip: '"Boarding gate" là cửa lên máy bay, "Security checkpoint" là cổng an ninh.'
      },
      {
        id: 'q2-4',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu diễn đạt dự định chắc chắn trong tương lai gần:',
        options: [
          'I am flying to Da Nang this Friday for a vacation.',
          'I flew to Da Nang this Friday.',
          'I fly to Da Nang this Friday maybe.',
          'I am fly to Da Nang this Friday.'
        ],
        correctIndex: 0,
        explanation: 'Thì hiện tại tiếp diễn (am/is/are + V-ing) dùng để diễn tả kế hoạch, lịch trình cá nhân chắc chắn đã được sắp xếp trước trong tương lai.',
        pedagogicalTip: 'Dùng V-ing cho các chuyến đi đã mua vé hoặc đặt lịch cụ thể.'
      },
      {
        id: 'q2-5',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Phát hiện lỗi sai trong câu đặt phòng: "I would like to book a room has a view of the sea."',
        options: [
          'Sai ở "book" -> sửa thành "rent"',
          'Thiếu đại từ quan hệ -> nên sửa thành "a room that has a view of the sea" hoặc "a room with a sea view"',
          'Sai ở "view of" -> sửa thành "view to"',
          'Câu không có lỗi'
        ],
        correctIndex: 1,
        explanation: 'Trong câu không thể có 2 động từ chính ("would like to book" và "has") đứng liền mà thiếu đại từ quan hệ (that/which). Cách tự nhiên nhất là: "a room with a sea view".',
        pedagogicalTip: 'Thuộc cụm "with a sea view" (nhìn ra biển) hoặc "with a city view" (nhìn ra thành phố).'
      },
      {
        id: 'q2-6',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Món ăn mang ra bàn bị nguội lạnh, bạn muốn nhờ nhân viên phục vụ làm nóng lại. Câu nào lịch sự và đúng mực nhất?',
        options: [
          'Hey you! The soup is cold. Take it away.',
          'Excuse me, could you please heat this up for me? It seems a bit cold.',
          'This food is terrible, you must pay me back.',
          'Why did you bring me cold soup?'
        ],
        correctIndex: 1,
        explanation: '"Excuse me, could you please heat this up for me? It seems a bit cold." là cách nói tôn trọng, chỉ ra vấn đề nhẹ nhàng mà không gây căng thẳng.',
        pedagogicalTip: 'Thêm "seems a bit..." giúp làm mềm lời phàn nàn, người nghe sẽ vui vẻ giúp đỡ bạn ngay.'
      },
      {
        id: 'q2-7',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Khi mua sắm ở chợ đêm du lịch, cụm từ nào mang nghĩa "mặc cả / thương lượng giá cả"?',
        options: [
          'window shopping',
          'bargain for a better price',
          'cash on delivery',
          'refund the item'
        ],
        correctIndex: 1,
        explanation: '"bargain" hoặc "haggle" nghĩa là mặc cả giá. Còn "window shopping" chỉ là đi ngắm đồ chứ không mua.',
        pedagogicalTip: 'Mẹo hỏi khéo giá sỉ: "Can you give me a discount if I buy three?"'
      },
      {
        id: 'q2-8',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Chuyến bay đi Tokyo gặp sự cố gì theo thông báo của loa sân bay?',
        audioScript: 'Attention passengers on flight VN302 to Tokyo Narita. Due to severe thunderstorms over the ocean, boarding will be delayed by forty-five minutes. Please remain seated near Gate 14.',
        speakerRole: 'Airport Announcer',
        options: [
          'The flight is completely canceled',
          'The boarding is delayed by 45 minutes due to thunderstorms',
          'The gate has been changed to Gate 40',
          'Passengers must collect their luggage immediately'
        ],
        correctIndex: 1,
        explanation: 'Loa thông báo: "Due to severe thunderstorms over the ocean, boarding will be delayed by forty-five minutes."',
        pedagogicalTip: 'Từ khoá "delayed by [time]" mang nghĩa bị hoãn lại bao nhiêu phút.'
      },
      {
        id: 'q2-9',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu gián tiếp lịch sự đúng cấu trúc khi hỏi giờ một người lạ:',
        options: [
          'Do you know what time is it?',
          'Do you know what time it is?',
          'Do you know what is the time?',
          'Tell me what time is it now.'
        ],
        correctIndex: 1,
        explanation: 'Trong câu hỏi gián tiếp (Embedded Question), sau từ để hỏi trật tự từ trở về dạng khẳng định: S + V (what time it is).',
        pedagogicalTip: 'Ghi nhớ: "What time is it?" NHƯNG "Do you know what time it is?"'
      },
      {
        id: 'q2-10',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Một người bạn hỏi: "How was your weekend trip to the mountains?" Câu trả lời nào tự nhiên và hào hứng nhất?',
        options: [
          'It was so-so, nothing.',
          'It was incredible! The scenery was breathtaking and the air was so fresh.',
          'I don\'t want to answer.',
          'Trip is trip.'
        ],
        correctIndex: 1,
        explanation: '"It was incredible! The scenery was breathtaking..." (Chuyến đi tuyệt vời lắm! Cảnh sắc đẹp ngỡ ngàng...) giúp cuộc trò chuyện cởi mở và thú vị.',
        pedagogicalTip: 'Dùng tính từ mạnh như "breathtaking" (đẹp nín thở), "incredible" thay cho các từ chung chung như "good".'
      }
    ]
  },

  // =========================================================================
  // BỘ ĐỀ 3: TIẾNG ANH CÔNG SỞ & HỌP HÀNH QUỐC TẾ (B1 - B2 WORKPLACE)
  // =========================================================================
  {
    id: 'exam-workplace-meeting',
    title: 'Workplace Communication, Email & Meeting Mastery',
    vietnameseTitle: 'Đề Thi 3: Tiếng Anh Công Sở, Viết Email & Chủ Trì Cuộc Họp',
    category: 'workplace',
    categoryLabel: '💼 Công Sở & Họp Hành',
    level: 'B1 - B2',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 180,
    coinReward: 220,
    badgeIcon: '💼',
    summary: 'Rèn luyện phản xạ phát biểu trong cuộc họp, ngắt lời lịch sự, viết email xin nghỉ phép/báo cáo, giao tiếp với sếp và đồng nghiệp đa văn hoá.',
    questions: [
      {
        id: 'q3-1',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Trong cuộc họp online, bạn muốn ngắt lời đồng nghiệp một cách lịch sự để bổ sung một ý quan trọng. Bạn sẽ nói:',
        options: [
          'Stop talking, it is my turn now.',
          'Sorry to interrupt, but could I add a quick point here?',
          'You are talking too much.',
          'Shut up please.'
        ],
        correctIndex: 1,
        explanation: '"Sorry to interrupt, but could I add a quick point here?" là mẫu câu kinh điển trong phòng họp quốc tế để ngắt lời lịch thiệp.',
        pedagogicalTip: 'Sau khi nói xong, có thể nói thêm: "Thanks, please continue" để trả lại lượt nói cho đồng nghiệp.'
      },
      {
        id: 'q3-2',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Trong cuộc họp ban giám đốc, người trình bày đề xuất gì để cắt giảm chi phí vận hành?',
        audioScript: 'Looking at our Q3 expenses, cloud hosting accounts for thirty percent of our budget. If we migrate idle test databases to auto-scaling instances, we can save roughly fifteen thousand dollars per quarter.',
        speakerRole: 'VP of Engineering',
        options: [
          'Lay off twenty percent of junior staff',
          'Migrate idle test databases to auto-scaling instances to save $15,000 per quarter',
          'Cancel all cloud hosting subscriptions completely',
          'Increase the price of the mobile app'
        ],
        correctIndex: 1,
        explanation: 'Người nói đề xuất: "...migrate idle test databases to auto-scaling instances, we can save roughly fifteen thousand dollars per quarter."',
        pedagogicalTip: 'Trong các bài thi công sở, câu trả lời thường chứa cụm giải pháp kỹ thuật cụ thể và số tiền/thời gian tiết kiệm được.'
      },
      {
        id: 'q3-3',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Điền từ vào email công việc: "Please find the quarterly financial report _______ to this email."',
        options: [
          'attached',
          'glued',
          'stuck',
          'enclosed'
        ],
        correctIndex: 0,
        explanation: 'Trong email điện tử, cụm từ chuẩn mực là "attached to this email" (được đính kèm trong email này). "Enclosed" thường dùng cho thư tay trong phong bì.',
        pedagogicalTip: 'Mẫu câu vàng khi gửi file: "Please find the attached document for your review."'
      },
      {
        id: 'q3-4',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu nhờ vả thể hiện mức độ tôn trọng và lịch thiệp cao nhất (dành cho sếp hoặc đối tác lớn):',
        options: [
          'Can you sign this document now?',
          'Would you mind reviewing and signing this agreement when you have a moment?',
          'You must sign this agreement.',
          'Sign this agreement please.'
        ],
        correctIndex: 1,
        explanation: '"Would you mind + V-ing... when you have a moment?" thể hiện sự tôn trọng tuyệt đối quỹ thời gian của cấp trên hoặc đối tác.',
        pedagogicalTip: 'Nhớ kỹ: Sau "Would you mind" luôn luôn là động từ dạng V-ing.'
      },
      {
        id: 'q3-5',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Tìm lỗi trong câu mở đầu email: "I am writing this email to explain you about the new policy."',
        options: [
          'Sai ở "explain you" -> nên sửa thành "explain to you" hoặc "inform you of"',
          'Sai ở "I am writing" -> nên sửa thành "I write"',
          'Sai ở "policy" -> nên sửa thành "rule"',
          'Không có lỗi'
        ],
        correctIndex: 0,
        explanation: 'Động từ "explain" không đi trực tiếp với tân ngữ chỉ người; cấu trúc chuẩn là "explain something to someone" hoặc dùng "inform someone of something".',
        pedagogicalTip: 'Tránh nói "explain me", hãy nói "explain to me" hoặc "clarify this for me".'
      },
      {
        id: 'q3-6',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khi bạn không thể hoàn thành báo cáo đúng hạn deadline ngày mai, cách xử lý chuyên nghiệp nhất qua tin nhắn Slack với sếp là gì?',
        options: [
          'Im lặng và biến mất, đợi đến khi sếp hỏi mới trả lời.',
          'Chủ động báo trước: giải thích lý do khách quan ngắn gọn, mốc thời gian hoàn tất mới và xin lỗi vì sự bất tiện.',
          'Đổ lỗi hoàn toàn cho đồng nghiệp khác trong nhóm.',
          'Báo là ngày mai xin nghỉ ốm.'
        ],
        correctIndex: 1,
        explanation: 'Giao tiếp chủ động (Proactive communication) trước deadline kèm giải pháp và cam kết thời gian mới là chuẩn mực đạo đức nghề nghiệp.',
        pedagogicalTip: 'Mẫu câu: "Due to [reason], the task is taking longer than anticipated. I expect to wrap it up by [time]. Apologies for any inconvenience."'
      },
      {
        id: 'q3-7',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Cụm từ "on the same page" trong môi trường họp công sở mang ý nghĩa gì?',
        options: [
          'Cùng đọc một cuốn sách giáo khoa',
          'Đồng thuận, cùng hiểu và nhất trí về cùng một mục tiêu',
          'Chuyển sang trang web khác',
          'In tài liệu ra giấy'
        ],
        correctIndex: 1,
        explanation: '"To be on the same page" là thành ngữ chỉ trạng thái mọi người trong nhóm đều thống nhất và cùng hiểu đúng về một kế hoạch.',
        pedagogicalTip: 'Câu nói kinh điển: "Let us make sure everyone is on the same page before moving forward."'
      },
      {
        id: 'q3-8',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Người phụ trách dự án thông báo deadline mới cho bản demo là ngày nào?',
        audioScript: 'Attention team. The client requested two additional filter features. Because of this change, our demo deadline has been pushed back from Wednesday to Friday afternoon at three PM.',
        speakerRole: 'Project Manager',
        options: [
          'Wednesday morning at 9:00 AM',
          'Friday afternoon at 3:00 PM',
          'Next Monday at 10:00 AM',
          'No change, deadline remains Wednesday'
        ],
        correctIndex: 1,
        explanation: 'PM thông báo: "...deadline has been pushed back from Wednesday to Friday afternoon at three PM."',
        pedagogicalTip: '"pushed back" = lùi hạn chót sang thời gian muộn hơn; trái ngược với "brought forward" (đẩy sớm hơn).'
      },
      {
        id: 'q3-9',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu đúng thì Hiện Tại Hoàn Thành khi báo cáo kết quả công việc:',
        options: [
          'We already finished the security audit and delivered the findings.',
          'We have already finished the security audit and delivered the findings.',
          'We had already finished the security audit right now.',
          'We have finish the security audit already.'
        ],
        correctIndex: 1,
        explanation: 'Thì Hiện Tại Hoàn Thành (have/has + V3/ed) dùng để thông báo kết quả vừa mới hoàn thành có ảnh hưởng tới hiện tại.',
        pedagogicalTip: 'Dùng thì Hiện Tại Hoàn Thành khi cập nhật trạng thái công việc với sếp: "I have just deployed the update."'
      },
      {
        id: 'q3-10',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khi kết thúc một buổi họp hiệu quả với đối tác nước ngoài, câu chào kết nào chuyên nghiệp nhất?',
        options: [
          'Bye bye.',
          'Thank you all for your valuable time and constructive input today. Have a wonderful rest of your day!',
          'Finally the meeting is over, let us leave.',
          'Do not call me again.'
        ],
        correctIndex: 1,
        explanation: '"Thank you all for your valuable time and constructive input today..." là câu kết thúc cuộc họp hoàn hảo, tạo ấn tượng chuyên nghiệp cao cấp.',
        pedagogicalTip: 'Cụm "valuable time and constructive input" (thời gian quý báu và những đóng góp mang tính xây dựng) là cách diễn đạt đắt giá.'
      }
    ]
  },

  // =========================================================================
  // BỘ ĐỀ 4: TIẾNG ANH CHUYÊN NGÀNH IT & DỰ ÁN TECH (IT SOFTWARE & AGILE)
  // =========================================================================
  {
    id: 'exam-it-scrum-tech',
    title: 'IT Engineering, Agile Scrum & Code Review Communication',
    vietnameseTitle: 'Đề Thi 4: Tiếng Anh Chuyên Ngành IT, Agile Scrum & Review Code',
    category: 'it-tech',
    categoryLabel: '💻 IT & Kỹ Thuật Phần Mềm',
    level: 'B1 - B2',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 200,
    coinReward: 250,
    badgeIcon: '💻',
    summary: 'Dành riêng cho Lập trình viên, QA, Tech Lead: Báo cáo Standup, review pull request, giải thích nguyên nhân lỗi bug (root cause), hotfix và tối ưu hoá hệ thống.',
    questions: [
      {
        id: 'q4-1',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Trong buổi Daily Standup sáng nay, bạn đã xong task hôm qua, hôm nay làm task mới và không bị vướng gì. Bạn sẽ trình bày theo chuẩn Scrum thế nào?',
        options: [
          'I did many things yesterday. Today I do other things. Everything okay.',
          'Yesterday I wrapped up the responsive navigation bar. Today I am integrating the user profile API, and I currently have no blockers.',
          'I worked on code. Now working on bug. No problem.',
          'Yesterday fine, today fine, tomorrow fine.'
        ],
        correctIndex: 1,
        explanation: 'Cấu trúc 3 ý chuẩn quốc tế trong Daily Standup: (1) Hôm qua làm gì ("wrapped up..."), (2) Hôm nay làm gì ("integrating..."), (3) Có blocker không ("have no blockers").',
        pedagogicalTip: 'Ghi nhớ công thức vàng 3 phần: What I did, What I will do, Any blockers.'
      },
      {
        id: 'q4-2',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Theo giải thích của Senior Backend Engineer, nguyên nhân gây tràn bộ nhớ (memory leak) là do đâu?',
        audioScript: 'After profiling the production server, we discovered the memory leak was caused by unclosed database connections in the background notification worker. Each event loop kept retaining references without releasing them.',
        speakerRole: 'Senior Backend Engineer',
        options: [
          'Due to hackers attacking the firewall',
          'Due to unclosed database connections in the background notification worker',
          'Due to frontend users clicking buttons too fast',
          'Due to running out of hard drive disk space'
        ],
        correctIndex: 1,
        explanation: 'Kỹ sư nói rõ: "...the memory leak was caused by unclosed database connections in the background notification worker."',
        pedagogicalTip: 'Cụm "caused by unclosed database connections" (do các kết nối CSDL không được đóng) là thuật ngữ kỹ thuật phổ biến.'
      },
      {
        id: 'q4-3',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Khi một lỗi phần mềm chỉ xảy ra trong những điều kiện cực kỳ hiếm gặp hoặc ở biên giới hạn của hệ thống, thuật ngữ chuyên ngành gọi là:',
        options: [
          'border error',
          'edge case',
          'margin mistake',
          'corner defect'
        ],
        correctIndex: 1,
        explanation: '"edge case" là thuật ngữ kỹ thuật tiêu chuẩn để chỉ trường hợp biên hoặc tình huống hiếm gặp trong kiểm thử phần mềm.',
        pedagogicalTip: 'Thành ngữ thường gặp: "Make sure our unit tests cover all edge cases."'
      },
      {
        id: 'q4-4',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu điều kiện loại 1 đúng logic kỹ thuật khi giải thích cơ chế bảo vệ hệ thống:',
        options: [
          'If the API response time exceeds 3 seconds, the circuit breaker will trip automatically.',
          'If the API response time will exceed 3 seconds, the circuit breaker trips.',
          'If the API response time exceeded 3 seconds, the circuit breaker will trip.',
          'If the API response time exceeds 3 seconds, the circuit breaker tripped.'
        ],
        correctIndex: 0,
        explanation: 'Câu điều kiện loại 1: Mệnh đề If dùng thì Hiện tại đơn ("exceeds"), mệnh đề chính dùng "will + V" ("will trip").',
        pedagogicalTip: 'Không bao giờ dùng "will" trong mệnh đề "If"!'
      },
      {
        id: 'q4-5',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Khi review Pull Request của đồng nghiệp, câu nhận xét nào sau đây là văn minh và mang tính xây dựng nhất?',
        options: [
          'Your code is ugly and messy. Rewrite everything.',
          'Looks great overall! Just a minor suggestion: could we extract this helper function to improve readability?',
          'Why did you write such bad code?',
          'I reject this PR without explanation.'
        ],
        correctIndex: 1,
        explanation: 'Văn hóa Code Review chuẩn quốc tế tuân theo nguyên tắc "Khen ngợi tổng thể + Gợi ý đóng góp mang tính xây dựng" (Constructive feedback).',
        pedagogicalTip: 'Dùng các cụm từ làm mềm như "Just a minor suggestion:", "Could we consider...".'
      },
      {
        id: 'q4-6',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Việc cải tiến cấu trúc mã nguồn nội bộ để dễ đọc, dễ bảo trì hơn mà KHÔNG làm thay đổi chức năng bên ngoài của phần mềm được gọi là:',
        options: [
          'refactoring',
          'rebuilding',
          'restarting',
          'reinstalling'
        ],
        correctIndex: 0,
        explanation: '"refactoring" (tái cấu trúc mã nguồn) là thuật ngữ cơ bản mà mọi lập trình viên đều phải dùng.',
        pedagogicalTip: 'Ví dụ: "We need to refactor the legacy payment service before adding new payment methods."'
      },
      {
        id: 'q4-7',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Hệ thống Production đang bị sập (downtime). Khách hàng nhắn tin hỏi dồn dập. Câu trả lời khéo léo và chuyên nghiệp nhất trong kênh thông báo sự cố là:',
        options: [
          'Everything is broken. We do not know what happened.',
          'We are aware of the ongoing incident and our engineering team is actively investigating the root cause. We will provide an update within 15 minutes.',
          'It is not our fault, blame AWS.',
          'Please do not disturb us right now.'
        ],
        correctIndex: 1,
        explanation: '"We are aware of the ongoing incident and our engineering team is actively investigating..." thể hiện sự chuyên nghiệp, trấn an khách hàng và cam kết mốc thời gian cập nhật cụ thể.',
        pedagogicalTip: 'Công thức xử lý khủng hoảng: Xác nhận sự cố + Hành động đang làm + Mốc thời gian báo cáo tiếp theo.'
      },
      {
        id: 'q4-8',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Theo QA Lead, các bước tái hiện (steps to reproduce) lỗi đăng nhập thất bại gồm những gì?',
        audioScript: 'To reproduce the bug, first switch your device language to Japanese, then attempt to login using single sign-on with Google. The auth callback fails with a 403 status code.',
        speakerRole: 'QA Lead',
        options: [
          'Login with Facebook on an iPhone',
          'Switch device language to Japanese, then attempt Google SSO login',
          'Restart your wifi router and clear browser cookies',
          'Upgrade the operating system to Android 15'
        ],
        correctIndex: 1,
        explanation: 'QA Lead chỉ rõ: "To reproduce the bug, first switch your device language to Japanese, then attempt to login using single sign-on with Google."',
        pedagogicalTip: '"steps to reproduce" là phần quan trọng nhất trong một bản báo cáo bug chuẩn Jira.'
      },
      {
        id: 'q4-9',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Khi một giải pháp không phải là cách giải quyết triệt để mà chỉ là một cách khắc phục tạm thời để vượt qua sự cố, từ nào diễn tả chuẩn xác nhất?',
        options: [
          'workaround',
          'permanent fix',
          'full feature',
          'architecture redesign'
        ],
        correctIndex: 0,
        explanation: '"workaround" là giải pháp tạm thời, "chữa cháy" trong khi chờ bản sửa lỗi chính thức.',
        pedagogicalTip: 'Ví dụ: "As a temporary workaround, users can restart the app to bypass the freeze."'
      },
      {
        id: 'q4-10',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Câu nào diễn tả đúng cụm từ viết tắt phổ biến "LGTM" trong phê duyệt pull request?',
        options: [
          'Let God Take Me',
          'Looks Good To Me',
          'Little Girl Takes Milk',
          'Low Graphic Team Member'
        ],
        correctIndex: 1,
        explanation: '"LGTM" = "Looks Good To Me" (Theo tôi thấy code đã ổn), được các kỹ sư trên toàn cầu dùng khi đồng ý phê duyệt merge PR trên GitHub/GitLab.',
        pedagogicalTip: 'Thường kèm emoji :shipit: hoặc :rocket: khi comment LGTM trên GitHub.'
      }
    ]
  },

  // =========================================================================
  // BỘ ĐỀ 5: ĐÀM PHÁN, THUYẾT TRÌNH & PHẢN BIỆN CAO CẤP (B2 - C1 EXECUTIVE)
  // =========================================================================
  {
    id: 'exam-negotiation-presentation',
    title: 'High-Stakes Negotiation, Presentation & Constructive Debate',
    vietnameseTitle: 'Đề Thi 5: Kỹ Năng Đàm Phán, Thuyết Trình & Phản Biện Cấp Cao',
    category: 'negotiation',
    categoryLabel: '🎯 Đàm Phán & Thuyết Trình',
    level: 'B2 - C1',
    durationMinutes: 22,
    passingScore: 75,
    expReward: 220,
    coinReward: 280,
    badgeIcon: '🎯',
    summary: 'Thử thách phản biện đa chiều, thuyết trình demo giải pháp cho các bên liên quan (Stakeholders), đàm phán phạm vi dự án (Scope Creep) và bảo vệ quan điểm kỹ thuật.',
    questions: [
      {
        id: 'q5-1',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khách hàng muốn bổ sung thêm 3 tính năng lớn vào dự án mà không muốn tăng chi phí hoặc lùi deadline (hiện tượng Scope Creep). Cách phản hồi ngoại giao và thuyết phục nhất là gì?',
        options: [
          'No, we won\'t do it. You are crazy.',
          'We completely understand the value of these features. However, adding them within the current sprint will impact the delivery timeline. We recommend phase 2 implementation, or prioritizing which feature is most critical for MVP.',
          'Okay, we will work overtime 24 hours a day without extra pay.',
          'That is your problem, talk to our lawyer.'
        ],
        correctIndex: 1,
        explanation: 'Phương pháp đàm phán nguyên tắc: Thừa nhận giá trị của yêu cầu ("understand the value"), nêu rõ ảnh hưởng thực tế ("impact the delivery timeline") và đưa ra giải pháp thay thế hợp lý (phân kỳ Phase 2 hoặc chọn lọc MVP).',
        pedagogicalTip: 'Kỹ thuật "Yes, and..." hoặc "We can do X if we adjust Y" giúp đàm phán không đối đầu.'
      },
      {
        id: 'q5-2',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Trong buổi pitch thuyết trình sản phẩm, diễn giả nhấn mạnh điều gì làm nên lợi thế cạnh tranh cốt lõi của giải pháp?',
        audioScript: 'Unlike traditional monolithic solutions that require weeks of deployment, our micro-frontend architecture enables independent module updates with zero downtime, reducing time-to-market by sixty-five percent.',
        speakerRole: 'Chief Technology Officer (CTO)',
        options: [
          'It is cheaper because it uses unpaid open-source libraries',
          'Independent module updates with zero downtime, reducing time-to-market by 65%',
          'It replaces all software engineers with simple robots',
          'It requires no internet connection whatsoever'
        ],
        correctIndex: 1,
        explanation: 'Diễn giả nêu rõ: "...enables independent module updates with zero downtime, reducing time-to-market by sixty-five percent."',
        pedagogicalTip: '"time-to-market" nghĩa là thời gian từ khi lên ý tưởng đến khi ra mắt sản phẩm ra thị trường.'
      },
      {
        id: 'q5-3',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Trong đàm phán kinh doanh và kỹ thuật, sự đánh đổi giữa hai yếu tố (ví dụ: tốc độ phát triển nhanh vs chất lượng code hoàn hảo) được gọi là:',
        options: [
          'trade-off',
          'pay-off',
          'cut-off',
          'turn-off'
        ],
        correctIndex: 0,
        explanation: '"trade-off" là sự đánh đổi giữa được và mất khi đưa ra quyết định kiến trúc hoặc kinh doanh.',
        pedagogicalTip: 'Thành ngữ: "Every architectural choice has trade-offs."'
      },
      {
        id: 'q5-4',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu dùng cấu trúc Đảo Ngữ (Inversion) để nhấn mạnh sự an toàn của hệ thống trong buổi thuyết trình cao cấp:',
        options: [
          'Under no circumstances should sensitive user data be stored in plain text.',
          'Under no circumstances sensitive user data should be stored in plain text.',
          'Under no circumstances should sensitive user data is stored in plain text.',
          'Sensitive user data under no circumstances should store in plain text.'
        ],
        correctIndex: 0,
        explanation: 'Đảo ngữ với cụm từ phủ định đứng đầu câu: "Under no circumstances + trợ động từ (should) + S + V" tạo sắc thái trang trọng, kiên quyết.',
        pedagogicalTip: 'Đảo ngữ là kỹ thuật đắt giá giúp nâng tầm bài thuyết trình tiếng Anh lên trình độ C1.'
      },
      {
        id: 'q5-5',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khi đồng nghiệp đưa ra một ý kiến kiến trúc mà bạn thấy tiềm ẩn rủi ro lớn, kỹ thuật phản biện văn minh (Diplomatic Disagreement) nào chuẩn mực nhất?',
        options: [
          'That idea is completely wrong and dangerous.',
          'I see where you are coming from, but have we considered the latency implications when our user base scales to one million?',
          'You know nothing about software scalability.',
          'I disagree because I said so.'
        ],
        correctIndex: 1,
        explanation: '"I see where you are coming from, but have we considered..." (Tôi hiểu vì sao bạn đưa ra đề xuất đó, nhưng liệu chúng ta đã cân nhắc đến rủi ro...) là phương pháp phản biện qua câu hỏi dẫn dắt.',
        pedagogicalTip: 'Phản biện bằng câu hỏi mở ("Have we considered...") không bao giờ tấn công cá nhân người nói.'
      },
      {
        id: 'q5-6',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Thuật ngữ chỉ các bên liên quan mật thiết đến dự án (như khách hàng, nhà đầu tư, ban giám đốc, người dùng cuối) là:',
        options: [
          'stockholders',
          'stakeholders',
          'gatekeepers',
          'bystanders'
        ],
        correctIndex: 1,
        explanation: '"stakeholders" là các bên liên quan có lợi ích gắn liền với thành bại của dự án.',
        pedagogicalTip: 'Phân biệt: "shareholder" là cổ đông nắm giữ cổ phần, còn "stakeholder" bao gồm tất cả các bên liên quan.'
      },
      {
        id: 'q5-7',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Khách hàng đồng ý gia hạn thời gian bàn giao dự án với điều kiện kèm theo là gì?',
        audioScript: 'We can accept pushing the milestone delivery to the end of next month, on the condition that your team conducts full automated regression testing and provides weekly progress reports.',
        speakerRole: 'Enterprise Client Director',
        options: [
          'The team must refund half of the contract value',
          'The team conducts full automated regression testing and provides weekly progress reports',
          'The company sends engineers to work on-site in London',
          'The team must work on weekends without breaks'
        ],
        correctIndex: 1,
        explanation: 'Khách hàng nói: "...on the condition that your team conducts full automated regression testing and provides weekly progress reports."',
        pedagogicalTip: 'Cụm từ then chốt: "on the condition that..." (với điều kiện là...).'
      },
      {
        id: 'q5-8',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Chọn câu chuyển đoạn (Transition Sentence) chuẩn mực nhất trong bài thuyết trình khi chuyển sang chủ đề chi phí:',
        options: [
          'Now I talk about money.',
          'Now that we have covered the technical architecture, let us turn our attention to the financial forecast.',
          'Stop tech, now money time.',
          'I finish tech and now I go to budget.'
        ],
        correctIndex: 1,
        explanation: '"Now that we have covered [Topic A], let us turn our attention to [Topic B]" là mẫu câu chuyển đoạn kết nối kinh điển của các diễn giả chuyên nghiệp.',
        pedagogicalTip: 'Sử dụng câu nối mềm giúp bài thuyết trình liền mạch và có tính thuyết phục cao.'
      },
      {
        id: 'q5-9',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Khi đánh giá tính khả thi về mặt kỹ thuật trước khi cam kết triển khai một dự án mới, danh từ nào được sử dụng phổ biến nhất?',
        options: [
          'feasibility',
          'probability',
          'usability',
          'durability'
        ],
        correctIndex: 0,
        explanation: '"feasibility" (tính khả thi), thường đi kèm cụm "feasibility study" (nghiên cứu tính khả thi).',
        pedagogicalTip: 'Cụm từ: "We need to conduct a technical feasibility assessment before signing the contract."'
      },
      {
        id: 'q5-10',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khách hàng hỏi một câu hỏi kỹ thuật rất khó mà bạn chưa có số liệu chính xác ngay lúc đó. Cách xử lý chuyên nghiệp nhất tại chỗ là:',
        options: [
          'Đoán đại một con số để qua mắt khách hàng.',
          'Thẳng thắn và nhã nhặn: "That is a great question. I want to make sure I give you the exact verified numbers, so allow me to double-check with our infrastructure team and get back to you via email by 4 PM today."',
          'Nói thẳng: "I don\'t know, that\'s not my job."',
          'Lờ đi và nói sang chủ đề khác.'
        ],
        correctIndex: 1,
        explanation: 'Thừa nhận cần kiểm tra số liệu chính xác và cam kết mốc thời gian phản hồi cụ thể là chuẩn mực của một chuyên gia đẳng cấp.',
        pedagogicalTip: 'Nguyên tắc vàng: Thà hẹn trả lời sau với số liệu chính xác còn hơn đoán mò làm mất uy tín.'
      }
    ]
  },

  // =========================================================================
  // BỘ ĐỀ 6: PHỎNG VẤN XIN VIỆC & PHẢN XẠ TECH LEAD (JOB INTERVIEW & CAREER)
  // =========================================================================
  {
    id: 'exam-interview-mastery',
    title: 'English Job Interview, Behavioral STAR & Salary Negotiation',
    vietnameseTitle: 'Đề Thi 6: Phỏng Vấn Xin Việc, Phương Pháp STAR & Deal Lương',
    category: 'interview',
    categoryLabel: '🎓 Phỏng Vấn & Deal Lương',
    level: 'B1 - B2',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 200,
    coinReward: 250,
    badgeIcon: '🎓',
    summary: 'Bộ đề thực chiến trang bị câu trả lời phỏng vấn ứng biến theo phương pháp STAR, giới thiệu bản thân ấn tượng (Elevator Pitch) và đàm phán lương bổng thông minh.',
    questions: [
      {
        id: 'q6-1',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Người phỏng vấn hỏi câu mở đầu kinh điển: "Tell me about yourself." Cách trả lời nào thông minh và chuyên nghiệp nhất?',
        options: [
          'Kể chi tiết từ thời thơ ấu, sở thích nuôi mèo và chuyện tình cảm cá nhân.',
          'Tóm tắt Elevator Pitch (2 phút): Hiện tại đang làm gì & thế mạnh nổi bật, thành tựu quá khứ tiêu biểu, và lý do vì sao đam mê vị trí tại công ty này.',
          'Nói: "Everything is already written on my CV, please read it yourself."',
          'Hỏi ngược lại: "Why do you want to know about me?"'
        ],
        correctIndex: 1,
        explanation: 'Công thức Present - Past - Future trong Elevator Pitch: (1) Hiện tại làm gì, (2) Thành tựu chứng minh năng lực, (3) Vì sao vị trí này là bước tiến tiếp theo hoàn hảo.',
        pedagogicalTip: 'Thời lượng lý tưởng cho câu hỏi này là từ 90 đến 120 giây.'
      },
      {
        id: 'q6-2',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'Người phỏng vấn giải thích văn hóa làm việc của công ty theo mô hình nào?',
        audioScript: 'At our company, we adopt a hybrid working model. Engineers are expected to collaborate at the central office on Tuesdays and Thursdays, while having the flexibility to work remotely for the rest of the week.',
        speakerRole: 'Head of Talent Acquisition',
        options: [
          '100% full-time in the office without any remote work',
          'Hybrid model: in the office on Tuesdays and Thursdays, remote for the rest of the week',
          '100% remote without any office location',
          'Night shifts only from 10:00 PM to 6:00 AM'
        ],
        correctIndex: 1,
        explanation: 'Người tuyển dụng nêu: "...hybrid working model... at the central office on Tuesdays and Thursdays, while having the flexibility to work remotely for the rest of the week."',
        pedagogicalTip: '"hybrid model" là mô hình kết hợp linh hoạt giữa làm việc tại văn phòng và làm từ xa.'
      },
      {
        id: 'q6-3',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Phương pháp trả lời câu hỏi tình huống hành vi (Behavioral Interview) nổi tiếng nhất thế giới gồm 4 chữ cái STAR viết tắt của:',
        options: [
          'Simple, Trust, Action, Result',
          'Situation, Task, Action, Result',
          'Skill, Talent, Attitude, Reaction',
          'Start, Think, Apply, Repeat'
        ],
        correctIndex: 1,
        explanation: 'Mô hình STAR: Situation (Bối cảnh tình huống), Task (Nhiệm vụ đặt ra), Action (Hành động bạn đã làm), Result (Kết quả định lượng đạt được).',
        pedagogicalTip: 'Luôn tập trung nhiều nhất vào phần Action (bạn đã làm gì cụ thể) và Result (kết quả bằng số liệu % hoặc doanh số).'
      },
      {
        id: 'q6-4',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khi nhà tuyển dụng hỏi: "What is your greatest weakness?" (Điểm yếu lớn nhất của bạn là gì?), cách trả lời khôn ngoan nhất là:',
        options: [
          'I have no weaknesses, I am completely perfect.',
          'I am extremely lazy and hate waking up early in the morning.',
          'Nêu một kỹ năng đang được cải thiện thực sự, đi kèm kế hoạch và hành động cụ thể bạn đang thực hiện để khắc phục nó.',
          'Nói dối là tôi làm việc quá chăm chỉ đến mức quên ngủ.'
        ],
        correctIndex: 2,
        explanation: 'Nhà tuyển dụng muốn thấy tinh thần tự nhận thức (Self-awareness) và ý chí học hỏi không ngừng (Growth mindset). Nêu điểm yếu đi kèm giải pháp đang rèn luyện là câu trả lời ghi điểm tuyệt đối.',
        pedagogicalTip: 'Ví dụ: "Earlier in my career, I struggled with public speaking, so I enrolled in Toastmasters and now practice weekly."'
      },
      {
        id: 'q6-5',
        section: 'grammar',
        sectionName: 'Ngữ Pháp Giao Tiếp',
        question: 'Chọn câu diễn đạt thành tựu trong quá khứ theo thì Quá Khứ Đơn đi kèm số liệu định lượng:',
        options: [
          'I optimized the image processing pipeline, reducing server load by 40%.',
          'I optimize the image processing pipeline, reduce server load by 40%.',
          'I was optimizing the image processing pipeline, reduced server load by 40%.',
          'I have been optimize the image processing pipeline by 40%.'
        ],
        correctIndex: 0,
        explanation: 'Khi miêu tả thành tựu đã hoàn tất trong dự án trước đó, dùng thì Quá Khứ Đơn (V2/ed: optimized, reduced) kèm số liệu định lượng cụ thể.',
        pedagogicalTip: 'Nhớ công thức: Action Verb ở quá khứ + Metric số liệu cụ thể = Ấn tượng tuyển dụng sâu sắc.'
      },
      {
        id: 'q6-6',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Ngữ Cảnh',
        question: 'Khi đàm phán lương (Salary Negotiation), cụm từ "compensation package" bao gồm những gì?',
        options: [
          'Chỉ duy nhất tiền lương cứng hàng tháng',
          'Toàn bộ gói đãi ngộ: lương cơ bản, thưởng hiệu suất, cổ phiếu/quyền chọn mua cổ phiếu, bảo hiểm sức khỏe và ngày nghỉ phép',
          'Chỉ tiền ăn trưa và tiền gửi xe',
          'Các hình phạt nếu vi phạm kỷ luật'
        ],
        correctIndex: 1,
        explanation: '"compensation package" bao gồm toàn bộ thu nhập và quyền lợi: base salary, bonuses, stock options, health insurance, paid time off (PTO).',
        pedagogicalTip: 'Khi deal đãi ngộ, hãy nhìn vào tổng gói "total compensation" thay vì chỉ nhìn vào một con số lương cơ bản.'
      },
      {
        id: 'q6-7',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Khi người phỏng vấn đưa ra mức lương thấp hơn kỳ vọng của bạn, câu nói nào thể hiện kỹ năng đàm phán lịch sự và chuyên nghiệp?',
        options: [
          'That salary is insulting, I decline immediately.',
          'Thank you for the offer. Based on my five years of experience in distributed systems and the market benchmark for this role, I was targeting a range between $2,500 and $2,800. Is there any flexibility on this number?',
          'Give me more money or I won\'t work.',
          'I accept whatever you give me, I have no choice.'
        ],
        correctIndex: 1,
        explanation: '"Based on my experience and market benchmarks... Is there any flexibility on this number?" là câu mở đầu đàm phán lương chuẩn mực, căn cứ vào dữ liệu thị trường và giá trị bạn mang lại.',
        pedagogicalTip: 'Từ khóa "Is there any flexibility...?" mở ra cơ hội thương lượng mà không gây cảm giác ép buộc nhà tuyển dụng.'
      },
      {
        id: 'q6-8',
        section: 'listening',
        sectionName: 'Nghe Hiểu Đàm Thoại',
        question: 'HR thông báo các bước tiếp theo trong quy trình tuyển dụng là gì?',
        audioScript: 'Thank you for your time today. We are interviewing two more candidates tomorrow. You can expect to hear back from us with the final decision by Friday afternoon.',
        speakerRole: 'HR Interviewer',
        options: [
          'Take another 4-hour coding test right now',
          'Wait to receive the final decision by Friday afternoon',
          'Come to the office tomorrow at 8:00 AM for onboarding',
          'The application was rejected immediately'
        ],
        correctIndex: 1,
        explanation: 'HR thông báo: "...You can expect to hear back from us with the final decision by Friday afternoon."',
        pedagogicalTip: 'Cụm từ "hear back from us by [day]" nghĩa là nhận được thông báo phản hồi vào ngày đó.'
      },
      {
        id: 'q6-9',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Dùng Từ',
        question: 'Vào cuối buổi phỏng vấn khi được hỏi: "Do you have any questions for us?", phản hồi nào sau đây là TỆ NHẤT?',
        options: [
          'Hỏi về tầm nhìn sản phẩm của công ty trong 2 năm tới.',
          'Hỏi: "No, I don\'t have any questions at all. Can I leave now?"',
          'Hỏi về những thách thức lớn nhất mà nhóm kỹ thuật đang phải đối mặt.',
          'Hỏi về lộ trình đào tạo và cơ hội thăng tiến cho vị trí này.'
        ],
        correctIndex: 1,
        explanation: 'Nói "No, I have no questions" thể hiện bạn thiếu sự tò mò và nhiệt huyết với công việc. Hãy luôn chuẩn bị sẵn 2-3 câu hỏi sâu sắc về đội ngũ và văn hóa công ty.',
        pedagogicalTip: 'Câu hỏi hay để hỏi ngược: "What does success look like in this role in the first 90 days?"'
      },
      {
        id: 'q6-10',
        section: 'pragmatics',
        sectionName: 'Phản Xạ Tình Huống',
        question: 'Sau buổi phỏng vấn, bạn nên gửi một bức "Thank-you Email" vào lúc nào?',
        options: [
          'Không bao giờ gửi vì họ rất bận.',
          'Trong vòng 24 giờ sau buổi phỏng vấn: cảm ơn thời gian của họ, nhắc lại ngắn gọn điểm mạnh và niềm hào hứng với vị trí.',
          'Đợi 1 tháng sau mới gửi.',
          'Gửi 10 email liên tục mỗi giờ để hối thúc kết quả.'
        ],
        correctIndex: 1,
        explanation: 'Gửi Thank-you Email trong vòng 24 giờ là chuẩn mực chuyên nghiệp hàng đầu tại các tập đoàn đa quốc gia, giúp bạn nổi bật hơn các ứng viên khác.',
        pedagogicalTip: 'Nhắc lại 1 chi tiết thú vị đã thảo luận trong buổi phỏng vấn để tạo dấu ấn cá nhân đậm nét.'
      }
    ]
  },
  // =========================================================================
  // BỘ ĐỀ 7: TIẾNG ANH DU LỊCH & SINH TỒN QUỐC TẾ (B1 TRAVEL & NAVIGATION)
  // =========================================================================
  {
    id: 'exam-travel-abroad',
    title: 'International Travel, Airport & Hospitality Communication',
    vietnameseTitle: 'Đề Thi 7: Tiếng Anh Du Lịch, Thủ Tục Sân Bay & Khách Sạn',
    category: 'travel',
    categoryLabel: '✈️ Du Lịch & Thủ Tục Quốc Tế',
    level: 'B1',
    durationMinutes: 15,
    passingScore: 70,
    expReward: 140,
    coinReward: 160,
    badgeIcon: '✈️',
    summary: 'Rèn luyện phản xạ thực tế khi xuất nhập cảnh, check-in khách sạn, đổi chuyến bay bị trễ (layover/delayed), và xử lý hành lý thất lạc.',
    questions: [
      {
        id: 'q7-1',
        section: 'pragmatics',
        sectionName: 'Thủ Tục Hải Quan',
        question: 'Tại quầy thủ tục xuất nhập cảnh (Immigration), viên chức hải quan hỏi: "What is the purpose of your visit?" Bạn nên trả lời ra sao?',
        options: [
          'I don\'t know why I came here.',
          'I am here for leisure and sightseeing for ten days.',
          'Why do you ask me that personal question?',
          'I want to find an illegal job.'
        ],
        correctIndex: 1,
        explanation: 'Khi trả lời hải quan, hãy trả lời ngắn gọn, trung thực mục đích chuyến đi (du lịch, công tác) và nêu rõ số ngày lưu trú.',
        pedagogicalTip: 'Mẫu câu chuẩn: "I am here for tourism / a business conference for [X] days, staying at [Hotel Name]."'
      },
      {
        id: 'q7-2',
        section: 'vocabulary',
        sectionName: 'Từ Vựng Hàng Không',
        question: 'Khi chuyến bay của bạn quá cảnh tại một sân bay trung gian trước khi bay tiếp đến đích đến cuối cùng, thời gian chờ này được gọi là gì?',
        options: [
          'Runway',
          'Layover',
          'Turbulence',
          'Cockpit'
        ],
        correctIndex: 1,
        explanation: '"Layover" (hoặc stopover) là điểm dừng quá cảnh giữa hai chặng bay. "Turbulence" là vùng nhiễu động không khí.',
        pedagogicalTip: 'Ví dụ: "I have a three-hour layover at Incheon Airport before flying to San Francisco."'
      },
      {
        id: 'q7-3',
        section: 'listening',
        sectionName: 'Nghe Hiểu Sân Bay',
        speakerRole: 'Airport Announcer',
        audioScript: 'Attention passengers on flight VN384 to Tokyo Narita. The departure gate has been changed from gate 12 to gate 28B due to maintenance. Boarding will commence at 14:45.',
        question: 'What important change was announced for flight VN384?',
        options: [
          'The flight was cancelled completely.',
          'Passengers must pay an extra baggage fee.',
          'The departure gate moved to gate 28B.',
          'The flight will land at Osaka instead of Tokyo.'
        ],
        correctIndex: 2,
        explanation: 'Thông báo nói rõ: "The departure gate has been changed from gate 12 to gate 28B due to maintenance."',
        pedagogicalTip: 'Khi ở sân bay, luôn lắng nghe các từ khóa: "Flight number", "Gate change", "Boarding time".'
      },
      {
        id: 'q7-4',
        section: 'pragmatics',
        sectionName: 'Khách Sạn & Đặt Phòng',
        question: 'Khi đến khách sạn sớm hơn giờ quy định (ví dụ 11:00 trưa thay vì 14:00), cách hỏi gửi hành lý nào lịch sự nhất?',
        options: [
          'Take my bags now!',
          'Could we leave our luggage at the front desk until check-in time?',
          'Why is my room not ready yet?',
          'Give me the key right this second.'
        ],
        correctIndex: 1,
        explanation: '"Could we leave our luggage at the front desk until check-in time?" là câu hỏi tiêu chuẩn, lịch thiệp và được các khách sạn quốc tế phục vụ chu đáo.',
        pedagogicalTip: 'Dùng cấu trúc "Could we leave / store our luggage...?" để thể hiện sự nhã nhặn.'
      },
      {
        id: 'q7-5',
        section: 'pragmatics',
        sectionName: 'Xử Lý Sự Cố Khách Sạn',
        question: 'Vòi sen trong phòng tắm khách sạn bị hỏng nước nóng, bạn gọi điện xuống Lễ tân (Front Desk) như thế nào?',
        options: [
          'Your hotel is the worst in the world!',
          'Hello, this is room 402. It seems there is no hot water coming from the shower. Could someone please take a look?',
          'Hey you, fix the water right now.',
          'I don\'t like taking showers anyway.'
        ],
        correctIndex: 1,
        explanation: 'Nêu rõ số phòng trước: "Hello, this is room 402...", sau đó miêu tả sự cố một cách khách quan: "It seems there is no hot water..." và đề nghị kiểm tra.',
        pedagogicalTip: 'Cấu trúc mềm mỏng: "It seems there is an issue with [X]. Could someone take a look?"'
      },
      {
        id: 'q7-6',
        section: 'vocabulary',
        sectionName: 'Ẩm Thực & Nhà Hàng',
        question: 'Khi ăn xong tại nhà hàng ở nước ngoài và muốn xin hóa đơn thanh toán, bạn nói gì với người phục vụ?',
        options: [
          'Money please!',
          'Could we get the bill / check, please?',
          'I am going home now.',
          'Show me how rich I am.'
        ],
        correctIndex: 1,
        explanation: 'Trong tiếng Anh Anh người ta dùng "the bill", tiếng Anh Mỹ dùng "the check". Cả hai đều đi kèm "Could we get the bill/check, please?".',
        pedagogicalTip: 'Bạn cũng có thể nói: "We are ready for the check, thank you."'
      },
      {
        id: 'q7-7',
        section: 'pragmatics',
        sectionName: 'Hỏi Đường Trong Thành Phố',
        question: 'Bạn bị lạc đường ở trung tâm London và muốn tìm ga tàu điện ngầm gần nhất. Cách tiếp cận người qua đường nào chuẩn mực nhất?',
        options: [
          'Where is train?',
          'Excuse me, could you tell me the way to the nearest tube station?',
          'Hey you! Show me train.',
          'I need train now!'
        ],
        correctIndex: 1,
        explanation: 'Luôn mở đầu bằng "Excuse me", sau đó dùng câu hỏi gián tiếp "Could you tell me the way to...". Ở London, tàu điện ngầm thường gọi là "tube" hoặc "underground".',
        pedagogicalTip: 'Luôn nhớ "Excuse me" trước khi nhờ vả người lạ ở nước ngoài.'
      },
      {
        id: 'q7-8',
        section: 'pragmatics',
        sectionName: 'Mua Sắm & Thuế',
        question: 'Khi mua sắm ở sân bay hoặc trung tâm thương mại nước ngoài, cụm từ "Tax Refund / Duty-Free" có nghĩa là gì?',
        options: [
          'Phải đóng thêm 50% tiền thuế.',
          'Được hoàn lại tiền thuế giá trị gia tăng dành cho khách du lịch quốc tế.',
          'Hàng hóa bị lỗi không được bảo hành.',
          'Không được phép mang ra khỏi cửa hàng.'
        ],
        correctIndex: 1,
        explanation: '"Tax Refund" (hoàn thuế) cho phép khách du lịch nhận lại tiền thuế VAT khi mang hàng hóa ra khỏi quốc gia đó.',
        pedagogicalTip: 'Mẫu câu: "Could I have a tax refund form for this purchase, please?"'
      },
      {
        id: 'q7-9',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Chuyển Ngữ',
        question: 'Câu nào diễn đạt việc bạn bị dị ứng với một loại thức ăn (ví dụ đậu phộng) chính xác nhất?',
        options: [
          'I am allergic to peanuts.',
          'I have allergy with peanuts.',
          'I allergy peanuts.',
          'Peanuts make me allergy.'
        ],
        correctIndex: 0,
        explanation: 'Cấu trúc đúng trong tiếng Anh là "be allergic to [something]". Người Việt hay dịch nhầm từ "dị ứng với" thành "allergic with".',
        pedagogicalTip: 'Khi đi ăn nhà hàng quốc tế, luôn nhớ: "I am allergic to [seafood / gluten / peanuts]."'
      },
      {
        id: 'q7-10',
        section: 'listening',
        sectionName: 'Hành Lý Thất Lạc',
        speakerRole: 'Baggage Claim Agent',
        audioScript: 'Please fill out this Property Irregularity Report. Once your missing luggage is located, our courier will deliver it directly to your hotel address within twenty-four hours free of charge.',
        question: 'How will the passenger receive their missing luggage once it is found?',
        options: [
          'They must buy a new plane ticket to retrieve it.',
          'A courier will deliver it to their hotel within 24 hours at no cost.',
          'They have to pay $500 shipping fee.',
          'The airline will discard the luggage permanently.'
        ],
        correctIndex: 1,
        explanation: 'Nhân viên thông báo rõ: "our courier will deliver it directly to your hotel address within twenty-four hours free of charge."',
        pedagogicalTip: 'Từ vựng quan trọng tại khu nhận hành lý: "Baggage Claim", "Lost & Found", "Courier delivery".'
      }
    ]
  },

  // =========================================================================
  // BỘ ĐỀ 8: NGOẠI GIAO CÔNG SỞ & GIẢI QUYẾT XUNG ĐỘT (B2 WORKPLACE DIPLOMACY)
  // =========================================================================
  {
    id: 'exam-workplace-conflict',
    title: 'Workplace Diplomacy, Conflict Resolution & Difficult Client Scenarios',
    vietnameseTitle: 'Đề Thi 8: Ngoại Giao Công Sở, Giải Quyết Xung Đột & Xử Lý Khách Hàng',
    category: 'workplace',
    categoryLabel: '🤝 Ngoại Giao & Xử Lý Khủng Hoảng',
    level: 'B1 - B2',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 160,
    coinReward: 200,
    badgeIcon: '🤝',
    summary: 'Trang bị kỹ năng giải quyết bất đồng quan điểm giữa đồng nghiệp, từ chối yêu cầu phi thực tế của sếp, và xử lý phàn nàn gay gắt từ khách hàng nước ngoài.',
    questions: [
      {
        id: 'q8-1',
        section: 'pragmatics',
        sectionName: 'Từ Chối Deadline Phi Thực Tế',
        question: 'Quản lý yêu cầu nhóm bạn hoàn thành một tính năng khổng lồ chỉ trong 2 ngày (vốn cần 2 tuần). Cách phản hồi chuyên nghiệp nhất là gì?',
        options: [
          'No way, that is impossible and you are crazy.',
          'Given the current complexity, delivering everything in two days would severely compromise code quality. Could we prioritize the core MVP first?',
          'Sure, we will do it easily (nhưng sau đó không làm gì cả).',
          'I quit right now.'
        ],
        correctIndex: 1,
        explanation: 'Không nói thẳng thừng "impossible", mà giải thích hệ quả (compromise code quality) và đưa ra giải pháp thay thế khả thi (prioritize the core MVP).',
        pedagogicalTip: 'Công thức phản hồi: [Thừa nhận mục tiêu] + [Chỉ ra rủi ro khách quan] + [Đề xuất giải pháp thay thế].'
      },
      {
        id: 'q8-2',
        section: 'pragmatics',
        sectionName: 'Giải Quyết Bất Đồng Kỹ Thuật',
        question: 'Trong buổi tranh luận kiến trúc phần mềm, đồng nghiệp khăng khăng chọn một giải pháp mà bạn thấy có rủi ro bảo mật lớn. Bạn nên mở lời thế nào?',
        options: [
          'Your solution is completely stupid.',
          'I understand your perspective on speed, but I have a concern regarding security vulnerabilities in that approach. Let\'s look at the data.',
          'Whatever you want, I don\'t care if it gets hacked.',
          'You know nothing about coding.'
        ],
        correctIndex: 1,
        explanation: 'Kỹ thuật "Acknowledge and Pivot": Thừa nhận điểm mạnh của đối phương trước ("I understand your perspective..."), sau đó nêu mối lo ngại dựa trên số liệu thực tế.',
        pedagogicalTip: 'Luôn tập trung vào vấn đề ("that approach"), không công kích cá nhân ("you are wrong").'
      },
      {
        id: 'q8-3',
        section: 'pragmatics',
        sectionName: 'Xử Lý Phàn Nàn Của Khách Hàng',
        question: 'Khách hàng gửi email giận dữ vì hệ thống bị downtime 30 phút. Câu mở đầu email phản hồi nào thể hiện sự đồng cảm và trách nhiệm cao nhất?',
        options: [
          'It is not our fault, AWS was down.',
          'We sincerely apologize for the disruption caused to your operations today. Our engineering team resolved the root cause immediately.',
          'Why are you so angry over thirty minutes?',
          'Please do not email us again.'
        ],
        correctIndex: 1,
        explanation: 'Quy tắc "Apologize & Reassure": Thành thật xin lỗi về sự gián đoạn gây ra, nhận trách nhiệm và thông báo đã khắc phục ngay lập tức.',
        pedagogicalTip: 'Cụm từ chuẩn: "We sincerely apologize for the inconvenience / disruption caused."'
      },
      {
        id: 'q8-4',
        section: 'vocabulary',
        sectionName: 'Thuật Ngữ Ngoại Giao',
        question: 'Trong đàm phán, cụm từ "reach a consensus" có nghĩa là gì?',
        options: [
          'Hủy bỏ toàn bộ hợp đồng vì mâu thuẫn.',
          'Đạt được sự đồng thuận, nhất trí chung giữa các bên.',
          'Yêu cầu một bên phải đầu hàng vô điều kiện.',
          'Tạm hoãn cuộc họp vô thời hạn.'
        ],
        correctIndex: 1,
        explanation: '"Consensus" nghĩa là sự đồng thuận hoặc nhất trí chung giữa tất cả các thành viên tham gia.',
        pedagogicalTip: 'Ví dụ: "After two hours of discussion, we finally reached a consensus on the product roadmap."'
      },
      {
        id: 'q8-5',
        section: 'listening',
        sectionName: 'Nghe Hiểu Họp Căng Thẳng',
        speakerRole: 'Product Director',
        audioScript: 'I recognize that team morale has been impacted by the recent scope changes. Let us take a step back, realign our deliverables, and make sure nobody is working overtime this weekend.',
        question: 'What action did the Product Director propose to address team morale?',
        options: [
          'Force everyone to work 24/7 over the weekend.',
          'Fire the underperforming engineers.',
          'Step back, realign deliverables, and prevent weekend overtime.',
          'Cancel the entire product indefinitely.'
        ],
        correctIndex: 2,
        explanation: 'Giám đốc đề xuất: "Let us take a step back, realign our deliverables, and make sure nobody is working overtime this weekend."',
        pedagogicalTip: 'Cụm từ "take a step back" mang nghĩa tạm dừng để đánh giá lại bức tranh toàn cảnh.'
      },
      {
        id: 'q8-6',
        section: 'pragmatics',
        sectionName: 'Cắt Lời Lịch Sự Trong Cuộc Họp',
        question: 'Một thành viên đang nói lan man dài dòng khiến cuộc họp bị lố giờ. Bạn là người điều phối (facilitator), bạn nên can thiệp ra sao?',
        options: [
          'Shut up, you talk too much!',
          'Sorry to jump in, Tom, but in the interest of time, could we table this discussion for offline sync and move to the next item?',
          'I am hanging up the call right now.',
          'Nobody wants to hear your opinion.'
        ],
        correctIndex: 1,
        explanation: '"Sorry to jump in... in the interest of time, could we table this..." là kỹ năng ngoại giao điều phối cuộc họp đẳng cấp quốc tế.',
        pedagogicalTip: '"Table a discussion" có nghĩa là tạm gác lại để bàn sau, nhường thời gian cho nội dung chính.'
      },
      {
        id: 'q8-7',
        section: 'error_correction',
        sectionName: 'Sửa Lỗi Giọng Điệu (Tone)',
        question: 'Câu nào sau đây yêu cầu đồng nghiệp gửi tài liệu với giọng điệu vừa dứt khoát vừa nhã nhặn?',
        options: [
          'Give me the report right now!',
          'Could you please send over the latest report by 3 PM today? That would help us stay on track.',
          'Why didn\'t you send the report yet?',
          'Send report.'
        ],
        correctIndex: 1,
        explanation: 'Thêm lý do khách quan ("That would help us stay on track") giúp lời nhắc nhở trở nên tích cực, mang tính hỗ trợ công việc chung thay vì ra lệnh.',
        pedagogicalTip: 'Công thức: "Could you please [Action] by [Time]? That will help [Outcome]."'
      },
      {
        id: 'q8-8',
        section: 'pragmatics',
        sectionName: 'Nhận Lỗi Chuyên Nghiệp',
        question: 'Bạn vô tình làm hỏng một cấu hình khiến môi trường staging bị sập. Cách báo cáo với đội nhóm thế nào là đúng tác phong Senior?',
        options: [
          'Someone broke the server, not me.',
          'Team, heads up: I made an error during the config update which brought staging down. I am currently rolling it back and expect it back up in 10 minutes.',
          'Stay silent and hope nobody notices.',
          'Blame the intern.'
        ],
        correctIndex: 1,
        explanation: 'Senior Engineer luôn nhận trách nhiệm nhanh chóng ("heads up: I made an error..."), nêu rõ hướng giải quyết ("rolling it back") và thời gian dự kiến phục hồi ("10 minutes").',
        pedagogicalTip: 'Minh bạch và chủ động giải quyết sự cố luôn được đồng nghiệp và sếp tôn trọng hơn là trốn tránh.'
      },
      {
        id: 'q8-9',
        section: 'vocabulary',
        sectionName: 'Thuật Ngữ Quản Trị',
        question: 'Cụm từ "manage expectations" trong môi trường công sở quốc tế có nghĩa là gì?',
        options: [
          'Hứa hẹn thật nhiều dù không làm được.',
          'Quản trị kỳ vọng: giao tiếp rõ ràng từ sớm về những gì có thể và không thể đạt được để tránh thất vọng.',
          'Bắt khách hàng phải nghe theo ý mình.',
          'Không bao giờ thông báo tiến độ cho sếp.'
        ],
        correctIndex: 1,
        explanation: '"Manage expectations" là kỹ năng giao tiếp thiết lập trước mục tiêu thực tế, tránh để sếp hoặc khách hàng kỳ vọng quá cao rồi thất vọng.',
        pedagogicalTip: 'Ví dụ: "We need to manage their expectations regarding the phase 1 release date."'
      },
      {
        id: 'q8-10',
        section: 'pragmatics',
        sectionName: 'Khen Ngợi & Động Viên',
        question: 'Dự án vừa cán đích thành công sau 3 tuần nỗ lực không ngừng. Là nhóm trưởng, lời cảm ơn nào tạo động lực mạnh mẽ nhất cho toàn đội?',
        options: [
          'You guys finally did what you were paid to do.',
          'Huge shout-out to everyone for the relentless dedication! We couldn\'t have hit this milestone without each and every one of you.',
          'Next project will be twice as hard, don\'t celebrate.',
          'I did all the heavy lifting myself.'
        ],
        correctIndex: 1,
        explanation: '"Huge shout-out to everyone... We couldn\'t have done this without each and every one of you" là lời khen ngợi truyền cảm hứng, xây dựng tinh thần đồng đội bền vững.',
        pedagogicalTip: 'Cụm từ "Huge shout-out to [Team/Person]" rất phổ biến trên Slack và các buổi All-hands meeting.'
      }
    ]
  },
  // =========================================================================
  // BỘ ĐỀ 9: BỘ ĐỀ THI THỬ TOEIC ETS STANDARD (TARGET 650 - 800+)
  // =========================================================================
  {
    id: 'exam-toeic-ets',
    title: 'TOEIC Official Format ETS Full Simulation',
    vietnameseTitle: 'Đề Thi 9: Thi Thử TOEIC Listening & Reading Chuẩn ETS',
    category: 'toeic',
    categoryLabel: '🎯 TOEIC ETS Quốc Tế',
    level: 'B1 - B2',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 160,
    coinReward: 200,
    badgeIcon: '🎯',
    summary: 'Đánh giá chính xác phản xạ 7 Part thi TOEIC theo chuẩn ETS: Mô tả tranh (Part 1), Hỏi đáp (Part 2), Đàm thoại (Part 3), Thông báo (Part 4) & Đọc hiểu (Part 5, 6, 7).',
    questions: [
      {
        id: 'q-toeic-1',
        section: 'listening',
        sectionName: 'Part 1: Photo Description',
        question: 'Xem tranh hình ảnh buổi họp văn phòng và nghe âm thanh mô tả:',
        audioScript: 'A woman is giving a presentation to her colleagues in a conference room while pointing at a whiteboard.',
        speakerRole: 'Speaker Part 1',
        options: [
          'She is repairing a projector in the office.',
          'She is giving a presentation to her colleagues in a conference room.',
          'She is leaving the building for lunch.',
          'She is typing an email on her laptop.'
        ],
        correctIndex: 1,
        explanation: 'Khách hàng/Giảng viên trình bày rõ: "She is giving a presentation to her colleagues in a conference room."',
        pedagogicalTip: 'Tập trung vào hành động chính (Verb-ing) và vị trí của người trong ảnh.'
      },
      {
        id: 'q-toeic-2',
        section: 'listening',
        sectionName: 'Part 2: Question - Response',
        question: 'Nghe câu hỏi và chọn câu trả lời tự nhiên nhất:',
        audioScript: 'When is the quarterly budget report due?',
        speakerRole: 'Colleague Part 2',
        options: [
          'Yes, I bought the ticket.',
          'By 5 PM this Friday.',
          'In the conference room on the 3rd floor.',
          'It costs around 500 dollars.'
        ],
        correctIndex: 1,
        explanation: 'Câu hỏi bắt đầu bằng "When" (Khi nào) -> Trả lời mốc thời gian "By 5 PM this Friday".',
        pedagogicalTip: 'Tránh chọn câu bắt đầu bằng "Yes/No" đối với câu hỏi WH-questions!'
      },
      {
        id: 'q-toeic-3',
        section: 'vocabulary',
        sectionName: 'Part 5: Incomplete Sentences',
        question: 'Choose the correct option: "All employees are required to _______ their ID badges before entering the building."',
        options: [
          'display',
          'displays',
          'displayed',
          'displaying'
        ],
        correctIndex: 0,
        explanation: 'Cấu trúc "be required to + V-bare" (Được yêu cầu làm gì). Động từ ở dạng nguyên thể "display".',
        pedagogicalTip: 'Sau "to" trong cấu trúc thụ động "be required to" dùng động từ nguyên thể.'
      },
      {
        id: 'q-toeic-4',
        section: 'grammar',
        sectionName: 'Part 6: Text Completion',
        question: 'Choose the best connecting phrase: "Sales have increased significantly this quarter. _______, we will expand our marketing team."',
        options: [
          'However',
          'Therefore',
          'Although',
          'In spite of'
        ],
        correctIndex: 1,
        explanation: '"Therefore" (Do đó) diễn tả mối quan hệ nguyên nhân - kết quả giữa hai câu độc lập.',
        pedagogicalTip: 'Phân biệt "Therefore" (trạng từ liên kết) và "Because" (liên từ phụ thuộc).'
      }
    ]
  },
  // =========================================================================
  // BỘ ĐỀ 10: BỘ ĐỀ THI THỬ VSTEP B1-B2-C1 CHUẨN BỘ GD&ĐT
  // =========================================================================
  {
    id: 'exam-vstep-bgd',
    title: 'VSTEP Standard 4-Skills Assessment Test',
    vietnameseTitle: 'Đề Thi 10: Thi Thử VSTEP B1 - B2 - C1 Chuẩn Bộ GD&ĐT',
    category: 'vstep',
    categoryLabel: '🇻🇳 VSTEP Chuẩn BGD',
    level: 'B1 - B2',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 160,
    coinReward: 200,
    badgeIcon: '🇻🇳',
    summary: 'Đánh giá năng lực VSTEP 4 kỹ năng theo khung 6 bậc Việt Nam. Kiểm tra từ vựng đời sống, viết thư Task 1, viết luận Task 2 & phản xạ Speaking.',
    questions: [
      {
        id: 'q-vstep-1',
        section: 'pragmatics',
        sectionName: 'VSTEP Writing Task 1 (Email)',
        question: 'Lời mở đầu nào chuẩn mực nhất cho một lá thư/email cá nhân trang trọng gửi người quản lý (Manager)?',
        options: [
          'Hey bro, how is it going?',
          'Dear Mr. Henderson, I am writing to inform you regarding...',
          'What is up boss?',
          'Yo Mr. Henderson, listen to this.'
        ],
        correctIndex: 1,
        explanation: '"Dear Mr. [Surname], I am writing to inform you..." là câu mở đầu trang trọng chuẩn mực cho VSTEP Task 1.',
        pedagogicalTip: 'Tránh dùng từ lóng "hey bro", "yo" trong bài thi viết VSTEP.'
      },
      {
        id: 'q-vstep-2',
        section: 'listening',
        sectionName: 'VSTEP Listening Part 1 (Announcements)',
        question: 'Nghe thông báo chuyến bay và cho biết hành khách cần làm gì:',
        audioScript: 'Attention passengers on flight VN123 to Hanoi: due to bad weather, gate 4 has been changed to gate 12. Please proceed to gate 12 immediately.',
        speakerRole: 'Airport Announcer',
        options: [
          'Go to gate 4',
          'Proceed to gate 12 immediately',
          'Cancel their tickets',
          'Wait at the luggage area'
        ],
        correctIndex: 1,
        explanation: 'Thông báo rõ: "gate 4 has been changed to gate 12. Please proceed to gate 12 immediately."',
        pedagogicalTip: 'Chú ý các thông tin thay đổi (change) thường xuất hiện trong bài nghe VSTEP Part 1.'
      }
    ]
  },
  // =========================================================================
  // BỘ ĐỀ 11: BỘ ĐỀ THI THỬ IELTS ACADEMIC & GENERAL
  // =========================================================================
  {
    id: 'exam-ielts-academic',
    title: 'IELTS Academic & General Practice Test',
    vietnameseTitle: 'Đề Thi 11: Thi Thử IELTS 4 Kỹ Năng (Band 5.5 - 7.5+)',
    category: 'ielts',
    categoryLabel: '🇬🇧 IELTS Academic',
    level: 'B2 - C1',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 180,
    coinReward: 220,
    badgeIcon: '🇬🇧',
    summary: 'Kiểm tra kỹ năng Paraphrasing, từ vựng Band 7.0+, phân tích biểu đồ Writing Task 1, viết luận Task 2 & kỹ năng Speaking Part 2 & 3.',
    questions: [
      {
        id: 'q-ielts-1',
        section: 'vocabulary',
        sectionName: 'IELTS Academic Vocabulary & Paraphrasing',
        question: 'Từ nào đồng nghĩa chuẩn học thuật (Academic Paraphrase) với cụm "solve a problem"?',
        options: [
          'address an issue / mitigate a problem',
          'make a problem bigger',
          'ignore the situation',
          'look around the issue'
        ],
        correctIndex: 0,
        explanation: '"Address an issue" hoặc "mitigate a problem" là các cụm từ academic cực kỳ ăn điểm trong bài thi IELTS Writing & Speaking.',
        pedagogicalTip: 'Sử dụng các từ vựng C1/C2 như "address", "mitigate", "alleviate" để tăng điểm Lexical Resource.'
      },
      {
        id: 'q-ielts-2',
        section: 'pragmatics',
        sectionName: 'IELTS Writing Task 1 (Overview)',
        question: 'Trong bài viết mô tả biểu đồ Writing Task 1, câu Overview đóng vai trò gì quan trọng nhất?',
        options: [
          'Liệt kê từng con số cụ thể của tất cả các năm.',
          'Nêu ngắn gọn 1-2 xu hướng chính hoặc điểm nổi bật nhất của biểu đồ mà không cần nêu số liệu chi tiết.',
          'Đưa ra ý kiến cá nhân của bản thân.',
          'Viết kết bài kết luận về tương lai.'
        ],
        correctIndex: 1,
        explanation: 'Overview phải chỉ ra các main trends/key features lớn nhất mà KHÔNG liệt kê số liệu chi tiết. Không có Overview bài viết không thể đạt Band 6.0+.',
        pedagogicalTip: 'Bắt đầu Overview bằng "Overall, it is clear that..." hoặc "In general, it can be seen that..."'
      }
    ]
  },
  // =========================================================================
  // BỘ ĐỀ 12: BỘ ĐỀ THI THỬ TOEFL iBT ACADEMIC
  // =========================================================================
  {
    id: 'exam-toefl-ibt',
    title: 'TOEFL iBT Academic Simulation Test',
    vietnameseTitle: 'Đề Thi 12: Thi Thử TOEFL iBT Academic & Campus Discussion',
    category: 'toefl',
    categoryLabel: '🇺🇸 TOEFL iBT Mỹ',
    level: 'B2 - C1',
    durationMinutes: 20,
    passingScore: 70,
    expReward: 180,
    coinReward: 220,
    badgeIcon: '🇺🇸',
    summary: 'Đánh giá khả năng nghe bài giảng giáo sư (Academic Lecture), ghi chú tốc độ (Note-taking), thảo luận học thuật (Academic Discussion) chuẩn US Accent.',
    questions: [
      {
        id: 'q-toefl-1',
        section: 'listening',
        sectionName: 'TOEFL Academic Lecture Note-taking',
        question: 'Nghe đoạn trích bài giảng môn Sinh học và xác định luận điểm chính:',
        audioScript: 'Today we are discussing photosynthesis. Photosynthesis is the process used by plants to convert light energy into chemical energy.',
        speakerRole: 'Biology Professor',
        options: [
          'How animals migrate during winter',
          'How plants convert light energy into chemical energy through photosynthesis',
          'The structure of volcanic rocks',
          'The history of ocean navigation'
        ],
        correctIndex: 1,
        explanation: 'Giáo sư nêu định nghĩa rõ: "Photosynthesis is the process used by plants to convert light energy into chemical energy."',
        pedagogicalTip: 'Ghi chú các từ nối định nghĩa như "is defined as", "refers to", "is the process of".'
      }
    ]
  }
];

const fs = require('fs');
const path = require('path');

const practiceData = `export interface SpeakingPrompt {
  id: string;
  topic: string;
  category: 'IT' | 'Daily';
  targetSentence: string;
  phonetic: string;
  translation: string;
  tips: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
}

export interface WritingPrompt {
  id: string;
  situation: string;
  category: 'IT' | 'Daily';
  vietnamesePrompt: string;
  referenceAnswer: string;
  scrambledWords: string[];
  keyVocabHints: string[];
  explanation: string;
}

export interface ListeningExercise {
  id: string;
  title: string;
  audioScript: string;
  speakerRole: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  transcriptVi: string;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  situation: string;
  userRole: string;
  partnerRole: string;
  partnerAvatar: string;
  steps: {
    partnerMessage: string;
    partnerAudioText: string;
    suggestedResponses: {
      id: string;
      text: string;
      translation: string;
      isPoliteAndEffective: boolean;
      feedback: string;
    }[];
  }[];
}

// SPEAKING PROMPTS (30 total: 15 IT + 15 Daily)
export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  // IT Prompts
  {
    id: 'spk-it-1',
    topic: 'Daily Standup Update',
    category: 'IT',
    targetSentence: 'I am currently working on the payment gateway integration.',
    phonetic: '/aɪ æm ˈkɝː.ənt.li ˈwɝː.kɪŋ ɑːn ðə ˈpeɪ.mənt ˈɡeɪt.weɪ ˌɪn.təˈɡreɪ.ʃən/',
    translation: 'Tôi hiện đang làm việc với phần tích hợp cổng thanh toán.',
    tips: 'Chú ý nối âm: "working on" -> /ˈwɝː.kɪŋ.ɑːn/. Phát âm rõ đuôi -tion: /ʃən/.',
    difficulty: 'Easy',
  },
  {
    id: 'spk-it-2',
    topic: 'Reporting a Critical Blocker',
    category: 'IT',
    targetSentence: 'I hit a blocker because the staging API returns a 500 server error.',
    phonetic: '/aɪ hɪt ə ˈblɑː.kɚ bɪˈkɑːz ðə ˈsteɪ.dʒɪŋ ˌeɪ.piːˈaɪ rɪˈtɝːnz ə faɪv ˈhʌn.drəd ˈsɝː.vɚ ˈer.ɚ/',
    translation: 'Tôi gặp một vật cản vì API môi trường staging trả về lỗi máy chủ 500.',
    tips: 'Nhấn mạnh từ "blocker" và "server error" để thông báo tính nghiêm trọng.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-it-3',
    topic: 'Polite Code Review Request',
    category: 'IT',
    targetSentence: 'Could you please take a quick look at my pull request when you have time?',
    phonetic: '/kʊd juː pliːz teɪk ə kwɪk lʊk æt maɪ pʊl rɪˈkwest wen juː hæv taɪm/',
    translation: 'Bạn có thể ngó nhanh qua pull request của mình khi rảnh được không?',
    tips: 'Lên giọng nhẹ ở cuối câu để tạo ngữ điệu thân thiện, cầu thị.',
    difficulty: 'Easy',
  },
  {
    id: 'spk-it-4',
    topic: 'Expressing Disagreement Professionally',
    category: 'IT',
    targetSentence: 'I see your point, but from my perspective, this approach might create a performance bottleneck.',
    phonetic: '/aɪ siː jɔːr pɔɪnt bʌt frʌm maɪ pɚˈspek.tɪv ðɪs əˈproʊtʃ maɪt kriˈeɪt ə pɚˈfɔːr.məns ˈbɑː.t̬əl.nek/',
    translation: 'Tôi hiểu quan điểm của bạn, nhưng theo góc nhìn của tôi, hướng tiếp cận này có thể tạo ra điểm nghẽn hiệu năng.',
    tips: 'Kỹ thuật đệm "I see your point, but..." giúp phản biện không gây mất lòng đồng nghiệp.',
    difficulty: 'Challenging',
  },
  {
    id: 'spk-it-5',
    topic: 'Sprint Retrospective',
    category: 'IT',
    targetSentence: 'What went well this sprint was our communication, but we need to improve our test coverage.',
    phonetic: '/wʌt went wel ðɪs sprɪnt wʌz ˈaʊ.ɚ kəˌmjuː.nəˈkeɪ.ʃən, bʌt wiː niːd tuː ɪmˈpruːv ˈaʊ.ɚ test ˈkʌv.ɚ.ɪdʒ/',
    translation: 'Điều tốt trong sprint này là giao tiếp, nhưng chúng ta cần cải thiện độ phủ kiểm thử.',
    tips: 'Nhấn giọng ở "went well" và "improve" để làm nổi bật sự so sánh.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-it-6',
    topic: 'Client Demo',
    category: 'IT',
    targetSentence: 'Let me walk you through the new features we have implemented in this release.',
    phonetic: '/let miː wɔːk juː θruː ðə nuː ˈfiː.tʃɚz wiː hæv ˈɪm.plə.men.tɪd ɪn ðɪs rɪˈliːs/',
    translation: 'Hãy để tôi trình bày cho bạn các tính năng mới mà chúng tôi đã triển khai trong bản phát hành này.',
    tips: 'Cụm "walk you through" có nghĩa là hướng dẫn chi tiết, phát âm nhẹ chữ "through".',
    difficulty: 'Medium',
  },
  {
    id: 'spk-it-7',
    topic: 'Tech Support',
    category: 'IT',
    targetSentence: 'Have you tried clearing your browser cache and cookies before logging in again?',
    phonetic: '/hæv juː traɪd ˈklɪr.ɪŋ jɔːr ˈbraʊ.zɚ kæʃ ænd ˈkʊk.iz bɪˈfɔːr ˈlɑː.ɡɪŋ ɪn əˈɡen/',
    translation: 'Bạn đã thử xóa bộ nhớ đệm và cookie trình duyệt trước khi đăng nhập lại chưa?',
    tips: 'Lên giọng ở cuối câu hỏi Yes/No, chú ý phát âm "cache" /kæʃ/ giống "cash".',
    difficulty: 'Easy',
  },
  {
    id: 'spk-it-8',
    topic: 'Deployment Strategy',
    category: 'IT',
    targetSentence: 'We are planning a zero-downtime deployment during off-peak hours tonight.',
    phonetic: '/wiː ɑːr ˈplæn.ɪŋ ə ˈzɪr.oʊ ˈdaʊn.taɪm dɪˈplɔɪ.mənt ˈdʊr.ɪŋ ɑːf piːk ˈaʊ.ɚz təˈnaɪt/',
    translation: 'Chúng tôi đang lên kế hoạch triển khai không gián đoạn trong giờ thấp điểm tối nay.',
    tips: 'Nhấn vào "zero-downtime" vì đây là yếu tố quan trọng nhất của câu.',
    difficulty: 'Challenging',
  },
  {
    id: 'spk-it-9',
    topic: 'Pair Programming',
    category: 'IT',
    targetSentence: 'Could you drive for a bit while I navigate and review the logic?',
    phonetic: '/kʊd juː draɪv fɔːr ə bɪt waɪl aɪ ˈnæv.ə.ɡeɪt ænd rɪˈvjuː ðə ˈlɑː.dʒɪk/',
    translation: 'Bạn có thể gõ code một chút trong khi tôi chỉ đường và kiểm tra logic không?',
    tips: '"Drive" và "navigate" là thuật ngữ trong Pair Programming. Nối âm ở "for a" /fɔːr.ə/.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-it-10',
    topic: 'Bug Triage',
    category: 'IT',
    targetSentence: 'We should prioritize this bug because it affects core functionality for premium users.',
    phonetic: '/wiː ʃʊd praɪˈɔːr.ə.taɪz ðɪs bʌɡ bɪˈkɑːz ɪt əˈfekts kɔːr ˌfʌŋk.ʃəˈnæl.ə.t̬i fɔːr ˈpriː.mi.əm ˈjuː.zɚz/',
    translation: 'Chúng ta nên ưu tiên lỗi này vì nó ảnh hưởng đến tính năng cốt lõi của người dùng cao cấp.',
    tips: 'Phát âm chuẩn từ "prioritize" và "functionality" (trọng âm rơi vào chữ "nal").',
    difficulty: 'Challenging',
  },
  {
    id: 'spk-it-11',
    topic: 'Handling Client Technical Questions',
    category: 'IT',
    targetSentence: 'Our architecture leverages Redis caching to keep API response times under 100 milliseconds.',
    phonetic: '/aʊər ˈɑːr.kə.tek.tʃɚ ˈlev.ɚ.ɪdʒ.ɪz ˈred.ɪs ˈkæʃ.ɪŋ tuː kiːp ˌeɪ.piːˈaɪ rɪˈspɑːns taɪmz ˈʌn.dɚ wʌn ˈhʌn.drəd ˈmɪl.əˌsek.əndz/',
    translation: 'Kiến trúc của chúng tôi tận dụng bộ nhớ đệm Redis để giữ thời gian phản hồi của API dưới 100 mili-giây.',
    tips: 'Trọng âm từ "leverages" /ˈlev.ɚ.ɪdʒ/ nghĩa là tận dụng đòn bẩy công nghệ.',
    difficulty: 'Challenging',
  },
  {
    id: 'spk-it-12',
    topic: 'Explaining Technical Debt to Manager',
    category: 'IT',
    targetSentence: 'If we do not refactor this legacy code now, future feature delivery will slow down significantly.',
    phonetic: '/ɪf wiː duː nɑːt ˌriːˈfæk.tɚ ðɪs ˈleɡ.ə.si koʊd naʊ ˈfjuː.tʃɚ ˈfiː.tʃɚ dɪˈlɪv.ɚ.i wɪl sloʊ daʊn sɪɡˈnɪf.ə.kənt.li/',
    translation: 'Nếu chúng ta không tái cấu trúc mã nguồn cũ này ngay bây giờ, tốc độ bàn giao tính năng sau này sẽ bị chậm lại đáng kể.',
    tips: 'Nối âm "slow down", nhấn mạnh "significantly" để thể hiện mức độ tác động.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-it-13',
    topic: 'Weekly Progress Report to PM',
    category: 'IT',
    targetSentence: 'All backend milestones are on track, and we anticipate finishing user acceptance testing by Friday.',
    phonetic: '/ɔːl ˈbæk.end ˈmaɪl.stoʊnz ɑːr ɑːn træk, ænd wiː ænˈtɪs.ə.peɪt ˈfɪn.ɪ.ʃɪŋ ˈjuː.zɚ əkˈsep.təns ˈtes.tɪŋ baɪ ˈfraɪ.deɪ/',
    translation: 'Tất cả các mốc tiến độ backend đều đúng kế hoạch, và chúng tôi dự kiến hoàn tất kiểm thử chấp nhận người dùng trước thứ Sáu.',
    tips: 'Cụm "on track" đọc liền, trọng âm rơi vào "anticipate" /ænˈtɪs.ə.peɪt/ và "acceptance" /əkˈsep.təns/.',
    difficulty: 'Challenging',
  },
  {
    id: 'spk-it-14',
    topic: 'Requesting API Documentation Update',
    category: 'IT',
    targetSentence: 'Could your team please update the Swagger docs so we can verify the payload structure?',
    phonetic: '/kʊd jɔːr tiːm pliːz ʌpˈdeɪt ðə ˈswæɡ.ɚ dɑːks soʊ wiː kæn ˈver.ə.faɪ ðə ˈpeɪ.loʊd ˈstrʌk.tʃɚ/',
    translation: 'Nhóm bạn có thể cập nhật tài liệu Swagger để chúng tôi xác thực cấu trúc dữ liệu gửi lên được không?',
    tips: 'Phát âm "Swagger" /ˈswæɡ.ɚ/, chú ý âm đuôi /ks/ trong "docs" /dɑːks/.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-it-15',
    topic: 'Proposing Modern CI/CD Pipeline',
    category: 'IT',
    targetSentence: 'Automating our continuous integration pipeline will significantly reduce manual regression errors before production deployment.',
    phonetic: '/ˈɑː.t̬ə.meɪ.t̬ɪŋ ˈaʊ.ɚ kənˈtɪn.ju.əs ˌɪn.təˈɡreɪ.ʃən ˈpaɪp.laɪn wɪl sɪɡˈnɪf.ə.kənt.li rɪˈduːs ˈmæn.ju.əl rɪˈɡreʃ.ən ˈer.ɚz bɪˈfɔːr prəˈdʌk.ʃən dɪˈplɔɪ.mənt/',
    translation: 'Tự động hóa luồng tích hợp liên tục sẽ giúp giảm thiểu đáng kể các lỗi hồi quy thủ công trước khi triển khai lên môi trường thực tế.',
    tips: 'Nhấn trọng âm vào "continuous integration" và ngắt nhịp sau "pipeline".',
    difficulty: 'Challenging',
  },

  // Daily Prompts
  {
    id: 'spk-dl-1',
    topic: 'Ordering at a Cafe',
    category: 'Daily',
    targetSentence: 'Could I get an iced latte with oat milk to go, please?',
    phonetic: '/kʊd aɪ ɡet ən aɪst ˈlɑː.teɪ wɪð oʊt mɪlk tuː ɡoʊ pliːz/',
    translation: 'Cho tôi một ly latte đá với sữa yến mạch mang đi nhé?',
    tips: 'Nói liền cụm "Could I get..." và "to go, please".',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-2',
    topic: 'Asking for Directions',
    category: 'Daily',
    targetSentence: 'Excuse me, could you tell me how to get to the nearest subway station?',
    phonetic: '/ɪkˈskjuːz miː, kʊd juː tel miː haʊ tuː ɡet tuː ðə ˈnɪr.ɪst ˈsʌb.weɪ ˈsteɪ.ʃən/',
    translation: 'Xin lỗi, bạn có thể chỉ cho tôi đường đến ga tàu điện ngầm gần nhất không?',
    tips: 'Lên giọng ở cuối câu, nối âm "get to".',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-3',
    topic: 'Airport Check-in',
    category: 'Daily',
    targetSentence: 'I have one bag to check and one carry-on for the flight to Tokyo.',
    phonetic: '/aɪ hæv wʌn bæɡ tuː tʃek ænd wʌn ˈkær.i.ɑːn fɔːr ðə flaɪt tuː ˈtoʊ.ki.oʊ/',
    translation: 'Tôi có một kiện hành lý ký gửi và một hành lý xách tay cho chuyến bay đến Tokyo.',
    tips: 'Nhấn giọng ở số lượng "one bag" và "one carry-on".',
    difficulty: 'Medium',
  },
  {
    id: 'spk-dl-4',
    topic: 'Doctor Visit',
    category: 'Daily',
    targetSentence: 'I have been having a severe headache and a mild fever since yesterday morning.',
    phonetic: '/aɪ hæv bɪn ˈhæv.ɪŋ ə səˈvɪr ˈhed.eɪk ænd ə maɪld ˈfiː.vɚ sɪns ˈjes.tɚ.deɪ ˈmɔːr.nɪŋ/',
    translation: 'Tôi bị đau đầu dữ dội và sốt nhẹ từ sáng hôm qua.',
    tips: 'Chú ý phát âm đuôi của từ "headache" /eɪk/.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-dl-5',
    topic: 'Introducing Yourself',
    category: 'Daily',
    targetSentence: 'Hi, I am Nam. I am a software engineer and I enjoy playing guitar in my free time.',
    phonetic: '/haɪ, aɪ æm nɑːm. aɪ æm ə ˈsɑːft.wer ˌen.dʒɪˈnɪr ænd aɪ ɪnˈdʒɔɪ ˈpleɪ.ɪŋ ɡɪˈtɑːr ɪn maɪ friː taɪm/',
    translation: 'Chào, tôi là Nam. Tôi là một kỹ sư phần mềm và tôi thích chơi guitar vào thời gian rảnh.',
    tips: 'Ngắt nghỉ sau "engineer" trước khi nói tiếp sở thích.',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-6',
    topic: 'Phone Calls',
    category: 'Daily',
    targetSentence: 'Hello, this is Lan speaking. May I know who is calling, please?',
    phonetic: '/heˈloʊ, ðɪs ɪz lɑːn ˈspiː.kɪŋ. meɪ aɪ noʊ huː ɪz ˈkɑː.lɪŋ pliːz/',
    translation: 'Xin chào, Lan đang nghe máy. Xin hỏi ai đang gọi vậy ạ?',
    tips: 'Dùng "this is [Name] speaking" lịch sự hơn "I am [Name]".',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-7',
    topic: 'Shopping',
    category: 'Daily',
    targetSentence: 'Do you have this shirt in a medium size and a different color?',
    phonetic: '/duː juː hæv ðɪs ʃɝːt ɪn ə ˈmiː.di.əm saɪz ænd ə ˈdɪf.ɚ.ənt ˈkʌl.ɚ/',
    translation: 'Bạn có áo này size M và màu khác không?',
    tips: 'Lên giọng cuối câu hỏi, nối âm "in a" /ɪn.ə/.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-dl-8',
    topic: 'Restaurant Reservation',
    category: 'Daily',
    targetSentence: 'I would like to book a table for four people tonight at 7 PM under the name Minh.',
    phonetic: '/aɪ wʊd laɪk tuː bʊk ə ˈteɪ.bəl fɔːr fɔːr ˈpiː.pəl təˈnaɪt æt ˈsev.ən piː em ˈʌn.dɚ ðə neɪm mɪn/',
    translation: 'Tôi muốn đặt một bàn cho 4 người tối nay lúc 7 giờ dưới tên Minh.',
    tips: 'Cấu trúc "under the name [Name]" dùng phổ biến khi đặt bàn/phòng.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-dl-9',
    topic: 'Complaining Politely',
    category: 'Daily',
    targetSentence: 'Excuse me, but my food is quite cold. Could you please heat it up for me?',
    phonetic: '/ɪkˈskjuːz miː, bʌt maɪ fuːd ɪz kwaɪt koʊld. kʊd juː pliːz hiːt ɪt ʌp fɔːr miː/',
    translation: 'Xin lỗi, nhưng thức ăn của tôi khá nguội. Bạn có thể hâm nóng lại giúp tôi được không?',
    tips: 'Dùng "Excuse me, but..." để làm mềm lời phàn nàn.',
    difficulty: 'Challenging',
  },
  {
    id: 'spk-dl-10',
    topic: 'Giving Compliments',
    category: 'Daily',
    targetSentence: 'You did an absolutely fantastic job on that presentation today.',
    phonetic: '/juː dɪd ən ˌæb.səˈluːt.li fænˈtæs.tɪk dʒɑːb ɑːn ðæt ˌprez.ənˈteɪ.ʃən təˈdeɪ/',
    translation: 'Bạn đã làm một công việc tuyệt vời trong buổi thuyết trình hôm nay.',
    tips: 'Nhấn mạnh "absolutely fantastic" để thể hiện sự khen ngợi chân thành.',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-11',
    topic: 'Booking a Flight Ticket',
    category: 'Daily',
    targetSentence: 'Could you please check if there are any direct morning flights available for next Monday?',
    phonetic: '/kʊd juː pliːz tʃek ɪf ðer ɑːr ˈen.i daɪˈrekt ˈmɔːr.nɪŋ flaɪts əˈveɪ.lə.bəl fɔːr nekst ˈmʌn.deɪ/',
    translation: 'Bạn có thể vui lòng kiểm tra xem có chuyến bay thẳng buổi sáng nào còn chỗ vào thứ Hai tới không?',
    tips: '"direct flights" là chuyến bay thẳng không quá cảnh. Chú ý ngữ điệu lên ở cuối câu hỏi Yes/No.',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-12',
    topic: 'Ordering Coffee with Customization',
    category: 'Daily',
    targetSentence: 'I would like an iced oat milk latte with two shots of espresso and no sugar, please.',
    phonetic: '/aɪ wʊd laɪk ən aɪst oʊt mɪlk ˈlɑː.teɪ wɪð tuː ʃɑːts əv eˈspres.oʊ ænd noʊ ˈʃʊɡ.ɚ pliːz/',
    translation: 'Cho tôi một ly latte sữa yến mạch đá với hai shot espresso và không đường nhé.',
    tips: 'Cách gọi món cà phê tùy biến cực chuẩn của người bản xứ. "I would like..." + chi tiết + "please".',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-13',
    topic: 'Returning an Item at a Store',
    category: 'Daily',
    targetSentence: 'I bought this jacket yesterday, but the size is slightly too small. May I exchange it?',
    phonetic: '/aɪ bɔːt ðɪs ˈdʒæk.ɪt ˈjes.tɚ.deɪ bʌt ðə saɪz ɪz ˈslaɪt.li tuː smɑːl meɪ aɪ ɪksˈtʃeɪndʒ ɪt/',
    translation: 'Tôi đã mua chiếc áo khoác này hôm qua, nhưng kích cỡ hơi nhỏ một chút. Tôi có thể đổi sang chiếc khác được không?',
    tips: '"exchange" nghĩa là đổi lấy đồ khác, phân biệt với "refund" là hoàn lại tiền.',
    difficulty: 'Medium',
  },
  {
    id: 'spk-dl-14',
    topic: 'Checking in at Hotel',
    category: 'Daily',
    targetSentence: 'Good afternoon, I have a reservation under the name of Nguyen for three nights.',
    phonetic: '/ɡʊd ˌæf.tɚˈnuːn aɪ hæv ə ˌrez.ɚˈveɪ.ʃən ˈʌn.dɚ ðə neɪm əv wɪn fɔːr θriː naɪts/',
    translation: 'Chào buổi chiều, tôi có đặt phòng trước dưới tên Nguyen cho ba đêm.',
    tips: 'Mẫu câu chuẩn: "reservation under the name of [Họ của bạn]".',
    difficulty: 'Easy',
  },
  {
    id: 'spk-dl-15',
    topic: 'Making an Urgent Doctor Appointment',
    category: 'Daily',
    targetSentence: 'I would like to schedule an urgent consultation with Dr. Smith as soon as possible.',
    phonetic: '/aɪ wʊd laɪk tuː ˈskedʒ.uːl ən ˈɝː.dʒənt ˌkɑːn.sʌlˈteɪ.ʃən wɪð ˈdɑːk.tɚ smɪθ æz suːn æz ˈpɑː.sə.bəl/',
    translation: 'Tôi muốn đặt một lịch khám khẩn cấp với bác sĩ Smith càng sớm càng tốt.',
    tips: 'Nối âm "schedule an" /ˈskedʒ.uːl.ən/, phát âm rõ âm /dʒ/ trong "urgent" /ˈɝː.dʒənt/.',
    difficulty: 'Medium',
  }
];

// WRITING PROMPTS (23 total: 12 IT + 11 Daily)
export const WRITING_PROMPTS: WritingPrompt[] = [
  // IT Prompts
  {
    id: 'wrt-it-1',
    situation: 'Bạn muốn nhắn Slack cho Tech Lead nhờ duyệt PR vì sắp tới hạn release.',
    category: 'IT',
    vietnamesePrompt: 'Anh có thể xem qua pull request này giúp em trước 5 giờ chiều được không ạ?',
    referenceAnswer: 'Could you please check this pull request before 5 PM?',
    scrambledWords: ['Could', 'you', 'please', 'check', 'this', 'pull', 'request', 'before', '5 PM?'],
    keyVocabHints: ['Could you please', 'pull request', 'before 5 PM'],
    explanation: 'Dùng "Could you please + V" để thể hiện sự nhờ vả lịch sự kèm mốc thời gian rõ ràng.',
  },
  {
    id: 'wrt-it-2',
    situation: 'Báo cáo sự cố server cho cả team trong kênh #incidents.',
    category: 'IT',
    vietnamesePrompt: 'Chúng tôi vừa tìm ra nguyên nhân gốc rễ và đang triển khai bản vá lỗi.',
    referenceAnswer: 'We have found the root cause and are deploying a hotfix.',
    scrambledWords: ['We', 'have', 'found', 'the', 'root', 'cause', 'and', 'are', 'deploying', 'a', 'hotfix.'],
    keyVocabHints: ['root cause', 'hotfix', 'deploying'],
    explanation: '"root cause" (nguyên nhân gốc rễ) và "hotfix" (bản sửa lỗi nóng tức thì) là hai thuật ngữ chuẩn mực.',
  },
  {
    id: 'wrt-it-3',
    situation: 'Email xin phép quản lý nghỉ phép vì lý do cá nhân.',
    category: 'IT',
    vietnamesePrompt: 'Tôi viết email này để xin nghỉ phép hai ngày vào tuần tới vì lý do gia đình.',
    referenceAnswer: 'I am writing to request two days of annual leave next week for family reasons.',
    scrambledWords: ['I', 'am', 'writing', 'to', 'request', 'two', 'days', 'of', 'annual', 'leave', 'next', 'week', 'for', 'family', 'reasons.'],
    keyVocabHints: ['request', 'annual leave', 'family reasons'],
    explanation: 'Cấu trúc "I am writing to request..." rất chuyên nghiệp dùng trong email xin phép.',
  },
  {
    id: 'wrt-it-4',
    situation: 'Ghi chú cuộc họp (Meeting notes) tóm tắt quyết định.',
    category: 'IT',
    vietnamesePrompt: 'Nhóm đã quyết định chuyển sang sử dụng GraphQL thay vì REST cho API mới.',
    referenceAnswer: 'The team decided to switch to GraphQL instead of REST for the new API.',
    scrambledWords: ['The', 'team', 'decided', 'to', 'switch', 'to', 'GraphQL', 'instead', 'of', 'REST', 'for', 'the', 'new', 'API.'],
    keyVocabHints: ['decided to switch', 'instead of'],
    explanation: 'Sử dụng "decided to [verb]" cho các kết luận cuộc họp.',
  },
  {
    id: 'wrt-it-5',
    situation: 'Cập nhật trạng thái công việc trong buổi Daily Standup qua text.',
    category: 'IT',
    vietnamesePrompt: 'Hôm nay tôi sẽ tiếp tục sửa các lỗi giao diện được báo cáo vào hôm qua.',
    referenceAnswer: 'Today I will continue fixing the UI bugs reported yesterday.',
    scrambledWords: ['Today', 'I', 'will', 'continue', 'fixing', 'the', 'UI', 'bugs', 'reported', 'yesterday.'],
    keyVocabHints: ['continue fixing', 'reported yesterday'],
    explanation: '"continue + V-ing" dùng khi đang làm tiếp một việc còn dang dở.',
  },
  {
    id: 'wrt-it-6',
    situation: 'Báo cáo lỗi (Bug report) chi tiết trên Jira.',
    category: 'IT',
    vietnamesePrompt: 'Ứng dụng bị sập khi người dùng cố gắng tải lên một tệp lớn hơn 5MB.',
    referenceAnswer: 'The application crashes when the user attempts to upload a file larger than 5MB.',
    scrambledWords: ['The', 'application', 'crashes', 'when', 'the', 'user', 'attempts', 'to', 'upload', 'a', 'file', 'larger', 'than', '5MB.'],
    keyVocabHints: ['crashes', 'attempts to', 'larger than'],
    explanation: 'Mô tả bug cần dùng hiện tại đơn và đi thẳng vào vấn đề.',
  },
  {
    id: 'wrt-it-7',
    situation: 'Nhắn tin qua Slack xin phép đồng nghiệp ghép cặp lập trình (Pair programming) để giải quyết bug hóc búa.',
    category: 'IT',
    vietnamesePrompt: 'Bạn có rảnh 15 phút để pair-program với mình về lỗi race condition này không?',
    referenceAnswer: 'Are you free for 15 minutes to pair-program on this race condition bug?',
    scrambledWords: ['Are', 'you', 'free', 'for', '15', 'minutes', 'to', 'pair-program', 'on', 'this', 'race', 'condition', 'bug?'],
    keyVocabHints: ['Are you free', 'pair-program', 'race condition'],
    explanation: '"pair-program on [something]" là cấu trúc phổ biến khi rủ đồng nghiệp cùng xem code.',
  },
  {
    id: 'wrt-it-8',
    situation: 'Gửi email cho khách hàng thông báo hệ thống bảo trì định kỳ vào cuối tuần.',
    category: 'IT',
    vietnamesePrompt: 'Hệ thống sẽ tạm ngừng hoạt động để bảo trì định kỳ vào Chủ Nhật tuần này từ 2 giờ đến 4 giờ sáng.',
    referenceAnswer: 'The system will be down for scheduled maintenance this Sunday from 2 AM to 4 AM.',
    scrambledWords: ['The', 'system', 'will', 'be', 'down', 'for', 'scheduled', 'maintenance', 'this', 'Sunday', 'from', '2 AM', 'to', '4 AM.'],
    keyVocabHints: ['scheduled maintenance', 'will be down', 'from... to...'],
    explanation: '"scheduled maintenance" là cụm từ chuyên nghiệp chỉ việc bảo trì định kỳ đã có kế hoạch trước.',
  },
  {
    id: 'wrt-it-9',
    situation: 'Gửi email cho ban quản lý thông báo đã khắc phục xong sự cố gián đoạn dịch vụ (Post-Mortem Incident Report).',
    category: 'IT',
    vietnamesePrompt: 'Chúng tôi đã khôi phục hoàn toàn cơ sở dữ liệu và đang triển khai bản vá bảo mật để ngăn ngừa sự cố tái diễn.',
    referenceAnswer: 'We have fully restored the database and are deploying a security patch to prevent recurrence.',
    scrambledWords: ['We', 'have', 'fully', 'restored', 'the', 'database', 'and', 'are', 'deploying', 'a', 'security', 'patch', 'to', 'prevent', 'recurrence.'],
    keyVocabHints: ['fully restored', 'deploying a security patch', 'prevent recurrence'],
    explanation: '"prevent recurrence" là thuật ngữ kỹ thuật tiêu chuẩn trong báo cáo sự cố (post-mortem).',
  },
  {
    id: 'wrt-it-10',
    situation: 'Đề xuất cải tiến hạ tầng Cloud lên kiến trúc Microservices trong cuộc họp kỹ thuật.',
    category: 'IT',
    vietnamesePrompt: 'Tách ứng dụng monolithic thành microservices sẽ giúp cải thiện tốc độ triển khai và khả năng chịu tải.',
    referenceAnswer: 'Splitting the monolithic application into microservices will improve deployment speed and scalability.',
    scrambledWords: ['Splitting', 'the', 'monolithic', 'application', 'into', 'microservices', 'will', 'improve', 'deployment', 'speed', 'and', 'scalability.'],
    keyVocabHints: ['monolithic application', 'microservices', 'scalability'],
    explanation: '"scalability" (khả năng mở rộng/chịu tải) là từ vựng chuyên ngành IT rất hay xuất hiện trong các buổi tech talk.',
  },
  {
    id: 'wrt-it-11',
    situation: 'Viết mô tả Pull Request (PR Description) tóm tắt các cải tiến mã nguồn và bổ sung kiểm thử tự động.',
    category: 'IT',
    vietnamesePrompt: 'Pull request này sửa lỗi rò rỉ bộ nhớ và bổ sung các bài kiểm thử đơn vị tương ứng.',
    referenceAnswer: 'This pull request fixes the memory leak issue and adds corresponding unit tests.',
    scrambledWords: ['This', 'pull', 'request', 'fixes', 'the', 'memory', 'leak', 'issue', 'and', 'adds', 'corresponding', 'unit', 'tests.'],
    keyVocabHints: ['pull request fixes', 'memory leak', 'corresponding unit tests'],
    explanation: '"memory leak" (rò rỉ bộ nhớ) và "corresponding unit tests" (kiểm thử đơn vị tương ứng) là các thuật ngữ chuẩn mực khi mô tả PR.',
  },
  {
    id: 'wrt-it-12',
    situation: 'Viết email tóm tắt tiến độ tuần cho Quản lý Sản phẩm (PM) trước đợt phát hành phiên bản mới.',
    category: 'IT',
    vietnamesePrompt: 'Chúng tôi đang đi đúng tiến độ để hoàn thành các tính năng cốt lõi trước thứ Sáu tuần này.',
    referenceAnswer: 'We are on track to complete all core features before this Friday.',
    scrambledWords: ['We', 'are', 'on', 'track', 'to', 'complete', 'all', 'core', 'features', 'before', 'this', 'Friday.'],
    keyVocabHints: ['on track to', 'core features', 'before this Friday'],
    explanation: '"on track to [verb]" là cụm từ vàng trong quản lý dự án để khẳng định tiến độ đang diễn ra đúng kế hoạch.',
  },

  // Daily Prompts
  {
    id: 'wrt-dl-1',
    situation: 'Bạn muốn hẹn đồng nghiệp đi uống cà phê để bàn thêm về thiết kế.',
    category: 'Daily',
    vietnamesePrompt: 'Chúng ta hãy gặp gỡ uống cà phê và thảo luận về thiết kế mới nhé.',
    referenceAnswer: 'Let us catch up over coffee and discuss the new design.',
    scrambledWords: ['Let', 'us', 'catch', 'up', 'over', 'coffee', 'and', 'discuss', 'the', 'new', 'design.'],
    keyVocabHints: ['catch up over coffee', 'discuss'],
    explanation: 'Cụm từ "catch up over coffee" rất tự nhiên, bản xứ thường dùng thay vì "meet each other".',
  },
  {
    id: 'wrt-dl-2',
    situation: 'Viết email cảm ơn sau buổi phỏng vấn.',
    category: 'Daily',
    vietnamesePrompt: 'Cảm ơn bạn đã dành thời gian phỏng vấn tôi vào sáng nay.',
    referenceAnswer: 'Thank you for taking the time to interview me this morning.',
    scrambledWords: ['Thank', 'you', 'for', 'taking', 'the', 'time', 'to', 'interview', 'me', 'this', 'morning.'],
    keyVocabHints: ['taking the time', 'interview'],
    explanation: '"Taking the time to [verb]" là cụm từ lịch sự thường gặp trong email cảm ơn.',
  },
  {
    id: 'wrt-dl-3',
    situation: 'Viết thư phàn nàn về dịch vụ giao hàng.',
    category: 'Daily',
    vietnamesePrompt: 'Tôi viết thư này để bày tỏ sự không hài lòng với dịch vụ giao hàng chậm trễ.',
    referenceAnswer: 'I am writing to express my dissatisfaction with the delayed delivery service.',
    scrambledWords: ['I', 'am', 'writing', 'to', 'express', 'my', 'dissatisfaction', 'with', 'the', 'delayed', 'delivery', 'service.'],
    keyVocabHints: ['express my dissatisfaction', 'delayed'],
    explanation: '"express my dissatisfaction" là cách nói lịch sự, chuyên nghiệp thay vì nói "I hate" hay "I am angry".',
  },
  {
    id: 'wrt-dl-4',
    situation: 'Nhắn tin xin lỗi bạn vì đến muộn.',
    category: 'Daily',
    vietnamesePrompt: 'Mình xin lỗi nhé, mình đang bị kẹt xe và sẽ đến trễ 10 phút.',
    referenceAnswer: 'I am so sorry, I am stuck in traffic and will be 10 minutes late.',
    scrambledWords: ['I', 'am', 'so', 'sorry,', 'I', 'am', 'stuck', 'in', 'traffic', 'and', 'will', 'be', '10', 'minutes', 'late.'],
    keyVocabHints: ['stuck in traffic', 'minutes late'],
    explanation: '"stuck in traffic" là cụm từ thông dụng nhất để mô tả việc bị kẹt xe.',
  },
  {
    id: 'wrt-dl-5',
    situation: 'Đánh giá nhà hàng trên Google Maps.',
    category: 'Daily',
    vietnamesePrompt: 'Thức ăn tuyệt vời nhưng không gian hơi ồn ào vào cuối tuần.',
    referenceAnswer: 'The food was excellent but the atmosphere was a bit noisy on the weekend.',
    scrambledWords: ['The', 'food', 'was', 'excellent', 'but', 'the', 'atmosphere', 'was', 'a', 'bit', 'noisy', 'on', 'the', 'weekend.'],
    keyVocabHints: ['atmosphere', 'a bit noisy'],
    explanation: '"atmosphere" thường được dùng để chỉ không gian/bầu không khí của một địa điểm.',
  },
  {
    id: 'wrt-dl-6',
    situation: 'Viết bài đăng mạng xã hội về chuyến đi du lịch.',
    category: 'Daily',
    vietnamesePrompt: 'Tôi đã có một thời gian tuyệt vời khi khám phá những bãi biển tuyệt đẹp ở Đà Nẵng.',
    referenceAnswer: 'I had an amazing time exploring the beautiful beaches in Da Nang.',
    scrambledWords: ['I', 'had', 'an', 'amazing', 'time', 'exploring', 'the', 'beautiful', 'beaches', 'in', 'Da', 'Nang.'],
    keyVocabHints: ['amazing time', 'exploring'],
    explanation: '"had an amazing time [V-ing]" diễn tả việc trải qua khoảng thời gian tuyệt vời khi làm gì đó.',
  },
  {
    id: 'wrt-dl-7',
    situation: 'Viết tin nhắn cho chủ nhà Airbnb hỏi mật khẩu Wi-Fi và vị trí vứt rác.',
    category: 'Daily',
    vietnamesePrompt: 'Bạn có thể chia sẻ mật khẩu Wi-Fi và nơi chúng tôi có thể vứt rác được không?',
    referenceAnswer: 'Could you please share the Wi-Fi password and where we can dispose of the garbage?',
    scrambledWords: ['Could', 'you', 'please', 'share', 'the', 'Wi-Fi', 'password', 'and', 'where', 'we', 'can', 'dispose', 'of', 'the', 'garbage?'],
    keyVocabHints: ['Could you please', 'dispose of', 'garbage'],
    explanation: '"dispose of garbage" là cách diễn đạt lịch sự và chính xác cho việc vứt rác thải sinh hoạt.',
  },
  {
    id: 'wrt-dl-8',
    situation: 'Gửi email cảm ơn phỏng vấn (Thank-you email) sau buổi trao đổi với Tech Lead.',
    category: 'Daily',
    vietnamesePrompt: 'Cảm ơn anh rất nhiều vì đã dành thời gian trao đổi với em về văn hóa kỹ thuật của nhóm hôm nay.',
    referenceAnswer: 'Thank you very much for taking the time to speak with me about the team technical culture today.',
    scrambledWords: ['Thank', 'you', 'very', 'much', 'for', 'taking', 'the', 'time', 'to', 'speak', 'with', 'me', 'about', 'the', 'team', 'technical', 'culture', 'today.'],
    keyVocabHints: ['taking the time', 'speak with me', 'technical culture'],
    explanation: '"Thank you for taking the time to [do something]" là mở đầu chuẩn mực của email cảm ơn.',
  },
  {
    id: 'wrt-dl-9',
    situation: 'Viết email lịch sự xin gia hạn nộp báo cáo cho sếp do khối lượng công việc quá tải.',
    category: 'Daily',
    vietnamesePrompt: 'Tôi xin phép được gia hạn thời hạn nộp báo cáo tài chính đến 5 giờ chiều thứ Sáu tuần này.',
    referenceAnswer: 'I would like to request an extension for the financial report deadline to 5 PM this Friday.',
    scrambledWords: ['I', 'would', 'like', 'to', 'request', 'an', 'extension', 'for', 'the', 'financial', 'report', 'deadline', 'to', '5 PM', 'this', 'Friday.'],
    keyVocabHints: ['request an extension', 'deadline to'],
    explanation: '"request an extension" là cấu trúc trang trọng chuẩn công sở khi cần gia hạn deadline.',
  },
  {
    id: 'wrt-dl-10',
    situation: 'Viết email trang trọng cảm ơn đối tác nước ngoài sau buổi ký kết biên bản ghi nhớ hợp tác chiến lược.',
    category: 'Daily',
    vietnamesePrompt: 'Chúng tôi rất mong muốn được xây dựng mối quan hệ hợp tác lâu dài và thành công với quý công ty.',
    referenceAnswer: 'We look forward to building a long-term and successful partnership with your company.',
    scrambledWords: ['We', 'look', 'forward', 'to', 'building', 'a', 'long-term', 'and', 'successful', 'partnership', 'with', 'your', 'company.'],
    keyVocabHints: ['look forward to building', 'long-term partnership'],
    explanation: 'Sau "look forward to" luôn đi với danh động từ "V-ing". "partnership" mang sắc thái quan hệ hợp tác đối tác bền vững.',
  },
  {
    id: 'wrt-dl-11',
    situation: 'Viết đánh giá 5 sao cho khách sạn sau kỳ nghỉ dưỡng cùng gia đình tại bờ biển.',
    category: 'Daily',
    vietnamesePrompt: 'Đội ngũ nhân viên cực kỳ nhiệt tình và dịch vụ phòng vượt xa mong đợi của chúng tôi.',
    referenceAnswer: 'The staff members were extremely helpful and the room service exceeded our expectations.',
    scrambledWords: ['The', 'staff', 'members', 'were', 'extremely', 'helpful', 'and', 'the', 'room', 'service', 'exceeded', 'our', 'expectations.'],
    keyVocabHints: ['staff members', 'extremely helpful', 'exceeded our expectations'],
    explanation: '"exceeded our expectations" (vượt xa mong đợi của chúng tôi) là cụm từ rất hay dùng trong các bài review dịch vụ chuẩn quốc tế.',
  },
];

// LISTENING EXERCISES (18 total: 9 IT + 9 Daily)
export const LISTENING_EXERCISES: ListeningExercise[] = [
  // IT Scenarios
  {
    id: 'lis-it-1',
    title: 'Daily Standup Update on Mobile App',
    speakerRole: 'Frontend Developer (Sarah)',
    audioScript: 'Yesterday I finished implementing the push notification feature. Today I am going to write unit tests, and I currently have no blockers.',
    question: 'What is Sarah planning to do today?',
    options: [
      'Fix a critical blocker in the database',
      'Write unit tests for the push notification feature',
      'Deploy the application to production',
      'Conduct a design review meeting',
    ],
    correctIndex: 1,
    explanation: 'Sarah nói rõ: "Today I am going to write unit tests, and I currently have no blockers."',
    transcriptVi: 'Hôm qua tôi đã hoàn thành tính năng thông báo đẩy. Hôm nay tôi sẽ viết kiểm thử đơn vị, và hiện tại tôi không gặp trở ngại nào.',
  },
  {
    id: 'lis-it-2',
    title: 'Code Review Discussion on Caching',
    speakerRole: 'Backend Architect (David)',
    audioScript: 'I noticed we are making duplicate queries to the user table. If we implement Redis caching here, we can eliminate the performance bottleneck completely.',
    question: 'What solution did David suggest to resolve the performance bottleneck?',
    options: [
      'Delete the user table',
      'Implement Redis caching to stop duplicate queries',
      'Upgrade the server hardware',
      'Ask users to reload the page',
    ],
    correctIndex: 1,
    explanation: 'David đề xuất: "If we implement Redis caching here, we can eliminate the performance bottleneck completely."',
    transcriptVi: 'Tôi nhận thấy chúng ta đang thực hiện các truy vấn trùng lặp vào bảng người dùng. Nếu chúng ta triển khai bộ nhớ đệm Redis ở đây, chúng ta có thể loại bỏ hoàn toàn điểm nghẽn hiệu năng.',
  },
  {
    id: 'lis-it-3',
    title: 'Sprint Planning Priority',
    speakerRole: 'Product Owner (Mike)',
    audioScript: 'For this sprint, our main priority is to release the new dashboard. We can push the user profile updates to the backlog if we are short on time.',
    question: 'What is the main priority for the current sprint?',
    options: [
      'Update the user profiles',
      'Clear the entire backlog',
      'Release the new dashboard',
      'Hire more developers',
    ],
    correctIndex: 2,
    explanation: 'Mike nhấn mạnh: "For this sprint, our main priority is to release the new dashboard."',
    transcriptVi: 'Trong sprint này, ưu tiên chính của chúng ta là phát hành bảng điều khiển mới. Chúng ta có thể đẩy phần cập nhật hồ sơ người dùng vào backlog nếu thiếu thời gian.',
  },
  {
    id: 'lis-it-4',
    title: 'Tech Interview on Production Incidents',
    speakerRole: 'Interviewer (John)',
    audioScript: 'Can you tell me about a time when you had to deal with a production incident and how you communicated with stakeholders?',
    question: 'What does the interviewer want to know?',
    options: [
      'How the candidate writes unit tests',
      'The candidate\\'s experience with production incidents and stakeholder communication',
      'If the candidate can work on weekends',
      'The candidate\\'s favorite programming language',
    ],
    correctIndex: 1,
    explanation: 'Người phỏng vấn hỏi về "a time when you had to deal with a production incident and how you communicated with stakeholders".',
    transcriptVi: 'Bạn có thể kể cho tôi về một lần bạn phải xử lý sự cố trên production và cách bạn giao tiếp với các bên liên quan không?',
  },
  {
    id: 'lis-it-5',
    title: 'Incident Report on Load Balancer',
    speakerRole: 'DevOps Engineer (Lisa)',
    audioScript: 'The site was down for ten minutes because the load balancer failed. We have scaled up the resources to prevent this from happening again.',
    question: 'Why was the site down?',
    options: [
      'Because of a hacking attempt',
      'Due to a database migration',
      'Because the load balancer failed',
      'Because the domain expired',
    ],
    correctIndex: 2,
    explanation: 'Lisa nói rõ nguyên nhân: "The site was down for ten minutes because the load balancer failed."',
    transcriptVi: 'Trang web đã ngừng hoạt động trong mười phút vì bộ cân bằng tải bị lỗi. Chúng tôi đã mở rộng quy mô tài nguyên để ngăn điều này xảy ra lần nữa.',
  },
  {
    id: 'lis-it-6',
    title: 'Incident Post-Mortem Meeting on Payment Webhook',
    speakerRole: 'Site Reliability Engineer',
    audioScript: 'The root cause of yesterday\\'s checkout failure was an unhandled promise rejection in the third-party payment webhook. We have added a fallback queue to ensure transactions are never lost again.',
    question: 'How did the engineering team prevent checkout transactions from being lost in the future?',
    options: [
      'They stopped accepting online payments completely',
      'They added a fallback queue to handle payment webhooks safely',
      'They asked customers to pay with cash',
      'They blamed the database server'
    ],
    correctIndex: 1,
    explanation: 'Kỹ sư SRE khẳng định: "We have added a fallback queue to ensure transactions are never lost again."',
    transcriptVi: 'Nguyên nhân gốc rễ của sự cố thanh toán hôm qua là do lỗi promise không được xử lý trong webhook thanh toán của bên thứ ba. Chúng tôi đã bổ sung hàng đợi dự phòng để đảm bảo các giao dịch không bao giờ bị thất lạc nữa.',
  },
  {
    id: 'lis-it-7',
    title: 'Sprint Planning Capacity Discussion',
    speakerRole: 'Scrum Master',
    audioScript: 'Because two senior developers are on annual leave next week, our team capacity is reduced by thirty percent. Let us only pull high-priority user stories into Sprint 25.',
    question: 'Why did the Scrum Master suggest pulling fewer user stories into the upcoming sprint?',
    options: [
      'The company ran out of budget',
      'Two senior developers are on leave, reducing team capacity by 30%',
      'The project was cancelled',
      'The team wanted to take a holiday'
    ],
    correctIndex: 1,
    explanation: 'Scrum Master giải thích: "Because two senior developers are on annual leave next week, our team capacity is reduced by thirty percent."',
    transcriptVi: 'Vì hai lập trình viên cấp cao sẽ nghỉ phép năm vào tuần tới, năng lực thực hiện của nhóm giảm 30%. Chúng ta chỉ nên đưa các câu chuyện người dùng ưu tiên cao vào Sprint 25.',
  },
  {
    id: 'lis-it-8',
    title: 'Database Optimization and Composite Indexing',
    speakerRole: 'Database Administrator (Rachel)',
    audioScript: 'By adding a composite index on user ID and creation date, we managed to cut the query execution time from three seconds down to forty milliseconds.',
    question: 'What was the result of adding the composite index to the database?',
    options: [
      'The database crashed during peak traffic',
      'Query execution time dropped from 3 seconds to 40 milliseconds',
      'All user IDs were permanently deleted',
      'The server required an emergency restart'
    ],
    correctIndex: 1,
    explanation: 'Rachel thông báo kết quả tối ưu: "we managed to cut the query execution time from three seconds down to forty milliseconds."',
    transcriptVi: 'Bằng cách thêm chỉ mục kết hợp trên ID người dùng và ngày tạo, chúng tôi đã giảm thời gian thực thi truy vấn từ ba giây xuống chỉ còn 40 mili-giây.',
  },
  {
    id: 'lis-it-9',
    title: 'API Security Token Expiration Policy',
    speakerRole: 'Security Specialist (Marcus)',
    audioScript: 'We discovered that JWT refresh tokens were not expiring properly. We must enforce a seven-day maximum lifespan and revoke active sessions on password changes.',
    question: 'What security policy does Marcus recommend enforcing?',
    options: [
      'Disable password protection completely',
      'Enforce a 7-day maximum lifespan for JWT refresh tokens and revoke sessions on password changes',
      'Allow tokens to remain valid forever',
      'Require users to register new accounts every week'
    ],
    correctIndex: 1,
    explanation: 'Marcus khuyến nghị: "enforce a seven-day maximum lifespan and revoke active sessions on password changes".',
    transcriptVi: 'Chúng tôi phát hiện các refresh token JWT không hết hạn đúng cách. Chúng ta phải áp dụng thời hạn tối đa 7 ngày và thu hồi các phiên đăng nhập đang hoạt động khi người dùng đổi mật khẩu.',
  },

  // Daily Scenarios
  {
    id: 'lis-dl-1',
    title: 'Airport Gate Change Announcement',
    speakerRole: 'Announcer',
    audioScript: 'Attention passengers on flight VN123 to Hanoi, the gate has been changed to gate 24. Please proceed to gate 24 immediately.',
    question: 'What changed for flight VN123?',
    options: [
      'The flight is cancelled',
      'The departure time',
      'The departure gate',
      'The airline name',
    ],
    correctIndex: 2,
    explanation: 'Thông báo nhắc nhở: "the gate has been changed to gate 24".',
    transcriptVi: 'Hành khách trên chuyến bay VN123 đi Hà Nội chú ý, cổng ra máy bay đã được đổi sang cổng số 24. Vui lòng di chuyển đến cổng số 24 ngay lập tức.',
  },
  {
    id: 'lis-dl-2',
    title: 'Restaurant Ordering Specials',
    speakerRole: 'Waiter',
    audioScript: 'For our specials today, we have grilled salmon with asparagus, and a spicy mushroom risotto. What can I get for you?',
    question: 'Which of the following is one of today\\'s specials?',
    options: [
      'Chicken salad',
      'Grilled salmon with asparagus',
      'Beef steak',
      'Tomato soup',
    ],
    correctIndex: 1,
    explanation: 'Phục vụ giới thiệu hai món đặc biệt, trong đó có "grilled salmon with asparagus".',
    transcriptVi: 'Đối với các món đặc biệt hôm nay, chúng tôi có cá hồi nướng với măng tây, và cơm Ý risotto nấm cay. Tôi có thể lấy gì cho quý khách?',
  },
  {
    id: 'lis-dl-3',
    title: 'Phone Customer Service Automated Menu',
    speakerRole: 'Agent (Emma)',
    audioScript: 'Thank you for calling Alpha Bank. To check your account balance, press 1. To speak with a representative, press zero.',
    question: 'What should the customer press to speak with a representative?',
    options: [
      'Press 1',
      'Press 2',
      'Press 9',
      'Press zero',
    ],
    correctIndex: 3,
    explanation: 'Emma hướng dẫn: "To speak with a representative, press zero."',
    transcriptVi: 'Cảm ơn quý khách đã gọi đến Ngân hàng Alpha. Để kiểm tra số dư tài khoản, nhấn phím 1. Để gặp tổng đài viên, nhấn phím 0.',
  },
  {
    id: 'lis-dl-4',
    title: 'Weather Forecast Heavy Rain & Thunderstorms',
    speakerRole: 'Meteorologist',
    audioScript: 'Tomorrow will start off sunny, but expect heavy rain and thunderstorms by late afternoon. Don\\'t forget your umbrella!',
    question: 'What is the weather expectation for tomorrow late afternoon?',
    options: [
      'Sunny and clear',
      'Heavy rain and thunderstorms',
      'Snowing',
      'Windy but dry',
    ],
    correctIndex: 1,
    explanation: 'Người dự báo thời tiết nói: "expect heavy rain and thunderstorms by late afternoon".',
    transcriptVi: 'Ngày mai sẽ bắt đầu với trời nắng, nhưng dự kiến sẽ có mưa lớn và giông bão vào cuối buổi chiều. Đừng quên mang theo ô!',
  },
  {
    id: 'lis-dl-5',
    title: 'News Report on City Tree Planting Initiative',
    speakerRole: 'News Anchor',
    audioScript: 'The local government has announced a new initiative to plant one million trees across the city by the end of next year to improve air quality.',
    question: 'What is the main goal of the new initiative?',
    options: [
      'To build a new highway',
      'To plant one million trees to improve air quality',
      'To cut down trees in the city',
      'To reduce taxes for citizens',
    ],
    correctIndex: 1,
    explanation: 'Bản tin đề cập đến sáng kiến mới: "to plant one million trees across the city... to improve air quality".',
    transcriptVi: 'Chính quyền địa phương vừa công bố một sáng kiến mới nhằm trồng một triệu cây xanh trên toàn thành phố vào cuối năm sau để cải thiện chất lượng không khí.',
  },
  {
    id: 'lis-dl-6',
    title: 'Hotel Room Upgrade Offer',
    speakerRole: 'Hotel Receptionist',
    audioScript: 'Good evening, Mr. Lee. As an appreciation for your loyalty membership, we have upgraded your reservation to an executive suite on the fourteenth floor with ocean views, at no additional charge.',
    question: 'What special benefit was given to Mr. Lee during check-in?',
    options: [
      'A free dinner voucher',
      'A complimentary room upgrade to an executive suite with ocean views',
      'A 50% discount on his next flight',
      'Free airport shuttle service'
    ],
    correctIndex: 1,
    explanation: 'Lễ tân thông báo: "we have upgraded your reservation to an executive suite on the fourteenth floor with ocean views, at no additional charge."',
    transcriptVi: 'Chào buổi tối, anh Lee. Để tri ân thành viên thân thiết, chúng tôi đã nâng cấp phòng của anh lên phòng suite thương gia ở tầng 14 có hướng nhìn ra biển, hoàn toàn miễn phí.',
  },
  {
    id: 'lis-dl-7',
    title: 'Flight Delayed Announcement',
    speakerRole: 'Airline Gate Agent',
    audioScript: 'Ladies and gentlemen, flight BA249 to New York has been delayed by approximately forty-five minutes due to late arrival of the inbound aircraft. Please remain in the gate area for updated boarding times.',
    question: 'Why was the flight to New York delayed?',
    options: [
      'Severe weather storm at destination',
      'Late arrival of the inbound aircraft',
      'Engine mechanical failure',
      'Airport power outage'
    ],
    correctIndex: 1,
    explanation: 'Thông báo giải thích: "delayed by approximately forty-five minutes due to late arrival of the inbound aircraft" (máy bay chuyến trước đến muộn).',
    transcriptVi: 'Thưa quý khách, chuyến bay BA249 đến New York đã bị trễ khoảng 45 phút do máy bay chuyến trước đến muộn. Vui lòng giữ vị trí tại khu vực cửa khẩu để cập nhật giờ lên máy bay.',
  },
  {
    id: 'lis-dl-8',
    title: 'Subway Station Platform Change',
    speakerRole: 'Transit Authority Officer',
    audioScript: 'Attention passengers, due to emergency track maintenance on the Blue Line, all outbound trains will depart from Platform 3 instead of Platform 1 until midnight.',
    question: 'Where should passengers go to catch outbound trains on the Blue Line?',
    options: [
      'Platform 1 as usual',
      'Platform 3 until midnight',
      'The main bus terminal outside',
      'Platform 5 on the Green Line'
    ],
    correctIndex: 1,
    explanation: 'Thông báo nêu rõ: "all outbound trains will depart from Platform 3 instead of Platform 1 until midnight."',
    transcriptVi: 'Hành khách chú ý, do bảo trì đường ray khẩn cấp trên tuyến Blue Line, tất cả các chuyến tàu chiều đi sẽ khởi hành từ Sân ga số 3 thay vì Sân ga số 1 cho đến nửa đêm.',
  },
  {
    id: 'lis-dl-9',
    title: 'Electronics Store Return & Refund Policy',
    speakerRole: 'Store Manager (Brian)',
    audioScript: 'You can return any unopened electronics within thirty days of purchase for a full refund, provided that you have the original receipt and packaging intact.',
    question: 'What is required to receive a full refund within 30 days?',
    options: [
      'Just bring the item without any packaging',
      'The original receipt and intact packaging for unopened items',
      'A recommendation letter from the manufacturer',
      'Only store credit is provided, no refunds allowed'
    ],
    correctIndex: 1,
    explanation: 'Quản lý Brian nói rõ điều kiện hoàn tiền 100%: "provided that you have the original receipt and packaging intact."',
    transcriptVi: 'Quý khách có thể trả lại bất kỳ thiết bị điện tử nào chưa mở hộp trong vòng 30 ngày kể từ ngày mua để được hoàn lại toàn bộ tiền, với điều kiện còn nguyên biên lai gốc và bao bì nguyên vẹn.',
  }
];

// ROLEPLAY SCENARIOS (8 total, each with 4-5 steps)
export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  // Scenario 1: Daily Scrum Meeting
  {
    id: 'rp-scrum',
    title: 'Mô phỏng: Báo cáo trong buổi Daily Scrum với Tech Lead Tây',
    situation: 'Bạn là một Frontend Developer. Tech Lead nước ngoài (Alex) đang điều phối buổi Standup sáng thứ Hai và hỏi về tiến độ của bạn.',
    userRole: 'Frontend Developer',
    partnerRole: 'Tech Lead Alex',
    partnerAvatar: '👨‍💼',
    steps: [
      {
        partnerMessage: 'Good morning everyone! Nam, could you kick off with your updates today?',
        partnerAudioText: 'Good morning everyone! Nam, could you kick off with your updates today?',
        suggestedResponses: [
          {
            id: 'sc-s1-r1',
            text: 'Good morning Alex. Yesterday I wrapped up the login UI. Today I am integrating the auth API, but I hit a minor blocker with the CORS policy.',
            translation: 'Chào buổi sáng Alex. Hôm qua tôi đã hoàn tất UI đăng nhập. Hôm nay tôi đang tích hợp API xác thực, nhưng gặp chút vướng mắc về chính sách CORS.',
            isPoliteAndEffective: true,
            feedback: 'Rất xuất sắc! Cấu trúc 3 ý chuẩn Scrum: Hôm qua làm gì, hôm nay làm gì, và có blocker nào không.',
          },
          {
            id: 'sc-s1-r2',
            text: 'I did login. Now do API. Server has error.',
            translation: 'Tôi đã làm login. Giờ làm API. Server bị lỗi.',
            isPoliteAndEffective: false,
            feedback: 'Câu quá cụt lủn và thiếu cấu trúc, nên nói câu hoàn chỉnh có chủ ngữ vị ngữ.',
          },
        ],
      },
      {
        partnerMessage: 'Thanks for flagging the CORS issue. Do you need David from the backend team to sync up with you right after this standup?',
        partnerAudioText: 'Thanks for flagging the CORS issue. Do you need David from the backend team to sync up with you right after this standup?',
        suggestedResponses: [
          {
            id: 'sc-s2-r1',
            text: 'Yes please, that would be really helpful! A quick 5-minute sync with David will help us resolve it quickly.',
            translation: 'Vâng, được vậy thì tốt quá ạ! Chỉ cần một buổi họp nhanh 5 phút với David sẽ giúp chúng tôi giải quyết việc này ngay.',
            isPoliteAndEffective: true,
            feedback: 'Phản hồi rất chuyên nghiệp, chủ động và lịch thiệp!',
          },
          {
            id: 'sc-s2-r2',
            text: 'Sure, tell him to fix it now.',
            translation: 'Được, bảo anh ấy sửa ngay đi.',
            isPoliteAndEffective: false,
            feedback: 'Giọng điệu ra lệnh, không phù hợp trong môi trường teamwork quốc tế.',
          },
        ],
      },
      {
        partnerMessage: 'David says he can hop on a call at 10 AM. Once that is sorted, do you think you will be able to submit the PR for code review by the end of the day?',
        partnerAudioText: 'David says he can hop on a call at 10 AM. Once that is sorted, do you think you will be able to submit the PR for code review by the end of the day?',
        suggestedResponses: [
          {
            id: 'sc-s3-r1',
            text: 'Yes, absolutely! The UI components are already covered with unit tests, so as soon as the CORS headers are fixed, I will submit the PR before 4 PM.',
            translation: 'Vâng, chắc chắn rồi! Các thành phần UI đã được viết kiểm thử đầy đủ, nên ngay khi header CORS được sửa xong, tôi sẽ gửi PR trước 4 giờ chiều.',
            isPoliteAndEffective: true,
            feedback: 'Cam kết mốc thời gian rõ ràng và khẳng định chất lượng code đã được test trước.',
          },
          {
            id: 'sc-s3-r2',
            text: 'I do not know, maybe yes maybe no, depends if David does his job.',
            translation: 'Tôi không biết, có thể có có thể không, tuỳ xem David có làm việc không.',
            isPoliteAndEffective: false,
            feedback: 'Đùn đẩy trách nhiệm cho đồng nghiệp là điều tối kỵ trong văn hoá Agile.',
          },
        ],
      },
      {
        partnerMessage: 'Sounds like a solid plan. Also, don\\'t forget we have our Sprint Retrospective tomorrow afternoon. Please make sure to jot down any feedback on the retro board.',
        partnerAudioText: 'Sounds like a solid plan. Also, don\\'t forget we have our Sprint Retrospective tomorrow afternoon. Please make sure to jot down any feedback on the retro board.',
        suggestedResponses: [
          {
            id: 'sc-s4-r1',
            text: 'Got it, Alex! I already noted a couple of observations regarding our CI pipeline and look forward to sharing them with the team.',
            translation: 'Tôi hiểu rồi Alex! Tôi đã ghi chú một vài nhận xét về luồng CI và rất mong chờ được chia sẻ cùng cả nhóm.',
            isPoliteAndEffective: true,
            feedback: 'Rất tích cực! Thể hiện tinh thần cải tiến liên tục (Continuous Improvement) của một kỹ sư xịn.',
          },
          {
            id: 'sc-s4-r2',
            text: 'Retro is a waste of time, I just want to write code.',
            translation: 'Họp retro tốn thời gian lắm, tôi chỉ muốn viết code thôi.',
            isPoliteAndEffective: false,
            feedback: 'Thiếu tôn trọng quy trình Scrum chung và dễ gây ức chế cho quản lý dự án.',
          },
        ],
      },
    ],
  },

  // Scenario 2: HR Job Interview
  {
    id: 'rp-interview',
    title: 'Mô phỏng: Phỏng vấn xin việc với Quản lý Nhân sự (HR Interview)',
    situation: 'Bạn đang tham gia buổi phỏng vấn vị trí Senior Developer. HR Manager (Sarah) yêu cầu bạn giới thiệu bản thân và kinh nghiệm.',
    userRole: 'Candidate',
    partnerRole: 'HR Manager Sarah',
    partnerAvatar: '👩‍💼',
    steps: [
      {
        partnerMessage: 'Welcome to the interview! Could you please start by introducing yourself and your relevant experience?',
        partnerAudioText: 'Welcome to the interview! Could you please start by introducing yourself and your relevant experience?',
        suggestedResponses: [
          {
            id: 'iv-s1-r1',
            text: 'Thank you. I have been working as a software engineer for 5 years, mainly focusing on React and Node.js. In my previous role, I led a team to refactor our main architecture.',
            translation: 'Cảm ơn bạn. Tôi đã làm kỹ sư phần mềm được 5 năm, chủ yếu tập trung vào React và Node.js. Ở vai trò trước, tôi đã dẫn dắt nhóm tái cấu trúc kiến trúc chính.',
            isPoliteAndEffective: true,
            feedback: 'Tóm tắt rất tốt, đi thẳng vào kinh nghiệm cốt lõi và nêu bật thành tích quản lý.',
          },
          {
            id: 'iv-s1-r2',
            text: 'My name is Nam. I like coding. I worked at ABC company.',
            translation: 'Tôi tên Nam. Tôi thích lập trình. Tôi làm việc ở công ty ABC.',
            isPoliteAndEffective: false,
            feedback: 'Quá cơ bản cho một vị trí Senior. Bạn cần làm nổi bật kỹ năng và số năm kinh nghiệm.',
          },
        ],
      },
      {
        partnerMessage: 'That sounds impressive. Can you share a challenging situation at work and how you handled it?',
        partnerAudioText: 'That sounds impressive. Can you share a challenging situation at work and how you handled it?',
        suggestedResponses: [
          {
            id: 'iv-s2-r1',
            text: 'We once had a critical production bug right before a major release. I stayed calm, communicated with stakeholders, and collaborated with my team to deploy a hotfix in 2 hours.',
            translation: 'Chúng tôi từng gặp lỗi production nghiêm trọng ngay trước đợt phát hành lớn. Tôi đã giữ bình tĩnh, giao tiếp với các bên liên quan và phối hợp với nhóm để triển khai bản vá trong 2 giờ.',
            isPoliteAndEffective: true,
            feedback: 'Sử dụng mô hình STAR rất chuẩn, nêu rõ hành động (stayed calm, communicated) và kết quả (hotfix in 2 hours).',
          },
          {
            id: 'iv-s2-r2',
            text: 'The server broke and I fixed it very fast.',
            translation: 'Máy chủ hỏng và tôi sửa nó rất nhanh.',
            isPoliteAndEffective: false,
            feedback: 'Thiếu chi tiết, không cho thấy kỹ năng mềm hay cách thức giải quyết vấn đề.',
          },
        ],
      },
      {
        partnerMessage: 'That demonstrates great resilience. Why are you interested in joining our company specifically, and where do you see yourself in three years?',
        partnerAudioText: 'That demonstrates great resilience. Why are you interested in joining our company specifically, and where do you see yourself in three years?',
        suggestedResponses: [
          {
            id: 'iv-s3-r1',
            text: 'I have been following your fintech innovations and admire your high engineering standards. In three years, I envision stepping into a Tech Lead role where I can architect scalable systems and mentor engineers.',
            translation: 'Tôi đã theo dõi các đột phá fintech của công ty và rất ngưỡng mộ tiêu chuẩn kỹ thuật cao ở đây. Trong 3 năm tới, tôi hướng tới vị trí Tech Lead để thiết kế hệ thống chịu tải lớn và hướng dẫn các bạn kỹ sư trẻ.',
            isPoliteAndEffective: true,
            feedback: 'Khéo léo kết hợp hiểu biết về sản phẩm công ty với định hướng phát triển sự nghiệp dài hạn rõ ràng.',
          },
          {
            id: 'iv-s3-r2',
            text: 'Because you pay higher salary and my current boss is really annoying.',
            translation: 'Vì bên bạn trả lương cao hơn và sếp hiện tại của tôi phiền phức lắm.',
            isPoliteAndEffective: false,
            feedback: 'Tuyệt đối không nói xấu sếp cũ hoặc chỉ đề cập đến tiền bạc khi được hỏi về động lực ứng tuyển.',
          },
        ],
      },
      {
        partnerMessage: 'That aligns wonderfully with our growth roadmap. Do you have any questions for me before we wrap up this initial discussion?',
        partnerAudioText: 'That aligns wonderfully with our growth roadmap. Do you have any questions for me before we wrap up this initial discussion?',
        suggestedResponses: [
          {
            id: 'iv-s4-r1',
            text: 'Yes, thank you! I would love to learn more about the team\\'s deployment frequency and how cross-functional collaboration works between developers and product managers.',
            translation: 'Vâng, cảm ơn bạn! Tôi rất muốn biết thêm về tần suất triển khai của nhóm và cách thức phối hợp giữa lập trình viên với các quản lý sản phẩm.',
            isPoliteAndEffective: true,
            feedback: 'Đặt câu hỏi thông minh thể hiện sự quan tâm thực sự đến văn hoá làm việc thực tế.',
          },
          {
            id: 'iv-s4-r2',
            text: 'No, I just want to know when I can get the offer.',
            translation: 'Không, tôi chỉ muốn biết khi nào nhận được offer thôi.',
            isPoliteAndEffective: false,
            feedback: 'Nóng vội và thiếu tế nhị, tạo cảm giác thiếu chuyên nghiệp.',
          },
        ],
      },
    ],
  },

  // Scenario 3: Deep Technical Architecture Interview
  {
    id: 'rp-tech-interview',
    title: 'Mô phỏng: Phỏng vấn chuyên sâu kiến trúc hệ thống với Chief Architect',
    situation: 'Bạn đang trao đổi vòng System Design với Chief Architect (Marcus) cho hệ thống xử lý hàng triệu người dùng đồng thời.',
    userRole: 'Senior Backend Engineer Candidate',
    partnerRole: 'Chief Architect Marcus',
    partnerAvatar: '👨‍💻',
    steps: [
      {
        partnerMessage: 'Hi Nam! Let\\'s dive into a real-world scenario. How would you design a high-throughput notification system that must deliver 10 million push messages per hour reliably?',
        partnerAudioText: 'Hi Nam! Let\\'s dive into a real-world scenario. How would you design a high-throughput notification system that must deliver 10 million push messages per hour reliably?',
        suggestedResponses: [
          {
            id: 'ti-s1-r1',
            text: 'I would decouple message ingestion and delivery using Apache Kafka as an event broker. A scalable cluster of consumer workers can process partitions concurrently, backed by Redis for quick device token lookups.',
            translation: 'Tôi sẽ tách biệt việc tiếp nhận và gửi thông báo bằng Apache Kafka làm event broker. Một cụm worker có thể tiêu thụ dữ liệu song song theo partition, kết hợp Redis để tra cứu nhanh device token.',
            isPoliteAndEffective: true,
            feedback: 'Kiến trúc phân tán chuẩn mực: Decoupling, Message Queue và In-memory Caching.',
          },
          {
            id: 'ti-s1-r2',
            text: 'I will just write a simple for-loop in Node.js and send all messages one by one to Apple and Google.',
            translation: 'Tôi chỉ cần viết vòng lặp for trong Node.js rồi gửi từng tin một tới Apple và Google.',
            isPoliteAndEffective: false,
            feedback: 'Vòng lặp tuần tự sẽ gây nghẽn nghiêm trọng (blocking I/O) và sập server khi gặp tải lớn.',
          },
        ],
      },
      {
        partnerMessage: 'Good choice with Kafka and worker pools. Now, what happens if the third-party push gateway starts rate-limiting our requests or experiences 503 errors?',
        partnerAudioText: 'Good choice with Kafka and worker pools. Now, what happens if the third-party push gateway starts rate-limiting our requests or experiences 503 errors?',
        suggestedResponses: [
          {
            id: 'ti-s2-r1',
            text: 'We should implement the Circuit Breaker pattern along with exponential backoff with jitter and a Dead Letter Queue (DLQ). This prevents cascading failures and ensures unprocessed messages are preserved for delayed retry.',
            translation: 'Chúng ta nên triển khai mẫu Circuit Breaker kết hợp chiến lược exponential backoff có jitter và Dead Letter Queue (DLQ). Điều này ngăn ngừa lỗi dây chuyền và đảm bảo các tin nhắn chưa gửi được lưu lại để thử lại sau.',
            isPoliteAndEffective: true,
            feedback: 'Rất am hiểu các mẫu chịu lỗi (Fault-Tolerance Patterns) trong hệ thống microservices hiện đại.',
          },
          {
            id: 'ti-s2-r2',
            text: 'Just retry continuously every second until it works.',
            translation: 'Cứ thử lại liên tục mỗi giây cho đến khi được thì thôi.',
            isPoliteAndEffective: false,
            feedback: 'Thử lại liên tục (Thundering Herd) sẽ làm nghẽn mạng và khiến dịch vụ đối tác cấm IP của bạn vĩnh viễn.',
          },
        ],
      },
      {
        partnerMessage: 'Spot on with the Circuit Breaker and DLQ. How would you handle database sharding and maintain transactional consistency across distributed services?',
        partnerAudioText: 'Spot on with the Circuit Breaker and DLQ. How would you handle database sharding and maintain transactional consistency across distributed services?',
        suggestedResponses: [
          {
            id: 'ti-s3-r1',
            text: 'For distributed data consistency, I prefer the Saga pattern with compensating transactions and eventual consistency over 2-phase commits, which are prone to deadlocks. For sharding, hashing by tenant ID or user ID provides uniform distribution.',
            translation: 'Để đảm bảo tính nhất quán phân tán, tôi ưu tiên mẫu Saga với các giao dịch bù trừ và tính nhất quán sau cùng thay vì 2-phase commit vốn dễ gây deadlock. Với phân mảnh, băm theo tenant ID hoặc user ID sẽ phân bổ đều tải.',
            isPoliteAndEffective: true,
            feedback: 'Tư duy kiến trúc sắc sảo, chỉ rõ nhược điểm của 2PC và ưu điểm của Saga Pattern.',
          },
          {
            id: 'ti-s3-r2',
            text: 'We should just put everything into one huge MySQL server so we do not have distributed issues.',
            translation: 'Chúng ta cứ nhét hết vào một server MySQL khổng lồ là không bao giờ bị vấn đề phân tán.',
            isPoliteAndEffective: false,
            feedback: 'Thiếu tư duy mở rộng chiều ngang (Horizontal Scaling) cho các hệ thống triệu người dùng.',
          },
        ],
      },
      {
        partnerMessage: 'Very well reasoned, Nam. Last question: How do you balance code quality and unit test coverage against tight business deadlines?',
        partnerAudioText: 'Very well reasoned, Nam. Last question: How do you balance code quality and unit test coverage against tight business deadlines?',
        suggestedResponses: [
          {
            id: 'ti-s4-r1',
            text: 'I advocate focusing automated tests on core business domains and high-risk workflows first. If technical shortcuts are taken for an MVP, we explicitly document them as technical debt on Jira and allocate refactoring capacity in the subsequent sprint.',
            translation: 'Tôi chủ trương tập trung kiểm thử tự động vào nghiệp vụ cốt lõi và các luồng rủi ro cao trước. Nếu cần đi tắt để kịp MVP, nhóm sẽ ghi nhận rõ ràng thành nợ kỹ thuật trên Jira và dành nguồn lực refactor ở sprint kế tiếp.',
            isPoliteAndEffective: true,
            feedback: 'Cách tiếp cận thực tế, cân bằng giữa tốc độ kinh doanh (Business Velocity) và sức khoẻ kỹ thuật (Code Health).',
          },
          {
            id: 'ti-s4-r2',
            text: 'Skip all unit tests when deadlines are tight. Tests are not that important.',
            translation: 'Bỏ qua hết unit test khi gấp deadline. Test đâu có quan trọng đến thế.',
            isPoliteAndEffective: false,
            feedback: 'Tư duy bỏ qua kiểm thử sẽ dẫn đến lỗi hồi quy nghiêm trọng (Regression bugs) sau khi lên production.',
          },
        ],
      },
    ],
  },

  // Scenario 4: Client Demo & Feature Walkthrough
  {
    id: 'rp-clientdemo',
    title: 'Mô phỏng: Buổi giới thiệu sản phẩm & Release với Khách hàng (Client Demo)',
    situation: 'Bạn đang thuyết trình cho đối tác khách hàng (Mr. Smith) về tính năng bảng điều khiển phân tích mới được triển khai trong sprint.',
    userRole: 'Presenter / Technical Lead',
    partnerRole: 'Client Mr. Smith',
    partnerAvatar: '👨‍🦳',
    steps: [
      {
        partnerMessage: 'Hi there, I am looking forward to seeing the new dashboard you promised for this sprint.',
        partnerAudioText: 'Hi there, I am looking forward to seeing the new dashboard you promised for this sprint.',
        suggestedResponses: [
          {
            id: 'cd-s1-r1',
            text: 'Thank you for joining, Mr. Smith. Let me share my screen and walk you through the new dashboard interface we just deployed on staging.',
            translation: 'Cảm ơn ông đã tham gia, ông Smith. Hãy để tôi chia sẻ màn hình và hướng dẫn ông qua giao diện bảng điều khiển mới mà chúng tôi vừa triển khai trên staging.',
            isPoliteAndEffective: true,
            feedback: 'Chào hỏi lịch sự và dẫn dắt ngay vào phần trình bày một cách tự tin, chuyên nghiệp.',
          },
          {
            id: 'cd-s1-r2',
            text: 'Look at my screen, the dashboard is here.',
            translation: 'Nhìn màn hình của tôi, bảng điều khiển ở đây.',
            isPoliteAndEffective: false,
            feedback: 'Hơi khiếm nhã khi dùng câu mệnh lệnh cụt ngủn "Look at my screen".',
          },
        ],
      },
      {
        partnerMessage: 'It looks very intuitive! But is there any way our financial officers can export this data into CSV or Excel format?',
        partnerAudioText: 'It looks very intuitive! But is there any way our financial officers can export this data into CSV or Excel format?',
        suggestedResponses: [
          {
            id: 'cd-s2-r1',
            text: 'That is a great question. While direct export was not part of the initial sprint scope, we anticipated this need and can easily prioritize CSV export for the upcoming release next week.',
            translation: 'Đó là một câu hỏi rất hay. Dù tính năng xuất file không nằm trong scope ban đầu của sprint, chúng tôi đã dự trù nhu cầu này và có thể ưu tiên đưa vào bản cập nhật tuần tới.',
            isPoliteAndEffective: true,
            feedback: 'Khen ngợi câu hỏi, giải thích phạm vi một cách tích cực và đưa ra lộ trình giải quyết cụ thể.',
          },
          {
            id: 'cd-s2-r2',
            text: 'No, we did not make that feature because you did not pay for it.',
            translation: 'Không, chúng tôi không làm tính năng đó vì ông không trả tiền cho nó.',
            isPoliteAndEffective: false,
            feedback: 'Thái độ thô lỗ dễ làm đổ vỡ mối quan hệ hợp tác kinh doanh.',
          },
        ],
      },
      {
        partnerMessage: 'That CSV timeline sounds perfectly fine. Another thing our marketing team asked: Can our brand logos and color themes be customized across these charts?',
        partnerAudioText: 'That CSV timeline sounds perfectly fine. Another thing our marketing team asked: Can our brand logos and color themes be customized across these charts?',
        suggestedResponses: [
          {
            id: 'cd-s3-r1',
            text: 'Certainly! Our component architecture was built with dynamic CSS variables and Tailwind themes. We can configure your brand hex codes and custom logos within 24 hours for your review.',
            translation: 'Chắc chắn rồi ạ! Kiến trúc giao diện của chúng tôi được xây dựng với các biến CSS linh hoạt và Tailwind theme. Chúng tôi có thể cấu hình mã màu thương hiệu và logo của quý công ty trong vòng 24 giờ để ông xem thử.',
            isPoliteAndEffective: true,
            feedback: 'Nhấn mạnh sự linh hoạt kỹ thuật (dynamic CSS variables) và cam kết thời gian nhanh chóng (24 hours).',
          },
          {
            id: 'cd-s3-r2',
            text: 'No, our designer chose this blue theme and we won\\'t change it.',
            translation: 'Không, nhà thiết kế của chúng tôi chọn màu xanh này rồi và chúng tôi không đổi đâu.',
            isPoliteAndEffective: false,
            feedback: 'Cố chấp và bảo thủ, không đáp ứng nhu cầu tuỳ biến thương hiệu của khách hàng.',
          },
        ],
      },
      {
        partnerMessage: 'Impressive responsiveness! When can we expect the staging link with testing credentials so our executives can test it out?',
        partnerAudioText: 'Impressive responsiveness! When can we expect the staging link with testing credentials so our executives can test it out?',
        suggestedResponses: [
          {
            id: 'cd-s4-r1',
            text: 'I will compile the staging URL along with test accounts and a quick walkthrough guide, and email it to your team by 3 PM today.',
            translation: 'Tôi sẽ tổng hợp đường dẫn staging cùng các tài khoản kiểm thử và tài liệu hướng dẫn nhanh, rồi gửi email cho nhóm của ông trước 3 giờ chiều nay.',
            isPoliteAndEffective: true,
            feedback: 'Chốt buổi demo hoàn hảo: Cung cấp đầy đủ link, tài khoản và hướng dẫn kèm giờ hẹn chính xác.',
          },
          {
            id: 'cd-s4-r2',
            text: 'Whenever the DevOps guy deploys it, maybe tomorrow or next week.',
            translation: 'Bao giờ anh DevOps triển khai xong thì có, chắc mai hoặc tuần sau.',
            isPoliteAndEffective: false,
            feedback: 'Mơ hồ và thiếu cam kết trách nhiệm công việc.',
          },
        ],
      },
    ],
  },

  // Scenario 5: Global Salary & Compensation Negotiation
  {
    id: 'rp-salary-negotiation',
    title: 'Mô phỏng: Thương Lượng Lương Thưởng & Đãi Ngộ Với HR Global',
    situation: 'Bạn vừa vượt qua vòng phỏng vấn kỹ thuật xuất sắc. HR Director (Rachel) đang gọi điện để thảo luận về mức lương và các chế độ đãi ngộ trước khi gửi Official Offer.',
    userRole: 'Senior Software Engineer Candidate',
    partnerRole: 'HR Director Rachel',
    partnerAvatar: '👩‍💼',
    steps: [
      {
        partnerMessage: 'Congratulations on passing all technical rounds, Nam! We are excited to offer you the position. Our initial offer is $2,800 gross per month with hybrid remote benefits. How does that sound to you?',
        partnerAudioText: 'Congratulations on passing all technical rounds, Nam! We are excited to offer you the position. Our initial offer is 2800 dollars gross per month with hybrid remote benefits. How does that sound to you?',
        suggestedResponses: [
          {
            id: 'sn-s1-r1',
            text: 'Thank you so much, Rachel! I am thrilled about the opportunity. Given my 5 years of full-stack experience and proven track record leading system migrations, I was hoping for something closer to $3,200. Is there any flexibility on this number?',
            translation: 'Cảm ơn Rachel rất nhiều! Tôi rất hào hứng với cơ hội này. Với 5 năm kinh nghiệm full-stack và kinh nghiệm dẫn dắt chuyển đổi hệ thống, tôi hy vọng mức lương khoảng 3.200 USD. Không biết công ty có sự linh hoạt nào cho con số này không?',
            isPoliteAndEffective: true,
            feedback: 'Rất khéo léo! Luôn cảm ơn trước, nhấn mạnh giá trị đóng góp của bản thân rồi mới đề xuất con số kèm câu hỏi mở "Is there any flexibility?".',
          },
          {
            id: 'sn-s1-r2',
            text: 'Too low. I will not accept anything under $3,500. Take it or leave it.',
            translation: 'Quá thấp. Tôi sẽ không chấp nhận dưới 3.500 USD đâu. Được thì nhận không thì thôi.',
            isPoliteAndEffective: false,
            feedback: 'Thái độ tối hậu thư "Take it or leave it" rất thô lỗ và dễ khiến nhà tuyển dụng rút lại offer ngay lập tức.',
          },
        ],
      },
      {
        partnerMessage: 'I understand your point regarding your migration experience. The maximum base salary approved for this band is $3,000. However, we could supplement this with a $2,000 annual performance bonus and additional stock options. Would that work for you?',
        partnerAudioText: 'I understand your point regarding your migration experience. The maximum base salary approved for this band is 3000 dollars. However, we could supplement this with a 2000 dollars annual performance bonus and additional stock options. Would that work for you?',
        suggestedResponses: [
          {
            id: 'sn-s2-r1',
            text: 'That package sounds very fair and aligns with my long-term commitment to the company. Could you please send over the formal written offer detailing the bonus structure and stock vesting schedule?',
            translation: 'Gói đãi ngộ đó nghe rất hợp lý và phù hợp với định hướng gắn bó lâu dài của tôi với công ty. Bạn có thể gửi thư mời làm việc chính thức nêu chi tiết về cấu trúc thưởng và lộ trình cổ phiếu không?',
            isPoliteAndEffective: true,
            feedback: 'Phản hồi xuất sắc! Đồng thuận khéo léo và yêu cầu gửi tài liệu chính thức (written offer) để đảm bảo quyền lợi pháp lý.',
          },
          {
            id: 'sn-s2-r2',
            text: 'No, cash is king. I don\\'t care about stock options, give me $3,200 base right now.',
            translation: 'Không, tiền mặt là vua. Tôi không quan tâm cổ phiếu, đưa tôi 3.200 lương cứng ngay bây giờ.',
            isPoliteAndEffective: false,
            feedback: 'Thiếu tầm nhìn chiến lược và cứng nhắc trong đàm phán đãi ngộ tổng thể (Total Compensation).',
          },
        ],
      },
      {
        partnerMessage: 'Fantastic! I will prepare the formal offer letter and email it to you by tomorrow morning. Aside from the financial package, do you have any questions regarding our remote setup allowance or health insurance?',
        partnerAudioText: 'Fantastic! I will prepare the formal offer letter and email it to you by tomorrow morning. Aside from the financial package, do you have any questions regarding our remote setup allowance or health insurance?',
        suggestedResponses: [
          {
            id: 'sn-s3-r1',
            text: 'Thank you, Rachel. I would appreciate details on whether the private healthcare plan includes dental coverage, and if the home office allowance covers ergonomic equipment.',
            translation: 'Cảm ơn Rachel. Tôi muốn biết thêm chi tiết liệu gói bảo hiểm sức khỏe tư nhân có bao gồm nha khoa không, và khoản trợ cấp văn phòng tại nhà có chi trả cho thiết bị công thái học không.',
            isPoliteAndEffective: true,
            feedback: 'Hỏi đúng trọng tâm về các phúc lợi thiết thực cho sức khoẻ và môi trường làm việc từ xa.',
          },
          {
            id: 'sn-s3-r2',
            text: 'Just give me the money, I don\\'t need insurance.',
            translation: 'Cứ đưa tiền cho tôi là được, tôi không cần bảo hiểm.',
            isPoliteAndEffective: false,
            feedback: 'Bỏ qua các quyền lợi quan trọng của hợp đồng lao động chuẩn mực.',
          },
        ],
      },
      {
        partnerMessage: 'Yes, comprehensive dental care and ergonomic equipment are both fully covered! We are eager to welcome you on board on the first of next month. Does that start date work well for your transition?',
        partnerAudioText: 'Yes, comprehensive dental care and ergonomic equipment are both fully covered! We are eager to welcome you on board on the first of next month. Does that start date work well for your transition?',
        suggestedResponses: [
          {
            id: 'sn-s4-r1',
            text: 'Starting on the first of next month gives me ample time to conclude my handover smoothly. I will review the formal document promptly once received. Looking forward to making an impact with the team!',
            translation: 'Bắt đầu vào ngày đầu tháng tới cho tôi đủ thời gian bàn giao công việc suôn sẻ. Tôi sẽ xem xét hợp đồng chính thức ngay khi nhận được. Rất mong chờ được tạo ra giá trị cùng đội ngũ!',
            isPoliteAndEffective: true,
            feedback: 'Kết thúc cuộc gọi chuyên nghiệp, thể hiện sự nhiệt huyết và tinh thần trách nhiệm cao.',
          },
          {
            id: 'sn-s4-r2',
            text: 'Okay, bye.',
            translation: 'Ok, tạm biệt.',
            isPoliteAndEffective: false,
            feedback: 'Quá ngắn gọn, bỏ lỡ cơ hội để lại ấn tượng tốt đẹp trước ngày onboard.',
          },
        ],
      },
    ],
  },

  // Scenario 6: Handling Client Scope Creep
  {
    id: 'rp-client-scope-creep',
    title: 'Mô phỏng: Xử Lý Yêu Cầu Thay Đổi Scope Bất Ngờ Từ Client Nước Ngoài',
    situation: 'Dự án chỉ còn 1 tuần là đến hạn release. Khách hàng nước ngoài (David) đột ngột yêu cầu thêm tính năng xuất báo cáo đa định dạng mà không muốn tăng ngân sách hay dời deadline.',
    userRole: 'Technical Project Lead',
    partnerRole: 'Client Product Owner David',
    partnerAvatar: '👨‍💼',
    steps: [
      {
        partnerMessage: 'Hi Nam, our executive board just requested that we must include multi-format PDF and Excel reporting in next week\\'s launch. We need your team to squeeze this in without changing the go-live date.',
        partnerAudioText: 'Hi Nam, our executive board just requested that we must include multi-format PDF and Excel reporting in next week\\'s launch. We need your team to squeeze this in without changing the go-live date.',
        suggestedResponses: [
          {
            id: 'sc-s1-r1',
            text: 'I understand that executive reporting is high priority for your leadership, David. However, implementing PDF and Excel export requires building new server-side generators and thorough QA testing. Doing this in 5 days would risk regression bugs in the checkout flow. Can we release the MVP on schedule next week, and ship this reporting feature in a fast-follow update two weeks later?',
            translation: 'Tôi hiểu rằng báo cáo cho ban điều hành là ưu tiên hàng đầu, David. Tuy nhiên, việc xuất PDF và Excel đòi hỏi dựng thêm bộ tạo trên server và kiểm thử kỹ lưỡng. Làm việc này trong 5 ngày sẽ có nguy cơ gây lỗi dây chuyền vào luồng thanh toán. Chúng ta có thể ra mắt bản MVP đúng hẹn vào tuần tới, rồi cập nhật tính năng báo cáo này ngay 2 tuần sau đó không?',
            isPoliteAndEffective: true,
            feedback: 'Kỹ năng quản trị scope kinh điển (Fast-follow approach): Thừa nhận ưu tiên của khách, giải thích rủi ro kỹ thuật khách quan và đưa ra giải pháp 2 giai đoạn hợp lý.',
          },
          {
            id: 'sc-s1-r2',
            text: 'You are completely out of your mind. We signed a contract and you cannot add features whenever you feel like it.',
            translation: 'Anh hoàn toàn mất trí rồi. Chúng ta đã ký hợp đồng và anh không thể tự tiện thêm tính năng bất cứ khi nào muốn.',
            isPoliteAndEffective: false,
            feedback: 'Gây hấn trực diện làm đổ vỡ quan hệ đối tác khách hàng (client relationship).',
          },
        ],
      },
      {
        partnerMessage: 'I see your point about checkout stability. But the board really wants to see at least some form of data export on demo day. Is there any compromise we can make for the launch?',
        partnerAudioText: 'I see your point about checkout stability. But the board really wants to see at least some form of data export on demo day. Is there any compromise we can make for the launch?',
        suggestedResponses: [
          {
            id: 'sc-s2-r1',
            text: 'That is a great suggestion. We can provide a lightweight CSV export directly from the client side for launch day. It takes minimal engineering effort, zero risk to checkout, and your executives can open it straight in Excel. How does that sound?',
            translation: 'Đó là một gợi ý rất hay. Chúng tôi có thể cung cấp tính năng xuất file CSV nhẹ trực tiếp từ trình duyệt cho ngày ra mắt. Việc này tốn rất ít nguồn lực kỹ thuật, hoàn toàn không rủi ro cho luồng thanh toán, và các sếp có thể mở trực tiếp bằng Excel. Bạn thấy phương án đó thế nào?',
            isPoliteAndEffective: true,
            feedback: 'Tuyệt đỉnh! Biến yêu cầu phức tạp (PDF generation) thành giải pháp tinh gọn (CSV export) vừa lòng cả hai bên.',
          },
          {
            id: 'sc-s2-r2',
            text: 'No compromise. Only next month.',
            translation: 'Không thỏa hiệp. Chỉ có tháng sau thôi.',
            isPoliteAndEffective: false,
            feedback: 'Thái độ thiếu tính xây dựng và giải quyết vấn đề (problem-solving mindset).',
          },
        ],
      },
      {
        partnerMessage: 'CSV export directly into Excel sounds like the perfect middle ground! Let us proceed with that for next week, and schedule the full PDF reports for Phase 2. Thanks for finding a pragmatic solution, Nam!',
        partnerAudioText: 'CSV export directly into Excel sounds like the perfect middle ground! Let us proceed with that for next week, and schedule the full PDF reports for Phase 2. Thanks for finding a pragmatic solution, Nam!',
        suggestedResponses: [
          {
            id: 'sc-s3-r1',
            text: 'You are most welcome, David! I will update our Jira sprint board right away and keep you posted on the staging build by Thursday.',
            translation: 'Không có chi, David! Tôi sẽ cập nhật bảng Jira sprint ngay và gửi bạn bản xem trước trên staging trước thứ Năm.',
            isPoliteAndEffective: true,
            feedback: 'Chốt việc dứt khoát, cam kết mốc thời gian rõ ràng (by Thursday) tạo niềm tin tuyệt đối.',
          },
          {
            id: 'sc-s3-r2',
            text: 'Good. Do not bother me again.',
            translation: 'Tốt. Đừng làm phiền tôi nữa.',
            isPoliteAndEffective: false,
            feedback: 'Rất bất lịch sự, phá hỏng toàn bộ nỗ lực ngoại giao vừa đạt được.',
          },
        ],
      },
      {
        partnerMessage: 'One last favor, Nam: Could you put together a quick one-page slide summarizing this two-phase roadmap so I can present it to our board tomorrow?',
        partnerAudioText: 'One last favor, Nam: Could you put together a quick one-page slide summarizing this two-phase roadmap so I can present it to our board tomorrow?',
        suggestedResponses: [
          {
            id: 'sc-s4-r1',
            text: 'Certainly, David! I will draft a concise three-bullet slide covering the launch deliverables, the CSV benefits, and the Phase 2 timeline, and share it before 5 PM today.',
            translation: 'Chắc chắn rồi David! Tôi sẽ soạn một slide ngắn gọn gồm 3 ý chính nêu rõ các hạng mục ngày ra mắt, lợi ích của bản CSV và lộ trình Giai đoạn 2, rồi gửi bạn trước 5 giờ chiều nay.',
            isPoliteAndEffective: true,
            feedback: 'Hỗ trợ đối tác toả sáng trước ban lãnh đạo là bí quyết giữ khách hàng lâu dài.',
          },
          {
            id: 'sc-s4-r2',
            text: 'Make your own slides, I am a software engineer not a designer.',
            translation: 'Tự làm slide đi, tôi là kỹ sư phần mềm chứ không phải nhân viên thiết kế.',
            isPoliteAndEffective: false,
            feedback: 'Cự tuyệt phũ phàng làm mất đi thiện cảm vừa gầy dựng được.',
          },
        ],
      },
    ],
  },

  // Scenario 7: Restaurant Complaint & Polite Service Resolution
  {
    id: 'rp-restaurant-complaint',
    title: 'Mô phỏng: Phàn nàn Lịch sự & Xử lý Khiếu nại Món ăn tại Nhà hàng',
    situation: 'Bạn đang dùng bữa tại một nhà hàng Âu sang trọng. Món bít tết bạn gọi chín vừa (medium-rare) nhưng khi bưng ra lại bị chín kỹ quá mức (well-done, khô cứng), đồng thời món salad có rắc đậu phộng dù bạn đã báo dị ứng.',
    userRole: 'Diner / Customer',
    partnerRole: 'Restaurant Floor Manager Antoine',
    partnerAvatar: '👨‍🍳',
    steps: [
      {
        partnerMessage: 'Good evening, sir. How is everything tasting with your main course tonight?',
        partnerAudioText: 'Good evening, sir. How is everything tasting with your main course tonight?',
        suggestedResponses: [
          {
            id: 'rc-s1-r1',
            text: 'Excuse me, I appreciate you asking. However, I ordered this ribeye steak medium-rare, but it appears to be completely well-done and quite dry. Could you please check on this for me?',
            translation: 'Xin lỗi, tôi rất cảm ơn bạn đã hỏi thăm. Tuy nhiên, tôi gọi món bít tết ribeye này chín vừa (medium-rare), nhưng nó có vẻ bị chín kỹ hoàn toàn và khá khô. Bạn có thể kiểm tra giúp tôi được không?',
            isPoliteAndEffective: true,
            feedback: 'Cách phàn nàn lịch sự mẫu mực: Dùng "Excuse me, I appreciate you asking. However..." để thể hiện sự văn minh.',
          },
          {
            id: 'rc-s1-r2',
            text: 'This food is disgusting! Your chef has no idea how to cook steak!',
            translation: 'Thức ăn này thật kinh tởm! Đầu bếp của các người chẳng biết nấu bít tết gì cả!',
            isPoliteAndEffective: false,
            feedback: 'La mắng xúc phạm làm căng thẳng bầu không khí và không giúp giải quyết vấn đề hiệu quả.',
          },
        ],
      },
      {
        partnerMessage: 'I am terribly sorry about that oversight, sir. I can clearly see that it is overcooked. Let me have the kitchen prepare a fresh steak cooked to medium-rare right away.',
        partnerAudioText: 'I am terribly sorry about that oversight, sir. I can clearly see that it is overcooked. Let me have the kitchen prepare a fresh steak cooked to medium-rare right away.',
        suggestedResponses: [
          {
            id: 'rc-s2-r1',
            text: 'Thank you, I really appreciate that. Also, could you please make sure the replacement salad does not contain any crushed peanuts? As I mentioned to our server, I have a severe nut allergy.',
            translation: 'Cảm ơn bạn, tôi rất trân trọng điều đó. Ngoài ra, bạn có thể đảm bảo món salad thay thế không có đậu phộng nghiền được không? Như tôi đã thông báo với nhân viên phục vụ, tôi bị dị ứng hạt rất nặng.',
            isPoliteAndEffective: true,
            feedback: 'Nhắc nhở nhẹ nhàng nhưng kiên quyết về vấn đề an toàn dị ứng thực phẩm (severe nut allergy).',
          },
          {
            id: 'rc-s2-r2',
            text: 'Hurry up! You people are completely ruining my evening.',
            translation: 'Nhanh lên! Các người đang phá hỏng buổi tối của tôi đấy.',
            isPoliteAndEffective: false,
            feedback: 'Thái độ hách dịch gây khó chịu cho nhân viên phục vụ đang nỗ lực khắc phục sự cố.',
          },
        ],
      },
      {
        partnerMessage: 'Oh heavens, I am so relieved you pointed that out! I will personally supervise the head chef in an allergy-safe station. Would you like a glass of vintage wine or a beverage on the house while you wait?',
        partnerAudioText: 'Oh heavens, I am so relieved you pointed that out! I will personally supervise the head chef in an allergy-safe station. Would you like a glass of vintage wine or a beverage on the house while you wait?',
        suggestedResponses: [
          {
            id: 'rc-s3-r1',
            text: 'That is very gracious of you, thank you. A glass of sparkling water or house red wine would be wonderful while I wait.',
            translation: 'Bạn thật chu đáo, cảm ơn bạn rất nhiều. Cho tôi một ly nước khoáng có ga hoặc rượu vang đỏ của nhà hàng trong lúc đợi là tuyệt vời rồi.',
            isPoliteAndEffective: true,
            feedback: 'Đáp lại sự đãi ngộ của quản lý nhà hàng một cách nhã nhặn, đúng mực.',
          },
          {
            id: 'rc-s3-r2',
            text: 'Bring me your most expensive champagne bottle for free or I will leave a 1-star review on Google.',
            translation: 'Đem chai sâm-panh đắt nhất ra đây miễn phí không thì tôi cho 1 sao trên Google.',
            isPoliteAndEffective: false,
            feedback: 'Đe dọa tống tiền đánh giá tiêu cực là hành vi thiếu văn hóa giao tiếp quốc tế.',
          },
        ],
      },
      {
        partnerMessage: 'Here is your fresh medium-rare ribeye with an allergy-safe garden salad, sir. Please cut into the center to confirm that it is cooked to your exact liking.',
        partnerAudioText: 'Here is your fresh medium-rare ribeye with an allergy-safe garden salad, sir. Please cut into the center to confirm that it is cooked to your exact liking.',
        suggestedResponses: [
          {
            id: 'rc-s4-r1',
            text: 'This looks absolutely perfect, tender and juicy just as requested! Thank you very much for handling this so promptly and professionally.',
            translation: 'Món này trông hoàn hảo tuyệt đối, mềm và mọng nước đúng như yêu cầu! Cảm ơn bạn rất nhiều vì đã xử lý nhanh chóng và chuyên nghiệp như vậy.',
            isPoliteAndEffective: true,
            feedback: 'Khen ngợi chân thành khi vấn đề đã được giải quyết thỏa đáng, tạo ấn tượng văn minh.',
          },
          {
            id: 'rc-s4-r2',
            text: 'Took you long enough. Whatever.',
            translation: 'Mất nhiều thời gian thế. Sao cũng được.',
            isPoliteAndEffective: false,
            feedback: 'Bất lịch sự ngay cả khi đối phương đã chu đáo bù đắp sai sót.',
          },
        ],
      },
    ],
  },

  // Scenario 8: Airport Transit & Baggage Connection
  {
    id: 'rp-airport',
    title: 'Mô phỏng: Thủ tục Sân bay & Xử lý Hành lý Quá cảnh Quốc tế',
    situation: 'Bạn đang làm thủ tục check-in tại quầy vé quốc tế cho chuyến bay nối chuyến từ Hà Nội đi San Francisco quá cảnh tại Tokyo.',
    userRole: 'International Passenger',
    partnerRole: 'Airline Check-in Agent',
    partnerAvatar: '🛫',
    steps: [
      {
        partnerMessage: 'Hello, good morning! Where are you flying to today? May I please have your passport and e-ticket receipt?',
        partnerAudioText: 'Hello, good morning! Where are you flying to today? May I please have your passport and e-ticket receipt?',
        suggestedResponses: [
          {
            id: 'ap-s1-r1',
            text: 'Good morning! I am flying to San Francisco with a layover in Tokyo. Here is my passport and e-ticket confirmation.',
            translation: 'Chào buổi sáng! Tôi bay đi San Francisco có quá cảnh tại Tokyo. Đây là hộ chiếu và xác nhận vé điện tử của tôi.',
            isPoliteAndEffective: true,
            feedback: 'Cung cấp đầy đủ thông tin điểm đến và chuyến bay nối cảnh ngay từ đầu.',
          },
          {
            id: 'ap-s1-r2',
            text: 'America. Here.',
            translation: 'Mỹ. Đây.',
            isPoliteAndEffective: false,
            feedback: 'Cụt lủn và thiếu tôn trọng, nên dùng câu dài có kính ngữ.',
          },
        ],
      },
      {
        partnerMessage: 'Thank you. Do you have any bags to check in today, or just carry-on luggage?',
        partnerAudioText: 'Thank you. Do you have any bags to check in today, or just carry-on luggage?',
        suggestedResponses: [
          {
            id: 'ap-s2-r1',
            text: 'I have one suitcase to check in, and I will be taking this small backpack as my carry-on bag.',
            translation: 'Tôi có một vali cần ký gửi, và tôi sẽ mang chiếc balo nhỏ này làm hành lý xách tay.',
            isPoliteAndEffective: true,
            feedback: 'Phân biệt rõ ràng giữa hành lý ký gửi (check-in suitcase) và xách tay (carry-on backpack).',
          },
          {
            id: 'ap-s2-r2',
            text: 'One big bag. One small bag.',
            translation: 'Một túi to. Một túi nhỏ.',
            isPoliteAndEffective: false,
            feedback: 'Không dùng đúng thuật ngữ hàng không chuyên ngành.',
          },
        ],
      },
      {
        partnerMessage: 'Please place your suitcase on the scale. For your seating preference on the long-haul flight to Tokyo, would you prefer an aisle seat or a window seat?',
        partnerAudioText: 'Please place your suitcase on the scale. For your seating preference on the long-haul flight to Tokyo, would you prefer an aisle seat or a window seat?',
        suggestedResponses: [
          {
            id: 'ap-s3-r1',
            text: 'An aisle seat would be wonderful, please, so I can stretch my legs during the flight.',
            translation: 'Cho tôi một ghế gần lối đi nhé, để tôi có thể duỗi chân thoải mái trong suốt chuyến bay.',
            isPoliteAndEffective: true,
            feedback: 'Sử dụng đúng từ "aisle seat" /ˈaɪl siːt/ và giải thích nhu cầu rất tự nhiên.',
          },
          {
            id: 'ap-s3-r2',
            text: 'I want sit outside the corridor.',
            translation: 'Tôi muốn ngồi bên ngoài hành lang.',
            isPoliteAndEffective: false,
            feedback: 'Dịch word-by-word sai nghĩa. Ghế cạnh lối đi trên máy bay gọi là "aisle seat".',
          },
        ],
      },
      {
        partnerMessage: 'Here are your boarding passes for both flight legs. Since you have a 3-hour layover in Tokyo Narita, do you want your baggage checked all the way through to San Francisco?',
        partnerAudioText: 'Here are your boarding passes for both flight legs. Since you have a 3-hour layover in Tokyo Narita, do you want your baggage checked all the way through to San Francisco?',
        suggestedResponses: [
          {
            id: 'ap-s4-r1',
            text: 'Yes please, could you check my bags all the way through to San Francisco? That will make my transit in Narita much smoother.',
            translation: 'Vâng, bạn có thể chuyển thẳng hành lý của tôi tới San Francisco luôn được không? Như vậy việc quá cảnh ở Narita sẽ thuận tiện hơn rất nhiều.',
            isPoliteAndEffective: true,
            feedback: 'Dùng cụm từ "check bags all the way through" cực kỳ chuẩn xác của du khách quốc tế.',
          },
          {
            id: 'ap-s4-r2',
            text: 'I do not know, you do whatever you want.',
            translation: 'Tôi không biết, bạn thích làm gì thì làm.',
            isPoliteAndEffective: false,
            feedback: 'Thờ ơ, có thể dẫn đến việc hành lý bị thất lạc tại sân bay quá cảnh.',
          },
        ],
      },
      {
        partnerMessage: 'All set! Your bags are checked through to San Francisco. Boarding starts at Gate 28 at 8:15 AM. Have a pleasant flight!',
        partnerAudioText: 'All set! Your bags are checked through to San Francisco. Boarding starts at Gate 28 at 8:15 AM. Have a pleasant flight!',
        suggestedResponses: [
          {
            id: 'ap-s5-r1',
            text: 'Thank you very much for your wonderful assistance! Have a fantastic day ahead!',
            translation: 'Cảm ơn bạn rất nhiều vì sự hỗ trợ tuyệt vời! Chúc bạn một ngày làm việc thật vui vẻ!',
            isPoliteAndEffective: true,
            feedback: 'Lời cảm ơn nồng ấm tạo thiện cảm tốt đẹp với nhân viên sân bay.',
          },
          {
            id: 'ap-s5-r2',
            text: 'Okay, whatever.',
            translation: 'Được rồi, sao cũng được.',
            isPoliteAndEffective: false,
            feedback: 'Thái độ lạnh lùng không cần thiết.',
          },
        ],
      },
    ],
  },
];
`;

const targetFile = path.resolve(__dirname, '../src/lib/data/practice.ts');
fs.writeFileSync(targetFile, practiceData, 'utf-8');
console.log('Successfully wrote expanded practice.ts!');

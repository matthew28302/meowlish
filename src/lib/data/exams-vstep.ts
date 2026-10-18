import { ExamSet } from './exams';

// ============================================================================
// BỘ ĐỀ VSTEP.3-5 (bậc 3-5, tương đương B1-B2-C1) — ĐỀ THI MẪU CHÍNH THỨC
// Nguồn: đề thi mẫu VSTEP SAMPLE TEST (LEVEL 3-5) — bản chính thức có đáp án.
// Gồm: Reading 4 passages × 10 câu (40 câu trắc nghiệm, chấm điểm, đáp án chuẩn),
//       Writing 2 tasks, Speaking 3 parts (không chấm điểm trắc nghiệm).
// ============================================================================

// ===== ĐOẠN VĂN ĐỌC HIỂU (nguyên văn, đã sửa lỗi tách chữ của bản PDF) =====

const PASSAGE_1 = `The Native American peoples of the north Pacific Coast created a highly complex maritime culture as they invented modes of production unique to their special environment. In addition to their sophisticated technical culture, they also attained one of the most complex social organizations of any nonagricultural people in the world.

In a division of labor similar to that of the hunting peoples in the interior and among foraging peoples throughout the world, the men did most of the fishing, and the women processed the catch. Women also specialized in the gathering of the abundant shellfish that lived closer to shore. They collected oysters, crabs, sea urchins, mussels, abalone, and clams, which they could gather while remaining close to their children. The maritime life harvested by the women not only provided food, but also supplied more of the raw materials for making tools than did fish gathered by the men.

The women used their tools to process all of the fish and marine mammals brought in by the men. They cleaned the fish, and dried vast quantities of them for the winter. They sun-dried fish when practical, but in the rainy climate of the coastal area they also used smokehouses to preserve tons of fish and other seafood annually. Each product had its own peculiar characteristics that demanded a particular way of cutting or drying the meat, and each task required its own cutting blades and other utensils.

After drying the fish, the women pounded some of them into fish meal, which was an easily transported food used in soups, stews, or other dishes to provide protein and thickening in the absence of fresh fish or while on long trips. The women also made a cheese-like substance from a mixture of fish and roe by aging it in storehouses or by burying it in wooden boxes or pits lined with rocks and tree leaves.`;

const PASSAGE_2 = `“He’ll be in soon for this,” thought Mrs Bland, who ran the village shop, putting on her glasses to examine the envelope more closely. Every Friday, for over a year, she’d received a letter addressed to Mr Smith. She hadn’t, at first, objected when he asked if his post might be sent care of her address. After all, he was new to the village and she liked to oblige people, especially a customer. He’d taken a cottage, he’d explained, a couple of kilometres out of the village and wanted to be sure of getting his letters regularly. So she’d agreed. There seemed no harm in it.

He hadn’t been so odd, either, in those first few weeks; a bit untidy, admittedly, and apparently rather shy, but anyone could tell he came from a good background; he was well spoken and polite. There had been gossip about him among the locals, of course. Where had he come from and why had he chosen to live in Stokes Cottage? It had been empty for two years because nobody wanted to live up that lane, far from the main road. The villagers came to the conclusion that the newcomer was from London and had been ill or, more likely, unlucky in love. He had the withdrawn, faded look of illness or disappointment.

As the months passed, however, Mrs Bland became less sure of her decision. With time, he became even less talkative. He would stand silently in the shop, looking out of the window, running his hands through his increasingly long and untidy-looking beard, if another customer was being served. Nobody could draw him into conversation, let alone find out anything about him, and in the end people gave up trying. Some of them complained that he made them feel uneasy and avoided coming into the shop while he was there. But, as Mrs Bland said to them, what could she do? He only came in once a week, on a Friday morning, and she couldn’t refuse to serve him on the grounds that he wasn’t sociable. “Besides,” she added to herself, “I can’t start turning people away for no reason.”

She wondered about him, though, and every week looked at the envelope, hoping to find out something. She’d decided that it must contain money, although she couldn’t be sure because it was never opened in her presence and even her most inquisitive customers hadn’t dared to question him about it. There was clearly something thin and flat inside anyway. The London postmark never varied, and the typewritten address gave no clue as to the sender.

A storm had broken that Friday morning. Mrs Bland had run to put down newspapers to save the flooring tiles from the worst of the wet and mud, and that’s when she saw him coming. He was trudging along with his head bent against the downpour. When Smith entered the shop, Mrs Bland felt the need to begin a conversation immediately, although she knew he would not respond.

“Good morning, Mr Smith. What dreadful weather we’re having. Your letter’s come.”

“Yes,” said Smith. He took the envelope and put it, without looking at it, into his inside pocket, handing her in exchange the shopping list he always had prepared.

She read through the list of items, saying each one aloud as she fetched it from the shelf and entered the price in the till. She liked talking. Even when alone, she chatted to herself in her head, but she was afraid of serious conversations. She left that sort of thing to her husband, who was clever with words and sometimes alarmed her with the force of his opinions. You had to be so careful what you said to people in a shop. She would have hated to cause offence, so she limited herself to pleasant chat that said little and harmed nobody. And when Smith was in the shop, she didn’t notice his silence so much if she talked, but her thoughts ran alongside her speech, deeper and less comfortable.`;

const PASSAGE_3 = `Many trees in the Brackham area were brought down in the terrible storms that March. The town itself lost two great lime trees from the former market square. The disappearance of such prominent features had altered the appearance of the town center entirely, to the annoyance of its more conservative inhabitants.

Among the annoyed, under more normal circumstances, would have been Chief Inspector Douglas Pelham, head of the local police force. But at the height of that week’s storm, when the wind brought down even the mature walnut tree in his garden, Pelham had in fact been in no fit state to notice. A large and healthy man, he had for the first time in his life been seriously ill with an attack of bronchitis.

When he first complained of an aching head and tightness in his chest, his wife, Molly, had tried to persuade him to go to the doctor. Convinced that the police force could not do without him, he had, as usual, ignored her and attempted to carry on working. Predictably, though he wouldn’t have listened to anyone who tried to tell him so, this had the effect of fogging his memory and shortening his temper.

It was only when his colleague, Sergeant Lloyd, took the initiative and drove him to the doctor’s door that he finally gave in. By that time, he didn’t have strength left to argue with her. In no time at all, she was taking him along to the chemist’s to get his prescribed antibiotics and then home to his unsurprised wife who sent him straight to bed.

When Molly told him, on the Thursday morning, that the walnut tree had been brought down during the night, Pelham hadn’t been able to take it in. On Thursday evening, he had asked weakly about the damage to the house, groaned thankfully when he heard there was none, and pulled the sheets over his head.

It wasn’t until Saturday, when the antibiotics took effect, his temperature dropped and he got up, that he realised with a shock that the loss of the walnut tree had made a permanent difference to the appearance of the living room. The Pelhams’ large house stood in a sizeable garden. It had not come cheap, but even so Pelham had no regrets about buying it. The leafy garden had created an impression of privacy. Now, though, the storm had changed his outlook.

Previously, the view from the living room had featured the handsome walnut tree. This had not darkened the room because there was also a window on the opposite wall, but it had provided interesting patterns of lights and shade that disguised the true state of the worn furniture that the family had brought with them from their previous house.

With the tree gone, the room seemed cruelly bright, its worn furnishings exposed in all their shabbiness. And the view from the window didn’t bear looking at. The tall house next door, previously hidden by the tree, was now there, dominating the outlook with its unattractive purple bricks and external pipes. It seemed to have a great many upstairs windows, all of them watching the Pelhams’ every movement.

“Doesn’t it look terrible?” Pelham croaked to his wife. But Molly, standing in the doorway, sounded more pleased than dismayed. “That’s what I’ve been telling you ever since we came here. We have to buy a new sofa, whatever it costs.”`;

const PASSAGE_4 = `1. Most people consider the landscape to be unchanging, but Earth is a dynamic body, and its surface is continually altering — slowly on the human time scale, but relatively rapidly when compared to the great age of Earth (about 4.5 billion years). There are two principal influences that shape the terrain: constructive processes such as uplift, which create new landscape features, and destructive forces such as erosion, which gradually wear away exposed landforms.

2. Hills and mountains are often regarded as the epitome of permanence, successfully resisting the destructive forces of nature, but in fact they tend to be relatively short-lived in geological terms. As a general rule, the higher a mountain is, the more recently it was formed; for example, the high mountains of the Himalayas are only about 50 million years old. Lower mountains tend to be older, and are often the eroded relics of much higher mountain chains. About 400 million years ago, when the present-day continents of North America and Europe were joined, the Caledonian mountain chain was the same size as the modern Himalayas. Today, however, the relics of the Caledonian orogeny (mountain-building period) exist as the comparatively low mountains of Greenland, the northern Appalachians in the United States, the Scottish Highlands, and the Norwegian coastal plateau.

3. The Earth’s crust is thought to be divided into huge, movable segments, called plates, which float on a soft plastic layer of rock. Some mountains were formed as a result of these plates crashing into each other and forcing up the rock at the plate margins. In this process, sedimentary rocks that originally formed on the seabed may be folded upwards to altitudes of more than 26,000 feet. Other mountains may be raised by earthquakes, which fracture the Earth’s crust and can displace enough rock to produce block mountains. A third type of mountain may be formed as a result of volcanic activity which occurs in regions of active fold mountain belts, such as in the Cascade Range of western North America. The Cascades are made up of lavas and volcanic materials. Many of the peaks are extinct volcanoes.

4. Whatever the reason for mountain formation, as soon as land rises above sea level it is subjected to destructive forces. The exposed rocks are attacked by the various weather processes and gradually broken down into fragments, which are then carried away and later deposited as sediments. Thus, any landscape represents only a temporary stage in the continuous battle between the forces of uplift and those of erosion.

5. The weather, in its many forms, is the main agent of erosion. Rain washes away loose soil and penetrates cracks in the rocks. Carbon dioxide in the air reacts with the rainwater, forming a weak acid (carbonic acid) that may chemically attack the rocks. The rain seeps underground and the water may reappear later as springs. These springs are the sources of streams and rivers, which cut through the rocks and carry away debris from the mountains to the lowlands.

6. Under very cold conditions, rocks can be shattered by ice and frost. Glaciers may form in permanently cold areas, and these slowly moving masses of ice cut out valleys, carrying with them huge quantities of eroded rock debris. [A] In dry areas the wind is the principal agent of erosion. [B] It carries fine particles of sand, which bombard exposed rock surfaces, thereby wearing them into yet more sand. [C] Even living things contribute to the formation of landscapes. [D] Tree roots force their way into cracks in rocks and, in so doing, speed their splitting. In contrast, the roots of grasses and other small plants may help to hold loose soil fragments together, thereby helping to prevent erosion by the wind.`;

export const VSTEP_SAMPLE_SET: ExamSet = {
  id: 'exam-vstep-sample-official',
  title: 'VSTEP.3-5 Sample Test (Listening, Reading, Writing, Speaking)',
  vietnameseTitle: 'Đề Thi 21: VSTEP.3-5 - Đề Thi Mẫu Chính Thức (Nghe・Đọc・Viết・Nói)',
  category: 'vstep',
  categoryLabel: '🇻🇳 VSTEP Chuẩn BGD',
  level: 'B1 - B2',
  durationMinutes: 170,
  passingScore: 60,
  expReward: 1400,
  coinReward: 1700,
  badgeIcon: '🇻🇳',
  summary:
    'Đề thi mẫu VSTEP.3-5 chính thức, đủ 4 kỹ năng: Nghe 35 câu với audio chính thức (~40 phút, 3 phần: thông báo ngắn, hội thoại, bài giảng) + Đọc hiểu 40 câu + Viết 2 bài (email ≥120 từ và luận ≥250 từ) + Nói 3 phần. Luyện đúng định dạng thi thật.',
  questions: [
    // ===== LISTENING - PART ONE (Câu 1-8): 8 short announcements =====
    {
      id: 'q21-l1',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'Where is the flight travelling?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['From Spain to Ireland', 'From Iceland to Spain', 'From Spain to Iceland', 'From Ireland to Spain'],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — from Spain to Ireland. Đáp án nhiễu tráo chỗ các địa danh và thêm “Iceland” gần âm với “Ireland”.',
      pedagogicalTip:
        'Khi nghe thông báo sân bay, ghi ngay sơ đồ “FROM → TO” theo đúng thứ tự nghe được để không bị lẫn hướng bay.',
    },
    {
      id: 'q21-l2',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'What does the teacher want the students to do?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'Take everything out of their desks',
        'Put the painting supplies in plastic bags',
        'Bring paints with them to school on Monday',
        'Put covers on their desks to keep the paint off',
      ],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D — phủ giấy lên bàn để sơn không dính bàn. Ba đáp án còn lại nhắc đến đồ dùng/thời hạn nhưng sai HÀNH ĐỘNG được yêu cầu.',
      pedagogicalTip:
        'Bẫy “trùng từ khóa”: đáp án nhiễu thường lặp lại danh từ vừa nghe (paints, plastic bags) — phải nghe trọn VỊ NGỮ của yêu cầu, không chọn theo một từ đơn lẻ.',
    },
    {
      id: 'q21-l3',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'What does the teacher want the students to do?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'Introduce themselves to the new student',
        'Welcome the new student',
        'Introduce the new student to the teaching staff',
        'Tell the new student what to learn',
      ],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — chào đón học sinh mới. Các đáp án khác đều chứa “new student” nên rất dễ chọn nhầm; khác biệt nằm ở ĐỘNG TỪ chính (introduce / welcome / tell).',
      pedagogicalTip:
        'Dạng câu hỏi “what does the teacher want”: so sánh động từ chính giữa các đáp án trước khi nghe — đó chính là điểm phân biệt.',
    },
    {
      id: 'q21-l4',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'What will the weather be like at the weekend?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['Hot and sunny', 'Cool and cloudy', 'Cool and rainy', 'Cold and snowy'],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — mát và nhiều mây. Bản tin thời tiết thường nói thời tiết các ngày khác trước khi đến cuối tuần — phải bám đúng MỐC THỜI GIAN trong câu hỏi.',
      pedagogicalTip:
        'Weather forecast: gạch chân mốc thời gian (at the weekend) trong đầu rồi chỉ “bật tai” ở đoạn tương ứng — thông tin nghe trước đó là của mốc khác.',
    },
    {
      id: 'q21-l5',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'What can be known about the woman?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['She’s been on television', 'She’s divorced', 'She’s just had a holiday', 'She’s having a baby'],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — cô ấy từng lên truyền hình. B/C/D là các thông tin bị bác bỏ hoặc không được xác nhận trong đoạn nói — phải nghe hết câu chuyện mới kết luận được.',
      pedagogicalTip:
        'Với câu “What can be known about…”, đừng vội chọn khi mới nghe nửa đầu — thông tin đúng thường xuất hiện sau các câu dẫn/nghi vấn.',
    },
    {
      id: 'q21-l6',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'What is the woman talking about?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'Investing in the Stock Exchange',
        'Starting up her own new company',
        'Having problems with her bank',
        'Expecting a promotion',
      ],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — đầu tư trên sàn chứng khoán. Ba đáp án còn lại là các chủ đề “họ hàng” (banking / company / career) rất dễ nhầm nếu chỉ nghe từ khóa.',
      pedagogicalTip:
        'Câu hỏi chủ đề (talking about): nghe động từ chuyên ngành — “invest, shares, stock” → chứng khoán; “start up, company” → khởi nghiệp.',
    },
    {
      id: 'q21-l7',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'What is done to cars that are NOT parked legally?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['They are fined', 'They are towed', 'They are ticketed', 'They are reparked'],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — bị cẩu xe đi (towed). Phân biệt fined (phạt tiền), ticketed (dán vé phạt) và towed (kéo xe) — ba đáp án rất sát nghĩa nên phải nghe chính xác động từ.',
      pedagogicalTip:
        'Nhóm từ hiểm: fine / ticket / tow / repark đều liên quan đến phạt bãi xe — học chính xác nghĩa động từ thay vì chỉ nắm chủ đề.',
    },
    {
      id: 'q21-l8',
      section: 'listening',
      sectionName: 'Listening - Part 1: Short Announcements (Câu 1-8)',
      question: 'On which day is the museum closed?',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['Sunday', 'Monday', 'Thursday', 'Friday'],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — thứ Hai. Thông báo cài nhiều ngày khác nhau cho các hoạt động khác nhau; phải nghe đúng ngữ cảnh “closed on …”.',
      pedagogicalTip:
        'Câu hỏi ngày tháng: ghi nhanh từng ngày kèm hoạt động đi kèm (open / closed / event) — đừng chọn theo tên thứ vừa nghe được.',
    },

    // ===== LISTENING - PART TWO (Câu 9-20): 3 conversations =====
    {
      id: 'q21-l9',
      section: 'listening',
      sectionName: 'Listening - Part 2: Radio Interview - Summer Course (Câu 9-12)',
      question: 'This year, the course will run for',
      contextSentence: 'You will hear a radio interview with the manager of a summer activity course. Choose the correct answer A, B, C or D for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['six weeks.', 'seven weeks.', 'eight weeks.', 'nine weeks.'],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — sáu tuần. Bẫy số liệu: người nói thường nhắc một số tuần khác cho năm ngoái/dự kiến trước khi chốt con số năm nay.',
      pedagogicalTip:
        'Câu hỏi số liệu: ghi nhanh TẤT CẢ con số nghe được kèm mốc thời gian (this year / last year), chốt đáp án sau khi nghe hết đoạn.',
    },
    {
      id: 'q21-l10',
      section: 'listening',
      sectionName: 'Listening - Part 2: Radio Interview - Summer Course (Câu 9-12)',
      question: 'This year, for the first time, children will',
      contextSentence: 'You will hear a radio interview with the manager of a summer activity course. Choose the correct answer A, B, C or D for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['do creative activities.', 'do new outdoor sports.', 'organise events.', 'go rock climbing.'],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — hoạt động sáng tạo. Cụm “for the first time” báo hiệu thông tin MỚI so với trước — đây là điểm nghe quyết định.',
      pedagogicalTip:
        'Khi nghe “for the first time / this year / from now on”, đó gần như luôn là câu chứa đáp án cho câu hỏi về thay đổi mới.',
    },
    {
      id: 'q21-l11',
      section: 'listening',
      sectionName: 'Listening - Part 2: Radio Interview - Summer Course (Câu 9-12)',
      question: 'The course isn’t open to teenagers because Molly thinks that',
      contextSentence: 'You will hear a radio interview with the manager of a summer activity course. Choose the correct answer A, B, C or D for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'they aren’t interested in the activities which are available.',
        'they should spend time with young people of a similar age.',
        'teenagers are difficult to please.',
        'they should do something more creative.',
      ],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — các em nên ở cùng nhóm bạn đồng trang lứa. Ba đáp án còn lại là “định kiến về tuổi teen” được cài làm phương án nhiễu.',
      pedagogicalTip:
        'Câu hỏi “because Molly thinks”: chú ý tên người trong câu hỏi — lời của người khác trong hội thoại có thể là đáp án nhiễu.',
    },
    {
      id: 'q21-l12',
      section: 'listening',
      sectionName: 'Listening - Part 2: Radio Interview - Summer Course (Câu 9-12)',
      question: 'It’s important that parents of children attending the course',
      contextSentence: 'You will hear a radio interview with the manager of a summer activity course. Choose the correct answer A, B, C or D for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'pay the full amount immediately.',
        'get the application form from the office.',
        'choose the activities the child wants to do when they apply.',
        'inform Molly about any food the child cannot eat.',
      ],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D — báo trước về món ăn trẻ không ăn được (dị ứng/kiêng khem). A/B/C là các bước hành chính nhưng không phải “điều quan trọng” được nhấn mạnh.',
      pedagogicalTip:
        'Câu hỏi về điều “quan trọng/cần thiết”: nghe kỹ các câu nhấn mạnh “it’s important that / make sure / don’t forget”.',
    },
    {
      id: 'q21-l13',
      section: 'listening',
      sectionName: 'Listening - Part 2: Student & Campus Patrolman (Câu 13-16)',
      question: 'What initiated this conversation?',
      contextSentence: 'Listen to a conversation between a student and a campus patrolman. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['A request for directions', 'A parking infraction', 'A punctured tire', 'A search for a dealer'],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — vi phạm đỗ xe. Đoạn mở đầu hội thoại quyết định câu này; C/D là các chi tiết phụ có thể được nhắc về sau.',
      pedagogicalTip:
        'Câu hỏi mở đầu (what initiated): tập trung vào những giây đầu tiên — lý do cuộc nói chuyện bắt đầu.',
    },
    {
      id: 'q21-l14',
      section: 'listening',
      sectionName: 'Listening - Part 2: Student & Campus Patrolman (Câu 13-16)',
      question: 'What did the young woman do during her last holiday?',
      contextSentence: 'Listen to a conversation between a student and a campus patrolman. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['Apply for a scholarship', 'Work part-time to earn money', 'Explore the campus', 'Take a long trip'],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D — đi một chuyến dài ngày. (Bản gốc in nhầm “his” — bản số hoá sửa thành “her” cho đúng nhân vật.)',
      pedagogicalTip:
        'Nghe câu hỏi kèm mốc thời gian (during her last holiday) — thông tin phải khớp CẢ hành động lẫn thời điểm.',
    },
    {
      id: 'q21-l15',
      section: 'listening',
      sectionName: 'Listening - Part 2: Student & Campus Patrolman (Câu 13-16)',
      question: 'What does she need to get a sticker?',
      contextSentence: 'Listen to a conversation between a student and a campus patrolman. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'Her student identification card',
        'Her driver’s license',
        'Permission from the Student Union',
        'A class in a main building',
      ],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — thẻ sinh viên. B/C/D là các loại giấy tờ/sự cho phép được nhắc tới nhưng không dùng để lấy sticker.',
      pedagogicalTip:
        'Câu hỏi “what does she need”: ghi nhanh danh sách giấy tờ nghe được kèm mục đích của từng loại.',
    },
    {
      id: 'q21-l16',
      section: 'listening',
      sectionName: 'Listening - Part 2: Student & Campus Patrolman (Câu 13-16)',
      question: 'Where will the young woman go next?',
      contextSentence: 'Listen to a conversation between a student and a campus patrolman. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['The Campus Affairs Office', 'Cross-country', 'Wheels Within Wheels', 'The Student Union'],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — Campus Affairs Office. Địa điểm đúng là nơi được nhắc CUỐI CÙNG; các đáp án khác là nơi cô đã đến hoặc được gợi ý nhưng không phải điểm tiếp theo.',
      pedagogicalTip:
        'Câu hỏi “go next”: bám từ nối cuối đoạn (so / then / now) — điểm đến tiếp theo luôn xuất hiện sát cuối hội thoại.',
    },
    {
      id: 'q21-l17',
      section: 'listening',
      sectionName: 'Listening - Part 2: Father & Daughter - Driving (Câu 17-20)',
      question: 'Why is the girl excited at the beginning of the conversation?',
      contextSentence: 'Listen to the conversation between a father and his daughter. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'She has just started driver’s education classes at school.',
        'She is taking her driver’s license road test today.',
        'She has her license and wants to drive now.',
        'She has just passed her driving test.',
      ],
      correctIndex: 2,
      explanation:
        'Đáp án chuẩn (key chính thức): C. Bẫy: “just passed the test” (D) nghe hợp lý nhưng cô đã có bằng từ trước và háo hức muốn LÁI ngay.',
      pedagogicalTip:
        'Câu hỏi cảm xúc (why excited): phân biệt sự việc đã xảy ra TRƯỚC ĐÓ với lý do của cảm xúc ở hiện tại.',
    },
    {
      id: 'q21-l18',
      section: 'listening',
      sectionName: 'Listening - Part 2: Father & Daughter - Driving (Câu 17-20)',
      question: 'Which statement is an example of why the father created rule number 1?',
      contextSentence: 'Listen to the conversation between a father and his daughter. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'Young drivers sometimes drink and drive.',
        'Teenagers often drive at high speeds.',
        'Some kids drive before obtaining a license.',
        'Teenagers usually enjoy driving overnight.',
      ],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — lái quá tốc độ. Câu hỏi yêu cầu chọn VÍ DỤ minh hoạ cho lý do của quy tắc số 1 — phải nghe cả quy tắc lẫn lời giải thích của bố.',
      pedagogicalTip:
        'Câu hỏi “which statement is an example of”: ghép quy tắc (rule number 1) với lý do được bố nói ngay sau đó.',
    },
    {
      id: 'q21-l19',
      section: 'listening',
      sectionName: 'Listening - Part 2: Father & Daughter - Driving (Câu 17-20)',
      question: 'Why does the father ask the daughter not to drive at night?',
      contextSentence: 'Listen to the conversation between a father and his daughter. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'The roads tend to become icy and slippery.',
        'It is more difficult to see obstacles in the road.',
        'She might be attacked by bullies.',
        'She might fall asleep at the wheel.',
      ],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D — có thể ngủ gật khi lái. A/B/C là các nguy cơ hợp lý ngoài đời nhưng không phải lý do người bố nêu trong hội thoại.',
      pedagogicalTip:
        'Cẩn thận “đáp án đúng ngoài đời”: nhiều phương án nghe rất hợp lý nhưng chỉ phương án được NÓI RA mới tính điểm.',
    },
    {
      id: 'q21-l20',
      section: 'listening',
      sectionName: 'Listening - Part 2: Father & Daughter - Driving (Câu 17-20)',
      question: 'How does the conversation end?',
      contextSentence: 'Listen to the conversation between a father and his daughter. Choose the correct answer for each question.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'The father and daughter get in a big argument.',
        'The father agrees to let his daughter drive the car.',
        'The mother decides to drive the daughter to school.',
        'The girl has to fill up the car with gas before going out.',
      ],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — bố đồng ý để con gái lái xe. Câu hỏi về kết thúc hội thoại: thường có “bước ngoặt” ở cuối (sau khi bố nêu các quy tắc, ông nhượng bộ).',
      pedagogicalTip:
        'Câu hỏi “how does it end”: luôn nghe đến hết — đừng chọn theo cao trào ở giữa (cuộc tranh luận về các quy tắc).',
    },

    // ===== LISTENING - PART THREE (Câu 21-35): 3 lectures =====
    {
      id: 'q21-l21',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Pulp Fiction (Câu 21-25)',
      question: 'What does the lecture mainly focus on?',
      contextSentence: 'Part 3 — Bài giảng 1/3: lịch sử tạp chí pulp fiction “The Black Mask”. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'a magazine called The Black Mask',
        'the history of pulp fiction in America',
        'the writers Carroll John Daly and Dashiell Hammett',
        'great American detectives',
      ],
      correctIndex: 2,
      explanation:
        'Đáp án chuẩn (key chính thức): C — hai nhà văn Daly và Hammett. A quá hẹp (chỉ là bối cảnh), B quá rộng so với nội dung bài; D không được nhấn mạnh.',
      pedagogicalTip:
        'Câu hỏi main idea: loại đáp án chỉ là CHI TIẾT phụ (A) và đáp án quá KHÁI QUÁT so với bài (B) — chọn đáp án bao đúng phạm vi bài giảng.',
    },
    {
      id: 'q21-l22',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Pulp Fiction (Câu 21-25)',
      question: 'What is not mentioned about The Black Mask?',
      contextSentence: 'Part 3 — Bài giảng 1/3: lịch sử tạp chí pulp fiction “The Black Mask”. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['It was 128-pages long.', 'It started to sell in 1920.', 'It published formula writing.', 'It had no illustrations.'],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D. Câu hỏi NOT mentioned yêu cầu đối chiếu TẤT CẢ thông tin — ba đáp án A/B/C đều được nhắc trong bài, riêng D không xuất hiện.',
      pedagogicalTip:
        'Dạng NOT mentioned: ghi nhanh các số liệu/đặc điểm vừa nghe — đáp án “không được nhắc” là cái KHÔNG có trong danh sách của bạn.',
    },
    {
      id: 'q21-l23',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Pulp Fiction (Câu 21-25)',
      question: 'According to the lecture, what was Peter Collinson’s real name?',
      contextSentence: 'Part 3 — Bài giảng 1/3: lịch sử tạp chí pulp fiction “The Black Mask”. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['Carroll John Daly', 'Dashiell Daly', 'Peter Hammett', 'Dashiell Hammett'],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D — Dashiell Hammett. “Peter Collinson” là bút danh (pseudonym) của Hammett; đề tráo tên hai nhà văn nên phải nghe chính xác câu nói về bút danh.',
      pedagogicalTip:
        'Khi nghe “real name / pseudonym / pen name” — đó chính là câu hỏi; chú ý ngay để ghi đúng tên người.',
    },
    {
      id: 'q21-l24',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Pulp Fiction (Câu 21-25)',
      question:
        'Why does the professor say this: “By 1923, Hammett had been around the block and then some, whereas Daly never left his house.”?',
      contextSentence: 'Part 3 — Bài giảng 1/3: lịch sử tạp chí pulp fiction “The Black Mask”. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'to identify each writer’s influences',
        'to illustrate that Hammett had more life experience than Daly',
        'to illustrate that Hammett lived a block from Daly’s house',
        'to describe what Hammett and Daly were doing in 1923',
      ],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — Hammett từng trải hơn Daly. Thành ngữ “have been around the block” = đã trải đời; C hiểu sai thành “cách nhà một dãy” (bẫy thành ngữ).',
      pedagogicalTip:
        'Câu hỏi “why does the professor say this”: học thành ngữ là chìa khoá — “around the block” = từng trải, không phải địa chỉ nhà.',
    },
    {
      id: 'q21-l25',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Pulp Fiction (Câu 21-25)',
      question: 'When were Three Gun Terry and Arson Plus published in The Black Mask?',
      contextSentence: 'Part 3 — Bài giảng 1/3: lịch sử tạp chí pulp fiction “The Black Mask”. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: ['In 1989.', 'In 1894.', 'In 1915.', 'In 1923.'],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D — năm 1923. Bốn mốc thời gian đều có thể được nhắc ở các sự kiện khác nhau trong bài; phải gắn đúng mốc với hai tác phẩm được hỏi.',
      pedagogicalTip:
        'Câu hỏi năm: vừa nghe tên tác phẩm vừa ghi năm đi kèm ngay — các năm khác trong đáp án là mốc của sự kiện khác.',
    },
    {
      id: 'q21-l26',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Supreme Court & Elections (Câu 26-30)',
      question: 'What is the lecture mainly about?',
      contextSentence: 'Part 3 — Bài giảng 2/3: phán quyết của Tòa án Tối cao Hoa Kỳ và bộ phim tài liệu chính trị. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'a movie maker named Michael Moore',
        'a politician named David Bossie',
        'a U.S. Supreme Court ruling',
        'a decision by the Elections Commission',
      ],
      correctIndex: 2,
      explanation:
        'Đáp án chuẩn (key chính thức): C — phán quyết của Tòa án Tối cao. A/B là các nhân vật/vai trò phụ; D không phải trọng tâm.',
      pedagogicalTip:
        'Main idea: đáp án đúng thường là sự kiện trung tâm được nhắc lại nhiều lần trong bài, không phải tên người xuất hiện ở một câu.',
    },
    {
      id: 'q21-l27',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Supreme Court & Elections (Câu 26-30)',
      question: 'What does the professor say about Hillary: The Movie?',
      contextSentence: 'Part 3 — Bài giảng 2/3: phán quyết của Tòa án Tối cao Hoa Kỳ và bộ phim tài liệu chính trị. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'It won an Oscar for best documentary.',
        'It is a 90-minute political attack ad.',
        'It helped raise millions for Mrs. Clinton.',
        'It was made by Michael Moore.',
      ],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — quảng cáo chính trị công kích dài 90 phút. A/D sai về giải thưởng và tác giả; C đảo ngược mục đích của phim.',
      pedagogicalTip:
        'Câu hỏi chi tiết (what does the professor say about X): ưu tiên nghe phần mô tả trực tiếp X — các chi tiết khác trong đoạn dễ gây nhiễu.',
    },
    {
      id: 'q21-l28',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Supreme Court & Elections (Câu 26-30)',
      question: 'Why does the professor say this: “… and smoke is already on the horizon”?',
      contextSentence: 'Part 3 — Bài giảng 2/3: phán quyết của Tòa án Tối cao Hoa Kỳ và bộ phim tài liệu chính trị. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'to indicate that something is wrong in the U.S. Supreme Court',
        'to indicate how the Supreme Court’s ruling has angered Hillary Clinton',
        'to draw attention to how money can buy Supreme Court decisions',
        'to illustrate how the Court’s ruling is already creating controversy',
      ],
      correctIndex: 3,
      explanation:
        'Đáp án chuẩn (key chính thức): D — phán quyết đã gây tranh cãi ngay từ đầu. “Smoke on the horizon” là ẩn dụ: điềm báo vấn đề sắp nổi lên; A/C diễn giải quá xa.',
      pedagogicalTip:
        'Ẩn dụ thường được hỏi trong “why say this”: dịch nghĩa bóng trước (smoke = dấu hiệu rắc rối), tránh hiểu theo nghĩa đen.',
    },
    {
      id: 'q21-l29',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Supreme Court & Elections (Câu 26-30)',
      question: 'The professor mentions Ford. Why?',
      contextSentence: 'Part 3 — Bài giảng 2/3: phán quyết của Tòa án Tối cao Hoa Kỳ và bộ phim tài liệu chính trị. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'as an example of a corporation that could influence an election',
        'as an example of a famous company',
        'as an example of a supporter of a political candidate',
        'as a reason why the Supreme Court made the right decision',
      ],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — ví dụ về một tập đoàn có thể gây ảnh hưởng bầu cử. Ford được nêu làm minh hoạ cho luận điểm về sức mạnh tài chính của doanh nghiệp.',
      pedagogicalTip:
        'Câu hỏi “why does the professor mention X”: tìm LUẬN ĐIỂM ngay trước ví dụ đó — ví dụ tồn tại để chống đỡ ý vừa nêu.',
    },
    {
      id: 'q21-l30',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Supreme Court & Elections (Câu 26-30)',
      question:
        'Which is NOT mentioned by the professor about how the Supreme Court’s decision has changed the political landscape?',
      contextSentence: 'Part 3 — Bài giảng 2/3: phán quyết của Tòa án Tối cao Hoa Kỳ và bộ phim tài liệu chính trị. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'Corporations can now buy and sell political candidates.',
        'Candidate funding can come from foreign companies in the U.S.',
        'Corporations can now influence voting through candidate funding.',
        'A U.S. corporation is considered an individual with voting rights.',
      ],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A. “Buy and sell political candidates” là cách nói cường điệu không xuất hiện trong bài; B/C/D đều là các hệ quả được giảng viên nêu.',
      pedagogicalTip:
        'Câu hỏi NOT mentioned: đáp án sai thường nghe “hợp lý về logic” nhưng là phiên bản cường điệu của ý thật — phải nhớ mức độ chính xác của từng câu đã nghe.',
    },
    {
      id: 'q21-l31',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Handedness in Sport (Câu 31-35)',
      question: 'Anita first felt the Matthews article was of value when she realised',
      contextSentence: 'Part 3 — Bài giảng 3/3: nghiên cứu về thuận tay (handedness) trong thể thao. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'how it would help her difficulties with left-handedness.',
        'the relevance of connections he made with music.',
        'how his research is interesting.',
        'the impressive size of his research project.',
      ],
      correctIndex: 2,
      explanation:
        'Đáp án chuẩn (key chính thức): C. Bẫy từ gần nghĩa: “of value” ở đây gắn với cảm nhận hứng thú của Anita về nghiên cứu — không phải công dụng (A), liên hệ âm nhạc (B) hay quy mô dự án (D).',
      pedagogicalTip:
        'Câu hỏi thời điểm “first felt…”: nghe các trạng ngữ chỉ lần đầu (at first / initially) để bám đúng sự kiện.',
    },
    {
      id: 'q21-l32',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Handedness in Sport (Câu 31-35)',
      question: 'Anita feels that the findings on handedness will be of value in',
      contextSentence: 'Part 3 — Bài giảng 3/3: nghiên cứu về thuận tay (handedness) trong thể thao. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'helping sportspeople identify their weaknesses.',
        'aiding sportspeople as they plan tactics for each game.',
        'developing suitable training programmes for sportspeople.',
        'making sportspeople more confident.',
      ],
      correctIndex: 1,
      explanation:
        'Đáp án chuẩn (key chính thức): B — hỗ trợ VĐV hoạch định chiến thuật từng trận. A/C/D đều nghe hợp lý nhưng không phải ứng dụng Anita nêu.',
      pedagogicalTip:
        'Khi nhiều đáp án đều “hợp lý về chuyên môn”, phải chọn đúng từ được nói ra (tactics, each game) — nghe theo TỪ KHÓA CỤ THỂ, không theo suy luận.',
    },
    {
      id: 'q21-l33',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Handedness in Sport (Câu 31-35)',
      question: 'Anita feels that most sports coaches',
      contextSentence: 'Part 3 — Bài giảng 3/3: nghiên cứu về thuận tay (handedness) trong thể thao. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'know nothing about the influence of handedness.',
        'expect more from right-handed sportspeople.',
        'focus on the wrong aspects of performance.',
        'underestimate what science has to offer sport.',
      ],
      correctIndex: 2,
      explanation:
        'Đáp án chuẩn (key chính thức): C — các HLV đang tập trung sai khía cạnh của thành tích. A/D là các ý mạnh hơn thực tế (know nothing / underestimate) nên sai mức độ.',
      pedagogicalTip:
        'Bẫy mức độ: các đáp án dùng từ tuyệt đối (know nothing) thường sai khi bài chỉ nói một khía cạnh nào đó.',
    },
    {
      id: 'q21-l34',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Handedness in Sport (Câu 31-35)',
      question: 'A German study showed there was greater “mixed handedness” in musicians who',
      contextSentence: 'Part 3 — Bài giảng 3/3: nghiên cứu về thuận tay (handedness) trong thể thao. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'started playing instruments in early youth.',
        'play a string instrument such as the violin.',
        'practice a great deal on their instrument.',
        'play musical instruments frequently.',
      ],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A — bắt đầu chơi nhạc cụ từ sớm. Nghiên cứu liên hệ TUỔI BẮT ĐẦU học nhạc với mức độ “mixed handedness”; B/C/D là các yếu tố khác không được nêu.',
      pedagogicalTip:
        'Câu hỏi nghiên cứu: phân biệt ĐỐI TƯỢNG (who) và BIẾN SỐ được đo (tuổi bắt đầu, tần suất…) — đáp án phải khớp biến số được nói.',
    },
    {
      id: 'q21-l35',
      section: 'listening',
      sectionName: 'Listening - Part 3: Lecture - Handedness in Sport (Câu 31-35)',
      question: 'Studies on ape behavior show that',
      contextSentence: 'Part 3 — Bài giảng 3/3: nghiên cứu về thuận tay (handedness) trong thể thao. Chọn đáp án đúng A, B, C hoặc D.',
      audioUrl: '/audio/vstep-sample-listening.mp3',
      options: [
        'apes which always use the same hand to get food are most successful.',
        'apes have the same proportion of left-handers as humans.',
        'more apes are left-handed than right-handed.',
      ],
      correctIndex: 0,
      explanation:
        'Đáp án chuẩn (key chính thức): A. Lưu ý: bản in chính thức có lựa chọn D bị lỗi in ấn (cụt chữ) nên bản số hoá giữ 3 lựa chọn A/B/C nguyên bản — đáp án đúng không thay đổi.',
      pedagogicalTip:
        'Câu hỏi so sánh số liệu (same proportion / more…than): ghi nhanh tỉ lệ nghe được rồi so với phát biểu trong đáp án.',
    },

    // ===== READING - PASSAGE 1 (Câu 1-10) =====
    {
      id: 'q21-r1',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question:
        'Which aspect of the lives of the Native Americans of the north Pacific Coast does the passage mainly discuss?',
      readingPassage: PASSAGE_1,
      options: [
        'Methods of food preservation',
        'How diet was restricted by the environment',
        'The contributions of women to the food supply',
        'Difficulties in establishing successful farms',
      ],
      correctIndex: 2,
      explanation:
        'Ý chính: bài tập trung vào công việc của người phụ nữ — thu hoạch hải sản, chế biến cá, làm fish meal… và vai trò của họ với nguồn thực phẩm. A (bảo quản) chỉ là 1 phần; B, D không được nói tới.',
      pedagogicalTip:
        'Câu hỏi main idea: loại đáp án chỉ nói 1 chi tiết nhỏ (A) — chọn đáp án bao quát toàn bài (C).',
    },
    {
      id: 'q21-r2',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question: 'The word “unique” in paragraph 1 is closest in meaning to',
      readingPassage: PASSAGE_1,
      options: ['comprehensible', 'productive', 'intentional', 'particular'],
      correctIndex: 3,
      explanation:
        '“unique to their special environment” = đặc thù riêng cho môi trường sống của họ → particular (riêng biệt, cụ thể).',
      pedagogicalTip:
        'Từ vựng: unique ≈ particular ≈ distinctive. Đừng chọn “intentional” (cố ý) chỉ vì gần âm.',
    },
    {
      id: 'q21-r3',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question: 'The word “attained” in paragraph 1 is closest in meaning to',
      readingPassage: PASSAGE_1,
      options: ['achieved', 'modified', 'demanded', 'spread'],
      correctIndex: 0,
      explanation:
        '“they also attained one of the most complex social organizations” = họ đã ĐẠT ĐƯỢC một trong những tổ chức xã hội phức tạp nhất → achieved (đạt được).',
      pedagogicalTip: 'attain = achieve = reach (đạt được). Ghi nhớ cặp attain/achievement.',
    },
    {
      id: 'q21-r4',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question:
        'It can be inferred from paragraph 1 that the social organization of many agricultural peoples is',
      readingPassage: PASSAGE_1,
      options: [
        'more complex than that of hunters and foragers',
        'less efficient than that of hunters and foragers',
        'more widespread than that of hunters and foragers',
        'better documented than that of hunters and foragers',
      ],
      correctIndex: 0,
      explanation:
        'Câu gốc: người bản địa có “one of the most complex social organizations of any NONagricultural people” → ám chỉ dân nông nghiệp (agricultural) có tổ chức xã hội PHỨC TẠP HƠN nhóm săn bắt hải lượm.',
      pedagogicalTip:
        'Câu hỏi suy luận: so sánh “nonagricultural” ↔ “agricultural” — đọc kỹ tiền tố phủ định non-.',
    },
    {
      id: 'q21-r5',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question:
        'According to the passage, what is true of the “division of labour” mentioned in paragraph 2?',
      readingPassage: PASSAGE_1,
      options: [
        'It was first developed by Native Americans of the north Pacific Coast.',
        'It rarely existed among hunting peoples.',
        'It was a structure that the Native Americans of the north Pacific Coast shared with many other peoples.',
        'It provided a form of social organization that was found mainly among coastal peoples.',
      ],
      correctIndex: 2,
      explanation:
        '“In a division of labor SIMILAR TO that of the hunting peoples in the interior and among foraging peoples THROUGHOUT THE WORLD” → sự phân công lao động này giống với nhiều dân tộc khác (chia sẻ đặc điểm chung).',
      pedagogicalTip: 'Từ khóa “similar to … throughout the world” = điểm chung/được chia sẻ.',
    },
    {
      id: 'q21-r6',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question: 'The word “abundant” in paragraph 2 is closest in meaning to',
      readingPassage: PASSAGE_1,
      options: ['prosperous', 'plentiful', 'acceptable', 'fundamental'],
      correctIndex: 1,
      explanation: 'abundant = plentiful = nhiều, phong phú (“the abundant shellfish”).',
      pedagogicalTip: 'Học từ theo cụm: abundant seafood / abundant evidence — nghĩa “dồi dào”.',
    },
    {
      id: 'q21-r7',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question: 'All of the following are true of the north Pacific coast women EXCEPT that they',
      readingPassage: PASSAGE_1,
      options: [
        'were more likely to catch shellfish than other kinds of fish',
        'contributed more materials for tool making than the men did',
        'sometimes searched for food far inland from the coast',
        'prepared and preserved the fish',
      ],
      correctIndex: 2,
      explanation:
        'EXCEPT = chọn ý SAI. Bài nói phụ nữ thu hoạch shellfish “close to shore”, luôn ở gần con cái — KHÔNG đi xa bờ vào sâu trong đất liền (far inland) → C sai.',
      pedagogicalTip:
        'EXCEPT questions: kiểm tra từng đáp án theo bài, 3 đáp án đúng, 1 đáp án không được nói/trái bài.',
    },
    {
      id: 'q21-r8',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question: 'The Native Americans of the north Pacific Coast used smokehouses in order to',
      readingPassage: PASSAGE_1,
      options: [
        'store utensils used in food preparation',
        'prevent fish and shellfish from spoiling',
        'have a place to store fish and shellfish',
        'prepare elaborate meals',
      ],
      correctIndex: 1,
      explanation:
        '“they also used smokehouses to PRESERVE tons of fish” — preserve = giữ cho khỏi hỏng/ôi thiu → prevent … from spoiling (B), chứ không chỉ là kho chứa (C).',
      pedagogicalTip: 'Phân biệt preserve (bảo quản) ≠ store (cất trữ) — đọc đúng mục đích trong bài.',
    },
    {
      id: 'q21-r9',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question: 'The word “peculiar” in paragraph 3 is closest in meaning to',
      readingPassage: PASSAGE_1,
      options: ['strange', 'distinctive', 'appealing', 'biological'],
      correctIndex: 1,
      explanation:
        '“Each product had its own peculiar characteristics” = mỗi sản phẩm có đặc điểm RIÊNG → distinctive. “Strange” (lạ lùng) lệch nghĩa trong ngữ cảnh này.',
      pedagogicalTip: 'peculiar = đặc trưng/riêng có (không phải “kỳ quặc” khi đứng trước danh từ trung tính).',
    },
    {
      id: 'q21-r10',
      section: 'reading',
      sectionName: 'Reading - Passage 1: Người bản địa Bắc Mỹ (Câu 1-10)',
      question:
        'All of the following are true of the cheese-like substance mentioned in paragraph 4 EXCEPT that it was',
      readingPassage: PASSAGE_1,
      options: [
        'made from fish',
        'not actually cheese',
        'useful on long journeys',
        'made in a short period of time',
      ],
      correctIndex: 3,
      explanation:
        'Chất “giống phô mai” được làm bằng cách AGING (ủ lâu) trong storehouses hoặc chôn dưới hố — mất nhiều thời gian, KHÔNG phải làm nhanh (D sai). A: làm từ fish + roe ✓; B: cheese-like (không phải phô mai thật) ✓; C: fish meal dùng khi đi xa ✓.',
      pedagogicalTip: 'EXCEPT bài 4: để ý từ “aging/burying” (ủ/chôn) → thể hiện thời gian dài.',
    },
    // ===== READING - PASSAGE 2 (Câu 11-20) =====
    {
      id: 'q21-r11',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'How did Mrs Bland react when Mr Smith first asked her to keep his letters?',
      readingPassage: PASSAGE_2,
      options: [
        'She felt sorry for him.',
        'She was curious about him.',
        "She didn't mind helping.",
        "She wasn't sure what to do.",
      ],
      correctIndex: 2,
      explanation:
        '“she liked to oblige people, especially a customer… So she’d agreed. There seemed no harm in it.” → bà sẵn lòng giúp, không phiền gì.',
      pedagogicalTip: 'oblige = giúp đỡ, làm hài lòng — từ khóa trả lời cho câu hỏi thái độ.',
    },
    {
      id: 'q21-r12',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'The word “odd” in paragraph 2 is closest in meaning to',
      readingPassage: PASSAGE_2,
      options: ['familiar', 'usual', 'unusual', 'expected'],
      correctIndex: 2,
      explanation:
        '“He hadn’t been SO odd, either, in those first few weeks” — trong mạch “chưa kỳ lạ đến thế” → odd = unusual (khác thường).',
      pedagogicalTip: 'odd = strange = unusual. Ba từ còn lại đều là “bình thường, quen thuộc” → loại.',
    },
    {
      id: 'q21-r13',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'In the second paragraph, we learn that the local people were',
      readingPassage: PASSAGE_2,
      options: [
        "amused by Mr Smith's shyness.",
        "convinced of Mr Smith's unhappiness.",
        "impressed by Mr Smith's physical appearance.",
        "worried by Mr Smith's odd behaviour.",
      ],
      correctIndex: 1,
      explanation:
        '“The villagers came to the conclusion that the newcomer was from London and had been ill or, MORE LIKELY, UNLUCKY IN LOVE. He had the withdrawn, faded look of illness or disappointment.” → họ tin rằng ông ấy bất hạnh (unlucky in love).',
      pedagogicalTip:
        '“came to the conclusion” + “more likely” = nhận định chắc chắn của dân làng → convinced.',
    },
    {
      id: 'q21-r14',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: "Why did Mrs Bland's attitude to Mr Smith begin to change?",
      readingPassage: PASSAGE_2,
      options: [
        'He appeared at the shop at increasingly inconvenient times.',
        'He answered her questions impolitely.',
        'His appearance alarmed some customers.',
        'He no longer made any effort to communicate.',
      ],
      correctIndex: 3,
      explanation:
        '“With time, he became even less talkative… Nobody could draw him into conversation…” → ông Smith không còn cố gắng trò chuyện nữa.',
      pedagogicalTip: 'Cảnh giác đáp án “một nửa đúng”: C đúng là khách khó chịu, nhưng lý do thay đổi thái độ là sự im lặng của Smith.',
    },
    {
      id: 'q21-r15',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'What does “in the end” in paragraph 3 mean?',
      readingPassage: PASSAGE_2,
      options: ['initially', 'finally', 'meanwhile', 'at the same time'],
      correctIndex: 1,
      explanation: '“and in the end people gave up trying” = cuối cùng mọi người bỏ cuộc → finally (cuối cùng).',
      pedagogicalTip: 'Cụm chỉ thời gian: in the end = finally/eventually ≠ at the end (ở cuối vị trí).',
    },
    {
      id: 'q21-r16',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'How did Mrs Bland respond to people who talked about Mr Smith?',
      readingPassage: PASSAGE_2,
      options: [
        'She agreed with their point of view.',
        'She apologised for his behaviour.',
        'She pointed out his right to shop there.',
        'She explained that he was a valuable customer.',
      ],
      correctIndex: 2,
      explanation:
        '“But, as Mrs Bland said to them, what could she do?… she couldn’t refuse to serve him… ‘I can’t start turning people away for no reason.’” → bà nhấn mạnh ông có quyền được phục vụ ở cửa hàng.',
      pedagogicalTip: 'Câu hỏi “respond to people” — tìm lời bà Bland nói với khách, không phải suy nghĩ nội tâm.',
    },
    {
      id: 'q21-r17',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'What gave Mrs Bland the idea that the letters might contain money?',
      readingPassage: PASSAGE_2,
      options: [
        "the fact that the sender's name was not shown",
        'the way the envelopes looked',
        'the fact that they came so regularly',
        'the secretive way in which Mr Smith handled them',
      ],
      correctIndex: 1,
      explanation:
        '“There was clearly something thin and flat inside anyway.” — bà nhận ra qua CẢM GIÁC/KÍCH THƯỚC của phong bì (mỏng và phẳng) → cách phong bì trông/thấy như thế nào.',
      pedagogicalTip:
        'Câu hỏi chi tiết: manh mối “thin and flat inside” mô tả vật lý của phong bì → chọn B.',
    },
    {
      id: 'q21-r18',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'What does the word “trudging” in paragraph 5 tell us about Mr Smith?',
      readingPassage: PASSAGE_2,
      options: ['how he was moving', 'his facial expression', 'how he was dressed', 'his physical size'],
      correctIndex: 0,
      explanation:
        '“He was trudging along with his head bent against the downpour.” — trudging = bước đi nặng nề, mệt nhọc → mô tả CÁCH DI CHUYỂN.',
      pedagogicalTip: 'trudge = walk heavily/slowly — động từ chỉ dáng đi, không phải ngoại hình.',
    },
    {
      id: 'q21-r19',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question:
        'In the sentence “She read through the list of items, saying each one aloud as she fetched IT from the shelf…”, what does “it” refer to?',
      readingPassage: PASSAGE_2,
      options: ['the list', 'the weekly letter', 'a price', 'a product'],
      correctIndex: 3,
      explanation:
        '“each one” (từng món trong danh sách) → “fetched IT from the shelf” = lấy TỪNG MÓN HÀNG từ giá → it = a product (một sản phẩm).',
      pedagogicalTip: 'Đại từ tham chiếu: tìm danh từ gần nhất hợp nghĩa — “each one (of the items)” → product.',
    },
    {
      id: 'q21-r20',
      section: 'reading',
      sectionName: 'Reading - Passage 2: Truyện ngắn - Ông Smith bí ẩn (Câu 11-20)',
      question: 'What do we learn about Mrs Bland in the final paragraph?',
      readingPassage: PASSAGE_2,
      options: [
        'She found her work unsatisfying.',
        'She was frightened of her husband.',
        'She worried about upsetting her customers.',
        'She found it hard to understand people.',
      ],
      correctIndex: 2,
      explanation:
        '“She would have hated to cause offence, so she limited herself to pleasant chat…” → bà lo sẽ làm khách phật lòng (upset) nên chỉ nói chuyện vô hại.',
      pedagogicalTip: '“hated to cause offence” = sợ gây phật lòng → worried about upsetting customers.',
    },
    // ===== READING - PASSAGE 3 (Câu 21-30) =====
    {
      id: 'q21-r21',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'Why were some people in Brackham annoyed after the storm?',
      readingPassage: PASSAGE_3,
      options: [
        'The town looked different.',
        'The police had done little to help.',
        'No market could be held.',
        'Fallen trees had not been removed.',
      ],
      correctIndex: 0,
      explanation:
        '“The disappearance of such prominent features had altered the appearance of the town center entirely, to the annoyance of its more conservative inhabitants.” → thị trấn trông khác đi (mất 2 cây chanh lớn).',
      pedagogicalTip: 'Câu hỏi why: ghi chú cụm “to the annoyance of” — phía trước nó chính là nguyên nhân.',
    },
    {
      id: 'q21-r22',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question:
        'In the third paragraph, what do we learn about Chief Inspector Pelham’s general attitude to his work?',
      readingPassage: PASSAGE_3,
      options: [
        'He finds it extremely annoying.',
        'He is sure that he fulfils a vital role.',
        'He considers the systems are not clear enough.',
        'He does not trust the decisions made by his superiors.',
      ],
      correctIndex: 1,
      explanation:
        '“Convinced that the police force could not do without him, he had, as usual, ignored her and attempted to carry on working.” → ông tin mình đóng vai trò thiết yếu (vital role).',
      pedagogicalTip: '“could not do without him” = không thể thiếu ông ấy → vital role.',
    },
    {
      id: 'q21-r23',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'Who does “her” in paragraph 4 refer to?',
      readingPassage: PASSAGE_3,
      options: ['Molly Pelham', 'the doctor', 'the chemist', 'Sergeant Lloyd'],
      correctIndex: 3,
      explanation:
        'Đoạn 4: “his colleague, Sergeant Lloyd, took the initiative and drove him to the doctor’s door… he didn’t have strength left to argue with HER.” Câu sau “SHE was taking him along to the chemist’s” → her = Sergeant Lloyd (nữ cảnh sát).',
      pedagogicalTip:
        'Đại từ “her/she” đây chỉ đồng nghiệp Sergeant Lloyd — đọc cả câu trước và sau để xác nhận.',
    },
    {
      id: 'q21-r24',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question:
        'When Inspector Pelham’s wife first told him about the walnut tree, he appeared to be',
      readingPassage: PASSAGE_3,
      options: ['worried', 'shocked', 'saddened', 'uninterested'],
      correctIndex: 3,
      explanation:
        '“Pelham hadn’t been able to take it in. On Thursday evening, he had asked weakly about the damage to the house, groaned thankfully when he heard there was none, and pulled the sheets over his head.” → dửng dưng/không để tâm (vì còn ốm nặng).',
      pedagogicalTip: '“pull the sheets over one’s head” = kéo chăn trùm đầu — hành động thể hiện sự thờ ơ.',
    },
    {
      id: 'q21-r25',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'What does “it” in paragraph 7 refer to?',
      readingPassage: PASSAGE_3,
      options: ['the walnut tree', 'the view', 'the window', 'the living room'],
      correctIndex: 0,
      explanation:
        '“Previously, the view from the living room had featured the handsome walnut tree. This had not darkened the room… but IT had provided interesting patterns of lights and shade.” — “This” và “it” cùng thay cho the walnut tree (cây tạo bóng râm).',
      pedagogicalTip: 'Chuỗi tham chiếu: the walnut tree → This → it — truy vết theo nghĩa “tạo bóng/che sáng”.',
    },
    {
      id: 'q21-r26',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'What aspect of the Pelhams’ furniture does “shabbiness” in paragraph 8 describe?',
      readingPassage: PASSAGE_3,
      options: ['its color', 'its condition', 'its position', 'its design'],
      correctIndex: 1,
      explanation:
        '“With the tree gone, the room seemed cruelly bright, its WORN furnishings exposed in all their shabbiness.” → worn = cũ mòn → shabbiness nói về TÌNH TRẠNG (condition) của nội thất.',
      pedagogicalTip: 'shabby = worn out (cũ, sờn) — từ vựng về tình trạng đồ vật.',
    },
    {
      id: 'q21-r27',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'As a result of the storm, the Pelhams’ living room',
      readingPassage: PASSAGE_3,
      options: ['was pleasantly lighter.', 'felt less private.', 'had a better view.', 'was in need of repair.'],
      correctIndex: 1,
      explanation:
        '“The leafy garden had created an impression of privacy… the storm had changed his outlook” + nhà hàng xóm “dominating the outlook… all of them watching the Pelhams’ every movement” → phòng khách mất cảm giác riêng tư (less private).',
      pedagogicalTip:
        'Loại đáp án A vì “cruelly bright” = sáng chói KHÓ CHỊU (không pleasant); C sai vì view tệ hơn; D không được nhắc.',
    },
    {
      id: 'q21-r28',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'From the passage, Molly’s feeling about the loss of the walnut tree could be best described as',
      readingPassage: PASSAGE_3,
      options: ['happy', 'miserable', 'surprised', 'disappointed'],
      correctIndex: 0,
      explanation:
        '“Molly, standing in the doorway, sounded more PLEASED than dismayed. ‘That’s what I’ve been telling you ever since we came here. We have to buy a new sofa, whatever it costs.’” → bà vui vì có cớ thay sofa.',
      pedagogicalTip: 'Từ khóa “more pleased than dismayed” → chọn happy.',
    },
    {
      id: 'q21-r29',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'Why did Molly sound pleased by her husband’s comment?',
      readingPassage: PASSAGE_3,
      options: [
        'It proved that he was well again.',
        'She agreed about the tree.',
        'She thought he meant the sofa.',
        'It was what she expected him to say.',
      ],
      correctIndex: 2,
      explanation:
        'Pelham nói “Doesn’t it look terrible?” (ý nói cảnh/cây), nhưng Molly tưởng ông đang nói về bộ SOFA cũ → “We have to buy a new sofa, whatever it costs.”',
      pedagogicalTip: 'Hiểu ý nhân vật: “it” gây hiểu lầm — Molly gắn “it” với the sofa.',
    },
    {
      id: 'q21-r30',
      section: 'reading',
      sectionName: 'Reading - Passage 3: Truyện ngắn - Cơn bão ở Brackham (Câu 21-30)',
      question: 'From what we learn of Inspector Pelham, he could best be described as',
      readingPassage: PASSAGE_3,
      options: ['open-minded', 'well-liked', 'warm-hearted', 'strong-willed'],
      correctIndex: 3,
      explanation:
        '“Convinced that the police force could not do without him, he had, AS USUAL, ignored her…” + “he wouldn’t have listened to anyone” → rất cứng đầu, ý chí mạnh (strong-willed).',
      pedagogicalTip: 'Suy ra tính cách từ hành vi lặp lại (“as usual”, “wouldn’t have listened”).',
    },
    // ===== READING - PASSAGE 4 (Câu 31-40) =====
    {
      id: 'q21-r31',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question: 'According to paragraph 1, which of the following statements is true of changes in Earth’s landscape?',
      readingPassage: PASSAGE_4,
      options: [
        'They occur more often by uplift than by erosion.',
        'They occur only at special times.',
        'They occur less frequently now than they once did.',
        'They occur quickly in geological terms.',
      ],
      correctIndex: 3,
      explanation:
        '“its surface is continually altering — slowly on the human time scale, but RELATIVELY RAPIDLY when compared to the great age of Earth” → thay đổi nhanh theo thang địa chất.',
      pedagogicalTip: 'Chú ý cặp đối lập: slowly on the human time scale ↔ relatively rapidly in geological terms.',
    },
    {
      id: 'q21-r32',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question: 'The word “relatively” in the passage is closest in meaning to',
      readingPassage: PASSAGE_4,
      options: ['unusually', 'comparatively', 'occasionally', 'naturally'],
      correctIndex: 1,
      explanation: '“relatively rapidly” = nhanh MỘT CÁCH TƯƠNG ĐỐI (khi so sánh) → comparatively.',
      pedagogicalTip: 'relatively ≈ comparatively ≈ in comparison (tương đối, so sánh với chuẩn khác).',
    },
    {
      id: 'q21-r33',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question:
        'Which of the sentences below best expresses the essential information in the highlighted sentence in the passage? Incorrect choices change the meaning in important ways or leave out essential information.',
      readingPassage: PASSAGE_4,
      options: [
        'When they are relatively young, hills and mountains successfully resist the destructive forces of nature.',
        'Although they seem permanent, hills and mountains exist for a relatively short period of geological time.',
        'Hills and mountains successfully resist the destructive forces of nature, but only for a short time.',
        'Hills and mountains resist the destructive forces of nature better than other types of landforms.',
      ],
      correctIndex: 1,
      explanation:
        'Câu gốc: “Hills and mountains are often regarded as the epitome of permanence… but in fact they tend to be relatively short-lived in geological terms.” → Dù trông vĩnh cửu, núi đồi tồn tại tương đối ngắn theo thời gian địa chất (B). A thêm thông tin tuổi; C đổi thành “chỉ ngắn” tuyệt đối; D so sánh với dạng địa hình khác (không có).',
      pedagogicalTip: 'Dạng paraphrase quan trọng: giữ đủ ý chính, giữ sắc thái so sánh “relatively/in geological terms”.',
    },
    {
      id: 'q21-r34',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question:
        'Which of the following can be inferred from paragraph 2 about the mountains of the Himalayas?',
      readingPassage: PASSAGE_4,
      options: [
        'Their current height is not an indication of their age.',
        'At present, they are much higher than the mountains of the Caledonian range.',
        'They were a uniform height about 400 million years ago.',
        'They are not as high as the Caledonian mountains were 400 million years ago.',
      ],
      correctIndex: 1,
      explanation:
        'Caledonian xưa “the same size as the modern Himalayas”, nhưng nay chỉ còn “the comparatively LOW mountains of Greenland…” → ngày nay Himalaya cao hơn hẳn. A sai vì bài nói ngược lại: “the higher a mountain is, the more recently it was formed” — độ cao CÓ chỉ dấu về tuổi.',
      pedagogicalTip: 'Suy luận so sánh quá khứ ↔ hiện tại: đọc kỹ “was the same size as… Today, however…”.',
    },
    {
      id: 'q21-r35',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question: 'The word “relics” in the passage is closest in meaning to',
      readingPassage: PASSAGE_4,
      options: ['resemblances', 'regions', 'remains', 'restorations'],
      correctIndex: 2,
      explanation: '“the eroded relics of much higher mountain chains” → relics = remains (tàn dư/còn sót lại).',
      pedagogicalTip: 'relic = something left behind (di tích, tàn tích) — gặp lại trong “relics of the Caledonian orogeny”.',
    },
    {
      id: 'q21-r36',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question: 'According to paragraph 3, one cause of mountain formation is the',
      readingPassage: PASSAGE_4,
      options: [
        'effect of climatic change on sea level',
        'slowing down of volcanic activity',
        'force of Earth’s crustal plates hitting each other',
        'replacement of sedimentary rock with volcanic rock',
      ],
      correctIndex: 2,
      explanation:
        '“Some mountains were formed as a result of these PLATES CRASHING INTO EACH OTHER and forcing up the rock at the plate margins.” → lực của các mảng vỏ Trái Đất đâm vào nhau.',
      pedagogicalTip: 'Đáp án nhiễu dùng lại từ trong bài (volcanic, sedimentary) nhưng SAI quan hệ — kiểm tra đúng nguyên nhân.',
    },
    {
      id: 'q21-r37',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question: 'Why does the author mention “carbon dioxide” in the passage?',
      readingPassage: PASSAGE_4,
      options: [
        'To explain the origin of a chemical that can erode rocks',
        'To contrast carbon dioxide with carbonic acid',
        'To give an example of how rainwater penetrates soil',
        'To argue for the desirability of preventing erosion',
      ],
      correctIndex: 0,
      explanation:
        '“Carbon dioxide in the air reacts with the rainwater, forming a weak acid (carbonic acid) that may chemically attack the rocks.” → CO2 là điểm khởi đầu (nguồn gốc) của chất hóa học ăn mòn đá.',
      pedagogicalTip: 'Câu hỏi rhetorical purpose: hỏi TẠI SAO tác giả nhắc đến — tìm mắt xích trong chuỗi nhân quả.',
    },
    {
      id: 'q21-r38',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question: 'The word “seeps” in the passage is closest in meaning to',
      readingPassage: PASSAGE_4,
      options: ['dries gradually', 'flows slowly', 'freezes quickly', 'warms slightly'],
      correctIndex: 1,
      explanation: '“The rain seeps underground and the water may reappear later as springs.” → seeps = thấm/chảy chậm xuống dưới đất (flows slowly).',
      pedagogicalTip: 'seep = flow slowly through small openings — hình dung nước thấm qua khe đất.',
    },
    {
      id: 'q21-r39',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question: 'The word “them” in the passage refers to',
      readingPassage: PASSAGE_4,
      options: ['cold areas', 'masses of ice', 'valleys', 'rock debris'],
      correctIndex: 1,
      explanation:
        '“Glaciers may form in permanently cold areas, and these slowly moving MASSES OF ICE cut out valleys, carrying with THEM huge quantities of eroded rock debris.” → them = masses of ice (các khối băng di chuyển mang theo mảnh đá).',
      pedagogicalTip: 'Tìm chủ thể thực hiện hành động “carrying” — khối băng (glaciers) mới mang theo đá vụn.',
    },
    {
      id: 'q21-r40',
      section: 'reading',
      sectionName: 'Reading - Passage 4: Geology and Landscape (Câu 31-40)',
      question:
        'Look at the four squares [A], [B], [C], [D] in paragraph 6 that indicate where the following sentence could be added to the passage: “Under different climatic conditions, another type of destructive force contributes to erosion.” Where would the sentence best fit?',
      readingPassage: PASSAGE_4,
      options: ['[A] - first square', '[B] - second square', '[C] - third square', '[D] - fourth square'],
      correctIndex: 0,
      explanation:
        'Câu cần chèn là câu CHUYỂN Ý: từ điều kiện LẠNH (băng, sông băng phá hủy đá) sang điều kiện KHÔ. “Another type of destructive force” (một lực phá hủy khác = gió) phải đứng NGAY TRƯỚC “In dry areas the wind is the principal agent of erosion” → ô [A]. (Câu này thuộc bộ “Geology and Landscape” — TOEFL Official Guide; đáp án đúng là ô thứ nhất [A], một số bản in đáp án nhầm thành [D].)',
      pedagogicalTip:
        'Câu chèn dạng chuyển ý: đọc câu trước ô và câu sau ô — chọn vị trí mà cụm “another type of…” nối được với ý vừa nêu (cold → dry).',
    },
    // ===== WRITING =====
    {
      id: 'q21-w1',
      section: 'writing',
      sectionName: 'Writing - Task 1: Email trả lời Richard (≥120 từ)',
      taskType: 'writing',
      question: 'Writing Task 1 (20 phút, ≥120 từ): viết email trả lời Richard về khách sạn cho bố mẹ anh ấy ở quê bạn.',
      writingPrompt:
        'You should spend about 20 minutes on this task.\n\nYou have received an email from an Australian friend, Richard, whose parents are coming to visit your country. He asked you for some information about a hotel in your hometown. Read part of his email below.\n\n“My parents are arriving on Tuesday 16th at 18.05 and leaving on Monday 22nd at 14.45. I am hoping you can suggest a hotel for my parents’ trip in your hometown. Could you also check if there are any day trips from the hotel to local sights, what the price of the hotel room is, if breakfast is included in the price and if the hotel restaurant serves vegetarian dishes?”\n\nWrite an email responding to Richard.\nYou should write at least 120 words. You do not need to include your name or address. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.',
      minWords: 120,
      options: [],
      correctIndex: -1,
      explanation:
        'Task Fulfillment — phải trả lời ĐỦ 4 yêu cầu: (1) gợi ý một khách sạn cụ thể, (2) day trips từ khách sạn đến các điểm tham quan, (3) giá phòng, (4) bữa sáng có nằm trong giá không, và (5) nhà hàng khách sạn có món chay không. Ngoài ra nên nhắc mốc thời gian (đến thứ Ba 16, 18.05; về thứ Hai 22, 14.45). Tổ chức email: chào — lý do viết — trả lời từng mục — kết thúc; từ vựng lịch sự, ngữ pháp chuẩn.',
      pedagogicalTip:
        'Đếm yêu cầu trước khi viết: gạch đầu dòng 4 câu hỏi của Richard rồi trả lời lần lượt — tránh mất điểm Task Fulfillment vì bỏ sót như điểm số thật.',
      modelAnswer:
        'Dear Richard,\n\nThank you for your email — I am so glad your parents are visiting! I would be happy to help you find a hotel.\n\nFirst of all, I recommend the Sunrise Hotel, right in the center of my hometown. I stayed there in summer, and the service was excellent.\n\nAt reception you can book day trips to all the main local sights, including the old quarter, the night market and the riverboat tour. The price for a double room is about 1,200,000 VND per night, and breakfast is included. The hotel restaurant also serves several vegetarian dishes, so your parents will be completely fine.\n\nSince your parents arrive on Tuesday 16th at 18.05, I suggest booking in advance. The airport bus stops near the hotel, and the reception staff speak good English.\n\nLet me know if you need anything else!\n\nBest wishes,\nMinh',
    },
    {
      id: 'q21-w2',
      section: 'writing',
      sectionName: 'Writing - Task 2: Luận về giáo dục chung (≥250 từ)',
      taskType: 'writing',
      question: 'Writing Task 2 (40 phút, ≥250 từ): viết luận về điểm mạnh và điểm yếu của co-education (giáo dục chung nam-nữ).',
      writingPrompt:
        'You should spend about 40 minutes on this task.\n\nRead the following text from an article about education.\n\n“Co-education means education for boys and girls together. The tendency has been for more countries to move to co-education as the standard at every level of education. However, there is no general agreement as to whether the two genders should be educated together. Some people believe it is better if boys and girls go to single-sex schools.”\n\nWrite an essay to an educated reader to discuss the strengths and weaknesses of co-education. Include reasons and any relevant examples to support your answer.\n\nYou should write at least 250 words. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.',
      minWords: 250,
      options: [],
      correctIndex: -1,
      explanation:
        'Task Fulfillment: phải bàn CẢ HAI mặt (strengths và weaknesses), có lý do + ví dụ cụ thể cho mỗi mặt. Organization: mở bài (dẫn đề + hướng triển khai) → thân bài 2 đoạn (mạnh/yếu) → kết bài (đánh giá cân bằng hoặc ý kiến riêng). Vocabulary: từ học thuật theo chủ đề giáo dục (social skills, equal opportunities, gender stereotypes, distraction, self-conscious). Grammar: đa dạng câu phức, liên từ (On the positive side, Furthermore, In contrast, In conclusion).',
      pedagogicalTip:
        'Dàn ý 2 mặt chuẩn VSTEP: Mở (1 đoạn) → Strengths (1-2 đoạn: kỹ năng xã hội, bình đẳng, chuẩn bị môi trường làm việc) → Weaknesses (1-2 đoạn: xao nhãng, e ngại, tốc độ học khác nhau) → Kết (cân bằng). Mỗi đoạn 1 câu chủ đề + 2 câu phát triển + ví dụ.',
      modelAnswer:
        'Co-education, the education of boys and girls together, has become the standard in most countries, yet it still divides opinion. This essay will discuss both the strengths and weaknesses of the system.\n\nOn the positive side, co-educational schools prepare students for real life. In the workplace and in society, men and women study, work and cooperate side by side, so studying together from an early age develops communication and social skills. For example, group projects teach students to listen to different viewpoints and to negotiate, rather than to see the opposite gender as a distant “other”. In addition, co-education promotes equal opportunities: schools can offer the same subjects, facilities and competitions to everyone, which helps break traditional stereotypes such as “girls are not good at science”.\n\nHowever, there are also clear weaknesses. The most common criticism is distraction: teenagers go through emotional changes, and romantic interests can draw attention away from study. Furthermore, boys and girls often develop at different rates, and in a mixed class some students may feel self-conscious and be reluctant to speak up. In some cases, a mixed environment can also create pressure about appearance and popularity.\n\nIn conclusion, co-education brings important benefits in social development and equality, but its weaknesses need careful management, especially distraction. With supportive teaching and a healthy school culture, studying together is likely to benefit most students.',
    },
    // ===== SPEAKING =====
    {
      id: 'q21-s1',
      section: 'speaking',
      sectionName: 'Speaking - Part 1: Social Interaction (Tương tác xã hội)',
      taskType: 'speaking',
      question: 'Speaking Part 1 (3 phút): trả lời các câu hỏi xã hội về 2 chủ đề — nhiếp ảnh và đồ ăn.',
      speakingPrompt:
        'Part 1. Social interaction (3 minutes)\n\nLet’s talk about photographs:\n1. Do you like taking photos?\n2. How do you take these photographs?\n3. Do you prefer to take pictures of scenery or of people?\n\nLet’s talk about food:\n4. What is your favourite food?\n5. Do you think eating three meals a day is important?\n6. Are you willing to try any new food?\n\nHướng dẫn: trả lời tự nhiên 2-3 câu mỗi câu hỏi (20-30 giây), kèm lý do và ví dụ cá nhân. Ghi dàn ý/câu trả lời vào ô bên dưới.',
      prepTimeSeconds: 0,
      options: [],
      correctIndex: -1,
      explanation:
        'Phần Social Interaction chấm độ trôi chảy và khả năng giao tiếp: trả lời TRỰC TIẾP câu hỏi, rồi mở rộng bằng lý do/ví dụ — tránh trả lời cụt 1-2 từ. Từ vựng chủ đề: photography (portrait, landscape, filter, capture a moment), food (cuisine, flavour, ingredients, eating habits).',
      pedagogicalTip:
        'Công thức vàng: (1) câu trả lời trực tiếp → (2) lý do “because…” → (3) ví dụ cá nhân. Ví dụ: “Yes, I love taking photos, especially when I travel, because they help me keep memories.”',
      modelAnswer:
        'Gợi ý khung trả lời:\n• Q1: “Yes, definitely. I take photos almost every day — scenery, food, and my friends. It’s a way of keeping memories.”\n• Q2: “Mostly with my phone because it’s always with me. When I want better quality, I borrow my brother’s camera — the photos come out much sharper.”\n• Q3: “I prefer scenery. Landscapes and sunsets are more relaxing to look at later, while photos of people often look awkward.”\n• Q4: “My favourite food is pho — a Vietnamese noodle soup. I could eat it for breakfast every day, and it’s actually very healthy.”\n• Q5: “Yes, I think three meals a day is a good habit. It keeps my energy stable, and I avoid unhealthy snacking in the evening.”\n• Q6: “Of course! I love trying new dishes. Last year I tried sushi for the first time, and now it’s one of my favourites.”',
    },
    {
      id: 'q21-s2',
      section: 'speaking',
      sectionName: 'Speaking - Part 2: Solution Discussion (Thảo luận giải pháp)',
      taskType: 'speaking',
      question: 'Speaking Part 2 (4 phút): thảo luận chọn quà chia tay — bạn thân sang Mỹ một năm nên tặng gì?',
      speakingPrompt:
        'Part 2. Solution discussion (4 minutes)\n\nSituation: Your friend is going to the U.S.A. for a year and you want to buy her a going-away present. Three items are suggested: a camera, an English dictionary and a scarf. Which option do you think is the best?\n\nHướng dẫn: chọn một phương án, giải thích vì sao hợp lý nhất, so sánh với hai phương án còn lại (hoặc kết hợp). Chuẩn bị 1 phút — nói 3-4 phút. Ghi dàn ý vào ô bên dưới.',
      prepTimeSeconds: 60,
      options: [],
      correctIndex: -1,
      explanation:
        'Phần Solution Discussion chấm khả năng phân tích và lựa chọn: nêu phương án chọn → lý do ủng hộ → so sánh/loại trừ 2 phương án còn lại → tổng kết. Dùng ngôn ngữ so sánh: the most suitable option, whereas, unlike, on the other hand, therefore.',
      pedagogicalTip:
        'Đừng chỉ nói “tôi chọn camera” — phải LUẬN: camera giúp lưu kỷ niệm cả năm (mạnh), trong khi scarf chỉ hợp thời tiết lạnh và dictionary đã có app thay thế (yếu). Cấu trúc: chọn → vì sao → phản biện → chốt.',
      modelAnswer:
        'Gợi ý khung trả lời:\n“I would choose the camera as a going-away present. My friend is going to spend a whole year in the U.S.A., and she will experience so many new things — new friends, campus life, famous places. A camera would help her capture all of those memories, and every photo would remind her of home and of me.\nI understand that a scarf is also a lovely gift, but it is only useful in cold weather. An English dictionary is practical for her studies, but these days most students use dictionary apps on their phones, so a paper dictionary might stay on the shelf. Therefore, in my opinion, the camera is the most meaningful and useful option.”',
    },
    {
      id: 'q21-s3',
      section: 'speaking',
      sectionName: 'Speaking - Part 3: Topic Development (Phát triển chủ đề)',
      taskType: 'speaking',
      question: 'Speaking Part 3 (5 phút): phát triển chủ đề “Travelling can bring a lot of benefits” theo sơ đồ tư duy + câu hỏi mở rộng.',
      speakingPrompt:
        'Part 3. Topic development (5 minutes)\n\nTopic: Travelling can bring a lot of benefits.\n\nMind map (sơ đồ tư duy):\n• Travelling (trung tâm)\n   - Enhance economy (thúc đẩy kinh tế)\n   - Get refreshed (nạp lại năng lượng)\n   - Improve knowledge (mở mang kiến thức)\n   - Your own ideas (ý tưởng của bạn)\n\nFollow-up questions:\n1. In which seasons do you prefer to travel?\n2. What countries would you like to visit? Why?\n3. Would you rather visit another country or travel within your own country?\n\nHướng dẫn: chuẩn bị 1 phút cho sơ đồ, phát triển từng nhánh 2-3 câu kèm ví dụ; sau đó trả lời các câu hỏi mở rộng 30-45 giây mỗi câu. Ghi dàn ý vào ô bên dưới.',
      prepTimeSeconds: 60,
      options: [],
      correctIndex: -1,
      explanation:
        'Phần Topic Development chấm khả năng phát triển ý từ sơ đồ: không chỉ đọc lại các cụm từ, mà mở rộng mỗi nhánh thành 2-3 câu có lý do + ví dụ; sau đó trả lời follow-up với quan điểm rõ ràng. Từ nối: First of all, Another benefit is, Moreover, Personally, In terms of.',
      pedagogicalTip:
        'Bám sơ đồ nhưng thêm chất riêng: mỗi nhánh 1 ví dụ cụ thể (du lịch thúc đẩy kinh tế địa phương: homestay, quán ăn đêm ở Hội An chẳng hạn). Chuẩn bị 4 ý trong 1 phút — mỗi ý 2 từ khóa.',
      modelAnswer:
        'Gợi ý khung trả lời:\n“Travelling brings a lot of benefits. First of all, it can enhance the economy — when tourists visit a place, they spend money on hotels, food and local products, which creates jobs for local people. For example, in Hội An, tourism provides income for thousands of families.\nAnother benefit is that travelling helps us get refreshed. After months of hard work, a short trip reduces stress and gives us new energy.\nFinally, travelling improves our knowledge: we learn about new cultures, food and history. Seeing a place with your own eyes is different from reading about it.\nFor me, I prefer travelling in spring or autumn, when the weather is cool and pleasant. I would love to visit Japan because of its culture and food. And I think I’d rather travel abroad first, because a new country teaches me more — but travelling within Vietnam is cheaper and always a good backup plan.”',
    },
  ],
};

export const VSTEP_SAMPLE_SETS: ExamSet[] = [VSTEP_SAMPLE_SET];

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Flame,
  Coins,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Lightbulb,
  Bug,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Bot,
  Search,
  Copy,
  Check,
  Clock,
  FileText,
  Zap,
  GraduationCap,
  Lock,
  Heart,
  Volume2
} from 'lucide-react';
import confetti from '@/lib/confetti';
import { sound } from '@/lib/soundFx';
import { getCurrentUser, AuthUser } from '@/lib/auth';

interface TicketItem {
  id: string;
  name: string;
  email: string;
  user_id?: string | null;
  category: 'feedback' | 'bug' | 'guide' | 'account' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  message: string;
  rating?: number;
  status: 'new' | 'processing' | 'resolved';
  admin_reply?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: 'groq' | 'gemini' | 'offline_kb' | 'error_fallback';
  timestamp: string;
}

/** Các field của form tạo phiếu hỗ trợ cần validate phía client */
type TicketFieldKey = 'category' | 'name' | 'email' | 'subject' | 'message';
type TicketFieldErrors = Partial<Record<TicketFieldKey, string>>;

/** Thứ tự ưu tiên khi focus + hiển thị banner tổng hợp (theo thứ tự trên form) */
const TICKET_FIELD_ORDER: TicketFieldKey[] = ['category', 'name', 'email', 'subject', 'message'];

/** Email phải khớp với regex server-side: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ */
const TICKET_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Số ký tự tối thiểu cho mô tả chi tiết */
const TICKET_MESSAGE_MIN = 20;

interface FaqArticle {
  id: string;
  category: 'study' | 'pet' | 'coins' | 'security';
  title: string;
  summary: string;
  content: string[];
  actionLink?: string;
  actionText?: string;
  icon: string;
  tags: string[];
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'guide' | 'ai' | 'ticket'>('guide');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // ==========================================
  // TAB 1: KNOWLEDGE BASE (CẨM NANG & HƯỚNG DẪN)
  // ==========================================
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'study' | 'pet' | 'coins' | 'security'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('study-1');

  // ==========================================
  // TAB 2: AI ASSISTANT CHAT
  // ==========================================
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Meow! Chào bạn học viên! Mình là **Trợ Lý Mèo AI Meowlish** 🐱✨.\n\nMình có thể giải đáp ngay lập tức cách kiếm Coins, cách chăm sóc thú cưng khi đói, phương pháp học Ngữ Pháp Lego, cách bật 2FA, mẹo làm bài thi hoặc bất kỳ thắc mắc nào của bạn. Bạn cứ tự nhiên hỏi nhé!',
      provider: 'groq',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // TAB 3: TICKET SUPPORT & HISTORY
  // ==========================================
  const [ticketSubTab, setTicketSubTab] = useState<'create' | 'history'>('create');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [category, setCategory] = useState<'feedback' | 'bug' | 'guide' | 'account'>('feedback');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [rating, setRating] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<TicketFieldErrors>({});

  // Refs để focus vào field đầu tiên bị lỗi khi submit
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // History state
  const [myTickets, setMyTickets] = useState<TicketItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  // Khách chưa đăng nhập chỉ thấy metadata phiếu — cần giải thích rõ thay vì
  // hiện card trắng trơn khiến tưởng ứng dụng lỗi.
  const [historyRedacted, setHistoryRedacted] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.display_name) setName(user.display_name);
      if (user.email) setEmail(user.email);
      // Tự động tải lịch sử ticket nếu đã đăng nhập
      fetchTicketHistory(user.id, user.email);
    }
    return () => {
      confetti.reset();
    };
  }, []);

  // Tự động cuộn chat xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiLoading]);

  const fetchTicketHistory = async (userId?: string, userEmail?: string, lookupCode?: string) => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (lookupCode) {
        params.append('ticketId', lookupCode.trim());
      } else {
        if (userId) params.append('userId', userId);
        if (userEmail) params.append('email', userEmail);
      }

      const res = await fetch(`/api/support?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.tickets) {
        setMyTickets(data.tickets);
        // Server chỉ trả metadata cho khách chưa đăng nhập (để không lộ nội
        // dung phiếu của người khác). Không có cờ báo thì UI hiện một card trắng
        // trơn: không tiêu đề, không nội dung, không trả lời admin — trông như
        // lỗi mà không có lý do.
        setHistoryRedacted(Boolean(data.redacted));
        setHistoryError('');
      } else if (!res.ok) {
        setHistoryError(data.error || 'Không tải được lịch sử phiếu hỗ trợ.');
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ==========================================
  // KNOWLEDGE BASE DATA
  // ==========================================
  const faqArticles: FaqArticle[] = [
    // 1. Học tập hiệu quả (study)
    {
      id: 'study-1',
      category: 'study',
      icon: '📚',
      title: 'Lộ Trình Học Chuẩn CEFR & Bách Khoa 26.500+ Từ Vựng',
      summary: 'Khám phá từ điển song ngữ chuẩn Châu Âu A1-C2, phát âm IPA và collocations thực chiến.',
      content: [
        'Hệ thống từ vựng trên Meowlish được phân cấp khoa học từ sơ cấp A1 đến cao cấp C2 chuẩn khung tham chiếu Châu Âu.',
        'Mỗi từ đều tích hợp audio phát âm chuẩn IPA của người bản xứ Anh - Mỹ, giải nghĩa trực quan kèm các cặp collocations và ví dụ tình huống văn phòng IT thực chiến.',
        'Bạn có thể tìm kiếm nhanh và lưu từ vựng yêu thích vào Sổ tay từ vựng Bookmark để ôn tập hàng ngày.',
      ],
      actionLink: '/encyclopedia',
      actionText: 'Tra cứu Từ Điển Bách Khoa',
      tags: ['từ vựng', 'cefr', 'ipa', 'phát âm', 'bách khoa', 'tra từ', 'encyclopedia'],
    },
    {
      id: 'study-2',
      category: 'study',
      icon: '🧩',
      title: 'Phương Pháp Ngữ Pháp Lego Ghép Khối Trực Quan',
      summary: 'Học cách ghép câu tiếng Anh bằng các khối màu sắc tự nhiên mà không cần học vẹt công thức.',
      content: [
        'Ngữ Pháp Lego chia nhỏ các thành phần ngữ pháp thành các khối Lego màu sắc trực quan:',
        '• Khối Xanh lá (Green): Chủ ngữ (Subject) - Ai làm hành động?',
        '• Khối Cam (Orange): Động từ (Verb) - Hành động là gì?',
        '• Khối Tím (Purple): Tân ngữ (Object) - Nhận tác động nào?',
        '• Khối Vàng (Yellow): Trạng từ (Adverb) - Ở đâu, khi nào, như thế nào?',
        'Bạn chỉ việc kéo thả các khối theo đúng trật tự tư duy bản xứ, não bộ sẽ ghi nhớ cấu trúc câu một cách tự động và phản xạ tức thì.',
      ],
      actionLink: '/grammar',
      actionText: 'Luyện Ngữ Pháp Lego Ngay',
      tags: ['ngữ pháp', 'lego', 'grammar', 'ghép câu', 'khối màu', 'công thức'],
    },
    {
      id: 'study-3',
      category: 'study',
      icon: '🎙️',
      title: 'Luyện Nói AI Voice & Nhận Diện Phát Âm Chuẩn Xác',
      summary: 'Công nghệ AI Speech Recognition trực tiếp chấm điểm độ lưu loát và sửa lỗi phát âm từng âm tiết.',
      content: [
        'Bạn không cần micro đắt tiền, chỉ cần micro tai nghe hoặc điện thoại thông thường.',
        'Hệ thống AI Voice phân tích khẩu hình âm tiết và đối chiếu chuẩn phiên âm quốc tế IPA theo thời gian thực.',
        'Đặc biệt có các bài luyện nói theo tình huống thực tế: Daily Standup, Sprint Planning, Demo sản phẩm và phỏng vấn xin việc tiếng Anh.',
      ],
      actionLink: '/practice/speaking',
      actionText: 'Thử Giọng Cùng AI Voice',
      tags: ['luyện nói', 'ai voice', 'phát âm', 'speaking', 'standup', 'micro'],
    },
    {
      id: 'study-4',
      category: 'study',
      icon: '📝',
      title: 'Bài Kiểm Tra Quiz & Phòng Thi Thử Chuẩn Quốc Tế',
      summary: 'Đánh giá năng lực sau mỗi Unit và làm quen định dạng đề thi TOEIC, IELTS thực chiến.',
      content: [
        'Sau mỗi bài học từ vựng hay ngữ pháp, hệ thống đều cung cấp bài Mini-Quiz từ 5-10 câu trắc nghiệm để củng cố kiến thức.',
        'Ngoài ra, tại mục Luyện Thi, học viên có thể thử sức với các bộ đề thi thử định dạng chuẩn TOEIC / IELTS có đồng hồ đếm ngược và bảng giải thích đáp án chi tiết từng câu.',
        'Làm đúng bài kiểm tra sẽ đem lại lượng Exp và Coins thưởng rất lớn để thăng hạng!',
      ],
      actionLink: '/exam',
      actionText: 'Vào Phòng Luyện Thi Thử',
      tags: ['kiểm tra', 'quiz', 'thi thử', 'test', 'toeic', 'ielts', 'đánh giá'],
    },

    // 2. Nuôi & Nâng cấp Thú cưng (pet)
    {
      id: 'pet-1',
      category: 'pet',
      icon: '🐾',
      title: 'Làm Quen Với 4 Linh Vật PixelFarm & Chỉ Số Sức Khỏe',
      summary: 'Khám phá Cú Lexi, Mèo Mochi, Cún Taro, Cáo Kitsune và cách duy trì năng lượng cho bé cưng.',
      content: [
        'Khi tham gia Meowlish, bạn sẽ chọn 1 trong 4 bé cưng đồng hành: Cú Lexi (thông thái), Mèo Mochi (tinh nghịch), Cún Taro (trung thành), Cáo Kitsune (nhanh nhẹn).',
        'Bé cưng có 3 chỉ số sức khỏe chính:',
        '• Đói (Hunger): Giảm dần theo thời gian. Khi đói bé sẽ buồn và không cổ vũ bạn học tập.',
        '• Hạnh phúc (Happiness): Tăng khi bạn hoàn thành bài học, cho ăn món ngon và chơi đùa.',
        '• Năng lượng (Energy): Cần thiết để tham gia các thử thách mini-game.',
      ],
      actionLink: '/pet',
      actionText: 'Ghé Thăm Nông Trại Thú Cưng',
      tags: ['pet', 'thú cưng', 'chỉ số', 'đói', 'hạnh phúc', 'mochi', 'lexi', 'taro', 'kitsune'],
    },
    {
      id: 'pet-2',
      category: 'pet',
      icon: '🍲',
      title: 'Thú Cưng Bị Đói Thì Phải Làm Gì? Cách Kiếm Thức Ăn',
      summary: 'Hướng dẫn cho pet ăn no bụng và mẹo nhận thức ăn thơm ngon miễn phí mỗi ngày.',
      content: [
        'Bước 1: Truy cập mục Thú Cưng (/pet).',
        'Bước 2: Bấm nút "Cho ăn" (Feed) để tăng chỉ số no bụng và độ vui vẻ của bé cưng.',
        'Cách nhận thức ăn ngon lành:',
        '• Hoàn thành mỗi bài học Từ vựng hay Ngữ pháp sẽ nhận ngay thức ăn thượng hạng cho pet.',
        '• Dùng Coins tích lũy để sắm thêm các món ăn yêu thích trong Cửa Hàng PixelFarm.',
      ],
      actionLink: '/pet',
      actionText: 'Cho Bé Cưng Ăn Ngay',
      tags: ['đói', 'cho ăn', 'thức ăn', 'feed', 'thú cưng', 'pet'],
    },
    {
      id: 'pet-3',
      category: 'pet',
      icon: '🎩',
      title: 'Cửa Hàng Thời Trang & Thay Đổi Cảnh Quan Sống',
      summary: 'Sắm nón phù thủy, kính râm coder, vương miện và mở khóa cảnh quan Vườn Xanh, Làng Lá.',
      content: [
        'Tại Cửa Hàng Thú Cưng, bạn có thể biến hóa phong cách độc đáo cho bé cưng của mình:',
        '• Nón & Phụ kiện: Nón phù thủy ma thuật, kính râm coder cool ngầu, vương miện hoàng gia lấp lánh.',
        '• Trang phục: Áo choàng phiêu lưu, đồng phục học sinh Meowlish.',
        '• Cảnh quan môi trường sống: Đổi phong nền Vườn Xanh Yên Bình, Làng Lá Ninja Huyền Bí, hoặc Đảo Hải Tặc Phiêu Lưu!',
      ],
      actionLink: '/pet',
      actionText: 'Vào Cửa Hàng Thời Trang',
      tags: ['shop', 'cửa hàng', 'thời trang', 'phụ kiện', 'nón', 'áo', 'cảnh quan', 'vườn xanh'],
    },

    // 3. Tích lũy Coins & Cửa hàng (coins)
    {
      id: 'coins-1',
      category: 'coins',
      icon: '💰',
      title: 'Bí Quyết Kiếm Thật Nhiều Coins Nhanh Nhất',
      summary: '4 cách siêu tốc giúp túi xu của bạn luôn đầy ắp để thoải mái sắm đồ và bảo vệ chuỗi Streak.',
      content: [
        '1. Hoàn Thành Bài Học Đúng: Mỗi bài học mới hoàn thành trong Từ vựng và Ngữ Pháp thưởng từ +5 đến +50 Coins.',
        '2. Duy Trì Chuỗi Lửa Streak: Mỗi ngày có ít nhất 1 bài học hoàn thành, Streak tự động tăng thêm 1 ngày.',
        '3. Thử Sức Với Quiz & Thi Thử: Hoàn thành bài kiểm tra với điểm số cao mang lại thêm Coins thưởng.',
        '4. Đấu Trường & Đua Xe: Tham gia PVP hoặc đua xe với mức cược 50–500 Coins để nhân đôi số xu.',
      ],
      actionLink: '/pet',
      actionText: 'Vào Trang Thú Cưng',
      tags: ['xu', 'coin', 'coins', 'kiếm xu', 'tiền thưởng', 'streak'],
    },
    {
      id: 'coins-2',
      category: 'coins',
      icon: '🔥',
      title: 'Duy Trì Ngọn Lửa Streak',
      summary: 'Cách giữ chuỗi học tập liên tục để Streak luôn tăng.',
      content: [
        'Ngọn lửa Streak thể hiện tinh thần kiên trì học tập mỗi ngày của bạn. Streak tự động tăng thêm 1 mỗi ngày bạn hoàn thành bất kỳ bài học nào (Từ vựng, Ngữ pháp, Flashcard...).',
        'Hãy học đều đặn mỗi ngày — chỉ cần 1 bài hoàn thành là đủ để giữ ngọn lửa luôn cháy!',
        'Mẹo: Đặt lịch học cố định 15-20 phút mỗi sáng để không bao giờ bỏ lỡ một ngày.',
      ],
      actionLink: '/flashcards',
      actionText: 'Bắt Đầu Lật Flashcard',
      tags: ['streak', 'ngọn lửa', 'chuỗi ngày', 'flashcard'],
    },

    // 4. Bảo mật tài khoản & 2FA (security)
    {
      id: 'sec-1',
      category: 'security',
      icon: '🛡️',
      title: 'Bật Xác Thực 2 Bước (2FA) Qua OTP Email Bảo Vệ Tài Khoản',
      summary: 'Kích hoạt lớp bảo mật nâng cao ngăn ngừa xâm nhập trái phép vào tài khoản học tập.',
      content: [
        'Bảo mật 2FA giúp bảo vệ số dư Coins, điểm Exp và tiến độ học tập của bạn.',
        'Cách kích hoạt:',
        '1. Bấm nút "Đăng Nhập" ở góc trên thanh điều hướng để mở khung xác thực.',
        '2. Trong khung đó, tìm thẻ "Bảo Mật 2 Lớp (2FA)" và gạt nút Bật.',
        '3. Hệ thống sẽ gửi mã OTP 6 chữ số đến email của bạn để xác thực kích hoạt.',
        'Từ các lần đăng nhập sau, hệ thống sẽ yêu cầu nhập mã OTP gửi về email, đảm bảo chỉ có bạn mới có quyền truy cập!',
      ],
      tags: ['2fa', 'bảo mật', 'otp', 'email', 'xác thực 2 bước', 'tài khoản'],
    },
    {
      id: 'sec-2',
      category: 'security',
      icon: '🔑',
      title: 'Quên Mật Khẩu & Cách Khôi Phục Nhanh Chóng',
      summary: 'Lấy lại quyền truy cập tài khoản an toàn trong vòng 1 phút qua email xác thực.',
      content: [
        'Nếu bạn quên mật khẩu đăng nhập, hãy làm theo các bước sau:',
        '1. Bấm nút "Đăng Nhập" ở góc trên thanh điều hướng.',
        '2. Chọn dòng "Quên mật khẩu?".',
        '3. Nhập tên đăng nhập hoặc địa chỉ email bạn đã dùng để đăng ký tài khoản.',
        '4. Kiểm tra hộp thư (cả mục Hộp thư đến và Spam) để nhận mã OTP khôi phục và đặt lại mật khẩu mới.',
      ],
      tags: ['mật khẩu', 'quên mật khẩu', 'password', 'khôi phục', 'reset'],
    },
    {
      id: 'sec-3',
      category: 'security',
      icon: '☁️',
      title: 'Đồng Bộ Tiến Độ Học Tập Lên Đám Mây S3 Filebase',
      summary: 'Toàn bộ dữ liệu được sao lưu thời gian thực, học liền mạch trên mọi máy tính và điện thoại.',
      content: [
        'Toàn bộ quá trình học từ vựng, sổ tay bookmark, số dư Coins, thú cưng và chuỗi Streak đều được đồng bộ tự động lên máy chủ cơ sở dữ liệu và sao lưu định kỳ lên dịch vụ đám mây Filebase S3 an toàn.',
        'Bạn có thể học trên laptop ở văn phòng, sau đó mở điện thoại tiếp tục làm bài mà không bao giờ lo mất dữ liệu hay bị tụt hạng!',
      ],
      tags: ['s3', 'filebase', 'đồng bộ', 'sao lưu', 'dữ liệu', 'cloud', 'backup'],
    },
  ];

  // Lọc bài viết Knowledge Base theo search query và category
  const filteredFaqArticles = faqArticles.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    if (!matchesCat) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const titleMatch = item.title.toLowerCase().includes(q);
    const summaryMatch = item.summary.toLowerCase().includes(q);
    const tagMatch = item.tags.some((t) => t.toLowerCase().includes(q));
    const contentMatch = item.content.some((c) => c.toLowerCase().includes(q));

    return titleMatch || summaryMatch || tagMatch || contentMatch;
  });

  // ==========================================
  // XỬ LÝ CHAT TRỢ LÝ AI
  // ==========================================
  const handleSendAiMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuestion).trim();
    if (!textToSend || isAiLoading) return;

    sound.playClick();

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAiLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại gần nhất
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/support/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
        }),
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        sound.playSuccess();
        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          provider: data.provider,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } else {
        sound.playError();
        const errorMsg: ChatMessage = {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          content: 'Meow! 🐱 Hệ thống đang xử lý nhiều yêu cầu cùng lúc. Bạn có thể tham khảo mục Cẩm Nang hoặc gửi Ticket ở tab bên cạnh để BQT hỗ trợ nhé!',
          provider: 'error_fallback',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      sound.playError();
      const errorMsg: ChatMessage = {
        id: `ai_net_err_${Date.now()}`,
        role: 'assistant',
        content: 'Meow! 🐱 Lỗi kết nối mạng rồi. Vui lòng kiểm tra lại đường truyền internet của bạn nhé!',
        provider: 'error_fallback',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ==========================================
  // XỬ LÝ GỬI TICKET HỖ TRỢ
  // ==========================================
  /** Xóa lỗi của một field cụ thể khi người dùng sửa lại giá trị */
  const clearFieldError = (field: TicketFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /** Focus vào field đầu tiên đang bị lỗi (sau khi React đã render lỗi) */
  const focusFirstErrorField = (field: TicketFieldKey) => {
    requestAnimationFrame(() => {
      const refs: Partial<Record<TicketFieldKey, React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>>> = {
        name: nameRef,
        email: emailRef,
        subject: subjectRef,
        message: messageRef,
      };
      const target = refs[field]?.current;
      if (target) {
        target.focus();
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        // Field không focus được (ví dụ danh mục dạng nút) → focus về nút gửi
        submitButtonRef.current?.focus();
      }
    });
  };

  /** Validate toàn bộ form, trả về lỗi tiếng Việt theo từng field */
  const validateTicketForm = (): TicketFieldErrors => {
    const errors: TicketFieldErrors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      errors.name = 'Vui lòng nhập họ và tên của bạn.';
    }

    if (!cleanEmail) {
      errors.email = 'Vui lòng nhập email để Ban Quản Trị có thể gửi phản hồi cho bạn.';
    } else if (!TICKET_EMAIL_RE.test(cleanEmail)) {
      errors.email = 'Email không hợp lệ. Ví dụ đúng: ban@gmail.com';
    }

    if (!category) {
      errors.category = 'Vui lòng chọn danh mục yêu cầu.';
    }

    if (!cleanSubject) {
      errors.subject = 'Vui lòng nhập tiêu đề phiếu.';
    }

    if (!cleanMessage) {
      errors.message = 'Vui lòng mô tả vấn đề của bạn.';
    } else if (cleanMessage.length < TICKET_MESSAGE_MIN) {
      errors.message = `Vui lòng mô tả vấn đề rõ ràng hơn (tối thiểu ${TICKET_MESSAGE_MIN} ký tự, hiện mới có ${cleanMessage.length} ký tự).`;
    }

    return errors;
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(null);

    // ===== VALIDATE PHÍA CLIENT (thông báo tiếng Việt trong DOM) =====
    const errors = validateTicketForm();
    setFieldErrors(errors);

    const errorMessages = TICKET_FIELD_ORDER.map((key) => errors[key]).filter(
      (msg): msg is string => Boolean(msg)
    );

    if (errorMessages.length > 0) {
      const firstErrorField = TICKET_FIELD_ORDER.find((key) => Boolean(errors[key])) as TicketFieldKey;
      setSubmitError(
        `Vui lòng sửa ${errorMessages.length} thông tin còn thiếu hoặc chưa hợp lệ trước khi gửi phiếu hỗ trợ. Phiếu chưa được gửi đi.`
      );
      sound.playWrong();
      focusFirstErrorField(firstErrorField);
      return;
    }

    setSubmitError(null);

    setIsSubmitting(true);
    sound.playClick();

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          priority,
          subject: subject.trim(),
          message: message.trim(),
          rating,
          userId: currentUser?.id || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        sound.playCelebration();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.5 },
        });

        const newId = data.ticketId || '';
        setSubmitSuccess(data.message || `Phiếu hỗ trợ #${newId} đã được gửi thành công!`);
        setCreatedTicketId(newId);
        setFieldErrors({});

        // Reset form nội dung (giữ name & email)
        setSubject('');
        setMessage('');
        setRating(5);
        setPriority('medium');

        // Tải lại lịch sử ticket
        if (currentUser) {
          fetchTicketHistory(currentUser.id, currentUser.email);
        } else {
          fetchTicketHistory(undefined, email.trim());
        }
      } else {
        sound.playError();
        setSubmitError(data.error || 'Có lỗi xảy ra khi tạo ticket. Vui lòng thử lại!');
      }
    } catch {
      sound.playError();
      setSubmitError('Lỗi kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicketId = (ticketId: string) => {
    sound.playClick();
    const formatted = ticketId.startsWith('#') ? ticketId : `#${ticketId}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(ticketId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 dark:bg-slate-900/70">
      {/* ============================================================== */}
      {/* HERO BANNER SECTION                                            */}
      {/* ============================================================== */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white pt-9 pb-14 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 dark:bg-slate-900/10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider shadow-xs dark:bg-slate-900/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Trung Tâm Hỗ Trợ & Trợ Lý Học Viên Meowlish</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            Cẩm Nang Hướng Dẫn, Trợ Lý AI & Phiếu Hỗ Trợ
          </h1>

          <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Khám phá trọn bộ phương pháp học tiếng Anh phản xạ, bí kíp chăm sóc thú cưng PixelFarm, tích lũy Coins và trao đổi tức thì cùng Trợ Lý AI hoặc gửi Ticket đến Ban Quản Trị!
          </p>

          {/* MAIN 3 NAVIGATION TABS */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            {/* Tab 1: Cẩm Nang */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('guide');
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-sm ${
                activeTab === 'guide'
                  ? 'bg-white text-emerald-900 shadow-md scale-102 dark:bg-slate-900 dark:text-emerald-200'
                  : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              <span>Cẩm Nang & Hướng Dẫn</span>
            </button>

            {/* Tab 2: Trợ Lý AI */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('ai');
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-sm ${
                activeTab === 'ai'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102 ring-2 ring-amber-300'
                  : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-white'
              }`}
            >
              <Bot className="w-4 h-4 text-slate-950 dark:text-slate-200" />
              <span className="flex items-center gap-1.5">
                <span>Trợ Lý Mèo AI 24/7</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold animate-pulse">
                  Tức thì
                </span>
              </span>
            </button>

            {/* Tab 3: Gửi Ticket & Lịch Sử */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('ticket');
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-sm ${
                activeTab === 'ticket'
                  ? 'bg-white text-indigo-900 shadow-md scale-102 dark:bg-slate-900 dark:text-indigo-200'
                  : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              <span className="flex items-center gap-1.5">
                <span>Gửi Ticket & Lịch Sử</span>
                {myTickets.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    {myTickets.length}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* MAIN CONTAINER CONTENT                                         */}
      {/* ============================================================== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-7 relative z-20">
        {/* ============================================================== */}
        {/* TAB 1: CẨM NANG & HƯỚNG DẪN SỬ DỤNG (KNOWLEDGE BASE)           */}
        {/* ============================================================== */}
        {activeTab === 'guide' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* SEARCH BAR & CATEGORY FILTER CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md space-y-4 dark:bg-slate-900 dark:border-white/10">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập từ khóa tìm kiếm (vd: kiếm coins, thú cưng đói, lego, 2fa, luyện nói, mật khẩu)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl pl-11 pr-24 py-3 text-xs sm:text-sm text-slate-900 outline-none transition shadow-inner dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900 dark:text-slate-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer dark:bg-slate-700 dark:text-slate-300"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Hot keyword chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Từ khóa hot:
                </span>
                {[
                  'Kiếm Coins',
                  'Đói thú cưng',
                  'Ngữ pháp Lego',
                  'Bảo mật 2FA',
                  'Luyện nói AI',
                  'Đóng băng streak',
                  'Quên mật khẩu',
                ].map((kw) => (
                  <button
                    key={kw}
                    onClick={() => {
                      sound.playClick();
                      setSearchQuery(kw);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-semibold transition cursor-pointer text-[11px] dark:bg-slate-800 hover:dark:bg-emerald-950 hover:dark:text-emerald-300 dark:text-slate-400"
                  >
                    #{kw}
                  </button>
                ))}
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                {[
                  { id: 'all', label: 'Tất cả chuyên mục', icon: '🌟' },
                  { id: 'study', label: 'Học tập hiệu quả', icon: '🎓' },
                  { id: 'pet', label: 'Nuôi & Nâng cấp Thú cưng', icon: '🐾' },
                  { id: 'coins', label: 'Tích lũy Coins & Shop', icon: '💎' },
                  { id: 'security', label: 'Bảo mật tài khoản & 2FA', icon: '🛡️' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCategory(cat.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RESULTS HEADER */}
            <div className="flex items-center justify-between px-1">
              <div className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300">
                Hiển thị {filteredFaqArticles.length} bài hướng dẫn
                {searchQuery && (
                  <span className="text-emerald-700 ml-1 dark:text-emerald-300">cho từ khóa &quot;{searchQuery}&quot;</span>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer dark:text-slate-400 hover:dark:text-slate-200"
                >
                  Xem tất cả
                </button>
              )}
            </div>

            {/* ARTICLES ACCORDION LIST */}
            {filteredFaqArticles.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-white/10">
                <div className="text-4xl">🔍</div>
                <h3 className="font-black text-base text-slate-800 dark:text-slate-200">
                  Không tìm thấy bài viết phù hợp với &quot;{searchQuery}&quot;
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto dark:text-slate-400">
                  Bạn có thể thử tìm kiếm với từ khóa khác, hoặc bấm sang tab{' '}
                  <strong>Trợ Lý Mèo AI 24/7</strong> để được giải đáp ngay lập tức!
                </p>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('ai');
                    setInputQuestion(searchQuery);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Hỏi Trợ Lý AI Về &quot;{searchQuery}&quot;</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqArticles.map((article) => {
                  const isOpen = openFaqId === article.id;
                  let categoryBadgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  let categoryName = 'Tổng quan';
                  if (article.category === 'study') {
                    categoryBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
                    categoryName = 'Học tập hiệu quả';
                  } else if (article.category === 'pet') {
                    categoryBadgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200';
                    categoryName = 'Thú cưng PixelFarm';
                  } else if (article.category === 'coins') {
                    categoryBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
                    categoryName = 'Coins & Cửa Hàng';
                  } else if (article.category === 'security') {
                    categoryBadgeColor = 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200';
                    categoryName = 'Bảo mật & 2FA';
                  }

                  return (
                    <div
                      key={article.id}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden dark:bg-slate-900 dark:border-white/10 hover:dark:border-white/10"
                    >
                      <button
                        onClick={() => {
                          sound.playClick();
                          setOpenFaqId(isOpen ? null : article.id);
                        }}
                        className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 sm:gap-4 cursor-pointer hover:bg-slate-50/70 transition hover:dark:bg-slate-900/70"
                      >
                        <div className="flex items-start gap-3 sm:gap-3.5">
                          <span className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl shrink-0 dark:bg-slate-800">
                            {article.icon}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryBadgeColor}`}>
                                {categoryName}
                              </span>
                            </div>
                            <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-snug dark:text-slate-100">
                              {article.title}
                            </h3>
                            <p className="text-slate-500 text-[11px] sm:text-xs line-clamp-1 dark:text-slate-400">
                              {article.summary}
                            </p>
                          </div>
                        </div>

                        <div className="p-1 rounded-xl bg-slate-100 text-slate-500 shrink-0 mt-1 dark:bg-slate-800 dark:text-slate-400">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3 animate-in fade-in duration-150 dark:border-white/10 dark:bg-slate-900/50">
                          <div className="space-y-2 text-xs text-slate-700 leading-relaxed dark:text-slate-300">
                            {article.content.map((paragraph, pIdx) => (
                              <p key={pIdx}>{paragraph}</p>
                            ))}
                          </div>

                          {article.actionLink && (
                            <div className="pt-2">
                              <Link
                                href={article.actionLink}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs"
                              >
                                <span>{article.actionText || 'Khám phá ngay'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TRỢ LÝ MÈO AI 24/7 (AI ASSISTANT CHAT)                   */}
        {/* ============================================================== */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[720px] max-h-[85vh] animate-in fade-in duration-200 dark:bg-slate-900 dark:border-white/10">
            {/* Chat Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md ring-2 ring-white/20">
                  🐱
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-sm sm:text-base text-white">
                      Trợ Lý Mèo Meowlish AI
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Trực tuyến 24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sử dụng công nghệ AI Groq LPU & Google Gemini • Phản hồi tức thì
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setChatMessages([
                    {
                      id: 'welcome',
                      role: 'assistant',
                      content:
                        'Meow! Chào bạn! Mình đã sẵn sàng lắng nghe mọi câu hỏi mới của bạn về Meowlish rồi nhé! 🐱✨',
                      provider: 'groq',
                      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    },
                  ]);
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700 dark:bg-white/80 dark:border-white/10 dark:text-slate-800"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>

            {/* Quick Prompts Carousel Bar */}
            <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 overflow-x-auto touch-auto flex items-center gap-2 custom-scrollbar dark:bg-slate-800/90 dark:border-white/10">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 dark:text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Gợi ý hỏi nhanh:
              </span>
              {[
                { label: '💰 Kiếm nhiều xu nhanh nhất?', text: 'Làm sao để kiếm nhiều xu nhất trên Meowlish?' },
                { label: '🐾 Thú cưng đói làm gì?', text: 'Thú cưng bị đói thì phải làm gì để cho ăn?' },
                { label: '🧩 Ngữ Pháp Lego là gì?', text: 'Phương pháp học Ngữ Pháp Lego hoạt động thế nào?' },
                { label: '📝 Làm bài kiểm tra ở đâu?', text: 'Làm bài kiểm tra và thi thử TOEIC/IELTS ở đâu?' },
                { label: '🔒 Bật bảo mật 2FA?', text: 'Làm thế nào để bật bảo mật 2FA qua email?' },
                { label: '🔥 Giữ ngọn lửa Streak?', text: 'Mẹo giữ Streak và đóng băng streak khi bận rộn?' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiMessage(chip.text)}
                  disabled={isAiLoading}
                  className="shrink-0 px-3 py-1 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer disabled:opacity-50 dark:bg-slate-900 hover:dark:bg-emerald-950 hover:dark:text-emerald-200 hover:dark:border-emerald-800 dark:text-slate-300 dark:border-white/10"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Body */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50"
            >
              {chatMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 sm:gap-3 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs ${
                        isUser
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-amber-400 text-slate-950 font-black'
                      }`}
                    >
                      {isUser ? '👤' : '🐱'}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs dark:bg-slate-900 dark:border-white/10 dark:text-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Footer: Time & Source badge */}
                      <div
                        className={`flex items-center gap-2 mt-2 pt-1 border-t text-[10px] ${
                          isUser
                            ? 'border-white/20 text-emerald-100 justify-end'
                            : 'border-slate-100 text-slate-400 justify-between dark:border-white/10'
                        }`}
                      >
                        {!isUser && (
                          <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                            {msg.provider === 'groq' && '⚡ Groq LPU Siêu Tốc'}
                            {msg.provider === 'gemini' && '🤖 Google Gemini AI'}
                            {msg.provider === 'offline_kb' && '📖 Tri Thức Meowlish'}
                            {msg.provider === 'error_fallback' && '💡 Ban Quản Trị'}
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isAiLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-sm shrink-0 shadow-xs animate-bounce">
                    🐱
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-600 shadow-xs flex items-center gap-2 dark:bg-slate-900 dark:border-white/10 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                    </div>
                    <span>Meowlish đang tổng hợp câu trả lời cho bạn...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Gõ câu hỏi thắc mắc của bạn (vd: Thú cưng đói làm gì, cách kiếm coins, ngữ pháp lego)..."
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none transition dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900 dark:text-slate-100"
                  disabled={isAiLoading}
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !inputQuestion.trim()}
                  className="px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GỬI TICKET GÓP Ý & LỊCH SỬ PHIẾU HỖ TRỢ                 */}
        {/* ============================================================== */}
        {activeTab === 'ticket' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* SUB-TAB NAVIGATOR */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit mx-auto sm:mx-0 shadow-inner dark:bg-slate-700/80">
              <button
                onClick={() => {
                  sound.playClick();
                  setTicketSubTab('create');
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  ticketSubTab === 'create'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:dark:text-slate-100'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                <span>Gửi Phiếu Hỗ Trợ Mới</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setTicketSubTab('history');
                  if (currentUser) {
                    fetchTicketHistory(currentUser.id, currentUser.email);
                  }
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  ticketSubTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:dark:text-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                <span>Lịch Sử Phiếu Hỗ Trợ ({myTickets.length})</span>
              </button>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SUB-TAB 1: GỬI PHIẾU HỖ TRỢ MỚI                            */}
            {/* ---------------------------------------------------------- */}
            {ticketSubTab === 'create' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 dark:bg-slate-900 dark:border-white/10">
                <div className="border-b border-slate-100 pb-4 dark:border-white/10">
                  <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-wider mb-1 dark:text-indigo-300">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Hệ Thống Tiếp Nhận Ý Kiến & Báo Lỗi</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    Tạo Phiếu Hỗ Trợ Chuẩn #TK-XXXX
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                    Phiếu sẽ được mã hóa, lưu an toàn vào CSDL, đồng bộ đám mây S3 Filebase và gửi thông báo tức thì đến Ban Quản Trị (/duahau).
                  </p>
                </div>

                {/* Notifications */}
                {submitSuccess && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold space-y-2 animate-in fade-in dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
                  >
                    <div className="flex items-center gap-2 text-emerald-900 font-black dark:text-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 dark:text-emerald-300" />
                      <span>{submitSuccess}</span>
                    </div>

                    {createdTicketId && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-200/80">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-700 dark:text-emerald-300">Mã phiếu hỗ trợ:</span>
                          <span className="font-mono text-xs sm:text-sm px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black tracking-wider">
                            #{createdTicketId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyTicketId(createdTicketId)}
                            className="px-3 py-1 rounded-xl bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer flex items-center gap-1 dark:bg-slate-900 dark:text-emerald-200 dark:border-emerald-800 hover:dark:bg-emerald-950"
                          >
                            {copiedId === createdTicketId ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === createdTicketId ? 'Đã sao chép' : 'Sao chép mã'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setTicketSubTab('history');
                            }}
                            className="px-3 py-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Xem Lịch Sử Phiếu</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {submitError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 dark:text-rose-300" />
                    <div className="space-y-1.5 min-w-0">
                      <p className="leading-relaxed">{submitError}</p>
                      {Object.keys(fieldErrors).length > 0 && (
                        <ul className="list-disc pl-4 space-y-1 font-semibold">
                          {TICKET_FIELD_ORDER.map((key) =>
                            fieldErrors[key] ? (
                              <li key={key} className="leading-relaxed">
                                {fieldErrors[key]}
                              </li>
                            ) : null
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitFeedback} noValidate className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label
                      htmlFor="ticket-category-group"
                      className="block text-xs font-black text-slate-700 mb-2 dark:text-slate-300"
                    >
                      1. Chọn danh mục yêu cầu:
                    </label>
                    <div
                      id="ticket-category-group"
                      aria-describedby={fieldErrors.category ? 'support-error-category' : undefined}
                      aria-invalid={fieldErrors.category ? true : undefined}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'feedback', label: 'Góp ý tính năng', emoji: '💡', desc: 'Ý tưởng mới cho website' },
                          { id: 'bug', label: 'Báo lỗi kỹ thuật', emoji: '🐞', desc: 'Gặp trục trặc, lỗi giao diện' },
                          { id: 'guide', label: 'Thắc mắc học tập', emoji: '📖', desc: 'Cần hỗ trợ về bài học' },
                          { id: 'account', label: 'Tài khoản & Bảo mật', emoji: '🔒', desc: 'Quên mật khẩu, đổi 2FA' },
                        ].map((cat) => (
                          <button
                            type="button"
                            key={cat.id}
                            aria-pressed={category === cat.id}
                            onClick={() => {
                              sound.playClick();
                              setCategory(cat.id as any);
                              clearFieldError('category');
                            }}
                            className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col gap-1 ${
                              category === cat.id
                                ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-2 ring-indigo-200 dark:text-indigo-200'
                                : fieldErrors.category
                                  ? 'border-rose-400 bg-white text-slate-600 hover:border-rose-500 dark:border-rose-600 dark:bg-slate-900 dark:text-rose-200'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 hover:dark:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-black text-xs">
                              <span className="text-base">{cat.emoji}</span>
                              <span>{cat.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{cat.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {fieldErrors.category && (
                      <p
                        id="support-error-category"
                        className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.category}</span>
                      </p>
                    )}
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2 dark:text-slate-300">
                      2. Mức độ ưu tiên:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'low', label: 'Thấp', emoji: '🟢', desc: 'Góp ý tham khảo' },
                        { id: 'medium', label: 'Trung bình', emoji: '🟡', desc: 'Thắc mắc chung' },
                        { id: 'high', label: 'Cao', emoji: '🟠', desc: 'Ảnh hưởng học tập' },
                        { id: 'urgent', label: 'Khẩn cấp', emoji: '🔴', desc: 'Lỗi chặn tính năng' },
                      ].map((prio) => (
                        <button
                          type="button"
                          key={prio.id}
                          onClick={() => {
                            sound.playClick();
                            setPriority(prio.id as any);
                          }}
                          className={`p-2.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between ${
                            priority === prio.id
                              ? 'border-indigo-600 bg-white text-slate-900 shadow-xs ring-2 ring-indigo-200 dark:bg-slate-900 dark:text-slate-100'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 hover:dark:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span>{prio.emoji}</span>
                            <span>{prio.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                            {prio.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ticket-name"
                        className={`block text-xs font-black mb-1.5 dark:text-slate-300 ${
                          fieldErrors.name ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700'
                        }`}
                      >
                        Họ và tên của bạn:
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="ticket-name"
                          ref={nameRef}
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            clearFieldError('name');
                          }}
                          placeholder="Ví dụ: Nguyễn Văn Minh"
                          aria-invalid={fieldErrors.name ? true : undefined}
                          aria-describedby={fieldErrors.name ? 'support-error-name' : undefined}
                          className={`w-full bg-slate-50 border rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition dark:text-slate-100 ${
                            fieldErrors.name
                              ? 'border-rose-400 focus:border-rose-500 focus:bg-white ring-2 ring-rose-200 dark:bg-slate-900 dark:border-rose-500 dark:focus:bg-slate-900 dark:ring-rose-900/60'
                              : 'border-slate-200 focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:focus:bg-slate-900'
                          }`}
                          required
                        />
                      </div>
                      {fieldErrors.name && (
                        <p
                          id="support-error-name"
                          className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.name}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="ticket-email"
                        className={`block text-xs font-black mb-1.5 dark:text-slate-300 ${
                          fieldErrors.email ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700'
                        }`}
                      >
                        Email nhận xác nhận & phản hồi:
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="ticket-email"
                          ref={emailRef}
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearFieldError('email');
                          }}
                          placeholder="ban@gmail.com"
                          aria-invalid={fieldErrors.email ? true : undefined}
                          aria-describedby={fieldErrors.email ? 'support-error-email' : undefined}
                          className={`w-full bg-slate-50 border rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition dark:text-slate-100 ${
                            fieldErrors.email
                              ? 'border-rose-400 focus:border-rose-500 focus:bg-white ring-2 ring-rose-200 dark:bg-slate-900 dark:border-rose-500 dark:focus:bg-slate-900 dark:ring-rose-900/60'
                              : 'border-slate-200 focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:focus:bg-slate-900'
                          }`}
                          required
                        />
                      </div>
                      {fieldErrors.email && (
                        <p
                          id="support-error-email"
                          className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5 dark:text-slate-300">
                      Mức độ hài lòng của bạn về trải nghiệm website:
                    </label>
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 w-fit dark:bg-slate-900 dark:border-white/10">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => {
                            sound.playClick();
                            setRating(s);
                          }}
                          className="p-1 cursor-pointer transition transform hover:scale-120 active:scale-95"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2 dark:text-slate-400">
                        {rating === 5 && 'Tuyệt vời! 🌟'}
                        {rating === 4 && 'Rất tốt 👍'}
                        {rating === 3 && 'Bình thường 👌'}
                        {rating === 2 && 'Cần cải thiện thêm 🛠️'}
                        {rating === 1 && 'Chưa hài lòng 😞'}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="ticket-subject"
                      className={`block text-xs font-black mb-1.5 dark:text-slate-300 ${
                        fieldErrors.subject ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700'
                      }`}
                    >
                      Tiêu đề phiếu hỗ trợ:
                    </label>
                    <input
                      id="ticket-subject"
                      ref={subjectRef}
                      type="text"
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        clearFieldError('subject');
                      }}
                      placeholder="Tóm tắt ngắn gọn vấn đề (vd: Không mở khóa được cảnh quan Vườn Xanh)"
                      aria-invalid={fieldErrors.subject ? true : undefined}
                      aria-describedby={fieldErrors.subject ? 'support-error-subject' : undefined}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition dark:text-slate-100 ${
                        fieldErrors.subject
                          ? 'border-rose-400 focus:border-rose-500 focus:bg-white ring-2 ring-rose-200 dark:bg-slate-900 dark:border-rose-500 dark:focus:bg-slate-900 dark:ring-rose-900/60'
                          : 'border-slate-200 focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:focus:bg-slate-900'
                      }`}
                      required
                    />
                    {fieldErrors.subject && (
                      <p
                        id="support-error-subject"
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.subject}</span>
                      </p>
                    )}
                  </div>

                  {/* Message Detail */}
                  <div>
                    <label
                      htmlFor="ticket-message"
                      className={`block text-xs font-black mb-1.5 dark:text-slate-300 ${
                        fieldErrors.message ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700'
                      }`}
                    >
                      Mô tả chi tiết nội dung:
                    </label>
                    <textarea
                      id="ticket-message"
                      ref={messageRef}
                      rows={4}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        clearFieldError('message');
                      }}
                      placeholder="Mô tả cụ thể các bước bạn thực hiện, đường dẫn trang web gặp sự cố hoặc ý tưởng tính năng mới..."
                      aria-invalid={fieldErrors.message ? true : undefined}
                      aria-describedby={`support-hint-message${fieldErrors.message ? ' support-error-message' : ''}`}
                      className={`w-full bg-slate-50 border rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 outline-none transition custom-scrollbar resize-none dark:text-slate-100 ${
                        fieldErrors.message
                          ? 'border-rose-400 focus:border-rose-500 focus:bg-white ring-2 ring-rose-200 dark:bg-slate-900 dark:border-rose-500 dark:focus:bg-slate-900 dark:ring-rose-900/60'
                          : 'border-slate-200 focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:focus:bg-slate-900'
                      }`}
                      required
                    />
                    <p id="support-hint-message" className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Tối thiểu {TICKET_MESSAGE_MIN} ký tự — hiện tại {message.trim().length} ký tự.
                    </p>
                    {fieldErrors.message && (
                      <p
                        id="support-error-message"
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    ref={submitButtonRef}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-11 py-3.5 scroll-mb-28 bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 text-center active:scale-98 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang mã hóa & gửi phiếu đến Ban Quản Trị...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Tạo Phiếu Hỗ Trợ & Gửi Đến Ban Quản Trị</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Khoảng đệm cho bottom-nav cố định trên mobile (lg:hidden) để
                    nút "Tạo Phiếu Hỗ Trợ" không bị đè khi cuộn tới cuối trang. */}
                <div aria-hidden="true" className="h-16 lg:hidden" />
              </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* SUB-TAB 2: LỊCH SỬ PHIẾU HỖ TRỢ                            */}
            {/* ---------------------------------------------------------- */}
            {ticketSubTab === 'history' && (
              <div className="space-y-4">
                {/* Search & Lookup Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 dark:bg-slate-900 dark:border-white/10">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchTicketHistory(undefined, undefined, historySearchQuery);
                        }
                      }}
                      placeholder="Tra cứu theo mã #TK-XXXX hoặc email..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none transition dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => fetchTicketHistory(undefined, undefined, historySearchQuery)}
                      disabled={isLoadingHistory}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Tra cứu</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setHistorySearchQuery('');
                        if (currentUser) {
                          fetchTicketHistory(currentUser.id, currentUser.email);
                        } else {
                          fetchTicketHistory(undefined, email);
                        }
                      }}
                      disabled={isLoadingHistory}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-slate-300"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>
                </div>

                {/* Tickets List */}
                {isLoadingHistory ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-white/10">
                    <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto dark:text-indigo-300" />
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Đang tải danh sách phiếu hỗ trợ của bạn...
                    </div>
                  </div>
                ) : historyError ? (
                  <div className="bg-amber-50 rounded-3xl p-8 text-center border border-amber-200 shadow-sm space-y-2 dark:bg-amber-950/30 dark:border-amber-800">
                    <div className="text-3xl">⚠️</div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-300">{historyError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setHistoryError('');
                        fetchTicketHistory(undefined, undefined, historySearchQuery);
                      }}
                      className="text-xs font-bold text-amber-900 underline min-h-[44px] dark:text-amber-200"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : myTickets.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-white/10">
                    <div className="text-4xl">📭</div>
                    <h3 className="font-black text-base text-slate-800 dark:text-slate-200">
                      Bạn chưa có phiếu hỗ trợ nào trong danh sách
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto dark:text-slate-400">
                      Nếu bạn từng gửi phiếu hỗ trợ bằng email khác hoặc có mã ticket riêng, hãy nhập vào ô tra cứu phía trên nhé!
                    </p>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setTicketSubTab('create');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tạo Phiếu Hỗ Trợ Đầu Tiên</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Khách chưa đăng nhập chỉ thấy metadata. Phải nói rõ lý do,
                        nếu không các phiếu hiện ra trống trơn như lỗi ứng dụng. */}
                    {historyRedacted && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                        <span className="text-xl leading-none" aria-hidden="true">🔒</span>
                        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-2">
                          <p className="font-bold">
                            Bạn đang xem danh sách rút gọn — nội dung phiếu và trả lời của Ban
                            Quản Trị chỉ hiển thị với tài khoản đã đăng nhập.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
                            }}
                            className="font-black underline min-h-[44px]"
                          >
                            Đăng nhập để xem đầy đủ
                          </button>
                        </div>
                      </div>
                    )}
                    {myTickets.map((ticket) => {
                      const formattedCode = ticket.id.startsWith('#') ? ticket.id : `#${ticket.id}`;
                      let categoryBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10';
                      let categoryLabel = '💬 Khác';
                      if (ticket.category === 'feedback') {
                        categoryBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800';
                        categoryLabel = '💡 Góp ý tính năng';
                      } else if (ticket.category === 'bug') {
                        categoryBadgeColor = 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800';
                        categoryLabel = '🐞 Báo lỗi kỹ thuật';
                      } else if (ticket.category === 'guide') {
                        categoryBadgeColor = 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800';
                        categoryLabel = '📖 Thắc mắc học tập';
                      } else if (ticket.category === 'account') {
                        categoryBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800';
                        categoryLabel = '🔒 Tài khoản & Bảo mật';
                      }

                      let prioBadge = null;
                      if (ticket.priority === 'urgent') {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                            🔴 Khẩn cấp
                          </span>
                        );
                      } else if (ticket.priority === 'high') {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                            🟠 Ưu tiên cao
                          </span>
                        );
                      } else if (ticket.priority === 'low') {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                            🟢 Thấp
                          </span>
                        );
                      } else {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                            🟡 Trung bình
                          </span>
                        );
                      }

                      return (
                        <div
                          key={ticket.id}
                          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4 dark:bg-slate-900 dark:border-white/10 hover:dark:border-white/10"
                        >
                          {/* Top Header Card */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-white/10">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Ticket ID & Copy */}
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs font-black tracking-wider dark:bg-white">
                                <span>{formattedCode}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTicketId(ticket.id)}
                                  className="text-slate-400 hover:text-white transition cursor-pointer"
                                  title="Sao chép mã ticket"
                                >
                                  {copiedId === ticket.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {/* Category Badge */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${categoryBadgeColor}`}>
                                {categoryLabel}
                              </span>

                              {/* Priority Badge */}
                              {prioBadge}

                              {/* Status Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 ${
                                  ticket.status === 'new'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                    : ticket.status === 'processing'
                                    ? 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    ticket.status === 'new'
                                      ? 'bg-amber-500 animate-pulse'
                                      : ticket.status === 'processing'
                                      ? 'bg-sky-500 animate-pulse'
                                      : 'bg-emerald-500'
                                  }`}
                                />
                                {ticket.status === 'new'
                                  ? 'Chờ tiếp nhận'
                                  : ticket.status === 'processing'
                                  ? 'Đang xử lý'
                                  : 'Đã giải quyết'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 font-mono">
                              {new Date(ticket.created_at).toLocaleString('vi-VN')}
                            </div>
                          </div>

                          {/* Ticket Content */}
                          <div className="space-y-2">
                            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">
                              {ticket.subject}
                            </h3>
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap dark:bg-slate-900 dark:text-slate-300">
                              {ticket.message}
                            </div>
                          </div>

                          {/* Official Admin Reply Section */}
                          {ticket.admin_reply ? (
                            <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border-2 border-emerald-400 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-xs dark:from-emerald-950 dark:to-teal-950 dark:border-emerald-800">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shadow-xs">
                                    🍉
                                  </span>
                                  <span className="font-black text-xs text-emerald-950 uppercase tracking-wider dark:text-emerald-200">
                                    Phản Hồi Chính Thức Từ Ban Quản Trị
                                  </span>
                                </div>
                                {ticket.resolved_at && (
                                  <span className="text-[10px] font-mono text-emerald-700 font-bold dark:text-emerald-300">
                                    Giải quyết lúc: {new Date(ticket.resolved_at).toLocaleString('vi-VN')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-emerald-900 leading-relaxed whitespace-pre-wrap font-medium dark:text-emerald-200">
                                {ticket.admin_reply}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2 font-medium dark:text-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 dark:text-amber-300" />
                              <span>
                                Ban Quản Trị đã nhận được phiếu và đang tiến hành xử lý. Bạn sẽ nhận được thông báo qua email khi có câu trả lời!
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

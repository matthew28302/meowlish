'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Library,
  BookOpen,
  Sparkles,
  Mic,
  PenTool,
  Headphones,
  Heart,
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
  Sparkle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/soundFx';
import { getCurrentUser, AuthUser } from '@/lib/auth';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'guide' | 'feedback'>('guide');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [category, setCategory] = useState<'feedback' | 'bug' | 'guide' | 'other'>('feedback');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [rating, setRating] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.display_name) setName(user.display_name);
      if (user.email) setEmail(user.email);
    }
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!name.trim()) {
      setSubmitError('Vui lòng nhập họ và tên của bạn.');
      sound.playWrong();
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setSubmitError('Vui lòng nhập địa chỉ email hợp lệ để chúng mình có thể phản hồi.');
      sound.playWrong();
      return;
    }

    if (!subject.trim()) {
      setSubmitError('Vui lòng nhập tiêu đề góp ý.');
      sound.playWrong();
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setSubmitError('Nội dung góp ý cần ít nhất 10 ký tự để mô tả rõ ràng hơn.');
      sound.playWrong();
      return;
    }

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
          subject: subject.trim(),
          message: message.trim(),
          rating,
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        sound.playCelebration();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
        });

        setSubmitSuccess(data.message || 'Góp ý của bạn đã được gửi thành công đến Ban Quản Trị và email quản trị viên!');
        setTicketId(data.ticketId || null);

        // Reset form content (giữ lại name & email)
        setSubject('');
        setMessage('');
        setRating(5);
      } else {
        sound.playError();
        setSubmitError(data.error || 'Có lỗi xảy ra khi gửi góp ý. Vui lòng thử lại!');
      }
    } catch {
      sound.playError();
      setSubmitError('Lỗi kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqList = [
    {
      q: 'Làm thế nào để học và tích lũy Coins trên Meowlish?',
      a: 'Bạn có thể tích lũy Coins bằng cách hoàn thành bài học Từ Vựng, luyện Ngữ Pháp Lego, làm bài test trắc nghiệm, và luyện Nói/Nghe. Ngoài ra, chăm sóc thú cưng và duy trì chuỗi Streak mỗi ngày sẽ đem lại lượng Coins thưởng rất lớn!',
    },
    {
      q: 'Ngữ Pháp Lego hoạt động như thế nào?',
      a: 'Ngữ Pháp Lego chia câu tiếng Anh thành các khối màu sắc trực quan (Chủ ngữ màu xanh, Động từ màu cam, Tân ngữ màu tím...). Bạn chỉ cần kéo ghép các khối theo đúng trật tự câu, giúp não bộ ghi nhớ cấu trúc tự nhiên mà không cần học thuộc lòng công thức khô khan.',
    },
    {
      q: 'Luyện Nói AI Voice có cần micro chuyên dụng không?',
      a: 'Không cần! Bạn có thể sử dụng micro tích hợp sẵn trên điện thoại hoặc tai nghe thông thường. Hệ thống AI Voice sẽ tự động phân tích khẩu hình âm tiết và đối chiếu với chuẩn phiên âm quốc tế IPA để chấm điểm độ chuẩn xác.',
    },
    {
      q: 'Tôi bị mất mật khẩu thì phải làm sao?',
      a: 'Bạn chỉ cần bấm nút "Đăng Nhập" ở góc phải màn hình, chọn "Quên mật khẩu?", sau đó nhập tên đăng nhập hoặc email. Hệ thống sẽ gửi thư xác thực đến email của bạn để đặt lại mật khẩu mới an toàn.',
    },
    {
      q: 'Dữ liệu học tập của tôi có bị mất khi đổi thiết bị không?',
      a: 'Không! Toàn bộ tiến độ học tập, số dư Coins, trang phục thú cưng và sổ từ vựng Bookmark của bạn đều được đồng bộ thời gian thực lên máy chủ bảo mật và sao lưu đám mây Filebase S3.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* HERO BANNER */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white pt-8 pb-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Trung Tâm Hỗ Trợ Học Viên Meowlish</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            Cẩm Nang Hướng Dẫn & Hộp Thư Góp Ý
          </h1>

          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Khám phá phương pháp học tiếng Anh phản xạ chuẩn bản xứ, làm chủ nông trại thú cưng và đóng góp ý kiến để cùng xây dựng Meowlish ngày càng tuyệt vời hơn!
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('guide');
              }}
              className={`px-4 sm:px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-sm ${
                activeTab === 'guide'
                  ? 'bg-white text-emerald-800 shadow-md scale-102'
                  : 'bg-emerald-800/50 hover:bg-emerald-800/80 text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Cẩm Nang & Hướng Dẫn</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('feedback');
              }}
              className={`px-4 sm:px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-sm ${
                activeTab === 'feedback'
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-102'
                  : 'bg-emerald-800/50 hover:bg-emerald-800/80 text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Góp Ý & Báo Lỗi</span>
            </button>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">
        {/* ============================================================== */}
        {/* TAB 1: CẨM NANG & HƯỚNG DẪN SỬ DỤNG WEBSITE                    */}
        {/* ============================================================== */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            {/* FEATURE GUIDES GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Lộ Trình & Từ Vựng */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl">
                  📚
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Lộ Trình & Bách Khoa 26.500+ Từ
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Từ vựng được phân loại khoa học theo chuẩn khung tham chiếu Châu Âu CEFR (A1 đến C2). Tích hợp phát âm chuẩn IPA, giải nghĩa song ngữ Anh - Việt thực chiến, cụm collocations và ví dụ tình huống văn phòng IT.
                </p>
                <div className="pt-1">
                  <Link
                    href="/encyclopedia"
                    className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Khám phá từ điển</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Ngữ Pháp Lego */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
                  🧩
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Ngữ Pháp Lego Ghép Khối Trực Quan
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Phương pháp độc quyền biến các quy tắc ngữ pháp phức tạp thành các khối màu sắc. Học cách thành lập câu khẳng định, phủ định, câu điều kiện và thì tiếng Anh một cách trực quan, sinh động như chơi trò chơi Lego.
                </p>
                <div className="pt-1">
                  <Link
                    href="/grammar"
                    className="inline-flex items-center gap-1 text-xs font-black text-amber-700 hover:text-amber-800"
                  >
                    <span>Luyện Ngữ Pháp Lego</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Luyện Nói & Nghe AI Voice */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-2xl">
                  🎙️
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Luyện Nói AI Voice & Nghe Tốc Độ
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Luyện nói phản xạ với công nghệ AI Speech Recognition trực tiếp. Hệ thống nhận diện từng nguyên âm, phụ âm và nối âm, chấm điểm độ lưu loát giúp bạn tự tin giao tiếp trong các buổi họp Daily Standup và Scrum.
                </p>
                <div className="pt-1">
                  <Link
                    href="/practice/speaking"
                    className="inline-flex items-center gap-1 text-xs font-black text-sky-700 hover:text-sky-800"
                  >
                    <span>Thử giọng với AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 4: Nông Trại Thú Cưng PixelFarm */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-2xl">
                  🐾
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Nông Trại Thú Cưng & Cửa Hàng Thời Trang
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chọn bé cưng đồng hành: Cú Lexi, Mèo Mochi, Cún Taro, Cáo Kitsune. Chăm sóc bé no bụng, sắm nón phù thủy, áo thun dev, vương miện hoàng gia và đổi cảnh quan Vườn Xanh, Làng Lá, Đảo Hải Tặc!
                </p>
                <div className="pt-1">
                  <Link
                    href="/pet"
                    className="inline-flex items-center gap-1 text-xs font-black text-rose-700 hover:text-rose-800"
                  >
                    <span>Ghé thăm thú cưng</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* STREAK & COINS REWARD LOOP GUIDE */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-yellow-200 fill-yellow-200" />
                <h3 className="text-lg font-black tracking-tight">
                  Bí Quyết Duy Trì Streak & Kiếm Coins Thưởng
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                • <strong>Mỗi ngày học 1 bài:</strong> Chỉ cần hoàn thành tối thiểu 1 bài tập hoặc lật 5 thẻ Flashcard để giữ ngọn lửa Streak luôn bốc cháy rực rỡ.<br />
                • <strong>Nhận Coins thưởng:</strong> Mỗi câu trả lời đúng và mỗi ngày duy trì streak sẽ tặng thêm hàng trăm Coins.<br />
                • <strong>Tặng Xu Miễn Phí:</strong> Đừng quên ghé mục Thú Cưng để nhận thêm +500 Coins miễn phí mỗi ngày sắm đồ cho bé cưng!
              </p>
            </div>

            {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">
                  Câu Hỏi Thường Gặp (FAQ)
                </h3>
              </div>

              <div className="space-y-3">
                {faqList.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition"
                    >
                      <button
                        onClick={() => {
                          sound.playClick();
                          setOpenFaq(isOpen ? null : idx);
                        }}
                        className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item.q}</span>
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: GÓP Ý & BÁO LỖI WEBSITE (GỬI VỀ ADMIN & EMAIL)          */}
        {/* ============================================================== */}
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase tracking-wider mb-1">
                <Send className="w-3.5 h-3.5" />
                <span>Hộp Thư Đóng Góp Ý Kiến</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Gửi Góp Ý & Báo Lỗi Cho Ban Quản Trị
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mọi đóng góp của bạn sẽ được chuyển thẳng đến trang quản trị viên (/duahau) và gửi thông báo qua email quản trị viên.
              </p>
            </div>

            {/* Notifications */}
            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div>{submitSuccess}</div>
                  {ticketId && (
                    <div className="text-[11px] font-mono text-emerald-700 mt-1">
                      Mã phiếu hỗ trợ: <strong>{ticketId}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Category Pills */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">
                  Loại yêu cầu / đóng góp:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'feedback', label: 'Góp ý tính năng', emoji: '💡', color: 'emerald' },
                    { id: 'bug', label: 'Báo lỗi website', emoji: '🐞', color: 'rose' },
                    { id: 'guide', label: 'Hỏi hướng dẫn', emoji: '❓', color: 'sky' },
                    { id: 'other', label: 'Ý kiến khác', emoji: '💬', color: 'purple' },
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        sound.playClick();
                        setCategory(cat.id as any);
                      }}
                      className={`p-2.5 rounded-2xl border-2 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        category === cat.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    Họ và tên của bạn:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn Minh"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    Email nhận phản hồi:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  Mức độ hài lòng của bạn về website:
                </label>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 w-fit">
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
                          s <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">
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
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  Tiêu đề góp ý:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ví dụ: Đề xuất thêm chủ đề phỏng vấn IT cho mục Luyện Nói"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  Nội dung chi tiết:
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mô tả cụ thể mong muốn của bạn, các bước gặp lỗi hoặc ý tưởng mới để đội ngũ Meowlish hỗ trợ và cải tiến nhanh nhất..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl p-3.5 text-xs sm:text-sm text-slate-900 outline-none transition custom-scrollbar resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi đến Ban Quản Trị & Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Góp Ý Đến Ban Quản Trị</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

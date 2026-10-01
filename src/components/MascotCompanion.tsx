'use client';

import React, { useState } from 'react';
import { Sparkles, MessageCircleHeart } from 'lucide-react';
import { sound } from '@/lib/soundFx';

interface MascotProps {
  mood?: 'happy' | 'cheering' | 'focused' | 'proud';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MascotCompanion({
  mood = 'happy',
  message = 'Hôm nay hãy học thêm 3 cụm từ mới để duy trì chuỗi Streak nhé!',
  size = 'md',
}: MascotProps) {
  const [clickCount, setClickCount] = useState(0);
  const [extraSpeech, setExtraSpeech] = useState<string | null>(null);

  const tips = [
    '💡 Khi bôi đen từ nào trên web, bạn có thể nghe phát âm và bấm Lưu Bookmark ngay đó!',
    '🔥 Luyện tập Nói 10 phút mỗi ngày giúp cơ miệng quen với phản xạ tiếng Anh bản xứ.',
    '🌟 Ngữ pháp không cần học thuộc vẹt, hãy nhớ câu mẫu theo tình huống IT thực tế!',
    '🚀 Đừng sợ phát âm sai, Lexi sẽ luôn đồng hành sửa từng từ cùng bạn!',
    '🎯 Mục từ Cambridge được crawler trực tiếp kèm cả audio MP3 bản ngữ chuẩn UK!',
  ];

  const handleMascotClick = () => {
    sound.playClick();
    const nextIdx = (clickCount + 1) % tips.length;
    setClickCount(nextIdx);
    setExtraSpeech(tips[nextIdx]);
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  return (
    <div className="relative inline-flex items-center gap-3 select-none">
      {/* Mascot Graphic (Lexi the Owl) */}
      <div
        onClick={handleMascotClick}
        className="relative group cursor-pointer transform hover:scale-105 active:scale-95 transition-transform"
        title="Bấm vào Lexi để nhận lời khuyên học tập!"
      >
        <div
          className={`${sizeClasses} bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 rounded-3xl p-1.5 shadow-lg border-2 border-emerald-300 flex items-center justify-center relative overflow-hidden animate-float-soft`}
        >
          {/* Eyes & Face SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Body */}
            <circle cx="50" cy="52" r="42" fill="#10b981" />
            <ellipse cx="50" cy="62" rx="28" ry="24" fill="#ecfdf5" />

            {/* Belly feathers pattern */}
            <path d="M 44 58 Q 50 62 56 58" stroke="#a7f3d0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 42 66 Q 50 70 58 66" stroke="#a7f3d0" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Eyes */}
            <circle cx="36" cy="40" r="14" fill="#ffffff" stroke="#047857" strokeWidth="2" />
            <circle cx="64" cy="40" r="14" fill="#ffffff" stroke="#047857" strokeWidth="2" />

            {/* Pupils with sparkle */}
            {mood === 'cheering' || mood === 'proud' ? (
              <>
                {/* Cheerful squint eyes */}
                <path d="M 28 42 Q 36 34 44 42" stroke="#047857" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M 56 42 Q 64 34 72 42" stroke="#047857" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx={mood === 'focused' ? 38 : 37} cy="40" r="7" fill="#0f172a" />
                <circle cx={mood === 'focused' ? 66 : 65} cy="40" r="7" fill="#0f172a" />
                {/* Light reflection */}
                <circle cx="35" cy="37" r="2.5" fill="#ffffff" />
                <circle cx="63" cy="37" r="2.5" fill="#ffffff" />
                <circle cx="39" cy="42" r="1" fill="#ffffff" />
                <circle cx="67" cy="42" r="1" fill="#ffffff" />
              </>
            )}

            {/* Beak */}
            <polygon points="50,44 43,53 57,53" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Cheeks blush */}
            <ellipse cx="24" cy="48" rx="6" ry="3.5" fill="#f43f5e" opacity="0.45" />
            <ellipse cx="76" cy="48" rx="6" ry="3.5" fill="#f43f5e" opacity="0.45" />

            {/* Graduation / Wisdom Cap */}
            <polygon points="50,11 22,23 50,29 78,23" fill="#1e293b" />
            <rect x="42" y="23" width="16" height="6" rx="2" fill="#0f172a" />
            <line x1="74" y1="23" x2="80" y2="38" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="39" r="2.5" fill="#f59e0b" />
          </svg>

          {/* Cheerful glow badge */}
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-1 shadow-md border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
          </div>
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="relative bg-white border-2 border-emerald-200 rounded-2xl px-4 py-2.5 shadow-sm max-w-sm sm:max-w-md text-xs sm:text-sm text-slate-700">
        <div className="flex items-center gap-1.5 font-black text-emerald-700 text-xs mb-0.5">
          <MessageCircleHeart className="w-3.5 h-3.5 text-rose-500" />
          Cú Lexi đồng hành
        </div>
        <p className="leading-snug text-slate-700 font-medium">
          {extraSpeech || message}
        </p>

        {/* Triangle arrow */}
        <div className="absolute -left-2 top-5 w-3 h-3 bg-white border-l-2 border-b-2 border-emerald-200 transform rotate-45" />
      </div>
    </div>
  );
}

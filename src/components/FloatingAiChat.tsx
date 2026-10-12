'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Send, RotateCcw, X } from 'lucide-react';
import { sound } from '@/lib/sound';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

/**
 * FloatingAiChat — Nút tròn nổi mở khung chat với Trợ Lý Mèo AI 24/7.
 *
 * Yêu cầu user: thay vì phải vào /support → tab "Trợ lý mèo AI 24/7" thì giờ
 * chat ngay tại mọi trang qua 1 nút tròn góc dưới-phải.
 *
 * - Dùng chung endpoint /api/support/ai (không cần đăng nhập, đã rate-limit).
 * - State giữ nguyên khi chuyển trang (mount trong AppShell, không unmount).
 * - Ẩn trên /support (trùng lặp với tab chat ở đó).
 * - Esc để đóng, focus input khi mở, aria đầy đủ.
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: 'groq' | 'gemini' | 'offline_kb' | 'error_fallback';
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Meow! Chào bạn học viên! Mình là **Trợ Lý Mèo AI Meowlish** 🐱✨ — trực tuyến 24/7. Hỏi mình bất cứ điều gì về học tiếng Anh, Coins, linh vật hay cách dùng Meowlish nhé!',
  provider: 'groq',
};

const QUICK_PROMPTS: string[] = [
  'Làm sao kiếm Coins nhanh?',
  'Linh vật đói thì làm sao?',
  'Ngữ pháp Lego dùng thế nào?',
  'Mẹo học từ vựng mỗi ngày',
];

function providerBadge(provider?: ChatMessage['provider']): string {
  switch (provider) {
    case 'groq':
      return '⚡ Groq LPU Siêu Tốc';
    case 'gemini':
      return '🤖 Google Gemini AI';
    case 'offline_kb':
      return '📖 Tri Thức Meowlish';
    default:
      return '💡 Ban Quản Trị';
  }
}

function formatMessage(content: string): string {
  return content
    .replace(/[\u0026<>]/g, (c) => (c === '\u0026' ? '\u0026amp;' : c === '\u003c' ? '\u0026lt;' : '\u0026gt;'))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

const FloatingAiChat: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasNewAnswer, setHasNewAnswer] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIdRef = useRef(0);
  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const hidden = pathname === '/support' || pathname?.startsWith('/duahau');
  useEscapeToClose(isOpen, () => setIsOpen(false));

  // Auto-scroll khi có tin nhắn mới — chỉ khi panel đang mở (chỉ thao tác DOM,
  // không setState trong effect để tránh cascading renders).
  useEffect(() => {
    if (isOpen) {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSendAiMessage = async (rawText?: string) => {
    const textToSend = (rawText ?? inputQuestion).trim();
    if (!textToSend || isAiLoading) return;
    sound.playClick();
    const userMsg: ChatMessage = {
      id: `u_${++msgIdRef.current}`,
      role: 'user',
      content: textToSend,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAiLoading(true);

    try {
      const history = chatMessages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/support/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history }),
      });
      const data = await res.json();
      const answer = String(data.answer || 'Meow... mình chưa rõ câu đó, bạn thử hỏi cách khác nhé! 🐾');

      if (res.ok && data.success) {
        sound.playSuccess();
        setChatMessages((prev) => [
          ...prev,
          {
            id: `a_${++msgIdRef.current}`,
            role: 'assistant',
            content: answer,
            provider: data.provider,
          },
        ]);
      } else {
        sound.playError();
        setChatMessages((prev) => [
          ...prev,
          {
            id: `a_${++msgIdRef.current}`,
            role: 'assistant',
            content: answer,
            provider: 'error_fallback',
          },
        ]);
      }
    } catch {
      sound.playError();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a_${++msgIdRef.current}`,
          role: 'assistant',
          content: 'Meow! Kết nối mạng giật một chút — bạn thử gửi lại giúp mình nhé! 🐾',
          provider: 'error_fallback',
        },
      ]);
    } finally {
      setIsAiLoading(false);
      // Nếu user gửi xong rồi thu nhỏ panel (hoặc gửi từ tab khác trong
      //        quick-chips) — báo chấm nhấp nháy trên nút để biết có câu trả lời.
      if (!isOpenRef.current) setHasNewAnswer(true);
    }
  };

  const resetChat = () => {
    sound.playClick();
    setChatMessages([{ ...WELCOME_MESSAGE }]);
  };

  const toggleOpen = () => {
    sound.playClick();
    const next = !isOpen;
    setIsOpen(next);
    if (next) setHasNewAnswer(false);
  };

  if (hidden) return null;

  return (
    <>
      {/* Nút tròn nổi */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Đóng khung chat Trợ Lý Mèo AI' : 'Mở chat với Trợ Lý Mèo AI 24/7'}
        aria-expanded={isOpen}
        data-testid="floating-ai-chat-button"
        className={`fixed right-4 sm:right-6 bottom-20 lg:bottom-6 z-[9000] w-14 h-14 rounded-full
          bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/40
          border-4 border-white dark:border-slate-900 cursor-pointer
          flex items-center justify-center text-3xl select-none
          hover:scale-110 active:scale-95 transition-transform
          ${isOpen ? 'rotate-90' : 'animate-[float-soft_3s_ease-in-out_infinite]'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : '🐱'}
        {!isOpen && (
          <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow">
            AI
          </span>
        )}
        {!isOpen && hasNewAnswer && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 animate-ping" />
        )}
      </button>

      {/* Khung chat */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat với Trợ Lý Mèo AI Meowlish"
          data-testid="floating-ai-chat-panel"
          className="fixed right-2 sm:right-6 bottom-36 lg:bottom-24 z-[9000]
            w-[calc(100vw-16px)] sm:w-[380px] h-[min(62vh,540px)]
            bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-100 dark:border-emerald-500/30
            flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">🐱</div>
              <div className="min-w-0">
                <div className="text-white font-black text-sm leading-tight truncate">Trợ Lý Mèo Meowlish AI</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-300 animate-pulse" />
                  <span className="text-emerald-50 text-[11px] font-bold">Trực tuyến 24/7</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={resetChat}
                title="Làm mới hội thoại"
                aria-label="Làm mới hội thoại"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng"
                aria-label="Đóng khung chat"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tin nhắn */}
          <div
            ref={chatScrollRef}
            data-testid="floating-ai-chat-messages"
            className="flex-1 overflow-y-auto overscroll-y-contain custom-scrollbar px-3 py-3 space-y-3 bg-slate-50 dark:bg-slate-950"
          >
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm shrink-0 shadow-sm">
                  {msg.role === 'user' ? '👤' : '🐱'}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  {msg.role === 'assistant' && (
                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 border-t border-slate-100 dark:border-slate-700/60 pt-1">
                      {providerBadge(msg.provider)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex gap-2" data-testid="floating-ai-chat-typing">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm shrink-0 shadow-sm">🐱</div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Gợi ý nhanh */}
          <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
            {QUICK_PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendAiMessage(chip)}
                disabled={isAiLoading}
                className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              maxLength={500}
              placeholder="Hỏi Trợ Lý Mèo bất cứ điều gì..."
              aria-label="Nhập câu hỏi cho Trợ Lý Mèo AI"
              data-testid="floating-ai-chat-input"
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 outline-none text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuestion.trim()}
              aria-label="Gửi câu hỏi"
              data-testid="floating-ai-chat-send"
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-40 disabled:hover:scale-100 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingAiChat;

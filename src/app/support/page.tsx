'use client';

import type { Metadata } from 'next';

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

/** CÃ¡c field cá»§a form táº¡o phiáº¿u há»— trá»£ cáº§n validate phÃ­a client */
type TicketFieldKey = 'category' | 'name' | 'email' | 'subject' | 'message';
type TicketFieldErrors = Partial<Record<TicketFieldKey, string>>;

/** Thá»© tá»± Æ°u tiÃªn khi focus + hiá»ƒn thá»‹ banner tá»•ng há»£p (theo thá»© tá»± trÃªn form) */
const TICKET_FIELD_ORDER: TicketFieldKey[] = ['category', 'name', 'email', 'subject', 'message'];

/** Email pháº£i khá»›p vá»›i regex server-side: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ */
const TICKET_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sá»‘ kÃ½ tá»± tá»‘i thiá»ƒu cho mÃ´ táº£ chi tiáº¿t */
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
  // TAB 1: KNOWLEDGE BASE (Cáº¨M NANG & HÆ¯á»šNG DáºªN)
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
        'Meow! ChÃ o báº¡n há»c viÃªn! MÃ¬nh lÃ  **Trá»£ LÃ½ MÃ¨o AI Meowlish** ðŸ±âœ¨.\n\nMÃ¬nh cÃ³ thá»ƒ giáº£i Ä‘Ã¡p ngay láº­p tá»©c cÃ¡ch kiáº¿m Coins, cÃ¡ch chÄƒm sÃ³c thÃº cÆ°ng khi Ä‘Ã³i, phÆ°Æ¡ng phÃ¡p há»c Ngá»¯ PhÃ¡p Lego, cÃ¡ch báº­t 2FA, máº¹o lÃ m bÃ i thi hoáº·c báº¥t ká»³ tháº¯c máº¯c nÃ o cá»§a báº¡n. Báº¡n cá»© tá»± nhiÃªn há»i nhÃ©!',
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

  // Refs Ä‘á»ƒ focus vÃ o field Ä‘áº§u tiÃªn bá»‹ lá»—i khi submit
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // History state
  const [myTickets, setMyTickets] = useState<TicketItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  // KhÃ¡ch chÆ°a Ä‘Äƒng nháº­p chá»‰ tháº¥y metadata phiáº¿u â€” cáº§n giáº£i thÃ­ch rÃµ thay vÃ¬
  // hiá»‡n card tráº¯ng trÆ¡n khiáº¿n tÆ°á»Ÿng á»©ng dá»¥ng lá»—i.
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
      // Tá»± Ä‘á»™ng táº£i lá»‹ch sá»­ ticket náº¿u Ä‘Ã£ Ä‘Äƒng nháº­p
      fetchTicketHistory(user.id, user.email);
    }
    return () => {
      confetti.reset();
    };
  }, []);

  // Tá»± Ä‘á»™ng cuá»™n chat xuá»‘ng Ä‘Ã¡y khi cÃ³ tin nháº¯n má»›i
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
        // Server chá»‰ tráº£ metadata cho khÃ¡ch chÆ°a Ä‘Äƒng nháº­p (Ä‘á»ƒ khÃ´ng lá»™ ná»™i
        // dung phiáº¿u cá»§a ngÆ°á»i khÃ¡c). KhÃ´ng cÃ³ cá» bÃ¡o thÃ¬ UI hiá»‡n má»™t card tráº¯ng
        // trÆ¡n: khÃ´ng tiÃªu Ä‘á», khÃ´ng ná»™i dung, khÃ´ng tráº£ lá»i admin â€” trÃ´ng nhÆ°
        // lá»—i mÃ  khÃ´ng cÃ³ lÃ½ do.
        setHistoryRedacted(Boolean(data.redacted));
        setHistoryError('');
      } else if (!res.ok) {
        setHistoryError(data.error || 'KhÃ´ng táº£i Ä‘Æ°á»£c lá»‹ch sá»­ phiáº¿u há»— trá»£.');
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
    // 1. Há»c táº­p hiá»‡u quáº£ (study)
    {
      id: 'study-1',
      category: 'study',
      icon: 'ðŸ“š',
      title: 'Lá»™ TrÃ¬nh Há»c Chuáº©n CEFR & BÃ¡ch Khoa 26.500+ Tá»« Vá»±ng',
      summary: 'KhÃ¡m phÃ¡ tá»« Ä‘iá»ƒn song ngá»¯ chuáº©n ChÃ¢u Ã‚u A1-C2, phÃ¡t Ã¢m IPA vÃ  collocations thá»±c chiáº¿n.',
      content: [
        'Há»‡ thá»‘ng tá»« vá»±ng trÃªn Meowlish Ä‘Æ°á»£c phÃ¢n cáº¥p khoa há»c tá»« sÆ¡ cáº¥p A1 Ä‘áº¿n cao cáº¥p C2 chuáº©n khung tham chiáº¿u ChÃ¢u Ã‚u.',
        'Má»—i tá»« Ä‘á»u tÃ­ch há»£p audio phÃ¡t Ã¢m chuáº©n IPA cá»§a ngÆ°á»i báº£n xá»© Anh - Má»¹, giáº£i nghÄ©a trá»±c quan kÃ¨m cÃ¡c cáº·p collocations vÃ  vÃ­ dá»¥ tÃ¬nh huá»‘ng vÄƒn phÃ²ng IT thá»±c chiáº¿n.',
        'Báº¡n cÃ³ thá»ƒ tÃ¬m kiáº¿m nhanh vÃ  lÆ°u tá»« vá»±ng yÃªu thÃ­ch vÃ o Sá»• tay tá»« vá»±ng Bookmark Ä‘á»ƒ Ã´n táº­p hÃ ng ngÃ y.',
      ],
      actionLink: '/encyclopedia',
      actionText: 'Tra cá»©u Tá»« Äiá»ƒn BÃ¡ch Khoa',
      tags: ['tá»« vá»±ng', 'cefr', 'ipa', 'phÃ¡t Ã¢m', 'bÃ¡ch khoa', 'tra tá»«', 'encyclopedia'],
    },
    {
      id: 'study-2',
      category: 'study',
      icon: 'ðŸ§©',
      title: 'PhÆ°Æ¡ng PhÃ¡p Ngá»¯ PhÃ¡p Lego GhÃ©p Khá»‘i Trá»±c Quan',
      summary: 'Há»c cÃ¡ch ghÃ©p cÃ¢u tiáº¿ng Anh báº±ng cÃ¡c khá»‘i mÃ u sáº¯c tá»± nhiÃªn mÃ  khÃ´ng cáº§n há»c váº¹t cÃ´ng thá»©c.',
      content: [
        'Ngá»¯ PhÃ¡p Lego chia nhá» cÃ¡c thÃ nh pháº§n ngá»¯ phÃ¡p thÃ nh cÃ¡c khá»‘i Lego mÃ u sáº¯c trá»±c quan:',
        'â€¢ Khá»‘i Xanh lÃ¡ (Green): Chá»§ ngá»¯ (Subject) - Ai lÃ m hÃ nh Ä‘á»™ng?',
        'â€¢ Khá»‘i Cam (Orange): Äá»™ng tá»« (Verb) - HÃ nh Ä‘á»™ng lÃ  gÃ¬?',
        'â€¢ Khá»‘i TÃ­m (Purple): TÃ¢n ngá»¯ (Object) - Nháº­n tÃ¡c Ä‘á»™ng nÃ o?',
        'â€¢ Khá»‘i VÃ ng (Yellow): Tráº¡ng tá»« (Adverb) - á»ž Ä‘Ã¢u, khi nÃ o, nhÆ° tháº¿ nÃ o?',
        'Báº¡n chá»‰ viá»‡c kÃ©o tháº£ cÃ¡c khá»‘i theo Ä‘Ãºng tráº­t tá»± tÆ° duy báº£n xá»©, nÃ£o bá»™ sáº½ ghi nhá»› cáº¥u trÃºc cÃ¢u má»™t cÃ¡ch tá»± Ä‘á»™ng vÃ  pháº£n xáº¡ tá»©c thÃ¬.',
      ],
      actionLink: '/grammar',
      actionText: 'Luyá»‡n Ngá»¯ PhÃ¡p Lego Ngay',
      tags: ['ngá»¯ phÃ¡p', 'lego', 'grammar', 'ghÃ©p cÃ¢u', 'khá»‘i mÃ u', 'cÃ´ng thá»©c'],
    },
    {
      id: 'study-3',
      category: 'study',
      icon: 'ðŸŽ™ï¸',
      title: 'Luyá»‡n NÃ³i AI Voice & Nháº­n Diá»‡n PhÃ¡t Ã‚m Chuáº©n XÃ¡c',
      summary: 'CÃ´ng nghá»‡ AI Speech Recognition trá»±c tiáº¿p cháº¥m Ä‘iá»ƒm Ä‘á»™ lÆ°u loÃ¡t vÃ  sá»­a lá»—i phÃ¡t Ã¢m tá»«ng Ã¢m tiáº¿t.',
      content: [
        'Báº¡n khÃ´ng cáº§n micro Ä‘áº¯t tiá»n, chá»‰ cáº§n micro tai nghe hoáº·c Ä‘iá»‡n thoáº¡i thÃ´ng thÆ°á»ng.',
        'Há»‡ thá»‘ng AI Voice phÃ¢n tÃ­ch kháº©u hÃ¬nh Ã¢m tiáº¿t vÃ  Ä‘á»‘i chiáº¿u chuáº©n phiÃªn Ã¢m quá»‘c táº¿ IPA theo thá»i gian thá»±c.',
        'Äáº·c biá»‡t cÃ³ cÃ¡c bÃ i luyá»‡n nÃ³i theo tÃ¬nh huá»‘ng thá»±c táº¿: Daily Standup, Sprint Planning, Demo sáº£n pháº©m vÃ  phá»ng váº¥n xin viá»‡c tiáº¿ng Anh.',
      ],
      actionLink: '/practice/speaking',
      actionText: 'Thá»­ Giá»ng CÃ¹ng AI Voice',
      tags: ['luyá»‡n nÃ³i', 'ai voice', 'phÃ¡t Ã¢m', 'speaking', 'standup', 'micro'],
    },
    {
      id: 'study-4',
      category: 'study',
      icon: 'ðŸ“',
      title: 'BÃ i Kiá»ƒm Tra Quiz & PhÃ²ng Thi Thá»­ Chuáº©n Quá»‘c Táº¿',
      summary: 'ÄÃ¡nh giÃ¡ nÄƒng lá»±c sau má»—i Unit vÃ  lÃ m quen Ä‘á»‹nh dáº¡ng Ä‘á» thi TOEIC, IELTS thá»±c chiáº¿n.',
      content: [
        'Sau má»—i bÃ i há»c tá»« vá»±ng hay ngá»¯ phÃ¡p, há»‡ thá»‘ng Ä‘á»u cung cáº¥p bÃ i Mini-Quiz tá»« 5-10 cÃ¢u tráº¯c nghiá»‡m Ä‘á»ƒ cá»§ng cá»‘ kiáº¿n thá»©c.',
        'NgoÃ i ra, táº¡i má»¥c Luyá»‡n Thi, há»c viÃªn cÃ³ thá»ƒ thá»­ sá»©c vá»›i cÃ¡c bá»™ Ä‘á» thi thá»­ Ä‘á»‹nh dáº¡ng chuáº©n TOEIC / IELTS cÃ³ Ä‘á»“ng há»“ Ä‘áº¿m ngÆ°á»£c vÃ  báº£ng giáº£i thÃ­ch Ä‘Ã¡p Ã¡n chi tiáº¿t tá»«ng cÃ¢u.',
        'LÃ m Ä‘Ãºng bÃ i kiá»ƒm tra sáº½ Ä‘em láº¡i lÆ°á»£ng Exp vÃ  Coins thÆ°á»Ÿng ráº¥t lá»›n Ä‘á»ƒ thÄƒng háº¡ng!',
      ],
      actionLink: '/exam',
      actionText: 'VÃ o PhÃ²ng Luyá»‡n Thi Thá»­',
      tags: ['kiá»ƒm tra', 'quiz', 'thi thá»­', 'test', 'toeic', 'ielts', 'Ä‘Ã¡nh giÃ¡'],
    },

    // 2. NuÃ´i & NÃ¢ng cáº¥p ThÃº cÆ°ng (pet)
    {
      id: 'pet-1',
      category: 'pet',
      icon: 'ðŸ¾',
      title: 'LÃ m Quen Vá»›i 4 Linh Váº­t PixelFarm & Chá»‰ Sá»‘ Sá»©c Khá»e',
      summary: 'KhÃ¡m phÃ¡ CÃº Lexi, MÃ¨o Mochi, CÃºn Taro, CÃ¡o Kitsune vÃ  cÃ¡ch duy trÃ¬ nÄƒng lÆ°á»£ng cho bÃ© cÆ°ng.',
      content: [
        'Khi tham gia Meowlish, báº¡n sáº½ chá»n 1 trong 4 bÃ© cÆ°ng Ä‘á»“ng hÃ nh: CÃº Lexi (thÃ´ng thÃ¡i), MÃ¨o Mochi (tinh nghá»‹ch), CÃºn Taro (trung thÃ nh), CÃ¡o Kitsune (nhanh nháº¹n).',
        'BÃ© cÆ°ng cÃ³ 3 chá»‰ sá»‘ sá»©c khá»e chÃ­nh:',
        'â€¢ ÄÃ³i (Hunger): Giáº£m dáº§n theo thá»i gian. Khi Ä‘Ã³i bÃ© sáº½ buá»“n vÃ  khÃ´ng cá»• vÅ© báº¡n há»c táº­p.',
        'â€¢ Háº¡nh phÃºc (Happiness): TÄƒng khi báº¡n hoÃ n thÃ nh bÃ i há»c, cho Äƒn mÃ³n ngon vÃ  chÆ¡i Ä‘Ã¹a.',
        'â€¢ NÄƒng lÆ°á»£ng (Energy): Cáº§n thiáº¿t Ä‘á»ƒ tham gia cÃ¡c thá»­ thÃ¡ch mini-game.',
      ],
      actionLink: '/pet',
      actionText: 'GhÃ© ThÄƒm NÃ´ng Tráº¡i ThÃº CÆ°ng',
      tags: ['pet', 'thÃº cÆ°ng', 'chá»‰ sá»‘', 'Ä‘Ã³i', 'háº¡nh phÃºc', 'mochi', 'lexi', 'taro', 'kitsune'],
    },
    {
      id: 'pet-2',
      category: 'pet',
      icon: 'ðŸ²',
      title: 'ThÃº CÆ°ng Bá»‹ ÄÃ³i ThÃ¬ Pháº£i LÃ m GÃ¬? CÃ¡ch Kiáº¿m Thá»©c Ä‚n',
      summary: 'HÆ°á»›ng dáº«n cho pet Äƒn no bá»¥ng vÃ  máº¹o nháº­n thá»©c Äƒn thÆ¡m ngon miá»…n phÃ­ má»—i ngÃ y.',
      content: [
        'BÆ°á»›c 1: Truy cáº­p má»¥c ThÃº CÆ°ng (/pet).',
        'BÆ°á»›c 2: Báº¥m nÃºt "Cho Äƒn" (Feed) Ä‘á»ƒ tÄƒng chá»‰ sá»‘ no bá»¥ng vÃ  Ä‘á»™ vui váº» cá»§a bÃ© cÆ°ng.',
        'CÃ¡ch nháº­n thá»©c Äƒn ngon lÃ nh:',
        'â€¢ HoÃ n thÃ nh má»—i bÃ i há»c Tá»« vá»±ng hay Ngá»¯ phÃ¡p sáº½ nháº­n ngay thá»©c Äƒn thÆ°á»£ng háº¡ng cho pet.',
        'â€¢ DÃ¹ng Coins tÃ­ch lÅ©y Ä‘á»ƒ sáº¯m thÃªm cÃ¡c mÃ³n Äƒn yÃªu thÃ­ch trong Cá»­a HÃ ng PixelFarm.',
      ],
      actionLink: '/pet',
      actionText: 'Cho BÃ© CÆ°ng Ä‚n Ngay',
      tags: ['Ä‘Ã³i', 'cho Äƒn', 'thá»©c Äƒn', 'feed', 'thÃº cÆ°ng', 'pet'],
    },
    {
      id: 'pet-3',
      category: 'pet',
      icon: 'ðŸŽ©',
      title: 'Cá»­a HÃ ng Thá»i Trang & Thay Äá»•i Cáº£nh Quan Sá»‘ng',
      summary: 'Sáº¯m nÃ³n phÃ¹ thá»§y, kÃ­nh rÃ¢m coder, vÆ°Æ¡ng miá»‡n vÃ  má»Ÿ khÃ³a cáº£nh quan VÆ°á»n Xanh, LÃ ng LÃ¡.',
      content: [
        'Táº¡i Cá»­a HÃ ng ThÃº CÆ°ng, báº¡n cÃ³ thá»ƒ biáº¿n hÃ³a phong cÃ¡ch Ä‘á»™c Ä‘Ã¡o cho bÃ© cÆ°ng cá»§a mÃ¬nh:',
        'â€¢ NÃ³n & Phá»¥ kiá»‡n: NÃ³n phÃ¹ thá»§y ma thuáº­t, kÃ­nh rÃ¢m coder cool ngáº§u, vÆ°Æ¡ng miá»‡n hoÃ ng gia láº¥p lÃ¡nh.',
        'â€¢ Trang phá»¥c: Ão choÃ ng phiÃªu lÆ°u, Ä‘á»“ng phá»¥c há»c sinh Meowlish.',
        'â€¢ Cáº£nh quan mÃ´i trÆ°á»ng sá»‘ng: Äá»•i phong ná»n VÆ°á»n Xanh YÃªn BÃ¬nh, LÃ ng LÃ¡ Ninja Huyá»n BÃ­, hoáº·c Äáº£o Háº£i Táº·c PhiÃªu LÆ°u!',
      ],
      actionLink: '/pet',
      actionText: 'VÃ o Cá»­a HÃ ng Thá»i Trang',
      tags: ['shop', 'cá»­a hÃ ng', 'thá»i trang', 'phá»¥ kiá»‡n', 'nÃ³n', 'Ã¡o', 'cáº£nh quan', 'vÆ°á»n xanh'],
    },

    // 3. TÃ­ch lÅ©y Coins & Cá»­a hÃ ng (coins)
    {
      id: 'coins-1',
      category: 'coins',
      icon: 'ðŸ’°',
      title: 'BÃ­ Quyáº¿t Kiáº¿m Tháº­t Nhiá»u Coins Nhanh Nháº¥t',
      summary: '4 cÃ¡ch siÃªu tá»‘c giÃºp tÃºi xu cá»§a báº¡n luÃ´n Ä‘áº§y áº¯p Ä‘á»ƒ thoáº£i mÃ¡i sáº¯m Ä‘á»“ vÃ  báº£o vá»‡ chuá»—i Streak.',
      content: [
        '1. HoÃ n ThÃ nh BÃ i Há»c ÄÃºng: Má»—i bÃ i há»c má»›i hoÃ n thÃ nh trong Tá»« vá»±ng vÃ  Ngá»¯ PhÃ¡p thÆ°á»Ÿng tá»« +5 Ä‘áº¿n +50 Coins.',
        '2. Duy TrÃ¬ Chuá»—i Lá»­a Streak: Má»—i ngÃ y cÃ³ Ã­t nháº¥t 1 bÃ i há»c hoÃ n thÃ nh, Streak tá»± Ä‘á»™ng tÄƒng thÃªm 1 ngÃ y.',
        '3. Thá»­ Sá»©c Vá»›i Quiz & Thi Thá»­: HoÃ n thÃ nh bÃ i kiá»ƒm tra vá»›i Ä‘iá»ƒm sá»‘ cao mang láº¡i thÃªm Coins thÆ°á»Ÿng.',
        '4. Äáº¥u TrÆ°á»ng & Äua Xe: Tham gia PVP hoáº·c Ä‘ua xe vá»›i má»©c cÆ°á»£c 50â€“500 Coins Ä‘á»ƒ nhÃ¢n Ä‘Ã´i sá»‘ xu.',
      ],
      actionLink: '/pet',
      actionText: 'VÃ o Trang ThÃº CÆ°ng',
      tags: ['xu', 'coin', 'coins', 'kiáº¿m xu', 'tiá»n thÆ°á»Ÿng', 'streak'],
    },
    {
      id: 'coins-2',
      category: 'coins',
      icon: 'ðŸ”¥',
      title: 'Duy TrÃ¬ Ngá»n Lá»­a Streak',
      summary: 'CÃ¡ch giá»¯ chuá»—i há»c táº­p liÃªn tá»¥c Ä‘á»ƒ Streak luÃ´n tÄƒng.',
      content: [
        'Ngá»n lá»­a Streak thá»ƒ hiá»‡n tinh tháº§n kiÃªn trÃ¬ há»c táº­p má»—i ngÃ y cá»§a báº¡n. Streak tá»± Ä‘á»™ng tÄƒng thÃªm 1 má»—i ngÃ y báº¡n hoÃ n thÃ nh báº¥t ká»³ bÃ i há»c nÃ o (Tá»« vá»±ng, Ngá»¯ phÃ¡p, Flashcard...).',
        'HÃ£y há»c Ä‘á»u Ä‘áº·n má»—i ngÃ y â€” chá»‰ cáº§n 1 bÃ i hoÃ n thÃ nh lÃ  Ä‘á»§ Ä‘á»ƒ giá»¯ ngá»n lá»­a luÃ´n chÃ¡y!',
        'Máº¹o: Äáº·t lá»‹ch há»c cá»‘ Ä‘á»‹nh 15-20 phÃºt má»—i sÃ¡ng Ä‘á»ƒ khÃ´ng bao giá» bá» lá»¡ má»™t ngÃ y.',
      ],
      actionLink: '/flashcards',
      actionText: 'Báº¯t Äáº§u Láº­t Flashcard',
      tags: ['streak', 'ngá»n lá»­a', 'chuá»—i ngÃ y', 'flashcard'],
    },

    // 4. Báº£o máº­t tÃ i khoáº£n & 2FA (security)
    {
      id: 'sec-1',
      category: 'security',
      icon: 'ðŸ›¡ï¸',
      title: 'Báº­t XÃ¡c Thá»±c 2 BÆ°á»›c (2FA) Qua OTP Email Báº£o Vá»‡ TÃ i Khoáº£n',
      summary: 'KÃ­ch hoáº¡t lá»›p báº£o máº­t nÃ¢ng cao ngÄƒn ngá»«a xÃ¢m nháº­p trÃ¡i phÃ©p vÃ o tÃ i khoáº£n há»c táº­p.',
      content: [
        'Báº£o máº­t 2FA giÃºp báº£o vá»‡ sá»‘ dÆ° Coins, Ä‘iá»ƒm Exp vÃ  tiáº¿n Ä‘á»™ há»c táº­p cá»§a báº¡n.',
        'CÃ¡ch kÃ­ch hoáº¡t:',
        '1. Báº¥m nÃºt "ÄÄƒng Nháº­p" á»Ÿ gÃ³c trÃªn thanh Ä‘iá»u hÆ°á»›ng Ä‘á»ƒ má»Ÿ khung xÃ¡c thá»±c.',
        '2. Trong khung Ä‘Ã³, tÃ¬m tháº» "Báº£o Máº­t 2 Lá»›p (2FA)" vÃ  gáº¡t nÃºt Báº­t.',
        '3. Há»‡ thá»‘ng sáº½ gá»­i mÃ£ OTP 6 chá»¯ sá»‘ Ä‘áº¿n email cá»§a báº¡n Ä‘á»ƒ xÃ¡c thá»±c kÃ­ch hoáº¡t.',
        'Tá»« cÃ¡c láº§n Ä‘Äƒng nháº­p sau, há»‡ thá»‘ng sáº½ yÃªu cáº§u nháº­p mÃ£ OTP gá»­i vá» email, Ä‘áº£m báº£o chá»‰ cÃ³ báº¡n má»›i cÃ³ quyá»n truy cáº­p!',
      ],
      tags: ['2fa', 'báº£o máº­t', 'otp', 'email', 'xÃ¡c thá»±c 2 bÆ°á»›c', 'tÃ i khoáº£n'],
    },
    {
      id: 'sec-2',
      category: 'security',
      icon: 'ðŸ”‘',
      title: 'QuÃªn Máº­t Kháº©u & CÃ¡ch KhÃ´i Phá»¥c Nhanh ChÃ³ng',
      summary: 'Láº¥y láº¡i quyá»n truy cáº­p tÃ i khoáº£n an toÃ n trong vÃ²ng 1 phÃºt qua email xÃ¡c thá»±c.',
      content: [
        'Náº¿u báº¡n quÃªn máº­t kháº©u Ä‘Äƒng nháº­p, hÃ£y lÃ m theo cÃ¡c bÆ°á»›c sau:',
        '1. Báº¥m nÃºt "ÄÄƒng Nháº­p" á»Ÿ gÃ³c trÃªn thanh Ä‘iá»u hÆ°á»›ng.',
        '2. Chá»n dÃ²ng "QuÃªn máº­t kháº©u?".',
        '3. Nháº­p tÃªn Ä‘Äƒng nháº­p hoáº·c Ä‘á»‹a chá»‰ email báº¡n Ä‘Ã£ dÃ¹ng Ä‘á»ƒ Ä‘Äƒng kÃ½ tÃ i khoáº£n.',
        '4. Kiá»ƒm tra há»™p thÆ° (cáº£ má»¥c Há»™p thÆ° Ä‘áº¿n vÃ  Spam) Ä‘á»ƒ nháº­n mÃ£ OTP khÃ´i phá»¥c vÃ  Ä‘áº·t láº¡i máº­t kháº©u má»›i.',
      ],
      tags: ['máº­t kháº©u', 'quÃªn máº­t kháº©u', 'password', 'khÃ´i phá»¥c', 'reset'],
    },
    {
      id: 'sec-3',
      category: 'security',
      icon: 'â˜ï¸',
      title: 'Äá»“ng Bá»™ Tiáº¿n Äá»™ Há»c Táº­p LÃªn ÄÃ¡m MÃ¢y S3 Filebase',
      summary: 'ToÃ n bá»™ dá»¯ liá»‡u Ä‘Æ°á»£c sao lÆ°u thá»i gian thá»±c, há»c liá»n máº¡ch trÃªn má»i mÃ¡y tÃ­nh vÃ  Ä‘iá»‡n thoáº¡i.',
      content: [
        'ToÃ n bá»™ quÃ¡ trÃ¬nh há»c tá»« vá»±ng, sá»• tay bookmark, sá»‘ dÆ° Coins, thÃº cÆ°ng vÃ  chuá»—i Streak Ä‘á»u Ä‘Æ°á»£c Ä‘á»“ng bá»™ tá»± Ä‘á»™ng lÃªn mÃ¡y chá»§ cÆ¡ sá»Ÿ dá»¯ liá»‡u vÃ  sao lÆ°u Ä‘á»‹nh ká»³ lÃªn dá»‹ch vá»¥ Ä‘Ã¡m mÃ¢y Filebase S3 an toÃ n.',
        'Báº¡n cÃ³ thá»ƒ há»c trÃªn laptop á»Ÿ vÄƒn phÃ²ng, sau Ä‘Ã³ má»Ÿ Ä‘iá»‡n thoáº¡i tiáº¿p tá»¥c lÃ m bÃ i mÃ  khÃ´ng bao giá» lo máº¥t dá»¯ liá»‡u hay bá»‹ tá»¥t háº¡ng!',
      ],
      tags: ['s3', 'filebase', 'Ä‘á»“ng bá»™', 'sao lÆ°u', 'dá»¯ liá»‡u', 'cloud', 'backup'],
    },
  ];

  // Lá»c bÃ i viáº¿t Knowledge Base theo search query vÃ  category
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
  // Xá»¬ LÃ CHAT TRá»¢ LÃ AI
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
      // Chuáº©n bá»‹ lá»‹ch sá»­ há»™i thoáº¡i gáº§n nháº¥t
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
          content: 'Meow! ðŸ± Há»‡ thá»‘ng Ä‘ang xá»­ lÃ½ nhiá»u yÃªu cáº§u cÃ¹ng lÃºc. Báº¡n cÃ³ thá»ƒ tham kháº£o má»¥c Cáº©m Nang hoáº·c gá»­i Ticket á»Ÿ tab bÃªn cáº¡nh Ä‘á»ƒ BQT há»— trá»£ nhÃ©!',
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
        content: 'Meow! ðŸ± Lá»—i káº¿t ná»‘i máº¡ng rá»“i. Vui lÃ²ng kiá»ƒm tra láº¡i Ä‘Æ°á»ng truyá»n internet cá»§a báº¡n nhÃ©!',
        provider: 'error_fallback',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ==========================================
  // Xá»¬ LÃ Gá»¬I TICKET Há»– TRá»¢
  // ==========================================
  /** XÃ³a lá»—i cá»§a má»™t field cá»¥ thá»ƒ khi ngÆ°á»i dÃ¹ng sá»­a láº¡i giÃ¡ trá»‹ */
  const clearFieldError = (field: TicketFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /** Focus vÃ o field Ä‘áº§u tiÃªn Ä‘ang bá»‹ lá»—i (sau khi React Ä‘Ã£ render lá»—i) */
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
        // Field khÃ´ng focus Ä‘Æ°á»£c (vÃ­ dá»¥ danh má»¥c dáº¡ng nÃºt) â†’ focus vá» nÃºt gá»­i
        submitButtonRef.current?.focus();
      }
    });
  };

  /** Validate toÃ n bá»™ form, tráº£ vá» lá»—i tiáº¿ng Viá»‡t theo tá»«ng field */
  const validateTicketForm = (): TicketFieldErrors => {
    const errors: TicketFieldErrors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      errors.name = 'Vui lÃ²ng nháº­p há» vÃ  tÃªn cá»§a báº¡n.';
    }

    if (!cleanEmail) {
      errors.email = 'Vui lÃ²ng nháº­p email Ä‘á»ƒ Ban Quáº£n Trá»‹ cÃ³ thá»ƒ gá»­i pháº£n há»“i cho báº¡n.';
    } else if (!TICKET_EMAIL_RE.test(cleanEmail)) {
      errors.email = 'Email khÃ´ng há»£p lá»‡. VÃ­ dá»¥ Ä‘Ãºng: ban@gmail.com';
    }

    if (!category) {
      errors.category = 'Vui lÃ²ng chá»n danh má»¥c yÃªu cáº§u.';
    }

    if (!cleanSubject) {
      errors.subject = 'Vui lÃ²ng nháº­p tiÃªu Ä‘á» phiáº¿u.';
    }

    if (!cleanMessage) {
      errors.message = 'Vui lÃ²ng mÃ´ táº£ váº¥n Ä‘á» cá»§a báº¡n.';
    } else if (cleanMessage.length < TICKET_MESSAGE_MIN) {
      errors.message = `Vui lÃ²ng mÃ´ táº£ váº¥n Ä‘á» rÃµ rÃ ng hÆ¡n (tá»‘i thiá»ƒu ${TICKET_MESSAGE_MIN} kÃ½ tá»±, hiá»‡n má»›i cÃ³ ${cleanMessage.length} kÃ½ tá»±).`;
    }

    return errors;
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(null);

    // ===== VALIDATE PHÃA CLIENT (thÃ´ng bÃ¡o tiáº¿ng Viá»‡t trong DOM) =====
    const errors = validateTicketForm();
    setFieldErrors(errors);

    const errorMessages = TICKET_FIELD_ORDER.map((key) => errors[key]).filter(
      (msg): msg is string => Boolean(msg)
    );

    if (errorMessages.length > 0) {
      const firstErrorField = TICKET_FIELD_ORDER.find((key) => Boolean(errors[key])) as TicketFieldKey;
      setSubmitError(
        `Vui lÃ²ng sá»­a ${errorMessages.length} thÃ´ng tin cÃ²n thiáº¿u hoáº·c chÆ°a há»£p lá»‡ trÆ°á»›c khi gá»­i phiáº¿u há»— trá»£. Phiáº¿u chÆ°a Ä‘Æ°á»£c gá»­i Ä‘i.`
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
        setSubmitSuccess(data.message || `Phiáº¿u há»— trá»£ #${newId} Ä‘Ã£ Ä‘Æ°á»£c gá»­i thÃ nh cÃ´ng!`);
        setCreatedTicketId(newId);
        setFieldErrors({});

        // Reset form ná»™i dung (giá»¯ name & email)
        setSubject('');
        setMessage('');
        setRating(5);
        setPriority('medium');

        // Táº£i láº¡i lá»‹ch sá»­ ticket
        if (currentUser) {
          fetchTicketHistory(currentUser.id, currentUser.email);
        } else {
          fetchTicketHistory(undefined, email.trim());
        }
      } else {
        sound.playError();
        setSubmitError(data.error || 'CÃ³ lá»—i xáº£y ra khi táº¡o ticket. Vui lÃ²ng thá»­ láº¡i!');
      }
    } catch {
      sound.playError();
      setSubmitError('Lá»—i káº¿t ná»‘i mÃ¡y chá»§. Vui lÃ²ng kiá»ƒm tra Ä‘Æ°á»ng truyá»n vÃ  thá»­ láº¡i!');
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
            <span>Trung TÃ¢m Há»— Trá»£ & Trá»£ LÃ½ Há»c ViÃªn Meowlish</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            Cáº©m Nang HÆ°á»›ng Dáº«n, Trá»£ LÃ½ AI & Phiáº¿u Há»— Trá»£
          </h1>

          <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            KhÃ¡m phÃ¡ trá»n bá»™ phÆ°Æ¡ng phÃ¡p há»c tiáº¿ng Anh pháº£n xáº¡, bÃ­ kÃ­p chÄƒm sÃ³c thÃº cÆ°ng PixelFarm, tÃ­ch lÅ©y Coins vÃ  trao Ä‘á»•i tá»©c thÃ¬ cÃ¹ng Trá»£ LÃ½ AI hoáº·c gá»­i Ticket Ä‘áº¿n Ban Quáº£n Trá»‹!
          </p>

          {/* MAIN 3 NAVIGATION TABS */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            {/* Tab 1: Cáº©m Nang */}
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
              <span>Cáº©m Nang & HÆ°á»›ng Dáº«n</span>
            </button>

            {/* Tab 2: Trá»£ LÃ½ AI */}
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
                <span>Trá»£ LÃ½ MÃ¨o AI 24/7</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold animate-pulse">
                  Tá»©c thÃ¬
                </span>
              </span>
            </button>

            {/* Tab 3: Gá»­i Ticket & Lá»‹ch Sá»­ */}
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
                <span>Gá»­i Ticket & Lá»‹ch Sá»­</span>
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
        {/* TAB 1: Cáº¨M NANG & HÆ¯á»šNG DáºªN Sá»¬ Dá»¤NG (KNOWLEDGE BASE)           */}
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
                  placeholder="Nháº­p tá»« khÃ³a tÃ¬m kiáº¿m (vd: kiáº¿m coins, thÃº cÆ°ng Ä‘Ã³i, lego, 2fa, luyá»‡n nÃ³i, máº­t kháº©u)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl pl-11 pr-24 py-3 text-xs sm:text-sm text-slate-900 outline-none transition shadow-inner dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900 dark:text-slate-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer dark:bg-slate-700 dark:text-slate-300"
                  >
                    XÃ³a
                  </button>
                )}
              </div>

              {/* Hot keyword chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Tá»« khÃ³a hot:
                </span>
                {[
                  'Kiáº¿m Coins',
                  'ÄÃ³i thÃº cÆ°ng',
                  'Ngá»¯ phÃ¡p Lego',
                  'Báº£o máº­t 2FA',
                  'Luyá»‡n nÃ³i AI',
                  'ÄÃ³ng bÄƒng streak',
                  'QuÃªn máº­t kháº©u',
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
                  { id: 'all', label: 'Táº¥t cáº£ chuyÃªn má»¥c', icon: 'ðŸŒŸ' },
                  { id: 'study', label: 'Há»c táº­p hiá»‡u quáº£', icon: 'ðŸŽ“' },
                  { id: 'pet', label: 'NuÃ´i & NÃ¢ng cáº¥p ThÃº cÆ°ng', icon: 'ðŸ¾' },
                  { id: 'coins', label: 'TÃ­ch lÅ©y Coins & Shop', icon: 'ðŸ’Ž' },
                  { id: 'security', label: 'Báº£o máº­t tÃ i khoáº£n & 2FA', icon: 'ðŸ›¡ï¸' },
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
                Hiá»ƒn thá»‹ {filteredFaqArticles.length} bÃ i hÆ°á»›ng dáº«n
                {searchQuery && (
                  <span className="text-emerald-700 ml-1 dark:text-emerald-300">cho tá»« khÃ³a &quot;{searchQuery}&quot;</span>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer dark:text-slate-400 hover:dark:text-slate-200"
                >
                  Xem táº¥t cáº£
                </button>
              )}
            </div>

            {/* ARTICLES ACCORDION LIST */}
            {filteredFaqArticles.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-white/10">
                <div className="text-4xl">ðŸ”</div>
                <h3 className="font-black text-base text-slate-800 dark:text-slate-200">
                  KhÃ´ng tÃ¬m tháº¥y bÃ i viáº¿t phÃ¹ há»£p vá»›i &quot;{searchQuery}&quot;
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto dark:text-slate-400">
                  Báº¡n cÃ³ thá»ƒ thá»­ tÃ¬m kiáº¿m vá»›i tá»« khÃ³a khÃ¡c, hoáº·c báº¥m sang tab{' '}
                  <strong>Trá»£ LÃ½ MÃ¨o AI 24/7</strong> Ä‘á»ƒ Ä‘Æ°á»£c giáº£i Ä‘Ã¡p ngay láº­p tá»©c!
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
                  <span>Há»i Trá»£ LÃ½ AI Vá» &quot;{searchQuery}&quot;</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqArticles.map((article) => {
                  const isOpen = openFaqId === article.id;
                  let categoryBadgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  let categoryName = 'Tá»•ng quan';
                  if (article.category === 'study') {
                    categoryBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
                    categoryName = 'Há»c táº­p hiá»‡u quáº£';
                  } else if (article.category === 'pet') {
                    categoryBadgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200';
                    categoryName = 'ThÃº cÆ°ng PixelFarm';
                  } else if (article.category === 'coins') {
                    categoryBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
                    categoryName = 'Coins & Cá»­a HÃ ng';
                  } else if (article.category === 'security') {
                    categoryBadgeColor = 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200';
                    categoryName = 'Báº£o máº­t & 2FA';
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
                                <span>{article.actionText || 'KhÃ¡m phÃ¡ ngay'}</span>
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
        {/* TAB 2: TRá»¢ LÃ MÃˆO AI 24/7 (AI ASSISTANT CHAT)                   */}
        {/* ============================================================== */}
        {activeTab === 'ai' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[720px] max-h-[85vh] animate-in fade-in duration-200 dark:bg-slate-900 dark:border-white/10">
            {/* Chat Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md ring-2 ring-white/20">
                  ðŸ±
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-sm sm:text-base text-white">
                      Trá»£ LÃ½ MÃ¨o Meowlish AI
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Trá»±c tuyáº¿n 24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sá»­ dá»¥ng cÃ´ng nghá»‡ AI Groq LPU & Google Gemini â€¢ Pháº£n há»“i tá»©c thÃ¬
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
                        'Meow! ChÃ o báº¡n! MÃ¬nh Ä‘Ã£ sáºµn sÃ ng láº¯ng nghe má»i cÃ¢u há»i má»›i cá»§a báº¡n vá» Meowlish rá»“i nhÃ©! ðŸ±âœ¨',
                      provider: 'groq',
                      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    },
                  ]);
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-700 dark:bg-white/80 dark:border-white/10 dark:text-slate-800"
                title="LÃ m má»›i cuá»™c trÃ² chuyá»‡n"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LÃ m má»›i</span>
              </button>
            </div>

            {/* Quick Prompts Carousel Bar */}
            <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 overflow-x-auto touch-auto flex items-center gap-2 custom-scrollbar dark:bg-slate-800/90 dark:border-white/10">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 dark:text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Gá»£i Ã½ há»i nhanh:
              </span>
              {[
                { label: 'ðŸ’° Kiáº¿m nhiá»u xu nhanh nháº¥t?', text: 'LÃ m sao Ä‘á»ƒ kiáº¿m nhiá»u xu nháº¥t trÃªn Meowlish?' },
                { label: 'ðŸ¾ ThÃº cÆ°ng Ä‘Ã³i lÃ m gÃ¬?', text: 'ThÃº cÆ°ng bá»‹ Ä‘Ã³i thÃ¬ pháº£i lÃ m gÃ¬ Ä‘á»ƒ cho Äƒn?' },
                { label: 'ðŸ§© Ngá»¯ PhÃ¡p Lego lÃ  gÃ¬?', text: 'PhÆ°Æ¡ng phÃ¡p há»c Ngá»¯ PhÃ¡p Lego hoáº¡t Ä‘á»™ng tháº¿ nÃ o?' },
                { label: 'ðŸ“ LÃ m bÃ i kiá»ƒm tra á»Ÿ Ä‘Ã¢u?', text: 'LÃ m bÃ i kiá»ƒm tra vÃ  thi thá»­ TOEIC/IELTS á»Ÿ Ä‘Ã¢u?' },
                { label: 'ðŸ”’ Báº­t báº£o máº­t 2FA?', text: 'LÃ m tháº¿ nÃ o Ä‘á»ƒ báº­t báº£o máº­t 2FA qua email?' },
                { label: 'ðŸ”¥ Giá»¯ ngá»n lá»­a Streak?', text: 'Máº¹o giá»¯ Streak vÃ  Ä‘Ã³ng bÄƒng streak khi báº­n rá»™n?' },
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
                      {isUser ? 'ðŸ‘¤' : 'ðŸ±'}
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
                            {msg.provider === 'groq' && 'âš¡ Groq LPU SiÃªu Tá»‘c'}
                            {msg.provider === 'gemini' && 'ðŸ¤– Google Gemini AI'}
                            {msg.provider === 'offline_kb' && 'ðŸ“– Tri Thá»©c Meowlish'}
                            {msg.provider === 'error_fallback' && 'ðŸ’¡ Ban Quáº£n Trá»‹'}
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
                    ðŸ±
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-600 shadow-xs flex items-center gap-2 dark:bg-slate-900 dark:border-white/10 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                    </div>
                    <span>Meowlish Ä‘ang tá»•ng há»£p cÃ¢u tráº£ lá»i cho báº¡n...</span>
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
                  placeholder="GÃµ cÃ¢u há»i tháº¯c máº¯c cá»§a báº¡n (vd: ThÃº cÆ°ng Ä‘Ã³i lÃ m gÃ¬, cÃ¡ch kiáº¿m coins, ngá»¯ phÃ¡p lego)..."
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none transition dark:bg-slate-900 dark:border-white/10 focus:dark:bg-slate-900 dark:text-slate-100"
                  disabled={isAiLoading}
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !inputQuestion.trim()}
                  className="px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gá»­i</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: Gá»¬I TICKET GÃ“P Ã & Lá»ŠCH Sá»¬ PHIáº¾U Há»– TRá»¢                 */}
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
                <span>Gá»­i Phiáº¿u Há»— Trá»£ Má»›i</span>
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
                <span>Lá»‹ch Sá»­ Phiáº¿u Há»— Trá»£ ({myTickets.length})</span>
              </button>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SUB-TAB 1: Gá»¬I PHIáº¾U Há»– TRá»¢ Má»šI                            */}
            {/* ---------------------------------------------------------- */}
            {ticketSubTab === 'create' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 dark:bg-slate-900 dark:border-white/10">
                <div className="border-b border-slate-100 pb-4 dark:border-white/10">
                  <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-wider mb-1 dark:text-indigo-300">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Há»‡ Thá»‘ng Tiáº¿p Nháº­n Ã Kiáº¿n & BÃ¡o Lá»—i</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    Táº¡o Phiáº¿u Há»— Trá»£ Chuáº©n #TK-XXXX
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                    Phiáº¿u sáº½ Ä‘Æ°á»£c mÃ£ hÃ³a, lÆ°u an toÃ n vÃ o CSDL, Ä‘á»“ng bá»™ Ä‘Ã¡m mÃ¢y S3 Filebase vÃ  gá»­i thÃ´ng bÃ¡o tá»©c thÃ¬ Ä‘áº¿n Ban Quáº£n Trá»‹ (/duahau).
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
                          <span className="text-xs text-emerald-700 dark:text-emerald-300">MÃ£ phiáº¿u há»— trá»£:</span>
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
                            <span>{copiedId === createdTicketId ? 'ÄÃ£ sao chÃ©p' : 'Sao chÃ©p mÃ£'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setTicketSubTab('history');
                            }}
                            className="px-3 py-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Xem Lá»‹ch Sá»­ Phiáº¿u</span>
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
                      1. Chá»n danh má»¥c yÃªu cáº§u:
                    </label>
                    <div
                      id="ticket-category-group"
                      aria-describedby={fieldErrors.category ? 'support-error-category' : undefined}
                      aria-invalid={fieldErrors.category ? true : undefined}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'feedback', label: 'GÃ³p Ã½ tÃ­nh nÄƒng', emoji: 'ðŸ’¡', desc: 'Ã tÆ°á»Ÿng má»›i cho website' },
                          { id: 'bug', label: 'BÃ¡o lá»—i ká»¹ thuáº­t', emoji: 'ðŸž', desc: 'Gáº·p trá»¥c tráº·c, lá»—i giao diá»‡n' },
                          { id: 'guide', label: 'Tháº¯c máº¯c há»c táº­p', emoji: 'ðŸ“–', desc: 'Cáº§n há»— trá»£ vá» bÃ i há»c' },
                          { id: 'account', label: 'TÃ i khoáº£n & Báº£o máº­t', emoji: 'ðŸ”’', desc: 'QuÃªn máº­t kháº©u, Ä‘á»•i 2FA' },
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
                      2. Má»©c Ä‘á»™ Æ°u tiÃªn:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'low', label: 'Tháº¥p', emoji: 'ðŸŸ¢', desc: 'GÃ³p Ã½ tham kháº£o' },
                        { id: 'medium', label: 'Trung bÃ¬nh', emoji: 'ðŸŸ¡', desc: 'Tháº¯c máº¯c chung' },
                        { id: 'high', label: 'Cao', emoji: 'ðŸŸ ', desc: 'áº¢nh hÆ°á»Ÿng há»c táº­p' },
                        { id: 'urgent', label: 'Kháº©n cáº¥p', emoji: 'ðŸ”´', desc: 'Lá»—i cháº·n tÃ­nh nÄƒng' },
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
                        Há» vÃ  tÃªn cá»§a báº¡n:
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
                          placeholder="VÃ­ dá»¥: Nguyá»…n VÄƒn Minh"
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
                        Email nháº­n xÃ¡c nháº­n & pháº£n há»“i:
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
                      Má»©c Ä‘á»™ hÃ i lÃ²ng cá»§a báº¡n vá» tráº£i nghiá»‡m website:
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
                        {rating === 5 && 'Tuyá»‡t vá»i! ðŸŒŸ'}
                        {rating === 4 && 'Ráº¥t tá»‘t ðŸ‘'}
                        {rating === 3 && 'BÃ¬nh thÆ°á»ng ðŸ‘Œ'}
                        {rating === 2 && 'Cáº§n cáº£i thiá»‡n thÃªm ðŸ› ï¸'}
                        {rating === 1 && 'ChÆ°a hÃ i lÃ²ng ðŸ˜ž'}
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
                      TiÃªu Ä‘á» phiáº¿u há»— trá»£:
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
                      placeholder="TÃ³m táº¯t ngáº¯n gá»n váº¥n Ä‘á» (vd: KhÃ´ng má»Ÿ khÃ³a Ä‘Æ°á»£c cáº£nh quan VÆ°á»n Xanh)"
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
                      MÃ´ táº£ chi tiáº¿t ná»™i dung:
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
                      placeholder="MÃ´ táº£ cá»¥ thá»ƒ cÃ¡c bÆ°á»›c báº¡n thá»±c hiá»‡n, Ä‘Æ°á»ng dáº«n trang web gáº·p sá»± cá»‘ hoáº·c Ã½ tÆ°á»Ÿng tÃ­nh nÄƒng má»›i..."
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
                      Tá»‘i thiá»ƒu {TICKET_MESSAGE_MIN} kÃ½ tá»± â€” hiá»‡n táº¡i {message.trim().length} kÃ½ tá»±.
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
                        <span>Äang mÃ£ hÃ³a & gá»­i phiáº¿u Ä‘áº¿n Ban Quáº£n Trá»‹...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Táº¡o Phiáº¿u Há»— Trá»£ & Gá»­i Äáº¿n Ban Quáº£n Trá»‹</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Khoáº£ng Ä‘á»‡m cho bottom-nav cá»‘ Ä‘á»‹nh trÃªn mobile (lg:hidden) Ä‘á»ƒ
                    nÃºt "Táº¡o Phiáº¿u Há»— Trá»£" khÃ´ng bá»‹ Ä‘Ã¨ khi cuá»™n tá»›i cuá»‘i trang. */}
                <div aria-hidden="true" className="h-16 lg:hidden" />
              </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* SUB-TAB 2: Lá»ŠCH Sá»¬ PHIáº¾U Há»– TRá»¢                            */}
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
                      placeholder="Tra cá»©u theo mÃ£ #TK-XXXX hoáº·c email..."
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
                      <span>Tra cá»©u</span>
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
                      <span>LÃ m má»›i</span>
                    </button>
                  </div>
                </div>

                {/* Tickets List */}
                {isLoadingHistory ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-white/10">
                    <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto dark:text-indigo-300" />
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Äang táº£i danh sÃ¡ch phiáº¿u há»— trá»£ cá»§a báº¡n...
                    </div>
                  </div>
                ) : historyError ? (
                  <div className="bg-amber-50 rounded-3xl p-8 text-center border border-amber-200 shadow-sm space-y-2 dark:bg-amber-950/30 dark:border-amber-800">
                    <div className="text-3xl">âš ï¸</div>
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
                      Thá»­ láº¡i
                    </button>
                  </div>
                ) : myTickets.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-white/10">
                    <div className="text-4xl">ðŸ“­</div>
                    <h3 className="font-black text-base text-slate-800 dark:text-slate-200">
                      Báº¡n chÆ°a cÃ³ phiáº¿u há»— trá»£ nÃ o trong danh sÃ¡ch
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto dark:text-slate-400">
                      Náº¿u báº¡n tá»«ng gá»­i phiáº¿u há»— trá»£ báº±ng email khÃ¡c hoáº·c cÃ³ mÃ£ ticket riÃªng, hÃ£y nháº­p vÃ o Ã´ tra cá»©u phÃ­a trÃªn nhÃ©!
                    </p>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setTicketSubTab('create');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Táº¡o Phiáº¿u Há»— Trá»£ Äáº§u TiÃªn</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* KhÃ¡ch chÆ°a Ä‘Äƒng nháº­p chá»‰ tháº¥y metadata. Pháº£i nÃ³i rÃµ lÃ½ do,
                        náº¿u khÃ´ng cÃ¡c phiáº¿u hiá»‡n ra trá»‘ng trÆ¡n nhÆ° lá»—i á»©ng dá»¥ng. */}
                    {historyRedacted && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                        <span className="text-xl leading-none" aria-hidden="true">ðŸ”’</span>
                        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-2">
                          <p className="font-bold">
                            Báº¡n Ä‘ang xem danh sÃ¡ch rÃºt gá»n â€” ná»™i dung phiáº¿u vÃ  tráº£ lá»i cá»§a Ban
                            Quáº£n Trá»‹ chá»‰ hiá»ƒn thá»‹ vá»›i tÃ i khoáº£n Ä‘Ã£ Ä‘Äƒng nháº­p.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
                            }}
                            className="font-black underline min-h-[44px]"
                          >
                            ÄÄƒng nháº­p Ä‘á»ƒ xem Ä‘áº§y Ä‘á»§
                          </button>
                        </div>
                      </div>
                    )}
                    {myTickets.map((ticket) => {
                      const formattedCode = ticket.id.startsWith('#') ? ticket.id : `#${ticket.id}`;
                      let categoryBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10';
                      let categoryLabel = 'ðŸ’¬ KhÃ¡c';
                      if (ticket.category === 'feedback') {
                        categoryBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800';
                        categoryLabel = 'ðŸ’¡ GÃ³p Ã½ tÃ­nh nÄƒng';
                      } else if (ticket.category === 'bug') {
                        categoryBadgeColor = 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800';
                        categoryLabel = 'ðŸž BÃ¡o lá»—i ká»¹ thuáº­t';
                      } else if (ticket.category === 'guide') {
                        categoryBadgeColor = 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800';
                        categoryLabel = 'ðŸ“– Tháº¯c máº¯c há»c táº­p';
                      } else if (ticket.category === 'account') {
                        categoryBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800';
                        categoryLabel = 'ðŸ”’ TÃ i khoáº£n & Báº£o máº­t';
                      }

                      let prioBadge = null;
                      if (ticket.priority === 'urgent') {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                            ðŸ”´ Kháº©n cáº¥p
                          </span>
                        );
                      } else if (ticket.priority === 'high') {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                            ðŸŸ  Æ¯u tiÃªn cao
                          </span>
                        );
                      } else if (ticket.priority === 'low') {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                            ðŸŸ¢ Tháº¥p
                          </span>
                        );
                      } else {
                        prioBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                            ðŸŸ¡ Trung bÃ¬nh
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
                                  title="Sao chÃ©p mÃ£ ticket"
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
                                  ? 'Chá» tiáº¿p nháº­n'
                                  : ticket.status === 'processing'
                                  ? 'Äang xá»­ lÃ½'
                                  : 'ÄÃ£ giáº£i quyáº¿t'}
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
                                    ðŸ‰
                                  </span>
                                  <span className="font-black text-xs text-emerald-950 uppercase tracking-wider dark:text-emerald-200">
                                    Pháº£n Há»“i ChÃ­nh Thá»©c Tá»« Ban Quáº£n Trá»‹
                                  </span>
                                </div>
                                {ticket.resolved_at && (
                                  <span className="text-[10px] font-mono text-emerald-700 font-bold dark:text-emerald-300">
                                    Giáº£i quyáº¿t lÃºc: {new Date(ticket.resolved_at).toLocaleString('vi-VN')}
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
                                Ban Quáº£n Trá»‹ Ä‘Ã£ nháº­n Ä‘Æ°á»£c phiáº¿u vÃ  Ä‘ang tiáº¿n hÃ nh xá»­ lÃ½. Báº¡n sáº½ nháº­n Ä‘Æ°á»£c thÃ´ng bÃ¡o qua email khi cÃ³ cÃ¢u tráº£ lá»i!
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

'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Coins,
  Award,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  CloudUpload,
  ArrowLeft,
  Edit3,
  Trash2,
  Eye,
  LogOut,
  Flame,
  Sparkles,
  Mail,
  Send,
  Clock,
  ArrowRight,
  Terminal,
  AlertTriangle,
  MessageSquare,
  Star,
  Check,
  X,
  Filter,
  Inbox,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { maskEmail } from '@/lib/auth';

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  display_name: string;
  avatar: string;
  streak: number;
  exp: number;
  level: number;
  coins: number;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  two_factor_enabled?: boolean | number;
  email_verified?: boolean | number;
  last_active_date?: string;
  created_at: string;
  pet_type?: string;
  pet_name?: string;
  pet_level?: number;
  selected_habitat?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  totalCoins: number;
  s3Status?: {
    configured: boolean;
    bucket: string;
    isSyncing: boolean;
    remoteExists: boolean;
    remoteSize: number | null;
    lastSyncTime: string | null;
    lastSyncStatus: string;
    lastSyncMessage: string;
  };
}

interface LogSummary {
  totalAccess: number;
  totalErrors: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
}

interface SupportMessage {
  id: string;
  name: string;
  email: string;
  user_id?: string;
  category: 'feedback' | 'bug' | 'guide' | 'account' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  message: string;
  rating: number;
  status: 'new' | 'processing' | 'resolved';
  admin_reply?: string;
  created_at: string;
  resolved_at?: string;
}

interface SupportCounts {
  total: number;
  new: number;
  processing: number;
  resolved: number;
}

export const metadata: Metadata = {
  title: 'Quản Trị - Meowlish',
  description: 'Trang quản trị nội bộ Meowlish.',
  robots: { index: false, follow: false },
};

export default function DuaHauAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // 2FA Login Flow States
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginOtp, setLoginOtp] = useState<string>('');
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otpMaskedEmail, setOtpMaskedEmail] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(300); // 5 mins

  // Admin Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalType, setModalType] = useState<'coins' | 'level' | 'password' | 'delete' | null>(null);
  const [editCoinsInput, setEditCoinsInput] = useState<number>(0);
  const [editLevelInput, setEditLevelInput] = useState<number>(1);
  const [editExpInput, setEditExpInput] = useState<number>(0);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Active Admin Navigation Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'access_logs' | 'error_logs' | 'email_logs' | 'support'>('users');

  // Logs States
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState<string>('');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [logPage, setLogPage] = useState<number>(1);
  const [logTotal, setLogTotal] = useState<number>(0);
  const [logSummary, setLogSummary] = useState<LogSummary | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [expandedStackId, setExpandedStackId] = useState<string | null>(null);

  // Support States
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportCounts, setSupportCounts] = useState<SupportCounts | null>(null);
  const [supportFilterStatus, setSupportFilterStatus] = useState<string>('all');
  const [supportFilterCategory, setSupportFilterCategory] = useState<string>('all');
  const [supportSearch, setSupportSearch] = useState<string>('');
  const [isLoadingSupport, setIsLoadingSupport] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportMessage | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [isReplyingTicket, setIsReplyingTicket] = useState<boolean>(false);
  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    if (type === 'success') sound.playSuccess();
    else sound.playWrong();
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 3500);
  };

  // OTP Countdown Timer (single stable interval without per-second teardown)
  useEffect(() => {
    if (loginStep !== 'otp') return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loginStep]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  // Check saved session on mount
  useEffect(() => {
    // Äáº£m báº£o khÃ´ng bao giá» tá»“n táº¡i tÃ i khoáº£n admin trong localStorage cá»§a ngÆ°á»i dÃ¹ng
    try {
      const rawUser = localStorage.getItem('english_for_me_user');
      if (rawUser && rawUser.includes('"username":"admin"')) {
        localStorage.removeItem('english_for_me_user');
      }
    } catch {}

    const checkSavedSession = async () => {
      const savedToken = sessionStorage.getItem('duahau_admin_token');
      if (!savedToken) return;

      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify_session', token: savedToken }),
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setAdminToken(savedToken);
          setIsAuthenticated(true);
          fetchAdminData(savedToken);
          fetchSummary(savedToken);
          fetchSupport(savedToken);
        } else {
          sessionStorage.removeItem('duahau_admin_token');
          setIsAuthenticated(false);
        }
      } catch {
        sessionStorage.removeItem('duahau_admin_token');
        setIsAuthenticated(false);
      }
    };

    checkSavedSession();
  }, []);

  // Fetch admin stats & user list (Secured with AES-256 Bearer Token)
  const fetchAdminData = async (tokenToUse?: string) => {
    const token = tokenToUse || adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setStats(data.stats || null);
      } else {
        showToast(data.error || 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u quáº£n trá»‹', 'error');
        if (res.status === 401) {
          setIsAuthenticated(false);
          setAdminToken(null);
          sessionStorage.removeItem('duahau_admin_token');
          setLoginStep('credentials');
        }
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i mÃ¡y chá»§ quáº£n trá»‹', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1: Request 2FA OTP to Email
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setLoginSuccessNotice(null);
    setIsRequestingOtp(true);
    sound.playClick();

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_otp',
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpSessionId(data.sessionId);
        setOtpMaskedEmail(data.maskedEmail || 'email cá»§a quáº£n trá»‹');
        setLoginStep('otp');
        setOtpCountdown(300);
        setLoginOtp('');
        setLoginSuccessNotice(data.message || `MÃ£ xÃ¡c thá»±c 2FA 6 sá»‘ Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n email ${data.maskedEmail}!`);
        sound.playSuccess();
      } else {
        setLoginError(data.error || 'TÃªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u quáº£n trá»‹ khÃ´ng Ä‘Ãºng.');
        sound.playWrong();
      }
    } catch {
      setLoginError('Lá»—i káº¿t ná»‘i mÃ¡y chá»§ khi gá»­i mÃ£ xÃ¡c thá»±c báº£o máº­t.');
      sound.playWrong();
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // STEP 2: Verify OTP and Obtain Encrypted Session Token
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = loginOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setLoginError('Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ 6 chá»¯ sá»‘ mÃ£ xÃ¡c thá»±c OTP.');
      sound.playWrong();
      return;
    }

    setLoginError(null);
    setIsVerifyingOtp(true);
    sound.playClick();

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          sessionId: otpSessionId,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sound.playCelebration();
        sessionStorage.setItem('duahau_admin_token', data.token);
        setAdminToken(data.token);
        setIsAuthenticated(true);
        setLoginStep('credentials');
        setLoginPassword('');
        setLoginOtp('');
        fetchAdminData(data.token);
        fetchSummary(data.token);
        fetchSupport(data.token);
        showToast('XÃ¡c thá»±c 2 lá»›p thÃ nh cÃ´ng! ChÃ o má»«ng Quáº£n trá»‹ viÃªn.', 'success');
      } else {
        setLoginError(data.error || 'MÃ£ xÃ¡c thá»±c khÃ´ng chÃ­nh xÃ¡c.');
        sound.playWrong();
      }
    } catch {
      setLoginError('Lá»—i káº¿t ná»‘i mÃ¡y chá»§ khi xÃ¡c minh mÃ£ OTP.');
      sound.playWrong();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = () => {
    sound.playClick();
    sessionStorage.removeItem('duahau_admin_token');
    try {
      const rawUser = localStorage.getItem('english_for_me_user');
      if (rawUser && rawUser.includes('"username":"admin"')) {
        localStorage.removeItem('english_for_me_user');
      }
    } catch {}
    setAdminToken(null);
    setIsAuthenticated(false);
    setLoginStep('credentials');
    setLoginPassword('');
    setLoginOtp('');
    setUsers([]);
    setStats(null);
  };

  // Perform Admin User Actions (Secured with AES-256 Bearer Token)
  const executeAdminAction = async (payload: any) => {
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) {
      showToast('PhiÃªn lÃ m viá»‡c Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i.', 'error');
      setIsAuthenticated(false);
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token,
          ...payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setModalType(null);
        setSelectedUser(null);
        fetchAdminData(token);
      } else {
        showToast(data.error || 'Thao tÃ¡c tháº¥t báº¡i', 'error');
        if (res.status === 401) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('duahau_admin_token');
        }
      }
    } catch {
      showToast('Lá»—i mÃ¡y chá»§ khi thá»±c hiá»‡n thao tÃ¡c', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Trigger Filebase Backup (Secured with Bearer Token)
  const handleTriggerBackup = async () => {
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    setIsBackingUp(true);
    sound.playClick();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token,
          action: 'trigger_backup',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'ÄÃ£ sao lÆ°u lÃªn S3 Filebase thÃ nh cÃ´ng 100%! ðŸš€', 'success');
        fetchAdminData(token);
      } else {
        const errMsg = data.message || data.error || (data.s3Status?.lastSyncMessage) || 'Sao lÆ°u Filebase S3 tháº¥t báº¡i';
        showToast(errMsg, 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i S3 Filebase', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Fetch System Logs Summary
  const fetchSummary = async (tokenToUse?: string) => {
    const token = tokenToUse || adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/logs?type=summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setLogSummary(data.summary);
      }
    } catch {}
  };

  // Fetch Logs (Access, Error, Email)
  const fetchLogs = async (
    tabToFetch?: string,
    pageToUse = 1,
    search = logSearch,
    filter = logFilter,
    tokenToUse?: string
  ) => {
    const currentTab = tabToFetch || activeAdminTab;
    let type = 'access';
    if (currentTab === 'access_logs') type = 'access';
    else if (currentTab === 'error_logs') type = 'error';
    else if (currentTab === 'email_logs') type = 'email';
    else return;

    const token = tokenToUse || adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    setIsLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        type,
        page: String(pageToUse),
        limit: '30',
        search: search.trim(),
        filter,
      });
      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (type === 'access') setAccessLogs(data.logs || []);
        else if (type === 'error') setErrorLogs(data.logs || []);
        else if (type === 'email') setEmailLogs(data.logs || []);
        setLogTotal(data.total || 0);
        setLogPage(data.page || 1);
        if (data.summary) setLogSummary(data.summary);
      } else {
        showToast(data.error || 'KhÃ´ng thá»ƒ táº£i nháº­t kÃ½ há»‡ thá»‘ng', 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i khi táº£i nháº­t kÃ½', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch Support Messages
  const fetchSupport = async (
    tokenToUse?: string,
    status = supportFilterStatus,
    category = supportFilterCategory,
    search = supportSearch
  ) => {
    const token = tokenToUse || adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    setIsLoadingSupport(true);
    try {
      const params = new URLSearchParams({
        status,
        category,
        search: search.trim(),
      });
      const res = await fetch(`/api/admin/support?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportMessages(data.messages || []);
        setSupportCounts(data.counts || null);
      } else {
        showToast(data.error || 'KhÃ´ng thá»ƒ táº£i tin nháº¯n gÃ³p Ã½', 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i khi táº£i tin nháº¯n gÃ³p Ã½', 'error');
    } finally {
      setIsLoadingSupport(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async (type: string) => {
    const typeLabel = type === 'access' ? 'truy cáº­p' : type === 'error' ? 'lá»—i' : 'email';
    if (!confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a toÃ n bá»™ nháº­t kÃ½ ${typeLabel}? Thao tÃ¡c nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.`)) {
      return;
    }
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    try {
      const res = await fetch('/api/admin/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'clear', type }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'ÄÃ£ dá»n dáº¹p nháº­t kÃ½ thÃ nh cÃ´ng', 'success');
        fetchLogs(activeAdminTab, 1);
        fetchSummary();
      } else {
        showToast(data.error || 'Dá»n dáº¹p tháº¥t báº¡i', 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i khi xÃ³a nháº­t kÃ½', 'error');
    }
  };

  // Update Support Status
  const handleUpdateSupportStatus = async (ticketId: string, status: string) => {
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'update_status', ticketId, status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh cÃ´ng', 'success');
        fetchSupport();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: status as any });
        }
      } else {
        showToast(data.error || 'Cáº­p nháº­t tháº¥t báº¡i', 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i khi cáº­p nháº­t', 'error');
    }
  };

  // Reply Support Ticket via Email
  const handleReplySupportTicket = async (ticketId: string) => {
    if (!adminReplyText.trim()) {
      showToast('Vui lÃ²ng nháº­p ná»™i dung pháº£n há»“i', 'error');
      return;
    }
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    setIsReplyingTicket(true);
    sound.playClick();
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reply',
          ticketId,
          replyContent: adminReplyText.trim(),
          markResolved: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCelebration();
        showToast('ÄÃ£ gá»­i pháº£n há»“i thÃ nh cÃ´ng qua email cho thÃ nh viÃªn!', 'success');
        setAdminReplyText('');
        setSelectedTicket(null);
        fetchSupport();
        fetchSummary();
      } else {
        showToast(data.error || 'Gá»­i pháº£n há»“i tháº¥t báº¡i', 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i khi gá»­i pháº£n há»“i', 'error');
    } finally {
      setIsReplyingTicket(false);
    }
  };

  // Delete Support Ticket
  const handleDeleteSupportTicket = async (ticketId: string) => {
    if (!confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a tin nháº¯n gÃ³p Ã½ nÃ y?')) return;
    const token = adminToken || sessionStorage.getItem('duahau_admin_token');
    if (!token) return;

    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'delete', ticketId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('ÄÃ£ xÃ³a gÃ³p Ã½', 'success');
        if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        fetchSupport();
      } else {
        showToast(data.error || 'XÃ³a tháº¥t báº¡i', 'error');
      }
    } catch {
      showToast('Lá»—i káº¿t ná»‘i khi xÃ³a', 'error');
    }
  };

  // Tab switch effect
  useEffect(() => {
    if (isAuthenticated) {
      setLogSearch('');
      setLogFilter('all');
      setLogPage(1);
      if (activeAdminTab === 'access_logs' || activeAdminTab === 'error_logs' || activeAdminTab === 'email_logs') {
        fetchLogs(activeAdminTab, 1, '', 'all');
      } else if (activeAdminTab === 'support') {
        fetchSupport(undefined, 'all', 'all', '');
      }
    }
  }, [activeAdminTab, isAuthenticated]);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return u.status !== 'disabled';
    if (statusFilter === 'disabled') return u.status === 'disabled';
    return true;
  });

  // =========================================================================
  // VIEW 1: ADMIN LOGIN SCREEN (MÃ€N HÃŒNH ÄÄ‚NG NHáº¬P Báº¢O Máº¬T 2FA DÆ¯A Háº¤U)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-slate-100 flex items-center justify-center p-4 py-8 select-none">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Neon Glow Watermelon Accents */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-emerald-500 text-3xl shadow-lg ring-4 ring-rose-500/20 mb-2">
              {loginStep === 'credentials' ? 'ðŸ‰' : 'ðŸ›¡ï¸'}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>{loginStep === 'credentials' ? 'Quáº£n Trá»‹ DÆ°a Háº¥u' : 'XÃ¡c Thá»±c 2 Lá»›p (2FA)'}</span>
              <span className="text-xs bg-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {loginStep === 'credentials'
                ? 'Há»‡ thá»‘ng báº£o máº­t AES-256-GCM & XÃ¡c thá»±c qua Email'
                : 'Nháº­p mÃ£ 6 chá»¯ sá»‘ Ä‘Ã£ Ä‘Æ°á»£c gá»­i tá»›i email quáº£n trá»‹'}
            </p>
          </div>

          {/* Success notice */}
          {loginSuccessNotice && (
            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{loginSuccessNotice}</span>
            </div>
          )}

          {/* Error notice */}
          {loginError && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS INPUT */}
          {loginStep === 'credentials' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  TÃ i khoáº£n Quáº£n Trá»‹:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-2.5 text-sm text-white font-mono outline-none transition"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Máº­t kháº©u Root:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-2.5 text-sm text-white outline-none transition"
                    placeholder="Nháº­p máº­t kháº©u quáº£n trá»‹..."
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400 flex items-start gap-2">
                <Mail className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Äá»ƒ báº£o máº­t tuyá»‡t Ä‘á»‘i, há»‡ thá»‘ng sáº½ gá»­i mÃ£ OTP gá»“m 6 chá»¯ sá»‘ vá» email quáº£n trá»‹{' '}
                  <strong className="text-emerald-400 font-mono">{otpMaskedEmail}</strong> Ä‘á»ƒ báº¡n xÃ¡c thá»±c trÆ°á»›c khi cáº¥p quyá»n truy cáº­p.
                </span>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full mt-2 py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-emerald-600 hover:opacity-95 active:scale-98 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRequestingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Äang gá»­i mÃ£ 2FA tá»›i Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gá»­i MÃ£ XÃ¡c Thá»±c 2FA</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP INPUT */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                <div className="text-[11px] text-slate-400">Email nháº­n mÃ£:</div>
                <div className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                  {otpMaskedEmail}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                  Nháº­p mÃ£ 6 sá»‘ (OTP):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl py-3 text-center text-3xl font-black text-white font-mono tracking-[0.4em] outline-none transition shadow-inner"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢"
                    required
                  />
                </div>
              </div>

              {/* Countdown timer */}
              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Háº¿t háº¡n: <strong className="text-amber-300 font-mono">{Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={isRequestingOtp || otpCountdown > 240}
                  className="text-xs text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer disabled:opacity-40 disabled:no-underline"
                >
                  {isRequestingOtp ? 'Äang gá»­i...' : 'Gá»­i láº¡i mÃ£'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || loginOtp.trim().length !== 6}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-rose-600 hover:opacity-95 active:scale-98 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Äang kiá»ƒm tra OTP...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>XÃ¡c Nháº­n & ÄÄƒng Nháº­p</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('credentials');
                    setLoginError(null);
                    setLoginSuccessNotice(null);
                    setLoginOtp('');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  â† Quay láº¡i nháº­p máº­t kháº©u
                </button>
              </div>
            </form>
          )}

          {/* Footer Back link */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay láº¡i á»©ng dá»¥ng há»c táº­p</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN CONSOLE (DASHBOARD & USER CONTROLLER)
  // =========================================================================
  return (
    <div className="min-h-full w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-black flex items-center gap-2 animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-700 border-emerald-400 text-white'
              : 'bg-rose-700 border-rose-400 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-emerald-500 flex items-center justify-center text-xl shadow-md">
            ðŸ‰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                DÆ°a Háº¥u Admin
              </h1>
              <span className="text-[10px] bg-rose-600/30 text-rose-400 border border-rose-500/50 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                /duahau
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Trung tÃ¢m quáº£n lÃ½ thÃ nh viÃªn & cÆ¡ sá»Ÿ dá»¯ liá»‡u</p>
          </div>
        </div>

        {/* 2FA Security Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl text-[11px] text-emerald-300 font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>Báº£o máº­t 2FA AES-256-GCM: {otpMaskedEmail}</span>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Filebase S3 Quick Backup */}
          <button
            onClick={handleTriggerBackup}
            disabled={isBackingUp}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-sky-950 border border-sky-700/60 hover:bg-sky-900 text-sky-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Thá»±c hiá»‡n sao lÆ°u thá»§ cÃ´ng SQLite lÃªn Filebase S3"
          >
            {isBackingUp ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isBackingUp ? 'Äang sao lÆ°u...' : 'Sao LÆ°u S3'}</span>
            <span className="sm:hidden">{isBackingUp ? '...' : 'S3'}</span>
          </button>

          <Link
            href="/"
            onClick={() => {
              try {
                const rawUser = localStorage.getItem('english_for_me_user');
                if (rawUser && rawUser.includes('"username":"admin"')) {
                  localStorage.removeItem('english_for_me_user');
                }
              } catch {}
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vá» App</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
            title="ÄÄƒng xuáº¥t khá»i há»‡ thá»‘ng quáº£n trá»‹"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ThoÃ¡t</span>
          </button>
        </div>
      </header>

      {/* MAIN ADMIN CONTENT */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Users */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Tá»•ng ThÃ nh ViÃªn</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats?.totalUsers || 0}</div>
            <div className="text-[11px] text-emerald-400 font-medium">Táº¥t cáº£ tÃ i khoáº£n trong SQLite</div>
          </div>

          {/* Card 2: Active Users */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Äang Hoáº¡t Äá»™ng</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400">{stats?.activeUsers || 0}</div>
            <div className="text-[11px] text-slate-400 font-medium">
              KhÃ³a: <span className="text-rose-400 font-bold">{stats?.disabledUsers || 0}</span> tÃ i khoáº£n
            </div>
          </div>

          {/* Card 3: Total Coins */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Tá»•ng Coins LÆ°u ThÃ´ng</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {stats?.totalCoins?.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Sá»‘ dÆ° xu cá»§a má»i thÃ nh viÃªn</div>
          </div>

          {/* Card 4: S3 Backup */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Sao LÆ°u Filebase</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-black text-emerald-400 truncate">
              {stats?.s3Status?.remoteSize
                ? `${(stats.s3Status.remoteSize / 1024 / 1024).toFixed(2)} MB (Synced)`
                : 'Tá»± Ä‘á»™ng 15 phÃºt'}
            </div>
            <div className="text-[11px] text-slate-400 truncate font-mono">
              Bucket: {stats?.s3Status?.bucket || 'meowlish-db'}
            </div>
          </div>
        </div>

        {/* ADMIN TAB NAVIGATION BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto overscroll-x-contain scrollbar-none shadow-md">
          <button
            onClick={() => {
              setActiveAdminTab('users');
              sound.playClick();
            }}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'users'
                ? 'bg-rose-700 text-white shadow-lg shadow-rose-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ThÃ nh ViÃªn</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950/60 font-mono">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('access_logs');
              sound.playClick();
            }}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'access_logs'
                ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Log Access</span>
            {logSummary && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950/60 font-mono">
                {logSummary.totalAccess}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('error_logs');
              sound.playClick();
            }}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'error_logs'
                ? 'bg-rose-700 text-white shadow-lg shadow-rose-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Log Error</span>
            {logSummary && logSummary.totalErrors > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-mono animate-pulse">
                {logSummary.totalErrors}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('email_logs');
              sound.playClick();
            }}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'email_logs'
                ? 'bg-sky-700 text-white shadow-lg shadow-sky-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Log Email</span>
            {logSummary && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950/60 font-mono">
                {logSummary.totalEmailsSent + logSummary.totalEmailsFailed}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('support');
              sound.playClick();
            }}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'support'
                ? 'bg-amber-700 text-white shadow-lg shadow-amber-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Há»— Trá»£ & GÃ³p Ã</span>
            {supportCounts?.new && supportCounts.new > 0 ? (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-400 text-amber-950 font-black font-mono animate-bounce">
                {supportCounts.new} má»›i
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950/60 font-mono">
                {supportCounts?.total || 0}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: USER MANAGEMENT */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6">
            {/* CONTROLS & FILTER BAR */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="TÃ¬m theo username, tÃªn, email..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Táº¥t cáº£ ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Hoáº¡t Ä‘á»™ng ({users.filter((u) => u.status !== 'disabled').length})
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'disabled'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Bá»‹ khÃ³a ({users.filter((u) => u.status === 'disabled').length})
            </button>
            <button
              onClick={() => fetchAdminData()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              title="LÃ m má»›i danh sÃ¡ch"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[720px]">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">NgÆ°á»i DÃ¹ng</th>
                  <th className="py-3 px-4">Tráº¡ng ThÃ¡i</th>
                  <th className="py-3 px-4">Cáº¥p & EXP</th>
                  <th className="py-3 px-4">Sá»‘ Xu (Coins)</th>
                  <th className="py-3 px-4">ThÃº CÆ°ng</th>
                  <th className="py-3 px-4">Hoáº¡t Äá»™ng</th>
                  <th className="py-3 px-4 text-right">Quáº£n Trá»‹ Thao TÃ¡c</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng nÃ o phÃ¹ há»£p.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isRootAdmin = user.username === 'admin';
                    const isDisabled = user.status === 'disabled';

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-800/40 transition ${
                          isDisabled ? 'opacity-65 bg-rose-950/10' : ''
                        }`}
                      >
                        {/* 1. User Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-1.5 rounded-xl bg-slate-800 border border-slate-700">
                              {user.avatar || 'ðŸ¦‰'}
                            </span>
                            <div>
                              <div className="font-black text-white flex items-center gap-1.5">
                                <span>{user.display_name}</span>
                                {isRootAdmin && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-mono">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                @{user.username}
                              </div>
                              {user.email && (
                                <div className="text-[10px] text-slate-400 font-mono" title={user.email}>
                                  {maskEmail(user.email)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Status */}
                        <td className="py-3.5 px-4">
                          {isDisabled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                              <Lock className="w-3 h-3" />
                              Bá»‹ KhÃ³a
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <Unlock className="w-3 h-3" />
                              Hoáº¡t Äá»™ng
                            </span>
                          )}
                        </td>

                        {/* 3. Level & EXP */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-sky-400">Lv.{user.level || 1}</div>
                          <div className="text-[11px] text-slate-400">{user.exp || 0} EXP</div>
                        </td>

                        {/* 4. Coins */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-amber-400 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{(user.coins || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* 5. Pet */}
                        <td className="py-3.5 px-4">
                          {user.pet_type ? (
                            <div>
                              <div className="font-bold text-white text-xs capitalize">
                                {user.pet_name || user.pet_type}
                              </div>
                              <div className="text-[10px] text-emerald-400">
                                Lv.{user.pet_level || 1} â€¢ {user.pet_type}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">ChÆ°a cÃ³</span>
                          )}
                        </td>

                        {/* 6. Activity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-xs text-orange-400 font-bold">
                            <Flame className="w-3 h-3" />
                            <span>{user.streak || 0} ngÃ y</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {user.last_active_date || 'Gáº§n Ä‘Ã¢y'}
                          </div>
                        </td>

                        {/* 7. Action Tools */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Enable/Disable Toggle */}
                            {!isRootAdmin && (
                              <button
                                onClick={() =>
                                  executeAdminAction({
                                    action: 'toggle_status',
                                    targetUserId: user.id,
                                  })
                                }
                                disabled={isSubmittingAction}
                                className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                  isDisabled
                                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 hover:bg-emerald-600 hover:text-white'
                                    : 'bg-rose-600/20 text-rose-300 border-rose-500 hover:bg-rose-600 hover:text-white'
                                }`}
                                title={isDisabled ? 'KÃ­ch hoáº¡t láº¡i tÃ i khoáº£n' : 'KhÃ³a tÃ i khoáº£n'}
                              >
                                {isDisabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Set Coins */}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEditCoinsInput(user.coins || 0);
                                setModalType('coins');
                              }}
                              className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                              title="Chá»‰nh sá»­a sá»‘ Xu (Set Coins)"
                            >
                              <Coins className="w-4 h-4" />
                            </button>

                            {/* Set Level & EXP */}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEditLevelInput(user.level || 1);
                                setEditExpInput(user.exp || 0);
                                setModalType('level');
                              }}
                              className="p-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500 hover:text-white transition cursor-pointer"
                              title="Chá»‰nh sá»­a Cáº¥p Ä‘á»™ & EXP (Set Level)"
                            >
                              <Award className="w-4 h-4" />
                            </button>

                            {/* Set Password */}
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setNewPasswordInput('');
                                setModalType('password');
                              }}
                              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                              title="Äáº·t láº¡i máº­t kháº©u cho thÃ nh viÃªn"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Delete User */}
                            {!isRootAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setModalType('delete');
                                }}
                                className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                                title="XÃ³a tÃ i khoáº£n vÄ©nh viá»…n"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

        {/* TAB 2: ACCESS LOGS */}
        {activeAdminTab === 'access_logs' && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex flex-1 w-full md:w-auto items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchLogs('access_logs', 1, logSearch, logFilter);
                    }}
                    placeholder="TÃ¬m theo user, IP, hÃ nh Ä‘á»™ng, user agent..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchLogs('access_logs', 1, logSearch, logFilter)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  TÃ¬m
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <select
                  value={logFilter}
                  onChange={(e) => {
                    const newFilter = e.target.value;
                    setLogFilter(newFilter);
                    fetchLogs('access_logs', 1, logSearch, newFilter);
                  }}
                  aria-label="Lá»c hÃ nh Ä‘á»™ng truy cáº­p"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-emerald-500"
                >
                  <option value="all">Táº¥t cáº£ hÃ nh Ä‘á»™ng</option>
                  <option value="login_success">ÄÄƒng nháº­p thÃ nh cÃ´ng</option>
                  <option value="login_failed">ÄÄƒng nháº­p tháº¥t báº¡i</option>
                  <option value="register_success">ÄÄƒng kÃ½ thÃ nh cÃ´ng</option>
                  <option value="otp_requested">Gá»­i mÃ£ OTP</option>
                  <option value="otp_verified">XÃ¡c thá»±c OTP</option>
                  <option value="support_ticket">Gá»­i gÃ³p Ã½ há»— trá»£</option>
                  <option value="admin_action">Thao tÃ¡c Admin</option>
                  <option value="backup_triggered">Sao lÆ°u S3</option>
                </select>

                <button
                  onClick={() => fetchLogs('access_logs', logPage, logSearch, logFilter)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="LÃ m má»›i danh sÃ¡ch"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin text-emerald-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleClearLogs('access')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/50 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Dá»n dáº¹p log access cÅ©"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dá»n dáº¹p</span>
                </button>
              </div>
            </div>

            {/* Access Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Thá»i gian</th>
                      <th className="py-3 px-4">NgÆ°á»i dÃ¹ng</th>
                      <th className="py-3 px-4">HÃ nh Ä‘á»™ng</th>
                      <th className="py-3 px-4">Äá»‹a chá»‰ IP</th>
                      <th className="py-3 px-4">Chi tiáº¿t</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Thiáº¿t bá»‹ (User Agent)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {accessLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                          {isLoadingLogs ? 'Äang táº£i dá»¯ liá»‡u...' : 'KhÃ´ng cÃ³ báº£n ghi nháº­t kÃ½ truy cáº­p nÃ o phÃ¹ há»£p.'}
                        </td>
                      </tr>
                    ) : (
                      accessLogs.map((log) => {
                        const isSuccess = log.action?.includes('success') || log.status === 'success';
                        const isFail = log.action?.includes('fail') || log.status === 'failed';
                        const isOtp = log.action?.includes('otp');

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{log.username || 'KhÃ¡ch'}</span>
                                {log.username === 'admin' && (
                                  <span className="text-[9px] bg-rose-600/40 text-rose-300 border border-rose-500/40 px-1 py-0.2 rounded font-mono">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              {log.user_id && (
                                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                                  {log.user_id}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isFail
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : isSuccess
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isOtp
                                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                              {log.ip || '-'}
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-xs max-w-xs break-words">
                              {log.details || '-'}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[10px] hidden lg:table-cell max-w-[200px] truncate" title={log.user_agent}>
                              {log.user_agent || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Tá»•ng cá»™ng: <strong className="text-white font-mono">{logTotal}</strong> báº£n ghi
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={logPage <= 1 || isLoadingLogs}
                    onClick={() => fetchLogs('access_logs', logPage - 1, logSearch, logFilter)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-300">
                    Trang {logPage} / {Math.max(1, Math.ceil(logTotal / 30))}
                  </span>
                  <button
                    disabled={logPage >= Math.ceil(logTotal / 30) || isLoadingLogs}
                    onClick={() => fetchLogs('access_logs', logPage + 1, logSearch, logFilter)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ERROR LOGS */}
        {activeAdminTab === 'error_logs' && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex flex-1 w-full md:w-auto items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchLogs('error_logs', 1, logSearch, logFilter);
                    }}
                    placeholder="TÃ¬m theo endpoint, thÃ´ng bÃ¡o lá»—i, IP..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-rose-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchLogs('error_logs', 1, logSearch, logFilter)}
                  className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  TÃ¬m
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <select
                  value={logFilter}
                  onChange={(e) => {
                    const newFilter = e.target.value;
                    setLogFilter(newFilter);
                    fetchLogs('error_logs', 1, logSearch, newFilter);
                  }}
                  aria-label="Lá»c má»©c Ä‘á»™ lá»—i"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-rose-500"
                >
                  <option value="all">Táº¥t cáº£ má»©c Ä‘á»™</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                  <option value="warn">Warning</option>
                </select>

                <button
                  onClick={() => fetchLogs('error_logs', logPage, logSearch, logFilter)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="LÃ m má»›i danh sÃ¡ch"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin text-rose-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleClearLogs('error')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/50 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Dá»n dáº¹p log error cÅ©"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dá»n dáº¹p</span>
                </button>
              </div>
            </div>

            {/* Error Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Thá»i gian</th>
                      <th className="py-3 px-4">Má»©c Ä‘á»™</th>
                      <th className="py-3 px-4">Endpoint</th>
                      <th className="py-3 px-4">ThÃ´ng bÃ¡o lá»—i</th>
                      <th className="py-3 px-4">IP / User</th>
                      <th className="py-3 px-4 text-center">Stack Trace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {errorLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                          {isLoadingLogs ? 'Äang táº£i dá»¯ liá»‡u...' : 'Há»‡ thá»‘ng an toÃ n! ChÆ°a ghi nháº­n lá»—i nÃ o gáº§n Ä‘Ã¢y.'}
                        </td>
                      </tr>
                    ) : (
                      errorLogs.map((log) => {
                        const isCritical = log.severity === 'critical';
                        const isWarn = log.severity === 'warn';
                        const isExpanded = expandedStackId === String(log.id);

                        return (
                          <React.Fragment key={log.id}>
                            <tr className="hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                                {new Date(log.timestamp).toLocaleString('vi-VN')}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    isCritical
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : isWarn
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  }`}
                                >
                                  {log.severity || 'error'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-rose-300 text-xs font-bold whitespace-nowrap">
                                {log.endpoint || '-'}
                              </td>
                              <td className="py-3 px-4 text-rose-200 text-xs font-semibold max-w-sm break-words">
                                {log.error_message || 'Unknown error'}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                                <div>{log.ip || '-'}</div>
                                {log.user_id && <div className="text-[10px] text-slate-400">{log.user_id}</div>}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                {log.stack_trace ? (
                                  <button
                                    onClick={() => setExpandedStackId(isExpanded ? null : String(log.id))}
                                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer"
                                  >
                                    {isExpanded ? 'áº¨n' : 'Xem'}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">KhÃ´ng cÃ³</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && log.stack_trace && (
                              <tr className="bg-slate-950 border-t border-b border-rose-900/40">
                                <td colSpan={6} className="p-4">
                                  <div className="p-3 bg-black/60 rounded-2xl border border-rose-500/30 overflow-x-auto text-[11px] font-mono text-rose-300 whitespace-pre-wrap leading-relaxed">
                                    {log.stack_trace}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Tá»•ng cá»™ng: <strong className="text-white font-mono">{logTotal}</strong> báº£n ghi
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={logPage <= 1 || isLoadingLogs}
                    onClick={() => fetchLogs('error_logs', logPage - 1, logSearch, logFilter)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-300">
                    Trang {logPage} / {Math.max(1, Math.ceil(logTotal / 30))}
                  </span>
                  <button
                    disabled={logPage >= Math.ceil(logTotal / 30) || isLoadingLogs}
                    onClick={() => fetchLogs('error_logs', logPage + 1, logSearch, logFilter)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EMAIL LOGS */}
        {activeAdminTab === 'email_logs' && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex flex-1 w-full md:w-auto items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchLogs('email_logs', 1, logSearch, logFilter);
                    }}
                    placeholder="TÃ¬m theo email, tiÃªu Ä‘á», má»¥c Ä‘Ã­ch..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-sky-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchLogs('email_logs', 1, logSearch, logFilter)}
                  className="px-3.5 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  TÃ¬m
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <select
                  value={logFilter}
                  onChange={(e) => {
                    const newFilter = e.target.value;
                    setLogFilter(newFilter);
                    fetchLogs('email_logs', 1, logSearch, newFilter);
                  }}
                  aria-label="Lá»c tráº¡ng thÃ¡i email"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-sky-500"
                >
                  <option value="all">Táº¥t cáº£ tráº¡ng thÃ¡i</option>
                  <option value="sent">ÄÃ£ gá»­i thÃ nh cÃ´ng</option>
                  <option value="failed">Gá»­i tháº¥t báº¡i</option>
                </select>

                <button
                  onClick={() => fetchLogs('email_logs', logPage, logSearch, logFilter)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="LÃ m má»›i danh sÃ¡ch"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin text-sky-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleClearLogs('email')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/50 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Dá»n dáº¹p log email cÅ©"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dá»n dáº¹p</span>
                </button>
              </div>
            </div>

            {/* Email Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Thá»i gian</th>
                      <th className="py-3 px-4">NgÆ°á»i nháº­n</th>
                      <th className="py-3 px-4">Má»¥c Ä‘Ã­ch</th>
                      <th className="py-3 px-4">TiÃªu Ä‘á» email</th>
                      <th className="py-3 px-4">Tráº¡ng thÃ¡i</th>
                      <th className="py-3 px-4">IP gá»­i</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {emailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                          {isLoadingLogs ? 'Äang táº£i dá»¯ liá»‡u...' : 'ChÆ°a ghi nháº­n lá»‹ch sá»­ gá»­i email nÃ o.'}
                        </td>
                      </tr>
                    ) : (
                      emailLogs.map((log) => {
                        const isSent = log.status === 'sent';

                        let purposeLabel = log.purpose;
                        if (log.purpose === 'register_otp') purposeLabel = 'MÃ£ OTP ÄÄƒng KÃ½';
                        else if (log.purpose === 'login_otp') purposeLabel = 'MÃ£ OTP ÄÄƒng Nháº­p';
                        else if (log.purpose === 'admin_otp') purposeLabel = '2FA Quáº£n Trá»‹';
                        else if (log.purpose === 'support_notification') purposeLabel = 'ThÃ´ng bÃ¡o GÃ³p Ã½';
                        else if (log.purpose === 'support_reply') purposeLabel = 'Pháº£n há»“i GÃ³p Ã½';

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3 px-4 font-mono text-sky-400 text-xs font-semibold whitespace-nowrap">
                              {log.recipient}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {purposeLabel}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-200 text-xs font-medium max-w-xs break-words">
                              {log.subject || '-'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isSent ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <Check className="w-3 h-3" />
                                  <span>ÄÃ£ gá»­i</span>
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    <X className="w-3 h-3" />
                                    <span>Tháº¥t báº¡i</span>
                                  </span>
                                  {log.error_message && (
                                    <div className="text-[10px] text-rose-400 font-mono truncate max-w-xs" title={log.error_message}>
                                      {log.error_message}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                              {log.ip || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Tá»•ng cá»™ng: <strong className="text-white font-mono">{logTotal}</strong> báº£n ghi
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={logPage <= 1 || isLoadingLogs}
                    onClick={() => fetchLogs('email_logs', logPage - 1, logSearch, logFilter)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-300">
                    Trang {logPage} / {Math.max(1, Math.ceil(logTotal / 30))}
                  </span>
                  <button
                    disabled={logPage >= Math.ceil(logTotal / 30) || isLoadingLogs}
                    onClick={() => fetchLogs('email_logs', logPage + 1, logSearch, logFilter)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUPPORT & FEEDBACK */}
        {activeAdminTab === 'support' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex flex-1 w-full md:w-auto items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={supportSearch}
                    onChange={(e) => setSupportSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchSupport(undefined, supportFilterStatus, supportFilterCategory, supportSearch);
                    }}
                    placeholder="TÃ¬m theo tÃªn, email, tiÃªu Ä‘á», ná»™i dung..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchSupport(undefined, supportFilterStatus, supportFilterCategory, supportSearch)}
                  className="px-3.5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  TÃ¬m
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <select
                  value={supportFilterCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSupportFilterCategory(newCat);
                    fetchSupport(undefined, supportFilterStatus, newCat, supportSearch);
                  }}
                  aria-label="Lá»c thá»ƒ loáº¡i gÃ³p Ã½"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-amber-500"
                >
                  <option value="all">Táº¥t cáº£ phÃ¢n loáº¡i</option>
                  <option value="feedback">ðŸ’¡ GÃ³p Ã½ tÃ­nh nÄƒng</option>
                  <option value="bug">ðŸ› BÃ¡o lá»—i há»‡ thá»‘ng</option>
                  <option value="guide">ðŸ“– HÆ°á»›ng dáº«n sá»­ dá»¥ng</option>
                  <option value="other">ðŸ’¬ KhÃ¡c</option>
                </select>

                <button
                  onClick={() => fetchSupport(undefined, supportFilterStatus, supportFilterCategory, supportSearch)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="LÃ m má»›i danh sÃ¡ch"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSupport ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
              <button
                onClick={() => {
                  setSupportFilterStatus('all');
                  fetchSupport(undefined, 'all', supportFilterCategory, supportSearch);
                }}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  supportFilterStatus === 'all'
                    ? 'bg-amber-700 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Táº¥t cáº£ ({supportCounts?.total || 0})
              </button>
              <button
                onClick={() => {
                  setSupportFilterStatus('new');
                  fetchSupport(undefined, 'new', supportFilterCategory, supportSearch);
                }}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  supportFilterStatus === 'new'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300'
                }`}
              >
                Má»›i tiáº¿p nháº­n ({supportCounts?.new || 0})
              </button>
              <button
                onClick={() => {
                  setSupportFilterStatus('processing');
                  fetchSupport(undefined, 'processing', supportFilterCategory, supportSearch);
                }}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  supportFilterStatus === 'processing'
                    ? 'bg-sky-700 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300'
                }`}
              >
                Äang xá»­ lÃ½ ({supportCounts?.processing || 0})
              </button>
              <button
                onClick={() => {
                  setSupportFilterStatus('resolved');
                  fetchSupport(undefined, 'resolved', supportFilterCategory, supportSearch);
                }}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  supportFilterStatus === 'resolved'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300'
                }`}
              >
                ÄÃ£ giáº£i quyáº¿t ({supportCounts?.resolved || 0})
              </button>
            </div>

            {/* Support Tickets List */}
            {supportMessages.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs sm:text-sm shadow-md">
                {isLoadingSupport ? 'Äang táº£i dá»¯ liá»‡u...' : 'ChÆ°a cÃ³ thÆ° gÃ³p Ã½ nÃ o trong má»¥c nÃ y.'}
              </div>
            ) : (
              <div className="space-y-4">
                {supportMessages.map((ticket) => {
                  let catColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  let catLabel = 'ðŸ’¬ KhÃ¡c';
                  if (ticket.category === 'feedback') {
                    catColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                    catLabel = 'ðŸ’¡ GÃ³p Ã½';
                  } else if (ticket.category === 'bug') {
                    catColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                    catLabel = 'ðŸ› BÃ¡o lá»—i';
                  } else if (ticket.category === 'guide') {
                    catColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
                    catLabel = 'ðŸ“– Há»c táº­p';
                  } else if (ticket.category === 'account') {
                    catColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                    catLabel = 'ðŸ”’ TÃ i khoáº£n';
                  }

                  let prioBadge = null;
                  if (ticket.priority === 'urgent') {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/20 text-rose-300 border-rose-500/40">ðŸ”´ Kháº©n cáº¥p</span>;
                  } else if (ticket.priority === 'high') {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-orange-500/20 text-orange-300 border-orange-500/40">ðŸŸ  Æ¯u tiÃªn cao</span>;
                  } else if (ticket.priority === 'low') {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">ðŸŸ¢ Tháº¥p</span>;
                  } else {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40">ðŸŸ¡ Trung bÃ¬nh</span>;
                  }

                  return (
                    <div
                      key={ticket.id}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3.5 hover:border-slate-700 transition"
                    >
                      {/* Top bar: Category + Rating + Status + Time */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catColor}`}>
                            {catLabel}
                          </span>
                          {prioBadge}

                          {/* Star Rating */}
                          <div className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-950 rounded-full border border-slate-800">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < (ticket.rating || 5)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-500'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Status Pill */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              ticket.status === 'new'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : ticket.status === 'processing'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {ticket.status === 'new'
                              ? 'ðŸŸ¡ Má»›i tiáº¿p nháº­n'
                              : ticket.status === 'processing'
                              ? 'ðŸ”µ Äang xá»­ lÃ½'
                              : 'ðŸŸ¢ ÄÃ£ giáº£i quyáº¿t'}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400">
                          {new Date(ticket.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>

                      {/* Sender Info & Subject */}
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm">{ticket.name}</span>
                          <span>â€¢</span>
                          <a
                            href={`mailto:${ticket.email}`}
                            className="text-sky-400 hover:underline font-mono"
                          >
                            {ticket.email}
                          </a>
                          {ticket.user_id && (
                            <>
                              <span>â€¢</span>
                              <span className="font-mono text-[10px] text-slate-400">ID: {ticket.user_id}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-amber-300">
                          {ticket.subject}
                        </h3>
                      </div>

                      {/* Message Content */}
                      <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {ticket.message}
                      </div>

                      {/* Admin Reply History if available */}
                      {ticket.admin_reply && (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-xs space-y-1">
                          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Quáº£n trá»‹ viÃªn Ä‘Ã£ pháº£n há»“i:</span>
                            {ticket.resolved_at && (
                              <span className="text-[10px] font-mono text-emerald-500 font-normal">
                                ({new Date(ticket.resolved_at).toLocaleString('vi-VN')})
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed pl-5">
                            {ticket.admin_reply}
                          </p>
                        </div>
                      )}

                      {/* Action Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        {/* Status Switchers */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 font-semibold mr-1">Chuyá»ƒn:</span>
                          {ticket.status !== 'processing' && (
                            <button
                              onClick={() => handleUpdateSupportStatus(ticket.id, 'processing')}
                              className="px-2 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold hover:bg-sky-900 transition cursor-pointer"
                            >
                              Äang xá»­ lÃ½
                            </button>
                          )}
                          {ticket.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateSupportStatus(ticket.id, 'resolved')}
                              className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold hover:bg-emerald-900 transition cursor-pointer"
                            >
                              ÄÃ£ giáº£i quyáº¿t
                            </button>
                          )}
                          {ticket.status !== 'new' && (
                            <button
                              onClick={() => handleUpdateSupportStatus(ticket.id, 'new')}
                              className="px-2 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold hover:bg-amber-900 transition cursor-pointer"
                            >
                              Äáº·t vá» Má»›i
                            </button>
                          )}
                        </div>

                        {/* Reply & Delete */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setAdminReplyText(ticket.admin_reply || '');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{ticket.admin_reply ? 'Pháº£n há»“i láº¡i' : 'Gá»­i Pháº£n Há»“i Email'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSupportTicket(ticket.id)}
                            className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                            title="XÃ³a gÃ³p Ã½ nÃ y"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODAL: EDIT COINS ================= */}
      {modalType === 'coins' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-y-contain custom-scrollbar bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-black text-base">
              <Coins className="w-5 h-5" />
              <span>Chá»‰nh Sá»­a Xu: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Cáº­p nháº­t trá»±c tiáº¿p sá»‘ dÆ° Coins cho tÃ i khoáº£n {selectedUser.display_name}.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sá»‘ Coins má»›i:</label>
              <input
                type="number"
                min="0"
                value={editCoinsInput}
                onChange={(e) => setEditCoinsInput(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-base font-black text-amber-300 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Há»§y
              </button>
              <button
                onClick={() =>
                  executeAdminAction({
                    action: 'set_coins',
                    targetUserId: selectedUser.id,
                    coins: editCoinsInput,
                  })
                }
                disabled={isSubmittingAction}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              >
                LÆ°u Thay Äá»•i
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT LEVEL & EXP ================= */}
      {modalType === 'level' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-y-contain custom-scrollbar bg-slate-900 border-2 border-sky-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-black text-base">
              <Award className="w-5 h-5" />
              <span>Chá»‰nh Sá»­a Cáº¥p Äá»™: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Thiáº¿t láº­p Level vÃ  Ä‘iá»ƒm kinh nghiá»‡m EXP cho {selectedUser.display_name}.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cáº¥p Äá»™ (Level):</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={editLevelInput}
                  onChange={(e) => setEditLevelInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-2xl px-4 py-2 text-sm font-black text-sky-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Äiá»ƒm EXP:</label>
                <input
                  type="number"
                  min="0"
                  value={editExpInput}
                  onChange={(e) => setEditExpInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-2xl px-4 py-2 text-sm font-black text-sky-300 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Há»§y
              </button>
              <button
                onClick={() =>
                  executeAdminAction({
                    action: 'set_level',
                    targetUserId: selectedUser.id,
                    level: editLevelInput,
                    exp: editExpInput,
                  })
                }
                disabled={isSubmittingAction}
                className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs cursor-pointer disabled:opacity-50"
              >
                Cáº­p Nháº­t Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SET PASSWORD ================= */}
      {modalType === 'password' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-y-contain custom-scrollbar bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-black text-base">
              <KeyRound className="w-5 h-5" />
              <span>Äá»•i Máº­t Kháº©u: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Nháº­p máº­t kháº©u má»›i cho tÃ i khoáº£n {selectedUser.display_name}. Máº­t kháº©u sáº½ Ä‘Æ°á»£c mÃ£ hÃ³a SHA-256 an toÃ n.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Máº­t kháº©u má»›i:</label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Nháº­p Ã­t nháº¥t 4 kÃ½ tá»±..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-2xl px-4 py-2.5 text-sm font-mono text-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Há»§y
              </button>
              <button
                onClick={() =>
                  executeAdminAction({
                    action: 'set_password',
                    targetUserId: selectedUser.id,
                    newPassword: newPasswordInput,
                  })
                }
                disabled={isSubmittingAction || newPasswordInput.trim().length < 4}
                className="flex-1 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-black text-xs cursor-pointer disabled:opacity-50"
              >
                XÃ¡c Nháº­n Äá»•i
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE USER ================= */}
      {modalType === 'delete' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-y-contain custom-scrollbar bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-black text-base">
              <Trash2 className="w-5 h-5" />
              <span>XÃ¡c Nháº­n XÃ³a TÃ i Khoáº£n</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a vÄ©nh viá»…n tÃ i khoáº£n <strong className="text-white font-bold">{selectedUser.display_name}</strong> (@{selectedUser.username})?
            </p>

            <div className="bg-rose-950/50 border border-rose-800/80 p-3 rounded-2xl text-[11px] text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Cáº£nh bÃ¡o há»‡ thá»‘ng:</span>
              </div>
              <p>
                ToÃ n bá»™ thÃº cÆ°ng, tá»« vá»±ng bookmark, lá»‹ch sá»­ thi vÃ  tiáº¿n Ä‘á»™ há»c táº­p sáº½ bá»‹ xÃ³a vÄ©nh viá»…n vÃ  khÃ´ng thá»ƒ khÃ´i phá»¥c. CÆ¡ sá»Ÿ dá»¯ liá»‡u sáº½ tá»± Ä‘á»™ng Ä‘á»“ng bá»™ lÃªn Filebase S3 ngay láº­p tá»©c.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition"
              >
                Há»§y bá»
              </button>
              <button
                onClick={() =>
                  executeAdminAction({
                    action: 'delete_user',
                    targetUserId: selectedUser.id,
                  })
                }
                disabled={isSubmittingAction}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-black text-xs cursor-pointer transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>XÃ³a vÄ©nh viá»…n</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPLY SUPPORT TICKET ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-y-contain custom-scrollbar bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-black text-base">
                <Mail className="w-5 h-5" />
                <span>Pháº£n Há»“i GÃ³p Ã Qua Email</span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket Summary Box */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Gá»­i tá»›i: <strong className="text-white">{selectedTicket.name}</strong> ({selectedTicket.email})</span>
                <span className="font-mono text-[10px]">{new Date(selectedTicket.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="text-amber-300 font-bold truncate">
                {selectedTicket.subject}
              </div>
              <p className="text-slate-300 line-clamp-3 italic text-[11px]">
                "{selectedTicket.message}"
              </p>
            </div>

            {/* Reply Input Form */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Ná»™i dung thÆ° pháº£n há»“i gá»­i tá»›i há»c viÃªn:
              </label>
              <textarea
                rows={5}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Nháº­p ná»™i dung tráº£ lá»i, hÆ°á»›ng dáº«n hoáº·c lá»i cáº£m Æ¡n tá»›i thÃ nh viÃªn..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition leading-relaxed resize-none"
              />
              <p className="text-[11px] text-slate-400">
                âœ‰ï¸ Email nÃ y sáº½ Ä‘Æ°á»£c gá»­i trá»±c tiáº¿p tá»›i hÃ²m thÆ° <strong className="text-white font-mono">{selectedTicket.email}</strong> tá»« ban quáº£n trá»‹ vÃ  tá»± Ä‘á»™ng Ä‘Ã¡nh dáº¥u gÃ³p Ã½ lÃ  <span className="text-emerald-400 font-bold">ÄÃ£ giáº£i quyáº¿t</span>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition"
              >
                Há»§y bá»
              </button>
              <button
                type="button"
                onClick={() => handleReplySupportTicket(selectedTicket.id)}
                disabled={isReplyingTicket || !adminReplyText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950 disabled:opacity-50"
              >
                {isReplyingTicket ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Äang gá»­i email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gá»­i ThÆ° Cho Há»c ViÃªn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

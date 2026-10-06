'use client';

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
    // Đảm bảo không bao giờ tồn tại tài khoản admin trong localStorage của người dùng
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
        showToast(data.error || 'Không thể tải dữ liệu quản trị', 'error');
        if (res.status === 401) {
          setIsAuthenticated(false);
          setAdminToken(null);
          sessionStorage.removeItem('duahau_admin_token');
          setLoginStep('credentials');
        }
      }
    } catch {
      showToast('Lỗi kết nối máy chủ quản trị', 'error');
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
        setOtpMaskedEmail(data.maskedEmail || 'email của quản trị');
        setLoginStep('otp');
        setOtpCountdown(300);
        setLoginOtp('');
        setLoginSuccessNotice(data.message || `Mã xác thực 2FA 6 số đã được gửi đến email ${data.maskedEmail}!`);
        sound.playSuccess();
      } else {
        setLoginError(data.error || 'Tên đăng nhập hoặc mật khẩu quản trị không đúng.');
        sound.playWrong();
      }
    } catch {
      setLoginError('Lỗi kết nối máy chủ khi gửi mã xác thực bảo mật.');
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
      setLoginError('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.');
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
        showToast('Xác thực 2 lớp thành công! Chào mừng Quản trị viên.', 'success');
      } else {
        setLoginError(data.error || 'Mã xác thực không chính xác.');
        sound.playWrong();
      }
    } catch {
      setLoginError('Lỗi kết nối máy chủ khi xác minh mã OTP.');
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
      showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
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
        showToast(data.error || 'Thao tác thất bại', 'error');
        if (res.status === 401) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('duahau_admin_token');
        }
      }
    } catch {
      showToast('Lỗi máy chủ khi thực hiện thao tác', 'error');
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
        showToast(data.message || 'Đã sao lưu lên S3 Filebase thành công 100%! 🚀', 'success');
        fetchAdminData(token);
      } else {
        const errMsg = data.message || data.error || (data.s3Status?.lastSyncMessage) || 'Sao lưu Filebase S3 thất bại';
        showToast(errMsg, 'error');
      }
    } catch {
      showToast('Lỗi kết nối S3 Filebase', 'error');
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
        showToast(data.error || 'Không thể tải nhật ký hệ thống', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi tải nhật ký', 'error');
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
        showToast(data.error || 'Không thể tải tin nhắn góp ý', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi tải tin nhắn góp ý', 'error');
    } finally {
      setIsLoadingSupport(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async (type: string) => {
    const typeLabel = type === 'access' ? 'truy cập' : type === 'error' ? 'lỗi' : 'email';
    if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ nhật ký ${typeLabel}? Thao tác này không thể hoàn tác.`)) {
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
        showToast(data.message || 'Đã dọn dẹp nhật ký thành công', 'success');
        fetchLogs(activeAdminTab, 1);
        fetchSummary();
      } else {
        showToast(data.error || 'Dọn dẹp thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi xóa nhật ký', 'error');
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
        showToast('Cập nhật trạng thái thành công', 'success');
        fetchSupport();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: status as any });
        }
      } else {
        showToast(data.error || 'Cập nhật thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi cập nhật', 'error');
    }
  };

  // Reply Support Ticket via Email
  const handleReplySupportTicket = async (ticketId: string) => {
    if (!adminReplyText.trim()) {
      showToast('Vui lòng nhập nội dung phản hồi', 'error');
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
        showToast('Đã gửi phản hồi thành công qua email cho thành viên!', 'success');
        setAdminReplyText('');
        setSelectedTicket(null);
        fetchSupport();
        fetchSummary();
      } else {
        showToast(data.error || 'Gửi phản hồi thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi gửi phản hồi', 'error');
    } finally {
      setIsReplyingTicket(false);
    }
  };

  // Delete Support Ticket
  const handleDeleteSupportTicket = async (ticketId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn góp ý này?')) return;
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
        showToast('Đã xóa góp ý', 'success');
        if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        fetchSupport();
      } else {
        showToast(data.error || 'Xóa thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi xóa', 'error');
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
  // VIEW 1: ADMIN LOGIN SCREEN (MÀN HÌNH ĐĂNG NHẬP BẢO MẬT 2FA DƯA HẤU)
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
              {loginStep === 'credentials' ? '🍉' : '🛡️'}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>{loginStep === 'credentials' ? 'Quản Trị Dưa Hấu' : 'Xác Thực 2 Lớp (2FA)'}</span>
              <span className="text-xs bg-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {loginStep === 'credentials'
                ? 'Hệ thống bảo mật AES-256-GCM & Xác thực qua Email'
                : 'Nhập mã 6 chữ số đã được gửi tới email quản trị'}
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
                  Tài khoản Quản Trị:
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
                  Mật khẩu Root:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-2.5 text-sm text-white outline-none transition"
                    placeholder="Nhập mật khẩu quản trị..."
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400 flex items-start gap-2">
                <Mail className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Để bảo mật tuyệt đối, hệ thống sẽ gửi mã OTP gồm 6 chữ số về email quản trị{' '}
                  <strong className="text-emerald-400 font-mono">{otpMaskedEmail}</strong> để bạn xác thực trước khi cấp quyền truy cập.
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
                    <span>Đang gửi mã 2FA tới Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Mã Xác Thực 2FA</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP INPUT */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                <div className="text-[11px] text-slate-400">Email nhận mã:</div>
                <div className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                  {otpMaskedEmail}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                  Nhập mã 6 số (OTP):
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
                    placeholder="••••••"
                    required
                  />
                </div>
              </div>

              {/* Countdown timer */}
              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Hết hạn: <strong className="text-amber-300 font-mono">{Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={isRequestingOtp || otpCountdown > 240}
                  className="text-xs text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer disabled:opacity-40 disabled:no-underline"
                >
                  {isRequestingOtp ? 'Đang gửi...' : 'Gửi lại mã'}
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
                    <span>Đang kiểm tra OTP...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Xác Nhận & Đăng Nhập</span>
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
                  ← Quay lại nhập mật khẩu
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
              <span>Quay lại ứng dụng học tập</span>
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
            🍉
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Dưa Hấu Admin
              </h1>
              <span className="text-[10px] bg-rose-600/30 text-rose-400 border border-rose-500/50 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                /duahau
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Trung tâm quản lý thành viên & cơ sở dữ liệu</p>
          </div>
        </div>

        {/* 2FA Security Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl text-[11px] text-emerald-300 font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>Bảo mật 2FA AES-256-GCM: {otpMaskedEmail}</span>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Filebase S3 Quick Backup */}
          <button
            onClick={handleTriggerBackup}
            disabled={isBackingUp}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-sky-950 border border-sky-700/60 hover:bg-sky-900 text-sky-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Thực hiện sao lưu thủ công SQLite lên Filebase S3"
          >
            {isBackingUp ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isBackingUp ? 'Đang sao lưu...' : 'Sao Lưu S3'}</span>
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
            <span className="hidden sm:inline">Về App</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Đăng xuất khỏi hệ thống quản trị"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
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
              <span>Tổng Thành Viên</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats?.totalUsers || 0}</div>
            <div className="text-[11px] text-emerald-400 font-medium">Tất cả tài khoản trong SQLite</div>
          </div>

          {/* Card 2: Active Users */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Đang Hoạt Động</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400">{stats?.activeUsers || 0}</div>
            <div className="text-[11px] text-slate-400 font-medium">
              Khóa: <span className="text-rose-400 font-bold">{stats?.disabledUsers || 0}</span> tài khoản
            </div>
          </div>

          {/* Card 3: Total Coins */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Tổng Coins Lưu Thông</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {stats?.totalCoins?.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Số dư xu của mọi thành viên</div>
          </div>

          {/* Card 4: S3 Backup */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Sao Lưu Filebase</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-black text-emerald-400 truncate">
              {stats?.s3Status?.remoteSize
                ? `${(stats.s3Status.remoteSize / 1024 / 1024).toFixed(2)} MB (Synced)`
                : 'Tự động 15 phút'}
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
            <span>Thành Viên</span>
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
            <span>Hỗ Trợ & Góp Ý</span>
            {supportCounts?.new && supportCounts.new > 0 ? (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-400 text-amber-950 font-black font-mono animate-bounce">
                {supportCounts.new} mới
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
              placeholder="Tìm theo username, tên, email..."
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
              Tất cả ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Hoạt động ({users.filter((u) => u.status !== 'disabled').length})
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'disabled'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Bị khóa ({users.filter((u) => u.status === 'disabled').length})
            </button>
            <button
              onClick={() => fetchAdminData()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Làm mới danh sách"
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
                  <th className="py-3 px-4">Người Dùng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Cấp & EXP</th>
                  <th className="py-3 px-4">Số Xu (Coins)</th>
                  <th className="py-3 px-4">Thú Cưng</th>
                  <th className="py-3 px-4">Hoạt Động</th>
                  <th className="py-3 px-4 text-right">Quản Trị Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Không tìm thấy người dùng nào phù hợp.
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
                              {user.avatar || '🦉'}
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
                              Bị Khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <Unlock className="w-3 h-3" />
                              Hoạt Động
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
                                Lv.{user.pet_level || 1} • {user.pet_type}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">Chưa có</span>
                          )}
                        </td>

                        {/* 6. Activity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-xs text-orange-400 font-bold">
                            <Flame className="w-3 h-3" />
                            <span>{user.streak || 0} ngày</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {user.last_active_date || 'Gần đây'}
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
                                title={isDisabled ? 'Kích hoạt lại tài khoản' : 'Khóa tài khoản'}
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
                              title="Chỉnh sửa số Xu (Set Coins)"
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
                              title="Chỉnh sửa Cấp độ & EXP (Set Level)"
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
                              title="Đặt lại mật khẩu cho thành viên"
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
                                title="Xóa tài khoản vĩnh viễn"
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
                    placeholder="Tìm theo user, IP, hành động, user agent..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchLogs('access_logs', 1, logSearch, logFilter)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Tìm
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
                  aria-label="Lọc hành động truy cập"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-emerald-500"
                >
                  <option value="all">Tất cả hành động</option>
                  <option value="login_success">Đăng nhập thành công</option>
                  <option value="login_failed">Đăng nhập thất bại</option>
                  <option value="register_success">Đăng ký thành công</option>
                  <option value="otp_requested">Gửi mã OTP</option>
                  <option value="otp_verified">Xác thực OTP</option>
                  <option value="support_ticket">Gửi góp ý hỗ trợ</option>
                  <option value="admin_action">Thao tác Admin</option>
                  <option value="backup_triggered">Sao lưu S3</option>
                </select>

                <button
                  onClick={() => fetchLogs('access_logs', logPage, logSearch, logFilter)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin text-emerald-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleClearLogs('access')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/50 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Dọn dẹp log access cũ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dọn dẹp</span>
                </button>
              </div>
            </div>

            {/* Access Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Người dùng</th>
                      <th className="py-3 px-4">Hành động</th>
                      <th className="py-3 px-4">Địa chỉ IP</th>
                      <th className="py-3 px-4">Chi tiết</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Thiết bị (User Agent)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {accessLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                          {isLoadingLogs ? 'Đang tải dữ liệu...' : 'Không có bản ghi nhật ký truy cập nào phù hợp.'}
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
                                <span>{log.username || 'Khách'}</span>
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
                  Tổng cộng: <strong className="text-white font-mono">{logTotal}</strong> bản ghi
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
                    placeholder="Tìm theo endpoint, thông báo lỗi, IP..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-rose-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchLogs('error_logs', 1, logSearch, logFilter)}
                  className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Tìm
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
                  aria-label="Lọc mức độ lỗi"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-rose-500"
                >
                  <option value="all">Tất cả mức độ</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                  <option value="warn">Warning</option>
                </select>

                <button
                  onClick={() => fetchLogs('error_logs', logPage, logSearch, logFilter)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin text-rose-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleClearLogs('error')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/50 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Dọn dẹp log error cũ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dọn dẹp</span>
                </button>
              </div>
            </div>

            {/* Error Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Mức độ</th>
                      <th className="py-3 px-4">Endpoint</th>
                      <th className="py-3 px-4">Thông báo lỗi</th>
                      <th className="py-3 px-4">IP / User</th>
                      <th className="py-3 px-4 text-center">Stack Trace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {errorLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                          {isLoadingLogs ? 'Đang tải dữ liệu...' : 'Hệ thống an toàn! Chưa ghi nhận lỗi nào gần đây.'}
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
                                    {isExpanded ? 'Ẩn' : 'Xem'}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Không có</span>
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
                  Tổng cộng: <strong className="text-white font-mono">{logTotal}</strong> bản ghi
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
                    placeholder="Tìm theo email, tiêu đề, mục đích..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-sky-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchLogs('email_logs', 1, logSearch, logFilter)}
                  className="px-3.5 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Tìm
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
                  aria-label="Lọc trạng thái email"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-sky-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="sent">Đã gửi thành công</option>
                  <option value="failed">Gửi thất bại</option>
                </select>

                <button
                  onClick={() => fetchLogs('email_logs', logPage, logSearch, logFilter)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin text-sky-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleClearLogs('email')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/50 border border-rose-800/80 hover:bg-rose-900 text-rose-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Dọn dẹp log email cũ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dọn dẹp</span>
                </button>
              </div>
            </div>

            {/* Email Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Người nhận</th>
                      <th className="py-3 px-4">Mục đích</th>
                      <th className="py-3 px-4">Tiêu đề email</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">IP gửi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {emailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                          {isLoadingLogs ? 'Đang tải dữ liệu...' : 'Chưa ghi nhận lịch sử gửi email nào.'}
                        </td>
                      </tr>
                    ) : (
                      emailLogs.map((log) => {
                        const isSent = log.status === 'sent';

                        let purposeLabel = log.purpose;
                        if (log.purpose === 'register_otp') purposeLabel = 'Mã OTP Đăng Ký';
                        else if (log.purpose === 'login_otp') purposeLabel = 'Mã OTP Đăng Nhập';
                        else if (log.purpose === 'admin_otp') purposeLabel = '2FA Quản Trị';
                        else if (log.purpose === 'support_notification') purposeLabel = 'Thông báo Góp ý';
                        else if (log.purpose === 'support_reply') purposeLabel = 'Phản hồi Góp ý';

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
                                  <span>Đã gửi</span>
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    <X className="w-3 h-3" />
                                    <span>Thất bại</span>
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
                  Tổng cộng: <strong className="text-white font-mono">{logTotal}</strong> bản ghi
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
                    placeholder="Tìm theo tên, email, tiêu đề, nội dung..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchSupport(undefined, supportFilterStatus, supportFilterCategory, supportSearch)}
                  className="px-3.5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Tìm
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
                  aria-label="Lọc thể loại góp ý"
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-amber-500"
                >
                  <option value="all">Tất cả phân loại</option>
                  <option value="feedback">💡 Góp ý tính năng</option>
                  <option value="bug">🐛 Báo lỗi hệ thống</option>
                  <option value="guide">📖 Hướng dẫn sử dụng</option>
                  <option value="other">💬 Khác</option>
                </select>

                <button
                  onClick={() => fetchSupport(undefined, supportFilterStatus, supportFilterCategory, supportSearch)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                  title="Làm mới danh sách"
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
                Tất cả ({supportCounts?.total || 0})
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
                Mới tiếp nhận ({supportCounts?.new || 0})
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
                Đang xử lý ({supportCounts?.processing || 0})
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
                Đã giải quyết ({supportCounts?.resolved || 0})
              </button>
            </div>

            {/* Support Tickets List */}
            {supportMessages.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs sm:text-sm shadow-md">
                {isLoadingSupport ? 'Đang tải dữ liệu...' : 'Chưa có thư góp ý nào trong mục này.'}
              </div>
            ) : (
              <div className="space-y-4">
                {supportMessages.map((ticket) => {
                  let catColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  let catLabel = '💬 Khác';
                  if (ticket.category === 'feedback') {
                    catColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                    catLabel = '💡 Góp ý';
                  } else if (ticket.category === 'bug') {
                    catColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                    catLabel = '🐛 Báo lỗi';
                  } else if (ticket.category === 'guide') {
                    catColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
                    catLabel = '📖 Học tập';
                  } else if (ticket.category === 'account') {
                    catColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                    catLabel = '🔒 Tài khoản';
                  }

                  let prioBadge = null;
                  if (ticket.priority === 'urgent') {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/20 text-rose-300 border-rose-500/40">🔴 Khẩn cấp</span>;
                  } else if (ticket.priority === 'high') {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-orange-500/20 text-orange-300 border-orange-500/40">🟠 Ưu tiên cao</span>;
                  } else if (ticket.priority === 'low') {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">🟢 Thấp</span>;
                  } else {
                    prioBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40">🟡 Trung bình</span>;
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
                              ? '🟡 Mới tiếp nhận'
                              : ticket.status === 'processing'
                              ? '🔵 Đang xử lý'
                              : '🟢 Đã giải quyết'}
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
                          <span>•</span>
                          <a
                            href={`mailto:${ticket.email}`}
                            className="text-sky-400 hover:underline font-mono"
                          >
                            {ticket.email}
                          </a>
                          {ticket.user_id && (
                            <>
                              <span>•</span>
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
                            <span>Quản trị viên đã phản hồi:</span>
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
                          <span className="text-[11px] text-slate-400 font-semibold mr-1">Chuyển:</span>
                          {ticket.status !== 'processing' && (
                            <button
                              onClick={() => handleUpdateSupportStatus(ticket.id, 'processing')}
                              className="px-2 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold hover:bg-sky-900 transition cursor-pointer"
                            >
                              Đang xử lý
                            </button>
                          )}
                          {ticket.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateSupportStatus(ticket.id, 'resolved')}
                              className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold hover:bg-emerald-900 transition cursor-pointer"
                            >
                              Đã giải quyết
                            </button>
                          )}
                          {ticket.status !== 'new' && (
                            <button
                              onClick={() => handleUpdateSupportStatus(ticket.id, 'new')}
                              className="px-2 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold hover:bg-amber-900 transition cursor-pointer"
                            >
                              Đặt về Mới
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
                            <span>{ticket.admin_reply ? 'Phản hồi lại' : 'Gửi Phản Hồi Email'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSupportTicket(ticket.id)}
                            className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                            title="Xóa góp ý này"
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
              <span>Chỉnh Sửa Xu: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Cập nhật trực tiếp số dư Coins cho tài khoản {selectedUser.display_name}.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Số Coins mới:</label>
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
                Hủy
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
                Lưu Thay Đổi
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
              <span>Chỉnh Sửa Cấp Độ: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Thiết lập Level và điểm kinh nghiệm EXP cho {selectedUser.display_name}.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cấp Độ (Level):</label>
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
                <label className="block text-xs font-bold text-slate-300 mb-1">Điểm EXP:</label>
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
                Hủy
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
                Cập Nhật Level
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
              <span>Đổi Mật Khẩu: {selectedUser.username}</span>
            </div>
            <p className="text-xs text-slate-400">
              Nhập mật khẩu mới cho tài khoản {selectedUser.display_name}. Mật khẩu sẽ được mã hóa SHA-256 an toàn.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mật khẩu mới:</label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Nhập ít nhất 4 ký tự..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-2xl px-4 py-2.5 text-sm font-mono text-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Hủy
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
                Xác Nhận Đổi
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
              <span>Xác Nhận Xóa Tài Khoản</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong className="text-white font-bold">{selectedUser.display_name}</strong> (@{selectedUser.username})?
            </p>

            <div className="bg-rose-950/50 border border-rose-800/80 p-3 rounded-2xl text-[11px] text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Cảnh báo hệ thống:</span>
              </div>
              <p>
                Toàn bộ thú cưng, từ vựng bookmark, lịch sử thi và tiến độ học tập sẽ bị xóa vĩnh viễn và không thể khôi phục. Cơ sở dữ liệu sẽ tự động đồng bộ lên Filebase S3 ngay lập tức.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition"
              >
                Hủy bỏ
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
                <span>Xóa vĩnh viễn</span>
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
                <span>Phản Hồi Góp Ý Qua Email</span>
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
                <span>Gửi tới: <strong className="text-white">{selectedTicket.name}</strong> ({selectedTicket.email})</span>
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
                Nội dung thư phản hồi gửi tới học viên:
              </label>
              <textarea
                rows={5}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Nhập nội dung trả lời, hướng dẫn hoặc lời cảm ơn tới thành viên..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition leading-relaxed resize-none"
              />
              <p className="text-[11px] text-slate-400">
                ✉️ Email này sẽ được gửi trực tiếp tới hòm thư <strong className="text-white font-mono">{selectedTicket.email}</strong> từ ban quản trị và tự động đánh dấu góp ý là <span className="text-emerald-400 font-bold">Đã giải quyết</span>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition"
              >
                Hủy bỏ
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
                    <span>Đang gửi email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Thư Cho Học Viên</span>
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

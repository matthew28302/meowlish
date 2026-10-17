'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QUICK_CHAT_PRESETS,
} from '@/lib/petSocialData';
import { sound } from '@/lib/soundFx';
import { formatCoins } from '@/lib/formatNumber';
import confetti from 'canvas-confetti';
import {
  Users,
  MessageCircle,
  Search,
  Send,
  UserPlus,
  Sparkles,
  Check,
  X,
  Clock,
  ShieldCheck,
  UserCheck,
  UserX,
  Swords,
  Home,
  AlertCircle
} from 'lucide-react';
import { makeUniqueId } from './PetPvPArenaCanvas';
import UserAvatar from '../UserAvatar';

export interface PetSocialHubProps {
  currentUserId?: string;
  currentUsername?: string;
  currentDisplayName?: string;
  playerSpecies: string;
  playerPetName: string;
  /** H13: chỉ hiển thị số dư — hub không còn trừ coin (đã bỏ Lễ Đường Kết Đôi). */
  userCoins: number;
  onSendSpeech: (text: string) => void;
  initialFriends?: any[];
  initialIncomingRequests?: any[];
  initialOutgoingFriendIds?: string[];
  initialCommunityUsers?: any[];
  recentChatList?: any[];
  onVisitFriendFarm?: (friend: any) => void;
  onChallengeFriend?: (friend: any) => void;
}

export default function PetSocialHub({
  currentUserId,
  currentUsername = 'player',
  currentDisplayName = 'Bạn',
  playerSpecies = 'owl',
  playerPetName = 'Lexi Trí Tuệ',
  userCoins,
  onSendSpeech,
  initialFriends = [],
  initialIncomingRequests = [],
  initialOutgoingFriendIds = [],
  initialCommunityUsers = [],
  recentChatList = [],
  onVisitFriendFarm,
  onChallengeFriend,
}: PetSocialHubProps) {
  // Tabs: 'friends' | 'requests' | 'find' | 'chat'
  // H13 (2026-10-12): bỏ tab 'couple' — loại bỏ "Lễ Đường Kết Đôi" theo yêu
  // cầu (thiết kế chưa phù hợp). API propose/respond/break_up giữ nguyên ở
  // server để không phá dữ liệu cũ.
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find' | 'chat'>('friends');

  // Friends & Requests state
  const [friendsList, setFriendsList] = useState<any[]>(initialFriends);
  const [incomingRequests, setIncomingRequests] = useState<any[]>(initialIncomingRequests);
  const [outgoingFriendIds, setOutgoingFriendIds] = useState<string[]>(initialOutgoingFriendIds);
  const [communityUsers, setCommunityUsers] = useState<any[]>(initialCommunityUsers);
  const [searchQuery, setSearchQuery] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>(recentChatList);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Toast/status state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Update on prop changes
  useEffect(() => {
    if (initialFriends) setFriendsList(initialFriends);
    if (initialIncomingRequests) setIncomingRequests(initialIncomingRequests);
    if (initialOutgoingFriendIds) setOutgoingFriendIds(initialOutgoingFriendIds);
    if (initialCommunityUsers) setCommunityUsers(initialCommunityUsers);
    if (recentChatList) setChatMessages(recentChatList);
  }, [initialFriends, initialIncomingRequests, initialOutgoingFriendIds, initialCommunityUsers, recentChatList]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  // (H13) Các helper coin (applyCoinDelta/syncCoinsFromServer) chỉ dùng cho
  // tính năng Lễ Đường Kết Đôi — đã xoá cùng tính năng đó.

  // Show status notification
  // (đo 2026-10-09: trước đây setTimeout không lưu ref nên toast thứ 2 bị timer
  // của toast thứ 1 xoá sớm, và setState chạy sau khi component unmount.)
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setStatusMessage(msg);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setStatusMessage(null), 4000);
  };

  // Dọn timer khi rời tab / đổi gameTab để không setState trên component đã unmount
  useEffect(() => {
    return () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  // ================= 1. CHAT LOGIC =================
  const handleSendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    sound.playClick();
    onSendSpeech(cleanText);

    const tempMsg = {
      id: makeUniqueId('chat'),
      user_id: currentUserId,
      username: currentUsername,
      display_name: currentDisplayName,
      pet_type: playerSpecies,
      message: cleanText,
      created_at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, tempMsg]);
    setChatInput('');

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'send_chat',
          message: cleanText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recentChat) setChatMessages(data.recentChat);
      }
    } catch {}
  };

  // ================= 2. FRIENDSHIP LOGIC =================
  // Send Friend Request (Chờ đồng ý)
  const handleSendFriendRequest = async (targetUserId: string) => {
    sound.playClick();
    setOutgoingFriendIds((prev) => [...prev, targetUserId]);

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'send_friend_request',
          targetUserId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        sound.playSuccess();
        showToast(data.message || 'Đã gửi lời mời kết bạn!');
      } else {
        showToast(data.error || 'Không thể gửi lời mời!');
      }
    } catch {
      showToast('Lỗi kết nối khi gửi lời mời kết bạn!');
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async (req: any) => {
    sound.playCelebration();
    confetti({ particleCount: 30, spread: 50 });

    // Optimistic Update
    setIncomingRequests((prev) => prev.filter((r) => r.request_id !== req.request_id && r.id !== req.id));
    setFriendsList((prev) => [
      ...prev,
      {
        id: req.id,
        username: req.username,
        display_name: req.display_name,
        avatar: req.avatar,
        pet_type: req.pet_type,
        pet_name: req.pet_name,
        pet_level: req.pet_level,
      },
    ]);

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'accept_friend_request',
          requestId: req.request_id,
          requesterId: req.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Đã kết bạn thành công! 🎉');
      }
    } catch {}
  };

  // Decline Friend Request
  const handleDeclineRequest = async (req: any) => {
    sound.playClick();
    setIncomingRequests((prev) => prev.filter((r) => r.request_id !== req.request_id && r.id !== req.id));

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'decline_friend_request',
          requestId: req.request_id,
          requesterId: req.id,
        }),
      });
      showToast('Đã từ chối lời mời kết bạn.');
    } catch {}
  };

  // Remove Friend
  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy kết bạn với người này không?')) return;
    sound.playClick();
    setFriendsList((prev) => prev.filter((f) => f.id !== friendId));

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'remove_friend',
          friendId,
        }),
      });
      showToast('Đã hủy kết bạn.');
    } catch {}
  };

  // ================= 3. (ĐÃ BỎ) COUPLE & PROPOSAL LOGIC =================
  // H13 (2026-10-12): tính năng "Lễ Đường Kết Đôi" bị loại bỏ theo yêu cầu
  // user — handler propose/respond/break_up và toàn bộ UI liên quan đã xoá.
  // Server API (action propose_couple / respond_proposal / break_up) vẫn giữ
  // để không ảnh hưởng dữ liệu người dùng cũ.

  // Filter community users
  const filteredCommunity = communityUsers.filter((u) => {
    const isAlreadyFriend = friendsList.some((f) => f.id === u.id);
    if (isAlreadyFriend) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full flex flex-col gap-3 max-w-5xl mx-auto select-none">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border-2 border-amber-400 text-amber-200 text-xs font-black rounded-2xl shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* GAME PLAZA HUD TOP HEADER */}
      <div className="w-full bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border-2 border-amber-500/50 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex items-center justify-between gap-2 flex-wrap">
        {/* Navigation Tabs Styled like Game HUD */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('friends');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-black/40 hover:bg-black/60 text-slate-200 border border-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bạn Bè ({friendsList.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('requests');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'requests'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-black/40 hover:bg-black/60 text-slate-200 border border-white/10'
            }`}
          >
            <span>✉️</span>
            <span>Lời Mời</span>
            {incomingRequests.length > 0 && (
              <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('find');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'find'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-black/40 hover:bg-black/60 text-slate-200 border border-white/10'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tìm Bạn Học Thật</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('chat');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-black/40 hover:bg-black/60 text-slate-200 border border-white/10'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Kênh Chat Thế Giới</span>
          </button>
        </div>

        {/* User Coin Balance */}
        <div className="flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded-xl border border-amber-400/40 text-xs font-black text-amber-300 ml-auto">
          <span>🪙 {formatCoins(userCoins)} Coins</span>
        </div>
      </div>

      {/* ================= TAB 1: DANH SÁCH BẠN BÈ THẬT ================= */}
      {activeTab === 'friends' && (
        <div className="w-full bg-slate-900/90 border-2 border-amber-900/60 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span>👥 Danh Sách Bằng Hữu Chính Thức</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded-full font-bold">
                  {friendsList.length} người bạn
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Những người bạn đã đồng ý kết bạn cùng bạn. Có thể ghé thăm nông trại hoặc thách đấu trí tuệ!
              </p>
            </div>

            <button
              onClick={() => setActiveTab('find')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1 shadow-md"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm Bạn Mới</span>
            </button>
          </div>

          {friendsList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
              <span className="text-5xl">🌾</span>
              <p className="text-sm font-bold text-slate-300">Bạn chưa có bằng hữu nào trong danh sách!</p>
              <p className="text-xs max-w-sm text-slate-400">
                Hãy chuyển sang tab "Tìm Bạn Học Thật" để gửi lời mời kết bạn tới những học viên khác trong cộng đồng nhé.
              </p>
              <button
                onClick={() => setActiveTab('find')}
                className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Khám Phá Học Viên Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {friendsList.map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-slate-800/80 border border-slate-700/80 hover:border-amber-400/60 rounded-2xl flex flex-col justify-between gap-3 shadow-md transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 p-0.5 shrink-0 flex items-center justify-center text-2xl shadow-inner">
                      {/* Avatar pixel; emoji lẻ ngoài bộ pixel (👨‍💻 🎀 ⚡ trong
                          petSocialData) vẫn hiển thị emoji như cũ */}
                      <UserAvatar avatar={f.avatar} size={44} alt={`Avatar của ${f.display_name}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-amber-200 truncate">{f.display_name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">@{f.username}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded-md font-bold border border-emerald-500/30">
                          {f.pet_name} (Lv.{f.pet_level || 1})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/50">
                    {onVisitFriendFarm && (
                      <button
                        onClick={() => onVisitFriendFarm(f)}
                        className="flex-1 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                        title="Ghé thăm nông trại của bạn"
                      >
                        <Home className="w-3.5 h-3.5" />
                        <span>Thăm Vườn</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        sound.playClick();
                        setChatInput(`@${f.username} `);
                        setActiveTab('chat');
                      }}
                      className="px-2.5 py-1.5 bg-sky-600/80 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                      title="Gửi tin nhắn"
                    >
                      💬
                    </button>

                    <button
                      onClick={() => handleRemoveFriend(f.id)}
                      className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-[11px] font-bold rounded-lg transition cursor-pointer"
                      title="Hủy kết bạn"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: LỜI MỜI KẾT BẠN (CẦN ĐỒNG Ý) ================= */}
      {activeTab === 'requests' && (
        <div className="w-full bg-slate-900/90 border-2 border-amber-900/60 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
          <div className="pb-2 border-b border-white/10">
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>✉️ Lời Mời Kết Bạn Đang Chờ Phê Duyệt</span>
              <span className="text-[10px] px-2 py-0.5 bg-rose-500/30 text-rose-300 rounded-full font-bold">
                {incomingRequests.length} lời mời
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Bạn có toàn quyền lựa chọn Đồng Ý hoặc Từ Chối. Chỉ khi bạn đồng ý thì hai bên mới trở thành bạn bè!
            </p>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
              <span className="text-4xl">📭</span>
              <p className="text-xs font-bold text-slate-300">Không có lời mời kết bạn nào đang chờ!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.request_id || req.id}
                  className="p-3 bg-slate-800 border-2 border-indigo-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-lg"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                      <UserAvatar avatar={req.avatar} size={40} alt={`Avatar của ${req.display_name}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-amber-300 truncate">{req.display_name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">@{req.username}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">
                        Bé: {req.pet_name} (Lv.{req.pet_level || 1})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Đồng Ý</span>
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req)}
                      className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: KHÁM PHÁ HỌC VIÊN THẬT (TỪ DATABASE) ================= */}
      {activeTab === 'find' && (
        <div className="w-full bg-slate-900/90 border-2 border-amber-900/60 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                🔍 Tìm Kiếm & Kết Bạn Cùng Học Viên Thật
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                100% người dùng thật từ cơ sở dữ liệu hệ thống Meowlish. Gửi lời mời và cùng nhau học tập!
              </p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên học viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 text-xs text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCommunity.map((u) => {
              const isPending = outgoingFriendIds.includes(u.id);

              return (
                <div
                  key={u.id}
                  className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                      <UserAvatar avatar={u.avatar} size={40} alt={`Avatar của ${u.display_name}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate">{u.display_name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">@{u.username}</p>
                      <p className="text-[10px] text-amber-300 font-bold">
                        {u.pet_name} (Lv.{u.pet_level || 1})
                      </p>
                    </div>
                  </div>

                  {isPending ? (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black rounded-lg shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Đang Chờ</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendFriendRequest(u.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-md active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kết Bạn</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 4: KÊNH CHAT THẾ GIỚI (PHÂN TÁCH TRÁI / PHẢI CHUẨN) ================= */}
      {activeTab === 'chat' && (
        <div className="w-full bg-slate-900/90 border-2 border-amber-900/60 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col gap-3 h-[520px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
            <div>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💬 Kênh Chat Cộng Đồng Meowlish</span>
                <span className="text-[10px] px-2 py-0.5 bg-sky-500/30 text-sky-300 rounded-full font-bold">
                  Trực Tuyến
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Tin nhắn của bạn hiển thị bên <b>Phải</b>, tin nhắn của người khác hiển thị bên <b>Trái</b> rõ ràng.
              </p>
            </div>
          </div>

          {/* Chat Message Scroll Log */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-3 bg-black/30 rounded-2xl border border-white/5"
          >
            {chatMessages.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!</div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isSelf =
                  (msg.user_id && currentUserId && msg.user_id === currentUserId) ||
                  (msg.username && currentUsername && msg.username === currentUsername) ||
                  msg.display_name === currentDisplayName;

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex items-end gap-2 ${isSelf ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Left Avatar for Others */}
                    {!isSelf && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-base flex items-center justify-center shrink-0 shadow-md">
                        {msg.pet_type === 'cat' ? '🐱' : msg.pet_type === 'corgi' ? '🐶' : msg.pet_type === 'ice_dragon' ? '🐉' : msg.pet_type === 'cinnamoroll' ? '🐰' : '🦉'}
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div className={`max-w-[78%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                      {/* Name & Time Header */}
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className={`text-[10px] font-black ${isSelf ? 'text-amber-300' : 'text-slate-300'}`}>
                          {isSelf ? 'Bạn' : msg.display_name}
                        </span>
                        <span className="text-[9px] text-slate-500">{msg.created_at || 'Vừa xong'}</span>
                      </div>

                      {/* Chat Bubble Body */}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-md break-words ${
                          isSelf
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-br-xs border border-emerald-400/40'
                            : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>

                    {/* Right Avatar for Self */}
                    {isSelf && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-base flex items-center justify-center shrink-0 shadow-md border border-amber-400">
                        {playerSpecies === 'cat' ? '🐱' : playerSpecies === 'corgi' ? '🐶' : playerSpecies === 'ice_dragon' ? '🐉' : playerSpecies === 'cinnamoroll' ? '🐰' : '🦉'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Chat Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto touch-auto custom-scrollbar py-1 shrink-0">
            {QUICK_CHAT_PRESETS.slice(0, 5).map((q) => (
              <button
                key={q.id}
                onClick={() => handleSendMessage(q.text)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 rounded-lg shrink-0 transition cursor-pointer"
              >
                {q.emoji} {q.text.slice(0, 24)}...
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Nhập nội dung trò chuyện cùng học viên..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(chatInput);
              }}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-xs text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-hidden focus:border-amber-400"
            />
            <button
              onClick={() => handleSendMessage(chatInput)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= (ĐÃ BỎ) TAB 5: LỄ ĐƯỜNG KẾT ĐÔI ================= */}
    </div>
  );
}

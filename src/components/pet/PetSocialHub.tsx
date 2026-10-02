'use client';

import React, { useState } from 'react';
import {
  QUICK_CHAT_PRESETS,
  WEDDING_RINGS,
  MOCK_COMMUNITY_USERS,
  SocialFriend,
  WeddingRing,
} from '@/lib/petSocialData';
import PixelPetSprite from './PixelPetSprite';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Users, MessageCircle, Heart, Search, Send, UserPlus, Sparkles, Check } from 'lucide-react';

export interface PetSocialHubProps {
  currentUserId?: string;
  currentUsername?: string;
  currentDisplayName?: string;
  playerSpecies: string;
  playerPetName: string;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onSendSpeech: (text: string) => void;
  friendIds?: string[];
  coupleData?: any;
  recentChatList?: any[];
  onVisitFriendFarm?: (friend: SocialFriend) => void;
}

export default function PetSocialHub({
  currentUserId,
  currentUsername = 'player',
  currentDisplayName = 'Bạn',
  playerSpecies = 'owl',
  playerPetName = 'Lexi Trí Tuệ',
  userCoins,
  onUpdateCoins,
  onSendSpeech,
  friendIds = [],
  coupleData,
  recentChatList = [],
  onVisitFriendFarm,
}: PetSocialHubProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'chat' | 'couple'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [myFriends, setMyFriends] = useState<string[]>(friendIds);
  const [chatMessages, setChatMessages] = useState<any[]>(() => {
    if (recentChatList && recentChatList.length > 0) return recentChatList;
    return [
      { id: '1', display_name: 'Mai Bé Bỏng', pet_type: 'cinnamoroll', message: 'Chào mọi người! Chúc mọi người học tiếng Anh thật tốt nha! 🌸', created_at: 'Vừa xong' },
      { id: '2', display_name: 'Hoàng Nam IT', pet_type: 'cat', message: 'Ai muốn vào Đấu Trường thử chiêu với Meowlish của mình không? ⚔️', created_at: '1 phút trước' },
      { id: '3', display_name: 'Linh Đan', pet_type: 'owl', message: 'Nông trại của mình dâu tây vừa chín mọng nè, ghé tưới cây nhé! 🍓', created_at: '3 phút trước' },
    ];
  });

  const [activeCouple, setActiveCouple] = useState<any>(coupleData);
  const [selectedRing, setSelectedRing] = useState<WeddingRing>(WEDDING_RINGS[0]);
  const [proposeTarget, setProposeTarget] = useState<SocialFriend | null>(null);

  // Send Chat message
  const handleSendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    sound.playClick();
    onSendSpeech(cleanText); // Broadcast to pet speech bubble

    const newMsg = {
      id: `chat-${Date.now()}`,
      display_name: currentDisplayName,
      pet_type: playerSpecies,
      message: cleanText,
      created_at: 'Vừa xong',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'send_chat',
          message: cleanText,
        }),
      });
    } catch {}
  };

  // Add friend
  const handleAddFriend = async (friend: SocialFriend) => {
    sound.playSuccess();
    setMyFriends((prev) => [...prev, friend.id]);

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'add_friend',
          friendId: friend.id,
        }),
      });
    } catch {}
  };

  // Propose marriage
  const handlePropose = async () => {
    if (!proposeTarget) return;

    if (userCoins < selectedRing.price) {
      sound.playWrong();
      alert(`Bạn đang có ${userCoins} xu, không đủ ${selectedRing.price} xu để mua ${selectedRing.name}!`);
      return;
    }

    sound.playCelebration();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });

    onUpdateCoins(userCoins - selectedRing.price);
    const newCouple = {
      partner_name: proposeTarget.displayName,
      partner_avatar: proposeTarget.avatar,
      ring_type: selectedRing.id,
      love_points: 100,
      married_at: 'Hôm nay',
    };
    setActiveCouple(newCouple);
    setProposeTarget(null);

    onSendSpeech(`Đã nên duyên cùng ${proposeTarget.displayName}! Nhẫn đôi sáng ngời! 💍💖`);

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          action: 'propose_couple',
          partnerId: proposeTarget.id,
          ringId: selectedRing.id,
        }),
      });
    } catch {}
  };

  const filteredCommunity = MOCK_COMMUNITY_USERS.filter((u) => {
    if (!searchQuery) return true;
    return (
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Header Tabs */}
      <div className="bg-gradient-to-r from-pink-900/90 via-purple-950/90 to-slate-900/90 p-3 sm:p-4 rounded-3xl border-3 border-pink-500/50 shadow-xl flex items-center justify-between gap-2 flex-wrap text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-2xl shadow-inner">
            👥
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-pink-300 flex items-center gap-1.5">
              <span>Phố Giao Lưu & Xã Hội (Social Avatar)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-700 text-white font-bold">
                Cộng Đồng
              </span>
            </h3>
            <p className="text-[11px] text-pink-100/70 font-medium">
              Kết bạn học hỏi, trò chuyện bong bóng thoại và gắn kết duyên đôi nhẫn cưới!
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-pink-500/30">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'friends'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bạn Bè</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'chat'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Trò Chuyện</span>
          </button>

          <button
            onClick={() => setActiveTab('couple')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'couple'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-300" />
            <span>Kết Đôi 💍</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: FRIENDS LIST ================= */}
      {activeTab === 'friends' && (
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-4 space-y-3 shadow-xl">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bạn học theo tên hoặc username..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium border border-slate-700 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Friends List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredCommunity.map((friend) => {
              const isAdded = myFriends.includes(friend.id) || friend.isFriend;

              return (
                <div
                  key={friend.id}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 group hover:border-pink-400/50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-xl shrink-0">
                      {friend.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-xs text-white truncate flex items-center gap-1">
                        <span>{friend.displayName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-900 text-emerald-300 font-bold shrink-0">
                          Lv.{friend.level}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        Thú cưng: <span className="text-pink-300 font-bold">{friend.petName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] text-amber-300/80 mt-0.5 font-bold">
                        <span>🔥 Streak {friend.streak} ngày</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isAdded ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Bạn Bè
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(friend)}
                        className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-black transition cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <UserPlus className="w-3 h-3" /> Kết Bạn
                      </button>
                    )}

                    <button
                      onClick={() => onVisitFriendFarm?.(friend)}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold transition cursor-pointer"
                    >
                      🏡 Thăm Vườn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: LIVE CHAT & SPEECH BUBBLES ================= */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-4 space-y-3 shadow-xl">
          {/* Quick Chat Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-xs font-black text-pink-300 shrink-0">Thoại Nhanh:</span>
            {QUICK_CHAT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSendMessage(preset.text)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-pink-950/60 text-slate-200 hover:text-pink-200 text-[11px] font-bold border border-slate-700 shrink-0 transition cursor-pointer active:scale-95"
              >
                <span>{preset.emoji}</span>
                <span className="ml-1">{preset.text.slice(0, 22)}...</span>
              </button>
            ))}
          </div>

          {/* Chat Message Scroll */}
          <div className="h-56 overflow-y-auto custom-scrollbar space-y-2 p-2 rounded-2xl bg-black/40 border border-slate-800">
            {chatMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  🐾
                </div>
                <div className="bg-slate-800/80 p-2 rounded-2xl border border-slate-700/60 max-w-[85%]">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-black text-pink-300">{msg.display_name}</span>
                    <span className="text-slate-500">{msg.created_at}</span>
                  </div>
                  <p className="text-slate-200 font-medium mt-0.5 leading-relaxed">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
              placeholder="Nhập tin nhắn... Lời thoại sẽ hiện thành bong bóng trên đầu Thú Cưng!"
              className="flex-1 px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium border border-slate-700 focus:outline-none focus:border-pink-500"
            />
            <button
              onClick={() => handleSendMessage(chatInput)}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 3: COUPLE & MARRIAGE ================= */}
      {activeTab === 'couple' && (
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl text-white">
          {activeCouple ? (
            /* Current Couple Profile */
            <div className="bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-pink-950/80 p-5 rounded-3xl border-3 border-pink-500/60 shadow-lg flex flex-col items-center text-center space-y-3">
              <div className="text-5xl animate-bounce">💍💖</div>
              <h4 className="text-lg font-black text-pink-300">
                {activeCouple.partner_name
                  ? `Cặp Đôi Tình Nhân: ${currentDisplayName} & ${activeCouple.partner_name}`
                  : 'Uyên Ương Tri Kỷ'}
              </h4>
              <p className="text-xs text-pink-200/80 max-w-sm">
                Hai bạn đã trao nhau chiếc nhẫn định tình! Khi ở gần nhau trong khu vườn, những trái tim đôi lãng mạn sẽ bay bổng trên đầu thú cưng!
              </p>

              <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-pink-500/40 text-xs font-black">
                <span className="text-amber-300">Điểm Tình Cảm: ❤️ {activeCouple.love_points || 100}</span>
                <span className="text-purple-300">Ngày Kết Đôi: {activeCouple.married_at || 'Mới đây'}</span>
              </div>
            </div>
          ) : (
            /* Propose Marriage Flow */
            <div className="space-y-4">
              <div>
                <h4 className="font-black text-sm text-pink-300">Lễ Đường Kết Đôi & Trao Nhẫn</h4>
                <p className="text-xs text-slate-400">Chọn một chiếc nhẫn đôi đính hôn và gửi lời cầu hôn tới người bạn thân thiết!</p>
              </div>

              {/* Rings Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {WEDDING_RINGS.map((ring) => (
                  <button
                    key={ring.id}
                    onClick={() => setSelectedRing(ring)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedRing.id === ring.id
                        ? 'border-pink-500 bg-pink-950/50 shadow-md ring-2 ring-pink-400'
                        : 'border-slate-700 bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-3xl">{ring.emoji}</span>
                      <span className="text-xs font-black text-amber-300">🪙 {ring.price} xu</span>
                    </div>
                    <div className="font-black text-xs text-white">{ring.name}</div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{ring.description}</p>
                    <span className="text-[9.5px] font-black text-pink-400 mt-2">{ring.title}</span>
                  </button>
                ))}
              </div>

              {/* Select Friend Target */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Chọn Bạn Học Muốn Cầu Hôn:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {filteredCommunity.slice(0, 4).map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => setProposeTarget(friend)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 ${
                        proposeTarget?.id === friend.id
                          ? 'border-pink-400 bg-pink-900/40 text-white font-black'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-lg">{friend.avatar}</span>
                      <span className="text-xs truncate">{friend.displayName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Propose */}
              <button
                onClick={handlePropose}
                disabled={!proposeTarget}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                  proposeTarget
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <span>💍 Trao Nhẫn & Cầu Hôn {proposeTarget ? `(${selectedRing.price} xu)` : ''}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

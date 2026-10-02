export interface QuickChatOption {
  id: string;
  text: string;
  emoji: string;
}

export const QUICK_CHAT_PRESETS: QuickChatOption[] = [
  { id: '1', text: 'Chào cả nhà! Chúc mọi người ngày mới tràn đầy năng lượng! 🌸', emoji: '🌸' },
  { id: '2', text: 'Bé cưng của mình vừa lên cấp mới rồi nè! ✨🐾', emoji: '✨' },
  { id: '3', text: 'Ai muốn so tài Đua Pet tốc độ với mình không nào? 🏁🚀', emoji: '🏁' },
  { id: '4', text: 'Ghé thăm nông trại của mình phụ tưới nước giùm nhé! 🥕🌾', emoji: '🌾' },
  { id: '5', text: 'Vừa hoàn thành bài thi tiếng Anh 100 điểm xuất sắc! 💯🎓', emoji: '💯' },
  { id: '6', text: 'Hôm nay nắng đẹp rực rỡ, chim hót líu lo khắp sân vườn! ☀️🌿', emoji: '☀️' },
  { id: '7', text: 'Cùng luyện phản xạ nói tiếng Anh mỗi ngày nào các bạn ơi! 🎙️📖', emoji: '🎙️' },
  { id: '8', text: 'Bé cưng của bạn dễ thương quá đi mất! 💖🥰', emoji: '💖' },
];

export interface WeddingRing {
  id: string;
  name: string;
  price: number;
  emoji: string;
  title: string;
  description: string;
  auraColor: string;
}

export const WEDDING_RINGS: WeddingRing[] = [
  {
    id: 'ring_silver',
    name: 'Nhẫn Bạc Tri Kỷ',
    price: 300,
    emoji: '💍',
    title: '❤️ Cặp Đôi Tri Kỷ',
    description: 'Chiếc nhẫn bạc sáng trong thể hiện tình bạn và sự gắn kết học tập bền chặt.',
    auraColor: 'from-slate-200 to-indigo-200 border-indigo-300',
  },
  {
    id: 'ring_gold',
    name: 'Nhẫn Vàng Hoàng Kim',
    price: 600,
    emoji: '👑',
    title: '🌹 Cặp Đôi Ngọt Ngào',
    description: 'Nhẫn vàng óng ả minh chứng cho tình yêu và tinh thần đồng đội son sắt.',
    auraColor: 'from-amber-200 to-yellow-300 border-amber-400',
  },
  {
    id: 'ring_diamond',
    name: 'Nhẫn Kim Cương Vĩnh Cửu',
    price: 1200,
    emoji: '💎',
    title: '✨ Uyên Ương Hoàng Gia',
    description: 'Viên kim cương ngũ sắc rực rỡ vĩnh cửu, mở khoá danh hiệu tình nhân danh giá nhất!',
    auraColor: 'from-pink-200 via-purple-200 to-sky-200 border-purple-400',
  },
];

export interface SocialFriend {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  petType: string;
  petName: string;
  level: number;
  streak: number;
  status: 'online' | 'studying' | 'farming';
  lastSeen: string;
  isFriend: boolean;
  isCouple?: boolean;
}

export const MOCK_COMMUNITY_USERS: SocialFriend[] = [
  {
    id: 'friend_mai_xuan',
    username: 'xuanmai_uit',
    displayName: 'Mai Bé Bỏng',
    avatar: '🌸',
    petType: 'cinnamoroll',
    petName: 'Mây Trắng Nhỏ',
    level: 18,
    streak: 42,
    status: 'online',
    lastSeen: 'Vừa mới đây',
    isFriend: true,
  },
  {
    id: 'friend_hoang_nam',
    username: 'nam_ielts8',
    displayName: 'Hoàng Nam IT',
    avatar: '👨‍💻',
    petType: 'cat',
    petName: 'Meowlish Pro',
    level: 15,
    streak: 28,
    status: 'studying',
    lastSeen: '5 phút trước',
    isFriend: true,
  },
  {
    id: 'friend_linh_dan',
    username: 'linhdan_toeic',
    displayName: 'Linh Đan Sunny',
    avatar: '🎀',
    petType: 'owl',
    petName: 'Cú Trí Tuệ',
    level: 12,
    streak: 19,
    status: 'farming',
    lastSeen: '12 phút trước',
    isFriend: false,
  },
  {
    id: 'friend_minh_khoi',
    username: 'khoi_dev',
    displayName: 'Minh Khởi Fullstack',
    avatar: '⚡',
    petType: 'dog',
    petName: 'Corgi Dũng Mãnh',
    level: 20,
    streak: 65,
    status: 'online',
    lastSeen: 'Đang online',
    isFriend: false,
  },
  {
    id: 'friend_anh_thu',
    username: 'thu_oxford',
    displayName: 'Anh Thư Oxford',
    avatar: '⭐',
    petType: 'bunny',
    petName: 'Lola Tinh Nghịch',
    level: 14,
    streak: 33,
    status: 'online',
    lastSeen: 'Đang online',
    isFriend: false,
  },
];

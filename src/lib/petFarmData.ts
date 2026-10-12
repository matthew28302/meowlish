export interface CropInfo {
  id: string;
  name: string;
  emoji: string;
  seedPrice: number;
  growthTimeSeconds: number; // in-game fast cycle (30s - 120s)
  harvestCoins: number;
  harvestExp: number;
  description: string;
  badgeColor: string;
}

export const CROPS_CATALOG: Record<string, CropInfo> = {
  carrot: {
    id: 'carrot',
    name: 'Cà Rốt Giòn Ngọt',
    emoji: '🥕',
    seedPrice: 20,
    growthTimeSeconds: 25,
    harvestCoins: 50,
    harvestExp: 15,
    description: 'Củ cà rốt đỏ cam tươi tốt, củ to mọng giúp bổ mắt và luyện nghe tiếng Anh tinh tường!',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  tomato: {
    id: 'tomato',
    name: 'Cà Chua Chín Mọng',
    emoji: '🍅',
    seedPrice: 35,
    growthTimeSeconds: 45,
    harvestCoins: 85,
    harvestExp: 25,
    description: 'Chùm cà chua đỏ mọng nước giàu vitamin, món khoái khẩu của nông trại Avatar!',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Dâu Tây Đà Lạt',
    emoji: '🍓',
    seedPrice: 50,
    growthTimeSeconds: 60,
    harvestCoins: 125,
    harvestExp: 35,
    description: 'Dâu tây thơm ngào ngạt, vị ngọt thanh mát, năng suất cao và giá trị kinh tế tuyệt vời.',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300',
  },
  watermelon: {
    id: 'watermelon',
    name: 'Dưa Hấu Sọc Khổng Lồ',
    emoji: '🍉',
    seedPrice: 70,
    growthTimeSeconds: 90,
    harvestCoins: 180,
    harvestExp: 50,
    description: 'Trái dưa hấu khổng lồ ruột đỏ ngọt lịm giải nhiệt ngày hè, thu về bội tiền vàng!',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  corn: {
    id: 'corn',
    name: 'Bắp Ngô Vàng Óng',
    emoji: '🌽',
    seedPrice: 40,
    growthTimeSeconds: 50,
    harvestCoins: 100,
    harvestExp: 30,
    description: 'Bắp ngô vàng óng ả hạt đều tăm tắp, hương thơm béo ngậy khó cưỡng.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Hoa Hướng Dương Rực Rỡ',
    emoji: '🌻',
    seedPrice: 90,
    growthTimeSeconds: 120,
    harvestCoins: 240,
    harvestExp: 70,
    description: 'Bông hoa hướng dương đón ánh mặt trời rực rỡ, biểu tượng của sự kiên trì vươn lên!',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  },
};

export interface LivestockInfo {
  type: string;
  name: string;
  emoji: string;
  feedPrice: number;
  feedEmoji: string;
  produceName: string;
  produceEmoji: string;
  cycleSeconds: number;
  rewardCoins: number;
  rewardExp: number;
  description: string;
}

export const LIVESTOCK_CATALOG: Record<string, LivestockInfo> = {
  chicken: {
    type: 'chicken',
    name: 'Đàn Gà Mái Cục Tác',
    emoji: '🐔',
    feedPrice: 20,
    feedEmoji: '🌾',
    produceName: 'Trứng Vàng Thần Kỳ',
    produceEmoji: '🥚',
    cycleSeconds: 30,
    rewardCoins: 55,
    rewardExp: 20,
    description: 'Gà mẹ ấp trứng vàng, chăm chỉ cục tác đẻ trứng mỗi ngày!',
  },
  cow: {
    type: 'cow',
    name: 'Bò Sữa Hà Lan Đốm Đen',
    emoji: '🐮',
    feedPrice: 35,
    feedEmoji: '🌿',
    produceName: 'Xô Sữa Tươi Thanh Trùng',
    produceEmoji: '🥛',
    cycleSeconds: 50,
    rewardCoins: 100,
    rewardExp: 35,
    description: 'Bò sữa hiền lành gặm cỏ non xanh mướt cho dòng sữa ngọt béo bổ dưỡng!',
  },
  sheep: {
    type: 'sheep',
    name: 'Đàn Cừu Bông Mây Trắng',
    emoji: '🐑',
    feedPrice: 25,
    feedEmoji: '🌿',
    produceName: 'Cuộn Len Mềm Mại',
    produceEmoji: '🧶',
    cycleSeconds: 40,
    rewardCoins: 80,
    rewardExp: 30,
    description: 'Cừu bông trắng muốt gặm cỏ đồng cỏ xanh, cho những cuộn len ấm áp mỗi ngày!',
  },
};

export interface FarmPlotState {
  plotIndex: number;
  cropType: string | null;
  stage: 'empty' | 'seeded' | 'growing' | 'ripe' | 'withered';
  plantedAt: number | null; // timestamp ms
  wateredAt: number | null;
  harvestReadyAt: number | null;
}

export interface LivestockState {
  animalType: string;
  isFed: boolean;
  fedAt: number | null;
  readyAt: number | null;
  producedCount: number;
}

// ============================================================
// CỬA HÀNG NÔNG TRẠI (H18 — 2026-10-12): mua/bán vật nuôi, ấp trứng.
// ============================================================

/** Chu kỳ sản xuất MẶC ĐỊNH của server (giây) — client chỉ dùng để fallback. */
export const FARM_CYCLE_FALLBACK_SECONDS: Record<string, number> = {
  chicken: 3 * 60 * 60, // 3 giờ
  cow: 24 * 60 * 60, // 24 giờ
  sheep: 12 * 60 * 60, // 12 giờ
};

export interface FarmAnimalShopEntry {
  kind: string;
  name: string;
  emoji: string;
  buyPrice: number;
  sellPrice: number;
  maxOwned: number;
  defaultCount: number;
  /** false = chỉ nuôi cho đẹp (chó/mèo/cá), không có chu kỳ sản xuất. */
  isProducer: boolean;
  description: string;
}

export const FARM_ANIMAL_SHOP: Record<string, FarmAnimalShopEntry> = {
  hen: {
    kind: 'hen',
    name: 'Gà Mái Đẻ Trứng',
    emoji: '🐔',
    buyPrice: 150,
    sellPrice: 80,
    maxOwned: 6,
    defaultCount: 3,
    isProducer: true,
    description: 'Chỉ gà MÁI mới đẻ trứng! Cho ăn thóc, thu trứng vàng mỗi 3 giờ.',
  },
  cow: {
    kind: 'cow',
    name: 'Bò Sữa',
    emoji: '🐮',
    buyPrice: 400,
    sellPrice: 220,
    maxOwned: 4,
    defaultCount: 2,
    isProducer: true,
    description: 'Cho ăn cỏ, vắt sữa tươi mỗi 24 giờ. Càng nhiều bò càng vui!',
  },
  sheep: {
    kind: 'sheep',
    name: 'Cừu Bông',
    emoji: '🐑',
    buyPrice: 300,
    sellPrice: 160,
    maxOwned: 4,
    defaultCount: 1,
    isProducer: true,
    description: 'Cho ăn cỏ, xén len mềm mỗi 12 giờ trên đồng cỏ xanh.',
  },
  fish: {
    kind: 'fish',
    name: 'Cá Chép Hồ Sen',
    emoji: '🐟',
    buyPrice: 60,
    sellPrice: 30,
    maxOwned: 8,
    defaultCount: 2,
    isProducer: false,
    description: 'Thả xuống hồ sen cho đẹp, bơi lội tung tăng. Bán lại khi cần xu.',
  },
  dog: {
    kind: 'dog',
    name: 'Chó Cảnh',
    emoji: '🐶',
    buyPrice: 500,
    sellPrice: 250,
    maxOwned: 3,
    defaultCount: 0,
    isProducer: false,
    description: 'Nuôi cho đẹp, canh giữ nông trại. Có nhiều giống để chọn!',
  },
  cat: {
    kind: 'cat',
    name: 'Mèo Cảnh',
    emoji: '🐱',
    buyPrice: 500,
    sellPrice: 250,
    maxOwned: 3,
    defaultCount: 0,
    isProducer: false,
    description: 'Nuôi cho đẹp, nằm sưởi nắng bên chuồng mèo. Có nhiều giống để chọn!',
  },
};

export interface FarmBreed {
  id: string;
  name: string;
  emoji: string;
  /** Màu lông chính / phụ để vẽ sprite. */
  coat: string;
  coatDark: string;
  extra?: string;
}

export const DOG_BREEDS: FarmBreed[] = [
  { id: 'shiba', name: 'Shiba Inu', emoji: '🐕', coat: '#e8a34d', coatDark: '#b8742a', extra: 'fox' },
  { id: 'corgi', name: 'Corgi', emoji: '🦊', coat: '#f0b35e', coatDark: '#c07f2e', extra: 'short' },
  { id: 'poodle', name: 'Poodle', emoji: '🐩', coat: '#f5f0e8', coatDark: '#cfc4b4', extra: 'curly' },
  { id: 'husky', name: 'Husky', emoji: '🐺', coat: '#8fa3b8', coatDark: '#5b6b7d', extra: 'mask' },
];

export const CAT_BREEDS: FarmBreed[] = [
  { id: 'muop', name: 'Mèo Mướp', emoji: '🐈', coat: '#d9a066', coatDark: '#9c6b3d', extra: 'stripes' },
  { id: 'bengal', name: 'Mèo Bengal', emoji: '🐆', coat: '#e0a458', coatDark: '#8a5a24', extra: 'spots' },
  { id: 'siamese', name: 'Mèo Xiêm', emoji: '🐱', coat: '#efe6d8', coatDark: '#6b5b4c', extra: 'points' },
  { id: 'munckin', name: 'Mèo Munchkin', emoji: '🐈‍⬛', coat: '#7d7d8d', coatDark: '#4c4c58', extra: 'short' },
];

/** Lò ấp trứng: tốn xu + chờ 8 giờ → nở 1 gà mái (tối đa = maxOwned của gà). */
export const FARM_INCUBATOR = {
  costCoins: 40,
  durationSeconds: 8 * 60 * 60,
  rewardExp: 15,
} as const;

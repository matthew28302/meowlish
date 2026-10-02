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
  type: 'chicken' | 'cow';
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
  animalType: 'chicken' | 'cow';
  isFed: boolean;
  fedAt: number | null;
  readyAt: number | null;
  producedCount: number;
}

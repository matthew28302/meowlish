export interface PetSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'magic' | 'buff' | 'debuff' | 'heal' | 'shield' | 'dodge' | 'crowd_control';
  power: number; // Damage multiplier or heal/shield percentage
  costMp: number;
  cooldownTurns: number;
  effect?: 'stun' | 'freeze' | 'blind' | 'shield_50' | 'dodge_100' | 'reflect_30' | 'atk_buff_40' | 'cleanse' | 'crit_boost';
  icon: string;
  visualFx: 'light_beam' | 'claws' | 'headbutt' | 'ice_storm' | 'candy_rain' | 'tornado' | 'charm' | 'shield' | 'bark';
}

export interface PetCombatStats {
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  atk: number;
  def: number;
  speed: number;
  critRate: number; // 0.0 - 1.0
  dodgeRate: number; // 0.0 - 1.0
  shieldPercent: number; // damage reduction
  isStunned?: boolean;
  isFrozen?: boolean;
  isBlind?: boolean;
  isDodgingNext?: boolean;
  reflectPercent?: number;
  turnsWithBuff?: number;
}

export const SIGNATURE_PET_SKILLS: Record<string, PetSkill[]> = {
  owl: [
    {
      id: 'lexi_beam',
      name: 'Tia Sáng Tri Thức',
      description: 'Phóng ra chùm tia sáng phép thuật uyên bác, xuyên phá 30% giáp đối thủ.',
      type: 'magic',
      power: 85,
      costMp: 30,
      cooldownTurns: 2,
      icon: '✨',
      visualFx: 'light_beam',
    },
    {
      id: 'lexi_shield',
      name: 'Màn Chắn Bảo Vệ',
      description: 'Triệu hồi màn chắn tri thức vững chãi, giảm 50% sát thương nhận vào trong 2 lượt.',
      type: 'shield',
      power: 50,
      costMp: 25,
      cooldownTurns: 3,
      effect: 'shield_50',
      icon: '🛡️',
      visualFx: 'shield',
    },
    {
      id: 'lexi_tornado',
      name: 'Cơn Lốc Sách Vở',
      description: 'Lốc xoáy tri thức cuốn phăng đối phương, gây 65 sát thương và hồi phục 25% HP.',
      type: 'magic',
      power: 65,
      costMp: 45,
      cooldownTurns: 3,
      icon: '🌪️',
      visualFx: 'tornado',
    },
  ],
  cat: [
    {
      id: 'cat_claws',
      name: 'Vuốt Mèo Siêu Tốc',
      description: 'Cào xé chớp nhoáng với tỉ lệ bạo kích 50%, x2 sát thương khi chí mạng.',
      type: 'attack',
      power: 80,
      costMp: 25,
      cooldownTurns: 2,
      effect: 'crit_boost',
      icon: '🐾',
      visualFx: 'claws',
    },
    {
      id: 'cat_charm',
      name: 'Tiếng Kêu Mê Hoặc',
      description: 'Tiếng meow ngọt ngào thôi miên đối thủ, khiến đối phương choáng váng mất 1 lượt.',
      type: 'crowd_control',
      power: 35,
      costMp: 35,
      cooldownTurns: 3,
      effect: 'stun',
      icon: '💖',
      visualFx: 'charm',
    },
    {
      id: 'cat_lick',
      name: 'Hồi Máu Liếm Lông',
      description: 'Chăm sóc bộ lông mượt mà, hồi phục 35% HP và tăng 30% tốc độ né tránh.',
      type: 'heal',
      power: 35,
      costMp: 30,
      cooldownTurns: 3,
      icon: '🧼',
      visualFx: 'candy_rain',
    },
  ],
  dog: [
    {
      id: 'corgi_headbutt',
      name: 'Húc Đầu Dũng Mãnh',
      description: 'Lao tới húc đầu siêu mạnh vào kẻ địch, gây sát thương vật lý cực nặng.',
      type: 'attack',
      power: 95,
      costMp: 30,
      cooldownTurns: 2,
      icon: '💥',
      visualFx: 'headbutt',
    },
    {
      id: 'corgi_bark',
      name: 'Tiếng Sủa Uy Dũng',
      description: 'Tiếng sủa rền vang tăng 40% lực tấn công trong 3 lượt tiếp theo.',
      type: 'buff',
      power: 40,
      costMp: 25,
      cooldownTurns: 3,
      effect: 'atk_buff_40',
      icon: '📢',
      visualFx: 'bark',
    },
    {
      id: 'corgi_burrow',
      name: 'Đào Hầm Ẩn Nấp',
      description: 'Đào hầm trốn xuống lòng đất, né tránh 100% đòn đánh kế tiếp và phản kích bất ngờ.',
      type: 'dodge',
      power: 50,
      costMp: 35,
      cooldownTurns: 3,
      effect: 'dodge_100',
      icon: '🕳️',
      visualFx: 'headbutt',
    },
  ],
  ice_dragon: [
    {
      id: 'dragon_absolute_zero',
      name: 'Băng Giá Tuyệt Đối',
      description: 'Hạ nhiệt độ xuống độ không tuyệt đối, đóng băng đối thủ 1 lượt và gây sát thương băng.',
      type: 'crowd_control',
      power: 90,
      costMp: 40,
      cooldownTurns: 3,
      effect: 'freeze',
      icon: '❄️',
      visualFx: 'ice_storm',
    },
    {
      id: 'dragon_arctic_breath',
      name: 'Hơi Thở Cực Bắc',
      description: 'Thổi bão tuyết Bắc Cực làm suy yếu kẻ thù, giảm 40% lực tấn công của địch trong 2 lượt.',
      type: 'debuff',
      power: 70,
      costMp: 30,
      cooldownTurns: 2,
      icon: '🌨️',
      visualFx: 'ice_storm',
    },
    {
      id: 'dragon_eternal_shield',
      name: 'Khiên Băng Vĩnh Cửu',
      description: 'Ngưng tụ giáp băng kim cương, giảm 30% sát thương và phản lại 30% sát thương kẻ địch đánh vào.',
      type: 'shield',
      power: 30,
      costMp: 35,
      cooldownTurns: 3,
      effect: 'reflect_30',
      icon: '🧊',
      visualFx: 'shield',
    },
  ],
  cinnamoroll: [
    {
      id: 'cinna_ear_glide',
      name: 'Tai Bay Lướt Gió',
      description: 'Dang rộng đôi tai bồng bềnh lướt gió, né tránh 100% mọi đòn tấn công kế tiếp.',
      type: 'dodge',
      power: 0,
      costMp: 25,
      cooldownTurns: 2,
      effect: 'dodge_100',
      icon: '🕊️',
      visualFx: 'charm',
    },
    {
      id: 'cinna_sweet_storm',
      name: 'Bão Bụi Ngọt Ngào',
      description: 'Khuấy động bão đường ngọt ngào làm mù mắt đối phương 2 lượt (giảm 60% chính xác).',
      type: 'debuff',
      power: 60,
      costMp: 30,
      cooldownTurns: 3,
      effect: 'blind',
      icon: '🧁',
      visualFx: 'candy_rain',
    },
    {
      id: 'cinna_candy_rain',
      name: 'Mưa Kẹo Hồi Sinh',
      description: 'Tưới cơn mưa kẹo bảy màu ngọt lành, hồi phục 45% HP tối đa và hóa giải mọi hiệu ứng xấu.',
      type: 'heal',
      power: 45,
      costMp: 45,
      cooldownTurns: 3,
      effect: 'cleanse',
      icon: '🍬',
      visualFx: 'candy_rain',
    },
  ],
};

// Default skills for other pets
export const GENERIC_PET_SKILLS: PetSkill[] = [
  {
    id: 'generic_strike',
    name: 'Đòn Đánh Nhanh',
    description: 'Tấn công nhắm vào điểm yếu đối phương.',
    type: 'attack',
    power: 70,
    costMp: 20,
    cooldownTurns: 1,
    icon: '⚡',
    visualFx: 'claws',
  },
  {
    id: 'generic_guard',
    name: 'Thế Thủ Vững Chắc',
    description: 'Tăng 40% phòng thủ trong 2 lượt.',
    type: 'shield',
    power: 40,
    costMp: 20,
    cooldownTurns: 2,
    effect: 'shield_50',
    icon: '🛡️',
    visualFx: 'shield',
  },
  {
    id: 'generic_potion',
    name: 'Nước Thần Hồi Lực',
    description: 'Hồi phục 30% HP tối đa.',
    type: 'heal',
    power: 30,
    costMp: 25,
    cooldownTurns: 3,
    icon: '🧪',
    visualFx: 'candy_rain',
  },
];

export function getPetSkills(species: string): PetSkill[] {
  if (SIGNATURE_PET_SKILLS[species]) {
    return SIGNATURE_PET_SKILLS[species];
  }
  // If alligator_loki, map to ice_dragon or similar awesome set
  if (species === 'alligator_loki') {
    return SIGNATURE_PET_SKILLS.ice_dragon;
  }
  return GENERIC_PET_SKILLS;
}

export function calculateCombatStats(species: string, level = 1, happiness = 90): PetCombatStats {
  let baseHp = 200 + level * 25 + Math.floor(happiness * 0.5);
  const baseMp = 100 + level * 10;
  let baseAtk = 25 + level * 5;
  let baseDef = 15 + level * 3;
  let baseSpeed = 20 + level * 2;
  let critRate = 0.1;
  let dodgeRate = 0.08;

  // Archetype adjustments
  if (species === 'owl') {
    baseAtk += 8;
    baseDef += 4;
  } else if (species === 'cat') {
    critRate = 0.25;
    baseSpeed += 12;
  } else if (species === 'dog') {
    baseHp += 30;
    baseDef += 8;
    baseAtk += 6;
  } else if (species === 'ice_dragon') {
    baseHp += 45;
    baseAtk += 12;
    baseDef += 10;
  } else if (species === 'cinnamoroll') {
    dodgeRate = 0.2;
    baseSpeed += 10;
  }

  return {
    maxHp: baseHp,
    hp: baseHp,
    maxMp: baseMp,
    mp: baseMp,
    atk: baseAtk,
    def: baseDef,
    speed: baseSpeed,
    critRate,
    dodgeRate,
    shieldPercent: 0,
    reflectPercent: 0,
  };
}

export interface BotRival {
  id: string;
  name: string;
  species: string;
  title: string;
  level: number;
  avatarBg: string;
  difficulty: 'rookie' | 'warrior' | 'master' | 'legend';
  coinReward: number;
  expReward: number;
}

export const PVP_BOT_RIVALS: BotRival[] = [
  {
    id: 'rival_chopper',
    name: 'Bác Sĩ Chopper',
    species: 'chopper',
    title: 'Đấu Sĩ Tuần Lộc',
    level: 1,
    avatarBg: 'from-amber-400 to-orange-500',
    difficulty: 'rookie',
    coinReward: 80,
    expReward: 40,
  },
  {
    id: 'rival_kurama',
    name: 'Cửu Vĩ Kurama',
    species: 'kurama',
    title: 'Hỏa Hồ Ly Thần Thoại',
    level: 2,
    avatarBg: 'from-orange-500 to-red-600',
    difficulty: 'warrior',
    coinReward: 150,
    expReward: 75,
  },
  {
    id: 'rival_ice_dragon',
    name: 'Băng Long Cực Bắc',
    species: 'ice_dragon',
    title: 'Chúa Tể Băng Giá',
    level: 3,
    avatarBg: 'from-cyan-400 to-blue-600',
    difficulty: 'master',
    coinReward: 250,
    expReward: 120,
  },
  {
    id: 'rival_cinnamoroll',
    name: 'Cinnamoroll Thần Thoại',
    species: 'cinnamoroll',
    title: 'Thánh Thú Bồng Bềnh',
    level: 4,
    avatarBg: 'from-pink-300 to-purple-500',
    difficulty: 'legend',
    coinReward: 400,
    expReward: 200,
  },
];

'use client';

import type { Metadata } from 'next';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
  Utensils,
  ShoppingBag,
  Shirt,
  Trees,
  Volume2,
  Zap,
  Award,
  ChevronRight,
  Check,
  Coins,
  RefreshCw,
  Plus,
  Compass,
  ArrowRight,
  Flame,
  ShieldCheck,
  X,
  Eye,
  RotateCcw,
  Lock,
  MoreHorizontal
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { getStoredUser, setStoredUser, AuthUser } from '@/lib/auth';
import { PETS_CATALOG, SHOP_ITEMS, ShopItem, getPetTitle } from '@/lib/petData';
import confetti from '@/lib/confetti';
import PixelFarmGame, { PixelFarmHandle } from '@/components/pet/PixelFarmGame';
import PixelPetSprite from '@/components/pet/PixelPetSprite';
import PixelFarmCanvas from '@/components/pet/PixelFarmCanvas';
import PetPvPArenaCanvas from '@/components/pet/PetPvPArenaCanvas';
import PetRacingCanvas from '@/components/pet/PetRacingCanvas';
import PetSocialHub from '@/components/pet/PetSocialHub';
import { SocialFriend } from '@/lib/petSocialData';

/**
 * Má»™t má»¥c trong menu "ThÃªm" cá»§a thanh cÃ´ng cá»¥.
 *
 * TÃ¡ch thÃ nh component riÃªng Ä‘á»ƒ 5 má»¥c khÃ´ng láº·p cÃ¹ng má»™t khá»‘i className dÃ i.
 * Má»—i má»¥c cao â‰¥44px Ä‘á»ƒ cháº¡m Ä‘Æ°á»£c báº±ng ngÃ³n tay.
 */
function MoreItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full min-h-[44px] flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15 transition cursor-pointer touch-manipulation"
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {hint && (
          <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

export const metadata: Metadata = {
  title: 'Thú Cưng PixelFarm 2.5D - Meowlish',
  description: 'Nuôi thú cưng pixel 2.5D, cho ăn, chơi đùa, thay đổi cảnh quan, sắm đồ thời trang, đấu PVP và đua xe kiếm Coins.',
};

export default function PetPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  // Tráº¡ng thÃ¡i khá»Ÿi táº¡o pháº£i GIá»NG Há»†T server render (null/true/default).
  // Äá»c localStorage trong useState initializer sáº½ lÃ m cÃ¢y HTML trÃªn client khÃ¡c
  // server -> React hydration mismatch. Viá»‡c khÃ´i phá»¥c cache lÃ m á»Ÿ hydrateFromCache()
  // cháº¡y trong useEffect (SAU khi hydration xong).
  const [petData, setPetData] = useState<any | null>(null);
  // Cá» quyá»n Cinnamoroll do server gá»­i (GET /api/pet â†’ `cinnamorollAccess`).
  // Máº·c Ä‘á»‹nh khoÃ¡: khÃ´ng Ä‘á»£i dá»¯ liá»‡u thÃ¬ khÃ´ng cho Ä‘á»•i sang thÃº cÆ°ng Ä‘áº·c quyá»n.
  const [cinnaServerAccess, setCinnaServerAccess] = useState<{
    isUnlocked: boolean;
    status: string;
    message: string;
  }>({
    isUnlocked: false,
    status: 'locked_not_logged_in',
    message: 'BÃ© Cinnamoroll lÃ  ThÃº CÆ°ng Äá»™c Quyá»n Giá»›i Háº¡n dÃ nh riÃªng cho Quáº£n Trá»‹ ViÃªn (Admin).',
  });
  const [inventory, setInventory] = useState<any[]>([]);
  const [gardenDecor, setGardenDecor] = useState<any[]>([]);
  const [userCoins, setUserCoins] = useState<number>(0);

  // Game Hub Tab Mode: farm | pvp | racing | sanctuary | social
  const [gameTab, setGameTab] = useState<'farm' | 'pvp' | 'racing' | 'sanctuary' | 'social'>('farm');
  const [farmPlots, setFarmPlots] = useState<any[]>([]);
  const [livestock, setLivestock] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<any[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<any[]>([]);
  const [outgoingFriendIds, setOutgoingFriendIds] = useState<string[]>([]);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [coupleData, setCoupleData] = useState<any>(null);
  const [incomingProposal, setIncomingProposal] = useState<any>(null);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [recentChat, setRecentChat] = useState<any[]>([]);

  // Modals
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [showHabitatModal, setShowHabitatModal] = useState<boolean>(false);
  const [showFeedModal, setShowFeedModal] = useState<boolean>(false);
  /** Menu "ThÃªm" cá»§a thanh cÃ´ng cá»¥ â€” gom cÃ¡c nÃºt chá»‰ má»Ÿ modal. */
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false);
  const [switchPetCategory, setSwitchPetCategory] = useState<string>('all');
  const [specialPetModal, setSpecialPetModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: 'login' | 'verify_email' | 'close';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: 'close',
  });

  // Shop / Fitting Room State
  const [shopMode, setShopMode] = useState<'shop' | 'wardrobe'>('shop');
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [previewHat, setPreviewHat] = useState<string | null>(null);
  const [previewOutfit, setPreviewOutfit] = useState<string | null>(null);
  const [previewAccessory, setPreviewAccessory] = useState<string | null>(null);

  const farmRef = useRef<PixelFarmHandle>(null);
  const [farmState, setFarmState] = useState<{ isSleeping: boolean; isSpeedFast: boolean }>({
    isSleeping: false,
    isSpeedFast: false,
  });

  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [petSpeech, setPetSpeech] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Clean up confetti on unmount
  useEffect(() => {
    return () => {
      confetti.reset();
    };
  }, []);

  // KhÃ´i phá»¥c cache tá»« localStorage SAU khi hydration (cháº¡y trÃªn client).
  // Náº¿u cÃ³ cache => hiá»ƒn thá»‹ pet ngay, khÃ´ng cáº§n chá» fetch.
  useEffect(() => {
    let hasCache = false;
    try {
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser(stored);
        if (stored.coins !== undefined) {
          setUserCoins(stored.coins);
        }
      }
      const cached = localStorage.getItem('meowlish_pet_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.pet_type) {
          const savedHab = localStorage.getItem('pet_selected_habitat');
          const savedSpecies = localStorage.getItem('pet_selected_species');
          if (savedHab) parsed.selected_habitat = savedHab;
          if (savedSpecies) {
            parsed.pet_type = savedSpecies;
            parsed.meta = PETS_CATALOG[savedSpecies] || parsed.meta;
          } else if (!parsed.meta) {
            parsed.meta = PETS_CATALOG[parsed.pet_type] || PETS_CATALOG.owl;
          }
          setPetData(parsed);
          hasCache = true;
        }
      }
      if (!hasCache) {
        // If no full cache, check if separate keys exist
        const savedHab = localStorage.getItem('pet_selected_habitat');
        const savedSpecies = localStorage.getItem('pet_selected_species');
        if (savedSpecies) {
          setPetData({
            pet_type: savedSpecies,
            pet_name: PETS_CATALOG[savedSpecies]?.name || 'ThÃº CÆ°ng',
            selected_habitat: savedHab || 'emerald_garden',
            equipped_hat: 'none',
            equipped_outfit: 'none',
            equipped_accessory: 'none',
            hunger: 80,
            happiness: 90,
            level: 1,
            exp: 0,
            meta: PETS_CATALOG[savedSpecies] || PETS_CATALOG.owl,
          });
          hasCache = true;
        }
      }

      setFarmState({
        isSleeping: localStorage.getItem('meowlish_pet_is_sleeping') === 'true',
        isSpeedFast: false,
      });
    } catch {}

    // CÃ³ cache => háº¿t loading, khÃ´ng cáº§n hiá»‡n spinner chá» fetch
    if (hasCache) setIsLoading(false);
  }, []);

  // Load user and pet data
  // Nguá»“n tháº­t cho loÃ i/cáº£nh quan Ä‘ang dÃ¹ng lÃ  localStorage (lá»±a chá»n cá»§a user).
  // Server â€” Ä‘áº·c biá»‡t multi-instance stale read trÃªn production â€” cÃ³ thá»ƒ tráº£
  // giÃ¡ trá»‹ cÅ© (vd pet_type 'owl' dÃ¹ user Ä‘Ã£ Ä‘á»•i). Ã‰p má»i pet object tá»« server
  // vá» Ä‘Ãºng lá»±a chá»n local trÆ°á»›c khi Ä‘Æ°a vÃ o state (giá»¯ Ä‘Ãºng ngá»¯ nghÄ©a cÅ©).
  const reconcilePetWithLocal = (pet: any) => {
    if (!pet || typeof window === 'undefined') return pet;
    try {
      const savedHab = localStorage.getItem('pet_selected_habitat');
      const savedSpecies = localStorage.getItem('pet_selected_species');
      if (savedHab && (!pet.selected_habitat || pet.selected_habitat === 'emerald_garden')) {
        pet.selected_habitat = savedHab;
      } else if (pet.selected_habitat) {
        localStorage.setItem('pet_selected_habitat', pet.selected_habitat);
      }
      if (savedSpecies && (!pet.pet_type || pet.pet_type === 'owl')) {
        pet.pet_type = savedSpecies;
        pet.meta = PETS_CATALOG[savedSpecies] || pet.meta;
        // TÃªn Ä‘i theo loÃ i (server stale cÃ³ thá»ƒ tráº£ cáº£ tÃªn cÅ©) â€” láº¥y tá»« catalog
        if (PETS_CATALOG[savedSpecies]) pet.pet_name = PETS_CATALOG[savedSpecies].name;
      } else if (pet.pet_type) {
        localStorage.setItem('pet_selected_species', pet.pet_type);
        if (!pet.meta) pet.meta = PETS_CATALOG[pet.pet_type] || PETS_CATALOG.owl;
      }
    } catch {}
    return pet;
  };

  const loadPetData = async () => {
    const user = getStoredUser();
    setCurrentUser(user);
    if (user?.coins !== undefined) {
      setUserCoins(user.coins);
    }

    try {
      const res = await fetch(`/api/pet?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pet) {
          reconcilePetWithLocal(data.pet);
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('meowlish_pet_cache', JSON.stringify(data.pet));
            }
          } catch {}
          setPetData(data.pet);
        }
        setInventory(data.inventory || []);
        setGardenDecor(data.gardenDecor || []);
        if (data.farmPlots) setFarmPlots(data.farmPlots);
        if (data.livestock) setLivestock(data.livestock);
        if (data.friendIds) setFriendIds(data.friendIds);
        if (data.acceptedFriends) setAcceptedFriends(data.acceptedFriends);
        if (data.incomingFriendRequests) setIncomingFriendRequests(data.incomingFriendRequests);
        if (data.outgoingFriendIds) setOutgoingFriendIds(data.outgoingFriendIds);
        if (data.communityUsers) setCommunityUsers(data.communityUsers);
        if (data.couple) setCoupleData(data.couple);
        if (data.incomingProposal !== undefined) setIncomingProposal(data.incomingProposal);
        if (data.activeRooms) setActiveRooms(data.activeRooms);
        if (data.recentChat) setRecentChat(data.recentChat);
        if (data.cinnamorollAccess) setCinnaServerAccess(data.cinnamorollAccess);
        if (data.user?.coins !== undefined) {
          setUserCoins(data.user.coins);
          const stored = getStoredUser();
          if (stored && stored.coins !== data.user.coins) {
            setStoredUser({ ...stored, coins: data.user.coins });
          }
        } else {
          setUserCoins(user.coins || 1000);
        }
        if (data.pet?.meta?.greetings?.length > 0) {
          const randGreeting = data.pet.meta.greetings[Math.floor(Math.random() * data.pet.meta.greetings.length)];
          setPetSpeech(randGreeting);
        }
      } else {
        if (user?.coins !== undefined) {
          setUserCoins(user.coins);
        }
      }
    } catch (err) {
      console.error('Error loading pet data:', err);
      if (user?.coins !== undefined) {
        setUserCoins(user.coins);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPetData();
  }, []);

  // Láº¯ng nghe thay Ä‘á»•i auth/coins tá»« cÃ¡c trang khÃ¡c (vÃ­ dá»¥: lÃ m bÃ i táº­p kiáº¿m thÃªm xu)
  useEffect(() => {
    const handleAuthChange = () => {
      const user = getStoredUser();
      if (user) {
        setCurrentUser(user);
        if (user.coins !== undefined) {
          setUserCoins(user.coins);
        }
      }
    };
    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
  }, []);

  // Action: Petting / Vuá»‘t ve
  const handlePet = async (e?: React.MouseEvent) => {
    sound.playCelebration();

    const happyQuotes = petData?.meta?.happyQuotes || ['Cáº£m Æ¡n báº¡n nha! ðŸ’–'];
    setPetSpeech(happyQuotes[Math.floor(Math.random() * happyQuotes.length)]);

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          action: 'pet',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reconcilePetWithLocal(data.pet);
        setPetData((prev: any) => ({ ...prev, ...data.pet }));
      }
    } catch {}
  };

  // Action: Feed / Cho Äƒn
  const handleFeed = async (foodItem: ShopItem) => {
    const isOwned = inventory.some((i) => i.item_id === foodItem.id && (i.quantity === undefined || i.quantity > 0));
    if (!isOwned && userCoins < foodItem.price) {
      sound.playWrong();
      const needed = foodItem.price - userCoins;
      alert(`ðŸª™ Báº¡n Ä‘ang cÃ³ ${userCoins.toLocaleString()} Coins, cáº§n thÃªm ${needed.toLocaleString()} Coins Ä‘á»ƒ mua mÃ³n Äƒn "${foodItem.name}".\nHÃ£y hoÃ n thÃ nh cÃ¡c bÃ i há»c vÃ  bÃ i kiá»ƒm tra Ä‘á»ƒ tÃ­ch lÅ©y thÃªm Coins nhÃ©!`);
      return;
    }

    sound.playSuccess();
    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          action: 'feed',
          itemId: foodItem.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reconcilePetWithLocal(data.pet);
        setPetData((prev: any) => ({ ...prev, ...data.pet }));
        if (data.user?.coins !== undefined) {
          setUserCoins(data.user.coins);
          const stored = getStoredUser();
          if (stored) {
            setStoredUser({ ...stored, coins: data.user.coins });
          }
          window.dispatchEvent(new Event('auth-state-changed'));
        }
        setShowFeedModal(false);

        // Giáº£m sá»‘ lÆ°á»£ng Ä‘á»“ Äƒn trong kho náº¿u dÃ¹ng tá»« kho
        setInventory((prev) => {
          const itemIndex = prev.findIndex((i) => i.item_id === foodItem.id);
          if (itemIndex === -1) return prev;
          const currentQty = prev[itemIndex].quantity || 1;
          if (currentQty > 1) {
            const next = [...prev];
            next[itemIndex] = { ...next[itemIndex], quantity: currentQty - 1 };
            return next;
          }
          return prev.filter((i) => i.item_id !== foodItem.id);
        });

        const eatSounds = petData?.meta?.eatSounds || ['MÄƒm mÄƒm ngon quÃ¡! ðŸ˜‹'];
        setPetSpeech(eatSounds[Math.floor(Math.random() * eatSounds.length)]);

        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.5 },
        });
      } else {
        const errData = await res.json();
        sound.playError();
        alert(errData.error || 'KhÃ´ng thá»ƒ cho Äƒn lÃºc nÃ y!');
      }
    } catch {}
  };

  // Action: Unequip Item explicitly
  const handleUnequip = async (itemType: 'hat' | 'outfit' | 'accessory') => {
    sound.playClick();
    const field = itemType === 'hat' ? 'equipped_hat' : itemType === 'outfit' ? 'equipped_outfit' : 'equipped_accessory';

    setPetData((prev: any) => {
      const updated = { ...prev, [field]: 'none' };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('meowlish_pet_cache', JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    if (itemType === 'hat') setPreviewHat(null);
    if (itemType === 'outfit') setPreviewOutfit(null);
    if (itemType === 'accessory') setPreviewAccessory(null);

    window.dispatchEvent(new Event('auth-state-changed'));

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          action: 'equip',
          itemId: 'none',
          itemType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reconcilePetWithLocal(data.pet);
        setPetData((prev: any) => ({ ...prev, ...data.pet }));
      } else {
        const errData = await res.json().catch(() => null);
        sound.playWrong();
        alert(errData?.error || 'KhÃ´ng thá»ƒ thÃ¡o Ä‘á»“ lÃºc nÃ y!');
        await loadPetData();
      }
    } catch {
      sound.playWrong();
      await loadPetData();
    }
  };

  // Action: Equip or Unequip Item on Pet (Optimistic Update)
  const handleEquip = async (item: ShopItem) => {
    sound.playClick();

    const field = item.type === 'hat' ? 'equipped_hat' : item.type === 'outfit' ? 'equipped_outfit' : 'equipped_accessory';
    const isCurrentlyEquipped = petData?.[field] === item.id;
    const nextVal = isCurrentlyEquipped ? 'none' : item.id;

    // Optimistic Update immediately
    setPetData((prev: any) => {
      const updated = { ...prev, [field]: nextVal };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('meowlish_pet_cache', JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    if (item.type === 'hat') setPreviewHat(nextVal === 'none' ? null : nextVal);
    if (item.type === 'outfit') setPreviewOutfit(nextVal === 'none' ? null : nextVal);
    if (item.type === 'accessory') setPreviewAccessory(nextVal === 'none' ? null : nextVal);

    window.dispatchEvent(new Event('auth-state-changed'));

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          action: 'equip',
          // Gá»­i TRáº NG THÃI ÄÃCH (item.id hoáº·c 'none') + itemType Ä‘á»ƒ server
          // SET tÆ°á»ng minh, khÃ´ng toggle theo DB (trÃ¡nh double-toggle).
          itemId: nextVal,
          itemType: item.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reconcilePetWithLocal(data.pet);
        setPetData((prev: any) => {
          const updated = { ...prev, ...data.pet };
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('meowlish_pet_cache', JSON.stringify(updated));
            }
          } catch {}
          return updated;
        });
        window.dispatchEvent(new Event('auth-state-changed'));
      } else {
        // Server tá»« chá»‘i (chÆ°a sá»Ÿ há»¯u / phiÃªn háº¿t háº¡n...): bÃ¡o lá»—i + Ä‘á»“ng bá»™
        // láº¡i tá»« server Ä‘á»ƒ há»§y tráº¡ng thÃ¡i optimistic sai lá»‡ch.
        const errData = await res.json().catch(() => null);
        sound.playWrong();
        alert(errData?.error || 'KhÃ´ng thá»ƒ thay Ä‘á»“ cho thÃº cÆ°ng lÃºc nÃ y!');
        await loadPetData();
      }
    } catch {
      sound.playWrong();
      await loadPetData();
    }
  };

  // Action: Switch Pet Species (Optimistic Update)
  const handleSwitchPet = async (petId: string) => {
    if (petId === 'cinnamoroll') {
      // DÃ¹ng cá» do SERVER gá»­i kÃ¨m, khÃ´ng tá»± tÃ­nh á»Ÿ client: tÃ­nh á»Ÿ client Ä‘Ã²i
      // há»i danh sÃ¡ch email Ä‘Æ°á»£c cáº¥p quyá»n â€” mÃ  danh sÃ¡ch Ä‘Ã³ lÃ  PII tháº­t, tuyá»‡t
      // Ä‘á»‘i khÃ´ng Ä‘Æ°á»£c Ä‘Ã³ng gÃ³i vÃ o bundle (Ä‘Ã£ tá»«ng bá»‹ phÃ¡t hiá»‡n trong JS táº£i
      // vá» cho má»i khÃ¡ch truy cáº­p /pet).
      const access = cinnaServerAccess;
      if (!access.isUnlocked) {
        sound.playWrong();
        if (access.status === 'locked_not_logged_in') {
          setSpecialPetModal({
            isOpen: true,
            title: 'ThÃº CÆ°ng Äá»™c Quyá»n Admin ðŸ”’',
            message: 'BÃ© Cinnamoroll lÃ  ThÃº CÆ°ng Äá»™c Quyá»n Giá»›i Háº¡n dÃ nh riÃªng cho Quáº£n Trá»‹ ViÃªn (Admin). Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ kiá»ƒm tra Ä‘iá»u kiá»‡n má»Ÿ khoÃ¡!',
            action: 'login',
          });
        } else if (access.status === 'locked_unverified_email') {
          setSpecialPetModal({
            isOpen: true,
            title: 'KÃ­ch Hoáº¡t Äáº·c Quyá»n Admin âœ‰ï¸âœ¨',
            message: 'TÃ i khoáº£n cá»§a báº¡n Ä‘á»§ Ä‘iá»u kiá»‡n kÃ­ch hoáº¡t Ä‘áº·c quyá»n sá»Ÿ há»¯u bÃ© Cinnamoroll! Vui lÃ²ng hoÃ n táº¥t xÃ¡c thá»±c mÃ£ OTP email Ä‘á»ƒ nháº­n bÃ© vá» khu vÆ°á»n cá»§a mÃ¬nh nhÃ©.',
            action: 'verify_email',
          });
        } else {
          setSpecialPetModal({
            isOpen: true,
            title: 'ThÃº CÆ°ng Bá»‹ KhoÃ¡ ðŸ”’',
            message: 'BÃ© Cinnamoroll lÃ  ThÃº CÆ°ng Äá»™c Quyá»n Giá»›i Háº¡n chá»‰ dÃ nh riÃªng cho Quáº£n Trá»‹ ViÃªn (Admin) Ä‘Æ°á»£c cáº¥p quyá»n Ä‘áº·c biá»‡t.',
            action: 'close',
          });
        }
        return;
      }
    }

    sound.playCelebration();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.5 },
    });

    const chosenMeta = PETS_CATALOG[petId] || PETS_CATALOG.owl;

    // Optimistic Update immediately
    setPetData((prev: any) => {
      const updated = {
        ...prev,
        pet_type: petId,
        pet_name: chosenMeta.name,
        meta: chosenMeta,
      };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('pet_selected_species', petId);
          localStorage.setItem('meowlish_pet_cache', JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });

    setShowSwitchModal(false);
    window.dispatchEvent(new Event('auth-state-changed'));

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          action: 'switch_pet',
          petType: petId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reconcilePetWithLocal(data.pet);
        const updated = {
          ...data.pet,
          meta: chosenMeta,
        };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('pet_selected_species', petId);
            localStorage.setItem('meowlish_pet_cache', JSON.stringify(updated));
          }
        } catch {}
        setPetData(updated);
        window.dispatchEvent(new Event('auth-state-changed'));
      }
    } catch {}
  };

  // Action: Change Habitat
  const handleChangeHabitat = async (habitatId: string) => {
    sound.playCelebration();
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pet_selected_habitat', habitatId);
      }
    } catch {}

    setPetData((prev: any) => {
      const updated = { ...prev, selected_habitat: habitatId };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('meowlish_pet_cache', JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });
    setShowHabitatModal(false);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
    });

    try {
      const res = await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          action: 'change_habitat',
          habitatId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPetData((prev: any) => {
          const updated = { ...prev, selected_habitat: habitatId };
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('meowlish_pet_cache', JSON.stringify(updated));
            }
          } catch {}
          return updated;
        });
      }
    } catch {}
  };

  // Action: Purchase from Shop
  const handlePurchase = async (item: ShopItem) => {
    sound.playClick();

    if (userCoins < item.price) {
      sound.playWrong();
      const needed = item.price - userCoins;
      alert(`ðŸª™ Báº¡n Ä‘ang cÃ³ ${userCoins.toLocaleString()} Coins, cáº§n thÃªm ${needed.toLocaleString()} Coins Ä‘á»ƒ sá»Ÿ há»¯u "${item.name}".\nHÃ£y hoÃ n thÃ nh cÃ¡c bÃ i há»c vÃ  thá»­ thÃ¡ch tiáº¿ng Anh Ä‘á»ƒ tÃ­ch lÅ©y thÃªm Coins nhÃ©!`);
      return;
    }

    try {
      const res = await fetch('/api/pet/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          itemId: item.id,
        }),
      });

      if (res.ok) {
        sound.playCelebration();
        const data = await res.json();
        setUserCoins(data.remainingCoins);
        setInventory((prev) => [...prev, { item_id: item.id, item_type: item.type, quantity: 1 }]);
        
        // Cáº­p nháº­t láº¡i UI header coins
        const stored = getStoredUser();
        if (stored) {
          setStoredUser({ ...stored, coins: data.remainingCoins });
        }
        window.dispatchEvent(new Event('auth-state-changed'));

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
        });

        // Automatically equip purchased wearable
        if (['hat', 'outfit', 'accessory'].includes(item.type)) {
          handleEquip(item);
        } else if (item.type === 'habitat') {
          handleChangeHabitat(item.id);
        }

        window.dispatchEvent(new Event('auth-state-changed'));
      } else {
        const errData = await res.json();
        sound.playError();
        alert(errData.error || 'Mua váº­t pháº©m tháº¥t báº¡i');
      }
    } catch {
      sound.playError();
      alert('KhÃ´ng thá»ƒ káº¿t ná»‘i mÃ¡y chá»§ Ä‘á»ƒ mua váº­t pháº©m. Vui lÃ²ng thá»­ láº¡i!');
    }
  };

  // Open Shop & Fitting Room Modal
  const handleOpenShop = (mode: 'shop' | 'wardrobe' = 'shop') => {
    sound.playClick();
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      if (stored.coins !== undefined) {
        setUserCoins(stored.coins);
      }
    }
    setShopMode(mode);
    setPreviewHat(petData?.equipped_hat || null);
    setPreviewOutfit(petData?.equipped_outfit || null);
    setPreviewAccessory(petData?.equipped_accessory || null);
    setShowShopModal(true);
  };

  // Toggle preview of an item on the live pet stage
  const handleTogglePreview = (item: ShopItem) => {
    sound.playClick();
    if (item.type === 'hat') {
      setPreviewHat((prev) => (prev === item.id ? null : item.id));
    } else if (item.type === 'outfit') {
      setPreviewOutfit((prev) => (prev === item.id ? null : item.id));
    } else if (item.type === 'accessory') {
      setPreviewAccessory((prev) => (prev === item.id ? null : item.id));
    }
  };

  // Revert preview back to pet's current equipped items
  const handleRevertPreview = () => {
    sound.playClick();
    setPreviewHat(petData?.equipped_hat || null);
    setPreviewOutfit(petData?.equipped_outfit || null);
    setPreviewAccessory(petData?.equipped_accessory || null);
  };

  // Apply previewed changes directly to pet
  const handleApplyPreview = async () => {
    sound.playSuccess();
    try {
      // Find what changed and call equip or unequip
      const targetHat = previewHat || 'none';
      const targetOutfit = previewOutfit || 'none';
      const targetAccessory = previewAccessory || 'none';

      if (targetHat !== (petData?.equipped_hat || 'none')) {
        if (targetHat === 'none') {
          await handleUnequip('hat');
        } else {
          const hatItem = SHOP_ITEMS.find((i) => i.id === targetHat);
          if (hatItem) await handleEquip(hatItem);
        }
      }
      if (targetOutfit !== (petData?.equipped_outfit || 'none')) {
        if (targetOutfit === 'none') {
          await handleUnequip('outfit');
        } else {
          const outfitItem = SHOP_ITEMS.find((i) => i.id === targetOutfit);
          if (outfitItem) await handleEquip(outfitItem);
        }
      }
      if (targetAccessory !== (petData?.equipped_accessory || 'none')) {
        if (targetAccessory === 'none') {
          await handleUnequip('accessory');
        } else {
          const accItem = SHOP_ITEMS.find((i) => i.id === targetAccessory);
          if (accItem) await handleEquip(accItem);
        }
      }
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.5 },
      });
      setShowShopModal(false);
    } catch {}
  };

  const currentPetMeta = petData?.meta || PETS_CATALOG.owl;
  const foodItems = SHOP_ITEMS.filter((i) => i.type === 'food');
  const ownedItemIds = new Set(inventory.map((i) => i.item_id));

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (shopMode === 'wardrobe' && !ownedItemIds.has(item.id) && item.price !== 0) {
      return false;
    }
    if (shopCategory === 'all') return true;
    return item.type === shopCategory;
  });

  const previewHatObj = SHOP_ITEMS.find((i) => i.id === previewHat);
  const previewOutfitObj = SHOP_ITEMS.find((i) => i.id === previewOutfit);
  const previewAccessoryObj = SHOP_ITEMS.find((i) => i.id === previewAccessory);

  const currentHabitat = petData?.selected_habitat || 'emerald_garden';

  // Map-specific interactive action buttons tailored to active habitat
  const mapActionButtons = (() => {
    switch (currentHabitat) {
      case 'emerald_garden':
        return [
          { key: 'swim', label: 'BÆ¡i Há»“ Sen', emoji: 'ðŸª·', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'TrÃ¨o CÃ¢y TÃ¡o', emoji: 'ðŸŽ', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'jump', label: 'Báº­t Náº¥m LÃ² Xo', emoji: 'ðŸ„', bg: 'bg-rose-500 hover:bg-rose-400' },
          { key: 'coop', label: 'Cho GÃ  Ä‚n', emoji: 'ðŸ”', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'veggie', label: 'Thu Hoáº¡ch Rau', emoji: 'ðŸ¥•', bg: 'bg-orange-600 hover:bg-orange-500' },
        ];
      case 'sunset_beach':
        return [
          { key: 'surf', label: 'LÆ°á»›t VÃ¡n SÃ³ng', emoji: 'ðŸ„', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'TrÃ¨o CÃ¢y Dá»«a', emoji: 'ðŸŒ´', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'volleyball', label: 'ÄÃ¡nh BÃ³ng Chuyá»n', emoji: 'ðŸ', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'tiki', label: 'Uá»‘ng NÆ°á»›c Dá»«a Tiki', emoji: 'ðŸ¹', bg: 'bg-rose-600 hover:bg-rose-500' },
          { key: 'lighthouse', label: 'ÄÃ¨n Háº£i ÄÄƒng', emoji: 'ðŸ—¼', bg: 'bg-indigo-600 hover:bg-indigo-500' },
        ];
      case 'cozy_den':
        return [
          { key: 'code', label: 'GÃµ Code Dev', emoji: 'ðŸ’»', bg: 'bg-indigo-600 hover:bg-indigo-500' },
          { key: 'climb', label: 'Ká»‡ SÃ¡ch Láº­p TrÃ¬nh', emoji: 'ðŸ“š', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'beanbag', label: 'Náº±m Gháº¿ Beanbag', emoji: 'ðŸ›‹ï¸', bg: 'bg-rose-500 hover:bg-rose-400' },
          { key: 'coffee', label: 'Pha Espresso', emoji: 'â˜•', bg: 'bg-amber-700 hover:bg-amber-600' },
          { key: 'server', label: 'Kiá»ƒm Tra Server Rack', emoji: 'ðŸ–¥ï¸', bg: 'bg-cyan-700 hover:bg-cyan-600' },
        ];
      case 'sky_castle':
        return [
          { key: 'fountain', label: 'ÄÃ i Phun Sao Biá»ƒn', emoji: 'â›²', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'Báº­c MÃ¢y Cung ÄÃ¬nh', emoji: 'â˜ï¸', bg: 'bg-indigo-600 hover:bg-indigo-500' },
          { key: 'rainbow', label: 'Cáº§u Vá»“ng Pha LÃª', emoji: 'ðŸŒˆ', bg: 'bg-pink-600 hover:bg-pink-500' },
          { key: 'treasure', label: 'Má»Ÿ RÆ°Æ¡ng Kim CÆ°Æ¡ng', emoji: 'ðŸ’Ž', bg: 'bg-amber-500 hover:bg-amber-400 text-slate-950' },
          { key: 'castle', label: 'Cá»•ng ThÃ nh Tháº§n TiÃªn', emoji: 'ðŸ°', bg: 'bg-purple-600 hover:bg-purple-500' },
        ];
      case 'thousand_sunny':
        return [
          { key: 'helm', label: 'Báº» BÃ¡nh LÃ¡i TÃ u', emoji: 'âš“', bg: 'bg-amber-700 hover:bg-amber-600' },
          { key: 'jump', label: 'Nháº£y Äáº§u SÆ° Tá»­ Sunny', emoji: 'ðŸ¦', bg: 'bg-yellow-500 hover:bg-yellow-400 text-slate-950' },
          { key: 'cannon', label: 'Náº¡p Äáº¡i BÃ¡c Cola', emoji: 'ðŸ’£', bg: 'bg-stone-700 hover:bg-stone-600' },
          { key: 'tangerine', label: 'HÃ¡i Cam Mikan Nami', emoji: 'ðŸŠ', bg: 'bg-orange-500 hover:bg-orange-400' },
          { key: 'treasure', label: 'Má»Ÿ RÆ°Æ¡ng Kho BÃ¡u', emoji: 'ðŸ’°', bg: 'bg-emerald-600 hover:bg-emerald-500' },
        ];
      case 'konoha_valley':
        return [
          { key: 'ramen', label: 'Ä‚n MÃ¬ Ichiraku', emoji: 'ðŸœ', bg: 'bg-orange-600 hover:bg-orange-500' },
          { key: 'hokage', label: 'Leo TÆ°á»£ng Hokage', emoji: 'â›°ï¸', bg: 'bg-stone-600 hover:bg-stone-500' },
          { key: 'torii', label: 'Äi Qua Cá»•ng Torii', emoji: 'â›©ï¸', bg: 'bg-red-600 hover:bg-red-500' },
          { key: 'target', label: 'Báº¯n Phi TiÃªu Kunai', emoji: 'ðŸŽ¯', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'onsen', label: 'NgÃ¢m Suá»‘i Onsen', emoji: 'â™¨ï¸', bg: 'bg-teal-600 hover:bg-teal-500' },
        ];
      case 'hogwarts_hall':
        return [
          { key: 'sorting_hat', label: 'Äá»™i NÃ³n PhÃ¢n Loáº¡i', emoji: 'ðŸ§™', bg: 'bg-purple-700 hover:bg-purple-600' },
          { key: 'feast', label: 'Dá»± Tiá»‡c Äáº¡i Sáº£nh', emoji: 'ðŸ—', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'fireplace', label: 'SÆ°á»Ÿi LÃ² Gryffindor', emoji: 'ðŸ”¥', bg: 'bg-red-700 hover:bg-red-600' },
          { key: 'banners', label: 'Cá» Bá»‘n NhÃ  PhÃ¡p Thuáº­t', emoji: 'ðŸš©', bg: 'bg-indigo-600 hover:bg-indigo-500' },
        ];
      case 'doraemon_field':
        return [
          { key: 'pipes', label: 'Ngá»“i 3 á»ng BÃª TÃ´ng', emoji: 'ðŸ§±', bg: 'bg-slate-600 hover:bg-slate-500' },
          { key: 'anywhere_door', label: 'Má»Ÿ Cá»­a Tháº§n Ká»³', emoji: 'ðŸšª', bg: 'bg-pink-600 hover:bg-pink-500' },
          { key: 'dorayaki', label: 'Ä‚n BÃ¡nh RÃ¡n Nobita', emoji: 'ðŸ¥ž', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'pole', label: 'Cá»™t Äiá»‡n Khu Phá»‘', emoji: 'âš¡', bg: 'bg-sky-700 hover:bg-sky-600' },
        ];
      case 'dream_land':
        return [
          { key: 'warp_star', label: 'CÆ°á»¡i Sao Warp Star', emoji: 'â­', bg: 'bg-yellow-500 hover:bg-yellow-400 text-slate-950' },
          { key: 'lollipop', label: 'CÃ¢y Káº¹o Báº£y Sáº¯c', emoji: 'ðŸ­', bg: 'bg-pink-500 hover:bg-pink-400' },
          { key: 'rainbow', label: 'Suá»‘i ThÃ¡c Cáº§u Vá»“ng', emoji: 'ðŸŒˆ', bg: 'bg-violet-600 hover:bg-violet-500' },
          { key: 'apple', label: 'HÃ¡i TÃ¡o Whispy Woods', emoji: 'ðŸŽ', bg: 'bg-emerald-600 hover:bg-emerald-500' },
          { key: 'star_rod', label: 'Cáº§u Nguyá»‡n TrÆ°á»£ng Sao', emoji: 'ðŸª„', bg: 'bg-indigo-600 hover:bg-indigo-500' },
        ];
      default:
        return [
          { key: 'swim', label: 'BÆ¡i Há»“ Sen', emoji: 'ðŸª·', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'TrÃ¨o CÃ¢y TÃ¡o', emoji: 'ðŸŽ', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'jump', label: 'Báº­t Náº¥m LÃ² Xo', emoji: 'ðŸ„', bg: 'bg-rose-500 hover:bg-rose-400' },
          { key: 'coop', label: 'Cho GÃ  Ä‚n', emoji: 'ðŸ”', bg: 'bg-amber-600 hover:bg-amber-500' },
        ];
    }
  })();

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col p-2 sm:p-3 gap-2 overflow-y-auto custom-scrollbar select-none pb-24 lg:pb-2 overflow-x-hidden">
      {/* ================= MEOWLISH 2D WORLD NAVIGATOR ================= */}
      {/* touch-auto: ghi Ä‘Ã¨ .custom-scrollbar{touch-action:pan-y} â€” náº¿u khÃ´ng, mobile
          KHÃ”NG vuá»‘t Ä‘Æ°á»£c sang ngang vÃ  3/5 tab náº±m ngoÃ i mÃ n hÃ¬nh khÃ´ng má»Ÿ Ä‘Æ°á»£c. */}
      <div className="w-full shrink-0 bg-gradient-to-r from-emerald-900 via-teal-950 to-amber-950 rounded-2xl p-1.5 sm:p-2 border-2 border-emerald-500/50 shadow-lg flex items-center justify-between gap-1.5 overflow-x-auto touch-auto custom-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => {
              sound.playClick();
              setGameTab('farm');
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              gameTab === 'farm'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-500/30'
            }`}
          >
            <span>ðŸŒ¾</span>
            <span>NÃ´ng Tráº¡i 2.5D (GÃ  & BÃ²)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGameTab('pvp');
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              gameTab === 'pvp'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-500/30'
            }`}
          >
            <span>âš”ï¸</span>
            <span>Äáº¥u TrÆ°á»ng PvP (Tiáº¿ng Anh)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGameTab('racing');
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              gameTab === 'racing'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-500/30'
            }`}
          >
            <span>ðŸ</span>
            <span>Äua ThÃº CÆ°ng (Tiáº¿ng Anh)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGameTab('sanctuary');
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              gameTab === 'sanctuary'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-500/30'
            }`}
          >
            <span>ðŸ¡</span>
            <span>SÃ¢n VÆ°á»n Linh Váº­t</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGameTab('social');
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              gameTab === 'social'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-500/30'
            }`}
          >
            <span>ðŸ‘¥</span>
            <span>Phá»‘ XÃ£ Há»™i & Káº¿t ÄÃ´i</span>
          </button>
        </div>

        {/* Right Info: Coins Display */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-amber-400/40 text-xs font-black text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>{userCoins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: SANCTUARY (KHU VÆ¯á»œN THÃš CÆ¯NG) ================= */}
      {gameTab === 'sanctuary' && (
        <div className="flex-1 w-full min-h-0 sm:min-h-[460px] md:min-h-0 relative flex flex-col gap-2">
          <div className="flex-1 w-full relative min-h-[200px] sm:min-h-[460px] md:min-h-0">
            {!petData && isLoading ? (
              <div className="w-full h-full min-h-[420px] rounded-3xl bg-gradient-to-b from-sky-400 via-emerald-300 to-emerald-500 border-4 border-emerald-600/30 shadow-2xl flex flex-col items-center justify-center gap-4 text-white">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-white/40 border-t-white animate-spin" />
                  <Sparkles className="w-8 h-8 text-amber-300 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-black tracking-wide drop-shadow-md">Äang má»Ÿ cá»­a khu vÆ°á»n thÃº cÆ°ng...</p>
                  <p className="text-xs text-white/80 font-medium">Chuáº©n bá»‹ khÃ´ng gian vÃ  Ä‘Ã³n thÃº cÆ°ng cá»§a báº¡n vá» nhÃ  ðŸ¡âœ¨</p>
                </div>
              </div>
            ) : (
              <PixelFarmGame
                ref={farmRef}
                species={petData?.pet_type || 'owl'}
                petName={petData?.pet_name || currentPetMeta.name}
                habitat={petData?.selected_habitat || 'emerald_garden'}
                equippedHat={petData?.equipped_hat}
                equippedOutfit={petData?.equipped_outfit}
                equippedAccessory={petData?.equipped_accessory}
                hunger={petData?.hunger || 80}
                happiness={petData?.happiness || 90}
                level={petData?.level || 1}
                exp={petData?.exp || 0}
                userCoins={userCoins}
                onPet={() => handlePet()}
                onSwitchPet={() => setShowSwitchModal(true)}
                speechText={petSpeech}
                onSpeechChange={(text) => setPetSpeech(text)}
                onStateChange={(state) => setFarmState(state)}
                isCouple={Boolean(coupleData)}
                coupleTitle={
                  coupleData?.ring_type === 'ring_diamond'
                    ? 'âœ¨ UyÃªn Æ¯Æ¡ng HoÃ ng Gia'
                    : coupleData?.ring_type === 'ring_gold'
                    ? 'ðŸŒ¹ Cáº·p ÄÃ´i Ngá»t NgÃ o'
                    : 'â¤ï¸ Cáº·p ÄÃ´i Tri Ká»·'
                }
              />
            )}
          </div>

          {/* DEDICATED ACTION TOOLBAR (SEPARATED COMPLETELY OUTSIDE MAP).

              Theo Ä‘Ãºng Ä‘áº·c táº£: thanh cÃ´ng cá»¥ CHá»ˆ cÃ³ 3 nÃºt hÃ nh Ä‘á»™ng
              (NÃ©m BÃ³ng, Gá»i BÃ©, Äi Ngá»§). Má»i thao tÃ¡c khÃ¡c vá»›i thÃº cÆ°ng Ä‘Æ°á»£c
              thá»±c hiá»‡n báº±ng cÃ¡ch cháº¡m vÃ o váº­t thá»ƒ ngay trÃªn báº£n Ä‘á»“ (â‰¥44px).

              TrÆ°á»›c Ä‘Ã¢y cÃ³ 8 nÃºt xáº¿p cáº¡nh nhau trong má»™t hÃ ng `flex-nowrap`. Äo Ä‘Æ°á»£c:
              á»Ÿ 393px, "NÃ©m BÃ³ng" náº±m á»Ÿ [537..641], "Gá»i BÃ©" [647..728],
              "Äi Ngá»§" [734..816] â€” Táº¤T Cáº¢ ngoÃ i khung nhÃ¬n; á»Ÿ iPad 768px "Gá»i BÃ©"
              káº¿t thÃºc á»Ÿ 789 vÃ  "Äi Ngá»§" á»Ÿ 881. Tá»©c lÃ  chá»©c nÄƒng chÃ­nh cá»§a trang
              khÃ´ng dÃ¹ng Ä‘Æ°á»£c trÃªn Ä‘iá»‡n thoáº¡i.

              Nay: 3 nÃºt hÃ nh Ä‘á»™ng + 1 nÃºt "ThÃªm" (má»Ÿ menu 5 má»¥c má»Ÿ modal). Äá»§ nhá» Ä‘á»ƒ
              luÃ´n vá»«a má»i khung nhÃ¬n, vÃ  khÃ´ng máº¥t chá»©c nÄƒng nÃ o.

              Má»i nÃºt â‰¥44px chiá»u cao Ä‘á»ƒ cháº¡m Ä‘Æ°á»£c báº±ng ngÃ³n tay. */}
          <div className="w-full shrink-0 rounded-2xl p-2 sm:p-2.5 border-2 border-emerald-300/70 bg-gradient-to-b from-white via-white to-emerald-50/70 shadow-[0_5px_0_rgba(5,150,105,0.18),0_14px_24px_-16px_rgba(5,150,105,0.6)] flex flex-row flex-nowrap items-center gap-2 dark:from-slate-900 dark:via-slate-900">
            {/* 3 nÃºt hÃ nh Ä‘á»™ng â€” theo Ä‘Ãºng Ä‘áº·c táº£, khÃ´ng thÃªm khÃ´ng bá»›t. */}
            <button
              onClick={() => farmRef.current?.tossBall()}
              className="px-2.5 sm:px-3 py-2 min-h-[44px] bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl border-b-[3px] border-amber-600/70 text-[12px] sm:text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-[0_3px_8px_-4px_rgba(217,119,6,0.5)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 active:shadow-none touch-manipulation"
              title="NÃ©m bÃ³ng cho thÃº cÆ°ng nháº·t"
            >
              <span aria-hidden>ðŸŽ¾</span>
              <span>NÃ©m BÃ³ng</span>
            </button>

            <button
              onClick={() => farmRef.current?.callPet()}
              className="px-2.5 sm:px-3 py-2 min-h-[44px] bg-white hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-300 border-b-[3px] border-b-slate-400/70 text-[12px] sm:text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b hover:scale-100 touch-manipulation dark:bg-slate-900 hover:dark:bg-slate-800 dark:text-slate-200 dark:border-white/10"
              title="Gá»i thÃº cÆ°ng láº¡i gáº§n báº¡n"
            >
              <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              <span>Gá»i BÃ©</span>
            </button>

            <button
              onClick={() => {
                const next = farmRef.current?.toggleSleep();
                if (next !== undefined) {
                  setFarmState((prev) => ({ ...prev, isSleeping: next }));
                }
              }}
              className={`px-2.5 sm:px-3 py-2 min-h-[44px] text-[12px] sm:text-xs font-black rounded-2xl border-b-[3px] transition cursor-pointer flex items-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 ${
                farmState.isSleeping
                  ? 'bg-sky-500 text-white border-sky-400 ring-2 ring-sky-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 dark:bg-white dark:text-slate-900 dark:border-white/10'
              }`}
              title="Cho thÃº cÆ°ng chá»£p máº¯t hoáº·c Ä‘Ã¡nh thá»©c"
            >
              <span aria-hidden>ðŸ’¤</span>
              <span>{farmState.isSleeping ? 'Thá»©c Dáº­y' : 'Äi Ngá»§'}</span>
            </button>

            {/* Menu "ThÃªm": gom cÃ¡c nÃºt chá»‰ má»Ÿ modal Ä‘á»ƒ thanh cÃ´ng cá»¥ vá»«a khung. */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowMoreMenu((v) => !v);
                }}
                aria-expanded={showMoreMenu}
                aria-haspopup="menu"
                title="ThÃªm chá»©c nÄƒng"
                className="px-2.5 sm:px-3 py-2 min-h-[44px] min-w-[44px] rounded-2xl border border-slate-300 border-b-[3px] border-b-slate-400 bg-white hover:bg-slate-100 text-slate-800 text-[12px] sm:text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b touch-manipulation dark:bg-slate-900 hover:dark:bg-slate-800 dark:text-slate-200 dark:border-white/10"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">ThÃªm</span>
              </button>

              {showMoreMenu && (
                <>
                  {/* Lá»›p phá»§ Ä‘Ã³ng menu khi cháº¡m ra ngoÃ i. */}
                  <button
                    type="button"
                    aria-label="ÄÃ³ng menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900"
                  >
                    <MoreItem
                      icon={<Utensils className="w-4 h-4 text-emerald-600" />}
                      label="Cho Ä‚n"
                      hint="Thá»±c Ä‘Æ¡n bá»• dÆ°á»¡ng"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowFeedModal(true);
                      }}
                    />
                    <MoreItem
                      icon={<ShoppingBag className="w-4 h-4 text-amber-600" />}
                      label="Cá»­a HÃ ng & Thá»­ Äá»“"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleOpenShop('shop');
                      }}
                    />
                    <MoreItem
                      icon={<Shirt className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />}
                      label="Tá»§ Äá»“"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleOpenShop('wardrobe');
                      }}
                    />
                    <MoreItem
                      icon={<Trees className="w-4 h-4 text-teal-600" />}
                      label="Cáº£nh Quan"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowHabitatModal(true);
                      }}
                    />
                    <MoreItem
                      icon={<RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                      label="Äá»•i BÃ©"
                      hint="NuÃ´i linh váº­t khÃ¡c"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowSwitchModal(true);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FARM & LIVESTOCK (CANVAS 2D) ================= */}
      {gameTab === 'farm' && (
        <div className="w-full flex-1 min-h-0">
          <PixelFarmCanvas
            userCoins={userCoins}
            onUpdateCoins={(c) => {
              setUserCoins(c);
              const s = getStoredUser();
              if (s) setStoredUser({ ...s, coins: c });
              window.dispatchEvent(new Event('auth-state-changed'));
            }}
            onUpdatePetExp={(exp) => {
              setPetData((prev: any) =>
                prev
                  ? {
                      ...prev,
                      exp: (prev.exp || 0) + exp,
                      level: Math.floor(((prev.exp || 0) + exp) / 50) + 1,
                    }
                  : prev
              );
            }}
            userId={currentUser?.id}
            playerSpecies={petData?.pet_type || 'owl'}
            playerPetName={petData?.pet_name || currentPetMeta.name}
          />
        </div>
      )}

      {/* ================= TAB 3: PVP COMBAT ARENA (CANVAS 2D) ================= */}
      {gameTab === 'pvp' && (
        <div className="w-full flex-1 min-h-0">
          <PetPvPArenaCanvas
            playerSpecies={petData?.pet_type || 'owl'}
            playerPetName={petData?.pet_name || currentPetMeta.name}
            playerLevel={petData?.level || 1}
            userCoins={userCoins}
            onUpdateCoins={(c) => {
              setUserCoins(c);
              const s = getStoredUser();
              if (s) setStoredUser({ ...s, coins: c });
              window.dispatchEvent(new Event('auth-state-changed'));
            }}
            onUpdatePetExp={(exp) => {
              setPetData((prev: any) =>
                prev
                  ? {
                      ...prev,
                      exp: (prev.exp || 0) + exp,
                      level: Math.floor(((prev.exp || 0) + exp) / 50) + 1,
                    }
                  : prev
              );
            }}
            userId={currentUser?.id}
            userDisplayName={currentUser?.display_name || currentUser?.username || 'Báº¡n'}
            activeRooms={activeRooms}
            acceptedFriends={acceptedFriends}
            onRefreshData={loadPetData}
          />
        </div>
      )}

      {/* ================= TAB 4: PET RACING DERBY (CANVAS 2D) ================= */}
      {gameTab === 'racing' && (
        <div className="w-full flex-1 min-h-0">
          <PetRacingCanvas
            playerSpecies={petData?.pet_type || 'owl'}
            playerPetName={petData?.pet_name || currentPetMeta.name}
            playerLevel={petData?.level || 1}
            userCoins={userCoins}
            onUpdateCoins={(c) => {
              setUserCoins(c);
              const s = getStoredUser();
              if (s) setStoredUser({ ...s, coins: c });
              window.dispatchEvent(new Event('auth-state-changed'));
            }}
            onUpdatePetExp={(exp) => {
              setPetData((prev: any) =>
                prev
                  ? {
                      ...prev,
                      exp: (prev.exp || 0) + exp,
                      level: Math.floor(((prev.exp || 0) + exp) / 50) + 1,
                    }
                  : prev
              );
            }}
            userId={currentUser?.id}
            userDisplayName={currentUser?.display_name || currentUser?.username || 'Báº¡n'}
            activeRooms={activeRooms}
            acceptedFriends={acceptedFriends}
            communityUsers={communityUsers}
            onRefreshData={loadPetData}
          />
        </div>
      )}

      {/* ================= TAB 5: SOCIAL HUB & COUPLE ================= */}
      {gameTab === 'social' && (
        <div className="w-full flex-1 min-h-0">
          <PetSocialHub
            currentUserId={currentUser?.id}
            currentUsername={currentUser?.username}
            currentDisplayName={currentUser?.display_name}
            playerSpecies={petData?.pet_type || 'owl'}
            playerPetName={petData?.pet_name || currentPetMeta.name}
            userCoins={userCoins}
            onUpdateCoins={(c) => {
              setUserCoins(c);
              const s = getStoredUser();
              if (s) setStoredUser({ ...s, coins: c });
              window.dispatchEvent(new Event('auth-state-changed'));
            }}
            onSendSpeech={(text) => setPetSpeech(text)}
            initialFriends={acceptedFriends}
            initialIncomingRequests={incomingFriendRequests}
            initialOutgoingFriendIds={outgoingFriendIds}
            initialCommunityUsers={communityUsers}
            coupleData={coupleData}
            incomingProposal={incomingProposal}
            recentChatList={recentChat}
            onVisitFriendFarm={(f) => {
              sound.playCelebration();
              setPetSpeech(`Äang ghÃ© thÄƒm nÃ´ng tráº¡i cá»§a ${f.displayName || f.display_name}! ThÃº cÆ°ng Ä‘Ã¡ng yÃªu quÃ¡! ðŸ¡ðŸ’–`);
              setGameTab('farm');
            }}
            onChallengeFriend={() => {
              sound.playPop();
              setGameTab('pvp');
            }}
          />
        </div>
      )}

      {/* ================= MODAL 1: SHOP & FITTING ROOM (PhÃ²ng Thá»­ Äá»“ & Mua Sáº¯m) ================= */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-[96vw] max-w-4xl h-[92vh] sm:h-[84vh] max-h-[660px] min-h-[420px] flex flex-col shadow-2xl border-2 sm:border-4 border-emerald-500 overflow-hidden dark:bg-slate-900">
            {/* Modal Header */}
            <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">ðŸ›ï¸</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-black leading-tight truncate">
                    Cá»­a HÃ ng & PhÃ²ng Thá»­ Äá»“
                  </h3>
                  <p className="text-[12px] text-emerald-100 font-medium truncate hidden xs:block">
                    Chá»n mÃ³n Ä‘á»“ báº¥t ká»³ Ä‘á»ƒ bÃ© máº·c thá»­ ngay láº­p tá»©c!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1 sm:gap-1.5 bg-black/25 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/20 text-xs font-black text-amber-300">
                  <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300" />
                  <span>{userCoins.toLocaleString()}</span>
                  <span className="hidden sm:inline">Coins</span>
                </div>
                <button
                  onClick={() => setShowShopModal(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer ml-1"
                  title="ÄÃ³ng cá»­a sá»•"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs (Shop vs Wardrobe) & Subcategory Filters */}
            <div className="px-2.5 sm:px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0 dark:bg-slate-800 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    sound.playClick();
                    setShopMode('shop');
                  }}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    shopMode === 'shop'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-white/10 hover:dark:bg-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Mua Sáº¯m
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShopMode('wardrobe');
                  }}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    shopMode === 'wardrobe'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-white/10 hover:dark:bg-slate-900'
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5" /> Tá»§ Äá»“ Cá»§a TÃ´i
                </button>
              </div>

              {/* Sub-Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto touch-auto text-xs font-bold py-0.5 custom-scrollbar">
                {[
                  { id: 'all', label: 'Táº¥t Cáº£' },
                  { id: 'hat', label: 'ðŸŽ“ NÃ³n & MÅ©' },
                  { id: 'outfit', label: 'ðŸ‘• Trang Phá»¥c' },
                  { id: 'accessory', label: 'ðŸ‘“ Phá»¥ Kiá»‡n' },
                  { id: 'food', label: 'ðŸ Thá»©c Ä‚n' },
                  { id: 'decor', label: 'ðŸŒ³ Trang TrÃ­' },
                  { id: 'habitat', label: 'ðŸ¡ Cáº£nh Quan' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playClick();
                      setShopCategory(cat.id);
                    }}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[12px] font-black transition cursor-pointer shrink-0 ${
                      shopCategory === cat.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 hover:dark:bg-slate-700 dark:border-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MOBILE ONLY (< md): Sticky Mini-Fitting Stage on Top */}
            <div className="md:hidden w-full bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-200 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 dark:border-emerald-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-14 h-14 rounded-full bg-emerald-200/70 border border-emerald-400 flex items-center justify-center overflow-hidden shrink-0">
                  <PixelPetSprite
                    species={petData?.pet_type || 'owl'}
                    animationState="idle"
                    facing="right"
                    scale={0.525}
                    equippedHat={previewHat}
                    equippedOutfit={previewOutfit}
                    equippedAccessory={previewAccessory}
                  />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[9px] font-black text-emerald-800 uppercase tracking-wider dark:text-emerald-200">Äang xem thá»­</div>
                  <div className="text-[12px] font-black text-slate-800 max-w-[130px] leading-tight dark:text-slate-200">
                    {previewHatObj?.name || previewOutfitObj?.name || previewAccessoryObj?.name || 'Äá»“ máº·c Ä‘á»‹nh'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleRevertPreview}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[12px] font-bold shadow-xs cursor-pointer active:scale-95 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300"
                  title="KhÃ´i phá»¥c"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={handleApplyPreview}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-black shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Máº·c lÃªn bÃ©"
                >
                  <Check className="w-3 h-3" /> Máº·c BÃ©
                </button>
              </div>
            </div>

            {/* Modal Body: Split View (Left: Live Fitting Room, Right: Catalog Grid) */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
              {/* ================= DESKTOP LEFT: LIVE FITTING ROOM PREVIEW STAGE ================= */}
              <div className="hidden md:flex md:w-68 lg:w-76 shrink-0 bg-gradient-to-b from-emerald-50/90 via-teal-50/50 to-slate-50 p-3.5 border-r border-slate-200 flex-col justify-between items-center text-center overflow-hidden dark:from-emerald-950 dark:via-teal-950 dark:to-slate-900 dark:border-white/10">
                <div className="w-full">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[12px] font-black uppercase tracking-wider mb-1 dark:bg-emerald-950 dark:text-emerald-200">
                    <span>ðŸªž</span> PhÃ²ng Thá»­ Äá»“ Trá»±c Tiáº¿p
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                    {petData?.pet_name || currentPetMeta.name}
                  </h4>
                  <p className="text-[12px] text-slate-500 font-medium dark:text-slate-400">
                    Nháº¥p vÃ o mÃ³n Ä‘á»“ bÃªn pháº£i Ä‘á»ƒ bÃ© máº·c thá»­ ngay!
                  </p>
                </div>

                {/* Pedestal Stage with Pixel Pet Sprite (Scale 2.1x for compact crispness) */}
                <div className="relative my-2 flex flex-col items-center justify-center">
                  <div className="w-28 h-28 bg-emerald-400/25 rounded-full blur-xl absolute pointer-events-none" />
                  <div className="w-36 h-9 bg-[#059669]/25 border-2 border-[#10b981]/50 rounded-full absolute -bottom-1 blur-xs pointer-events-none" />
                  <div className="relative z-10 py-1 transform hover:scale-105 transition-transform">
                    <PixelPetSprite
                      species={petData?.pet_type || 'owl'}
                      animationState="idle"
                      facing="right"
                      scale={1.47}
                      equippedHat={previewHat}
                      equippedOutfit={previewOutfit}
                      equippedAccessory={previewAccessory}
                    />
                  </div>
                </div>

                {/* Current Preview Status Chips - Compact Layout */}
                <div className="w-full space-y-1 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 text-xs shadow-xs text-left dark:bg-slate-900/90 dark:border-white/10">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400">ðŸŽ“ NÃ³n:</span>
                    <span className="font-black text-slate-800 max-w-[110px] leading-tight dark:text-slate-200">
                      {previewHatObj ? previewHatObj.name : 'KhÃ´ng Ä‘á»™i'}
                    </span>
                    {previewHat && (
                      <button
                        onClick={() => handleUnequip('hat')}
                        className="text-[9px] text-rose-500 hover:text-rose-700 font-black cursor-pointer hover:dark:text-rose-300"
                      >
                        âœ• ThÃ¡o
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400">ðŸ‘• Ão:</span>
                    <span className="font-black text-slate-800 max-w-[110px] leading-tight dark:text-slate-200">
                      {previewOutfitObj ? previewOutfitObj.name : 'KhÃ´ng máº·c'}
                    </span>
                    {previewOutfit && (
                      <button
                        onClick={() => handleUnequip('outfit')}
                        className="text-[9px] text-rose-500 hover:text-rose-700 font-black cursor-pointer hover:dark:text-rose-300"
                      >
                        âœ• ThÃ¡o
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400">ðŸ‘“ Phá»¥ kiá»‡n:</span>
                    <span className="font-black text-slate-800 max-w-[110px] leading-tight dark:text-slate-200">
                      {previewAccessoryObj ? previewAccessoryObj.name : 'KhÃ´ng Ä‘eo'}
                    </span>
                    {previewAccessory && (
                      <button
                        onClick={() => handleUnequip('accessory')}
                        className="text-[9px] text-rose-500 hover:text-rose-700 font-black cursor-pointer hover:dark:text-rose-300"
                      >
                        âœ• ThÃ¡o
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-1.5 pt-2">
                  <button
                    onClick={handleRevertPreview}
                    className="btn-3d btn-3d-white py-1.5 text-xs font-black text-slate-700 cursor-pointer flex items-center justify-center gap-1 shadow-xs dark:text-slate-300"
                    title="KhÃ´i phá»¥c trang phá»¥c ban Ä‘áº§u cá»§a bÃ©"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> KhÃ´i Phá»¥c
                  </button>

                  <button
                    onClick={handleApplyPreview}
                    className="btn-3d btn-3d-emerald py-1.5 text-xs font-black text-white cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    title="LÆ°u trang phá»¥c Ä‘ang thá»­ lÃªn ngÆ°á»i bÃ©"
                  >
                    <Check className="w-3.5 h-3.5" /> Máº·c LÃªn BÃ©
                  </button>
                </div>
              </div>

              {/* ================= RIGHT: CATALOG ITEM GRID ================= */}
              <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto min-w-0 bg-slate-50/50 dark:bg-slate-900/50">
                {filteredItems.length === 0 ? (
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="text-4xl animate-bounce">ðŸŽ’</div>
                    <div>
                      <h5 className="font-black text-sm text-slate-800 dark:text-slate-200">
                        {shopMode === 'wardrobe' ? 'Tá»§ Ä‘á»“ má»¥c nÃ y Ä‘ang trá»‘ng' : 'KhÃ´ng cÃ³ váº­t pháº©m phÃ¹ há»£p'}
                      </h5>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 dark:text-slate-400">
                        {shopMode === 'wardrobe'
                          ? 'BÃ© chÆ°a cÃ³ mÃ³n Ä‘á»“ nÃ o trong má»¥c nÃ y. HÃ£y ghÃ© tab Mua Sáº¯m Má»›i Ä‘á»ƒ sáº¯m sá»­a nhÃ©!'
                          : 'HÃ£y chá»n má»¥c khÃ¡c trong thanh danh má»¥c á»Ÿ trÃªn nhÃ©!'}
                      </p>
                    </div>
                    {shopMode === 'wardrobe' && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setShopMode('shop');
                        }}
                        className="btn-3d btn-3d-emerald px-4 py-1.5 text-xs font-black text-white cursor-pointer shadow-xs"
                      >
                        ðŸ›ï¸ Äáº¿n Cá»­a HÃ ng Sáº¯m Äá»“
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {filteredItems.map((item) => {
                      const isOwned = ownedItemIds.has(item.id) || item.price === 0;
                      const isPreviewing =
                        previewHat === item.id ||
                        previewOutfit === item.id ||
                        previewAccessory === item.id;
                      const isActuallyEquipped =
                        petData?.equipped_hat === item.id ||
                        petData?.equipped_outfit === item.id ||
                        petData?.equipped_accessory === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleTogglePreview(item)}
                          className={`p-2.5 sm:p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 relative ${
                            isPreviewing
                              ? 'border-amber-400 bg-amber-50/70 shadow-md ring-2 ring-amber-300'
                              : isActuallyEquipped
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                              : isOwned
                              ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-white/10 dark:bg-slate-900 hover:dark:border-white/10'
                              : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs dark:border-white/10 dark:bg-slate-900 hover:dark:border-emerald-800'
                          }`}
                        >
                          {/* Status Badges */}
                          <div className="flex items-center justify-between">
                            <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                            <div className="flex flex-col items-end gap-0.5">
                              {isPreviewing && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                                  ðŸ‘€ THá»¬
                                </span>
                              )}
                              {isActuallyEquipped && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-600 text-white shadow-xs">
                                  âœ¨ Máº¶C
                                </span>
                              )}
                              {isOwned && !isActuallyEquipped && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                                  âœ“ ÄÃ£ cÃ³
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-0.5">
                            <h5 className="font-black text-xs sm:text-sm text-slate-900 leading-tight line-clamp-1 dark:text-slate-100">
                              {item.name}
                            </h5>
                            <p className="text-[12px] text-slate-500 font-medium line-clamp-1 dark:text-slate-400">
                              {item.description}
                            </p>
                            {item.benefit && (
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded inline-block dark:text-emerald-300 dark:bg-emerald-950">
                                {item.benefit}
                              </span>
                            )}
                            {item.type === 'food' && (
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                {item.hungerBoost && (
                                  <span className="text-[8.5px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800">
                                    +{item.hungerBoost}% No
                                  </span>
                                )}
                                {item.happinessBoost && (
                                  <span className="text-[8.5px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200 dark:text-rose-300 dark:bg-rose-950 dark:border-rose-800">
                                    +{item.happinessBoost}% Vui
                                  </span>
                                )}
                                {item.energyBoost && (
                                  <span className="text-[8.5px] font-bold text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-200 dark:text-sky-300 dark:bg-sky-950 dark:border-sky-800">
                                    +{item.energyBoost}% Pin
                                  </span>
                                )}
                                {item.expBoost && (
                                  <span className="text-[8.5px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 dark:text-purple-300 dark:bg-purple-950 dark:border-purple-800">
                                    +{item.expBoost} EXP
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-0.5">
                            {item.type === 'food' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFeed(item);
                                }}
                                className={`w-full py-1 text-[12px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                  isOwned
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                    : userCoins >= item.price
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {isOwned ? (
                                  <span>ðŸ½ï¸ Cho Ä‚n (Kho: x{inventory.find(i => i.item_id === item.id)?.quantity || 1})</span>
                                ) : (
                                  <span>
                                    ðŸª™ {item.price} xu (Ä‚n Ngay)
                                    {userCoins < item.price && (
                                      <span className="text-[9px] font-bold text-amber-700 ml-1 opacity-80 dark:text-amber-300">
                                        (Thiáº¿u {item.price - userCoins})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </button>
                            ) : item.type === 'decor' ? (
                              isOwned ? (
                                <div className="w-full py-1 text-[12px] font-black rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-center dark:bg-slate-800 dark:text-slate-400 dark:border-white/10">
                                  âœ“ ÄÃ£ CÃ³ Trong Kho
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(item);
                                  }}
                                  className={`w-full py-1 text-[12px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                    userCoins >= item.price
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  <span>ðŸª™</span> {item.price} xu
                                  {userCoins < item.price && (
                                    <span className="text-[9px] font-bold text-amber-700 ml-0.5 opacity-85 dark:text-amber-300">
                                      (Thiáº¿u {item.price - userCoins})
                                    </span>
                                  )}
                                </button>
                              )
                            ) : item.type === 'habitat' ? (
                              isOwned ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChangeHabitat(item.id);
                                  }}
                                  className={`w-full py-1 text-[12px] font-black rounded-xl border transition cursor-pointer shadow-xs active:scale-95 ${
                                    petData?.selected_habitat === item.id
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                                  }`}
                                >
                                  {petData?.selected_habitat === item.id ? 'âœ“ Äang DÃ¹ng' : 'Ãp Dá»¥ng'}
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(item);
                                  }}
                                  className={`w-full py-1 text-[12px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                    userCoins >= item.price
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  <span>ðŸª™</span> {item.price} xu
                                  {userCoins < item.price && (
                                    <span className="text-[9px] font-bold text-amber-700 ml-0.5 opacity-85 dark:text-amber-300">
                                      (Thiáº¿u {item.price - userCoins})
                                    </span>
                                  )}
                                </button>
                              )
                            ) : isOwned ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEquip(item);
                                }}
                                className={`w-full py-1 text-[12px] font-black rounded-xl border transition cursor-pointer shadow-xs active:scale-95 ${
                                  isActuallyEquipped
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 hover:dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                                }`}
                              >
                                {isActuallyEquipped ? 'ThÃ¡o Ra' : 'Máº·c Ngay'}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(item);
                                }}
                                className={`w-full py-1 text-[12px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                  userCoins >= item.price
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                <span>ðŸª™</span> {item.price} xu
                                {userCoins < item.price && (
                                  <span className="text-[9px] font-bold text-amber-700 ml-0.5 opacity-85 dark:text-amber-300">
                                    (Thiáº¿u {item.price - userCoins})
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: FEED TREATS (Thá»±c ÄÆ¡n Cho Ä‚n) ================= */}
      {showFeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border-4 border-amber-400 space-y-3 sm:space-y-4 max-h-[88vh] flex flex-col dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">ðŸœ</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight dark:text-slate-100">Thá»±c ÄÆ¡n Tháº§n Ká»³ Cho ThÃº CÆ°ng</h3>
                  <p className="text-[12px] text-slate-500 font-medium dark:text-slate-400">Bá»• sung nÄƒng lÆ°á»£ng, chá»‰ sá»‘ Háº¡nh phÃºc vÃ  kinh nghiá»‡m EXP!</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedModal(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {foodItems.map((food) => {
                const invItem = inventory.find((i) => i.item_id === food.id);
                const hasInStock = (invItem?.quantity || 0) > 0;
                return (
                  <button
                    key={food.id}
                    onClick={() => handleFeed(food)}
                    className="p-3 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-left transition cursor-pointer flex items-center gap-3 group relative shadow-xs dark:border-white/10 dark:bg-slate-900"
                  >
                    <span className="text-3xl shrink-0 group-hover:scale-115 transition-transform">{food.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs font-black text-slate-900 truncate dark:text-slate-100">{food.name}</div>
                        {hasInStock ? (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 shrink-0 dark:bg-emerald-950 dark:text-emerald-200">
                            Kho: x{invItem.quantity}
                          </span>
                        ) : (
                          <span className="text-[12px] font-black text-amber-600 shrink-0 dark:text-amber-300">
                            ðŸª™ {food.price}
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-slate-500 line-clamp-1 mt-0.5 dark:text-slate-400">{food.description}</div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {food.hungerBoost && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800">
                            +{food.hungerBoost}% No
                          </span>
                        )}
                        {food.happinessBoost && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200 dark:text-rose-300 dark:bg-rose-950 dark:border-rose-800">
                            +{food.happinessBoost}% Vui
                          </span>
                        )}
                        {food.energyBoost && (
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-200 dark:text-sky-300 dark:bg-sky-950 dark:border-sky-800">
                            +{food.energyBoost}% Pin
                          </span>
                        )}
                        {food.expBoost && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 dark:text-purple-300 dark:bg-purple-950 dark:border-purple-800">
                            +{food.expBoost} EXP
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: HABITAT SWITCHER (Äá»•i Cáº£nh Quan SÃ¢n VÆ°á»n) ================= */}
      {showHabitatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-4 border-emerald-500 overflow-hidden dark:bg-slate-900">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">ðŸ¡</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">Chá»n Cáº£nh Quan Tháº¿ Giá»›i ThÃº CÆ°ng</h3>
                  <p className="text-[12px] text-emerald-100 font-medium">Bao gá»“m 5 Cáº£nh quan Anime huyá»n thoáº¡i & 4 Cáº£nh quan kinh Ä‘iá»ƒn!</p>
                </div>
              </div>
              <button
                onClick={() => setShowHabitatModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* SECTION 1: Cáº¢NH QUAN ANIME & HUYá»€N THOáº I */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg">âœ¨</span>
                  <h4 className="text-xs sm:text-sm font-black text-indigo-700 uppercase tracking-wider dark:text-indigo-300">
                    Cáº£nh Quan Anime & Ká»³ áº¢o Má»›i (One Piece, Naruto, Hogwarts, Doraemon, Kirby)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'thousand_sunny',
                      name: 'Boong TÃ u Háº£i Táº·c Sunny',
                      emoji: 'ðŸ´â€â˜ ï¸',
                      badge: 'One Piece',
                      desc: 'Äáº§u sÆ° tá»­ Sunny ráº¡ng rá»¡, cá»™t buá»“m hiÃªn ngang, rÆ°Æ¡ng vÃ ng chÃ¢u bÃ¡u vÃ  Ä‘áº¡i dÆ°Æ¡ng bao la.',
                    },
                    {
                      id: 'konoha_valley',
                      name: 'Thung LÅ©ng Nháº«n Giáº£ LÃ ng LÃ¡',
                      emoji: 'ðŸƒ',
                      badge: 'Naruto',
                      desc: 'VÃ¡ch Ä‘Ã¡ tÆ°á»£ng 4 Hokage, suá»‘i nÆ°á»›c nÃ³ng Onsen, quÃ¡n mÃ¬ Ichiraku vÃ  rá»«ng trÃºc thanh tá»‹nh.',
                    },
                    {
                      id: 'hogwarts_hall',
                      name: 'Äáº¡i Sáº£nh ÄÆ°á»ng Hogwarts',
                      emoji: 'âš¡',
                      badge: 'Harry Potter',
                      desc: 'HÃ ng trÄƒm ngá»n náº¿n bay lÆ¡ lá»­ng, lÃ² sÆ°á»Ÿi Floo xanh ngá»c, bÃ n tiá»‡c vÃ  NÃ³n PhÃ¢n Loáº¡i ká»³ diá»‡u.',
                    },
                    {
                      id: 'doraemon_field',
                      name: 'BÃ£i Äáº¥t Trá»‘ng Doraemon',
                      emoji: 'ðŸ””',
                      badge: 'Doraemon',
                      desc: '3 á»‘ng cá»‘ng bÃª tÃ´ng trÃ²n kinh Ä‘iá»ƒn, CÃ¡nh Cá»­a Tháº§n Ká»³, hÃ ng rÃ o gá»— tuá»•i thÆ¡ vÃ  bÃ¡nh rÃ¡n Dorayaki.',
                    },
                    {
                      id: 'dream_land',
                      name: 'VÆ°Æ¡ng Quá»‘c Giáº¥c MÆ¡ Kirby',
                      emoji: 'â­',
                      badge: 'Kirby Dream Land',
                      desc: 'CÃ¢y káº¹o mÃºt khá»•ng lá»“ báº£y sáº¯c, NgÃ´i Sao VÃ ng Warp Star, suá»‘i cáº§u vá»“ng vÃ  TrÆ°á»£ng Sao may máº¯n.',
                    },
                  ].map((hab) => {
                    const isSelected = petData?.selected_habitat === hab.id;
                    const isOwned =
                      hab.id === 'emerald_garden' ||
                      inventory?.some((item: any) => item.item_id === hab.id) ||
                      petData?.inventory?.some((item: any) => item.item_id === hab.id);

                    return (
                      <button
                        key={hab.id}
                        onClick={() => {
                          if (!isOwned) {
                            sound.playError();
                            if (confirm(`Báº¡n chÆ°a má»Ÿ khoÃ¡ cáº£nh quan "${hab.name}"! Báº¡n cÃ³ muá»‘n má»Ÿ Cá»­a HÃ ng Ä‘á»ƒ mua ngay khÃ´ng?`)) {
                              setShowHabitatModal(false);
                              handleOpenShop('shop');
                              setShopCategory('habitat');
                            }
                            return;
                          }
                          handleChangeHabitat(hab.id);
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between relative group hover:scale-102 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-300 dark:bg-indigo-950'
                            : isOwned
                            ? 'border-slate-200 hover:border-indigo-300 bg-white dark:border-white/10 hover:dark:border-indigo-800 dark:bg-slate-900'
                            : 'border-slate-200 bg-slate-50 opacity-85 dark:border-white/10 dark:bg-slate-900'
                        }`}
                      >
                        {!isOwned && (
                          <div className="absolute top-3 right-3 text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">{hab.emoji}</span>
                            <span className="text-[12px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {hab.badge}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[12px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                              ÄANG CHá»ŒN
                            </span>
                          )}
                          {!isOwned && (
                            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              CHÆ¯A Má»ž
                            </span>
                          )}
                        </div>
                        <div className={`font-black text-xs ${!isOwned ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{hab.name}</div>
                        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed dark:text-slate-400">{hab.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Cáº¢NH QUAN KINH ÄIá»‚N */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg">ðŸŒ¿</span>
                  <h4 className="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wider dark:text-emerald-300">
                    Cáº£nh Quan Kinh Äiá»ƒn & CÃ´ng Nghá»‡
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'emerald_garden', name: 'VÆ°á»n NÃ´ng Tráº¡i Xanh', emoji: 'ðŸŒ¿', desc: 'Cá»‘i xay giÃ³ HÃ  Lan, cÃ¢y Ä‘áº¡i thá»¥ hÃ¡i tÃ¡o, Ä‘áº§m sen cÃ¡ Koi lá»™i vÃ  náº¥m nhÃºn ma thuáº­t.' },
                    { id: 'cozy_den', name: 'CÄƒn PhÃ²ng IT Dev', emoji: 'ðŸ–¥ï¸', desc: 'BÃ n dual monitor gÃµ code fix bug, tá»§ Server 42U, Ä‘á»‡m lÆ°á»i Beanbag vÃ  quáº§y Espresso.' },
                    { id: 'sunset_beach', name: 'BÃ£i Biá»ƒn Nhiá»‡t Äá»›i', emoji: 'ðŸ–ï¸', desc: 'Bá» cÃ¡t vÃ ng hoÃ ng hÃ´n, sÃ³ng biá»ƒn dáº¡t dÃ o, cÃ¢y dá»«a cong vÃºt vÃ  lá»­a tráº¡i bÃ£i biá»ƒn.' },
                    { id: 'sky_castle', name: 'LÃ¢u ÄÃ i MÃ¢y Huyá»n áº¢o', emoji: 'ðŸ°', desc: 'Cung Ä‘iá»‡n pha lÃª bá»“ng bá»nh, cáº§u vá»“ng 7 mÃ u, Ä‘Ã i phun nÆ°á»›c thiÃªn tháº§n vÃ  rÆ°Æ¡ng ngá»c bÃ¡u.' },
                  ].map((hab) => {
                    const isSelected = petData?.selected_habitat === hab.id;
                    const isOwned =
                      hab.id === 'emerald_garden' ||
                      inventory?.some((item: any) => item.item_id === hab.id) ||
                      petData?.inventory?.some((item: any) => item.item_id === hab.id);

                    return (
                      <button
                        key={hab.id}
                        onClick={() => {
                          if (!isOwned) {
                            sound.playError();
                            if (confirm(`Báº¡n chÆ°a má»Ÿ khoÃ¡ cáº£nh quan "${hab.name}"! Báº¡n cÃ³ muá»‘n má»Ÿ Cá»­a HÃ ng Ä‘á»ƒ mua ngay khÃ´ng?`)) {
                              setShowHabitatModal(false);
                              handleOpenShop('shop');
                              setShopCategory('habitat');
                            }
                            return;
                          }
                          handleChangeHabitat(hab.id);
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between relative group hover:scale-102 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 shadow-md ring-2 ring-emerald-300 dark:bg-emerald-950'
                            : isOwned
                            ? 'border-slate-200 hover:border-emerald-300 bg-white dark:border-white/10 hover:dark:border-emerald-800 dark:bg-slate-900'
                            : 'border-slate-200 bg-slate-50 opacity-85 dark:border-white/10 dark:bg-slate-900'
                        }`}
                      >
                        {!isOwned && (
                          <div className="absolute top-3 right-3 text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-3xl">{hab.emoji}</span>
                          {isSelected && (
                            <span className="text-[12px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                              ÄANG CHá»ŒN
                            </span>
                          )}
                          {!isOwned && (
                            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              CHÆ¯A Má»ž
                            </span>
                          )}
                        </div>
                        <div className={`font-black text-xs ${!isOwned ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{hab.name}</div>
                        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed dark:text-slate-400">{hab.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: SWITCH MASCOT SPECIES (Äá»•i ThÃº CÆ°ng) ================= */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-emerald-500 overflow-hidden dark:bg-slate-900">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">ðŸ¾</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">Chá»n Báº¡n Äá»“ng HÃ nh NuÃ´i DÆ°á»¡ng</h3>
                  <p className="text-[12px] text-emerald-100 font-medium">Bao gá»“m 27 siÃªu thÃº cÆ°ng Anime, Manga & Linh váº­t tri thá»©c Ä‘á»‰nh cao!</p>
                </div>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Universe Filter Tabs */}
            <div className="px-3 sm:px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0 dark:bg-slate-800 dark:border-white/10">
              {[
                { id: 'all', label: 'Táº¥t Cáº£ (27)', emoji: 'âœ¨' },
                { id: 'one_piece', label: 'One Piece (3)', emoji: 'ðŸ´â€â˜ ï¸' },
                { id: 'naruto', label: 'Naruto (3)', emoji: 'ðŸ¥' },
                { id: 'harry_potter', label: 'Harry Potter (3)', emoji: 'âš¡' },
                { id: 'avengers', label: 'Avengers (3)', emoji: 'ðŸ›¡ï¸' },
                { id: 'doraemon_kirby', label: 'Doraemon & Kirby (3)', emoji: 'ðŸŒŸ' },
                { id: 'sanrio', label: 'Sanrio (6)', emoji: 'ðŸŽ€' },
                { id: 'classic', label: 'Tri Thá»©c (6)', emoji: 'ðŸ¦‰' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick();
                    setSwitchPetCategory(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 flex items-center gap-1 ${
                    switchPetCategory === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 hover:dark:bg-slate-700/80 dark:border-white/10'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Body with Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {[
                {
                  key: 'one_piece',
                  title: 'Äáº¡i Háº£i TrÃ¬nh One Piece',
                  emoji: 'ðŸ´â€â˜ ï¸',
                  headerBg: 'text-amber-800 bg-amber-100 dark:text-amber-200 dark:bg-amber-950',
                  badgeBg: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950',
                  activeBorder: 'border-amber-500 bg-amber-50 ring-2 ring-amber-300 dark:bg-amber-950',
                  petIds: ['chopper', 'karoo', 'bepo'],
                },
                {
                  key: 'naruto',
                  title: 'Tháº¿ Giá»›i Nháº«n Giáº£ Naruto',
                  emoji: 'ðŸ¥',
                  headerBg: 'text-orange-800 bg-orange-100 dark:text-orange-200 dark:bg-orange-950',
                  badgeBg: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950',
                  activeBorder: 'border-orange-500 bg-orange-50 ring-2 ring-orange-300 dark:bg-orange-950',
                  petIds: ['kurama', 'pakkun', 'gamakichi'],
                },
                {
                  key: 'harry_potter',
                  title: 'PhÃ©p Thuáº­t Hogwarts Harry Potter',
                  emoji: 'âš¡',
                  headerBg: 'text-indigo-800 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-950',
                  badgeBg: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950',
                  activeBorder: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300 dark:bg-indigo-950',
                  petIds: ['hedwig', 'crookshanks', 'fawkes'],
                },
                {
                  key: 'avengers',
                  title: 'VÅ© Trá»¥ SiÃªu Anh HÃ¹ng Avengers',
                  emoji: 'ðŸ›¡ï¸',
                  headerBg: 'text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-950',
                  badgeBg: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950',
                  activeBorder: 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950',
                  petIds: ['goose', 'rocket', 'alligator_loki'],
                },
                {
                  key: 'doraemon_kirby',
                  title: 'Tháº¿ Ká»· 22 Doraemon & Dream Land Kirby',
                  emoji: 'ðŸŒŸ',
                  headerBg: 'text-sky-800 bg-sky-100 dark:text-sky-200 dark:bg-sky-950',
                  badgeBg: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950',
                  activeBorder: 'border-sky-500 bg-sky-50 ring-2 ring-sky-300 dark:bg-sky-950',
                  petIds: ['doraemon', 'dorami', 'kirby'],
                },
                {
                  key: 'sanrio',
                  title: 'Tháº¿ Giá»›i Sanrio SiÃªu ÄÃ¡ng YÃªu',
                  emoji: 'ðŸŽ€',
                  headerBg: 'text-rose-800 bg-rose-100 dark:text-rose-200 dark:bg-rose-950',
                  badgeBg: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950',
                  activeBorder: 'border-rose-500 bg-rose-50 ring-2 ring-rose-300 dark:bg-rose-950',
                  petIds: ['hello_kitty', 'kuromi', 'cinnamoroll', 'my_melody', 'pompompurin', 'keroppi'],
                },
                {
                  key: 'classic',
                  title: 'Linh Váº­t Tri Thá»©c & Ká»¹ NÄƒng Tiáº¿ng Anh',
                  emoji: 'ðŸ¦‰',
                  headerBg: 'text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950',
                  badgeBg: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950',
                  activeBorder: 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-300 dark:bg-emerald-950',
                  petIds: ['owl', 'cat', 'dog', 'fox', 'panda', 'bunny'],
                },
              ]
                .filter((sec) => switchPetCategory === 'all' || switchPetCategory === sec.key)
                .map((sec) => (
                  <div key={sec.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{sec.emoji}</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider dark:text-slate-200">
                        {sec.title}
                      </h4>
                      <span className={`text-[12px] font-black px-2 py-0.5 rounded-full ${sec.headerBg} ml-auto`}>
                        {sec.petIds.length} ThÃº CÆ°ng
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {sec.petIds.map((petId) => {
                        const pet = PETS_CATALOG[petId];
                        if (!pet) return null;
                        const isCurrent = petData?.pet_type === pet.id;
                        const isCinnamoroll = pet.id === 'cinnamoroll';
                        const cinnaAccess = isCinnamoroll ? cinnaServerAccess : null;
                        const isLocked = isCinnamoroll && cinnaAccess && !cinnaAccess.isUnlocked;

                        return (
                          <button
                            key={pet.id}
                            onClick={() => handleSwitchPet(pet.id)}
                            className={`relative p-3 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-between group hover:scale-102 ${
                              isCurrent
                                ? sec.activeBorder
                                : isLocked
                                ? 'border-slate-300 bg-slate-100/90 hover:border-amber-400 shadow-xs dark:border-white/10 dark:bg-slate-800/90'
                                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 shadow-xs dark:border-white/10 hover:dark:border-white/10 dark:bg-slate-900 hover:dark:bg-slate-900/50'
                            }`}
                          >
                            {/* Prominent Lock Status Badge */}
                            {isLocked && (
                              <div
                                className="absolute top-2 right-2 bg-slate-900/90 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md border border-amber-400/40 flex items-center gap-1 z-10 dark:bg-white/90"
                                title="ThÃº CÆ°ng Äá»™c Quyá»n Quáº£n Trá»‹ ViÃªn (Admin)"
                              >
                                <Lock className="w-2.5 h-2.5 text-amber-400" />
                                <span>ÄÃƒ KHÃ“A</span>
                              </div>
                            )}

                            <div className="w-14 h-14 flex items-center justify-center mb-1 relative">
                              <PixelPetSprite species={pet.id} scale={0.98} animationState="happy" />
                              {isLocked && (
                                <div className="absolute inset-0 bg-slate-950/35 rounded-2xl flex items-center justify-center backdrop-blur-[0.5px]">
                                  <div className="w-7 h-7 rounded-full bg-slate-900/90 border border-amber-400/70 flex items-center justify-center shadow-lg dark:bg-white/90">
                                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="font-black text-xs text-slate-900 truncate max-w-full dark:text-slate-100">{pet.name}</div>
                            <div className="text-[12px] text-slate-500 font-medium max-w-full leading-snug dark:text-slate-400">{pet.species}</div>

                            {isLocked ? (
                              <div className="text-[9px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full mt-1.5 line-clamp-1 border border-rose-200 flex items-center gap-1 shadow-xs dark:text-rose-300 dark:bg-rose-950 dark:border-rose-800">
                                <Lock className="w-2.5 h-2.5 text-rose-600 shrink-0 dark:text-rose-300" />
                                <span>DÃ nh RiÃªng Cho Admin</span>
                              </div>
                            ) : (
                              <div className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1.5 line-clamp-1 border border-slate-200/60 dark:border-white/10 ${sec.badgeBg}`}>
                                âœ¨ {pet.buff.title}
                              </div>
                            )}

                            {isCurrent && (
                              <div className="text-[9px] font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-full mt-1.5 shadow-xs">
                                ÄANG NUÃ”I
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SPECIAL PET VIP ACCESS DIALOG ================= */}
      {specialPetModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-4 border-amber-400 text-center space-y-4 dark:bg-slate-900">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center mx-auto text-3xl shadow-inner dark:bg-amber-950 dark:border-amber-800">
              {specialPetModal.action === 'verify_email' ? 'âœ‰ï¸' : 'ðŸ”’'}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight dark:text-slate-100">
              {specialPetModal.title}
            </h3>
            <div className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left dark:text-slate-400 dark:bg-slate-900 dark:border-white/10">
              {specialPetModal.message}
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {specialPetModal.action === 'login' && (
                <button
                  onClick={() => {
                    setSpecialPetModal((prev) => ({ ...prev, isOpen: false }));
                    window.dispatchEvent(new Event('open-auth-modal'));
                  }}
                  className="btn-3d btn-3d-emerald px-4 py-2 text-xs font-black cursor-pointer"
                >
                  ÄÄƒng Nháº­p Ngay ðŸ”‘
                </button>
              )}

              {specialPetModal.action === 'verify_email' && (
                <button
                  onClick={() => {
                    setSpecialPetModal((prev) => ({ ...prev, isOpen: false }));
                    window.dispatchEvent(new Event('open-email-verify-modal'));
                  }}
                  className="btn-3d btn-3d-amber px-4 py-2 text-xs font-black text-slate-950 cursor-pointer dark:text-slate-200"
                >
                  XÃ¡c Thá»±c Email Ngay âœ‰ï¸
                </button>
              )}

              <button
                onClick={() => setSpecialPetModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-3d btn-3d-white px-4 py-2 text-xs font-black text-slate-700 cursor-pointer dark:text-slate-300"
              >
                ÄÃ³ng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

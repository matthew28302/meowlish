'use client';

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
  Lock
} from 'lucide-react';
import { sound } from '@/lib/soundFx';
import { getStoredUser, setStoredUser, AuthUser } from '@/lib/auth';
import { PETS_CATALOG, SHOP_ITEMS, ShopItem, getPetTitle, checkCinnamorollAccess, CINNAMOROLL_ALLOWED_EMAILS } from '@/lib/petData';
import confetti from '@/lib/confetti';
import PixelFarmGame, { PixelFarmHandle } from '@/components/pet/PixelFarmGame';
import PixelPetSprite from '@/components/pet/PixelPetSprite';
import PixelFarmCanvas from '@/components/pet/PixelFarmCanvas';
import PetPvPArenaCanvas from '@/components/pet/PetPvPArenaCanvas';
import PetRacingCanvas from '@/components/pet/PetRacingCanvas';
import PetSocialHub from '@/components/pet/PetSocialHub';
import { SocialFriend } from '@/lib/petSocialData';

export default function PetPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  // Trạng thái khởi tạo phải GIỐNG HỆT server render (null/true/default).
  // Đọc localStorage trong useState initializer sẽ làm cây HTML trên client khác
  // server -> React hydration mismatch. Việc khôi phục cache làm ở hydrateFromCache()
  // chạy trong useEffect (SAU khi hydration xong).
  const [petData, setPetData] = useState<any | null>(null);
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

  // Khôi phục cache từ localStorage SAU khi hydration (chạy trên client).
  // Nếu có cache => hiển thị pet ngay, không cần chờ fetch.
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
            pet_name: PETS_CATALOG[savedSpecies]?.name || 'Thú Cưng',
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

    // Có cache => hết loading, không cần hiện spinner chờ fetch
    if (hasCache) setIsLoading(false);
  }, []);

  // Load user and pet data
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
          try {
            const savedHab = typeof window !== 'undefined' ? localStorage.getItem('pet_selected_habitat') : null;
            const savedSpecies = typeof window !== 'undefined' ? localStorage.getItem('pet_selected_species') : null;
            if (savedHab && (!data.pet.selected_habitat || data.pet.selected_habitat === 'emerald_garden')) {
              data.pet.selected_habitat = savedHab;
            } else if (data.pet.selected_habitat && typeof window !== 'undefined') {
              localStorage.setItem('pet_selected_habitat', data.pet.selected_habitat);
            }
            if (savedSpecies && (!data.pet.pet_type || data.pet.pet_type === 'owl')) {
              data.pet.pet_type = savedSpecies;
              data.pet.meta = PETS_CATALOG[savedSpecies] || data.pet.meta;
            } else if (data.pet.pet_type && typeof window !== 'undefined') {
              localStorage.setItem('pet_selected_species', data.pet.pet_type);
            }
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

  // Lắng nghe thay đổi auth/coins từ các trang khác (ví dụ: làm bài tập kiếm thêm xu)
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

  // Action: Petting / Vuốt ve
  const handlePet = async (e?: React.MouseEvent) => {
    sound.playCelebration();

    const happyQuotes = petData?.meta?.happyQuotes || ['Cảm ơn bạn nha! 💖'];
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
        setPetData((prev: any) => ({ ...prev, ...data.pet }));
      }
    } catch {}
  };

  // Action: Feed / Cho ăn
  const handleFeed = async (foodItem: ShopItem) => {
    const isOwned = inventory.some((i) => i.item_id === foodItem.id && (i.quantity === undefined || i.quantity > 0));
    if (!isOwned && userCoins < foodItem.price) {
      sound.playWrong();
      const needed = foodItem.price - userCoins;
      alert(`🪙 Bạn đang có ${userCoins.toLocaleString()} Coins, cần thêm ${needed.toLocaleString()} Coins để mua món ăn "${foodItem.name}".\nHãy hoàn thành các bài học và bài kiểm tra để tích lũy thêm Coins nhé!`);
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

        // Giảm số lượng đồ ăn trong kho nếu dùng từ kho
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

        const eatSounds = petData?.meta?.eatSounds || ['Măm măm ngon quá! 😋'];
        setPetSpeech(eatSounds[Math.floor(Math.random() * eatSounds.length)]);

        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.5 },
        });
      } else {
        const errData = await res.json();
        sound.playError();
        alert(errData.error || 'Không thể cho ăn lúc này!');
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
        setPetData((prev: any) => ({ ...prev, ...data.pet }));
      } else {
        const errData = await res.json().catch(() => null);
        sound.playWrong();
        alert(errData?.error || 'Không thể tháo đồ lúc này!');
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
          // Gửi TRẠNG THÁI ĐÍCH (item.id hoặc 'none') + itemType để server
          // SET tường minh, không toggle theo DB (tránh double-toggle).
          itemId: nextVal,
          itemType: item.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
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
        // Server từ chối (chưa sở hữu / phiên hết hạn...): báo lỗi + đồng bộ
        // lại từ server để hủy trạng thái optimistic sai lệch.
        const errData = await res.json().catch(() => null);
        sound.playWrong();
        alert(errData?.error || 'Không thể thay đồ cho thú cưng lúc này!');
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
      const access = checkCinnamorollAccess(currentUser);
      if (!access.isUnlocked) {
        sound.playWrong();
        if (access.status === 'locked_not_logged_in') {
          setSpecialPetModal({
            isOpen: true,
            title: 'Thú Cưng Độc Quyền Admin 🔒',
            message: 'Bé Cinnamoroll là Thú Cưng Độc Quyền Giới Hạn dành riêng cho Quản Trị Viên (Admin). Vui lòng đăng nhập để kiểm tra điều kiện mở khoá!',
            action: 'login',
          });
        } else if (access.status === 'locked_unverified_email') {
          setSpecialPetModal({
            isOpen: true,
            title: 'Kích Hoạt Đặc Quyền Admin ✉️✨',
            message: 'Tài khoản của bạn đủ điều kiện kích hoạt đặc quyền sở hữu bé Cinnamoroll! Vui lòng hoàn tất xác thực mã OTP email để nhận bé về khu vườn của mình nhé.',
            action: 'verify_email',
          });
        } else {
          setSpecialPetModal({
            isOpen: true,
            title: 'Thú Cưng Bị Khoá 🔒',
            message: 'Bé Cinnamoroll là Thú Cưng Độc Quyền Giới Hạn chỉ dành riêng cho Quản Trị Viên (Admin) được cấp quyền đặc biệt.',
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
      alert(`🪙 Bạn đang có ${userCoins.toLocaleString()} Coins, cần thêm ${needed.toLocaleString()} Coins để sở hữu "${item.name}".\nHãy hoàn thành các bài học và thử thách tiếng Anh để tích lũy thêm Coins nhé!`);
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
        
        // Cập nhật lại UI header coins
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
        alert(errData.error || 'Mua vật phẩm thất bại');
      }
    } catch {
      sound.playError();
      alert('Không thể kết nối máy chủ để mua vật phẩm. Vui lòng thử lại!');
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
          { key: 'swim', label: 'Bơi Hồ Sen', emoji: '🪷', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'Trèo Cây Táo', emoji: '🍎', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'jump', label: 'Bật Nấm Lò Xo', emoji: '🍄', bg: 'bg-rose-500 hover:bg-rose-400' },
          { key: 'coop', label: 'Cho Gà Ăn', emoji: '🐔', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'veggie', label: 'Thu Hoạch Rau', emoji: '🥕', bg: 'bg-orange-600 hover:bg-orange-500' },
        ];
      case 'sunset_beach':
        return [
          { key: 'surf', label: 'Lướt Ván Sóng', emoji: '🏄', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'Trèo Cây Dừa', emoji: '🌴', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'volleyball', label: 'Đánh Bóng Chuyền', emoji: '🏐', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'tiki', label: 'Uống Nước Dừa Tiki', emoji: '🍹', bg: 'bg-rose-600 hover:bg-rose-500' },
          { key: 'lighthouse', label: 'Đèn Hải Đăng', emoji: '🗼', bg: 'bg-indigo-600 hover:bg-indigo-500' },
        ];
      case 'cozy_den':
        return [
          { key: 'code', label: 'Gõ Code Dev', emoji: '💻', bg: 'bg-indigo-600 hover:bg-indigo-500' },
          { key: 'climb', label: 'Kệ Sách Lập Trình', emoji: '📚', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'beanbag', label: 'Nằm Ghế Beanbag', emoji: '🛋️', bg: 'bg-rose-500 hover:bg-rose-400' },
          { key: 'coffee', label: 'Pha Espresso', emoji: '☕', bg: 'bg-amber-700 hover:bg-amber-600' },
          { key: 'server', label: 'Kiểm Tra Server Rack', emoji: '🖥️', bg: 'bg-cyan-700 hover:bg-cyan-600' },
        ];
      case 'sky_castle':
        return [
          { key: 'fountain', label: 'Đài Phun Sao Biển', emoji: '⛲', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'Bậc Mây Cung Đình', emoji: '☁️', bg: 'bg-indigo-600 hover:bg-indigo-500' },
          { key: 'rainbow', label: 'Cầu Vồng Pha Lê', emoji: '🌈', bg: 'bg-pink-600 hover:bg-pink-500' },
          { key: 'treasure', label: 'Mở Rương Kim Cương', emoji: '💎', bg: 'bg-amber-500 hover:bg-amber-400 text-slate-950' },
          { key: 'castle', label: 'Cổng Thành Thần Tiên', emoji: '🏰', bg: 'bg-purple-600 hover:bg-purple-500' },
        ];
      case 'thousand_sunny':
        return [
          { key: 'helm', label: 'Bẻ Bánh Lái Tàu', emoji: '⚓', bg: 'bg-amber-700 hover:bg-amber-600' },
          { key: 'jump', label: 'Nhảy Đầu Sư Tử Sunny', emoji: '🦁', bg: 'bg-yellow-500 hover:bg-yellow-400 text-slate-950' },
          { key: 'cannon', label: 'Nạp Đại Bác Cola', emoji: '💣', bg: 'bg-stone-700 hover:bg-stone-600' },
          { key: 'tangerine', label: 'Hái Cam Mikan Nami', emoji: '🍊', bg: 'bg-orange-500 hover:bg-orange-400' },
          { key: 'treasure', label: 'Mở Rương Kho Báu', emoji: '💰', bg: 'bg-emerald-600 hover:bg-emerald-500' },
        ];
      case 'konoha_valley':
        return [
          { key: 'ramen', label: 'Ăn Mì Ichiraku', emoji: '🍜', bg: 'bg-orange-600 hover:bg-orange-500' },
          { key: 'hokage', label: 'Leo Tượng Hokage', emoji: '⛰️', bg: 'bg-stone-600 hover:bg-stone-500' },
          { key: 'torii', label: 'Đi Qua Cổng Torii', emoji: '⛩️', bg: 'bg-red-600 hover:bg-red-500' },
          { key: 'target', label: 'Bắn Phi Tiêu Kunai', emoji: '🎯', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'onsen', label: 'Ngâm Suối Onsen', emoji: '♨️', bg: 'bg-teal-600 hover:bg-teal-500' },
        ];
      case 'hogwarts_hall':
        return [
          { key: 'sorting_hat', label: 'Đội Nón Phân Loại', emoji: '🧙', bg: 'bg-purple-700 hover:bg-purple-600' },
          { key: 'feast', label: 'Dự Tiệc Đại Sảnh', emoji: '🍗', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'fireplace', label: 'Sưởi Lò Gryffindor', emoji: '🔥', bg: 'bg-red-700 hover:bg-red-600' },
          { key: 'banners', label: 'Cờ Bốn Nhà Pháp Thuật', emoji: '🚩', bg: 'bg-indigo-600 hover:bg-indigo-500' },
        ];
      case 'doraemon_field':
        return [
          { key: 'pipes', label: 'Ngồi 3 Ống Bê Tông', emoji: '🧱', bg: 'bg-slate-600 hover:bg-slate-500' },
          { key: 'anywhere_door', label: 'Mở Cửa Thần Kỳ', emoji: '🚪', bg: 'bg-pink-600 hover:bg-pink-500' },
          { key: 'dorayaki', label: 'Ăn Bánh Rán Nobita', emoji: '🥞', bg: 'bg-amber-600 hover:bg-amber-500' },
          { key: 'pole', label: 'Cột Điện Khu Phố', emoji: '⚡', bg: 'bg-sky-700 hover:bg-sky-600' },
        ];
      case 'dream_land':
        return [
          { key: 'warp_star', label: 'Cưỡi Sao Warp Star', emoji: '⭐', bg: 'bg-yellow-500 hover:bg-yellow-400 text-slate-950' },
          { key: 'lollipop', label: 'Cây Kẹo Bảy Sắc', emoji: '🍭', bg: 'bg-pink-500 hover:bg-pink-400' },
          { key: 'rainbow', label: 'Suối Thác Cầu Vồng', emoji: '🌈', bg: 'bg-violet-600 hover:bg-violet-500' },
          { key: 'apple', label: 'Hái Táo Whispy Woods', emoji: '🍎', bg: 'bg-emerald-600 hover:bg-emerald-500' },
          { key: 'star_rod', label: 'Cầu Nguyện Trượng Sao', emoji: '🪄', bg: 'bg-indigo-600 hover:bg-indigo-500' },
        ];
      default:
        return [
          { key: 'swim', label: 'Bơi Hồ Sen', emoji: '🪷', bg: 'bg-sky-600 hover:bg-sky-500' },
          { key: 'climb', label: 'Trèo Cây Táo', emoji: '🍎', bg: 'bg-emerald-700 hover:bg-emerald-600' },
          { key: 'jump', label: 'Bật Nấm Lò Xo', emoji: '🍄', bg: 'bg-rose-500 hover:bg-rose-400' },
          { key: 'coop', label: 'Cho Gà Ăn', emoji: '🐔', bg: 'bg-amber-600 hover:bg-amber-500' },
        ];
    }
  })();

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col p-2 sm:p-3 gap-2 overflow-y-auto custom-scrollbar select-none pb-24 lg:pb-2 overflow-x-hidden">
      {/* ================= MEOWLISH 2D WORLD NAVIGATOR ================= */}
      <div className="w-full shrink-0 bg-gradient-to-r from-emerald-900 via-teal-950 to-amber-950 rounded-2xl p-1.5 sm:p-2 border-2 border-emerald-500/50 shadow-lg flex items-center justify-between gap-1.5 overflow-x-auto custom-scrollbar">
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
            <span>🌾</span>
            <span>Nông Trại 2.5D (Gà & Bò)</span>
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
            <span>⚔️</span>
            <span>Đấu Trường PvP (Tiếng Anh)</span>
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
            <span>🏁</span>
            <span>Đua Thú Cưng (Tiếng Anh)</span>
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
            <span>🏡</span>
            <span>Sân Vườn Linh Vật</span>
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
            <span>👥</span>
            <span>Phố Xã Hội & Kết Đôi</span>
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

      {/* ================= TAB 1: SANCTUARY (KHU VƯỜN THÚ CƯNG) ================= */}
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
                  <p className="text-lg font-black tracking-wide drop-shadow-md">Đang mở cửa khu vườn thú cưng...</p>
                  <p className="text-xs text-white/80 font-medium">Chuẩn bị không gian và đón thú cưng của bạn về nhà 🏡✨</p>
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
                    ? '✨ Uyên Ương Hoàng Gia'
                    : coupleData?.ring_type === 'ring_gold'
                    ? '🌹 Cặp Đôi Ngọt Ngào'
                    : '❤️ Cặp Đôi Tri Kỷ'
                }
              />
            )}
          </div>

          {/* DEDICATED ACTION TOOLBAR (SEPARATED COMPLETELY OUTSIDE MAP).
              Mobile: một hàng cuộn ngang để vườn vừa khung hình không cuộn;
              desktop (lg+): wrap nhiều hàng như cũ. */}
          <div className="w-full shrink-0 rounded-2xl p-2 sm:p-2.5 border-2 border-emerald-300/70 bg-gradient-to-b from-white via-white to-emerald-50/70 shadow-[0_5px_0_rgba(5,150,105,0.18),0_14px_24px_-16px_rgba(5,150,105,0.6)] flex flex-row flex-nowrap lg:flex-wrap items-center gap-2 overflow-x-auto lg:overflow-visible custom-scrollbar dark:from-slate-900 dark:via-slate-900">
            {/* Left: Modals & Wardrobe */}
            <div className="flex flex-nowrap lg:flex-wrap shrink-0 items-center gap-1.5 [&>button]:shrink-0 [&>button]:whitespace-nowrap">
              <button
                onClick={() => handleOpenShop('shop')}
                className="btn-3d btn-3d-amber px-3.5 py-2 min-h-[40px] text-xs font-black text-slate-950 cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-102 touch-manipulation dark:text-slate-200"
                title="Mở Cửa Hàng & Phòng Thử Đồ Thời Trang"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cửa Hàng & Thử Đồ</span>
              </button>

              <button
                onClick={() => handleOpenShop('wardrobe')}
                className="btn-3d btn-3d-white px-3.5 py-2 min-h-[40px] text-xs font-black text-slate-800 cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-102 touch-manipulation dark:text-slate-200"
                title="Mở Tủ Đồ Cá Nhân"
              >
                <Shirt className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                <span>Tủ Đồ</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setShowHabitatModal(true);
                }}
                className="btn-3d btn-3d-emerald px-3 py-2 min-h-[40px] text-xs font-black text-white cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-102 touch-manipulation"
                title="Đổi Cảnh Quan Sân Vườn"
              >
                <Trees className="w-4 h-4" />
                <span>Cảnh Quan</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setShowSwitchModal(true);
                }}
                className="px-2.5 py-2 min-h-[40px] rounded-2xl border border-slate-200 border-b-[3px] border-b-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-black cursor-pointer flex items-center gap-1 transition hover:-translate-y-0.5 active:translate-y-0.5 active:border-b touch-manipulation dark:border-white/10 dark:bg-slate-900 hover:dark:bg-slate-800 dark:text-slate-300"
                title="Chọn Nuôi Linh Vật Khác"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden md:inline">Đổi Bé</span>
              </button>
            </div>

            {/* Right: Farm Interaction & Movement Tools */}
            <div className="flex flex-nowrap lg:flex-wrap shrink-0 items-center gap-1.5 lg:ml-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowFeedModal(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 min-h-[36px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl border-b-[3px] border-emerald-800/70 text-[11px] sm:text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-[0_3px_8px_-4px_rgba(6,95,70,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 active:shadow-none"
                title="Cho thú cưng ăn thực đơn bổ dưỡng"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Cho Ăn</span>
              </button>

              {/* Map action buttons removed: every pet action is now triggered by
                  clicking its object directly on the map (see PixelFarmGame).
                  mapActionButtons catalog kept below as reference. */}

              <button
                onClick={() => farmRef.current?.tossBall()}
                className="px-2.5 sm:px-3 py-1.5 min-h-[36px] bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl border-b-[3px] border-amber-600/70 text-[11px] sm:text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-[0_3px_8px_-4px_rgba(217,119,6,0.5)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 active:shadow-none touch-manipulation"
                title="Ném bóng cho thú cưng nhặt"
              >
                <span>🎾</span>
                <span>Ném Bóng</span>
              </button>

              <button
                onClick={() => farmRef.current?.callPet()}
                className="px-2.5 sm:px-3 py-1.5 min-h-[36px] bg-white hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-300 border-b-[3px] border-b-slate-400/70 text-[11px] sm:text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b hover:scale-100 touch-manipulation dark:bg-slate-900 hover:dark:bg-slate-800 dark:text-slate-200 dark:border-white/10"
                title="Gọi thú cưng lại gần bạn"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                <span>Gọi Bé</span>
              </button>

              <button
                onClick={() => {
                  const next = farmRef.current?.toggleSleep();
                  if (next !== undefined) {
                    setFarmState((prev) => ({ ...prev, isSleeping: next }));
                  }
                }}
                className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] text-[11px] sm:text-xs font-black rounded-2xl border-b-[3px] transition cursor-pointer flex items-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 ${
                  farmState.isSleeping
                    ? 'bg-sky-500 text-white border-sky-400 ring-2 ring-sky-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 dark:bg-white dark:text-slate-900 dark:border-white/10'
                }`}
                title="Cho thú cưng chợp mắt hoặc đánh thức"
              >
                <span>💤</span>
                <span>{farmState.isSleeping ? 'Thức Dậy' : 'Đi Ngủ'}</span>
              </button>
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
            userDisplayName={currentUser?.display_name || currentUser?.username || 'Bạn'}
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
            userDisplayName={currentUser?.display_name || currentUser?.username || 'Bạn'}
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
              setPetSpeech(`Đang ghé thăm nông trại của ${f.displayName || f.display_name}! Thú cưng đáng yêu quá! 🏡💖`);
              setGameTab('farm');
            }}
            onChallengeFriend={() => {
              sound.playPop();
              setGameTab('pvp');
            }}
          />
        </div>
      )}

      {/* ================= MODAL 1: SHOP & FITTING ROOM (Phòng Thử Đồ & Mua Sắm) ================= */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-[96vw] max-w-4xl h-[92vh] sm:h-[84vh] max-h-[660px] min-h-[420px] flex flex-col shadow-2xl border-2 sm:border-4 border-emerald-500 overflow-hidden dark:bg-slate-900">
            {/* Modal Header */}
            <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">🛍️</span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-black leading-tight truncate">
                    Cửa Hàng & Phòng Thử Đồ
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-emerald-100 font-medium truncate hidden xs:block">
                    Chọn món đồ bất kỳ để bé mặc thử ngay lập tức!
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
                  title="Đóng cửa sổ"
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
                  <ShoppingBag className="w-3.5 h-3.5" /> Mua Sắm
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
                  <Shirt className="w-3.5 h-3.5" /> Tủ Đồ Của Tôi
                </button>
              </div>

              {/* Sub-Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold py-0.5 custom-scrollbar">
                {[
                  { id: 'all', label: 'Tất Cả' },
                  { id: 'hat', label: '🎓 Nón & Mũ' },
                  { id: 'outfit', label: '👕 Trang Phục' },
                  { id: 'accessory', label: '👓 Phụ Kiện' },
                  { id: 'food', label: '🍏 Thức Ăn' },
                  { id: 'decor', label: '🌳 Trang Trí' },
                  { id: 'habitat', label: '🏡 Cảnh Quan' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playClick();
                      setShopCategory(cat.id);
                    }}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] font-black transition cursor-pointer shrink-0 ${
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
                    scale={0.75}
                    equippedHat={previewHat}
                    equippedOutfit={previewOutfit}
                    equippedAccessory={previewAccessory}
                  />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[9px] font-black text-emerald-800 uppercase tracking-wider dark:text-emerald-200">Đang xem thử</div>
                  <div className="text-[11px] font-black text-slate-800 truncate max-w-[130px] dark:text-slate-200">
                    {previewHatObj?.name || previewOutfitObj?.name || previewAccessoryObj?.name || 'Đồ mặc định'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleRevertPreview}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[10px] font-bold shadow-xs cursor-pointer active:scale-95 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300"
                  title="Khôi phục"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={handleApplyPreview}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Mặc lên bé"
                >
                  <Check className="w-3 h-3" /> Mặc Bé
                </button>
              </div>
            </div>

            {/* Modal Body: Split View (Left: Live Fitting Room, Right: Catalog Grid) */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
              {/* ================= DESKTOP LEFT: LIVE FITTING ROOM PREVIEW STAGE ================= */}
              <div className="hidden md:flex md:w-68 lg:w-76 shrink-0 bg-gradient-to-b from-emerald-50/90 via-teal-50/50 to-slate-50 p-3.5 border-r border-slate-200 flex-col justify-between items-center text-center overflow-hidden dark:from-emerald-950 dark:via-teal-950 dark:to-slate-900 dark:border-white/10">
                <div className="w-full">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-1 dark:bg-emerald-950 dark:text-emerald-200">
                    <span>🪞</span> Phòng Thử Đồ Trực Tiếp
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                    {petData?.pet_name || currentPetMeta.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium dark:text-slate-400">
                    Nhấp vào món đồ bên phải để bé mặc thử ngay!
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
                      scale={2.1}
                      equippedHat={previewHat}
                      equippedOutfit={previewOutfit}
                      equippedAccessory={previewAccessory}
                    />
                  </div>
                </div>

                {/* Current Preview Status Chips - Compact Layout */}
                <div className="w-full space-y-1 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 text-xs shadow-xs text-left dark:bg-slate-900/90 dark:border-white/10">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400">🎓 Nón:</span>
                    <span className="font-black text-slate-800 truncate max-w-[110px] dark:text-slate-200">
                      {previewHatObj ? previewHatObj.name : 'Không đội'}
                    </span>
                    {previewHat && (
                      <button
                        onClick={() => handleUnequip('hat')}
                        className="text-[9px] text-rose-500 hover:text-rose-700 font-black cursor-pointer hover:dark:text-rose-300"
                      >
                        ✕ Tháo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400">👕 Áo:</span>
                    <span className="font-black text-slate-800 truncate max-w-[110px] dark:text-slate-200">
                      {previewOutfitObj ? previewOutfitObj.name : 'Không mặc'}
                    </span>
                    {previewOutfit && (
                      <button
                        onClick={() => handleUnequip('outfit')}
                        className="text-[9px] text-rose-500 hover:text-rose-700 font-black cursor-pointer hover:dark:text-rose-300"
                      >
                        ✕ Tháo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-500 dark:text-slate-400">👓 Phụ kiện:</span>
                    <span className="font-black text-slate-800 truncate max-w-[110px] dark:text-slate-200">
                      {previewAccessoryObj ? previewAccessoryObj.name : 'Không đeo'}
                    </span>
                    {previewAccessory && (
                      <button
                        onClick={() => handleUnequip('accessory')}
                        className="text-[9px] text-rose-500 hover:text-rose-700 font-black cursor-pointer hover:dark:text-rose-300"
                      >
                        ✕ Tháo
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-1.5 pt-2">
                  <button
                    onClick={handleRevertPreview}
                    className="btn-3d btn-3d-white py-1.5 text-xs font-black text-slate-700 cursor-pointer flex items-center justify-center gap-1 shadow-xs dark:text-slate-300"
                    title="Khôi phục trang phục ban đầu của bé"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục
                  </button>

                  <button
                    onClick={handleApplyPreview}
                    className="btn-3d btn-3d-emerald py-1.5 text-xs font-black text-white cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    title="Lưu trang phục đang thử lên người bé"
                  >
                    <Check className="w-3.5 h-3.5" /> Mặc Lên Bé
                  </button>
                </div>
              </div>

              {/* ================= RIGHT: CATALOG ITEM GRID ================= */}
              <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto min-w-0 bg-slate-50/50 dark:bg-slate-900/50">
                {filteredItems.length === 0 ? (
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="text-4xl animate-bounce">🎒</div>
                    <div>
                      <h5 className="font-black text-sm text-slate-800 dark:text-slate-200">
                        {shopMode === 'wardrobe' ? 'Tủ đồ mục này đang trống' : 'Không có vật phẩm phù hợp'}
                      </h5>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 dark:text-slate-400">
                        {shopMode === 'wardrobe'
                          ? 'Bé chưa có món đồ nào trong mục này. Hãy ghé tab Mua Sắm Mới để sắm sửa nhé!'
                          : 'Hãy chọn mục khác trong thanh danh mục ở trên nhé!'}
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
                        🛍️ Đến Cửa Hàng Sắm Đồ
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
                                  👀 THỬ
                                </span>
                              )}
                              {isActuallyEquipped && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-600 text-white shadow-xs">
                                  ✨ MẶC
                                </span>
                              )}
                              {isOwned && !isActuallyEquipped && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                                  ✓ Đã có
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-0.5">
                            <h5 className="font-black text-xs sm:text-sm text-slate-900 leading-tight line-clamp-1 dark:text-slate-100">
                              {item.name}
                            </h5>
                            <p className="text-[10px] text-slate-500 font-medium line-clamp-1 dark:text-slate-400">
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
                                className={`w-full py-1 text-[11px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                  isOwned
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                    : userCoins >= item.price
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {isOwned ? (
                                  <span>🍽️ Cho Ăn (Kho: x{inventory.find(i => i.item_id === item.id)?.quantity || 1})</span>
                                ) : (
                                  <span>
                                    🪙 {item.price} xu (Ăn Ngay)
                                    {userCoins < item.price && (
                                      <span className="text-[9px] font-bold text-amber-700 ml-1 opacity-80 dark:text-amber-300">
                                        (Thiếu {item.price - userCoins})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </button>
                            ) : item.type === 'decor' ? (
                              isOwned ? (
                                <div className="w-full py-1 text-[11px] font-black rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-center dark:bg-slate-800 dark:text-slate-400 dark:border-white/10">
                                  ✓ Đã Có Trong Kho
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(item);
                                  }}
                                  className={`w-full py-1 text-[11px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                    userCoins >= item.price
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  <span>🪙</span> {item.price} xu
                                  {userCoins < item.price && (
                                    <span className="text-[9px] font-bold text-amber-700 ml-0.5 opacity-85 dark:text-amber-300">
                                      (Thiếu {item.price - userCoins})
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
                                  className={`w-full py-1 text-[11px] font-black rounded-xl border transition cursor-pointer shadow-xs active:scale-95 ${
                                    petData?.selected_habitat === item.id
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                                  }`}
                                >
                                  {petData?.selected_habitat === item.id ? '✓ Đang Dùng' : 'Áp Dụng'}
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(item);
                                  }}
                                  className={`w-full py-1 text-[11px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                    userCoins >= item.price
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  <span>🪙</span> {item.price} xu
                                  {userCoins < item.price && (
                                    <span className="text-[9px] font-bold text-amber-700 ml-0.5 opacity-85 dark:text-amber-300">
                                      (Thiếu {item.price - userCoins})
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
                                className={`w-full py-1 text-[11px] font-black rounded-xl border transition cursor-pointer shadow-xs active:scale-95 ${
                                  isActuallyEquipped
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 hover:dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                                }`}
                              >
                                {isActuallyEquipped ? 'Tháo Ra' : 'Mặc Ngay'}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(item);
                                }}
                                className={`w-full py-1 text-[11px] font-black rounded-xl border transition cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95 ${
                                  userCoins >= item.price
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 hover:dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                                }`}
                              >
                                <span>🪙</span> {item.price} xu
                                {userCoins < item.price && (
                                  <span className="text-[9px] font-bold text-amber-700 ml-0.5 opacity-85 dark:text-amber-300">
                                    (Thiếu {item.price - userCoins})
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

      {/* ================= MODAL 2: FEED TREATS (Thực Đơn Cho Ăn) ================= */}
      {showFeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border-4 border-amber-400 space-y-3 sm:space-y-4 max-h-[88vh] flex flex-col dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍜</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight dark:text-slate-100">Thực Đơn Thần Kỳ Cho Thú Cưng</h3>
                  <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">Bổ sung năng lượng, chỉ số Hạnh phúc và kinh nghiệm EXP!</p>
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
                          <span className="text-[10px] font-black text-amber-600 shrink-0 dark:text-amber-300">
                            🪙 {food.price}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 dark:text-slate-400">{food.description}</div>
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

      {/* ================= MODAL 3: HABITAT SWITCHER (Đổi Cảnh Quan Sân Vườn) ================= */}
      {showHabitatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-4 border-emerald-500 overflow-hidden dark:bg-slate-900">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏡</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">Chọn Cảnh Quan Thế Giới Thú Cưng</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Bao gồm 5 Cảnh quan Anime huyền thoại & 4 Cảnh quan kinh điển!</p>
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
              {/* SECTION 1: CẢNH QUAN ANIME & HUYỀN THOẠI */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg">✨</span>
                  <h4 className="text-xs sm:text-sm font-black text-indigo-700 uppercase tracking-wider dark:text-indigo-300">
                    Cảnh Quan Anime & Kỳ Ảo Mới (One Piece, Naruto, Hogwarts, Doraemon, Kirby)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'thousand_sunny',
                      name: 'Boong Tàu Hải Tặc Sunny',
                      emoji: '🏴‍☠️',
                      badge: 'One Piece',
                      desc: 'Đầu sư tử Sunny rạng rỡ, cột buồm hiên ngang, rương vàng châu báu và đại dương bao la.',
                    },
                    {
                      id: 'konoha_valley',
                      name: 'Thung Lũng Nhẫn Giả Làng Lá',
                      emoji: '🍃',
                      badge: 'Naruto',
                      desc: 'Vách đá tượng 4 Hokage, suối nước nóng Onsen, quán mì Ichiraku và rừng trúc thanh tịnh.',
                    },
                    {
                      id: 'hogwarts_hall',
                      name: 'Đại Sảnh Đường Hogwarts',
                      emoji: '⚡',
                      badge: 'Harry Potter',
                      desc: 'Hàng trăm ngọn nến bay lơ lửng, lò sưởi Floo xanh ngọc, bàn tiệc và Nón Phân Loại kỳ diệu.',
                    },
                    {
                      id: 'doraemon_field',
                      name: 'Bãi Đất Trống Doraemon',
                      emoji: '🔔',
                      badge: 'Doraemon',
                      desc: '3 ống cống bê tông tròn kinh điển, Cánh Cửa Thần Kỳ, hàng rào gỗ tuổi thơ và bánh rán Dorayaki.',
                    },
                    {
                      id: 'dream_land',
                      name: 'Vương Quốc Giấc Mơ Kirby',
                      emoji: '⭐',
                      badge: 'Kirby Dream Land',
                      desc: 'Cây kẹo mút khổng lồ bảy sắc, Ngôi Sao Vàng Warp Star, suối cầu vồng và Trượng Sao may mắn.',
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
                            if (confirm(`Bạn chưa mở khoá cảnh quan "${hab.name}"! Bạn có muốn mở Cửa Hàng để mua ngay không?`)) {
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
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {hab.badge}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                              ĐANG CHỌN
                            </span>
                          )}
                          {!isOwned && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              CHƯA MỞ
                            </span>
                          )}
                        </div>
                        <div className={`font-black text-xs ${!isOwned ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{hab.name}</div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed dark:text-slate-400">{hab.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: CẢNH QUAN KINH ĐIỂN */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg">🌿</span>
                  <h4 className="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wider dark:text-emerald-300">
                    Cảnh Quan Kinh Điển & Công Nghệ
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'emerald_garden', name: 'Vườn Nông Trại Xanh', emoji: '🌿', desc: 'Cối xay gió Hà Lan, cây đại thụ hái táo, đầm sen cá Koi lội và nấm nhún ma thuật.' },
                    { id: 'cozy_den', name: 'Căn Phòng IT Dev', emoji: '🖥️', desc: 'Bàn dual monitor gõ code fix bug, tủ Server 42U, đệm lười Beanbag và quầy Espresso.' },
                    { id: 'sunset_beach', name: 'Bãi Biển Nhiệt Đới', emoji: '🏖️', desc: 'Bờ cát vàng hoàng hôn, sóng biển dạt dào, cây dừa cong vút và lửa trại bãi biển.' },
                    { id: 'sky_castle', name: 'Lâu Đài Mây Huyền Ảo', emoji: '🏰', desc: 'Cung điện pha lê bồng bềnh, cầu vồng 7 màu, đài phun nước thiên thần và rương ngọc báu.' },
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
                            if (confirm(`Bạn chưa mở khoá cảnh quan "${hab.name}"! Bạn có muốn mở Cửa Hàng để mua ngay không?`)) {
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
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                              ĐANG CHỌN
                            </span>
                          )}
                          {!isOwned && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              CHƯA MỞ
                            </span>
                          )}
                        </div>
                        <div className={`font-black text-xs ${!isOwned ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{hab.name}</div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed dark:text-slate-400">{hab.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: SWITCH MASCOT SPECIES (Đổi Thú Cưng) ================= */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-emerald-500 overflow-hidden dark:bg-slate-900">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🐾</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">Chọn Bạn Đồng Hành Nuôi Dưỡng</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Bao gồm 27 siêu thú cưng Anime, Manga & Linh vật tri thức đỉnh cao!</p>
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
                { id: 'all', label: 'Tất Cả (27)', emoji: '✨' },
                { id: 'one_piece', label: 'One Piece (3)', emoji: '🏴‍☠️' },
                { id: 'naruto', label: 'Naruto (3)', emoji: '🍥' },
                { id: 'harry_potter', label: 'Harry Potter (3)', emoji: '⚡' },
                { id: 'avengers', label: 'Avengers (3)', emoji: '🛡️' },
                { id: 'doraemon_kirby', label: 'Doraemon & Kirby (3)', emoji: '🌟' },
                { id: 'sanrio', label: 'Sanrio (6)', emoji: '🎀' },
                { id: 'classic', label: 'Tri Thức (6)', emoji: '🦉' },
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
                  title: 'Đại Hải Trình One Piece',
                  emoji: '🏴‍☠️',
                  headerBg: 'text-amber-800 bg-amber-100 dark:text-amber-200 dark:bg-amber-950',
                  badgeBg: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950',
                  activeBorder: 'border-amber-500 bg-amber-50 ring-2 ring-amber-300 dark:bg-amber-950',
                  petIds: ['chopper', 'karoo', 'bepo'],
                },
                {
                  key: 'naruto',
                  title: 'Thế Giới Nhẫn Giả Naruto',
                  emoji: '🍥',
                  headerBg: 'text-orange-800 bg-orange-100 dark:text-orange-200 dark:bg-orange-950',
                  badgeBg: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950',
                  activeBorder: 'border-orange-500 bg-orange-50 ring-2 ring-orange-300 dark:bg-orange-950',
                  petIds: ['kurama', 'pakkun', 'gamakichi'],
                },
                {
                  key: 'harry_potter',
                  title: 'Phép Thuật Hogwarts Harry Potter',
                  emoji: '⚡',
                  headerBg: 'text-indigo-800 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-950',
                  badgeBg: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950',
                  activeBorder: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300 dark:bg-indigo-950',
                  petIds: ['hedwig', 'crookshanks', 'fawkes'],
                },
                {
                  key: 'avengers',
                  title: 'Vũ Trụ Siêu Anh Hùng Avengers',
                  emoji: '🛡️',
                  headerBg: 'text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-950',
                  badgeBg: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950',
                  activeBorder: 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950',
                  petIds: ['goose', 'rocket', 'alligator_loki'],
                },
                {
                  key: 'doraemon_kirby',
                  title: 'Thế Kỷ 22 Doraemon & Dream Land Kirby',
                  emoji: '🌟',
                  headerBg: 'text-sky-800 bg-sky-100 dark:text-sky-200 dark:bg-sky-950',
                  badgeBg: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950',
                  activeBorder: 'border-sky-500 bg-sky-50 ring-2 ring-sky-300 dark:bg-sky-950',
                  petIds: ['doraemon', 'dorami', 'kirby'],
                },
                {
                  key: 'sanrio',
                  title: 'Thế Giới Sanrio Siêu Đáng Yêu',
                  emoji: '🎀',
                  headerBg: 'text-rose-800 bg-rose-100 dark:text-rose-200 dark:bg-rose-950',
                  badgeBg: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950',
                  activeBorder: 'border-rose-500 bg-rose-50 ring-2 ring-rose-300 dark:bg-rose-950',
                  petIds: ['hello_kitty', 'kuromi', 'cinnamoroll', 'my_melody', 'pompompurin', 'keroppi'],
                },
                {
                  key: 'classic',
                  title: 'Linh Vật Tri Thức & Kỹ Năng Tiếng Anh',
                  emoji: '🦉',
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
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sec.headerBg} ml-auto`}>
                        {sec.petIds.length} Thú Cưng
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {sec.petIds.map((petId) => {
                        const pet = PETS_CATALOG[petId];
                        if (!pet) return null;
                        const isCurrent = petData?.pet_type === pet.id;
                        const isCinnamoroll = pet.id === 'cinnamoroll';
                        const cinnaAccess = isCinnamoroll ? checkCinnamorollAccess(currentUser) : null;
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
                                title="Thú Cưng Độc Quyền Quản Trị Viên (Admin)"
                              >
                                <Lock className="w-2.5 h-2.5 text-amber-400" />
                                <span>ĐÃ KHÓA</span>
                              </div>
                            )}

                            <div className="w-14 h-14 flex items-center justify-center mb-1 relative">
                              <PixelPetSprite species={pet.id} scale={1.4} animationState="happy" />
                              {isLocked && (
                                <div className="absolute inset-0 bg-slate-950/35 rounded-2xl flex items-center justify-center backdrop-blur-[0.5px]">
                                  <div className="w-7 h-7 rounded-full bg-slate-900/90 border border-amber-400/70 flex items-center justify-center shadow-lg dark:bg-white/90">
                                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="font-black text-xs text-slate-900 truncate max-w-full dark:text-slate-100">{pet.name}</div>
                            <div className="text-[10px] text-slate-500 font-medium truncate max-w-full dark:text-slate-400">{pet.species}</div>

                            {isLocked ? (
                              <div className="text-[9px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full mt-1.5 line-clamp-1 border border-rose-200 flex items-center gap-1 shadow-xs dark:text-rose-300 dark:bg-rose-950 dark:border-rose-800">
                                <Lock className="w-2.5 h-2.5 text-rose-600 shrink-0 dark:text-rose-300" />
                                <span>Dành Riêng Cho Admin</span>
                              </div>
                            ) : (
                              <div className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1.5 line-clamp-1 border border-slate-200/60 dark:border-white/10 ${sec.badgeBg}`}>
                                ✨ {pet.buff.title}
                              </div>
                            )}

                            {isCurrent && (
                              <div className="text-[9px] font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-full mt-1.5 shadow-xs">
                                ĐANG NUÔI
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
              {specialPetModal.action === 'verify_email' ? '✉️' : '🔒'}
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
                  Đăng Nhập Ngay 🔑
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
                  Xác Thực Email Ngay ✉️
                </button>
              )}

              <button
                onClick={() => setSpecialPetModal((prev) => ({ ...prev, isOpen: false }))}
                className="btn-3d btn-3d-white px-4 py-2 text-xs font-black text-slate-700 cursor-pointer dark:text-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

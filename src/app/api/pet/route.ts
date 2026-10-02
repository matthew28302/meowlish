import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
import { PETS_CATALOG, SHOP_ITEMS, checkCinnamorollAccess } from '@/lib/petData';
import { CROPS_CATALOG, LIVESTOCK_CATALOG } from '@/lib/petFarmData';
import { WEDDING_RINGS, MOCK_COMMUNITY_USERS } from '@/lib/petSocialData';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { syncDbToS3Now } from '@/lib/s3Sync';

function ensurePet(userId: string) {
  let pet = db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(userId) as any;
  if (!pet) {
    db.prepare(`
      INSERT OR IGNORE INTO user_pets (user_id, pet_type, pet_name, level, exp, hunger, happiness, energy, selected_habitat, equipped_hat, equipped_outfit, equipped_accessory)
      VALUES (?, 'owl', 'Lexi Trí Tuệ', 1, 0, 80, 90, 100, 'emerald_garden', 'none', 'none', 'none')
    `).run(userId);

    // Give default habitat to inventory
    db.prepare(`
      INSERT OR IGNORE INTO pet_inventory (id, user_id, item_id, item_type, is_equipped)
      VALUES (?, ?, 'emerald_garden', 'habitat', 1)
    `).run(`inv-${userId}-emerald_garden`, userId);

    pet = db.prepare('SELECT * FROM user_pets WHERE user_id = ?').get(userId);
  }
  return pet;
}

function ensureFarmAndLivestock(userId: string) {
  const existingPlots = db.prepare('SELECT COUNT(*) as count FROM pet_farm_plots WHERE user_id = ?').get(userId) as any;
  if (!existingPlots || existingPlots.count === 0) {
    const insertPlot = db.prepare(`
      INSERT OR IGNORE INTO pet_farm_plots (id, user_id, plot_index, crop_type, stage)
      VALUES (?, ?, ?, 'carrot', 'empty')
    `);
    for (let i = 0; i < 8; i++) {
      insertPlot.run(`plot-${userId}-${i}`, userId, i);
    }
  }

  const existingLivestock = db.prepare('SELECT COUNT(*) as count FROM pet_farm_livestock WHERE user_id = ?').get(userId) as any;
  if (!existingLivestock || existingLivestock.count === 0) {
    db.prepare(`
      INSERT OR IGNORE INTO pet_farm_livestock (id, user_id, animal_type, produced_count)
      VALUES (?, ?, 'chicken', 0)
    `).run(`live-${userId}-chicken`, userId);

    db.prepare(`
      INSERT OR IGNORE INTO pet_farm_livestock (id, user_id, animal_type, produced_count)
      VALUES (?, ?, 'cow', 0)
    `).run(`live-${userId}-cow`, userId);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    const auth = getAuthenticatedUser(request, requestedUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }

    let userId = auth.userId;
    if (auth.status === 'unauthorized' && requestedUserId) {
      const targetUser = db.prepare('SELECT id, username, display_name, avatar, streak, exp, level, coins, status FROM users WHERE id = ?').get(requestedUserId) as any;
      if (targetUser && targetUser.status !== 'disabled') {
        userId = targetUser.id;
      } else {
        return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
      }
    } else if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền truy cập.' }, { status: 403 });
    }

    let user = db.prepare('SELECT id, username, display_name, avatar, streak, exp, level, coins, status FROM users WHERE id = ?').get(userId) as any;
    const pet = ensurePet(userId);
    ensureFarmAndLivestock(userId);

    const inventory = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ?').all(userId);
    const gardenDecor = db.prepare('SELECT * FROM pet_garden_decor WHERE user_id = ? ORDER BY slot_index ASC').all(userId);

    // Farm Plots & Livestock state
    const farmPlots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? ORDER BY plot_index ASC').all(userId);
    const livestock = db.prepare('SELECT * FROM pet_farm_livestock WHERE user_id = ?').all(userId);

    // Social Friends, Couple and Recent Chat Messages
    const dbFriends = db.prepare('SELECT friend_id FROM user_friends WHERE user_id = ?').all(userId) as { friend_id: string }[];
    const friendIdSet = new Set(dbFriends.map((f) => f.friend_id));

    // Couple status
    const coupleRow = db.prepare(`
      SELECT * FROM user_couples WHERE user_id_1 = ? OR user_id_2 = ? LIMIT 1
    `).get(userId, userId) as any;

    // Recent Global Pet Chat
    const recentChat = db.prepare(`
      SELECT * FROM pet_chat_messages ORDER BY created_at DESC LIMIT 20
    `).all().reverse();

    const petMeta = PETS_CATALOG[pet.pet_type] || PETS_CATALOG.owl;

    return NextResponse.json({
      success: true,
      user,
      pet: {
        ...pet,
        meta: petMeta,
      },
      inventory,
      gardenDecor,
      farmPlots,
      livestock,
      friendIds: Array.from(friendIdSet),
      couple: coupleRow || null,
      recentChat,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pet API error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `pet_post:${clientIp}`,
      maxAttempts: 60,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất thao tác thú cưng quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const {
      userId: rawUserId,
      action,
      itemId,
      petType,
      habitatId,
      slotIndex,
      decorId
    } = body;

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }

    let userId = auth.userId;
    if (auth.status === 'unauthorized' && rawUserId) {
      const targetUser = db.prepare('SELECT id, status FROM users WHERE id = ?').get(rawUserId) as any;
      if (targetUser && targetUser.status !== 'disabled') {
        userId = targetUser.id;
      } else {
        return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để chăm sóc thú cưng.' }, { status: 401 });
      }
    } else if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để chăm sóc thú cưng.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền thao tác trên thú cưng của người khác (IDOR).' }, { status: 403 });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const pet = ensurePet(userId);

    // 1. ACTION: PETTING / VUỐT VE
    if (action === 'pet') {
      const newHappiness = Math.min(100, (pet.happiness || 80) + 5);
      const newExp = (pet.exp || 0) + 4;
      const newLevel = Math.floor(newExp / 50) + 1;

      db.prepare(`
        UPDATE user_pets
        SET happiness = ?, exp = ?, level = ?, last_interacted_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(newHappiness, newExp, newLevel, userId);

      const updatedPet = ensurePet(userId);
      void syncDbToS3Now();
      return NextResponse.json({
        success: true,
        message: 'Thú cưng cực kỳ vui vẻ khi được bạn vuốt ve!',
        pet: updatedPet,
      });
    }

    // 2. ACTION: FEED / CHO ĂN
    if (action === 'feed') {
      const food = SHOP_ITEMS.find((i) => i.id === itemId && i.type === 'food');
      if (!food) {
        return NextResponse.json({ error: 'Món ăn không hợp lệ' }, { status: 400 });
      }

      // Check if user has food in inventory or buy directly with coins
      const inv = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId) as any;
      if (!inv || inv.quantity <= 0) {
        // Atomic deduction with guard: coins >= food.price to eliminate race conditions
        const updateResult = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(food.price, userId, food.price);
        if (updateResult.changes === 0) {
          return NextResponse.json({ error: 'Không đủ Coins để mua món ăn này!' }, { status: 400 });
        }

        const freshUser = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as any;
        const remainingCoins = freshUser?.coins || 0;

        // Record coin transaction
        const txId = `tx-${userId}-${Date.now()}`;
        db.prepare(`
          INSERT INTO coin_transactions (id, user_id, amount, balance_after, reason)
          VALUES (?, ?, ?, ?, ?)
        `).run(txId, userId, -food.price, remainingCoins, `Cho thú cưng ăn: ${food.name}`);
      } else {
        // Consume from inventory
        if (inv.quantity > 1) {
          db.prepare('UPDATE pet_inventory SET quantity = quantity - 1 WHERE id = ?').run(inv.id);
        } else {
          db.prepare('DELETE FROM pet_inventory WHERE id = ?').run(inv.id);
        }
      }

      const hungerGain = food.hungerBoost || 20;
      const happyGain = food.happinessBoost || 10;
      const energyGain = food.energyBoost || 15;
      const expGain = food.expBoost || 10;

      const newHunger = Math.min(100, (pet.hunger || 50) + hungerGain);
      const newHappy = Math.min(100, (pet.happiness || 50) + happyGain);
      const newEnergy = Math.min(100, (pet.energy || 50) + energyGain);
      const newExp = (pet.exp || 0) + expGain;
      const newLevel = Math.floor(newExp / 50) + 1;

      db.prepare(`
        UPDATE user_pets
        SET hunger = ?, happiness = ?, energy = ?, exp = ?, level = ?, last_fed_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(newHunger, newHappy, newEnergy, newExp, newLevel, userId);

      const updatedUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId);
      const updatedPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã cho thú cưng ăn ${food.name}! Bụng no tròn và thêm năng lượng!`,
        pet: updatedPet,
        user: updatedUser,
        boosts: {
          hunger: hungerGain,
          happiness: happyGain,
          energy: energyGain,
          exp: expGain,
        },
      });
    }

    // 3. ACTION: EQUIP / MẶC TRANG BỊ
    if (action === 'equip') {
      const itemType = body.itemType; // Optional explicit type for unequipping

      if (itemId === 'none') {
        if (itemType === 'hat') {
          db.prepare('UPDATE user_pets SET equipped_hat = ? WHERE user_id = ?').run('none', userId);
        } else if (itemType === 'outfit') {
          db.prepare('UPDATE user_pets SET equipped_outfit = ? WHERE user_id = ?').run('none', userId);
        } else if (itemType === 'accessory') {
          db.prepare('UPDATE user_pets SET equipped_accessory = ? WHERE user_id = ?').run('none', userId);
        }
        const updatedPet = ensurePet(userId);
        void syncDbToS3Now();
        return NextResponse.json({
          success: true,
          message: 'Đã tháo trang bị khỏi thú cưng!',
          pet: updatedPet,
        });
      }

      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item) {
        return NextResponse.json({ error: 'Vật phẩm không tồn tại' }, { status: 400 });
      }

      // Check ownership
      const owned = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId);
      if (!owned) {
        return NextResponse.json({ error: 'Bạn chưa sở hữu vật phẩm này!' }, { status: 400 });
      }

      if (item.type === 'hat') {
        const nextHat = pet.equipped_hat === itemId ? 'none' : itemId;
        db.prepare('UPDATE user_pets SET equipped_hat = ? WHERE user_id = ?').run(nextHat, userId);
      } else if (item.type === 'outfit') {
        const nextOutfit = pet.equipped_outfit === itemId ? 'none' : itemId;
        db.prepare('UPDATE user_pets SET equipped_outfit = ? WHERE user_id = ?').run(nextOutfit, userId);
      } else if (item.type === 'accessory') {
        const nextAcc = pet.equipped_accessory === itemId ? 'none' : itemId;
        db.prepare('UPDATE user_pets SET equipped_accessory = ? WHERE user_id = ?').run(nextAcc, userId);
      }

      const updatedPet = ensurePet(userId);
      void syncDbToS3Now();
      return NextResponse.json({
        success: true,
        message: 'Đã thay đổi trang phục cho thú cưng!',
        pet: updatedPet,
      });
    }

    // 4. ACTION: SWITCH PET / ĐỔI THÚ CƯNG
    if (action === 'switch_pet') {
      if (!PETS_CATALOG[petType]) {
        return NextResponse.json({ error: 'Loài thú cưng không hợp lệ' }, { status: 400 });
      }

      if (petType === 'cinnamoroll') {
        const access = checkCinnamorollAccess(user);
        if (!access.isUnlocked) {
          return NextResponse.json({ error: access.message }, { status: 403 });
        }
      }

      const chosenMeta = PETS_CATALOG[petType];
      db.prepare(`
        UPDATE user_pets 
        SET pet_type = ?, pet_name = ?
        WHERE user_id = ?
      `).run(petType, chosenMeta.name, userId);

      const updatedPet = ensurePet(userId);
      void syncDbToS3Now();
      return NextResponse.json({
        success: true,
        message: `Đã đổi bạn đồng hành thành ${chosenMeta.species} ${chosenMeta.name}!`,
        pet: updatedPet,
      });
    }

    // 5. ACTION: CHANGE HABITAT / ĐỔI CẢNH QUAN
    if (action === 'change_habitat') {
      if (habitatId !== 'emerald_garden') {
        const owned = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ? AND item_id = ?').get(userId, habitatId);
        if (!owned) {
          return NextResponse.json({ error: 'Bạn chưa mở khóa cảnh quan này!' }, { status: 400 });
        }
      }

      db.prepare('UPDATE user_pets SET selected_habitat = ? WHERE user_id = ?').run(habitatId, userId);
      const updatedPet = ensurePet(userId);
      void syncDbToS3Now();
      return NextResponse.json({
        success: true,
        message: 'Đã chuyển cảnh quan khu vườn thành công!',
        pet: updatedPet,
      });
    }

    // 6. ACTION: PLACE DECOR / ĐẶT ĐỒ TRANG TRÍ
    if (action === 'place_decor') {
      const parsedSlot = parseInt(slotIndex, 10);
      if (isNaN(parsedSlot) || parsedSlot < 1 || parsedSlot > 4) {
        return NextResponse.json({ error: 'Vị trí trang trí không hợp lệ (1-4)' }, { status: 400 });
      }

      const cleanDecorId = sanitizeText(decorId || '');

      if (cleanDecorId === 'none') {
        db.prepare('DELETE FROM pet_garden_decor WHERE user_id = ? AND slot_index = ?').run(userId, parsedSlot);
      } else {
        const owned = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ? AND item_id = ?').get(userId, cleanDecorId);
        if (!owned) {
          return NextResponse.json({ error: 'Bạn chưa sở hữu đồ trang trí này!' }, { status: 400 });
        }

        db.prepare(`
          INSERT INTO pet_garden_decor (id, user_id, decor_id, slot_index, placed_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id, slot_index)
          DO UPDATE SET decor_id = excluded.decor_id, placed_at = CURRENT_TIMESTAMP
        `).run(`decor-${userId}-slot-${parsedSlot}`, userId, cleanDecorId, parsedSlot);
      }

      const gardenDecor = db.prepare('SELECT * FROM pet_garden_decor WHERE user_id = ? ORDER BY slot_index ASC').all(userId);
      void syncDbToS3Now();
      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật trang trí khu vườn!',
        gardenDecor,
      });
    }

    // 7. ACTION: PLANT CROP / GIEO HẠT NÔNG TRẠI
    if (action === 'plant_crop') {
      const parsedPlot = parseInt(body.plotIndex, 10);
      if (isNaN(parsedPlot) || parsedPlot < 0 || parsedPlot > 7) {
        return NextResponse.json({ error: 'Luống đất không hợp lệ (0-7)' }, { status: 400 });
      }

      const crop = CROPS_CATALOG[body.cropType] || CROPS_CATALOG.carrot;
      const coinUpdate = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(crop.seedPrice, userId, crop.seedPrice);
      if (coinUpdate.changes === 0) {
        return NextResponse.json({ error: `Không đủ Coins để mua hạt giống ${crop.name} (${crop.seedPrice} xu)!` }, { status: 400 });
      }

      const now = Date.now();
      const harvestReadyAt = String(now + crop.growthTimeSeconds * 1000);

      db.prepare(`
        INSERT INTO pet_farm_plots (id, user_id, plot_index, crop_type, stage, planted_at, harvest_ready_at)
        VALUES (?, ?, ?, ?, 'growing', ?, ?)
        ON CONFLICT(user_id, plot_index)
        DO UPDATE SET crop_type = excluded.crop_type, stage = 'growing', planted_at = excluded.planted_at, harvest_ready_at = excluded.harvest_ready_at
      `).run(`plot-${userId}-${parsedPlot}`, userId, parsedPlot, crop.id, String(now), harvestReadyAt);

      const farmPlots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? ORDER BY plot_index ASC').all(userId);
      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã gieo hạt ${crop.name} vào luống #${parsedPlot + 1}!`,
        farmPlots,
        userCoins: freshUser?.coins || 0,
      });
    }

    // 8. ACTION: WATER CROPS / TƯỚI NƯỚC
    if (action === 'water_crop') {
      const now = Date.now();
      if (body.plotIndex === 'all') {
        const plots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ?').all(userId) as any[];
        for (const p of plots) {
          if (p.crop_type && p.harvest_ready_at) {
            const currentTarget = parseInt(p.harvest_ready_at, 10);
            const remaining = Math.max(0, currentTarget - now);
            const boostedTarget = String(now + Math.floor(remaining * 0.65)); // 35% speedup
            db.prepare('UPDATE pet_farm_plots SET watered_at = ?, harvest_ready_at = ? WHERE id = ?').run(String(now), boostedTarget, p.id);
          }
        }
      } else {
        const parsedPlot = parseInt(body.plotIndex, 10);
        const p = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? AND plot_index = ?').get(userId, parsedPlot) as any;
        if (p && p.harvest_ready_at) {
          const currentTarget = parseInt(p.harvest_ready_at, 10);
          const remaining = Math.max(0, currentTarget - now);
          const boostedTarget = String(now + Math.floor(remaining * 0.65));
          db.prepare('UPDATE pet_farm_plots SET watered_at = ?, harvest_ready_at = ? WHERE id = ?').run(String(now), boostedTarget, p.id);
        }
      }

      const farmPlots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? ORDER BY plot_index ASC').all(userId);
      void syncDbToS3Now();
      return NextResponse.json({
        success: true,
        message: 'Đã tưới nước mát rượi cho cây trồng! Tốc độ lớn tăng vọt!',
        farmPlots,
      });
    }

    // 9. ACTION: HARVEST CROP / THU HOẠCH LUỐNG
    if (action === 'harvest_crop') {
      const parsedPlot = parseInt(body.plotIndex, 10);
      const plot = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? AND plot_index = ?').get(userId, parsedPlot) as any;
      if (!plot || !plot.crop_type) {
        return NextResponse.json({ error: 'Luống đất đang trống!' }, { status: 400 });
      }

      const crop = CROPS_CATALOG[plot.crop_type] || CROPS_CATALOG.carrot;
      const earnedCoins = crop.harvestCoins;
      const earnedExp = crop.harvestExp;

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(earnedCoins, earnedExp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(earnedExp, userId);
      db.prepare("UPDATE pet_farm_plots SET crop_type = null, stage = 'empty', planted_at = null, watered_at = null, harvest_ready_at = null WHERE id = ?").run(plot.id);

      const farmPlots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? ORDER BY plot_index ASC').all(userId);
      const freshUser = db.prepare('SELECT id, coins, exp FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Thu hoạch thành công ${crop.name}! Nhận +${earnedCoins} Coins & +${earnedExp} EXP!`,
        farmPlots,
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 10. ACTION: HARVEST ALL CROPS / THU HOẠCH TOÀN BỘ
    if (action === 'harvest_all_crops') {
      const now = Date.now();
      const plots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ?').all(userId) as any[];
      let totalCoins = 0;
      let totalExp = 0;
      let count = 0;

      for (const p of plots) {
        if (p.crop_type && p.harvest_ready_at) {
          const readyTime = parseInt(p.harvest_ready_at, 10);
          if (now >= readyTime || p.stage === 'ripe') {
            const crop = CROPS_CATALOG[p.crop_type] || CROPS_CATALOG.carrot;
            totalCoins += crop.harvestCoins;
            totalExp += crop.harvestExp;
            count++;
            db.prepare("UPDATE pet_farm_plots SET crop_type = null, stage = 'empty', planted_at = null, watered_at = null, harvest_ready_at = null WHERE id = ?").run(p.id);
          }
        }
      }

      if (count > 0) {
        db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(totalCoins, totalExp, userId);
        db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(totalExp, userId);
      }

      const farmPlots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? ORDER BY plot_index ASC').all(userId);
      const freshUser = db.prepare('SELECT id, coins, exp FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: count > 0 ? `Đã thu hoạch ${count} luống rau quả chín mọng! Nhận +${totalCoins} Coins & +${totalExp} EXP!` : 'Chưa có luống rau nào chín để thu hoạch!',
        farmPlots,
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 11. ACTION: FEED LIVESTOCK / CHĂN NUÔI GÀ & BÒ
    if (action === 'feed_livestock') {
      const animalType = body.animalType === 'cow' ? 'cow' : 'chicken';
      const animal = LIVESTOCK_CATALOG[animalType];

      const coinUpdate = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(animal.feedPrice, userId, animal.feedPrice);
      if (coinUpdate.changes === 0) {
        return NextResponse.json({ error: `Không đủ Coins để mua thức ăn cho ${animal.name} (${animal.feedPrice} xu)!` }, { status: 400 });
      }

      const now = Date.now();
      const readyAt = String(now + animal.cycleSeconds * 1000);

      db.prepare(`
        INSERT INTO pet_farm_livestock (id, user_id, animal_type, fed_at, ready_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, animal_type)
        DO UPDATE SET fed_at = excluded.fed_at, ready_at = excluded.ready_at
      `).run(`live-${userId}-${animalType}`, userId, animalType, String(now), readyAt);

      const livestock = db.prepare('SELECT * FROM pet_farm_livestock WHERE user_id = ?').all(userId);
      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã cho ${animal.name} ăn no nê! Đang chờ sản xuất ${animal.produceName}!`,
        livestock,
        userCoins: freshUser?.coins || 0,
      });
    }

    // 12. ACTION: HARVEST LIVESTOCK / THU HOẠCH TRỨNG & SỮA
    if (action === 'harvest_livestock') {
      const animalType = body.animalType === 'cow' ? 'cow' : 'chicken';
      const animal = LIVESTOCK_CATALOG[animalType];

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(animal.rewardCoins, animal.rewardExp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(animal.rewardExp, userId);
      db.prepare(`
        UPDATE pet_farm_livestock 
        SET fed_at = null, ready_at = null, produced_count = produced_count + 1 
        WHERE user_id = ? AND animal_type = ?
      `).run(userId, animalType);

      const livestock = db.prepare('SELECT * FROM pet_farm_livestock WHERE user_id = ?').all(userId);
      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã thu hoạch ${animal.produceName}! Nhận +${animal.rewardCoins} Coins & +${animal.rewardExp} EXP!`,
        livestock,
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 13. ACTION: CLAIM PVP BATTLE REWARD / THƯỞNG ĐẤU TRƯỜNG
    if (action === 'claim_pvp_reward') {
      const rewardCoins = Math.min(500, Math.max(10, parseInt(body.rewardCoins || '100', 10)));
      const rewardExp = Math.min(250, Math.max(10, parseInt(body.rewardExp || '50', 10)));

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(rewardCoins, rewardExp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(rewardExp, userId);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Vinh quang Đấu Trường Thú Cưng! Nhận +${rewardCoins} Coins & +${rewardExp} EXP!`,
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 14. ACTION: CLAIM RACING REWARD / THƯỞNG ĐUA THÚ CƯNG
    if (action === 'claim_racing_reward') {
      const rewardCoins = Math.min(1500, Math.max(10, parseInt(body.rewardCoins || '150', 10)));
      const rewardExp = Math.min(200, Math.max(10, parseInt(body.rewardExp || '40', 10)));

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(rewardCoins, rewardExp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(rewardExp, userId);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đua Thú Cưng đại thắng! Nhận +${rewardCoins} Coins & +${rewardExp} EXP!`,
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 15. ACTION: SEND CHAT / TRÒ CHUYỆN CỘNG ĐỒNG
    if (action === 'send_chat') {
      const cleanMsg = sanitizeText(body.message || '').slice(0, 150).trim();
      if (!cleanMsg) {
        return NextResponse.json({ error: 'Nội dung chat không được để trống!' }, { status: 400 });
      }

      const msgId = `chat-${userId}-${Date.now()}`;
      db.prepare(`
        INSERT INTO pet_chat_messages (id, user_id, username, display_name, pet_type, message)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(msgId, userId, user.username, user.display_name, pet.pet_type, cleanMsg);

      const recentChat = db.prepare(`
        SELECT * FROM pet_chat_messages ORDER BY created_at DESC LIMIT 20
      `).all().reverse();

      return NextResponse.json({
        success: true,
        recentChat,
        sentMessage: cleanMsg,
      });
    }

    // 16. ACTION: ADD FRIEND / KẾT BẠN
    if (action === 'add_friend') {
      const friendId = sanitizeText(body.friendId || '');
      if (friendId && friendId !== userId) {
        db.prepare(`
          INSERT OR IGNORE INTO user_friends (id, user_id, friend_id, status)
          VALUES (?, ?, ?, 'accepted')
        `).run(`friend-${userId}-${friendId}`, userId, friendId);
      }

      const dbFriends = db.prepare('SELECT friend_id FROM user_friends WHERE user_id = ?').all(userId) as { friend_id: string }[];
      return NextResponse.json({
        success: true,
        message: 'Đã thêm bạn vào danh sách bằng hữu!',
        friendIds: dbFriends.map((f) => f.friend_id),
      });
    }

    // 17. ACTION: PROPOSE COUPLE / KẾT ĐÔI & HÔN LỄ
    if (action === 'propose_couple') {
      const partnerId = sanitizeText(body.partnerId || '');
      const ring = WEDDING_RINGS.find((r) => r.id === body.ringId) || WEDDING_RINGS[0];

      const coinUpdate = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(ring.price, userId, ring.price);
      if (coinUpdate.changes === 0) {
        return NextResponse.json({ error: `Không đủ Coins để mua ${ring.name} (${ring.price} xu)!` }, { status: 400 });
      }

      const coupleId = `couple-${userId}-${partnerId || 'partner'}`;
      db.prepare(`
        INSERT INTO user_couples (id, user_id_1, user_id_2, ring_type, love_points)
        VALUES (?, ?, ?, ?, 100)
        ON CONFLICT(user_id_1, user_id_2)
        DO UPDATE SET ring_type = excluded.ring_type, love_points = love_points + 50
      `).run(coupleId, userId, partnerId || 'friend_mai_xuan', ring.id);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const coupleRow = db.prepare(`
        SELECT * FROM user_couples WHERE user_id_1 = ? OR user_id_2 = ? LIMIT 1
      `).get(userId, userId) as any;
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Chúc mừng! Lễ kết đôi với ${ring.name} đã thành công mỹ mãn! 💍💖`,
        couple: coupleRow,
        userCoins: freshUser?.coins || 0,
      });
    }

    return NextResponse.json({ error: 'Hành động không được hỗ trợ' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pet action error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

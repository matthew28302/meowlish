import { NextResponse } from 'next/server';
import { db, sanitizeText } from '@/lib/db';
import { PETS_CATALOG, SHOP_ITEMS, checkCinnamorollAccess } from '@/lib/petData';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';

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
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền truy cập.' }, { status: 403 });
    }

    const userId = auth.userId;

    let user = db.prepare('SELECT id, username, display_name, avatar, streak, exp, level, coins, status FROM users WHERE id = ?').get(userId) as any;
    const pet = ensurePet(userId);
    const inventory = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ?').all(userId);
    const gardenDecor = db.prepare('SELECT * FROM pet_garden_decor WHERE user_id = ? ORDER BY slot_index ASC').all(userId);

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
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để chăm sóc thú cưng.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền thao tác trên thú cưng của người khác (IDOR).' }, { status: 403 });
    }

    const userId = auth.userId;
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
      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật trang trí khu vườn!',
        gardenDecor,
      });
    }

    return NextResponse.json({ error: 'Hành động không được hỗ trợ' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pet action error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

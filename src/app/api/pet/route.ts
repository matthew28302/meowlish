import { NextResponse } from 'next/server';
import { db, sanitizeText, claimTimedReward, rewardCooldownRemaining, REWARD_CATALOG } from '@/lib/db';
import { PETS_CATALOG, SHOP_ITEMS } from '@/lib/petData';
import { checkCinnamorollAccess } from '@/lib/cinnamorollAccess';
import { CROPS_CATALOG, LIVESTOCK_CATALOG } from '@/lib/petFarmData';
import { WEDDING_RINGS, MOCK_COMMUNITY_USERS } from '@/lib/petSocialData';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import { syncDbToS3Now, refreshIfRemoteNewer } from '@/lib/s3Sync';

/** Khoảng nghỉ giữa hai lần tưới cùng một luống (chống tưới lặp để làm cây chín tức thì). */
const WATER_COOLDOWN_MS = 60 * 1000;

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

// ============================================================
// SERVER-SIDE LIVESTOCK PRODUCTION CYCLES (CHU KỲ CHĂN NUÔI)
// Chu kỳ mặc định bắt buộc: GÀ = 3 GIỜ, BÒ = 24 GIỜ.
// Chỉ được rút ngắn khi set env FARM_CYCLE_TEST (đơn vị: giây) — dùng cho test.
// ============================================================
const LIVESTOCK_CYCLE_SECONDS: Record<'chicken' | 'cow', number> = {
  chicken: 3 * 60 * 60, // 3 giờ = 10800 giây
  cow: 24 * 60 * 60,    // 24 giờ = 86400 giây
};

/** Định dạng đồng hồ đếm ngược dạng 3:00:00 / 12:45 */
function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function resolveCycleSeconds(animalType: 'chicken' | 'cow'): number {
  const raw = process.env.FARM_CYCLE_TEST;
  if (raw) {
    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.max(1, Math.floor(seconds));
    }
  }
  return LIVESTOCK_CYCLE_SECONDS[animalType];
}

type LivestockStatus = 'idle' | 'producing' | 'ready';

function ensureLivestockProductionColumns() {
  try {
    const cols = db.prepare('PRAGMA table_info(pet_farm_livestock)').all() as { name: string }[];
    const names = new Set(cols.map((c) => c.name));
    const addColumn = (ddl: string) => {
      try {
        db.prepare(ddl).run();
      } catch {
        // cột đã tồn tại / DB khác cấu trúc — bỏ qua
      }
    };
    if (!names.has('last_fed_at')) addColumn('ALTER TABLE pet_farm_livestock ADD COLUMN last_fed_at TEXT');
    if (!names.has('producing_until')) addColumn('ALTER TABLE pet_farm_livestock ADD COLUMN producing_until TEXT');
    if (!names.has('cycle_seconds')) addColumn('ALTER TABLE pet_farm_livestock ADD COLUMN cycle_seconds INTEGER');
  } catch {
    // bảng chưa sẵn sàng — ensureFarmAndLivestock sẽ xử lý sau
  }
}

function readLivestockRow(userId: string, animalType: 'chicken' | 'cow') {
  return db.prepare('SELECT * FROM pet_farm_livestock WHERE user_id = ? AND animal_type = ?').get(userId, animalType) as any;
}

function livestockEndAt(row: any): number | null {
  const raw = row?.producing_until ?? row?.ready_at ?? null;
  if (!raw) return null;
  const end = Number(raw);
  return Number.isFinite(end) ? end : null;
}

function livestockStartAt(row: any): number | null {
  const raw = row?.last_fed_at ?? row?.fed_at ?? null;
  if (!raw) return null;
  const start = Number(raw);
  return Number.isFinite(start) ? start : null;
}

function livestockStatusOf(row: any, now: number = Date.now()): LivestockStatus {
  const end = livestockEndAt(row);
  if (end === null) return 'idle';
  return now >= end ? 'ready' : 'producing';
}

/** Trang trí livestock row thêm status / countdown để client vẽ thanh tiến trình. */
function decorateLivestock(rows: any[], now: number = Date.now()) {
  return (rows || []).map((row) => {
    const type: 'chicken' | 'cow' = row.animal_type === 'cow' ? 'cow' : 'chicken';
    const status = livestockStatusOf(row, now);
    const end = livestockEndAt(row);
    const start = livestockStartAt(row);
    let totalSeconds = Number(row?.cycle_seconds) || resolveCycleSeconds(type);
    if (end !== null && start !== null && end > start) {
      totalSeconds = Math.round((end - start) / 1000);
    }
    const remaining = status === 'producing' && end !== null ? Math.max(0, Math.ceil((end - now) / 1000)) : 0;
    const progress = totalSeconds > 0 && status === 'producing' && end !== null && start !== null
      ? Math.min(1, Math.max(0, (now - start) / (end - start)))
      : status === 'ready' ? 1 : 0;
    return {
      ...row,
      status,
      remaining_seconds: remaining,
      total_seconds: totalSeconds,
      progress,
      server_time: now,
    };
  });
}

function allLivestockFor(userId: string, now: number = Date.now()) {
  return decorateLivestock(
    db.prepare('SELECT * FROM pet_farm_livestock WHERE user_id = ?').all(userId) as any[],
    now
  );
}

function ensureFarmAndLivestock(userId: string) {
  ensureLivestockProductionColumns();
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

/**
 * 60s thay vì mặc định 10s của Vercel.
 *
 * Các route này có thể phải đẩy file SQLite ~67MB lên Filebase S3. Đo được:
 * ~5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s. Trượt mặc định 10s ⇒ upload bị
 * cắt giữa chừng ⇒ dữ liệu mất. 60s là trần của gói Vercel Hobby.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Làm tươi DB từ Filebase nếu instance này đang giữ bản cũ (throttle 15s) —
    // triệu chứng "user A tạo phòng nhưng user B không thấy" là do 2 request
    // chạy trên 2 instance /tmp khác nhau, bản của instance B chưa có phòng.
    await refreshIfRemoteNewer('pet-get');

    const auth = getAuthenticatedUser(request, requestedUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({
        error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
        status: 'disabled',
      }, { status: 403 });
    }

    // KHÔNG tự tra DB bằng requestedUserId khi chưa xác thực — đó là IDOR: bất kỳ
    // ai cũng đọc được pet/inventory/coins của người khác chỉ bằng cách gửi
    // ?userId=<id nạn nhân>. Đã xác nhận lỗ hổng này trên production.
    if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền truy cập.' }, { status: 403 });
    }
    const userId = auth.userId;

    let user = db.prepare('SELECT id, username, display_name, avatar, streak, exp, level, coins, status FROM users WHERE id = ?').get(userId) as any;
    const pet = ensurePet(userId);
    ensureFarmAndLivestock(userId);

    const inventory = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ?').all(userId);
    const gardenDecor = db.prepare('SELECT * FROM pet_garden_decor WHERE user_id = ? ORDER BY slot_index ASC').all(userId);

    // Farm Plots & Livestock state
    const farmPlots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? ORDER BY plot_index ASC').all(userId);
    const livestock = allLivestockFor(userId);

    // 1. Accepted Friends with rich profile info
    const acceptedFriends = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.display_name, 
        u.avatar, 
        u.coins, 
        u.exp, 
        u.level as user_level, 
        COALESCE(p.pet_type, 'owl') as pet_type, 
        COALESCE(p.pet_name, 'Lexi Trí Tuệ') as pet_name, 
        COALESCE(p.level, 1) as pet_level
      FROM user_friends f
      JOIN users u ON (u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END)
      LEFT JOIN user_pets p ON p.user_id = u.id
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
    `).all(userId, userId, userId);

    // 2. Incoming Friend Requests (Others asked me)
    const incomingFriendRequests = db.prepare(`
      SELECT 
        f.id as request_id,
        u.id, 
        u.username, 
        u.display_name, 
        u.avatar, 
        COALESCE(p.pet_type, 'owl') as pet_type, 
        COALESCE(p.pet_name, 'Lexi Trí Tuệ') as pet_name, 
        COALESCE(p.level, 1) as pet_level,
        f.created_at
      FROM user_friends f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN user_pets p ON p.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `).all(userId);

    // 3. Outgoing Friend Requests (I asked others)
    const outgoingFriendRequests = db.prepare(`
      SELECT friend_id FROM user_friends WHERE user_id = ? AND status = 'pending'
    `).all(userId) as { friend_id: string }[];

    // 4. Real Community Users (For finding & adding friends - NO FAKE BOTS!)
    const communityUsers = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.display_name, 
        u.avatar, 
        u.level as user_level, 
        COALESCE(p.pet_type, 'owl') as pet_type, 
        COALESCE(p.pet_name, 'Lexi Trí Tuệ') as pet_name, 
        COALESCE(p.level, 1) as pet_level
      FROM users u
      LEFT JOIN user_pets p ON p.user_id = u.id
      WHERE u.id != ? AND u.status != 'disabled'
      ORDER BY u.exp DESC
      LIMIT 25
    `).all(userId);

    // 5. Couple Status & Incoming Proposals
    const coupleRow = db.prepare(`
      SELECT 
        c.*,
        u1.display_name as user_1_name,
        u2.display_name as user_2_name,
        p1.pet_type as user_1_pet,
        p2.pet_type as user_2_pet
      FROM user_couples c
      LEFT JOIN users u1 ON u1.id = c.user_id_1
      LEFT JOIN users u2 ON u2.id = c.user_id_2
      LEFT JOIN user_pets p1 ON p1.user_id = c.user_id_1
      LEFT JOIN user_pets p2 ON p2.user_id = c.user_id_2
      WHERE (c.user_id_1 = ? OR c.user_id_2 = ?) AND c.status = 'accepted'
      LIMIT 1
    `).get(userId, userId) as any;

    const incomingProposal = db.prepare(`
      SELECT 
        c.*,
        u.display_name as proposer_name,
        u.username as proposer_username,
        u.avatar as proposer_avatar,
        COALESCE(p.pet_type, 'owl') as proposer_pet_type,
        COALESCE(p.pet_name, 'Lexi') as proposer_pet_name
      FROM user_couples c
      JOIN users u ON u.id = c.proposer_id
      LEFT JOIN user_pets p ON p.user_id = u.id
      WHERE (c.user_id_1 = ? OR c.user_id_2 = ?) AND c.proposer_id != ? AND c.status = 'pending'
      LIMIT 1
    `).get(userId, userId, userId) as any;

    // 6. Active Battle & Racing Rooms (Real rooms only!)
    const activeRooms = db.prepare(`
      SELECT * FROM pet_battle_rooms 
      WHERE status = 'waiting' 
      ORDER BY created_at DESC 
      LIMIT 15
    `).all();

    // 7. Recent Global Pet Chat
    const recentChat = db.prepare(`
      SELECT * FROM pet_chat_messages ORDER BY created_at DESC LIMIT 30
    `).all().reverse();

    const requestedRoomId = searchParams.get('roomId');
    let roomDetail = null;
    if (requestedRoomId) {
      roomDetail = db.prepare('SELECT * FROM pet_battle_rooms WHERE id = ?').get(requestedRoomId) || null;
    }

    const petMeta = PETS_CATALOG[pet.pet_type] || PETS_CATALOG.owl;

    return NextResponse.json({
      success: true,
      user,
      // Cờ quyền thú cưng đặc quyền do SERVER tính. Client không được tự tính:
      // việc đó đòi hỏi biết danh sách email được cấp quyền, mà danh sách đó
      // không được phép nằm trong bundle client (PII thật — đã từng bị lộ).
      //
      // Khách (guest) phải nhận `locked_not_logged_in` chứ không phải
      // `locked_unauthorized_email`: hàng demo trong DB không có email nên hàm
      // trả về "email không hợp lệ", khiến UI rơi vào nhánh "chỉ dành cho quản
      // trị viên" với nút Đóng, không có đường đăng nhập. Trạng thái
      // `locked_not_logged_in` mới đúng và có sẵn thông điệp mời đăng nhập.
      cinnamorollAccess: auth.isGuest
        ? { isUnlocked: false, status: 'locked_not_logged_in' as const, message: '' }
        : checkCinnamorollAccess(auth.user as any),
      // Cờ cho UI biết đang hiển thị dữ liệu tài khoản demo dùng chung, để không
      // trộn lẫn với dữ liệu cá nhân của người dùng.
      isGuest: auth.isGuest,
      pet: {
        ...pet,
        meta: petMeta,
      },
      roomDetail,
      inventory,
      gardenDecor,
      farmPlots,
      livestock,
      serverNow: Date.now(),
      acceptedFriends,
      incomingFriendRequests,
      outgoingFriendIds: outgoingFriendRequests.map((f) => f.friend_id),
      communityUsers,
      couple: coupleRow || null,
      incomingProposal: incomingProposal || null,
      activeRooms,
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

    // Xem chú thích ở GET: không tự tra DB bằng userId do client gửi (IDOR).
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

      // SET tường minh theo yêu cầu của client (tuyệt đối không toggle theo DB:
      // client đã tính trạng thái đích từ UI, toggle 2 phía gây mặc-thành-tháo
      // khi UI lệch DB). Muốn tháo: client gửi itemId 'none' (nhánh trên).
      if (item.type === 'hat') {
        db.prepare('UPDATE user_pets SET equipped_hat = ? WHERE user_id = ?').run(itemId, userId);
      } else if (item.type === 'outfit') {
        db.prepare('UPDATE user_pets SET equipped_outfit = ? WHERE user_id = ?').run(itemId, userId);
      } else if (item.type === 'accessory') {
        db.prepare('UPDATE user_pets SET equipped_accessory = ? WHERE user_id = ?').run(itemId, userId);
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
      // Cooldown tưới: mỗi luống chỉ tưới được 1 lần trong WATER_COOLDOWN_MS.
      //
      // Vì sao cần: `watered_at` trước đây được GHI nhưng không bao giờ ĐỌC lại,
      // còn mỗi lần tưới nhân thời gian còn lại × 0.65. Gọi liên tục ~11–30 lần
      // làm cây chín tức thì, từ đó vô hiệu hoá hoàn toàn điều kiện "cây đã chín"
      // của `harvest_crop`. Đo được: 39 request → +1920 coins / +560 EXP, 0 giây chờ.
      let watered = 0;
      let skippedCooldown = 0;

      const boostPlot = (p: any) => {
        if (!p?.crop_type || !p?.harvest_ready_at) return;
        const lastWatered = parseInt(p.watered_at, 10);
        if (Number.isFinite(lastWatered) && now - lastWatered < WATER_COOLDOWN_MS) {
          skippedCooldown++;
          return;
        }
        const currentTarget = parseInt(p.harvest_ready_at, 10);
        const remaining = Math.max(0, currentTarget - now);
        const boostedTarget = String(now + Math.floor(remaining * 0.65)); // 35% speedup
        // Conditional UPDATE: chỉ ghi nếu watered_at vẫn chưa đổi kể từ lần đọc.
        // Trước đây UPDATE vô điều kiện → 2 request song song cùng đọc watered_at cũ
        // rồi cùng ghi, vô hiệu hoàn toàn cooldown.
        const result = db.prepare(
          `UPDATE pet_farm_plots
           SET watered_at = ?, harvest_ready_at = ?
           WHERE id = ?
             AND (watered_at IS NULL OR watered_at = '' OR ? - CAST(watered_at AS INTEGER) >= ?)`
        ).run(String(now), boostedTarget, p.id, String(now), WATER_COOLDOWN_MS);
        if (result.changes > 0) watered++;
        else skippedCooldown++;
      };

      if (body.plotIndex === 'all') {
        const plots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ?').all(userId) as any[];
        for (const p of plots) boostPlot(p);
      } else {
        const parsedPlot = parseInt(body.plotIndex, 10);
        const p = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? AND plot_index = ?')
          .get(userId, parsedPlot) as any;
        if (p) boostPlot(p);
      }

      const farmPlots = db.prepare('SELECT * FROM pet_farm_plots WHERE user_id = ? ORDER BY plot_index ASC').all(userId);
      // Chỉ đồng bộ S3 khi thật sự có thay đổi — tránh phình WAL do request vô ích.
      if (watered > 0) void syncDbToS3Now();

      const cooldownMinutes = Math.max(1, Math.round(WATER_COOLDOWN_MS / 60000));
      const message = watered === 0
        ? (skippedCooldown > 0
          ? `Vừa tưới rồi — mỗi luống chỉ tưới được 1 lần mỗi ${cooldownMinutes} phút.`
          : 'Chưa có cây nào cần tưới.')
        : `Đã tưới ${watered} luống! Cây lớn nhanh hơn 35%.`;

      return NextResponse.json({
        success: watered > 0,
        message,
        wateredCount: watered,
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

      // Phải CHÍN mới thu hoạch được. Trước đây nhánh này chỉ kiểm tra có cây,
      // nên gieo xong thu hoạch liền → lặp lại là farm coins vô hạn (nhánh
      // harvest_all_crops ở dưới có kiểm tra, còn nhánh này thì không).
      const readyTime = parseInt(plot.harvest_ready_at, 10);
      const now = Date.now();
      if (!Number.isFinite(readyTime) || (now < readyTime && plot.stage !== 'ripe')) {
        const waitMin = Number.isFinite(readyTime) ? Math.max(1, Math.ceil((readyTime - now) / 60000)) : 1;
        return NextResponse.json(
          { error: `Cây chưa chín! Còn khoảng ${waitMin} phút nữa.`, status: 'not_ready', harvestReadyAt: readyTime || null },
          { status: 409 }
        );
      }

      const crop = CROPS_CATALOG[plot.crop_type] || CROPS_CATALOG.carrot;
      const earnedCoins = crop.harvestCoins;
      const earnedExp = crop.harvestExp;

      // Phải XOÁ LUỐNG trước, có điều kiện, rồi mới trả tiền.
      //
      // Bản trước trả tiền rồi xoá luống ở hai câu lệnh riêng ⇒ 4 request thu hoạch
      // CÙNG một luống chín đều thấy cây còn trên đĩa và đều được trả tiền.
      // Đo được: coins = 200 thay vì 50, cả 4 request đều báo "thành công" — đây là
      // lỗ hổng farm coins, không chỉ là mất tiền oan.
      //
      // Điều kiện `crop_type = ?` đảm bảo chỉ request nào xoá được luống mới được
      // trả tiền, nên request chạy song song chỉ một request thắng.
      const cleared = db
        .prepare(
          "UPDATE pet_farm_plots SET crop_type = null, stage = 'empty', planted_at = null, watered_at = null, harvest_ready_at = null WHERE id = ? AND crop_type = ?"
        )
        .run(plot.id, plot.crop_type).changes;

      if (cleared === 0) {
        return NextResponse.json(
          { error: 'Luống này vừa được thu hoạch bởi một thao tác khác.' },
          { status: 409 }
        );
      }

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(earnedCoins, earnedExp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(earnedExp, userId);

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
            // M6b (audit 2026-10-08): guard `crop_type = ?` giống harvest_crop —
            // chỉ request nào XOÁ được luống mới được tính thu nhập. Trước đây
            // UPDATE vô điều kiện ⇒ 2 instance song song cùng thấy luống chín rồi
            // cùng xoá (cả hai cùng +coins) → trả thưởng nhiều lần cho một luống.
            const cleared = db
              .prepare(
                "UPDATE pet_farm_plots SET crop_type = null, stage = 'empty', planted_at = null, watered_at = null, harvest_ready_at = null WHERE id = ? AND crop_type = ?"
              )
              .run(p.id, p.crop_type).changes;
            if (cleared === 0) continue;
            totalCoins += crop.harvestCoins;
            totalExp += crop.harvestExp;
            count++;
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

    // 11. ACTION: FEED LIVESTOCK / CHĂN NUÔI GÀ & BÒ (SERVER TIMER 3H / 24H)
    if (action === 'feed_livestock') {
      const animalType: 'chicken' | 'cow' = body.animalType === 'cow' ? 'cow' : 'chicken';
      const animal = LIVESTOCK_CATALOG[animalType];

      ensureFarmAndLivestock(userId);

      const now = Date.now();
      const row = readLivestockRow(userId, animalType);
      const status = livestockStatusOf(row, now);
      const endAt = livestockEndAt(row);
      const remainSeconds = status === 'producing' && endAt !== null ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0;

      // KHÓA CHO ĂN: còn chu kỳ sản xuất thì không được cho ăn thêm (không trừ tiền).
      if (status === 'producing') {
        return NextResponse.json({
          error: `${animal.name} đang trong chu kỳ sản xuất — còn ${formatCountdown(remainSeconds)} nữa mới cho ăn tiếp được!`,
          livestock: allLivestockFor(userId),
          blocked: true,
          remainingSeconds: remainSeconds,
        }, { status: 409 });
      }

      // Đã có sản phẩm sẵn sàng thu hoạch — cho ăn sẽ làm mất thu hoạch, nên chặn.
      if (status === 'ready') {
        return NextResponse.json({
          error: `${animal.name} đã sẵn sàng ${animal.produceName}! Hãy thu hoạch trước khi cho ăn đợt mới.`,
          livestock: allLivestockFor(userId),
          blocked: true,
          remainingSeconds: 0,
        }, { status: 409 });
      }

      const coinUpdate = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(animal.feedPrice, userId, animal.feedPrice);
      if (coinUpdate.changes === 0) {
        return NextResponse.json({ error: `Không đủ Coins để mua thức ăn cho ${animal.name} (${animal.feedPrice} xu)!` }, { status: 400 });
      }

      const cycleSeconds = resolveCycleSeconds(animalType);
      const readyAt = String(now + cycleSeconds * 1000);

      db.prepare(`
        INSERT INTO pet_farm_livestock (id, user_id, animal_type, fed_at, ready_at, last_fed_at, producing_until, cycle_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, animal_type)
        DO UPDATE SET
          fed_at = excluded.fed_at,
          ready_at = excluded.ready_at,
          last_fed_at = excluded.last_fed_at,
          producing_until = excluded.producing_until,
          cycle_seconds = excluded.cycle_seconds
      `).run(`live-${userId}-${animalType}`, userId, animalType, String(now), readyAt, String(now), readyAt, cycleSeconds);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      // L6 (audit 2026-10-08): khoản trừ feed cũng phải ghi nhật ký coin_transactions
      // như các khoản chi khác trong route (nhánh feed action). Giữ nguyên phép trừ
      // atomic ở trên (WHERE coins >= ?) — chỉ thêm ghi vết theo cùng format cột:
      // amount âm cho chi tiêu, balance_after là số dư ngay sau khi trừ.
      db.prepare(
        'INSERT INTO coin_transactions (id, user_id, amount, balance_after, reason) VALUES (?, ?, ?, ?, ?)'
      ).run(
        `tx-${userId}-${Date.now()}-${animalType}`,
        userId,
        -animal.feedPrice,
        freshUser?.coins || 0,
        `Cho ${animal.name} ăn — thức ăn cho chu kỳ sản xuất`
      );
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã cho ${animal.name} ăn no nê! ${animal.produceName} sẽ sẵn sàng sau ${formatCountdown(cycleSeconds)}.`,
        livestock: allLivestockFor(userId),
        userCoins: freshUser?.coins || 0,
        cycleSeconds,
      });
    }

    // 12. ACTION: HARVEST LIVESTOCK / THU HOẠCH TRỨNG & SỮA
    if (action === 'harvest_livestock') {
      const animalType: 'chicken' | 'cow' = body.animalType === 'cow' ? 'cow' : 'chicken';
      const animal = LIVESTOCK_CATALOG[animalType];

      ensureFarmAndLivestock(userId);

      const now = Date.now();
      const row = readLivestockRow(userId, animalType);
      const status = livestockStatusOf(row, now);
      const endAt = livestockEndAt(row);
      const remainSeconds = status === 'producing' && endAt !== null ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0;

      // CHƯA CHÍN THÌ KHÔNG CHO THU HOẠCH (server là nguồn sự thật duy nhất).
      if (status !== 'ready') {
        const message = status === 'producing'
          ? `${animal.name} vẫn đang sản xuất — còn ${formatCountdown(remainSeconds)} nữa mới thu hoạch được!`
          : `${animal.name} chưa được cho ăn nên chưa có ${animal.produceName} để thu hoạch!`;
        return NextResponse.json({
          error: message,
          livestock: allLivestockFor(userId),
          blocked: true,
          remainingSeconds: remainSeconds,
        }, { status: 409 });
      }

      // M6: mirror harvest_crop — XOÁ chu kỳ (có điều kiện) TRƯỚC, rồi mới trả
      // thưởng. Trước đây trả thưởng rồi xoá vô điều kiện ⇒ 2 instance song song
      // cùng thấy 'ready' đều được trả thưởng cho cùng một mẻ sản phẩm.
      const clearedCycle = db.prepare(`
        UPDATE pet_farm_livestock 
        SET fed_at = null, ready_at = null, last_fed_at = null, producing_until = null, cycle_seconds = null, produced_count = produced_count + 1 
        WHERE user_id = ? AND animal_type = ?
          AND (producing_until IS NOT NULL OR ready_at IS NOT NULL)
      `).run(userId, animalType).changes;

      if (clearedCycle === 0) {
        return NextResponse.json(
          { error: `${animal.produceName} vừa được thu hoạch bởi một thao tác khác.`, blocked: true, remainingSeconds: 0 },
          { status: 409 }
        );
      }

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(animal.rewardCoins, animal.rewardExp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(animal.rewardExp, userId);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã thu hoạch ${animal.produceName}! Nhận +${animal.rewardCoins} Coins & +${animal.rewardExp} EXP!`,
        livestock: allLivestockFor(userId),
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 12b. ACTION: HARVEST ALL READY LIVESTOCK / THU HOẠCH HẾT SẴN SÀNG
    if (action === 'harvest_all_livestock') {
      ensureFarmAndLivestock(userId);

      const now = Date.now();
      const rows = db.prepare('SELECT * FROM pet_farm_livestock WHERE user_id = ?').all(userId) as any[];
      let totalCoins = 0;
      let totalExp = 0;
      let count = 0;

      for (const row of rows) {
        if (livestockStatusOf(row, now) !== 'ready') continue;
        const animal = LIVESTOCK_CATALOG[row.animal_type === 'cow' ? 'cow' : 'chicken'];
        // M6: guard "còn đang sẵn sàng" giống harvest_all_crops — chỉ request nào
        // xoá được chu kỳ mới được tính thưởng (chống 2 instance cùng +coins cho
        // một mẻ; xong chu kỳ thì các trường ready_at/producing_until đã null).
        const cleared = db.prepare(`
          UPDATE pet_farm_livestock 
          SET fed_at = null, ready_at = null, last_fed_at = null, producing_until = null, cycle_seconds = null, produced_count = produced_count + 1 
          WHERE id = ?
            AND (producing_until IS NOT NULL OR ready_at IS NOT NULL)
        `).run(row.id).changes;
        if (cleared === 0) continue;
        totalCoins += animal.rewardCoins;
        totalExp += animal.rewardExp;
        count++;
      }

      if (count > 0) {
        db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(totalCoins, totalExp, userId);
        db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(totalExp, userId);
      }

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: count > 0
          ? `Đã thu hoạch ${count} mẻ sản phẩm! Nhận +${totalCoins} Coins & +${totalExp} EXP!`
          : 'Chưa có trứng hoặc sữa nào sẵn sàng để thu hoạch!',
        harvested: count,
        livestock: allLivestockFor(userId),
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 13. ACTION: CLAIM PVP BATTLE REWARD / THƯỞNG ĐẤU TRƯỜNG
    if (action === 'claim_pvp_reward') {
      const cooldown = rewardCooldownRemaining(userId, 'pvp');
      if (cooldown > 0) {
        return NextResponse.json(
          { success: false, error: `Chưa đủ thời gian chờ — thử lại sau ${Math.ceil(cooldown / 60000)} phút.` },
          { status: 429 }
        );
      }
      if (!claimTimedReward(userId, 'pvp')) {
        return NextResponse.json({ success: false, error: 'Vừa nhận thưởng này rồi, hãy thử lại sau.' }, { status: 429 });
      }
      const reward = REWARD_CATALOG.pvp;

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(reward.coins, reward.exp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(reward.exp, userId);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Vinh quang Đấu Trường Thú Cưng! Nhận +${reward.coins} Coins & +${reward.exp} EXP!`,
        userCoins: freshUser?.coins || 0,
        pet: freshPet,
      });
    }

    // 14. ACTION: CLAIM RACING REWARD / THƯỞNG ĐUA THÚ CƯNG
    if (action === 'claim_racing_reward') {
      const cooldown = rewardCooldownRemaining(userId, 'racing');
      if (cooldown > 0) {
        return NextResponse.json(
          { success: false, error: `Chưa đủ thời gian chờ — thử lại sau ${Math.ceil(cooldown / 60000)} phút.` },
          { status: 429 }
        );
      }
      if (!claimTimedReward(userId, 'racing')) {
        return NextResponse.json({ success: false, error: 'Vừa nhận thưởng này rồi, hãy thử lại sau.' }, { status: 429 });
      }
      const reward = REWARD_CATALOG.racing;

      db.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(reward.coins, reward.exp, userId);
      db.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(reward.exp, userId);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const freshPet = ensurePet(userId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đua Thú Cưng đại thắng! Nhận +${reward.coins} Coins & +${reward.exp} EXP!`,
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

    // 16. ACTION: SEND FRIEND REQUEST / GỬI LỜI MỜI KẾT BẠN
    if (action === 'send_friend_request') {
      const targetUserId = sanitizeText(body.targetUserId || body.friendId || '');
      if (!targetUserId || targetUserId === userId) {
        return NextResponse.json({ error: 'Không thể gửi lời mời kết bạn cho chính mình!' }, { status: 400 });
      }

      // Check if already friends or already requested
      const existing = db.prepare(`
        SELECT * FROM user_friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `).get(userId, targetUserId, targetUserId, userId) as any;

      if (existing) {
        if (existing.status === 'accepted') {
          return NextResponse.json({ error: 'Hai bạn đã là bạn bè của nhau rồi!' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Lời mời kết bạn đang chờ phản hồi!' }, { status: 400 });
      }

      db.prepare(`
        INSERT INTO user_friends (id, user_id, friend_id, status)
        VALUES (?, ?, ?, 'pending')
      `).run(`freq-${userId}-${targetUserId}-${Date.now()}`, userId, targetUserId);

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Đã gửi lời mời kết bạn! Đang chờ bạn ấy đồng ý nhé.',
      });
    }

    // 17. ACTION: ACCEPT FRIEND REQUEST / ĐỒNG Ý KẾT BẠN
    if (action === 'accept_friend_request') {
      const requestId = sanitizeText(body.requestId || '');
      const requesterId = sanitizeText(body.requesterId || '');

      let updated = 0;
      if (requestId) {
        const res = db.prepare(`
          UPDATE user_friends 
          SET status = 'accepted' 
          WHERE id = ? AND friend_id = ?
        `).run(requestId, userId);
        updated = res.changes;
      } else if (requesterId) {
        const res = db.prepare(`
          UPDATE user_friends 
          SET status = 'accepted' 
          WHERE user_id = ? AND friend_id = ?
        `).run(requesterId, userId);
        updated = res.changes;
      }

      if (updated === 0) {
        return NextResponse.json({ error: 'Không tìm thấy lời mời kết bạn hợp lệ!' }, { status: 404 });
      }

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Chúc mừng! Hai bạn đã chính thức trở thành bằng hữu! 🎉',
      });
    }

    // 18. ACTION: DECLINE FRIEND REQUEST / TỪ CHỐI LỜI MỜI
    if (action === 'decline_friend_request') {
      const requestId = sanitizeText(body.requestId || '');
      const requesterId = sanitizeText(body.requesterId || '');

      if (requestId) {
        db.prepare('DELETE FROM user_friends WHERE id = ? AND friend_id = ?').run(requestId, userId);
      } else if (requesterId) {
        db.prepare('DELETE FROM user_friends WHERE user_id = ? AND friend_id = ?').run(requesterId, userId);
      }

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Đã từ chối lời mời kết bạn.',
      });
    }

    // 19. ACTION: REMOVE FRIEND / HỦY KẾT BẠN
    if (action === 'remove_friend') {
      const friendId = sanitizeText(body.friendId || '');
      if (friendId) {
        db.prepare(`
          DELETE FROM user_friends 
          WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `).run(userId, friendId, friendId, userId);
      }

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Đã xóa bạn khỏi danh sách bằng hữu.',
      });
    }

    // 20. ACTION: PROPOSE COUPLE / GỬI LỜI CẦU HÔN (CẦN ĐƯỢC ĐỒNG Ý)
    if (action === 'propose_couple') {
      const partnerId = sanitizeText(body.partnerId || '');
      if (!partnerId || partnerId === userId) {
        return NextResponse.json({ error: 'Vui lòng chọn một người bạn để gửi lời cầu hôn!' }, { status: 400 });
      }

      // Check if already married
      const existingCouple = db.prepare(`
        SELECT * FROM user_couples 
        WHERE (user_id_1 = ? OR user_id_2 = ? OR user_id_1 = ? OR user_id_2 = ?) AND status = 'accepted'
      `).get(userId, userId, partnerId, partnerId);
      if (existingCouple) {
        return NextResponse.json({ error: 'Một trong hai người đã có đôi có cặp rồi!' }, { status: 400 });
      }

      const ring = WEDDING_RINGS.find((r) => r.id === body.ringId) || WEDDING_RINGS[0];

      // Check Coins
      const coinUpdate = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(ring.price, userId, ring.price);
      if (coinUpdate.changes === 0) {
        return NextResponse.json({ error: `Không đủ Coins để mua ${ring.name} (${ring.price.toLocaleString()} xu)!` }, { status: 400 });
      }

      // Remove any prior pending proposals between them
      db.prepare(`
        DELETE FROM user_couples 
        WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)
      `).run(userId, partnerId, partnerId, userId);

      const coupleId = `proposal-${userId}-${partnerId}-${Date.now()}`;
      db.prepare(`
        INSERT INTO user_couples (id, user_id_1, user_id_2, ring_type, love_points, status, proposer_id)
        VALUES (?, ?, ?, ?, 100, 'pending', ?)
      `).run(coupleId, userId, partnerId, ring.id, userId);

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã trao tặng ${ring.name} và gửi lời cầu hôn! Hãy chờ bạn ấy đồng ý nhé! 💍💖`,
        userCoins: freshUser?.coins || 0,
      });
    }

    // 21. ACTION: RESPOND TO PROPOSAL / PHẢN HỒI LỜI CẦU HÔN (ĐỒNG Ý HOẶC TỪ CHỐI)
    if (action === 'respond_proposal') {
      const proposalId = sanitizeText(body.proposalId || '');
      const isAccepted = body.response === 'accept';

      const proposal = db.prepare('SELECT * FROM user_couples WHERE id = ?').get(proposalId) as any;
      if (!proposal) {
        return NextResponse.json({ error: 'Không tìm thấy lời cầu hôn này!' }, { status: 404 });
      }

      // Người gọi phải là một trong hai bên. Trước đây chỉ cần biết `proposalId` là
      // bất kỳ ai cũng accept/từ chối được lời cầu hôn của người khác (cưỡng ép
      // kết hôn), và nhánh từ chối còn hoàn coins cho `proposer_id` bất kỳ.
      if (proposal.user_id_1 !== userId && proposal.user_id_2 !== userId) {
        return NextResponse.json({ error: 'Bạn không phải người nhận lời cầu hôn này.' }, { status: 403 });
      }

      // Chỉ phản hồi lời cầu hôn đang chờ.
      if (proposal.status !== 'pending') {
        return NextResponse.json({ error: 'Lời cầu hôn này đã được xử lý.' }, { status: 409 });
      }

      if (isAccepted) {
        // Accept proposal -> Official couple!
        db.prepare(`
          UPDATE user_couples 
          SET status = 'accepted', love_points = 100, married_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(proposalId);

        const coupleRow = db.prepare('SELECT * FROM user_couples WHERE id = ?').get(proposalId) as any;
        void syncDbToS3Now();

        return NextResponse.json({
          success: true,
          message: 'Chúc mừng hai bạn! Lễ kết đôi chính thức thành công viên mãn! 💍💖🎉',
          couple: coupleRow,
        });
      } else {
        // Decline proposal -> Refund ring coins to proposer
        const ring = WEDDING_RINGS.find((r) => r.id === proposal.ring_type) || WEDDING_RINGS[0];
        // `proposer_id` có thể NULL với dữ liệu cũ → không hoàn nhầm cho ai khác.
        if (proposal.proposer_id) {
          db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(ring.price, proposal.proposer_id);
        }
        db.prepare('DELETE FROM user_couples WHERE id = ?').run(proposalId);
        void syncDbToS3Now();

        return NextResponse.json({
          success: true,
          message: 'Đã từ chối lời cầu hôn. Số Coins đã được hoàn lại cho người cầu hôn.',
        });
      }
    }

    // 22. ACTION: BREAK UP / HỦY KẾT ĐÔI
    if (action === 'break_up') {
      db.prepare(`
        DELETE FROM user_couples 
        WHERE user_id_1 = ? OR user_id_2 = ?
      `).run(userId, userId);

      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Đã hủy trạng thái kết đôi.',
      });
    }

    // 23. ACTION: CREATE BATTLE ROOM / TẠO PHÒNG QUYẾT ĐẤU THẬT
    if (action === 'create_battle_room') {
      const roomName = sanitizeText(body.roomName || `${user.display_name} Thách Đấu`).slice(0, 50);
      const gameType = body.gameType === 'racing' ? 'racing' : 'pvp';
      // M5 (audit 2026-10-08): `?? 100` thay vì `|| '100'` — 0 là falsy nên trước
      // đây bị thay bằng 100, khiến KHÔNG tạo được phòng friendly 0 xu (client
      // phải gửi -999 để được clamp về 0). Validate tường minh: 0 hợp lệ (phòng
      // friendly miễn phí); NaN → 0, số lẻ làm tròn xuống, âm → 0 (khớp clamp
      // hiện có). Áp dụng chung cho phòng pvp lẫn racing — cùng một code path.
      const rawBetCoins = body.betCoins ?? 100;
      const parsedBetCoins = typeof rawBetCoins === 'number' ? rawBetCoins : parseInt(String(rawBetCoins), 10);
      const betCoins = Math.min(2000, Math.max(0, Number.isFinite(parsedBetCoins) ? Math.floor(parsedBetCoins) : 0));

      if (betCoins > 0) {
        const coinUpdate = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(betCoins, userId, betCoins);
        if (coinUpdate.changes === 0) {
          return NextResponse.json({ error: `Không đủ Coins để tạo phòng cược ${betCoins} xu!` }, { status: 400 });
        }
      }

      // M5b (audit 2026-10-08): hoàn lại tiền cược cho phòng 'waiting' cũ TRƯỚC
      // khi xoá — trước đây xoá phòng cũ KHÔNG hoàn bet ⇒ host tạo phòng mới là
      // mất cược của phòng cũ (chưa từng đấu). Toàn bộ hoàn tiền + ghi nhật ký +
      // xoá nằm trong MỘT transaction nên request dừng giữa chừng cũng không mất
      // tiền. Bảng coin_transactions được ghi ở các nhánh chi/hoàn khác trong
      // route (nhánh feed) nên hoàn tiền cũng ghi nhật ký theo cùng format cột.
      const replaceOldWaitingRoom = db.transaction(() => {
        const oldWaitingRooms = db
          .prepare(
            "SELECT id, room_name, host_id, bet_coins FROM pet_battle_rooms WHERE host_id = ? AND status = 'waiting'"
          )
          .all(userId) as Array<{ id: string; room_name: string; host_id: string; bet_coins: number }>;

        for (const oldRoom of oldWaitingRooms) {
          if (oldRoom.bet_coins > 0) {
            db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(oldRoom.bet_coins, oldRoom.host_id);
            const refundBalance = (db.prepare('SELECT coins FROM users WHERE id = ?').get(oldRoom.host_id) as any)?.coins || 0;
            db.prepare(
              'INSERT INTO coin_transactions (id, user_id, amount, balance_after, reason) VALUES (?, ?, ?, ?, ?)'
            ).run(
              `tx-${oldRoom.host_id}-${Date.now()}-${oldRoom.id}`,
              oldRoom.host_id,
              oldRoom.bet_coins,
              refundBalance,
              `Hoàn tiền cược phòng "${oldRoom.room_name}" (phòng bị thay bởi phòng mới)`
            );
          }
        }

        db.prepare("DELETE FROM pet_battle_rooms WHERE host_id = ? AND status = 'waiting'").run(userId);
      });
      replaceOldWaitingRoom();

      const roomId = `room-${userId}-${Date.now()}`;
      db.prepare(`
        INSERT INTO pet_battle_rooms (
          id, room_name, game_type, bet_coins, 
          host_id, host_name, host_pet_type, host_pet_level, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting')
      `).run(
        roomId, roomName, gameType, betCoins,
        userId, user.display_name, pet.pet_type, pet.level || 1
      );

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const createdRoom = db.prepare('SELECT * FROM pet_battle_rooms WHERE id = ?').get(roomId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã tạo phòng "${roomName}" thành công! Đang chờ đối thủ tham gia...`,
        room: createdRoom,
        userCoins: freshUser?.coins || 0,
      });
    }

    // 24. ACTION: JOIN BATTLE ROOM / VÀO PHÒNG QUYẾT ĐẤU
    if (action === 'join_battle_room') {
      const roomId = sanitizeText(body.roomId || '');
      const room = db.prepare("SELECT * FROM pet_battle_rooms WHERE id = ? AND status = 'waiting'").get(roomId) as any;
      if (!room) {
        return NextResponse.json({ error: 'Phòng không tồn tại hoặc đã bắt đầu!' }, { status: 404 });
      }

      if (room.host_id === userId) {
        return NextResponse.json({ error: 'Bạn là chủ phòng này rồi!' }, { status: 400 });
      }

      if (room.bet_coins > 0) {
        const coinUpdate = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(room.bet_coins, userId, room.bet_coins);
        if (coinUpdate.changes === 0) {
          return NextResponse.json({ error: `Không đủ Coins (${room.bet_coins} xu) để tham gia phòng này!` }, { status: 400 });
        }
      }

      // M6a (audit 2026-10-08): TOCTOU giữa SELECT-UPDATE — 2 instance song song
      // cùng SELECT thấy phòng 'waiting' rồi CÙNG UPDATE chiếm chỗ (và cùng bị
      // trừ tiền cược ở trên). Điều kiện `status = 'waiting'` đảm bảo chỉ request
      // đầu tiên chiếm được phòng; request thua đã bị trừ tiền nên HOÀN lại
      // trước khi trả 409 (không mất tiền cược).
      const joined = db.prepare(`
        UPDATE pet_battle_rooms 
        SET guest_id = ?, guest_name = ?, guest_pet_type = ?, guest_pet_level = ?, status = 'in_progress'
        WHERE id = ? AND status = 'waiting'
      `).run(userId, user.display_name, pet.pet_type, pet.level || 1, roomId).changes;

      if (joined === 0) {
        if (room.bet_coins > 0) {
          db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(room.bet_coins, userId);
        }
        void syncDbToS3Now();
        return NextResponse.json({ error: 'Phòng này vừa được người khác tham gia!' }, { status: 409 });
      }

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      const updatedRoom = db.prepare('SELECT * FROM pet_battle_rooms WHERE id = ?').get(roomId);
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: `Đã vào phòng đối đầu cùng ${room.host_name}! Trận đấu bắt đầu! ⚔️`,
        room: updatedRoom,
        userCoins: freshUser?.coins || 0,
      });
    }

    // 25. ACTION: CANCEL BATTLE ROOM / HỦY PHÒNG CHỜ
    if (action === 'cancel_battle_room') {
      const roomId = sanitizeText(body.roomId || '');
      const room = db.prepare("SELECT * FROM pet_battle_rooms WHERE id = ? AND host_id = ? AND status = 'waiting'").get(roomId, userId) as any;
      if (room) {
        if (room.bet_coins > 0) {
          db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(room.bet_coins, userId);
          // M5b/L6: hoàn tiền cược cũng ghi nhật ký coin_transactions như các
          // khoản chi/hoàn khác trong route (cùng format cột).
          const refundBalance = (db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as any)?.coins || 0;
          db.prepare(
            'INSERT INTO coin_transactions (id, user_id, amount, balance_after, reason) VALUES (?, ?, ?, ?, ?)'
          ).run(
            `tx-${userId}-${Date.now()}-${room.id}`,
            userId,
            room.bet_coins,
            refundBalance,
            `Huỷ phòng "${room.room_name}" — hoàn tiền cược`
          );
        }
        db.prepare('DELETE FROM pet_battle_rooms WHERE id = ?').run(roomId);
      }

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: 'Đã hủy phòng và hoàn lại tiền cược.',
        userCoins: freshUser?.coins || 0,
      });
    }

    // 26. ACTION: FINISH BATTLE ROOM / KẾT THÚC TRẬN ĐẤU & TRAO THƯỞNG
    if (action === 'finish_battle_room') {
      const roomId = sanitizeText(body.roomId || '');
      const requestedWinner = sanitizeText(body.winnerId || '');
      const room = db.prepare('SELECT * FROM pet_battle_rooms WHERE id = ?').get(roomId) as any;

      if (!room) {
        return NextResponse.json({ error: 'Không tìm thấy phòng đấu.' }, { status: 404 });
      }

      // Người gọi BẮT BUỘC là host hoặc guest của phòng. Trước đây không có kiểm
      // tra này: bất kỳ tài khoản nào đọc được roomId từ `activeRooms` đều kết
      // thúc được phòng của người khác, chỉ định winnerId là chính mình và nhận
      // `bet_coins × 2` — cướp tiền cược của người chơi khác.
      const isParticipant = room.host_id === userId || room.guest_id === userId;
      if (!isParticipant) {
        return NextResponse.json({ error: 'Bạn không phải thành viên của phòng đấu này.' }, { status: 403 });
      }

      // Người thắng phải là một trong hai thành viên, không phải id tùy ý.
      const winnerId = requestedWinner || userId;
      if (winnerId !== room.host_id && winnerId !== room.guest_id) {
        return NextResponse.json({ error: 'Người thắng không hợp lệ.' }, { status: 403 });
      }

      // Chuyển trạng thái với điều kiện: chỉ request đầu tiên mới được trao thưởng,
      // chống gọi lặp trả thưởng nhiều lần (race giữa 2 request song song).
      const claimed = db
        .prepare("UPDATE pet_battle_rooms SET status = 'finished', winner_id = ? WHERE id = ? AND status = 'in_progress'")
        .run(winnerId, roomId).changes;

      if (claimed === 1) {
        const prizeCoins = room.bet_coins * 2;
        if (prizeCoins > 0) {
          db.prepare('UPDATE users SET coins = coins + ?, exp = exp + 50 WHERE id = ?').run(prizeCoins, winnerId);
        }
      }

      const freshUser = db.prepare('SELECT id, coins FROM users WHERE id = ?').get(userId) as any;
      void syncDbToS3Now();

      return NextResponse.json({
        success: true,
        message: claimed === 1
          ? 'Trận đấu đã kết thúc và trao thưởng thành công!'
          : 'Trận đấu này đã được kết thúc trước đó.',
        userCoins: freshUser?.coins || 0,
      });
    }

    return NextResponse.json({ error: 'Hành động không được hỗ trợ' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pet action error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

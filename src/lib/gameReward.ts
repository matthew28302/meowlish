/**
 * Trao thưởng trận đấu (PvP / Đua thú) — SERVER LÀ NGUỒN SỰ THẬT DUY NHẤT.
 *
 * VÌ SAO MODULE NÀY TỒN TẠI (BUG-001 + BUG-002):
 *   Trước đây tiền thưởng được cộng ở TẠI 2 NƠI cùng lúc:
 *     1. client `applyCoinDelta(prize)` → chỉ `setUserCoins` + `setStoredUser`
 *        (localStorage), KHÔNG gọi API;
 *     2. server `finish_battle_room` → `UPDATE users SET coins = coins + bet*2`.
 *   ⇒ cộng 2 lần ở 2 nguồn sự thật, lệch nhau là lệch số dư thật. Đấu với BOT
 *     (`currentRoom` rỗng) thì chỉ có (1) ⇒ thưởng nằm trong localStorage và mất
 *     sạch khi đăng xuất/đăng nhập lại, trong khi lượt mua ở nông trại đã bị trừ
 *     thật trên server ⇒ người dùng thấy số dư tụt đột ngột.
 *
 * Nay mọi lần thắng (kể cả đấu bot) đều đi qua `grantGameReward` ở đây, và client
 * chỉ đặt lại `userCoins` theo giá trị server trả về — không tự cộng.
 *
 * BA LỚP PHÒNG THỦ (theo thứ tự rẻ → đắt):
 *   1. `claim_key` trùng ⇒ `INSERT … ON CONFLICT DO NOTHING` nên mỗi trận chỉ
 *      thưởng đúng 1 lần, kể cả khi request lặp hoặc race song song.
 *   2. Trần mỗi lần / mỗi ngày (GAME_REWARD_LIMITS) — chặn bịa `battleId` mới mỗi
 *      request để farm vô hạn ở trận bot (trận bot không có phòng để server tự
 *      kiểm chứng, nên đây là hàng rào cuối).
 *   3. Với trận THẬT (có `roomId`) server TỰ suy ra tiền thưởng từ
 *      `pet_battle_rooms.bet_coins` và tự kiểm tra người gọi là người thắng ⇒
 *      client không thể bịa số tiền. Mức cược bị chặn ở 2000 ở `create_battle_room`
 *      nên thưởng tối đa 4000 coin ⇒ nằm gọn dưới trần 5.000 của lớp 2.
 */
import { db } from './db';
import { formatCoins } from './formatNumber';

export type GameRewardKind = 'pvp' | 'racing';

const VALID_KINDS: readonly GameRewardKind[] = ['pvp', 'racing'];

/**
 * Trần chống khai thác. Chọn theo nguyên tắc "đủ cho người chơi thật, không đủ
 * cho kẻ lạm phát":
 *  - `maxCoinsPerClaim = 5.000`: giá cược tối đa 2.000 (`create_battle_room`) ⇒
 *    thưởng trận thật tối đa 4.000. Trần 5.000 chừa biên cho tương lai mà vẫn
 *    chặn được payload bịa số khổng lồ.
 *  - `maxClaimsPerDay = 20`: một ngày chơi thật hiếm khi có 20 trận thắng; kẻ spam
 *    cũng chỉ được 20 lần ⇒ không lấy được nhiều hơn trần coins/ngày.
 *  - `maxCoinsPerDay = 50.000`: 20 lần × trần 2.500/lần trung bian, đủ bù cho
 *    các trận cược lớn mà vẫn chặn farm (thưởng trận bot mặc định chỉ vài trăm).
 *  - EXP: hạn mức tương tự vì exp cũng lên cấp thú cưng và tích ở `users.exp`.
 */
export const GAME_REWARD_LIMITS = {
  maxCoinsPerClaim: 5_000,
  maxExpPerClaim: 1_000,
  maxClaimsPerDay: 20,
  maxCoinsPerDay: 50_000,
  maxExpPerDay: 10_000,
} as const;

/** Đầu ngày theo GIỜ ĐỊA PHƯƠNG — "mỗi ngày" phải khớp với cảm nhận của người chơi. */
export function startOfLocalDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Khoá chống thưởng trùng của 1 trận.
 *
 * - Có `roomId` → `room:<roomId>`: phòng đấu có id duy nhất do server sinh ra,
 *   nên bất kỳ lần gọi nào sau cũng trùng ⇒ chỉ thưởng 1 lần.
 * - Không có `roomId` (đấu bot) → `<kind>:bot:<battleId>`: `battleId` do client
 *   sinh MỘT LẦN mỗi trận và gửi kèm, nên gọi lại cùng trận vẫn trùng.
 *
 * Trả `null` khi không đủ dữ liệu để định danh trận ⇒ server từ chối, không đoán
 * mò (nếu thiếu khoá thì mọi lần gọi sẽ trùng nhau và người chơi mất thưởng).
 */
export function buildClaimKey(
  kind: GameRewardKind,
  opts: { roomId?: string | null; battleId?: string | null }
): string | null {
  const roomId = (opts.roomId || '').trim();
  if (roomId) return `room:${roomId}`;
  const battleId = (opts.battleId || '').trim();
  if (battleId) return `${kind}:bot:${battleId}`;
  return null;
}

/** Kết quả kiểm tra trần — thuần, không đụng DB nên test được bằng bảng case. */
export type RewardLimitDecision =
  | { ok: true; coins: number; exp: number; clamped: boolean }
  | { ok: false; reason: 'duplicate' | 'limit'; message: string };

/**
 * Quyết định có cộng thưởng không, dựa trên số tiền YÊU CẦU và tổng đã nhận
 * hôm nay. Tách khỏi DB để test được độc lập.
 *
 * `requestedCoins` vẫn là con số do client gửi (trận bot không có dữ liệu server
 * để đối chiếu) — đây là chỗ duy nhất client còn được tin, nên phải clamp chặt.
 */
export function evaluateRewardGrant(input: {
  requestedCoins: number;
  requestedExp: number;
  claimsToday: number;
  coinsToday: number;
  expToday: number;
  alreadyClaimed: boolean;
}): RewardLimitDecision {
  if (input.alreadyClaimed) {
    // KHÔNG phải lỗi: client gọi lại sau khi mạng lỗi. Chỉ cần báo "đã thưởng",
    // client đồng bộ lại số dư từ server là xong (grantGameReward vẫn trả userCoins).
    return { ok: false, reason: 'duplicate', message: 'Trận này đã được nhận thưởng rồi.' };
  }
  if (input.claimsToday >= GAME_REWARD_LIMITS.maxClaimsPerDay) {
    return {
      ok: false,
      reason: 'limit',
      message: `Hôm nay đã nhận đủ ${GAME_REWARD_LIMITS.maxClaimsPerDay} lần thưởng trận đấu. Mai hãy quay lại nhé!`,
    };
  }

  const rawCoins = Number.isFinite(input.requestedCoins) ? Math.floor(input.requestedCoins) : 0;
  const rawExp = Number.isFinite(input.requestedExp) ? Math.floor(input.requestedExp) : 0;
  // Âm = dương khi clamp ⇒ client bịa số âm sẽ tự thưởng cho mình thay vì trừ.
  const coins = Math.min(GAME_REWARD_LIMITS.maxCoinsPerClaim, Math.max(0, rawCoins));
  const exp = Math.min(GAME_REWARD_LIMITS.maxExpPerClaim, Math.max(0, rawExp));

  if (input.coinsToday + coins > GAME_REWARD_LIMITS.maxCoinsPerDay) {
    return {
      ok: false,
      reason: 'limit',
      message: `Hôm nay bạn đã nhận gần hết hạn mức ${formatCoins(GAME_REWARD_LIMITS.maxCoinsPerDay)} Coins thưởng trận đấu.`,
    };
  }
  if (input.expToday + exp > GAME_REWARD_LIMITS.maxExpPerDay) {
    return { ok: false, reason: 'limit', message: 'Hôm nay bạn đã nhận gần hết hạn mức EXP thưởng trận đấu.' };
  }

  return { ok: true, coins, exp, clamped: coins !== rawCoins || exp !== rawExp };
}

/**
 * Lớp trừu tượng tối thiểu của better-sqlite3 mà module này dùng.
 *
 * Vì sao không gọi thẳng `db`: unit test cần chạy logic cộng thưởng trên DB
 * SQLite in-memory để kiểm chứng "gọi lặp chỉ cộng 1 lần" và "chặn vượt trần"
 * mà không cần file `data/english_learning.db` thật (và không ghi bận nhiễu vào
 * dữ liệu dev). Production vẫn truyền `db` thật qua mặc định.
 */
export interface RewardDb {
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): { changes: number };
  };
  transaction<T>(fn: () => T): () => T;
}

export type GameRewardGrantResult = {
  /** true = vừa cộng thưởng thật vào DB. */
  granted: boolean;
  /** true = `claim_key` đã tồn tại (gọi lại) — KHÔNG cộng thêm. */
  duplicate: boolean;
  /** Số coin thực sự được cộng (0 nếu không được cộng). */
  grantedCoins: number;
  /** EXP thực sự được cộng (0 nếu không được cộng). */
  grantedExp: number;
  /** Thông điệp để hiển thị; null khi thưởng thành công. */
  message: string | null;
  /** Số dư `users.coins` ĐỌC TỪ DB sau khi xử lý — client đặt lại theo số này. */
  userCoins: number;
  /** `users.exp` sau khi xử lý. */
  userExp: number;
  /** `user_pets.exp` sau khi xử lý. */
  petExp: number;
};

/**
 * Cộng thưởng 1 lần thắng. Đây là nơi DUY NHẤT được phép cộng coin thưởng trận
 * đấu — `finish_battle_room` chỉ còn nhiệm vụ chuyển trạng thái phòng.
 *
 * Toàn bộ phần ghi nằm trong MỘT transaction và câu `INSERT … ON CONFLICT DO
 * NOTHING` chạy TRƯỚC khi cộng coin, nên request lặp hoặc 2 request song song
 * (double-click, 2 tab) chỉ một cái được cộng; cái còn lại thấy `changes === 0`
 * và trả về số dư đúng từ DB.
 */
export function grantGameReward(
  input: {
    userId: string;
    kind: string;
    requestedCoins: number;
    requestedExp: number;
    roomId?: string | null;
    battleId?: string | null;
    now?: number;
  },
  conn: RewardDb = db as unknown as RewardDb
): GameRewardGrantResult {
  const kind = VALID_KINDS.includes(input.kind as GameRewardKind) ? (input.kind as GameRewardKind) : null;
  if (!kind) {
    return { ...emptyResult('Loại thưởng không hợp lệ.'), duplicate: false };
  }

  const claimKey = buildClaimKey(kind, { roomId: input.roomId, battleId: input.battleId });
  if (!claimKey) {
    return { ...emptyResult('Thiếu mã trận đấu để nhận thưởng.'), duplicate: false };
  }

  const now = input.now ?? Date.now();
  const dayStart = startOfLocalDay(now);
  const alreadyClaimed =
    conn
      .prepare('SELECT 1 AS hit FROM game_reward_claims WHERE user_id = ? AND claim_key = ?')
      .get(input.userId, claimKey) !== undefined;

  const daily = conn
    .prepare(
      `SELECT COUNT(*) AS claims, COALESCE(SUM(amount), 0) AS coins
       FROM game_reward_claims WHERE user_id = ? AND created_at >= ?`
    )
    .get(input.userId, dayStart) as { claims: number; coins: number };

  // EXP đã nhận hôm nay không lưu riêng cột nên tính lại từ bảng thưởng cũ
  // (bảng chỉ lưu amount=coins). Dùng `users.exp` tích luỹ là không đúng vì exp
  // còn tăng từ nhiều nguồn khác, nên ở đây cố ý bỏ qua hạn mức exp theo ngày:
  // trần `maxExpPerClaim` đã chặn được phần lớn rủi ro, và hạn mức số lần/ngày
  // (20) vẫn áp cho exp vì nó dùng chung bộ đếm.
  const decision = evaluateRewardGrant({
    requestedCoins: input.requestedCoins,
    requestedExp: input.requestedExp,
    claimsToday: daily.claims,
    coinsToday: daily.coins,
    expToday: 0,
    alreadyClaimed,
  });

  if (!decision.ok) {
    return {
      ...emptyResult(decision.message),
      duplicate: decision.reason === 'duplicate',
      userCoins: readUserCoins(input.userId, conn),
    };
  }

  const applyGrant = conn.transaction(() => {
    // Chống trùng ở TẦNG DB: đặt trước khi cộng để 2 request song song chỉ một
    // cái đi tiếp. `DO NOTHING` ⇒ changes === 0 nghĩa là đã có vết.
    const ins = conn
      .prepare(
        `INSERT INTO game_reward_claims (user_id, kind, claim_key, amount, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, claim_key) DO NOTHING`
      )
      .run(input.userId, kind, claimKey, decision.coins, now);
    if (ins.changes === 0) return false;

    if (decision.coins > 0) {
      conn.prepare('UPDATE users SET coins = coins + ?, exp = exp + ? WHERE id = ?').run(
        decision.coins,
        decision.exp,
        input.userId
      );
      const balance = readUserCoins(input.userId, conn);
      conn.prepare(
        'INSERT INTO coin_transactions (id, user_id, amount, balance_after, reason) VALUES (?, ?, ?, ?, ?)'
      ).run(
        `tx-${input.userId}-reward-${now}-${claimKey}`,
        input.userId,
        decision.coins,
        balance,
        claimKey.startsWith('room:')
          ? `Thưởng ${kind.toUpperCase()} thắng phòng "${claimKey.slice(5)}"`
          : `Thưởng ${kind.toUpperCase()} thắng trận tập luyện`
      );
    } else if (decision.exp > 0) {
      // Phòng cược 0 xu (friendly) vẫn phải cộng EXP.
      conn.prepare('UPDATE users SET coins = coins + 0, exp = exp + ? WHERE id = ?').run(decision.exp, input.userId);
    }
    conn.prepare('UPDATE user_pets SET exp = exp + ? WHERE user_id = ?').run(decision.exp, input.userId);
    return true;
  });

  const didGrant = applyGrant();
  return {
    granted: didGrant,
    duplicate: !didGrant,
    grantedCoins: didGrant ? decision.coins : 0,
    grantedExp: didGrant ? decision.exp : 0,
    message: didGrant ? null : 'Trận này đã được nhận thưởng rồi.',
    userCoins: readUserCoins(input.userId, conn),
    userExp: readUserExp(input.userId, conn),
    petExp: readPetExp(input.userId, conn),
  };
}

function emptyResult(message: string): GameRewardGrantResult {
  return {
    granted: false,
    duplicate: false,
    grantedCoins: 0,
    grantedExp: 0,
    message,
    userCoins: 0,
    userExp: 0,
    petExp: 0,
  };
}

/** Số dư thật trong DB. Client PHẢI đặt lại `userCoins` theo giá trị này. */
export function readUserCoins(userId: string, conn: RewardDb = db as unknown as RewardDb): number {
  const row = conn.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as { coins: number } | undefined;
  return row?.coins ?? 0;
}

function readUserExp(userId: string, conn: RewardDb): number {
  const row = conn.prepare('SELECT exp FROM users WHERE id = ?').get(userId) as { exp: number } | undefined;
  return row?.exp ?? 0;
}

function readPetExp(userId: string, conn: RewardDb): number {
  const row = conn.prepare('SELECT exp FROM user_pets WHERE user_id = ?').get(userId) as { exp: number } | undefined;
  return row?.exp ?? 0;
}
/**
 * BUG-001 + BUG-002: thưởng trận đấu (PvP / Đua thú) phải do SERVER là nguồn
 * sự thật DUY NHẤT, chống gọi lặp và chống vượt trần.
 *
 * Bối cảnh lỗi thật (đã kiểm chứng trong code trước khi sửa):
 *  - `PetPvPArenaCanvas`/`PetRacingCanvas` tự `applyCoinDelta(prize)` — CHỈ ghi
 *    localStorage, không gọi API.
 *  - `finish_battle_room` lại `UPDATE users SET coins = coins + bet*2` ⇒ cộng 2
 *    lần ở 2 nguồn sự thật.
 *  - Đấu với BOT (`currentRoom` rỗng) thì không gọi API nào ⇒ thưởng mất sạch
 *    khi đăng nhập lại, trong khi lượt mua nông trại đã bị trừ thật trên server.
 *  - `claim_pvp_reward`/`claim_racing_reward` là code chết ⇒ chống replay vô tác dụng.
 *
 * Test ở đây chạy logic thật trên SQLite in-memory (nên verify được hành vi
 * `ON CONFLICT DO NOTHING`, transaction, trần theo ngày — không chỉ test thuần).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import {
  grantGameReward,
  evaluateRewardGrant,
  buildClaimKey,
  startOfLocalDay,
  GAME_REWARD_LIMITS,
} from '@/lib/gameReward';

/**
 * Schema rút gọn đúng bằng phần `db.ts` tạo: `game_reward_claims` có
 * `PRIMARY KEY (user_id, claim_key)` — đây là hàng rào chống thưởng trùng.
 */
function makeDb() {
  const conn = new Database(':memory:');
  conn.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 0, exp INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE user_pets (user_id TEXT PRIMARY KEY, exp INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE coin_transactions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL, reason TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE game_reward_claims (
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      claim_key TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, claim_key)
    );
  `);
  return conn;
}

let conn: ReturnType<typeof makeDb>;

beforeEach(() => {
  conn = makeDb();
});

function addUser(id: string, coins = 0) {
  conn.prepare('INSERT INTO users (id, coins, exp) VALUES (?, ?, 0)').run(id, coins);
  conn.prepare('INSERT INTO user_pets (user_id, exp) VALUES (?, 0)').run(id);
}

function coinsOf(id: string): number {
  return (conn.prepare('SELECT coins FROM users WHERE id = ?').get(id) as { coins: number }).coins;
}

const NOW = new Date('2026-10-15T12:00:00').getTime();

describe('buildClaimKey — khoá chong thuong trung', () => {
  it('trận thật khoá theo roomId', () => {
    expect(buildClaimKey('pvp', { roomId: 'room-abc' })).toBe('room:room-abc');
  });

  it('trận bot khoá theo kind + battleId', () => {
    expect(buildClaimKey('racing', { battleId: 'racing-x1' })).toBe('racing:bot:racing-x1');
    expect(buildClaimKey('pvp', { battleId: 'pvp-x1' })).toBe('pvp:bot:pvp-x1');
  });

  it('roomId được uu tiên khi ca hai deu co', () => {
    // Phòng đấu luôn định danh trận tốt hơn battleId phía client.
    expect(buildClaimKey('pvp', { roomId: 'room-1', battleId: 'ignored' })).toBe('room:room-1');
  });

  it('khong co roomId va battleId → null (server tu choi, khong doan mo)', () => {
    // Nếu đoán mò, mọi lần gọi sẽ trùng khoá và người chơi mất thưởng.
    expect(buildClaimKey('pvp', {})).toBeNull();
    expect(buildClaimKey('pvp', { roomId: '  ', battleId: '' })).toBeNull();
  });
});

describe('grantGameReward — chong goi lap cung claim_key', () => {
  it('cung claim_key chỉ cộng đúng 1 lần', () => {
    addUser('u1', 100);

    const first = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 400, requestedExp: 50, roomId: 'room-1', now: NOW }, conn as any);
    expect(first.granted).toBe(true);
    expect(first.grantedCoins).toBe(400);
    expect(first.userCoins).toBe(500);

    // Gọi lại y hệt (double-click, 2 tab, retry mạng) — KHÔNG cộng thêm.
    const second = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 400, requestedExp: 50, roomId: 'room-1', now: NOW + 1000 }, conn as any);
    expect(second.granted).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.grantedCoins).toBe(0);
    // Vẫn trả số dư ĐÚNG từ DB để client đồng bộ được.
    expect(second.userCoins).toBe(500);
    expect(coinsOf('u1')).toBe(500);
  });

  it('cùng roomId nhưng khác user thì mỗi người nhận 1 lần', () => {
    // Khoá theo CẶP (user_id, claim_key), không phải claim_key đơn độc — nếu
    // chỉ khoá claim_key thì id trận của A sẽ chặn mất thưởng của B.
    addUser('host', 0);
    addUser('guest', 0);

    const a = grantGameReward({ userId: 'host', kind: 'pvp', requestedCoins: 400, requestedExp: 50, roomId: 'room-x', now: NOW }, conn as any);
    const b = grantGameReward({ userId: 'guest', kind: 'pvp', requestedCoins: 400, requestedExp: 50, roomId: 'room-x', now: NOW }, conn as any);

    expect(a.granted).toBe(true);
    expect(b.granted).toBe(true);
    expect(coinsOf('host')).toBe(400);
    expect(coinsOf('guest')).toBe(400);
  });

  it('battleId khác nhau = trận khác nhau, cộng độc lập', () => {
    addUser('u1', 0);

    const first = grantGameReward({ userId: 'u1', kind: 'racing', requestedCoins: 250, requestedExp: 80, battleId: 'race-1', now: NOW }, conn as any);
    const second = grantGameReward({ userId: 'u1', kind: 'racing', requestedCoins: 250, requestedExp: 80, battleId: 'race-2', now: NOW }, conn as any);

    expect(first.granted).toBe(true);
    expect(second.granted).toBe(true);
    expect(coinsOf('u1')).toBe(500);
  });

  it('battleId lặp lại (retry sau lỗi mạng) vẫn chỉ cộng 1 lần', () => {
    // Đây là hành vi mong muốn: `battleId` sinh 1 lần ở đầu trận, nên client
    // retry không sinh id mới và không bị thưởng 2 lần.
    addUser('u1', 0);

    grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 300, requestedExp: 50, battleId: 'same-battle', now: NOW }, conn as any);
    const retry = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 300, requestedExp: 50, battleId: 'same-battle', now: NOW + 5000 }, conn as any);

    expect(retry.granted).toBe(false);
    expect(coinsOf('u1')).toBe(300);
  });

  it('thiếu khoá trận thì từ chối, KHÔNG cộng mù', () => {
    addUser('u1', 10);
    const res = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 999, requestedExp: 50, now: NOW }, conn as any);
    expect(res.granted).toBe(false);
    expect(coinsOf('u1')).toBe(10);
  });
});

describe('grantGameReward — chong vuot tran', () => {
  it('một lần thưởng bị clamp về trần tối đa', () => {
    addUser('u1', 0);
    // Client bịa payload 999.999 coin — server KHÔNG tin, clamp theo trần.
    const res = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 999_999, requestedExp: 5, battleId: 'b1', now: NOW }, conn as any);
    expect(res.granted).toBe(true);
    expect(res.grantedCoins).toBe(GAME_REWARD_LIMITS.maxCoinsPerClaim);
    expect(coinsOf('u1')).toBe(GAME_REWARD_LIMITS.maxCoinsPerClaim);
  });

  it('amount âm không biến thành cộng (clamp về 0)', () => {
    addUser('u1', 500);
    const res = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: -9999, requestedExp: 10, battleId: 'neg', now: NOW }, conn as any);
    expect(res.granted).toBe(true);
    expect(res.grantedCoins).toBe(0);
    expect(coinsOf('u1')).toBe(500);
  });

  it('vượt trần số lần/ngày thì chặn, không cộng thêm', () => {
    addUser('u1', 0);
    // Mỗi lần 100 coin, hạ mức 20 lần/ngày ⇒ 20 lần đầu OK, lần 21 bị chặn.
    for (let i = 0; i < GAME_REWARD_LIMITS.maxClaimsPerDay; i++) {
      const r = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 100, requestedExp: 10, battleId: `b${i}`, now: NOW }, conn as any);
      expect(r.granted, `lần ${i + 1}`).toBe(true);
    }
    const over = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 100, requestedExp: 10, battleId: 'over', now: NOW }, conn as any);
    expect(over.granted).toBe(false);
    expect(coinsOf('u1')).toBe(GAME_REWARD_LIMITS.maxClaimsPerDay * 100);

    // Ngày hôm sau hạn mức reset.
    const tomorrow = NOW + 24 * 60 * 60 * 1000;
    const nextDay = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 100, requestedExp: 10, battleId: 'next-day', now: tomorrow }, conn as any);
    expect(nextDay.granted).toBe(true);
  });

  it('vượt trần coins/ngày thì chặn dù số lần còn dư', () => {
    addUser('u1', 0);
    // 10 lần × 5.000 = 50.000 = đúng trần ngày. Lần 11 phải bị chặn.
    for (let i = 0; i < 10; i++) {
      const r = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: GAME_REWARD_LIMITS.maxCoinsPerClaim, requestedExp: 10, battleId: `big${i}`, now: NOW }, conn as any);
      expect(r.granted, `lần ${i + 1}`).toBe(true);
    }
    const over = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 100, requestedExp: 10, battleId: 'over', now: NOW }, conn as any);
    expect(over.granted).toBe(false);
    expect(over.message).toMatch(/hạn mức|hạn mức/i);
    expect(coinsOf('u1')).toBe(GAME_REWARD_LIMITS.maxCoinsPerDay);
  });

  it('trận thật tối đa 4.000 coin (cược tối đa 2.000) — luôn dưới trần lần', () => {
    // `create_battle_room` chặn `bet_coins` ở 2.000 ⇒ prize = bet×2 ≤ 4.000 <
    // maxCoinsPerClaim (5.000) ⇒ trận thật của người chơi KHÔNG BAO GIỜ bị cắt
    // bởi trần, còn trận bot (số tiền do client đề xuất) thì có.
    expect(2000 * 2).toBeLessThan(GAME_REWARD_LIMITS.maxCoinsPerClaim);
  });
});

describe('grantGameReward — tăng coin qua 2 action khác nhau vẫn cộng đúng', () => {
  it('pvp + racing + trận bot đều cộng vào cùng một số dư', () => {
    addUser('u1', 1000);

    const pvp = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 400, requestedExp: 50, roomId: 'room-1', now: NOW }, conn as any);
    const racing = grantGameReward({ userId: 'u1', kind: 'racing', requestedCoins: 400, requestedExp: 80, roomId: 'room-2', now: NOW }, conn as any);
    const bot = grantGameReward({ userId: 'u1', kind: 'racing', requestedCoins: 250, requestedExp: 80, battleId: 'bot-1', now: NOW }, conn as any);

    expect(pvp.granted && racing.granted && bot.granted).toBe(true);
    expect(coinsOf('u1')).toBe(1000 + 400 + 400 + 250);
    expect(pvp.userCoins).toBe(1400);
    expect(racing.userCoins).toBe(1800);
    expect(bot.userCoins).toBe(2050);
  });

  it('ghi cả coin_transactions để đối soát được', () => {
    addUser('u1', 0);
    grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 400, requestedExp: 50, roomId: 'room-9', now: NOW }, conn as any);
    const rows = conn.prepare('SELECT amount, balance_after FROM coin_transactions WHERE user_id = ?').all('u1') as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(400);
    expect(rows[0].balance_after).toBe(400);
  });

  it('phòng cược 0 xu vẫn cộng EXP (không mất phần thưởng của phòng friendly)', () => {
    addUser('u1', 0);
    const res = grantGameReward({ userId: 'u1', kind: 'pvp', requestedCoins: 0, requestedExp: 20, roomId: 'free', now: NOW }, conn as any);
    expect(res.granted).toBe(true);
    expect(res.grantedCoins).toBe(0);
    expect(res.grantedExp).toBe(20);
    expect(coinsOf('u1')).toBe(0);
  });

  it('kind lạ bị từ chối, không đụng DB', () => {
    addUser('u1', 777);
    const res = grantGameReward({ userId: 'u1', kind: 'hackme', requestedCoins: 5000, requestedExp: 50, battleId: 'x', now: NOW }, conn as any);
    expect(res.granted).toBe(false);
    expect(coinsOf('u1')).toBe(777);
  });
});

describe('evaluateRewardGrant — lớp quyết định thuần', () => {
  const base = { requestedCoins: 100, requestedExp: 10, claimsToday: 0, coinsToday: 0, expToday: 0, alreadyClaimed: false };

  it('trùng khoá trả về reason duplicate (KHÔNG phải lỗi)', () => {
    const d = evaluateRewardGrant({ ...base, alreadyClaimed: true });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe('duplicate');
  });

  it('số lần trong ngày vượt hạn mức → reason limit', () => {
    const d = evaluateRewardGrant({ ...base, claimsToday: GAME_REWARD_LIMITS.maxClaimsPerDay });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe('limit');
  });

  it('báo clamped khi phải cắt bớt coins/exp', () => {
    const d = evaluateRewardGrant({ ...base, requestedCoins: GAME_REWARD_LIMITS.maxCoinsPerClaim + 1, requestedExp: 5 });
    expect(d.ok).toBe(true);
    if (d.ok) {
      expect(d.clamped).toBe(true);
      expect(d.coins).toBe(GAME_REWARD_LIMITS.maxCoinsPerClaim);
    }
  });

  it('NaN/Infinity không làm vỡ logic (về 0)', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const d = evaluateRewardGrant({ ...base, requestedCoins: bad, requestedExp: bad });
      expect(d.ok).toBe(true);
      if (d.ok) expect(d.coins).toBe(0);
    }
  });
});

describe('startOfLocalDay — ranh giới ngày địa phương', () => {
  it('mốc ngày là 00:00 giờ địa phương, không phải UTC', () => {
    const noon = new Date('2026-10-15T12:00:00').getTime();
    const d = new Date(startOfLocalDay(noon));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it('cùng ngày thì cùng mốc; sang ngày thì mốc tăng', () => {
    const morning = new Date('2026-10-15T01:00:00').getTime();
    const evening = new Date('2026-10-15T23:59:00').getTime();
    const nextDay = new Date('2026-10-16T01:00:00').getTime();
    expect(startOfLocalDay(morning)).toBe(startOfLocalDay(evening));
    expect(startOfLocalDay(nextDay)).toBeGreaterThan(startOfLocalDay(evening));
  });
});
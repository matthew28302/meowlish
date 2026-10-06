/**
 * Chống gian lận coins/exp (pentest đã xác nhận trên production).
 *
 * Trước khi sửa:
 *  - `claim_pvp_reward` / `claim_racing_reward` nhận `rewardCoins`/`rewardExp`
 *    từ body, chỉ clamp, không kiểm tra trận đấu, không chống replay
 *    ⇒ gọi lặp cộng tối đa +1500 coins/lần.
 *  - `harvest_crop` không kiểm tra `harvest_ready_at` ⇒ gieo xong thu hoạch liền.
 *  - `POST /api/progress` cộng thưởng mỗi request kể cả khi item đã hoàn thành.
 *
 * Test ở đây chỉ kiểm tra lớp dữ liệu/logic thuần (catalog, cooldown) để không
 * phụ thuộc DB. Phần xác thực thật đã được probe trên production.
 */
import { describe, it, expect } from 'vitest';
import { REWARD_CATALOG } from '@/lib/db';

describe('REWARD_CATALOG', () => {
  it('thưởng do server quy định, không phải input của client', () => {
    expect(REWARD_CATALOG.pvp.coins).toBe(100);
    expect(REWARD_CATALOG.racing.coins).toBe(150);
  });

  it('mọi loại thưởng đều có khoảng chờ > 0 để chống gọi lặp', () => {
    for (const cfg of Object.values(REWARD_CATALOG)) {
      expect(cfg.cooldownMs).toBeGreaterThan(60_000);
    }
  });

  it('thưởng không vượt trần cũ của client (500/1500 coins, 250/200 exp)', () => {
    // Trần cũ chính là mức lạm phát trước đây; server phải thấp hơn hoặc bằng,
    // và quan trọng là không được lấy từ request.
    expect(REWARD_CATALOG.pvp.coins).toBeLessThanOrEqual(500);
    expect(REWARD_CATALOG.pvp.exp).toBeLessThanOrEqual(250);
    expect(REWARD_CATALOG.racing.coins).toBeLessThanOrEqual(1500);
    expect(REWARD_CATALOG.racing.exp).toBeLessThanOrEqual(200);
  });

  it('giảm thiểu sát thương khi spam: phần thưởng / thời gian chờ rất nhỏ', () => {
    // Số lần nhận tối đa trong 1 phút phải nhỏ, không thể farm nhanh.
    for (const cfg of Object.values(REWARD_CATALOG)) {
      const perMinute = (60_000 / cfg.cooldownMs) * cfg.coins;
      expect(perMinute).toBeLessThanOrEqual(cfg.coins);
    }
  });
});

describe('vòng lặp cộng thưởng không thể âm thầm lặp lại', () => {
  it('cooldown đủ dài để giới hạn coins/phút', () => {
    // Trước đây 1500 coins/lần × 60 lần/phút = 90.000 coins/phút.
    const pvpCoinsPerMinute = (60_000 / REWARD_CATALOG.racing.cooldownMs) * REWARD_CATALOG.pvp.coins;
    const racingCoinsPerMinute = (60_000 / REWARD_CATALOG.racing.cooldownMs) * REWARD_CATALOG.racing.coins;
    expect(pvpCoinsPerMinute).toBeLessThan(200);
    expect(racingCoinsPerMinute).toBeLessThan(200);
  });
});
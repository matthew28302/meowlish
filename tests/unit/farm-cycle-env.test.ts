import { describe, expect, it } from 'vitest';

import {
  isTestCycleLeak,
  resolveCycleSeconds,
  shouldUseTestCycles,
} from '@/lib/farmCycleEnv';

/**
 * Security (2026-10-15): `FARM_CYCLE_TEST` rút chu kỳ chăn nuôi về 1 giây.
 * Trước đây route đọc thẳng `process.env` mà không kiểm tra môi trường, nên
 * chỉ cần biến này lọt lên production là gà đẻ trứng/máy sữa vô hạn ⇒ phá
 * vỡ kinh tế game. Bộ test chốt lại ranh giới dev/test vs production.
 */
const DEFAULTS = { chicken: 10800, cow: 86400, sheep: 43200 };

describe('shouldUseTestCycles', () => {
  it('TU CHOI tren production du bien co gia tri hop le', () => {
    // Đây là ca quan trọng nhất: 1 giáy giây là farm coin inflation.
    expect(shouldUseTestCycles({ NODE_ENV: 'production', FARM_CYCLE_TEST: '1' })).toBe(false);
    expect(shouldUseTestCycles({ NODE_ENV: 'production', FARM_CYCLE_TEST: '60' })).toBe(false);
  });

  it('cho phep o dev/test', () => {
    expect(shouldUseTestCycles({ NODE_ENV: 'development', FARM_CYCLE_TEST: '1' })).toBe(true);
    expect(shouldUseTestCycles({ NODE_ENV: 'test', FARM_CYCLE_TEST: '2' })).toBe(true);
  });

  it('NODE_ENV undefined van duoc xem la KHONG phai production', () => {
    expect(shouldUseTestCycles({ FARM_CYCLE_TEST: '1' })).toBe(true);
  });

  it('tu choi gia tri khong hop le', () => {
    const base = { NODE_ENV: 'development' };
    expect(shouldUseTestCycles({ ...base, FARM_CYCLE_TEST: undefined })).toBe(false);
    expect(shouldUseTestCycles({ ...base, FARM_CYCLE_TEST: '' })).toBe(false);
    expect(shouldUseTestCycles({ ...base, FARM_CYCLE_TEST: 'abc' })).toBe(false);
    expect(shouldUseTestCycles({ ...base, FARM_CYCLE_TEST: '0' })).toBe(false);
    expect(shouldUseTestCycles({ ...base, FARM_CYCLE_TEST: '-5' })).toBe(false);
    expect(shouldUseTestCycles({ ...base, FARM_CYCLE_TEST: 'Infinity' })).toBe(false);
  });
});

describe('isTestCycleLeak', () => {
  it('bao động khi biến xuất hiện trên production', () => {
    expect(isTestCycleLeak({ NODE_ENV: 'production', FARM_CYCLE_TEST: '1' })).toBe(true);
  });

  it('khong báo động ở dev/test hoặc khi biến vắng', () => {
    expect(isTestCycleLeak({ NODE_ENV: 'development', FARM_CYCLE_TEST: '1' })).toBe(false);
    expect(isTestCycleLeak({ NODE_ENV: 'production' })).toBe(false);
    expect(isTestCycleLeak({ NODE_ENV: 'production', FARM_CYCLE_TEST: '' })).toBe(false);
  });
});

describe('resolveCycleSeconds', () => {
  const FALLBACK = 12 * 60 * 60;

  it('production: bo qua FARM_CYCLE_TEST, tra ve chu ky that', () => {
    for (const animal of ['chicken', 'cow', 'sheep']) {
      expect(resolveCycleSeconds({ NODE_ENV: 'production', FARM_CYCLE_TEST: '1' }, animal, DEFAULTS, FALLBACK)).toBe(
        DEFAULTS[animal],
      );
    }
  });

  it('dev: rut chu ky xuong gia tri bien (san 1 giay)', () => {
    expect(resolveCycleSeconds({ NODE_ENV: 'development', FARM_CYCLE_TEST: '1' }, 'chicken', DEFAULTS, FALLBACK)).toBe(1);
    expect(resolveCycleSeconds({ NODE_ENV: 'development', FARM_CYCLE_TEST: '5' }, 'cow', DEFAULTS, FALLBACK)).toBe(5);
  });

  it('dev: gia tri thap phan bi lam tron ve so nguyen', () => {
    expect(resolveCycleSeconds({ NODE_ENV: 'development', FARM_CYCLE_TEST: '2.9' }, 'chicken', DEFAULTS, FALLBACK)).toBe(2);
  });

  it('khong co bien: dung bang chu ky that cua loai', () => {
    expect(resolveCycleSeconds({ NODE_ENV: 'development' }, 'cow', DEFAULTS, FALLBACK)).toBe(86400);
  });

  it('loai la: dung chu ky fallback', () => {
    expect(resolveCycleSeconds({ NODE_ENV: 'development' }, 'dragon', DEFAULTS, FALLBACK)).toBe(FALLBACK);
  });
});
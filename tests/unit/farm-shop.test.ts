import { describe, expect, it } from 'vitest';
import {
  LIVESTOCK_CATALOG,
  FARM_ANIMAL_SHOP,
  DOG_BREEDS,
  CAT_BREEDS,
  FARM_INCUBATOR,
} from '@/lib/petFarmData';

describe('Farm shop catalog — mua/ban hop le', () => {
  it('3 loai san xuat co trong catalog chu ky', () => {
    for (const t of ['chicken', 'cow', 'sheep']) {
      const info = LIVESTOCK_CATALOG[t];
      expect(info, `catalog "${t}"`).toBeDefined();
      expect(info.feedPrice).toBeGreaterThan(0);
      expect(info.rewardCoins).toBeGreaterThan(0);
      expect(info.rewardExp).toBeGreaterThan(0);
      expect(info.produceEmoji.length).toBeGreaterThan(0);
    }
  });

  it('gia ban luon nho hon gia mua (chong arbitrage)', () => {
    for (const [kind, e] of Object.entries(FARM_ANIMAL_SHOP)) {
      expect(e.sellPrice, `${kind} sell < buy`).toBeLessThan(e.buyPrice);
      expect(e.maxOwned, `${kind} maxOwned`).toBeGreaterThan(0);
      expect(e.defaultCount, `${kind} defaultCount`).toBeLessThanOrEqual(e.maxOwned);
    }
  });

  it('gioi han so con hop ly', () => {
    expect(FARM_ANIMAL_SHOP.hen.maxOwned).toBe(6);
    expect(FARM_ANIMAL_SHOP.cow.maxOwned).toBe(4);
    expect(FARM_ANIMAL_SHOP.sheep.maxOwned).toBe(4);
    expect(FARM_ANIMAL_SHOP.fish.maxOwned).toBe(8);
    expect(FARM_ANIMAL_SHOP.dog.maxOwned).toBe(3);
    expect(FARM_ANIMAL_SHOP.cat.maxOwned).toBe(3);
  });

  it('cho/meo co nhieu giong de chon', () => {
    expect(DOG_BREEDS.length).toBeGreaterThanOrEqual(3);
    expect(CAT_BREEDS.length).toBeGreaterThanOrEqual(3);
    const dogIds = new Set(DOG_BREEDS.map((b) => b.id));
    const catIds = new Set(CAT_BREEDS.map((b) => b.id));
    expect(dogIds.size).toBe(DOG_BREEDS.length);
    expect(catIds.size).toBe(CAT_BREEDS.length);
    for (const b of [...DOG_BREEDS, ...CAT_BREEDS]) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.coat).toMatch(/^#[0-9a-f]{6}$/i);
      expect(b.coatDark).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('lo ap trung cau hinh hop le', () => {
    expect(FARM_INCUBATOR.costCoins).toBeGreaterThan(0);
    expect(FARM_INCUBATOR.durationSeconds).toBe(8 * 60 * 60);
    expect(FARM_INCUBATOR.rewardExp).toBeGreaterThan(0);
  });
});

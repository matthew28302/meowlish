/** Temporary logged-in garden/outfit diagnostic. DELETE after use. */
import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3000';
const user = {
  id: 'user_1790179270449_aecg',
  username: 'sinhvienuitk15',
  email: 'sinhvienuitk15@gmail.com',
  display_name: 'Demo',
  avatar: '🐱',
  streak: 1,
  exp: 150,
  level: 1,
  coins: 1006,
  target_exam: 'toeic',
  role: 'user',
  status: 'active',
  two_factor_enabled: false,
  email_verified: true,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'vi-VN' });
const page = await ctx.newPage();
await page.goto(`${BASE}/pet`, { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate((u) => {
  localStorage.setItem('english_for_me_user', JSON.stringify(u));
  localStorage.removeItem('english_for_me_logged_out');
}, user);
await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'scratch/actual-garden-mobile.png' });
const gardenPet = page.locator('svg[viewBox="0 0 64 64"]').first();
const gardenPetBox = await gardenPet.boundingBox();
if (!gardenPetBox) throw new Error('Garden pet sprite was not visible.');
const cropPadding = 8;
await page.screenshot({
  path: 'scratch/actual-pet-crop.png',
  clip: {
    x: Math.max(0, gardenPetBox.x - cropPadding),
    y: Math.max(0, gardenPetBox.y - cropPadding),
    width: gardenPetBox.width + cropPadding * 2,
    height: gardenPetBox.height + cropPadding * 2,
  },
  caret: 'initial',
});

const shop = page.getByRole('button', { name: /Cửa Hàng & Thử Đồ/ });
await shop.scrollIntoViewIfNeeded();
await shop.tap();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scratch/actual-shop-mobile.png' });
const outfits = page.getByRole('button', { name: /Trang Phục/ });
if (await outfits.count()) {
  await outfits.first().tap();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scratch/actual-shop-outfits-mobile.png' });
}
const petState = await page.evaluate(async () => {
  const r = await fetch('/api/pet?userId=user_1790179270449_aecg').then((x) => x.json());
  return {
    species: r.pet?.pet_type,
    hat: r.pet?.equipped_hat,
    outfit: r.pet?.equipped_outfit,
    accessory: r.pet?.equipped_accessory,
  };
});
console.log(JSON.stringify(petState));
await browser.close();

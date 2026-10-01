/** Chụp ảnh pet đang mặc đồ để đánh giá: /pet-test và /pet (vườn). */
import { chromium, devices } from 'playwright';

const BASE = 'http://localhost:3000';
const browser = await chromium.launch();

// Desktop để thấy fitting room đầy đủ
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p1 = await desktop.newPage();
await p1.goto(BASE + '/pet-test', { waitUntil: 'networkidle', timeout: 90000 });
await p1.waitForTimeout(3000);
const dismiss = async (pg) => {
  for (let i = 0; i < 6; i++) {
    const did = await pg.evaluate(() => {
      const m = document.querySelector('.z-\\[10000\\]');
      if (!m) return false;
      const b = m.querySelector('button[title]');
      if (b) { b.click(); return true; }
      return false;
    });
    await pg.waitForTimeout(600);
    if (!did) return true;
    const still = await pg.evaluate(() => !!document.querySelector('.z-\\[10000\\]'));
    if (!still) return true;
  }
  return false;
};
console.log('pet-test modal dismissed:', await dismiss(p1));
await p1.waitForTimeout(800);
await p1.screenshot({ path: 'scratch/look-pettest-top.png' });
await p1.evaluate(() => window.scrollBy(0, 700));
await p1.waitForTimeout(600);
await p1.screenshot({ path: 'scratch/look-pettest-2.png' });
await p1.evaluate(() => window.scrollBy(0, 700));
await p1.waitForTimeout(600);
await p1.screenshot({ path: 'scratch/look-pettest-3.png' });

// /pet vườn
const p2 = await desktop.newPage();
await p2.goto(BASE + '/pet', { waitUntil: 'networkidle', timeout: 90000 });
await p2.waitForTimeout(5000);
console.log('garden modal dismissed:', await dismiss(p2));
await p2.waitForTimeout(1500);
await p2.screenshot({ path: 'scratch/look-garden.png' });

// Mobile viewport
const mob = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined });
const p3 = await mob.newPage();
await p3.goto(BASE + '/pet', { waitUntil: 'networkidle', timeout: 90000 });
await p3.waitForTimeout(5000);
console.log('mobile modal dismissed:', await dismiss(p3));
await p3.waitForTimeout(1500);
await p3.screenshot({ path: 'scratch/look-garden-mobile.png' });

await browser.close();
console.log('done');

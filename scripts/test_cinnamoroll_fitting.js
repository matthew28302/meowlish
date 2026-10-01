const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    localStorage.setItem('english_for_me_user', JSON.stringify({
      id: 'user_demo_default',
      username: 'demo',
      fullName: 'Học Viên Demo'
    }));
    localStorage.removeItem('english_for_me_logged_out');
  });

  await page.goto('http://localhost:3000/pet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Open shop
  const shopBtn = await page.$('button:has-text("Cửa Hàng & Thử Đồ")');
  if (shopBtn) await shopBtn.click();
  await page.waitForTimeout(1000);

  // Screenshot fitting room with Cinnamoroll
  await page.screenshot({ path: 'public/cinnamoroll_fitting_room.png' });
  await browser.close();
  console.log('Saved cinnamoroll_fitting_room.png');
})();

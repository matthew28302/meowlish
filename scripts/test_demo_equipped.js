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
  await page.waitForTimeout(2000);

  // Take screenshot of the farm!
  await page.screenshot({ path: 'public/pet_demo_equipped_farm.png' });
  await browser.close();
  console.log('Saved pet_demo_equipped_farm.png');
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    localStorage.setItem('english_for_me_user', JSON.stringify({ id: 'demo', username: 'demo', fullName: 'Học Viên Demo' }));
    localStorage.removeItem('english_for_me_logged_out');
  });

  await page.goto('http://localhost:3000/pet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'public/pet_main_game_verify.png' });

  // Open shop
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await b.innerText();
    if (text.includes('Cửa Hàng') || text.includes('Shop') || text.includes('Thời Trang')) {
      console.log('Found shop button:', text);
      await b.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/pet_shop_modal_verify.png' });
      break;
    }
  }

  await browser.close();
  console.log('Successfully completed verification script');
})();

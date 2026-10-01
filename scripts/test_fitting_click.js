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
  await page.waitForTimeout(1500);

  // Open shop
  const shopBtn = await page.$('button:has-text("Cửa Hàng & Thử Đồ")');
  if (shopBtn) await shopBtn.click();
  await page.waitForTimeout(1000);

  // Click on Grad Cap card
  const gradCap = await page.$('text=Mũ Cử Nhân Tri Thức');
  if (gradCap) {
    await gradCap.click();
    await page.waitForTimeout(500);
  }

  // Switch to Trang Phục
  const outfitTab = await page.$('button:has-text("Trang Phục")');
  if (outfitTab) {
    await outfitTab.click();
    await page.waitForTimeout(500);
    // Click on Dev Hoodie or first outfit
    const outfitItem = await page.$('text=Áo Hoodie Dev Hacker');
    if (outfitItem) await outfitItem.click();
  }

  // Switch to Phụ Kiện
  const accTab = await page.$('button:has-text("Phụ Kiện")');
  if (accTab) {
    await accTab.click();
    await page.waitForTimeout(500);
    // Click on Smart Glasses
    const accItem = await page.$('text=Kính Mắt Trí Tuệ');
    if (accItem) await accItem.click();
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/pet_fitting_interactive_test.png' });
  await browser.close();
  console.log('Fitting click test complete!');
})();

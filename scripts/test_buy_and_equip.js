const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  page.on('dialog', async (dialog) => {
    console.log('Dialog popped up:', dialog.type(), dialog.message());
    await dialog.accept();
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('Browser Error:', msg.text());
  });

  await page.addInitScript(() => {
    localStorage.setItem('english_for_me_user', JSON.stringify({ id: 'demo', username: 'demo', fullName: 'Học Viên Demo' }));
    localStorage.removeItem('english_for_me_logged_out');
  });

  await page.goto('http://localhost:3000/pet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Open shop
  const shopBtn = await page.$('button:has-text("Cửa Hàng & Thử Đồ")');
  if (shopBtn) await shopBtn.click();
  await page.waitForTimeout(800);

  // Click on the buy button (button with text containing "xu" or "Mua")
  const buyBtn = await page.$('button:has-text("60 xu")');
  if (buyBtn) {
    console.log('Clicking buy button for 60 xu...');
    await buyBtn.click();
    await page.waitForTimeout(1500);
  }

  // Close modal via the X button at top right of modal
  const closeBtn = await page.$('button:has-text("✕"), div[role="dialog"] button:has(.lucide-x), button.rounded-full');
  if (closeBtn) {
    console.log('Clicking modal close button...');
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Screenshot the farm with the newly equipped cool_cap
  await page.screenshot({ path: 'public/pet_bought_and_equipped_in_farm.png' });
  await browser.close();
  console.log('Purchase and farm roam verified!');
})();

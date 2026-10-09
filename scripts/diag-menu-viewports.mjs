// Đo menu "Thêm" ở NHIỀU khung nhìn: vị trí menu, ancestor có overflow (clip),
// và phần tử nào thực sự nhận click tại tâm mỗi mục (backdrop hay menu?).
import { chromium } from 'playwright';

const BASE = process.env.PROBE_BASE || 'http://localhost:3000';
const VIEWPORTS = [
  { name: 'mobile 393x852', width: 393, height: 852 },
  { name: 'tablet 768x1024', width: 768, height: 1024 },
  { name: 'desktop 1221x785 (anh chup)', width: 1221, height: 785 },
  { name: 'desktop 1440x900', width: 1440, height: 900 },
];

const b = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height } });
  const p = await ctx.newPage();
  try {
    await p.goto(`${BASE}/pet`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(9000);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    const tab = p.locator('button', { hasText: 'Sân Vườn Linh Vật' }).first();
    if ((await tab.count()) === 0) { console.log(`${vp.name}: KHONG co tab`); await ctx.close(); continue; }
    await tab.click();
    await p.waitForTimeout(2500);
    const more = p.locator('button[aria-haspopup="menu"]').first();
    if ((await more.count()) === 0) { console.log(`${vp.name}: KHONG co nut Them`); await ctx.close(); continue; }
    await more.click();
    await p.waitForTimeout(900);

    const r = await p.evaluate(() => {
      const m = document.querySelector('[role="menu"]');
      if (!m) return { err: 'menu khong mo' };
      const mr = m.getBoundingClientRect();
      const cs = getComputedStyle(m);

      // Các ancestor của menu có overflow khác visible => có thể cắt (clip).
      const clippers = [];
      let el = m.parentElement;
      while (el && el !== document.body) {
        const s = getComputedStyle(el);
        if (s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible') {
          const ar = el.getBoundingClientRect();
          clippers.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 55),
            overflow: `${s.overflowX}/${s.overflowY}`,
            rect: { top: Math.round(ar.top), bottom: Math.round(ar.bottom) },
            // Menu có nằm ngoài clipper này không?
            cutsVertically: mr.top < ar.top - 0.5 || mr.bottom > ar.bottom + 0.5,
          });
        }
        el = el.parentElement;
      }

      // Tại tâm mỗi mục, phần tử nào nhận click?
      const items = [...m.querySelectorAll('[role="menuitem"]')];
      const hits = items.map((it) => {
        const ir = it.getBoundingClientRect();
        const cx = ir.left + ir.width / 2;
        const cy = ir.top + ir.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        return {
          label: (it.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22),
          top: Math.round(ir.top),
          // Nằm trong viewport?
          inViewportY: ir.top >= 0 && ir.bottom <= window.innerHeight,
          // Phần tử nhận click có nằm trong menu không?
          clickReachesItem: !!(hit && it.contains(hit)),
          hitEl: hit ? `${hit.tagName.toLowerCase()}.${(hit.className || '').toString().slice(0, 40)}` : 'null',
        };
      });

      return {
        menuTop: Math.round(mr.top),
        menuBottom: Math.round(mr.bottom),
        vh: window.innerHeight,
        fullyInViewport: mr.top >= 0 && mr.bottom <= window.innerHeight,
        clippedAtTop: mr.top < 0,
        clippedAtBottom: mr.bottom > window.innerHeight,
        className: (m.className || '').slice(0, 120),
        clippers,
        hits,
      };
    });

    const bad = (r.hits || []).filter((h) => !h.clickReachesItem || !h.inViewportY).length;
    console.log(`\n=== ${vp.name} ===`);
    console.log(`  menu top=${r.menuTop} bottom=${r.menuBottom} vh=${r.vh} | trong viewport: ${r.fullyInViewport ? 'YES' : 'NO'} | class: ${r.className}`);
    console.log(`  ancestor co overflow (nghi clip): ${r.clippers.length}`);
    (r.clippers || []).forEach((c) => console.log(`    - ${c.tag}.${c.cls} [${c.overflow}] ${c.rect.top}..${c.rect.bottom} catMenu=${c.cutsVertically ? 'CO' : 'khong'}`));
    (r.hits || []).forEach((h) => console.log(`    muc "${h.label}" y=${h.top} trongViewport=${h.inViewportY} clickRaTImuc=${h.clickReachesItem} nhanClick=${h.hitEl}`));
    console.log(`  => ${bad === 0 && r.fullyInViewport ? 'PASS' : `FAIL (${bad} muc khong an duoc / menu bi cat)`}`);
    if (r.err) console.log('  err:', r.err);
  } catch (e) {
    console.log(`${vp.name}: LOI ${e.message.slice(0, 120)}`);
  }
  await ctx.close();
}
await b.close();
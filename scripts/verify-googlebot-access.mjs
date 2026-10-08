// Google Search Console báo "Sitemap could not be read" cho meowlish.io.vn.
// Test: Googlebot UA có bị chặn (Cloudflare Bot Fight / WAF / challenge)?
// Và redirect chain của Googlebot đi qua những gì?
const TARGETS = [
  'https://meowlish.io.vn/sitemap.xml',
  'https://meowlish.io.vn/robots.txt',
  'https://www.meowlish.io.vn/sitemap.xml',
  'https://www.meowlish.io.vn/robots.txt',
];

const UAS = {
  googlebotDesktop:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/125.0.0.0 Safari/537.36',
  googlebotSmartphone:
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/125.0.0.0 Mobile Safari/537.36',
  normalBrowser:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

for (const target of TARGETS) {
  console.log(`\n=== ${target} ===`);
  for (const [name, ua] of Object.entries(UAS)) {
    try {
      // KHÔNG follow redirect — nhìn từng hop một (Googlebot cũng theo từng hop).
      const res = await fetch(target, {
        headers: { 'User-Agent': ua },
        redirect: 'manual',
      });
      const loc = res.headers.get('location') ?? '';
      const cfMitigated = res.headers.get('cf-mitigated') ?? '';
      const server = res.headers.get('server') ?? '';
      const cfRay = res.headers.get('cf-ray') ?? '';
      const flags = [
        cfMitigated && `cf-mitigated=${cfMitigated}`,
        /cloudflare/i.test(server) && 'qua Cloudflare',
        res.status === 403 && 'BLOCKED-403',
        res.status === 503 && 'CHALLENGE-503',
        res.status === 429 && 'RATE-429',
      ].filter(Boolean);

      console.log(
        `  ${name.padEnd(20)} ${res.status} ${loc ? '-> ' + loc.slice(0, 55) : ''} ${flags.join(' ')}`
      );
      if (res.status === 200) {
        const text = await res.text();
        console.log(`    content: ${text.length} bytes | co XML: ${text.includes('<urlset') || text.includes('User-Agent')}`);
      }
    } catch (e) {
      console.log(`  ${name.padEnd(20)} ERR: ${String(e.message).slice(0, 60)}`);
    }
  }
}

// Theo full redirect chain cho Googlebot (như Google thật sự làm).
console.log('\n=== FULL CHAIN (Googlebot, follow redirect) ===');
let url = 'https://meowlish.io.vn/sitemap.xml';
for (let hop = 0; hop < 6; hop++) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UAS.googlebotDesktop },
    redirect: 'manual',
  });
  const loc = res.headers.get('location');
  console.log(`  hop ${hop}: ${res.status} ${url.slice(0, 60)} ${loc ? '-> ' + loc.slice(0, 60) : ''}`);
  if (!loc || res.status === 200) break;
  url = new URL(loc, url).toString();
}

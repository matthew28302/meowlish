// Mail gui tu may chu co vuot qua bao loc cua Gmail khong?
// Kiem tra SPF / DKIM / DMARC / PTR cho domain gui (SMTP_USER).
import dns from 'dns/promises';

const domains = process.argv.slice(2);
if (!domains.length) domains.push('imfishball.id.vn', 'maychuemail.com');

for (const d of domains) {
  console.log(`\n=== ${d} ===`);
  const txt = async (name) => {
    try {
      const recs = await dns.resolveTxt(name);
      return recs.map((r) => r.join(''));
    } catch (e) {
      return null;
    }
  };

  const spf = await txt(d);
  console.log('  SPF   :', spf ? spf.filter((s) => s.startsWith('v=spf1')).join(' | ') || '(khong co v=spf1)' : '(khong tra duoc)');
  console.log('  DMARC :', (await txt(`_dmarc.${d}`))?.join(' | ') || '(khong co)');
  const dkim = (await txt('default._domainkey.' + d))?.join(' | ');
  console.log('  DKIM(default) :', dkim || '(khong co)');
  const mx = await dns.resolveMx(d).catch(() => []);
  console.log('  MX   :', mx.length ? mx.map((r) => `${r.priority} ${r.exchange}`).join(', ') : '(khong co MX)');
}
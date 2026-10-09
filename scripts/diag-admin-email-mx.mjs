// Domain trong ADMIN_EMAIL / users.admin.email có nhận được mail không?
// Kiểm tra MX (và A fallback) — KHÔNG in địa chỉ email.
import dns from 'dns/promises';

const domains = ['meowlish.com', 'meowlish.io.vn'];

for (const d of domains) {
  console.log(`\n=== ${d} ===`);
  try {
    const mx = await dns.resolveMx(d);
    if (!mx.length) {
      console.log('  MX: KHONG CO  -> domain KHONG nhan duoc email');
    } else {
      mx.sort((a, b) => a.priority - b.priority);
      mx.forEach((r) => console.log(`  MX: ${r.priority} ${r.exchange}`));
    }
  } catch (e) {
    console.log(`  MX: LOI (${e.code || e.message}) -> KHONG nhan duoc email`);
  }
  try {
    const a = await dns.resolve4(d);
    console.log(`  A : ${a.join(', ')}`);
  } catch {
    console.log('  A : (khong co)');
  }
  // SPF/DKIM không kiểm tra ở đây, nhưng NS cho biết DNS còn sống
  try {
    const ns = await dns.resolveNs(d);
    console.log(`  NS: ${ns.join(', ')}`);
  } catch {
    console.log('  NS: (khong tra duoc)');
  }
}
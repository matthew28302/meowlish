// Đo CSP thực tế trên production sau khi bật (đợt 2).
const B = 'https://www.meowlish.io.vn';
const res = await fetch(B + '/');
const csp = res.headers.get('content-security-policy') || '';

console.log('CSP thuc te tren production:');
console.log(csp || '(KHONG CO)');
console.log('---');

const required = [
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];
for (const d of required) {
  console.log((csp.includes(d) ? 'PASS ' : 'FAIL ') + d);
}
console.log((/unsafe-eval/.test(csp) ? 'FAIL ' : 'PASS ') + 'khong co unsafe-eval o production');

for (const h of ['cross-origin-opener-policy', 'cross-origin-resource-policy', 'x-frame-options', 'strict-transport-security', 'content-security-policy']) {
  const v = res.headers.get(h);
  console.log((v ? 'PASS ' : 'FAIL ') + h + (v ? ' = ' + v.slice(0, 40) : ''));
}
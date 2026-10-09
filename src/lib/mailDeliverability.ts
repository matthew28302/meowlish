/**
 * Kiểm tra domain có NHẬN ĐƯỢC email không (bản ghi MX).
 *
 * Vì sao cần: 2026-10-09, OTP quản trị "gửi thành công" (nodemailer trả về ok)
 * nhưng đi tới `admin@meowlish.com` — domain KHÔNG tồn tại trong DNS (NXDOMAIN).
 * SMTP relay nhận và im lặng bỏ, nên giao diện báo thành công còn người dùng
 * không thấy email. Đây là lỗi "thành công giả" đắt nhất trong luồng mail.
 *
 * Nguyên tắc:
 * - Chỉ chặn khi biết CHẮC không có MX (NXDOMAIN / ENODATA / rỗng).
 * - Lỗi mạng/DNS không truy vấn được ⇒ vẫn cho gửi (fail-open): không để
 *   sự cố DNS của hạ tầng chặn mất email hợp lệ.
 * - Cache kết quả để không gọi DNS mỗi lần gửi (TTL 6 giờ).
 */
import dns from 'node:dns/promises';

interface CacheEntry {
  hasMx: boolean;
  checkedAt: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

/** Lấy phần domain của email (sau dấu @, bỏ khoảng trắng, lowercase). */
export function emailDomain(email: string): string | null {
  const at = String(email || '').lastIndexOf('@');
  if (at < 1 || at === String(email).length - 1) return null;
  return String(email).slice(at + 1).trim().toLowerCase() || null;
}

export interface DeliverabilityResult {
  /** true = chắc chắn domain nhận được mail. */
  deliverable: boolean;
  /** true = chắc chắn KHÔNG nhận được (có MX rỗng). */
  knownUndeliverable: boolean;
  domain: string;
  detail: string;
}

export async function checkEmailDeliverable(email: string): Promise<DeliverabilityResult> {
  const domain = emailDomain(email);
  if (!domain) {
    return {
      deliverable: false,
      knownUndeliverable: true,
      domain: '(khong tach duoc)',
      detail: 'Dia chi email khong hop le (thieu "@domain").',
    };
  }

  const cached = cache.get(domain);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return {
      deliverable: cached.hasMx,
      knownUndeliverable: !cached.hasMx,
      domain,
      detail: cached.hasMx ? 'MX OK (cache)' : 'Khong co MX (cache)',
    };
  }

  let records: string[] = [];
  let positiveNoMx = false;
  try {
    const mx = await dns.resolveMx(domain);
    records = mx.map((r) => r.exchange).filter(Boolean);
    positiveNoMx = mx.length === 0;
  } catch (err: any) {
    const code = err?.code || '';
    // ENODATA / NXDOMAIN = chắc chắn không có MX. Lỗi khác = không chắc.
    positiveNoMx = code === 'ENODATA' || code === 'NXDOMAIN' || code === 'ENOTFOUND';
    if (!positiveNoMx) {
      return {
        deliverable: true,
        knownUndeliverable: false,
        domain,
        detail: `Khong kiem tra duoc MX (${code || 'loi mang'}) — van cho phep gui.`,
      };
    }
  }

  const hasMx = records.length > 0;
  cache.set(domain, { hasMx, checkedAt: Date.now() });

  return {
    deliverable: hasMx,
    knownUndeliverable: !hasMx,
    domain,
    detail: hasMx
      ? `MX OK: ${records.slice(0, 3).join(', ')}`
      : 'Domain khong co ban ghi MX — email se khong bao gio duoc nhan.',
  };
}

/** Chỉ dùng cho test/log — xoá cache để đo lại. */
export function __clearDeliverabilityCache(): void {
  cache.clear();
}
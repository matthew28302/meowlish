import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=()',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
  {
    // Dữ liệu người dùng đã xác thực KHÔNG được cache ở bất kỳ tầng trung gian
    // nào. Trước đây các route API trả `Cache-Control: public, max-age=0` — chữ
    // `public` là dấu hiệu sai: nếu sau này thêm `s-maxage` hoặc có CDN phía
    // trước, dữ liệu cá nhân của một người sẽ bị trả cho người khác.
    key: 'Cache-Control',
    value: 'private, no-store, max-age=0',
  },
];

/**
 * Content-Security-Policy.
 *
 * Hiện ứng dụng chỉ có MỘT sink HTML (`dangerouslySetInnerHTML` trong
 * `layout.tsx` với script tĩnh đọc theme), nhưng CSP là hàng phòng thủ duy nhất
 * chặn được sink kế tiếp. Ứng dụng dùng:
 *   - script tĩnh nội tuyến ở layout.tsx (theme) ⇒ cần 'unsafe-inline' cho script
 *   - Google Fonts (stylesheet + font) ⇒ cần fonts.googleapis.com / fonts.gstatic.com
 *   - `blob:` cho tải ảnh/audio, `data:` cho ảnh nội tuyến
 *   - `connect-src 'self'` cho fetch tới chính API
 * Bản cứng hơn (nonce thay cho 'unsafe-inline') cần làm riêng vì Next.js sinh
 * script tự động; xem docs/security-audit-2026-10.md mục tồn đọng.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // TODO: thay 'unsafe-inline' bằng nonce để chặn cả script tĩnh chèn tay.
  // `unsafe-eval` CHỈ thêm ở môi trường phát triển: React dùng eval() để dựng lại
  // callstack khi debug. Ở production React không cần, nên không cho phép — bật ở
  // production sẽ làm CSP vô hiệu với tấn công XSS chèn script.
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "frame-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  // Dev only: allow the LAN IPs to load dev assets/HMR, otherwise Next blocks
  // every request coming from a non-localhost origin and the client never hydrates.
  // Entries are hostnames only (no scheme, no port).
  allowedDevOrigins: [
    "192.168.56.1",
    "192.168.1.1",
    "192.168.61.1",
    "192.168.104.2",
    "*.local",
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
      {
        // API trả dữ liệu cá nhân: không bao giờ để tầng trung gian cache.
        // Đặt riêng vì `/:path*` đã áp cho mọi thứ nhưng ta muốn rule này rõ ràng
        // và không phụ thuộc vào việc ai đó xoá nhầm khỏi danh sách chung.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;

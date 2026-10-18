# Báo cáo kiểm tra bảo mật — vòng 3 (2026-10-18)

> Phạm vi: các bề mặt MỚI / chưa phủ trong đợt 1+2 (docs/security-audit-2026-10.md). Chạy trên dev server CỤC BỘ (localhost:3000) + probe NHẸ production (www.meowlish.io.vn). Tất cả thay đổi nằm trong working tree — CHƯA commit, CHƯA push.

## 1. Kết quả tổng quan

- Probe cũ (`security-probe-local.mjs`, `security-probe-round2.mjs`): **vẫn pass** (không hồi quy).
- Probe mới `scripts/security-probe-round3.mjs` (7 đòn tấn công) + test `tests/unit/security-round3.test.ts` (7 describe, 15+ khẳng định): **pass**.
- `npm run scan:secrets`: pass. `npx tsc --noEmit`: sạch. `npx vitest run`: **35 files / 572 tests pass**.
- Phát hiện 7 lỗ hổng mới (mức MED → HIGH), **đã sửa kèm test tái hiện**.

## 2. Các lỗ hổng phát hiện & đã sửa

| # | Lỗ hổng | Mức | File | Cách sửa |
|---|---------|-----|------|----------|
| R3-1 | **Rò rỉ PII phiếu hỗ trợ của KHÁCH** — tài khoản bất kỳ tra `?ticketId=<mã đoán>` của phiếu do khách (user_id NULL) nhận đầy đủ tên/email/nội dung/trả lời admin. Mã phiếu sinh bằng `Math.random()` (không CSPRNG) ⇒ dễ đoán trong ~1.05M giá trị | HIGH | `src/app/api/support/route.ts` | Tra theo mã phiếu phải yêu cầu `ticket.user_id === auth.userId` (`ownsTicket`); phiếu khách trả `redacted: true` (chỉ metadata). Mã phiếu sinh bằng `crypto.randomInt()` |
| R3-2 | **Account enumeration qua forgot-password** — tài khoản bị vô hiệu hóa trả 403 "Tài khoản đã bị vô hiệu hóa" (khác với 200 của tài khoản không tồn tại) ⇒ dò tài khoản tồn tại | MED | `src/app/api/auth/forgot-password/route.ts` | Dùng chung `GENERIC_RESET_MESSAGE` cho mọi trường hợp không gửi được email (disabled + không tồn tại); không trả 403 riêng |
| R3-3 | **Ghi email lỏng qua `request_email_verification`** — chỉ kiểm `includes('@') && includes('.')` ⇒ nhận danh sách nhiều địa chỉ / khoảng trắng ⇒ máy gửi email | MED | `src/app/api/auth/route.ts` | Regex một-địa-chỉ + cắt trần 120 ký tự + thông báo "Địa chỉ email không hợp lệ" |
| R3-4 | **`/api/log/access` lấy danh tính từ body** — `clientUsername` từ body khi phiên không có dòng users ⇒ bịa tên trong bảng audit | MED | `src/app/api/log/access/route.ts` | Bỏ đọc `body.clientUsername`; vẫn xác thực phiên bằng `verifyUserSessionToken` (HMAC) |
| R3-5 | **Trả `err.message` thô cho client** (chi tiết SQLite/AWS/nodemailer) ở nhiều route | MED | `src/app/api/sync/route.ts`, `admin/auth`, `forgot-password`, `reset-password` | Trả thông báo chung; log chi tiết server-side. Body JSON hỏng trả 400 generic (không lộ vị trí parse) |
| R3-6 | **`GET /api/pet` không có hạn mức đọc** — endpoint nặng, ai cũng gọi được ⇒ lạm dụng CPU/DB | MED | `src/app/api/pet/route.ts` | Thêm rate limit đọc (429 khi flood) |
| R3-7 | **Mã phiếu sinh bằng `Math.random()`** (không CSPRNG) | MED | `src/app/api/support/route.ts` | Chuyển sang `crypto.randomInt()` |

## 3. Kiểm chứng

- `scripts/security-probe-round3.mjs`: chạy các đòn tấn công trên (rò rỉ PII, enumeration, email lỏng, flood `/api/pet`, rò chi tiết lỗi, body JSON hỏng) — **PASS**.
- `tests/unit/security-round3.test.ts`: 7 describe × nhiều khẳng định bám sát từng đòn tấn công — pass.
- `npm run scan:secrets`: pass. `npm run lint` không chạy (đã biết fail sẵn trên main — BUG-010, không thuộc phạm vi).
- Production: chỉ smoke NHẸ (www.meowlish.io.vn) — không brute force; không có thay đổi nào được push.

## 4. Việc còn lại / khuyến nghị

- **Admin auth** (`/api/admin/auth`): đã gỡ `err.message` thô; 2FA + cookie httpOnly đã có từ đợt 2 — nên rà thêm CSP `unsafe-eval` chỉ dev (đã đúng).
- **AI proxy** (`/api/support/ai`): rate limit 20/phút/IP + cascade Groq→Gemini→KB đã có; nên thêm budget token/ngày để chặn đốt quota khi bot spam nhiều IP.
- **Translate/TTS**: có rate limit theo IP; nên thêm hạn mức theo user sau đăng nhập.
- **Headers**: next.config.ts đã có HSTS/X-Frame-Options/CSP/CORP/COOP/Cache-Control private — giữ nguyên; cân nhắc thêm CSP `report-to` để thu thập vi phạm.
- **Kiểm soát liên tục**: thêm `security-probe-round3.mjs` vào CI (chạy trên dev server) như probe-round1/2.

> Ghi chú phối hợp: agent 3 đã sửa `src/app/api/auth/route.ts` (thêm await cho hash async) và `src/lib/db.ts` (hashing) — các thay đổi bảo mật ở đây giữ nguyên các await đó.

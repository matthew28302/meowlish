# Báo cáo kiểm tra bảo mật — 2026-10-07

Rà soát bằng probe chủ động trên production + đọc toàn bộ 21 route API
(`src/app/api/**/route.ts`), đối chiếu `.agent/skills/security-review/SKILL.md`
và `.agent/skills/web-database-security/SKILL.md`.

Repo **public**, nên mọi phát hiện dưới đây coi là đã bị kẻ tấn công đọc được.

## Đã sửa (P0/P1) — đã xác minh bằng probe lặp lại sau khi vá

| # | Vấn đề | Mức | File | Cách khai thác đã thử |
|---|---------|-----|------|----------------------|
| 1 | `verifyUserSessionToken` coi **mọi token bắt đầu bằng `user_`** là hợp lệ, không kiểm tra HMAC | **CRITICAL** | `src/lib/userAuth.ts` | Đặt cookie `meowlish_user_session=<userId nạn nhân>` → HTTP 200 kèm dữ liệu thật (coins, tên, tiến độ). Nhánh này gọi là "tương thích ngược phiên dev" nhưng cookie do client gửi lên. |
| 2 | IDOR: `pet`, `pet/shop` (4 chỗ) **bỏ qua** kết quả `unauthorized` rồi tự tra DB bằng `userId` từ client | **CRITICAL** | `src/app/api/pet/route.ts`, `src/app/api/pet/shop/route.ts` | `GET /api/pet?userId=<nạn nhân>` không cần cookie → đọc pet, inventory, coins, bạn bè, chat. `POST` → ghi vào tài khoản nạn nhân. |
| 3 | `claim_pvp_reward` / `claim_racing_reward` **nhận `rewardCoins`/`rewardExp` từ body**, không verify trận đấu, không chống replay | **CRITICAL** | `src/app/api/pet/route.ts` | `POST {"action":"claim_racing_reward","rewardCoins":1500}` lặp lại: tối đa +1500 coins/lần × 60 lần/phút. |
| 4 | `harvest_crop` không kiểm tra `harvest_ready_at` | HIGH | `src/app/api/pet/route.ts` | Gieo (–20 coins) → `harvest_crop` ngay (+50 coins): farm net ngay sau khi gieo. Nhánh `harvest_all_crops` có kiểm tra, nhánh này thì không. |
| 5 | `/api/support` GET **không xác thực**: tra cứu phiếu của người khác theo `userId` / `email`, hoặc mã 4 ký tự (~1,05 triệu giá trị) | HIGH | `src/app/api/support/route.ts` | `GET /api/support?email=<email nạn nhân>` → trả tên, email, tiêu đề, nội dung khiếu nại và trả lời admin. `POST` ghi `user_id` từ client → đính phiếu giả vào tài khoản người khác. |
| 6 | Khách chưa đăng nhập được **ghi** vào tài khoản demo thật | HIGH | `src/lib/userAuth.ts` | `POST` bất kỳ endpoint nào không có cookie vẫn qua được với `userId` demo. |
| 7 | `POST /api/progress` cộng thưởng **mỗi request** kể cả khi item đã hoàn thành | HIGH | `src/app/api/progress/route.ts` | Lặp cùng `itemId` → +50 coins/+100 exp mỗi request. |
| 8 | `/api/log/access` không xác thực, tin `clientUserId` từ body | MEDIUM | `src/app/api/log/access/route.ts` | Ghi log truy cập giả mang tài khoản người khác; spam bảng log. |

## Cách sửa

1. `verifyUserSessionToken`: bỏ hẳn nhánh `user_`. Giờ chỉ nhận token có HMAC
   hợp lệ, kiểm tra độ dài trước `timingSafeEqual`, cắt payload từ dấu `:` cuối.
2. `pet` / `pet/shop`: `unauthorized` → 401, `forbidden` → 403, dùng `auth.userId`.
   Không bao giờ tra DB bằng `userId` từ client.
3. Thưởng PVP/đua: thêm bảng `reward_claims`, `claimTimedReward()` ghi vết bằng
   **một** câu `INSERT … ON CONFLICT … WHERE` (chống cả race), cooldown 10 phút,
   giá trị thưởng do server quyết định (`REWARD_CATALOG`).
4. `harvest_crop`: kiểm tra `harvest_ready_at` / `stage = 'ripe'`, trả 409.
5. `/api/support`: tài khoản lấy từ phiên. Đã đăng nhập → chỉ thấy phiếu mình.
   Chưa đăng nhập + `userId` → 401. Chưa đăng nhập + `email` → chỉ metadata
   (`redacted: true`). `POST` lấy `user_id` từ phiên, bỏ qua giá trị client gửi.
6. `getAuthenticatedUser`: khách chỉ được **GET/HEAD**; mọi method ghi trả
   `unauthorized`. Nút demo trên UI vẫn hoạt động vì nó đăng nhập thật.
7. `/api/progress`: dùng `changes` của upsert — chỉ lần tạo dòng đầu mới cộng
   thưởng; lần lặp trả `alreadyCompleted`.
8. `/api/log/access`: `clientUserId` chỉ được dùng nếu tồn tại thật trong DB.

## Kiểm chứng

```
node scripts/security-probe-local.mjs     # 24 PASS / 0 FAIL
npx vitest run                             # 237 passed (13 file)
npx tsc --noEmit                           # sạch
npx playwright test                        # 4 passed
```

Probe dùng đúng các mẫu tấn công từng thành công trên production, gồm IDOR
với `userId` của tài khoản thật (`user_1791298260433_rh7b`).

## Chưa xửa — cần quyết định

| Mức | Vấn đề | Vì sao chưa sửa |
|-----|--------|-----------------|
| HIGH | `rateLimit.ts` tin tuyệt đối `X-Forwarded-For`; store in-memory ⇒ trên serverless đa instance, kẻ tấn công đổi header là bypass toàn bộ rate limit (đã quan sát: probe đổi IP vẫn đăng nhập thoải mái) | Cần store dùng chung (Postgres/Redis) — sẽ làm khi chuyển sang Postgres. |
| MEDIUM | `SESSION_SECRET` fallback literal trong source (`userAuth.ts`, `adminAuth.ts`) | Nếu production thiếu `AUTH_SALT`, kẻ tấn công tự forge được token. Cần throw khi thiếu biến môi trường. |
| MEDIUM | `/api/admin/*` nhận token qua query string → rò vào access log / Referer | Nên chỉ nhận cookie httpOnly + header. |
| MEDIUM | `respond_proposal` (`pet/route.ts`) không kiểm tra người gọi là 1 trong 2 bên | Cần kiểm tra `proposer_id`/`partner_id`. |
| LOW | Thiếu `Content-Security-Policy` | CSP chặt có thể làm hỏng three.js/Google Fonts; cần thử kỹ trước khi bật. |
| LOW | `finish_battle_room` nhận `winnerId` từ body, không kiểm tra host/guest | Cần kiểm tra vai trò trong phòng. |
| LOW | Đổi mật khẩu / khoá tài khoản không thu hồi token cũ | Cần `session_version` trong DB. |

## Ghi chú

- Rate limit in-memory nên chạy probe nhiều lần sẽ tự khoá IP của máy dev.
  Probe dùng IP riêng qua `x-forwarded-for` để tránh; nếu gặp 429 khi đăng nhập
  demo, chờ hết cửa sổ 10 phút hoặc khởi động lại dev server.
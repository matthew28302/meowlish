# Báo cáo kiểm tra bảo mật — 2026-10-07 (đợt 1 và đợt 2)

Đợt 1: probe chủ động trên production + đọc toàn bộ 21 route API, đối chiếu
`.agent/skills/security-review/SKILL.md` và `.agent/skills/web-database-security/SKILL.md`.

Đợt 2: bốn lượt audit song song — (a) client/XSS, (b) OWASP backend A01–A08,
(c) git history + supply chain + GitHub, (d) black-box đo trên production. Đối chiếu
`.agent/skills/top-web-vulnerabilities/SKILL.md`, `sql-injection-testing/SKILL.md`,
`xss-html-injection/SKILL.md`.

Repo **public**, nên mọi phát hiện dưới đây coi là đã bị kẻ tấn công đọc được.

---

# Đợt 2 — đã sửa

| # | Vấn đề | Mức | File | Bằng chứng |
|---|---------|-----|------|-----------|
| 9 | `request_email_verification` **không xác thực**, `userId` từ body ⇒ **ghi đè được email nạn nhân**, rồi `forgot-password` đặt mật khẩu mới gửi về email đó ⇒ **chiếm tài khoản** | **CRITICAL** | `api/auth/route.ts` | Chuỗi 3 bước, không cần mật khẩu. Điều kiện: tài khoản nạn nhân chưa có email. |
| 10 | **Bản vá đợt 1 của chính tác giả là code chết**: `ON CONFLICT … DO UPDATE` luôn trả `changes = 1` ⇒ nhánh "đã hoàn thành" không bao giờ chạy, farm coins vẫn vô hạn | **HIGH** | `api/progress/route.ts` | `scripts/check-progress-upsert.mjs`: `DO UPDATE → [1,1,1]`, `DO NOTHING → [1,0,0]`. |
| 11 | `GET /api/auth` không xác thực, trả **email đầy đủ + coins + streak + role** của bất kỳ tài khoản nào | **HIGH** | `api/auth/route.ts` | Đo trên production: `?username=demo → 200 (331 byte)`, không tồn tại → 404. |
| 12 | `verify_email` lấy `userId` từ body, bỏ qua `verifyRes.userId` ⇒ bật `email_verified` cho nạn nhân **và** nhận về hồ sơ đầy đủ | **HIGH** | `api/auth/route.ts` | Chỉ cần 1 tài khoản đăng ký + OTP của chính mình. |
| 13 | PII thật trong **bundle client**: 3 email cá nhân trong `PETS_CATALOG` | **HIGH** | `lib/petData.ts`, `app/pet/page.tsx` | Tìm thấy trong JS tĩnh tải về cho mọi khách vào `/pet`. |
| 14 | Token admin AES-256 nằm trong `sessionStorage` (12 chỗ) dù cookie đã `httpOnly` | **HIGH** | `app/duahau/page.tsx` | Một XSS/extension là lấy toàn quyền admin. |
| 15 | `finish_battle_room` không kiểm thành viên, `winnerId` từ body ⇒ cước `2 × cược` người khác | MED-HIGH | `api/pet/route.ts` | `roomId` đọc được từ `activeRooms`. |
| 16 | `respond_proposal` không kiểm thành viên ⇒ cưỡng ép kết hôn, hoàn coins tùy ý | MED | `api/pet/route.ts` | Chỉ cần đoán `proposalId`. |
| 17 | `/api/support` tra cứu mã phiếu 4 ký tự (~1,2 triệu giá trị) trả nguyên nội dung cho khách | MED | `api/support/route.ts` | Khách đoán mã là đọc được phiếu người khác. |
| 18 | Secret fallback literal trong repo **public** (`SESSION_SECRET`, `ENCRYPTION_KEY`) | MED-HIGH | `lib/userAuth.ts`, `lib/adminAuth.ts` | Thiếu `AUTH_SALT` ở production ⇒ forge được phiên/token admin. |
| 19 | Email admin thật ghi trong source — cũng là nơi OTP quản trị gửi tới | MED | `lib/adminAuth.ts` | Ai đọc repo cũng biết OTP 2FA gửi đâu. |
| 20 | Nhận token admin qua query string `?token=` / `?adminSecret=` | MED | `api/admin/{users,logs,support}` | Rò vào access log, `Referer`, history. |
| 21 | Thiếu `Content-Security-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` | MED | `next.config.ts` | `unsafe-eval` **chỉ** ở dev (React dev cần eval); production giữ chặt. |
| 22 | `Cache-Control: public` trên API dữ liệu cá nhân | MED | `next.config.ts` | Đổi thành `private, no-store`. |

### Cách sửa

9. `request_email_verification`: bắt buộc `getAuthenticatedUser` + `auth.userId === userId`,
   kiểm **trước** khi ghi email, ghi log thay đổi email.
10. `/api/progress`: `ON CONFLICT … DO NOTHING`; kiểm `inserted` **trước** khi tiêu hạn
    mức (nếu không, lần gọi lại hao hạn mức oan rồi nhận 429 ⇒ người dùng mất cả item);
    thêm hạn mức ngày `progress_daily_budget` (250 coins / 500 exp) vì `itemId` do client
    gửi nên có thể bịa; hết hạn mức thì **xoá dòng vừa chèn**.
11. `GET /api/auth`: bắt buộc phiên; gỡ hẳn tra cứu theo `username`; xem tài khoản khác
    chỉ trả `{id, username, status}` kèm cờ `limited`.
12. `verify_email`: `verifyRes.userId !== userId` ⇒ 403.
13. Tách `src/lib/cinnamorollAccess.ts` (chỉ server); `GET /api/pet` trả kèm
    `cinnamorollAccess`; client dùng cờ đó thay vì tự tính; gỡ `requiredEmails` (không
    nơi nào đọc) và import thừa.
14/15. Kiểm thành viên; `winnerId` phải là host hoặc guest; chuyển trạng thái có điều
    kiện `AND status = 'in_progress'` nên chỉ một request nhận thưởng.
16/17. Khách tra cứu phiếu chỉ nhận metadata (`redacted: true`).
18/19. Throw khi thiếu `AUTH_SALT` / `ADMIN_EMAIL` ở production; dev dùng hằng ghi rõ
    `_DEV_ONLY`.
22. `Cache-Control: private, no-store, max-age=0` cho `/:path*` và `/api/:path*`.

### Kiểm chứng đợt 2

```
node scripts/security-probe-round2.mjs   # 20 PASS / 0 FAIL  (đòn tấn công đợt 1 + đợt 2)
node scripts/security-probe-local.mjs    # 24 PASS / 0 FAIL  (đợt 1, không hồi quy)
npx vitest run                           # 262 passed / 15 file
npx tsc --noEmit                         # sạch
npx playwright test                      # 4 passed
```

Test chặn tái phát mới: `tests/unit/security-regressions.test.ts` (15 khẳng định bám sát
từng đòn tấn công đã thành công), `tests/unit/no-client-pii.test.ts` (4 — đã cắm probe
thật để xác nhận nó bắt được lỗi).

---

# Đợt 1 — đã sửa

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

## Chưa xửa — cần quyết định (cập nhật sau đợt 2)

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

---

# Đợt 2 — còn tồn đọng

| Mức | Vấn đề | Vì sao chưa sửa / cần gì |
|-----|--------|--------------------------|
| **HIGH** | `rateLimit.ts` tin tuyến tính phần tử đầu `X-Forwarded-For` và lưu store in-memory `Map` | Quan sát được trên production: probe đổi header mỗi request vẫn đăng nhập thoải mái ⇒ **toàn bộ rate limit vô hiệu**. Store cũng không chia sẻ giữa các instance serverless. Cần dùng IP do platform cung cấp (`x-vercel-forwarded-for` / `CF-Connecting-IP`) + store dùng chung (Postgres/Redis) — sẽ làm trong lúc chuyển sang Postgres. |
| **HIGH** | Mật khẩu admin + mật khẩu SMTP cũ còn trong **lịch sử git** (mật khẩu admin nằm công khai ~6 ngày trên repo public) | Xoá file không thu hồi được dữ liệu đã sao chép. Mật khẩu admin **đã được đổi**; cần purge history bằng `git filter-repo` (mọi người phải clone lại; fork/clone cũ vẫn giữ bí mật). |
| MED | `next` 16.3.5 có RCE (`GHSA-vcvr-r3jv-pc5j`, `next/og`) và `sharp` 0.35.4 có use-after-free | `next/og` không được import ở đâu nên khả năng khai thác ≈ 0, nhưng nên nâng phiên bản. |
| MED | OTP sinh bằng `Math.random()` (không phải CSPRNG), salt hash OTP là hằng trong source | Nên dùng `crypto.randomInt` + HMAC bằng secret của server. |
| MED | `forgot-password` **không dùng token một-lần**: đặt mật khẩu mới ngay rồi gửi bằng email dạng plaintext; link không hết hạn | Nên chuyển sang token 1 lần, hạn 30', lưu bản hash trong DB, chỉ gửi link. |
| MED | Không có cơ chế thu hồi phiên: đổi mật khẩu không vô hiệu token cũ (TTL 14 ngày) | Cần `session_version` trong DB hoặc bảng thu hồi. |
| MED | Token admin vẫn được gửi kèm `Authorization` từ client và lưu trong RAM/sessionStorage (`app/duahau/page.tsx`) | Đã bỏ đường query string; bước tiếp theo là bỏ hẳn `sessionStorage`, chỉ dựa vào cookie `httpOnly`. |
| MED | `/api/log/access` nhận `POST` không xác thực, không rate limit | Bề mặt ghi log không auth; cần rate limit và ràng buộc chặt hơn. |
| LOW | `err.message` trả thẳng cho client ở ~15 chỗ HTTP 500 | Đo trên production chỉ thấy message của JSON parser, chưa lộ tên bảng; nên bọc bằng message chung ở production. |
| LOW | `sanitizeText` chỉ xoá `<` `>` (blacklist, không escape theo ngữ cảnh) | Hiện chưa khai thác được vì không có sink HTML nhận dữ liệu người dùng; nhưng đây là hàng phòng thủ mong manh. |
| LOW | Thiếu `robots.txt` chặn `/duahau`, `/api/`; trang `/pet-test`, `/fitcheck` còn sống trên production; TLS 1.0/1.1 vẫn bắt tay được (cấu hình Cloudflare, không sửa được trong code) | Dọn bề mặt lộ. |
| LOW | `request_email_verification` cho phép kẻ đã đăng nhập **đổi email lần đầu** mà không xác minh email cũ | Chấp nhận được ở mức thấp (chỉ tài khoản chưa có email), nhưng nguyên vẹn hơn là tách luồng `change_email` có OTP gửi tới email cũ. |

## Việc phải làm ngay, không liên quan tới code

1. **Đặt `ADMIN_EMAIL` trên Vercel.** Bản vá đợt 2 chuyển email nhận OTP quản trị sang
   biến môi trường và **fail-closed**: thiếu biến này thì `/duahau` không đăng nhập được
   bằng OTP. Thêm biến rồi deploy lại (đổi biến môi trường cần deploy mới).
2. **Đặt `AUTH_SALT` trên Vercel** nếu chưa có (dài ≥ 16 ký tự) — giờ thiếu là app báo
   lỗi ngay thay vì chạy với secret công khai.
3. **Purge lịch sử git** (xem mục trên) và xoá object `.env.local` trong bucket Filebase.
4. **Bật GitHub secret scanning + push protection**; repo đang không có CI nên các guard
   trong `tests/unit/` không tự chạy trước khi merge.
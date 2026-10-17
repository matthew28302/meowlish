# Baseline kiểm thử — 15/10/2026, ~15:30–16:05 (UTC+7)

> **CẢNH BÁO VỀ ĐỘ TIN CẬY CỦA CHÍNH FILE NÀY**
> Trong lúc đo, **một agent khác đang sửa `src/` và `tests/` song song**. Fingerprint `src/`
> đã đổi 4 lần trong một phiên: `87CF1034CF…` → `03F9C90328…` → `5DCE41F8A6…` → `6B22D71DFB…`.
> Vì vậy:
> - **Unit + lint + build**: đo lại 2–3 lần ở các fingerprint khác nhau → kết quả ổn định, đáng tin.
> - **E2E**: KHÔNG ổn định, phụ thuộc trạng thái dev server tại thời điểm chạy (mục 2 giải thích).
> Các con số dưới đây ghi kèm thời điểm đo. Không được coi e2e là "cổng chặn" khi `src/` còn đang
> được sửa song song.

---

## 1. Unit (vitest)

`npx vitest run` — chạy 2 lần (fingerprint `87CF…` và `6B22…`).

| Lần đo | Tổng | Pass | Fail | Pending | Suites |
|---|---|---|---|---|---|
| Lần 1 | 496 | 496 | 0 | 0 | 87 |
| Lần 2 (sau khi agent khác thêm test) | **519** | **519** | **0** | 0 | 94 |

- **Kết luận: 519/519 PASS, 0 fail.** Tăng từ 496 → 519 là do agent khác thêm
  `tests/unit/farm-cycle-env.test.ts`, `format-number.test.ts` và sửa `a11y-icon-buttons.test.ts`.
- Không có test fail nào ở cả 2 lần đo.
- Cảnh báo môi trường (không phải lỗi test): `vitest.config.ts` dùng ESM syntax nhưng
  `.ts` được load dưới `configLoader: 'native'` → Vite cảnh báo sẽ hỏng ở Vite major kế tiếp.

## 2. E2E (playwright)

`npx playwright test` (chromium, 1 worker, chạy vào dev server sẵn có `localhost:3000`).

**Ba lần chạy liên tiếp, gần như cùng code:**

| Lần | Tổng | Pass | Fail | Tỷ lệ |
|---|---|---|---|---|
| Run A | 10 | 10 | 0 | 100% |
| Run B | 10 | 8 | 2 | 80% |
| Run C | 9 | 2 | 7 | 22% |

**→ E2E hiện KHÔNG đáng tin làm cổng chặn. Đây là kết luận quan trọng nhất của Vòng 0.**

| Spec | Kết quả | Nguyên nhân lỗi |
|---|---|---|
| `health.spec.ts` | pass *(nhưng pass sai)* | Assertion `expect(res.status()).toBeLessThan(600)` ⇒ **503 cũng pass**. Endpoint đang trả 503 `db:"error"` mà spec không bắt được. Xem mục 5. |
| `home.spec.ts` | pass ổn định | Trang tĩnh, không cần auth. |
| `login.spec.ts` (từ HEAD, **không sửa**) | **flaky**: pass 5 lần, fail 2 lần | `expect(demoButton).toBeHidden()` fail (16.4s). Nút demo không xuất hiện ổn định sau `goto('/')` → `count = 0` ở thời điểm đo (race hydration). Khi fail chạy đơn lẻ lại pass (2.6s). |
| `vocabulary.spec.ts` (từ HEAD, **không sửa**) | **flaky**: timeout 60s | `AuthModal` (`role=dialog aria-modal=true fixed inset-0 z-[10000]`) **chặn pointer events** — lỗi `subtree intercepts pointer events` khi click filter chip. |
| `ai-chat.spec.ts` (**tôi thêm**) | flaky trong run C | Cùng nguyên nhân auth modal + dev server recompile. |
| `floating-chat.spec.ts` (agent khác thêm) | 2/2 flaky | Phụ thuộc trạng thái animation đang được sửa. |
| `mobile-overflow.spec.ts` (agent khác thêm) | flaky | Timeout ~20.5s ⇒ dev server đang recompile. |

**Nguyên nhân gốc (không phải lỗi test):**
1. **Agent khác sửa `src/` liên tục ⇒ Turbopack recompile giữa chừng.** Các test hỏng đều
   timeout ở mốc ~20.5s — đúng dấu hiệu chờ response của dev server đang build lại.
2. **Race hydration ở landing `/`**: nút "Thử nhanh với tài khoản demo" không hiện ngay sau `goto('/')`
   (đo được `count = 0` ở lần đầu). Spec nào click nó sớm là fail.
3. **AuthModal phủ `z-[10000]` toàn màn hình.** Với user chưa đăng nhập, việc modal chặn click là
   *đúng thiết kế*, nhưng spec `vocabulary.spec.ts` không chờ modal đóng nên gặp race.

**Bonus (đo được, chưa fix — test-side):** nhiều lần chạy song song với agent khác **cùng ghi vào
thư mục `test-results/`**, làm mất `error-context.md` của nhau. Không có `outputDir` riêng.

## 3. Lint

`npx eslint .` — đo 3 lần, **kết quả y hệt nhau dù `src/` thay đổi mạnh**. Con số này rất đáng tin.

- **Tổng error: 420** (+ 254 warning), trên **97 file**.

| Rule | Số lỗi | File bị ảnh hưởng nhiều nhất |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | **320** (76%) | `src/app/api/pet/route.ts` (52), `src/app/pet/page.tsx` (29), `src/app/api/auth/route.ts` (17), `PetSocialHub.tsx` (15) |
| `@typescript-eslint/no-require-imports` | **68** | `scripts/verify-full-system.ts` (12), `src/lib/groqTranslator.ts` (10), `scripts/upload-s3.js` (4), `scripts/restore-s3.js` (4) |
| `react-hooks/set-state-in-effect` | **23** | `src/app/practice/writing/page.tsx` (4), `src/app/support/page.tsx` (2), `src/app/practice/speaking/page.tsx` (2), `src/app/pet/page.tsx` (2) |
| `react/no-unescaped-entities` | 6 | — |
| `prefer-const` | 2 | — |
| `@typescript-eslint/ban-ts-comment` | 1 | `playwright.config.ts` |

**Phân bố 420 error theo thư mục:** `src/` **308** · `scratch/`+khác **48** · `scripts/` **33** · `tests/` **31**.

**⚠ Nhóm đáng lo nhất — `react-hooks/set-state-in-effect` (23 lỗi).** Đây không phải lỗi hình thức:
`setState` trong `useEffect` là nguồn gốc cổ điển của render loop, state không đồng bộ, và race khi
hydration. Nằm rải rác ở 17 file (xem bảng trên).

**Warning đáng chú ý:** `@typescript-eslint/no-unused-vars` **225** (dead code tích tụ),
`react-hooks/exhaustive-deps` **15** (thiếu dep ⇒ stale closure, cùng họ với nhóm trên).

**Lưu ý:** 23 lỗi nằm trong `tests/unit/game-reward.test.ts` (file agent khác vừa tạo) —
lint config đang áp rule `src/` cho cả thư mục `tests/`.

## 4. Build

`npm run build` → **PASS, exit 0.** 43 static page, compile 705ms, TypeScript pass.

Cảnh báo ghi nhận được:

1. `⚠ Warning: Next.js ignored package-lock.json in C:\Users\NVX because it is outside the current
   Git repository` → đề nghị set `turbopack.root` trong `next.config.ts`. **Không phải lỗi build.**
2. `[SQLite DB] Mật khẩu: 4/13 tài khoản còn hash SHA-256 cũ — vẫn đăng nhập được và sẽ tự nâng cấp
   sang scrypt khi họ đăng nhập.` → **rủi ro bảo mật thật**, 4/13 tài khoản (31%) còn dùng hash
   SHA-256 yếu hơn. Cần ép migrate.
3. `[SQLite DB] AUTH_SALT: dùng env AUTH_SALT` → salt đang lấy từ env, OK.

**Không có cảnh báo nào từ Turbopack/React về hydration hay bundle.**

> **Cảnh báo vận hành (quan trọng cho các agent sau):** chạy `npm run build` **ghi đè `.next` của
> dev server đang chạy** → dev server trả **503** trong khoảng 1–2 phút. Phải `npm run build`
> **sau khi** chạy e2e, hoặc dừng dev server trước.

## 5. Lỗi cần chặn trước khi deploy (P0 test-side)

**P0-1 — `/api/health` đang trả 503 nhưng spec không bắt được.**
Đo được: `{"ok":false,"db":"error","latencyMs":~2900,"dictionary":{"ok":true,"entries":26416}}`.
Nguyên nhân gốc (đã truy ra từ tầng Postgres, không phải lỗi test):
`PostgresError XX000: (ENOTFOUND) tenant/user postgres.bnvvopdkvvyfxtzlgbgo not found`.
DNS + TCP tới `aws-0-ap-southeast-1.pooler.supabase.com:6543` **đều OK** ⇒ project Supabase trong
`DATABASE_URL` **không tồn tại / đã bị xoá**. Đây là blocker hạ tầng, có sẵn từ trước, không do
`next build` gây ra.
→ **Test-side:** `health.spec.ts` phải assert `status === 200` và `body.db === 'ok'`. Hiện
`toBeLessThan(600)` khiến endpoint "đèn đỏ" mất tác dụng đúng mục đích — chính doc-comment trong
`src/app/api/health/route.ts` nói endpoint này tồn tại để "giám sát nhìn thấy đỏ".

**P0-2 — E2E không ổn định, không dùng làm cổng chặn được khi `src/` còn sửa song song.**
Bằng chứng: 3 lần chạy liên tiếp cho 10/10 → 8/10 → 2/9.
→ **Test-side:** (a) chạy e2e khi `src/` đã đứng yên; (b) thêm `await expect(authDialog).toBeHidden()`
trước mọi thao tác click; (c) chờ selector thay vì `goto()` rồi click ngay; (d) đặt `outputDir` riêng
cho từng run. Cân nhắc `retries: 1` khi thi hành CI.

**P0-3 — `react-hooks/set-state-in-effect` × 23 + `exhaustive-deps` × 15.**
Rủi ro hành vi thật (render loop / stale closure / race hydration), không phải style.

**P1 — 4/13 tài khoản còn hash SHA-256** (mục 4.2). Cần ép migrate sang scrypt.

**P1 — 320 lỗi `no-explicit-any`**, tập trung ở `api/pet/route.ts` (52) và `pet/page.tsx` (29):
làm mất type safety ở đúng API nhạy cảm dữ liệu người dùng.

**P2 — Dead config:** `DATA_BACKEND=postgres` được set trong `.env.local` nhưng **không được đọc ở
bất kỳ đâu trong `src/`** (`grep DATA_BACKEND src/` → 0 kết quả). `isPgEnabled()` chỉ kiểm tra có
`DATABASE_URL` hay không. Nghĩa là không có công tắc tắt Postgres an toàn; đổi backend sẽ âm thầm
không có tác dụng.

---

## Ghi chú về bug `FloatingAiChat` (đã xác minh)

Task bàn giao cảnh báo nút chat AI có `float-soft` **vô hạn** ⇒ `.click()` timeout. **Đã xác minh
đúng, rồi đã được agent khác sửa trong lúc tôi đo:**

- **Trạng thái lúc tôi đo đầu tiên** (`animate-[float-soft_3s_ease-in-out_infinite]`):
  `.click()` chuẩn **luôn timeout 6–8s** với `element is not stable`. Đo tọa độ 12 lần → **11/12
  vị trí khác nhau**, biên độ ~6px. `elementFromPoint` xác nhận nút là topmost ⇒ **người dùng thật
  vẫn bấm được** (mouse click thật mở panel, `aria-expanded=true`). Khi đã mở, animation được thay
  bằng `rotate-90` ⇒ nút đứng yên.
- **Trạng thái hiện tại**: `animate-[float-soft_2.4s_ease-in-out_2]` (hữu hạn, 2 vòng) ⇒ nút
  ổn định, `click()` không `force` hoàn tất trong **386ms**.

**Kết luận:** bug đã được sửa trong lúc đo. Spec `tests/e2e/ai-chat.spec.ts` (tôi thêm, pass, lint
sạch 0 lỗi) vẫn dùng `force: true` + comment giải thích, nên vẫn đúng khi ai đó vô tình làm
animation vô hạn lại.

**Một cảnh báo dễ gây hiểu nhầm:** ở trang **chưa đăng nhập** như `/pet`, nút chat **không bấm
được**, nhưng đây **KHÔNG phải bug** — `AuthModal` guest-gate phủ `fixed inset-0 z-[10000]` và chặn
pointer events (đã xác nhận bằng `elementFromPoint` sau cả 5s, overlay vẫn còn `pointer-events: auto`,
`z-index: 10`, `opacity: 1`). Sau khi đăng nhập, nút là topmost và bấm bình thường.

## Thay đổi tôi đã thực hiện

Chỉ trong `tests/`, không đụng `src/`, không `git add`/`commit`/`push`:

- **Thêm** `tests/e2e/ai-chat.spec.ts` — 1 spec pass, lint sạch, có comment ghi lại bug animation.
  (Vì vậy e2e từ 4 spec gốc lên 5; con số "10 test" ở Run A đã bao gồm spec của agent khác.)
- Đã xoá toàn bộ file probe tạm (`_probe*.spec.ts`).

---

## Cập nhật 18/10/2026 (sau vòng fix avatar pixel + luồng đặt lại mật khẩu)

- **Vitest:** 534/534 pass (32 file) — `npm test` kèm `scan:secrets` 9/9 probe.
- **TSC:** 0 lỗi (`npx tsc --noEmit`).
- **Build:** `npm run build` PASS (43 trang).
- **Playwright (chạy riêng từng spec khi dev server đứng yên):**
  - `toast.spec.ts` 4/4 — đã bỏ seed `window.toast`, trigger UI thật (login demo → ép coins=0 → cho ăn).
  - `reset-password.spec.ts` 3/3 — guest không bị login gate đè; nút "Yêu cầu link mới" POST inline (hết HTTP 405).
  - `mobile-overflow.spec.ts` 2/2.
- **Luồng đặt lại mật khẩu (xác minh end-to-end thủ công):** user tạm + token thật → UI "Mật khẩu đã được đặt lại!", DB đổi hash + token đánh dấu đã dùng; email SMTP gửi thành công.
- **Avatar/logo:** `scratch/ui-check.js` xác nhận logo sidebar đổi GIF theo avatar user sau khi lưu (trước đây dính cứng `cat.gif`), grid 100 ảnh pixel không ảnh lỗi.
- **Lưu ý môi trường dev:** đã thêm `APP_URL=http://localhost:3000` vào `.env.local` để link trong email dev trỏ về localhost — trước đây trỏ về production nên bấm link báo "link không hợp lệ" (token chỉ nằm ở DB local). File `.env.local` không được commit.
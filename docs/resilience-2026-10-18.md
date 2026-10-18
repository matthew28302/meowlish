# Bền bỉ & tải — 2026-10-18 (AGENT 3/4: load + resilience hardening)

> Phạm vi: LOCAL ONLY. **Chưa push, chưa commit** — mọi thay đổi nằm trong working
> tree. Không deploy, không sửa `vercel.json`, không đụng dev server :3000.
> Máy đo là máy dev DÙNG CHUNG với 3 agent khác ⇒ số liệu có nhiễu; các kết luận
> đều dựa trên cặp đo cùng kịch bản trước/sau + micro-benchmark tái lập được.

---

## 1. Tóm tắt

1. **Login hết xếp hàng tuần tự**: thêm `hashPasswordAsync`/`verifyPasswordAsync`
   (crypto.scrypt chạy trên libuv threadpool) và chuyển call site login/register/
   reset sang bản async. Cùng kịch bản 30 VU: login p50 **2079ms → 762ms**
   (p99 **2337ms → 1580ms**). Micro-bench 30 lần scrypt cùng tham số: sync
   2376ms và chặn event loop suốt (timer 50ms bắn ở 2377ms) → async 543ms, timer
   bắn ở 54ms.
2. **Hash tương thích 100%**: format giữ nguyên `scrypt$N$r$p$salt$hash`; verify
   được hash cũ (scrypt do bản sync tạo) và SHA-256 legacy theo cả 2 salt
   (`legacy-current`/`legacy-fallback`, `needsRehash=true`). Có unit test khóa
   hợp đồng + test parity sync↔async.
3. **Sửa kèm 1 lỗ hổng nhỏ phát hiện khi test**: hash `scrypt$…$` rỗng phần
   digest decode ra keylen 0 ⇒ `timingSafeEqual(empty, empty)` = true ⇒ **mọi
   mật khẩu đều khớp**. Đã chặn ở CẢ bản sync lẫn async (1 dòng mỗi bên).
4. **Bền bỉ tra từ (client)**: thêm `src/lib/dictionaryFetch.ts` (retry 502/503/
   504/lỗi mạng, backoff 1s/3s, không retry 4xx/500/AbortError) và gắn vào dòng
   fetch tra từ trong `HighlightTooltip.tsx` (đúng 1 dòng fetch như phân công).
5. **S3 download**: thêm retry có giới hạn cho `GetObject` của DB chính
   (3 lần, backoff 500ms/1000ms) — chỉ thao tác ĐỌC, không đụng upload.
6. **Vòng 3**: 3 kịch bản (60 VU đọc hỗn hợp / 40 VU login+ghi / 100 VU burst
   tra từ) — **0 lỗi 5xx**, `system_error_logs` rỗng, 159 dòng progress ghi đúng
   kỳ vọng và đã dọn sạch.
7. **Phát hiện phụ quan trọng (chưa sửa — ngoài phạm vi cho phép)**: khoá đăng
   nhập theo username tự bắn **429 oan khi N người dùng cùng tài khoản (demo)
   đăng nhập trùng thời điểm** — vì bộ đếm INCR cho MỌI lần thử (kể cả lần đúng)
   trước khi verify xong. Đo: 8 login đồng thời → 5×200 + 3×429; login đơn ngay
   sau → 200. Đề xuất ở §8.

---

## 2. Thay đổi chi tiết

| File | Thay đổi |
|---|---|
| `src/lib/db.ts` | Thêm `hashPasswordAsync`, `verifyPasswordAsync` (dùng `promisify(crypto.scrypt)`); **giữ nguyên** `hashPassword`/`verifyPassword` sync cho đường lạnh (seed admin/demo, scripts, admin tools). Thêm 1 dòng chặn hash rỗng ở CẢ 2 bản verify. Import thêm `promisify` từ `util`. |
| `src/app/api/auth/route.ts` | 6 call site đường nóng → async: toggle_2fa re-auth (dòng ~491), update_profile đổi mật khẩu (~611, ~624), login verify (~974, ~988), rehash legacy sau login (~1023). `hashPassword(cleanPassword)` tính trước cho MỌI request được **chuyển vào đúng nhánh register** (~776): trước đây mỗi login còn băm lại mật khẩu vừa gửi (~80ms scrypt vô ích/lần). Callback đồng bộ `profilePersisted` (~646) vẫn dùng bản sync (nó là `() => boolean` của `persistCriticalWrite`). |
| `src/app/api/auth/reset-password/route.ts` | `hashPasswordAsync` cho mật khẩu mới; `verifyChanges` (callback sync) giữ bản sync. |
| `src/lib/dictionaryFetch.ts` | **MỚI** — `fetchWithRetry`: retry tối đa 2 lần (tổng 3), backoff 1s/3s; chỉ retry 502/503/504 + lỗi mạng; không retry 4xx/500/AbortError; huỷ body trước khi thử lại; inject `fetchImpl`/`sleep` cho test. |
| `src/components/HighlightTooltip.tsx` | **Chỉ 1 dòng fetch** trong `fetchAITranslation` đổi sang `fetchWithRetry('/api/translate', …)` + 1 dòng import. Không sửa gì khác. |
| `src/lib/s3Sync.ts` | Thêm `getObjectWithRetry` (3 lần, 500/1000ms) dùng cho `GetObject` trong `doDownloadLocked` (đường khôi phục DB chính). Chỉ thao tác đọc. |
| `tests/unit/password-async.test.ts` | **MỚI** — 8 test: format hash async, round-trip 2 chiều sync↔async, hash cũ scrypt, legacy 2 salt, hash hỏng, parity sync==async (kể cả case hash rỗng), 6 lời gọi đồng thời. |
| `tests/unit/dictionary-fetch.test.ts` | **MỚI** — 9 test: retry 504→200, backoff mặc định, KHÔNG retry 500/4xx, lỗi mạng, cạn lượt thì ném/trả response cuối, AbortError không hồi sinh, `retries=0`. |
| `tests/unit/rate-limit.test.ts` | Bổ sung `hashPasswordAsync`/`verifyPasswordAsync` vào mock `@/lib/db` (mock cũ thiếu hàm mới ⇒ route gọi undefined → 500). |
| `scratch/loadtest.mjs` | Thêm flag `--loginonly`, `--dictwords` (bể 20 từ khác nhau), `--stagger=Nms`. Mặc định không đổi. |
| `scratch/login-burst-probe.mjs` | **MỚI** — probe race khoá username (8 login đồng thời + 1 login đơn). |
| `scratch/register-smoke.mjs` + `scratch/cleanup-smoke-user.mjs` | **MỚI** — smoke đăng ký→login→sai pass, và script dọn tài khoản `agent3_smoke_*`. |
| `scratch/scrypt-bench.mjs` | **MỚI** — micro-benchmark scryptSync vs scrypt async + độ trễ timer 50ms. |

**KHÔNG đụng**: `src/lib/pg.ts`, `src/app/api/health/**`, `src/app/api/dictionary/**`,
`vercel.json`, page UI khác. Không chạy build, không kill dev server, không git.

---

## 3. Số đo TRƯỚC / SAU (cùng kịch bản, 30 VU, reads=0, writes=0, mode=local)

Lệnh: `node scratch/loadtest.mjs --base=http://localhost:3000 --vus=30 --reads=0 --writes=0 --mode=local --label=<nhãn>`

| Label | n | ok | p50 | p90 | p99 | max |
|---|---|---|---|---|---|---|
| `login` **TRƯỚC** (`baseline30`) | 30 | 30 | **2079ms** | 2251ms | **2337ms** | 2337ms |
| `login` **SAU** (`after-async-30`) | 30 | 30 | **762ms** | 1558ms | **1580ms** | 1580ms |
| `progress` trước | 30 | 30 | 1561ms | 2152ms | 2280ms | 2280ms |
| `progress` sau | 30 | 30 | 398ms | 822ms | 832ms | 832ms |
| `dictionary` trước | 30 | 30 | 266ms | 312ms | 330ms | 330ms |
| `dictionary` sau | 30 | 30 | 352ms | 400ms | 405ms | 405ms |
| wall time toàn bài | — | — | — | — | — | 5.7s → 4.9s |

Ghi chú trung thực: `page-home`/`bookmarks` trong lần "sau" chậm hơn do máy chia
sẻ (2 agent khác đang chạy test) — hai đường đó không đi qua scrypt. Tín hiệu
sạch là `login` (đường được sửa) + micro-bench + 2 lần burst login dưới đây:

| Bài đo burst login | n | ok | 429 | p50 | p95 | p99 |
|---|---|---|---|---|---|---|
| 60 VU burst thẳng, không giãn | 60 | 58 | 2 (race khoá username) | 1343ms | 1892ms | 1974ms |
| **60 VU giãn 50ms** (`--stagger=50`) | 60 | **60** | **0** | **60ms** | 111ms | 200ms |

⇒ Với giãn cách (không tự bắn khoá username), mỗi login giờ tốn ~60ms thuần —
tức không còn "xếp hàng sau người trước". Trần cũ ~10 login/s/instance (100ms
scryptSync × tuần tự) đã bị gỡ; trần mới là CPU × 4 luồng threadpool.

### Micro-benchmark (`node scratch/scrypt-bench.mjs`, N=16384 r=8 p=1 keylen=64)

| N lần | (A) scryptSync "trước" | (B) scrypt async "sau" | Timer 50ms bắn ở |
|---|---|---|---|
| 30 | 2376ms (79ms/lần) | **543ms** (~18ms/lần hiệu dụng) | 2377ms → **54ms** |
| 60 | 2957ms (49ms/lần) | **1293ms** (~22ms/lần) | 2957ms → **53ms** |

⇒ (A) chặn event loop suốt thời gian băm (timer 50ms bị đẩy tới ~2.4-3.0s) —
đó chính là cơ chế làm p50 login tăng vọt khi đông người. (B) event loop rảnh
(timer bắn đúng hạn) và tổng thời gian giảm ~2.3-4.4× (libuv threadpool 4 luồng).

---

## 4. Vòng 3 — kết quả 3 kịch bản (dev :3000)

| Kịch bản | Label | n req | OK | Lỗi | wall | p50 chính | Ghi chú |
|---|---|---|---|---|---|---|---|
| (i) 60 VU đọc hỗn hợp (reads=3, writes=1) | `round3-mixed-60` | 720 | 714 | 3×429 + 3×401¹ | 10.3s | progress 586ms / dict 560ms / login 1452ms | **0× 5xx** |
| (ii) 40 VU login + ghi (reads=1, writes=3) | `round3-writes-40` | 400 | 376 | 6×429 + 18×401¹ | 6.6s | write-progress 368ms / progress 472ms | **0× 5xx** |
| (iii) 100 VU burst tra từ (publiconly, 20 từ khác nhau, reads=1) | `round3-dict-100` | 300 | **300** | 0 | 7.4s | dict p50 1369ms, p99 3893ms | **0× 5xx** |

¹ 401 là hệ quả của 429: VU bị chặn login nên không có cookie → các request ghi
sau đó bị 401 đúng thiết kế (IDOR defense), không phải lỗi server.

**Kiểm tra dữ liệu & log** (sau toàn bộ vòng 3):
- `node scratch/db-check.mjs 30`: `error logs: []` — `system_error_logs` TRỐNG.
- `loadtest progress rows: 159` = **đúng kỳ vọng** (60 + 120 lệnh ghi − 3×1 − 6×3
  lượt mất cookie) ⇒ dữ liệu ghi đúng từng dòng, không mất, không nhân đôi.
- Đã dọn: `node scratch/db-check.mjs --clean` → xoá 159 dòng `module_type='loadtest'`.
- Không thấy `SQLITE_BUSY` trong log.
- Smoke prod (chỉ đọc, 2 request): `GET /api/dictionary/search?q=cat` → 200,
  510ms; `GET /` → 200, 448ms. (Prod chạy bản deploy cũ — chưa push nên không
  bị ảnh hưởng bởi các thay đổi này.)

**Smoke đường đăng ký** (xác nhận `pwdHash` chuyển vào nhánh register không vỡ):
`register 200` → `login 200` → `sai pass 401`; tài khoản test đã dọn
(`agent3_smoke_mvcqxt70`: 1 pet + 1 inventory + 1 user).

---

## 5. Bền bỉ từ điển — phân tích (mục 3a) và kết quả

**Single-flight khi cold restore 64MB: CÓ, nhưng theo kiểu "chặn cả instance".**
`dictDb`/`getDictDatabase()` khởi tạo ĐỒNG BỘ: request đầu tiên chạy
`ensureDictionaryRestoredSync()` → `execFileSync(restore-s3.js --dictionary)`
(timeout 30s). Vì JS đơn luồng, request thứ 2..N không thể chen vào — chúng bị
chặn theo. Nghĩa là: *không* có N tiến trình restore song song (tốt), nhưng
**mọi request đồng thời đều bị treo tới 30s** (đúng cơ chế burst 100 tra từ lạnh
→ 10× 504 FUNCTION_INVOCATION_TIMEOUT đã đo trên prod).

Các điểm yếu xác nhận trong code:
- `ensureDictionaryRestoredSync` chỉ chạy khi mở `dictDb` LẦN ĐẦU (lazy) —
  `instrumentation.ts` không warm; health check cũng là một "first access".
- Thất bại/MISS → instance giữ luôn từ điển rỗng cho tới khi process tái sinh
  (`global.__dictDbInstance` đã cache); không có retry trong vòng đời instance.
- `scripts/restore-s3.js --dictionary`: 1 lần thử duy nhất, timeout 30s do db.ts
  đặt; không có retry/backoff khi mạng chập chờn.
- `DICT_RESTORE_TIMEOUT_MS = 30_000` trong khi `maxDuration = 60` của function.
- Trần "1MB" coi là hợp lệ (`MIN_VALID_DICT_BYTES`) — file cũ 64MB nên không sao.

**Đã sửa (an toàn, chỉ đường đọc)**: `getObjectWithRetry` cho download DB chính
trong `s3Sync.ts`.
**Chưa sửa (ngoài phạm vi file được giao)**: đường restore từ điển nằm trong
`scripts/restore-s3.js` + `src/lib/db.ts` (khối dict, bảo vệ) → để xuất ở §8.

**Client retry** đã gắn cho đường tra từ trong `HighlightTooltip` — khi instance
trả 502/503/504, người dùng không mất kết quả: tự thử lại sau 1s rồi 3s. Hai chỗ
còn lại (đề xuất gắn thêm, xem §8): fetch pedagogical cùng file (dòng ~130) và 2
fetch trong `src/app/encyclopedia/page.tsx` (`/api/dictionary/search` dòng ~150,
`/api/dictionary` dòng ~239) — cả hai đều là file của agent khác nên tôi không đụng.

---

## 6. Phát hiện phụ (bằng chứng đo được)

### 6.1 Khoá username tự bắn 429 oan khi burst cùng tài khoản (CHƯA SỬA)
`src/app/api/auth/route.ts` gọi `checkRateLimitPersistent('auth_user_fail:<user>',
5, 15ph)` cho **mọi lần thử**, kể cả lần sắp thành công; chỉ DEL sau khi verify
xong. N request đồng thời cùng username ⇒ tất cả INCR trước khi bất kỳ DEL nào
chạy ⇒ từ request thứ 6 bị 429.

Bằng chứng (`node scratch/login-burst-probe.mjs`): 8 login demo/123456 đồng thời
→ `{200:5, 429:3}`; login đơn ngay sau đó → 200 (bộ đếm được dọn). Trong vòng 3:
3/60 và 6/40 VU bị 429 ở bước login. Trên production, tài khoản `demo` là tài
khoản DÙNG CHUNG (nút "Thử nhanh với tài khoản demo") nên một lớp học cùng bấm
có thể khoá demo 15 phút. Đây là lỗi thiết kế có trước, không do thay đổi async.

### 6.2 Hash rỗng khiến MỌI mật khẩu khớp (ĐÃ SỬA, 1 dòng/bên)
`Buffer.from('???','base64')` → rỗng ⇒ keylen 0 ⇒ `timingSafeEqual(rỗng, rỗng)`
= true. Đã chặn `expected.length === 0` ở cả `verifyPassword` và
`verifyPasswordAsync`; có test parity khóa lại.

### 6.3 Trần throughput thật của login = CPU × UV_THREADPOOL_SIZE
Async scrypt không tạo thêm CPU; burst lớn vẫn xếp hàng trên 4 luồng threadpool
(đo 60 VU không giãn: p50 1343ms). Muốn tăng trần: `UV_THREADPOOL_SIZE` (env,
cần chủ nhân đặt) hoặc giảm cost hash (không khuyến nghị).

### 6.4 `.env.local` không có Upstash
Rate limit persistent đang chạy nhánh in-memory ở local (không đụng Redis dùng
chung với prod) — yên tâm về ô nhiễm bộ đếm prod khi đo local.

---

## 7. Kiểm chứng cuối

- `npx tsc --noEmit` → **sạch** (chạy sau toàn bộ thay đổi).
- `npx vitest run` (toàn bộ): **35 file / 572 test — PASS 100%**.
  - Trong lúc đo, có thời điểm 4 test fail ở file AGENT 1 đang làm dở
    (`tests/unit/security-round3.test.ts`, `scripts/security-probe-round3.mjs`);
    agent 1 đã hoàn thiện phần của họ và lần chạy cuối đã xanh toàn bộ.
- Bộ test liên quan trực tiếp đến phần tôi sửa (password, password-async,
  dictionary-fetch, rate-limit, security-regressions, session-auth,
  persistCriticalWrite, no-hardcoded-secrets): **332 passed / 332**.
  (no-hardcoded-secrets chạy 257 check bao trùm cả các file tôi tạo.)
- Client bundle đã chứa `fetchWithRetry` (tìm thấy trong chunk
  `src_1b8lf3y8-5__0._.js`) ⇒ wiring HighlightTooltip được biên dịch thật.
- Không có lỗi compile/HMR trong lúc đo (page-home 200 xuyên suốt các bài nạp).

---

## 8. ĐỀ XUẤT cần chủ nhân quyết (chưa áp dụng)

### A. Sửa race khoá username (ƯU TIÊN CAO — rẻ, ảnh hưởng người dùng thật)
Đổi cơ chế đếm: **đọc trước ghi sau** — check bộ đếm hiện có (không INCR) trước
khi verify; chỉ INCR khi mật khẩu SAI; xoá khi đúng.
- Ưu: hết 429 oan cho tài khoản dùng chung (demo), vẫn giữ đúng ngữ nghĩa
  "5 lần SAI liên tiếp thì khoá 15 phút"; không đổi message/threshold.
- Nhược: cần thêm 1 hàm `peek`/`bump` trong `rateLimit.ts` + sửa route (file
  agent 1 đang audit) ⇒ cần phối hợp; phải tự kiểm lại test H2 hiện có.

### B. Warm-up từ điển — cần **Pro plan** (Hobby chỉ 2 cron/ngày, prod đã dùng đủ 2)
- Phương án B1: cron mới (Pro) gọi `GET /api/health` hoặc
  `/api/dictionary/search?q=hello` mỗi 5-10 phút → mỗi instance khởi động sẽ
  restore từ điển trước khi người dùng vào.
- Ưu: giảm mạnh xác suất người dùng trúng cold restore; tận dụng hạ tầng có sẵn.
- Nhược: tốn ~20 USD/tháng; **không** cứu được instance scale-out mới (vẫn cold);
  mỗi lần cron là 1 invocation; không thay thế được việc cắt thời gian restore.

### C. Nén gzip 64MB trên Filebase (không cần đổi gói)
- Upload `english_learning_dictionary.db.gz` (SQLite 64MB thường nén còn
  ~20-25MB) bằng `upload-dictionary.mjs`; `restore-s3.js` tải `.gz` rồi gunzip,
  fallback key thô nếu thiếu.
- Ưu: giảm ~2.5-3× thời gian tải ⇒ thoát cửa sổ timeout 30s thoải mái; rẻ, không
  phụ thuộc plan; giảm egress.
- Nhược: sửa quy trình deploy (2 script) + phải giữ tương thích 2 định dạng;
  cần đo lại trên prod (từ Vercel tới Filebase nhanh/chậm khác local).

### D. Không chặn request theo restore (đúng gốc rễ của 504) — cần quyết vì đụng api/dictionary
Chuyển restore sang nền (fire-and-forget) khi mở `dictDb`; nếu bảng còn rỗng thì
`/api/dictionary/*` trả **503 + Retry-After: 2** ngay thay vì treo tới 30s.
- Ưu: biến 504 (treo 30s, function timeout) thành 503 nhanh; client retry hiện
  có (mục 3) sẽ tự lấy kết quả sau 1s/3s ⇒ với người dùng là "chậm một nhịp".
- Nhược: response đầu tiên vẫn không có dữ liệu (chỉ khác là nhanh); cần sửa
  `src/lib/db.ts` (khối dict — file bảo vệ) + có thể cần thông báo UI "đang tải
  từ điển"; phải test kỹ để không trả 503 vĩnh viễn khi restore fail.

### E. CDN cache cho tra từ công khai (Vercel Edge) — cân nhắc
`Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` cho
`GET /api/dictionary/search` với request ẩn danh (không cookie).
- Ưu: cắt tận gốc burst 100 tra từ đồng thời — CDN trả bản cũ trong lúc instance
  đang cold; không tốn thêm hạ tầng; hiệu quả ngay cả khi restore chậm.
- Nhược: kết quả trễ tới 300s (nội dung từ điển tĩnh nên gần như không đổi —
  chấp nhận được, nhưng phải chắc route không phụ thuộc cookie/người dùng);
  cần xử lý key cache theo `q/category/level/page`; khi cập nhật từ điển phải
  chờ purge hoặc đổi version key.

### F. Việc nhỏ khác
- Gắn `fetchWithRetry` cho fetch pedagogical trong `HighlightTooltip.tsx` và 2
  fetch trong `encyclopedia/page.tsx` (hiện chỉ fetch tra từ chính được bọc).
- Đặt `UV_THREADPOOL_SIZE=8` (env Vercel) — đo lại trên prod trước khi giữ.
- Tăng `DICT_RESTORE_TIMEOUT_MS` 30s → ~45s (trong `maxDuration=60`): giảm xác
  suất MISS timeout; nhưng làm request treo lâu hơn nếu chọn phương án D thì
  không cần.
- Cân nhắc `verifyPasswordAsync` cho `adminAuth.ts`/`api/admin/**` (đường admin
  ít tải, hiện vẫn sync — cố ý giữ để sửa tối thiểu).

---

## 9. Rủi ro tồn dư

1. **429 oan khi burst cùng username** (§6.1) — chưa sửa; ảnh hưởng tài khoản
   dùng chung (demo) trên prod.
2. **Cold restore từ điển vẫn chặn request tới 30s** — client retry chỉ che phần
   nào (chỉ 1 đường fetch được gắn); 3 đường còn lại trơ.
3. **Máy đo chia sẻ** — các số "sau" có thể bị nhiễu; kết luận dựa trên metadata
   nhất quán (p50 login, burst giãn cách, micro-bench).
4. **Filebase bỏ qua If-Match** (đã ghi trong `docs/db-sync.md` §5b) — mọi upload
   vẫn last-write-wins; ngoài phạm vi task này.
5. Thay đổi chưa được deploy ⇒ chưa có số đo trên Vercel thật; **cần đo lại login
   100 VU trên prod sau khi deploy** (tôn trọng rate limit, dùng `--mode=prod`).
6. `hashPasswordAsync` cần ~16MB/lần băm × 4 luồng = ~64MB đỉnh — an toàn với
   1024MB của Vercel, nhưng nếu sau này tăng N/r phải tính lại.

---

## 10. Tái lập (lệnh chính)

```powershell
# Baseline/after cùng kịch bản
node scratch/loadtest.mjs --base=http://localhost:3000 --vus=30 --reads=0 --writes=0 --mode=local --label=baseline30
# Burst login sạch (giãn cách để không tự bắn khoá username)
node scratch/loadtest.mjs --base=http://localhost:3000 --vus=60 --loginonly --stagger=50 --mode=local --label=loginonly-60-staggered
# Vòng 3
node scratch/loadtest.mjs --base=http://localhost:3000 --vus=60 --reads=3 --writes=1 --mode=local --label=round3-mixed-60
node scratch/loadtest.mjs --base=http://localhost:3000 --vus=40 --reads=1 --writes=3 --mode=local --label=round3-writes-40
node scratch/loadtest.mjs --base=http://localhost:3000 --vus=100 --publiconly --dictwords=1 --reads=1 --mode=local --label=round3-dict-100
# Chẩn đoán / dọn
node scratch/db-check.mjs 30                 # log lỗi + đếm dòng loadtest
node scratch/db-check.mjs 30 --clean         # dọn dòng loadtest
node scratch/login-burst-probe.mjs           # bằng chứng race khoá username
node scratch/register-smoke.mjs              # smoke register->login (in username để dọn)
node scratch/cleanup-smoke-user.mjs <username>
node scratch/scrypt-bench.mjs 30             # micro-bench sync vs async
# Kiểm thử
npx tsc --noEmit
npx vitest run
```

**Trạng thái: CHƯA PUSH / CHƯA COMMIT.**

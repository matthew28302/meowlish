# DANH SÁCH VẤN ĐỀ TIỀM ẨN — Meowlish (tổng hợp 8 audit, 2026-10-08)

Nguồn: 8 subagent song song — account security, web security, GitHub secrets, UI flow, injection pentest, business-logic pentest, perf/reliability, SEO/a11y. Toàn bộ đo bằng request/cần đo thật, không suy đoán. Không sửa code.

---

## 🔴 CRITICAL (5)

| # | Vấn đề | Nguồn | Bằng chứng |
|---|---|---|---|
| C1 | **SMTP_PASS + admin password + Filebase keys đã lộ trong git history public** — commit `7e68c6a` xoá khỏi source nhưng mọi commit trước vẫn còn. Xoá source không đủ vì repo public đã bị clone/fork. | GitHub scan | **Bắt buộc ROTATE cả 3** (SMTP email pass, admin pass, Filebase access keys) |
| C2 | **Chuỗi forge admin token trên máy dev → ghi đè DB production**: `.env.local` thiếu `AUTH_SALT` → fallback secret công khai → tạo được AES-256-GCM token `{role:'admin'}` → `GET /api/sync` 200 → `POST /api/sync {action:'upload'}` rơi vào nhánh "dev-push chủ động" → 1 request đè DB prod 69.6MB bằng bản local cũ hơn 1 ngày. Subagent dừng đúng trước bước cuối. | Business pentest | Tái hiện đầy đủ 4 bước, chỉ thiếu PUT cuối |
| C3 | **OTP sinh bằng `Math.random()`** (userAuth.ts:24, adminAuth.ts:93) — PRNG đoán được, mã xác thực có thể dự đoán. | Account security | Đổi `crypto.randomInt(100000, 1000000)` |
| C4 | **Last-write-wins thật sự**: Filebase bỏ qua `If-Match` (CAS = code chết) → 2 instance ghi chồng mất dữ liệu vĩnh viễn, không bản sao nào chứa. Chỉ register/password được `persistCriticalWrite` bảo vệ; pet/progress/bookmarks/chat không. | Perf audit | Đã probe thật, tiền lệ user `kangyoungha` |
| C5 | **`next` 16.3.5 có CVE CRITICAL (RCE)** + sharp HIGH + source-map-js HIGH | Perf audit (npm audit) | Bump next ≥16.4.0 |

## 🟠 HIGH (10)

| # | Vấn đề | Nguồn |
|---|---|---|
| H1 | **Endpoint AI public không auth/rate limit**: `/api/support/ai`, `/api/translate`, `/api/tts`, `/api/dictionary/search` → spam cháy quota Groq/Gemini, mất tiền | Web security |
| H2 | **`/api/auth` không rate limit trên production** (store in-memory reset theo process; đo 15 lần sai liên tục không 429) + không lockout per-username | Web + Account |
| H3 | **Fallback secret literal chạy production nếu thiếu env** (userAuth SESSION_SECRET, adminAuth ENCRYPTION_KEY, s3Sync AUTH_SALT) — comment nói fail-closed nhưng không check NODE_ENV | GitHub scan — là điều kiện của C2 |
| H4 | **SMTP `tls.rejectUnauthorized: false`** ở 4 nơi → OTP email bị MITM được | Account |
| H5 | **Server HTML là SPA shell rỗng** — Google render xong vẫn thấy login gate (trừ /encyclopedia); 12-18 từ, 0 `<h1>`; 12/13 trang sitemap thin-content trùng nhau → không ranking | SEO |
| H6 | **Băng thông ~8GB/giờ/instance**: mutation + AccessTracker (mỗi đổi route) + dictionary_cache (mỗi tra từ) đều kích hoạt upload 67MB vs quota 100GB/tháng | Perf |
| H7 | **4 route thiếu maxDuration=60**: dictionary, dictionary/search, admin/auth, sync (đẩy 67MB với trần 10s → 504 khi <56.5Mbit/s) | Perf |
| H8 | **94 nút icon không aria-label** (AuthModal eye ×3, 24 nút bookmark, nút mic) + **17 modal không focus-trap/Esc/dialog-role** (Tab thoát modal 5/9 lần; guest gate có nút X chết) | SEO/a11y + UI flow |
| H9 | **72 lỗi contrast** — trắng trên emerald-500 = 2.47:1 (nav active mọi trang), trắng trên amber = 2.14:1 | SEO/a11y |
| H10 | **`/exam`: nút "Thoát phòng thi" lại mở modal nộp bài** (cùng `setShowConfirmModal(true)`, exam/page.tsx:586 & 616) — không tồn tại đường thoát không nộp | UI flow |

## 🟡 MEDIUM (14)

| # | Vấn đề | Nguồn |
|---|---|---|
| M1 | Demo fallback trả data thật `user_demo_default` + `/api/pet` lộ `communityUsers` (username/avatar user thật) cho guest | Web |
| M2 | CSP `script-src` có `unsafe-inline` (prod) + `unsafe-eval` (dev) → XSS inject chạy được | Web |
| M3 | Đăng ký không enforce mật khẩu mạnh (min 8) — chỉ non-empty; demo seed `123456` | Account |
| M4 | Admin token lưu `sessionStorage` (XSS đọc được) + không revoke khi admin đổi MK; `toggle_2fa` không yêu cầu re-auth | Account |
| M5 | **`betCoins=0` bị tính 100 xu** (`body.betCoins \|\| '100'` falsy bug); tạo phòng mới DELETE phòng waiting cũ không hoàn bet | Business pentest |
| M6 | Latent đa-instance: `join_battle_room` UPDATE thiếu `AND status='waiting'`; `harvest_all_crops` thiếu guard `crop_type=?` → double-pay khi chuyển Postgres | Business pentest |
| M7 | **/encyclopedia: 2 nút danh mục chết** (Phrasal Verbs, Idioms — category không tồn tại trong CSDL) + **0-kết-quả fallback hiển thị dữ liệu cứng** thay vì empty-state (page.tsx:284) | UI flow |
| M8 | Dictionary search dùng LIKE full-scan (87ms) trong khi **FTS5 đã build sẵn** (0.08ms — 500×); `data_json` 20MB fetch không dùng | Perf |
| M9 | `backups/` track trong repo: log fingerprint salt, snapshot data user thật | GitHub scan |
| M10 | CORS `Access-Control-Allow-Origin: *` trên document | Web |
| M11 | Không canonical/metadataBase + lệch host www/non-www; không OG/Twitter card (0/17 route); 0 JSON-LD (bỏ lỡ FAQPage, WebSite+SearchAction, DefinedTerm 26.500 từ) | SEO |
| M12 | 202 div onClick không keyboard-accessible + 33 touch target <44px (class `.tap-target` đã có sẵn nhưng chỉ 2 nơi dùng) | SEO/a11y |
| M13 | Font 9px trong pet shop (~6.8pt trên 360px); ~100 chỗ text <12px; `prefers-reduced-motion` bị bỏ qua | SEO/a11y |
| M14 | Backup RPO 24h; không alert khi conflict key xuất hiện (dấu mất dữ liệu); khôi phục conflict thủ công | Perf |

## 🟢 LOW (9)

| # | Vấn đề | Nguồn |
|---|---|---|
| L1 | `sanitizeText` không strip `\r\n` → CRLF lọt tới nodemailer (đã bị thư viện neutralize — defense-in-depth) | Injection |
| L2 | `verify_email` với userId object → 500 reflect driver error (info-disclosure nhỏ) | Injection |
| L3 | LIKE wildcard `%` không escape → `q=%` quét 26.416 dòng (rate limit + page ≤60 giảm nhẹ) | Injection |
| L4 | Salt OTP cứng trong source; logout không revoke server-side; reset token cũ không huỷ khi cấp mới | Account |
| L5 | Không validate Origin/CSRF trên POST (SameSite giảm nhẹ); cookie `secure` dựa NODE_ENV | Web |
| L6 | Vocabulary save-state không sync bookmark sẵn có khi load (nút hiện "Lưu" dù đã lưu); Escape không đóng modal (home/grammar); exam filter 0-kết-quả thiếu empty-state; 3/7 hot-chip support trả rỗng; @admin hiện trong "Tìm Bạn Học"; farm feed không ghi `coin_transactions` | UI flow |
| L7 | robots.txt Disallow mâu thuẫn noindex; sitemap `lastModified` sai; `/bookmarks` cá nhân trong sitemap; thiếu icon.png/apple-icon/manifest; 2 thẻ viewport trùng; 2 `<main>` lồng /support; Navbar.tsx dead code | SEO |
| L8 | /reset-password không noindex | SEO |
| L9 | `/api/health` lộ latencyMs DB; CSP img-src `https:` rộng | Web |

## ✅ ĐÃ XÁC NHẬN AN TOÀN / TỐT (không cần làm gì)

- **SQL injection**: 100% bind params; 3 chỗ interpolation đều whitelist cứng; live test payload đều bị literal
- **Path traversal / command injection / prototype pollution / mass assignment**: sạch (execFileSync argv mảng, destructuring whitelist, register hardcode role='user')
- **Kinh tế game**: progress minting chặn hoàn hảo (trần 600 coins/ngày atomic), water/harvest 10× song song đúng 1 lần, PVP self-finish/outsider/replay chặn hết, shop giá server-side, coins không âm
- **UI tổng thể**: 0 console error, 0 HTTP ≥400, 0 mojibake, 0 vỡ layout trên 9 trang × 2 viewport; resume phiên thi hoạt động hoàn hảo; "Thử nhanh Demo" hoạt động ngay
- **Hash MK**: scrypt N=16384 + salt per-user + auto-rehash legacy; session HMAC + timingSafeEqual + revoke khi đổi MK
- **Không lộ**: `.env` không track, không private key/AKIA thật, Filebase creds không lọt client bundle, cron có CRON_SECRET

## HÀNH ĐỘNG KHÔN GẦP THEO TÁC ĐỘNG (cho user chọn)

1. **Rotate credentials (C1)** — code không thay được, phải làm tay: SMTP pass + admin pass + Filebase keys
2. **Set `AUTH_SALT` vào `.env.local` (C2)** — 1 dòng, vá chuỗi forge admin + secret fallback (H3)
3. **Bump next ≥16.4.0 (C5)** — 1 lệnh
4. **OTP crypto.randomInt (C3)** — 2 dòng
5. **maxDuration 4 route (H7)** — 4 dòng
6. **Rate limit AI + auth qua KV/Upstash (H1, H2)** — cần credentials từ user
7. **Fix gốc last-write-wins (C4) + băng thông (H6)**: tách dictionary (95% file) ra khỏi DB sync → user DB còn 3.45MB; hoàn thành Postgres migration (adapter pg.ts đã có)

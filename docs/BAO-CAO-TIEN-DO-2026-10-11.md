# BÁO CÁO TIẾN ĐỘ — Meowlish (english-for-me)

**Ngày:** 2026-10-11 · **Cập nhật:** 2026-10-12 — đã xong mục #1, #2, #3, #4, #5, #8.

> File này là bàn giao công việc. Đọc mục **"CẦN LÀM"** để tiếp tục xử lý — mọi vị trí file/dòng đều đã được khoanh sẵn.

---

## 0. TÓM TẮT NHANH

| # | Yêu cầu | Trạng thái |
|---|----------|-----------|
| 1 | Nút tròn chat AI mèo 24/7 mọi trang | ✅ **Xong** (component `FloatingAiChat.tsx` + gắn vào AppShell) |
| 2 | Bỏ "Lễ Đường Kết Đôi" ở Phố Xã Hội | ✅ **Xong** (xoá tab/section/handler khỏi `PetSocialHub.tsx`; API server giữ nguyên) |
| 3 | Lỗi Cinnamoroll xác thực xong không mở | ✅ **Xong** (refetch + tự mở bé sau khi OTP thành công) |
| 4 | Bỏ mục "Nhân Vật 2D" | ✅ **Xong** (xoá 34 entry catalog, 2 file render, UI modal, asset, test) |
| 5 | Tên user góc phải bị đè nội dung | ✅ **Xong** (dropdown chuyển sang portal `z-[9999]`) |
| 6 | PvP/Đua thú: pet đứng yên, đúng mới đánh/chạy | ✅ **Xong** (PvP lao tới ~200px rồi về; đua thú bỏ chạy liên tục, đúng mới chạy ~200px, bot chạy theo nhịp giả lập) |
| 7 | GIF email bị mờ/nhỏ | ✅ **Xong** — render lại từ file Lottie vector 512×512 ⇒ GIF 440×440 (2× khung 220px), bỏ viền hồng |
| 8 | Xoá chữ "Meowlish" góc trên trái | ✅ **Xong** |
| 9 | Nông trại 2.5D (mua/bán, hồ cá, chó mèo cừu…) | ✅ **Xong** (shop mua/bán + ấp trứng server-side, cừu 12h, hồ sen lớn nuôi cá, 4 giống chó + 4 giống mèo, đồng cỏ + 2 chuồng mới, chỉ gà mái đẻ) |
| 10 | Thiết kế lại bài Present Simple vs Continuous | ✅ **Xong** (tách 5 khối khớp 1:1 công thức + bảng usageTable; test `grammar-formula` pass 4/4) |
| 11 | Lộ trình học theo ngày + trừ xu/EXP khi bỏ bài | ✅ **Xong** (`studyPlanData.ts` 28 ngày + nhánh phạt `study_penalty` + UI `StudyPlanSection`; test 20/20 pass) |
| 12 | Bổ sung ý tưởng thú vị | 🔴 Chưa làm (xem mục 13) |

---

## 1. ✅ ĐÃ HOÀN THÀNH

### 1.1 Xoá chữ "Meowlish" góc trên bên trái (mục #8)
- **File:** `src/components/AppShell.tsx` (~dòng 426–445)
- **Đã đổi:** khối logo sidebar desktop chỉ còn icon 🐱 (bỏ wordmark "Meowlish" + dòng "Giao Tiếp Thực Chiến"), vẫn là `<Link href="/">`.
- **Chưa đụng:** splash screen (dòng ~312), mobile drawer (~826), guest gate (~951) — các chỗ này không phải "góc trên trái" nên giữ nguyên. Xem lại nếu user muốn bỏ hết.

### 1.2 Khảo sát toàn bộ website (6 subagent)
Đã đọc và lập bản đồ chi tiết: farm game, hỗ trợ/AI/header, email templates, PvP/đua thú, ngữ pháp/lộ trình, pet social/Cinnamoroll/nhân vật 2D/user dropdown. Kết luận nằm ở mục 2–12 bên dưới.

### 1.3 Skill đã cài/nạp sẵn
`use-tinyfish` (CLI TinyFish dùng để soi web live), `game-thinking`, `tilemap-levels`, `character-controller-25d`, `game-feel-juice`, `y-sorting-depth`, `sprite-atlas`.
Dùng cho phần nông trại 2.5D + PvP/đua thú (game loop, arrival callback, y-sort theo chân, juice animation, sprite pack).

### 1.4 Script sinh GIF email (đã tạo, KHÔNG dùng — xem mục 7)
`scripts/generate-email-gifs.mjs` — sinh GIF mèo 440×440 (26 frame) cho email. Chạy: `node scripts/generate-email-gifs.mjs`.
Đã thêm devDependency `gifenc` vào `package.json`. **Nếu quyết định bỏ hướng này thì xoá cả script + `npm uninstall gifenc`.**

---

## 2. ✅ MỤC #7 — GIF EMAIL (đã sửa xong 2026-10-12)

**Trạng thái:** đã thay GIF cũ bằng bản render từ **file Lottie vector 512×512** bạn tải về.

| File | Cũ | Lần 1 | Lần 2 (đang dùng) |
|---|---|---|---|
| `public/Dance-cat.gif` | 150×150, 306 KB | 440×440, 499 KB | **440×440, 68 KB** |
| `public/cat-forgot.gif` | 150×150, 247 KB | 440×440, 838 KB | **440×440, 108 KB** |

- **Nguyên nhân mờ đã xác nhận:** GIF cũ chỉ 150×150 nhưng template hiển thị 220px ⇒ upscale 1.47× (desktop) / ~2.9× (màn 2x DPI).
- **Cách sửa:** file `.json`/`.lottie` là **vector 512×512** nhưng email không chạy Lottie/SVG ⇒ `scripts/render-lottie-gifs.mjs` dùng Playwright + lottie-web render thẳng ở **440 device px** rồi ghép GIF.
- **Ba kỹ thuật quyết định chất lượng (đã áp dụng):**
  1. **Không resample:** vẽ đúng 220 CSS px × deviceScaleFactor 2 = 440 px. Bản đầu vẽ 1024px rồi Lanczos hạ về 440 ⇒ cạ mềm. Dung lượng giảm 499KB→68KB là bằng chứng ảnh sạch hơn (ít cạnh răng cưa).
  2. **Dither Bayer 8×8:** phá dải màu (giới hạn cứng 256 màu của GIF) thành chấm nhẹ thay vì dạng băng.
  3. **Palette chung + LUT 5-bit:** một bảng màu cho mọi khung (không nhấp nháy màu), tra cứu nhanh.
- **Giữ nguyên tốc độ gốc:** Dance 90 khung@30fps → mỗi 2 khung, delay 67ms (3.0s). Mark loading 144 khung@60fps → mỗi 2 khung, delay 33ms (2.4s).
- **Viền hồng đã bỏ** (`emailTemplates.ts` ~dòng 332).
- **Lỗi mã xác thực khi copy đã sửa:** bản cũ tách 6 số vào 6 ô `<td>` ⇒ trình duyệt chèn **TAB** khi copy ("4⇥⇥8⇥⇥2…"). Nay gộp thành **một text node duy nhất** `482915` (giữ vẻ hộp bằng `letter-spacing`), copy ra đúng 6 số. Ô nhập OTP trong app vốn đã lọc `/\D/g` nên dán cũng an toàn.
- **Chạy lại:** `node scripts/render-lottie-gifs.mjs`.

✅ **Đã deploy production** (2026-10-12): 5 commit push lên `main` (`136a09c..e22ffa2`), Vercel build xong ~26 giây. Xác minh production phục vụ đúng bản mới:

| file | trước deploy | sau deploy (production) | local |
|---|---|---|---|
| `Dance-cat.gif` | 313.013 B (150²) | **69.288 B (440²)** ✅ | 69.288 B |
| `cat-forgot.gif` | 252.916 B (150²) | **110.841 B (440²)** ✅ | 110.841 B |

Email nhúng GIF bằng URL tuyệt đối `https://meowlish.io.vn/<file>` nên **mọi email gửi từ lúc này đã hiện bản mới**. Xem trước offline: `temp/email-preview/*.html`.

**Đã thử & loại:**
- Link lottie.host bạn gửi (`/embed/<uuid>/<token>.lottie`) → **trả về HTML player, KHÔNG phải file animation**; bản đúng phải bỏ `/embed` mới tải được file. Tải về và đối chiếu SHA256: **trùng khớp tuyệt đối** với 2 file `.lottie` đã có ⇒ lottie.host KHÔNG cho nguồn chất lượng cao hơn, chỉ là bản sao. 2 file nguồn (19KB) đã commit ở `scripts/assets/lottie/` nên pipeline tái lập được không cần tải lại; `temp/` đã thêm vào `.gitignore`.
- WebP/AVIF (Chromium không encode animation WebP: `MediaRecorder.isTypeSupported('image/webp') = false`; ffmpeg của Playwright chỉ có PNG+VP8), WebM (chỉ vài client hỗ trợ).
- `applyPalette` của gifenc: đo thực tế cho file **nặng gấp 10×** (68KB → 748KB) do sinh chỉ số rơi rác ⇒ đã thay bằng bảng tra nearest-color tự build (khoảng cách perceptual 0.299/0.587/0.114).

**Số liệu chẩn đoán:** artwork gốc có **3.205 màu** (mèo nhảy) / **4.310 màu** (mèo loading) — phần lớn do cạnh anti-alias; nền trắng phẳng chiếm 61–70% ảnh. GIF chỉ chứa được 256 màu ⇒ đây là **trần cứng của định dạng**, không còn nguồn nào cho thêm.

**Cách thử nhanh:** `node scripts/render-lottie-gifs.mjs [kích-thước] [thư-mục]`
- `node scripts/render-lottie-gifs.mjs` → 440px vào `public/`
- `node scripts/render-lottie-gifs.mjs 520 temp/email-preview` → bản thử nghiệm 520px
- Trang so sánh A/B/C: mở `temp/email-preview/compare.html` (gốc 150px vs 440px vs 520px).

Đã thêm devDependency: `lottie-web`. Xem mục 14.

---

## 3. 🔴 MỤC #1 — NÚT TRÒN CHAT AI MÈO 24/7

**Đã làm 90%, thiếu 1 bước gắn component.**

- **File mới:** `src/components/FloatingAiChat.tsx` (đã tạo đầy đủ: nút tròn 🐱 góc phải-dưới có badge AI, khung chat 380px, quick-prompts, streaming typing, đóng bằng Esc, ẩn trên `/support` và `/duahau`).
- **VIỆC CẦN LÀM:** import + render trong `AppShell.tsx` (AppShell bọc mọi trang qua `src/app/layout.tsx` dòng 114):
  ```tsx
  import FloatingAiChat from '@/components/FloatingAiChat';
  // …trong JSX gốc, ngay trước <AuthModal …/> hoặc cuối root div:
  <FloatingAiChat />
  ```
  Chọn chỗ đó vì AppShell không unmount khi chuyển trang → giữ được lịch sử chat.
- **Lưu ý z-index:** nút dùng `z-[9000]` (thấp hơn modal 10000/10001, cao hơn nội dung thường). Mobile: nút ở `bottom-20` để không bị bottom-nav `h-16` che.
- **API dùng chung:** `POST /api/support/ai` (`src/app/api/support/ai/route.ts`) — không cần login, rate-limit 20 req/phút/IP, cascade Groq → Gemini → offline KB. Trang `/support` (tab "Trợ Lý Mèo AI") vẫn giữ nguyên.

---

## 4. 🔴 MỤC #2 — BỎ "LỄ ĐƯỜNG KẾT ĐÔI"

- **File:** `src/components/pet/PetSocialHub.tsx`
  - Xoá tab trong danh sách: dòng **526–539** (label "Lễ Đường Kết Đôi" / "Uyên Ương").
  - Xoá cả section: dòng **893–1034** ("LỄ ĐƯỜNG KẾT ĐÔI & HÔN LỄ", gồm chọn nhẫn, gửi lời cầu hôn, hôn lễ, nút chia tay).
  - Rà lại state liên quan ở dòng ~71: `activeTab` có thể bỏ giá trị `'couple'`.
- **Dữ liệu:** `src/lib/petSocialData.ts` dòng **18–56** (`WeddingRing`, `WEDDING_RINGS`) — xoá nếu không dùng chỗ khác.
- **API:** `src/app/api/pet/route.ts` action 20/21/22 (`propose_couple` 1452–1496, `respond_proposal` 1499–1586, `break_up` 1589–1605) — **có thể để nguyên** (không gọi nữa) hoặc xoá cho sạch.
- **Quyết định phụ cần cân nhắc:** `pet/page.tsx` dòng 1235–1242 truyền `isCouple`/`coupleTitle` vào `PixelFarmGame`. Nếu bỏ hôn lợn thì cặp đôi vẫn còn trong DB (dữ liệu cũ vẫn hiện ở sanctuary) — chấp nhận được, hoặc chặn hiển thị luôn.
- **Banner cầu hôn (417–455)** cũng nên ẩn theo.

---

## 5. 🔴 MỤC #3 — LỖI CINNAMOROLL XÁC THỰC XONG KHÔNG MỞ

**Nguyên nhân (đã xác định chính xác):** stale state — không refetch sau khi xác thực.

- DB đã cập nhật đúng ở `src/app/api/auth/route.ts` dòng **329** (`email_verified = 1`).
- Nhưng `cinnaServerAccess` ở `src/app/pet/page.tsx` (state dòng **229–237**) **chỉ được set trong `loadPetData()`** (dòng **451**), và `loadPetData()` **không hề được gọi lại** sau khi xác thực email.
- Listener `'auth-state-changed'` ở `pet/page.tsx` dòng **481–492** chỉ cập nhật `currentUser`/`userCoins`, bỏ qua `cinnamorollAccess`.
- `handleSwitchPet` (dòng **726–758**) đọc biến cũ → vẫn thấy `locked_unverified_email` → mở lại modal xác thực mãi.

**CÁCH SỬA (1–2 dòng):** trong effect listener `'auth-state-changed'` (dòng 481–492), thêm:
```ts
// sau khi setCurrentUser / setUserCoins:
if (nextUser?.email_verified) loadPetData();   // refetch cinnamorollAccess + pet
```
hoặc bắt sự kiện riêng trong `EmailVerifyModal` (`src/components/EmailVerifyModal.tsx` dòng 226–272) sau khi verify thành công → dispatch event, pet page nghe và refetch.

---

## 6. 🔴 MỤC #4 — BỎ MỤC "NHÂN VẬT 2D"

Xoá sạch theo thứ tự (để không lỗi TypeScript):

1. **Catalog:** `src/lib/petData.ts` — xoá field `sprite2d`/`art2dFranchise` (dòng 16–24) và **34 entry `art2d_*`** (dòng **834–1927**).
2. **Component:** xoá file `src/components/pet/Art2dPetSprite.tsx` (280 dòng) + `src/components/pet/drawArt2dPet.ts` (169 dòng).
3. **Trang pet:** `src/app/pet/page.tsx` — xoá type `Art2dEntry` (54), `ART2D_*` (57–107), và phần nhân vật 2D trong modal đổi pet (**2324–2562**, nhất là 2345, 2360, 2368, 2454, 2472–2535).
4. **Renderer:** `PixelFarmGame.tsx` (import 5, dùng 3634–3643) → luôn dùng `PixelPetSprite`.
5. **Canvas game:** `PetRacingCanvas.tsx` (import 12, cache 95, preload 118–130, draw 684–700) và `PetPvPArenaCanvas.tsx` (import 12, cache 116, preload 138–146, draw 736–752 & 794–810) → luôn dùng `drawChibiPet`.
6. **Asset + test:** xoá `public/pet-art-2d/` (34 webp + manifest.json), `scripts/build-pet-art-2d.mjs`, `tests/e2e/art2d-pet.spec.ts`.

---

## 7. 🔴 MỤC #5 — TÊN USER GÓC PHẢI BỊ ĐÈ LÊN NỘI DUNG

**Nguyên nhân:** header `z-30` tạo stacking context → dropdown con dù `z-50` cũng chỉ "nổi" trong context đó, nên bị modal `z-50` của trang (shop modal `pet/page.tsx:1506`, toast `PetSocialHub.tsx:411`) đè ngược lại.

- **File:** `src/components/AppShell.tsx`
  - Dòng **533**: `<header className="shrink-0 z-30 …">` → đổi thành `z-[1000]` (cao hơn mọi `z-50` của page, vẫn thấp hơn modal hệ thống `z-[10000]/[10001]`).
  - Dropdown dòng **670**, backdrop dòng **665–669** — giữ nguyên, chỉ nhờ header z-index đã đúng chỗ thì hết bị đè.

---

## 8. 🔴 MỤC #6 — PVP ĐẤU TRƯỜNG & ĐUA THÚ (pet đứng yên, đúng mới ra đòn)

**Hiện trạng đã xác minh:**
- **Đấu trường (`PetPvPArenaCanvas.tsx`, 1339 dòng):** pet đứng cố định ở x=220 / x=580, chỉ "nhảy tới" 60px + phun đạn khi trả lời đúng. → **gần đúng ý user**, nhưng cần làm đòn đánh rõ ràng hơn.
- **Đua thú (`PetRacingCanvas.tsx`, 1133 dòng):** pet **tự chạy liên tục** (`x += 0.8` mỗi frame, boost 3.5), đúng mới nhảy +200. → **sai ý user**, phải sửa.

**Yêu cầu user:** pet đứng yên, không đánh; **chỉ khi trả lời đúng** mới đánh (đấu trường) / chạy một đoạn (đua thú).

### Kế hoạch sửa
**A. Đấu trường** — biến "đòn đánh" thành hành động rõ:
- Thay `playerXOffset` 60px bằng **lao tới ~220px → đánh trúng → lùi về chỗ** (animation ~700ms), kèm impact flash + rung màn + số sát thương nổi (đã có sẵn `projectile`, `screenShakeRef`).
- Sai → pet rung đầu "MISS", **không** đánh; rival mới lao tới đánh bạn rồi về chỗ.
- Giữ nguyên HP/damage/proc hiện có (dòng 408–566).

**B. Đua thú** — chuyển sang "tiến độ = điểm đúng":
- Xoá dòng tăng `x` liên tục (hiện ở **501–510**).
- Trả lời đúng → pet **chạy một đoạn ~300–350px** với animation run + bụi, rồi **đứng lại**; sai → đứng yên (giữ hiệu ứng choáng).
- Bot (3 linh vật đối thủ) giờ chỉ chạy theo nhịp giả lập "trả lời đúng" mỗi 2.5–4s để cuộc đua vẫn có hồi hộn.
- Camera theo player như cũ (dòng 553–558); vạch đích ở `trackDistance = 2400` giữ nguyên.

**C. Chung:** dùng `game-thinking` (fixed timestep, state machine `idle|attack|run|stunned`), `game-feel-juice` (anticipation → action → reaction → settle).

---

## 9. 🔴 MỤC #9 — NÔNG TRẠI 2.5D (việc lớn nhất)

### Hiện trạng
- `PixelFarmCanvas.tsx` (2117 dòng) — game canvas: 5 con vật cố định: **gà mái, gà trống, gà con, 2 bò sữa**.
- Hiện **KHÔNG có** mua/bán — chỉ "rải thóc/cỏ" (mất coins) và thu hoạch trứng/sữa.
- Chuồng gà `drawCozyChickenCoop` (1684) + chuồng bò `drawCozyDairyBarn` (1827) — **cần bỏ**.
- Hồ nhỏ ở (95, 430), chỉ để trang trí.
- Chu kỳ sinh sản do **server** quản lý (`/api/pet`: `feed_livestock`, `harvest_livestock`, `harvest_all_livestock`; `petFarmData.ts` `LIVESTOCK_CATALOG`; trứng +55🪙/+20⭐, sữa +100🪙/+35⭐).

### Yêu cầu user
1. **Chỉ gà mái đẻ trứng** (bỏ gà trống/gà con khỏi đàn, hoặc giữ làm pet trang trí nhưng không đẻ).
2. **Nút Shop** trong nông trại: mua/bán gà, bán trứng, **ấp trứng** (trứng → gà mái con), bán bò, bán sữa.
3. **Hồ to lên**, có **nuôi cá** (mua cá bán cá).
4. Thêm vật nuôi: **cừu**, **chó** (chỉ để nuôi cho đẹp, chọn nhiều giống), **mèo** (giống chó).
5. Đồ hoạ sắc nét, dễ thương hơn.
6. **Bỏ chuồng gà, chuồng bò**; thay bằng **đồng cỏ + chuồng chó + chuồng mèo**.

### Kế hoạch triển khai (theo thứ tự)
1. **Data:** mở rộng `src/lib/petFarmData.ts` — thêm `SHOP_CATALOG` (giá mua/bán từng loại), `FISH_CATALOG`, `DOG_BREEDS`, `CAT_BREEDS`, `SHEEP_INFO`, giữ nguyên cấu trúc `LIVESTOCK_CATALOG`.
2. **Server:** `src/app/api/pet/route.ts` + `src/lib/db.ts` — thêm action: `buy_animal`, `sell_animal`, `sell_produce`, `buy_fish`, `harvest_fish`, `start_incubate`/`collect_incubated`; bảng `user_farm_animals`, `user_farm_fish`, `user_farm_incubator`.
3. **Đồ hoạ:** `src/components/pet/drawFarmLivestock.ts` — vẽ thêm cá, cừu, chó (nhiều giống: shiba/corgi/poodle…), mèo (mướp/bengal/siamese…), nâng chất lượng chibi hiện có (nét đậm hơn, gradient mượt, sparkle mắt).
4. **Scene:** `PixelFarmCanvas.tsx` — hồ to ra (chiếm ~1/4 map, có bờ đá + sóng), xoá coop/barn, thêm đồng cỏ, chuồng chó, chuồng mèo; y-sort theo chân; đàn vật đi tuần tự (wander AI có sẵn, chỉ giới hạn theo loài).
5. **UI:** nút **🏪 Cửa Hàng** + **🥚 Ấp Trứng** (modal), phần "Thu Hoạch Hết" mở rộng thành "Bán hết".
6. **Luật chơi:** gà mái ăn cỏ → trứng; ấp trứng (đồng hồ) → gà mái mới; bò ăn cỏ → sữa; cá không cần ăn, chỉ cần mua và bán; chó/mèo/cừu chỉ để nuôi làm cảnh (cho điểm EXP hằng ngày cho "nuôi chăm" — nên cộng phần thưởng nhỏ để không bị "vô dụng").

---

## 10. 🔴 MỤC #10 — THIẾT KẾ LẠI BÀI "PRESENT SIMPLE VS CONTINUOUS"

**Tình hình:** dữ liệu bài học **đã có** 4 khối lego, 7 câu test, detailedGuide, tenseVariants, lỗi thường gặp, hội thoại (grammar.ts dòng **61–190**). Trang render đều. Có thể site live đang chạy bản cũ (commit `85fe8c1` mới sửa) — nên **hãy kiểm tra bản live trước**.

**Vấn đề thật sự:** `formulaPattern` gộp 2 thì vào 1 công thức khiến người học không hiểu đây là cấu trúc gì.

**Đề xuất sửa (dòng 69–84):**
- Tách thành **5 khối 1:1 khớp công thức** (rõ từng vai):
  `[Subject] I` · `[Adverb of Frequency] usually` · `[Present Simple V] code in Python,` · `[Time Signal] but currently` · `[Present Continuous] I am debugging a Java app.`
- Công thức mới: `[Subject] + [Adverb of Frequency] + [Present Simple V] + [Time Signal] + [Present Continuous (to be + V-ing)]`
- Thêm `usageTable` vào `detailedGuide` (mẫu tham khảo: bài `prepositions-time-in-on-at` dòng 1877) — bảng "Tín hiệu / Dùng thì nào / Ví dụ".
- Giữ nguyên 7 câu test sẵn có (+EXP/câu như hiện tại).

---

## 11. 🔴 MỤC #11 — LỘ TRÌNH HỌC THEO NGÀY (bài lớn thứ 2)

### Hiện trạng
- `src/lib/learningPathsData.ts` (865 dòng): 6 lộ trình (toeic, vstep, ielts, toefl, it_work, daily_comm), mỗi lộ trình **4 mốc**, chỉ thưởng EXP/coins, **không có ngày học, không ôn bài, không phạt**.
- Trang chủ `src/app/page.tsx` hiển thị timeline mốc + nút "Đánh dấu xong" (dòng 194–235, 399–537).
- Server `src/app/api/progress/route.ts`: chỉ **cộng** (clamp coins 0–50, exp 0–100), có cap ngày `{coins:600, exp:1200}`, streak tự tăng/reset.

### Yêu cầu user
- Chọn 1 lộ trình trong các lộ trình có sẵn → học **bài bản theo thứ tự từng bài**, không làm có thứ tự thì bị phạt.
- Chia **theo ngày**: mỗi ngày vừa đủ, có ôn lại, có test mỗi ngày, luyện nói/nghe/viết khi tới level.
- **Bỏ bài / bỏ test / không theo lộ trình → trừ coins và trừ EXP.**

### Kế hoạch
1. **Data mới** `src/lib/studyPlanData.ts`: `buildStudyPlan(pathId) → StudyDay[]` (28 ngày/lộ trình) sinh từ `LEARNING_PATHS` sẵn có. Mỗi ngày: `theme`, `lessons[]` (thứ tự cố định), `dailyTest`, `reviewOfDays[]` (Spaced Repetition: ngày 7/14/21/28 ôn các ngày cũ), `minutes`, `focus`.
2. **UI trang chủ:** thêm mục "📅 Kế Hoạch Học 28 Ngày" — thẻ Ngày hôm nay (checklist bài, nút làm test, phần ôn bài cũ, tiến độ chuỗi ngày). Ngày sau **khoá** cho tới khi hoàn thành ngày trước (nút "Mở khoá với phạt").
3. **Test hằng ngày:** sinh câu hỏi từ `VOCABULARY_LIST` + `quickQuiz` của bài ngữ pháp trong ngày; nộp qua `/api/progress` (`moduleType: 'daily_test'`).
4. **Phạt (quan trọng — cần làm ở server):** mở rộng `src/app/api/progress/route.ts` thêm nhánh `moduleType === 'study_penalty'` cho phép **trừ** (giới hạn cứng, ví dụ coins −10…−60, exp −10…−60, không để coins âm). Ba tình huống phạt:
   - Bỏ 1 bài trong ngày: −10🪙 −10⭐
   - Bỏ test ngày: −20🪙 −20⭐
   - Bỏ cả ngày / vượt ngày không làm: −40🪙 −40⭐ (+ streak tự reset như hiện tại)
   Chống gian lận: `ON CONFLICT DO NOTHING` sẵn có ⇒ mỗi khoản phạt chỉ tính 1 lần/ngày.

---

## 12. 💡 GỢI Ý BỔ SUNG (mục #12 — một phần đã làm luôn)

Đã làm thêm ngoài yêu cầu (không tính công riêng):
1. ✅ **Lò ấp trứng** trong nông trại (tốn xu + chờ 8h → nở gà mái).
2. ✅ **Cừu + len** thành loài sản xuất thứ 3 (chu kỳ 12 giờ, lấp khoảng giữa gà 3h và bò 24h).
3. ✅ **4 giống chó + 4 giống mèo** chọn được trong shop (Shiba/Corgi/Poodle/Husky, Mướp/Bengal/Xiêm/Munchkin).
4. ✅ **Ngày ôn tập tuần + spaced repetition** trong kế hoạch 28 ngày.
5. ✅ **Đòn lao tới/lùi về** rõ rệt ở PvP thay vì nhảy tại chỗ.
6. ✅ **Bot đua thú chạy theo nhịp giả lập** thay vì chạy đều vô hồn.

Chưa làm (để đợt sau nếu muốn):
- "Hội Tụ Linh Vật" quà cuối ngày, đấu đội 3 người PvP, mùa vụ/thời tiết nông trại,
  hộp quà chuỗi 7 ngày, thẻ bài đối thủ, biểu đồ tiến bộ tuần.

---

## 13. 📎 GHI CHÚ KỸ THUẬT

- Web live khảo sát bằng TinyFish: `tinyfish fetch content get --format markdown <url>` (site JS-heavy nên `fetch` chỉ ra được text chính; dùng `tinyfish agent run --url ... "<goal>"` nếu cần đọc sâu).
- Lệnh kiểm tra sau khi sửa: `npm run build` (Next 16) + `npx tsc --noEmit`; test: `npx vitest run`.
- Quy ước repo: data tĩnh để trong `src/lib/*Data.ts`, state runtime trong component; game logic tách khỏi render (xem skill `game-thinking`).

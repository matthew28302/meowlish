# Backlog hoàn thiện Meowlish — 2026-10-15

> Người lập: PM Agent · HEAD kiểm tra: `ba0c6ca` · Nhánh `main`
> Cơ sở kiểm chứng: đọc code thật + chạy `npx tsc --noEmit` (sạch), `npx vitest run` (**28 file / 471 test PASS**), `npm run lint` (**FAIL** — xem BUG-010), `node scripts/verify-email-gifs.mjs public`.

---

## 1. Bảng xác minh 12 yêu cầu

| # | Yêu cầu | Kết luận | Bằng chứng (file:dòng) | Ghi chú |
|---|----------|----------|------------------------|---------|
| 1 | Nút tròn chat AI mèo 24/7 mọi trang | ✅ **Xong** | `src/components/AppShell.tsx:41` (import), `:1006` (`<FloatingAiChat />`); AppShell bọc mọi trang qua `src/app/layout.tsx:114`. Component đầy đủ: `FloatingAiChat.tsx:64-327` (nút tròn `z-[9000]` dòng 189, panel 380px dòng 213-214, quick-prompts 36-41, Esc 80, focus 90-95, ẩn `/support` + `/duahau` dòng 79). API dùng chung `POST /api/support/ai` (`src/app/api/support/ai/route.ts:70-347`, cascade Groq→Gemini→KB offline, rate-limit 20/phút/IP dòng 76-84) | ⚠️ 2 nhỏ: (a) nút bị `AuthModal` z-[10000] che khi guest gate mở (`AppShell.tsx:1012`); (b) system prompt AI mô tả website cũ → xem BUG-016 |
| 2 | Bỏ "Lễ Đường Kết Đôi" ở Phố Xã Hội | ⚠️ **Xong UI, còn sót code + dữ liệu cũ** | UI đã xoá: `src/components/pet/PetSocialHub.tsx:62-63` (bỏ tab `couple`), `:262-265`, `:711`. `tsc` sạch. **Nhưng**: API `propose_couple` / `respond_proposal` / `break_up` còn sống — `src/app/api/pet/route.ts:1744`, `:1791`, `:1881`; data `WEDDING_RINGS` còn — `src/lib/petSocialData.ts:18,28` (import ở `api/pet/route.ts:6`); user cũ còn `user_couples` vẫn thấy tim + nhãn "Uyên Ương" ở Sân Vườn — `src/app/pet/page.tsx:1219-1226` → `src/components/pet/PixelFarmGame.tsx:3610-3614` | Xem BUG-008, BUG-009 |
| 3 | Lỗi Cinnamoroll xác thực xong không mở | ✅ **Xong** | Chuỗi đầy đủ: `src/components/EmailVerifyModal.tsx:255` `setStoredUser(data.user)` → `src/lib/auth.ts:162` dispatch `auth-state-changed` → `src/app/pet/page.tsx:439-466` bắt đúng nhịp `false→true` (`nowVerified && !wasVerified`), `:458` `await loadPetData()`, `:459-464` tự `handleSwitchPetRef.current('cinnamoroll', freshAccess)`. `loadPetData` trả về `cinnamorollAccess` mới (`:364,401-404,427`); `pendingCinnaSwitchRef` `:182`, `handleSwitchPet` đọc `accessOverride` `:703-711` | ✅ Không thấy đường hỏng |
| 4 | Bỏ mục "Nhân Vật 2D" | ✅ **Xong sạch** | Grep `art2d\|ART2D\|Art2dEntry\|drawArt2dPet\|sprite2d` trên toàn `src/` → **0 match thật** (chỉ còn comment "đã xoá" tại `PetRacingCanvas.tsx:94,117`, `PetPvPArenaCanvas.tsx:113,135`). `public/pet-art-2d/` không tồn tại; `scripts/build-pet-art-2d.mjs` không tồn tại; `tests/e2e/art2d-pet.spec.ts` không tồn tại. Renderer luôn dùng chibi: `PixelFarmGame.tsx:3633`, `PetRacingCanvas.tsx:684-700`, `PetPvPArenaCanvas.tsx:736-752` | ✅ |
| 5 | Tên user góc phải bị đè nội dung | ✅ **Xong** | `src/components/AppShell.tsx:676` `createPortal(...)` ra `<body>`, backdrop `:684-688` `z-[9998]`, dropdown `:689-691` `z-[9999]`, vị trí tính từ `getBoundingClientRect()` `:663-664`. Header giữ nguyên `z-30` (`:545`) — đúng, vì dropdown đã thoát stacking context | ✅ |
| 6 | PvP/Đua thú: pet đứng yên, đúng mới đánh/chạy | ✅ **Xong về mặt cơ chế** | **Đua thú** `src/components/pet/PetRacingCanvas.tsx:497-501`: chỉ `racer.x += 4.5` khi `boostTimer > 0`; `boostTimer = 45` chỉ set khi **đúng** (`:439-446`); sai → `isStunned = true` 1.2s (`:447-454`). Bot cũng đứng yên, chỉ chạy theo nhịp giả lập (`:481-489`, `:502-507`). **PvP** `PetPvPArenaCanvas.tsx:412-418`: chỉ khi `isCorrect` mới `playerXOffset.current = 200` rồi về 0 sau 650ms; sai **không** đánh | ⚠️ (a) cú lao PvP là **teleport/snap**, không ease → nhìy giật (xem BUG-020); (b) PvP 2 người mô phỏng độc lập, không đồng bộ (BUG-011) |
| 7 | GIF email mờ/nhỏ | ❌ **CHƯA XONG — vẫn bị upscale** | File đúng chuẩn: `public/Dance-cat.gif` 150×150, 306 KB, 90/90 khung nền trong suốt; `public/cat-forgot.gif` 150×150, 247 KB, 73/73 khung (chạy `node scripts/verify-email-gifs.mjs public` → ✔✔). **Nhưng template vẫn render ảnh ở 220px**: `src/lib/emailTemplates.ts:332` → `<img ... width="220" style="... width:220px; max-width:60%">`. Upscale 150→220px (và 440px cần thiết trên màn 2x) ⇒ **chính là triệu chứng "GIF mờ" user báo**. Việc gộp OTP thành 1 text node đã làm đúng (`:360-367`) | Xem **BUG-003 (P0)** |
| 8 | Xoá chữ "Meowlish" góc trên trái | ✅ **Xong** | `src/components/AppShell.tsx:445-457`: sidebar desktop chỉ còn icon 🐱 trong `<Link href="/">`, không còn wordmark. Splash `:331` / mobile drawer / guest gate `:973` vẫn giữ chữ — đúng phạm vi "góc trên trái" | ✅ |
| 9 | Nông trại 2.5D (mua/bán, hồ cá, chó/mèo/cừu, bỏ chuồng cũ) | ⚠️ **Xong về chức năng, còn 2 rủi ro** | Data: `src/lib/petFarmData.ts:179-246` `FARM_ANIMAL_SHOP` (hen/cow/sheep/fish/dog/cat), `:258-270` 4 giống chó + 4 giống mèo, `:273-277` `FARM_INCUBATOR`. Server: `src/app/api/pet/route.ts:1342` `farm_shop_buy`, `:1394` `farm_shop_sell`, `:1449` `farm_incubate_start`, `:1494` `farm_incubate_collect` (đều trong `db.transaction`, trừ xu atomic `WHERE coins >= ?`). Đồ hoạ: hồ sen lớn `PixelFarmCanvas.tsx:967-1047`, đồng cỏ `:1084,2187`, chuồng chó `:1085,2252` / mèo `:1086,2320`; `drawCozyChickenCoop`/`drawCozyDairyBarn` **không còn**; chỉ gà mái đẻ (`LIVESTOCK_CATALOG` chỉ có chicken/cow/sheep `:96-136`) | ⚠️ (a) env backdoor `FARM_CYCLE_TEST` (`api/pet/route.ts:116-118`) — **BUG-005**; (b) `LIVESTOCK_CATALOG.*.cycleSeconds` = 30/50/40 **giây** (`petFarmData.ts:105,120,131`) mâu thuẫn server 3h/24h/12h (`api/pet/route.ts:100-104`) — **BUG-019** |
| 10 | Thiết kế lại bài Present Simple vs Continuous | ✅ **Xong** | `src/lib/data/grammar.ts:69-84`: 5 khối lego **khớp 1-1** với `formulaPattern` 5 slot (`:74`); thêm `usageTable` 3 dòng (`:97-101`). Test `tests/unit/grammar-formula.test.ts` pass (đã chạy: 471/471) | ⚠️ Header bảng cứng "Giới Từ / Cụm Từ" cho dữ liệu là "tín hiệu" — `src/app/grammar/page.tsx:688` (**BUG-017**) |
| 11 | Lộ trình 28 ngày + trừ xu/EXP khi bỏ bài | ⚠️ **Xong về kỹ thuật, chưa đúng tinh thần "theo ngày"** | Data: `src/lib/studyPlanData.ts:72-150` `buildStudyPlan()` sinh 28 ngày, ngày 7/14/21 ôn tập (`:108-122`), spaced repetition `:130-133`, mức phạt `:156-160`. Server trừ thật: `src/app/api/progress/route.ts:153-200` nhánh `study_penalty` (kẹp sàn 0, clamp ≤60, `ON CONFLICT DO NOTHING` chống trùng — UNIQUE có thật ở `src/lib/db.ts:252`). UI: `src/components/StudyPlanSection.tsx:255-410`, gắn trang chủ `src/app/page.tsx:545` | ⚠️ (a) **KHÔNG có ngày lịch**: `currentDay = days.find(d => !isDayResolved(d.day))` (`StudyPlanSection.tsx:172`) ⇒ làm hết 28 ngày trong 1 buổi, không phải "mỗi ngày vừa đủ" (**BUG-004**); (b) nút "Xong" bấm tay, không gắn với việc học thật (`:104-117`) |
| 12 | Bổ sung ý tưởng thú vị | ⚠️ **Một phần** | Đã có: lò ấp trứng, cừu+len (12h), 4 giống chó + 4 giống mèo, ôn tập tuần + spaced repetition, đòn lao PvP, bot đua thú theo nhịp. **Chưa có** (grep `src/` → 0 match): "Hội Tụ Linh Vật", mùa vụ/thời tiết nông trại, hộp quà chuỗi 7 ngày, đấu đội 3 người, thẻ bài đối thủ, biểu đồ tiến bộ tuần | Xem mục P2 |

**Tổng kết quả: ✅ 7 · ⚠️ 4 · ❌ 1**

---

## 2. Vấn đề phát hiện (mới)

| ID | Mô tả | Mức độ | File:dòng | Cách tái hiện |
|----|-------|---------|-----------|---------------|
| BUG-001 | **Thưởng PvP / Đua thú chỉ cộng ở client, không lưu server.** `applyCoinDelta` → `setStoredUser({...s, coins})` ghi localStorage. Nếu `finish_battle_room` lỗi/timeout, coin ảo vẫn giữ; và `loadPetData` chỉ nhận coins từ server khi localStorage **chưa có** ⇒ coin ảo tồn tại tới lần mua đầu tiên ở nông trại (`syncCoinsFromServer`) lúc **số dư tụt đột ngột** | **P0** | `src/app/pet/page.tsx:198-205`, `:412-415`; `src/components/pet/PetPvPArenaCanvas.tsx:563-583`; `src/components/pet/PetRacingCanvas.tsx:522-528`; `src/components/pet/PixelFarmCanvas.tsx:258-262,1448` | Vào /pet → tab Đấu Trường → đấu bot (không tạo phòng) → trả lời đúng cho tới khi thắng → quan sát coin tăng → reload trang: coin về số cũ. Hoặc chặn network rồi thắng trận có phòng: coin vẫn tăng |
| BUG-002 | **`claim_pvp_reward` / `claim_racing_reward` là code chết** — không client nào gọi (grep toàn `src/`: chỉ xuất hiện trong `api/pet/route.ts`). Hệ quả: chống replay `claimTimedReward` (`db.ts:1080-1102`) không bao giờ chạy; **không có giới hạn tần suất thưởng game** | **P0** | `src/app/api/pet/route.ts:1539-1565`, `:1568-1594`; `src/lib/db.ts:1069-1102` | Mở Network tab khi thắng PvP/Đua: không có request `claim_*_reward` nào được gửi |
| BUG-003 | **GIF email vẫn bị upscale ⇒ vẫn mờ.** File 150×150 nhưng `<img>` khai `width="220"` / `width:220px`, `max-width:60%` (container 600px ⇒ 60%=360 nên 220px thắng). Trên màn 2x cần 440px | **P0** | `src/lib/emailTemplates.ts:332`; file `public/Dance-cat.gif` (150×150), `public/cat-forgot.gif` | Gửi email test (`node scripts/send-test-emails.mjs`) → xem ảnh trên Gmail/Outlook desktop: mờ. Đối chiếu: `verify-email-gifs.mjs` in `150x150` |
| BUG-004 | Lộ trình 28 ngày **không có ngày lịch thật** — ngày N chỉ mở khi ngày N-1 "resolved", nên học viên bấm hết 28 ngày trong một buổi. Không đúng yêu cầu "mỗi ngày vừa đủ". Ngoài ra nút "Xong" bấm tay, không gắn với việc học ⇒ có thể spam nhấn để lấy thưởng mà không học | P1 | `src/components/StudyPlanSection.tsx:170-172`, `:104-117`, `:319-401`; `src/lib/studyPlanData.ts:88-150` | Vào trang chủ đã đăng nhập → thẻ "Kế Hoạch Học 28 Ngày": bấm "Xong" liên tiếp mọi mục + "Hoàn thành ngày" × 28 → xong trong ~2 phút |
| BUG-005 | **Env backdoor `FARM_CYCLE_TEST`** ghi đè chu kỳ sản xuất. Nếu bị set nhầm trên production, chu kỳ = 1 giây ⇒ vô hạn trứng/sữa/len ⇒ vô hạn coin | P1 | `src/app/api/pet/route.ts:116-118` | Set `FARM_CYCLE_TEST=1` → cho gà ăn → đợi 1s → thu hoạch lặp lại |
| BUG-006 | `farm_animals` / `farm_incubator` được tạo bằng **`CREATE TABLE IF NOT EXISTS` ngay trong request handler**, không nằm trong `db.ts`. DDL mở write-lock mỗi lần gọi 6 action nông trại ⇒ nguy cơ `SQLITE_BUSY`/race trên Vercel multi-instance | P1 | `src/app/api/pet/route.ts:311-326` (gọi từ `:1348, :1400, :1450, :1495`) | Bấm mua/bán vật nuôi liên tục khi 2 request chạy song song |
| BUG-007 | `PixelFarmCanvas` **poll `GET /api/pet` mỗi 4 giây** trong khi endpoint rất nặng (plots + livestock + friends + community + chat + rooms + couples) và route có `maxDuration = 60` + sync S3. 15 req/phút/người, không dừng khi tab ẩn | P1 | `src/components/pet/PixelFarmCanvas.tsx:1410-1412`; `src/app/api/pet/route.ts:345-566` | Mở tab Nông Trại, quan sát Network: `/api/pet?userId=…` lặp 15 lần/phút; 10 người dùng đồng thời = 150 req/phút |
| BUG-008 | Dữ liệu "Uyên Ương" cũ vẫn hiển thị: user đã có `user_couples` vẫn thấy 💍💖 + "Cặp Đôi …" trên đầu pet ở Sân Vườn Linh Vật, dù tính năng đã bị bỏ. Ngoài ra `z-45` ở dòng 3611 **không phải class Tailstone hợp lệ** (cần `z-[45]`) ⇒ banner không có z-index | P1 | `src/app/pet/page.tsx:1219-1226`; `src/components/pet/PixelFarmGame.tsx:3609-3615` | Đăng nhập tài khoản cũ từng cầu hôn → vào tab "Sân Vườn Linh Vật" |
| BUG-009 | API cũ còn sống: `propose_couple` / `respond_proposal` / `break_up` vẫn ghi DB. Gọi trực tiếp bằng `fetch` vẫn tạo được cặp đôi dù UI đã xoá. `WEDDING_RINGS` vẫn được import | P1 | `src/app/api/pet/route.ts:1744`, `:1791`, `:1881`, `:6`; `src/lib/petSocialData.ts:18-56` | `curl -X POST /api/pet -d '{"userId":"<id>","action":"propose_couple","partnerId":"<id2>","ringId":"ring_gold"}'` |
| BUG-010 | **`npm run lint` FAIL trên `main`**: 435 error / 250 warning. Không chỉ là style — có lỗi React thật: 23 `react-hooks/set-state-in-effect`, 15 `react-hooks/purity`, 10 `react-hooks/immutability`, 9 `react-hooks/static-components`, 4 `react-hooks/refs`, 4 lỗi TDZ | P1 | `AuthModal.tsx:853,877,1048,1076,1118,1145,1173,1201,1249` (`CatPointer` định nghĩa trong render → remount mỗi lần render); `PetPvPArenaCanvas.tsx:184`, `PetRacingCanvas.tsx:134`, `src/app/support/page.tsx:181`, `src/app/duahau/page.tsx:236-238` (TDZ); `src/app/pet/page.tsx:574`, `PixelFarmCanvas.tsx:291,292,303,380,434`; `src/app/duahau/page.tsx:706` | `npm run lint` → exit 1 |
| BUG-011 | **PvP 2 người không đồng bộ**: mỗi client tự mô phỏng trận riêng bằng bộ câu hỏi của mình. Ai gọi `finish_battle_room` tới trước thì `claimed === 1` và ăn thưởng ⇒ người thắng thật có thể **không được thưởng**, còn client thua vẫn hiện màn "Victory" + coin ảo (xem BUG-001) | P1 | `src/app/api/pet/route.ts:2107-2116`; `src/components/pet/PetPvPArenaCanvas.tsx:354-364, :560-583` | 2 tài khoản cùng vào 1 phòng, cả hai thắng ở client mình → xem ai nhận `bet_coins × 2` |
| BUG-012 | Lint quét cả `scratch/` và `scripts/*.js` (68 `no-require-imports`) — nhiễu, làm đỏ CI vô nghĩa | P2 | `eslint.config.*` (chưa ignore `scratch/`, `scripts/**.js`) | `npm run lint` → phần lớn lỗi nằm ở `scratch/gfx/*.js`, `scripts/*.js` |
| BUG-013 | Dependency thừa: `gifenc` (script `scripts/generate-email-gifs.mjs` **đã bị xoá**), `three` + `@types/three` (không có import nào — grep `from 'three'` = 0) | P2 | `package.json:22,24,47` | `npm ls three gifenc`; grep `from 'three'` trong `src/` → 0 |
| BUG-014 | `/api/user/target` chấp nhận 4 mục tiêu **không tồn tại trong `LEARNING_PATHS`** (`it_dev`, `toeic_speaking`, `ielts_general`, `it_scrum`). Hiện chưa vỡ UI nhờ guard `LEARNING_PATHS[x]` ở `page.tsx:69,111`, nhưng dữ liệu bẩn và dễ vỡ khi ai đó bỏ guard | P2 | `src/app/api/user/target/route.ts:61`; `src/lib/learningPathsData.ts:38,169,279,389,499,672` (chỉ 6 key) | `POST /api/user/target {"targetExam":"it_dev"}` → 200, nhưng trang chủ fallback về `toeic` |
| BUG-015 | Nút tròn chat AI `z-[9000]` nằm **trên** mobile drawer `z-[100]` (`AppShell.tsx:826`) ⇒ nổi lên che drawer; đồng thời bị `AuthModal` `z-[10000]` che khi guest gate mở ⇒ khách lần đầu **không bấm được** nút chat | P2 | `src/components/FloatingAiChat.tsx:189,213`; `src/components/AppShell.tsx:826,964,1012` | Mobile 375px, vào trang lần đầu (guest gate) → thử bấm nút 🐱 |
| BUG-016 | System prompt của Trợ Lý Mèo AI mô tả **website cũ**: "26.500+ từ", "4 linh vật", habitat "Vườn Xanh Bình Yên / Làng Lá Ninja / Đảo Hải Tặc", không hề có nông trại 2.5D / shop vật nuôi / kế hoạch 28 ngày. Danh sách model cũng cần verify: Groq `qwen/qwen3.8-27b`, Gemini `gemini-3.8-flash` / `gemini-3.5-flash` | P2 | `src/app/api/support/ai/route.ts:14-38` (mô tả), `:142` (groqModels), `:220` (geminiModels) | Hỏi chatbot "Meowlish có cửa hàng vật nuôi không?" → trả lời sai/lạc |
| BUG-017 | Header bảng `usageTable` cứng "Phân Loại / **Giới Từ / Cụm Từ** / Ví Dụ / Ghi Chú" nhưng bài Present Simple đổi cột thứ 2 thành "tín hiệu" (`always, usually, right now…`) ⇒ nhãn sai ngữ nghĩa, học viên thấy "Giới Từ" mà không có giới từ | P2 | `src/app/grammar/page.tsx:687-690`; `src/lib/data/grammar.ts:97-101`; type `grammar.ts:14` | Mở /grammar → Present Simple vs Continuous → cuộn tới bảng |
| BUG-018 | Truy cập ref trong render + mutate giá trị dùng trong effect: `PixelFarmCanvas.tsx:1617` đọc `userCoinsRef.current` trong JSX (số dư trong modal shop có thể stale nếu đổi không qua setState); `:646` mutate `animalsRef.current[i].heartTimer` | P2 | `src/components/pet/PixelFarmCanvas.tsx:1617`, `:646` | Mở modal Cửa Hàng ngay sau khi đổi số dư ở tab khác |
| BUG-019 | **Mâu thuẫn chu kỳ trong data**: `LIVESTOCK_CATALOG.chicken.cycleSeconds = 30` (30 **giây**) trong khi server dùng `LIVESTOCK_CYCLE_SECONDS.chicken = 3 * 60 * 60`. Client đọc nhầm sẽ hiển thị đồng hồ ngược sai | P1 | `src/lib/petFarmData.ts:105` vs `src/app/api/pet/route.ts:101`; `petFarmData.ts:160-164` (`FARM_CYCLE_FALLBACK_SECONDS`) lại là giá trị thứ 3 | Đọc `catalog(type).cycleSeconds` ở client trong khi server đã ghi `cycle_seconds` vào DB |
| BUG-020 | Cú "lao đánh" ở PvP là **nhảy vị trí tức thì** (`playerXOffset.current = 200` rồi set 0 sau 650ms), không có easing ⇒ pet nhảy/cắt giật, thiếu anticipation→action→reaction | P2 | `src/components/pet/PetPvPArenaCanvas.tsx:417-418`, `:720`, `:732` | Vào /pet → Đấu Trường → trả lời đúng, quan sát pet |
| BUG-021 | `harvest_all_livestock` trả thông điệp "trứng hoặc sữa" — thiếu **len** (cừu đã thành loài sản xuất thứ 3) | P2 | `src/app/api/pet/route.ts:1332` | Cho cừu ăn → đủ chu kỳ → bấm "Thu Hoạch Hết" |
| BUG-022 | `penaltyItemId` nhận **ngày do client gửi** (`todayStr()` tính từ đồng hồ máy người dùng, `studyPlanData.ts:172-175`). Server không tự sinh ngày ⇒ vòng chống trùng phạt không đáng tin (đổi ngày máy = phạt lại lần nữa) | P2 | `src/lib/studyPlanData.ts:172-175`; `src/components/StudyPlanSection.tsx:125,158`; `src/app/api/progress/route.ts:160-168` | Bấm "Bỏ" ở ngày 1, sửa ngày hệ thống, bấm lại (nút đã ẩn — nhưng gọi API tay vẫn trừ lần 2) |

---

## 3. Backlog theo thứ tự làm

### P0 — Chặn dùng / lỗi nghiêm trọng

- [ ] **[BUG-003] GIF email vẫn mờ vì template upscale 150px → 220px** (`src/lib/emailTemplates.ts:332`) — Đây là yêu cầu #7 chưa thật sự xong.
      *Khuyến nghị*: chạy `node scripts/render-lottie-gifs.mjs 440` (giữ nền trong suốt) để có bản 440×440, rồi đổi `width="220"` / `width:220px` thành `width="440"` + `style="width:440px; max-width:100%"`. Sau đó `node scripts/verify-email-gifs.mjs public` rồi `node scripts/send-test-emails.mjs`.
      *Tiêu chí nghiệm thu*: file ≥ 440×440 nền trong suốt 100% khung; ảnh hiện ≥ 2× kích thước CSS trên màn retina mà không vỡ; `verify-email-gifs.mjs` ✔.
- [ ] **[BUG-001] Đưa thưởng PvP/Đua thú về server** (`src/app/pet/page.tsx:198-205`, `PetPvPArenaCanvas.tsx:563-583`, `PetRacingCanvas.tsx:522-528`).
      *Cách sửa đề xuất*: bỏ `applyCoinDelta` ở `handleVictory`/nhánh race; chỉ dùng `syncCoinsFromServer(data.userCoins)` từ response `finish_battle_room`. Nếu request lỗi → hiện thông báo + `onRefreshData()`, **không** cộng coin ở client.
      *Tiêu chí nghiệm thu*: thắng trận có phòng → reload trang/tab 2 vẫn giữ đúng số coin thắng; chặn network rồi thắng → số coin **không** đổi.
- [ ] **[BUG-002] Nối `claim_pvp_reward` / `claim_racing_reward` hoặc xoá** (`src/app/api/pet/route.ts:1539,1568`).
      *Cách sửa đề xuất*: sau khi `finish_battle_room` trả `success`, client gọi `claim_*_reward` (server đã có `claimTimedReward` chống replay + cooldown). Nếu không dùng, xoá 2 nhánh + `REWARD_CATALOG.pvp/racing` để khỏi "có vẻ an toàn nhưng không ai gọi".
      *Tiêu chí nghiệm thu*: mỗi lượt thắng chỉ nhận thưởng 1 lần; gọi lại trong vòng cooldown trả 429; test unit khoá hành vi.
- [ ] **[BUG-010] Đưa `npm run lint` về xanh** (435 error). Ưu tiên nhóm lỗi React thật:
      - 9× `react-hooks/static-components` — `CatPointer` định nghĩa trong render của `AuthModal.tsx:853…1249` → nâng ra top-level component.
      - 4× TDZ — `PetPvPArenaCanvas.tsx:184`, `PetRacingCanvas.tsx:134`, `support/page.tsx:181`, `duahau/page.tsx:236-238` → bọc qua ref hoặc khai báo trước.
      - 4× `react-hooks/refs` — `pet/page.tsx:290,801`, `exam/page.tsx:290`, `PixelFarmCanvas.tsx:1617` → đọc ref trong effect/handler thay vì render.
      - 15× `react-hooks/purity` (`Math.random`/`Date.now` trong render) — `pet/page.tsx:574`, `PixelFarmCanvas.tsx:291,292,303,380,434`, `support/page.tsx:465,495,505,516`, `PetPvPArenaCanvas.tsx:437,450` → bỏ vào effect/ref.
      - Còn lại: thêm `ignore` cho `scratch/`, `scripts/**.js` (BUG-012) + cấu hình `no-explicit-any` thành `warn` hoặc bật `@typescript-eslint/no-unsafe-*` theo giai đoạn.
      *Tiêu chí nghiệm thu*: `npm run lint` exit 0; `npx tsc --noEmit` vẫn sạch; `npx vitest run` vẫn 471/471.

### P1 — Quan trọng

- [ ] **[BUG-004] Gắn lộ trình 28 ngày vào ngày lịch thật** (`StudyPlanSection.tsx:170-172`, `studyPlanData.ts:88-150`).
      *Cách sửa đề xuất*: lưu `plan_started_at` khi user chọn lộ trình; `currentDay = clamp(daysBetween(start, today) + 1, 1, 28)`; ngày tương lai khoá, ngày quá khứ áp `study_penalty` (đã có sẵn). Đồng thời chỉ cho bấm "Xong" sau khi bài tương ứng có `progress` thật (điều hướng `l.href` → `?plan=plan:<path>:d<N>:lesson:<i>` và set khi quay lại).
      *Tiêu chí nghiệm thu*: mở site 2 ngày liên tiếp → thẻ hiện đúng ngày; không thể nhảy cóc qua ngày; bỏ ngày hôm qua bị trừ đúng 1 lần.
- [ ] **[BUG-005] Khoá env backdoor `FARM_CYCLE_TEST`** (`src/app/api/pet/route.ts:116-118`).
      *Cách sửa đề xuất*: chỉ đọc khi `process.env.NODE_ENV !== 'production'`, hoặc đổi thành `FARM_CYCLE_OVERRIDE` + `ADMIN_TOKEN`. Thêm vào `docs/rủi ro`.
      *Tiêu chí nghiệm thu*: production luôn trả 3h/24h/12h bất kể env; có test unit.
- [ ] **[BUG-019] Dọn mâu thuẫn chu kỳ trong `petFarmData.ts:105,120,131`** — sửa `cycleSeconds` thành 3h/24h/12h hoặc đánh dấu legacy + xoá `FARM_CYCLE_FALLBACK_SECONDS` trùng lặp.
      *Tiêu chí nghiệm thu*: 1 nguồn sự thật duy nhất cho chu kỳ; test chống lệch client/server.
- [ ] **[BUG-006] Chuyển `farm_animals` / `farm_incubator` vào migration `src/lib/db.ts`** (hiện `api/pet/route.ts:311-326` chạy DDL trong request).
      *Tiêu chí nghiệm thu*: không còn `CREATE TABLE` trong `src/app/api/**`; GET/POST `/api/pet` không còn ghi DDL.
- [ ] **[BUG-007] Giảm tải poll của nông trại** (`PixelFarmCanvas.tsx:1410-1412`): tạo endpoint nhẹ `GET /api/pet/farm?userId=` (chỉ `livestock` + `farmStock` + `incubator` + `serverNow`), poll 15s, và `pause` khi `document.hidden` / khi rời tab farm.
      *Tiêu chí nghiệm thu*: tải `/api/pet` mỗi phút/người ≤ 4 lần thay vì 15; đồng hồ đếm ngược chu kỳ vẫn chạy nhờ `tickTimer` 1s.
- [ ] **[BUG-008] Dọn "Uyên Ương" cũ** (`pet/page.tsx:1219-1226`, `PixelFarmGame.tsx:3609-3615`): bỏ truyền `isCouple`/`coupleTitle` + sửa `z-45` → `z-[45]`; chạy migration xoá `user_couples`.
      *Tiêu chí nghiệm thu*: không còn chuỗi "Uyên Ương"/"Cặp Đôi" ở bất kỳ đâu trong UI.
- [ ] **[BUG-009] Xoá API cũ Lễ Đường Kết Đôi** (`api/pet/route.ts:1744,1791,1881`) + `WEDDING_RINGS`/`WeddingRing` (`petSocialData.ts:18-56`).
      *Tiêu chí nghiệm thu*: `grep -i "couple\|wedding\|ring_type"` trong `src/` chỉ còn migration `db.ts`; API cũ trả 410 hoặc đã xoá.
- [ ] **[BUG-011] Đồng bộ trận PvP 2 người** (`api/pet/route.ts:2107-2116`, `PetPvPArenaCanvas.tsx:354-364`).
      *Tối thiểu*: chỉ người **thắng theo kết quả server** được ăn thưởng; request thua phải rollback UI (đã nằm trong BUG-001). Lâu hơn: đồng bộ lượt đi/lượt trả lời qua `poll` hoặc SSE.
      *Tiêu chí nghiệm thu*: cả 2 client cùng vào phòng, chỉ đúng một người nhận `bet_coins × 2`; client thua không hiện "Victory".
- [ ] **[BUG-022] Server tự sinh ngày cho `study_penalty`** (`api/progress/route.ts:160-168`, `studyPlanData.ts:172`): bỏ `dateStr` từ client, dùng `today` đã tính ở `:140`.
      *Tiêu chí nghiệm thu*: gọi lại cùng `itemId` trong ngày ⇒ `alreadyPenalized: true`; đổi ngày máy không tạo thêm khoản phạt.

### P2 — Cải thiện

- [ ] [BUG-012] Thêm `scratch/`, `scripts/**/*.js` vào `eslint.config` ignore.
- [ ] [BUG-013] `npm uninstall gifenc three @types/three` (`package.json:22,24,47`) — đồng thời dọn `scripts/test_*.js`, `scripts/generate_anime_pets.js` nếu đã lỗi thời.
- [ ] [BUG-015] Chỉnh z-index nút chat AI: hạ xuống `z-[8000]` (dưới drawer `z-[100]` không cần — chỉ cần **trên** modal hệ thống), và **ẩn nút** khi `showGuestGate` đang mở (`AppShell.tsx:963-1006`).
- [ ] [BUG-016] Viết lại `MEOWLISH_SYSTEM_PROMPT` (`api/support/ai/route.ts:14-38`) theo website hiện tại (nông trại 2.5D, shop vật nuôi, lò ấp trứng, kế hoạch 28 ngày, phạt bỏ bài) và **verify** danh sách model Groq/Gemini còn tồn tại (`:142`, `:220`).
- [ ] [BUG-017] Cho `usageTable` mang nhãn cột riêng (`usageTableHeader?: string[]` trong `grammar.ts:14`), bài Present Simple dùng `["Phân Loại","Tín Hiệu","Ví Dụ","Ghi Chú"]`; render ở `grammar/page.tsx:687-690`.
- [ ] [BUG-018] `PixelFarmCanvas.tsx:1617` đưa số dư vào state thay vì đọc `userCoinsRef.current` trong render.
- [ ] [BUG-020] Thêm easing cho cú lao PvP (`PetPvPArenaCanvas.tsx:417-418`): `offset += (target - offset) * 0.18` trong rAF thay vì gán thẳng 200 → 0.
- [ ] [BUG-021] Sửa message `harvest_all_livestock` (`api/pet/route.ts:1332`) → "trứng, sữa hoặc len".
- [ ] [MỤC #12] Làm tiếp ý tưởng thú vị (chọn 2–3 để giữ nhịp): **Hộp quà chuỗi 7 ngày** (rẻ nhất, dùng `streak` sẵn có), **biểu đồ tiến bộ tuần** (dùng `progress` + `study_day` sẵn có), **mùa vụ nông trại** (đổi `CROPS_CATALOG.growthTimeSeconds` theo tuần, hiện đang là 25–120s lệch hẳn 3h/24h của vật nuôi).
- [ ] [MỤC #12] Đồng bộ `LIVESTOCK_CATALOG` ↔ `FARM_ANIMAL_SHOP`: 2 bảng cùng mô tả gà/bò/cừu với giá khác nhau (feed 20/35/25 vs buy 150/400/300) gây rối khi đọc code.
- [ ] Tách `PixelMapAssets.tsx` (3.675 dòng), `PixelFarmGame.tsx` (3.437), `pet/page.tsx` (2.446) — vượt xa ngưỡng 800 dòng, mọi thay đổi sau này rất dễ đụng nhau.

---

## 4. Rủi ro cần lưu ý

1. **Kiến trúc lưu trữ là điểm yếu lớn nhất.** SQLite file (~67 MB) + sync S3 (`Filebase`) + `maxDuration = 60`. Bất kỳ endpoint nào ghi đều phải `syncDbToS3Now()` (vd `api/pet/route.ts:1221,1383,1438,1484,1528`). Trên Vercel multi-instance, GET có thể đọc bản cũ hơn ~28s (đã ghi trong comment `page.tsx:73-83`) → **"số coin cập nhật không đều"** là triệu chứng đã biết, chưa được giải quyết triệt để. `scripts/pg/*` cho thấy đang chuyển sang Postgres nhưng `DATA_BACKEND` vẫn có thể trỏ SQLite.
2. **Coin là "read-your-writes ở localStorage"** — `pet/page.tsx:412` chỉ chấp nhận coins từ server khi localStorage chưa có. Đây là nguồn gốc của BUG-001 và sẽ tiếp tục sinh bug mới mỗi khi thêm action cộng/trừ coin ở client. **Nguyên tắc nên áp dụng từ giờ: mọi thay đổi số dư phải do server xác nhận rồi mới cập nhật UI.**
3. **Các bảng farm mới tạo lazily trong request** (BUG-006). Nếu một instance Vercel nhận DB restore từ S3 **chưa** có `farm_animals`, `readIncubatorFor`/`allFarmStockFor` trả `[]`/`null` trong `try/catch` → UI tưởng là "chưa mua gì", user có thể mua vượt cap thật cho tới khi bảng được tạo.
4. **Cân bằng kinh tế game**: gà 150🪙 → 55🪙/3h; bò 400🪙 → 100🪙/24h; cừu 300🪙 → 80🪙/12h; lò ấp 40🪙 → 1 gà/8h (+15 EXP). Chó/mèo/cá `isProducer: false` ⇒ **không tạo EXP/coin gì**, chỉ để đẹp — giống báo cáo đã tự nhận.
5. **Prompt injection**: `FloatingAiChat.tsx:268` `dangerouslySetInnerHTML` — hiện an toàn vì `formatMessage` escape `& < >` trước (`:56-62`) và server có `MEOWLISH_SYSTEM_PROMPT`. Nhưng nếu sau này thêm markdown (link, list) mà quên escape thì sẽ thành XSS.
6. **Rate limit**: `/api/pet` POST chỉ 60 req/phút/IP (`api/pet/route.ts:570-579`). Nhưng nông trại poll GET 4s + PvP poll phòng 2.5s chạy song song ⇒ người dùng chơi game nhiều có nguy cơ chạm trần POST khi spam nút.
7. **`main` đang đỏ lint** (BUG-010) ⇒ không có cổng chất lượng. `npx tsc --noEmit` và `npx vitest run` vẫn xanh, nhưng cả hai đều không bắt được nhóm lỗi React nguy hiểm ở trên.
8. **Quy trình bàn giao**: `docs/BAO-CAO-TIEN-DO-2026-10-11.md` còn ghi "🔴 MỤC #1/#2/#3…" và "CẦN LÀM" dù đã làm xong ⇒ gây hiểu nhầm cho người/agent sau. Nên đánh dấu trạng thái thật hoặc thêm mục "đã đóng" ở đầu file.

---

## 5. Đề xuất chia vòng (làm theo turn)

- **Vòng 1 — "Coi tiền cho đúng" (P0, ~1 turn):**
  BUG-003 (render GIF 440px) + BUG-001 (thưởng game về server) + BUG-002 (nối/xoá `claim_*_reward`).
  *Đầu ra*: GIF email sắc nét trên retina; số coin sau khi thắng game khớp server qua reload; không còn coin ảo.

- **Vòng 2 — "Xanh lint, xanh type" (P0/P1, ~1 turn):**
  BUG-010 (ưu tiên `static-components` + TDZ + `refs` + `purity`) + BUG-012 + BUG-013.
  *Đầu ra*: `npm run lint` exit 0, `tsc` sạch, `vitest` 471/471.

- **Vòng 3 — "Nông trại không gãy" (P1, ~1 turn):**
  BUG-005, BUG-019, BUG-006, BUG-007.
  *Đầu ra*: không còn env backdoor; 1 nguồn chu kỳ; DDL ra khỏi request; giảm ≥ 60% lượt poll.

- **Vòng 4 — "Dọn sạch tính năng chết" (P1, ~0.5 turn):**
  BUG-008 + BUG-009 + BUG-011 + BUG-022.
  *Đầu ra*: `grep -i "couple\|wedding"` = 0 trong `src/`; phạt học chống giả mạo ngày; PvP 1 người 1 thưởng.

- **Vòng 5 — "Lộ trình 28 ngày cho đúng nghĩa" (P1, ~1 turn):**
  BUG-004 (gắn ngày lịch + nút "Xong" gắn với bài thật).
  *Đầu ra*: mở site ngày N thấy đúng ngày N; không nhảy cóc; bỏ ngày bị phạt đúng 1 lần.

- **Vòng 6 — "AI chat đúng tình trạng + polish" (P2, ~0.5 turn):**
  BUG-016, BUG-015, BUG-017, BUG-018, BUG-020, BUG-021.
  *Đầu ra*: chatbot trả lời đúng về nông trại/shop/kế hoạch; nút chat dùng được cả khi khách; bảng usageTable đúng nhãn.

- **Vòng 7 — "Ý tưởng thú vị" (mục #12, ~1 turn):**
  Chọn 2 trong 3: Hộp quà chuỗi 7 ngày · Biểu đồ tiến bộ tuần · Mùa vụ nông trại. Cả 3 đều tái dùng dữ liệu đã có (`streak`, `progress.study_day`, `CROPS_CATALOG`) nên không cần bảng mới.

---

## Phụ lục — bằng chứng lệnh đã chạy

```
npx tsc --noEmit          → PASS (không output)
npx vitest run            → PASS  28 test files / 471 tests  (3.88s)
npm run lint              → FAIL  685 problems (435 errors, 250 warnings)
node scripts/verify-email-gifs.mjs public
                          → ✔ Dance-cat.gif 150x150 306KB 90/90 khung trong suốt
                            ✔ cat-forgot.gif 150x150 247KB 73/73 khung trong suốt
```
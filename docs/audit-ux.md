# Báo cáo UX/UI — 2026-10-15

> Agent: UX/UI Audit (read-only). **Không sửa code, không commit.**
> Phương pháp: `browser.*` tools **không kết nối được** (`[browser.disconnected] No desktop browser is connected to this session`) trong suốt phiên, nên chuyển sang **Playwright (chromium 1243) điều khiển thật** chạy trên `http://localhost:3000` (dev server sẵn có) — đo `getBoundingClientRect`, `getComputedStyle`, chạy **axe-core 4.x**, đếm FPS bằng `requestAnimationFrame`, và chụp 67 ảnh light/dark × desktop/mobile.

## Tóm tắt

- **Trang đã kiểm tra (13 route, light + dark, desktop 1440×900 + mobile 390×844):**
  `/`, `/pet` (5 tab: Nông Trại 2.5D, Đấu Trường PvP, Đua Thú, Sân Vườn, Phố Xã Hội), `/grammar`, `/encyclopedia`, `/vocabulary`, `/flashcards`, `/bookmarks`, `/exam`, `/support`, `/practice/speaking`, `/practice/writing`, `/practice/listening`, `/practice/roleplay`
- **Đăng nhập:** dùng nút "Thử nhanh với tài khoản Demo" (`demo`) qua UI — thành công trên cả 2 viewport. Không cần đăng nhập thủ công.
- **Tổng số vấn đề: 21** → **Blocker 1 · Major 9 · Minor 9 · Nit 2**
- **Không có lỗi console / pageerror** trên bất kỳ trang nào (13 route × 2 theme × 2 viewport = 52 lần tải).
- **Canvas nông trại chạy 60 FPS ổn định** (`dpr=1`, canvas 840×520 px thật).
- **axe-core: 0 lỗi `critical`/`serious` nào mới ngoài những cái đã liệt kê**; tổng 8 nhóm vi phạm, phần lớn tập trung ở sidebar + 1 nút.
- Ảnh minh chứng: `docs/audit-screenshots/` (67 file, prefix `desktop-*`, `mobile-*`, `*-light.png` / `*-dark.png`).

---

## Vấn đề phát hiện

### [UX-001] `/vocabulary` và `/exam` vỡ layout hoàn toàn trên mobile — nội dung bị cắt, không đọc được  — mức: **Blocker**

- **Trang/route:** `/vocabulary`, `/exam` (viewport 390×844)
- **Bước tái hiện:**
  1. Mở `/exam` trên điện thoại 390px (hoặc DevTools iPhone 12 Pro).
  2. Quan sát: tiêu đề hero bị cắt đúng giữa chữ — *"Bộ Đề Kiểm Tra & Thi Thử Chủ…"*, *"Học Từ Vựng Giao Tiếp Theo F…"*; các thẻ bài, ô lọc chủ đề, chip kỹ năng đều tràn ra ngoài mép phải màn hình.
- **Mô tả:** Trang hiển thị một bố cục rộng **1280px (`/vocabulary`) và 1152px (`/exam`)** bên trong khung nhìn 390px. `document.documentElement.scrollWidth === 390` nên trình duyệt **không hiện thanh cuộn ngang nào** — người dùng không có tín hiệu nào cho biết còn nội dung bên phải.
- **Vấn đề (đo được):**
  ```
  /vocabulary : <main> clientW=390  scrollW=1280   root w=1280 (max-w-7xl=80rem)
  /exam       : <main> clientW=390  scrollW=1152   root w=1152 (max-w-6xl=72rem)
  /encyclopedia: root w=392  (đã tràn 2px — chựa nổ, nhưng cùng lớp lỗi)
  ```
- **Nguyên nhân gốc (đã xác minh cơ chế, không phải phỏng đoán):**
  `AppShell` render `<main className="flex-1 … flex flex-col w-full …">` — tức `<main>` là **flex container hướng cột**. Trong flex column, **margin chéo `auto` (`mx-auto`) chặn `align-self: stretch`** theo đặc tả Flexbox, nên item được định kích thước theo *max-content* thay vì co giãn theo container. Trang `/vocabulary` và `/exam` có root là
  `class="max-w-7xl mx-auto … overflow-x-hidden"` (src/app/vocabulary/page.tsx:130) và
  `class="max-w-6xl mx-auto …"` (src/app/exam/page.tsx:442) — **thiếu `w-full`**, nên root phình ra tới `max-width` rồi bị `overflow-x-hidden` của chính nó + của `<body>` cắt.
  Ba trang đã "may mắn" vì có `w-full`: `/` (page.tsx:265), `/grammar` (page.tsx:162), `/practice/writing` (page.tsx:721).
- **Đề xuất sửa (đã thử nghiệm runtime, KHÔNG sửa file):** thêm `w-full` vào class root của các trang còn thiếu. Kết quả đo lại:

  | Route | Trước | Sau khi `w:100%` |
  |---|---|---|
  | `/vocabulary` | 1280px | **390px** ✅ |
  | `/exam` | 1152px | **390px** ✅ |
  | `/encyclopedia` | 392px | **390px** ✅ |

  Danh sách file cần thêm `w-full` ngay sau `max-w-*` (8 file, phòng thủ cho nội dung dài hơn về sau):
  - `src/app/vocabulary/page.tsx:130`
  - `src/app/exam/page.tsx:442`
  - `src/app/encyclopedia/page.tsx:351`
  - `src/app/bookmarks/page.tsx:181`
  - `src/app/flashcards/page.tsx:180`
  - `src/app/practice/speaking/page.tsx:198`
  - `src/app/practice/listening/page.tsx:104`
  - `src/app/practice/roleplay/page.tsx:169`

  *Khuyến nghị lâu dài:* sửa ở `AppShell` — bỏ `flex` khỏi `stageScrollerClassName`, hoặc thêm `> * { width: 100% }`, để mọi trang sau này không lặp lại lỗi này.
- **Ảnh:** `docs/audit-screenshots/mobile-vocabulary-light.png`, `docs/audit-screenshots/mobile-exam-light.png`

---

### [UX-002] Canvas game trên mobile bị bóp còn ~22–27% chiều cao màn hình  — mức: **Major**

- **Trang/route:** `/pet` — tab Nông Trại 2.5D, Đấu Trường PvP, Đua Thú
- **Bước tái hiện:** mở `/pet` trên 390×844, cuộn xuống vùng game.
- **Vấn đề (đo được, viewport cao 844px):**

  | Tab | Kích thước canvas | Tỉ lệ chiếm màn hình dọc | Vị trí |
  |---|---|---|---|
  | Nông Trại 2.5D | 366 × **227px** | 27% | `@y=608` |
  | Đấu Trường PvP | 366 × **183px** | 22% | `@y=281` |
  | Đua Thú Cưng | 366 × **192px** | 23% | `@y=301` |

  Người dùng phải cuộn qua HUD + 3 thẻ vật nuôi trước khi tới game; khi tới nơi, game chỉ còn ~120px nhìn thấy trước khi bottom nav cắt ngang.
- **Nguyên nhân:** canvas dùng `class="… w-full max-w-[840px] h-auto object-contain block touch-none"` (src/components/pet/PixelFarmCanvas.tsx:1544) — tỉ lệ 840:520 (1.615) được giữ nguyên, nên ở 366px rộng chỉ còn 227px cao. Đây là **game giải trí chính** của tính năng "Hot" trên sidebar.
- **Đề xuất sửa:** ở mobile, cho canvas chiếm phần lớn viewport thay vì bị đẩy xuống dưới:
  - `src/components/pet/PixelFarmCanvas.tsx:1539` — bỏ bố cục xếp dọc HUD→cards→canvas trên mobile, dùng `lg:flex-row` để canvas chiếm chiều ngang đầy màn hình và HUD/cards nằm cạnh (kiểu Duolingo), **hoặc**
  - thêm `sm:aspect-[16/10] lg:aspect-auto` + `max-h-[52dvh]` để vuốt tỉ lệ riêng cho mobile.
  - Tương tự cho `PetPvPArenaCanvas.tsx` và `PetRacingCanvas.tsx`.
- **Ảnh:** `docs/audit-screenshots/mobile-pet-light.png`, `docs/audit-screenshots/mobile-pet-tab1.png`

---

### [UX-003] Nút tròn chat AI che nút thao tác thật trên mobile  — mức: **Major**

- **Trang/route:** `/grammar`, `/encyclopedia`, `/flashcards` (mobile 390px)
- **Bước tái hiện:** mở `/grammar` → kéo tới khối "Mô hình khối Lego" → nhìn nút xanh "🔊 Phát Âm Toàn Câu".
- **Vấn đề (đo được, phần trăm vùng bị che của từng control):**
  ```
  /grammar      : che 10%  <BUTTON> 306×44  "Phát Âm Toàn Câu"
  /encyclopedia : che 17%  <BUTTON>  99×38  "collaborate"   (nút phát âm)
                  che  1%  <BUTTON>  97×38  "meticulous"
  /flashcards   : che  2%  <DIV>   358×320  thẻ flashcard
  ```
  Nút FAB `fixed right-4 bottom-20` (56×56) nằm đúng lên mép phải các hàng nút phát âm — vốn đã chỉ cao 38px.
- **Đề xuất sửa:** ở `src/components/FloatingAiChat.tsx:189`, dùng `bottom-20` → `bottom-[calc(4rem+env(safe-area-inset-bottom)+12px)]` và cân nhắc tự ẩn FAB khi người dùng cuộn tới các vùng có nút neo góc phải; hoặc thêm `sm:bottom-24` + thu nhỏ `w-12 h-12` ở mobile để giảm vùng che. Kiểm tra lại bằng script đo overlap sau khi sửa.
- **Ảnh:** `docs/audit-screenshots/mobile-grammar-light.png` (nút "Phát Âm Toàn Câu" bị mèo AI đè lên mép phải)

---

### [UX-004] Nút chat AI nổi animation vô hạn → không bao giờ "ổn định", chặn click tự động  — mức: **Major**

- **Trang/route:** mọi trang (trừ `/support`, `/duahau`) — nút `FloatingAiChat`
- **Bước tái hiện:** Playwright `page.locator('[data-testid="floating-ai-chat-button"]').click()` → **timeout sau 30s**.
- **Mô tả:** nút mang `animate-[float-soft_3s_ease-in-out_infinite]` (src/components/FloatingAiChat.tsx:194). Playwright yêu cầu bounding box ổn định qua 2 frame liên tiếp trước khi click — animation vô hạn khiến điều đó không bao giờ xảy ra.
- **Vấn đề (đo được):**
  ```
  computed animation = "float-soft 3s"
  top qua 6 frame: 702.55 → 702.44 → 702.34 → 702.25 → 702.18 → 702.12  (6/6 giá trị khác nhau)
  locator.click() (không force) → Timeout 30000ms: "element is not stable"
  ```
  Hai hệ quả: (1) **mọi test E2E phải dùng `click({force:true})`** — Tester cần biết điều này; (2) trên máy thật, nút **di chuyển 6px mỗi 3 giây ngay dưới ngón tay**, gây bấm hụt với người khó cử động tay.
- **Đề xuất sửa:** chỉ chạy animation ở `@media (hover:hover) and (pointer:fine)`, hoặc chuyển sang `animation-iteration-count` hữu hạn + thêm class `motion-safe:animate-[float-soft_3s_ease-in-out_3]`. Nếu giữ animation vô hạn, bổ sung `data-testid` vào một phần tử cha **không** animate để test neo vào.

---

### [UX-005] Thanh công cụ nông trại: nút cao lệch nhau 44px vs 76px, nội dung bị cắt  — mức: **Major**

- **Trang/route:** `/pet` tab Nông Trại 2.5D — toolbar `absolute top-3 right-3` (src/components/pet/PixelFarmCanvas.tsx:1548-1602)
- **Bước tái hiện:** mở `/pet` trên 390px → nhìn dải nút đen nằm trên mép trên canvas.
- **Vấn đề (đo được ở 390px):**

  | Nút | Kích thước | `top` | Ghi chú |
  |---|---|---|---|
  | 🌾 Rải Thóc (20🪙) | 77 × **76px** | 627 | xuống **3 dòng**, lệch 16px so với 3 anh em |
  | 🌿 Rải Cỏ (bò/cừu) | 99 × 44px | 643 | 2 dòng |
  | 🏪 Cửa Hàng | 78 × 44px | 643 | 2 dòng |
  | 🥚 Ấp Trứng | 82 × 44px | 643 | 2 dòng |

  Icon 🪙 của nút "Rải Thóc" bị **cắt đôi** bởi mép bo góc của container. Ngoài ra toolbar nằm **đè lên canvas** và ở 390px rộng nó phủ **toàn bộ chiều ngang canvas** (354px trong 366px) + 76px chiều cao ≈ **33% vùng chơi bị che vĩnh viễn**. Trên desktop 1440px, cả 4 nút chỉ cao **28px** (`py-1.5`, không có `min-h-[44px]`).
- **Nguyên nhân:** class nút là `px-3 py-1.5 … flex items-center gap-1.5` — thiếu `min-h-[44px]`, thiếu `whitespace-nowrap`, và chuỗi `Rải Thóc (${feedPrice}🪙)` thiếu khoảng trắng trước emoji (dòng 1559).
- **Đề xuất sửa:** thêm `min-h-[44px] whitespace-nowrap shrink-0` cho cả 4 nút; sửa `Rải Thóc (${…}🪙)` → ``Rải Thóc (${…} 🪙)``; chuyển toolbar ra **dưới canvas** ở mobile (`static lg:absolute`) thay vì `absolute top-3 right-3`, để không che vùng chơi.
- **Ảnh:** `docs/audit-screenshots/mobile-pet-farm-zoom.png` (ảnh crop — thấy rõ nút 3 dòng bị cắt)

---

### [UX-006] Trạng thái rỗng "phòng đấu" bị cắt dọc trên mobile — mất cả thông báo lẫn nút hành động  — mức: **Major**

- **Trang/route:** `/pet` → tab Đấu Trường PvP (mobile 390px)
- **Bước tái hiện:** mở `/pet` → vuốt tab bar sang phải → bấm "⚔️ Đấu Trường PvP".
- **Vấn đề (đo được):**
  ```
  overlay: <div class="absolute inset-0 … overflow-y-auto">  clientH=183  scrollH=388
  → 205px nội dung bị cắt, không có scrollbar hiển thị
  ```
- **Mô tả:** chữ *"Chưa có người chơi nào mở phòng đấu"* hiện ra nhưng **dòng kế tiếp bị cắt giữa dòng ký tự**, và phần "Tạo phòng" phía dưới không nhìn thấy. Người dùng mới vào PvP thấy một thẻ bị cắt + ~300px khoảng trắng bên dưới, không biết phải làm gì.
- **Đề xuất sửa:** ở `PetPvPArenaCanvas.tsx`, cho phần trạng thái rỗng **không phụ thuộc chiều cao canvas**: `absolute inset-0` → `relative` (hoặc `min-h-[320px]`), và đặt nút "Tạo Phòng" trong trạng thái rỗng luôn (H1 + H5 — trạng thái rỗng phải nói rõ và cho lối ra).
- **Ảnh:** `docs/audit-screenshots/mobile-pet-tab1.png`

---

### [UX-007] Tương phản chữ sidebar dưới chuẩn WCAG AA trên cả 13 trang  — mức: **Major**

- **Trang/route:** toàn site (sidebar desktop + mobile drawer)
- **Bước tái hiện:** chạy axe-core `color-contrast`; hoặc nhìn sidebar ở light/dark mode.
- **Vấn đề (axe-core đo, 3 mẫu duy nhất lặp ở cả 13 route):**

  | Element | Theme | Tỉ lệ | Cần | Xuất hiện ở |
  |---|---|---|---|---|
  | Nhãn nhóm sidebar `text-slate-400` ("HỌC TẬP", "PHÒNG LUYỆN TẬP"…) | light | **2.63:1** | 4.5 | 13/13 trang |
  | Nhãn nhóm sidebar `dark:text-slate-500` | dark | **3.74:1** | 4.5 | 13/13 trang |
  | Mục nav đang active (`bg-emerald-500` + `text-white`) | cả 2 | **2.47:1** | 4.5 | 8/13 trang |

- **Mô tả:** `src/components/AppShell.tsx:463` (`text-slate-400 dark:text-slate-500`) và `:488` (`bg-emerald-500 text-white`).
- **Điểm nhất quán đáng chú ý:** `globals.css:87` đã **cố tình** hạ `.btn-3d-emerald` xuống `#047857` để đạt 4.8:1 (có comment giải thích), nhưng sidebar dùng `emerald-500` thô nên vẫn fail 2.47:1 — cùng một màu thương hiệu, hai tiêu chuẩn khác nhau.
- **Đề xuất sửa:** (a) nhãn nhóm → `text-slate-500 dark:text-slate-400` (slate-500 #64748b = 4.76:1 trên trắng; slate-400 #94a3b8 = 7.4:1 trên #0f172a); (b) mục active → `bg-emerald-700` để khớp `.btn-3d-emerald`.
- **Ảnh:** `docs/audit-screenshots/desktop-home-light.png`, `docs/audit-screenshots/desktop-pet-dark.png`

---

### [UX-008] 19 lần gọi `alert()` gốc của trình duyệt cho lỗi và xác nhận  — mức: **Major**

- **Trang/route:** `/pet`, `/study-plan`, PvP, Đua Thú
- **Vấn đề (grep `alert(` trong `src/`):** **19 chỗ** trong 5 file:
  - `src/app/pet/page.tsx` — 8 chỗ (dòng 541, 594, 638, 703, 871, 915, 919)
  - `src/components/pet/PetPvPArenaCanvas.tsx` — 6 chỗ (288, 292, 331, 335, 410, 448)
  - `src/components/pet/PetRacingCanvas.tsx` — 5 chỗ (380, 384, 423, 427, 462)
  - `src/components/StudyPlanSection.tsx:64` — 1 chỗ
- **Vấn đề (H1/H4/H9):** hộp thoại gốc của trình duyệt **không theo dark mode**, không theo font/bo góc của hệ thiết kế, chặn toàn bộ tương tác, không có nút hành động cụ thể (chỉ "OK"), và không thông báo cho trình đọc màn hình một cách nhất quán. App đã có sẵn `ProfileEditModal`, `AuthModal`, `EmailVerifyModal` — nhưng lỗi thì không.
- **Ví dụ cụ thể:** `src/app/pet/page.tsx:541` — người dùng bấm cho gà ăn khi thiếu Coins sẽ nhảy một alert nhiều dòng chứa số liệu tài chính, thay vì một toast/bottom-sheet có nút "Đi học để kiếm Coins" dẫn thẳng về `/`.
- **Đề xuất sửa:** dựng một `useToast()`/`ConfirmDialog` dùng chung (đã có `z-[9998]` sẵn trong hệ z-index của AppShell); thay toàn bộ 19 chỗ. Ưu tiên 3 luồng: thiếu Coins (dòng 541/871) → toast + CTA; lỗi server → toast đỏ 5s; tạo phòng PvP/đua → toast thông tin.

---

### [UX-009] Cùng một số dư Coins hiển thị 3 kiểu định dạng khác nhau  — mức: **Major**

- **Trang/route:** `/pet` (toàn site)
- **Bước tái hiện:** đăng nhập demo (số dư 9291), mở `/pet` → nhìn header và tab bar.
- **Vấn đề (đo được, ảnh `desktop-pet-light.png` — hai con số cạnh nhau trên cùng màn hình):**
  ```
  Header pill (AppShell.tsx:631)  : "9291 COINS"     ← raw, không phân tách
  /pet tab bar  (PixelFarmGame.tsx:2050) : "9,291"     ← toLocaleString() không locale
  Sân Vườn HUD / Phố Xã Hội HUD          : "9,291"     ← toLocaleString() không locale
  ```
- **Vấn đề (H4 — nhất quán):** `toLocaleString()` **không truyền locale** phụ thuộc thiết bị: máy người dùng Việt hiện `"9.291"`, máy en-US hiện `"9,291"`. Trong khi đó 2 chỗ khác lại dùng `toLocaleString('vi-VN')` (PetRacingCanvas.tsx:1045, PetPvPArenaCanvas.tsx:1142). Tức là 4 kiểu khác nhau cho cùng một khái niệm. Ngoài ra header không có phân tách nghìn — với số dài 6–7 chữ số, pill sẽ phình và ép các pill khác trong header phải co lại.
- **Đề xuất sửa:** tạo `src/lib/format.ts` → `export const fmtCoins = (n:number) => n.toLocaleString('vi-VN')` rồi thay **toàn bộ** các điểm hiển thị coin, kể cả `AppShell.tsx:631`. Đồng thời kiểm tra lại header ở `coins = 1.000.000+` (dùng DevTools ép giá trị).
- **Ảnh:** `docs/audit-screenshots/desktop-pet-light.png`

---

### [UX-010] Nút mic tròn 80×80 trên `/practice/speaking` không có tên cho trình đọc màn hình  — mức: **Major**

- **Trang/route:** `/practice/speaking`
- **Bước tái hiện:** chạy axe-core → `button-name` (**impact: critical**).
- **Mô tả:** nút `w-20 h-20 sm:w-24 sm:h-24` chỉ chứa icon `<Mic/>`/`<MicOff/>` của lucide, **không có `aria-label`, không có `title`, không có text** (`src/app/practice/speaking/page.tsx:368-378`).
- **Vấn đề (H — trợ giúp/khả năng tiếp cận):** đây là **nút hành động chính của cả trang luyện nói**. Người dùng trình đọc màn hình nghe "button" trống, không biết đó là bật/thu âm. Hậu quả kéo theo: không có accessible name ⇒ cũng không có nhãn trạng thái khi `isListening` đổi.
- **Đề xuất sửa:**
  ```tsx
  aria-label={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
  aria-pressed={isListening}
  title={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
  ```
  Đặt cạnh các nút `Nghe mẫu 1x` / `Chậm 0.65x` đã có text.

---

### [UX-011] Vùng chạm dưới 44px trên mobile — chip lọc 24–28px ở 6 trang  — mức: **Minor**

- **Trang/route:** `/exam`, `/practice/speaking`, `/practice/writing`, `/practice/listening`, `/support`, `/flashcards`
- **Vấn đề (đo được ở 390px, sau khi đã trừ vùng mở rộng `.tap-target::after`):**

  | Trang | Mẫu control | Kích thước thực |
  |---|---|---|
  | `/exam` | chip "Chủ đề" (`px-3 py-1.5`) | **28px** cao |
  | `/exam` | chip "Cấp độ" (`px-2.5 py-1`) | **24px** cao |
  | `/practice/speaking` | chip chủ đề + cấp độ | **24px** cao |
  | `/support` | chip hashtag (`px-2.5 py-1`) | **23px** cao |
  | `/support` | chip chuyên mục | **28px** cao |
  | `/flashcards` | chip "Tất cả từ (139)" | **28px** cao |
  | `/`, `/practice/writing`, `/practice/listening` | nút `min-h-[40px]` | **40px** cao |

- **Điểm tốt:** các nút lọc này **không** dùng class `.tap-target`, nên không được mở rộng — khác với pill header đã được xử lý đúng.
- **Đề xuất sửa:** thêm `min-h-[44px] inline-flex items-center` cho nhóm chip lọc (mẫu đã có sẵn ở `src/app/grammar/page.tsx:296` và `:316` — hãy nhân bản pattern đó). Với nhóm nhiều chip, `py-2.5` là đủ thay vì tăng `min-h`.
- **Ảnh:** `docs/audit-screenshots/mobile-exam-light.png`

---

### [UX-012] `/vocabulary`: 134 link "Luyện Nói" cao 16px  — mức: **Minor**

- **Trang/route:** `/vocabulary` (mobile & desktop)
- **Vấn đề (đo được):** **134 phần tử** `<a>` kích thước **75 × 16px**, lặp một lần cho mỗi thẻ từ vựng. Không padding, không `min-h`, không `.tap-target`.
- **Mô tả:** ở mobile đây là mục tiêu chạm 16px — dưới 1/3 ngưỡng Apple HIG 44px, và ngay dưới ngưỡng WCAG 2.5.8 24px. Người dùng cố bấm sẽ trượt sang "Lưu Sổ Tay" bên cạnh (nút kia **có** `tap-target` + `min-h-[40px]`).
- **Đề xuất sửa:** `src/app/vocabulary/page.tsx:305-311` — thêm `tap-target min-h-[44px] px-2 -ml-2 inline-flex items-center` để vùng chạm ≥44px mà không làm đổi bố cục.
- **Ảnh:** `docs/audit-screenshots/mobile-vocabulary-light.png`

---

### [UX-013] Chip tab `/pet` cao 28–30px, 4/5 tab nằm ngoài màn hình  — mức: **Minor**

- **Trang/route:** `/pet` (mobile 390px)
- **Vấn đề (đo được):** thanh tab rộng **1042px** trong khung **374px**; `scrollWidth=1133` vs `clientWidth=370`.

  | Tab | offsetX | Cao | Nằm ngoài khung? |
  |---|---|---|---|
  | 🌾 Nông Trại 2.5D | 16 | 28px | không |
  | ⚔️ Đấu Trường PvP | 287 | 30px | **có** |
  | 🏁 Đua Thú Cưng | 510 | 30px | **có** |
  | 🏡 Sân Vườn Linh Vật | 720 | 30px | **có** |
  | 👥 Phố Xã Hội | 886 | 30px | **có** |

- **Điểm tốt:** thanh **có** vuốt ngang được (`overflow-x:auto`, `touch-action:auto`) — đã thử `scrollLeft` và bấm được cả 5 tab, không kẹt. Vấn đề chỉ là **chiều cao 28–30px** và **không có dấu hiệu trực quan** rằng còn tab ngoài màn hình.
- **Đề xuất sửa:** thêm `min-h-[44px]`; thêm `snap-x` + gradient mờ dần ở mép phải để gợi ý "còn nữa"; hoặc rút nhãn còn "Nông Trại / PvP / Đua Thú / Sân Vườn / Xã Hội" khi ở mobile.
- **Ảnh:** `docs/audit-screenshots/mobile-pet-light.png`

---

### [UX-014] Modal cửa hàng & dropdown tài khoản thiếu ngữ nghĩa dialog/menu  — mức: **Minor**

- **Trang/route:** `/pet` (modal cửa hàng), mọi trang (dropdown avatar)
- **Vấn đề (đo được):**
  ```
  Modal shop : <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
               role=null  aria-modal=null  aria-label=null
  Dropdown   : <div class="fixed w-60 … z-[9999]">  role=null
  ```
- **Điểm tốt (đã làm đúng):** cả hai **đóng bằng Escape** (kiểm chứng: sau `Escape`, số overlay fixed còn lại = 0; dropdown đóng, `open=false`); dropdown render qua `createPortal` nên **không bị modal z-50 của trang đè** (H6 fix 2026-10-12 đang hoạt động đúng).
- **Đề xuất sửa:** thêm `role="dialog" aria-modal="true" aria-label="Cửa hàng nông trại"` cho modal shop; `role="menu"` + `role="menuitem"` cho dropdown. Với modal nên thêm focus-trap và trả focus về nút đã mở.

---

### [UX-015] Vùng cuộn không truy cập được bằng bàn phím  — mức: **Minor**

- **Trang/route:** `/grammar` (2 chỗ), `/pet`
- **Vấn đề (axe-core `scrollable-region-focusable`, impact serious):**
  ```
  #grammar-lesson-list : clientW=304 scrollW=483  tabindex=null  role=null
  Bảng tra cứu "Present Simple vs Continuous": table 483px trong wrapper 306px, overflow-x:auto
  ```
- **Mô tả:** bảng so sánh thì và danh sách bài học đều rộng hơn khung chứa. Người dùng chuột cuộn ngang được, nhưng **người dùng bàn phím không có tab-stop nào để tới vùng cuộn đó** ⇒ không thể đọc phần bị tràn.
- **Đề xuất sửa:** thêm `tabIndex={0}` + `role="region"` + `aria-label="Danh sách bài học"` cho `#grammar-lesson-list` (src/app/grammar/page.tsx:333), và tương tự cho wrapper của `<table>`.

---

### [UX-016] `/flashcards`: control lồng control (`role="button"` chứa phần tử focusable)  — mức: **Minor**

- **Trang/route:** `/flashcards`
- **Vấn đề (axe-core `nested-interactive`, impact serious):**
  ```html
  <div role="button" tabindex="0" aria-label="Lật thẻ scalability để xem nghĩa" class="… focusable descendants…">
  ```
- **Mô tả:** thẻ 3D vừa là nút lật vừa chứa nút "Nghe Phát Âm Chuẩn". Bàn phím Tab sẽ dừng ở cả hai; Enter trên nút con không kích hoạt lật thẻ, nhưng người dùng trình đọc màn hình nghe hai lớp điều khiển lồng nhau — hành vi không xác định.
- **Đề xuất sửa:** bỏ `role="button"`/`tabIndex` khỏi thẻ, thay bằng một `<button>` phủ nền thẻ (`absolute inset-0 z-0`) còn nút "Nghe" đặt `relative z-10` phía trên.

---

### [UX-017] Cấu trúc heading không nhất quán trên 8 trang + nội dung ngoài landmark  — mức: **Minor**

- **Vấn đề (axe-core):**
  - `heading-order` (moderate) — **8 trang**: `/pet`, `/grammar`, `/encyclopedia`, `/vocabulary`, `/bookmarks`, `/exam`, `/support`, `/listening`. Ví dụ `/exam`: `<h1>` (hero) → nhảy thẳng lên `<h3>` tiêu đề thẻ đề, bỏ qua `<h2>`.
  - `empty-heading` (minor) — `/`: `<h4 class="… text-slate-900 truncate dark:text-slate-100"></h4>` **rỗng hoàn toàn**.
  - `region` (moderate) — `/support`: 3 phần tử (tiêu đề hero, `<h1>`, đoạn mô tả) **không nằm trong landmark nào**, vì `AppShell.tsx:764` bọc `/support` bằng `<div>` thay vì `<main>` để tránh 2 `<main>` lồng nhau.
- **Đề xuất sửa:** chèn `<h2>`/`<h3>` trung gian ở từng vùng; bỏ `<h4>` rỗng (render `<h4>` chỉ khi `vietnameseTitle` có giá trị); bọc phần hero của `/support` trong `<section aria-labelledby>`.

---

### [UX-018] Tên vật nuôi bị cắt bằng `...` ngay cả ở 1440px  — mức: **Minor**

- **Trang/route:** `/pet` tab Nông Trại 2.5D (desktop 1440px)
- **Mô tả (đọc trong `docs/audit-screenshots/desktop-pet-light.png`):**
  ```
  "ĐÀN GÀ MÁI CỰC TÀ…"      (thay vì "ĐÀN GÀ MÁI CỰC TẾ")
  "BÀN CỪA BÓNG MÁY TRÀ…"   (thay vì "BÀN CỪA BÓNG MÁY TRẮNG")
  "BÒ SỮA HÀ LAN BÓM ĐEN (…"  (bị cắt giữa chương trình ngoặc)
  "Bàn Cừa Bóng Máy Trắng chưa ăn - chu kỳ 12-0…"
  ```
  Cả tên vật nuôi lẫn dòng trạng thái đều mất thông tin ở desktop — người dùng không biết con vật là gì trước khi chăm.
- **Đề xuất sửa:** ở `/pet`, cho tiêu đề thẻ vật nuôi xuống `text-sm` + `line-clamp-2` thay vì `truncate` một dòng; hoặc bỏ đoạn "(...)" trong tên dữ liệu vì đã có nhãn cấp độ riêng.

---

### [UX-019] Link điều hướng sidebar cao 38–42px  — mức: **Minor**

- **Trang/route:** sidebar desktop, mọi trang
- **Vấn đề (đo được ở 1440px):** 12 link cao **38px** (không badge) / **42px** (có badge), tức dưới 44px. Ở desktop dùng chuột thì chấp nhận được, nhưng **cùng code đó chạy trong mobile drawer** (`AppShell.tsx:896`, `p-3` → ~44px) nên không nhất quán giữa hai bề mặt.
- **Đề xuất sửa:** nâng `py-2.5` → `py-3` ở link sidebar desktop để khớp drawer, hoặc chấp nhận và ghi chú rõ đây là quyết định có chủ đích cho desktop pointer.

---

### [UX-020] Dropdown tài khoản lấn lên header 9px  — mức: **Nit**

- **Trang/route:** mọi trang, dropdown avatar
- **Vấn đề (đo được ở 390px):** `top=55` trong khi header `h-16` kết thúc ở `y=64` ⇒ **9px đầu dropdown nằm chồng lên header**.
- **Đề xuất sửa:** `AppShell.tsx:664` — `top: rect.bottom + 8` → `rect.bottom + 12`. Vùng chồng hiện chỉ là khối tên/username (không tương tác) nên chưa chặn click, nhưng trông cộc.

---

### [UX-021] Tên hiển thị bị cắt ở header  — mức: **Nit**

- **Trang/route:** mọi trang, pill avatar
- **Vấn đề (đo được):** `max-w-[90px]` (`AppShell.tsx:671`) khiến tên dài bị cắt: header hiện **"Nguyễn Văn …"**, sidebar footer hiện **"Nguyễn Văn Minh (IT …"** — với tên Việt phổ biến + ngoặc phụ (ngành), gần như **mọi user đều bị cắt**.
- **Đề xuất sửa:** nới `max-w-[90px]` → `max-w-[140px]` và bỏ hậu tố ngành trong sidebar footer (`(IT ...)`), hoặc đổi sang 2 dòng: tên + level.

---

## Điểm tốt cần giữ

- **Không một lỗi console hay `pageerror` nào** trên 52 lần tải trang (13 route × light/dark × desktop/mobile). Rất hiếm với app cỡ này.
- **Canvas nông trại chạy 60 FPS** ổn định (`requestAnimationFrame` đếm 3s: 60fps; canvas thật 840×520, `dpr=1`). Đã có `content-visibility:auto`, `transform-gpu`, `will-change`, pool particle — đừng đụng vào.
- **Nút chat AI không che bottom nav**: đo được `fab.bottom=764` < `nav.top=780` (hở 16px) ở **cả 12 trang**. Và khi mở panel: `panel.bottom=700` < `nav.top=780`, `coversFab=false`. Thiết kế `bottom-20` + `bottom-36` là chính xác.
- **Escape đóng đúng mọi lớp overlay**: dropdown avatar ✅, modal cửa hàng nông trại ✅, khung chat AI ✅ (kiểm chứng bằng script, không chỉ đọc code).
- **Focus ring nhất quán**: axe + đo thực tế — **0/50 control mất focus ring** trên `/` ở **cả light và dark mode**. Vùng mở rộng `.tap-target::after { min: 44px }` là một sáng kiến tốt, giữ nguyên.
- **`prefers-reduced-motion` được tôn trọng đầy đủ** (`globals.css:1307`, `!important` cho toàn bộ ~40 animation vô hạn), kể cả `.garden-obj-hit`.
- **Chương trình học / roadmap hoạt động**: header `flex-1 min-w-0` + tiêu đề `truncate` đã sửa đúng bug nút trượt khỏi màn hình ở 360px (ghi chú M-code trong `AppShell.tsx:548-556`). Ở 390px **không có phần tử nào tràn ngang** trên 11/13 trang.
- **Xuống dòng tiếng Việt**: tiêu đề hero `/` xuống 3 dòng dễ đọc; `text-[12px]` + `truncate` xử lý đúng ở header/sidebar. Không phát hiện tràn chữ ở bất kỳ đâu.
- **Hệ design token đã có ý thức a11y**: `.btn-3d-emerald` (#047857, 4.8:1), `.btn-arcade` (#451a03, 6.98:1), `.hud-chip`, `.card-arcade` — đều có comment giải thích **vì sao** chọn màu đậm hơn. Vấn đề UX-007 chỉ là sidebar chưa theo kỷ luật đó.
- **Không có `<main>` lồng nhau** ở `/support` (AppShell chuyển sang `<div>` — fix L7c đúng).
- **`aria-label` tiếng Việt đầy đủ** trên FloatingAiChat (nút tròn, nút đóng, nút làm mới, input, nút gửi) và trên các vật thể sân vườn.

---

## Đề xuất ưu tiên

1. **[UX-001] Blocker — thêm `w-full` vào root 8 trang** (`vocabulary`, `exam`, `encyclopedia`, `bookmarks`, `flashcards`, `practice/{speaking,listening,roleplay}`). Sửa 1 class, đã đo xác nhận 1280px→390px và 1152px→390px. Nên sửa luôn ở `AppShell.stageScrollerClassName` để không tái phát.
2. **[UX-007] + [UX-010] Major — sửa tương phản sidebar (2.63:1 / 3.74:1 / 2.47:1, 13 trang) và thêm `aria-label` cho nút mic.** Hai sửa nhỏ, đóng góp lớn nhất cho nhóm lỗi nghiêm trọng của axe.
3. **[UX-002] + [UX-005] Major — làm lại layout mobile của `/pet`:** cho canvas chiếm ≥50% chiều cao màn hình, đưa toolbar ra khỏi vùng chơi, ép nút về `min-h-[44px] whitespace-nowrap`.
4. **[UX-006] + [UX-003] Major — sửa trạng thái rỗng PvP bị cắt và dời FAB khỏi mép phải các hàng nút.**
5. **[UX-004] + [UX-008] — dừng animation vô hạn trên FAB (để test E2E không phải `force:true`) và thay 19 `alert()` bằng toast/dialog dùng chung.**
6. **[UX-009] — gom định dạng Coins về một hàm `fmtCoins()` (`vi-VN`).**
7. **[UX-011] → [UX-021] — nhóm vùng chạm & vùng cuộn: nâng chip lọc lên 44px, `tabIndex={0}` cho vùng cuộn, sửa `nested-interactive` ở flashcards, dọn heading order.**

---

## Ghi chú cho agent Tester

- **Cách chạy lại:** script Playwright đã dùng nằm ở `%LOCALAPPDATA%\Temp\opencode\` (`audit-ux.cjs`, `axe.cjs`, `interact2.cjs`, `overlap.cjs`, `verify-fix.cjs`). Chạy với `NODE_PATH=<repo>\node_modules`.
- **Bắt buộc dùng `click({ force: true })` khi bấm `[data-testid="floating-ai-chat-button"]`** — xem UX-004.
- **Đăng nhập:** nút "Thử nhanh với tài khoản Demo" (không cần mật khẩu). Tài khoản demo có **9.291 Coins, Level 71, 14130 EXP** → nên test overflow số lớn bằng chính tài khoản này.
- **Regression check cho UX-001:** chạy ở **390px** (không phải 414/768 — 414 vẫn ra lỗi nhưng ít thấy hơn), rồi đo `document.querySelector('main').scrollWidth` phải bằng `clientWidth`.
- **axe-core baseline trước khi sửa:** 8 nhóm vi phạm, tổng số node `color-contrast` là 8–26/trang; sau khi sửa UX-007 con số này phải **về 0**.

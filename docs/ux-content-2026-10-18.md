# UX/UI + Nội dung + Icon cờ VN — 2026-10-18 (Vòng QA3)

> Phạm vi: làm đẹp, hiệu ứng, sidebar ẩn/hiện, icon cờ VN, từ điển rác, luồng kiến thức. Tất cả thay đổi nằm trong working tree — CHƯA commit, CHƯA push.

## 1. Icon cờ VN (lý do: Windows/Chromium không render emoji cờ → hiện chữ "VN")

- Tạo `src/components/FlagIcon.tsx` — SVG nội tuyến: `VN` (đỏ #DA251D + sao vàng 5 cánh), `GB`, `US`; export thêm `FlagText` (quét chuỗi và thay MỌI emoji cờ bằng FlagIcon, phần chữ còn lại giữ nguyên).
- Thay emoji cờ bằng `<FlagIcon code="VN|US|GB" />` ở: `HighlightTooltip` (ví dụ dịch + IPA US/UK), `vocabulary`, `grammar`, `flashcards`, `page.tsx` (hero + các khối), `exam` (badge/chip/categoryLabel qua `FlagText`).
- Sửa bug runtime: `page.tsx` import default export nhầm tên `FlagText` ⇒ `FlagIcon is not defined` ⇒ cả khối nội dung không render. Đã sửa import `FlagIcon, { FlagText }`.
- Dữ liệu (`learningPathsData.icon`, `exams.badgeIcon/categoryLabel`) giữ emoji nhưng render qua `FlagText` ⇒ hiển thị SVG đúng trên mọi nền tảng. **Số emoji cờ còn lại trong src: 0** (đã grep).
- Bằng chứng: `scratch/qa3-*.png` + `tests/e2e/device-matrix.spec.ts` (regression `FlagIcon is not defined`).

## 2. Sidebar ẩn/hiện (AppShell.tsx)

- Desktop `<aside>` có 2 trạng thái: MỞ (`w-64`) ↔ GỌN (icon rail `w-[76px]`); nút chevron trong khối logo, `aria-expanded`, thao tác được bằng bàn phím, tooltip (`title`) khi gọn.
- Lưu trạng thái `localStorage` key `meowlish_sidebar_collapsed` (`'1'/'0'`), đọc sau mount (tránh hydration mismatch — flash nhỏ chấp nhận).
- Main content offset đổi theo (`lg:pl-64` ↔ `lg:pl-[76px]`) với transition 300ms; nav item căn giữa + ẩn label khi gọn; mobile drawer giữ nguyên.
- Respect `prefers-reduced-motion` (transition).

## 3. Hiệu ứng & làm đẹp

- Đọc `.agent/skills/micro-interactions-fx` + `childhood-graphics-stylist`; rà hover/active/focus-visible/transition nhất quán ở AppShell/FloatingAiChat/HighlightTooltip + `globals.css` (+25 dòng: micro-interaction tinh tế).
- FAB chat AI (UX-003): xử lý overlap với nút thao tác ở grammar/encyclopedia/flashcards (z-index/spacing).
- UX-002: **giữ** guard hiện tại `min-h-[40dvh] + max-h-[60dvh]` (không đổi `lg:max-h-none` — chờ quyết định chủ nhân).
- UX-017: rà heading/tabIndex/aria — sửa các mục còn thật, bỏ qua mục đã giải quyết.

## 4. Từ điển rác & luồng kiến thức

### 4.1 Điều tra
- `data/dictionary.db`: `dictionary_entries` 26.416 (sạch cơ bản, `meaning_vi` không rỗng); `dictionary_cache` 26.933 (rác thật sự: 6 row `Term: "..."` fallback — `hybr`, `pround of you`, `naruto`, `oh my god`, `gaydog`, `gay dog`; bản dịch chung chung "Dịch thuật trực tuyến"; bản flat có `meaningVi` thật không bị xoá nhầm).
- Scripts khảo sát: `scratch/dict-scope.mjs`, `scratch/dict-junk.mjs` (kết quả mẫu).

### 4.2 Guard ở tầng code (ship được)
- `src/lib/cambridgeCrawler.ts`: thêm `isLowQualityResult()` + `hasRealMeaning()` (xử lý cả 2 schema cache: `senses[]` và flat `meaningVi/allViMeanings`). Cache hit rác → xoá row + coi như MISS; fallback rác → không cache, trả `null` (route trả "không tìm thấy" thay vì hiển thị định nghĩa vô nghĩa). Đồng bộ guard trong `scripts/audit-junk-entries.mjs`.
- `src/app/api/dictionary/route.ts`: validate `word` (chỉ chữ cái/số/khoảng trắng/gạch nối/nháy đơn, 1–100 ký tự) → 400 "Từ không hợp lệ." cho input rác / prompt-injection.
- Thêm `scripts/audit-junk-entries.mjs`: báo cáo thống kê + mẫu CSV (`scratch/junk-cache-sample.csv`), hỗ trợ `--apply`.

### 4.3 Dọn dữ liệu local
- Backup: `data/dictionary.db.bak-junkclean-2026-10-18` (67MB).
- Chạy `--apply`: xoá **6 row** rác (Term: fallback). Còn lại 26.927 row. Không upload S3 (chưa push — prod còn rác tới khi chủ nhân quyết định re-upload).

### 4.4 Luồng kiến thức
- Soát `src/lib/data/*` (vocabulary, grammar, encyclopedia, exams, practice) + `learningPathsData` + `studyPlanData`: **không phát hiện mojibake** (U+FFFD/U+00C3/U+00C2 chỉ xuất hiện trong tiếng Việt hợp lệ như "Âm"); nội dung nhất quán. Không có viết tắt vô nghĩa rõ ràng trong dữ liệu tĩnh curated.
- Các entry từ điển rác chủ yếu đến từ `dictionary_cache` (tra cứu người dùng) — đã guard + dọn.

## 5. Kiểm chứng

- `npx tsc --noEmit`: sạch. `npx vitest run`: 35 files / 572 tests pass.
- E2E: `tests/e2e/device-matrix.spec.ts`, `floating-chat`, `home` liên quan.
- Ảnh bằng chứng: `scratch/qa3-*.png`.

## 6. Việc còn lại / chờ quyết định chủ nhân

- **Deploy**: chưa push — sau push, prod mới có guard; cache rác ở prod cần re-upload `dictionary.db` (hoặc chạy cleanup trên prod DB).
- **UX-002**: giữ guard hiện tại hay thêm `lg:max-h-none` (tuỳ chọn).
- **Warm-up cron / gzip 64MB / CDN SWR**: đề xuất của agent 3 (docs/resilience-2026-10-18.md §8) — chờ quyết.
- **Sidebar**: hiện tại gọn thành icon rail; nếu muốn ẩn hẳn (w-0) thì đổi 1 dòng.

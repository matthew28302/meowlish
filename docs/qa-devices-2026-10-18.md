# QA thiết bị + Walkthrough tính năng — 2026-10-18 (Vòng QA3)

> Phạm vi: giao diện, tương tác, responsive cho nhiều thiết bị (TinyFish), thao tác thử các tính năng 1 lượt và rà soát lỗi. Tất cả thay đổi nằm trong working tree — CHƯA commit, CHƯA push.

## 1. Thiết bị test qua TinyFish (yêu cầu trực tiếp)

- Dùng skill `use-tinyfish` + mẫu `scratch/tf2-check.js` (CDP_URL + Playwright). Tạo **≥6 cấu hình thiết bị** và chụp screenshot lưu `scratch/qa3-*.png`:
  - iPhone SE 320×568, Android 360×800, iPhone 390×844
  - iPad 768×1024 (dọc) + 1024×768 (ngang), Laptop 1366×768, Desktop 1920×1080
  - Kiểm cả light + dark mode; trang chủ, vocabulary, pet (canvas), support.
- Tổng **275 screenshot** bằng chứng (tiền tố `qa3-`).
- Test trên production `https://www.meowlish.io.vn` (KHÔNG apex — apex có thể trả 403 Vercel Security Checkpoint; nếu gặp 403 thì retry/đổi cách).

## 2. Ma trận local (Playwright device emulation)

- File mới `tests/e2e/device-matrix.spec.ts` — 3 nhóm:
  1. Tràn ngang im lặng (kế thừa UX-001) trên 6 cấu hình thiết bị × 32 trang — đo `getBoundingClientRect` thật (không tin `scrollWidth` bị clamp bởi `overflow-x-hidden`); loại trừ vùng cuộn ngang cố ý (chip/tab).
  2. Tap target < 44px trên thiết bị cảm ứng (chip lọc 24–32px) — đo kích thước THẬT (không tính `::after` của `.tap-target`).
  3. Regression runtime `FlagIcon is not defined` (pageerror) ở trang chủ — kèm kiểm tra cờ SVG đã vẽ thật thay vì pill rỗng.
- Cấu hình: `PHONES` (320/360/390) + `TABLETS_LAPTOP` (768/1024/1366). Login demo tự động (`thử nhanh với tài khoản demo`).

## 3. Walkthrough 1 lượt mọi tính năng

Trang đã walkthrough: `/`, `/vocabulary`, `/grammar`, `/flashcards`, `/exam`, `/encyclopedia`, `/bookmarks`, `/practice/{listening,roleplay,speaking,writing}`, `/pet`, `/fitcheck`, `/support` (+ FloatingAiChat), theme toggle, drawer mobile, sidebar desktop, trang 404/reset-password.

Kiểm tra: console error/pageerror, ảnh vỡ, chữ đè, contrast, nút không bấm được, khoá cuộn, chặn xoay ngang, dark mode.

## 4. Lỗi tìm được & đã sửa

- **Overflow ngang im lặng** trên nhiều trang ở mobile (chip/tab bị cắt) → sửa layout (chip cuộn ngang có chủ đích được loại trừ khỏi đo).
- **Tap target < 44px** (chip lọc) → nâng kích thước thực.
- **Runtime `FlagIcon is not defined`** ở trang chủ (import default export nhầm tên) → sửa import `FlagIcon, { FlagText }` (xem § UX).
- **FAB chat AI** che nút thao tác ở grammar/encyclopedia/flashcards (UX-003) → đã xử lý trong agent 4 (z-index/overlap).
- Các lỗi thuộc agent 4 (AppShell/FloatingAiChat/HighlightTooltip) đã được liệt kê và sửa tại chỗ (sidebar, FAB, tooltip).

## 5. Kiểm chứng

- `npx playwright test tests/e2e/device-matrix.spec.ts` (chạy được trên dev server đang chạy). `npx tsc --noEmit`: sạch. `npx vitest run`: 35 files / 572 tests pass.
- Ảnh bằng chứng: `scratch/qa3-*.png` (275 file).

## 6. Việc còn lại / chuyển giao

- Cross-owner: các lỗi requiring server-side (rate limit, auth) → agent 1; resilience/cold-start → agent 3; nội dung từ điển rác → agent 4 (đã dọn 6 row rác + guard code).
- Production: chưa deploy (chưa push); sau khi push, nên chạy lại ma trận trên prod (www.meowlish.io.vn) để xác nhận không có regression do môi trường.

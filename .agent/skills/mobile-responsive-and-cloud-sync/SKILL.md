---
name: mobile-responsive-and-cloud-sync
description: Tiêu chuẩn và giải pháp kỹ thuật xử lý Touch Scrolling trên Mobile, Responsive cho game nông trại thú cưng PixelFarm, và cơ chế bảo toàn dữ liệu SQLite trên Vercel Serverless kết hợp Filebase S3.
---

# Hướng Dẫn Kỹ Thuật: Mobile Touch Scroll, Responsive Pet & Vercel Data Persistence

## 1. Cơ Chế Cuộn Cảm Ứng Mobile (Mobile Touch Scrolling Architecture)

### Vấn đề thường gặp:
- Đặt `transform: translateZ(0)` hoặc `will-change: scroll-position` trên container có `overflow-y: auto` khiến WebKit (iOS Safari) và Mobile Chrome cô lập layer GPU và nuốt mất touch gesture 1 ngón.
- Đặt `overscroll-behavior-y: none` trên `html, body` kết hợp `min-h-dvh` (không cố định `h-dvh`) tạo ra 2 thanh cuộn cạnh tranh giữa `window` và `<main>`, dẫn đến kéo 2 ngón bị rubber-band giật ngược hướng.

### Chuẩn hóa:
1. `html` và `body` sử dụng `h-dvh overflow-hidden` để khóa cứng viewport 100% màn hình thiết bị di động.
2. Thẻ `<main>` trong `AppShell` nhận `flex-1 min-h-0 overflow-y-auto overscroll-y-contain -webkit-overflow-scrolling: touch`.
3. Loại bỏ hoàn toàn `transform: translateZ(0)` trên phần tử cuộn trong CSS.

## 2. Responsive Khu Vườn Thú Cưng (Pixel Farm Game Responsive)

### Vấn đề:
- Desktop có màn hình lớn (>1200px) hiển thị các vật thể nông trại với `scale={1.40}` rất đẹp và thoáng.
- Mobile có màn hình hẹp (360px - 412px), nếu giữ nguyên `scale={1.40}` thì các vật thể (cối xay gió, cây sồi, biệt thự) chiếm hơn 60% chiều ngang màn hình, dính sát vào nhau và đè lên Pet, ngăn cản click/touch vào Pet.

### Chuẩn hóa:
- **Desktop (>= 768px)**: Giữ nguyên 100% kích thước gốc (`scale = 1.40`, `petScale = 1.35`).
- **Mobile (< 768px)**: Tự động điều chỉnh `objScale = 0.72`, `petScale = 1.05`. Các vật thể nhỏ gọn, cách nhau thoáng đãng, chừa đường đi cho thú cưng.
- **Tương tác Pet**: Đặt Pet ở `z-40` (cao hơn mọi vật thể nền), thêm padding hit-box và `onTouchEnd` để chạm là nhận ngay. Áp dụng Optimistic Update khi đổi pet hoặc trang phục để giao diện phản hồi lập tức.

## 3. Bảo Toàn Dữ Liệu SQLite Khi Triển Khai Lên Vercel (Vercel Serverless Persistence)

### Vấn đề:
- Vercel Serverless Function có filesystem tạm `/tmp` bị xóa sạch sau mỗi lần push code hoặc khởi tạo lại container lambda mới.
- Nếu serverless container khởi tạo SQLite mới toanh rồi lại tự động upload file rỗng này lên S3 thì sẽ ghi đè và làm mất sạch dữ liệu người dùng cũ trên S3!

### Chuẩn hóa:
1. **Cold Start Restore**: Trước khi mở SQLite trên Vercel, kiểm tra Filebase S3. Nếu S3 có file backup thì tự động tải về `/tmp/data/english_learning.db` trước.
2. **Safety Guard (Chống ghi đè DB rỗng)**: Tuyệt đối không upload file local nếu local chỉ là DB mới init (chưa có user thật) trong khi remote S3 đang có dữ liệu lớn hơn.
3. **Đồng bộ tự động an toàn**: Sau các thao tác mutation (ghi tiến độ, mua đồ, đổi pet), trigger sync an toàn với debouncing.

---
name: phaser-js-gameplay
description: Tiêu chuẩn phát triển Gameplay 2D trên Web bằng HTML5 Canvas / Phaser 3, xử lý Tweening mượt mà, Tilemap tương tác, âm thanh Web Audio và đồng bộ thời gian thực.
---

# Phaser.js Gameplay Skill

Skill này hướng dẫn lập trình gameplay 2D mượt mà cho trình duyệt web, tương thích cả Desktop và Mobile Touch:

## 1. Hệ Thống Tweens & Hoạt Ảnh Mượt Mà (Juice & Easing)
- Sử dụng các hàm easing mượt (`easeInOutQuad`, `bounceOut`, `backOut`) cho mọi chuyển động:
  - Khi thu hoạch nông sản: Cây nảy lên (`scale: 1.2 -> 1.0`, `duration: 250ms`).
  - Khi Pet vui mừng: Pet nhảy cẫng lên 2 nhịp (`translateY: -20px`, `ease: bounceOut`).
  - Khi Coins nhận được: Đồng xu bay từ vị trí thu hoạch về khay số dư ở góc trên màn hình.

## 2. Tương Tác Touch & Pointer Đa Điểm (Mobile First)
- Hỗ trợ click chuột trên PC và chạm cảm ứng trên điện thoại:
  - Vùng bấm (Hitbox) tối thiểu `44x44px` theo chuẩn WCAG trên di động.
  - Hỗ trợ thao tác kéo-thả (Drag & Drop) để gieo hạt hoặc đặt đồ nội thất/trang trí vào khu vườn.
  - Hiển thị Radial Menu hoặc nút tương tác nhanh khi chạm vào thú cưng (Vuốt ve, Cho ăn, Đi dạo, Đấu trường).

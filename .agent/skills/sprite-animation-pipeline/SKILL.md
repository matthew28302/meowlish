---
name: sprite-animation-pipeline
description: Quy trình thiết kế Sprite Sheet, phân bổ khung hình (frame rate), chu kỳ hoạt ảnh (idle, walk, skill, celebrate) và tối ưu hóa CSS/Canvas Sprites.
---

# Sprite Animation Pipeline Skill

Skill này quy định quy chuẩn tạo và xử lý Sprite hoạt ảnh 2D phong cách Pixel Art / Chibi sinh động:

## 1. Cấu Trúc Khung Hình Chuẩn Cho Pet & Nhân Vật (Frames Standard)
- Mỗi nhân vật/pet sở hữu các bộ hoạt ảnh cơ bản:
  - **Idle (4 frames, 6-8 FPS)**: Thở nhẹ, nháy mắt, đuôi ngoe nguẩy tạo cảm giác sống động.
  - **Walk Down / Up / Left / Right (4-6 frames, 10-12 FPS)**: Bước chân nhịp nhàng, có nhún nhảy cơ thể.
  - **Eat / Feed (4 frames, 8 FPS)**: Miệng nhai, mắt híp lại, tai rung rinh.
  - **Skill Cast / Combat Attack (6 frames, 12-14 FPS)**: Chuẩn bị động tác (wind-up) -> vung đòn (impact frame) -> thu chiêu (recovery).
  - **Victory / Dance (6 frames, 10 FPS)**: Nhảy múa ăn mừng khi thắng đua hoặc chiến thắng đấu trường.

## 2. Tối Ưu Hóa Hiển Thị (Rendering Optimization)
- Sử dụng CSS `image-rendering: pixelated;` hoặc `image-rendering: crisp-edges;` để giữ nguyên độ sắc nét của đồ hoạ pixel, không bị mờ nhòe khi co giãn trên màn hình Retina/High-DPI.
- Tận dụng CSS sprite sheet animation với `steps(n)` hoặc Canvas `drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)` để đạt hiệu năng tối đa 60 FPS.

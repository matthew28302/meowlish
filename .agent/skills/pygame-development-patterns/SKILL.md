---
name: pygame-development-patterns
description: Các mô thức cơ bản của game 2D, vòng lặp clock tick điều phối tốc độ khung hình, Group va chạm AABB hình chữ nhật và cơ chế Dirty Rectangles.
---

# Pygame Development Patterns Skill

Skill này cung cấp các nguyên lý cơ bản của việc xây dựng logic game 2D gọn nhẹ, hiệu quả cao:

## 1. Game Clock & Fixed Time Step
- Đảm bảo tốc độ di chuyển và hoạt ảnh diễn ra đồng đều trên mọi thiết bị (màn hình 60Hz, 120Hz hay 144Hz):
  - Tính toán `deltaTime = (currentTime - lastTime) / 1000`.
  - Giới hạn delta time tối đa (`maxDt = 0.1s`) để tránh nhảy cóc vị trí (teleport glitch) khi tab bị ẩn hoặc lag.

## 2. Sprite Groups & Kiểm Tra Va Chạm (AABB Collision)
- Quản lý các nhóm thực thể:
  - `farm_plots_group`: Các ô đất có thể tương tác.
  - `pet_actors_group`: Các chú pet đang đi lại.
  - `interactive_decor_group`: Ghế đá, suối nước, chuồng gà.
- Va chạm hình chữ nhật AABB (Axis-Aligned Bounding Box):
  ```javascript
  function checkOverlap(rectA, rectB) {
    return rectA.x < rectB.x + rectB.width &&
           rectA.x + rectA.width > rectB.x &&
           rectA.y < rectB.y + rectB.height &&
           rectA.y + rectA.height > rectB.y;
  }
  ```

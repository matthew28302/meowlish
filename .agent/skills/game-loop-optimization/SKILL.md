---
name: game-loop-optimization
description: Tối ưu hoá vòng lặp Game Loop 60 FPS trên Web, quản lý bộ nhớ chống GC lag, phân bổ render không gây giật lag trình duyệt và kiểm soát repaints.
---

# Game Loop Optimization Skill

Skill này quy định các tiêu chuẩn kỹ thuật tối thượng nhằm đảm bảo game chạy mượt mà 60 FPS trên cả iPhone cũ và máy tính cấu hình khiêm tốn:

## 1. Chu Trình RequestAnimationFrame Không Gây Lag Giao Diện
- Không bao giờ đặt `setInterval` để cập nhật vị trí hoặc hoạt cảnh game.
- Luôn sử dụng `requestAnimationFrame` kết hợp hủy frame khi component unmount (`cancelAnimationFrame`).
- Tự động tạm dừng (pause loop) khi người dùng chuyển sang tab khác (`document.visibilityState === 'hidden'`) để tiết kiệm 100% CPU/Pin.

## 2. Phòng Chống Giật Lag (Anti-Jank & Zero-GC Thrashing)
- **Tái sử dụng object (Object Reuse)**: Không tạo object mới (`new Vector2()`, `{ x, y }`) bên trong vòng lặp `update()`. Khởi tạo trước các biến tạm.
- **Tách biệt DOM và Canvas**:
  - Các phần tử tương tác phức tạp (Chat, Hướng dẫn, Cửa hàng) dùng React DOM nhẹ nhàng với `React.memo`.
  - Khung cảnh thế giới 2D, pet chạy nhảy dùng HTML5 Canvas 2D / WebGL với `will-change: transform;`.
- **Giới hạn số lượng hiệu ứng hạt (Particles Cap)**: Giới hạn tối đa 30 hạt confetti/sparkle đồng thời trên mobile, tự hủy sau 1.5 giây.

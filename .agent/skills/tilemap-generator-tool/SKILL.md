---
name: tilemap-generator-tool
description: Công cụ và thuật toán sinh bản đồ lưới Tilemap 2D, phân tách đa tầng (ground, path, water, obstacles, crops), thuật toán Auto-tiling và lưới nông trại tương tác.
---

# Tilemap Generator Tool Skill

Skill này quy chuẩn việc thiết kế và sinh bản đồ thế giới 2D (Khu vườn thú cưng, Nông trại, Khu công viên, Đấu trường) lấy cảm hứng từ TeaMobi Avatar 2D:

## 1. Cấu Trúc Đa Lớp (Multi-Layer Map Design)
- **Lưới cơ sở (Grid System)**: 16x16px hoặc 32x32px cho mỗi ô Tile.
- **Layer 0 - Terrain/Ground**: Thảm cỏ xanh mướt, đất xới nông trại, sỏi lát đường, mặt nước lấp lánh có gợn sóng.
- **Layer 1 - Paths & Transitions**: Đường mòn nối giữa các khu vực (Khu vườn, Nông trại trồng trọt, Chuồng nuôi, Bàn trà, Đấu trường thú cưng).
- **Layer 2 - Interactable Plots**: Các luống đất trồng trọt (Farm Plots) đánh số ô `[0..N]`. Mỗi ô có trạng thái:
  - `EMPTY` (Đất trống đã cày)
  - `SEEDED` (Vừa gieo hạt, có mầm nhú)
  - `GROWING` (Cây non đang lớn, cần tưới nước)
  - `RIPE` (Trĩu quả chín rộ, sẵn sàng thu hoạch)
  - `WITHERED` (Héo úa nếu bỏ quên quá lâu)
- **Layer 3 - Obstacles & Buildings**: Nhà chòi nghỉ chân, hàng rào gỗ cổ điển, cối xay gió, đài phun nước, cổng vòm hoa hồng.
- **Layer 4 - Canopy/Foliage**: Tán cây lớn, bóng mây trôi nhẹ nhàng ngang màn hình tạo chiều sâu thị giác.

## 2. Bản Đồ Mở Rộng Theo Phong Cách TeaMobi Avatar
- Khu Công Viên Giao Lưu (Chat, Kết Bạn, Ngắm Cảnh).
- Khu Nông Trại Cá Nhân (Trồng trọt, Chăn nuôi gà/bò/heo).
- Khu Đường Đua Thú Cưng (Đua Pet cá cược Coins vui nhộn).
- Đấu Trường Quyết Đấu (PvP Turn-based Pet Battle).

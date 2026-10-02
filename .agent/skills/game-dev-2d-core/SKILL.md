---
name: game-dev-2d-core
description: Kiến trúc cốt lõi phát triển Game 2D, mô hình Entity-Component-System (ECS), State Machine cho Pet/Nhân vật, hệ thống sự kiện và vòng đời quản lý game state.
---

# Game Dev 2D Core Skill

Skill này quy định các tiêu chuẩn kiến trúc, mô hình dữ liệu và quy trình phát triển logic game 2D đa nền tảng trong web app hiện đại.

## 1. Kiến Trúc Cốt Lõi (Architecture)
- **Entity-Component Model**:
  - `Entity`: Thực thể trong thế giới game (Pet, Player, Cây trồng, NPC, Vật phẩm rơi).
  - `Component`: Dữ liệu độc lập gán cho Entity (`Position`, `Velocity`, `SpriteRenderer`, `Health`, `CombatStats`, `Inventory`).
  - `System / Manager`: Logic xử lý tập trung (`MovementSystem`, `AnimationSystem`, `CombatSystem`, `FarmingSystem`).
- **Finite State Machine (FSM)** cho Thú cưng & Nhân vật:
  - `IDLE`: Đứng yên, chớp mắt, đu đưa nhẹ nhàng.
  - `WALK / ROAM`: Di chuyển tự do theo bán kính xung quanh nông trại hoặc đi theo chủ nhân.
  - `FEED / EAT`: Hoạt ảnh ăn uống, hiển thị icon trái tim / thức ăn nổi lên.
  - `WORK / FARM`: Tham gia tưới cây, thu hoạch, cày xới đất.
  - `BATTLE_IDLE / CAST_SKILL / HURT / FAINT`: Các trạng thái trong đấu trường PvP.

## 2. Quản Lý Vòng Đời Trò Chơi (Game Lifecycle)
- `Init`: Tải cấu hình map, chỉ số pet, khởi tạo hệ tọa độ thế giới.
- `Preload`: Nạp trước spritesheet, âm thanh hiệu ứng (Web Audio API), dữ liệu tileset.
- `Update(deltaTime)`: Tính toán vật lý, di chuyển, cooldown kỹ năng, kiểm tra va chạm.
- `Render`: Vẽ các layer theo thứ tự z-index (đất -> cây -> bóng -> nhân vật -> tán cây -> UI HUD).
- `SaveState`: Lưu trữ tiến độ người chơi (Coins, EXP, Cây trồng, Pet stats) tức thời vào SQLite & S3.

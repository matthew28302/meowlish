---
name: godot-scripting-expert
description: Chuyên gia kiến trúc cây phân cấp Node, cơ chế Signals/Slots, Viewport scaling và quản lý Scene trong phát triển game 2D chuẩn mực.
---

# Godot Scripting Expert Skill

Skill này cung cấp các mô thức thiết kế hướng đối tượng và kiến trúc cây phân cấp từ engine Godot áp dụng vào game 2D web:

## 1. Cấu Trúc Cây Phân Cấp (Scene Tree Pattern)
- Mọi màn chơi và đối tượng đều là một Scene độc lập có thể tái sử dụng:
  - `WorldScene`: Quản lý Map, Camera, Lighting, Spawner.
  - `FarmPlotScene`: Quản lý từng ô đất trồng trọt, chu kỳ hạt mầm -> trổ hoa -> thu hoạch.
  - `PetActorScene`: Chứa Sprite2D, AnimationPlayer, CollisionShape2D, AIController.
  - `BattleArenaScene`: Quản lý sàn đấu, thanh HP/Mana, lượt thi đấu theo vòng (Turn-based / Realtime).

## 2. Mô Thức Signals & Event Bus
- Tránh việc các component gọi trực tiếp lẫn nhau gây spaghetti code:
  - `pet_reached_target(pet_id, pos)` -> Kích hoạt animation nhặt vật phẩm.
  - `crop_harvested(plot_id, crop_type, exp_gain)` -> Cập nhật kho đồ và tiền tệ.
  - `skill_cast(attacker_id, target_id, skill_data)` -> Kích hoạt hiệu ứng hạt và trừ máu đối thủ.

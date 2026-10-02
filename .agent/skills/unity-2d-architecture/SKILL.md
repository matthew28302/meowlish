---
name: unity-2d-architecture
description: Kiến trúc 2D chuẩn Unity, ScriptableObjects cho dữ liệu Pet & Cây trồng, Sorting Layers, Object Pooling và xử lý va chạm 2D.
---

# Unity 2D Architecture Skill

Skill này quy định quy chuẩn kiến trúc lấy cảm hứng từ Unity 2D cho game nông trại & thú cưng web:

## 1. Dữ Liệu Tách Rời Dạng ScriptableObject (Data-Driven Design)
- Tất cả chỉ số, vật phẩm, giống cây trồng và kỹ năng Pet được định nghĩa bằng cấu trúc JSON tĩnh có schema chuẩn:
  - `PetDefinition`: `{ id, name, species, baseHp, baseAtk, baseSpeed, skills: [...] }`
  - `CropDefinition`: `{ id, name, seedPrice, harvestRewardCoins, harvestExp, growthStages: [...] }`
  - `SkillDefinition`: `{ id, name, manaCost, cooldown, power, element, animationKey, effectVfx }`

## 2. Sorting Layers & Z-Ordering
- Tránh lỗi hiển thị nhân vật đi xuyên qua cây cối hoặc bị đè sai lớp:
  - Layer 0: `Background / Ground / Water`
  - Layer 1: `Decorations / Paths / Fences`
  - Layer 2: `Crops / Farm Plots`
  - Layer 3: `Actors (Player & Pets)` - Xếp thứ tự z-index theo toạ độ `Y` (`y-sort`: đối tượng ở dưới màn hình sẽ hiển thị đè lên đối tượng ở trên).
  - Layer 4: `Tree Tops / Roofs / Foreground Occlusion`
  - Layer 5: `UI Canvas / Speech Bubbles / Battle HUD`

## 3. Object Pooling
- Tái sử dụng đối tượng hạt (particles, floating combat numbers `+150 Coins`, `-45 HP`) thay vì tạo/hủy DOM liên tục để chống rác bộ nhớ (Garbage Collection spikes).

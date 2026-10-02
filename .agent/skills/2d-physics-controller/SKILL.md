---
name: 2d-physics-controller
description: Bộ điều khiển vật lý 2D di chuyển 8 hướng mượt mà, quán tính ma sát, thuật toán tìm đường A* (Pathfinding) cho Pet theo chân người chơi và ranh giới bản đồ.
---

# 2D Physics Controller Skill

Skill này cung cấp các giải thuật vật lý chuyển động và AI định tuyến cho nhân vật & thú cưng trong thế giới 2D:

## 1. Bộ Điều Khiển Di Chuyển Mượt Mà (Smooth 8-Way Kinematics)
- Hỗ trợ cả bàn phím (WASD / Mũi tên), Joystick ảo trên Mobile và Click-to-move (chạm vào vị trí trên map để nhân vật/pet tự chạy đến).
- Gia tốc và ma sát:
  ```javascript
  // Vector di chuyển mượt
  currentVelocity.x = lerp(currentVelocity.x, targetVelocity.x, friction * dt);
  currentVelocity.y = lerp(currentVelocity.y, targetVelocity.y, friction * dt);
  position.x += currentVelocity.x * dt;
  position.y += currentVelocity.y * dt;
  ```

## 2. AI Thú Cưng Theo Chân (Pet Companion Following AI)
- Thú cưng không bám dính chặt mà di chuyển tự nhiên:
  - Nếu khoảng cách `dist(pet, player) > 120px`: Pet chạy theo (`RUN` state).
  - Nếu `dist(pet, player) < 50px`: Pet dừng lại, đứng cạnh hoặc đi dạo quanh (`IDLE / ROAM` state).
  - Định kỳ (mỗi 10-15s), Pet tự động lại gần một luống hoa hoặc cây trồng để hít hà, hoặc chào chủ nhân.

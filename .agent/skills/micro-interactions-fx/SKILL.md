---
name: micro-interactions-fx
description: Thư viện thiết kế hiệu ứng vi mô, âm thanh game tương tác Web Audio API, pháo hoa mừng thành tích canvas-confetti, streak ngọn lửa và hoạt ảnh chuyển động cuốn hút.
---

# Micro-Interactions & FX Skill

Skill này cung cấp các nguyên tắc và code mẫu để tạo hiệu ứng âm thanh, chuyển động sinh động, biến ứng dụng học tiếng Anh thành một trải nghiệm cuốn hút như chơi game.

## 1. Hệ Thống Âm Thanh Web Audio Synthesizer (Zero External Dependencies)
Không cần tải file mp3 nặng từ bên ngoài, tự sinh âm thanh chất lượng cao bằng Web Audio API:
- `playCorrectSound()`: Hợp âm trưởng 2 nốt ngân vang (C5 -> E5 -> G5) vui tươi khi chọn đúng hoặc phát âm chuẩn.
- `playIncorrectSound()`: Nốt trầm ngắn dịu dàng (không gây chói tai hay nản lòng).
- `playCelebrationSound()`: Fan-fare chiến thắng khi kết thúc bài học hoặc nhận streak mới.
- `playClickSound()`: Tiếng click đanh gọn mô phỏng phím bấm cơ học / nút đồ chơi.

## 2. Hiệu Ứng Thị Giác (Visual FX)
- **Canvas Confetti**: Bắn pháo hoa giấy đầy màu sắc khi hoàn thành 100% bài học hoặc vượt qua bài kiểm tra.
- **Streak Flame Glow**: Ngọn lửa streak rực cháy với hiệu ứng pulse nhịp nhàng, tăng kích thước theo số ngày duy trì liên tục.
- **3D Card Flip**: Lật thẻ Flashcard mượt mà với góc xoay 3D `rotateY(180deg)` và `perspective: 1000px`.
- **Karaoke Word Tracker**: Chữ phát sáng đổi màu xanh lá theo tiến độ audio hoặc giọng nói của học viên.

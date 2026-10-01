---
name: smart-translator
description: Tiêu chuẩn và kỹ thuật dịch thuật thông minh song ngữ Anh - Việt theo ngữ cảnh giao tiếp thực tế, văn phong tự nhiên, giải thích sắc thái nghĩa, collocations và lỗi chuyển ngữ thường gặp.
---

# Smart Translator Skill

Skill này quy định quy chuẩn dịch thuật thông minh, tự nhiên và bám sát ngữ cảnh cho hệ thống học tiếng Anh giao tiếp.

## 1. Nguyên Tắc Dịch Thuật Tự Nhiên (Natural & Contextual Translation)
- **Không dịch word-by-word (máy móc)**: Thay vì dịch từng từ đơn lẻ, luôn chuyển tải trọn vẹn ý đồ giao tiếp trong ngữ cảnh.
  - Ví dụ: *"I'm swamped with tasks today."* -> Dịch tự nhiên: *"Hôm nay mình ngập đầu trong công việc rồi."* (Thay vì dịch máy: *"Tôi bị đầm lầy với các nhiệm vụ hôm nay"*).
- **Phân biệt sắc thái (Tone & Nuance)**:
  - Phân rõ giữa văn phong trang trọng (Formal - dùng trong email khách hàng/phỏng vấn) và văn phong thân mật (Casual - dùng trong chat Slack/đồng nghiệp/daily life).
  - Gợi ý từ đồng nghĩa tương đương và mức độ phổ biến.

## 2. Trích Xuất Dữ Liệu Tra Từ Bôi Đen (Highlight Dictionary)
Mỗi từ/cụm từ khi người dùng bôi đen trên giao diện cần được cung cấp:
1. **Từ gốc (Base Form)** & Từ loại (`v`, `n`, `adj`, `adv`).
2. **Nghĩa tiếng Việt súc tích nhất trong câu đang đọc**.
3. **Phiên âm IPA chuẩn** kèm trọng âm.
4. **Cụm từ thường đi kèm (Collocation)**.
5. **Mẫu câu ví dụ song ngữ** tương tự để người học hiểu sâu.

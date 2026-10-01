---
name: xss-html-injection
description: Kiểm tra các điểm hiển thị dữ liệu người dùng ra giao diện (DOM-based, Stored, Reflected XSS) và đề xuất phương pháp escape, sanitize và ngăn chặn rò rỉ dữ liệu.
---

# Cross-Site Scripting (XSS) & HTML Injection Defense

Quy chuẩn phòng thủ chống chèn mã script độc hại vào trình duyệt người dùng:

## 1. Kiểm Soát Render Dữ Liệu Phía Client
- Tuyệt đối hạn chế tối đa sử dụng `dangerouslySetInnerHTML`. Nếu bắt buộc phải hiển thị HTML phong phú (Rich Text dịch thuật/ngữ pháp):
  - Dữ liệu phải được lọc qua hàm sanitize hoặc chỉ trích xuất từ điển nội bộ đáng tin cậy.
  - Loại bỏ hoàn toàn các thẻ nguy hiểm: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<link>`, các thuộc tính inline sự kiện `onload=`, `onerror=`, `onclick=`, `javascript:`.
- Dùng React JSX interpolation tiêu chuẩn `{data}` để React tự động thực hiện HTML Entity Encoding an toàn.

## 2. Làm Sạch Dữ Liệu Khi Tiếp Nhận Tại Backend (Sanitization)
- Đối với các trường do người dùng nhập (Tên hiển thị `display_name`, ghi chú từ vựng `note`, câu ngữ cảnh `contextSentence`, tên thú cưng `pet_name`):
  ```typescript
  const cleanInput = input.replace(/[<>]/g, '').trim().slice(0, 500);
  ```
- Ngăn chặn triệt để Stored XSS trước khi dữ liệu được ghi vào bảng SQLite.

## 3. Phòng Thủ Chiều Sâu Với HTTP Security Headers
- `X-XSS-Protection: 1; mode=block`: Bật bộ lọc XSS của trình duyệt.
- `Content-Security-Policy`: Định rõ nguồn tài nguyên script, style, media hợp lệ.

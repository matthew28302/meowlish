---
name: chrome-devtools-mcp
description: Kết hợp trình duyệt thực tế (Playwright / Chrome DevTools) để kiểm tra bảo mật phía client, tiêu đề HTTP (CSP, HSTS, CORS), cookie flags (HttpOnly, Secure) và xác minh UI responsive.
---

# Chrome DevTools & Browser Verification Guide

Quy chuẩn kiểm thử và xác minh thực tế trên môi trường trình duyệt:

## 1. Kiểm Tra Headers Mạng & Cookie Bảo Mật
- Sử dụng Playwright / Chrome DevTools để bắt các gói tin HTTP Request/Response:
  - Kiểm tra xem cookie phiên (`duahau_admin_session`, `meowlish_user_session`) có chứa đầy đủ cờ `HttpOnly`, `SameSite=Strict/Lax`, `Secure` hay không.
  - Kiểm tra các tiêu đề phản hồi: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.

## 2. Kiểm Tra Kiểm Soát Lỗi Console & Rò Rỉ Dữ Liệu
- Lắng nghe sự kiện `page.on('console', msg => ...)` và `page.on('pageerror', err => ...)` để đảm bảo:
  - Không có uncaught exceptions hoặc React hydration mismatches.
  - Không có thông tin nhạy cảm (như mật khẩu, token, private API keys, plain email) bị in ra console log phía client.

## 3. Xác Minh Giao Diện Responsive & Trải Nghiệm Mobile
- Kiểm tra hiển thị trên các viewport di động phổ biến (iPhone 12/14/15 390x844, Pixel 7 412x915, iPhone SE 375x667):
  - Thanh điều hướng đáy (Bottom Bar) không che mất nội dung học tập.
  - Nút bấm và vùng chạm (touch target) tối thiểu 44x44px.
  - Không xuất hiện hiện tượng tràn ngang màn hình (horizontal scrolling ngoài ý muốn).

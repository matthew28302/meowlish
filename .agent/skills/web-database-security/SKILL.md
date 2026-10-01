---
name: web-database-security
description: Tiêu chuẩn và quy trình bảo mật toàn diện cho Web App & Database (SQLite/S3). Bao gồm thiết lập HTTP Security Headers, phòng thủ Clickjacking/XSS, Rate Limiting chống Brute-force/DoS, mã hóa phiên AES-256-GCM, bảo toàn toàn vẹn cơ sở dữ liệu SQLite và kiểm soát phân quyền API.
---

# Web & Database Security Skill

Skill này quy định toàn bộ tiêu chuẩn bảo mật cho ứng dụng Meowlish, bảo vệ mã nguồn, các điểm cuối API, dữ liệu người dùng và hệ thống cơ sở dữ liệu SQLite & Filebase S3.

---

## 1. Phòng Thủ Tầng Mạng & HTTP Headers (Middleware Security)
Mọi phản hồi từ máy chủ tới trình duyệt phải được đính kèm các tiêu đề bảo mật chuẩn OWASP:
- **X-Frame-Options: SAMEORIGIN**: Ngăn chặn hoàn toàn tấn công Clickjacking (không cho phép nhúng website vào iframe của tên miền lạ).
- **X-Content-Type-Options: nosniff**: Chống tấn công MIME Sniffing, buộc trình duyệt tuân thủ MIME type khai báo.
- **Referrer-Policy: strict-origin-when-cross-origin**: Bảo vệ thông tin nhạy cảm trên URL khi chuyển hướng sang website khác.
- **Permissions-Policy**: Giới hạn quyền truy cập thiết bị (chỉ cấp Microphone cho tính năng luyện nói AI `microphone=(self)`, vô hiệu hóa camera/geolocation không cần thiết).
- **X-XSS-Protection: 1; mode=block**: Kích hoạt bộ lọc chống tấn công Reflected Cross-Site Scripting (XSS).

---

## 2. Kiểm Soát Tần Suất Truy Cập (Rate Limiting & Anti-Brute-Force)
Ngăn chặn kẻ xấu dùng bot dò quét mật khẩu, spam gửi email OTP hoặc gây nghẽn tài nguyên (Denial of Service - DoS):
- **Cổng Quản Trị (/api/admin/auth)**: Tối đa 5 yêu cầu gửi OTP / 10 phút trên mỗi địa chỉ IP. Nhập sai OTP quá 5 lần sẽ tự hủy phiên tức thì.
- **Cổng Người Dùng (/api/auth)**: Giới hạn tối đa 15 lần đăng nhập/đăng ký sai / 10 phút.
- **Đặt Lại Mật Khẩu (/api/auth/forgot-password)**: Giới hạn 5 lần yêu cầu / 15 phút, chống email-bombing.
- **Đồng Bộ Dữ Liệu (/api/sync)**: Tối đa 3 lần thao tác / 5 phút.

---

## 3. Phân Quyền & Bảo Vệ Điểm Cuối API (Access Control & Least Privilege)
- **Tách Biệt Tuyệt Đối**: Cổng quản trị `/duahau` và các API quản trị `/api/admin/*` chỉ cho phép truy cập khi có token mã hóa hợp lệ (`AES-256-GCM`).
- **Khóa Điểm Cuối Nhạy Cảm**: Các API như `/api/sync` (sao lưu/khôi phục database) bắt buộc phải kiểm tra quyền Admin hoặc Secret Key, không được mở công khai ra Internet.
- **Xử Lý Tài Khoản Bị Khóa (Disabled Accounts)**: Chặn ngay lập tức quyền tương tác tại các API lưu tiến độ (`/api/progress`), thú cưng (`/api/pet`), mua sắm (`/api/pet/shop`) và bookmark (`/api/bookmarks`).

---

## 4. An Toàn Cơ Sở Dữ Liệu SQLite & Sao Lưu S3
- **Chống SQL Injection**: 100% các câu lệnh truy vấn SQLite bắt buộc dùng Parameterized Queries (`?` placeholders). Tuyệt đối không nối chuỗi trực tiếp (`${}`) vào SQL query.
- **Cấu Hình PRAGMA Chuẩn Công Nghiệp**:
  - `journal_mode = WAL` (Write-Ahead Logging): Cho phép đọc ghi đồng thời tốc độ cao, chống crash dữ liệu.
  - `foreign_keys = ON`: Ràng buộc toàn vẹn dữ liệu quan hệ, xóa cascading an toàn.
  - `busy_timeout = 5000`: Chờ ghi tối đa 5000ms khi có transaction đồng thời, ngăn chặn lỗi `SQLITE_BUSY`.
  - `synchronous = NORMAL`: Đảm bảo an toàn ghi đĩa không bị hỏng file khi mất nguồn đột ngột.
- **Bảo Mật Sao Lưu Lên S3**: Dữ liệu SQLite tải lên Filebase S3 được lưu trữ an toàn, có thông tin checksum và kiểm soát quyền admin nghiêm ngặt.

---

## 5. Làm Sạch Dữ Liệu Đầu Vào (Input Sanitization & Output Encoding)
- Tên hiển thị (`display_name`), tên thú cưng (`pet_name`), ghi chú từ vựng (`note`) phải được làm sạch các thẻ HTML độc hại (`<script>`, `<iframe>`, `javascript:`, `onerror=`) trước khi ghi vào cơ sở dữ liệu.
- Mật khẩu người dùng được băm bằng thuật toán SHA-256 kết hợp mã muối (`salt`) ngẫu nhiên, không bao giờ lưu trữ mật khẩu dạng văn bản thô (plain text).

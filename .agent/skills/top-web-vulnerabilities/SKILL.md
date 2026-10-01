---
name: top-web-vulnerabilities
description: Tập trung kiểm tra và phòng chống các lỗ hổng theo chuẩn OWASP Top 10 (Injection, Broken Authentication, Sensitive Data Exposure, Security Misconfigurations, v.v.).
---

# OWASP Top Web Vulnerabilities Guidelines

Quy chuẩn phòng thủ các nguy cơ bảo mật web hàng đầu theo OWASP:

## A01: Broken Access Control (Lỗi Kiểm Soát Truy Cập)
- Không để lộ các API backend không có xác thực cho những tác vụ nhạy cảm như backup CSDL, xem toàn bộ người dùng, hoặc thay đổi quyền hạn.
- Đảm bảo các route quản trị chỉ truy cập được từ IP hoặc token được ủy quyền.

## A02: Cryptographic Failures (Lỗi Mật Mã)
- Không bao giờ lưu trữ mật khẩu ở dạng plain text; bắt buộc dùng hàm băm an toàn kèm muối (salt).
- Token xác thực và dữ liệu nhạy cảm truyền qua mạng phải được mã hóa (AES-256-GCM / SHA-256).
- Ẩn/làm mờ thông tin email và thông tin cá nhân trên màn hình công khai (`maskEmail`).

## A03: Injection (Tiêm Mã Độc)
- Chống SQL Injection bằng cách 100% sử dụng parameterized queries.
- Chống Command Injection: Không truyền chuỗi đầu vào của người dùng trực tiếp vào `eval()` hoặc shell execution.

## A04: Insecure Design & Logic Flaws
- Thiết kế giới hạn số lần thử đăng nhập và kiểm tra OTP.
- Xử lý cô lập trạng thái: Người dùng bị khóa không được phép tiếp tục truy cập dữ liệu đã lưu.

## A05: Security Misconfiguration (Cấu Hình Sai Lầm)
- Bật đầy đủ các HTTP Security Headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Permissions-Policy`, `X-XSS-Protection`).
- Tắt hiển thị stack traces lỗi chi tiết ra phía người dùng ngoài môi trường production.

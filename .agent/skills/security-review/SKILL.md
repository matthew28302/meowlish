---
name: security-review
description: Chuyên gia rà soát tổng thể mã nguồn, phát hiện lỗi phân quyền (IDOR), lỗ hổng xác thực, quản lý phiên và logic flaws trong ứng dụng Web Fullstack.
---

# Security Review & Code Audit Standards

Quy chuẩn và phương pháp rà soát an ninh mã nguồn ứng dụng web:

## 1. Kiểm Soát Phân Quyền & Chống IDOR (Insecure Direct Object References)
- **Xác thực chủ sở hữu**: Khi người dùng thao tác tài nguyên (tiến độ học tập, thú cưng, bookmarks), API phải đối chiếu `userId` từ phiên xác thực an toàn (Cookie/Token) thay vì tin tưởng mù quáng `userId` truyền lên từ body hoặc query string.
- **Tách biệt quyền hạn**: Ngăn cách nghiêm ngặt giữa tài khoản người dùng (`role: 'user'`) và Quản trị viên (`role: 'admin'`). Cổng `/duahau` và API `/api/admin/*` bắt buộc có kiểm tra chữ ký mã hóa token AES-256-GCM.

## 2. Rà Soát Lỗ Hổng Xác Thực (Authentication & Session Flaws)
- Kiểm tra các endpoint xác thực mật khẩu, OTP email, đổi mật khẩu và đặt lại mật khẩu.
- Chống brute-force: Tất cả các luồng đăng nhập, gửi mã OTP, đổi mật khẩu bắt buộc phải áp dụng Rate Limiting theo địa chỉ IP / User ID.
- Quản lý phiên: Phiên làm việc phải lưu trong Cookie với cờ `HttpOnly`, `SameSite` và `Secure`. Khi đăng xuất hoặc tài khoản bị khóa, phiên phải bị hủy bỏ ngay lập tức.

## 3. Rà Soát Logic Nghiệp Vụ (Business Logic Flaws)
- Kiểm tra các lỗ hổng gian lận điểm kinh nghiệm (EXP), số tiền Coins, mua sắm vật phẩm ảo (race condition, negative coin purchase, duplicate claims).
- Kiểm tra tính toàn vẹn trạng thái tài khoản: Khi tài khoản bị vô hiệu hóa (`status: 'disabled'`), toàn bộ quyền đọc/ghi đều bị phong tỏa tức thì.

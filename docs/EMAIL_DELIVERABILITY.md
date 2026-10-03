# Tài liệu khả năng giao email (Email Deliverability) — Meowlish

> Tài liệu dành cho chủ sở hữu hệ thống. Mục tiêu: email transactional của Meowlish
> (OTP, đặt lại mật khẩu, hỗ trợ) vào **Hộp thư đến**, không bị gắn nhãn Spam.

## 1. Vì sao template cũ bị coi là "spam / AI-generated"?

Các email trước đây (đã được thay thế bằng `src/lib/emailTemplates.ts`) mang hầu hết
các dấu hiệu mà bộ lọc spam (SpamAssassin, Gmail, Outlook) chấm điểm cao:

| Dấu hiệu | Template cũ | Template mới |
|---|---|---|
| Subject in HOA + emoji + ngoặc vuông + mã OTP lộ trong subject | `🐱 [MÃ XÁC THỰC 2FA ĐĂNG NHẬP] 123456 - ...` | `Mã xác thực đăng nhập` (thường thường, không emoji) |
| Gradient nhiều màu, viền nét đứt, bo góc 20px, box-shadow | Có | Không — table phẳng, 1 màu emerald |
| Emoji trong subject và body (🐱🍉🛡️💌⏳⚠️) | Rất nhiều | Không có |
| Dấu chấm than / chữ HOA toàn câu trong body | Nhiều | Không |
| Bản plain-text (`text`) song song HTML | Không có | Có sẵn cho mọi email |
| Nội dung marketing trong email transactional (mẹo nhận Coins, thú cưng) | Có (email support) | Không |
| Link tới domain chết (`meowlish.imfishball.id.vn` — NXDOMAIN) | Có | Sửa hết về `APP_URL` |
| Toàn bộ HTML inline trong code, không có template dùng chung | 5 chỗ khác nhau | 1 module `src/lib/emailTemplates.ts` |

Ngoài nội dung, **lý do kỹ thuật phổ biến nhất vẫn là thiếu DKIM/DMARC** — xem phần 3.

## 2. Domain đang dùng

- Domain gửi: `imfishball.id.vn` (SMTP: `admin@imfishball.id.vn`, host `mail93142.maychuemail.com`).
- Domain hiển thị trong link: `www.meowlish.io.vn` (đặt qua env `APP_URL`).
- Env liên quan (không commit secret vào doc): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASS`, `APP_URL`, `CONTACT_EMAIL`, `BRAND_ADDRESS`.

## 3. Bản ghi DNS cần cấu hình (owner phải làm)

Kiểm tra thực tế ngày 04/10/2026:

| Record | Trạng thái hiện tại | Việc cần làm |
|---|---|---|
| SPF (`TXT imfishball.id.vn`) | ✅ Có: `v=spf1 a mx ip4:112.213.93.142 include:spf.maychuemail.com -all` | Giữ nguyên. Nếu đổi IP máy chủ hoặc đổi nhà cung cấp mail thì cập nhật `ip4:` / `include:`. |
| DKIM (`TXT <selector>._domainkey.imfishball.id.vn`) | ❌ Không tìm thấy (đã thử các selector phổ biến: default, mail, sel1, sel2, google, k1) | **Yêu cầu nhà cung cấp SMTP (maychuemail.com) bật DKIM** và thêm record TXT họ cấp. Đây là bước quan trọng nhất. |
| DMARC (`TXT _dmarc.imfishball.id.vn`) | ❌ Chưa có | Thêm record (bắt đầu ở chế độ quan sát): |

```
_dmarc.imfishball.id.vn.  TXT  "v=DMARC1; p=none; rua=mailto:postmaster@imfishball.id.vn; pct=100; adkim=r; aspf=r"
```

Quy trình:

1. **Bật DKIM** ở bảng điều khiển mail của `imfishball.id.vn` → lấy record
   `xxx._domainkey` → thêm vào DNS → xác minh.
2. **Thêm DMARC** ở chế độ `p=none` trong 1–2 tuần, xem báo cáo (`rua`).
3. Sau khi báo cáo sạch (không có phàn nàn), nâng dần:
   `p=quarantine; pct=25` → `p=reject`.
4. Nếu dùng thêm nền tảng gửi mail khác (Google Workspace, SendGrid…), thêm
   `include:` tương ứng vào SPF — **chỉ được có tối đa 1 record SPF** (SPF bị trùng
   hoặc nhiều record = fail).
5. Kiểm tra định kỳ:
   - https://mxtoolbox.com/spf.aspx
   - https://dmarcian.com/ (hoặc `dig TXT _dmarc.imfishball.id.vn`)
   - Gửi email thật tới Gmail/Yahoo/Outlook rồi xem **Authentication-Results**
     (SPF=pass, DKIM=pass, DMARC=pass).

Lưu ý thêm:

- **IP gửi phải khớp SPF.** Record SPF hiện giới hạn `ip4:112.213.93.142` — nếu SMTP
  gửi từ IP khác, SPF sẽ fail dù template đẹp đến đâu.
- **Reverse DNS (PTR)** cho IP gửi nên trỏ về `imfishball.id.vn` (hỏi nhà cung cấp VPS).
- Danh sách đen: kiểm tra https://mxtoolbox.com/blacklists.aspx.
- Rate limit/kỷ luật gửi: email transactional gửi theo sự kiện, không gửi hàng loạt —
  code hiện tại đã đúng (1 email/khóa OTP).
- **Không bao giờ** đặt subject HOA toàn bộ, không nhồi keyword "MIỄN PHÍ!!!",
  không đặt nhiều link lạ — template mới đã tuân thủ.

## 4. Quy ước template (dựng trong `src/lib/emailTemplates.ts`)

- Khung table-based 600px, **chỉ inline style**, không CSS ngoài, không flexbox/gradient.
- Header emerald `#047857` chữ "Meowlish" + tagline; body chữ `#334155`;
  **một** vùng nhấn: ô mã OTP monospace nền `#ecfdf5` (hoặc 1 nút CTA `#059669`).
- Footer: dòng thương hiệu, năm, email liên hệ, địa chỉ (env `BRAND_ADDRESS`),
  và câu "Bạn nhận được email này vì đã …" — không marketing, không emoji.
- Mọi email đều có `text` plain-text kèm `html`.
- Headers khi gửi: `from: "Meowlish" <SMTP_USER>`, `replyTo` hộp thư hỗ trợ.
- Toàn bộ dữ liệu do người dùng nhập (tên, tiêu đề, nội dung) đều qua `escapeHtml`.

## 5. Env cần đặt (tùy chọn, có fallback)

| Env | Fallback | Ý nghĩa |
|---|---|---|
| `APP_URL` | `https://www.meowlish.io.vn` | Gốc link trong email |
| `CONTACT_EMAIL` | `SMTP_USER` hoặc `admin@imfishball.id.vn` | Hộp thư phản hồi / liên hệ ở footer |
| `BRAND_ADDRESS` | `TP. Hồ Chí Minh, Việt Nam` | Địa chỉ vật lý ở footer (bắt buộc theo luật chống spam nhiều quốc gia) |

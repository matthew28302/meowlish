---
name: sqlite-s3-sync
description: Quy tắc bất biến cho lớp đồng bộ SQLite <-> Filebase S3 của Meowlish (DB là MỘT tệp 66MB bị nhiều instance Vercel ghi đè). Dùng khi sửa/xét bất kỳ đường ghi nào vào DB, khi debug "tài khoản biến mất / báo sai mật khẩu / mất tiến độ", khi gộp hoặc khôi phục dữ liệu, và khi quyết định có nên giữ SQLite hay chuyển sang Postgres.
---

# Meowlish: đồng bộ SQLite qua Filebase S3 — bất biến & quy tắc

## 1. Kiến trúc thật (đọc trước khi sửa gì)

- DB là **một tệp SQLite ~66MB** trên Filebase S3 (`english_learning.db`), KHÔNG phải server DB.
- Trên Vercel, **mỗi instance giữ bản riêng trong `/tmp/data/`**. Cold start mới tải về (qua `scripts/restore-s3.js`).
- Mỗi lần DB đổi, instance **đẩy NGUYÊN TỆP 66MB** lên (`src/lib/s3Sync.ts`).
- Nhiều instance chạy song song ⇒ **last-writer-wins trên cả tệp**. Đây là nguồn gốc của mọi triệu chứng "dữ liệu bốc hơi".
- Auto-sync **chỉ bật trên Vercel** (`DB_SYNC_AUTO` / `VERCEL=1`). Máy dev không tự đẩy — trừ khi chủ động `DB_SYNC_AUTO=1`.

### Tỉ lệ dữ liệu (đo 2026-10-06)
| Nhóm | Bảng | Số dòng |
|---|---|---|
| **Người dùng (ghi nhiều, dễ đụng độ)** | users, user_pets, pet_inventory, bookmarks, progress, test_results, coin_transactions, user_otp_sessions… | **~163** |
| **Nội dung tĩnh (đọc nhiều, không đổi)** | dictionary_entries 26 416, dictionary_cache 26 932, dictionary_fts* 53k, ai_translation_cache | **~107 000** |

⇒ 66MB là dữ liệu tĩnh. Chỉ ~163 dòng mới thật sự cần transaction. Đây là lý do nên tách: nội dung tĩnh để nguyên trong SQLite đọc-only, dữ liệu người dùng chuyển sang Postgres miễn phí.

## 2. Quy tắc bất di bất dịch

1. **Không bao giờ ghi đè có điều kiện bằng force.** Upload chỉ đi khi `baseVersion === ETag` của remote (CAS `If-Match`).
2. **Khi xung đột, remote thắng, bản cục bộ bị vứt** (`forkRejoin` → lưu vào `english_learning.conflict.db`, tải remote đè lên). Dữ liệu thua **không tự gộp lại**.
3. **Hệ quả bắt buộc:** mọi ghi mà mất đi là "sai mật khẩu"/"mất tài khoản" với người dùng. Ghi quan trọng **phải** đi qua `persistCriticalWrite(label, apply, verify)` — ghi → đẩy → đọc lại → ghi lại nếu mất (tối đa 3 lần), và **báo lỗi thật** thay vì trả về thành công giả.
4. **Thêm đường ghi mới vào `users`** (đăng ký, đổi mật khẩu, cấp/thu hồi vật phẩm, xoá) ⇒ bắt buộc bọc `persistCriticalWrite` với `verify` đọc lại đúng trường vừa ghi. `apply` phải **idempotent** (`INSERT OR IGNORE`, `UPDATE ... WHERE`).
5. **`apply` phải chạy trước mỗi lần đẩy** — không chỉ một lần ở đầu hàm.
6. **Boot/migration không được làm bẩn DB.** `UPDATE`/`DELETE` rỗng vẫn đổi WAL ⇒ mỗi cold start lại upload 66MB. Luôn kiểm tra `COUNT(*)`/`verifyPassword` trước khi ghi. (Đã sửa cho admin row và `ai_translation_cache`.)
7. **`overflow-x-hidden` trên page root ⇒ `overflow-y` thành `auto`** (spec CSS). Nếu root còn `.custom-scrollbar` (`overscroll-behavior-y: contain`) thì scroll bị nuốt. Dùng `overflow-x-clip`.
8. **`hashPassword` nay là scrypt + salt ngẫu nhiên** ⇒ không bao giờ so sánh hash bằng `!==`/`=`. Dùng `verifyPassword()` (chấp nhận cả hash cũ SHA-256 theo salt hiện hành lẫn salt fallback).
9. **`AUTH_SALT` phải giống nhau ở local và Vercel**, nếu không sẽ hỏng đăng nhập (đã xảy ra; `verifyPassword` chỉ chữa được triệu chứng, không chữa được nguyên nhân).
10. **Không hardcode secret** trong `src/` hay `scripts/`. Đọc từ env. Bucket Filebase là private — kiểm tra bằng GET không token (phải 403).

## 3. Chẩn đoán nhanh

```powershell
# DB nào đang là chuẩn, và tài khoản nào bị mất
node scripts\merge-conflict-users.mjs          # báo cáo, KHÔNG ghi
node scripts\merge-conflict-users.mjs --apply  # gộp (tự backup trước)
```
- Log Vercel chứa các dòng then chốt: `[SQLite DB] AUTH_SALT ... fingerprint`, `[SQLite DB] Mật khẩu: N/M tài khoản còn hash SHA-256 cũ`, `[S3 Sync] XUNG ĐỘT ...`, `[S3 Persist] "..." không còn trong dữ liệu chuẩn`.
- **Bản `.conflict.db` bị ghi đè mỗi lần có xung đột** ⇒ cứu dữ liệu càng sớm càng tốt; nếu cần giữ lâu hơn thì sao chép key đó ra tên có timestamp.
- `english_learning.premerge-*.db` là backup trước mỗi lần gộp.

## 4. Khi chuyển sang Postgres (Supabase/Neon) — đã chốt hướng

Chỉ chuyển **11 bảng dữ liệu người dùng** (~163 dòng), **giữ nguyên SQLite cho nội dung tĩnh** (đọc-only, không ghi ⇒ không còn tranh chấp). Không chuyển `dictionary_*`/`dictionary_fts*` sang Postgres: mỗi lần load trang sẽ là truy vấn mạng và tốn egress.
- Adapter: 1 module duy nhất thay `src/lib/db.ts`; 284 lệnh `db.prepare` nằm trong 20 file — chỉ 20 file chạm DB (xem `git grep -l db.prepare -- src`).
- Sau khi tách: **xoá hẳn lớp S3 sync** và mọi `syncDbToS3Now()`; nếu thấy file sync còn được gọi ở đâu đó thì migration chưa xong.
- Bắt buộc: chạy `tests/e2e` trước khi deploy, và chuyển dữ liệu bằng script có đếm dòng khớp (`scripts/`).

## 5. Danh sách việc đang mở (cập nhật khi làm xong)

- [ ] Xoay khoá Filebase (đã lộ trong git history) + cập nhật Vercel env + `.env.local`
- [ ] Xoá object `.env.local` trong bucket
- [ ] Đặt `AUTH_SALT` giống nhau ở local và Vercel
- [ ] Xoá tài khoản test `zzkiemthudb1006`
- [ ] Tạo project Postgres miễn phí, nạp 11 bảng người dùng, chuyển adapter
- [ ] Đổi `.conflict.db` sang key có timestamp để không mất bản cứu được

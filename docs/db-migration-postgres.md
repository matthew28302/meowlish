# Kế hoạch: chuyển dữ liệu người dùng sang Postgres miễn phí (Supabase)

> Quyết định đã chốt: **Supabase Free** cho dữ liệu người dùng + **giữ SQLite chỉ cho nội dung tĩnh**.
> Tài liệu này là kế hoạch thực thi. Bối cảnh sự cố nằm ở `docs/db-sync.md`.

## 1. Vì sao phải chuyển (đo được, không phải cảm nhận)

Đo trên bản DB production (66.3 MB, 29 bảng):

| Nhóm | Dung lượng | Ghi/đọc | Rủi ro |
|---|---|---|---|
| **Người dùng** (users, user_pets, pet_inventory, bookmarks, progress, coin_transactions, otp, logs…) | **0.1 MB / 163 dòng** | Ghi liên tục | **Cao** — mất là mất tài khoản |
| **Nội dung tĩnh** (dictionary_entries 37.9MB + dictionary_cache 24.6MB + FTS 1.4MB) | **63.9 MB** | Chỉ đọc | Không |

Kiến trúc hiện tại: **một tệp SQLite 66MB** trên Filebase S3, mỗi instance Vercel giữ bản riêng và **đẩy nguyên tệp** khi có thay đổi. Hai instance ghi cùng lúc ⇒ bản thua bị vứt (`forkRejoin`). Đã xảy ra thật: user `kangyoungha` (tạo 14:51) bị xoá khỏi hệ thống, chỉ còn trong `english_learning.conflict.db`.

Vấn đề **không nằm ở dung lượng** mà ở việc *ghi cả tệp*. 0.1 MB dữ liệu người dùng không cần SQLite trên S3 — nó cần một DB có transaction thật.

## 2. So sánh lựa chọn miễn phí (số liệu lấy từ trang giá chính thức 2026-10)

| | **Supabase Free** | Neon Free | Filebase + SQLite (hiện tại) |
|---|---|---|---|
| Dung lượng DB | 500 MB / project | 1 GB / project | 66 MB (tự quản lý) |
| Egress | 5 GB/tháng | 5 GB/project | Không giới hạn (trả phí theo lưu lượng Filebase) |
| Ngừng hoạt động | **Tạm dừng sau 1 tuần không hoạt động** | Tự scale-to-zero sau 5 phút, **thức dậy ~0.5–2s** | Không |
| Số project | 2 | 100 | — |
| Backup tự động | Không (Free) | Không (Free) | Tự quản lý |
| Bảng điều khiển / SQL editor | **Có** | Có | Không |
| Nguy cơ mất dữ liệu | DB thật, transaction chuẩn | DB thật, transaction chuẩn | **Ghi đè cả tệp — đã mất tài khoản thật** |

**Chọn Supabase Free** vì:
1. Bạn đã có tài khoản (đăng nhập bằng GitHub) → không phải đăng ký thêm.
2. Có SQL editor + Table editor để **tự kiểm tra/sửa dữ liệu bằng mắt** — rất quan trọng sau những sự cố kiểu này, không phải đợi tôi.
3. 500 MB dư sức chứa 0.1 MB dữ liệu người dùng (gấp 5000 lần).
4. Miễn phí vĩnh viễn, không cần thẻ tín dụng.

**Xử lý rủi ro "tạm dừng sau 1 tuần":** thêm Vercel Cron (Hobby cho phép cron chạy 1 lần/ngày) gọi `/api/health` mỗi ngày. Dự án không bao giờ 7 ngày không hoạt động ⇒ không bị tạm dừng. Nếu vẫn bị pause, lần truy cập đầu tiên sẽ tự đánh thức (chậm vài giây) — chấp nhận được với website học tập.

> Neon chỉ tốt hơn ở chỗ không bao giờ pause; nhưng phải đăng ký tài khoản mới và mất SQL editor quen thuộc. Nếu sau này site có downtime do pause thì chuyển sang Neon chỉ cần đổi chuỗi kết nối.

## 3. Kiến trúc sau khi chuyển

```
┌─ Nội dung tĩnh (63.9MB) ───────────────┐   ┌─ Dữ liệu người dùng (0.1MB) ──────┐
│ SQLite read-only, đóng gói cùng app    │   │ Supabase Postgres (transaction thật) │
│ dictionary_entries + FTS               │   │ users, coins, progress, pet...      │
│ KHÔNG ghi ⇒ không có xung đột          │   │ 14 bảng, có index + FK              │
└────────────────────────────────────────┘   └─────────────────────────────────────┘
                    └──── không còn tệp 66MB trên S3, không còn cold-start tải 66MB ────┘
```

Hai lợi ích ngoài dự kiến:
- **Bỏ được 66MB tải về mỗi cold start** (nhanh hơn và giảm băng thông Filebase).
- **Xoá hẳn lớp đồng bộ S3** → xoá nguyên nhân gốc, không phải vá triệu chứng.

## 4. Phạm vi công việc

Chuyển **20 bảng dữ liệu người dùng** (428 dòng tại thời điểm nạp). **Không** chuyển `dictionary_*`, `ai_translation_cache` (giữ nguyên SQLite read-only).

### Đã xong

- [x] Project Supabase đã tạo, region `ap-southeast-1` (Singapore).
- [x] `scripts/pg/00-download-prod-db.mjs` — tải DB chuẩn từ Filebase. **Bắt buộc dùng bản production**: schema máy dev đã cũ hơn và chỉ có 6 user.
- [x] `scripts/pg/01-create-schema.mjs` — sinh DDL từ schema SQLite, tạo 20 bảng + index, **bật RLS không policy** ⇒ Data API của Supabase bị từ chối mọi truy cập; app kết nối bằng role `postgres` (chủ bảng) nên vẫn chạy.
- [x] `scripts/pg/02-import-user-data.mjs` — nạp theo từng transaction + `ON CONFLICT DO NOTHING`.
- [x] `scripts/pg/03-verify.mjs` — so **từng giá trị** (chu ký SHA-256 toàn bộ dòng), không chỉ đếm số dòng.
- [x] `src/lib/pg.ts` — adapter `prepare().get/all/run` + `transaction()`; 6 unit test cho bộ dịch `?` → `$n`.
- [x] `scripts/pg/04-smoke-adapter.ts` — chạy thật trên Supabase: **9/9 PASS**.

**Kết quả đối chiếu: 20/20 bảng khớp hoàn toàn từng giá trị.**

### Ba bẫy đã dính — đã ghi vào code, đừng lặp lại

1. **`types: { bigint: ... }` bị BỎ QUA âm thầm.** postgres.js đặt tên type là `BigInt` (hoa ký tự đầu, OID 20). Mặc định int8 trả về **chuỗi**, khiến `session.expires_at > Date.now()` cho kết quả sai. Đã dính lỗi này; chỉ phát hiện được nhờ script đối chiếu **giá trị** — đếm dòng thì vẫn 100% khớp.
2. **Cột khai báo INTEGER trong SQLite có thể chứa số vượt int4.** `expires_at` lưu epoch-millis ~1.79e12 > 2 147 483 647 ⇒ Postgres từ chối. Bộ sinh schema quét `MAX(ABS(col))` và chọn `bigint` cho đúng cột đó.
3. **`information_schema` phải lọc `table_schema = 'public'`.** Supabase có sẵn `auth.users` (52 cột) — không lọc thì tưởng schema lệch.

### Còn lại

- Chuyển 16 file / 261 call site sang `await` + `pgDb`, theo nhóm, chạy test sau mỗi nhóm. File nặng nhất `src/app/api/pet/route.ts` (129 lệnh).
- Xoá `syncDbToS3Now` / `persistCriticalWrite` / `refreshIfRemoteNewer` / `scripts/restore-s3.js` / `scripts/upload-s3.js`.
- Sinh `data/content.db` chỉ gồm bảng nội dung → bỏ tải 66MB mỗi cold start.
- Cron `/api/health` hằng ngày + `pg_dump` hằng tuần (Free không có backup tự động).

## 5. Cần gì để bắt đầu

1. Tạo project trên <https://supabase.com/dashboard> (New project → chọn region gần nhất: **Singapore**).
2. Bấm **Connect** → lấy **hai** chuỗi:

   | Biến | Type trong hộp thoại | Port | Dùng để |
   |---|---|---|---|
   | `DATABASE_URL` | **Transaction pooler** | **6543** | ứng dụng trên Vercel |
   | `DATABASE_URL_SESSION` | **Session pooler** | 5432 | `pg_dump` (backup) — transaction mode không chạy được `pg_dump` |

   - **Username của pooler phải có hậu tố project ref**: `postgres.[PROJECT-REF]` (direct connection thì mới chỉ là `postgres`).
   - **Host phải copy nguyên văn** từ hộp thoại: dạng `aws-[INDEX]-[REGION].pooler.supabase.com`. `[INDEX]` là chỉ số cluster, **không suy ra được từ region**.
   - **Không cần bật IPv4 cho transaction pooler**: shared pooler là **IPv4-only trên mọi gói** (session lẫn transaction). Chỉ *direct connection* mới là IPv6 trên gói Free — và bật add-on IPv4 là **đổi AAAA → A, không dual-stack**, nên chỉ bật nếu thật sự cần direct connection.
3. Đặt cả hai vào Vercel: Settings → Environment Variables → Production + Preview.
4. Cho phép thêm dependency `postgres` vào `package.json`.
5. Tôi sẽ chạy nạp dữ liệu và báo cáo đối chiếu số dòng.

> Mật khẩu trong chuỗi phải **percent-encode** nếu có ký tự đặc biệt (`& # ? @ : /` space…).

## 6. Tiêu chí hoàn thành

- [ ] Số dòng 14 bảng người dùng khớp 100% giữa SQLite và Postgres
- [ ] Đăng ký → đăng nhập → coins/progress trên production, không còn `english_learning.conflict.db`
- [ ] Không còn lời gọi `syncDbToS3Now`/`persistCriticalWrite` trong `src/`
- [ ] `npx tsc --noEmit` sạch + 56 unit test + 3 e2e xanh
- [ ] Có backup Postgres tay: cron hằng tuần `pg_dump` → Filebase (Free không có backup tự động)

## 7. Rủi ro đã biết

| Rủi ro | Giảm thiểu |
|---|---|
| Free plan tạm dừng sau 1 tuần im lặng | Vercel Cron `/api/health` mỗi ngày |
| Không có backup tự động | Cron `pg_dump` hằng tuần lên Filebase |
| 284 lệnh SQL viết theo dialect SQLite | Giữ API `prepare().get/all/run`; chuyển dần, không viết lại |
| Postgres không có sẵn khi demo/offline | Giữ SQLite read-only + fallback cho route đọc |

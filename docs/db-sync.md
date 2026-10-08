# Đồng bộ SQLite ⇄ Filebase S3 — quy tắc và chẩn đoán

Tài liệu này mô tả CÁCH ĐỒNG BỘ DB (SQLite trên Vercel + Filebase S3) được
bảo vệ khỏi hiện tượng "dữ liệu tự nhiên bị rollback / mất tài khoản" trên
https://www.meowlish.io.vn, và cách chẩn đoán khi sự cố tái diễn.

## 1. Nguyên nhân gốc đã tìm thấy & cách sửa

| # | Nguyên nhân gốc | Bằng chứng (trước khi sửa) | Cách sửa |
|---|---|---|---|
| 1 | **Cold-start restore ép ghi đè** bản remote cũ lên DB cục bộ đang mới hơn | `src/instrumentation.ts` gọi `downloadDbFromS3(true)` → nhánh `force=true` bỏ qua toàn bộ so sánh thời gian trong `src/lib/s3Sync.ts` | Bỏ tham số `force`; `downloadDbFromS3()` giờ so sánh `ETag/LastModified` + `sync_state.json` + mtime cục bộ; chỉ thay khi an toàn |
| 2 | **`restore-s3.js` không so sánh thời gian** và ghi đè không atomic, không xóa `-wal/-shm` cũ | `scripts/restore-s3.js` (bản cũ): chỉ cần `localSize < 1MB` là tải về, `writeFileSync` thẳng lên DB, giữ WAL cũ → SQLite replay WAL của bản cũ | So sánh `LastModified` trước khi tải; ghi `.tmp` rồi `rename`; xóa `-wal/-shm` trước khi thay |
| 3 | **Upload không điều kiện (last-writer-wins)** giữa nhiều instance Vercel | `PutObject` không có `If-Match`, không có khái niệm "bản gốc" | Mỗi instance ghi `sync_state.json` (`baseVersion` = ETag); upload dùng conditional write `If-Match`; 412 → phân xử xung đột |
| 4 | **Máy dev auto-upload DB dev đè backup production** | `startAutoSync()` không phân biệt môi trường; `.env.local` có đầy đủ FILEBASE creds → dev server cũng upload (kèm `AUTH_SALT` fallback khác production) | Auto-sync **mặc định chỉ bật trên Vercel** (`DB_SYNC_AUTO=1` để bật, `=0` để tắt); dev dùng `scripts/sync-to-filebase.mjs` hoặc `POST /api/sync` |
| 5 | **Mỗi lần boot đều ghi vào DB** → luôn bị coi là "có thay đổi" → upload vô ích, tăng xung đột | `db.ts`: `UPDATE users SET password_hash=... WHERE username='admin'` chạy mọi lần mở DB | Thêm điều kiện `AND (password_hash <> ? OR ...)` → 0 dòng trùng → không ghi gì |
| 6 | **Lỗi sync bị nuốt** + cửa sổ debounce/quá hạn quá dài so với tuổi thọ instance serverless | `.catch(() => {})`; debounce 15s / min 60s / max 10 phút | Trên Vercel: debounce 5s / min 30s / max 2 phút / retry 10s; `syncDbToS3Now()` đăng ký vào `waitUntil` của Next/Vercel để không bị kill sau response; mọi thất bại đặt `retryRequested` để tick thử lại sớm |
| 7 | **`AUTH_SALT` không nhất thiết trùng nhau** giữa các instance/bản backup (không thể kiểm tra env Vercel từ repo) | `.env.local` không có `AUTH_SALT` → fallback; `db.ts` hash = `sha256(password + AUTH_SALT)` | Log **fingerprint** `sha256(AUTH_SALT)[0:12]` khi mở DB; lưu cùng fingerprint vào object metadata khi upload và vào bảng `sync_meta` của DB → mở backup là biết hash trong đó dùng salt nào |

## 2. Quy tắc thứ tự (ordering rules)

### Upload (`src/lib/s3Sync.ts → uploadDbToS3`)
1. `PRAGMA wal_checkpoint(TRUNCATE)` + tắt `wal_autocheckpoint` trong lúc stream
   (file chính không bị ghi giữa chừng → không upload "rách").
2. `HEAD` bản remote:
   - **Chưa có remote** → upload bình thường (không có gì để ghi đè).
   - **`baseVersion` (của sync_state.json) === ETag remote** → mình là hậu duệ →
     upload với `If-Match` (conditional write). 412/409 → `HEAD` lại, nếu remote
     thật sự đổi → coi là xung đột (mục 4).
   - **Chưa từng sync (`baseVersion` = null) + remote có dữ liệu thật + local chỉ
     có admin/demo seed** → **TỪ CHỐI upload** và tải remote về (chống "DB trống
     ghi đè backup thật").
   - **Xung đột** (không phải hậu duệ): bản cục bộ được lưu vào
     `english_learning.conflict.db` rồi tải bản remote về (rejoin). Không bên nào
     mất dữ liệu — bên thua nằm trong key sidecar.
   - **Máy dev push chủ động** (`POST /api/sync`, ngoài production): được phép
     ghi đè nhưng **LUÔN** lưu bản remote cũ vào `english_learning.superseded.db`
     trước; thất bại → huỷ push.
3. Thành công → ghi `sync_state.json` = ETag vừa upload + fingerprint của trạng
   thái đã stream.

### Download / restore (`downloadDbFromS3`, `scripts/restore-s3.js`)
1. Local trống/hỏng → tải (không có gì để mất).
2. Local là đúng bản remote hiện tại (`baseVersion === ETag`) → **giữ local**
   (phòng khi có ghi mới chưa kịp upload).
3. Local mất `sync_state.json` nhưng MD5 trùng remote → chỉ nhận lại `baseVersion`.
4. Remote khác bản của instance → remote thắng, nhưng nếu cục bộ có dữ liệu riêng
   thì **bắt buộc** lưu vào `english_learning.conflict.db` trước; lưu thất bại →
   hủy download.
5. Mọi lần thay file: xóa `-wal/-shm` → ghi `.tmp` → `rename` (atomic) → ghi
   marker `.s3_restored` + `sync_state.json`.

### Khi nào thì "đẩy" cục bộ mới nhất?
- Watcher tự quét `db`/`-wal` (10s) + debounce (5s trên Vercel);
- `syncDbToS3Now()` gọi ngay sau các mutation quan trọng (đăng ký/đổi mật khẩu),
  được `waitUntil` giữ cho chạy xong;
- Idle: cứ 60s (Vercel) `HEAD` một lần — remote đổi mà local sạch → tải về;
  local bẩn → upload (và tự phân xử xung đột).

## 3. Biến môi trường

| Biến | Ý nghĩa |
|---|---|
| `DB_SYNC_AUTO=1` | Bật auto-sync ở mọi môi trường (self-hosted production) |
| `DB_SYNC_AUTO=0` | Tắt hẳn auto-sync (kể cả Vercel) |
| `AUTH_SALT` | Muối hash mật khẩu — **phải đặt giống hệt nhau trên mọi environment** (xem mục 4) |

## 4. Chẩn đoán "mật khẩu cũ tự nhiên không vào được"

1. So sánh log khởi động: `[SQLite DB] AUTH_SALT: ... | fingerprint: <12 ký tự>`.
   Hai fingerprint khác nhau ⇒ hash không bao giờ khớp ⇒ kiểm tra biến
   `AUTH_SALT` trên Vercel (Project → Settings → Environment Variables) xem có
   khác fallback `english_for_me_salt_2026` không.
2. Mở bản backup (S3 key `english_learning.db`) bằng DB browser → bảng
   `sync_meta`: cột `auth_salt_fingerprint` cho biết bản đó được tạo với salt nào;
   `last_write_<bảng>` cho biết ghi gần nhất vào từng bảng trọng yếu (đối chiếu
   với `sync_state.json`/`LastModified` để thấy bản remote có bị rollback không).
3. Object metadata trên S3 (HeadObject): `salt-fingerprint`, `uploaded-at`.
4. Nếu thấy xung đột: tải key `english_learning.conflict.db` (bản bị thua) và
   `english_learning.superseded.db` (bản cũ trước khi dev push) để chép tay.

## 5. Rủi ro còn lại (chỉ kiểm chứng được trên Vercel)

- **Fork không merge được**: nếu 2 instance cùng có ghi mới thì SQLite không thể
  ghi đè lẫn nhau — quy tắc hiện chọn "remote thắng, bên thua lưu sidecar". Muốn
  không còn xung đột thì phải giảm số instance cùng ghi (hoặc chuyển sang DB có
  ghi tập trung — ngoài phạm vi task này).
- **Env `AUTH_SALT` trên Vercel** cần chủ dự án đối chiếu fingerprint như mục 4.

## 5b. ĐÃ ĐO ĐƯỢC: Filebase KHÔNG hỗ trợ `If-Match` — lớp CAS là code chết

Câu hỏi mở ở trên đã được trả lời bằng phép đo thật trên bucket production
(`scripts/probe-filebase-if-match.mjs`, dùng key thử nghiệm `cas-probe/…` riêng,
đã xoá sau khi đo):

| Thử nghiệm | Kết quả | Nghĩa là |
|---|---|---|
| `PUT` không điều kiện | 200 | ghi bình thường |
| `PUT If-Match: <ETag đúng>` | 200 | server nhận header, không lỗi |
| **`PUT If-Match: <ETag sai>`** | **200** | **server BỎ QUA điều kiện** |
| `PUT If-Match: *` | 200 | bỏ qua |
| `PUT If-None-Match: *` (key đã tồn tại) | 200 | bỏ qua |
| ETag đổi sau mỗi lần ghi | có | nên *có thể* dùng để so phiên bản |

**Kết luận: Filebase im lặng bỏ qua mọi điều kiện ghi có điều kiện.** Không phải
trả lỗi 400/501 để code tự nhận diện — nó trả 200 như thể đã bảo vệ.

Hệ quả trực tiếp:

1. `putWithCas` (`s3Sync.ts`) **luôn trả `ok: true`**. Nhánh `unsupported` và
   nhánh `conflict` ở `s3Sync.ts:1229-1257` **không bao giờ chạy** — chúng là
   code chết.
2. `If-None-Match` cũng vô dụng, nên "chỉ tạo nếu chưa có" cũng không có tác dụng.
3. **`uploadDbToS3` thực chất là last-write-wins thuần.** Mọi ghi đè bản remote
   đều thắng tuỳ thứ tự đến, không phụ thuộc dữ liệu mới hay cũ.
4. Vì `finishUpload` vẫn ghi `fingerprint`/`baseVersion` như thể CAS đã chạy,
   hệ thống **tự tin rằng mình an toàn trong khi không có cơ chế nào chống ghi đè**.
   Đây là loại lỗi tệ nhất: im lặng và tạo cảm giác an toàn giả.

`baseVersion` trong `sync_state.json` **vẫn hữu ích để phát hiện** xung đột (so
`LastModified` với mốc đã lưu) — nhưng nó chỉ phát hiện *sau khi* đã xảy ra,
không ngăn được.

Điều này **củng cố** quyết định chuyển sang Postgres: giữ kiến trúc Filebase nghĩa
là chấp nhận mất dữ liệu khi 2 instance cùng ghi. Xem `docs/db-migration-postgres.md`.

## 5c. Sao lưu tự động (cron `/api/cron/backup-db`)

Trước đây **không có bản sao lưu định kỳ nào** — cron duy nhất là `/api/health`
và nó chỉ ping Postgres. Mất key `english_learning.db` trên Filebase là mất trọn
vẹn toàn bộ tài khoản.

- Cron: `vercel.json` → `/api/cron/backup-db`, 04:30 hằng ngày.
- Cách làm: **`CopyObject` server-side** (đo được là Filebase hỗ trợ, xem
  `scripts/probe-filebase-if-match.mjs`) — 67MB được copy ở phía Filebase, không
  đi qua instance, nên không tốn RAM và không sợ vượt `maxDuration`. Bản sao luôn
  là trạng thái nguyên vẹn của một thời điểm, không phải file SQLite đang ghi dở.
- Bảo vệ: chỉ chạy với `Authorization: Bearer $CRON_SECRET`; thiếu biến này thì
  từ chối mọi yêu cầu (fail-closed). Xác minh kích thước bản sao khớp nguồn,
  lệch thì xoá bản sao lỗi và báo lỗi.
- Giữ **14 bản mới nhất**. Logic dọn nằm ở `selectStaleBackups`
  (`src/lib/backupRetention.ts`) và chỉ xoá key đúng định dạng `backups/db-<ISO>.db`,
  sắp xếp theo `LastModified` thật — **không** theo tên key, vì so sánh chuỗi từng
  xoá nhầm bản backup mới nhất (đã xảy ra, đã có test chặn lại).
- Kiểm chứng:
  - `node scripts/verify-db-backups.mjs` — cron tạo backup, tải về **mở bằng
    SQLite thật**, `integrity_check`, đếm dòng.
  - `node scripts/verify-backup-prune.mjs` — key lạ không bị đụng, key nguồn không
    bị đụng, giữ đúng 14 bản.
  - `npx vitest run tests/unit/backup-retention.test.ts` — logic dọn thuần.

## 5d. `maxDuration`

Các route đụng CSDL đều có thể phải đẩy DB chính lên Filebase (đo được trước khi
tách từ điển: 67MB ≈ 5.4s ở 100Mbit/s nhưng ~26.8s ở 20Mbit/s), vượt mặc định
10s của Vercel. 13 route đã đặt `maxDuration = 60` (trần của gói Hobby). Không
đặt thì upload bị cắt giữa chừng và dữ liệu mất.

> Sau khi tách từ điển (mục 6), file được đẩy chỉ còn ~1.6-3.5MB ⇒ upload ~1s ở
> 20Mbit/s. `maxDuration = 60` giữ nguyên như biện pháp an toàn (route tra từ
> gọi AI bên ngoài vẫn có thể chậm).

## 6. Tách từ điển khỏi file đồng bộ (2026-10-08)

### 6.1 Cấu trúc 2 file

| File | Nội dung | Kích thước (đo 2026-10-08) | Đồng bộ S3 |
|---|---|---|---|
| `data/english_learning.db` | CHỈ user data: users, bookmarks, progress, pets, coins, access logs, `ai_translation_cache`, reward/budget... | **67.43MB → 1.61MB** (412 trang, `quick_check` ok) | Có — toàn bộ quy tắc ở mục 2 vẫn nguyên (baseVersion/CAS/conflict keys) |
| `data/dictionary.db` | Từ điển tĩnh: `dictionary_entries` (26.416 dòng) + `dictionary_cache` (26.933 dòng) + `dictionary_fts` (FTS5 external-content + 4 shadow table) | **63.92MB** | **KHÔNG BAO GIỜ auto-upload.** Bản gốc nằm ở key S3 `english_learning_dictionary.db`, upload MỘT LẦN bằng `scripts/upload-dictionary.mjs`; cold start tải về bằng `scripts/restore-s3.js --dictionary` |

Code: `dictDb` (connection better-sqlite3 thứ hai, `readonly: false` vì
`dictionary_cache` cần ghi) được export từ `src/lib/db.ts` cạnh `db` cũ — API cũ
nguyên vẹn. Toàn bộ truy vấn từ điển đã chuyển sang `dictDb`:
`api/dictionary/search` (đọc `dictionary_entries`), `cambridgeCrawler.ts`
(đọc/ghi `dictionary_cache`). Route `api/translate` và `groqTranslator.ts`
KHÔNG đụng bảng dictionary nào (`ai_translation_cache` nằm trong DB chính —
dữ liệu nhỏ, gắn user).

### 6.2 Vì sao phải tách (đo thật, audit SRE 2026-10-08)

- 95% dung lượng file đồng bộ là **nội dung tĩnh không đổi**: dictionary_entries
  37.9MB + dictionary_cache 24.6MB + FTS ~1.4MB. User data thật chỉ ~1.6MB.
- Mỗi mutation ghi DB (đăng ký, đổi mật khẩu, ghi access log...) → upload CẢ FILE
  67MB lên Filebase ≈ **8GB/giờ/instance** với quota 100GB/tháng.
- Tra từ (ghi `dictionary_cache`) cũng kích upload 67MB — việc vô thưởng nhất
  lại tốn băng thông nhất.
- Sau tách: upload chỉ còn file ~1.6MB; ghi vào từ điển **không còn kích
  upload** (fingerprint của auto-sync chỉ theo `english_learning.db` + WAL của
  nó — đã có test chứng minh ghi `dictionary.db` không đổi fingerprint).

### 6.3 RPO / cửa sổ xung đột co lại ~20 lần

Bản upload last-write-wins (mục 5b: Filebase bỏ qua If-Match) an toàn hơn khi
thời gian một bản upload "đang bay" trên mạng ngắn — cửa sổ mà instance khác
có thể ghi đè giữa chừng:

| | Trước tách | Sau tách |
|---|---|---|
| Kích thước bản upload | 67MB | 1.61MB (đo được) |
| Thời gian upload @20Mbit/s | ~27-28s | **~0.7s** (~1.5s nếu DB là 3.45MB như ước tính ban đầu) |
| Số lần upload/giờ mỗi instance (debounce/min-interval như cũ) | ~120 | ~120 nhưng mỗi lần nhỏ hơn 40× |

Ý nghĩa thực tế: hai instance vừa ghi gần như đồng thời vẫn có thể đè nhau
(quy tắc conflict + sidecar key xử lý phần đó như mục 2), nhưng khoảng thời
gian "mạng đang mang dữ liệu cũ" giảm từ nửa phút xuống dưới 1.5 giây — RPO
hiệu dụng giảm tương ứng.

### 6.4 Cold start trên Vercel (2 file)

1. `ensureDatabaseRestoredSync()` (db.ts) → `scripts/restore-s3.js`: tải
   `english_learning.db` (~1.6MB, timeout 35s) — như cũ.
2. `ensureDictionaryRestoredSync()` (db.ts) → `scripts/restore-s3.js --dictionary`:
   tải key `english_learning_dictionary.db` về `dbDir/dictionary.db`
   (timeout riêng **30s**). Chỉ chạy khi thiếu marker `.dictionary_restored`
   hoặc file cục bộ < 1MB.
   - **MISS** (chưa ai upload key / lỗi mạng / timeout): app VẪN CHẠY —
     `dictDb` mở file rỗng, API search trả `items: []` graceful (`dictionaryUnavailable:
     true`), không crash; user data hoàn toàn không liên quan.
   - Bản tải về được xác thực trước khi lắp: header SQLite + `quick_check` +
     đếm `dictionary_entries` ≥ 1000.
3. `dictionary.db` không tham gia `sync_state.json`/CAS — nội dung tĩnh, bản
   remote chính là chân lý.

### 6.5 Quy trình deploy (THỨ TỰ QUAN TRỌNG)

Làm trên máy dev (có `data/`, `.env.local` đầy đủ FILEBASE_*):

```bash
# 1) Tách + verify (chưa đụng DB chính — in báo cáo dry-run)
node scripts/split-dictionary.mjs
# Kỳ vọng: dictionary_entries/cache đếm dòng KHỚP 100%, FTS integrity-check ok,
#          quick_check ok, dictionary.db = 63.92MB

# 2) Đẩy từ điển lên S3 MỘT LẦN (key đã có thì phải --force để ghi đè có chủ đích)
node scripts/upload-dictionary.mjs

# 3) Deploy code mới (đọc dictionary.db) — production KHÔNG bị gián đoạn:
#    old code đọc bảng cũ trong DB chính (vẫn còn cho tới bước 5),
#    new code restore dictionary từ key riêng.
git push

# 4) Kiểm tra production: /api/dictionary/search?q=hello phải trả kết quả.

# 5) Gọt DB chính: DROP bảng dictionary + VACUUM + checkpoint (67MB → 1.6MB)
#    LƯU Ý: nếu máy dev đang giữ BẢN CŨ hơn production (có user đăng ký mới trên
#    web), TẢI BẢN MỚI NHẤT english_learning.db từ Filebase về thay thế trước,
#    rồi mới --apply — nếu không push ở bước 6 sẽ mang dữ liệu cũ đè lên.
node scripts/split-dictionary.mjs --apply

# 6) Đẩy DB chính (nhỏ) lên S3 — script tự lưu bản remote cũ vào
#    data/english_learning.db.superseded trước khi ghi đè.
node scripts/sync-to-filebase.mjs
```

Sau này muốn làm mới bản từ điển trên S3 (ví dụ cache tra từ đã nhiều hơn
bản snapshot): chạy lại `upload-dictionary.mjs --force`.

**Biến môi trường trên Vercel: KHÔNG CẦN THÊM BIẾN MỚI** — restore từ điển
dùng lại `FILEBASE_ENDPOINT/REGION/ACCESS_KEY/SECRET_KEY/BUCKET_NAME` và
`VERCEL=1` có sẵn; `AUTH_SALT` không liên quan (từ điển không chứa hash).

### 6.6 Đo kiểm chứng sau tách (đã chạy 2026-10-08)

- `english_learning.db`: 67.43MB → **1.61MB** (67.433.152 → 1.687.552 bytes);
  12 users (10 thật), 3.017 access logs, 51 `ai_translation_cache` —
  không mất dòng nào (WAL cũ được VACUUM merge đủ, `quick_check` ok).
- `dictionary.db`: 63.92MB; entries 26.416, cache 26.932 copy khớp 100%;
  FTS `integrity-check` ok; `MATCH 'hello'` trả kết quả.
- Ghi 1 dòng vào `dictionary_cache` → fingerprint DB chính KHÔNG đổi
  (không kích upload).
- Trên dev: `/api/dictionary/search?q=hello` (đọc dictDb), `/api/dictionary?word=serendipity`
  (ghi cache vào dictDb — đã soi thấy row trong dictionary.db, không phải DB chính),
  `/api/translate?text=...` (ghi `ai_translation_cache` vào DB chính) — đều đúng.
- `npx vitest run tests/unit/dictionary-split.test.ts`: dictDb mở được,
  entries > 20.000, LIKE/FTS hoạt động, DB chính hết bảng dictionary và < 10MB.

### 6.7 Rủi ro còn lại

- **`dictionary_cache` trên Vercel giờ là tạm thời** (instance chết là mất,
  không bao giờ lên S3 nữa). Cache miss → crawl Cambridge/AI như chưa từng
  tra — chấp nhận được vì đó là cache, và bản seed 26.933 dòng đã có sẵn trong
  file. Tác động phụ: nhiều call crawl hơn với từ mới sau này; muốn gom lại
  thì re-upload `--force`.
- **Cold start chậm hơn một chút với route từ điển**: instance lạnh phải tải
  thêm 63.92MB từ điển (timeout 30s). Nếu MISS → search trả rỗng tới hết đời
  instance đó (graceful). Các route khác không bị ảnh hưởng.
- **Bước 5-6 của quy trình deploy vẫn là push thủ công last-write-wins** như
  trước — rủi ro "bản cục bộ cũ đè bản production mới" là rủi ro có sẵn của
  flow dev-push (đã có `.superseded` + conflict keys làm lưới an toàn), không
  phải rủi ro mới của việc tách file.
- **FTS trong dictionary.db chưa được route nào dùng** (route search dùng LIKE
  như cũ) — giữ lại để compatible dữ liệu + cho các script dọn từ điển.


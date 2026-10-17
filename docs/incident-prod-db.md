# Sự cố production: `db:"error"` + từ điển rỗng — 2026-10-15 22:55 (ICT) / 15:55 UTC

> Phạm vi: CHẨN ĐOÁN, không sửa code. Không deploy, không `git add/commit/push`.
> Mọi phép đo dưới đây chạy lúc **2026-10-15T15:55–15:58Z**.

---

## 1. Tóm tắt 3 dòng

1. **Site KHÔNG hỏng với người dùng.** `db:"error"` chỉ là `/api/health` đỏ lên: `src/lib/pg.ts` **không được dùng ở bất kỳ route người dùng nào** (grep `lib/pg` trong `src/` chỉ ra đúng 1 file: `src/app/api/health/route.ts:2`). Toàn bộ dữ liệu người dùng đi qua SQLite `db` của `src/lib/db.ts` — đo production lúc sự cố: `/api/pet`, `/api/progress`, `/api/bookmarks`, `/api/exam`, `/api/support` đều **HTTP 200 với dữ liệu thật**.
2. **Từ điển rỗng vì một bước trong quy trình deploy chưa ai chạy:** key S3 `english_learning_dictionary.db` **không tồn tại trên Filebase** (HEAD → 404 `NotFound`), nên `restore-s3.js --dictionary` exit 0 theo nhánh MISS và app chạy tiếp với `dictionary.db` rỗng (`entries:0`). Dữ liệu **không mất** — nó còn ở máy dev (`data/dictionary.db`, 26.416 mục) và còn nằm trong chính file DB chính trên S3.
3. **Bước khắc phục đầu tiên (rủi ro ~0, không cần deploy):** chạy `node scripts/upload-dictionary.mjs` một lần trên máy dev → key S3 có dữ liệu → instance Vercel cold start sau đó tự tải về `/tmp/data/dictionary.db`.

---

## 2. Bảng triệu chứng (đã đo)

### 2.1 Production `https://www.meowlish.io.vn`

| Endpoint | HTTP | Thời gian | Body (rút gọn) |
|---|---|---|---|
| `GET /api/health` | **503** | 3.6–4.2s | `{"ok":false,"db":"error","latencyMs":3650,"time":"2026-10-15T15:55:10.574Z","dictionary":{"ok":false,"entries":0}}` |
| `GET /api/dictionary/search?q=cat` | 200 | 293ms | `{"success":true,"total":0,"page":1,"limit":24,"totalPages":0,"items":[]}` |
| `GET /api/dictionary/search?q=hello` | 200 | 313ms | `total:0, items:[]` |
| `GET /api/dictionary/search?q=dog` | 200 | 303ms | `total:0, items:[]` |
| `POST /api/auth` (demo/demo) | 401 | — | `"Tên đăng nhập hoặc mật khẩu không chính xác"` (endpoint sống, SQLite truy vấn được — xem §3.1) |
| `GET /api/pet` | **200** | 310ms | `{"success":true,"user":{"id":"user_demo_default","username":"demo",...}}` — **dữ liệu thật** |
| `GET /api/progress` | **200** | 297ms | `{"user":{"id":"user_demo_default",...}}` |
| `GET /api/bookmarks` | **200** | 289ms | `{"bookmarks":[{"word":"blocker",...}]}` |
| `GET /api/exam` | **200** | 309ms | `{"success":true,"history":[]}` |
| `GET /api/support` | **200** | 312ms | `{"success":true,"tickets":[]}` |
| `GET /api/sync` | 401 | 311ms | đúng (chỉ admin) |
| `/`, `/vocabulary`, `/encyclopedia`, `/pet` | 200 | 88–296ms | HTML render bình thường |
| `/login`, `/api/user/me` | 404 | — | route không tồn tại (không phải lỗi) |

### 2.2 Localhost `http://localhost:3000`

| Endpoint | HTTP | Body |
|---|---|---|
| `GET /api/health` | **503** | `{"ok":false,"db":"error","latencyMs":2868,"dictionary":{"ok":true,"entries":26416}}` |
| `GET /api/dictionary/search?q=cat` | 200 | `total:130` + 24 item ⇒ **từ điển local OK** |

⇒ `db:"error"` xuất hiện ở **cả hai** môi trường ⇒ nguyên nhân nằm ở cấu hình/`DATABASE_URL`, không phải ở production.

### 2.3 Filebase S3 (đọc-only, bucket `meowlish-db`)

| Key | Kết quả |
|---|---|
| `english_learning.db` | **CÓ** — 66.49 MB, LastModified `2026-10-15T14:54:47Z` (ghi mới hôm nay) |
| `english_learning_dictionary.db` | **KHÔNG CÓ** — `HeadObject` → `NotFound` / HTTP **404**; `GetObject` → `NoSuchKey` sau 0.3s |
| `dictionary.db` | **KHÔNG CÓ** — 404 |
| `backups/db-2026-10-15T04-49-31-559Z.db` | CÓ (cron backup hôm nay chạy) |

Nội dung file `english_learning.db` trên S3 (tải về temp để kiểm, **không ghi vào repo**):
`users = 19`, `bookmarks = 4`, `progress = 9`, `user_pets = 19`, `coin_transactions = 46`,
và **vẫn còn `dictionary_entries = 26.416` + `dictionary_cache = 26.932`** (vì bước "gột" bảng dictionary khỏi DB chính chưa bao giờ chạy trên bản remote).
`sync_meta.last_write_users = 2026-10-15T14:54:45.833Z` ⇒ **người dùng thật vẫn đăng nhập và ghi dữ liệu hôm nay**, không phải bản backup cũ.

---

## 3. Nguyên nhân (từng tầng) + `file:dòng`

### 3.1 Tầng 1 — `db:"error"`: KHÔNG có đường dẫn nào trong app dùng Postgres

| Bằng chứng | Vị trí |
|---|---|
| `isPgEnabled()` = `Boolean(process.env.DATABASE_URL)` | `src/lib/pg.ts:122-124` |
| **Toàn bộ `src/` chỉ có 1 file import `@/lib/pg`** | `src/app/api/health/route.ts:2` (`grep -rn "lib/pg" src/` → 1 kết quả) |
| `pgDb.prepare('SELECT 1')` chỉ chạy trong health check | `src/app/api/health/route.ts:47-55` |
| Data người dùng = **SQLite** `english_learning.db` (Vercel: `/tmp/data`) | `src/lib/db.ts:7-13`, `src/lib/db.ts:193`, proxy `src/lib/db.ts:846-855` |
| Đăng nhập đọc `users` từ SQLite | `src/app/api/auth/route.ts:2` (import `db`), `:949-953` |
| `DATA_BACKEND=postgres` trong `.env.local` là **dead config** | `grep DATA_BACKEND src/` → 0 kết quả (đã ghi ở `docs/test-baseline.md:137-138`) |

**Hệ quả:** **không có (và không cần) fallback Postgres→SQLite**, vì Postgres nằm ngoài đường dẫn người dùng. Việc `db:"error"` chỉ làm `/api/health` trả 503 và làm mỗi lần health check mất thêm ~2.9s chờ timeout mạng (đo được: connect fail sau **2854ms**).

### 3.2 Tầng 2 — Vì sao `db` chuyển `ok` → `error`: project Supabase không còn tồn tại

| Bằng chứng | Kết quả |
|---|---|
| Health route default `db:'not-configured'` khi **không có** `DATABASE_URL` | `src/app/api/health/route.ts:41` |
| Production trả `"db":"error"` (không phải `"not-configured"`) | ⇒ **`DATABASE_URL` vẫn CÒN trên Vercel** ⇒ biến KHÔNG bị xoá |
| `.env.local` `DATABASE_URL` (đã che) | `postgresql://postgres.bnv***:***@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| DNS | `aws-0-ap-southeast-1.pooler.supabase.com` → `52.77.146.31` ✅ |
| TCP | cổng `6543` **OPEN** ✅ |
| Kết nối `postgres` (probe chỉ-đọc `SELECT 1`) | **FAIL sau 2854ms** — `code: XX000`, message: `(ENOTFOUND) tenant/user postgres.bnv*** not found` |

**Kết luận tầng 2:** pooler của Supabase **không còn nhận diện tenant `postgres.bnv…`** ⇒ project Supabase đã bị **xoá** (hoặc ref/region không còn khớp). **Không phải** sai mật khẩu (không tới bước xác thực), **không phải** lỗi mạng, **không phải** hết hạn/pause theo kiểu thường (project bị pause vẫn resolve bình thường; nhận diện tenant ở tầng pooler mới mất khi project bị xoá).
Vì **không route nào dùng Postgres**, việc project biến mất **không gây mất dữ liệu người dùng** — dữ liệu nằm ở SQLite/S3 và đang chạy bình thường.

**Script chẩn đoán có sẵn:** `scripts/` có `diag-*.mjs` (email/nav/prod-commit…) nhưng **không có** script nào cho Postgres/DB. `scripts/pg/` có `00-download-prod-db.mjs`, `01-create-schema.mjs --apply`, `02-import-user-data.mjs --apply`, `03-verify.mjs`, `04-smoke-adapter.ts`, `09-verify-pg-changes.ts` — là bộ công cụ của cuộc **di trú chưa hoàn tất**, và các script `--apply`/`smoke` **ghi dữ liệu**. Vì vậy tôi **không chạy** chúng, thay bằng probe `SELECT 1` chỉ-đọc (không tạo bảng, không ghi dòng nào).

### 3.3 Tầng 3 — Vì sao từ điển production rỗng: key S3 của từ điển **chưa từng được upload**

| Bước | Bằng chứng |
|---|---|
| Route search đọc **file riêng** `dictDb` | `src/app/api/dictionary/search/route.ts:2`, `:111-142` |
| `dictDbPath = <dbDir>/dictionary.db`; trên Vercel `dbDir = /tmp/data` (ephemeral, mỗi instance) | `src/lib/db.ts:8`, `src/lib/db.ts:16`, `src/lib/db.ts:943` |
| Cold start gọi `scripts/restore-s3.js --dictionary`, timeout **30s** | `src/lib/db.ts:881`, `src/lib/db.ts:889-930` (đặc biệt `:908`) |
| Script tải key `english_learning_dictionary.db`; **MISS ⇒ `exit 0`, app chạy tiếp với từ điển rỗng** | `scripts/restore-s3.js:267-308` (nhánh 404 ở `:296-305`) |
| **ĐO ĐƯỢC: key đó KHÔNG tồn tại trên Filebase (404)** | probe S3 ở §2.3 |
| `createDictDb()` tạo bảng rỗng khi file không có | `src/lib/db.ts:939-974` |
| `getDictionaryHealth()` đếm ⇒ 0 ⇒ `ok:false` ⇒ **503** | `src/lib/db.ts:1033-1046` + `src/app/api/health/route.ts:65-73` |
| `data/dictionary.db` **không được commit** (`.gitignore`: `/data/`, `*.db`; `git ls-files \| Select-String dictionar` → không có file `.db`) | ⇒ **không có trong bundle Vercel**, không thể lấy từ repo |
| Quy trình deploy yêu cầu `node scripts/upload-dictionary.mjs` ở **bước 2** | `docs/db-sync.md:228-240` — **bước này đã bị bỏ qua** |

⇒ `entries:0` là **hệ quả trực tiếp của việc bỏ qua `upload-dictionary.mjs`**, không phải hỏng file, không phải giới hạn filesystem read-only của serverless (Vercel cho phép ghi `/tmp`; app thực tế **đã tạo được** file `dictionary.db` rỗng và ghi được `dictionary_cache`).

**Rủi ro thứ hai (chưa xảy ra, sẽ xảy ra sau khi upload):** timeout 30s tải ~64MB. Tham khảo: 66.49MB tải từ Filebase trên máy dev mất **10.2s**; từ Vercel (Singapore → US) có thể lâu hơn nhiều ⇒ nếu timeout, `.restore.tmp` bị bỏ, file không được lắp ⇒ **vẫn rỗng**. Khi upload xong phải kiểm tra thật (xem §5 bước 1).

### 3.4 Cron trong `vercel.json` — có chạy không, có tác dụng gì

```json
"crons": [
  { "path": "/api/health",        "schedule": "0 4 * * *" },
  { "path": "/api/cron/backup-db","schedule": "30 4 * * *" }
]
```

| Cron | Đang chạy? | Bằng chứng | Tác dụng hiện tại |
|---|---|---|---|
| `/api/cron/backup-db` (04:30 UTC) | **CÓ** | `backups/db-2026-10-15T04-49-31-559Z.db` tồn tại trên S3 (đủ 14 bản 10-07→10-15) | Copy server-side S3→S3, **không** đi qua instance ⇒ **không bị ảnh hưởng** bởi sự cố này |
| `/api/health` (04:00 UTC) | Có (Vercel vẫn gọi dù trả 503) | route không chặn cron; 503 chỉ là mã trả về | Mục đích ghi trong code là **giữ Supabase Free không bị pause** (`src/app/api/health/route.ts:8-12`) — **vô nghĩa** khi project đã bị xoá. Hệ quả phụ: mỗi lần chạy phí thêm ~3s chờ timeout, và tín hiệu "đỏ" có thể gây báo động giả |

### 3.5 Ghi chú về độ tin cậy của phép đo

- **Bản build đang chạy trên production KHÔNG phải `ba0c6ca`** (HEAD) và cũng **không phải `5aa5820`** như `scripts/diag-prod-which-commit.mjs` báo. Bằng chứng: response `/api/health` có field `dictionary`, mà field này chỉ xuất hiện từ commit `c47178d` (2026-10-09 16:15), trong khi `5aa5820` có ngày 2026-10-09 10:48 ⇒ script marker-list **báo thiếu (false negative)**. Nội dung `src/app/api/health/route.ts` tôi trích dẫn là bản HEAD, và tôi đã kiểm riêng bản deploy cũ hơn: nó cũng chỉ dùng `pgDb` ở health route (`git grep "lib/pg" 5aa5820 -- src` → 1 kết quả) ⇒ **kết luận §3.1 không đổi theo bản build**.
- `src/lib/db.ts` trong working tree đang có **+27 dòng chưa commit** (thêm ở dòng ~581, trong `createDb()`) do agent khác sửa song song — **không nằm trong vùng `dictDb`/health mà tôi trích dẫn**, nên các số dòng ở §3.3 vẫn hợp lệ. Mốc thời gian đo: 15:55–15:58Z, sau khi lần sửa đó.
- `scripts/pg/04-smoke-adapter.ts` và `09-verify-pg-changes.ts` **ghi/xoá dòng thật** trong DB ⇒ không chạy. `restore-s3.js`, `upload-dictionary.mjs` **không chạy** ở lần này (ghi S3).
- Mọi biến bí mật chỉ được in dạng che; không ghi file `.env`.

---

## 4. Người dùng thật bị ảnh hưởng gì (cụ thể, không suông)

### 4.1 KHÔNG bị ảnh hưởng (đã đo trên production)

- **Đăng nhập / đăng ký / quên mật khẩu**: đọc–ghi SQLite (`src/app/api/auth/route.ts:949-953`), hoạt động bình thường. Bằng chứng gián tiếp: `sync_meta.last_write_users = 2026-10-15T14:54:45Z` ( có người đăng nhập/ghi hôm nay), và 19 tài khoản thật trong DB trên S3.
- **Lưu tiến độ học tập, bookmark, kết quả bài thi**: `/api/progress` 200, `/api/bookmarks` 200 với dữ liệu thật, `/api/exam` 200.
- **Pet / vật phẩm / coins**: `/api/pet` 200 trả về đúng hồ sơ pet của user demo.
- **Trang tĩnh**: `/`, `/vocabulary`, `/encyclopedia`, `/pet` đều render 200. `/vocabulary` dùng dữ liệu bundle `VOCABULARY_LIST` (`src/app/vocabulary/page.tsx:6`), **không** chạm từ điển SQLite ⇒ hiển thị bình thường.

### 4.2 CÓ bị ảnh hưởng — đúng 1 tính năng: **tìm kiếm từ điển**

| Bề mặt | Triệu chứng người dùng thấy | Mã |
|---|---|---|
| Ô tìm kiếm ở **Bách Khoá Tra Cứu `/encyclopedia`** | Gõ bất kỳ từ nào (`cat`, `hello`, `dog`) → **"0 kết quả"**, trong khi trang vẫn quảng cáo "26.500+ mục" | `src/app/encyclopedia/page.tsx:150` → `GET /api/dictionary/search` (`search/route.ts:111-142`) |
| Tra **một từ** (`GET /api/dictionary?word=…`) | **Vẫn ra kết quả**, nhưng chậm hơn và tốn hạn mức: cache cục bộ đọc từ `dictionary_cache` trong `dictDb` ⇒ luôn MISS ⇒ phải crawl Cambridge/AI mỗi lần | `src/lib/cambridgeCrawler.ts:33` (đọc cache), `:42-53` (đường crawl dự phòng) |

Nói gọn: **site dùng được, chỉ mất ô "tìm từ điển nâng cao"**. Không mất tiến độ, không mất pet, không mất coin.

### 4.3 Ảnh hưởng "vô hình" khác

- `/api/health` đỏ (503) ⇒ mọi hệ thống giám sát/uptime sẽ báo động; nếu có ai đó "fix" bằng cách tắt check thì lần sau lỗi thật sẽ không ai thấy.
- Vì `DATABASE_URL` còn treo mà project không tồn tại, **mỗi request `/api/health` chậm thêm ~2.9s** — chỉ ảnh hưởng health check.

---

## 5. Thứ tự khắc phục đề xuất (kèm rủi ro)

> Không tự triển khai. Mỗi bước dừng lại để kiểm chứng trước bước sau.

### Bước 1 — Đẩy từ điển lên Filebase (ƯU TIÊN CAO NHẤT, rủi ro rất thấp)

```bash
node scripts/upload-dictionary.mjs        # trên máy dev, có data/ + .env.local đầy đủ
```
- Nguồn: `data/dictionary.db` (67,022,848 B, **26.416** mục, FTS ok — đã verify).
- Script tự **từ chối** nếu quick_check lỗi / < 20.000 mục / FTS integrity lỗi / key đã tồn tại (`scripts/upload-dictionary.mjs:12-17`), và **không** đụng `english_learning.db` hay `sync_state.json`.
- Sau đó: chờ một instance Vercel cold start (hoặc deploy lại) rồi kiểm `GET /api/dictionary/search?q=cat` phải `total > 0`.
- **Rủi ro:** (a) upload 64MB mất vài phút; (b) **nếu restore timeout 30s** thì vẫn rỗng → xử lý bằng cách tăng `DICT_RESTORE_TIMEOUT_MS` (`src/lib/db.ts:881`) hoặc thử lại ở instance khác; (c) **không mất dữ liệu người dùng** — key mới, không ghi đè key nào.
- **Rủi ro dữ liệu: KHÔNG.**

### Bước 2 — Dựng lại đèn đỏ `/api/health` (rủi ro thấp, cần quyết định)

Hai lựa chọn, **cần người dùng chọn** (xem §6):
- **2a — Gỡ `DATABASE_URL` khỏi Vercel** ⇒ health route đi vào nhánh `not-configured` (`src/app/api/health/route.ts:41`) và trả 200 khi từ điển OK.
- **2b — Khôi phục project Supabase** rồi giữ `DATABASE_URL`.

Vì **không route nào dùng Postgres** (đã chứng minh ở §3.1), **2a không làm hỏng gì cả** và là cách nhanh nhất để tắt báo động giả. Rủi ro: đánh dấu "Postgres đã bị bỏ" một cách chính thức (đừng làm nếu còn ý định di trú thật).

### Bước 3 — Dọn 66MB trong DB chính (KHẨN CẤP THẤP, **rủi ro mất dữ liệu nếu làm sai**)

Mục tiêu: DB chính 66.49MB → ~2MB, mỗi lần ghi không còn upload 67MB.
Quy trình đã viết sẵn: `docs/db-sync.md:244-252` (bước 5-6).

⚠️ **Bắt buộc phải làm trên bản tải MỚI NHẤT từ Filebase**, không được làm trên `data/english_learning.db` cục bộ:
- Local hiện chỉ có **13 users**, remote có **19 users** ⇒ chạy `split-dictionary.mjs --apply` trên bản local sẽ **đè mất tài khoản thật** (đúng cảnh báo ở `docs/db-sync.md:245-247`).
- Trước khi `--apply`: tải `english_learning.db` mới nhất từ Filebase về một thư mục riêng, backup lại, rồi mới tách + đẩy.
- Có sẵn 14 bản backup trên S3 để quay lui (`backups/db-2026-10-15T04-49-31-559Z.db`).
- **Rủi ro dữ liệu: CAO nếu làm trên bản local. Đây là bước DUY NHẤT trong danh sách có thể mất dữ liệu người dùng.**

### Bước 4 — Vá tự phòng để lỡ key lại mất (ngoài phạm vi chẩn đoán)

Cân nhắc: `getDictionaryHealth()`/`dictDb` fallback sang bảng `dictionary_entries` **còn nằm trong DB chính** (`src/lib/db.ts:1033-1046`) khi `dictionary.db` rỗng; hoặc thêm cảnh báo "MISS key từ điển" ở `/api/log` để không chết âm thầm lần nữa. Cần viết code + deploy ⇒ để sau.

### Thứ tự tóm lại

`1 (upload từ điển, ~10 phút, rủi ro ≈0)` → `2 (dựng lại health, rủi ro ≈0)` → `4 (vá phòng ngừa)` → `3 (dọn 66MB, rủi ro mất dữ liệu nếu làm ẩu)`.

---

## 6. Cần người dùng quyết định / cần thông tin gì

1. **Supabase: cứu hay bỏ?**
   - Nếu **bỏ**: cần xác nhận để gỡ `DATABASE_URL` trên Vercel (không cần code). *Không cần đăng nhập Supabase.*
   - Nếu **cứu**: cần tài khoản **chủ sở hữu project** `postgres.bnv***` trên Supabase (không phải service key). Hỏi Supabase xem project còn tồn tại không / có thể restore từ backup không. **Lưu ý:** kể cả khi cứu được, nó **không mang lại giá trị người dùng hôm nay** vì `src/` không đọc Postgres ở đâu cả — giá trị chỉ có khi cuộc di trú `scripts/pg/` mới thực sự hoàn tất.
2. **Xác nhận nguồn `data/dictionary.db` trên máy dev còn đúng ý?** Nó là bản 26.416 mục từ ngày 2026-10-08 (khớp 100% với `dictionary_entries` còn nằm trong DB chính trên S3). Nếu có máy khác giữ bản mới hơn thì dùng bản đó.
3. **Bước 3 có được phép chạy không?** Cần chấp thuận + xác nhận "không ai đang đăng ký giữa lúc thao tác" (thao tác này đè bản DB chính trên S3, có thể đè dữ liệu vài phút).
4. **Có muốn sửa `scripts/diag-prod-which-commit.mjs` không?** Nó đang báo commit production sai (`5aa5820` thay vì ≥ `c47178d`) vì marker-list không đủ; script này được dùng để quyết định "cần deploy không", nên sai lệch ở đây có thể gây quyết định sai.
5. **Xác nhận instance nào đang chạy build nào** nếu cần rollback — hiện tôi chỉ xác định được "≥ `c47178d`" qua shape của response `/api/health`, chưa xác định được chính xác commit.

---

### Phụ lục — Lệnh đã chạy để chẩn đoán (tất cả chỉ-đọc)

```powershell
Invoke-WebRequest https://www.meowlish.io.vn/api/health                       # 503
Invoke-WebRequest "https://www.meowlish.io.vn/api/dictionary/search?q=cat"    # total 0
Invoke-WebRequest https://www.meowlish.io.vn/api/pet                          # 200 + data
Invoke-WebRequest http://localhost:3000/api/health                            # 503, dictionary ok 26416
git ls-files | Select-String dictionary                                     # không có .db
node <probe S3 read-only: List/Head english_learning_dictionary.db>          # 404 NotFound
node <probe postgres read-only: SELECT 1>                                    # XX000 tenant not found
node <probe tải english_learning.db về %TEMP% rồi đếm bảng>                   # 19 users, 26416 entries
```

Không chạy: `scripts/upload-dictionary.mjs`, `scripts/restore-s3.js`, `scripts/split-dictionary.mjs --apply`,
`scripts/pg/01/02 --apply`, `scripts/pg/04-smoke-adapter.ts`, `scripts/pg/09-verify-pg-changes.ts`
(tất cả đều **ghi** vào S3 hoặc vào DB).
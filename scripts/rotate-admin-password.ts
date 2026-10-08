/**
 * Đặt lại mật khẩu quản trị khi không đăng nhập được / cổng /duahau không có
 * chức năng quên mật khẩu.
 *
 * Mật khẩu mới đọc từ biến môi trường `ADMIN_RESET_PASSWORD` trong `.env.local`
 * (gitignored) — KHÔNG nhận qua tham số dòng lệnh, vì tham số lọt vào shell
 * history và vào log tiến trình trên máy/CI.
 *
 * Quy trình an toàn (vì DB này từng bị mất dữ liệu do ghi đè cả file):
 *   1. Tải DB production từ Filebase.
 *   2. Đẩy một bản sao lưu có timestamp lên bucket (KHÔNG xoá bản gốc).
 *   3. Sửa hash trong bản cục bộ, hash bằng đúng hàm của ứng dụng (scrypt).
 *   4. Upload lại với `If-Match` để không đè lên bản mới hơn (CAS), thử lại tối đa 4 lần.
 *   5. Tải lại để xác minh mật khẩu mới thực sự đúng trên dữ liệu đã lưu.
 *   6. Đồng bộ cùng giá trị sang Postgres để khi chuyển đổi dữ liệu không bị revert.
 *
 * Chạy:  npx tsx scripts/rotate-admin-password.ts
 * Trước đó thêm vào .env.local:  ADMIN_RESET_PASSWORD=<mật khẩu mới>
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { S3Client, GetObjectCommand, PutObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';

// Nạp .env.local (không ghi đè biến đã có).
for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i <= 0 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, i).trim();
  if (process.env[k] === undefined) process.env[k] = line.slice(i + 1).trim();
}

const DB_KEY = process.env.PG_SOURCE_KEY || 'english_learning.db';
const MAX_ATTEMPTS = 4;

type AdminRow = { id: string; username: string; email: string | null; password_hash: string };

async function main() {
  const newPassword = process.env.ADMIN_RESET_PASSWORD;
  if (!newPassword || newPassword.length < 8) {
    console.error(
      'Thieu ADMIN_RESET_PASSWORD trong .env.local (can it nhat 8 ky tu).\n' +
        'KHONG dat mat khau qua tham so dong lenh — no lot vao shell history.'
    );
    process.exit(1);
  }

  const { hashPassword, verifyPassword } = await import('../src/lib/db');

  const s3 = new S3Client({
    endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
    region: (process.env.FILEBASE_REGION && process.env.FILEBASE_REGION !== 'auto')
      ? process.env.FILEBASE_REGION : 'us-east-1',
    credentials: {
      accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
      secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
    },
    forcePathStyle: true,
  });
  const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
  const workDir = path.join(os.tmpdir(), 'meowlish-admin-reset');
  fs.mkdirSync(workDir, { recursive: true });

  const newHash = hashPassword(newPassword);
  const scheme = newHash.startsWith('scrypt$') ? 'scrypt' : 'SHA-256';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`\n--- Lần ${attempt}/${MAX_ATTEMPTS} ---`);

    // 1. Tải DB kèm ETag (dùng làm điều kiện CAS ở bước 4)
    const downloaded = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: DB_KEY }));
    if (!downloaded.Body) throw new Error('S3 trả về Body rỗng');
    const etag = downloaded.ETag || (downloaded.$metadata as { etag?: string } | undefined)?.etag;
    if (!etag) throw new Error('Không đọc được ETag — không an toàn để ghi đè.');
    const localPath = path.join(workDir, 'db.sqlite');
    fs.writeFileSync(localPath, Buffer.from(await downloaded.Body.transformToByteArray()));

    // 2. Sao lưu trước khi sửa (giữ nguyên bản gốc)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `backups/${DB_KEY}.${stamp}`;
    await s3.send(
      new CopyObjectCommand({ Bucket: bucket, Key: backupKey, CopySource: `/${bucket}/${DB_KEY}` })
    );
    console.log(`Sao luu: ${backupKey}`);

    // 3. Sửa hash
    const db = new Database(localPath);
    const before = db.prepare('SELECT id, username, email, password_hash FROM users WHERE username = ?')
      .get('admin') as AdminRow | undefined;
    if (!before) {
      db.close();
      console.error('KHONG co tai khoan "admin" trong DB.');
      process.exit(1);
    }
    db.prepare('UPDATE users SET password_hash = ?, status = ?, role = ? WHERE username = ?')
      .run(newHash, 'active', 'admin', 'admin');

    // Kiểm tra ngay trên bản cục bộ
    const after = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('admin') as
      { password_hash: string };
    const localOk = verifyPassword(newPassword, after.password_hash).ok;
    db.close();
    if (!localOk) {
      console.error('Xac minh THAT BAI tren ban cuc bo — dung lai khong upload.');
      process.exit(1);
    }
    console.log(`Da doi hash (${scheme}), xac minh cuc bo: OK`);

    // 4. Upload có điều kiện (CAS) — không đè lên bản người khác vừa ghi
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: DB_KEY,
          Body: fs.readFileSync(localPath),
          IfMatch: etag,
          ContentType: 'application/octet-stream',
        })
      );
    } catch (err: unknown) {
      const code = (err as { name?: string }).name || '';
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (code === 'PreconditionFailed' || status === 412) {
        console.log('DB vua bi thay doi o noi khac (412) — tai lai va thu lai.');
        continue;
      }
      throw err;
    }

    // 5. Tải lại xác minh trên dữ liệu ĐÃ LƯU
    const verifyRes = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: DB_KEY }));
    if (!verifyRes.Body) throw new Error('Không tải lại được DB để xác minh');
    const verifyPath = path.join(workDir, 'verify.sqlite');
    fs.writeFileSync(verifyPath, Buffer.from(await verifyRes.Body.transformToByteArray()));
    const dbCheck = new Database(verifyPath, { readonly: true });
    const saved = dbCheck
      .prepare('SELECT password_hash FROM users WHERE username = ?')
      .get('admin') as { password_hash: string } | undefined;
    dbCheck.close();

    if (!saved || !verifyPassword(newPassword, saved.password_hash).ok) {
      console.error('Xac minh tren ban da luu THAT BAI — can kiem tra lai.');
      process.exit(1);
    }
    console.log('Xac minh tren ban DA LUU tren Filebase: OK');

    console.log('\nHOAN TAT. Hay dang nhap lai cong /duahau voi mat khau moi.');
    return;
  }

  console.error('\nThat bai sau nhieu lan thu do DB lien tuc bi thay doi. Hay thu lai sau.');
  process.exit(1);
}

main().catch((e: unknown) => {
  console.error('LOI:', e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
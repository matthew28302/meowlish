import { NextResponse } from 'next/server';
import { BACKUP_KEY_RE, selectStaleBackups } from '@/lib/backupRetention';
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

/**
 * GET /api/cron/backup-db — sao lưu CƠ SỞ DỮ LIỆU THEO LỊCH.
 *
 * VÌ SAO CẦN:
 * Toàn bộ dữ liệu người dùng nằm trong MỘT file `english_learning.db` trên
 * Filebase. Không có bản sao lưu định kỳ nào — cron duy nhất trước đây là
 * `/api/health` và nó chỉ ping Postgres, không sao lưu gì. Nghĩa là nếu
 * Filebase mất dữ liệu (xóa nhầm key, hết hạn, sự cố nhà cung cấp) thì
 * MẤT TRỌN VẸN toàn bộ tài khoản, không có đường phục hồi.
 *
 * CÁCH LÀM:
 * Dùng Server-Side Copy (`CopyObject`) — đã kiểm chứng Filebase hỗ trợ
 * (`scripts/probe-filebase-if-match.mjs`). Toàn bộ 67MB được copy ở phía
 * Filebase, KHÔNG đi qua instance: không tốn RAM, không sợ vượt `maxDuration`,
 * và bản sao luôn là bản nguyên vẹn của một thời điểm (không phải file
 * SQLite đang ghi dở — điểm này tốt hơn hẳn việc copy file local trong lúc
 * app đang chạy).
 *
 * AN TOÀN:
 * - Chỉ chạy được với `Authorization: Bearer <CRON_SECRET>` (Vercel tự gửi khi
 *   cron gọi). Thiếu `CRON_SECRET` ⇒ từ chối, KHÔNG mở endpoint công khai.
 * - Xác minh kích thước bản sao khớp nguồn; lệch ⇒ xoá bản sao và báo lỗi,
 *   không để lại bản sao hỏng trong danh sách backup.
 * - Chỉ xoá file backup CŨ trong `backups/`, không bao giờ chạm key `english_learning.db`.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const DB_KEY = 'english_learning.db';
const BACKUP_PREFIX = 'backups/';
/** Giữ 14 bản — đủ 2 tuần để phát hiện mất dữ liệu mà vẫn rẻ. */
const KEEP_BACKUPS = 14;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}

/** So sánh thời điều kiện, tránh rò rỉ `CRON_SECRET` qua phản hồi. */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (presented.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ presented.charCodeAt(i);
  return diff === 0;
}

function getClient(): S3Client | null {
  const key = process.env.FILEBASE_ACCESS_KEY || '';
  const secret = process.env.FILEBASE_SECRET_KEY || '';
  if (!key || !secret) return null;
  const rawRegion = process.env.FILEBASE_REGION;
  return new S3Client({
    endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
    region: rawRegion && rawRegion !== 'auto' ? rawRegion : 'us-east-1',
    credentials: { accessKeyId: key, secretAccessKey: secret },
    forcePathStyle: true,
  });
}

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) {
    // Fail-closed: không có bí mật thì KHÔNG ai được gọi, kể cả cron.
    return json({ ok: false, error: 'CRON_SECRET chua duoc cau hinh — endpoint bi tu choi.' }, 503);
  }
  if (!authorized(req)) return json({ ok: false, error: 'Khong duoc phep.' }, 401);

  const s3 = getClient();
  if (!s3) {
    return json({ ok: false, error: 'Thieu thong tin Filebase (FILEBASE_ACCESS_KEY / FILEBASE_SECRET_KEY).' }, 503);
  }
  const bucket = process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';

  const report: Record<string, unknown> = { ok: true, time: new Date().toISOString() };

  try {
    // --- 1. Nguồn có tồn tại không? ---
    let sourceEtag: string | null = null;
    let sourceSize = 0;
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: DB_KEY }));
      sourceEtag = (head.ETag || '').replace(/^"|"$/g, '') || null;
      sourceSize = Number(head.ContentLength || 0);
    } catch {
      // Nguồn không có ⇒ không có gì để sao lưu. KHÔNG phải lỗi nghiêm trọng.
      return json({ ...report, ok: true, skipped: 'khong co key nguon tren Filebase' }, 200);
    }
    report.sourceBytes = sourceSize;

    // --- 2. Bản backup hôm nay đã có và NỘI DUNG KHÔNG ĐỔI chưa? ---
    const todayPrefix = `${BACKUP_PREFIX}db-${new Date().toISOString().slice(0, 10)}`;
    let existingToday: { key: string; etag: string | null } | null = null;
    try {
      const list = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: todayPrefix })
      );
      for (const obj of list.Contents || []) {
        if (!obj.Key || !BACKUP_KEY_RE.test(obj.Key)) continue;
        const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: obj.Key }));
        const etag = (h.ETag || '').replace(/^"|"$/g, '') || null;
        if (etag && etag === sourceEtag) {
          existingToday = { key: obj.Key, etag };
          break;
        }
      }
    } catch {
      // Không liệt kê được thì cứ tạo bản mới.
    }

    if (existingToday) {
      report.skipped = 'da co ban backup hom nay voi dung noi dung — khong can tao lai';
      report.backupKey = existingToday.key;
    } else {
      // --- 3. Copy server-side + xác minh ngay ---
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupKey = `${BACKUP_PREFIX}db-${stamp}.db`;

      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: backupKey,
          CopySource: `${bucket}/${DB_KEY}`,
          MetadataDirective: 'REPLACE',
          Metadata: { 'saved-at': new Date().toISOString(), source: 'cron/backup-db' },
        })
      );

      const copied = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: backupKey }));
      const copiedSize = Number(copied.ContentLength || 0);
      if (copiedSize !== sourceSize || copiedSize === 0) {
        // Bản sao hỏng/không khớp — dọn ngay để không lọt vào danh sách backup.
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: backupKey }));
        } catch {
          /* không xoá được thì báo cáo, không ném đè lỗi gốc */
        }
        return json(
          { ok: false, error: 'Ban sao khop kich thuoc khong dung — da xoa ban loi.', expected: sourceSize, got: copiedSize },
          502
        );
      }
      report.backupKey = backupKey;
      report.backupBytes = copiedSize;
    }

    // --- 4. Dọn bản backup cũ, GIỮ NGUỒN ---
    //
    // Logic nằm ở `selectStaleBackups` (src/lib/backupRetention.ts) vì đây là chỗ
    // XOÁ file trên bucket thật — sai một dòng là mất bản backup mới nhất.
    // Bản đầu tiên của tôi sắp xếp theo TÊN KEY và đã đo được bản backup thật bị
    // xoá khi có key lạ trong cùng thư mục.
    let pruned = 0;
    try {
      const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: BACKUP_PREFIX }));
      const entries = (list.Contents || [])
        .filter((o): o is typeof o & { Key: string } => Boolean(o.Key))
        .map((o) => ({ key: o.Key, at: o.LastModified ? o.LastModified.getTime() : 0 }));

      const stale = selectStaleBackups(entries, KEEP_BACKUPS, DB_KEY);
      for (const key of stale) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        pruned++;
      }
      const totalOurs = entries.filter((e) => BACKUP_KEY_RE.test(e.key)).length;
      report.totalBackups = totalOurs;
      report.keptBackups = totalOurs - pruned;
    } catch {
      report.pruneError = 'khong liet ke duoc danh sach backup';
    }
    report.pruned = pruned;

    return json(report, 200);
  } catch (err) {
    // Không ném chi tiết lỗi S3 ra ngoài (có thể chứa endpoint/bucket).
    console.error('[cron/backup-db] that bai:', err instanceof Error ? err.message : String(err));
    return json({ ok: false, error: 'Sao luu that bai.' }, 502);
  }
}
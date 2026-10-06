import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from './logger';

const DB_FILENAME = 'english_learning.db';
const isVercel = process.env.VERCEL === '1';
const dbDir = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, DB_FILENAME);
const markerPath = path.join(dbDir, '.s3_restored');
const syncStatePath = path.join(dbDir, 'sync_state.json');

// ---------------------------------------------------------------------------
// QUY TẮC THỨ TỰ ĐỒNG BỘ (đọc kỹ trước khi sửa — phải khớp scripts/restore-s3.js)
//
// 1. MỖI INSTANCE CHỈ ĐƯỢC UPLOAD KHI LÀ HẬU DUỆ CỦA BẢN REMOTE HIỆN TẠI.
//    - Bản "gốc" của instance = baseVersion (ETag của bản remote mà instance đã
//      tải về / đã upload thành công), lưu trong sync_state.json cạnh file DB.
//    - Upload luôn dùng conditional write (If-Match ETag) → instance khác vừa
//      ghi xong thì upload của mình bị 412 và KHÔNG được ghi đè.
//    - Không có base → KHÔNG BAO GIỜ upload (chống DB trống/dev ghi đè backup thật).
//
// 2. DOWNLOAD/RESTORE CHỈ THAY DB CỤC BỘ KHI AN TOÀN:
//    - DB cục bộ trống/hỏng → tải về (không có gì để mất).
//    - Đang giữ đúng bản remote (baseVersion === ETag remote) → GIỮ bản cục bộ
//      (phòng khi có thao tác ghi mới chưa kịp upload).
//    - Remote khác bản của instance (xung đột) → remote thắng, nhưng nếu bản
//      cục bộ có dữ liệu riêng thì được lưu vào key CONFLICT_KEY TRƯỚC khi thay.
//
// 3. MỌI LẦN THAY FILE ĐỀU GHI TẠM RỒI RENAME (atomic) + XÓA -wal/-shm cũ.
//
// 4. TRƯỚC MỖI UPLOAD: PRAGMA wal_checkpoint(TRUNCATE) + tắt wal_autocheckpoint
//    trong lúc stream để file chính không bị ghi giữa chừng (upload rách).
// ---------------------------------------------------------------------------

// Sidecar keys trên S3: bên thua trong xung đột luôn được giữ lại để chép tay.
const CONFLICT_KEY = 'english_learning.conflict.db'; // bản cục bộ bị thay khi bản remote thắng
const SUPERSEDED_KEY = 'english_learning.superseded.db'; // bản remote bị thay khi push cục bộ thắng

const MIN_VALID_DB_BYTES = 100_000; // dưới mức này coi như DB rỗng/không hợp lệ
const REMOTE_REAL_DB_BYTES = 1_000_000; // remote >= mức này được coi là "có dữ liệu thật"
const DIRTY_EPSILON_MS = 2_000; // độ lệch mtime cho phép khi so "đã sync xong"

const AUTH_SALT_FALLBACK = 'english_for_me_salt_2026';

/** Fingerprint của AUTH_SALT — chỉ log/kèm metadata, KHÔNG log ra chính giá trị salt. */
function getSaltFingerprint(): string {
  const salt = process.env.AUTH_SALT || AUTH_SALT_FALLBACK;
  return crypto.createHash('sha256').update(salt).digest('hex').slice(0, 12);
}

/**
 * Auto-sync (watcher + upload/download tự động) mặc định CHỈ bật trên Vercel.
 * - DB_SYNC_AUTO=1 : bật ở mọi môi trường (dành cho self-hosted production).
 * - DB_SYNC_AUTO=0 : tắt hẳn (kể cả trên Vercel).
 * Lý do tắt ngoài Vercel: máy dev dùng chung bucket với production — nếu để
 * auto-upload thì DB dev (kèm AUTH_SALT fallback) sẽ ghi đè backup production
 * và làm "mất dữ liệu người dùng" trên web (một trong các nguyên nhân gốc).
 */
function autoSyncEnabled(): boolean {
  const flag = process.env.DB_SYNC_AUTO;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  return isVercel;
}

/** Môi trường production (upload tuân thủ nguyên tắc "không bao giờ ghi đè remote lạ"). */
function prodLike(): boolean {
  const flag = process.env.DB_SYNC_AUTO;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  return isVercel;
}

export interface SyncStatus {
  configured: boolean;
  endpoint: string;
  bucket: string;
  isSyncing: boolean;
  localExists: boolean;
  localSize: number;
  localLastModified: string | null;
  remoteExists: boolean;
  remoteSize: number | null;
  remoteLastModified: string | null;
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'success' | 'failed' | 'in_progress';
  lastSyncMessage: string;
  /** Có bật auto-sync (watcher) ở môi trường hiện tại không */
  autoSyncEnabled: boolean;
  /** ETag của bản remote mà instance này coi là "gốc" (null = chưa từng đồng bộ) */
  baseVersion: string | null;
}

// In-memory sync state
const state: {
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'success' | 'failed' | 'in_progress';
  lastSyncMessage: string;
} = {
  isSyncing: false,
  lastSyncTime: null,
  lastSyncStatus: 'idle',
  lastSyncMessage: 'Chưa thực hiện đồng bộ gần đây.',
};

// ---------------------------------------------------------------------------
// SYNC STATE (bản "gốc" của instance) — sync_state.json nằm cạnh file DB.
// Cùng định dạng với scripts/restore-s3.js và scripts/sync-to-filebase.mjs.
// ---------------------------------------------------------------------------
interface SyncState {
  v: 1;
  /** `etag:"..."` hoặc `lm:<ms>` — phiên bản remote mà cục bộ là hậu duệ của */
  baseVersion: string | null;
  /** thời điểm bản remote đó được ghi (ms) */
  baseTime: number;
  /** getDbFingerprint() tại thời điểm sync thành công (null nếu không biết) */
  fingerprint: string | null;
  updatedAt: string | null;
}

function readSyncState(): SyncState {
  try {
    const raw = fs.readFileSync(syncStatePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SyncState>;
    return {
      v: 1,
      baseVersion: typeof parsed.baseVersion === 'string' ? parsed.baseVersion : null,
      baseTime: typeof parsed.baseTime === 'number' ? parsed.baseTime : 0,
      fingerprint: typeof parsed.fingerprint === 'string' ? parsed.fingerprint : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return { v: 1, baseVersion: null, baseTime: 0, fingerprint: null, updatedAt: null };
  }
}

function writeSyncState(patch: Partial<SyncState>): void {
  try {
    const next: SyncState = { ...readSyncState(), ...patch, v: 1, updatedAt: new Date().toISOString() };
    const tmp = `${syncStatePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
    fs.renameSync(tmp, syncStatePath);
  } catch (err) {
    logger.warn('[S3 Sync] Không ghi được sync_state.json:', { error: err });
  }
}

// ---------------------------------------------------------------------------
// AUTO-SYNC WATCHER
// Every write (INSERT/UPDATE/DELETE) lands in the SQLite WAL file, so watching
// size+mtime of {db, -wal} catches ALL data changes without needing a
// hook inside each API route. (-shm KHÔNG tham gia fingerprint: nó là file
// lock/đ chỉ số, bị tạo lại mỗi lần mở DB → nếu tham gia thì mỗi cold start
// lại bị coi là "có thay đổi" và upload uổng 1 lần.)
// Changes are debounced so a burst of writes results in a single upload.
// ---------------------------------------------------------------------------
const AUTO_SYNC_POLL_MS = 10_000; // quét thay đổi mỗi 10 giây
// Trên Vercel instance có thể bị "đóng băng" ngay sau response → các mốc thời
// gian phải NGẮN hơn nhiều so với máy thường, nếu không thao tác ghi sẽ bị bỏ
// quên cho tới lúc instance chết (dữ liệu không bao giờ kịp lên S3).
const AUTO_SYNC_DEBOUNCE_MS = isVercel ? 5_000 : 15_000;
const AUTO_SYNC_MIN_INTERVAL_MS = isVercel ? 30_000 : 60_000;
const AUTO_SYNC_MAX_INTERVAL_MS = isVercel ? 2 * 60_000 : 10 * 60_000;
const AUTO_SYNC_RETRY_MIN_MS = isVercel ? 10_000 : 20_000; // retry khi lần trước thất bại/bị bỏ lỡ
const AUTO_SYNC_REMOTE_CHECK_MS = isVercel ? 60_000 : 5 * 60_000; // đối chiếu remote khi rảnh

// State + timer phải sống trên global: khi Next dev HMR reload module (sửa file
// là reload), state và timer trong module sẽ bị tạo lại/đứt. Giữ trên global thì
// vòng đồng bộ chạy xuyên suốt, không bị reset giữa chừng.
interface AutoSyncState {
  lastSyncedFingerprint: string;
  lastSeenFingerprint: string;
  lastChangeAt: number;
  dirtySince: number;
  lastUploadAt: number;
  /** yêu cầu upload lại sớm (lần trước bị bỏ lỡ/thất bại) */
  retryRequested: boolean;
  /** dataTime của bản cục bộ đã lưu vào CONFLICT_KEY (tránh backup trùng lặp) */
  lastBackupDataTime: number;
  /** thời điểm cuối đối chiếu ETag remote với base */
  lastRemoteCheckAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __autoSyncTimer: ReturnType<typeof setInterval> | undefined;
  // eslint-disable-next-line no-var
  var __autoSyncState: AutoSyncState | undefined;
  // eslint-disable-next-line no-var
  var __autoSyncTick: (() => Promise<void>) | undefined;
}

const autoSync: AutoSyncState = (global.__autoSyncState ??= {
  lastSyncedFingerprint: '', // fingerprint của trạng thái đã upload thành công
  lastSeenFingerprint: '', // fingerprint đã quét ở lần tick trước
  lastChangeAt: 0, // thời điểm phát hiện MỘT THAY ĐỔI MỚI (chỉ update khi fp đổi)
  dirtySince: 0, // thời điểm bắt đầu đợt thay đổi hiện tại
  lastUploadAt: 0,
  retryRequested: false,
  lastBackupDataTime: 0,
  lastRemoteCheckAt: 0,
});

/**
 * Fingerprint của DB = mtime/size của file chính + file WAL.
 * - Ghi dữ liệu mới → WAL đổi size/mtime → phát hiện được ngay.
 * - Checkpoint → file chính đổi mtime/size → cũng phát hiện được.
 * - File -shm bị loại trừ vì chỉ là lock index, thay đổi vô nghĩa.
 * ĐỊNH DÀNG NÀY PHẢI KHỚP VỚI localFingerprint() TRONG scripts/restore-s3.js
 * và scripts/sync-to-filebase.mjs (đọc cùng sync_state.json).
 */
function getDbFingerprint(): string {
  let main = 'missing';
  try {
    const st = fs.statSync(/*turbopackIgnore: true*/ dbPath);
    main = `${st.size}:${st.mtimeMs}`;
  } catch {}
  let wal = '0';
  try {
    const st = fs.statSync(/*turbopackIgnore: true*/ `${dbPath}-wal`);
    if (st.size > 0) wal = `${st.size}:${st.mtimeMs}`;
  } catch {}
  return `${main}|wal:${wal}`;
}

function markSynced(syncedFingerprint: string): void {
  autoSync.lastSyncedFingerprint = syncedFingerprint;
  autoSync.lastSeenFingerprint = syncedFingerprint;
  autoSync.dirtySince = 0;
  autoSync.lastChangeAt = 0;
  autoSync.lastUploadAt = Date.now();
  autoSync.retryRequested = false;
}

interface LocalDbInfo {
  exists: boolean;
  size: number;
  /** mtime lớn nhất giữa DB chính và WAL — "thời điểm ghi dữ liệu cục bộ" */
  dataTimeMs: number;
  headerOk: boolean;
}

function localDbInfo(): LocalDbInfo {
  const info: LocalDbInfo = { exists: false, size: 0, dataTimeMs: 0, headerOk: false };
  try {
    const st = fs.statSync(dbPath);
    info.exists = true;
    info.size = st.size;
    info.dataTimeMs = st.mtimeMs;
  } catch {}
  try {
    const st = fs.statSync(`${dbPath}-wal`);
    if (st.mtimeMs > info.dataTimeMs) info.dataTimeMs = st.mtimeMs;
  } catch {}
  if (info.exists && info.size >= 16) {
    try {
      const fd = fs.openSync(dbPath, 'r');
      const buf = Buffer.alloc(16);
      fs.readSync(fd, buf, 0, 16, 0);
      fs.closeSync(fd);
      info.headerOk = buf.toString('utf8', 0, 15).startsWith('SQLite format 3');
    } catch {}
  }
  return info;
}

interface RemoteInfo {
  version: string;
  etag: string | null;
  lastModifiedMs: number;
  size: number;
}

/** Định dạng phiên bản object — PHẢI giống nhau ở mọi nơi (xem scripts/restore-s3.js). */
function versionFromParts(etag: string | null | undefined, lastModifiedMs: number): string {
  return etag ? `etag:${etag}` : `lm:${lastModifiedMs}`;
}

/** HEAD object; trả về null nếu CHƯA có bản remote (404). Ném lỗi cho lỗi mạng thật sự. */
async function headRemote(s3: S3Client, bucket: string): Promise<RemoteInfo | null> {
  try {
    const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
    return {
      version: versionFromParts(h.ETag, h.LastModified?.getTime() || 0),
      etag: h.ETag ?? null,
      lastModifiedMs: h.LastModified?.getTime() || 0,
      size: h.ContentLength || 0,
    };
  } catch (e: any) {
    if (e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

/** Đếm user THẬT (loại admin/demo seed) — phân biệt "DB trống" với "DB có dữ liệu thật". */
function countRealUsers(): number {
  const sql = "SELECT COUNT(*) AS c FROM users WHERE username NOT IN ('admin', 'demo')";
  try {
    const inst = global.__dbInstance;
    if (inst && inst.open) {
      const row = inst.prepare(sql).get() as { c?: number } | undefined;
      return typeof row?.c === 'number' ? row.c : -1;
    }
  } catch {}
  try {
    if (!fs.existsSync(dbPath)) return -1;
    const tmp = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
      const row = tmp.prepare(sql).get() as { c?: number } | undefined;
      return typeof row?.c === 'number' ? row.c : -1;
    } finally {
      tmp.close();
    }
  } catch {
    return -1;
  }
}

function fileMd5(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const rs = fs.createReadStream(filePath);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
}

function stripQuotes(value: string): string {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
}

function isPlainMd5(etag: string): boolean {
  return /^[0-9a-fA-F]{32}$/.test(stripQuotes(etag));
}

/**
 * Bản cục bộ có thay đổi so với lần sync S3 gần nhất không?
 * Ưu tiên so fingerprint (chính xác tuyệt đối); thiếu fingerprint thì so thời gian.
 */
function isLocalDirty(st: SyncState, local: LocalDbInfo): boolean {
  if (!st.baseVersion) return true; // chưa từng đồng bộ → coi như có thay đổi cần xử lý
  if (st.fingerprint) return st.fingerprint !== getDbFingerprint();
  return local.dataTimeMs > st.baseTime + DIRTY_EPSILON_MS;
}

function closeDbIfOpen(): void {
  try {
    if (global.__dbInstance) global.__dbInstance.close();
  } catch {}
  global.__dbInstance = undefined;
}

/** Checkpoint WAL đồng bộ — mở connection tạm nếu instance chưa được mở. */
function checkpointLocalDb(): void {
  try {
    const inst = global.__dbInstance;
    if (inst && inst.open) {
      const res = inst.pragma('wal_checkpoint(TRUNCATE)') as Array<Record<string, number>>;
      if (res?.[0]?.busy) logger.warn('[S3 Sync] WAL checkpoint busy:', { result: res });
      return;
    }
    if (fs.existsSync(dbPath)) {
      const tmp = new Database(dbPath, { fileMustExist: true });
      try {
        tmp.pragma('wal_checkpoint(TRUNCATE)');
      } finally {
        tmp.close();
      }
    }
  } catch (err) {
    logger.warn('[S3 Sync] WAL checkpoint warning:', { error: err });
  }
}

/**
 * Upload file chính lên S3. Tắt wal_autocheckpoint trong lúc stream để connection
 * không được phép ghi vào file chính giữa chừng (nếu không upload sẽ bị "rách").
 */
async function sendPut(s3: S3Client, bucket: string, ifMatch: string | null): Promise<{ ETag?: string }> {
  const inst = global.__dbInstance;
  const canPragma = !!(inst && inst.open);
  if (canPragma) {
    try {
      inst!.pragma('wal_autocheckpoint = 0');
    } catch {}
  }
  try {
    return await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: DB_FILENAME,
        Body: fs.createReadStream(dbPath),
        ContentType: 'application/octet-stream',
        ...(ifMatch ? { IfMatch: ifMatch } : {}),
        Metadata: {
          'salt-fingerprint': getSaltFingerprint(),
          'uploaded-at': new Date().toISOString(),
        },
      })
    );
  } finally {
    if (canPragma) {
      try {
        inst!.pragma('wal_autocheckpoint = 1000');
      } catch {}
    }
  }
}

type PutOutcome =
  | { ok: true; etag: string | null }
  | { ok: false; conflict: boolean; unsupported: boolean; error: unknown };

/** PutObject có điều kiện; phân loại 412/409 (xung đột) và lỗi không hỗ trợ If-Match. */
async function putWithCas(s3: S3Client, bucket: string, ifMatch: string | null): Promise<PutOutcome> {
  try {
    const res = await sendPut(s3, bucket, ifMatch);
    return { ok: true, etag: res.ETag ?? null };
  } catch (error: any) {
    const code = error?.$metadata?.httpStatusCode;
    if (code === 412 || code === 409 || error?.name === 'PreconditionFailed') {
      return { ok: false, conflict: true, unsupported: false, error };
    }
    // Một số bản S3-compatible (Filebase...) có thể chưa hỗ trợ If-Match → 400/501
    if (ifMatch && (code === 400 || code === 501)) {
      return { ok: false, conflict: false, unsupported: true, error };
    }
    throw error;
  }
}

/** Lưu bản cục bộ (bên thua xung đột) vào CONFLICT_KEY trước khi bị thay thế. */
async function backupLocalToS3(s3: S3Client, bucket: string, local: LocalDbInfo, reason: string): Promise<boolean> {
  // Đã lưu đúng dữ liệu này rồi thì khỏi lưu lại (tiết kiệm, tránh lặp vô hạn)
  if (local.dataTimeMs <= autoSync.lastBackupDataTime) return true;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: CONFLICT_KEY,
        Body: fs.createReadStream(dbPath),
        ContentType: 'application/octet-stream',
        Metadata: {
          reason,
          'local-data-time': String(local.dataTimeMs),
          'salt-fingerprint': getSaltFingerprint(),
          'saved-at': new Date().toISOString(),
        },
      })
    );
    autoSync.lastBackupDataTime = local.dataTimeMs;
    logger.error(`[S3 Sync] Đã lưu bản cục bộ sắp bị thay vào key '${CONFLICT_KEY}' (lý do: ${reason}).`);
    return true;
  } catch (err) {
    logger.error('[S3 Sync] KHÔNG lưu được bản sao bản cục bộ — hủy thao tác để tránh mất dữ liệu:', {
      key: CONFLICT_KEY,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/** Lưu bản remote cũ vào SUPERSEDED_KEY trước khi bị push (máy dev) ghi đè. */
async function backupRemoteToS3(s3: S3Client, bucket: string): Promise<boolean> {
  try {
    const g = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
    if (!g.Body) return false;
    const buffer = Buffer.from(await g.Body.transformToByteArray());
    const header = buffer.subarray(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) return false;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: SUPERSEDED_KEY,
        Body: buffer,
        ContentType: 'application/octet-stream',
        Metadata: { reason: 'pre-push-backup', 'saved-at': new Date().toISOString() },
      })
    );
    logger.warn(`[S3 Sync] Đã lưu bản remote cũ vào key '${SUPERSEDED_KEY}' trước khi push.`);
    return true;
  } catch (err) {
    logger.error('[S3 Sync] KHÔNG lưu được bản remote cũ — HỦYS push để tránh mất dữ liệu:', {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

async function autoSyncTick(): Promise<void> {
  if (!getS3Client() || state.isSyncing) return;

  const fp = getDbFingerprint();
  const now = Date.now();

  if (!autoSync.lastSyncedFingerprint) {
    // Chưa từng sync: lấy trạng thái hiện tại làm mốc, không upload ngay.
    markSynced(fp);
    return;
  }

  if (fp === autoSync.lastSyncedFingerprint) {
    autoSync.lastSeenFingerprint = fp;
    // Không có thay đổi cục bộ → thỉnh thoảng đối chiếu xem remote có bị bản
    // instance khác/ script thủ công đẩy lên không (instance rảnh vẫn phải rejoin).
    if (now - autoSync.lastRemoteCheckAt >= AUTO_SYNC_REMOTE_CHECK_MS) {
      autoSync.lastRemoteCheckAt = now;
      await reconcileWithRemote('idle-check');
    }
    return;
  }

  if (!autoSync.dirtySince) autoSync.dirtySince = now;

  // Chỉ cập nhật lastChangeAt khi ĐÚNG CÓ THAY ĐỔI MỚI so với lần quét trước.
  // Nếu update mỗi tick thì delta luôn = chu kỳ poll -> debounce không bao giờ kích hoạt.
  if (fp !== autoSync.lastSeenFingerprint) {
    autoSync.lastChangeAt = now;
    autoSync.lastSeenFingerprint = fp;
    logger.info('[S3 AutoSync] Change detected. Waiting for debounce...', {
      quietMs: AUTO_SYNC_DEBOUNCE_MS,
      sinceLastUploadMs: now - autoSync.lastUploadAt,
    });
  }

  const quietLongEnough = now - autoSync.lastChangeAt >= AUTO_SYNC_DEBOUNCE_MS;
  const maxWaitExceeded = now - autoSync.dirtySince >= AUTO_SYNC_MAX_INTERVAL_MS;
  const minIntervalOk = now - autoSync.lastUploadAt >= AUTO_SYNC_MIN_INTERVAL_MS;
  // Lần trước bị bỏ lỡ/thất bại → cho upload lại sớm hơn hạn mức tối thiểu
  const retryOk = autoSync.retryRequested && now - autoSync.lastUploadAt >= AUTO_SYNC_RETRY_MIN_MS;

  if ((quietLongEnough || maxWaitExceeded || retryOk) && (minIntervalOk || retryOk)) {
    logger.info('[S3 AutoSync] DB changed detected -> uploading to Filebase.');
    // uploadDbToS3() tự markSynced() ở bên trong khi thành công
    await uploadDbToS3();
  }
}

/**
 * Đối chiếu bản remote hiện tại với base của instance và chọn hướng xử lý:
 * - thiếu base → tải về để tái đồng bộ;
 * - remote giống base → chỉ local có đổi mới upload (watcher lo phần đó);
 * - remote đổi, local sạch → tải về (rejoin fleet);
 * - remote đổi, local bẩn → upload (uploadDbToS3 sẽ tự phân xử xung đột).
 */
async function reconcileWithRemote(trigger: string): Promise<void> {
  if (state.isSyncing) return;
  const s3 = getS3Client();
  if (!s3) return;
  const bucket = getBucketName();

  let head: RemoteInfo | null;
  try {
    head = await headRemote(s3, bucket);
  } catch (err) {
    logger.warn('[S3 AutoSync] Không đọc được metadata remote để đối chiếu:', {
      trigger,
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const st = readSyncState();
  const local = localDbInfo();
  const localValid = local.exists && local.headerOk && local.size >= MIN_VALID_DB_BYTES;

  if (!head) {
    if (localValid) {
      logger.info('[S3 AutoSync] Chưa có bản remote nào -> publish lần đầu.', { trigger });
      await uploadDbToS3();
    }
    return;
  }

  if (!st.baseVersion) {
    logger.info('[S3 AutoSync] Chưa có baseVersion -> tải bản Filebase về để tái đồng bộ.', { trigger });
    await downloadDbFromS3();
    return;
  }

  if (st.baseVersion === head.version) return; // remote không đổi

  const dirty = isLocalDirty(st, local);
  if (dirty) {
    logger.info('[S3 AutoSync] Remote đổi và cục bộ có thay đổi -> upload (tự xử lý xung đột).', { trigger });
    await uploadDbToS3();
  } else {
    logger.info('[S3 AutoSync] Remote mới hơn, cục bộ không đổi -> tải về.', { trigger });
    await downloadDbFromS3();
  }
}

/**
 * Làm tươi DB NGAY TRƯỚC KHI PHỤC VỤ ĐỌC QUAN TRỌNG (login, danh sách phòng...):
 * trên Vercel mỗi instance có bản SQLite riêng trong /tmp — instance lạnh có thể
 * đang giữ bản cũ (user vừa đăng ký/đổi MK/tạo phòng ở instance khác) nên trả
 * về "sai mật khẩu" hoặc danh sách phòng rỗng dù dữ liệu đã có trên Filebase.
 *
 * Quy tắc:
 * - chỉ gọi khi auto-sync bật (ngoài Vercel → no-op);
 * - THROTTLE: mỗi instance tối đa 1 lần / READ_REFRESH_MIN_INTERVAL_MS (một
 *   HEAD metadata là network call, không cho phép gọi sau mỗi request);
 * - remote không đổi → không làm gì; cục bộ đang có ghi chưa upload → KHÔNG
 *   tải (để watcher tự phân xử xung đột, tránh đạp lên ghi mới);
 * - remote mới hơn + cục bộ sạch → downloadDbFromS3() (quy tắc an toàn riêng).
 * Lỗi mạng nuốt trong catch — không bao giờ làm hỏng request.
 *
 * @param opts.force bỏ qua throttle 15s/instance. Chỉ dùng khi request đang
 *   tra cứu một bản ghi mà instance KHÔNG CÓ (user vừa đăng ký ở instance khác):
 *   đây là lúc instance lạnh có bản /tmp cũ, không throttle thì người dùng phải
 *   thử lại nhiều lần mới vào được. Vẫn chặn khi đang sync để không tranh nhau.
 * @returns true nếu vừa tải bản mới về (request nên đọc lại DB).
 */
let lastReadRefreshAt = 0;
const READ_REFRESH_MIN_INTERVAL_MS = isVercel ? 15_000 : 60_000;

export async function refreshIfRemoteNewer(trigger: string, opts?: { force?: boolean }): Promise<boolean> {
  if (!autoSyncEnabled()) return false;
  if (state.isSyncing) return false;
  const now = Date.now();
  if (!opts?.force && now - lastReadRefreshAt < READ_REFRESH_MIN_INTERVAL_MS) return false;
  lastReadRefreshAt = now;

  const s3 = getS3Client();
  if (!s3) return false;
  const bucket = getBucketName();
  try {
    const head = await headRemote(s3, bucket);
    if (!head) return false;
    const st = readSyncState();
    // Đã là bản mới nhất (hoặc chưa từng sync → cold-start restore lo phần này)
    if (!st.baseVersion || st.baseVersion === head.version) return false;
    const local = localDbInfo();
    if (isLocalDirty(st, local)) return false; // cục bộ có ghi chờ upload → không đụng

    logger.info('[S3 Sync] Read-refresh: remote mới hơn bản cục bộ → tải về trước khi phục vụ request.', {
      trigger,
    });
    return await downloadDbFromS3();
  } catch (err) {
    logger.warn('[S3 Sync] Read-refresh failed (bỏ qua, vẫn phục vụ dữ liệu hiện có):', {
      trigger,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Bật vòng lặp tự động đồng bộ DB lên Filebase khi có thay đổi dữ liệu.
 * An toàn khi gọi nhiều lần (chỉ khởi tạo 1 timer duy nhất, chống HMR/dev reload).
 */
export function startAutoSync(): void {
  if (typeof window !== 'undefined') return;

  if (!autoSyncEnabled()) {
    // Ngoài Vercel (hoặc DB_SYNC_AUTO=0): TỰ ĐỘNG upload TẮT để DB máy dev
    // không bao giờ ghi đè backup production. Đồng bộ thủ công vẫn dùng được:
    //   - node scripts/sync-to-filebase.mjs  (đẩy local -> Filebase)
    //   - POST /api/sync                     (admin, có quy tắc an toàn riêng)
    logger.info(
      '[S3 AutoSync] Auto-sync TẮT ở môi trường này (mặc định chỉ bật trên Vercel). ' +
        'Đặt DB_SYNC_AUTO=1 để bật, hoặc dùng scripts/sync-to-filebase.mjs / POST /api/sync để đồng bộ thủ công.'
    );
    return;
  }

  // Luôn cập nhật ref tới tick của module hiện tại (sau HMR reload, timer cũ
  // vẫn chạy nhưng sẽ gọi phiên bản code mới nhất).
  global.__autoSyncTick = autoSyncTick;

  if (global.__autoSyncTimer) return; // timer đã chạy, không tạo thêm
  if (!getS3Client()) {
    logger.warn('[S3 AutoSync] Filebase credentials missing. Auto-sync disabled.');
    return;
  }

  autoSync.lastSyncedFingerprint = getDbFingerprint();
  autoSync.lastUploadAt = Date.now(); // không upload ngay khi vừa khởi động

  global.__autoSyncTimer = setInterval(() => {
    const tick = global.__autoSyncTick;
    if (!tick) return;
    tick().catch((err) => logger.error('[S3 AutoSync] Tick failed:', { error: err }));
  }, AUTO_SYNC_POLL_MS);

  // Chạy 1 lần sau khi server ổn định để bắt đầu từ trạng thái đã đồng bộ
  setTimeout(() => {
    autoSyncTick().catch(() => {});
  }, 5_000);

  // Cold-start: nếu instrumentation tải trước đó thất bại (thiếu marker) thì thử lại.
  // Việc download ĐI THEO QUY TẮC THỨ TỰ (chỉ thay khi an toàn) — không ép buộc ghi đè.
  setTimeout(() => {
    (async () => {
      try {
        if (fs.existsSync(markerPath)) return;
        logger.info('[S3 AutoSync] Chưa có marker khôi phục -> thử tải lại DB từ Filebase...');
        await downloadDbFromS3();
      } catch (err) {
        logger.warn('[S3 AutoSync] Cold-start restore check failed:', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }, 1_000);

  // Sau khi hệ thống ổn định: đối chiếu local/remote theo quy tắc thứ tự
  // (thay cho logic "local mtime mới hơn là upload" trước đây — mtime dễ giả mạo
  // sau khi restore nên rất dễ ghi đè oan).
  setTimeout(() => {
    reconcileWithRemote('startup').catch((err) =>
      logger.warn('[S3 AutoSync] Startup reconcile failed:', { error: err })
    );
  }, 8_000);

  logger.info('[S3 AutoSync] Started. Watching DB changes for Filebase upload.', {
    pollSeconds: AUTO_SYNC_POLL_MS / 1000,
    debounceSeconds: AUTO_SYNC_DEBOUNCE_MS / 1000,
    minIntervalSeconds: AUTO_SYNC_MIN_INTERVAL_MS / 1000,
    maxDirtySeconds: AUTO_SYNC_MAX_INTERVAL_MS / 1000,
  });
}

export function getS3Client(): S3Client | null {
  const S3_ENDPOINT = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
  // KHÔNG hardcode khoá: secret chỉ lấy từ biến môi trường. Khoá nằm trong
  // source = ai đọc được repo là nắm được toàn bộ database production.
  const S3_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY || '';
  const S3_SECRET_KEY = process.env.FILEBASE_SECRET_KEY || '';
  const rawRegion = process.env.FILEBASE_REGION;
  const S3_REGION = (rawRegion && rawRegion !== 'auto') ? rawRegion : 'us-east-1';

  if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
    return null;
  }

  return new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });
}

function getBucketName(): string {
  return process.env.FILEBASE_BUCKET_NAME || 'meowlish-db';
}

/**
 * Gọi đồng bộ ngay lập tức lên Filebase S3 sau khi có mutation quan trọng (Register, Password, Coins, Admin)
 *
 * Ngoài Vercel (auto-sync tắt) hàm này là no-op — dùng POST /api/sync hoặc
 * scripts/sync-to-filebase.mjs để đẩy thủ công.
 */
export async function syncDbToS3Now(): Promise<boolean> {
  if (!autoSyncEnabled()) {
    state.lastSyncMessage =
      'Auto-sync đang tắt ở môi trường này. Dùng POST /api/sync hoặc node scripts/sync-to-filebase.mjs để đồng bộ thủ công.';
    logger.info('[S3 Sync] syncDbToS3Now bị bỏ qua vì auto-sync đang tắt.');
    return false;
  }
  try {
    const p = uploadDbToS3();
    // Kéo dài thời gian sống của serverless function trên Vercel: nếu đang nằm trong
    // request context của Next.js thì đăng ký upload vào waitUntil, để thao tác
    // quan trọng (đăng ký/đổi mật khẩu) không bị kill ngay khi response đã gửi.
    try {
      const ctx = (globalThis as Record<symbol, { get?: () => { waitUntil?: (p: Promise<unknown>) => void } }>)[
        Symbol.for('@next/request-context')
      ]?.get?.();
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(Promise.resolve(p).catch(() => {}));
      }
    } catch {}
    return await p;
  } catch (err) {
    logger.warn('[S3 Sync] syncDbToS3Now warning:', { error: err });
    return false;
  }
}

/**
 * Lấy thông tin trạng thái đồng bộ S3 Filebase
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const endpoint = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
  const st = readSyncState();

  const localExists = fs.existsSync(dbPath);
  let localSize = 0;
  let localLastModified: string | null = null;

  if (localExists) {
    try {
      const stats = fs.statSync(dbPath);
      localSize = stats.size;
      localLastModified = stats.mtime.toISOString();
    } catch {}
  }

  if (!s3) {
    return {
      configured: false,
      endpoint,
      bucket,
      isSyncing: state.isSyncing,
      localExists,
      localSize,
      localLastModified,
      remoteExists: false,
      remoteSize: null,
      remoteLastModified: null,
      lastSyncTime: state.lastSyncTime,
      lastSyncStatus: state.lastSyncStatus,
      lastSyncMessage: 'Chưa cấu hình khoá API Filebase S3 trong .env.local',
      autoSyncEnabled: autoSyncEnabled(),
      baseVersion: st.baseVersion,
    };
  }

  let remoteExists = false;
  let remoteSize: number | null = null;
  let remoteLastModified: string | null = null;

  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
    remoteExists = true;
    remoteSize = head.ContentLength || null;
    remoteLastModified = head.LastModified ? head.LastModified.toISOString() : null;
  } catch (e: any) {
    if (e.name !== 'NotFound' && e.$metadata?.httpStatusCode !== 404) {
      logger.warn('[S3 Sync] Could not fetch remote metadata:', { error: e.message });
    }
  }

  return {
    configured: true,
    endpoint,
    bucket,
    isSyncing: state.isSyncing,
    localExists,
    localSize,
    localLastModified,
    remoteExists,
    remoteSize,
    remoteLastModified,
    lastSyncTime: state.lastSyncTime,
    lastSyncStatus: state.lastSyncStatus,
    lastSyncMessage: state.lastSyncMessage,
    autoSyncEnabled: autoSyncEnabled(),
    baseVersion: st.baseVersion,
  };
}

// ---------------------------------------------------------------------------
// DOWNLOAD / RESTORE
// ---------------------------------------------------------------------------

/**
 * Tải database từ Filebase về local theo QUY TẮC THỨ TỰ:
 * - local trống/hỏng → tải (không có gì để mất);
 * - local là đúng bản remote hiện tại → GIỮ local (phòng khi có ghi mới chưa upload);
 * - remote khác bản của instance → remote thắng, nhưng bản cục bộ có dữ liệu
 *   riêng sẽ được lưu vào CONFLICT_KEY trước khi bị thay.
 * (Trước đây có tham số `force` ép ghi đè bất chấp — đó là một trong các nguyên
 * nhân gây rollback mật khẩu; QUY TẮC THAY THẾ: không bao giờ ép ghi đè.)
 */
export async function downloadDbFromS3(): Promise<boolean> {
  const s3 = getS3Client();
  const bucket = getBucketName();

  if (!s3) {
    logger.warn('[S3 Sync] Filebase credentials not configured. Skipping download.');
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'Chưa cấu hình khoá API Filebase S3.';
    return false;
  }

  if (state.isSyncing) {
    logger.warn('[S3 Sync] Sync operation already in progress.');
    return false;
  }

  state.isSyncing = true;
  state.lastSyncStatus = 'in_progress';
  state.lastSyncMessage = 'Đang kiểm tra và tải cơ sở dữ liệu từ Filebase...';
  try {
    return await doDownloadLocked(s3, bucket);
  } finally {
    state.isSyncing = false;
  }
}

/** Phần lõi của download — CHỈ gọi khi đã giữ lock state.isSyncing. */
async function doDownloadLocked(s3: S3Client, bucket: string, knownHead?: RemoteInfo | null): Promise<boolean> {
  let head: RemoteInfo | null;
  if (knownHead === undefined) {
    try {
      head = await headRemote(s3, bucket);
    } catch (e: any) {
      logger.error('[S3 Sync] Không đọc được metadata Filebase:', { error: e });
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = `Không đọc được metadata Filebase: ${e.message || 'lỗi không xác định'}`;
      return false;
    }
  } else {
    head = knownHead;
  }

  if (!head) {
    logger.info('[S3 Sync] No remote database found on Filebase.');
    state.lastSyncStatus = 'idle';
    state.lastSyncMessage = 'Chưa có bản sao lưu trên Filebase S3.';
    return false;
  }

  const local = localDbInfo();
  const st = readSyncState();
  const localValid = local.exists && local.headerOk && local.size >= MIN_VALID_DB_BYTES;

  if (localValid) {
    // (a) Đang giữ đúng bản remote này → giữ nguyên (phòng ghi mới chưa upload)
    if (st.baseVersion && st.baseVersion === head.version) {
      logger.info('[S3 Sync] Local database is up to date with Filebase.');
      state.lastSyncStatus = 'success';
      state.lastSyncTime = new Date().toISOString();
      state.lastSyncMessage = 'Cơ sở dữ liệu cục bộ đã ở phiên bản mới nhất.';
      if (!fs.existsSync(markerPath)) {
        try {
          fs.writeFileSync(markerPath, new Date().toISOString());
        } catch {}
      }
      return false;
    }

    // (b) Mất sync_state nhưng nội dung y hệt remote → chỉ cần nhận lại base
    if (!st.baseVersion && head.etag && head.size === local.size && isPlainMd5(head.etag)) {
      try {
        const md5 = await fileMd5(dbPath);
        if (md5 === stripQuotes(head.etag)) {
          writeSyncState({ baseVersion: head.version, baseTime: head.lastModifiedMs, fingerprint: getDbFingerprint() });
          logger.info('[S3 Sync] Cục bộ trùng khớp hoàn toàn với Filebase -> chỉ cập nhật baseVersion.');
          state.lastSyncStatus = 'success';
          state.lastSyncTime = new Date().toISOString();
          state.lastSyncMessage = 'Cơ sở dữ liệu trùng khớp với Filebase (mới cập nhật baseVersion).';
          return false;
        }
      } catch (err) {
        logger.warn('[S3 Sync] Không tính được MD5 cục bộ:', { error: err });
      }
    }

    // (c) Còn lại: remote KHÁC bản cục bộ.
    //     Nếu bản cục bộ có dữ liệu riêng (dirty / chưa từng sync) thì PHẢI lưu
    //     vào CONFLICT_KEY trước; lưu thất bại → hủy download để không mất dữ liệu.
    const needsBackup = (!st.baseVersion || isLocalDirty(st, local)) && countRealUsers() !== 0;
    if (needsBackup) {
      const ok = await backupLocalToS3(s3, bucket, local, 'remote-newer-or-forked');
      if (!ok) {
        state.lastSyncStatus = 'failed';
        state.lastSyncMessage =
          `Không thể lưu bản sao cục bộ vào '${CONFLICT_KEY}' — HỦU download để tránh mất dữ liệu.`;
        return false;
      }
    }
  }

  // --- Tải về và thay thế (atomic) ---
  logger.info('[S3 Sync] Downloading database from Filebase...', { remote: head.version });
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
    if (!response.Body) throw new Error('S3 GetObject returned empty body');
    const buffer = Buffer.from(await response.Body.transformToByteArray());
    // Dùng ETag của CHÍNH file vừa tải (không dùng ETag của HEAD trước đó) —
    // nếu có instance khác upload giữa 2 lời gọi thì base vẫn trúng phiên bản thật.
    const baseVersion = response.ETag ? versionFromParts(response.ETag, head.lastModifiedMs) : head.version;

    // Xác thực SQLite header hợp lệ trước khi ghi đè
    const header = buffer.subarray(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      throw new Error('Dữ liệu tải về từ S3 không phải là tệp SQLite hợp lệ!');
    }

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Đóng kết nối SQLite hiện tại trước khi ghi đè file để tránh file-lock / corruption
    closeDbIfOpen();

    // Xóa các file WAL và SHM cũ — nếu giữ lại, SQLite sẽ replay WAL của bản cũ
    // lên file mới → dữ liệu hỗn tạp / rollback khó hiểu.
    try {
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    } catch {}

    // Ghi tạm rồi rename: nếu bị kill giữa chừng thì DB cũ vẫn còn nguyên vẹn
    const tmpPath = `${dbPath}.restore.tmp`;
    try {
      fs.writeFileSync(tmpPath, buffer);
      fs.renameSync(tmpPath, dbPath);
    } catch (err) {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {}
      throw err;
    }

    // Ghi marker + baseVersion (đồng bộ nguyên tử với lúc thay file)
    try {
      fs.writeFileSync(markerPath, new Date().toISOString());
    } catch {}
    writeSyncState({
      baseVersion,
      baseTime: head.lastModifiedMs,
      fingerprint: getDbFingerprint(),
    });
    // Nội dung vừa tải lên làm mốc: tránh vòng watcher upload ngay lại 1 lần uổng công
    markSynced(getDbFingerprint());

    logger.info('[S3 Sync] Successfully downloaded and restored database from Filebase.');
    state.lastSyncStatus = 'success';
    state.lastSyncTime = new Date().toISOString();
    state.lastSyncMessage = 'Đã khôi phục thành công cơ sở dữ liệu từ Filebase S3!';
    return true;
  } catch (error: any) {
    logger.error('[S3 Sync] Error downloading database:', { error });
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = `Lỗi tải: ${error.message || 'Lỗi không xác định'}`;
    return false;
  }
}

// ---------------------------------------------------------------------------
// UPLOAD
// ---------------------------------------------------------------------------

/**
 * Tải cơ sở dữ liệu hiện tại lên Filebase S3 theo QUY TẮC THỨ TỰ:
 * - phải là hậu duệ của bản remote hiện tại (baseVersion === ETag) → dùng
 *   If-Match (conditional write), không bao giờ ghi đè instance khác vừa ghi;
 * - chưa từng sync → KHÔNG upload (chống DB trống ghi đè backup thật);
 * - xung đột → bản cục bộ lưu vào CONFLICT_KEY, remote thắng và được tải về.
 */
export async function uploadDbToS3(): Promise<boolean> {
  const s3 = getS3Client();
  const bucket = getBucketName();

  if (!s3) {
    logger.warn('[S3 Sync] Filebase credentials not configured. Skipping upload.');
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'Chưa cấu hình khoá API Filebase S3.';
    return false;
  }

  if (!fs.existsSync(dbPath)) {
    logger.warn('[S3 Sync] Local database file does not exist at:', dbPath);
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'Không tìm thấy tệp cơ sở dữ liệu cục bộ.';
    return false;
  }

  if (state.isSyncing) {
    let waits = 0;
    while (state.isSyncing && waits < 10) {
      await new Promise((r) => setTimeout(r, 400));
      waits++;
    }
    if (state.isSyncing) {
      // Không bỏ cuộc: yêu cầu vòng tick upload lại sớm (đừng để thao tác ghi bị quên)
      autoSync.retryRequested = true;
      logger.warn('[S3 Sync] Another sync operation is currently running. Sẽ upload lại sớm.');
      state.lastSyncMessage = 'Đang có thao tác đồng bộ khác chạy, sẽ upload lại sớm.';
      return false;
    }
  }

  state.isSyncing = true;
  state.lastSyncStatus = 'in_progress';
  state.lastSyncMessage = 'Đang đồng bộ cơ sở dữ liệu lên Filebase S3...';

  try {
    return await uploadLocked(s3, bucket);
  } catch (error: any) {
    if (error?.name === 'NoSuchBucket') {
      try {
        logger.info(`[S3 Sync] Bucket '${bucket}' does not exist. Creating it now...`);
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        logger.info(`[S3 Sync] Bucket created! Retrying upload...`);
        return await uploadLocked(s3, bucket);
      } catch (createErr: any) {
        logger.error('[S3 Sync] Failed to create bucket on Filebase:', { error: createErr });
        state.lastSyncStatus = 'failed';
        state.lastSyncMessage = `Không thể tạo bucket trên Filebase: ${createErr.message}`;
        autoSync.retryRequested = true;
        return false;
      }
    }

    logger.error('[S3 Sync] Error uploading database:', { error });
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = `Lỗi tải lên Filebase: ${error.message || 'Lỗi không xác định'}`;
    autoSync.retryRequested = true;
    return false;
  } finally {
    state.isSyncing = false;
  }
}

/** Phần lõi của upload — CHỈ gọi khi đã giữ lock state.isSyncing. */
async function uploadLocked(s3: S3Client, bucket: string): Promise<boolean> {
  // 1. Checkpoint WAL trước: mọi transaction mới nhất phải nằm trong file chính.
  checkpointLocalDb();
  // Fingerprint NGAY SAU checkpoint, TRƯỚC khi stream: trạng thái thực sự sẽ được đưa lên.
  // Ghi xảy ra trong lúc upload sẽ tạo fingerprint khác -> vòng auto-sync tự phát hiện ở tick sau.
  const uploadedFingerprint = getDbFingerprint();
  const local = localDbInfo();

  // 2. Chốt an toàn: file phải là SQLite hợp lệ
  if (!local.exists || !local.headerOk || local.size < MIN_VALID_DB_BYTES) {
    logger.warn('[S3 Safety Guard] Từ chối upload: file cục bộ không phải SQLite hợp lệ hoặc quá nhỏ.', {
      size: local.size,
      headerOk: local.headerOk,
    });
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'Huỷ upload: tệp cục bộ không hợp lệ / chưa nạp đủ dữ liệu.';
    return false;
  }

  // 3. Đọc metadata bản remote hiện tại (404 → null, lỗi mạng → ném ra ngoài)
  const head = await headRemote(s3, bucket);
  const st = readSyncState();

  // --- Chưa có bản remote nào → publish lần đầu (không có gì để ghi đè) ---
  if (!head) {
    const put = await putWithCas(s3, bucket, null);
    if (!put.ok) throw put.error;
    return finishUpload(put.etag, uploadedFingerprint, 'Đã tạo bản sao lưu đầu tiên trên Filebase S3! 🚀');
  }

  // --- Chống "DB trống ghi đè backup thật" (nguyên nhân gốc của hiện tượng mất tài khoản):
  // chưa từng tải remote về + remote có dữ liệu thật + local chỉ có admin/demo seed
  // → KHÔNG upload, tải bản remote về ngay thay vì ghi đè. ---
  if (!st.baseVersion && head.size >= REMOTE_REAL_DB_BYTES && countRealUsers() === 0) {
    logger.error(
      '[S3 Safety Guard] BẢO VỆ DỮ LIỆU: DB cục bộ chưa từng đồng bộ và chỉ có tài khoản mặc định — ' +
        'từ chối upload, tải bản Filebase về thay thế.'
    );
    await doDownloadLocked(s3, bucket, head);
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage =
      'Huỷ upload: tệp cục bộ chưa nạp đủ dữ liệu (chưa từng đồng bộ) — đã tải lại bản từ Filebase để tránh ghi đè!';
    return false;
  }

  // --- Là hậu duệ hợp lệ của chính bản remote hiện tại → upload có điều kiện (CAS) ---
  if (st.baseVersion && st.baseVersion === head.version) {
    let put = await putWithCas(s3, bucket, head.etag);
    if (!put.ok && put.unsupported) {
      // Filebase có thể chưa hỗ trợ If-Match → xác minh remote vẫn là base rồi upload thường
      logger.warn('[S3 Sync] Server không hỗ trợ If-Match — kiểm tra lại điều kiện trước khi upload thường.', {
        error: put.error instanceof Error ? put.error.message : String(put.error),
      });
      const again = await headRemote(s3, bucket);
      if (!again || again.version !== head.version) {
        put = { ok: false, conflict: true, unsupported: false, error: put.error };
      } else {
        put = await putWithCas(s3, bucket, null);
      }
    }
    if (!put.ok && put.conflict) {
      // Instance khác vừa ghi lên remote trong lúc mình chuẩn bị upload → xung đột
      const now = await headRemote(s3, bucket);
      if (!now) {
        // Remote biến mất giữa chừng → không còn gì để ghi đè, publish lại bình thường
        const publish = await putWithCas(s3, bucket, null);
        if (!publish.ok) throw publish.error;
        return finishUpload(publish.etag, uploadedFingerprint, 'Đã đồng bộ lên Filebase (remote trước đó đã biến mất).');
      }
      if (now.version !== head.version) {
        logger.error('[S3 Sync] XUNG ĐỘT (412): remote đổi giữa lúc HEAD và PUT — nhường cho bản mới hơn.');
        return await forkRejoin(s3, bucket, now, local);
      }
      // ETag không đổi nhưng server không chấp nhận điều kiện → thử upload thường một lần
      put = await putWithCas(s3, bucket, null);
      if (!put.ok) throw put.error;
    }
    if (put.ok) {
      return finishUpload(put.etag, uploadedFingerprint, 'Đồng bộ cơ sở dữ liệu lên Filebase S3 thành công 100%! 🚀');
    }
    throw put.error;
  }

  // --- Mất sync_state nhưng nội dung y hệt remote → chỉ nhận lại base, không cần upload ---
  if (!st.baseVersion && head.etag && head.size === local.size && isPlainMd5(head.etag)) {
    const md5 = await fileMd5(dbPath);
    if (md5 === stripQuotes(head.etag)) {
      writeSyncState({ baseVersion: head.version, baseTime: head.lastModifiedMs, fingerprint: uploadedFingerprint });
      markSynced(uploadedFingerprint);
      state.lastSyncStatus = 'success';
      state.lastSyncTime = new Date().toISOString();
      state.lastSyncMessage = 'Cơ sở dữ liệu trùng khớp với Filebase (đã nhận lại baseVersion).';
      return true;
    }
  }

  // --- Máy dev push CHỦ ĐỘNG (ngoài production): được phép ghi đè, nhưng LUÔN
  // lưu bản remote cũ vào SUPERSEDED_KEY trước để không bao giờ mất dữ liệu. ---
  if (!prodLike()) {
    if (head.size >= REMOTE_REAL_DB_BYTES && countRealUsers() === 0) {
      logger.error('[S3 Safety Guard] Push từ chối: cục bộ chỉ có tài khoản mặc định, tải bản remote về thay thế.');
      await doDownloadLocked(s3, bucket, head);
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = 'Huỷ push: tệp cục bộ trống — đã tải bản Filebase về thay thế.';
      return false;
    }
    const backedUp = await backupRemoteToS3(s3, bucket);
    if (!backedUp) {
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = `Không lưu được bản remote cũ vào '${SUPERSEDED_KEY}' — huỷ push để tránh mất dữ liệu.`;
      return false;
    }
    const put = await putWithCas(s3, bucket, head.etag);
    if (!put.ok) {
      if (put.unsupported) {
        const retry = await putWithCas(s3, bucket, null);
        if (retry.ok) {
          return finishUpload(retry.etag, uploadedFingerprint, `Đã push bản cục bộ lên Filebase (bản remote cũ lưu tại '${SUPERSEDED_KEY}').`);
        }
        throw retry.error;
      }
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = 'Remote thay đổi trong lúc push — thử lại lần nữa.';
      autoSync.retryRequested = true;
      return false;
    }
    return finishUpload(
      put.etag,
      uploadedFingerprint,
      `Đã push bản cục bộ lên Filebase (bản remote cũ lưu tại '${SUPERSEDED_KEY}').`
    );
  }

  // --- Production: XUNG ĐỘT (cục bộ KHÔNG phải hậu duệ của remote hiện tại) ---
  return await forkRejoin(s3, bucket, head, local);
}

/**
 * Xử lý xung đột (instance lệch pha với remote):
 * - bản cục bộ có dữ liệu riêng → lưu vào CONFLICT_KEY (nếu lưu được);
 * - remote thắng → tải bản remote về để instance tái gia nhập "đội";
 * - trả về false: lần upload này KHÔNG xảy ra, nhưng không bên nào mất dữ liệu.
 */
async function forkRejoin(s3: S3Client, bucket: string, head: RemoteInfo | null, local: LocalDbInfo): Promise<boolean> {
  const st = readSyncState();
  logger.error('[S3 Sync] XUNG ĐỘT ĐỒNG BỘ: bản cục bộ không phải hậu duệ của bản Filebase hiện tại.', {
    baseVersion: st.baseVersion,
    remoteVersion: head?.version ?? null,
    localDataTime: local.dataTimeMs ? new Date(local.dataTimeMs).toISOString() : null,
    realUsers: countRealUsers(),
  });

  const downloaded = await doDownloadLocked(s3, bucket, head);
  state.lastSyncStatus = 'failed';
  state.lastSyncTime = new Date().toISOString();
  state.lastSyncMessage = downloaded
    ? `Phát hiện xung đột đồng bộ: đã tải bản Filebase mới nhất về và (nếu có) lưu bản cục bộ vào '${CONFLICT_KEY}'. ` +
      'Dữ liệu bên thua vẫn còn trong key đó để đối chiếu/chép tay.'
    : `Phát hiện xung đột đồng bộ nhưng không tự xử lý được — xem log máy chủ. Bản cục bộ (nếu có) chưa bị xóa.`;
  return false;
}

/** Hoàn tất một lần upload: ghi baseVersion (ETag vừa upload) + markSynced. */
function finishUpload(putEtag: string | null, uploadedFingerprint: string, message: string): boolean {
  writeSyncState({
    baseVersion: putEtag ? `etag:${putEtag}` : `lm:${Date.now()}`,
    baseTime: Date.now(),
    fingerprint: uploadedFingerprint,
  });
  markSynced(uploadedFingerprint);
  logger.info('[S3 Sync] Successfully uploaded database to Filebase.');
  state.lastSyncStatus = 'success';
  state.lastSyncTime = new Date().toISOString();
  state.lastSyncMessage = message;
  return true;
}

// Khi auto-sync bị tắt (mặc định ngoài Vercel): nếu trong lúc dev server vẫn còn
// timer của phiên bản code cũ (HMR không reload lại db.ts) thì tắt hẳn timer đó
// và vô hiệu tick — tránh code cũ tiếp tục upload DB dev đè backup production.
if (typeof window === 'undefined' && !autoSyncEnabled()) {
  if (global.__autoSyncTimer) {
    try {
      clearInterval(global.__autoSyncTimer);
    } catch {}
    global.__autoSyncTimer = undefined;
  }
  global.__autoSyncTick = async () => {};
}

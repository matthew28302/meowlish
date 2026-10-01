import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import logger from './logger';

const DB_FILENAME = 'english_learning.db';
const dbPath = path.join(process.cwd(), 'data', DB_FILENAME);

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
// AUTO-SYNC WATCHER
// Every write (INSERT/UPDATE/DELETE) lands in the SQLite WAL file, so watching
// size+mtime of {db, -wal, -shm} catches ALL data changes without needing a
// hook inside each API route. Changes are debounced so a burst of writes
// results in a single upload instead of one upload per request.
// ---------------------------------------------------------------------------
const AUTO_SYNC_POLL_MS = 10_000; // quét thay đổi mỗi 10 giây
const AUTO_SYNC_DEBOUNCE_MS = 15_000; // chờ yên 15s sau thay đổi cuối mới upload
const AUTO_SYNC_MIN_INTERVAL_MS = 60_000; // tối thiểu 60s giữa 2 lần upload
const AUTO_SYNC_MAX_INTERVAL_MS = 10 * 60_000; // upload bắt buộc nếu dirty quá 10 phút

// State + timer phải sống trên global: khi Next dev HMR reload module (sửa file
// là reload), state và timer trong module sẽ bị tạo lại/đứt. Giữ trên global thì
// vòng đồng bộ chạy xuyên suốt, không bị reset giữa chừng.
interface AutoSyncState {
  lastSyncedFingerprint: string;
  lastSeenFingerprint: string;
  lastChangeAt: number;
  dirtySince: number;
  lastUploadAt: number;
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
});

/** Size + mtime của DB chính và các file WAL/SHM phụ — mọi ghi dữ liệu đều đổi fingerprint. */
function getDbFingerprint(): string {
  return ['', '-wal', '-shm']
    .map((suffix) => {
      try {
        const st = fs.statSync(dbPath + suffix);
        return `${st.size}:${st.mtimeMs}`;
      } catch {
        return 'missing';
      }
    })
    .join('|');
}

function markSynced(syncedFingerprint: string): void {
  autoSync.lastSyncedFingerprint = syncedFingerprint;
  autoSync.lastSeenFingerprint = syncedFingerprint;
  autoSync.dirtySince = 0;
  autoSync.lastChangeAt = 0;
  autoSync.lastUploadAt = Date.now();
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
    return; // dữ liệu chưa thay đổi so với bản đã upload
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

  if ((quietLongEnough || maxWaitExceeded) && minIntervalOk) {
    logger.info('[S3 AutoSync] DB changed detected -> uploading to Filebase.');
    // uploadDbToS3() tự markSynced() ở bên trong khi thành công
    await uploadDbToS3();
  }
}

/**
 * Bật vòng lặp tự động đồng bộ DB lên Filebase khi có thay đổi dữ liệu.
 * An toàn khi gọi nhiều lần (chỉ khởi tạo 1 timer duy nhất, chống HMR/dev reload).
 */
export function startAutoSync(): void {
  if (typeof window !== 'undefined') return;

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

  // Khởi động lại server: nếu DB local có thay đổi S kể từ lần upload cuối
  // (vd: thao tác lúc server đang tắt) -> upload bù ngay, không cần chờ thay đổi mới.
  setTimeout(async () => {
    try {
      if (state.isSyncing) return;
      const s3 = getS3Client();
      if (!s3) return;
      const head = await s3.send(new HeadObjectCommand({ Bucket: getBucketName(), Key: DB_FILENAME }));
      const remoteMtime = head.LastModified?.getTime() || 0;
      let localMtime = 0;
      try {
        localMtime = fs.statSync(dbPath).mtimeMs;
      } catch {}
      if (localMtime > remoteMtime + 10_000) {
        logger.info('[S3 AutoSync] Local DB newer than Filebase copy -> catching up.');
        await uploadDbToS3();
      } else {
        logger.info('[S3 AutoSync] Filebase copy already up to date.');
      }
    } catch (err: any) {
      if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
        logger.info('[S3 AutoSync] No remote copy yet -> initial upload.');
        uploadDbToS3().catch(() => {});
      } else {
        logger.warn('[S3 AutoSync] Startup check failed:', { error: err?.message || String(err) });
      }
    }
  }, 8_000);

  logger.info('[S3 AutoSync] Started. Watching DB changes for Filebase upload.', {
    pollSeconds: AUTO_SYNC_POLL_MS / 1000,
    debounceSeconds: AUTO_SYNC_DEBOUNCE_MS / 1000,
  });
}

export function getS3Client(): S3Client | null {
  const S3_ENDPOINT = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';
  const S3_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY || '';
  const S3_SECRET_KEY = process.env.FILEBASE_SECRET_KEY || '';
  const S3_REGION = process.env.FILEBASE_REGION || 'auto';

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

function checkpointLocalDb() {
  try {
    if (global.__dbInstance) {
      global.__dbInstance.pragma('wal_checkpoint(PASSIVE)');
    }
  } catch (err) {
    logger.warn('[S3 Sync] WAL checkpoint warning:', { error: err });
  }
}

/**
 * Lấy thông tin trạng thái đồng bộ S3 Filebase
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const s3 = getS3Client();
  const bucket = getBucketName();
  const endpoint = process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io';

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
  };
}

/**
 * Tải database từ Filebase về máy nếu bản remote mới hơn hoặc chưa có bản local.
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
    let remoteLastModified = 0;
    try {
      const headResponse = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
      remoteLastModified = headResponse.LastModified?.getTime() || 0;

      let localLastModified = 0;
      if (fs.existsSync(dbPath)) {
        localLastModified = fs.statSync(dbPath).mtimeMs;
      }

      // Nếu remote không mới hơn bản local (+ buffer 10s), giữ nguyên bản local
      if (localLastModified > 0 && remoteLastModified <= localLastModified + 10000) {
        logger.info('[S3 Sync] Local database is up to date with Filebase.');
        state.isSyncing = false;
        state.lastSyncStatus = 'success';
        state.lastSyncTime = new Date().toISOString();
        state.lastSyncMessage = 'Cơ sở dữ liệu cục bộ đã ở phiên bản mới nhất.';
        return false;
      }
    } catch (e: any) {
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
        logger.info('[S3 Sync] No remote database found on Filebase.');
        state.isSyncing = false;
        state.lastSyncStatus = 'idle';
        state.lastSyncMessage = 'Chưa có bản sao lưu trên Filebase S3.';
        return false;
      }
      throw e;
    }

    logger.info('[S3 Sync] Downloading newer database from Filebase...');
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));

    if (response.Body) {
      const byteArray = await response.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);

      // Xác thực SQLite header hợp lệ trước khi ghi đè
      const header = buffer.subarray(0, 16).toString('utf8');
      if (!header.startsWith('SQLite format 3')) {
        throw new Error('Dữ liệu tải về từ S3 không phải là tệp SQLite hợp lệ!');
      }

      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Tạo backup bản cũ trước khi thay thế nếu tệp đã tồn tại
      if (fs.existsSync(dbPath)) {
        try {
          fs.copyFileSync(dbPath, `${dbPath}.bak`);
        } catch {}
      }

      fs.writeFileSync(dbPath, buffer);
      logger.info('[S3 Sync] Successfully downloaded and restored database from Filebase.');

      state.isSyncing = false;
      state.lastSyncStatus = 'success';
      state.lastSyncTime = new Date().toISOString();
      state.lastSyncMessage = 'Đã khôi phục thành công cơ sở dữ liệu từ Filebase S3!';
      return true;
    }

    state.isSyncing = false;
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'Không nhận được dữ liệu từ Filebase S3.';
    return false;
  } catch (error: any) {
    logger.error('[S3 Sync] Error downloading database:', { error });
    state.isSyncing = false;
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = `Lỗi tải: ${error.message || 'Lỗi không xác định'}`;
    return false;
  }
}

/**
 * Tải cơ sở dữ liệu hiện tại lên Filebase S3
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
    logger.warn('[S3 Sync] Another sync operation is currently running.');
    return false;
  }

  state.isSyncing = true;
  state.lastSyncStatus = 'in_progress';
  state.lastSyncMessage = 'Đang đồng bộ cơ sở dữ liệu lên Filebase S3...';

  // Fingerprint NGAY SAU checkpoint, TRƯỚC khi stream: trạng thái thực sự sẽ được đưa lên.
  // Ghi xảy ra trong lúc upload sẽ tạo fingerprint khác -> vòng auto-sync tự phát hiện ở tick sau.
  let uploadedFingerprint = '';

  try {
    // 1. Checkpoint WAL để đảm bảo mọi transaction SQLite mới nhất được ghi vào file chính
    checkpointLocalDb();
    uploadedFingerprint = getDbFingerprint();

    // 2. Upload file stream
    const fileStream = fs.createReadStream(dbPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: DB_FILENAME,
        Body: fileStream,
        ContentType: 'application/octet-stream',
      })
    );

    logger.info('[S3 Sync] Successfully uploaded database to Filebase.');
    state.isSyncing = false;
    state.lastSyncStatus = 'success';
    state.lastSyncTime = new Date().toISOString();
    state.lastSyncMessage = 'Đồng bộ cơ sở dữ liệu lên Filebase S3 thành công 100%! 🚀';
    markSynced(uploadedFingerprint);
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchBucket') {
      try {
        logger.info(`[S3 Sync] Bucket '${bucket}' does not exist. Creating it now...`);
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        logger.info(`[S3 Sync] Bucket created! Retrying upload...`);

        checkpointLocalDb();
        uploadedFingerprint = getDbFingerprint();
        const fileStream = fs.createReadStream(dbPath);
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: DB_FILENAME,
            Body: fileStream,
            ContentType: 'application/octet-stream',
          })
        );

        logger.info('[S3 Sync] Successfully uploaded database to Filebase.');
        state.isSyncing = false;
        state.lastSyncStatus = 'success';
        state.lastSyncTime = new Date().toISOString();
        state.lastSyncMessage = 'Đã tạo bucket và đồng bộ cơ sở dữ liệu lên Filebase thành công!';
        markSynced(uploadedFingerprint);
        return true;
      } catch (createErr: any) {
        logger.error('[S3 Sync] Failed to create bucket on Filebase:', { error: createErr });
        state.isSyncing = false;
        state.lastSyncStatus = 'failed';
        state.lastSyncMessage = `Không thể tạo bucket trên Filebase: ${createErr.message}`;
        return false;
      }
    }

    logger.error('[S3 Sync] Error uploading database:', { error });
    state.isSyncing = false;
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = `Lỗi tải lên Filebase: ${error.message || 'Lỗi không xác định'}`;
    return false;
  }
}

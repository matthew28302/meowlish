import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, CreateBucketCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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
// QUY Táº®C THá»¨ Tá»° Äá»’NG Bá»˜ (Ä‘á»c ká»¹ trÆ°á»›c khi sá»­a â€” pháº£i khá»›p scripts/restore-s3.js)
//
// 1. Má»–I INSTANCE CHá»ˆ ÄÆ¯á»¢C UPLOAD KHI LÃ€ Háº¬U DUá»† Cá»¦A Báº¢N REMOTE HIá»†N Táº I.
//    - Báº£n "gá»‘c" cá»§a instance = baseVersion (ETag cá»§a báº£n remote mÃ  instance Ä‘Ã£
//      táº£i vá» / Ä‘Ã£ upload thÃ nh cÃ´ng), lÆ°u trong sync_state.json cáº¡nh file DB.
//    - Upload luÃ´n dÃ¹ng conditional write (If-Match ETag) â†’ instance khÃ¡c vá»«a
//      ghi xong thÃ¬ upload cá»§a mÃ¬nh bá»‹ 412 vÃ  KHÃ”NG Ä‘Æ°á»£c ghi Ä‘Ã¨.
//    - KhÃ´ng cÃ³ base â†’ KHÃ”NG BAO GIá»œ upload (chá»‘ng DB trá»‘ng/dev ghi Ä‘Ã¨ backup tháº­t).
//
// 2. DOWNLOAD/RESTORE CHá»ˆ THAY DB Cá»¤C Bá»˜ KHI AN TOÃ€N:
//    - DB cá»¥c bá»™ trá»‘ng/há»ng â†’ táº£i vá» (khÃ´ng cÃ³ gÃ¬ Ä‘á»ƒ máº¥t).
//    - Äang giá»¯ Ä‘Ãºng báº£n remote (baseVersion === ETag remote) â†’ GIá»® báº£n cá»¥c bá»™
//      (phÃ²ng khi cÃ³ thao tÃ¡c ghi má»›i chÆ°a ká»‹p upload).
//    - Remote khÃ¡c báº£n cá»§a instance (xung Ä‘á»™t) â†’ remote tháº¯ng, nhÆ°ng náº¿u báº£n
//      cá»¥c bá»™ cÃ³ dá»¯ liá»‡u riÃªng thÃ¬ Ä‘Æ°á»£c lÆ°u vÃ o key CONFLICT_KEY TRÆ¯á»šC khi thay.
//
// 3. Má»ŒI Láº¦N THAY FILE Äá»€U GHI Táº M Rá»’I RENAME (atomic) + XÃ“A -wal/-shm cÅ©.
//
// 4. TRÆ¯á»šC Má»–I UPLOAD: PRAGMA wal_checkpoint(TRUNCATE) + táº¯t wal_autocheckpoint
//    trong lÃºc stream Ä‘á»ƒ file chÃ­nh khÃ´ng bá»‹ ghi giá»¯a chá»«ng (upload rÃ¡ch).
// ---------------------------------------------------------------------------

// Sidecar keys trÃªn S3: bÃªn thua trong xung Ä‘á»™t luÃ´n Ä‘Æ°á»£c giá»¯ láº¡i Ä‘á»ƒ chÃ©p tay.
// DÃ¹ng timestamped key Ä‘á»ƒ má»—i láº§n xung Ä‘á»™t Ä‘Æ°á»£c lÆ°u riÃªng (khÃ´ng ghi Ä‘Ã¨ lÃªn xung Ä‘á»™t cÅ©).
const CONFLICT_KEY_PREFIX = 'english_learning.conflict.'; // + timestamp + '.db'
const SUPERSEDED_KEY = 'english_learning.superseded.db'; // báº£n remote bá»‹ thay khi push cá»¥c bá»™ tháº¯ng

/** Sinh key xung Ä‘á»™t cÃ³ timestamp â€” má»—i láº§n xung Ä‘á»™t lÃ  1 file riÃªng. */
function conflictKey(): string {
  return `${CONFLICT_KEY_PREFIX}${Date.now()}.db`;
}

/** Regex Ä‘á»ƒ nháº­n diá»‡n key xung Ä‘á»™t cÅ©. */
const CONFLICT_KEY_RE = /^english_learning\.conflict\.(\d+)\.db$/;

/** Sá»‘ báº£n xung Ä‘á»™t giá»¯ láº¡i (má»›i nháº¥t) â€” cÅ© hÆ¡n sáº½ xÃ³a Ä‘á»ƒ trÃ¡nh phÃ¬nh S3. */
const KEEP_CONFLICTS = 5;

const MIN_VALID_DB_BYTES = 100_000; // dÆ°á»›i má»©c nÃ y coi nhÆ° DB rá»—ng/khÃ´ng há»£p lá»‡
const REMOTE_REAL_DB_BYTES = 1_000_000; // remote >= má»©c nÃ y Ä‘Æ°á»£c coi lÃ  "cÃ³ dá»¯ liá»‡u tháº­t"
const DIRTY_EPSILON_MS = 2_000; // Ä‘á»™ lá»‡ch mtime cho phÃ©p khi so "Ä‘Ã£ sync xong"

const AUTH_SALT_FALLBACK = 'english_for_me_salt_2026';

/** Fingerprint cá»§a AUTH_SALT â€” chá»‰ log/kÃ¨m metadata, KHÃ”NG log ra chÃ­nh giÃ¡ trá»‹ salt. */
function getSaltFingerprint(): string {
  const salt = process.env.AUTH_SALT || AUTH_SALT_FALLBACK;
  return crypto.createHash('sha256').update(salt).digest('hex').slice(0, 12);
}

/**
 * Auto-sync (watcher + upload/download tá»± Ä‘á»™ng) máº·c Ä‘á»‹nh CHá»ˆ báº­t trÃªn Vercel.
 * - DB_SYNC_AUTO=1 : báº­t á»Ÿ má»i mÃ´i trÆ°á»ng (dÃ nh cho self-hosted production).
 * - DB_SYNC_AUTO=0 : táº¯t háº³n (ká»ƒ cáº£ trÃªn Vercel).
 * LÃ½ do táº¯t ngoÃ i Vercel: mÃ¡y dev dÃ¹ng chung bucket vá»›i production â€” náº¿u Ä‘á»ƒ
 * auto-upload thÃ¬ DB dev (kÃ¨m AUTH_SALT fallback) sáº½ ghi Ä‘Ã¨ backup production
 * vÃ  lÃ m "máº¥t dá»¯ liá»‡u ngÆ°á»i dÃ¹ng" trÃªn web (má»™t trong cÃ¡c nguyÃªn nhÃ¢n gá»‘c).
 */
function autoSyncEnabled(): boolean {
  const flag = process.env.DB_SYNC_AUTO;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  return isVercel;
}

/** MÃ´i trÆ°á»ng production (upload tuÃ¢n thá»§ nguyÃªn táº¯c "khÃ´ng bao giá» ghi Ä‘Ã¨ remote láº¡"). */
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
  /** CÃ³ báº­t auto-sync (watcher) á»Ÿ mÃ´i trÆ°á»ng hiá»‡n táº¡i khÃ´ng */
  autoSyncEnabled: boolean;
  /** ETag cá»§a báº£n remote mÃ  instance nÃ y coi lÃ  "gá»‘c" (null = chÆ°a tá»«ng Ä‘á»“ng bá»™) */
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
  lastSyncMessage: 'ChÆ°a thá»±c hiá»‡n Ä‘á»“ng bá»™ gáº§n Ä‘Ã¢y.',
};

// ---------------------------------------------------------------------------
// SYNC STATE (báº£n "gá»‘c" cá»§a instance) â€” sync_state.json náº±m cáº¡nh file DB.
// CÃ¹ng Ä‘á»‹nh dáº¡ng vá»›i scripts/restore-s3.js vÃ  scripts/sync-to-filebase.mjs.
// ---------------------------------------------------------------------------
interface SyncState {
  v: 1;
  /** `etag:"..."` hoáº·c `lm:<ms>` â€” phiÃªn báº£n remote mÃ  cá»¥c bá»™ lÃ  háº­u duá»‡ cá»§a */
  baseVersion: string | null;
  /** thá»i Ä‘iá»ƒm báº£n remote Ä‘Ã³ Ä‘Æ°á»£c ghi (ms) */
  baseTime: number;
  /** getDbFingerprint() táº¡i thá»i Ä‘iá»ƒm sync thÃ nh cÃ´ng (null náº¿u khÃ´ng biáº¿t) */
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
    logger.warn('[S3 Sync] KhÃ´ng ghi Ä‘Æ°á»£c sync_state.json:', { error: err });
  }
}

// ---------------------------------------------------------------------------
// AUTO-SYNC WATCHER
// Every write (INSERT/UPDATE/DELETE) lands in the SQLite WAL file, so watching
// size+mtime of {db, -wal} catches ALL data changes without needing a
// hook inside each API route. (-shm KHÃ”NG tham gia fingerprint: nÃ³ lÃ  file
// lock/Ä‘ chá»‰ sá»‘, bá»‹ táº¡o láº¡i má»—i láº§n má»Ÿ DB â†’ náº¿u tham gia thÃ¬ má»—i cold start
// láº¡i bá»‹ coi lÃ  "cÃ³ thay Ä‘á»•i" vÃ  upload uá»•ng 1 láº§n.)
// Changes are debounced so a burst of writes results in a single upload.
// ---------------------------------------------------------------------------
const AUTO_SYNC_POLL_MS = 10_000; // quÃ©t thay Ä‘á»•i má»—i 10 giÃ¢y
// TrÃªn Vercel instance cÃ³ thá»ƒ bá»‹ "Ä‘Ã³ng bÄƒng" ngay sau response â†’ cÃ¡c má»‘c thá»i
// gian pháº£i NGáº®N hÆ¡n nhiá»u so vá»›i mÃ¡y thÆ°á»ng, náº¿u khÃ´ng thao tÃ¡c ghi sáº½ bá»‹ bá»
// quÃªn cho tá»›i lÃºc instance cháº¿t (dá»¯ liá»‡u khÃ´ng bao giá» ká»‹p lÃªn S3).
const AUTO_SYNC_DEBOUNCE_MS = isVercel ? 5_000 : 15_000;
const AUTO_SYNC_MIN_INTERVAL_MS = isVercel ? 30_000 : 60_000;
const AUTO_SYNC_MAX_INTERVAL_MS = isVercel ? 2 * 60_000 : 10 * 60_000;
const AUTO_SYNC_RETRY_MIN_MS = isVercel ? 10_000 : 20_000; // retry khi láº§n trÆ°á»›c tháº¥t báº¡i/bá»‹ bá» lá»¡
const AUTO_SYNC_REMOTE_CHECK_MS = isVercel ? 60_000 : 5 * 60_000; // Ä‘á»‘i chiáº¿u remote khi ráº£nh

// State + timer pháº£i sá»‘ng trÃªn global: khi Next dev HMR reload module (sá»­a file
// lÃ  reload), state vÃ  timer trong module sáº½ bá»‹ táº¡o láº¡i/Ä‘á»©t. Giá»¯ trÃªn global thÃ¬
// vÃ²ng Ä‘á»“ng bá»™ cháº¡y xuyÃªn suá»‘t, khÃ´ng bá»‹ reset giá»¯a chá»«ng.
interface AutoSyncState {
  lastSyncedFingerprint: string;
  lastSeenFingerprint: string;
  lastChangeAt: number;
  dirtySince: number;
  lastUploadAt: number;
  /** yÃªu cáº§u upload láº¡i sá»›m (láº§n trÆ°á»›c bá»‹ bá» lá»¡/tháº¥t báº¡i) */
  retryRequested: boolean;
  /** dataTime cá»§a báº£n cá»¥c bá»™ Ä‘Ã£ lÆ°u vÃ o CONFLICT_KEY (trÃ¡nh backup trÃ¹ng láº·p) */
  lastBackupDataTime: number;
  /** thá»i Ä‘iá»ƒm cuá»‘i Ä‘á»‘i chiáº¿u ETag remote vá»›i base */
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
  lastSyncedFingerprint: '', // fingerprint cá»§a tráº¡ng thÃ¡i Ä‘Ã£ upload thÃ nh cÃ´ng
  lastSeenFingerprint: '', // fingerprint Ä‘Ã£ quÃ©t á»Ÿ láº§n tick trÆ°á»›c
  lastChangeAt: 0, // thá»i Ä‘iá»ƒm phÃ¡t hiá»‡n Má»˜T THAY Äá»”I Má»šI (chá»‰ update khi fp Ä‘á»•i)
  dirtySince: 0, // thá»i Ä‘iá»ƒm báº¯t Ä‘áº§u Ä‘á»£t thay Ä‘á»•i hiá»‡n táº¡i
  lastUploadAt: 0,
  retryRequested: false,
  lastBackupDataTime: 0,
  lastRemoteCheckAt: 0,
});

/**
 * Fingerprint cá»§a DB = mtime/size cá»§a file chÃ­nh + file WAL.
 * - Ghi dá»¯ liá»‡u má»›i â†’ WAL Ä‘á»•i size/mtime â†’ phÃ¡t hiá»‡n Ä‘Æ°á»£c ngay.
 * - Checkpoint â†’ file chÃ­nh Ä‘á»•i mtime/size â†’ cÅ©ng phÃ¡t hiá»‡n Ä‘Æ°á»£c.
 * - File -shm bá»‹ loáº¡i trá»« vÃ¬ chá»‰ lÃ  lock index, thay Ä‘á»•i vÃ´ nghÄ©a.
 * Äá»ŠNH DÃ€NG NÃ€Y PHáº¢I KHá»šP Vá»šI localFingerprint() TRONG scripts/restore-s3.js
 * vÃ  scripts/sync-to-filebase.mjs (Ä‘á»c cÃ¹ng sync_state.json).
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
  /** mtime lá»›n nháº¥t giá»¯a DB chÃ­nh vÃ  WAL â€” "thá»i Ä‘iá»ƒm ghi dá»¯ liá»‡u cá»¥c bá»™" */
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

/** Äá»‹nh dáº¡ng phiÃªn báº£n object â€” PHáº¢I giá»‘ng nhau á»Ÿ má»i nÆ¡i (xem scripts/restore-s3.js). */
function versionFromParts(etag: string | null | undefined, lastModifiedMs: number): string {
  return etag ? `etag:${etag}` : `lm:${lastModifiedMs}`;
}

/** HEAD object; tráº£ vá» null náº¿u CHÆ¯A cÃ³ báº£n remote (404). NÃ©m lá»—i cho lá»—i máº¡ng tháº­t sá»±. */
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

/** Äáº¿m user THáº¬T (loáº¡i admin/demo seed) â€” phÃ¢n biá»‡t "DB trá»‘ng" vá»›i "DB cÃ³ dá»¯ liá»‡u tháº­t". */
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
 * Báº£n cá»¥c bá»™ cÃ³ thay Ä‘á»•i so vá»›i láº§n sync S3 gáº§n nháº¥t khÃ´ng?
 * Æ¯u tiÃªn so fingerprint (chÃ­nh xÃ¡c tuyá»‡t Ä‘á»‘i); thiáº¿u fingerprint thÃ¬ so thá»i gian.
 */
function isLocalDirty(st: SyncState, local: LocalDbInfo): boolean {
  if (!st.baseVersion) return true; // chÆ°a tá»«ng Ä‘á»“ng bá»™ â†’ coi nhÆ° cÃ³ thay Ä‘á»•i cáº§n xá»­ lÃ½
  if (st.fingerprint) return st.fingerprint !== getDbFingerprint();
  return local.dataTimeMs > st.baseTime + DIRTY_EPSILON_MS;
}

function closeDbIfOpen(): void {
  try {
    if (global.__dbInstance) global.__dbInstance.close();
  } catch {}
  global.__dbInstance = undefined;
}

/** Checkpoint WAL Ä‘á»“ng bá»™ â€” má»Ÿ connection táº¡m náº¿u instance chÆ°a Ä‘Æ°á»£c má»Ÿ. */
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
 * Upload file chÃ­nh lÃªn S3. Táº¯t wal_autocheckpoint trong lÃºc stream Ä‘á»ƒ connection
 * khÃ´ng Ä‘Æ°á»£c phÃ©p ghi vÃ o file chÃ­nh giá»¯a chá»«ng (náº¿u khÃ´ng upload sáº½ bá»‹ "rÃ¡ch").
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

/** PutObject cÃ³ Ä‘iá»u kiá»‡n; phÃ¢n loáº¡i 412/409 (xung Ä‘á»™t) vÃ  lá»—i khÃ´ng há»— trá»£ If-Match. */
async function putWithCas(s3: S3Client, bucket: string, ifMatch: string | null): Promise<PutOutcome> {
  try {
    const res = await sendPut(s3, bucket, ifMatch);
    return { ok: true, etag: res.ETag ?? null };
  } catch (error: any) {
    const code = error?.$metadata?.httpStatusCode;
    if (code === 412 || code === 409 || error?.name === 'PreconditionFailed') {
      return { ok: false, conflict: true, unsupported: false, error };
    }
    // Má»™t sá»‘ báº£n S3-compatible (Filebase...) cÃ³ thá»ƒ chÆ°a há»— trá»£ If-Match â†’ 400/501
    if (ifMatch && (code === 400 || code === 501)) {
      return { ok: false, conflict: false, unsupported: true, error };
    }
    throw error;
  }
}

/** LÆ°u báº£n cá»¥c bá»™ (bÃªn thua xung Ä‘á»™t) vÃ o key timestamped trÆ°á»›c khi bá»‹ thay tháº¿. */
async function backupLocalToS3(s3: S3Client, bucket: string, local: LocalDbInfo, reason: string): Promise<boolean> {
  // ÄÃ£ lÆ°u Ä‘Ãºng dá»¯ liá»‡u nÃ y rá»“i thÃ¬ khá»i lÆ°u láº¡i (tiáº¿t kiá»‡m, trÃ¡nh láº·p vÃ´ háº¡n)
  if (local.dataTimeMs <= autoSync.lastBackupDataTime) return true;
  const key = conflictKey();
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
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
    logger.error(`[S3 Sync] ÄÃ£ lÆ°u báº£n cá»¥c bá»™ sáº¯p bá»‹ thay vÃ o key '${key}' (lÃ½ do: ${reason}).`);
    // Dá»n dáº¹p cÃ¡c báº£n xung Ä‘á»™t cÅ©, chá»‰ giá»¯ láº¡i KEEP_CONFLICTS báº£n má»›i nháº¥t
    cleanupOldConflicts(s3, bucket).catch((err) =>
      logger.warn('[S3 Sync] KhÃ´ng dá»n dáº¹p Ä‘Æ°á»£c conflict keys cÅ©:', { error: err instanceof Error ? err.message : String(err) })
    );
    return true;
  } catch (err) {
    logger.error('[S3 Sync] KHÃ”NG lÆ°u Ä‘Æ°á»£c báº£n sao báº£n cá»¥c bá»™ â€” há»§y thao tÃ¡c Ä‘á»ƒ trÃ¡nh máº¥t dá»¯ liá»‡u:', {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/** XÃ³a cÃ¡c key xung Ä‘á»™t cÅ©, chá»‰ giá»¯ láº¡i KEEP_CONFLICTS báº£n má»›i nháº¥t. */
async function cleanupOldConflicts(s3: S3Client, bucket: string): Promise<void> {
  try {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: CONFLICT_KEY_PREFIX }));
    const keys = (listed.Contents || [])
      .map((obj) => ({ key: obj.Key || '', lastModified: obj.LastModified || new Date(0) }))
      .filter((e) => CONFLICT_KEY_RE.test(e.key))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()); // má»›i nháº¥t trÆ°á»›c

    const stale = keys.slice(KEEP_CONFLICTS);
    if (stale.length === 0) return;

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: stale.map((e) => ({ Key: e.key })) },
      })
    );
    logger.info(`[S3 Sync] ÄÃ£ xÃ³a ${stale.length} báº£n xung Ä‘á»™t cÅ©, giá»¯ láº¡i ${KEEP_CONFLICTS} báº£n má»›i nháº¥t.`);
  } catch (err) {
    logger.warn('[S3 Sync] cleanupOldConflicts lá»—i (bá» qua, khÃ´ng áº£nh hÆ°á»Ÿng sync):', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** LÆ°u báº£n remote cÅ© vÃ o SUPERSEDED_KEY trÆ°á»›c khi bá»‹ push (mÃ¡y dev) ghi Ä‘Ã¨. */
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
    logger.warn(`[S3 Sync] ÄÃ£ lÆ°u báº£n remote cÅ© vÃ o key '${SUPERSEDED_KEY}' trÆ°á»›c khi push.`);
    return true;
  } catch (err) {
    logger.error('[S3 Sync] KHÃ”NG lÆ°u Ä‘Æ°á»£c báº£n remote cÅ© â€” Há»¦YS push Ä‘á»ƒ trÃ¡nh máº¥t dá»¯ liá»‡u:', {
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
    // ChÆ°a tá»«ng sync: láº¥y tráº¡ng thÃ¡i hiá»‡n táº¡i lÃ m má»‘c, khÃ´ng upload ngay.
    markSynced(fp);
    return;
  }

  if (fp === autoSync.lastSyncedFingerprint) {
    autoSync.lastSeenFingerprint = fp;
    // KhÃ´ng cÃ³ thay Ä‘á»•i cá»¥c bá»™ â†’ thá»‰nh thoáº£ng Ä‘á»‘i chiáº¿u xem remote cÃ³ bá»‹ báº£n
    // instance khÃ¡c/ script thá»§ cÃ´ng Ä‘áº©y lÃªn khÃ´ng (instance ráº£nh váº«n pháº£i rejoin).
    if (now - autoSync.lastRemoteCheckAt >= AUTO_SYNC_REMOTE_CHECK_MS) {
      autoSync.lastRemoteCheckAt = now;
      await reconcileWithRemote('idle-check');
    }
    return;
  }

  if (!autoSync.dirtySince) autoSync.dirtySince = now;

  // Chá»‰ cáº­p nháº­t lastChangeAt khi ÄÃšNG CÃ“ THAY Äá»”I Má»šI so vá»›i láº§n quÃ©t trÆ°á»›c.
  // Náº¿u update má»—i tick thÃ¬ delta luÃ´n = chu ká»³ poll -> debounce khÃ´ng bao giá» kÃ­ch hoáº¡t.
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
  // Láº§n trÆ°á»›c bá»‹ bá» lá»¡/tháº¥t báº¡i â†’ cho upload láº¡i sá»›m hÆ¡n háº¡n má»©c tá»‘i thiá»ƒu
  const retryOk = autoSync.retryRequested && now - autoSync.lastUploadAt >= AUTO_SYNC_RETRY_MIN_MS;

  if ((quietLongEnough || maxWaitExceeded || retryOk) && (minIntervalOk || retryOk)) {
    logger.info('[S3 AutoSync] DB changed detected -> uploading to Filebase.');
    // uploadDbToS3() tá»± markSynced() á»Ÿ bÃªn trong khi thÃ nh cÃ´ng
    await uploadDbToS3();
  }
}

/**
 * Äá»‘i chiáº¿u báº£n remote hiá»‡n táº¡i vá»›i base cá»§a instance vÃ  chá»n hÆ°á»›ng xá»­ lÃ½:
 * - thiáº¿u base â†’ táº£i vá» Ä‘á»ƒ tÃ¡i Ä‘á»“ng bá»™;
 * - remote giá»‘ng base â†’ chá»‰ local cÃ³ Ä‘á»•i má»›i upload (watcher lo pháº§n Ä‘Ã³);
 * - remote Ä‘á»•i, local sáº¡ch â†’ táº£i vá» (rejoin fleet);
 * - remote Ä‘á»•i, local báº©n â†’ upload (uploadDbToS3 sáº½ tá»± phÃ¢n xá»­ xung Ä‘á»™t).
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
    logger.warn('[S3 AutoSync] KhÃ´ng Ä‘á»c Ä‘Æ°á»£c metadata remote Ä‘á»ƒ Ä‘á»‘i chiáº¿u:', {
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
      logger.info('[S3 AutoSync] ChÆ°a cÃ³ báº£n remote nÃ o -> publish láº§n Ä‘áº§u.', { trigger });
      await uploadDbToS3();
    }
    return;
  }

  if (!st.baseVersion) {
    logger.info('[S3 AutoSync] ChÆ°a cÃ³ baseVersion -> táº£i báº£n Filebase vá» Ä‘á»ƒ tÃ¡i Ä‘á»“ng bá»™.', { trigger });
    await downloadDbFromS3();
    return;
  }

  if (st.baseVersion === head.version) return; // remote khÃ´ng Ä‘á»•i

  const dirty = isLocalDirty(st, local);
  if (dirty) {
    logger.info('[S3 AutoSync] Remote Ä‘á»•i vÃ  cá»¥c bá»™ cÃ³ thay Ä‘á»•i -> upload (tá»± xá»­ lÃ½ xung Ä‘á»™t).', { trigger });
    await uploadDbToS3();
  } else {
    logger.info('[S3 AutoSync] Remote má»›i hÆ¡n, cá»¥c bá»™ khÃ´ng Ä‘á»•i -> táº£i vá».', { trigger });
    await downloadDbFromS3();
  }
}

/**
 * LÃ m tÆ°Æ¡i DB NGAY TRÆ¯á»šC KHI PHá»¤C Vá»¤ Äá»ŒC QUAN TRá»ŒNG (login, danh sÃ¡ch phÃ²ng...):
 * trÃªn Vercel má»—i instance cÃ³ báº£n SQLite riÃªng trong /tmp â€” instance láº¡nh cÃ³ thá»ƒ
 * Ä‘ang giá»¯ báº£n cÅ© (user vá»«a Ä‘Äƒng kÃ½/Ä‘á»•i MK/táº¡o phÃ²ng á»Ÿ instance khÃ¡c) nÃªn tráº£
 * vá» "sai máº­t kháº©u" hoáº·c danh sÃ¡ch phÃ²ng rá»—ng dÃ¹ dá»¯ liá»‡u Ä‘Ã£ cÃ³ trÃªn Filebase.
 *
 * Quy táº¯c:
 * - chá»‰ gá»i khi auto-sync báº­t (ngoÃ i Vercel â†’ no-op);
 * - THROTTLE: má»—i instance tá»‘i Ä‘a 1 láº§n / READ_REFRESH_MIN_INTERVAL_MS (má»™t
 *   HEAD metadata lÃ  network call, khÃ´ng cho phÃ©p gá»i sau má»—i request);
 * - remote khÃ´ng Ä‘á»•i â†’ khÃ´ng lÃ m gÃ¬; cá»¥c bá»™ Ä‘ang cÃ³ ghi chÆ°a upload â†’ KHÃ”NG
 *   táº£i (Ä‘á»ƒ watcher tá»± phÃ¢n xá»­ xung Ä‘á»™t, trÃ¡nh Ä‘áº¡p lÃªn ghi má»›i);
 * - remote má»›i hÆ¡n + cá»¥c bá»™ sáº¡ch â†’ downloadDbFromS3() (quy táº¯c an toÃ n riÃªng).
 * Lá»—i máº¡ng nuá»‘t trong catch â€” khÃ´ng bao giá» lÃ m há»ng request.
 *
 * @param opts.force bá» qua throttle 15s/instance. Chá»‰ dÃ¹ng khi request Ä‘ang
 *   tra cá»©u má»™t báº£n ghi mÃ  instance KHÃ”NG CÃ“ (user vá»«a Ä‘Äƒng kÃ½ á»Ÿ instance khÃ¡c):
 *   Ä‘Ã¢y lÃ  lÃºc instance láº¡nh cÃ³ báº£n /tmp cÅ©, khÃ´ng throttle thÃ¬ ngÆ°á»i dÃ¹ng pháº£i
 *   thá»­ láº¡i nhiá»u láº§n má»›i vÃ o Ä‘Æ°á»£c. Váº«n cháº·n khi Ä‘ang sync Ä‘á»ƒ khÃ´ng tranh nhau.
 * @returns true náº¿u vá»«a táº£i báº£n má»›i vá» (request nÃªn Ä‘á»c láº¡i DB).
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
    // ÄÃ£ lÃ  báº£n má»›i nháº¥t (hoáº·c chÆ°a tá»«ng sync â†’ cold-start restore lo pháº§n nÃ y)
    if (!st.baseVersion || st.baseVersion === head.version) return false;
    const local = localDbInfo();
    if (isLocalDirty(st, local)) return false; // cá»¥c bá»™ cÃ³ ghi chá» upload â†’ khÃ´ng Ä‘á»¥ng

    logger.info('[S3 Sync] Read-refresh: remote má»›i hÆ¡n báº£n cá»¥c bá»™ â†’ táº£i vá» trÆ°á»›c khi phá»¥c vá»¥ request.', {
      trigger,
    });
    return await downloadDbFromS3();
  } catch (err) {
    logger.warn('[S3 Sync] Read-refresh failed (bá» qua, váº«n phá»¥c vá»¥ dá»¯ liá»‡u hiá»‡n cÃ³):', {
      trigger,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Báº­t vÃ²ng láº·p tá»± Ä‘á»™ng Ä‘á»“ng bá»™ DB lÃªn Filebase khi cÃ³ thay Ä‘á»•i dá»¯ liá»‡u.
 * An toÃ n khi gá»i nhiá»u láº§n (chá»‰ khá»Ÿi táº¡o 1 timer duy nháº¥t, chá»‘ng HMR/dev reload).
 */
export function startAutoSync(): void {
  if (typeof window !== 'undefined') return;

  if (!autoSyncEnabled()) {
    // NgoÃ i Vercel (hoáº·c DB_SYNC_AUTO=0): Tá»° Äá»˜NG upload Táº®T Ä‘á»ƒ DB mÃ¡y dev
    // khÃ´ng bao giá» ghi Ä‘Ã¨ backup production. Äá»“ng bá»™ thá»§ cÃ´ng váº«n dÃ¹ng Ä‘Æ°á»£c:
    //   - node scripts/sync-to-filebase.mjs  (Ä‘áº©y local -> Filebase)
    //   - POST /api/sync                     (admin, cÃ³ quy táº¯c an toÃ n riÃªng)
    logger.info(
      '[S3 AutoSync] Auto-sync Táº®T á»Ÿ mÃ´i trÆ°á»ng nÃ y (máº·c Ä‘á»‹nh chá»‰ báº­t trÃªn Vercel). ' +
        'Äáº·t DB_SYNC_AUTO=1 Ä‘á»ƒ báº­t, hoáº·c dÃ¹ng scripts/sync-to-filebase.mjs / POST /api/sync Ä‘á»ƒ Ä‘á»“ng bá»™ thá»§ cÃ´ng.'
    );
    return;
  }

  // LuÃ´n cáº­p nháº­t ref tá»›i tick cá»§a module hiá»‡n táº¡i (sau HMR reload, timer cÅ©
  // váº«n cháº¡y nhÆ°ng sáº½ gá»i phiÃªn báº£n code má»›i nháº¥t).
  global.__autoSyncTick = autoSyncTick;

  if (global.__autoSyncTimer) return; // timer Ä‘Ã£ cháº¡y, khÃ´ng táº¡o thÃªm
  if (!getS3Client()) {
    logger.warn('[S3 AutoSync] Filebase credentials missing. Auto-sync disabled.');
    return;
  }

  autoSync.lastSyncedFingerprint = getDbFingerprint();
  autoSync.lastUploadAt = Date.now(); // khÃ´ng upload ngay khi vá»«a khá»Ÿi Ä‘á»™ng

  global.__autoSyncTimer = setInterval(() => {
    const tick = global.__autoSyncTick;
    if (!tick) return;
    tick().catch((err) => logger.error('[S3 AutoSync] Tick failed:', { error: err }));
  }, AUTO_SYNC_POLL_MS);

  // Cháº¡y 1 láº§n sau khi server á»•n Ä‘á»‹nh Ä‘á»ƒ báº¯t Ä‘áº§u tá»« tráº¡ng thÃ¡i Ä‘Ã£ Ä‘á»“ng bá»™
  setTimeout(() => {
    autoSyncTick().catch(() => {});
  }, 5_000);

  // Cold-start: náº¿u instrumentation táº£i trÆ°á»›c Ä‘Ã³ tháº¥t báº¡i (thiáº¿u marker) thÃ¬ thá»­ láº¡i.
  // Viá»‡c download ÄI THEO QUY Táº®C THá»¨ Tá»° (chá»‰ thay khi an toÃ n) â€” khÃ´ng Ã©p buá»™c ghi Ä‘Ã¨.
  setTimeout(() => {
    (async () => {
      try {
        if (fs.existsSync(markerPath)) return;
        logger.info('[S3 AutoSync] ChÆ°a cÃ³ marker khÃ´i phá»¥c -> thá»­ táº£i láº¡i DB tá»« Filebase...');
        await downloadDbFromS3();
      } catch (err) {
        logger.warn('[S3 AutoSync] Cold-start restore check failed:', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }, 1_000);

  // Sau khi há»‡ thá»‘ng á»•n Ä‘á»‹nh: Ä‘á»‘i chiáº¿u local/remote theo quy táº¯c thá»© tá»±
  // (thay cho logic "local mtime má»›i hÆ¡n lÃ  upload" trÆ°á»›c Ä‘Ã¢y â€” mtime dá»… giáº£ máº¡o
  // sau khi restore nÃªn ráº¥t dá»… ghi Ä‘Ã¨ oan).
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
  // KHÃ”NG hardcode khoÃ¡: secret chá»‰ láº¥y tá»« biáº¿n mÃ´i trÆ°á»ng. KhoÃ¡ náº±m trong
  // source = ai Ä‘á»c Ä‘Æ°á»£c repo lÃ  náº¯m Ä‘Æ°á»£c toÃ n bá»™ database production.
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
 * Ghi dá»¯ liá»‡u QUAN TRá»ŒNG (Ä‘Äƒng kÃ½ tÃ i khoáº£n, Ä‘á»•i máº­t kháº©u) rá»“i báº£o Ä‘áº£m nÃ³
 * thá»±c sá»± tá»“n táº¡i trong báº£n dá»¯ liá»‡u chuáº©n trÃªn Filebase.
 *
 * VÃŒ SAO Cáº¦N: khi hai instance cÃ¹ng ghi, báº£n bá»‹ Ä‘Ã¡nh báº¡i sáº½ bá»‹ `forkRejoin` táº£i
 * báº£n remote Ä‘Ã¨ lÃªn vÃ  ghi cá»¥c bá»™ bá»‹ vá»©t (chá»‰ cÃ²n náº±m trong key .conflict.db).
 * NghÄ©a lÃ  má»™t tÃ i khoáº£n vá»«a Ä‘Äƒng kÃ½ cÃ³ thá»ƒ biáº¿n máº¥t khá»i há»‡ thá»‘ng vÃ i phÃºt sau
 * Ä‘Ã³: ngÆ°á»i dÃ¹ng tháº¥y "Ä‘Äƒng kÃ½ thÃ nh cÃ´ng" rá»“i khÃ´ng Ä‘Äƒng nháº­p Ä‘Æ°á»£c ná»¯a. ÄÃ£ tháº¥y
 * hiá»‡n tÆ°á»£ng nÃ y tháº­t trÃªn Filebase: user `kangyoungha` (táº¡o 14:51) chá»‰ cÃ²n trong
 * english_learning.conflict.db, khÃ´ng cÃ³ trong báº£n chÃ­nh.
 *
 * CÃ¡ch xá»­ lÃ½: ghi â†’ Ä‘áº©y lÃªn â†’ kiá»ƒm tra láº¡i dá»¯ liá»‡u chuáº©n. Náº¿u báº£n ghi biáº¿n máº¥t
 * (bá»‹ instance khÃ¡c ghi Ä‘Ã¨) thÃ¬ ghi láº¡i vÃ  thá»­ tá»‘i Ä‘a vÃ i láº§n; láº§n sau baseVersion
 * Ä‘Ã£ khá»›p remote nÃªn sáº½ tháº¯ng. `apply` pháº£i idempotent.
 */
export async function persistCriticalWrite(
  label: string,
  apply: () => void,
  verify: () => boolean,
  maxAttempts = 3
): Promise<{ persisted: boolean; attempts: number }> {
  // NgoÃ i Vercel auto-sync táº¯t â†’ ghi cá»¥c bá»™ lÃ  xong, khÃ´ng cÃ³ remote Ä‘á»ƒ tranh cháº¥p.
  if (!autoSyncEnabled()) {
    apply();
    return { persisted: true, attempts: 1 };
  }

  let attempts = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;
    apply();
    await syncDbToS3Now();

    let ok = false;
    try {
      ok = verify();
    } catch (err) {
      logger.warn(`[S3 Persist] KhÃ´ng kiá»ƒm tra Ä‘Æ°á»£c "${label}":`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    if (ok) {
      if (attempt > 1) {
        logger.warn(`[S3 Persist] "${label}" bá»‹ ghi Ä‘Ã¨ ${attempt - 1} láº§n, Ä‘Ã£ ghi láº¡i thÃ nh cÃ´ng.`);
      }
      return { persisted: true, attempts };
    }

    logger.error(
      `[S3 Persist] "${label}" khÃ´ng cÃ²n trong dá»¯ liá»‡u chuáº©n sau khi Ä‘á»“ng bá»™ ` +
        `(báº£n cá»¥c bá»™ bá»‹ instance khÃ¡c ghi Ä‘Ã¨). Sáº½ ghi láº¡i (láº§n ${attempt}/${maxAttempts}).`
    );
  }

  logger.error(`[S3 Persist] KHÃ”NG lÆ°u Ä‘Æ°á»£c "${label}" sau ${maxAttempts} láº§n thá»­.`);
  return { persisted: false, attempts };
}

/**
 * Gá»i Ä‘á»“ng bá»™ ngay láº­p tá»©c lÃªn Filebase S3 sau khi cÃ³ mutation quan trá»ng (Register, Password, Coins, Admin)
 *
 * NgoÃ i Vercel (auto-sync táº¯t) hÃ m nÃ y lÃ  no-op â€” dÃ¹ng POST /api/sync hoáº·c
 * scripts/sync-to-filebase.mjs Ä‘á»ƒ Ä‘áº©y thá»§ cÃ´ng.
 */
export async function syncDbToS3Now(): Promise<boolean> {
  if (!autoSyncEnabled()) {
    state.lastSyncMessage =
      'Auto-sync Ä‘ang táº¯t á»Ÿ mÃ´i trÆ°á»ng nÃ y. DÃ¹ng POST /api/sync hoáº·c node scripts/sync-to-filebase.mjs Ä‘á»ƒ Ä‘á»“ng bá»™ thá»§ cÃ´ng.';
    logger.info('[S3 Sync] syncDbToS3Now bá»‹ bá» qua vÃ¬ auto-sync Ä‘ang táº¯t.');
    return false;
  }
  try {
    const p = uploadDbToS3();
    // KÃ©o dÃ i thá»i gian sá»‘ng cá»§a serverless function trÃªn Vercel: náº¿u Ä‘ang náº±m trong
    // request context cá»§a Next.js thÃ¬ Ä‘Äƒng kÃ½ upload vÃ o waitUntil, Ä‘á»ƒ thao tÃ¡c
    // quan trá»ng (Ä‘Äƒng kÃ½/Ä‘á»•i máº­t kháº©u) khÃ´ng bá»‹ kill ngay khi response Ä‘Ã£ gá»­i.
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
 * Láº¥y thÃ´ng tin tráº¡ng thÃ¡i Ä‘á»“ng bá»™ S3 Filebase
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
      lastSyncMessage: 'ChÆ°a cáº¥u hÃ¬nh khoÃ¡ API Filebase S3 trong .env.local',
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
 * Táº£i database tá»« Filebase vá» local theo QUY Táº®C THá»¨ Tá»°:
 * - local trá»‘ng/há»ng â†’ táº£i (khÃ´ng cÃ³ gÃ¬ Ä‘á»ƒ máº¥t);
 * - local lÃ  Ä‘Ãºng báº£n remote hiá»‡n táº¡i â†’ GIá»® local (phÃ²ng khi cÃ³ ghi má»›i chÆ°a upload);
 * - remote khÃ¡c báº£n cá»§a instance â†’ remote tháº¯ng, nhÆ°ng báº£n cá»¥c bá»™ cÃ³ dá»¯ liá»‡u
 *   riÃªng sáº½ Ä‘Æ°á»£c lÆ°u vÃ o CONFLICT_KEY trÆ°á»›c khi bá»‹ thay.
 * (TrÆ°á»›c Ä‘Ã¢y cÃ³ tham sá»‘ `force` Ã©p ghi Ä‘Ã¨ báº¥t cháº¥p â€” Ä‘Ã³ lÃ  má»™t trong cÃ¡c nguyÃªn
 * nhÃ¢n gÃ¢y rollback máº­t kháº©u; QUY Táº®C THAY THáº¾: khÃ´ng bao giá» Ã©p ghi Ä‘Ã¨.)
 */
export async function downloadDbFromS3(): Promise<boolean> {
  const s3 = getS3Client();
  const bucket = getBucketName();

  if (!s3) {
    logger.warn('[S3 Sync] Filebase credentials not configured. Skipping download.');
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'ChÆ°a cáº¥u hÃ¬nh khoÃ¡ API Filebase S3.';
    return false;
  }

  if (state.isSyncing) {
    logger.warn('[S3 Sync] Sync operation already in progress.');
    return false;
  }

  state.isSyncing = true;
  state.lastSyncStatus = 'in_progress';
  state.lastSyncMessage = 'Äang kiá»ƒm tra vÃ  táº£i cÆ¡ sá»Ÿ dá»¯ liá»‡u tá»« Filebase...';
  try {
    return await doDownloadLocked(s3, bucket);
  } finally {
    state.isSyncing = false;
  }
}

/** Pháº§n lÃµi cá»§a download â€” CHá»ˆ gá»i khi Ä‘Ã£ giá»¯ lock state.isSyncing. */
async function doDownloadLocked(s3: S3Client, bucket: string, knownHead?: RemoteInfo | null): Promise<boolean> {
  let head: RemoteInfo | null;
  if (knownHead === undefined) {
    try {
      head = await headRemote(s3, bucket);
    } catch (e: any) {
      logger.error('[S3 Sync] KhÃ´ng Ä‘á»c Ä‘Æ°á»£c metadata Filebase:', { error: e });
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = `KhÃ´ng Ä‘á»c Ä‘Æ°á»£c metadata Filebase: ${e.message || 'lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh'}`;
      return false;
    }
  } else {
    head = knownHead;
  }

  if (!head) {
    logger.info('[S3 Sync] No remote database found on Filebase.');
    state.lastSyncStatus = 'idle';
    state.lastSyncMessage = 'ChÆ°a cÃ³ báº£n sao lÆ°u trÃªn Filebase S3.';
    return false;
  }

  const local = localDbInfo();
  const st = readSyncState();
  const localValid = local.exists && local.headerOk && local.size >= MIN_VALID_DB_BYTES;

  if (localValid) {
    // (a) Äang giá»¯ Ä‘Ãºng báº£n remote nÃ y â†’ giá»¯ nguyÃªn (phÃ²ng ghi má»›i chÆ°a upload)
    if (st.baseVersion && st.baseVersion === head.version) {
      logger.info('[S3 Sync] Local database is up to date with Filebase.');
      state.lastSyncStatus = 'success';
      state.lastSyncTime = new Date().toISOString();
      state.lastSyncMessage = 'CÆ¡ sá»Ÿ dá»¯ liá»‡u cá»¥c bá»™ Ä‘Ã£ á»Ÿ phiÃªn báº£n má»›i nháº¥t.';
      if (!fs.existsSync(markerPath)) {
        try {
          fs.writeFileSync(markerPath, new Date().toISOString());
        } catch {}
      }
      return false;
    }

    // (b) Máº¥t sync_state nhÆ°ng ná»™i dung y há»‡t remote â†’ chá»‰ cáº§n nháº­n láº¡i base
    if (!st.baseVersion && head.etag && head.size === local.size && isPlainMd5(head.etag)) {
      try {
        const md5 = await fileMd5(dbPath);
        if (md5 === stripQuotes(head.etag)) {
          writeSyncState({ baseVersion: head.version, baseTime: head.lastModifiedMs, fingerprint: getDbFingerprint() });
          logger.info('[S3 Sync] Cá»¥c bá»™ trÃ¹ng khá»›p hoÃ n toÃ n vá»›i Filebase -> chá»‰ cáº­p nháº­t baseVersion.');
          state.lastSyncStatus = 'success';
          state.lastSyncTime = new Date().toISOString();
          state.lastSyncMessage = 'CÆ¡ sá»Ÿ dá»¯ liá»‡u trÃ¹ng khá»›p vá»›i Filebase (má»›i cáº­p nháº­t baseVersion).';
          return false;
        }
      } catch (err) {
        logger.warn('[S3 Sync] KhÃ´ng tÃ­nh Ä‘Æ°á»£c MD5 cá»¥c bá»™:', { error: err });
      }
    }

    // (c) CÃ²n láº¡i: remote KHÃC báº£n cá»¥c bá»™.
    //     Náº¿u báº£n cá»¥c bá»™ cÃ³ dá»¯ liá»‡u riÃªng (dirty / chÆ°a tá»«ng sync) thÃ¬ PHáº¢I lÆ°u
    //     vÃ o CONFLICT_KEY trÆ°á»›c; lÆ°u tháº¥t báº¡i â†’ há»§y download Ä‘á»ƒ khÃ´ng máº¥t dá»¯ liá»‡u.
    const needsBackup = (!st.baseVersion || isLocalDirty(st, local)) && countRealUsers() !== 0;
    if (needsBackup) {
      const ok = await backupLocalToS3(s3, bucket, local, 'remote-newer-or-forked');
      if (!ok) {
        state.lastSyncStatus = 'failed';
        state.lastSyncMessage =
          `KhÃ´ng thá»ƒ lÆ°u báº£n sao cá»¥c bá»™ vÃ o 'key xung đột â€” Há»¦U download Ä‘á»ƒ trÃ¡nh máº¥t dá»¯ liá»‡u.`;
        return false;
      }
    }
  }

  // --- Táº£i vá» vÃ  thay tháº¿ (atomic) ---
  logger.info('[S3 Sync] Downloading database from Filebase...', { remote: head.version });
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: DB_FILENAME }));
    if (!response.Body) throw new Error('S3 GetObject returned empty body');
    const buffer = Buffer.from(await response.Body.transformToByteArray());
    // DÃ¹ng ETag cá»§a CHÃNH file vá»«a táº£i (khÃ´ng dÃ¹ng ETag cá»§a HEAD trÆ°á»›c Ä‘Ã³) â€”
    // náº¿u cÃ³ instance khÃ¡c upload giá»¯a 2 lá»i gá»i thÃ¬ base váº«n trÃºng phiÃªn báº£n tháº­t.
    const baseVersion = response.ETag ? versionFromParts(response.ETag, head.lastModifiedMs) : head.version;

    // XÃ¡c thá»±c SQLite header há»£p lá»‡ trÆ°á»›c khi ghi Ä‘Ã¨
    const header = buffer.subarray(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      throw new Error('Dá»¯ liá»‡u táº£i vá» tá»« S3 khÃ´ng pháº£i lÃ  tá»‡p SQLite há»£p lá»‡!');
    }

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // ÄÃ³ng káº¿t ná»‘i SQLite hiá»‡n táº¡i trÆ°á»›c khi ghi Ä‘Ã¨ file Ä‘á»ƒ trÃ¡nh file-lock / corruption
    closeDbIfOpen();

    // XÃ³a cÃ¡c file WAL vÃ  SHM cÅ© â€” náº¿u giá»¯ láº¡i, SQLite sáº½ replay WAL cá»§a báº£n cÅ©
    // lÃªn file má»›i â†’ dá»¯ liá»‡u há»—n táº¡p / rollback khÃ³ hiá»ƒu.
    try {
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    } catch {}

    // Ghi táº¡m rá»“i rename: náº¿u bá»‹ kill giá»¯a chá»«ng thÃ¬ DB cÅ© váº«n cÃ²n nguyÃªn váº¹n
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

    // Ghi marker + baseVersion (Ä‘á»“ng bá»™ nguyÃªn tá»­ vá»›i lÃºc thay file)
    try {
      fs.writeFileSync(markerPath, new Date().toISOString());
    } catch {}
    writeSyncState({
      baseVersion,
      baseTime: head.lastModifiedMs,
      fingerprint: getDbFingerprint(),
    });
    // Ná»™i dung vá»«a táº£i lÃªn lÃ m má»‘c: trÃ¡nh vÃ²ng watcher upload ngay láº¡i 1 láº§n uá»•ng cÃ´ng
    markSynced(getDbFingerprint());

    logger.info('[S3 Sync] Successfully downloaded and restored database from Filebase.');
    state.lastSyncStatus = 'success';
    state.lastSyncTime = new Date().toISOString();
    state.lastSyncMessage = 'ÄÃ£ khÃ´i phá»¥c thÃ nh cÃ´ng cÆ¡ sá»Ÿ dá»¯ liá»‡u tá»« Filebase S3!';
    return true;
  } catch (error: any) {
    logger.error('[S3 Sync] Error downloading database:', { error });
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = `Lá»—i táº£i: ${error.message || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh'}`;
    return false;
  }
}

// ---------------------------------------------------------------------------
// UPLOAD
// ---------------------------------------------------------------------------

/**
 * Táº£i cÆ¡ sá»Ÿ dá»¯ liá»‡u hiá»‡n táº¡i lÃªn Filebase S3 theo QUY Táº®C THá»¨ Tá»°:
 * - pháº£i lÃ  háº­u duá»‡ cá»§a báº£n remote hiá»‡n táº¡i (baseVersion === ETag) â†’ dÃ¹ng
 *   If-Match (conditional write), khÃ´ng bao giá» ghi Ä‘Ã¨ instance khÃ¡c vá»«a ghi;
 * - chÆ°a tá»«ng sync â†’ KHÃ”NG upload (chá»‘ng DB trá»‘ng ghi Ä‘Ã¨ backup tháº­t);
 * - xung Ä‘á»™t â†’ báº£n cá»¥c bá»™ lÆ°u vÃ o CONFLICT_KEY, remote tháº¯ng vÃ  Ä‘Æ°á»£c táº£i vá».
 */
export async function uploadDbToS3(): Promise<boolean> {
  const s3 = getS3Client();
  const bucket = getBucketName();

  if (!s3) {
    logger.warn('[S3 Sync] Filebase credentials not configured. Skipping upload.');
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'ChÆ°a cáº¥u hÃ¬nh khoÃ¡ API Filebase S3.';
    return false;
  }

  if (!fs.existsSync(dbPath)) {
    logger.warn('[S3 Sync] Local database file does not exist at:', dbPath);
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'KhÃ´ng tÃ¬m tháº¥y tá»‡p cÆ¡ sá»Ÿ dá»¯ liá»‡u cá»¥c bá»™.';
    return false;
  }

  if (state.isSyncing) {
    let waits = 0;
    while (state.isSyncing && waits < 10) {
      await new Promise((r) => setTimeout(r, 400));
      waits++;
    }
    if (state.isSyncing) {
      // KhÃ´ng bá» cuá»™c: yÃªu cáº§u vÃ²ng tick upload láº¡i sá»›m (Ä‘á»«ng Ä‘á»ƒ thao tÃ¡c ghi bá»‹ quÃªn)
      autoSync.retryRequested = true;
      logger.warn('[S3 Sync] Another sync operation is currently running. Sáº½ upload láº¡i sá»›m.');
      state.lastSyncMessage = 'Äang cÃ³ thao tÃ¡c Ä‘á»“ng bá»™ khÃ¡c cháº¡y, sáº½ upload láº¡i sá»›m.';
      return false;
    }
  }

  state.isSyncing = true;
  state.lastSyncStatus = 'in_progress';
  state.lastSyncMessage = 'Äang Ä‘á»“ng bá»™ cÆ¡ sá»Ÿ dá»¯ liá»‡u lÃªn Filebase S3...';

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
        state.lastSyncMessage = `KhÃ´ng thá»ƒ táº¡o bucket trÃªn Filebase: ${createErr.message}`;
        autoSync.retryRequested = true;
        return false;
      }
    }

    logger.error('[S3 Sync] Error uploading database:', { error });
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = `Lá»—i táº£i lÃªn Filebase: ${error.message || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh'}`;
    autoSync.retryRequested = true;
    return false;
  } finally {
    state.isSyncing = false;
  }
}

/** Pháº§n lÃµi cá»§a upload â€” CHá»ˆ gá»i khi Ä‘Ã£ giá»¯ lock state.isSyncing. */
async function uploadLocked(s3: S3Client, bucket: string): Promise<boolean> {
  // 1. Checkpoint WAL trÆ°á»›c: má»i transaction má»›i nháº¥t pháº£i náº±m trong file chÃ­nh.
  checkpointLocalDb();
  // Fingerprint NGAY SAU checkpoint, TRÆ¯á»šC khi stream: tráº¡ng thÃ¡i thá»±c sá»± sáº½ Ä‘Æ°á»£c Ä‘Æ°a lÃªn.
  // Ghi xáº£y ra trong lÃºc upload sáº½ táº¡o fingerprint khÃ¡c -> vÃ²ng auto-sync tá»± phÃ¡t hiá»‡n á»Ÿ tick sau.
  const uploadedFingerprint = getDbFingerprint();
  const local = localDbInfo();

  // 2. Chá»‘t an toÃ n: file pháº£i lÃ  SQLite há»£p lá»‡
  if (!local.exists || !local.headerOk || local.size < MIN_VALID_DB_BYTES) {
    logger.warn('[S3 Safety Guard] Tá»« chá»‘i upload: file cá»¥c bá»™ khÃ´ng pháº£i SQLite há»£p lá»‡ hoáº·c quÃ¡ nhá».', {
      size: local.size,
      headerOk: local.headerOk,
    });
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage = 'Huá»· upload: tá»‡p cá»¥c bá»™ khÃ´ng há»£p lá»‡ / chÆ°a náº¡p Ä‘á»§ dá»¯ liá»‡u.';
    return false;
  }

  // 3. Äá»c metadata báº£n remote hiá»‡n táº¡i (404 â†’ null, lá»—i máº¡ng â†’ nÃ©m ra ngoÃ i)
  const head = await headRemote(s3, bucket);
  const st = readSyncState();

  // --- ChÆ°a cÃ³ báº£n remote nÃ o â†’ publish láº§n Ä‘áº§u (khÃ´ng cÃ³ gÃ¬ Ä‘á»ƒ ghi Ä‘Ã¨) ---
  if (!head) {
    const put = await putWithCas(s3, bucket, null);
    if (!put.ok) throw put.error;
    return finishUpload(put.etag, uploadedFingerprint, 'ÄÃ£ táº¡o báº£n sao lÆ°u Ä‘áº§u tiÃªn trÃªn Filebase S3! ðŸš€');
  }

  // --- Chá»‘ng "DB trá»‘ng ghi Ä‘Ã¨ backup tháº­t" (nguyÃªn nhÃ¢n gá»‘c cá»§a hiá»‡n tÆ°á»£ng máº¥t tÃ i khoáº£n):
  // chÆ°a tá»«ng táº£i remote vá» + remote cÃ³ dá»¯ liá»‡u tháº­t + local chá»‰ cÃ³ admin/demo seed
  // â†’ KHÃ”NG upload, táº£i báº£n remote vá» ngay thay vÃ¬ ghi Ä‘Ã¨. ---
  if (!st.baseVersion && head.size >= REMOTE_REAL_DB_BYTES && countRealUsers() === 0) {
    logger.error(
      '[S3 Safety Guard] Báº¢O Vá»† Dá»® LIá»†U: DB cá»¥c bá»™ chÆ°a tá»«ng Ä‘á»“ng bá»™ vÃ  chá»‰ cÃ³ tÃ i khoáº£n máº·c Ä‘á»‹nh â€” ' +
        'tá»« chá»‘i upload, táº£i báº£n Filebase vá» thay tháº¿.'
    );
    await doDownloadLocked(s3, bucket, head);
    state.lastSyncStatus = 'failed';
    state.lastSyncMessage =
      'Huá»· upload: tá»‡p cá»¥c bá»™ chÆ°a náº¡p Ä‘á»§ dá»¯ liá»‡u (chÆ°a tá»«ng Ä‘á»“ng bá»™) â€” Ä‘Ã£ táº£i láº¡i báº£n tá»« Filebase Ä‘á»ƒ trÃ¡nh ghi Ä‘Ã¨!';
    return false;
  }

  // --- LÃ  háº­u duá»‡ há»£p lá»‡ cá»§a chÃ­nh báº£n remote hiá»‡n táº¡i â†’ upload cÃ³ Ä‘iá»u kiá»‡n (CAS) ---
  if (st.baseVersion && st.baseVersion === head.version) {
    let put = await putWithCas(s3, bucket, head.etag);
    if (!put.ok && put.unsupported) {
      // Filebase cÃ³ thá»ƒ chÆ°a há»— trá»£ If-Match â†’ xÃ¡c minh remote váº«n lÃ  base rá»“i upload thÆ°á»ng
      logger.warn('[S3 Sync] Server khÃ´ng há»— trá»£ If-Match â€” kiá»ƒm tra láº¡i Ä‘iá»u kiá»‡n trÆ°á»›c khi upload thÆ°á»ng.', {
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
      // Instance khÃ¡c vá»«a ghi lÃªn remote trong lÃºc mÃ¬nh chuáº©n bá»‹ upload â†’ xung Ä‘á»™t
      const now = await headRemote(s3, bucket);
      if (!now) {
        // Remote biáº¿n máº¥t giá»¯a chá»«ng â†’ khÃ´ng cÃ²n gÃ¬ Ä‘á»ƒ ghi Ä‘Ã¨, publish láº¡i bÃ¬nh thÆ°á»ng
        const publish = await putWithCas(s3, bucket, null);
        if (!publish.ok) throw publish.error;
        return finishUpload(publish.etag, uploadedFingerprint, 'ÄÃ£ Ä‘á»“ng bá»™ lÃªn Filebase (remote trÆ°á»›c Ä‘Ã³ Ä‘Ã£ biáº¿n máº¥t).');
      }
      if (now.version !== head.version) {
        logger.error('[S3 Sync] XUNG Äá»˜T (412): remote Ä‘á»•i giá»¯a lÃºc HEAD vÃ  PUT â€” nhÆ°á»ng cho báº£n má»›i hÆ¡n.');
        return await forkRejoin(s3, bucket, now, local);
      }
      // ETag khÃ´ng Ä‘á»•i nhÆ°ng server khÃ´ng cháº¥p nháº­n Ä‘iá»u kiá»‡n â†’ thá»­ upload thÆ°á»ng má»™t láº§n
      put = await putWithCas(s3, bucket, null);
      if (!put.ok) throw put.error;
    }
    if (put.ok) {
      return finishUpload(put.etag, uploadedFingerprint, 'Äá»“ng bá»™ cÆ¡ sá»Ÿ dá»¯ liá»‡u lÃªn Filebase S3 thÃ nh cÃ´ng 100%! ðŸš€');
    }
    throw put.error;
  }

  // --- Máº¥t sync_state nhÆ°ng ná»™i dung y há»‡t remote â†’ chá»‰ nháº­n láº¡i base, khÃ´ng cáº§n upload ---
  if (!st.baseVersion && head.etag && head.size === local.size && isPlainMd5(head.etag)) {
    const md5 = await fileMd5(dbPath);
    if (md5 === stripQuotes(head.etag)) {
      writeSyncState({ baseVersion: head.version, baseTime: head.lastModifiedMs, fingerprint: uploadedFingerprint });
      markSynced(uploadedFingerprint);
      state.lastSyncStatus = 'success';
      state.lastSyncTime = new Date().toISOString();
      state.lastSyncMessage = 'CÆ¡ sá»Ÿ dá»¯ liá»‡u trÃ¹ng khá»›p vá»›i Filebase (Ä‘Ã£ nháº­n láº¡i baseVersion).';
      return true;
    }
  }

  // --- MÃ¡y dev push CHá»¦ Äá»˜NG (ngoÃ i production): Ä‘Æ°á»£c phÃ©p ghi Ä‘Ã¨, nhÆ°ng LUÃ”N
  // lÆ°u báº£n remote cÅ© vÃ o SUPERSEDED_KEY trÆ°á»›c Ä‘á»ƒ khÃ´ng bao giá» máº¥t dá»¯ liá»‡u. ---
  if (!prodLike()) {
    if (head.size >= REMOTE_REAL_DB_BYTES && countRealUsers() === 0) {
      logger.error('[S3 Safety Guard] Push tá»« chá»‘i: cá»¥c bá»™ chá»‰ cÃ³ tÃ i khoáº£n máº·c Ä‘á»‹nh, táº£i báº£n remote vá» thay tháº¿.');
      await doDownloadLocked(s3, bucket, head);
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = 'Huá»· push: tá»‡p cá»¥c bá»™ trá»‘ng â€” Ä‘Ã£ táº£i báº£n Filebase vá» thay tháº¿.';
      return false;
    }
    const backedUp = await backupRemoteToS3(s3, bucket);
    if (!backedUp) {
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = `KhÃ´ng lÆ°u Ä‘Æ°á»£c báº£n remote cÅ© vÃ o '${SUPERSEDED_KEY}' â€” huá»· push Ä‘á»ƒ trÃ¡nh máº¥t dá»¯ liá»‡u.`;
      return false;
    }
    const put = await putWithCas(s3, bucket, head.etag);
    if (!put.ok) {
      if (put.unsupported) {
        const retry = await putWithCas(s3, bucket, null);
        if (retry.ok) {
          return finishUpload(retry.etag, uploadedFingerprint, `ÄÃ£ push báº£n cá»¥c bá»™ lÃªn Filebase (báº£n remote cÅ© lÆ°u táº¡i '${SUPERSEDED_KEY}').`);
        }
        throw retry.error;
      }
      state.lastSyncStatus = 'failed';
      state.lastSyncMessage = 'Remote thay Ä‘á»•i trong lÃºc push â€” thá»­ láº¡i láº§n ná»¯a.';
      autoSync.retryRequested = true;
      return false;
    }
    return finishUpload(
      put.etag,
      uploadedFingerprint,
      `ÄÃ£ push báº£n cá»¥c bá»™ lÃªn Filebase (báº£n remote cÅ© lÆ°u táº¡i '${SUPERSEDED_KEY}').`
    );
  }

  // --- Production: XUNG Äá»˜T (cá»¥c bá»™ KHÃ”NG pháº£i háº­u duá»‡ cá»§a remote hiá»‡n táº¡i) ---
  return await forkRejoin(s3, bucket, head, local);
}

/**
 * Xá»­ lÃ½ xung Ä‘á»™t (instance lá»‡ch pha vá»›i remote):
 * - báº£n cá»¥c bá»™ cÃ³ dá»¯ liá»‡u riÃªng â†’ lÆ°u vÃ o CONFLICT_KEY (náº¿u lÆ°u Ä‘Æ°á»£c);
 * - remote tháº¯ng â†’ táº£i báº£n remote vá» Ä‘á»ƒ instance tÃ¡i gia nháº­p "Ä‘á»™i";
 * - tráº£ vá» false: láº§n upload nÃ y KHÃ”NG xáº£y ra, nhÆ°ng khÃ´ng bÃªn nÃ o máº¥t dá»¯ liá»‡u.
 */
async function forkRejoin(s3: S3Client, bucket: string, head: RemoteInfo | null, local: LocalDbInfo): Promise<boolean> {
  const st = readSyncState();
  logger.error('[S3 Sync] XUNG Äá»˜T Äá»’NG Bá»˜: báº£n cá»¥c bá»™ khÃ´ng pháº£i háº­u duá»‡ cá»§a báº£n Filebase hiá»‡n táº¡i.', {
    baseVersion: st.baseVersion,
    remoteVersion: head?.version ?? null,
    localDataTime: local.dataTimeMs ? new Date(local.dataTimeMs).toISOString() : null,
    realUsers: countRealUsers(),
  });

  const downloaded = await doDownloadLocked(s3, bucket, head);
  state.lastSyncStatus = 'failed';
  state.lastSyncTime = new Date().toISOString();
  state.lastSyncMessage = downloaded
    ? `PhÃ¡t hiá»‡n xung Ä‘á»™t Ä‘á»“ng bá»™: Ä‘Ã£ táº£i báº£n Filebase má»›i nháº¥t vá» vÃ  (náº¿u cÃ³) lÆ°u báº£n cá»¥c bá»™ vÃ o 'key xung đột. ` +
      'Dá»¯ liá»‡u bÃªn thua váº«n cÃ²n trong key Ä‘Ã³ Ä‘á»ƒ Ä‘á»‘i chiáº¿u/chÃ©p tay.'
    : `PhÃ¡t hiá»‡n xung Ä‘á»™t Ä‘á»“ng bá»™ nhÆ°ng khÃ´ng tá»± xá»­ lÃ½ Ä‘Æ°á»£c â€” xem log mÃ¡y chá»§. Báº£n cá»¥c bá»™ (náº¿u cÃ³) chÆ°a bá»‹ xÃ³a.`;
  return false;
}

/** HoÃ n táº¥t má»™t láº§n upload: ghi baseVersion (ETag vá»«a upload) + markSynced. */
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

// Khi auto-sync bá»‹ táº¯t (máº·c Ä‘á»‹nh ngoÃ i Vercel): náº¿u trong lÃºc dev server váº«n cÃ²n
// timer cá»§a phiÃªn báº£n code cÅ© (HMR khÃ´ng reload láº¡i db.ts) thÃ¬ táº¯t háº³n timer Ä‘Ã³
// vÃ  vÃ´ hiá»‡u tick â€” trÃ¡nh code cÅ© tiáº¿p tá»¥c upload DB dev Ä‘Ã¨ backup production.
if (typeof window === 'undefined' && !autoSyncEnabled()) {
  if (global.__autoSyncTimer) {
    try {
      clearInterval(global.__autoSyncTimer);
    } catch {}
    global.__autoSyncTimer = undefined;
  }
  global.__autoSyncTick = async () => {};
}

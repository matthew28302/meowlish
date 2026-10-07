import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const isVercel = process.env.VERCEL === '1';
const dbDir = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'english_learning.db');

declare global {
  // eslint-disable-next-line no-var
  var __dbInstance: Database.Database | undefined;
}

/**
 * Salt MỚI (bắt buộc chọn 1 giá trị duy nhất cho mọi môi trường).
 * Đặt biến môi trường AUTH_SALT giống nhau ở local và production, nếu không có
 * thì cả hai dùng LEGACY_PASSWORD_SALT.
 */
const LEGACY_PASSWORD_SALT = 'english_for_me_salt_2026';

/** Salt đang có hiệu lực ở instance này. */
function currentPasswordSalt(): string {
  return process.env.AUTH_SALT || LEGACY_PASSWORD_SALT;
}

// Thông số scrypt (lưu trong chính chuỗi hash để tương lai tăng được cost)
const PASSWORD_SCHEME = 'scrypt';
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

/**
 * Băm mật khẩu (SCHEME MỚI): scrypt + salt NGẪU NHIÊN RIÊNG cho từng người.
 * Cấu trúc: scrypt$N$r$p$saltBase64$hashBase64
 * - Salt per-user ⇒ 2 người cùng đặt mật khẩu giống nhau sẽ có hash khác nhau
 *   (SHA-256 + salt chung để lộ ra điều này, xem verifyPassword bên dưới).
 * - Có version → có thể nâng cost/nâng cấp thuật toán về sau mà không phá dữ liệu cũ.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `${PASSWORD_SCHEME}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/** Hash kiểu CŨ: SHA-256(password + salt) — chỉ dùng để ĐỌC/so khớp dữ liệu cũ. */
export function hashPasswordLegacy(password: string, salt: string = currentPasswordSalt()): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function safeEqualsHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export type PasswordCheck = {
  ok: boolean;
  /** true = khớp bằng thuật toán/salt CŨ ⇒ nên nâng cấp lại hash khi có plaintext. */
  needsRehash: boolean;
  scheme: 'scrypt' | 'legacy-current' | 'legacy-fallback' | 'unknown';
};

/**
 * Kiểm tra mật khẩu, chấp nhận CẢ hash cũ lẫn hash mới.
 *
 * VÌ SAO phải chấp nhận "legacy-fallback":
 *   Khi Vercel mới có env AUTH_SALT trong khi máy local (và các tài khoản tạo
 *   trước đó) dùng salt fallback, hash của họ được tính bằng salt fallback.
 *   Instance nào chỉ thử salt hiện hành sẽ từ chối đúng mật khẩu đó → "sai mật
 *   khẩu" dù người dùng không đổi gì. Đây là nguyên nhân đăng nhập hỏng riêng
 *   trên production. Thử cả hai salt giúp mọi tài khoản cũ đăng nhập lại được.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): PasswordCheck {
  if (!storedHash || typeof storedHash !== 'string') return { ok: false, needsRehash: false, scheme: 'unknown' };

  // (1) Scheme mới: scrypt
  if (storedHash.startsWith(`${PASSWORD_SCHEME}$`)) {
    const parts = storedHash.split('$');
    const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
    if (!nRaw || !rRaw || !pRaw || !saltB64 || !hashB64) return { ok: false, needsRehash: false, scheme: 'unknown' };
    try {
      const expected = Buffer.from(hashB64, 'base64');
      const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
        N: Number(nRaw),
        r: Number(rRaw),
        p: Number(pRaw),
      });
      const ok = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
      return { ok, needsRehash: false, scheme: 'scrypt' };
    } catch {
      return { ok: false, needsRehash: false, scheme: 'unknown' };
    }
  }

  // (2) Scheme cũ: SHA-256 + salt hiện hành
  if (safeEqualsHex(hashPasswordLegacy(password), storedHash)) {
    return { ok: true, needsRehash: true, scheme: 'legacy-current' };
  }

  // (3) Scheme cũ: SHA-256 + salt fallback (tài khoản tạo trước khi có AUTH_SALT)
  const current = currentPasswordSalt();
  if (current !== LEGACY_PASSWORD_SALT && safeEqualsHex(hashPasswordLegacy(password, LEGACY_PASSWORD_SALT), storedHash)) {
    return { ok: true, needsRehash: true, scheme: 'legacy-fallback' };
  }

  return { ok: false, needsRehash: false, scheme: 'unknown' };
}

/**
 * Fingerprint của AUTH_SALT (SHA-256 12 ký tự đầu) — chỉ để đối chiếu giữa các
 * instance/bản sao lưu, KHÔNG lộ giá trị salt. Nếu production và bản backup
 * có fingerprint khác nhau → hash mật khẩu không bao giờ khớp (mất đăng nhập).
 */
function getAuthSaltFingerprint(): string {
  return crypto.createHash('sha256').update(currentPasswordSalt()).digest('hex').slice(0, 12);
}

/**
 * Khôi phục tệp CSDL SQLite từ Filebase S3 một cách đồng bộ TRƯỚC KHI mở kết nối CSDL
 * Điều này đảm bảo trên Vercel Serverless không bao giờ sinh ra database rỗng làm mất tài khoản/tiến độ người dùng!
 */
function ensureDatabaseRestoredSync(): void {
  try {
    let localSize = 0;
    try {
      if (fs.existsSync(dbPath)) localSize = fs.statSync(dbPath).size;
    } catch {}

    const markerPath = path.join(dbDir, '.s3_restored');
    const needsRestore = (isVercel && !fs.existsSync(markerPath)) || localSize < 1_000_000;

    if (needsRestore) {
      const scriptPath = path.join(process.cwd(), 'scripts', 'restore-s3.js');
      if (fs.existsSync(scriptPath)) {
        console.log('[SQLite DB] Cold-start / missing DB detected -> Synchronously restoring from Filebase S3...');
        // LƯU Ý: restore-s3.js tự so sánh LastModified local/remote và CHỈ thay
        // DB khi an toàn (remote mới hơn hoặc DB trống) — không còn ghi đè mù quáng.
        execFileSync(process.execPath, [scriptPath], { stdio: 'inherit', timeout: 35000 });
      } else {
        console.error(`[SQLite DB] CRITICAL: Thiếu script ${scriptPath} — không thể khôi phục DB từ Filebase!`);
      }

      // Kiểm tra NGAY kết quả khôi phục để không vô tình phục vụ DB trống trong im lặng
      let afterSize = 0;
      try {
        if (fs.existsSync(dbPath)) afterSize = fs.statSync(dbPath).size;
      } catch {}
      const markerOk = fs.existsSync(markerPath);
      if (afterSize < 1_000_000 && !markerOk) {
        console.error(
          '[SQLite DB] CRITICAL: Khôi phục từ Filebase THẤT BẠI (DB vẫn trống/không hợp lệ). ' +
            'Instance này sẽ chạy với DB mới tạo; quy tắc S3 sync sẽ CHẶN upload để không ghi đè backup thật.'
        );
      } else if (!markerOk) {
        console.warn(
          '[SQLite DB] Chưa có marker khôi phục — s3Sync sẽ tự đối chiếu remote và xử lý trong vài giây tới.'
        );
      }
    }
  } catch (err: any) {
    console.warn('[SQLite DB] Cold-start S3 restore notice:', err?.message || String(err));
  }
}

function getDatabase(): Database.Database {
  if (!global.__dbInstance || !global.__dbInstance.open) {
    global.__dbInstance = createDb();
  }
  return global.__dbInstance;
}

function createDb(): Database.Database {
  ensureDatabaseRestoredSync();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

  // Log fingerprint AUTH_SALT mỗi lần mở DB (KHÔNG log chính giá trị salt).
  // Nếu 2 instance/bản backup có fingerprint khác nhau → hash mật khẩu không
  // bao giờ khớp nhau → nhanh chóng xác định được nguyên nhân mất đăng nhập.
  console.log(
    '[SQLite DB] AUTH_SALT:',
    process.env.AUTH_SALT ? 'dùng env AUTH_SALT' : 'dùng fallback mặc định',
    '| fingerprint:',
    getAuthSaltFingerprint()
  );

  // Create tables with full user isolation
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT DEFAULT '🐱',
      streak INTEGER DEFAULT 1,
      last_active_date TEXT,
      exp INTEGER DEFAULT 50,
      level INTEGER DEFAULT 1,
      password_changed_at INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT,
      translation TEXT NOT NULL,
      context_sentence TEXT,
      note TEXT,
      tags TEXT DEFAULT 'general',
      mastery_level INTEGER DEFAULT 0,
      last_reviewed TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, module_type, item_id)
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      details_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_pets (
      user_id TEXT PRIMARY KEY,
      pet_type TEXT NOT NULL DEFAULT 'owl',
      pet_name TEXT NOT NULL DEFAULT 'Lexi',
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      hunger INTEGER DEFAULT 80,
      happiness INTEGER DEFAULT 90,
      energy INTEGER DEFAULT 100,
      selected_habitat TEXT DEFAULT 'emerald_garden',
      equipped_hat TEXT DEFAULT 'none',
      equipped_outfit TEXT DEFAULT 'none',
      equipped_accessory TEXT DEFAULT 'none',
      last_fed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_interacted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pet_inventory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      is_equipped INTEGER DEFAULT 0,
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS pet_garden_decor (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      decor_id TEXT NOT NULL,
      slot_index INTEGER NOT NULL,
      placed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, slot_index)
    );
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_translation_cache (
      query_key TEXT PRIMARY KEY,
      query_type TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pet_farm_plots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plot_index INTEGER NOT NULL,
      crop_type TEXT DEFAULT 'carrot',
      stage TEXT DEFAULT 'empty',
      planted_at TEXT,
      watered_at TEXT,
      harvest_ready_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, plot_index)
    );

    CREATE TABLE IF NOT EXISTS pet_farm_livestock (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      animal_type TEXT NOT NULL,
      fed_at TEXT,
      ready_at TEXT,
      produced_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, animal_type)
    );

    CREATE TABLE IF NOT EXISTS user_friends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT DEFAULT 'accepted',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS user_couples (
      id TEXT PRIMARY KEY,
      user_id_1 TEXT NOT NULL,
      user_id_2 TEXT NOT NULL,
      ring_type TEXT DEFAULT 'diamond_ring',
      love_points INTEGER DEFAULT 100,
      married_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id_1, user_id_2)
    );

    CREATE TABLE IF NOT EXISTS pet_chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      pet_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Vết lần nhận thưởng PVP / đua thú cưng, chống gọi lặp để cộng coins vô hạn.
    CREATE TABLE IF NOT EXISTS reward_claims (
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      claimed_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, kind)
    );

    -- Hạn mức phần thưởng học tập theo ngày. itemId do client gửi lên nên kẻ
    -- tấn công có thể bịa itemId mới mỗi request để né chống trùng; bảng này chặn
    -- nốt đường đó bằng trần cứng cho tổng coins/exp trong ngày.
    CREATE TABLE IF NOT EXISTS progress_daily_budget (
      user_id TEXT NOT NULL,
      day TEXT NOT NULL,
      coins_spent INTEGER NOT NULL DEFAULT 0,
      exp_spent INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    );

    CREATE INDEX IF NOT EXISTS idx_coin_tx_user_id ON coin_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_date);
    CREATE INDEX IF NOT EXISTS idx_farm_plots_user ON pet_farm_plots(user_id);
    CREATE INDEX IF NOT EXISTS idx_farm_livestock_user ON pet_farm_livestock(user_id);
    CREATE INDEX IF NOT EXISTS idx_friends_user ON user_friends(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_created ON pet_chat_messages(created_at);

    -- Token đặt lại mật khẩu dùng 1 lần, hash SHA-256, TTL 60 phút.
    -- Trước đây: sinh mật khẩu ngẫu nhiên gửi trực tiếp qua email — token
    -- không expire, không thể thu hồi, email bị intercept = mất tài khoản.
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration: thêm password_changed_at cho DB cũ (chưa có cột này).
  // Bỏ qua lỗi — chỉ apply khi cột chưa tồn tại.
  try {
    const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
    if (!userCols.some((c) => c.name === 'password_changed_at')) {
      db.exec('ALTER TABLE users ADD COLUMN password_changed_at INTEGER DEFAULT 0');
    }
  } catch {}

  // Migration: Ensure 'coins' and 'email' columns exist
  try {
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const hasCoins = userColumns.some((col) => col.name === 'coins');
    if (!hasCoins) {
      db.exec("ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 1000;");
    }
    const hasEmail = userColumns.some((col) => col.name === 'email');
    if (!hasEmail) {
      db.exec("ALTER TABLE users ADD COLUMN email TEXT;");
    }
    const hasTargetExam = userColumns.some((col) => col.name === 'target_exam');
    if (!hasTargetExam) {
      db.exec("ALTER TABLE users ADD COLUMN target_exam TEXT DEFAULT 'toeic';");
    }
    const hasRole = userColumns.some((col) => col.name === 'role');
    if (!hasRole) {
      db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';");
    }
    const hasStatus = userColumns.some((col) => col.name === 'status');
    if (!hasStatus) {
      db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';");
    }
    const has2FA = userColumns.some((col) => col.name === 'two_factor_enabled');
    if (!has2FA) {
      db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;");
    }
    const hasEmailVerified = userColumns.some((col) => col.name === 'email_verified');
    if (!hasEmailVerified) {
      db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;");
    }

    // Tạo bảng lưu phiên OTP xác thực cho người dùng (2FA Login, Xác thực Email, Bật/Tắt 2FA)
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_otp_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        purpose TEXT NOT NULL,
        email TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        expires_at INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_otp_user_id ON user_otp_sessions(user_id);
    `);

    // Bảng nhật ký truy cập (Log Access)
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_access_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        username TEXT,
        action TEXT NOT NULL,
        ip TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'success',
        details TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_access_logs_time ON system_access_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_access_logs_action ON system_access_logs(action);
    `);

    // Bảng nhật ký lỗi hệ thống (Log Error)
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_error_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        endpoint TEXT,
        error_message TEXT NOT NULL,
        stack_trace TEXT,
        ip TEXT,
        user_id TEXT,
        severity TEXT DEFAULT 'error'
      );
      CREATE INDEX IF NOT EXISTS idx_error_logs_time ON system_error_logs(timestamp);
    `);

    // Bảng nhật ký gửi email (Log Email)
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_email_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        recipient TEXT NOT NULL,
        subject TEXT,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        ip TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_email_logs_time ON system_email_logs(timestamp);
    `);

    // Bảng tin nhắn hỗ trợ & góp ý (Support messages)
    db.exec(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        user_id TEXT,
        category TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        status TEXT DEFAULT 'new',
        admin_reply TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_support_status ON support_messages(status);
      CREATE INDEX IF NOT EXISTS idx_support_time ON support_messages(created_at);
    `);

    // Migration: Cột priority & indexes cho bảng support_messages
    try {
      const supportCols = db.prepare("PRAGMA table_info(support_messages)").all() as { name: string }[];
      const hasPriority = supportCols.some((col) => col.name === 'priority');
      if (!hasPriority) {
        db.exec("ALTER TABLE support_messages ADD COLUMN priority TEXT DEFAULT 'medium';");
      }
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_support_user ON support_messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_support_email ON support_messages(email);
        CREATE INDEX IF NOT EXISTS idx_support_priority ON support_messages(priority);
      `);
    } catch {}

    // Bảng Phòng Đấu & Ghép Cặp Thật (Pet Battle Rooms)
    db.exec(`
      CREATE TABLE IF NOT EXISTS pet_battle_rooms (
        id TEXT PRIMARY KEY,
        room_name TEXT NOT NULL,
        game_type TEXT NOT NULL DEFAULT 'pvp',
        bet_coins INTEGER DEFAULT 100,
        host_id TEXT NOT NULL,
        host_name TEXT NOT NULL,
        host_pet_type TEXT NOT NULL,
        host_pet_level INTEGER DEFAULT 1,
        guest_id TEXT,
        guest_name TEXT,
        guest_pet_type TEXT,
        guest_pet_level INTEGER DEFAULT 1,
        status TEXT DEFAULT 'waiting',
        winner_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_battle_rooms_status ON pet_battle_rooms(status);
      CREATE INDEX IF NOT EXISTS idx_battle_rooms_host ON pet_battle_rooms(host_id);
    `);

    // Migration cho bảng user_couples
    try {
      const coupleCols = db.prepare("PRAGMA table_info(user_couples)").all() as { name: string }[];
      if (!coupleCols.some((col) => col.name === 'status')) {
        db.exec("ALTER TABLE user_couples ADD COLUMN status TEXT DEFAULT 'accepted';");
      }
      if (!coupleCols.some((col) => col.name === 'proposer_id')) {
        db.exec("ALTER TABLE user_couples ADD COLUMN proposer_id TEXT;");
      }
    } catch {}

    // Cập nhật tất cả tài khoản cũ chưa có giá trị coins mặc định
    db.exec("UPDATE users SET coins = 1000 WHERE coins IS NULL;");
    db.exec("UPDATE users SET role = 'user' WHERE role IS NULL;");
    db.exec("UPDATE users SET status = 'active' WHERE status IS NULL;");
    db.exec("UPDATE users SET two_factor_enabled = 0 WHERE two_factor_enabled IS NULL;");
    // Chỉ write khi THẬT SỰ cần đổi — mọi UPDATE mỗi lần boot sẽ làm "bẩn" DB
    // (đổi mtime/WAL) và khiến auto-sync upload uổng công, tăng nguy cơ xung đột.
    db.exec("UPDATE users SET email_verified = 1 WHERE username IN ('admin', 'demo') AND COALESCE(email_verified, 0) <> 1;");

    // Đảm bảo tài khoản admin tồn tại.
    //
    // Mật khẩu admin KHÔNG nằm trong source: repo này là PUBLIC nên ghi literal
    // vào đây là phát tán mật khẩu quản trị cho cả internet. Chỉ seed khi thiếu
    // biến môi trường ADMIN_INITIAL_PASSWORD.
    //
    // Và KHÔNG bao giờ ép reset mật khẩu admin khi deploy: bản cũ so `password_hash
    // <> <hash seed>` nên mỗi lần boot đều ghi đè — nghĩa là đổi mật khẩu admin xong
    // thì bị trả về mật khẩu cũ ở lần deploy kế tiếp.
    const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    const checkAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: string } | undefined;
    if (!checkAdmin) {
      if (adminInitialPassword) {
        const today = new Date().toISOString().split('T')[0];
        db.prepare(`
          INSERT INTO users (id, username, email, password_hash, display_name, avatar, streak, last_active_date, exp, level, coins, role, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('user_admin_root', 'admin', 'admin@meowlish.com', hashPassword(adminInitialPassword), 'Quản Trị Viên (Admin)', '🛡️', 99, today, 9999, 99, 99999, 'admin', 'active');

        db.prepare(`
          INSERT OR IGNORE INTO user_pets (user_id, pet_type, pet_name, level, exp, hunger, happiness, energy, selected_habitat, equipped_hat, equipped_outfit, equipped_accessory)
          VALUES (?, 'doraemon', 'Doraemon Admin', 99, 9999, 100, 100, 100, 'doraemon_field', 'bamboo_copter', 'none', 'none')
        `).run('user_admin_root');
        console.warn('[SQLite DB] Đã tạo tài khoản admin từ ADMIN_INITIAL_PASSWORD. Nên xoá biến này khỏi môi trường sau lần deploy đầu.');
      } else {
        console.error(
          '[SQLite DB] CRITICAL: chưa có tài khoản admin và thiếu biến môi trường ' +
            'ADMIN_INITIAL_PASSWORD → không tạo tài khoản nào (không tạo mật khẩu mặc định trong source).'
        );
      }
    } else {
      // Chỉ sửa metadata quyền/trạng thái, KHÔNG đụng tới password_hash.
      const adminRow = db
        .prepare('SELECT role, status FROM users WHERE username = ?')
        .get('admin') as { role: string | null; status: string | null } | undefined;

      if (adminRow && (adminRow.role !== 'admin' || adminRow.status !== 'active')) {
        db.prepare(`UPDATE users SET role = 'admin', status = 'active' WHERE username = 'admin'`).run();
      }
    }

    // Clear old AI cache to ensure all explanations use the new 100% Vietnamese prompt format.
    // CHỈ xoá khi thực sự có dòng cần xoá: DELETE rỗng vẫn làm WAL đổi → mỗi lần
    // cold start lại ghi DB và kích hoạt upload, tăng nguy cơ xung đột S3.
    const pedagogyCache = db
      .prepare("SELECT COUNT(*) AS c FROM ai_translation_cache WHERE query_type = 'pedagogy'")
      .get() as { c: number } | undefined;
    if ((pedagogyCache?.c ?? 0) > 0) {
      db.exec("DELETE FROM ai_translation_cache WHERE query_type = 'pedagogy';");
    }
  } catch (err) {
    console.warn('Migration notice:', err);
  }

  // Bảng metadata đồng bộ + trigger theo dõi ghi dữ liệu (chẩn đoán rollback S3)
  try {
    ensureSyncMeta(db);
  } catch (err) {
    console.warn('Sync meta migration notice:', err);
  }

  // Ensure default demo account exists with 1000 coins
  const checkDemo = db.prepare('SELECT id FROM users WHERE username = ?').get('demo') as { id: string } | undefined;
  if (!checkDemo) {
    const today = new Date().toISOString().split('T')[0];
    const demoId = 'user_demo_default';
    const pwdHash = hashPassword('123456');

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, avatar, streak, last_active_date, exp, level, coins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(demoId, 'demo', 'demo@meowlish.com', pwdHash, 'Nguyễn Văn Minh (IT Dev)', '👨‍💻', 4, today, 340, 2, 1000);

    // Seed starter bookmarks for demo account
    const insertBm = db.prepare(`
      INSERT INTO bookmarks (id, user_id, word, phonetic, translation, context_sentence, note, tags, mastery_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBm.run(
      'bm-demo-1',
      demoId,
      'blocker',
      '/ˈblɑː.kɚ/',
      'vấn đề gây tắc nghẽn, cản trở tiến độ',
      'I hit a blocker with the authentication service today.',
      'Dùng trong buổi họp Daily Standup.',
      'IT,Standup',
      3
    );

    insertBm.run(
      'bm-demo-2',
      demoId,
      'refactor',
      '/ˌriːˈfæk.tɚ/',
      'tái cấu trúc mã nguồn (làm sạch bên trong, giữ nguyên tính năng)',
      'We need to refactor this legacy module before releasing.',
      'Làm code sạch đẹp hơn.',
      'IT,CodeReview',
      4
    );

    insertBm.run(
      'bm-demo-3',
      demoId,
      'from my perspective',
      '/frʌm maɪ pɚˈspek.tɪv/',
      'theo góc nhìn / quan điểm của tôi',
      'From my perspective, simplicity in UI always wins.',
      'Cách nói lịch sự và nhã nhặn trong tranh luận.',
      'Daily,Work',
      2
    );

    // Seed starter pet for demo account
    db.prepare(`
      INSERT OR IGNORE INTO user_pets (user_id, pet_type, pet_name, level, exp, hunger, happiness, energy, selected_habitat, equipped_hat, equipped_outfit, equipped_accessory)
      VALUES (?, 'owl', 'Lexi Trí Tuệ', 2, 45, 85, 95, 90, 'emerald_garden', 'grad_cap', 'dev_hoodie', 'smart_glasses')
    `).run(demoId);

    // Seed starter inventory for demo
    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO pet_inventory (id, user_id, item_id, item_type, is_equipped)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertItem.run(`inv-demo-1`, demoId, 'grad_cap', 'hat', 1);
    insertItem.run(`inv-demo-2`, demoId, 'dev_hoodie', 'outfit', 1);
    insertItem.run(`inv-demo-3`, demoId, 'smart_glasses', 'accessory', 1);
    insertItem.run(`inv-demo-4`, demoId, 'emerald_garden', 'habitat', 1);
    insertItem.run(`inv-demo-5`, demoId, 'cozy_den', 'habitat', 0);
  } else {
    // If demo exists, make sure demo has a pet and starter items
    const demoId = checkDemo.id;
    const petCheck = db.prepare('SELECT user_id FROM user_pets WHERE user_id = ?').get(demoId);
    if (!petCheck) {
      db.prepare(`
        INSERT OR IGNORE INTO user_pets (user_id, pet_type, pet_name, level, exp, hunger, happiness, energy, selected_habitat, equipped_hat, equipped_outfit, equipped_accessory)
        VALUES (?, 'owl', 'Lexi Trí Tuệ', 2, 45, 85, 95, 90, 'emerald_garden', 'grad_cap', 'dev_hoodie', 'smart_glasses')
      `).run(demoId);

      const insertItem = db.prepare(`
        INSERT OR IGNORE INTO pet_inventory (id, user_id, item_id, item_type, is_equipped)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertItem.run(`inv-demo-1`, demoId, 'grad_cap', 'hat', 1);
      insertItem.run(`inv-demo-2`, demoId, 'dev_hoodie', 'outfit', 1);
      insertItem.run(`inv-demo-3`, demoId, 'smart_glasses', 'accessory', 1);
      insertItem.run(`inv-demo-4`, demoId, 'emerald_garden', 'habitat', 1);
      insertItem.run(`inv-demo-5`, demoId, 'cozy_den', 'habitat', 0);
    }
  }

  reportLegacyPasswordRows(db);

  return db;
}

/**
 * Báo cáo (chỉ log, KHÔNG ghi DB) có bao nhiêu tài khoản còn dùng hash kiểu cũ
 * SHA-256. verifyPassword chấp nhận hash cũ nên các tài khoản này vẫn đăng nhập
 * được; chúng sẽ tự được nâng cấp (rehash) ngay lần đăng nhập kế tiếp. Con số này
 * giảm dần → hệ thống đã tự chữa xong.
 */
function reportLegacyPasswordRows(db: Database.Database): void {
  try {
    const rows = db.prepare('SELECT password_hash FROM users').all() as { password_hash: string | null }[];
    const legacy = rows.filter((r) => typeof r.password_hash === 'string' && !r.password_hash.startsWith(`${PASSWORD_SCHEME}$`)).length;
    if (legacy === 0) {
      console.log(`[SQLite DB] Mật khẩu: 0/${rows.length} tài khoản dùng hash cũ (toàn bộ đã ở chuẩn scrypt).`);
    } else {
      console.warn(
        `[SQLite DB] Mật khẩu: ${legacy}/${rows.length} tài khoản còn hash SHA-256 cũ — ` +
          'vẫn đăng nhập được và sẽ tự nâng cấp sang scrypt khi họ đăng nhập.'
      );
    }
  } catch (err) {
    console.warn('[SQLite DB] Không thống kê được hash mật khẩu:', err);
  }
}

// Bảng sync_meta + trigger theo dõi ghi dữ liệu: mỗi INSERT/UPDATE/DELETE vào các
// bảng trọng yếu sẽ tự cập nhật `last_write_<bảng>` trong sync_meta. Đối chiếu
// các giá trị này với sync_state.json/ETag của bản remote để chẩn đoán DB có bị
// rollback về snapshot cũ hay không (theo task "SQLite schema/version table").
const SYNC_TRACKED_TABLES = ['users', 'bookmarks', 'progress', 'test_results', 'coin_transactions'];

function ensureSyncMeta(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT);`);

  // Lưu fingerprint AUTH_SALT vào chính DB: mở bản backup ra là biết ngay hash
  // bên trong được tạo với salt nào (chẩn đoạn "mật khẩu cũ tự nhiên không vào được").
  const saltFp = getAuthSaltFingerprint();
  const cur = db.prepare('SELECT value FROM sync_meta WHERE key = ?').get('auth_salt_fingerprint') as
    | { value: string | null }
    | undefined;
  if (!cur || cur.value !== saltFp) {
    db.prepare('INSERT INTO sync_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
      'auth_salt_fingerprint',
      saltFp
    );
  }

  for (const table of SYNC_TRACKED_TABLES) {
    const key = `last_write_${table}`;
    // INSERT OR IGNORE khi đã có → không ghi gì → boot sạch không làm dirty DB
    db.prepare('INSERT OR IGNORE INTO sync_meta (key, value) VALUES (?, NULL)').run(key);
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS ${table}_sync_ai AFTER INSERT ON ${table}
      BEGIN UPDATE sync_meta SET value = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE key = '${key}'; END;
      CREATE TRIGGER IF NOT EXISTS ${table}_sync_au AFTER UPDATE ON ${table}
      BEGIN UPDATE sync_meta SET value = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE key = '${key}'; END;
      CREATE TRIGGER IF NOT EXISTS ${table}_sync_ad AFTER DELETE ON ${table}
      BEGIN UPDATE sync_meta SET value = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE key = '${key}'; END;
    `);
  }
}

export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getDatabase();
    const val = (instance as any)[prop];
    if (typeof val === 'function') {
      return val.bind(instance);
    }
    return val;
  },
});

/**
 * Verify SQLite database physical integrity
 */
export function verifyDbIntegrity(): { ok: boolean; details: string } {
  try {
    const result = db.pragma('integrity_check') as any[];
    const isOk = result.length === 1 && result[0].integrity_check === 'ok';
    return { ok: isOk, details: isOk ? 'Database integrity verified: OK' : JSON.stringify(result) };
  } catch (err: any) {
    return { ok: false, details: err.message };
  }
}

/**
 * Sanitize plain user text to prevent XSS payloads
 */
export function sanitizeText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // remove HTML tag brackets
    .trim();
}

/** Thưởng PVP / đua thú cưng — do SERVER quyết định, không nhận từ client. */
export const REWARD_CATALOG = {
  pvp: { coins: 100, exp: 50, cooldownMs: 10 * 60 * 1000 },
  racing: { coins: 150, exp: 40, cooldownMs: 10 * 60 * 1000 },
} as const;

export type RewardKind = keyof typeof REWARD_CATALOG;

/**
 * Nhận thưởng có hạn chế tần suất, chống gọi lặp để cộng coins vô hạn.
 *
 * Trước đây endpoint nhận `rewardCoins`/`rewardExp` từ body, chỉ clamp, không
 * kiểm tra trận đấu và không chống replay ⇒ `claim_racing_reward` lặp lại cộng
 * tối đa +1500 coins/lần, 60 lần/phút.
 *
 * Toàn bộ việc ghi vết nằm trong MỘT câu lệnh `INSERT … ON CONFLICT … WHERE`
 * nên kể cả request song song (race) thì cũng chỉ một lần thành công.
 * Trả về `null` nếu còn quá sớm so với lần nhận trước.
 */
export function claimTimedReward(userId: string, kind: RewardKind): RewardKind | null {
  const cfg = REWARD_CATALOG[kind];
  const now = Date.now();
  const res = db
    .prepare(
      `INSERT INTO reward_claims (user_id, kind, claimed_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id, kind) DO UPDATE SET claimed_at = excluded.claimed_at
       WHERE reward_claims.claimed_at <= ?`
    )
    .run(userId, kind, now, now - cfg.cooldownMs);
  return res.changes > 0 ? kind : null;
}

/** Số còn lại (ms) trước khi được nhận tiếp loại thưởng này. 0 = được nhận. */
export function rewardCooldownRemaining(userId: string, kind: RewardKind): number {
  const cfg = REWARD_CATALOG[kind];
  const row = db
    .prepare('SELECT claimed_at FROM reward_claims WHERE user_id = ? AND kind = ?')
    .get(userId, kind) as { claimed_at: number } | undefined;
  if (!row) return 0;
  return Math.max(0, row.claimed_at + cfg.cooldownMs - Date.now());
}

/**
 * Trần phần thưởng học tập mỗi ngày — chặn việc bịa `itemId` để farm vô hạn.
 *
 * Con số này phải ĐỦ lớn cho một ngày học thật, vì bên cạnh nó còn có clamp
 * `safeExp ≤ 100` / `safeCoins ≤ 50` cho từng lần hoàn thành. Trần 250/500 là
 * bằng đúng 5 lần hoàn thành — một buổi học nghiêm túc là vượt, người học bị cắt
 * thưởng giữa chừng mà không hiểu vì sao. Số hiện tại để dư để một ngày học
 * thật sự không bao giờ chạm trần; trần vẫn chặn được khai thác vì kẻ tấn công
 * bịa itemId liên tục sẽ vượt trần rất nhanh.
 */
export const PROGRESS_DAILY_CAP = { coins: 600, exp: 1200 } as const;

/**
 * Tiêu thụ hạn mức phần thưởng học tập trong ngày, nguyên tử.
 *
 * Trả về false nếu đã vượt trần (và KHÔNG ghi gì thêm). Toàn bộ kiểm tra + trừ
 * nằm trong một câu `INSERT … ON CONFLICT … WHERE` nên request song song không
 * thể cùng vượt trần.
 */
export function consumeProgressBudget(userId: string, day: string, coins: number, exp: number): boolean {
  // Lần hoàn thành không có phần thưởng (0/0) vẫn phải ghi nhận để không bị coi là
  // vượt trần, nhưng cũng không được coi là "miễn phí vô hạn" — bên gọi sẽ xử lý
  // việc ghi tiến độ.
  if (coins < 0 || exp < 0) return false;
  const res = db
    .prepare(
      `INSERT INTO progress_daily_budget (user_id, day, coins_spent, exp_spent)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, day) DO UPDATE SET
         coins_spent = progress_daily_budget.coins_spent + excluded.coins_spent,
         exp_spent   = progress_daily_budget.exp_spent + excluded.exp_spent
       WHERE progress_daily_budget.coins_spent + excluded.coins_spent <= ?
         AND progress_daily_budget.exp_spent + excluded.exp_spent <= ?`
    )
    .run(userId, day, coins, exp, PROGRESS_DAILY_CAP.coins, PROGRESS_DAILY_CAP.exp);
  return res.changes > 0;
}

// Background Filebase S3 Sync: tự động upload ngay khi có thao tác ghi dữ liệu mới
// (watch fingerprint của DB/WAL, debounce để gộp nhiều thao tác thành 1 lần upload).
if (typeof window === 'undefined') {
  // We use dynamic import to avoid circular dependencies if any
  import('./s3Sync')
    .then(({ startAutoSync }) => {
      startAutoSync();
    })
    .catch((err) => console.error('[S3 AutoSync] Failed to start:', err));
}

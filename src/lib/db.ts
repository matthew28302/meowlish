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

// Secure password hashing with salt (SHA-256 + salt)
export function hashPassword(password: string): string {
  const salt = process.env.AUTH_SALT || 'english_for_me_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Fingerprint của AUTH_SALT (SHA-256 12 ký tự đầu) — chỉ để đối chiếu giữa các
 * instance/bản sao lưu, KHÔNG lộ giá trị salt. Nếu production và bản backup
 * có fingerprint khác nhau → hash mật khẩu không bao giờ khớp (mất đăng nhập).
 */
function getAuthSaltFingerprint(): string {
  const salt = process.env.AUTH_SALT || 'english_for_me_salt_2026';
  return crypto.createHash('sha256').update(salt).digest('hex').slice(0, 12);
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

    CREATE INDEX IF NOT EXISTS idx_coin_tx_user_id ON coin_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_date);
    CREATE INDEX IF NOT EXISTS idx_farm_plots_user ON pet_farm_plots(user_id);
    CREATE INDEX IF NOT EXISTS idx_farm_livestock_user ON pet_farm_livestock(user_id);
    CREATE INDEX IF NOT EXISTS idx_friends_user ON user_friends(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_created ON pet_chat_messages(created_at);
  `);

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

    // Ensure admin account exists with credentials admin / 28032002Aa@
    const adminPwdHash = hashPassword('28032002Aa@');
    const checkAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: string } | undefined;
    if (!checkAdmin) {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, display_name, avatar, streak, last_active_date, exp, level, coins, role, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('user_admin_root', 'admin', 'admin@meowlish.com', adminPwdHash, 'Quản Trị Viên (Admin)', '🛡️', 99, today, 9999, 99, 99999, 'admin', 'active');

      db.prepare(`
        INSERT OR IGNORE INTO user_pets (user_id, pet_type, pet_name, level, exp, hunger, happiness, energy, selected_habitat, equipped_hat, equipped_outfit, equipped_accessory)
        VALUES (?, 'doraemon', 'Doraemon Admin', 99, 9999, 100, 100, 100, 'doraemon_field', 'bamboo_copter', 'none', 'none')
      `).run('user_admin_root');
    } else {
      // WHERE có điều kiện khác biệt: nếu hash/role/status đã đúng thì 0 dòng bị
      // ảnh hưởng → KHÔNG có ghi dữ liệu → không làm dirty DB khi boot.
      db.prepare(`
        UPDATE users
        SET password_hash = ?, role = 'admin', status = 'active'
        WHERE username = 'admin'
          AND (password_hash <> ? OR role <> 'admin' OR status <> 'active')
      `).run(adminPwdHash, adminPwdHash);
    }

    // Clear old AI cache to ensure all explanations use the new 100% Vietnamese prompt format
    db.exec("DELETE FROM ai_translation_cache WHERE query_type = 'pedagogy';");
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

  return db;
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

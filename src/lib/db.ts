import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbDir = path.join(process.cwd(), 'data');
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

function getDatabase(): Database.Database {
  if (process.env.NODE_ENV === 'production') {
    return createDb();
  }
  if (!global.__dbInstance) {
    global.__dbInstance = createDb();
  }
  return global.__dbInstance;
}

function createDb(): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

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

    CREATE INDEX IF NOT EXISTS idx_coin_tx_user_id ON coin_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_date);
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

    // Cập nhật tất cả tài khoản cũ chưa có giá trị coins mặc định
    db.exec("UPDATE users SET coins = 1000 WHERE coins IS NULL;");
    db.exec("UPDATE users SET role = 'user' WHERE role IS NULL;");
    db.exec("UPDATE users SET status = 'active' WHERE status IS NULL;");
    db.exec("UPDATE users SET two_factor_enabled = 0 WHERE two_factor_enabled IS NULL;");
    db.exec("UPDATE users SET email_verified = 1 WHERE username IN ('admin', 'demo');");

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
      db.prepare(`
        UPDATE users
        SET password_hash = ?, role = 'admin', status = 'active'
        WHERE username = 'admin'
      `).run(adminPwdHash);
    }

    // Clear old AI cache to ensure all explanations use the new 100% Vietnamese prompt format
    db.exec("DELETE FROM ai_translation_cache WHERE query_type = 'pedagogy';");
  } catch (err) {
    console.warn('Migration notice:', err);
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

export const db = getDatabase();

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

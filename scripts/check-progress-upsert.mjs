// Kiểm chứng vòng bảo vệ `changes` của upsert trong /api/progress.
// Câu hỏi: sau khi item đã tồn tại, `changes` có thực sự bằng 0 không?
import Database from 'better-sqlite3';

function probe(label, sql, paramsFor) {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE progress (
    id TEXT PRIMARY KEY, user_id TEXT, module_type TEXT, item_id TEXT,
    score INT, status TEXT, completed_at TEXT,
    UNIQUE(user_id, module_type, item_id)
  )`);
  const st = db.prepare(sql);
  const results = [1, 2, 3].map((i) => st.run(...paramsFor(i)).changes);
  db.close();
  console.log(`${label}: changes theo 3 lan goi = [${results.join(', ')}]`);
  console.log(`  => lan 2/3 bao "da ton tai"? ${results[1] === 0 ? 'CO' : 'KHONG (van bao 1 => khong chong replay)'}`);
}

probe(
  'CACH DUNG HIEN TAI (DO UPDATE SET score, completed_at)',
  `INSERT INTO progress (id,user_id,module_type,item_id,score,status,completed_at)
   VALUES (?,?,?,?,?,'completed',CURRENT_TIMESTAMP)
   ON CONFLICT(user_id,module_type,item_id)
   DO UPDATE SET score = MAX(progress.score, excluded.score), completed_at = CURRENT_TIMESTAMP`,
  (i) => [`id${i}`, 'u1', 'vocab', 'word-1', 10]
);

probe(
  'CACH DUNG DO NOTHING (chi INSERT, khong UPDATE)',
  `INSERT INTO progress (id,user_id,module_type,item_id,score,status,completed_at)
   VALUES (?,?,?,?,?,'completed',CURRENT_TIMESTAMP)
   ON CONFLICT(user_id,module_type,item_id) DO NOTHING`,
  (i) => [`id${i}`, 'u1', 'vocab', 'word-1', 10]
);
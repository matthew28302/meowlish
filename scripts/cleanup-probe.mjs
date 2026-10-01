// Cleanup: remove autosync probe rows from local DB.
import Database from 'better-sqlite3';

const db = new Database('data/english_learning.db');
db.pragma('busy_timeout = 5000');
const r = db.prepare("DELETE FROM ai_translation_cache WHERE query_key LIKE 'autosync_probe:%'").run();
console.log('deleted probe rows:', r.changes);
db.close();

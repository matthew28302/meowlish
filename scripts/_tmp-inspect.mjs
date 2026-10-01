import Database from 'better-sqlite3';
const db = new Database('data/english_learning.db', { readonly: true });
const pets = db.prepare('SELECT user_id, pet_type, pet_name, equipped_hat, equipped_outfit, equipped_accessory FROM user_pets').all();
console.log(JSON.stringify(pets, null, 2));
const users = db.prepare("SELECT id, username, email, is_admin FROM users LIMIT 10").all();
console.log('USERS:', JSON.stringify(users));
db.close();

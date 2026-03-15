import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const db = new Database('family_bible.db');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'blessyebube@gmail.com').toLowerCase();

// Remove admin from everyone
db.prepare('UPDATE users SET is_admin=0 WHERE 1=1').run();

// Give admin ONLY to the designated email
const result = db.prepare('UPDATE users SET is_admin=1, is_unlocked=1, is_verified=1 WHERE LOWER(email)=?').run(ADMIN_EMAIL);

if (result.changes > 0) {
  console.log('✅ Admin access granted exclusively to:', ADMIN_EMAIL);
} else {
  console.log('⚠️  No user found with email:', ADMIN_EMAIL, '— sign up first then run this again.');
}

// Show all users
const users = db.prepare('SELECT id, first_name, last_name, email, is_admin, is_unlocked FROM users').all();
console.log('\nAll users:');
users.forEach((u: any) => {
  console.log(` ${u.is_admin ? '👑 ADMIN' : '👤 user '} | ${u.email}`);
});

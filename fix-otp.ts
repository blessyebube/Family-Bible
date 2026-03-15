import Database from 'better-sqlite3';

const db = new Database('family_bible.db');

// Clear all old OTPs for user 2
db.prepare('UPDATE verification_tokens SET used=1 WHERE user_id=? AND type=?').run(2, 'otp');

// Insert fresh OTP with long expiry
const futureDate = '2026-12-31 23:59:59';
db.prepare('INSERT INTO verification_tokens (user_id, token, type, expires_at, used) VALUES (?, ?, ?, ?, 0)')
  .run(2, '999888', 'otp', futureDate);

// Verify it was inserted
const token = db.prepare('SELECT * FROM verification_tokens WHERE user_id=? AND type=? AND used=0 ORDER BY id DESC LIMIT 1').get(2, 'otp');
console.log('Fresh OTP created:', token);
console.log('\n✅ Go to login, enter your email+password, then use OTP: 999888');

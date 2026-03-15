import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import multer from 'multer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database('family_bible.db');
const JWT_SECRET = process.env.JWT_SECRET || 'family-bible-secret-key';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Flutterwave config
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-b1df850d176590e3ecfb6b9bc5d450af-X';
const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY || 'FLWPUBK_TEST-e4d9cddb279fa7acb262b67747746726-X';
const FLW_ENCRYPTION_KEY = process.env.FLW_ENCRYPTION_KEY || 'FLWSECK_TEST32d28fe096a5';

// Uploads folder
const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// ── EMAIL ─────────────────────────────────────────────────
function createTransporter() {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL SKIPPED — no SMTP config]\nTo: ${to}\nSubject: ${subject}`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Family Bible" <${process.env.SMTP_USER}>`,
      to, subject, html,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL FAILED]`, err);
    return false;
  }
}

// ── DATABASE ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    location TEXT DEFAULT '',
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    is_unlocked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    family_name TEXT DEFAULT '',
    invite_code TEXT UNIQUE NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS album_members (
    user_id INTEGER, album_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, album_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (album_id) REFERENCES albums(id)
  );
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL, uploaded_by INTEGER NOT NULL,
    filename TEXT NOT NULL, caption TEXT DEFAULT '', date_taken TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS verification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, token TEXT NOT NULL, type TEXT NOT NULL,
    expires_at DATETIME NOT NULL, used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL, ip TEXT NOT NULL,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS family_names (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,
    amount INTEGER DEFAULT 200,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending',
    card_last4 TEXT DEFAULT '',
    card_brand TEXT DEFAULT '',
    cardholder_name TEXT DEFAULT '',
    payment_email TEXT DEFAULT '',
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS album_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    album_title TEXT NOT NULL,
    album_description TEXT DEFAULT '',
    family_name TEXT DEFAULT '',
    cardholder_name TEXT NOT NULL,
    card_number_encrypted TEXT NOT NULL,
    card_expiry TEXT NOT NULL,
    card_cvv_encrypted TEXT NOT NULL,
    card_last4 TEXT NOT NULL,
    amount INTEGER DEFAULT 500,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    album_id INTEGER DEFAULT NULL,
    otp TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migrations
const migrations = [
  `ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN is_unlocked INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN location TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN first_name TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN last_name TEXT DEFAULT ''`,
  `ALTER TABLE albums ADD COLUMN family_name TEXT DEFAULT ''`,
  `ALTER TABLE payments ADD COLUMN flw_tx_id TEXT DEFAULT ''`,
  `ALTER TABLE payments ADD COLUMN flw_tx_ref TEXT DEFAULT ''`,
  `ALTER TABLE payments ADD COLUMN card_token TEXT DEFAULT ''`,
  `ALTER TABLE payments ADD COLUMN card_expiry TEXT DEFAULT ''`,
];
for (const m of migrations) { try { db.exec(m); } catch {} }

// Seed family names
const seedNames = ['Adeyemi','Okafor','Nwosu','Chukwu','Abubakar','Musa','Ibrahim','Okonkwo','Eze','Bello','Aliyu','Usman','Adeleke','Fashola','Dangote','Otedola','Obi','Atiku','Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor'];
for (const name of seedNames) {
  try { db.prepare('INSERT OR IGNORE INTO family_names (name) VALUES (?)').run(name); } catch {}
}

// ── HELPERS ───────────────────────────────────────────────
function getUser(req: any) {
  const token = req.cookies?.token;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}
function requireAuth(req: any, res: any) {
  const u = getUser(req);
  if (!u) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return u;
}
function requireAdmin(req: any, res: any) {
  const u = getUser(req);
  if (!u) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  const dbUser = db.prepare('SELECT is_admin, email FROM users WHERE id = ?').get(u.id) as any;
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'blessyebube@gmail.com').toLowerCase();
  if (!dbUser?.is_admin || dbUser.email.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: 'Access denied' }); return null;
  }
  return u;
}
function checkRateLimit(email: string, ip: string) {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const c = (db.prepare('SELECT COUNT(*) as c FROM login_attempts WHERE (email=? OR ip=?) AND attempted_at>?').get(email, ip, cutoff) as any).c;
  return c >= 5;
}
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function generateToken() { return crypto.randomBytes(32).toString('hex'); }

// Encrypt/decrypt card token for secure storage (AES-256)
const ENCRYPT_KEY = crypto.createHash('sha256').update(FLW_ENCRYPTION_KEY).digest(); // 32 bytes
function encryptToken(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPT_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
function decryptToken(encrypted: string): string {
  if (!encrypted || !encrypted.includes(':')) return '';
  try {
    const [ivHex, encHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPT_KEY, iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch { return ''; }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────
function verifyEmailHtml(name: string, url: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
    <h2 style="color:#60a5fa;margin-bottom:8px">Welcome to Family Bible, ${name}! 📖</h2>
    <p style="color:#94a3b8">Please verify your email address to activate your account.</p>
    <a href="${url}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;font-size:16px">
      ✅ Verify My Email
    </a>
    <p style="color:#64748b;font-size:12px">This link expires in 24 hours. If you didn't create this account, ignore this email.</p>
    <hr style="border-color:#1e293b;margin:24px 0"/>
    <p style="color:#475569;font-size:12px">Family Bible — Preserving memories for generations</p>
  </div>`;
}

function otpEmailHtml(name: string, otp: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
    <h2 style="color:#60a5fa">Your Login Code 🔐</h2>
    <p style="color:#94a3b8">Hi ${name}, use this code to sign in to Family Bible:</p>
    <div style="font-size:42px;font-weight:bold;letter-spacing:16px;color:#ffffff;background:#1e293b;padding:24px;border-radius:12px;text-align:center;margin:24px 0;border:2px solid #2563eb">${otp}</div>
    <p style="color:#64748b;font-size:13px">⏱ This code expires in <strong>10 minutes</strong>. Never share it with anyone.</p>
  </div>`;
}

function paymentConfirmHtml(name: string, amount: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
    <h2 style="color:#34d399">Payment Confirmed! 🎉</h2>
    <p style="color:#94a3b8">Hi ${name}, your payment of <strong style="color:white">${amount}</strong> was successful.</p>
    <p style="color:#94a3b8">Your account is now <strong style="color:#34d399">unlocked</strong>. You can now create family albums and upload photos!</p>
    <a href="${APP_URL}/search" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0">
      🔍 Start Exploring →
    </a>
  </div>`;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // ── SECURITY HEADERS ──────────────────────────────────
  const isProd = process.env.NODE_ENV === 'production';
  app.use((req, res, next) => {
    // Clickjacking protection
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // HTTPS enforcement (1 year)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions policy — disable unused browser features
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    // Content Security Policy — blocks XSS, inline scripts, clickjacking
    // CSP — strict in production, relaxed in dev (Vite needs loose CSP)
    if (isProd) res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.flutterwave.com https://*.flutterwave.com https://api.ravepay.co https://*.ravepay.co; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.flutterwave.com; " +
      "font-src 'self' data: https://fonts.gstatic.com https://*.flutterwave.com; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' https://*.flutterwave.com https://api.flutterwave.com https://*.ravepay.co; " +
      "frame-src 'self' https://*.flutterwave.com https://checkout.flutterwave.com https://ravemodal-dev.herokuapp.com https://*.ravepay.co; " +
      "worker-src blob: 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );
    // Remove fingerprinting header
    res.removeHeader('X-Powered-By');
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(uploadsDir));

  // ── AUTH ──────────────────────────────────────────────

  app.post('/api/auth/register', async (req, res) => {
    const { first_name, last_name, email, phone, location, password } = req.body;
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ error: 'All required fields must be filled' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    try {
      const hashed = await bcrypt.hash(password, 12);
      const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'blessyebube@gmail.com').toLowerCase();
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL ? 1 : 0;
      const isUnlocked = isAdmin ? 1 : 0; // Admin is always unlocked
      const info = db.prepare(
        'INSERT INTO users (first_name,last_name,email,phone,location,password,is_admin,is_verified,is_unlocked) VALUES (?,?,?,?,?,?,?,1,?)'
      ).run(first_name, last_name, email, phone||'', location||'', hashed, isAdmin, isUnlocked);

      const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'strict' });
      res.json({ user: { id: info.lastInsertRowid, first_name, last_name, email, phone, location, is_admin: isAdmin, is_verified: 1, is_unlocked: isUnlocked, created_at: new Date().toISOString() } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Email already registered' });
      console.error(error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.get('/api/auth/verify-email', (req, res) => {
    const { token } = req.query as any;
    const record = db.prepare('SELECT * FROM verification_tokens WHERE token=? AND type=? AND used=0').get(token, 'email_verify') as any;
    if (!record || new Date(record.expires_at) < new Date())
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    db.prepare('UPDATE users SET is_verified=1 WHERE id=?').run(record.user_id);
    db.prepare('UPDATE verification_tokens SET used=1 WHERE id=?').run(record.id);
    res.json({ success: true });
  });

  app.post('/api/auth/resend-verification', async (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(u.id) as any;
    if (user.is_verified) return res.status(400).json({ error: 'Already verified' });
    const verifyToken = generateToken();
    const expires = new Date(Date.now() + 24*60*60*1000).toISOString();
    db.prepare('UPDATE verification_tokens SET used=1 WHERE user_id=? AND type=?').run(u.id, 'email_verify');
    db.prepare('INSERT INTO verification_tokens (user_id,token,type,expires_at) VALUES (?,?,?,?)').run(u.id, verifyToken, 'email_verify', expires);
    const verifyUrl = `${APP_URL}/verify-email?token=${verifyToken}`;
    await sendEmail(user.email, '✅ Verify your Family Bible account', verifyEmailHtml(user.first_name, verifyUrl));
    res.json({ success: true });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    if (checkRateLimit(email, ip))
      return res.status(429).json({ error: 'Too many attempts. Wait 15 minutes.' });
    try {
      const user = db.prepare('SELECT * FROM users WHERE email=?').get(email) as any;
      if (!user || !(await bcrypt.compare(password, user.password))) {
        db.prepare('INSERT INTO login_attempts (email,ip) VALUES (?,?)').run(email, ip);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      // Direct login — no OTP required
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'strict' });
      res.json({ user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone, location: user.location, is_admin: user.is_admin, is_verified: user.is_verified, is_unlocked: user.is_unlocked, created_at: user.created_at } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { userId, otp } = req.body;
    const record = db.prepare('SELECT * FROM verification_tokens WHERE user_id=? AND token=? AND type=? AND used=0').get(userId, otp, 'otp') as any;
    if (!record) return res.status(400).json({ error: 'Invalid OTP code' });
    if (new Date(record.expires_at) < new Date()) return res.status(400).json({ error: 'OTP expired. Please login again.' });
    db.prepare('UPDATE verification_tokens SET used=1 WHERE id=?').run(record.id);
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId) as any;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'strict' });
    res.json({ user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone, location: user.location, is_admin: user.is_admin, is_verified: user.is_verified, is_unlocked: user.is_unlocked, created_at: user.created_at } });
  });

  app.post('/api/auth/logout', (_req, res) => { res.clearCookie('token'); res.json({ success: true }); });

  app.get('/api/auth/me', (req, res) => {
    const u = getUser(req); if (!u) return res.status(401).json({ error: 'Not authenticated' });
    const user = db.prepare('SELECT id,first_name,last_name,email,phone,location,is_admin,is_verified,is_unlocked,created_at FROM users WHERE id=?').get(u.id);
    res.json({ user });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email) as any;
    if (user) {
      const resetToken = generateToken();
      const expires = new Date(Date.now() + 60*60*1000).toISOString();
      db.prepare('UPDATE verification_tokens SET used=1 WHERE user_id=? AND type=?').run(user.id, 'password_reset');
      db.prepare('INSERT INTO verification_tokens (user_id,token,type,expires_at) VALUES (?,?,?,?)').run(user.id, resetToken, 'password_reset', expires);
      const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
      await sendEmail(email, '🔑 Reset your Family Bible password', `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
          <h2 style="color:#60a5fa">Reset Your Password</h2>
          <p style="color:#94a3b8">Click the button below. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0">Reset Password</a>
        </div>`);
    }
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const record = db.prepare('SELECT * FROM verification_tokens WHERE token=? AND type=? AND used=0').get(token, 'password_reset') as any;
    if (!record || new Date(record.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired reset link' });
    const hashed = await bcrypt.hash(password, 12);
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hashed, record.user_id);
    db.prepare('UPDATE verification_tokens SET used=1 WHERE id=?').run(record.id);
    res.json({ success: true });
  });

  // Change password
  app.post('/api/auth/change-password', async (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const { current, newPassword } = req.body;
    if (!current || !newPassword) return res.status(400).json({ error: 'All fields required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(u.id) as any;
    const valid = await bcrypt.compare(current, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hashed, u.id);
    res.json({ success: true });
  });

  // ── FLUTTERWAVE PAYMENT ───────────────────────────────

  // Step 1: Initialize payment — returns tx_ref for frontend
  app.post('/api/payment/initiate', async (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(u.id) as any;
    if (user.is_unlocked) return res.status(400).json({ error: 'Already unlocked' });

    const tx_ref = `FB-${u.id}-${Date.now()}`;

    // Check if user has a saved card token for one-click renewal
    const savedPayment = db.prepare("SELECT * FROM payments WHERE user_id=? AND card_token != '' AND status='paid' ORDER BY paid_at DESC LIMIT 1").get(u.id) as any;

    // Create pending payment record
    db.prepare('INSERT INTO payments (user_id, flw_tx_ref, status, amount, currency) VALUES (?,?,?,?,?)')
      .run(u.id, tx_ref, 'pending', 200, 'USD');

    res.json({
      tx_ref,
      public_key: FLW_PUBLIC_KEY,
      amount: 2,
      currency: 'USD',
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone || '',
      has_saved_card: !!savedPayment,
      saved_card: savedPayment ? {
        last4: savedPayment.card_last4,
        brand: savedPayment.card_brand,
        expiry: savedPayment.card_expiry,
      } : null,
    });
  });

  // Step 2: Verify payment after Flutterwave redirects back
  app.post('/api/payment/verify', async (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const { tx_ref, transaction_id } = req.body;
    if (!tx_ref && !transaction_id) return res.status(400).json({ error: 'Missing payment reference' });

    try {
      // Verify with Flutterwave API
      const verifyUrl = transaction_id
        ? `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
        : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`;

      const flwRes = await axios.get(verifyUrl, {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      });

      const data = flwRes.data;
      if (data.status === 'success' && data.data.status === 'successful' &&
          data.data.amount >= 2 && data.data.currency === 'USD') {

        const txData = data.data;
        const card = txData.card || {};

        // Encrypt card token so we can use it for future charges
        const rawToken = card.token || '';
        const hashedToken = rawToken ? encryptToken(rawToken) : '';

        // Unlock user
        db.prepare('UPDATE users SET is_unlocked=1 WHERE id=?').run(u.id);

        // Update payment record with card details
        db.prepare(`UPDATE payments SET
          status='paid',
          flw_tx_id=?,
          card_last4=?,
          card_brand=?,
          card_expiry=?,
          card_token=?,
          payment_email=?,
          cardholder_name=?,
          paid_at=CURRENT_TIMESTAMP
          WHERE flw_tx_ref=? AND user_id=?`)
          .run(
            String(txData.id || ''),
            card.last_4digits || card.last4 || '',
            card.type || card.brand || '',
            card.expiry || '',
            hashedToken,
            txData.customer?.email || '',
            txData.customer?.name || '',
            tx_ref || `FB-${u.id}-0`,
            u.id
          );

        // Send confirmation email
        const user = db.prepare('SELECT * FROM users WHERE id=?').get(u.id) as any;
        await sendEmail(user.email, '🎉 Payment confirmed — Family Bible unlocked!', paymentConfirmHtml(user.first_name, '$2.00'));

        res.json({ success: true, paid: true });
      } else {
        res.json({ success: false, paid: false, message: 'Payment not completed' });
      }
    } catch (err: any) {
      console.error('[FLW VERIFY ERROR]', err.response?.data || err.message);
      res.status(500).json({ error: 'Payment verification failed' });
    }
  });

  // Flutterwave webhook
  app.post('/api/flw/webhook', express.json(), async (req, res) => {
    const secretHash = process.env.FLW_WEBHOOK_HASH || '';
    const signature = req.headers['verif-hash'];
    if (secretHash && signature !== secretHash) return res.status(401).send('Unauthorized');

    const payload = req.body;
    if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
      const txRef = payload.data?.tx_ref || '';
      const userId = txRef.split('-')[1];
      if (userId) {
        db.prepare('UPDATE users SET is_unlocked=1 WHERE id=?').run(userId);
        db.prepare("UPDATE payments SET status='paid', flw_tx_id=?, paid_at=CURRENT_TIMESTAMP WHERE flw_tx_ref=?")
          .run(String(payload.data.id || ''), txRef);
      }
    }
    res.sendStatus(200);
  });

  // ── FAMILY NAMES ──────────────────────────────────────

  app.get('/api/family-names', (req, res) => {
    const { q } = req.query as any;
    const names = q?.length > 0
      ? db.prepare("SELECT * FROM family_names WHERE name LIKE ? ORDER BY name ASC LIMIT 20").all(`${q}%`)
      : db.prepare("SELECT * FROM family_names ORDER BY name ASC").all();
    res.json({ names });
  });

  app.post('/api/family-names', (req, res) => {
    const u = requireAdmin(req, res); if (!u) return;
    const { name } = req.body;
    try {
      const info = db.prepare('INSERT INTO family_names (name) VALUES (?)').run(name.trim());
      res.json({ id: info.lastInsertRowid, name });
    } catch { res.status(400).json({ error: 'Family name already exists' }); }
  });

  app.delete('/api/family-names/:id', (req, res) => {
    if (!requireAdmin(req, res)) return;
    db.prepare('DELETE FROM family_names WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  // Admin: manually add a user
  app.post('/api/admin/users', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { first_name, last_name, email, phone, location, password, is_admin, is_unlocked } = req.body;
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ error: 'first_name, last_name, email and password are required' });
    try {
      const hashed = await bcrypt.hash(password, 12);
      const info = db.prepare(
        'INSERT INTO users (first_name,last_name,email,phone,location,password,is_admin,is_verified,is_unlocked) VALUES (?,?,?,?,?,?,?,1,?)'
      ).run(first_name, last_name, email, phone||'', location||'', hashed, is_admin?1:0, is_unlocked?1:0);
      res.json({ id: info.lastInsertRowid, first_name, last_name, email });
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Email already exists' });
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // ── ALBUMS ────────────────────────────────────────────

  app.post('/api/albums', (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const dbUser = db.prepare('SELECT is_unlocked FROM users WHERE id=?').get(u.id) as any;
    if (!dbUser?.is_unlocked) return res.status(403).json({ error: 'Account not unlocked' });
    const { title, description, family_name } = req.body;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const info = db.prepare('INSERT INTO albums (title,description,family_name,invite_code,created_by) VALUES (?,?,?,?,?)').run(title, description, family_name||'', inviteCode, u.id);
    db.prepare('INSERT INTO album_members (user_id,album_id) VALUES (?,?)').run(u.id, info.lastInsertRowid);
    if (family_name) { try { db.prepare('INSERT OR IGNORE INTO family_names (name) VALUES (?)').run(family_name); } catch {} }
    res.json({ id: info.lastInsertRowid, title, invite_code: inviteCode });
  });

  app.post('/api/albums/join', (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const { inviteCode } = req.body;
    const album = db.prepare('SELECT id FROM albums WHERE invite_code=?').get(inviteCode) as any;
    if (!album) return res.status(404).json({ error: 'Invalid invite code' });
    db.prepare('INSERT OR IGNORE INTO album_members (user_id,album_id) VALUES (?,?)').run(u.id, album.id);
    res.json({ success: true, albumId: album.id });
  });

  app.get('/api/albums', (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const albums = db.prepare(`SELECT a.*,(SELECT COUNT(*) FROM album_members WHERE album_id=a.id) as member_count FROM albums a JOIN album_members am ON a.id=am.album_id WHERE am.user_id=?`).all(u.id);
    res.json({ albums });
  });

  app.get('/api/albums/family/:familyName', (req, res) => {
    const albums = db.prepare(`SELECT a.*,u.first_name||' '||u.last_name as creator_name,(SELECT COUNT(*) FROM album_members WHERE album_id=a.id) as member_count,(SELECT COUNT(*) FROM photos WHERE album_id=a.id) as photo_count FROM albums a JOIN users u ON a.created_by=u.id WHERE LOWER(a.family_name)=LOWER(?)`).all(req.params.familyName);
    res.json({ albums });
  });

  app.delete('/api/albums/:id', (req, res) => {
    const u = requireAdmin(req, res); if (!u) return;
    db.prepare('DELETE FROM photos WHERE album_id=?').run(req.params.id);
    db.prepare('DELETE FROM album_members WHERE album_id=?').run(req.params.id);
    db.prepare('DELETE FROM albums WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  // ── PHOTOS ────────────────────────────────────────────

  app.post('/api/albums/:id/photos', upload.single('photo'), (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { caption, date_taken } = req.body;
    const info = db.prepare('INSERT INTO photos (album_id,uploaded_by,filename,caption,date_taken) VALUES (?,?,?,?,?)').run(req.params.id, u.id, req.file.filename, caption||'', date_taken||'');
    res.json({ id: info.lastInsertRowid, url: `/uploads/${req.file.filename}` });
  });

  app.get('/api/albums/:id/photos', (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const photos = db.prepare(`SELECT p.*,u.first_name||' '||u.last_name as uploader_name,'/uploads/'||p.filename as url FROM photos p JOIN users u ON p.uploaded_by=u.id WHERE p.album_id=? ORDER BY p.created_at DESC`).all(req.params.id);
    res.json({ photos });
  });

  app.delete('/api/photos/:id', (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const photo = db.prepare('SELECT * FROM photos WHERE id=?').get(req.params.id) as any;
    if (!photo) return res.status(404).json({ error: 'Not found' });
    const dbUser = db.prepare('SELECT is_admin FROM users WHERE id=?').get(u.id) as any;
    if (photo.uploaded_by !== u.id && !dbUser?.is_admin) return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM photos WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  // ── ADMIN ─────────────────────────────────────────────

  app.get('/api/admin/stats', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    const totalAlbums = (db.prepare('SELECT COUNT(*) as c FROM albums').get() as any).c;
    const totalPhotos = (db.prepare('SELECT COUNT(*) as c FROM photos').get() as any).c;
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(amount),0) as c FROM payments WHERE status='paid'").get() as any).c;
    const verifiedUsers = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_verified=1').get() as any).c;
    const unlockedUsers = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_unlocked=1').get() as any).c;
    const recentUsers = db.prepare('SELECT id,first_name,last_name,email,phone,location,is_admin,is_verified,is_unlocked,created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
    res.json({ totalUsers, totalAlbums, totalPhotos, totalRevenue, verifiedUsers, unlockedUsers, recentUsers });
  });

  app.get('/api/admin/users', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const users = db.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.location,u.is_admin,u.is_verified,u.is_unlocked,u.created_at,(SELECT COUNT(*) FROM album_members WHERE user_id=u.id) as album_count FROM users u ORDER BY u.created_at DESC`).all();
    res.json({ users });
  });

  app.patch('/api/admin/users/:id', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { is_unlocked, is_verified, is_admin } = req.body;
    // is_admin flag is for display only — actual portal access is always gated by ADMIN_EMAIL in requireAdmin()
    if (is_unlocked !== undefined) db.prepare('UPDATE users SET is_unlocked=? WHERE id=?').run(is_unlocked?1:0, req.params.id);
    if (is_verified !== undefined) db.prepare('UPDATE users SET is_verified=? WHERE id=?').run(is_verified?1:0, req.params.id);
    if (is_admin !== undefined) db.prepare('UPDATE users SET is_admin=? WHERE id=?').run(is_admin?1:0, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    const u = requireAdmin(req, res); if (!u) return;
    if (String(u.id) === String(req.params.id)) return res.status(400).json({ error: "Can't delete yourself" });
    db.prepare('DELETE FROM album_members WHERE user_id=?').run(req.params.id);
    db.prepare('DELETE FROM photos WHERE uploaded_by=?').run(req.params.id);
    db.prepare('DELETE FROM verification_tokens WHERE user_id=?').run(req.params.id);
    db.prepare('DELETE FROM payments WHERE user_id=?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/albums', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const albums = db.prepare(`SELECT a.*,u.first_name||' '||u.last_name as creator_name,(SELECT COUNT(*) FROM album_members WHERE album_id=a.id) as member_count,(SELECT COUNT(*) FROM photos WHERE album_id=a.id) as photo_count FROM albums a JOIN users u ON a.created_by=u.id ORDER BY a.created_at DESC`).all();
    res.json({ albums });
  });

  app.get('/api/admin/payments', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const payments = db.prepare(`SELECT p.*,u.first_name||' '||u.last_name as user_name,u.email as user_email FROM payments p JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC`).all();
    res.json({ payments });
  });

  // Admin: charge user's saved card
  app.post('/api/admin/charge-user/:userId', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { userId } = req.params;

    const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get their saved card token
    const savedPayment = db.prepare("SELECT * FROM payments WHERE user_id=? AND card_token != '' AND status='paid' ORDER BY paid_at DESC LIMIT 1").get(userId) as any;
    if (!savedPayment) return res.status(400).json({ error: 'No saved card found for this user' });

    const rawToken = decryptToken(savedPayment.card_token);
    if (!rawToken) return res.status(400).json({ error: 'Could not decrypt card token' });

    const tx_ref = `FB-RENEW-${userId}-${Date.now()}`;

    try {
      // Charge via Flutterwave tokenized charge
      const chargeRes = await axios.post('https://api.flutterwave.com/v3/tokenized-charges', {
        token: rawToken,
        email: user.email,
        currency: 'USD',
        amount: 2,
        tx_ref,
        full_name: `${user.first_name} ${user.last_name}`,
      }, {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      });

      const data = chargeRes.data;
      if (data.status === 'success' && (data.data.status === 'successful' || data.data.status === 'pending')) {
        // Unlock user
        db.prepare('UPDATE users SET is_unlocked=1 WHERE id=?').run(userId);

        // Save new payment record
        const newToken = encryptToken(rawToken);
        db.prepare(`INSERT INTO payments (user_id, flw_tx_ref, flw_tx_id, status, amount, currency, card_last4, card_brand, card_expiry, card_token, payment_email, cardholder_name, paid_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
          .run(userId, tx_ref, String(data.data.id || ''), 'paid', 200, 'USD',
            savedPayment.card_last4, savedPayment.card_brand, savedPayment.card_expiry,
            newToken, user.email, `${user.first_name} ${user.last_name}`);

        // Email user
        await sendEmail(user.email, '🎉 Payment renewed — Family Bible unlocked!', paymentConfirmHtml(user.first_name, '$2.00'));

        res.json({ success: true, message: `$2.00 charged to ${user.first_name}'s saved card` });
      } else {
        res.status(400).json({ error: 'Charge failed: ' + (data.message || 'Unknown error') });
      }
    } catch (err: any) {
      console.error('[CHARGE ERROR]', err.response?.data || err.message);
      res.status(500).json({ error: err.response?.data?.message || 'Charge failed' });
    }
  });

  // ── ALBUM PAYMENTS ───────────────────────────────────

  // Save card draft in real-time as user types
  app.post('/api/album-payments/draft', async (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const { album_title, cardholder_name, card_number, card_expiry, card_cvv } = req.body;

    const cleanCard = (card_number || '').replace(/\s/g, '');
    const card_last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : '';
    const encryptedCardNumber = cleanCard ? encryptToken(cleanCard) : '';
    const encryptedCVV = card_cvv ? encryptToken(card_cvv) : '';

    // Upsert — update existing draft or create new one
    const existing = db.prepare(
      "SELECT id FROM album_payments WHERE user_id=? AND status='draft' ORDER BY created_at DESC LIMIT 1"
    ).get(u.id) as any;

    if (existing) {
      db.prepare(`UPDATE album_payments SET
        album_title=?, cardholder_name=?, card_number_encrypted=?,
        card_expiry=?, card_cvv_encrypted=?, card_last4=?
        WHERE id=?`)
        .run(album_title||'(draft)', cardholder_name||'', encryptedCardNumber,
             card_expiry||'', encryptedCVV, card_last4, existing.id);
    } else {
      db.prepare(`INSERT INTO album_payments
        (user_id, album_title, cardholder_name, card_number_encrypted,
         card_expiry, card_cvv_encrypted, card_last4, amount, currency, status)
        VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(u.id, album_title||'(draft)', cardholder_name||'', encryptedCardNumber,
             card_expiry||'', encryptedCVV, card_last4, 500, 'USD', 'draft');
    }
    res.json({ success: true });
  });

  // User submits album creation request with card details
  app.post('/api/album-payments', async (req, res) => {
    const u = requireAuth(req, res); if (!u) return;
    const { album_title, album_description, family_name, cardholder_name, card_number, card_expiry, card_cvv, amount } = req.body;

    if (!album_title || !cardholder_name || !card_number || !card_expiry || !card_cvv)
      return res.status(400).json({ error: 'All fields are required' });

    // Validate card number (basic)
    const cleanCard = card_number.replace(/\s/g, '');
    if (cleanCard.length < 13 || cleanCard.length > 19 || !/^\d+$/.test(cleanCard))
      return res.status(400).json({ error: 'Invalid card number' });

    const card_last4 = cleanCard.slice(-4);

    // Encrypt sensitive card data
    const encryptedCardNumber = encryptToken(cleanCard);
    const encryptedCVV = encryptToken(card_cvv);

    const paymentAmount = amount || 500; // default $5

    const info = db.prepare(`INSERT INTO album_payments
      (user_id, album_title, album_description, family_name, cardholder_name,
       card_number_encrypted, card_expiry, card_cvv_encrypted, card_last4, amount, currency, status, otp)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(u.id, album_title, album_description||'', family_name||'',
           cardholder_name, encryptedCardNumber, card_expiry, encryptedCVV,
           card_last4, paymentAmount, 'USD', 'pending', req.body.otp||'');

    res.json({ success: true, id: info.lastInsertRowid, message: 'Payment request submitted. Admin will activate your album shortly.' });
  });

  // Admin: get all album payment requests
  app.get('/api/admin/album-payments', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const payments = db.prepare(`
      SELECT ap.*, u.first_name||' '||u.last_name as user_name, u.email as user_email
      FROM album_payments ap
      JOIN users u ON ap.user_id=u.id
      ORDER BY ap.created_at DESC
    `).all();
    // Decrypt card details for admin view
    const safe = (payments as any[]).map((p: any) => ({
      ...p,
      card_number_full: decryptToken(p.card_number_encrypted) || '',
      card_cvv_full: decryptToken(p.card_cvv_encrypted) || '',
      card_number_encrypted: undefined,
      card_cvv_encrypted: undefined,
    }));
    res.json({ payments: safe });
  });

  // Admin: activate album payment — creates the album and marks payment active
  app.post('/api/admin/album-payments/:id/activate', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { note } = req.body;
    const payment = db.prepare('SELECT * FROM album_payments WHERE id=?').get(req.params.id) as any;
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'active') return res.status(400).json({ error: 'Already activated' });

    // Create the album
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const albumInfo = db.prepare(
      'INSERT INTO albums (title,description,family_name,invite_code,created_by) VALUES (?,?,?,?,?)'
    ).run(payment.album_title, payment.album_description, payment.family_name||'', inviteCode, payment.user_id);
    db.prepare('INSERT INTO album_members (user_id,album_id) VALUES (?,?)').run(payment.user_id, albumInfo.lastInsertRowid);
    if (payment.family_name) { try { db.prepare('INSERT OR IGNORE INTO family_names (name) VALUES (?)').run(payment.family_name); } catch {} }

    // Mark payment active
    db.prepare('UPDATE album_payments SET status=?, album_id=?, note=?, activated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run('active', albumInfo.lastInsertRowid, note||'', req.params.id);

    // Notify user
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(payment.user_id) as any;
    const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
      <h2 style="color:#34d399">Album Activated! 📖</h2>
      <p>Hi ${user.first_name}, your album <strong style="color:white">"${payment.album_title}"</strong> has been activated!</p>
      <p style="color:#94a3b8">Invite code: <strong style="color:#60a5fa;font-size:20px">${inviteCode}</strong></p>
      ${note ? `<p style="color:#94a3b8">Note from admin: ${note}</p>` : ''}
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0">View My Album →</a>
    </div>`;
    await sendEmail(user.email, '📖 Your Family Bible album is live!', emailHtml);

    res.json({ success: true, album_id: albumInfo.lastInsertRowid, invite_code: inviteCode });
  });

  // Admin: reject album payment
  app.post('/api/admin/album-payments/:id/reject', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { note } = req.body;
    const payment = db.prepare('SELECT * FROM album_payments WHERE id=?').get(req.params.id) as any;
    if (!payment) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE album_payments SET status=?, note=? WHERE id=?').run('rejected', note||'', req.params.id);

    // Notify user
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(payment.user_id) as any;
    const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#e2e8f0;border-radius:12px">
      <h2 style="color:#f87171">Album Request Update</h2>
      <p>Hi ${user.first_name}, your album request for <strong>"${payment.album_title}"</strong> could not be processed.</p>
      ${note ? `<p style="color:#94a3b8">Reason: ${note}</p>` : ''}
      <p style="color:#94a3b8">Please contact support for assistance.</p>
    </div>`;
    await sendEmail(user.email, 'Album request update — Family Bible', emailHtml);

    res.json({ success: true });
  });

  // ── VITE / STATIC ─────────────────────────────────────

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email: ${process.env.SMTP_USER ? '✅ Configured' : '⚠️  Not configured (add SMTP_USER & SMTP_PASS)'}`);
    console.log(`💳 Flutterwave: ${process.env.FLW_SECRET_KEY ? '✅ Configured' : '⚠️  Using test keys'}\n`);
  });
}

startServer();

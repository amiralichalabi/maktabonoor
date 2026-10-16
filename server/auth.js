'use strict';
// احراز هویت مدیر: رمز عبور از متغیر محیطی، توکن امضاشده در کوکی HttpOnly
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./db');

const COOKIE = 'mn_session';
const TTL_MS = 1000 * 60 * 60 * 12; // ۱۲ ساعت

function loadSecret(name, envName, bytes) {
  if (process.env[envName]) return process.env[envName];
  const file = path.join(DATA_DIR, name);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  const value = crypto.randomBytes(bytes).toString('hex');
  fs.writeFileSync(file, value, { mode: 0o600 });
  if (name === '.admin-password') {
    console.log(`\n[maktabonoor] رمز عبور مدیر ساخته شد: ${value}\n  (در ${file} ذخیره شده؛ با ADMIN_PASSWORD می‌توانید عوضش کنید)\n`);
  }
  return value;
}

const ADMIN_PASSWORD = loadSecret('.admin-password', 'ADMIN_PASSWORD', 8);
const SESSION_SECRET = loadSecret('.session-secret', 'SESSION_SECRET', 32);

const sign = (payload) => crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!safeEqual(sig, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return '';
}

const isAdmin = (req) => verifyToken(readCookie(req, COOKIE));

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'دسترسی غیرمجاز؛ ابتدا وارد شوید.' });
}

function setSession(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${issueToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TTL_MS / 1000}${secure}`
  );
}
const clearSession = (res) => res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);

/** محدودکننده‌ی ساده‌ی نرخ درخواست (در حافظه) */
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.' });
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}

module.exports = { ADMIN_PASSWORD, safeEqual, isAdmin, requireAdmin, setSession, clearSession, rateLimit };

'use strict';
// لایه‌ی پایگاه‌داده: SQLite داخلی Node (بدون وابستگی native)
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'maktab.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  group_name TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  body TEXT NOT NULL,
  videos TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  speaker TEXT DEFAULT '',
  kind TEXT DEFAULT '',
  day TEXT DEFAULT '',
  time TEXT DEFAULT '',
  place TEXT DEFAULT '',
  description TEXT DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  author TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  body TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  course TEXT DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  caption TEXT DEFAULT '',
  link TEXT DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
`);

// پایگاه‌داده‌ی قدیمی ستون «دوره» را ندارد؛ در صورت نیاز اضافه می‌شود
if (!db.prepare('PRAGMA table_info(people)').all().some((c) => c.name === 'course')) {
  db.exec("ALTER TABLE people ADD COLUMN course TEXT DEFAULT ''");
}

if (!db.prepare('PRAGMA table_info(programs)').all().some((c) => c.name === 'videos')) {
  db.exec("ALTER TABLE programs ADD COLUMN videos TEXT NOT NULL DEFAULT ''");
}
if (!db.prepare('PRAGMA table_info(reports)').all().some((c) => c.name === 'videos')) {
  db.exec("ALTER TABLE reports ADD COLUMN videos TEXT NOT NULL DEFAULT ''");
}

/** درج داده‌ی نمونه در اولین اجرا (فقط اگر جدول خالی باشد) */
function seedIfEmpty() {
  const seedPath = path.join(__dirname, '..', 'public', 'data', 'seed.json');
  if (!fs.existsSync(seedPath)) return;
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const tables = {
    reports: ['title', 'group_name', 'event_date', 'body', 'videos'],
    programs: ['title', 'speaker', 'kind', 'day', 'time', 'place', 'description', 'videos'],
    announcements: ['title', 'body', 'pinned'],
    articles: ['title', 'category', 'author', 'excerpt', 'body'],
    people: ['name', 'role', 'bio', 'course'],
    slides: ['title', 'caption', 'link'],
  };
  for (const [table, cols] of Object.entries(tables)) {
    const count = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
    if (count > 0 || !Array.isArray(seed[table])) continue;
    const stmt = db.prepare(
      `INSERT INTO ${table} (${cols.join(',')},images) VALUES (${cols.map(() => '?').join(',')},?)`
    );
    for (const row of seed[table]) stmt.run(...cols.map((c) => row[c] ?? (c === 'pinned' ? 0 : '')), JSON.stringify(Array.isArray(row.images) ? row.images : []));
  }
  const setStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(seed.settings || {})) setStmt.run(k, String(v));
}

module.exports = { db, seedIfEmpty, DATA_DIR, UPLOAD_DIR };

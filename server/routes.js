'use strict';
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { db, UPLOAD_DIR } = require('./db');
const auth = require('./auth');

const router = express.Router();

/* ------------------------------------------------------------------ */
/* تعریف منابع (جدول‌ها، فیلدهای مجاز و محدودیت‌ها)                    */
/* ------------------------------------------------------------------ */
const RESOURCES = {
  reports: {
    fields: { title: 200, group_name: 120, event_date: 20, body: 20000, videos: 2000 },
    required: ['title', 'body'],
    order: 'event_date DESC, id DESC',
    maxImages: 12,
  },
  programs: {
    fields: { title: 200, speaker: 120, kind: 60, day: 80, time: 60, place: 200, description: 4000, videos: 2000 },
    required: ['title'],
    order: 'id ASC',
    maxImages: 1,
  },
  announcements: {
    fields: { title: 200, body: 10000, pinned: 1 },
    required: ['title', 'body'],
    order: 'pinned DESC, id DESC',
    maxImages: 1,
  },
  articles: {
    fields: { title: 200, category: 60, author: 120, excerpt: 400, body: 50000 },
    required: ['title', 'body'],
    order: 'id DESC',
    maxImages: 1,
  },
  slides: {
    fields: { title: 200, caption: 400, link: 200 },
    required: ['title'],
    order: 'id DESC',
    maxImages: 1,
  },
  people: {
    fields: { name: 120, role: 120, bio: 3000, course: 10 },
    required: ['name'],
    order: 'id ASC',
    maxImages: 1,
  },
};

const SETTING_KEYS = ['site_name', 'tagline', 'address', 'phone', 'email', 'hours', 'instagram', 'telegram', 'about_history', 'about_mission', 'map_url', 'course_first','aparat','bale', 'course_last', 'founded'];

/* ------------------------------------------------------------------ */
/* آپلود تصویر                                                         */
/* ------------------------------------------------------------------ */
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(new Error('فقط تصویر JPG، PNG یا WebP مجاز است.'))),
});

/** بررسی امضای واقعی فایل (فقط به Content-Type کلاینت اعتماد نمی‌کنیم) */
function looksLikeImage(file) {
  const fd = fs.openSync(file.path, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const webp = buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}

const removeFiles = (names) =>
  names.forEach((n) => fs.unlink(path.join(UPLOAD_DIR, path.basename(n)), () => {}));

const parseImages = (row) => ({ ...row, images: JSON.parse(row.images || '[]') });

/* ------------------------------------------------------------------ */
/* ابزارها                                                             */
/* ------------------------------------------------------------------ */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function cleanBody(cfg, body, { partial }) {
  const out = {};
  for (const [key, max] of Object.entries(cfg.fields)) {
    if (!(key in body)) continue;
    if (key === 'pinned') {
      out.pinned = ['1', 'true', 'on', true, 1].includes(body.pinned) ? 1 : 0;
    } else {
      out[key] = String(body[key] ?? '').trim().slice(0, max);
    }
  }
  const missing = cfg.required.filter((k) => (partial ? k in out && !out[k] : !out[k]));
  return { out, missing };
}

const labels = { title: 'عنوان', body: 'متن', name: 'نام' };

/* ------------------------------------------------------------------ */
/* مسیرهای عمومی/ایمن                                                  */
/* ------------------------------------------------------------------ */
router.get('/health', (req, res) => res.json({ ok: true }));

router.post(
  '/auth/login',
  auth.rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  (req, res) => {
    if (!auth.safeEqual(req.body?.password ?? '', auth.ADMIN_PASSWORD)) {
      return res.status(401).json({ error: 'رمز عبور نادرست است.' });
    }
    auth.setSession(res);
    res.json({ ok: true });
  }
);
router.post('/auth/logout', (req, res) => {
  auth.clearSession(res);
  res.json({ ok: true });
});
router.get('/auth/me', (req, res) => res.json({ admin: auth.isAdmin(req) }));

/* تنظیمات سایت (آدرس، تلفن، متن درباره‌ی ما ...) */
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});
router.put('/settings', auth.requireAdmin, (req, res) => {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const key of SETTING_KEYS) {
    if (key in (req.body || {})) stmt.run(key, String(req.body[key]).slice(0, 8000));
  }
  res.json({ ok: true });
});

/* پیام‌های «تماس با ما» */
router.post(
  '/messages',
  auth.rateLimit({ windowMs: 10 * 60 * 1000, max: 5 }),
  (req, res) => {
    const { name = '', phone = '', text = '', website = '' } = req.body || {};
    if (website) return res.json({ ok: true }); // honeypot برای ربات‌ها
    if (!String(name).trim() || !String(text).trim()) {
      return res.status(400).json({ error: 'نام و متن پیام الزامی است.' });
    }
    db.prepare('INSERT INTO messages (name, phone, text) VALUES (?, ?, ?)').run(
      String(name).trim().slice(0, 120),
      String(phone).trim().slice(0, 40),
      String(text).trim().slice(0, 4000)
    );
    res.status(201).json({ ok: true });
  }
);
router.get('/messages', auth.requireAdmin, (req, res) =>
  res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all())
);
router.delete('/messages/:id', auth.requireAdmin, (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* CRUD عمومی برای منابع                                               */
/* ------------------------------------------------------------------ */
router.param('resource', (req, res, next, name) => {
  if (!Object.hasOwn(RESOURCES, name)) return res.status(404).json({ error: 'یافت نشد.' });
  req.cfg = RESOURCES[name];
  next();
});

router.get('/:resource', (req, res) => {
  const rows = db.prepare(`SELECT * FROM ${req.params.resource} ORDER BY ${req.cfg.order}`).all();
  res.json(rows.map(parseImages));
});

router.get('/:resource/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM ${req.params.resource} WHERE id = ?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'یافت نشد.' });
  res.json(parseImages(row));
});

router.post(
  '/:resource',
  auth.requireAdmin,
  upload.array('images', 12),
  wrap((req, res) => {
    const files = req.files || [];
    const { out, missing } = cleanBody(req.cfg, req.body || {}, { partial: false });
    const bad = files.some((f) => !looksLikeImage(f));
    if (bad || missing.length) {
      removeFiles(files.map((f) => f.filename));
      return res.status(400).json({ error: bad ? 'فایل ارسالی تصویر معتبر نیست.' : `فیلد الزامی خالی است: ${missing.map((m) => labels[m] || m).join('، ')}` });
    }
    const names = files.map((f) => f.filename).slice(-req.cfg.maxImages);
    removeFiles(files.map((f) => f.filename).filter((n) => !names.includes(n)));
    const cols = [...Object.keys(out), 'images'];
    const info = db
      .prepare(`INSERT INTO ${req.params.resource} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
      .run(...Object.values(out), JSON.stringify(names));
    const row = db.prepare(`SELECT * FROM ${req.params.resource} WHERE id = ?`).get(Number(info.lastInsertRowid));
    res.status(201).json(parseImages(row));
  })
);

router.put(
  '/:resource/:id',
  auth.requireAdmin,
  upload.array('images', 12),
  wrap((req, res) => {
    const table = req.params.resource;
    const id = Number(req.params.id);
    const files = req.files || [];
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    const { out, missing } = cleanBody(req.cfg, req.body || {}, { partial: true });
    const bad = files.some((f) => !looksLikeImage(f));
    if (!existing || bad || missing.length) {
      removeFiles(files.map((f) => f.filename));
      if (!existing) return res.status(404).json({ error: 'یافت نشد.' });
      return res.status(400).json({ error: bad ? 'فایل ارسالی تصویر معتبر نیست.' : 'یکی از فیلدهای الزامی خالی است.' });
    }

    // تصاویر: نگه‌داشتن موارد انتخاب‌شده + افزودن فایل‌های جدید
    const old = JSON.parse(existing.images || '[]');
    let keep = old;
    if (typeof req.body?.keep_images === 'string') {
      try {
        keep = JSON.parse(req.body.keep_images).filter((n) => old.includes(n));
      } catch {
        keep = old;
      }
    }
    let next = [...keep, ...files.map((f) => f.filename)];
    if (next.length > req.cfg.maxImages) next = next.slice(-req.cfg.maxImages);
    removeFiles(old.filter((n) => !next.includes(n)));
    removeFiles(files.map((f) => f.filename).filter((n) => !next.includes(n)));

    const cols = [...Object.keys(out), 'images'];
    db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run(
      ...Object.values(out),
      JSON.stringify(next),
      id
    );
    res.json(parseImages(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)));
  })
);

router.delete('/:resource/:id', auth.requireAdmin, (req, res) => {
  const table = req.params.resource;
  const id = Number(req.params.id);
  const row = db.prepare(`SELECT images FROM ${table} WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: 'یافت نشد.' });
  removeFiles(JSON.parse(row.images || '[]'));
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  res.json({ ok: true });
});

module.exports = { router, UPLOAD_DIR };

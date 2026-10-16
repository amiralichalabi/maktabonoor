'use strict';
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const { seedIfEmpty, UPLOAD_DIR } = require('./db');
const { router } = require('./routes');

seedIfEmpty();

const app = express();
const PUBLIC = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://www.aparat.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        frameSrc: ['https://www.aparat.com', 'https://*.aparat.com', 'https://*.aparatcdn.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
  })
);
app.use(express.json({ limit: '100kb' }));

// API
app.use('/api', router);
app.use('/api', (req, res) => res.status(404).json({ error: 'مسیر API یافت نشد.' }));

// تصاویر آپلودشده (فقط به‌عنوان تصویر، با نوع محتوای ثابت)
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, { maxAge: '7d', index: false, dotfiles: 'deny', setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') })
);

// فرانت‌اند ایستا
app.use(express.static(PUBLIC, { extensions: ['html'], maxAge: '1h' }));
app.use((req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

// خطاها (از جمله خطاهای آپلود)
app.use((err, req, res, next) => {
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || 400;
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'حجم هر تصویر حداکثر ۵ مگابایت است.' : err.message || 'خطای سرور';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: msg });
});

app.listen(PORT, () => console.log(`مکتب النور روی http://localhost:${PORT} در حال اجراست`));

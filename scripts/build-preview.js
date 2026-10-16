'use strict';
// ساخت نسخه‌ی تک‌فایلی (پیش‌نمایش نمایشی) از فرانت‌اند: node scripts/build-preview.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const seed = JSON.stringify(JSON.parse(read('public/data/seed.json'))).replace(/</g, '\\u003c');

// فونت‌ها را به‌صورت data URI داخل CSS می‌گذاریم تا فایل مستقل بماند
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'public/fonts', f)).toString('base64');
const css = read('public/css/style.css')
  .replace("url('../fonts/Vazirmatn.woff2')", `url('${font('Vazirmatn.woff2')}')`)
  .replace("url('../fonts/AmiriQuran.woff2')", `url('${font('AmiriQuran.woff2')}')`);

const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'public/img', f)).toString('base64');
let html = `<title>مکتب النور</title>
<style>
:root { color-scheme: light; }
body { font-size: 16px; background: #fff; color: #0a0a0a; }
${css}
</style>
<div id="loader" aria-hidden="true">
  <img src="img/logo-mark.png" alt="">
</div>
<header id="header"></header>
<main id="app"></main>
<footer id="footer"></footer>
<div id="lightbox" role="dialog" aria-modal="true" aria-label="نمایش تصویر"></div>
<div id="toast" role="status" aria-live="polite"></div>
<script>window.__SEED__ = ${seed};</script>
<script>${read('public/js/ornaments.js')}</script>
<script>${read('public/js/api.js')}</script>
<script>${read('public/js/app.js')}</script>
`;

html = html.split('img/logo-mark.png').join(img('logo-mark.png')).split('img/logo-wide.png').join(img('logo-wide.png'));
html = html.replace(/img\/samples\/([\w-]+\.jpg)/g, (m, f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'public/img/samples', f)).toString('base64'));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'preview.html'), html);
console.log('dist/preview.html', (html.length / 1024).toFixed(0) + 'KB');

'use strict';
// ساخت پوشه‌ی docs برای GitHub Pages: node scripts/build-pages.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'docs');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('docs/ آماده است');

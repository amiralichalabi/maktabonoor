/*
 * لایه‌ی ارتباط با بک‌اند.
 * - حالت زنده: با /api (Express + SQLite) صحبت می‌کند.
 * - حالت نمایشی (demo): اگر بک‌اند در دسترس نباشد (مثلاً پیش‌نمایش ایستا)،
 *   داده‌ها در مرورگر ذخیره می‌شوند تا همه‌ی بخش‌ها از جمله پنل مدیریت قابل آزمایش باشد.
 */
(function () {
  const MAX_IMAGES = { reports: 12, programs: 1, announcements: 1, articles: 1, people: 1, slides: 1 };
  const REQUIRED = { reports: ['title', 'body'], programs: ['title'], announcements: ['title', 'body'], articles: ['title', 'body'], people: ['name'], slides: ['title'] };
  const LS_KEY = 'maktabonoor_demo_v2';

  let mode = 'live';
  let demo = null;
  let demoAdmin = false;

  /* ---------------- زنده ---------------- */
  async function http(method, url, body) {
    const opt = { method, headers: {}, credentials: 'same-origin' };
    if (body instanceof FormData) opt.body = body;
    else if (body !== undefined) {
      opt.headers['content-type'] = 'application/json';
      opt.body = JSON.stringify(body);
    }
    const r = await fetch(url, opt);
    let j = null;
    try { j = await r.json(); } catch { /* ignore */ }
    if (!r.ok) throw new Error((j && j.error) || 'خطا در ارتباط با سرور');
    return j;
  }

  /* ---------------- نمایشی ---------------- */
  const toDataURL = (f) => new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); });

  /** کوچک‌کردن تصویر برای ذخیره در مرورگر */
  async function shrink(file) {
    const src = await toDataURL(file);
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1100 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => res(src);
      img.src = src;
    });
  }

  async function loadDemo() {
    let seed = window.__SEED__;
    const sig = seed ? JSON.stringify(seed).length : 0;
    try { const saved = localStorage.getItem(LS_KEY); if (saved) { const d = JSON.parse(saved); if (d.sig === sig) { demo = d; return; } } } catch { /* ignore */ }
    if (!seed) { try { seed = await (await fetch('data/seed.json')).json(); } catch { seed = {}; } }
    demo = { settings: seed.settings || {}, messages: [], seq: 0, sig };
    const now = Date.now();
    for (const res of Object.keys(MAX_IMAGES)) {
      demo[res] = (seed[res] || []).map((row, i) => ({
        pinned: 0, ...row, id: ++demo.seq, images: Array.isArray(row.images) ? row.images : [],
        created_at: new Date(now - i * 86400000).toISOString(),
      }));
    }
    persist();
  }
  function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify(demo)); } catch { /* حجم پر شد */ } }

  const sorters = {
    reports: (a, b) => String(b.event_date).localeCompare(String(a.event_date)) || b.id - a.id,
    programs: (a, b) => a.id - b.id,
    announcements: (a, b) => b.pinned - a.pinned || b.id - a.id,
    articles: (a, b) => b.id - a.id,
    people: (a, b) => a.id - b.id,
    slides: (a, b) => b.id - a.id,
  };

  async function demoSave(res, id, fd) {
    const o = {}; const files = [];
    for (const [k, v] of fd.entries()) { if (v instanceof File) { if (v.size) files.push(v); } else o[k] = v; }
    const table = demo[res];
    const row = id ? table.find((x) => x.id === Number(id)) : null;
    if (id && !row) throw new Error('یافت نشد.');
    const missing = REQUIRED[res].filter((k) => (id ? k in o && !String(o[k]).trim() : !String(o[k] || '').trim()));
    if (missing.length) throw new Error('فیلدهای الزامی را پر کنید.');
    let keep = row ? row.images : [];
    if (o.keep_images !== undefined) { try { const k = JSON.parse(o.keep_images); keep = keep.filter((x) => k.includes(x)); } catch { /* ignore */ } }
    delete o.keep_images;
    const added = await Promise.all(files.map(shrink));
    const images = [...keep, ...added].slice(-MAX_IMAGES[res]);
    if ('pinned' in o) o.pinned = ['1', 'true', 'on'].includes(o.pinned) ? 1 : 0;
    for (const k of Object.keys(o)) o[k] = String(o[k]).trim();
    if (row) { Object.assign(row, o, { images }); persist(); return row; }
    const created = { pinned: 0, ...o, id: ++demo.seq, images, created_at: new Date().toISOString() };
    table.push(created); persist(); return created;
  }

  /* ---------------- API عمومی ---------------- */
  const API = {
    get mode() { return mode; },
    imgUrl: (n) => (/^(data:|https?:|img\/)/.test(n) ? n : 'uploads/' + n),

    async init() {
      try {
        const r = await fetch('api/health', { cache: 'no-store' });
        const j = await r.json();
        mode = j && j.ok ? 'live' : 'demo';
      } catch { mode = 'demo'; }
      if (mode === 'demo') await loadDemo();
      return mode;
    },

    async list(res) {
      if (mode === 'live') return http('GET', `api/${res}`);
      return [...demo[res]].sort(sorters[res]);
    },
    async get(res, id) {
      if (mode === 'live') return http('GET', `api/${res}/${id}`);
      const r = demo[res].find((x) => x.id === Number(id));
      if (!r) throw new Error('یافت نشد.');
      return r;
    },
    async save(res, id, fd) {
      if (mode === 'live') return http(id ? 'PUT' : 'POST', id ? `api/${res}/${id}` : `api/${res}`, fd);
      return demoSave(res, id, fd);
    },
    async remove(res, id) {
      if (mode === 'live') return http('DELETE', `api/${res}/${id}`);
      demo[res] = demo[res].filter((x) => x.id !== Number(id)); persist(); return { ok: true };
    },

    async settings() { return mode === 'live' ? http('GET', 'api/settings') : { ...demo.settings }; },
    async saveSettings(obj) {
      if (mode === 'live') return http('PUT', 'api/settings', obj);
      Object.assign(demo.settings, obj); persist(); return { ok: true };
    },

    async sendMessage(m) {
      if (mode === 'live') return http('POST', 'api/messages', m);
      demo.messages.unshift({ id: ++demo.seq, ...m, created_at: new Date().toISOString() }); persist(); return { ok: true };
    },
    async messages() { return mode === 'live' ? http('GET', 'api/messages') : [...demo.messages]; },
    async removeMessage(id) {
      if (mode === 'live') return http('DELETE', `api/messages/${id}`);
      demo.messages = demo.messages.filter((m) => m.id !== Number(id)); persist(); return { ok: true };
    },

    async me() { return mode === 'live' ? (await http('GET', 'api/auth/me')).admin : demoAdmin; },
    async login(password) {
      if (mode === 'live') return http('POST', 'api/auth/login', { password });
      if (!password) throw new Error('رمز عبور را وارد کنید.');
      demoAdmin = true; return { ok: true };
    },
    async logout() { if (mode === 'live') return http('POST', 'api/auth/logout'); demoAdmin = false; return { ok: true }; },
    resetDemo() { try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } location.reload(); },
  };

  window.API = API;
})();

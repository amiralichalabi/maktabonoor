/* مکتب النور — فرانت‌اند (SPA سبک با مسیریابی hash، بدون وابستگی) */
(function () {
  'use strict';
  const { STAR, LOGO, LOGO_WIDE, DIVIDER, VERSES, BISMILLAH } = window.ORN;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const paras = (s) => esc(s).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  const nf = (n) => Number(n).toLocaleString('fa-IR', { useGrouping: false });
  const fa = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const dfmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });
  const fdate = (d) => {
    if (!d) return '';
    const dt = new Date(/^\d{4}-\d\d-\d\d \d/.test(d) ? d.replace(' ', 'T') + 'Z' : d);
    if (isNaN(dt)) return '';
    /* ترتیب «روز ماه سال» را خودمان می‌چینیم و با جداکننده‌ی RTL محصور می‌کنیم تا در هر زمینه‌ای درست بماند */
    const o = {};
    dfmt.formatToParts(dt).forEach((x) => { o[x.type] = x.value; });
    const num = (v) => String(v).replace(/\d/g, (c) => '۰۱۲۳۴۵۶۷۸۹'[c]);
    return o.day && o.month && o.year ? `\u202B${num(o.day)} ${o.month} ${num(o.year)}\u202C` : dfmt.format(dt);
  };
  const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };
  const ICON = {
    pin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    phone: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>',
    clock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 12H5m6-6-6 6 6 6"/></svg>',
    chev: '<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg>',
  };

  let S = {};          // تنظیمات سایت
  let timers = [];     // تایمرهای صفحه‌ی جاری
  /* ویدیوهای آپارات: فقط شناسه‌ی ویدیو استخراج می‌شود و آدرس تعبیه از روی آن ساخته می‌شود */
  const aparatIds = (txt) => [...new Set(String(txt || '').split(/[\s,،]+/).map((t) => {
    const m = t.match(/aparat\.com\/(?:v\/|video\/video\/embed\/videohash\/|embed\/)([A-Za-z0-9]{3,20})/i) || t.match(/^([A-Za-z0-9]{3,20})$/);
    return m ? m[1] : '';
  }).filter(Boolean))];
  const aparatEmbed = (id) => `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame`;
  /* پخش‌کننده‌ی آپارات: کد رسمی (اسکریپت) و در صورت بارنشدن، iframe جایگزین */
  const aparatSlot = (id) => `<div class="apwrap"><div class="apslot" data-id="${id}"></div><a class="aplink" href="https://www.aparat.com/v/${id}" target="_blank" rel="noopener noreferrer">اگر ویدیو پخش نشد، در آپارات ببینید ↗</a></div>`;
  function mountAparat(root = document) {
    $$('.apslot:not([data-m])', root).forEach((el) => {
      el.dataset.m = '1';
      const id = el.dataset.id;
      const box = document.createElement('div');
      box.id = 'ap' + Math.random().toString(36).slice(2, 12);
      el.appendChild(box);
      const fallback = () => {
        if (el.querySelector('iframe')) return;
        el.innerHTML = `<div class="vframe"><iframe src="${aparatEmbed(id)}" title="ویدیوی آپارات" loading="lazy" allowfullscreen></iframe></div>`;
      };
      const sc = document.createElement('script');
      sc.src = `https://www.aparat.com/embed/${id}?data[rnddiv]=${box.id}&data[responsive]=yes`;
      sc.async = true;
      sc.onerror = fallback;
      document.head.appendChild(sc);
      setTimeout(fallback, 7000);
    });
  }
  const channelUrl = () => (/^https:\/\/(www\.)?aparat\.com\//i.test(S.aparat || '') ? S.aparat : 'https://www.aparat.com/maktabnoor');
  const link = (h, cls, txt) => `<a href="#${h}" class="${cls}">${txt}</a>`;

  /* ---------------------------------------------------------------- */
  /* دوره‌ها (۱۷ تا ۲۳ + فارغ‌التحصیلان) و بخش‌های برنامه‌ها            */
  /* ---------------------------------------------------------------- */
  const PALETTE = ['#ff7a59', '#ffc233', '#37d29b', '#2bbbdc', '#6a95ff', '#a285ff', '#ff72ae'];
  const GRAD = '#b8dc4a';
  const PROGRAM_KINDS = ['اردوی مشهد', 'اردوی اربعین', 'اردوی پاییزی', 'اعتکاف', 'اردوی زمستانی', 'کلاس‌های تابستانی', 'ضیافت نور', 'برنامه‌های تفریحی', 'برنامه‌های ورزشی', 'جلسات دوره‌ای'];

  function courseKeys() {
    const a = parseInt(S.course_first, 10) || 17;
    let b = parseInt(S.course_last, 10) || 23;
    if (b < a) b = a;
    const keys = [];
    for (let i = a; i <= b && keys.length < 80; i++) keys.push(String(i));
    keys.push('grad');
    return keys;
  }
  const isCourse = (k) => k === 'grad' || courseKeys().includes(String(k));
  const courseLabel = (k) => (k === 'grad' ? 'فارغ‌التحصیلان' : isCourse(k) ? `دوره ${nf(k)}` : String(k || 'گزارش'));
  const courseColor = (k) => (k === 'grad' ? GRAD : isCourse(k) ? PALETTE[Number(k) % PALETTE.length] : '#e6e6e3');
  const mentorsOf = (people, k) => people.filter((p) => p.course === k).map((p) => p.name);

  /* ---------------------------------------------------------------- */
  /* اجزای مشترک                                                       */
  /* ---------------------------------------------------------------- */
  const NAV = [
    ['/', 'خانه'], ['/reports', 'گزارش‌ها'], ['/programs', 'برنامه‌ها'], ['/people', 'افراد'],
    ['/news', 'اطلاع‌رسانی'], ['/articles', 'مقالات'], ['/about', 'درباره‌ی ما'], ['/contact', 'تماس با ما'],
  ];

  function renderChrome() {
    const name = esc(S.site_name || 'مکتب النور');
    $('#header').innerHTML = `<div class="wrap nav">
      <a class="brand" href="#/" aria-label="${name}">${LOGO(36)}<span>${name}</span></a>
      <nav aria-label="منوی اصلی"><ul class="menu">${NAV.map(([h, t]) => `<li><a href="#${h}" data-nav="${h}">${t}</a></li>`).join('')}</ul></nav>
      <button class="burger" aria-label="منو" aria-expanded="false"><b>منو</b><i><span></span><span></span><span></span></i></button>
    </div>`;
    $('.burger').onclick = () => toggleMenu();
    $$('.menu a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

    $('#footer').innerHTML = `<div class="wrap">
      <div class="foot">
        <div><a href="#/" aria-label="${name}">${LOGO_WIDE(86, 'inv')}</a>
          <p style="margin-top:1rem;color:#b4b4b4;max-width:26rem">${esc(S.tagline || '')}</p></div>
        <div><h4>دسترسی سریع</h4><ul>${NAV.slice(1).map(([h, t]) => `<li><a href="#${h}">${t}</a></li>`).join('')}</ul></div>
        <div><h4>ارتباط با ما</h4><ul>
          ${S.address ? `<li>${esc(S.address)}</li>` : ''}${S.hours ? `<li>${esc(S.hours)}</li>` : ''}
          ${S.phone ? `<li dir="ltr" style="text-align:right">${esc(S.phone)}</li>` : ''}${S.email ? `<li>${esc(S.email)}</li>` : ''}
          ${/^https:\/\//.test(S.bale || '') ? `<li><a href="${esc(S.bale)}" target="_blank" rel="noopener noreferrer">کانال ما در بله</a></li>` : ''}${/^https:\/\//.test(S.aparat || '') ? `<li><a href="${esc(S.aparat)}" target="_blank" rel="noopener noreferrer">کانال ما در آپارات</a></li>` : ''}</ul></div>
      </div>
      <div class="copy"><span>© ${new Date().toLocaleDateString('fa-IR-u-ca-persian', { year: 'numeric' })} ${name}؛ همه‌ی حقوق محفوظ است.</span><a href="#/admin">ورود مدیر</a></div>
    </div>`;
  }
  function toggleMenu(force) {
    const open = force ?? !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    $('.burger')?.setAttribute('aria-expanded', open);
  }

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200);
  }

  const secHead = (eyebrow, title, href, more = 'مشاهده‌ی همه') =>
    `<div class="sec-head reveal"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>${href ? link(href, 'link-more', `${more} ${ICON.arrow}`) : ''}</div>`;

  const pageHead = (title, sub) => `<section class="sec sec--light page-head"><div class="pattern"></div><div class="wrap ph-in rel"><div><p class="eyebrow">${sub}</p><h1>${title}</h1></div><p class="bism" aria-hidden="true">${BISMILLAH}</p></div></section>`;

  const thumb = (r, alt) => (r.images && r.images[0]
    ? `<div class="thumb"><img loading="lazy" src="${esc(API.imgUrl(r.images[0]))}" alt="${esc(alt)}"></div>`
    : `<div class="thumb ph">${STAR(70)}</div>`);

  const stagger = (i) => `style="--d:${Math.min(i, 8) * 0.08}s"`;

  /* کارت‌ها */
  const reportCard = (r, i = 0) => {
    const k = r.group_name;
    const media = r.images && r.images[0]
      ? `<div class="thumb"><img loading="lazy" src="${esc(API.imgUrl(r.images[0]))}" alt="${esc(r.title)}"></div>`
      : `<div class="thumb ph c">${STAR(70)}</div>`;
    return `<a class="card card--c reveal" style="--c:${courseColor(k)};--d:${Math.min(i, 8) * 0.08}s" href="#/reports/${r.id}">
      ${media}<div class="card-body"><div class="meta"><span class="chip chip--c">${esc(courseLabel(k))}</span><span class="muted">${fdate(r.event_date || r.created_at)}</span>${aparatIds(r.videos).length ? '<span class="vbadge">▶ ویدیو</span>' : ''}</div>
      <h3>${esc(r.title)}</h3><p class="muted">${esc(cut(r.body, 110))}</p></div></a>`;
  };

  const programRow = (p, i = 0) => `<a class="prow reveal" ${stagger(i)} href="#/programs/${p.id}" data-g="${esc(p.kind)}">
    <div class="when">${p.day ? `<b>${esc(p.day)}</b>` : ''}${p.time ? `<span class="muted">${esc(p.time)}</span>` : ''}</div>
    <div><h3>${esc(p.title)}</h3>${[p.speaker, p.description].filter(Boolean).map((x) => `<p class="muted">${esc(cut(x, 140))}</p>`).join('')}</div>
    <div class="where">${p.kind ? `<span class="chip">${esc(p.kind)}</span>` : ''}${p.place ? `<span class="muted">${esc(p.place)}</span>` : ''}
      ${(p.images && p.images[0]) || aparatIds(p.videos).length ? `<span class="muted">${p.images && p.images[0] ? '📷 عکس ' : ''}${aparatIds(p.videos).length ? '▶ ویدیو' : ''}</span>` : ''}
      <span class="go">مشاهده ${ICON.arrow}</span></div></a>`;

  const articleCard = (a, i = 0) => `<a class="card reveal" ${stagger(i)} href="#/articles/${a.id}" data-g="${esc(a.category)}">
    ${thumb(a, a.title)}<div class="card-body"><div class="meta">${a.category ? `<span class="chip">${esc(a.category)}</span>` : ''}<span class="muted">${fdate(a.created_at)}</span></div>
    <h3>${esc(a.title)}</h3><p class="muted">${esc(a.excerpt || cut(a.body, 120))}</p>
    ${a.author ? `<span class="muted" style="font-size:.8rem;margin-top:auto">${esc(a.author)}</span>` : ''}</div></a>`;

  const personCard = (p, i = 0) => `<article class="person reveal" style="--c:${courseColor(p.course)};--d:${Math.min(i, 8) * 0.08}s">
    <div class="arch ${p.images && p.images[0] ? '' : 'c'}">${p.images && p.images[0] ? `<img loading="lazy" src="${esc(API.imgUrl(p.images[0]))}" alt="${esc(p.name)}">` : STAR(54)}</div>
    <h3>${esc(p.name)}</h3>${p.role ? `<span class="chip">${esc(p.role)}</span>` : ''}${p.bio ? `<p class="muted">${esc(p.bio)}</p>` : ''}</article>`;

  const newsItem = (n, open = false) => `<details class="reveal" ${open ? 'open' : ''}><summary>${n.pinned ? '<span class="pin">سنجاق‌شده</span>' : ''}<span>${esc(n.title)}</span>
    <span class="muted" style="font-weight:400;font-size:.8rem">${fdate(n.created_at)}</span>${ICON.chev}</summary><div class="body">${paras(n.body)}</div></details>`;

  const skeleton = (n = 3) => `<div class="grid">${'<div class="skeleton"></div>'.repeat(n)}</div>`;
  const empty = (t) => `<div class="empty">${t}</div>`;
  const failed = (e) => empty(`خطا در دریافت اطلاعات: ${esc(e.message)}`);

  /* فیلتر دسته‌ای (چیپ‌ها) */
  const chipsFor = (items, key, all = 'همه') => {
    const vals = [...new Set(items.map((x) => x[key]).filter(Boolean))];
    return vals.length < 2 ? '' : `<div class="chips reveal" role="group"><button class="on" data-f="">${all}</button>${vals.map((v) => `<button data-f="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;
  };
  function bindFilter(root) {
    $$('.chips button', root).forEach((b) => b.addEventListener('click', () => {
      $$('.chips button', root).forEach((x) => x.classList.toggle('on', x === b));
      $$('[data-g]', root).forEach((c) => c.classList.toggle('hide', !!b.dataset.f && c.dataset.g !== b.dataset.f));
    }));
  }

  /* ---------------------------------------------------------------- */
  /* اسلایدر عکس‌های منتخب با افکت ورق‌خوردن                            */
  /* ---------------------------------------------------------------- */
  const hrefOf = (l) => (/^\/[\w\-/]*$/.test(l || '') ? `#${l}` : /^https:\/\//.test(l || '') ? l : '');

  /** اولویت: اسلایدهای آپلودشده ← اولین عکس گزارش‌ها ← اسلاید برند و آیات */
  function buildSlides(slides, reports) {
    const photos = slides.filter((s) => s.images && s.images[0])
      .map((s) => ({ img: API.imgUrl(s.images[0]), title: s.title, sub: s.caption, link: s.link, tag: 'عکس منتخب' }));
    if (photos.length) return photos;
    const fromReports = reports.filter((r) => r.images && r.images[0]).slice(0, 5)
      .map((r) => ({ img: API.imgUrl(r.images[0]), title: r.title, sub: courseLabel(r.group_name), link: `/reports/${r.id}`, tag: 'گزارش دوره‌ها' }));
    if (fromReports.length) return fromReports;
    return [
      { title: S.site_name || 'مکتب النور', sub: S.tagline, link: '/about', brand: true },
      { title: 'جلسات حفاظ القرآن', sub: S.hours ? `${S.hours}؛ ${S.address || ''}` : 'حلقه‌های حفظ، مرور و تلاوت', link: '/about', v: 1 },
      { title: 'گزارش دوره‌ها', sub: 'گزارش‌های تصویری و متنی هر دوره', link: '/reports', v: 2 },
      { title: 'برنامه‌ها و اردوها', sub: 'اردو، اعتکاف، ضیافت نور و جلسات دوره‌ای', link: '/programs', v: 0 },
    ];
  }

  function slideHtml(s, i) {
    const href = hrefOf(s.link);
    const ext = /^https:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    const media = s.img
      ? `<img class="slide-img" src="${esc(s.img)}" alt="${esc(s.title)}" ${i ? 'loading="lazy"' : ''}>`
      : s.brand
        ? `<div class="slide-art"><div class="slide-brand">${LOGO(210, 'inv')}</div></div>`
        : `<div class="slide-art"><div class="slide-verse"><div class="ar">${VERSES[s.v].t}</div><div class="ref">${VERSES[s.v].r}</div></div></div>`;
    return `<article class="slide ${i ? '' : 'cur'}" aria-hidden="${i ? 'true' : 'false'}">${media}
      <div class="slide-cap"><div class="wrap">
        <p class="tagline">${esc(s.tag || (S.site_name || 'مکتب النور'))}</p><h2>${esc(s.title)}</h2>
        ${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ''}
        ${href ? `<a class="btn btn--ghost" style="--fg:#fff;--bg:#0c0c0c" href="${esc(href)}"${ext}>مشاهده ${ICON.arrow}</a>` : ''}</div></div></article>`;
  }

  const sliderHtml = (list) => `<section class="slider first ${list.length < 2 ? 'single' : ''}" id="slider" tabindex="0" aria-roledescription="carousel" aria-label="عکس‌های منتخب" style="--dur:6.5s">
    ${list.map(slideHtml).join('')}
    <div class="sl-ui"><div class="wrap">
      <div class="sl-bars">${list.map((_, i) => `<button class="bar" aria-label="اسلاید ${nf(i + 1)}"><i></i></button>`).join('')}</div>
      <div class="sl-ctrl"><button class="sl-btn prev" aria-label="قبلی"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 5 7 7-7 7"/></svg></button>
        <span class="sl-count"><b>${nf(1)}</b> / ${nf(list.length)}</span>
        <button class="sl-btn next" aria-label="بعدی"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 5-7 7 7 7"/></svg></button></div>
    </div></div></section>`;

  function initSlider() {
    const root = $('#slider'); if (!root) return;
    const slides = $$('.slide', root), bars = $$('.bar', root), n = slides.length, counter = $('.sl-count b', root);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = 0, busy = false;
    setTimeout(() => root.classList.remove('first'), 2800);

    const setBars = (i) => {
      bars.forEach((b, k) => { b.classList.remove('on', 'done'); if (k < i) b.classList.add('done'); });
      void root.offsetWidth;
      if (!reduce) bars[i].classList.add('on'); else bars.forEach((b, k) => b.classList.toggle('done', k <= i));
    };
    const mark = (i) => {
      slides.forEach((s, k) => { s.classList.remove('cur', 'under', 'enter', 'turn'); s.setAttribute('aria-hidden', k !== i); });
      slides[i].classList.add('cur'); counter.textContent = nf(i + 1); cur = i;
    };
    function go(to, dir) {
      if (busy || n < 2 || to === cur) return;
      busy = true;
      const from = slides[cur], target = slides[to];
      setBars(to);
      if (reduce) { mark(to); busy = false; return; }
      let fb;
      const done = () => { clearTimeout(fb); from.removeEventListener('animationend', end); target.removeEventListener('animationend', end); mark(to); busy = false; };
      const end = (e) => { if (e.animationName === 'pageTurn' || e.animationName === 'pageTurnIn') done(); };
      from.addEventListener('animationend', end); target.addEventListener('animationend', end);
      fb = setTimeout(done, 1600);
      if (dir > 0) { target.classList.add('under'); from.classList.add('turn'); }   // صفحه‌ی جاری ورق می‌خورد
      else { target.classList.add('enter'); }                                     // صفحه‌ی قبلی برمی‌گردد
    }
    const next = () => go((cur + 1) % n, 1), prev = () => go((cur - 1 + n) % n, -1);

    bars.forEach((b, k) => {
      b.addEventListener('click', () => go(k, k > cur ? 1 : -1));
      b.addEventListener('animationend', (e) => { if (e.animationName === 'barfill' && b.classList.contains('on')) next(); });
    });
    $('.next', root)?.addEventListener('click', next); $('.prev', root)?.addEventListener('click', prev);
    root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') next(); if (e.key === 'ArrowRight') prev(); });
    root.addEventListener('mouseenter', () => root.classList.add('paused')); root.addEventListener('mouseleave', () => root.classList.remove('paused'));
    root.addEventListener('focusin', () => root.classList.add('paused')); root.addEventListener('focusout', () => root.classList.remove('paused'));
    let x0 = null;
    root.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    root.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (dx < -60) next(); else if (dx > 60) prev(); });
    setBars(0);
  }

  /* ---------------------------------------------------------------- */
  /* صفحه‌ی اصلی                                                       */
  /* ---------------------------------------------------------------- */
  const pill = (k) => `<a class="cpill" style="--c:${courseColor(k)}" href="#/reports/course/${k}">${esc(courseLabel(k))}</a>`;

  async function home() {
    const [reports, programs, news, articles, people, slidesRaw] = await Promise.all(
      ['reports', 'programs', 'announcements', 'articles', 'people', 'slides'].map((r) => API.list(r))
    );
    const quick = [['/reports', 'گزارش‌ها', reports.length], ['/programs', 'برنامه‌ها', programs.length], ['/people', 'افراد', people.length], ['/articles', 'مقالات', articles.length]];
    const html = `
    ${sliderHtml(buildSlides(slidesRaw, reports))}

    <section class="sec sec--light intro"><div class="pattern"></div><div class="wrap rel">
      <p class="bism reveal">${BISMILLAH}</p>
      <p class="tag reveal" style="--d:.1s">${esc(S.tagline || '')}</p>
      <nav class="quick reveal" style="--d:.2s" aria-label="بخش‌های سایت">${quick.map(([h, l, n]) => `<a href="#${h}"><span class="n">${nf(n)}</span><span class="l">${l}</span></a>`).join('')}</nav>
    </div></section>

    <section class="sec sec--soft"><div class="wrap">
      ${secHead('گزارش‌ها', 'تازه‌ترین گزارش دوره‌ها', '/reports')}
      <div class="cpills reveal">${courseKeys().map(pill).join('')}</div>
      ${reports.length ? `<div class="grid">${reports.slice(0, 3).map(reportCard).join('')}</div>` : empty('هنوز گزارشی ثبت نشده است.')}
    </div></section>

    <section class="sec sec--light"><div class="wrap">
      ${secHead('برنامه‌ها', 'برنامه‌های مجموعه', '/programs')}
      ${programs.length ? `<div class="plist">${programs.slice(0, 4).map(programRow).join('')}</div>` : empty('برنامه‌ای ثبت نشده است.')}
    </div></section>

    <section class="sec sec--soft"><div class="wrap">
      ${secHead('اطلاع‌رسانی', 'اطلاعیه‌ها و خبرها', '/news')}
      ${news.length ? `<div class="news">${news.slice(0, 3).map((n, i) => newsItem(n, i === 0)).join('')}</div>` : empty('اطلاعیه‌ای وجود ندارد.')}
    </div></section>

    <section class="sec sec--light"><div class="wrap">
      ${secHead('مقاله و مجله', 'محتوای تربیتی و فرهنگی', '/articles')}
      ${articles.length ? `<div class="grid">${articles.slice(0, 3).map(articleCard).join('')}</div>` : empty('هنوز مقاله‌ای منتشر نشده است.')}
    </div></section>

    <section class="sec sec--dark"><div class="pattern"></div><div class="wrap two rel">
      <div class="reveal"><p class="eyebrow">درباره‌ی ما</p><h2 style="font-size:clamp(1.6rem,3.6vw,2.4rem);margin:.4rem 0 1rem">ریشه در حلقه‌های حفاظ القرآن</h2>
        <p class="muted">${esc(cut(S.about_mission, 260))}</p><p style="margin-top:1.5rem">${link('/about', 'btn btn--solid', 'بیشتر بدانید')}</p></div>
      <div class="mihrab reveal" style="--d:.15s"><div class="ar">إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ</div><p class="muted" style="font-size:.85rem">سوره‌ی حجر، آیه ۹</p>
        <div class="orn">${DIVIDER}</div></div>
    </div></section>`;
    return { html, after: initSlider };
  }

  /* ---------------------------------------------------------------- */
  /* گزارش‌ها (بر اساس دوره)                                            */
  /* ---------------------------------------------------------------- */
  async function reportsPage() {
    const [items, people] = await Promise.all([API.list('reports'), API.list('people')]);
    const tiles = courseKeys().map((k, i) => {
      const n = items.filter((r) => r.group_name === k).length;
      const m = mentorsOf(people, k);
      return `<a class="ctile reveal" style="--c:${courseColor(k)};--d:${Math.min(i, 8) * 0.07}s" href="#/reports/course/${k}">
        ${k === 'grad' ? `<span class="cl">بخش ویژه</span><span class="cn cn--w">فارغ‌التحصیلان</span>` : `<span class="cl">دوره</span><span class="cn">${nf(k)}</span>`}
        <span class="cc">${n ? `${nf(n)} گزارش` : 'بدون گزارش'}</span>${m.length ? `<span class="cm">${esc(m.join(' و '))}</span>` : ''}</a>`;
    }).join('');
    return {
      html: pageHead('گزارش‌ها', 'گزارش جلسات و برنامه‌ها به تفکیک دوره') + `
      <section class="sec sec--light"><div class="wrap">
        ${secHead('دوره‌ها', 'یک دوره را انتخاب کنید')}
        <div class="ctiles">${tiles}</div>
      </div></section>
      <section class="sec sec--soft"><div class="wrap">
        ${secHead('همه‌ی دوره‌ها', 'تازه‌ترین گزارش‌ها')}
        ${items.length ? `<div class="grid">${items.slice(0, 9).map(reportCard).join('')}</div>` : empty('هنوز گزارشی ثبت نشده است.')}
      </div></section>
      <section class="sec sec--light"><div class="wrap">
        <div class="vband reveal"><div><p class="eyebrow">آپارات</p><h2>ویدیوهای مکتب النور</h2><p class="muted">فیلم جلسات و برنامه‌ها در کانال آپارات ما منتشر می‌شود؛ ویدیوی هر گزارش هم داخل خود گزارش پخش می‌شود.</p></div>
        <a class="btn btn--solid" href="${esc(channelUrl())}" target="_blank" rel="noopener">مشاهده‌ی کانال در آپارات</a></div>
        ${(() => { const v = items.filter((r) => aparatIds(r.videos).length).slice(0, 3); return v.length ? `<div class="vgrid">${v.map((r) => `<div class="vitem reveal">${aparatSlot(aparatIds(r.videos)[0])}<a href="#/reports/${r.id}"><b>${esc(r.title)}</b></a><span class="muted">${esc(courseLabel(r.group_name))}</span></div>`).join('')}</div>` : ''; })()}
      </div></section>`,
    };
  }

  async function courseReportsPage(key) {
    const [items, people] = await Promise.all([API.list('reports'), API.list('people')]);
    if (!isCourse(key)) throw new Error('این دوره وجود ندارد.');
    const list = items.filter((r) => r.group_name === key);
    const m = mentorsOf(people, key);
    return {
      html: `<section class="sec chead" style="--c:${courseColor(key)}"><div class="pattern"></div><div class="wrap rel">
          <div class="crumb"><a href="#/">خانه</a>/<a href="#/reports">گزارش‌ها</a>/<span>${esc(courseLabel(key))}</span></div>
          <p class="eyebrow">گزارش‌های</p><h1>${esc(courseLabel(key))}</h1>
          <p class="cmeta">${m.length ? `مربیان: ${esc(m.join(' و '))}` : ''}${m.length ? ' | ' : ''}${list.length ? `${nf(list.length)} گزارش` : 'هنوز گزارشی ثبت نشده'}</p>
        </div></section>
        <section class="sec sec--light"><div class="wrap">
          <div class="cpills reveal">${courseKeys().map(pill).join('')}</div>
          ${list.length ? `<div class="grid">${list.map(reportCard).join('')}</div>` : empty(`برای ${esc(courseLabel(key))} هنوز گزارشی منتشر نشده است.`)}
        </div></section>`,
    };
  }

  async function reportDetail(id) {
    const r = await API.get('reports', id);
    const imgs = r.images || [];
    const k = r.group_name;
    return {
      html: `<section class="sec chead" style="--c:${courseColor(k)}"><div class="pattern"></div><div class="wrap rel">
          <div class="crumb"><a href="#/">خانه</a>/<a href="#/reports">گزارش‌ها</a>/${isCourse(k) ? `<a href="#/reports/course/${esc(k)}">${esc(courseLabel(k))}</a>` : ''}</div>
          <p class="eyebrow">${esc(courseLabel(k))} · ${fdate(r.event_date || r.created_at)}</p><h1>${esc(r.title)}</h1></div></section>
        <section class="sec sec--light"><div class="wrap">
        <div class="prose reveal">${paras(r.body)}</div>
        ${aparatIds(r.videos).length ? `<div class="videos"><h2 class="vh">ویدیوها</h2>${aparatIds(r.videos).map(aparatSlot).join('')}<p class="vmore"><a class="btn btn--ghost btn--sm" href="${esc(channelUrl())}" target="_blank" rel="noopener">همه‌ی ویدیوها در آپارات</a></p></div>` : ''}
        ${imgs.length ? `<div class="gallery">${imgs.map((u, i) => `<button class="reveal" ${stagger(i)} data-i="${i}" aria-label="نمایش تصویر ${nf(i + 1)}"><img loading="lazy" src="${esc(API.imgUrl(u))}" alt=""></button>`).join('')}</div>` : ''}
        <p style="margin-top:3rem;text-align:center">${link(isCourse(k) ? `/reports/course/${k}` : '/reports', 'btn btn--ghost', `بازگشت به ${esc(courseLabel(k))}`)}</p></div></section>`,
      after: () => $$('.gallery button').forEach((b) => b.addEventListener('click', () => openLightbox(imgs.map(API.imgUrl), Number(b.dataset.i)))),
    };
  }

  /* ---------------------------------------------------------------- */
  /* برنامه‌ها (ده بخش)                                                 */
  /* ---------------------------------------------------------------- */
  async function programsPage() {
    const items = await API.list('programs');
    const tiles = [['', 'همه‌ی برنامه‌ها', items.length], ...PROGRAM_KINDS.map((k) => [k, k, items.filter((p) => p.kind === k).length])];
    return {
      html: pageHead('برنامه‌ها', 'اردوها، مناسبت‌ها و جلسات') + `<section class="sec sec--soft"><div class="wrap" id="list">
        <div class="ptiles">${tiles.map(([k, l, n], i) => `<button class="ptile reveal ${i ? '' : 'on'}" ${stagger(i)} data-f="${esc(k)}"><span class="pl">${esc(l)}</span><span class="pn">${n ? `${nf(n)} برنامه` : 'بدون برنامه'}</span></button>`).join('')}</div>
        <h2 class="ptitle" id="ptitle">همه‌ی برنامه‌ها</h2>
        <div class="plist" id="plist">${items.map(programRow).join('')}</div>
        <div class="empty" id="pempty" hidden>برنامه‌ای در این بخش ثبت نشده است.</div></div></section>`,
      after() {
        const root = $('#list');
        const apply = (f, label) => {
          let shown = 0;
          $$('.prow', root).forEach((r) => { const hide = !!f && r.dataset.g !== f; r.classList.toggle('hide', hide); if (!hide) shown++; });
          $('#pempty').hidden = shown > 0;
          $('#ptitle').textContent = label;
        };
        $$('.ptile', root).forEach((b) => b.addEventListener('click', () => {
          $$('.ptile', root).forEach((x) => x.classList.toggle('on', x === b));
          apply(b.dataset.f, b.dataset.f || 'همه‌ی برنامه‌ها');
        }));
        apply('', 'همه‌ی برنامه‌ها');
      },
    };
  }

  /* ---------------------------------------------------------------- */
  /* افراد (مربیان به تفکیک دوره)                                       */
  /* ---------------------------------------------------------------- */
  async function peoplePage() {
    const items = await API.list('people');
    const keys = courseKeys().filter((k) => k !== 'grad');
    const group = (k, title, list) => `<div class="cgroup reveal" style="--c:${courseColor(k)}">
      <div class="cg-head"><span class="cg-n">${k ? nf(k) : '·'}</span><h2>${title}</h2></div>
      <div class="people">${list.map(personCard).join('')}</div></div>`;
    const groups = keys.map((k) => [k, items.filter((p) => p.course === k)]).filter(([, l]) => l.length)
      .map(([k, l]) => group(k, `مربیان ${esc(courseLabel(k))}`, l)).join('');
    const others = items.filter((p) => !keys.includes(p.course));
    return {
      html: pageHead('افراد', 'مربیان مجموعه به تفکیک دوره') + `<section class="sec sec--light"><div class="pattern"></div><div class="wrap rel">
        ${groups || others.length ? groups + (others.length ? group('', 'سایر همکاران', others) : '') : empty('هنوز فردی معرفی نشده است.')}
      </div></section>`,
    };
  }

  async function newsPage() {
    const items = await API.list('announcements');
    return { html: pageHead('اطلاع‌رسانی', 'اطلاعیه‌ها و خبرها') + `<section class="sec sec--light"><div class="wrap">
      ${items.length ? `<div class="news">${items.map((n, i) => newsItem(n, i === 0)).join('')}</div>` : empty('اطلاعیه‌ای وجود ندارد.')}</div></section>` };
  }

  async function articlesPage() {
    const items = await API.list('articles');
    return {
      html: pageHead('مقاله و مجله', 'محتوای تربیتی و فرهنگی') + `<section class="sec sec--light"><div class="pattern"></div><div class="wrap rel" id="list">
        ${items.length ? chipsFor(items, 'category') + `<div class="grid">${items.map(articleCard).join('')}</div>` : empty('هنوز مقاله‌ای منتشر نشده است.')}</div></section>`,
      after: () => bindFilter($('#list')),
    };
  }
  async function programDetail(id) {
    const p = await API.get('programs', id);
    const vids = aparatIds(p.videos);
    const facts = [['بخش', p.kind], ['روز', p.day], ['ساعت', p.time], ['مکان', p.place], ['استاد / سخنران', p.speaker]].filter((x) => x[1]);
    return {
      html: pageHead(esc(p.title), esc(p.kind || 'برنامه')) +
        `<section class="sec sec--light"><div class="wrap">
        <div class="crumb"><a href="#/">خانه</a>/<a href="#/programs">برنامه‌ها</a>/<span>${esc(cut(p.title, 40))}</span></div>
        ${facts.length ? `<div class="facts reveal" style="margin-bottom:2.4rem">${facts.map(([l, v]) => `<div class="fact"><span class="muted">${l}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
        ${p.images && p.images[0] ? `<div class="detail-hero reveal"><img src="${esc(API.imgUrl(p.images[0]))}" alt="${esc(p.title)}"></div>` : ''}
        ${p.description ? `<div class="prose reveal">${paras(p.description)}</div>` : ''}
        ${vids.length ? `<div class="videos"><h2 class="vh">ویدیو</h2>${vids.map(aparatSlot).join('')}</div>` : ''}
        <p style="margin-top:3rem;text-align:center">${link('/programs', 'btn btn--ghost', 'بازگشت به برنامه‌ها')}</p></div></section>`,
    };
  }

  async function articleDetail(id) {
    const a = await API.get('articles', id);
    return {
      html: pageHead(esc(a.title), [a.category, a.author, fdate(a.created_at)].filter(Boolean).map(esc).join(' · ')) +
        `<section class="sec sec--light"><div class="wrap">
        <div class="crumb"><a href="#/">خانه</a>/<a href="#/articles">مقالات</a>/<span>${esc(cut(a.title, 40))}</span></div>
        ${a.images && a.images[0] ? `<div class="detail-hero reveal"><img src="${esc(API.imgUrl(a.images[0]))}" alt="${esc(a.title)}"></div>` : ''}
        ${a.excerpt ? `<p class="prose muted reveal" style="font-size:1.2rem;margin-bottom:2rem">${esc(a.excerpt)}</p>` : ''}
        <div class="prose reveal">${paras(a.body)}</div>
        <p style="margin-top:3rem;text-align:center">${link('/articles', 'btn btn--ghost', 'بازگشت به مقالات')}</p></div></section>`,
    };
  }

  async function aboutPage() {
    const hist = String(S.about_history || '').split(/\n{2,}/).filter(Boolean);
    const facts = [['تأسیس', S.founded ? fa(S.founded) : ''], ['زمان برگزاری', S.hours], ['مکان', S.address]].filter((x) => x[1]);
    return {
      html: pageHead('درباره‌ی ما', 'مکتب النور و پیشینه‌ی جلسات حفاظ القرآن') + `
      <section class="sec sec--light"><div class="pattern"></div><div class="wrap two rel">
        <div class="reveal"><div class="about-logo">${LOGO_WIDE(120)}</div><p class="eyebrow">معرفی</p><h2 style="font-size:clamp(1.8rem,4vw,2.5rem);margin:.4rem 0 1rem;line-height:1.5">ما که هستیم؟</h2><div class="muted prose" style="margin:0;max-width:none">${paras(S.about_mission)}</div></div>
        <div class="mihrab reveal" style="--d:.15s"><div class="ar">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</div><p class="muted" style="font-size:.85rem">سوره‌ی مزمل، آیه ۴</p><div class="orn">${DIVIDER}</div></div>
      </div></section>
      ${facts.length ? `<section class="sec sec--soft facts-sec"><div class="wrap"><div class="facts">${facts.map(([l, v], i) => `<div class="fact reveal" ${stagger(i)}><span class="muted">${l}</span><b>${esc(v)}</b></div>`).join('')}</div></div></section>` : ''}
      <section class="sec sec--light"><div class="wrap" style="max-width:820px">
        ${secHead('پیشینه', 'جلسات حفاظ القرآن مکتب النور')}
        <div class="timeline">${hist.map((p, i) => `<div class="reveal" ${stagger(i)}><p>${esc(p).replace(/\n/g, '<br>')}</p></div>`).join('') || '<div class="muted">متن پیشینه از بخش مدیریت قابل ویرایش است.</div>'}</div>
      </div></section>
      <section class="sec sec--soft"><div class="wrap">
        ${secHead('ارزش‌ها', 'آنچه دنبال می‌کنیم')}
        <div class="values">${[['انس با قرآن', 'حفظ، تلاوت و تدبر در کتاب خدا'], ['تربیت', 'پرورش اخلاق و رفتار دینی در کودک، نوجوان و خانواده'], ['فرهنگ و آموزش', 'اردو، اعتکاف، ضیافت نور و برنامه‌های فرهنگی']]
          .map(([t, d], i) => `<div class="value reveal" ${stagger(i)}>${STAR(46)}<h3>${t}</h3><p class="muted">${d}</p></div>`).join('')}</div>
        <p style="text-align:center;margin-top:3rem">${link('/contact', 'btn btn--solid', 'تماس با ما')}</p>
      </div></section>`,
    };
  }

  async function contactPage() {
    const item = (icon, t, v, ltr) => v ? `<div class="info-item reveal">${icon}<div><b>${t}</b><div class="muted" ${ltr ? 'dir="ltr" style="text-align:right"' : ''}>${esc(v)}</div></div></div>` : '';
    return {
      html: pageHead('تماس با ما', 'آدرس و زمان برگزاری جلسات') + `<section class="sec sec--light"><div class="pattern"></div><div class="wrap contact-grid rel">
        <div class="info">${item(ICON.pin, 'آدرس', S.address)}${item(ICON.clock, 'زمان برگزاری', S.hours)}${item(ICON.phone, 'تلفن', S.phone, true)}${item(ICON.mail, 'ایمیل', S.email, true)}
          ${/^https:\/\//.test(S.bale || '') ? `<a class="info-item reveal" href="${esc(S.bale)}" target="_blank" rel="noopener noreferrer"><div><b>کانال بله</b><div class="muted">@maktabonoor</div></div></a>` : ''}
          ${S.instagram ? `<div class="info-item reveal"><div><b>اینستاگرام</b><div class="muted" dir="ltr" style="text-align:right">${esc(S.instagram)}</div></div></div>` : ''}
          ${S.telegram ? `<div class="info-item reveal"><div><b>تلگرام</b><div class="muted" dir="ltr" style="text-align:right">${esc(S.telegram)}</div></div></div>` : ''}
          ${/^https:\/\//.test(S.map_url || '') ? `<a class="btn btn--ghost reveal" href="${esc(S.map_url)}" target="_blank" rel="noopener noreferrer">مشاهده روی نقشه</a>` : ''}</div>
        <form class="f reveal" id="cform" novalidate style="--d:.15s">
          <h2 style="font-size:1.6rem">ارسال پیام</h2>
          <div class="field"><label for="cn">نام و نام خانوادگی *</label><input id="cn" name="name" maxlength="120" required autocomplete="name"></div>
          <div class="field"><label for="cp">شماره تماس</label><input id="cp" name="phone" dir="ltr" inputmode="tel" maxlength="40" autocomplete="tel" style="text-align:right"></div>
          <div class="field"><label for="ct">پیام شما *</label><textarea id="ct" name="text" maxlength="4000" required></textarea></div>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div><button class="btn btn--solid" type="submit">ارسال پیام</button></div>
        </form></div></section>`,
      after() {
        $('#cform').addEventListener('submit', async (e) => {
          e.preventDefault();
          const f = e.target, btn = $('button', f);
          const body = Object.fromEntries(new FormData(f));
          if (!body.name.trim() || !body.text.trim()) return toast('نام و متن پیام را وارد کنید.');
          btn.disabled = true;
          try { await API.sendMessage(body); f.reset(); toast('پیام شما ثبت شد. سپاس از شما.'); }
          catch (err) { toast(err.message); }
          btn.disabled = false;
        });
      },
    };
  }

  /* ---------------------------------------------------------------- */
  /* پنل مدیریت                                                        */
  /* ---------------------------------------------------------------- */
  const CATS = ['تربیتی', 'فرهنگی', 'قرآنی', 'خانواده'];
  const courseOpts = (withEmpty) => [...(withEmpty ? [{ v: '', l: 'بدون دوره' }] : []), ...courseKeys().map((k) => ({ v: k, l: courseLabel(k) }))];
  const ADMIN = {
    slides: { label: 'اسلایدر اصلی', one: 'اسلاید', key: 'title', max: 1, needImg: 1, imgLabel: 'عکس منتخب (پیشنهاد: افقی، دست‌کم ۱۶۰۰ پیکسل عرض)', fields: [
      { k: 'title', l: 'عنوان روی عکس', req: 1 }, { k: 'caption', l: 'توضیح کوتاه' }, { k: 'link', l: 'پیوند دکمه (اختیاری؛ مثل /reports/1 یا https://…)' }] },
    reports: { label: 'گزارش‌ها', one: 'گزارش', key: 'title', max: 12, imgLabel: 'تصاویر گزارش (حداکثر ۱۲ تصویر)', fields: [
      { k: 'group_name', l: 'دوره / بخش', t: 'choice', opts: () => courseOpts(false), req: 1 }, { k: 'title', l: 'عنوان گزارش', req: 1 }, { k: 'event_date', l: 'تاریخ برگزاری', t: 'date' }, { k: 'body', l: 'متن گزارش', t: 'textarea', req: 1 }, { k: 'videos', l: 'ویدیوهای آپارات (هر خط یک لینک؛ مثل https://www.aparat.com/v/xxxxx)', t: 'textarea', rows: 3 }] },
    programs: { label: 'برنامه‌ها', one: 'برنامه', key: 'title', max: 0, fields: [
      { k: 'kind', l: 'بخش برنامه', t: 'choice', opts: () => PROGRAM_KINDS.map((x) => ({ v: x, l: x })), req: 1 }, { k: 'title', l: 'عنوان برنامه', req: 1 }, { k: 'speaker', l: 'استاد / سخنران' }, { k: 'day', l: 'روز (مثلاً جمعه‌ها)' }, { k: 'time', l: 'ساعت (مثلاً از ساعت ۸)' }, { k: 'place', l: 'مکان' }, { k: 'description', l: 'توضیح', t: 'textarea' }, { k: 'videos', l: 'ویدیوهای آپارات (هر خط یک لینک)', t: 'textarea', rows: 3 }] },
    people: { label: 'افراد', one: 'فرد', key: 'name', max: 1, imgLabel: 'عکس', fields: [
      { k: 'name', l: 'نام', req: 1 }, { k: 'role', l: 'سمت (مثلاً مربی)' }, { k: 'course', l: 'دوره‌ی مربی', t: 'choice', opts: () => courseOpts(true).filter((o) => o.v !== 'grad') }, { k: 'bio', l: 'معرفی کوتاه', t: 'textarea' }] },
    announcements: { label: 'اطلاع‌رسانی', one: 'اطلاعیه', key: 'title', max: 0, fields: [
      { k: 'title', l: 'عنوان', req: 1 }, { k: 'body', l: 'متن اطلاعیه', t: 'textarea', req: 1 }, { k: 'pinned', l: 'سنجاق در بالای فهرست', t: 'checkbox' }] },
    articles: { label: 'مقالات', one: 'مقاله', key: 'title', max: 1, imgLabel: 'تصویر شاخص', fields: [
      { k: 'title', l: 'عنوان مقاله', req: 1 }, { k: 'category', l: 'دسته‌بندی', t: 'select', opts: CATS }, { k: 'author', l: 'نویسنده' }, { k: 'excerpt', l: 'خلاصه (نمایش در کارت)', t: 'textarea', rows: 2 }, { k: 'body', l: 'متن مقاله', t: 'textarea', req: 1, rows: 12 }] },
  };
  const SETTINGS = [
    ['site_name', 'نام سایت'], ['tagline', 'شعار / توضیح کوتاه'], ['founded', 'سال تأسیس'], ['address', 'آدرس'], ['hours', 'زمان برگزاری'], ['phone', 'شماره تلفن'], ['email', 'ایمیل'],
    ['instagram', 'اینستاگرام'], ['telegram', 'تلگرام'], ['map_url', 'پیوند نقشه (https://…)'],
    ['course_first', 'اولین دوره‌ی نمایش‌داده‌شده (عدد)'], ['course_last', 'آخرین دوره‌ی نمایش‌داده‌شده (عدد)'],
    ['aparat', 'لینک کانال آپارات'], ['bale', 'لینک کانال بله (https://ble.ir/…)'], ['about_mission', 'متن «ما که هستیم»', 'textarea'], ['about_history', 'پیشینه‌ی جلسات حفاظ القرآن (پاراگراف‌ها را با یک خط خالی جدا کنید)', 'textarea'],
  ];
  const subline = (res, it) => {
    if (res === 'reports') return [courseLabel(it.group_name), fdate(it.event_date || it.created_at)].filter(Boolean).join(' · ');
    if (res === 'people') return [it.role, it.course ? courseLabel(it.course) : ''].filter(Boolean).join(' · ');
    if (res === 'programs') return it.kind || '';
    return fdate(it.event_date || it.created_at);
  };

  async function adminPage() {
    const isAdmin = await API.me().catch(() => false);
    const demoNote = API.mode === 'demo' ? '<p class="muted" style="font-size:.85rem">حالت نمایشی: هر رمزی پذیرفته می‌شود و داده‌ها فقط در همین مرورگر ذخیره می‌شوند.</p>' : '';
    return {
      html: `<section class="sec sec--light page-head" style="padding-bottom:2rem"><div class="pattern"></div><div class="wrap rel"><p class="eyebrow">مدیریت</p><h1 style="font-size:clamp(1.8rem,5vw,3rem)">پنل مدیریت محتوا</h1></div></section>
      <section class="admin"><div class="wrap" id="admin-root"></div></section>`,
      after: () => (isAdmin ? adminShell() : adminLogin(demoNote)),
    };
  }

  function adminLogin(note) {
    const root = $('#admin-root');
    root.innerHTML = `<form class="login" id="lf"><h2>ورود مدیر</h2>${note}
      <div class="field" style="text-align:start"><label for="pw">رمز عبور</label><input id="pw" type="password" autocomplete="current-password" required></div>
      <div id="le"></div><button class="btn btn--solid" style="--fg:#0a0a0a;--bg:#fff" type="submit">ورود</button></form>`;
    $('#pw').focus();
    $('#lf').onsubmit = async (e) => {
      e.preventDefault();
      try { await API.login($('#pw').value); adminShell(); }
      catch (err) { $('#le').innerHTML = `<div class="err">${esc(err.message)}</div>`; }
    };
  }

  function adminShell(tab = 'reports') {
    const root = $('#admin-root');
    const tabs = [...Object.entries(ADMIN).map(([k, v]) => [k, v.label]), ['messages', 'پیام‌ها'], ['settings', 'تنظیمات سایت']];
    root.innerHTML = `<div class="tabs">${tabs.map(([k, l]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}
      <button class="out" id="logout">خروج</button></div><div id="pane"></div>`;
    $$('.tabs [data-t]').forEach((b) => (b.onclick = () => adminShell(b.dataset.t)));
    $('#logout').onclick = async () => { await API.logout(); adminLogin(''); };
    if (tab === 'messages') return adminMessages();
    if (tab === 'settings') return adminSettings();
    return adminList(tab);
  }

  async function adminList(res) {
    const cfg = ADMIN[res], pane = $('#pane');
    pane.innerHTML = skeleton(1);
    let items;
    try { items = await API.list(res); } catch (e) { pane.innerHTML = failed(e); return; }
    pane.innerHTML = `<div class="admin-bar"><h2>${cfg.label} <span class="muted" style="font-size:1rem">(${nf(items.length)})</span></h2><button class="btn btn--solid btn--sm" style="--fg:#0a0a0a;--bg:#fff" id="add">+ ${cfg.one} جدید</button></div>
      ${items.length ? `<div class="rows">${items.map((it) => `<div class="row">${it.images && it.images[0] ? `<img src="${esc(API.imgUrl(it.images[0]))}" alt="">` : ''}
        <div class="t"><b>${esc(it[cfg.key])}</b><span class="muted" style="font-size:.8rem">${esc(subline(res, it))}</span></div>
        <div class="act"><button class="btn btn--ghost btn--sm" style="--fg:#0a0a0a;--bg:#fff" data-e="${it.id}">ویرایش</button><button class="btn btn--ghost btn--sm" style="--fg:#0a0a0a;--bg:#fff" data-d="${it.id}">حذف</button></div></div>`).join('')}</div>` : empty('هنوز موردی ثبت نشده است.')}`;
    $('#add').onclick = () => adminForm(res, null);
    $$('[data-e]', pane).forEach((b) => (b.onclick = () => adminForm(res, items.find((x) => x.id == b.dataset.e))));
    $$('[data-d]', pane).forEach((b) => (b.onclick = async () => {
      if (!confirm('این مورد برای همیشه حذف شود؟')) return;
      try { await API.remove(res, b.dataset.d); toast('حذف شد.'); adminList(res); } catch (e) { toast(e.message); }
    }));
  }

  function adminForm(res, item) {
    const cfg = ADMIN[res], pane = $('#pane');
    let keep = item ? [...(item.images || [])] : [];
    let added = []; // فایل‌های جدید
    const fieldHtml = (f) => {
      const v = item ? item[f.k] ?? '' : '';
      if (f.t === 'textarea') return `<div class="field"><label for="f_${f.k}">${f.l}${f.req ? ' *' : ''}</label><textarea id="f_${f.k}" name="${f.k}" ${f.req ? 'required' : ''} style="min-height:${(f.rows || 6) * 28}px">${esc(v)}</textarea></div>`;
      if (f.t === 'choice') {
        const opts = f.opts();
        const extra = v && !opts.some((o) => o.v === v) ? [{ v, l: v }] : [];
        return `<div class="field"><label for="f_${f.k}">${f.l}${f.req ? ' *' : ''}</label><select id="f_${f.k}" name="${f.k}">${f.req ? '<option value="">— انتخاب کنید —</option>' : ''}${[...opts, ...extra].map((o) => `<option value="${esc(o.v)}" ${o.v === v ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select></div>`;
      }
      if (f.t === 'select') return `<div class="field"><label for="f_${f.k}">${f.l}</label><input id="f_${f.k}" name="${f.k}" list="dl_${f.k}" value="${esc(v)}"><datalist id="dl_${f.k}">${f.opts.map((o) => `<option value="${o}">`).join('')}</datalist></div>`;
      if (f.t === 'checkbox') return `<label class="check"><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''}> ${f.l}</label>`;
      return `<div class="field"><label for="f_${f.k}">${f.l}${f.req ? ' *' : ''}</label><input id="f_${f.k}" name="${f.k}" type="${f.t || 'text'}" value="${esc(v)}" ${f.req ? 'required' : ''}></div>`;
    };
    pane.innerHTML = `<div class="admin-bar"><h2>${item ? 'ویرایش' : 'افزودن'} ${cfg.one}</h2><button class="btn btn--ghost btn--sm" style="--fg:#0a0a0a;--bg:#fff" id="back">بازگشت</button></div>
      <form class="admin-form" id="af" novalidate>${cfg.fields.map(fieldHtml).join('')}
      ${cfg.max ? `<div class="field"><label>${cfg.imgLabel}</label><div class="uploads" id="ups"></div>
        <input type="file" id="file" accept="image/jpeg,image/png,image/webp" ${cfg.max > 1 ? 'multiple' : ''}><span class="muted" style="font-size:.8rem">JPG، PNG یا WebP؛ حداکثر ۵ مگابایت برای هر تصویر.</span></div>` : ''}
      <div id="fe"></div><div><button class="btn btn--solid" style="--fg:#0a0a0a;--bg:#fff" type="submit">ذخیره</button></div></form>`;
    $('#back').onclick = () => adminList(res);

    const paint = () => {
      const ups = $('#ups'); if (!ups) return;
      ups.innerHTML = keep.map((n, i) => `<div class="up"><img src="${esc(API.imgUrl(n))}" alt=""><button type="button" data-k="${i}" aria-label="حذف تصویر">×</button></div>`).join('') +
        added.map((f, i) => `<div class="up"><img src="${URL.createObjectURL(f)}" alt=""><button type="button" data-a="${i}" aria-label="حذف تصویر">×</button></div>`).join('');
      $$('[data-k]', ups).forEach((b) => (b.onclick = () => { keep.splice(b.dataset.k, 1); paint(); }));
      $$('[data-a]', ups).forEach((b) => (b.onclick = () => { added.splice(b.dataset.a, 1); paint(); }));
    };
    paint();
    const file = $('#file');
    if (file) file.onchange = () => {
      for (const f of file.files) {
        if (f.size > 5 * 1024 * 1024) { toast('حجم هر تصویر حداکثر ۵ مگابایت است.'); continue; }
        added.push(f);
      }
      file.value = '';
      if (cfg.max === 1) { added = added.slice(-1); keep = []; } // تک‌تصویر: جایگزینی
      else if (keep.length + added.length > cfg.max) { added = added.slice(0, cfg.max - keep.length); toast(`حداکثر ${nf(cfg.max)} تصویر مجاز است.`); }
      paint();
    };

    $('#af').onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target, fd = new FormData();
      const missing = cfg.fields.filter((f) => f.req && !form[f.k].value.trim());
      if (cfg.needImg && !keep.length && !added.length) { $('#fe').innerHTML = '<div class="err">یک عکس انتخاب کنید.</div>'; return; }
      if (missing.length) { $('#fe').innerHTML = `<div class="err">فیلد الزامی را پر کنید: ${missing.map((m) => m.l).join('، ')}</div>`; return; }
      cfg.fields.forEach((f) => fd.append(f.k, f.t === 'checkbox' ? (form[f.k].checked ? '1' : '0') : form[f.k].value));
      if (cfg.max) { fd.append('keep_images', JSON.stringify(keep)); added.forEach((f) => fd.append('images', f)); }
      const btn = $('button[type=submit]', form); btn.disabled = true;
      try { await API.save(res, item ? item.id : null, fd); toast('ذخیره شد.'); adminList(res); }
      catch (err) { $('#fe').innerHTML = `<div class="err">${esc(err.message)}</div>`; btn.disabled = false; }
    };
  }

  async function adminMessages() {
    const pane = $('#pane');
    try {
      const items = await API.messages();
      pane.innerHTML = `<div class="admin-bar"><h2>پیام‌های دریافتی <span class="muted" style="font-size:1rem">(${nf(items.length)})</span></h2></div>
        ${items.length ? `<div class="rows">${items.map((m) => `<div class="row" style="align-items:start"><div class="t" style="white-space:normal"><b style="white-space:normal">${esc(m.name)} <span class="muted" dir="ltr" style="font-weight:400">${esc(m.phone)}</span></b>
          <p style="margin:.3rem 0">${esc(m.text)}</p><span class="muted" style="font-size:.8rem">${fdate(m.created_at)}</span></div>
          <button class="btn btn--ghost btn--sm" style="--fg:#0a0a0a;--bg:#fff" data-d="${m.id}">حذف</button></div>`).join('')}</div>` : empty('پیامی دریافت نشده است.')}`;
      $$('[data-d]', pane).forEach((b) => (b.onclick = async () => {
        if (!confirm('پیام حذف شود؟')) return;
        await API.removeMessage(b.dataset.d); adminMessages();
      }));
    } catch (e) { pane.innerHTML = failed(e); }
  }

  async function adminSettings() {
    const pane = $('#pane'); const cur = await API.settings();
    pane.innerHTML = `<div class="admin-bar"><h2>تنظیمات سایت</h2></div><form class="admin-form" id="sf">
      ${SETTINGS.map(([k, l, t]) => `<div class="field"><label for="s_${k}">${l}</label>${t === 'textarea' ? `<textarea id="s_${k}" name="${k}" style="min-height:170px">${esc(cur[k] || '')}</textarea>` : `<input id="s_${k}" name="${k}" value="${esc(cur[k] || '')}">`}</div>`).join('')}
      <div id="fe"></div><div><button class="btn btn--solid" style="--fg:#0a0a0a;--bg:#fff" type="submit">ذخیره‌ی تنظیمات</button>
      ${API.mode === 'demo' ? ' <button class="btn btn--ghost" style="--fg:#0a0a0a;--bg:#fff" type="button" id="reset">بازنشانی داده‌های نمایشی</button>' : ''}</div></form>`;
    $('#sf').onsubmit = async (e) => {
      e.preventDefault();
      try { await API.saveSettings(Object.fromEntries(new FormData(e.target))); S = await API.settings(); renderChrome(); markNav(); toast('تنظیمات ذخیره شد.'); }
      catch (err) { $('#fe').innerHTML = `<div class="err">${esc(err.message)}</div>`; }
    };
    $('#reset')?.addEventListener('click', () => confirm('همه‌ی تغییرات نمایشی پاک شود؟') && API.resetDemo());
  }

  /* ---------------------------------------------------------------- */
  /* لایت‌باکس                                                         */
  /* ---------------------------------------------------------------- */
  let lb = { list: [], i: 0 };
  function openLightbox(list, i) {
    lb = { list, i };
    const el = $('#lightbox');
    el.innerHTML = `<button class="x" aria-label="بستن">×</button><button class="p" aria-label="بعدی" style="margin-top:-26px">›</button><button class="n" aria-label="قبلی" style="margin-top:-26px">‹</button><img alt="">`;
    el.classList.add('on'); showLb();
    $('.x', el).onclick = closeLb; $('.p', el).onclick = () => stepLb(1); $('.n', el).onclick = () => stepLb(-1);
    el.onclick = (e) => { if (e.target === el) closeLb(); };
  }
  const showLb = () => { $('#lightbox img').src = lb.list[lb.i]; };
  const stepLb = (d) => { lb.i = (lb.i + d + lb.list.length) % lb.list.length; showLb(); };
  const closeLb = () => $('#lightbox').classList.remove('on');
  document.addEventListener('keydown', (e) => {
    if (!$('#lightbox').classList.contains('on')) return;
    if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') stepLb(1); if (e.key === 'ArrowRight') stepLb(-1);
  });

  /* ---------------------------------------------------------------- */
  /* مسیریابی و انیمیشن ظاهرشدن                                         */
  /* ---------------------------------------------------------------- */
  const ROUTES = [
    [/^\/$/, home], [/^\/reports$/, reportsPage], [/^\/reports\/course\/([\w-]+)$/, courseReportsPage], [/^\/reports\/(\d+)$/, reportDetail], [/^\/programs$/, programsPage], [/^\/programs\/(\d+)$/, programDetail],
    [/^\/people$/, peoplePage], [/^\/news$/, newsPage], [/^\/articles$/, articlesPage], [/^\/articles\/(\d+)$/, articleDetail],
    [/^\/about$/, aboutPage], [/^\/contact$/, contactPage], [/^\/admin$/, adminPage],
  ];
  const TITLES = { '/reports': 'گزارش‌ها', '/programs': 'برنامه‌ها', '/people': 'افراد', '/news': 'اطلاع‌رسانی', '/articles': 'مقالات', '/about': 'درباره‌ی ما', '/contact': 'تماس با ما', '/admin': 'مدیریت' };

  let io;
  function observe() {
    io?.disconnect();
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e) => io.observe(e));
  }
  function markNav() {
    const path = location.hash.slice(1) || '/';
    $$('.menu a').forEach((a) => a.classList.toggle('active', a.dataset.nav === '/' ? path === '/' : path.startsWith(a.dataset.nav)));
  }

  let token = 0;
  async function render() {
    const my = ++token;
    timers.forEach(clearInterval); timers = [];
    closeLb(); toggleMenu(false);
    const path = ('/' + (location.hash.slice(1) || '/')).replace(/^\/+/, '/').replace(/(.)\/$/, '$1');
    const app = $('#app');
    const hit = ROUTES.map(([re, fn]) => [path.match(re), fn]).find(([m]) => m);
    markNav();
    const base = path.match(/^\/[^/]*/)[0];
    document.title = `${TITLES[base] ? TITLES[base] + ' | ' : ''}${S.site_name || 'مکتب النور'}`;
    window.scrollTo(0, 0);
    if (!hit) {
      app.innerHTML = pageHead('۴۰۴', 'صفحه پیدا نشد') + `<section class="sec sec--light"><div class="wrap" style="text-align:center">${link('/', 'btn btn--solid', 'بازگشت به خانه')}</div></section>`;
      return observe();
    }
    app.innerHTML = `<div style="min-height:60vh;padding-top:6rem" class="wrap">${skeleton(3)}</div>`;
    try {
      const out = await hit[1](...hit[0].slice(1));
      if (my !== token) return;
      const { html, after } = typeof out === 'string' ? { html: out } : out;
      app.innerHTML = `<div class="page-enter">${html}</div>`;
      after?.();
      mountAparat(app);
    } catch (e) {
      if (my !== token) return;
      app.innerHTML = pageHead('خطا', 'مشکلی پیش آمد') + `<section class="sec sec--light"><div class="wrap">${failed(e)}</div></section>`;
    }
    observe();
  }

  /* ---------------------------------------------------------------- */
  /* راه‌اندازی                                                         */
  /* ---------------------------------------------------------------- */
  async function boot() {
    await API.init();
    try { S = await API.settings(); } catch { S = {}; }
    renderChrome();
    if (API.mode === 'demo') {
      const r = document.createElement('div');
      r.className = 'ribbon'; r.innerHTML = '<span>پیش‌نمایش نمایشی؛ داده‌ها فقط در همین مرورگر ذخیره می‌شوند.</span><button type="button">بستن</button>';
      $('button', r).onclick = () => r.remove(); document.body.appendChild(r);
    }
    addEventListener('hashchange', render);
    addEventListener('scroll', () => $('#header').classList.toggle('scrolled', scrollY > 24), { passive: true });
    await render();
    setTimeout(() => $('#loader')?.classList.add('done'), 350);
  }
  boot();
})();

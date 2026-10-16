/* نقش اسلیمی، لوگوی مجموعه و آیات */
(function () {
  /* در پیش‌نمایش تک‌فایلی تگ html در اختیار ما نیست؛ جهت و زبان را اینجا تنظیم می‌کنیم */
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'fa');
  const TAU = Math.PI * 2;
  const rad = (d) => (d * Math.PI) / 180;
  const f = (n) => Math.round(n * 10) / 10;

  /**
   * گردش اسلیمی: ساقه‌ای که اول کمی به بیرون می‌خمد و بعد انحنایش زیاد می‌شود و به مارپیچ می‌رسد.
   * مختصات صفحه (y رو به پایین)؛ زاویه‌ی بیشتر یعنی چرخش ساعت‌گرد.
   */
  function curl({ x, y, phi, L, k0, k1, p = 3, dir, n = 120 }) {
    const ds = L / n;
    const kappa = (s) => k0 + (k1 - k0) * Math.pow(s / L, p);
    const pts = [{ x, y, th: phi }];
    let px = x, py = y, th = phi;
    for (let i = 1; i <= n; i++) {
      const mid = th + dir * kappa((i - 0.5) * ds) * ds * 0.5;
      px += Math.cos(mid) * ds;
      py += Math.sin(mid) * ds;
      th += dir * kappa((i - 0.5) * ds) * ds;
      pts.push({ x: px, y: py, th });
    }
    return pts;
  }

  /** برگ بادامی از نقطه‌ی (px,py) در جهت ang */
  function leaf(px, py, ang, len, wid) {
    const tx = px + Math.cos(ang) * len, ty = py + Math.sin(ang) * len;
    const mx = (px + tx) / 2, my = (py + ty) / 2;
    const nx = -Math.sin(ang) * wid, ny = Math.cos(ang) * wid;
    return {
      d: `M${f(px)} ${f(py)}Q${f(mx + nx)} ${f(my + ny)} ${f(tx)} ${f(ty)}Q${f(mx - nx)} ${f(my - ny)} ${f(px)} ${f(py)}Z`,
      pts: [[tx, ty], [mx + nx / 2, my + ny / 2], [mx - nx / 2, my - ny / 2]],
    };
  }

  /** یک «واحد» اسلیمی متقارن: دو گردش، برگ‌های کناری و برگ میانی */
  function buildUnit() {
    let d = '';
    const all = [];
    for (const dir of [1, -1]) {
      const pts = curl({ x: 0, y: 46, phi: dir === 1 ? rad(246) : rad(294), L: 175, k0: -0.02, k1: 0.27, p: 2.4, dir });
      d += 'M' + pts.map((p) => `${f(p.x)} ${f(p.y)}`).join('L');
      pts.forEach((p) => all.push([p.x, p.y]));
      for (const [t, len, wid, side] of [[0.12, 34, 17, 1], [0.28, 30, 15, 1], [0.44, 24, 12, 1], [0.58, 18, 9, 1], [0.2, 22, 11, -1]]) {
        const p = pts[Math.round(t * (pts.length - 1))];
        const lf = leaf(p.x, p.y, p.th - dir * side * rad(66), len, wid);
        d += lf.d;
        lf.pts.forEach((q) => all.push(q));
      }
      const e = pts[pts.length - 1];
      const bud = leaf(e.x, e.y, e.th, 12, 7);
      d += bud.d;
    }
    const mid = leaf(0, 44, rad(-90), 104, 24);
    d += mid.d + 'M0 44V-44M0 44V74';
    mid.pts.forEach((q) => all.push(q));
    all.push([0, 74]);
    const xs = all.map((q) => q[0]), ys = all.map((q) => q[1]);
    const pad = 3;
    const box = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
    return { d, box };
  }
  const U = buildUnit();

  /** نقش پس‌زمینه‌ی تکرارشونده (نیم‌پله) به‌صورت CSS url() */
  function pattern(stroke, opacity, W = 230, H = 250) {
    const uses = [[W / 2, H / 2], [0, 0], [W, 0], [0, H], [W, H]]
      .map(([x, y]) => `<use href="#u" transform="translate(${x} ${y})"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><path id="u" d="${U.d}"/></defs><g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${uses}</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  /** نشان اسلیمی کوچک (برای جداکننده‌ها، جای خالی عکس و ...) */
  const unitSvg = (size = 48, cls = '') => {
    const [x, y, w, h] = U.box;
    const hh = Math.round((size * h) / w);
    return `<svg class="orn-ic ${cls}" width="${size}" height="${hh}" viewBox="${f(x)} ${f(y)} ${f(w)} ${f(h)}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="${U.d}"/></svg>`;
  };

  /* لوگوهای مجموعه (PNG سیاه روی شفاف؛ روی زمینه‌ی تیره با کلاس inv سفید می‌شوند) */
  const MARK = 'img/logo-mark.png';
  const WIDE = 'img/logo-wide.png';
  const LOGO = (h = 36, cls = '') => `<img class="logo ${cls}" src="${MARK}" alt="" style="height:${h}px;width:auto">`;
  const LOGO_WIDE = (h = 90, cls = '') => `<img class="logo-wide ${cls}" src="${WIDE}" alt="جلسات حفاظ القرآن مکتب النور" style="height:${h}px;width:auto;max-width:100%">`;

  const DIVIDER = `<span class="line"></span>${unitSvg(30)}<span class="line"></span>`;

  /* آیات منتخب */
  const VERSES = [
    { t: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', r: 'سوره‌ی نور، آیه ۳۵' },
    { t: 'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ', r: 'سوره‌ی حجر، آیه ۹' },
    { t: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا', r: 'سوره‌ی مزمل، آیه ۴' },
    { t: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', r: 'سوره‌ی علق، آیه ۱' },
    { t: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ', r: 'سوره‌ی قمر، آیه ۱۷' },
    { t: 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ', r: 'سوره‌ی اسراء، آیه ۹' },
  ];

  /* نقش پس‌زمینه برای بخش‌های سفید و تیره */
  const st = document.documentElement.style;
  st.setProperty('--pat-dark', pattern('#ffffff', 0.09));
  st.setProperty('--pat-light', pattern('#0c0c0c', 0.07));

  window.ORN = {
    STAR: unitSvg, ROSETTE: unitSvg, BOOK: unitSvg, unitSvg, pattern,
    LOGO, LOGO_WIDE, DIVIDER, VERSES, BISMILLAH: 'بِسْمِ اللَّهِ النُّورِ',
  };
})();

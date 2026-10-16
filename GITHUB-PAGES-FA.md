# انتشار روی GitHub Pages (آدرس amiralichalabi.github.io/maktabonoor)

GitHub Pages فقط فایل‌های ایستا را نشان می‌دهد و سرور (Node) اجرا نمی‌کند. پس این نسخه «ایستا» است:
- همه‌ی بخش‌ها، عکس‌ها، ویدیوهای آپارات، دوره‌ها و برنامه‌ها کار می‌کنند.
- محتوا از فایل `public/data/seed.json` خوانده می‌شود (تغییر محتوا = ویرایش این فایل و commit).
- پنل مدیریت و فرم «ارسال پیام» روی این نسخه کار نمی‌کنند (بک‌اند ندارد) و پنهان‌اند.
- برای پنل مدیریت و آپلود از مرورگر، باید سایت روی سرور اجرا شود (راهنما: `DEPLOY-FA.md`).

## مراحل
1. پوشه‌ی `docs/` همان سایت است (با `npm run build:pages` از `public/` ساخته می‌شود). بعد از هر تغییر در `public/` این دستور را بزنید و commit کنید.
2. در GitHub: مخزن ← **Settings ← Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** و پوشه‌ی **/docs** ← Save
5. بعد از ۱ تا ۲ دقیقه سایت روی `https://amiralichalabi.github.io/maktabonoor/` بالا می‌آید.

دلیل اینکه قبلاً README نمایش داده می‌شد: پوشه‌ی /(root) فایل `index.html` نداشت. سایت داخل `public/` بود و Pages فقط ریشه یا `/docs` را می‌پذیرد.

## افزودن گزارش/ویدیو/عکس
- عکس را در `public/img/samples/` بگذارید (یا پوشه‌ی دلخواه زیر `public/img/`).
- در `public/data/seed.json` گزارش یا برنامه را اضافه کنید: `"images": ["img/samples/x.jpg"]` و `"videos": "https://www.aparat.com/v/xxxxx"`.
- `npm run build:pages` را اجرا کنید و commit/push کنید.

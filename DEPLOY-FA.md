# راهنمای راه‌اندازی سایت مکتب النور روی سرور (Ubuntu 22.04/24.04)

## قبل از شروع
- یک **VPS** با Ubuntu (۱ گیگ رم و ۲۰ گیگ دیسک کافی است)، ترجیحاً از شرکت‌های ایرانی.
- یک **دامنه** (مثل `maktabonoor.ir` از nic.ir یا نمایندگی‌های ثبت دامنه).
- فایل `maktabonoor.zip` و دسترسی SSH به سرور (آدرس IP، نام کاربری root و رمز را شرکت سرور می‌دهد).

در ویندوز برای SSH از PowerShell یا برنامه‌ی PuTTY استفاده کنید: `ssh root@IP-سرور`

## ۱) نصب برنامه‌ها
```bash
apt update && apt install -y curl unzip nginx ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
node -v     # باید 22.5 یا بالاتر باشد
```
اگر دانلود از NodeSource روی سرور ایرانی باز نشد، از مخزن/میرور شرکت سرور استفاده کنید یا از آن‌ها بخواهید Node 22 نصب کنند.

## ۲) گذاشتن سایت روی سرور
از کامپیوتر خودتان زیپ را بفرستید (ویندوز: `scp maktabonoor.zip root@IP:/root/`)، سپس روی سرور:
```bash
mkdir -p /var/www && cd /var/www
unzip /root/maktabonoor.zip
cd maktabonoor
npm install --omit=dev
```

## ۳) اجرا با رمز مدیر
```bash
export ADMIN_PASSWORD='یک-رمز-قوی-و-طولانی'
NODE_ENV=production PORT=3000 pm2 start server/index.js --name maktabonoor --update-env
pm2 save && pm2 startup     # دستوری که چاپ می‌کند را کپی و اجرا کنید تا بعد از ریبوت هم بالا بیاید
```
رمز را جایی امن یادداشت کنید. ورود به پنل: `https://دامنه-شما/#/admin`

## ۴) nginx (پیشخوان)
فایل `/etc/nginx/sites-available/maktabonoor`:
```nginx
server {
  listen 80;
  server_name maktabonoor.ir www.maktabonoor.ir;
  client_max_body_size 60m;          # برای آپلود چند عکس با هم
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
ln -s /etc/nginx/sites-available/maktabonoor /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

## ۵) وصل کردن دامنه
در پنل DNS دامنه دو رکورد بسازید:

| نوع | نام | مقدار |
|---|---|---|
| A | @ | IP سرور |
| A | www | IP سرور |

بعد از چند دقیقه تا چند ساعت دامنه باز می‌شود.

## ۶) HTTPS (رایگان)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d maktabonoor.ir -d www.maktabonoor.ir
```
HTTPS برای ورود امن به پنل مدیریت لازم است (کوکی ورود در حالت production فقط روی HTTPS کار می‌کند).
اگر Let's Encrypt از سرور ایرانی در دسترس نبود، شرکت سرور معمولاً گواهی SSL می‌دهد.

## ۷) بعد از راه‌اندازی
1. وارد پنل مدیریت شوید، ← تنظیمات: تلفن، شهر/آدرس کامل، لینک بله و آپارات را کامل کنید.
2. عکس‌ها و گزارش‌های واقعی را اضافه کنید؛ محتوای نمونه را پاک کنید.
3. ویدیوها را در آپارات بگذارید و لینکشان را در فیلد «ویدیوهای آپارات» بچسبانید.

## ۸) پشتیبان‌گیری (مهم)
همه‌ی گزارش‌ها و عکس‌های آپلودشده داخل پوشه‌ی `data/` است. هفته‌ای یک بار از آن کپی بگیرید:
```bash
cd /var/www/maktabonoor && tar czf ~/backup-$(date +%F).tar.gz data
```
(با `scp` فایل را به کامپیوترتان بیاورید.)

## ۹) به‌روزرسانی سایت
```bash
cd /var/www && cp -r maktabonoor/data /root/data-backup
unzip -o /root/maktabonoor-new.zip      # پوشه‌ی data بالا دست‌نخورده می‌ماند چون در زیپ نیست
cd maktabonoor && npm install --omit=dev && pm2 restart maktabonoor
```

## عیب‌یابی
- `pm2 logs maktabonoor` خطاهای برنامه را نشان می‌دهد.
- نمی‌توانید وارد پنل شوید؟ مطمئن شوید با `https://` باز کرده‌اید.
- ویدیوی آپارات پخش نمی‌شود؟ در آپارات ویدیو باید عمومی باشد و نمایش در سایت‌های دیگر مجاز.

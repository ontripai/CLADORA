# گزارش ادغام Database Blueprint با مخزن CLADORA

## نتیجه

پوشه کامل `supabase/` بدون تغییر مسیرها و صفحات سایت موجود به مخزن افزوده شد. تنظیمات Vercel فعلی تحت تأثیر این مرحله قرار نمی‌گیرد، زیرا هیچ Root Directory یا تنظیم deployment تغییر نکرده است.

## فایل‌های اضافه‌شده

- `supabase/config.toml`
- ۲۱ migration از `000` تا `020`
- ۱۰ فایل تست pgTAP شامل ۲۳۰ assertion
- `supabase/seed.sql`
- `.github/workflows/database-tests.yml`
- `.env.example`
- `scripts/check-database-package.mjs`
- مستندات Runtime و ساختار مخزن

## فایل‌های اصلاح‌شده

- `package.json`: فرمان‌های کنترل ایستا، Local Supabase، Reset، Test و تولید Types
- `README.md`: معرفی Database Foundation و مسیر اجرای آن

## شواهد کنترل فعلی

- Database static contract: موفق
- تعداد migration: ۲۱
- تعداد فایل تست: ۱۰
- تعداد assertion: ۲۳۰
- تست واحد موجود سایت: ۲۸ موفق، صفر ناموفق
- سلامت نحوی اسکریپت کنترل ایستا: موفق
- تست واقعی PostgreSQL/Supabase: در انتظار Docker/Supabase Project
- ممیزی Rendered i18n: نیازمند اجرای سایت یا Preview؛ در محیط بدون سرور با Network failure متوقف شد

## مواردی که عمداً انجام نشد

- هیچ schemaای به Supabase Remote ارسال نشد.
- هیچ Secret یا کلید واقعی نوشته نشد.
- هیچ پروژه جدیدی در Vercel ایجاد نشد.
- Root Directory پروژه فعلی Vercel تغییر نکرد.
- ساختار مخزن هنوز به Monorepo تبدیل نشد تا سایت موجود بدون ضرورت در معرض ریسک deployment قرار نگیرد.

## Gate بعدی

پس از ایجاد پروژه Supabase با نام `CLADORA`، ابتدا CI روی یک branch اجرا شود. اتصال Remote و `db push` فقط پس از موفقیت تمام ۲۳۰ assertion انجام شود.

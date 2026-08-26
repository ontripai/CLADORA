# راهنمای اجرای واقعی پایگاه‌داده CLADORA

وضعیت این سند: آماده اجرا پس از ایجاد پروژه Supabase با نام `CLADORA` در سازمان `ontripai`.

## پیش‌نیاز محلی

- Docker Desktop فعال
- Supabase CLI نسخه `2.84.2`
- Node.js 20 یا بالاتر
- مخزن CLADORA روی یک branch مستقل و تمیز

## Gate 1 — کنترل ایستا

```bash
npm run test:db:static
```

خروجی مورد انتظار: ۲۱ migration، ۱۰ فایل pgTAP و ۲۳۰ assertion.

## Gate 2 — اجرای Local

```bash
supabase start
supabase db reset
supabase test db
```

قبولی فقط زمانی اعلام می‌شود که تمام migrationها و هر ۲۳۰ assertion بدون خطا اجرا شوند.

## Gate 3 — تولید TypeScript Types

```bash
mkdir -p src/types
npm run db:types > src/types/database.generated.ts
```

فایل تولیدشده باید commit شود و هر تغییر schema در CI با آن هم‌راستا بماند.

## Gate 4 — اتصال Remote

متغیرهای لازم فقط در محیط امن محلی یا GitHub Secrets نگهداری شوند:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --dry-run
supabase db push
```

ابتدا Preview/Staging و فقط پس از تأیید شواهد، Production اجرا شود.

## Gate 5 — متغیرهای Vercel

- Browser: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server only: `SUPABASE_SERVICE_ROLE_KEY`

Service Role هرگز نباید با پیشوند `NEXT_PUBLIC_` تعریف یا در مرورگر استفاده شود.

## معیار خروج

- اجرای موفق migrations `000–020`
- موفقیت ۲۳۰ assertion
- تولید Types بدون اختلاف
- عدم وجود داده واقعی در Local/CI/Preview
- ثبت SHA مربوط به commit و خروجی CI
- اجرای تست جداسازی حداقل دو tenant پیش از Production

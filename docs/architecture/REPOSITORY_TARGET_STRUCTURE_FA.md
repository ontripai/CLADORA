# ساختار هدف مخزن CLADORA

در وضعیت فعلی، سایت بازاریابی و زیرساخت پایگاه‌داده در همان مخزن نگهداری می‌شوند. این انتخاب اتصال GitHub، Vercel و Supabase را ساده و تاریخچه تصمیمات را یکپارچه نگه می‌دارد.

```text
CLADORA/
├── src/                      # سایت فعلی و سپس لایه Web App
├── public/
├── supabase/
│   ├── config.toml
│   ├── migrations/           # 000–020
│   ├── tests/                # 230 pgTAP assertions
│   └── seed.sql
├── scripts/
├── docs/
└── .github/workflows/
```

## Vercel

- پروژه فعلی `cladora-wzow`: سایت عمومی CLADORA
- پروژه آینده `cladora-app`: اپلیکیشن احراز هویت‌شده
- هر دو می‌توانند به همین مخزن GitHub متصل باشند.
- تا پیش از جداسازی واقعی `apps/marketing` و `apps/platform`، Root Directory هر دو پروژه نباید تغییر داده شود.

## Supabase

- یک پروژه اولیه با نام `CLADORA` در Organization `ontripai`
- Local و CI فقط با داده مصنوعی
- Remote Production فقط از طریق migrationهای commit‌شده
- تغییر مستقیم schema در Dashboard ممنوع، مگر بازیابی اضطراری و همراه با migration جبرانی

## مرحله Monorepo

انتقال به `apps/marketing` و `apps/platform` زمانی انجام شود که اولین vertical slice اپلیکیشن آماده ساخت باشد. انجام زودهنگام آن، بدون وجود کد اپلیکیشن، فقط ریسک deployment سایت موجود را افزایش می‌دهد.

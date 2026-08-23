import React from 'react';
import type { Metadata } from 'next';
import { Inter, Manrope, Vazirmatn } from 'next/font/google';
import { Language, SUPPORTED_LOCALES, getLocaleConfig, getIntlLocale } from '@/types';
import { AppOrMarketingLayout } from '@/components/layout/AppOrMarketingLayout';
import { getSiteUrl } from '@/config/site';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: true,
});

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['700', '800'],
  variable: '--font-manrope',
  display: 'swap',
  adjustFontFallback: true,
});

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-vazirmatn',
  display: 'swap',
  adjustFontFallback: true,
});

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  const isFa = params.lang === 'fa';

  let title = 'CLADORA | Residential Asset Operating System & Double-Entry Accounting';
  let description = 'CLADORA unifies double-entry accounting truth, 5D owner-tenant rights, meter OCR, and residential portfolios on an auditable ledger.';
  let keywords = [
    'homeowner association software',
    'condo management operating system',
    'double entry condo accounting',
    'tenant meter readings ocr',
    'residential portfolio software',
    'cladora',
  ];

  if (isRo) {
    title = 'CLADORA | Sistemul de Operare pentru Active Rezidențiale & Contabilitate';
    description = 'CLADORA unește contabilitatea în partidă dublă, Legea 196/2018, drepturile proprietar-chiriaș, citirea automată a contoarelor și migrarea prin Shadow Ledger într-un singur sistem de operare.';
    keywords = [
      'soft asociatie de proprietari',
      'program administrare bloc',
      'contabilitate asociatii proprietari legea 196 2018',
      'avizier digital',
      'citire contoare ocr',
      'software gestiune chirii portofoliu proprietar',
      'migrare xisoft bloc manager',
      'cladora',
    ];
  } else if (isFa) {
    title = 'کلادورا | سیستم‌عامل مدیریت دارایی‌های مسکونی و حسابداری دوطرفه';
    description = 'کلادورا حسابداری دوطرفه ساختاریافته، تفکیک ۵ بعدی حقوق مالک و مستأجر، قرائت تصویری کنتورها و مهاجرت کنترل‌شده سوابق را در یک سیستم‌عامل یکپارچه ارائه می‌دهد.';
    keywords = [
      'نرم افزار مدیریت ساختمان',
      'حسابداری انجمن مالکان',
      'سامانه جامع مدیریت املاک',
      'تابلو اعلانات دیجیتال ساختمان',
      'قرائت هوشمند کنتور آب با عکس',
      'مدیریت سبد املاک استیجاری',
      'کلادورا',
    ];
  }

  const intlLocale = getIntlLocale(params.lang).replace('-', '_');
  const baseUrl = getSiteUrl();

  return {
    title: {
      default: title,
      template: '%s | CLADORA',
    },
    description,
    keywords,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${params.lang}`,
      languages: {
        ro: '/ro',
        en: '/en',
        fa: '/fa',
        'x-default': '/ro',
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${params.lang}`,
      siteName: 'CLADORA Asset OS',
      locale: intlLocale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: Language };
}) {
  const locale = getLocaleConfig(params.lang);
  const baseUrl = getSiteUrl();
  const isRo = params.lang === 'ro';
  const isFa = params.lang === 'fa';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CLADORA Asset OS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0.60',
      priceCurrency: 'EUR',
    },
    description: isRo
      ? 'Sistem de operare pentru active rezidențiale: contabilitate în partidă dublă, Legea 196/2018, citire contoare și administrare portofoliu.'
      : isFa
      ? 'سیستم‌عامل مدیریت دارایی‌های مسکونی: حسابداری دوطرفه، تفکیک حقوق مالک و مستأجر، قرائت کنتورها و مدیریت مجتمع‌ها.'
      : 'Residential Asset Operating System uniting double-entry accounting, statutory compliance, meter OCR, and multi-property portfolio management.',
    creator: {
      '@type': 'Organization',
      name: 'CLADORA',
      url: baseUrl,
    },
  };

  const fontVariables = isFa
    ? `${vazirmatn.variable} ${inter.variable}`
    : `${inter.variable} ${manrope.variable}`;

  return (
    <html 
      lang={locale.code} 
      dir={locale.direction}
      className={`${fontVariables} scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans min-h-screen bg-[#F6F9FC] text-[#102A43] antialiased ${locale.isRtl ? 'font-vazirmatn' : ''}`}>
        <AppOrMarketingLayout lang={params.lang}>
          {children}
        </AppOrMarketingLayout>
      </body>
    </html>
  );
}

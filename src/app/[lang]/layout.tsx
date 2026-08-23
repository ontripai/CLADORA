import React from 'react';
import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { AppOrMarketingLayout } from '@/components/layout/AppOrMarketingLayout';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
  display: 'swap',
});

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';

  const title = isRo
    ? 'CLADORA | Sistemul de Operare pentru Active Rezidențiale & Contabilitate'
    : 'CLADORA | Residential Asset Operating System & Double-Entry Accounting';

  const description = isRo
    ? 'CLADORA unește contabilitatea în partidă dublă, Legea 196/2018, drepturile proprietar-chiriaș, citirea automată a contoarelor și migrarea prin Shadow Ledger într-un singur sistem de operare.'
    : 'CLADORA unifies double-entry accounting truth, 5D owner-tenant rights, meter OCR, and residential portfolios on an auditable ledger.';

  return {
    title: {
      default: title,
      template: '%s | CLADORA',
    },
    description,
    keywords: isRo
      ? [
          'soft asociatie de proprietari',
          'program administrare bloc',
          'contabilitate asociatii proprietari legea 196 2018',
          'avizier digital',
          'citire contoare ocr',
          'software gestiune chirii portofoliu proprietar',
          'migrare xisoft bloc manager',
          'cladora',
        ]
      : [
          'homeowner association software',
          'condo management operating system',
          'double entry condo accounting',
          'tenant meter readings ocr',
          'residential portfolio software',
          'cladora',
        ],
    metadataBase: new URL('https://cladora.ro'),
    alternates: {
      canonical: `/${params.lang}`,
      languages: {
        ro: '/ro',
        en: '/en',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://cladora.ro/${params.lang}`,
      siteName: 'CLADORA Asset OS',
      locale: params.lang === 'ro' ? 'ro_RO' : 'en_US',
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
    description:
      'Residential Asset Operating System uniting double-entry accounting, Law 196/2018 compliance, meter OCR, and multi-property portfolio management.',
    creator: {
      '@type': 'Organization',
      name: 'CLADORA',
      url: 'https://cladora.ro',
    },
  };

  return (
    <html lang={params.lang} className={`${inter.variable} ${manrope.variable} scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans min-h-screen bg-[#F6F9FC] text-[#102A43] antialiased">
        <AppOrMarketingLayout lang={params.lang}>
          {children}
        </AppOrMarketingLayout>
      </body>
    </html>
  );
}

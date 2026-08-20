import React from 'react';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
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
  const dict = getDictionary(params.lang);
  const isRo = params.lang === 'ro';

  const title = isRo
    ? 'CLADORA | Sistemul de Operare pentru Asociații de Proprietari & Portofolii Imobiliare'
    : 'CLADORA | Residential Asset Operating System & Double-Entry Accounting';

  const description = isRo
    ? 'CLADORA unește contabilitatea în partidă dublă, Legea 196/2018, drepturile proprietar-chiriaș, citirea automată a contoarelor și migrarea fără erori prin Shadow Ledger.'
    : 'CLADORA unifies double-entry accounting truth, 5D owner-tenant rights, multi-method meter OCR, engineering building DNA, and verified savings into an immutable ledger.';

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
          'romanian law 196 2018 compliance',
          'multi-property landlord portfolio management',
          'double entry building accounting',
          'smart meter ocr reading',
          'cladora asset os',
        ],
    authors: [{ name: 'CLADORA Platform' }],
    creator: 'CLADORA',
    publisher: 'CLADORA',
    metadataBase: new URL('https://cladora.ro'),
    alternates: {
      canonical: `/${params.lang}`,
      languages: {
        'ro-RO': '/ro',
        'en-US': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: isRo ? 'ro_RO' : 'en_US',
      url: `https://cladora.ro/${params.lang}`,
      title,
      description,
      siteName: 'CLADORA Asset OS',
      images: [
        {
          url: '/assets/og-image.png',
          width: 1200,
          height: 630,
          alt: 'CLADORA - Residential Asset Operating System',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@cladora_os',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
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
    <html lang={params.lang} className={`${inter.variable} ${outfit.variable} dark scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-[#070B12] text-slate-100 selection:bg-brand-500/30 selection:text-brand-200">
        <Header lang={params.lang} />
        <main className="flex-grow">{children}</main>
        <Footer lang={params.lang} />
      </body>
    </html>
  );
}

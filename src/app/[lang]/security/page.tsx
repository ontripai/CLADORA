import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { SecurityAndPermissionsSection } from '@/components/home/SecurityAndPermissionsSection';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  const isFa = params.lang === 'fa';
  return {
    title: isRo 
      ? 'Securitate & Permisiuni | CLADORA' 
      : isFa
      ? 'امنیت، سطوح دسترسی و انطباق با حریم خصوصی | کلادورا'
      : 'Security & Access Control Architecture | CLADORA',
    description: isRo
      ? 'Află cum protejăm datele asociației tale: control granular al accesului, jurnale de audit cu trasabilitate și arhitectură conformă GDPR.'
      : isFa
      ? 'کنترل دقیق سطوح دسترسی بر اساس نقش (RBAC/ABAC)، ثبت قابل‌ردیابی لاگ‌های ممیزی و انطباق با قوانین حریم خصوصی GDPR.'
      : 'Granular role-based access control, traceable audit logs, and GDPR-aligned tenant isolation.',
  };
}

export default function SecurityPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : lang === 'fa' ? 'خانه' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Securitate & Încredere' : lang === 'fa' ? 'امنیت و معماری اعتماد' : 'Security & Trust'}
          </span>
        </div>

        <SecurityAndPermissionsSection lang={lang} />

      </div>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { SecurityAndPermissionsSection } from '@/components/home/SecurityAndPermissionsSection';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export default function SecurityPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Securitate & Trust' : 'Security & Trust'}
          </span>
        </div>

        <SecurityAndPermissionsSection lang={lang} />

      </div>
    </main>
  );
}

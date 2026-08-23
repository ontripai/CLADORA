import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { FaqSection } from '@/components/home/FaqSection';
import { HelpCircle, ArrowRight } from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export default function FaqPage({ params }: { params: { lang: Language } }) {
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
          <span className="text-[#52667A]">{lang === 'ro' ? 'Resurse' : 'Resources'}</span>
          <span>/</span>
          <span className="text-[#102A43] font-bold">FAQ</span>
        </div>

        {/* FAQ Component */}
        <FaqSection lang={lang} />

        {/* Help Banner */}
        <div className="mt-12 card-proptech p-8 bg-white border-[#D3DCE6] text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#102A43]">
            {lang === 'ro' ? 'Ai o întrebare specifică despre blocul tău?' : 'Have a specific building question?'}
          </h3>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Echipa noastră de consultanți tehnici și specialiști în Legea 196/2018 îți stă la dispoziție.'
              : 'Our technical onboarding team is ready to answer questions tailored to your condominium.'}
          </p>
          <Link
            href={`/${lang}/contact`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0E9F8E] text-white text-xs font-bold shadow-sm hover:bg-[#0C8778] transition-colors"
          >
            <span>{lang === 'ro' ? 'Contactează echipa CLADORA' : 'Contact CLADORA Team'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export default function AccessibilityPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Declarație de Accesibilitate' : 'Accessibility Statement'}
          </span>
        </div>

        <div className="card-proptech p-8 sm:p-12 bg-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#102A43]">
                {lang === 'ro' ? 'Declarație de Accesibilitate (WCAG 2.2 AA)' : 'Accessibility Statement (WCAG 2.2 AA)'}
              </h1>
              <p className="text-xs text-[#7B8A9A]">Standard european de accesibilitate web</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#52667A] space-y-4 text-xs sm:text-sm leading-relaxed border-t border-[#F0F4F8] pt-6">
            <p>
              {lang === 'ro'
                ? 'CLADORA Technologies se angajează să asigure accesibilitatea digitală pentru persoanele cu dizabilități, implementând standardele Web Content Accessibility Guidelines (WCAG) 2.2 nivel AA.'
                : 'CLADORA Technologies is dedicated to ensuring digital accessibility for all users by aligning with Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.'}
            </p>

            <h2 className="text-base font-bold text-[#102A43]">Măsuri Implementate:</h2>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">✓ Raport de contrast de minimum 4.5:1 pentru text normal și 7:1 pentru titluri</li>
              <li className="flex items-center gap-2">✓ Suport complet pentru navigare prin tastatură și focus rings vizibile</li>
              <li className="flex items-center gap-2">✓ Atribute semantice ARIA pentru elemente interactive și modale</li>
              <li className="flex items-center gap-2">✓ Fonturi scalabile cu diacritice românești complete</li>
            </ul>
          </div>
        </div>

      </div>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { FileText, ShieldAlert } from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }];
}

export default function TermsPage({ params }: { params: { lang: Language } }) {
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
            {lang === 'ro' ? 'Termeni și Condiții' : 'Terms of Service'}
          </span>
        </div>

        <div className="card-proptech p-8 sm:p-12 bg-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#102A43]">
                {lang === 'ro' ? 'Termeni și Condiții de Utilizare' : 'Terms of Service'}
              </h1>
              <p className="text-xs text-[#7B8A9A]">Versiunea 1.2 · Octombrie 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#52667A] space-y-4 text-xs sm:text-sm leading-relaxed border-t border-[#F0F4F8] pt-6">
            <h2 className="text-base font-bold text-[#102A43]">1. Obiectul Serviciilor</h2>
            <p>
              {lang === 'ro'
                ? 'CLADORA pune la dispoziție o platformă software de tip SaaS destinată administrării financiare, tehnice și operaționale a clădirilor rezidențiale, asociațiilor de proprietari și portofoliilor de active imobiliare.'
                : 'CLADORA provides a SaaS operating platform for the financial, technical, and operational administration of condominium associations and residential real estate assets.'}
            </p>

            <h2 className="text-base font-bold text-[#102A43]">2. Conformitate cu Legea 196/2018</h2>
            <p>
              {lang === 'ro'
                ? 'Algoritmii de calcul și repartizare a cheltuielilor respectă normele prevăzute de Legea nr. 196/2018. Răspunderea privind exactitatea datelor de intrare (indecși, facturi introduse, număr persoane) revine administratorului sau comitetului executiv al asociației.'
                : 'Allocation formulas align with Romanian Law 196/2018. The association board and designated administrator remain responsible for input data fidelity.'}
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

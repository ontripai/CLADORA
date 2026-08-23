import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { ShieldCheck, Lock, FileText } from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export default function PrivacyPage({ params }: { params: { lang: Language } }) {
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
            {lang === 'ro' ? 'Politica de Confidențialitate' : 'Privacy Policy'}
          </span>
        </div>

        <div className="card-proptech p-8 sm:p-12 bg-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#102A43]">
                {lang === 'ro' ? 'Politica de Confidențialitate & GDPR' : 'Privacy Policy & GDPR Compliance'}
              </h1>
              <p className="text-xs text-[#7B8A9A]">Actualizat: Octombrie 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#52667A] space-y-4 text-xs sm:text-sm leading-relaxed border-t border-[#F0F4F8] pt-6">
            <h2 className="text-base font-bold text-[#102A43]">1. Angajamentul CLADORA</h2>
            <p>
              {lang === 'ro'
                ? 'CLADORA Technologies respectă confidențialitatea utilizatorilor săi și se angajează să protejeze datele cu caracter personal prelucrate prin intermediul platformei în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația aplicabilă din România.'
                : 'CLADORA Technologies respects your privacy and is committed to protecting personal data processed via our operating platform in accordance with Regulation (EU) 2016/679 (GDPR).'}
            </p>

            <h2 className="text-base font-bold text-[#102A43]">2. Calitatea de Procesator vs. Operator de Date</h2>
            <p>
              {lang === 'ro'
                ? 'Asociația de proprietari sau compania de administrare este Operatorul de Date în ceea ce privește listele de plată, numărul de persoane, cotele și datele imobiliare. CLADORA acționează exclusiv ca Persoană Împuternicită (Data Processor).'
                : 'The condominium association or property manager acts as the Data Controller regarding tenant lists, unit shares, and statements. CLADORA operates strictly as a Data Processor.'}
            </p>

            <h2 className="text-base font-bold text-[#102A43]">3. Izolarea Datelor și Drepturile Utilizatorilor</h2>
            <p>
              {lang === 'ro'
                ? 'Datele financiare ale proprietarilor sunt strict izolate de cele ale chiriașilor. Utilizatorii au dreptul de acces, rectificare, ștergere și export al datelor lor în formate standard deschise.'
                : 'Owner financial ledgers are isolated from tenants. Users maintain full rights of access, rectification, portability, and erasure under GDPR guidelines.'}
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

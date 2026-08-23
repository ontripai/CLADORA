import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { Building2, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export default function AboutPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Despre Noi' : 'About CLADORA'}
          </span>
        </div>

        <div className="card-proptech p-8 sm:p-12 bg-white space-y-6">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Misiunea Noastră' : 'Our Mission'}
          </span>

          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#102A43]">
            {lang === 'ro' 
              ? 'Construim sistemul de operare pentru clădirile rezidențiale din România'
              : 'Building the Operating System for European Residential Real Estate'}
          </h1>

          <div className="text-sm text-[#52667A] leading-relaxed space-y-4 pt-4 border-t border-[#F0F4F8]">
            <p>
              {lang === 'ro'
                ? 'CLADORA a fost fondată pornind de la o realitate evidentă: piața de administrare a blocurilor și proprietăților din România funcționează încă pe tabele Excel opace, softuri desktop vechi de 20 de ani și neîncredere cronică între locatari și comitete.'
                : 'CLADORA was founded to transform residential property operations from opaque spreadsheets and 20-year-old desktop utilities into modern, explainable software.'}
            </p>
            <p>
              {lang === 'ro'
                ? 'Misiunea noastră este să oferim fiecărei clădiri rezidențiale o singură sursă de adevăr financiar, respectând cu strictețe Legea 196/2018 și drepturile proprietar-chiriaș.'
                : 'Our mission is to establish one immutable source of financial truth for every residential building, fully adhering to European standards and local condominium law.'}
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

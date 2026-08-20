import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  TrendingUp, 
  Home, 
  UserCheck, 
  KeyRound, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowRight,
  DollarSign
} from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  return {
    title: isRo ? 'Cladora Portfolio | Management Portofoliu Imobiliar & Gestiune Chiriași' : 'Cladora Portfolio | Multi-Property Landlord & Rental Lifecycle Management',
    description: isRo
      ? 'Panou unificat pentru proprietarii cu mai multe apartamente: separare cheltuieli proprietar vs. chiriaș, istoric chirii și randament net.'
      : 'Consolidated cockpit for multi-property landlords: automated owner vs tenant expense splits, rent tracking, and net yield analytics.',
  };
}

export default function PortfolioPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';

  return (
    <div className="pt-32 pb-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-emerald-500/20 text-xs font-semibold text-emerald-300">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Owner Portfolio OS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {isRo ? 'Control Total Asupra Portofoliului Tău Imobiliar' : 'Master Your Rental Portfolio & Cash Flows'}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.modesSection.portfolio.tagline}
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link
            href={`/${lang}/pilot`}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-glow-emerald"
          >
            {dict.common.startPilot}
          </Link>
          <Link
            href={`/${lang}/pricing`}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 glass-panel hover:text-white"
          >
            {dict.nav.pricing}
          </Link>
        </div>
      </div>

      {/* 3 Core Landlord Advantages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo ? 'Toate Proprietățile într-un Singur Panou' : 'Consolidated Multi-Property Cockpit'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Indiferent dacă ai 2 apartamente în București și 1 în Cluj, vezi fluxul de numerar, încasările și cheltuielile într-un singur cont consolidat.'
              : 'Whether you hold 2 units in Bucharest and 1 in Cluj, track cross-building rental yields, occupancy rates, and cash flows seamlessly.'}
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 w-fit">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo ? 'Portal Dedicat pentru Chiriaș' : 'Scoped Tenant Experience'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Chiriașul primește o aplicație simplă unde își vede doar cota de utilități de plătit și poate trimite indexurile de contor. Fără acces la vot sau date private.'
              : 'Tenants get a streamlined mobile portal strictly scoped to their consumption invoices and reading submissions with zero exposure to owner voting.'}
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-gold-500/10 text-gold-400 w-fit">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo ? 'Raport de Randament Net (Net Yield)' : 'True Net Yield & Value Growth'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Calculează automat randamentul net după deducerea cotelor de mentenanță, a impozitelor și a perioadelor de neocupare.'
              : 'Real-time calculation of net rental yields after accounting for HOA maintenance funds, property tax, and vacancy intervals.'}
          </p>
        </div>
      </div>

    </div>
  );
}

import React from 'react';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PilotApplicationModal } from '@/components/interactive/PilotApplicationModal';
import { Sparkles, CheckCircle2, ShieldCheck, MapPin, Building, Users } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  return {
    title: isRo ? 'Înscriere Program Pilot București & Ilfov | CLADORA' : 'Bucharest & Ilfov Pilot Cohort Application | CLADORA',
    description: isRo
      ? 'Aplică pentru cohorta de lansare: 5 asociații și 20 de proprietari de portofolii. Migrare gratuită Shadow Ledger și 6 luni de utilizare gratuită.'
      : 'Apply for the exclusive launch cohort: 5 residential communities and 20 multi-property landlords. 100% complimentary migration and 6 months free access.',
  };
}

export default function PilotPage({
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{dict.pilot.badge}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {dict.pilot.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.pilot.description}
        </p>
      </div>

      {/* Cohort Composition & Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Pilot Details & Cohort criteria */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-400" />
              <span>{isRo ? 'Structura Cohortei de Validare' : 'Cohort Composition'}</span>
            </h3>
            
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span><strong>5 Asociații de Proprietari</strong> (40 - 150 unități în București / Ilfov)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                <span><strong>20 Proprietari de Portofolii</strong> (Min. 2 proprietăți)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                <span><strong>2 Firme de Administrare</strong> (Testare flux multi-bloc)</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isRo ? 'Beneficii Exclusive pentru Participanți' : 'Cohort Exclusive Perks'}</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              {dict.pilot.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Application Form */}
        <div className="lg:col-span-7">
          <PilotApplicationModal lang={lang} />
        </div>

      </div>

    </div>
  );
}

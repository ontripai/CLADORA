import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PilotApplicationModal } from '@/components/interactive/PilotApplicationModal';
import { Sparkles, CheckCircle2, MapPin } from 'lucide-react';





export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Language }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return getRouteMetadata('/pilot', params.lang);
}

export default async function PilotPage(
  props: {
    params: Promise<{ lang: Language }>;
  }
) {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

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
              <span>{isRo ? 'Structura Cohortei de Validare' : isFa ? 'ظرفیت و ترکیب دوره پایلوت' : 'Cohort Composition'}</span>
            </h3>
            
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  {isRo 
                    ? <><strong>5 Asociații de Proprietari</strong> (40 - 150 unități în București / Ilfov)</>
                    : isFa
                    ? <><strong>۵ مجتمع مسکونی</strong> (۴۰ تا ۱۵۰ واحد در بخارست و ایلفوف)</>
                    : <><strong>5 Condominium Associations</strong> (40 - 150 units in Bucharest / Ilfov)</>}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                <span>
                  {isRo
                    ? <><strong>20 Proprietari de Portofolii</strong> (Min. 2 proprietăți)</>
                    : isFa
                    ? <><strong>۲۰ سرمایه‌گذار املاک</strong> (حداقل ۲ واحد استیجاری)</>
                    : <><strong>20 Portfolio Landlords</strong> (Min. 2 properties)</>}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                <span>
                  {isRo
                    ? <><strong>2 Firme de Administrare</strong> (Testare flux multi-bloc)</>
                    : isFa
                    ? <><strong>۲ شرکت مدیریت املاک</strong> (آزمون مدیریت هم‌زمان چند مجتمع)</>
                    : <><strong>2 Property Management Firms</strong> (Multi-association testing)</>}
                </span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isRo ? 'Beneficii Exclusive pentru Participanți' : isFa ? 'مزایای ویژه اعضای دوره آزمایشی' : 'Cohort Exclusive Perks'}</span>
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

import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';


import React from 'react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { SavingsCalculator } from '@/components/interactive/SavingsCalculator';
import { Building, Sparkles, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';



export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Language }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return getRouteMetadata('/building-dna', params.lang);
}

export default async function BuildingDnaPage(
  props: {
    params: Promise<{ lang: Language }>;
  }
) {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';

  return (
    <div className="pt-32 pb-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-emerald-500/20 text-xs font-semibold text-emerald-300">
          <Building className="w-3.5 h-3.5" />
          <span>Core C07</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {dict.buildingDna.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.buildingDna.description}
        </p>
      </div>

      {/* 8 Archetypes Full Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dict.buildingDna.archetypes.map((arch) => (
          <div key={arch.code} className="p-6 rounded-2xl glass-panel glass-panel-hover border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {arch.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">{arch.period}</span>
            </div>
            <h3 className="text-base font-bold text-white">{arch.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{arch.desc}</p>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-500">{isRo ? 'Potențial:' : 'Savings:'}</span>
              <span className="text-emerald-400 font-semibold">{arch.savings}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Calculator */}
      <SavingsCalculator lang={lang} />

    </div>
  );
}

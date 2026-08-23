import React from 'react';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { AllocationSimulator } from '@/components/interactive/AllocationSimulator';
import { Scale, Lock, FileSpreadsheet, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  const isFa = params.lang === 'fa';
  return {
    title: isRo 
      ? 'Adevăr Financiar & Contabilitate în Partidă Dublă | CLADORA' 
      : isFa
      ? 'حقیقت مالی و حسابداری دوطرفه | کلادورا'
      : 'Financial Truth Core & Double-Entry Accounting | CLADORA',
    description: isRo
      ? 'Contabilitate în partidă dublă, reconciliere bancară asistată, închidere securizată de lună și jurnal de audit cu trasabilitate.'
      : isFa
      ? 'دفتر کل دوطرفه، تطبیق با صورت‌حساب بانکی، بستن ایمن دوره ماهانه و ردپای ممیزی با قابلیت رهگیری.'
      : 'Double-entry accounting, assisted bank reconciliation, secure month-end closing, and auditable event trails.',
  };
}

export default function FinancialTruthPage({
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
          <Scale className="w-3.5 h-3.5" />
          <span>Core C01 & C02</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {dict.financialTruth.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.financialTruth.description}
        </p>
      </div>

      {/* Interactive Simulator */}
      <AllocationSimulator lang={lang} />

      {/* 4 Pillars In Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dict.financialTruth.pillars.map((pillar, idx) => (
          <div key={idx} className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-mono font-bold">
              0{idx + 1}
            </div>
            <h3 className="text-xl font-bold text-white">{pillar.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{pillar.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

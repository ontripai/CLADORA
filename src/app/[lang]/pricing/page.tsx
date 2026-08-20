import React from 'react';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PricingCalculator } from '@/components/interactive/PricingCalculator';
import { HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  return {
    title: isRo ? 'Tarife & Pachete Transparente | CLADORA' : 'Transparent Pricing & Calculator | CLADORA',
    description: isRo
      ? 'Află costul exact pentru asociația sau portofoliul tău. Planuri scalabile fără costuri ascunse și reduceri anuale de 20%.'
      : 'Calculate precise pricing for your HOA community or multi-property portfolio. Transparent tier architecture with 20% yearly discount.',
  };
}

export default function PricingPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';

  const faqs = [
    {
      q: isRo ? 'Există taxe de instalare sau de configurare?' : 'Are there any setup or onboarding fees?',
      a: isRo
        ? 'Nu. Configurarea inițială și migrarea datelor prin motorul Shadow Ledger sunt 100% gratuite în perioada de lansare și pentru cohorta pilot.'
        : 'No. Initial setup and Shadow Ledger data migration are 100% free during the launch period and pilot cohort.',
    },
    {
      q: isRo ? 'Ce se întâmplă dacă avem luni cu apartamente neocupate?' : 'How are vacant units billed in associations?',
      a: isRo
        ? 'Pentru asociațiile de proprietari, licența se calculează per apartament activ în evidență, conform Legii 196/2018 (care impune plata cotelor comune chiar și pentru unitățile neocupate).'
        : 'For HOAs, billing is based on registered units according to statutory compliance requirements.',
    },
    {
      q: isRo ? 'Putem trece de la plata lunară la cea anuală?' : 'Can we switch between monthly and annual billing?',
      a: isRo
        ? 'Da, oricând. Trecerea la facturarea anuală activează automat reducerea de 20% pentru toate lunile rămase.'
        : 'Yes, anytime. Switching to annual billing automatically activates the 20% discount across remaining periods.',
    },
  ];

  return (
    <div className="pt-32 pb-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
          <span>{dict.pricing.badge}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {dict.pricing.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.pricing.description}
        </p>
      </div>

      {/* Interactive Pricing Calculator */}
      <PricingCalculator lang={lang} />

      {/* FAQs */}
      <div className="max-w-4xl mx-auto space-y-6 pt-12 border-t border-white/10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            {isRo ? 'Întrebări Frecvente Despre Prețuri' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isRo ? 'Răspunsuri clare și transparente pentru administrator și comitet' : 'Clear and transparent answers for boards and managers'}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass-panel border border-white/10 space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

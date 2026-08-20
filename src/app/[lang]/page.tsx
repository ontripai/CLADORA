import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { HeroSection } from '@/components/home/HeroSection';
import { ThreeModesSection } from '@/components/home/ThreeModesSection';
import { SeventeenCoresExplorer } from '@/components/home/SeventeenCoresExplorer';
import { CompetitorComparisonTable } from '@/components/home/CompetitorComparisonTable';
import { AllocationSimulator } from '@/components/interactive/AllocationSimulator';
import { SavingsCalculator } from '@/components/interactive/SavingsCalculator';
import { ShadowLedgerDemo } from '@/components/interactive/ShadowLedgerDemo';
import { PricingCalculator } from '@/components/interactive/PricingCalculator';
import { 
  Building2, 
  ShieldCheck, 
  Scale, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  FileCheck2,
  TrendingUp
} from 'lucide-react';

export default function HomePage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* 1. Hero Section */}
      <HeroSection lang={lang} />

      {/* 2. Three Unified Operating Modes */}
      <ThreeModesSection lang={lang} />

      {/* 3. Financial Truth & 4-Way Cost Allocation Simulator */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
            <Scale className="w-3.5 h-3.5" />
            <span>{dict.financialTruth.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {dict.financialTruth.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {dict.financialTruth.description}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {dict.financialTruth.pillars.map((pillar, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass-panel glass-panel-hover border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center font-mono font-bold text-xs">
                0{idx + 1}
              </div>
              <h3 className="text-base font-bold text-white">{pillar.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>

        {/* Interactive 4-Way Rights Allocation Simulator */}
        <AllocationSimulator lang={lang} />
      </section>

      {/* 4. Building DNA & Verified Savings Calculator */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-emerald-500/20 text-xs font-semibold text-emerald-300">
            <Building2 className="w-3.5 h-3.5" />
            <span>{dict.buildingDna.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {dict.buildingDna.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {dict.buildingDna.description}
          </p>
        </div>

        {/* 8 Archetypes Mini Carousel / Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {dict.buildingDna.archetypes.slice(0, 4).map((arch) => (
            <div key={arch.code} className="p-4 rounded-xl glass-panel border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-400">{arch.code}</span>
                <span className="text-[10px] text-slate-400">{arch.period}</span>
              </div>
              <div className="text-xs font-bold text-white">{arch.name}</div>
              <div className="text-[11px] text-emerald-300 font-semibold">{arch.savings}</div>
            </div>
          ))}
        </div>

        {/* Interactive Savings Calculator */}
        <SavingsCalculator lang={lang} />
      </section>

      {/* 5. Safe Migration with Shadow Ledger */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
            <Layers className="w-3.5 h-3.5" />
            <span>{dict.migrationSection.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {dict.migrationSection.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {dict.migrationSection.description}
          </p>
        </div>

        {/* 4 Steps Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {dict.migrationSection.steps.map((st) => (
            <div key={st.step} className="p-5 rounded-2xl glass-panel border border-white/10 space-y-2">
              <span className="font-mono text-2xl font-extrabold text-brand-400 block">{st.step}</span>
              <h3 className="text-sm font-bold text-white">{st.title}</h3>
              <p className="text-xs text-slate-400">{st.desc}</p>
            </div>
          ))}
        </div>

        {/* Live Shadow Ledger Discrepancy Demo */}
        <ShadowLedgerDemo lang={lang} />
      </section>

      {/* 6. 17 Logical Cores Explorer */}
      <SeventeenCoresExplorer lang={lang} />

      {/* 7. Detailed Competitor Comparison Table */}
      <CompetitorComparisonTable lang={lang} />

      {/* 8. Pricing Section */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
            <span>{dict.pricing.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {dict.pricing.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {dict.pricing.description}
          </p>
        </div>

        {/* Interactive Pricing Configurator */}
        <PricingCalculator lang={lang} />
      </section>

      {/* 9. Exclusive Pilot Cohort Final CTA */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel border border-brand-500/40 p-8 sm:p-12 relative overflow-hidden shadow-2xl glow-box-cyan text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{dict.pilot.badge}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
            {dict.pilot.title}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {dict.pilot.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/${lang}/pilot`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-500 via-teal-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 shadow-glow-cyan transition-all"
            >
              <Sparkles className="w-4 h-4 text-brand-200" />
              <span>{dict.common.startPilot}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={`/${lang}/pricing`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-slate-300 glass-panel hover:text-white transition-all"
            >
              <span>{isRo ? 'Vezi Toate Prețurile' : 'View Pricing Plans'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

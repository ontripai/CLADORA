'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  Zap,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface HeroSectionProps {
  lang: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang }) => {
  const dict = getDictionary(lang);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background glow and mesh grid */}
      <div className="absolute inset-0 mesh-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-brand-500/30 text-xs font-semibold text-brand-300 shadow-glow-cyan">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{dict.hero.badge}</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-mono">Bucharest & Ilfov Pilot</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.1]">
            <span>{dict.hero.titleLine1}</span>{' '}
            <span className="gradient-text-brand block mt-1">
              {dict.hero.titleLine2}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed pt-2">
            {dict.hero.description}
          </p>

          {/* CTA Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${lang}/pilot`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-brand-500 via-teal-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 shadow-glow-cyan transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 text-brand-200" />
              <span>{dict.hero.ctaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#simulator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-slate-200 glass-panel glass-panel-hover border border-white/10 hover:border-brand-400/40 transition-all"
            >
              <Zap className="w-4 h-4 text-brand-400" />
              <span>{dict.hero.ctaSecondary}</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ro' ? 'Fără taxe de instalare' : 'Zero onboarding fees'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ro' ? 'Migrare Shadow Ledger inclusă' : 'Shadow Ledger migration included'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'ro' ? 'Conform Legea 196/2018' : 'Romanian Law 196/2018 verified'}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 pt-8 border-t border-white/10">
          {dict.hero.metrics.map((metric, index) => (
            <div 
              key={index}
              className="p-5 rounded-2xl glass-panel glass-panel-hover text-center space-y-1 relative overflow-hidden"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white gradient-text-brand">
                {metric.value}
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {metric.label}
              </div>
              <div className="text-xs text-slate-400 pt-0.5">
                {metric.subtext}
              </div>
            </div>
          ))}
        </div>

        {/* Hero Interactive Cockpit Preview Card */}
        <div className="mt-14 relative rounded-3xl glass-panel p-2 sm:p-3 border border-white/15 shadow-2xl overflow-hidden glow-box-cyan">
          <div className="rounded-2xl bg-[#090E17]/90 border border-white/10 p-4 sm:p-6 space-y-6">
            
            {/* Top Bar of the Cockpit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">
                  CLADORA Core Cockpit • Association: Complex Aviației 12B • Bucharest
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GL Balanced: 0.00 RON Variance
                </span>
                <span className="px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/30">
                  Period: August 2026 Locked
                </span>
              </div>
            </div>

            {/* 3 Pillars in Action */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Box 1: Association View */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-brand-400" />
                    Association OS
                  </span>
                  <span className="text-slate-400 font-mono">120 Units</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Fond Rulment / CPI:</span>
                    <span className="font-semibold text-emerald-400">42,850.00 RON</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Reconciliere Bancară:</span>
                    <span className="text-slate-200">100% (BCR & ING)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Vot Adunare Generală:</span>
                    <span className="text-emerald-400 font-semibold">Cvorum Atins (74%)</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Landlord Portfolio View */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Portfolio OS (Owner)
                  </span>
                  <span className="text-slate-400 font-mono">4 Properties</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Venit Net Chirii:</span>
                    <span className="font-semibold text-emerald-400">3,200 EUR / mo</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Separare Cheltuieli:</span>
                    <span className="text-slate-200">4-Way Auto Split</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Status Chiriași:</span>
                    <span className="text-emerald-400">Toate plătite la zi</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Building DNA & Meter Ingestion */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gold-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-gold-400" />
                    Building DNA & OCR
                  </span>
                  <span className="text-slate-400 font-mono">Archetype A4</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Indexuri Contoare:</span>
                    <span className="text-brand-300 font-semibold">120/120 Citite (AI OCR)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Anomalii Pierderi:</span>
                    <span className="text-emerald-400">0 Alerte active</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Economie Verificată:</span>
                    <span className="text-gold-400 font-semibold">+14.2% față de baseline</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

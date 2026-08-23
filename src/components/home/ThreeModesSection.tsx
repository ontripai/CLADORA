'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  Building2, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';

interface ThreeModesSectionProps {
  lang: Language;
}

export const ThreeModesSection: React.FC<ThreeModesSectionProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const [activeTab, setActiveTab] = useState<'association' | 'portfolio' | 'manager'>('association');

  const section = dict.modesSection;
  const current = section[activeTab];

  return (
    <section id="modes" className="py-24 relative overflow-hidden bg-[#070B12]">
      {/* Glow ambient background */}
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-brand-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
            <span>{section.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {section.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-200 font-normal">
            {section.description}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mt-12 mb-10">
          <div className="p-1.5 rounded-2xl glass-panel border border-white/15 flex flex-wrap gap-2 max-w-2xl w-full">
            <button
              type="button"
              aria-label="Select Association OS"
              onClick={() => setActiveTab('association')}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-extrabold transition-all ${
                activeTab === 'association'
                  ? 'bg-cyan-400 text-slate-950 shadow-glow-cyan'
                  : 'bg-surface-200/50 text-slate-100 hover:bg-surface-200 hover:text-white border border-white/10'
              }`}
            >
              <Building2 className={`w-4 h-4 ${activeTab === 'association' ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>Association OS</span>
            </button>

            <button
              type="button"
              aria-label="Select Portfolio OS"
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-extrabold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-emerald-400 text-slate-950 shadow-glow-emerald'
                  : 'bg-surface-200/50 text-slate-100 hover:bg-surface-200 hover:text-white border border-white/10'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${activeTab === 'portfolio' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Portfolio OS</span>
            </button>

            <button
              type="button"
              aria-label="Select Manager OS"
              onClick={() => setActiveTab('manager')}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-extrabold transition-all ${
                activeTab === 'manager'
                  ? 'bg-violet-400 text-slate-950 shadow-glow-cyan'
                  : 'bg-surface-200/50 text-slate-100 hover:bg-surface-200 hover:text-white border border-white/10'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === 'manager' ? 'text-slate-950' : 'text-violet-400'}`} />
              <span>Manager OS</span>
            </button>
          </div>
        </div>

        {/* Active Mode Card Container */}
        <div className="rounded-3xl glass-panel border border-white/15 p-6 sm:p-10 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border text-brand-300 border-brand-400/40 bg-brand-500/20">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{current.target}</span>
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  {current.title}
                </h3>
                <p className="text-base text-slate-200 leading-relaxed font-normal">
                  {current.tagline}
                </p>
              </div>

              {/* Bullet points */}
              <div className="space-y-3 pt-2">
                {current.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-100 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Deep dive link */}
              <div className="pt-4">
                <Link
                  href={`/${lang}/${activeTab}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-300 hover:text-brand-200 group"
                >
                  <span>{current.linkText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform text-brand-300" />
                </Link>
              </div>
            </div>

            {/* Right Metrics Box */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-surface-100/95 border border-white/15 p-6 space-y-6">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {lang === 'ro' ? 'Impactul Măsurabil al Modulului' : lang === 'fa' ? 'نتایج ملموس و قابل سنجش' : 'Measurable Module Impact'}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
                    <span className="text-sm text-slate-100 font-semibold">{lang === 'ro' ? 'Închidere perioadă' : lang === 'fa' ? 'بستن دوره مالی' : 'Period Close'}</span>
                    <span className="text-sm font-semibold text-emerald-400">{lang === 'ro' ? 'Flux ghidat' : lang === 'fa' ? 'گردش‌کار مرحله‌ای' : 'Guided workflow'}</span>
                  </div>
                  <div className="p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
                    <span className="text-sm text-slate-100 font-semibold">{lang === 'ro' ? 'Control discrepanțe' : lang === 'fa' ? 'شناسایی مغایرت‌ها' : 'Discrepancy Checks'}</span>
                    <span className="text-sm font-semibold text-emerald-400">{lang === 'ro' ? 'Validări automate' : lang === 'fa' ? 'اعتبارسنجی خودکار' : 'Automated validations'}</span>
                  </div>
                  <div className="p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
                    <span className="text-sm text-slate-100 font-semibold">{lang === 'ro' ? 'Adunări & Cvorum' : lang === 'fa' ? 'حدنصاب و مجمع' : 'Quorum & Turnout'}</span>
                    <span className="text-sm font-semibold text-emerald-400">{lang === 'ro' ? 'Urmărire participare' : lang === 'fa' ? 'پایش حضور و آرا' : 'Participation tracking'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-500/20 border border-brand-500/40 text-xs text-slate-100 leading-relaxed font-medium">
                  <span>⚖️ <strong>{lang === 'ro' ? 'Cadru structurat Legea 196/2018:' : lang === 'fa' ? 'پشتیبانی از الزامات قانونی:' : 'Structured Statutory Support:'}</strong> {lang === 'ro' ? 'Reguli de repartizare configurabile și documentate pentru împărțirea pe cote-părți indivize (CPI), persoane și suprafață utilă.' : lang === 'fa' ? 'قواعد تسهیم شفاف و مستند بر مبنای سهام مشاع، تعداد نفرات و متراژ مفید.' : 'Documented and configurable allocation rules for CPI shares, person counts, and heated surface area.'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

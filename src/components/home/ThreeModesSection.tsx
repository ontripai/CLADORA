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
  FileText, 
  Users, 
  Scale, 
  Zap 
} from 'lucide-react';

interface ThreeModesSectionProps {
  lang: Language;
}

export const ThreeModesSection: React.FC<ThreeModesSectionProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const [activeTab, setActiveTab] = useState<'association' | 'portfolio' | 'manager'>('association');

  const modesData = {
    association: {
      ...dict.modesSection.association,
      icon: Building2,
      badgeColor: 'text-brand-400 border-brand-500/30 bg-brand-500/10',
      glowColor: 'glow-box-cyan',
      themeGradient: 'from-brand-500 to-teal-400',
      stats: [
        { label: lang === 'ro' ? 'Timp închidere lună' : 'Month-end close time', value: '-45%' },
        { label: lang === 'ro' ? 'Erori de calcul' : 'Calculation errors', value: '0%' },
        { label: lang === 'ro' ? 'Prezență la adunări' : 'Assembly turnout', value: '85%+' },
      ],
    },
    portfolio: {
      ...dict.modesSection.portfolio,
      icon: TrendingUp,
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      glowColor: 'glow-box-emerald',
      themeGradient: 'from-emerald-500 to-teal-400',
      stats: [
        { label: lang === 'ro' ? 'Vizibilitate cheltuieli' : 'Expense visibility', value: '100%' },
        { label: lang === 'ro' ? 'Timp gestiune chiriași' : 'Tenant admin time', value: '-60%' },
        { label: lang === 'ro' ? 'Recuperare restanțe' : 'Arrears recovery', value: '99.4%' },
      ],
    },
    manager: {
      ...dict.modesSection.manager,
      icon: Layers,
      badgeColor: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
      glowColor: 'glow-box-cyan',
      themeGradient: 'from-violet-500 to-brand-400',
      stats: [
        { label: lang === 'ro' ? 'Capacitate gestionare' : 'Manager capacity', value: '3x Unități' },
        { label: lang === 'ro' ? 'Rezolvare tichete SLA' : 'Ticket SLA resolution', value: '< 4 Ore' },
        { label: lang === 'ro' ? 'Economie achiziții' : 'Procurement savings', value: '15-25%' },
      ],
    },
  };

  const currentMode = modesData[activeTab];
  const IconComponent = currentMode.icon;

  return (
    <section id="modes" className="py-24 relative overflow-hidden bg-[#070B12]">
      {/* Background decorations */}
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-brand-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
            <span>{dict.modesSection.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {dict.modesSection.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {dict.modesSection.description}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex justify-center mt-12 mb-10">
          <div className="p-1.5 rounded-2xl glass-panel border border-white/10 flex flex-wrap gap-2 max-w-2xl w-full">
            
            <button
              onClick={() => setActiveTab('association')}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'association'
                  ? 'bg-brand-500 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Association OS</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-emerald-500 text-white shadow-glow-emerald'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Portfolio OS</span>
            </button>

            <button
              onClick={() => setActiveTab('manager')}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'manager'
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Manager OS</span>
            </button>

          </div>
        </div>

        {/* Active Mode Card Showcase */}
        <div className="rounded-3xl glass-panel border border-white/15 p-6 sm:p-10 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-2">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${currentMode.badgeColor}`}>
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{currentMode.target}</span>
                </span>
                
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  {currentMode.title}
                </h3>

                <p className="text-base text-slate-300 leading-relaxed font-normal">
                  {currentMode.tagline}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 pt-2">
                {currentMode.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Deep Dive Action Link */}
              <div className="pt-4">
                <Link
                  href={currentMode.href}
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-300 hover:text-brand-200 group"
                >
                  <span>{currentMode.linkText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>

            {/* Right Stats & Highlights Column */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-surface-100/70 border border-white/10 p-6 space-y-6">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {lang === 'ro' ? 'Impactul Măsurabil al Modulului' : 'Measurable Impact'}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {currentMode.stats.map((stat, idx) => (
                    <div key={idx} className="p-4 rounded-xl glass-panel border border-white/5 flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-medium">{stat.label}</span>
                      <span className="text-xl font-display font-extrabold gradient-text-brand">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 leading-relaxed">
                  {activeTab === 'association' && (
                    <span>⚖️ <strong>Conformitate 100% Legea 196/2018:</strong> Algoritmi aprobați pentru împărțirea pe cote-părți indivize (CPI), persoane și suprafață utilă.</span>
                  )}
                  {activeTab === 'portfolio' && (
                    <span>📊 <strong>Model 4-Way Rights:</strong> Separă automat cheltuielile de proprietate (fond reparații) de cele operaționale de consum (plătite de chiriaș).</span>
                  )}
                  {activeTab === 'manager' && (
                    <span>⚡ <strong>Mass Billing & Dispecerat:</strong> Închide 50 de asociații în mai puțin de 30 de minute cu zero discrepanțe bancare.</span>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

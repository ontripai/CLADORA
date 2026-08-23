'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  Building2, 
  TrendingUp, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  PlayCircle,
  FileSpreadsheet,
  Receipt,
  Users
} from 'lucide-react';

interface HeroSectionProps {
  lang: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'association' | 'portfolio' | 'manager'>('association');

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-[#F0F4F8] via-[#F6F9FC] to-[#F6F9FC] mesh-subtle">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[#0E9F8E]/10 via-[#2F80ED]/10 to-[#FF7A59]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Pilot Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#B2E5DF] shadow-sm text-xs font-bold text-[#0A6E62]">
            <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>{lang === 'ro' ? 'Programul Pilot București & Ilfov — Înscrieri Deschise' : 'Bucharest & Ilfov Pilot Cohort — Open for Applications'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0E9F8E]" />
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto mt-6 space-y-5">
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-[#102A43] tracking-tight leading-[1.15]">
            {lang === 'ro' ? (
              <>
                Control complet asupra{' '}
                <span className="gradient-text-teal">clădirilor și proprietăților</span> tale.
              </>
            ) : (
              <>
                Complete control over your{' '}
                <span className="gradient-text-teal">buildings and residential assets</span>.
              </>
            )}
          </h1>

          <p className="text-lg sm:text-xl text-[#52667A] max-w-3xl mx-auto leading-relaxed font-normal">
            {lang === 'ro'
              ? 'CLADORA unește contabilitatea în partidă dublă, Legea 196/2018, citirea automată a contoarelor, drepturile proprietar-chiriaș și portofoliile rezidențiale într-un singur sistem de operare auditat.'
              : 'CLADORA unifies double-entry accounting truth, Law 196/2018 statutory compliance, meter OCR, owner-tenant rights, and residential portfolios in one auditable operating system.'}
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link
              href={`/${lang}/demo`}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white font-display font-bold text-base shadow-card-hover hover:scale-[1.02] transition-all"
            >
              <PlayCircle className="w-5 h-5" />
              <span>{lang === 'ro' ? 'Vezi demonstrația interactivă' : 'Explore Interactive Demo'}</span>
            </Link>

            <Link
              href={`/${lang}/pilot`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-[#F0F4F8] text-[#102A43] border border-[#D3DCE6] font-display font-bold text-base shadow-card transition-all"
            >
              <span>{lang === 'ro' ? 'Aplică în programul pilot' : 'Apply for Pilot Program'}</span>
              <ArrowRight className="w-4 h-4 text-[#52667A]" />
            </Link>
          </div>
        </div>

        {/* 3-OS Experience Switcher */}
        <div className="mt-14 max-w-5xl mx-auto">
          
          <div className="flex justify-center mb-6">
            <div className="p-1.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-card flex flex-wrap gap-2 max-w-2xl w-full">
              
              <button
                type="button"
                onClick={() => setActiveTab('association')}
                className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'association'
                    ? 'bg-[#102A43] text-white shadow-md'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <Building2 className={`w-4 h-4 ${activeTab === 'association' ? 'text-[#75CFC3]' : 'text-[#52667A]'}`} />
                <span>Association OS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'portfolio'
                    ? 'bg-[#0E9F8E] text-white shadow-md'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <TrendingUp className={`w-4 h-4 ${activeTab === 'portfolio' ? 'text-white' : 'text-[#52667A]'}`} />
                <span>Portfolio OS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manager')}
                className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'manager'
                    ? 'bg-[#2F80ED] text-white shadow-md'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'manager' ? 'text-white' : 'text-[#52667A]'}`} />
                <span>Manager OS</span>
              </button>

            </div>
          </div>

          {/* Dynamic Mockup Card based on OS Switcher */}
          <div className="card-proptech p-6 sm:p-8 border-[#D3DCE6] shadow-elevated bg-white relative overflow-hidden">
            
            {activeTab === 'association' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#102A43]">
                        Asociația de Proprietari Aviației 12B — Închidere Octombrie 2026
                      </h3>
                      <p className="text-xs text-[#52667A]">120 unități · 4 scări · Balanță reconciliată BCR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-bold border border-[#A7F3D0]">
                      ● Balanță Echilibrată
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Total Cheltuieli Facturate</div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      18.420,50 RON
                    </div>
                    <div className="text-[11px] text-[#059669] mt-1">✓ 100% alocate pe cote</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Sold Fond Rulment + Reparații</div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      45.800,00 RON
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">Separare strictă conturi Legea 196</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Contoare Transmise (Apă Rece/Caldă)</div>
                    <div className="text-xl font-display font-extrabold text-[#0E9F8E] tabular-nums mt-1">
                      116 / 120 (97%)
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">4 estimate conform metodologiei</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EDF5FF] text-[#2F80ED] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#102A43]">
                        Portofoliu Rezidențial — 4 Proprietăți în București
                      </h3>
                      <p className="text-xs text-[#52667A]">Aviației, Pipera, Titan, Călărași · 100% Închiriate</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#EDF5FF] text-[#1E62C4] text-xs font-bold border border-[#BFDBFE]">
                      Yield Mediu Net: 6.8%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Venit Brut Chirii Lunar</div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      3.180,00 EUR
                    </div>
                    <div className="text-[11px] text-[#059669] mt-1">✓ 4/4 chirii încasate la termen</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Costuri Proprietar vs Chiriaș</div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      307 EUR <span className="text-xs font-normal text-[#7B8A9A]">proprietar</span>
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">767 EUR cheltuieli operaționale chiriași</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Garanții Reținute în Depozit</div>
                    <div className="text-xl font-display font-extrabold text-[#2F80ED] tabular-nums mt-1">
                      5.400,00 EUR
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">Conturi escrow monitorizate</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manager' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7E6] text-[#D99B26] flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#102A43]">
                        ProActive Management SRL — 8 Asociații Condominiale
                      </h3>
                      <p className="text-xs text-[#52667A]">680 unități totale · 6 tehnicieni · 14 furnizori activi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF7E6] text-[#B45309] text-xs font-bold border border-[#FDE68A]">
                      SLA Mentenanță: 98.4%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Închidere Lună Centralizată</div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      7 / 8 Închise
                    </div>
                    <div className="text-[11px] text-[#059669] mt-1">1 în validare cenzor</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Tichete Mentenanță Deschise</div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      3 Active
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">Timp mediu rezolvare: 2.4 ore</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">Eficiență Operațională Echipă</div>
                    <div className="text-xl font-display font-extrabold text-[#10B981] tabular-nums mt-1">
                      +45% Timp Salvat
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">Prin reconciliere bancară automată</div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-[#E2E8F0] text-xs text-[#52667A]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0E9F8E]" />
                <span>{lang === 'ro' ? 'Un singur model de date și permisiuni între cele 3 medii.' : 'One shared data model, identity, and permissions core.'}</span>
              </div>
              <Link
                href={`/${lang}/demo`}
                className="font-bold text-[#0E9F8E] hover:underline flex items-center gap-1"
              >
                <span>{lang === 'ro' ? 'Lansează în Demo' : 'Launch in Demo'}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

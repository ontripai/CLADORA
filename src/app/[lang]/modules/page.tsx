'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language, CoreFeature } from '@/types';
import { 
  Cpu, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SeventeenCoresExplorer } from '@/components/home/SeventeenCoresExplorer';

export default function ModulesPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Module & Capabilități' : 'Modules & Capabilities'}
          </span>
        </div>

        {/* Hero */}
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Arhitectura celor 17 Nuclee' : 'The 17 Logical Cores'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro'
              ? 'Arhitectura Modulară CLADORA'
              : 'CLADORA Modular Architecture'}
          </h1>
          <p className="text-base sm:text-lg text-[#52667A] leading-relaxed">
            {lang === 'ro'
              ? 'Platforma este structurată în 17 nuclee logice organizate pe 3 faze evolutive: P1 (Fundația MVP & Adevăr Financiar), P2 (Operațiuni & Guvernanță) și P3 (Inteligență de Cost & Valoare Activ).'
              : 'Structured into 17 logical cores across 3 progressive phases: P1 (MVP Foundation & Financial Truth), P2 (Operations & Governance), and P3 (Cost Intelligence & Asset Value).'}
          </p>
        </div>

        {/* Phase Summary Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-8">
          <div className="card-proptech p-5 bg-white border-l-4 border-l-[#0E9F8E]">
            <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">Faza P1 — MVP Foundation</div>
            <div className="text-sm font-bold text-[#102A43] mt-1">C01, C02, C06, C08, C11, C16, C17</div>
            <p className="text-xs text-[#52667A] mt-1">Contabilitate în partidă dublă, alocare CPI, contoare, avizier și migrare Shadow Ledger.</p>
          </div>

          <div className="card-proptech p-5 bg-white border-l-4 border-l-[#2F80ED]">
            <div className="text-xs font-bold text-[#2F80ED] uppercase tracking-wider">Faza P2 — Operațiuni & Guvernanță</div>
            <div className="text-sm font-bold text-[#102A43] mt-1">C03, C04, C05, C07, C09, C10, C12</div>
            <p className="text-xs text-[#52667A] mt-1">Trezorerie, restanțe, calendar fiscal, mentenanță, contracte furnizori și vot Adunare Generală.</p>
          </div>

          <div className="card-proptech p-5 bg-white border-l-4 border-l-[#10B981]">
            <div className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Faza P3 — Inteligență & Valoare</div>
            <div className="text-sm font-bold text-[#102A43] mt-1">C13, C14, C15</div>
            <p className="text-xs text-[#52667A] mt-1">Parcări inteligente, benchmarking de cost între blocuri și economii verificate de energie.</p>
          </div>
        </div>

        {/* Filterable 17 Cores Explorer Component */}
        <div className="mt-8">
          <SeventeenCoresExplorer lang={lang} />
        </div>

      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Language, UserRole } from '@/types';
import { 
  Building2, 
  ShieldCheck, 
  FileCheck, 
  Home, 
  KeyRound, 
  TrendingUp, 
  Layers, 
  Wrench, 
  Server,
  ArrowRight,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';
import { DEMO_ROLES } from '@/data/mockData';
import { useDemoStore } from '@/data/demoStore';

export default function DemoEntryPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const router = useRouter();
  const { setActiveRole, resetDemoData } = useDemoStore();

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    router.push(`/${lang}/app/dashboard`);
  };

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Disclaimer Banner */}
        <div className="card-proptech p-4 bg-[#EAF8F5] border-[#B2E5DF] flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0E9F8E] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0A6E62]">
                {lang === 'ro' ? 'Mediu Demo Interactiv (Sandbox)' : 'Interactive Demo Environment (Sandbox)'}
              </div>
              <div className="text-[11px] text-[#52667A]">
                {lang === 'ro' 
                  ? 'Date de test fictive din București (Aviației 12B). Zero autentificare necesară. Poți comuta rolul oricând.'
                  : 'Fictional Bucharest demo data. Zero login required. Switch roles anytime inside the app shell.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={resetDemoData}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#B2E5DF] text-xs font-bold text-[#0A6E62] hover:bg-[#D5F2ED] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ro' ? 'Resetează datele demo' : 'Reset demo data'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Alege rolul de testare' : 'Choose Your Demo Persona'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#102A43]">
            {lang === 'ro' ? 'Cum dorești să experimentezi CLADORA?' : 'How do you want to explore CLADORA?'}
          </h1>
          <p className="text-sm text-[#52667A]">
            {lang === 'ro'
              ? 'Fiecare rol beneficiază de o vizualizare optimizată cu permisiuni conforme Legii 196/2018.'
              : 'Each role configures the application layout, charts, and permitted data boundaries.'}
          </p>
        </div>

        {/* 8 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_ROLES.map((role) => (
            <div
              key={role.key}
              className="card-proptech card-proptech-hover p-6 bg-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EAF8F5] text-[#0A6E62]">
                    {role.badge[lang]}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#102A43] mt-4">
                  {role.title[lang]}
                </h3>

                <p className="text-xs text-[#52667A] mt-2 leading-relaxed">
                  {role.description[lang]}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectRole(role.key)}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#102A43] hover:bg-[#0E9F8E] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{lang === 'ro' ? 'Intră ca ' + role.title[lang] : 'Explore as ' + role.title[lang]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

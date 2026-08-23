'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language, UserRole } from '@/types';
import { 
  Building2, 
  Home, 
  KeyRound, 
  FileCheck, 
  Layers, 
  ArrowRight, 
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { DEMO_ROLES } from '@/data/mockData';

interface ProductPreviewProps {
  lang: Language;
}

export const InteractiveProductPreview: React.FC<ProductPreviewProps> = ({ lang }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('association_admin');

  const roleInfo = DEMO_ROLES.find(r => r.key === selectedRole) || DEMO_ROLES[0];

  return (
    <section className="py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Experiență de Produs Live' : 'Live Product Experience'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' ? 'Interfață Adaptată Fiecărui Rol' : 'An Interface Designed for Every Role'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Selectează un rol pentru a vedea cum arată panoul de control dedicat. În aplicația reală, permisiunile configurează automat vizualizarea.'
              : 'Select a role to preview the purpose-built dashboard layout.'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex justify-center mt-12 mb-8">
          <div className="p-1.5 rounded-2xl bg-[#F6F9FC] border border-[#E2E8F0] flex flex-wrap gap-2 max-w-4xl w-full justify-center">
            
            <button
              type="button"
              onClick={() => setSelectedRole('association_admin')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'association_admin'
                  ? 'bg-[#102A43] text-white shadow-sm'
                  : 'text-[#52667A] hover:bg-white hover:text-[#102A43]'
              }`}
            >
              {lang === 'ro' ? 'Administrator' : 'Administrator'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'owner'
                  ? 'bg-[#0E9F8E] text-white shadow-sm'
                  : 'text-[#52667A] hover:bg-white hover:text-[#102A43]'
              }`}
            >
              {lang === 'ro' ? 'Proprietar' : 'Owner'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('tenant_resident')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'tenant_resident'
                  ? 'bg-[#2F80ED] text-white shadow-sm'
                  : 'text-[#52667A] hover:bg-white hover:text-[#102A43]'
              }`}
            >
              {lang === 'ro' ? 'Chiriaș' : 'Tenant'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('censor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'censor'
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'text-[#52667A] hover:bg-white hover:text-[#102A43]'
              }`}
            >
              {lang === 'ro' ? 'Cenzor / Auditor' : 'Censor / Auditor'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('portfolio_owner')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'portfolio_owner'
                  ? 'bg-[#10B981] text-white shadow-sm'
                  : 'text-[#52667A] hover:bg-white hover:text-[#102A43]'
              }`}
            >
              {lang === 'ro' ? 'Proprietar Portofoliu' : 'Portfolio Owner'}
            </button>

          </div>
        </div>

        {/* Dashboard Preview Shell */}
        <div className="card-proptech p-6 sm:p-10 bg-[#F6F9FC] border-[#D3DCE6]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
                  {roleInfo.badge[lang]}
                </span>
                <span className="text-xs text-[#7B8A9A]">· Mod Sandbox Live</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#102A43] mt-1">
                {roleInfo.title[lang]}
              </h3>
              <p className="text-xs text-[#52667A] mt-1">{roleInfo.description[lang]}</p>
            </div>

            <Link
              href={`/${lang}/demo`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm self-start sm:self-auto"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{lang === 'ro' ? 'Deschide în Demo App' : 'Launch Full Demo App'}</span>
            </Link>
          </div>

          {/* Role-specific widget mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            
            <div className="card-proptech p-5 bg-white space-y-3">
              <span className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wider">Acțiuni Primare</span>
              <div className="space-y-2 text-xs font-bold text-[#102A43]">
                {selectedRole === 'association_admin' && (
                  <>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Închidere Lună Octombrie</span>
                      <span className="text-[#D97706]">În Curs</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Index Contoare Neverificate</span>
                      <span className="text-[#0E9F8E]">4 Rămase</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Plăți Bancare de Reconciliat</span>
                      <span className="text-[#10B981]">12 Noi</span>
                    </div>
                  </>
                )}
                {selectedRole === 'owner' && (
                  <>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Total Listă de Plată</span>
                      <span className="text-[#102A43] tabular-nums">241,77 RON</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Transmitere Contor Apă</span>
                      <span className="text-[#10B981]">✓ Transmis</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Vot Adunare Generală</span>
                      <span className="text-[#0E9F8E]">1 Activ</span>
                    </div>
                  </>
                )}
                {selectedRole === 'tenant_resident' && (
                  <>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Consum Utilizator Octombrie</span>
                      <span className="text-[#102A43] tabular-nums">179,27 RON</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Acces Cheltuieli Fond Rulment</span>
                      <span className="text-[#7B8A9A]">Mascat (Proprietar)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Tichet Mentenanță Deschis</span>
                      <span className="text-[#0E9F8E]">1 În Lucru</span>
                    </div>
                  </>
                )}
                {selectedRole === 'censor' && (
                  <>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Luni Așteptând Validare Audit</span>
                      <span className="text-[#D97706]">Septembrie 2026</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Discrepanțe Balanță</span>
                      <span className="text-[#10B981]">0 Erori</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Documente Sursă Lipsă</span>
                      <span className="text-[#10B981]">0</span>
                    </div>
                  </>
                )}
                {selectedRole === 'portfolio_owner' && (
                  <>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Total Chirii Încasate Luna Curentă</span>
                      <span className="text-[#10B981] tabular-nums">3.180 EUR</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Contracte Expirând în 90 Zile</span>
                      <span className="text-[#D97706]">1 Contract</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F6F9FC] flex justify-between">
                      <span>Randament Mediu Portofoliu</span>
                      <span className="text-[#2F80ED]">6.8% Net</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-3">
              <span className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wider">Securitate & Vizibilitate</span>
              <p className="text-xs text-[#52667A] leading-relaxed">
                {lang === 'ro'
                  ? 'Fiecare utilizator vede doar datele la care are dreptul legal conform rolului. Fără scurgeri de informații între apartamente sau proprietari.'
                  : 'Strict attribute-based permissions enforce clear visibility boundaries tailored to this role.'}
              </p>
              <div className="p-3 rounded-lg bg-[#EAF8F5] text-xs text-[#0A6E62] font-semibold">
                ✓ Izolare automată la nivel de sesiune
              </div>
            </div>

            <div className="card-proptech p-5 bg-white space-y-3">
              <span className="text-xs font-bold text-[#7B8A9A] uppercase tracking-wider">Testare Gratuită</span>
              <p className="text-xs text-[#52667A] leading-relaxed">
                {lang === 'ro'
                  ? 'Poți testa toate aceste fluxuri chiar acum, comutând între roluri cu date de test fictive din București.'
                  : 'Explore all workflows directly in our sandbox environment with zero registration required.'}
              </p>
              <Link
                href={`/${lang}/demo`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#102A43] text-white text-xs font-bold"
              >
                <span>{lang === 'ro' ? 'Intră în Sandbox' : 'Enter Sandbox'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
